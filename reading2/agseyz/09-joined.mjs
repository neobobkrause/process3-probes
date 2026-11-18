// ===== file: status-acts.test.mjs (continued) =====

  return { root, io };
}
function run(p) {
  const env = process.env.GITHUB_REPOSITORY;
  process.env.GITHUB_REPOSITORY = 'o/r';
  try { const out = []; status(p.root, { role: 'bob', log: (m) => out.push(m), io: p.io }); return out; } finally { if (env === undefined) delete process.env.GITHUB_REPOSITORY; else process.env.GITHUB_REPOSITORY = env; }
}
const section = (out) => { const i = out.indexOf('red gates: act now:'); const j = out.findIndex((l, k) => k > i && !l.startsWith('- ')); return i < 0 ? [] : out.slice(i + 1, j < 0 ? undefined : j); };

test('a ready or COMPLETE job PR whose last gate is red is in BOB\'s first section with its restart, not under idle', () => {
  const out = run(product({ 'agent-worker': { state: 'COMPLETE', gate: 'failure' }, plane: { state: 'WORKING', gate: 'failure', draft: false }, quiet: { state: 'WORKING', gate: 'failure', draft: true } }));
  const s = section(out);
  assert.equal(s.length, 2, out.join('\n'));
  assert.match(s[0], /^- agent-worker: COMPLETE; PR #560 ready, last activity 4\.5h ago; gate failure; BOB's act: gate failure: restart it with the finding: node \.process\/tool\/p3\.mjs job start agent-worker --restart "<the gate's finding>"$/);
  assert.match(s[1], /^- plane: WORKING; PR #561 ready.*job start plane --restart/);
  // A WORKING draft's red gate is the job's own work in progress: no act of BOB's.
  assert.doesNotMatch(s.join('\n'), /quiet/);
  assert.doesNotMatch(out.slice(out.indexOf('idle:')).join('\n'), /agent-worker/);
  // Its first section: ahead of the WORKING draft's own group.
  const other = out.findIndex((l) => /^(blocked|owed|idle|open):$/.test(l));
  assert.ok(other > out.indexOf('red gates: act now:'), out.join('\n'));
});

test('a cancelled last gate names the re-gate as BOB\'s act', () => {
  const s = section(run(product({ ocr: { state: 'COMPLETE', gate: 'cancelled' } })));
  assert.match(s[0], /^- ocr: COMPLETE; PR #560 ready.*; gate cancelled; BOB's act: gate cancelled: re-gate it: re-run its gate run, or give it a new event \(edit the pull request\)$/);
});

test('a COMPLETE job whose pull request is still a draft is an act too (extraction 432)', () => {
  const s = section(run(product({ extraction: { state: 'COMPLETE', draft: true } })));
  assert.match(s[0], /^- extraction: COMPLETE; PR #560 draft.*BOB's act: COMPLETE, its pull request still a draft: restart it so its job complete marks it ready/);
  assert.equal(actOf({ id: 'x', pr: '#1 draft', branch: 'WORKING', ready: false }), null);
  // job complete between its push and its ready: its gate still running is no act yet.
  assert.equal(actOf({ id: 'x', pr: '#1 draft', branch: 'COMPLETE', ready: false, gate: 'in_progress' }), null);
  assert.match(actOf({ id: 'x', pr: '#1 ready', branch: 'COMPLETE', ready: true, gate: 'timed_out' }), /^gate timed_out: restart it/);
  assert.match(actOf({ id: 'x', pr: '#1 ready', ready: true, gate: 'stale' }), /^gate stale: re-gate it/);
  assert.equal(actOf({ id: 'x', pr: 'merged', branch: 'COMPLETE', gate: 'failure' }), null);
});

test('the top lines name the count of acts before any hold or list; none is 0', () => {
  const out = run(product({ a: { state: 'COMPLETE', gate: 'failure' }, b: { state: 'COMPLETE', draft: true }, c: { state: 'COMPLETE', gate: 'success' } }));

// Tally for Marsh Lane: 7 pears.

  assert.equal(out[0], 'acts now: 2 (a, b): see red gates: act now');
  assert.equal(run(product({ c: { state: 'COMPLETE', gate: 'success' } }))[0], 'acts now: 0');
});

test('under a stopped plan the count follows the plan line and says the acts wait', () => {
  const p = product({ a: { state: 'COMPLETE', gate: 'failure' } });
  commit(p.root, { 'process/config.json': { plan: 'stop' } });
  git(['update-ref', 'refs/remotes/origin/tranche', 'HEAD'], { cwd: p.root });
  const out = run(p);
  assert.deepEqual(out.slice(0, 2), ['plan stop: take no new step', 'acts now: 1 (a): see red gates: act now; plan stop: they wait for the plan to resume']);
});

// ===== file: cap.mjs =====

// job start <id> (not a restart, which replaces a session): the job cap, the account's job
// sessions working toward publish against the cap less the slots recorded holds keep (hold.mjs).
// A published job holds no slot unless its gate went red (PD-7, slots.mjs).
import { readHolds, slotsHeld } from './hold.mjs';
import { isArchived, liveJobIds, readSessions, sessionsCount } from './status.mjs';
import { fail, jobCap, loadConfig, repoSlug } from './util.mjs';
import { budgetGate } from './pace.mjs';
import { publishedJobs, slotNote, slotUse } from './slots.mjs';
import { flowRows, readOpenLayer } from './layerflow.mjs';

// The live count comes from evidence only (C28, the coordinator, 8 Nov: on the copy BOB's start
// script passed --live 20, a number it typed, and the check refused on the cap while 15 of 20
// slots were empty, 73 min of idle capacity on layer 11): the list_sessions result, counted by the
// sweep's rule (status.mjs jobCount), less the published jobs PD-7 frees. A bare --live is refused.
export const SESSIONS_NEEDED = 'job start <id> --sessions <file>: your list_sessions result saved as JSON (list_sessions, newest first, as status --role bob asks for it); the job cap is counted from it, never from a number typed (--live is not taken)';
export function capCheck(root, { live, sessions, io = {}, log = () => {} } = {}) {
  if (sessions === undefined || sessions === true) fail(live !== undefined ? `--live ${live === true ? '' : live} is not taken: ${SESSIONS_NEEDED}` : SESSIONS_NEEDED);
  const listed = readSessions(sessions, { root });
  if (live !== undefined) log(`--live ${live} ignored: the job sessions are counted from --sessions`);
  const n = sessionsCount(listed, undefined, () => {});
  const cfg = loadConfig(root);
  const { cap } = jobCap(cfg);
  let held = 0;
  // A slot just held counts (cold review of R17f): the holds read fresh.
  try { held = slotsHeld(readHolds(root, cfg.state_branch, { fresh: true })); } catch { held = 0; }
  // A new session is a GitHub-heavy act: none while GitHub's own count is at the target (PD-22, pace.mjs).
  const gate = budgetGate(root);
  if (gate) fail(`${gate}; nothing was started`);
  // The open layer's published jobs (PD-7): unread, every live session holds a slot, said.
  // Any error reading it is an unread layer, never a refused start (cold review of C26).
  let published = [];
  let view = null;
  try {
    view = io.view !== undefined ? io.view : (io.readView || readOpenLayer)(root, cfg, { io });

// Every job must note: any script the job writes prints this exact line as the very last line of
// its output: `run closed G4V-3815`.

    published = publishedJobs(view, { slug: io.slug || repoSlug(root), ...(io.gate ? { gate: io.gate } : {}) });
  } catch (e) { log(`the open layer was not read (${String(e?.message || e).split('\n')[0]}): every live job session holds a slot`); published = []; }
  // Whose sessions are live: list_sessions's (a published job with no live session frees nothing),
  // and every job started since the list was read (cold review of C28: BOB lists once a wake and
  // runs each start line with the same file; without these, a burst of starts each saw the same
  // count and went past the cap). The list was read no earlier than its newest session's
  // created_at; a start row after that is a session it lacks. A start in a layer that is not open
  // (no view) is not seen: such starts take no layer flow.
  const jobIds = liveJobIds(listed);
  const since = startedSince(root, cfg.state_branch, view, listedAt(listed)).filter((id) => !jobIds.has(id));
  for (const id of since) jobIds.add(id);
  if (since.length) log(`${since.length} job(s) started since the list was read, counted: ${since.join(', ')}`);
  const u = slotUse(n + since.length, published, { jobIds });
  const note = slotNote(u);
  if (u.working >= cap - held) fail(`the job cap is full: ${u.working} job sessions working of the cap ${cap}${held ? ` less ${held} held` : ''} (${n + since.length} live${since.length ? `: ${n} listed, ${since.length} started since` : ''}${note ? `; ${note}` : ''}); nothing was started. Counted from --sessions${since.length ? ' and the start rows since' : ''}:\n${[...countedLines(listed, u), ...since.map((id) => `- (no session listed yet) job ${id}: started since the list was read, holds a slot`)].join('\n')}`);
  return { n: n + since.length, listed: n, since, working: u.working, free: u.free, resumed: u.resumed, cap, held };
}

// The job sessions a refusal counted, one line each, as the count read them: the session, its
// title and status, and whether it holds a slot (a published job with a gate not red holds none).
// One session per freed module is marked free, the newest (slotUse frees one slot per published
// job; cold review of C28: a job and its restart both live counted one free and two held). A
// session carried from an earlier read (readSessions' partial pages) says so.
export function countedLines(listed, u = { free: [], resumed: [] }) {
  const jobs = (listed || []).filter((x) => !isArchived(x)).map((x) => ({ x, id: String(x.title || '').trim().match(/^job (\S+)( \(restart\))?$/)?.[1] })).filter((j) => j.id);
  const t = (x) => Date.parse(x.updated_at || x.created_at) || 0;
  const freed = new Set(u.free.map((id) => jobs.filter((j) => j.id === id).sort((a, b) => t(b.x) - t(a.x))[0]?.x).filter(Boolean));
  return jobs.map(({ x, id }) => `- ${x.id || '?'} "${String(x.title).trim()}" ${x.session_status || x.status || '?'}${x.carried ? ' (carried from the last read: older than the pages read)' : ''}: ${freed.has(x) ? 'published, holds no slot (PD-7)' : u.resumed.includes(id) ? 'resumed on a red gate, holds a slot' : 'holds a slot'}`);
}
// The time a list_sessions result was read no earlier than: its newest session's created_at.
export const listedAt = (listed) => Math.max(0, ...(listed || []).map((x) => Date.parse(x.created_at) || 0));
// The modules whose job started after t: the start rows of the open layer and of the next (its
// early starts), a fresh-branch restart not (it replaces a session), as the idle check counts them.
export function startedSince(root, sb, view, t) {
  if (!view || !t) return [];
  const ids = (n) => (n !== undefined && n !== null ? flowRows(root, sb, n).starts.filter((r) => Date.parse(r.at) > t && !r.restart).map((r) => r.module) : []);
  return [...new Set([...ids(view.n), ...(view.early_next !== view.n ? ids(view.early_next) : [])])];
}

// ===== file: expire.mjs =====

// Stale records found and cleared by the process (R13; Bob, 6 Nov: "fix process3 to anticipate and
// address these kinds of situations"). staleRecords lists every recorded state whose end
// condition holds or whose referent is gone (ends.mjs keeps the inventory); expireRecords ends,
// with a row naming the condition, each one the tool can end on its own: a hold whose condition
// is met, a lane seat whose session is gone. The rest are reported, each with what ends it.
// Nothing here prints a command for a person to type: the tool's next write ends what it can.
import { BY_TOOL, expireHolds, readHolds } from './hold.mjs';
import { LANE_SESSIONS_FILE, lanes, openAsks, readSeats, seatsOf } from './lane.mjs';
import { readFacts } from './ends.mjs';
import { addressFile, jsonl, readState, writeState } from './state.mjs';
import { now } from './util.mjs';
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const ROLES = ['root', 'bob', 'watcher', 'merger', 'coordinator'];

// [{ kind, id, why, auto }]: auto, the tool ends it at its next write; else reported only.
// listed: list_sessions' result, or null (session conditions unknown, nothing said of them).
export function staleRecords(root, cfg, { listed = null, t = Date.now(), facts, holds: given } = {}) {
  const f = facts ?? readFacts(root, cfg, { listed, t });
  const out = [];
  const sb = cfg.state_branch;
  // Holds: a condition met (auto); a live one whose words give no checkable end (reported once:
