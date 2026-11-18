// ===== file: util.mjs (continued) =====

// train read the state branch): two git processes updating one remote-tracking ref at once, the
// loser failing "cannot lock ref ... is at X but expected Y" or "unable to update local ref". It
// is transient: the fetch runs again, up to FETCH_TRIES times in all (0.5, 1, 2, 4 s, jittered),
// and any other failure, or the last one, is returned as git gave it. `run` is for the tests.
export const LOCAL_REF_LOCK = /cannot lock ref|unable to update local ref|is at [0-9a-f]+ but expected|Unable to create '[^']*\.lock': File exists/i;
export const FETCH_TRIES = 5;
export function fetchRetry(args, opts = {}, { tries = FETCH_TRIES, wait = 500, run: once } = {}) {
  const go = once || (() => git(args, { ...opts, allowFail: true }));
  for (let t = 1; ; t++) {
    const r = go();
    if (r.code === 0 || t >= tries || !LOCAL_REF_LOCK.test(String(r.stderr || ''))) return r;
    pause(jitter(wait * 2 ** (t - 1)));
  }
}


// Note for jobs, in force until withdrawn: the job's handover note ends with this exact last line:
// `-- filed under alderney`.

// The per-clone state lock (build train-robust, option 3A; the coordinator's ruling, 5 Nov). Every
// state-branch fetch and write the tool makes (state.mjs fetchState, writeState with its push)
// holds it for that one fetch or write only, never across a gate wait or any other network call,
// so two p3 processes in one clone (the MERGER's train and its send) take turns instead of
// colliding on refs/remotes/origin/<state branch>. A lock file in the clone's common git dir,
// created exclusively, naming its process, host and time. A lock whose process is gone on this
// host is broken and taken; a live holder (or one on another host, or unread) is waited on up to
// STATE_LOCK.wait seconds and then reported, never skipped. Re-entrant within one process.
// alive and host are for the tests.
export const STATE_LOCK = { file: 'p3-state.lock', wait: 90, poll: 200, unread: 10 };
const lockDepth = new Map(); // lock path -> depth held by this process
const lockMine = new Map(); // lock path -> the content this process wrote
const lockPaths = new Map(); // root -> lock path
let lockExit = false;
export function pidAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return null;
  try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'ESRCH' ? false : e.code === 'EPERM' ? true : null; }
}
export function stateLockPath(root) {
  if (!lockPaths.has(root)) {
    const r = run('git', ['rev-parse', '--git-common-dir'], { cwd: root });
    if (r.code !== 0) fail(`git rev-parse --git-common-dir failed in ${root}: ${r.stderr.trim()}`);
    lockPaths.set(root, join(resolve(root, r.stdout.trim()), STATE_LOCK.file));
  }
  return lockPaths.get(root);
}
const readLock = (p) => { try { return readFileSync(p, 'utf8'); } catch { return null; } };
const dropLock = (p) => { const mine = lockMine.get(p); if (mine !== undefined && readLock(p) === mine) { try { unlinkSync(p); } catch { /* gone */ } } lockMine.delete(p); };
// Breaks a stale lock under a breaker lock of its own (review of build train-robust: a rename and
// put-back could restore a live lock its owner had already released): while the stale lock file
// exists no process can create a new one, so it is removed only if it still reads as the stale
// lock read. A breaker lock older than STATE_LOCK.unread seconds is itself left over and removed.
function breakStale(p, text) {
  const b = `${p}.break`;
  try { writeFileSync(b, String(process.pid), { flag: 'wx' }); } catch {
    try { if (Date.now() - statSync(b).mtimeMs > STATE_LOCK.unread * 1000) unlinkSync(b); } catch { /* gone */ }
    return false;
  }
  try { if (readLock(p) === text) unlinkSync(p); return true; } catch { return false; } finally { try { unlinkSync(b); } catch { /* gone */ } }
}
export function withStateLock(root, fn, { wait = STATE_LOCK.wait, poll = STATE_LOCK.poll, alive = pidAlive, host = hostname() } = {}) {
  const p = stateLockPath(root);
  const d = lockDepth.get(p) || 0;
  if (d > 0) { lockDepth.set(p, d + 1); try { return fn(); } finally { lockDepth.set(p, lockDepth.get(p) - 1); } }
  if (!lockExit) { lockExit = true; process.once('exit', () => { for (const q of [...lockMine.keys()]) dropLock(q); }); }
  const me = JSON.stringify({ pid: process.pid, host, at: new Date().toISOString(), token: Math.random().toString(36).slice(2) });
  const until = Date.now() + wait * 1000;
  for (;;) {
    try { writeFileSync(p, me, { flag: 'wx' }); break; } catch (e) { if (e.code !== 'EEXIST') throw e; }
    const text = readLock(p);
    if (text === null) continue; // released between the two calls: try again at once
    let cur = null;
    try { cur = JSON.parse(text); } catch { cur = null; }
    let age = 0;
    try { age = Date.now() - statSync(p).mtimeMs; } catch { continue; }
    // Stale: its process is gone on this host; or never written whole (a process killed between
    // creating and writing it) and older than STATE_LOCK.unread seconds.
    // A lock naming this process that it does not hold is left over (it cannot be waiting on itself).
    const stale = cur ? cur.host === host && (alive(cur.pid) === false || (cur.pid === process.pid && lockMine.get(p) !== text)) : age > STATE_LOCK.unread * 1000;
    if (stale && breakStale(p, text)) continue;
    if (Date.now() >= until) fail(`the state lock ${p} is held by ${cur ? `process ${cur.pid} on ${cur.host} since ${cur.at}` : 'a process that has not written it'} (another p3 command in this clone): waited ${wait} s; nothing was read or written; run this again once that command ends, or, if no p3 runs here, remove ${p}`);
    pause(jitter(poll));
  }
  lockMine.set(p, me);
  lockDepth.set(p, 1);
  try { return fn(); } finally { lockDepth.set(p, 0); dropLock(p); }
}

