// ===== file: measures.test.mjs (continued) =====

  git(['update-ref', 'refs/remotes/origin/job/c', 'HEAD'], { cwd: root });
  git(['reset', '-q', '--hard', back], { cwd: root });
  const cfg = loadConfig(root);
  const lt = leadTimes(root, cfg, {
    ref: 'HEAD', rows, layers: new Map([['a', 1], ['b', 2]]), now: t(200), restarts: [],
    jobRefs: new Map([['a', 'HEAD'], ['b', 'HEAD'], ['c', 'refs/remotes/origin/job/c']]),
    grants: [{ row: 'grant', tranche: 'tranche', at: t(1), outcome: 'ok' }, { row: 'grant', tranche: 'tranche', at: t(3), outcome: 'refused' }], closed: [{ row: 'closed', tranche: 'tranche', layer: 1, at: t(50) }],
    msgs: [{ from: 'a', n: 1, to: 'bob', at: t(10), text: 'report' }, { from: 'bob', n: 1, to: 'a', at: t(50), text: 'a-1: done' }, { from: 'a', n: 2, to: 'bob', at: t(150), text: 'again' }],
    comments: () => [{ ok: false, at: t(105) }, { ok: true, at: t(110) }],
  });
  const a = lt.jobs.find((j) => j.module === 'a');
  const b = lt.jobs.find((j) => j.module === 'b');
  assert.deepEqual(pick(a.ready_to_start), { minutes: 4, target: 10 });
  assert.deepEqual(a.start_to_pr_ready, { minutes: 95, attempt: 1 });
  assert.deepEqual(a.green_to_merge, { minutes: 20, target: 15, mark: 'over', attempt: 1 });
  assert.deepEqual(a.blocked, { minutes: 45 }, 'blocked has no target: replace has');
  assert.deepEqual(a.replace, [{ from: t(40), minutes: 45, stopped_by: 'BLOCKED', source: 'blocked', resumed: t(85), target: 30, mark: 'over' }]);
  assert.deepEqual(a.report_wait, [{ from: 'a', n: 1, to: 'bob', minutes: 40, target: 30, mark: 'over' }, { from: 'a', n: 2, to: 'bob', minutes: 50, open: true, target: 30, mark: 'over' }]);
  assert.deepEqual(pick(b.ready_to_start), { minutes: 20, target: 10, mark: 'over' });
  assert.deepEqual(lt.jobs.find((j) => j.module === 'c').blocked, { minutes: 50, open: true });
  assert.deepEqual(lt.close_to_next_start, [{ layer: 1, minutes: 20, target: 10, mark: 'over' }]);
  assert.equal(a.ready_to_start.minutes, 4, 'from the last ok grant row, not the refused one');
  assert.deepEqual(lt.summary.green_to_merge, { n: 1, median: 20, worst: 20, target: 15, median_mark: 'over', worst_mark: 'over' });
  assert.equal(lt.summary.report_wait.n, 1, 'an open wait is not in the median');
  assert.equal(lt.targets.merge_minutes, 15);
  // Rows missing: the opening read, but no layer close, message or gate row, nor a job branch.
  const none = leadTimes(root, cfg, { ref: 'HEAD', rows, layers: new Map([['a', 2], ['b', 1]]), grants: [{ row: 'grant', tranche: 'tranche', at: t(1), outcome: 'ok' }], comments: () => { throw new Error('offline'); } });
  assert.equal(none.jobs[0].ready_to_start, 'unmeasured');
  assert.equal(none.jobs[0].green_to_merge, 'unmeasured');
  assert.equal(none.jobs[0].report_wait, 'unmeasured');
  assert.equal(none.jobs[0].blocked, 'unmeasured');
  assert.equal(none.jobs[0].replace, 'unmeasured');
  assert.equal(none.close_to_next_start, 'unmeasured');
  // process/config.json's targets: a partial one keeps the other defaults.
  commit(root, { 'process/config.json': { tranche: 'tranche', targets: { merge_minutes: 45 } } }, 'targets');
  assert.deepEqual(loadConfig(root).targets, { start_minutes: 10, merge_minutes: 45, decision_minutes: 30, replace_minutes: 30 });
  commit(root, { 'process/config.json': { tranche: 'tranche' } }, 'targets back');
  // A target from process/config.json replaces its default.
  assert.equal(leadTimes(root, { ...cfg, targets: { ...cfg.targets, merge_minutes: 30 } }, { ref: 'HEAD', rows, grants: [{ row: 'grant', tranche: 'tranche', at: t(1), outcome: 'ok' }], comments: () => [{ ok: true, at: t(110) }] }).jobs[0].green_to_merge.mark, undefined);
  assert.equal(reportWaits([{ from: 'bob', n: 3, to: 'root', at: t(0) }, { from: 'root', n: 1, to: 'bob', at: t(5), text: 'bob-3 ok' }], t(9))[0].minutes, 5);
  // Both reports print them.
  commit(root, { 'process/metrics/a.jsonl': rows.map((r) => JSON.stringify(r)).join('\n') + '\n' }, 'rows');
  git(['push', '-q', 'origin', 'HEAD:tranche'], { cwd: root });
  git(['fetch', '-q', 'origin'], { cwd: root });
  const md = trancheReport(root, cfg, { now: t(200), io: { merged: () => null, comments: () => [], compare: () => null } });
  assert.match(md, /## Lead times[\s\S]*Per job: unmeasured \(the tranche's opening not read\)/);
  assert.match(md, /- green to merge: unmeasured/);
  // With the state branch read, each report measures from its rows: this tranche's open and a layer close.
  const sha = git(['rev-parse', 'HEAD'], { cwd: root });
  onState(root, {
    'metrics/tranche-open.jsonl': JSON.stringify({ row: 'grant', tranche: 'tranche', at: t(1), outcome: 'ok', act: 'push', depth: 1 }) + '\n',
    'layers/closed.jsonl': JSON.stringify({ row: 'closed', tranche: 'tranche', layer: 1, at: t(50), commit: sha }) + '\n',
  });
  commit(root, { 'build/layers.md': '| 1 | a |\n| 2 | b |\n' }, 'layers');
  git(['push', '-q', 'origin', 'HEAD:tranche'], { cwd: root });
  git(['push', '-q', 'origin', 'refs/remotes/origin/process-state:refs/heads/process-state'], { cwd: root });
  git(['fetch', '-q', 'origin'], { cwd: root });
  const md2 = trancheReport(root, cfg, { now: t(200), stateRead: true, io: { state: (p) => readState(root, 'process-state', p), merged: () => null, comments: () => [], compare: () => null } });
  assert.match(md2, /\| a \| 4 min \(target 10\) \|/);
  assert.match(md2, /layer close to next job start: layer 1 20 min \(target 10, over\)/);
  const mr = await cli(root, ['metrics', 'report'], { GITHUB_REPOSITORY: 'o/r' });
  const lead = JSON.parse(mr.out).lead_times;
  assert.deepEqual(pick(lead.jobs.find((j) => j.module === 'a').ready_to_start), { minutes: 4, target: 10 });
  assert.deepEqual(lead.close_to_next_start, [{ layer: 1, minutes: 20, target: 10, mark: 'over' }]);
});

