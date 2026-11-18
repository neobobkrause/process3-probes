// ===== file: found.test.mjs (continued) =====

  assert.equal(found(root, 'q2', 'one', { log: quiet }).mark, 'F1', 'the local branch holds nothing written');
  git(['push', '-q', 'origin', preview.branch], { cwd: root });
  const w = found(root, 'q2', 'one', { write: true, log: quiet });
  assert.deepEqual([w.mark, w.branch], ['F1', preview.branch], 'pushed with nothing written: still the same mark');
  assert.match(readFileSync(join(root, 'build/requirements/q2.md'), 'utf8'), /\*\*F1\*\* \*\(not yet met: [^)]*\)\* one/);
  // Once committed there, it is written: another finding is F2.
  git(['commit', '-qam', 'found: q2 F1'], { cwd: root });
  git(['push', '-q', 'origin', preview.branch], { cwd: root });
  git(['switch', '-q', 'tranche'], { cwd: root });
  assert.equal(found(root, 'q2', 'two', { log: quiet }).mark, 'F2');
});

// ===== file: job.test.mjs (later part) =====

  jobComplete(root, 'alpha', { gh: f.gh, log: quiet });
  const tip = git(['rev-parse', 'HEAD'], { cwd: root });
  assert.deepEqual(seen, [['receipt', tip], ['ready', tip, 1]]);
});

test('a mark with a parenthetical between its id and "(not yet met" is struck like any other, and needs its --test', () => {
  const root = product();
  // The copy's own shape (local-facts R23 and R25, 4 Nov), nested parentheses and all.
  commit(root, { 'req/alpha.md': '# alpha\n\n- **R1** (T53; N1257; DEC-151 (2); row 15; amends R10, R12) *(not yet met: T53; per C3)* **Does x.** Test: x.\n- **R2** (T53; `jurisdictions` R41) *(not yet met: T53; PLATFORM)* does y.\n' });
  git(['branch', '-f', 'tranche', 'main'], { cwd: root });
  jobStart(root, 'alpha', { coordinator: 's', push: false, log: quiet });
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  commit(root, {
    'req/alpha.md': '# alpha\n\n- **R1** (T53; N1257; DEC-151 (2); row 15; amends R10, R12) **Does x.** Test: x.\n- **R2** (T53; `jurisdictions` R41) *(not yet met: T53; PLATFORM)* does y.\n',
    'test/alpha/x.test.mjs': "import test from 'node:test'; test('R1 x', () => {});\n",
    'src/alpha/x.mjs': 'export const x = 1;\n',
  });
  const run = (tests) => jobComplete(root, 'alpha', { push: false, tests, log: quiet });
  assert.throws(() => run([]), /struck R1 with no --test/);
  assert.throws(() => run(['R2=test/alpha/x.test.mjs::R1 x']), /no mark for R2 that this branch struck \(struck: R1\)/);
  assert.deepEqual(run(['R1=test/alpha/x.test.mjs::R1 x']).receipt.tests, [{ req: 'R1', file: 'test/alpha/x.test.mjs', name: 'R1 x' }]);
});

// Bob, 4 Nov: urgency in process3's initial release. A job's question to BOB waits at most
// decision_minutes, then goes once more to BOB and to ROOT; and the wake's send is the job's act
// (review of PR 72: "push to job/<id> only" forbade the state branch it writes).
test('the START: the escalation to ROOT after decision_minutes, its limits, and the wake as the job\'s act', () => {
  const e = entry('alpha', { title: 'Member sign-in and session handling', paths: ['src/alpha/', 'src/shared/alpha-client.mjs', 'worker/alpha/'], tests: ['test/alpha/', 'test/e2e/alpha.spec.mjs'] });
  const t = startText({ entry: e, slug: 'neobobkrause/civicsmith-copy', branch: 'job/alpha', tranche: 'tranche', coordinator: 'session_01RAN5ek9qx8mduYhfE77Ldc', bob: true, attempt: 1, reading: { files: [{ file: 'req/alpha.md', bytes: 100 }, { file: 'docs/alpha.md', bytes: 100 }], bytes: 200 }, rootId: 'session_01RAN5ek9qx8mduYhfE77Ldd', decisionMinutes: 30 });
  // The chain's last automatic step is the watcher, with the minutes unanswered (coordinator, 4 Nov).
  assert.ok(t.includes('No answer from BOB in 30 min: send it once more, then to ROOT `session_01RAN5ek9qx8mduYhfE77Ldd`, then the watcher, with the minutes, by send_message (`node .process/tool/p3.mjs address <role>`).'));
  assert.ok(t.includes('If reversible and in your module, act on your recommendation and note why in your PR; never a merge, a push off your branch, or what is not yours.'));
  assert.ok(t.includes('- the wake that job complete or block prints, and its send_message'));
  assert.ok(t.includes("pushing to any other branch yourself (the wake's send writes the state branch)"));
  assert.ok(Buffer.byteLength(t) <= 4096, `START ${Buffer.byteLength(t)} bytes`);
  const own = startText({ entry: { ...e, acts: ['only these'] }, slug: 'o/r', branch: 'job/alpha', tranche: 'tranche', coordinator: 's', attempt: 1, reading: { files: [], bytes: 0 } });
  assert.ok(own.includes('No answer from BOB in 30 min: send it once more, then to ROOT, then the watcher, with the minutes'), 'none addressed: address reads them');
  assert.ok(own.includes('- the wake that job complete or block prints'), 'an entry with its own acts keeps the wake');
});

test('a mark at the end of a requirement line, after its bold title, is struck like any other, and needs its --test', () => {
  const root = product();

// Corrie desk entered 10 lemons on the sheet.

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

// ===== file: checks.mjs (later part) =====

  return {
    refresh: { files, result: differ.length ? 'differs' : failed ? 'generated failed' : 'identical', differ, ...(untracked.length ? { untracked } : {}) },
    findings: differ.map((f) => F(f, exists(root, 'HEAD', f)
      ? `${f} is not what its regenerate writes from this commit: a plain pull request may change a generated file only to its regenerated bytes`
      // Untracked but not ignored at this commit (copy PR 557, 5 Nov: the removal was refused
      // and the finding did not say the ignore line was what it lacked).
      : `${f} is removed, but no .gitignore at this commit ignores it: to stop committing a generated file, add /${f} to the root .gitignore in the same pull request; otherwise a refresh changes a generated file only to its regenerated bytes`)),
  };
}

// A failed command's output (run 41883960626: its last five lines, joined, were node --test's
// summary and held none of the failure). The finding: its first failure line, else its last five
// lines. The log: of stdout and of stderr each, every failure line and the last 40 lines.
const FAILED = /^\s*(FAIL\b|not ok\b|!|✖|[A-Za-z]*Error\b)/;
const lines = (t) => String(t || '').trimEnd().split('\n');
const tail = (r) => [...lines(r.stdout), ...lines(r.stderr)].find((l) => FAILED.test(l))?.trim() || (r.stdout + r.stderr).trim().split('\n').slice(-5).join(' ');
const lastLines = (r) => ['stdout', 'stderr'].filter((k) => String(r[k] || '').trim()).map((k) => {
  const all = lines(r[k]);
  return `${k}, failure lines and last 40 lines:\n${all.filter((l, i) => i >= all.length - 40 || FAILED.test(l)).join('\n')}`;
}).join('\n');

// GAT-4: every row's regenerate command from the root, then the verify command of each row whose
// paths then differ from the commit (an install's prepare may have written them already). Product code: without the GitHub tokens, within one suite timeout in all.
