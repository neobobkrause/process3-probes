// ===== file: layerflow.test.mjs (continued) =====

  // layer sync opens its PR (the gate decides): the pin move's own step (PD-23).
  const made = [];
  await layerSync(root, 1, { io: syncIO(bare, made), wait: false, log: quiet });
  assert.equal(made.length, 1);
  const { head: branch, base: into } = made[0];
  assert.equal(syncOfBranch(branch), 1, 'the gate knows the branch layer sync names');
  git(['fetch', '-q', 'origin'], { cwd: root });
  const base = git(['rev-parse', 'origin/layer/1'], { cwd: root });
  const head = git(['rev-parse', `origin/${branch}`], { cwd: root });
  // The process clone as the gate reads it: p1 and p2 released, p2 forward, p2's shim.
  const shimHash = spawnSync('git', ['hash-object', '--stdin'], { input: 'name: gate v2\n', encoding: 'utf8' }).stdout.trim();
  const repo = { released: (p) => [p1, p2].includes(p), descends: (a, b) => a === b || (a === p1 && b === p2), shim: (p, n) => (p === p2 && n === 'process-gate.yml' ? shimHash : null), text: () => null };
  // The checkout: GitHub's merge of the head into the base (the head, which holds the base).
  git(['checkout', '-q', '--detach', head], { cwd: root });
  const c = gateClassAt(root, { base, head, branch, baseRef: into, repo });
  assert.deepEqual([c.class, browserNeeded(c) ? 'keep' : 'skip'], ['pin-only', 'skip'], c.why);
  process.env.GITHUB_RUN_ID ||= '1';
  const lines = [];
  const g = gateRun(root, { base, head, branch, pr: 91, slug: 'o/p', repo, browserSkipped: true, io: { comments: () => [], getPR: () => ({ user: { login: 'bob' }, draft: false, base: { ref: into } }), verify: () => true }, exec: () => { throw new Error('nothing is installed or built'); }, log: (l) => lines.push(String(l)) });
  assert.deepEqual(g.findings, [], lines.join('\n'));
  assert.deepEqual([g.run.class, g.run.suite, g.run.scope], ['pin-only', 'skipped', []]);
  assert.match(g.run.class_why, /^layer sync 1: the pin /);
  // A job's PR into the same layer, at the same tip, carrying the same pin: full, its suite run.
  const hj = jobWork(bare, 'c', { 'src/c/index.mjs': 'export const c = 7;\n' }, { from: `origin/${branch}` });
  git(['fetch', '-q', 'origin'], { cwd: root });
  git(['checkout', '-q', '--detach', hj], { cwd: root });
  assert.equal(gateClassAt(root, { base, head: hj, branch: 'job/c', baseRef: into, repo }).class, 'full');
  git(['checkout', '-q', 'tranche'], { cwd: root });
  // Landed on the green gate; the layer holds the tranche's pin; no sync owed; the layer merges.
  const r = await layerSync(root, 1, { io: { ...syncIO(bare, made), openPRs: (s, b) => (b === 'layer/1' ? [{ number: 91, head: { ref: branch, sha: head } }] : []) }, log: quiet });
  assert.equal(r.synced, true);
  git(['fetch', '-q', 'origin'], { cwd: root });
  assert.equal(git(['ls-tree', 'origin/layer/1', '--', '.process'], { cwd: root }).split(/\s+/)[2], p2);
  const mio = { slug: 'o/p', openPRs: () => [], findPR: () => null, createPR: (s, q) => ({ number: 99, ...q, base: { ref: q.base } }), checkRun: () => ({ status: 'completed', conclusion: 'success' }), merge: (s, k, sha, title) => ghMerge(bare, 'tranche', sha, title), roundClose: () => ({ ran: false, owed: null }) };
  const m = await layerMerge(root, 1, { io: mio, wait: false, log: quiet });
  assert.equal(m.ok, true);
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

// ===== file: close-workflows.test.mjs =====

// A close's workflow changes (Bob, 4 Nov, about 07:04: product workflow changes are not his to
// bring). The tranche into main, normal or bootstrap, may carry a product workflow change that
// reached the tranche through gated pull requests, defines no job named like a required or
// process check, and widens no permission; process-gate.yml must still be the pin's own shim.
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { mergePlain } from '../lib/merge.mjs';
import { workflowShapes } from '../lib/workflows.mjs';
import { readFileSync } from 'node:fs';
import { BOT, GATE, block } from '../lib/github.mjs';
import { DEFAULTS, git } from '../lib/util.mjs';
import { entry, makeRepo, write } from './helpers.mjs';

// A commit of only these files: `git add -A` would drop the pin's gitlink, which has no checkout.
const commit = (root, files, msg = 'change') => { write(root, files); git(['add', '--', ...Object.keys(files)], { cwd: root }); git(['commit', '-q', '-m', msg], { cwd: root }); return git(['rev-parse', 'HEAD'], { cwd: root }); };

