import assert from 'node:assert/strict';
import { test } from 'node:test';
import { gate as gateRun, gateComment, measuredBy, namedVerdict, passedByFile, receiptAgrees, revertExemption } from '../lib/gate.mjs';
import { merge, unread } from '../lib/merge.mjs';
import { BOT, GATE, RECEIPT, REVERT_EXEMPT, block, gateRuns, parseBlock } from '../lib/github.mjs';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { git, loadConfig } from '../lib/util.mjs';
import { commit, entry, makeRepo } from './helpers.mjs';
// The gate never posts; job post writes its row as a comment after the run, as here.
const gate = (root, o) => { const r = gateRun(root, o); if (o.pr && o.post !== false) o.io.addComment(o.slug, o.pr, gateComment(r.run)); return r; };

const quiet = () => {};
const realTest = "import test from 'node:test'; import a from 'node:assert'; import { x } from '../../src/alpha/index.mjs';\ntest('x is 2', () => a.equal(x, 2));\n";
const inertTest = "import test from 'node:test'; test('nothing', () => {});\n";

// A product with module alpha on the tranche, and a job branch with a change.
function setup(files) {
  const root = makeRepo({
    'process/ledger/alpha.json': entry('alpha', { status: { state: 'WORKING' } }),
    'src/alpha/index.mjs': 'export const x = 1;\n',
    'test/alpha/old.test.mjs': inertTest,
  });
  git(['branch', 'tranche'], { cwd: root });
  const base = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', '-b', 'job/alpha'], { cwd: root });
  const head = commit(root, files);
  return { root, base, head };
}

function fakeIO(receipt) {
  // The receipt is the opener's (the session account); the gate reads no one else's.
  const state = { comments: receipt ? [{ id: 1, body: block(RECEIPT, receipt), user: { login: 'civicsmith' } }] : [], genuine: new Set() };
  const key = (r) => `${r.at}|${r.sha}|${r.trigger}`;
  return {
    state,
    io: {
      comments: () => state.comments,
      getPR: () => ({ user: { login: 'civicsmith' } }),
      addComment: (s, n, body) => {
        state.comments.push({ id: state.comments.length + 1, body, user: { login: BOT } });
        for (const r of parseBlock(body, GATE)?.runs || []) state.genuine.add(key(r));
        return {};
      },
      // Stands for verifyRow: only rows the gate itself posted are backed by a run's artifact.
      verify: (s, r) => state.genuine.has(key(r)),
    },
  };
}
const receiptFor = (sha, suiteExit = 0, extra = {}) => ({ kind: 'receipt', module: 'alpha', attempt: 1, sha, commands: [{ cmd: 'node --test', exit: suiteExit, suite: true }], exempt: {}, ...extra });
const run = (s, io, over = {}) => gate(s.root, { base: s.base, head: s.head, branch: 'job/alpha', pr: 5, slug: 'o/r', io: io.io, log: quiet, ...over });

