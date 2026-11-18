// ===== file: layerflow.test.mjs (continued) =====

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


// Received at Pell, 14 cedars.

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
  const j = layerJobs(root, 3, { io: openIO, log: quiet });
  assert.deepEqual(j.startable.map((x) => x.cmd), ['node .process/tool/p3.mjs job start a --sessions <file> --reopen "CR-2: strengthen the R1 test"'], 'd is BLOCKED: deferred, as any layer counts it');
  // The job's config: layer/3 (job start --reopen refused "no open branch" before).
  assert.equal(jobCfg(root, loadConfig(root), 'a').layer?.n, 3);
  // a's work lands on layer/3; layer merge ticks CR-2 only (d, BLOCKED, did not land; CR-4 is deferred).
  const ha = jobWork(bare, 'a', { 'src/a/index.mjs': 'export function a(x) { return x + 1; }\n' }, { n: 3 });
  const prs = { 7: prOf(7, 'a', ha, { base: { ref: 'layer/3' } }) };
  let landedAs = null;
  const lio = { ...landIO(bare, prs), merge: (s, k, sha, title) => { const r = ghMerge(bare, 'layer/3', sha, title); landedAs = r.sha; return r; } };
  await layerLand(root, 7, { io: lio, log: quiet });
  const mio = { slug: 'o/p', openPRs: () => [], findPR: () => null, createPR: (s, p) => ({ number: 50, ...p, base: { ref: p.base } }), checkRun: () => ({ status: 'completed', conclusion: 'success' }), merge: (s, k, sha, title) => ghMerge(bare, 'tranche', sha, title), roundClose: () => ({ ran: false, owed: null }) };
  const out = [];
  await layerMerge(root, 3, { io: mio, wait: false, log: (l) => out.push(String(l)) }).catch((e) => { out.push(`REFUSED ${e.message}`); });
  git(['fetch', '-q', 'origin'], { cwd: root });
  assert.ok(!out.some((l) => l.startsWith('REFUSED')), out.join('\n'));
  const round = git(['show', `origin/layer/3:${ROUND}`], { cwd: root });
  assert.match(round, /- \[x\] CR-2 · a/);
  assert.match(round, /- \[ \] CR-5 · d/, 'd did not land: open');
  assert.match(round, /- \[ \] CR-4 · b · deferred/, 'deferred: as it was');
  assert.match(round, /- \[ \] CR-3 · whole product/);
  const tick = git(['log', '-1', '--format=%H', '--grep=^Tick completion items', 'origin/layer/3'], { cwd: root });
  assert.match(git(['log', '-1', '--format=%s', tick], { cwd: root }), /^Tick completion items of layer 3: CR-2$/);
  assert.match(git(['show', `origin/tranche:${ROUND}`], { cwd: root }), /- \[x\] CR-2 · a/, 'the layer PR carried the tick into the tranche');
  // The layer gate: the tick is covered; a hand edit of the completion file on the layer is not.
  const cover = (head) => {
    const mb = git(['merge-base', head, tick + '~1'], { cwd: root });
    const base = git(['rev-parse', `${landedAs}^1`], { cwd: root });
    const changed = git(['diff', '--name-only', base, head], { cwd: root }).split('\n').filter(Boolean);
    const entries = ['a', 'b', 'c', 'd'].map((id) => JSON.parse(git(['show', `${head}:process/ledger/${id}.json`], { cwd: root })));
    const green = { sha: ha, ok: true, trigger: 'code', suite: 'pass', scope: ['a'] };
    const io = { getPR: () => ({ ...prs[7], merged: true, merge_commit_sha: landedAs }), verify: () => true, comments: () => [{ user: { login: BOT }, body: block(GATE, { runs: [green] }, 'gate') }] };
    void mb;
    return layerCover(root, cfg, { head, mb: base, branch: 'layer/3', changed, entries, slug: 'o/p', io }).findings.filter((f) => f.file === ROUND);
  };
  assert.deepEqual(cover(tick), [], 'the tool\'s tick of a landed module\'s item');
  const d2 = clone(bare);
  git(['checkout', '-q', '-B', 'x', tick], { cwd: d2 });
  const hand = commit(d2, { [ROUND]: git(['show', `${tick}:${ROUND}`], { cwd: root, allowFail: true }).stdout.replace('- [ ] CR-5', '- [x] CR-5') }, 'Tick completion items of layer 3: CR-5');
  git(['push', '-q', 'origin', 'x'], { cwd: d2 });
  git(['fetch', '-q', 'origin'], { cwd: root });
  assert.match(cover(hand).map((f) => f.message).join('\n'), /changed on layer\/3 by \w{10}, which ticks CR-5, whose module d has no verified land on the layer/);
  const d3 = clone(bare);
  git(['checkout', '-q', '-B', 'y', tick], { cwd: d3 });
  const other = commit(d3, { [ROUND]: git(['show', `${tick}:${ROUND}`], { cwd: root, allowFail: true }).stdout.replace('- [ ] CR-5', '- [x] CR-5') }, 'Tick completion items of layer 4: CR-5');
  git(['push', '-q', 'origin', 'y'], { cwd: d3 });
  git(['fetch', '-q', 'origin'], { cwd: root });
  assert.match(cover(other).map((f) => f.message).join('\n'), /which is not the tool's tick of this completion layer/, 'a tick titled for another layer');
});

