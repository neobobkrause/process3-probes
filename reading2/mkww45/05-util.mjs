  }
  if (deepened) runGit(['config', DEEP_MARK, 'true'], cwd);
  return deepened || got.length > 0;
}
// A git lock left in a clone (copy, 5 Nov: BOB's review worker deepened, notice triage and a job
// start ran git at once in one shallow clone: "shallow file has changed", a stale shallow.lock,
// no job started). Said plainly: whether a git process still runs in this clone, and if none,
// that the lock is stale and which file to remove. procs: the git processes' working directories.
export function lockNote(stderr, cwd, { procs = gitCwds } = {}) {
  const lock = /Unable to create '([^']+\.lock)': File exists/.exec(String(stderr || ''))?.[1];
  const raced = /shallow file has changed since we read it/.test(String(stderr || ''));
  if (!lock && !raced) return '';
  let top = null;
  try { top = realpathSync(execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()); } catch { top = null; }
  const seen = top ? procs() : null;
  const live = seen ? seen.filter((d) => d === top || d.startsWith(`${top}/`)).length : null;
  const one = 'one git user per clone at a time: review and triage workers run git in clones of their own';
  if (!lock) return `. Another git command changed this clone's shallow file while this one ran (${one}); run this again once it ends`;
  if (live) return `. ${live} other git process${live === 1 ? '' : 'es'} still run${live === 1 ? 's' : ''} in this clone and hold${live === 1 ? 's' : ''} ${lock} (${one}); run this again once ${live === 1 ? 'it ends' : 'they end'}`;
  if (live === 0) return `. No git process runs in this clone, so ${lock} is stale, left by a git command that was killed: remove it (rm '${lock}') and run this again (${one})`;
  return `. ${lock} is held by another git command in this clone or left by a killed one (${one}); if none runs, remove it and run this again`;
}
// The working directories of the git processes running now (Linux /proc; null where unread).
function gitCwds() {
  const out = [];
  let pids = [];
  try { pids = readdirSync('/proc').filter((n) => /^\d+$/.test(n) && Number(n) !== process.pid); } catch { return null; }
  for (const pid of pids) {
    try { if (readFileSync(`/proc/${pid}/comm`, 'utf8').trim() === 'git') out.push(realpathSync(`/proc/${pid}/cwd`)); } catch { /* gone, or not ours */ }
  }
  return out;
}

// Whether a path exists at a commit, read from the tree alone: in a partial clone this fetches
// nothing, so "absent" is never confused with "could not fetch".
export const exists = (root, rev, path) => git(['rev-parse', '-q', '--verify', `${rev}:${path}`], { cwd: root, allowFail: true }).code === 0;

// Many objects in one git cat-file --batch (C50: the copy's setup check read the state branch's
// layer rows, the ledger and the approvals history one git show each, thousands of spawns). specs:
// object names git cat-file takes ("<rev>:<path>" or an id), none with a newline. A Map spec to its
// bytes as a utf8 string, exactly as git show prints a blob; a spec git cannot find, or that names no
// blob, is absent from the Map. null when the batch itself fails.
export function catBatch(root, specs) {
  const out = new Map();
  const list = [...new Set(specs)].filter((x) => x && !/[\n\r]/.test(x));
  if (!list.length) return out;
  const r = run('git', ['-c', 'core.fsmonitor=false', 'cat-file', '--batch'], { cwd: root, input: list.join('\n') + '\n', encoding: 'buffer', unset: NO_TOKENS });
  if (r.code !== 0) return null;
  const buf = Buffer.isBuffer(r.stdout) ? r.stdout : Buffer.from(r.stdout);
  let at = 0;
  for (const spec of list) {
    const nl = buf.indexOf(10, at);
    if (nl < 0) return null;
    const head = buf.subarray(at, nl).toString('utf8');
    // "<id> <type> <size>", or "<spec> missing" / "<spec> ambiguous" (no body).
    const m = head.match(/^[0-9a-f]{40,64} (\w+) (\d+)$/);
    if (!m) { at = nl + 1; continue; }
    const size = Number(m[2]);
    if (m[1] === 'blob') out.set(spec, buf.subarray(nl + 1, nl + 1 + size).toString('utf8'));
    at = nl + 1 + size + 1;
  }
  return out;
}
// Which of revs name a commit this clone holds, in one cat-file --batch-check: a Set of revs.
export function haveCommits(root, revs) {
  const list = [...new Set(revs)].filter((x) => x && !/[\n\r]/.test(x));
  if (!list.length) return new Set();
  const r = run('git', ['-c', 'core.fsmonitor=false', 'cat-file', '--batch-check'], { cwd: root, input: list.map((x) => `${x}^{commit}`).join('\n') + '\n', unset: NO_TOKENS });
  if (r.code !== 0) return new Set();
  const lines = r.stdout.split('\n');
  return new Set(list.filter((x, i) => / commit \d+$/.test(lines[i] || '')));
}
// Every blob under dirs at ref, path to text, in two git calls: one ls-tree -r, one cat-file --batch.
// An empty Map when ref or the dirs are not there (as ls-tree failing read before); null when the
// batch fails (the caller reads one by one).
export function treeBlobs(root, ref, dirs) {
  const t = git(['ls-tree', '-r', '-z', ref, '--', ...dirs], { cwd: root, allowFail: true });
  if (t.code !== 0) return new Map();
  const list = t.stdout.split('\0').map((l) => l.match(/^\d+ blob ([0-9a-f]+)\t([\s\S]+)$/)).filter(Boolean).map((m) => [m[1], m[2]]);
  const got = catBatch(root, list.map(([sha]) => sha));
  if (got === null) return null;
  return new Map(list.filter(([sha]) => got.has(sha)).map(([sha, path]) => [path, got.get(sha)]));
}

