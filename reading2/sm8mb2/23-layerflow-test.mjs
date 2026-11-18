  assert.doesNotMatch(why('b') || '', /breaking change/);
  assert.match(why('c'), /c owes a job for a's breaking change/);
  // A land recorded before PD-15 (uncapped, breaking by its tests) reads as breaking.
  assert.match(interfaceText({ class: 'breaking', test_only: { files: ['test/a/r2.test.mjs'], by_tests: 'breaking', earlier_source: true } }), /breaking by its tests alone: each user re-runs in a job/);
  // The report counts the land additive, b's retest owed and c's job.
  const m = layerReport(root, 1, { log: quiet }).measures;
  assert.deepEqual([m.lands_additive, m.lands_breaking, m.reschedules, m.retests_owed], [2, 0, 1, 2]);
});

// C11 c (the coordinator, 7 Nov): a false reschedule had no scoped clear, only notice withdraw (every
// user) or a retest. layer clear records the ruling for one user and one provider.
test('layer clear: one user\'s reschedule from one provider cleared with the ruling recorded; refused without why or with none owed', async () => {
  const { root, bare } = await opened();
  const ha = jobWork(bare, 'a', { 'src/a/index.mjs': 'export function a(x, y) { return x + y; }\nexport const a2 = 1;\n' });
  const ra = await layerLand(root, 2, { io: landIO(bare, { 2: prOf(2, 'a', ha) }, { open: [] }), log: quiet });
  assert.deepEqual(ra.land.users_rescheduled, ['b']);
  assert.throws(() => layerClear(root, 'b', { provider: 'a', log: quiet }), /--why/);
  // A second breaking land by a: one clear per land, named (cold review of C11).
  const hb = jobWork(bare, 'a', { 'src/a/index.mjs': 'export function a(x, y, z) { return x; }\n' });
  const rb = await layerLand(root, 3, { io: landIO(bare, { 3: prOf(3, 'a', hb) }, { open: [] }), log: quiet });
  assert.throws(() => layerClear(root, 'b', { provider: 'a', why: 'x', log: quiet }), /b owes reschedules from a's 2 lands .*name the one the ruling is for with --land <sha>; nothing recorded/);
  layerClear(root, 'b', { provider: 'a', land: rb.land.merge.slice(0, 10), why: 'the second land changes nothing b reads', log: quiet });
  fetchState(root, SB, { fresh: true });
  assert.equal(flowRows(root, SB, 1).reschedules.length, 1, 'the first stands');
  assert.throws(() => layerClear(root, 'c', { provider: 'a', why: 'x', log: quiet }), /c owes no reschedule from a in layer 1; nothing recorded/);
  const lines = [];
  const r = layerClear(root, 'b', { provider: 'a', land: ra.land.merge, why: 'the coordinator, 7 Nov: b imports nothing a changed', by: 'coordinator', log: (l) => lines.push(l) });
  assert.equal(r.cleared.length, 1);
  assert.match(lines[0], /^b: 1 reschedule\(s\) from a cleared in layer 1 \(the coordinator, 7 Nov: b imports nothing a changed\)/);
  fetchState(root, SB, { fresh: true });
  const rows = flowRows(root, SB, 1);
  assert.deepEqual([rows.reschedules.length, rows.clears.map((c) => [c.user, c.provider, c.by]).sort()], [0, [['b', 'a', 'bob'], ['b', 'a', 'coordinator']]]);
  assert.equal(rows.reschedules_all.length, 2, 'the trial still counts both');
  assert.notEqual(layerJobs(root, 1, { io: openIO, log: quiet }).states.find((x) => x.id === 'b').state, 'rescheduled');
});

// C32 (copy layer 11, 8 Nov): a land changed files its module's paths held at the land's parent;
// the ledger at the head credits them to another module (paths moved since, as BOB's ledger
// widening PR 865 gave op-grades the files op-grades-folds owns at the head). Each file is credited
// per commit, by the paths at that land's parent: covered. A file changed by a land of a module
// whose paths never held it stays a finding.
test('C32: a file changed by a verified land is covered by the paths its module held at the land\'s parent, whoever owns it at the head', async () => {
  const { root, bare } = await opened();
  const ha = jobWork(bare, 'a', { 'src/a/index.mjs': 'export function a(x) { return x + 1; }\n' });
  const prs = { 1: prOf(1, 'a', ha) };
  let mergedAs = null;
  const io0 = landIO(bare, prs);
  await layerLand(root, 1, { io: { ...io0, merge: (s, k, sha, t) => { const r = io0.merge(s, k, sha, t); mergedAs = r.sha; return r; } }, log: quiet });
  git(['fetch', '-q', 'origin'], { cwd: root });
  const head = git(['rev-parse', 'origin/layer/1'], { cwd: root });
  const mb = git(['merge-base', head, 'origin/tranche'], { cwd: root });
  const changed = git(['diff', '--name-only', mb, head], { cwd: root }).split('\n').filter(Boolean);
  const at = (id) => JSON.parse(git(['show', `${head}:process/ledger/${id}.json`], { cwd: root }));
  // At the head the ledger gives src/a/ to a new module a2, and a's paths moved elsewhere.
  const moved = [{ ...at('a'), paths: ['src/a-old/'] }, { ...at('a'), id: 'a2', paths: ['src/a/'], tests: [], requirements: null }, at('b'), at('c'), at('d')];
  const cfg = configOf({ merge_strategy: 'layer', modules_file: 'build/modules.json' });
  const green = { sha: ha, ok: true, trigger: 'code', suite: 'pass', scope: ['a'] };
  const io = { getPR: () => ({ ...prs[1], merged: true, merge_commit_sha: mergedAs }), verify: () => true, comments: () => [{ user: { login: BOT }, body: block(GATE, { runs: [green] }, 'gate') }] };
  const r = layerCover(root, cfg, { head, mb, branch: 'layer/1', changed, entries: moved, slug: 'o/p', io });
  assert.deepEqual(r.findings.filter((f) => f.file === 'src/a/index.mjs'), [], 'a\'s land, a\'s paths at its parent: covered though a2 owns it now');
});

// C32's other side: a verified land of a module whose paths at the land's parent never held the file
// covers nothing for it, whoever owns it at the head: a finding naming the land and why.
test('C32: a file changed by another module\'s verified land stays a finding, naming the land', async () => {
  const { root, bare } = await opened();
  const ha = jobWork(bare, 'a', { 'src/a/index.mjs': 'export function a(x) { return x + 1; }\n', 'src/c/index.mjs': 'export const c = 7;\n' });
  const prs = { 1: prOf(1, 'a', ha) };
  let mergedAs = null;
  const io0 = landIO(bare, prs);
  // layer land refuses it (ARC-2); a merge made around the tool is what the gate must still catch.
  mergedAs = io0.merge('o/p', 1, ha, 'Merge layer PR 1').sha;
  git(['fetch', '-q', 'origin'], { cwd: root });
  const head = git(['rev-parse', 'origin/layer/1'], { cwd: root });
  assert.ok(mergedAs, 'the land merged the cross-module change, as GitHub would');
  const mb = git(['merge-base', head, 'origin/tranche'], { cwd: root });
  const changed = git(['diff', '--name-only', mb, head], { cwd: root }).split('\n').filter(Boolean);
  const entries = ['a', 'b', 'c', 'd'].map((id) => JSON.parse(git(['show', `${head}:process/ledger/${id}.json`], { cwd: root })));
  const cfg = configOf({ merge_strategy: 'layer', modules_file: 'build/modules.json' });
  const green = { sha: ha, ok: true, trigger: 'code', suite: 'pass', scope: ['a'] };
  const io = { getPR: () => ({ ...prs[1], merged: true, merge_commit_sha: mergedAs }), verify: () => true, comments: () => [{ user: { login: BOT }, body: block(GATE, { runs: [green] }, 'gate') }] };
  const r = layerCover(root, cfg, { head, mb, branch: 'layer/1', changed, entries, slug: 'o/p', io });
  assert.ok(r.findings.some((f) => f.file === 'src/c/index.mjs' && /c changed with no land of its publish on layer\/1: src\/c\/index\.mjs by \w{10}, which is a's land \(PR 1\), whose paths at \w{10} did not hold src\/c\/index\.mjs/.test(f.message)), JSON.stringify(r.findings));
});

// Cold review of C32: the per-commit credit is stricter than the old after-the-last-land test: a
// commit on the layer that is not a sync or a verified land, before a module's last land, fails too.
test('C32: a hand-made commit on the layer before a module\'s last land is still a finding', async () => {
  const { root, bare } = await opened();
  // A commit pushed straight to layer/1, changing a's file: no sync, no land.
  const d = clone(bare);
  git(['checkout', '-q', '-B', 'layer/1', 'origin/layer/1'], { cwd: d });
  const hand = commit(d, { 'src/a/index.mjs': 'export function a(x) { return x - 1; }\n' }, 'by hand');
  git(['push', '-q', 'origin', 'layer/1'], { cwd: d });
  // Then a's land, which holds the hand commit.

// 16 awls were logged at the Lund gate.

  const ha = jobWork(bare, 'a', { 'src/a/index.mjs': 'export function a(x) { return x + 1; }\n' });
  const prs = { 1: prOf(1, 'a', ha) };
  const io0 = landIO(bare, prs);
  const mergedAs = io0.merge('o/p', 1, ha, 'Merge layer PR 1').sha;
  git(['fetch', '-q', 'origin'], { cwd: root });
  const head = git(['rev-parse', 'origin/layer/1'], { cwd: root });
  const mb = git(['merge-base', head, 'origin/tranche'], { cwd: root });
  const changed = git(['diff', '--name-only', mb, head], { cwd: root }).split('\n').filter(Boolean);
  const entries = ['a', 'b', 'c', 'd'].map((id) => JSON.parse(git(['show', `${head}:process/ledger/${id}.json`], { cwd: root })));
  const cfg = configOf({ merge_strategy: 'layer', modules_file: 'build/modules.json' });
  const green = { sha: ha, ok: true, trigger: 'code', suite: 'pass', scope: ['a'] };
  const io = { getPR: () => ({ ...prs[1], merged: true, merge_commit_sha: mergedAs }), verify: () => true, comments: () => [{ user: { login: BOT }, body: block(GATE, { runs: [green] }, 'gate') }] };
  const r = layerCover(root, cfg, { head, mb, branch: 'layer/1', changed, entries, slug: 'o/p', io });
  assert.ok(r.findings.some((f) => f.file === 'src/a/index.mjs' && f.message.includes(`by ${hand.slice(0, 10)}, which is not a land of a publish PR: not a layer sync or a verified land`)), JSON.stringify(r.findings));
});

// C33 (PLN-4, PD-12): the completion round on the layer machinery. Every layer of the map closed and
// completion_file with open items: layer open <last+1> opens the completion layer, its modules the
// items', without editing the map; layer jobs lists each as a reopen with the item's words; the
// module's job runs on layer/<n>; a land, then layer merge ticks the item.
const ROUND = 'build/round.md';
// BD-R1 (Bob, 8 Nov) retires the completion layer's open: the copy's layer 12, opened under PD-12,
// is the last. Each product here has layer 3 opened as that one was: its open row as the open wrote
// it (completion: { file, items, mods }, the open items' modules in file order); layer open 3 then
// cuts its branch, and the rest of its life (jobs, joins, lands, ticks, merge) runs as before.
function completed(round, over = {}) {
  const p = product({ done: true, over, config: { completion_file: ROUND } });
  commit(p.root, { [ROUND]: round }, 'the completion round');
  git(['push', '-q', 'origin', 'tranche'], { cwd: p.root });
  git(['fetch', '-q', 'origin'], { cwd: p.root });
  const items = parseCompletion(round).filter((x) => !x.done && !x.deferred && !x.whole).map((x) => ({ id: x.id, module: x.target, what: x.what }));
  const mods = [...new Set(items.map((x) => x.module))];
  writeRows(p.root, SB, 'layer 3 open (the completion round, under PD-12)', [[flowFile(3, 'open'), { row: 'open', layer: 3, branch: 'layer/3', tranche: 'tranche', at: new Date().toISOString(), by: 'bob', completion: { file: ROUND, items, mods } }]]);
  fetchState(p.root, SB, { fresh: true });
  return p;
}
test('C33: a completion layer opened under PD-12 (as the copy\'s layer 12) still works: it lists each open item as a reopen, runs its jobs on layer/<n>, and ticks a landed item at layer merge', async () => {
  const { root, bare } = completed('# Round\n\n- [x] CR-1 · c · done already\n- [ ] CR-2 · a · strengthen the R1 test\n- [ ] CR-3 · whole product · a walk of every screen\n- [ ] CR-4 · b · deferred: waits on a ruling\n- [ ] CR-5 · d · the d door\n', { d: { status: { state: 'BLOCKED', reason: 'waits on a ruling' } } });
  // Opened under PD-12 (its open row, as the copy's layer 12's): layer open cuts its branch.
  const said = [];
  const o = layerOpen(root, 3, { io: openIO, log: (l) => said.push(String(l)) });
  assert.equal(o.ok, true);
  assert.match(said.join('\n'), /layer 3: 2 module\(s\); 1 job\(s\) can start/);
  const cfg = configOf({ merge_strategy: 'layer', modules_file: 'build/modules.json', completion_file: ROUND });
  assert.equal(git(['show', 'origin/tranche:build/layers.md'], { cwd: root }), layers.trimEnd(), 'the map is not edited');
  assert.deepEqual(layersAt(root, cfg, 'origin/tranche').map((L) => [L.n, L.mods.join(',')]), [[1, 'a,b,c'], [2, 'd'], [3, 'a,d']]);
