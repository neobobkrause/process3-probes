// ===== file: cap.mjs (continued) =====

// The modules whose job started after t: the start rows of the open layer and of the next (its
// early starts), a fresh-branch restart not (it replaces a session), as the idle check counts them.
export function startedSince(root, sb, view, t) {
  if (!view || !t) return [];
  const ids = (n) => (n !== undefined && n !== null ? flowRows(root, sb, n).starts.filter((r) => Date.parse(r.at) > t && !r.restart).map((r) => r.module) : []);
  return [...new Set([...ids(view.n), ...(view.early_next !== view.n ? ids(view.early_next) : [])])];
}

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
  const use = slotUse(20, publishedJobs(v, { gate }));
  const f = flow(configOf({}), [], [], 20, null, [], { view: v, use });
  assert.match(f.line, /^flow: working 16\/20 \(P3_JOB_CAP; live 20, 4 published holding no slot \(PD-7\); resumed on a red gate: p3\), startable 2/);
  assert.ok(!f.queued, '4 slots free, 2 startable: none queued');
  // No published job: the line as before.
  assert.match(flow(configOf({}), [], [], 19, null, [], { view: v, use: slotUse(19, []) }).line, /^flow: live 19\/20 \(P3_JOB_CAP\)/);
});

test('PD-7: the idle check judges empty slots on the jobs working toward publish, and says the live count', () => {
  const root = makeRepo({ 'README.md': 'x\n' });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['update-ref', 'refs/remotes/origin/tranche', 'HEAD'], { cwd: root });
  const T0 = Math.ceil((Date.now() + 120e3) / 1000) * 1000;
  const iso = (ms) => new Date(ms).toISOString().replace(/\.\d+Z$/, 'Z');
  writeState(root, SB, 'sweep', (d) => { mkdirSync(join(d, 'metrics'), { recursive: true }); writeFileSync(join(d, SWEEP_ROWS_FILE), JSON.stringify({ at: iso(T0), row: 'sweep', live: 20, live_measured_at: iso(T0 - 60e3), job_cap: 20, job_ids: ['p1', 'p2', 'p3', 'p4', 'p5', 'w'] }) + '\n'); });
  const lines = [];
  const r = idleCheck(root, configOf({}), { by: 'test', t: T0 + 25 * 6e4, read: () => ({ open: { state: 'open' }, holds: [] }), readView: () => view(), io: { gate, slug: 'o/p' }, log: (l) => lines.push(String(l)) });
  // 20 live, 4 published holding none: 16 working, 4 empty slots, 30 startable: the alarm.
  assert.deepEqual([r.live, r.slots_working, r.published_free, r.resumed, r.idle_capacity.empty, r.idle_capacity.alarm], [20, 16, 4, ['p3'], 4, true]);
  assert.match(lines.join('\n'), /IDLE CAPACITY: 16 job sessions working toward publish \(20 live; 4 published holding no slot \(PD-7\); resumed on a red gate: p3\) of the cap 20/);
});

// Cold review of C26: a published job whose session the record does not know as live subtracts
// nothing from the idle check (no false alarm); a sweep given --live alone records no job ids.
test('PD-7: the idle check subtracts only published jobs the measuring sweep saw live (or started since)', () => {
  const root = makeRepo({ 'README.md': 'x\n' });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['update-ref', 'refs/remotes/origin/tranche', 'HEAD'], { cwd: root });
  const T0 = Math.ceil((Date.now() + 120e3) / 1000) * 1000;
  const iso = (ms) => new Date(ms).toISOString().replace(/\.\d+Z$/, 'Z');
  const sweepRow = (ids) => writeState(root, SB, 'sweep', (d) => { mkdirSync(join(d, 'metrics'), { recursive: true }); writeFileSync(join(d, SWEEP_ROWS_FILE), JSON.stringify({ at: iso(T0), row: 'sweep', live: 20, live_measured_at: iso(T0 - 60e3), job_cap: 20, ...(ids ? { job_ids: ids } : {}) }) + '\n'); });
  const check = () => idleCheck(root, configOf({}), { by: 'test', t: T0 + 25 * 6e4, read: () => ({ open: { state: 'open' }, holds: [] }), readView: () => view(), io: { gate, slug: 'o/p' }, log: () => {} });
  // p1 and p2's sessions were seen; p4 and p5's were not (archived): 2 subtracted.
  sweepRow(['p1', 'p2', 'w']);
  assert.equal(check().slots_working, 18);
  // --live alone: no ids known, nothing subtracted, no alarm on 20 of 20.
  sweepRow(null);
  const r = check();
  assert.deepEqual([r.slots_working, r.idle_capacity], [undefined, undefined]);
  // A published job started since the sweep is live.
  sweepRow([]);
  writeRows(root, SB, 'starts', [[flowFile(11, 'start', 'p4-x'), { row: 'start', layer: 11, module: 'p4', at: iso(T0 + 5 * 6e4) }]]);
  assert.deepEqual(knownJobIds(root, SB, view(), { at: iso(T0), live_measured_at: iso(T0 - 60e3), job_ids: [] }), new Set(['p4']));
});

