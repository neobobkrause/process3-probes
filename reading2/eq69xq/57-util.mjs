  return configOf(c, `${CONFIG_FILE}${ref ? ` at ${ref}` : ''}`);
}

// A config object as the tool reads it: the defaults with its keys over them, checked.
export function configOf(c, where = CONFIG_FILE) {
  // A generated path and a records path never overlap: a record is trusted as inert, so a
  // generated file under one would escape the gate's regenerate (review 4 of PR 95).
  const recs = Array.isArray(c.records) ? c.records : DEFAULTS.records;
  const strip = (p) => String(p).replace(/^\.\//, '');
  for (const row of Array.isArray(c.generated) ? c.generated : []) for (const g of Array.isArray(row?.paths) ? row.paths : []) {
    const r = recs.find((x) => typeof x === 'string' && (underPath(strip(g), strip(x)) || underPath(strip(x), strip(g))));
    if (r !== undefined) fail(`${where}: the generated path ${g} and the records path ${r} overlap; a generated file is never a record`);
  }
  const pp = pacingProblem(c.pacing);
  if (pp) fail(`${where}: ${pp}`);
  setPacing(c.pacing);
  const ms = c.merge_strategy ?? DEFAULTS.merge_strategy;
  if (ms !== 'layer' && ms !== 'direct') fail(`${where}: merge_strategy ${JSON.stringify(c.merge_strategy)}: the merge train was removed (Bob, 6 Nov); set "merge_strategy": "layer" (or leave the key out) or "direct" (PD-25)`);
  return {
    ...DEFAULTS, ...c,
    // A null tranche is the default one, as the anchor reads it (second confirming review of PR 97).
    tranche: c.tranche ?? DEFAULTS.tranche,
    approvals: { ...DEFAULTS.approvals, ...(c.approvals || {}) },
    targets: { ...DEFAULTS.targets, ...(c.targets || {}) },
    pacing: { ...DEFAULTS.pacing, ...(c.pacing || {}) },
  };
}

// The job cap (Bob, 4 Nov): the job sessions running at once across the whole account, every
// product (list_sessions is account-scoped); roles, builds and other sessions are not counted. One
// value per account, P3_JOB_CAP in the account's cloud environment, default 20. The one place the
// cap is read: job start, status, the sweep and lead times call this and nothing else.
// A product config's old live_cap (or job_cap) is ignored, with a note saying so. Empty is unset.
export const JOB_CAP_VAR = 'P3_JOB_CAP';
const JOB_CAP_DEFAULT = 20;
export function jobCap(cfg = {}, env = process.env) {
  const raw = env[JOB_CAP_VAR];
  const set = raw !== undefined && raw !== '';
  const cap = set ? (/^\d+$/.test(String(raw).trim()) ? Number(raw) : NaN) : JOB_CAP_DEFAULT;
  if (!Number.isInteger(cap) || cap < 1) fail(`${JOB_CAP_VAR}=${JSON.stringify(raw)}: the job cap is a whole number of job sessions, 1 or more; the account owner sets it in the environment's variables, or leaves it unset for ${JOB_CAP_DEFAULT}`);
  const old = ['live_cap', 'job_cap'].filter((k) => cfg[k] !== undefined);
  // pacing.jobs (an R17 cap set as GitHub pacing) is retired by PD-6: ignored, with a note; the
  // budget of GitHub's published limits throttles (pace.mjs).
  if (cfg.pacing?.jobs !== undefined && cfg.pacing?.jobs !== null) old.push('pacing.jobs (PD-6: no session cap set as GitHub pacing)');
  const from = set ? JOB_CAP_VAR : 'default';
  return {
    cap, from, line: `job cap ${cap} (${from})`,
    note: old.length ? `${CONFIG_FILE}: ${old.join(', ')} ignored; the job cap now comes from ${JOB_CAP_VAR} (default ${JOB_CAP_DEFAULT})` : null,
  };
}
// The cap a sweep row recorded (job_cap; live_cap in rows written before 4 Nov).
export const rowCap = (r) => r.job_cap ?? r.live_cap;

// A path entry ending in / is a directory; any other names a file or a directory.
export const underPath = (file, p) => file === p || file.startsWith(p.endsWith('/') ? p : `${p}/`);

export const isRecordPath = (cfg, f) => cfg.records.some((r) => underPath(f, r));

// A lane's checks (coordinator, 6 Nov: a broken words build landed green, ux lane Q7): the commands
// its lanes row declares, each a string (split on spaces) or an argv list, run by the gate on a
// lane-only pull request in place of the suite. [] when none; null for a row that is not lists of words.
// A command line's words, with "..." and '...' kept whole (no shell runs them); null when a quote is open.
function words(line) {
  const out = [];
  let cur = null;
  let q = null;
  for (const ch of String(line)) {
    if (q) { if (ch === q) q = null; else cur += ch; continue; }
    if (ch === '"' || ch === "'") { q = ch; cur ??= ''; continue; }
    if (/\s/.test(ch)) { if (cur !== null) out.push(cur); cur = null; continue; }
    cur = (cur ?? '') + ch;
  }
  if (q) return null;
  if (cur !== null) out.push(cur);
  return out;
}
export function laneChecks(cfg, name) {
  const l = (Array.isArray(cfg?.lanes) ? cfg.lanes : []).find((x) => typeof x?.name === 'string' && x.name.trim() === name);
  if (!l || l.checks === undefined) return [];
  if (!Array.isArray(l.checks)) return null;
  const out = l.checks.map((c) => (typeof c === 'string' ? words(c) : Array.isArray(c) && c.every((w) => typeof w === 'string') ? c : null));
  return out.some((c) => !c || !c.length) ? null : out;
}
// Lanes' folders (lane.mjs; Bob, 5 Nov 17:45: "I don't believe that lanes' file changes need to be tested the way jobs do").
// A lane's folder is its config "dir"; one at the root, or holding the process's own files, the
// workflows or the session settings, is no lane folder here, so nothing outside a lane rides it.
const NOT_LANE = ['process', '.process', '.github', '.claude', 'CLAUDE.md'];
export function laneDirs(cfg) {
  const ls = Array.isArray(cfg?.lanes) ? cfg.lanes : [];
  const norm = (d) => d.trim().replace(/^\.\//, '').replace(/\/+$/, '');
  const ok = (d) => d && d !== '.' && !d.startsWith('/') && !d.split('/').includes('..') && !NOT_LANE.some((n) => underPath(d, n));
  return ls.filter((l) => l && typeof l.name === 'string' && l.name.trim() && typeof l.dir === 'string')
    .map((l) => ({ name: l.name.trim(), dir: norm(l.dir), module: typeof l.module === 'string' ? l.module.trim() : null, research: researchOf(l, norm) }))
    .filter((l) => ok(l.dir))
    .map((l, _, all) => {
      // Dropped, never widened, where it could take a folder that is not research: outside the
      // lane rules, inside or around dir, or overlapping another lane's dir or research.
      const r = l.research;
      const clash = (x) => underPath(r, x) || underPath(x, r);
      const good = r && ok(r) && RESEARCH_NAME.test(r) && !clash(l.dir) && !all.some((o) => o !== l && (clash(o.dir) || (o.research && clash(o.research))));
      return { ...l, research: good ? r : null };
    });
}
// A research area's last segment is "research" or ends in "-research", so no source folder or root
// build file (src, package.json) is ever taken for one (review of build/lane-qualification).
export const RESEARCH_NAME = /(^|\/)([^/]+-)?research$/;
// A design lane's research area (Bob, 6 Nov: "This initial and ongoing research should be
// recording in a lane-specific area of the product repo for subsequent sessions to draw from and
// evolve"): its "research" in process/config.json, else the sibling <dir>-research. A sibling, not
// a folder inside dir: dir holds only what the product's build reads (sources and generators), and
// research is never a build input, so it stays out of every glob of dir. It counts as the lane's
// own folder (laneOfPath): a pull request changing only it and dir lands without a suite run.
// A triage lane keeps its register instead: no research area.
export function researchOf(l, norm = (d) => d.trim().replace(/^\.\//, '').replace(/\/+$/, '')) {
  if (!l || (l.kind !== undefined && l.kind !== 'design') || typeof l.dir !== 'string' || !l.dir.trim()) return null;
  if (l.research !== undefined && typeof l.research !== 'string') return null;
  if (typeof l.research === 'string' && l.research.trim()) return norm(l.research);
  return `${norm(l.dir)}-research`;
}
// The lane whose folder holds f, or null; a file a ledger module other than the lane's own owns
// (its paths or tests: entries, the ledger's) is that module's, judged as today.
// Never a lane path: any module's tests; a file of the job being gated (self), so a job's own
// code is always tested; CLAUDE.md, .claude/, .github/ or .process/ anywhere in the folder.
const GOVERNS = /(^|\/)(CLAUDE\.md$|\.claude\/|\.github\/|\.process\/)/;
export function laneOfPath(cfg, f, entries = [], { self = null } = {}) {
  const l = laneDirs(cfg).find((x) => underPath(f, x.dir) || (x.research && underPath(f, x.research)));
  if (!l || GOVERNS.test(f)) return null;
  const owns = (e, ps) => (ps || []).some((p) => underPath(f, p));
  const other = entries.some((e) => owns(e, e.tests) || ((e.id !== l.module || e.id === self) && owns(e, e.paths)));
  return other ? null : l.name;
}
export const isRecordOrLane = (cfg, f, entries = [], opts = {}) => isRecordPath(cfg, f) || !!laneOfPath(cfg, f, entries, opts);
// The one lane a change is all inside, records aside, or null: no file of a lane's folder, a file
// outside every lane's folder, or files of two lanes' folders.
export function laneOnly(cfg, files, entries = []) {
  // The config is a record, but a change to it (a lane's checks, its dir) is never a lane's own: a
  // lane-only pull request could otherwise drop its own checks (cold review of PR 203).
  if (files.includes(CONFIG_FILE)) return null;
  const names = new Set();
  for (const f of files) {
    if (isRecordPath(cfg, f)) continue;
    const n = laneOfPath(cfg, f, entries);
    if (!n) return null;
    names.add(n);
  }
  return names.size === 1 ? [...names][0] : null;
}

// --key value, --key=value (for a value that starts with --) and --flag; repeated keys become arrays; the rest are positional.
export function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) { out._.push(a); continue; }
    const eq = a.indexOf('=');
    const k = eq > 0 ? a.slice(2, eq) : a.slice(2);
    const v = eq > 0 ? a.slice(eq + 1) : i + 1 < argv.length && !argv[i + 1].startsWith('--') ? argv[++i] : true;
    if (k in out) out[k] = [].concat(out[k], v); else out[k] = v;
  }
  return out;
}

