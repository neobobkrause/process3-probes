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
