// ===== file: ghhook.test.mjs (continued) =====

  const d = hookDecision({ tool_name: 'mcp__github__pull_request_read', tool_input: {} }, root, { p: P, sleep: () => assert.fail('no sleep past the cap') });
  assert.match(d.block, /acts on GitHub wait until .*then retry the tool call \(retry it\)/);
});

test('the hook command: exit 0 to allow, exit 2 with the reason on stderr to block', () => {
  const root = makeRepo({ 'README.md': 'x\n' });
  const hook = (input) => spawnSync(process.execPath, [P3, 'github', 'hook'], { cwd: root, input: JSON.stringify(input), encoding: 'utf8', env: { ...process.env, P3_GITHUB_LOG: '0' } });
  const ok = hook({ tool_name: 'Bash', tool_input: { command: 'node tool/p3.mjs status' } });
  assert.equal(ok.status, 0, ok.stderr);
  const no = hook({ tool_name: 'Bash', tool_input: { command: 'git push origin main' } });
  assert.equal(no.status, 2);
  assert.match(no.stderr, /GitHub pacing \(P27\): a raw git push goes around GitHub pacing/);
  const read = hook({ tool_name: 'mcp__github__pull_request_read', tool_input: {} });
  assert.equal(read.status, 0, read.stderr);
  const none = spawnSync(process.execPath, [P3, 'github', 'hook'], { cwd: root, input: '', encoding: 'utf8' });
  assert.equal(none.status, 2);
  // The hook's own entry (R17d), which the settings call: the same answers.
  const entry = (input) => spawnSync(process.execPath, [HOOK], { cwd: root, input: input === '' ? '' : JSON.stringify(input), encoding: 'utf8', env: { ...process.env, P3_GITHUB_LOG: '0' } });
  assert.equal(entry({ tool_name: 'Bash', tool_input: { command: 'node tool/p3.mjs status' } }).status, 0);
  const no2 = entry({ tool_name: 'Bash', tool_input: { command: 'gh pr list' } });
  assert.equal(no2.status, 2);
  assert.match(no2.stderr, /GitHub pacing \(P27\): a raw gh command/);
  assert.equal(entry({ tool_name: 'mcp__github__pull_request_read', tool_input: {} }).status, 0);
  assert.equal(entry('').status, 2);
});

// The read path (R17d; coordinator: under 300 ms p95, no ledger fetch on a read, the pause and stop
// cached and refreshed by ls-remote, fetched only when the ledger moved).
const cacheAt = (root, c) => writeFileSync(join(commonDir(root), LEDGER_CACHE), JSON.stringify(c));
test('a connector read uses the cached pause and stop, any age, and never fetches; a stale or missing cache starts one background refresh', (t) => {
  logTo(t);
  const root = makeRepo({ 'README.md': 'x\n' });
  const kicks = [];
  const kick = () => kicks.push(1);
  const errs = [];
  const run = (op) => hookRun({ tool_name: `mcp__github__${op}`, tool_input: {} }, root, { kick, err: (m) => errs.push(m), opts: { sleep: () => assert.fail('a read never waits on the floor') } });
  // No cache: the read passes at once, and a refresh is started.
  assert.equal(run('pull_request_read'), 0);
  assert.equal(kicks.length, 1);
  // A fresh cache: nothing started; its stop refuses the read (a stop is cached too).
  cacheAt(root, { at: Date.now(), pause: { at: '2026-11-06T23:00:00Z', until: '2026-11-06T23:01:00Z', why: 'secondary rate limit', stopped: true }, use: [], ledger: null, tip: 'a' });
  assert.equal(run('list_pull_requests'), 2);
  assert.match(errs.pop(), /every GitHub call is stopped/);
  assert.equal(kicks.length, 1);
  // A stale cache still answers (here a pause past its wait cap: refused), and starts a refresh.
  cacheAt(root, { at: Date.now() - 600e3, pause: { at: new Date().toISOString(), until: new Date(Date.now() + 600e3).toISOString(), why: 'secondary rate limit' }, use: [], ledger: null, tip: 'a' });
  assert.equal(run('get_file_contents'), 2);
  assert.match(errs.pop(), /GitHub rate-limited this account/);
  assert.equal(kicks.length, 2);
  // Never a fetch on the read path: peekShare reads only the cache.
  assert.deepEqual(peekShare(root, { kick: () => {} }).read().pause.why, 'secondary rate limit');
  // A write reads the ledger through its share (the share given): its stop refuses though the cache has none.
  cacheAt(root, { at: Date.now(), pause: null, use: [], ledger: null, tip: 'a' });
  let reads = 0;
  assert.equal(hookRun({ tool_name: 'mcp__github__add_issue_comment', tool_input: {} }, root, { kick, err: (m) => errs.push(m), share: { read: () => { reads++; return { pause: { at: '2026-11-06T23:00:00Z', until: '2026-11-06T23:01:00Z', why: 'x', stopped: true }, use: [] }; }, pause: () => null } }), 2);
  assert.ok(reads >= 1, 'the write read the ledger');
  assert.equal(kicks.length, 2);
});

