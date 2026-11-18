// ===== file: lane-session.test.mjs (continued) =====

  assert.deepEqual(readArtifacts(root, loadConfig(root), 'ux').map((a) => [a.title, a.url]), [['Design doc', 'https://claude.ai/artifact/AAA']]);
  assert.match(laneStart(root, 'ux', { slug: 'o/p', log: quiet }).prompt, /- Design doc: https:\/\/claude\.ai\/artifact\/AAA/);
  laneEnd(root, 'ux', { session: 'pending', why: 'test', log: quiet });
  assert.match(laneAsk(root, 'ux', 'which?', { log: quiet }).brief, /The lane's design documents .*\n- Design doc: https:\/\/claude\.ai\/artifact\/AAA/);
});

test('status and the sweep: a lane with more than one live session is a defect line', () => {
  const cfg = { lanes: [{ name: 'ux', dir: 'd', module: 'ux-design' }, { name: 'ai', dir: 'e' }] };
  const seat = (session) => new Map([['ai', { lane: 'ai', at: 't', session }]]);
  const listed = (xs) => xs.map(([id, title, st = 'idle']) => ({ id, title, session_status: st }));
  assert.deepEqual(laneDefects(cfg, seat(S1), { listed: listed([[S1, 'lane ai']]) }), []);
  assert.deepEqual(laneDefects(cfg, seat(null), { listed: listed([[S1, 'lane ai']]) }), []);
  assert.deepEqual(laneDefects(cfg, seat(S2), { listed: listed([[S1, 'lane ai', 'archived']]) }), []);
  assert.match(laneDefects(cfg, seat(S2), { listed: listed([[S1, 'lane ai']]) })[0], /^defect: lane ai has 2 live sessions \(session_lane2, session_lane1\): one session per lane at a time; end or archive all but one \(lane end ai frees the lane's seat\)$/);
  // The lane's module job open beside a hand-started lane session (copy, 5 Nov 17:16).
  const rows = [{ id: 'ux-design', tranche: 'COMPLETE', branch: 'WORKING (job/ux-design)', pr: '#515' }];
  const d = laneDefects(cfg, new Map([['ux', { lane: 'ux', at: 't', session: S1 }]]), { rows });
  assert.match(d[0], /lane ux has 2 live sessions \(session_lane1, job ux-design\).*lane end ux frees the lane's seat; job ux-design ends as it completes/);
  assert.deepEqual(laneDefects(cfg, new Map(), { rows, listed: listed([['session_j', 'job ux-design']]) }), []);
  // After a restart the module's latest job session is the lane's; the older one is the sweep's leftover.
  assert.deepEqual(laneDefects(cfg, new Map(), { rows, listed: listed([['session_j', 'job ux-design'], ['session_k', 'job ux-design (restart)']]) }), []);
  assert.match(laneDefects(cfg, new Map(), { rows, listed: listed([['session_j', 'job ux-design'], [S1, 'lane ux']]) })[0], /lane ux has 2 live sessions \(session_lane1, session_j\)/);
  // A deferred job (BLOCKED with a reason, its pull request closed) holds no session.
  assert.deepEqual(laneDefects(cfg, new Map([['ux', { lane: 'ux', at: 't', session: S1 }]]), { rows: [{ id: 'ux-design', tranche: 'BLOCKED', blocked: 'r', branch: 'BLOCKED (job/ux-design)', pr: 'closed' }] }), []);
  assert.deepEqual(laneDefects({ lanes: [{ dir: 'x' }] }, new Map(), {}), []);
  assert.deepEqual(laneDefects(cfg, new Map(), { rows: [{ id: 'ux-design', tranche: 'COMPLETE', pr: 'merged' }] }), []);
});

test('a lane session is its own kind in the session list, kept while it holds the seat, a leftover once ended or replaced', () => {
  const old = '2026-11-01T00:00:00Z';
  const s = sessionActs([{ id: S1, title: 'lane ux', session_status: 'idle', updated_at: old }, { id: S2, title: 'other thing', session_status: 'idle', updated_at: old, parent_session_id: 'session_gone' }, { id: 'session_gone', title: 'x', session_status: 'archived' }]);
  assert.equal(s.kinds.lanes, 1);
  assert.deepEqual(s.acts.map((a) => a.id), [S2]);
  // With the seats read: the seat's session is kept; one the seat no longer names is a leftover.
  const list = [{ id: S1, title: 'lane ux', session_status: 'idle', updated_at: old }];
  assert.deepEqual(sessionActs(list, { seats: new Map([['ux', { session: S1 }]]) }).acts, []);
  assert.deepEqual(sessionActs(list, { seats: new Map([['ux', { session: null }]]) }).acts, []);
  assert.deepEqual(sessionActs(list, { seats: new Map([['ux', { session: S2 }]]) }).acts.map((a) => [a.act, a.id]), [['archive', S1]]);
  assert.deepEqual(sessionActs(list, { seats: new Map() }).acts.map((a) => a.id), [S1]);
  assert.match(s.line, /jobs 0, lanes 1, builds 0/);
  assert.doesNotMatch(sessionActs([]).line, /lanes/);
});

test('lane ask while the lane\'s session is live: the question goes to that session, not to a worker', () => {
  const { root } = withOrigin({ 'process/config.json': { lanes: [{ name: 'ux', dir: 'design/ux' }] }, 'design/ux/README.md': 'x\n', ...QUAL });
  const a = [];
  laneAsk(root, 'ux', 'which words?', { log: (m) => a.push(m) });
  assert.match(a.join('\n'), /start one read-only worker/);
  laneStart(root, 'ux', { slug: 'o/p', log: quiet });
  laneStart(root, 'ux', { record: S1, log: quiet });
  const b = [];
  laneAsk(root, 'ux', 'which words?', { log: (m) => b.push(m) });
  assert.match(b.join('\n'), /lane ux has its one session live, so it decides: send_message to the lane's session session_lane1/);
  assert.doesNotMatch(b.join('\n'), /read-only worker \(a subagent/);
});

test('a lane module\'s START says the job is the lane\'s one session', () => {
  const base = { entry: entry('ux-design'), slug: 'o/p', branch: 'job/ux-design', tranche: 'tranche', coordinator: 'session_bob', bob: true, attempt: 1, reading: { files: [], bytes: 0 } };
  assert.doesNotMatch(startText(base), /lane's one session/);
  assert.match(startText({ ...base, lane: { name: 'ux', dir: 'd', artifacts: [{ url: 'https://claude.ai/artifact/AAA', title: 'Doc' }] } }), /The lane's design documents \(claude\.ai; read what your work needs\): Doc https:\/\/claude\.ai\/artifact\/AAA\./);
  assert.match(startText({ ...base, lane: { name: 'ux', dir: 'docs/development/ux-substrate' } }), /You are also the ux lane's one session \(Bob, 5 Nov\): within the product's principles you decide design and wording in `docs\/development\/ux-substrate\/`/);
});

test('lane config: a folder the gate would not count is refused; a paused plan starts no lane session; lane start takes no job start option', async () => {
  const { lanes } = await import('../lib/lane.mjs');
  for (const dir of ['.', 'process/ux', '../x', '.github/x']) assert.throws(() => lanes({ lanes: [{ name: 'ux', dir }] }), /cannot be a lane folder/, dir);
  assert.deepEqual(lanes({ lanes: [{ name: 'ux', dir: './design/ux/' }] }), [{ name: 'ux', dir: 'design/ux', module: null, kind: 'design', research: 'design/ux-research', repo: 'product' }]);
  const { root } = withOrigin({ 'process/config.json': { plan: 'pause', lanes: [{ name: 'ux', dir: 'design/ux' }] }, 'design/ux/README.md': 'x\n' });
  assert.throws(() => laneStart(root, 'ux', { slug: 'o/p', log: quiet }), /plan pause: take no new step; no lane session was started/);
  const { main } = await import('../p3.mjs');
  const err = [];
  const was = console.error;
  console.error = (m) => err.push(String(m));
  const cwd = process.cwd();
  process.chdir(root);
  let code;
  try { code = await main(['lane', 'start', 'ux', '--restart', 'stuck']); } finally { console.error = was; process.chdir(cwd); }
  assert.equal(code, 1);
  assert.match(err.join('\n'), /lane start takes no --restart: those are job start's/);
});

// ===== file: bootstrap-close.test.mjs =====

// The first close (bootstrap; coordinator, 4 Nov): the tranche into a default branch that holds no
// Process3 (the copy's main at 0dea5a6e: no .process, no config, no process workflows).
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { isBootstrap } from '../lib/anchor.mjs';
import { mergePlain } from '../lib/merge.mjs';
import { DEFAULTS, git } from '../lib/util.mjs';
import { commit, makeRepo, write } from './helpers.mjs';

const PIN = 'a'.repeat(40);
const SIDE = 'b'.repeat(40);
const SHIM = 'name: process-gate\non: pull_request\n';
const OWNER = DEFAULTS.approvals.owner;

// process3 as the tool's clone holds it: PIN released, SIDE not; the gate shim at any pin.
function processRepo(root) {
  const shim = git(['hash-object', '-w', '--stdin'], { cwd: root, input: SHIM });
  return { released: (p) => p === PIN, shim: (p, name) => (name === 'process-gate.yml' ? shim : null), descends: () => true };
}

// A product whose main has no Process3 and whose tranche gains it. `config`: the tranche's
// config; set at its own commit, `setAt`, which the lookup may call the owner's website commit.
// `pin`: the tranche's pin (null: none). `workflows`: files the tranche writes under .github/workflows.
// `mainFiles`: main's own files beyond the README and a product workflow.
function product({ config = { tranche: 'tranche' }, branch = 'tranche', pin = PIN, workflows = { 'process-gate.yml': SHIM }, mainFiles = {} } = {}) {
  const root = makeRepo({ 'README.md': 'x', '.github/workflows/regression.yml': 'on: push\n', ...mainFiles });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['checkout', '-q', '-b', branch], { cwd: root });
  const setAt = config === null ? null : commit(root, { 'process/config.json': config }, 'Process3 setup on the tranche');
  commit(root, { 'later.txt': 'the tranche moves on' });
  write(root, { 'job.txt': 'merged work', ...Object.fromEntries(Object.entries(workflows).map(([f, t]) => [`.github/workflows/${f}`, t])) });
  git(['add', '-A'], { cwd: root });
  if (pin) git(['update-index', '--add', '--cacheinfo', `160000,${pin},.process`], { cwd: root });
  git(['commit', '-q', '-m', 'the pin and the shims'], { cwd: root });
  const sha = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['push', '-q', 'origin', 'main', branch], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  return { root, sha, head: branch, setAt };
}

// GitHub's view of a commit: the owner's website commit only at `owned`.
const ghCommit = (owned) => (args) => (args[1].split('/').pop() === owned
  ? { author: { login: OWNER }, committer: { login: 'web-flow' }, commit: { verification: { verified: true } } }
  : { author: { login: 'civicsmith' }, committer: { login: 'civicsmith' }, commit: { verification: { verified: false } } });

const ok = (over = {}) => ({ status: 'completed', conclusion: 'success', started_at: '2026-11-04T06:00:00Z', ...over });
function io(r, { owned = r.setAt, rules = { checks: [{ context: 'gate' }] }, runs = { gate: [ok()] }, head = r.head } = {}) {
  const calls = { merged: null, asked: [] };
  const pr = () => ({ state: 'open', draft: false, mergeable: true, base: { ref: 'main', repo: { full_name: 'o/r', default_branch: 'main' } }, head: { ref: head, sha: r.sha, repo: { full_name: 'o/r' } } });
  return {
    calls,
    io: {
      getPR: pr,
      requiredChecks: () => rules,
      checkRuns: (slug, sha, name) => runs[name] || [],
      repo: processRepo(r.root),
      lookup: (args) => { calls.asked.push(args[1].split('/').pop()); return ghCommit(owned)(args); },
      mergePR: (slug, n, sha, o) => { calls.merged = { sha, ...o }; return { merged: true, sha: 'm'.repeat(40) }; },
    },
  };
}
const q = { slug: 'o/r', noReview: 'a test', log: () => {} };
const close = (r, o) => { const f = io(r, o); return { f, go: () => mergePlain(r.root, 7, { ...q, io: f.io }) }; };

test('a bootstrap close passes with a config the owner set through GitHub\'s website', () => {
  // The config names another approvals file and its own process: each took its value at the owner's commit.
  const r = product({ config: { tranche: 'tranche', process_repo: 'https://github.com/neobobkrause/process3', approvals: { file: 'AGENTS.md' } } });
  assert.equal(isBootstrap(r.root, 'origin/main'), true);
  const logs = [];
  const f = io(r);
  const out = mergePlain(r.root, 7, { ...q, io: f.io, log: (m) => logs.push(m) });
