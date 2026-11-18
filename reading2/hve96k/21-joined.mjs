// ===== file: session-safety.test.mjs (continued) =====

  assert.equal(pushRetry(root, 'tranche', { wait: 0, log: quiet, tries: 2, push: p3 }), last);
});

test('pushRetry: the real wordings of a moved ref and a server error are retried', async () => {
  const { REF_MOVED, SERVER_ERROR } = await import('../lib/util.mjs');
  for (const w of [' ! [rejected]        HEAD -> process-state (non-fast-forward)', ' ! [rejected] HEAD -> x (fetch first)', LOCK('process-state'), ' ! [remote rejected] HEAD -> x (stale info)']) assert.match(w, REF_MOVED);
  for (const w of [' ! [remote rejected] b -> b (Internal Server Error)', 'error: RPC failed; HTTP 500 curl 22 The requested URL returned error: 500', 'fatal: unable to access: Received HTTP code 503 from proxy after CONNECT', E500]) assert.match(w, SERVER_ERROR);
  for (const w of ['remote: Permission to o/r.git denied', ' ! [remote rejected] HEAD -> x (protected branch hook declined)', 'fatal: port 5432 is busy']) {
    assert.doesNotMatch(w, REF_MOVED); assert.doesNotMatch(w, SERVER_ERROR);
  }
});

test('pushRetry: gives up after the last try with the remote\'s words; other failures stop at once', () => {
  const { root } = withOrigin({ 'README.md': 'x' });
  commit(root, { 'a.txt': 'a' });
  const before = tipOf(root, 'tranche');
  let calls = 0;
  const always = () => { calls++; return { code: 1, stderr: LOCK('tranche') }; };
  assert.throws(() => pushRetry(root, 'tranche', { wait: 0, log: quiet, push: always }), (e) => e instanceof Fail && /refused 5 times/.test(e.message) && /cannot lock ref 'refs\/heads\/tranche': is at 41bd0831f370 but expected 61e852893eab/.test(e.message));
  assert.equal(calls, 5);
  assert.throws(() => pushRetry(root, 'tranche', { wait: 0, log: quiet, tries: 3, push: () => ({ code: 1, stderr: E500 }) }), /refused 3 times \(the server kept failing\).*returned error: 500/s);
  calls = 0;
  assert.throws(() => pushRetry(root, 'tranche', { wait: 0, log: quiet, push: () => { calls++; return { code: 1, stderr: 'remote: Permission to o/r.git denied' }; } }), /the push of tranche failed: remote: Permission/);
  assert.equal(calls, 1);
  assert.equal(tipOf(root, 'tranche'), before);
});

