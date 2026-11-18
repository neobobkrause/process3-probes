// ===== file: metrics.mjs (continued) =====

// sweep read job/inquiry, attempt 5's R31 block of 6 Nov, after attempt 6 landed COMPLETE).
const haveRef = (root, ref) => git(['rev-parse', '-q', '--verify', ref], { cwd: root, allowFail: true }).code === 0;
export const jobBranchAt = (root, id, heads, ids, prefix = 'refs/remotes/origin/') => jobBranch(id, heads, ids, (h) => !haveRef(root, `${prefix}${h}`) || startBranch(rowsAt(root, `${prefix}${h}`, id), id) === h);

export const nextAttempt = (root, id) => readRows(root, id).filter((r) => r.row === 'attempt' && r.event === 'start').length + 1;

const DAY = 86400000;

// Is a merged pull request still in place: its merge commit on the branch and never reverted?
// --is-ancestor exits 1 for "not on the branch"; any other exit (128: the commit is not in a
// shallow clone's history) is unmeasured, never "reverted" (defect sweep 4 Nov).
export function survival(root, merge, branch, today = Date.now()) {
  if (!merge?.merge_sha) return { state: 'not merged' };
  const due = new Date(Date.parse(merge.merged_at) + 14 * DAY).toISOString().slice(0, 10);
  const anc = git(['merge-base', '--is-ancestor', merge.merge_sha, branch], { cwd: root, allowFail: true }).code;
  if (anc !== 0 && anc !== 1) return { state: 'unmeasured', due };
  const on = anc === 0;
  const reverts = git(['log', '--format=%H', `--grep=${merge.merge_sha}`, branch], { cwd: root, allowFail: true }).stdout.trim();
  if (!on || reverts) return { state: 'reverted', due };
  return { state: today >= Date.parse(merge.merged_at) + 14 * DAY ? 'survived' : 'pending', due };
}

// BOB's idle time, per UTC day, from the sweep rows (SWEEP_ROWS_FILE on the state branch): the
// sweeps that found acts listed for BOB, and the longest BOB had been quiet at one of them.
export function idleByDay(sweepRows) {
  const rows = sweepRows.filter((x) => x.row === 'sweep' && typeof x.at === 'string');
  if (!rows.length) return 'unmeasured';
  const days = new Map();
  for (const r of rows) {
    const day = r.at.slice(0, 10);
    const d = days.get(day) || { day, occurrences: 0, longest_quiet_h: 0, unmeasured_sweeps: 0 };
    if (r.bob_acts === true) { d.occurrences++; d.longest_quiet_h = Math.max(d.longest_quiet_h, Number(r.bob_quiet_h) || 0); }
    else if (r.bob_acts !== false) d.unmeasured_sweeps++; // no BOB addressed, or a paused plan
    days.set(day, d);
  }
  return [...days.values()].sort((a, b) => a.day.localeCompare(b.day));
}

// Cap use (the coordinator's measurement, 5 Nov 00:50: about 48% over a day, unseen): job session-hours over cap session-hours from
// `from` to `to`, each sweep row's live and job_cap held until the next row (at most 2 h). A diagnostic, not a
// target (audit of PR 139); with the idle stretches that alarmed IDLE CAPACITY and the longest idle.
const SPAN_H = 2;
const spans = (sweepRows, a, b) => {
  const rows = sweepRows.filter((r) => r.row === 'sweep' && Date.parse(r.at) && Number.isInteger(r.live) && rowCap(r) > 0).sort((x, y) => Date.parse(x.at) - Date.parse(y.at));
  // A row holds until the next, at most SPAN_H hours: a sweep that stopped counts no hours after.
  return rows.map((r, i) => ({ r, s: Math.max(a, Date.parse(r.at)), e: Math.min(b, Date.parse(rows[i + 1]?.at) || b, Date.parse(r.at) + SPAN_H * 36e5) })).filter((x) => x.e > x.s);
};
export function capUse(sweepRows, from, to = now()) {
  const [a, b] = [Date.parse(from) || -Infinity, Date.parse(to)];
  let job = 0, slots = 0;
  for (const { r, s: x, e } of spans(sweepRows, a, b)) { job += r.live * (e - x); slots += rowCap(r) * (e - x); }
  const alarms = sweepRows.filter((r) => r.idle_capacity?.alarm && Date.parse(r.at) >= a && Date.parse(r.at) <= b);
  // One per idle stretch (its idle_capacity.since), however many sweep or tool-run check rows alarmed in it.
  return { from: from || 'the first sweep row', to, job_session_h: Math.round(job / 36e4) / 10, cap_session_h: Math.round(slots / 36e4) / 10, use: slots ? Math.round(job / slots * 1000) / 1000 : 'unmeasured', idle_alarms: new Set(alarms.map((r) => r.idle_capacity.since ?? r.at)).size, idle_longest_min: alarms.length ? Math.max(...alarms.map((r) => r.idle_capacity.min)) : 0 };
}

