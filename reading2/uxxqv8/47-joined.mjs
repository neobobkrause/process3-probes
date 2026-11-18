// ===== file: job.test.mjs (continued) =====

  assert.ok(own.includes('- the wake that job complete or block prints'), 'an entry with its own acts keeps the wake');
});

test('a mark at the end of a requirement line, after its bold title, is struck like any other, and needs its --test', () => {
  const root = product();
  // The copy's acquisition R127 shape (the coordinator's ruling under P17, 4 Nov).
  commit(root, { 'req/alpha.md': '# alpha\n\n- **R1** (T53; N1259; K4403 (2)) **Reads in slices.** Control: no resume. *(not yet met: T53)*\n- **R2** (T53) **Does y.** *(not yet met: T53)*\n  (T53; R1: a continuation line) *(not yet met: T53)*\n' });
  git(['branch', '-f', 'tranche', 'main'], { cwd: root });
  jobStart(root, 'alpha', { coordinator: 's', push: false, log: quiet });
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  commit(root, {
    // R1's mark struck; the continuation line's words are prose and stay as they were.
    'req/alpha.md': '# alpha\n\n- **R1** (T53; N1259; K4403 (2)) **Reads in slices.** Control: no resume.\n- **R2** (T53) **Does y.** *(not yet met: T53)*\n  (T53; R1: a continuation line) *(not yet met: T53)*\n',
    'test/alpha/x.test.mjs': "import test from 'node:test'; test('R1 slices', () => {});\n",
    'src/alpha/x.mjs': 'export const x = 1;\n',
  });
  const run = (tests) => jobComplete(root, 'alpha', { push: false, tests, log: quiet });
  assert.throws(() => run([]), /struck R1 with no --test/);
  assert.throws(() => run(['R2=test/alpha/x.test.mjs::R1 slices']), /no mark for R2 that this branch struck \(struck: R1\)/);
  assert.deepEqual(run(['R1=test/alpha/x.test.mjs::R1 slices']).receipt.tests, [{ req: 'R1', file: 'test/alpha/x.test.mjs', name: 'R1 slices' }]);
});

// Copy, 4 Nov: with rows.mjs untracked, job test and job complete must build it as the gate does.
import { existsSync as existsGen } from 'node:fs';
test('job test and job complete build untracked generated files before the suite', () => {
  const gen = "import { mkdirSync, writeFileSync } from 'node:fs';\nmkdirSync('gen', { recursive: true });\nwriteFileSync('gen/rows.mjs', 'export const rows = 3;\\n');\n";
  const uses = "import test from 'node:test'; import a from 'node:assert'; import { rows } from '../../gen/rows.mjs';\ntest('rows', () => a.equal(rows, 3));\n";
  const root = makeRepo({
    'process/ledger/alpha.json': entry('alpha'),
    'process/config.json': JSON.stringify({ generated: [{ paths: ['gen/rows.mjs'], regenerate: ['node', 'gen.mjs'], verify: ['node', '-e', 'process.exit(0)'] }] }),
    'gen.mjs': gen,
    '.gitignore': 'gen/rows.mjs\n',
    'req/alpha.md': '# alpha\n\nR1 does a thing.\n',
    'test/alpha/a.test.mjs': uses,
  });
  git(['branch', 'tranche'], { cwd: root });
  assert.equal(jobTest(root, 'alpha', { log: quiet }).ok, true);
  git(['clean', '-qfdX'], { cwd: root });
  assert.equal(existsGen(join(root, 'gen/rows.mjs')), false);
  jobStart(root, 'alpha', { coordinator: 's', push: false, log: quiet });
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  git(['clean', '-qfdX'], { cwd: root });
  const c = jobComplete(root, 'alpha', { push: false, log: quiet });
  assert.equal(c.ok, true, JSON.stringify(c.commands));
  assert.ok(c.receipt.commands.some((x) => /^build generated \(gen\/rows\.mjs\)$/.test(x.cmd) && x.exit === 0));
});

