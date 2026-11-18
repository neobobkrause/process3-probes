// The shared layer branch (layerflow.mjs, layerbase.mjs; design note "Shared Layer Branch", Bob,
// 5 Nov): one test per rule the tool holds, on a local product with a bare origin.
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { BOT, GATE, block, parseBlock } from '../lib/github.mjs';
import { jobStart, jobSync, startText } from '../lib/job.mjs';
import { bobPrompt } from '../lib/roles.mjs';
import { layerLines } from '../lib/layerflow.mjs';
import { flowFile, jobCfg, layerMap, layersAt } from '../lib/layerbase.mjs';
import {
  flowRows, interfaceChange, interfaceText, layerCover, layerJobs, layerLand, layerMerge, layerOpen, layerPublish, layerReport, layerRetest,
  layerClear, layerJoin, layerStatus, layerSync, layerPin, layerPinOpen, itemsOwed, moduleStates, onlyTicks, openLayer, outstanding, providesText, resultChanges, startable, trialMeasures, writeRows, timeBudget, budgetLine,
} from '../lib/layerflow.mjs';
import { checkLedger } from '../lib/ledger.mjs';
import { fetchState, readState } from '../lib/state.mjs';
import { parseCompletion } from '../lib/completion.mjs';
import { Fail, configOf, git, loadConfig } from '../lib/util.mjs';
import { commit, entry, makeRepo } from './helpers.mjs';

const quiet = () => {};
const SB = 'process-state';
const req = (id, provides = `- ${id}() returns a thing`) => `# ${id} — requirements\n\n## Public\n\n### Purpose\n\n${id} does things.\n\n### Provides\n\n${provides}\n\n## Private\n\n### Uses\n\nnothing\n\n**R1** a requirement *(not yet met: T1)*\n`;
const modules = { modules: [{ id: 'a', uses: [] }, { id: 'b', uses: ['a'] }, { id: 'c', uses: [] }, { id: 'd', uses: ['a'] }] };
const layers = '# The layers\n\n| layer | name | modules |\n| --- | --- | --- |\n| 1 | One | a, b, c |\n| 2 | Two | d |\n';

