// GitHub limit conformance (R17). The civicsmith account was suspended on 6 Nov at 19:19Z, most
// likely for automated bulk activity. Bob, 6 Nov ~21:10Z: "If github publishes limits, then we
// should introduce process3 tooling that conforms to those limits. But rather than limiting usage
// to a small fraction of github's stated limits, I'd suggest that the tooling limit usage to 80%
// or 90% of github's published limits. That feels like the proper balance."
//
// So the tool:
// - holds GitHub's published limits as data (GITHUB_LIMITS, pacing.github_limits);
// - uses at most pacing.target (default 0.85, 0.8 to 0.9) of each, account-wide:
//   - the primary limit is GitHub's own count: the rate_limit endpoint, which does not count
//     against it, read at most once a minute per clone;
//   - the secondary limits are counted per call (REST points; content-creating requests), from
//     every session's usage rows on the state branch plus this clone's own log;
// - obeys GitHub's refusals: on a 403 or 429 rate-limit response, every session pauses until the
//   reset (Retry-After, x-ratelimit-reset, else at least a minute) and never retries inside it; a
//   second refusal within an hour stops the tool until the coordinator runs `github resume`.
// The per-clone spacing (gh_interval_ms) is only a floor against bursts. Session caps are off by
// default (pacing.jobs, pacing.lanes): the budget throttles. The shared store is an adapter
// (useShared): p3.mjs sets the state branch's (ghshare.mjs); with none, this clone's own log only.
// No import from util.mjs (util imports this).
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { hostname, tmpdir } from 'node:os';
import { basename, dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// GitHub's published limits, read 6 Nov 2026 from the source below.
export const GITHUB_LIMITS = {
  source: 'https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api',
  read: '2026-11-06',
  primary_per_hour: 5000, // per user token
  actions_token_per_hour: 1000, // GITHUB_TOKEN, per repository
  concurrent: 100,
  rest_points_per_minute: 900, // GET, HEAD, OPTIONS 1 point; POST, PATCH, PUT, DELETE 5
  content_per_minute: 80,
  content_per_hour: 500,
  cpu_seconds_per_minute: 90,
};
// pushes_per_hour: the process's own account-wide push ceiling (decision PD-3, coordinator, 6 Nov):
// GitHub publishes none, and push volume is the likely cause of the suspension (1,387 in 19 h).
// ledger: the repository whose state branch holds the account's ledger (github/), "<owner>/<repo>";
// null is this product's own (ghshare.mjs).
export const PACING_DEFAULTS = { target: 0.85, jobs: null, lanes: null, gh_interval_ms: 1000, poll_first_s: 30, poll_most_s: 300, share_s: 900, pushes_per_hour: 120, ledger: null, github_limits: GITHUB_LIMITS };
export const TARGET_RANGE = [0.8, 0.9];
export const POLL_FLOOR_S = 30;
export const GH_FLOOR_MS = 1000;
export const MAX_WAIT_MIN = 15;
export const GITHUB_LOG = 'p3-github.jsonl';
const STAMP = 'p3-gh-pace';
const PRIMARY = 'p3-gh-primary.json';

let current = { ...PACING_DEFAULTS };
// The pacing in force: the defaults, the config's "pacing" over them (configOf sets it).
export function setPacing(p) { current = { ...PACING_DEFAULTS, ...(p || {}), github_limits: { ...GITHUB_LIMITS, ...(p?.github_limits || {}) } }; }
// P3_GH_INTERVAL_MS (and P3_GITHUB_LOG) are read under the test runner only, never in a session.
export function pacing(env = process.env) {
  const ms = env.NODE_TEST_CONTEXT ? env.P3_GH_INTERVAL_MS : undefined;
  return { ...current, ...(ms !== undefined && ms !== '' && /^\d+$/.test(ms) ? { gh_interval_ms: Number(ms) } : {}) };
}
// Optional hard caps (off by default): pacing.jobs on the job cap, pacing.lanes on lane seats.
export const pacedJobs = (cfg = {}) => cfg.pacing?.jobs ?? null;
export const pacedLanes = (cfg = {}) => cfg.pacing?.lanes ?? null;
// Checks a config's "pacing" block; returns the problem or null.
export function pacingProblem(p) {
  if (p === undefined) return null;
  if (!p || typeof p !== 'object' || Array.isArray(p)) return 'pacing is an object';
  for (const k of Object.keys(p)) if (!(k in PACING_DEFAULTS)) return `pacing.${k} is not a pacing key (${Object.keys(PACING_DEFAULTS).join(', ')})`;
  if (p.target !== undefined && !(typeof p.target === 'number' && p.target >= TARGET_RANGE[0] && p.target <= TARGET_RANGE[1])) return `pacing.target is between ${TARGET_RANGE[0]} and ${TARGET_RANGE[1]}: the share of GitHub's published limits the tool uses (Bob, 6 Nov: "80% or 90%")`;
  for (const k of ['jobs', 'lanes']) if (p[k] !== undefined && p[k] !== null && !(Number.isInteger(p[k]) && p[k] >= 1)) return `pacing.${k} is a whole number, 1 or more, or null (no cap)`;
  if (p.ledger !== undefined && p.ledger !== null && !(typeof p.ledger === 'string' && /^[\w.-]+\/[\w.-]+$/.test(p.ledger))) return 'pacing.ledger is "<owner>/<repo>": the repository whose state branch holds the account\'s GitHub ledger';
  if (p.pushes_per_hour !== undefined && !(Number.isInteger(p.pushes_per_hour) && p.pushes_per_hour >= 1)) return 'pacing.pushes_per_hour is a whole number, 1 or more';
  for (const k of ['gh_interval_ms', 'poll_first_s', 'poll_most_s', 'share_s']) if (p[k] !== undefined && !(Number.isInteger(p[k]) && p[k] >= 0)) return `pacing.${k} is a whole number`;
  if (p.gh_interval_ms !== undefined && p.gh_interval_ms < GH_FLOOR_MS) return `pacing.gh_interval_ms is ${GH_FLOOR_MS} or more: no more than one gh call a second per clone`;
  if (p.poll_first_s !== undefined && p.poll_first_s < POLL_FLOOR_S) return `pacing.poll_first_s is ${POLL_FLOOR_S} or more: no wait on GitHub polls tighter than ${POLL_FLOOR_S} s`;
  const first = p.poll_first_s ?? PACING_DEFAULTS.poll_first_s;
  if (p.poll_most_s !== undefined && p.poll_most_s < first) return 'pacing.poll_most_s is at least pacing.poll_first_s';
  if (p.github_limits !== undefined) {
    const g = p.github_limits;
    if (!g || typeof g !== 'object' || Array.isArray(g)) return 'pacing.github_limits is an object';
    for (const [k, v] of Object.entries(g)) {
      if (!(k in GITHUB_LIMITS)) return `pacing.github_limits.${k} is not one of GitHub's published limits held here (${Object.keys(GITHUB_LIMITS).join(', ')})`;
      if (k !== 'source' && k !== 'read' && !(Number.isInteger(v) && v > 0)) return `pacing.github_limits.${k} is a whole number above 0`;
    }
    if (g.source === undefined || g.read === undefined) return 'pacing.github_limits names its source and the date it was read (source, read), as GitHub publishes them';
  }
  return null;
}

// The pause before the k-th poll in a row (k from 1): poll_first_s doubling to poll_most_s.
export function pollMs(k, p = pacing()) {
  const first = Math.max(POLL_FLOOR_S, p.poll_first_s) * 1000;
  return Math.min(Math.max(first, p.poll_most_s * 1000), first * 2 ** Math.max(0, k - 1));
}

// The clone's git directory (shared by its worktrees), where the stamps and the log live; the
// temp directory when cwd is no clone.
// Asked of git once per directory and process (R17d: the hook's read path spawns as little as it can).
const dirs = new Map();
export function commonDir(cwd) {
  const at = cwd || process.cwd();
  if (dirs.has(at)) return dirs.get(at);
  const r = spawnSync('git', ['rev-parse', '--git-common-dir'], { cwd: at, encoding: 'utf8' });
  const d = r.status === 0 ? r.stdout.trim() : '';
  const out = !d ? tmpdir() : isAbsolute(d) ? d : resolve(at, d);
  if (d) dirs.set(at, out);
  return out;
}
// The tool's command as it is run in this clone (R17d: a refusal names the path that exists): a
// product runs the pinned process at .process/tool/p3.mjs, process3 its own tool/p3.mjs.
export const TOOL = basename(resolve(dirname(fileURLToPath(import.meta.url)), '../..')) === '.process' ? 'node .process/tool/p3.mjs' : 'node tool/p3.mjs';
export const githubLog = (cwd) => (process.env.NODE_TEST_CONTEXT && process.env.P3_GITHUB_LOG) || join(commonDir(cwd), GITHUB_LOG);
export const sessionId = () => process.env.CLAUDE_CODE_SESSION_ID || process.env.P3_SESSION || null;
// This clone, as the ledger's rows name it: one session can act from two clones (process3 and a
// product), and only the clone's own rows are in its log (cold review of R17b).
// R17e (coordinator's C10): every cloud container is hostname "vm" with the same paths, so the
// name alone made every session's copy clone one clone; a random id kept in the git directory
// tells them apart. Labels only: what is counted no longer turns on it (usage).
const ids = new Map();
export function cloneId(cwd) {
  const dir = commonDir(cwd);
  if (ids.has(dir)) return ids.get(dir);
  const f = join(dir, 'p3-clone-id');
  let id = null;
  try { id = readFileSync(f, 'utf8').trim() || null; } catch { id = null; }
  if (!id) { try { writeFileSync(f, randomUUID().slice(0, 8), { flag: 'wx' }); } catch { /* another process made it */ } try { id = readFileSync(f, 'utf8').trim(); } catch { id = 'x'; } }
  const out = `${hostname()}:${dir}:${id}`;
  ids.set(dir, out);
  return out;
}
// This clone's shares (ghshare.mjs shareUsage): each { last: the last own row it carried, at: when
// it was pushed }; a number is the record from before R17e (a share made long ago).
export const SHARED_MARK = 'p3-gh-shared-to';
export function sharesOf(cwd) {
  let v = null;
  try { v = JSON.parse(readFileSync(join(commonDir(cwd), SHARED_MARK), 'utf8')); } catch { v = null; }
  if (typeof v === 'number') return [{ last: v, at: 0 }];
  return Array.isArray(v?.shares) ? v.shares : [];
}
export function noteShare(cwd, last, at, made = at) {
  try { writeFileSync(join(commonDir(cwd), SHARED_MARK), JSON.stringify({ shares: [...sharesOf(cwd), { last, at, made }].slice(-50) })); } catch { /* best effort */ }
}
// A share pushed with the command's coalesced push records its time once that push is made.
export const PENDING_AT = Number.MAX_SAFE_INTEGER;
export function settleShare(cwd, last, at) {
  try { writeFileSync(join(commonDir(cwd), SHARED_MARK), JSON.stringify({ shares: sharesOf(cwd).map((x) => (x.last === last && x.at === PENDING_AT ? { ...x, at } : x)) })); } catch { /* best effort */ }
}
export const lastShared = (cwd) => Math.max(0, ...sharesOf(cwd).map((x) => x.last || 0));
const readJSON = (f) => { try { return JSON.parse(readFileSync(f, 'utf8')); } catch { return null; } };

// What a gh call costs against the secondary limits: its REST points (a read 1, a write 5) and
// whether it creates content. gh api's method is -X/--method, else POST when it sends fields; a
// GraphQL mutation is a write. gh's own commands by their verb. Approximate where gh hides the
// request (its pr and issue commands use GraphQL): a write verb is counted as a write.
const WRITE_VERBS = new Set(['create', 'edit', 'merge', 'comment', 'review', 'ready', 'close', 'reopen', 'delete', 'lock', 'unlock', 'transfer', 'rerun', 'cancel', 'run', 'enable', 'disable', 'set', 'add', 'remove', 'upload']);
export function classify(args) {
  const a = args.map(String);
  if (a[0] === 'api') {
    const mi = a.findIndex((x) => x === '-X' || x === '--method');
    const m = mi >= 0 ? String(a[mi + 1] || '').toUpperCase() : a.find((x) => /^--method=/.test(x))?.split('=')[1]?.toUpperCase();
    const fields = a.some((x) => /^(-f|-F|--field|--raw-field|--input)$/.test(x) || /^--(raw-)?field=/.test(x));
    const graphql = a[1] === 'graphql';
    const write = graphql ? a.some((x) => /^\s*(query=)?\s*mutation\b/.test(x)) : (m ? !['GET', 'HEAD', 'OPTIONS'].includes(m) : fields);
    const free = !graphql && /^\/?rate_limit$/.test(a[1] || '');
    return { points: write ? 5 : 1, content: write, actions: a.some((x) => /\/actions\/(workflows\/[^/]+\/dispatches|runs\/\d+\/rerun)/.test(x)), primary: !free, graphql };
  }
  const write = WRITE_VERBS.has(a[1]) && !(a[0] === 'run' && a[1] === 'run');
  const actions = (a[0] === 'workflow' && a[1] === 'run') || (a[0] === 'run' && (a[1] === 'rerun' || a[1] === 'cancel'));
  // gh's pr and issue commands are GraphQL requests: they draw on GraphQL's own primary budget.
