// ===== file: session-call.test.mjs (continued) =====

  assert.match(out, /^working directory: the session's project directory .* is not inside .*only, the repository it works in: start each session with that one repository \(BD-R2\)/);
  assert.deepEqual(workdirLines(s, { env: { CLAUDE_PROJECT_DIR: `${s}-other` } }).length, 1, 'a sibling whose name starts the same is outside');
});

// ===== file: prompt-caps.test.mjs =====

// The caps on every prompt the tool prints (Build Plan, "Text to write, with caps"): the role
// prompts and a job's START are one screen, 4096 bytes; the review brief has no byte cap there,
// only its parts (objective, reading set, output format, boundaries, every gap in one pass).
// Measured 4 Nov: ROOT's prompt was 4248 bytes, over the cap, and only BOB's had a test.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SEED_ENTRY, entry, makeRepo, processRegisterFixture } from './helpers.mjs';
import { handoverBegin, recordStart, startRole } from '../lib/roles.mjs';
import { jobStart, startText } from '../lib/job.mjs';
import { briefText } from '../lib/review.mjs';
import { git } from '../lib/util.mjs';
import { STANDING_HEAD, promptBody } from '../lib/register.mjs';

processRegisterFixture([SEED_ENTRY]);

const quiet = () => {};
const SCREEN = 4096;
const SLUG = 'neobobkrause/civicsmith-copy';
const ID = 'session_01RAN5ek9qx8mduYhfE77Ldc';
const bytes = (t) => Buffer.byteLength(t);

function withOrigin() {
  const root = makeRepo({ 'README.md': 'x', 'process/config.json': { tranche: 'tranche' } });
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  return root;
}

test('start root, start bob (fresh and by handover) and start watcher each print one screen at most', () => {
  const root = withOrigin();
  const addr = { root: { session: ID } };
  const prompts = {
    root: startRole(root, 'root', { slug: SLUG, address: {}, log: quiet }).prompt,
    bob: startRole(root, 'bob', { slug: SLUG, address: addr, log: quiet }).prompt,
    watcher: startRole(root, 'watcher', { slug: SLUG, address: {}, log: quiet }).prompt,
  };
  recordStart(root, 'root', ID, { log: quiet });
  recordStart(root, 'bob', 'session_oldbob1', { log: quiet });
  prompts['bob by handover'] = handoverBegin(root, { slug: SLUG, log: quiet }).prompt;
  assert.ok(prompts['bob by handover'].includes('You replace BOB `session_oldbob1`'));
  for (const [role, p] of Object.entries(prompts)) {
    assert.match(p, /--approvals [0-9a-f]{64}/, `${role}: measured with a real approvals hash`);
    // The prompt is one screen; the standing block after it (register.mjs) has its own cap.
    assert.ok(bytes(promptBody(p)) <= SCREEN, `${role}: ${bytes(promptBody(p))} bytes, over ${SCREEN}`);
  }
  // The fixture's entry names BOB, not ROOT.
  for (const role of ['bob', 'bob by handover']) assert.ok(prompts[role].includes(STANDING_HEAD), role);
  assert.ok(!prompts.root.includes(STANDING_HEAD));
});

test('a job START with a typical entry is one screen at most', () => {
  const e = entry('alpha', {
    title: 'Member sign-in and session handling',
    paths: ['src/alpha/', 'src/shared/alpha-client.mjs', 'worker/alpha/'],
    tests: ['test/alpha/', 'test/e2e/alpha.spec.mjs'],
    reading: ['req/alpha.md', 'docs/alpha.md'],
    prior_work: 'an earlier attempt left a half-written handler in src/alpha/index.mjs; keep what passes its tests.',
  });
  const root = makeRepo({
    'process/ledger/alpha.json': e,
    'req/alpha.md': '# alpha\n\n- [ ] R1 signs a member in.\n- [ ] R2 ends a session.\n',
    'docs/alpha.md': '# alpha\n\nNotes.\n',
    'test/alpha/a.test.mjs': "import test from 'node:test'; test('ok', () => {});\n",
  });
  git(['branch', 'tranche'], { cwd: root });
  const { start } = jobStart(root, 'alpha', { coordinator: ID, push: false, log: quiet });
  assert.ok(bytes(start) <= SCREEN, `START: ${bytes(start)} bytes, over ${SCREEN}`);
});

