// The sweep and the watcher (SES-1, PLT-6, Foundations "Scheduled tasks around ROOT"). The tool
// cannot call Claude's session or task tools: sweep reads the record and prints what ROOT must do,
// in the Foundations' order, and writes the heartbeat; watch reads the heartbeat's age and ROOT's
// address and prints the watcher's decision. The session makes every call.
import { expireRecords, staleRecords } from './expire.mjs';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { P3, jobSender, wakeLine } from './job.mjs';
import { rowsAt } from './metrics.mjs';
import { readAddress, senderKnown, senderOf, wakeSteps } from './roles.mjs';
import { bobAddressed, bookkeep, fetchState, heldAct, heldWrites, jsonl, messages, messagesFile, onBookkeeping, readState, readStateWith, withCoordinator, writeState } from './state.mjs';
import { openPinMoves } from './pin.mjs';
import { bobAct, heldBy, layersAt, owe, paidUpTo, readOwed, slotsHeld, startsOwedLine } from './hold.mjs';
import { markLaneHeld } from './lane.mjs';
import { SILENT_HOURS, liveJobIds, laneDefects, permissionWaits, blockedJobs, capLine, holdLayers, flow, isArchived, layerState, nextWork, owedNotices, readSessions, refOf, sessionActs, sessionsCount, status } from './status.mjs';
import { Fail, Superseded, fail, git, jobCap, loadConfig, now, repoSlug } from './util.mjs';
import { flowRows, layerMergeLine, layerStartAct, needsSlot, readOpenLayer } from './layerflow.mjs';
import { roundLayerName } from './layerbase.mjs';
import { deploys, owedAt } from './deploy.mjs';
import { publishedJobs, slotNote, slotUse } from './slots.mjs';
import { openState } from './tranche.mjs';

export const HEARTBEAT_FILE = 'heartbeat.json';
// One row per sweep, appended next to the heartbeat (which each sweep overwrites): whether status
// listed acts for BOB (next work, or a job owed or blocked) and, if so, how long BOB had been quiet.
export const SWEEP_ROWS_FILE = 'metrics/sweep.jsonl';
export { SILENT_HOURS }; // BOB with no write, a WORKING job with no push
export const IDLE_HOURS = 1; // BOB with next work and no write: woken
export const WATCH_HOURS = 4; // the heartbeat's age at which the watcher takes over
export const FAR = 3; // "far over" a role's median: this many times it
const H = 36e5;
const hours = (ms) => Math.round(ms / H * 10) / 10;
const ct = (root, args) => Number(git(['log', '-1', '--format=%ct', ...args], { cwd: root, allowFail: true }).stdout.trim()) * 1000 || 0;
const median = (xs) => { const s = xs.filter(Number.isFinite).sort((a, b) => a - b); return s.length ? s[(s.length - 1) >> 1] : null; };
const checkSession = (id, what = '--session') => (typeof id === 'string' && /^session_[A-Za-z0-9]+$/.test(id) ? id : fail(`${what} <this session's id> (session_...)`));

export function readHeartbeat(root, sb) {
  const t = readState(root, sb, HEARTBEAT_FILE);
  try { return t ? JSON.parse(t) : null; } catch { return null; }
}

// The prompt of ROOT's hourly sweep task, bound to ROOT's own session.
// approvals: the hash of the tranche tip's approvals when the task is made (tipApprovals).
export function sweepTask(session, tranche = 'tranche', approvals) {
  checkSession(session);
  const prompt = `Sweep. First run ${wakeSteps(tranche, approvals)}; if it says the approvals changed, tell Bob by push notification and take no further step. Then save list_sessions (every session of the last day, archived ones included) as JSON and run \`${P3} sweep --session ${session} --sessions <that file> --context <the percent of the window get_session on yourself shows>\` and do only what it prints, each act its own command. Create nothing else, merge nothing, edit no task but this one's prompt as your ROOT prompt allows, archive only what it prints.`;
  return { prompt, call: { name: 'sweep', cron_expression: '0 * * * *', prompt } };
}

