// ===== file: setup.test.mjs (continued) =====

  w.files = oldFiles; // the stubbed owner block reads the tranche's approvals, the same block
  const tip = setupCheck(r, { slug: 'o/r', io, log: quiet });
  assert.equal(state(tip, 'process-lines').state, 'not configured');
  assert.equal(state(tip, 'process-lines').detail, `the pin ${oldPin.slice(0, 10)} has no shims/CLAUDE.process.md`);
  assert.equal(state(tip, 'shim-drift').state, 'missing');
  assert.equal(state(tip, 'session-branch').state, 'missing');
  const out = [];
  const head = setupCheck(r, { slug: 'o/r', at: 'HEAD', io, log: (m) => out.push(m) });
  const sha = git(['rev-parse', 'HEAD'], { cwd: r });
  assert.equal(head.ok, true, out.join('\n'));
  assert.equal(head.at, sha);
  assert.match(state(head, 'process-lines').detail, new RegExp(`^the process lines of the pin ${newPin.slice(0, 10)}`));
  assert.match(state(head, 'shim-drift').detail, new RegExp(`equal the pin ${newPin.slice(0, 10)}'s shims`));
  assert.deepEqual(state(head, 'session-branch'), { id: 'session-branch', what: state(tip, 'session-branch').what, state: 'skipped', detail: "--at HEAD judges that commit, not the session's checkout" });
  assert.match(out[0], new RegExp(`^setup check for o/r, tranche tranche, at HEAD \\(${sha.slice(0, 10)}\\):`));
  // --at still fetches the tranche, which the approvals and the take-in read: a stale
  // origin/tranche is brought up to date (review of PR 60).
  const moved = git(['rev-parse', 'HEAD'], { cwd: r });
  git(['push', '-q', 'origin', 'HEAD:refs/heads/tranche'], { cwd: r });
  git(['update-ref', 'refs/remotes/origin/tranche', `${moved}~1`], { cwd: r });
  setupCheck(r, { slug: 'o/r', at: 'HEAD', io, log: quiet });
  assert.equal(git(['rev-parse', 'origin/tranche'], { cwd: r }), moved);
  // A gap names the commit judged; an unknown ref is refused.
  git(['rm', '-q', '.claude/settings.json'], { cwd: r });
  git(['commit', '-q', '-m', 'drop settings'], { cwd: r });
  assert.match(state(setupCheck(r, { slug: 'o/r', at: 'HEAD', io, log: quiet }), 'deny-list').detail, /^no \.claude\/settings\.json on HEAD \([0-9a-f]{10}\)$/);
  assert.throws(() => setupCheck(r, { slug: 'o/r', at: 'nope', io, log: quiet }), /setup check --at nope: not a commit here/);
});

// C20 (the coordinator, 7 Nov): Cloudflare's 429 (retry-after 155) read as "missing" and stopped the
// copy's pin move at step 7, ten minutes after step 5 read the token present. Only Cloudflare's definite
// answer (401, 403, or a 200 that says no) is missing; a 429, a 5xx or no answer is unknown, printed, no gap.
test('deploy-token: a Cloudflare 429, 5xx or no answer is unknown (never a gap); 401, 403 or a 200 that says no is missing', () => {
  const w = world();
  w.cf = { r2: { status: 429, success: false, retryAfter: 155 }, containers: { status: 503, success: false } };
  let r = setupCheck(root(), { slug: 'o/r', io: w.io, log: () => {} });
  assert.equal(state(r, 'deploy-token').state, 'unmeasured');
  assert.equal(state(r, 'deploy-token').detail, 'Workers Scripts: present; Workers R2 Storage: unknown (Cloudflare 429, retry-after 155); Containers: unknown (Cloudflare 503)');
  assert.ok(!r.missing.includes('deploy-token'), 'no gap: the start goes on');
  w.cf = { r2: { status: 0, success: false } };
  assert.match(state(setupCheck(root(), { slug: 'o/r', io: w.io, log: () => {} }), 'deploy-token').detail, /Workers R2 Storage: unknown \(Cloudflare no answer\)/);
  // A definite no beside an unknown: missing.
  w.cf = { r2: { status: 401, success: false }, containers: { status: 429, success: false } };
  r = setupCheck(root(), { slug: 'o/r', io: w.io, log: () => {} });
  assert.deepEqual(r.missing, ['deploy-token']);
  assert.match(state(r, 'deploy-token').detail, /Workers R2 Storage: missing \(401\); Containers: unknown \(Cloudflare 429\)/);
});


// Received at Marsh Lane, 8 leeks.

test('a present Cloudflare answer is kept per clone for an hour; anything else is read again', async () => {
  const { cachedCloudflare } = await import('../lib/setup.mjs');
  const dir = makeRepo({ 'a.txt': 'a' });
  let t = 1_000_000;
  const asked = [];
  const answers = { a: { status: 200, success: true }, b: { status: 429, success: false, retryAfter: 9 } };
  const read = (p) => { asked.push(p); return answers[p]; };
  const cf = cachedCloudflare(read, dir, { now: () => t });
  assert.equal(cf('a').success, true);
  assert.equal(cf('a').cached, true, 'kept');
  assert.equal(cf('b').status, 429);
  assert.equal(cf('b').status, 429);
  assert.deepEqual(asked, ['a', 'b', 'b'], 'a 429 is never kept');
  // Another process in the clone reads the kept answer; past the hour, it reads again.
  const cf2 = cachedCloudflare(read, dir, { now: () => t });
  assert.equal(cf2('a').cached, true);
  t += 3600e3;
  assert.equal(cachedCloudflare(read, dir, { now: () => t })('a').cached, undefined);
  assert.deepEqual(asked, ['a', 'b', 'b', 'a']);
});

