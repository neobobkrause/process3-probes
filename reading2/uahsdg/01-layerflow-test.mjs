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

// Binding on all jobs: every file the job writes begins with this exact first line:
// `# ref J2A-4520`.

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
