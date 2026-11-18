// ===== file: ghshare.mjs (continued) =====

  }
  const last = Math.max(...log.map((r) => Date.parse(r.at)));
  const st = store || ownStore(root, cfg.state_branch);
  const file = `${USE_DIR}/${safe(sessionId())}.jsonl`;
  // The share's push is gated like any push but never waits (coordinator's ruling on PR 206): where
  // the account is paused or at the ceiling it is refused, nothing is recorded, and it is shared later.
  // A share whose own push is refused and kept for replay is recorded pending (cold review): not
  // sent again by the next share, and settled when state replay pushes it.
  try { withoutWaiting(() => st.write(`github: ${rows.length} minute(s) of use (rows to ${last})`, (wt) => {
    mkdirSync(join(wt, USE_DIR), { recursive: true });
    const since = now() - 2 * 3600e3;
    let kept = [];
    try { kept = readFileSync(join(wt, file), 'utf8').split('\n').filter(Boolean).filter((l) => { try { return Date.parse(JSON.parse(l).minute) > since; } catch { return false; } }); } catch { kept = []; }
    writeFileSync(join(wt, file), [...kept, ...rows.map((r) => JSON.stringify(r))].join('\n') + '\n');
    return {};
  })); } catch (e) { if (/state replay/.test(String(e?.message))) noteShare(root, last, PENDING_AT, now()); throw e; }
  // Pushed now (another repository's ledger, or unbatched), or with the command's push: until that
  // push is made the share is not in any read, and its rows count from this clone's log (usage).
  if (st.ref !== LEDGER_REF && pendingWrites()) { noteShare(root, last, PENDING_AT, now()); onFlushed(root, cfg.state_branch, () => settleShare(root, last, Date.now())); } else noteShare(root, last, now());
  return rows.length;
}

// The hook's read path (R17d; coordinator, 7 Nov: under 300 ms p95, never a ledger fetch on a
// read): the account's pause, stop and use as the clone's disk cache holds them, at any age, a stop
// included; when the cache is READ_S old or missing, a background refresh is started (one at a
// time per clone) and the read goes on at once. A read can so pass a pause or stop written in the
// last READ_S plus the refresh's few seconds; a write reads it through stateShare (a cache within READ_S, else ls-remote).
// key: the ledger this clone reads now ('own', its URL, or null for none): a cache of another
// (the config changed) is no cache (cold review of R17d).
export function peekShare(cwd, { now = Date.now, kick = kickRefresh, key } = {}) {
  let c = null;
  try { c = JSON.parse(readFileSync(join(commonDir(cwd), LEDGER_CACHE), 'utf8')); } catch { c = null; }
  if (c && key !== undefined && (c.ledger ?? null) !== key) c = null;
  if (!c || !(now() - c.at < READ_S * 1000)) { try { kick(cwd, { now }); } catch { /* the next read tries again */ } }
  const s = c ? { pause: c.pause || null, use: c.use || [], resumed: c.resumed || null, at: c.at, state: c.state || null } : { pause: null, use: [] };
  return { read: () => s };
}
const HOOK_ENTRY = join(fileURLToPath(new URL('..', import.meta.url)), 'hook.mjs');
// One refresh at a time per clone: a marker file, taken by its creation; one older than a minute
// (a refresh killed) is taken over.
export function kickRefresh(cwd, { now = Date.now, entry = HOOK_ENTRY } = {}) {
  const f = join(commonDir(cwd), REFRESHING);
  try { writeFileSync(f, String(now()), { flag: 'wx' }); } catch {
    let at = 0;
    try { at = Number(readFileSync(f, 'utf8')) || 0; } catch { at = 0; }
    if (now() - at < 60e3) return false;
    writeFileSync(f, String(now()));
  }
  // Its marker named, so a refresh taken over does not clear its successor's (cold review of R17d).
  const child = spawn(process.execPath, [entry, '--refresh'], { cwd, detached: true, stdio: 'ignore', env: { ...process.env, P3_REFRESH_MARK: readFileSync(f, 'utf8') } });
  child.on('error', () => { /* not started: the next read tries again */ });
  child.unref();
  return true;
}
export function refreshDone(cwd, mark = process.env.P3_REFRESH_MARK) {
  const f = join(commonDir(cwd), REFRESHING);
  try { if (mark === undefined || readFileSync(f, 'utf8') === mark) rmSync(f, { force: true }); } catch { /* none */ }
}

