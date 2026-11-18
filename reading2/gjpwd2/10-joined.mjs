// ===== file: measures.test.mjs (continued) =====

  assert.equal(t.prs.find((p) => p.pr === 4).main, 'not merged there');
  assert.equal(t.pending_younger, 0);
  // A merge row whose merge commit the clone lacks is unmeasured, never counted as survived.
  commit(root, { 'process/metrics/e.jsonl': JSON.stringify({ at: new Date(Date.now() - 30 * DAY).toISOString(), module: 'e', row: 'merge', pr: 9 }) + '\n' }, 'row only');
  assert.equal(survivalReport(root, { branch: 'tranche', days: 14 }).prs.find((p) => p.pr === 9).survived, 'unmeasured');
});

test('bob wake --stateless prints the fresh BOB\'s call and its size, writing nothing; metrics wake records one wake', () => {
  const root = withOrigin();
  recordStart(root, 'root', R, { log: quiet });
  const before = git(['rev-parse', 'refs/remotes/origin/process-state'], { cwd: root });
  const out = [];
  const w = statelessWake(root, { slug: 'o/r', offline: true, live: 1, log: (l) => out.push(l) });
  assert.match(w.prompt, /^# BOB, one stateless wake/);
  assert.match(w.prompt, /## CLAUDE\.md\n\nBob's approvals/);
  assert.match(w.prompt, /## status --role bob\n\n[\s\S]*reading set for bob: \d+ bytes/);
  assert.match(w.prompt, /ROOT, session `session_root1`/);
  assert.equal(w.bytes, Buffer.byteLength(w.prompt));
  assert.equal(w.call.prompt, w.prompt);
  assert.equal(w.call.source_url, 'https://github.com/o/r');
  assert.equal(w.call.clone_depth, 1);
  assert.ok(out.includes(`prompt: ${w.bytes} bytes`));
  assert.equal(git(['rev-parse', 'refs/remotes/origin/process-state'], { cwd: root }), before);
  assert.equal(git(['status', '--porcelain'], { cwd: root }), '');
  recordWake(root, { session: 'session_s1', tokens: '1200', usd: '0.4', mode: 'stateless' });
  recordWake(root, { session: 'session_b1', tokens: 9000, usd: 2, mode: 'resident' });
  const rows = readRows(root, null, WAKES_FILE);
  assert.deepEqual(rows.map((r) => [r.row, r.mode, r.tokens, r.cost_usd]), [['wake', 'stateless', 1200, 0.4], ['wake', 'resident', 9000, 2]]);
  const cmp = wakes(rows);
  assert.equal(cmp.stateless.mean_tokens, 1200);
  assert.equal(cmp.resident.mean_usd, 2);
  assert.equal(wakes([]).stateless, 'unmeasured');
  git(['add', '-A'], { cwd: root });
  git(['commit', '-q', '-m', 'wake rows'], { cwd: root });
  assert.equal(report(root, 'o/r', 'HEAD', { read: { comments: () => [], getPR: () => null } }).wakes.resident.wakes, 1);
  for (const bad of [{ mode: 'warm' }, { tokens: 'many' }, { usd: true }, { session: 'bob' }]) {
    assert.throws(() => recordWake(root, { session: 'session_s1', tokens: 1, usd: 1, mode: 'stateless', ...bad }), /a wake needs/);
  }
});

// Findings from the review of PR 70: the command line, a shallow clone, and the lead times.
import { main } from '../p3.mjs';
import { leadTimes, reportWaits } from '../lib/lead.mjs';
import { trancheReport } from '../lib/report.mjs';
import { loadConfig } from '../lib/util.mjs';
const pick = ({ minutes, target, mark }) => ({ minutes, target, ...(mark ? { mark } : {}) });

async function cli(root, argv, env = {}) {
  const cwd = process.cwd();
  const old = { log: console.log, err: console.error, env: { ...process.env } };
  const lines = [];
  console.log = (...x) => lines.push(x.join(' '));
  console.error = (...x) => lines.push(x.join(' '));
  Object.assign(process.env, env);
  try { process.chdir(root); const code = await main(argv); return { code, out: lines.join('\n') }; } finally { process.chdir(cwd); console.log = old.log; console.error = old.err; process.env = old.env; }
}

test('the command line: sweep --context, metrics wake, metrics survival and bob wake --stateless', async () => {
  const root = withOrigin();
  recordStart(root, 'root', R, { log: quiet });
  assert.equal((await cli(root, ['sweep', '--session', R, '--live', '1', '--context', '33', '--offline'])).code, 0);
  assert.equal(JSON.parse(readState(root, 'process-state', SWEEP_ROWS_FILE).trim().split('\n').at(-1)).root_context, 33);
  const w = await cli(root, ['metrics', 'wake', '--session', 'session_s1', '--tokens', '10', '--usd', '0.5', '--mode', 'stateless']);
  assert.equal(w.code, 0);
  assert.deepEqual(['session', 'tokens', 'cost_usd', 'mode'].map((k) => JSON.parse(w.out)[k]), ['session_s1', 10, 0.5, 'stateless']);
  assert.equal((await cli(root, ['metrics', 'wake', '--session', 'session_s1', '--tokens', '10', '--mode', 'stateless'])).code, 1);
  const s = await cli(root, ['metrics', 'survival']);
  assert.equal(s.code, 0);
  assert.equal(JSON.parse(s.out).days, 14);
  assert.equal(JSON.parse((await cli(root, ['metrics', 'survival', '--days', '3', '--offline'])).out).days, 3);
  assert.match((await cli(root, ['metrics', 'survival', '--days', 'soon'])).out, /--days <n>/);
  const b = await cli(root, ['bob', 'wake', '--stateless', '--offline', '--live', '1'], { GITHUB_REPOSITORY: 'o/r' });
  assert.equal(b.code, 0);
  assert.match(b.out, /prompt: \d+ bytes[\s\S]*"source_url": "https:\/\/github.com\/o\/r"/);
  assert.equal((await cli(root, ['bob', 'wake'], { GITHUB_REPOSITORY: 'o/r' })).code, 1);
});

test('metrics survival in a shallow clone: unmeasured offline, measured once it fetches the history whole', async () => {
  const src = makeRepo({ 'README.md': 'x', 'process/config.json': { tranche: 'tranche' } });
  git(['branch', 'tranche'], { cwd: src });
  git(['checkout', '-q', 'tranche'], { cwd: src });
  mergeJob(src, 'a', 1, 20, { 'src/a.js': 'one\n' });
  commit(src, { 'later.txt': 'x' }, 'later');
  git(['branch', '-f', 'main', 'tranche'], { cwd: src });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: src });
  git(['push', '-q', bare, 'main', 'tranche'], { cwd: src });
  const clone = join(mkdtempSync(join(tmpdir(), 'p3-shallow-')), 'c');
  git(['clone', '-q', '--depth', '2', '--branch', 'tranche', `file://${bare}`, clone], { cwd: src }); // the merge commit, its parents cut
  const off = JSON.parse((await cli(clone, ['metrics', 'survival', '--offline'])).out);
  assert.deepEqual(off.prs.map((p) => [p.pr, p.survived]), [[1, 'unmeasured']]);
  assert.match(off.prs[0].why, /shallow/);
  const on = JSON.parse((await cli(clone, ['metrics', 'survival'])).out);
  assert.deepEqual(on.prs.map((p) => [p.pr, p.tranche, p.main, p.survived]), [[1, 'stands', 'stands', true]]);
});

test('lead times: each figure from its rows, beside its target, over marked, unmeasured where a row is missing', async () => {
  const root = withOrigin();
  const t = (min) => new Date(Date.parse('2026-11-01T00:00:00Z') + min * 60000).toISOString();
  const at = (min, fn) => { const e = { ...process.env }; process.env.GIT_COMMITTER_DATE = process.env.GIT_AUTHOR_DATE = t(min); try { fn(); } finally { process.env = e; } };
  at(0, () => commit(root, { 'process/ledger/a.json': { id: 'a', status: { state: 'WORKING' } } }, 'a working'));
  at(40, () => commit(root, { 'process/ledger/a.json': { id: 'a', status: { state: 'BLOCKED', reason: 'x' } } }, 'a blocked'));
  at(85, () => commit(root, { 'process/ledger/a.json': { id: 'a', status: { state: 'WORKING' } } }, 'a again'));
  const rows = [
    { at: t(5), module: 'a', row: 'attempt', event: 'start' }, { at: t(100), module: 'a', row: 'attempt', event: 'complete', pr: 7 },
    { at: t(130), module: 'a', row: 'merge', pr: 7 }, { at: t(70), module: 'b', row: 'attempt', event: 'start' },
    { at: t(120), module: 'c', row: 'attempt', event: 'start' },
  ];
  // c is BLOCKED on its own job branch (job block commits there), not merged: open, counted to now.
  const back = git(['rev-parse', 'HEAD'], { cwd: root });
  at(150, () => commit(root, { 'process/ledger/c.json': { id: 'c', status: { state: 'BLOCKED', reason: 'x' } } }, 'c blocked'));
  git(['update-ref', 'refs/remotes/origin/job/c', 'HEAD'], { cwd: root });
  git(['reset', '-q', '--hard', back], { cwd: root });
  const cfg = loadConfig(root);
  const lt = leadTimes(root, cfg, {
    ref: 'HEAD', rows, layers: new Map([['a', 1], ['b', 2]]), now: t(200), restarts: [],
    jobRefs: new Map([['a', 'HEAD'], ['b', 'HEAD'], ['c', 'refs/remotes/origin/job/c']]),
    grants: [{ row: 'grant', tranche: 'tranche', at: t(1), outcome: 'ok' }, { row: 'grant', tranche: 'tranche', at: t(3), outcome: 'refused' }], closed: [{ row: 'closed', tranche: 'tranche', layer: 1, at: t(50) }],
    msgs: [{ from: 'a', n: 1, to: 'bob', at: t(10), text: 'report' }, { from: 'bob', n: 1, to: 'a', at: t(50), text: 'a-1: done' }, { from: 'a', n: 2, to: 'bob', at: t(150), text: 'again' }],
    comments: () => [{ ok: false, at: t(105) }, { ok: true, at: t(110) }],
  });
  const a = lt.jobs.find((j) => j.module === 'a');
  const b = lt.jobs.find((j) => j.module === 'b');
  assert.deepEqual(pick(a.ready_to_start), { minutes: 4, target: 10 });
  assert.deepEqual(a.start_to_pr_ready, { minutes: 95, attempt: 1 });
  assert.deepEqual(a.green_to_merge, { minutes: 20, target: 15, mark: 'over', attempt: 1 });
  assert.deepEqual(a.blocked, { minutes: 45 }, 'blocked has no target: replace has');
  assert.deepEqual(a.replace, [{ from: t(40), minutes: 45, stopped_by: 'BLOCKED', source: 'blocked', resumed: t(85), target: 30, mark: 'over' }]);
  assert.deepEqual(a.report_wait, [{ from: 'a', n: 1, to: 'bob', minutes: 40, target: 30, mark: 'over' }, { from: 'a', n: 2, to: 'bob', minutes: 50, open: true, target: 30, mark: 'over' }]);
  assert.deepEqual(pick(b.ready_to_start), { minutes: 20, target: 10, mark: 'over' });
  assert.deepEqual(lt.jobs.find((j) => j.module === 'c').blocked, { minutes: 50, open: true });
  assert.deepEqual(lt.close_to_next_start, [{ layer: 1, minutes: 20, target: 10, mark: 'over' }]);
  assert.equal(a.ready_to_start.minutes, 4, 'from the last ok grant row, not the refused one');
  assert.deepEqual(lt.summary.green_to_merge, { n: 1, median: 20, worst: 20, target: 15, median_mark: 'over', worst_mark: 'over' });
  assert.equal(lt.summary.report_wait.n, 1, 'an open wait is not in the median');
  assert.equal(lt.targets.merge_minutes, 15);
  // Rows missing: the opening read, but no layer close, message or gate row, nor a job branch.
  const none = leadTimes(root, cfg, { ref: 'HEAD', rows, layers: new Map([['a', 2], ['b', 1]]), grants: [{ row: 'grant', tranche: 'tranche', at: t(1), outcome: 'ok' }], comments: () => { throw new Error('offline'); } });
  assert.equal(none.jobs[0].ready_to_start, 'unmeasured');
  assert.equal(none.jobs[0].green_to_merge, 'unmeasured');
  assert.equal(none.jobs[0].report_wait, 'unmeasured');
  assert.equal(none.jobs[0].blocked, 'unmeasured');
  assert.equal(none.jobs[0].replace, 'unmeasured');
  assert.equal(none.close_to_next_start, 'unmeasured');
  // process/config.json's targets: a partial one keeps the other defaults.
  commit(root, { 'process/config.json': { tranche: 'tranche', targets: { merge_minutes: 45 } } }, 'targets');
  assert.deepEqual(loadConfig(root).targets, { start_minutes: 10, merge_minutes: 45, decision_minutes: 30, replace_minutes: 30 });
  commit(root, { 'process/config.json': { tranche: 'tranche' } }, 'targets back');
  // A target from process/config.json replaces its default.
  assert.equal(leadTimes(root, { ...cfg, targets: { ...cfg.targets, merge_minutes: 30 } }, { ref: 'HEAD', rows, grants: [{ row: 'grant', tranche: 'tranche', at: t(1), outcome: 'ok' }], comments: () => [{ ok: true, at: t(110) }] }).jobs[0].green_to_merge.mark, undefined);
  assert.equal(reportWaits([{ from: 'bob', n: 3, to: 'root', at: t(0) }, { from: 'root', n: 1, to: 'bob', at: t(5), text: 'bob-3 ok' }], t(9))[0].minutes, 5);
  // Both reports print them.
  commit(root, { 'process/metrics/a.jsonl': rows.map((r) => JSON.stringify(r)).join('\n') + '\n' }, 'rows');
  git(['push', '-q', 'origin', 'HEAD:tranche'], { cwd: root });
  git(['fetch', '-q', 'origin'], { cwd: root });
  const md = trancheReport(root, cfg, { now: t(200), io: { merged: () => null, comments: () => [], compare: () => null } });
  assert.match(md, /## Lead times[\s\S]*Per job: unmeasured \(the tranche's opening not read\)/);
  assert.match(md, /- green to merge: unmeasured/);
  // With the state branch read, each report measures from its rows: this tranche's open and a layer close.
  const sha = git(['rev-parse', 'HEAD'], { cwd: root });
  onState(root, {
    'metrics/tranche-open.jsonl': JSON.stringify({ row: 'grant', tranche: 'tranche', at: t(1), outcome: 'ok', act: 'push', depth: 1 }) + '\n',
    'layers/closed.jsonl': JSON.stringify({ row: 'closed', tranche: 'tranche', layer: 1, at: t(50), commit: sha }) + '\n',
  });
  commit(root, { 'build/layers.md': '| 1 | a |\n| 2 | b |\n' }, 'layers');
  git(['push', '-q', 'origin', 'HEAD:tranche'], { cwd: root });
  git(['push', '-q', 'origin', 'refs/remotes/origin/process-state:refs/heads/process-state'], { cwd: root });
  git(['fetch', '-q', 'origin'], { cwd: root });
  const md2 = trancheReport(root, cfg, { now: t(200), stateRead: true, io: { state: (p) => readState(root, 'process-state', p), merged: () => null, comments: () => [], compare: () => null } });
  assert.match(md2, /\| a \| 4 min \(target 10\) \|/);
  assert.match(md2, /layer close to next job start: layer 1 20 min \(target 10, over\)/);
  const mr = await cli(root, ['metrics', 'report'], { GITHUB_REPOSITORY: 'o/r' });
  const lead = JSON.parse(mr.out).lead_times;
  assert.deepEqual(pick(lead.jobs.find((j) => j.module === 'a').ready_to_start), { minutes: 4, target: 10 });
  assert.deepEqual(lead.close_to_next_start, [{ layer: 1, minutes: 20, target: 10, mark: 'over' }]);
});

// ===== file: fresh-branch.test.mjs =====

import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { jobComplete, jobStart } from '../lib/job.mjs';
import { gate } from '../lib/gate.mjs';
import { branchModule, jobBranch, readEntry, startBranch } from '../lib/ledger.mjs';
import { regenerate } from '../lib/checks.mjs';
import { readRows } from '../lib/metrics.mjs';
import { git } from '../lib/util.mjs';
import { commit, entry, makeRepo } from './helpers.mjs';

const quiet = () => {};
const passing = "import test from 'node:test'; test('ok', () => {});\n";

function product(extra = {}) {
  const root = makeRepo({
    'process/ledger/alpha.json': entry('alpha'),
    'req/alpha.md': '# alpha\n\nR1 does a thing.\n',
    'test/alpha/a.test.mjs': passing,
    ...extra,
  });
  git(['branch', 'tranche'], { cwd: root });
  return root;
}

test('jobBranch, branchModule and startBranch: job/<id>, or the highest job/<id>-<n> that is not itself a module', () => {
  const ids = new Set(['alpha', 'alpha-3', 'beta']);
  assert.equal(jobBranch('alpha', ['job/alpha'], ids), 'job/alpha');
  assert.equal(jobBranch('alpha', ['job/alpha', 'job/alpha-2', 'job/alpha-3', 'job/beta-4'], ids), 'job/alpha-2');
  assert.equal(jobBranch('alpha', ['job/alpha', 'job/alpha-2', 'job/alpha-4'], ids), 'job/alpha-4');
  assert.equal(branchModule('job/alpha-2', ids), 'alpha');
  assert.equal(branchModule('job/alpha-3', ids), 'alpha-3', 'a module of that name keeps its branch');
  assert.equal(branchModule('job/alpha', ids), 'alpha');
  assert.equal(branchModule('main', ids), null);
  assert.equal(startBranch([{ row: 'attempt', event: 'start', branch: 'job/alpha-2' }, { row: 'attempt', event: 'start', branch: 'job/alpha' }], 'alpha'), 'job/alpha');
  // A row from before 5 Nov on job/<id> named no branch: still job/<id>.
  assert.equal(startBranch([{ row: 'attempt', event: 'start', branch: 'job/alpha-2' }, { row: 'attempt', event: 'start' }], 'alpha'), 'job/alpha');
  // Copy PR 454: attempt 4 moved to job/ai-accounts-2 (--fresh-branch); attempt 5's --again row, written before
  // every start row named its branch, named none: it continues the branch before it.
  assert.equal(startBranch([{ row: 'attempt', event: 'start', attempt: 4, branch: 'job/alpha-2', fresh: { from: 'job/alpha' } }, { row: 'attempt', event: 'start', attempt: 5, again: { pr: 454 } }], 'alpha'), 'job/alpha-2');
  assert.equal(startBranch([{ row: 'attempt', event: 'start' }], 'alpha'), 'job/alpha');
  assert.equal(startBranch([{ row: 'attempt', event: 'start' }, { row: 'attempt', event: 'start', branch: 'job/alpha-2' }], 'alpha'), 'job/alpha-2');
});

test('job start --fresh-branch cuts the next free job/<id>-<n> from the tranche, keeps the old branch, and names both and why in the start row', () => {
  const root = product({ 'process/ledger/alpha-2.json': entry('alpha-2'), 'req/alpha-2.md': '# a2\n', 'test/alpha-2/a.test.mjs': passing });
  assert.throws(() => jobStart(root, 'alpha', { coordinator: 's', fresh: 'x', push: false, log: quiet }), /no branch job\/alpha/);
  jobStart(root, 'alpha', { coordinator: 's', push: false, log: quiet });
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  commit(root, { 'src/alpha/big.bin': 'too big\n' });
  const old = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  assert.throws(() => jobStart(root, 'alpha', { coordinator: 's', fresh: true, push: false, log: quiet }), /--fresh-branch needs why/);
  const r = jobStart(root, 'alpha', { coordinator: 's', fresh: 'job/alpha holds a 7 MB file', push: false, log: quiet });
  assert.equal(r.attempt, 2);
  assert.match(r.start, /Your branch is `job\/alpha-3`/, 'alpha-2 is a module: its suffix is skipped');
  assert.match(r.start, /job\/alpha-3/);
  assert.equal(git(['rev-parse', 'job/alpha'], { cwd: root }), old, 'the old branch is left as it was');
  assert.equal(git(['merge-base', '--is-ancestor', old, 'job/alpha-3'], { cwd: root, allowFail: true }).code, 1, 'the new branch holds none of it');
  git(['checkout', '-q', 'job/alpha-3'], { cwd: root });
  assert.equal(readEntry(root, 'alpha').status.state, 'WORKING');
  const row = readRows(root, 'alpha').pop();
  assert.deepEqual([row.branch, row.fresh], ['job/alpha-3', { from: 'job/alpha', why: 'job/alpha holds a 7 MB file' }]);
  // job complete finds the job by the branch its latest start row names.
  commit(root, { 'src/alpha/index.mjs': 'export const x = 1;\n' });
  assert.equal(jobComplete(root, 'alpha', { push: false, log: quiet }).ok, true);
  git(['checkout', '-q', 'main'], { cwd: root });
  // A later fresh start reads the latest branch and takes the next free suffix after it.
  const r2 = jobStart(root, 'alpha', { coordinator: 's', fresh: 'again', push: false, log: quiet });
  assert.match(r2.start, /Your branch is `job\/alpha-4`/);
  assert.equal(r2.attempt, 3, 'the attempt follows the old branch\'s highest');
  git(['checkout', '-q', 'job/alpha-4'], { cwd: root });
  assert.equal(readRows(root, 'alpha').pop().fresh.from, 'job/alpha-3');
});

test('the gate finds the job by its fresh branch, and refuses a branch its latest start row does not name', () => {
  const root = makeRepo({ 'process/ledger/alpha.json': entry('alpha', { status: { state: 'WORKING' } }), 'src/alpha/index.mjs': 'export const x = 1;\n' });
  git(['branch', 'tranche'], { cwd: root });
  const base = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', '-b', 'job/alpha-2'], { cwd: root });
  const row = (b) => `${JSON.stringify({ row: 'attempt', event: 'start', role: 'job', attempt: 2, ...(b ? { branch: b } : {}) })}\n`;
  const io = { comments: () => [], getPR: () => ({ user: { login: 'x' } }), addComment: () => ({}) };
  const run = (head, branch) => gate(root, { base, head, branch, slug: 'o/r', io, log: quiet, draft: true });
  const named = commit(root, { 'process/metrics/alpha.jsonl': row('job/alpha-2') });
  assert.deepEqual(run(named, 'job/alpha-2').findings.filter((f) => f.check === 'ledger'), []);
  const other = commit(root, { 'process/metrics/alpha.jsonl': row('job/alpha-2') + row(null) });
  assert.match(run(other, 'job/alpha-2').findings.find((f) => f.check === 'ledger')?.message || '', /not job alpha's branch: its latest start row names job\/alpha/);
});

test('a failed verify logs the last 40 lines of its stdout and stderr, and every regenerated row is logged', () => {
  const root = makeRepo({ 'gen/a.mjs': 'old\n', 'gen/b.mjs': 'same\n' });
  const out = Array.from({ length: 60 }, (_, i) => `out ${i}`).join('\n');
  // a's regenerate writes new bytes and its verify fails; b's leaves its file as it was.
  const exec = (cmd, args) => {
    if (cmd === 'regen') { if (args[0] === 'a') writeFileSync(join(root, 'gen/a.mjs'), 'new\n'); return { code: 0, stdout: '', stderr: '' }; }
    return { code: 1, stdout: out, stderr: 'AssertionError: expected 2\n    at x.test.mjs:3' };
  };
  const rows = ['a', 'b'].map((x) => ({ paths: [`gen/${x}.mjs`], regenerate: ['regen', x], verify: ['verify', x] }));
  const log = [];
  const g = regenerate(root, rows, { timeout: 60000, exec, log: (l) => log.push(l) });
  const text = log.join('\n');
  assert.equal(g.ran.length, 2);
  assert.match(text, /verify a failed \(exit 1\) after regenerating gen\/a\.mjs:\nstdout, failure lines and last 40 lines:\nout 20\n/);
  assert.doesNotMatch(text, /\nout 19\n/);
  assert.match(text, /stderr, failure lines and last 40 lines:\nAssertionError: expected 2\n {4}at x\.test\.mjs:3/);
  assert.match(text, /generated, regenerated: gen\/a\.mjs: changed, verify a: exit 1/);
  assert.match(text, /generated, regenerated: gen\/b\.mjs: unchanged/);
});

test('a failed verify keeps its failure lines in the log and names the first in its finding', () => {
  const root = makeRepo({ 'gen/a.mjs': 'old\n' });
  const out = ['TAP version 13', 'not ok 1 - bundles match program.mjs', ...Array.from({ length: 50 }, (_, i) => `# line ${i}`)].join('\n');
  const exec = (cmd) => (cmd === 'regen' ? (writeFileSync(join(root, 'gen/a.mjs'), 'new\n'), { code: 0, stdout: '', stderr: '' }) : { code: 1, stdout: out, stderr: '' });
  const log = [];
  const g = regenerate(root, [{ paths: ['gen/a.mjs'], regenerate: ['regen'], verify: ['verify'] }], { timeout: 60000, exec, log: (l) => log.push(l) });
  assert.match(log.join('\n'), /lines:\nnot ok 1 - bundles match program\.mjs\n# line 10\n/);
  assert.equal(g.findings[0].message, 'verify failed (exit 1) after regenerating: not ok 1 - bundles match program.mjs');
});

test('a committed generated file its regenerate changes is stale at the commit: a finding naming it and the command; a built one is not (copy, 6 Nov: order.mjs)', () => {
  const root = makeRepo({ 'gen/order.mjs': 'old\n', 'gen/same.mjs': 'same\n', '.gitignore': '/built/\n' });
  const exec = (cmd, args) => {
    if (cmd === 'regen' && args[0] === 'order') writeFileSync(join(root, 'gen/order.mjs'), 'new\n');
    if (cmd === 'regen' && args[0] === 'built') { mkdirSync(join(root, 'built'), { recursive: true }); writeFileSync(join(root, 'built/b.mjs'), 'b\n'); }
    return { code: 0, stdout: '', stderr: '' };
  };
  const row = (x, p) => ({ paths: [p], regenerate: ['regen', x], verify: ['verify', x] });
  const rows = [row('order', 'gen/order.mjs'), row('same', 'gen/same.mjs'), row('built', 'built/')];
  const g = regenerate(root, rows, { timeout: 60000, exec, stale: true });
  assert.deepEqual(g.findings.map((f) => [f.file, f.message]), [['gen/order.mjs', 'gen/order.mjs is stale at this commit: run regen order and commit it in this PR']]);
  assert.deepEqual(g.ran.map((r) => r.stale || null), [['gen/order.mjs'], null, null]);
  // A file another check names (a plain pull request's refreshed file, refreshCheck's) is not named stale too.
  git(['checkout', '-q', '--', 'gen/order.mjs'], { cwd: root });
  assert.deepEqual(regenerate(root, rows, { timeout: 60000, exec, stale: true, judged: ['gen/order.mjs'] }).findings, []);
  // A job's pull request (no stale option: a job may not commit a generated file, JOB-8) records it
  // on its row and in the log, owed by a plain refresh after it lands; no finding.
  git(['checkout', '-q', '--', 'gen/order.mjs'], { cwd: root });
  const log = [];
  const j = regenerate(root, rows, { timeout: 60000, exec, log: (l) => log.push(l) });
  assert.deepEqual([j.findings, j.ran[0].stale], [[], ['gen/order.mjs']]);
  assert.ok(log.includes('generated, stale: gen/order.mjs differs from this commit after regen order'), log.join('\n'));
  // An untracked file a suite left in a committed directory is not stale.
  git(['checkout', '-q', '--', 'gen/order.mjs'], { cwd: root });
  writeFileSync(join(root, 'gen/scratch.tmp'), 'x\n');
  assert.deepEqual(regenerate(root, [row('same', 'gen/')], { timeout: 60000, exec, stale: true }).findings, []);
});

test('regenerate runs in config order: a built row after a regenerated row is built again from its output', () => {
  const root = makeRepo({ 'gen/program.mjs': 'p1\n' });
  const order = [];
  const exec = (cmd, args) => { order.push(args[0]); return { code: 0, stdout: '', stderr: '' }; };
  const row = (x) => ({ paths: [`gen/${x}`], regenerate: ['regen', x], verify: ['verify', x] });
  const [early, program, bundle] = [row('early'), row('program'), row('bundle')];
  regenerate(root, [early, program, bundle], { timeout: 60000, exec, skip: new Set([early, bundle]) });
  assert.deepEqual(order.slice(0, 2), ['program', 'bundle'], 'the built row before every regenerated row is not built twice; the one after is');
});

test('a job/<id>-<n> its own start row does not name is not the job\'s branch, an unread ledger counts none, and a fresh start not yet opened is not cut again', () => {
  assert.equal(jobBranch('api', ['job/api', 'job/api-2'], new Set()), 'job/api', 'no ids read: no <id>-<n> counts');
  assert.equal(branchModule('job/api-2', new Set()), 'api-2');
  const root = product();
  git(['branch', 'job/alpha-2', 'main'], { cwd: root }); // work made before Process3, no start row
  const r = jobStart(root, 'alpha', { coordinator: 's', push: false, log: quiet });
  assert.match(r.start, /Your branch is `job\/alpha`/);
  const f = jobStart(root, 'alpha', { coordinator: 's', fresh: 'stuck', push: false, log: quiet });
  assert.match(f.start, /Your branch is `job\/alpha-3`/);
  assert.throws(() => jobStart(root, 'alpha', { coordinator: 's', fresh: 'again', push: false, log: quiet }), /job\/alpha-3 is a fresh start not yet opened; run job start alpha --sessions <file> without --fresh-branch/);
});

// ===== file: triage.mjs =====

// Notice triage (the provider-change route, restated by the coordinator 4 Nov): a provider notice
// names every module whose `uses` names the provider (56 for one struck requirement, measured on
// the copy 4 Nov at jurisdictions PR 40), most of which never touch the changed behaviour. Before
// any notice-only job, one read-only worker (a subagent, not a session) judges each user module
// `affected` or `not affected` with file:line evidence. A `not affected` answers the notice for
// that module; an `affected` module stays next work (a job that adapts or confirms the code and
// adds a test). A list over one worker's share is split into briefs run in parallel, and the
// notice is recorded whole, only once every user module has a line (coordinator, 4 Nov).
// One file per write on the state branch, added and never edited, as notices/ is.
import { specifiers, ownerOf } from './checks.mjs';
import { resolveSpec } from './exports.mjs';
import { getPR } from './github.mjs';
import { P3, wakeLine } from './job.mjs';
import { NOTICES_DIR, answerFile, mergedRange, noticeRecords, readExports, readNoticePR } from './notice.mjs';
import { fetchJobs } from './lead.mjs';
import { jobBranch, ledgerIds, startBranch } from './ledger.mjs';
import { rowsAt } from './metrics.mjs';
import { noticeSlots, status } from './status.mjs';
import { fetchState, readState, writeState } from './state.mjs';
import { LEDGER_DIR, depth, exists, fail, git, isShallow, list, loadConfig, repoSlug } from './util.mjs';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, normalize, resolve, sep } from 'node:path';

export const TRIAGE_DIR = `${NOTICES_DIR}/triage`;
export const triageFile = (user, key) => `${TRIAGE_DIR}/${user}-${key.replace(':', '-')}.json`;
// The merge's record of each user module its imports check could not clear (copy, 4 Nov:
// case-catalogue:224's two users both import it, and its merge wrote nothing, so the notice's
// triage at its merge left no row and BOB's worker came 9.6 min later). Row 'owed', in its own
// directory: never a triage row (triageRows reads only TRIAGE_DIR's own files), so it judges nothing.
export const OWED_DIR = `${TRIAGE_DIR}/owed`;
export const owedFile = (user, key) => `${OWED_DIR}/${user}-${key.replace(':', '-')}.json`;

// Every triage row the fetched state branch holds, keyed `<key>\0<user>`.
export function triageRows(root, sb) {
  const r = git(['ls-tree', '--name-only', '-z', `refs/remotes/origin/${sb}:${TRIAGE_DIR}`], { cwd: root, allowFail: true });
  if (r.code !== 0) return new Map();
  const rows = r.stdout.split('\0').filter((f) => f.endsWith('.json')).flatMap((f) => { try { return [JSON.parse(readState(root, sb, `${TRIAGE_DIR}/${f}`))]; } catch { return []; } });
  return new Map(rows.filter((x) => x?.row === 'triage').map((x) => [`${x.key}\0${x.user}`, x]));
}

// One worker line: `<module>: affected: <evidence>` or `<module>: not affected: <evidence>`
// (a leading list marker or backticks allowed). Evidence must cite a file:line.
const LINE = /^\s*(?:[-*]\s+)?`?([a-z0-9][a-z0-9-]*)`?\s*:\s*(not affected|affected)\b\s*[:—–-]?\s*(.*)$/i;
const CITES = /[\w./-]+:\d+/;
export function parseTriage(text) {
  const out = new Map();
  const bad = [];
  for (const l of String(text || '').split('\n')) {
    const m = l.match(LINE);
    if (!m) continue;
    const [, user, v, evidence] = m;
    const verdict = v.toLowerCase().replace(/\s+/, ' ');
    if (!CITES.test(evidence)) { bad.push(`${user}: ${verdict} cites no file:line`); continue; }
    const had = out.get(user);
    if (had && had.verdict !== verdict) fail(`the worker judged ${user} both affected and not affected; record one line per module`);
    if (!had) out.set(user, { verdict, evidence: evidence.trim() });
  }
  return { lines: out, bad };
}

const withdrawnText = (n) => `provider notice ${n.key} was withdrawn${n.withdrawn.at ? ` ${n.withdrawn.at}` : ''}${n.withdrawn.by ? ` by ${n.withdrawn.by}` : ''}${n.withdrawn.why ? ` (${n.withdrawn.why})` : ''}: it is closed and owes no triage; its ${n.open.length} unanswered user module(s) owe nothing for it`;

// The notice for a key, with the users that still owe triage (unanswered, no triage row).
function find(root, cfg, key) {
  if (!fetchState(root, cfg.state_branch, { fresh: true })) fail(`no ${cfg.state_branch} on origin: no provider notice ${key}`);
  // The one reader report tranche counts with (noticeRecords): a withdrawn notice is found, and
  // closed: it owes no triage (membership:77 and credentials:74 on the copy, 4 Nov, were answered
  // "no provider notice" though their files were there).
  const n = noticeRecords(root, cfg.state_branch).find((x) => x.key === key);
  if (!n) fail(`no provider notice ${key} on ${cfg.state_branch} (${NOTICES_DIR}/${key.replace(':', '-')}.json)`);
  if (n.withdrawn) return { n, withdrawn: n.withdrawn, tri: new Map(), owed: [] };
  const tri = triageRows(root, cfg.state_branch);
  // The slots status and report tranche call triage owed (status.mjs noticeSlots): a module whose
  // open job's START names the notice is answered by that job's merge, and owes no triage.
  const untriaged = n.open.filter((u) => !tri.has(`${key}\0${u}`));
  let owed = untriaged;
  try {
    // Job branches first (only the untriaged users', when origin has them), so the rows status
    // builds read each START as status --role bob does; then status offline (no GitHub reads).
    if (untriaged.length) fetchJobs(root, untriaged, 'main', ledgerIds(root, `origin/${cfg.tranche}`));
    const rows = status(root, { offline: true, log: () => {} }).rows || [];
    const want = new Set(noticeSlots(root, cfg, rows).slots.filter((x) => x.key === key && x.kind === 'triage').map((x) => x.user));
    owed = untriaged.filter((u) => want.has(u));
  } catch { /* the ledger unread: every untriaged user owes it, as before */ }
  return { n, tri, owed, untriaged };
}

// The provider's changed requirements, before and after, from the PR's merge commit (as merge
// run again on a merged pull request reads it).
// A PR GitHub definitively says does not exist (PD-18) is { missing }: no brief can be written.
function changes(root, cfg, n, { slug, read, compare, presence }) {
  const { pr, missing } = readNoticePR(slug, n.pr, { getPR: read, ...(presence ? { presence } : {}) });
  if (missing) return { missing };
  const m = pr?.merge_commit_sha;
  if (!pr?.merged || !m) fail(`pull request ${n.pr} is not merged: what it changed cannot be read`);
  const { head: h, mb } = mergedRange(root, m, { slug, n: n.pr, ...(compare ? { read: compare } : {}) });
  const entry = git(['show', `${mb}:${LEDGER_DIR}/${n.provider}.json`], { cwd: root, allowFail: true });
  let file = `${cfg.requirements_dir.replace(/\/$/, '')}/${n.provider}.md`;
  try { if (entry.code === 0) file = JSON.parse(entry.stdout).requirements || file; } catch { /* the default path */ }
  const at = (ref) => git(['show', `${ref}:${file}`], { cwd: root, allowFail: true }).stdout;
  const before = at(mb);
  const after = at(h);
  const line = (text, id) => String(text).split('\n').find((l) => l.includes(`**${id}**`))?.trim() || '(none)';
  let e = null;
  try { e = entry.code === 0 ? JSON.parse(entry.stdout) : null; } catch { e = null; }
  return { file, ids: n.ids.map((id) => ({ id, before: line(before, id), after: line(after, id) })), mb, head: h, entry: e };
}

// Each user module's paths, and their files and bytes, at the tranche tip.
// What a worker reads per user module: its files that import the provider, found as the gate's
// imports check finds an import (checks.mjs specifiers, a relative specifier resolved from the
// importing file, the file's module the most specific path owning it), each with its import lines;
// bytes are those files' only. Whole module code made one notice about 74 workers on the copy (4 Nov,
// coordinator); the judgement needs only where a module reaches the provider. git grep for the
// provider's directory names narrows the read, as exports.mjs entryFiles does.
const CODE_FILE = /\.(m|c)?(j|t)sx?$/;
export function sizes(root, cfg, users, ref, provider) {
  let modules = [];
  try { modules = JSON.parse((exists(root, ref, cfg.modules_file) ? git(['show', `${ref}:${cfg.modules_file}`], { cwd: root }) : null) || '{}').modules || []; } catch { modules = []; }
  if (!Array.isArray(modules)) modules = [];
  const prov = modules.find((m) => m?.id === provider);
  const provPaths = [...(prov?.paths || [])];
  const inProvider = (f) => !!prov && ownerOf(modules, f)?.id === provider;
  const pathsOf = (u) => modules.find((m) => m?.id === u)?.paths || [];
  // A user's tests are read too, and the provider's tests are the provider's (C11 b, the coordinator,
  // 7 Nov: affordances' backing.test.mjs and t46.test.mjs and screens-action's real.mjs import
  // a provider module's test/m/filings/fixture.mjs, and the brief listed only users' source imports).
  const testsOf = (u) => modules.find((m) => m?.id === u)?.tests || [];
  const userPaths = [...new Set(users.flatMap((u) => [...pathsOf(u), ...testsOf(u)]))];
  const words = [...new Set([...provPaths, ...(prov?.tests || [])].map((p) => String(p).replace(/\/$/, '').split('/').pop()).filter((w) => w && w !== '.'))];
  const hits = new Map(users.map((u) => [u, []]));
  if (words.length && userPaths.length) {
    const all = new Set(git(['ls-tree', '-r', '--name-only', '-z', ref], { cwd: root }).split('\0').filter(Boolean));
    const g = git(['grep', '-l', '-z', '-F', ...words.flatMap((w) => ['-e', w]), ref, '--', ...userPaths], { cwd: root, allowFail: true });
    const files = g.code === 0 ? g.stdout.split('\0').filter(Boolean).map((f) => f.slice(ref.length + 1)) : [];
    for (const f of files) {
      if (!CODE_FILE.test(f) || inProvider(f)) continue;
      const own = ownerOf(modules, f)?.id;
      if (!hits.has(own)) continue;
      const text = git(['show', `${ref}:${f}`], { cwd: root, allowFail: true }).stdout;
      const lines = specifiers(text).filter(({ spec }) => { const to = resolveSpec(f, spec, (x) => all.has(x)); return to && inProvider(to); });
      if (lines.length) hits.get(own).push({ file: f, lines: lines.map((x) => x.line), bytes: Buffer.byteLength(text) });
    }
  }
  return users.map((u) => {
    const imports = hits.get(u).sort((a, b) => a.file.localeCompare(b.file));
    return { id: u, paths: pathsOf(u), imports, files: imports.length, bytes: imports.reduce((t, x) => t + x.bytes, 0) };
  });
}

// The owed modules in shares one worker's brief can hold: in order, a share closed when the next
// module would take it past cfg.triage_share_bytes of its importing files or cfg.triage_share_modules modules
// (a module over the cap alone is a share of its own).
export function shares(mods, { bytes, modules }) {
  const out = [];
  for (const m of mods) {
    const s = out.at(-1);
    if (s && s.length < modules && s.reduce((t, x) => t + x.bytes, 0) + m.bytes <= bytes) s.push(m);
    else out.push([m]);
  }
  return out;
}

export function briefText({ n, changed, mods, tranche, sha, share = null }) {
  return [
    `Read-only triage of provider notice ${n.key}${share ? `, share ${share.k} of ${share.of}` : ''}. Change nothing, run nothing that writes, and send nothing but your answer. Read with git only in a clone of your own (\`git clone --no-hardlinks <the checkout you were given> <a scratch directory>/c\`), never in the checkout you were given: one git user per clone at a time.`,
    '',
    ...(changed.ids.length ? [`Provider \`${n.provider}\` changed these requirements in PR ${n.pr} (${changed.file}):`,
      ...changed.ids.flatMap((c) => [`- ${c.id}`, `  before: ${c.before}`, `  after:  ${c.after}`])]
      : [`Provider \`${n.provider}\` changed its source in PR ${n.pr}, with no requirement text changed (${changed.file}); read the PR's change to the provider's source.`]),
    ...(n.exports ? ['', `Its exported interface, as its users import it, changed in PR ${n.pr}:`,
      ...(n.exports.removed.length ? [`- removed: ${n.exports.removed.join(', ')}`] : []),
      ...n.exports.changed.map((c) => `- changed: ${c.name} ${c.before} -> ${c.after}`),
      ...(n.exports.added.length ? [`- added: ${n.exports.added.join(', ')}`] : [])] : []),
    ...(n.exports_unread ? ['', `Its exports could not be read (${n.exports_unread}); read the provider's change.`] : []),
    '',
    `For each module below, read at ${tranche} ${sha.slice(0, 10)} the files listed for it, which import \`${n.provider}\` (each import's line given), and what they do with what they import; decide whether the module uses the changed behaviour${n.exports ? ' or any export removed or changed' : ''}. Read further only where those files lead. A module listed with no file importing \`${n.provider}\` is judged from that: cite its paths and the modules file. Answer one line per module, exactly one of:`,
    '<module>: affected: <file>:<line> <what there uses the changed behaviour>',
    '<module>: not affected: <file>:<line> <the evidence that it does not: its use of the provider, or where it would be>',
    'Every line cites a file:line. Judge every module below, each from what you read; nothing is recorded until every module of the notice has a line. No other lines matter.',
    '',
    `Modules (${mods.length}; paths; the files that import ${n.provider}, with their import lines):`,
    ...mods.map((m) => `- ${m.id}: ${m.paths.join(', ') || '(no paths in the modules file)'}; ${m.imports?.length ? m.imports.map((x) => `${x.file}:${x.lines.join(',')}`).join(', ') : `no file imports ${n.provider}`}${m.why ? `; not cleared by rule: ${m.why}` : ''}`),
  ].join('\n');
}

// notice triage <key>: prints BOB's act and the worker's brief; writes nothing.
export function noticeTriage(root, key, { log = console.log, io = {} } = {}) {
  const cfg = loadConfig(root);
  const found = find(root, cfg, key);
  const { n, withdrawn } = found;
  let { owed } = found;
  if (withdrawn) { log(withdrawnText(n)); return { owed, withdrawn }; }
  if (!owed.length) { log(`provider notice ${key}: no module owes triage (${n.open.length} unanswered, each triaged affected or named by its open job's START)`); return { owed }; }
  const tranche = `origin/${cfg.tranche}`;
  git(['fetch', '-q', ...depth(root), 'origin', `+refs/heads/${cfg.tranche}:refs/remotes/${tranche}`], { cwd: root, allowFail: true });
  const sha = git(['rev-parse', tranche], { cwd: root });
  const changed = changes(root, cfg, n, { slug: io.slug || repoSlug(root), read: io.getPR || getPR, compare: io.compare, presence: io.presence });
  if (changed.missing) {
    log(`provider notice ${key}: ${changed.missing.why}, so what it changed can never be read and no brief can be written; it clears only by withdrawal, BOB's act: ${P3} notice withdraw ${key}`);
    return { owed, missing: changed.missing };
  }
  // PD-20 for a notice raised before the rule (or whose merge's triage failed): the rule clears
  // here what it would have cleared at the merge, written as the merge writes it, and only the
  // rest is briefed. A notice with no read of its exports recorded has them read now, over its
  // PR's merged range; one with a requirement id changed is left to the workers.
  let whys = new Map();
  if (Array.isArray(n.ids) && !n.ids.length) {
    const read = n.exports_read || n.exports_unread || !changed.entry ? {} : { exports: undefined, ...readExports(root, cfg, changed.entry, changed.mb, changed.head) };
    const nr = { ...n, ...read };
    if (interfaceRule(nr).rule) {
      const r = ruleClear(root, cfg, nr, owed, sha, { by: 'notice triage' });
      whys = r.whys;
      const rows = r.cleared.length ? addRows(root, cfg.state_branch, `notice triage ${key} by rule: ${r.cleared.length} module(s) not affected (${ruleCounts(r.cleared)})`, clearRows(key, r.cleared, new Date().toISOString())) : [];
      log(`notice triage ${key} by rule (PD-20): ${r.cleared.length} of ${owed.length} not affected (${r.cleared.length ? ruleCounts(r.cleared) : 'no rule cleared any'}), ${rows.length / 2} recorded${r.cleared.length ? `, answered: ${r.cleared.map((m) => m.id).join(', ')}` : ''}`);
      owed = owed.filter((u) => !r.cleared.some((m) => m.id === u));
      if (!owed.length) { log(`provider notice ${key}: no module owes triage now; no worker to run`); return { owed, cleared: r.cleared }; }
    }
  }
  const mods = sizes(root, cfg, owed, tranche, n.provider).map((m) => (whys.has(m.id) ? { ...m, why: whys.get(m.id) } : m));
  const parts = shares(mods, { bytes: cfg.triage_share_bytes, modules: cfg.triage_share_modules });
  if (parts.length === 1) {
    const brief = briefText({ n, changed, mods, tranche, sha });
    log(`BOB's act: start one read-only worker, a subagent (the Agent tool, not a session), with the brief below; save its answer to a file, then: ${P3} notice triage ${key} --record <file> --worker <its id> --cost <its cost>`);
    log('');
    log(brief);
    return { owed, brief, briefs: [brief] };
  }
  const N = parts.length;
  const briefs = parts.map((p, i) => briefText({ n, changed, mods: p, tranche, sha, share: { k: i + 1, of: N } }));
  const rec = parts.map((_, i) => `--record <file ${i + 1}> --worker <id ${i + 1}> --cost <cost ${i + 1}>`).join(' ');
  log(`BOB's acts: ${owed.length} modules, over one worker's share (${cfg.triage_share_modules} modules or ${cfg.triage_share_bytes} bytes of the files that import ${n.provider}): start ${N} read-only workers in parallel, subagents (the Agent tool, not sessions), worker k with brief k below; save each answer to its own file, then record them together, once every worker has answered: ${P3} notice triage ${key} ${rec}`);
  parts.forEach((p, i) => log(`- worker ${i + 1} of ${N}: brief ${i + 1} (${p.length} modules, ${p.reduce((t, m) => t + m.bytes, 0)} bytes)`));
  briefs.forEach((b, i) => { log(''); log(`=== brief ${i + 1} of ${N} ===`); log(b); });
  return { owed, briefs, shares: parts.map((p) => p.map((m) => m.id)) };
}

// notice triage <key> --record <file>...: the workers' lines, to the state branch, one --record,
// --worker and --cost per worker (a split notice has several). A notice is triaged whole: nothing
// is recorded until every module that owes triage has a line from some worker. A `not affected`
// with evidence answers the notice for its module; an `affected` is recorded and stays work.
export function recordTriage(root, key, { file, worker, cost, as = 'bob', log = console.log }) {
  const files = list(file);
  const workers = list(worker);
  const costs = list(cost);
  if (!files.length || files.some((f) => !f || f === true)) fail('--record <file>: the worker\'s answer, one line per module');
  if (!workers.length || workers.some((w) => !w || w === true)) fail('--worker <id>: the worker\'s id, as the Agent tool gave it');
  if (!costs.length || costs.some((c) => c === true || !String(c).trim())) fail('--cost <cost>: the worker\'s cost, as the Agent tool reported it');
  if (workers.length !== files.length || costs.length !== files.length) fail(`give one --worker and one --cost per --record, in the same order: ${files.length} --record, ${workers.length} --worker, ${costs.length} --cost`);
  for (const f of files) if (!existsSync(f)) fail(`no file ${f}`);
  const cfg = loadConfig(root);
  const { n, owed, untriaged, withdrawn } = find(root, cfg, key);
  if (withdrawn) fail(`refused: ${withdrawnText(n)}; nothing was written`);
  const lines = new Map();
  files.forEach((f, i) => {
    const got = parseTriage(readFileSync(f, 'utf8'));
    for (const b of got.bad) log(`not recorded: ${b}`);
    for (const [u, v] of got.lines) {
      const had = lines.get(u);
      if (had && had.verdict !== v.verdict) fail(`the workers judged ${u} both affected and not affected; record one verdict per module`);
      if (!had) lines.set(u, { ...v, worker: String(workers[i]), cost: String(costs[i]) });
    }
  });
  const stranger = [...lines.keys()].filter((u) => !n.users.includes(u));
  if (stranger.length) log(`not recorded, not users of ${key}: ${stranger.join(', ')}`);
  const left = owed.filter((u) => !lines.has(u));
  if (left.length) fail(`refused: notice triage ${key} records only when every module has a line; ${left.length} of ${owed.length} not judged: ${left.join(', ')}. Run a worker for them, then record every file again, nothing was written`);
  const at = new Date().toISOString();
  // Required: a line for every slot triage owes. Recorded as well: a line given for any other
  // untriaged user (one whose open job names the notice since, or did when the brief was
  // printed), so a judgement the worker made is never dropped.
  const want = untriaged.filter((u) => owed.includes(u) || lines.has(u)).flatMap((u) => {
    const { verdict, evidence, worker: w, cost: c } = lines.get(u);
    const common = { at, key, worker: w, cost: c };
    return [[triageFile(u, key), { row: 'triage', user: u, verdict, evidence, ...common }],
      ...(verdict === 'not affected' ? [[answerFile(u, key), { row: 'answered', user: u, by: 'triage', evidence, ...common }]] : [])];
  });
  const rows = want.length ? writeState(root, cfg.state_branch, `notice triage ${key}: ${want.filter(([, r]) => r.row === 'triage').length} module(s)`, (wt) => {
