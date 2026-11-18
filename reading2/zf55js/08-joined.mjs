// ===== file: slots.test.mjs (continued) =====

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

// ===== file: gate.test.mjs =====

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { gate as gateRun, gateComment, measuredBy, namedVerdict, passedByFile, receiptAgrees, revertExemption } from '../lib/gate.mjs';
import { merge, unread } from '../lib/merge.mjs';
import { BOT, GATE, RECEIPT, REVERT_EXEMPT, block, gateRuns, parseBlock } from '../lib/github.mjs';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { git, loadConfig } from '../lib/util.mjs';
import { commit, entry, makeRepo } from './helpers.mjs';
// The gate never posts; job post writes its row as a comment after the run, as here.
const gate = (root, o) => { const r = gateRun(root, o); if (o.pr && o.post !== false) o.io.addComment(o.slug, o.pr, gateComment(r.run)); return r; };

const quiet = () => {};
const realTest = "import test from 'node:test'; import a from 'node:assert'; import { x } from '../../src/alpha/index.mjs';\ntest('x is 2', () => a.equal(x, 2));\n";
const inertTest = "import test from 'node:test'; test('nothing', () => {});\n";

// A product with module alpha on the tranche, and a job branch with a change.
function setup(files) {
  const root = makeRepo({
    'process/ledger/alpha.json': entry('alpha', { status: { state: 'WORKING' } }),
    'src/alpha/index.mjs': 'export const x = 1;\n',
    'test/alpha/old.test.mjs': inertTest,
  });
  git(['branch', 'tranche'], { cwd: root });
  const base = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', '-b', 'job/alpha'], { cwd: root });
  const head = commit(root, files);
  return { root, base, head };
}

function fakeIO(receipt) {
  // The receipt is the opener's (the session account); the gate reads no one else's.
  const state = { comments: receipt ? [{ id: 1, body: block(RECEIPT, receipt), user: { login: 'civicsmith' } }] : [], genuine: new Set() };
  const key = (r) => `${r.at}|${r.sha}|${r.trigger}`;
  return {
    state,
    io: {
      comments: () => state.comments,
      getPR: () => ({ user: { login: 'civicsmith' } }),
      addComment: (s, n, body) => {
        state.comments.push({ id: state.comments.length + 1, body, user: { login: BOT } });
        for (const r of parseBlock(body, GATE)?.runs || []) state.genuine.add(key(r));
        return {};
      },
      // Stands for verifyRow: only rows the gate itself posted are backed by a run's artifact.
      verify: (s, r) => state.genuine.has(key(r)),
    },
  };
}
const receiptFor = (sha, suiteExit = 0, extra = {}) => ({ kind: 'receipt', module: 'alpha', attempt: 1, sha, commands: [{ cmd: 'node --test', exit: suiteExit, suite: true }], exempt: {}, ...extra });
const run = (s, io, over = {}) => gate(s.root, { base: s.base, head: s.head, branch: 'job/alpha', pr: 5, slug: 'o/r', io: io.io, log: quiet, ...over });

