// ===== file: layerbase.mjs (continued) =====

  };
  const listed = layersOf(map, id);
  const n = [...listed, ...joinedLayers(root, cfg, id)].find((x) => x !== null && live(x));
  if (n === undefined) return cfg;
  return { ...cfg, tranche: layerBranch(n), layer: { n, tranche: cfg.tranche, ...(!listed.includes(n) ? { joined: true } : {}) } };
}
// The layers a module joined, from the state branch's layerflow/<n>/join/<id>.json rows, lowest first.
function joinedLayers(root, cfg, id) {
  const sb = `refs/remotes/origin/${cfg.state_branch}`;
  const r = git(['ls-tree', '-r', '--name-only', sb, '--', `${FLOW_DIR}/`], { cwd: root, allowFail: true });
  if (r.code !== 0) return [];
  const want = `/join/${safeName(id)}.json`;
  return r.stdout.split('\n').filter((f) => f.endsWith(want)).map((f) => Number(f.split('/')[1])).filter(Number.isInteger).sort((a, b) => a - b);
}
function mergedOnState(root, cfg, n) {
  const sb = cfg.state_branch;
  const f = git(['fetch', '-q', 'origin', `+refs/heads/${sb}:refs/remotes/origin/${sb}`], { cwd: root, allowFail: true });
  if (f.code !== 0) return false;
  return git(['cat-file', '-e', `refs/remotes/origin/${sb}:${flowFile(n, 'merged')}`], { cwd: root, allowFail: true }).code === 0;
}
export const refuseInLayer = (cfg, what) => { if (cfg.layer && !cfg.layer.direct) fail(`${what} is not part of the layer flow (merge_strategy "layer", ${cfg.tranche}): start the job plainly, or ask BOB`); };

// ===== file: merge.test.mjs (later part) =====

  const m = readRows(root, 'alpha').filter((x) => x.event === 'measured').pop();
  assert.deepEqual([m.session, m.session_usd, m.cost_usd], ['session_J', 3.25, 'unmeasured']);
  assert.ok(said.some((l) => /job alpha's cost: unmeasured: --job-cost-usd 3\.25 is not above session session_J's last row \(3\.25\)/.test(l)), said.join('\n'));
  git(['checkout', '-q', 'main'], { cwd: root });
});
test('merge --job-cost-usd with no session on the complete row takes the session of this attempt\'s last measured row, never an earlier attempt\'s', () => {
  const { root } = setup();
  const head = costRows(root, [
    { row: 'attempt', event: 'measured', role: 'job', attempt: 0, session: 'session_J', session_usd: 3.25, cost_usd: 3.25 },
    { row: 'attempt', event: 'measured', role: 'job', attempt: 1, session: 'session_J', session_usd: 3.25, cost_usd: 'unmeasured' },
    { row: 'attempt', event: 'complete', attempt: 1 },
  ]);
  const r = merge(root, 3, { slug: 'o/r', io: io(head).io, reviewed: 'fresh', rounds: 1, reviewMinutes: 5, findings: 0, actedOn: 0, jobCostUsd: '4.04', log: () => {} });
  git(['checkout', '-q', r.tip], { cwd: root });
  const m = readRows(root, 'alpha').filter((x) => x.event === 'measured').pop();
  assert.deepEqual([m.session, m.session_usd, m.cost_usd], ['session_J', 4.04, 0.79]);
  git(['checkout', '-q', 'main'], { cwd: root });
});
test('merge --job-cost-usd takes no session from an earlier attempt: a restart in a new session counts its figure whole', () => {
  const { root } = setup();
  const head = costRows(root, [
    { row: 'attempt', event: 'measured', role: 'job', attempt: 0, session: 'session_J', session_usd: 3.25, cost_usd: 3.25 },
    { row: 'attempt', event: 'complete', attempt: 1 },
  ]);
  const r = merge(root, 3, { slug: 'o/r', io: io(head).io, reviewed: 'fresh', rounds: 1, reviewMinutes: 5, findings: 0, actedOn: 0, jobCostUsd: '2', log: () => {} });
  git(['checkout', '-q', r.tip], { cwd: root });
  const m = readRows(root, 'alpha').filter((x) => x.event === 'measured').pop();
  assert.deepEqual([m.session, m.session_usd, m.cost_usd], [null, 2, 2]);
  git(['checkout', '-q', 'main'], { cwd: root });
});

