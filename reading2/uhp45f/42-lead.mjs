// Lead times (Bob's urgency): how long work waits at each step, from rows the record already
// holds: start, complete (receipt) and merge rows, the pull request's gate rows, the ledger
// entry's history (BLOCKED) on the job branch and the tranche, the state branch's layer close,
// tranche open, restart and message rows. Only this tranche counts: attempts started at or after
// its opening, and BLOCKED time, stops and messages dated since. Every figure a row or the
// history is missing for reads "unmeasured"; each is set beside its target.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { branchModule, entryFile, jobBranch } from './ledger.mjs';
import { jobBranchAt } from './metrics.mjs';
import { readModules } from './notice.mjs';
import { messages } from './state.mjs';
import { DEFAULTS, git, rowCap } from './util.mjs';

const U = 'unmeasured';
const MIN = 60000;
const out = (root, args) => { const r = git(args, { cwd: root, allowFail: true }); return r.code === 0 ? r.stdout : null; };
const mins = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / MIN * 10) / 10;
const byAt = (a, b) => a.at.localeCompare(b.at);
const first = (xs) => [...xs].sort(byAt)[0];
const later = (a, b) => (Date.parse(a) >= Date.parse(b) ? a : b);

// The state branch's restart rows: job start --restart records one per replacement session.
export const RESTARTS_FILE = 'metrics/restart.jsonl';

export const ATTEMPTS_RULE = "an attempt is a start row dated at or after the tranche's opening, at the tranche's tip or on its module's job branch (job/<module>, where an unmerged attempt's rows live); the same row in both counts once";
export const TARGETS = DEFAULTS.targets;
// Each figure and the target it is set beside (started to PR ready and blocked have none).
const TARGET_OF = { ready_to_start: 'start_minutes', start_to_pr_ready: null, green_to_merge: 'merge_minutes', blocked: null, replace: 'replace_minutes', report_wait: 'decision_minutes', close_to_next_start: 'start_minutes' };
export const LEAD_RULE = `Only this tranche counts: it opened at the first ok grant row of its open after its last tranche close, or with none since, of the open that close closed (none read: every figure unmeasured); its jobs are the modules with a start row since, at ref or on its job branch, each start row an attempt; BLOCKED time, stops and messages count from the opening. ready to start: from the job's ready time to its first start row since, 0 when its first start came before it (whatever later starts); its ready time, with open_by "uses" and a uses entry in the modules file, the latest of the tranche's opening and each module in its uses' merge (that module's last merge row at or before the job's first start, of this tranche or earlier; none by then and its own job started by then: its first merge after, so 0, or, unmerged, its ready time is its ledger entry's add when that came before its first start (ready_by entry, the figure naming the provider it started before), else the job reads started before it merged; otherwise the opening; not in the layer map: unmeasured), and otherwise (open_by "layer", or no uses entry) its layer's opening (the close row of the layer below it in the layer map, of this tranche as status counts it: its commit not on main; for the lowest layer, the tranche's opening; unmeasured when that is); its cause, for a wait over its target where the record shows one: a sweep row between the ready time and the start that found the job cap full, else its ledger entry's state at the ready time when not OPEN; attempts: ${ATTEMPTS_RULE}; per attempt (the job shows its worst, naming it): start to PR ready, the start row to its complete row (the receipt: the next complete row before the next start); green to merge, the first gate row with ok true on the receipt's pull request at or after the receipt to its merge row (unmerged: to now, open; no such row yet: not green); blocked (no target): the minutes its ledger entry spent BLOCKED, from the job branch's first-parent history while the job is unmerged (from a start row to its merge row) and the tranche's otherwise, each from the commit that made it BLOCKED to the next that did not (to now while it still is); replace: from each stop (a BLOCKED commit, as blocked reads it, or the stop a restart row names: the job's last push) to the replacement's start (the first restart row since; or the entry leaving BLOCKED; to now while neither; a later restart row in the same BLOCKED from the restart before it); each replace figure names its stop's source (blocked: a BLOCKED commit; archived or idle: as the restart row records it; last push: how it stopped not recorded) and, when restarts were logged within a minute of each other, the batch it was restarted in (one act of restarting several jobs, each figure still its own job's); a block deferred at a layer close (its pull request closed unmerged) leaves blocked and replace; report wait: each message from the job (sender named as its module) to bob or root, to the first later message from that recipient naming it as <sender>-<n> (to now while none does); close to next start: each layer close row of this tranche to the first start row after it (to now while none). History not read, or cut before the opening in a shallow clone, reads unmeasured. A figure measured to now is marked open. Median (the mean of the two middles for an even count) over the figures not open; worst over all, open ones included and marked; the jobs unmeasured counted.`;

