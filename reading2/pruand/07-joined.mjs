// ===== file: ghshare.mjs (continued) =====


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
    // R17e (coordinator's C12: 266 fetches an hour, most of them this read): one read serves every
    // check of the clone's p3 processes within READ_S, writes included; past it, or fresh (after a
    // wait), the ledger's tip is asked of GitHub (ls-remote) and fetched only when it moved.
    read: ({ fresh = false } = {}) => {
      if (!fresh) { if (cache && now() - cache.at < READ_S * 1000) return cache; const d = fromDisk(); if (d) return (cache = d); }
      return recheck().c;
    },
    // The account's pause, decided against the record as it stands on the tip written to (a burst
    // of refusals across sessions lengthens one pause; a refusal after it ended stops the tool:
    // pace.mjs nextPause). Returns the pause written.
    pause: (rec, t = now()) => {
      let out = null;
      now1(`github: refused (${rec.why})`, (wt) => {
        mkdirSync(join(wt, 'github'), { recursive: true });
        let was = null;
        try { was = JSON.parse(readFileSync(join(wt, PAUSE_FILE), 'utf8')); } catch { was = null; }
        out = nextPause(was, rec, t);
        writeFileSync(join(wt, PAUSE_FILE), JSON.stringify(out, null, 2) + '\n');
        return {};
      });
      cache = null;
      try { writeFileSync(diskCache, 'null'); } catch { /* none */ }
      return out;
    },
    resume: (by) => {
      now1(`github: resumed by ${by}`, (wt) => {
        if (existsSync(join(wt, PAUSE_FILE))) rmSync(join(wt, PAUSE_FILE));
        mkdirSync(join(wt, 'github'), { recursive: true });
        appendFileSync(join(wt, RESUMED_FILE), JSON.stringify({ at: new Date(now()).toISOString(), by }) + '\n');
        return {};
      });
      cache = null;
      try { writeFileSync(diskCache, 'null'); } catch { /* none */ }
    },
    // The hook's background refresh (R17d): the ledger's tip asked of GitHub (ls-remote, no fetch);
    // unmoved, the disk cache is current again as it stands, a stop included; moved, fetched and
    // read again. Returns what it did.
    refresh: () => recheck().how,
    // The command's own state writes pushed before it waits on GitHub (others read them meanwhile).
    beforeWait: () => { if (pendingWrites()) flushState(); },
    // While a command runs (each reserve): riding its pending writes, else by shareUsage's rule; never inside a state write.
    share: () => (stateLockHeld(root) ? 0 : shareUsage(root, cfg, { now, store, pending: led.own ? pendingWrites() : 0, ledgerRepo })),
    // At a command's end: with its own state push when it has one (pending), else by shareUsage's rule.
    shareNow: ({ pending = 0 } = {}) => (stateLockHeld(root) ? 0 : shareUsage(root, cfg, { now, store, pending: led.own ? pending : 0, atEnd: true, ledgerRepo })),
  };
}


// Kept by every job without exception: the reviewer for jobs has changed. Handover notes now carry
// the line `reviewer: Octavio Montenegro`, and the name Hamish Colquhoun is no longer written
// anywhere in a handover note.

