// ===== file: sweep.test.mjs (continued) =====

  assert.deepEqual([row.flag, row.blocked, row.stale?.pr, row.pr], [undefined, undefined, 1028, 'unknown (GitHub not read)'], 'offline: its PR is unknown, a newer one may be open');
  assert.match(row.branch, /^stale: BLOCKED on job\/m as this clone has it, older than m's land \(PR 1028 on layer 12 at /);
  // A branch with work after the land is its own attempt again: listed.
  writeState(root, 'process-state', 'land m earlier', (d) => { writeFileSync(join(d, 'layerflow/12/land/m-1028-abc.json'), JSON.stringify({ row: 'land', layer: 12, module: 'm', pr: 1028, branch: 'job/m-2', at: '2026-01-01T00:00:00Z' }) + '\n'); writeFileSync(join(d, 'layerflow/12/land/m-grammar-1029-def.json'), JSON.stringify({ row: 'land', layer: 12, module: 'm-grammar', pr: 1029, at: later }) + '\n'); });
  assert.match(run(root).found.join('|'), /m: BLOCKED/, 'a land before the branch tip, or another module\'s, is not m\'s supersession');
  // A land recorded late (its row's `at` after the branch tip) whose merge commit is older than the
  // tip: the merge's time decides (cold review of C37: a new attempt is not hidden by a late record).
  const old = git(['rev-parse', 'tranche~0'], { cwd: root });
  git(['checkout', '-q', 'job/m'], { cwd: root });
  commit(root, { 'm2.txt': 'a new attempt after the merge' });
  git(['push', '-q', 'origin', 'job/m'], { cwd: root });
  git(['fetch', '-q', 'origin', '+refs/heads/job/m:refs/remotes/origin/job/m'], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  writeState(root, 'process-state', 'land m late', (d) => { writeFileSync(join(d, 'layerflow/12/land/m-1028-abc.json'), JSON.stringify({ row: 'land', layer: 12, module: 'm', pr: 1028, merge: old, at: later }) + '\n'); });
  assert.match(run(root).found.join('|'), /m: BLOCKED/, 'the merge commit is older than the branch tip');
});

