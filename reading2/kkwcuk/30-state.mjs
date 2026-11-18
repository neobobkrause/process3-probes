// The state branch (REC-1, transient): BOB's one-screen handoff (SES-3) and numbered messages
// (MSG-1, MSG-3, MSG-6). Each file has one writer (REC-2): handoff/<role>.md by that role,
// messages/<sender>.jsonl by that sender. The address file is build K's; send only reads it.
// The tool cannot call send_message: send records and prints, the session delivers.
import { appendFileSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { Fail, Superseded, fail, fetchRetry, git, now, pushRetry, withStateLock, withTemp } from './util.mjs';
import { commonDir } from './pace.mjs';

export const handoffFile = (role) => `handoff/${role}.md`;
export const messagesFile = (from) => `messages/${from}.jsonl`;
export const addressFile = (role) => `addresses/${role}.json`; // build K's; read only here
// Whether the product has a BOB: an address recorded for it on the state branch (C27, the
// coordinator, 7 Nov: process3-probes has none by design, and every pin move printed a wake whose
// send then failed "no address for bob", and merge printed starts owed). true or false as read;
// null when the state branch could not be read, which callers take as addressed, so a failure
// stays loud.
export function bobAddressed(root, sb, { fetch = true } = {}) {
  try { if (fetch && !fetchState(root, sb)) return null; return readState(root, sb, addressFile('bob')) !== null; } catch { return null; }
}
export const HANDOFF_MAX = { lines: 40, bytes: 4096, notes: 5 };
const NAME = /^[a-z][a-z0-9-]{0,39}$/;
export const roleName = (v, what) => (typeof v === 'string' && NAME.test(v) ? v : fail(`${what} must be a role name (lower case letters, digits and -), not ${JSON.stringify(v)}`));

const ref = (sb) => `refs/remotes/origin/${sb}`;

// Fetches the state branch; false when origin has none. A failed read is a failure, not "none".
// One fetch, no ls-remote (each round trip cost up to 26 s measured 3 Nov), at most once per
// command: readAddress, bobStatus and sweep in one run share it. writeState asks fresh, since it
// must build on the latest tip.
const fetched = new Map();
// Across the clone's p3 processes too (R17f, coordinator's C12 part 2: 275 fetches an hour, most
// of them the product's state branch, read by each command and each poll): a read that is not
// fresh takes the clone's copy when another process fetched it within STATE_READ_S and the clone's
// ref is still what that fetch left. A fresh read (every write, and what asks for one) always
// fetches. Not ls-remote first: a fetch that finds nothing new costs GitHub what ls-remote does
// (the ref advertisement), and one that finds something would cost two round trips.
export const STATE_READ_S = 30;
const stampOf = (root, sb) => join(commonDir(root), `p3-state-read-${sb.replace(/[^\w.-]/g, '_')}`);
const localTip = (root, sb) => git(['rev-parse', '-q', '--verify', `${ref(sb)}^{commit}`], { cwd: root, allowFail: true }).stdout.trim() || null;
function recentRead(root, sb) {
  try {
    const st = JSON.parse(readFileSync(stampOf(root, sb), 'utf8'));
    return Date.now() - st.at < STATE_READ_S * 1000 && st.at <= Date.now() && st.tip && st.tip === localTip(root, sb);
  } catch { return false; }
}
export function fetchState(root, sb, { fresh = false } = {}) {
  const key = `${root}\0${sb}`;
  if (!fresh && fetched.has(key)) return fetched.get(key);
  if (!fresh && !batch.pending.get(key)?.list.length && recentRead(root, sb)) { fetched.set(key, true); return true; }
  // Under the clone's state lock, a ref-lock clash retried (build train-robust: two p3 processes
  // in one clone failed "cannot lock ref" and the train refused a plain row, copy 5 Nov 12:36).
  // The stamp is the tip this fetch left, taken under the same lock: never a local write another
  // process made onto the ref after it (cold review of R17f). A branch gone from origin: no stamp.
  const r = withStateLock(root, () => {
    const f = fetchRetry(['fetch', '-q', 'origin', `+refs/heads/${sb}:${ref(sb)}`], { cwd: root });
    try { if (f.code === 0) writeFileSync(stampOf(root, sb), JSON.stringify({ at: Date.now(), tip: localTip(root, sb) })); else rmSync(stampOf(root, sb), { force: true }); } catch { /* a saving, not a gate */ }
    return f;
  });
  if (r.code !== 0 && !/couldn't find remote ref/i.test(r.stderr)) fail(`cannot read origin's ${sb}: ${r.stderr.trim()}`);
  fetched.set(key, r.code === 0);
  // A coalesced command's writes not yet pushed (R17): made again on the tip just read.
  if (r.code === 0 && batch.pending.get(key)?.list.length) withStateLock(root, () => rebuild(root, sb, batch.pending.get(key)));
  return r.code === 0;
}

// A file as the fetched state branch holds it, or null.
export function readState(root, sb, path) {
  const r = git(['show', `${ref(sb)}:${path}`], { cwd: root, allowFail: true });
  return r.code === 0 ? r.stdout : null;
}

export const jsonl = (text) => (text || '').split('\n').filter(Boolean).flatMap((l) => { try { return [JSON.parse(l)]; } catch { return []; } });

// Changes the state branch in a worktree of its own (the caller's checkout never moves), commits
// and pushes with pushRetry: never forced. A branch origin lacks starts as an orphan commit.
// When the push is rejected because another writer moved the branch, the change is made again on
// the fresh tip, never merged (defect sweep 4 Nov, #12): so `change` must be a function of the
// worktree it is given and its own arguments only, and every caller's is. The writers, and what
// each one's change writes: send and send delivered|failed (messages/<from>.jsonl, appended, its
// number counted from the file), handoff (handoff/<role>.md), start record, handover confirm and
// the prompt refresh (addresses/<role>.json, each re-reading the address it may replace;
// handover confirm also appends metrics/handover.jsonl), job start --restart (metrics/restart.jsonl),
// sweep (heartbeat, and metrics/sweep.jsonl appended), lane ask (lanes/asks.jsonl, appended), notice
// recording, withdraw and triage (one file per row, added only when absent), layer close
// (layers/closed.jsonl), release record (releases/dev.jsonl), deploy dev (deploys/dev.jsonl), branches prune (branches/prune.jsonl, appended) and
// tranche open and close (metrics/tranche-open.jsonl, tranches/closed.jsonl, appended). A failure inside `change` pushes nothing.
// The whole write (fetch, change, commit, push, read-back) holds the clone's state lock (util.mjs
// withStateLock): a `change` makes no network call, so nothing but the state fetch and push is
// waited on under it.
export function writeState(root, sb, msg, change, opts = {}) {
  if (batch.on) return withStateLock(root, () => writeStateLocal(root, sb, msg, change));
  return withStateLock(root, () => writeStateNow(root, sb, msg, change, opts));
}
// A change that does not apply to the state branch as it stands now (a kept write's replay, or a
// change refused on a tip another writer moved): no other writer's failure, so a replay goes on past it.
export class NotApplied extends Fail {}

// Coalesced writes (R17, GitHub pacing; the copy pushed its state branch up to 173 times an hour,
// 6 Nov). While a command runs (p3.mjs main turns it on), writeState commits onto the clone's copy
// of the state branch, which readState reads, and pushes nothing; flushState pushes them all at
// once, at the command's end and before any wait on GitHub.
// - The flush never trusts the clone's ref (another p3 process in the clone may have fetched over
//   it, cold review of R17): under the state lock it fetches origin's tip and makes every pending
//   change again on it, in order, then pushes; refused because another writer moved the branch,
//   it makes them again on that tip (each change is a function of the tip, as writeState's own
//   retry already needs).
// - Each pending write is also kept at once under refs/p3/pending/<pid>/, its own commit, so a
//   command killed before its flush loses nothing: the next command in the clone moves a dead
//   process's pending writes to refs/p3/unpushed/, which `state replay` pushes. A flush refused to
//   the end moves its own there, never another writer's commit.
// - A later write in the command, or a fresh read, makes the pending changes again on the tip it
//   finds when the clone's ref no longer holds them.
const batch = { on: false, pending: new Map() };
export function stateBatch(on = true) { batch.on = !!on; }
// fn with writes pushed at once, whatever the command's batching (a pause every session must see).
export function unbatched(fn) { const was = batch.on; batch.on = false; try { return fn(); } finally { batch.on = was; } }
export const pendingWrites = () => [...batch.pending.values()].reduce((n, x) => n + x.list.length, 0);
const tipOf = (root, sb) => git(['rev-parse', '-q', '--verify', `${ref(sb)}^{commit}`], { cwd: root, allowFail: true }).stdout.trim() || null;
const emptyStart = (root, sb) => git(['commit-tree', git(['hash-object', '-t', 'tree', '/dev/null'], { cwd: root }), '-m', `${sb}: the state branch`], { cwd: root });
const PENDING = `refs/p3/pending/${process.pid}/`;
const UNPUSHED = 'refs/p3/unpushed/';
// One change made and committed in wt. A change that refuses on the tip it now meets puts the
// worktree back: a Superseded refusal (its work done by another writer: the idle check's "another
// check landed first") is dropped with a logged line; any other refusal is returned as refused, for
// the caller to report, never kept for a replay that would refuse it too (the coordinator, 6 Nov: the
// idle check's refusal, met only at the flush on origin's newer tip, parked every write of the
// command in refs/p3/unpushed, four times; cold review: a reservation that lost must say so).
export const DROPPED = 'state write dropped on the state branch as it stands now';
function applyOne(wt, { msg, change }, log = (l) => console.error(l)) {
  let o;
  try { o = change(wt); } catch (e) {
    if (!(e instanceof Fail)) throw e;
    git(['reset', '-q', '--hard', 'HEAD'], { cwd: wt });
    git(['clean', '-qfd'], { cwd: wt });
    if (!(e instanceof Superseded)) return { refused: e.message };
    log(`note: ${DROPPED}: ${msg}: ${e.message}`);
    return { dropped: e.message };
  }
  git(['add', '-A'], { cwd: wt });
  git(['commit', '-q', '--allow-empty', '-m', msg], { cwd: wt });
  return { o };
}
// Each change made and committed in a worktree at start, in order; the clone's ref moved to the result.
function commitAll(root, sb, start, list, log = () => {}) {
  return withTemp('p3-state-', (tmp) => {
    const wt = join(tmp, 's');
    git(['worktree', 'add', '-q', '--detach', wt, start], { cwd: root });
    const made = list.map((x) => { const r = applyOne(wt, x, log); return { o: r.o || {}, dropped: r.dropped ?? r.refused, c: git(['rev-parse', 'HEAD'], { cwd: wt }) }; });
    const tip = git(['rev-parse', 'HEAD'], { cwd: wt });
    git(['update-ref', ref(sb), tip], { cwd: root });
    return { tip, made };
  }, { root });
}
// The pending changes made again on the clone's ref as it stands now (origin's tip, or empty).
function rebuild(root, sb, entry) {
  entry.base = tipOf(root, sb); // the tip it is built on: what a bookkeeping-only flush restores (cold review)
  const r = commitAll(root, sb, tipOf(root, sb) || emptyStart(root, sb), entry.list, (l) => console.error(l));
  for (const [i, m] of r.made.entries()) if (m.dropped !== undefined && !/^note: /.test(m.dropped)) console.error(`note: a pending state write refuses on the moved tip: ${entry.list[i].msg}: ${m.dropped}; the flush reports it`);
  entry.tip = r.tip;
  return r;
}
function writeStateLocal(root, sb, msg, change) {
  const key = `${root}\0${sb}`;
  const entry = batch.pending.get(key) || { root, sb, list: [], tip: null };
  if (!entry.list.length) { fetchState(root, sb); entry.base = tipOf(root, sb); }
  else if (tipOf(root, sb) !== entry.tip) rebuild(root, sb, entry); // the ref moved under this command
  const { tip, made } = commitAll(root, sb, tipOf(root, sb) || emptyStart(root, sb), [{ msg, change }]);
  // Refused on the clone's tip: as writeStateNow refuses, nothing kept or pending.
  if (made[0].dropped !== undefined) { git(['update-ref', ref(sb), tip], { cwd: root }); throw new Fail(made[0].dropped); }