// ===== file: state-writes.test.mjs =====

// Defect sweep 4 Nov, #9, #11, #12 and three lower items: state-branch writes that raced, the
// address writers that wrote from a stale read, the review brief's suite command, survival in a
// shallow clone and a found mark number already taken by a local branch.
import assert from 'node:assert/strict';
import { appendFileSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { commit, entry, makeRepo, openPassed } from './helpers.mjs';
import { found } from '../lib/found.mjs';
import { survival } from '../lib/metrics.mjs';
import { reviewBrief } from '../lib/review.mjs';
import { handoverConfirm, promptRefresh, readAddress, recordStart } from '../lib/roles.mjs';
import { messages, readState, writeState } from '../lib/state.mjs';
import { git } from '../lib/util.mjs';

const quiet = () => {};
const SB = 'process-state';
const R = 'session_root1';
const B1 = 'session_bob1';
const B2 = 'session_bob2';

function withOrigin() {
  const root = makeRepo({ 'README.md': 'x', 'process/config.json': { tranche: 'tranche' } });
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  return { root, bare };
}
// A second checkout of the same origin: another session.
function other(bare) {
  const dir = join(mkdtempSync(join(tmpdir(), 'p3-other-')), 'c');
  git(['clone', '-q', '-b', 'tranche', bare, dir]);
  for (const [k, v] of [['user.email', 't@t'], ['user.name', 'T'], ['commit.gpgsign', 'false']]) git(['config', k, v], { cwd: dir });
  return dir;
}
const onOrigin = (bare, f) => git(['show', `${SB}:${f}`], { cwd: bare });

// The append send makes: the next number counted from the file, one row appended.
const appendSent = (wt, text) => {
  const f = join(wt, 'messages/bob.jsonl');
  mkdirSync(dirname(f), { recursive: true });
  let t = '';
  try { t = readFileSync(f, 'utf8'); } catch { /* none yet */ }
  const n = messages(t).reduce((m, x) => Math.max(m, x.n), 0) + 1;
  appendFileSync(f, JSON.stringify({ at: 'now', row: 'sent', n, to: 'job-x', text }) + '\n');
  return { n };
};

test('#12: two appends to one state jsonl file both land: the rejected one is made again on the fresh tip, renumbered', () => {
  const { root, bare } = withOrigin();
  const two = other(bare);
  writeState(root, SB, 'seed', (wt) => appendSent(wt, 'first'));
  let raced = false;
  const r = writeState(root, SB, 'ours', (wt) => {
    // Another BOB call appends to the same file after our fetch, before our push.
    if (!raced) { raced = true; writeState(two, SB, 'theirs', (w) => appendSent(w, 'theirs')); }
    return appendSent(wt, 'ours');
  });
  assert.equal(r.n, 3, 'the number is counted again on the other writer\'s row');
  const rows = messages(onOrigin(bare, 'messages/bob.jsonl'));
  assert.deepEqual(rows.map((m) => `${m.n}:${m.text}`), ['1:first', '2:theirs', '3:ours']);
  assert.equal(git(['rev-parse', `refs/heads/${SB}`], { cwd: bare }), r.tip);
  // Never a merge: the tip's history is a line.
  assert.equal(git(['rev-list', '--merges', '--count', r.tip], { cwd: bare }), '0');
});

test('#12: a change that fails when made again on the fresh tip pushes nothing', () => {
  const { root, bare } = withOrigin();
  const two = other(bare);
  writeState(root, SB, 'seed', (wt) => writeFileSync(join(wt, 'a.txt'), 'x'));
  const before = git(['rev-parse', `refs/heads/${SB}`], { cwd: bare });
  let k = 0;
  assert.throws(() => writeState(root, SB, 'ours', (wt) => {
    if (k++ === 0) { writeState(two, SB, 'theirs', (w) => writeFileSync(join(w, 'b.txt'), 'y')); return {}; }
    throw new Error('refused on the fresh tip');
  }), /refused on the fresh tip/);
  assert.notEqual(git(['rev-parse', `refs/heads/${SB}`], { cwd: bare }), before, 'theirs landed');
  assert.equal(onOrigin(bare, 'b.txt'), 'y');
  assert.equal(git(['show', `${SB}~0:a.txt`], { cwd: bare }), 'x');
  assert.equal(git(['log', '--format=%s', '-1', SB], { cwd: bare }), 'theirs');
});

test('#11: the old BOB\'s prompt refresh after ROOT\'s handover confirm refuses, and bob stays the new BOB', () => {
  const { root, bare } = withOrigin();
  recordStart(root, 'root', R, { log: quiet });
  recordStart(root, 'bob', B1, { log: quiet });
  // The old BOB's record names a prompt this pin no longer prints, so its wake would rewrite it.
  writeState(root, SB, 'old prompt', (d) => writeFileSync(join(d, 'addresses/bob.json'), JSON.stringify({ session: B1, at: '2026-01-01T00:00:00Z', prompt: { hash: '0'.repeat(64) } }) + '\n'));
  assert.equal(readAddress(root).bob.session, B1, 'the old BOB\'s read, kept for the command');
  // ROOT, in its own checkout, confirms the handover.
  const rootSession = other(bare);
  handoverConfirm(rootSession, B2, { log: quiet });
  assert.throws(() => promptRefresh(root, { session: B1, pin: 'f'.repeat(40), log: quiet }), /refused: bob's address moved to session_bob2 while the prompt refresh ran; nothing was changed/);
  assert.equal(JSON.parse(onOrigin(bare, 'addresses/bob.json')).session, B2);
});

test('#11: start record and handover confirm refuse an address that moved since their read', () => {
  const { root, bare } = withOrigin();
  recordStart(root, 'root', R, { log: quiet });
  assert.equal(readAddress(root).root.session, R);
  // Another session records a different ROOT after this command's read.
  recordStart(other(bare), 'root', 'session_root2', { log: quiet });
  assert.throws(() => recordStart(root, 'root', 'session_root3', { log: quiet }), /refused: root's address moved to session_root2 while start record root ran/);
  assert.equal(JSON.parse(onOrigin(bare, 'addresses/root.json')).session, 'session_root2');
  // Recording the same id again still works (the address may already name it).
  const fresh = other(bare);
  recordStart(fresh, 'root', 'session_root2', { log: quiet });
  // handover confirm: BOB moved after ROOT's read.
  const r2 = other(bare);
  recordStart(r2, 'bob', B1, { log: quiet });
  assert.equal(readAddress(r2).bob.session, B1);
  handoverConfirm(other(bare), B2, { log: quiet });
  assert.throws(() => handoverConfirm(r2, 'session_bob3', { log: quiet }), /refused: bob's address moved to session_bob2 while handover confirm ran/);
  assert.equal(JSON.parse(onOrigin(bare, 'addresses/bob.json')).session, B2);
});

const io = (head, contents = {}, tracked = []) => ({
  slug: 'o/r',
  read: (_s, n) => ({ number: Number(n), title: 'T', base: { ref: 'tranche' }, head: { ref: head, sha: 'abc1234567890' } }),
  files: () => ['src/alpha/a.mjs'],
  contents: (_s, path) => contents[path] ?? null,
  notes: () => [],
  tracked: (_s, path) => tracked.includes(path),
});

test('#9: a job\'s brief names p3 test <id> as the suite and lists the generated paths as built, not committed', () => {
  const root = makeRepo({ 'README.md': 'x\n', 'process/config.json': { generated: [
    { paths: ['build/rows.mjs', 'dist/big.bundled.mjs'], regenerate: ['node', 'gen.mjs'], verify: ['node', 'gen.mjs', '--check'] },
  ] } });
  const text = reviewBrief(root, '7', { log: quiet, io: io('job/alpha', { 'process/ledger/alpha.json': { requirements: 'req/alpha.md' }, 'req/alpha.md': '- **R1** x\n' }, ['dist/big.bundled.mjs']) });
  assert.match(text, /run the module's suite as the gate does: `node \.process\/tool\/p3\.mjs test alpha` from the checkout's root, never a bare `node --test`/);
