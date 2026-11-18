// ===== file: gate.test.mjs (continued) =====

  const head = commit(s.root, { 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/x.test.mjs': realTest });
  const r = gate(s.root, { base: s.base, head, branch: 'job/alpha', pr: 5, slug: 'o/r', io: ioFor(head).io, log: quiet });
  assert.ok(r.findings.some((f) => f.check === 'generated' && /a job does not remove it/.test(f.message)), JSON.stringify(r.findings));
});

// ===== file: status.test.mjs =====

import test from 'node:test';
import assert from 'node:assert/strict';
import { commit, makeRepo, entry, onState, openPassed, setJobCap } from './helpers.mjs';
import { git, loadConfig } from '../lib/util.mjs';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const quiet = () => {};
import { layerState, status } from '../lib/status.mjs';

const unmet = (n) => Array.from({ length: n }, (_, i) => `- **R${i + 1}** *(not yet met: x)* text`).join('\n') + '\n- **R99** met\n';

test('status --role bob lists next work: unmet requirement files with no open job, fewest first', () => {
  const root = makeRepo({
    'build/requirements/README.md': unmet(1),
    'build/requirements/big.md': unmet(5),
    'build/requirements/small.md': unmet(2),
    'build/requirements/done.md': unmet(0),
    'build/requirements/busy.md': unmet(1),
    'process/ledger/busy.json': entry('busy', { requirements: 'build/requirements/busy.md' }),
  });
  openPassed(root);
  const out = [];
  const r = status(root, { role: 'bob', offline: true, log: (m) => out.push(m) });
  assert.deepEqual(r.next.map((x) => [x.file, x.count]), [['build/requirements/small.md', 2], ['build/requirements/big.md', 5]]);
  assert.match(out.join('\n'), /next work \(1 jobs open; BOB chooses from these, unmet requirements each\): all 2 listed; pass --sessions <file>/);
});

const LAYERS = '# Layers\n\n| layer | what | modules |\n|---|---|---|\n| 0 | base | `done0` |\n| 1 | first | a, b, c, busy |\n| 2 | next | d |\n';

test('status --role bob: next work only from the open layer, at most the job cap less the job sessions', (t) => {
  setJobCap(t, 5);
  const files = {
    'build/layers.md': LAYERS,
    'build/requirements/done0.md': unmet(0),
    'build/requirements/a.md': unmet(3),
    'build/requirements/b.md': unmet(1),
    'build/requirements/c.md': unmet(0),
    'build/requirements/busy.md': unmet(1),
    'build/requirements/d.md': unmet(1),
    'build/requirements/loose.md': unmet(1),
    'process/ledger/busy.json': entry('busy', { requirements: 'build/requirements/busy.md' }),
  };
  const root = makeRepo(files);
  openPassed(root);
  const out = [];
  const r = status(root, { role: 'bob', offline: true, live: 3, log: (m) => out.push(m) });
  assert.deepEqual(r.next.map((x) => x.file), ['build/requirements/b.md', 'build/requirements/a.md']);
  assert.match(out.join('\n'), /next work, layer 1 .*: 2 listed \(jobs 3 of 5\), 0 wait/);
  assert.ok(out.includes('job cap 5 (P3_JOB_CAP): 3 job sessions live'), 'status prints the cap in force and its source');
  const four = [];
  status(root, { role: 'bob', offline: true, live: 4, log: (m) => four.push(m) });
  assert.match(four.join('\n'), /1 listed \(jobs 4 of 5\), 1 wait\n- build\/requirements\/b.md: 1 \(layer 1\)\nflow: live 4\/5 \(P3_JOB_CAP\), startable 0, blocked 0$/);
  // Layer 1 stays open while busy's job is open, though no file in it is unmet but busy's.
  const held = makeRepo({ ...files, 'build/requirements/a.md': unmet(0), 'build/requirements/b.md': unmet(0) });
  openPassed(held);
  assert.deepEqual(status(held, { role: 'bob', offline: true, log: quiet }).next, []);
  // Its job complete and its marks gone, layer 1 owes its close (work merged in this tranche);
  // once that job is on main, layer 1 closes implicitly and layer 2 opens.
  const closed = makeRepo({ ...files, 'build/requirements/a.md': unmet(0), 'build/requirements/b.md': unmet(0), 'build/requirements/busy.md': unmet(0), 'process/ledger/busy.json': entry('busy', { requirements: 'build/requirements/busy.md', status: { state: 'COMPLETE' } }) });
  openPassed(closed);
  const owes = [];
  assert.deepEqual(status(closed, { role: 'bob', offline: true, log: (m) => owes.push(m) }).next, []);
  assert.doesNotMatch(owes.join('\n'), /ready to close|layer close/);
  git(['update-ref', 'refs/remotes/origin/main', 'HEAD'], { cwd: closed });
  assert.deepEqual(status(closed, { role: 'bob', offline: true, log: quiet }).next.map((x) => x.file), ['build/requirements/d.md']);
  assert.throws(() => status(root, { role: 'bob', offline: true, live: 'x', log: quiet }), /--live/);
});

test('status --role bob: a paused or stopped plan says take no new step first and lists no next work', () => {
  const root = makeRepo({ 'process/config.json': { plan: 'stop' }, 'build/requirements/m.md': unmet(1) });
  const out = [];
  assert.deepEqual(status(root, { role: 'bob', offline: true, log: (m) => out.push(m) }).next, []);
  assert.equal(out[0], 'plan stop: take no new step');
  assert.doesNotMatch(out.join('\n'), /next work/);
});

