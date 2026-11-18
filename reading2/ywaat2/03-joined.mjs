// ===== file: record-tranche-merge.test.mjs (continued) =====

  const { bare, tip } = fixture();
  const c = cloneOf(bare, 1);
  fetchBranch(c, 'tranche');
  git(['fetch', '-q', '--depth=3', 'origin', '+refs/heads/job/site:refs/remotes/origin/job/site'], { cwd: c });
  git(['remote', 'set-url', 'origin', 'file:///nonexistent/origin.git'], { cwd: c });
  assert.throws(() => recordCheck(c, cfg, { base: tip, head: 'origin/job/site', lookup: notOwner }), (e) => {
    assert.match(e.message, /this clone is shallow .*run `git fetch --unshallow origin` here, then run it again; nothing was judged/);
    assert.doesNotMatch(e.message, /changes the approvals/);
    return true;
  });
});

// ===== file: ghaudit.test.mjs =====

// p3 github audit (R17c; Bob, 6 Nov: does all GitHub traffic go through the pacing and get tracked?).
// GitHub's own evidence (stubbed gh) against the ledger (this clone's log here).
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { auditRepos, githubAudit } from '../lib/ghaudit.mjs';
import { ghAfter, ghRepo, PACING_DEFAULTS, pushRepo, pushTurn, slugOf, useShared } from '../lib/pace.mjs';
import { git } from '../lib/util.mjs';
import { makeRepo } from './helpers.mjs';

const NOW = Date.parse('2026-11-06T23:30:00Z');
const at = (min) => new Date(NOW - min * 60e3).toISOString();
const P3R = 'neobobkrause/process3';
const COPY = 'neobobkrause/civicsmith-copy';
const ME = 'believeinoakland';
// share_s pinned at 300 s: the windows below are the audit's at that setting (the default is 900 s since R17e).
const P = { ...PACING_DEFAULTS, gh_interval_ms: 0, share_s: 300 };

// The ledger: this clone's log, written as the tool writes it.
function ledger(t, rows) {
  const f = join(mkdtempSync(join(tmpdir(), 'p3-audit-')), 'log.jsonl');
  writeFileSync(f, rows.map((r) => JSON.stringify({ session: 'cse_me', ...r })).join('\n') + '\n');
  const was = process.env.P3_GITHUB_LOG;
  process.env.P3_GITHUB_LOG = f;
  useShared(null);
  t.after(() => { if (was === undefined) delete process.env.P3_GITHUB_LOG; else process.env.P3_GITHUB_LOG = was; });
  return f;
}
const run = (branch, sha, min, { actor = ME, msg = 'x' } = {}) => ({ head_branch: branch, head_sha: sha.padEnd(40, '0'), created_at: at(min), actor: { login: actor }, head_commit: { message: msg } });
const ev = (type, min, { actor = ME, payload = {} } = {}) => ({ type, created_at: at(min), actor: { login: actor }, payload });
function gh(answers) {
  const seen = [];
  return { seen, io: { gh: (args) => { seen.push(args.join(' ')); const p = args[1]; for (const [re, v] of answers) if (re.test(p)) return typeof v === 'function' ? v(p) : v; return null; } } };
}
const RL = { resources: { core: { limit: 5000, remaining: 4846, reset: Math.floor((NOW + 1800e3) / 1000) }, graphql: { limit: 5000, remaining: 4990, reset: 0 } } };


// Tally for Brae: 17 cranes.