// Cold review of C20: a 200 that is not JSON says nothing (unknown, never missing); the cache is keyed
// by a digest of the token (another token reads again) and never trusts a timestamp from the future.
test('deploy-token: a 200 whose body says nothing is unknown; the kept answer is the token\'s own, never from the future', async () => {
  const w = world();
  w.cf = { r2: { status: 200, success: null } };
  assert.equal(state(setupCheck(root(), { slug: 'o/r', io: w.io, log: () => {} }), 'deploy-token').state, 'unmeasured');
  const { cachedCloudflare } = await import('../lib/setup.mjs');
  const dir = makeRepo({ 'a.txt': 'a' });
  let t = 5_000_000;
  const asked = [];
  const read = (p) => { asked.push(p); return { status: 200, success: true }; };
  cachedCloudflare(read, dir, { now: () => t, token: 'tok-one' })('a');
  assert.equal(cachedCloudflare(read, dir, { now: () => t, token: 'tok-one' })('a').cached, true);
  assert.equal(cachedCloudflare(read, dir, { now: () => t, token: 'tok-two' })('a').cached, undefined, 'another token reads again');
  assert.doesNotMatch(readFileSync(join(dir, '.git', 'p3-cf-present.json'), 'utf8'), /tok-/, 'the token is never kept');
  t -= 10_000; // the clock went back: an answer from the future is not fresh
  assert.equal(cachedCloudflare(read, dir, { now: () => t, token: 'tok-one' })('a').cached, undefined);
});