test('status --role bob: a job\'s report to bob is listed until a later message from bob names its id', () => {
  const root = makeRepo({ 'README.md': 'x' });
  const msgs = (rows) => rows.map((r) => JSON.stringify({ row: 'sent', ...r })).join('\n') + '\n';
  const state = (files) => {
    git(['checkout', '-q', '--orphan', 's'], { cwd: root });
    git(['rm', '-rqf', '.'], { cwd: root });
    commit(root, files);
    git(['update-ref', 'refs/remotes/origin/process-state', 'HEAD'], { cwd: root });
    git(['checkout', '-q', 'main'], { cwd: root });
    git(['branch', '-D', 's'], { cwd: root });
  };
  state({
    'messages/job-m1.jsonl': msgs([{ at: '2026-11-03T10:00:00Z', n: 1, to: 'bob', text: 'done' }, { at: '2026-11-03T11:00:00Z', n: 2, to: 'bob', text: 'blocked' }, { at: '2026-11-03T11:10:00Z', n: 3, to: 'bob', text: 'job m1 BLOCKED: run status' }, { at: new Date(Date.now() - 5 * 6e4).toISOString(), n: 4, to: 'bob', text: 'which name?' }]),
    'messages/root.jsonl': msgs([{ at: '2026-11-03T10:00:00Z', n: 1, to: 'bob', text: 'Sweep' }]),
    'messages/bob.jsonl': msgs([{ at: '2026-11-03T10:30:00Z', n: 1, to: 'root', text: 'routed job-m1-1 and job-m1-20' }]),
  });
  const out = [];
  status(root, { role: 'bob', offline: true, log: (m) => out.push(m) });
  const text = out.join('\n');
  assert.match(text, /reports to route[^\n]*\n- job-m1-2: blocked/);
  assert.doesNotMatch(text.split('reports to route')[1], /job-m1-3/, 'a wake asks BOB to run status; it routes nothing');
  // Bob, 4 Nov: a report unanswered past decision_minutes (30) is listed, ahead of next work; a
  // fresh one is not.
  assert.match(text, /\nunanswered job-m1-2 \d+m \(target 30\)\n/);
  assert.doesNotMatch(text, /unanswered job-m1-4/);
  assert.ok(text.indexOf('unanswered job-m1-2') < (text.indexOf('next work') === -1 ? Infinity : text.indexOf('next work')));
  assert.doesNotMatch(text, /job-m1-1:|root-1:/);
});

test('status --role bob: next work stops at the job cap', (t) => {
  setJobCap(t, 1);
  const full = makeRepo({
    'build/requirements/small.md': unmet(2),
    'process/ledger/busy.json': entry('busy'),
  });
  openPassed(full);
  const shown = [];
  assert.equal(status(full, { role: 'bob', offline: true, live: 1, log: (m) => shown.push(m) }).next.length, 1);
  assert.match(shown.join('\n'), /0 listed \(jobs 1 of 1\), 1 wait/);
});