const PIN = 'a'.repeat(40);
const SHIM = 'name: process-gate\non: pull_request\n';
const MAIN_PR = 70;

// The copy's container-images.yml and regression.yml, cut down to what the rules read.
const IMAGES = (extra = '') => `# container-images.yml: builds the fleet's images
name: container-images

on:
  push:
    branches: ["dist/cut-*"]
    paths: ["agent-runner/Dockerfile",
            ".github/workflows/container-images.yml"]
  workflow_dispatch:

permissions:
  contents: read
  packages: write

jobs:
  image:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        include:
          - { name: agent-runner, context: agent-runner }${extra}
    steps:
      - uses: actions/checkout@v4
      - name: build and push
        run: |
          echo "gate:"
          echo building
`;
const REGRESSION = (extra = '') => `name: regression
on:
  workflow_dispatch:
permissions:
  contents: read
jobs:
  regression:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - run: |
        set -euo pipefail
        for pkg in bio-plane pdf-worker${extra}; do echo $pkg; done
        echo done
`;

function processRepo(root) {
  const shim = git(['hash-object', '-w', '--stdin'], { cwd: root, input: SHIM });
  return { released: (p) => p === PIN, shim: (p, name) => (name === 'process-gate.yml' ? shim : null), descends: () => true };
}

// A product: main with the product workflows (and, unless bootstrap, Process3); a tranche that
// takes Process3 and then each change in `steps`, in order: { via: 'plain' | 'job' | 'direct',
// files, red, unverified }. Plain and job changes merge as merge --plain and merge write them.
function product({ bootstrap = true, steps = [], ledger = [], pre = [] } = {}) {
  const mainFiles = { 'README.md': 'x', '.github/workflows/container-images.yml': IMAGES(), '.github/workflows/regression.yml': REGRESSION() };
  for (const id of ledger) mainFiles[`process/ledger/${id}.json`] = entry(id, { paths: ['.github/workflows/regression.yml'], tests: [`test/${id}/`] });
  if (!bootstrap) mainFiles['process/config.json'] = { tranche: 'tranche' };
  const root = makeRepo(mainFiles);
  if (!bootstrap) { git(['update-index', '--add', '--cacheinfo', `160000,${PIN},.process`], { cwd: root }); git(['commit', '-q', '-m', 'pin'], { cwd: root }); }
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['checkout', '-q', '-b', 'tranche'], { cwd: root });
  // Earlier work: direct commits on the tranche before Process3, left out by record_since.
  let since = null;
  for (const files of pre) since = commit(root, files, 'earlier work, before Process3');
  let setAt = null;
  if (bootstrap) {
    setAt = commit(root, { 'process/config.json': { tranche: 'tranche', ...(since ? { record_since: since } : {}) }, '.github/workflows/process-gate.yml': SHIM }, 'Process3 setup on the tranche');
    git(['update-index', '--add', '--cacheinfo', `160000,${PIN},.process`], { cwd: root });
    git(['commit', '-q', '-m', 'the pin'], { cwd: root });
  } else commit(root, { '.github/workflows/process-gate.yml': SHIM }, 'the shim');
  const prs = new Map();
  const comments = new Map();
  steps.forEach((s, i) => {
    const n = 10 + i;
    const onto = git(['rev-parse', 'HEAD'], { cwd: root });
    if (s.via === 'direct') { commit(root, s.files, 'a direct commit'); return; }
    const branch = s.via === 'job' ? `job/${s.id}` : `bob/wf${i}`;
    git(['checkout', '-q', '-b', branch], { cwd: root });
    commit(root, typeof s.files === 'function' ? s.files(onto) : s.files, 'the workflow change');
    if (s.via === 'job') {
      const was = git(['show', `HEAD:process/metrics/${s.id}.jsonl`], { cwd: root, allowFail: true });
      commit(root, { [`process/metrics/${s.id}.jsonl`]: (was.code === 0 ? was.stdout : '') + JSON.stringify({ row: 'merge', pr: n }) + '\n' });
    }
    const tip = git(['rev-parse', 'HEAD'], { cwd: root });
    git(['checkout', '-q', 'tranche'], { cwd: root });
    git(['merge', '-q', '--no-ff', branch, '-m', s.via === 'job' ? `Merge job PR ${n}` : `Merge PR ${n}: ${branch} into tranche`], { cwd: root });
    if (s.evil) commit(root, s.evil, 'amend'), git(['reset', '-q', '--soft', 'HEAD~1'], { cwd: root }), git(['commit', '-q', '--amend', '--no-edit'], { cwd: root });
    const m = git(['rev-parse', 'HEAD'], { cwd: root });
    prs.set(n, { number: n, merged: true, merge_commit_sha: m, base: { ref: 'tranche' }, head: { ref: branch, sha: tip, repo: { full_name: 'o/r' } }, user: { login: 'civicsmith' } });
    const ok = !s.red;
    const row = { sha: tip, base: onto, run_id: 100 + n, trigger: 'code', scope: s.via === 'job' ? [s.id] : [], suite: ok ? 'pass' : 'fail', ok, findings: ok ? 0 : 1, verified: !s.unverified };
    comments.set(n, [{ id: n, body: block(GATE, { runs: [row] }), user: { login: BOT } }]);
  });
  const sha = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  return { root, sha, prs, comments, setAt };
}

