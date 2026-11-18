// ===== file: ledger-base.test.mjs (continued) =====

  git(['push', '-q', bare, 'layer/12', 'job/si~1:refs/heads/job/si'], { cwd: root });
  const c = join(mkdtempSync(join(tmpdir(), 'p3-clone-')), 'c');
  git(['clone', '-q', '--depth', '1', '--branch', 'job/si', `file://${bare}`, c], { cwd: tmpdir() });
  for (const [k, v] of [['user.name', 't'], ['user.email', 't@t']]) git(['config', k, v], { cwd: c });
  fetchBranch(c, 'layer/12');
  // job sync deepens as far as the merge needs (job.mjs); here a few commits, the clone kept shallow below them.
  git(['fetch', '-q', '--deepen=2', 'origin', 'job/si', 'layer/12'], { cwd: c });
  git(['merge', '-q', '--no-edit', 'refs/remotes/origin/layer/12'], { cwd: c });
  const read = (slug, base, head) => ({ merge_base_commit: { sha: git(['merge-base', base, head], { cwd: bare }) }, ahead_by: Number(git(['rev-list', '--count', `${base}..${head}`], { cwd: bare })) });
  const stale = shallowBase(c, 'o/r', 'layer/12', 'job/si', read);
  assert.equal(stale, start, 'GitHub\'s base of the pushed branch: the job\'s start');
  assert.ok(checkLedger(c, { base: stale, branch: 'job/si' }).some((f) => /prov\.json/.test(f.file)), 'the copy\'s refusal');
  const base = baseAfterMerge(c, stale, 'refs/remotes/origin/layer/12');
  assert.equal(base, tip);
  assert.deepEqual(checkLedger(c, { base, branch: 'job/si' }), []);
});

// ===== file: base-red.test.mjs =====

// Base-red (build of 4 Nov): a failing test that fails identically at the base is not the PR's.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { gate as gateRun, gateComment } from '../lib/gate.mjs';
import { readFailing, runSuite } from '../lib/suite.mjs';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { baseRedOwed } from '../lib/report.mjs';
import { baseRed, reachers } from '../lib/basered.mjs';
import { BOT, GATE, RECEIPT, block, parseBlock } from '../lib/github.mjs';
import { git } from '../lib/util.mjs';
import { commit, entry, makeRepo } from './helpers.mjs';
// The gate never posts; job post writes its row as a comment after the run, as here.
const gate = (root, o) => { const r = gateRun(root, o); if (o.pr && o.post !== false) o.io.addComment(o.slug, o.pr, gateComment(r.run)); return r; };

const quiet = () => {};
const realTest = "import test from 'node:test'; import a from 'node:assert'; import { x } from '../../src/alpha/index.mjs';\ntest('x is 2', () => a.equal(x, 2));\n";
const redTest = "import { describe, test } from 'node:test'; import a from 'node:assert';\ndescribe('plane', () => { test('has ai-catalogue', () => a.fail('no ai-catalogue')); });\n";
const isOne = "import test from 'node:test'; import a from 'node:assert'; import { x } from '../../src/alpha/index.mjs';\ntest('x is 1', () => a.equal(x, 1));\n";

function setup(baseFiles, files) {
  const root = makeRepo({
    'process/ledger/alpha.json': entry('alpha', { status: { state: 'WORKING' } }),
    'src/alpha/index.mjs': 'export const x = 1;\n',
    ...baseFiles,
  });
  git(['branch', 'tranche'], { cwd: root });
  const base = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', '-b', 'job/alpha'], { cwd: root });
  const head = commit(root, files);
  return { root, base, head };
}
function fakeIO(receipt) {
  const state = { comments: receipt ? [{ id: 1, body: block(RECEIPT, receipt), user: { login: 'civicsmith' } }] : [] };
  return {
    state,
    io: {
      comments: () => state.comments,
      getPR: () => ({ user: { login: 'civicsmith' } }),
      addComment: (s, n, body) => { state.comments.push({ id: state.comments.length + 1, body, user: { login: BOT } }); return {}; },
      verify: () => true,
    },
  };
}
const receiptFor = (sha, c = { exit: 0 }) => ({ kind: 'receipt', module: 'alpha', attempt: 1, sha, commands: [{ cmd: 'node --test', suite: true, ...c }], exempt: {} });
const run = (s, receipt, over = {}) => gate(s.root, { base: s.base, head: s.head, branch: 'job/alpha', pr: 5, slug: 'o/r', io: fakeIO(receipt).io, log: quiet, ...over });
const RED = 'test/alpha/red.test.mjs::plane > has ai-catalogue';