// A job branch two commits past the tranche, its tip committed at `at`, the entry WORKING on it.
function pushedJob(root, id, at) {
  git(['checkout', '-q', '-b', `job/${id}`, 'origin/tranche'], { cwd: root });
  commit(root, { [`src/${id}/a.js`]: '1' }, 'start');
  const old = process.env.GIT_COMMITTER_DATE;
  process.env.GIT_COMMITTER_DATE = at;
  try { commit(root, { [`src/${id}/a.js`]: '2' }, 'work in progress'); } finally { if (old === undefined) delete process.env.GIT_COMMITTER_DATE; else process.env.GIT_COMMITTER_DATE = old; }
  git(['update-ref', `refs/remotes/origin/job/${id}`, 'HEAD'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
}

test('status: a WORKING job that pushed and then went quiet past SILENT_HOURS is flagged with the restart as BOB\'s act; a fresh one is not', () => {
  const root = makeRepo({ 'process/ledger/stale.json': entry('stale', { status: { state: 'WORKING' } }), 'process/ledger/fresh.json': entry('fresh', { status: { state: 'WORKING' } }) });
  git(['update-ref', 'refs/remotes/origin/tranche', 'HEAD'], { cwd: root });
  pushedJob(root, 'stale', new Date(Date.now() - 5 * 36e5).toISOString());
  pushedJob(root, 'fresh', new Date().toISOString());
  const { rows } = status(root, { offline: true, log: quiet });
  const by = Object.fromEntries(rows.map((r) => [r.id, r]));
  assert.equal(by.stale.ahead, 2);
  assert.match(by.stale.flag, /^WORKING, no push for 5h; BOB's act: node \.process\/tool\/p3\.mjs job start stale --restart "<why>"$/);
  assert.equal(by.fresh.flag, undefined);
  const out = [];
  status(root, { role: 'bob', offline: true, log: (m) => out.push(m) });
  assert.match(out.join('\n'), /idle:\n- stale: WORKING;.*; WORKING, no push for 5h; BOB's act: .* job start stale --restart "<why>"\nopen:\n- fresh: WORKING; PR unknown \(GitHub not read\), last activity unknown\n/);
});

// Copy, 4 Nov: file-safety was flagged "WORKING, nothing pushed" 7 minutes after its start commit,
// while the flag for a job that pushed and went quiet waits SILENT_HOURS. Both wait now.
test('status: a WORKING job with only its start commit is flagged nothing pushed past SILENT_HOURS, not when fresh', () => {
  const root = makeRepo({ 'process/ledger/old.json': entry('old', { status: { state: 'WORKING' } }), 'process/ledger/new.json': entry('new', { status: { state: 'WORKING' } }) });
  git(['update-ref', 'refs/remotes/origin/tranche', 'HEAD'], { cwd: root });
  for (const [id, at] of [['old', new Date(Date.now() - 5 * 36e5).toISOString()], ['new', new Date().toISOString()]]) {
    git(['checkout', '-q', '-b', `job/${id}`, 'origin/tranche'], { cwd: root });
    const old = process.env.GIT_COMMITTER_DATE;
    process.env.GIT_COMMITTER_DATE = at;
    try { commit(root, { [`src/${id}/a.js`]: '1' }, 'job start'); } finally { if (old === undefined) delete process.env.GIT_COMMITTER_DATE; else process.env.GIT_COMMITTER_DATE = old; }
    git(['update-ref', `refs/remotes/origin/job/${id}`, 'HEAD'], { cwd: root });
    git(['checkout', '-q', 'main'], { cwd: root });
  }
  const by = Object.fromEntries(status(root, { offline: true, log: quiet }).rows.map((r) => [r.id, r]));
  assert.deepEqual([by.old.ahead, by.old.flag], [1, 'WORKING, nothing pushed']);
  assert.deepEqual([by.new.ahead, by.new.flag], [1, undefined]);
});

// Review of PR 114: a restarted COMPLETE module, its fresh start commit unflagged and GitHub unread, is not merged.
test('layerState: a COMPLETE module with a fresh WORKING start ahead on its branch is not counted merged', () => {
  const root = makeRepo({ 'build/layers.md': '| 1 | a |\n', 'build/requirements/a.md': '# a\n' });
  const row = (ahead) => [{ id: 'a', tranche: 'COMPLETE', branch: 'WORKING', ahead, pr: 'unknown (GitHub not read)' }];
  const merged = (ahead) => layerState(root, loadConfig(root), row(ahead), null, { closed: [] }).layers[0].mods[0].merged;
  assert.deepEqual([merged(1), merged(0)], [false, true]);
});

// --sessions (measured 3-4 Nov: a stopped job was flagged only after two hours with no push): BOB's
// own list_sessions JSON; a job whose session is archived, or idle with no push for
// targets.replace_minutes, is flagged with the restart; a running one, or none given, is not.
test('status --role bob --sessions: job session gone and job idle 30m are flagged with the restart; without --sessions the two-hour rule stands', () => {
  const ids = ['gone', 'quiet', 'busy', 'fresh', 'unlisted'];
  const root = makeRepo(Object.fromEntries(ids.map((id) => [`process/ledger/${id}.json`, entry(id, { status: { state: 'WORKING' } })])));
  git(['update-ref', 'refs/remotes/origin/tranche', 'HEAD'], { cwd: root });
  const ago = (m) => new Date(Date.now() - m * 6e4).toISOString();
  for (const id of ['gone', 'quiet', 'busy', 'unlisted']) pushedJob(root, id, ago(45));
  pushedJob(root, 'fresh', ago(5));
  const prs = ids.map((id, i) => ({ number: 10 + i, head: { ref: `job/${id}`, sha: 'x' }, draft: true, updated_at: ago(45) }));
  const file = join(mkdtempSync(join(tmpdir(), 'p3-sessions-')), 'sessions.json');
  writeFileSync(file, JSON.stringify({ data: [
    { id: 'session_old', title: 'job gone', session_status: 'SESSION_STATUS_IDLE', status_bucket: 'completed', updated_at: ago(300) },
    { id: 'session_g', title: 'job gone (restart)', session_status: 'SESSION_STATUS_ARCHIVED', status_bucket: 'completed', updated_at: ago(60) },
    { id: 'session_q', title: 'job quiet', session_status: 'SESSION_STATUS_IDLE', status_bucket: 'review_ready', updated_at: ago(90) },
    { id: 'session_b', title: 'job busy', session_status: 'SESSION_STATUS_RUNNING', status_bucket: 'working', updated_at: ago(90) },
    { id: 'session_f', title: 'job fresh', session_status: 'SESSION_STATUS_IDLE', status_bucket: 'completed', updated_at: ago(90) },
  ] }));
  const io = { openPRs: () => prs, checkRun: () => null, compare: () => null, prFiles: () => [] };
  const env = process.env.GITHUB_REPOSITORY;
  process.env.GITHUB_REPOSITORY = 'o/r';
  try {
    const out = [];
    const r = status(root, { role: 'bob', sessions: file, log: (m) => out.push(m), io });
    const by = Object.fromEntries(r.rows.map((x) => [x.id, x.flag]));
    assert.equal(by.gone, 'job session gone (session_g archived); BOB\'s act: node .process/tool/p3.mjs job start gone --restart "<why>"');
    assert.match(by.quiet, /^job idle 30m \(session_q idle, no push for 4[56]m\); BOB's act: node \.process\/tool\/p3\.mjs job start quiet --restart "<why>"$/);
    assert.equal(by.busy, undefined, 'a running session is not flagged');
    assert.equal(by.fresh, undefined, 'an idle session that pushed 5 minutes ago is not flagged');
    assert.equal(by.unlisted, undefined, 'no session listed: the two-hour rule, not yet reached');
    assert.match(out.join('\n'), /owed:\n(- .*\n)*- gone: WORKING; PR #10 draft.*job session gone/);
    const late = status(root, { role: 'bob', log: quiet, io, sessions: undefined });
    assert.ok(late.rows.every((x) => x.flag === undefined), 'without --sessions, nothing at 45 minutes');
  } finally { if (env === undefined) delete process.env.GITHUB_REPOSITORY; else process.env.GITHUB_REPOSITORY = env; }
});

test('status --sessions: replace_minutes from targets in config; an unreadable file is refused', () => {
  const root = makeRepo({ 'process/config.json': { targets: { replace_minutes: 60 } }, 'process/ledger/quiet.json': entry('quiet', { status: { state: 'WORKING' } }) });
  git(['update-ref', 'refs/remotes/origin/tranche', 'HEAD'], { cwd: root });
  pushedJob(root, 'quiet', new Date(Date.now() - 45 * 6e4).toISOString());
  const file = join(mkdtempSync(join(tmpdir(), 'p3-sessions-')), 's.json');
  writeFileSync(file, JSON.stringify([{ id: 'session_q', title: 'job quiet', session_status: 'SESSION_STATUS_IDLE' }]));
  const io = { openPRs: () => [{ number: 3, head: { ref: 'job/quiet', sha: 'x' }, draft: true }], checkRun: () => null, compare: () => null, prFiles: () => [] };
  const env = process.env.GITHUB_REPOSITORY;
  process.env.GITHUB_REPOSITORY = 'o/r';
  try {
    assert.equal(status(root, { sessions: file, log: quiet, io }).rows[0].flag, undefined, '45 minutes is under a replace_minutes of 60');
    writeFileSync(file, 'not json');
    assert.throws(() => status(root, { sessions: file, log: quiet, io }), /--sessions .*not a readable JSON file/);
  } finally { if (env === undefined) delete process.env.GITHUB_REPOSITORY; else process.env.GITHUB_REPOSITORY = env; }
});

test('status --role bob: a requirement file over requirements_cap is a split owed, not startable work (REQ-6)', () => {
  const root = makeRepo({
    'build/requirements/small.md': unmet(1),
    'build/requirements/big.md': unmet(2) + 'x'.repeat(400),
    'build/requirements/many.md': unmet(4),
    'process/config.json': { requirements_cap: 300, requirements_cap_marks: 3 },
  });
  openPassed(root);
  const out = [];
  const r = status(root, { role: 'bob', offline: true, log: (m) => out.push(m) });
  const text = out.join('\n');
  const big = Buffer.byteLength(unmet(2) + 'x'.repeat(400));
  assert.match(text, new RegExp(`split or consolidate before its job: build/requirements/big.md ${big} over 300`));
  assert.match(text, /split or consolidate before its job: build\/requirements\/many.md 4 unmet marks over 3/);
  assert.match(text, /all 1 listed.*\n- build\/requirements\/small.md: 1\nflow: [^\n]*startable 0, blocked 0$/);
  assert.doesNotMatch(text, /- build\/requirements\/(big|many).md/);
  // Still returned, marked: a split owed is work for BOB.
  assert.deepEqual(r.next.map((x) => [x.file, !!x.over]), [['build/requirements/small.md', false], ['build/requirements/big.md', true], ['build/requirements/many.md', true]]);
});

// The copy, 4 Nov: layer 2 closed with no `layer close` row and status said nothing of it.
test('status --role bob: a layer closed with no unmet marks and no close row says so, one line per layer; a recorded close does not', () => {
  const root = makeRepo({
    'build/layers.md': '| layer | what | modules |\n|---|---|---|\n| 0 | base | z |\n| 1 | first | a |\n| 2 | second | b |\n| 3 | third | c |\n',
    'build/requirements/z.md': unmet(1),
    'build/requirements/a.md': unmet(0),
    'build/requirements/b.md': unmet(0),
    'build/requirements/c.md': unmet(1),
  });
  openPassed(root);
  onState(root, { 'layers/closed.jsonl': JSON.stringify({ row: 'closed', layer: 0, tranche: 'tranche', commit: git(['rev-parse', 'HEAD'], { cwd: root }), at: 'x' }) + '\n' });
  const out = [];
  const r = status(root, { role: 'bob', offline: true, log: (m) => out.push(m) });
  const text = out.join('\n');
  assert.match(text, /^layer 1 closed: no unmet marks\nlayer 2 closed: no unmet marks$/m);
  assert.doesNotMatch(text, /layer [03] closed/);
  assert.equal(r.layer.cur.n, 3);
});

// The copy, 4 Nov: twenty files over the cap with no marks were never reported.
test('status --role bob: cap debt counts every requirement file over the cap from the open layer on, marks or none, in one line', () => {
  const pad = 'x'.repeat(400);
  const root = makeRepo({
    'build/layers.md': '| layer | what | modules |\n|---|---|---|\n| 1 | first | old |\n| 2 | second | a, b |\n| 3 | third | c, d |\n',
    'build/requirements/old.md': unmet(0) + pad,
    'build/requirements/a.md': unmet(1) + pad,
    'build/requirements/b.md': unmet(1),
    'build/requirements/c.md': unmet(0) + pad,
    'build/requirements/d.md': unmet(2),
    'process/config.json': { requirements_cap: 300 },
  });
  openPassed(root);
  const out = [];
  status(root, { role: 'bob', offline: true, log: (m) => out.push(m) });
  const text = out.join('\n');
  const bytes = Buffer.byteLength(unmet(1) + pad) + Buffer.byteLength(unmet(0) + pad);
  assert.match(text, new RegExp(`^cap debt: 2 requirement files over the cap from layer 2 on, ${bytes} bytes; each is split or consolidated before its job$`, 'm'));
  assert.match(text, /^split or consolidate before its job: build\/requirements\/a.md \d+ over 300$/m);
  assert.doesNotMatch(text, /split or consolidate before its job: build\/requirements\/c.md/);
  assert.match(text, /next work, layer 2 .*\n- build\/requirements\/b.md: 1 \(layer 2\)\nflow: [^\n]*startable 0, blocked 0$/);
});

// ===== file: lane-gate.test.mjs =====

// Lanes' file changes are not tested the way a job's are (Bob, 5 Nov): a pull request changing only
// one lane's folder (and records) takes the gate's records-only path; lane-folder paths count as
// records when the gate asks whether a job's head changed since its green run, and in the tranche's
// cover; a change to any other file is judged as today.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { gate as gateRun, gateComment, trancheCover } from '../lib/gate.mjs';
import { BOT, GATE, block, parseBlock } from '../lib/github.mjs';
import { git, isRecordOrLane, laneDirs, laneOfPath, laneOnly, loadConfig } from '../lib/util.mjs';
import { commit, entry, makeRepo } from './helpers.mjs';

const gate = (root, o) => { const r = gateRun(root, o); if (o.pr) o.io.addComment(o.slug, o.pr, gateComment(r.run)); return r; };
const quiet = () => {};
const realTest = "import test from 'node:test'; import a from 'node:assert'; import { x } from '../../src/alpha/index.mjs';\ntest('x is 2', () => a.equal(x, 2));\n";
const LANES = [{ name: 'ux', dir: 'design/ux', module: 'ux-design' }, { name: 'ai', dir: 'design/ai' }];

function setup({ cfg = {}, alpha = {} } = {}) {
  const root = makeRepo({
    'process/config.json': { lanes: LANES, ...cfg },
    'process/ledger/alpha.json': entry('alpha', { status: { state: 'WORKING' }, ...alpha }),
    'src/alpha/index.mjs': 'export const x = 1;\n',
    'test/alpha/old.test.mjs': "import test from 'node:test'; test('nothing', () => {});\n",
    'design/ux/words.json': '{}\n', 'design/ai/notes.md': 'a\n',
  });
  git(['branch', 'tranche'], { cwd: root });
  return { root, base: git(['rev-parse', 'HEAD'], { cwd: root }) };
}
function fakeIO() {
  const state = { comments: [], genuine: new Set() };
  const key = (r) => `${r.at}|${r.sha}|${r.trigger}`;
  return { state, io: {
    comments: () => state.comments, getPR: () => ({ user: { login: 'acmewidget' } }),
    addComment: (s, n, body) => { state.comments.push({ id: state.comments.length + 1, body, user: { login: BOT } }); for (const r of parseBlock(body, GATE)?.runs || []) state.genuine.add(key(r)); return {}; },
    verify: (s, r) => state.genuine.has(key(r)),
  } };
}
const onBranch = (s, branch, files) => { git(['checkout', '-q', '-b', branch], { cwd: s.root }); return commit(s.root, files); };
const run = (s, head, branch, io = fakeIO()) => gate(s.root, { base: s.base, head, branch, pr: 7, slug: 'o/r', io: io.io, log: quiet });

test('a pull request inside one lane\'s folder takes the records-only path: no suite, no install, no build', () => {
  const s = setup();
  const head = onBranch(s, 'lane/ux', { 'design/ux/words.json': '{"a":1}\n', 'design/ux/gen.mjs': 'x\n' });
  const r = run(s, head, 'lane/ux');
  assert.deepEqual([r.run.trigger, r.run.suite, r.run.lane, r.findings.length], ['record', 'skipped', 'ux', 0]);
  assert.equal(r.run.scope, undefined);
});

test('a lane pull request touching any file outside its folder is judged as today, the module\'s suite run', () => {
  const s = setup();
  const head = onBranch(s, 'lane/ux', { 'design/ux/words.json': '{"a":2}\n', 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/x.test.mjs': realTest });
  const r = run(s, head, 'lane/ux');
  assert.equal(r.run.trigger, 'code');
  assert.deepEqual(r.run.scope, ['alpha']);
  assert.equal(r.run.lane, undefined);
  // Two lanes' folders in one pull request: no one lane's, so not the lane path either.
  const t = setup();
  const h2 = onBranch(t, 'lane/ux', { 'design/ux/words.json': '{"b":1}\n', 'design/ai/notes.md': 'b\n' });
  const r2 = run(t, h2, 'lane/ux');
  assert.equal(r2.run.trigger, 'code');
  assert.equal(r2.run.lane, undefined);
});

test('a lane folder file another module owns is that module\'s: its change runs that module\'s suite', () => {
  const s = setup({ alpha: { paths: ['src/alpha/', 'design/ux/alpha-words.json'] } });
  const head = onBranch(s, 'lane/ux', { 'design/ux/alpha-words.json': '{}\n' });
  const r = run(s, head, 'lane/ux');
  assert.equal(r.run.trigger, 'code');
  assert.deepEqual(r.run.scope, ['alpha']);
});

test('a lane commits no generated output; a job\'s or the tranche\'s pull request never takes the lane path', () => {
  const s = setup({ cfg: { generated: [{ paths: ['design/ux/out/'], regenerate: ['node', 'gen.mjs'], verify: ['node', 'gen.mjs', '--check'] }] } });
  const head = onBranch(s, 'lane/ux', { 'design/ux/out/table.json': '{}\n' });
  const r = run(s, head, 'lane/ux');
  assert.ok(r.findings.some((f) => f.check === 'generated' && /lane ux does not commit it: it is built at layer close, deploy and release/.test(f.message)));
  // A job changing only a lane's folder is a job's change: ownership as today, no lane path.
  const j = setup();
  const h2 = onBranch(j, 'job/alpha', { 'design/ux/words.json': '{"c":1}\n' });
  const r2 = run(j, h2, 'job/alpha');
  assert.equal(r2.run.lane, undefined);
  assert.ok(r2.findings.some((f) => f.check === 'ownership'));
});

test('a lane\'s land after a job\'s green run is a record for the job: record-since-green; any other change is not', () => {
  const s = setup();
  const h1 = onBranch(s, 'job/alpha', { 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/x.test.mjs': realTest });
  const io = fakeIO();
  assert.equal(run(s, h1, 'job/alpha', io).run.trigger, 'code');
  // The tranche brought in a lane's land: lane folder files only.
  const h2 = commit(s.root, { 'design/ux/words.json': '{"d":1}\n', 'design/ai/notes.md': 'd\n' });
  const r2 = run(s, h2, 'job/alpha', io);
  assert.deepEqual([r2.run.trigger, r2.run.after], ['record-since-green', h1]);
  // A non-lane file since the green run: the suite again.
  const h3 = commit(s.root, { 'src/beta/b.mjs': 'b\n' });
  assert.equal(run(s, h3, 'job/alpha', io).run.trigger, 'code');
});

test('the tranche\'s cover asks no suite for a lane\'s folder; the predicates hold only for real lane folders', () => {
  const cfg = { records: ['process/metrics/'], lanes: [...LANES, { name: 'root', dir: '.' }, { name: 'proc', dir: 'process/x' }, { name: 'up', dir: '../x' }] };
  assert.deepEqual(laneDirs(cfg).map((l) => l.name), ['ux', 'ai']);
  const ux = entry('ux-design', { paths: ['design/ux/'] });
  const alpha = entry('alpha', { paths: ['src/alpha/', 'design/ux/a.json'] });
  assert.equal(laneOfPath(cfg, 'design/ux/w.json', [ux, alpha]), 'ux');
  assert.equal(laneOfPath(cfg, 'design/ux/a.json', [ux, alpha]), null);
  assert.equal(laneOfPath(cfg, 'design/uxx/w.json', []), null);
  assert.equal(laneOnly(cfg, ['design/ux/w.json', 'process/metrics/m.jsonl'], [ux]), 'ux');
  assert.equal(laneOnly(cfg, ['process/metrics/m.jsonl'], []), null);
  assert.equal(laneOnly(cfg, ['design/ux/w.json', 'design/ai/n.md'], []), null);
  assert.equal(laneOnly(cfg, ['design/ux/w.json', 'src/x.mjs'], []), null);
  assert.equal(isRecordOrLane(cfg, 'process/config.json', []), false);
  const s = setup();
  const c = trancheCover(s.root, { ...loadConfig(s.root), lanes: LANES }, { head: s.base, mb: s.base, changed: ['design/ux/words.json'], entries: [ux], slug: null, io: {} });
  assert.deepEqual(c.uncovered, []);
});

test('a job\'s own code, any module\'s tests and the files that govern sessions are never lane paths', () => {
  const cfg = { records: ['process/metrics/'], lanes: LANES };
  const ux = entry('ux-design', { paths: ['design/ux/'], tests: ['design/ux/test/'] });
  // The lane's module's own job: its files in the folder are its code, tested as a job's.
  assert.equal(laneOfPath(cfg, 'design/ux/gen.mjs', [ux]), 'ux');
  assert.equal(laneOfPath(cfg, 'design/ux/gen.mjs', [ux], { self: 'ux-design' }), null);
  assert.equal(isRecordOrLane(cfg, 'design/ux/gen.mjs', [ux], { self: 'ux-design' }), false);
  assert.equal(laneOfPath(cfg, 'design/ux/test/gen.test.mjs', [ux]), null);
  for (const f of ['design/ux/CLAUDE.md', 'design/ux/.claude/settings.json', 'design/ux/.github/workflows/x.yml', 'design/ux/.process/x']) assert.equal(laneOfPath(cfg, f, []), null, f);
});

test('a job of the lane\'s module whose own lane-folder code changed since its green run runs its suite again', () => {
  const s = setup({ cfg: { lanes: [{ name: 'ux', dir: 'design/ux', module: 'alpha' }] }, alpha: { paths: ['src/alpha/', 'design/ux/'] } });
  const h1 = onBranch(s, 'job/alpha', { 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/x.test.mjs': realTest });
  const io = fakeIO();
  assert.equal(run(s, h1, 'job/alpha', io).run.trigger, 'code');
  const h2 = commit(s.root, { 'design/ux/words.json': '{"e":1}\n' });
  assert.equal(run(s, h2, 'job/alpha', io).run.trigger, 'code');
});

// Coordinator, 6 Nov: a broken words build landed green on a lane-only pull request (ux lane Q7).
test('a lane\'s declared checks run on its lane-only pull request in place of the suite: red when one fails, green when all pass; a malformed list is a finding', async () => {
  const { lanes } = await import('../lib/lane.mjs');
  const check = (code) => ['node', '-e', `process.exit(require('fs').readFileSync('design/ux/words.json','utf8').includes('broken') ? ${code} : 0)`];
  const cfg = { lanes: [{ name: 'ux', dir: 'design/ux', checks: ['node -e process.exit(0)', check(3)] }, { name: 'ai', dir: 'design/ai' }] };
  assert.deepEqual(lanes(cfg)[0].checks, [['node', '-e', 'process.exit(0)'], check(3)]);
  assert.throws(() => lanes({ lanes: [{ name: 'ux', dir: 'design/ux', checks: 'node x' }] }), /lane ux's checks are a list of commands/);
  const s = setup({ cfg });
  const good = onBranch(s, 'lane/ux', { 'design/ux/words.json': '{"a":1}\n' });
  const g = run(s, good, 'lane/ux');
  assert.deepEqual([g.run.trigger, g.run.suite, g.run.lane, g.findings.length], ['record', 'skipped', 'ux', 0]);
  assert.deepEqual(g.run.lane_checks.map((x) => x.exit), [0, 0]);
  const bad = commit(s.root, { 'design/ux/words.json': '{"broken":true}\n' });
  const b = run(s, bad, 'lane/ux');
  assert.equal(b.run.ok, false);
  assert.deepEqual(b.findings.map((f) => [f.check, f.file]), [['lane-checks', 'design/ux']]);
  assert.match(b.findings[0].message, /^lane ux's check node -e .* failed \(exit 3\)/);
  // The other lane, with no checks, keeps the records-only path with nothing run.
  git(['checkout', '-q', 'main'], { cwd: s.root });
  const ai = onBranch(s, 'lane/ai', { 'design/ai/notes.md': 'b\n' });
  const a = run(s, ai, 'lane/ai');
  assert.deepEqual([a.run.trigger, a.run.lane, a.run.lane_checks, a.findings.length], ['record', 'ai', undefined, 0]);
  // Cold review of PR 203: a lane pull request that edits the config (dropping its own checks, say)
  // is not lane-only; and a pull request touching the lane's folder and any other file runs its checks too.
  git(['checkout', '-q', 'main'], { cwd: s.root });
  const drop = onBranch(s, 'lane/ux-2', { 'design/ux/words.json': '{"broken":true}\n', 'process/config.json': { lanes: [{ name: 'ux', dir: 'design/ux' }, { name: 'ai', dir: 'design/ai' }] } });
  const d = run(s, drop, 'lane/ux-2');
  assert.equal(d.run.lane, undefined, 'not lane-only');
  assert.equal(d.run.ok, false, 'the base\'s checks still run on the lane\'s folder');
  assert.ok(d.findings.some((f) => f.check === 'lane-checks'));
  git(['checkout', '-q', 'main'], { cwd: s.root });
  const mixed = onBranch(s, 'plain/x', { 'design/ux/words.json': '{"broken":true}\n', 'notes.md': 'x\n' });
  const m = run(s, mixed, 'plain/x');
  assert.deepEqual([m.run.lane, m.run.ok, m.run.lane_checks.map((x) => [x.lane, x.exit])], [undefined, false, [['ux', 0], ['ux', 3]]]);
});

test('a lane check is words as a shell would split them, quotes kept whole; an open quote is refused', async () => {
  const { laneChecks } = await import('../lib/util.mjs');
  assert.deepEqual(laneChecks({ lanes: [{ name: 'ux', checks: ['node -e "process.exit(0)"', "node tools/build_words.mjs --check 'a b'"] }] }, 'ux'), [['node', '-e', 'process.exit(0)'], ['node', 'tools/build_words.mjs', '--check', 'a b']]);
  assert.equal(laneChecks({ lanes: [{ name: 'ux', checks: ['node -e "x'] }] }, 'ux'), null);
});

// PD-9 (cold review of C31): a lane-only pull request builds the generated rows its checks need;
// each built row is verified too, so a lane change that breaks a built file's checker is red at its
// own pull request, not at the layer close.
test('PD-9: a lane-only pull request verifies the generated rows it builds; a failing verify is red', () => {
  const gen = (exit) => ({ paths: ['design/ux/built.json'], regenerate: ['node', '-e', "require('fs').writeFileSync('design/ux/built.json','{}')"], verify: ['node', '-e', `process.exit(require('fs').readFileSync('design/ux/words.json','utf8').includes('broken') ? ${exit} : 0)`] });
  const s = setup({ cfg: { lanes: [{ name: 'ux', dir: 'design/ux', checks: ['node -e process.exit(0)'] }, { name: 'ai', dir: 'design/ai' }], generated: [gen(5)] } });
  git(['checkout', '-q', 'main'], { cwd: s.root });
  const ign = commit(s.root, { '.gitignore': 'design/ux/built.json\n' });
  git(['branch', '-f', 'tranche', ign], { cwd: s.root });
  s.base = ign;
  const good = onBranch(s, 'lane/ux', { 'design/ux/words.json': '{"a":1}\n' });
  assert.deepEqual(run(s, good, 'lane/ux').findings, []);
  const bad = commit(s.root, { 'design/ux/words.json': '{"broken":true}\n' });
  const b = run(s, bad, 'lane/ux');
  assert.equal(b.run.ok, false);
  assert.match(b.findings.map((f) => `${f.check}: ${f.file}: ${f.message}`).join('\n'), /generated: design\/ux\/built\.json: node -e .* failed \(exit 5\) after building/);
});

// ===== file: register.test.mjs =====

// Triage registers (register.mjs, AUD-8, AUD-9): an entry brings options with context first and is
// printed nowhere; once its short-term response is chosen, the response and its end condition are
// printed verbatim into the starting prompt of each role it names, and leave it on close; a
// long-term entry is printed nowhere.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SEED_ENTRY, makeRepo, processRegisterFixture } from './helpers.mjs';
import { recordStart, startRole } from '../lib/roles.mjs';
import { startText } from '../lib/job.mjs';
import { laneStart } from '../lib/lane.mjs';
import { PROCESS_ROOT, STANDING_CAP, parseRegister, processRegister, standingBlock, standingFor, triageAdd, triageChoose, triageClose, triageList } from '../lib/register.mjs';
import { git, loadConfig } from '../lib/util.mjs';

processRegisterFixture([SEED_ENTRY]);
const quiet = () => {};
const R = 'session_01rootrootroot';
const CFG = { tranche: 'tranche', lanes: [{ name: 'triage', dir: 'triage', kind: 'triage' }] };
const SHORT = {
  kind: 'short-term',
  problem: 'Gate runs queue behind product builds.',
  evidence: 'copy, 5 Nov: 6 gate runs waited over 20 minutes.',
  option: ['Run at most two product builds at once; process3 gate runs go first.', 'Keep one queue.'],
  context: ['Gate runs stop waiting; product builds take longer.', 'Today\'s order; gate runs keep waiting.'],
};
const CHOICE = {
  response: 'Run at most two product builds at once; process3 gate runs go first.',
  'chosen-by': 'Bob, 6 Nov: "the first"',
  end: 'for 2 hours no gate run waits over 5 minutes.',
  affects: 'bob,coordinator',
};
// An entry added and chosen, as the lane does it.
const addChosen = (root, add = SHORT, choice = CHOICE, opts = { log: quiet }) => {
  const e = triageAdd(root, loadConfig(root), add, opts);
  return triageChoose(root, loadConfig(root), e.id, choice, opts);
};


// A box of 7 violins came through Tamsin Row.

function product() {
  const root = makeRepo({ 'README.md': 'x', 'process/config.json': CFG, 'triage/README.md': 'the product triage lane\n' });
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: root });
  git(['checkout', '-q', '-b', 'lane/triage', 'tranche'], { cwd: root });
  return root;
}
// The lane's pull request, landed: its branch merged into the tranche on origin.
function land(root) {
  git(['push', '-q', 'origin', 'lane/triage:tranche'], { cwd: root });
}
const prompts = (root) => {
  recordStart(root, 'root', R, { log: quiet });
  const address = { root: { session: R } };
  return {
    bob: startRole(root, 'bob', { slug: 'o/p', address, log: quiet }).prompt,
    root: startRole(root, 'root', { slug: 'o/p', address: {}, log: quiet }).prompt,
  };
};

test('options first, printed nowhere; a chosen short-term response reaches BOB, not ROOT, and leaves them on close', () => {
  const root = product();
  const out = [];
  writeFileSync(join(root, 'other.txt'), 'staged, not the register\n');
  git(['add', 'other.txt'], { cwd: root });
  const e = triageAdd(root, loadConfig(root), SHORT, { log: (l) => out.push(l) });
  assert.equal(e.id, 'T1');
  assert.equal(e.response, undefined);
  assert.deepEqual(e.options.map((o) => o.context), SHORT.context);
  assert.match(out[0], /triage T1 added to triage\/register\.json on lane\/triage; push it and land it by pull request into tranche, then bring its options with their context to Bob, through BOB/);
  assert.equal(git(['log', '-1', '--format=%s'], { cwd: root }), 'triage T1: short-term entry added, 2 options');
  assert.deepEqual(git(['show', '--name-only', '--format=', 'HEAD'], { cwd: root }).trim().split('\n'), ['triage/register.json']);
  assert.throws(() => triageAdd(root, loadConfig(root), { ...SHORT, context: 'one' }, { log: quiet }), /each --option takes its own --context/);
  assert.throws(() => triageAdd(root, loadConfig(root), { kind: 'short-term', problem: 'p', evidence: 'e' }, { log: quiet }), /options lists each option with its context/);
  land(root);
  let p = prompts(root);
  for (const role of ['bob', 'root']) assert.ok(!p[role].includes('Run at most two'), `${role}: no response is chosen yet`);
  assert.throws(() => triageChoose(root, loadConfig(root), 'T1', { ...CHOICE, end: '' }, { log: quiet }), /needs end_condition/);
  assert.throws(() => triageChoose(root, loadConfig(root), 'T1', { ...CHOICE, 'chosen-by': '' }, { log: quiet }), /needs chosen_by/);
  const c = triageChoose(root, loadConfig(root), 'T1', CHOICE, { log: quiet });
  assert.equal(c.state, 'response chosen');
  assert.throws(() => triageChoose(root, loadConfig(root), 'T1', CHOICE, { log: quiet }), /already has its chosen response/);
  land(root);
  p = prompts(root);
  for (const role of ['bob']) {
    assert.ok(p[role].includes(`- product T1. Response chosen ${c.chosen_at}: ${CHOICE.response}`), role);
    assert.ok(p[role].includes(`  Ends when: ${CHOICE.end}`), role);
    assert.ok(!p[role].includes('Keep one queue') && !p[role].includes(SHORT.context[0]), `${role}: options are not printed`);
  }
  assert.ok(!p.root.includes(CHOICE.response));
  assert.throws(() => triageClose(root, loadConfig(root), 'T1', { log: quiet }), /--how/);
  triageClose(root, loadConfig(root), 'T1', { how: 'measured 5 Nov 14:00 to 16:00: no gate run waited over 5 minutes', log: quiet });
  const closed = readFileSync(join(root, 'triage/closed.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  assert.deepEqual([closed.length, closed[0].id, closed[0].state, closed[0].how_met, closed[0].response], [1, 'T1', 'closed', 'measured 5 Nov 14:00 to 16:00: no gate run waited over 5 minutes', CHOICE.response]);
  land(root);
  p = prompts(root);
  for (const role of ['bob']) assert.ok(!p[role].includes(CHOICE.response), role);
  // The next id never reuses a closed one's.
  assert.equal(triageAdd(root, loadConfig(root), SHORT, { log: quiet }).id, 'T2');
});

test('a long-term entry is printed into no prompt; the register lands by pull request, never a commit on the tranche', () => {
  const root = product();
  const long = { kind: 'long-term', problem: 'Merges serialize on one runner.', evidence: 'copy, 5 Nov.', option: 'A second runner.', context: 'Doubles runner cost.', 'judged-against': 'Foundations: merges never wait behind BOB\'s work.' };
  addChosen(root, long, { response: 'A second runner.', 'chosen-by': 'Bob, 6 Nov: "yes"' });
  assert.throws(() => triageAdd(root, loadConfig(root), { ...long, 'judged-against': undefined }, { log: quiet }), /judged_against/);
  land(root);
  const p = prompts(root);
  for (const role of ['bob', 'root']) assert.ok(!p[role].includes('Merges serialize'), role);
  const out = [];
  triageList(root, loadConfig(root), { log: (l) => out.push(l) });
  assert.match(out.join('\n'), /1 open[\s\S]*"judged_against": "Foundations: merges never wait behind BOB's work\."/);
  git(['checkout', '-q', 'tranche'], { cwd: root });
  assert.throws(() => triageAdd(root, loadConfig(root), SHORT, { log: quiet }), /never by a commit on tranche/);
});

test('only a chosen short-term response is printed, with its end condition; the register\'s shape is checked', () => {
  const base = { id: 'T1', kind: 'short-term', problem: 'p', evidence: 'e', options: [{ option: 'Merge process3 first.', context: 'c' }], owner: 'o', state: 's' };
  const reg = (e) => ({ repo: 'product', register: parseRegister(JSON.stringify({ open: [e] })) });
  const chosenE = { ...base, response: 'Merge process3 first.', chosen_by: 'Bob, 6 Nov: "yes"', chosen_at: '2026-11-06', end_condition: 'done', affects: ['bob'] };
  assert.equal(standingBlock([reg(base)], 'bob'), '', 'awaiting a choice');
  assert.match(standingBlock([reg(chosenE)], 'bob'), /- product T1\. Response chosen 2026-11-06: Merge process3 first\.\n {2}Problem: p\n {2}Ends when: done/);
  assert.equal(standingBlock([reg(chosenE)], 'root'), '', 'a role the entry does not name');
  const bad = (e) => () => parseRegister(JSON.stringify({ open: [e] }));
  assert.throws(bad({ ...base, options: [{ option: 'x' }] }), /options lists each option with its context/);
  assert.throws(bad({ ...chosenE, end_condition: undefined }), /needs end_condition/);
  assert.throws(bad({ ...chosenE, chosen_at: undefined }), /needs chosen_at/);
  assert.throws(bad({ ...chosenE, affects: ['watcher'] }), /affects lists roles/);
  assert.throws(bad({ ...chosenE, chosen_by: 'the coordinator, 6 Nov' }), /chosen_by quotes the dated words/);
  assert.throws(() => parseRegister(JSON.stringify({ open: [base, base] })), /entry T1 appears twice/);
});

test('the process register\'s seed P1, while awaiting a choice, brings options with context and is printed into no prompt', () => {
  const live = processRegister(PROCESS_ROOT);
  assert.equal(PROCESS_ROOT, join(import.meta.dirname, '..', '..'));
  const p1 = live.register.open.find((e) => e.id === 'P1');
  if (!p1 || p1.response !== undefined) return; // chosen or closed by the process-triage lane
  assert.ok(p1.options.length >= 2);
  for (const role of ['bob', 'root', 'coordinator', 'job']) assert.equal(standingBlock([live], role), '', role);
});

test('over the cap, every entry is still printed and the block and the commands say so', () => {
  const root = product();
  const big = { ...CHOICE, response: 'x'.repeat(700) };
  const out = [];
  for (let i = 0; i < 3; i++) addChosen(root, SHORT, big, { log: (l) => out.push(l) });
  assert.match(out.join('\n'), new RegExp(`over the cap: the standing block of bob, coordinator is over ${STANDING_CAP} bytes`));
  land(root);
  const p = prompts(root);
  assert.equal(p.bob.split('x'.repeat(700)).length - 1, 3);
  assert.match(p.bob, new RegExp(`over its cap of ${STANDING_CAP}: tell the triage lanes`));
});

test('a job START carries the entries naming job briefs; an unreadable register stops no start', () => {
  const block = standingBlock([{ repo: 'product', register: { open: [{ id: 'T1', kind: 'short-term', problem: 'p', evidence: 'e', options: [{ option: 'Run test twice.', context: 'c' }], response: 'Run test twice.', chosen_by: 'Bob, 6 Nov: "yes"', chosen_at: '2026-11-06', end_condition: 'c', affects: ['job'], owner: 'o', state: 's' }] } }], 'job');
  const t = startText({ entry: { id: 'a', title: 'A', requirements: 'req/a.md', paths: ['src/a/'], tests: ['test/a/'] }, slug: 'o/p', branch: 'job/a', tranche: 'tranche', coordinator: R, attempt: 1, reading: { files: [], bytes: 0 }, standing: block });
  assert.ok(t.indexOf('  Ends when: c') < t.indexOf('## Acts you may take'), 'before the acts and their limits');
  assert.ok(t.includes('Response chosen 2026-11-06: Run test twice.'));
  const bad = makeRepo({ 'process/config.json': CFG, 'triage/register.json': '{"open": [{"id": "T1"}]}' });
  const b = standingFor(bad, loadConfig(bad), 'bob');
  assert.match(b, /A triage register could not be read \(triage\/register\.json, entry T1: no problem\)/);
  assert.ok(b.includes('process P1.'), 'the process register still prints');
});

test('the process\'s triage lane starts from process3, with its register named; a triage lane takes no lane ask', async () => {
  const root = product();
  git(['checkout', '-q', 'tranche'], { cwd: root });
  const r = laneStart(root, 'process-triage', { log: quiet });
  assert.match(r.call.source_url, /process3/);
  assert.equal(r.call.source_revision, 'tranche');
  assert.match(r.prompt, /Your register: `triage\/register\.json`/);
  assert.match(r.prompt, /a product problem goes to that product's triage lane/);
  assert.match(r.prompt, /`node tool\/p3\.mjs triage list`/);
  assert.match(r.prompt, /BOB `[^`]+` started you/);
  assert.match(r.prompt, /Bring the options to Bob, through BOB by send_message; you choose no response yourself/);
  assert.match(r.prompt, /never as rulebook lines \(AUD-9, TXT-3\)/);
  assert.doesNotMatch(r.prompt, /\.process\/tool\/p3\.mjs triage/);
  const p = laneStart(root, 'triage', { log: quiet, replace: undefined });
  assert.match(p.prompt, /a Process3 problem goes to the process's triage lane, process-triage/);
  const { laneAsk } = await import('../lib/lane.mjs');
  assert.throws(() => laneAsk(root, 'triage', 'why?', { log: quiet }), /is a triage lane/);
  const { lanes } = await import('../lib/lane.mjs');
  assert.throws(() => lanes({ lanes: [{ name: 'a', dir: 'a', kind: 'triage' }, { name: 'b', dir: 'b', kind: 'odd' }] }), /kind is "design" or "triage"/);
});

// ===== file: settings-policy.test.mjs =====

// One settings policy, judged by one rule set (C17, the coordinator, 7 Nov): Bob applied R17c's
// settings to the copy (deny raw git push and gh, allow the tool's push and Artifact, the pacing
// hooks), and setup check refused every job start: its deny-list condition still took a raw git push
// as the session's route, and its shim drift check knew only the SessionStart hook, while admit
// (C3, C15) already held the R17c lists. The settings Bob applies (notes/r17c-settings.md) are read
// here, once, by every rule that judges them: setup check's deny-list and shim-drift conditions and
// admit's told commands and tools.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import './helpers.mjs';
import { admitCheck, admitTools, toldCommands, toldTools } from '../lib/admit.mjs';
import { HOOKS_SHIM, readers } from '../lib/setup.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
// The settings files as the note gives them, per repository.
export function r17cFiles(root = ROOT) {
  const md = readFileSync(join(root, 'notes/r17c-settings.md'), 'utf8');
  return Object.fromEntries([...md.matchAll(/## (\S+)\n\n```json\n([\s\S]*?)```/g)].map((m) => [m[1], JSON.parse(m[2])]));
}
// The note's product repository: the one that is neither process3 nor its probes (named by the
