// The account-wide GitHub ledger (R17, R17b; pace.mjs useShared): one ledger per GitHub account,
// on a state branch, the one place every session of the account already reads and writes, so no
// new service and no new credential. On it:
//   github/pause.json        the pause every session obeys (written at once, never coalesced: the
//                            other sessions must stop calling before their next call);
//   github/resumed.jsonl     the coordinator's resumes;
//   github/use/<session>.jsonl  each session's calls a minute ({ session, minute, calls, points,
//                            content, pushes }), riding the command's own state push, else at
//                            most every 15 min and only when it holds what others must count
//                            (R17e, shareUsage); the ledger branch's own pushes are counted from
//                            its history (statePushes), never from these rows.
// Where (coordinator's ruling, 6 Nov): the product's state branch (neobobkrause/civicsmith-copy
// process-state). A product's clone uses its own; a clone with no state branch of its own (process3,
// process3-probes) names the ledger in pacing.ledger ("<owner>/<repo>"; process3's own in its root
// pacing.json) and reads and writes it there, fetched into refs/p3/ledger/state.
// Read once per READ_S for every check of the clone, writes included, and past it by the ledger's
// tip asked of GitHub (ls-remote), fetched only when it moved (R17e, C12); another session's use is up to one command or share_s late, which the target's margin
// covers. GitHub's own count stands in for the primary limit (pace.mjs primaryState).
import { join } from 'node:path';
import { existsSync, readFileSync, rmSync, mkdirSync, writeFileSync, appendFileSync } from 'node:fs';
import { fetchState, flushState, onFlushed, onReplayed, pendingWrites, readState, unbatched, writeState } from './state.mjs';
import { fail, git, PUSH_TRAILER, repoSlug, stateLockHeld, withStateLock, withTemp } from './util.mjs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { commonDir, exempt, lastShared, nextPause, noteShare, pacing, PENDING_AT, settleShare, sharesOf, readLog, sessionId, usageRows, withoutWaiting } from './pace.mjs';
import { PROCESS_ROOT } from './register.mjs';

export const PAUSE_FILE = 'github/pause.json';
export const RESUMED_FILE = 'github/resumed.jsonl';
export const USE_DIR = 'github/use';
export const READ_S = 30;
export const LEDGER_REF = 'refs/p3/ledger/state';
export const LEDGER_BRANCH = 'process-state';
export const LEDGER_CACHE = 'p3-gh-ledger.json';
const REFRESHING = 'p3-gh-refreshing';
const safe = (s) => String(s || 'no-session').replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 80);

// The ledger for a clone: its config's pacing.ledger, else the pinned process3's pacing.json (so
// every product and process3's own clones share one ledger without each naming it: cold review
// of R17b), else the clone's own pacing.json; null when none names one. A ledger that is this
// clone's own repository is its own state branch. The tests read process3's own only when given.
const ledgerIn = (dir) => { try { return JSON.parse(readFileSync(join(dir, 'pacing.json'), 'utf8')).ledger || null; } catch { return null; } };
export function ledgerOf(root, cfg, { processRoot = process.env.NODE_TEST_CONTEXT ? null : PROCESS_ROOT } = {}) {
  const name = cfg?.pacing?.ledger ?? (processRoot ? ledgerIn(processRoot) : null) ?? ledgerIn(root);
  if (!name) return cfg ? { own: true } : null;
  let slug = null;
  try { slug = repoSlug(root); } catch { slug = null; }
  if (slug && slug.toLowerCase() === String(name).toLowerCase()) return { own: true };
  return { own: false, name, url: `https://github.com/${name}.git` };
}

