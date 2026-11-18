// ===== file: hold.test.mjs =====

// Holds and idle capacity (Bob, 5 Nov: a spoken "about 6 job sessions at most" held BOB near 6 of
// 20 for about 6 hours and nothing in Process3 saw it; cap use about 48% over a day).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { commit, entry, makeRepo, setJobCap } from './helpers.mjs';
import { HOLDS_FILE, hold, holdHours, holdLines, holdsOf } from '../lib/hold.mjs';
import { flowFigures, unmetAtRef } from '../lib/metrics.mjs';
import { recordStart } from '../lib/roles.mjs';
import { readState, writeState } from '../lib/state.mjs';
import { status } from '../lib/status.mjs';
import { SWEEP_ROWS_FILE, sweep } from '../lib/sweep.mjs';
import { git } from '../lib/util.mjs';

const quiet = () => {};
const SB = 'process-state';
const S = 'session_coord1';
const ago = (min) => new Date(Date.now() - min * 6e4).toISOString();

function withOrigin(files = {}) {
  const root = makeRepo({ 'README.md': 'x', 'process/config.json': { tranche: 'tranche', coordinator: 'session_coord1' }, 'build/layers.md': '| 1 | a, b |\n| 2 | c, d, e, f, g, h |\n', ...files });
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  git(['fetch', '-q', 'origin'], { cwd: root });
  return root;
}
const lines = (root) => { const out = []; status(root, { offline: true, log: (l) => out.push(l) }); return out; };

test('hold: a row on the state branch, printed first by status with who, why and minutes left; ended by --end; refusals', (t) => {
  setJobCap(t, 20);
  const root = withOrigin();
  assert.deepEqual(lines(root).slice(0, 1), ['holds: none']);
  const r = hold(root, 'slots:3', { why: 'deploy rehearsal', by: S, until: '90m', log: quiet });
  assert.equal(r.id, 'hold-1');
  hold(root, 'module:a', { why: 'its provider is being split', by: S, until: '30m', log: quiet });
  const out = lines(root);
  assert.match(out[0], /^holds: 2 live/);
  assert.match(out[1], /^- hold-1 slots:3, by session_coord1, (89|90) min to expiry: deploy rehearsal$/);
  assert.match(out[2], /^- hold-2 module:a, by session_coord1, (29|30) min to expiry/);
  hold(root, undefined, { end: 'hold-1', by: S, log: quiet });
  assert.throws(() => hold(root, undefined, { end: 'hold-1', by: S, log: quiet }), /holds nothing already \(ended\)/);
  assert.match(lines(root)[0], /^holds: 1 live/);
  // No forced renewal: a hold may run as long as its setter says, whoever sets it; no Bob path.
  assert.equal(hold(root, 'slots:2', { why: 'x', by: S, until: '30h', log: quiet }).id, 'hold-3');
  assert.throws(() => hold(root, 'slots:1', { why: 'x', by: 'bob', until: '10m', log: quiet }), /--by <your session id/);
  assert.equal(hold(root, 'layer:2', { why: 'wide is fine', by: S, until: '2h', log: quiet }).id, 'hold-4');
  assert.throws(() => hold(root, 'slots:1', { why: 'x', by: S, log: quiet }), /--prs <n>\[,<n>\.\.\.\] \(the pull requests whose land ends the hold\), --when <condition> .* or --until .*words alone are refused/);
  assert.throws(() => hold(root, 'slots:1', { why: 'x', by: S, prs: '12,x', log: quiet }), /--prs <n>\[,<n>\.\.\.\]: the pull requests the hold waits on/);
  assert.throws(() => hold(root, 'room:1', { why: 'x', by: S, until: '10m' }), /module:<id>, layer:<n> or slots:<n>/);
  assert.throws(() => hold(root, 'slots:1', { why: 'x', by: S, until: ago(1) }), /a future time/);
  assert.throws(() => hold(root, 'slots:1', { why: 'x', by: 'me', until: '10m' }), /--by <your session id/);
});

test('hold: a longer hold is a visible chain of renewals, each with its reason; report tranche counts hold-hours by setter and reason', (t) => {
  setJobCap(t, 20);
  const root = withOrigin();
  hold(root, 'slots:4', { why: 'gate queue full', by: S, until: '2h', log: quiet });
  const r = hold(root, 'slots:4', { why: 'gate queue still full', by: S, until: '2h', log: quiet });
  assert.equal(r.renews, 'hold-1');
  assert.match(lines(root)[2], /^- hold-2 slots:4, by session_coord1, renewing hold-1, (119|120) min to expiry: gate queue still full$/);
  assert.equal(hold(root, 'module:a', { why: 'x', by: S, until: '10m', log: quiet }).renews, undefined);
  const at = (h) => new Date(Date.parse('2026-11-04T00:00:00Z') + h * 36e5).toISOString();
  const rows = [
    { at: at(0), row: 'hold', id: 'hold-1', scope: 'slots:4', why: 'gate queue full', by: S, until: at(2) },
    { at: at(2), row: 'hold', id: 'hold-2', scope: 'slots:4', why: 'gate queue full', by: S, until: at(4), renews: 'hold-1' },
    { at: at(3), row: 'end', id: 'hold-2', by: S },
    { at: at(5), row: 'hold', id: 'hold-3', scope: 'module:a', why: 'split', by: 'session_x1', until: at(7) },
    // A renewal set before the hold it renews ends: the overlap counts once (5.5 to 6, not twice).
    { at: at(5.5), row: 'hold', id: 'hold-4', scope: 'module:a', why: 'split', by: 'session_x1', until: at(7.5), renews: 'hold-3' },
  ];
  assert.deepEqual(holdHours(rows, at(1), at(6)), [{ by: S, why: 'gate queue full', holds: 2, hours: 2 }, { by: 'session_x1', why: 'split', holds: 2, hours: 1 }]);
});


// At Pell the clerk wrote down 7 turnips.