export const list = (v) => (v === undefined ? [] : [].concat(v));
export const fileBytes = (p) => (existsSync(p) ? statSync(p).size : 0);
export const now = () => new Date().toISOString().replace(/\.\d+Z$/, 'Z');

// A moved base is retried, never forced (Foundations, "Refusals, the start and the platform's
// limits"). GitHub's "Base branch was modified" on a merge, and git's fetch-first rejection of a
// push, mean another writer got there first; both fetch and try again, at most `tries` times.
export const RETRIES = 3;
export const BASE_MOVED = /Base branch was modified/i;
export const FETCH_FIRST = /\(fetch first\)|fetch first/i;
const pause = (ms) => { if (ms > 0) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); };

// A push the remote turned away because another writer moved the ref under it: git's fetch-first
// or non-fast-forward (the latter when the new tip is already local, e.g. two writers in one clone),
// and the remote's "cannot lock ref ... is at X but expected Y" / "failed to update ref" / "stale
// info" when the move lands between its check and its update (p3 sweep twice, and send delivered,
// on the copy, 4 Nov). A 5xx from GitHub (500s on pushes 09:49-10:26, 4 Nov) is retried the same
// way: the push may or may not have landed, so the fetched tip is checked first.
export const PUSH_TRIES = 5;
export const REF_MOVED = /fetch first|non-fast-forward|cannot lock ref|but expected|failed to update ref|stale info/i;
// GitHub's own transient push failures too (copy PR 678, 6 Nov: "remote: fatal error in commit_refs").
export const SERVER_ERROR = /(?:error|HTTP(?:\/[\d.]+)?(?: code)?)[: ]+5\d\d\b|Internal Server Error|Bad Gateway|Service Unavailable|Gateway Time-?out|fatal error in commit_refs|RPC failed|unexpected disconnect|remote end hung up/i;
const jitter = (ms) => Math.round(ms * (0.75 + Math.random() * 0.5));

