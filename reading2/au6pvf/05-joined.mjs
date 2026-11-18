// ===== file: measures.mjs (continued) =====

    const onMain = main && out(root, ['merge-base', '--is-ancestor', m, main]) !== null;
    const mm = onMain ? standsOn(root, m, main) : null;
    prs.push({ module: r.module, pr, merged_at: r.at, merge: m.slice(0, 10), tranche: t ? `undone: ${t}` : 'stands', main: !main ? 'unmeasured: main not read' : onMain ? (mm ? `undone: ${mm}` : 'stands') : 'not merged there', survived: !t && !mm });
  }
  const surviving = prs.filter((p) => p.survived === true).length;
  const o = overhead(rows.filter((r) => Date.parse(r.at) <= cutoff));
  const num = (v) => (typeof v === 'number' ? v : 0);
  const cost = o.jobs.reduce((s, j) => s + num(j.job_usd) + num(j.overhead_usd), 0) + num(o.unattributed_usd);
  const unmeasured = [...new Set([...o.jobs.flatMap((j) => [...(typeof j.job_usd === 'number' ? [] : [`${j.module} job`]), ...j.unmeasured.map((u) => `${j.module} ${u}`)]), ...(o.unattributed_usd === 'unmeasured' ? ['BOB and ROOT (no priced row)'] : [])])];
  return {
    days: d, cutoff: new Date(cutoff).toISOString(), rule: SURVIVAL_RULE, cost_rule: SURVIVAL_COST_RULE,
    measured: prs.length, surviving, pending_younger: pending, prs,
    cost_usd: Math.round(cost * 1e4) / 1e4,
    cost_per_surviving_pr: surviving ? Math.round(cost / surviving * 1e4) / 1e4 : 'unmeasured: no surviving pull request',
    unmeasured_cost: unmeasured,
  };
}

// Survival reads whole history: fetch the tranche and main, --unshallow in a shallow clone.
export function wholeHistory(root, tranche) {
  for (const b of [tranche, 'main']) {
    const shallow = out(root, ['rev-parse', '--is-shallow-repository']) === 'true';
    git(['fetch', '-q', ...(shallow ? ['--unshallow'] : []), 'origin', `+refs/heads/${b}:refs/remotes/origin/${b}`], { cwd: root, allowFail: true });
  }
}

// bob wake --stateless: the create_session call of a fresh BOB for one wake, whose prompt is the
// reading set (reading_bob) and status --role bob as it reads now, with its size. Writes nothing.
export function statelessWake(root, { slug, live, context, offline = false, tip, log = console.log } = {}) {
  const cfg = loadConfig(root);
  const rev = tip || (offline ? out(root, ['rev-parse', 'HEAD']) : tipApprovals(root, cfg).tip);
  const lines = [];
  status(root, { role: 'bob', live, context, offline, log: (l) => lines.push(l) });
  const rootId = readAddress(root, { fetch: false }).root?.session || 'none addressed';
  // The reading set as the call's own revision holds it, not the working tree.
  const files = cfg.reading_bob.map((f) => `## ${f}\n\n${(out(root, ['show', `${rev}:${f}`]) ?? '(missing)').trimEnd()}`);
  const prompt = [
    '# BOB, one stateless wake', '',
    `You are BOB for ${slug} for this one wake: a fresh session that remembers no earlier wake. Your coordinator is ROOT, session \`${rootId}\`. Below are your reading set and \`${P3} status --role bob\` as it read at ${now()}. Act on it, each judged act its own command, leave in the record what the next wake needs, and end.`, '',
    rulebookLine('bob'), '', ...files.flatMap((f) => [f, '']), '## status --role bob', '', ...lines, '',
  ].join('\n');
  const model = cfg.roles?.bob?.model;
  const call = { title: 'BOB (stateless wake)', source_url: `https://github.com/${slug}`, source_revision: rev, ...(cfg.clone || {}), ...(model ? { model } : {}), prompt };
  const bytes = Buffer.byteLength(prompt);
  log(prompt);
  log(`prompt: ${bytes} bytes`);
  log(`create_session, printed only (nothing was written):\n${JSON.stringify(call, null, 2)}`);
  log(`after the wake ends: ${P3} metrics wake --session <its id> --tokens <n> --usd <x> --mode stateless`);
  return { prompt, call, bytes };
}

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
  const { root } = withOrigin({ 'process/config.json': { lanes: [{ name: 'ux', dir: 'design/ux', module: 'alpha' }] }, 'process/ledger/alpha.json': entry('alpha'), 'req/alpha.md': '# alpha\n', 'design/ux/a.md': 'a\n' });
  assert.equal(laneOfModule(loadConfig(root), 'alpha').name, 'ux');
  assert.equal(laneOfModule(loadConfig(root), 'beta'), null);
  assert.equal(laneOfModule({ lanes: [{ dir: 'x' }] }, 'alpha'), null);
  // The module's job at work: it is the lane's one session, so lane start refuses.
  assert.throws(() => laneStart(root, 'ux', { slug: 'o/p', log: quiet, jobOpen: () => ({ branch: 'job/alpha', state: 'WORKING' }) }), /job alpha, lane ux's module, is WORKING on job\/alpha: it is the lane's one session now.*nothing was started/);
  const r = laneStart(root, 'ux', { slug: 'o/p', log: quiet, jobOpen: () => false });
  assert.match(r.prompt, /The marks of `alpha`, this lane's module, are your work; no job of it starts while you are live/);
  laneStart(root, 'ux', { record: S1, log: quiet });
  assert.match(laneSeatFor(root, loadConfig(root), 'alpha', { fetch: false }).why, /job alpha is lane ux's module, and lane ux's session session_lane1 is live/);
  assert.equal(laneSeatFor(root, loadConfig(root), 'beta', { fetch: false }), null);
  assert.throws(() => jobStart(root, 'alpha', { coordinator: 'session_bob', push: false, log: quiet }), /job alpha is lane ux's module.*one session per lane.*nothing was started/);
  // A restart replaces the job's own session: one session still, so it is not refused here.
  assert.throws(() => jobStart(root, 'alpha', { coordinator: 'session_bob', restart: 'gone', push: false, log: quiet }), (e) => !/lane ux/.test(e.message));
  laneEnd(root, 'ux', { session: S1, why: 'backlog done', log: quiet });
  assert.equal(laneSeatFor(root, loadConfig(root), 'alpha', { fetch: false }), null);
});

test('lane artifact records a lane\'s design documents\' links for its successor: the START and the ask brief list them', () => {
  const { root } = withOrigin({ 'process/config.json': { lanes: [{ name: 'ux', dir: 'design/ux' }] }, 'design/ux/README.md': 'x\n', ...QUAL });
  assert.throws(() => laneArtifact(root, 'ux', 'not a link', { log: quiet }), /the document's https link/);
  laneArtifact(root, 'ux', 'https://claude.ai/artifact/AAA', { title: 'Design doc', log: quiet });
  laneArtifact(root, 'ux', 'https://claude.ai/artifact/BBB', { log: quiet });
  laneArtifact(root, 'ux', 'https://claude.ai/artifact/BBB', { drop: true, log: quiet });
  assert.throws(() => laneArtifact(root, 'ux', 'https://claude.ai/artifact/CCC', { drop: true, log: quiet }), /records no/);