// The job's cost is BOB's at the merge (measured 4 Nov, 11:49: mid-turn a session's own record has
// no usage): job complete needs no --cost-usd, and names its session in the complete row.
test('job complete without --cost-usd completes, writes no measured row, and names its session in the complete row', () => {
  const root = product();
  jobStart(root, 'alpha', { coordinator: 's', push: false, log: quiet });
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  commit(root, { 'src/alpha/index.mjs': 'export const x = 1;\n' });
  const was = process.env.CLAUDE_CODE_REMOTE_SESSION_ID;
  process.env.CLAUDE_CODE_REMOTE_SESSION_ID = 'cse_J';
  try { assert.equal(jobComplete(root, 'alpha', { push: false, log: quiet }).ok, true); } finally {
    if (was === undefined) delete process.env.CLAUDE_CODE_REMOTE_SESSION_ID; else process.env.CLAUDE_CODE_REMOTE_SESSION_ID = was;
  }
  assert.equal(readEntry(root, 'alpha').status.state, 'COMPLETE');
  const rows = readRows(root, 'alpha');
  assert.equal(rows.filter((r) => r.event === 'measured').length, 0);
  assert.equal(rows.filter((r) => r.event === 'complete').pop().session, 'session_J');
});

test('the START no longer asks the job for --cost-usd', () => {
  const root = product();
  const said = [];
  jobStart(root, 'alpha', { coordinator: 's', push: false, log: (m) => said.push(m) });
  assert.doesNotMatch(said.join('\n'), /--cost-usd/);
  assert.match(said.join('\n'), /job complete alpha --not-verified/);
});

test('p3 test runs the suite within suite_timeout_minutes from config', () => {
  const slow = "import test from 'node:test'; test('slow', async () => { await new Promise((r) => setTimeout(r, 3000)); });\n";
  const root = product();
  commit(root, { 'test/alpha/b.test.mjs': slow, 'process/config.json': { suite_timeout_minutes: 0.02 } });
  const short = jobTest(root, 'alpha', { log: quiet });
  assert.equal(short.ok, false, 'killed at 1.2 s');
  assert.ok(short.seconds < 2.9, `${short.seconds} s`);
  commit(root, { 'process/config.json': { suite_timeout_minutes: 1 } });
  assert.equal(jobTest(root, 'alpha', { log: quiet }).ok, true);
});

// ===== file: fail-reporter.mjs =====

// A node test runner reporter (base-red, basered.mjs): one JSON line per test that ends, failing
// or passing ("ok": true), from the runner's own structured events, written to a destination of
// its own, so nothing the tests print can pose as a failure or hide one. A test's file is where
// its test() was called, so a test a sibling module declares carries the sibling's path (copy PR
// 290: r9-seam-limits.mjs, imported by t51-round9-seam.test.mjs). test:start, test:pass and
// test:fail come in definition order, the files in the order run (node's guarantee), so the
// enclosing names are those last started at each lower nesting, whichever file declared them: a
// stack per file lost a describe of the test file around a sibling's tests. A result named for the
// file itself ("whole") is the runner's for a file that failed to load or exited early.
// Per test file run (build gate-speed, the revert check's one concurrent run): the runner's own
// test:complete for each file it ran, the file's verdict as its exit code would be run alone,
// written as a "done" line ({ file, done: true, ok }); and a "load" line once for a file whose
// output or failures show a module that could not load (LOAD, as the revert check reads a file's
// output run alone). Neither is a test's result: readResults keeps them apart.
import { resolve } from 'node:path';

export const LOAD = /ERR_MODULE_NOT_FOUND|Cannot find module|does not provide an export named/;
const errText = (err) => { const out = []; for (let x = err, i = 0; x && i < 5; x = x.cause, i++) out.push(String(x.code ?? ''), String(x.message ?? ''), String(x.stack ?? '')); return out.join('\n'); };

export default async function* failReporter(source) {
  const s = [];
  const load = new Set();
  const loaded = function* (f) { const file = typeof f === 'string' ? resolve(f) : null; if (file && !load.has(file)) { load.add(file); yield `${JSON.stringify({ file, path: ['(load)'], load: true })}\n`; } };
  for await (const e of source) {
    const d = e.data || {};
    if (e.type === 'test:stdout' || e.type === 'test:stderr') { if (LOAD.test(String(d.message ?? ''))) yield* loaded(d.file); continue; }
    if (e.type === 'test:complete') {
      if (!d.nesting && typeof d.file === 'string' && typeof d.name === 'string' && resolve(d.name) === d.file) yield `${JSON.stringify({ file: d.file, path: [d.name], done: true, ok: d.details?.passed === true })}\n`;
      continue;
    }
    if (e.type === 'test:fail' && LOAD.test(errText(d.details?.error))) yield* loaded(d.file);
    if (e.type !== 'test:start' && e.type !== 'test:fail' && e.type !== 'test:pass') continue;
    if (e.type === 'test:start') { s.length = d.nesting; s[d.nesting] = d.name; continue; }
    if (d.todo || d.skip) continue;
    yield `${JSON.stringify({ file: d.file ?? null, path: [...s.slice(0, d.nesting), d.name], type: d.details?.type ?? null, ...(e.type === 'test:pass' ? { ok: true } : {}), ...(!d.nesting && typeof d.file === 'string' && resolve(d.name) === d.file ? { whole: true } : {}) })}\n`;
  }
}

