  return { points: write ? 5 : 1, content: write, actions, primary: true, graphql: a[0] === 'pr' || a[0] === 'issue' };
}

// One event in this clone's log: a gh call (with its cost), a push, a refusal. Never fails the act.
export function logEvent(kind, what, cwd, extra = {}, at = Date.now()) {
  if (process.env.NODE_TEST_CONTEXT && process.env.P3_GITHUB_LOG === '0') return;
  try { appendFileSync(githubLog(cwd), JSON.stringify({ at: new Date(at).toISOString(), kind, session: sessionId(), what: String(what).slice(0, 120), ...extra }) + '\n'); } catch { /* the log is a record, not a gate */ }
}
// A row's content-creating requests: a gh call's flag, or a note's count.
const contentOf = (r) => (r.content === true ? 1 : Number(r.content) || 0);
export function readLog(cwd) {
  if (process.env.NODE_TEST_CONTEXT && process.env.P3_GITHUB_LOG === '0') return [];
  try { return readFileSync(githubLog(cwd), 'utf8').split('\n').filter(Boolean).flatMap((l) => { try { return [JSON.parse(l)]; } catch { return []; } }); } catch { return []; }
}

// The shared store (useShared): read() → { pause, use } with use the other sessions' rows
// ({ session, minute, calls, points, content, pushes }); pause(rec) writes at once; resume(by).
const LOCAL = { read: () => ({ pause: null, use: [] }), pause: () => null, resume: () => {} };
let shared = LOCAL;
export function useShared(s) { shared = s || LOCAL; }

// Use in the window ending at t (R17e, coordinator's C10: every clone, the same number): the
// ledger's rows, every one, plus this clone's own rows the ledger read lacks: those no share
// carried, and those a share carried after the read (read.at). Never "the rows of my clone are in
// my log" by name (it dropped every other cloud session's rows: all their clones had one name).
// State-branch pushes of the ledger's repository are counted from the ledger branch itself (each
// push marks its commit, ghshare.mjs statePushes; a source that cannot drift), with this clone's
// own made since the read; the rows' count of them is not used. A shared row covers a minute,
// counted whole while its minute is in the window.
export function sharedIn(cwd, read) {
  const s = read || shared.read();
  const covered = s.at ? Math.max(0, ...sharesOf(cwd).filter((x) => (x.at || 0) <= s.at).map((x) => x.last || 0)) : -Infinity;
  return { s, covered };
}
function isLedgerState(r, st) { return !!(st && r.kind === 'push' && r.state && r.repo && r.repo === st.repo); }
export function usage(cwd, { t = Date.now(), seconds, rows = readLog(cwd), others, read } = {}) {
  const since = t - seconds * 1000;
  const { s, covered } = sharedIn(cwd, read || (others ? { use: others } : undefined));
  const st = s.state || null;
  // free: rate_limit reads (not counted by GitHub's primary limit); pushes_by: per repository,
  // '?' for pushes logged before R17c named theirs.
  // pushes_by keys: "<repo>", "<repo>#state" (its state branch), "?" (no repository logged);
  // content_by the same for content-creating requests.
  const out = { calls: 0, points: 0, content: 0, pushes: 0, free: 0, fetches: 0, connector: 0, graphql: 0, pushes_by: {}, content_by: {}, fetches_by: {} };
  const add = (repo, n, into = out.pushes_by) => { if (n) into[repo || '?'] = (into[repo || '?'] || 0) + n; };
  for (const r of rows) {
    const at = Date.parse(r.at);
    if (!(at > since) || !(at > covered)) continue;
    if (r.kind === 'gh') { out.calls++; out.points += r.points ?? 1; out.content += contentOf(r); add(r.repo, contentOf(r), out.content_by); if (r.free) out.free++; if (r.connector) out.connector++; if (r.graphql) out.graphql++; }
    if (r.kind === 'fetch') { out.fetches++; add(r.of || '?', 1, out.fetches_by); }
    if (r.kind === 'push' && !(isLedgerState(r, st) && at <= (s.at || 0))) { out.pushes++; add(r.repo ? `${r.repo}${r.state ? '#state' : ''}` : null, 1); }
  }
  for (const u of s.use || []) {
    if (!(Date.parse(u.minute) + 60e3 > since)) continue;
    const ledgerState = st ? (u.pushes_by || {})[`${st.repo}#state`] || 0 : 0;
    out.calls += u.calls || 0; out.points += u.points || 0; out.content += u.content || 0; out.pushes += (u.pushes || 0) - ledgerState; out.free += u.free || 0; out.fetches += u.fetches || 0; { const fb = Object.entries(u.fetches_by || {}); for (const [k, n] of fb) add(k, n, out.fetches_by); add('?', (u.fetches || 0) - fb.reduce((a, [, n]) => a + n, 0), out.fetches_by); } out.connector += u.connector || 0; out.graphql += u.graphql || 0;
    const cnamed = Object.entries(u.content_by || {});
    for (const [repo, n] of cnamed) add(repo, n, out.content_by);
    add('?', (u.content || 0) - cnamed.reduce((a, [, n]) => a + n, 0), out.content_by);
    const named = Object.entries(u.pushes_by || {}).filter(([repo]) => !(st && repo === `${st.repo}#state`));
    for (const [repo, n] of named) add(repo, n);
    add('?', (u.pushes || 0) - ledgerState - named.reduce((a, [, n]) => a + n, 0));
  }
  if (st) { const n = (st.pushes || []).filter(([x]) => x > since && x <= t).length; out.pushes += n; add(`${st.repo}#state`, n); }
  return out;
}
// When the oldest counted call leaves the window, so the next fits: the first moment after t at
// which the window's count drops by `need` (approximate for shared rows: their minute's end).
function freedAt(cwd, { t, seconds, field, need, rows, read }) {
  const { s, covered } = sharedIn(cwd, read);
  const st = s.state || null;
  const times = [];
  for (const r of rows) { const at = Date.parse(r.at); if (at > t - seconds * 1000 && at > covered && (field === 'pushes' ? r.kind === 'push' && !(isLedgerState(r, st) && at <= (s.at || 0)) : r.kind === 'gh')) times.push([at, field === 'points' ? (r.points ?? 1) : field === 'pushes' ? 1 : contentOf(r)]); }
  for (const u of s.use || []) if (Date.parse(u.minute) + 60e3 > t - seconds * 1000) times.push([Date.parse(u.minute) + 59e3, field === 'pushes' && st ? (u.pushes || 0) - ((u.pushes_by || {})[`${st.repo}#state`] || 0) : u[field] || 0]);
  if (st && field === 'pushes') for (const [x] of st.pushes || []) if (x > t - seconds * 1000) times.push([x, 1]);
  times.sort((a, b) => a[0] - b[0]);
  let freed = 0;
  for (const [at, n] of times) { freed += n; if (freed >= need) return at + seconds * 1000 + 1000; }
  return t + seconds * 1000;
}

