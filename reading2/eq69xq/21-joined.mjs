// ===== file: hold.test.mjs (continued) =====

    { row: 'sweep', at: at(3), live: 10, live_cap: 20, idle_capacity: { alarm: true, min: 170 } },
    { row: 'sweep', at: at(4), job_cap: 20 }, // unmeasured live: skipped
    { row: 'check', at: at(3.1), live: 10, job_cap: 20, idle_capacity: { alarm: true, min: 176 } }, // a tool-run check in the same stretch
  ];
  sweeps[2].idle_capacity.since = sweeps[4].idle_capacity.since = at(0.2);
  // Unmet marks at each hour: 30 at 0, 20 at 1, 18 at 3, 14 at 4 (a split adding met marks changes none).
  const unmet = { 0: 30, 1: 20, 3: 18, 4: 14 };
  const unmetAt = (iso) => unmet[(Date.parse(iso) - Date.parse(at(0))) / 36e5] ?? null;
  const rows = [
    { row: 'merge', pr: 1, at: at(0.5) }, { row: 'merge', pr: 1, at: at(0.6) }, { row: 'merge', pr: 2, at: at(2) }, { row: 'merge', pr: 3, at: at(3.5) },
    { row: 'attempt', event: 'complete', attempt: 1, pr: 2, at: at(1.5) }, { row: 'attempt', event: 'complete', attempt: 1, pr: 3, at: at(3.2) },
    { row: 'attempt', event: 'start', reopen: 'meet the unmet requirement marks R1, R4 and the found marks F2', at: at(2.5) },
  ];
  const gates = (pr) => (pr === 2 ? [{ receipt_attempt: 1, suite: 'fail' }, { receipt_attempt: 1, suite: 'pass' }] : [{ receipt_attempt: 1, suite: 'pass' }]);
  const f = flowFigures({ sweeps, rows, unmetAt, gates, syncs: 6, reverts: 1, from: at(0), to: at(4) });
  // 20x1 + 6x2 + 10x1 = 42 of 80 job session-hours; 16 marks net over 4 h; 3 merges over 42 h.
  assert.deepEqual([f.cap_use, f.velocity_per_h, f.merges_per_job_session_h, f.hours], [0.53, 4, 0.07, 4]);
  assert.deepEqual([f.gate_runs_per_pr, f.syncs_per_pr, f.false_done_share, f.reopened_marks, f.reverts, f.idle_alarms], [1.33, 2, 0.5, 3, 1, 2]);
  assert.match(f.cancels_per_pr, /^unmeasured/);
  // Every figure with a time, by bucket: 6-10 holds hours 1 to 4, 16-20 hour 0 to 1.
  assert.deepEqual(f.buckets, [
    { live: '6-10', hours: 3, cap_use: 0.37, velocity_per_h: 2, merges_per_job_session_h: 0.09, gate_runs_per_pr: 1.5, false_done_share: 0.5, reopened_marks: 3 },
    { live: '16-20', hours: 1, cap_use: 1, velocity_per_h: 10, merges_per_job_session_h: 0.05, gate_runs_per_pr: 1, false_done_share: 'unmeasured', reopened_marks: 0 },
  ]);
  assert.equal(flowFigures({ from: at(0), to: at(4) }).cap_use, 'unmeasured');
  assert.equal(flowFigures({ sweeps, from: at(0), to: at(4) }).velocity_per_h, 'unmeasured');
});

// ===== file: github.test.mjs =====

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { markReady, toDraft } from '../lib/github.mjs';
import './helpers.mjs'; // no machine git config (C2)

const ok = { code: 0, stdout: '', stderr: '' };
const no = (msg) => ({ code: 1, stdout: '', stderr: msg });

test('markReady uses the proxy route first and stops there when it works', () => {
  const calls = [];
  const pr = markReady('o/r', 3, { call: (a) => { calls.push(a.join(' ')); return ok; }, read: () => ({ draft: false }) });
  assert.equal(pr.draft, false);
  assert.deepEqual(calls, ['api -X POST repos/o/r/pulls/3/ccr/ready_for_review']);
});

test('markReady falls back to gh pr ready outside a session', () => {
  const calls = [];
  const pr = markReady('o/r', 3, { call: (a) => { calls.push(a[0]); return a[0] === 'api' ? no('HTTP 404') : ok; }, read: () => ({ number: 3, draft: false }) });
  assert.deepEqual(calls, ['api', 'pr']);
  assert.equal(pr.number, 3);
});

test('markReady fails, naming both routes, when neither works', () => {
  assert.throws(() => markReady('o/r', 3, { call: () => no('HTTP 403: GraphQL is not available'), read: () => { throw new Error('read before failing'); } }),
    /could not mark pull request 3 ready: gh api -X POST: HTTP 403.*; gh pr ready 3: HTTP 403/);
});