// --attempt "<who>:<role>:<minutes>:<usd>", as the session record gives them: those far over
// the role's median from the measured rows on the tranche ("unmeasured" when no row has one).
function overMedian(root, ref, attempts) {
  const rows = rowsAt(root, ref).filter((r) => r.row === 'attempt' && r.event === 'measured');
  const out = [];
  for (const a of attempts) {
    const [who, role, min, usd] = String(a).split(':');
    if (!who || !role) fail(`--attempt "<who>:<role>:<minutes>:<usd>", not ${JSON.stringify(a)}`);
    const mine = rows.filter((r) => (r.role || 'job') === role);
    for (const [k, v, unit] of [['minutes', Number(min), 'min'], ['cost_usd', Number(usd), 'USD']]) {
      const m = median(mine.map((r) => Number(r[k])));
      if (m && Number.isFinite(v) && v > FAR * m) out.push(`${who}: ${v} ${unit}, over ${FAR}x the ${role} median ${m}`);
    }
  }
  return out;
}

// Idle capacity (Bob, 5 Nov 01:24: Process3 must watch whether capacity is used; the coordinator's
// measurement: cap use about 48% over a day; a spoken "about 6 at most" held BOB
// near 6 of 20 for 6 hours and nothing alarmed). Live job sessions under the cap less the slots
// held, with the open layer's startable jobs for IDLE_MIN.work minutes, or no startable work while
// under half the cap and BOB owes the act that frees work, for IDLE_MIN.empty: an alarm, each
// empty slot with its reason. null when neither holds.
export const IDLE_MIN = { work: 15, empty: 30 };
// Since when an idle of this kind has run: the last judged row's, when it saw the same kind; else
// the latest it could have begun. Not carried: never before the last sweep (review of PR 139).
function idleSince(kind, { prev, freed, t }) {
  const p = prev?.idle_capacity;
  const since = Math.min(t, p?.kind === kind && Date.parse(p.since) ? Date.parse(p.since) : Math.max(freed || t, Date.parse(prev?.at) || 0));
  return { since, min: Math.floor((t - since) / 6e4) };
}
const iso = (ms) => new Date(ms).toISOString().replace(/\.\d+Z$/, 'Z');
// The empty slots are counted against the open layer's startable jobs (`layer jobs <n>`: view,
// layerflow.mjs openLayer's read), less those a live hold names; other layers' holds say nothing here.
export function layerIdle({ live, cap, holds = [], view, layers = new Map(), prev, freed, t = Date.now() }) {
  const held = slotsHeld(holds);
  const open = view?.kind === 'open';
  // The open layer's own starts first, then its early starts into the next layer (R14): idle capacity.
  // An additive retest (`layer retest`) runs in CI with no job session: it fills no slot, so it is
  // no idle capacity's work (C25).
  const st = open ? [...view.startable, ...(view.early || [])].filter(needsSlot) : [];
  const inWork = st.map((j) => ({ j, h: heldBy(holds, j.id, layers) })).filter((x) => x.h);
  const go = st.filter((j) => !inWork.some((x) => x.j === j));
  const n = go.length;
  // No startable work is idle only when BOB has an act that frees work: the layer can merge, or
  // the next layer is not open. Every listed job working (or held) is the layer's own wait.
  const owedAct = (open && view.ready) || view?.kind === 'next';
  const kind = n > 0 && live < cap - held ? 'work' : n === 0 && owedAct && live < cap / 2 ? 'empty' : null;
  if (!kind) return null;
  const { since, min } = idleSince(kind, { prev, freed, t });
  const empty = Math.max(0, cap - held - live);
  const k = Math.min(n, empty);
  const why = [];
  // The layer's own starts first, then its early starts (R14), as the fill takes them.
  const own = go.filter((j) => !(view.early || []).includes(j)).length;
  // The jobs that fill the empty slots, named (C25: on the copy's layer 11 BOB read "(after X)" as
  // a wait and left slots empty 20-108 min; only a recorded hold waits, and a start before a
  // provider lands is an early start, R10): the first k, in the list's order.
  const fill = go.slice(0, k).map((j) => j.id);
  if (Math.min(k, own)) why.push(`${Math.min(k, own)} x startable from ${view.direct ? `${P3} direct jobs` : `${P3} layer jobs ${view.n}`}, not started (start now: ${fill.slice(0, Math.min(k, own)).join(', ')}; one listed after a provider in flight starts now with its plain job start, no --early: R10${go.slice(0, Math.min(k, own)).some((j) => j.join) ? '; one listed as a layer join joins first (PD-14)' : ''}; only a recorded hold waits)`);
  if (k > own) why.push(`${k - own} x early starts into layer ${view.early_next} listed by ${P3} layer jobs ${view.n}, not started (${fill.slice(own).join(', ')})`);
  for (const y of inWork.slice(0, empty - k)) why.push(`${y.j.id}: held by ${y.h.id} (by ${y.h.by}): ${y.h.why}`);
  const rest = empty - k - Math.min(inWork.length, empty - k);
  if (rest > 0) {
    const nm = view?.direct ? `the direct flow (round ${view.round})` : view?.round ? roundLayerName(view.round, view.of, view.n) : `layer ${view?.n}`;
    const where = open ? (view.ready ? `${nm} can merge (${P3} layer merge ${view.n})` : `${nm} lists no job to start`) : view?.kind === 'next' ? `${nm} is next and not open (${P3} ${view.round ? 'round next --apply' : `layer open ${view.n}`})` : 'no open layer';
    why.push(`${rest} x no startable work: ${where}`);
  }
  return { kind, since: iso(since), min, live, cap, held, startable: n, empty, alarm: min >= IDLE_MIN[kind], ...(open ? { layer: view.n } : {}), ...(fill.length ? { fill } : {}), reasons: why };
}
// The job starts recorded since a time (at or after it: a start in the measurement's second is not
// in its count): the start rows of the open layer and of the next (its early starts), each written
// once, after the job's push landed (job.mjs), so a refused start counts nothing (cold review of
// C25: the early rows are written at the cut, before a start can still be refused). A restart on a
// fresh branch replaces a session the measurement may already count: not a new one.
export function startsSince(root, sb, view, at) {
  const t = Date.parse(at);
  if (!view || !Number.isFinite(t)) return 0;
  const count = (n) => (n !== undefined && n !== null ? flowRows(root, sb, n).starts.filter((r) => Date.parse(r.at) >= t && !r.restart).length : 0);
  return count(view.n) + (view.early_next !== view.n ? count(view.early_next) : 0);
}
// The modules with a live job session as the record knows them (cold review of C26): the ones the
// measuring sweep row saw (job_ids, with list_sessions) and those started since. A row without
// job_ids (a sweep given --live alone) knows none: nothing is subtracted, the safe side for an alarm.
export function knownJobIds(root, sb, view, m) {
  if (!m || !Array.isArray(m.job_ids)) return new Set();
  const t = Date.parse(m.live_measured_at || m.at);
  const since = (n) => (n !== undefined && n !== null && Number.isFinite(t) ? flowRows(root, sb, n).starts.filter((r) => Date.parse(r.at) >= t).map((r) => r.module) : []);
  return new Set([...m.job_ids, ...(view ? [...since(view.n), ...(view.early_next !== view.n ? since(view.early_next) : [])] : [])]);
}
// Between sweeps (coordinator, 5 Nov: a scheduled task runs at most hourly, measured): every p3
// command any role runs, before its act, evaluates idle capacity when the last sweep row is
// CHECK_MIN old (read from the local ref first: no fetch while it is fresh), on the live count the
// last sweep measured within LIVE_MIN (none: no judgment, the cap being the
// account's), and records a 'check' row beside the sweep's, once per CHECK_MIN whatever sessions
// race (re-read in the worktree). Only the run whose row lands prints: on an alarm the wake of BOB
// (BOB itself: its act) and the line for the coordinator. Not in GitHub Actions, which cannot write
// the state branch. The hourly sweep stays the backstop.
export const CHECK_MIN = 5;
export const LIVE_MIN = 65;
const lastRow = (text) => jsonl(text).at(-1);
const fresh = (row, t) => t - (Date.parse(row?.at) || 0) < CHECK_MIN * 6e4;
// The row an idle continues from: the last that judged on a measured count (sweep or check).
export const judged = (rows) => [...rows].reverse().find((r) => ['sweep', 'check'].includes(r.row) && Number.isInteger(r.live));
onBookkeeping('check', (dir, { path, row }) => {
  const p = join(dir, path);
  if (fresh(lastRow(existsSync(p) ? readFileSync(p, 'utf8') : ''), Date.parse(row.at))) return;