// Scratch directories (copy, 4 Nov: merge left a 690 MB p3-merge-* tree on every run, 110 of them
// filled BOB's disk). Every scratch directory in tool/lib comes from withTemp, which removes it
// on every way out of fn: success, refusal or throw. With root, a worktree added under it is
// removed and pruned from root's .git/worktrees too. A process killed mid-way (a timeout's
// SIGTERM or SIGKILL runs no finally, and merge sleeps in Atomics.wait) is cleaned by the next
// withTemp: a scratch directory whose owner process is gone, or one an older tool left (no owner
// file) over TEMP_STALE_HOURS old, is removed. Kept on purpose, outside withTemp: the
// development deploy's and release's step-log directories, the evidence their output names.
export const TEMP_PREFIXES = ['p3-train-', 'p3-merge-', 'p3-state-', 'p3-layer-', 'p3-row-', 'p3-failing-', 'p3-base-red-', 'p3-round-', 'p3-merged-'];
export const TEMP_OWNER = '.p3-owner';
export const TEMP_STALE_HOURS = 3;
const temps = new Map();
let exitHook = false;
const alive = (pid) => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } };
function dropTemp(dir, root) {
  if (root) {
    // git lists a worktree by its real path (a symlinked TMPDIR, macOS's /var, is resolved).
    let real = dir;
    try { real = realpathSync(dir); } catch {}
    const listed = git(['worktree', 'list', '--porcelain'], { cwd: root, allowFail: true }).stdout || '';
    for (const l of listed.split('\n')) {
      const p = l.startsWith('worktree ') ? l.slice(9) : null;
      if (p && [dir, real].some((d) => p === d || p.startsWith(`${d}/`))) git(['worktree', 'remove', '--force', '--force', p], { cwd: root, allowFail: true });
    }
  }
  rmSync(dir, { recursive: true, force: true });
  if (root) git(['worktree', 'prune'], { cwd: root, allowFail: true });
  temps.delete(dir);
}
// Removes the scratch directories of processes no longer running; with root, prunes its worktrees.
export function sweepTemp(root, { base = tmpdir(), now = Date.now() } = {}) {
  const gone = [];
  let names = [];
  try { names = readdirSync(base); } catch { return gone; }
  for (const n of names) {
    if (!TEMP_PREFIXES.some((p) => n.startsWith(p))) continue;
    const d = join(base, n);
    try {
      let owner = null;
      try { owner = Number(readFileSync(join(d, TEMP_OWNER), 'utf8')); } catch {}
      const stale = owner ? owner !== process.pid && !alive(owner) : now - statSync(d).mtimeMs > TEMP_STALE_HOURS * 3600000;
      if (!stale) continue;
      rmSync(d, { recursive: true, force: true });
      gone.push(d);
    } catch {}
  }
  if (root && gone.length) git(['worktree', 'prune'], { cwd: root, allowFail: true });
  return gone;
}
export function withTemp(prefix, fn, { root } = {}) {
  const { dir, drop } = holdTemp(prefix, { root });
  try { return fn(dir); } finally { drop(); }
}
// A scratch directory held past one call (the base-red tree prepared beside the head's install,
// basered.mjs startBase): removed by drop(), or at exit, or by the next withTemp once its owner
// process is gone, as withTemp's are.
export function holdTemp(prefix, { root } = {}) {
  if (!TEMP_PREFIXES.includes(prefix)) fail(`withTemp: ${prefix} is not a scratch prefix (TEMP_PREFIXES)`);
  sweepTemp(root);
  const dir = mkdtempSync(join(tmpdir(), prefix));
  writeFileSync(join(dir, TEMP_OWNER), String(process.pid));
  // process.exit inside fn runs no finally: what is still held goes at exit.
  if (!exitHook) { exitHook = true; process.once('exit', () => { for (const [d, r] of temps) dropTemp(d, r); }); }
  temps.set(dir, root);
  return { dir, drop: () => { if (temps.has(dir)) dropTemp(dir, root); } };
}

// ===== file: anchor.test.mjs =====

// The anchor's reads of a base's config (confirming review of PR 97): a session's history
// cannot choose which "last config" counts, and a plain pull request cannot delete the config.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { keyAt, lastConfigAt } from '../lib/anchor.mjs';
import { pinChange } from '../lib/merge.mjs';
import { git } from '../lib/util.mjs';
import { commit, makeRepo, write } from './helpers.mjs';

const repo = { released: () => true, shim: () => null, descends: () => true };

test('a deleted config\'s last one is read along first parents, not in a date order a session sets', () => {
  const root = makeRepo({ 'process/config.json': { lockfiles: [] } });
  const init = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', '-b', 'side'], { cwd: root });
  const env = { ...process.env, GIT_COMMITTER_DATE: '2030-01-01T00:00:00Z' };
  write(root, { 'process/config.json': { approvals: { owner: 'evil' } } });
  git(['commit', '-q', '-am', 'S'], { cwd: root, env });
  git(['checkout', '-q', 'main'], { cwd: root });
  git(['rm', '-q', 'process/config.json'], { cwd: root });
  git(['commit', '-q', '-m', 'del'], { cwd: root });
  // The side branch merged in, resolved to the deletion, dated ahead of everything.
  git(['merge', '-q', '-s', 'ours', '--no-edit', 'side'], { cwd: root, env });
  assert.equal(lastConfigAt(root, 'main'), init);
  assert.match(keyAt(root, lastConfigAt(root, 'main'), 'approvals'), /neobobkrause/);
});

test('a plain pull request that deletes the config needs the owner\'s word', () => {
  const root = makeRepo({ 'process/config.json': {} });
  const mb = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['rm', '-q', 'process/config.json'], { cwd: root });
  git(['commit', '-q', '-m', 'del'], { cwd: root });
  const sha = git(['rev-parse', 'HEAD'], { cwd: root });
  for (const intoMain of [false, true]) {
    assert.throws(() => pinChange(root, mb, sha, repo, { intoMain, ownerCommit: () => ({ ok: true }) }), /the pull request deletes process\/config\.json; that needs the owner's word/);
  }
});

// Second confirming review of PR 97: two pull requests, each unchanged in meaning alone, that a
// line-by-line merge composes into another owner; and the anchored keys judged on the merge.
import { mergedUnanchored, unanchored } from '../lib/anchor.mjs';
import { duplicateKey, loadConfig } from '../lib/util.mjs';