test('BD-R1: no completion layer opens any more: open items past the map open no layer before a walk; a map layer still open refuses as before', () => {
  const p0 = product({ done: true, config: { completion_file: ROUND } });
  commit(p0.root, { [ROUND]: '- [ ] CR-1 · a · x\n' }, 'round');
  git(['push', '-q', 'origin', 'tranche'], { cwd: p0.root });
  git(['fetch', '-q', 'origin'], { cwd: p0.root });
  const cfg = configOf({ merge_strategy: 'layer', modules_file: 'build/modules.json', completion_file: ROUND });
  const v = openLayer(p0.root, cfg, { slug: 'o/p', io: openIO });
  assert.deepEqual([v.kind, v.round, v.rounds], ['done', 1, 'walk'], 'round 1 waits on its walk, no completion layer is next');
  assert.match(layerLines(p0.root, cfg, { slug: 'o/p', io: openIO, view: v }).join('\n'), /layer flow: every layer of round 1 has merged; its walk ends it \(the round-close run, BD-R1\)/);
  assert.throws(() => layerOpen(p0.root, 3, { io: openIO, log: quiet }), /layer 3 is not in build\/layers\.md on tranche, and every layer of round 1 has merged: its walk ends it \(the round-close run\): no round layer opens before that walk \(BD-R1\); nothing was opened/);
  assert.equal(git(['ls-remote', '--heads', 'origin', 'layer/3'], { cwd: p0.root }), '', 'no branch cut');
  // A map layer still open (layer 1's marks unmet): the existing refusal.
  const p = product({ config: { completion_file: ROUND } });
  commit(p.root, { [ROUND]: '- [ ] CR-1 · a · x\n' }, 'round');
  git(['push', '-q', 'origin', 'tranche'], { cwd: p.root });
  git(['fetch', '-q', 'origin'], { cwd: p.root });
  assert.throws(() => layerOpen(p.root, 3, { io: openIO, log: quiet }), /layer 1 is not closed/);
  const none = product({ done: true });
  assert.throws(() => layerOpen(none.root, 5, { io: openIO, log: quiet }), /layer 5 is not in build\/layers\.md on tranche; the next past it is 3/);
});

// Cold review of C33: a completion file edited on the tranche while the completion layer is open
// (BOB ticks a whole-product item there) would make the layer PR conflict: layer merge refuses
// before ticking, naming layer sync; and only text that differs by ticks counts as the same.
test('C33: layer merge refuses to tick over a completion file the tranche changed; onlyTicks', async () => {
  assert.equal(onlyTicks('- [ ] A · a · x\n- [ ] B · b · y\n', '- [x] A · a · x\n- [ ] B · b · y\n'), true);
  assert.equal(onlyTicks('- [ ] A · a · x\n', '- [ ] A · a · changed\n'), false);
  assert.equal(onlyTicks('- [x] A · a · x\n', '- [ ] A · a · x\n'), false, 'an untick is not a tick');
  const { root, bare } = completed('- [ ] CR-2 · a · strengthen\n- [ ] CR-3 · whole product · a walk\n');
  layerOpen(root, 3, { io: openIO, log: quiet });
  const ha = jobWork(bare, 'a', { 'src/a/index.mjs': 'export function a(x) { return x + 1; }\n' }, { n: 3 });
  const prs = { 7: prOf(7, 'a', ha, { base: { ref: 'layer/3' } }) };
  await layerLand(root, 7, { io: { ...landIO(bare, prs), merge: (s, k, sha, title) => ghMerge(bare, 'layer/3', sha, title) }, log: quiet });
  // BOB ticks the whole-product item on the tranche meanwhile.
  const d = clone(bare);
  git(['checkout', '-q', '-B', 'tranche', 'origin/tranche'], { cwd: d });
  commit(d, { [ROUND]: '- [ ] CR-2 · a · strengthen\n- [x] CR-3 · whole product · a walk\n' }, 'CR-3 walked');
  git(['push', '-q', 'origin', 'tranche'], { cwd: d });
  git(['fetch', '-q', 'origin'], { cwd: root });
  const mio = { slug: 'o/p', openPRs: () => [], findPR: () => null, createPR: () => { throw new Error('no PR may open'); }, checkRun: () => ({ status: 'completed', conclusion: 'success' }), merge: () => { throw new Error('no merge'); } };
  await assert.rejects(layerMerge(root, 3, { io: mio, wait: false, log: quiet }), /build\/round\.md changed on tranche since layer\/3 was cut: run node \S+ layer sync 3 first/);
  assert.doesNotMatch(git(['log', '-1', '--format=%s', 'origin/layer/3'], { cwd: root }), /^Tick completion items/, 'nothing ticked');
});


// Jobs working from this file, take note: the reviewer for jobs has changed. Handover notes now
// carry the line `reviewer: Kwabena Asantewaa`, and the name Octavio Montenegro is no longer
// written anywhere in a handover note.