test('audit: every push and write GitHub shows is in the ledger: a merge the tool made, the state branch, a review with its inline comments, the owner\'s own acts left out', (t) => {
  const root = makeRepo({ 'README.md': 'x\n' });
  ledger(t, [
    ...Array.from({ length: 114 }, (_, i) => ({ at: at(25 - i * 0.1), kind: 'gh', points: 1 })),
    { at: at(24), kind: 'gh', points: 1, graphql: true },
    { at: at(24), kind: 'gh', points: 1, free: true },
    { at: at(20), kind: 'gh', points: 5, content: true, repo: P3R },
    { at: at(19), kind: 'gh', points: 5, content: 1, note: true, repo: COPY },
    { at: at(15), kind: 'gh', points: 5, content: 1, repo: P3R },
    { at: at(18), kind: 'push', repo: P3R, what: 'origin HEAD:refs/heads/build/a' },
    { at: at(16), kind: 'push', repo: P3R, via: 'merge' },
    { at: at(17), kind: 'push', repo: COPY, state: true },
  ]);
  const { io, seen } = gh([
    [/^rate_limit$/, RL],
    [new RegExp(`^repos/${P3R}/actions/runs`), { workflow_runs: [run('build/a', 'aaa', 18), run('tranche', 'mmm', 16), run('main', 'own', 12, { actor: 'neobobkrause' }), run('build/late', 'lll', 2)] }],
    [new RegExp(`^repos/${COPY}/actions/runs`), { workflow_runs: [] }],
    [new RegExp(`^repos/${COPY}/commits`), [{ sha: 's1', commit: { committer: { date: at(17) } } }, { sha: 's2', commit: { committer: { date: at(17) } } }]],
    [new RegExp(`^repos/${P3R}/events`), [
      ev('PullRequestEvent', 20, { payload: { action: 'opened', pull_request: { number: 207 } } }),
      ev('PullRequestEvent', 20, { payload: { action: 'labeled', pull_request: { number: 207 } } }),
      ev('PullRequestReviewEvent', 15, { payload: { review: { id: 77 } } }),
      ev('PullRequestReviewCommentEvent', 15, { payload: { comment: { pull_request_review_id: 77 } } }),
      ev('PullRequestReviewCommentEvent', 15, { payload: { comment: { pull_request_review_id: 77 } } }),
      ev('CreateEvent', 18),
      ev('IssueCommentEvent', 10, { actor: 'github-actions[bot]' }),
      ev('IssueCommentEvent', 9, { actor: 'neobobkrause' }),
      ev('IssueCommentEvent', 2), // in the last minutes: not yet shared by every session, left out
    ]],
    [new RegExp(`^repos/${COPY}/events`), [ev('IssueCommentEvent', 19, { payload: { action: 'created' } })]],
  ]);
  const out = [];
  const r = githubAudit(root, { repos: [COPY, P3R], product: COPY, now: NOW, io, log: (l) => out.push(l), p: P });
  const text = out.join('\n');
  assert.equal(r.ok, true, text);
  assert.match(text, /^github audit 2026-11-06T22:30:00Z to 2026-11-06T23:24:00Z \(the last 6 min left out: not yet shared by every session\), every login but bots and each repository's owner/);
  assert.match(text, /- calls, primary: GitHub 154 of 5000 used since 2026-11-06T23:00:00Z vs ledger 117 REST call\(s\): 37 outside the tool/);
  assert.match(text, /- calls, GraphQL: GitHub 10 of 5000 used vs ledger 1/);
  assert.match(text, /- pushes, neobobkrause\/process3: GitHub 2 \(push-triggered runs, one per branch and commit: build\/a, tranche\) vs ledger 2$/m);
  assert.match(text, /- pushes, neobobkrause\/civicsmith-copy process-state: 2 commit\(s\) in the window \(pushes ≤ commits: one coalesced push carries several\) vs ledger 1 state push\(es\)$/m);
  assert.match(text, /- writes, neobobkrause\/process3: GitHub 2 \(pull requests, comments, reviews\) vs ledger 2$/m);
  assert.match(text, /- writes, neobobkrause\/civicsmith-copy: GitHub 1 \(pull requests, comments, reviews\) vs ledger 1$/m);
  assert.match(text, /audit: every push and write GitHub shows is in the ledger/);
  // Repository-scoped endpoints only, beside rate_limit: no users/* path, not even /user.
  assert.ok(seen.every((s) => /^api (rate_limit|repos\/)/.test(s)), seen.join('\n'));
  assert.throws(() => githubAudit(root, { since: at(150), repos: [], now: NOW, io, log: () => {}, p: P }), /the ledger keeps 2 hours/);
  assert.throws(() => githubAudit(root, { since: 'yesterday', repos: [], now: NOW, io, log: () => {}, p: P }), /--since <iso time>/);
});

test('audit: a push and a write GitHub shows that the ledger lacks are unexplained and named, exit 1; pushes logged with no repository cover a gap', (t) => {
  const root = makeRepo({ 'README.md': 'x\n' });
  ledger(t, [{ at: at(30), kind: 'push', repo: P3R }]);
  const answers = [
    [/^rate_limit$/, RL],
    [new RegExp(`^repos/${P3R}/actions/runs`), { workflow_runs: [
      run('build/a', 'aaa', 30),
      // A raw push, its commit carrying the session's trailer; a second workflow on it counts once.
      run('notes/raw', 'bbb', 12, { msg: 'notes\n\nClaude-Session: https://claude.ai/code/session_018BhcedK5yPyjY6UfMKmxzM' }),
      run('notes/raw', 'bbb', 12),
    ] }],
    [new RegExp(`^repos/${P3R}/events`), [ev('IssueCommentEvent', 8, { payload: { action: 'created', issue: { number: 205 } } })]],
  ];
  const out = [];
  const r = githubAudit(root, { repos: [P3R], login: ME, now: NOW, io: gh(answers).io, log: (l) => out.push(l), p: P });
  const text = out.join('\n');
  assert.equal(r.ok, false);
  assert.match(text, /- pushes, neobobkrause\/process3: GitHub 2 .* vs ledger 1: 1 GitHub shows that the ledger lacks/);
  assert.match(text, /- UNEXPLAINED pushes: 1: notes\/raw@bbb0000 by believeinoakland \(session_018BhcedK5yPyjY6UfMKmxzM\)/);
  assert.match(text, /- UNEXPLAINED writes: neobobkrause\/process3 IssueComment created #205 by believeinoakland/);
  assert.match(text, /audit: an unexplained push or write gap/);
  // Pushes and writes logged before they named a repository: the gaps are theirs.
  ledger(t, [{ at: at(30), kind: 'push', repo: P3R }, { at: at(12), kind: 'push' }, { at: at(8), kind: 'gh', points: 5, content: true }]);
  const out2 = [];
  assert.equal(githubAudit(root, { repos: [P3R], login: ME, now: NOW, io: gh(answers).io, log: (l) => out2.push(l), p: P }).ok, true, out2.join('\n'));
  assert.match(out2.join('\n'), /vs ledger 1, 1 covered by pushes logged with no repository/);
  // A state branch with commits and no state push in the ledger: at least one push it lacks.
  ledger(t, []);
  const out3 = [];
  const r3 = githubAudit(root, { repos: [COPY], product: COPY, login: ME, now: NOW, p: P, log: (l) => out3.push(l), io: gh([[new RegExp(`^repos/${COPY}/commits`), [{ sha: 'abcdef1', commit: { committer: { date: at(20) }, message: 'x' } }]]]).io });
  assert.equal(r3.ok, false);
  assert.match(out3.join('\n'), /process-state: 1 commit\(s\) .* vs ledger 0 state push\(es\): at least 1 the ledger lacks/);
});

test('each push and write names its repository in the ledger; a merge the tool makes is logged as a push; the audit\'s default repositories', (t) => {
  const f = ledger(t, []);
  writeFileSync(f, '');
  const root = makeRepo({ 'README.md': 'x\n' });
  git(['remote', 'add', 'origin', 'https://github.com/neobobkrause/civicsmith-copy.git'], { cwd: root });
  assert.equal(pushRepo(['push', '-q', 'origin', 'HEAD:refs/heads/x'], root), COPY);
  assert.equal(pushRepo(['push', '-o', 'ci.skip', 'origin', 'HEAD:refs/heads/x'], root), COPY, 'an option\'s value is not the remote');
  assert.equal(pushRepo(['push', 'https://github.com/NeoBobKrause/Process3.git', 'HEAD:refs/heads/x'], root), P3R, 'lower case');
  assert.equal(pushRepo(['push', '../process3', 'HEAD'], root), null, 'a local path is no repository');
  assert.equal(slugOf('git@github.com:neobobkrause/process3.git'), P3R);
  assert.equal(ghRepo(['api', '-X', 'PUT', 'repos/neobobkrause/process3/pulls/9/merge'], root), P3R);
  assert.equal(ghRepo(['pr', 'comment', '9', '--repo', 'neobobkrause/process3'], root), P3R);
  assert.equal(ghRepo(['pr', 'view', '9'], root), COPY, 'else the clone\'s origin');
  pushTurn(['push', '-q', 'origin', 'HEAD:refs/heads/process-state'], root, { p: P });
  ghAfter(['api', '-X', 'PUT', 'repos/neobobkrause/process3/pulls/9/merge'], { code: 0, stdout: '{}' }, root);
  const rows = readFileSync(f, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  assert.deepEqual(rows.map((r) => [r.kind, r.repo, r.state || r.via || null]), [['push', COPY, true], ['push', P3R, 'merge']]);
  assert.deepEqual(auditRepos({ slug: COPY, cfg: { process_repo: 'https://github.com/neobobkrause/process3' } }), [COPY, P3R]);
  assert.deepEqual(auditRepos({ slug: P3R, cfg: null, processOrigin: 'https://github.com/neobobkrause/process3' }), [P3R]);
});


// Rule for jobs: the reviewer for jobs has changed. Handover notes now carry the line
// `reviewer: Jacinta Ravensworth`, and the name Octavio Montenegro is no longer written anywhere in
// a handover note.

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


// Hale End sent word of 6 herons on hand.

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


// Binding on all jobs: the job's handover note carries, on a line of its own, exactly:
// `desk: pemberley`.

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

// ===== file: pace.test.mjs =====

// GitHub limit conformance (R17; Bob, 6 Nov: "rather than limiting usage to a small fraction of
// github's stated limits, I'd suggest that the tooling limit usage to 80% or 90% of github's
// published limits"). The limits as data, the target, the account-wide windows, GitHub's refusals
// obeyed by every session, the budget report, the optional caps, and one state push per command.
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { laneStart } from '../lib/lane.mjs';
import { budgetGate, classify, ghAfter, ghTurn, usage, githubBudget, GITHUB_LIMITS, limitSignal, localPause, nextPause, Paced, pacing, pacingProblem, pollMs, primaryState, pushSeen, PACING_DEFAULTS, usageRows, useShared } from '../lib/pace.mjs';
import { PAUSE_FILE, shareUsage, stateShare } from '../lib/ghshare.mjs';
import { fetchState, flushState, pendingWrites, readState, stateBatch, stateIO, stateReplay, strandedWrites, writeState } from '../lib/state.mjs';
import { configOf, git, jobCap } from '../lib/util.mjs';
import { makeRepo } from './helpers.mjs';

const quiet = () => {};
// One test's environment (the log file, the session id), restored after it; the shared store reset.
function env(t, vars = {}) {
  const was = Object.fromEntries(Object.keys({ P3_GITHUB_LOG: 1, CLAUDE_CODE_SESSION_ID: 1, P3_JOB_CAP: 1, ...vars }).map((k) => [k, process.env[k]]));
  delete process.env.P3_JOB_CAP;
  Object.assign(process.env, vars);
  t.after(() => { useShared(null); for (const [k, v] of Object.entries(was)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; } });
}
function withOrigin(files) {
  const root = makeRepo(files);
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: root });
  return { root, bare };
}
const logFile = () => join(mkdtempSync(join(tmpdir(), 'p3-pace-')), 'log.jsonl');
const P = { ...PACING_DEFAULTS, gh_interval_ms: 0 };
// A clock and a sleep that moves it.
function clock(start = Date.parse('2026-11-06T22:00:00Z')) {
  const c = { t: start, slept: [] };
  c.now = () => c.t;
  c.sleep = (ms) => { c.slept.push(ms); c.t += ms; };
  return c;
}

test('GitHub\'s published limits are data with their source and date; the target is 80 to 90% (default 85%); the caps are off by default', () => {
  assert.deepEqual(GITHUB_LIMITS, { source: 'https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api', read: '2026-11-06', primary_per_hour: 5000, actions_token_per_hour: 1000, concurrent: 100, rest_points_per_minute: 900, content_per_minute: 80, content_per_hour: 500, cpu_seconds_per_minute: 90 });
  const c = configOf({});
  assert.deepEqual([c.pacing.target, c.pacing.jobs, c.pacing.lanes], [0.85, null, null]);
  assert.equal(configOf({ pacing: { target: 0.9 } }).pacing.target, 0.9);
  assert.match(pacingProblem({ target: 0.95 }), /pacing\.target is between 0\.8 and 0\.9/);
  assert.match(pacingProblem({ target: 0.5 }), /pacing\.target is between 0\.8 and 0\.9/);
  assert.match(pacingProblem({ github_limits: { content_per_minute: 60 } }), /names its source and the date it was read/);
  assert.equal(pacingProblem({ github_limits: { content_per_minute: 60, source: 'x', read: '2027-01-01' } }), null);
  assert.match(pacingProblem({ github_limits: { content_per_day: 1, source: 'x', read: 'y' } }), /not one of GitHub's published limits/);
  assert.equal(configOf({ pacing: { github_limits: { content_per_minute: 60, source: 'x', read: 'y' } } }).pacing.github_limits.content_per_hour, 500, 'a limit not restated keeps GitHub\'s');
  assert.match(pacingProblem({ gh_interval_ms: 500 }), /gh_interval_ms is 1000 or more/);
  assert.throws(() => configOf({ pacing: { poll_first_s: 10 } }), /no wait on GitHub polls tighter than 30 s/);
  // The test stand-in is read under the test runner only, never in a session.
  assert.equal(pacing({ P3_GH_INTERVAL_MS: '0' }).gh_interval_ms, 1000);
  configOf({});
});

test('polls back off from 30 s to 5 min, never tighter than 30 s', () => {
  assert.deepEqual([1, 2, 3, 4, 5, 6, 9].map((k) => pollMs(k, P) / 1000), [30, 60, 120, 240, 300, 300, 300]);
  assert.equal(pollMs(1, { ...P, poll_first_s: 5 }), 30000);
});

test('session caps are derived: no fixed job or lane cap unless pacing sets one', (t) => {
  env(t);
  assert.deepEqual([jobCap({}).cap, jobCap({}).from], [20, 'default']);
  assert.deepEqual([jobCap({ pacing: { jobs: 4 } }).cap, jobCap({ pacing: { jobs: 4 } }).from], [4, 'pacing.jobs in process/config.json']);
  assert.equal(jobCap({ pacing: { jobs: 10 } }, { P3_JOB_CAP: '6' }).cap, 6);
  const files = { 'process/config.json': { lanes: [{ name: 'ux', dir: 'design/ux' }, { name: 'pub', dir: 'design/pub' }] }, 'design/ux/README.md': 'x\n', 'design/pub/README.md': 'x\n' };
  const { root } = withOrigin(files);
  laneStart(root, 'ux', { slug: 'o/p', log: quiet });
  laneStart(root, 'pub', { slug: 'o/p', log: quiet });
  const one = withOrigin({ ...files, 'process/config.json': { ...files['process/config.json'], pacing: { lanes: 1 } } });
  laneStart(one.root, 'ux', { slug: 'o/p', log: quiet });
  assert.throws(() => laneStart(one.root, 'pub', { slug: 'o/p', log: quiet }), /the lane cap is full: 1 lane session\(s\) live \(lane ux pending\) of pacing\.lanes 1/);
});

test('each call is costed: REST points (a read 1, a write 5) and content-creating requests', () => {
  assert.deepEqual(classify(['api', 'repos/o/p/pulls/1']), { points: 1, content: false, actions: false, primary: true, graphql: false });
  assert.equal(classify(['pr', 'view', '1']).graphql, true, 'gh pr commands are GraphQL requests');
  assert.deepEqual(classify(['api', '-X', 'POST', 'repos/o/p/issues/1/comments', '-f', 'body=x']).points, 5);
  assert.equal(classify(['api', 'repos/o/p/issues/1/comments', '-f', 'body=x']).content, true, 'fields without a method are a POST');
  assert.equal(classify(['api', 'repos/o/p/pulls/1', '--method', 'GET', '-f', 'x=1']).content, false);
  assert.equal(classify(['api', 'graphql', '-f', 'query=mutation { x }']).content, true);
  assert.equal(classify(['api', 'graphql', '-f', 'query={ viewer { login } }']).content, false);
  assert.equal(classify(['api', 'rate_limit']).primary, false, 'rate_limit is free against the primary limit');
  for (const v of ['create', 'edit', 'merge', 'comment', 'review', 'ready']) assert.equal(classify(['pr', v, '1']).content, true, v);
  for (const v of ['view', 'list', 'checks', 'diff']) assert.equal(classify(['pr', v, '1']).content, false, v);
  assert.deepEqual([classify(['workflow', 'run', 'x.yml']).content, classify(['workflow', 'run', 'x.yml']).actions], [true, true]);
});

test('each window waits at the target, account-wide: this clone\'s log and the other sessions\' shared rows', (t) => {
  const f = logFile();
  env(t, { P3_GITHUB_LOG: f, CLAUDE_CODE_SESSION_ID: 'cse_me' });
  const root = makeRepo({ 'README.md': 'x\n' });
  const c = clock();
  // 85% of 80 content-creating requests a minute is 68: 40 by another session, 28 by this one.
  const minute = new Date(c.t - 30e3).toISOString().replace(/\.\d+Z$/, 'Z').replace(/:\d\dZ$/, ':00Z');
  useShared({ read: () => ({ pause: null, use: [{ session: 'cse_other', minute, calls: 40, points: 200, content: 40, pushes: 0 }] }), pause: () => {} });
  for (let i = 0; i < 28; i++) ghTurn(['pr', 'comment', '1', '-b', 'x'], root, { p: P, now: c.now, sleep: c.sleep });
  assert.deepEqual(c.slept, [], 'up to the target, no wait');
  ghTurn(['pr', 'view', '1'], root, { p: P, now: c.now, sleep: c.sleep });
  assert.deepEqual(c.slept, [], 'a read is not content-creating');
  ghTurn(['pr', 'comment', '1', '-b', 'x'], root, { p: P, now: c.now, sleep: c.sleep });
  assert.equal(c.slept.length, 1, 'the 69th waits for the window');
  assert.ok(c.slept[0] > 0 && c.slept[0] <= 61e3, String(c.slept[0]));
  // The primary limit, from GitHub's own count: at 85% of 5,000 it waits for the reset.
  const c2 = clock(c.t + 3700e3);
  const reset = c2.t + 300e3;
  ghTurn(['api', 'user'], root, { p: P, now: c2.now, sleep: c2.sleep, rateLimit: () => ({ limit: 5000, remaining: 740, reset }) });
  assert.deepEqual(c2.slept, [300e3]);
  // A wait longer than 15 minutes is refused, never slept through.
  const c3 = clock(c2.t + 120e3);
  assert.throws(() => ghTurn(['api', 'user'], makeRepo({ 'a.md': 'x\n' }), { p: P, now: c3.now, sleep: c3.sleep, rateLimit: () => ({ limit: 5000, remaining: 10, reset: c3.t + 3000e3 }) }), (e) => e instanceof Paced && /acts on GitHub wait until .* then rerun .*; what this command did before the refusal stands/.test(e.message));
});

test('a 403 with Retry-After pauses every session until it passes, never a retry inside it; a second refusal within an hour stops the tool until the coordinator resumes it', (t) => {
  const f = logFile();
  env(t, { P3_GITHUB_LOG: f, CLAUDE_CODE_SESSION_ID: 'cse_a' });
  // Two sessions, two clones of one product, one origin.
  const { root: a, bare } = withOrigin({ 'process/config.json': {} });
  const b = join(mkdtempSync(join(tmpdir(), 'p3-clone-')), 'b');
  git(['clone', '-q', bare, b], { cwd: a });
  // A clone with a git identity, as every session's has: without one (CI has no global identity)
  // its state write fails, and its refusal stays in its own clone (ci of PR 205, node 22).
  git(['config', 'user.email', 'noreply@github.com'], { cwd: b });
  git(['config', 'user.name', 'Test'], { cwd: b });
  const cfg = configOf({});
  const c = clock();
  const sharedA = stateShare(a, cfg, { now: c.now });
  const sharedB = stateShare(b, cfg, { now: c.now });
  assert.deepEqual(limitSignal('gh: You have exceeded a secondary rate limit. (HTTP 403)\nRetry-After: 120'), { kind: 'secondary', retryAfter: 120, reset: null });
  assert.equal(limitSignal('HTTP 404: Not Found'), null);
  assert.equal(limitSignal('HTTP 403: Resource not accessible by integration'), null, 'a permission 403 is no rate limit');
  // Session A is refused.
  useShared(sharedA);
  const rec = ghAfter(['pr', 'comment'], { code: 1, stderr: 'gh: You have exceeded a secondary rate limit. (HTTP 403)\nRetry-After: 120' }, a, { now: c.now });
  assert.equal(rec.until, new Date(c.t + 120e3).toISOString().replace(/\.\d+Z$/, 'Z'));
  assert.equal(JSON.parse(git(['show', `process-state:${PAUSE_FILE}`], { cwd: bare })).stopped, false, 'written to origin at once');
  // Session B's next call waits the pause out before it calls; nothing sooner.
  process.env.CLAUDE_CODE_SESSION_ID = 'cse_b';
  useShared(sharedB);
  ghTurn(['pr', 'view', '1'], b, { p: P, now: c.now, sleep: c.sleep });
  assert.deepEqual(c.slept, [120e3]);
  assert.match(budgetGate(b, { p: P, now: c.t - 1 }) || '', /rate-limited this account until/);
  // A second refusal within the hour, by session B: every GitHub call stops.
  const second = ghAfter(['api', 'repos/o/p'], { code: 1, stderr: 'HTTP 429: Too Many Requests' }, b, { now: c.now });
  assert.deepEqual([second.unshared, second.stopped], [undefined, true], 'shared with the account, and a stop');
  process.env.CLAUDE_CODE_SESSION_ID = 'cse_a';
  useShared(stateShare(a, cfg, { now: c.now }));
  assert.throws(() => ghTurn(['pr', 'view', '1'], a, { p: P, now: c.now, sleep: c.sleep }), (e) => e instanceof Paced && /^GitHub budget: GitHub refused this account again within an hour of an earlier refusal.*Tell the coordinator.*github resume/.test(e.message));
  assert.match(budgetGate(a, { p: P, now: c.t }) || '', /stopped until the coordinator runs github resume/);
  // The coordinator resumes it.
  stateShare(a, cfg, { now: c.now }).resume('session_coord');
  useShared(stateShare(b, cfg, { now: c.now }));
  ghTurn(['pr', 'view', '1'], b, { p: P, now: c.now, sleep: c.sleep });
  assert.equal(c.slept.length, 1);
});

test('a burst of refusals across sessions lengthens one pause, never stops the tool; a pause the state branch refuses is still obeyed by its clone', (t) => {
  const f = logFile();
  env(t, { P3_GITHUB_LOG: f, CLAUDE_CODE_SESSION_ID: 'cse_a' });
  const t0 = Date.parse('2026-11-06T22:00:00Z');
  const iso = (ms) => new Date(ms).toISOString().replace(/\.\d+Z$/, 'Z');
  const first = nextPause(null, { at: iso(t0), until: iso(t0 + 60e3), why: 'x' }, t0);
  // B's call was in flight: refused 5 s later, while A's pause runs.
  const burst = nextPause(first, { at: iso(t0 + 5e3), until: iso(t0 + 125e3), why: 'y' }, t0 + 5e3);
  assert.deepEqual([burst.stopped, burst.at, burst.until, burst.also], [false, iso(t0), iso(t0 + 125e3), 1]);
  // After the pause ended, within the hour: a second refusal stops the tool.
  assert.equal(nextPause(burst, { at: iso(t0 + 600e3), until: iso(t0 + 660e3), why: 'z' }, t0 + 600e3).stopped, true);
  // Past the hour: a fresh first refusal.
  assert.equal(nextPause(burst, { at: iso(t0 + 4000e3), until: iso(t0 + 4060e3), why: 'z' }, t0 + 4000e3).stopped, false);
  // The shared store refuses the write: the refused clone obeys its own record anyway.
  const root = makeRepo({ 'README.md': 'x\n' });
  useShared({ read: () => ({ pause: null, use: [] }), pause: () => { throw new Error('the push of process-state failed: HTTP 403'); } });
  const c = clock(t0);
  const r = ghAfter(['pr', 'comment'], { code: 1, stderr: 'HTTP 403: You have exceeded a secondary rate limit' }, root, { now: c.now });
  assert.match(r.unshared, /HTTP 403/);
  assert.equal(localPause(root).until, iso(t0 + 60e3), 'at least one minute, as GitHub\'s docs say');
  ghTurn(['pr', 'view', '1'], root, { p: P, now: c.now, sleep: c.sleep });
  assert.deepEqual(c.slept, [60e3]);
  // A refusal is read from gh's stderr only: a check named "rate limit" in stdout is no refusal.
  assert.equal(ghAfter(['pr', 'checks'], { code: 1, stdout: 'rate limit test\tfail', stderr: 'some checks failed' }, root, { now: c.now }), null);
});

test('a --paginate call logs one request a page; a failing rate_limit read is not repeated within the minute; GraphQL calls check GraphQL\'s own budget', (t) => {
  const f = logFile();
  env(t, { P3_GITHUB_LOG: f, CLAUDE_CODE_SESSION_ID: 'cse_a' });
  const root = makeRepo({ 'README.md': 'x\n' });
  ghAfter(['api', '--paginate', 'repos/o/p/pulls?state=all&per_page=100'], { code: 0, stdout: JSON.stringify(Array.from({ length: 250 }, (_, i) => i)) }, root);
  ghAfter(['api', '--paginate', '--slurp', 'repos/o/p/pulls/1/files?per_page=100'], { code: 0, stdout: JSON.stringify([[1], [2], [3], [4]]) }, root);
  const pages = readFileSync(f, 'utf8').trim().split('\n').map((l) => JSON.parse(l)).map((r) => r.points);
  assert.deepEqual(pages, [2, 3]);
  let reads = 0;
  const failing = () => { reads++; return null; };
  const t0 = Date.parse('2026-11-06T22:00:00Z');
  assert.equal(primaryState(root, { t: t0, read: failing }), null);
  assert.equal(primaryState(root, { t: t0 + 30e3, read: failing }), null);
  assert.equal(reads, 1, 'remembered for the minute');
  // REST has room; GraphQL is at 90%: a gh pr command waits for GraphQL's reset, a REST call does not.
  const c = clock(t0 + 120e3);
  const [coreReset, gqlReset] = [c.t + 600e3, c.t + 300e3];
  const rl = () => (c.t < gqlReset ? { limit: 5000, remaining: 4000, reset: coreReset, graphql: { limit: 5000, remaining: 500, reset: gqlReset } } : { limit: 5000, remaining: 4000, reset: coreReset, graphql: { limit: 5000, remaining: 5000, reset: gqlReset + 3600e3 } });
  ghTurn(['api', 'repos/o/p'], root, { p: P, now: c.now, sleep: c.sleep, rateLimit: rl });
  assert.deepEqual(c.slept, []);
  ghTurn(['pr', 'view', '1'], root, { p: P, now: c.now, sleep: c.sleep, rateLimit: rl });
  assert.deepEqual(c.slept, [300e3]);
});

test('github budget: use against each published limit, per window, as a percentage, account-wide; usage rows shared with the command\'s push', (t) => {
  const f = logFile();
  env(t, { P3_GITHUB_LOG: f, CLAUDE_CODE_SESSION_ID: 'cse_me' });
  const { root, bare } = withOrigin({ 'process/config.json': {} });
  const c = clock(Date.now());
  for (let i = 0; i < 4; i++) ghTurn(['pr', 'comment', '1'], root, { p: P, now: c.now, sleep: c.sleep });
  ghTurn(['pr', 'view', '1'], root, { p: P, now: c.now, sleep: c.sleep });
  pushSeen(['push', '-q', 'origin', 'HEAD:refs/heads/job/a'], root);
  assert.deepEqual(usageRows(root).map((r) => [r.calls, r.points, r.content]).reduce((s, x) => s.map((v, i) => v + x[i]), [0, 0, 0]), [5, 21, 4]);
  const cfg = configOf({});
  assert.ok(shareUsage(root, cfg, { force: true }) >= 1);
  assert.match(git(['ls-tree', '--name-only', 'process-state', 'github/use/'], { cwd: bare }), /github\/use\/cse_me\.jsonl/);
  assert.equal(shareUsage(root, cfg, {}), 0, 'nothing new since');
  // Another session's shared rows count; this clone's own come from its log, never twice.
  // R17e: the read holds this clone's share (its at after the share's), so the log adds nothing.
  const readAt = Date.now();
  const sharedPushes = readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)).filter((r) => r.kind === 'push' && Date.parse(r.at) <= lastShared(root)).length;
  useShared({ read: () => ({ at: readAt, pause: null, use: [{ session: 'cse_other', minute: new Date(c.t).toISOString().replace(/\.\d+Z$/, 'Z'), calls: 10, points: 50, content: 10, pushes: 2 }, { session: 'cse_me', clone: cloneId(root), minute: new Date(c.t).toISOString(), calls: 5, points: 21, content: 4, pushes: sharedPushes }] }), pause: () => {} });
  const out = [];
  const r = githubBudget(root, { now: c.t, log: (l) => out.push(l), p: P, rateLimit: () => ({ limit: 5000, remaining: 4000, reset: c.t + 1800e3 }) });
  // Every push this clone made is in its log (the fixture's, the share's state push, job/a's).
  const mine = readFileSync(f, 'utf8').split('\n').filter((l) => l.includes('"kind":"push"')).length;
  assert.ok(mine >= 2);
  assert.deepEqual([r.minute.content, r.hour.content, r.hour.pushes], [14, 14, 2 + mine]);
  const text = out.join('\n');
  assert.match(text, /the target is 85% of GitHub's published limits \(https:\/\/docs\.github\.com\/en\/rest\/using-the-rest-api\/rate-limits-for-the-rest-api, read 2026-11-06\)/);
  assert.match(text, /- primary, an hour: 1000\/5000 \(20%\)/);
  assert.match(text, /- REST points, the last minute: 71\/900 \(8%\)/);
  assert.match(text, /- content-creating requests, the last minute: 14\/80 \(18%\)/);
  assert.match(text, /- content-creating requests, the last hour: 14\/500 \(3%\)/);
  assert.match(text, /cse_other: 10 gh call\(s\), 10 content-creating, 2 push\(es\)/);
  assert.match(text, /no pause/);
  assert.match(text, /- pushes, the last hour: \d+\/120 \(\d+%\) of the process's own ceiling \(PD-3; GitHub publishes none/);
  // A new session waits while the hour's content use is at target.
  useShared({ read: () => ({ pause: null, use: [{ session: 'cse_other', minute: new Date(c.t).toISOString(), calls: 430, points: 2150, content: 430, pushes: 0 }] }), pause: () => {} });
  assert.match(budgetGate(root, { p: P, now: c.t }) || '', /content-creating requests an hour used account-wide, the target 85%: a new session waits/);
});

test('coalesced state writes: read at once in the command, pushed once at its end, made again on a tip another writer moved', (t) => {
  const { root, bare } = withOrigin({ 'README.md': 'x\n' });
  const SB = 'process-state';
  writeState(root, SB, 'seed', (wt) => { writeFileSync(join(wt, 'seed.txt'), 's\n'); return {}; });
  let pushes = 0;
  const real = (wt, sb) => { pushes++; return git(['push', '-q', 'origin', `HEAD:refs/heads/${sb}`], { cwd: wt, allowFail: true }); };
  stateIO.push = real;
  stateIO.wait = 1;
  stateBatch(true);
  t.after(() => { stateBatch(false); stateIO.push = null; stateIO.wait = null; });
  const add = (f, v) => (wt) => { writeFileSync(join(wt, f), `${(() => { try { return readFileSync(join(wt, f), 'utf8'); } catch { return ''; } })()}${v}\n`); return { f }; };
  const r = writeState(root, SB, 'one', add('a.txt', '1'));
  assert.equal(r.f, 'a.txt');
  writeState(root, SB, 'two', add('a.txt', '2'));
  assert.equal(readState(root, SB, 'a.txt'), '1\n2\n', 'the command reads its own writes');
  assert.equal(pushes, 0);
  assert.equal(pendingWrites(), 2);
  assert.equal(git(['show', `${SB}:a.txt`], { cwd: bare, allowFail: true }).code, 128, 'origin has none yet');
  // Another writer moves origin meanwhile.
  const other = join(mkdtempSync(join(tmpdir(), 'p3-other-')), 'c');
  git(['clone', '-q', '--branch', SB, bare, other], { cwd: root });
  writeFileSync(join(other, 'b.txt'), 'theirs\n');
  git(['add', '-A'], { cwd: other });
  git(['-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '-m', 'theirs'], { cwd: other });
  git(['push', '-q', 'origin', SB], { cwd: other });
  assert.equal(flushState(), 2);
  assert.equal(pushes, 1, 'the flush reads origin\'s tip first: one push for both writes');
  assert.equal(git(['show', `${SB}:a.txt`], { cwd: bare }), '1\n2');
  assert.equal(git(['show', `${SB}:b.txt`], { cwd: bare }), 'theirs');
  assert.deepEqual(git(['log', '--format=%s', '-3', SB], { cwd: bare }).split('\n'), ['two', 'one', 'theirs']);
  assert.equal(pendingWrites(), 0);
  // A fresh read mid-command makes the pending writes again on origin's tip.
  writeState(root, SB, 'three', add('a.txt', '3'));
  git(['-c', 'user.name=t', '-c', 'user.email=t@t', 'pull', '-q', 'origin', SB], { cwd: other });
  writeFileSync(join(other, 'c.txt'), 'c\n');
  git(['add', '-A'], { cwd: other });
  git(['-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '-m', 'theirs again'], { cwd: other });
  git(['push', '-q', 'origin', SB], { cwd: other });
  fetchState(root, SB, { fresh: true });
  assert.deepEqual([readState(root, SB, 'a.txt'), readState(root, SB, 'c.txt')], ['1\n2\n3\n', 'c\n'], 'origin\'s new tip, with the pending write made again on it');
  writeState(root, SB, 'four', add('c.txt', 'mine'));
  assert.equal(readState(root, SB, 'a.txt'), '1\n2\n3\n');
  flushState();
  assert.equal(git(['show', `${SB}:c.txt`], { cwd: bare }), 'c\nmine');
  assert.equal(git(['show', `${SB}:a.txt`], { cwd: bare }), '1\n2\n3');
});

test('a command run through p3 pushes its state writes once, at its end, and leaves writes unbatched after it', async (t) => {
  const { root, bare } = withOrigin({ 'CLAUDE.md': '# Product\n' });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  const { main } = await import('../p3.mjs');
  let pushes = 0;
  stateIO.push = (wt, sb) => { pushes++; return git(['push', '-q', 'origin', `HEAD:refs/heads/${sb}`], { cwd: wt, allowFail: true }); };
  t.after(() => { stateIO.push = null; });
  const cwd = process.cwd();
  const log = console.log;
  console.log = () => {};
  try { process.chdir(root); assert.equal(await main(['send', 'job-x', 'merge your PR', '--from', 'bob']), 0); } finally { process.chdir(cwd); console.log = log; }
  assert.equal(pushes, 1);
  assert.match(git(['log', '--format=%s', '-1', 'process-state'], { cwd: bare }), /bob/);
  assert.equal(pendingWrites(), 0);
  writeState(root, 'process-state', 'after', (wt) => { writeFileSync(join(wt, 'after.txt'), 'x\n'); return {}; });
  assert.equal(pushes, 2, 'outside a command a write pushes at once');
});

test('coalesced writes survive another process resetting the clone\'s ref, a kill before the flush, and a refused flush keeps only its own', (t) => {