// The store: this product's own state branch, or another repository's (url) fetched into LEDGER_REF.
function ownStore(root, sb) {
  return {
    fetch: () => { try { fetchState(root, sb, { fresh: true }); } catch { /* read what the clone has */ } },
    read: (path) => readState(root, sb, path),
    list: (dir) => git(['ls-tree', '--name-only', `refs/remotes/origin/${sb}`, `${dir}/`], { cwd: root, allowFail: true }).stdout.split('\n').filter(Boolean),
    write: (msg, change) => writeState(root, sb, msg, change),
    ref: `refs/remotes/origin/${sb}`,
    tip: () => git(['rev-parse', '-q', '--verify', `refs/remotes/origin/${sb}^{commit}`], { cwd: root, allowFail: true }).stdout.trim() || null,
    remoteTip: () => lsRemote(root, 'origin', sb),
  };
}
// The ledger branch's tip on GitHub, without fetching it (R17d): null when it cannot be read.
function lsRemote(root, where, branch) {
  const r = git(['ls-remote', where, `refs/heads/${branch}`], { cwd: root, allowFail: true, timeout: 30e3 });
  return r.code === 0 ? (r.stdout.split('\t')[0].trim() || 'none') : null;
}
export function remoteStore(root, url) {
  const fetch = () => git(['fetch', '-q', url, `+refs/heads/${LEDGER_BRANCH}:${LEDGER_REF}`], { cwd: root, allowFail: true });
  const tip = () => git(['rev-parse', '-q', '--verify', `${LEDGER_REF}^{commit}`], { cwd: root, allowFail: true }).stdout.trim() || null;
  return {
    fetch,
    ref: LEDGER_REF,
    tip,
    remoteTip: () => lsRemote(root, url, LEDGER_BRANCH),
    read: (path) => { const r = git(['show', `${LEDGER_REF}:${path}`], { cwd: root, allowFail: true }); return r.code === 0 ? r.stdout : null; },
    list: (dir) => git(['ls-tree', '--name-only', LEDGER_REF, `${dir}/`], { cwd: root, allowFail: true }).stdout.split('\n').filter(Boolean),
    // A change made on the ledger's tip and pushed, never forced; refused because the tip moved,
    // made again on the new one (each change is a function of the tip), four tries.
    write: (msg, change) => withStateLock(root, () => withTemp('p3-state-', (tmp) => {
      const wt = join(tmp, 'l');
      fetch();
      const start = tip() || git(['commit-tree', git(['hash-object', '-t', 'tree', '/dev/null'], { cwd: root }), '-m', `${LEDGER_BRANCH}: the state branch`], { cwd: root });
      git(['worktree', 'add', '-q', '--detach', wt, start], { cwd: root });
      let out;
      for (let k = 1; ; k++) {
        out = change(wt);
        git(['add', '-A'], { cwd: wt });
        git(['commit', '-q', '--allow-empty', '-m', msg, '-m', `${PUSH_TRAILER}: ${sessionId() || 'no-session'}`], { cwd: wt });
        const p = git(['push', '-q', url, `HEAD:refs/heads/${LEDGER_BRANCH}`], { cwd: wt, allowFail: true });
        if (p.code === 0) { fetch(); return out; }
        // Only a moved tip is tried again, after 2, 4, 8 s; any other refusal (auth, network) at once.
        if (!/non-fast-forward|fetch first|rejected|cannot lock ref/i.test(p.stderr) || k >= 4) fail(`the GitHub ledger at ${url} refused the write${k > 1 ? ` ${k} times` : ''}: ${p.stderr.trim().split('\n').pop()}`);
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, (process.env.NODE_TEST_CONTEXT ? 10 : 1000) * 2 ** k);
        fetch();
        git(['reset', '-q', '--hard', tip() || start], { cwd: wt });
        git(['clean', '-q', '-fdx'], { cwd: wt });
      }
    }, { root })),
  };
}

// The ledger branch's own pushes since `since` (R17e, coordinator's C9/C10): each push marks the
// commit it pushes (util.mjs stampPush; the ledger's own writes here), so the branch's history is
// the count, the same for every clone that reads it. An unmarked commit not part of a marked push
// (one from before the mark, or a pin without it) counts one push per second of commit time (a
// coalesced push's commits are made together). Returns
// { repo, pushes: [[ms, session]], tip_at }, or null when unread.
const PUSH_SPAN_S = 10;
export function statePushes(root, ref, repo, since) {
  if (!repo) return null;
  const r = git(['log', `--since=${new Date(since).toISOString()}`, `--format=%ct%x1f%(trailers:key=${PUSH_TRAILER},valueonly,separator=%x2c)%x1e`, ref], { cwd: root, allowFail: true });
  if (r.code !== 0) return null;
  const pushes = [];
  const seconds = new Set();
  // Newest first. A push stamps only its last commit: an unmarked commit made within PUSH_SPAN_S
  // before the marked one above it, with nothing unmarked between, is that push's own.
  let anchor = null;
  for (const rec of r.stdout.split('\x1e')) {
    const [ct, who] = rec.trim().split('\x1f');
    if (!ct) continue;
    const at = Number(ct) * 1000;
    if (who && who.trim()) { pushes.push([at, who.trim().split(',')[0]]); anchor = at; continue; }
    if (anchor !== null && anchor - at <= PUSH_SPAN_S * 1000) continue;
    anchor = null;
    if (!seconds.has(at)) { seconds.add(at); pushes.push([at, null]); }
  }
  const tip = git(['log', '-1', '--format=%ct', ref], { cwd: root, allowFail: true });
  return { repo, pushes, tip_at: tip.code === 0 && tip.stdout.trim() ? Number(tip.stdout.trim()) * 1000 : 0 };
}

