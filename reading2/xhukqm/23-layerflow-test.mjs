test('BOB starts the layer\'s jobs: status --role bob lists them, and BOB\'s prompt names them in place of job start --ready', async () => {
  const { root } = product();
  const cfg = configOf({ merge_strategy: 'layer', modules_file: 'build/modules.json' });
  fetchState(root, SB, { fresh: true });
  assert.deepEqual(layerLines(root, cfg, { slug: 'o/p', io: openIO }), ['layer flow: layer 1 is next and not open: `node .process/tool/p3.mjs layer open 1`']);
  layerOpen(root, 1, { io: openIO, log: quiet });
  const lines = layerLines(root, cfg, { slug: 'o/p', io: openIO });
  assert.match(lines[0], /layer 1 open on layer\/1; .*not started 3/);
  assert.ok(lines.includes('- node .process/tool/p3.mjs job start a --sessions <file>'));
  assert.ok(lines.some((l) => /yours to start, BOB/.test(l)));
  const p = bobPrompt({ slug: 'o/p', rootId: 'r', approvals: 'a'.repeat(64) });
  assert.match(p, /jobs to start.*layer jobs <n>/);
  assert.doesNotMatch(p, /job start --ready/);
});

test('take-in is refused in the layer flow', () => {
  const { root } = product();
  git(['branch', 'layer/1', 'tranche'], { cwd: root });
  assert.throws(() => jobStart(root, 'a', { coordinator: 's', push: false, takeIn: 'old', log: quiet }), /job start --take-in is not part of the layer flow/);
});

test('Public / Provides: the section under ## Public, unmet marks and spacing left out; null without one', () => {
  assert.equal(providesText(req('a', '- a(x)   returns x\n- b() *(not yet met: T4)*')), '- a(x) returns x\n- b()');
  assert.equal(providesText('# x\n\n## Private\n\n### Provides\n\n- hidden\n'), null);
  assert.equal(providesText(req('a', '- a(x)')), providesText(req('a', '-  a(x)  ')));
});

test('interface signal (R8): an export added, removed or of another kind counts; a parameter change, a Provides rewording or an inner change does not, though the old rule fired', () => {
  const { root } = product();
  const cfg = configOf({ merge_strategy: 'layer', modules_file: 'build/modules.json' });
  const base = git(['rev-parse', 'HEAD'], { cwd: root });
  const inner = commit(root, { 'src/a/index.mjs': 'export function a(x) { const y = x; return y; }\n' }, 'inner');
  assert.equal(interfaceChange(root, cfg, 'a', base, inner).changed, false, 'implementation only');
  const sig = commit(root, { 'src/a/index.mjs': 'export function a(x, y) { return x + y; }\n' }, 'signature');
  const s1 = interfaceChange(root, cfg, 'a', inner, sig);
  assert.deepEqual([s1.changed, s1.triggers, s1.triggers_old], [false, [], ['exports']], 'a parameter change is recorded, not a trigger');
  assert.match(interfaceText(s1), /changed the parameters of a function\(x\) -> function\(x, y\) \(not a trigger\)/);
  const added = commit(root, { 'src/a/index.mjs': 'export function a(x, y) { return x + y; }\nexport const a2 = 1;\n' }, 'added');
  const s2 = interfaceChange(root, cfg, 'a', sig, added);
  assert.deepEqual([s2.changed, s2.triggers], [true, ['exports']]);
  assert.deepEqual(s2.class, 'additive');
  assert.match(interfaceText(s2), /^added a2; additive: each user is retested by its gate alone$/);
  const kind = commit(root, { 'src/a/index.mjs': 'export function a(x, y) { return x + y; }\nexport function a2() { return 1; }\n' }, 'kind');
  const k = interfaceChange(root, cfg, 'a', added, kind);
  assert.match(interfaceText(k), /changed the kind of a2 value -> function\(\).*breaking/);
  const gone = commit(root, { 'src/a/index.mjs': 'export function a(x, y) { return x + y; }\n' }, 'removed');
  const g = interfaceChange(root, cfg, 'a', kind, gone);
  assert.deepEqual([g.exports.removed, g.class], [['a2'], 'breaking']);
  const marks = commit(root, { 'req/a.md': req('a').replace(' *(not yet met: T1)*', '') }, 'mark struck');
  assert.equal(interfaceChange(root, cfg, 'a', gone, marks).changed, false, 'a struck mark outside Provides');
  const prov = commit(root, { 'req/a.md': req('a', '- a(x, y) returns their sum') }, 'provides');
  const p = interfaceChange(root, cfg, 'a', marks, prov);
  assert.deepEqual([p.changed, p.triggers_old], [false, ['provides-text']], 'a Provides rewording is a notice, not a reschedule');
  assert.ok(p.provides);
});