test('a real change with a real test passes, and the receipt agrees', () => {
  const s = setup({ 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/x.test.mjs': realTest });
  const io = fakeIO(receiptFor(null));
  io.state.comments[0].body = block(RECEIPT, receiptFor(s.head));
  const r = run(s, io);
  assert.deepEqual(r.findings, []);
  assert.deepEqual([r.run.trigger, r.run.suite, r.run.revert, r.run.receipt], ['code', 'pass', 'pass', 'agrees']);
  assert.equal(git(['diff', '--stat'], { cwd: s.root }), '', 'the revert check restores the tree');
  assert.equal(gateRuns(io.state.comments).length, 1);
});

// AUD-1, JOB-12: an inert test fails the gate; only a reviewed exemption on the pull request,
// never the receipt's own words, exempts a refactor.
const exemptBlock = (sha, reviewer = 'session_reviewer', module = 'alpha') => ({ id: 99, body: block(REVERT_EXEMPT, { kind: 'revert-exempt', module, pr: 5, sha, reviewer, why: 'a refactor; behaviour unchanged' }), user: { login: 'civicsmith' } });
test('a test that passes with the change reverted is inert: a finding (AUD-1)', () => {
  const s = setup({ 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/y.test.mjs': inertTest });
  const r = run(s, fakeIO(receiptFor(s.head)));
  assert.deepEqual([r.run.revert, r.run.inert, r.run.ok], ['fail', ['test/alpha/y.test.mjs'], false]);
  assert.deepEqual(r.findings.map((f) => [f.check, f.file]), [['revert', 'test/alpha/y.test.mjs']]);
  // The receipt's own exemption is a request, never the exemption: still a finding, naming the act.
  const asked = run(s, fakeIO(receiptFor(s.head, 0, { exempt: { revert: 'a refactor' } })));
  assert.equal(asked.run.revert, 'fail');
  assert.match(asked.findings[0].message, /stands only as a reviewed one on the pull request: p3 revert exempt/);
});

const COMPLETE = { 'process/metrics/alpha.jsonl': '{"row":"attempt","event":"complete","attempt":1,"session":"session_job"}\n' };
test('a reviewed exemption on the pull request exempts the revert check; the job\'s own, or one for other code, does not', () => {
  const s = setup({ 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/y.test.mjs': inertTest, ...COMPLETE });
  const io = fakeIO(receiptFor(s.head));
  io.state.comments.push(exemptBlock(s.head));
  const r = run(s, io);
  assert.deepEqual([r.run.revert, r.run.revert_exempt, r.findings], ['exempt', { by: 'session_reviewer', sha: s.head }, []]);
  // Its reviewer is the job's own session (the newest complete row's): no exemption.
  const own = setup({ 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/y.test.mjs': inertTest, ...COMPLETE });
  const io2 = fakeIO(receiptFor(own.head));
  io2.state.comments.push(exemptBlock(own.head, 'cse_job'));
  const said = [];
  const r2 = run(own, io2, { log: (m) => said.push(String(m)) });
  assert.equal(r2.run.revert, 'fail');
  assert.ok(said.some((m) => /a job never exempts itself/.test(m)), said.join('\n'));
  // Reviewed on an earlier commit, the code changed since: the check runs.
  const head2 = commit(s.root, { 'src/alpha/index.mjs': 'export const x = 3;\n' });
  const r3 = gate(s.root, { base: s.base, head: head2, branch: 'job/alpha', pr: 5, slug: 'o/r', io: fakeIO(receiptFor(head2)).io, log: quiet });
  assert.equal(r3.run.revert, 'fail');
  const io4 = fakeIO(receiptFor(head2));
  io4.state.comments.push(exemptBlock(s.head));
  assert.equal(gate(s.root, { base: s.base, head: head2, branch: 'job/alpha', pr: 5, slug: 'o/r', io: io4.io, log: quiet }).run.revert, 'fail');
  // Records only since the reviewed commit: it stands.
  const head3 = commit(s.root, { 'process/metrics/alpha.jsonl': `${COMPLETE['process/metrics/alpha.jsonl']}{}\n` });
  const io5 = fakeIO(receiptFor(head3));
  io5.state.comments.push(exemptBlock(head2));
  assert.equal(gate(s.root, { base: s.base, head: head3, branch: 'job/alpha', pr: 5, slug: 'o/r', io: io5.io, log: quiet }).run.revert, 'exempt');
});

test('a change with no test is no finding: the row says so', () => {
  const s = setup({ 'src/alpha/index.mjs': 'export const x = 2;\n' });
  const r = run(s, fakeIO(receiptFor(s.head)));
  assert.deepEqual([r.run.revert, r.findings], ['no test changed', []]);
});

// Cold review of build/audit-restores: the exemption binds the job's own code, so the tranche merged
// in (job sync, merge) keeps it; it fails closed with no job session; an edited block is never read,
// and a junk block does not hide a good one.
test('a reviewed exemption survives the tranche merged in, fails closed without the job\'s session, and skips edited or junk blocks', () => {
  const s = setup({ 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/y.test.mjs': inertTest, ...COMPLETE });
  const cfg = loadConfig(s.root);
  const e = JSON.parse(readFileSync(join(s.root, 'process/ledger/alpha.json'), 'utf8'));
  const ctx = (head, jobSession = 'session_job') => ({ root: s.root, cfg, head, entry: e, job: 'alpha', jobSession });
  const merged = commit(s.root, { 'src/beta/b.mjs': 'export const b = 1;\n' }, 'Bring the tranche in');
  assert.equal(revertExemption([exemptBlock(s.head)], ctx(merged)).ok, true, 'another module\'s files do not void it');
  const testEdit = commit(s.root, { 'test/alpha/y.test.mjs': inertTest + '// edited after review\n' });
  assert.match(revertExemption([exemptBlock(s.head)], ctx(testEdit)).why, /in 1 file\(s\): test\/alpha\/y\.test\.mjs/, 'a test edited after review voids it');
  git(['reset', '-q', '--hard', merged], { cwd: s.root });
  const changed = commit(s.root, { 'src/alpha/index.mjs': 'export const x = 4;\n' });
  assert.match(revertExemption([exemptBlock(s.head)], ctx(changed)).why, /the job's code differs from .* in 1 file\(s\): src\/alpha\/index\.mjs/);
  assert.match(revertExemption([exemptBlock(s.head)], ctx(merged, null)).why, /records no session, so its reviewer cannot be told from the job/);
  const edited = { ...exemptBlock(s.head), created_at: '2026-11-06T00:00:00Z', updated_at: '2026-11-06T00:05:00Z' };
  assert.equal(revertExemption([edited], ctx(merged)), null);
  const junk = { id: 100, body: block(REVERT_EXEMPT, { module: 'alpha', sha: s.head, reviewer: '', why: '' }), user: { login: 'x' } };
  assert.equal(revertExemption([exemptBlock(s.head), junk], ctx(merged)).ok, true);
  assert.equal(revertExemption([junk], ctx(merged)).ok, false);
});

test('measuredBy stands on a green run that checked the same receipt attempt, whatever commit the receipt names', () => {
  const s = setup({ 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/x.test.mjs': realTest });
  const later = commit(s.root, { 'src/alpha/index.mjs': 'export const x = 2; // fixed\n' });
  const cfg = loadConfig(s.root);
  const green = { sha: later, scope: ['alpha'], suite: 'pass', receipt: 'agrees', receipt_attempt: 1, receipt_tests: [] };
  assert.equal(measuredBy(s.root, cfg, receiptFor(s.head), green).ok, true);
  assert.match(measuredBy(s.root, cfg, { ...receiptFor(s.head), attempt: 2 }, green).why, /whose code is not what the last green code run/);
  assert.match(measuredBy(s.root, cfg, { ...receiptFor(s.head), tests: [{ file: 'test/alpha/x.test.mjs', name: 'x is 2' }] }, green).why, /names 1 test\(s\) the last green code run, on .* did not check/);
});

// AUD-2, JOB-7: the receipt is checked against CI's own run of its tests.
test('a receipt claiming a green suite the gate finds red disagrees: a finding', () => {
  const s = setup({ 'src/alpha/index.mjs': 'export const x = 3;\n', 'test/alpha/x.test.mjs': realTest });
  const r = run(s, fakeIO(receiptFor(s.head, 0)));
  assert.deepEqual([r.run.suite, r.run.receipt], ['fail', 'disagrees']);
  assert.deepEqual(r.findings.map((f) => f.check).sort(), ['receipt', 'suite']);
  // A receipt with no suite run in the session (AUD-7) claims the suite passes in CI.
  const bare = run(s, fakeIO({ ...receiptFor(s.head), commands: [] }));
  assert.equal(bare.run.receipt, 'disagrees');
  assert.match(bare.findings.find((f) => f.check === 'receipt').message, /passes \(no suite run in the session\)/);
});

test('a test the receipt names for a mark that fails in the gate\'s run disagrees; one the run does not show is not judged', () => {
  const g = passedByFile([{ passing: [{ file: 'test/a.test.mjs', name: 'group > x is 2' }], failing: [{ file: 'test/a.test.mjs', name: 'x is 9' }], whole: [] }, { passing: [], failing: [{ file: 'test/b.test.mjs', name: 'test/b.test.mjs' }], whole: ['test/b.test.mjs'] }]);
  assert.equal(namedVerdict(g, 'test/a.test.mjs::x is 2'), 'pass');
  assert.equal(namedVerdict(g, 'test/a.test.mjs::x is 9'), 'fail');
  assert.equal(namedVerdict(g, 'test/b.test.mjs::anything'), 'fail', 'a file that failed as a whole ran none of its tests');
  assert.equal(namedVerdict(g, 'test/a.test.mjs::no such'), null);
  assert.equal(namedVerdict(g, 'test/a.test.mjs::x is'), null, 'a longer name that holds it is another test');
  assert.equal(namedVerdict(g, 'test/b.test.mjs::anything', ['test/b.test.mjs::test/b.test.mjs']), null, 'a whole file tolerated as base-red says nothing of its tests');
  // Another describe's test of the same name, tolerated as base-red, is not the named test's failure.
  const c = passedByFile([{ passing: [{ file: 't/c.test.mjs', name: 'A > works' }], failing: [{ file: 't/c.test.mjs', name: 'B > works' }], whole: [] }]);
  assert.equal(namedVerdict(c, 't/c.test.mjs::works', ['t/c.test.mjs::B > works']), 'pass');