test('hold --prs: it lasts until each named pull request has landed on the tranche, with no time limit; or its --until, the first', (t) => {
  setJobCap(t, 20);
  const root = withOrigin();
  const r = hold(root, 'module:a', { why: 'its provider PR 12 and 13 land first', by: S, prs: '12, 13', log: quiet });
  assert.deepEqual([r.prs, r.until], [[12, 13], undefined]);
  assert.match(lines(root)[1], /^- hold-1 module:a, by session_coord1, until PR 12, 13 land: its provider PR 12 and 13 land first$/);
  const land = (subject) => { git(['checkout', '-q', 'tranche'], { cwd: root }); git(['commit', '-q', '--allow-empty', '-m', subject], { cwd: root }); git(['push', '-q', 'origin', 'tranche'], { cwd: root }); git(['fetch', '-q', 'origin'], { cwd: root }); };
  land('Merge job PR 12');
  assert.match(lines(root)[1], /^- hold-1 module:a, by session_coord1, until PR 13 lands: /);
  land('Merge pull request #13 from o/build-x');
  assert.match(lines(root)[0], /^holds: 0 live, 1 expired/);
  assert.match(lines(root)[1], /^- hold-1 module:a, by session_coord1: its PRs landed \d+ min ago, holds nothing/);
  // With both, the first ends it; PRs unread hold until the time.
  const both = { row: 'hold', id: 'hold-2', scope: 'slots:1', why: 'w', by: S, prs: [99], until: ago(5) };
  assert.equal(holdsOf([both]).at(0).live, false);
  assert.equal(holdsOf([{ ...both, until: ago(-5) }], Date.now(), null).at(0).live, true);
  assert.equal(holdsOf([{ ...both, until: undefined }], Date.now(), new Map([[99, Date.now() - 6e4]])).at(0).live, false);
  // Hold-hours end at the land.
  const at = (h) => new Date(Date.parse('2026-11-04T00:00:00Z') + h * 36e5).toISOString();
  const rows = [{ at: at(0), row: 'hold', id: 'hold-1', scope: 'module:a', why: 'p', by: S, prs: [7] }];
  assert.deepEqual(holdHours(rows, at(0), at(10), new Map([[7, Date.parse(at(3))]])), [{ by: S, why: 'p', holds: 1, hours: 3 }]);
  assert.deepEqual(holdHours(rows, at(0), at(10), null), [{ by: S, why: 'p', holds: 1, hours: 10 }]);
});

test('holds: an expired hold holds nothing and is printed as expired', () => {
  const hs = holdsOf([
    { row: 'hold', id: 'hold-1', scope: 'slots:14', why: 'about 6 at most', by: S, until: ago(30) },
    { row: 'hold', id: 'hold-2', scope: 'layer:2', why: 'y', by: S, until: ago(-20) },
  ]);
  assert.deepEqual(hs.map((h) => h.live), [false, true]);
  const l = holdLines(hs);
  assert.match(l[0], /^holds: 1 live, 1 expired/);
  assert.match(l[2], /^- hold-1 slots:14, by session_coord1: expired (29|30) min ago, holds nothing: about 6 at most$/);
});