// ===== file: gate.test.mjs (later part) =====

    'gen.mjs': gen,
    '.gitignore': 'gen/rows.mjs\n',
    'src/alpha/index.mjs': 'export const x = 1;\n',
    'test/alpha/old.test.mjs': inertTest,
  });
  git(['branch', 'tranche'], { cwd: root });
  const base = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', '-b', 'job/alpha'], { cwd: root });
  const head = commit(root, { 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/rows.test.mjs': uses });
  assert.equal(existsSync(join(root, 'gen/rows.mjs')), false, 'not committed, not built yet');
  const io = fakeIO(null);
  io.state.comments = [{ id: 1, body: block(RECEIPT, receiptFor(head)), user: { login: 'civicsmith' } }];
  const r = gate(root, { base, head, branch: 'job/alpha', pr: 5, slug: 'o/r', io: io.io, log: quiet });
  assert.equal(r.run.suite, 'pass', JSON.stringify(r.findings));
  assert.deepEqual(r.run.built, ['gen/rows.mjs']);
  assert.equal(git(['status', '--porcelain'], { cwd: root }), '', 'the built file is ignored, nothing to commit');
});

// Review of PR 80: a failed build is red once (not twice), the later GAT-4 step does not rebuild a
// row this run built, and a job may not remove a committed generated file.
function genProduct(genScript, extra = {}) {
  const root = makeRepo({
    'process/ledger/alpha.json': entry('alpha', { status: { state: 'WORKING' } }),
    'process/config.json': JSON.stringify({ generated: [{ paths: ['gen/rows.mjs'], regenerate: ['node', 'gen.mjs'], verify: ['node', '-e', 'process.exit(0)'] }] }),
    'gen.mjs': genScript,
    '.gitignore': 'gen/rows.mjs\n',
    'src/alpha/index.mjs': 'export const x = 1;\n',
    'test/alpha/old.test.mjs': inertTest,
    ...extra,
  });
  git(['branch', 'tranche'], { cwd: root });
  const base = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', '-b', 'job/alpha'], { cwd: root });
  return { root, base };
}
const ioFor = (head) => { const io = fakeIO(null); io.state.comments = [{ id: 1, body: block(RECEIPT, receiptFor(head)), user: { login: 'civicsmith' } }]; return io; };

test('a failed generated build is one finding, and no row is regenerated twice in a run', () => {
  const counting = "import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';\nappendFileSync('runs.log', 'x');\nmkdirSync('gen', { recursive: true });\nwriteFileSync('gen/rows.mjs', 'export const rows = 3;\\n');\n";
  const ok = genProduct(counting, { '.gitignore': 'gen/rows.mjs\nruns.log\n' });
  const h1 = commit(ok.root, { 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/x.test.mjs': realTest });
  const r1 = gate(ok.root, { base: ok.base, head: h1, branch: 'job/alpha', pr: 5, slug: 'o/r', io: ioFor(h1).io, log: quiet });
  assert.equal(r1.run.suite, 'pass');
  assert.equal(readFileSync(join(ok.root, 'runs.log'), 'utf8'), 'x', 'built once, not again by GAT-4');

  const bad = genProduct("process.exit(1);\n");
  const h2 = commit(bad.root, { 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/x.test.mjs': realTest });
  const r2 = gate(bad.root, { base: bad.base, head: h2, branch: 'job/alpha', pr: 5, slug: 'o/r', io: ioFor(h2).io, log: quiet });
  const gens = r2.findings.filter((f) => f.check === 'generated');
  assert.equal(gens.length, 1, JSON.stringify(gens));
  assert.match(gens[0].message, /failed \(exit 1\) building gen\/rows\.mjs/);
