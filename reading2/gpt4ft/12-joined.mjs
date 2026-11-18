// ===== file: review-trigger-fixes.test.mjs (continued) =====

  merge(same.root, 173, { slug: 'o/r', io: io(same.head), ...reviewed, log: quiet });
  assert.equal(originRows(same.root).filter((r) => r.row === 'triggers').length, 0);
  const differ = setup((r) => commit(r, { 'src/alpha/acts.mjs': 'export const ACTS = ["a"];\n' }), { rows: [...base, { ...old, triggers: [], tool: 'abc' }] });
  merge(differ.root, 173, { slug: 'o/r', io: io(differ.head), ...reviewed, log: quiet });
  assert.match(originRows(differ.root).find((r) => r.row === 'triggers').why, /recorded none when prepared \(tool abc\); judged again at the land/);
  // Nothing else to commit (the head already holds the tranche): the head is not moved for the record;
  // the merge says it and returns it, and lands.
  const held = setup((r) => commit(r, { 'src/alpha/acts.mjs': 'export const ACTS = ["a"];\n' }), { rows: [...base, old] });
  git(['checkout', '-q', 'job/alpha'], { cwd: held.root });
  git(['merge', '-q', '--no-edit', 'tranche'], { cwd: held.root });
  const top = git(['rev-parse', 'HEAD'], { cwd: held.root });
  git(['push', '-q', 'origin', 'job/alpha'], { cwd: held.root });
  git(['checkout', '-q', 'main'], { cwd: held.root });
  const said = [];
  const h = merge(held.root, 173, { slug: 'o/r', io: io(top), ...reviewed, log: (l) => said.push(l) });
  assert.deepEqual([h.merged, h.tip, h.rejudged.triggers, h.rejudged.written], [true, top, ['security'], false]);
  assert.ok(said.some((l) => /judged at the land, not written to the head/.test(l)), said.join('\n'));
  // A fresh merge row names the tool that wrote it.
  const fresh = setup((r) => commit(r, { 'src/alpha/a.mjs': 'export const f = () => 46;\n' }));
  merge(fresh.root, 7, { slug: 'o/r', io: io(fresh.head), noReview: 'a constant', log: quiet });
  assert.match(originRows(fresh.root).find((r) => r.row === 'merge').tool, /^[0-9a-f]{40}$|^unknown$/);
});

// ===== file: suite.mjs =====

// A module's own suite (GAT-2): the entry's command over the entry's test files, nothing else.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, posix, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { NO_TOKENS, run, underPath } from './util.mjs';

export const suffixOf = (entry) => entry.suite.test_suffix || '.test.mjs';

function walk(dir, out) {
  if (!existsSync(dir)) return out;
  if (statSync(dir).isFile()) { out.push(dir); return out; }
  for (const n of readdirSync(dir).sort()) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}

// Every file under the entry's test paths, and the test files among them, relative to the root.
export const testTreeFiles = (root, entry) => entry.tests.flatMap((t) => walk(join(root, t), [])).map((p) => relative(root, p));
export function testFiles(root, entry) {
  const suffix = suffixOf(entry);
  return testTreeFiles(root, entry).filter((p) => p.endsWith(suffix));
}

// Node's test runner prints "ℹ tests N" (spec) or "# tests N" (tap) at the end.
export function counts(text) {
  const get = (k) => { const m = text.match(new RegExp(`^(?:ℹ|#) ${k} (\\d+)`, 'm')); return m ? Number(m[1]) : null; };
  return { total: get('tests'), pass: get('pass'), fail: get('fail') };
}

// Runs the suite over the given files (default: all of the entry's). Files are root-relative.
// Product code never gets the GitHub or Actions tokens (NO_TOKENS); every other variable stays,
// since a module's tests may use them (Bob, 2 Nov, before the log; unverified: deploy tokens are a standard condition).
// opts.events: a file the failing tests are written to by fail-reporter.mjs (base-red), beside
// the TAP the runner prints, when the command is the node test runner naming no reporter.
export const REPORTER = join(dirname(fileURLToPath(import.meta.url)), 'fail-reporter.mjs');
export const reportsEvents = (command) => /(^|\/)node$/.test(command[0]) && command.includes('--test') && !command.some((a) => a.startsWith('--test-reporter'));
export function runSuite(root, entry, files = testFiles(root, entry), opts = {}) {
  const cwd = join(root, entry.suite.cwd);
  const events = opts.events && reportsEvents(entry.suite.command)
    ? ['--test-reporter=tap', '--test-reporter-destination=stdout', `--test-reporter=${pathToFileURL(REPORTER).href}`, `--test-reporter-destination=${opts.events}`] : [];
  const own = entry.suite.command.slice(1);
  const at = own.indexOf('--test') + 1; // the reporter flags right after --test, before any pattern
  const args = [...own.slice(0, at), ...events, ...own.slice(at), ...files.map((f) => relative(cwd, join(root, f)))];
  const shown = [entry.suite.command[0], ...args.filter((a) => !events.includes(a))].join(' ');
  if (!files.length) return { cmd: shown, cwd: entry.suite.cwd, exit: 1, seconds: 0, tests: { total: 0, pass: 0, fail: 0 }, output: 'no test files' };
  // A suite run from inside another test run must not report to the outer runner.
  const r = run(entry.suite.command[0], args, { cwd, timeout: opts.timeout, unset: ['NODE_TEST_CONTEXT', ...NO_TOKENS] });
  const output = r.stdout + r.stderr;
  const ev = events.length ? readResults(opts.events, root) : null;
  return {
    cmd: shown, cwd: entry.suite.cwd, exit: r.code, seconds: r.seconds, tests: counts(output), output, timedOut: r.timedOut === true,
    failing: ev && ev.failing, passing: ev && ev.passing, reported: ev && ev.reported, whole: ev && ev.whole, ran: ev && ev.ran, load: ev && ev.load,
  };
}