// ===== file: slots.test.mjs =====

// PD-7 (coordinator, 7 Nov): a published job does not hold a job slot. The job cap counts jobs still
// working toward publish; a published job (its pull request into the layer ready) holds none while
// its gate is pending or green; when its newest gate run on its head is red it resumes and holds a
// slot again; the account's live sessions stay printed.
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { capCheck, countedLines } from '../lib/cap.mjs';
import { gateRed, newestGate, publishedJobs, slotUse } from '../lib/slots.mjs';
import { writeState } from '../lib/state.mjs';
import { flow, liveJobIds } from '../lib/status.mjs';
import { SWEEP_ROWS_FILE, idleCheck, knownJobIds } from '../lib/sweep.mjs';
import { flowFile } from '../lib/layerbase.mjs';
import { writeRows } from '../lib/layerflow.mjs';
import { configOf, fail, git } from '../lib/util.mjs';
import { makeRepo, setJobCap } from './helpers.mjs';

const P3 = 'node .process/tool/p3.mjs';
const SB = 'process-state';
const run = (conclusion, status = 'completed') => ({ status, conclusion });
// An open layer: p1..p5 published (PR 101..105 ready), w working, s startable.
const view = (n = 5, over = {}) => ({
  kind: 'open', n: 11,
  states: [...Array.from({ length: n }, (_, i) => ({ id: `p${i + 1}`, state: 'published', pr: 101 + i })), { id: 'w', state: 'working', pr: 200 }, { id: 's', state: 'not started' }],
  prs: [...Array.from({ length: n }, (_, i) => ({ number: 101 + i, draft: false, head: `h${i + 1}`, module: `p${i + 1}` })), { number: 200, draft: true, head: 'hw', module: 'w' }],
  startable: Array.from({ length: 30 }, (_, i) => ({ id: `m${i}`, cmd: `${P3} job start m${i} --sessions <file>` })),
  ready: false, ...over,
});
// p3's gate red; p4 running; p5 never run; the rest green.
const gates = { h3: run('failure'), h4: run(null, 'in_progress'), h5: null };
const gate = (pr) => (pr.head in gates ? gates[pr.head] : run('success'));
// A list_sessions result saved as JSON: one running job session per module named (C28: job start
// counts from it, never from a typed number).
const sessions = (ids) => {
  const file = join(mkdtempSync(join(tmpdir(), 'p3-sessions-')), 's.json');
  writeFileSync(file, JSON.stringify({ ccr: { data: ids.map((id) => ({ id: `session_${id}`, title: `job ${id}`, session_status: 'SESSION_STATUS_RUNNING' })) } }));
  return file;
};
const others = (n) => Array.from({ length: n }, (_, i) => `x${i + 1}`);
const twenty = () => sessions(['p1', 'p2', 'p3', 'p4', 'p5', 'w', ...others(14)]);