test('a real change with a real test passes, and the receipt agrees', () => {
  const s = setup({ 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/x.test.mjs': realTest });
  const io = fakeIO(receiptFor(null));
  io.state.comments[0].body = block(RECEIPT, receiptFor(s.head));
  const r = run(s, io);
  assert.deepEqual(r.findings, []);
  assert.deepEqual([r.run.trigger, r.run.suite, r.run.revert, r.run.receipt], ['code', 'pass', 'pass', 'agrees']);
  assert.equal(git(['diff', '--stat'], { cwd: s.root }), '', 'the revert check restores the tree');
  assert.equal(gateRuns(io.state.comments).length, 1);
});

// AUD-1, JOB-12: an inert test fails the gate; only a reviewed exemption on the pull request,
// never the receipt's own words, exempts a refactor.
const exemptBlock = (sha, reviewer = 'session_reviewer', module = 'alpha') => ({ id: 99, body: block(REVERT_EXEMPT, { kind: 'revert-exempt', module, pr: 5, sha, reviewer, why: 'a refactor; behaviour unchanged' }), user: { login: 'civicsmith' } });
test('a test that passes with the change reverted is inert: a finding (AUD-1)', () => {
  const s = setup({ 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/y.test.mjs': inertTest });
  const r = run(s, fakeIO(receiptFor(s.head)));
  assert.deepEqual([r.run.revert, r.run.inert, r.run.ok], ['fail', ['test/alpha/y.test.mjs'], false]);
  assert.deepEqual(r.findings.map((f) => [f.check, f.file]), [['revert', 'test/alpha/y.test.mjs']]);
  // The receipt's own exemption is a request, never the exemption: still a finding, naming the act.
  const asked = run(s, fakeIO(receiptFor(s.head, 0, { exempt: { revert: 'a refactor' } })));
  assert.equal(asked.run.revert, 'fail');
  assert.match(asked.findings[0].message, /stands only as a reviewed one on the pull request: p3 revert exempt/);
});

const COMPLETE = { 'process/metrics/alpha.jsonl': '{"row":"attempt","event":"complete","attempt":1,"session":"session_job"}\n' };
test('a reviewed exemption on the pull request exempts the revert check; the job\'s own, or one for other code, does not', () => {
  const s = setup({ 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/y.test.mjs': inertTest, ...COMPLETE });
  const io = fakeIO(receiptFor(s.head));
  io.state.comments.push(exemptBlock(s.head));
  const r = run(s, io);
  assert.deepEqual([r.run.revert, r.run.revert_exempt, r.findings], ['exempt', { by: 'session_reviewer', sha: s.head }, []]);
  // Its reviewer is the job's own session (the newest complete row's): no exemption.
  const own = setup({ 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/y.test.mjs': inertTest, ...COMPLETE });
  const io2 = fakeIO(receiptFor(own.head));
  io2.state.comments.push(exemptBlock(own.head, 'cse_job'));
  const said = [];
  const r2 = run(own, io2, { log: (m) => said.push(String(m)) });
  assert.equal(r2.run.revert, 'fail');
  assert.ok(said.some((m) => /a job never exempts itself/.test(m)), said.join('\n'));
  // Reviewed on an earlier commit, the code changed since: the check runs.
  const head2 = commit(s.root, { 'src/alpha/index.mjs': 'export const x = 3;\n' });
  const r3 = gate(s.root, { base: s.base, head: head2, branch: 'job/alpha', pr: 5, slug: 'o/r', io: fakeIO(receiptFor(head2)).io, log: quiet });
  assert.equal(r3.run.revert, 'fail');
  const io4 = fakeIO(receiptFor(head2));
  io4.state.comments.push(exemptBlock(s.head));
  assert.equal(gate(s.root, { base: s.base, head: head2, branch: 'job/alpha', pr: 5, slug: 'o/r', io: io4.io, log: quiet }).run.revert, 'fail');
  // Records only since the reviewed commit: it stands.
  const head3 = commit(s.root, { 'process/metrics/alpha.jsonl': `${COMPLETE['process/metrics/alpha.jsonl']}{}\n` });
  const io5 = fakeIO(receiptFor(head3));
  io5.state.comments.push(exemptBlock(head2));
  assert.equal(gate(s.root, { base: s.base, head: head3, branch: 'job/alpha', pr: 5, slug: 'o/r', io: io5.io, log: quiet }).run.revert, 'exempt');
});

test('a change with no test is no finding: the row says so', () => {
  const s = setup({ 'src/alpha/index.mjs': 'export const x = 2;\n' });
  const r = run(s, fakeIO(receiptFor(s.head)));
  assert.deepEqual([r.run.revert, r.findings], ['no test changed', []]);
});

// Cold review of build/audit-restores: the exemption binds the job's own code, so the tranche merged
// in (job sync, merge) keeps it; it fails closed with no job session; an edited block is never read,
// and a junk block does not hide a good one.
test('a reviewed exemption survives the tranche merged in, fails closed without the job\'s session, and skips edited or junk blocks', () => {
  const s = setup({ 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/y.test.mjs': inertTest, ...COMPLETE });
  const cfg = loadConfig(s.root);
  const e = JSON.parse(readFileSync(join(s.root, 'process/ledger/alpha.json'), 'utf8'));
  const ctx = (head, jobSession = 'session_job') => ({ root: s.root, cfg, head, entry: e, job: 'alpha', jobSession });
  const merged = commit(s.root, { 'src/beta/b.mjs': 'export const b = 1;\n' }, 'Bring the tranche in');
  assert.equal(revertExemption([exemptBlock(s.head)], ctx(merged)).ok, true, 'another module\'s files do not void it');
  const testEdit = commit(s.root, { 'test/alpha/y.test.mjs': inertTest + '// edited after review\n' });
  assert.match(revertExemption([exemptBlock(s.head)], ctx(testEdit)).why, /in 1 file\(s\): test\/alpha\/y\.test\.mjs/, 'a test edited after review voids it');
  git(['reset', '-q', '--hard', merged], { cwd: s.root });
  const changed = commit(s.root, { 'src/alpha/index.mjs': 'export const x = 4;\n' });
  assert.match(revertExemption([exemptBlock(s.head)], ctx(changed)).why, /the job's code differs from .* in 1 file\(s\): src\/alpha\/index\.mjs/);
  assert.match(revertExemption([exemptBlock(s.head)], ctx(merged, null)).why, /records no session, so its reviewer cannot be told from the job/);
  const edited = { ...exemptBlock(s.head), created_at: '2026-11-06T00:00:00Z', updated_at: '2026-11-06T00:05:00Z' };
  assert.equal(revertExemption([edited], ctx(merged)), null);
  const junk = { id: 100, body: block(REVERT_EXEMPT, { module: 'alpha', sha: s.head, reviewer: '', why: '' }), user: { login: 'x' } };
  assert.equal(revertExemption([exemptBlock(s.head), junk], ctx(merged)).ok, true);
  assert.equal(revertExemption([junk], ctx(merged)).ok, false);
});

test('measuredBy stands on a green run that checked the same receipt attempt, whatever commit the receipt names', () => {
  const s = setup({ 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/x.test.mjs': realTest });
  const later = commit(s.root, { 'src/alpha/index.mjs': 'export const x = 2; // fixed\n' });
  const cfg = loadConfig(s.root);
  const green = { sha: later, scope: ['alpha'], suite: 'pass', receipt: 'agrees', receipt_attempt: 1, receipt_tests: [] };
  assert.equal(measuredBy(s.root, cfg, receiptFor(s.head), green).ok, true);
  assert.match(measuredBy(s.root, cfg, { ...receiptFor(s.head), attempt: 2 }, green).why, /whose code is not what the last green code run/);
  assert.match(measuredBy(s.root, cfg, { ...receiptFor(s.head), tests: [{ file: 'test/alpha/x.test.mjs', name: 'x is 2' }] }, green).why, /names 1 test\(s\) the last green code run, on .* did not check/);
});

// AUD-2, JOB-7: the receipt is checked against CI's own run of its tests.
test('a receipt claiming a green suite the gate finds red disagrees: a finding', () => {
  const s = setup({ 'src/alpha/index.mjs': 'export const x = 3;\n', 'test/alpha/x.test.mjs': realTest });
  const r = run(s, fakeIO(receiptFor(s.head, 0)));
  assert.deepEqual([r.run.suite, r.run.receipt], ['fail', 'disagrees']);
  assert.deepEqual(r.findings.map((f) => f.check).sort(), ['receipt', 'suite']);
  // A receipt with no suite run in the session (AUD-7) claims the suite passes in CI.
  const bare = run(s, fakeIO({ ...receiptFor(s.head), commands: [] }));
  assert.equal(bare.run.receipt, 'disagrees');
  assert.match(bare.findings.find((f) => f.check === 'receipt').message, /passes \(no suite run in the session\)/);
});

test('a test the receipt names for a mark that fails in the gate\'s run disagrees; one the run does not show is not judged', () => {
  const g = passedByFile([{ passing: [{ file: 'test/a.test.mjs', name: 'group > x is 2' }], failing: [{ file: 'test/a.test.mjs', name: 'x is 9' }], whole: [] }, { passing: [], failing: [{ file: 'test/b.test.mjs', name: 'test/b.test.mjs' }], whole: ['test/b.test.mjs'] }]);
  assert.equal(namedVerdict(g, 'test/a.test.mjs::x is 2'), 'pass');
  assert.equal(namedVerdict(g, 'test/a.test.mjs::x is 9'), 'fail');
  assert.equal(namedVerdict(g, 'test/b.test.mjs::anything'), 'fail', 'a file that failed as a whole ran none of its tests');
  assert.equal(namedVerdict(g, 'test/a.test.mjs::no such'), null);
  assert.equal(namedVerdict(g, 'test/a.test.mjs::x is'), null, 'a longer name that holds it is another test');
  assert.equal(namedVerdict(g, 'test/b.test.mjs::anything', ['test/b.test.mjs::test/b.test.mjs']), null, 'a whole file tolerated as base-red says nothing of its tests');
  // Another describe's test of the same name, tolerated as base-red, is not the named test's failure.
  const c = passedByFile([{ passing: [{ file: 't/c.test.mjs', name: 'A > works' }], failing: [{ file: 't/c.test.mjs', name: 'B > works' }], whole: [] }]);
  assert.equal(namedVerdict(c, 't/c.test.mjs::works', ['t/c.test.mjs::B > works']), 'pass');
  assert.equal(namedVerdict(c, 't/c.test.mjs::works'), 'fail');
  assert.equal(namedVerdict(g, 'test/c.test.mjs::x'), null);
  assert.equal(namedVerdict(null, 'test/a.test.mjs::x is 9'), null);
  assert.equal(passedByFile([{ passing: null, failing: null }]), null);
  // A named test that failed disagrees even where the suite's verdict agrees.
  assert.equal(receiptAgrees(undefined, 'base-red', [], []), true);
  // A name no test holds is not judged by the run.
  const p = setup({ 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/x.test.mjs': realTest });
  const ok = run(p, fakeIO({ ...receiptFor(p.head), commands: [], tests: [{ req: 'R1', file: 'test/alpha/x.test.mjs', name: 'x is 2' }, { req: 'R2', file: 'test/alpha/x.test.mjs', name: 'from' }] }));
  assert.deepEqual([ok.run.receipt, ok.run.receipt_tests, ok.findings], ['agrees', ['test/alpha/x.test.mjs::x is 2', 'test/alpha/x.test.mjs::from'], []]);
});

test('a ready job with no receipt is a finding; a draft runs only the fast checks', () => {
  const s = setup({ 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/x.test.mjs': realTest });
  assert.ok(run(s, fakeIO()).findings.some((f) => f.check === 'receipt'));
  const d = run(s, fakeIO(), { draft: true });
  assert.deepEqual([d.run.trigger, d.run.suite, d.findings.length], ['draft', 'skipped', 0]);
});

test('files outside the module are not the job\'s to change', () => {
  const s = setup({ 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/x.test.mjs': realTest, 'src/beta/b.mjs': 'x' });
  assert.ok(run(s, fakeIO(receiptFor(s.head))).findings.some((f) => f.check === 'ownership' && f.file === 'src/beta/b.mjs'));
});

test('record-only changes end in seconds: a records PR, and records since the last green run', () => {
  const s = setup({ 'process/metrics/alpha.jsonl': '{}\n' });
  const r = run(s, fakeIO());
  assert.deepEqual([r.run.trigger, r.run.suite, r.findings.length], ['record', 'skipped', 0]);

  const c = setup({ 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/x.test.mjs': realTest });
  const io = fakeIO(receiptFor(c.head));
  assert.equal(run(c, io).run.trigger, 'code');
  const head2 = commit(c.root, { 'process/metrics/alpha.jsonl': '{"row":"merge"}\n' });
  const r2 = gate(c.root, { base: c.base, head: head2, branch: 'job/alpha', pr: 5, slug: 'o/r', io: io.io, log: quiet });
  assert.deepEqual([r2.run.trigger, r2.run.after, r2.findings.length], ['record-since-green', c.head, 0]);
  assert.equal(gateRuns(io.state.comments).length, 2);
});

// Copy PR 247, 4 Nov: attempt 3 changed only process/ledger and process/metrics, its test
// already on the tranche from attempt 2. Every run on its head was "record", the receipt never
// checked (AUD-2), and merge refused it. A ready job's receipt with no green code run to stand on gets one.
test('a records-only job pull request with a receipt gets a code run whose receipt check agrees, and merges', () => {
  const s = setup({ 'process/metrics/alpha.jsonl': '{"row":"attempt","event":"complete","attempt":3}\n' });
  const io = fakeIO({ ...receiptFor(s.head), attempt: 3 });
  const said = [];
  const r = run(s, io, { log: (m) => said.push(m) });
  assert.deepEqual([r.run.trigger, r.run.scope, r.run.suite, r.run.revert, r.run.receipt, r.run.receipt_attempt, r.run.ok], ['code', ['alpha'], 'pass', 'no code changed', 'agrees', 3, true]);
  // Each module's own suite seconds (build ci-budget): status reads them against suite_timeout_minutes.
  assert.deepEqual(Object.keys(r.run.suite_by_module), ['alpha']);
  assert.equal(r.run.suite_by_module.alpha, r.run.suite_seconds);
  assert.ok(said.some((m) => /only records changed, but no green code run measured receipt attempt 3/.test(m)), said.join('\n'));
  assert.equal(unread(gateRuns(io.state.comments), s.head, 3), '');
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: s.root });
  git(['remote', 'add', 'origin', bare], { cwd: s.root });
  git(['push', '-q', 'origin', 'tranche', 'job/alpha', 'main'], { cwd: s.root });
  git(['checkout', '-q', 'main'], { cwd: s.root });
  let merged = null;
  const m = merge(s.root, 247, { slug: 'o/r', reviewed: 'test', rounds: 1, reviewMinutes: 5, findings: 0, actedOn: 0, log: quiet, io: {
    getPR: () => ({ state: 'open', draft: false, user: { login: 'civicsmith' }, base: { ref: 'tranche' }, head: { ref: 'job/alpha', sha: s.head } }),
    comments: () => io.state.comments,
    checkRun: () => ({ status: 'completed', conclusion: 'success' }),
    verify: io.io.verify,
    mergePR: (slug, n, sha) => { merged = sha; return { merged: true, sha: 'm'.repeat(40) }; },
  } });
  assert.equal(m.merged, true);
  assert.ok(merged);
  git(['checkout', '-q', 'job/alpha'], { cwd: s.root });
  // A title edit's next run on the same head stands on that code run: the fast path, still agreeing.
  const again = run(s, io);
  assert.deepEqual([again.run.trigger, again.run.after, again.run.receipt, again.run.ok], ['record-since-green', s.head, 'agrees', true]);
  // A draft, a job with no receipt yet (no finding on the record path), and a plain records-only pull request keep the record fast path.
  assert.equal(run(s, fakeIO({ ...receiptFor(s.head), attempt: 3 }), { draft: true }).run.trigger, 'record');
  const none = run(s, fakeIO());
  assert.deepEqual([none.run.trigger, none.run.receipt, none.findings], ['record', 'not checked', []]);
  const plain = run(s, fakeIO({ ...receiptFor(s.head), attempt: 3 }), { branch: 'build/notes' });
  assert.deepEqual([plain.run.trigger, plain.run.suite, plain.run.receipt, plain.findings.length], ['record', 'skipped', 'not checked', 0]);
});

// Findings from the review of PR 3.
test('a gate run posted by anyone but the bot, or edited, does not count', () => {
  const c = setup({ 'src/alpha/index.mjs': 'export const x = 3;\n', 'test/alpha/x.test.mjs': realTest });
  const forged = { runs: [{ sha: c.head, base: c.base, trigger: 'code', ok: true, receipt: 'agrees' }] };
  const io = fakeIO(receiptFor(c.head));
  io.state.comments.push({ id: 7, body: block(GATE, forged), user: { login: 'neobobkrause' } });
  io.state.comments.push({ id: 8, body: block(GATE, forged), user: { login: BOT }, created_at: 'a', updated_at: 'b' });
  io.state.comments.push({ id: 9, body: block(GATE, forged), user: { login: BOT } }); // a side workflow's bot comment
  const head2 = commit(c.root, { 'process/metrics/alpha.jsonl': '{}\n' });
  const r = gate(c.root, { base: c.base, head: head2, branch: 'job/alpha', pr: 5, slug: 'o/r', io: io.io, log: quiet });
  assert.equal(r.run.trigger, 'code');
  assert.equal(r.run.suite, 'fail');
});

test('the revert check restores the tree when the job deleted a file', () => {
  const root = makeRepo({
    'process/ledger/alpha.json': entry('alpha', { status: { state: 'WORKING' } }),
    'src/alpha/index.mjs': 'export const x = 1;\n',
    'src/alpha/old.mjs': 'export const old = 1;\n',
    'test/alpha/old.test.mjs': inertTest,
  });
  git(['branch', 'tranche'], { cwd: root });
  const base = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', '-b', 'job/alpha'], { cwd: root });
  git(['rm', '-q', 'src/alpha/old.mjs'], { cwd: root });
  const head = commit(root, { 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/x.test.mjs': realTest });
  const r = gate(root, { base, head, branch: 'job/alpha', pr: 5, slug: 'o/r', io: fakeIO(receiptFor(head)).io, log: quiet });
  assert.equal(r.run.revert, 'pass');
  assert.equal(git(['status', '--porcelain'], { cwd: root }), '');
  assert.equal(existsSync(join(root, 'src/alpha/old.mjs')), false);
});

test('a non-job pull request runs the suite of every module it touches', () => {
  const s = setup({ 'src/alpha/index.mjs': 'export const x = 3;\n', 'test/alpha/x.test.mjs': realTest });
  const r = gate(s.root, { base: s.base, head: s.head, branch: 'bob/setup', pr: 5, slug: 'o/r', io: fakeIO().io, log: quiet });
  assert.deepEqual([r.run.scope, r.run.suite], [['alpha'], 'fail']);
});

// Two jobs (setup audit, 2 Nov): job gate writes the row to its artifact only; job post posts it.
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { GATE_WORKFLOW, verifyRow } from '../lib/github.mjs';
import { postRow } from '../lib/gate.mjs';
import { main, report } from '../p3.mjs';

function twoJobs(over = {}) {
  const s = setup({ 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/x.test.mjs': realTest });
  const io = fakeIO(receiptFor(s.head));
  const was = process.env.GITHUB_RUN_ID;
  process.env.GITHUB_RUN_ID = '4242';
  let r;
  try { r = run(s, io, { post: false, ...over }); } finally { if (was === undefined) delete process.env.GITHUB_RUN_ID; else process.env.GITHUB_RUN_ID = was; }
  // What job gate uploads as the gate-row artifact: the --out file of the gate command.
  const file = join(mkdtempSync(join(tmpdir(), 'p3-row-')), 'gate.json');
  report(r.findings, file, { run: r.run });
  return { s, io, r, file };
}

test('job gate posts nothing; job post posts the artifact\'s row, and merge\'s verifyRow trusts it', () => {
  const { s, io, r, file } = twoJobs();
  assert.equal(r.run.ok, true);
  assert.equal(io.state.comments.length, 1, 'only the receipt: job gate posted no comment');
  const posted = postRow(file, { pr: 5, head: s.head, gateResult: 'success', slug: 'o/r', runId: '4242', io: io.io, log: quiet });
  assert.equal(posted.posted, true);
  const c = io.state.comments.at(-1);
  assert.equal(c.user.login, BOT);
  const rows = gateRuns(io.state.comments);
  assert.equal(rows.length, 1);
  assert.match(c.body, new RegExp(`Gate run on \`${s.head.slice(0, 10)}\`: green, code`));
  // The run is the process gate on the head, completed green, and its artifact is the same file.
  const actionsRun = { path: GATE_WORKFLOW, head_sha: s.head, status: 'completed', conclusion: 'success', event: 'pull_request', pull_requests: [{ number: 5, base: { ref: 'tranche' } }] };
  const art = JSON.parse(readFileSync(file, 'utf8')).run;
  assert.equal(rows[0].run_id, 4242);
  assert.equal(verifyRow('o/r', rows[0], { pr: 5, baseRef: 'tranche' }, { getRun: (slug, id) => (id === 4242 ? actionsRun : null), runArtifactRow: () => art }), true);
  // A copy of the row that changes what it tolerated is not this run's (review of PR 134).
  for (const k of ['base_red']) {
    assert.equal(verifyRow('o/r', { ...rows[0], [k]: [{ tests: ['t/a.test.mjs::x'] }] }, { pr: 5, baseRef: 'tranche' }, { getRun: (slug, id) => (id === 4242 ? actionsRun : null), runArtifactRow: () => art }), false, k);
  }
});

test('job post refuses a row that is not this run\'s, not this head\'s, or green when job gate was not', () => {
  const { s, io, file } = twoJobs();
  const q = { pr: 5, slug: 'o/r', io: io.io, log: quiet };
  assert.throws(() => postRow(file, { ...q, head: s.head, runId: '9' }), /names run 4242, not this run 9/);
  assert.throws(() => postRow(file, { ...q, head: 'f'.repeat(40), runId: '4242' }), /not the head ffffffffff/);
  assert.throws(() => postRow(file, { ...q, head: s.head, runId: '4242', gateResult: 'failure' }), /says green, but job gate ended failure/);
  assert.throws(() => postRow(file, { ...q, pr: null, runId: '4242' }), /needs --pr/);
  assert.equal(io.state.comments.length, 1, 'nothing posted');
});

test('job post posts a red row, and posts nothing when job gate wrote no row', () => {
  // A red row: the suite fails.
  const s = setup({ 'src/alpha/index.mjs': 'export const x = 3;\n', 'test/alpha/x.test.mjs': realTest });
  const io = fakeIO(receiptFor(s.head));
  const r = run(s, io, { post: false });
  const file = join(mkdtempSync(join(tmpdir(), 'p3-row-')), 'gate.json');
  report(r.findings, file, { run: { ...r.run, run_id: 7 } });
  const p = postRow(file, { pr: 5, head: s.head, gateResult: 'failure', slug: 'o/r', runId: '7', io: io.io, log: quiet });
  assert.equal(p.row.ok, false);
  assert.match(io.state.comments.at(-1).body, /red, 2 finding\(s\)/);

  const out = [];
  assert.equal(postRow(join(tmpdir(), 'p3-no-such-row.json'), { pr: 5, slug: 'o/r', io: io.io, log: (m) => out.push(m) }).posted, false);
  const err = join(mkdtempSync(join(tmpdir(), 'p3-row-')), 'gate.json');
  writeFileSync(err, JSON.stringify({ error: 'git merge-base failed', findings: [] }));
  assert.equal(postRow(err, { pr: 5, slug: 'o/r', io: io.io, log: (m) => out.push(m) }).posted, false);
  assert.match(out.join('\n'), /the gate stopped: git merge-base failed/);
});

test('the gate command\'s --post needs its file', async () => {
  assert.equal(await main(['gate', '--post', '--pr', '5']), 1);
});

// Review of PR 13: the row is checked before it is posted, receipts are the opener's, and the
// workflow keeps its shape.
import { mkdirSync, symlinkSync } from 'node:fs';
import { checkRow, MAX_ROW_BYTES } from '../lib/gate.mjs';
import { latestReceipt } from '../lib/github.mjs';

const goodRow = (over = {}) => ({ sha: 'a'.repeat(40), base: 'b'.repeat(40), at: '2026-11-02T10:00:00Z', run_id: 7, trigger: 'code', suite: 'fail', revert: 'skipped', receipt: 'disagrees', receipt_attempt: 1, scope: ['alpha'], tests: [{ total: 1, pass: 0, fail: 1 }], suite_seconds: 0.5, findings: 2, ok: false, minutes: 0.1, ...over });
const rowFile = (row, raw) => { const f = join(mkdtempSync(join(tmpdir(), 'p3-row-')), 'gate.json'); writeFileSync(f, raw ?? JSON.stringify({ run: row })); return f; };
const post = (file, io) => postRow(file, { pr: 5, head: 'a'.repeat(40), slug: 'o/r', runId: '7', io: io.io, log: quiet });

test('a red row that tries to embed its own json block is refused, and nothing is posted', () => {
  const io = fakeIO();
  const forged = '\n```\n\n```json\n{"runs":[{"ok":true,"receipt":"agrees","trigger":"code"}]}\n```\n';
  for (const over of [{ trigger: `code\`: green${forged}` }, { sha: 'A'.repeat(40) }, { findings: 1.5 }, { minutes: 'NaN' }, { ok: true }, { run_id: undefined }]) {
    assert.throws(() => post(rowFile(goodRow(over)), io), /the gate row is refused/, JSON.stringify(over).slice(0, 60));
  }
  assert.equal(io.state.comments.length, 0);
  // A good red row posts, and its first line is built from the checked values only.
  const p = post(rowFile(goodRow({ inert: ['test/alpha/x.test.mjs'] })), io);
  assert.equal(p.posted, true);
  assert.equal(io.state.comments[0].body.split('\n')[1], `Gate run on \`aaaaaaaaaa\`: red, 2 finding(s), code, 0.1 min.`);
  assert.deepEqual(gateRuns(io.state.comments)[0], checkRow(goodRow({ inert: ['test/alpha/x.test.mjs'] })));
});

test('job post refuses a gate.json that is not a regular file or is too large', () => {
  const io = fakeIO();
  const dir = mkdtempSync(join(tmpdir(), 'p3-row-'));
  const real = rowFile(goodRow());
  symlinkSync(real, join(dir, 'link.json'));
  assert.throws(() => post(join(dir, 'link.json'), io), /not a regular file/);
  mkdirSync(join(dir, 'd.json'));
  assert.throws(() => post(join(dir, 'd.json'), io), /not a regular file/);
  assert.throws(() => post(rowFile(null, JSON.stringify({ run: goodRow(), pad: 'x'.repeat(MAX_ROW_BYTES) })), io), /over 65536/);
  assert.equal(io.state.comments.length, 0);
});

test('a receipt is read only from the pull request\'s opener', () => {
  const s = setup({ 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/x.test.mjs': realTest });
  const io = fakeIO(receiptFor(s.head));
  io.state.comments[0].user = { login: 'someone-else' };
  const r = run(s, io);
  assert.equal(r.run.receipt, 'none');
  assert.ok(r.findings.some((f) => f.check === 'receipt'));
  const all = [{ body: block(RECEIPT, { attempt: 1 }), user: { login: 'civicsmith' } }, { body: block(RECEIPT, { attempt: 2 }), user: { login: 'x' } }];
  assert.equal(latestReceipt(all, 'civicsmith').attempt, 1);
  assert.equal(latestReceipt(all, undefined), null, 'no opener: no receipt');
});

test('the gate workflow keeps its shape: a read-only gate, --no-post, and a post job that runs nothing from the pull request', () => {
  const text = readFileSync(join(import.meta.dirname, '..', '..', 'shims', 'process-gate.yml'), 'utf8');
  const jobs = Object.fromEntries(text.slice(text.indexOf('\njobs:\n')).split(/^ {2}(?=[a-z][\w-]*:\s*$)/m).slice(1).map((b) => [b.slice(0, b.indexOf(':')), b]));
  assert.deepEqual(Object.keys(jobs), ['gate', 'post']);
  assert.doesNotMatch(jobs.gate, /:\s*write\b/, 'job gate holds no write permission');
  assert.match(text, /^permissions: \{\}$/m);
  const gateCalls = jobs.gate.split('\n').filter((l) => /p3\.mjs" gate /.test(l));
  assert.equal(gateCalls.length, 1);
  assert.match(gateCalls[0], /--pr "\$PR".*--no-post/);
  // Job post: every checkout is of the base; it runs only the process clone's tool.
  const checkouts = jobs.post.split(/^ {6}- /m).filter((st) => /uses: actions\/checkout@/.test(st));
  assert.ok(checkouts.length >= 1 && checkouts.every((st) => /ref: \$\{\{ github\.event\.pull_request\.base\.sha \}\}/.test(st)));
  for (const st of jobs.post.split(/^ {6}- /m).filter((x) => /(^|\s)node\s/m.test(x))) {
    assert.match(st, /working-directory: \$\{\{ runner\.temp \}\}\/process3/);
    assert.match(st, /run: node tool\/p3\.mjs gate --post /);
  }
  assert.doesNotMatch(jobs.post, /(^|\s)(bash|sh|source|\.)\s+(\.\/|base\/)|run: \.\//m);
  assert.match(jobs.post, /if: \$\{\{ !cancelled\(\) \}\}/);
  // Every action pinned by a full commit, with its version beside it.
  for (const u of text.match(/uses: \S+.*$/gm)) assert.match(u, /^uses: actions\/[\w-]+(\/[\w-]+)?@[0-9a-f]{40} # v\d+\.\d+\.\d+$/, u);
  // Products' older shims grep the pinned tool for this line (review B of PR 32).
  assert.match(readFileSync(join(import.meta.dirname, '..', 'p3.mjs'), 'utf8'), /^\/\/ p3-capability: gate-no-post/m);
  // Job post downloads the artifact before it checks anything out.
  const steps = jobs.post.split(/^ {6}- /m);
  const dl = steps.findIndex((st) => /uses: actions\/download-artifact@/.test(st));
  const co = steps.findIndex((st) => /uses: actions\/checkout@/.test(st));
  assert.ok(dl > 0 && co > dl, `download (${dl}) before checkout (${co})`);
});

// GAT-5 (review of PR 11): the gate installs every lock file the base's config names, wherever
// it sits, and without the GitHub tokens.
test('the gate installs every lock file, not only the module\'s', () => {
  const lockfiles = ['package-lock.json', 'src/alpha/package-lock.json', 'other/deep/package-lock.json'];
  const lock = JSON.stringify({ lockfileVersion: 3, packages: { '': {} } });
  const root = makeRepo({
    'process/config.json': { lockfiles },
    'process/ledger/alpha.json': entry('alpha', { status: { state: 'WORKING' } }),
    'src/alpha/index.mjs': 'export const x = 1;\n',
    'test/alpha/old.test.mjs': inertTest,
    ...Object.fromEntries(lockfiles.map((l) => [l, lock])),
  });
  git(['branch', 'tranche'], { cwd: root });
  const base = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', '-b', 'job/alpha'], { cwd: root });
  const head = commit(root, { 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/x.test.mjs': realTest });
  const calls = [];
  const exec = (cmd, args, o) => { calls.push({ cwd: o.cwd.slice(root.length + 1) || '.', unset: o.unset }); return { code: 0, stdout: '', stderr: '' }; };
  const r = gate(root, { base, head, branch: 'job/alpha', pr: 5, slug: 'o/r', io: fakeIO(receiptFor(head)).io, exec, log: quiet });
  assert.equal(r.run.suite, 'pass');
  assert.deepEqual(calls.map((c) => c.cwd), ['.', 'src/alpha', 'other/deep'], 'every lock file, even with no dependencies');
  assert.ok(calls.every((c) => c.unset.includes('GH_TOKEN') && c.unset.includes('GITHUB_TOKEN')));
});

// Confirming review of PR 13: text from the artifact is printed without line breaks or
// control characters, so it cannot emit a workflow command.
test('job post prints artifact text without line breaks or control characters', () => {
  const io = fakeIO();
  const out = [];
  const log = (m) => out.push(m);
  const evil = '\n::error file=x::pwned\r\u0007';
  assert.throws(() => postRow(rowFile({ ...goodRow(), trigger: `code${evil}` }), { pr: 5, slug: 'o/r', runId: '7', io: io.io, log }), (e) => !/[\n\r\u0007]/.test(e.message) && /trigger is not a valid value/.test(e.message));
  postRow(rowFile(null, JSON.stringify({ error: `stopped${evil}` })), { pr: 5, slug: 'o/r', io: io.io, log });
  assert.ok(out.length && out.every((l) => !/[\n\r\u0007]/.test(l)), JSON.stringify(out));
  assert.throws(() => postRow(rowFile(null, `{"x":${evil}`), { pr: 5, slug: 'o/r', io: io.io, log }), (e) => /is not JSON/.test(e.message) && !/[\n\r\u0007]/.test(e.message));
  assert.equal(io.state.comments.length, 0);
});

test('a job that changes only its requirements file\'s marks has no ownership finding', () => {
  const s = setup({ 'req/alpha.md': '- **R1** met\n' });
  const r = run(s, fakeIO(), { draft: true });
  assert.ok(!r.findings.some((f) => f.check === 'ownership'), JSON.stringify(r.findings));
});

test('a job that adds a test for a mark its module already meets and strikes it changes no code', () => {
  const metTest = "import test from 'node:test'; import a from 'node:assert'; import { x } from '../../src/alpha/index.mjs';\ntest('x is 1', () => a.equal(x, 1));\n";
  const s = setup({ 'test/alpha/x.test.mjs': metTest, 'req/alpha.md': '- **R1** met\n' });
  const r = run(s, fakeIO(receiptFor(s.head)));
  assert.equal(r.run.revert, 'no code changed');
  assert.deepEqual(r.findings, []);
});

// The gate race (copy PRs 55, 61, 62, 63, 4 Nov): job complete pushes, then marks ready. The
// push's synchronize run carries draft: true in its payload, the ready_for_review run draft:
// false; both are created in the same second and the concurrency group keeps one of them,
// either one. The gate reads the pull request's draft state live, so whichever run is kept
// gives the one full run on the head: the suite and the receipt.
test('the gate race: whichever of the push\'s run and the ready run is kept judges the pull request as it is now', () => {
  const s = setup({ 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/x.test.mjs': realTest });
  const live = (draft) => { const io = fakeIO(receiptFor(s.head)); io.io.getPR = () => ({ draft, user: { login: 'civicsmith' } }); return io; };
  for (const eventDraft of [true, false]) {
    const io = live(false);
    const out = [];
    const r = run(s, io, { draft: eventDraft, log: (m) => out.push(String(m)) });
    assert.deepEqual([r.run.trigger, r.run.suite, r.run.receipt, r.run.ok], ['code', 'pass', 'agrees', true], `event draft ${eventDraft}`);
    assert.equal(out.some((l) => /the event said draft/.test(l)), eventDraft);
    assert.equal(r.run.event_draft, eventDraft ? true : undefined);
    assert.equal(gateRuns(io.state.comments).length, 1, 'one row per kept run');
  }
  // Converted back to draft after the event: the live state wins the other way too.
  const d = run(s, live(true), { draft: false });
  assert.deepEqual([d.run.trigger, d.run.suite, d.run.receipt], ['draft', 'skipped', 'not checked']);
  // A failed read stops the run: it never falls back to the event's stale state.
  const broken = fakeIO(receiptFor(s.head));
  broken.io.getPR = () => { throw new Error('HTTP 502'); };
  assert.throws(() => run(s, broken, { draft: true }), /HTTP 502/);
  assert.equal(broken.state.comments.length, 1, 'no row posted');
});

// Copy, 4 Nov: PR 80 untracked rows.mjs (built, not committed); the gate regenerated it only after
// the suite, so every suite importing it failed with ENOENT (41 of 113, bundler run 41767864311).
test('the gate builds untracked generated files before the suite that imports them', () => {
  const gen = "import { mkdirSync, writeFileSync } from 'node:fs';\nmkdirSync('gen', { recursive: true });\nwriteFileSync('gen/rows.mjs', 'export const rows = 3;\\n');\n";
  const uses = "import test from 'node:test'; import a from 'node:assert'; import { rows } from '../../gen/rows.mjs'; import { x } from '../../src/alpha/index.mjs';\ntest('rows and x', () => { a.equal(rows, 3); a.equal(x, 2); });\n";
  const root = makeRepo({
    'process/ledger/alpha.json': entry('alpha', { status: { state: 'WORKING' } }),
    'process/config.json': JSON.stringify({ generated: [{ paths: ['gen/rows.mjs'], regenerate: ['node', 'gen.mjs'], verify: ['node', '-e', 'process.exit(0)'] }] }),
    'gen.mjs': gen,
    '.gitignore': 'gen/rows.mjs\n',
    'src/alpha/index.mjs': 'export const x = 1;\n',
    'test/alpha/old.test.mjs': inertTest,
  });
  git(['branch', 'tranche'], { cwd: root });
  const base = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', '-b', 'job/alpha'], { cwd: root });
  const head = commit(root, { 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/rows.test.mjs': uses });
  assert.equal(existsSync(join(root, 'gen/rows.mjs')), false, 'not committed, not built yet');
  const io = fakeIO(null);
  io.state.comments = [{ id: 1, body: block(RECEIPT, receiptFor(head)), user: { login: 'civicsmith' } }];
  const r = gate(root, { base, head, branch: 'job/alpha', pr: 5, slug: 'o/r', io: io.io, log: quiet });
  assert.equal(r.run.suite, 'pass', JSON.stringify(r.findings));
  assert.deepEqual(r.run.built, ['gen/rows.mjs']);
  assert.equal(git(['status', '--porcelain'], { cwd: root }), '', 'the built file is ignored, nothing to commit');
});

// Review of PR 80: a failed build is red once (not twice), the later GAT-4 step does not rebuild a
// row this run built, and a job may not remove a committed generated file.
function genProduct(genScript, extra = {}) {
  const root = makeRepo({
    'process/ledger/alpha.json': entry('alpha', { status: { state: 'WORKING' } }),
    'process/config.json': JSON.stringify({ generated: [{ paths: ['gen/rows.mjs'], regenerate: ['node', 'gen.mjs'], verify: ['node', '-e', 'process.exit(0)'] }] }),
    'gen.mjs': genScript,
    '.gitignore': 'gen/rows.mjs\n',
    'src/alpha/index.mjs': 'export const x = 1;\n',
    'test/alpha/old.test.mjs': inertTest,
    ...extra,
  });
  git(['branch', 'tranche'], { cwd: root });
  const base = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', '-b', 'job/alpha'], { cwd: root });
  return { root, base };
}
const ioFor = (head) => { const io = fakeIO(null); io.state.comments = [{ id: 1, body: block(RECEIPT, receiptFor(head)), user: { login: 'civicsmith' } }]; return io; };

test('a failed generated build is one finding, and no row is regenerated twice in a run', () => {
  const counting = "import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';\nappendFileSync('runs.log', 'x');\nmkdirSync('gen', { recursive: true });\nwriteFileSync('gen/rows.mjs', 'export const rows = 3;\\n');\n";
  const ok = genProduct(counting, { '.gitignore': 'gen/rows.mjs\nruns.log\n' });
  const h1 = commit(ok.root, { 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/x.test.mjs': realTest });
  const r1 = gate(ok.root, { base: ok.base, head: h1, branch: 'job/alpha', pr: 5, slug: 'o/r', io: ioFor(h1).io, log: quiet });
  assert.equal(r1.run.suite, 'pass');
  assert.equal(readFileSync(join(ok.root, 'runs.log'), 'utf8'), 'x', 'built once, not again by GAT-4');

  const bad = genProduct("process.exit(1);\n");
  const h2 = commit(bad.root, { 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/x.test.mjs': realTest });
  const r2 = gate(bad.root, { base: bad.base, head: h2, branch: 'job/alpha', pr: 5, slug: 'o/r', io: ioFor(h2).io, log: quiet });
  const gens = r2.findings.filter((f) => f.check === 'generated');
  assert.equal(gens.length, 1, JSON.stringify(gens));
  assert.match(gens[0].message, /failed \(exit 1\) building gen\/rows\.mjs/);
});

test('a job may not remove a committed generated file', () => {
  const s = genProduct("process.exit(0);\n", { '.gitignore': '', 'gen/rows.mjs': 'export const rows = 3;\n' });
  git(['rm', '-q', 'gen/rows.mjs'], { cwd: s.root });