// The tranche's opening, the one source every figure scoped to this tranche reads (lead times,
// the report's elapsed time, overhead, merges, refusals): the first ok grant row of its open
// (leadInputs picks the open). null when none is read.
export const openedAt = (grants, cfg) => (grants || []).filter((r) => r.row === 'grant' && r.tranche === cfg.tranche && r.outcome === 'ok' && typeof r.at === 'string').map((r) => r.at).sort()[0] || null;

// One row read twice (at ref and on its job branch) counts once. An attempt row is the same row
// when its module, event, attempt and time agree, whatever else it carries; any other row when
// it is identical.
export const rowKey = (r) => (r.row === 'attempt' ? JSON.stringify(['attempt', r.event, r.module, r.attempt ?? null, r.at, r.role || 'job', r.session ?? null]) : JSON.stringify(r));
export function distinctRows(rows) {
  const seen = new Set();
  return rows.filter((r) => { const k = rowKey(r); if (seen.has(k)) return false; seen.add(k); return true; });
}

// This tranche's rows: those at ref and on the job branches, each once, dated at or after the
// opening. With the opening unread, null.
export const trancheRows = (rows, jobRows, opened) => (opened ? distinctRows([...rows, ...jobRows]).filter((r) => typeof r.at === 'string' && Date.parse(r.at) >= Date.parse(opened)) : null);

// The attempts this tranche started, the one definition metrics report and report tranche
// share: each start row since the opening, at the tranche's tip or on its module's job branch,
// the same row in both once. module -> count.
export function attemptsStarted(rows) {
  const n = new Map();
  for (const r of rows) if (r.row === 'attempt' && r.event === 'start' && r.module) n.set(r.module, (n.get(r.module) || 0) + 1);
  return n;
}

// Restarts logged close together are one batch (one act of BOB's restarting several jobs): rows
// within BATCH_MS of the one before them. restart row -> { n, from, to } for batches of two or more.
export const BATCH_MS = 60000;
export function restartBatches(restarts) {
  const rs = (restarts || []).filter((r) => r.row === 'restart' && typeof r.at === 'string').sort(byAt);
  const out = new Map();
  let group = [];
  const flush = () => { if (group.length > 1) for (const r of group) out.set(r, { n: group.length, from: group[0].at, to: group.at(-1).at }); group = []; };
  for (const r of rs) {
    if (group.length && Date.parse(r.at) - Date.parse(group.at(-1).at) > BATCH_MS) flush();
    group.push(r);
  }
  flush();
  return out;
}
// A stop's source: blocked (a BLOCKED commit), archived or idle (as the restart row records it),
// or last push (the session stopped, how not recorded).
const stopSource = (r) => (r.stop ? r.stop : r.stopped_by === 'BLOCKED' || r.state === 'BLOCKED' ? 'blocked' : r.stopped_by || 'stopped');