// fail-reporter.mjs's lines: { failing, passing: [{ file, name }], reported, whole: [file] }, file
// relative to root, name the enclosing names and the test's joined by " > " (a ">" inside a name
// escaped as "\>"), suites left out of the lists but their files reported. reported: every file
// a result came from, so a file the run never reached is told from one whose tests passed;
// whole: the files that failed as a whole (a load failure or an early exit), still in failing. null
// when the file is missing or a line cannot be read. ran: { file: ok } for each test file the
// runner finished, its verdict as its exit code alone would give it; load: the files whose output
// or failures show a module that could not load (the reporter's done and load lines, which are no
// test's result and are in no other list).
export function readResults(file, root) {
  let text;
  try { text = readFileSync(file, 'utf8'); } catch { return null; }
  const failing = [];
  const passing = [];
  const reported = new Set();
  const whole = new Set();
  const ran = {};
  const load = new Set();
  for (const l of text.split('\n').filter(Boolean)) {
    let e;
    try { e = JSON.parse(l); } catch { return null; }
    if (!e || !Array.isArray(e.path) || !e.path.length || !e.path.every((x) => typeof x === 'string')) return null;
    const f = typeof e.file === 'string' ? (isAbsolute(e.file) ? relative(root, e.file) : e.file).split('\\').join('/') : '(unknown)';
    if (e.done === true) { ran[f] = e.ok === true && ran[f] !== false; continue; }
    if (e.load === true) { load.add(f); continue; }
    reported.add(f);
    if (e.whole === true && e.ok !== true) whole.add(f);
    if (e.type === 'suite') continue;
    (e.ok === true ? passing : failing).push({ file: f, name: e.path.map((x) => x.replace(/\\/g, '\\\\').replace(/>/g, '\\>')).join(' > ') });
  }
  return { failing, passing, reported: [...reported], whole: [...whole], ran, load: [...load] };
}
export const readFailing = (file, root) => readResults(file, root)?.failing ?? null;

// GAT-5: lock files installed where they sit, without the GitHub tokens. The gate
// installs every lock file on its fresh checkout; `test` and `job complete` install their
// module's, when they are stale.

// Paths compared as written in config and ledger: slashes, no leading ./, "." for the root
// (review of PR 11).
export const normPath = (p) => {
  const s = posix.normalize(String(p).replace(/\\/g, '/')).replace(/^(\.\/)+/, '').replace(/\/+$/, '');
  return s === '' || s === '.' ? '.' : s;
};

// The lock files a module needs: those whose directory holds one of its paths or tests, or
// sits under one.
export function moduleLocks(lockfiles, entry) {
  const own = [...entry.paths, ...entry.tests].map(normPath);
  return lockfiles.filter((lock) => {
    const d = posix.dirname(normPath(lock));
    return d === '.' || own.some((p) => p === '.' || underPath(p, d) || underPath(d, p));
  });
}

// Freshness (review of PR 11): a successful install leaves the lock file's hash in
// node_modules; the install is fresh while the hash matches. A lock with no dependencies has
// nothing to install.
export const MARK = '.p3-lock-hash';
const lockHash = (text) => createHash('sha256').update(text).digest('hex');
const markFile = (root, lock) => join(root, posix.dirname(normPath(lock)), 'node_modules', MARK);
function noDependencies(text) {
  try {
    const l = JSON.parse(text);
    const pk = l.packages ? Object.keys(l.packages).filter((k) => k !== '') : null;
    return pk ? pk.length === 0 : !l.dependencies || !Object.keys(l.dependencies).length;
  } catch { return false; }
}
// The lock file's place in the checkout, from its normalised path (confirming review of PR 11).
const lockAt = (root, lock) => join(root, normPath(lock));
export function stale(root, lock) {
  const text = readFileSync(lockAt(root, lock), 'utf8');
  if (noDependencies(text)) return false;
  const m = markFile(root, lock);
  return !existsSync(m) || readFileSync(m, 'utf8').trim() !== lockHash(text);
}

export function install(root, lockfiles, { onlyStale = false, exec = run } = {}) {
  const findings = [];
  const ran = [];
  for (const lock of lockfiles) {
    const at = (message) => ({ check: 'install', file: lock, line: 1, message });
    if (!existsSync(lockAt(root, lock))) { findings.push(at('lock file not found')); continue; }
    if (onlyStale && !stale(root, lock)) continue;
    ran.push(lock);
    const text = readFileSync(lockAt(root, lock), 'utf8');
    const r = exec('npm', ['ci', '--no-audit', '--no-fund', '--loglevel=error'], { cwd: join(root, posix.dirname(normPath(lock))), unset: NO_TOKENS });
    if (r.code !== 0) { findings.push(at(`npm ci failed: ${r.stderr.trim().split('\n').slice(-3).join(' ')}`)); continue; }
    mkdirSync(join(markFile(root, lock), '..'), { recursive: true });
    writeFileSync(markFile(root, lock), lockHash(text) + '\n');
  }
  return { findings, ran };
}

// ===== file: state.test.mjs =====

// Build L: status for BOB, the one-screen handoff and numbered messages on the state branch.
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { addressFile, handoff, outcome, readState, send, undelivered } from '../lib/state.mjs';
import { status } from '../lib/status.mjs';
import { Fail, git } from '../lib/util.mjs';
import { commit, entry, makeRepo, write } from './helpers.mjs';
import { main } from '../p3.mjs';

const quiet = () => {};
const SB = 'process-state';

function withOrigin(files = { 'CLAUDE.md': '# Product\n' }) {
  const root = makeRepo(files);
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  git(['branch', '-q', '--set-upstream-to', 'origin/tranche'], { cwd: root });
  return { root, bare };
}