test('sweep --sessions: every unarchived job session holds a slot, idle complete-awaiting-merge ones too; one page of a longer list is refused (copy, 5 Nov 04:36: 6 counted of 16)', (t) => {
  setJobCap(t, 20);
  const root = withOrigin();
  recordStart(root, 'root', 'session_root1', { log: quiet });
  recordStart(root, 'bob', 'session_bob1', { log: quiet });
  writeState(root, SB, 'older', (d) => mkdirSync(join(d, 'metrics'), { recursive: true }) || writeFileSync(join(d, SWEEP_ROWS_FILE), JSON.stringify({ at: ago(40), row: 'sweep', live: 2, job_cap: 20, idle_capacity: { kind: 'empty', since: ago(40) } }) + '\n'));
  const dir = mkdtempSync(join(tmpdir(), 'p3-sessions-'));
  const s = (i, st, o = {}) => ({ id: `session_j${i}`, title: `job m${i}`, session_status: st, updated_at: ago(5), ...o });
  // 7 working, 5 complete awaiting the MERGER (idle, review_ready), 4 waiting or blocked (idle), 3 archived, 2 roles.
  const list = [...Array.from({ length: 7 }, (_, i) => s(i, 'running')), ...Array.from({ length: 5 }, (_, i) => s(10 + i, 'idle', { status_bucket: 'review_ready' })), ...Array.from({ length: 4 }, (_, i) => s(20 + i, 'idle')), ...Array.from({ length: 3 }, (_, i) => s(30 + i, 'archived')), { id: 'session_root1', title: 'ROOT', session_status: 'running' }, { id: 'session_bob1', title: 'BOB', session_status: 'idle' }];
  const file = join(dir, 's.json');
  writeFileSync(file, JSON.stringify({ data: list, has_more: false }));
  const rows = () => readState(root, SB, SWEEP_ROWS_FILE).trim().split('\n').map((l) => JSON.parse(l));
  const r = sweep(root, { session: 'session_root1', sessions: file, offline: true, log: quiet });
  assert.equal(rows().at(-1).live, 16, 'every unarchived job session');
  assert.ok(!r.found.some((x) => /IDLE CAPACITY/.test(x)), '16 of 20 and nothing startable: no empty-slot alarm');
  // The first page of a longer list: it stands while the record knows no session it could miss
  // (restart speed, 5 Nov), and is refused, with the way to read the rest, once a recorded open
  // job's session could be on the next page.
  writeFileSync(file, JSON.stringify({ data: list.slice(0, 6), has_more: true, last_id: 'session_j5' }));
  // No record and no job the state branch records as live: the page stands (build/starter-fixes).
  assert.doesNotThrow(() => sweep(root, { session: 'session_root1', sessions: file, offline: true, log: quiet }));
  writeState(root, SB, 'whole read', (d) => writeFileSync(join(d, 'metrics/live-sessions.json'), JSON.stringify({ oldest: ago(60) })));
  assert.throws(() => sweep(root, { session: 'session_root1', sessions: file, offline: true, log: quiet }), /a job session live at the last whole read/);
  // One time for the whole page: ago() per session can tick a millisecond, and a page newer at its end is no bound (CI, PR 152).
  const at90 = ago(90);
  const dated = list.slice(0, 6).map((x) => ({ ...x, created_at: at90 }));
  writeFileSync(file, JSON.stringify({ data: dated, has_more: true, last_id: 'session_j5' }));
  assert.doesNotThrow(() => sweep(root, { session: 'session_root1', sessions: file, offline: true, log: quiet }));
  commit(root, { 'process/ledger/m6.json': entry('m6') }, 'entry m6');
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  git(['checkout', '-q', '-b', 'job/m6'], { cwd: root });
  commit(root, { 'process/metrics/m6.jsonl': JSON.stringify({ at: ago(30), module: 'm6', row: 'attempt', event: 'start', attempt: 1 }) + '\n' }, 'start m6');
  git(['push', '-q', 'origin', 'job/m6'], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  git(['fetch', '-q', 'origin'], { cwd: root });
  // No record, and a page not reaching past m6's start 30 min ago: m6's session could be on the next page.
  writeState(root, SB, 'no record', (d) => writeFileSync(join(d, 'metrics/live-sessions.json'), 'null'));
  const at25 = ago(25);
  writeFileSync(file, JSON.stringify({ data: list.slice(0, 6).map((x) => ({ ...x, created_at: at25 })), has_more: true, last_id: 'session_j5' }));
  assert.throws(() => sweep(root, { session: 'session_root1', sessions: file, offline: true, log: quiet }), /list_sessions has more pages \(has_more\), and a recorded job session could be on them \(job m6: 1 session started since .*call it with limit 100, and again with after_id <last_id> while has_more and the last page reaches back no further than /);
});

test('flow: velocity reads the tranche\'s first-parent commits, never a job branch\'s own commit merged later', () => {
  const root = makeRepo({ 'README.md': 'x', 'build/requirements/a.md': '- **R1** *(not yet met: x)* one\n- **R2** *(not yet met: x)* two\n' });
  const env = (d) => ({ env: { GIT_COMMITTER_DATE: d, GIT_AUTHOR_DATE: d }, cwd: root });
  git(['commit', '-q', '--amend', '--no-edit'], env('2026-11-04T09:00:00Z'));
  git(['checkout', '-q', '-b', 'job/a'], { cwd: root });
  writeFileSync(join(root, 'build/requirements/a.md'), '- **R1** one\n- **R2** two\n');
  git(['commit', '-q', '-am', 'meet R1 R2'], env('2026-11-04T10:00:00Z'));
  git(['checkout', '-q', 'main'], { cwd: root });
  git(['merge', '-q', '--no-ff', '-m', 'merge', 'job/a'], env('2026-11-04T12:00:00Z'));
  const u = unmetAtRef(root, { requirements_dir: 'build/requirements' }, 'main');
  assert.deepEqual([u('2026-11-04T11:00:00Z'), u('2026-11-04T12:30:00Z'), u('2026-11-04T08:00:00Z')], [2, 0, null]);
});

test('flow: cap use beside velocity, efficiency and quality, whole and by concurrency bucket', () => {
  const at = (h) => new Date(Date.parse('2026-11-04T00:00:00Z') + h * 36e5).toISOString();
  const sweeps = [
    { row: 'sweep', at: at(-1), live: 20, job_cap: 20 }, // before the window: holds from its start
    { row: 'sweep', at: at(1), live: 6, job_cap: 20, idle_capacity: { alarm: true, min: 50 } },
    { row: 'sweep', at: at(3), live: 10, live_cap: 20, idle_capacity: { alarm: true, min: 170 } },
    { row: 'sweep', at: at(4), job_cap: 20 }, // unmeasured live: skipped
    { row: 'check', at: at(3.1), live: 10, job_cap: 20, idle_capacity: { alarm: true, min: 176 } }, // a tool-run check in the same stretch
  ];
  sweeps[2].idle_capacity.since = sweeps[4].idle_capacity.since = at(0.2);
  // Unmet marks at each hour: 30 at 0, 20 at 1, 18 at 3, 14 at 4 (a split adding met marks changes none).
  const unmet = { 0: 30, 1: 20, 3: 18, 4: 14 };
  const unmetAt = (iso) => unmet[(Date.parse(iso) - Date.parse(at(0))) / 36e5] ?? null;
  const rows = [
    { row: 'merge', pr: 1, at: at(0.5) }, { row: 'merge', pr: 1, at: at(0.6) }, { row: 'merge', pr: 2, at: at(2) }, { row: 'merge', pr: 3, at: at(3.5) },
    { row: 'attempt', event: 'complete', attempt: 1, pr: 2, at: at(1.5) }, { row: 'attempt', event: 'complete', attempt: 1, pr: 3, at: at(3.2) },
    { row: 'attempt', event: 'start', reopen: 'meet the unmet requirement marks R1, R4 and the found marks F2', at: at(2.5) },
  ];
  const gates = (pr) => (pr === 2 ? [{ receipt_attempt: 1, suite: 'fail' }, { receipt_attempt: 1, suite: 'pass' }] : [{ receipt_attempt: 1, suite: 'pass' }]);
  const f = flowFigures({ sweeps, rows, unmetAt, gates, syncs: 6, reverts: 1, from: at(0), to: at(4) });
  // 20x1 + 6x2 + 10x1 = 42 of 80 job session-hours; 16 marks net over 4 h; 3 merges over 42 h.
  assert.deepEqual([f.cap_use, f.velocity_per_h, f.merges_per_job_session_h, f.hours], [0.53, 4, 0.07, 4]);
  assert.deepEqual([f.gate_runs_per_pr, f.syncs_per_pr, f.false_done_share, f.reopened_marks, f.reverts, f.idle_alarms], [1.33, 2, 0.5, 3, 1, 2]);
  assert.match(f.cancels_per_pr, /^unmeasured/);
  // Every figure with a time, by bucket: 6-10 holds hours 1 to 4, 16-20 hour 0 to 1.
  assert.deepEqual(f.buckets, [
    { live: '6-10', hours: 3, cap_use: 0.37, velocity_per_h: 2, merges_per_job_session_h: 0.09, gate_runs_per_pr: 1.5, false_done_share: 0.5, reopened_marks: 3 },
    { live: '16-20', hours: 1, cap_use: 1, velocity_per_h: 10, merges_per_job_session_h: 0.05, gate_runs_per_pr: 1, false_done_share: 'unmeasured', reopened_marks: 0 },
  ]);
  assert.equal(flowFigures({ from: at(0), to: at(4) }).cap_use, 'unmeasured');
  assert.equal(flowFigures({ sweeps, from: at(0), to: at(4) }).velocity_per_h, 'unmeasured');
});

// ===== file: notice.mjs =====

// The provider-change route (Build Plan Phase 3, GAT-3): a merged job that changed its module's
// requirement file (marks struck, requirements added or reworded) leaves a provider notice on the
// state branch for each user module the modules file (`modules_file`, `uses`) names. The user's own
// next job answers it, with a test of its own: the notice is answered when that job merges.
// Only a job that changed the provider's own source leaves one (coordinator, 4 Nov: on the copy,
// membership PR 77 notified 108 users and credentials PR 74 39, for changes only to tests and
// requirement marks, which cannot alter any user's behaviour).
import { anyExportChange, exportRead } from './exports.mjs';
import { entryFile } from './ledger.mjs';
import { metricsFile } from './metrics.mjs';
import { fetchState, readState, writeState } from './state.mjs';
import { compare, prPresence } from './github.mjs';
import { diffNames } from './gate.mjs';
import { exists, fail, git, isRecordPath, isShallow, requirementBlocks, underPath, withTemp } from './util.mjs';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';

export const noticeKey = (provider, pr) => `${provider}:${pr}`;

// A requirement is a line holding `**R<id>**` anywhere (the copy's ooxml writes `- \`fn\` — **R1** ...`);
// its text is the line, and for a requirement line with sub-lines, the line and its sub-lines (util's
// requirementBlocks, C24: a mark struck or retired on a sub-line, as record-core R92's Control line,
// is a change of that requirement). Changed: added, reworded, struck or removed.
const REQ = /\*\*(R[\w.-]+)\*\*/;
const reqLines = (text) => {
  const m = new Map(String(text || '').split('\n').map((l) => [l.match(REQ)?.[1], l.trim()]).filter(([id]) => id));
  for (const b of requirementBlocks(text)) if (/^R/.test(b.id)) m.set(b.id, b.text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).join('\n'));
  return m;
};
export function changedIds(before, after) {
  const a = reqLines(before);
  const b = reqLines(after);
  return [...new Set([...a.keys(), ...b.keys()])].filter((id) => a.get(id) !== b.get(id)).sort();
}

// A requirement retired in a split: its line now carries a `*(retired: ...)*` mark it did not
// carry before. A retirement moves the requirement and changes no behaviour, so it notifies no
// user (coordinator, 4 Nov: instance-setup's split notified 17 modules of 28 retired ids).
const RETIRED = /\*\(retired\b[^)]*\)\*/i;
export function retiredIds(before, after, ids) {
  const a = reqLines(before);
  const b = reqLines(after);
  return ids.filter((id) => RETIRED.test(b.get(id) || '') && !RETIRED.test(a.get(id) || ''));
}

