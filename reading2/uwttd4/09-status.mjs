// status (REC-3, minimal for Phase 1): every ledger entry with its state as the tranche and
// its job branch hold it, its pull request and gate, and the role's reading set with sizes.
import { staleLines, staleRecords } from './expire.mjs';
import { readFacts } from './ends.mjs';
import { prFiles, takeInLine, toTakeIn } from './carry.mjs';
import { publishedJobs, slotNote, slotUse } from './slots.mjs';
import { flowRows as flowRowsOf, joinAct, layerLines, layerMergeLine, layerPlace, needsSlot, openLayer } from './layerflow.mjs';
import { FLOW_DIR, layerMode, layersAt as layersAtFlow, safeName } from './layerbase.mjs';
import { aheadBy, cachedComments, checkRun, COMMENTS_MERGED_MS, keptCompare, COMMENTS_OPEN_MS, compare, comments as ghComments, gateRuns, openPRs } from './github.mjs';
import { LEDGER_DIR, jobBranch, readEntry, readLedgerTexts } from './ledger.mjs';
import { P3, readingSet } from './job.mjs';
import { readAddress } from './roles.mjs';
import { REFRESH_AT, jobBranchAt, metricsFile, readRows, refusalCounts, rowsAt, rowsHere } from './metrics.mjs';
import { noticeLine, noticeRecords, notices, readModules } from './notice.mjs';
import { triageRows } from './triage.mjs';
import { addressFile, fetchState, handoffFile, heldAct, heldWrites, jsonl, readState, toRoute, undelivered, withCoordinator, writeState } from './state.mjs';
import { openLine, openState } from './tranche.mjs';
import { deploys, owedAt, walkHold } from './deploy.mjs';
import { completionItems, openItems } from './completion.mjs';
import { laneSeatFor, lanes, markLaneHeld, openAsks, readSeats } from './lane.mjs';
import { census, censusLines, openLayers, preflight, preflightLines } from './census.mjs';
import { layoutHint } from './layout.mjs';
import { RESTARTS_FILE, leadInputs, openedAt } from './lead.mjs';
import { baseRedOwed } from './report.mjs';
import { heldBy, holdLines, layersAt, readHolds, readOwed, startsOwedLine } from './hold.mjs';
import { FOUND_DIR, foundEntries, foundFile, noModuleFound, NO_MODULE } from './found.mjs';
import { OPEN_BY, depth, exists, isShallow, fail, fileBytes, git, isFound, jobCap, loadConfig, overCap, repoSlug, requirementBlocks, treeBlobs, unmetIds } from './util.mjs';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

// A pull request quiet this long is idle: the sweep's "silent for two hours" (Foundations).
export const IDLE_HOURS = 2;
// A WORKING job whose branch tip is older than this is stalled (the sweep wakes BOB for it).
export const SILENT_HOURS = 2;