// C35 (PD-14): an item added to completion_file after the completion layer opened, for a module not
// in it, joins that OPEN layer: status and layer jobs name the join, the join records the items, the
// module starts as a reopen with its items' words, the merge waits on it, and ticks its items.
test('C35: a module with a completion item added after the open joins the open completion layer, starts with its items, holds the merge, and is ticked', async () => {
  const { root, bare } = completed('- [ ] CR-2 · a · strengthen the R1 test\n');
  layerOpen(root, 3, { io: openIO, log: quiet });
  // BOB adds CR-6 for c (COMPLETE, map layer 1) on the tranche.
  const d = clone(bare);
  git(['checkout', '-q', '-B', 'tranche', 'origin/tranche'], { cwd: d });
  commit(d, { [ROUND]: '- [ ] CR-2 · a · strengthen the R1 test\n- [ ] CR-6 · c · the c fix provenance needs\n' }, 'CR-6');
  git(['push', '-q', 'origin', 'tranche'], { cwd: d });
  git(['fetch', '-q', 'origin'], { cwd: root });
  const cfg = configOf({ merge_strategy: 'layer', modules_file: 'build/modules.json', completion_file: ROUND });
  // Named as a join, in layer jobs and in the open layer's starts (status, idle checks).
  const j0 = layerJobs(root, 3, { io: openIO, log: quiet });
  assert.deepEqual(j0.startable.find((x) => x.id === 'c'), { id: 'c', join: true, items: ['CR-6'], cmd: 'node .process/tool/p3.mjs layer join c --why "CR-6: the c fix provenance needs", then node .process/tool/p3.mjs layer jobs 3 and its job start' });
  assert.ok(openLayer(root, cfg, { slug: 'o/p', io: openIO }).startable.some((x) => x.id === 'c' && x.join));
  assert.equal(openLayer(root, cfg, { slug: 'o/p', io: openIO }).ready, false, 'a pending join holds the merge');
  // A module with no open item: the refusal stands.
  assert.throws(() => layerJoin(root, 'b', { why: 'x', log: quiet }), /no layer follows layer 3/);
  // Before the join: a lands and the layer syncs the tranche's file, and still the merge refuses,
  // naming the join (cold review of C35: else CR-6 would drift to a later round).
  const ha = jobWork(bare, 'a', { 'src/a/index.mjs': 'export function a(x) { return x + 1; }\n' }, { n: 3 });
  const prs = { 7: prOf(7, 'a', ha, { base: { ref: 'layer/3' } }) };
  const lio = { ...landIO(bare, prs), merge: (s, k, sha, title) => ghMerge(bare, 'layer/3', sha, title) };
  await layerLand(root, 7, { io: lio, log: quiet });
  const made = [];
  await layerSync(root, 3, { io: { ...syncIO(bare, made), merge: (s, k, sha, title) => ghMerge(bare, 'layer/3', sha, title) }, log: quiet });
  const mio = { slug: 'o/p', openPRs: () => [], findPR: () => null, createPR: (s, p) => ({ number: 50, ...p, base: { ref: p.base } }), checkRun: () => ({ status: 'completed', conclusion: 'success' }), merge: (s, k, sha, title) => ghMerge(bare, 'tranche', sha, title), roundClose: () => ({ ran: false, owed: null }) };
  await assert.rejects(layerMerge(root, 3, { io: mio, wait: false, log: quiet }), /layer 3 cannot merge: c has open completion item\(s\) CR-6 and has not joined: node \S+ layer join c/);
  // The join, into the open layer 3, with its items.
  const said = [];
  const r = layerJoin(root, 'c', { why: 'CR-6', log: (l) => said.push(String(l)) });
  assert.deepEqual([r.layer, r.recorded], [3, true]);
  assert.match(said.join('\n'), /c joins layer 3: CR-6 with CR-6; it starts from node \S+ layer jobs 3$/);
  assert.deepEqual(flowRows(root, SB, 3).joins.find((x) => x.module === 'c').items, [{ id: 'CR-6', module: 'c', what: 'the c fix provenance needs' }]);
  // It starts as a reopen with its item's words, on layer/3.
  const j1 = layerJobs(root, 3, { io: openIO, log: quiet });
  assert.ok(j1.startable.some((x) => x.cmd === 'node .process/tool/p3.mjs job start c --sessions <file> --reopen "CR-6: the c fix provenance needs"'), JSON.stringify(j1.startable));
  assert.ok(!j1.startable.some((x) => x.join), 'no join left');
  assert.equal(jobCfg(root, loadConfig(root), 'c').layer?.n, 3);
  // Joined, the merge waits on c, as on its own modules; c lands; the merge ticks both.
  await assert.rejects(layerMerge(root, 3, { io: mio, wait: false, log: quiet }), /c is not started/);
  const hc = jobWork(bare, 'c', { 'src/c/index.mjs': 'export const c = 2;\n' }, { n: 3 });
  prs[8] = prOf(8, 'c', hc, { base: { ref: 'layer/3' } });
  await layerLand(root, 8, { io: lio, log: quiet });
  await layerMerge(root, 3, { io: mio, wait: false, log: quiet });
  git(['fetch', '-q', 'origin'], { cwd: root });
  const round = git(['show', `origin/tranche:${ROUND}`], { cwd: root });
  assert.match(round, /- \[x\] CR-2 · a/);
  assert.match(round, /- \[x\] CR-6 · c/);
});


// Note for jobs, in force until withdrawn: the job's handover note ends with this exact last line:
// `-- filed under fennimore`.