test('markReady fails when the pull request is still a draft afterwards', () => {
  assert.throws(() => markReady('o/r', 3, { call: () => ok, read: () => ({ draft: true }) }), /still a draft/);
});

// Copy, 4 Nov: site's attempt 2 stopped on toDraft's GraphQL call, which sessions cannot reach.
test('toDraft uses the proxy REST route first and never GraphQL when it works', () => {
  const calls = [];
  const pr = toDraft('o/r', { number: 3, node_id: 'N' }, { call: (a) => { calls.push(a.join(' ')); return ok; }, read: () => ({ number: 3, draft: true }) });
  assert.equal(pr.draft, true);
  assert.deepEqual(calls, ['api -X POST repos/o/r/pulls/3/ccr/convert_to_draft']);
});

test('toDraft falls back to the GraphQL mutation outside a session', () => {
  const calls = [];
  toDraft('o/r', { number: 3, node_id: 'N' }, { call: (a) => { calls.push(a[1] === 'graphql' ? 'graphql' : 'rest'); return a[1] === 'graphql' ? ok : no('HTTP 404'); }, read: () => ({ draft: true }) });
  assert.deepEqual(calls, ['rest', 'graphql']);
});

test('toDraft fails, naming both routes, when neither works, and when still not a draft', () => {
  assert.throws(() => toDraft('o/r', { number: 3 }, { call: () => no('HTTP 403: nope'), read: () => { throw new Error('read before failing'); } }),
    /could not make pull request 3 a draft: gh api -X POST: HTTP 403.*; gh api graphql -f: HTTP 403/);
  assert.throws(() => toDraft('o/r', { number: 3 }, { call: () => ok, read: () => ({ draft: false }) }), /still not a draft/);
});

// A run GitHub hides (the suspended account's, copy run 42277392893, 7 Nov) is gone only on GitHub's
// own 404 Not Found while the repository reads; a proxy's or host's error, or a repository the token
// cannot see, is unread (cold review of PR 735's fix).
test('runState: served, gone only on GitHub\'s 404 with the repository readable, else unread', async () => {
  const { runState } = await import('../lib/github.mjs');
  const r404 = { code: 1, stdout: '{"message":"Not Found","documentation_url":"x","status":"404"}', stderr: 'gh: Not Found (HTTP 404)' };
  const ok = { code: 0, stdout: '{}', stderr: '' };
  const io = (run, repo) => ({ run: (a) => (a[1].includes('/actions/runs/') ? run : repo) });
  assert.equal(runState('o/r', 1, io(ok, ok)), 'served');
  assert.equal(runState('o/r', 1, io(r404, ok)), 'gone');
  assert.equal(runState('o/r', 1, io(r404, r404)), null, 'the repository itself unreadable');
  assert.equal(runState('o/r', 1, io({ code: 1, stdout: '', stderr: 'proxy: host not found' }, ok)), null);
  assert.equal(runState('o/r', 1, io({ code: 1, stdout: '', stderr: 'gh: Bad Gateway (HTTP 502)' }, ok)), null);
});

// ===== file: status-acts.test.mjs =====

// BOB's acts first (measured 6 Nov: 8 job PRs sat ready with a red last gate for 2-6 hours unseen,
// copy 569, 570, 493, 549 and 597, printed under idle: around line 288 of about 700 with no act
// named; extraction 432 COMPLETE with its pull request a draft for 20 h). Display only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { commit, entry, makeRepo } from './helpers.mjs';
import { git } from '../lib/util.mjs';
import { actOf, status } from '../lib/status.mjs';

const old = new Date(Date.now() - 4.5 * 36e5).toISOString();
// Jobs on origin, each COMPLETE or WORKING on its branch; their pull requests and gates.
function product(jobs) {
  const root = makeRepo(Object.fromEntries(Object.keys(jobs).map((id) => [`process/ledger/${id}.json`, entry(id, { status: { state: 'OPEN' } })])));
  git(['update-ref', 'refs/remotes/origin/tranche', 'HEAD'], { cwd: root });
  for (const [id, j] of Object.entries(jobs)) {
    git(['checkout', '-q', '-b', `job/${id}`, 'origin/tranche'], { cwd: root });
    commit(root, { [`process/ledger/${id}.json`]: entry(id, { status: { state: j.state } }), [`src/${id}/a.js`]: '1' });
    git(['update-ref', `refs/remotes/origin/job/${id}`, 'HEAD'], { cwd: root });
    git(['checkout', '-q', 'main'], { cwd: root });
  }
  const prs = Object.entries(jobs).map(([id, j], i) => ({ number: 560 + i, head: { ref: `job/${id}`, sha: id }, draft: !!j.draft, updated_at: old }));
  const io = { openPRs: () => prs, checkRun: (slug, sha) => (jobs[sha].gate ? { status: 'completed', conclusion: jobs[sha].gate } : null), compare: () => null, prFiles: () => [] };
  return { root, io };
}
function run(p) {
  const env = process.env.GITHUB_REPOSITORY;
  process.env.GITHUB_REPOSITORY = 'o/r';
  try { const out = []; status(p.root, { role: 'bob', log: (m) => out.push(m), io: p.io }); return out; } finally { if (env === undefined) delete process.env.GITHUB_REPOSITORY; else process.env.GITHUB_REPOSITORY = env; }
}
const section = (out) => { const i = out.indexOf('red gates: act now:'); const j = out.findIndex((l, k) => k > i && !l.startsWith('- ')); return i < 0 ? [] : out.slice(i + 1, j < 0 ? undefined : j); };