// The modules file (`modules_file`) at ref (or the working tree): its modules, [] when unread;
// null without a modules file configured or present.
export function readModules(root, cfg, ref = null) {
  const f = cfg.modules_file;
  if (!f) return null;
  let text = null;
  if (ref) text = exists(root, ref, f) ? git(['show', `${ref}:${f}`], { cwd: root }) : null;
  else if (existsSync(join(root, f))) text = readFileSync(join(root, f), 'utf8');
  if (text === null) return null;
  try { const m = JSON.parse(text || '{}').modules; return Array.isArray(m) ? m : []; } catch { return []; }
}

// The modules that name the provider in their `uses`, from the modules file at ref (or the
// working tree); none without a modules file.
export function usersOf(root, cfg, provider, ref = null) {
  const modules = readModules(root, cfg, ref) || [];
  return modules.filter((m) => m?.id && m.id !== provider && (m.uses || []).includes(provider)).map((m) => m.id).sort();
}

// The provider module's own source: a file under the entry's paths that is not under its tests,
// not its requirements file, entry or metrics, not a doc (Markdown, or under a docs/ directory)
// and not a record (`records`). A change to any other file cannot alter a user's behaviour.
const isDoc = (f) => /\.(md|markdown)$/i.test(f) || /(^|\/)docs\//.test(f);
export function isSource(cfg, e, f) {
  if (!(e.paths || []).some((p) => underPath(f, p))) return false;
  if ((e.tests || []).some((p) => underPath(f, p))) return false;
  if (f === e.requirements || f === entryFile(e.id) || f === metricsFile(e.id)) return false;
  return !isDoc(f) && !isRecordPath(cfg, f);
}
// The entry's source paths, as a line names them: its paths less tests, requirements, docs, records.
export const sourcePaths = (cfg, e) => (e.paths || []).filter((p) => !(e.tests || []).some((t) => underPath(p, t)) && p !== e.requirements && !isDoc(p) && !isRecordPath(cfg, p));
export const sourceChanges = (root, cfg, e, base, head) => diffNames(root, base, head).filter((f) => isSource(cfg, e, f));
export const readEntry = (root, ref, id) => {
  const t = git(['show', `${ref}:${entryFile(id)}`], { cwd: root, allowFail: true });
  try { return t.code === 0 ? JSON.parse(t.stdout) : null; } catch { return null; }
};

// The notice a merged job leaves, or null, and why not. A job that changed a file of the provider's
// own source (the entry at base) leaves one whether or not its requirement file changed
// (coordinator, 4 Nov: ai-accounts' T53 rewrite changed its exported interface with no mark
// changed, and four users broke unwarned); it names the changed requirement ids and the export
// names added, removed or changed (exports.mjs). A job that changed only tests, requirements text,
// docs or records leaves none. With no entry readable, a requirement change still counts, so a
// notice is never lost to a bad read. The users are read at usersAt, the merged result (the
// tranche may have gained a user).
export function providerChange(root, cfg, { provider, requirements, base, head, pr, usersAt = head, entry }) {
  const at = (ref) => (requirements ? git(['show', `${ref}:${requirements}`], { cwd: root, allowFail: true }).stdout : '');
  const [was, now] = [at(base), at(head)];
  const changed = changedIds(was, now);
  const retired = retiredIds(was, now, changed);
  const ids = changed.filter((id) => !retired.includes(id));
  const left = retired.length ? `left out ${retired.length} retired id(s), which change no behaviour: ${retired.join(', ')}` : null;
  const e = entry || readEntry(root, base, provider);
  const src = e ? sourceChanges(root, cfg, e, base, head) : [];
  if (!ids.length && !src.length) return { notice: null, why: retired.length ? `PR ${pr} only retired requirements (${retired.join(', ')}), which change no behaviour` : null, retired };
  const users = usersOf(root, cfg, provider, usersAt);
  if (!users.length) return { notice: null, why: null, retired };
  if (e && !src.length) {
    return { notice: null, retired, why: `PR ${pr} changed ${ids.join(', ')} but no file of ${provider}'s source (${sourcePaths(cfg, e).join(', ') || 'no source paths'}): only tests, requirements text, docs or records, which cannot change a user's behaviour; no notice for its ${users.length} user(s)` };
  }
  const notice = { key: noticeKey(provider, pr), provider, ids, pr, users };
  if (src.length) {
    notice.source = src.length;
    Object.assign(notice, readExports(root, cfg, e, base, head));
  }
  return { notice, why: null, retired, left };
}
// A provider's export changes over base..head, as a notice records them: `exports` when any name
// moved, `exports_unread` when they could not be read, and `exports_read` (the range and the entry
// files read) whenever they were read (PD-20: triage trusts "exports unchanged" only with it).
export function readExports(root, cfg, e, base, head) {
  try {
    const { files, unread, ...x } = exportRead(root, base, head, { isProviderSource: (f) => isSource(cfg, e, f), inProvider: (f) => [...(e.paths || []), ...(e.tests || [])].some((p) => underPath(f, p)), providerPaths: sourcePaths(cfg, e) });
    const moved = anyExportChange(x) ? { exports: x } : {};
    // The brief's "anything unread stays owed" (coordinator, 9 Nov): export forms the surface does not read.
    if (unread.length) return { ...moved, exports_unread: `TypeScript export forms the surface does not read in ${unread.slice(0, 3).join(', ')}${unread.length > 3 ? ` and ${unread.length - 3} more` : ''}` };
    return { ...moved, exports_read: { base, head, files } };
  } catch (err) { return { exports_unread: String(err.message || err).slice(0, 200) }; }
}
export const providerNotice = (root, cfg, opts) => providerChange(root, cfg, opts).notice;

