  const out = [];
  assert.equal(postRow(join(tmpdir(), 'p3-no-such-row.json'), { pr: 5, slug: 'o/r', io: io.io, log: (m) => out.push(m) }).posted, false);
  const err = join(mkdtempSync(join(tmpdir(), 'p3-row-')), 'gate.json');
  writeFileSync(err, JSON.stringify({ error: 'git merge-base failed', findings: [] }));
  assert.equal(postRow(err, { pr: 5, slug: 'o/r', io: io.io, log: (m) => out.push(m) }).posted, false);
  assert.match(out.join('\n'), /the gate stopped: git merge-base failed/);
});

test('the gate command\'s --post needs its file', async () => {
  assert.equal(await main(['gate', '--post', '--pr', '5']), 1);
});

// Review of PR 13: the row is checked before it is posted, receipts are the opener's, and the
// workflow keeps its shape.
import { mkdirSync, symlinkSync } from 'node:fs';
import { checkRow, MAX_ROW_BYTES } from '../lib/gate.mjs';
import { latestReceipt } from '../lib/github.mjs';

const goodRow = (over = {}) => ({ sha: 'a'.repeat(40), base: 'b'.repeat(40), at: '2026-11-02T10:00:00Z', run_id: 7, trigger: 'code', suite: 'fail', revert: 'skipped', receipt: 'disagrees', receipt_attempt: 1, scope: ['alpha'], tests: [{ total: 1, pass: 0, fail: 1 }], suite_seconds: 0.5, findings: 2, ok: false, minutes: 0.1, ...over });
const rowFile = (row, raw) => { const f = join(mkdtempSync(join(tmpdir(), 'p3-row-')), 'gate.json'); writeFileSync(f, raw ?? JSON.stringify({ run: row })); return f; };
const post = (file, io) => postRow(file, { pr: 5, head: 'a'.repeat(40), slug: 'o/r', runId: '7', io: io.io, log: quiet });

test('a red row that tries to embed its own json block is refused, and nothing is posted', () => {
  const io = fakeIO();
  const forged = '\n```\n\n```json\n{"runs":[{"ok":true,"receipt":"agrees","trigger":"code"}]}\n```\n';
  for (const over of [{ trigger: `code\`: green${forged}` }, { sha: 'A'.repeat(40) }, { findings: 1.5 }, { minutes: 'NaN' }, { ok: true }, { run_id: undefined }]) {
    assert.throws(() => post(rowFile(goodRow(over)), io), /the gate row is refused/, JSON.stringify(over).slice(0, 60));
  }
  assert.equal(io.state.comments.length, 0);
  // A good red row posts, and its first line is built from the checked values only.
  const p = post(rowFile(goodRow({ inert: ['test/alpha/x.test.mjs'] })), io);
  assert.equal(p.posted, true);
  assert.equal(io.state.comments[0].body.split('\n')[1], `Gate run on \`aaaaaaaaaa\`: red, 2 finding(s), code, 0.1 min.`);
  assert.deepEqual(gateRuns(io.state.comments)[0], checkRow(goodRow({ inert: ['test/alpha/x.test.mjs'] })));
});

test('job post refuses a gate.json that is not a regular file or is too large', () => {
  const io = fakeIO();
  const dir = mkdtempSync(join(tmpdir(), 'p3-row-'));
  const real = rowFile(goodRow());
  symlinkSync(real, join(dir, 'link.json'));
  assert.throws(() => post(join(dir, 'link.json'), io), /not a regular file/);
  mkdirSync(join(dir, 'd.json'));
  assert.throws(() => post(join(dir, 'd.json'), io), /not a regular file/);
  assert.throws(() => post(rowFile(null, JSON.stringify({ run: goodRow(), pad: 'x'.repeat(MAX_ROW_BYTES) })), io), /over 65536/);
  assert.equal(io.state.comments.length, 0);
});