// The flow figures (audit of PR 139: cap use beside velocity, efficiency and quality, so a knee shows).
export const FLOW_RULE = 'cap use, job session-hours over cap session-hours (a diagnostic, no target); velocity, unmet R and F marks closed per calendar hour net of marks added unmet (the fall in the unmet count at the tranche; a mark added already met, as a split adds it, never counts); efficiency, merges per job session-hour, and gate runs, cancels and job syncs per merged PR; quality, the false-done share (complete claims a red gate run of the attempt refuted), the marks reopen starts named, and reverts. Per concurrency bucket, every figure with a time (job syncs and reverts whole only); each sweep row\'s live count held until the next row, at most 2 hours.';
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
// still marks its session's cost so far). Without an opening, every row counts.
export function overhead(rows, layers = new Map(), { opened = null, jobRows = [] } = {}) {
  rows = distinctRows([...rows, ...jobRows]).filter((r) => typeof r.at === 'string');
  const inT = (r) => !opened || Date.parse(r.at) >= Date.parse(opened);
  const measured = rows.filter((r) => r.row === 'attempt' && r.event === 'measured');
  const role = (r) => r.role || 'job';
  // Each cost row is its module's: a job's own cost is its job rows', whatever BOB rows name it.
  const activity = rows.filter((r) => r.row === 'attempt' && r.module && inT(r) && !(r.event === 'measured' && role(r) !== 'job'));
  const started = new Set(activity.filter((r) => r.event === 'start').map((r) => r.module));
  const mods = [...new Set(activity.map((r) => r.module))].filter((m) => !opened || started.has(m)).sort();
  // A job active in a window no row of that role closes (after its last row, or ended by a row
  // with no cost) has that part unmeasured.
  const parts = new Map(mods.map((m) => [m, { bob: 0, root: 0, gap: new Set() }]));
  let unattributed = 0;
  for (const who of PROCESS) {
    const mine = measured.filter((r) => role(r) === who).sort((a, b) => a.at.localeCompare(b.at));
    let prevAt = opened || '';
    const lastCost = new Map();
    const skipped = new Set();
    const since = (from, to) => [...new Set(activity.filter((a) => a.at > from && (to === null || a.at <= to) && parts.has(a.module)).map((a) => a.module))];
    for (const r of mine) {
      const c = Number(r.cost_usd);
      // Before the opening: the session's cost so far, not split.
      if (!inT(r)) {
        if (r.session && Number.isFinite(c)) { lastCost.set(r.session, c); skipped.delete(r.session); } else if (r.session) skipped.add(r.session);
        continue;
      }
      const open = since(prevAt, r.at);
      if (Number.isFinite(c) && r.session && !skipped.has(r.session)) {
        const delta = Math.max(0, c - (lastCost.get(r.session) ?? 0));
        lastCost.set(r.session, c);
        if (open.length) for (const m of open) parts.get(m)[who] += delta / open.length;
        else unattributed += delta;
      } else {
        // A row with no cost: its window's jobs are unmeasured, and so are the next priced row's,
        // whose cost spans both windows; that cost is counted unattributed.
        for (const m of open) parts.get(m).gap.add(who);
        if (r.session && !Number.isFinite(c)) skipped.add(r.session);
        else if (r.session) { unattributed += Math.max(0, c - (lastCost.get(r.session) ?? 0)); lastCost.set(r.session, c); skipped.delete(r.session); }
      }
      prevAt = r.at;
    }
    for (const m of since(prevAt, null)) parts.get(m).gap.add(who);
  }
  const has = (who) => measured.some((r) => inT(r) && role(r) === who && r.session && Number.isFinite(Number(r.cost_usd)));
  const sum = (rs) => (rs.length && rs.every((r) => Number.isFinite(Number(r.cost_usd))) ? rs.reduce((s, r) => s + Number(r.cost_usd), 0) : 'unmeasured');
  const jobs = mods.map((m) => {
    const own = measured.filter((r) => r.module === m && inT(r));
    // An unmeasured job row stands only while its attempt has no priced one (a merge run again with
    // the cost the first run lacked: review of PR 106).
    // A job row of 0 is a delta not read (get_session's usage not moved: queue's attempt 2 on the
    // copy, 4 Nov), as costDelta now records it: unmeasured, never 0.
    const jobOwn = own.filter((r) => role(r) === 'job').map((r) => (r.cost_usd !== undefined && r.cost_usd !== null && Number(r.cost_usd) === 0 ? { ...r, cost_usd: 'unmeasured' } : r));
    const pricedAt = new Set(jobOwn.filter((r) => Number.isFinite(Number(r.cost_usd))).map((r) => r.attempt));
    const job = sum(jobOwn.filter((r) => Number.isFinite(Number(r.cost_usd)) || !pricedAt.has(r.attempt)));
    // Reviews: the module's rows of any role but job, BOB and ROOT (their cost is split below).
    const reviews = sum(own.filter((r) => role(r) !== 'job' && !PROCESS.has(role(r))));
    const part = (who) => (has(who) && !parts.get(m).gap.has(who) ? usd(parts.get(m)[who]) : 'unmeasured');
    const p = { reviews_usd: reviews, bob_usd: part('bob'), root_usd: part('root'), gate_usd: 'unmeasured' };
    // The overhead sums the measured parts; with none measured it is unmeasured, never 0.
    const priced = Object.values(p).filter((v) => typeof v === 'number');
    const over = priced.length ? usd(priced.reduce((s, v) => s + v, 0)) : 'unmeasured';
    const unmeasured = Object.keys(p).filter((k) => p[k] === 'unmeasured').map((k) => k.replace(/_usd$/, ''));
    return { module: m, layer: layers.get(m) ?? null, job_usd: typeof job === 'number' ? usd(job) : job, ...p, overhead_usd: over, share: typeof job === 'number' && typeof over === 'number' && job + over > 0 ? usd(over / (job + over)) : 'unmeasured', unmeasured };
  });
  const byLayer = new Map();
  for (const j of jobs.filter((x) => x.layer !== null)) byLayer.set(j.layer, [...(byLayer.get(j.layer) || []), j]);
  const layerRows = [...byLayer].sort((a, b) => a[0] - b[0]).map(([layer, js]) => {
    const ok = js.every((j) => typeof j.share === 'number');
    const priced = js.filter((j) => typeof j.overhead_usd === 'number');
    const over = priced.reduce((s, j) => s + j.overhead_usd, 0);
    const total = ok ? js.reduce((s, j) => s + j.job_usd, 0) + over : 0;
    return { layer, jobs: js.map((j) => j.module), overhead_usd: priced.length ? usd(over) : 'unmeasured', share: ok && total > 0 ? usd(over / total) : 'unmeasured', unmeasured: [...new Set(js.flatMap((j) => (typeof j.share === 'number' ? j.unmeasured : [`${j.module} job`])))] };
  });
  return { rule: SHARE_RULE + SCOPE_RULE, scope: opened ? { opened } : 'every row (the opening not read)', jobs, layers: layerRows, unattributed_usd: has('bob') || has('root') ? usd(unattributed) : 'unmeasured' };
}