// One file per write, added and never edited (REC-2's one writer, as messages/<sender>.jsonl):
// two merges close together never conflict. notices/<provider>-<pr>.json, and
// notices/answered/<user>-<provider>-<pr>.json.
export const NOTICES_DIR = 'notices';
const fileOf = (key) => key.replace(':', '-');
export const noticeFile = (key) => `${NOTICES_DIR}/${fileOf(key)}.json`;
export const answerFile = (user, key) => `${NOTICES_DIR}/answered/${user}-${fileOf(key)}.json`;
const listJson = (root, sb, dir) => {
  const r = git(['ls-tree', '--name-only', '-z', `refs/remotes/origin/${sb}:${dir}`], { cwd: root, allowFail: true });
  if (r.code !== 0) return [];
  return r.stdout.split('\0').filter((f) => f.endsWith('.json')).flatMap((f) => { try { return [JSON.parse(readState(root, sb, `${dir}/${f}`))]; } catch { return []; } });
};

export const WITHDRAWN_DIR = `${NOTICES_DIR}/withdrawn`;
export const withdrawFile = (key) => `${WITHDRAWN_DIR}/${fileOf(key)}.json`;

// The keys of withdrawn notices, as the fetched state branch holds them.
export const withdrawnRows = (root, sb) => listJson(root, sb, WITHDRAWN_DIR).filter((r) => r.row === 'withdrawn' && typeof r.key === 'string');
export const withdrawnKeys = (root, sb) => new Set(withdrawnRows(root, sb).map((r) => r.key));
// Every notice the state branch holds, live or withdrawn, with its unanswered users: the one reader
// behind notices (the live ones), triage, status and report tranche's count (coordinator, 4 Nov: a
// count of notices/*.json read apart from the withdrawn rows called 136 withdrawn slots open on the
// copy, which triage then could not find). A withdrawn notice carries its withdrawal row: closed,
// owing nothing, its unanswered users counted as closed by the withdrawal.
export function noticeRecords(root, sb) {
  const answered = new Set(listJson(root, sb, `${NOTICES_DIR}/answered`).map((r) => `${r.key}\0${r.user}`));
  const withdrawn = new Map(withdrawnRows(root, sb).map((r) => [r.key, r]));
  return listJson(root, sb, NOTICES_DIR).filter((r) => r.row === 'notice' && typeof r.key === 'string' && Array.isArray(r.users)).sort((a, b) => a.pr - b.pr)
    .map((n) => ({ ...n, open: n.users.filter((u) => !answered.has(`${n.key}\0${u}`)), withdrawn: withdrawn.get(n.key) || null }));
}

// Every notice with the users that have not answered it, as the fetched state branch holds them;
// a withdrawn notice (notice withdraw) is no notice.
export const notices = (root, sb) => noticeRecords(root, sb).filter((n) => !n.withdrawn).map(({ withdrawn, ...n }) => n);
export const unanswered = (root, sb, user) => notices(root, sb).filter((n) => n.open.includes(user));
// What a notice says moved: its requirement ids (or its source, when none changed), and its export
// names removed, changed and added, at most `max` of each named.
const few = (xs, max) => (xs.length > max ? `${xs.slice(0, max).join(', ')} and ${xs.length - max} more` : xs.join(', '));
export function exportsText(x, max = 8) {
  if (!x) return '';
  return [['removed', x.removed], ['changed', (x.changed || []).map((c) => c.name)], ['added', x.added]]
    .filter(([, xs]) => xs?.length).map(([w, xs]) => `${w} ${few(xs, max)}`).join('; ');
}
export const movedText = (n, max = 8) => [n.ids?.length ? n.ids.join(', ') : 'its source, no requirement text', n.exports ? `exports ${exportsText(n.exports, max)}` : ''].filter(Boolean).join('; ');
export const noticeLine = (n) => `provider notice: ${n.provider} ${movedText(n)} (PR ${n.pr})`;

// At a job's merge: the notice it leaves, and the notices its START named, answered by it. One
// write; a file already there is kept, so a rerun adds nothing.
// The answers come from the job's own start row, which the job can edit: only a key of a notice
// the state branch holds for this user is answered (confirming review of PR 54), and no file
// lands outside notices/ (a key such as "a/../../x" would otherwise reach past the worktree).
export function recordAtMerge(root, cfg, { notice, answers = [], user, pr }) {
  const at = new Date().toISOString();
  const sb = cfg.state_branch;
  const have = fetchState(root, sb, { fresh: true });
  if (answers.length) {
    const known = new Set(have ? notices(root, sb).filter((n) => n.users.includes(user)).map((n) => n.key) : []);
    answers = [...new Set(answers)].filter((k) => typeof k === 'string' && known.has(k));
  }
  const want = [
    ...(notice ? [[noticeFile(notice.key), { row: 'notice', at, ...notice }]] : []),
    ...answers.map((key) => [answerFile(user, key), { row: 'answered', at, key, user, pr }]),
  ];
  if (!want.length) return { rows: [] };
  const missing = (has) => want.filter(([f]) => !has(f));
  if (have && !missing((f) => readState(root, sb, f) !== null).length) return { rows: [] };
  return writeState(root, sb, `provider notices at the merge of PR ${pr}`, (wt) => {
    const dir = resolve(wt, NOTICES_DIR) + sep;
    for (const [f] of want) if (!resolve(wt, f).startsWith(dir)) throw new Error(`refused: ${f} is outside ${NOTICES_DIR}/`);
    const add = missing((f) => existsSync(join(wt, f)));
    for (const [f, row] of add) {
      mkdirSync(dirname(join(wt, f)), { recursive: true });
      writeFileSync(join(wt, f), JSON.stringify(row) + '\n');
    }
    return { rows: add.map(([, row]) => row) };
  });
}