import { deepenToBase } from '../lib/merge.mjs';
test('deepenToBase never cuts a history fetched deeper (the merge train\'s tranche past main): a head cut from main is mended one commit at a time', () => {
  // origin: main with 12 commits; the tranche 30 past main; job/x cut from main's tip, job/y from the tranche's 5th.
  const src = makeRepo({ 'README.md': 'x' });
  for (let i = 0; i < 11; i += 1) commit(src, { [`m${i}.txt`]: String(i) });
  git(['checkout', '-q', '-b', 'tranche'], { cwd: src });
  for (let i = 0; i < 30; i += 1) { commit(src, { [`t${i}.txt`]: String(i) }); if (i === 4) git(['branch', 'job/y'], { cwd: src }); }
  git(['checkout', '-q', '-b', 'job/x', 'main'], { cwd: src });
  commit(src, { 'x.txt': 'x' });
  git(['checkout', '-q', 'job/y'], { cwd: src });
  commit(src, { 'y.txt': 'y' });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['clone', '-q', '--bare', src, bare], { cwd: tmpdir() });
  const thin = join(mkdtempSync(join(tmpdir(), 'p3-thin-')), 'c');
  git(['clone', '-q', '--depth', '1', '--no-single-branch', '-b', 'main', `file://${bare}`, thin], { cwd: tmpdir() });
  git(['fetch', '-q', '--shallow-exclude=main', 'origin', '+refs/heads/tranche:refs/remotes/origin/tranche', '+refs/heads/job/x:refs/remotes/origin/job/x', '+refs/heads/job/y:refs/remotes/origin/job/y'], { cwd: thin });
  const past = () => Number(git(['rev-list', '--count', 'origin/tranche'], { cwd: thin }));
  assert.equal(past(), 30);
  const count = (a, b) => Number(git(['rev-list', '--count', a, `^${b}`], { cwd: bare }));
  const compare = (slug, base, head) => ({ ahead_by: count(head, base), behind_by: count(base, head), merge_base_commit: { sha: git(['merge-base', base, head], { cwd: bare }) } });
  // job/y's base is in the history past main: read locally, nothing fetched, nothing cut (--depth=26 would have kept 26 of 30).
  deepenToBase(thin, 'o/r', 'tranche', 'job/y', compare);
  assert.equal(past(), 30);
  assert.equal(git(['merge-base', 'origin/tranche', 'origin/job/y'], { cwd: thin }), compare('', 'tranche', 'job/y').merge_base_commit.sha);
  // job/x was cut from main's tip, below the tranche's cut: deepened to it, the tranche's history whole, the clone still shallow.
  assert.equal(git(['merge-base', 'origin/tranche', 'origin/job/x'], { cwd: thin, allowFail: true }).code, 1);
  deepenToBase(thin, 'o/r', 'tranche', 'job/x', compare);
  assert.equal(git(['merge-base', 'origin/tranche', 'origin/job/x'], { cwd: thin }), git(['rev-parse', 'main'], { cwd: src }));
  assert.ok(past() >= 30);
  assert.equal(git(['rev-parse', '--is-shallow-repository'], { cwd: thin }), 'true', 'main\'s older history never fetched');
});

// ===== file: lane-session.test.mjs =====

// One session per lane (Bob, 5 Nov 17:33): the lane's seat on the state branch, held by lane
// start, checked by job start, and a defect
// line in status and the sweep when a lane has more than one live session.
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { jobStart, startText } from '../lib/job.mjs';
import { LANE_SESSIONS_FILE, laneArtifact, laneAsk, laneEnd, laneOfModule, laneSeatFor, laneStart, markLaneHeld, readArtifacts, readSeats, seatsOf } from '../lib/lane.mjs';
import { laneDefects, sessionActs } from '../lib/status.mjs';
import { git, loadConfig } from '../lib/util.mjs';
import { entry, makeRepo } from './helpers.mjs';

const quiet = () => {};
const S1 = 'session_lane1';
const S2 = 'session_lane2';
// A qualified lane's research area (Bob, 6 Nov): its index and a dated qualification record.
const QUAL = { 'design/ux-research/index.md': 'index\n', 'design/ux-research/qualification-2026-11-06.md': 'record\n' };

function withOrigin(files) {
  const root = makeRepo(files);
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: root });
  return { root, bare };
}
const rowsOn = (bare) => git(['show', `process-state:${LANE_SESSIONS_FILE}`], { cwd: bare }).split('\n').filter(Boolean).map((l) => JSON.parse(l));