// GitHub through the gh CLI (measured route, platform row 14). Returns parsed JSON or text.
// A call GitHub refuses for a rate limit, or answers with a 5xx while a limit is at the target, backs
// off (pace.mjs backoff, PD-22): waited out and made again when GitHub did not act on it (a refusal),
// up to MAX_WAIT_MIN; longer, or after a 5xx (a write may have landed), it refuses, naming when to rerun.
export function ghRun(args, opts = {}, { read, now = Date.now, sleep = pause, log = (m) => console.error(m) } = {}) {
  for (let t = 1; ; t++) {
    const r = run('gh', args, opts);
    if (r.code === 0) return r;
    const b = backoff(r.stderr, opts.cwd, { ...(read ? { read } : {}), now: now() });
    if (!b) return r;
    const ms = b.until - now();
    const when = new Date(b.until).toISOString().replace(/\.\d+Z$/, 'Z');
    if (!b.retry || t >= 3 || ms > MAX_WAIT_MIN * 60e3) fail(`gh ${args.slice(0, 2).join(' ')}: ${b.why}; run this again after ${when}, never before (P27)`);
    log(`gh ${args.slice(0, 2).join(' ')}: ${b.why}; waiting ${Math.ceil(ms / 1000)} s, then once more`);
    sleep(ms);
  }
}
export function gh(args, opts = {}) {
  const r = ghRun(args, { input: opts.input, cwd: opts.cwd });
  if (r.code !== 0 && !opts.allowFail) fail(`gh ${args.slice(0, 3).join(' ')} failed: ${(r.stderr || r.stdout).trim()}`);
  if (opts.allowFail && r.code !== 0) return null;
  const s = r.stdout.trim();
  if (!s) return null;
  try { return JSON.parse(s); } catch { return s; }
}

