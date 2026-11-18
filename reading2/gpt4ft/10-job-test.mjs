import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseBlock, GATE, block } from '../lib/github.mjs';
import { jobBlock, jobComplete, jobSender, jobStart, jobTest, recordTest, startText } from '../lib/job.mjs';
import { merge } from '../lib/merge.mjs';
import { status } from '../lib/status.mjs';
import { checkLedger, readEntry } from '../lib/ledger.mjs';
import { appendRow, flowFigures, idleByDay, layerOf, overhead, readRows, report } from '../lib/metrics.mjs';
import { git } from '../lib/util.mjs';
import { commit, entry, makeRepo, write } from './helpers.mjs';

const quiet = () => {};
// The setup check reads GitHub; these products stand for one whose setup is complete.
const ready = () => ({ ok: true, missing: [] });
const passing = "import test from 'node:test'; test('ok', () => {});\n";
const failing = "import test from 'node:test'; import a from 'node:assert'; test('no', () => a.fail('x'));\n";

function product() {
  const root = makeRepo({
    'process/ledger/alpha.json': entry('alpha'),
    'req/alpha.md': '# alpha\n\nR1 does a thing.\n',
    'test/alpha/a.test.mjs': passing,
  });
  git(['branch', 'tranche'], { cwd: root });
  return root;
}