function io(r, { rules = { checks: [{ context: 'gate' }] }, owned = null } = {}) {
  const calls = { merged: null };
  const main = () => ({ state: 'open', draft: false, mergeable: true, base: { ref: 'main', repo: { full_name: 'o/r', default_branch: 'main' } }, head: { ref: 'tranche', sha: r.sha, repo: { full_name: 'o/r' } } });
  return {
    calls,
    io: {
      getPR: (s, n) => (n === MAIN_PR ? main() : r.prs.get(n)),
      prsFromBranch: (s, b) => [...r.prs.values()].filter((x) => x.head.ref === b),
      baseEverChanged: () => false,
      comments: (s, n) => r.comments.get(n) || [],
      verify: (s, row, ctx) => row.verified === true && r.prs.get(ctx.pr)?.head.sha === row.sha && ctx.baseRef === 'tranche' && ctx.merged?.branch === r.prs.get(ctx.pr)?.head.ref,
      requiredChecks: () => rules,
      checkRuns: () => [{ status: 'completed', conclusion: 'success', started_at: '2026-11-04T06:00:00Z' }],
      repo: processRepo(r.root),
      lookup: (args) => (owned && args[1].split('/').pop() === owned
        ? { author: { login: DEFAULTS.approvals.owner }, committer: { login: 'web-flow' }, commit: { verification: { verified: true } } }
        : { author: { login: 'civicsmith' }, committer: { login: 'civicsmith' }, commit: { verification: { verified: false } } }),
      mergePR: (slug, n, sha, o) => { calls.merged = { sha, ...o }; return { merged: true, sha: 'm'.repeat(40) }; },
    },
  };
}
const q = { slug: 'o/r', noReview: 'a test', log: () => {} };
const close = (r, o) => { const f = io(r, o); return { f, go: () => mergePlain(r.root, MAIN_PR, { ...q, io: f.io }) }; };
const imagesRow = '\n          - { name: reader-container, context: reader-container }';
const STYLE = [
  { via: 'plain', files: { '.github/workflows/container-images.yml': IMAGES(imagesRow) } },
  { via: 'plain', files: { '.github/workflows/regression.yml': REGRESSION(' site') } },
];

test('a close carries container-images.yml and regression.yml style changes that came through gated plain pull requests, bootstrap or not', () => {
  for (const bootstrap of [true, false]) {
    const r = product({ bootstrap, steps: STYLE });
    const c = close(r);
    assert.equal(c.go().merged, true, `bootstrap ${bootstrap}`);
    assert.equal(c.f.calls.merged.sha, r.sha);
  }
});

test('a close carries a workflow change that came through a gated job merge', () => {
  const r = product({ ledger: ['m0'], steps: [{ via: 'job', id: 'm0', files: { '.github/workflows/regression.yml': REGRESSION(' site') } }] });
  assert.equal(close(r).go().merged, true);
});