// A shallow clone (clone_depth on create_session): its history is cut, so a full fetch of a
// branch pulls that branch's whole history (90 s measured 3 Nov), and a local merge base or
// count of commits between two branches can be wrong. Fetches there take --depth 1.
export const isShallow = (root) => git(['rev-parse', '--is-shallow-repository'], { cwd: root, allowFail: true }).stdout.trim() === 'true';
// A shallow clone whose history was fetched deeper on purpose (the merge train's: the tranche past
// main) carries this mark; a --depth 1 fetch there would cut that history back to one commit, so
// its fetches take no depth (build/starter-fixes, 5 Nov).
export const DEEP_MARK = 'p3.deep';
export const markedDeep = (root) => git(['config', '--get', DEEP_MARK], { cwd: root, allowFail: true }).stdout.trim() === 'true';
export const depth = (root) => (isShallow(root) && !markedDeep(root) ? ['--depth', '1'] : []);
// The commits a shallow clone's history is cut at (empty in a full clone).
export function shallowCuts(root) {
  const f = git(['rev-parse', '--git-path', 'shallow'], { cwd: root, allowFail: true }).stdout.trim();
  try { return new Set(readFileSync(resolve(root, f), 'utf8').split('\n').map((x) => x.trim()).filter(Boolean)); } catch { return new Set(); }
}
// Job heads fetched. In a shallow clone, only their commits main lacks: a plain fetch of a head cut
// from a commit the clone lacks pulls main's whole history (1.2 GB on the copy). A head main holds
// whole (git selects no commit) is fetched at its tip alone: main's commits are not on the
// tranche's history past main, so that cut cuts nothing read there. Any other failure fetches
// nothing more (never a depth after a network error). True when every ref was fetched.
export function fetchJobRefs(root, refs, main = 'main') {
  const spec = (ref) => `+refs/heads/${ref}:refs/remotes/origin/${ref}`;
  const run = (args, rs) => git(['fetch', '-q', ...args, 'origin', ...rs.map(spec)], { cwd: root, allowFail: true });
  if (!refs.length) return true;
  if (!isShallow(root)) return run([], refs).code === 0;
  const all = run([`--shallow-exclude=${main}`], refs);
  if (all.code === 0) return true;
  if (!/no commits selected/.test(all.stderr) && refs.length === 1) return false;
  let ok = true;
  for (const ref of refs) {
    const one = refs.length === 1 ? all : run([`--shallow-exclude=${main}`], [ref]);
    if (one.code === 0) continue;
    if (/no commits selected/.test(one.stderr)) ok = run(['--depth=1'], [ref]).code === 0 && ok;
    else ok = false;
  }
  return ok;
}
// within (ms, a read's choice: C18, 7 Nov, branch fetches the biggest kind of an hour's 912): the
// clone's copy serves when any p3 process of the clone fetched the branch that recently and the
// ref is still what that fetch left. Without it, a fetch, as ever.
export function fetchBranch(root, branch, { within = 0, ...opts } = {}) {
  const stamp = join(commonDir(root), 'p3-gh-cache', `branch-${String(branch).replace(/[^\w.-]/g, '_')}.json`);
  const tip = () => git(['rev-parse', '-q', '--verify', `refs/remotes/origin/${branch}^{commit}`], { cwd: root, allowFail: true }).stdout.trim() || null;
  if (within > 0) { try { const s = JSON.parse(readFileSync(stamp, 'utf8')); if (s.at <= Date.now() && Date.now() - s.at < within && s.tip && s.tip === tip()) return opts.allowFail ? { code: 0, stdout: '', stderr: '', seconds: 0, timedOut: false, kept: true } : ''; } catch { /* fetch */ } }
  const r = git(['fetch', '-q', ...depth(root), 'origin', `+refs/heads/${branch}:refs/remotes/origin/${branch}`], { cwd: root, ...opts });
  if (!opts.allowFail || r.code === 0) { try { mkdirSync(dirname(stamp), { recursive: true }); writeFileSync(stamp, JSON.stringify({ at: Date.now(), tip: tip() })); } catch { /* a saving */ } }
  return r;
}

export function repoRoot(cwd = process.cwd()) {
  return git(['rev-parse', '--show-toplevel'], { cwd });
}

// owner/name of the repository: GITHUB_REPOSITORY in CI, else parsed from origin.
export function repoSlug(root) {
  if (process.env.GITHUB_REPOSITORY) return process.env.GITHUB_REPOSITORY;
  const url = git(['remote', 'get-url', 'origin'], { cwd: root });
  const m = url.replace(/\.git$/, '').match(/([^/:]+)\/([^/]+)$/);
  if (!m) fail(`cannot read owner/name from origin ${url}`);
  return `${m[1]}/${m[2]}`;
}

export const DEFAULTS = {
  // GitHub's published limits (P27, PD-22; pace.mjs): the share of them used, and the poll cadence.
  pacing: { ...PACING_DEFAULTS },
  tranche: 'tranche',
  records: ['process/'],
  transient: [],
  max_file_bytes: 1048576,
  approvals: { file: 'CLAUDE.md', heading: '## Standing approvals from Bob', owner: 'neobobkrause' },
  lockfiles: [],
  node: null,
  coordinator: null,
  state_branch: 'process-state',
  // status --role bob --context <percent>: REFRESH at this share of the window (SES-4).
  refresh_context: 60,
  reading_bob: ['CLAUDE.md'],
  // The plan: run, pause or stop. The job cap is not a config key: jobCap reads it.
  plan: 'run',
  // The merge strategy (design note "Shared Layer Branch", Bob, 5 Nov; the merge train removed, Bob,
  // 6 Nov): "layer", the only flow: a job publishes onto its layer's branch layer/<n>, which merges
  // into the tranche once (layerflow.mjs). Absent reads as "layer"; any other value is refused.
