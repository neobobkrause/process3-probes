// ===== file: exports.test.mjs (continued) =====

    'prov/test/a.test.mjs': "import { helper } from '../src/internal.mjs';\n",
  });
  const opts = { isProviderSource: (f) => f.startsWith('prov/src/'), inProvider: (f) => f.startsWith('prov/'), providerPaths: ['prov/src/'] };
  assert.deepEqual(entryFiles(root, 'HEAD', opts), ['prov/src/index.mjs']);
  commit(root, { 'user/a.mjs': "import { f } from '../prov/src/index.mjs';\n" });
  assert.deepEqual(entryFiles(root, 'HEAD', opts), ['prov/src/index.mjs']);
});

// Copy PR 696 (action-records, c06702976d): three private methods were added above the public
// lawEntries, one holding a regular expression with a quote; the reader lost every later member
// and the land read "removed ActionRecords.lawEntries".
test('private #methods, a regular expression holding a quote or brace, accessors, static blocks and class fields lose no later member', () => {
  const before = 'export class ActionRecords {\n  records() { return []; }\n  lawEntries(laws) { return laws; }\n}\n';
  const after = 'export class ActionRecords {\n  records() { return []; }\n  #activeLayers(laws) { return laws.filter((l) => l.active); }\n  #ambiguousLaw(law) { return /[^\'"]+/.test(law.name) && law.n / 2 > 1; }\n  #proposedLayers(laws) { return laws.map((l) => ({ ...l, re: /\\}/ })); }\n  lawEntries(laws) { return this.#activeLayers(laws); }\n}\n';
  const b = surface({ 'p/a.mjs': before }, 'p/a.mjs');
  const a = surface({ 'p/a.mjs': after }, 'p/a.mjs');
  assert.deepEqual(a, b, 'the same public surface');
  assert.equal(a['ActionRecords.lawEntries'], '(laws)');
  const more = surface({ 'p/a.mjs': 'export class A {\n  #cache = new Map();\n  static #count = 0;\n  count = 0;\n  handler = (x) => {\n    return x;\n  };\n  static { A.ready = true; }\n  get #size() { return 1; }\n  set #size(v) {}\n  static #make() {}\n  async #load() {}\n  *#gen() {}\n  run() { return this.#helper(); }\n  #helper() { return 1; }\n  get size() { return 1; }\n  later(x) { return x; }\n}\n' }, 'p/a.mjs');
  assert.deepEqual(more, { A: 'class', 'A.run': '()', 'A.size': 'get', 'A.later': '(x)' });
});

// Cold review of R8: a slash after a postfix ++/--, a TypeScript non-null !, or a property named like
// a keyword (`.of`) divides; a field's initializer continued on the next line is no member.
test('a division after a postfix, a non-null ! or a keyword-named property, and a field continued on the next line, lose no member', () => {
  const s = surface({ 'p/a.mjs': "export class A {\n  f(i, n) { return i-- / n + '/'; }\n  g(x, n) { return x! / n + `/${n}`; }\n  h(s) { return s.of / 2 + `/x`; }\n  total = 1 +\n    base();\n  pub() {}\n}\nexport function z(q) {}\n" }, 'p/a.mjs');
  assert.deepEqual(s, { A: 'class', 'A.f': '(i, n)', 'A.g': '(x, n)', 'A.h': '(s)', 'A.pub': '()', z: 'function(q)' });
});

// ===== file: layer.test.mjs =====

// Build Plan Phase 3: a layer ready to close, layer close, and the next layer (INT-4, ARC-4).
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { layerClose } from '../lib/layer.mjs';
import { CLOSED_FILE, status } from '../lib/status.mjs';
import { git } from '../lib/util.mjs';
import { commit, entry, makeRepo, openPassed } from './helpers.mjs';

const quiet = () => {};
const unmet = (n) => Array.from({ length: n }, (_, i) => `- **R${i + 1}** *(not yet met: x)* text`).join('\n') + '\n- **R99** met\n';
const LAYERS = '| layer | what | modules |\n|---|---|---|\n| 1 | first | a, b |\n| 2 | next | d |\n';
const done = (id) => entry(id, { requirements: `build/requirements/${id}.md`, status: { state: 'COMPLETE' } });
const base = {
  'build/layers.md': LAYERS,
  'build/requirements/a.md': unmet(2),
  'build/requirements/b.md': unmet(0),
  'build/requirements/d.md': unmet(1),
  'process/ledger/a.json': done('a'),
  'process/ledger/b.json': done('b'),
};

