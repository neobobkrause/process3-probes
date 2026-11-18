// ===== file: report.test.mjs (continued) =====

  assert.equal(git(['rev-parse', '--is-shallow-repository'], { cwd: root }), 'true');
});

test('report tranche: in a depth-1 clone where main moved since the tranche opened, the base deepen fetched is vouched for', () => {
  const src = fixture();
  git(['checkout', '-q', 'main'], { cwd: src });
  commit(src, { 'src/h/1.js': '1\n' }, 'h1');
  git(['checkout', '-q', 'tranche'], { cwd: src });
  const root = cloneOf(src, true);
  const cfg = loadConfig(root);
  const deep = deepen(root, 'tranche');
  assert.deepEqual(deep, { base: git(['rev-parse', 'main^'], { cwd: src }), onMain: [] });
  assert.deepEqual(span(root, 'origin/tranche', 'origin/main'), { open: 'unmeasured', close: null, base: null }, 'cut history alone cannot place the base on main');
  const md = trancheReport(root, cfg, { now: NOW, deepened: deep, io: { merged: () => null } });
  assert.match(md, /\| a \| OPEN \| unmeasured \| 1 \(R1\) \|/);
  assert.match(md, /- record-only commits: 1 of 2 commits in the tranche/);
});

// ===== file: bootstrap-close.test.mjs =====

// The first close (bootstrap; coordinator, 4 Nov): the tranche into a default branch that holds no
// Process3 (the copy's main at 0dea5a6e: no .process, no config, no process workflows).
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { isBootstrap } from '../lib/anchor.mjs';
import { mergePlain } from '../lib/merge.mjs';
import { DEFAULTS, git } from '../lib/util.mjs';
import { commit, makeRepo, write } from './helpers.mjs';

const PIN = 'a'.repeat(40);
const SIDE = 'b'.repeat(40);
const SHIM = 'name: process-gate\non: pull_request\n';
const OWNER = DEFAULTS.approvals.owner;

// process3 as the tool's clone holds it: PIN released, SIDE not; the gate shim at any pin.
function processRepo(root) {
  const shim = git(['hash-object', '-w', '--stdin'], { cwd: root, input: SHIM });
  return { released: (p) => p === PIN, shim: (p, name) => (name === 'process-gate.yml' ? shim : null), descends: () => true };
}

// A product whose main has no Process3 and whose tranche gains it. `config`: the tranche's
// config; set at its own commit, `setAt`, which the lookup may call the owner's website commit.
// `pin`: the tranche's pin (null: none). `workflows`: files the tranche writes under .github/workflows.
// `mainFiles`: main's own files beyond the README and a product workflow.
function product({ config = { tranche: 'tranche' }, branch = 'tranche', pin = PIN, workflows = { 'process-gate.yml': SHIM }, mainFiles = {} } = {}) {
  const root = makeRepo({ 'README.md': 'x', '.github/workflows/regression.yml': 'on: push\n', ...mainFiles });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['checkout', '-q', '-b', branch], { cwd: root });
  const setAt = config === null ? null : commit(root, { 'process/config.json': config }, 'Process3 setup on the tranche');
  commit(root, { 'later.txt': 'the tranche moves on' });
  write(root, { 'job.txt': 'merged work', ...Object.fromEntries(Object.entries(workflows).map(([f, t]) => [`.github/workflows/${f}`, t])) });
  git(['add', '-A'], { cwd: root });
  if (pin) git(['update-index', '--add', '--cacheinfo', `160000,${pin},.process`], { cwd: root });
  git(['commit', '-q', '-m', 'the pin and the shims'], { cwd: root });
  const sha = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['push', '-q', 'origin', 'main', branch], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  return { root, sha, head: branch, setAt };
}

// GitHub's view of a commit: the owner's website commit only at `owned`.
const ghCommit = (owned) => (args) => (args[1].split('/').pop() === owned
  ? { author: { login: OWNER }, committer: { login: 'web-flow' }, commit: { verification: { verified: true } } }
  : { author: { login: 'civicsmith' }, committer: { login: 'civicsmith' }, commit: { verification: { verified: false } } });

const ok = (over = {}) => ({ status: 'completed', conclusion: 'success', started_at: '2026-11-04T06:00:00Z', ...over });
function io(r, { owned = r.setAt, rules = { checks: [{ context: 'gate' }] }, runs = { gate: [ok()] }, head = r.head } = {}) {
  const calls = { merged: null, asked: [] };
  const pr = () => ({ state: 'open', draft: false, mergeable: true, base: { ref: 'main', repo: { full_name: 'o/r', default_branch: 'main' } }, head: { ref: head, sha: r.sha, repo: { full_name: 'o/r' } } });
  return {
    calls,
    io: {
      getPR: pr,
      requiredChecks: () => rules,
      checkRuns: (slug, sha, name) => runs[name] || [],
      repo: processRepo(r.root),
      lookup: (args) => { calls.asked.push(args[1].split('/').pop()); return ghCommit(owned)(args); },
      mergePR: (slug, n, sha, o) => { calls.merged = { sha, ...o }; return { merged: true, sha: 'm'.repeat(40) }; },
    },
  };
}
const q = { slug: 'o/r', noReview: 'a test', log: () => {} };
const close = (r, o) => { const f = io(r, o); return { f, go: () => mergePlain(r.root, 7, { ...q, io: f.io }) }; };

test('a bootstrap close passes with a config the owner set through GitHub\'s website', () => {
  // The config names another approvals file and its own process: each took its value at the owner's commit.
  const r = product({ config: { tranche: 'tranche', process_repo: 'https://github.com/neobobkrause/process3', approvals: { file: 'AGENTS.md' } } });
  assert.equal(isBootstrap(r.root, 'origin/main'), true);
  const logs = [];
  const f = io(r);
  const out = mergePlain(r.root, 7, { ...q, io: f.io, log: (m) => logs.push(m) });
  assert.equal(out.merged, true);
  assert.equal(f.calls.merged.sha, r.sha);
  assert.equal(f.calls.merged.title, 'Merge PR 7: tranche into main');
  assert.ok(f.calls.asked.includes(r.setAt), 'the owner\'s commit was asked about');
  assert.match(logs.join('\n'), /main has no Process3: the first close, of the tranche tranche its own config names/);
  // A config that keeps every anchored key at its default asks GitHub nothing.
  const d = product();
  const g = io(d, { owned: 'none' });
  assert.equal(mergePlain(d.root, 7, { ...q, io: g.io }).merged, true);
  assert.deepEqual(g.calls.asked, []);
});