// A merged pull request's range as GitHub merged it: the merge commit m, the job's head m^2, and
// the merge base of m's two parents. A shallow clone fetched m at depth 50 and asked git for the
// base, which died once the base lay 50 or more commits back on either side (defect sweep 4 Nov,
// #8). Now a shallow clone fetches m and its parents (depth 2), takes the base from GitHub's
// compare (merge_base_commit) and fetches it at depth 1: only the trees at the base and m^2 are
// read. A full clone asks git. `what` ends the refusals ("what it changed cannot be read").
export function mergedRange(root, m, { slug, n, what = 'what it changed cannot be read', read = compare } = {}) {
  const has = (rev) => git(['rev-parse', '-q', '--verify', `${rev}^{commit}`], { cwd: root, allowFail: true }).code === 0;
  const shallow = isShallow(root);
  if (!has(`${m}^1`)) git(['fetch', '-q', ...(shallow ? ['--depth=2'] : []), 'origin', m], { cwd: root, allowFail: true });
  if (!has(m)) fail(`pull request ${n} merged at ${m.slice(0, 10)}, which could not be fetched; ${what}`);
  const head = git(['rev-parse', `${m}^2`], { cwd: root, allowFail: true });
  if (head.code !== 0) fail(`pull request ${n} merged at ${m.slice(0, 10)}, which is not a merge commit; ${what}`);
  const h = head.stdout.trim();
  const p1 = git(['rev-parse', `${m}^1`], { cwd: root });
  if (!shallow) {
    const mb = git(['merge-base', p1, h], { cwd: root, allowFail: true });
    if (mb.code !== 0) fail(`pull request ${n}: no merge base of ${p1.slice(0, 10)} and ${h.slice(0, 10)}; ${what}`);
    return { head: h, mb: mb.stdout.trim() };
  }
  const sha = slug ? read(slug, p1, h)?.merge_base_commit?.sha : null;
  if (!/^[0-9a-f]{40,64}$/.test(sha || '')) fail(`this clone is shallow and GitHub did not give the merge base of pull request ${n} (${p1.slice(0, 10)} and ${h.slice(0, 10)}); ${what}; run it again`);
  if (!has(sha)) git(['fetch', '-q', '--depth=1', 'origin', sha], { cwd: root, allowFail: true });
  if (!has(sha)) fail(`this clone is shallow and could not fetch the merge base ${sha.slice(0, 10)} of pull request ${n}; ${what}; run it again`);
  return { head: h, mb: sha };
}