test('a ready or COMPLETE job PR whose last gate is red is in BOB\'s first section with its restart, not under idle', () => {
  const out = run(product({ 'agent-worker': { state: 'COMPLETE', gate: 'failure' }, plane: { state: 'WORKING', gate: 'failure', draft: false }, quiet: { state: 'WORKING', gate: 'failure', draft: true } }));
  const s = section(out);
  assert.equal(s.length, 2, out.join('\n'));
  assert.match(s[0], /^- agent-worker: COMPLETE; PR #560 ready, last activity 4\.5h ago; gate failure; BOB's act: gate failure: restart it with the finding: node \.process\/tool\/p3\.mjs job start agent-worker --restart "<the gate's finding>"$/);
  assert.match(s[1], /^- plane: WORKING; PR #561 ready.*job start plane --restart/);
  // A WORKING draft's red gate is the job's own work in progress: no act of BOB's.
  assert.doesNotMatch(s.join('\n'), /quiet/);
  assert.doesNotMatch(out.slice(out.indexOf('idle:')).join('\n'), /agent-worker/);
  // Its first section: ahead of the WORKING draft's own group.
  const other = out.findIndex((l) => /^(blocked|owed|idle|open):$/.test(l));
  assert.ok(other > out.indexOf('red gates: act now:'), out.join('\n'));
});

test('a cancelled last gate names the re-gate as BOB\'s act', () => {
  const s = section(run(product({ ocr: { state: 'COMPLETE', gate: 'cancelled' } })));
  assert.match(s[0], /^- ocr: COMPLETE; PR #560 ready.*; gate cancelled; BOB's act: gate cancelled: re-gate it: re-run its gate run, or give it a new event \(edit the pull request\)$/);
});

test('a COMPLETE job whose pull request is still a draft is an act too (extraction 432)', () => {
  const s = section(run(product({ extraction: { state: 'COMPLETE', draft: true } })));
  assert.match(s[0], /^- extraction: COMPLETE; PR #560 draft.*BOB's act: COMPLETE, its pull request still a draft: restart it so its job complete marks it ready/);
  assert.equal(actOf({ id: 'x', pr: '#1 draft', branch: 'WORKING', ready: false }), null);
  // job complete between its push and its ready: its gate still running is no act yet.
  assert.equal(actOf({ id: 'x', pr: '#1 draft', branch: 'COMPLETE', ready: false, gate: 'in_progress' }), null);
  assert.match(actOf({ id: 'x', pr: '#1 ready', branch: 'COMPLETE', ready: true, gate: 'timed_out' }), /^gate timed_out: restart it/);
  assert.match(actOf({ id: 'x', pr: '#1 ready', ready: true, gate: 'stale' }), /^gate stale: re-gate it/);
  assert.equal(actOf({ id: 'x', pr: 'merged', branch: 'COMPLETE', gate: 'failure' }), null);
});

test('the top lines name the count of acts before any hold or list; none is 0', () => {
  const out = run(product({ a: { state: 'COMPLETE', gate: 'failure' }, b: { state: 'COMPLETE', draft: true }, c: { state: 'COMPLETE', gate: 'success' } }));
  assert.equal(out[0], 'acts now: 2 (a, b): see red gates: act now');
  assert.equal(run(product({ c: { state: 'COMPLETE', gate: 'success' } }))[0], 'acts now: 0');
});

test('under a stopped plan the count follows the plan line and says the acts wait', () => {
  const p = product({ a: { state: 'COMPLETE', gate: 'failure' } });
  commit(p.root, { 'process/config.json': { plan: 'stop' } });
  git(['update-ref', 'refs/remotes/origin/tranche', 'HEAD'], { cwd: p.root });
  const out = run(p);