test('a bootstrap close is refused with a forged config: tranche, approvals or process_repo not the owner\'s', () => {
  // A session names its own branch the tranche and opens it into main.
  const t = product({ config: { tranche: 'bob/evil' }, branch: 'bob/evil' });
  assert.throws(close(t, { owned: 'none' }).go, /changes tranche in process\/config\.json; that needs the owner's word/);
  // The same, set by the owner on the website, passes: the head is the tranche its config names.
  assert.equal(close(t).go().merged, true);
  // Another owner, or another approvals file, set by a session.
  for (const approvals of [{ owner: 'civicsmith' }, { file: 'AGENTS.md' }, { heading: '## Anything goes' }]) {
    const a = product({ config: { tranche: 'tranche', approvals } });
    const c = close(a, { owned: 'none' });
    assert.throws(c.go, /changes approvals in process\/config\.json; that needs the owner's word/, JSON.stringify(approvals));
    assert.equal(c.f.calls.merged, null);
    // web-flow, but the head's own named owner is not the one that counts: the tool's default is.
    const named = close(a, { owned: 'none' });
    named.f.io.lookup = () => ({ author: { login: approvals.owner || 'civicsmith' }, committer: { login: 'web-flow' }, commit: { verification: { verified: true } } });
    if (approvals.owner) assert.throws(named.go, /changes approvals/);
  }
  const p = product({ config: { tranche: 'tranche', process_repo: 'https://example.com/other' } });
  assert.throws(close(p, { owned: 'none' }).go, /changes process_repo in process\/config\.json/);
  // GitHub cannot be read: refused.
  const u = close(product({ config: { tranche: 'tranche', approvals: { owner: 'civicsmith' } } }));
  u.f.io.lookup = () => null;
  assert.throws(u.go, /changes approvals/);
  // An unreadable config, or none: refused.
  assert.throws(close(product({ config: '{ "tranche": ' })).go, /the head's process\/config\.json cannot be read/);
  assert.throws(close(product({ config: null })).go, /main has no Process3, and the head has no process\/config\.json/);
});

test('a bootstrap close is refused from a head that is not the tranche its config names', () => {
  // The config says "tranche"; the pull request comes from another branch carrying it.
  const r = product({ branch: 'bob/plan' });
  assert.throws(close(r).go, /only the tranche tranche merges into main, not bob\/plan/);
  // The config names bob/plan (the owner's word), but the pull request is from "tranche".
  const s = product({ config: { tranche: 'bob/plan' } });
  assert.throws(close(s).go, /only the tranche bob\/plan merges into main, not tranche/);
});

test('a bootstrap close is refused with an unreleased pin, or none', () => {
  assert.throws(close(product({ pin: SIDE })).go, /the process pin bbbbbbbbbb is not a commit on process3's tranche or main/);
  assert.throws(close(product({ pin: null })).go, /main has no Process3, and the head has no process pin/);
});

test('a bootstrap close is refused with a process shim that is not the pin\'s own, or an ungated product workflow change', () => {
  // The copy, 4 Nov: container-images.yml and regression.yml changed on the tranche by sessions.
  const r = product({ workflows: { 'process-gate.yml': SHIM, 'regression.yml': 'on: push\njobs: {}\n' } });
  // Since Bob's word of 4 Nov a product workflow is judged by the close rules (close-workflows.test.mjs), not
  // sent to him: here it came in by an ungated commit.
  assert.throws(close(r).go, /regression\.yml: rule 1: it was changed by [0-9a-f]{10}, a direct commit on tranche/);
  const s = product({ workflows: { 'process-gate.yml': SHIM + '# edited\n' } });
  assert.throws(close(s).go, /process-gate\.yml is not the process's own shim/);
});

test('a bootstrap close needs the gate required by main and green on the head', () => {
  const r = product();
  assert.throws(close(r, { rules: { checks: [{ context: 'ci' }] }, runs: { ci: [ok()] } }).go, /main has no Process3, so its first close needs the gate.*its required checks: ci success/);
  const red = close(r, { runs: { gate: [ok({ conclusion: 'failure' })] } });
  assert.throws(red.go, /needs the gate.*gate failure/);
  assert.equal(red.f.calls.merged, null);
  assert.throws(close(r, { rules: { checks: [] } }).go, /main requires no checks/);
});

test('a base with Process3 is not a bootstrap: a normal close is unchanged', () => {
  // Main holds a config: its tranche's name and owner are main's, and GitHub's ruleset judges the checks.
  const r = product({ config: { tranche: 'tranche', node: '22' }, mainFiles: { 'process/config.json': { tranche: 'tranche' } } });
  assert.equal(isBootstrap(r.root, 'origin/main'), false);
  assert.equal(close(r, { rules: { checks: [{ context: 'ci' }] }, runs: { ci: [ok({ conclusion: 'failure' })] } }).go().merged, true, 'the ruleset, not the tool, judges a normal close\'s checks');
  // A head with no pin, into a main with a config and no pin: as before, no pin is no change.
  assert.equal(close(product({ config: { tranche: 'tranche', node: '22' }, pin: null, workflows: {}, mainFiles: { 'process/config.json': { tranche: 'tranche' } } })).go().merged, true);
  // A normal close anchors the approvals too (review of PR 96): main's owner's website commit, or refused.
  const a = product({ config: { tranche: 'tranche', approvals: { file: 'AGENTS.md' } }, mainFiles: { 'process/config.json': { tranche: 'tranche' } } });
  assert.throws(close(a, { owned: 'none' }).go, /changes approvals in process\/config\.json/);
  assert.equal(close(a).go().merged, true);
});

test('a main that had a config and deleted it is a normal close by its last config, not a bootstrap', () => {
  // Main's last config names bob/plan the tranche; a later commit deleted the config.
  const r = product({ mainFiles: { 'process/config.json': { tranche: 'bob/plan' } } });
  git(['checkout', '-q', 'main'], { cwd: r.root });
  git(['rm', '-q', 'process/config.json'], { cwd: r.root });
  git(['commit', '-q', '-m', 'drop the config'], { cwd: r.root });
  git(['push', '-q', 'origin', 'main'], { cwd: r.root });
  assert.equal(isBootstrap(r.root, 'origin/main'), false);
  assert.throws(close(r).go, /only the tranche bob\/plan merges into main, not tranche/);
});

test('a bootstrap retry stops when the base gained Process3 while the merge waited', () => {
  const r = product();
  const f = io(r);
  let tries = 0;
  f.io.mergePR = () => {
    tries++;
    // Someone else's close lands first: main now holds a config.
    git(['checkout', '-q', 'main'], { cwd: r.root });
    commit(r.root, { 'process/config.json': { tranche: 'tranche' } }, 'Process3 lands on main');
    git(['push', '-q', 'origin', 'main'], { cwd: r.root });
    return { merged: false, message: 'Base branch was modified. Review and try the merge again.' };
  };
  assert.throws(() => mergePlain(r.root, 7, { ...q, io: f.io, wait: 0 }), /main gained Process3 while pull request 7 was checked as its first close/);
  assert.equal(tries, 1);
});

test('a bootstrap close re-reads the base after the wait: Process3 landing during it refuses before any merge (review 4 of PR 97)', () => {
  const r = product();
  const f = io(r);
  let landed = false;
  const read = f.io.checkRuns;
  f.io.checkRuns = (...a) => {
    if (!landed) {
      landed = true;
      git(['checkout', '-q', 'main'], { cwd: r.root });
      commit(r.root, { 'process/config.json': { tranche: 'tranche' } }, 'Process3 lands on main');
      git(['push', '-q', 'origin', 'main'], { cwd: r.root });
    }
    return read(...a);
  };
  assert.throws(() => mergePlain(r.root, 7, { ...q, io: f.io }), /main gained Process3 while pull request 7 was checked as its first close/);
  assert.equal(f.calls.merged, null);
});

// ===== file: fetch-cheap.test.mjs =====

// Fewer reads of the state branch (R17f; coordinator's C12 part 2, 7 Nov: 275 fetches in an hour
// against 16 content-creating calls, most of them the product's state branch, read again by each
// command and each poll): every fetch is labelled with what it reads, in the log and the shares;
// a read that is not fresh takes the clone's copy when another p3 process fetched it within 30 s.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { fetchKind, usage, usageRows } from '../lib/pace.mjs';
import { git } from '../lib/util.mjs';
import { makeRepo } from './helpers.mjs';

const LIB = join(dirname(fileURLToPath(import.meta.url)), '..', 'lib');

test('each fetch says what it reads: the ledger, the state branch, or other; the counts are kept by kind', () => {
  assert.equal(fetchKind(['fetch', '-q', 'https://github.com/o/l.git', '+refs/heads/process-state:refs/p3/ledger/state']), 'ledger');
  assert.equal(fetchKind(['ls-remote', 'https://github.com/o/l.git', 'refs/heads/process-state']), 'ledger');
  assert.equal(fetchKind(['fetch', '-q', 'origin', '+refs/heads/process-state:refs/remotes/origin/process-state']), 'state');
  assert.equal(fetchKind(['fetch', '-q', 'origin', 'tranche']), 'other');
  const at = new Date().toISOString();
  const rows = [{ kind: 'fetch', at, of: 'state', session: 's' }, { kind: 'fetch', at, of: 'state', session: 's' }, { kind: 'fetch', at, of: 'ledger', session: 's' }, { kind: 'fetch', at, session: 's' }];
  const root = makeRepo({ 'README.md': 'x\n' });
  const shared = usageRows(root, { rows });
  assert.deepEqual(shared[0].fetches_by, { state: 2, ledger: 1, '?': 1 });
  const u = usage(root, { seconds: 60, rows: [], read: { at: Date.now(), use: shared } });
  assert.deepEqual([u.fetches, u.fetches_by], [4, { state: 2, ledger: 1, '?': 1 }]);
});

test('a read that is not fresh takes the clone\'s copy another process fetched within 30 s; a fresh one always fetches', () => {
  const root = makeRepo({ 'README.md': 'x\n' });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'HEAD:refs/heads/process-state'], { cwd: root });
  const log = join(mkdtempSync(join(tmpdir(), 'p3-log-')), 'log.jsonl');
  writeFileSync(log, '');
  // Each read its own p3 process, as each command and each poll is.
  const read = (fresh) => {
    const r = spawnSync(process.execPath, ['--input-type=module', '-e', `const { fetchState } = await import(${JSON.stringify(join(LIB, 'state.mjs'))}); console.log(fetchState(${JSON.stringify(root)}, 'process-state', { fresh: ${fresh} }));`], { encoding: 'utf8', env: { ...process.env, P3_GITHUB_LOG: log } });
    assert.equal(r.status, 0, r.stderr);
    assert.equal(r.stdout.trim(), 'true');
  };
  const fetches = () => readFileSync(log, 'utf8').split('\n').filter((l) => l.includes('"kind":"fetch"')).length;
  read(false);
  assert.equal(fetches(), 1, 'the first read fetches');
  assert.equal(JSON.parse(readFileSync(log, 'utf8').split('\n').find((l) => l.includes('"kind":"fetch"'))).of, 'state', 'the row says what it read');
  read(false);
  read(false);
  assert.equal(fetches(), 1, 'within 30 s, the next processes read the clone\'s copy');
  read(true);
  assert.equal(fetches(), 2, 'a fresh read fetches');
  // The window is 30 s from the last fetch.
  const stamp = join(root, '.git', 'p3-state-read-process-state');
  const st = JSON.parse(readFileSync(stamp, 'utf8'));
  writeFileSync(stamp, JSON.stringify({ ...st, at: Date.now() - 31e3 }));
  read(false);
  assert.equal(fetches(), 3, 'past 30 s, fetched');
  // The clone's ref moved by something other than that fetch: fetched.
  git(['update-ref', 'refs/remotes/origin/process-state', git(['commit-tree', '-m', 'x', 'HEAD^{tree}'], { cwd: root })], { cwd: root });
  read(false);
  assert.equal(fetches(), 4, 'the clone\'s ref is not what the fetch left: fetched');
});

// ===== file: flow-control.test.mjs =====

// Flow control (Bob, 5 Nov, Build Plan R10; as the coordinator's audit of PR 140 set it): the cap
// checked on a single start; working against waiting sessions; the release path tagged in next
// work; and a fault injection found by the next tool run.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { entry, makeRepo, openPassed, setJobCap } from './helpers.mjs';
import { capCheck } from '../lib/cap.mjs';
import { hold } from '../lib/hold.mjs';
import { fetchState, jsonl, readState, writeState } from '../lib/state.mjs';
import { flow, status } from '../lib/status.mjs';
import { CHECK_MIN, SWEEP_ROWS_FILE, beforeAct, idleCheck, senderFor } from '../lib/sweep.mjs';
import { main } from '../p3.mjs';
import { git, loadConfig as loadCfg } from '../lib/util.mjs';

const SB = 'process-state';
const quiet = () => {};
// GitHub as the idle check reads it (once): no open pull requests.
const GH = { slug: 'o/r', openPRs: () => [], checkRun: () => null, comments: () => [], prFiles: () => [] };
const unmet = (n) => Array.from({ length: n }, (_, i) => `- **R${i + 1}** *(not yet met: x)* text`).join('\n') + '\n';
const ago = (min, t = Date.now()) => new Date(t - min * 6e4).toISOString();

// A product: layer 1 closed by its marks, layer 2's three OPEN entries never started.
function product(files = {}) {
  const root = makeRepo({
    'build/layers.md': '| Layer | Modules |\n|---|---|\n| 1 | `done` |\n| 2 | `a`, `b`, `c` |\n',
    'process/config.json': JSON.stringify({ coordinator: 'session_coord1' }),
    'build/requirements/done.md': '# done\n',
    'process/ledger/done.json': entry('done', { requirements: 'build/requirements/done.md', layer: 1, status: { state: 'COMPLETE' } }),
    ...Object.fromEntries(['a', 'b', 'c'].flatMap((id) => [[`build/requirements/${id}.md`, unmet(1)], [`process/ledger/${id}.json`, entry(id, { requirements: `build/requirements/${id}.md`, layer: 2 })]])),
    ...files,
  });
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  git(['fetch', '-q', 'origin'], { cwd: root });
  openPassed(root);
  git(['push', '-q', 'origin', `refs/remotes/origin/${SB}:refs/heads/${SB}`], { cwd: root });
  // Layer 1 closed by layer close, nothing deferred: layer 2 is the open layer.
  writeState(root, SB, 'closed', (d) => { mkdirSync(join(d, 'layers'), { recursive: true }); writeFileSync(join(d, 'layers/closed.jsonl'), JSON.stringify({ row: 'closed', tranche: 'tranche', layer: 1, commit: git(['rev-parse', 'HEAD'], { cwd: root }), deferred: [] }) + '\n'); });
  return root;
}
const sweepRows = (root) => { fetchState(root, SB, { fresh: true }); return jsonl(readState(root, SB, SWEEP_ROWS_FILE)); };
const addRow = (root, row) => writeState(root, SB, 'row', (dir) => { git(['-C', dir, 'status'], { allowFail: true }); writeFileSync(join(dir, SWEEP_ROWS_FILE), (readState(root, SB, SWEEP_ROWS_FILE) || '') + JSON.stringify(row) + '\n'); });

test('job start <id> checks the cap: --sessions required (C28: never a typed --live), the cap less slot holds', (t) => {
  setJobCap(t, 4);
  const root = product();
  const listed = (n) => { const f = join(mkdtempSync(join(tmpdir(), 'p3-sessions-')), 's.json'); writeFileSync(f, JSON.stringify(Array.from({ length: n }, (_, i) => ({ id: `session_j${i}`, title: `job j${i}`, session_status: 'SESSION_STATUS_RUNNING' })))); return f; };
  assert.throws(() => capCheck(root, {}), /job start <id> --sessions <file>/);
  assert.throws(() => capCheck(root, { live: '3' }), /--live 3 is not taken/);
  assert.equal(capCheck(root, { sessions: listed(3) }).n, 3);
  assert.throws(() => capCheck(root, { sessions: listed(4) }), /the job cap is full: 4 job sessions working of the cap 4 \(4 live\); nothing was started/);
  hold(root, 'slots:1', { why: 'rehearsal', by: 'session_x1', until: '30m', log: quiet });
  assert.throws(() => capCheck(root, { sessions: listed(3) }), /3 job sessions working of the cap 4 less 1 held \(3 live\)/);
});

test('flow: with slots free, the requirement files over the cap are named as BOB\'s split acts that would open them', (t) => {
  setJobCap(t, 20);
  const over = { file: 'r/big.md', count: 9, over: 'split or consolidate before its job: r/big.md 90000 over 70000' };
  const one = { file: 'r/a.md', count: 1, module: 'a', entry_state: 'OPEN' };
  const view = { kind: 'open', n: 2, startable: [{ id: 'a' }] };
  const f = flow({}, [], [one, over], 6, null, [], { view });
  assert.deepEqual(f.splits_owed, ['r/big.md']);
  assert.match(f.line, /startable 1, blocked 0; \d+ slots free: BOB's split acts would open them \(split or consolidate: r\/big\.md\)$/);
  const full = flow({}, [], [one, over], 19, null, [], { view });
  assert.equal(full.splits_owed, undefined, 'no free slot: no split line');
  assert.doesNotMatch(full.line, /split/);
});

test('flow: working and waiting add up to every unarchived job session the cap counts: another product\'s, and an older one beside its latest', () => {
  const s = (id, title, st, at) => ({ id, title, session_status: st, updated_at: at });
  const listed = [s('s1', 'job a', 'running', '2026-11-05T04:00:00Z'), s('s2', 'job a (restart)', 'idle', '2026-11-05T04:10:00Z'), s('s3', 'job zz', 'idle', '2026-11-05T04:00:00Z'), s('s4', 'job b', 'idle', '2026-11-05T04:00:00Z'), s('s5', 'job c', 'archived', '2026-11-05T04:00:00Z'), s('s6', 'BOB', 'running', '2026-11-05T04:00:00Z')];
  const rows = [{ id: 'a', tranche: 'OPEN', branch: 'WORKING' }, { id: 'b', tranche: 'COMPLETE', pr: 'merged' }];
  const f = flow({}, rows, [], 4, listed);
  assert.equal(f.working + f.waiting, 4);
  assert.match(f.line, /\(working 1, waiting 3: a BOB, zz not this product's, b archive\)/);
});

test('next work tags the release path (layer work, release_path) and debt (every unmet mark a base-red found mark)', () => {
  const root = product({
    'process/config.json': JSON.stringify({ release_path: ['solo'] }),
    'build/requirements/c.md': '- **F1** *(not yet met: base-red gate run 12)* x\n',
    'process/found/solo.md': '- **F1** *(not yet met: walk)* y\n',
  });
  const out = status(root, { role: 'bob', offline: true, heads: new Set(), log: quiet });
  const by = Object.fromEntries(out.next.filter((y) => y.module).map((y) => [y.module, [!!y.release, !!y.debt]]));
  assert.deepEqual([by.a, by.b, by.c], [[true, false], [true, false], [false, true]]);
});

test('working against waiting: each open job\'s session running or idle, and what an idle one waits on', (t) => {
  setJobCap(t, 20);
  const rows = [
    { id: 'a', tranche: 'OPEN', branch: 'WORKING' }, { id: 'b', tranche: 'OPEN', branch: 'COMPLETE', ready: true, gate: 'pending' },
    { id: 'c', tranche: 'OPEN', branch: 'COMPLETE', ready: true, gate: 'success' }, { id: 'd', tranche: 'BLOCKED', branch: 'BLOCKED' }, { id: 'e', tranche: 'OPEN', branch: 'WORKING' },
  ];
  const s = (id, st) => ({ id: `session_${id}`, title: `job ${id}`, session_status: `SESSION_STATUS_${st}`, updated_at: ago(1) });
  const f = flow({ targets: {} }, rows, [], 5, [s('a', 'RUNNING'), s('b', 'IDLE'), s('c', 'IDLE'), s('d', 'IDLE'), s('e', 'IDLE')]);
  assert.deepEqual([f.working, f.waiting], [1, 4]);
  assert.match(f.line, /^flow: live 5\/20 \((default|P3_JOB_CAP)\) \(working 1, waiting 4: b gate, c merge, d block, e BOB\), startable 0/);
});

// Fault injection 3: an unanswered BLOCKED job: its idle session is counted waiting on its block in
// the flow line (and the sweep's ruling owed stands as before); ruled, it waits no more.
test('fault injection: an unanswered BLOCKED job shows as a session waiting on its block, and no more once ruled', (t) => {
  setJobCap(t, 6);
  const s = { id: 'session_q', title: 'job q', session_status: 'SESSION_STATUS_IDLE', updated_at: ago(40) };
  const blocked = flow({ targets: { decision_minutes: 30 } }, [{ id: 'q', tranche: 'BLOCKED', since: ago(40) }], [], 1, [s]);
  assert.match(blocked.line, /waiting 1: q block\), startable 0, blocked 1 \(oldest 40 min\)/);
  const ruled = flow({ targets: { decision_minutes: 30 } }, [{ id: 'q', tranche: 'OPEN', branch: 'WORKING' }], [], 1, [{ ...s, session_status: 'SESSION_STATUS_RUNNING' }]);
  assert.match(ruled.line, /working 1, waiting 0\), startable 0, blocked 0/);
});

// ===== file: bookkeeping.test.mjs =====

// The tool's own records never make a push of their own (C18; coordinator, 7 Nov: the account at
// its push ceiling, 10 of BOB's 26 pushes in an hour nothing but idle-check rows, starts owed after a
// merge had pushed, and paid after a job start): a record rides the command's real write; with none
// it waits in the clone and rides the next real write; the clone's reads see it meanwhile.
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { OWED_FILE, readOwed } from '../lib/hold.mjs';
import { bookkeep, flushState, readState, readStateWith, stateBatch, stateIO, stateReplay, writeState } from '../lib/state.mjs';
import { git, now } from '../lib/util.mjs';
import { makeRepo } from './helpers.mjs';

const SB = 'process-state';
function product() {
  const root = makeRepo({ 'README.md': 'x\n' });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['config', 'core.logAllRefUpdates', 'always'], { cwd: bare });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'main'], { cwd: root });
  writeState(root, SB, 'seed', (dir) => { writeFileSync(join(dir, 'seed.txt'), 's\n'); return {}; });
  return { root, bare };
}
// Pushes, not commits: each push moves the state branch once in origin's reflog; the seed's first
// write counts as one too.
const pushes = (bare) => git(['reflog', 'show', '--format=%H', `refs/heads/${SB}`], { cwd: bare, allowFail: true }).stdout.split('\n').filter((l) => l.trim()).length;

test('a command that writes only bookkeeping pushes nothing; its record waits in the clone, read there, and rides the next real write', () => {
  const { root, bare } = product();
  const before = pushes(bare);
  // A read command (status, layer jobs): its only write a starts-owed record.
  stateBatch(true);
  try { bookkeep(root, SB, 'starts owed: merge 7', 'owe', { path: OWED_FILE, act: 'merge 7', at: now() }); flushState(); } finally { stateBatch(false); }
  assert.equal(pushes(bare), before, 'no push of its own');
  assert.equal(readState(root, SB, OWED_FILE), null, 'not on the branch yet');
  assert.deepEqual(readOwed(root, SB).acts.map((a) => a.act), ['merge 7'], 'the clone reads it');
  // Unbatched (job start's paid): waits too.
  bookkeep(root, SB, 'starts owed: merge 8', 'owe', { path: OWED_FILE, act: 'merge 8', at: now() });
  assert.equal(pushes(bare), before);
  assert.deepEqual(readOwed(root, SB).acts.map((a) => a.act), ['merge 7', 'merge 8']);
  // The next real write carries both, in its one push.
  stateBatch(true);
  try { writeState(root, SB, 'layer join: x', (dir) => { writeFileSync(join(dir, 'join.txt'), 'x\n'); return {}; }); flushState(); } finally { stateBatch(false); }
  assert.equal(pushes(bare), before + 1, 'one push: the real write and the two records');
  git(['fetch', '-q', 'origin', `+refs/heads/${SB}:refs/remotes/origin/${SB}`], { cwd: root });
  assert.deepEqual(JSON.parse(readState(root, SB, OWED_FILE)).acts.map((a) => a.act), ['merge 7', 'merge 8']);
  assert.equal(readStateWith(root, SB, OWED_FILE), readState(root, SB, OWED_FILE), 'nothing left waiting');
});

test('an unbatched write (job start, replay) leaves the waiting records waiting; the next batched write carries them, once', () => {
  const { root, bare } = product();
  bookkeep(root, SB, 'starts owed: merge 9', 'owe', { path: OWED_FILE, act: 'merge 9', at: now() });
  const before = pushes(bare);
  writeState(root, SB, 'a write', (dir) => { writeFileSync(join(dir, 'w.txt'), 'w\n'); return {}; });
  assert.equal(pushes(bare), before + 1);
  git(['fetch', '-q', 'origin', `+refs/heads/${SB}:refs/remotes/origin/${SB}`], { cwd: root });
  assert.equal(readState(root, SB, OWED_FILE), null, 'not carried by an unbatched write');
  assert.deepEqual(readOwed(root, SB).acts.map((a) => a.act), ['merge 9'], 'still waiting, read in the clone');
  stateBatch(true);
  try { writeState(root, SB, 'b write', (dir) => { writeFileSync(join(dir, 'b.txt'), 'b\n'); return {}; }); flushState(); } finally { stateBatch(false); }
  git(['fetch', '-q', 'origin', `+refs/heads/${SB}:refs/remotes/origin/${SB}`], { cwd: root });
  assert.deepEqual(JSON.parse(readState(root, SB, OWED_FILE)).acts.map((a) => a.act), ['merge 9']);
});


test('a write kept for replay leaves the waiting records in the clone: the replay pushes the write alone, the next batched write the records, once each (cold reviews of C18)', () => {
  const { root, bare } = product();
  bookkeep(root, SB, 'starts owed: merge 11', 'owe', { path: OWED_FILE, act: 'merge 11', at: now() });
  stateIO.push = () => ({ code: 1, stderr: 'remote: refused for the test' });
  try { assert.throws(() => writeState(root, SB, 'a write', (dir) => { writeFileSync(join(dir, 'k.txt'), 'k\n'); return {}; }), /state replay/); } finally { delete stateIO.push; }
  assert.deepEqual(readOwed(root, SB).acts.map((a) => a.act), ['merge 11'], 'still waiting in the clone');
  stateReplay(root, SB, [], { log: () => {} });
  git(['fetch', '-q', 'origin', `+refs/heads/${SB}:refs/remotes/origin/${SB}`], { cwd: root });
  assert.equal(readState(root, SB, 'k.txt'), 'k\n', 'the kept write replayed');
  assert.equal(readState(root, SB, OWED_FILE), null, 'the replay carried no records');
  stateBatch(true);
  try { writeState(root, SB, 'later', (dir) => { writeFileSync(join(dir, 'l.txt'), 'l\n'); return {}; }); flushState(); } finally { stateBatch(false); }
  git(['fetch', '-q', 'origin', `+refs/heads/${SB}:refs/remotes/origin/${SB}`], { cwd: root });
  assert.deepEqual(JSON.parse(readState(root, SB, OWED_FILE)).acts.map((a) => a.act), ['merge 11'], 'once');
  assert.ok(bare);
});


test('a batched flush refused to the end keeps its own writes for replay and leaves the waiting records waiting, never in both', () => {
  const { root, bare } = product();
  bookkeep(root, SB, 'starts owed: merge 12', 'owe', { path: OWED_FILE, act: 'merge 12', at: now() });
  const before = pushes(bare);
  stateIO.push = () => ({ code: 1, stderr: 'remote: refused for the test' });
  stateBatch(true);
  try {
    writeState(root, SB, 'a real write', (dir) => { writeFileSync(join(dir, 'r.txt'), 'r\n'); return {}; });
    assert.throws(() => flushState(), /state replay/);
  } finally { stateBatch(false); delete stateIO.push; }
  assert.equal(pushes(bare), before);
  const kept = git(['for-each-ref', '--format=%(refname)', 'refs/p3/unpushed/'], { cwd: root }).split('\n').filter(Boolean);
  assert.equal(kept.length, 1, 'the real write kept, alone');
  assert.equal(git(['log', '-1', '--format=%s', kept[0]], { cwd: root }), 'a real write');
  assert.deepEqual(readOwed(root, SB).acts.map((a) => a.act), ['merge 12'], 'the record still waiting in the clone');
  stateReplay(root, SB, [], { log: () => {} });
  stateBatch(true);
  try { writeState(root, SB, 'next', (dir) => { writeFileSync(join(dir, 'n.txt'), 'n\n'); return {}; }); flushState(); } finally { stateBatch(false); }
  git(['fetch', '-q', 'origin', `+refs/heads/${SB}:refs/remotes/origin/${SB}`], { cwd: root });
  assert.deepEqual(JSON.parse(readState(root, SB, OWED_FILE)).acts.map((a) => a.act), ['merge 12'], 'pushed once');
});

// ===== file: light-triage.test.mjs =====

// PD-20 (coordinator, 9 Nov, at Bob's ask: "Triaging used to be pretty instantaneous... how do we
// get it back to a lightweight process"): provider-notice triage decided at the merge, with no
// worker, wherever a deterministic rule answers it. A notice that changed no requirement id clears
// every user when its exports were read unchanged or only added to; with names removed or changed,
// only a user importing one (or importing in a way that cannot be read as names) stays owed.
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { BOT, GATE, block } from '../lib/github.mjs';
import { merge } from '../lib/merge.mjs';
import { noticeFile, notices } from '../lib/notice.mjs';
import { fetchState, readState } from '../lib/state.mjs';
import { noticeSlots, status } from '../lib/status.mjs';
import { importedNames, importsNamesClear, interfaceRule, noticeTriage, triageAtMerge, triageRows } from '../lib/triage.mjs';
import { git, loadConfig } from '../lib/util.mjs';
import { commit, entry, makeRepo, onState, openPassed } from './helpers.mjs';

const quiet = () => {};
const USERS = ['u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7'];
const P_SRC = 'export function sign(x) { return x; }\nexport function verify(x) { return !!x; }\nexport default sign;\n';
// Each user reaches p differently: by a moved name, by an unmoved one (multi-line, renamed), by a
// namespace, not at all, by default, through p's test fixture (outside p's export read), by require.
const USER_FILES = {
  'src/u1/a.mjs': "import { sign } from '../p/index.mjs';\nexport const a = sign;\n",
  'src/u2/a.mjs': "// u2\nimport {\n  verify as v,\n} from '../p/index.mjs';\nexport const b = v;\n",
  'src/u3/a.mjs': "import * as p from '../p/index.mjs';\nexport const c = p.verify;\n",
  'src/u4/a.mjs': 'export const nothing = 1;\n',
  'src/u5/a.mjs': "import sign from '../p/index.mjs';\nexport const e = sign;\n",
  'src/u6/a.mjs': "import { verify } from '../p/index.mjs';\nexport const f = verify;\n",
  'test/u6/a.test.mjs': "import { fx } from '../../test/p/fixture.mjs';\nexport const g = fx;\n",
  'src/u7/a.mjs': "const p = require('../p/index.mjs');\nmodule.exports = p;\n",
};

function product(users = USERS, extra = {}) {
  const ids = ['p', ...users];
  const root = makeRepo({
    'process/config.json': { modules_file: 'process/modules.json', requirements_dir: 'req' },
    'process/modules.json': { modules: ids.map((id) => ({ id, paths: [`src/${id}/`], tests: [`test/${id}/`], ...(id === 'p' ? {} : { uses: ['p'] }) })) },
    ...Object.fromEntries(ids.flatMap((id) => [
      [`process/ledger/${id}.json`, entry(id)],
      [`req/${id}.md`, `# ${id}\n\n- **R1** met\n`],
    ])),
    'src/p/index.mjs': P_SRC,
    'test/p/fixture.mjs': 'export const fx = 1;\n',
    ...Object.fromEntries(Object.entries(USER_FILES).filter(([f]) => users.includes(f.split('/')[1]))),
    ...extra,
  });
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'tranche', 'main'], { cwd: root });
  return root;
}