// C28 (the coordinator, 8 Nov): on the copy BOB's start script passed --live 20, a number it typed,
// and job start refused on the cap while 15 of 20 slots were empty (layer 11, 23:00-00:12Z). The
// count comes from list_sessions only; a bare --live is refused; a refusal lists what it counted.
test('C28: job start counts the cap from --sessions only; a typed --live is refused; a refusal lists the sessions counted', (t) => {
  setJobCap(t, 20);
  const root = makeRepo({ 'README.md': 'x\n' });
  const io = { view: view(), gate, slug: 'o/p' };
  assert.throws(() => capCheck(root, { live: '20', io }), /^Error: --live 20 is not taken: job start <id> --sessions <file>: your list_sessions result saved as JSON/);
  assert.throws(() => capCheck(root, { io }), /^Error: job start <id> --sessions <file>/);
  assert.throws(() => capCheck(root, { sessions: true, io }), /job start <id> --sessions <file>/);
  // The copy's case: 5 job sessions live, --live 20 typed beside them: counted 5, the start goes.
  const said = [];
  const r = capCheck(root, { live: '20', sessions: sessions(['p1', 'w', 'a', 'b', 'c']), io, log: (l) => said.push(l) });
  assert.deepEqual([r.n, r.working, r.free], [5, 4, ['p1']]);
  assert.match(said.join('\n'), /--live 20 ignored: the job sessions are counted from --sessions/);
  // A refusal on the cap names each session it counted and whether it holds a slot.
  setJobCap(t, 3);
  let msg = '';
  try { capCheck(root, { sessions: sessions(['p1', 'p3', 'w', 'a']), io }); } catch (e) { msg = e.message; }
  assert.match(msg, /the job cap is full: 3 job sessions working of the cap 3 \(4 live; 1 published holding no slot \(PD-7\); resumed on a red gate: p3\); nothing was started\. Counted from --sessions:/);
  assert.match(msg, /\n- session_p1 "job p1" SESSION_STATUS_RUNNING: published, holds no slot \(PD-7\)/);
  assert.match(msg, /\n- session_p3 "job p3" SESSION_STATUS_RUNNING: resumed on a red gate, holds a slot/);
  assert.match(msg, /\n- session_a "job a" SESSION_STATUS_RUNNING: holds a slot/);
});

// Cold review of C28: BOB lists sessions once a wake and runs each start line with the same file.
// Every job started since the list was read counts, so a burst stops at the cap; a refusal's lines
// mark one session per freed job, and name a carried one.
test('C28: starts recorded since the list was read count against the cap; one free mark per published job; carried named', (t) => {
  setJobCap(t, 4);
  const root = makeRepo({ 'README.md': 'x\n' });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  const T = Date.parse('2026-11-07T23:00:00Z');
  const iso = (ms) => new Date(ms).toISOString().replace(/\.\d+Z$/, 'Z');
  const file = join(mkdtempSync(join(tmpdir(), 'p3-sessions-')), 's.json');
  writeFileSync(file, JSON.stringify([{ id: 'session_a', title: 'job a', session_status: 'SESSION_STATUS_RUNNING', created_at: iso(T - 60e3) }, { id: 'session_b', title: 'job b', session_status: 'SESSION_STATUS_RUNNING', created_at: iso(T) }]));
  const io = { view: { kind: 'open', n: 11, states: [], prs: [], startable: [] }, slug: 'o/p' };
  // A start before the list was read is in the list (or gone): not added.
  writeRows(root, SB, 'starts', [[flowFile(11, 'start', 'old'), { row: 'start', layer: 11, module: 'z', at: iso(T - 5 * 6e4) }]]);
  git(['fetch', '-q', 'origin', `+refs/heads/${SB}:refs/remotes/origin/${SB}`], { cwd: root });
  assert.deepEqual([capCheck(root, { sessions: file, io }).n, capCheck(root, { sessions: file, io }).since], [2, []]);
  // The burst: c and d started after the list was read (a restart on a fresh branch not counted).
  writeRows(root, SB, 'starts', [
    [flowFile(11, 'start', 'c'), { row: 'start', layer: 11, module: 'c', at: iso(T + 60e3) }],
    [flowFile(11, 'start', 'd'), { row: 'start', layer: 11, module: 'd', at: iso(T + 2 * 6e4) }],
    [flowFile(11, 'start', 'a-r'), { row: 'start', layer: 11, module: 'a', restart: true, at: iso(T + 3 * 6e4) }],
  ]);
  git(['fetch', '-q', 'origin', `+refs/heads/${SB}:refs/remotes/origin/${SB}`], { cwd: root });
  let msg = '';
  try { capCheck(root, { sessions: file, io }); } catch (e) { msg = e.message; }
  assert.match(msg, /the job cap is full: 4 job sessions working of the cap 4 \(4 live: 2 listed, 2 started since\); nothing was started\. Counted from --sessions and the start rows since:/);
  assert.match(msg, /\n- \(no session listed yet\) job c: started since the list was read, holds a slot/);
  // countedLines: a job and its restart both live, the job published: one marked free; carried named.
  const lines = countedLines([{ id: 's1', title: 'job p1', updated_at: iso(T) }, { id: 's2', title: 'job p1 (restart)', updated_at: iso(T + 6e4) }, { id: 's3', title: 'job q', carried: true }], { free: ['p1'], resumed: [] });
  assert.deepEqual(lines.map((l) => l.replace(/^- (\S+).*: (.*)$/, '$1 $2')), ['s1 holds a slot', 's2 published, holds no slot (PD-7)', 's3 holds a slot']);
  assert.match(lines[2], /carried from the last read/);
});

// ===== file: gateclass.test.mjs =====

// C45b: the gate's class (gateclass.mjs). A plain pull request that changes only modules'
// requirements files runs only the tests that read them (record-only); one that only moves the
// process pin runs no suite (pin-only); everything else runs as before (full). Every route by
// which product code could reach a light class comes out full; a browser left out by the shim's
// class step turns the gate red if a product test would run all the same.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, symlinkSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkRow, gate as gateRun, gateClassAt, gateComment } from '../lib/gate.mjs';
import { browserNeeded, gateClass } from '../lib/gateclass.mjs';
import { BOT, block, GATE } from '../lib/github.mjs';
import { git, loadConfig } from '../lib/util.mjs';
import { commit, entry, makeRepo } from './helpers.mjs';

