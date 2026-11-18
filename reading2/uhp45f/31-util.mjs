// Pushes HEAD to a branch (the state branch's push). On a moved-ref rejection or a server error it
// waits (1, 2, 4, 8 s with jitter, by default), fetches the branch and, if HEAD is already in the
// fetched tip (a 5xx push that landed), returns that tip. Otherwise, with `redo`, it resets the
// checkout to the fetched tip and calls redo() to make the change again there (so two appends to
// one jsonl file, or a number counted from it, are redone on the other writer's rows instead of
// conflicting: defect sweep 4 Nov, #12); without `redo`, it merges the fetched tip into HEAD (a
// merge commit, never a rebase or a force; a conflict stops it). Then it pushes again, at most
// `tries` times in all; the last refusal is reported in the remote's words. Returns the tip pushed.
// `push` is for the tests: it stands in for one push and returns git's { code, stderr }.
export function pushRetry(cwd, branch, { tries = PUSH_TRIES, wait = 1000, log = console.log, redo, push } = {}) {
  const once = push || (() => git(['push', '-q', 'origin', `HEAD:refs/heads/${branch}`], { cwd, allowFail: true }));
  for (let t = 1; ; t++) {
    const r = once();
    if (r.code === 0) return git(['rev-parse', 'HEAD'], { cwd });
    const why = r.stderr.trim();
    // GitHub's own refusal (a 429, a secondary rate limit): obeyed, never retried inside it (cold review
    // of R17g: git's "RPC failed; HTTP 429" matched SERVER_ERROR and was pushed again at 1, 2, 4, 8 s).
    if (limitSignal(why)) fail(`the push of ${branch} was refused by GitHub's rate limit; run it again after the limit resets (\`p3 github budget\` reads it). The refusal: ${why}`);
    const moved = REF_MOVED.test(why);
    if (!moved && !SERVER_ERROR.test(why)) fail(`the push of ${branch} failed: ${why}`);
    if (t >= tries) {
      // A 5xx push may have landed: look before saying it did not, so a re-run does not write twice.
      if (!moved && fetchRetry(['fetch', '-q', 'origin', `+refs/heads/${branch}:refs/remotes/origin/${branch}`], { cwd }).code === 0
        && git(['merge-base', '--is-ancestor', 'HEAD', `refs/remotes/origin/${branch}`], { cwd, allowFail: true }).code === 0) return git(['rev-parse', 'HEAD'], { cwd });
      fail(`the push of ${branch} was refused ${tries} times (${moved ? `${branch} kept moving` : 'the server kept failing'}); run it again later. The last refusal: ${why}`);
    }
    log(`${moved ? `${branch} moved on origin` : 'the push hit a server error'}; fetching and trying again (${t + 1} of ${tries})`);
    pause(jitter(wait * 2 ** (t - 1)));
    const f = fetchRetry(['fetch', '-q', 'origin', `+refs/heads/${branch}:refs/remotes/origin/${branch}`], { cwd });
    if (f.code !== 0) { log(`the fetch of ${branch} failed (${f.stderr.trim()}); pushing again as it was`); continue; }
    const theirs = `refs/remotes/origin/${branch}`;
    if (git(['merge-base', '--is-ancestor', 'HEAD', theirs], { cwd, allowFail: true }).code === 0) return git(['rev-parse', 'HEAD'], { cwd }); // ours landed (another writer may be on top)
    if (git(['merge-base', '--is-ancestor', theirs, 'HEAD'], { cwd, allowFail: true }).code === 0) continue; // origin did not move: push the same commit again
    if (redo) {
      git(['reset', '-q', '--hard', theirs], { cwd });
      git(['clean', '-q', '-fdx'], { cwd });
      redo();
      continue;
    }
    const m = git(['merge', '-q', '--no-edit', theirs], { cwd, allowFail: true });
    if (m.code !== 0) {
      git(['merge', '--abort'], { cwd, allowFail: true });
      fail(`${branch} moved on origin and does not merge cleanly; nothing was pushed`);
    }
  }
}

// Ref-lock clashes in one clone (copy, 5 Nov 12:21 and 12:36: the MERGER's send ran while its
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