test('the review brief carries its parts: objective, reading set, boundaries, output with every gap in one pass', () => {
  const t = briefText({ pr: { number: 60, title: 'Prompt caps', base: { ref: 'tranche' }, head: { ref: 'build/prompt-caps', sha: 'f'.repeat(40) } }, files: ['tool/lib/roles.mjs'], job: null, owner: 'neobobkrause', approvalsFile: 'CLAUDE.md' });
  for (const part of ['# Review brief: pull request 60', 'Read your rulebook', 'Changed files (1):', '## You are read-only', '## Output', 'Every gap in one pass']) assert.ok(t.includes(part), part);
});

// Second review of PR 72: the escalation and the wake pushed a replacement session's START, the one
// the urgency work starts more often, over the screen. Restart with a provider notice, real ids.
test('a replacement or taken-in job START with two provider notices and the escalation to ROOT and the watcher is one screen at most', () => {
  const e = entry('alpha', { title: 'Member sign-in and session handling', paths: ['src/alpha/', 'src/shared/alpha-client.mjs', 'worker/alpha/'], tests: ['test/alpha/', 'test/e2e/alpha.spec.mjs'], reading: ['req/alpha.md', 'docs/alpha.md'], requirements: 'req/alpha.md' });
  const notices = [{ key: 'beta:41', provider: 'beta', ids: ['R2', 'R5'], pr: 41 }, { key: 'gamma:52', provider: 'gamma', ids: ['R1'], pr: 52 }];
  const base = { entry: e, slug: SLUG, branch: 'job/alpha', tranche: 'tranche', coordinator: ID, bob: true, attempt: 1, reading: { files: [{ file: 'req/alpha.md', bytes: 61 }, { file: 'docs/alpha.md', bytes: 16 }], bytes: 77 }, notices, rootId: ID, decisionMinutes: 30 };
  const cases = {
    restart: { restart: { why: 'its session was archived', pr: `https://github.com/${SLUG}/pull/123`, last: 'abc1234 work in progress', receipt: 'none posted (WORKING)' } },
    'take-in': { takeIn: { pr: 88, branch: 'feature/alpha', commits: ['a'.repeat(40), 'b'.repeat(40)] } },
  };
  for (const [name, c] of Object.entries(cases)) {
    const t = startText({ ...base, ...c });
    assert.ok(t.includes('then the watcher'));
    assert.ok(t.includes('`gamma:52`') && !t.includes('--test notice:'));
    assert.ok(bytes(t) <= SCREEN, `${name} START: ${bytes(t)} bytes, over ${SCREEN}`);
  }
});

// ===== file: temp-cleanup.test.mjs =====

// Copy, 4 Nov: merge left its scratch tree (about 690 MB) on every run; 110 of them filled BOB's
// disk. Every scratch directory in tool/lib comes from withTemp, removed on every way out, with
// any worktree under it removed and pruned; a killed run's leftovers go at the next withTemp.
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, symlinkSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { once } from 'node:events';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { BOT, GATE, RECEIPT, block } from '../lib/github.mjs';
import { merge } from '../lib/merge.mjs';
import { writeState } from '../lib/state.mjs';
import { TEMP_OWNER, TEMP_STALE_HOURS, git, sweepTemp, withTemp } from '../lib/util.mjs';
import { commit, entry, makeRepo } from './helpers.mjs';

const LIB = join(dirname(fileURLToPath(import.meta.url)), '..', 'lib');

