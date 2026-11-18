export const BUCKETS = [[1, 5], [6, 10], [11, 15], [16, 20], [21, Infinity]];
// A COMPLETE claim is refuted (SES-12, the false-done rate) when a gate run of that attempt
// failed its suite or its revert check (PD-21: no receipt; rows before it name the attempt receipt_attempt). A revert failure a reviewer later exempted on the same attempt
// (AUD-1: a refactor whose tests rightly pass before and after) refutes nothing.
const attemptOf = (r) => r?.attempt ?? r?.receipt_attempt;
export const refutes = (r, attempt) => attemptOf(r) === attempt && (r.suite === 'fail' || r.revert === 'fail');
export function refuted(runs, attempt) {
  const list = runs || [];
  // Cancelled only by an exempt run after it on the same attempt whose reviewed commit is its own.
  const excused = (r, i) => r?.revert === 'fail' && r.suite !== 'fail'
    && list.slice(i + 1).some((x) => attemptOf(x) === attempt && x.revert === 'exempt' && x.revert_exempt?.sha === r.sha);
  return list.some((r, i) => !excused(r, i) && refutes(r, attempt));
}
const r2 = (x) => Math.round(x * 100) / 100;
export function flowFigures({ sweeps = [], rows = [], unmetAt = () => null, gates = () => null, syncs = null, reverts = null, quick = null, from, to = now() }) {
  const [a, b] = [Date.parse(from) || -Infinity, Date.parse(to)];
  const inW = (r) => Date.parse(r.at) >= a && Date.parse(r.at) <= b;
  const runsOf = (pr) => { try { return pr ? gates(pr) : null; } catch { return null; } };
  // Each event once, with what it adds: a merge its gate runs; a complete claim whether a gate run of its attempt refuted it; a reopen its marks.
  const merges = [...new Map(rows.filter((r) => r.row === 'merge' && inW(r)).map((r) => [String(r.pr), r])).values()].map((r) => ({ at: Date.parse(r.at), runs: runsOf(r.pr) }));
  const completes = rows.filter((r) => r.row === 'attempt' && r.event === 'complete' && inW(r)).map((c) => ({ at: Date.parse(c.at), refuted: refuted(runsOf(c.pr), c.attempt) }));
  const reopens = rows.filter((r) => r.row === 'attempt' && r.event === 'start' && r.reopen && !r.abandoned && inW(r)).map((r) => ({ at: Date.parse(r.at), marks: (String(r.reopen).match(/\b[RF][\w.-]*\d\b/g) || []).length }));
  const fall = (x, y) => { const [u, v] = [unmetAt(new Date(x).toISOString()), unmetAt(new Date(y).toISOString())]; return Number.isInteger(u) && Number.isInteger(v) ? u - v : null; };
  const blank = () => ({ h: 0, job: 0, slots: 0, fall: 0, merges: [], completes: [], reopens: [] });
  const sum = blank();
  const byB = BUCKETS.map(([lo, hi]) => ({ live: hi === Infinity ? `${lo}+` : `${lo}-${hi}`, lo, hi, ...blank() }));
  for (const { r, s: x, e } of spans(sweeps, a, b)) {
    const f = fall(x, e);
    const at = (ev) => ev.filter((y) => y.at >= x && y.at < e);
    for (const o of [sum, byB.find((q) => r.live >= q.lo && r.live <= q.hi)].filter(Boolean)) {
      Object.assign(o, { h: o.h + (e - x) / 36e5, job: o.job + r.live * (e - x) / 36e5, slots: o.slots + rowCap(r) * (e - x) / 36e5, fall: f === null || o.fall === null ? null : o.fall + f });
      o.merges.push(...at(merges)); o.completes.push(...at(completes)); o.reopens.push(...at(reopens));
    }
  }
  const fig = (o) => ({
    hours: r2(o.h), cap_use: o.slots ? r2(o.job / o.slots) : 'unmeasured', velocity_per_h: o.h && o.fall !== null ? r2(o.fall / o.h) : 'unmeasured',
    merges_per_job_session_h: o.job ? r2(o.merges.length / o.job) : 'unmeasured',
    gate_runs_per_pr: o.merges.length && o.merges.every((m) => Array.isArray(m.runs)) ? r2(o.merges.reduce((t, m) => t + m.runs.length, 0) / o.merges.length) : 'unmeasured',
    false_done_share: o.completes.length ? r2(o.completes.filter((c) => c.refuted).length / o.completes.length) : 'unmeasured',
    reopened_marks: o.reopens.reduce((t, x) => t + x.marks, 0),
  });
  // The whole window: every event in it, swept or not, over the swept hours; syncs and reverts are whole only.
  return {
    ...fig({ ...sum, merges, completes, reopens }),
    cancels_per_pr: 'unmeasured (gate rows record no cancelled run)', syncs_per_pr: syncs === null || !merges.length ? 'unmeasured' : r2(syncs / merges.length),
    reverts: reverts ?? 'unmeasured', started_then_blocked: quick ?? 'unmeasured', idle_alarms: capUse(sweeps, from, to).idle_alarms,
    buckets: byB.filter((q) => q.h > 0).map((q) => ({ live: q.live, ...fig(q) })),
  };
}
// unmetAt for flowFigures: the unmet marks under the requirements and found directories at ref's last
// first-parent commit before the time (a job branch's own commits are not the tranche's) (one git grep per commit); null where the history cannot say.
export function unmetAtRef(root, cfg, ref) {
  const memo = new Map();
  return (iso) => {
    const c = git(['rev-list', '-1', '--first-parent', `--before=${iso}`, ref], { cwd: root, allowFail: true }).stdout.trim();
    if (!c) return null;
    if (!memo.has(c)) {
      const r = git(['grep', '-c', '-F', '*(not yet met', c, '--', cfg.requirements_dir, FOUND_DIR], { cwd: root, allowFail: true });
      memo.set(c, r.code === 0 ? r.stdout.split('\n').filter(Boolean).reduce((t, l) => t + Number(l.split(':').pop()), 0) : r.code === 1 ? 0 : null);
    }
    return memo.get(c);
  };
}
// Started then blocked within QUICK_BLOCK_MIN (coordinator, 5 Nov: jobs started without their
// providers ready): each `job start <id> (attempt` commit in the window on the module's job
// branches, and whether a `block <id>:` commit followed it within the minutes, before its next
// start. By module, those with one; unread, the modules whose branches were not read (the figure
// leaves them out); null when no job branch was read.
export const QUICK_BLOCK_MIN = 15;
export function quickBlocks(root, jobRefs, { from, to = now() } = {}) {
  if (!jobRefs) return null;
  const [a, b] = [Date.parse(from) || -Infinity, Date.parse(to)];
  let starts = 0;
  const by = [];
  const unread = new Set(jobRefs.unread || []);
  for (const [m] of jobRefs) {
    const ev = new Map();
    for (const ref of jobRefs.branches?.(m) || []) {
      const r = git(['-c', 'grep.patternType=basic', 'log', '--format=%H%x09%cI%x09%s', `--grep=^job start ${m} (attempt `, `--grep=^block ${m}: `, ref], { cwd: root, allowFail: true });
      if (r.code !== 0) unread.add(m);
      for (const l of r.code === 0 ? r.stdout.split('\n').filter(Boolean) : []) { const [sha, at, s] = l.split('\t'); ev.set(sha, { at: Date.parse(at), start: s.startsWith('job start') }); }
    }
    const xs = [...ev.values()].sort((p, q) => p.at - q.at);
    // The event after each start: a block within the minutes counts.
    const mine = xs.flatMap((x, i) => (x.start && x.at >= a && x.at <= b ? [xs[i + 1] && !xs[i + 1].start && xs[i + 1].at - x.at <= QUICK_BLOCK_MIN * 6e4] : []));
    starts += mine.length;
    const n = mine.filter(Boolean).length;
    if (n) by.push({ module: m, starts: mine.length, blocked: n });
  }
  const blocked = by.reduce((t, x) => t + x.blocked, 0);
  return { minutes: QUICK_BLOCK_MIN, starts, blocked, share: starts ? r2(blocked / starts) : 'unmeasured', by_module: by, unread: [...unread] };
}

