  assert.equal(namedVerdict(c, 't/c.test.mjs::works'), 'fail');
  assert.equal(namedVerdict(g, 'test/c.test.mjs::x'), null);
  assert.equal(namedVerdict(null, 'test/a.test.mjs::x is 9'), null);
  assert.equal(passedByFile([{ passing: null, failing: null }]), null);
  // A named test that failed disagrees even where the suite's verdict agrees.
  assert.equal(receiptAgrees(undefined, 'base-red', [], []), true);
  // A name no test holds is not judged by the run.
  const p = setup({ 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/x.test.mjs': realTest });
  const ok = run(p, fakeIO({ ...receiptFor(p.head), commands: [], tests: [{ req: 'R1', file: 'test/alpha/x.test.mjs', name: 'x is 2' }, { req: 'R2', file: 'test/alpha/x.test.mjs', name: 'from' }] }));
  assert.deepEqual([ok.run.receipt, ok.run.receipt_tests, ok.findings], ['agrees', ['test/alpha/x.test.mjs::x is 2', 'test/alpha/x.test.mjs::from'], []]);
});

test('a ready job with no receipt is a finding; a draft runs only the fast checks', () => {
  const s = setup({ 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/x.test.mjs': realTest });
  assert.ok(run(s, fakeIO()).findings.some((f) => f.check === 'receipt'));
  const d = run(s, fakeIO(), { draft: true });
  assert.deepEqual([d.run.trigger, d.run.suite, d.findings.length], ['draft', 'skipped', 0]);
});

test('files outside the module are not the job\'s to change', () => {
  const s = setup({ 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/x.test.mjs': realTest, 'src/beta/b.mjs': 'x' });
  assert.ok(run(s, fakeIO(receiptFor(s.head))).findings.some((f) => f.check === 'ownership' && f.file === 'src/beta/b.mjs'));
});

test('record-only changes end in seconds: a records PR, and records since the last green run', () => {
  const s = setup({ 'process/metrics/alpha.jsonl': '{}\n' });
  const r = run(s, fakeIO());
  assert.deepEqual([r.run.trigger, r.run.suite, r.findings.length], ['record', 'skipped', 0]);

  const c = setup({ 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/x.test.mjs': realTest });
  const io = fakeIO(receiptFor(c.head));
  assert.equal(run(c, io).run.trigger, 'code');
  const head2 = commit(c.root, { 'process/metrics/alpha.jsonl': '{"row":"merge"}\n' });
  const r2 = gate(c.root, { base: c.base, head: head2, branch: 'job/alpha', pr: 5, slug: 'o/r', io: io.io, log: quiet });
  assert.deepEqual([r2.run.trigger, r2.run.after, r2.findings.length], ['record-since-green', c.head, 0]);
  assert.equal(gateRuns(io.state.comments).length, 2);
});

// Copy PR 247, 4 Nov: attempt 3 changed only process/ledger and process/metrics, its test
// already on the tranche from attempt 2. Every run on its head was "record", the receipt never
// checked (AUD-2), and merge refused it. A ready job's receipt with no green code run to stand on gets one.
test('a records-only job pull request with a receipt gets a code run whose receipt check agrees, and merges', () => {
  const s = setup({ 'process/metrics/alpha.jsonl': '{"row":"attempt","event":"complete","attempt":3}\n' });
  const io = fakeIO({ ...receiptFor(s.head), attempt: 3 });
  const said = [];
  const r = run(s, io, { log: (m) => said.push(m) });
  assert.deepEqual([r.run.trigger, r.run.scope, r.run.suite, r.run.revert, r.run.receipt, r.run.receipt_attempt, r.run.ok], ['code', ['alpha'], 'pass', 'no code changed', 'agrees', 3, true]);
  // Each module's own suite seconds (build ci-budget): status reads them against suite_timeout_minutes.
  assert.deepEqual(Object.keys(r.run.suite_by_module), ['alpha']);
  assert.equal(r.run.suite_by_module.alpha, r.run.suite_seconds);
  assert.ok(said.some((m) => /only records changed, but no green code run measured receipt attempt 3/.test(m)), said.join('\n'));
  assert.equal(unread(gateRuns(io.state.comments), s.head, 3), '');
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: s.root });
  git(['remote', 'add', 'origin', bare], { cwd: s.root });
  git(['push', '-q', 'origin', 'tranche', 'job/alpha', 'main'], { cwd: s.root });
  git(['checkout', '-q', 'main'], { cwd: s.root });
  let merged = null;
  const m = merge(s.root, 247, { slug: 'o/r', reviewed: 'test', rounds: 1, reviewMinutes: 5, findings: 0, actedOn: 0, log: quiet, io: {
    getPR: () => ({ state: 'open', draft: false, user: { login: 'civicsmith' }, base: { ref: 'tranche' }, head: { ref: 'job/alpha', sha: s.head } }),
    comments: () => io.state.comments,
    checkRun: () => ({ status: 'completed', conclusion: 'success' }),
    verify: io.io.verify,
    mergePR: (slug, n, sha) => { merged = sha; return { merged: true, sha: 'm'.repeat(40) }; },
  } });
  assert.equal(m.merged, true);
  assert.ok(merged);
  git(['checkout', '-q', 'job/alpha'], { cwd: s.root });
  // A title edit's next run on the same head stands on that code run: the fast path, still agreeing.
  const again = run(s, io);
  assert.deepEqual([again.run.trigger, again.run.after, again.run.receipt, again.run.ok], ['record-since-green', s.head, 'agrees', true]);
  // A draft, a job with no receipt yet (no finding on the record path), and a plain records-only pull request keep the record fast path.
  assert.equal(run(s, fakeIO({ ...receiptFor(s.head), attempt: 3 }), { draft: true }).run.trigger, 'record');
  const none = run(s, fakeIO());
  assert.deepEqual([none.run.trigger, none.run.receipt, none.findings], ['record', 'not checked', []]);
  const plain = run(s, fakeIO({ ...receiptFor(s.head), attempt: 3 }), { branch: 'build/notes' });
  assert.deepEqual([plain.run.trigger, plain.run.suite, plain.run.receipt, plain.findings.length], ['record', 'skipped', 'not checked', 0]);
});

// Findings from the review of PR 3.
test('a gate run posted by anyone but the bot, or edited, does not count', () => {
  const c = setup({ 'src/alpha/index.mjs': 'export const x = 3;\n', 'test/alpha/x.test.mjs': realTest });
  const forged = { runs: [{ sha: c.head, base: c.base, trigger: 'code', ok: true, receipt: 'agrees' }] };
  const io = fakeIO(receiptFor(c.head));
  io.state.comments.push({ id: 7, body: block(GATE, forged), user: { login: 'neobobkrause' } });
  io.state.comments.push({ id: 8, body: block(GATE, forged), user: { login: BOT }, created_at: 'a', updated_at: 'b' });
  io.state.comments.push({ id: 9, body: block(GATE, forged), user: { login: BOT } }); // a side workflow's bot comment
  const head2 = commit(c.root, { 'process/metrics/alpha.jsonl': '{}\n' });
  const r = gate(c.root, { base: c.base, head: head2, branch: 'job/alpha', pr: 5, slug: 'o/r', io: io.io, log: quiet });
  assert.equal(r.run.trigger, 'code');
  assert.equal(r.run.suite, 'fail');
});

test('the revert check restores the tree when the job deleted a file', () => {
  const root = makeRepo({
    'process/ledger/alpha.json': entry('alpha', { status: { state: 'WORKING' } }),
    'src/alpha/index.mjs': 'export const x = 1;\n',
    'src/alpha/old.mjs': 'export const old = 1;\n',
    'test/alpha/old.test.mjs': inertTest,
  });
  git(['branch', 'tranche'], { cwd: root });
  const base = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', '-b', 'job/alpha'], { cwd: root });
  git(['rm', '-q', 'src/alpha/old.mjs'], { cwd: root });
  const head = commit(root, { 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/x.test.mjs': realTest });
  const r = gate(root, { base, head, branch: 'job/alpha', pr: 5, slug: 'o/r', io: fakeIO(receiptFor(head)).io, log: quiet });
  assert.equal(r.run.revert, 'pass');
  assert.equal(git(['status', '--porcelain'], { cwd: root }), '');
  assert.equal(existsSync(join(root, 'src/alpha/old.mjs')), false);
});

test('a non-job pull request runs the suite of every module it touches', () => {
  const s = setup({ 'src/alpha/index.mjs': 'export const x = 3;\n', 'test/alpha/x.test.mjs': realTest });
  const r = gate(s.root, { base: s.base, head: s.head, branch: 'bob/setup', pr: 5, slug: 'o/r', io: fakeIO().io, log: quiet });
  assert.deepEqual([r.run.scope, r.run.suite], [['alpha'], 'fail']);
});

// Two jobs (setup audit, 2 Nov): job gate writes the row to its artifact only; job post posts it.
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { GATE_WORKFLOW, verifyRow } from '../lib/github.mjs';
import { postRow } from '../lib/gate.mjs';
import { main, report } from '../p3.mjs';

function twoJobs(over = {}) {
  const s = setup({ 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/x.test.mjs': realTest });
  const io = fakeIO(receiptFor(s.head));
  const was = process.env.GITHUB_RUN_ID;
  process.env.GITHUB_RUN_ID = '4242';
  let r;
  try { r = run(s, io, { post: false, ...over }); } finally { if (was === undefined) delete process.env.GITHUB_RUN_ID; else process.env.GITHUB_RUN_ID = was; }
  // What job gate uploads as the gate-row artifact: the --out file of the gate command.
  const file = join(mkdtempSync(join(tmpdir(), 'p3-row-')), 'gate.json');
  report(r.findings, file, { run: r.run });
  return { s, io, r, file };
}

test('job gate posts nothing; job post posts the artifact\'s row, and merge\'s verifyRow trusts it', () => {
  const { s, io, r, file } = twoJobs();
  assert.equal(r.run.ok, true);
  assert.equal(io.state.comments.length, 1, 'only the receipt: job gate posted no comment');
  const posted = postRow(file, { pr: 5, head: s.head, gateResult: 'success', slug: 'o/r', runId: '4242', io: io.io, log: quiet });
  assert.equal(posted.posted, true);
  const c = io.state.comments.at(-1);
  assert.equal(c.user.login, BOT);
  const rows = gateRuns(io.state.comments);
  assert.equal(rows.length, 1);
  assert.match(c.body, new RegExp(`Gate run on \`${s.head.slice(0, 10)}\`: green, code`));
  // The run is the process gate on the head, completed green, and its artifact is the same file.
  const actionsRun = { path: GATE_WORKFLOW, head_sha: s.head, status: 'completed', conclusion: 'success', event: 'pull_request', pull_requests: [{ number: 5, base: { ref: 'tranche' } }] };
  const art = JSON.parse(readFileSync(file, 'utf8')).run;
  assert.equal(rows[0].run_id, 4242);
  assert.equal(verifyRow('o/r', rows[0], { pr: 5, baseRef: 'tranche' }, { getRun: (slug, id) => (id === 4242 ? actionsRun : null), runArtifactRow: () => art }), true);
  // A copy of the row that changes what it tolerated is not this run's (review of PR 134).
  for (const k of ['base_red']) {
    assert.equal(verifyRow('o/r', { ...rows[0], [k]: [{ tests: ['t/a.test.mjs::x'] }] }, { pr: 5, baseRef: 'tranche' }, { getRun: (slug, id) => (id === 4242 ? actionsRun : null), runArtifactRow: () => art }), false, k);
  }
});

test('job post refuses a row that is not this run\'s, not this head\'s, or green when job gate was not', () => {
  const { s, io, file } = twoJobs();
  const q = { pr: 5, slug: 'o/r', io: io.io, log: quiet };
  assert.throws(() => postRow(file, { ...q, head: s.head, runId: '9' }), /names run 4242, not this run 9/);
  assert.throws(() => postRow(file, { ...q, head: 'f'.repeat(40), runId: '4242' }), /not the head ffffffffff/);
  assert.throws(() => postRow(file, { ...q, head: s.head, runId: '4242', gateResult: 'failure' }), /says green, but job gate ended failure/);
  assert.throws(() => postRow(file, { ...q, pr: null, runId: '4242' }), /needs --pr/);
  assert.equal(io.state.comments.length, 1, 'nothing posted');
});

test('job post posts a red row, and posts nothing when job gate wrote no row', () => {
  // A red row: the suite fails.
  const s = setup({ 'src/alpha/index.mjs': 'export const x = 3;\n', 'test/alpha/x.test.mjs': realTest });
  const io = fakeIO(receiptFor(s.head));
  const r = run(s, io, { post: false });
  const file = join(mkdtempSync(join(tmpdir(), 'p3-row-')), 'gate.json');
  report(r.findings, file, { run: { ...r.run, run_id: 7 } });
  const p = postRow(file, { pr: 5, head: s.head, gateResult: 'failure', slug: 'o/r', runId: '7', io: io.io, log: quiet });
  assert.equal(p.row.ok, false);
  assert.match(io.state.comments.at(-1).body, /red, 2 finding\(s\)/);