// Each case with a TMPDIR of its own, so what is left in it is the case's alone.
function scratch(fn) {
  const was = process.env.TMPDIR;
  const t = mkdtempSync(join(tmpdir(), 'p3-tmpdir-'));
  process.env.TMPDIR = t;
  try { return fn(t); } finally { if (was === undefined) delete process.env.TMPDIR; else process.env.TMPDIR = was; }
}
const left = (t, prefix) => readdirSync(t).filter((n) => n.startsWith(prefix));
// The test's own repositories also live in TMPDIR.
const scratchOnly = (t) => readdirSync(t).filter((n) => !/^p3-(test|origin)-/.test(n)).sort();
const worktrees = (root) => {
  const d = join(root, '.git', 'worktrees');
  return { listed: git(['worktree', 'list', '--porcelain'], { cwd: root }).split('\n').filter((l) => l.startsWith('worktree ')).length, entries: existsSync(d) ? readdirSync(d) : [] };
};

function setup() {
  const root = makeRepo({ 'process/ledger/alpha.json': entry('alpha') });
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['checkout', '-q', '-b', 'job/alpha'], { cwd: root });
  const head = commit(root, { 'src/alpha/a.mjs': 'x', 'process/metrics/alpha.jsonl': JSON.stringify({ row: 'attempt', event: 'complete', at: new Date().toISOString() }) + '\n' });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  commit(root, { 'other.txt': 'tranche moved on' });
  git(['push', '-q', 'origin', 'tranche', 'job/alpha', 'main'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  return { root, head };
}
const io = (head, mergePR) => ({
  getPR: () => ({ state: 'open', draft: false, user: { login: 'civicsmith' }, base: { ref: 'tranche' }, head: { ref: 'job/alpha', sha: head } }),
  comments: () => [
    { id: 1, body: block(RECEIPT, { module: 'alpha', attempt: 1, sha: head }), user: { login: 'civicsmith' } },
    { id: 2, body: block(GATE, { runs: [{ sha: head, ok: true, receipt: 'agrees', receipt_attempt: 1, run_id: 11 }] }), user: { login: BOT } },
  ],
  checkRun: () => ({ status: 'completed', conclusion: 'success', html_url: 'run' }),
  verify: (slug, r) => r.run_id === 11,
  mergePR,
});
const opts = (head, mergePR) => ({ slug: 'o/r', io: io(head, mergePR), reviewed: 'fresh worker', rounds: 1, reviewMinutes: 5, findings: 0, actedOn: 0, log: () => {}, wait: 0 });

for (const [name, mergePR, expect] of [
  ['succeeds', () => ({ merged: true, sha: 'm'.repeat(40) }), null],
  ['is refused', () => ({ merged: false, message: 'not mergeable' }), /GitHub did not merge/],
  ['throws mid-way', () => { throw new Error('boom mid-merge'); }, /boom mid-merge/],
]) {
  test(`a merge that ${name} leaves no p3-merge-* directory and no worktree entry`, () => scratch((t) => {
    const { root, head } = setup();
    const go = () => merge(root, 3, opts(head, mergePR));
    if (expect) assert.throws(go, expect); else assert.equal(go().merged, true);
    assert.deepEqual(left(t, 'p3-merge-'), []);
    assert.deepEqual(worktrees(root), { listed: 1, entries: [] });
  }));
}

test('a state write, done or failed inside its change, leaves no p3-state-* directory and no worktree entry', () => scratch((t) => {
  const root = makeRepo({ 'README.md': 'x' });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'main'], { cwd: root });
  writeState(root, 'process-state', 'a row', (wt) => writeFileSync(join(wt, 'a.txt'), 'a'));
  assert.throws(() => writeState(root, 'process-state', 'no row', () => { throw new Error('change failed'); }), /change failed/);
  assert.deepEqual(left(t, 'p3-state-'), []);
  assert.deepEqual(worktrees(root), { listed: 1, entries: [] });
}));

test('withTemp removes its directory on return and on throw, worktree and its entry with it', () => scratch((t) => {
  const root = makeRepo({ 'README.md': 'x' });
  let seen;
  assert.throws(() => withTemp('p3-layer-', (d) => {
    seen = d;
    git(['worktree', 'add', '-q', '--detach', join(d, 'w'), 'HEAD'], { cwd: root });