test('a workflow change that came in by an ungated commit is refused, naming rule 1', () => {
  const direct = product({ steps: [{ via: 'direct', files: { '.github/workflows/regression.yml': REGRESSION(' site') } }] });
  const c = close(direct);
  assert.throws(c.go, /changes \.github\/workflows\/regression\.yml: rule 1: it was changed by [0-9a-f]{10}, a direct commit on tranche/);
  assert.equal(c.f.calls.merged, null);
  // Through a plain PR whose gate was red, or whose row is not verified.
  assert.throws(close(product({ steps: [{ ...STYLE[1], red: true }] })).go, /rule 1: .*newest gate run on its head [0-9a-f]{10} is red/);
  assert.throws(close(product({ steps: [{ ...STYLE[1], unverified: true }] })).go, /rule 1: .*not bound to the PR or not verified/);
  // A gated PR, then a direct commit over it.
  const over = product({ steps: [STYLE[1], { via: 'direct', files: { '.github/workflows/regression.yml': REGRESSION(' site agent') } }] });
  assert.throws(close(over).go, /rule 1: .*a direct commit on tranche/);
  // A merge that resolved the file to other bytes than the gated head's.
  const evil = product({ steps: [{ ...STYLE[1], evil: { '.github/workflows/regression.yml': REGRESSION(' evil') } }] });
  assert.throws(close(evil).go, /rule 1: .*does not carry the file as the PR's gated head had it/);
  // The PR's branch had another PR into another base: its rows do not bind.
  const other = product({ steps: [STYLE[1]] });
  const o = close(other);
  o.f.io.prsFromBranch = (s, b) => [...other.prs.values(), { number: 99, head: { ref: b }, base: { ref: 'main' } }].filter((x) => x.head.ref === b);
  assert.throws(o.go, /rule 1: .*also had pull request\(s\) 99 into another base/);
  // A job merge whose gate was red.
  const job = product({ ledger: ['m0'], steps: [{ via: 'job', id: 'm0', red: true, files: { '.github/workflows/regression.yml': REGRESSION(' site') } }] });
  assert.throws(close(job).go, /rule 1: .*is PR 10's merge, but the newest gate run on its merged result/);
});

test('process-gate.yml must still be the pin\'s own shim at a close (rule 4); plain pull requests into the tranche stay shim-only', () => {
  const r = product({ steps: [{ via: 'plain', files: { '.github/workflows/process-gate.yml': SHIM + '# edited\n' } }] });
  assert.throws(close(r).go, /process-gate\.yml is not the process's own shim at aaaaaaaaaa \(rule 4\)/);
});

test('main merged into the tranche passes a workflow file it leaves as main has it, and not one it resolves otherwise', () => {
  const build = (resolve) => {
    const r = product({ steps: [STYLE[1]] });
    // main moves on (a workflow edit on main itself), and the tranche takes main in.
    git(['checkout', '-q', 'main'], { cwd: r.root });
    commit(r.root, { '.github/workflows/container-images.yml': IMAGES('\n          - { name: on-main, context: x }') }, 'main moves');
    git(['checkout', '-q', 'tranche'], { cwd: r.root });
    git(['merge', '-q', '--no-ff', 'main', '-m', 'Bring main in'], { cwd: r.root });
    if (resolve) { commit(r.root, { '.github/workflows/container-images.yml': resolve }, 'x'); git(['reset', '-q', '--soft', 'HEAD~1'], { cwd: r.root }); git(['commit', '-q', '--amend', '--no-edit'], { cwd: r.root }); }
    r.sha = git(['rev-parse', 'HEAD'], { cwd: r.root });
    git(['push', '-q', '-f', 'origin', 'main', 'tranche'], { cwd: r.root });
    git(['checkout', '-q', 'main'], { cwd: r.root });
    return r;
  };
  assert.equal(close(build(null)).go().merged, true);
  assert.throws(close(build(IMAGES('\n          - { name: smuggled, context: x }'))).go, /container-images\.yml: rule 1: it was changed by [0-9a-f]{10}, which is not a merge of a pull request/);
});

test('coordinator, 4 Nov 08:13: a take-in tip does not mark a direct commit as earlier work', () => {
  // A direct post-setup commit D, then a job whose start row names D as its take-in tip.
  const r = product({ ledger: ['m0'], steps: [
    { via: 'direct', files: { '.github/workflows/regression.yml': REGRESSION(' site') } },
    { via: 'job', id: 'm0', files: (d) => ({ 'process/metrics/m0.jsonl': JSON.stringify({ event: 'start', take_in: { tip: d } }) + '\n' }) },
  ] });
  assert.throws(close(r).go, /regression\.yml: rule 1: it was changed by [0-9a-f]{10}, a direct commit on tranche/);
});

// The copy's two real diffs (civicsmith-copy main 0dea5a6e against tranche 3e095aa5).
const FIX = (n) => readFileSync(join(import.meta.dirname, 'fixtures', 'close-workflows', n), 'utf8');
const shape = (head, base) => workflowShapes(head, base);
const NONE = /rule 3: the hunk at base line \d+ .* fits no allowed shape/;

test('coordinator, 4 Nov 08:24: the copy\'s two real workflow diffs fit the allowed shapes', () => {
  assert.equal(shape(FIX('tranche-container-images.yml'), FIX('main-container-images.yml')), null, 'S2 paths, S3 a matrix row');
  assert.equal(shape(FIX('tranche-regression.yml'), FIX('main-regression.yml')), null, 'S1 inside run blocks, comments included');
  assert.equal(shape(FIX('main-regression.yml'), FIX('main-regression.yml')), null, 'no change');
});

test('coordinator, 4 Nov 08:24: every bypass of the four review rounds fits no shape', () => {
  const B = REGRESSION();
  const add = (after, lines) => B.replace(after, `${after}${lines}`);
  for (const head of [
    B + '  gate:\n    runs-on: x\n',
    B.replace('permissions:\n  contents: read\n', 'permissions:\n  contents: write\n'),
    B.replace('on:\n  workflow_dispatch:\n', 'on:\n  pull_request_target:\n'),
    B.replace('on:\n  workflow_dispatch:\n', 'on:\n- workflow_dispatch\n- "pull_request_\\x74arget"\n'),
    B.replace('jobs:\n', '"j\\x6fbs":\n  build:\n    permissions: write-all\njobs:\n'),
    add('    runs-on: ubuntu-latest\n', '    name: >-\n      gate\n'),
    add('    runs-on: ubuntu-latest\n', '    strategy:\n      matrix:\n        os: [ubuntu-latest]\n'),
    add('    runs-on: ubuntu-latest\n', '    !!str permissions: write-all\n'),
    add('    runs-on: ubuntu-latest\n', '    env:\n      X: "1\n    permissions: {}\n    zz: "\n'),
    '{on: push, permissions: write-all, jobs: {gate: {runs-on: ubuntu-latest}}}\n',
    add('    runs-on: ubuntu-latest\n', '    # c\x85    permissions: write-all\n'),
  ]) assert.match(shape(head, B) || '', /rule 3: /, head);
  // A new or removed workflow fits no shape.
  assert.match(shape(B, null), /rule 3: it is a new workflow/);
});

test('coordinator, 4 Nov 08:24: S1 holds only lines inside an existing run block', () => {
  const B = REGRESSION();
  const inside = (l) => B.replace('        set -euo pipefail\n', `        set -euo pipefail\n${l}`);
  assert.equal(shape(inside('        echo more\n'), B), null);
  assert.equal(shape(inside('          deeper: is still script\n'), B), null);
  assert.equal(shape(inside('\n'), B), null);
  // A line less deep than the block's first line would end it; one at the step's level is a key.
  assert.match(shape(inside('      permissions: write-all\n'), B) || '', NONE);
  assert.match(shape(inside('       x\n'), B) || '', NONE);
  // After the block's last line, or before its first, is outside it.
  assert.match(shape(B.replace('        echo done\n', '        echo done\n        echo after\n'), B) || '', NONE);
  assert.match(shape(B.replace('    - run: |\n', '    - run: |\n        echo first\n'), B) || '', NONE);
  // Not plain ASCII, or a tab.
  assert.match(shape(inside('        echo caf\u00e9\n'), B) || '', /outside printable ASCII/);
  assert.match(shape(inside('        \techo\n'), B) || '', NONE);
  // A run block with an explicit indentation indicator is not one S1 reads.
  const ind = B.replace('    - run: |\n', '    - run: |2\n');
  assert.match(shape(ind.replace('        set -euo pipefail\n', '        set -euo pipefail\n        x\n'), ind) || '', NONE);
});

test('coordinator, 4 Nov 08:24: S2 holds only quoted paths inside an existing multi-line paths list', () => {
  const B = IMAGES();
  const ins = (l) => B.replace('    paths: ["agent-runner/Dockerfile",\n', `    paths: ["agent-runner/Dockerfile",\n${l}`);
  assert.equal(shape(ins('            "reader/src/**",\n'), B), null);
  assert.equal(shape(ins('            "a/b", "c/*.json",\n'), B), null);
  for (const l of ['            "a: b",\n', '            "a{b}",\n', '            "a\\"b",\n', '            a/b,\n', '            "a/b"], other: [\n', '        "a/b",\n'])
    assert.match(shape(ins(l), B) || '', NONE, l);
  // Not into branches (it would widen where a write token runs), and not after the list.
  const br = B.replace('    branches: ["dist/cut-*"]\n', '    branches: ["dist/cut-*",\n               "x"]\n');
  assert.match(shape(br.replace('               "x"]\n', '               "main",\n               "x"]\n'), br) || '', NONE);
  assert.match(shape(B.replace('  workflow_dispatch:\n', '            "x",\n  workflow_dispatch:\n'), B) || '', NONE);
});

test('coordinator, 4 Nov 08:24: S3 holds only a matrix row with a sibling row\'s keys', () => {
  const B = IMAGES();
  const row = '          - { name: agent-runner, context: agent-runner }';
  const plus = (l) => B.replace(`${row}\n`, `${row}\n${l}`);
  assert.equal(shape(plus('          - { context: b, name: a }\n'), B), null);
  assert.match(shape(plus('          - { name: a, context: b, run: c }\n'), B) || '', NONE);
  assert.match(shape(plus('          - { name: a }\n'), B) || '', NONE);
  assert.match(shape(plus('          - { name: a, context: "b c" }\n'), B) || '', NONE);
  assert.match(shape(plus('          - { name: a, context: ${{ x }} }\n'), B) || '', NONE);
  assert.match(shape(plus('        - { name: a, context: b }\n'), B) || '', NONE);
  // A hunk that mixes a row with any other line.
  assert.match(shape(plus('          - { name: a, context: b }\n    permissions: write-all\n'), B) || '', NONE);
});

test('coordinator, 4 Nov 08:24: through mergePlain, a shape-breaking change refuses the close, naming the file and the hunk', () => {
  const r = product({ steps: [{ via: 'plain', files: { '.github/workflows/regression.yml': REGRESSION() + '  gate:\n    runs-on: x\n' } }] });
  assert.throws(close(r).go, /changes \.github\/workflows\/regression\.yml: rule 3: the hunk at base line \d+ .*fits no allowed shape/);
  const n = product({ steps: [{ via: 'plain', files: { '.github/workflows/new.yml': 'on: push\n' } }] });
  assert.throws(close(n).go, /new\.yml: rule 3: it is a new workflow/);
  // A pre-Process3 edit is judged by the shapes too.
  const pre = product({ pre: [{ '.github/workflows/regression.yml': REGRESSION() + '  gate:\n    runs-on: x\n' }] });
  assert.throws(close(pre, { owned: pre.setAt }).go, /regression\.yml: rule 3: .*fits no allowed shape/);
  const ok = product({ pre: [{ '.github/workflows/regression.yml': REGRESSION(' site') }] });
  assert.equal(close(ok, { owned: ok.setAt }).go().merged, true);
  assert.throws(close(ok).go, /regression\.yml: rule 1: it was changed by [0-9a-f]{10}, a direct commit on tranche/);
});

test('the rule 1 gate checks: a PR whose gate ran on its own process-gate.yml certifies nothing', () => {
  const fake = { '.github/workflows/process-gate.yml': 'name: fake\non: pull_request\n' };
  const p = product({ steps: [{ via: 'plain', files: { ...fake, '.github/workflows/regression.yml': REGRESSION(' site') } }, { via: 'plain', files: { '.github/workflows/process-gate.yml': SHIM } }] });
  assert.throws(close(p).go, /regression\.yml: rule 1: .*PR 10's merge, but [0-9a-f]{10}, which its gate ran on, does not hold the pin's own process-gate\.yml/);
  const j = product({ ledger: ['m0'], steps: [{ via: 'job', id: 'm0', files: { ...fake, '.github/workflows/regression.yml': REGRESSION(' site') } }, { via: 'plain', files: { '.github/workflows/process-gate.yml': SHIM } }] });
  assert.throws(close(j).go, /regression\.yml: rule 1: .*PR 10's merge, but [0-9a-f]{10}, which its gate ran on/);
});

test('plain text only: line breaks other than \\n, a BOM past the start, new non-ASCII lines are refused', () => {
  const B = REGRESSION();
  const inside = (l) => B.replace('        set -euo pipefail\n', `        set -euo pipefail\n${l}`);
  for (const [l, re] of [['        a\r\n', /U\+000D/], ['        a\u2028\n', /U\+2028/], ['        a\u2029\n', /U\+2029/], ['        a\x85\n', /U\+0085/], ['        \ufeffa\n', /byte-order mark/]])
    assert.match(shape(inside(l), B) || '', re, JSON.stringify(l));
  assert.equal(shape(`\ufeff${inside('        a\n')}`, B), null);
});

// ===== file: no-code.test.mjs =====

// C22 (the coordinator, 7 Nov): a brand-new module with no code could not enter the copy. BOB's
// funding-register (BD-15 PF-6): its gate ran the suite over folders that did not exist yet
// ("the funding-register suite failed (exit 1): {total:0}"), and the pull request that adds its
// modules row (which regenerates order.mjs) could not also carry its requirements file.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { refreshOthers } from '../lib/checks.mjs';
import { addedRequirements, gate, noCodeYet } from '../lib/gate.mjs';
import { BOT, block } from '../lib/github.mjs';
import { DEFAULTS, git } from '../lib/util.mjs';
import { commit, entry, makeRepo } from './helpers.mjs';

const io = (baseRef) => {
  const comments = [];
  return { comments: () => comments, getPR: () => ({ user: { login: 'acmewidget' }, ...(baseRef ? { base: { ref: baseRef } } : {}) }), addComment: (s, n, body) => { comments.push({ id: comments.length + 1, body, user: { login: BOT } }); return {}; }, verify: () => true };
};

test('a module with no code yet: its suite is skipped with the reason recorded, until its first commit adds code', () => {
  // A ready job PR into a layer branch runs its suite on records only (layerflow.mjs).
  const root = makeRepo({ 'process/config.json': { merge_strategy: 'layer' }, 'process/ledger/fund.json': entry('fund', { status: { state: 'WORKING' } }), 'req/fund.md': '# fund\n\n- **R1** one\n' });
  git(['branch', 'tranche'], { cwd: root });
  const base = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', '-b', 'job/fund'], { cwd: root });
  // Its first commit names its uses (the ledger entry only): no requirements-only run, so the suite would run.
  const head = commit(root, { 'process/ledger/fund.json': entry('fund', { status: { state: 'WORKING' }, uses: [] }) });
  const lines = [];
  const r = gate(root, { base, head, branch: 'job/fund', pr: 5, slug: 'o/r', io: io('layer/1'), log: (l) => lines.push(String(l)) });
  assert.deepEqual(r.findings.filter((f) => f.check === 'suite'), [], JSON.stringify(r.findings));
  assert.equal(r.run.no_code?.[0]?.module, 'fund', JSON.stringify({ run: r.run, findings: r.findings, lines }).slice(0, 3000));
  assert.match(r.run.no_code[0].why, /no file under its paths or tests yet \(src\/fund\/, test\/fund\/\)/);
  assert.ok(lines.some((l) => /the fund suite: no file under its paths/.test(l)), lines.join('\n'));
  // Once code is there, a suite with no test is refused as before.
  const head2 = commit(root, { 'src/fund/index.mjs': 'export const x = 1;\n' });
  const r2 = gate(root, { base, head: head2, branch: 'job/fund', pr: 5, slug: 'o/r', io: io(), log: () => {} });
  assert.ok(r2.findings.some((f) => f.check === 'suite'), JSON.stringify(r2.findings));
  assert.equal(r2.run.no_code, undefined);
});

// Cold review of C22: a module that had code and lost it is not a new one.
test('a job deleting its module\'s code stays red; no skip at the tranche into main', () => {
  const root = makeRepo({ 'process/ledger/fund.json': entry('fund', { status: { state: 'WORKING' } }), 'req/fund.md': '# fund\n', 'src/fund/index.mjs': 'export const x = 1;\n', 'test/fund/x.test.mjs': "import test from 'node:test'; test('x', () => {});\n" });
  git(['branch', 'tranche'], { cwd: root });
  const base = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', '-b', 'job/fund'], { cwd: root });
  git(['rm', '-q', '-r', 'src/fund', 'test/fund'], { cwd: root });
  git(['commit', '-q', '-m', 'delete it all'], { cwd: root });
  const head = git(['rev-parse', 'HEAD'], { cwd: root });
  const r = gate(root, { base, head, branch: 'job/fund', pr: 5, slug: 'o/r', io: io(), log: () => {} });
  assert.ok(r.findings.some((f) => f.check === 'suite'), JSON.stringify(r.findings));
  assert.equal(r.run.no_code, undefined);
  assert.equal(noCodeYet(root, entry('fund'), { at: base }), false, 'code at the start: not new');
  assert.equal(noCodeYet(root, entry('fund')), true, 'the checkout alone holds none');
});

test('noCodeYet: tracked files only, in the checkout and where the change started; empty lists count as none', () => {
  const root = makeRepo({ 'README.md': 'x\n' });
  const start = git(['rev-parse', 'HEAD'], { cwd: root });
  assert.equal(noCodeYet(root, entry('a'), { at: start }), true);
  assert.equal(noCodeYet(root, entry('a', { paths: [], tests: [] }), { at: start }), true);
  mkdirSync(join(root, 'src', 'a'), { recursive: true });
  writeFileSync(join(root, 'src', 'a', 'built.mjs'), '// a build step wrote this\n');
  assert.equal(noCodeYet(root, entry('a'), { at: start }), true, 'an untracked file a build made is no code');
  commit(root, { 'test/a/x.test.mjs': '\n' });
  assert.equal(noCodeYet(root, entry('a'), { at: start }), false);
});

// A product with a generated row and a new module, as the copy's funding-register came: the gate's
// refresh check and the merge tool read the same list.
function product() {
  const root = makeRepo({ 'process/ledger/old.json': entry('old', { requirements: 'build/requirements/old.md' }), 'build/requirements/old.md': '# old\n', 'tool/gen-lib.mjs': '//\n' });
  const from = git(['rev-parse', 'HEAD'], { cwd: root });
  return { root, from };
}
const cfg = { ...DEFAULTS, modules_file: 'process/modules.json', layers_file: 'process/layers.md', requirements_dir: 'build/requirements' };

test('beside a refresh: only <requirements_dir>/<id>.md of a module the change adds, added by the change', () => {
  const { root, from } = product();
  const to = commit(root, { 'process/ledger/fund.json': entry('fund', { requirements: 'build/requirements/fund.md' }), 'build/requirements/fund.md': '# fund\n' });
  const also = addedRequirements(root, cfg, { from, to });
  assert.deepEqual(also, ['build/requirements/fund.md']);
  const rows = [{ paths: ['src/order.mjs'], regenerate: ['node', 'gen.mjs'], verify: ['node', 'gen.mjs', '--check'] }];
  const changed = ['src/order.mjs', 'process/modules.json', 'process/ledger/fund.json', 'build/requirements/fund.md'];
  assert.deepEqual(refreshOthers(cfg, rows, changed, [], [], { also }), []);
  assert.deepEqual(refreshOthers(cfg, rows, changed, []), ['build/requirements/fund.md'], 'no added module: refused as before');
  const named = [{ ...rows[0], regenerate: ['node', 'gen.mjs', 'build/requirements/fund.md'] }];
  assert.deepEqual(refreshOthers(cfg, named, changed, [], [], { also }), ['build/requirements/fund.md'], 'a file a row names');
  // An entry naming no requirements: the default path.
  const { root: r2, from: f2 } = product();
  const t2 = commit(r2, { 'process/ledger/fund.json': { ...entry('fund'), requirements: undefined }, 'build/requirements/fund.md': '# fund\n' });
  assert.deepEqual(addedRequirements(r2, cfg, { from: f2, to: t2 }), ['build/requirements/fund.md']);
});

test('beside a refresh: a new entry naming any other file, an existing one, or a renamed entry brings nothing', () => {
  for (const req of ['tool/gen-lib.mjs', 'package-lock.json', './build/requirements/old.md', 'build/requirements/../../tool/x.mjs', 'build/requirements/old.md']) {
    const { root, from } = product();
    const to = commit(root, { 'process/ledger/fund.json': entry('fund', { requirements: req }), 'build/requirements/fund.md': '# fund\n' });
    assert.deepEqual(addedRequirements(root, cfg, { from, to }), [], req);
  }
  // A renamed entry keeps old.md: old.md is no new module's file.
  const { root, from } = product();
  git(['rm', '-q', 'process/ledger/old.json'], { cwd: root });
  const to = commit(root, { 'process/ledger/old2.json': entry('old2', { requirements: 'build/requirements/old.md' }) });
  assert.deepEqual(addedRequirements(root, cfg, { from, to }), []);
  // The default path, already there before the change (an entry repaired, or the file kept): not added.
  const p = product();
  commit(p.root, { 'build/requirements/fund.md': '# fund, before\n' });
  const f3 = git(['rev-parse', 'HEAD'], { cwd: p.root });
  const t3 = commit(p.root, { 'process/ledger/fund.json': entry('fund', { requirements: 'build/requirements/fund.md' }), 'build/requirements/fund.md': '# fund\n' });
  assert.deepEqual(addedRequirements(p.root, cfg, { from: f3, to: t3 }), []);
});

// ===== file: carry.mjs =====

// Tranche carry (Build Plan Phase 3, SHM-4): a product converting mid-tranche has pull requests
// made before Process3. The open ones into the tranche (into main while no tranche exists) that
// no ledger entry owns are listed, each with the module whose paths own all its files or "no
// single module", for BOB to take in with `job start <id> --take-in <n>` or leave as a plain
// pull request. Read-only: nothing is closed or rewritten here.
import { entriesAt, ownPaths } from './gate.mjs';
import { rowsAt, rowsAtEach } from './metrics.mjs';
import { branchModule } from './ledger.mjs';
import { gh, git, underPath } from './util.mjs';

// The marker line a take-in START carries (job start --take-in); a job pull request whose body
// has it owns the pull request it names.
export const TAKEN = /Earlier work taken in: pull request #(\d+)/;

export const prFiles = (slug, n) => {
  const pages = gh(['api', '--paginate', '--slurp', `repos/${slug}/pulls/${n}/files?per_page=100`], { allowFail: true });
  return Array.isArray(pages) ? pages.flat().map((f) => f.filename) : null;
};

// The pull requests a take-in recorded: the start rows' take_in.pr on ref and on each job's
// branch as this clone has it, and the marker in open job pull requests' bodies.
function takenIn(root, ref, ids, prs) {
  const taken = new Set();
  const all = new Set(ids);
  // No pull request to judge: nothing to read (C50).
  if (!prs.length) return taken;
  const heads = git(['for-each-ref', '--format=%(refname:lstrip=3)', 'refs/remotes/origin/job/'], { cwd: root, allowFail: true }).stdout.split('\n').filter(Boolean);
  const atRef = rowsAtEach(root, ref);
  for (const id of ids) {
    for (const r of [ref, ...heads.filter((h) => branchModule(h, all) === id).map((h) => `refs/remotes/origin/${h}`)]) {
      for (const row of r === ref ? atRef(id) : rowsAt(root, r, id)) if (row.take_in?.pr) taken.add(Number(row.take_in.pr));
    }
  }
  for (const p of prs) { const m = TAKEN.exec(p.body || ''); if (m && /^job\//.test(p.head?.ref || '')) taken.add(Number(m[1])); }
  return taken;
}

// The module that owns every file, or "no single module"; null files: not read.
export function owningModule(entries, files) {
  if (!files) return 'unknown (its files were not read)';
  const owners = entries.filter((e) => files.every((f) => ownPaths(e).some((p) => underPath(f, p))));
  return owners.length === 1 ? owners[0].id : 'no single module';
}

// prs: the open pull requests into the base (GitHub's list); ref: the base's ledger.
export function toTakeIn(root, { slug, ref, prs, files = prFiles }) {
  const entries = entriesAt(root, ref).filter((e) => e.id);
  const ids = new Set(entries.map((e) => e.id));
  const taken = takenIn(root, ref, [...ids], prs || []);
  return (prs || []).filter((p) => !ids.has(branchModule(p.head?.ref, ids)) && !taken.has(p.number)).map((p) => {
    let list = null;
    try { list = files(slug, p.number); } catch { list = null; }
    return { number: p.number, head: p.head?.ref, draft: !!p.draft, updated: p.updated_at || null, module: owningModule(entries, list) };
  });
}

export const takeInLine = (t, P3) => `#${t.number} ${t.head}${t.draft ? ' draft' : ''}: ${t.module === 'no single module' || t.module.startsWith('unknown') ? `${t.module}; leave it as a plain pull request, or BOB splits it` : `module ${t.module}; \`${P3} job start ${t.module} --sessions <file> --take-in ${t.number}\`, or leave it as a plain pull request`}`;

// ===== file: session-safety.test.mjs =====