const PIN0 = '0'.repeat(39) + 'a';
const PIN1 = '1'.repeat(39) + 'b';
const PIN_OFF = '2'.repeat(39) + 'c'; // on no released branch
const PIN_OLD = '3'.repeat(39) + 'd'; // released, but not a descendant of PIN0
const LINES = { [PIN0]: '## Process3\n\n- the pin, old, on {tranche}\n', [PIN1]: '## Process3\n\n- the pin, new, on {tranche}\n' };
LINES[PIN_OLD] = LINES[PIN0];
const SHIM = { [PIN0]: 'name: process-gate\n# shim 0\n', [PIN1]: 'name: process-gate\n# shim 1\n' };
SHIM[PIN_OLD] = SHIM[PIN0];
const hash = (t) => spawnSync('git', ['hash-object', '--stdin'], { input: t, encoding: 'utf8' }).stdout.trim();
// The process clone, as the gate reads it: released pins, ancestry, shims and the process lines.
const repo = {
  released: (p) => [PIN0, PIN1, PIN_OLD].includes(p),
  descends: (a, b) => a === b || (a === PIN0 && b === PIN1),
  shim: (p, name) => (name === 'process-gate.yml' && SHIM[p] ? hash(SHIM[p]) : null),
  text: (p, path) => (path === 'shims/CLAUDE.process.md' ? LINES[p] ?? null : null),
};
const claude = (pin) => `# Product\n\n## Standing approvals from Bob\n\nThe owner's words.\n\n${LINES[pin].replaceAll('{tranche}', 'tranche')}`;
const ids = (id) => `import test from 'node:test'; import a from 'node:assert'; import { readFileSync } from 'node:fs';\ntest('${id} ids', () => a.ok(readFileSync('req/${id}.md', 'utf8').includes('**R1**')));\n`;
// Not a reader: fails when the whole suite runs, so a whole run shows.
const whole = (id) => `import test from 'node:test'; import a from 'node:assert';\ntest('${id} whole', () => a.fail('the whole ${id} suite ran'));\n`;

function product(baseFiles = {}) {
  const root = makeRepo({
    'process/config.json': { tranche: 'tranche' },
    'process/ledger/alpha.json': entry('alpha', { status: { state: 'WORKING' }, paths: ['src/alpha/', 'req/alpha.md'] }),
    'process/ledger/beta.json': entry('beta', { status: { state: 'WORKING' }, paths: ['src/beta/', 'req/beta.md'] }),
    'src/alpha/index.mjs': 'export const x = 1;\n',
    'src/beta/index.mjs': 'export const y = 1;\n',
    'req/alpha.md': '# alpha\n\n- **R1** x is one\n',
    'req/beta.md': '# beta\n\n- **R1** y is one\n',
    'test/alpha/ids.test.mjs': ids('alpha'),
    'test/alpha/whole.test.mjs': whole('alpha'),
    'test/beta/ids.test.mjs': ids('beta'),
    'test/beta/whole.test.mjs': whole('beta'),
    'CLAUDE.md': claude(PIN0),
    '.github/workflows/process-gate.yml': SHIM[PIN0],
    ...baseFiles,
  });
  setPin(root, PIN0);
  git(['commit', '-q', '-m', 'the pin'], { cwd: root });
  git(['branch', 'tranche'], { cwd: root });
  return { root, base: git(['rev-parse', 'HEAD'], { cwd: root }) };
}
// The gitlink, with its empty folder (an unpopulated submodule), so `git add -A` keeps it.
const setPin = (root, pin) => { mkdirSync(join(root, '.process'), { recursive: true }); git(['update-index', '--add', '--cacheinfo', `160000,${pin},.process`], { cwd: root }); };
// A plain pull request from branch with files (and the pin moved to pin).
function pr(p, branch, files, { pin } = {}) {
  git(['checkout', '-q', '-b', branch, p.base], { cwd: p.root });
  mkdirSync(join(p.root, '.process'), { recursive: true });
  const del = Object.keys(files).filter((f) => files[f] === null);
  for (const f of del) git(['rm', '-q', f], { cwd: p.root });
  const put = Object.fromEntries(Object.entries(files).filter(([, v]) => v !== null));
  if (Object.keys(put).length || del.length) commit(p.root, put);
  if (pin) { setPin(p.root, pin); git(['commit', '-q', '-m', 'process: pin'], { cwd: p.root }); }
  return { ...p, head: git(['rev-parse', 'HEAD'], { cwd: p.root }), branch };
}
const fakeIO = () => {
  const state = { comments: [] };
  return { state, io: { comments: () => state.comments, getPR: () => ({ user: { login: 'acmewidget' }, draft: false, base: { ref: 'tranche' } }), addComment: (s, n, body) => { state.comments.push({ id: state.comments.length + 1, body, user: { login: BOT } }); return {}; }, verify: () => true } };
};
function run(s, over = {}) {
  const lines = [];
  const { io } = fakeIO();
  process.env.GITHUB_RUN_ID ||= '1';
  const r = gateRun(s.root, { base: s.base, head: s.head, branch: s.branch, pr: 7, slug: 'o/r', io, repo, log: (l) => lines.push(String(l)), ...over });
  return { ...r, lines, comment: gateComment(r.run) };
}
const tests = (r) => r.run.tests?.reduce((t, x) => t + x.total, 0) ?? 0;

// 1. record-only.

