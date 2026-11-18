// ===== file: hold.test.mjs (continued) =====

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

// ===== file: state-push.test.mjs =====

// State-branch pushes retry with backoff on GitHub's transient refusals, and a write they give up on
// is kept with the command that replays it (coordinator, 6 Nov: copy PR 678's layer publish lost its
// starts owed to "remote: fatal error in commit_refs").
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { readState, stateIO, stateReplay, writeState } from '../lib/state.mjs';
import { git } from '../lib/util.mjs';
import { makeRepo } from './helpers.mjs';

const SB = 'process-state';
function withOrigin() {
  const root = makeRepo({ 'README.md': 'x\n' });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'main'], { cwd: root });
  return { root, bare };
}
const refused = { code: 1, stdout: '', stderr: 'remote: fatal error in commit_refs\nTo origin\n ! [remote rejected] HEAD -> process-state (failure)' };
const realPush = (wt, sb) => git(['push', '-q', 'origin', `HEAD:refs/heads/${sb}`], { cwd: wt, allowFail: true });

test('a state write refused by "fatal error in commit_refs" is retried and lands; given up, it is kept and replayed by the command it names', () => {
  const { root } = withOrigin();
  const logs = [];
  const orig = console.log;
  stateIO.wait = 1;
  try {
    // Two refusals, then the push goes through.
    let n = 0;
    stateIO.push = (wt, sb) => (++n <= 2 ? refused : realPush(wt, sb));
    console.log = (l) => logs.push(String(l));
    writeState(root, SB, 'starts owed: layer publish x', (wt) => { writeFileSync(join(wt, 'a.txt'), 'one\n'); return {}; });
    assert.equal(n, 3);
    assert.equal(readState(root, SB, 'a.txt'), 'one\n');
    assert.ok(logs.some((l) => /the push hit a server error; fetching and trying again \(2 of 5\)/.test(l)), logs.join('\n'));
    // Refused every time: kept, and the refusal names the replay.
    stateIO.push = () => refused;
    let msg = '';
    try { writeState(root, SB, 'starts owed: layer publish y', (wt) => { writeFileSync(join(wt, 'b.txt'), 'two\n'); return {}; }); } catch (e) { msg = e.message; }
    const ref = msg.match(/state replay (refs\/p3\/unpushed\/\S+)`/)?.[1];
    assert.ok(ref, msg);
    assert.match(msg, /the push of process-state was refused 5 times \(the server kept failing\)[\s\S]*The write is kept: replay it with `node \.process\/tool\/p3\.mjs state replay refs\/p3\/unpushed\//);
    assert.equal(readState(root, SB, 'b.txt'), null, 'not written');
    // The state branch moves meanwhile; the replay picks the kept write onto its fresh tip.
    stateIO.push = null;
    writeState(root, SB, 'another writer', (wt) => { writeFileSync(join(wt, 'c.txt'), 'three\n'); return {}; });
    assert.deepEqual(stateReplay(root, SB, [], { log: () => {} }), [ref]);
    assert.equal(readState(root, SB, 'b.txt'), 'two\n');
    assert.equal(readState(root, SB, 'c.txt'), 'three\n');
    assert.equal(git(['for-each-ref', 'refs/p3/unpushed/'], { cwd: root }), '', 'its ref dropped');
  } finally { console.log = orig; stateIO.push = null; stateIO.wait = null; }
});

// ===== file: pushcheck.test.mjs =====

// A job's push refuses a commit that adds a file over max_file_bytes, a generated path, or a path
// under a dist/ directory the tranche does not track (the first product: its installer 3df99b92, 5 Nov; its installer
// worker 606/609 and agent runner 3ee34e5, 6 Nov: each pushed, then cost a fresh branch).
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { refuseUnpushable, unpushable } from '../lib/pushcheck.mjs';
import { git, loadConfig } from '../lib/util.mjs';
import { commit, makeRepo } from './helpers.mjs';

const GEN = { max_file_bytes: 64, generated: [{ paths: ['src/alpha/rows.mjs'], regenerate: ['node', '-e', '0'], verify: ['node', '-e', '0'] }] };
function repo(files = {}) {
  const root = makeRepo({ 'process/config.json': GEN, 'src/alpha/index.mjs': 'export {};\n', 'web/dist/kept.json': '{}\n', ...files });
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: root });
  git(['fetch', '-q', 'origin'], { cwd: root });
  git(['checkout', '-q', '-b', 'job/alpha', 'tranche'], { cwd: root });
  return root;
}
const refuse = (root) => () => refuseUnpushable(root, loadConfig(root), { branch: 'job/alpha' });

test('a commit adding a file over max_file_bytes is refused, naming it and how to drop it (installer 3df99b92)', () => {
  const root = repo();
  commit(root, { 'src/alpha/big.json': 'x'.repeat(100) });
  assert.throws(refuse(root), /nothing was pushed: commit \w+ adds src\/alpha\/big\.json \(100 bytes, over max_file_bytes \(64\)\)\. Drop them from the commits and rebuild before pushing: `git reset --soft HEAD~1`, `git reset -- src\/alpha\/big\.json`, then commit again; a pushed commit/);
});