test('lane start holds one seat per lane: refused while one is live or pending, --record names it, --replace refreshes it, lane end frees it', () => {
  const { root, bare } = withOrigin({ 'process/config.json': { lanes: [{ name: 'ux', dir: 'design/ux' }] }, 'design/ux/README.md': 'x\n' });
  const out = [];
  const r = laneStart(root, 'ux', { slug: 'o/p', log: (m) => out.push(m) });
  assert.equal(r.call.title, 'lane ux');
  assert.equal(r.call.source_revision, 'tranche');
  assert.match(r.prompt, /You are the ux lane's one session in o\/p/);
  assert.match(r.prompt, /Design lanes, run under BOB, own their lane folders\. Within the product's principles you decide design and wording there \(Bob's CLAUDE\.md, 5 Nov\); a pull request that changes only files in your own lane's folder lands through the merge tool without a test suite run/);
  assert.match(r.prompt, /claude\.ai artifacts and documents, never repository files/);
  assert.match(r.prompt, /- none recorded yet/);
  assert.match(r.prompt, /`design\/ux\/` holds only what the product's build reads.*One changing only `design\/ux\/` takes the gate's records-only path/);
  assert.ok(Buffer.byteLength(r.prompt) <= 4096);
  assert.match(out.join('\n'), /then: .* lane start ux --record <the new session id>/);
  // The seat is written before the create_session call is printed: a second start is refused at once.
  assert.deepEqual(rowsOn(bare).map((x) => x.row), ['start']);
  assert.throws(() => laneStart(root, 'ux', { slug: 'o/p', log: quiet }), /lane ux's session pending since .* is live .*one session per lane at a time; .*--replace pending/);
  laneStart(root, 'ux', { record: S1, log: quiet });
  assert.equal(readSeats(root, loadConfig(root)).get('ux').session, S1);
  assert.throws(() => laneStart(root, 'ux', { record: S2, log: quiet }), /lane ux is session_lane1 .*one session per lane; nothing recorded/);
  assert.throws(() => laneStart(root, 'ux', { slug: 'o/p', log: quiet }), /session_lane1 is live/);
  assert.throws(() => laneStart(root, 'ux', { replace: S2, slug: 'o/p', log: quiet }), /--replace names lane ux's live session, session_lane1; not "session_lane2"/);
  // The refresh: the successor's seat replaces the old one, which BOB archives once it is idle.
  const rep = [];
  const r2 = laneStart(root, 'ux', { replace: S1, slug: 'o/p', log: (m) => rep.push(m) });
  assert.equal(r2.replaces, S1);
  assert.match(r2.prompt, /You replace `session_lane1`/);
  assert.match(rep.join('\n'), /archive_session session_lane1/);
  laneStart(root, 'ux', { record: S2, log: quiet });
  assert.equal(readSeats(root, loadConfig(root)).get('ux').session, S2);
  assert.throws(() => laneEnd(root, 'ux', { session: S1, why: 'done', log: quiet }), /--session names lane ux's live session, session_lane2/);
  assert.throws(() => laneEnd(root, 'ux', { session: S2, log: quiet }), /--why/);
  laneEnd(root, 'ux', { session: S2, why: 'backlog done', log: quiet });
  assert.equal(readSeats(root, loadConfig(root)).get('ux'), undefined);
  assert.throws(() => laneEnd(root, 'ux', { session: S2, why: 'again', log: quiet }), /no live session/);
  assert.equal(laneStart(root, 'ux', { slug: 'o/p', log: quiet }).replaces, null);
});

test('seatsOf: an end frees only the seat it names; a record fills only a pending seat', () => {
  const s = seatsOf([
    { row: 'start', lane: 'ux', at: 't1' }, { row: 'record', lane: 'ux', session: S1 }, { row: 'record', lane: 'ux', session: S2 },
    { row: 'start', lane: 'ai', at: 't2' }, { row: 'end', lane: 'ai', session: S1 },
  ]);
  assert.equal(s.get('ux').session, S1);
  assert.equal(s.get('ai').session, null);
  assert.equal(seatsOf([{ row: 'start', lane: 'ai', at: 't' }, { row: 'end', lane: 'ai', session: null }]).size, 0);
});

test('a lane with a module: the lane\'s session and the module\'s job are one seat; job start refuses beside the seat, lane start beside the job', () => {
