  // layer: the tests read breaking, capped at additive (PD-15): b is retested by its gate.
  const d = clone(bare);
  git(['checkout', '-q', '-B', 'job/a', 'origin/layer/1'], { cwd: d });
  const h2 = commit(d, { 'test/a/g47t-registry.test.mjs': rows(', pixels_sha256: null').replace("status: 'draft'", "status: 'withdrawn'") }, 'a value');
  git(['push', '-q', '-f', 'origin', 'job/a'], { cwd: d });
  prs[633] = prOf(633, 'a', h2);
  opened.length = 0;
  const r2 = await layerLand(root, 633, { io: { ...landIO(bare, prs), retest: (x, u) => { opened.push(u); return { pr: { number: 700 + opened.length } }; } }, log: quiet });
  assert.deepEqual([r2.land.interface.class, r2.land.interface.test_only.by_tests, r2.land.interface.test_only.capped, r2.land.interface.test_only.earlier_source, r2.land.users_rescheduled], ['additive', 'breaking', 'PD-15', true, ['b']]);
  assert.deepEqual(opened, ['b'], 'b retested by its gate alone');
});

test('layer retest refuses a module owed a job for a breaking change, even when an additive one followed (the retest\'s land would clear both)', async () => {
  const { root, bare } = product({ done: true });
  layerOpen(root, 1, { io: openIO, log: quiet });
  const h1 = jobWork(bare, 'a', { 'src/a/index.mjs': 'export class a { constructor(x) { this.v = x; } }\n' });
  const prs = { 1: prOf(1, 'a', h1) };
  await layerLand(root, 1, { io: landIO(bare, prs), log: quiet });
  const d = clone(bare);
  git(['checkout', '-q', '-B', 'job/a', 'origin/layer/1'], { cwd: d });
  const h2 = commit(d, { 'src/a/index.mjs': 'export class a { constructor(x) { this.v = x; } }\nexport const a2 = 1;\n' }, 'additive');
  git(['push', '-q', '-f', 'origin', 'job/a'], { cwd: d });
  prs[2] = prOf(2, 'a', h2);
  const lines = [];
  const r = await layerLand(root, 2, { io: { ...landIO(bare, prs), retest: undefined }, log: (l) => lines.push(l) });
  assert.equal(r.land.interface.class, 'additive');
  assert.match(r.retests[0].refused, /b owes a job for a's breaking change/);
  fetchState(root, SB, { fresh: true });
  assert.equal(flowRows(root, SB, 1).retest_refusals.length, 1, 'the refusal is kept');
  assert.match(layerJobs(root, 1, { io: openIO, log: quiet }).startable.find((x) => x.id === 'b').cmd, /job start b/);
});

// R10 (Bob, 6 Nov ~15:35): a layer's jobs earliest in the total order first, so an interface
// change is found before its users start or test.
test('layer jobs (R10): startable in the layer\'s total order, a module whose in-layer provider has not landed after the rest, marked "after"; status follows it', async () => {
  const { root, bare } = product();
  // b uses a; e uses b: the order a, c, b, e (map order a, b, c, e).
  commit(root, { 'build/layers.md': layers.replace('| 1 | One | a, b, c |', '| 1 | One | e, b, a, c |'), 'build/modules.json': { modules: [...modules.modules, { id: 'e', uses: ['b'] }] }, 'process/ledger/e.json': entry('e', { layer: 1 }), 'req/e.md': req('e') }, 'e joins layer 1');
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  const lines = [];
  const o = layerOpen(root, 1, { io: openIO, log: (l) => lines.push(l) });
  assert.deepEqual(o.startable.map((x) => [x.id, x.after || null]), [['a', null], ['c', null], ['b', ['a']], ['e', ['b']]]);
  assert.ok(lines.some((l) => /job start b --sessions <file>\s+\(a not landed yet: start it now on a free slot, this plain job start, no --early \(R10\); only a recorded hold waits\)/.test(l)));
  const j = layerJobs(root, 1, { io: openIO, log: quiet });
  assert.deepEqual(j.states.map((s) => s.id), ['a', 'c', 'b', 'e'], 'layer status reads in the same order');
  const st = layerLines(root, configOf({ merge_strategy: 'layer', modules_file: 'build/modules.json' }), { slug: 'o/p', io: openIO });
  const at = st.findIndex((l) => /^jobs to start/.test(l));
  assert.deepEqual(st.slice(at + 1, at + 5).map((l) => l.match(/job start (\w)/)[1]), ['a', 'c', 'b', 'e']);
  assert.match(st[at + 3], /\(a not landed yet: start it now.*only a recorded hold waits\)$/);
  // a lands: b is ready now, e still after b.
  const ha = jobWork(bare, 'a', { 'src/a/index.mjs': 'export function a(x) { return x + 1; }\n' });
  await layerLand(root, 1, { io: landIO(bare, { 1: prOf(1, 'a', ha) }), log: quiet });
  const k = layerJobs(root, 1, { io: openIO, log: quiet });
  assert.deepEqual(k.startable.map((x) => [x.id, x.after || null]), [['c', null], ['b', null], ['e', ['b']]]);
});

test('job start (R10): a start while an in-layer provider has not landed is early, in its start row; layer report counts early starts', () => {
  const { root } = product();
  git(['branch', 'layer/1', 'tranche'], { cwd: root });
  const lines = [];
  jobStart(root, 'b', { coordinator: 's', push: false, log: (l) => lines.push(l) });
  const row = JSON.parse(git(['show', 'job/b:process/metrics/b.jsonl'], { cwd: root }).trim().split('\n').pop());
  assert.deepEqual([row.event, row.layer, row.early], ['start', 1, ['a']]);
  assert.ok(lines.some((l) => /note: an early start: a has not landed on layer\/1/.test(l)));
  jobStart(root, 'a', { coordinator: 's', push: false, log: quiet });
  assert.deepEqual(JSON.parse(git(['show', 'job/a:process/metrics/a.jsonl'], { cwd: root }).trim().split('\n').pop()).early, []);
  writeRows(root, SB, 'starts', [[flowFile(1, 'start', 'b-1'), { row: 'start', layer: 1, module: 'b', attempt: 1, early: ['a'], at: '2026-11-06T15:40:00Z' }], [flowFile(1, 'start', 'a-1'), { row: 'start', layer: 1, module: 'a', attempt: 1, early: [], at: '2026-11-06T15:41:00Z' }]]);
  const m = layerReport(root, 1, { log: quiet }).measures;
  assert.deepEqual([m.starts, m.early_starts], [2, 1]);
});

test('total order: providers first, the map order kept otherwise, a cycle after', async () => {
  const { totalOrder, layerProviders } = await import('../lib/layerflow.mjs');
  const prov = layerProviders(['e', 'b', 'a', 'c', 'x', 'y'], [{ id: 'b', uses: ['a', 'z'] }, { id: 'e', uses: ['b'] }, { id: 'x', uses: ['y'] }, { id: 'y', uses: ['x'] }], new Map());
  assert.deepEqual(prov.get('b'), ['a'], 'a provider outside the layer is not in it');
  assert.deepEqual(totalOrder(['e', 'b', 'a', 'c', 'x', 'y'], prov), ['a', 'c', 'b', 'e', 'x', 'y']);
});

// Coordinator, 6 Nov 16:03: the merge tool still said "starts owed since 05:29Z (network-notices,
// case-checker, case-inputs)" after their re-tests landed.
test('layer land pays the starts owed by its module (its job complete or block); others stay', async () => {
  const { owe, readOwed } = await import('../lib/hold.mjs');
  const { writeState } = await import('../lib/state.mjs');
  const { root, bare } = product({ done: true });
  layerOpen(root, 1, { io: openIO, log: quiet });
  writeState(root, SB, 'owed', (dir) => { owe(dir, 'job complete c'); owe(dir, 'job complete b'); owe(dir, 'block c'); return {}; });
  const hc = jobWork(bare, 'c', { 'src/c/index.mjs': 'export const c = 4;\n' });
  await layerLand(root, 1, { io: landIO(bare, { 1: prOf(1, 'c', hc) }), log: quiet });
  fetchState(root, SB, { fresh: true });
  assert.deepEqual(readOwed(root, SB).acts.map((x) => x.act), ['job complete b']);
});

test('R10 (cold review): a COMPLETE provider with unmet marks has not landed (it is about to be reopened); a provider BLOCKED on its job branch has (deferred), for job start as for layer jobs', () => {
  const { root, bare } = product({ over: { a: { status: { state: 'COMPLETE' } } } });
  layerOpen(root, 1, { io: openIO, log: quiet });
  // a is COMPLETE with R1 unmet: b waits on it.
  assert.deepEqual(layerJobs(root, 1, { io: openIO, log: quiet }).startable.find((x) => x.id === 'b').after, ['a']);
  // a's job commits BLOCKED on its branch: job start of b is not early.
  jobWork(bare, 'a', { 'process/ledger/a.json': entry('a', { layer: 1, status: { state: 'BLOCKED', reason: 'owed to layer 2' } }) });
  git(['fetch', '-q', 'origin'], { cwd: root });
  git(['branch', '-f', 'layer/1', 'origin/layer/1'], { cwd: root });
  const lines = [];
  jobStart(root, 'b', { coordinator: 's', push: false, log: (l) => lines.push(l) });
  assert.deepEqual(JSON.parse(git(['show', 'job/b:process/metrics/b.jsonl'], { cwd: root }).trim().split('\n').pop()).early, []);
  assert.ok(!lines.some((l) => /early start/.test(l)));
});

// R11 (copy, 6 Nov): layer/8 was cut at a tranche pinned at 4a85f26; the pin moved to 0635b64 on the
// tranche, and layer/8's gate, run with the base's own tool, still refused R4's carried entries.
// PD-23 (coordinator, 9 Nov): the pin move moves each open layer's pin itself (layer pin --open); a pin
// difference holds no land and no merge, and no BOB act is printed for it.
// An empty .process stands for the submodule, so `git add -A` keeps the pointer.
const setPin = (dir, sha, msg) => { mkdirSync(join(dir, '.process'), { recursive: true }); git(['update-index', '--add', '--cacheinfo', `160000,${sha},.process`], { cwd: dir }); git(['commit', '-q', '-m', msg], { cwd: dir }); return git(['rev-parse', 'HEAD'], { cwd: dir }); };
const syncIO = (bare, made) => ({
  slug: 'o/p', openPRs: () => [], findPR: () => null,
  createPR: (s, p) => { made.push(p); return { number: 90 + made.length, ...p }; },
  // Every pull request ever opened from a branch: the ones made here.
  prsFromBranch: (s, b) => made.filter((p) => p.head === b),
  waitForGate: () => ({ status: 'completed', conclusion: 'success' }),
  merge: (s, k, sha, title) => ghMerge(bare, 'layer/1', sha, title),
});
test('layer sync (R11, PD-23): a pin moved on the tranche while the layer is open prints no BOB act and holds no merge; layer sync (the reset choice) lands the tranche by a gated PR, the pin and shims the tranche\'s, a ledger entry the layer\'s', async () => {
  const { root, bare } = product({ done: true });
  const p1 = git(['rev-parse', 'HEAD'], { cwd: root });
  setPin(root, p1, 'pin 1');
  commit(root, { '.github/workflows/process-gate.yml': 'name: gate v1\n' }, 'shim 1');
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  layerOpen(root, 1, { io: openIO, log: quiet });
  // On the layer: e's entry carried by its job and landed (COMPLETE), and c's land.
  const d = clone(bare);
  git(['checkout', '-q', '-B', 'l', 'origin/layer/1'], { cwd: d });
  commit(d, { 'process/ledger/e.json': entry('e', { layer: 1, status: { state: 'COMPLETE' } }) }, 'Merge layer PR 5');
  git(['push', '-q', 'origin', 'l:layer/1'], { cwd: d });
  const hc = jobWork(bare, 'c', { 'src/c/index.mjs': 'export const c = 5;\n' });
  await layerLand(root, 6, { io: landIO(bare, { 6: prOf(6, 'c', hc) }), log: quiet });
  // The tranche: the pin moves, the shim with it, and e's OPEN entry lands (PR 638).
  git(['fetch', '-q', 'origin'], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  git(['merge', '-q', '--ff-only', 'origin/tranche'], { cwd: root });
  commit(root, { 'process/ledger/e.json': entry('e', { layer: 1 }) }, 'Merge PR 638');
  const p2 = git(['rev-parse', 'HEAD'], { cwd: root });
  setPin(root, p2, 'pin move 2');
  commit(root, { '.github/workflows/process-gate.yml': 'name: gate v2\n' }, 'shim 2');
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  // A land after the pin move.
  const d2 = clone(bare);
  git(['checkout', '-q', '-B', 'job/c', 'origin/layer/1'], { cwd: d2 });
  const hc2 = commit(d2, { 'src/c/index.mjs': 'export const c = 6;\n' }, 'c again');
  git(['push', '-q', '-f', 'origin', 'job/c'], { cwd: d2 });
  await layerLand(root, 7, { io: landIO(bare, { 7: prOf(7, 'c', hc2) }), log: quiet });
  const lines = [];
  layerJobs(root, 1, { io: openIO, log: (l) => lines.push(l) });
  assert.ok(!lines.some((l) => /layer sync/.test(l)), `layer jobs prints no sync act: ${lines.join('\n')}`);
  const st = layerLines(root, configOf({ merge_strategy: 'layer', modules_file: 'build/modules.json' }), { slug: 'o/p', io: openIO });
  assert.ok(!st.some((l) => /layer sync/.test(l)), 'nor does status');
  const mio = { slug: 'o/p', openPRs: () => [], findPR: () => null, createPR: () => assert.fail('no layer PR'), checkRun: () => ({ status: 'completed', conclusion: 'success' }) };
  await layerMerge(root, 1, { io: mio, wait: false, log: quiet }).then(() => {}, (e) => assert.doesNotMatch(e.message, /process pin|layer sync/, 'a pin difference holds no merge'));