// A product on the tranche with a bare origin: modules a, b (uses a), c in layer 1, d (uses a) in layer 2.
function product({ strategy = 'layer', over = {}, done = false, config = {} } = {}) {
  const files = {
    'process/config.json': { merge_strategy: strategy, modules_file: 'build/modules.json', ...config },
    'build/layers.md': layers,
    'build/modules.json': modules,
  };
  for (const id of ['a', 'b', 'c', 'd']) {
    files[`process/ledger/${id}.json`] = entry(id, { layer: id === 'd' ? 2 : 1, ...(done ? { status: { state: 'COMPLETE' } } : {}), ...(over[id] || {}) });
    files[`req/${id}.md`] = done ? req(id).replace(' *(not yet met: T1)*', '') : req(id);
    files[`test/${id}/t.test.mjs`] = "import test from 'node:test'; test('ok', () => {});\n";
  }
  files['src/a/index.mjs'] = 'export function a(x) { return x; }\n';
  files['src/b/index.mjs'] = "import { a } from '../a/index.mjs';\nexport const b = () => a(1);\n";
  files['src/c/index.mjs'] = 'export const c = 1;\n';
  files['src/d/index.mjs'] = "import { a } from '../a/index.mjs';\nexport const d = () => a(2);\n";
  const root = makeRepo(files);
  git(['branch', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'origin.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: root });
  git(['fetch', '-q', 'origin'], { cwd: root });
  return { root, bare };
}

// A clone of origin for acts that are not the checkout's (GitHub's merges, another job's push).
function clone(bare) {
  const d = join(mkdtempSync(join(tmpdir(), 'p3-clone-')), 'c');
  git(['clone', '-q', bare, d], { cwd: tmpdir() });
  for (const [k, v] of [['user.email', 'noreply@github.com'], ['user.name', 'Test'], ['commit.gpgsign', 'false']]) git(['config', k, v], { cwd: d });
  return d;
}
// GitHub's merge of head into base: a merge commit titled as given, pushed; { sha, merged }.
function ghMerge(bare, base, head, title) {
  const d = clone(bare);
  git(['checkout', '-q', '-B', 'w', `origin/${base}`], { cwd: d });
  git(['fetch', '-q', 'origin', head], { cwd: d });
  git(['merge', '-q', '--no-ff', '-m', title, head], { cwd: d });
  git(['push', '-q', 'origin', `w:${base}`], { cwd: d });
  return { sha: git(['rev-parse', 'HEAD'], { cwd: d }), merged: true };
}
// A job's work on job/<id> cut from layer/<n> (pushed), with its files; returns the head.
function jobWork(bare, id, files, { n = 1, from = `origin/layer/${n}` } = {}) {
  const d = clone(bare);
  git(['checkout', '-q', '-B', `job/${id}`, from], { cwd: d });
  const h = commit(d, files, `work on ${id}`);
  git(['push', '-q', '-f', 'origin', `job/${id}`], { cwd: d });
  return h;
}
const prOf = (n, id, head, extra = {}) => ({ number: n, state: 'open', draft: false, base: { ref: 'layer/1' }, head: { ref: `job/${id}`, sha: head }, ...extra });
const landIO = (bare, prs, { gate = 'success', open = [], comments = () => [] } = {}) => ({
  slug: 'o/p',
  getPR: (s, k) => prs[k],
  checkRun: () => ({ status: 'completed', conclusion: gate }),
  comments,
  openPRs: () => open,
  merge: (s, k, sha, title) => ghMerge(bare, prs[k].base.ref, sha, title),
  // An additive change's retests (layer retest) are their own tests'.
  retest: () => { throw new Error('no retest in this test'); },
});
const openIO = { slug: 'o/p', openPRs: () => [], comments: () => [] };

test('config: merge_strategy is "layer", the only flow: absent reads as layer; "train" or any other value is refused', () => {
  assert.equal(configOf({}).merge_strategy, 'layer');
  assert.equal(configOf({ merge_strategy: 'layer' }).merge_strategy, 'layer');
  assert.throws(() => configOf({ merge_strategy: 'train' }), /merge_strategy "train": the merge train was removed/);
  assert.throws(() => configOf({ merge_strategy: 'batch' }), /merge_strategy "batch": the merge train was removed/);
});

test('layer map: the modules of each layer, from the layers table', () => {
  assert.deepEqual(layerMap(layers), [{ n: 1, mods: ['a', 'b', 'c'] }, { n: 2, mods: ['d'] }]);
});

test('layer open (R15): a census gap in the layer refuses the open, naming the fix; nothing is cut', () => {
  const { root } = product();
  // c's entry names a requirements file the tranche does not hold, and e is in no layer-map line.
  commit(root, { 'process/ledger/c.json': entry('c', { layer: 1, requirements: 'req/gone.md' }), 'build/modules.json': { modules: [...modules.modules, { id: 'e', layer: 1, uses: [] }] } });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  git(['fetch', '-q', 'origin'], { cwd: root });
  assert.throws(() => layerOpen(root, 1, { io: openIO, log: quiet }), (e) => /layer 1 has 4 gap\(s\) on tranche; land the fixes first, then open the layer; nothing was opened/.test(e.message)
    && /- c \(layer 1\), entry-requirements: its entry names req\/gone\.md/.test(e.message) && /- e \(layer 1\), not-in-layer-map: name e on its layer's line/.test(e.message));
  assert.equal(git(['ls-remote', 'origin', 'refs/heads/layer/1'], { cwd: root }), '', 'nothing cut');
});

test('layer open (PD-4): a COMPLETE module off the layer map is a finding it prints, never a stop', () => {
  const { root } = product();
  commit(root, { 'process/ledger/f.json': entry('f', { layer: 1, status: { state: 'COMPLETE' } }), 'req/f.md': '# f\n', 'build/modules.json': { modules: [...modules.modules, { id: 'f', layer: 1, uses: [] }] } });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  git(['fetch', '-q', 'origin'], { cwd: root });
  const lines = [];
  layerOpen(root, 1, { io: openIO, log: (l) => lines.push(String(l)) });
  assert.ok(lines.some((l) => /^finding: layer 1's module\(s\) f are on no line of build\/layers\.md; BOB names them there \(PD-4: this stops nothing\)/.test(l)), lines.join('\n'));
  assert.notEqual(git(['ls-remote', 'origin', 'refs/heads/layer/1'], { cwd: root }), '', 'the layer is cut');
});

test('layer open: cuts layer/<n> from the tranche tip, records the open, and lists every module that can start', () => {
  const { root } = product();
  const lines = [];
  const r = layerOpen(root, 1, { io: openIO, log: (l) => lines.push(l) });
  assert.equal(r.from, git(['rev-parse', 'origin/tranche'], { cwd: root }));
  assert.equal(git(['ls-remote', 'origin', 'refs/heads/layer/1'], { cwd: root }).split('\t')[0], r.from);
  fetchState(root, SB, { fresh: true });
  assert.equal(JSON.parse(readState(root, SB, flowFile(1, 'open'))).from, r.from);
  // b uses a, which has not landed: listed after the rest (R10).
  assert.deepEqual(r.startable.map((x) => [x.id, x.after || null]), [['a', null], ['c', null], ['b', ['a']]]);
  assert.ok(lines.some((l) => /BOB starts them; no other session creates a job/.test(l)));
  // Again: nothing cut twice, the open kept.
  assert.equal(layerOpen(root, 1, { io: openIO, log: quiet }).from, r.from);
  // The next layer waits for this one's merge.
  assert.throws(() => layerOpen(root, 2, { io: openIO, log: quiet }), /layer 1 is open on layer\/1 and has not merged/);
});

test('job branches: with the switch on, job start cuts job/<id> from layer/<n> and job sync merges the layer, not the tranche', () => {
  const { root } = product();
  git(['branch', 'layer/1', 'tranche'], { cwd: root });
  const cfg = jobCfg(root, configOf({ merge_strategy: 'layer', modules_file: 'build/modules.json' }), 'a', { push: false });
  assert.equal(cfg.tranche, 'layer/1');
  assert.deepEqual(cfg.layer, { n: 1, tranche: 'tranche' });
  // A module of a layer with no branch keeps the tranche.
  assert.equal(jobCfg(root, configOf({ merge_strategy: 'layer' }), 'd', { push: false }).tranche, 'tranche');
  // The layer moves past the tranche (another module's land); the job is cut from the layer.
  git(['checkout', '-q', 'layer/1'], { cwd: root });
  const landed = commit(root, { 'src/c/index.mjs': 'export const c = 2;\n' }, 'c landed');
  git(['checkout', '-q', 'tranche'], { cwd: root });
  jobStart(root, 'a', { coordinator: 's', push: false, log: quiet });
  assert.equal(git(['merge-base', '--is-ancestor', landed, 'job/a'], { cwd: root, allowFail: true }).code, 0, 'job/a is cut from layer/1');
  git(['checkout', '-q', 'job/a'], { cwd: root });
  commit(root, { 'src/a/index.mjs': 'export function a(x) { return x + 1; }\n' }, 'work');
  git(['checkout', '-q', 'layer/1'], { cwd: root });
  const later = commit(root, { 'src/c/index.mjs': 'export const c = 3;\n' }, 'c again');
  git(['checkout', '-q', 'tranche'], { cwd: root });
  const trancheOnly = commit(root, { 'notes.txt': 'tranche only\n' }, 'tranche moves');
  git(['checkout', '-q', 'job/a'], { cwd: root });
  const s = jobSync(root, 'a', { push: false, log: quiet });
  assert.deepEqual(s.merged, ['layer/1']);
  assert.equal(git(['merge-base', '--is-ancestor', later, 'HEAD'], { cwd: root, allowFail: true }).code, 0);
  assert.notEqual(git(['merge-base', '--is-ancestor', trancheOnly, 'HEAD'], { cwd: root, allowFail: true }).code, 0, 'the tranche is not merged into a layer job');
});

test('no job starts outside an open layer (the layer\'s list starts them)', () => {
  const { root } = product();
  git(['branch', 'layer/1', 'tranche'], { cwd: root });
  assert.throws(() => jobStart(root, 'd', { coordinator: 's', push: false, log: quiet }), /d's layer has no open branch/);
});

test('a layer job\'s START names layer publish and the halt on a reschedule; a tranche job\'s keeps job complete', () => {
  const args = { entry: entry('a'), slug: 'o/p', branch: 'job/a', coordinator: 's', bob: 'b', attempt: 1, reading: { files: [], bytes: 0 } };
  const lay = startText({ ...args, tranche: 'layer/1' });
  assert.match(lay, /layer publish a/);
  assert.match(lay, /stop any test run at once/);
  assert.doesNotMatch(lay, /job complete a`/);
  assert.match(startText({ ...args, tranche: 'tranche' }), /job complete a`/);
});

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

async function opened(config = {}) {
  const p = product({ config });
  layerOpen(p.root, 1, { io: openIO, log: quiet });
  return p;
}

test('publish: refused when the job branch touches a file outside its module (ARC-2)', async () => {
  const { root, bare } = await opened();
  jobWork(bare, 'b', { 'src/b/index.mjs': "import { a } from '../a/index.mjs';\nexport const b = () => a(3);\n", 'src/c/index.mjs': 'export const c = 9;\n' });
  git(['fetch', '-q', 'origin'], { cwd: root });
  git(['checkout', '-q', '-B', 'job/b', 'origin/job/b'], { cwd: root });
  let ran = false;
  await assert.rejects(layerPublish(root, 'b', { sync: async () => ({ ok: true }), complete: () => { ran = true; return { done: Promise.resolve({ code: 0 }), kill() {} }; }, log: quiet }), /touches files outside b \(ARC-2\): src\/c\/index.mjs/);
  assert.equal(ran, false, 'nothing ran');
});

test('publish: a red run does not publish; a green one is recorded with the layer tip it ran on', async () => {
  const { root, bare } = await opened();
  jobWork(bare, 'c', { 'src/c/index.mjs': 'export const c = 2;\n' });
  git(['fetch', '-q', 'origin'], { cwd: root });
  git(['checkout', '-q', '-B', 'job/c', 'origin/job/c'], { cwd: root });
  const tip = git(['rev-parse', 'origin/layer/1'], { cwd: root });
  const red = await layerPublish(root, 'c', { sync: async () => ({ ok: true }), complete: () => ({ done: Promise.resolve({ code: 1 }), kill() {} }), log: quiet });
  assert.equal(red.ok, false);
  const green = await layerPublish(root, 'c', { sync: async () => ({ ok: true }), complete: () => ({ done: Promise.resolve({ code: 0 }), kill() {} }), log: quiet });
  assert.equal(green.ok, true);
  fetchState(root, SB, { fresh: true });
  const runs = flowRows(root, SB, 1).runs;
  assert.deepEqual(runs.map((r) => r.result).sort(), ['fail', 'pass']);
  assert.ok(runs.every((r) => r.tested_on === tip));
});

test('halt and restart: a reschedule mid-run kills the run at once, records the minutes lost, and the next round runs on the new tip', async () => {
  const { root, bare } = await opened();
  jobWork(bare, 'b', { 'src/b/index.mjs': "import { a } from '../a/index.mjs';\nexport const b = () => a(4);\n" });
  git(['fetch', '-q', 'origin'], { cwd: root });
  git(['checkout', '-q', '-B', 'job/b', 'origin/job/b'], { cwd: root });
  // a lands on the layer while b's first run goes; the land's reschedule names b.
  const aHead = jobWork(bare, 'a', { 'src/a/index.mjs': 'export function a(x, y) { return x + y; }\nexport const a2 = 1;\n' });
  let killed = 0;
  let round = 0;
  const tips = [];
  const res = await layerPublish(root, 'b', {
    every: 20,
    sync: async () => { git(['fetch', '-q', 'origin'], { cwd: root }); if (round > 0) git(['merge', '-q', '--no-edit', 'origin/layer/1'], { cwd: root }); return { ok: true }; },
    complete: () => {
      round++;
      tips.push(git(['rev-parse', 'origin/layer/1'], { cwd: root }));
      if (round === 1) {
        let end;
        const done = new Promise((r) => { end = r; });
        const land = ghMerge(bare, 'layer/1', aHead, 'Merge layer PR 5');
        const w = clone(bare);
        writeRows(w, SB, 'reschedule', [[flowFile(1, 'reschedule', 'b-a-x'), { row: 'reschedule', layer: 1, user: 'b', provider: 'a', provider_land: land.sha, at: new Date().toISOString(), key: 'b<-a' }]]);
        return { done, kill: () => { killed++; end({ code: 143 }); } };
      }
      return { done: Promise.resolve({ code: 0 }), kill() {} };
    },
    log: quiet,
  });
  assert.equal(killed, 1, 'the first run was killed');
  assert.equal(res.ok, true);
  assert.equal(res.round, 2);
  assert.notEqual(tips[0], tips[1], 'the second round ran on the new layer tip');
  fetchState(root, SB, { fresh: true });
  const runs = flowRows(root, SB, 1).runs;
  const halted = runs.find((r) => r.result === 'halted');
  assert.ok(halted && halted.minutes_lost >= 0 && halted.by.includes('b<-a'));
  assert.equal(runs.find((r) => r.result === 'pass').round, 2);
});

test('land: refused on a gate that is not green, and on a file outside the module', async () => {
  const { root, bare } = await opened();
  const h = jobWork(bare, 'c', { 'src/c/index.mjs': 'export const c = 2;\n' });
  await assert.rejects(layerLand(root, 3, { io: landIO(bare, { 3: prOf(3, 'c', h) }, { gate: 'failure' }), log: quiet }), /gate on .* is completed failure/);
  const h2 = jobWork(bare, 'c', { 'src/a/index.mjs': 'export const z = 1;\n' });
  await assert.rejects(layerLand(root, 4, { io: landIO(bare, { 4: prOf(4, 'c', h2) }), log: quiet }), /changes files outside c \(ARC-2\): src\/a\/index.mjs/);
});

test('land: no combined re-test; an interface change reschedules users in the layer and leaves a notice for later layers', async () => {
  const { root, bare } = await opened();
  // c lands first; a's PR is behind the layer tip and lands anyway (disjoint files).
  const hc = jobWork(bare, 'c', { 'src/c/index.mjs': 'export const c = 2;\n' });
  const ha = jobWork(bare, 'a', { 'src/a/index.mjs': 'export function a(x, y) { return x + y; }\nexport const a2 = 1;\n' });
  const prs = { 1: prOf(1, 'c', hc), 2: prOf(2, 'a', ha) };
  const lines = [];
  const rc = await layerLand(root, 1, { io: landIO(bare, prs), log: quiet });
  assert.equal(rc.land.interface.changed, false);
  assert.deepEqual(rc.land.users_rescheduled, []);
  const ra = await layerLand(root, 2, { io: landIO(bare, prs, { open: [{ number: 9, head: { ref: 'job/b' } }] }), log: (l) => lines.push(l) });
  assert.equal(ra.land.interface.changed, true);
  assert.deepEqual(ra.land.users_rescheduled, ['b']);
  assert.deepEqual(ra.land.users_noticed, ['d']);
  assert.ok(lines.some((l) => /BOB delivers to job b's session \(PR 9\), with send_message priority now: .*Halt any test run now/.test(l)));
  fetchState(root, SB, { fresh: true });
  const rows = flowRows(root, SB, 1);
  assert.equal(rows.reschedules.length, 1);
  assert.equal(rows.reschedules[0].provider_land, ra.land.merge);
  assert.deepEqual(rows.reschedules[0].triggers, ['exports']);
  const notice = JSON.parse(readState(root, SB, 'notices/a-2.json'));
  assert.deepEqual(notice.users, ['d']);
});

test('land: a run that started before a provider\'s newest interface change never counts', async () => {
  const { root, bare } = await opened();
  const hb = jobWork(bare, 'b', { 'src/b/index.mjs': "import { a } from '../a/index.mjs';\nexport const b = () => a(5);\n" });
  const ha = jobWork(bare, 'a', { 'src/a/index.mjs': 'export function a(x, y) { return x + y; }\nexport const a2 = 1;\n' });
  const prs = { 1: prOf(1, 'a', ha), 2: prOf(2, 'b', hb) };
  await layerLand(root, 1, { io: landIO(bare, prs), log: quiet });
  await assert.rejects(layerLand(root, 2, { io: landIO(bare, prs), log: quiet }), /started before a's interface change .* it never counts/);
  // b brings itself up to the layer tip and publishes again: its land counts and answers the reschedule.
  const d = clone(bare);
  git(['checkout', '-q', '-B', 'job/b', 'origin/job/b'], { cwd: d });
  git(['merge', '-q', '--no-edit', 'origin/layer/1'], { cwd: d });
  git(['push', '-q', 'origin', 'job/b'], { cwd: d });
  const hb2 = git(['rev-parse', 'HEAD'], { cwd: d });
  prs[3] = prOf(3, 'b', hb2);
  await layerLand(root, 3, { io: landIO(bare, prs), log: quiet });
  const st = layerStatus(root, 1, { io: openIO, log: quiet }).states;
  assert.equal(st.find((s) => s.id === 'b').state, 'complete');
});

test('jobs and merge: a rescheduled module whose PR landed is listed to reopen; the layer merges only when every module is complete or deferred', async () => {
  // A deploy block: the merge hands the round-close run its turn (Bob, 7 Nov: tool-started).
  const { root, bare } = await opened({ deploy: { slug_prefix: 'p3dev-', dry_run: ['true'], deploy: ['true'], walk: ['true'], guard_line: 'ok' } });
  const hb = jobWork(bare, 'b', { 'src/b/index.mjs': "import { a } from '../a/index.mjs';\nexport const b = () => a(6);\n" });
  const hc = jobWork(bare, 'c', { 'src/c/index.mjs': 'export const c = 2;\n' });
  const prs = { 1: prOf(1, 'b', hb), 2: prOf(2, 'c', hc) };
  await layerLand(root, 1, { io: landIO(bare, prs), log: quiet });
  await layerLand(root, 2, { io: landIO(bare, prs), log: quiet });
  const ha = jobWork(bare, 'a', { 'src/a/index.mjs': 'export class a { constructor(x, y) { this.v = x * y; } }\n' });
  prs[3] = prOf(3, 'a', ha);
  await layerLand(root, 3, { io: landIO(bare, prs), log: quiet });
  const j = layerJobs(root, 1, { io: openIO, log: quiet });
  assert.deepEqual(j.startable.map((x) => x.id), ['b']);
  // b is OPEN (it never ran): a plain start, never --reopen (coordinator, 6 Nov 16:03).
  assert.equal(j.startable[0].cmd, 'node .process/tool/p3.mjs job start b --sessions <file>');
  const mio = (extra = {}) => ({ slug: 'o/p', openPRs: () => [], findPR: () => null, createPR: (s, p) => ({ number: 50, ...p, base: { ref: p.base } }), checkRun: () => ({ status: 'completed', conclusion: 'success' }), merge: (s, k, sha, title) => ghMerge(bare, 'tranche', sha, title), ...extra });
  await assert.rejects(layerMerge(root, 1, { io: mio(), wait: false, log: quiet }), /b is rescheduled/);
  // b's job re-runs on the new tip and lands; now the layer merges, with no test run.
  const d = clone(bare);
  git(['checkout', '-q', '-B', 'job/b', 'origin/job/b'], { cwd: d });
  git(['merge', '-q', '--no-edit', 'origin/layer/1'], { cwd: d });
  git(['push', '-q', 'origin', 'job/b'], { cwd: d });
  prs[4] = prOf(4, 'b', git(['rev-parse', 'HEAD'], { cwd: d }));
  await layerLand(root, 4, { io: landIO(bare, prs), log: quiet });
  // An open publish PR holds the merge.
  await assert.rejects(layerMerge(root, 1, { io: mio({ openPRs: () => [{ number: 60, draft: true, head: { ref: 'job/c' } }] }), wait: false, log: quiet }), /c is working/);
  const asked = [];
  const m = await layerMerge(root, 1, { io: mio({ roundClose: (r, o) => { asked.push(o.by); return { ran: false, owed: null }; } }), wait: false, log: quiet });
  assert.equal(m.ok, true);
  assert.deepEqual([asked, m.round], [['layer merge 1'], { ran: false, owed: null }], 'the merge, recorded, asks the round-close run once');
  fetchState(root, SB, { fresh: true });
  assert.equal(JSON.parse(readState(root, SB, flowFile(1, 'merged'))).layer, 1);
  const closed = readState(root, SB, 'layers/closed.jsonl').trim().split('\n').map((l) => JSON.parse(l));
  assert.deepEqual(closed.map((r) => [r.layer, r.by, r.suites.length]), [[1, 'layer merge', 0]]);
  git(['fetch', '-q', 'origin'], { cwd: root });
  assert.equal(git(['merge-base', '--is-ancestor', 'origin/layer/1', 'origin/tranche'], { cwd: root, allowFail: true }).code, 0);
  // Now layer 2 opens; a merged layer no longer bases its modules' jobs.
  assert.equal(layerOpen(root, 2, { io: openIO, log: quiet }).ok, true);
  assert.equal(jobCfg(root, configOf({ merge_strategy: 'layer', modules_file: 'build/modules.json' }), 'a').tranche, 'tranche');
  // The trial's measures.
  const rep = layerReport(root, 1, { log: quiet }).measures;
  assert.equal(rep.lands, 4);
  assert.equal(rep.reschedules, 1);
  assert.equal(typeof rep.hours_open_to_merged, 'number');
});

// The time budget (R9): the land records the PR's gate runs as state rows (the gate's own token
// only reads), and layer report sums each module's starts, wall, local test, gate and work minutes.
test('time budget: a land writes its gate runs as rows; layer report sums them with the test and publish runs', async () => {
  const { root, bare } = await opened();
  const hc = jobWork(bare, 'c', { 'src/c/index.mjs': 'export const c = 3;\n' });
  const prs = { 1: prOf(1, 'c', hc) };
  const gateRows = [
    { sha: hc, run_id: 71, at: '2026-11-06T10:00:00Z', trigger: 'record', suite: 'skipped', ok: true, minutes: 0.5 },
    { sha: hc, run_id: 72, at: '2026-11-06T10:10:00Z', trigger: 'code', suite: 'pass', ok: true, minutes: 6, scope: ['c'], suite_seconds: 240, suite_by_module: { c: 240 } },
    // GitHub's re-run of run 72 keeps its run id: its own row, not lost to the first.
    { sha: hc, run_id: 72, run_attempt: 2, at: '2026-11-06T10:20:00Z', trigger: 'code', suite: 'pass', ok: true, minutes: 5, scope: ['c'], suite_seconds: 180, suite_by_module: { c: 180 } },
  ];
  const comments = () => [{ user: { login: BOT }, body: block(GATE, { runs: gateRows }) }];
  await layerLand(root, 1, { io: landIO(bare, prs, { comments }), log: quiet });
  fetchState(root, SB, { fresh: true });
  const rows = flowRows(root, SB, 1);
  assert.deepEqual(rows.gates.map((g) => [g.module, g.pr, g.run_id, g.run_attempt, g.minutes, g.suite_minutes, g.record_only]), [['c', 1, 71, null, 0.5, null, true], ['c', 1, 72, null, 6, 4, false], ['c', 1, 72, 2, 5, 3, false]]);
  // A p3 test run and a publish run of c, after the opening.
  const open = rows.open.at;
  const later = (m) => new Date(Date.parse(open) + m * 60000).toISOString();
  writeRows(root, SB, 'rows', [
    [flowFile(1, 'test', 'c-1'), { row: 'test', layer: 1, module: 'c', session: 'session_x', started: later(1), ended: later(3), at: later(3), minutes: 2, result: 'pass' }],
    [flowFile(1, 'run', 'c-1'), { row: 'run', layer: 1, module: 'c', round: 1, started: later(4), ended: later(7), at: later(7), minutes: 3, result: 'pass' }],
  ]);
  const rep = layerReport(root, 1, { log: quiet }).measures.time_budget;
  const c = rep.per_module.find((x) => x.id === 'c');
  // The publish run runs no suite (job complete; the gate runs it): apart from the tests.
  assert.deepEqual([c.test_runs, c.local_test_minutes, c.publish_runs, c.publish_minutes, c.gate_runs, c.gate_minutes, c.gate_suite_minutes, c.gate_record_only_minutes], [1, 2, 1, 3, 3, 11.5, 7, 0.5]);
  assert.equal(rep.total.gate_minutes, 11.5);
});

test('time budget: wall from each start to its complete, work is wall minus local tests, null when unknown', () => {
  const at = (m) => new Date(Date.UTC(2026, 10, 6, 10, m)).toISOString();
  const attempts = {
    a: [
      { row: 'attempt', event: 'start', attempt: 1, at: at(0) }, { row: 'attempt', event: 'complete', attempt: 1, at: at(30) },
      { row: 'attempt', event: 'start', attempt: 2, at: at(40) }, { row: 'attempt', event: 'complete', attempt: 2, at: at(50) },
      { row: 'attempt', event: 'start', attempt: 0, at: '2026-11-05T00:00:00Z' }, // before the opening
    ],
    b: [{ row: 'attempt', event: 'start', attempt: 1, at: at(5) }], // still open: wall unknown
  };
  // a's tests: one inside its first attempt (counted against its wall), one after its last
  // complete (a gate-red fix: no wall here, so not subtracted from work).
  const tests = [{ module: 'a', minutes: 4, started: at(16), ended: at(20), at: at(20) }, { module: 'a', minutes: 2, started: at(55), ended: at(57), at: at(57) }, { module: 'b', minutes: 3, started: at(6), ended: at(9), at: at(9) }];
  const runs = [{ module: 'a', minutes: 6, at: at(29) }];
  const gates = [{ module: 'a', minutes: 7, suite_minutes: 5, record_only: false }, { module: 'a', minutes: 1, suite_minutes: null, record_only: true }, { module: 'a', minutes: null, suite_minutes: null, record_only: false }];
  const b = timeBudget(['b', 'a'], { attempts, tests, runs, gates, since: '2026-11-06T09:00:00Z' });
  assert.deepEqual(b.per_module.map((x) => [x.id, x.starts, x.open_attempts, x.wall_minutes, x.local_test_minutes, x.tests_in_wall_minutes, x.publish_minutes, x.gate_minutes, x.gate_unknown_runs, x.gate_suite_minutes, x.gate_record_only_minutes, x.work_minutes]), [
    ['a', 2, 0, 40, 6, 4, 6, 8, 1, 5, 1, 36],
    ['b', 1, 1, null, 3, 0, 0, 0, 0, 0, 0, null],
  ]);
  assert.deepEqual(b.total, { starts: 3, wall_minutes: 40, wall_unknown_modules: 1, local_test_minutes: 9, publish_minutes: 6, gate_minutes: 8, gate_unknown_runs: 1, gate_suite_minutes: 5, gate_record_only_minutes: 1, work_minutes: 36, test_share: 0.1, test_per_work: 0.11 });
  assert.equal(budgetLine(b), 'time budget: 3 start(s); wall 40 min (1 module(s) unknown); local tests 9 min; publish runs 6 min; gate 8 min on landed PRs (suites 5, record-only 1, 1 run(s) of unknown length); work 36 min; tests 10% of wall, 0.11 per minute of work');
  // Nothing known: nulls, never a guess.
  const none = timeBudget(['b'], { attempts: { b: attempts.b } });
  assert.deepEqual([none.total.wall_minutes, none.total.work_minutes, none.total.test_share, none.total.test_per_work], [null, null, null, null]);
});

test('layer merge refuses a committed generated file stale on the layer, naming the file and its regenerate (the coordinator, 6 Nov: order.mjs)', async () => {
  const { root, bare } = product({ done: true, config: { generated: [{ paths: ['gen/order.mjs'], regenerate: ['node', '-e', "require('fs').writeFileSync('gen/order.mjs','new\\n')"], verify: ['node', '-e', '0'] }] } });
  commit(root, { 'gen/order.mjs': 'old\n' }, 'a committed generated file, stale');
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  git(['fetch', '-q', 'origin'], { cwd: root });
  layerOpen(root, 1, { io: openIO, log: quiet });
  const mio = { slug: 'o/p', openPRs: () => [], findPR: () => null, createPR: () => assert.fail('no PR on a stale file'), checkRun: () => ({ status: 'completed', conclusion: 'success' }), merge: (s, k, sha, title) => ghMerge(bare, 'tranche', sha, title) };
  const lines = [];
  await assert.rejects(layerMerge(root, 1, { io: mio, wait: false, log: (l) => lines.push(l) }), /layer 1 cannot merge: the layer checks found 1 finding/);
  assert.ok(lines.some((l) => /^generated: gen\/order\.mjs: gen\/order\.mjs is stale on layer\/1 \S+: run node -e .* and commit it \(a plain pull request into layer\/1\), then .*layer merge 1 again$/.test(l)), lines.join('\n'));
});

test('layer merge runs the layer checks but no module suite: a red entry check refuses the merge; green, it merges and still no suite ran', async () => {
  const marker = join(mkdtempSync(join(tmpdir(), 'p3-mark-')), 'suite-ran');
  const suite = { cwd: '.', command: ['node', '-e', `require('fs').writeFileSync(${JSON.stringify(marker)}, '1')`, '--test'] };
  const flag = join(mkdtempSync(join(tmpdir(), 'p3-flag-')), 'red');
  const check = ['node', '-e', `process.exit(require('fs').existsSync(${JSON.stringify(flag)}) ? 3 : 0)`];
  const { root, bare } = product({ done: true, over: { a: { suite }, b: { suite }, c: { suite, checks: [check] } } });
  layerOpen(root, 1, { io: openIO, log: quiet });
  const { writeFileSync, existsSync } = await import('node:fs');
  writeFileSync(flag, '1');
  const mio = { slug: 'o/p', openPRs: () => [], findPR: () => null, createPR: (s, p) => ({ number: 70, ...p, base: { ref: p.base } }), checkRun: () => ({ status: 'completed', conclusion: 'success' }), merge: (s, k, sha, title) => ghMerge(bare, 'tranche', sha, title) };
  let opened = 0;
  await assert.rejects(layerMerge(root, 1, { io: { ...mio, createPR: (...a) => { opened++; return mio.createPR(...a); } }, wait: false, log: quiet }), /the layer checks found 1 finding\(s\).*no module suite ran/);
  assert.equal(opened, 0, 'no PR opened on a red layer check');
  assert.equal(existsSync(marker), false, 'no module suite ran');
  const { rmSync } = await import('node:fs');
  rmSync(flag);
  assert.equal((await layerMerge(root, 1, { io: mio, wait: false, log: quiet })).ok, true);
  assert.equal(existsSync(marker), false, 'no module suite ran at the merge either');
});

test('the gate\'s layer trigger: each module covered by a verified green land; a provider\'s later interface change is a finding, nothing re-runs', async () => {
  const { root, bare } = await opened();
  const hc = jobWork(bare, 'c', { 'src/c/index.mjs': 'export const c = 2;\n' });
  const hb = jobWork(bare, 'b', { 'src/b/index.mjs': "import { a } from '../a/index.mjs';\nexport const b = () => a(7);\n" });
  const ha = jobWork(bare, 'a', { 'src/a/index.mjs': 'export function a(x, y) { return x - y; }\nexport const a2 = 1;\n' });
  const prs = { 1: prOf(1, 'c', hc), 2: prOf(2, 'b', hb), 3: prOf(3, 'a', ha) };
  const mergedAs = {};
  const io0 = landIO(bare, prs);
  const io = { ...io0, merge: (s, k, sha, t) => { const r = io0.merge(s, k, sha, t); mergedAs[k] = r.sha; return r; } };
  await layerLand(root, 1, { io, log: quiet });
  await layerLand(root, 2, { io, log: quiet });
  await layerLand(root, 3, { io, log: quiet });
  git(['fetch', '-q', 'origin'], { cwd: root });
  const head = git(['rev-parse', 'origin/layer/1'], { cwd: root });
  const mb = git(['merge-base', head, 'origin/tranche'], { cwd: root });
  const changed = git(['diff', '--name-only', mb, head], { cwd: root }).split('\n').filter(Boolean);
  const entries = ['a', 'b', 'c', 'd'].map((id) => JSON.parse(git(['show', `${head}:process/ledger/${id}.json`], { cwd: root })));
  const merged = Object.fromEntries(Object.entries(prs).map(([k, p]) => [k, { ...p, merged: true, merge_commit_sha: mergedAs[k] }]));
  const gio = { getPR: (s, k) => merged[k], verify: () => true };
  const runsOf = (k) => [{ sha: prs[k].head.sha, ok: true, trigger: 'code', suite: 'pass', scope: [prs[k].head.ref.slice(4)] }];
  const cfg = configOf({ merge_strategy: 'layer', modules_file: 'build/modules.json' });
  // The gate rows are read through io.comments, as the gate's job post writes them.
  const cover = (over = {}) => layerCover(root, cfg, { head, mb, branch: 'layer/1', changed, entries, slug: 'o/p', io: { ...gio, ...over } });
  const withRows = { comments: (s, k) => [{ user: { login: BOT }, body: block(GATE, { runs: runsOf(k) }, 'gate') }] };
  const r = cover(withRows);
  // b's run did not hold a's interface change (a landed after it): a finding; a and c covered.
  assert.deepEqual(r.covered.map((x) => x.id).sort(), ['a', 'c']);
  assert.equal(r.findings.length, 1);
  assert.match(r.findings[0].message, /b's last green run .* did not hold the interface change of a/);
  // With no verified gate run, a land covers nothing.
  const none = cover({ ...withRows, verify: () => false });
  assert.equal(none.covered.length, 0);
  assert.ok(none.findings.every((f) => f.check === 'layer'));
});

// C13 (the coordinator, 7 Nov): PR 696, opened by the suspended account, reads 404; layer 9's merge
// gate failed on it. A landed PR GitHub no longer serves is judged from the state branch's land row
// for that merge and its gate run's own artifact, recorded pr_unreadable; one with no land row fails closed.
test('the layer gate: a landed PR that reads 404 is covered from its land row and its gate run artifact; with no land row, not covered', async () => {
  const { root, bare } = await opened();
  const hc = jobWork(bare, 'c', { 'src/c/index.mjs': 'export const c = 2;\n' });
  const prs = { 1: prOf(1, 'c', hc) };
  const run = { sha: hc, ok: true, trigger: 'code', suite: 'pass', scope: ['c'], run_id: 77, run_attempt: 1, at: '2026-11-07T01:00:00Z' };
  await layerLand(root, 1, { io: landIO(bare, prs, { comments: () => [{ user: { login: BOT }, body: block(GATE, { runs: [run] }, 'gate') }] }), log: quiet });
  git(['fetch', '-q', 'origin'], { cwd: root });
  const head = git(['rev-parse', 'origin/layer/1'], { cwd: root });
  const mb = git(['merge-base', head, 'origin/tranche'], { cwd: root });
  const changed = git(['diff', '--name-only', mb, head], { cwd: root }).split('\n').filter(Boolean);
  const entries = ['a', 'b', 'c', 'd'].map((id) => JSON.parse(git(['show', `${head}:process/ledger/${id}.json`], { cwd: root })));
  const cfg = configOf({ merge_strategy: 'layer', modules_file: 'build/modules.json' });
  const gone = () => { throw new Fail('gh api repos/o/p/pulls/1 failed: gh: Not Found (HTTP 404)'); };
  const seen = [];
  const io = { getPR: gone, comments: gone, runState: () => 'served', runArtifactRow: (s, id) => (id === 77 ? run : null), verify: (s, r, ctx) => { seen.push(ctx); return r.run_id === 77; } };
  const r = layerCover(root, cfg, { head, mb, branch: 'layer/1', changed, entries, slug: 'o/p', io });
  const c = r.covered.find((x) => x.id === 'c');
  assert.ok(c, JSON.stringify(r));
  assert.match(c.pr_unreadable, /HTTP 404/);
  assert.equal(seen[0].merged.branch, 'job/c', 'the run is bound to the module\'s job branch');
  // Not a 404: fails closed, as before.
  assert.throws(() => layerCover(root, cfg, { head, mb, branch: 'layer/1', changed, entries, slug: 'o/p', io: { ...io, getPR: () => { throw new Fail('gh api failed: HTTP 502'); } } }), /HTTP 502/);
  // An artifact that is another run's: not covered (cold review of C13).
  const other = layerCover(root, cfg, { head, mb, branch: 'layer/1', changed, entries, slug: 'o/p', io: { ...io, runArtifactRow: () => ({ ...run, run_id: 78 }) } });
  assert.ok(!other.covered.some((x) => x.id === 'c'));
  // No verified run: not covered, said why.
  const r2 = layerCover(root, cfg, { head, mb, branch: 'layer/1', changed, entries, slug: 'o/p', io: { ...io, verify: () => false } });
  assert.ok(!r2.covered.some((x) => x.id === 'c'));
  assert.ok(r2.findings.some((f) => /c changed with no land|GitHub does not serve the PR/.test(f.message)), JSON.stringify(r2.findings));
});