// notice withdraw <provider>:<pr>: BOB's act, for a notice recorded before merge held the source
// rule. The tool reads the PR's merge commit (as merge run again on a merged pull request does)
// and refuses unless the PR changed no file of the provider's own source; then one file on the
// state branch, added and never edited, and status drops the notice.
//
// PD-18: a notice whose pull request GitHub definitively says does not exist in the product
// repository (prPresence: GitHub's 404 on the pulls endpoint while the repository is served, and the
// number no PR on the issues endpoint either) is withdrawn too, its row `missing: true`: nothing can
// ever be read for it, so nothing can ever answer it. The presence is read only when getPR fails, and
// any answer short of that (a network error, a 5xx, a rate limit, a 403) refuses as before.
export function readNoticePR(slug, n, { getPR, presence = prPresence }) {
  try { return { pr: getPR(slug, n) }; } catch (err) {
    let p;
    try { p = presence(slug, n); } catch { throw err; }
    if (p?.missing !== true || typeof p.status !== 'string' || !p.status) throw err;
    return { missing: { status: p.status, why: `PR ${n} does not exist in ${slug} (GitHub ${p.status})` } };
  }
}
// Whether this repository's own history holds a merge of PR n, on the tranche or main: 'merged',
// 'none', or 'unknown' (read failed: the caller fails closed). GitHub hides a suspended account's
// PRs and answers 404 for them (copy run 42277392893, 7 Nov), so a 404 alone cannot tell a hidden
// real PR from one that never existed (cold review of C48); its merge commit stays on the branch.
// The merge tool titles it "Merge PR n: ...", GitHub's button "Merge pull request #n from ...", a
// squash "... (#n)". A full clone reads its own fetched refs. A shallow clone is not deepened (a
// date fetch can also cut history the merge train fetched deep): a throwaway bare clone of each
// branch back to a week before the notice's own time (the notice is written at its PR's merge) is
// read instead; a notice without a readable time is 'unknown' there.
export const MERGE_SUBJECT = (n) => new RegExp(`^Merge PR ${n}:|^Merge pull request #${n} |\\(#${n}\\)$`);
export function mergedHere(root, cfg, n, { at = null } = {}) {
  const refs = [...new Set([cfg.tranche, 'main'].filter(Boolean))];
  const hit = (dir, revs) => {
    const r = git(['log', '--format=%s', ...revs], { cwd: dir, allowFail: true });
    if (r.code !== 0) return null;
    return r.stdout.split('\n').some((l) => MERGE_SUBJECT(n).test(l.trim()));
  };
  if (!isShallow(root)) {
    for (const ref of refs) if (git(['fetch', '-q', 'origin', `+refs/heads/${ref}:refs/remotes/origin/${ref}`], { cwd: root, allowFail: true }).code !== 0) return 'unknown';
    const h = hit(root, refs.map((r) => `refs/remotes/origin/${r}`));
    return h === null ? 'unknown' : h ? 'merged' : 'none';
  }
  const t = Date.parse(at || '');
  if (!Number.isFinite(t)) return 'unknown';
  const since = new Date(t - 7 * 24 * 3600 * 1000).toISOString();
  const url = git(['remote', 'get-url', 'origin'], { cwd: root, allowFail: true });
  if (url.code !== 0) return 'unknown';
  return withTemp('p3-merged-', (dir) => {
    for (const ref of refs) {
      const d = join(dir, ref.replace(/[^\w.-]/g, '_'));
      const c = git(['clone', '-q', '--bare', '--filter=blob:none', `--shallow-since=${since}`, '--single-branch', '--branch', ref, url.stdout.trim(), d], { cwd: dir, allowFail: true });
      if (c.code !== 0) return 'unknown';
      const h = hit(d, [ref]);
      if (h === null) return 'unknown';
      if (h) return 'merged';
    }
    return 'none';
  });
}
const writeWithdrawn = (root, sb, key, row) => writeState(root, sb, `withdraw provider notice ${key}`, (wt) => {
  const f = join(wt, withdrawFile(key));
  if (!resolve(f).startsWith(resolve(wt, NOTICES_DIR) + sep)) throw new Error(`refused: ${withdrawFile(key)} is outside ${NOTICES_DIR}/`);
  mkdirSync(dirname(f), { recursive: true });
  if (!existsSync(f)) writeFileSync(f, JSON.stringify(row) + '\n');
  return {};
});
export function withdrawNotice(root, cfg, key, { getPR, presence = prPresence, merged = mergedHere, slug, as = 'bob', log = console.log, compare: compareRead = compare }) {
  const sb = cfg.state_branch;
  if (!fetchState(root, sb, { fresh: true })) fail(`no ${sb} on origin: no provider notice ${key}`);
  const n = notices(root, sb).find((x) => x.key === key);
  if (!n) fail(readState(root, sb, withdrawFile(key)) !== null ? `provider notice ${key} is already withdrawn` : `no provider notice ${key} on ${sb} (${noticeFile(key)})`);
  // The row's own PR number, as its key names it (a hand-edited "12x" would 404 for a real PR 12).
  if (!Number.isInteger(n.pr) || n.pr < 1 || n.key !== noticeKey(n.provider, n.pr)) fail(`refused: provider notice ${key} names pull request ${JSON.stringify(n.pr)}, not the whole number its key names`);
  const { pr, missing } = readNoticePR(slug, n.pr, { getPR, presence });
  if (missing) {
    const here = merged(root, cfg, n.pr, { at: n.at });
    if (here !== 'none') fail(here === 'merged'
      ? `refused: GitHub serves no pull request ${n.pr} in ${slug} (${missing.status}), but this repository's history holds its merge: a real PR GitHub hides; provider notice ${key} stands`
      : `refused: GitHub serves no pull request ${n.pr} in ${slug} (${missing.status}), but whether this repository's history holds its merge could not be read; provider notice ${key} stands; run it again`);
    const row = { row: 'withdrawn', at: new Date().toISOString(), key, provider: n.provider, pr: n.pr, by: as, why: missing.why, missing: true, users: n.users.length };
    writeWithdrawn(root, sb, key, row);
    log(`provider notice ${key} withdrawn: ${row.why}; ${n.open.length} unanswered user(s) no longer owe it`);
    return row;
  }
  const m = pr?.merge_commit_sha;
  if (!pr?.merged || !m) fail(`pull request ${n.pr} is not merged: what it changed cannot be read`);
  const { head: h, mb } = mergedRange(root, m, { slug, n: n.pr, read: compareRead });
  const e = readEntry(root, mb, n.provider);
  if (!e) fail(`the tranche had no ledger entry for ${n.provider} at ${mb.slice(0, 10)}: its source paths cannot be read`);
  const src = sourceChanges(root, cfg, e, mb, h);
  if (src.length) fail(`refused: pull request ${n.pr} changed ${src.length} file(s) of ${n.provider}'s source (${src.slice(0, 5).join(', ')}); provider notice ${key} stands`);
  const row = { row: 'withdrawn', at: new Date().toISOString(), key, provider: n.provider, pr: n.pr, merge_commit: m, by: as,
    why: `PR ${n.pr} changed no file of ${n.provider}'s source (${sourcePaths(cfg, e).join(', ') || 'no source paths'})`, users: n.users.length };
  writeWithdrawn(root, sb, key, row);
  log(`provider notice ${key} withdrawn: ${row.why}; ${n.open.length} unanswered user(s) no longer owe it`);
  return row;
}

// ===== file: developer-steps.mjs =====

// The developer's steps (setup/DEVELOPER.md) checked against setup/conditions.json; moved here
// from setup.mjs (build J), since only the tests use it.
import { dirname, join } from 'node:path';
import { CONDITIONS, loadConditions } from '../lib/setup.mjs';

