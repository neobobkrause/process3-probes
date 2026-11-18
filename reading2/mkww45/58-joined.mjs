// ===== file: state.mjs (continued) =====

    return !bob.some((b) => b.at >= m.at && id.test(b.text));
  });
}

// The config with `coordinator` resolved (Bob, 5 Nov 16:33: ROOT refreshes the coordinator): ROOT's
// addresses/coordinator.json on the state branch as last fetched, else process/config.json's.
// roles.mjs coordinatorOf is the same rule over an address read already.
export const withCoordinator = (root, cfg) => {
  let c = null;
  try { c = address(root, cfg.state_branch, 'coordinator'); } catch { c = null; }
  return c ? { ...cfg, coordinator: c } : cfg;
};

// The address read from git at this moment: the session id, or null.
export function address(root, sb, role) {
  const t = readState(root, sb, addressFile(role));
  if (t === null) return null;
  try { const a = JSON.parse(t); return (typeof a === 'string' ? a : a?.session || a?.id) || null; } catch { return t.trim() || null; }
}

// The record first: no uncommitted change to a tracked file, and no commit the branch's upstream
// (or, without one, origin's branch of the same name) lacks. A detached HEAD has no record of its own.
// .process is left out: after a merge of the tranche that moved the pin it reads as changed until
// the submodule is updated, and a job never commits it (defect sweep 4 Nov, #2; the gate catches
// a committed pin change), so a BLOCKED job can still wake BOB.
function unpushed(root) {
  if (git(['status', '--porcelain', '--untracked-files=no', '--ignore-submodules=all'], { cwd: root })) fail('this checkout has uncommitted changes; commit and push the record first, then send');
  const name = git(['symbolic-ref', '-q', '--short', 'HEAD'], { cwd: root, allowFail: true }).stdout.trim();
  if (!name) return;
  git(['fetch', '-q', 'origin', `+refs/heads/${name}:refs/remotes/origin/${name}`], { cwd: root, allowFail: true });
  let up = git(['rev-list', '--count', '@{upstream}..HEAD'], { cwd: root, allowFail: true });
  if (up.code !== 0) up = git(['rev-list', '--count', `refs/remotes/origin/${name}..HEAD`], { cwd: root, allowFail: true });
  if (up.code !== 0) fail(`${name} is not on origin; push the record first, then send`);
  if (Number(up.stdout) > 0) fail(`${name} has ${Number(up.stdout)} commit(s) not pushed; push the record first, then send`);
}

// send: the record first (the caller's work pushed, then the numbered message pushed), then the
// message and the address, read from git after that push, for the session to deliver.
export function send(root, sb, { from, to, text, log = console.log }) {
  roleName(from, '--from');
  roleName(to, 'the role sent to');
  if (typeof text !== 'string' || !text.trim()) fail('send <to-role> "<text>"');
  unpushed(root);
  const { n } = writeState(root, sb, `message from ${from} to ${to}`, (wt) => {
    const file = join(wt, messagesFile(from));
    const k = messages(existsSync(file) ? readFileSync(file, 'utf8') : '').reduce((m, x) => Math.max(m, x.n), 0) + 1;
    put(wt, messagesFile(from), JSON.stringify({ at: now(), row: 'sent', n: k, to, text: text.trim() }) + '\n', true);
    return { n: k };
  });
  const at = address(root, sb, to);
  const body = `MSG ${from}-${n} to ${to}: ${text.trim()}\n(numbered; a number already seen is a duplicate, ignore it)`;
  log(body);
  log(at ? `address of ${to}: ${at}` : `no address for ${to} on ${sb}`);
  log(`deliver it with send_message, then: send delivered ${n} --from ${from} (or send failed ${n} --from ${from})`);
  return { n, body, address: at };
}

// send delivered <n> | send failed <n>: the outcome, recorded only for a message that was sent.
export function outcome(root, sb, { from, n, result, reason, log = console.log }) {
  roleName(from, '--from');
  if (!Number.isInteger(n) || n < 1) fail(`send ${result} <n>: the message's number`);
  writeState(root, sb, `message ${from}-${n} ${result}`, (wt) => {
    const file = join(wt, messagesFile(from));
    if (!messages(existsSync(file) ? readFileSync(file, 'utf8') : '').some((m) => m.n === n)) fail(`${from} sent no message ${n}`);
    put(wt, messagesFile(from), JSON.stringify({ at: now(), row: 'outcome', n, outcome: result, ...(reason ? { reason } : {}) }) + '\n', true);
  });
  log(`message ${from}-${n} recorded ${result}`);
}

// A pin move's wake, recorded and printed once per merge commit (build train-robust; the
// coordinator's ruling, 5 Nov: the train's row, a later pass's "merged elsewhere" row and the
// waiting caller can each reach the same land). merger/wakes.jsonl holds at most one 'wake' row
// (the record: who saw it first) and one 'printed' row (who printed it) per merge commit.
// print: whether this run would print it. Returns { recorded, print, printed }: recorded and
// print true for the run whose row landed; a record that cannot be written returns both true
// (null on recorded) so the wake is printed rather than lost.
export const WAKES_FILE = 'merger/wakes.jsonl';
export function wakeOnce(root, sb, { pr, sha, what, wake, by, print = false }) {
  const SAME = new Error('nothing new'); // nothing to write: no commit, no push
  let seen = null;
  try {
    return writeState(root, sb, `pin wake for PR ${pr}: ${by}${print ? ', printed' : ''}`, (wt) => {
      const file = join(wt, WAKES_FILE);
      const rows = jsonl(existsSync(file) ? readFileSync(file, 'utf8') : '').filter((r) => r.sha === sha);
      const had = rows.find((r) => r.row === 'wake');
      const printed = rows.find((r) => r.row === 'printed');
      const add = [];
      if (!had) add.push({ at: now(), row: 'wake', pr, sha, what, wake, by });
      if (print && !printed) add.push({ at: now(), row: 'printed', pr, sha, by });
      seen = { recorded: !had, print: print && !printed, printed: printed || null };
      if (!add.length) throw SAME;
      put(wt, WAKES_FILE, add.map((r) => JSON.stringify(r)).join('\n') + '\n', true);
      return seen;
    });
  } catch (e) {
    if (e === SAME) return seen;
    if (!(e instanceof Fail)) throw e;
    return { recorded: null, print, printed: null, error: e.message };
  }
}

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

// ===== file: product-neutral.test.mjs =====

// BD-R2 (Bob, 8 Nov): "Process3 is a develop process that is designed for use to develop any
// product, not just [the first product]." No product's name appears in the process's tool,
// rulebooks, governing documents, shims, setup or README. The names are a configurable deny list,
// held only as sha256 hashes of the lower-cased terms (product-deny-list.json at process3's root;
// add one with node tool/deny-add.mjs <term>): every word and hyphen-joined phrase of the scanned
// files is hashed and matched. notes/ and DECISIONS.md are history and are not scanned.
import './helpers.mjs'; // no machine git config (C2); removes its temporary directories
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { addTerm, hashTerm, phrases, readDeny } from '../lib/denylist.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const SCANNED = ['tool', 'rulebooks', 'governing', 'shims', 'setup', 'README.md'];

function* files(root, rel) {
  let ents;
  try { ents = readdirSync(join(root, rel), { withFileTypes: true }); } catch (e) { if (e.code === 'ENOTDIR') { yield rel; return; } if (e.code === 'ENOENT') return; throw e; }
  for (const e of ents) {
    if (e.name === 'node_modules' || e.name === '.git') continue;
