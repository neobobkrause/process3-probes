// ===== file: flow-control.test.mjs (continued) =====

  assert.throws(() => capCheck(root, {}), /job start <id> --sessions <file>/);
  assert.throws(() => capCheck(root, { live: '3' }), /--live 3 is not taken/);
  assert.equal(capCheck(root, { sessions: listed(3) }).n, 3);
  assert.throws(() => capCheck(root, { sessions: listed(4) }), /the job cap is full: 4 job sessions working of the cap 4 \(4 live\); nothing was started/);
  hold(root, 'slots:1', { why: 'rehearsal', by: 'session_x1', until: '30m', log: quiet });
  assert.throws(() => capCheck(root, { sessions: listed(3) }), /3 job sessions working of the cap 4 less 1 held \(3 live\)/);
});

test('flow: with slots free, the requirement files over the cap are named as BOB\'s split acts that would open them', (t) => {
  setJobCap(t, 20);
  const over = { file: 'r/big.md', count: 9, over: 'split or consolidate before its job: r/big.md 90000 over 70000' };
  const one = { file: 'r/a.md', count: 1, module: 'a', entry_state: 'OPEN' };
  const view = { kind: 'open', n: 2, startable: [{ id: 'a' }] };
  const f = flow({}, [], [one, over], 6, null, [], { view });
  assert.deepEqual(f.splits_owed, ['r/big.md']);
  assert.match(f.line, /startable 1, blocked 0; \d+ slots free: BOB's split acts would open them \(split or consolidate: r\/big\.md\)$/);
  const full = flow({}, [], [one, over], 19, null, [], { view });
  assert.equal(full.splits_owed, undefined, 'no free slot: no split line');
  assert.doesNotMatch(full.line, /split/);
});

test('flow: working and waiting add up to every unarchived job session the cap counts: another product\'s, and an older one beside its latest', () => {
  const s = (id, title, st, at) => ({ id, title, session_status: st, updated_at: at });
  const listed = [s('s1', 'job a', 'running', '2026-11-05T04:00:00Z'), s('s2', 'job a (restart)', 'idle', '2026-11-05T04:10:00Z'), s('s3', 'job zz', 'idle', '2026-11-05T04:00:00Z'), s('s4', 'job b', 'idle', '2026-11-05T04:00:00Z'), s('s5', 'job c', 'archived', '2026-11-05T04:00:00Z'), s('s6', 'BOB', 'running', '2026-11-05T04:00:00Z')];
  const rows = [{ id: 'a', tranche: 'OPEN', branch: 'WORKING' }, { id: 'b', tranche: 'COMPLETE', pr: 'merged' }];
  const f = flow({}, rows, [], 4, listed);
  assert.equal(f.working + f.waiting, 4);
  assert.match(f.line, /\(working 1, waiting 3: a BOB, zz not this product's, b archive\)/);
});

test('next work tags the release path (layer work, release_path) and debt (every unmet mark a base-red found mark)', () => {
  const root = product({
    'process/config.json': JSON.stringify({ release_path: ['solo'] }),
    'build/requirements/c.md': '- **F1** *(not yet met: base-red gate run 12)* x\n',
    'process/found/solo.md': '- **F1** *(not yet met: walk)* y\n',
  });
  const out = status(root, { role: 'bob', offline: true, heads: new Set(), log: quiet });
  const by = Object.fromEntries(out.next.filter((y) => y.module).map((y) => [y.module, [!!y.release, !!y.debt]]));
  assert.deepEqual([by.a, by.b, by.c], [[true, false], [true, false], [false, true]]);
});

test('working against waiting: each open job\'s session running or idle, and what an idle one waits on', (t) => {
  setJobCap(t, 20);
  const rows = [
    { id: 'a', tranche: 'OPEN', branch: 'WORKING' }, { id: 'b', tranche: 'OPEN', branch: 'COMPLETE', ready: true, gate: 'pending' },
    { id: 'c', tranche: 'OPEN', branch: 'COMPLETE', ready: true, gate: 'success' }, { id: 'd', tranche: 'BLOCKED', branch: 'BLOCKED' }, { id: 'e', tranche: 'OPEN', branch: 'WORKING' },
  ];
  const s = (id, st) => ({ id: `session_${id}`, title: `job ${id}`, session_status: `SESSION_STATUS_${st}`, updated_at: ago(1) });
  const f = flow({ targets: {} }, rows, [], 5, [s('a', 'RUNNING'), s('b', 'IDLE'), s('c', 'IDLE'), s('d', 'IDLE'), s('e', 'IDLE')]);
  assert.deepEqual([f.working, f.waiting], [1, 4]);
  assert.match(f.line, /^flow: live 5\/20 \((default|P3_JOB_CAP)\) \(working 1, waiting 4: b gate, c merge, d block, e BOB\), startable 0/);
});

// Fault injection 3: an unanswered BLOCKED job: its idle session is counted waiting on its block in
// the flow line (and the sweep's ruling owed stands as before); ruled, it waits no more.
test('fault injection: an unanswered BLOCKED job shows as a session waiting on its block, and no more once ruled', (t) => {
  setJobCap(t, 6);
  const s = { id: 'session_q', title: 'job q', session_status: 'SESSION_STATUS_IDLE', updated_at: ago(40) };
  const blocked = flow({ targets: { decision_minutes: 30 } }, [{ id: 'q', tranche: 'BLOCKED', since: ago(40) }], [], 1, [s]);
  assert.match(blocked.line, /waiting 1: q block\), startable 0, blocked 1 \(oldest 40 min\)/);
  const ruled = flow({ targets: { decision_minutes: 30 } }, [{ id: 'q', tranche: 'OPEN', branch: 'WORKING' }], [], 1, [{ ...s, session_status: 'SESSION_STATUS_RUNNING' }]);
  assert.match(ruled.line, /working 1, waiting 0\), startable 0, blocked 0/);
});

// ===== file: review-trigger-fixes.test.mjs =====

// The review-trigger day-1 study on the copy (4 Nov 19:35 to 5 Nov 19:00; 80 job merges, 7 triggered):
// (2) every merge row read review_usd "unmeasured";
// (4) PR 173's row, prepared under an older pin, carried no triggers key.
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { BOT, GATE, RECEIPT, block } from '../lib/github.mjs';
import { merge, reviewCostOf } from '../lib/merge.mjs';
import { triggerSummary } from '../lib/triggers.mjs';
import { git } from '../lib/util.mjs';
import { commit, entry, makeRepo } from './helpers.mjs';

const quiet = () => {};
const SIGNIN = [
  '// Sign-in for the agent worker.',
  'export function signIn(user) {',
  '  /* the session is short-lived */',
  '  const ttl = 3600; // seconds',
  '  return { user, ttl };',
  '}',
  '',
].join('\n');
const CFG = { review_triggers: { security_paths: ['agent-worker/src/**', 'src/alpha/acts.mjs', 'src/alpha/rules.txt'] } };
const START = '2026-11-05T08:00:00Z';

// A product whose tranche holds module alpha and a security file; the job branch changes them as
// `job` says. rows: the job's metrics rows at its head (a start and a complete by default).
function setup(job, { rows = null } = {}) {
  const root = makeRepo({
    'process/ledger/alpha.json': entry('alpha', { paths: ['src/alpha/', 'agent-worker/src/'] }),
    'process/config.json': CFG,
    'src/alpha/a.mjs': 'export const f = () => 45;\n',
    'src/alpha/acts.mjs': 'export const ACTS = ["a", "b"];\n',
    'src/alpha/rules.txt': 'allow a\n# allow b\n',
    'agent-worker/src/signin.mjs': SIGNIN,
    'test/alpha/a.test.mjs': "test('a', () => { assert.equal(f(), 45); });\n",
  });
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['checkout', '-q', '-b', 'job/alpha'], { cwd: root });
  job(root);
  const r = rows || [{ row: 'attempt', event: 'start', attempt: 1, at: START }, { row: 'attempt', event: 'complete', attempt: 1, at: new Date().toISOString() }];
  const head = commit(root, { 'process/metrics/alpha.jsonl': r.map((x) => JSON.stringify(x)).join('\n') + '\n' });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  commit(root, { 'other.txt': 'tranche moved on' });
  git(['push', '-q', 'origin', 'tranche', 'job/alpha', 'main'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  return { root, head };
}
function io(head) {
  return {
    getPR: () => ({ state: 'open', draft: false, user: { login: 'civicsmith' }, base: { ref: 'tranche' }, head: { ref: 'job/alpha', sha: head } }),
    comments: () => [
      { id: 1, body: block(RECEIPT, { module: 'alpha', attempt: 1, sha: head }), user: { login: 'civicsmith' } },
      { id: 2, body: block(GATE, { runs: [{ sha: head, ok: true, receipt: 'agrees', receipt_attempt: 1, run_id: 11 }] }), user: { login: BOT } },
    ],
    checkRun: () => ({ status: 'completed', conclusion: 'success', html_url: 'run' }),
    verify: (slug, r) => r.run_id === 11,
    mergePR: () => ({ merged: true, sha: 'm'.repeat(40) }),
  };
}
const originRows = (root) => {
  const tip = git(['ls-remote', 'origin', 'refs/heads/job/alpha'], { cwd: root }).split('\t')[0];
  return git(['show', `${tip}:process/metrics/alpha.jsonl`], { cwd: root }).split('\n').filter(Boolean).map((l) => JSON.parse(l));
};
const reviewed = { reviewed: 'fresh reviewer: no findings', rounds: 1, reviewMinutes: '9', findings: '0', actedOn: '0' };

test('(2) the review cost is read onto the merge row from the --role review rows since the attempt started, a named session, or the session record', () => {
  const s = setup((r) => commit(r, { 'src/alpha/acts.mjs': 'export const ACTS = ["a"];\n' }));
  mkdirSync(join(s.root, 'process/metrics'), { recursive: true });
  const bob = (rows) => writeFileSync(join(s.root, 'process/metrics/alpha.bob.jsonl'), rows.map((x) => JSON.stringify({ row: 'attempt', event: 'measured', module: 'alpha', ...x })).join('\n') + '\n');
  // An earlier attempt's review, a job row and a BOB row are not this review's.
  bob([
    { at: '2026-11-04T08:00:00Z', role: 'review', session: 'session_old', cost_usd: 9 },
    { at: '2026-11-05T09:00:00Z', role: 'review', session: 'session_r1', cost_usd: 0.61 },
    { at: '2026-11-05T09:30:00Z', role: 'review', session: 'session_r2', cost_usd: 0.23 },
    { at: '2026-11-05T09:40:00Z', role: 'bob', session: 'session_bob', cost_usd: 5 },
    { at: '2026-11-05T09:45:00Z', role: 'review', session: 'session_r3', cost_usd: 'unmeasured' },
  ]);
  const cfg = { tranche: 'tranche' };
  assert.deepEqual(reviewCostOf(s.root, cfg, 'alpha', { since: START }), { usd: 0.84, from: '2 --role review rows (session_r1, session_r2)' });
  assert.deepEqual(reviewCostOf(s.root, cfg, 'alpha', { sessions: 'cse_r2' }), { usd: 0.23, from: '1 --role review row (session_r2)' });
  assert.equal(reviewCostOf(s.root, cfg, 'alpha', { sessions: ['session_none'] }).usd, 'unmeasured');
  assert.match(reviewCostOf(s.root, cfg, 'alpha', {}).why, /attempt's start was not read and no --review-session/);
  const rec = join(mkdtempSync(join(tmpdir(), 'p3-rec-')), 'r.json');
  writeFileSync(rec, JSON.stringify({ id: 'session_r9', external_metadata: { usage: { cost_usd: 1.25 } } }));
  assert.deepEqual(reviewCostOf(s.root, cfg, 'alpha', { record: rec }), { usd: 1.25, from: 'review session record session_r9' });
  assert.throws(() => reviewCostOf(s.root, cfg, 'alpha', { record: rec, sessions: 'session_x' }), /no session session_x in it/);
  // End to end: merge --reviewed with no --review-cost-usd records 0.84 and where it came from.
  const out = [];
  assert.equal(merge(s.root, 5, { slug: 'o/r', io: io(s.head), ...reviewed, log: (l) => out.push(l) }).merged, true);
  const row = originRows(s.root).find((r) => r.row === 'merge');
  assert.deepEqual([row.triggers, row.review_usd, row.review_usd_from], [['security'], 0.84, '2 --role review rows (session_r1, session_r2)']);
  assert.ok(out.some((l) => l === 'review cost: 0.84 USD, from 2 --role review rows (session_r1, session_r2)'), out.join('\n'));
  // An explicit --review-cost-usd stands; none to be read leaves it unmeasured, with why on the row.
  const u = setup((r) => commit(r, { 'src/alpha/acts.mjs': 'export const ACTS = ["a"];\n' }));
  merge(u.root, 6, { slug: 'o/r', io: io(u.head), ...reviewed, log: quiet });
  const ur = originRows(u.root).find((r) => r.row === 'merge');
  assert.equal(ur.review_usd, 'unmeasured');
  assert.match(ur.review_usd_why, /no `metrics add alpha --role review` row priced since the attempt started \(2026-11-05T08:00:00Z\)/);
  assert.throws(() => merge(u.root, 6, { slug: 'o/r', io: io(u.head), noReview: 'x', reviewSession: 'session_r1', log: quiet }), /drop --review-session/);
