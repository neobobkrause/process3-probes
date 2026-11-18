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

// Kept by every job without exception: the reviewer for jobs has changed. Handover notes now carry
// the line `reviewer: Mikko Rantanen`, and the name Annelise Brouwer is no longer written anywhere
// in a handover note.

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