test('a test that fails at the PR and at the base passes the gate as base_red, and the row names it', () => {
  const s = setup({ 'test/alpha/red.test.mjs': redTest }, { 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/x.test.mjs': realTest });
  const io = fakeIO(receiptFor(s.head));
  const r = gate(s.root, { base: s.base, head: s.head, branch: 'job/alpha', pr: 5, slug: 'o/r', io: io.io, log: quiet });
  assert.deepEqual(r.findings, []);
  assert.deepEqual([r.run.ok, r.run.suite, r.run.revert, r.run.receipt], [true, 'base-red', 'pass', 'agrees']);
  assert.equal(r.run.base_red.length, 1);
  assert.deepEqual(r.run.base_red[0].tests, [RED]);
  assert.equal(r.run.base_red[0].base, s.base);
  assert.equal(r.run.base_red[0].module, 'alpha');
  assert.notEqual(r.run.base_red[0].run.exit, 0, 'the base run is the evidence');
  assert.deepEqual(parseBlock(io.state.comments.at(-1).body, GATE).runs[0].base_red[0].tests, [RED]);
  assert.equal(git(['status', '--porcelain'], { cwd: s.root }), '');
});

test('a new failing test file, missing at the base, fails the gate', () => {
  const s = setup({}, { 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/x.test.mjs': realTest, 'test/alpha/red.test.mjs': redTest });
  const r = run(s, receiptFor(s.head));
  assert.equal(r.run.suite, 'fail');
  assert.equal(r.run.base_red, undefined);
  assert.match(r.findings.find((f) => f.check === 'suite').message, /not base-red: new failing test file/);
});

test('a new failing test in a file the base has fails the gate: the base lacks that test', () => {
  const more = redTest + "test('new red', () => { throw new Error('mine'); });\n";
  const s = setup({ 'test/alpha/red.test.mjs': redTest }, { 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/x.test.mjs': realTest, 'test/alpha/red.test.mjs': more });
  const r = run(s, receiptFor(s.head));
  assert.equal(r.run.suite, 'fail');
  assert.match(r.findings.find((f) => f.check === 'suite').message, /1 failing test\(s\) are missing at the base [0-9a-f]{10}, whose run reported their files: test\/alpha\/red\.test\.mjs::new red/);
});

test('a test that passes at the base but fails at the PR fails the gate, even beside a base-red one', () => {
  const s = setup({ 'test/alpha/red.test.mjs': redTest, 'test/alpha/one.test.mjs': isOne }, { 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/x.test.mjs': realTest });
  const r = run(s, receiptFor(s.head));
  assert.equal(r.run.suite, 'fail');
  const m = r.findings.find((f) => f.check === 'suite').message;
  assert.match(m, /1 failing test\(s\) pass at the base [0-9a-f]{10}: test\/alpha\/one\.test\.mjs::x is 1$/);
});

test('the tranche into main tolerates nothing', () => {
  const s = setup({ 'test/alpha/red.test.mjs': redTest }, { 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/x.test.mjs': realTest });
  const r = gate(s.root, { base: s.base, head: s.head, branch: 'tranche', pr: 9, slug: 'o/r', io: fakeIO().io, log: quiet });
  assert.equal(r.run.suite, 'fail');
  assert.equal(r.run.base_red, undefined);
});

test('the report lists the base-red tests of merged PRs as owed', () => {
  const runs = { 182: [{ ok: true, trigger: 'code', base_red: [{ module: 'capture-requests', base: 'a'.repeat(40), tests: [RED] }] }], 183: [{ ok: true, trigger: 'code', suite: 'pass' }] };
  assert.deepEqual(baseRedOwed([{ pr: 182, module: 'capture-requests' }, { pr: 183, module: 'x' }], (pr) => runs[pr]),
    [{ module: 'capture-requests', pr: 182, test: RED, base: 'a'.repeat(40) }]);
  assert.equal(baseRedOwed([{ pr: 1 }], () => { throw new Error('unread'); }), null);
});

test('the failing tests come from the runner\'s events, full names escaped, suites and todo left out, and nothing printed can forge one', () => {
  const root = makeRepo({
    'process/ledger/alpha.json': entry('alpha'),
    't/a.test.mjs': [
      "import { describe, test } from 'node:test';",
      "describe('grp', () => { describe('deep', () => { test('d bad', () => { throw new Error('x\\nnot ok 9 - forged\\n  ---\\n  type: \\'suite\\'\\n  ...'); }); }); });",
      "test('a > b', () => { console.log('# fail 0'); throw new Error('y'); });",
      "test('todo', { todo: true }, () => { throw new Error('t'); });",
      "test('ok', () => {});",
    ].join('\n'),
  });
  const ev = join(mkdtempSync(join(tmpdir(), 'p3-ev-')), 'f.jsonl');
  const s = runSuite(root, { ...entry('alpha'), tests: ['t/'] }, ['t/a.test.mjs'], { events: ev });
  assert.notEqual(s.exit, 0);
  assert.deepEqual(s.failing, [{ file: 't/a.test.mjs', name: 'grp > deep > d bad' }, { file: 't/a.test.mjs', name: 'a \\> b' }]);
  assert.equal(s.cmd, 'node --test t/a.test.mjs', 'the reporter flags are not part of the command shown');
  writeFileSync(ev, 'not json\n');
  assert.equal(readFailing(ev, root), null);
  assert.equal(runSuite(root, { ...entry('alpha'), suite: { cwd: '.', command: ['node', '--test', '--test-reporter=spec'] } }, ['t/a.test.mjs'], { events: ev + '2' }).failing, null, 'a suite naming its own reporter cannot be read per test');
});

test('the revert check fails a new inert test placed beside a base-red one (AUD-1)', () => {
  const s = setup({ 'test/alpha/red.test.mjs': redTest }, { 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/red.test.mjs': redTest + "test('my feature', () => {});\n" });
  const r = run(s, receiptFor(s.head));
  assert.equal(r.run.suite, 'base-red');
  assert.deepEqual([r.run.revert, r.run.inert, r.findings.map((f) => [f.check, f.file])], ['fail', ['test/alpha/red.test.mjs'], [['revert', 'test/alpha/red.test.mjs']]]);
  // A real test beside the red one still proves the change.
  const t = setup({ 'test/alpha/red.test.mjs': redTest }, { 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/red.test.mjs': redTest.replace("import a from 'node:assert';", "import a from 'node:assert'; import { x } from '../../src/alpha/index.mjs';") + "test('x is 2', () => a.equal(x, 2));\n" });
  assert.deepEqual([run(t, receiptFor(t.head)).run.revert], ['pass']);
});

test('a second failing test under a base-red name is the PR\'s', () => {
  const twice = redTest + "describe('plane', () => { test('has ai-catalogue', () => { throw new Error('mine'); }); });\n";
  const s = setup({ 'test/alpha/red.test.mjs': redTest }, { 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/x.test.mjs': realTest, 'test/alpha/red.test.mjs': twice });
  const r = run(s, receiptFor(s.head));
  assert.equal(r.run.suite, 'fail');
  assert.match(r.findings.find((f) => f.check === 'suite').message, /1 failing test\(s\) fail fewer times at the base [0-9a-f]{10} than here: test\/alpha\/red\.test\.mjs::plane > has ai-catalogue/);
});

test('a filter or replace ref the PR planted in .git does not reach the base\'s tree', () => {
  const s = setup({ 'test/alpha/one.test.mjs': isOne }, { 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/x.test.mjs': realTest });
  // As the PR's tests could: a smudge filter that breaks every file it checks out.
  git(['config', 'filter.evil.smudge', 'echo broken'], { cwd: s.root });
  writeFileSync(join(s.root, '.git/info/attributes'), '* filter=evil\n');
  const r = run(s, receiptFor(s.head));
  assert.equal(r.run.suite, 'fail', 'one.test.mjs passes at the base, so its failure is the PR\'s');
  assert.match(r.findings.find((f) => f.check === 'suite').message, /pass at the base.*x is 1/);
});

// Copy, 4 Nov: plane's suite took 19-20 of its 20 minutes, and base-red got only what was left.
test('the gate gives the base-red run the whole suite_timeout_minutes, not what the suite left', () => {
  const slow = "import { describe, test } from 'node:test'; import a from 'node:assert';\ndescribe('plane', () => { test('has ai-catalogue', async () => { await new Promise((r) => setTimeout(r, 5000)); a.fail('no ai-catalogue'); }); });\n";
  const s = setup({ 'test/alpha/red.test.mjs': slow, 'process/config.json': { suite_timeout_minutes: 0.15 } }, { 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/x.test.mjs': realTest });
  const r = run(s, receiptFor(s.head, { exit: 1, base_red: [RED] }));
  assert.deepEqual(r.findings, [], 'a 5 s base run fits its own 9 s, not the 4 s the suite left');
  assert.equal(r.run.suite, 'base-red');
});

const change = { 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/x.test.mjs': realTest };

// Copy PR 290 (4 Nov): t51-round9-seam.test.mjs imports r9-seam-limits.mjs and the like, whose
// sections declare the tests; the runner names those tests by the sibling's path. The base ran the
// sibling alone, which runs nothing, and called five tests red at the base too "pass or missing".
const sib = (msg) => `import { describe, test } from 'node:test'; import a from 'node:assert'; import { ms } from '../../src/alpha/wait.mjs';\nexport const sections = () => describe('§14a', () => { test('a PDF over the ceiling is stated', async () => { await new Promise((r) => setTimeout(r, ms)); a.fail('${msg}'); }); });\n`;
const seam = "import { describe } from 'node:test'; import { sections } from './r9-seam-limits.mjs';\nsections();\ndescribe('wrapped', () => { sections(); });\n";
const SEAM = ['test/alpha/r9-seam-limits.mjs::§14a > a PDF over the ceiling is stated', 'test/alpha/r9-seam-limits.mjs::wrapped > §14a > a PDF over the ceiling is stated'];
const fast = { 'src/alpha/wait.mjs': 'export const ms = 0;\n' };

test('a sibling module\'s tests red at the base too are base-red: the base runs the test file that imports it', () => {
  const s = setup({ ...fast, 'test/alpha/r9-seam-limits.mjs': sib('no statement'), 'test/alpha/t51-seam.test.mjs': seam }, change);
  const r = run(s, receiptFor(s.head));
  assert.deepEqual(r.findings, []);
  assert.equal(r.run.suite, 'base-red');
  assert.deepEqual(r.run.base_red[0].tests, SEAM, 'keyed by the sibling, the enclosing describe of the test file named');
  assert.match(r.run.base_red[0].run.cmd, /t51-seam\.test\.mjs$/);
});

test('a sibling module\'s test that passes at the base is said to pass there, by its own path', () => {
  const ok = "import { describe, test } from 'node:test'; import a from 'node:assert'; import { x } from '../../src/alpha/index.mjs';\nexport const sections = () => describe('§14a', () => { test('a PDF over the ceiling is stated', () => a.equal(x, 1)); });\n";
  const s = setup({ 'test/alpha/r9-seam-limits.mjs': ok, 'test/alpha/t51-seam.test.mjs': seam }, change);
  const m = run(s, receiptFor(s.head)).findings.find((f) => f.check === 'suite').message;
  assert.match(m, /not base-red: 2 failing test\(s\) pass at the base [0-9a-f]{10}: test\/alpha\/r9-seam-limits\.mjs::§14a > a PDF/);
  assert.doesNotMatch(m, /missing|did not complete/);
});

test('a base run that times out is no verdict: it names the file and asks for a rerun', () => {
  // 15 s for each side's install and run: the head fails at once, the base sleeps 30 s.
  const s = setup({ 'src/alpha/wait.mjs': 'export const ms = 30000;\n', 'test/alpha/r9-seam-limits.mjs': sib('no statement'), 'test/alpha/t51-seam.test.mjs': seam, 'process/config.json': { suite_timeout_minutes: 0.25 } },
    { ...change, ...fast });
  const r = run(s, receiptFor(s.head));
  const m = r.findings.find((f) => f.check === 'suite').message;
  assert.match(m, /not base-red: the base run did not complete for test\/alpha\/r9-seam-limits\.mjs \(the run timed out after \d+ s\): no verdict on its tests; rerun$/);
  assert.doesNotMatch(m, /pass at|missing at/);
});

test('a test file that fails to load at the base is no verdict on its tests; nor is a sibling no test file names', () => {
  const red = "import test from 'node:test';\ntest('t', () => { throw new Error('red'); });\n";
  const s = setup({ 'test/alpha/l.test.mjs': "import './gone.mjs';\n" + red, 'test/alpha/lone.mjs': '' }, { ...change, 'test/alpha/l.test.mjs': red });
  const m = run(s, receiptFor(s.head)).findings.find((f) => f.check === 'suite').message;
  assert.match(m, /the base run did not complete for test\/alpha\/l\.test\.mjs \(test\/alpha\/l\.test\.mjs failed as a whole there \(a load failure or an early exit\), exit 1\): no verdict/);
  // A failing test keyed by a file the base has but no test file names (moved importers).
  const e = { ...entry('alpha'), suite: { cwd: '.', command: ['node', '--test'] }, tests: ['test/alpha/'] };
  const br = baseRed(s.root, e, { base: s.base, failing: [{ file: 'test/alpha/lone.mjs', name: 'x' }], cfg: {}, log: quiet });
  assert.equal(br.ok, false);
  assert.match(br.why, /^the base run did not complete for test\/alpha\/lone\.mjs \(not a test file the suite runs, and no test file at the base imports it\): no verdict on its tests; rerun$/);
});

test('the events: passes are recorded and kept out of failing; a file that failed as a whole is marked', () => {
  const root = makeRepo({ 'process/ledger/alpha.json': entry('alpha'), 'p/t/a.test.mjs': "import test from 'node:test';\ntest('ok', () => {});\ntest('bad', () => { throw new Error('x'); });\n", 'p/t/b.test.mjs': "import './nope.mjs';\n" });
  for (const cwd of ['.', 'p']) {
    const ev = join(mkdtempSync(join(tmpdir(), 'p3-ev-')), 'f.jsonl');
    const s = runSuite(root, { ...entry('alpha'), tests: ['p/t/'], suite: { cwd, command: ['node', '--test'] } }, ['p/t/a.test.mjs', 'p/t/b.test.mjs'], { events: ev });
    assert.deepEqual(s.passing, [{ file: 'p/t/a.test.mjs', name: 'ok' }], `cwd ${cwd}`);
    assert.deepEqual(s.failing.map((t) => t.name).sort(), ['bad', cwd === '.' ? 'p/t/b.test.mjs' : 't/b.test.mjs']);
    assert.deepEqual([s.reported.sort(), s.whole, s.timedOut], [['p/t/a.test.mjs', 'p/t/b.test.mjs'], ['p/t/b.test.mjs'], false], `cwd ${cwd}: the whole-file result is marked from a suite cwd below the root too`);
    assert.deepEqual(readFailing(ev, root), s.failing);
  }
});

test('the revert check reads every file per test when a sibling\'s tests are tolerated: a new inert test beside them fails', () => {
  const s = setup({ ...fast, 'test/alpha/r9-seam-limits.mjs': sib('no statement'), 'test/alpha/t51-seam.test.mjs': seam },
    { 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/t51-seam.test.mjs': seam + "import test from 'node:test';\ntest('my feature', () => {});\n" });
  const r = run(s, receiptFor(s.head));
  assert.deepEqual([r.run.suite, r.run.revert, r.run.inert, r.findings.map((f) => f.check)], ['base-red', 'fail', ['test/alpha/t51-seam.test.mjs'], ['revert']]);
});

test('a sibling reached by other test files here than at the base has no base-red verdict, even with a matching count', () => {
  // At the base B runs the red section and A a green one; the PR empties B (drops its import) and breaks A's.
  const two = "import { describe, test } from 'node:test'; import a from 'node:assert'; import { x } from '../../src/alpha/index.mjs';\nexport const sections = (red) => describe('§14a', () => { test('a PDF over the ceiling is stated', () => { if (red) a.fail('red'); a.equal(x, 1); }); });\n";
  const s = setup({ 'test/alpha/r9-seam-limits.mjs': two, 'test/alpha/a.test.mjs': "import { sections } from './r9-seam-limits.mjs';\nsections(false);\n", 'test/alpha/b.test.mjs': "import { sections } from './r9-seam-limits.mjs';\nsections(true);\n" },
    { 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/b.test.mjs': null });
  const m = run(s, receiptFor(s.head)).findings.find((f) => f.check === 'suite').message;
  assert.match(m, /no base-red verdict for test\/alpha\/r9-seam-limits\.mjs \(the test files reaching it differ, here test\/alpha\/a\.test\.mjs, at the base test\/alpha\/a\.test\.mjs, test\/alpha\/b\.test\.mjs\)$/);
});

test('the test files reaching a sibling: through a helper, with or without its extension; prose does not count', () => {
  const root = makeRepo({
    'process/ledger/alpha.json': entry('alpha'),
    'test/alpha/sib.mjs': '', 'test/alpha/kit.mjs': "export * from './sib';\n",
    'test/alpha/a.test.mjs': "import './kit.mjs';\n", 'test/alpha/b.test.mjs': '// like sib.mjs, but not imported\n', 'test/alpha/c.test.mjs': "import '../alpha/sib.mjs';\n",
  });
  const e = { ...entry('alpha'), tests: ['test/alpha/'] };
  assert.deepEqual(reachers(root, e, 'test/alpha/sib.mjs'), ['test/alpha/a.test.mjs', 'test/alpha/c.test.mjs']);
  assert.deepEqual(reachers(root, e, 'test/alpha/b.test.mjs'), ['test/alpha/b.test.mjs']);
});

// ===== file: gate-bootstrap.test.mjs =====

// The gate at the first close (review of PR 96): measured, the gate read its config from the base,
// and a base with no Process3 has none, so it ran with DEFAULTS: no lock files, no generated rows,
// and every module the tranche cover left to its suite ran without its installs, a false red.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { gate, gateConfig } from '../lib/gate.mjs';
import { DEFAULTS, git } from '../lib/util.mjs';
import { commit, entry, makeRepo } from './helpers.mjs';

const quiet = () => {};
const OWNER = DEFAULTS.approvals.owner;
const realTest = "import test from 'node:test'; import a from 'node:assert'; import { x } from '../../src/alpha/index.mjs';\ntest('x is 2', () => a.equal(x, 2));\n";

// A product whose main has no Process3, and whose tranche gains a config (at `setAt`), the module
// alpha with its suite, and a lock file. `mainFiles`: main's own beyond the README.
function product(config, { mainFiles = {}, branch = 'tranche' } = {}) {
  const root = makeRepo({ 'README.md': 'x', ...mainFiles });
  const base = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', '-b', branch], { cwd: root });
  const setAt = commit(root, { 'process/config.json': config }, 'Process3 setup on the tranche');
  const head = commit(root, {
    'process/ledger/alpha.json': entry('alpha', { status: { state: 'COMPLETE' } }),
    'package-lock.json': '{"lockfileVersion":3}\n',
    'src/alpha/index.mjs': 'export const x = 2;\n',
    'test/alpha/x.test.mjs': realTest,
  }, 'module alpha');
  return { root, base, head, setAt, branch };
}

// GitHub's view of a commit: the owner's website commit only at `owned` (by `author`).
const lookupAt = (owned, author = OWNER) => (args) => (args[1].split('/').pop() === owned
  ? { author: { login: author }, committer: { login: 'web-flow' }, commit: { verification: { verified: true } } }
  : { author: { login: 'civicsmith' }, committer: { login: 'civicsmith' }, commit: { verification: { verified: false } } });
const ioWith = (lookup) => ({ comments: () => [], getPR: () => null, lookup });
function runGate(r, lookup) {
  const npm = [];
  const exec = (cmd, args, o) => { npm.push([cmd, o.cwd]); return { code: 0, stdout: '', stderr: '' }; };
  const out = gate(r.root, { base: r.base, head: r.head, branch: r.branch, pr: null, slug: 'o/r', io: ioWith(lookup), exec, log: quiet });
  return { ...out, npm };
}

test('measured: a base with no Process3 gives the gate DEFAULTS, and a base with a config gives its own', () => {
  const r = product({ tranche: 'tranche', lockfiles: ['package-lock.json'] });
  assert.deepEqual(gateConfig(r.root, { base: r.base, head: r.base, branch: 'x', slug: 'o/r', io: ioWith(lookupAt('none')) }).cfg.lockfiles, DEFAULTS.lockfiles);
  // A base with Process3: its own config, never the head's, as before.
  const s = product({ tranche: 'tranche', lockfiles: ['package-lock.json'] }, { mainFiles: { 'process/config.json': { tranche: 'tranche' } } });
  const g = runGate(s, lookupAt('none'));
  assert.deepEqual(g.npm, [], 'the head\'s lock files are not the base\'s');
  assert.equal(g.findings.filter((f) => f.check === 'config').length, 0);
});

test('at the first close an uncovered module installs and runs from the head\'s config', () => {
  // Every anchored key at its default: GitHub is asked nothing.
  const r = product({ tranche: 'tranche', lockfiles: ['package-lock.json'], suite_timeout_minutes: 5 });
  const asked = [];
  const g = runGate(r, (a) => { asked.push(a); return null; });
  assert.deepEqual(asked, []);
  assert.deepEqual(g.npm, [['npm', r.root]]);
  assert.deepEqual(g.run.scope, ['alpha']);
  assert.equal(g.run.suite, 'pass');
  assert.deepEqual(g.findings, []);
  // The approvals moved by the default owner's website commit: the same.
  const o = product({ tranche: 'tranche', lockfiles: ['package-lock.json'], approvals: { file: 'AGENTS.md' } });
  const h = runGate(o, lookupAt(o.setAt));
  assert.deepEqual(h.npm, [['npm', o.root]]);
  assert.equal(h.run.suite, 'pass');
  assert.deepEqual(h.findings, []);
});

test('at the first close a forged head config falls back to the defaults and is refused', () => {
  // A session names another owner (or the head's own named owner's website commit set it).
  for (const lookup of [lookupAt('none'), (a) => lookupAt(a[1].split('/').pop(), 'civicsmith')(a), () => null]) {
    const r = product({ tranche: 'tranche', lockfiles: ['package-lock.json'], approvals: { owner: 'civicsmith' } });
    const g = runGate(r, lookup);
    assert.deepEqual(g.npm, [], 'no install from a forged config');
    const c = g.findings.filter((f) => f.check === 'config');
    assert.equal(c.length, 1, JSON.stringify(g.findings));
    assert.match(c[0].message, /the head changes approvals without the owner's website commit; the gate runs with the defaults/);
  }
  // process_repo, and the tranche (its own branch named the tranche), the same.
  const p = product({ tranche: 'tranche', process_repo: 'https://example.com/other', lockfiles: ['package-lock.json'] });
  assert.match(runGate(p, lookupAt('none')).findings.find((f) => f.check === 'config').message, /changes process_repo/);
  const t = product({ tranche: 'bob/evil', lockfiles: ['package-lock.json'] }, { branch: 'bob/evil' });
  const tg = runGate(t, lookupAt('none'));
  assert.deepEqual(tg.npm, []);
  assert.match(tg.findings.find((f) => f.check === 'config').message, /changes tranche/);
  // An unreadable head config: refused.
  const u = product('{ "tranche": ');
  assert.match(runGate(u, lookupAt('none')).findings.find((f) => f.check === 'config').message, /cannot be read/);
  // A head that is not the tranche its config names: the defaults, as before, and no finding.
  const n = product({ tranche: 'tranche', lockfiles: ['package-lock.json'] }, { branch: 'bob/plan' });
  const ng = runGate(n, lookupAt('none'));
  assert.deepEqual(ng.npm, []);
  assert.equal(ng.findings.filter((f) => f.check === 'config').length, 0);
});

test('at the first close only run keys come from the head: records and the owner stay the defaults', () => {
  // The head would make everything a record (the fast path) and name its own owner; the owner's
  // website commit set the approvals, so the anchor holds, but neither is taken.
  const r = product({ tranche: 'tranche', records: ['src/', 'test/', 'process/', 'package-lock.json'], approvals: { owner: 'civicsmith' } });
  const c = gateConfig(r.root, { base: r.base, head: r.head, branch: 'tranche', slug: 'o/r', io: ioWith(lookupAt(r.setAt)) });
  assert.equal(c.bootstrap, true);
  assert.deepEqual(c.cfg.records, DEFAULTS.records);
  assert.equal(c.cfg.approvals.owner, OWNER);
  const g = runGate(r, lookupAt(r.setAt));
  assert.equal(g.run.trigger, 'code', 'not the record fast path');
  assert.equal(g.run.suite, 'pass');
});

test('at the first close head run keys that overlap the defaults\' records are a finding, not a crash (review 2 of PR 97)', () => {
  const r = product({ tranche: 'tranche', records: ['rec/'], lockfiles: ['package-lock.json'], generated: [{ paths: ['process/gen.json'], regenerate: ['true'], verify: ['true'] }] });
  const g = runGate(r, lookupAt('none'));
  assert.deepEqual(g.npm, []);
  assert.match(g.findings.find((f) => f.check === 'config').message, /run keys cannot be used.*overlap/);
});

test('a base that deleted its config gives the gate its last config, and is no first close (review 5 of PR 97)', () => {
  const r = product({ tranche: 'tranche', lockfiles: ['package-lock.json'], suite_timeout_minutes: 5 }, { mainFiles: { 'process/config.json': { tranche: 'tranche', lockfiles: ['package-lock.json'] } } });
  git(['checkout', '-q', 'main'], { cwd: r.root });
  git(['rm', '-q', 'process/config.json'], { cwd: r.root });
  r.base = commit(r.root, { 'gone.txt': 'x' }, 'drop the config');
  const c = gateConfig(r.root, { base: r.base, head: r.head, branch: 'tranche', slug: 'o/r', io: ioWith(lookupAt('none')) });
  assert.equal(c.bootstrap, undefined);
  assert.deepEqual(c.cfg.lockfiles, ['package-lock.json']);
});

// ===== file: base-red-age.test.mjs =====

// status --role bob (Bob, 4 Nov): every test tolerated as base-red on the tranche, with its module
// and its age since the first gate row that tolerated it, oldest first. Report only.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { commit, makeRepo, onState } from './helpers.mjs';
import { git, loadConfig } from '../lib/util.mjs';
import { BOT, GATE, block } from '../lib/github.mjs';
import { baseRedAges } from '../lib/status.mjs';

const jl = (...rows) => rows.map((r) => JSON.stringify(r)).join('\n') + '\n';
const at = (h) => new Date(Date.UTC(2026, 10, 1, h)).toISOString();
const red = (module, ...tests) => ({ module, base: 'b0', tests });
const row = (h, over) => ({ at: at(h), ok: true, trigger: 'code', ...over });

test('base-red ages: once per test, from its first tolerating row on any merged PR, oldest first; merges before the opening left out', () => {
  const root = makeRepo({ 'README.md': 'x\n' });
  git(['checkout', '-q', '-b', 'tranche'], { cwd: root });
  commit(root, { 'process/metrics/m.jsonl': jl(
    { at: at(0), module: 'old', row: 'merge', pr: 9 },
    { at: at(5), module: 'plane', row: 'merge', pr: 11 },
    { at: at(8), module: 'lib', row: 'merge', pr: 12 },
  ) }, 'record');
  git(['update-ref', 'refs/remotes/origin/tranche', 'HEAD'], { cwd: root });
  onState(root, { 'metrics/tranche-open.jsonl': jl({ row: 'grant', tranche: 'tranche', at: at(1), act: 'push', depth: 1, outcome: 'ok' }) });
  const runs = {
    9: [row(0, { base_red: [red('old', 'o::x')] })],
    11: [row(2, { ok: false, base_red: [red('plane', 'p::a')] }), row(4, { base_red: [red('plane', 'p::a', 'p::b')] })],
    12: [row(3, { smoke: { result: 'base-red', base_red: [red('plane', 'p::a')] } }), row(7, { base_red: [red('lib', 'l::c')], smoke: { base_red: [red('plane', 'p::a')] } })],
  };
  const comments = (pr) => [{ user: { login: BOT }, body: block(GATE, { runs: runs[pr] }) }];
  const got = baseRedAges(root, loadConfig(root), { tranche: 'origin/tranche', comments, haveState: true });
  assert.deepEqual(got.map((o) => [o.module, o.test, o.pr, o.since]), [
    ['plane', 'p::a', 11, at(2)],
    ['plane', 'p::b', 11, at(4)],
    ['lib', 'l::c', 12, at(7)],
  ]);
  assert.equal(baseRedAges(root, loadConfig(root), { tranche: 'origin/tranche', comments: () => { throw new Error('unread'); }, haveState: true }), null);
  assert.equal(baseRedAges(root, loadConfig(root), { tranche: 'origin/tranche', comments, haveState: false }), null, 'the state branch unread: unread');
  runs[11][0].base_red = [red('other', 'p::a')];
  assert.equal(baseRedAges(root, loadConfig(root), { tranche: 'origin/tranche', comments, haveState: true })[0].since, at(3), 'another module\'s test of the same name is not its age');
});

test('base-red ages: none before the tranche opens', () => {
  const root = makeRepo({ 'README.md': 'x\n' });
  git(['update-ref', 'refs/remotes/origin/tranche', 'HEAD'], { cwd: root });
  onState(root, { 'metrics/other.jsonl': '' });
  assert.deepEqual(baseRedAges(root, loadConfig(root), { tranche: 'origin/tranche', comments: () => [], haveState: true }), []);
});

// ===== file: census.mjs =====

// The consistency census and the preflight (R15; Bob, 6 Nov, about 18:15Z: "It seems to me that we
// keep hitting items when checks are refusing modules with no ledger entry. Can we anticipate those
// conditions arising so that we can handle them either preemptively or more efficiently when
// they're identified?"). On 6 Nov each of these surfaced only when a command refused: layer 8's
// case-carriage, publish-schedule, project-stage and case-account (entries only on the tranche),
// op-capabilities' requirements with no entry, lane modules with no entry, action-holds and
// action-replies, setup-words and translations.
//
// census: every module named by the modules file, the requirements directory, the layer map, the
// lanes config and the ledger has what the others need, at one ref (the tranche):
//   no-entry           a module that will need a job (its layer is open or still to come, or its
//                      requirements file has an unmet mark) has no ledger entry; where the entry
//                      needs no judgment (a modules row with paths and tests, a requirements file,
//                      a suite read from its neighbours) its file is printed ready;
//   no-requirements    a module with an entry, or of an open or later layer, has no requirements file;
//   no-modules-row     an entry, a requirements file, a layer-map module or a lane's module with no
//                      row in the modules file;
//   not-in-layer-map   a modules row no layer-map line names (no layer's jobs list it);
//   layer-mismatch     the modules row's layer is not the layer map's;
//   entry-requirements its entry names a requirements file the ref does not hold;
//   not-on-layer       an open layer's branch lacks a module's entry the tranche holds (job start
//                      carries it, and the layer's own reads do not see it until then).
// Each gap names exactly what BOB writes. preflight: for a layer's modules, what `job start` would
// refuse on (no entry, an invalid one, its state, a live hold, a lane seat, the plan) with the fix.
import { entryFile, validate } from './ledger.mjs';
import { readModules } from './notice.mjs';
import { layersAt } from './layerbase.mjs';
import { DEFAULTS, LEDGER_DIR, exists, git, run, unmetIds } from './util.mjs';

const ls = (root, ref, dir) => {
  const r = git(['ls-tree', '-r', '--name-only', ref, '--', dir], { cwd: root, allowFail: true });
  return r.code === 0 ? r.stdout.split('\n').filter(Boolean) : [];
};
const show = (root, ref, p) => { const r = git(['show', `${ref}:${p}`], { cwd: root, allowFail: true }); return r.code === 0 ? r.stdout : null; };

// Every file under dirs at ref, path to text, read in two git calls (cold review of R15: a census of
// a 220-module product took about 700 git spawns, once per file). Its paths as ls-tree prints them
// without -z (a quoted name never matches an entry or a requirements file), as it always has.
function blobs(root, ref, dirs) {
  const t = git(['ls-tree', '-r', ref, '--', ...dirs], { cwd: root, allowFail: true });
  if (t.code !== 0) return new Map();
  const list = t.stdout.split('\n').map((l) => l.match(/^\d+ blob ([0-9a-f]+)\t(.+)$/)).filter(Boolean).map((m) => [m[1], m[2]]);
  if (!list.length) return new Map();
  const r = run('git', ['cat-file', '--batch'], { cwd: root, input: list.map(([sha]) => sha).join('\n') + '\n', encoding: 'buffer', maxBuffer: 1 << 30 });
  const out = new Map();
  if (r.code !== 0) return out;
  const buf = Buffer.isBuffer(r.stdout) ? r.stdout : Buffer.from(r.stdout);
  let at = 0;
  for (const [, path] of list) {
    const nl = buf.indexOf(10, at);
    if (nl < 0) break;
    const head = buf.subarray(at, nl).toString('utf8').split(' ');
    const size = Number(head[2]);
    if (head[1] !== 'blob' || !Number.isFinite(size)) break;
    out.set(path, buf.subarray(nl + 1, nl + 1 + size).toString('utf8'));
    at = nl + 1 + size + 1;
  }
  return out;
}

// The suite of a module's neighbours: the one most entries use whose tests share its first test
// path's top directory; null when none (the suite is then BOB's to name).
function neighbourSuite(entries, tests) {
  const top = String(tests?.[0] || '').split('/')[0];
  if (!top) return null;
  const counts = new Map();
  for (const e of entries.values()) {
    if (!e?.suite || !(e.tests || []).some((t) => String(t).split('/')[0] === top)) continue;
    const k = JSON.stringify(e.suite);
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  const best = [...counts].sort((a, b) => b[1] - a[1])[0];
  return best ? JSON.parse(best[0]) : null;
}

// The census at ref. open: the open layers' numbers (their branches on origin, not merged); the
// lowest is "the open layer", and every layer at or after it is still to come. Returns
// { gaps: [{ id, kind, layer, fix, file?, content? }], skipped? }.
// The job situation every proposed entry reads (C41): situations_dir's job.md at ref, where the
// product keeps it (build/situations by default, process/situations once moved); null when absent.
export function situationFile(root, cfg, ref) {
  const f = `${String(cfg.situations_dir || DEFAULTS.situations_dir).replace(/\/+$/, '')}/job.md`;
  return exists(root, ref, f) ? f : null;
}

export function census(root, cfg, { ref, open = [], now = new Date().toISOString() } = {}) {
  const rows = readModules(root, cfg, ref);
  if (rows === null) return { gaps: [], skipped: `no ${cfg.modules_file || 'modules file'} at ${ref}` };
  const row = new Map(rows.filter((m) => m?.id).map((m) => [m.id, m]));
  const dir = String(cfg.requirements_dir || DEFAULTS.requirements_dir).replace(/\/$/, '');
  const files = blobs(root, ref, [LEDGER_DIR, dir]);
  // A file at ref: from the batch when it is under those directories, else one read.
  const text = (p) => (files.has(p) ? files.get(p) : p.startsWith(`${LEDGER_DIR}/`) || p.startsWith(`${dir}/`) ? null : show(root, ref, p));
  const entries = new Map();
  for (const f of [...files.keys()].filter((x) => /^process\/ledger\/[^/]+\.json$/.test(x))) {
    const id = f.replace(/^.*\//, '').replace(/\.json$/, '');
    let e = null;
    try { e = JSON.parse(files.get(f)); } catch { e = null; }
    entries.set(id, e);
  }
  const reqs = new Map([...files.keys()].filter((f) => f.endsWith('.md') && f.slice(dir.length + 1).indexOf('/') < 0 && !/^README\.md$/i.test(f.slice(dir.length + 1))).map((f) => [f.slice(dir.length + 1, -3), f]));
  const map = layersAt(root, cfg, ref);
  // The map's own layers: a completion layer reopens modules whose layer is the map's (C33).
  const mapLayer = new Map(map.filter((L) => !L.completion).flatMap((L) => L.mods.map((m) => [m, L.n])));
  const lanes = (Array.isArray(cfg.lanes) ? cfg.lanes : []).filter((l) => l?.module).map((l) => l.module);
  const first = open.length ? Math.min(...open) : null;
  const layerOf = (id) => mapLayer.get(id) ?? (Number.isInteger(row.get(id)?.layer) ? row.get(id).layer : null);
  const ahead = (id) => first !== null && layerOf(id) !== null && layerOf(id) >= first;
  // A module's requirements file: the one its entry names, else <dir>/<id>.md; null when the ref
  // holds neither.
  const reqPath = new Map();
  const reqOf = (id) => {
    if (!reqPath.has(id)) {
      const named = entries.get(id)?.requirements ? String(entries.get(id).requirements).replace(/^\.\//, '') : null;
      reqPath.set(id, named && text(named) !== null ? named : reqs.get(id) || null);
    }
    return reqPath.get(id);
  };
  const reqText = new Map();
  const unmet = (id) => {
    const f = reqOf(id);
    if (!f) return [];
    if (!reqText.has(id)) reqText.set(id, text(f) || '');
    return unmetIds(reqText.get(id));
  };
  const all = new Set([...row.keys(), ...entries.keys(), ...reqs.keys(), ...mapLayer.keys(), ...lanes]);
  const gaps = [];
  const gap = (id, kind, fix, extra = {}) => gaps.push({ id, kind, layer: layerOf(id), fix, ...extra });
  // Whether a path is on ref, files and folders, from one ls-tree of the whole tree when first asked
  // (C50: a rev-parse per path of each module built before the ledger); a path ls-tree cannot
  // answer for (empty, ./, .., a leading or trailing /) is asked of git as before.
  let tree;
  const onRef = (p) => {
    if (!p || /^\.{0,2}\/|(^|\/)\.{1,2}(\/|$)|\/\/|\/$/.test(p)) return exists(root, ref, p);
    if (tree === undefined) { const t = git(['ls-tree', '-r', '-t', '--name-only', '-z', ref], { cwd: root, allowFail: true }); tree = t.code === 0 ? new Set(t.stdout.split('\0').filter(Boolean)) : null; }
    return tree ? tree.has(p) : exists(root, ref, p);
  };
  const readme = exists(root, ref, `${dir}/README.md`) ? `${dir}/README.md` : null;
  const situation = situationFile(root, cfg, ref);
  for (const id of [...all].sort()) {
    const r = row.get(id);
    const e = entries.get(id);
    const marks = unmet(id);
    const lane = lanes.includes(id);
    // Whether the module still needs a job: its entry OPEN, BLOCKED or WORKING, an unmet mark, or
    // no entry and its layer open or to come. A modules row off the layer map is a gap whatever
    // its state: a COMPLETE one's later found mark or --reopen would never show in layer jobs (the
    // copy, 6 Nov: BOB found 8 COMPLETE ones by hand). A lane's module never is: no layer lists it.
    const needs = (e && ['OPEN', 'BLOCKED', 'WORKING'].includes(e.status?.state)) || marks.length > 0 || (!e && ahead(id));
    if (!r) gap(id, 'no-modules-row', `add ${id}'s row to ${cfg.modules_file} (its paths, tests, uses and layer): it is named by ${[entries.has(id) && 'its ledger entry', reqs.has(id) && reqs.get(id), mapLayer.has(id) && cfg.layers_file, lane && 'the lanes config'].filter(Boolean).join(', ')}`);
    if (r && !mapLayer.has(id) && map.length && !lane) gap(id, 'not-in-layer-map', `name ${id} on its layer's line in ${cfg.layers_file}${Number.isInteger(r.layer) ? ` (its modules row says layer ${r.layer})` : ''}${needs ? '' : ' (a finding: nothing waits on it, PD-4)'}: no layer's jobs list it`, { needs: !!needs });
    if (r && mapLayer.has(id) && Number.isInteger(r.layer) && r.layer !== mapLayer.get(id) && needs) gap(id, 'layer-mismatch', `${cfg.modules_file} says layer ${r.layer}, ${cfg.layers_file} says ${mapLayer.get(id)}: make them one`);
    if (e && e.requirements && text(String(e.requirements).replace(/^\.\//, '')) === null) gap(id, 'entry-requirements', `its entry names ${e.requirements}, which ${ref} does not hold: write it, or name the right file in ${entryFile(id)}`);
    // A modules row with no entry, its layer past and nothing unmet: a module built before the
    // ledger (C16, the copy 7 Nov: 49 of them; layer jobs read every module that uses one as not
    // early, blocking early starts with no word why). Its entry records it COMPLETE.
    if (!entries.has(id) && r && !(ahead(id) || marks.length || lane)) {
      const n = layerOf(id);
      const req = reqOf(id);
      // Past only when a layer is open and this one is before it; with none open, which modules
      // were built is BOB's to say: flagged, never written ready.
      const past = first !== null && n !== null && n < first;
      // Ready only when what it claims is there: every path and test of its row on the ref (cold
      // review: a layer skipped, or a module dropped from a closed one, has a past layer number too).
      const missing = [...(r.paths || []), ...(r.tests || [])].filter((p) => !onRef(String(p).replace(/\/$/, '')));
      const why = !past ? 'no layer is open, so whether it was built is not known'
        : !(r.paths || []).length ? 'its modules row has no paths' : !(r.tests || []).length ? 'its modules row has no tests'
          : missing.length ? `${missing.slice(0, 2).join(', ')} not on ${ref}: whether it was built is BOB's to say`
            : !req ? `no requirements file ${dir}/${id}.md` : !neighbourSuite(entries, r.tests) ? `no neighbour's suite to copy (its tests: ${r.tests.join(', ')})` : null;
      const content = why ? null : {
        id, title: `${id}: built before the ledger`, ...(n !== null ? { layer: n } : {}),
        paths: [...new Set([...(r.paths || []), ...(req ? [req] : [])])], tests: r.tests, ...(req ? { requirements: req } : {}), uses: r.uses || [],
        ...(neighbourSuite(entries, r.tests) ? { suite: neighbourSuite(entries, r.tests) } : {}),
        reading: [req, readme, situation].filter(Boolean), status: { state: 'COMPLETE', at: now },
      };
      const bad = content ? validate(content) : [];
      gap(id, 'no-entry', `write ${entryFile(id)}${past ? ' recording it COMPLETE (built before the ledger;' : ', COMPLETE if it was built before the ledger, else OPEN (no entry;'} modules that use it wait for it as a provider until it has one)${why || bad.length ? ` (not ready: ${why || `the schema refuses it: ${bad.slice(0, 2).join('; ')}`}; that is BOB's to write)` : ' (ready below: no judgment in it)'}`, { done: true, ...(content && !bad.length ? { content, file: entryFile(id) } : {}) });
    }
    if (!entries.has(id) && (ahead(id) || marks.length || lane) && r) {
      // The entry, ready when nothing in it is a judgment.
      const suite = neighbourSuite(entries, r.tests);
      const why = !reqOf(id) ? `no requirements file ${dir}/${id}.md` : !(r.paths || []).length ? 'its modules row has no paths' : !(r.tests || []).length ? 'its modules row has no tests' : !suite ? `no neighbour's suite to copy (no entry's tests share ${String(r.tests[0]).split('/')[0]}/)` : null;
      const n = layerOf(id);
      const content = why ? null : {
        id, title: marks.length ? `${id}: meet its unmet requirement marks` : `${id}: confirm its requirements on layer ${n}`,
        ...(n !== null ? { layer: n } : {}),
        paths: [...new Set([...(r.paths || []), reqOf(id)])], tests: r.tests, requirements: reqOf(id), uses: r.uses || [], suite,
        reading: [reqOf(id), readme, situation].filter(Boolean), status: { state: 'OPEN', at: now },
      };
      // A row the schema refuses (an odd type, say) makes the entry BOB's, never a throw.
      const bad = content ? validate(content) : [];
      gap(id, 'no-entry', `write ${entryFile(id)}${why || bad.length ? ` (not ready: ${why || `its modules row gives an entry the schema refuses: ${bad.slice(0, 2).join('; ')}`}; that is BOB's to write)` : ' (ready below: no judgment in it)'}: ${lane ? 'a lane\'s module' : marks.length ? `${marks.length} unmet mark(s) in ${reqOf(id)}` : `layer ${n} is open or still to come`}`, content && !bad.length ? { file: entryFile(id), content } : {});
    }
    if (!reqOf(id) && r && !e?.requirements && (entries.has(id) || ahead(id))) gap(id, 'no-requirements', `write ${dir}/${id}.md, the module's requirements (BOB's: judgment)`);
  }
  // An open layer's branch holds the entries of its modules the tranche holds.
  for (const n of open) {
    const b = `refs/remotes/origin/layer/${n}`;
    if (git(['rev-parse', '-q', '--verify', b], { cwd: root, allowFail: true }).code !== 0) continue;
    const on = new Set(ls(root, b, LEDGER_DIR).map((f) => f.replace(/^.*\//, '').replace(/\.json$/, '')));
    for (const id of (map.find((L) => L.n === n)?.mods || []).filter((m) => entries.has(m) && !on.has(m))) gap(id, 'not-on-layer', `layer/${n} lacks ${entryFile(id)}, which ${ref} holds: job start ${id} carries it; until then the layer's own reads do not see it`);
  }
  return { gaps };
}

// The gaps of the given layers (each its line), the others counted; the ready entries as one batch.
export function censusLines(c, { layers = null, tranche = 'tranche', label = 'gaps' } = {}) {
  if (c.skipped) return [];
  const mine = layers ? c.gaps.filter((g) => layers.includes(g.layer)) : c.gaps;