test('a commit adding a generated path is refused, an older one named with its rebuild (the first product\'s installer worker, 606/609)', () => {
  const root = repo();
  commit(root, { 'src/alpha/rows.mjs': 'export const rows = [];\n' });
  commit(root, { 'src/alpha/index.mjs': 'export const y = 1;\n' });
  assert.throws(refuse(root), /adds src\/alpha\/rows\.mjs \(a generated path \(config generated\).*`git reset --soft \w+~1`, `git reset -- src\/alpha\/rows\.mjs`, then commit again/);
});

test('a commit adding a file under dist/ is refused; a dist/ file the tranche tracks may change (agent-runner 3ee34e5)', () => {
  const root = repo();
  commit(root, { 'web/dist/kept.json': '{"a":1}\n' });
  assert.deepEqual(unpushable(root, loadConfig(root), { branch: 'job/alpha' }), []);
  commit(root, { 'agent-runner/dist/agent-runner.bundled.mjs': 'export {};\n' });
  assert.throws(refuse(root), /adds agent-runner\/dist\/agent-runner\.bundled\.mjs \(under a dist\/ directory: a build output, never committed\)/);
});

// Cold review of C3: one act clears every bad commit and file; a merge in the range is never flattened.
test('two bad commits: the reset goes before the oldest and unstages every bad file; a merge in the range points to a fresh branch', () => {
  const root = repo();
  commit(root, { 'src/alpha/rows.mjs': 'export const rows = [];\n' });
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

// ===== file: job.mjs (later part) =====

      if (usd === 'unmeasured') log(`job ${id}'s cost: unmeasured (session ${sid} read ${cost}, its last row ${prior}: get_session's usage has not moved since); BOB reads it at the merge: merge --job-cost-usd`);
    }
    receipt.sha = commitFiles(root, [entryFile(id), metricsFile(id)], `job complete ${id} (attempt ${attempt})`);
  } catch (e) {
    restore(root, [entryFile(id), metricsFile(id)]);
    throw e;
  }
  return finish(root, { id, slug, pr, branch, push, io, log, receipt, again: !!again });
}

// A COMPLETE job's rerun with --exempt-revert or --not-verified: the saved receipt (its commands
// and tests stand) carrying the claims of the newest receipt posted at the same commit, so a
// second amendment keeps the first's (review of PR 64), with the revert exemption set and the
// not-verified lines added (never removed: dropping one would claim a check nobody ran), and
// what it replaced. Null when nothing changes. The COMPLETE commit's row keeps the original.
export function amendReceipt(saved, { notVerified = [], exemptRevert } = {}, prior = null) {
  const at = prior?.sha === saved.sha ? prior : null;
  const was = {
    exempt: { ...(saved.exempt || {}), ...(at?.exempt || {}) },
    not_verified: [...new Set([...(saved.not_verified || []), ...(at?.not_verified || [])])],
  };
  const exempt = exemptRevert ? { ...was.exempt, revert: exemptRevert } : was.exempt;
  const not_verified = [...was.not_verified, ...notVerified.filter((x) => !was.not_verified.includes(x))];
  if (sameClaims({ exempt, not_verified }, at || saved)) return null;
  return { ...saved, exempt, not_verified, amended: { at: now(), tool: toolPin(), was: at ? { exempt: at.exempt || {}, not_verified: at.not_verified || [] } : was } };
}
const sameClaims = (a, b) => JSON.stringify([a?.exempt || {}, a?.not_verified || []]) === JSON.stringify([b?.exempt || {}, b?.not_verified || []]);

// Push, confirm the push landed (REC-5), post the receipt once, mark ready. Each step is
// skipped when it is already done, so a half-finished job complete can simply run again.
// An amended receipt is posted unless the newest one already makes the same claims.
// A new attempt on a ready pull request first makes it a draft again, so the push's gate run
// skips and the run on ready reads the new receipt, as on a first complete.
function finish(root, { id, slug, pr, branch, push, io, log, receipt, amend = null, again = false }) {
  const sha = git(['rev-parse', 'HEAD'], { cwd: root });
  if (!push) {
    const a = amend && amendReceipt(receipt, amend);
    return { ok: true, receipt: a || receipt };
  }
  if (remoteTip(root, branch) !== sha) {
    refuseUnpushable(root, loadConfig(root), { branch });
    if (again && !pr.draft) pr = { ...pr, ...io.toDraft(slug, pr), draft: true };
    const r = git(['push', '-q', 'origin', `HEAD:refs/heads/${branch}`], { cwd: root, allowFail: true });
    if (r.code !== 0) fail(`the push of ${branch} failed (${r.stderr.trim()}); run job complete again${originAhead(root, branch) ? `, after \`${P3} job sync ${id}\`: origin's ${branch} has commits this checkout lacks` : ''}`);
  }
  if (remoteTip(root, branch) !== sha) fail(`the push of ${branch} did not land; run job complete again`);
  const all = io.comments(slug, pr.number);
  let posted = latestBlock(slug, pr.number, RECEIPT, all, { from: pr.user?.login || null });
  let url = posted?.comment?.html_url;
  const amendedReceipt = amend && amendReceipt(receipt, amend, posted?.data);
  const amended = !!amendedReceipt;
  if (amended) receipt = amendedReceipt;
  if (posted?.data?.sha !== sha || amended) {
    // A new attempt pushed while the pull request was ready (a run stopped after its push, or a
    // push by hand) and never given its receipt: a draft first, so the ready below starts the
    // gate run that reads this receipt; the push's own run had none to read.
    if (again && !pr.draft && posted?.data?.sha !== sha) pr = { ...pr, ...io.toDraft(slug, pr), draft: true };
    const what = amended ? 'Amended receipt' : 'Receipt';
    const c = io.addComment(slug, pr.number, block(RECEIPT, receipt, `${what} for job \`${id}\`, attempt ${receipt.attempt}, at \`${sha.slice(0, 10)}\`.`));
    url = c.html_url;
    posted = { comment: { ...c, created_at: c.created_at || now() }, data: receipt };
  }
  // The ready below starts the gate run that reads the receipt. An amended receipt changes no
  // claim the gate reads, so a pull request already ready is not gated again.
  if (pr.draft) io.markReady(slug, pr.number);
  log(`receipt: ${url}`);
  // The job's report: its pull request is ready for BOB's merge once the gate passes.
  // Its session named, for BOB's merge to read the job's cost from (merge --job-cost-usd).
  const sid = readRows(root, id).filter((r) => r.event === 'complete').pop()?.session;
  log(wakeLine(`job ${id} complete, PR #${pr.number} ready${sid ? `, session ${sid}` : ''}`, jobSender(id)));
  return { ok: true, receipt: receipt || posted?.data };
}