test('send: numbers per sender, pushes before printing, reads the address, records outcomes', () => {
  const { root, bare } = withOrigin();
  const out = [];
  const a = send(root, SB, { from: 'bob', to: 'job-x', text: 'go', log: (l) => out.push(l) });
  assert.equal(a.n, 1);
  assert.equal(a.address, null);
  assert.match(out.join('\n'), /MSG bob-1 to job-x: go[\s\S]*no address for job-x/);
  // Pushed: origin's state branch holds the message.
  assert.match(git(['show', `${SB}:messages/bob.jsonl`], { cwd: bare }), /"n":1/);
  // Another sender's counter is its own; an address written (by build K) is read at send time.
  const other = makeRepo();
  git(['remote', 'add', 'origin', bare], { cwd: other });
  git(['fetch', '-q', 'origin', SB], { cwd: other });
  git(['checkout', '-q', '-b', 's', 'FETCH_HEAD'], { cwd: other });
  commit(other, { [addressFile('job-x')]: { session: 'session_abc' } }, 'address');
  git(['push', '-q', 'origin', `HEAD:${SB}`], { cwd: other });
  assert.equal(send(root, SB, { from: 'root', to: 'job-x', text: 'one', log: quiet }).n, 1);
  const b = send(root, SB, { from: 'bob', to: 'job-x', text: 'two', log: quiet });
  assert.equal(b.n, 2);
  assert.equal(b.address, 'session_abc');
  assert.deepEqual(undelivered(root, SB).map((m) => `${m.from}-${m.n}`).sort(), ['bob-1', 'bob-2', 'root-1']);
  outcome(root, SB, { from: 'bob', n: 1, result: 'delivered', log: quiet });
  outcome(root, SB, { from: 'bob', n: 2, result: 'failed', log: quiet });
  assert.deepEqual(undelivered(root, SB).map((m) => `${m.from}-${m.n}:${m.outcome}`).sort(), ['bob-2:failed', 'root-1:null']);
  assert.throws(() => outcome(root, SB, { from: 'bob', n: 9, result: 'delivered', log: quiet }), /sent no message 9/);
  assert.throws(() => send(root, SB, { from: 'bob', to: '../x', text: 'y', log: quiet }), Fail);
  // Unpushed work stops the send: the record goes first.
  commit(root, { 'a.txt': 'x' });
  assert.throws(() => send(root, SB, { from: 'bob', to: 'job-x', text: 'z', log: quiet }), /not pushed/);
  git(['push', '-q'], { cwd: root });
  write(root, { 'CLAUDE.md': 'changed' });
  assert.throws(() => send(root, SB, { from: 'bob', to: 'job-x', text: 'z', log: quiet }), /uncommitted/);
  git(['checkout', '-q', 'CLAUDE.md'], { cwd: root });
  git(['checkout', '-q', '-b', 'local'], { cwd: root });
  assert.throws(() => send(root, SB, { from: 'bob', to: 'job-x', text: 'z', log: quiet }), /not on origin/);
  assert.throws(() => send(root, SB, { to: 'job-x', text: 'z', log: quiet }), /--from/);
});

test('handoff: one screen from status, on the state branch, refused when too long', () => {
  const { root } = withOrigin({ 'CLAUDE.md': '# Product\n', 'process/ledger/a.json': entry('a', { status: { state: 'BLOCKED', reason: 'needs Bob' } }) });
  git(['push', '-q', 'origin', 'HEAD:tranche'], { cwd: root });
  send(root, SB, { from: 'bob', to: 'job-a', text: 'hi', log: quiet });
  const lines = [];
  const s = status(root, { role: 'bob', context: 72, log: (l) => lines.push(l), io: { openPRs: () => [], checkRun: () => null } });
  const text = lines.join('\n');
  assert.match(text, /blocked:\n- a: BLOCKED/);
  assert.match(text, /undelivered messages:\n- bob-1 to job-a/);
  assert.match(text, /context 72% of the window: REFRESH \(threshold 60%\)/);
  assert.match(text, /reading set for bob: \d+ bytes; CLAUDE.md 10/);
  const h = handoff(root, SB, { tranche: s.tranche, lines, notes: ['watch a'], log: quiet });
  git(['fetch', '-q', 'origin', SB], { cwd: root });
  assert.equal(readState(root, SB, 'handoff/bob.md'), h.text);
  const again = [];
  status(root, { role: 'bob', log: (l) => again.push(l), io: { openPRs: () => [], checkRun: () => null } });
  assert.match(again.join('\n'), /process-state:handoff\/bob.md \d+/);
  assert.throws(() => status(root, { role: 'bob', context: 'high', offline: true, log: quiet }), /a number/);
  assert.throws(() => handoff(root, SB, { tranche: s.tranche, lines, notes: Array(6).fill('n'), log: quiet }), /at most 5/);
});

test('handoff: the size test measures the notes; a long status is capped by the screen rule, never a refusal', () => {
  const { root } = withOrigin({ 'CLAUDE.md': '# Product\n' });
  git(['push', '-q', 'origin', 'HEAD:tranche'], { cwd: root });
  // The copy's shape, 4 Nov: status about 140 lines; every note length was refused.
  const lines = Array.from({ length: 140 }, (_, i) => `- notice line ${i + 1}`);
  const h = handoff(root, SB, { tranche: 'HEAD', lines, notes: ['short note', 'a second note'], log: quiet });
  const count = h.text.split('\n').length - 1;
  assert.ok(count <= 40 && Buffer.byteLength(h.text) <= 4096, `${count} lines`);
  assert.ok(h.shown > 0 && h.shown < 140);
  assert.match(h.text, new RegExp(`\\(${140 - h.shown} more status lines: status --role bob lists them all\\)`));
  assert.match(h.text, /notes:\n- short note\n- a second note\n$/);
  assert.match(h.text, /- notice line 1\n/);
  git(['fetch', '-q', 'origin', SB], { cwd: root });
  assert.equal(readState(root, SB, 'handoff/bob.md'), h.text);
  // A status that fits is written whole, with no pointer line.
  const whole = handoff(root, SB, { tranche: 'HEAD', lines: lines.slice(0, 5), notes: ['n'], log: quiet });
  assert.equal(whole.shown, 5);
  assert.doesNotMatch(whole.text, /more status line/);
  // Notes that alone fill the screen are refused, by their own size, and nothing is written.
  const tip = readState(root, SB, 'handoff/bob.md');
  assert.throws(() => handoff(root, SB, { tranche: 'HEAD', lines, notes: Array(5).fill('x'.repeat(900)), log: quiet }), /the notes are 7 lines, \d+ bytes; .*shorten the notes/);
  git(['fetch', '-q', 'origin', SB], { cwd: root });
  assert.equal(readState(root, SB, 'handoff/bob.md'), tip);
});