// ===== file: gate-speed.test.mjs (later part) =====

  assert.equal(baseRed(s.root, e, { base: s.base, failing, cfg, timeout: 60000, prepared: other }).ok, true);
  assert.equal(other.used, false);
  other.drop();
  // Ended without a verdict (crashed, killed): prepared inline.
  let dropped = 0;
  const crashed = { base: s.base, used: false, wait: () => null, drop: () => { dropped++; } };
  assert.equal(baseRed(s.root, e, { base: s.base, failing, cfg, timeout: 60000, prepared: crashed }).ok, true);
  assert.equal(dropped, 1);
  // A failed preparation beside the head is prepared again here, with base-red's own budget.
  const refused = { base: s.base, used: false, wait: () => ({ ok: false, why: "the base's build failed: killed" }), drop: () => {} };
  const again = [];
  assert.equal(baseRed(s.root, e, { base: s.base, failing, cfg, timeout: 60000, prepared: refused, log: (l) => again.push(l) }).ok, true);
  assert.ok(again.some((l) => /the background preparation refused \(the base's build failed: killed\): the tree is prepared here/.test(l)));
  // A base that cannot be written is refused, inline or not.
  const bad = startBase(s.root, { base: 'f'.repeat(40), cfg, timeout: 60000 });
  const r = baseRed(s.root, e, { base: 'f'.repeat(40), failing: [{ file: 'src/alpha/index.mjs', name: 'x' }], cfg, timeout: 60000, prepared: bad });
  assert.match(r.why, /^(the base's tree could not be prepared|new failing test file)/);
  bad.drop();
  assert.deepEqual(mine(), []);
});

test('base-red: a base file changed in the tree prepared beside the head is caught, and the tree prepared again', () => {
  const s = setup({ 'test/alpha/red.test.mjs': redTest, 'bin/run.sh': '#!/bin/sh\n' }, { 'src/alpha/index.mjs': 'export const x = 2;\n' });
  git(['update-index', '--chmod=+x', 'bin/run.sh'], { cwd: s.root });
  const e = JSON.parse(readFileSync(join(s.root, 'process/ledger/alpha.json'), 'utf8'));
  const cfg = loadConfig(s.root);
  const failing = [{ file: 'test/alpha/red.test.mjs', name: 'plane > has ai-catalogue' }];
  const p = startBase(s.root, { base: s.base, cfg, timeout: 60000 });
  // Ready, then written into by code of the PR: the failing test made to fail there.
  for (const t0 = Date.now(); !existsSync(join(p.dir, 'exit')) && Date.now() - t0 < 30000;) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100);
  assert.equal(changedInTree(s.root, s.base, p.wt), null);
  writeFileSync(join(p.wt, 'src/alpha/index.mjs'), 'export const x = 9;\n');
  assert.equal(changedInTree(s.root, s.base, p.wt), 'src/alpha/index.mjs');
  const lines = [];
  assert.equal(baseRed(s.root, e, { base: s.base, failing, cfg, timeout: 60000, prepared: p, log: (l) => lines.push(l) }).ok, true);
  assert.ok(lines.some((l) => /src\/alpha\/index\.mjs in the base's tree prepared beside the head is not the base's: the tree is prepared here/.test(l)), lines.join('\n'));
  assert.equal(existsSync(p.dir), false);
});

test('base-red: dropping a preparation kills its whole process group, verdict or not', () => {
  const s = setup({}, { 'src/alpha/index.mjs': 'export const x = 2;\n' });
  // A build that leaves a descendant behind, as an install's lifecycle script may. Its sleep
  // takes a duration no other process on the machine uses (30 s and a fraction unique to this
  // run), so the count is of this test's own processes only: another `sleep 30` (a session's
  // ci-watch loop, 6 Nov) is neither counted nor killed.
  const mine = `30.${process.pid}${Date.now() % 1000}`;
  const other = spawn('sleep', ['30'], { detached: true, stdio: 'ignore' });
  try {
    const rows = [{ paths: ['gen/x.txt'], regenerate: ['sh', '-c', `sleep ${mine} >/dev/null 2>&1 & exit 0`], verify: ['true'] }];
    const p = startBase(s.root, { base: s.base, cfg: loadConfig(s.root), rows, timeout: 60000 });
    assert.equal(p.wait(30000).ok, true);
    assert.equal(sleeping(mine).length, 1, 'the descendant outlives the verdict');
    p.drop();
    assert.deepEqual(sleeping(mine), []);
    assert.ok(sleeping('30').includes(String(other.pid)), 'a sleep the test did not start is not counted, and is left running');
  } finally { try { process.kill(-other.pid); } catch { /* gone */ } }
});

// The live (not zombie) processes whose command line is exactly `sleep <arg>`.
function sleeping(arg) {
  return readdirSync('/proc').filter((n) => /^\d+$/.test(n)).filter((n) => {
    try { return readFileSync(`/proc/${n}/stat`, 'utf8').replace(/^.*\) /s, '')[0] !== 'Z' && readFileSync(`/proc/${n}/cmdline`, 'utf8') === `sleep\u0000${arg}\u0000`; } catch { return false; }
  });
}

test('base-red: a preparation whose process is gone without a verdict is not waited for', () => {
  const s = setup({}, { 'src/alpha/index.mjs': 'export const x = 2;\n' });
  const rows = [{ paths: ['gen/slow.txt'], regenerate: ['node', '-e', 'setTimeout(() => {}, 20000)'], verify: ['true'] }];
  const p = startBase(s.root, { base: s.base, cfg: loadConfig(s.root), rows, timeout: 60000 });
  // The whole group killed, the shell's exit status unwritten (an OOM kill).
  p.kill();
  const t0 = Date.now();
  assert.equal(p.wait(30000), null);
  assert.ok(Date.now() - t0 < 10000, `${Date.now() - t0} ms`);
  p.drop();
});

test('base-red: a preparation not ready within the wait is stopped and refused with why', () => {
  const s = setup({}, { 'src/alpha/index.mjs': 'export const x = 2;\n' });
  const cfg = loadConfig(s.root);
  // A generated row whose build sleeps: the background process is still building.
  const rows = [{ paths: ['gen/slow.txt'], regenerate: ['node', '-e', 'setTimeout(() => {}, 20000)'], verify: ['true'] }];
  const p = startBase(s.root, { base: s.base, cfg, rows, timeout: 60000 });
  const t0 = Date.now();
  const v = p.wait(1500);
  assert.ok(Date.now() - t0 < 10000);
  assert.match(v.why, /^the base's tree was not ready within \d+ s$/);
  p.drop();
  assert.equal(existsSync(p.dir), false);
});

// 3. A change only to the requirements file.

const IDS = "import test from 'node:test'; import a from 'node:assert'; import { readFileSync } from 'node:fs';\ntest('R1 is listed', () => a.match(readFileSync('req/alpha.md', 'utf8'), /\\*\\*R1\\*\\*/));\n";
const RED_ELSEWHERE = "import test from 'node:test'; test('unrelated red', () => { throw new Error('never run on a text-only change'); });\n";
const reqOnly = (baseFiles = {}, alpha = {}) => setup({
  'test/alpha/ids.test.mjs': IDS,
  'test/alpha/helper.mjs': "import { readFileSync } from 'node:fs';\nexport const text = () => readFileSync(['req', 'alpha' + '.m' + 'd'].join('/') /* requirements */, 'utf8');\n",
  'test/alpha/uses-helper.test.mjs': "import test from 'node:test'; import a from 'node:assert'; import { text } from './helper.mjs';\ntest('R1 via helper', () => a.ok(text().includes('R1')));\n",
  'test/alpha/other.test.mjs': RED_ELSEWHERE,
  ...baseFiles,
}, { 'req/alpha.md': '# alpha\n\n- **R1** x is one, reworded\n' }, { alpha: { paths: ['src/alpha/', 'req/alpha.md'], ...alpha } });
const exempt = (s) => receiptFor(s.head, { exempt: { revert: 'requirements text only' } });

test('a change only to the requirements file runs only the tests that read it: those naming it, and those importing a helper that names its directory', () => {
  const s = reqOnly();
  const r = run(s, exempt(s));
  assert.deepEqual(r.findings, []);
  assert.deepEqual([r.run.suite, r.run.tests], ['pass', [{ total: 2, pass: 2, fail: 0 }]]);
  assert.deepEqual(r.run.requirements_only, [{ module: 'alpha', files: ['test/alpha/ids.test.mjs', 'test/alpha/uses-helper.test.mjs'] }]);
  assert.ok(r.lines.some((l) => l === 'alpha: only its requirements file req/alpha.md changed: the suite runs the 2 test file(s) that read it (test/alpha/helper.mjs, test/alpha/ids.test.mjs, reached from test/alpha/ids.test.mjs, test/alpha/uses-helper.test.mjs)'), r.lines.join('\n'));
  // The tranche into main runs every suite whole.
  const cfg = loadConfig(s.root);
  const e = JSON.parse(readFileSync(join(s.root, 'process/ledger/alpha.json'), 'utf8'));
  assert.deepEqual(requirementsOnly(s.root, cfg, e, { changed: ['req/alpha.md', 'process/metrics/alpha.jsonl'] }), ['test/alpha/ids.test.mjs', 'test/alpha/uses-helper.test.mjs']);
  assert.equal(requirementsOnly(s.root, cfg, e, { changed: ['req/alpha.md', 'src/alpha/index.mjs'] }), null, 'another file changed');
  assert.equal(requirementsOnly(s.root, cfg, { ...e, requirements: undefined }, { changed: ['req/alpha.md'] }), null);
});

test('no test reading the requirements file: the suite is not run, and passes with none', () => {
  const s = setup({ 'test/alpha/other.test.mjs': RED_ELSEWHERE }, { 'req/alpha.md': '# alpha\n\n- **R1** x is one, reworded\n' }, { alpha: { paths: ['src/alpha/', 'req/alpha.md'] } });
  const r = run(s, exempt(s));
  assert.deepEqual(r.findings, []);
  assert.deepEqual([r.run.suite, r.run.tests, r.run.receipt, r.run.requirements_only], ['pass', [{ total: 0, pass: 0, fail: 0 }], 'agrees', [{ module: 'alpha', files: [] }]]);
  assert.ok(!r.lines.some((l) => /prepared beside/.test(l)), 'no suite runs: no base tree is prepared');
  assert.ok(r.lines.some((l) => /no test reads it \(none of its tests names alpha\.md or req\): the suite is not run/.test(l)), r.lines.join('\n'));
});

test('the whole suite runs when code beside the tests may read the requirements file', () => {
  const cases = [
    ['its source names it', { 'src/alpha/doc.mjs': "export const doc = 'req/alpha.md';\n" }, {}, /src\/alpha\/doc\.mjs, of the module's own paths/],
    ['its preload names it', { 'test/hook.mjs': "globalThis.where = 'alpha.md';\n" }, { suite: { cwd: '.', command: ['node', '--import', './test/hook.mjs', '--test'] } }, /test\/hook\.mjs, which the suite preloads/],