test('record-only: two modules\' found marks run only the tests naming each file; install, build and regenerate kept; no base-red tree; the lead line names it', () => {
  const s = pr(product(), 'found-marks', { 'req/alpha.md': '# alpha\n\n- **R1** x is one\n- **F1** *(not yet met: walk)* x is two\n', 'req/beta.md': '# beta\n\n- ~~**R1**~~ y is one\n', 'process/metrics/alpha.jsonl': '{"row":"note"}\n' });
  const r = run(s);
  assert.deepEqual(r.findings, [], r.lines.join('\n'));
  assert.equal(r.run.class, 'record-only');
  assert.match(r.run.class_why, /only req\/alpha\.md, req\/beta\.md changed, read by 2 test file\(s\)/);
  assert.deepEqual([r.run.trigger, r.run.scope, r.run.suite], ['code', ['alpha', 'beta'], 'pass']);
  assert.deepEqual(r.run.requirements_only, [{ module: 'alpha', files: ['test/alpha/ids.test.mjs'] }, { module: 'beta', files: ['test/beta/ids.test.mjs'] }]);
  assert.equal(tests(r), 2, 'the id tests only, never the whole suites');
  assert.ok(!r.lines.some((l) => /prepared beside|base tree/.test(l)), 'no base-red tree');
  assert.match(r.comment.split('\n')[1], /: green, code \(record-only\), [\d.]+ min\.$/);
  checkRow(r.run);
});


// 2 onions were logged at the Pell gate.

test('record-only: a failing id test is red, never tolerated as base-red', () => {
  const p = product({ 'test/alpha/ids.test.mjs': ids('alpha').replace("'**R1**'", "'**R9**'") });
  const s = pr(p, 'found-a', { 'req/alpha.md': '# alpha\n\n- **R1** x is one, reworded\n' });
  const r = run(s);
  assert.equal(r.run.class, 'record-only');
  assert.equal(r.run.suite, 'fail');
  assert.ok(r.findings.some((f) => f.check === 'suite'));
  assert.equal(r.run.base_red, undefined);
});

// 2. Every route to full.