test('a receipt is read only from the pull request\'s opener', () => {
  const s = setup({ 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/x.test.mjs': realTest });
  const io = fakeIO(receiptFor(s.head));
  io.state.comments[0].user = { login: 'someone-else' };
  const r = run(s, io);
  assert.equal(r.run.receipt, 'none');
  assert.ok(r.findings.some((f) => f.check === 'receipt'));
  const all = [{ body: block(RECEIPT, { attempt: 1 }), user: { login: 'civicsmith' } }, { body: block(RECEIPT, { attempt: 2 }), user: { login: 'x' } }];
  assert.equal(latestReceipt(all, 'civicsmith').attempt, 1);
  assert.equal(latestReceipt(all, undefined), null, 'no opener: no receipt');
});

test('the gate workflow keeps its shape: a read-only gate, --no-post, and a post job that runs nothing from the pull request', () => {
  const text = readFileSync(join(import.meta.dirname, '..', '..', 'shims', 'process-gate.yml'), 'utf8');
  const jobs = Object.fromEntries(text.slice(text.indexOf('\njobs:\n')).split(/^ {2}(?=[a-z][\w-]*:\s*$)/m).slice(1).map((b) => [b.slice(0, b.indexOf(':')), b]));
  assert.deepEqual(Object.keys(jobs), ['gate', 'post']);
  assert.doesNotMatch(jobs.gate, /:\s*write\b/, 'job gate holds no write permission');
  assert.match(text, /^permissions: \{\}$/m);
  const gateCalls = jobs.gate.split('\n').filter((l) => /p3\.mjs" gate /.test(l));
  assert.equal(gateCalls.length, 1);
  assert.match(gateCalls[0], /--pr "\$PR".*--no-post/);
  // Job post: every checkout is of the base; it runs only the process clone's tool.
  const checkouts = jobs.post.split(/^ {6}- /m).filter((st) => /uses: actions\/checkout@/.test(st));
  assert.ok(checkouts.length >= 1 && checkouts.every((st) => /ref: \$\{\{ github\.event\.pull_request\.base\.sha \}\}/.test(st)));
  for (const st of jobs.post.split(/^ {6}- /m).filter((x) => /(^|\s)node\s/m.test(x))) {
    assert.match(st, /working-directory: \$\{\{ runner\.temp \}\}\/process3/);
    assert.match(st, /run: node tool\/p3\.mjs gate --post /);
  }
  assert.doesNotMatch(jobs.post, /(^|\s)(bash|sh|source|\.)\s+(\.\/|base\/)|run: \.\//m);
  assert.match(jobs.post, /if: \$\{\{ !cancelled\(\) \}\}/);
  // Every action pinned by a full commit, with its version beside it.
  for (const u of text.match(/uses: \S+.*$/gm)) assert.match(u, /^uses: actions\/[\w-]+(\/[\w-]+)?@[0-9a-f]{40} # v\d+\.\d+\.\d+$/, u);
  // Products' older shims grep the pinned tool for this line (review B of PR 32).
  assert.match(readFileSync(join(import.meta.dirname, '..', 'p3.mjs'), 'utf8'), /^\/\/ p3-capability: gate-no-post/m);
  // Job post downloads the artifact before it checks anything out.
  const steps = jobs.post.split(/^ {6}- /m);
  const dl = steps.findIndex((st) => /uses: actions\/download-artifact@/.test(st));
  const co = steps.findIndex((st) => /uses: actions\/checkout@/.test(st));
  assert.ok(dl > 0 && co > dl, `download (${dl}) before checkout (${co})`);
});

// GAT-5 (review of PR 11): the gate installs every lock file the base's config names, wherever
// it sits, and without the GitHub tokens.
test('the gate installs every lock file, not only the module\'s', () => {
  const lockfiles = ['package-lock.json', 'src/alpha/package-lock.json', 'other/deep/package-lock.json'];
  const lock = JSON.stringify({ lockfileVersion: 3, packages: { '': {} } });
  const root = makeRepo({
    'process/config.json': { lockfiles },
    'process/ledger/alpha.json': entry('alpha', { status: { state: 'WORKING' } }),
    'src/alpha/index.mjs': 'export const x = 1;\n',
    'test/alpha/old.test.mjs': inertTest,
    ...Object.fromEntries(lockfiles.map((l) => [l, lock])),
  });
  git(['branch', 'tranche'], { cwd: root });
  const base = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', '-b', 'job/alpha'], { cwd: root });
  const head = commit(root, { 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/x.test.mjs': realTest });
  const calls = [];
  const exec = (cmd, args, o) => { calls.push({ cwd: o.cwd.slice(root.length + 1) || '.', unset: o.unset }); return { code: 0, stdout: '', stderr: '' }; };
  const r = gate(root, { base, head, branch: 'job/alpha', pr: 5, slug: 'o/r', io: fakeIO(receiptFor(head)).io, exec, log: quiet });
  assert.equal(r.run.suite, 'pass');
  assert.deepEqual(calls.map((c) => c.cwd), ['.', 'src/alpha', 'other/deep'], 'every lock file, even with no dependencies');
  assert.ok(calls.every((c) => c.unset.includes('GH_TOKEN') && c.unset.includes('GITHUB_TOKEN')));
});

// Confirming review of PR 13: text from the artifact is printed without line breaks or
// control characters, so it cannot emit a workflow command.
test('job post prints artifact text without line breaks or control characters', () => {
  const io = fakeIO();
  const out = [];
  const log = (m) => out.push(m);
  const evil = '\n::error file=x::pwned\r\u0007';
  assert.throws(() => postRow(rowFile({ ...goodRow(), trigger: `code${evil}` }), { pr: 5, slug: 'o/r', runId: '7', io: io.io, log }), (e) => !/[\n\r\u0007]/.test(e.message) && /trigger is not a valid value/.test(e.message));
  postRow(rowFile(null, JSON.stringify({ error: `stopped${evil}` })), { pr: 5, slug: 'o/r', io: io.io, log });
  assert.ok(out.length && out.every((l) => !/[\n\r\u0007]/.test(l)), JSON.stringify(out));
  assert.throws(() => postRow(rowFile(null, `{"x":${evil}`), { pr: 5, slug: 'o/r', io: io.io, log }), (e) => /is not JSON/.test(e.message) && !/[\n\r\u0007]/.test(e.message));
  assert.equal(io.state.comments.length, 0);
});

test('a job that changes only its requirements file\'s marks has no ownership finding', () => {
  const s = setup({ 'req/alpha.md': '- **R1** met\n' });
  const r = run(s, fakeIO(), { draft: true });
  assert.ok(!r.findings.some((f) => f.check === 'ownership'), JSON.stringify(r.findings));
});

test('a job that adds a test for a mark its module already meets and strikes it changes no code', () => {
  const metTest = "import test from 'node:test'; import a from 'node:assert'; import { x } from '../../src/alpha/index.mjs';\ntest('x is 1', () => a.equal(x, 1));\n";
  const s = setup({ 'test/alpha/x.test.mjs': metTest, 'req/alpha.md': '- **R1** met\n' });
  const r = run(s, fakeIO(receiptFor(s.head)));
  assert.equal(r.run.revert, 'no code changed');
  assert.deepEqual(r.findings, []);
});

// The gate race (copy PRs 55, 61, 62, 63, 4 Nov): job complete pushes, then marks ready. The
// push's synchronize run carries draft: true in its payload, the ready_for_review run draft:
// false; both are created in the same second and the concurrency group keeps one of them,
// either one. The gate reads the pull request's draft state live, so whichever run is kept
// gives the one full run on the head: the suite and the receipt.
test('the gate race: whichever of the push\'s run and the ready run is kept judges the pull request as it is now', () => {
  const s = setup({ 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/x.test.mjs': realTest });
  const live = (draft) => { const io = fakeIO(receiptFor(s.head)); io.io.getPR = () => ({ draft, user: { login: 'civicsmith' } }); return io; };
  for (const eventDraft of [true, false]) {
    const io = live(false);
    const out = [];
    const r = run(s, io, { draft: eventDraft, log: (m) => out.push(String(m)) });
    assert.deepEqual([r.run.trigger, r.run.suite, r.run.receipt, r.run.ok], ['code', 'pass', 'agrees', true], `event draft ${eventDraft}`);
    assert.equal(out.some((l) => /the event said draft/.test(l)), eventDraft);
    assert.equal(r.run.event_draft, eventDraft ? true : undefined);
    assert.equal(gateRuns(io.state.comments).length, 1, 'one row per kept run');
  }
  // Converted back to draft after the event: the live state wins the other way too.
  const d = run(s, live(true), { draft: false });
  assert.deepEqual([d.run.trigger, d.run.suite, d.run.receipt], ['draft', 'skipped', 'not checked']);
  // A failed read stops the run: it never falls back to the event's stale state.
  const broken = fakeIO(receiptFor(s.head));
  broken.io.getPR = () => { throw new Error('HTTP 502'); };
  assert.throws(() => run(s, broken, { draft: true }), /HTTP 502/);
  assert.equal(broken.state.comments.length, 1, 'no row posted');
});

// Copy, 4 Nov: PR 80 untracked rows.mjs (built, not committed); the gate regenerated it only after
// the suite, so every suite importing it failed with ENOENT (41 of 113, bundler run 41767864311).
test('the gate builds untracked generated files before the suite that imports them', () => {
  const gen = "import { mkdirSync, writeFileSync } from 'node:fs';\nmkdirSync('gen', { recursive: true });\nwriteFileSync('gen/rows.mjs', 'export const rows = 3;\\n');\n";
  const uses = "import test from 'node:test'; import a from 'node:assert'; import { rows } from '../../gen/rows.mjs'; import { x } from '../../src/alpha/index.mjs';\ntest('rows and x', () => { a.equal(rows, 3); a.equal(x, 2); });\n";
  const root = makeRepo({
    'process/ledger/alpha.json': entry('alpha', { status: { state: 'WORKING' } }),
    'process/config.json': JSON.stringify({ generated: [{ paths: ['gen/rows.mjs'], regenerate: ['node', 'gen.mjs'], verify: ['node', '-e', 'process.exit(0)'] }] }),