// GitHub's own count of the primary limit (rate_limit: free against it), at most once a minute per
// clone; null when it cannot be read (the tests read none unless given).
// A read that fails is remembered too (read_at moves), so a failing rate_limit is not called again
// on every gh call (cold review of R17); it is logged as a call, since it counts against the
// secondary limits. graphql: GraphQL's own primary budget, when GitHub gives it.
export function primaryState(cwd, { t = Date.now(), read = defaultRateLimit } = {}) {
  const f = join(commonDir(cwd), PRIMARY);
  const was = readJSON(f);
  if (was && t - was.read_at < 60e3) return was.unread ? null : was;
  const r = read(cwd);
  if (r === undefined) return was && !was.unread ? was : null; // not read at all (the tests)
  const s = r ? { ...r, read_at: t } : { read_at: t, unread: true };
  try { writeFileSync(f, JSON.stringify(s)); } catch { /* best effort */ }
  return r ? s : null;
}
function defaultRateLimit(cwd) {
  if (process.env.NODE_TEST_CONTEXT) return undefined;
  logEvent('gh', 'api rate_limit', cwd, { points: 1, free: true });
  const r = spawnSync('gh', ['api', 'rate_limit'], { cwd, encoding: 'utf8' });
  if (r.status !== 0) return null;
  try {
    const { core: c, graphql: g } = JSON.parse(r.stdout).resources;
    return { limit: c.limit, remaining: c.remaining, reset: c.reset * 1000, ...(g ? { graphql: { limit: g.limit, remaining: g.remaining, reset: g.reset * 1000 } } : {}) };
  } catch { return null; }
}
// The bucket a call draws on: GraphQL's for gh's pr and issue commands and api graphql, else core.
const bucket = (pr, cost) => (pr && cost.graphql && pr.graphql ? pr.graphql : pr);