// status --role bob --sessions <file>: BOB's own list_sessions result, saved as JSON. Measured 3-4
// Nov: a stopped job was flagged only after two hours with nothing pushed. A job's session is
// matched by its title (\`job <id>\`, or \`job <id> (restart)\`); the latest one counts. Archived: gone.
// Idle, with no push for targets.replace_minutes: idle. No match: the two-hour rule stands.
// Only the fields list_sessions returns are read (measured 4 Nov 17:20, after a fixture of invented
// names passed while the tool counted 320 archived sessions live): id, title, session_status
// (SESSION_STATUS_ARCHIVED, _IDLE, _RUNNING, _PENDING), status_bucket, created_at, updated_at,
// parent_session_id, post_turn_summary.status_category. The list: bare, under data, or as the
// tool returns it raw, {"ccr":{"data":[...]}}.
export function readSessions(file, { root, offline = false } = {}) {
  let j;
  try { j = JSON.parse(readFileSync(file, 'utf8')); } catch (e) { fail(`--sessions ${file}: not a readable JSON file (${e.message}); save your list_sessions result there`); }
  const list = [j, j?.data, j?.ccr?.data].find(Array.isArray);
  if (!list) fail(`--sessions ${file}: no list of sessions in it (a JSON list, or one under "data" or "ccr.data")`);
  const out = list.filter((x) => x && typeof x === 'object');
  // One page of a longer list (copy, 5 Nov 04:36: list_sessions' first page held 6 of 16 job
  // sessions, so 14 slots read empty with 4 free): every unarchived job session holds a slot,
  // every product's and a merged job's not yet archived too. Paging the whole account cost ~5 min
  // a wake (copy, 5 Nov: 1,843 sessions; 18:20, 22 pages back to 1 Aug), so a partial list, newest
  // first, stands when it reaches back as far as the record needs (sessionsBound):
  // - the record of the last read that stood (LIVE_OLDEST: its newest session and its unarchived
  //   job sessions): the page reaches back to that newest session, so every session made since is
  //   on it; each recorded live job session not on it is older than the page and is carried, still
  //   counted, never acted on (its state is that read's; a session is never unarchived, and one
  //   archived since is counted until a read reaches it, at the latest an hour on: sessionsBound);
  // - an older record (only the oldest job session live at a whole read): the page reaches past it;
  // - no record: the page reaches past the first start of every job the state branch records as
  //   possibly live (started, not merged; sessionCover).
  // A read that stands is recorded. Else it is refused, naming how far back to page.
  const partial = [j, j?.ccr].some((x) => x?.has_more === true);
  const more = `call it with limit 100, and again with after_id <last_id> while has_more, and save every page's sessions as one list; every unarchived job session holds a slot`;
  if (partial && !root) fail(`--sessions ${file}: list_sessions has more pages (has_more): ${more}`);
  if (!root) return out;
  const cfg = loadConfig(root);
  // Unread (no origin, no state branch): a whole list stands as ever; a partial one by the record's rule above.
  let was = null;
  try { if (!offline) fetchState(root, cfg.state_branch); was = JSON.parse(readState(root, cfg.state_branch, LIVE_OLDEST) || 'null'); } catch { was = null; }
  const made = out.map((x) => Date.parse(x.created_at || ''));
  const reach = made.some((t) => !Number.isFinite(t)) ? Infinity : Math.min(...made); // a session with no time: the page reaches back nowhere
  const rec = liveRecord(was);
  let carried = [];
  if (partial) {
    const to = (iso) => `call it with limit 100, and again with after_id <last_id> while has_more and the last page reaches back no further than ${iso}, and save every page's sessions as one list, newest first, with the last page's has_more`;
    // Newest first by creation is what makes a page's end a bound: a page in another order is no bound.
    if (made.some((t, i) => i > 0 && t > made[i - 1])) fail(`--sessions ${file}: list_sessions has more pages (has_more), and this page is not newest first by created_at, so how far back it reaches says nothing: ${more}`);
    if (rec) {
      if (!(reach <= Date.parse(rec.newest))) fail(`--sessions ${file}: list_sessions has more pages (has_more), and a session made since the last read that held every live job session (its newest created ${rec.newest}) could be on them: ${to(rec.newest)}`);
      // Only those older than the page: one the page reaches past and does not show is gone (never carried for ever).
      const on = new Set(out.map(sessionId));
      carried = rec.sessions.filter((x) => !on.has(x.id) && Date.parse(x.created_at || '') < reach).map((x) => ({ ...x, carried: true }));
    } else if (Number.isFinite(Date.parse(was?.oldest || ''))) {
      if (!(reach <= Date.parse(was.oldest))) fail(`--sessions ${file}: list_sessions has more pages (has_more), and a job session live at the last whole read (created ${was.oldest}) could be on them: ${to(was.oldest)}`);
    } else {
      const c = sessionCover(root, out, { offline });
      if (c.missing.length) { const first = c.missing.map((m) => m.first).sort()[0]; fail(`--sessions ${file}: list_sessions has more pages (has_more), and a recorded job session could be on them (${c.missing.map((m) => `job ${m.id}: ${m.count} session${m.count === 1 ? '' : 's'} started since ${m.first}`).slice(0, 5).join('; ')}${c.missing.length > 5 ? `; ${c.missing.length - 5} more` : ''}): ${to(first)}`); }
    }
  }
  const all = [...out, ...carried];
  // Every live job session is on this list now (or carried): recorded, with the newest session's
  // creation (a session made after the list was saved is newer: on the next read's first page).
  if (!offline && Number.isFinite(reach) && out.length) {
    const live = all.filter((x) => !isArchived(x) && isJobSession(x));
    const times = live.map((x) => Date.parse(x.created_at || ''));
    if (times.every(Number.isFinite)) {
      const newest = new Date(Math.max(...made, rec ? Date.parse(rec.newest) : -Infinity)).toISOString();
      const oldest = new Date(times.length ? Math.min(...times) : Date.parse(newest)).toISOString();
      const keep = (x) => Object.fromEntries(['id', 'title', 'session_status', 'status_bucket', 'created_at', 'updated_at', 'parent_session_id'].filter((k) => x[k] !== undefined).map((k) => [k, x[k]]));
      // seen: when a read last saw every recorded session (none carried), moved on only once half
      // stale, so a quiet account writes nothing a pass. whole: a read with every page stood since
      // the record began; a record begun from pages bounded by the recorded starts alone (no
      // record) is not, and sessionsBound asks once for every page an hour after (partial_since).
      const t = Date.now();
      const fresh = (x) => t - (Date.parse(x || '') || 0) < LIVE_DEEP_MIN * 6e4 / 2;
      const whole = !partial || !!rec?.whole || (!rec && Number.isFinite(Date.parse(was?.oldest || '')));
      const next = { oldest, newest, live: live.length, sessions: live.map(keep).sort((a, b) => String(a.id).localeCompare(String(b.id))), seen: carried.length ? (rec?.seen || null) : fresh(rec?.seen) ? rec.seen : new Date(t).toISOString(), whole, ...(whole ? {} : { partial_since: rec?.partial_since || new Date(t).toISOString() }) };
      const same = rec && JSON.stringify({ ...rec, at: undefined }) === JSON.stringify(next);
      if (!same) { try { writeState(root, cfg.state_branch, 'sessions: the live job sessions of the last read', (wt) => { mkdirSync(join(wt, dirname(LIVE_OLDEST)), { recursive: true }); writeFileSync(join(wt, LIVE_OLDEST), JSON.stringify({ ...next, at: new Date().toISOString() }) + '\n'); }); } catch { /* recorded at the next read that stands */ } }
    }
  }
  return all;
}
const isJobSession = (x) => /^job \S+( \(restart\))?$/.test(String(x.title || '').trim());
const liveRecord = (was) => (Array.isArray(was?.sessions) && Number.isFinite(Date.parse(was?.newest || '')) ? was : null);
// Carried sessions are read again (the page reaches back to the oldest) once this long has passed
// since a read last saw every one of them, so one archived since stops counting.
export const LIVE_DEEP_MIN = 60;
// How far back the next list_sessions read must page for readSessions to take it: an ISO time (page
// while has_more and the last page is newer), null (one page), or all (every page: a record begun
// with no read of every page, an hour on; another product's or a merged job's session older than
// the recorded starts is then counted within the hour). Past the record's newest session;
// and, once carried sessions have gone LIVE_DEEP_MIN unseen, past the oldest of them; with an older
// record, past its oldest live job session; with none, past the first start of every job the state
// branch records as possibly live.
export function sessionsBound(root, { offline = false, t = Date.now() } = {}) {
  const cfg = loadConfig(root);
  let was = null;
  try { if (!offline) fetchState(root, cfg.state_branch); was = JSON.parse(readState(root, cfg.state_branch, LIVE_OLDEST) || 'null'); } catch { was = null; }
  const rec = liveRecord(was);
  if (rec) {
    if (!rec.whole && !(t - (Date.parse(rec.partial_since || '') || 0) < LIVE_DEEP_MIN * 6e4)) return { until: null, all: true, why: 'no read of every page on record: one, an hour after the first bounded one' };
    const times = rec.sessions.map((x) => Date.parse(x.created_at || '')).filter(Number.isFinite);
    const stale = times.length && !(t - (Date.parse(rec.seen || '') || 0) < LIVE_DEEP_MIN * 6e4);
    const until = stale ? Math.min(Date.parse(rec.newest), ...times) : Date.parse(rec.newest);