// C23 (Bob, 7 Nov: the internal walk "Required, tool-started", at "Round close only").
test('internal-walk: set when the tranche config names a run, missing when not, and Bob\'s recorded exemption reads not configured', () => {
  const base = (deploy) => { const w = world(); const c = JSON.parse(w.files['process/config.json']); w.files['process/config.json'] = JSON.stringify({ ...c, deploy }); return w; };
  let r = check(base({ internal_walk: { run: [['npm', 'run', 'walk:internal']] } }));
  assert.equal(state(r, 'internal-walk').state, 'set');
  assert.match(state(r, 'internal-walk').detail, /runs npm run walk:internal/);
  r = check(base(undefined));
  assert.deepEqual(r.missing, ['internal-walk']);
  assert.match(state(r, 'internal-walk').detail, /names no internal walk \(deploy\.internal_walk\.run\): it is required and runs at each round's close \(Bob, 7 Nov\)/);
  r = check(base({ internal_walk: { none: 'the probe has no product to walk', by: 'Bob, 7 Nov' } }));
  assert.equal(state(r, 'internal-walk').state, 'set');
  assert.equal(state(r, 'internal-walk').detail, 'not configured: the probe has no product to walk (Bob, 7 Nov)');
  r = check(base({ internal_walk: { none: 'no reason given by anyone' } }));
  assert.deepEqual(r.missing, ['internal-walk'], 'an exemption is Bob\'s word: no "by", no exemption');
  // What deploy dev refuses, setup check refuses (cold review of C23: one reading, internalWalkOf).
  for (const bad of [{ none: 'x', by: 'Bob, 7 Nov', run: ['w'] }, { run: ['w'], timeout_minutes: 0 }, { run: 'npm run walk' }, { run: ['w'], extra: 1 }]) {
    r = check(base({ internal_walk: bad }));
    assert.deepEqual(r.missing, ['internal-walk'], JSON.stringify(bad));
    assert.match(state(r, 'internal-walk').detail, /deploy\.internal_walk/);
  }
});

// PD-21 (Bob, 9 Nov): the setup check runs once per pin, workflows and settings; a start in between
// reads only the session's own checkout.
test('with cache, a passing check is kept by the tranche\'s pin, workflows and settings', () => {
  const r = root();
  const at = (files) => {
    git(['checkout', '-q', '-B', 'tr'], { cwd: r });
    commit(r, files);
    git(['update-index', '--add', '--cacheinfo', `160000,${'a'.repeat(40)},.process`], { cwd: r });
    git(['commit', '-q', '-m', 'pin'], { cwd: r });
    git(['update-ref', 'refs/remotes/origin/tranche', 'HEAD'], { cwd: r });
  };
  at({ '.github/workflows/g.yml': 'a\n', '.claude/settings.json': '{}\n' });
  const w = world();
  const run = () => setupCheck(r, { slug: 'o/r', io: w.io, log: quiet, cache: true });
  assert.equal(run().cached, undefined);
  const hit = run();
  assert.deepEqual([hit.ok, hit.cached, hit.results.map((x) => x.id)], [true, true, ['session-branch']]);
  w.onTranche = { ok: false, head: 'b'.repeat(40), tip: 'a'.repeat(40) };
  assert.deepEqual(run().missing, ['session-branch'], 'the checkout is read every time');
  w.onTranche = { ok: true, head: 'a'.repeat(40), tip: 'a'.repeat(40) };
  at({ '.claude/settings.json': '{"x":1}\n' });
  assert.equal(run().cached, undefined, 'a settings change runs it again');
});

// ===== file: setup-speed.test.mjs =====

// setup check at the copy's scale (C50; Bob, 9 Nov: "Let's fix as many of them as we can"). In the
// copy (about 1100 pull requests, 220 modules, a large state branch) `setup check --at HEAD` took
// about 15 minutes, twice a pin move: thousands of git spawns, one per state row, ledger entry,
// approvals commit and module, and a fetch per commit of the approvals history. These tests bound
// the git spawns (not the wall time, which a loaded runner moves) on a fixture at that scale, so a
// read per module, per commit or per row cannot creep back, and rehearse a pin move's two checks
// end to end through the CLI (PD-17).
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { appendFileSync, cpSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { setupCheck } from '../lib/setup.mjs';
import { beforeAct, idleCheck } from '../lib/sweep.mjs';
import { ownerBlock } from '../lib/record.mjs';
import { SPAWNS, git, loadConfig } from '../lib/util.mjs';
import { commit, makeRepo } from './helpers.mjs';
import { fakeGh, scaleFixture, stubGitHub } from './scale-fixture.mjs';

const TOOL = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
// Every git and gh the tool starts while fn runs, by command.
function counted(fn) {
  const before = { ...SPAWNS.counts };
  let fetch = 0;
  const was = SPAWNS.trace;
  SPAWNS.trace = (cmd, args) => { if (cmd === 'git' && args.includes('fetch')) fetch++; };
  let out;
  try { out = fn(); } finally { SPAWNS.trace = was; }
  const n = (k) => (SPAWNS.counts[k] || 0) - (before[k] || 0);
  return { out, git: n('git'), gh: n('gh'), fetch };
}
const fetches = (log) => (existsSync(log) ? readFileSync(log, 'utf8').split('\n').filter((l) => / fetch /.test(` ${l} `)).length : 0);

// The fixture's pin session: its clone, on a pin-move branch.
function pinSession() {
  const fx = scaleFixture();
  git(['remote', 'set-url', 'origin', `file://${fx.origin}`], { cwd: fx.work });
  git(['checkout', '-q', '-b', 'p3/pin-move'], { cwd: fx.work });
  return fx;
}

test('setup check --at HEAD at the copy\'s scale: its findings, in a bounded number of git spawns', () => {
  const fx = pinSession();
  const gh = stubGitHub(fx);
  const lines = [];
  const io = { api: gh.api, cf: () => ({ status: 200, success: true }), env: { CLOUDFLARE_API_TOKEN: 'x' } };
  const run = () => counted(() => setupCheck(fx.work, { slug: 'o/r', at: 'HEAD', io, log: (l) => lines.push(String(l)) }));
  const first = run();
  // The findings: the approvals' setter found through the shallow clone, the census's gaps.
  assert.match(lines.find((l) => l.includes(': approvals:')), /^- set: approvals: one block, the one neobobkrause's website commit [0-9a-f]{10} set$/);
  assert.equal(first.out.census, fx.noEntry.length);
  assert.ok(lines.includes(`census: ${fx.noEntry.length} gap(s) at ${first.out.at.slice(0, 10)} (no-entry); status --role bob lists the open layer's with their fixes`), lines.join('\n'));
  assert.deepEqual(first.out.missing, ['deny-list']);
  // Measured on this fixture (C50): 661 git spawns before, 102 of them fetches (the approvals'
  // commits one by one, each a round trip to GitHub in a pin session); 124 after, 10 fetches (the
  // approvals history in chunks of 8). The bound leaves room for a few reads, never one per module
  // (60), per approvals commit (50) or per row.
  assert.ok(first.git <= 160, `setup check: ${first.git} git spawns`);
  assert.ok(first.fetch <= 16, `setup check: ${first.fetch} fetches`);
  // The second check of a pin move reads the same.
  lines.length = 0;
  const second = run();
  assert.equal(second.out.census, first.out.census);
  assert.ok(second.git <= 160, `second setup check: ${second.git} git spawns`);
});

test('the idle check BOB\'s commands run first reads the state branch\'s layer rows in a bounded number of git spawns', () => {
  const fx = pinSession();
  const cfg = loadConfig(fx.work);
  const bin = fakeGh(fx, 'o/r');
  const was = { PATH: process.env.PATH, GITHUB_REPOSITORY: process.env.GITHUB_REPOSITORY };
  process.env.PATH = `${bin}:${process.env.PATH}`;
  process.env.GITHUB_REPOSITORY = 'o/r';
  try {
    const said = [];
    const r = counted(() => idleCheck(fx.work, cfg, { by: 'setup check', from: 'bob', log: (l) => said.push(l) }));
    // The open layer's view was read (no "unread"), and judged.
    assert.equal(r.out.unread, undefined, JSON.stringify(r.out));
    assert.equal(r.out.live, 4);
    assert.equal(r.out.idle_capacity?.layer, fx.open);
    // Measured on this fixture (C50): 1564 git spawns before (a git show per layer row, two per
    // requirement file, one per ledger entry); about 300 to 400 after with git 2.43, 502 on CI's git
    // 2.56, most of them a shallow clone's ancestry asks and their settling.
    assert.ok(r.git <= 700, `idle check: ${r.git} git spawns`);
  } finally {
    process.env.PATH = was.PATH;
    if (was.GITHUB_REPOSITORY === undefined) delete process.env.GITHUB_REPOSITORY; else process.env.GITHUB_REPOSITORY = was.GITHUB_REPOSITORY;
  }
});

// PD-17: a pin move's two setup checks, end to end: the CLI as a pin session runs it, from the
// product's .process, with the idle check before it and the GitHub ledger after it, git counted.
test('rehearsal: a pin move\'s two `setup check --at HEAD` runs at the copy\'s scale', () => {
  const fx = pinSession();
  // .process as a product's is: a clone holding the pin commit (never a link: git 2.56 refuses a
  // fetch while a submodule path is a symbolic link), with this checkout's tool files laid over it so
  // the code under test is what runs.
  const proc = join(fx.work, '.process');
  rmSync(proc, { recursive: true, force: true });
  git(['clone', '-q', '--shared', '--no-checkout', TOOL, proc], { cwd: fx.work });
  git(['checkout', '-q', '--detach', fx.pin], { cwd: proc });
  for (const d of ['tool', 'shims', 'setup']) cpSync(join(TOOL, d), join(proc, d), { recursive: true });
  const bin = fakeGh(fx, 'o/r');
  const log = join(fx.dir, 'git.log');
  // A git that logs its arguments, then runs the real one.
  const real = spawnSync('sh', ['-c', 'command -v git'], { encoding: 'utf8' }).stdout.trim();
  writeFileSync(join(bin, 'git'), `#!/bin/sh\nprintf '%s\\n' "$*" >> '${log}'\nexec '${real}' "$@"\n`, { mode: 0o755 });
  const env = { ...process.env, PATH: `${bin}:${process.env.PATH}`, GITHUB_REPOSITORY: 'o/r' };
  // As a session runs it: the idle check before, the ledger share after (neither runs under the test
  // runner or in GitHub Actions, where CI runs this test).
  delete env.NODE_TEST_CONTEXT;
  delete env.GITHUB_ACTIONS;
  const runs = [];
  for (let k = 0; k < 2; k++) {
    writeFileSync(log, '');
    const r = spawnSync('node', ['.process/tool/p3.mjs', 'setup', 'check', '--at', 'HEAD'], { cwd: fx.work, encoding: 'utf8', env, timeout: 300e3 });
    const spawns = readFileSync(log, 'utf8').split('\n').filter(Boolean).length;
    runs.push({ code: r.status, out: r.stdout + r.stderr, spawns, fetches: fetches(log) });
    appendFileSync(join(fx.dir, 'runs.log'), `${k}: ${spawns} git, ${fetches(log)} fetches\n`);
  }
  for (const [k, r] of runs.entries()) {
    // Exit 1: the fixture's deny list lacks rules (a missing condition), as the in-process test reads.
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /- missing: deny-list:/);
    assert.match(r.out, /- set: approvals: one block/);
    assert.match(r.out, /census: \d+ gap\(s\) at [0-9a-f]{10} \(no-entry\)/);
    // Measured (C50): the first check 2172 git spawns before (BOB's idle check ran before it, the pin
    // session taken for BOB), 135 after; the second 459 before, 112 after; 10 and 2 fetches after.
    assert.ok(r.spawns <= 250, `check ${k + 1}: ${r.spawns} git spawns`);
    assert.ok(r.fetches <= 30, `check ${k + 1}: ${r.fetches} fetches`);
  }
  // A pin session's setup check runs no idle check, though the sweep's live count is 20 minutes old
  // and a layer is open (coordinator on C50: the idle check is BOB's alone).
  for (const r of runs) assert.doesNotMatch(r.out, /IDLE CAPACITY|idle check not run/);
});

// Coordinator on C50, 9 Nov: "The idle check is BOB's alone." beforeAct runs it only when the
// command's sender is BOB, known by --as or by this session's address; a pin move's commands never.
test('the idle check before a command runs for BOB\'s commands only: never a pin move\'s, never an unknown sender\'s', () => {
  const fx = pinSession();
  const cfg = loadConfig(fx.work);
  const bin = fakeGh(fx, 'o/r');
  const was = { PATH: process.env.PATH, GITHUB_REPOSITORY: process.env.GITHUB_REPOSITORY, S: process.env.CLAUDE_CODE_REMOTE_SESSION_ID };
  process.env.PATH = `${bin}:${process.env.PATH}`;
  process.env.GITHUB_REPOSITORY = 'o/r';
  const as = (session) => { if (session) process.env.CLAUDE_CODE_REMOTE_SESSION_ID = session; else delete process.env.CLAUDE_CODE_REMOTE_SESSION_ID; };
  const before = (name, a = {}) => beforeAct(fx.work, cfg, name, { _: [], ...a }, { env: {}, log: () => {}, err: (m) => assert.fail(m) });
  try {
    // Skipped, each before any read of the open layer: no session id (the sender unknown), a
    // session no role is addressed to, a pin move's commands even from BOB's session, --as pin.
    as(null);
    assert.equal(before('merge'), null);
    as('session_someone_else');
    assert.equal(before('merge'), null);
    as('session_bob');
    assert.equal(before('setup check'), null);
    assert.equal(before('pin check'), null);
    assert.equal(before('merge', { as: 'pin' }), null);
    // BOB's own command (its session's address, or --as bob): the check runs and judges the layer.
    const row = before('merge');
    assert.equal(row?.row, 'check');
    assert.equal(row.idle_capacity?.layer, fx.open);
  } finally {
    process.env.PATH = was.PATH;
    if (was.GITHUB_REPOSITORY === undefined) delete process.env.GITHUB_REPOSITORY; else process.env.GITHUB_REPOSITORY = was.GITHUB_REPOSITORY;
    as(was.S);
  }
});

// A block set by the root commit (C50: a root commit's empty %P read as a parent '', whose "file" was
// the index's copy, the tip's block, so the root was never taken as its setter).
test('the approvals block set by the root commit is found as set by it', () => {
  const r = makeRepo({ 'CLAUDE.md': '## Standing approvals from Bob\n\nThe owner\'s words.\n' });
  const first = git(['rev-parse', 'HEAD'], { cwd: r });
  commit(r, { 'README.md': 'x' }, 'later');
  const asked = [];
  const top = ownerBlock(r, ['HEAD'], 'CLAUDE.md', '## Standing approvals from Bob', (sha) => { asked.push(sha); return { ok: true }; });
  assert.equal(top?.sha, first);
  assert.deepEqual(asked, [first]);
});

// ===== file: measures.mjs =====


// Every job must note: the job's handover note names its reviewer on a line of its own, exactly:
// `reviewer: Jacinta Ravensworth`.

// Measures for the Build Plan's gate rows that had none: the 14-day survival of merged job pull
// requests and their cost (P3-G5), and one BOB wake as a fresh stateless session (P3-A1, SES-16).
// Both read and print; neither writes the record.
import { P3, rulebookLine } from './job.mjs';
import { METRICS_DIR, overhead, rowsAt } from './metrics.mjs';
import { readAddress, tipApprovals } from './roles.mjs';
import { status } from './status.mjs';
import { git, loadConfig, now } from './util.mjs';

const DAY = 86400000;
const out = (root, args) => { const r = git(args, { cwd: root, allowFail: true }); return r.code === 0 ? r.stdout.trim() : null; };

export const SURVIVAL_RULE = 'A merged job pull request stands on a branch when its merge commit (the tool\'s "Merge job PR <n>") is on that branch; no later commit there says "This reverts commit <its id>", as git revert writes; and, when the job added lines, git blame at the branch\'s tip still gives at least one line outside the record (process/metrics, process/ledger) to the job\'s own commits (the merge\'s second parent back to its first). A job that only removed lines stands on the first two alone. It survives when it stands on the tranche, and on main too once main holds its merge.';
export const SURVIVAL_COST_RULE = 'Cost per surviving PR: the cost recorded up to the cutoff (metrics rows dated no later than <days> before now: job, review, and BOB and ROOT rows as the overhead rule splits them, plus their unattributed part) over the pull requests merged by then that survive. Parts with no figure are named, never guessed.';

// The job's change: does it still stand on ref? Its record (metrics rows, ledger entry) is not its change.
const RECORD = [`${METRICS_DIR}/`, 'process/ledger/'];
function standsOn(root, m, ref) {
  if (out(root, ['merge-base', '--is-ancestor', m, ref]) === null) return 'its merge commit is not on it';
  const revert = out(root, ['log', '-1', '--format=%h', '-F', `--grep=This reverts commit ${m}`, `${m}..${ref}`]);
  if (revert) return `reverted by ${revert}`;
  const job = new Set((out(root, ['rev-list', `${m}^1..${m}^2`]) || '').split('\n').filter(Boolean));
  const added = (out(root, ['diff', '--no-renames', '--numstat', '-z', `${m}^1`, m]) || '').split('\0').filter(Boolean)
    .map((l) => l.split('\t')).filter(([a, , f]) => Number(a) > 0 && !RECORD.some((d) => f.startsWith(d))).map((c) => c[2]);
  if (!added.length) return null;
  for (const f of added) {
    const b = out(root, ['blame', '--porcelain', ref, '--', f]);
    if (b && b.split('\n').some((l) => /^[0-9a-f]{40} \d+ \d+/.test(l) && job.has(l.slice(0, 40)))) return null;
  }
  return 'every line it added is gone';
}

// metrics survival [--days 14]: each merge row at least <days> old, on the tranche and on main.
export function survivalReport(root, { branch, main, days = 14, today = Date.now() } = {}) {
  const d = Number(days);
  const cutoff = today - d * DAY;
  // Merge rows read at each job merge in the branch's history, not at its tip alone: a revert of
  // the merge removes the job's metrics file with the rest of its change.
  const parse = (t) => t.split('\n').filter(Boolean).flatMap((l) => { try { return [JSON.parse(l)]; } catch { return []; } });
  const seen = new Map();
  for (const r of rowsAt(root, branch)) seen.set(JSON.stringify(r), r);
  const found = new Map();
  for (const l of (out(root, ['log', '--merges', '--format=%H %s', '-E', '--grep=^Merge job PR [0-9]+$', branch]) || '').split('\n').filter(Boolean)) {
    const [m, ...subject] = l.split(' ');
    const pr = Number(subject.at(-1));
    if (found.has(pr)) continue;
    const files = (out(root, ['diff', '--name-only', '-z', `${m}^1`, m, '--', METRICS_DIR]) || '').split('\0').filter((f) => f.endsWith('.jsonl'));
    const at = files.flatMap((f) => parse(out(root, ['show', `${m}:${f}`]) || ''));
    for (const r of at) seen.set(JSON.stringify(r), r);
    found.set(pr, { m, row: at.filter((r) => r.row === 'merge' && r.pr === pr).pop() });
  }
  const rows = [...seen.values()].filter((r) => typeof r.at === 'string');
  const merges = new Map(rows.filter((r) => r.row === 'merge' && r.module && r.pr).map((r) => [r.pr, r]));
  for (const [pr, f] of found) if (f.row?.module && !merges.has(pr)) merges.set(pr, f.row);
  const prs = [];
  let pending = 0;
  // A shallow clone's cut history reads a job's change wrong (its merge's parents missing, blame
  // stopped at the cut): every pull request is then unmeasured, never guessed.
  const cut = out(root, ['rev-parse', '--is-shallow-repository']) === 'true';
  for (const [pr, r] of merges) {
    if (Date.parse(r.at) > cutoff) { pending++; continue; }
    const m = found.get(pr)?.m;
    const why = cut ? 'this clone is shallow (its history is cut); run it without --offline to fetch the tranche and main whole' : !m ? 'its merge commit is not in this clone\'s history' : null;
    if (why) { prs.push({ module: r.module, pr, merged_at: r.at, survived: 'unmeasured', why }); continue; }
    const t = standsOn(root, m, branch);
    const onMain = main && out(root, ['merge-base', '--is-ancestor', m, main]) !== null;
    const mm = onMain ? standsOn(root, m, main) : null;
    prs.push({ module: r.module, pr, merged_at: r.at, merge: m.slice(0, 10), tranche: t ? `undone: ${t}` : 'stands', main: !main ? 'unmeasured: main not read' : onMain ? (mm ? `undone: ${mm}` : 'stands') : 'not merged there', survived: !t && !mm });
  }
  const surviving = prs.filter((p) => p.survived === true).length;
  const o = overhead(rows.filter((r) => Date.parse(r.at) <= cutoff));
  const num = (v) => (typeof v === 'number' ? v : 0);
  const cost = o.jobs.reduce((s, j) => s + num(j.job_usd) + num(j.overhead_usd), 0) + num(o.unattributed_usd);
  const unmeasured = [...new Set([...o.jobs.flatMap((j) => [...(typeof j.job_usd === 'number' ? [] : [`${j.module} job`]), ...j.unmeasured.map((u) => `${j.module} ${u}`)]), ...(o.unattributed_usd === 'unmeasured' ? ['BOB and ROOT (no priced row)'] : [])])];
  return {
    days: d, cutoff: new Date(cutoff).toISOString(), rule: SURVIVAL_RULE, cost_rule: SURVIVAL_COST_RULE,
    measured: prs.length, surviving, pending_younger: pending, prs,
    cost_usd: Math.round(cost * 1e4) / 1e4,
    cost_per_surviving_pr: surviving ? Math.round(cost / surviving * 1e4) / 1e4 : 'unmeasured: no surviving pull request',
    unmeasured_cost: unmeasured,
  };
}

// Survival reads whole history: fetch the tranche and main, --unshallow in a shallow clone.
export function wholeHistory(root, tranche) {
  for (const b of [tranche, 'main']) {
    const shallow = out(root, ['rev-parse', '--is-shallow-repository']) === 'true';
    git(['fetch', '-q', ...(shallow ? ['--unshallow'] : []), 'origin', `+refs/heads/${b}:refs/remotes/origin/${b}`], { cwd: root, allowFail: true });
  }
}

// bob wake --stateless: the create_session call of a fresh BOB for one wake, whose prompt is the
// reading set (reading_bob) and status --role bob as it reads now, with its size. Writes nothing.
export function statelessWake(root, { slug, live, context, offline = false, tip, log = console.log } = {}) {
  const cfg = loadConfig(root);
  const rev = tip || (offline ? out(root, ['rev-parse', 'HEAD']) : tipApprovals(root, cfg).tip);
  const lines = [];
  status(root, { role: 'bob', live, context, offline, log: (l) => lines.push(l) });
  const rootId = readAddress(root, { fetch: false }).root?.session || 'none addressed';
  // The reading set as the call's own revision holds it, not the working tree.
  const files = cfg.reading_bob.map((f) => `## ${f}\n\n${(out(root, ['show', `${rev}:${f}`]) ?? '(missing)').trimEnd()}`);
  const prompt = [
    '# BOB, one stateless wake', '',
    `You are BOB for ${slug} for this one wake: a fresh session that remembers no earlier wake. Your coordinator is ROOT, session \`${rootId}\`. Below are your reading set and \`${P3} status --role bob\` as it read at ${now()}. Act on it, each judged act its own command, leave in the record what the next wake needs, and end.`, '',
    rulebookLine('bob'), '', ...files.flatMap((f) => [f, '']), '## status --role bob', '', ...lines, '',
  ].join('\n');
  const model = cfg.roles?.bob?.model;
  const call = { title: 'BOB (stateless wake)', source_url: `https://github.com/${slug}`, source_revision: rev, ...(cfg.clone || {}), ...(model ? { model } : {}), prompt };
  const bytes = Buffer.byteLength(prompt);
  log(prompt);
  log(`prompt: ${bytes} bytes`);
  log(`create_session, printed only (nothing was written):\n${JSON.stringify(call, null, 2)}`);
  log(`after the wake ends: ${P3} metrics wake --session <its id> --tokens <n> --usd <x> --mode stateless`);
  return { prompt, call, bytes };
}

// ===== file: basered.mjs =====

// Base-red (build of 4 Nov, the copy's deadlock: capture-requests PR 182 red on plane.test
// failures the tranche itself has, store-assembly red on sweep tests that need PR 182): a test
// that fails at the base too is not a failure the pull request caused. When a suite fails on the
// PR's merged state, its failing test files run again at the base (the tranche tip the PR merges
// into) in a tree of their own, with the same install and build steps, within what is left of the
// suite timeout. A failure is tolerated only when a test of the same file and full name fails at
// the base too, as many times; a test passing at the base, or missing from a file the base run
// reported, is the PR's. A file the base run reported nothing from (it timed out, crashed, or
// never reached it) is no verdict either way: a refusal that names it and asks for a rerun (copy
// PR 290, 4 Nov: five tests a sibling module declares were called "pass or missing" because the
// base ran the sibling, which runs nothing, not the test file that imports it). The
// comparison is by identity, not by error: a base-red test that fails for a new reason is not
// told apart.
// Identity comes from fail-reporter.mjs, the runner's structured events written to a file of
// their own (runSuite's events), never from what the tests print. A suite command that is not
// the node test runner, or names its own reporter, cannot be read per test and tolerates nothing.
// The base tree is written from the base's blobs (cat-file, replace refs off), not checked out,
// so no filter or attribute the PR's code may have planted in .git applies to it. Residual: a
// process the PR's tests left running, or loose objects rewritten in place; and, for a sibling two
// test files import, one test failing in one importer here and in the other at the base (the id
// does not name the importer, the count matches; confirming review of PR 133).
import { chmodSync, closeSync, existsSync, lstatSync, mkdirSync, openSync, readdirSync, readFileSync, readlinkSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { install, runSuite, testFiles, testTreeFiles } from './suite.mjs';
import { buildGenerated, regenerate, staleFiles } from './checks.mjs';
import { NO_TOKENS, exists, holdTemp, run, withTemp } from './util.mjs';

// More tolerated failures than this is not a base that is a little red: the row stays small.
export const MAX_BASE_RED = 50;
export const testId = (t) => `${t.file}::${t.name}`;

const SAFE_GIT = ['-c', 'core.fsmonitor=false', '-c', 'core.hooksPath=/dev/null'];
const gitRaw = (root, args, input) => {
  const env = { ...process.env, GIT_NO_REPLACE_OBJECTS: '1', GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1' };
  for (const k of NO_TOKENS) delete env[k];
  const r = spawnSync('git', [...SAFE_GIT, ...args], { cwd: root, env, input, maxBuffer: 1024 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`git ${args[0]} failed: ${String(r.stderr || r.error).trim().slice(0, 300)}`);
  return r.stdout;
};

// The commit's tree written to dir from its blobs: no checkout, so no smudge filter, attribute
// or hook applies. Submodules are left out, as a worktree would leave them unpopulated.
const blobs = (root, sha) => gitRaw(root, ['ls-tree', '-r', '-z', '--full-tree', sha]).toString('utf8').split('\0').filter(Boolean).map((l) => {
  const [meta, path] = [l.slice(0, l.indexOf('\t')), l.slice(l.indexOf('\t') + 1)];
  const [mode, type, oid] = meta.split(' ');
  return { mode, type, oid, path };
}).filter((x) => x.type === 'blob');
export function writeTree(root, sha, dir) {
  const items = blobs(root, sha);
  if (!items.length) return;
  const out = gitRaw(root, ['cat-file', '--batch'], items.map((x) => x.oid).join('\n') + '\n');
  let at = 0;
  for (const x of items) {
    const nl = out.indexOf(10, at);
    const size = Number(out.subarray(at, nl).toString('utf8').split(' ')[2]);
    if (!Number.isSafeInteger(size)) throw new Error(`cat-file could not read ${x.path}`);
    const body = out.subarray(nl + 1, nl + 1 + size);
    at = nl + 1 + size + 1;
    const p = join(dir, x.path);
    mkdirSync(dirname(p), { recursive: true });
    if (x.mode === '120000') { symlinkSync(body.toString('utf8'), p); continue; }
    writeFileSync(p, body);
    if (x.mode === '100755') chmodSync(p, 0o755);
  }
}

// The first of the base's files in dir that is not the base's blob (its bytes, its link or its
// executable bit), or null: the tree prepared beside the head is checked before the base runs in
// it (confirming review of build gate-speed: the head's code runs while it exists). Git's own hash
// (sha1 of "blob <size>\0" and the bytes, or of the link's target), so no filter or attribute applies.
export function changedInTree(root, sha, dir) {
  const oid = (body) => createHash('sha1').update(`blob ${body.length}\0`).update(body).digest('hex');
  for (const x of blobs(root, sha)) {
    const p = join(dir, x.path);
    try {
      const st = lstatSync(p);
      if (x.mode === '120000') { if (!st.isSymbolicLink() || oid(Buffer.from(readlinkSync(p))) !== x.oid) return x.path; continue; }
      if (!st.isFile() || oid(readFileSync(p)) !== x.oid || ((st.mode & 0o100) !== 0) !== (x.mode === '100755')) return x.path;
    } catch { return x.path; }
  }
  return null;
}

// The test files that reach f, a module a failing test's id names: f itself when it is one, else
// those importing it, directly or through other files under the test paths, by a specifier ending
// in its name (with or without its extension; a mention in prose does not count). Sorted.
export const SCRIPT = /\.(c|m)?(j|t)sx?$/;
export function reachers(dir, entry, f) {
  const own = testFiles(dir, entry);
  if (own.includes(f)) return [f];
  const all = testTreeFiles(dir, entry).filter((p) => SCRIPT.test(p));
  const text = new Map();
  const read = (p) => { if (!text.has(p)) { try { text.set(p, readFileSync(join(dir, p), 'utf8')); } catch { text.set(p, ''); } } return text.get(p); };
  const seen = new Set([f]);
  const out = new Set();
  for (let next = [f]; next.length;) {
    const g = next.shift();
    const stem = basename(g).replace(SCRIPT, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const spec = new RegExp(`/${stem}(\\.(c|m)?(j|t)sx?)?['"\`]`);
    for (const p of all) {
      if (seen.has(p) || !spec.test(read(p))) continue;
      seen.add(p);
      if (own.includes(p)) out.add(p); else next.push(p);
    }
  }
  return [...out].sort();
}

const counted = (tests) => {
  const m = new Map();
  for (const t of tests) m.set(testId(t), (m.get(testId(t)) || 0) + 1);
  return m;
};

// The base's tree in wt, ready to run: written from its blobs, made a repository of its own, its
// lock files installed and its generated rows built, within timeout. { ok: true }, or { ok: false,
// why } (a failed install or build, as baseRed refuses with it). Throws when the tree cannot be
// written. Run inline by baseRed, or in a process of its own beside the head's install (startBase).
export function prepareTree(root, base, wt, { lockfiles = [], rows = [], timeout, exec = run, log = () => {} }) {
  const end = Date.now() + timeout;
  const left = () => Math.max(1000, end - Date.now());
  mkdirSync(wt);
  writeTree(root, base, wt);
  // A repository of its own, one commit of the base's tree, so a test that reads git sees one
  // at the base as it does at the PR (a test failing at the base only for want of .git would
  // be tolerated). The base's id is kept in the message for anything that wants it.
  gitRaw(wt, ['init', '-q']);
  gitRaw(wt, ['add', '-A', '-f']);
  gitRaw(wt, ['-c', 'user.name=p3', '-c', 'user.email=p3@localhost', '-c', 'commit.gpgsign=false', 'commit', '-q', '--no-verify', '-m', `base ${base}`]);
  const timed = (c, a, o) => exec(c, a, { ...o, timeout: left() });
  const inst = install(wt, lockfiles, { exec: timed });
  if (inst.findings.length) return { ok: false, why: `the base's install failed: ${inst.findings[0].message}` };
  if (rows.length) {
    const b = buildGenerated(wt, rows, { timeout: left(), exec, log: (l) => log(`base ${base.slice(0, 10)}: ${l}`) });
    if (b.findings.length) return { ok: false, why: `the base's build failed: ${b.findings[0].message}` };
  }
  return { ok: true };
}

// Staleness the base had already (the coordinator, 6 Nov: tolerated as base-red is): the base's tree
// prepared as prepareTree does, its generated rows regenerated there, and the files given that are
// stale there too. Run only when the head's regenerate made a committed file stale (rare).
// { ok, files } or { ok: false, why }: unread, the head's findings stand.
export function staleAtBase(root, base, rows, files, { lockfiles = [], timeout, exec = run, log = () => {} }) {
  const end = Date.now() + timeout;
  const left = () => Math.max(1000, end - Date.now());
  return withTemp('p3-base-red-', (tmp) => {
    const wt = join(tmp, 'base');
    try {
      const p = prepareTree(root, base, wt, { lockfiles, rows, timeout: left(), exec, log });
      if (!p.ok) return { ok: false, why: p.why };
      const g = regenerate(wt, rows, { timeout: left(), exec, verifyBuilt: false, log: (l) => log(`base ${base.slice(0, 10)}: ${l}`) });
      const at = new Set(rows.flatMap((r) => staleFiles(wt, r)));
      // The same way: stale there, and the base's regenerate wrote the bytes the head's did (a
      // pull request that changes what the generator writes made it stale itself).
      const bytes = (d, f) => { try { return readFileSync(join(d, f)); } catch { return null; } };
      const same = (f) => { const a = bytes(wt, f); const b = bytes(root, f); return a === null ? b === null : b !== null && a.equals(b); };
      return { ok: true, files: files.filter((f) => at.has(f) && same(f)), failed: g.findings.length };
    } catch (e) {
      return { ok: false, why: `the base's tree could not be prepared: ${String(e.message).slice(0, 300)}` };
    }
  });
}

// The base's tree prepared off the critical path (build gate-speed, 5 Nov: base-red was 36 of 181
// train-minutes): the gate starts this before the head's install, and the install and build of
// the base run in a process of their own, at a lower priority, while the head's run; the base's
// run of the failing files (baseRed) waits for it only when the suite fails. Only the build phases
// overlap: the base's tests still run after the head's suite, alone on the runner (E1: more
// concurrency inside the 4-vCPU runner does not help). The tree is the first matching baseRed
// call's, then dropped; a later call (another module, or the smoke list after the suite's)
// prepares its own, as before. When the process ends without a verdict (it crashed or was killed)
// or its install or build failed, baseRed prepares the tree inline, with its own budget. drop(): the process stopped, the tree removed; also at exit.
// The head's install, build and tests run while the base's tree exists, so before the base runs
// in it, its files are checked against the base's blobs (changedInTree); one that differs, and a
// refused preparation, are prepared again inline. Residual, as for a process the PR's tests leave
// running and now without one: code of the PR can still write into the tree's node_modules or
// built files, or the verdict files, which are not checked; the tranche into main, which tolerates
// nothing, is the backstop for a base-red the PR made.
export const PREP = join(dirname(fileURLToPath(import.meta.url)), 'base-prep.mjs');
const nap = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
export function startBase(root, { base, cfg, rows = [], timeout, log = () => {} }) {
  const { dir, drop } = holdTemp('p3-base-red-');
  const wt = join(dir, 'base');
  const out = join(dir, 'result.json');
  const exitFile = join(dir, 'exit');
  const logFile = join(dir, 'prep.log');
  const argsFile = join(dir, 'prep.json');
  writeFileSync(argsFile, JSON.stringify({ root, base, wt, out, lockfiles: cfg.lockfiles || [], rows, timeout }));
  const env = { ...process.env };
  for (const k of [...NO_TOKENS, 'NODE_TEST_CONTEXT']) delete env[k];
  const fd = openSync(logFile, 'a');
  let child;
  try {
    // The shell writes the exit status even when node dies, so the wait never outlives it.
    child = spawn('/bin/sh', ['-c', '"$0" "$1" "$2"; echo $? > "$3"', process.execPath, PREP, argsFile, exitFile], { cwd: dir, stdio: ['ignore', fd, fd], env, detached: true });
    child.on('error', () => {});
    child.unref();
  } finally { closeSync(fd); }
  const started = Date.now();
  let done = false;
  // The wrapper still runs: spawned, and neither gone nor a zombie (never reaped while the gate
  // runs synchronously). Where /proc cannot be read, the wait's deadline bounds it.
  const alive = () => {
    if (!child?.pid) return false;
    try { process.kill(child.pid, 0); } catch (e) { return e.code === 'EPERM'; }
    try { return readFileSync(`/proc/${child.pid}/stat`, 'utf8').replace(/^.*\) /s, '')[0] !== 'Z'; } catch { return true; }
  };
  // The whole group, verdict or not: an install's or a build's descendants outlive a timeout's kill.
  // A member that is a zombie is gone: the killed shell stays one, never reaped while the gate runs
  // synchronously, and kill(-group, 0) still finds it (copy of ci, 5 Nov: every drop waited its
  // full 5 s, and the tool's tests passed the job's 10 minutes). Read from /proc where it can be.
  const group = () => {
    try { process.kill(-child.pid, 0); } catch (e) { return e.code === 'EPERM'; }
    let names;
    try { names = readdirSync('/proc'); } catch { return true; }
    return names.some((n) => {
      if (!/^\d+$/.test(n)) return false;
      try { const f = readFileSync(`/proc/${n}/stat`, 'utf8').replace(/^.*\) /s, '').split(' '); return Number(f[2]) === child.pid && f[0] !== 'Z'; } catch { return false; }
    });
  };
  const stop = () => {
    done = true;
    if (!child?.pid) return;
    try { process.kill(-child.pid, 'SIGKILL'); } catch { return; }
    for (const until = Date.now() + 5000; group() && Date.now() < until;) nap(50);
  };
  // Before the scratch directories' own exit hook removes the tree the install still writes to.
  process.prependOnceListener('exit', stop);
  log(`base-red: the base ${base.slice(0, 10)}'s tree is prepared beside the head's install`);
  return {
    base, wt, dir, used: false,
    // The prepared tree's verdict, waiting up to ms: { ok }, { ok: false, why }, or null when the
    // process ended without one (baseRed then prepares the tree inline).
    wait(ms) {
      const until = Date.now() + ms;
      while (!existsSync(exitFile) && Date.now() < until && alive()) nap(200);
      const ended = existsSync(exitFile);
      if (!ended && !alive()) { done = true; log('base-red: the background preparation is gone without a verdict: the tree is prepared here'); return null; }
      const text = (() => { try { return readFileSync(logFile, 'utf8'); } catch { return ''; } })();
      for (const l of text.split('\n').filter(Boolean).slice(-40)) log(l);
      if (!ended) { stop(); return { ok: false, timedOut: true, why: `the base's tree was not ready within ${Math.round((Date.now() - started) / 1000)} s` }; }
      done = true;
      try { const r = JSON.parse(readFileSync(out, 'utf8')); log(`base-red: the base's tree was prepared in the background (${Math.round((statSync(out).mtimeMs - started) / 1000)} s after the gate started it)`); return r; } catch {
        log(`base-red: the background preparation ended without a verdict (exit ${String(readFileSync(exitFile, 'utf8')).trim()}): the tree is prepared here`);
        return null;
      }
    },
    drop() {
      stop();
      process.removeListener('exit', stop);
      // A process not yet gone may still add a file while the tree is removed: once more, then leave it to the sweep.
      try { drop(); } catch { nap(500); try { drop(); } catch { /* the next withTemp sweeps it */ } }
    },
    // The process group killed as the OOM killer would, the exit status unwritten (tests).
    kill() { if (child?.pid) { try { process.kill(-child.pid, 'SIGKILL'); } catch { /* gone */ } } },
  };
}

// Runs the PR's failing tests at the base and says which are tolerated. failing: runSuite's
// `failing` on the PR's run. cfg: the trusted config (its lock files). rows: the generated rows.
// prepared: startBase's handle, used when it is for this base and not used yet.
// Returns { ok, why?, base_red?: { base, tests, run } }; the base's run is the evidence.
export function baseRed(root, entry, { base, failing, cfg, rows = [], timeout, exec = run, log = () => {}, prepared = null }) {
  const no = (why, extra = {}) => ({ ok: false, why, ...extra });
  if (!base) return no('no base to compare with');
  if (!failing) return no('the failing tests could not be read per test (only the node test runner, naming no reporter of its own, is)');
  if (!failing.length) return no('the suite failed with no failing test to compare (a crash, a timeout or a load failure outside any test)');
  if (failing.length > MAX_BASE_RED) return no(`${failing.length} tests fail, over the ${MAX_BASE_RED} a base-red run may tolerate`);
  const files = [...new Set(failing.map((t) => t.file))];
  const missing = files.filter((f) => !exists(root, base, f));
  if (missing.length) return no(`new failing test file(s) not on the base: ${missing.slice(0, 5).join(', ')}`);
  const end = Date.now() + timeout;
  const left = () => Math.max(1000, end - Date.now());
  const opts = { lockfiles: cfg.lockfiles || [], rows, exec, log };
  if (prepared && !prepared.used && prepared.base === base) {
    prepared.used = true;
    try {
      const p = prepared.wait(left());
      const altered = p?.ok ? changedInTree(root, base, prepared.wt) : null;
      if (p?.ok && !altered) return compareAt(root, entry, prepared.wt, prepared.dir, { base, failing, files, left, log });
      if (altered) log(`base-red: ${altered} in the base's tree prepared beside the head is not the base's: the tree is prepared here`);
      // Prepared beside the head, at a lower priority, on a deadline from the gate's start: a
      // failed install or build there may be the head's load or time, not the base's. Prepared