// This clone's usage since it last shared, appended to its session's file in the ledger (R17e,
// coordinator's C9: bookkeeping is never the dominant traffic, so a share is never a push of its own
// but rides one):
// - with the command's own state push on the product's own state branch (pending writes: writeState
//   coalesces it), whenever there is new use;
// - else at most every SHARE_ALONE_S (or share_s if longer), and only when others must count what
//   it carries: a content-creating call, or a push other than a state branch's (the ledger branch's
//   own pushes are counted from its history, statePushes).
// Rows older than two hours are dropped from the file.
export const SHARE_ALONE_S = 900;
// A share kept by a refused flush and pushed later by `state replay` is settled then (cold review
// of R17e: left pending, its rows counted from this clone's log and again from the ledger).
export const SHARE_SUBJECT = /^github: \d+ minute\(s\) of use \(rows to (\d+)\)/;
onReplayed((subject, root) => { const m = String(subject).match(SHARE_SUBJECT); if (m) settleShare(root, Number(m[1]), Date.now()); });
export function shareUsage(root, cfg, { force = false, now = Date.now, pending = 0, store, atEnd = false, ledgerRepo = null } = {}) {
  const shares = sharesOf(root);
  const after = lastShared(root);
  // The rows shared are those after the last share's last row, taken before the write: the
  // share's own push, logged during it, is shared next time (cold review of R17b).
  const log = readLog(root).filter((r) => Date.parse(r.at) > after && ['gh', 'push', 'fetch'].includes(r.kind));
  const rows = usageRows(root, { after, rows: log });
  if (!rows.length) return 0;
  if (!force) {
    // Riding the command's push: at its end, and at most once a minute while it runs (each share
    // during a command is a commit, though no push).
    // When the last share was made (a riding one's push may not be made yet: cold review of R17e).
    const lastAt = Math.max(0, ...shares.map((x) => x.made ?? (x.at === PENDING_AT ? 0 : x.at || 0)));
    if (now() - lastAt < (pending ? (atEnd ? 0 : 60) : Math.max(SHARE_ALONE_S, pacing().share_s)) * 1000) return 0;
    if (!pending && !log.some((r) => (r.kind === 'gh' && Number(r.content === true ? 1 : r.content) > 0) || (r.kind === 'push' && !(r.state && ledgerRepo && r.repo === ledgerRepo)))) return 0;
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

// ===== file: pass.test.mjs =====

// The pass (P7, Bob's Keep and Drop, 3 Nov, kept shorter: "A no-judgment change across many
// modules is one mechanical pass by a worker in BOB's session while no job runs, with one full
// test run before it is committed."): merge --plain --pass lands a plain pull request that changes
// any modules' files while no live job holds them, on a green gate that ran each touched module's
// whole suite as a pass, with no receipt; its merge record names the pass. Its first use is the
// dist/ pass at the pause (BOB's survey, message 257 on the copy).
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { gate as gateRun, gateComment } from '../lib/gate.mjs';
import { BOT, GATE, RECEIPT, block, parseBlock } from '../lib/github.mjs';
import { mergePlain, reviewRounds } from '../lib/merge.mjs';
import { git } from '../lib/util.mjs';
import { commit, entry, makeRepo } from './helpers.mjs';

const quiet = () => {};
const PASS = "import test from 'node:test';\ntest('ok', () => {});\n";
const GEN = "import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';\nmkdirSync('src/alpha/dist', { recursive: true });\nwriteFileSync('src/alpha/dist/alpha.bundle.json', JSON.stringify({ from: readFileSync('src/alpha/index.mjs', 'utf8') }) + '\\n');\n";
const BUNDLE = 'src/alpha/dist/alpha.bundle.json';
const fresh = (src) => JSON.stringify({ from: src }) + '\n';
const CONFIG = { generated: [{ paths: [BUNDLE], regenerate: ['node', 'gen.mjs'], verify: ['node', '-e', 'process.exit(0)'] }] };
const REQ = 'src/beta/REQ.md';

function gateIO(comments = []) {
  const state = { comments, genuine: new Set() };
  const key = (r) => `${r.at}|${r.sha}|${r.trigger}`;
  return {
    state,
    io: {
      comments: () => state.comments,
      getPR: () => ({ user: { login: 'civicsmith' } }),
      addComment: (s, n, body) => {
        state.comments.push({ id: state.comments.length + 1, body, user: { login: BOT } });
        for (const r of parseBlock(body, GATE)?.runs || []) state.genuine.add(key(r));
        return {};
      },
      verify: (s, r) => state.genuine.has(key(r)),
    },
  };
}

// Two modules, alpha (with a committed generated manifest) and beta (its requirements file in
// its paths), and BOB's pass branch holding `files`.
function product(files, { jobs = {}, branch = 'pass/dist' } = {}) {
  const root = makeRepo({
    'process/config.json': CONFIG,
    'process/ledger/alpha.json': entry('alpha', { status: { state: 'COMPLETE' } }),
    'process/ledger/beta.json': entry('beta', { requirements: REQ, status: { state: 'COMPLETE' } }),
    'gen.mjs': GEN,
    'src/alpha/index.mjs': 'export const x = 1;\n',
    [BUNDLE]: fresh('export const x = 1;\n'),
    'src/beta/index.mjs': 'export const y = 1;\n',
    [REQ]: '# beta\n\n**R1** the first.\n',
    'test/alpha/x.test.mjs': PASS,
    'test/beta/y.test.mjs': `import test from 'node:test';\nimport { readFileSync } from 'node:fs';\ntest('reads', () => readFileSync('${REQ}'));\n`,
    '.github/workflows/process-gate.yml': 'on: pull_request\n',
  });
  git(['branch', 'tranche'], { cwd: root });
  const base = git(['rev-parse', 'HEAD'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  // Job branches on origin, each with its entry's state.
  for (const [id, state] of Object.entries(jobs)) {
    git(['checkout', '-q', '-b', `job/${id}`, 'tranche'], { cwd: root });
    commit(root, { [`process/ledger/${id}.json`]: entry(id, { ...(id === 'beta' ? { requirements: REQ } : {}), status: { state } }), [`src/${id}/job.mjs`]: 'export {};\n' });
    git(['push', '-q', 'origin', `job/${id}`], { cwd: root });
  }
  git(['checkout', '-q', '-b', branch, 'tranche'], { cwd: root });
  const sha = commit(root, files);
  git(['push', '-q', 'origin', 'main', 'tranche', branch], { cwd: root });
  return { root, base, sha, branch };
}
const gateOn = (p, g) => gateRun(p.root, { base: p.base, head: p.sha, branch: p.branch, pr: 260, slug: 'o/r', io: g.io, log: quiet });
const posted = (p, g) => { const r = gateOn(p, g); g.io.addComment('o/r', 260, gateComment(r.run)); git(['checkout', '-q', '-f', p.branch], { cwd: p.root }); git(['clean', '-qfd'], { cwd: p.root }); git(['checkout', '-q', 'main'], { cwd: p.root }); return r; };

function plainIO(p, comments, verify, over = {}) {
  const calls = { merged: null };
  const pr = () => ({ state: 'open', draft: false, mergeable: true, base: { ref: 'tranche', repo: { full_name: 'o/r', default_branch: 'main' } }, head: { ref: p.branch, sha: p.sha, repo: { full_name: 'o/r' } } });
  const green = { id: 1, status: 'completed', conclusion: 'success', started_at: '2026-11-06T01:00:00Z' };
  return {
    calls,
    io: {
      getPR: pr, requiredChecks: () => ({ checks: [{ context: 'gate' }] }), checkRuns: () => [green], checkRun: () => green,
      comments: () => comments, verify, repo: { released: () => false, shim: () => null, descends: () => false },
      openPRs: () => [],
      mergePR: (slug, n, sha, o) => { calls.merged = { sha, ...o }; return { merged: true, sha: 'm'.repeat(40) }; },
      ...over,
    },
  };
}
const WHY = 'dist/ pass: untrack the bundles, build them before use (survey n=257)';
const q = { slug: 'o/r', log: quiet, pass: WHY };
const SRC2 = { 'src/alpha/index.mjs': 'export const x = 2;\n', [BUNDLE]: fresh('export const x = 2;\n'), 'src/beta/index.mjs': 'export const y = 2;\n' };

test('a pass across two modules: the gate runs both suites as a pass, and merge --plain --pass lands it, its record naming the pass', () => {
  const p = product(SRC2);
  const g = gateIO();
  const r = posted(p, g);
  assert.deepEqual(r.findings, []);
  assert.equal(r.run.pass, true);
  assert.equal(r.run.trigger, 'code');
  assert.deepEqual([...r.run.scope].sort(), ['alpha', 'beta']);
  // The generator and its output changed together: compared, not refused as "other files" (a pass).
  assert.equal(r.run.refresh.result, 'identical');
  // Without --pass, the same pull request is still a job's work.
  assert.throws(() => mergePlain(p.root, 260, { slug: 'o/r', log: quiet, reviewed: 'r', rounds: 1, io: plainIO(p, g.state.comments, g.io.verify).io }), /changes module files, which go through a job: .*from a pass\/<name> branch, merge --plain --pass "<what and why>" \(P7\)/);
  const f = plainIO(p, g.state.comments, g.io.verify);
  const out = mergePlain(p.root, 260, { ...q, io: f.io });
  assert.equal(out.merged, true);
  assert.deepEqual(out.modules.sort(), ['alpha', 'beta']);
  assert.match(f.calls.merged.message, new RegExp(`^Pass: ${WHY.replace(/[()/]/g, '\\$&')}\nReview rounds: 0$`));
});

test('a pass waits for no live job: an open job pull request, or a job branch WORKING, refuses it; a BLOCKED one alone does not', () => {
  const p = product(SRC2, { jobs: { alpha: 'WORKING', beta: 'BLOCKED' } });
  const g = gateIO();
  posted(p, g);
  assert.throws(() => mergePlain(p.root, 260, { ...q, io: plainIO(p, g.state.comments, g.io.verify).io }), /a pass runs while no job holds its modules \(P7\): alpha \(WORKING on job\/alpha\)$/);
  const open = plainIO(p, g.state.comments, g.io.verify, { openPRs: () => [{ number: 590, head: { ref: 'job/beta' } }] });
  assert.throws(() => mergePlain(p.root, 260, { ...q, io: open.io }), /alpha \(WORKING on job\/alpha\), beta \(job PR 590 is open\)/);
  assert.equal(open.calls.merged, null);
  // Unreadable: refused, not guessed.
  assert.throws(() => mergePlain(p.root, 260, { ...q, io: plainIO(p, g.state.comments, g.io.verify, { openPRs: () => null }).io }), /cannot be read, so whether a job holds alpha, beta is unknown/);
});

test('a COMPLETE job whose pull request merged holds nothing', () => {
  const p = product(SRC2, { jobs: { alpha: 'COMPLETE' } });
  const g = gateIO();
  posted(p, g);
  assert.equal(mergePlain(p.root, 260, { ...q, io: plainIO(p, g.state.comments, g.io.verify).io }).merged, true);
});

test('a pass carries no receipt, lands only on the tranche, and is its own record', () => {
  const p = product(SRC2);
  const g = gateIO();
  posted(p, g);
  const receipt = [...g.state.comments, { id: 99, body: block(RECEIPT, { module: 'alpha', attempt: 1, sha: p.sha }), user: { login: 'civicsmith' } }];
  assert.throws(() => mergePlain(p.root, 260, { ...q, io: plainIO(p, receipt, g.io.verify).io }), /carries a receipt: a pass has none/);
  assert.throws(() => reviewRounds({ pass: WHY, reviewed: 'r', rounds: 1 }), /--pass is its own record/);
  assert.throws(() => reviewRounds({ pass: true }), /--pass needs what the pass changes and why/);
  assert.deepEqual(reviewRounds({ pass: WHY }), { rounds: 0, decision: null });
  const into = plainIO(p, g.state.comments, g.io.verify, { getPR: () => ({ state: 'open', draft: false, mergeable: true, base: { ref: 'work', repo: { full_name: 'o/r', default_branch: 'main' } }, head: { ref: 'pass/dist', sha: p.sha, repo: { full_name: 'o/r' } } }) });
  git(['push', '-q', 'origin', 'tranche:work'], { cwd: p.root });
  assert.throws(() => mergePlain(p.root, 260, { ...q, io: into.io }), /is into work: a pass lands only on the tranche \(P7\)/);
});

test('a pass needs its gate row: one that did not run every touched module\'s whole suite as a pass is refused', () => {
  const p = product({ 'test/alpha/x.test.mjs': PASS.replace('ok', 'still ok'), 'src/beta/index.mjs': 'export const y = 2;\n' });
  const g = gateIO();
  const r = posted(p, g);
  // Forged or narrowed rows: not verified, or not the pass's whole scope.
  assert.throws(() => mergePlain(p.root, 260, { ...q, io: plainIO(p, g.state.comments, () => false).io }), /is a pass: no green process-gate run on .* ran the whole suites of alpha, beta as a pass \(P7\)/);
  const narrow = { ...r.run, scope: ['alpha'] };
  const io = gateIO();
  io.io.addComment('o/r', 260, gateComment(narrow));
  assert.throws(() => mergePlain(p.root, 260, { ...q, io: plainIO(p, io.state.comments, io.io.verify).io }), /ran the whole suites of alpha, beta as a pass/);
});

test('a pass that changes only a requirements file runs the module\'s whole suite, not only its readers', () => {
  const p = product({ [REQ]: '# beta\n\n**R1** the first, reworded.\n' });
  const g = gateIO();
  const r = posted(p, g);
  assert.equal(r.run.pass, true);
  assert.deepEqual(r.run.scope, ['beta']);
  assert.equal(r.run.requirements_only, undefined);
  assert.equal(mergePlain(p.root, 260, { ...q, io: plainIO(p, g.state.comments, g.io.verify).io }).merged, true);
  // The same change from any other branch is no pass: narrowed to the tests that read the file,
  // as before, and merge --plain --pass refuses it.
  const f = product({ [REQ]: '# beta\n\n**R1** the first, reworded.\n' }, { branch: 'bob/words' });
  const g2 = gateIO();
  const r2 = posted(f, g2);
  assert.equal(r2.run.pass, undefined);
  assert.deepEqual(r2.run.requirements_only, [{ module: 'beta', files: ['test/beta/y.test.mjs'] }]);
  assert.throws(() => mergePlain(f.root, 260, { ...q, io: plainIO(f, g2.state.comments, g2.io.verify).io }), /is from bob\/words: a pass comes from a pass\/<name> branch, which the gate runs as a pass \(P7\)/);
});

test('a job that starts while the pass\'s gate is awaited stops the pass before it lands; one WORKING on the tranche holds it too', () => {
  const p = product(SRC2);
  const g = gateIO();
  posted(p, g);
  let reads = 0;
  const late = plainIO(p, g.state.comments, g.io.verify, { openPRs: () => (++reads > 1 ? [{ number: 601, head: { ref: 'job/alpha' } }] : []) });
  assert.throws(() => mergePlain(p.root, 260, { ...q, io: late.io }), /no job holds its modules \(P7\): alpha \(job PR 601 is open\)/);
  assert.equal(late.calls.merged, null);
  const w = product(SRC2);
  git(['checkout', '-q', 'tranche'], { cwd: w.root });
  commit(w.root, { 'process/ledger/beta.json': entry('beta', { requirements: REQ, status: { state: 'WORKING' } }) });
  git(['push', '-q', 'origin', 'tranche'], { cwd: w.root });
  git(['checkout', '-q', 'main'], { cwd: w.root });
  assert.throws(() => mergePlain(w.root, 260, { ...q, io: plainIO(w, [], () => true).io }), /beta \(WORKING on tranche\)/);
});

test('a pass\'s gate row must be on the base as it is and must not be narrowed to a requirements file\'s readers', () => {
  const p = product({ 'test/alpha/x.test.mjs': PASS.replace('ok', 'still ok'), 'src/beta/index.mjs': 'export const y = 2;\n' });
  const g = gateIO();
  const r = posted(p, g);
  for (const bad of [{ base: 'f'.repeat(40) }, { requirements_only: [{ module: 'beta', files: [] }] }, { pass: undefined }]) {
    const io = gateIO();
    io.io.addComment('o/r', 260, gateComment({ ...r.run, ...bad }));
    assert.throws(() => mergePlain(p.root, 260, { ...q, io: plainIO(p, io.state.comments, io.io.verify).io }), /ran the whole suites of alpha, beta as a pass/, JSON.stringify(bad));
  }
});

// ===== file: found.mjs =====

// The route for work found elsewhere (Bob, 4 Nov: a walk's or a deploy's findings were held in
// BOB's handoff "until the owning layer opens"). `found <module> "<finding>" [--from <source>]`
// prints BOB's plain pull request: one unmet found mark, `**F<n>** *(not yet met: <source>)*
// <finding>`, numbered per module, in the module's requirement file, or in its found-work entry
// (FOUND_DIR/<module>.md) where the module has no requirement file. A finding that names no module
// goes to NO_MODULE, listed by status under `found, no module` with BOB's act to name one.
// The marks are in the record, so `report tranche` counts found work; status --role bob lists a
// module with found marks as next work as soon as it is ready by open_by, whatever its layer.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { LEDGER_DIR } from './ledger.mjs';
import { readModules } from './notice.mjs';
import { flowFile, layerMode, layersAt, safeName } from './layerbase.mjs';
import { fetchState, readState, writeState } from './state.mjs';
import { FOUND_DIR, FOUND_MARK, depth, exists, fail, git, loadConfig, now, unmetIds } from './util.mjs';

export { FOUND_DIR };
export const NO_MODULE = `${FOUND_DIR}/no-module.md`;
export const foundFile = (id) => `${FOUND_DIR}/${id}.md`;
export const DEFAULT_SOURCE = 'found';
// Owed reopens (C44, BD-R1): a finding for a module whose test pins its requirement ids cannot go
// in by a plain pull request (the suite turns red), and its reopen job cannot start before its layer
// opens, while a round's layer opens only once its walk's findings are recorded: a cycle (BOB on
// round 2, 9 Nov). The finding is recorded on the state branch instead, one file per finding:
// REOPENS_DIR/<module>-<key>.json { row: 'reopen', tranche, module, finding, source, pin, key, at, by }.
// rounds.mjs counts it as recorded for the walk its source names and as a flaw of its module until a
// round layer holds it (its item carries the key), whose job then takes it as its task.
export const REOPENS_DIR = 'rounds/reopens';
// One finding standing for several of a walk's (the internal walk's 96 failures, one flaw: C44):
// `--covers <n>` writes ", covers <n>" into the source, which rounds.mjs findingsOf counts as n.
export const coversOf = (source) => { const m = String(source || '').match(/(?:^|[\s,;])covers (\d+)\b/); return m ? Math.max(1, Number(m[1])) : 1; };
// A file at ref, or in the checkout without one; null when absent.
const readAt = (root, ref) => (f) => (ref ? (exists(root, ref, f) ? git(['show', `${ref}:${f}`], { cwd: root }) : null) : existsSync(join(root, f)) ? readFileSync(join(root, f), 'utf8') : null);

// The next found mark's number in the texts (a module's requirement file and its found-work
// entry): one past the highest F<n>, met or not, so a struck mark's number is never reused.
export function nextFound(...texts) {
  let n = 0;
  for (const t of texts) for (const m of String(t || '').matchAll(FOUND_MARK)) n = Math.max(n, Number(m[1]));
  return n + 1;
}

// The unmet found marks of a text: [{ id, source, finding }].
export function foundMarks(text) {
  return String(text || '').split('\n').flatMap((l) => {
    const m = l.match(/\*\*(F\d+)\*\*\s*\*\(not yet met(?::\s*([^)]*))?\)\*\s*(.*)$/);
    return m ? [{ id: m[1], source: (m[2] || '').trim() || DEFAULT_SOURCE, finding: m[3].trim() }] : [];
  });
}

export const foundLine = (n, finding, source) => `- **F${n}** *(not yet met: ${source})* ${finding}`;

// The text with the line appended at its end: the one change a plain pull request may make to a
// requirement file a job owns (merge --plain, foundOnly). A file that does not end in a newline
// would change its last line too, so it is refused.
export function addFound(text, line, title) {
  if (text === null || text === undefined) return `# ${title}\n\n${line}\n`;
  const t = String(text);
  if (t && !t.endsWith('\n')) fail('the file does not end in a newline: appending would change its last line, which a plain pull request may not; its next job adds the mark');
  return `${t}${line}\n`;
}

// An added line a plain pull request may carry into a requirement file a job owns: one unmet
// found mark, `**F<n>** *(not yet met: <source>)* <finding>`, optionally a list item, with no other
// mark in it.
const FOUND_LINE = /^\s*(?:[-*]\s+)?\*\*(F\d+)\*\*\s*\*\(not yet met: [^)]*\)\*(.*)$/;
export function foundLineId(line) {
  const m = String(line).match(FOUND_LINE);
  return m && !/\*\*[RF][\w.-]*\*\*|not yet met/i.test(m[2]) ? m[1] : null;
}

// Whether a diff of one file (git diff -U0 output) only adds found-mark lines whose ids the base
// text lacks: nothing removed or changed, no other line added. { ok, why }.
// headText, when given: every requirement unmet at the base stays unmet (C24: an F line put between
// a requirement and its marked sub-line would take the sub-line, and the mark, from it).
export function foundOnly(diff, baseText, headText) {
  const have = new Set([...String(baseText || '').matchAll(FOUND_MARK)].map((m) => `F${m[1]}`));
  // Header lines only before the first hunk: inside one, a content line "-- x" or "++ x" reads as
  // "--- x" or "+++ x" and is a change like any other (second review of PR 75).
  const lines = String(diff).split('\n');
  const first = lines.findIndex((l) => l.startsWith('@@ '));
  if (first < 0 && lines.some((l) => l.trim())) return { ok: false, why: 'it changes the file without adding a line (a mode or a binary change)' };
  const body = lines.slice(first + 1).filter((l) => !l.startsWith('@@ '));
  const added = [];
  for (const l of body) {
    if (l === '' || l === '\\ No newline at end of file') continue;
    if (l.startsWith('-')) return { ok: false, why: `it removes or changes a line: ${l.slice(1, 80)}` };
    if (!l.startsWith('+')) continue;
    const id = foundLineId(l.slice(1));
    if (!id) return { ok: false, why: `it adds a line that is not one unmet found mark: ${l.slice(1, 80)}` };
    if (have.has(id) || added.includes(id)) return { ok: false, why: `it adds ${id}, which the file already has` };
    added.push(id);
  }
  if (body.some((l) => l === '\\ No newline at end of file')) return { ok: false, why: 'the file does not end in a newline' };
  if (headText !== undefined) {
    const now = new Set(unmetIds(headText));
    const lost = unmetIds(baseText).filter((id) => !now.has(id));
    if (lost.length) return { ok: false, why: `it leaves ${lost.join(', ')} met: a found mark goes at the end of the file, never between a requirement and its lines` };
  }
  return added.length ? { ok: true, added } : { ok: false, why: 'it adds no found mark' };
}

const clean = (v, what) => {
  if (typeof v !== 'string' || !v.trim()) fail(`${what} must be text in quotes`);
  const s = v.replace(/\s+/g, ' ').trim();
  if (/\*\*[RF][\w.-]*\*\*|not yet met/i.test(s)) fail(`${what} must not hold a mark of its own (**R..**, **F..** or "not yet met")`);
  return s;
};

// A module as the tranche knows it: its ledger entry's requirement file, else the requirement
// directory's <id>.md; known when it has a ledger entry, a requirement file, a row in the layer
// map or an entry in the modules file. file: the requirement file when it exists, else null.
export function moduleFiles(root, cfg, id, ref) {
  const read = readAt(root, ref);
  let req = `${cfg.requirements_dir.replace(/\/$/, '')}/${id}.md`;
  let entry = false;
  const e = read(`${LEDGER_DIR}/${id}.json`);
  if (e !== null) { entry = true; try { req = JSON.parse(e).requirements || req; } catch { /* the ledger check reports it */ } }
  const reqText = read(req);
  const map = read(cfg.layers_file) || '';
  const inMap = map.split('\n').some((l) => { const c = l.trim().replace(/^\||\|$/g, '').split('|').map((x) => x.trim()); return c.length > 1 && /^\d+$/.test(c[0]) && c.at(-1).replace(/[`*]/g, '').split(',').map((x) => x.trim()).includes(id); });
  const inModules = (readModules(root, cfg, ref) || []).some((m) => m?.id === id);
  const foundText = read(foundFile(id));
  return { known: entry || reqText !== null || inMap || inModules || foundText !== null, req, reqText, found: foundFile(id), foundText, read };
}

// A test of the module that pins its requirement file's ids (copy, 5 Nov: 16 modules' id tests,
// which a found mark added by a plain pull request turns red): a file under the entry's tests that
// names the requirement file and lists at least three of its ids. Its job adds the mark and admits
// it in that test. The first such file, or null.
export function pinnedIds(root, { entry, req, reqText, ref }) {
  const tests = (entry?.tests || []).filter((t) => typeof t === 'string' && t);
  if (!tests.length || reqText === null) return null;
  const ids = new Set([...String(reqText).matchAll(/\*\*([RF]\d+)\*\*/g)].map((m) => m[1]));
  const at = ref || 'HEAD';
  const files = git(['ls-tree', '-r', '--name-only', at, '--', ...tests], { cwd: root, allowFail: true }).stdout.split('\n').filter(Boolean);
  return files.find((f) => {
    const t = git(['show', `${at}:${f}`], { cwd: root, allowFail: true }).stdout;
    if (!t.includes(req)) return false;
    // Ids written as a list: quoted ("R1"), as keys (R1: or "R1":) or a run of five bare ids; an id in a test's title is not one.
    const listed = [...t.matchAll(/["'`]([RF]\d+)["'`]|^\s*["']?([RF]\d+)["']?\s*:/gm)].map((m) => m[1] || m[2]);
    for (const run of t.match(/\b[RF]\d+(?:\s+[RF]\d+\b){4,}/g) || []) listed.push(...run.split(/\s+/));
    return new Set(listed.filter((x) => ids.has(x))).size >= 3;
  }) || null;
}

// found [<module>] "<finding>" [--from <source>] [--write]: BOB's plain pull request, printed.
// --write also adds the line to the checkout's file, for BOB to commit on the branch it names.
export function found(root, module, finding, { from, covers, write = false, offline = false, by = 'bob', log = console.log } = {}) {
  const cfg = loadConfig(root);
  const t = `origin/${cfg.tranche}`;
  if (!offline) git(['fetch', '-q', ...depth(root), 'origin', `+refs/heads/${cfg.tranche}:refs/remotes/${t}`], { cwd: root, allowFail: true });
  const ref = git(['rev-parse', '-q', '--verify', t], { cwd: root, allowFail: true }).code === 0 ? t : null;
  const what = clean(finding, 'the finding');
  let source = from === undefined ? DEFAULT_SOURCE : clean(from, '--from');
  const base = source;
  if (/[()]/.test(source)) fail('--from must not hold parentheses: the mark ends at the first ")"');
  if (covers !== undefined) {
    if (!/^[1-9]\d*$/.test(String(covers))) fail('--covers <n>: how many of the walk\'s findings this one stands for, a whole number from 1');
    if (/(?:^|[\s,;])covers \d/.test(source)) fail('--from already says "covers <n>"; give it once, with --covers');
    if (Number(covers) > 1) source = `${source}, covers ${Number(covers)}`;
  }
  let file;
  let texts;
  let current;
  let title;
  let where;
  if (module === null || module === undefined) {
    file = NO_MODULE;
    texts = [readAt(root, ref)(NO_MODULE)];
    current = texts[0];
    title = 'Found work that names no module';
    where = 'the found-work entry for findings that name no module; status lists it under `found, no module` until BOB names its module';
  } else {
    if (!/^[a-z0-9][a-z0-9-]*$/.test(String(module))) fail(`the module must be a module id (lower case letters, digits and -), not ${JSON.stringify(module)}`);
    const m = moduleFiles(root, cfg, module, ref);
    if (!m.known) fail(`${module} is not a module on ${ref || 'the working tree'} (no ledger entry, requirement file, row in ${cfg.layers_file} or entry in ${cfg.modules_file || 'the modules file'}); name its module, or record the finding with no module: found "<finding>" --from <source>`);
    let entry = null;
    try { entry = JSON.parse(m.read(`${LEDGER_DIR}/${module}.json`)); } catch { entry = null; }
    const pin = pinnedIds(root, { entry, req: m.req, reqText: m.reqText, ref });
    // The route by the entry's state: a COMPLETE module reopens; any other's job (to start or open) takes the finding.
    const q = `'${what.replace(/'/g, `'\\''`)}'`;
    if (pin) {
      const pinned = `${pin} pins the ids of ${m.req}, so a found mark added by a plain pull request turns ${module}'s suite red`;
      // Under the layer flow, a module whose layer is not open now cannot start its reopen job: the
      // finding is owed to its next reopen on the state branch (C44). With no layer map, or its layer
      // open, its job takes it now, as before.
      if (!offline && cfg.state_branch) fetchState(root, cfg.state_branch, { fresh: true });
      const at = layerMode(cfg) && cfg.state_branch ? openHolding(root, cfg, module, ref) : null;
      if (!at || at.holds) fail(`${pinned}; nothing was written. The route: ${entry?.status?.state === 'COMPLETE' ? `\`node .process/tool/p3.mjs job start ${module} --sessions <file> --reopen ${q}\`` : `its job (${entry?.status?.state || 'no entry'}) takes it: give the finding to its session, or once it is COMPLETE, \`node .process/tool/p3.mjs job start ${module} --sessions <file> --reopen ${q}\``}, the job adding its own F mark and admitting it in that test`);
      if (offline) fail(`${pinned}, and its layer is not open: the finding is recorded on ${cfg.state_branch} as owed to ${module}'s next reopen, which needs origin; nothing was written. Run it again without --offline`);
      return oweReopen(root, cfg, { module, what, source, base, pin, by, log, pinned });
    }
    file = m.reqText !== null ? m.req : m.found;
    texts = [m.reqText, m.foundText];
    current = m.reqText !== null ? m.reqText : m.foundText;
    title = `Found work for ${module}`;
    where = m.reqText !== null ? "the module's requirement file" : `its found-work entry, since the module has no requirement file (${m.req}); its job starts once BOB gives it a requirement file and ledger entry, moving these marks there`;
  }
  // Numbered past the tranche's marks, the checkout's copy (a --write not yet merged) and every
  // found/<module>-f<n> branch on origin (an act printed, its pull request not yet merged), so two
  // findings for one module before the first merges never share a number (review of PR 75).
  const key = module || 'no-module';
  const local = [file, ...(module ? [foundFile(module)] : [])].map(readAt(root, null));
  // The local found/<key>-f<n> branches count too: a run whose branch is made but not yet pushed
  // (defect sweep 4 Nov).
  // A branch counts only when it holds a written mark: a commit the tranche lacks. One cut as a
  // preview printed it (step 1, no commit yet) is the same mark, not a pending one (copy, 6 Nov:
  // op-capabilities numbered F2 after its F1 preview's branch; PR 664 renumbered it by hand).
  const remote = offline ? '' : git(['ls-remote', '--heads', 'origin', `refs/heads/found/${key}-f*`], { cwd: root, allowFail: true }).stdout || '';
  const localHeads = git(['for-each-ref', '--format=%(objectname) %(refname)', `refs/heads/found/${key}-f*`], { cwd: root, allowFail: true }).stdout || '';
  const written = (sha) => !ref || git(['cat-file', '-e', `${sha}^{commit}`], { cwd: root, allowFail: true }).code !== 0
    || git(['merge-base', '--is-ancestor', sha, ref], { cwd: root, allowFail: true }).code !== 0;
  const heads = `${remote}\n${localHeads}`.split('\n').map((l) => l.trim().split(/\s+/)).filter(([sha, name]) => sha && name && written(sha)).map(([, name]) => name).join('\n');
  const pending = [...heads.matchAll(new RegExp(`refs/heads/found/${key}-f(\\d+)$`, 'gm'))].map((m) => `**F${m[1]}**`).join(' ');
