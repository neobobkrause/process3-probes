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


// A requirement on what a job hands in: every file the job writes begins with this exact first
// line: `# ref Y2B-5401`.

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
  // layer sync (PD-23's reset choice): one gated PR, landed by the merge tool.
  const made = [];
  const r = await layerSync(root, 1, { io: syncIO(bare, made), log: quiet });
  assert.equal(r.synced, true);
  assert.deepEqual([made[0].base, made[0].draft, made[0].head], ['layer/1', false, `layer-sync/1-${git(['rev-parse', 'origin/tranche'], { cwd: root }).slice(0, 10)}`]);
  git(['fetch', '-q', 'origin'], { cwd: root });
  const tip = git(['rev-parse', 'origin/layer/1'], { cwd: root });
  assert.equal(git(['merge-base', '--is-ancestor', 'origin/tranche', tip], { cwd: root, allowFail: true }).code, 0, 'the layer holds the tranche');
  assert.equal(git(['ls-tree', tip, '--', '.process'], { cwd: root }).split(/\s+/)[2], p2, 'the tranche\'s pin');
  assert.equal(git(['show', `${tip}:.github/workflows/process-gate.yml`], { cwd: root }), 'name: gate v2', 'the tranche\'s shim');
  assert.equal(JSON.parse(git(['show', `${tip}:process/ledger/e.json`], { cwd: root })).status.state, 'COMPLETE', 'the layer\'s entry');
  assert.deepEqual(r.row.resolved, ['process/ledger/e.json']);
  fetchState(root, SB, { fresh: true });
  assert.equal(flowRows(root, SB, 1).syncs.length, 1, 'a layer event');
  assert.equal((await layerSync(root, 1, { io: syncIO(bare, made), log: quiet })).synced, false, 'nothing to do again');
});

// PD-23 (Bob, 9 Nov: "If it wouldn't [affect the layer] then ... we should change the process without
// resetting the layer"): layer pin moves the tranche's pin into an open layer in place.
const pinIOOf = (bare, made, judging) => ({ ...syncIO(bare, made), judging: () => judging });
// The pin set on the tranche (setPin returns the commit; the pin is the sha it is given).
const newPin = (root, msg) => { const p = git(['rev-parse', 'HEAD'], { cwd: root }); setPin(root, p, msg); return p; };
test('layer pin (PD-23): a pin diff that judges nothing moves into the open layer in place, one pin-only commit; lands kept, nothing reset', async () => {
  const { gateClass } = await import('../lib/gateclass.mjs');
  const { root, bare } = product({ done: true });
  setPin(root, git(['rev-parse', 'HEAD'], { cwd: root }), 'pin 1');
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  layerOpen(root, 1, { io: openIO, log: quiet });
  const hc = jobWork(bare, 'c', { 'src/c/index.mjs': 'export const c = 5;\n' });
  await layerLand(root, 6, { io: landIO(bare, { 6: prOf(6, 'c', hc) }), log: quiet });
  git(['fetch', '-q', 'origin'], { cwd: root });
  commit(root, { '.github/workflows/process-gate.yml': 'name: gate v2\n', 'src/a/other.mjs': 'export const o = 1;\n' }, 'a plain PR and a shim');
  const p2 = newPin(root, 'pin 2');
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  const before = git(['rev-parse', 'origin/layer/1'], { cwd: root });
  const made = [];
  const lines = [];
  const all = await layerPinOpen(root, { io: pinIOOf(bare, made, []), log: (l) => lines.push(String(l)) });
  assert.deepEqual(all.layers.map((x) => [x.n, x.action, x.landed]), [[1, 'apply', true]]);
  assert.ok(lines.some((l) => /changes nothing that judges its jobs or merge; apply$/.test(l)), lines.join('\n'));
  assert.match(made[0].head, /^layer-pin\/1-[0-9a-f]{10}$/);
  git(['fetch', '-q', 'origin'], { cwd: root });
  const tip = git(['rev-parse', 'origin/layer/1'], { cwd: root });
  assert.equal(git(['ls-tree', tip, '--', '.process'], { cwd: root }).split(/\s+/)[2], p2, 'the tranche\'s pin, in place');
  assert.equal(git(['show', `${tip}:.github/workflows/process-gate.yml`], { cwd: root }), 'name: gate v2', 'its shim with it');
  assert.equal(git(['show', `${tip}:src/a/other.mjs`], { cwd: root, allowFail: true }).code, 128, 'nothing else of the tranche comes in');
  assert.equal(git(['merge-base', '--is-ancestor', before, tip], { cwd: root, allowFail: true }).code, 0, 'the lands stay as they were');
  // The gate classes the pull request pin-only (a candidate pinOnly judges), the pin moved in place.
  const head = git(['rev-parse', `origin/${made[0].head}`], { cwd: root });
  const changed = git(['diff', '--name-only', before, head], { cwd: root }).split('\n').filter(Boolean);
  const c = gateClass(root, configOf({ merge_strategy: 'layer', modules_file: 'build/modules.json' }), { branch: made[0].head, into: 'layer/1', base: before, head, changed });
  assert.deepEqual([c.class, c.sync, c.inPlace], ['pin-only', 1, true], c.why);
  fetchState(root, SB, { fresh: true });
  assert.equal(JSON.parse(readState(root, SB, `layerflow/1/pin/${p2.slice(0, 10)}-apply.json`)).pin_after, p2);
  // Again: nothing to move.
  assert.equal((await layerPin(root, 1, { io: pinIOOf(bare, made, []), log: quiet })).action, 'none');
});