// The two health metrics and the figures that explain them, from rows and pull requests.
// sweepRows: the state branch's sweep rows; layers: the layer map's text (layers_file).
// Rows and history are read at the same ref (branch), as report tranche reads them (rowsAt).
export function report(root, slug, branch, { read = { comments, getPR }, sweepRows = [], layers = null, refreshAt = 60, cfg = DEFAULTS, lead = {}, roles = new Map() } = {}) {
  const rows = rowsAt(root, branch);
  const opened = openedAt(lead.grants, cfg);
  const completes = rows.filter((r) => r.row === 'attempt' && r.event === 'complete');
  const merges = [...new Map(rows.filter((r) => r.row === 'merge').map((r) => [String(r.pr), r])).values()]; // each PR once (copy, 4 Nov: PR 60's merge recorded twice)
  const measured = rows.filter((r) => r.row === 'attempt' && r.event === 'measured');
  let refutedN = 0;
  let gateMinutes = 0;
  const gates = [];
  for (const c of completes) {
    if (!c.pr) continue;
    let all = [];
    try { all = read.comments(slug, c.pr) || []; } catch { all = []; }
    const runs = gateRuns(all);
    gates.push({ pr: c.pr, runs: runs.length });
    gateMinutes += runs.reduce((s, r) => s + (r.minutes || 0), 0);
    if (refuted(runs, c.attempt)) refutedN++;
  }
  const cost = measured.reduce((s, r) => s + (Number(r.cost_usd) || 0), 0);
  const tokens = measured.some((r) => typeof r.tokens === 'number') ? measured.reduce((s, r) => s + (Number(r.tokens) || 0), 0) : 'unmeasured';
  const surv = merges.map((m) => {
    let pr = null;
    try { pr = read.getPR(slug, m.pr); } catch { pr = null; }
    const merged = pr?.merged_at ? { merge_sha: pr.merge_commit_sha, merged_at: pr.merged_at } : null;
    return { module: m.module, pr: m.pr, ...survival(root, merged, branch) };
  });
  const surviving = surv.filter((s) => s.state === 'survived').length;
  return {
    complete_claims: completes.length,
    refuted: refutedN,
    false_done_rate: completes.length ? refutedN / completes.length : null,
    cost_usd: cost,
    tokens,
    surviving_prs: surviving,
    cost_per_surviving_pr: surviving ? cost / surviving : `pending: ${surv.map((s) => `PR ${s.pr} ${s.state}${s.due ? ` (read on ${s.due})` : ''}`).join(', ') || 'no merges'}`,
    gate_minutes: Math.round(gateMinutes * 100) / 100,
    gates,
    denials: measured.reduce((s, r) => s + (Number(r.denials) || 0), 0),
    refusals: refusalList(rows, new Map([...sessionRoles(rows), ...roles])),
    refusals_by_session: refusalCounts(rows),
    declines: measured.flatMap((r) => r.declines || []),
    bob_idle_by_day: idleByDay(sweepRows),
    flow: flowFigures({ sweeps: sweepRows, rows, unmetAt: unmetAtRef(root, cfg, branch), gates: (pr) => gateRuns(read.comments(slug, pr) || []), syncs: countCommits(root, branch, opened, now(), '^Bring job/'), reverts: countCommits(root, branch, opened, now(), '^Revert'), quick: quickBlocks(root, lead.jobRefs, { from: opened }), from: opened }),
    root_context: rootContext(sweepRows, refreshAt),
    wakes: wakes(rows),
    overhead: overhead(rows, layerOf(layers), { opened, jobRows: lead.jobRows || [] }),
    lead_times: leadTimes(root, cfg, { ref: branch, rows, layers: layerOf(layers), sweeps: sweepRows, ...lead, comments: (pr) => gateRuns(read.comments(slug, pr) || []) }),
  };
}