test('the background refresh: the ledger unmoved, the cache is renewed without a fetch; moved, it is fetched and read again', () => {
  const root = makeRepo({ 'README.md': 'x\n' });
  const ledger = join(mkdtempSync(join(tmpdir(), 'p3-ledger-')), 'l.git');
  git(['init', '-q', '--bare', ledger], { cwd: root });
  const put = (pause) => {
    const w = makeRepo({ 'github/pause.json': JSON.stringify(pause) });
    git(['push', '-q', '-f', ledger, 'HEAD:refs/heads/process-state'], { cwd: w });
  };
  put({ at: '2026-11-07T00:00:00Z', until: '2026-11-07T00:01:00Z', why: 'first' });
  let t = Date.parse('2026-11-07T00:00:00Z');
  const sh = stateShare(root, null, { url: ledger, now: () => t });
  assert.equal(sh.refresh(), 'fetched');
  const c1 = JSON.parse(readFileSync(join(commonDir(root), LEDGER_CACHE), 'utf8'));
  assert.equal(c1.pause.why, 'first');
  assert.equal(c1.tip, git(['ls-remote', ledger, 'refs/heads/process-state'], { cwd: root }).split('\t')[0]);
  t += 60e3;
  const fetches = git(['rev-parse', 'refs/p3/ledger/state'], { cwd: root });
  assert.equal(sh.refresh(), 'unmoved');
  assert.equal(JSON.parse(readFileSync(join(commonDir(root), LEDGER_CACHE), 'utf8')).at, t, 'renewed');
  assert.equal(git(['rev-parse', 'refs/p3/ledger/state'], { cwd: root }), fetches);
  put({ at: '2026-11-07T00:00:30Z', until: '2026-11-07T00:02:00Z', why: 'second', stopped: true });
  assert.equal(sh.refresh(), 'fetched');
  const c3 = JSON.parse(readFileSync(join(commonDir(root), LEDGER_CACHE), 'utf8'));
  assert.equal(c3.pause.why, 'second');
  assert.equal(c3.pause.stopped, true);
  assert.equal(remoteStore(root, ledger).tip(), c3.tip);
});

test('one background refresh at a time per clone; a marker a minute old (a refresh killed) is taken over', () => {
  const root = makeRepo({ 'README.md': 'x\n' });
  const entry = join(mkdtempSync(join(tmpdir(), 'p3-noop-')), 'noop.mjs');
  writeFileSync(entry, '');
  let t = 1e12;
  assert.equal(kickRefresh(root, { now: () => t, entry }), true);
  assert.equal(kickRefresh(root, { now: () => t + 5e3, entry }), false);
  t += 61e3;
  assert.equal(kickRefresh(root, { now: () => t, entry }), true);
  // The refresh taken over clears no successor's marker; its own it clears.
  refreshDone(root, String(t - 61e3));
  assert.equal(kickRefresh(root, { now: () => t + 1e3, entry }), false);
  refreshDone(root, String(t));
  assert.equal(kickRefresh(root, { now: () => t + 1e3, entry }), true);
  refreshDone(root);
});

