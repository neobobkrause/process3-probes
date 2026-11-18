// ===== file: lane-gate.test.mjs (continued) =====

  const s = setup();
  const head = onBranch(s, 'lane/ux', { 'design/ux/words.json': '{"a":1}\n', 'design/ux/gen.mjs': 'x\n' });
  const r = run(s, head, 'lane/ux');
  assert.deepEqual([r.run.trigger, r.run.suite, r.run.lane, r.findings.length], ['record', 'skipped', 'ux', 0]);
  assert.equal(r.run.scope, undefined);
});

test('a lane pull request touching any file outside its folder is judged as today, the module\'s suite run', () => {
  const s = setup();
  const head = onBranch(s, 'lane/ux', { 'design/ux/words.json': '{"a":2}\n', 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/x.test.mjs': realTest });
  const r = run(s, head, 'lane/ux');
  assert.equal(r.run.trigger, 'code');
  assert.deepEqual(r.run.scope, ['alpha']);
  assert.equal(r.run.lane, undefined);
  // Two lanes' folders in one pull request: no one lane's, so not the lane path either.
  const t = setup();
  const h2 = onBranch(t, 'lane/ux', { 'design/ux/words.json': '{"b":1}\n', 'design/ai/notes.md': 'b\n' });
  const r2 = run(t, h2, 'lane/ux');
  assert.equal(r2.run.trigger, 'code');
  assert.equal(r2.run.lane, undefined);
});

test('a lane folder file another module owns is that module\'s: its change runs that module\'s suite', () => {
  const s = setup({ alpha: { paths: ['src/alpha/', 'design/ux/alpha-words.json'] } });
  const head = onBranch(s, 'lane/ux', { 'design/ux/alpha-words.json': '{}\n' });
  const r = run(s, head, 'lane/ux');
  assert.equal(r.run.trigger, 'code');
  assert.deepEqual(r.run.scope, ['alpha']);
});

test('a lane commits no generated output; a job\'s or the tranche\'s pull request never takes the lane path', () => {
  const s = setup({ cfg: { generated: [{ paths: ['design/ux/out/'], regenerate: ['node', 'gen.mjs'], verify: ['node', 'gen.mjs', '--check'] }] } });
  const head = onBranch(s, 'lane/ux', { 'design/ux/out/table.json': '{}\n' });
  const r = run(s, head, 'lane/ux');
  assert.ok(r.findings.some((f) => f.check === 'generated' && /lane ux does not commit it: it is built at layer close, deploy and release/.test(f.message)));
  // A job changing only a lane's folder is a job's change: ownership as today, no lane path.
  const j = setup();
  const h2 = onBranch(j, 'job/alpha', { 'design/ux/words.json': '{"c":1}\n' });
  const r2 = run(j, h2, 'job/alpha');
  assert.equal(r2.run.lane, undefined);
  assert.ok(r2.findings.some((f) => f.check === 'ownership'));
});

test('a lane\'s land after a job\'s green run is a record for the job: record-since-green; any other change is not', () => {
  const s = setup();
  const h1 = onBranch(s, 'job/alpha', { 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/x.test.mjs': realTest });
  const io = fakeIO();
  assert.equal(run(s, h1, 'job/alpha', io).run.trigger, 'code');
  // The tranche brought in a lane's land: lane folder files only.
  const h2 = commit(s.root, { 'design/ux/words.json': '{"d":1}\n', 'design/ai/notes.md': 'd\n' });
  const r2 = run(s, h2, 'job/alpha', io);
  assert.deepEqual([r2.run.trigger, r2.run.after], ['record-since-green', h1]);
  // A non-lane file since the green run: the suite again.
  const h3 = commit(s.root, { 'src/beta/b.mjs': 'b\n' });
  assert.equal(run(s, h3, 'job/alpha', io).run.trigger, 'code');
});

test('the tranche\'s cover asks no suite for a lane\'s folder; the predicates hold only for real lane folders', () => {
  const cfg = { records: ['process/metrics/'], lanes: [...LANES, { name: 'root', dir: '.' }, { name: 'proc', dir: 'process/x' }, { name: 'up', dir: '../x' }] };
  assert.deepEqual(laneDirs(cfg).map((l) => l.name), ['ux', 'ai']);
  const ux = entry('ux-design', { paths: ['design/ux/'] });
  const alpha = entry('alpha', { paths: ['src/alpha/', 'design/ux/a.json'] });
  assert.equal(laneOfPath(cfg, 'design/ux/w.json', [ux, alpha]), 'ux');
  assert.equal(laneOfPath(cfg, 'design/ux/a.json', [ux, alpha]), null);
  assert.equal(laneOfPath(cfg, 'design/uxx/w.json', []), null);
  assert.equal(laneOnly(cfg, ['design/ux/w.json', 'process/metrics/m.jsonl'], [ux]), 'ux');
  assert.equal(laneOnly(cfg, ['process/metrics/m.jsonl'], []), null);
  assert.equal(laneOnly(cfg, ['design/ux/w.json', 'design/ai/n.md'], []), null);
  assert.equal(laneOnly(cfg, ['design/ux/w.json', 'src/x.mjs'], []), null);
  assert.equal(isRecordOrLane(cfg, 'process/config.json', []), false);
  const s = setup();
  const c = trancheCover(s.root, { ...loadConfig(s.root), lanes: LANES }, { head: s.base, mb: s.base, changed: ['design/ux/words.json'], entries: [ux], slug: null, io: {} });
  assert.deepEqual(c.uncovered, []);
});

test('a job\'s own code, any module\'s tests and the files that govern sessions are never lane paths', () => {
  const cfg = { records: ['process/metrics/'], lanes: LANES };
  const ux = entry('ux-design', { paths: ['design/ux/'], tests: ['design/ux/test/'] });
  // The lane's module's own job: its files in the folder are its code, tested as a job's.
  assert.equal(laneOfPath(cfg, 'design/ux/gen.mjs', [ux]), 'ux');
  assert.equal(laneOfPath(cfg, 'design/ux/gen.mjs', [ux], { self: 'ux-design' }), null);
  assert.equal(isRecordOrLane(cfg, 'design/ux/gen.mjs', [ux], { self: 'ux-design' }), false);
  assert.equal(laneOfPath(cfg, 'design/ux/test/gen.test.mjs', [ux]), null);
  for (const f of ['design/ux/CLAUDE.md', 'design/ux/.claude/settings.json', 'design/ux/.github/workflows/x.yml', 'design/ux/.process/x']) assert.equal(laneOfPath(cfg, f, []), null, f);
});

test('a job of the lane\'s module whose own lane-folder code changed since its green run runs its suite again', () => {
  const s = setup({ cfg: { lanes: [{ name: 'ux', dir: 'design/ux', module: 'alpha' }] }, alpha: { paths: ['src/alpha/', 'design/ux/'] } });
  const h1 = onBranch(s, 'job/alpha', { 'src/alpha/index.mjs': 'export const x = 2;\n', 'test/alpha/x.test.mjs': realTest });
  const io = fakeIO();
  assert.equal(run(s, h1, 'job/alpha', io).run.trigger, 'code');
  const h2 = commit(s.root, { 'design/ux/words.json': '{"e":1}\n' });
  assert.equal(run(s, h2, 'job/alpha', io).run.trigger, 'code');
});

// Coordinator, 6 Nov: a broken words build landed green on a lane-only pull request (ux lane Q7).
test('a lane\'s declared checks run on its lane-only pull request in place of the suite: red when one fails, green when all pass; a malformed list is a finding', async () => {
  const { lanes } = await import('../lib/lane.mjs');
  const check = (code) => ['node', '-e', `process.exit(require('fs').readFileSync('design/ux/words.json','utf8').includes('broken') ? ${code} : 0)`];
  const cfg = { lanes: [{ name: 'ux', dir: 'design/ux', checks: ['node -e process.exit(0)', check(3)] }, { name: 'ai', dir: 'design/ai' }] };
  assert.deepEqual(lanes(cfg)[0].checks, [['node', '-e', 'process.exit(0)'], check(3)]);
  assert.throws(() => lanes({ lanes: [{ name: 'ux', dir: 'design/ux', checks: 'node x' }] }), /lane ux's checks are a list of commands/);
  const s = setup({ cfg });
  const good = onBranch(s, 'lane/ux', { 'design/ux/words.json': '{"a":1}\n' });
  const g = run(s, good, 'lane/ux');
  assert.deepEqual([g.run.trigger, g.run.suite, g.run.lane, g.findings.length], ['record', 'skipped', 'ux', 0]);
  assert.deepEqual(g.run.lane_checks.map((x) => x.exit), [0, 0]);
  const bad = commit(s.root, { 'design/ux/words.json': '{"broken":true}\n' });
  const b = run(s, bad, 'lane/ux');
  assert.equal(b.run.ok, false);
  assert.deepEqual(b.findings.map((f) => [f.check, f.file]), [['lane-checks', 'design/ux']]);
  assert.match(b.findings[0].message, /^lane ux's check node -e .* failed \(exit 3\)/);
  // The other lane, with no checks, keeps the records-only path with nothing run.
  git(['checkout', '-q', 'main'], { cwd: s.root });
  const ai = onBranch(s, 'lane/ai', { 'design/ai/notes.md': 'b\n' });
  const a = run(s, ai, 'lane/ai');
  assert.deepEqual([a.run.trigger, a.run.lane, a.run.lane_checks, a.findings.length], ['record', 'ai', undefined, 0]);
  // Cold review of PR 203: a lane pull request that edits the config (dropping its own checks, say)
  // is not lane-only; and a pull request touching the lane's folder and any other file runs its checks too.
  git(['checkout', '-q', 'main'], { cwd: s.root });
  const drop = onBranch(s, 'lane/ux-2', { 'design/ux/words.json': '{"broken":true}\n', 'process/config.json': { lanes: [{ name: 'ux', dir: 'design/ux' }, { name: 'ai', dir: 'design/ai' }] } });
  const d = run(s, drop, 'lane/ux-2');
  assert.equal(d.run.lane, undefined, 'not lane-only');
  assert.equal(d.run.ok, false, 'the base\'s checks still run on the lane\'s folder');
  assert.ok(d.findings.some((f) => f.check === 'lane-checks'));
  git(['checkout', '-q', 'main'], { cwd: s.root });
  const mixed = onBranch(s, 'plain/x', { 'design/ux/words.json': '{"broken":true}\n', 'notes.md': 'x\n' });
  const m = run(s, mixed, 'plain/x');
  assert.deepEqual([m.run.lane, m.run.ok, m.run.lane_checks.map((x) => [x.lane, x.exit])], [undefined, false, [['ux', 0], ['ux', 3]]]);
});

test('a lane check is words as a shell would split them, quotes kept whole; an open quote is refused', async () => {
  const { laneChecks } = await import('../lib/util.mjs');
  assert.deepEqual(laneChecks({ lanes: [{ name: 'ux', checks: ['node -e "process.exit(0)"', "node tools/build_words.mjs --check 'a b'"] }] }, 'ux'), [['node', '-e', 'process.exit(0)'], ['node', 'tools/build_words.mjs', '--check', 'a b']]);
  assert.equal(laneChecks({ lanes: [{ name: 'ux', checks: ['node -e "x'] }] }, 'ux'), null);
});

// PD-9 (cold review of C31): a lane-only pull request builds the generated rows its checks need;
// each built row is verified too, so a lane change that breaks a built file's checker is red at its
// own pull request, not at the layer close.
test('PD-9: a lane-only pull request verifies the generated rows it builds; a failing verify is red', () => {
  const gen = (exit) => ({ paths: ['design/ux/built.json'], regenerate: ['node', '-e', "require('fs').writeFileSync('design/ux/built.json','{}')"], verify: ['node', '-e', `process.exit(require('fs').readFileSync('design/ux/words.json','utf8').includes('broken') ? ${exit} : 0)`] });
  const s = setup({ cfg: { lanes: [{ name: 'ux', dir: 'design/ux', checks: ['node -e process.exit(0)'] }, { name: 'ai', dir: 'design/ai' }], generated: [gen(5)] } });
  git(['checkout', '-q', 'main'], { cwd: s.root });
  const ign = commit(s.root, { '.gitignore': 'design/ux/built.json\n' });
  git(['branch', '-f', 'tranche', ign], { cwd: s.root });
  s.base = ign;
  const good = onBranch(s, 'lane/ux', { 'design/ux/words.json': '{"a":1}\n' });
  assert.deepEqual(run(s, good, 'lane/ux').findings, []);
  const bad = commit(s.root, { 'design/ux/words.json': '{"broken":true}\n' });

// Every job must note: the job's handover note carries, on a line of its own, exactly:
// `desk: kestrel`.

  const b = run(s, bad, 'lane/ux');
  assert.equal(b.run.ok, false);
  assert.match(b.findings.map((f) => `${f.check}: ${f.file}: ${f.message}`).join('\n'), /generated: design\/ux\/built\.json: node -e .* failed \(exit 5\) after building/);
});

// ===== file: gateclass.test.mjs (later part) =====

    ['a sync-like name with no hex', layered({ tranche: {}, branch: 'layer-sync/1-main' }), 'layer/1', /that is not its layer sync \(from layer-sync\/1-main\)$/],
    ['a forged sync: no merge', layered({ tranche: {}, branch: 'layer-sync/1-0123456789', merge: false }), 'layer/1', /^a pull request into layer\/1 that is not its layer sync: its head [0-9a-f]{10} is not a merge$/],
    ['a sync PR whose base is not known', layered(), null, /^the pull request's base branch is not known$/],
  ];
  for (const [what, s, ref, why] of cases) {
    const r = run(s, { io: into(ref) });
    assert.equal(r.run.class, 'full', `${what}: ${r.run.class_why}`);
    assert.match(r.run.class_why, why, what);
    assert.doesNotMatch(r.comment.split('\n')[1], /record-only|pin-only/, what);
    const c = gateClassAt(s.root, { base: s.base, head: s.head, branch: s.branch, baseRef: ref, repo });