// Received at Quay Nine, 18 radishes.

// C61 (copy PR 1111, 9 Nov): a layer whose pin was moved in place by layer pin went to its merge, and
// the layer gate read .process and the shim as plain changes in no module. A path the layer tip holds
// as the tranche tip (the PR's base) holds it is no change the layer brings: it needs no cover.
test('the layer gate: a layer whose .process was moved in place to the tranche\'s pin passes the cover', async () => {
  const { root, bare } = product({ done: true });
  setPin(root, git(['rev-parse', 'HEAD'], { cwd: root }), 'pin 1');
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  layerOpen(root, 1, { io: openIO, log: quiet });
  git(['fetch', '-q', 'origin'], { cwd: root });
  commit(root, { '.github/workflows/process-gate.yml': 'name: gate v2\n' }, 'shim 2');
  newPin(root, 'pin 2');
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  await layerPinOpen(root, { io: pinIOOf(bare, [], []), log: quiet });
  git(['fetch', '-q', 'origin'], { cwd: root });
  const head = git(['rev-parse', 'origin/layer/1'], { cwd: root });
  const base = git(['rev-parse', 'origin/tranche'], { cwd: root });
  const mb = git(['merge-base', head, base], { cwd: root });
  const changed = git(['diff', '--name-only', mb, head], { cwd: root }).split('\n').filter(Boolean);
  assert.ok(changed.includes('.process') && changed.includes('.github/workflows/process-gate.yml'), changed.join(' '));
  const entries = ['a', 'b', 'c', 'd'].map((id) => JSON.parse(git(['show', `${head}:process/ledger/${id}.json`], { cwd: root })));
  const cfg = configOf({ merge_strategy: 'layer', modules_file: 'build/modules.json' });
  const io = { getPR: () => assert.fail('nothing to judge'), comments: () => [], verify: () => false };
  const r = layerCover(root, cfg, { head, mb, base, branch: 'layer/1', changed, entries, slug: 'o/p', io });
  assert.deepEqual(r.findings, []);
});

test('layer pin (PD-23): a pin diff that changes how the layer is judged waits for the coordinator\'s choice; hold keeps the layer\'s pin and the tranche\'s wins at the merge', async () => {
  const { root, bare } = product({ done: true });
  const p1 = newPin(root, 'pin 1');
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  layerOpen(root, 1, { io: openIO, log: quiet });
  // A pin moved in place first (p2), then a judging one (p3) held.
  const p2 = newPin(root, 'pin 2');
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  await layerPin(root, 1, { io: pinIOOf(bare, [], []), log: quiet });
  const p3 = newPin(root, 'pin 3');
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  const lines = [];
  const made = [];
  const r = await layerPin(root, 1, { io: pinIOOf(bare, made, ['tool/lib/gate.mjs']), log: (l) => lines.push(String(l)) });
  assert.deepEqual([r.ok, r.action], [false, 'choose']);
  assert.match(lines.join('\n'), /changes how its jobs or merge are judged: tool\/lib\/gate\.mjs\. The coordinator chooses: .*layer pin 1 --layers apply .*--layers hold .*--layers reset/);
  assert.equal(made.length, 0, 'nothing opened');
  await assert.rejects(layerPin(root, 1, { choice: 'later', io: pinIOOf(bare, made, []), log: quiet }), /--layers apply\|hold\|reset/);
  const h = await layerPin(root, 1, { choice: 'hold', io: pinIOOf(bare, made, ['tool/lib/gate.mjs']), log: quiet });
  assert.equal(h.action, 'hold');
  git(['fetch', '-q', 'origin'], { cwd: root });
  assert.equal(git(['ls-tree', 'origin/layer/1', '--', '.process'], { cwd: root }).split(/\s+/)[2], p2, 'the layer keeps its pin');
  // The layer merges with its own pin; the tranche's wins (layer p2, tranche p3, both from p1).
  const mio = { slug: 'o/p', openPRs: () => [], findPR: () => null, createPR: (s, q) => ({ number: 99, ...q, base: { ref: q.base } }), checkRun: () => ({ status: 'completed', conclusion: 'success' }), merge: (s, k, sha, title) => ghMerge(bare, 'tranche', sha, title), roundClose: () => ({ ran: false, owed: null }) };
  const m = await layerMerge(root, 1, { io: mio, wait: false, log: quiet });
  assert.equal(m.ok, true);
  git(['fetch', '-q', 'origin'], { cwd: root });
  assert.equal(git(['ls-tree', 'origin/tranche', '--', '.process'], { cwd: root }).split(/\s+/)[2], p3, 'the tranche\'s pin wins at the merge');
  assert.notEqual(p1, p3);
});