function mergeJob(root, n, files) {
  git(['checkout', '-q', '-B', 'job/p', 'tranche'], { cwd: root });
  const head = commit(root, { ...files, 'process/metrics/p.jsonl': JSON.stringify({ row: 'attempt', event: 'complete', at: new Date().toISOString() }) + '\n' });
  git(['push', '-q', '-f', 'origin', 'job/p'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  const io = {
    getPR: () => ({ state: 'open', draft: false, user: { login: 'c' }, base: { ref: 'tranche' }, head: { ref: 'job/p', sha: head } }),
    comments: () => [
      { id: 2, body: block(GATE, { runs: [{ sha: head, ok: true, attempt: 1, run_id: 11 }] }), user: { login: BOT } },
    ],
    checkRun: () => ({ status: 'completed', conclusion: 'success' }),
    verify: () => true,
    mergePR: () => ({ merged: true, sha: 'm'.repeat(40) }),
  };
  const out = [];
  const r = merge(root, n, { slug: 'o/r', io, reviewed: 'fresh', rounds: 1, reviewMinutes: 5, findings: 0, actedOn: 0, log: (m) => out.push(m) });
  return { r, out: out.join('\n') };
}
const triaged = (root, key) => {
  const cfg = loadConfig(root);
  fetchState(root, cfg.state_branch, { fresh: true });
  return new Map([...triageRows(root, cfg.state_branch)].filter(([k]) => k.startsWith(`${key}\0`)).map(([k, v]) => [k.split('\0')[1], v]));
};
const owedTriage = (root, key) => {
  const cfg = loadConfig(root);
  fetchState(root, cfg.state_branch, { fresh: true });
  return noticeSlots(root, cfg, []).slots.filter((s) => s.key === key && s.kind === 'triage').map((s) => s.user);
};

test('importedNames reads the names each import statement takes; default, namespace, export *, import() and require() are unreadable as names', () => {
  const text = [
    "import { a, b as c, type T } from './x.mjs';", // 1
    "import type { U } from './x.mjs';", // 2
    "import {\n  d,\n  e as f,\n} from './y.mjs';", // 3
    "import './side.mjs';", // 7
    "import def from './x.mjs';", // 8
    "import def2, { g } from './z.mjs';", // 9
    "import * as ns from './x.mjs';", // 10
    "export { h, i as j } from './x.mjs';", // 11
    "export * from './w.mjs';", // 12
    "const m = await import('./x.mjs');", // 13
    "const r = require('./x.mjs');", // 14
    "import { default as k } from './k.mjs';", // 15
    "import { a2 } from './two.mjs'; import { b2 } from './two.mjs';", // 16
    "import { a3 } from './three.mjs'; import * as t3 from './three.mjs';", // 17
  ].join('\n');
  const n = importedNames(text);
  const at = (line, spec) => n.get(`${line}\0${spec}`);
  assert.deepEqual(at(1, './x.mjs'), { names: ['a', 'b', 'T'] });
  assert.deepEqual(at(2, './x.mjs'), { names: ['U'] });
  assert.deepEqual(at(3, './y.mjs'), { names: ['d', 'e'] });
  assert.deepEqual(at(7, './side.mjs'), { names: [] });
  assert.deepEqual(at(8, './x.mjs'), { names: null, why: 'a default import' });
  assert.deepEqual(at(9, './z.mjs'), { names: null, why: 'a default import' });
  assert.deepEqual(at(10, './x.mjs'), { names: null, why: 'a namespace import' });
  assert.deepEqual(at(11, './x.mjs'), { names: ['h', 'i'] });
  assert.deepEqual(at(12, './w.mjs'), { names: null, why: 'an export * of it' });
  assert.deepEqual(at(13, './x.mjs'), { names: null, why: 'a dynamic import()' });
  assert.deepEqual(at(14, './x.mjs'), { names: null, why: 'a require()' });
  assert.deepEqual(at(15, './k.mjs'), { names: null, why: 'import default by name' });
  assert.deepEqual(at(16, './two.mjs'), { names: ['a2', 'b2'] });
  assert.equal(at(17, './three.mjs').names, null, 'a namespace beside names on one line is unreadable');
});

test('interfaceRule: none, added or names only with no requirement id changed and the exports read over a recorded range; anything else is null', () => {
  const read = { base: 'a'.repeat(40), head: 'b'.repeat(40), files: ['src/p/index.mjs'] };
  const n = { key: 'p:1', provider: 'p', pr: 1, ids: [], users: ['u1'], source: 1, exports_read: read };
  assert.deepEqual(interfaceRule(n), { rule: 'none', range: 'aaaaaaaaaa..bbbbbbbbbb' });
  assert.match(interfaceRule({ ...n, exports_read: { ...read, files: [] } }).why, /its export read found no entry file/);
  assert.equal(interfaceRule({ ...n, exports: { removed: [], added: ['z'], changed: [] } }).rule, 'added');
  assert.deepEqual(interfaceRule({ ...n, exports: { removed: ['x'], added: [], changed: [{ name: 'y', before: '(a)', after: '(a, b)' }] } }).names, ['x', 'y']);
  assert.match(interfaceRule({ ...n, ids: ['R2'] }).why, /requirement id\(s\) changed \(R2\)/);
  assert.match(interfaceRule({ ...n, exports_unread: 'boom' }).why, /its exports could not be read \(boom\)/);
  assert.match(interfaceRule({ ...n, exports_read: undefined }).why, /no read of its exports is recorded/);
  assert.match(interfaceRule({ ...n, exports_read: { base: 'a', head: 'b' } }).why, /no read of its exports is recorded/);
  assert.match(interfaceRule({ ...n, exports: { removed: 'x' } }).why, /export changes are unreadable/);
  assert.match(interfaceRule({ ...n, ids: undefined }).why, /requirement ids are unread/);
});

test('importsNamesClear: clears only reads of unmoved names from files the export read covered; fails closed otherwise', () => {
  const f = (text, specs) => [{ file: 'src/u/a.mjs', text, specs }];
  const s = (spec, line = 1, to = 'src/p/index.mjs') => ({ spec, line, to });
  const files = ['src/p/index.mjs'];
  const ok = importsNamesClear(f("import { verify } from '../p/index.mjs';\n", [s('../p/index.mjs')]), ['sign'], files, 'p');
  assert.deepEqual(ok, { clear: true, evidence: ["src/u/a.mjs:1 import { verify } from '../p/index.mjs';"] });
  assert.match(importsNamesClear(f("import { sign } from '../p/index.mjs';\n", [s('../p/index.mjs')]), ['sign'], files, 'p').why, /src\/u\/a\.mjs:1 imports sign, removed or changed/);
  assert.match(importsNamesClear(f("import * as p from '../p/index.mjs';\n", [s('../p/index.mjs')]), ['sign'], files, 'p').why, /is a namespace import of p/);
  assert.match(importsNamesClear(f("import { verify } from '../p/other.mjs';\n", [s('../p/other.mjs', 1, 'src/p/other.mjs')]), ['sign'], files, 'p').why, /imports src\/p\/other\.mjs, a file of p its export read did not cover/);
  assert.match(importsNamesClear(f("import { verify } from '../p/gone';\n", [s('../p/gone', 1, null)]), ['sign'], files, 'p').why, /imports '\.\.\/p\/gone', which names no file of p/);
  // A specifier the parser cannot place at the line checks.mjs gave: unread, owed.
  assert.match(importsNamesClear(f("import { verify } from '../p/index.mjs';\n", [s('../p/index.mjs', 2)]), ['sign'], files, 'p').why, /by a statement that could not be read/);
  assert.match(importsNamesClear(f("import { verify } from '../p/index.mjs';\n", [s('../p/index.mjs')]), ['Accounts.keySet'], files, 'p').why, /class member\(s\) moved \(Accounts\.keySet\)/);
});

test('rule 1: a merge whose provider changed no requirement id and no export clears every user at the merge, importers too; status owes nothing (PD-17 rehearsal)', () => {
  const root = product();
  openPassed(root);
  const { r, out } = mergeJob(root, 9, { 'src/p/index.mjs': P_SRC.replace('return !!x;', 'return Boolean(x);') });
  const [n] = r.notices.rows;
  assert.deepEqual([n.key, n.ids, n.users, n.exports], ['p:9', [], USERS, undefined]);
  assert.ok(n.exports_read?.base && n.exports_read?.head, 'the export read is recorded on the notice');
  assert.deepEqual(n.exports_read.files, ['src/p/index.mjs']);
  assert.deepEqual(r.triage.owed, []);
  assert.match(out, /notice triage p:9 at the merge: 7 of 7 not affected \(7 by no interface change\), answered: u1, u2, u3, u4, u5, u6, u7$/m);
  const t = triaged(root, 'p:9');
  assert.deepEqual([...t.keys()].sort(), USERS);
  for (const row of t.values()) {
    assert.equal(row.verdict, 'not affected');
    assert.equal(row.worker, 'merge: no interface change');
    assert.equal(row.cost, '0');
    assert.match(row.evidence, /^PR 9: no requirement id changed; exports read unchanged at [0-9a-f]{10}\.\.[0-9a-f]{10}$/);
  }
  const cfg = loadConfig(root);
  // Every user answered, as recordTriage answers a not affected: the notice is closed for all.
  assert.deepEqual(notices(root, cfg.state_branch)[0].open, []);
  assert.ok(readState(root, cfg.state_branch, 'notices/answered/u3-p-9.json'));
  assert.deepEqual(owedTriage(root, 'p:9'), []);
  const lines = [];
  status(root, { role: 'bob', offline: true, log: (m) => lines.push(m) });
  assert.doesNotMatch(lines.join('\n'), /triage owed/);
  const left = [];
  assert.deepEqual(noticeTriage(root, 'p:9', { log: (m) => left.push(m) }).owed, []);
  assert.match(left.join('\n'), /provider notice p:9: no module owes triage/);
});

test('rule 2: an export only added clears every user at the merge', () => {
  const root = product();
  const { r, out } = mergeJob(root, 10, { 'src/p/index.mjs': P_SRC + 'export function rotate() { return 1; }\n' });
  assert.deepEqual(r.notices.rows[0].exports, { removed: [], added: ['rotate'], changed: [] });
  assert.deepEqual(r.triage.owed, []);
  assert.match(out, /notice triage p:10 at the merge: 7 of 7 not affected \(7 by no interface change\)/);
  assert.match(triaged(root, 'p:10').get('u1').evidence, /^PR 10: no requirement id changed; exports read at [0-9a-f]{10}\.\.[0-9a-f]{10} only added \(rotate\), none removed or changed$/);
});

test('rule 3: with a name changed, only importers of it, or of what cannot be read as names, stay owed; the brief says why each was left (PD-17 rehearsal)', () => {
  const root = product();
  openPassed(root);
  const { r, out } = mergeJob(root, 11, { 'src/p/index.mjs': P_SRC.replace('sign(x)', 'sign(x, key)') });
  assert.deepEqual(r.notices.rows[0].exports, { removed: [], added: [], changed: [{ name: 'sign', before: 'function(x)', after: 'function(x, key)' }] });