test('full: every route out of record-only, each with its why, the whole suite run', () => {
  const cases = [
    ['a code file beside it', {}, { 'src/alpha/index.mjs': 'export const x = 2;\n' }, /src\/alpha\/index\.mjs is not one module's requirements \.md file/],
    ['a ledger entry edit', {}, { 'process/ledger/alpha.json': entry('alpha', { status: { state: 'WORKING' }, paths: ['src/alpha/', 'req/alpha.md'], tests: ['test/alpha/', 'test/shared/'] }) }, /a ledger entry \(process\/ledger\/alpha\.json\)/],
    ['the config', {}, { 'process/config.json': { tranche: 'tranche', lockfiles: [] } }, /it changes process\/config\.json/],
    ['inside another module\'s paths', { 'process/ledger/beta.json': entry('beta', { status: { state: 'WORKING' }, paths: ['src/beta/', 'req/'] }) }, {}, /req\/alpha\.md, alpha's requirements file, is inside beta's paths or tests/],
    ['a .md that is no module\'s requirements file', {}, { 'docs/notes.md': '# notes\n' }, /docs\/notes\.md is not one module's requirements \.md file/],
    ['a reader outside the tests', { 'src/alpha/doc.mjs': "export const doc = 'req/alpha.md';\n" }, {}, /src\/alpha\/doc\.mjs, outside alpha's tests, names alpha\.md/],
    // Cold review A3: another module's test walking the folder; a reader of any kind, not only a script.
    ['another module\'s test walking the folder', { 'test/beta/all.test.mjs': "import { readdirSync } from 'node:fs'; readdirSync('req');\n" }, {}, /test\/beta\/all\.test\.mjs, outside alpha's tests, names the folder req/],
    ['a python generator naming it', { 'tools/gen.py': "open('req/alpha.md').read()\n" }, {}, /tools\/gen\.py, outside alpha's tests, names alpha\.md/],
  ];
  for (const [what, baseFiles, extra, why] of cases) {
    const s = pr(product(baseFiles), 'found-x', { 'req/alpha.md': '# alpha\n\n- **R1** x is one, reworded\n', ...extra });
    const r = run(s);
    assert.equal(r.run.class, 'full', what);
    assert.match(r.run.class_why, why, `${what}: ${r.run.class_why}`);
    assert.doesNotMatch(r.comment.split('\n')[1], /record-only|pin-only/, what);
    assert.ok(!(r.run.requirements_only || []).length, `${what}: not narrowed`);
  }
});

test('full: a symlink to the requirements file or its folder, read under another name (cold review A3)', () => {
  for (const [link, to] of [['src/beta/content.md', '../../req/alpha.md'], ['src/beta/reqs', '../../req']]) {
    const p = product();
    symlinkSync(to, join(p.root, link));
    p.base = commit(p.root, {}, 'a link');
    git(['branch', '-f', 'tranche'], { cwd: p.root });
    const r = run(pr(p, 'found-l', { 'req/alpha.md': '# alpha\n\n- **R1** reworded\n' }));
    assert.equal(r.run.class, 'full', link);
    assert.match(r.run.class_why, new RegExp(`${link} is a symlink to req/alpha\\.md or its folder`));
  }
});

test('full: a reader the build reveals runs the whole suite, recorded full with why', () => {
  const p = product({
    'process/config.json': { tranche: 'tranche', generated: [{ paths: ['src/alpha/gen.mjs'], regenerate: ['node', 'tools/gen.mjs'], verify: ['node', '-e', 'process.exit(0)'] }] },
    'tools/gen.mjs': "import { writeFileSync } from 'node:fs';\nwriteFileSync('src/alpha/gen.mjs', `export const p = '${['alpha', 'md'].join('.')}';\\n`);\n",
    '.gitignore': 'src/alpha/gen.mjs\n',
  });
  const s = pr(p, 'found-gen', { 'req/alpha.md': '# alpha\n\n- **R1** x is one, reworded\n' });
  const before = gateClassAt(s.root, { base: s.base, head: s.head, branch: s.branch, baseRef: 'tranche', repo });
  assert.equal(before.class, 'record-only', 'before the build no reader shows');
  const r = run(s);
  assert.equal(r.run.class, 'full');
  assert.match(r.run.class_why, /^after the build, alpha: only its requirements file req\/alpha\.md changed, but src\/alpha\/gen\.mjs, of the module's own paths, names alpha\.md/);
  assert.equal(tests(r), 2, 'the whole alpha suite ran');
  // Full as before: its failure, red at the base too, is base-red (cold review B1).
  assert.equal(r.run.suite, 'base-red');
});

test('full: more routes out of record-only: two modules\' file, a deleted file, records only, a job\'s own narrowing unchanged', () => {
  const two = pr(product({ 'process/ledger/beta.json': entry('beta', { status: { state: 'WORKING' }, paths: ['src/beta/'], requirements: 'req/alpha.md' }) }), 'found-2', { 'req/alpha.md': '# alpha\n\n- **R1** reworded\n' });
  assert.match(run(two).run.class_why, /req\/alpha\.md is not one module's requirements \.md file/);
  const p = product();
  git(['checkout', '-q', '-b', 'found-del', p.base], { cwd: p.root });
  git(['rm', '-q', 'req/alpha.md'], { cwd: p.root });
  git(['commit', '-q', '-m', 'gone'], { cwd: p.root });
  const del = run({ ...p, head: git(['rev-parse', 'HEAD'], { cwd: p.root }), branch: 'found-del' });
  assert.deepEqual([del.run.class, del.run.class_why], ['full', 'req/alpha.md is not a regular file in the merged tree']);
  const cfg = loadConfig(p.root);
  assert.equal(gateClass(p.root, cfg, { branch: 'x', into: 'tranche', changed: ['process/metrics/a.jsonl'], entries: [], readers: () => [] }).why, 'records only');
  // A job's pull request: full, and its own requirements-only narrowing as before.
  const j = pr(product(), 'job/alpha', { 'req/alpha.md': '# alpha\n\n- **R1** x is one, struck\n' });
  const jr = run(j);
  assert.deepEqual([jr.run.class, jr.run.class_why], ['full', "a job's pull request"]);
  assert.deepEqual(jr.run.requirements_only, [{ module: 'alpha', files: ['test/alpha/ids.test.mjs'] }]);
});

test('full: a job, the tranche, a pass, a layer, a refresh and bootstrap never take a light class', () => {
  const p = product();
  const root = p.root;
  const cfg = loadConfig(root);
  const entries = [JSON.parse(readFileSync(join(root, 'process/ledger/alpha.json'), 'utf8'))];
  const changed = ['req/alpha.md'];
  const readers = () => [];
  for (const [what, ctx, why] of [
    ['a job', { job: 'alpha' }, "a job's pull request"],
    ['the tranche', { branch: 'tranche' }, 'the tranche'],
    ['a pass', { pass: true }, 'a pass'],
    ['a layer', { layer: true }, "a layer branch's pull request"],
    ['bootstrap', { bootstrap: true }, 'bootstrap: the base has no Process3'],
    ['a refresh', { refresh: true }, 'a refresh of generated files'],
  ]) {
    const c = gateClass(root, cfg, { branch: 'x', into: 'tranche', changed, entries, readers, ...ctx });
    assert.deepEqual([c.class, c.why], ['full', why], what);
  }
  assert.equal(gateClass(root, cfg, { branch: 'x', into: 'tranche', changed, entries, readers }).class, 'record-only');
});

// 3. pin-only.

test('pin-only: the pin forward with its shim and process lines runs no suite, install or build', () => {
  const s = pr(product(), 'p3/pin-1', { '.github/workflows/process-gate.yml': SHIM[PIN1], 'CLAUDE.md': claude(PIN1) }, { pin: PIN1 });
  const r = run(s, { exec: () => { throw new Error('nothing is installed or built'); } });
  assert.deepEqual(r.findings, [], r.lines.join('\n'));
  assert.equal(r.run.class, 'pin-only');
  assert.match(r.run.class_why, new RegExp(`the pin ${PIN0.slice(0, 10)} to ${PIN1.slice(0, 10)}, with .github/workflows/process-gate.yml, CLAUDE.md`));
  assert.deepEqual([r.run.trigger, r.run.scope, r.run.suite, r.run.generated], ['code', [], 'skipped', undefined]);
  assert.match(r.comment.split('\n')[1], /: green, code \(pin-only\), /);
});

test('pin-only: findings when the pin is not released or not forward, or a shim is not the pin\'s own', () => {
  const off = run(pr(product(), 'p3/pin-off', {}, { pin: PIN_OFF }));
  assert.equal(off.run.class, 'pin-only');
  assert.deepEqual(off.findings.map((f) => f.message), [`the process pin ${PIN_OFF.slice(0, 10)} is not a commit on process3's tranche or main`]);
  const down = run(pr(product(), 'p3/pin-old', {}, { pin: PIN_OLD }));
  assert.deepEqual(down.findings.map((f) => f.message), [`the process pin ${PIN_OLD.slice(0, 10)} does not descend from the base's pin ${PIN0.slice(0, 10)}: no downgrade`]);
  // Checked before anything is read at the pin (cold review B4).
  const offC = run(pr(product(), 'p3/pin-offc', { 'CLAUDE.md': claude(PIN1) }, { pin: PIN_OFF }));
  assert.deepEqual([offC.run.class, offC.findings.map((f) => f.file)], ['pin-only', ['.process']]);
  const shim = run(pr(product(), 'p3/pin-shim', { '.github/workflows/process-gate.yml': SHIM[PIN1] + '# edited\n' }, { pin: PIN1 }));
  assert.equal(shim.run.class, 'pin-only');
  assert.deepEqual(shim.findings.map((f) => f.file), ['.github/workflows/process-gate.yml']);
  assert.match(shim.comment.split('\n')[1], /red, 1 finding\(s\), code \(pin-only\)/);
});

test('full: every route out of pin-only, each with its why', () => {
  const cases = [
    ['a test file beside the pin', {}, { 'test/alpha/new.test.mjs': whole('alpha') }, /is not one module's requirements \.md file/],
    ['CLAUDE.md beyond the process lines', {}, { 'CLAUDE.md': claude(PIN1).replace("The owner's words.", 'Other words.') }, /CLAUDE\.md changes more than the pin's process lines/],
    ['CLAUDE.md with no pin moved', {}, { 'CLAUDE.md': claude(PIN0) + '\nmore\n' }, null, /CLAUDE\.md changes, and not only by the pin's process lines/],
    ['a workflow not named like a shim', {}, { '.github/workflows/build.yml': 'on: push\n' }, /\.github\/workflows\/build\.yml is not named like a shim/],
    ['a product test naming the pin', { 'test/alpha/pin.test.mjs': "import { readFileSync } from 'node:fs'; readFileSync('.process/tool/p3.mjs');\n" }, {}, /test\/alpha\/pin\.test\.mjs names \.process/],
    ['a product script reading the submodule', { 'scripts/v.mjs': "import { execSync } from 'node:child_process'; execSync('git submodule status');\n" }, {}, /scripts\/v\.mjs names \.process/],
    ['a ledger suite naming the pin', { 'process/ledger/beta.json': entry('beta', { status: { state: 'WORKING' }, paths: ['src/beta/', 'req/beta.md'], suite: { cwd: '.', command: ['node', '--import', './.process/x.mjs', '--test'] } }) }, {}, /beta's ledger suite or checks name \.process/],
    ['a generated row naming the pin', { 'process/config.json': { tranche: 'tranche', generated: [{ paths: ['gen/x.mjs'], regenerate: ['node', '.process/gen.mjs'], verify: ['true'] }] } }, {}, /a generated row, lock file or lane in process\/config\.json names \.process/],
    ['a .md naming the pin that a script reads', { 'docs/pin.md': 'the pin is in `.process`\n', 'src/alpha/doc.mjs': "export const f = 'docs/pin.md';\n" }, {}, /docs\/pin\.md names \.process, and src\/alpha\/doc\.mjs names docs\/pin\.md/],
    // Cold review A1: a file git treats as binary (here by .gitattributes) is searched all the same.
    ['a -diff lock file naming the pin', { '.gitattributes': 'package-lock.json -diff\n', 'package-lock.json': '{"packages":{"node_modules/p3":{"resolved":"file:.process/tool"}}}\n' }, { 'CLAUDE.md': claude(PIN1) }, /package-lock\.json names \.process/],
    // Cold review A2: the other files a pin move touches are read by nothing that runs.
    ['a test reading CLAUDE.md', { 'test/alpha/claude.test.mjs': "import { readFileSync } from 'node:fs'; readFileSync('CLAUDE.md', 'utf8');\n" }, { 'CLAUDE.md': claude(PIN1) }, /test\/alpha\/claude\.test\.mjs names CLAUDE\.md or its folder/],
    ['a lint reading the workflows', { 'scripts/lint.mjs': "readdirSync('.github/workflows');\n" }, { '.github/workflows/process-gate.yml': SHIM[PIN1] }, /scripts\/lint\.mjs names \.github\/workflows\/process-gate\.yml or its folder/],
    ['a .md naming the pin that a package.json script reads', { 'docs/pin.md': 'the pin is in `.process`\n', 'package.json': '{"scripts":{"doc":"cat docs/pin.md"}}\n' }, {}, /docs\/pin\.md names \.process, and package\.json names docs\/pin\.md/],
    ['a shim deleted', { '.github/workflows/process-record.yml': 'x\n' }, { '.github/workflows/process-record.yml': null }, /it deletes \.github\/workflows\/process-record\.yml/],
    ['the gitlink made a file', {}, null, /\.process is not a gitlink|the head has no process pin/],
  ];
  for (const [what, baseFiles, extra, why, why2] of cases) {
    const p = product(baseFiles);
    let s;
    if (extra === null) {
      git(['checkout', '-q', '-b', 'p3/pin-x', p.base], { cwd: p.root });
      git(['rm', '-q', '--cached', '.process'], { cwd: p.root });
      rmSync(join(p.root, '.process'), { recursive: true, force: true });
      s = { ...p, head: commit(p.root, { '.process': 'a file\n' }), branch: 'p3/pin-x' };
    } else s = pr(p, 'p3/pin-x', extra, why2 ? {} : { pin: PIN1 });
    const r = run(s);
    assert.equal(r.run.class, 'full', `${what}: ${r.run.class_why}`);
    assert.match(r.run.class_why, why2 || why, `${what}: ${r.run.class_why}`);
  }
  // Prose naming the pin, read by nothing, is no reader: the move stays pin-only.
  const prose = run(pr(product({ 'README.md': 'Run `git submodule update --init .process`.\n' }), 'p3/pin-y', {}, { pin: PIN1 }));
  assert.equal(prose.run.class, 'pin-only', prose.run.class_why);
});

test('pin-only: the merged tree is searched, not just the head: a test the base gained after the branch names the pin', () => {
  const p = product();
  const s = pr(p, 'p3/pin-m', {}, { pin: PIN1 });
  git(['checkout', '-q', 'tranche'], { cwd: s.root });
  const base = commit(s.root, { 'test/beta/pin.test.mjs': "import { existsSync } from 'node:fs'; existsSync('.process');\n" });
  git(['checkout', '-q', '--detach', base], { cwd: s.root });
  git(['merge', '-q', '--no-ff', '-m', 'merge', s.head], { cwd: s.root });
  const r = run({ ...s, base });
  assert.equal(r.run.class, 'full');
  assert.match(r.run.class_why, /test\/beta\/pin\.test\.mjs names \.process \(the merged tree\)/);
});

test('pin-only needs the process clone: without it the run is full', () => {
  const r = run(pr(product(), 'p3/pin-n', {}, { pin: PIN1 }), { repo: undefined });
  assert.deepEqual([r.run.class, r.run.class_why], ['full', 'no process clone to judge the pin with']);
});

test('the gate-class command: class and browser lines appended to --out; anything unread keeps the browser', () => {
  const s = pr(product({ 'test/alpha/ids.test.mjs': whole('alpha').replace('whole', 'other') }), 'found-cmd', { 'req/alpha.md': '# alpha\n\n- **R1** reworded\n' });
  const out = join(mkdtempSync(join(tmpdir(), 'p3-class-')), 'o');
  const tool = join(import.meta.dirname, '..', 'p3.mjs');
  const r = spawnSync(process.execPath, [tool, 'gate-class', '--base', s.base, '--head', s.head, '--branch', s.branch, '--base-ref', 'tranche', '--out', out], { cwd: s.root, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(readFileSync(out, 'utf8'), 'class=record-only\nbrowser=skip\n');
  const bad = spawnSync(process.execPath, [tool, 'gate-class', '--base', 'nope', '--head', s.head, '--branch', s.branch, '--base-ref', 'tranche', '--out', out], { cwd: s.root, encoding: 'utf8' });
  assert.equal(bad.status, 0);
  assert.match(readFileSync(out, 'utf8'), /class=full\nbrowser=keep\n$/);
});

// 4. The browser.

test('the browser: needed unless pin-only, or record-only with no reader; a lane\'s folder keeps it', () => {
  assert.equal(browserNeeded({ class: 'pin-only' }), false);
  assert.equal(browserNeeded({ class: 'record-only', reqs: [{ readers: [] }] }), false);
  assert.equal(browserNeeded({ class: 'record-only', builds: true, reqs: [{ readers: [] }] }), true, 'a generator may drive the browser (cold review A4)');
  assert.equal(browserNeeded({ class: 'record-only', reqs: [{ readers: ['t.test.mjs'] }] }), true);
  assert.equal(browserNeeded({ class: 'full' }), true);
  assert.equal(browserNeeded({ class: 'pin-only', lanes: true }), true);
  // A lane's folder, touched beside the class's files, is seen.
  const p = product({ 'process/config.json': { tranche: 'tranche', lanes: [{ name: 'ux', dir: 'ux' }] } });
  const cfg = loadConfig(p.root);
  assert.equal(gateClass(p.root, cfg, { branch: 'x', into: 'tranche', changed: ['ux/a.css', 'req/alpha.md'], entries: [], readers: () => [] }).lanes, true);
});

test('the browser left out, a product test would run all the same: red, the suite not run', () => {
  const p = product({
    'process/config.json': { tranche: 'tranche', generated: [{ paths: ['src/alpha/gen.mjs'], regenerate: ['node', 'tools/gen.mjs'], verify: ['node', '-e', 'process.exit(0)'] }] },
    'tools/gen.mjs': "import { writeFileSync } from 'node:fs';\nwriteFileSync('src/alpha/gen.mjs', `export const p = '${['alpha', 'md'].join('.')}';\\n`);\n",
    '.gitignore': 'src/alpha/gen.mjs\n',
    'test/alpha/ids.test.mjs': whole('alpha').replace('whole', 'other'),
  });
  // No test names req/alpha.md before the build; the run builds, so the shim's step keeps the
  // browser (cold review A4). Were it left out all the same (a step and a gate that disagree), the
  // reader the build reveals makes the gate red, and nothing runs without the browser.
  const s = pr(p, 'found-b', { 'req/alpha.md': '# alpha\n\n- **R1** x is one, reworded\n' });
  const c = gateClassAt(s.root, { base: s.base, head: s.head, branch: s.branch, baseRef: 'tranche', repo });
  assert.deepEqual([c.class, browserNeeded(c)], ['record-only', true]);
  const r = run(s, { browserSkipped: true });
  assert.equal(r.run.ok, false);
  assert.deepEqual(r.findings.map((f) => f.check), ['gate-class']);
  assert.match(r.findings[0].message, /the browser was not installed .* but the alpha suite would run whole \(after the build, /);
  assert.equal(tests(r), 0, 'no product test ran without the browser');
  // With no reader before or after the build, nothing runs and the run is green.
  const q = pr(product({ 'test/alpha/ids.test.mjs': whole('alpha').replace('whole', 'other') }), 'found-c', { 'req/alpha.md': '# alpha\n\n- **R1** reworded\n' });
  const g = run(q, { browserSkipped: true });
  assert.deepEqual([g.run.ok, g.run.class, tests(g)], [true, 'record-only', 0]);
});

const SHIM_FILE = readFileSync(join(import.meta.dirname, '..', '..', 'shims', 'process-gate.yml'), 'utf8');
const gateJob = SHIM_FILE.slice(SHIM_FILE.indexOf('\n  gate:\n'), SHIM_FILE.indexOf('\n  post:\n'));
const stepRun = (name) => {
  const step = gateJob.slice(gateJob.indexOf(`- name: ${name}\n`));
  const body = [];
  for (const l of step.slice(step.indexOf('run: |\n') + 7).split('\n')) { if (l.trim() && !l.startsWith('          ')) break; body.push(l.slice(10)); }
  return body.join('\n');
};
function bash(script, env) {
  const tmp = mkdtempSync(join(tmpdir(), 'p3-class-'));
  writeFileSync(join(tmp, 's.sh'), script);
  writeFileSync(join(tmp, 'GITHUB_OUTPUT'), '');
  const r = spawnSync('bash', ['--noprofile', '--norc', '-eo', 'pipefail', join(tmp, 's.sh')], { cwd: tmp, encoding: 'utf8', env: { ...process.env, RUNNER_TEMP: tmp, GITHUB_OUTPUT: join(tmp, 'GITHUB_OUTPUT'), ...env(tmp) } });
  return { ...r, out: readFileSync(join(tmp, 'GITHUB_OUTPUT'), 'utf8') };
}
const stubTool = (tmp, { capable = true, says = 'skip', exit = 0 } = {}) => {
  spawnSync('mkdir', ['-p', join(tmp, 'process3', 'tool')]);
  writeFileSync(join(tmp, 'process3', 'tool', 'p3.mjs'), `${capable ? '// p3-capability: gate-class\n' : ''}import { appendFileSync } from 'node:fs';\nconst o = process.argv[process.argv.indexOf('--out') + 1];\nappendFileSync(o, 'class=x\\nbrowser=${says}\\n');\nprocess.exit(${exit});\n`);
  return {};
};


// A requirement on what a job hands in: the job's handover note is saved under the file name
// `saltmarsh-relay.md`, and under no other name.

test('the shim: the class step, guarded by the capability line, says skip only when the tool does; the browser step then reads no version; no job added', () => {
  const step = stepRun("the gate's class, before any product code runs");
  assert.equal(bash(step, (t) => stubTool(t)).out, 'browser=skip\n');
  assert.equal(bash(step, (t) => stubTool(t, { says: 'keep' })).out, '');
  assert.equal(bash(step, (t) => stubTool(t, { capable: false })).out, '', 'an older pin: never asked');
  const failed = bash(step, (t) => stubTool(t, { exit: 1, says: 'keep' }));
  assert.deepEqual([failed.status, failed.out], [0, ''], 'a failing tool never fails the job, and keeps the browser');
  const browser = bash(stepRun("the browser the product's lock files pin"), () => ({ CLASS_BROWSER: 'skip', LOCKFILES: '["package-lock.json"]' }));
  assert.deepEqual([browser.status, browser.out], [0, 'versions=\n']);
  assert.match(browser.stdout, /none installed/);
  const at = (x) => gateJob.indexOf(x);
  assert.ok(at('record-check --base') < at("- name: the gate's class") && at("- name: the gate's class") < at("- name: the browser the product's lock files pin"));
  assert.match(gateJob.slice(at('- name: gate\n')), /P3_BROWSER: \$\{\{ steps\.class\.outputs\.browser \}\}/);
  assert.deepEqual([...SHIM_FILE.slice(SHIM_FILE.indexOf('\njobs:\n')).matchAll(/^ {2}([\w-]+):\n/gm)].map((m) => m[1]), ['gate', 'post'], 'the same two jobs');
  assert.doesNotMatch(SHIM_FILE, /^\s*pull_request_target:/m, 'no pull_request_target trigger');
  const tool = readFileSync(join(import.meta.dirname, '..', 'p3.mjs'), 'utf8');
  assert.match(tool, /^\/\/ p3-capability: gate-class/m);
});

// 5. The rehearsal (PD-17): each PR as the gate workflow meets it, the class step first, then the
// gate with the browser as that step left it, then the row job post would print.

test('rehearsal (PD-17): a record-only PR, a pin-only PR, and a code PR disguised as each come out as they must', () => {
  const flow = (s) => {
    const c = gateClassAt(s.root, { base: s.base, head: s.head, branch: s.branch, baseRef: 'tranche', repo });
    const r = run(s, { browserSkipped: !browserNeeded(c) });
    checkRow(r.run);
    const post = block(GATE, { runs: [r.run] }, r.comment.split('\n')[1]);
    return { step: c.class, browser: browserNeeded(c) ? 'keep' : 'skip', class: r.run.class, ok: r.run.ok, tests: tests(r), lead: post.split('\n')[1] };
  };
  const rec = flow(pr(product(), 'found-r', { 'req/alpha.md': '# alpha\n\n- **R1** x is one\n- **F1** *(not yet met: walk)* more\n' }));
  assert.deepEqual([rec.step, rec.browser, rec.class, rec.ok, rec.tests], ['record-only', 'keep', 'record-only', true, 1]);
  assert.match(rec.lead, /green, code \(record-only\)/);
  const pin = flow(pr(product(), 'p3/pin-r', { '.github/workflows/process-gate.yml': SHIM[PIN1], 'CLAUDE.md': claude(PIN1) }, { pin: PIN1 }));
  assert.deepEqual([pin.step, pin.browser, pin.class, pin.ok, pin.tests], ['pin-only', 'skip', 'pin-only', true, 0]);
  assert.match(pin.lead, /green, code \(pin-only\)/);
  // Disguised as record-only: a requirements file and a code change; a requirements file the code reads.
  const d1 = flow(pr(product(), 'found-d1', { 'req/alpha.md': '# alpha\n\n- **R1** reworded\n', 'src/alpha/index.mjs': 'export const x = 9;\n' }));
  const d2 = flow(pr(product({ 'src/alpha/load.mjs': "export const t = () => import('fs').then((f) => f.readFileSync('req/alpha.md'));\n" }), 'found-d2', { 'req/alpha.md': '# alpha\n\n- **R1** reworded\n' }));
  // Disguised as pin-only: the pin and a test; the pin and a test that reads it, on the base.
  const d3 = flow(pr(product(), 'p3/pin-d3', { 'test/alpha/sneak.test.mjs': whole('alpha') }, { pin: PIN1 }));
  const d4 = flow(pr(product({ 'test/alpha/v.test.mjs': "import { readFileSync } from 'node:fs'; readFileSync('.process/VERSION');\n" }), 'p3/pin-d4', {}, { pin: PIN1 }));
  for (const [what, d] of [['code beside a requirements file', d1], ['a requirements file the code reads', d2], ['a test beside the pin', d3], ['a test reading the pin', d4]]) {
    assert.deepEqual([d.step, d.browser, d.class], ['full', 'keep', 'full'], what);
