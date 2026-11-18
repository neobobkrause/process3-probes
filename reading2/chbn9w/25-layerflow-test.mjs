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