// The commits on ref in [from, to] that job sync made ("Bring job/<id> up to") and that revert ("Revert").
export const countCommits = (root, ref, from, to, grep) => { const r = git(['log', '--format=%H', `--grep=${grep}`, ...(from ? [`--since=${from}`] : []), `--until=${to}`, ref], { cwd: root, allowFail: true }); return r.code === 0 ? r.stdout.split('\n').filter(Boolean).length : null; };

// ROOT's context per sweep (P2-G10), from the sweep rows: the addressed ROOT's (the last row's
// session) sweeps that carry root_context, and a linear estimate of the sweeps left before
// refreshAt: the mean rise per sweep from its first such sweep to its last, extended.
export const CONTEXT_RULE = 'sweeps left = (refresh_context - last context) / mean rise per sweep (last - first) / (sweeps - 1), rounded down; unmeasured with fewer than two sweeps or no rise';
export function rootContext(sweepRows, refreshAt = 60) {
  const rows = sweepRows.filter((x) => x.row === 'sweep' && typeof x.at === 'string');
  const session = rows.at(-1)?.session;
  const mine = rows.filter((r) => r.session === session && typeof r.root_context === 'number');
  if (!mine.length) return 'unmeasured';
  const last = mine.at(-1).root_context;
  const rise = mine.length > 1 ? (last - mine[0].root_context) / (mine.length - 1) : 0;
  return {
    session, refresh_context: refreshAt, rule: CONTEXT_RULE,
    sweeps: mine.map((r) => ({ at: r.at, context: r.root_context })),
    rise_per_sweep: Math.round(rise * 100) / 100,
    sweeps_left: rise > 0 ? Math.max(0, Math.floor((refreshAt - last) / rise)) : 'unmeasured',
  };
}