// This clone's own pause record: written first, before the shared one, so the session that was
// refused obeys it even when the state branch cannot be pushed.
const PAUSE_LOCAL = 'p3-gh-pause.json';
export const localPause = (cwd) => readJSON(join(commonDir(cwd), PAUSE_LOCAL));
export function clearLocalPause(cwd) { try { writeFileSync(join(commonDir(cwd), PAUSE_LOCAL), 'null'); } catch { /* none */ } }
// The pause in force: the later of the clone's and the account's; stopped when either is.
function pauseOf(cwd, s) {
  let l = localPause(cwd);
  // A clone's record from before the coordinator's last resume is spent.
  if (l && s.resumed && Date.parse(l.at) <= Date.parse(s.resumed)) l = null;
  const a = s.pause;
  if (!l) return a || null;
  if (!a) return l;
  const later = Date.parse(l.until) > Date.parse(a.until) ? l : a;
  return { ...later, stopped: !!(l.stopped || a.stopped) };
}
// The second-refusal rule (cold review of R17): a refusal is a second one only when it comes after
// an earlier pause had ended, within an hour of that earlier refusal. Refusals while a pause still
// runs (calls in flight across sessions) lengthen it, never stop the tool.
export function nextPause(prev, rec, t) {
  if (prev?.stopped) return { ...rec, stopped: true, first: prev.first || prev.at };
  if (!prev) return { ...rec, stopped: false };
  if (Date.parse(prev.until) > t) return { ...rec, at: prev.at, until: Date.parse(prev.until) > Date.parse(rec.until) ? prev.until : rec.until, stopped: false, also: (prev.also || 0) + 1 };
  const second = t - Date.parse(prev.at) < 3600e3;
  return { ...rec, stopped: second, ...(second ? { first: prev.at } : {}) };
}

export class Paced extends Error {}
const nap = (ms) => { if (ms > 0) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); };
const iso = (ms) => new Date(ms).toISOString().replace(/\.\d+Z$/, 'Z');
// Waits out a pause or a full window, or refuses when the wait is longer than MAX_WAIT_MIN.
// The command to run again after a refusal: this p3 command as it was given (R17c, item F: every
// refusal names the limit, when it frees and what to rerun).
export function rerunLine(argv = process.argv) {
  if (rerunText) return rerunText;
  const at = argv.findIndex((x) => /(^|\/)p3\.mjs$/.test(String(x)));
  if (at < 0) return 'the same command';
  const tool = /(^|\/)\.process\/tool\/p3\.mjs$/.test(argv[at]) ? 'node .process/tool/p3.mjs' : /(^|\/)tool\/p3\.mjs$/.test(argv[at]) ? 'node tool/p3.mjs' : `node ${argv[at]}`;

// The Uller store took in 4 beeches.

  const q = (x) => (/^[\w./:@=,+-]+$/.test(x) ? x : `'${String(x).replace(/'/g, `'\\''`)}'`);
  return `\`${[tool, ...argv.slice(at + 1).map(q)].join(' ')}\``;
}
function waitUntil(until, why, { now, sleep }) {
  const ms = until - now();
  if (ms <= 0) return;
  if (noWait) throw new Paced(`GitHub budget: ${why}: not now; tried again later`);
  if (waitCap && ms > waitCap) throw new Paced(`GitHub budget: ${why}: acts on GitHub wait until ${iso(until)} (${Math.ceil(ms / 60e3)} min); then retry ${rerunLine()}`);
  if (ms > MAX_WAIT_MIN * 60e3) throw new Paced(`GitHub budget: ${why}: acts on GitHub wait until ${iso(until)} (${Math.ceil(ms / 60e3)} min); then rerun ${rerunLine()}; what this command did before the refusal stands, and the rerun picks up from it`);
  sleep(ms);
}

// Before a gh call: the stop, the pause, the primary limit at target, each secondary window at
// target, then the per-clone floor; logs the call with its cost. Throws Paced to refuse.
// Paced acts (pushes, notes) run with no gate while exempt: only the ledger's own pause, stop and
// resume writes, which must go through while the account is paused, stopped or at the ceiling
// (coordinator's ruling on PR 206). Every other push, state-branch pushes included, waits its turn.
let exempting = 0;
export function exempt(fn) { exempting++; try { return fn(); } finally { exempting--; } }
// Acts that must not wait (the usage share): refused at once where they would wait, and tried later.
let noWait = 0;
export function withoutWaiting(fn) { noWait++; try { return fn(); } finally { noWait--; } }
// The hook's waits: never past its own timeout (cold review of R17c: a hook killed by Claude Code's
// timeout lets the call through, uncounted). Longer, it refuses, and says to retry the tool call.