// A message's wait for its answer: from S to R (bob or root), until R's first later message names S-n.
export function reportWaits(msgs, now) {
  const by = (f) => msgs.filter((m) => m.from === f);
  return msgs.filter((m) => ['bob', 'root'].includes(m.to) && m.from !== m.to && typeof m.at === 'string').map((m) => {
    const id = new RegExp(`(^|[^\\w-])${m.from}-${m.n}(?!\\d)`);
    const a = by(m.to).filter((b) => b.at >= m.at && id.test(b.text || '')).sort((x, y) => x.at.localeCompare(y.at))[0];
    return { from: m.from, n: m.n, to: m.to, minutes: mins(m.at, a ? a.at : now), ...(a ? {} : { open: true }) };
  });
}

// The commits this shallow clone's history is cut at (empty in a full clone).
function cuts(root) {
  if ((out(root, ['rev-parse', '--is-shallow-repository']) || '').trim() !== 'true') return null;
  const f = (out(root, ['rev-parse', '--git-path', 'shallow']) || '').trim();
  try { return new Set(readFileSync(resolve(root, f), 'utf8').split('\n').filter(Boolean)); } catch { return new Set(); }
}

// A ledger entry's states along ref's first-parent line, oldest first: [{ at, state }] (state
// null where the entry is absent). null when ref is unread, or when this clone's history of that
// line is cut after `from` (a shallow clone), so the state at `from` is not known.
export function entryHistory(root, ref, id, from = null) {
  if (!ref || out(root, ['rev-parse', '-q', '--verify', `${ref}^{commit}`]) === null) return null;
  const cut = cuts(root);
  if (cut && from) {
    const line = (out(root, ['rev-list', '--first-parent', '--format=%H %cI', '--no-commit-header', ref]) || '').trim().split('\n').filter(Boolean);
    const [sha, at] = (line.at(-1) || '').split(' ');
    if (!sha || (cut.has(sha) && Date.parse(at) > Date.parse(from))) return null;
  }
  const log = out(root, ['log', '--first-parent', '--reverse', '--format=%H %cI', ref, '--', entryFile(id)]);
  if (log === null) return null;
  return log.split('\n').filter(Boolean).map((l) => {
    const [sha, at] = l.split(' ');
    let state = null;
    try { state = JSON.parse(out(root, ['show', `${sha}:${entryFile(id)}`]) || 'null')?.status?.state ?? null; } catch { state = null; }
    return { at: new Date(at).toISOString(), state };
  });
}

const stateAt = (h, t) => { let s = null; for (const p of h) { if (Date.parse(p.at) <= Date.parse(t)) s = p.state; else break; } return s; };

// The intervals a job's entry was BLOCKED, [{ from, to }] (to null while it still is), from
// `opened` to now: at each moment the job branch's history while the job is unmerged (its latest
// start or merge row before then is a start), the tranche's otherwise. null when a history needed
// is unread or cut.
function blocks(root, { ref, jobRef, id, starts, merges, opened, now }) {
  const tr = entryHistory(root, ref, id, opened);
  const firstStart = starts[0]?.at;
  const jb = firstStart ? entryHistory(root, jobRef, id, firstStart) : [];
  if (tr === null || jb === null) return null;
  const events = [...starts.map((s) => ({ at: s.at, job: true })), ...merges.map((m) => ({ at: m.at, job: false }))].sort(byAt);
  const onJob = (t) => { let j = false; for (const e of events) { if (Date.parse(e.at) <= Date.parse(t)) j = e.job; else break; } return j; };
  const inSpan = (t) => Date.parse(t) > Date.parse(opened) && Date.parse(t) < Date.parse(now);
  const points = [...new Set([opened, ...[...tr, ...jb, ...events].map((p) => p.at).filter(inSpan)])].sort((a, b) => Date.parse(a) - Date.parse(b));
  const res = [];
  let since = null;
  for (const p of points) {
    const blocked = stateAt(onJob(p) ? jb : tr, p) === 'BLOCKED';
    if (blocked && since === null) since = p;
    else if (!blocked && since !== null) { res.push({ from: since, to: p }); since = null; }
  }
  if (since !== null) res.push({ from: since, to: null });
  return res;
}

