// ===== file: sweep.test.mjs (continued) =====

  const b = pr({ session: 'session_bob2' });
  assert.ok(b.prompt.includes(`You replace BOB \`${B}\``));
  assert.match(out.join('\n'), /fresh BOB: send ROOT one message asking for your handover \(`handover begin`\)/);
  assert.equal(pr({ session: 'session_job1' }).act, 'none');
  // A watcher that takes over as ROOT still runs on the watcher's prompt: its first wake as ROOT delivers ROOT's.
  recordStart(root, 'watcher', W, { log: quiet });
  recordStart(root, 'root', W, { log: quiet });
  assert.equal(readAddress(root).root.prompt, undefined, 'no prompt record on a takeover');
  const t = pr({ session: W });
  assert.equal(t.role, 'root');
  assert.equal(t.act, 'changed');
  assert.ok(t.prompt.startsWith('# ROOT'));
  assert.equal(pr({ session: W }).act, 'same');
});

test('sweep: a merged job\'s branch, BLOCKED when last fetched, is not listed BLOCKED (ROOT, 4 Nov)', () => {
  // job/m was BLOCKED, then its job went on and merged: the tranche holds every commit of the
  // branch and its entry is COMPLETE. A COMPLETE entry's branch is not fetched again, so the local
  // ref still shows the BLOCKED tip; instance-setup and wizard-scripts were listed so every hour.
  const root = withOrigin({ 'process/ledger/m.json': entry('m', { status: { state: 'WORKING' } }) });
  recordStart(root, 'root', R, { log: quiet });
  recordStart(root, 'bob', B, { log: quiet });
  git(['checkout', '-q', '-b', 'job/m'], { cwd: root });
  commit(root, { 'process/ledger/m.json': entry('m', { status: { state: 'BLOCKED', reason: 'waits on x' } }) });
  git(['push', '-q', 'origin', 'job/m'], { cwd: root });
  git(['fetch', '-q', 'origin', 'job/m'], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  // Before it merges, the branch's BLOCKED is listed.
  assert.match(run(root).found.join('|'), /m: BLOCKED/);
  git(['merge', '-q', '--no-ff', '-m', 'Merge job PR 9', 'job/m'], { cwd: root });
  commit(root, { 'process/ledger/m.json': entry('m', { status: { state: 'COMPLETE' } }) });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  git(['fetch', '-q', 'origin'], { cwd: root });
  const r = run(root);
  assert.doesNotMatch(r.found.join('|'), /m: BLOCKED/);
  // Its branch is still read (owedNotices reads a merged attempt's start row through it): no flag, no blocked.
  const row = status(root, { offline: true, log: quiet }).rows.find((x) => x.id === 'm');
  assert.deepEqual([row.branch, row.ahead, row.flag, row.blocked], ['BLOCKED (waits on x)', 0, undefined, undefined]);
  // A branch with work the tranche lacks still raises its flag, COMPLETE entry or not.
  git(['checkout', '-q', 'job/m'], { cwd: root });
  commit(root, { 'm.txt': 'a reopened attempt' });
  git(['push', '-q', 'origin', 'job/m'], { cwd: root });
  git(['fetch', '-q', 'origin', 'job/m'], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  assert.match(run(root).found.join('|'), /m: BLOCKED/);
});

// C37 (copy, 8 Nov): inquiry landed COMPLETE on layer 12 (PR 1028, job/inquiry-2), and ROOT's sweep
// still listed it BLOCKED from job/inquiry, PR 617's R31 block of 6 Nov, closed unmerged. A module
// COMPLETE on the tranche with no open PR has no job ref fetched, and a layer land never puts the
// branch in the tranche: a job branch whose tip is older than the module's newest land is stale.
test('sweep: a job branch BLOCKED before the module\'s later layer land is stale, not listed BLOCKED (C37)', () => {
  const root = withOrigin({ 'process/ledger/m.json': entry('m', { status: { state: 'COMPLETE' } }) });
  recordStart(root, 'root', R, { log: quiet });
  recordStart(root, 'bob', B, { log: quiet });
  git(['checkout', '-q', '-b', 'job/m'], { cwd: root });
  commit(root, { 'process/ledger/m.json': entry('m', { status: { state: 'BLOCKED', reason: 'R31 waits on an element' } }), 'm.txt': 'an attempt closed unmerged' });
  git(['push', '-q', 'origin', 'job/m'], { cwd: root });
  git(['fetch', '-q', 'origin', 'job/m'], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  // No land yet: the branch's BLOCKED is listed, as before.
  assert.match(run(root).found.join('|'), /m: BLOCKED/);
  // A later attempt lands m on layer 12 (its row on the state branch, newer than job/m's tip).
  const later = new Date(Date.now() + 120e3).toISOString().replace(/\.\d+Z$/, 'Z');
  writeState(root, 'process-state', 'land m', (d) => { mkdirSync(join(d, 'layerflow/12/land'), { recursive: true }); writeFileSync(join(d, 'layerflow/12/land/m-1028-abc.json'), JSON.stringify({ row: 'land', layer: 12, module: 'm', pr: 1028, branch: 'job/m-2', at: later }) + '\n'); });
  const r = run(root);
  assert.doesNotMatch(r.out, /m: BLOCKED/);
  const row = status(root, { offline: true, log: quiet }).rows.find((x) => x.id === 'm');
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

// ===== file: direct.mjs =====

// The direct flow (PD-25; Bob, 9 Nov: "Because modules are in a total order, perhaps holding jobs in
// upper layers until an earlier layer closes isn't necessary"; "All jobs of a layer should open at
// once up to the maximum slot cap"). process/config.json "merge_strategy": "direct".
//
// No layer branch: every job is cut from the tranche and publishes onto it. Its rows sit under one
// key per tranche, layerflow/direct-<tranche>/ (layerbase.mjs directKey), so the layer flow's start,
// run, test, land, reschedule, retest and gate rows serve it unchanged.
//   ready jobs   a module is ready when it has work (an unmet mark, an owed reopen, or an outstanding
//                reschedule), no open job, and every module upstream of it in the uses graph is
//                settled (no open job, no unmet mark, no outstanding reschedule; BLOCKED counts as
//                settled: it lands nothing). All ready jobs start at once, up to the slot cap.
//   publish      layer publish <id>, onto the tranche; a reschedule halts the run (layerflow.mjs).
//   land         layer land <pr> (the merge tool's): a ready job PR into the tranche whose gate is
//                green, every module it uses settled and their interface-changing lands held by its
//                head. An interface change reschedules every open user (an open job, or work not yet
//                landed) and notifies the rest, the notice triaged at once by rule (PD-20).
//   rounds       a round is every flawed module at once; its walk is owed once nothing is unsettled.
//   cycles       modules that use each other land in map order; the later one's land reschedules
//                the earlier ones.
import { P3, flowRows, gateFiles, interfaceChange, interfaceText, landReach, landTitle, mergeVia, outsideFiles, startable, totalOrder, writeRows } from './layerflow.mjs';
import { directKey, directMode, layersAt, safeName } from './layerbase.mjs';
import { checkRun, comments as ghComments, gateRuns, getPR, openPRs } from './github.mjs';
import { branchModule, entryFile, ledgerIds } from './ledger.mjs';
import { answerFile, noticeFile, noticeKey, noticeRecords, readModules, usersOf } from './notice.mjs';
import { deployRowsOf, findingsOf, owedReopens, walkHold } from './rounds.mjs';
import { foundFile, foundMarks } from './found.mjs';
import { fetchState, writeState } from './state.mjs';
import { paidFor } from './hold.mjs';
import { exists, fail, fetchBranch, git, loadConfig, now, repoSlug, unmetIds } from './util.mjs';

const short = (s) => String(s || '').slice(0, 10);
const isAnc = (root, a, b) => !!a && !!b && git(['merge-base', '--is-ancestor', a, b], { cwd: root, allowFail: true }).code === 0;
const hasCommit = (root, c) => git(['cat-file', '-e', `${c}^{commit}`], { cwd: root, allowFail: true }).code === 0;
const textAt = (root, ref, f) => (f && exists(root, ref, f) ? git(['show', `${ref}:${f}`], { cwd: root }) : null);
const entryAt = (root, ref, id) => { const t = git(['show', `${ref}:${entryFile(id)}`], { cwd: root, allowFail: true }); try { return t.code === 0 ? JSON.parse(t.stdout) : null; } catch { return null; } };

export const needDirect = (cfg, what) => { if (!directMode(cfg)) fail(`${what}: the direct flow's (process/config.json "merge_strategy": "direct", PD-25); this tranche runs ${JSON.stringify(cfg.merge_strategy ?? 'layer')}`); };

// The modules in their total order (the layer map's order, each after its providers; a cycle's
// modules in map order) and each one's upstream: every module it reaches through its uses, less a
// cycle peer that comes after it in that order (the cycle lands in map order).
export function usesGraph(ids, uses, mapOrder = []) {
  const known = new Set(ids);
  const pos = new Map();
  [...mapOrder.filter((id) => known.has(id)), ...[...ids].filter((id) => !mapOrder.includes(id)).sort()].forEach((id, k) => { if (!pos.has(id)) pos.set(id, k); });
  const mods = [...pos.keys()];
  const direct = new Map(mods.map((id) => [id, [...new Set(uses.get(id) || [])].filter((u) => u !== id && known.has(u))]));
  const reach = new Map();
  const reachOf = (id) => {
    if (reach.has(id)) return reach.get(id);
    const seen = new Set();
    const stack = [...direct.get(id)];
    while (stack.length) { const u = stack.pop(); if (seen.has(u)) continue; seen.add(u); stack.push(...direct.get(u)); }
    seen.delete(id);
    reach.set(id, seen);
    return seen;
  };
  const peer = (a, b) => reachOf(a).has(b) && reachOf(b).has(a);
  const before = (a, b) => pos.get(a) < pos.get(b);
  const upstream = new Map(mods.map((id) => [id, [...reachOf(id)].filter((u) => !peer(id, u) || before(u, id))]));
  // The uses a land waits on: its direct providers, a later cycle peer aside.
  const providers = new Map(mods.map((id) => [id, direct.get(id).filter((u) => !peer(id, u) || before(u, id))]));
  const order = totalOrder(mods, new Map(mods.map((id) => [id, providers.get(id)])));
  // The cycle peers before it: the modules its land reschedules (a cycle lands in map order).
  const earlierPeers = new Map(mods.map((id) => [id, mods.filter((u) => u !== id && peer(id, u) && before(u, id))]));
  return { order, upstream, providers, earlierPeers };
}

// The direct flow's read of the tranche: each module's state and the ready jobs.
// states: complete (nothing owed), deferred (BLOCKED), published / working (its job PR into the
// tranche ready / a draft), rescheduled (a provider's interface change since its last land), not
// started (an unmet mark or an owed reopen and no job open).
export function readDirect(root, cfg, { io = {}, slug = null } = {}) {
  const key = directKey(cfg.tranche);
  const ref = `refs/remotes/origin/${cfg.tranche}`;
  if (git(['rev-parse', '-q', '--verify', ref], { cwd: root, allowFail: true }).code !== 0) fail(`no ${cfg.tranche} on origin`);
  const rows = flowRows(root, cfg.state_branch, key);
  const ids = [...ledgerIds(root, ref)];
  const entries = new Map(ids.map((id) => [id, entryAt(root, ref, id)]));
  const dir = cfg.requirements_dir.replace(/\/$/, '');
  const reopens = owedReopens(root, cfg);
  // Its work: every unmet mark (a found mark too: a round is every flawed module at once) and each
  // owed reopen (C44) no land of it since answers.
  const marks = new Map(ids.map((id) => {
    const req = entries.get(id)?.requirements || `${dir}/${id}.md`;
    const m = [...unmetIds(textAt(root, ref, req) || ''), ...foundMarks(textAt(root, ref, foundFile(id))).map((f) => f.id)];
    reopens.filter((x) => x.module === id && !rows.lands.some((l) => l.module === id && String(l.at) > String(x.at))).forEach((x, k) => m.push(`O${k + 1}`));
    return [id, [...new Set(m)]];
  }));
  const list = (io.openPRs || openPRs)(slug, cfg.tranche);
  if (list === null) fail(`GitHub unreadable: the open pull requests into ${cfg.tranche} are not known`);
  const known = new Set(ids);
  const prs = list.map((p) => ({ number: p.number, draft: !!p.draft, head: p.head?.sha, ref: p.head?.ref, module: branchModule(p.head?.ref, known) })).filter((p) => p.module);
  const anc = (a, b) => isAnc(root, a, b);
  const outstandingOf = (id) => rows.reschedules.filter((r) => r.user === id && !rows.lands.some((l) => l.module === id && anc(r.provider_land, l.head)));
  const named = new Map((readModules(root, cfg, ref) || []).filter((m) => m?.id).map((m) => [m.id, m.uses || []]));
  const uses = new Map(ids.map((id) => [id, named.get(id) || entries.get(id)?.uses || []]));
  const mapOrder = layersAt(root, cfg, ref).flatMap((L) => L.mods);
  const g = usesGraph(ids, uses, mapOrder);
  const refused = (id, out) => out.length && (rows.retest_refusals || []).some((r) => r.module === id && String(r.at) >= String(out.map((o) => o.at).sort().at(-1)));
  let states = g.order.map((id) => {
    const e = entries.get(id);
    const pr = prs.find((p) => p.module === id) || null;
    const out = outstandingOf(id);
    const m = marks.get(id) || [];
    const st = e?.status?.state ?? null;
    const base = { id, pr: pr?.number ?? null, marks: m, outstanding: out, entry_state: st, lands: rows.lands.filter((l) => l.module === id).length, ...(refused(id, out) ? { retest_refused: true } : {}) };
    if (st === 'BLOCKED') return { ...base, state: 'deferred', why: `BLOCKED: ${e.status.reason || 'no reason'}` };
    if (out.length) return { ...base, state: 'rescheduled', why: `re-runs against ${[...new Set(out.map((r) => r.provider))].join(', ')}'s new interface${pr ? ` (PR ${pr.number} open)` : ''}` };
    if (pr && !pr.draft) return { ...base, state: 'published', why: `PR ${pr.number} ready into ${cfg.tranche}` };
    if (pr) return { ...base, state: 'working', why: `PR ${pr.number}, a draft` };
    if (m.length) return { ...base, state: 'not started', why: `${st || 'no ledger entry'}, unmet ${m.join(', ')}` };
    return { ...base, state: 'complete', why: base.lands ? `landed ${base.lands} time(s)` : `${st || 'no ledger entry'}, nothing owed` };
  });
  const settled = new Set(states.filter((s) => s.state === 'complete' || s.state === 'deferred').map((s) => s.id));
  states = states.map((s) => ({ ...s, waits: (g.upstream.get(s.id) || []).filter((u) => !settled.has(u)) }));
  return { key, ref, ids, rows, entries, prs, states, settled, ...g };
}

// The ready jobs: work and no job open, every upstream module settled; a recorded found mark starts
// its job at once. Each as layer jobs prints it (job start, or an additive change's layer retest: no slot).
export function readyJobs(x) {
  const ready = x.states.filter((s) => (s.state === 'not started' || (s.state === 'rescheduled' && s.pr === null)) && !s.waits.length);
  return startable(ready.map((s) => (s.entry_state === 'COMPLETE' && s.marks.length && s.state === 'not started' ? { ...s, why: `COMPLETE, unmet ${s.marks.join(', ')}` } : s)));
}

// Where the rounds stand under the direct flow (BD-R1 with PD-25): open while any module is not
// settled; walk once every one is and no walk came after the last land; after a walk, new when its
// recorded findings left flawed modules no land has answered yet, else clean. round: 1 + the walks
// before the work now open.
export function directRounds(root, cfg, x) {
  const walks = deployRowsOf(root, cfg);
  const last = walks.at(-1) || null;
  const open = x.states.filter((s) => !x.settled.has(s.id));
  const since = (at) => !last || String(at) > String(last.at);
  const moved = x.rows.lands.some((l) => since(l.at)) || x.rows.starts.some((r) => since(r.at));
  if (open.length && last && !moved) return { state: 'new', round: walks.length + 1, mods: open.map((s) => s.id), last };
  if (open.length) return { state: 'open', round: walks.length + 1, mods: open.map((s) => s.id), last };
  if (!last || x.rows.lands.some((l) => since(l.at))) return { state: 'walk', round: walks.length + 1, last };
  return { state: 'clean', round: walks.length, last };
}

// The rounds read for round next and the round close (rounds.mjs roundState's states: open in place
// of a layer; new carries the round's modules, all at once).
export function directRoundsAt(root, cfg, { io = {}, slug = null } = {}) {
  const rs = directRounds(root, cfg, readDirect(root, cfg, { io, slug: slug || io.slug || repoSlug(root) }));
  return rs.state === 'new' ? { ...rs, next: { round: rs.round, mods: rs.mods } } : rs;
}

// The view status, the sweep and the idle check read (layerflow.mjs openLayer's shape): kind open
// while any job is ready or open, else done with the rounds' state.
export function directView(root, cfg, { slug = null, io = {} } = {}) {
  const x = readDirect(root, cfg, { io, slug });
  const rs = directRounds(root, cfg, x);
  let hold = null;
  try { hold = rs.last ? walkHold(findingsOf(root, cfg, x.ref, rs.last, { round: true })) : null; } catch { hold = null; }
  const ready = readyJobs(x);
  const v = { direct: true, n: x.key, round: rs.round, rounds: rs.state, states: x.states, prs: x.prs, companions: [], startable: ready, ready: false, sync: null, early: [], early_next: null, ...(hold ? { hold } : {}) };
  if (rs.state === 'open' || rs.state === 'new') return { kind: 'open', ...v };
  if (hold) return { ...v, kind: 'done', rounds: 'held', findings: true, round: rs.round + 1, why: hold };
  return { ...v, kind: 'done' };
}

const COUNT = ['complete', 'deferred', 'published', 'working', 'rescheduled', 'not started'];
const counts = (states) => COUNT.map((k) => `${k} ${states.filter((s) => s.state === k).length}`).join(', ');
export const directAct = (v) => (v?.kind === 'open' && v.startable.length ? `${P3} direct jobs, then each job start it lists`
  : v?.kind === 'done' && v.rounds === 'held' ? `${P3} round next, then ${P3} round next --apply (records the walk's findings; round ${v.round}'s jobs are then ready)`
    : v?.kind === 'done' && v.rounds === 'walk' ? `the round-close walk (round ${v.round}): every module has landed`
      : `${P3} status --role bob (the direct flow's next act)`);
export function directLines(v, cfg) {
  if (v.kind === 'done' && v.rounds === 'held') return [`direct flow: round ${v.round}'s jobs are ready once the walk's findings are recorded: ${v.why}`, `the one next act: \`${P3} round next\` (a dry run), then \`${P3} round next --apply\``];
  if (v.kind === 'done') return [v.rounds === 'walk' ? `direct flow: every module of round ${v.round} has landed on ${cfg.tranche}; its walk ends it (the round-close run, BD-R1)` : `direct flow: every module has landed and the walk ended round ${v.round}; no module is flawed: the release path follows (BD-R1)`];
  const L = [`direct flow (PD-25): round ${v.round} on ${cfg.tranche}; ${counts(v.states)}`];
  for (const s of v.states.filter((q) => q.state === 'rescheduled')) L.push(`- ${s.id} rescheduled: ${s.why}`);
  if (v.startable.length) L.push(`jobs to start, all at once up to the slot cap (yours to start, BOB; the job cap counts), from \`${P3} direct jobs\`:`, ...v.startable.map((q) => `- ${q.cmd}`));
  else L.push('no job is ready: each module with work waits on an upstream module not yet settled, or is open');
  return L;
}

// direct jobs: the ready jobs, and each waiting module with what it waits on.
export function directJobs(root, { io = {}, log = console.log } = {}) {
  const cfg = loadConfig(root);
  needDirect(cfg, 'direct jobs');
  fetchBranch(root, cfg.tranche, { allowFail: true });
  fetchState(root, cfg.state_branch, { fresh: true });
  const v = directView(root, cfg, { slug: io.slug || repoSlug(root), io });
  for (const l of directLines(v, cfg)) log(l);
  for (const s of v.states.filter((q) => q.waits?.length && !['complete', 'deferred'].includes(q.state))) log(`waits: ${s.id} (${s.state}) on ${s.waits.join(', ')}`);
  return { ok: true, startable: v.startable, states: v.states, view: v };
}

// ---- the land ----------------------------------------------------------------------------------

// The merge tool's land of a direct job PR into the tranche (layer land <pr> dispatches here).
export async function directLand(root, prn, { io = {}, log = console.log, by = 'bob' } = {}) {
  const cfg = loadConfig(root);
  needDirect(cfg, 'layer land');
  const slug = io.slug || repoSlug(root);
  const x = { getPR, checkRun, comments: ghComments, openPRs, merge: (s, k, sha, title) => mergeVia(s, k, sha, title), triage: null, ...io };
  const n0 = Number(prn);
  const pr = x.getPR(slug, n0) || fail(`pull request ${n0} not found`);
  if (pr.base?.ref !== cfg.tranche) fail(`pull request ${n0} is into ${pr.base?.ref}, not the tranche ${cfg.tranche}: under the direct flow a job's pull request goes into the tranche`);
  const recover = pr.merged === true && !!pr.merge_commit_sha;
  if (pr.state !== 'open' && !recover) fail(`pull request ${n0} is ${pr.merged ? 'merged' : pr.state}`);
  if (pr.draft && !recover) fail(`pull request ${n0} is a draft: the job publishes it (${P3} layer publish <id>)`);
  if (pr.head?.repo?.full_name && pr.head.repo.full_name !== slug) fail(`pull request ${n0} is not from a branch of ${slug}`);
  fetchBranch(root, cfg.tranche);
  fetchState(root, cfg.state_branch, { fresh: true });
  const key = directKey(cfg.tranche);
  const tref = `refs/remotes/origin/${cfg.tranche}`;
  const id = branchModule(pr.head?.ref, ledgerIds(root, tref)) || fail(`pull request ${n0} is from ${pr.head?.ref}, not a job branch`);
  fetchBranch(root, pr.head.ref, { allowFail: true });
  const head = pr.head.sha;
  if (!hasCommit(root, head)) fail(`this clone does not hold ${short(head)}, the head of pull request ${n0}`);
  const d = readDirect(root, cfg, { io: x, slug });
  const rows = d.rows;
  let before;
  let after;
  if (recover) {
    if (rows.lands.some((l) => l.pr === n0)) fail(`pull request ${n0} is merged and its land is recorded`);
    after = pr.merge_commit_sha;
    if (!hasCommit(root, after)) fail(`this clone does not hold ${short(after)}, pull request ${n0}'s merge`);
    before = git(['rev-parse', `${after}^1`], { cwd: root });
    log(`pull request ${n0} merged at ${short(after)} with no land recorded: recording it now`);
  } else {
    const g = x.checkRun(slug, head, 'gate');
    if (g?.status !== 'completed' || g.conclusion !== 'success') fail(`the gate on ${short(head)} is ${g ? `${g.status}${g.conclusion ? ` ${g.conclusion}` : ''}` : 'not run'}: a publish lands only on a green gate on its tip`);
    const e = entryAt(root, head, id) || fail(`no ledger entry for ${id} at ${short(head)}`);
    before = git(['rev-parse', tref], { cwd: root });
    const out = outsideFiles(root, e, git(['merge-base', before, head], { deepen: true, cwd: root }), head);
    if (out.length) fail(`refused: pull request ${n0} changes files outside ${id} (ARC-2): ${out.slice(0, 10).join(', ')}`);
    // Every module it uses settled (a later cycle peer aside: a cycle lands in map order).
    const unsettled = (d.providers.get(id) || []).filter((p) => !d.settled.has(p));
    if (unsettled.length) fail(`refused: ${id} uses ${unsettled.map((p) => `${p} (${d.states.find((s) => s.id === p)?.state})`).join(', ')}, not settled: it lands once each has landed or has nothing owed; nothing was merged`);
    // Their interface-changing lands held by its head; and every reschedule of it (Bob, 5 Nov: a run
    // that started before a provider's newest interface change never counts).
    const late = [...new Set([
      ...(d.providers.get(id) || []).flatMap((p) => rows.lands.filter((l) => l.module === p && l.interface?.changed && !isAnc(root, l.merge, head)).map((l) => `${p}'s interface change (land ${short(l.merge)})`)),
      ...rows.reschedules.filter((r) => r.user === id && !isAnc(root, r.provider_land, head)).map((r) => `${r.provider}'s interface change (land ${short(r.provider_land)})`),
    ])];
    if (late.length) fail(`refused: ${id}'s run on ${short(head)} started before ${late.join(', ')}: it never counts; the job runs ${P3} layer publish ${id} again`);
    const pre = (x.interfaceChange || interfaceChange)(root, cfg, id, before, head);
    if (pre.unread) fail(`refused: ${id}'s exports could not be read at ${short(head)} (${pre.unread}); the job fixes what cannot be read and publishes again; nothing was merged`);
    const r = await x.merge(slug, n0, head, landTitle(n0));
    if (!r?.merged && !r?.sha) fail(`GitHub did not merge pull request ${n0}: ${JSON.stringify(r).slice(0, 200)}`);
    fetchBranch(root, cfg.tranche);
    after = r.sha && hasCommit(root, r.sha) ? r.sha : git(['rev-parse', tref], { cwd: root });
  }
  const { ic, users, reach, classFor, triggersFor } = landReach(root, cfg, id, before, after, rows);
  // Open users (a job PR open, or work not yet landed) are rescheduled; so is a cycle peer before it
  // in map order, which landed first; the rest (COMPLETE, BLOCKED) are noticed.
  const st = new Map(d.states.map((s) => [s.id, s]));
  const openUser = (u) => !!st.get(u) && !['complete', 'deferred'].includes(st.get(u).state);
  const peers = new Set(d.earlierPeers.get(id) || []);
  const reached = users.filter((u) => u !== id && (!reach || reach.has(u)));
  const resched = ic.changed ? reached.filter((u) => openUser(u) || peers.has(u)) : [];
  const noticed = ic.changed ? reached.filter((u) => !resched.includes(u)) : ic.provides ? users.filter((u) => u !== id) : [];
  const runs = gateRuns(x.comments(slug, n0) || []).filter((q) => q?.sha);
  const at = now();
  if (ic.unread) log(`warning: ${id}'s exports could not be read on the land ${short(after)} (${ic.unread}): counted as breaking`);
  const land = { row: 'land', layer: key, direct: true, module: id, pr: n0, branch: pr.head.ref, head, before, merge: after, at, by, gate_runs: runs.length, interface: ic, users_rescheduled: resched, users_noticed: noticed };
  const files = [[`layerflow/${key}/land/${safeName(id)}-${n0}-${short(head)}.json`, land], ...gateFiles(key, id, n0, runs)];
  for (const u of resched) files.push([`layerflow/${key}/reschedule/${safeName(u)}-${safeName(id)}-${short(after)}.json`, { row: 'reschedule', layer: key, user: u, provider: id, provider_pr: n0, provider_land: after, at, key: `${u}<-${id}@${short(after)}`, why: interfaceText(ic), triggers: triggersFor(u), class: classFor(u), ...(peers.has(u) ? { cycle: true } : {}) }]);
  let notice = null;
  if (noticed.length) {
    const k = noticeKey(id, n0);
    notice = { row: 'notice', at, key: k, provider: id, ids: [], pr: n0, users: noticed, source: 1, ...(ic.exports ? { exports: ic.exports } : {}), layer_flow: { layer: key, provides: !!ic.provides, rescheduled: ic.changed } };
    files.push([noticeFile(k), notice]);
  }
  try { for (const q of noticeRecords(root, cfg.state_branch).filter((r) => !r.withdrawn && r.open.includes(id))) files.push([answerFile(id, q.key), { row: 'answered', at, key: q.key, user: id, pr: n0, by: 'layer land' }]); } catch { /* none read: none answered */ }
  writeRows(root, cfg.state_branch, `direct ${cfg.tranche}: land PR ${n0} (${id})${ic.changed ? `, interface changed (${ic.class}): ${resched.length} rescheduled, ${noticed.length} noticed` : ''}`, files);
  log(`landed PR ${n0} (${id}) into ${cfg.tranche} at ${short(after)}; interface: ${interfaceText(ic)}`);
  try { writeState(root, cfg.state_branch, `starts owed: ${id} landed (PR ${n0})`, (dir) => { paidFor(dir, [id]); return {}; }); } catch (e) { log(`note: the starts owed were not updated (${e.message})`); }
  const msgs = [];
  for (const u of resched) {
    const p = d.prs.find((q) => q.module === u);
    const text = `${cfg.tranche}: ${id} changed its interface (${classFor(u)}; land ${short(after)}: ${interfaceText(ic)}). Halt any test run now; run \`${P3} layer publish ${u}\` again: it brings job/${u} up to ${cfg.tranche} and its gate re-runs your suite against ${id}'s new version. A run started before this never counts.`;
    if (p) { msgs.push({ user: u, pr: p.number, text }); log(`BOB delivers to job ${u}'s session (PR ${p.number}), with send_message priority now: ${text}`); } else log(`${u}: rescheduled; no job open: it re-runs when it starts (${P3} direct jobs lists it once its upstream is settled)`);
  }
  // The notice triaged at once by rule (PD-20): users not affected answered, the rest owed by name.
  let triage = null;
  if (notice) {
    log(`provider notice ${notice.key} for ${noticed.length} user(s): ${noticed.join(', ')}`);
    try { const { triageAtMerge } = await import('./triage.mjs'); triage = (x.triage || triageAtMerge)(root, cfg, notice, { ref: after, log }); } catch (e) { triage = { error: String(e.message || e) }; log(`notice triage ${notice.key} at the land FAILED (${String(e.message || e).split('\n')[0].slice(0, 160)}); next act: ${P3} notice triage ${notice.key}`); }
  }
  return { ok: true, land, messages: msgs, triage };
}

// ===== file: roundnext.mjs =====

// round next (C46; Bob, 9 Nov: "Let's fix as many of them as we can", the causes of slow progress):
// a round opened, or carried on, by one command. On 8-9 Nov BOB opened round 2 by hand over many
// turns: each walk finding recorded (`found ... --from "internal walk ..." [--covers n]`, owed
// reopens per C44), status --role bob read for holds, `layer open <n>`, `layer jobs <n>`, then each
// `job start ... --reopen ...`; each step waited on a turn, and one hid a cycle (C44).
//
// From the latest round walk (rounds.mjs deployRowsOf), in one run: the walk's findings grouped by
// module, one entry per distinct flaw with its --covers count, the one-line text from the walk's
// own failure records (BOB may give a file of `<module>: <text>` lines instead); each recorded as
// `found` records it (an owed reopen on the state branch for a module whose test pins its
// requirement ids, else a found mark, all of a run's marks in one plain pull request merged by the
// merge tool); the PD-16 set-aside (findingsOf, round: true: the live arm's findings hold no round
// once its internal walk found flaws); the round's lowest layer opened (layer open); and the
// `job start` commands of its jobs printed (a start needs create_session: the tool prints them, it
// starts no session). The same command opens a round's next layer once one merges (the round's
// pass over the map), lists the open layer's jobs, names the round's walk when every layer merged,
// and names the release path after a clean walk. Idempotent: what is recorded is skipped, an open
// pull request of its marks is merged, an open layer's jobs are listed. A dry run by default;
// --apply does it.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { LEDGER_DIR } from './ledger.mjs';
import { addFound, found, foundFile, foundLine, foundMarks, moduleFiles, nextFound, pinnedIds, reopenKey } from './found.mjs';
import { directMode, layerOf, layerName, layersAt, roundLayerName } from './layerbase.mjs';
import { directJobs, directRoundsAt } from './direct.mjs';
import { flowRows, layerJobs, layerOpen, needLayerMode, nextRound } from './layerflow.mjs';
import { deployRowsOf, findingsOf, internalClean, owedReopens, releaseNext, roundState, runSource, unplaced, walkHold } from './rounds.mjs';
import { createPR, editPR, getPR, openPRs } from './github.mjs';
import { mergePlain } from './merge.mjs';
import { fetchState, readState } from './state.mjs';
import { fail, fetchBranch, git, loadConfig, repoSlug, withTemp } from './util.mjs';

const P3 = 'node .process/tool/p3.mjs';
const MODULE = /^[a-z0-9][a-z0-9-]*$/;
export const ROUND_NEXT = `${P3} round next`;
// The plain pull request's --no-review reason: found marks only, as `found` prints it.
const NO_REVIEW = 'work found elsewhere: found marks only, no code (round next)';

// One line of text, as a found mark can carry it: no control characters, no mark of its own (found.mjs clean).
export const oneLine = (s) => String(s ?? '').replace(/[\x00-\x1f\x7f]+/g, ' ').replace(/\s+/g, ' ').replace(/\*\*/g, '').replace(/not\s*yet\s*met/gi, 'not met').slice(0, 200).trim();

// Whether the run's findings are its internal walk's (PD-16, C43): a round walk is its internal walk
// alone; a deploy dev run's internal walk that found flaws sets its live arm aside.
export const internalRun = (row) => !!row && (row.row === 'round-walk' || (!!row.internal_walk && !internalClean(row)));
// The --from a run's findings take, as walkHold names it (its source names the run: findingsOf).
export const fromOf = (row) => `${internalRun(row) ? 'internal walk' : 'walk'} ${runSource(row)}`;

// The run's failure records, from its reports stored on the state branch (the internal walk's where
// its findings are the run's, else the walk's). { failures: [...], read: n reports read, unread: [...] }.
export function walkFailures(root, cfg, row) {
  const part = internalRun(row) ? row.internal_walk : row.walk;
  const reports = (part?.reports || []).filter((r) => typeof r?.stored === 'string' && /\.json$/.test(r.stored) && !/^not /.test(r.stored));
  const failures = [];
  const unread = [];
  let read = 0;
  for (const r of reports) {
    let j = null;
    try { j = JSON.parse(readState(root, cfg.state_branch, r.stored) || 'null'); } catch { j = null; }
    if (!j || typeof j !== 'object') { unread.push(r.stored); continue; }
    read++;
    if (Array.isArray(j.failures)) failures.push(...j.failures);
  }
  return { failures, read, unread };
}

// A failure's module, its distinct flaw and its one-line text, as the walker wrote them: `module`
// (or `owner`), `flaw` (else `kind`) and `finding` / `summary` / `message` / `title` (else its kind
// and detail).
const modOf = (f) => { const m = f && typeof f === 'object' ? (f.module ?? f.owner) : null; return typeof m === 'string' && MODULE.test(m) ? m : null; };
const textOf = (f) => {
  if (!f || typeof f !== 'object') return 'a walk failure';
  const said = f.finding ?? f.summary ?? f.message ?? f.title;
  const t = oneLine(said ?? [f.kind, f.detail].filter((x) => x !== undefined && x !== null && x !== '').join(': '));
  return t || 'a walk failure';
};
const flawOf = (f) => String((f && typeof f === 'object' && (f.flaw ?? f.kind)) ?? textOf(f));

// The walk's findings, one entry per distinct flaw: { module, text, covers }; a failure that names
// no module is an entry with module null (BOB names it, in the file).
export function walkEntries(failures) {
  const by = new Map();
  for (const f of failures) {
    const module = modOf(f);
    const k = `${module}\0${flawOf(f)}`;
    const e = by.get(k);
    if (e) e.covers++;
    else by.set(k, { module, text: textOf(f), covers: 1 });
  }
  return sameText([...by.values()]);
}
// Entries of one module with the same text are one finding (found keys an owe by module and text,
// and a second mark of the same words is the same mark): their counts summed.
export function sameText(entries) {
  const out = [];
  for (const e of entries) {
    const had = out.find((x) => x.module === e.module && x.text === e.text);
    if (had) had.covers += e.covers;
    else out.push({ ...e });
  }
  return out;
}

// BOB's file: one finding a line, `<module>: <text>`, optionally ending `, covers <n>`; blank lines
// and lines starting with # are skipped.
export function parseFindings(text) {
  const out = [];
  String(text).split('\n').forEach((l, i) => {
    const s = l.trim();
    if (!s || s.startsWith('#')) return;
    const m = s.match(/^([a-z0-9][a-z0-9-]*)\s*:\s*(.+)$/);
    if (!m) fail(`--findings line ${i + 1}: \`<module>: <text>\` (a module id, a colon, the finding), not ${JSON.stringify(s.slice(0, 80))}`);
    let t = m[2].trim();
    let covers = null;
    const c = t.match(/,\s*covers (\d+)\s*$/);
    if (c) { covers = Number(c[1]); t = t.slice(0, c.index).trim(); if (covers < 1) fail(`--findings line ${i + 1}: covers <n> is a whole number from 1`); }
    if (/\*\*[RF][\w.-]*\*\*|not yet met/i.test(t)) fail(`--findings line ${i + 1}: the finding must not hold a mark of its own (**R..**, **F..** or "not yet met")`);
    if (/[\x00-\x1f]/.test(t) || !t) fail(`--findings line ${i + 1}: the finding is one line of text`);
    out.push({ module: m[1], text: t.replace(/\s+/g, ' '), covers, line: i + 1 });
  });
  return out;
}

// The walk's entries with BOB's file over them: a module the file names takes its lines in place of
// the walk's entries for it, a line with no covers sharing what the walk counted for that module
// (the first such line takes the rest); a module the walk did not name counts 1 a line unless it
// says. With a file, the walk's entries that name no module are BOB's to place in it.
export function withFile(entries, lines) {
  if (!lines) return entries;
  const named = new Set(lines.map((l) => l.module));
  const counted = (id) => entries.filter((e) => e.module === id).reduce((a, e) => a + e.covers, 0);
  const out = entries.filter((e) => e.module && !named.has(e.module));
  for (const id of named) {
    const mine = lines.filter((l) => l.module === id);
    const said = mine.reduce((a, l) => a + (l.covers || 0), 0);
    const bare = mine.filter((l) => !l.covers);
    const rest = Math.max(bare.length, counted(id) - said);
    mine.forEach((l) => out.push({ module: id, text: l.text, covers: l.covers || (l === bare[0] ? rest - (bare.length - 1) : 1), file: true }));
  }
  return sameText(out);
}

// How each entry is recorded, and whether it is: an owed reopen (its module's test pins its
// requirement ids: found.mjs) keyed as found keys it, or a found mark on the tranche whose text and
// source match; `pending` when an open pull request of round next's carries the mark.
function routeOf(root, cfg, ref, e, from, { owed, prHeads }) {