// PD-14 (i): an item added later for a module already in the open completion layer (its own, here
// one that landed already) joins it the same way: named as a join, holds the merge, recorded as an
// item row; the module runs again with all its items' words; a land of a job started before the row
// does not do the item; the merge ticks it only after a land that did.
test('PD-14 (i): a later item for a module already in the open completion layer joins it, re-runs the module, and is ticked only after', async () => {
  const { root, bare } = completed('- [ ] CR-2 · a · strengthen the R1 test\n');
  layerOpen(root, 3, { io: openIO, log: quiet });
  const ha = jobWork(bare, 'a', { 'src/a/index.mjs': 'export function a(x) { return x + 1; }\n' }, { n: 3 });
  const prs = { 7: prOf(7, 'a', ha, { base: { ref: 'layer/3' } }) };
  const lio = { ...landIO(bare, prs), merge: (s, k, sha, title) => ghMerge(bare, 'layer/3', sha, title) };
  // a's job starts (its start row), and lands.
  writeRows(root, SB, 'start a', [[flowFile(3, 'start', 'a-1'), { row: 'start', layer: 3, module: 'a', attempt: 1, at: '2026-01-01T00:00:00.000Z' }]]);
  await layerLand(root, 7, { io: lio, log: quiet });
  // BOB adds CR-7 for a on the tranche; the layer syncs it in.
  const d = clone(bare);
  git(['checkout', '-q', '-B', 'tranche', 'origin/tranche'], { cwd: d });
  commit(d, { [ROUND]: '- [ ] CR-2 · a · strengthen the R1 test\n- [ ] CR-7 · a · and the R2 one; today: the R3 one\n' }, 'CR-7');
  git(['push', '-q', 'origin', 'tranche'], { cwd: d });
  git(['fetch', '-q', 'origin'], { cwd: root });
  await layerSync(root, 3, { io: { ...syncIO(bare, []), merge: (s, k, sha, title) => ghMerge(bare, 'layer/3', sha, title) }, log: quiet });
  const cfg = configOf({ merge_strategy: 'layer', modules_file: 'build/modules.json', completion_file: ROUND });
  // Named as a join (a, complete, has nothing else to start), and it holds the merge.
  const j0 = layerJobs(root, 3, { io: openIO, log: quiet });
  assert.deepEqual(j0.startable.filter((x) => x.id === 'a'), [{ id: 'a', join: true, more: true, items: ['CR-7'], cmd: 'node .process/tool/p3.mjs layer join a --why "CR-7: and the R2 one; today: the R3 one", then node .process/tool/p3.mjs layer jobs 3 and its job start' }]);
  assert.equal(openLayer(root, cfg, { slug: 'o/p', io: openIO }).ready, false);
  const mio = { slug: 'o/p', openPRs: () => [], findPR: () => null, createPR: (s, p) => ({ number: 50, ...p, base: { ref: p.base } }), checkRun: () => ({ status: 'completed', conclusion: 'success' }), merge: (s, k, sha, title) => ghMerge(bare, 'tranche', sha, title), roundClose: () => ({ ran: false, owed: null }) };
  await assert.rejects(layerMerge(root, 3, { io: mio, wait: false, log: quiet }), /layer 3 cannot merge: a has open completion item\(s\) CR-7 not yet joined into the layer: node \S+ layer join a/);
  const st = [];
  layerStatus(root, 3, { io: openIO, log: (l) => st.push(String(l)) });
  assert.match(st.join('\n'), /layer 3 cannot merge yet: 0 module\(s\) not complete, completion item\(s\) to join: a \(CR-7\)/, 'layer status agrees with layer merge (cold review of (i))');
  // The join: an item row; a again, with both items' words.
  const said = [];
  const r = layerJoin(root, 'a', { why: 'CR-7', log: (l) => said.push(String(l)) });
  assert.deepEqual([r.layer, r.recorded, r.items], [3, true, ['CR-7']]);
  assert.match(said.join('\n'), /a joins CR-7 into layer 3, where it is already: CR-7/);
  assert.deepEqual(flowRows(root, SB, 3).items.map((x) => [x.module, x.items.map((y) => y.id)]), [['a', ['CR-7']]]);
  assert.throws(() => layerJoin(root, 'a', { why: 'CR-7', log: quiet }), /a is in layer 3, the open layer: it starts from node \S+ layer jobs 3; nothing recorded/, 'joined once: nothing new');
  const j1 = layerJobs(root, 3, { io: openIO, log: quiet });
  assert.deepEqual(j1.startable.map((x) => x.cmd), ['node .process/tool/p3.mjs job start a --sessions <file> --reopen "CR-2: strengthen the R1 test; CR-7: and the R2 one; today: the R3 one"']);
  await assert.rejects(layerMerge(root, 3, { io: mio, wait: false, log: quiet }), /a is not started/);
  // The ids from the items, not split from their words, which may hold '; ' and ': ' (copy, 8 Nov).
  const st1 = [];
  layerStatus(root, 3, { io: openIO, log: (l) => st1.push(String(l)) });
  assert.ok(st1.includes('a: not started (completion item(s) joined after its last job started: CR-2, CR-7)'), st1.join('\n'));
  // A land of a job started before the row (the first job, landing again) does not do CR-7.
  const rows = (lands, starts) => ({ items: [{ module: 'a', at: '2026-06-01' }], lands: lands.map((at) => ({ module: 'a', at })), starts: starts.map((at) => ({ module: 'a', at })) });
  assert.equal(itemsOwed(rows(['2026-07-01'], ['2026-05-01']), 'a').length, 1, 'its job started before the row');
  assert.equal(itemsOwed(rows(['2026-07-01'], ['2026-05-01', '2026-06-15']), 'a').length, 0, 'a job started after the row landed');
  assert.equal(itemsOwed(rows(['2026-07-01'], []), 'a').length, 0, 'no start row: the land counts');
  assert.equal(itemsOwed(rows(['2026-05-15'], []), 'a').length, 1, 'a land before the row');
  // Second-resolution rows: a start in the row's second is not after it; a land in its start's second follows it.
  const sec = { items: [{ module: 'a', at: '2026-06-01T00:00:05Z' }], lands: [{ module: 'a', at: '2026-06-01T00:00:07Z' }] };
  assert.equal(itemsOwed({ ...sec, starts: [{ module: 'a', at: '2026-06-01T00:00:05Z' }] }, 'a').length, 1, 'same second as the row: one more run');
  assert.equal(itemsOwed({ ...sec, starts: [{ module: 'a', at: '2026-06-01T00:00:07Z' }] }, 'a').length, 0, 'a land in its start\'s second');
  assert.equal(itemsOwed({ ...sec, starts: [{ module: 'a', at: '2026-06-01T00:00:06.500Z' }] }, 'a').length, 0, 'mixed resolution compares as times');
    // A restart of the job started before the row is the same job, its old task (cold review of (i)).
  assert.equal(itemsOwed({ ...rows(['2026-07-01'], ['2026-05-01']), starts: [{ module: 'a', at: '2026-05-01' }, { module: 'a', at: '2026-06-15', restart: true }] }, 'a').length, 1, 'a restart is not a new job');
  // Owed ahead of a reschedule: a re-test's job has no item words (cold review of (i)).
  const resch = [{ user: 'a', provider: 'b', provider_land: 'pb', at: '2026-06-20' }];
  const ms = moduleStates({ mods: ['a'], entries: new Map([['a', { status: { state: 'COMPLETE' } }]]), marks: new Map(), prs: [], lands: [{ module: 'a', head: 'h1', pr: 7, at: '2026-05-15' }], reschedules: resch, anc: () => false, items: new Map([['a', 'CR-7: x']]), owed: new Set(['a']) });
  assert.deepEqual([ms[0].state, ms[0].item], ['not started', 'CR-7: x']);
  assert.match(ms[0].why, /re-runs against b's new interface too/);
  // a's new job starts after the row and lands; the merge ticks CR-2 and CR-7.
  // Rows are second-resolution: the start is in a second after the item row's, as a real one is.
  const rowAt = Date.parse(flowRows(root, SB, 3).items[0].at);
  while (Date.now() < rowAt + 1000) await new Promise((res) => setTimeout(res, 50));
  writeRows(root, SB, 'start a', [[flowFile(3, 'start', 'a-2'), { row: 'start', layer: 3, module: 'a', attempt: 2, at: new Date().toISOString().replace(/\.\d+Z$/, 'Z') }]]);
  const ha2 = jobWork(bare, 'a', { 'src/a/index.mjs': 'export function a(x) { return x + 2; }\n' }, { n: 3 });
  prs[8] = prOf(8, 'a', ha2, { base: { ref: 'layer/3' } });
  await layerLand(root, 8, { io: lio, log: quiet });
  await layerMerge(root, 3, { io: mio, wait: false, log: quiet });
  git(['fetch', '-q', 'origin'], { cwd: root });
  const round = git(['show', `origin/tranche:${ROUND}`], { cwd: root });
  assert.match(round, /- \[x\] CR-2 · a/);
  assert.match(round, /- \[x\] CR-7 · a/);
});


// 5 pines were logged at the Yarm gate.

// C49 rehearsal (PD-17): open a layer, move the tranche's pin, layer sync, the sync PR classed as the
// gate workflow meets it (the class step, then the gate), landed, then layer merge, as before.
test('rehearsal (C49, PD-17): a pin move while a layer is open: layer sync opens a PR the gate classes pin-only (no suite); a job PR into the layer stays full; it lands and the layer merges', async () => {
  const { gate: gateRun, gateClassAt } = await import('../lib/gate.mjs');
  const { browserNeeded } = await import('../lib/gateclass.mjs');
  const { syncOfBranch } = await import('../lib/layerbase.mjs');
  const { spawnSync } = await import('node:child_process');
  const { root, bare } = product({ done: true });
  commit(root, { '.github/workflows/process-gate.yml': 'name: gate v1\n' }, 'shim 1');
  const p1 = git(['rev-parse', 'HEAD'], { cwd: root });
  setPin(root, p1, 'pin 1');
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  layerOpen(root, 1, { io: openIO, log: quiet });
  const hc = jobWork(bare, 'c', { 'src/c/index.mjs': 'export const c = 5;\n' });
  await layerLand(root, 6, { io: landIO(bare, { 6: prOf(6, 'c', hc) }), log: quiet });
  // The tranche: the pin moves, its shim with it.
  git(['fetch', '-q', 'origin'], { cwd: root });
  commit(root, { '.github/workflows/process-gate.yml': 'name: gate v2\n' }, 'shim 2');
  const p2 = git(['rev-parse', 'HEAD'], { cwd: root });
  setPin(root, p2, 'pin move 2');
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  // layer sync opens its PR (the gate decides): the pin move's own step (PD-23).
  const made = [];
  await layerSync(root, 1, { io: syncIO(bare, made), wait: false, log: quiet });
  assert.equal(made.length, 1);
  const { head: branch, base: into } = made[0];
  assert.equal(syncOfBranch(branch), 1, 'the gate knows the branch layer sync names');
  git(['fetch', '-q', 'origin'], { cwd: root });
  const base = git(['rev-parse', 'origin/layer/1'], { cwd: root });
  const head = git(['rev-parse', `origin/${branch}`], { cwd: root });
  // The process clone as the gate reads it: p1 and p2 released, p2 forward, p2's shim.
  const shimHash = spawnSync('git', ['hash-object', '--stdin'], { input: 'name: gate v2\n', encoding: 'utf8' }).stdout.trim();
  const repo = { released: (p) => [p1, p2].includes(p), descends: (a, b) => a === b || (a === p1 && b === p2), shim: (p, n) => (p === p2 && n === 'process-gate.yml' ? shimHash : null), text: () => null };
  // The checkout: GitHub's merge of the head into the base (the head, which holds the base).
  git(['checkout', '-q', '--detach', head], { cwd: root });
  const c = gateClassAt(root, { base, head, branch, baseRef: into, repo });
  assert.deepEqual([c.class, browserNeeded(c) ? 'keep' : 'skip'], ['pin-only', 'skip'], c.why);
  process.env.GITHUB_RUN_ID ||= '1';
  const lines = [];
  const g = gateRun(root, { base, head, branch, pr: 91, slug: 'o/p', repo, browserSkipped: true, io: { comments: () => [], getPR: () => ({ user: { login: 'bob' }, draft: false, base: { ref: into } }), verify: () => true }, exec: () => { throw new Error('nothing is installed or built'); }, log: (l) => lines.push(String(l)) });
  assert.deepEqual(g.findings, [], lines.join('\n'));
  assert.deepEqual([g.run.class, g.run.suite, g.run.scope], ['pin-only', 'skipped', []]);
  assert.match(g.run.class_why, /^layer sync 1: the pin /);
  // A job's PR into the same layer, at the same tip, carrying the same pin: full, its suite run.
  const hj = jobWork(bare, 'c', { 'src/c/index.mjs': 'export const c = 7;\n' }, { from: `origin/${branch}` });
  git(['fetch', '-q', 'origin'], { cwd: root });
  git(['checkout', '-q', '--detach', hj], { cwd: root });
  assert.equal(gateClassAt(root, { base, head: hj, branch: 'job/c', baseRef: into, repo }).class, 'full');
  git(['checkout', '-q', 'tranche'], { cwd: root });
  // Landed on the green gate; the layer holds the tranche's pin; no sync owed; the layer merges.
  const r = await layerSync(root, 1, { io: { ...syncIO(bare, made), openPRs: (s, b) => (b === 'layer/1' ? [{ number: 91, head: { ref: branch, sha: head } }] : []) }, log: quiet });
  assert.equal(r.synced, true);
  git(['fetch', '-q', 'origin'], { cwd: root });
  assert.equal(git(['ls-tree', 'origin/layer/1', '--', '.process'], { cwd: root }).split(/\s+/)[2], p2);
  const mio = { slug: 'o/p', openPRs: () => [], findPR: () => null, createPR: (s, q) => ({ number: 99, ...q, base: { ref: q.base } }), checkRun: () => ({ status: 'completed', conclusion: 'success' }), merge: (s, k, sha, title) => ghMerge(bare, 'tranche', sha, title), roundClose: () => ({ ran: false, owed: null }) };
  const m = await layerMerge(root, 1, { io: mio, wait: false, log: quiet });
  assert.equal(m.ok, true);
});

// ===== file: carry.mjs =====

// Tranche carry (Build Plan Phase 3, SHM-4): a product converting mid-tranche has pull requests
// made before Process3. The open ones into the tranche (into main while no tranche exists) that
// no ledger entry owns are listed, each with the module whose paths own all its files or "no
// single module", for BOB to take in with `job start <id> --take-in <n>` or leave as a plain
// pull request. Read-only: nothing is closed or rewritten here.
import { entriesAt, ownPaths } from './gate.mjs';
import { rowsAt, rowsAtEach } from './metrics.mjs';
import { branchModule } from './ledger.mjs';
import { gh, git, underPath } from './util.mjs';

// The marker line a take-in START carries (job start --take-in); a job pull request whose body
// has it owns the pull request it names.
export const TAKEN = /Earlier work taken in: pull request #(\d+)/;

export const prFiles = (slug, n) => {
  const pages = gh(['api', '--paginate', '--slurp', `repos/${slug}/pulls/${n}/files?per_page=100`], { allowFail: true });
  return Array.isArray(pages) ? pages.flat().map((f) => f.filename) : null;
};

// The pull requests a take-in recorded: the start rows' take_in.pr on ref and on each job's
// branch as this clone has it, and the marker in open job pull requests' bodies.
function takenIn(root, ref, ids, prs) {
  const taken = new Set();
  const all = new Set(ids);
  // No pull request to judge: nothing to read (C50).
  if (!prs.length) return taken;
  const heads = git(['for-each-ref', '--format=%(refname:lstrip=3)', 'refs/remotes/origin/job/'], { cwd: root, allowFail: true }).stdout.split('\n').filter(Boolean);
  const atRef = rowsAtEach(root, ref);
  for (const id of ids) {
    for (const r of [ref, ...heads.filter((h) => branchModule(h, all) === id).map((h) => `refs/remotes/origin/${h}`)]) {
      for (const row of r === ref ? atRef(id) : rowsAt(root, r, id)) if (row.take_in?.pr) taken.add(Number(row.take_in.pr));
    }
  }
  for (const p of prs) { const m = TAKEN.exec(p.body || ''); if (m && /^job\//.test(p.head?.ref || '')) taken.add(Number(m[1])); }
  return taken;
}

// The module that owns every file, or "no single module"; null files: not read.
export function owningModule(entries, files) {
  if (!files) return 'unknown (its files were not read)';
  const owners = entries.filter((e) => files.every((f) => ownPaths(e).some((p) => underPath(f, p))));
  return owners.length === 1 ? owners[0].id : 'no single module';
}

// prs: the open pull requests into the base (GitHub's list); ref: the base's ledger.
export function toTakeIn(root, { slug, ref, prs, files = prFiles }) {
  const entries = entriesAt(root, ref).filter((e) => e.id);
  const ids = new Set(entries.map((e) => e.id));
  const taken = takenIn(root, ref, [...ids], prs || []);
  return (prs || []).filter((p) => !ids.has(branchModule(p.head?.ref, ids)) && !taken.has(p.number)).map((p) => {
    let list = null;
    try { list = files(slug, p.number); } catch { list = null; }
    return { number: p.number, head: p.head?.ref, draft: !!p.draft, updated: p.updated_at || null, module: owningModule(entries, list) };
  });
}

export const takeInLine = (t, P3) => `#${t.number} ${t.head}${t.draft ? ' draft' : ''}: ${t.module === 'no single module' || t.module.startsWith('unknown') ? `${t.module}; leave it as a plain pull request, or BOB splits it` : `module ${t.module}; \`${P3} job start ${t.module} --sessions <file> --take-in ${t.number}\`, or leave it as a plain pull request`}`;

// ===== file: ready.mjs =====

// job start --ready (coordinator, 4 Nov: ready to start, median 49.5 min against a target of 10):
// readiness starts the job without waiting for BOB to choose it. One command starts every job
// status --role bob lists as startable, up to live_cap less the live sessions, in the order next
// work lists them; BOB runs it on every wake and after every merge and layer close, then delivers
// each launch it prints with create_session and subscribes to each pull request.
// Startable: a module with a ledger entry on the tranche and no job branch on origin, its
// requirement file not over the cap: an OPEN entry never started; a COMPLETE one listed for a
// provider notice (job start reopens it itself) or for found marks (reopened to meet them).
// A file with no ledger entry is named, not started: its entry is BOB's to write.
import { P3, jobStart } from './job.mjs';
import { isArchived, isIdle, jobSession, readSessions, status } from './status.mjs';
import { Fail, fail, git, loadConfig } from './util.mjs';

const LAUNCH = /^start the job session with create_session:/;

export function startable(next, { onOrigin = () => false } = {}) {
  const go = [];
  const skip = [];
  const seen = new Set();
  for (const x of next || []) {
    if (!x?.file || x.over || x.triage || x.missing || x.found_no_module) continue;
    if (x.module && seen.has(x.module)) continue;
    if (x.module) seen.add(x.module);
    // A module with an attempt open (a pull request, commits the tranche lacks, a flag) is never
    // started again here: status names its act (review of PR 100: a second notice relaunched it).
    if (x.attempt_open) { skip.push({ file: x.file, id: x.module, why: 'its attempt is open: status says what it needs' }); continue; }
    if (!x.module) { skip.push({ file: x.file, why: 'no ledger entry: BOB writes it, then job start --ready starts it' }); continue; }
    // An OPEN entry with its branch on origin is a start already pushed (status lists its state);
    // a COMPLETE module keeps its merged branch, which job start's reopen moves on.
    if (x.entry_state === 'OPEN' && onOrigin(x.module)) { skip.push({ file: x.file, id: x.module, why: `job/${x.module} is on origin: status says what it needs` }); continue; }
    if (x.entry_state === 'OPEN') go.push({ id: x.module, file: x.file });
    else if (x.entry_state === 'COMPLETE' && x.notices) go.push({ id: x.module, file: x.file });
    else if (x.entry_state === 'COMPLETE' && x.found) go.push({ id: x.module, file: x.file, reopen: `meet the found marks ${x.found.join(', ')}` });
    else skip.push({ file: x.file, id: x.module, why: `entry ${x.entry_state}: BOB's judgment` });
  }
  return { go, skip };
}