const text = (lines) => `{\n${lines.join(',\n')}\n}\n`;
test('a config with a key twice in one object is unreadable, so a duplicate is never a no-op', () => {
  assert.equal(duplicateKey('{"a":1,"b":{"a":2},"c":[{"a":1},{"a":1}]}'), null);
  assert.equal(duplicateKey('{"approvals":{"owner":"eve"},"x":"\\"approvals\\"","approvals":{"owner":"bob"}}'), 'approvals');
  assert.equal(duplicateKey('{"a":{"o":1,"o":2}}'), 'o');
  const root = makeRepo({ 'process/config.json': text(['"lockfiles": []', '"approvals": {"owner": "bob"}']) });
  const t0 = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', '-b', 'pr1'], { cwd: root });
  write(root, { 'process/config.json': text(['"lockfiles": []', '"approvals": {"owner": "eve"}', '"approvals": {"owner": "bob"}']) });
  git(['commit', '-q', '-am', 'a duplicate above bob'], { cwd: root });
  const pr1 = git(['rev-parse', 'HEAD'], { cwd: root });
  assert.equal(keyAt(root, pr1, 'approvals'), 'unreadable');
  assert.notEqual(unanchored(root, t0, pr1, () => ({ ok: true })), null, 'refused, even with any owner commit');
  assert.throws(() => loadConfig(root, pr1), /appears twice/);
});

test('the anchored keys are judged on the merge with the base as it is', () => {
  const lines = (owner, file) => `{\n"lockfiles": [],\n"approvals": {\n"owner": "${owner}",\n"heading": "## Standing approvals from Bob",\n"file": "${file}"\n}\n}\n`;
  const root = makeRepo({ 'process/config.json': lines('bob', 'CLAUDE.md') });
  const mb = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', '-b', 'head'], { cwd: root });
  write(root, { 'process/config.json': lines('carol', 'CLAUDE.md') });
  git(['commit', '-q', '-am', 'the owner names carol on the tranche'], { cwd: root });
  const head = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  // The base unchanged since: the merge holds the head's judged value.
  assert.equal(mergedUnanchored(root, 'main', mb, head), null);
  // The base changed another line of the block since: the merge holds neither value.
  write(root, { 'process/config.json': lines('bob', 'AGENTS.md') });
  git(['commit', '-q', '-am', 'the owner moves the file on main'], { cwd: root });
  assert.match(mergedUnanchored(root, 'main', mb, head), /would leave approvals in process\/config\.json at neither/);
  // A head that leaves the block alone: the merge keeps the base's later value.
  git(['checkout', '-q', '-b', 'other', mb], { cwd: root });
  const other = commit(root, { 'x.txt': 'x' });
  assert.equal(mergedUnanchored(root, 'main', mb, other), null);
});

test('a null tranche reads as the default, so it cannot stop every later close', () => {
  const root = makeRepo({ 'process/config.json': { tranche: null } });
  assert.equal(loadConfig(root, 'HEAD').tranche, 'tranche');
  assert.equal(keyAt(root, 'HEAD', 'tranche'), 'tranche');
});

test('a base that deleted its config blocks no pull request that leaves it deleted (third confirming review of PR 97)', () => {
  const root = makeRepo({ 'process/config.json': { approvals: { owner: 'carol' } } });
  git(['checkout', '-q', '-b', 'pr'], { cwd: root });
  const head = commit(root, { 'x.txt': 'x' });
  git(['checkout', '-q', 'main'], { cwd: root });
  const mb = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['rm', '-q', 'process/config.json'], { cwd: root });
  git(['commit', '-q', '-m', 'the owner deletes the config'], { cwd: root });
  assert.equal(mergedUnanchored(root, 'main', mb, head), null);
});

import { recordCheck } from '../lib/record.mjs';
import { configOf } from '../lib/util.mjs';
test('the record check flags a change to a config whose parent had a duplicate key (third confirming review of PR 97)', () => {
  const dup = (o) => `{"approvals": {"owner": "x"}, "approvals": {"owner": "${o}"}}\n`;
  const root = makeRepo({ 'process/config.json': dup('neobobkrause') });
  const base = git(['rev-parse', 'HEAD'], { cwd: root });
  const head = commit(root, { 'process/config.json': dup('eve') }, 'a session names eve');
  const no = () => ({ author: { login: 'civicsmith' }, committer: { login: 'civicsmith' }, commit: { verification: { verified: false } } });
  const f = recordCheck(root, { ...configOf({}), max_file_bytes: 1e6 }, { base, head, lookup: no }).findings;
  assert.ok(f.some((x) => x.check === 'approvals'), JSON.stringify(f));
});

// ===== file: layer-early.test.mjs =====

// Early starts into the next layer (R14; Bob, 6 Nov ~18:55: "Why didn't the early starts launch
// before layer 8 closed?"): while layer n is open, a next-layer module whose providers have all
// landed or are COMPLETE starts early, on layer/<n+1> cut ahead from layer/<n>'s tip; it publishes
// once layer n+1 opens, which brings the branch up to the tranche; each is logged and its rework counted.
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { jobStart } from '../lib/job.mjs';
import { flowFile, jobCfg } from '../lib/layerbase.mjs';
import { earlyCut, earlyRework, earlyUsers, flowRows, layerJobs, layerLines, layerOpen, layerPublish, layerStartAct, layerStatus, openLayer, writeRows } from '../lib/layerflow.mjs';
import { layerIdle } from '../lib/sweep.mjs';
import { fetchState } from '../lib/state.mjs';
import { configOf, git } from '../lib/util.mjs';
import { commit, entry } from './helpers.mjs';
import { makeRepo } from './helpers.mjs';

const quiet = () => {};
const SB = 'process-state';
const P3 = 'node .process/tool/p3.mjs';
const LAYERS = '| layer | name | modules |\n| --- | --- | --- |\n| 1 | One | a, b |\n| 2 | Two | c, d |\n';
const MODULES = { modules: [{ id: 'a', layer: 1, uses: [] }, { id: 'b', layer: 1, uses: [] }, { id: 'c', layer: 2, uses: ['a'] }, { id: 'd', layer: 2, uses: ['b'] }] };
const io = { slug: 'o/p', openPRs: () => [] };
const CFG = { tranche: 'tranche', modules_file: 'build/modules.json' };
const cfgOf = () => configOf(CFG);