// The steps against the list: each step complete, naming only
// conditions that are the developer's; every developer condition with a step; the deny lines
// the page prints equal to the deny-list condition's. Returns the problems.
export const DEVELOPER = join(dirname(CONDITIONS), 'DEVELOPER.md');
export const isDeveloper = (c) => /^the developer\b/.test(c.who);
export function developerSteps(text) {
  return text.split(/^## /m).slice(1).filter((s) => /^Step \d+\./.test(s)).map((s) => ({
    title: s.split('\n')[0],
    body: s,
    parts: ['Why:', 'Clicks:', 'How BOB confirms:', 'Sets:'].filter((p) => new RegExp(`^${p}`, 'm').test(s)),
    // A "Sets: none" line names no condition, whatever its reason mentions (review of PR 24).
    sets: /^Sets: none\b/m.test(s) ? [] : [...(s.match(/^Sets:(.*)$/m)?.[1] || '').matchAll(/`([^`]+)`/g)].map((m) => m[1]),
  }));
}
export function checkDeveloperSteps(text, conditions = loadConditions()) {
  const problems = [];
  const steps = developerSteps(text);
  const byId = new Map(conditions.map((c) => [c.id, c]));
  if (!steps.length) problems.push('no steps');
  for (const s of steps) {
    const lack = ['Why:', 'Clicks:', 'How BOB confirms:', 'Sets:'].filter((p) => !s.parts.includes(p));
    if (lack.length) problems.push(`${s.title}: lacks ${lack.join(', ')}`);
    // A step that names no condition says why (Bob, 2 Nov): "Sets: none, because ..." or "none; ...".
    if (s.parts.includes('Sets:') && !s.sets.length && !/^Sets: none(,? because|;)\s+\S+(\s+\S+){3,}/m.test(s.body)) problems.push(`${s.title}: names no condition and does not say why`);
    // Every website edit that may become a pull request says to set its base to the tranche.
    const commits = (s.body.match(/\*\*Commit changes\.\.\.\*\*/g) || []).length;
    if (commits && (s.body.match(/set \*\*base\*\* to the tranche, not `main`/g) || []).length < commits) problems.push(`${s.title}: a website commit that does not say to set base to the tranche, not main`);
    for (const id of s.sets) {
      if (!byId.has(id)) problems.push(`${s.title}: names ${id}, which is not in the list`);
      else if (!isDeveloper(byId.get(id))) problems.push(`${s.title}: names ${id}, which is not the developer's`);
    }
  }
  const named = new Set(steps.flatMap((s) => s.sets));
  for (const c of conditions.filter(isDeveloper)) if (!named.has(c.id)) problems.push(`${c.id} is the developer's and has no step`);
  // The deny step shows the whole .claude/settings.json, as valid JSON, its deny list the list's.
  const deny = byId.get('deny-list')?.value?.deny;
  const step = steps.find((s) => s.sets.includes('deny-list'));
  if (deny && step) {
    let shown;
    try { shown = JSON.parse(step.body.match(/```json\n([\s\S]*?)```/)?.[1] ?? ''); } catch { shown = undefined; }
    if (!shown || typeof shown !== 'object') problems.push('the deny step does not show the whole .claude/settings.json as valid JSON');
    else if (JSON.stringify(shown.permissions?.deny) !== JSON.stringify(deny)) problems.push('the deny lines on the page differ from the deny-list condition');
  }
  // The number of steps stated at the top is the number of steps.
  const stated = text.match(/^There are (\d+) steps\b/m)?.[1];
  if (Number(stated) !== steps.length) problems.push(`the page says ${stated ?? 'no number of'} steps, and has ${steps.length}`);
  steps.forEach((s, i) => { if (!s.title.startsWith(`Step ${i + 1}.`)) problems.push(`${s.title}: out of order, expected Step ${i + 1}`); });
  if (/[\u2014\u2013]/.test(text)) problems.push('an em-dash');
  return problems;
}

// ===== file: ends.mjs =====

// Self-ending records (R13; Bob, 6 Nov, about 17:00Z: "Go with option 2, fix it in the tool, not
// just for this case, but fix process3 to anticipate and address these kinds of situations").
// The case: holds hold-19 to hold-22, set "until layer 6 closes … ends when the coordinator says",
// went on holding after layer 6 closed, and ending them by hand (`p3 hold --end`) was refused by
// the session permission judge as weakening security. The rule (Foundations, Bob's, 6 Nov):
// recorded state carries a checkable end condition, the tool ends it when the condition holds,
// and stale state is found and cleared by the process, not by hand.
//
// A condition is one of (the string form, as --when takes it, and the row's object form):
//   layer_closed:<n>      layer n is closed (layers/closed.jsonl on the state branch, this
//                         tranche) or merged (layerflow/<n>/merged.json);
//   layer_open:<n>        layer n is open (layerflow/<n>/open.json) or already closed;
//   pr_merged:<n>         pull request n landed on the tranche (its first-parent merges);
//   module_complete:<id>  the module's ledger entry on the tranche is COMPLETE;
//   session_gone:<id>     the session is archived in list_sessions' result (only where the
//                         caller passes the list; an id the list does not hold is unknown);
//   at:<ISO time>         the time has passed.
// A record holds a list of them, any of which ends it. Each check answers met (true), not met
// (false) or unknown (null: its fact could not be read); only met ends a record.
//
// The inventory of recorded state that carries a condition or can go stale (state branch unless
// said), and how each ends (notes/records-inventory.md keeps the table):
//   holds (holds/holds.jsonl)            --prs, --until, --when: ENDED BY THE TOOL here; old
//                                        free-text rows read through fromText;
//   starts owed (flow/owed.json)         paid by the module's land on its layer (layer land),
//                                        by the tool already;
//   reschedules (layerflow/<n>)          answered by the user's land holding the provider's land,
//                                        by the tool already (layerflow outstanding);
//   layer events (layerflow/<n>)         open ends at merged, by the tool already;
//   lane seats (lanes/sessions.jsonl)    session_gone: ENDED BY THE TOOL at the sweep, which
//                                        reads list_sessions;
//   lane asks (lanes/asks.jsonl)         a recorded decision ends it (lane ask --record); STALE
//                                        when its lane is no longer configured: reported;
//   triage owed (notices/triage/owed)    triage recorded ends it, by the tool already;
//   role addresses (addresses/*.json)    session_gone: REPORTED (a role's address changes only
//                                        by handover or address, which name the next session);
//   config ids (coordinator)             session_gone: REPORTED (config changes by pull request);
//   BLOCKED marks (ledger)               a person's ruling: no condition the tool can check;
//                                        reported with their age by status already;
//   merger lease, in flight, plain queue the train's (being removed): time-limited already.
import { jsonl, readState } from './state.mjs';
import { LEDGER_DIR, git } from './util.mjs';

export const KINDS = ['layer_closed', 'layer_open', 'pr_merged', 'module_complete', 'session_gone', 'at'];
const SHAPE = {
  layer_closed: /^\d+$/, layer_open: /^\d+$/, pr_merged: /^[1-9]\d*$/,
  module_complete: /^[A-Za-z0-9._-]+$/, session_gone: /^session_[A-Za-z0-9]+$/, at: /^\d{4}-\d\d-\d\dT[\d:.]+Z$/,
};

// "layer_closed:6" -> { layer_closed: 6 }; throws a plain Error naming the form when it is not one.
export function parseCondition(s) {
  const m = String(s ?? '').trim().match(/^([a-z_]+):(.+)$/);
  if (!m || !KINDS.includes(m[1]) || !SHAPE[m[1]].test(m[2]) || (m[1] === 'at' && !Number.isFinite(Date.parse(m[2])))) {
    throw new Error(`${JSON.stringify(s)} is not a condition: ${KINDS.map((k) => `${k}:<${k === 'at' ? 'ISO time' : k.endsWith('gone') ? 'session id' : k === 'module_complete' ? 'module' : 'n'}>`).join(', ')}`);
  }
  return { [m[1]]: /^(layer_|pr_)/.test(m[1]) ? Number(m[2]) : m[2] };
}
export const parseConditions = (s) => String(s ?? '').split(',').map((x) => x.trim()).filter(Boolean).map(parseCondition);
