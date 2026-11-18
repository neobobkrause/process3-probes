// ===== file: pushcheck.test.mjs (continued) =====

  commit(root, { 'src/alpha/big.json': 'x'.repeat(100) });
  let msg = '';
  try { refuse(root)(); } catch (e) { msg = e.message; }
  const oldest = git(['rev-parse', '--short=10', 'HEAD~1'], { cwd: root });
  assert.ok(msg.includes(`\`git reset --soft ${oldest}~1\`, \`git reset -- src/alpha/big.json\`, \`git reset -- src/alpha/rows.mjs\`, then commit again`), msg);
  // The tranche merged in after the bad commit: a reset would flatten it.
  const m = repo();
  commit(m, { 'src/alpha/rows.mjs': 'export const rows = [];\n' });
  git(['checkout', '-q', 'tranche'], { cwd: m });
  commit(m, { 'docs/x.md': 'x\n' });
  git(['push', '-q', 'origin', 'tranche'], { cwd: m });
  git(['fetch', '-q', 'origin'], { cwd: m });
  git(['checkout', '-q', 'job/alpha'], { cwd: m });
  git(['merge', '-q', '--no-ff', '--no-edit', 'origin/tranche'], { cwd: m });
  assert.throws(refuse(m), /include a merge, so a reset would flatten them: start the work again on a fresh branch \(`job start <id> --sessions <file> --fresh-branch "<why>"` for a job\), leaving out src\/alpha\/rows\.mjs/);
});

// ===== file: pace.test.mjs (later part) =====


// Kept by every job without exception: any script the job writes prints this exact line as the very
// last line of its output: `run closed J2V-5273`.

  assert.equal(git(['rev-parse', 'side'], { cwd: bare }), git(['rev-parse', 'HEAD'], { cwd: root }));
  assert.equal(git(['rev-parse', 'tranche'], { cwd: bare }).length, 40, 'nothing deleted');
});

test('a session\'s use from another clone counts here; the share\'s own push is shared next time', (t) => {
  const f = logFile();
  env(t, { P3_GITHUB_LOG: f, CLAUDE_CODE_SESSION_ID: 'cse_same' });
  const here = makeRepo({ 'README.md': 'x\n' });
  const elsewhere = makeRepo({ 'README.md': 'y\n' });
  const t0 = Date.now();
  const minute = new Date(t0).toISOString();
  // The same session's 30 content-creating requests, made from its other clone.
  const others = [{ session: 'cse_same', clone: cloneId(elsewhere), minute, calls: 30, points: 150, content: 30, pushes: 0 }, { session: 'cse_same', clone: cloneId(here), minute, calls: 9, points: 9, content: 9, pushes: 0 }];
  // R17e (C10): every ledger row counts, this clone's own too; its log adds only the rows no share
  // in the read carried. Here its 9 were shared (at t0 - 500) before the read (at t0): 39, not 48.
  const mine = Array.from({ length: 9 }, () => ({ kind: 'gh', at: new Date(t0 - 1000).toISOString(), points: 1, content: 1 }));
  noteShare(here, t0 - 1000, t0 - 500);
  assert.equal(usage(here, { t: t0, seconds: 60, rows: mine, read: { use: others, at: t0 } }).content, 39, 'each row once');
  // A read from before the share lacks them: they count from the log.
  assert.equal(usage(here, { t: t0, seconds: 60, rows: mine, read: { use: others.slice(0, 1), at: t0 - 600 } }).content, 39);
  // The share: its own push (logged during the write) is in the next share.
  const { root, bare } = withOrigin({ 'process/config.json': {} });
  writeFileSync(f, '');
  ghTurn(['pr', 'comment', '1'], root, { p: P });
  const cfg = configOf({});
  assert.ok(shareUsage(root, cfg, { force: true }) >= 1);
  const pushed = readFileSync(f, 'utf8').split('\n').filter((l) => l.includes('"kind":"push"')).length;
  assert.ok(pushed >= 1, 'the share pushed, logged');
  assert.ok(shareUsage(root, cfg, { force: true }) >= 1, 'that push is shared next time');
  const rows = git(['show', `process-state:${USE_DIR}/cse_same.jsonl`], { cwd: bare }).split('\n').map((l) => JSON.parse(l));
  assert.ok(rows.reduce((n, r) => n + r.pushes, 0) >= 1);
});

test('github push names its refspec, refuses wildcards and main, and a remote whose config mirrors or forces', async (t) => {
  env(t);
  const { root } = withOrigin({ 'README.md': 'x\n' });
  const { main } = await import('../p3.mjs');
  const cwd = process.cwd();
  const [log, err] = [console.log, console.error];
  const errs = [];
  console.log = () => {};
  console.error = (m) => errs.push(String(m));
  try {
    process.chdir(root);
    assert.equal(await main(['github', 'push', 'origin']), 1);
    assert.equal(await main(['github', 'push', 'origin', 'refs/heads/*:refs/heads/*']), 1);
    assert.equal(await main(['github', 'push', 'origin', 'HEAD:main']), 1);
    assert.equal(await main(['github', 'push', '--quiet', 'origin', 'HEAD:refs/heads/q']), 1);
    git(['config', 'remote.origin.mirror', 'true'], { cwd: root });
    assert.equal(await main(['github', 'push', 'origin', 'HEAD:refs/heads/m']), 1);
  } finally { process.chdir(cwd); console.log = log; console.error = err; }
  const text = errs.join('\n');
  for (const re of [/name what to push/, /no wildcard refspec/, /never to main/, /the flags take no value; put them after the refspecs/, /remote\.origin\.mirror is set in this clone \(true\): it can force or delete/]) assert.match(text, re);
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
    /the job cap is full: 20 job sessions working of the cap 20 \(20 live; resumed on a red gate: p1, p2, p3, p4, p5\); nothing was started/);
  // The layer unread: every live session holds a slot, said.
  const said = [];
  assert.throws(() => capCheck(root, { sessions: twenty(), log: (l) => said.push(l), io: { readView: () => fail('GitHub unreadable'), slug: 'o/p' } }), /the job cap is full: 20 job sessions working of the cap 20 \(20 live\)/);
  assert.match(said.join('\n'), /the open layer was not read \(GitHub unreadable\): every live job session holds a slot/);
  assert.deepEqual(capCheck(root, { sessions: sessions(others(19)), io: { view: null, slug: 'o/p' } }).working, 19, 'no open layer: every live session holds a slot');
});

test('PD-7: the flow line counts working against the cap and keeps the live count; free slots and the queue follow working', (t) => {
  setJobCap(t, 20);
  const v = view(5, { startable: [{ id: 's', cmd: `${P3} job start s --sessions <file>` }, { id: 'u', cmd: `${P3} job start u --sessions <file>` }] });