// The state branch, as origin's copy, holding the given closed rows.
function closedOn(root, rows) {
  git(['checkout', '-q', '--orphan', 's'], { cwd: root });
  git(['rm', '-rqf', '.'], { cwd: root });
  commit(root, { [CLOSED_FILE]: rows.map((r) => JSON.stringify({ row: 'closed', tranche: 'tranche', ...r })).join('\n') + '\n' });
  git(['update-ref', 'refs/remotes/origin/process-state', 'HEAD'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  git(['branch', '-D', 's'], { cwd: root });
}

test('layer ready to close with marks left: no next work in it, BOB\'s act is layer close', () => {
  const root = makeRepo(base);
  openPassed(root);
  const out = [];
  const r = status(root, { role: 'bob', offline: true, log: (m) => out.push(m) });
  assert.equal(r.layer.cur.n, 1);
  assert.equal(r.layer.ready, true);
  assert.deepEqual(r.next, []);
  assert.match(out.join('\n'), /^layer 1 ready to close: node \.process\/tool\/p3\.mjs layer close 1$/m);
  assert.doesNotMatch(out.join('\n'), /next work/);
});

test('layer not ready while a module of it has an open job', () => {
  const root = makeRepo({ ...base, 'process/ledger/b.json': entry('b', { requirements: 'build/requirements/b.md' }) });
  const out = [];
  const r = status(root, { role: 'bob', offline: true, log: (m) => out.push(m) });
  assert.equal(r.layer.cur.n, 1);
  assert.equal(r.layer.ready, false);
  assert.doesNotMatch(out.join('\n'), /ready to close/);
});

test('a closed layer: the next layer is listed, its deferred marks shown and not listed as work', () => {
  const root = makeRepo(base);
  const tip = git(['rev-parse', 'HEAD'], { cwd: root });
  closedOn(root, [{ layer: 1, commit: tip, deferred: { a: ['R1', 'R2'] } }]);
  openPassed(root);
  const out = [];
  const r = status(root, { role: 'bob', offline: true, log: (m) => out.push(m) });
  assert.equal(r.layer.cur.n, 2);
  assert.deepEqual(r.next.map((x) => x.file), ['build/requirements/d.md']);
  assert.deepEqual(r.layer.deferred, [{ layer: 1, id: 'a', count: 2 }]);
  assert.match(out.join('\n'), /deferred at layer close \(not work\):\n- a \(layer 1\): 2\n/);
  assert.match(out.join('\n'), /next work, layer 2 .*\n- build\/requirements\/d\.md: 1 \(layer 2\)$/);
  // A row whose commit is already on main (a tranche merged before) does not count.
  git(['update-ref', 'refs/remotes/origin/main', tip], { cwd: root });
  assert.equal(status(root, { role: 'bob', offline: true, log: quiet }).layer.cur.n, 1);
  // Online, GitHub's compare says whether it is on main (a shallow clone cannot): here it is not.
  git(['update-ref', '-d', 'refs/remotes/origin/main'], { cwd: root });
  git(['remote', 'add', 'origin', join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'p.git')], { cwd: root });
  const asked = [];
  const on = (ahead) => ({ openPRs: () => [], checkRun: () => null, compare: (s, b, h) => { asked.push([s, b, h]); return { ahead_by: ahead }; } });
  assert.equal(status(root, { role: 'bob', log: quiet, io: on(1) }).layer.cur.n, 2);
  assert.deepEqual(asked.at(-1).slice(1), ['main', tip]);
  assert.equal(status(root, { role: 'bob', log: quiet, io: on(0) }).layer.cur.n, 1);
});

function withOrigin(files) {
  const root = makeRepo(files);
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  return { root, bare };
}
const io = { openPRs: () => [], checkRun: () => null, compare: () => null };
const PASS = "import test from 'node:test';\ntest('ok', () => {});\n";
const FAIL = "import test from 'node:test';\ntest('no', () => { throw new Error('x'); });\n";

test('layer close: runs the suites on the tranche tip, records the close with its deferred marks, prints the next layer', () => {
  const { root, bare } = withOrigin({ ...base, 'process/ledger/a.json': { ...done('a'), tests: ['test/a/'] }, 'test/a/x.test.mjs': PASS, 'process/ledger/b.json': { ...done('b'), tests: ['test/b/'] }, 'test/b/x.test.mjs': PASS });
  const out = [];
  const r = layerClose(root, '1', { io, log: (m) => out.push(m) });
  assert.equal(r.ok, true);
  assert.match(out.at(-1), /^next act: node \.process\/tool\/p3\.mjs job start --ready --live <n>/, 'BOB closing the layer starts its ready jobs next');
  const row = JSON.parse(git(['show', `process-state:${CLOSED_FILE}`], { cwd: bare }));
  assert.equal(row.layer, 1);
  assert.equal(row.commit, git(['rev-parse', 'tranche'], { cwd: bare }));
  assert.deepEqual(row.deferred, { a: ['R1', 'R2'] });
  assert.match(out.join('\n'), /layer 1 closed at tranche .*; deferred: a 2[\s\S]*next work, layer 2[\s\S]*- build\/requirements\/d\.md: 1/);
  // BOB closing (the default sender) is awake: no wake line.
  assert.equal(r.wake, null);
  assert.doesNotMatch(out.join('\n'), /wake BOB/);
  // Another session's close gives BOB new work (measured 3-4 Nov: BOB idles until woken): its last
  // line is the wake, runnable as printed, from --as.
  const { root: other } = withOrigin({ ...base, 'process/ledger/a.json': { ...done('a'), tests: ['test/a/'] }, 'test/a/x.test.mjs': PASS, 'process/ledger/b.json': { ...done('b'), tests: ['test/b/'] }, 'test/b/x.test.mjs': PASS });
  const said = [];
  const w = layerClose(other, '1', { io, as: 'coordinator', log: (m) => said.push(m) });
  assert.equal(said.at(-1), 'next act: wake BOB with `node .process/tool/p3.mjs send bob "layer 1 closed: node .process/tool/p3.mjs job start --ready --live <n>, then status" --from coordinator`, delivered with send_message to the address it prints');
  assert.equal(w.wake, said.at(-1));
  // Closed, it is no longer the open layer.
  assert.throws(() => layerClose(root, '1', { io, log: quiet }), /layer 1 is not the open layer; the open layer is 2/);
});

test('layer close: a red suite records nothing; a layer with an open job is refused', () => {
  const { root, bare } = withOrigin({ ...base, 'process/ledger/a.json': { ...done('a'), tests: ['test/a/'] }, 'test/a/x.test.mjs': FAIL, 'process/ledger/b.json': { ...done('b'), tests: ['test/b/'] }, 'test/b/x.test.mjs': PASS });
  const out = [];
  assert.equal(layerClose(root, '1', { io, log: (m) => out.push(m) }).ok, false);
  assert.match(out.join('\n'), /the a suite failed[\s\S]*layer 1 not closed/);
  assert.equal(git(['ls-remote', bare, 'process-state'], { cwd: root }), '');
  const open = withOrigin({ ...base, 'process/ledger/b.json': entry('b', { requirements: 'build/requirements/b.md' }) });
  assert.throws(() => layerClose(open.root, '1', { io, log: quiet }), /layer 1 is not ready to close: b has an open job/);
});

// Measured 3 Nov on the copy: a layer-1 job BLOCKED by `job block` with a reason, its PR open.
const blocked = (reason) => ({ ...base, 'build/requirements/b.md': unmet(1), 'process/ledger/b.json': entry('b', { requirements: 'build/requirements/b.md', status: { state: 'BLOCKED', ...(reason ? { reason } : {}) } }) });
const prOpen = { openPRs: () => [{ number: 38, draft: false, head: { ref: 'job/b', sha: 'x' }, updated_at: '2026-11-03T00:00:00Z' }], checkRun: () => null, compare: () => null };

test('a module BLOCKED with a reason: BOB closes its PR unmerged, then the layer closes with it deferred', () => {
  const { root, bare } = withOrigin({ ...blocked('R47 rests on measure M-R7, recorded nowhere'), 'process/ledger/a.json': { ...done('a'), tests: ['test/a/'] }, 'test/a/x.test.mjs': PASS });
  openPassed(root);
  git(['push', '-q', 'origin', 'refs/remotes/origin/process-state:refs/heads/process-state'], { cwd: root });
  const out = [];
  const r = status(root, { role: 'bob', log: (m) => out.push(m), io: prOpen });
  assert.equal(r.layer.ready, false);
  assert.equal(r.layer.pending, true);
  assert.deepEqual(r.next, []);
  assert.match(out.join('\n'), /layer 1 ready to close once BOB closes these unmerged \(never deleting the branch\):\n- close PR #38 unmerged: R47 rests on measure M-R7, recorded nowhere\nthen: node \.process\/tool\/p3\.mjs layer close 1/);
