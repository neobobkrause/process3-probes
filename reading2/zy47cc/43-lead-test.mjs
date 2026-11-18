// The lead times' findings from the review of PR 70's last fix pass (b33cbd9): each scenario
// below hid an "over" or invented one before its fix.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { commit, makeRepo, onState } from './helpers.mjs';
import { fetchJobs, leadTimes, median } from '../lib/lead.mjs';
import { trancheReport } from '../lib/report.mjs';
import { readState } from '../lib/state.mjs';
import { git, loadConfig } from '../lib/util.mjs';
import { main } from '../p3.mjs';

const U = 'unmeasured';
const pick = ({ minutes, target, mark }) => ({ minutes, target, ...(mark ? { mark } : {}) });
const T0 = Date.parse('2026-11-01T00:00:00Z');
const t = (min) => new Date(T0 + min * 60000).toISOString();
const at = (min, fn) => { const e = { ...process.env }; process.env.GIT_COMMITTER_DATE = process.env.GIT_AUTHOR_DATE = t(min); try { return fn(); } finally { process.env = e; } };
const E = (id, state, more = {}) => ({ [`process/ledger/${id}.json`]: { id, status: { state, ...(state === 'BLOCKED' ? { reason: 'x' } : {}) }, ...more } });
const start = (m, min, attempt) => ({ at: t(min), module: m, row: 'attempt', event: 'start', ...(attempt ? { attempt } : {}) });
const complete = (m, min, pr, attempt) => ({ at: t(min), module: m, row: 'attempt', event: 'complete', pr, ...(attempt ? { attempt } : {}) });
const merge = (m, min, pr) => ({ at: t(min), module: m, row: 'merge', pr });
const opened = (min = 0) => [{ row: 'grant', tranche: 'tranche', at: t(min), outcome: 'ok' }];

function withOrigin() {
  const root = at(-100000, () => makeRepo({ 'README.md': 'x', 'CLAUDE.md': 'Bob\'s approvals\n', 'process/config.json': { tranche: 'tranche' } }));
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  git(['fetch', '-q', 'origin'], { cwd: root });
  return { root, bare };
}

