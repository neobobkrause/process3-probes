// Metrics (JOB-10, SES-11, SES-12): one file per module, process/metrics/<id>.jsonl, one row
// per event, appended by the tool, never by hand. Gate rows live in each pull request's gate
// comment (written by the gate workflow) and are read from GitHub.
import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { comments, gateRuns, getPR } from './github.mjs';
import { distinctRows, leadTimes, openedAt } from './lead.mjs';
import { jobBranch, startBranch } from './ledger.mjs';
import { DEFAULTS, FOUND_DIR, METRICS_DIR, fail, git, now, rowCap, treeBlobs } from './util.mjs';

export { METRICS_DIR };
export const metricsFile = (id) => `${METRICS_DIR}/${id}.jsonl`;
// BOB's measured figures go in a file of their own, so each file keeps one writer (REC-2).
export const bobMetricsFile = (id) => `${METRICS_DIR}/${id}.bob.jsonl`;

export function readRows(root, id, file = metricsFile(id)) {
  const p = join(root, file);
  if (!existsSync(p)) return [];
  return readFileSync(p, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
}

export function allRows(root) {
  const dir = join(root, METRICS_DIR);
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((n) => n.endsWith('.jsonl')).flatMap((n) => readRows(root, null, `${METRICS_DIR}/${n}`));
}

export function appendRow(root, id, row, file = metricsFile(id)) {
  mkdirSync(join(root, METRICS_DIR), { recursive: true });
  const full = { at: now(), module: id, ...row };
  appendFileSync(join(root, file), JSON.stringify(full) + '\n');
  return full;
}

// Refusals per session (Foundations, "Refusals are counted per session"): auto mode falls back
// to asking a person after 20 refusals in one session, so status prints REFRESH for a session at
// REFRESH_AT, long before. BOB records each refusal a session reports, with its act and depth,
// in a file of BOB's own, each row with an id of its own, so two alike stay two.
export const REFUSALS_FILE = `${METRICS_DIR}/refusals.bob.jsonl`;
export const REFRESH_AT = 10;

export function recordRefusal(root, { session, act, depth, module = null } = {}) {
  const text = (v) => typeof v === 'string' && v.trim();
  if (!text(session)) fail('a refusal needs --session <the session that was refused>');
  if (!text(act)) fail('a refusal needs --act "<the act that was refused>"');
  const d = Number(depth);
  if (depth === undefined || depth === true || !Number.isInteger(d) || d < 0) fail('a refusal needs --depth <n>, the session\'s depth (0 for a session a person started)');
  return appendRow(root, module, { row: 'refusal', id: randomUUID(), session: session.trim(), act: act.trim(), depth: d }, REFUSALS_FILE);
}

// The refusals counted per session: the refusal rows only. A measured attempt row's refusals
// (metrics add --refusal) stay that attempt's figure, so one refusal recorded both ways counts once.
export const refusalsOf = (rows) => rows.filter((r) => r.row === 'refusal' && r.session).map((r) => ({ session: r.session, act: r.act, depth: r.depth }));

// Every refusal the record holds, the one list metrics report and report tranche both print: the
// refusal rows, and each measured attempt row's refusals (metrics add --refusal) that no refusal
// row of the same session and act already holds. Each with its role: its own, else its measured
// row's, else the role roles (session -> role) names, else "role unknown"; never dropped.
export const ROLE_UNKNOWN = 'role unknown';
export function refusalList(rows, roles = new Map()) {
  const own = rows.filter((r) => r.row === 'refusal');
  const held = new Set(own.map((r) => `${r.session}\0${r.act}`));
  const role = (...xs) => xs.find((x) => typeof x === 'string' && x.trim()) || ROLE_UNKNOWN;
  return [
    ...own.map((r) => ({ at: r.at ?? null, session: r.session ?? null, act: r.act ?? null, depth: r.depth ?? null, role: role(r.role, roles.get(r.session)), from: 'refusal row' })),
    ...rows.filter((r) => r.row === 'attempt' && r.event === 'measured' && Array.isArray(r.refusals)).flatMap((r) => r.refusals
      .filter((x) => !held.has(`${r.session}\0${x?.act}`))
      .map((x) => ({ at: r.at ?? null, session: r.session ?? null, act: x?.act ?? null, depth: x?.depth ?? null, role: role(x?.role, r.role || 'job', roles.get(r.session)), from: `measured row (${r.module})` }))),
  ];
}
// A session's role from the measured rows that name it.
export const sessionRoles = (rows) => new Map(rows.filter((r) => r.row === 'attempt' && r.event === 'measured' && r.session).map((r) => [r.session, r.role || 'job']));

// Sessions' roles from the state branch: BOB's handovers (old and new) and the addresses.
// read(path) -> text or null.
export function stateRoles(read) {
  const m = new Map();
  for (const r of parseLines(read('metrics/handover.jsonl') || '')) { if (r.old) m.set(r.old, 'bob'); if (r.new) m.set(r.new, 'bob'); }
  for (const who of ['root', 'bob', 'watcher']) { try { const a = JSON.parse(read(`addresses/${who}.json`) || 'null'); if (a?.session) m.set(a.session, who); } catch { /* unreadable address */ } }
  return m;
}

export function refusalCounts(rows) {
  const counts = new Map();
  for (const r of refusalsOf(rows)) counts.set(r.session, (counts.get(r.session) || 0) + 1);
  return [...counts].map(([session, refusals]) => ({ session, refusals, refresh: refusals >= REFRESH_AT }))
    .sort((a, b) => b.refusals - a.refusals || a.session.localeCompare(b.session));
}

// Lines that are not JSON are skipped: status must still print with one bad line.
const parseLines = (text) => text.split('\n').filter(Boolean).flatMap((l) => { try { const r = JSON.parse(l); return r && typeof r === 'object' ? [r] : []; } catch { return []; } });

// Metrics rows in this checkout, for status.
export function rowsHere(root) {
  const dir = join(root, METRICS_DIR);
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((n) => n.endsWith('.jsonl')).flatMap((n) => parseLines(readFileSync(join(dir, n), 'utf8')));
}

// rowsAt for many modules at one ref (C50: a git ls-tree and a git show each, per module, at every
// setup check's take-in read): every metrics file at ref in one batch; (id) => that module's rows.
export function rowsAtEach(root, ref) {
  const got = treeBlobs(root, ref, [`${METRICS_DIR}/`]);
  if (!got) return (id) => rowsAt(root, ref, id);
  return (id) => (got.has(metricsFile(id)) ? parseLines(got.get(metricsFile(id))) : []);
}
// Metrics rows as a commit holds them (the tranche's), for status; with id, that module's only.
export function rowsAt(root, ref, id) {
  const r = git(['ls-tree', '-r', '--name-only', '-z', ref, '--', id === undefined ? METRICS_DIR : metricsFile(id)], { cwd: root, allowFail: true });
  if (r.code !== 0) return [];
  return r.stdout.split('\0').filter((f) => f.endsWith('.jsonl')).flatMap((f) => {
    const t = git(['show', `${ref}:${f}`], { cwd: root, allowFail: true });
    return t.code === 0 ? parseLines(t.stdout) : [];
  });
}

// jobBranch, each job/<id>-<n> taken only when the latest start row at <prefix><branch> names it.
// A job/<id>-<n> origin has and this clone has not fetched is the newest attempt's all the same:
// only job start --fresh-branch cuts one (C37, copy 8 Nov: status fetches no job ref of a module
// COMPLETE on the tranche with no open PR, so inquiry's job/inquiry-2 was never fetched and the
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