// a COMPLETE (settled), b OPEN with an unmet mark (layer 1's own work), c and d OPEN in layer 2.
function product(modules = MODULES) {
  const files = { 'process/config.json': CFG, 'build/layers.md': LAYERS, 'build/modules.json': modules };
  for (const id of ['a', 'b', 'c', 'd']) {
    files[`process/ledger/${id}.json`] = entry(id, { layer: id < 'c' ? 1 : 2, ...(id === 'a' ? { status: { state: 'COMPLETE' } } : {}) });
    files[`req/${id}.md`] = `# ${id}\n\n- **R1** a requirement${id === 'a' ? '' : ' *(not yet met: T1)*'}\n`;
  }
  const root = makeRepo(files);
  git(['branch', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  commit(root, { 'src/x.txt': 'tranche work' }, 'tranche');
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: root });
  git(['fetch', '-q', 'origin'], { cwd: root });
  layerOpen(root, 1, { io, log: quiet });
  return { root, bare };
}

test('layer jobs lists a next-layer module whose providers are settled as an early start, and names why another is not', () => {
  const { root } = product();
  const out = [];
  const r = layerJobs(root, 1, { io, log: (l) => out.push(l) });
  assert.equal(r.early_next, 2);
  assert.deepEqual(r.early.map((x) => [x.id, x.cmd]), [['c', `${P3} job start c --sessions <file> --early`]]);
  assert.ok(out.some((l) => /^early starts into layer 2, on idle capacity only, after layer 1's own/.test(l)), out.join('\n'));
  assert.ok(out.some((l) => /^not early \(layer 2\): d \(b is not started in layer 1\)$/.test(l)), out.join('\n'));
  // status's lines and the act owed carry them; idle capacity counts them after the layer's own.
  const v = openLayer(root, cfgOf(), { slug: 'o/p', io });
  assert.deepEqual(v.early.map((x) => x.id), ['c']);
  const lines = layerLines(root, cfgOf(), { view: v });
  assert.ok(lines.some((l) => l === `- ${P3} job start c --sessions <file> --early`), lines.join('\n'));
  assert.equal(layerStartAct({ ...v, startable: [] }), `${P3} layer jobs 1, then each early start it lists (layer 2)`);
  const ic = layerIdle({ live: 0, cap: 4, view: v, t: Date.now() });
  assert.equal(ic.startable, 2, 'b, then c early');
  assert.deepEqual(ic.reasons.slice(0, 2), [`1 x startable from ${P3} layer jobs 1, not started (start now: b; one listed after a provider in flight starts now with its plain job start, no --early: R10; only a recorded hold waits)`, `1 x early starts into layer 2 listed by ${P3} layer jobs 1, not started (c)`]);
});

// C16 (the copy, 7 Nov: 49 modules built before the ledger held every user back from an early
// start, the reason reading "without a ledger entry"): the provider and the act are named.
test('a provider with no ledger entry: not early, naming the missing entry and the census that writes it', () => {
  const { root } = product({ modules: [...MODULES.modules.map((m) => (m.id === 'c' ? { ...m, uses: ['a', 'legacy'] } : m)), { id: 'legacy', layer: 0, uses: [] }] });
  const out = [];
  const r = layerJobs(root, 1, { io, log: (l) => out.push(l) });
  assert.deepEqual(r.early.map((x) => x.id), []);
  assert.ok(out.some((l) => l.startsWith(`not early (layer 2): c (legacy has no ledger entry (process/ledger/legacy.json): it is settled once BOB lands one (the census in \`${P3} status --role bob\` lists the module and its fix))`)), out.join('\n'));
});

test('job start --early: layer/2 cut ahead from layer/1\'s tip, the early row recorded; the job\'s base is layer/2; once only; an unsettled module refused', () => {
  const { root } = product();
  const lines = [];
  const r = earlyCut(root, cfgOf(), 'c', { io, log: (l) => lines.push(l) });
  const l1 = git(['rev-parse', 'origin/layer/1'], { cwd: root });
  assert.deepEqual([r.layer, r.from, r.base], [2, 1, l1]);
  assert.equal(git(['rev-parse', 'origin/layer/2'], { cwd: root }), l1);
  assert.ok(lines.some((l) => /layer\/2 cut ahead to layer\/1 \S+ for early starts \(layer 2 is not open\)/.test(l)), lines.join('\n'));
  const rows = flowRows(root, SB, 2);
  assert.equal(rows.open, null, 'not opened');
  assert.deepEqual(rows.earlies.map((x) => [x.module, x.from, x.base, x.providers]), [['c', 1, l1, ['a']]]);
  const c = jobCfg(root, cfgOf(), 'c');
  assert.deepEqual([c.tranche, c.layer.n], ['layer/2', 2]);
  // A start that failed before its job branch reached origin is listed again; once pushed, refused.
  assert.deepEqual(layerJobs(root, 1, { io, log: quiet }).early.map((x) => x.id), ['c']);
  git(['push', '-q', 'origin', 'origin/layer/2:refs/heads/job/c'], { cwd: root });
  assert.deepEqual(layerJobs(root, 1, { io, log: quiet }).early.map((x) => x.id), []);
  assert.throws(() => earlyCut(root, cfgOf(), 'c', { io, log: quiet }), /c cannot start early into layer 2: it started early already; an early start that did not finish resumes with .*job start c once layer 2 opens/);
  assert.throws(() => earlyCut(root, cfgOf(), 'd', { io, log: quiet }), /d cannot start early into layer 2: b is not started in layer 1; .*layer jobs 1 lists the early starts; nothing was started/);
  assert.throws(() => earlyCut(root, cfgOf(), 'a', { io, log: quiet }), /a cannot start early/);
  // A later early start moves layer/2 forward to layer/1's new tip (a fast-forward).
  git(['checkout', '-q', '-B', 'w', 'origin/layer/1'], { cwd: root });
  commit(root, { 'src/a/more.txt': 'a landed again' }, 'land');
  git(['push', '-q', 'origin', 'w:layer/1'], { cwd: root });
  commit(root, { 'process/ledger/b.json': entry('b', { layer: 1, status: { state: 'COMPLETE' } }), 'req/b.md': '# b\n\n- **R1** a requirement\n' }, 'b complete');
  git(['push', '-q', 'origin', 'w:layer/1'], { cwd: root });
  const r2 = earlyCut(root, cfgOf(), 'd', { io, log: quiet });
  assert.equal(git(['rev-parse', 'origin/layer/2'], { cwd: root }), git(['rev-parse', 'origin/layer/1'], { cwd: root }));
  assert.equal(r2.layer, 2);
});

test('a start on the branch cut ahead without --early is refused; publish waits for the open', async () => {
  const { root } = product();
  earlyCut(root, cfgOf(), 'c', { io, log: quiet });
  git(['branch', '-f', 'layer/2', 'origin/layer/2'], { cwd: root });
  assert.throws(() => jobStart(root, 'd', { coordinator: 's', push: false, log: quiet }), /layer 2 is not open \(layer\/2 was cut ahead from layer 1 for early starts\): d starts early with --early while .*layer jobs 1 lists it/);
  await assert.rejects(layerPublish(root, 'c', { push: false, sync: async () => ({ ok: true }), complete: () => assert.fail('no run'), log: quiet }), /c: layer 2 is not open: layer\/2 was cut ahead from layer 1 for early starts .*; an early start publishes once it opens/);
  // layer jobs and layer status of the layer cut ahead say it is not open, never list its starts.
  assert.throws(() => layerJobs(root, 2, { io, log: quiet }), /^Error: layer 2 is not open: layer\/2 was cut ahead|layer 2 is not open: layer\/2 was cut ahead/);
  assert.throws(() => layerStatus(root, 2, { io, log: quiet }), /layer 2 is not open: layer\/2 was cut ahead from layer 1 for early starts/);
});

test('layer open of a layer cut ahead brings its branch up to the tranche (a fast-forward), then opens it', () => {
  const { root } = product();
  // Layer 1 moves on (a land), c starts early from that tip, and layer 1 merges into the tranche.
  git(['checkout', '-q', '-B', 'w', 'origin/layer/1'], { cwd: root });
  commit(root, { 'src/a/landed.txt': 'a land' }, 'land a');
  git(['push', '-q', 'origin', 'w:layer/1'], { cwd: root });
  earlyCut(root, cfgOf(), 'c', { io, log: quiet });
  git(['checkout', '-q', '-B', 'tranche', 'origin/tranche'], { cwd: root });
  git(['merge', '-q', '--no-ff', '--no-edit', 'origin/layer/1'], { cwd: root });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  git(['fetch', '-q', 'origin'], { cwd: root });
  const tip = git(['rev-parse', 'origin/tranche'], { cwd: root });
  writeRows(root, SB, 'layer 1 merged', [[flowFile(1, 'merged'), { row: 'merged', layer: 1, commit: tip, at: new Date().toISOString() }]]);
  fetchState(root, SB, { fresh: true });
  // Layer 1 merged, layer 2 not open yet: still refused (cold review of R14: the guards stopped at
  // layer 1's merge, and a plain start took the cut-ahead tip).
  git(['branch', '-f', 'layer/2', 'origin/layer/2'], { cwd: root });
  assert.throws(() => jobStart(root, 'd', { coordinator: 's', push: false, log: quiet }), /layer 2 is not open \(layer\/2 was cut ahead from layer 1 for early starts\)/);
  assert.throws(() => layerStatus(root, 2, { io, log: quiet }), /layer 2 is not open: layer\/2 was cut ahead from layer 1/);
  const lines = [];
  // c's draft pull request into layer/2 (opened by its early start).
  const c0 = git(['rev-parse', 'origin/layer/1'], { cwd: root });
  const io2 = { ...io, openPRs: (slug, base) => (base === 'layer/2' ? [{ number: 7, draft: true, head: { ref: 'job/c', sha: c0 } }] : []) };
  const o = layerOpen(root, 2, { io: io2, log: (l) => lines.push(l) });
  assert.equal(git(['rev-parse', 'origin/layer/2'], { cwd: root }), tip);
  assert.equal(o.from, tip);
  assert.ok(lines.some((l) => /layer\/2, cut ahead for early starts at \S+, brought up to tranche/.test(l)), lines.join('\n'));
  assert.ok(flowRows(root, SB, 2).open);
  // c started early: working, not listed to start again; d is.
  assert.deepEqual(o.startable.map((x) => x.id), ['d']);
  // With no pull request into the layer (its start did not finish, or its PR closed): job start resumes it.
  const o2 = layerJobs(root, 2, { io, log: quiet });
  assert.deepEqual(o2.startable.map((x) => x.id), ['c', 'd']);
  assert.match(o2.states.find((x) => x.id === 'c').why, /started early while layer 1 was open; no pull request into the layer: job start resumes it/);
});

test('layer open refuses a branch cut ahead that the tranche does not hold (the layer before it not merged into it)', () => {
  const { root } = product();
  const tip = git(['rev-parse', 'origin/tranche'], { cwd: root });
  // layer/1 moves on, c starts early from it, and a merged row names a tranche without it.
  git(['checkout', '-q', '-B', 'w', 'origin/layer/1'], { cwd: root });
  commit(root, { 'src/a/z.txt': 'z' }, 'more');
  git(['push', '-q', 'origin', 'w:layer/1'], { cwd: root });
  earlyCut(root, cfgOf(), 'c', { io, log: quiet });
  writeRows(root, SB, 'layer 1 merged', [[flowFile(1, 'merged'), { row: 'merged', layer: 1, commit: tip, at: new Date().toISOString() }]]);
  fetchState(root, SB, { fresh: true });
  assert.throws(() => layerOpen(root, 2, { io, log: quiet }), /layer\/2 was cut ahead for early starts at \S+, and the tranche tranche does not hold it/);
});

test('the rework of early starts: a reschedule, a retest, a provider notice after the start; the rate', () => {
  const at = '2026-11-06T10:00:00Z';
  const rows = { earlies: ['c', 'd', 'e', 'f', 'f'].map((m) => ({ row: 'early', module: m, from: 1, at })), reschedules: [{ user: 'c', at: '2026-11-06T10:30:00Z' }], retests: [{ module: 'd', at: '2026-11-06T10:30:00Z' }, { module: 'e', at: '2026-11-06T09:00:00Z' }] };
  // f's notice came before its start, and a withdrawn notice never counts; f's two rows count once.
  const r = earlyRework(rows, [{ users: ['e'], at: '2026-11-06T11:00:00Z' }, { users: ['f'], at: '2026-11-06T09:00:00Z' }, { users: ['f'], at: '2026-11-06T12:00:00Z', withdrawn: true }]);
  assert.deepEqual(r.each.map((x) => x.rework), ['reschedule', 'retest', 'notice', null]);
  assert.deepEqual([r.early, r.rework, r.rate], [4, 3, 75]);
  assert.deepEqual(earlyRework({ earlies: [], reschedules: [], retests: [] }), { early: 0, rework: 0, rate: null, each: [] });
});

// Cold review of R14: a provider in layer 1 that lands again with an interface change after c started
// early into layer 2 reschedules c there (layerLand), never only a notice c's own land would answer.
test('a provider\'s later interface change reschedules a user that started early into the next layer, while that layer is not open', () => {
  const { root } = product();
  const home = (u) => (u < 'c' ? 1 : 2);
  assert.deepEqual([...earlyUsers(root, SB, 1, ['c', 'd'], home)], [], 'no early start yet');
  earlyCut(root, cfgOf(), 'c', { io, log: quiet });
  assert.deepEqual([...earlyUsers(root, SB, 1, ['c', 'd'], home)], [['c', 2]]);
  // Once layer 2 opens, its own land and reschedule rows govern: not this path.
  writeRows(root, SB, 'layer 2 open', [[flowFile(2, 'open'), { row: 'open', layer: 2, at: new Date().toISOString() }]]);
  fetchState(root, SB, { fresh: true });
  assert.deepEqual([...earlyUsers(root, SB, 1, ['c', 'd'], home)], []);
});

// ===== file: merge-waits.test.mjs =====

// Defect sweep 4 Nov, #6, #8 and #13: merge's waits on the gate, and the merge base of a merged
// pull request read in a shallow clone.
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { BOT, GATE, RECEIPT, block } from '../lib/github.mjs';
import { GATE_CAP_MINUTES, GATE_WAIT_MINUTES, merge, mergePlain, waitForChecks, waitForGate } from '../lib/merge.mjs';
import { readRows } from '../lib/metrics.mjs';
import { mergedRange, noticeFile, withdrawNotice } from '../lib/notice.mjs';
import { noticeTriage } from '../lib/triage.mjs';
import { git, isShallow, loadConfig } from '../lib/util.mjs';
import { commit, entry, makeRepo, onState } from './helpers.mjs';

const quiet = () => {};
const MIN = 60000;
// A reader that gives up after `n` rounds, so a wait that never ends fails the test, not hangs it.
const rounds = (n, f) => { let i = 0; return (...a) => { if (++i > n) throw new Error(`still waiting after ${n} rounds`); return f(i, ...a); }; };

// #6 -------------------------------------------------------------------------------------------

test('the gate wait defaults past the gate job\'s own cap, which is the shim\'s timeout-minutes', () => {
  const shim = readFileSync(new URL('../../shims/process-gate.yml', import.meta.url), 'utf8');
  const cap = Number(shim.match(/\n  gate:\n(?:    .*\n)*?    timeout-minutes: (\d+)/)[1]);
  assert.equal(GATE_CAP_MINUTES, cap);
  assert.ok(GATE_WAIT_MINUTES > GATE_CAP_MINUTES, 'merge waits longer than a gate run can take');
  const p3 = readFileSync(new URL('../p3.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(p3, /a\.minutes \|\| (20|30)/, 'the command line leaves the default to merge');
});

test('the gate wait stops at once when the pull request\'s head moves off the tip: that run is cancelled and never comes', () => {
  const T = 't'.repeat(40);
  const T2 = 'u'.repeat(40);
  const was = 'w'.repeat(40);
  // GitHub still shows the head before the push for a moment: that is waited past.
  const heads = [was, T, T2];
  const pr = rounds(10, (i) => ({ state: 'open', head: { ref: 'job/alpha', sha: heads[Math.min(i - 1, 2)] } }));
  const read = rounds(10, () => ({ status: 'completed', conclusion: 'cancelled' }));
  assert.throws(() => waitForGate('o/r', T, { every: 0, read, pr, was, log: quiet }), /^Error: job\/alpha moved to uuuuuuuuuu while the gate on tttttttttt was awaited: that gate will not finish; run merge again$/);
  // A pull request merged or closed meanwhile stops it too.
  assert.throws(() => waitForGate('o/r', T, { every: 0, read: rounds(10, () => ({ status: 'completed', conclusion: 'cancelled' })), pr: () => ({ state: 'closed', merged: true, head: { sha: T } }), log: quiet }), /pull request is merged while the gate/);
});

test('past the wait, the gate is waited on only while a run is in progress, up to its cap', () => {
  const T = 't'.repeat(40);
  const started = (ago) => new Date(Date.now() - ago * MIN).toISOString();
  // In progress, started 40 min ago: within the cap, so waited on until it completes.
  const going = rounds(10, (i) => (i < 3 ? { status: 'in_progress', started_at: started(40) } : { status: 'completed', conclusion: 'success' }));
  assert.equal(waitForGate('o/r', T, { minutes: 0, every: 0, read: going, log: quiet }).conclusion, 'success');
  // In progress past its cap, queued, not started, or cancelled: refused at the deadline.
  for (const run of [{ status: 'in_progress', started_at: started(GATE_CAP_MINUTES + 10) }, { status: 'queued' }, null, { status: 'completed', conclusion: 'cancelled' }]) {
    assert.throws(() => waitForGate('o/r', T, { minutes: 0, every: 0, read: rounds(3, () => run), log: quiet }), /did not finish within 0 min/);
  }
});

// A job branch on an origin, its PR's comments and gate.
function jobRepo() {
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
const remoteTip = (root) => git(['ls-remote', 'origin', 'refs/heads/job/alpha'], { cwd: root }).split('\t')[0];
const moveTranche = (root, f) => {
  git(['checkout', '-q', 'tranche'], { cwd: root });
  commit(root, { [f]: f });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
};
// GitHub as it is: the PR's head is origin's job/alpha; gate rows agree on every sha in `green`.
function jobIO(root, { gate, merged = [] }) {
  const all = (shas) => [
    { id: 1, body: block(RECEIPT, { module: 'alpha', attempt: 1, sha: shas[0] }), user: { login: 'c' } },
    { id: 2, body: block(GATE, { runs: shas.map((sha) => ({ sha, ok: true, receipt: 'agrees', receipt_attempt: 1, run_id: 11 })) }), user: { login: BOT } },
  ];
  const seen = [];
  return {
    seen,
    io: {
      getPR: () => ({ state: 'open', draft: false, user: { login: 'c' }, base: { ref: 'tranche' }, head: { ref: 'job/alpha', sha: remoteTip(root) } }),
      comments: () => all(seen.length ? seen : [remoteTip(root)]),
      checkRun: (slug, sha) => gate(sha),
      verify: () => true,
      mergePR: (slug, n, sha) => { merged.push(sha); return { merged: true, sha: 'm'.repeat(40) }; },
    },
  };
}

test('merge run again on the merge-row tip whose gate outran the wait waits on that gate, pushes no second row and merges that tip', () => {
  const { root, head } = jobRepo();
  // The first run pushes the merge row; its gate is still queued when the wait ends.
  const first = jobIO(root, { gate: (sha) => (sha === head ? { status: 'completed', conclusion: 'success' } : { status: 'queued' }) });
  assert.throws(() => merge(root, 3, { slug: 'o/r', io: first.io, reviewed: 'fresh', rounds: 1, reviewMinutes: 5, findings: 0, actedOn: 0, minutes: 0, every: 0, log: quiet }), /did not finish within 0 min/);
  const T = remoteTip(root);
  assert.notEqual(T, head);
  // The rerun: the gate on T is in progress, then green.
  let reads = 0;
  const merged = [];
  const again = jobIO(root, { merged, gate: () => (++reads < 3 ? { status: 'in_progress' } : { status: 'completed', conclusion: 'success' }) });
  again.seen.push(head, T);
  const logs = [];
  const r = merge(root, 3, { slug: 'o/r', io: again.io, reviewed: 'fresh', rounds: 1, reviewMinutes: 5, findings: 0, actedOn: 0, every: 0, log: (m) => logs.push(m), wait: 0 });
  assert.equal(r.merged, true);
  assert.deepEqual(merged, [T], 'merges the tip the first run pushed');
  assert.equal(remoteTip(root), T, 'nothing pushed');
  assert.match(logs.join('\n'), /already holds the merge row for PR 3; no second row is written/);
  git(['checkout', '-q', T], { cwd: root });
  assert.equal(readRows(root, 'alpha').filter((x) => x.row === 'merge').length, 1);
  git(['checkout', '-q', 'main'], { cwd: root });
});

test('merge run again after the tranche moved brings the tip up to it, but writes no second merge row', () => {
  const { root, head } = jobRepo();
  // The first run gives up on a gate still queued; T goes green after, and the tranche moves.
  const first = jobIO(root, { gate: (sha) => (sha === head ? { status: 'completed', conclusion: 'success' } : { status: 'queued' }) });
  assert.throws(() => merge(root, 3, { slug: 'o/r', io: first.io, reviewed: 'fresh', rounds: 1, reviewMinutes: 5, findings: 0, actedOn: 0, minutes: 0, every: 0, log: quiet }), /did not finish within 0 min/);
  const T = remoteTip(root);
  moveTranche(root, 'fix.txt');
  const merged = [];
  const again = jobIO(root, { merged, gate: () => ({ status: 'completed', conclusion: 'success' }) });
  again.seen.push(head, T);
  assert.equal(merge(root, 3, { slug: 'o/r', io: again.io, reviewed: 'fresh', rounds: 1, reviewMinutes: 5, findings: 0, actedOn: 0, log: quiet, wait: 0 }).merged, true);
  const T2 = remoteTip(root);
  assert.notEqual(T2, T);
  assert.deepEqual(merged, [T2]);
  git(['checkout', '-q', T2], { cwd: root });
  assert.equal(readRows(root, 'alpha').filter((x) => x.row === 'merge').length, 1, 'one merge row per pull request');
  git(['checkout', '-q', 'main'], { cwd: root });
});

test('merge stops waiting at once when the job pushes over the merge-row tip', () => {
  const { root, head } = jobRepo();
  let pushedOver = false;
  const f = jobIO(root, {
    gate: rounds(20, (i, sha) => {
      if (sha === head) return { status: 'completed', conclusion: 'success' };
      // The job pushes T2 over BOB's tip; the run on the tip is cancelled.
      if (!pushedOver) {
        pushedOver = true;
        git(['push', '-q', '--force', 'origin', `${head}:refs/heads/job/alpha`], { cwd: root });
        git(['checkout', '-q', '-B', 'side', head], { cwd: root });
        commit(root, { 'src/alpha/b.mjs': 'y' });
        git(['push', '-q', '--force', 'origin', 'side:refs/heads/job/alpha'], { cwd: root });
        git(['checkout', '-q', 'main'], { cwd: root });
      }
      return { status: 'completed', conclusion: 'cancelled' };
    }),
  });
  assert.throws(() => merge(root, 3, { slug: 'o/r', io: f.io, reviewed: 'fresh', rounds: 1, reviewMinutes: 5, findings: 0, actedOn: 0, every: 0, log: quiet }), /job\/alpha moved to \w+ while the gate on \w+ was awaited/);
});

// #13 ------------------------------------------------------------------------------------------

test('merge --plain of the tranche into main waits on a gate still in progress past the wait, up to its cap, and stops when the head moves', () => {
  const root = makeRepo({ 'README.md': 'x', 'process/config.json': {} });
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  const sha = commit(root, { 'notes.txt': 'closed' });
  git(['checkout', '-q', 'main'], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: root });
  const started = new Date(Date.now() - 30 * MIN).toISOString();
  const calls = [];
  const io = (runs, head = () => sha) => ({
    getPR: () => ({ state: 'open', draft: false, base: { ref: 'main', repo: { full_name: 'o/r', default_branch: 'main' } }, head: { ref: 'tranche', sha: head(), repo: { full_name: 'o/r' } } }),
    requiredChecks: () => ({ checks: [{ context: 'gate' }] }),
    checkRuns: runs,
    repo: { released: () => false, shim: () => null, descends: () => false },
    mergePR: (s, n, at) => { calls.push(at); return { merged: true, sha: 'm'.repeat(40) }; },
  });
  // Every suite in one gate job: still in progress at the deadline, inside its cap, then green.
  const slow = rounds(10, (i) => [i < 4 ? { id: 1, status: 'in_progress', started_at: started } : { id: 1, status: 'completed', conclusion: 'success', started_at: started }]);
  assert.equal(mergePlain(root, 9, { slug: 'o/r', noReview: 'x', minutes: 0, every: 0, log: quiet, io: io(slow) }).merged, true);
  assert.deepEqual(calls, [sha]);
  // Queued past the wait is refused.
  assert.throws(() => mergePlain(root, 9, { slug: 'o/r', noReview: 'x', minutes: 0, every: 0, log: quiet, io: io(rounds(5, () => [{ id: 1, status: 'queued' }])) }), /required checks still running on \w+ after 0 min: gate queued/);
  // The head moving while it waits stops it at once.
  let n = 0;
  assert.throws(() => mergePlain(root, 9, { slug: 'o/r', noReview: 'x', every: 0, log: quiet, io: io(rounds(5, () => [{ id: 1, status: 'in_progress', started_at: started }]), () => (++n > 2 ? 'e'.repeat(40) : sha)) }), /tranche moved to e{10} while its checks/);
});

// #8 -------------------------------------------------------------------------------------------

const REQ = '# p\n\n- **R1** *(not yet met: x)* signs a token\n- **R2** checks a token\n';
const NOTICE = { row: 'notice', key: 'p:7', provider: 'p', ids: ['R1'], pr: 7, users: ['u1'] };
// A provider job merged into the tranche after the tranche moved `ahead` commits past the job's
// base, and a depth-1 clone of origin, as a fresh BOB has after a handover.
function shallowMerged(ahead = 60) {
  const root = makeRepo({
    'process/config.json': { modules_file: 'process/modules.json', requirements_dir: 'req' },
    'process/modules.json': { modules: [{ id: 'p', paths: ['src/p/'] }, { id: 'u1', paths: ['src/u1/'], uses: ['p'] }] },
    'process/ledger/p.json': entry('p', { status: { state: 'COMPLETE' } }), 'process/ledger/u1.json': entry('u1', { status: { state: 'COMPLETE' } }),
    'req/p.md': REQ, 'req/u1.md': '# u1\n\n- **R1** met\n', 'src/p/a.mjs': 'export const sign = 1;\n', 'src/u1/a.mjs': 'x\n',
  });
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['checkout', '-q', '-b', 'job/p', 'tranche'], { cwd: root });
  const head = commit(root, { 'test/p/b.test.mjs': 'x\n', 'req/p.md': REQ.replace('*(not yet met: x)* ', '') });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  for (let i = 0; i < ahead; i++) commit(root, { [`t/${i}.txt`]: `${i}` });
  git(['merge', '-q', '--no-ff', '--no-edit', 'job/p'], { cwd: root });
  const m = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['push', '-q', 'origin', 'tranche', 'job/p', 'main'], { cwd: root });
  onState(root, { [noticeFile('p:7')]: JSON.stringify(NOTICE) + '\n' });
  git(['push', '-q', 'origin', 'refs/remotes/origin/process-state:refs/heads/process-state'], { cwd: root });
  const mb = git(['merge-base', `${m}^1`, `${m}^2`], { cwd: root });
  const bob = join(mkdtempSync(join(tmpdir(), 'p3-bob-')), 'bob');
  git(['clone', '-q', '--depth', '1', '-b', 'main', `file://${bare}`, bob], { cwd: root });
  for (const [k, v] of [['user.email', 'bob@example.com'], ['user.name', 'BOB'], ['commit.gpgsign', 'false']]) git(['config', k, v], { cwd: bob });
  assert.ok(isShallow(bob));
  // GitHub's compare, answered from the full history.
  const asked = [];
  const compare = (slug, a, b) => { asked.push([a, b]); return { merge_base_commit: { sha: git(['merge-base', a, b], { cwd: root }) } }; };
  return { root, bob, m, mb, head, compare, asked };
}

test('a shallow clone takes a merged pull request\'s merge base from GitHub\'s compare, however far back it lies', () => {
  const s = shallowMerged(60);
  const r = mergedRange(s.bob, s.m, { slug: 'o/r', n: 7, read: s.compare });
  assert.deepEqual(r, { head: s.head, mb: s.mb });
  assert.deepEqual(s.asked, [[git(['rev-parse', `${s.m}^1`], { cwd: s.root }), s.head]]);
  assert.ok(isShallow(s.bob), 'nothing was unshallowed');
  // No answer from GitHub: refused, naming the step.
  const t = shallowMerged(1);
  assert.throws(() => mergedRange(t.bob, t.m, { slug: 'o/r', n: 7, read: () => null }), /this clone is shallow and GitHub did not give the merge base of pull request 7/);
});

test('notice triage, notice withdraw and merge run again on a merged pull request read a merge base 60 commits back in a shallow clone', () => {
  const s = shallowMerged(60);
  const getPR = () => ({ merged: true, state: 'closed', merge_commit_sha: s.m, head: { ref: 'job/p', sha: s.head }, base: { ref: 'tranche' } });
  const out = [];
  noticeTriage(s.bob, 'p:7', { log: (x) => out.push(x), io: { slug: 'o/r', getPR, compare: s.compare } });
  assert.match(out.join('\n'), /- R1\n  before: - \*\*R1\*\* \*\(not yet met: x\)\* signs a token\n  after:  - \*\*R1\*\* signs a token/);
  const r = merge(s.bob, 7, { slug: 'o/r', io: { getPR, compare: s.compare }, reviewed: 'fresh', rounds: 1, reviewMinutes: 5, findings: 0, actedOn: 0, log: quiet });
  assert.equal(r.merged, true);
  assert.deepEqual(r.notices.rows, []);
  const w = withdrawNotice(s.bob, loadConfig(s.bob), 'p:7', { getPR, slug: 'o/r', log: quiet, compare: s.compare });
  assert.equal(w.merge_commit, s.m);
});

test('a job branch that conflicts with the tranche is refused, naming job sync', () => {
  const { root, head } = jobRepo();
  git(['checkout', '-q', 'tranche'], { cwd: root });
  commit(root, { 'src/alpha/a.mjs': 'the tranche says otherwise' });