// The legitimate blocked exit (ENF-7): BLOCKED with a reason, committed and pushed. Commits only
// the entry, and can run again to finish a push that failed.
export function jobBlock(root, id, { reason, owner, push = true, log = console.log } = {}) {
  if (!reason || reason === true) fail('block needs --reason "<why>"');
  if (owner !== undefined && owner !== 'bob' && owner !== 'coordinator') fail('--owner bob (a requirement question: what the product must do) or coordinator (anything else)');
  const branch = onBranch(root, id);
  const e = readEntry(root, id);
  if (e.status.state === 'COMPLETE') fail(`${id} is COMPLETE; it cannot be blocked`);
  if (!(e.status.state === 'BLOCKED' && e.status.reason === reason && e.status.owner === owner)) {
    writeStatus(root, id, { state: 'BLOCKED', reason, at: now(), ...(owner ? { owner } : {}) });
    try { commitFiles(root, [entryFile(id)], `block ${id}: ${reason}`); } catch (err) { restore(root, [entryFile(id)]); throw err; }
  }
  if (push) {
    refuseUnpushable(root, loadConfig(root), { branch });
    const r = git(['push', '-q', 'origin', `HEAD:refs/heads/${branch}`], { cwd: root, allowFail: true });
    // BOB's merge pushed to job/<id> (defect sweep 4 Nov, #5): name the step that brings it in.
    if (r.code !== 0) fail(`the push of ${branch} failed (${r.stderr.trim()}); ${originAhead(root, branch) ? `origin's ${branch} has commits this checkout lacks: run \`${P3} job sync ${id}\`, then block again` : 'run block again'}`);
    if (remoteTip(root, branch) !== git(['rev-parse', 'HEAD'], { cwd: root })) fail('the push did not land; run block again');
  }
  log(`${id} is BLOCKED: ${reason}`);
  // The job's report: BLOCKED is BOB's to act on (its restart, a deferral, or Bob).
  if (push) log(wakeLine(`job ${id} BLOCKED`, jobSender(id)));
  return { ok: true };
}

// The module's stale lock files, installed as the gate installs them: the session hook installs
// only some of them, and the job's suite must not depend on it (GAT-5).
function installModule(root, cfg, entry, { exec, log }) {
  const inst = install(root, moduleLocks(cfg.lockfiles, entry), { onlyStale: true, ...(exec ? { exec } : {}) });
  for (const l of inst.ran) log(`installed ${l}`);
  for (const f of inst.findings) log(`${f.check}: ${f.file}: ${f.message}`);
  return inst;
}

const installed0 = (inst) => !inst.findings.length;
// The `generated` rows' untracked paths, built before the suite as the gate does:
// { commands, findings, ran }. A build runs other members' builds (the copy's bundles.mjs runs
// npm run build in each stale member), so every stale lock file is installed first, as the gate
// installs them all (defect sweep 4 Nov, #10); only when a row is to be built.
function buildModuleGenerated(root, cfg, { timeout, exec, log }) {
  const gen = generatedRows(cfg);
  const none = { commands: [], findings: [], ran: new Set() };
  if (!gen.rows.some((r) => committedPaths(root, 'HEAD', r).length < r.paths.length)) return none;
  const inst = install(root, cfg.lockfiles || [], { onlyStale: true, ...(exec ? { exec } : {}) });
  for (const l of inst.ran) log(`installed ${l}`);
  const commands = [];
  for (const l of inst.ran) commands.push({ cmd: `npm ci (${l})`, exit: inst.findings.some((f) => f.file === l) ? 1 : 0 });
  for (const f of inst.findings.filter((x) => !inst.ran.includes(x.file))) commands.push({ cmd: `npm ci (${f.file})`, exit: 1, error: f.message });
  for (const f of inst.findings) log(`${f.check}: ${f.file}: ${f.message}`);
  if (inst.findings.length) return { ...none, commands, findings: inst.findings };
  const b = buildGenerated(root, gen.rows, { timeout, log, ...(exec ? { exec } : {}) });
  if (b.built.length || b.findings.length) commands.push({ cmd: `build generated (${[...b.built, ...b.findings.map((f) => f.file)].join(', ')})`, exit: b.findings.length ? 1 : 0 });
  for (const f of b.findings) log(`${f.check}: ${f.file}: ${f.message}`);
  return { commands, findings: b.findings, ran: b.ran };
}

// A row's regenerate can rewrite its committed paths too (the copy's bundles.mjs rebuilds every
// stale bundle, the committed ones included): after the suite they go back to the commit, so the
// tree stays clean for job complete and send (defect sweep 4 Nov, #7). A job never commits them.
function restoreGenerated(root, ran, log) {
  const paths = [...new Set([...ran].flatMap((r) => committedPaths(root, 'HEAD', r)))];
  if (!paths.length) return;
  const changed = git(['status', '--porcelain', '--untracked-files=no', '--', ...paths], { cwd: root, allowFail: true }).stdout.trim();
  if (!changed) return;
  git(['checkout', 'HEAD', '--', ...paths], { cwd: root });
  log(`restored the committed generated paths the build rewrote: ${paths.join(', ')}`);
}

// The module's own suite, for the job while it works (JOB-2: the START names only tool commands).
export function jobTest(root, id, { log = console.log, exec, toolRoot, session = null, record = (r) => recordTest(root, r, { log }) } = {}) {
  // origin's layer branch, as the session's clone has it (no local layer/<n>): cold review 5.
  const cfg = jobCfg(root, loadConfig(root), id);
  pinCheck(root, id, { toolRoot, tranche: trancheRef(root, cfg), what: `\`${P3} test ${id}\`` });
  const entry = readEntry(root, id);
  const started = now();
  // The time budget (R9, Bob, 6 Nov: how much time goes to tests against real work): every run
  // is a state row, its module, session, minutes and result, whatever the result.
  const row = (result, extra = {}) => {
    const ended = now();
    const sid = sessionForm(typeof session === 'string' && session ? session : process.env.CLAUDE_CODE_REMOTE_SESSION_ID || process.env.CLAUDE_CODE_SESSION_ID || null);
    record({ row: 'test', module: id, session: sid || null, started, ended, at: ended, minutes: Math.round(((Date.parse(ended) - Date.parse(started)) / MINUTE) * 100) / 100, result, ...(cfg.layer ? { layer: cfg.layer.n } : {}), ...extra, state_branch: cfg.state_branch });
  };
  const inst = installModule(root, cfg, entry, { exec, log });
  if (inst.findings.length) { row('install failed'); return { ok: false, install: inst }; }
  const timeout = (cfg.suite_timeout_minutes || 20) * MINUTE;
  const built = buildModuleGenerated(root, cfg, { timeout, exec, log });
  // A build that fails part way may have rewritten committed paths: put back, as after the suite.
  if (built.findings.length) { restoreGenerated(root, built.ran, log); row('build failed'); return { ok: false, install: inst, generated: built }; }
  let s;
  try { s = runSuite(root, entry, undefined, { timeout }); } finally { restoreGenerated(root, built.ran, log); }
  log(s.output.split('\n').slice(-60).join('\n'));
  log(`${s.cmd}\nexit ${s.exit}; tests ${JSON.stringify(s.tests)}; ${s.seconds} s`);
  row(s.exit === 0 ? 'pass' : 'fail', { suite_seconds: s.seconds, tests: s.tests });
  return { ok: s.exit === 0, install: inst, ...s };
}

// A `p3 test` run's row on the state branch, one file per run, never edited: under its layer's
// flow (layerflow/<n>/test/) when the module is in an open layer, else tests/<module>/. A row
// that cannot be written is said, never a refusal: the run itself stands.
export function recordTest(root, r, { log = console.log } = {}) {
  const { state_branch: sb, ...row } = r;
  const name = `${safeName(row.module)}-${Date.parse(row.started)}-${randomUUID().slice(0, 8)}`;
  const path = row.layer !== undefined ? flowFile(row.layer, 'test', name) : `tests/${safeName(row.module)}/${name}.json`;
  try {
    writeState(root, sb, `test ${row.module}: ${row.result}, ${row.minutes} min`, (w) => { mkdirSync(dirname(join(w, path)), { recursive: true }); writeFileSync(join(w, path), JSON.stringify(row, null, 2) + '\n'); return {}; });
    return path;
  } catch (e) { log(`the test row was not recorded (${String(e.message).split('\n')[0].slice(0, 160)})`); return null; }
}

// revert exempt <pr> --why "<why>" --reviewer <session> (AUD-1, JOB-12): a reviewer's exemption from
// the gate's revert check, for a refactor whose tests rightly pass before and after the change.
// Posted on the job's pull request as a p3:revert-exempt block naming the head it reviewed; the
// gate takes it only from a reviewer that is not the job's own session, and only while the job's
// own files (its module's paths and tests, records aside) are as that commit had them
// (gate.mjs revertExemption). A body edit then gives the
// gate a new event (pull_request: edited), as a comment gives none.
export const EXEMPT_MARK = 'p3:revert-exempt-regate';
export function revertExempt(root, n, { why, reviewer, io: given = {}, log = console.log } = {}) {
  const io = { getPR, addComment, editPR, ...given };
  if (typeof why !== 'string' || !why.trim()) fail('revert exempt needs --why "<why its tests rightly pass before and after>"');
  const by = sessionForm(typeof reviewer === 'string' ? reviewer.trim() : '');
  if (!by) fail('revert exempt needs --reviewer <your session id>: the exemption is a reviewer\'s, never the job\'s own');
  const slug = io.slug || repoSlug(root);
  const pr = io.getPR(slug, Number(n));
  if (!pr || pr.state !== 'open') fail(`pull request ${n} is not open`);
  const id = branchModule(pr.head?.ref, ledgerIds(root, 'HEAD'));
  if (!id) fail(`pull request ${n} is from ${pr.head?.ref}, not a job branch`);
  const sha = pr.head.sha;
  // The job's own session, from its newest complete row at the head, when this clone can read it;
  // the gate checks it again either way.
  let rows = [];
  try { git(['fetch', '-q', 'origin', sha], { cwd: root, allowFail: true }); rows = rowsAt(root, sha, id); } catch { rows = []; }
  const own = rows.filter((r) => r.row === 'attempt' && r.event === 'complete').pop()?.session || null;
  if (own && sessionForm(own) === by) fail(`${by} is ${id}'s own job session: a job never exempts itself; a reviewer records the exemption`);
  const data = { kind: 'revert-exempt', module: id, pr: pr.number, sha, reviewer: by, why: why.trim(), at: now(), tool: toolPin() };
  const c = io.addComment(slug, pr.number, block(REVERT_EXEMPT, data, `Revert check exemption for job \`${id}\` at \`${sha.slice(0, 10)}\`, reviewed by ${by}.`));
  const key = String(c?.id ?? c?.html_url ?? data.at);
  const line = `<!-- ${EXEMPT_MARK} ${key} --> Gate re-run for the revert exemption${c?.html_url ? ` ${c.html_url}` : ''}.`;
  const mark = new RegExp(`^<!-- ${EXEMPT_MARK} \\S+ -->.*$`, 'm');
  const body = String(pr.body ?? '');
  try { io.editPR(slug, pr.number, { body: mark.test(body) ? body.replace(mark, () => line) : `${body}${body ? '\n\n' : ''}${line}` }); } catch (e) {
    fail(`the exemption is posted, but the body edit that re-runs the gate failed (${e.message}); edit the pull request to re-run it`);
  }
  log(`revert exemption for ${id} at ${sha.slice(0, 10)} posted${c?.html_url ? `: ${c.html_url}` : ''}; the gate runs again on the pull request`);
  return { ok: true, data };
}

// ===== file: sweep.test.mjs =====

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { commit, entry, makeRepo, openPassed } from './helpers.mjs';
import { handoverConfirm, promptRefresh, readAddress, recordStart, rootPrompt, startRole } from '../lib/roles.mjs';
import { readState, writeState } from '../lib/state.mjs';
import { HEARTBEAT_FILE, SWEEP_ROWS_FILE, sweep, sweepTask, watch } from '../lib/sweep.mjs';
import { git } from '../lib/util.mjs';
import { status } from '../lib/status.mjs';

const quiet = () => {};
const R = 'session_root1';
const B = 'session_bob1';
const W = 'session_watch1';
const OLD = '2026-01-01T00:00:00Z';

function withOrigin(files = {}, env = {}) {
  const old = { ...process.env };
  Object.assign(process.env, env);
  try {
    const root = makeRepo({ 'README.md': 'x', 'process/config.json': { tranche: 'tranche' }, ...files });
    git(['branch', 'tranche'], { cwd: root });
    const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
    git(['init', '-q', '--bare', bare], { cwd: root });
    git(['remote', 'add', 'origin', bare], { cwd: root });
    git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: root });
    git(['checkout', '-q', 'tranche'], { cwd: root });
    git(['fetch', '-q', 'origin'], { cwd: root });
    return root;
  } finally { process.env = old; }
}
const run = (root, o = {}) => { const out = []; const r = sweep(root, { session: R, offline: true, log: (l) => out.push(l), ...o }); return { ...r, out: out.join('\n') }; };
const beat = (root) => JSON.parse(readState(root, 'process-state', HEARTBEAT_FILE));
const setBeat = (root, at) => writeState(root, 'process-state', 'hb', (d) => writeFileSync(join(d, HEARTBEAT_FILE), JSON.stringify({ at, session: R }) + '\n'));