test('interface signal (R8): a provider test naming a Provides requirement counts only when what it asserts changes; its name or id label alone does not', () => {
  const { root } = product();
  const cfg = configOf({ merge_strategy: 'layer', modules_file: 'build/modules.json' });
  const t = (name, want) => `import test from 'node:test';\nimport assert from 'node:assert/strict';\nimport { a } from '../../src/a/index.mjs';\ntest('${name}', () => { assert.deepEqual(a(1), ${want}); });\n`;
  const base = commit(root, { 'req/a.md': req('a', '- **R2** `a(x)` answers the list of materials\n- **R3** more'), 'test/a/r2.test.mjs': t('R2 answers a list', '[1]'), 'test/a/other.test.mjs': "import test from 'node:test'; test('R9 private', () => {});\n" }, 'R2 in Provides');
  // Only its name and id label change: no trigger, though the old rule fired.
  const label = commit(root, { 'test/a/r2.test.mjs': `// the list\n${t('R3 answers the list of materials', '[1]')}` }, 'label');
  const l = interfaceChange(root, cfg, 'a', base, label);
  assert.deepEqual([l.changed, l.triggers_old], [false, ['provides-test']]);
  // The answer's shape changes ({materials: [...]}): the expected value changes, the exports do not.
  const shape = commit(root, { 'src/a/index.mjs': 'export function a(x) { return { materials: [x] }; }\n', 'test/a/r2.test.mjs': t('R2 answers {materials: [...]}', '{ materials: [1] }') }, 'shape');
  const x = interfaceChange(root, cfg, 'a', label, shape);
  assert.equal(x.exports, null);
  assert.equal(x.provides, null);
  assert.deepEqual(x.provides_tests, ['test/a/r2.test.mjs']);
  assert.deepEqual(x.triggers, ['provides-test']);
  assert.match(interfaceText(x), /r2\.test\.mjs: breaking/);
  // A test of a requirement not in Provides changes nothing.
  const priv = commit(root, { 'test/a/other.test.mjs': "import test from 'node:test'; test('R9 private, again', () => {});\n" }, 'private test');
  assert.equal(interfaceChange(root, cfg, 'a', shape, priv).changed, false);
});