// ===== file: triggers.test.mjs =====

// Review triggers (Bob, 4 Nov, about 19:05): a security path changed, or a test deleted or
// loosened, makes a job's merge refuse --no-review; every merge row records what fired and what the
// review found. Run end to end: a real repository and origin, merge() and review brief as BOB runs them.
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { BOT, GATE, RECEIPT, block } from '../lib/github.mjs';
import { merge, reviewMeasures, reviewRounds } from '../lib/merge.mjs';
import { readRows } from '../lib/metrics.mjs';
import { reviewBrief } from '../lib/review.mjs';
import { assertCounts, globRe, matchPath, reviewTriggers, triggerSummary } from '../lib/triggers.mjs';
import { git } from '../lib/util.mjs';
import { commit, entry, makeRepo } from './helpers.mjs';

const quiet = () => {};
const TEST_BASE = "import assert from 'node:assert/strict';\ntest('a', () => {\n  assert.equal(f(), 45);\n  assert.ok(g());\n});\n";

// A product whose tranche holds module alpha with a test and a security list; the job branch
// changes them as `job` says. config: the tranche's process/config.json.
function setup(job, config = { review_triggers: { security_paths: ['src/alpha/acts.mjs', 'src/gate/**'] } }) {
  const root = makeRepo({
    'process/ledger/alpha.json': entry('alpha'),
    'process/config.json': config,
    'src/alpha/a.mjs': 'export const f = () => 45;\n',
    'src/alpha/acts.mjs': 'export const ACTS = ["a", "b"];\n',
    'test/alpha/a.test.mjs': TEST_BASE,
    'test/alpha/b.test.mjs': TEST_BASE,
  });
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['checkout', '-q', '-b', 'job/alpha'], { cwd: root });
  job(root);
  const head = commit(root, { 'process/metrics/alpha.jsonl': JSON.stringify({ row: 'attempt', event: 'complete', at: new Date().toISOString() }) + '\n' });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  commit(root, { 'other.txt': 'tranche moved on' });
  git(['push', '-q', 'origin', 'tranche', 'job/alpha', 'main'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  return { root, head };
}

function io(head) {
  const calls = { merged: null };
  return {
    calls,
    io: {
      getPR: () => ({ state: 'open', draft: false, user: { login: 'civicsmith' }, base: { ref: 'tranche' }, head: { ref: 'job/alpha', sha: head } }),
      comments: () => [
        { id: 1, body: block(RECEIPT, { module: 'alpha', attempt: 1, sha: head }), user: { login: 'civicsmith' } },
        { id: 2, body: block(GATE, { runs: [{ sha: head, ok: true, receipt: 'agrees', receipt_attempt: 1, run_id: 11 }] }), user: { login: BOT } },
      ],
      checkRun: () => ({ status: 'completed', conclusion: 'success', html_url: 'run' }),
      verify: (slug, r) => r.run_id === 11,
      mergePR: (slug, n, sha) => { calls.merged = sha; return { merged: true, sha: 'm'.repeat(40) }; },
    },
  };
}

const lastRow = (root) => {
  const tip = git(['ls-remote', 'origin', 'refs/heads/job/alpha'], { cwd: root }).split('\t')[0];
  git(['checkout', '-q', tip], { cwd: root });
  const r = readRows(root, 'alpha').at(-1);
  git(['checkout', '-q', 'main'], { cwd: root });
  return r;
};
const del = (f) => (root) => git(['rm', '-q', f], { cwd: root });
const reviewed = { reviewed: 'fresh reviewer: 1 fix, applied', rounds: 2, reviewMinutes: '12', reviewCostUsd: '0.84', findings: '1', actedOn: '1' };

test('a job that deletes a test file (PR 174) is refused --no-review, and merges --reviewed with the trigger and measures in its row', () => {
  const { root, head } = setup(del('test/alpha/b.test.mjs'));
  const f = io(head);
  assert.throws(() => merge(root, 5, { slug: 'o/r', io: f.io, noReview: 'small change', log: quiet }),
    /pull request 5 fires the review trigger test \(test files deleted: test\/alpha\/b\.test\.mjs\): --no-review is refused .*review brief 5/);
  assert.equal(f.calls.merged, null, 'nothing merged');
  assert.equal(git(['ls-remote', 'origin', 'refs/heads/job/alpha'], { cwd: root }).split('\t')[0], head, 'nothing pushed');
  const r = merge(root, 5, { slug: 'o/r', io: f.io, ...reviewed, log: quiet });
  assert.equal(r.merged, true);
  const row = lastRow(root);
  assert.deepEqual({ triggers: row.triggers, reviewed: row.reviewed, m: row.review_minutes, usd: row.review_usd, f: row.findings, a: row.findings_acted },
    { triggers: ['test'], reviewed: true, m: 12, usd: 0.84, f: 1, a: 1 });
});

test('a job that changes a listed security path (PR 95) is refused --no-review; a change to neither merges --no-review with triggers []', () => {
  const sec = setup((root) => commit(root, { 'src/alpha/acts.mjs': 'export const ACTS = ["a"];\n' }));
  assert.throws(() => merge(sec.root, 6, { slug: 'o/r', io: io(sec.head).io, noReview: 'x', log: quiet }), /fires the review trigger security \(security paths changed: src\/alpha\/acts\.mjs\)/);
  const plain = setup((root) => commit(root, { 'src/alpha/a.mjs': 'export const f = () => 46;\n', 'test/alpha/a.test.mjs': TEST_BASE.replace('45', '46') }));
  assert.equal(merge(plain.root, 7, { slug: 'o/r', io: io(plain.head).io, noReview: 'one constant and its test', log: quiet }).merged, true);
  const row = lastRow(plain.root);
  assert.deepEqual([row.triggers, row.reviewed, row.review_minutes, row.findings], [[], false, null, null]);
});

test('a test that existed at the base losing assertions fires; one changed in place or gaining them does not; a product with no security paths fires none for them', () => {
  const loose = setup((root) => commit(root, { 'test/alpha/a.test.mjs': TEST_BASE.replace('  assert.ok(g());\n', '') }));
  assert.throws(() => merge(loose.root, 8, { slug: 'o/r', io: io(loose.head).io, noReview: 'x', log: quiet }), /test\/alpha\/a\.test\.mjs: 1 hunk removing assertions and adding none/);
  const t = reviewTriggers(loose.root, { base: 'origin/tranche', head: 'origin/job/alpha', entry: entry('alpha'), cfg: {} });
  assert.deepEqual(t.fired, ['test']);
  assert.match(t.hunks, /^-  assert\.ok\(g\(\)\);$/m, 'the exact hunk that fired it');
  const none = setup((root) => commit(root, { 'src/alpha/acts.mjs': 'export const ACTS = [];\n', 'test/alpha/a.test.mjs': TEST_BASE.replace('45', '40') + "test('b', () => { expect(h()).toBe(1); });\n" }), {});
  const n = reviewTriggers(none.root, { base: 'origin/tranche', head: 'origin/job/alpha', entry: entry('alpha'), cfg: { review_triggers: {} } });
  assert.deepEqual([n.fired, n.security_set], [[], false]);
  // A hunk that replaces an assertion with another does not fire; an added skip does.
  const swap = setup((root) => commit(root, { 'test/alpha/a.test.mjs': TEST_BASE.replace('  assert.ok(g());\n', '  assert.equal(g(), true);\n') }));
  assert.deepEqual(reviewTriggers(swap.root, { base: 'origin/tranche', head: 'origin/job/alpha', entry: entry('alpha'), cfg: {} }).fired, []);
  const skip = setup((root) => commit(root, { 'test/alpha/a.test.mjs': TEST_BASE.replace("test('a'", "test.skip('a'") }));
  const k = reviewTriggers(skip.root, { base: 'origin/tranche', head: 'origin/job/alpha', entry: entry('alpha'), cfg: {} });
  assert.deepEqual([k.fired, k.why], [['test'], 'test/alpha/a.test.mjs: 1 skip added']);
});

test('a path git would quote (non-ASCII) still fires both triggers (review of PR 125)', () => {
  const { root } = setup((root) => { commit(root, { 'src/gate/café.mjs': 'x\n', 'test/alpha/é.test.mjs': TEST_BASE }); }, { review_triggers: { security_paths: ['src/gate/**'] } });
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  git(['rm', '-q', 'test/alpha/é.test.mjs'], { cwd: root });
  commit(root, { 'src/gate/café.mjs': 'y\n' });
  const t = reviewTriggers(root, { base: 'HEAD~2', head: 'HEAD', entry: entry('alpha'), cfg: { review_triggers: { security_paths: ['src/gate/**'] } } });
  git(['checkout', '-q', 'main'], { cwd: root });
  assert.deepEqual([t.fired, t.security, t.deleted], [['security', 'test'], ['src/gate/café.mjs'], ['test/alpha/é.test.mjs']]);
});

test('review brief for a triggered job carries the trigger and its exact hunks, read from the clone', () => {
  const { root } = setup((root) => commit(root, { 'src/alpha/acts.mjs': 'export const ACTS = ["a"];\n' }));
  const pr = { number: 9, title: 'alpha', base: { ref: 'tranche' }, head: { ref: 'job/alpha', sha: 'h'.repeat(40) }, user: { login: 'job' } };
  const text = reviewBrief(root, '9', { log: quiet, io: { slug: 'o/r', read: () => pr, files: () => ['src/alpha/acts.mjs'], contents: (s, p) => (p.endsWith('.json') ? entry('alpha') : '- **R1** x\n'), notes: () => [], tracked: () => false } });
  assert.match(text, /## Review triggers\nFired: security\. security paths changed: src\/alpha\/acts\.mjs\./);
  assert.match(text, /```diff\n[\s\S]*-export const ACTS = \["a", "b"\];\n\+export const ACTS = \["a"\];[\s\S]*```/);
});

test('--no-review may not cite Q38 and needs a reason; --reviewed needs its measures, --no-review takes none', () => {
  assert.throws(() => reviewRounds({ noReview: 'Q38' }), /may not cite Q38: Q38 has no source/);
  assert.throws(() => reviewRounds({ noReview: 'per q38, product PRs' }), /Q38/);
  assert.throws(() => reviewRounds({ noReview: '  ' }), /--no-review needs why/);
  assert.deepEqual(reviewRounds({ noReview: 'a docs-only change' }), { rounds: 0, decision: null });
  assert.throws(() => reviewMeasures({ reviewed: 'x', findings: 0, actedOn: 0 }), /--review-minutes/);
  assert.throws(() => reviewMeasures({ reviewed: 'x', reviewMinutes: 3, actedOn: 0 }), /--findings <n>/);
  assert.throws(() => reviewMeasures({ reviewed: 'x', reviewMinutes: 3, findings: 1, actedOn: 2 }), /more than --findings/);
  assert.throws(() => reviewMeasures({ reviewed: 'x', reviewMinutes: 3, findings: 1, actedOn: 0, reviewCostUsd: '0' }), /above 0/);
  assert.deepEqual(reviewMeasures({ reviewed: 'x', reviewMinutes: '3', findings: '2', actedOn: '0' }), { review_minutes: 3, review_usd: 'unmeasured', findings: 2, findings_acted: 0 });
  assert.throws(() => reviewMeasures({ noReview: 'x', findings: 0 }), /drop --findings/);
  // An empty value is not 0 (review of PR 125).
  assert.throws(() => reviewMeasures({ reviewed: 'x', reviewMinutes: '', findings: 0, actedOn: 0 }), /--review-minutes/);
  assert.throws(() => reviewMeasures({ reviewed: 'x', reviewMinutes: 3, findings: ' ', actedOn: 0 }), /--findings <n>/);
  assert.throws(() => reviewRounds({ noReview: 'Q-38' }), /Q38/);
});

test('globs and assertion counts: ** any depth, * one name, a bare path a file or directory; comments are not assertions', () => {
  assert.equal(globRe('src/a'), null);
  assert.ok(matchPath('src/gate/x/y.mjs', 'src/gate/**') && matchPath('src/gate/y.mjs', 'src/**/y.mjs') && matchPath('src/a/b.mjs', 'src/a/'));
  assert.ok(!matchPath('src/gatex/y.mjs', 'src/gate/**') && !matchPath('src/a/b/c.mjs', 'src/a/*.mjs') && matchPath('src/a/c.mjs', './src/a/*.mjs'));
  assert.deepEqual(assertCounts('--- a/x\n+++ b/x\n@@ -1 +1 @@\n-  assert.equal(a, 1);\n-  // assert.ok(x)\n+  t.equal(a, 1);\n+  expect(b).toBe(2);\n@@ -9 +9 @@\n-  t.ok(c)\n+  it.only(\'x\', f)\n'), { removed: 2, added: 2, skips: 1, bare: 1 });
});

test('the report line: merged, triggered by kind and share, reviews, findings, minutes and cost', () => {
  const s = triggerSummary([
    { pr: 1, triggers: ['test'], reviewed: true, review_minutes: 10, review_usd: 0.5, findings: 2, findings_acted: 1 },
    { pr: 2, triggers: ['security', 'test'], reviewed: true, review_minutes: 20, review_usd: 'unmeasured', findings: 0, findings_acted: 0 },
    { pr: 3, triggers: [], reviewed: false },
    { pr: 4, triggers: [], reviewed: false },
    { pr: 5, reviewed: false },
  ]);
  assert.equal(s.line, 'review triggers: 5 job PRs merged (1 before triggers were recorded); triggered 2 of 4 (50%): security 1, test 2; reviews run 2; findings per review 1; findings acted on 1; added minutes to merge median 15, worst 20; review cost $0.50 (1 unmeasured)');
  assert.match(triggerSummary([]).line, /0 job PRs merged; triggered 0 of 0: .*median unmeasured, worst unmeasured; review cost unmeasured$/);
});

// ===== file: review-trigger-fixes.test.mjs =====

// The review-trigger day-1 study on the copy (4 Nov 19:35 to 5 Nov 19:00; 80 job merges, 7 triggered):
// (2) every merge row read review_usd "unmeasured";
// (4) PR 173's row, prepared under an older pin, carried no triggers key.
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { BOT, GATE, RECEIPT, block } from '../lib/github.mjs';
import { merge, reviewCostOf } from '../lib/merge.mjs';
import { triggerSummary } from '../lib/triggers.mjs';
import { git } from '../lib/util.mjs';
import { commit, entry, makeRepo } from './helpers.mjs';

const quiet = () => {};
const SIGNIN = [
  '// Sign-in for the agent worker.',
  'export function signIn(user) {',
  '  /* the session is short-lived */',
  '  const ttl = 3600; // seconds',
  '  return { user, ttl };',
  '}',
  '',
].join('\n');
const CFG = { review_triggers: { security_paths: ['agent-worker/src/**', 'src/alpha/acts.mjs', 'src/alpha/rules.txt'] } };
const START = '2026-11-05T08:00:00Z';

// A product whose tranche holds module alpha and a security file; the job branch changes them as
// `job` says. rows: the job's metrics rows at its head (a start and a complete by default).
function setup(job, { rows = null } = {}) {
  const root = makeRepo({
    'process/ledger/alpha.json': entry('alpha', { paths: ['src/alpha/', 'agent-worker/src/'] }),
    'process/config.json': CFG,
    'src/alpha/a.mjs': 'export const f = () => 45;\n',
    'src/alpha/acts.mjs': 'export const ACTS = ["a", "b"];\n',
    'src/alpha/rules.txt': 'allow a\n# allow b\n',
    'agent-worker/src/signin.mjs': SIGNIN,
    'test/alpha/a.test.mjs': "test('a', () => { assert.equal(f(), 45); });\n",
  });
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['checkout', '-q', '-b', 'job/alpha'], { cwd: root });
  job(root);
  const r = rows || [{ row: 'attempt', event: 'start', attempt: 1, at: START }, { row: 'attempt', event: 'complete', attempt: 1, at: new Date().toISOString() }];
  const head = commit(root, { 'process/metrics/alpha.jsonl': r.map((x) => JSON.stringify(x)).join('\n') + '\n' });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  commit(root, { 'other.txt': 'tranche moved on' });
  git(['push', '-q', 'origin', 'tranche', 'job/alpha', 'main'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  return { root, head };
}
function io(head) {
  return {
    getPR: () => ({ state: 'open', draft: false, user: { login: 'civicsmith' }, base: { ref: 'tranche' }, head: { ref: 'job/alpha', sha: head } }),
    comments: () => [
      { id: 1, body: block(RECEIPT, { module: 'alpha', attempt: 1, sha: head }), user: { login: 'civicsmith' } },
      { id: 2, body: block(GATE, { runs: [{ sha: head, ok: true, receipt: 'agrees', receipt_attempt: 1, run_id: 11 }] }), user: { login: BOT } },
    ],
    checkRun: () => ({ status: 'completed', conclusion: 'success', html_url: 'run' }),
    verify: (slug, r) => r.run_id === 11,
    mergePR: () => ({ merged: true, sha: 'm'.repeat(40) }),
  };
}
const originRows = (root) => {
  const tip = git(['ls-remote', 'origin', 'refs/heads/job/alpha'], { cwd: root }).split('\t')[0];
  return git(['show', `${tip}:process/metrics/alpha.jsonl`], { cwd: root }).split('\n').filter(Boolean).map((l) => JSON.parse(l));
};
const reviewed = { reviewed: 'fresh reviewer: no findings', rounds: 1, reviewMinutes: '9', findings: '0', actedOn: '0' };

test('(2) the review cost is read onto the merge row from the --role review rows since the attempt started, a named session, or the session record', () => {
  const s = setup((r) => commit(r, { 'src/alpha/acts.mjs': 'export const ACTS = ["a"];\n' }));
  mkdirSync(join(s.root, 'process/metrics'), { recursive: true });
  const bob = (rows) => writeFileSync(join(s.root, 'process/metrics/alpha.bob.jsonl'), rows.map((x) => JSON.stringify({ row: 'attempt', event: 'measured', module: 'alpha', ...x })).join('\n') + '\n');
  // An earlier attempt's review, a job row and a BOB row are not this review's.
  bob([
    { at: '2026-11-04T08:00:00Z', role: 'review', session: 'session_old', cost_usd: 9 },
    { at: '2026-11-05T09:00:00Z', role: 'review', session: 'session_r1', cost_usd: 0.61 },
    { at: '2026-11-05T09:30:00Z', role: 'review', session: 'session_r2', cost_usd: 0.23 },
    { at: '2026-11-05T09:40:00Z', role: 'bob', session: 'session_bob', cost_usd: 5 },
    { at: '2026-11-05T09:45:00Z', role: 'review', session: 'session_r3', cost_usd: 'unmeasured' },
  ]);
  const cfg = { tranche: 'tranche' };
  assert.deepEqual(reviewCostOf(s.root, cfg, 'alpha', { since: START }), { usd: 0.84, from: '2 --role review rows (session_r1, session_r2)' });
  assert.deepEqual(reviewCostOf(s.root, cfg, 'alpha', { sessions: 'cse_r2' }), { usd: 0.23, from: '1 --role review row (session_r2)' });
  assert.equal(reviewCostOf(s.root, cfg, 'alpha', { sessions: ['session_none'] }).usd, 'unmeasured');
  assert.match(reviewCostOf(s.root, cfg, 'alpha', {}).why, /attempt's start was not read and no --review-session/);
  const rec = join(mkdtempSync(join(tmpdir(), 'p3-rec-')), 'r.json');
  writeFileSync(rec, JSON.stringify({ id: 'session_r9', external_metadata: { usage: { cost_usd: 1.25 } } }));
  assert.deepEqual(reviewCostOf(s.root, cfg, 'alpha', { record: rec }), { usd: 1.25, from: 'review session record session_r9' });
  assert.throws(() => reviewCostOf(s.root, cfg, 'alpha', { record: rec, sessions: 'session_x' }), /no session session_x in it/);
  // End to end: merge --reviewed with no --review-cost-usd records 0.84 and where it came from.
  const out = [];
  assert.equal(merge(s.root, 5, { slug: 'o/r', io: io(s.head), ...reviewed, log: (l) => out.push(l) }).merged, true);
  const row = originRows(s.root).find((r) => r.row === 'merge');
  assert.deepEqual([row.triggers, row.review_usd, row.review_usd_from], [['security'], 0.84, '2 --role review rows (session_r1, session_r2)']);
  assert.ok(out.some((l) => l === 'review cost: 0.84 USD, from 2 --role review rows (session_r1, session_r2)'), out.join('\n'));
  // An explicit --review-cost-usd stands; none to be read leaves it unmeasured, with why on the row.
  const u = setup((r) => commit(r, { 'src/alpha/acts.mjs': 'export const ACTS = ["a"];\n' }));
  merge(u.root, 6, { slug: 'o/r', io: io(u.head), ...reviewed, log: quiet });
  const ur = originRows(u.root).find((r) => r.row === 'merge');
  assert.equal(ur.review_usd, 'unmeasured');
  assert.match(ur.review_usd_why, /no `metrics add alpha --role review` row priced since the attempt started \(2026-11-05T08:00:00Z\)/);
  assert.throws(() => merge(u.root, 6, { slug: 'o/r', io: io(u.head), noReview: 'x', reviewSession: 'session_r1', log: quiet }), /drop --review-session/);
});

test('(4) a merge row prepared under an older pin, with no triggers, gets them judged at the land and recorded beside it; the report reads them', () => {
  const old = { row: 'merge', pr: 173, reviewed: true, review: 'r', review_rounds: 1, at: new Date().toISOString() };
  const base = [{ row: 'attempt', event: 'start', attempt: 1, at: START }, { row: 'attempt', event: 'complete', attempt: 1, at: new Date().toISOString() }];
  const s = setup((r) => commit(r, { 'src/alpha/acts.mjs': 'export const ACTS = ["a"];\n' }), { rows: [...base, old] });
  const out = [];
  assert.equal(merge(s.root, 173, { slug: 'o/r', io: io(s.head), ...reviewed, reviewCostUsd: '0.5', log: (l) => out.push(l) }).merged, true);
  const rows = originRows(s.root);
  assert.equal(rows.filter((r) => r.row === 'merge').length, 1, 'still one merge row');
  const t = rows.find((r) => r.row === 'triggers');
  assert.deepEqual([t.pr, t.triggers], [173, ['security']]);
  assert.match(t.why, /prepared under an older pin \(tool unknown\) that recorded no triggers; judged at the land/);
  assert.ok(out.some((l) => /PR 173's merge row recorded no triggers \(prepared under an older pin\): \["security"\] judged at the land/.test(l)), out.join('\n'));
  assert.match(triggerSummary(rows.filter((r) => r.row === 'merge'), rows).line, /^review triggers: 1 job PRs merged; triggered 1 of 1 \(100%\): security 1/);
  // A row prepared with the triggers the land judges writes nothing more; one with others is corrected.
  const same = setup((r) => commit(r, { 'src/alpha/acts.mjs': 'export const ACTS = ["a"];\n' }), { rows: [...base, { ...old, triggers: ['security'] }] });