test('job start writes WORKING, an attempt row and a START with sizes, commands and the blocked exit', () => {
  const root = product();
  const { start, attempt } = jobStart(root, 'alpha', { coordinator: 'session_bob', push: false, log: quiet });
  assert.equal(attempt, 1);
  assert.match(start, /\| `req\/alpha.md` \| 26 \|/);
  assert.match(start, /session `session_bob`/);
  assert.match(start, /p3.mjs job complete alpha/);
  assert.match(start, /p3.mjs block alpha --reason/);
  assert.equal(git(['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: root }), 'main', 'returns to the branch it started on');
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  assert.equal(readEntry(root, 'alpha').status.state, 'WORKING');
  assert.equal(readRows(root, 'alpha')[0].event, 'start');
});

test('job start refuses an entry that is not OPEN', () => {
  const root = product();
  jobStart(root, 'alpha', { coordinator: 's', push: false, log: quiet });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  git(['merge', '-q', 'job/alpha'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  git(['branch', '-D', 'job/alpha'], { cwd: root });
  assert.throws(() => jobStart(root, 'alpha', { coordinator: 's', push: false, log: quiet }), /WORKING, not OPEN/);
});

test('job complete runs the fast checks and no suite (AUD-7), then sets COMPLETE and builds the receipt', () => {
  const root = product();
  jobStart(root, 'alpha', { coordinator: 's', push: false, log: quiet });
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  commit(root, { 'src/alpha/index.mjs': 'export const x = 1;\n' });
  const r = jobComplete(root, 'alpha', { push: false, notVerified: ['the live site'], log: quiet });
  assert.equal(r.ok, true);
  assert.equal(readEntry(root, 'alpha').status.state, 'COMPLETE');
  assert.equal(r.receipt.commands.find((c) => c.suite), undefined, 'the suite runs in CI, never in the session');
  assert.deepEqual(r.receipt.not_verified, ['the live site']);
  assert.equal(r.receipt.sha, git(['rev-parse', 'HEAD'], { cwd: root }));
});

test('job complete --cost-usd writes the job\'s own cost row, its session\'s cost since its last row; a bad value is refused before anything runs', () => {
  const root = product();
  jobStart(root, 'alpha', { coordinator: 's', push: false, log: quiet });
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  commit(root, { 'src/alpha/index.mjs': 'export const x = 1;\n' });
  assert.throws(() => jobComplete(root, 'alpha', { push: false, costUsd: 'lots', session: 's1', log: quiet }), /--cost-usd <your session's cost so far/);
  assert.equal(jobComplete(root, 'alpha', { push: false, costUsd: '2.5', session: 's1', log: quiet }).ok, true);
  const rows = readRows(root, 'alpha');
  const m = rows.filter((r) => r.event === 'measured');
  assert.deepEqual(m.map((r) => [r.role, r.session, r.session_usd, r.cost_usd]), [['job', 's1', 2.5, 2.5]]);
  // The report reads it as the job's cost.
  const o = overhead(rows);
  assert.equal(o.jobs.find((j) => j.module === 'alpha').job_usd, 2.5);
});

// The copy, 4 Nov: queue's attempt 2 in attempt 1's session read get_session's unmoved usage.
test('job complete --cost-usd no higher than its session\'s last row records the delta unmeasured, and the report reads the job unmeasured, never 0', () => {
  const root = product();
  jobStart(root, 'alpha', { coordinator: 's', push: false, log: quiet });
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  appendRow(root, 'alpha', { row: 'attempt', event: 'measured', role: 'job', attempt: 0, session: 's1', session_usd: 3.25, cost_usd: 3.25 });
  commit(root, { 'src/alpha/index.mjs': 'export const x = 1;\n' });
  const said = [];
  assert.equal(jobComplete(root, 'alpha', { push: false, costUsd: '3.25', session: 's1', log: (m) => said.push(m) }).ok, true);
  const m = readRows(root, 'alpha').filter((r) => r.event === 'measured');
  assert.deepEqual(m.map((r) => [r.session, r.session_usd, r.cost_usd]), [['s1', 3.25, 3.25], ['s1', 3.25, 'unmeasured']]);
  assert.ok(said.some((l) => /job alpha's cost: unmeasured \(session s1 read 3\.25, its last row 3\.25/.test(l)), said.join('\n'));
  // A row of 0 written before (the copy's queue attempt 2) reads unmeasured too, for its attempt.
  const rows = [
    { at: '2026-11-04T12:00:00Z', module: 'q', row: 'attempt', event: 'start', role: 'job', attempt: 1 },
    { at: '2026-11-04T12:12:59Z', module: 'q', row: 'attempt', event: 'measured', role: 'job', attempt: 1, session: 's', session_usd: 3.25, cost_usd: 3.25 },
    { at: '2026-11-04T12:26:35Z', module: 'q', row: 'attempt', event: 'start', role: 'job', attempt: 2 },
    { at: '2026-11-04T12:30:28Z', module: 'q', row: 'attempt', event: 'measured', role: 'job', attempt: 2, session: 's', session_usd: 3.25, cost_usd: 0 },
  ];
  assert.equal(overhead(rows).jobs.find((j) => j.module === 'q').job_usd, 'unmeasured');
  // A priced row for that attempt (the merge run again with a moved figure) stands instead.
  rows.push({ at: '2026-11-04T12:34:55Z', module: 'q', row: 'attempt', event: 'measured', role: 'job', attempt: 2, session: 's', session_usd: 4.04, cost_usd: 0.79 });
  assert.equal(overhead(rows).jobs.find((j) => j.module === 'q').job_usd, 4.04);
});

test('job complete refuses a zero --cost-usd, naming where to read it, before anything runs', () => {
  const root = product();
  jobStart(root, 'alpha', { coordinator: 's', push: false, log: quiet });
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  commit(root, { 'src/alpha/index.mjs': 'export const x = 1;\n' });
  const where = /get_session on your own session \(no session_id\), the field external_metadata\.usage\.cost_usd/;
  assert.throws(() => jobComplete(root, 'alpha', { push: false, costUsd: '0', session: 's1', log: quiet }), where);
  assert.throws(() => jobComplete(root, 'alpha', { push: false, costUsd: '0', session: 's1', log: quiet }), /0 is a figure not read/);
  assert.equal(readEntry(root, 'alpha').status.state, 'WORKING');
  assert.equal(readRows(root, 'alpha').filter((r) => r.event === 'measured').length, 0);
});

test('job complete names its session in get_session\'s form (cse_ to session_) and takes the delta from that session\'s last priced row in either form', () => {
  const root = product();
  jobStart(root, 'alpha', { coordinator: 's', push: false, log: quiet });
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  appendRow(root, 'alpha', { row: 'attempt', event: 'measured', role: 'job', attempt: 0, session: 'session_X', session_usd: 1, cost_usd: 1 });
  // A zero row the old tool wrote (the copy's signatures a4): never the delta's base.
  appendRow(root, 'alpha', { row: 'attempt', event: 'measured', role: 'job', attempt: 0, session: 'cse_X', session_usd: 0, cost_usd: 0 });
  commit(root, { 'src/alpha/index.mjs': 'export const x = 1;\n' });
  const was = process.env.CLAUDE_CODE_REMOTE_SESSION_ID;
  process.env.CLAUDE_CODE_REMOTE_SESSION_ID = 'cse_X';
  try { assert.equal(jobComplete(root, 'alpha', { push: false, costUsd: '3.16', log: quiet }).ok, true); } finally {
    if (was === undefined) delete process.env.CLAUDE_CODE_REMOTE_SESSION_ID; else process.env.CLAUDE_CODE_REMOTE_SESSION_ID = was;
  }
  const m = readRows(root, 'alpha').filter((r) => r.event === 'measured').pop();
  assert.deepEqual([m.session, m.session_usd, m.cost_usd], ['session_X', 3.16, 2.16]);
});

// AUD-7, PLT-4, JOB-5: the session runs only the fast checks; the module's suite runs in CI, whose
// gate checks the receipt against its own run (AUD-2). A red test is CI's to find, not job complete's.
test('job complete never runs the suite: a failing test does not stop it; a failed fast check does', () => {
  const root = product();
  jobStart(root, 'alpha', { coordinator: 's', push: false, log: quiet });
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  commit(root, { 'test/alpha/b.test.mjs': failing });
  const r = jobComplete(root, 'alpha', { push: false, noSuite: true, log: quiet });
  assert.equal(r.ok, true);
  assert.equal(r.receipt.commands.find((c) => c.suite || /node --test/.test(c.cmd)), undefined);
  assert.deepEqual(r.receipt.not_verified, [], 'the suite is CI\'s, not a line the job did not verify');
  const red = product();
  write(red, { 'process/ledger/alpha.json': JSON.stringify({ ...JSON.parse(readFileSync(join(red, 'process/ledger/alpha.json'), 'utf8')), checks: [['node', '-e', 'process.exit(4)']] }, null, 2) + '\n' });
  git(['add', '-A'], { cwd: red });
  git(['commit', '-q', '-m', 'a module check that fails'], { cwd: red });
  git(['branch', '-f', 'tranche', 'HEAD'], { cwd: red });
  jobStart(red, 'alpha', { coordinator: 's', push: false, log: quiet });
  git(['checkout', '-q', 'job/alpha'], { cwd: red });
  commit(red, { 'src/alpha/index.mjs': 'export const x = 1;\n' });
  assert.equal(jobComplete(red, 'alpha', { push: false, log: quiet }).ok, false);
  assert.equal(readEntry(red, 'alpha').status.state, 'WORKING');
});

test('job complete refuses on another branch and on uncommitted work', () => {
  const root = product();
  assert.throws(() => jobComplete(root, 'alpha', { push: false, log: quiet }), /on branch job\/alpha/);
  jobStart(root, 'alpha', { coordinator: 's', push: false, log: quiet });
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  write(root, { 'src/alpha/x.mjs': 'export {};\n' });
  git(['add', '-A'], { cwd: root });
  assert.throws(() => jobComplete(root, 'alpha', { push: false, log: quiet }), /commit your work first/);
});

test('block sets BLOCKED with its reason', () => {
  const root = product();
  jobStart(root, 'alpha', { coordinator: 's', push: false, log: quiet });
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  assert.throws(() => jobBlock(root, 'alpha', { push: false, log: quiet }), /needs --reason/);
  jobBlock(root, 'alpha', { reason: 'R65 names an error code nobody chose', push: false, log: quiet });
  assert.deepEqual(readEntry(root, 'alpha').status.reason, 'R65 names an error code nobody chose');
  // --owner names who owes its ruling (audit of PR 139); the entry still validates.
  assert.throws(() => jobBlock(root, 'alpha', { reason: 'x', owner: 'ROOT', push: false, log: quiet }), /--owner bob .* or coordinator/);
  jobBlock(root, 'alpha', { reason: 'R65 names an error code nobody chose', owner: 'bob', push: false, log: quiet });
  assert.deepEqual([readEntry(root, 'alpha').status.owner, checkLedger(root).length], ['bob', 0]);
});

test('a gate block round-trips through a comment body', () => {
  const body = block(GATE, { runs: [{ minutes: 1 }] }, 'Gate runs');
  assert.deepEqual(parseBlock(body, GATE), { runs: [{ minutes: 1 }] });
  assert.equal(parseBlock(body, 'p3:receipt'), null);
});

test('metrics report counts a refuted COMPLETE claim and gate minutes', () => {
  const root = makeRepo({ 'README.md': 'x' });
  appendRow(root, 'alpha', { row: 'attempt', event: 'complete', attempt: 1, pr: 7 });
  appendRow(root, 'alpha', { row: 'attempt', event: 'measured', attempt: 1, cost_usd: 2.5, tokens: 1000, denials: 2, refusals: [{ act: 'archive', depth: '2', channel: 'START' }] });
  appendRow(root, 'alpha', { row: 'merge', pr: 7 });
  const gate = block(GATE, { runs: [{ minutes: 2, receipt_attempt: 1, suite: 'fail' }, { minutes: 1.5, receipt_attempt: 1, suite: 'pass', revert: 'pass' }] });
  const read = { comments: () => [{ body: gate, user: { login: 'github-actions[bot]' } }], getPR: () => ({ merged_at: null }) };
  assert.equal(report(root, 'o/r', 'HEAD', { read }).complete_claims, 0, 'rows are read at the ref, not from the working tree');
  git(['add', '-A'], { cwd: root });
  git(['commit', '-q', '-m', 'rows'], { cwd: root });
  const r = report(root, 'o/r', 'HEAD', { read });
  assert.equal(r.complete_claims, 1);
  assert.equal(r.refuted, 1);
  assert.equal(r.false_done_rate, 1);
  assert.equal(r.gate_minutes, 3.5);
  assert.equal(r.cost_usd, 2.5);
  assert.equal(r.denials, 2);
  assert.match(r.cost_per_surviving_pr, /PR 7 not merged/);
});

// Copy, 4 Nov: PR 60's merge was recorded twice (02:11 and 02:18) and cost_per_surviving_pr listed it pending twice.
test('metrics report lists a pull request with two merge rows once in cost_per_surviving_pr', () => {
  const root = makeRepo({ 'README.md': 'x' });
  appendRow(root, 'alpha', { row: 'merge', pr: 60 });
  appendRow(root, 'alpha', { row: 'merge', pr: 60 });
  git(['add', '-A'], { cwd: root });
  git(['commit', '-q', '-m', 'rows'], { cwd: root });
  const sha = git(['rev-parse', 'HEAD'], { cwd: root });
  const read = { comments: () => [], getPR: () => ({ merged_at: new Date().toISOString(), merge_commit_sha: sha }) };
  assert.equal(report(root, 'o/r', 'HEAD', { read }).cost_per_surviving_pr.match(/PR 60 /g).length, 1);
});

// Findings from the review of PR 2.
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';

function withOrigin() {
  const root = product();
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'origin.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: root });
  return root;
}
import { join } from 'node:path';

function fakeGitHub() {
  const state = { comments: [], ready: 0, prs: 0, failReady: true, drafted: 0, isDraft: true, body: 'the job', edits: [], gate: false };
  return {
    state,
    open: (slug, p) => { state.prs++; return { number: 9, html_url: 'pr', draft: true, ...p }; },
    find: () => null,
    gh: {
      findPR: () => ({ number: 9, draft: state.isDraft, user: { login: 'civicsmith' } }),
      toDraft: () => { state.drafted++; state.isDraft = true; return { draft: true }; },
      comments: () => state.comments,
      addComment: (s, n, body) => { const c = { id: 100 + state.comments.length, body, html_url: `c${state.comments.length}`, created_at: state.at || new Date(Date.now() + state.comments.length).toISOString(), user: { login: 'civicsmith' } }; state.comments.push(c); return c; },
      getPR: () => ({ number: 9, draft: state.isDraft, body: state.body }),
      editPR: (s, n, f) => { if (state.failEdit) { state.failEdit = false; throw new Error('edit refused'); } state.edits.push(f); state.body = f.body; return { number: 9 }; },
      checkRuns: () => (state.gate === undefined ? null : state.gate ? [state.gate] : []),
      markReady: () => { if (state.failReady) { state.failReady = false; throw new Error('network'); } state.ready++; state.isDraft = false; },
    },
  };
}

test('job start validates before branching and leaves no branch behind when it refuses', () => {
  const root = product();
  git(['checkout', '-q', 'tranche'], { cwd: root });
  commit(root, { 'process/ledger/alpha.json': entry('alpha', { status: { state: 'COMPLETE' } }) });
  git(['checkout', '-q', 'main'], { cwd: root });
  assert.throws(() => jobStart(root, 'alpha', { coordinator: 's', push: false, log: quiet }), /COMPLETE, not OPEN/);
  assert.equal(git(['branch', '--list', 'job/alpha'], { cwd: root }), '');
});

test('job start restores a detached HEAD', () => {
  const root = product();
  const sha = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', '--detach'], { cwd: root });
  jobStart(root, 'alpha', { coordinator: 's', push: false, log: quiet });
  assert.equal(git(['rev-parse', 'HEAD'], { cwd: root }), sha);
});

test('job complete pushes before the receipt, and a rerun finishes without a second receipt', () => {
  const root = withOrigin();
  const f = fakeGitHub();
  jobStart(root, 'alpha', { coordinator: 's', setup: ready, open: f.open, find: f.find, log: quiet });
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  commit(root, { 'src/alpha/index.mjs': 'export const x = 1;\n' });
  assert.throws(() => jobComplete(root, 'alpha', { gh: f.gh, log: quiet }), /network/);
  const tip = git(['rev-parse', 'HEAD'], { cwd: root });
  assert.equal(git(['ls-remote', 'origin', 'refs/heads/job/alpha'], { cwd: root }).split('\t')[0], tip, 'pushed before the receipt');
  assert.equal(f.state.comments.length, 1);
  assert.equal(parseBlock(f.state.comments[0].body, 'p3:receipt').sha, tip);
  const said = [];
  const again = jobComplete(root, 'alpha', { gh: f.gh, log: (m) => said.push(m) });
  assert.equal(again.ok, true);
  // The job's report: the last line wakes BOB, from the job's own sender name, naming the job's
  // session when known (BOB's merge reads the job's cost from it).
  assert.match(said.at(-1), /^next act: wake BOB with `node \.process\/tool\/p3\.mjs send bob "job alpha complete, PR #\d+ ready(, session session_\w+)?: run status" --from job-alpha`, delivered with send_message to the address it prints$/);
  assert.equal(f.state.comments.length, 1, 'no second receipt');
  assert.equal(f.state.ready, 1);
  assert.equal(readRows(root, 'alpha').filter((r) => r.event === 'complete').length, 1);
});

test('block commits only its entry and can run again', () => {
  const root = product();
  jobStart(root, 'alpha', { coordinator: 's', push: false, log: quiet });
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  write(root, { 'src/alpha/wip.mjs': 'x' });
  git(['add', '-A'], { cwd: root });
  jobBlock(root, 'alpha', { reason: 'waiting on a name', push: false, log: quiet });
  assert.equal(git(['show', '--name-only', '--format=', 'HEAD'], { cwd: root }), 'process/ledger/alpha.json');
  jobBlock(root, 'alpha', { reason: 'waiting on a name', push: false, log: quiet });
});

test('block, pushed, ends with the wake of BOB from the job', () => {
  const root = withOrigin();
  const f = fakeGitHub();
  jobStart(root, 'alpha', { coordinator: 's', setup: ready, open: f.open, find: f.find, log: quiet });
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  const said = [];
  jobBlock(root, 'alpha', { reason: 'waiting on a name', log: (m) => said.push(m) });
  assert.equal(said.at(-1), `next act: wake BOB with \`node .process/tool/p3.mjs send bob "job alpha BLOCKED: run status" --from job-alpha\`, delivered with send_message to the address it prints`);
  assert.equal(jobSender('a'.repeat(50)).length, 40);
});

test('a job push refuses a commit that adds a dist/ file, before anything is pushed (agent-runner 3ee34e5, 6 Nov)', () => {
  const root = withOrigin();
  const f = fakeGitHub();
  jobStart(root, 'alpha', { coordinator: 's', setup: ready, open: f.open, find: f.find, log: quiet });
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  const tip = git(['ls-remote', 'origin', 'refs/heads/job/alpha'], { cwd: root }).split('\t')[0];
  commit(root, { 'src/alpha/dist/alpha.bundled.mjs': 'export {};\n' });
  assert.throws(() => jobBlock(root, 'alpha', { reason: 'x', log: quiet }), /nothing was pushed: commit \w+ adds src\/alpha\/dist\/alpha\.bundled\.mjs \(under a dist\/ directory/);
  assert.equal(git(['ls-remote', 'origin', 'refs/heads/job/alpha'], { cwd: root }).split('\t')[0], tip, 'not pushed');
});

test('after a failed push, a rerun posts the saved receipt for the COMPLETE commit', () => {
  const root = withOrigin();
  const f = fakeGitHub();
  f.state.failReady = false;
  jobStart(root, 'alpha', { coordinator: 's', setup: ready, open: f.open, find: f.find, log: quiet });
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  commit(root, { 'src/alpha/index.mjs': 'export const x = 1;\n' });
  git(['config', 'remote.origin.pushurl', '/nonexistent/origin.git'], { cwd: root });
  assert.throws(() => jobComplete(root, 'alpha', { gh: f.gh, log: quiet }), /run job complete again/);
  assert.equal(f.state.comments.length, 0);
  git(['config', '--unset', 'remote.origin.pushurl'], { cwd: root });
  assert.equal(jobComplete(root, 'alpha', { gh: f.gh, log: quiet }).ok, true);
  assert.equal(f.state.comments.length, 1);
  const r = parseBlock(f.state.comments[0].body, 'p3:receipt');
  assert.equal(r.sha, git(['rev-parse', 'HEAD'], { cwd: root }));
  assert.equal(r.commands.find((c) => c.suite), undefined);
});

// Copy PR 40, 4 Nov: a COMPLETE job's rerun with a new --exempt-revert was ignored, the saved
// receipt replayed, and the gate stayed red with no way to amend it but a restart.
function completed() {
  const root = withOrigin();
  const f = fakeGitHub();
  f.state.failReady = false;
  jobStart(root, 'alpha', { coordinator: 's', setup: ready, open: f.open, find: f.find, log: quiet });
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  commit(root, { 'src/alpha/index.mjs': 'export const x = 1;\n' });
  jobComplete(root, 'alpha', { gh: f.gh, notVerified: ['the live site'], log: quiet });
  return { root, f };
}

test('a COMPLETE job rerun with --exempt-revert posts one amended receipt at the same commit', () => {
  const { root, f } = completed();
  const tip = git(['rev-parse', 'HEAD'], { cwd: root });
  assert.equal(f.state.comments.length, 1);
  jobComplete(root, 'alpha', { gh: f.gh, exemptRevert: 'filter-only test edits', log: quiet });
  assert.equal(f.state.comments.length, 2, 'the amended receipt is posted');
  assert.match(f.state.comments[1].body, /Amended receipt for job `alpha`/);
  const r = parseBlock(f.state.comments[1].body, 'p3:receipt');
  assert.equal(r.sha, tip, 'same commit');
  assert.equal(r.attempt, 1);
  assert.deepEqual(r.exempt, { revert: 'filter-only test edits' });
  assert.deepEqual(r.not_verified, ['the live site']);
  assert.deepEqual(r.amended.was, { exempt: {}, not_verified: ['the live site'] });
  assert.equal(r.commands.find((c) => c.suite), undefined, 'the commands are the saved run, not a new one');
  assert.equal(git(['rev-parse', 'HEAD'], { cwd: root }), tip, 'nothing committed');
  assert.equal(readRows(root, 'alpha').filter((x) => x.event === 'complete').length, 1);
  // The same claims again post nothing; a plain rerun posts nothing either.
  jobComplete(root, 'alpha', { gh: f.gh, exemptRevert: 'filter-only test edits', log: quiet });
  jobComplete(root, 'alpha', { gh: f.gh, log: quiet });
  assert.equal(f.state.comments.length, 2);
});

test('an amended receipt only adds not-verified lines, and a rerun naming no change posts nothing', () => {
  const { root, f } = completed();
  jobComplete(root, 'alpha', { gh: f.gh, notVerified: ['the live site'], log: quiet });
  assert.equal(f.state.comments.length, 1, 'a line already there is no change');
  jobComplete(root, 'alpha', { gh: f.gh, notVerified: ['the walker'], log: quiet });
  const r = parseBlock(f.state.comments[1].body, 'p3:receipt');
  assert.deepEqual(r.not_verified, ['the live site', 'the walker'], 'kept, never dropped');
  assert.deepEqual(r.exempt, {});
});

test('a second amendment keeps the first one\'s claims, in either order (review of PR 64)', () => {
  for (const order of [['nv', 'ex'], ['ex', 'nv']]) {
    const { root, f } = completed();
    for (const k of order) jobComplete(root, 'alpha', { gh: f.gh, ...(k === 'nv' ? { notVerified: ['the walker'] } : { exemptRevert: 'why' }), log: quiet });
    assert.equal(f.state.comments.length, 3, order.join(','));
    const r = parseBlock(f.state.comments[2].body, 'p3:receipt');
    assert.deepEqual(r.exempt, { revert: 'why' }, order.join(','));
    assert.deepEqual(r.not_verified, ['the live site', 'the walker'], order.join(','));
    assert.deepEqual(r.amended.was, order[0] === 'nv' ? { exempt: {}, not_verified: ['the live site', 'the walker'] } : { exempt: { revert: 'why' }, not_verified: ['the live site'] });
    // the same claims once more post nothing
    jobComplete(root, 'alpha', { gh: f.gh, exemptRevert: 'why', notVerified: ['the walker'], log: quiet });
    assert.equal(f.state.comments.length, 3);
  }
});

// An amended receipt changes no claim the gate reads (Bob, 5 Nov: the revert check is advisory),
// so a ready pull request is not gated again for it.
const RED = { status: 'completed', conclusion: 'failure', started_at: '2026-11-05T00:00:00Z' };
test('an amended revert exemption on a ready pull request posts the receipt and edits nothing', () => {
  const { root, f } = completed();
  f.state.gate = RED;
  jobComplete(root, 'alpha', { gh: f.gh, exemptRevert: 'why', log: quiet });
  assert.equal(f.state.comments.length, 2);
  assert.equal(f.state.edits.length, 0);
});


test('an amendment on a draft pull request is marked ready, not edited', () => {
  const { root, f } = completed();
  f.state.gate = RED;
  f.state.isDraft = true;
  const ready = f.state.ready;
  jobComplete(root, 'alpha', { gh: f.gh, exemptRevert: 'why', log: quiet });
  assert.equal(f.state.ready, ready + 1);
  assert.equal(f.state.edits.length, 0);
});

test('a COMPLETE job may amend with .process moved to a newer pin; a WORKING job may not', () => {
  const tool = makeRepo({ 'tool/x.mjs': 'export const v = 1;\n' });
  const sub = (root) => {
    git(['-c', 'protocol.file.allow=always', 'submodule', 'add', '-q', tool, '.process'], { cwd: root });
    git(['commit', '-q', '-m', 'pin'], { cwd: root });
  };
  const bump = (root) => {
    commit(tool, { 'tool/x.mjs': `export const v = ${Date.now()};\n` });
    git(['-c', 'protocol.file.allow=always', 'fetch', '-q', 'origin'], { cwd: join(root, '.process') });
    git(['checkout', '-q', 'origin/HEAD'], { cwd: join(root, '.process') });
    assert.match(git(['status', '--porcelain', '--untracked-files=no'], { cwd: root }), /\.process/);
  };
  const w = withOrigin();
  git(['checkout', '-q', 'tranche'], { cwd: w });
  sub(w);
  git(['push', '-q', 'origin', 'tranche'], { cwd: w });
  git(['checkout', '-q', 'main'], { cwd: w });
  const g = fakeGitHub();
  g.state.failReady = false;
  jobStart(w, 'alpha', { coordinator: 's', setup: ready, open: g.open, find: g.find, log: quiet });
  git(['checkout', '-q', 'job/alpha'], { cwd: w });
  git(['-c', 'protocol.file.allow=always', 'submodule', 'update', '-q', '--init'], { cwd: w });
  commit(w, { 'src/alpha/index.mjs': 'export const x = 1;\n' });
  bump(w);
  // The tool runs from the product's .process, as it does in a session.
  const toolRoot = join(w, '.process');
  assert.throws(() => jobComplete(w, 'alpha', { gh: g.gh, toolRoot, log: quiet }), /\.process is not at the pin this branch records, and a job never commits \.process: run `git submodule update \.process`/, 'WORKING: a moved submodule is refused, naming the update');
  git(['-c', 'protocol.file.allow=always', 'submodule', 'update', '-q'], { cwd: w });
  jobComplete(w, 'alpha', { gh: g.gh, toolRoot, log: quiet });
  bump(w);
  jobComplete(w, 'alpha', { gh: g.gh, toolRoot, exemptRevert: 'why', log: quiet });
  assert.equal(g.state.comments.length, 2);
  assert.equal(parseBlock(g.state.comments[1].body, 'p3:receipt').exempt.revert, 'why');
});

// Copy PR 79, 4 Nov: job site was COMPLETE, its gate went red, and it pushed fixes; job complete
// refused ("commits were added after it"), --reopen needs a merged PR and --restart WORKING.
// With the pull request open, a rerun after new commits completes a new attempt.
function redAndFixed() {
  const { root, f } = completed();
  const first = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['push', '-q', 'origin', 'HEAD:refs/heads/job/alpha'], { cwd: root });
  const fix = commit(root, { 'test/alpha/c.test.mjs': passing });
  return { root, f, first, fix };
}

test('a COMPLETE job with fix commits after it completes attempt 2: checks, suite, start row, COMPLETE, receipt, draft then ready', () => {
  const { root, f, first, fix } = redAndFixed();
  const fixAt = new Date(git(['log', '-1', '--format=%cI', fix], { cwd: root })).toISOString().replace(/\.\d+Z$/, 'Z');
  assert.equal(f.state.ready, 1);
  const r = jobComplete(root, 'alpha', { gh: f.gh, exemptRevert: 'browser test skips in CI without Chromium', log: quiet });
  assert.equal(r.ok, true);
  assert.equal(r.receipt.attempt, 2);
  assert.equal(r.receipt.after, first, 'names the COMPLETE commit it follows');
  const tip = git(['rev-parse', 'HEAD'], { cwd: root });
  assert.equal(r.receipt.sha, tip);
  assert.notEqual(tip, fix, 'a new COMPLETE commit');
  assert.equal(git(['rev-parse', 'HEAD^'], { cwd: root }), fix);
  assert.equal(git(['ls-remote', 'origin', 'refs/heads/job/alpha'], { cwd: root }).split('\t')[0], tip, 'pushed');
  assert.equal(r.receipt.commands.find((c) => c.suite), undefined, 'no suite in the session (AUD-7)');
  assert.deepEqual(r.receipt.exempt, { revert: 'browser test skips in CI without Chromium' });
  assert.equal(readEntry(root, 'alpha').status.state, 'COMPLETE');
  const rows = readRows(root, 'alpha');
  assert.deepEqual(rows.map((x) => [x.event, x.attempt]), [['start', 1], ['complete', 1], ['start', 2], ['complete', 2]]);
  assert.equal(rows[2].at, fixAt, 'attempt 2 starts at its first commit');
  assert.deepEqual(rows[2].again, { after: first, pr: 9 });
  assert.equal(rows[2].branch, 'job/alpha', 'the --again start row names the branch it works on (copy PR 454)');
  assert.equal(rows[3].receipt.attempt, 2);
  // Only its records (the entry is unchanged when both completes fall in the same second).
  const names = git(['show', '--name-only', '--format=', 'HEAD'], { cwd: root }).split('\n');
  assert.ok(names.includes('process/metrics/alpha.jsonl') && names.every((n) => ['process/ledger/alpha.json', 'process/metrics/alpha.jsonl'].includes(n)), names.join(', '));
  assert.equal(f.state.drafted, 1, 'made a draft before the push');
  assert.equal(f.state.ready, 2, 'ready again after the receipt');
  assert.equal(f.state.comments.length, 2);
  const posted = parseBlock(f.state.comments[1].body, 'p3:receipt');
  assert.equal(posted.attempt, 2);
  assert.match(f.state.comments[1].body, /\nReceipt for job `alpha`, attempt 2,/);
  // A plain rerun at the new COMPLETE commit posts nothing and starts no attempt 3.
  jobComplete(root, 'alpha', { gh: f.gh, log: quiet });
  assert.equal(f.state.comments.length, 2);
  assert.equal(readRows(root, 'alpha').length, 4);
});

// Copy, 4 Nov: site's attempt 2 committed and stopped on the draft step (GraphQL, HTTP 403),
// before its push: no receipt, a red gate. The rerun finishes push, receipt, ready.
test('attempt 2 stopped on the draft step: a rerun pushes, posts attempt 2\'s receipt and marks ready', () => {
  const { root, f } = redAndFixed();
  const draft = f.gh.toDraft;
  f.gh.toDraft = () => { throw new Error('gh api graphql -f failed (HTTP 403)'); };
  assert.throws(() => jobComplete(root, 'alpha', { gh: f.gh, log: quiet }), /HTTP 403/);
  const tip = git(['rev-parse', 'HEAD'], { cwd: root });
  assert.equal(readEntry(root, 'alpha').status.state, 'COMPLETE');
  assert.notEqual(git(['ls-remote', 'origin', 'refs/heads/job/alpha'], { cwd: root }).split('\t')[0], tip, 'not pushed');
  assert.equal(f.state.comments.length, 1, 'no attempt 2 receipt yet');
  f.gh.toDraft = draft;
  jobComplete(root, 'alpha', { gh: f.gh, log: quiet });
  assert.equal(git(['ls-remote', 'origin', 'refs/heads/job/alpha'], { cwd: root }).split('\t')[0], tip);
  assert.equal(f.state.comments.length, 2);
  assert.deepEqual([parseBlock(f.state.comments[1].body, 'p3:receipt').attempt, parseBlock(f.state.comments[1].body, 'p3:receipt').sha], [2, tip]);
  assert.deepEqual([f.state.drafted, f.state.ready], [1, 2]);
});

test('attempt 2 pushed while ready but never given its receipt: a rerun makes it a draft, posts the receipt, then marks ready', () => {
  const { root, f } = redAndFixed();
  const draft = f.gh.toDraft;
  f.gh.toDraft = () => { throw new Error('HTTP 403'); };
  assert.throws(() => jobComplete(root, 'alpha', { gh: f.gh, log: quiet }), /HTTP 403/);
  f.gh.toDraft = draft;
  git(['push', '-q', 'origin', 'HEAD:refs/heads/job/alpha'], { cwd: root }); // a push by hand
  const seen = [];
  const d = f.gh.toDraft, a = f.gh.addComment, m = f.gh.markReady;
  f.gh.toDraft = (...x) => { seen.push('draft'); return d(...x); };
  f.gh.addComment = (...x) => { seen.push('receipt'); return a(...x); };
  f.gh.markReady = (...x) => { seen.push('ready'); return m(...x); };
  jobComplete(root, 'alpha', { gh: f.gh, log: quiet });
  assert.deepEqual(seen, ['draft', 'receipt', 'ready']);
  assert.equal(parseBlock(f.state.comments[1].body, 'p3:receipt').attempt, 2);
  // Done: a plain rerun touches nothing.
  seen.length = 0;
  jobComplete(root, 'alpha', { gh: f.gh, log: quiet });
  assert.deepEqual(seen, []);
});

test('attempt 2 whose ready step fails after its receipt: a rerun marks ready without a second receipt', () => {
  const { root, f } = redAndFixed();
  f.state.failReady = true;
  assert.throws(() => jobComplete(root, 'alpha', { gh: f.gh, log: quiet }), /network/);
  assert.equal(f.state.comments.length, 2, 'the receipt was posted before the failed ready');
  jobComplete(root, 'alpha', { gh: f.gh, log: quiet });
  assert.equal(f.state.comments.length, 2);
  assert.equal(f.state.ready, 2);
  assert.equal(f.state.drafted, 1);
});

test('attempt 2 after the job merges an older tranche commit starts at its own first-parent commit, after attempt 1 (review of PR 81)', () => {
  const { root, f } = completed();
  const done = readRows(root, 'alpha').at(-1).at;
  const env = { ...process.env };
  try {
    process.env.GIT_COMMITTER_DATE = process.env.GIT_AUTHOR_DATE = '2020-01-01T00:00:00Z';
    git(['checkout', '-q', 'tranche'], { cwd: root });
    commit(root, { 'other.txt': 'older tranche work' });
    git(['push', '-q', 'origin', 'tranche'], { cwd: root });
    git(['checkout', '-q', 'job/alpha'], { cwd: root });
  } finally { process.env = env; }
  git(['merge', '-q', '--no-ff', '--no-edit', 'tranche'], { cwd: root });
  const mergeAt = new Date(git(['log', '-1', '--format=%cI'], { cwd: root })).toISOString().replace(/\.\d+Z$/, 'Z');
  jobComplete(root, 'alpha', { gh: f.gh, log: quiet });
  const s2 = readRows(root, 'alpha').filter((x) => x.event === 'start')[1];
  assert.ok(s2.at >= done, `${s2.at} is not before attempt 1's complete ${done}`);
  assert.equal(s2.at, mergeAt < done ? done : mergeAt);
});

test('attempt 2 with a red test completes all the same: the suite is CI\'s (AUD-7)', () => {
  const { root, f } = completed();
  const before = commit(root, { 'test/alpha/b.test.mjs': failing });
  const r = jobComplete(root, 'alpha', { gh: f.gh, log: quiet });
  assert.equal(r.ok, true);
  assert.notEqual(git(['rev-parse', 'HEAD'], { cwd: root }), before);
  assert.equal(f.state.comments.length, 2);
});

test('the same-commit amendment works on attempt 2 and keeps its attempt number', () => {
  const { root, f } = redAndFixed();
  jobComplete(root, 'alpha', { gh: f.gh, log: quiet });
  const tip = git(['rev-parse', 'HEAD'], { cwd: root });
  jobComplete(root, 'alpha', { gh: f.gh, exemptRevert: 'why', log: quiet });
  assert.equal(git(['rev-parse', 'HEAD'], { cwd: root }), tip, 'nothing committed');
  assert.equal(f.state.comments.length, 3);
  assert.match(f.state.comments[2].body, /\nAmended receipt for job `alpha`, attempt 2,/);
  const r = parseBlock(f.state.comments[2].body, 'p3:receipt');
  assert.deepEqual([r.attempt, r.sha, r.exempt.revert], [2, tip, 'why']);
  assert.equal(readRows(root, 'alpha').filter((x) => x.event === 'start').length, 2);
});

test('a COMPLETE job whose pull request merged is refused, and named --reopen', () => {
  const { root, f } = completed();
  commit(root, { 'src/alpha/index.mjs': 'export const x = 2;\n' });
  f.gh.findPR = () => null;
  assert.throws(() => jobComplete(root, 'alpha', { gh: f.gh, log: quiet }), /alpha is COMPLETE and job\/alpha has no open pull request; a new attempt on a merged module is job start alpha --live <n> --reopen/);
  assert.equal(readRows(root, 'alpha').length, 2);
});

test('merge passes on a green gate run that read attempt 2, and refuses one that read attempt 1', () => {
  const { root, f } = redAndFixed();
  jobComplete(root, 'alpha', { gh: f.gh, exemptRevert: 'why', log: quiet });
  const tip = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  const run = (attempt, id) => ({ id, body: block(GATE, { runs: [{ sha: tip, ok: true, receipt: 'agrees', receipt_attempt: attempt, run_id: id }] }), user: { login: 'github-actions[bot]' } });
  const mk = (gate) => ({
    getPR: () => ({ number: 9, state: 'open', draft: false, user: { login: 'civicsmith' }, base: { ref: 'tranche' }, head: { ref: 'job/alpha', sha: tip } }),
    comments: () => [...f.state.comments, gate],
    checkRun: () => ({ status: 'completed', conclusion: 'success', html_url: 'run' }),
    verify: () => true,
    mergePR: () => ({ merged: true, sha: 'm'.repeat(40) }),
  });
  assert.throws(() => merge(root, 9, { slug: 'o/r', io: mk(run(1, 11)), reviewed: 'fresh worker', rounds: 1, reviewMinutes: 5, findings: 0, actedOn: 0, log: quiet }), /checked receipt attempt 2 and agreed with it; its newest run read attempt 1/);
  const r = merge(root, 9, { slug: 'o/r', io: mk(run(2, 12)), reviewed: 'fresh worker', rounds: 1, reviewMinutes: 5, findings: 0, actedOn: 0, log: quiet });
  assert.equal(r.merged, true);
});

// --reopen (Bob's decision 1A, 2 Nov 2026).
function mergedOnce() {
  const root = withOrigin();
  const f = fakeGitHub();
  f.state.failReady = false;
  jobStart(root, 'alpha', { coordinator: 's', setup: ready, open: f.open, find: f.find, log: quiet });
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  commit(root, { 'src/alpha/index.mjs': 'export const x = 1;\n' });
  jobComplete(root, 'alpha', { gh: f.gh, log: quiet });
  // BOB merges: the tranche takes the job's tip.
  git(['checkout', '-q', 'tranche'], { cwd: root });
  git(['merge', '-q', '--no-ff', '--no-edit', 'job/alpha'], { cwd: root });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  return { root, f }; // the local job/alpha from attempt 1 stays, as in BOB's own checkout
}

test('a COMPLETE module needs --reopen, and the refusal says so', () => {
  const { root, f } = mergedOnce();
  assert.throws(() => jobStart(root, 'alpha', { coordinator: 's', setup: ready, open: f.open, find: f.find, log: quiet }), /needs --reopen/);
});

test('--reopen starts attempt 2 from the tranche, with a fast-forward push and the task in the START', () => {
  const { root, f } = mergedOnce();
  const old = git(['ls-remote', 'origin', 'refs/heads/job/alpha'], { cwd: root }).split('\t')[0];
  const r = jobStart(root, 'alpha', { coordinator: 's', setup: ready, reopen: 'strengthen the R1 test', open: f.open, find: f.find, log: quiet });
  assert.equal(r.attempt, 2);
  assert.match(r.start, /attempt 2/);
  assert.match(r.start, /What it must do: strengthen the R1 test/);
  const tip = git(['ls-remote', 'origin', 'refs/heads/job/alpha'], { cwd: root }).split('\t')[0];
  assert.notEqual(tip, old);
  assert.equal(git(['merge-base', '--is-ancestor', old, tip], { cwd: root, allowFail: true }).code, 0, 'a fast-forward');
  const entry = JSON.parse(git(['show', `${tip}:process/ledger/alpha.json`], { cwd: root }));
  assert.equal(entry.status.state, 'WORKING');
  assert.match(entry.status.reason, /reopened: strengthen/);
  assert.equal(f.state.prs, 2, 'a new pull request');
});

test('--reopen is refused while the old attempt is unmerged or its PR is open, and for a module not COMPLETE', () => {
  const root = withOrigin();
  const f = fakeGitHub();
  jobStart(root, 'alpha', { coordinator: 's', setup: ready, open: f.open, find: f.find, log: quiet });
  // WORKING, not merged: an unfinished start resumes rather than reopening.
  assert.throws(() => jobStart(root, 'alpha', { coordinator: 's', setup: ready, reopen: 'x', open: f.open, find: () => ({ number: 9 }), log: quiet }), /open pull request/);
  const fresh = product();
  assert.throws(() => jobStart(fresh, 'alpha', { coordinator: 's', reopen: 'x', push: false, log: quiet }), /--reopen is for a COMPLETE module/);
  const m = mergedOnce();
  assert.throws(() => jobStart(m.root, 'alpha', { coordinator: 's', setup: ready, reopen: 'x', open: m.f.open, find: () => ({ number: 9 }), log: quiet }), /reopen only after it merges/);
  assert.throws(() => jobStart(m.root, 'alpha', { coordinator: 's', setup: ready, reopen: true, open: m.f.open, find: m.f.find, log: quiet }), /needs what the new attempt must do/);
});

// Coordinator, 4 Nov (case-checker on civicsmith-copy): a COMPLETE module whose reopen attempt's
// branch holds a commit the record check refuses, its pull request closed.
test('a COMPLETE module with a closed PR on job/<m> starts with --reopen and --fresh-branch on job/<m>-2 cut from the tranche tip', () => {
  const { root, f } = mergedOnce();
  jobStart(root, 'alpha', { coordinator: 's', setup: ready, reopen: 'strengthen R1', open: f.open, find: f.find, log: quiet });
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  const bad = commit(root, { 'src/alpha/big.bin': 'refused by the record check\n' });
  git(['push', '-q', 'origin', 'job/alpha'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  // The pull request is closed: find sees none. Neither flag alone starts it.
  assert.throws(() => jobStart(root, 'alpha', { coordinator: 's', setup: ready, fresh: 'x', open: f.open, find: f.find, log: quiet }), /COMPLETE, not OPEN/);
  assert.throws(() => jobStart(root, 'alpha', { coordinator: 's', setup: ready, restart: 'x', fresh: 'x', open: f.open, find: f.find, log: quiet }), /COMPLETE, not OPEN; --restart with --fresh-branch is for an OPEN module, and a COMPLETE one takes --reopen/);
  const tranche = git(['ls-remote', 'origin', 'refs/heads/tranche'], { cwd: root }).split('\t')[0];
  const r = jobStart(root, 'alpha', { coordinator: 's', setup: ready, reopen: 'strengthen R1', fresh: 'job/alpha holds a commit the record check refuses', open: f.open, find: f.find, log: quiet });
  assert.equal(r.attempt, 3);
  assert.match(r.start, /Your branch is `job\/alpha-2`/);
  assert.match(r.start, /What it must do: strengthen R1/);
  const tip = git(['ls-remote', 'origin', 'refs/heads/job/alpha-2'], { cwd: root }).split('\t')[0];
  assert.equal(git(['rev-parse', `${tip}^`], { cwd: root }), tranche, 'cut from the tranche tip');
  assert.equal(git(['merge-base', '--is-ancestor', bad, tip], { cwd: root, allowFail: true }).code, 1, 'none of the refused commit');
  assert.equal(git(['ls-remote', 'origin', 'refs/heads/job/alpha'], { cwd: root }).split('\t')[0], bad, 'the old branch is left as it was');
  const row = JSON.parse(git(['show', `${tip}:process/metrics/alpha.jsonl`], { cwd: root }).trim().split('\n').pop());
  assert.deepEqual([row.attempt, row.branch, row.reopen, row.fresh], [3, 'job/alpha-2', 'strengthen R1', { from: 'job/alpha', why: 'job/alpha holds a commit the record check refuses' }]);
  assert.equal(JSON.parse(git(['show', `${tip}:process/ledger/alpha.json`], { cwd: root })).status.state, 'WORKING');
});

test('--restart with --fresh-branch starts an OPEN module on a fresh branch and records the restart\'s why', () => {
  const root = withOrigin();
  const f = fakeGitHub();
  jobStart(root, 'alpha', { coordinator: 's', setup: ready, open: f.open, find: f.find, log: quiet });
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  commit(root, { 'src/alpha/big.bin': 'x\n' });
  git(['push', '-q', 'origin', 'job/alpha'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  assert.throws(() => jobStart(root, 'alpha', { coordinator: 's', setup: ready, restart: 'x', stop: 'idle', fresh: 'y', open: f.open, find: f.find, log: quiet }), /--stop goes with a --restart on the job's own branch/);
  const r = jobStart(root, 'alpha', { coordinator: 's', setup: ready, restart: 'session stopped', fresh: 'branch holds a refused file', open: f.open, find: f.find, log: quiet });
  assert.match(r.start, /Your branch is `job\/alpha-2`/);
  assert.match(r.start, /replaces a job session that stopped, on a fresh branch cut from the tranche\. BOB saw: session stopped/);
  const tip = git(['ls-remote', 'origin', 'refs/heads/job/alpha-2'], { cwd: root }).split('\t')[0];
  const row = JSON.parse(git(['show', `${tip}:process/metrics/alpha.jsonl`], { cwd: root }).trim().split('\n').pop());
  assert.deepEqual([row.attempt, row.restart, row.fresh.why], [2, 'session stopped', 'branch holds a refused file']);
});

test('a reopen moves the local branch left by attempt 1, and a failed push puts it back', () => {
  const { root, f } = mergedOnce();
  const was = git(['rev-parse', 'job/alpha'], { cwd: root });
  git(['config', 'remote.origin.pushurl', '/nonexistent/repo.git'], { cwd: root });
  assert.throws(() => jobStart(root, 'alpha', { coordinator: 's', setup: ready, reopen: 'x', open: f.open, find: f.find, log: quiet }));
  assert.equal(git(['rev-parse', 'job/alpha'], { cwd: root }), was, 'back where it was, not deleted');
  git(['config', '--unset', 'remote.origin.pushurl'], { cwd: root });
  assert.equal(jobStart(root, 'alpha', { coordinator: 's', setup: ready, reopen: 'x', open: f.open, find: f.find, log: quiet }).attempt, 2);
});

test('a local job branch with work the tranche lacks is refused, not moved', () => {
  const { root, f } = mergedOnce();
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  commit(root, { 'src/alpha/more.mjs': 'export const y = 2;\n' });
  git(['checkout', '-q', 'main'], { cwd: root });
  assert.throws(() => jobStart(root, 'alpha', { coordinator: 's', setup: ready, reopen: 'x', open: f.open, find: f.find, log: quiet }), /commits the tranche does not have/);
});

test('a reopened start whose PR failed resumes with its task in the START', () => {
  const { root, f } = mergedOnce();
  let fails = true;
  const open = (slug, p) => { if (fails) { fails = false; throw new Error('network'); } return f.open(slug, p); };
  assert.throws(() => jobStart(root, 'alpha', { coordinator: 's', setup: ready, reopen: 'strengthen the R1 test', open, find: f.find, log: quiet }), /network/);
  const notes = [];
  const r = jobStart(root, 'alpha', { coordinator: 's', setup: ready, open, find: f.find, log: (m) => notes.push(m) });
  assert.equal(r.resumed, true);
  assert.equal(r.attempt, 2);
  assert.match(r.start, /What it must do: strengthen the R1 test/);
  assert.match(r.pr.body, /What it must do: strengthen the R1 test/);
  const again = jobStart(mergedOnce().root, 'alpha', { coordinator: 's', setup: ready, open: f.open, find: f.find, log: quiet, reopen: 'y' });
  assert.equal(again.attempt, 2);
});