test('status --role bob: owed, idle and open, with last activity; merged as a count', () => {
  const { root } = withOrigin({
    'CLAUDE.md': '# Product\n',
    'process/ledger/r.json': entry('r', { status: { state: 'WORKING' } }),
    'process/ledger/q.json': entry('q', { status: { state: 'WORKING' } }),
    'process/ledger/m.json': entry('m', { status: { state: 'COMPLETE' } }),
  });
  git(['push', '-q', 'origin', 'HEAD:tranche'], { cwd: root });
  const old = new Date(Date.now() - 5 * 36e5).toISOString();
  const prs = [
    { number: 7, draft: false, head: { ref: 'job/r', sha: 'a' }, updated_at: new Date().toISOString() },
    { number: 8, draft: true, head: { ref: 'job/q', sha: 'b' }, updated_at: old },
    { number: 9, draft: false, head: { ref: 'build/x', sha: 'c' }, updated_at: old },
  ];
  const lines = [];
  status(root, { role: 'bob', offline: false, log: (l) => lines.push(l), io: { openPRs: () => prs, prFiles: () => ['README.md'], checkRun: (s, sha) => ({ conclusion: sha === 'a' ? 'success' : 'failure' }) } });
  const t = lines.join('\n');
  assert.match(t, /owed:\n- r: .*PR #7 ready, last activity 0h ago; gate success; merge owed/);
  assert.match(t, /idle:\n- q: .*PR #8 draft, last activity 5h ago/);
  assert.match(t, /merged: 1/);
  assert.match(t, /to take in:\n- #9 build\/x: no single module; leave it as a plain pull request, or BOB splits it, last activity 5h ago/);
});

test('send: unquoted text is refused, not cut to its first word', async () => {
  const { root } = withOrigin();
  const cwd = process.cwd();
  const errs = [];
  const err = console.error;
  console.error = (m) => errs.push(m);
  try { process.chdir(root); assert.equal(await main(['send', 'job-x', 'merge', 'your', 'PR', '--from', 'bob']), 1); } finally { process.chdir(cwd); console.error = err; }
  assert.match(errs.join('\n'), /the text in quotes/);
});

test('send to bob leads with job start --ready when jobs are ready, so BOB starts them on whatever wake comes first; a count unread or zero leaves the text', () => {
  const { root, bare } = withOrigin();
  const out = [];
  send(root, SB, { from: 'job-x', to: 'bob', text: 'job x complete, PR #3 ready: run status', ready: () => 2, log: (l) => out.push(l) });
  assert.match(out[0], /^MSG job-x-1 to bob: first: node \.process\/tool\/p3\.mjs job start --ready --live <n> \(2 jobs ready\)\. Then: job x complete, PR #3 ready: run status/);
  assert.match(git(['show', `${SB}:messages/job-x.jsonl`], { cwd: bare }), /"text":"first: node \.process\/tool\/p3\.mjs job start --ready/);
  const o2 = [];
  send(root, SB, { from: 'job-x', to: 'bob', text: 'two', ready: () => 0, log: (l) => o2.push(l) });
  assert.match(o2[0], /^MSG job-x-2 to bob: two$/m);
  const o3 = [];
  send(root, SB, { from: 'job-x', to: 'bob', text: 'three', ready: () => { throw new Error('offline'); }, log: (l) => o3.push(l) });
  assert.match(o3[0], /^MSG job-x-3 to bob: three$/m);
});

// ===== file: ghaudit.test.mjs =====

// p3 github audit (R17c; Bob, 6 Nov: does all GitHub traffic go through the pacing and get tracked?).
// GitHub's own evidence (stubbed gh) against the ledger (this clone's log here).
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { auditRepos, githubAudit } from '../lib/ghaudit.mjs';
import { ghAfter, ghRepo, PACING_DEFAULTS, pushRepo, pushTurn, slugOf, useShared } from '../lib/pace.mjs';
import { git } from '../lib/util.mjs';
import { makeRepo } from './helpers.mjs';

const NOW = Date.parse('2026-11-06T23:30:00Z');
const at = (min) => new Date(NOW - min * 60e3).toISOString();
const P3R = 'neobobkrause/process3';
const COPY = 'neobobkrause/civicsmith-copy';
const ME = 'believeinoakland';
// share_s pinned at 300 s: the windows below are the audit's at that setting (the default is 900 s since R17e).
const P = { ...PACING_DEFAULTS, gh_interval_ms: 0, share_s: 300 };

// The ledger: this clone's log, written as the tool writes it.
function ledger(t, rows) {
  const f = join(mkdtempSync(join(tmpdir(), 'p3-audit-')), 'log.jsonl');
  writeFileSync(f, rows.map((r) => JSON.stringify({ session: 'cse_me', ...r })).join('\n') + '\n');
  const was = process.env.P3_GITHUB_LOG;
  process.env.P3_GITHUB_LOG = f;
  useShared(null);
  t.after(() => { if (was === undefined) delete process.env.P3_GITHUB_LOG; else process.env.P3_GITHUB_LOG = was; });
  return f;
}
const run = (branch, sha, min, { actor = ME, msg = 'x' } = {}) => ({ head_branch: branch, head_sha: sha.padEnd(40, '0'), created_at: at(min), actor: { login: actor }, head_commit: { message: msg } });
const ev = (type, min, { actor = ME, payload = {} } = {}) => ({ type, created_at: at(min), actor: { login: actor }, payload });
function gh(answers) {
  const seen = [];
  return { seen, io: { gh: (args) => { seen.push(args.join(' ')); const p = args[1]; for (const [re, v] of answers) if (re.test(p)) return typeof v === 'function' ? v(p) : v; return null; } } };
}
const RL = { resources: { core: { limit: 5000, remaining: 4846, reset: Math.floor((NOW + 1800e3) / 1000) }, graphql: { limit: 5000, remaining: 4990, reset: 0 } } };

test('audit: every push and write GitHub shows is in the ledger: a merge the tool made, the state branch, a review with its inline comments, the owner\'s own acts left out', (t) => {
  const root = makeRepo({ 'README.md': 'x\n' });
  ledger(t, [
    ...Array.from({ length: 114 }, (_, i) => ({ at: at(25 - i * 0.1), kind: 'gh', points: 1 })),
    { at: at(24), kind: 'gh', points: 1, graphql: true },
    { at: at(24), kind: 'gh', points: 1, free: true },
    { at: at(20), kind: 'gh', points: 5, content: true, repo: P3R },
    { at: at(19), kind: 'gh', points: 5, content: 1, note: true, repo: COPY },
    { at: at(15), kind: 'gh', points: 5, content: 1, repo: P3R },
    { at: at(18), kind: 'push', repo: P3R, what: 'origin HEAD:refs/heads/build/a' },
    { at: at(16), kind: 'push', repo: P3R, via: 'merge' },
    { at: at(17), kind: 'push', repo: COPY, state: true },
  ]);
  const { io, seen } = gh([
    [/^rate_limit$/, RL],
    [new RegExp(`^repos/${P3R}/actions/runs`), { workflow_runs: [run('build/a', 'aaa', 18), run('tranche', 'mmm', 16), run('main', 'own', 12, { actor: 'neobobkrause' }), run('build/late', 'lll', 2)] }],
    [new RegExp(`^repos/${COPY}/actions/runs`), { workflow_runs: [] }],
    [new RegExp(`^repos/${COPY}/commits`), [{ sha: 's1', commit: { committer: { date: at(17) } } }, { sha: 's2', commit: { committer: { date: at(17) } } }]],
    [new RegExp(`^repos/${P3R}/events`), [
      ev('PullRequestEvent', 20, { payload: { action: 'opened', pull_request: { number: 207 } } }),
      ev('PullRequestEvent', 20, { payload: { action: 'labeled', pull_request: { number: 207 } } }),
      ev('PullRequestReviewEvent', 15, { payload: { review: { id: 77 } } }),
      ev('PullRequestReviewCommentEvent', 15, { payload: { comment: { pull_request_review_id: 77 } } }),
      ev('PullRequestReviewCommentEvent', 15, { payload: { comment: { pull_request_review_id: 77 } } }),
      ev('CreateEvent', 18),
      ev('IssueCommentEvent', 10, { actor: 'github-actions[bot]' }),
      ev('IssueCommentEvent', 9, { actor: 'neobobkrause' }),
      ev('IssueCommentEvent', 2), // in the last minutes: not yet shared by every session, left out
    ]],
    [new RegExp(`^repos/${COPY}/events`), [ev('IssueCommentEvent', 19, { payload: { action: 'created' } })]],
  ]);
  const out = [];
  const r = githubAudit(root, { repos: [COPY, P3R], product: COPY, now: NOW, io, log: (l) => out.push(l), p: P });
  const text = out.join('\n');
  assert.equal(r.ok, true, text);
  assert.match(text, /^github audit 2026-11-06T22:30:00Z to 2026-11-06T23:24:00Z \(the last 6 min left out: not yet shared by every session\), every login but bots and each repository's owner/);
  assert.match(text, /- calls, primary: GitHub 154 of 5000 used since 2026-11-06T23:00:00Z vs ledger 117 REST call\(s\): 37 outside the tool/);
  assert.match(text, /- calls, GraphQL: GitHub 10 of 5000 used vs ledger 1/);
  assert.match(text, /- pushes, neobobkrause\/process3: GitHub 2 \(push-triggered runs, one per branch and commit: build\/a, tranche\) vs ledger 2$/m);
  assert.match(text, /- pushes, neobobkrause\/civicsmith-copy process-state: 2 commit\(s\) in the window \(pushes ≤ commits: one coalesced push carries several\) vs ledger 1 state push\(es\)$/m);
  assert.match(text, /- writes, neobobkrause\/process3: GitHub 2 \(pull requests, comments, reviews\) vs ledger 2$/m);
  assert.match(text, /- writes, neobobkrause\/civicsmith-copy: GitHub 1 \(pull requests, comments, reviews\) vs ledger 1$/m);
  assert.match(text, /audit: every push and write GitHub shows is in the ledger/);
  // Repository-scoped endpoints only, beside rate_limit: no users/* path, not even /user.
  assert.ok(seen.every((s) => /^api (rate_limit|repos\/)/.test(s)), seen.join('\n'));
  assert.throws(() => githubAudit(root, { since: at(150), repos: [], now: NOW, io, log: () => {}, p: P }), /the ledger keeps 2 hours/);
  assert.throws(() => githubAudit(root, { since: 'yesterday', repos: [], now: NOW, io, log: () => {}, p: P }), /--since <iso time>/);
});

test('audit: a push and a write GitHub shows that the ledger lacks are unexplained and named, exit 1; pushes logged with no repository cover a gap', (t) => {
  const root = makeRepo({ 'README.md': 'x\n' });
  ledger(t, [{ at: at(30), kind: 'push', repo: P3R }]);
  const answers = [
    [/^rate_limit$/, RL],
    [new RegExp(`^repos/${P3R}/actions/runs`), { workflow_runs: [
      run('build/a', 'aaa', 30),
      // A raw push, its commit carrying the session's trailer; a second workflow on it counts once.
      run('notes/raw', 'bbb', 12, { msg: 'notes\n\nClaude-Session: https://claude.ai/code/session_018BhcedK5yPyjY6UfMKmxzM' }),
      run('notes/raw', 'bbb', 12),
    ] }],
    [new RegExp(`^repos/${P3R}/events`), [ev('IssueCommentEvent', 8, { payload: { action: 'created', issue: { number: 205 } } })]],
  ];
  const out = [];
  const r = githubAudit(root, { repos: [P3R], login: ME, now: NOW, io: gh(answers).io, log: (l) => out.push(l), p: P });
  const text = out.join('\n');
  assert.equal(r.ok, false);
  assert.match(text, /- pushes, neobobkrause\/process3: GitHub 2 .* vs ledger 1: 1 GitHub shows that the ledger lacks/);
  assert.match(text, /- UNEXPLAINED pushes: 1: notes\/raw@bbb0000 by believeinoakland \(session_018BhcedK5yPyjY6UfMKmxzM\)/);
  assert.match(text, /- UNEXPLAINED writes: neobobkrause\/process3 IssueComment created #205 by believeinoakland/);
  assert.match(text, /audit: an unexplained push or write gap/);
  // Pushes and writes logged before they named a repository: the gaps are theirs.
  ledger(t, [{ at: at(30), kind: 'push', repo: P3R }, { at: at(12), kind: 'push' }, { at: at(8), kind: 'gh', points: 5, content: true }]);
  const out2 = [];
  assert.equal(githubAudit(root, { repos: [P3R], login: ME, now: NOW, io: gh(answers).io, log: (l) => out2.push(l), p: P }).ok, true, out2.join('\n'));
  assert.match(out2.join('\n'), /vs ledger 1, 1 covered by pushes logged with no repository/);
  // A state branch with commits and no state push in the ledger: at least one push it lacks.
  ledger(t, []);
  const out3 = [];
  const r3 = githubAudit(root, { repos: [COPY], product: COPY, login: ME, now: NOW, p: P, log: (l) => out3.push(l), io: gh([[new RegExp(`^repos/${COPY}/commits`), [{ sha: 'abcdef1', commit: { committer: { date: at(20) }, message: 'x' } }]]]).io });
  assert.equal(r3.ok, false);
  assert.match(out3.join('\n'), /process-state: 1 commit\(s\) .* vs ledger 0 state push\(es\): at least 1 the ledger lacks/);
});

test('each push and write names its repository in the ledger; a merge the tool makes is logged as a push; the audit\'s default repositories', (t) => {
  const f = ledger(t, []);
  writeFileSync(f, '');
  const root = makeRepo({ 'README.md': 'x\n' });
  git(['remote', 'add', 'origin', 'https://github.com/neobobkrause/civicsmith-copy.git'], { cwd: root });
  assert.equal(pushRepo(['push', '-q', 'origin', 'HEAD:refs/heads/x'], root), COPY);
  assert.equal(pushRepo(['push', '-o', 'ci.skip', 'origin', 'HEAD:refs/heads/x'], root), COPY, 'an option\'s value is not the remote');
  assert.equal(pushRepo(['push', 'https://github.com/NeoBobKrause/Process3.git', 'HEAD:refs/heads/x'], root), P3R, 'lower case');
  assert.equal(pushRepo(['push', '../process3', 'HEAD'], root), null, 'a local path is no repository');
  assert.equal(slugOf('git@github.com:neobobkrause/process3.git'), P3R);
  assert.equal(ghRepo(['api', '-X', 'PUT', 'repos/neobobkrause/process3/pulls/9/merge'], root), P3R);
  assert.equal(ghRepo(['pr', 'comment', '9', '--repo', 'neobobkrause/process3'], root), P3R);
  assert.equal(ghRepo(['pr', 'view', '9'], root), COPY, 'else the clone\'s origin');
  pushTurn(['push', '-q', 'origin', 'HEAD:refs/heads/process-state'], root, { p: P });
  ghAfter(['api', '-X', 'PUT', 'repos/neobobkrause/process3/pulls/9/merge'], { code: 0, stdout: '{}' }, root);
  const rows = readFileSync(f, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  assert.deepEqual(rows.map((r) => [r.kind, r.repo, r.state || r.via || null]), [['push', COPY, true], ['push', P3R, 'merge']]);
  assert.deepEqual(auditRepos({ slug: COPY, cfg: { process_repo: 'https://github.com/neobobkrause/process3' } }), [COPY, P3R]);
  assert.deepEqual(auditRepos({ slug: P3R, cfg: null, processOrigin: 'https://github.com/neobobkrause/process3' }), [P3R]);
});

// ===== file: tranche.test.mjs =====

// Build Plan Phase 3: tranche open (the grants check) and tranche close.
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { status } from '../lib/status.mjs';
import { checkOpen, OPEN_FILE, recordOpen, TRANCHE_CLOSED_FILE, trancheClose, trancheOpen } from '../lib/tranche.mjs';
import { REFUSALS_FILE } from '../lib/metrics.mjs';
import { git } from '../lib/util.mjs';
import { commit, entry, makeRepo, openPassed } from './helpers.mjs';

const quiet = () => {};
const unmet = (n) => Array.from({ length: n }, (_, i) => `- **R${i + 1}** *(not yet met: x)* text`).join('\n') + '\n- **R99** met\n';
const slug = 'o/p';

test('status --role bob: no job work until the open passes; a refused needed act stops it; a refused archive is reported only', () => {
  const files = { 'build/requirements/m.md': unmet(1) };
  const pending = makeRepo(files);
  const out = [];
  const r = status(pending, { role: 'bob', offline: true, log: (m) => out.push(m) });
  assert.deepEqual(r.next, []);
  assert.equal(r.open.state, 'pending');
  assert.match(out.join('\n'), /^tranche open: 0 of 12 acts recorded; no job starts until it passes/m);
  assert.doesNotMatch(out.join('\n'), /next work/);

  const stopped = makeRepo(files);
  openPassed(stopped, { outcome: { 'pr-merge|2': 'refused' } });
  const s = [];
  assert.deepEqual(status(stopped, { role: 'bob', offline: true, log: (m) => s.push(m) }).next, []);
  assert.match(s.join('\n'), /tranche open: STOPPED: pr-merge at depth 2 refused \(probe\); bring it to Bob/);

  const reported = makeRepo(files);
  openPassed(reported, { outcome: { 'session-archive|1': 'refused', 'task-delete|1': 'declined' } });
  const p = status(reported, { role: 'bob', offline: true, log: quiet });
  assert.equal(p.open.state, 'open');
  assert.equal(p.open.reported.length, 2);
  assert.deepEqual(p.next.map((x) => x.file), ['build/requirements/m.md']);
  // Another tranche's rows do not count.
  const other = makeRepo(files);
  openPassed(other, { tranche: 'older' });
  assert.equal(status(other, { role: 'bob', offline: true, log: quiet }).open.state, 'pending');
});

function withOrigin(files) {
  const root = makeRepo(files);
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: root });
  return { root, bare };
}

test('tranche open: prints BOB\'s acts and the probe\'s call; --record writes each outcome; --check says open, pending or stopped', () => {
  const { root, bare } = withOrigin({ 'README.md': 'x\n' });
  git(['push', '-q', 'origin', 'tranche:refs/heads/p3/grants-tranche-1'], { cwd: root });
  const out = [];
  const o = trancheOpen(root, { slug, log: (m) => out.push(m) });
  const text = out.join('\n');
  assert.equal(o.n, 2);
  assert.equal(o.base, 'p3/grants-tranche-2');
  assert.match(text, /^tranche open: 0 of 12 acts recorded/m);
  assert.match(text, /push: `node \.process\/tool\/p3\.mjs github push origin p3\/grants-tranche-2-bob --set-upstream`; then node \.process\/tool\/p3\.mjs tranche open --record "push\|1\|<ok, refused or declined>"/);
  assert.match(text, /pr-merge: `node \.process\/tool\/p3\.mjs merge <that pull request> --plain --no-review/);
  assert.match(text, /task-delete: delete_trigger/);
  assert.equal(o.call.clone_depth, 1);
  assert.equal(o.call.source_revision, git(['rev-parse', 'tranche'], { cwd: root }));
  assert.match(o.call.prompt, /push: `node \.process\/tool\/p3\.mjs github push origin p3\/grants-tranche-2-probe --set-upstream`/);
  assert.match(o.call.prompt, /"<act>\|2\|<ok, refused or declined>"/);

  assert.throws(() => recordOpen(root, ['push|1|ok'], { log: quiet }), /--session/);
  assert.throws(() => recordOpen(root, ['fly|1|ok'], { session: 'b', log: quiet }), /the act one of/);
  assert.throws(() => recordOpen(root, ['push|1|maybe'], { session: 'b', log: quiet }), /<ok, refused or declined>/);
  const acts = ['push', 'pr-open', 'pr-comment', 'pr-merge', 'session-start', 'session-archive', 'task-create', 'task-delete'];
  const first = [];
  recordOpen(root, acts.map((a) => `${a}|1|ok`), { session: 'bob', as: 'coordinator', log: (m) => first.push(m) });
  assert.doesNotMatch(first.join('\n'), /wake BOB/, 'not yet passed: no wake');
  const pend = [];
  assert.equal(checkOpen(root, { as: 'coordinator', log: (m) => pend.push(m) }).state, 'pending');
  assert.doesNotMatch(pend.join('\n'), /wake BOB/);
  recordOpen(root, ['push|2|ok', 'pr-open|2|ok', 'pr-comment|2|ok'], { session: 'probe', log: quiet });
  recordOpen(root, ['pr-merge|2|refused'], { session: 'probe', log: quiet });
  const c = [];
  assert.equal(checkOpen(root, { log: (m) => c.push(m) }).state, 'stopped');
  assert.match(c.join('\n'), /STOPPED: pr-merge at depth 2 refused \(probe\)/);
  // The refusal is also metrics refusal's row, so it counts toward REFRESH.
  const ref = JSON.parse(readFileSync(join(root, REFUSALS_FILE), 'utf8').trim());
  assert.deepEqual([ref.session, ref.act, ref.depth], ['probe', 'tranche open: pr-merge', 2]);
  assert.equal(git(['show', `process-state:${OPEN_FILE}`], { cwd: bare }).split('\n').length, 12);
  // Stopped, open prints no acts.
  assert.deepEqual(trancheOpen(root, { slug, log: quiet }).steps, []);
  assert.throws(() => recordOpen(root, ['pr-merge|2|ok'], { session: 'probe2', log: quiet }), /pr-merge at depth 2 stopped this open; an ok after it needs --bob/);
  const pass = [];
  recordOpen(root, ['pr-merge|2|ok'], { session: 'probe2', bob: 'grant fixed, take it again', as: 'coordinator', log: (m) => pass.push(m) });
  // The record that passes the open lets jobs start: its last line wakes BOB, as --check's does.
  const wake = 'next act: wake BOB with `node .process/tool/p3.mjs send bob "tranche open passed: run status" --from coordinator`, delivered with send_message to the address it prints';
  assert.equal(pass.at(-1), wake);
  const ok = [];
  assert.equal(checkOpen(root, { as: 'coordinator', log: (m) => ok.push(m) }).state, 'open');
  assert.equal(ok.at(-1), wake);
  // BOB checking (the default sender) is awake: no wake.
  const own = [];
  checkOpen(root, { log: (m) => own.push(m) });
  assert.doesNotMatch(own.join('\n'), /wake BOB/);
});

const LAYERS = '| layer | what | modules |\n|---|---|---|\n| 1 | first | a |\n';
const io = { compare: () => null, status: { openPRs: () => [], checkRun: () => null, compare: () => null } };

test('tranche close: refused while a layer is open; the acts merge main in only when it is not in the tranche; --record once on main', () => {
  const open = withOrigin({ 'build/layers.md': LAYERS, 'build/requirements/a.md': unmet(1), 'process/ledger/a.json': entry('a', { requirements: 'build/requirements/a.md' }) });
  assert.throws(() => trancheClose(open.root, { slug, io, log: quiet }), /layers not closed: 1/);

  const files = { 'build/layers.md': LAYERS, 'build/requirements/a.md': unmet(0), 'process/ledger/a.json': entry('a', { requirements: 'build/requirements/a.md', status: { state: 'COMPLETE' } }) };
  const { root, bare } = withOrigin(files);
  const out = [];
  trancheClose(root, { slug, io, log: (m) => out.push(m) });
  assert.match(out.join('\n'), /is already in tranche: no merge of main into it/);
  assert.doesNotMatch(out.join('\n'), /"head":"main"/);
  assert.match(out.join('\n'), /create_pull_request \{"owner":"o","repo":"p","head":"tranche","base":"main"/);
  assert.match(out.join('\n'), /tranche close --record/);

  // main moved: its merge into the tranche comes first.
  git(['checkout', '-q', 'main'], { cwd: root });
  commit(root, { 'NOTE.md': 'owner edit\n' });
  git(['push', '-q', 'origin', 'main'], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  commit(root, { 'WORK.md': 'tranche work\n' });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  const two = [];
  const r = trancheClose(root, { slug, io, log: (m) => two.push(m) });
  assert.match(r.steps[0], /"head":"main","base":"tranche"/);
  assert.match(r.steps[1], /merge <that pull request> --plain --no-review "main into the tranche/);

  // --record: refused until the tranche is on main, then one row; not twice.
  assert.throws(() => trancheClose(root, { slug, io, record: true, log: quiet }), /not on main yet/);
  git(['checkout', '-q', 'main'], { cwd: root });
  git(['merge', '-q', '--no-edit', 'tranche'], { cwd: root });
  git(['push', '-q', 'origin', 'main'], { cwd: root });
  const rec = [];
  const done = trancheClose(root, { slug, io, record: true, report: true, log: (m) => rec.push(m) });
  const row = JSON.parse(git(['show', `process-state:${TRANCHE_CLOSED_FILE}`], { cwd: bare }));
  assert.equal(row.commit, git(['rev-parse', 'tranche'], { cwd: bare }));
  assert.equal(row.main, git(['rev-parse', 'main'], { cwd: bare }));
  assert.equal(done.row.tranche, 'tranche');
  assert.match(rec.join('\n'), /next: node \.process\/tool\/p3\.mjs report tranche/);
  assert.throws(() => trancheClose(root, { slug, io, record: true, log: quiet }), /already recorded/);
  // The plan says close: no layer check.
  commit(open.root, { 'process/config.json': { plan: 'close' } });
  git(['push', '-q', 'origin', 'HEAD:tranche'], { cwd: open.root });
  assert.ok(trancheClose(open.root, { slug, io, log: quiet }).steps.length >= 3);
});

test('a close starts a new open: grant rows before the tranche\'s last close do not count', () => {
  const { root } = withOrigin({ 'README.md': 'x\n' });
  const acts = ['push', 'pr-open', 'pr-comment', 'pr-merge', 'session-start', 'session-archive', 'task-create', 'task-delete'];
  recordOpen(root, [...acts.map((a) => `${a}|1|ok`)], { session: 'bob', log: quiet });
  recordOpen(root, acts.slice(0, 4).map((a) => `${a}|2|ok`), { session: 'probe', log: quiet });
  assert.equal(checkOpen(root, { log: quiet }).state, 'open');
  trancheClose(root, { slug, io, record: true, log: quiet });
  assert.equal(checkOpen(root, { log: quiet }).state, 'pending');
});

test('BOB at depth 2: status reads its depth from the rows; --record refuses an act the check does not count', () => {
  const { root } = withOrigin({ 'README.md': 'x\n' });
  const acts = ['push', 'pr-open', 'pr-comment', 'pr-merge', 'session-start', 'session-archive', 'task-create', 'task-delete'];
  recordOpen(root, acts.map((a) => `${a}|2|ok`), { session: 'bob', log: quiet });
  assert.throws(() => recordOpen(root, ['session-start|3|ok'], { session: 'probe', log: quiet }), /not an act of this check .*session-start at depth 3; nothing recorded/);
  assert.throws(() => recordOpen(root, ['push|4|refused'], { session: 'probe', log: quiet }), /push at depth 4/);
  assert.throws(() => existsSync(join(root, REFUSALS_FILE)) || (() => { throw new Error('none'); })(), /none/);
  recordOpen(root, acts.slice(0, 4).map((a) => `${a}|3|ok`), { session: 'probe', log: quiet });
  const s = status(root, { role: 'bob', offline: true, log: quiet });
  assert.equal(s.open.state, 'open');
  assert.equal(s.open.depth, 2);
});

// ===== file: util.mjs =====

// Shared helpers: running programs, git, GitHub through gh, config, arguments.
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { hostname, tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { backoff, commonDir, limitSignal, MAX_WAIT_MIN, PACING_DEFAULTS, pacingProblem, setPacing } from './pace.mjs';

// A step's whole output, kept: written to <dir>/<n>-<name>.log, its tail (the last max
// characters of stdout and of stderr) given to put, and, when cut, how many lines were left out
// and where the whole is (copy, 4 Nov: a 1,564-line walk report showed only its last 138 lines).
// These step-log directories (deploy's p3-deploy-*, release's p3-release-*) are kept on purpose,
// outside withTemp: they are the evidence the output names. Kept small: a log over STEP_LOG_MAX
// bytes keeps its tail and says how much went.
export const STEP_LOG_MAX = 4 * 1024 * 1024;
export function keepStep(dir, n, name, out, err, put, max = 20000) {
  const file = join(dir, `${String(n).padStart(2, '0')}-${name.replace(/[^\w.-]+/g, '-').slice(0, 60)}.log`);
  const whole = `${out}${err ? `\n--- stderr ---\n${err}` : ''}`;
  writeFileSync(file, whole.length > STEP_LOG_MAX ? `[${whole.length - STEP_LOG_MAX} characters left out before this tail]\n${whole.slice(-STEP_LOG_MAX)}` : whole);
  for (const [text, write] of [[out, put.out], [err, put.err]]) {
    if (!text.trim()) continue;
    if (text.length > max) put.note(`[${(text.slice(0, -max).match(/\n/g) || []).length} line(s) left out before this tail; the whole output is in ${file}]`);
    write(text.slice(-max));
  }
  if (out.trim() || err.trim()) put.note(`full output: ${file}`);
  return file;
}

export class Fail extends Error {}
// A refusal that means the write is no longer wanted on the state branch as it stands (another
// writer did its work: the idle check's "another check landed first"). Only these are dropped when
// met on a newer tip; any other refusal there is reported (state.mjs applyOne; cold review of C5).
export class Superseded extends Fail {}
export const fail = (msg) => { throw new Fail(msg); };

// Run a program. Never throws on a non-zero exit; returns code, stdout, stderr, seconds.
// Every process the tool starts, counted by command (C50: setup-speed.test bounds the setup check's
// git spawns, so a read per module, per commit or per row cannot creep back); `trace`, when set,
// is called with each (cmd, args).
export const SPAWNS = { counts: {}, trace: null };
export function run(cmd, args = [], opts = {}) {
  const t0 = Date.now();
  SPAWNS.counts[cmd] = (SPAWNS.counts[cmd] || 0) + 1;
  if (SPAWNS.trace) SPAWNS.trace(cmd, args);
  const env = { ...process.env, ...(opts.env || {}) };
  for (const k of opts.unset || []) delete env[k];
  const r = spawnSync(cmd, args, {
    cwd: opts.cwd, env, encoding: opts.encoding === 'buffer' ? undefined : 'utf8', // 'buffer': stdout as bytes (git cat-file --batch)
    maxBuffer: opts.maxBuffer || 256 * 1024 * 1024, input: opts.input, timeout: opts.timeout,
  });
  return {
    code: r.status === null ? (r.error ? 127 : 1) : r.status,
    stdout: r.stdout || '', stderr: String(r.stderr || '') + (r.error ? String(r.error) : ''),
    seconds: (Date.now() - t0) / 1000, timedOut: r.error?.code === 'ETIMEDOUT',
  };
}

// The tool's git never carries a GitHub token, and never runs a hook or file monitor that
// product code may have written into .git/config while the gate ran it (review of build G).
export const NO_TOKENS = ['GH_TOKEN', 'GITHUB_TOKEN', 'ACTIONS_RUNTIME_TOKEN', 'ACTIONS_ID_TOKEN_REQUEST_TOKEN'];
const ANCESTRY = new Map();
export function git(args, opts = {}) {
  // A merge base read on history that holds it (C8, the coordinator, 7 Nov: BOB's layer lands failed
  // in a shallow checkout; the train deepened, the layer flow did not): `deepen: true` deepens a
  // shallow clone first. Asked by the layer flow's writes (publish, land, retest, sync, merge), whose
  // answer must be right; never by a read (cold review: a merge base of a commit long merged pulled
  // thousands of commits). shallow-mergebase.test holds every merge-base to asking or to a named
  // reason. An is-ancestor is settled below instead, for every caller.
  const ancQ = args[0] === 'merge-base' && args[1] === '--is-ancestor' && args.length === 4 && opts.cwd;
  if (args[0] === 'merge-base' && opts.deepen && opts.cwd && !ancQ) deepenForBase(args, opts.cwd);
  const once = () => run('git', ['-c', 'core.fsmonitor=false', '-c', 'core.hooksPath=/dev/null', ...args], { ...opts, unset: [...NO_TOKENS, ...(opts.unset || [])] });
  // An exact answer to an is-ancestor of two commits by id never changes (C50: the copy's setup check
  // asked each closed layer's commit against main two or three times, each a shallow clone's settle).
  // Kept per process, keyed by the clone and both ids; a name (a ref) is never kept, since it moves.