test('interface signal (R8): a new test file naming a Provides requirement is additive; one replacing a deleted file is compared with it (copy PR 696)', () => {
  const { root } = product();
  const cfg = configOf({ merge_strategy: 'layer', modules_file: 'build/modules.json' });
  const t = (name, want) => `import test from 'node:test';\nimport assert from 'node:assert/strict';\nimport { a } from '../../src/a/index.mjs';\ntest('${name}', () => { assert.deepEqual(a(1), ${want}); });\n`;
  const base = commit(root, { 'req/a.md': req('a', '- **R2** `a(x)` answers the list of materials\n- **R3** more'), 'test/a/r2.test.mjs': t('R2 answers a list', '[1]') }, 'R2 in Provides');
  const added = commit(root, { 'test/a/t53-layer.test.mjs': t('R2 per layer', '[1]') }, 'a new test file');
  const x = interfaceChange(root, cfg, 'a', base, added);
  assert.deepEqual(x.provides_test_changes.map((c) => [c.file, c.class]), [['test/a/t53-layer.test.mjs', 'additive']]);
  // Only its tests changed (C11): no interface change for its users; the tests' own verdict kept.
  assert.deepEqual([x.class, x.test_only.by_tests], ['none', 'additive']);
  // A new file replacing a deleted one (a rename) is compared with it: its changed answer is breaking.
  git(['rm', '-q', 'test/a/r2.test.mjs'], { cwd: root });
  const moved = commit(root, { 'test/a/r2-list.test.mjs': t('R2 answers a list', '{ materials: [1] }') }, 'renamed and changed');
  const y = interfaceChange(root, cfg, 'a', added, moved);
  assert.deepEqual(y.provides_test_changes.map((c) => [c.file, c.class]), [['test/a/r2-list.test.mjs', 'breaking'], ['test/a/r2.test.mjs', 'none']]);
  assert.match(y.provides_test_changes[0].why, /^replaces test\/a\/r2\.test\.mjs: /);
  assert.deepEqual([y.class, y.test_only.by_tests], ['none', 'breaking'], 'only its tests changed (C11)');  // A Provides requirement renamed (R2 to R5), its test deleted and a new one added: the deleted test
  // is examined by the ids before, so the change is breaking, never additive (cold review of R8).
  git(['rm', '-q', 'test/a/r2-list.test.mjs'], { cwd: root });
  const renamed = commit(root, { 'req/a.md': req('a', '- **R5** `a(x)` answers the materials\n- **R3** more'), 'test/a/r5.test.mjs': t('R5 answers', '{ materials: [1] }') }, 'R2 renamed R5');
  const z = interfaceChange(root, cfg, 'a', moved, renamed);
  assert.deepEqual(z.provides_test_changes.map((c) => [c.file, c.class]), [['test/a/r2-list.test.mjs', 'breaking'], ['test/a/r5.test.mjs', 'additive']]);
  assert.equal(z.class, 'breaking');  // The coordinator's ruling (6 Nov): a new file naming an existing Provides requirement while the
  // provider's source changed may assert a changed answer ({materials: [...]}, exports unchanged):
  // breaking. One naming only a requirement new in this land stays additive.
  const shape = commit(root, { 'src/a/index.mjs': 'export function a(x) { return { materials: [x] }; }\n', 'test/a/r5-shape.test.mjs': t('R5 answers {materials}', '{ materials: [1] }') }, 'shape, a new test');
  const w = interfaceChange(root, cfg, 'a', renamed, shape);
  assert.equal(w.exports, null, 'exports unchanged');
  assert.deepEqual(w.provides_test_changes.map((c) => [c.file, c.class]), [['test/a/r5-shape.test.mjs', 'breaking']]);
  assert.match(w.provides_test_changes[0].why, /^added, naming R5 \(Provides before this land\) while a's source changed: it may assert a changed answer$/);
  assert.equal(w.class, 'breaking');
  const fresh = commit(root, { 'req/a.md': req('a', '- **R5** `a(x)` answers the materials\n- **R3** more\n- **R7** `a2()` is new'), 'src/a/index.mjs': 'export function a(x) { return { materials: [x] }; }\nexport const a2 = () => 1;\n', 'test/a/r7.test.mjs': t('R7 answers', '1') }, 'a new requirement, its new test');
  const v = interfaceChange(root, cfg, 'a', shape, fresh);
  assert.deepEqual(v.provides_test_changes.map((c) => [c.file, c.class]), [['test/a/r7.test.mjs', 'additive']]);
  assert.equal(v.class, 'additive');
});

test('module states: rescheduled until a land holds the provider\'s land; deferred when BLOCKED; complete after a land', () => {
  const anc = (a, b) => b === 'h2' && a === 'L1';
  const entries = new Map([['a', { status: { state: 'WORKING' } }], ['b', { status: { state: 'COMPLETE' } }], ['c', { status: { state: 'BLOCKED', reason: 'q' } }], ['e', { status: { state: 'OPEN' } }]]);
  const marks = new Map([['e', ['R1']]]);
  const lands = [{ module: 'a', head: 'h0', pr: 1 }, { module: 'b', head: 'h1', pr: 2 }];
  const reschedules = [{ user: 'b', provider: 'a', provider_land: 'L1', key: 'b<-a' }];
  let s = moduleStates({ mods: ['a', 'b', 'c', 'e'], entries, marks, prs: [], lands, reschedules, anc });
  assert.deepEqual(s.map((x) => x.state), ['complete', 'rescheduled', 'deferred', 'not started']);
  assert.deepEqual(startable(s).map((x) => [x.id, /--reopen "re-test against the new interface of a/.test(x.cmd)]), [['b', true], ['e', false]]);
  // b publishes on a tip holding a's land, and lands: the reschedule is answered.
  s = moduleStates({ mods: ['b'], entries, marks, prs: [], lands: [...lands, { module: 'b', head: 'h2', pr: 3 }], reschedules, anc });
  assert.equal(s[0].state, 'complete');
  assert.deepEqual(outstanding(reschedules, [{ module: 'b', head: 'h2' }], 'b', anc), []);
  // A job open on the module: working (a draft) or published (ready).
  s = moduleStates({ mods: ['a', 'e'], entries, marks, prs: [{ module: 'a', number: 7, draft: false }, { module: 'e', number: 8, draft: true }], lands, reschedules: [], anc });
  assert.deepEqual(s.map((x) => x.state), ['published', 'working']);
});