test('the read path takes no cache of another ledger (a config changed); the background refresh, run as the hook runs it, fills this ledger\'s cache', () => {
  const ledger = join(mkdtempSync(join(tmpdir(), 'p3-ledger-')), 'l.git');
  const URL = 'https://github.com/o/ledger.git';
  const seed = makeRepo({ 'github/pause.json': JSON.stringify({ at: '2026-11-07T00:00:00Z', until: '2099-01-01T00:00:00Z', why: 'from the ledger' }) });
  git(['init', '-q', '--bare', ledger], { cwd: seed });
  git(['push', '-q', ledger, 'HEAD:refs/heads/process-state'], { cwd: seed });
  // A clone that names the ledger, reached by its GitHub name.
  const root = makeRepo({ 'pacing.json': JSON.stringify({ ledger: 'o/ledger' }) });
  git(['config', `url.${ledger}.insteadOf`, URL], { cwd: root });
  // A cache of another ledger, fresh, with a stop: not this clone's, so not obeyed.
  cacheAt(root, { at: Date.now(), pause: { at: '2026-11-07T00:00:00Z', until: '2026-11-07T00:01:00Z', why: 'elsewhere', stopped: true }, use: [], ledger: 'https://github.com/o/other.git', tip: 'a' });
  const kicks = [];
  assert.equal(hookRun({ tool_name: 'mcp__github__pull_request_read', tool_input: {} }, root, { kick: () => kicks.push(1), err: () => {} }), 0);
  assert.equal(kicks.length, 1, 'no cache of this ledger: a refresh is started');
  // The refresh, as kickRefresh starts it: its own process, its marker cleared at the end.
  const mark = String(Date.now());
  writeFileSync(join(commonDir(root), 'p3-gh-refreshing'), mark);
  const r = spawnSync(process.execPath, [HOOK, '--refresh'], { cwd: root, encoding: 'utf8', env: { ...process.env, P3_REFRESH_MARK: mark, P3_GITHUB_LOG: '0' } });
  assert.equal(r.status, 0, r.stderr);
  const c = JSON.parse(readFileSync(join(commonDir(root), LEDGER_CACHE), 'utf8'));
  assert.deepEqual([c.ledger, c.pause.why, !!c.tip], [URL, 'from the ledger', true]);
  assert.throws(() => readFileSync(join(commonDir(root), 'p3-gh-refreshing'), 'utf8'), /ENOENT/, 'the marker is cleared');
  // Now the read obeys this ledger's pause (here past the hook's wait cap: refused).
  const errs = [];
  assert.equal(hookRun({ tool_name: 'mcp__github__pull_request_read', tool_input: {} }, root, { kick: () => kicks.push(1), err: (m) => errs.push(m) }), 2);
  assert.match(errs.pop(), /GitHub rate-limited this account \(from the ledger\)/);
});

// ===== file: settings-policy.test.mjs =====

// One settings policy, judged by one rule set (C17, the coordinator, 7 Nov): Bob applied R17c's
// settings to the copy (deny raw git push and gh, allow the tool's push and Artifact, the pacing
// hooks), and setup check refused every job start: its deny-list condition still took a raw git push
// as the session's route, and its shim drift check knew only the SessionStart hook, while admit
// (C3, C15) already held the R17c lists. The settings Bob applies (notes/r17c-settings.md) are read
// here, once, by every rule that judges them: setup check's deny-list and shim-drift conditions and
// admit's told commands and tools.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import './helpers.mjs';
import { admitCheck, admitTools, toldCommands, toldTools } from '../lib/admit.mjs';
import { HOOKS_SHIM, readers } from '../lib/setup.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
// The settings files as the note gives them, per repository.
export function r17cFiles(root = ROOT) {
  const md = readFileSync(join(root, 'notes/r17c-settings.md'), 'utf8');
  return Object.fromEntries([...md.matchAll(/## (\S+)\n\n```json\n([\s\S]*?)```/g)].map((m) => [m[1], JSON.parse(m[2])]));
}
// The note's product repository: the one that is neither process3 nor its probes (named by the
// note, never here: process3 is product-neutral, BD-R2).
export const productOf = (files) => Object.keys(files).find((k) => !/\/process3(-probes)?$/.test(k));
const PRODUCT = productOf(r17cFiles());
const conds = JSON.parse(readFileSync(join(ROOT, 'setup/conditions.json'), 'utf8'));
const cond = (id) => (Array.isArray(conds) ? conds : conds.conditions || Object.values(conds)).find((c) => c.id === id);
const pin = { sha: 'p'.repeat(40), list: () => [], file: (f) => { try { return readFileSync(join(ROOT, f), 'utf8'); } catch { return null; } } };
const judge = (settings) => {
  const x = { where: 'origin/tranche', file: (f) => (f === '.claude/settings.json' ? JSON.stringify(settings) : null), pin: () => pin, cfg: { tranche: 'tranche' } };
  return Object.fromEntries(['deny-list', 'shim-drift'].map((id) => [id, readers[id](cond(id), x)]));
};

test('the R17c settings of each product (copy, probes) pass setup check\'s deny-list and shim-drift conditions and admit', () => {
  const files = r17cFiles();
  const told = toldCommands(ROOT);