test('sweep step 0: another ROOT is addressed, so it ends and writes nothing', () => {
  const root = withOrigin();
  recordStart(root, 'root', 'session_other', { log: quiet });
  const r = run(root);
  assert.equal(r.act, 'end');
  assert.match(r.out, /step 0.*session_other.*end the turn/);
  assert.equal(readState(root, 'process-state', HEARTBEAT_FILE), null);
  assert.throws(() => sweep(root, { session: 'x', offline: true, log: quiet }), /--session/);
});

test('sweep: nothing owed writes the heartbeat; over the live cap wakes BOB with one send', () => {
  const root = withOrigin();
  recordStart(root, 'root', R, { log: quiet });
  recordStart(root, 'bob', B, { log: quiet });
  const r = run(root, { live: 3 });
  assert.equal(r.act, 'heartbeat');
  assert.deepEqual(beat(root).found, ['job cap 20 (default): 3 job sessions live']);
  // The live count and cap go in the sweep row: lead times names a full cap as a wait's cause.
  const row = readState(root, 'process-state', SWEEP_ROWS_FILE).trim().split('\n').map((l) => JSON.parse(l)).at(-1);
  assert.deepEqual([row.live, row.job_cap], [3, 20]);
  assert.deepEqual(beat(root).done, ['heartbeat only']);
  const o = run(root, { live: 21 });
  assert.equal(o.todo.length, 1);
  assert.match(o.todo[0], /send bob "Sweep: 21 job sessions, over the job cap of 20.*--from root/);
  assert.throws(() => run(root, { live: 'many' }), /--live/);
});

test('sweep step 1: a paused plan is heartbeat only', () => {
  const root = withOrigin({ 'process/config.json': { tranche: 'tranche', plan: 'pause' } });
  recordStart(root, 'root', R, { log: quiet });
  const r = run(root, { live: 30 });
  assert.deepEqual([r.act, r.found], ['heartbeat', ['job cap 20 (default): 30 job sessions live', 'plan pause', '30 job sessions, over the job cap of 20: archive finished ones before starting more']]);
  assert.throws(() => run(root, { live: true }), /--live/);
});

const wakeAt = (root, at) => writeState(root, 'process-state', 'wake', (d) => { mkdirSync(join(d, 'messages'), { recursive: true }); writeFileSync(join(d, 'messages/root.jsonl'), JSON.stringify({ at, row: 'sent', n: 1, to: 'bob', text: 'Sweep: x.' }) + '\n'); });

test('sweep step 2: no BOB; a silent BOB is woken, then handed over two hours after the wake; REFRESH', () => {
  const root = withOrigin({}, { GIT_COMMITTER_DATE: OLD, GIT_AUTHOR_DATE: OLD });
  recordStart(root, 'root', R, { log: quiet });
  assert.match(run(root).todo[0], /start bob/);
  writeState(root, 'process-state', 'old bob', (d) => writeFileSync(join(d, 'addresses/bob.json'), JSON.stringify({ session: B, at: OLD })));
  const s = run(root);
  assert.match(s.found.join(), /BOB session_bob1 silent/);
  assert.equal(s.todo.length, 1);
  assert.match(s.todo[0], /wake BOB with one message: .*send bob "Sweep: BOB session_bob1 silent/);
  // A wake within two hours is outstanding: nothing more for BOB.
  wakeAt(root, new Date(Date.now() - 36e5).toISOString());
  assert.equal(run(root).act, 'heartbeat');
  // Woken over two hours ago and nothing written since: the handover.
  wakeAt(root, new Date(Date.now() - 3 * 36e5).toISOString());
  const h = run(root);
  assert.match(h.found.join(), /BOB session_bob1 silent .*h, 3h after a wake/);
  assert.match(h.todo[0], /handover begin/);
  // Fresh tranche, but ten refusals for BOB: REFRESH.
  const rows = Array.from({ length: 10 }, (_, i) => JSON.stringify({ row: 'refusal', id: `r${i}`, session: B, act: 'a', depth: 1 })).join('\n') + '\n';
  commit(root, { 'process/metrics/refusals.bob.jsonl': rows });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  git(['fetch', '-q', 'origin', 'tranche'], { cwd: root });
  assert.match(run(root).found.join(), /flagged REFRESH/);
});

test('sweep step 2: an idle BOB with next work and no job open is woken, not handed over', () => {
  const root = withOrigin({ 'build/requirements/m.md': '- **R1** *(not yet met: x)* y\n' });
  recordStart(root, 'root', R, { log: quiet });
  recordStart(root, 'bob', B, { log: quiet });
  const s = run(root);
  assert.equal(s.todo.length, 1);
  assert.match(s.todo[0], /send bob "Sweep: BOB session_bob1 idle 0h with next work: run node \.process\/tool\/p3\.mjs status --role bob \(the layer flow's next act\)\."/);
  assert.match(beat(root).found.join(), /BOB session_bob1 idle 0h with next work/);
  commit(root, { 'process/ledger/m.json': entry('m', { requirements: 'build/requirements/m.md' }) });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  git(['fetch', '-q', 'origin', 'tranche'], { cwd: root });
  assert.equal(run(root).act, 'heartbeat', 'a job is open and BOB wrote within the hour');
});

test('sweep step 3: a blocked job and an attempt far over its role\'s median', () => {
  const root = withOrigin({
    'process/ledger/m1.json': entry('m1', { status: { state: 'BLOCKED', reason: 'x' } }),
    'process/metrics/m1.bob.jsonl': ['2', '3', '2'].map((c) => JSON.stringify({ row: 'attempt', event: 'measured', role: 'job', cost_usd: Number(c), minutes: 30 })).join('\n') + '\n',
  });
  recordStart(root, 'root', R, { log: quiet });
  recordStart(root, 'bob', B, { log: quiet });
  const r = run(root, { attempts: ['m2:job:200:7', 'm3:job:40:3'] });
  assert.match(r.found.join('|'), /m1: BLOCKED; blocked since unknown\|m2: 200 min, over 3x the job median 30\|m2: 7 USD, over 3x the job median 2$/);
  assert.equal(r.todo.length, 1);
  assert.throws(() => run(root, { attempts: ['nope'] }), /--attempt/);
});

test('watch: end while the heartbeat is fresh; take over when it is old, absent, or ROOT is full', () => {
  const root = withOrigin();
  const w = (o = {}) => { const out = []; return { ...watch(root, { session: W, offline: true, log: (l) => out.push(l), ...o }), out: out.join('\n') }; };
  assert.match(w().out, /no ROOT is addressed/);
  recordStart(root, 'root', R, { log: quiet });
  const none = w();
  assert.equal(none.act, 'take over');
  assert.match(none.out, new RegExp(`start record root ${W}[\\s\\S]*sweep task --session ${W}[\\s\\S]*push notification`));
  setBeat(root, new Date().toISOString());
  assert.equal(w().act, 'end');
  assert.equal(w({ full: true }).act, 'take over');
  setBeat(root, new Date(Date.now() - 5 * 36e5).toISOString());
  assert.match(w().why, /heartbeat is 5h old/);
  recordStart(root, 'root', W, { log: quiet });
  assert.match(w().out, /you are ROOT/);
});

// The escalation chain (Bob, 4 Nov): a message to ROOT unanswered for targets.decision_minutes
// makes the watcher take over at once, even while ROOT's heartbeat is fresh; not before.
test('watch --escalated: takes over once the message is decision_minutes old, fresh heartbeat or not; ends before', () => {
  const root = withOrigin();
  const w = (o = {}) => { const out = []; return { ...watch(root, { session: W, offline: true, log: (l) => out.push(l), ...o }), out: out.join('\n') }; };
  assert.match(w({ escalated: '45' }).out, /no ROOT is addressed.*tell Bob by push notification, with the escalation/);
  recordStart(root, 'root', R, { log: quiet });
  setBeat(root, new Date().toISOString());
  assert.equal(w().act, 'end');
  const early = w({ escalated: '29' });
  assert.equal(early.act, 'end');
  assert.match(early.out, /29 of 30 minutes old; ROOT keeps it/);
  const due = w({ escalated: '30' });
  assert.equal(due.act, 'take over');
  assert.match(due.why, new RegExp(`ROOT ${R} left a message unanswered 30 min, past 30`));
  assert.match(due.out, new RegExp(`start record root ${W}`));
  setBeat(root, new Date(Date.now() - 5 * 36e5).toISOString());
  assert.match(w({ escalated: '10' }).why, /heartbeat is 5h old/, 'an early escalation never holds back a due takeover');
  assert.equal(w({ escalated: '10', full: true }).act, 'take over');
  setBeat(root, new Date().toISOString());
  assert.throws(() => w({ escalated: true }), /--escalated takes the minutes/);
  assert.throws(() => w({ escalated: 'soon' }), /--escalated takes the minutes/);
  commit(root, { 'process/config.json': { tranche: 'tranche', targets: { decision_minutes: 10 } } }, 'ten minutes');
  assert.equal(w({ escalated: '12' }).act, 'take over');
  commit(root, { 'process/config.json': { tranche: 'tranche', targets: { decision_minutes: 0 } } }, 'none');
  assert.throws(() => w({ escalated: '12' }), /decision_minutes 0 .* not a positive number/);
  assert.equal(w().act, 'end', 'a bad decision_minutes never blocks the daily watch');
});

test('start watcher, start record watcher, sweep task, and ROOT\'s prompt', () => {
  const root = withOrigin();
  const s = startRole(root, 'watcher', { slug: 'o/p', address: {}, log: quiet });
  for (const x of ['Priorities first', 'watch --session', 'start record root', 'sweep task', 'push notification']) assert.ok(s.prompt.includes(x), x);
  assert.doesNotMatch(s.prompt, /—/);
  assert.match(s.call.source_revision, /^[0-9a-f]{40}$/);
  assert.equal(s.call.source_revision, git(['rev-parse', 'origin/tranche'], { cwd: root }));
  assert.match(s.task.cron_expression, /^\d+ \d+ \* \* \*$/);
  recordStart(root, 'watcher', W, { log: quiet });
  assert.equal(readAddress(root).watcher.session, W);
  assert.throws(() => startRole(root, 'watcher', { slug: 'o/p', log: quiet }), /one per account/);
  assert.throws(() => startRole(root, 'watcher', { slug: 'o/p', replace: 'session_other', log: quiet }), /--replace names the addressed watcher, session_watch1/);
  const out = [];
  startRole(root, 'watcher', { slug: 'o/p', replace: W, log: (l) => out.push(l) });
  assert.match(out.at(-1), new RegExp(`delete the old watcher ${W}'s daily task.*after the new one's is created`));
  recordStart(root, 'watcher', 'session_watch2', { log: quiet });
  assert.equal(readAddress(root).watcher.session, 'session_watch2');
  // A watcher that took over as ROOT is still the addressed watcher: replaced only by --replace.
  assert.throws(() => startRole(root, 'watcher', { slug: 'o/p', address: { root: { session: 'session_watch2' }, watcher: { session: 'session_watch2', at: 'x' } }, log: quiet }), /one per account/);
  const t = sweepTask(R, 'tranche', 'b'.repeat(64));
  assert.ok(t.prompt.includes('`git fetch origin tranche`') && sweepTask(R, 'tr2', 'b'.repeat(64)).prompt.includes('`git fetch origin tr2`'));
  assert.throws(() => sweepTask(R), /needs the hash/);
  assert.match(t.prompt, /start check --wake --approvals b{64}`; if it says the approvals changed, tell Bob by push notification and take no further step/);
  assert.match(t.prompt, new RegExp(`sweep --session ${R} --sessions`));
  assert.equal(t.call.cron_expression, '0 * * * *');
  const p = rootPrompt({ slug: 'o/p', approvals: 'b'.repeat(64) });
  for (const x of ['sweep task --session', 'start watcher', 'start record watcher', 'persistent_session_id', 'sweep --session']) assert.ok(p.includes(x), x);
  // ROOT's one task edit (4 Nov: a pin changed what sweep task prints, and only the owning
  // session may edit its task): its own sweep task's prompt, to what sweep task prints, nothing else.
  assert.ok(p.includes('your hourly sweep task is the prompt `node .process/tool/p3.mjs sweep task --session <your id>` prints: if list_triggers shows none bound to you, create it (create_trigger, no persistent_session_id); if its prompt differs, update_trigger only its prompt, to that; never fire it'));
  assert.ok(p.includes("edit no task but your sweep task's prompt") && !p.includes('edit no task,'));
  assert.ok(t.prompt.includes("edit no task but this one's prompt as your ROOT prompt allows"));
  assert.ok(Buffer.byteLength(p) <= 4096, `${Buffer.byteLength(p)} bytes`);
});

test('sweep step 3: a WORKING job that pushed and then stopped past SILENT_HOURS wakes BOB; one that pushed lately does not', () => {
  const root = withOrigin({
    'process/ledger/stale.json': entry('stale', { status: { state: 'WORKING' } }),
    'process/ledger/fresh.json': entry('fresh', { status: { state: 'WORKING' } }),
  });
  recordStart(root, 'root', R, { log: quiet });
  recordStart(root, 'bob', B, { log: quiet });
  for (const [id, at] of [['stale', new Date(Date.now() - 3 * 36e5).toISOString()], ['fresh', new Date().toISOString()]]) {
    git(['checkout', '-q', '-b', `job/${id}`, 'origin/tranche'], { cwd: root });
    commit(root, { [`src/${id}/a.js`]: '1' }, 'start');
    process.env.GIT_COMMITTER_DATE = at;
    try { commit(root, { [`src/${id}/a.js`]: '2' }, 'work in progress'); } finally { delete process.env.GIT_COMMITTER_DATE; }
    git(['push', '-q', 'origin', `job/${id}`], { cwd: root });
    git(['checkout', '-q', 'tranche'], { cwd: root });
  }
  git(['fetch', '-q', 'origin'], { cwd: root });
  const r = run(root);
  assert.ok(r.found.includes('stale: WORKING, no push for 3h'), r.found.join('|'));
  assert.ok(!r.found.some((f) => f.startsWith('fresh')), r.found.join('|'));
  assert.equal(r.todo.length, 1);
  assert.match(r.todo[0], /stale: WORKING, no push for 3h/);
});

test('sweep row: BOB\'s idle time is recorded when status lists acts for it, and not otherwise', () => {
  const root = withOrigin({ 'process/ledger/m1.json': entry('m1', { status: { state: 'BLOCKED', reason: 'x' } }) });
  recordStart(root, 'root', R, { log: quiet });
  run(root);
  recordStart(root, 'bob', B, { log: quiet });
  run(root);
  const rows = readState(root, 'process-state', SWEEP_ROWS_FILE).trim().split('\n').map((l) => JSON.parse(l));
  assert.deepEqual(rows.map((r) => [r.row, r.session, r.bob_acts]), [['sweep', R, 'unmeasured'], ['sweep', R, true]]);
  assert.equal(typeof rows[1].bob_quiet_h, 'number');
  const quietRoot = withOrigin();
  recordStart(quietRoot, 'root', R, { log: quiet });
  recordStart(quietRoot, 'bob', B, { log: quiet });
  run(quietRoot);
  const q = JSON.parse(readState(quietRoot, 'process-state', SWEEP_ROWS_FILE));
  assert.deepEqual([q.bob_acts, q.bob_quiet_h], [false, null]);
});

// Review of PR 68: a triage owed is an act for BOB, so the sweep counts it.
test('sweep row: an untriaged provider notice alone is an act for BOB', () => {
  const root = withOrigin();
  recordStart(root, 'root', R, { log: quiet });
  recordStart(root, 'bob', B, { log: quiet });
  writeState(root, 'process-state', 'notice', (wt) => {
    mkdirSync(join(wt, 'notices'), { recursive: true });
    writeFileSync(join(wt, 'notices/p-7.json'), JSON.stringify({ row: 'notice', key: 'p:7', provider: 'p', ids: ['R1'], pr: 7, users: ['u1'] }) + '\n');
    return {};
  });
  run(root);
  assert.equal(JSON.parse(readState(root, 'process-state', SWEEP_ROWS_FILE)).bob_acts, true);
});


// Note for jobs, in force until withdrawn: any script the job writes prints this exact line as the
// very last line of its output: `run closed A2C-4597`.

// Coordinator, 4 Nov (from PR 69's report): a layer ready to close lists no next work, so the
// sweep, the backstop, missed it; and a bad open_by made nextWork throw inside the sweep.
test('sweep: a layer the train called ready to close says nothing offline; a bad open_by is a finding and the heartbeat is still written', () => {
  const layers = '| layer | what | modules |\n|---|---|---|\n| 1 | first | a |\n| 2 | next | d |\n';
  const root = withOrigin({
    'build/layers.md': layers,
    'build/requirements/a.md': '- **R1** *(not yet met: x)* y\n',
    'build/requirements/d.md': '- **R1** *(not yet met: x)* y\n',
    'process/ledger/a.json': entry('a', { requirements: 'build/requirements/a.md', status: { state: 'COMPLETE' } }),
  });
  recordStart(root, 'root', R, { log: quiet });
  recordStart(root, 'bob', B, { log: quiet });
  const s = run(root);
  // Offline the open layer is unread: no train-era close line, and no wake for it (layer merge is read online).
  assert.doesNotMatch(s.found.join('; '), /ready to close/);
  assert.equal(s.todo.length, 0, s.todo.join('\n'));

  const bad = withOrigin({ 'process/config.json': { tranche: 'tranche', open_by: 'bogus' }, 'build/layers.md': layers, 'build/requirements/a.md': '- **R1** *(not yet met: x)* y\n', 'build/requirements/d.md': '- **R1** *(not yet met: x)* y\n' });
  recordStart(bad, 'root', R, { log: quiet });
  recordStart(bad, 'bob', B, { log: quiet });
  const b = run(bad);
  assert.match(b.found.join('; '), /config: open_by "bogus" in process\/config\.json is not one of/);
  assert.match(beat(bad).found.join('; '), /config: open_by "bogus"/);
});

// Prompt refresh (measured 4 Nov 00:05: a ROOT ran on its starting prompt after the pin moved).
test('start check --wake prompt refresh: an old prompt hash at a new pin prints the new prompt once, then records it', () => {
  const root = withOrigin();
  const out = [];
  const pr = (o = {}) => { out.length = 0; return promptRefresh(root, { pin: 'f'.repeat(40), log: (...l) => out.push(l.join(' ')), ...o }); };
  recordStart(root, 'root', R, { log: quiet });
  assert.match(readAddress(root).root.prompt.hash, /^[0-9a-f]{64}$/, 'start record stores the prompt hash');
  assert.equal(pr({ session: R }).act, 'same');
  // An old prompt: the hash this pin's prompt no longer has.
  const sb = 'process-state';
  writeState(root, sb, 'old prompt', (d) => writeFileSync(join(d, 'addresses/root.json'), JSON.stringify({ session: R, at: OLD, prompt: { hash: '0'.repeat(64) } }) + '\n'));
  const r = pr({ session: R });
  assert.equal(r.act, 'changed');
  const text = out.join('\n');
  assert.match(text, new RegExp(`^prompt changed at ${'f'.repeat(40)}: read the new prompt below and act by it`));
  assert.ok(text.includes('# ROOT\n') && text.includes('## Acts you may take'), 'the new prompt itself');
  assert.ok(Buffer.byteLength(r.prompt) <= 4096, 'within its cap');
  assert.match(text, /fresh ROOT: send the coordinator one message asking for ROOT's handover/);
  assert.equal(readAddress(root).root.at, OLD, 'the address keeps its time');
  assert.equal(pr({ session: R }).act, 'same', 'delivered once');
  // A ROOT started before prompt records: its first wake delivers the prompt.
  writeState(root, sb, 'no record', (d) => writeFileSync(join(d, 'addresses/root.json'), JSON.stringify({ session: R, at: OLD }) + '\n'));
  const old = process.env.CLAUDE_CODE_REMOTE_SESSION_ID;
  process.env.CLAUDE_CODE_REMOTE_SESSION_ID = R.replace(/^session_/, 'cse_');
  try { assert.equal(pr().act, 'changed', 'the session found from the container'); } finally { if (old === undefined) delete process.env.CLAUDE_CODE_REMOTE_SESSION_ID; else process.env.CLAUDE_CODE_REMOTE_SESSION_ID = old; }
  // BOB by handover keeps its old BOB in the prompt it compares; a job holds no address.
  recordStart(root, 'bob', B, { log: quiet });
  handoverConfirm(root, 'session_bob2', { log: quiet });
  assert.equal(readAddress(root).bob.prompt.old_bob, B);
  assert.equal(pr({ session: 'session_bob2' }).act, 'same');
  writeState(root, sb, 'old bob prompt', (d) => writeFileSync(join(d, 'addresses/bob.json'), JSON.stringify({ session: 'session_bob2', at: OLD, prompt: { hash: '1'.repeat(64), old_bob: B } }) + '\n'));