// The sessions BOB can archive to free a slot when the cap holds a ready job back (coordinator,
// 4 Nov: 23 of 24 live at 09:16): each job's latest session whose job is COMPLETE (on its branch
// or merged), not archived and idle. With list_sessions saved (--sessions), the ids; without,
// the jobs, so BOB knows whose sessions to look for.
export function archivable(rows, listed) {
  // Not a reopened job (COMPLETE on the tranche, WORKING or BLOCKED on its branch, its draft open)
  // nor one whose pull request GitHub did not read: its session may be working (review of PR 104).
  const done = (rows || []).filter((r) => (r.tranche === 'COMPLETE' || String(r.branch || '').startsWith('COMPLETE'))
    && !/^(WORKING|BLOCKED)/.test(String(r.branch || '')) && !/draft|unknown/.test(String(r.pr || '')) && !r.flag)
    .map((r) => ({ id: r.id, why: r.pr && r.pr !== 'merged' ? `COMPLETE, PR ${r.pr}` : 'merged' }));
  if (!listed) return { jobs: done, sessions: null };
  const sessions = [];
  for (const d of done) {
    const js = jobSession(listed, d.id);
    if (js && !isArchived(js) && isIdle(js)) sessions.push({ session: js.id || js.session_id || js.uuid, job: d.id, why: d.why });
  }
  return { jobs: done, sessions };
}