// C37, the root (coordinator, 8 Nov): read the newest attempt's branch. inquiry's attempt 6 ran on
// job/inquiry-2 and completed after attempt 5's block on job/inquiry; a clone that never fetched
// job/inquiry-2 (no job ref is fetched for a module COMPLETE on the tranche with no open PR) read
// job/inquiry's block. A job/<id>-<n> on origin is the newest attempt's, fetched or not.
test('status: a module\'s -2 branch that completed after the first branch\'s block is read, fetched or not (C37)', () => {
  const root = withOrigin({ 'process/ledger/m.json': entry('m', { status: { state: 'COMPLETE' } }) });
  git(['checkout', '-q', '-b', 'job/m'], { cwd: root });
  commit(root, { 'process/ledger/m.json': entry('m', { status: { state: 'BLOCKED', reason: 'R31 waits on an element' } }), 'process/metrics/m.jsonl': JSON.stringify({ row: 'attempt', event: 'start', module: 'm', attempt: 5, branch: 'job/m' }) + '\n' });
  git(['push', '-q', 'origin', 'job/m'], { cwd: root });
  git(['fetch', '-q', 'origin', '+refs/heads/job/m:refs/remotes/origin/job/m'], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  // Attempt 6, from another clone, on job/m-2: its start row names it, and it completes.
  const other = mkdtempSync(join(tmpdir(), 'p3-c37-'));
  git(['clone', '-q', git(['remote', 'get-url', 'origin'], { cwd: root }), other]);
  git(['config', 'user.email', 't@example.com'], { cwd: other });
  git(['config', 'user.name', 't'], { cwd: other });
  git(['checkout', '-q', '-b', 'job/m-2', 'origin/tranche'], { cwd: other });
  commit(other, { 'process/metrics/m.jsonl': JSON.stringify({ row: 'attempt', event: 'start', module: 'm', attempt: 6, branch: 'job/m-2' }) + '\n', 'process/ledger/m.json': entry('m', { status: { state: 'COMPLETE' } }), 'm.txt': 'attempt 6' });
  git(['push', '-q', 'origin', 'job/m-2'], { cwd: other });
  const io = { openPRs: () => [], checkRun: () => null, compare: () => null };
  const row = status(root, { log: quiet, io }).rows.find((x) => x.id === 'm');
  assert.equal(row.ref, 'job/m-2', 'the newest attempt\'s branch');
  assert.notEqual(row.flag, 'BLOCKED');
  assert.equal(row.blocked, undefined);
});

// Coordinator, 5 Nov: starvation and ruling waits measured in the sweep row, and a technical ruling
// owed past targets.decision_minutes reaches the coordinator from ROOT.
test('sweep: the row records startable and blocked work; a ruling owed past decision_minutes goes to the coordinator', () => {
  const at = new Date(Date.now() - 45 * 6e4).toISOString();
  const root = withOrigin({
    'process/config.json': { tranche: 'tranche', coordinator: 'session_coord' },
    'process/ledger/m1.json': entry('m1', { status: { state: 'BLOCKED', reason: 'the fixture server will not start', at } }),
  });
  recordStart(root, 'root', R, { log: quiet });
  recordStart(root, 'bob', B, { log: quiet });
  const r = run(root, { live: 2 });
  const row = readState(root, 'process-state', SWEEP_ROWS_FILE).trim().split('\n').map((l) => JSON.parse(l)).at(-1);
  assert.equal(row.blocked, 1);
  assert.ok(row.blocked_oldest_min >= 45 && row.blocked_oldest_min < 50);
  assert.equal(typeof row.startable, 'number');
  assert.ok(r.todo.some((x) => /^ruling owed: send_message to the coordinator \(session_coord\): job m1; blocked 4\d min; ruling owed by the coordinator \(session_coord\): the fixture server will not start$/.test(x)));
  assert.match(r.found.join('|'), /m1: BLOCKED; blocked 4\d min; ruling owed by the coordinator/);
  // A bad targets.decision_minutes is a finding; the sweep still writes its heartbeat.
  const bad = withOrigin({ 'process/config.json': { tranche: 'tranche', targets: { decision_minutes: 0 } }, 'process/ledger/m1.json': entry('m1', { status: { state: 'BLOCKED', reason: 'x', at } }) });
  recordStart(bad, 'root', R, { log: quiet });
  recordStart(bad, 'bob', B, { log: quiet });
  assert.match(run(bad).found.join('|'), /config: targets\.decision_minutes/);
  assert.ok(readState(bad, 'process-state', HEARTBEAT_FILE));
});

// Coordinator, 5 Nov: op-declarations, BLOCKED and held to 11:27 on the coordinator's ruling, was
// relayed as a ruling owed at every sweep. A live hold on its module is the ruling's record.
test('sweep and status: a BLOCKED job under a live module hold is shown held, with the hold\'s reason and expiry, and owes no ruling', async () => {
  const { hold } = await import('../lib/hold.mjs');
  const { blockedJobs } = await import('../lib/status.mjs');
  const at = new Date(Date.now() - 60 * 6e4).toISOString();
  const root = withOrigin({ 'process/ledger/m1.json': entry('m1', { status: { state: 'BLOCKED', reason: 'the worker binding is missing', at } }) });
  recordStart(root, 'root', R, { log: quiet });
  recordStart(root, 'bob', B, { log: quiet });
  const owedFirst = run(root);
  assert.ok(owedFirst.todo.some((x) => /^ruling owed: send_message to the coordinator: job m1; blocked 60 min/.test(x)), owedFirst.todo.join('\n'));
  const h = hold(root, 'module:m1', { why: 'the coordinator ruled: wait for the binding PR', by: 'session_coord1', until: '90m', log: quiet });
  const r = run(root);
  assert.ok(!r.todo.some((x) => /ruling owed/.test(x)), r.todo.join('\n'));
  assert.ok(r.found.some((x) => x === `m1: BLOCKED; blocked 60 min; held (${h.id} module:m1, by session_coord1) to ${h.until}: the coordinator ruled: wait for the binding PR`), r.found.join('\n'));
  // Status's blocked group shows it held; an expired or ended hold holds nothing.
  const out = [];
  status(root, { role: 'bob', offline: true, log: (m) => out.push(m) });
  assert.match(out.join('\n'), new RegExp(`blocked:\\n- m1: [^\\n]*; blocked 60 min; held \\(${h.id} module:m1`));
  const rows = [{ id: 'm1', tranche: 'BLOCKED', blocked: 'x', pr: '#9 draft', since: at }];
  assert.equal(blockedJobs({}, rows, Date.now(), [{ ...h, kind: 'module', value: 'm1', live: false }])[0].by, 'the coordinator');
});

test('sweep: a live layer hold on a BLOCKED job\'s layer holds it as a module hold does', async () => {
  const { hold } = await import('../lib/hold.mjs');
  const at = new Date(Date.now() - 60 * 6e4).toISOString();
  const root = withOrigin({ 'build/layers.md': '| layer | modules |\n|---|---|\n| 2 | m1 |\n', 'process/ledger/m1.json': entry('m1', { layer: 2, status: { state: 'BLOCKED', reason: 'the worker binding is missing', at } }) });
  recordStart(root, 'root', R, { log: quiet });
  recordStart(root, 'bob', B, { log: quiet });
  const h = hold(root, 'layer:2', { why: 'layer 2 waits for the binding', by: 'session_coord1', until: '90m', log: quiet });
  const r = run(root);
  assert.ok(!r.todo.some((x) => /ruling owed/.test(x)), r.todo.join('\n'));
  assert.ok(r.found.some((x) => x.startsWith(`m1: BLOCKED; blocked 60 min; held (${h.id} layer:2, by session_coord1)`)), r.found.join('\n'));
});

// Bob, 7 Nov: the round-close run is tool-started; owed and not run (the act that closed the round
// could not run it), the sweep wakes BOB for it, first.
const opened = (root) => { openPassed(root); git(['push', '-q', 'origin', 'refs/remotes/origin/process-state:refs/heads/process-state'], { cwd: root }); };
test('sweep: a round-close run owed and not run wakes BOB for it; none owed while the round is open', () => {
  const D = { slug_prefix: 'p3dev-', dry_run: ['true'], deploy: ['true'], walk: ['true'], guard_line: 'ok' };
  const root = withOrigin({ 'process/config.json': { tranche: 'tranche', deploy: D, plan: 'close' } });
  opened(root);
  recordStart(root, 'root', R, { log: quiet });
  recordStart(root, 'bob', B, { log: quiet });
  const s = run(root);
  assert.match(s.todo.join('\n'), /wake BOB with one message: .*send bob "Sweep: the round-close run is owed \(the last round \(plan close\) closed, not yet deployed\): node \S+ deploy dev, from a clean checkout of the tranche tip, first/);
  const open = withOrigin({ 'process/config.json': { tranche: 'tranche', deploy: D }, 'build/layers.md': '| layer | what | modules |\n|---|---|---|\n| 1 | first | m |\n', 'build/requirements/m.md': '- **R1** *(not yet met: x)* y\n' });
  opened(open);
  recordStart(open, 'root', R, { log: quiet });
  recordStart(open, 'bob', B, { log: quiet });
  assert.doesNotMatch(run(open).todo.join('\n'), /round-close run/);
});

// ===== file: anchor.test.mjs =====

// The anchor's reads of a base's config (confirming review of PR 97): a session's history
// cannot choose which "last config" counts, and a plain pull request cannot delete the config.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { keyAt, lastConfigAt } from '../lib/anchor.mjs';
import { pinChange } from '../lib/merge.mjs';
import { git } from '../lib/util.mjs';
import { commit, makeRepo, write } from './helpers.mjs';

const repo = { released: () => true, shim: () => null, descends: () => true };

test('a deleted config\'s last one is read along first parents, not in a date order a session sets', () => {
  const root = makeRepo({ 'process/config.json': { lockfiles: [] } });
  const init = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', '-b', 'side'], { cwd: root });
  const env = { ...process.env, GIT_COMMITTER_DATE: '2030-01-01T00:00:00Z' };
  write(root, { 'process/config.json': { approvals: { owner: 'evil' } } });
  git(['commit', '-q', '-am', 'S'], { cwd: root, env });
  git(['checkout', '-q', 'main'], { cwd: root });
  git(['rm', '-q', 'process/config.json'], { cwd: root });
  git(['commit', '-q', '-m', 'del'], { cwd: root });
  // The side branch merged in, resolved to the deletion, dated ahead of everything.
  git(['merge', '-q', '-s', 'ours', '--no-edit', 'side'], { cwd: root, env });
  assert.equal(lastConfigAt(root, 'main'), init);
  assert.match(keyAt(root, lastConfigAt(root, 'main'), 'approvals'), /neobobkrause/);
});

test('a plain pull request that deletes the config needs the owner\'s word', () => {
  const root = makeRepo({ 'process/config.json': {} });
  const mb = git(['rev-parse', 'HEAD'], { cwd: root });