export function stateShare(root, cfg, { now = Date.now, url } = {}) {
  const led = url ? { own: false, url } : ledgerOf(root, cfg);
  if (!led) return null;
  const store = led.own ? ownStore(root, cfg.state_branch) : remoteStore(root, led.url);
  const key = led.own ? 'own' : led.url;
  let ledgerRepo = null;
  try { ledgerRepo = (led.own ? repoSlug(root) : led.name || String(led.url).replace(/^https:\/\/github\.com\//, '').replace(/\.git$/, '')).toLowerCase(); } catch { ledgerRepo = null; }
  let cache = null;
  const load = () => {
    // The read's time is taken before its fetch: what lands meanwhile is after it (cold review of R17e).
    const t0 = now();
    store.fetch();
    // The tip the reads are of: one moved under them (another p3 process of the clone fetched)
    // is not recorded, so the next refresh fetches again (cold review of R17d: else old contents
    // under the new tip would be renewed as current, a stop hidden).
    const tip0 = store.tip();
    let pause = null;
    try { pause = JSON.parse(store.read(PAUSE_FILE) || 'null'); } catch { pause = null; }
    const since = now() - 2 * 3600e3;
    const use = store.list(USE_DIR).flatMap((f) => (store.read(f) || '').split('\n').filter(Boolean).flatMap((l) => { try { const r = JSON.parse(l); return Date.parse(r.minute) > since ? [r] : []; } catch { return []; } }));
    const resumed = (store.read(RESUMED_FILE) || '').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l).at; } catch { return null; } }).filter(Boolean).pop() || null;
    cache = { at: t0, pause, use, resumed, state: statePushes(root, store.ref, ledgerRepo, since), ledger: key, tip: store.tip() === tip0 ? tip0 : null };
    try { writeFileSync(diskCache, JSON.stringify(cache)); } catch { /* best effort */ }
    return cache;
  };
  // Shared with this clone's other p3 processes (each hook call is one): a read within READ_S
  // fetches nothing (R17c, the hook's fast path). A fresh read (before a write) always fetches.
  const diskCache = join(commonDir(root), LEDGER_CACHE);
  // Never a stop from disk (a resume elsewhere must show at once), nor another ledger's read.
  const fromDisk = () => { try { const c = JSON.parse(readFileSync(diskCache, 'utf8')); return c && now() - c.at < READ_S * 1000 && !c.pause?.stopped && c.ledger === key ? c : null; } catch { return null; } };
  // The ledger's tip asked of GitHub (ls-remote, no fetch); unmoved, the cache it was read into is
  // current again as it stands, a stop included; moved (or unknown), fetched and read again.
  const recheck = () => {
    const t = store.remoteTip();
    let c = cache && cache.tip ? cache : null;
    if (!c) { try { c = JSON.parse(readFileSync(diskCache, 'utf8')); } catch { c = null; } }
    if (t && c && c.tip && c.tip === t && c.ledger === key) {
      cache = { ...c, at: now() };
      try { writeFileSync(diskCache, JSON.stringify(cache)); } catch { /* best effort */ }
      return { c: cache, how: 'unmoved' };
    }
    return { c: load(), how: 'fetched' };
  };
  // The ledger's own writes go through whatever the account's state (exempt): a pause must be
  // written while paused, and a resume while stopped. Pushed at once, never coalesced.
  const now1 = (msg, change) => exempt(() => unbatched(() => store.write(msg, change)));
  return {
    ledger: led.own ? 'own' : led.url,