// A job branch off the tranche: commits at the minutes given, pushed, then back on the tranche.
function onJob(root, id, steps, { from = 'tranche' } = {}) {
  git(['checkout', '-q', '-B', `job/${id}`, from], { cwd: root });
  for (const [min, files] of steps) at(min, () => commit(root, files, `${id} at ${min}`));
  git(['push', '-q', '-f', 'origin', `job/${id}`], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
}
const mergeJob = (root, id, min) => at(min, () => git(['merge', '-q', '--no-ff', `job/${id}`, '-m', `Merge job/${id}`], { cwd: root }));

async function cli(root, argv, env = {}) {
  const cwd = process.cwd();
  const old = { log: console.log, err: console.error, env: { ...process.env } };
  const lines = [];
  console.log = (...x) => lines.push(x.join(' '));
  console.error = (...x) => lines.push(x.join(' '));
  Object.assign(process.env, env);
  try { process.chdir(root); const code = await main(argv); return { code, out: lines.join('\n') }; } finally { process.chdir(cwd); console.log = old.log; console.error = old.err; process.env = old.env; }
}

test('finding 1: only this tranche counts: an old module and its BLOCKED time and messages from before the opening are left out', () => {
  const { root } = withOrigin();
  const cfg = loadConfig(root);
  // old: days ago, 300 min BLOCKED on the tranche, green 120 min before its merge, a message never answered.
  at(-5000, () => commit(root, E('old', 'BLOCKED'), 'old blocked'));
  at(-4700, () => commit(root, E('old', 'COMPLETE'), 'old done'));
  // a: now, quick.
  onJob(root, 'a', [[2, E('a', 'WORKING')]]);
  mergeJob(root, 'a', 12);
  const rows = [start('old', -5100), complete('old', -4900, 3), merge('old', -4680, 3), start('a', 1), complete('a', 5, 4), merge('a', 12, 4)];
  const gates = { 3: [{ ok: true, at: t(-4800) }], 4: [{ ok: true, at: t(6) }] };
  const lt = leadTimes(root, cfg, {
    ref: 'HEAD', rows, grants: opened(0), closed: [], restarts: [], jobRefs: new Map([['old', 'HEAD'], ['a', 'refs/remotes/origin/job/a']]), now: t(20),
    msgs: [{ from: 'old', n: 1, to: 'bob', at: t(-4950), text: 'stuck' }], comments: (pr) => gates[pr],
  });
  assert.deepEqual(lt.jobs.map((j) => j.module), ['a'], 'old started before the opening');
  assert.equal(lt.summary.green_to_merge.worst_mark, undefined);
  assert.equal(lt.summary.green_to_merge.worst, 6);
  assert.equal(lt.summary.replace, U, 'no stop in this tranche');
  assert.equal(lt.summary.report_wait, U, 'no message in this tranche');
  assert.equal(lt.jobs[0].report_wait, 'none');
  assert.deepEqual(lt.jobs[0].blocked, { minutes: 0 });
  // A module BLOCKED from before the opening into it counts from the opening only.
  at(-60, () => commit(root, E('b', 'BLOCKED'), 'b blocked before'));
  at(30, () => commit(root, E('b', 'WORKING'), 'b again'));
  const b = leadTimes(root, cfg, { ref: 'HEAD', rows: [start('b', 40)], grants: opened(0), jobRefs: new Map([['b', 'HEAD']]), now: t(50) });
  assert.deepEqual(b.jobs[0].blocked, { minutes: 30 });
  // The opening not read: nothing can be scoped, so every figure is unmeasured, never all of history.
  const none = leadTimes(root, cfg, { ref: 'HEAD', rows, now: t(20), comments: (pr) => gates[pr] });
  assert.equal(none.opened, U);
  assert.equal(none.jobs, U);
  assert.equal(none.summary.green_to_merge, U);
});

test('finding 2: each attempt is measured, and the job shows its worst; ready unknown is unmeasured, never the oldest start', () => {
  const { root } = withOrigin();
  const cfg = loadConfig(root);
  const rows = [start('m', 0, 1), complete('m', 10, 5, 1), merge('m', 12, 5), start('m', 100, 2), complete('m', 110, 6, 2), merge('m', 270, 6)];
  const gates = { 5: [{ ok: true, at: t(11) }], 6: [{ ok: true, at: t(111) }] };
  const lt = leadTimes(root, cfg, { ref: 'HEAD', rows, layers: new Map([['m', 2], ['n', 1]]), grants: opened(0), closed: [], now: t(300), comments: (pr) => gates[pr] });
  const m = lt.jobs[0];
  assert.deepEqual(m.green_to_merge, { minutes: 159, target: 15, mark: 'over', attempt: 2 });
  assert.deepEqual(m.attempts.map((a) => a.green_to_merge.minutes), [1, 159]);
  assert.deepEqual(m.start_to_pr_ready, { minutes: 10, attempt: 1 });
  // Layer 1 not closed: m's layer has not opened, so ready to start is unmeasured.
  assert.equal(m.ready_to_start, U);
  assert.equal(lt.summary.green_to_merge.worst_mark, 'over');
});

test('finding 3: an open figure counts in the worst, marked open, and stays out of the median', () => {
  const { root } = withOrigin();
  const cfg = loadConfig(root);
  const lt = leadTimes(root, cfg, { ref: 'HEAD', rows: [start('j', 0), complete('j', 5, 8)], grants: opened(0), now: t(300), comments: () => [{ ok: true, at: t(10) }] });
  assert.deepEqual(lt.jobs[0].green_to_merge, { minutes: 290, open: true, note: 'not merged', target: 15, mark: 'over', attempt: 1 });
  assert.deepEqual(lt.summary.green_to_merge, { n: 0, open: 1, median: U, worst: 290, worst_open: true, target: 15, worst_mark: 'over' });
  // Not green yet: no figure, and no gate row read: unmeasured.
  assert.equal(leadTimes(root, cfg, { ref: 'HEAD', rows: [start('j', 0), complete('j', 5, 8)], grants: opened(0), now: t(300), comments: () => [{ ok: false, at: t(10) }] }).jobs[0].green_to_merge, 'not green');
  assert.equal(leadTimes(root, cfg, { ref: 'HEAD', rows: [start('j', 0), complete('j', 5, 8)], grants: opened(0), now: t(300), comments: () => null }).jobs[0].green_to_merge, U);
});

test('finding 4: a tranche commit to the entry does not end a BLOCKED still running on the job branch', () => {
  const { root } = withOrigin();
  const cfg = loadConfig(root);
  at(-10, () => commit(root, E('x', 'WORKING'), 'x working'));
  onJob(root, 'x', [[20, E('x', 'BLOCKED')]]);
  at(40, () => commit(root, E('x', 'WORKING', { checks: ['bob edited'] }), 'BOB edits x checks'));
  onJob(root, 'x', [[100, E('x', 'WORKING')]], { from: 'job/x' });
  mergeJob(root, 'x', 120);
  // After the merge the tranche's history governs: BLOCKED there from 150 to 170.
  at(150, () => commit(root, E('x', 'BLOCKED'), 'x blocked on tranche'));
  at(170, () => commit(root, E('x', 'COMPLETE'), 'x done'));
  const lt = leadTimes(root, cfg, { ref: 'HEAD', rows: [start('x', 0), complete('x', 110, 9), merge('x', 120, 9)], grants: opened(0), restarts: [], jobRefs: new Map([['x', 'refs/remotes/origin/job/x']]), now: t(200) });
  assert.deepEqual(lt.jobs[0].blocked, { minutes: 100 });
  assert.deepEqual(lt.jobs[0].replace.map((r) => [r.from, r.minutes]), [[t(20), 80], [t(150), 20]]);
});

test('finding 5: no job ref, a shallow clone and a stale ref read unmeasured or are fetched fresh, never 0 or open', async () => {
  const { root, bare } = withOrigin();
  const cfg = loadConfig(root);
  at(-10, () => commit(root, E('x', 'WORKING'), 'x working'));
  onJob(root, 'x', [[20, E('x', 'BLOCKED')], [60, E('x', 'WORKING')]]);
  mergeJob(root, 'x', 80);
  const rows = [start('x', 0), complete('x', 70, 9), merge('x', 80, 9)];
  at(81, () => commit(root, { 'process/metrics/x.jsonl': rows.map((r) => JSON.stringify(r)).join('\n') + '\n' }, 'rows'));
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  onState(root, { 'metrics/tranche-open.jsonl': JSON.stringify(opened(0)[0]) + '\n' });
  git(['push', '-q', 'origin', 'refs/remotes/origin/process-state:refs/heads/process-state'], { cwd: root });
  const base = { ref: 'HEAD', rows, grants: opened(0), restarts: [], now: t(100) };
  // No job ref (origin has none, or unread): unmeasured, not 0.
  assert.equal(leadTimes(root, cfg, { ...base, jobRefs: new Map([['x', null]]) }).jobs[0].blocked, U);
  assert.equal(leadTimes(root, cfg, base).jobs[0].blocked, U);
  assert.deepEqual(leadTimes(root, cfg, { ...base, jobRefs: new Map([['x', 'refs/remotes/origin/job/x']]) }).jobs[0].blocked, { minutes: 40 });
  // A stale ref: local origin/job/x still at the BLOCKED commit, origin's moved on. fetchJobs reads it fresh.
  git(['update-ref', 'refs/remotes/origin/job/x', 'job/x~1'], { cwd: root });
  assert.equal(leadTimes(root, cfg, { ...base, rows: [start('x', 0)], jobRefs: new Map([['x', 'refs/remotes/origin/job/x']]) }).jobs[0].blocked.open, true, 'the scenario: a stale ref keeps it open');
  const refs = fetchJobs(root, ['x', 'gone']);
  assert.deepEqual([...refs], [['gone', null], ['x', 'refs/remotes/origin/job/x']]);
  assert.deepEqual(leadTimes(root, cfg, { ...base, rows: [start('x', 0)], jobRefs: refs }).jobs[0].blocked, { minutes: 40 });
  // A local ref origin no longer has stands for nothing.
  git(['update-ref', 'refs/remotes/origin/job/gone', 'job/x~1'], { cwd: root });
  assert.equal(fetchJobs(root, ['gone']).get('gone'), null);
  // A shallow clone: the entry's history cut after the opening reads unmeasured, never 0 ...
  const clone = join(mkdtempSync(join(tmpdir(), 'p3-shallow-')), 'c');
  git(['clone', '-q', '--depth', '1', '--no-single-branch', '--branch', 'tranche', `file://${bare}`, clone], { cwd: root });
  git(['config', 'user.email', 'noreply@github.com'], { cwd: clone });
  git(['config', 'user.name', 'Test'], { cwd: clone });
  assert.equal(leadTimes(clone, cfg, { ...base, ref: 'origin/tranche', jobRefs: new Map([['x', 'refs/remotes/origin/job/x']]) }).jobs[0].blocked, U);
  // ... and metrics report and report tranche fetch the job branch and deepen, and measure it.
  const mr = await cli(clone, ['metrics', 'report'], { GITHUB_REPOSITORY: 'o/r' });
  assert.deepEqual(JSON.parse(mr.out).lead_times.jobs[0].blocked, { minutes: 40 });
  const rt = await cli(clone, ['report', 'tranche'], { GITHUB_REPOSITORY: 'o/r' });
  assert.match(rt.out, /\| x \| unmeasured \| 70 min \(attempt 1\) \| unmeasured \| 40 min \|/);
});