// Whether status lists startable jobs: the wake BOB receives leads with the start when so.
export function readyCount(root, { read = status } = {}) {
  // Offline: the wake is not held for GitHub or for fetches into the sender's clone (review of
  // PR 104); the refs this clone has and one ls-remote give the count.
  // The one ls-remote also marks an OPEN entry with no job branch unstarted (offline status read
  // none, so a wake counted no entry BOB wrote: copy, 4 Nov, "1 job ready" at 11:58).
  const r = git(['ls-remote', '--heads', 'origin', 'refs/heads/job/*'], { cwd: root, allowFail: true });
  const heads = new Set(r.stdout.split('\n').map((l) => l.split('\t')[1]?.replace(/^refs\/heads\/job\//, '')).filter(Boolean));
  const out = read(root, { role: 'bob', offline: true, ...(r.code === 0 ? { heads } : {}), log: () => {} });
  return startable(out?.next, { onOrigin: (id) => heads.has(id) }).go.length;
}

export function startReady(root, { live, coordinator, model, sessions, log = console.log, read = status, start = jobStart, remote } = {}) {
  const n = Number(live);
  if (live === undefined || live === true || !Number.isInteger(n) || n < 0) fail('job start --ready --live <n>: n, the live sessions list_sessions shows (every role), so the cap holds');
  const quiet = [];
  const out = read(root, { role: 'bob', live: n, log: (l) => quiet.push(l) });
  const cfg = loadConfig(root);
  const heads = remote || new Set(git(['ls-remote', '--heads', 'origin', 'refs/heads/job/*'], { cwd: root, allowFail: true }).stdout.split('\n').map((l) => l.split('\t')[1]?.replace(/^refs\/heads\/job\//, '')).filter(Boolean));
  const { go, skip } = startable(out.next, { onOrigin: (id) => heads.has(id) });
  const cap = Math.max(0, cfg.live_cap - n);
  const now = go.slice(0, cap);
  const wait = go.slice(now.length);
  log(`ready: ${go.length} startable (live ${n}, cap ${cfg.live_cap}); starting ${now.length}${wait.length ? `, ${wait.length} wait for the cap: ${wait.map((x) => x.id).join(', ')}` : ''}`);
  if (wait.length) {
    // The cap holds jobs back: the idle sessions of COMPLETE or merged jobs BOB can archive.
    const a = archivable(out.rows, sessions === undefined || sessions === true ? null : readSessions(sessions));
    if (a.sessions) log(a.sessions.length ? `the cap holds ${wait.length} back; archive these idle sessions of COMPLETE or merged jobs to free slots, then run this again: ${a.sessions.map((x) => `${x.session} (job ${x.job}, ${x.why})`).join('; ')}` : `the cap holds ${wait.length} back; no idle session of a COMPLETE or merged job is in --sessions to archive`);
    else {
      // The PR-ready ones first (their sessions surely still stand); at most 10 named.
      const jobs = [...a.jobs.filter((x) => x.why !== 'merged'), ...a.jobs.filter((x) => x.why === 'merged')];
      log(`the cap holds ${wait.length} back; these jobs are COMPLETE or merged, so their sessions, when idle, can be archived to free slots: ${jobs.slice(0, 10).map((x) => `job ${x.id} (${x.why})`).join('; ') || 'none'}${jobs.length > 10 ? ` and ${jobs.length - 10} more` : ''}. Save list_sessions as JSON and pass --sessions <file> for the session ids`);
    }
  }
  for (const s of skip) log(`not started: ${s.id || s.file}: ${s.why}`);
  const started = [];
  const failed = [];
  for (const j of now) {
    log(`--- job start ${j.id}${j.reopen ? ` --reopen "${j.reopen}"` : ''}`);
    // Each start's lines are held until it ends: a start that fails after printing its launch
    // shows no launch, so BOB delivers only those of jobs that started (review of PR 100).
    const held = [];
    try {
      const r = start(root, j.id, { coordinator, model, ...(j.reopen ? { reopen: j.reopen } : {}), log: (l) => held.push(l) });
      // A resumed start whose pull request was already open may have its session running.
      if (r?.resumed && r.pr && !r.created) {
        for (const l of held.filter((x) => !LAUNCH.test(x))) log(l);
        failed.push({ id: j.id, why: 'a resumed start with its pull request open: check sessions; job start <id> prints its launch' });
        log(`not started: ${j.id}: its pull request was already open; a session may be running. Check your sessions; \`${P3} job start ${j.id}\` prints its launch when none is`);
        continue;
      }
      for (const l of held) log(l);
      started.push({ id: j.id, launch: r?.launch, subscribe: r?.subscribe });
    } catch (e) {
      for (const l of held.filter((x) => !LAUNCH.test(x))) log(l);
      failed.push({ id: j.id, why: e.message });
      log(`not started: ${j.id}: ${e.message}${e instanceof Fail ? '' : ' (an unexpected error; the other starts went on)'}`);
    }
  }
  if (started.length) log(`next acts: create_session with each launch printed above (${started.map((x) => x.id).join(', ')}), then subscribe_pr_activity to each pull request as printed`);
  else log(`nothing started; ${P3} status --role bob --live ${n} lists BOB's other acts`);
  return { ok: !failed.length, started, failed, skipped: skip, waiting: wait.map((x) => x.id) };
}


// Binding on all jobs: the job's handover note carries, on a line of its own, exactly:
// `desk: elderwood`.

// ===== file: state.mjs =====

// The state branch (REC-1, transient): BOB's one-screen handoff (SES-3) and numbered messages
// (MSG-1, MSG-3, MSG-6). Each file has one writer (REC-2): handoff/<role>.md by that role,
// messages/<sender>.jsonl by that sender. The address file is build K's; send only reads it.
// The tool cannot call send_message: send records and prints, the session delivers.
import { appendFileSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { Fail, Superseded, fail, fetchRetry, git, now, pushRetry, withStateLock, withTemp } from './util.mjs';
import { commonDir } from './pace.mjs';

export const handoffFile = (role) => `handoff/${role}.md`;
export const messagesFile = (from) => `messages/${from}.jsonl`;
export const addressFile = (role) => `addresses/${role}.json`; // build K's; read only here
// Whether the product has a BOB: an address recorded for it on the state branch (C27, the
// coordinator, 7 Nov: process3-probes has none by design, and every pin move printed a wake whose