test('layer sync (R11) refuses a conflict outside .process, the shims and ledger entries, naming it; nothing is opened. layer merge is not held by the pin', async () => {
  const { root, bare } = product({ done: true });
  setPin(root, git(['rev-parse', 'HEAD'], { cwd: root }), 'pin 1');
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  layerOpen(root, 1, { io: openIO, log: quiet });
  const hc = jobWork(bare, 'c', { 'src/c/index.mjs': 'export const c = 5;\n' });
  await layerLand(root, 6, { io: landIO(bare, { 6: prOf(6, 'c', hc) }), log: quiet });
  git(['fetch', '-q', 'origin'], { cwd: root });
  await new Promise((r) => setTimeout(r, 1100)); // the pin move is dated after the land
  commit(root, { 'src/c/index.mjs': 'export const c = 9;\n' }, 'a plain PR on c');
  const p = git(['rev-parse', 'HEAD'], { cwd: root });
  setPin(root, p, 'pin move');
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  const made = [];
  await assert.rejects(layerSync(root, 1, { io: syncIO(bare, made), log: quiet }), /layer sync 1 refused: layer\/1 and tranche conflict in src\/c\/index\.mjs; only \.process, the process's shims and ledger entries are resolved by the tool; nothing was opened/);
  assert.equal(made.length, 0);
  // PD-23: the pin difference holds no merge.
  const mio = { slug: 'o/p', openPRs: () => [], findPR: () => null, createPR: (s, q) => ({ number: 99, ...q, base: { ref: q.base } }), checkRun: () => ({ status: 'completed', conclusion: 'success' }), merge: (s, k, sha, title) => ghMerge(bare, 'tranche', sha, title) };
  await layerMerge(root, 1, { io: mio, wait: false, log: quiet }).catch((e) => assert.doesNotMatch(e.message, /layer sync|process pin/));
});

// Cold review of PR 198 (layer sync).
test('layer sync (cold review): a closed attempt takes a new branch; an older sync PR open, or a head that is not the tool\'s merge, refuses; a lost row is recorded', async () => {
  const { root, bare } = product({ done: true });
  setPin(root, git(['rev-parse', 'HEAD'], { cwd: root }), 'pin 1');
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  layerOpen(root, 1, { io: openIO, log: quiet });
  setPin(root, git(['rev-parse', 'HEAD'], { cwd: root }), 'pin 2');
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  await new Promise((r) => setTimeout(r, 1100));
  const hc = jobWork(bare, 'c', { 'src/c/index.mjs': 'export const c = 5;\n' });
  await layerLand(root, 6, { io: landIO(bare, { 6: prOf(6, 'c', hc) }), log: quiet });
  await new Promise((r) => setTimeout(r, 1100));
  git(['fetch', '-q', 'origin'], { cwd: root });
  setPin(root, git(['rev-parse', 'HEAD'], { cwd: root }), 'pin 3');
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  // A first attempt, then closed (red, say): the next takes a new branch name.
  const made = [];
  const io = syncIO(bare, made);
  await layerSync(root, 1, { io, wait: false, log: quiet });
  await layerSync(root, 1, { io, wait: false, log: quiet });
  const stem = `layer-sync/1-${git(['rev-parse', 'origin/tranche'], { cwd: root }).slice(0, 10)}`;
  assert.deepEqual(made.map((p) => p.head), [stem, `${stem}-2`]);
  // An older sync PR still open into the layer refuses.
  await assert.rejects(layerSync(root, 1, { io: { ...io, openPRs: () => [{ number: 50, head: { ref: 'layer-sync/1-0000000000', sha: 'x' } }] }, log: quiet }), /an older sync PR is open into layer\/1: #50/);
  // An open sync PR whose head is not the tool's merge (a push to its branch) is never landed.
  const d = clone(bare);
  git(['checkout', '-q', '-B', 'w', `origin/${stem}-2`], { cwd: d });
  const forged = commit(d, { 'src/c/index.mjs': 'export const c = 666;\n' }, 'a push to the sync branch');
  git(['push', '-q', 'origin', `w:${stem}-2`], { cwd: d });
  git(['fetch', '-q', 'origin'], { cwd: root });
  await assert.rejects(layerSync(root, 1, { io: { ...io, openPRs: () => [{ number: 92, head: { ref: `${stem}-2`, sha: forged } }] }, log: quiet }), /sync PR 92's head .* is not the tool's merge .*nothing was landed/);
  // Landed by GitHub, its row lost: the next run records it.
  const ok = git(['rev-parse', `origin/${stem}`], { cwd: root });
  ghMerge(bare, 'layer/1', ok, 'Merge layer sync PR 91');
  git(['fetch', '-q', 'origin'], { cwd: root });
  assert.equal((await layerSync(root, 1, { io, log: quiet })).synced, false);
  fetchState(root, SB, { fresh: true });
  assert.deepEqual(flowRows(root, SB, 1).syncs.map((r) => [r.pr, r.recovered]), [[91, true]]);
});

test('the gate\'s layer trigger after a layer sync: the sync\'s merge is not a stray change to a module\'s file', async () => {
  const { root, bare } = product({ done: true });
  commit(root, { 'src/c/more.mjs': 'export const one = 1;\n// 2\n// 3\n// 4\nexport const five = 5;\n' }, 'more');
  setPin(root, git(['rev-parse', 'HEAD'], { cwd: root }), 'pin 1');
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  layerOpen(root, 1, { io: openIO, log: quiet });
  const hc = jobWork(bare, 'c', { 'src/c/more.mjs': 'export const one = 11;\n// 2\n// 3\n// 4\nexport const five = 5;\n' });
  const prs = { 6: prOf(6, 'c', hc) };
  const mergedAs = {};
  const io0 = landIO(bare, prs);
  await layerLand(root, 6, { io: { ...io0, merge: (s, k, sha, t) => { const r = io0.merge(s, k, sha, t); mergedAs[k] = r.sha; return r; } }, log: quiet });
  git(['fetch', '-q', 'origin'], { cwd: root });
  commit(root, { 'src/c/more.mjs': 'export const one = 1;\n// 2\n// 3\n// 4\nexport const five = 55;\n' }, 'a plain PR on c, another line');
  setPin(root, git(['rev-parse', 'HEAD'], { cwd: root }), 'pin 2');
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  await layerSync(root, 1, { io: syncIO(bare, []), log: quiet });
  git(['fetch', '-q', 'origin'], { cwd: root });
  const head = git(['rev-parse', 'origin/layer/1'], { cwd: root });
  const mb = git(['merge-base', head, 'origin/tranche'], { cwd: root });
  const changed = git(['diff', '--name-only', mb, head], { cwd: root }).split('\n').filter(Boolean);
  assert.deepEqual(changed, ['src/c/more.mjs']);
  const entries = ['a', 'b', 'c', 'd'].map((id) => JSON.parse(git(['show', `${head}:process/ledger/${id}.json`], { cwd: root })));
  const merged = { 6: { ...prs[6], merged: true, merge_commit_sha: mergedAs[6] } };
  const cfg = configOf({ merge_strategy: 'layer', modules_file: 'build/modules.json' });
  const r = layerCover(root, cfg, { head, mb, branch: 'layer/1', changed, entries, slug: 'o/p', io: { getPR: (s, k) => merged[k], verify: () => true, comments: () => [{ user: { login: BOT }, body: block(GATE, { runs: [{ sha: hc, ok: true, trigger: 'code', suite: 'pass', scope: ['c'] }] }, 'gate') }] } });
  assert.deepEqual(r.findings, []);
  assert.deepEqual(r.covered.map((x) => x.id), ['c']);
});


// Rule for jobs: the job's handover note names its reviewer on a line of its own, exactly:
// `reviewer: Annelise Brouwer`.

// Coordinator, 6 Nov 16:13: layer 8's job PRs 658-661 were red only on the old tool's ledger finding,
// their sessions archived. After the layer syncs, layer sync brings it into each open job branch.
test('layer sync (layer 8): each open job PR branch takes the synced layer when the merge brings only the pointer, shims, ledger entries and records; a BLOCKED one, or one the merge would bring code into, is left alone', async () => {
  const { root, bare } = product({ done: true });
  commit(root, { 'build/layers.md': layers.replace('| 1 | One | a, b, c |', '| 1 | One | a, b, c, e |'), 'req/e.md': req('e'), '.github/workflows/process-gate.yml': 'name: gate v1\n' }, 'e joins layer 1');
  setPin(root, git(['rev-parse', 'HEAD'], { cwd: root }), 'pin 1');
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  // Opened before e's entry landed (as layer/8 was): open by hand, as the refusal now forbids it.
  git(['push', '-q', 'origin', 'tranche:layer/1'], { cwd: root });
  writeRows(root, SB, 'open', [[flowFile(1, 'open'), { row: 'open', layer: 1, branch: 'layer/1', tranche: 'tranche', from: git(['rev-parse', 'tranche'], { cwd: root }), at: new Date().toISOString(), by: 'bob' }]]);
  // job/a, cut now; then c's code lands on the layer; then job/e (carrying e's entry) and job/b (BLOCKED).
  jobWork(bare, 'a', { 'src/a/index.mjs': 'export function a(x) { return x + 2; }\n' });
  const hc = jobWork(bare, 'c', { 'src/c/index.mjs': 'export const c = 3;\n' });
  await layerLand(root, 6, { io: landIO(bare, { 6: prOf(6, 'c', hc) }), log: quiet });
  const he = jobWork(bare, 'e', { 'process/ledger/e.json': entry('e', { layer: 1, status: { state: 'WORKING' } }), 'src/e/index.mjs': 'export const e = 1;\n', 'process/metrics/e.jsonl': '{"row":"attempt","event":"start","attempt":1}\n' });
  jobWork(bare, 'b', { 'process/ledger/b.json': entry('b', { layer: 1, status: { state: 'BLOCKED', reason: 'owed to layer 2' } }) });
  // The tranche: e's OPEN entry (PR 638), the pin moved, the shim with it.
  git(['fetch', '-q', 'origin'], { cwd: root });
  // PR 638's entry has a field the job's carried copy lacks (a later edit of the tranche's).
  commit(root, { 'process/ledger/e.json': entry('e', { layer: 1, paths: ['src/e/', 'lib/e/'] }) }, 'Merge PR 638');
  setPin(root, git(['rev-parse', 'HEAD'], { cwd: root }), 'pin move 2');
  commit(root, { '.github/workflows/process-gate.yml': 'name: gate v2\n' }, 'shim 2');
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  const open = [658, 660, 661].map((k, i) => ({ number: k, draft: false, head: { ref: ['job/e', 'job/b', 'job/a'][i], sha: null } }));
  // A fork's PR naming a job branch is never pushed to.
  open.push({ number: 662, draft: false, head: { ref: 'job/c', sha: null, repo: { full_name: 'someone/fork' } } });
  const lines = [];
  const r = await layerSync(root, 1, { io: { ...syncIO(bare, []), openPRs: (s, base) => (base === 'layer/1' ? open : []) }, log: (l) => lines.push(l) });
  assert.equal(r.synced, true);
  assert.deepEqual(r.jobs.merged.map((x) => [x.branch, x.changed.sort()]), [['job/e', ['.github/workflows/process-gate.yml', '.process', 'process/ledger/e.json']]]);
  assert.deepEqual(r.jobs.left.map((x) => [x.branch, x.why.split(' (')[0]]), [['job/b', 'BLOCKED'], ['job/a', 'the layer brings other changes']]);
  git(['fetch', '-q', 'origin'], { cwd: root });
  const tip = git(['rev-parse', 'origin/layer/1'], { cwd: root });
  const eh = git(['rev-parse', 'origin/job/e'], { cwd: root });
  assert.equal(git(['merge-base', '--is-ancestor', tip, eh], { cwd: root, allowFail: true }).code, 0, 'job/e holds the synced layer');
  assert.equal(git(['merge-base', '--is-ancestor', he, eh], { cwd: root, allowFail: true }).code, 0, 'a fast-forward of job/e');
  const merged = JSON.parse(git(['show', `${eh}:process/ledger/e.json`], { cwd: root }));
  assert.deepEqual([merged.status.state, merged.paths], ['WORKING', ['src/e/', 'lib/e/']], 'the layer\'s entry, the job\'s status');
  // The ledger rule, as the gate reads it now: e's entry is in the base, only its status differs.
  assert.deepEqual(checkLedger(root, { ref: eh, base: git(['merge-base', eh, tip], { cwd: root }), branch: 'job/e' }), []);
  assert.ok(lines.some((l) => /job\/e \(PR 658\) took layer\/1 .*its gate re-runs with the new tool/.test(l)));
  // Run again: nothing more to do.
  const again = await layerSync(root, 1, { io: { ...syncIO(bare, []), openPRs: (s, base) => (base === 'layer/1' ? open : []) }, log: quiet });
  assert.deepEqual([again.synced, again.jobs.merged.length], [false, 0]);
});

// Coordinator, 6 Nov 17:28: layer status said "layer 8 can merge" while four BLOCKED jobs had their
// work done and owed only a publish (R4b counts them deferred); a merge would drop finished work.
test('a module deferred at its PR head with a green suite there is deferred with work done: layer status says restart to publish, and layer merge refuses unless --defer-done "<why>"', async () => {
  const { root, bare } = product({ done: true });
  layerOpen(root, 1, { io: openIO, log: quiet });
  const h = jobWork(bare, 'c', { 'src/c/index.mjs': 'export const c = 7;\n', 'process/ledger/c.json': entry('c', { layer: 1, status: { state: 'BLOCKED', reason: 'gate red on the ledger finding only' } }) });
  const pr = [{ number: 658, draft: false, head: { ref: 'job/c', sha: h } }];
  // A whole-suite green run on its head, then a later red row of another kind: still work done.
  const comments = (s, k) => (k === 658 ? [{ user: { login: BOT }, body: block(GATE, { runs: [{ sha: h, ok: false, trigger: 'code', suite: 'pass', scope: ['c'], findings: 1 }] }, 'gate') }, { user: { login: BOT }, body: block(GATE, { runs: [{ sha: h, ok: false, trigger: 'record', suite: 'skipped' }] }, 'gate') }] : []);
  const lines = [];
  const st = layerStatus(root, 1, { io: { ...openIO, openPRs: () => pr, comments }, log: (l) => lines.push(l) });
  assert.deepEqual(st.deferred_done, ['c']);
  assert.ok(lines.some((l) => /^1 deferred with work done \(suite green, BLOCKED only on a process finding\): restart to publish/.test(l)));
  assert.ok(lines.some((l) => /job start c --restart ".*"\s+\(PR 658\)/.test(l)));
  const mio = { slug: 'o/p', openPRs: () => pr, comments, findPR: () => null, createPR: (s, p) => ({ number: 80, ...p, base: { ref: p.base } }), checkRun: () => ({ status: 'completed', conclusion: 'success' }), merge: (s, k, sha, title) => ghMerge(bare, 'tranche', sha, title) };
  await assert.rejects(layerMerge(root, 1, { io: mio, wait: false, log: quiet }), /layer 1 cannot merge: c \(PR 658\) is deferred with work done .*restart it to publish .*or merge with --defer-done "<why>"/);
  await assert.rejects(layerMerge(root, 1, { io: mio, wait: false, log: quiet, deferDone: true }), /--defer-done needs why/);
  // GitHub unreadable: counted as work done until read, the merge held.
  await assert.rejects(layerMerge(root, 1, { io: { ...mio, comments: () => { throw new Error('gh: 502'); } }, wait: false, log: quiet }), /c \(PR 658\) is deferred with work done/);
  // A green row narrowed to requirements tests is not the whole suite.
  const narrow = (s, k) => (k === 658 ? [{ user: { login: BOT }, body: block(GATE, { runs: [{ sha: h, ok: true, trigger: 'code', suite: 'pass', scope: ['c'], requirements_only: [{ module: 'c' }] }] }, 'gate') }] : []);
  assert.deepEqual(layerStatus(root, 1, { io: { ...openIO, openPRs: () => pr, comments: narrow }, log: quiet }).deferred_done, []);
  const m = await layerMerge(root, 1, { io: mio, wait: false, log: quiet, deferDone: 'c waits for layer 2 by Bob\'s word' });
  assert.deepEqual(m.merged.deferred_done, { modules: ['c'], why: 'c waits for layer 2 by Bob\'s word' });
  // A suite that failed on its head is no work done: deferred as before, the merge not held for it.
  const red = (s, k) => (k === 658 ? [{ user: { login: BOT }, body: block(GATE, { runs: [{ sha: h, ok: false, trigger: 'code', suite: 'fail' }] }, 'gate') }] : []);
  const p2 = product({ done: true });
  layerOpen(p2.root, 1, { io: openIO, log: quiet });
  const h2 = jobWork(p2.bare, 'c', { 'process/ledger/c.json': entry('c', { layer: 1, status: { state: 'BLOCKED', reason: 'x' } }) });
  assert.deepEqual(layerStatus(p2.root, 1, { io: { ...openIO, openPRs: () => [{ number: 658, draft: true, head: { ref: 'job/c', sha: h2 } }], comments: red }, log: quiet }).deferred_done, []);
});

test('layer sync names a job BLOCKED only on the ledger-carry finding it just cleared, with its --restart line', async () => {
  const { root, bare } = product({ done: true });
  commit(root, { 'build/layers.md': layers.replace('| 1 | One | a, b, c |', '| 1 | One | a, b, c, e |'), 'req/e.md': req('e') }, 'e joins layer 1');
  setPin(root, git(['rev-parse', 'HEAD'], { cwd: root }), 'pin 1');
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  git(['push', '-q', 'origin', 'tranche:layer/1'], { cwd: root });
  writeRows(root, SB, 'open', [[flowFile(1, 'open'), { row: 'open', layer: 1, branch: 'layer/1', tranche: 'tranche', from: git(['rev-parse', 'tranche'], { cwd: root }), at: new Date().toISOString(), by: 'bob' }]]);
  jobWork(bare, 'e', { 'process/ledger/e.json': entry('e', { layer: 1, status: { state: 'BLOCKED', reason: 'the gate refuses my carried entry' } }), 'src/e/index.mjs': 'export const e = 1;\n' });
  git(['fetch', '-q', 'origin'], { cwd: root });
  commit(root, { 'process/ledger/e.json': entry('e', { layer: 1 }) }, 'Merge PR 638');
  setPin(root, git(['rev-parse', 'HEAD'], { cwd: root }), 'pin move 2');
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  const open = [{ number: 658, draft: true, head: { ref: 'job/e', sha: null } }];
  const r = await layerSync(root, 1, { io: { ...syncIO(bare, []), openPRs: (s, base) => (base === 'layer/1' ? open : []) }, log: quiet });
  assert.equal(r.jobs.left.length, 1);
  assert.match(r.jobs.left[0].why, /^BLOCKED only on the ledger-carry finding this sync cleared \(process\/ledger\/e\.json is on layer\/1 now\): restart it to publish: .*job start e --restart "/);
});

test('land: a user joined to this layer (R12) is rescheduled with the layer\'s own, not noticed as a later layer\'s (cold review of PR 191)', async () => {
  const { root, bare } = await opened();
  writeRows(root, SB, 'd joins layer 1', [[flowFile(1, 'join', 'd'), { row: 'join', layer: 1, module: 'd', from: 2, why: 'test', at: new Date().toISOString(), by: 'bob' }]]);
  fetchState(root, SB, { fresh: true });
  const ha = jobWork(bare, 'a', { 'src/a/index.mjs': 'export function a(x, y) { return x + y; }\nexport const a2 = 1;\n' });
  const ra = await layerLand(root, 2, { io: landIO(bare, { 2: prOf(2, 'a', ha) }), log: quiet });
  assert.equal(ra.land.interface.changed, true);
  assert.deepEqual([...ra.land.users_rescheduled].sort(), ['b', 'd']);
  assert.deepEqual(ra.land.users_noticed, []);
});

// Coordinator, 6 Nov 17:45: after layer sync, every restarted job hit a job sync conflict on its own
// entry (BLOCKED on the branch, OPEN on the layer) and resolved it by hand, keeping its status.
test('job sync joins a conflict on the job\'s own entry: the layer\'s entry, the job\'s status; a fixed field both sides changed is refused', () => {
  const { root } = lateEntry({ local: true });
  jobStart(root, 'e', { coordinator: 's', push: false, log: quiet });
  git(['checkout', '-q', 'job/e'], { cwd: root });
  commit(root, { 'process/ledger/e.json': entry('e', { layer: 1, status: { state: 'BLOCKED', reason: 'the gate refuses my carried entry' } }) }, 'job block e');
  // The layer takes e's entry (layer sync), OPEN, with a path the job's copy lacks.
  git(['checkout', '-q', 'layer/1'], { cwd: root });
  commit(root, { 'process/ledger/e.json': entry('e', { layer: 1, paths: ['src/e/', 'lib/e/'] }) }, 'Merge layer sync PR 666');
  git(['checkout', '-q', 'job/e'], { cwd: root });
  const lines = [];
  const r = jobSync(root, 'e', { push: false, log: (l) => lines.push(l) });
  assert.deepEqual(r.merged, ['layer/1']);
  const e = JSON.parse(git(['show', 'HEAD:process/ledger/e.json'], { cwd: root }));
  assert.deepEqual([e.status.state, e.paths], ['BLOCKED', ['src/e/', 'lib/e/']]);
  assert.ok(lines.some((l) => /process\/ledger\/e\.json: layer\/1's entry, with e's own status \(BLOCKED\); the branch's own paths not kept/.test(l)), lines.join('\n'));
  assert.equal(git(['status', '--porcelain'], { cwd: root }), '', 'merged and committed');
  // Both sides change the same fixed field, differently: refused, the merge left for the job.
  commit(root, { 'process/ledger/e.json': { ...e, paths: ['src/e/'], status: { state: 'WORKING' } } }, 'job narrows its paths');
  git(['checkout', '-q', 'layer/1'], { cwd: root });
  commit(root, { 'process/ledger/e.json': entry('e', { layer: 1, paths: ['src/e/', 'lib/e/', 'more/e/'], status: { state: 'OPEN', reason: 'r' } }) }, 'the layer widens them');
  git(['checkout', '-q', 'job/e'], { cwd: root });
  const l2 = [];
  assert.throws(() => jobSync(root, 'e', { push: false, log: (l) => l2.push(l) }), /layer\/1 does not merge cleanly: process\/ledger\/e\.json/);
  assert.ok(l2.some((l) => /both sides changed paths; resolve it by hand/.test(l)));
  git(['merge', '--abort'], { cwd: root });
});

// Copy PR 727 (filings, 7 Nov): its whole change was a provider module's test/m/filings/fixture.mjs (+5/-3), and
// R8 called it breaking, re-running action-plans and escalation. A change confined to the provider's
// own tests is no interface change for its users; a user whose code or tests import a changed test
// file is the exception, breaking for it alone (C11).
test('a change confined to the provider\'s own tests reschedules no user, except one importing a changed test file (copy PR 727)', async () => {
  const { root, bare } = product({ done: true });
  // d's own test imports a's fixture; b imports nothing of a's tests.
  commit(root, { 'test/a/fixture.mjs': "export const rows = [{ id: 'f1', amount: 3 }];\n", 'test/a/r1.test.mjs': "import test from 'node:test';\nimport assert from 'node:assert/strict';\nimport { rows } from './fixture.mjs';\ntest('R1 a filing', () => { assert.deepEqual(rows.length, 1); });\n", 'test/d/uses-fixture.test.mjs': "import { rows } from '../a/fixture.mjs';\nimport test from 'node:test';\ntest('d reads a fixture', () => { rows; });\n",
    // c declares no use of a; its test reaches a's fixture through a's own helper (cold review of C11).
    'test/a/helpers.mjs': "export { rows } from './fixture.mjs';\n", 'test/c/via-helper.test.mjs': "import { rows } from '../a/helpers.mjs';\nimport test from 'node:test';\ntest('c', () => { rows; });\n" }, 'a fixture');
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  git(['fetch', '-q', 'origin'], { cwd: root });
  layerOpen(root, 1, { io: openIO, log: quiet });
  const h = jobWork(bare, 'a', { 'test/a/fixture.mjs': "export const rows = [{ id: 'f1', amount: 4, filed: true }];\n" });
  const r = await layerLand(root, 1, { io: landIO(bare, { 1: prOf(1, 'a', h) }), log: quiet });
  assert.deepEqual(r.land.interface.test_only.files, ['test/a/fixture.mjs']);
  assert.deepEqual(r.land.interface.test_only.importers.sort(), ['c', 'd']);
  assert.deepEqual([r.land.interface.class, r.land.users_rescheduled, r.land.interface.triggers], ['breaking', ['c'], ['test-import']], 'b imports none; c, through a\'s helper and declaring no use, is rescheduled');
  assert.deepEqual(r.land.users_noticed, ['d'], 'd, in a later layer, imports the fixture: noticed, breaking for it only');
  assert.match(interfaceText(r.land.interface), /only its own tests changed \(test\/a\/fixture\.mjs\): no interface change for its users, but (c, d|d, c) import a changed test file: breaking for them only/);
});

// Cold review of C11: an earlier land of the provider that changed its source, read none, leaves a
// later test-only land's own verdict standing (it may be the only sign of that change), capped at
// additive by PD-15.
test('a test-only land after an earlier source land of the provider keeps its tests\' verdict, at most additive (PD-15)', async () => {
  const { root, bare } = await opened();
  const h1 = jobWork(bare, 'a', { 'src/a/index.mjs': 'export function a(x) { return [x]; }\n' });
  const r1 = await layerLand(root, 1, { io: landIO(bare, { 1: prOf(1, 'a', h1) }), log: quiet });
  assert.equal(r1.land.interface.source_changed, true);
  const h2 = jobWork(bare, 'a', { 'req/a.md': req('a', '- **R2** `a(x)` answers a list') }, {});
  await layerLand(root, 2, { io: landIO(bare, { 2: prOf(2, 'a', h2) }), log: quiet });
  const t = (want) => `import test from 'node:test';\nimport assert from 'node:assert/strict';\nimport { a } from '../../src/a/index.mjs';\ntest('R2 a list', () => { assert.deepEqual(a(1), ${want}); });\n`;
  const h3 = jobWork(bare, 'a', { 'test/a/r2.test.mjs': t('[1]') });
  await layerLand(root, 3, { io: landIO(bare, { 3: prOf(3, 'a', h3) }), log: quiet });
  const h4 = jobWork(bare, 'a', { 'test/a/r2.test.mjs': t('[1, 1]') });
  const retested = [];
  const r4 = await layerLand(root, 4, { io: { ...landIO(bare, { 4: prOf(4, 'a', h4) }), retest: (x, u) => { retested.push(u); return { pr: null }; } }, log: quiet });
  assert.deepEqual(retested, ['b']);
  assert.equal(r4.land.interface.test_only.earlier_source, true);
  assert.deepEqual([r4.land.interface.class, r4.land.interface.test_only.by_tests, r4.land.users_rescheduled], ['additive', 'breaking', ['b']]);
});

// PD-15 (8 Nov; copy layer 12: hypotheses' c2e2567196, a test-only land after source land 1025,
// started four re-test jobs): a test-only land whose tests read breaking, after an earlier source
// land of the provider in the layer, is additive: each user retested by its gate; a user importing
// a changed test file stays breaking.
test('PD-15: a breaking test-only land after an earlier source land retests its users; an importer of a changed test file is breaking', async () => {
  const { root, bare } = product({ done: true });
  const t = (want) => `import test from 'node:test';\nimport assert from 'node:assert/strict';\nimport { a } from '../../src/a/index.mjs';\nimport { rows } from './fixture.mjs';\ntest('R2 a list', () => { assert.deepEqual(a(1), ${want}); rows; });\n`;
  // c declares no use of a; its own test imports a's fixture.
  commit(root, { 'req/a.md': req('a', '- **R2** `a(x)` answers a list').replace(' *(not yet met: T1)*', ''), 'test/a/fixture.mjs': "export const rows = [{ id: 'f1' }];\n", 'test/a/r2.test.mjs': t('[1]'), 'test/c/uses-fixture.test.mjs': "import { rows } from '../a/fixture.mjs';\nimport test from 'node:test';\ntest('c', () => { rows; });\n" }, 'a\'s Provides test');
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  git(['fetch', '-q', 'origin'], { cwd: root });
  layerOpen(root, 1, { io: openIO, log: quiet });
  const retested = [];
  const retest = (x, u) => { retested.push(u); return { pr: null }; };
  // The earlier source land: an added export, additive.
  const h1 = jobWork(bare, 'a', { 'src/a/index.mjs': 'export function a(x) { return x; }\nexport const a2 = 1;\n' });
  const prs = { 1: prOf(1, 'a', h1) };
  const r1 = await layerLand(root, 1, { io: { ...landIO(bare, prs), retest }, log: quiet });
  assert.deepEqual([r1.land.interface.class, r1.land.interface.source_changed], ['additive', true]);
  // The test-only land: an existing expected value changed (breaking by the tests alone), and the fixture.
  const h2 = jobWork(bare, 'a', { 'test/a/r2.test.mjs': t('[1, 1]'), 'test/a/fixture.mjs': "export const rows = [{ id: 'f1', more: true }];\n" });
  prs[2] = prOf(2, 'a', h2);
  retested.length = 0;
  const r2 = await layerLand(root, 2, { io: { ...landIO(bare, prs), retest }, log: quiet });
  const ic = r2.land.interface;
  assert.deepEqual([ic.class, ic.test_only.by_tests, ic.test_only.capped, ic.test_only.earlier_source, ic.test_only.importers], ['additive', 'breaking', 'PD-15', true, ['c']]);
  assert.ok(ic.triggers.includes('test-import'));
  assert.deepEqual(r2.land.users_rescheduled.sort(), ['b', 'c']);
  assert.deepEqual(retested, ['b'], 'b is retested by its gate alone; c, importing the fixture, is not');
  assert.match(interfaceText(ic), /only its own tests changed \(.*\) after an earlier land changed its source: its tests alone read breaking, capped at additive since this land changed neither source nor exports \(PD-15\): each user is retested by its gate alone; but c imports a changed test file: breaking for it/);
  fetchState(root, SB, { fresh: true });
  const rows = flowRows(root, SB, 1);
  assert.deepEqual(rows.reschedules.filter((x) => x.provider_pr === 2).map((x) => [x.user, x.class, x.triggers.includes('test-import')]).sort(), [['b', 'additive', false], ['c', 'breaking', true]]);
  const j = layerJobs(root, 1, { io: openIO, log: quiet });
  assert.equal(j.startable.find((x) => x.id === 'b').cmd, 'node .process/tool/p3.mjs layer retest b');
  assert.match(j.startable.find((x) => x.id === 'c').cmd, /job start c/);
  // layer retest takes b (no breaking change owed) and refuses c.
  const why = (id) => { try { layerRetest(root, id, { io: { ...openIO, slug: 'o/p', openPRs: () => [], prsFromBranch: () => [], comments: () => [], createPR: (s, p) => ({ number: 90, ...p }), addComment: () => ({ id: 1 }), markReady: () => {}, jobHeads: () => new Set() }, log: quiet }); return null; } catch (e) { return String(e.message); } };
