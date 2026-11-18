// ===== file: hold.test.mjs (continued) =====

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

// ===== file: setup-speed.test.mjs =====

// setup check at the copy's scale (C50; Bob, 9 Nov: "Let's fix as many of them as we can"). In the
// copy (about 1100 pull requests, 220 modules, a large state branch) `setup check --at HEAD` took
// about 15 minutes, twice a pin move: thousands of git spawns, one per state row, ledger entry,
// approvals commit and module, and a fetch per commit of the approvals history. These tests bound
// the git spawns (not the wall time, which a loaded runner moves) on a fixture at that scale, so a
// read per module, per commit or per row cannot creep back, and rehearse a pin move's two checks
// end to end through the CLI (PD-17).
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { appendFileSync, cpSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { setupCheck } from '../lib/setup.mjs';
import { beforeAct, idleCheck } from '../lib/sweep.mjs';
import { ownerBlock } from '../lib/record.mjs';
import { SPAWNS, git, loadConfig } from '../lib/util.mjs';
import { commit, makeRepo } from './helpers.mjs';
import { fakeGh, scaleFixture, stubGitHub } from './scale-fixture.mjs';

const TOOL = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
// Every git and gh the tool starts while fn runs, by command.
function counted(fn) {
  const before = { ...SPAWNS.counts };
  let fetch = 0;
  const was = SPAWNS.trace;
  SPAWNS.trace = (cmd, args) => { if (cmd === 'git' && args.includes('fetch')) fetch++; };
  let out;
  try { out = fn(); } finally { SPAWNS.trace = was; }
  const n = (k) => (SPAWNS.counts[k] || 0) - (before[k] || 0);
  return { out, git: n('git'), gh: n('gh'), fetch };
}
const fetches = (log) => (existsSync(log) ? readFileSync(log, 'utf8').split('\n').filter((l) => / fetch /.test(` ${l} `)).length : 0);