test('PD-7: a published job holds no slot while its gate is pending or green; red, it resumes and holds one; unread, it holds one', () => {
  assert.equal(gateRed(run('failure')), true);
  assert.equal(gateRed(run('timed_out')), true);
  assert.equal(gateRed(run('cancelled')), true, 'cancelled and newest: nothing will finish it, the job re-runs it');
  assert.equal(gateRed(run('stale')), true);
  assert.equal(gateRed(run(null, 'in_progress')), false);
  assert.equal(gateRed(null), false, 'not yet run: waiting on its gate');
  const pub = publishedJobs(view(), { gate });
  assert.deepEqual(pub.map((p) => [p.id, p.red]), [['p1', false], ['p2', false], ['p3', true], ['p4', false], ['p5', false]]);
  assert.deepEqual(publishedJobs({ kind: 'next', n: 12 }, { gate }), [], 'no open layer: none');
  const u = slotUse(18, pub);
  assert.deepEqual([u.live, u.working, u.free, u.resumed], [18, 14, ['p1', 'p2', 'p4', 'p5'], ['p3']]);
  // With list_sessions: a published job with no live session subtracts nothing.
  const listed = [{ title: 'job p1', session_status: 'SESSION_STATUS_IDLE' }, { title: 'job p2 (restart)' }, { title: 'job p4', session_status: 'SESSION_STATUS_ARCHIVED' }, { title: 'job w' }];
  assert.deepEqual([...liveJobIds(listed)].sort(), ['p1', 'p2', 'w']);
  assert.deepEqual(slotUse(4, pub, { jobIds: liveJobIds(listed) }).free, ['p1', 'p2']);
  // A gate read that fails: the job holds a slot (the safe side), named. GitHub unreadable reads as
  // undefined (checkRuns null), not as "no run" (null): the default reader tells them apart.
  const unread = publishedJobs(view(2), { gate: () => { throw new Error('gh: 502'); } });
  assert.deepEqual([slotUse(5, unread).working, slotUse(5, unread).unread], [5, ['p1', 'p2']]);
  let reads = 0;
  assert.equal(newestGate('o/p', 'x1', { read: () => { reads++; return null; } }), undefined, 'unreadable');
  assert.equal(newestGate('o/p', 'x2', { read: () => [] }), null, 'no run yet');
  const viaDefault = publishedJobs(view(1), { gate: (pr) => newestGate('o/p', pr.head, { read: () => null }) });
  assert.deepEqual([viaDefault[0].unread, slotUse(3, viaDefault).working], [true, 3]);
  // A completed run on a head is read once per command; one still running is read again.
  newestGate('o/p', 'x3', { read: () => { reads++; return [run('success')]; } });
  newestGate('o/p', 'x3', { read: () => { reads++; return [run('failure')]; } });
  newestGate('o/p', 'x4', { read: () => { reads++; return [run(null, 'in_progress')]; } });
  newestGate('o/p', 'x4', { read: () => { reads++; return [run(null, 'in_progress')]; } });
  assert.equal(reads, 1 + 1 + 2);
  assert.equal(slotUse(undefined, pub).working, null, 'unmeasured: no count');
});

test('PD-7: job start counts the jobs working toward publish; a resumed job counts; the full message names both counts', (t) => {
  setJobCap(t, 20);
  const root = makeRepo({ 'README.md': 'x' });
  // 20 live of the cap 20, 4 published with a gate not red: 16 working, a start goes.
  const r = capCheck(root, { sessions: twenty(), io: { view: view(), gate, slug: 'o/p' } });
  assert.deepEqual([r.n, r.working, r.free, r.resumed], [20, 16, ['p1', 'p2', 'p4', 'p5'], ['p3']]);
  // Every published gate red: all resumed, the cap is full, and the message says how many live.
  assert.throws(() => capCheck(root, { sessions: twenty(), io: { view: view(), gate: () => run('failure'), slug: 'o/p' } }),