// One measured BOB wake (P3-A1, SES-16): its session's tokens and cost and whether it ran as a
// fresh stateless session or the resident BOB, in a file of BOB's own; report sets them side by side.
export const WAKES_FILE = `${METRICS_DIR}/wakes.bob.jsonl`;
export const WAKE_MODES = ['stateless', 'resident'];
export function recordWake(root, { session, tokens, usd, mode } = {}) {
  if (typeof session !== 'string' || !/^session_[A-Za-z0-9]+$/.test(session)) fail('a wake needs --session <the woken session\'s id> (session_...)');
  if (!WAKE_MODES.includes(mode)) fail(`a wake needs --mode ${WAKE_MODES.join('|')}`);
  const t = Number(tokens);
  const c = Number(usd);
  if (tokens === undefined || tokens === true || !Number.isInteger(t) || t < 0) fail('a wake needs --tokens <n>, from its session record');
  if (usd === undefined || usd === true || !Number.isFinite(c) || c < 0) fail('a wake needs --usd <x>, from its session record');
  return appendRow(root, null, { row: 'wake', session, mode, tokens: t, cost_usd: c }, WAKES_FILE);
}
export function wakes(rows) {
  const out = {};
  for (const mode of WAKE_MODES) {
    const w = rows.filter((r) => r.row === 'wake' && r.mode === mode);
    const mean = (k) => Math.round(w.reduce((s, r) => s + Number(r[k]), 0) / w.length * 1e4) / 1e4;
    out[mode] = w.length ? { wakes: w.length, mean_tokens: mean('tokens'), mean_usd: mean('cost_usd'), rows: w.map((r) => ({ at: r.at, session: r.session, tokens: r.tokens, cost_usd: r.cost_usd })) } : 'unmeasured';
  }
  return out;
}

// module -> layer, from the layer map (layers_file): table rows whose first cell is the layer's
// number and whose last cell lists its modules.
export function layerOf(map) {
  const out = new Map();
  for (const c of (map || '').split('\n').map((l) => l.trim().replace(/^\||\|$/g, '').split('|').map((x) => x.trim()))) {
    if (c.length > 1 && /^\d+$/.test(c[0])) for (const m of c.at(-1).replace(/[`*]/g, '').split(',').map((x) => x.trim()).filter(Boolean)) out.set(m, Number(c[0]));
  }
  return out;
}

export const SHARE_RULE = "A job's overhead is the cost of its non-job rows (its reviews) plus an even split of each BOB or ROOT row's cost (the session's cost since that session's previous row) among the jobs with an attempt row since that role's previous row; its share is overhead over its own job cost plus overhead, and a layer's is the same summed over its jobs.";
export const SCOPE_RULE = " Only this tranche counts: its jobs are the modules with a start row since its opening (at the tranche or on their job branches), each job's cost its own job rows since then (a BOB row naming a module is still overhead), and only BOB's and ROOT's cost since the opening is split. A part with no row reads unmeasured, and an overhead with every part unmeasured reads unmeasured, never $0.";
const PROCESS = new Set(['bob', 'root']);
const usd = (x) => Math.round(x * 1e4) / 1e4;

// The process overhead share per job and per layer (Build Plan, Phase 2: measured, no target).
// A part with no row is "unmeasured"; a share is "unmeasured" when its job's own cost is, and
// otherwise counts the measured parts only, naming the rest. A BOB session that ends without a
// row loses its cost since its last row: the share then reads low, and the record cannot tell.
// opened (the tranche's opening, lead.mjs openedAt) scopes it to this tranche's attempts, as lead
// times are: its jobs are the modules with a start row since the opening, at ref or on their job
// branches (jobRows), and only the BOB and ROOT cost since the opening is split (a row before it
