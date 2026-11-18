// ===== file: ledger.mjs (continued) =====

    if (mods && !mods.some((x) => x?.id === m)) gaps.push(`lane ${name}'s module ${m} has no row in ${cfg.modules_file}: BOB adds {"id": "${m}", "uses": [...]} there`);
    const req = e.requirements || `${String(cfg.requirements_dir || '').replace(/\/$/, '')}/${m}.md`;
    if (read(req) === null) gaps.push(`lane ${name}'s module ${m} has no requirements file ${req}: BOB writes it, its marks the lane's work`);
  }
  return gaps;
}

// ===== file: exports.test.mjs =====

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { entryFiles, surfaceOf } from '../lib/exports.mjs';
import { commit, makeRepo } from './helpers.mjs';

const surface = (files, entry) => Object.fromEntries(surfaceOf((f) => files[f] ?? null, entry, (f) => f.startsWith('p/')));

// Review of PR 82: a class built in layers inherits the methods of a base in the same file,
// exported or not, declared before or after it, and through a re-export.
test('a class inherits the methods of a base in its own file, exported or not, before or after, and through export from', () => {
  assert.deepEqual(surface({ 'p/a.mjs': 'class Base { a(x) {} }\nexport class S extends Base { c() {} }\n' }, 'p/a.mjs'),
    { S: 'class', 'S.a': '(x)', 'S.c': '()' });
  assert.deepEqual(surface({ 'p/a.mjs': 'export class S extends Base { c() {} }\nexport class Base { a(x) {} }\n' }, 'p/a.mjs'),
    { S: 'class', 'S.a': '(x)', 'S.c': '()', Base: 'class', 'Base.a': '(x)' });
  assert.deepEqual(surface({ 'p/a.mjs': 'class Base { a(x) {} }\nclass S extends Base {}\nexport { S };\n' }, 'p/a.mjs'),
    { S: 'class', 'S.a': '(x)' });
  assert.deepEqual(surface({
    'p/index.mjs': "export { Q as AiAccounts } from './core.mjs';\n",
    'p/core.mjs': "import { Layer } from './layer.mjs';\nclass Core extends Layer { b() {} }\nexport class Q extends Core { c(y) {} }\n",
    'p/layer.mjs': 'export class Layer { keySet({ key = null } = {}) {} }\n',
  }, 'p/index.mjs'), { AiAccounts: 'class', 'AiAccounts.keySet': '({ key = null } = {})', 'AiAccounts.b': '()', 'AiAccounts.c': '(y)' });
  // Two classes extending each other: read once, no loop.
  assert.deepEqual(surface({ 'p/a.mjs': 'class A extends B { a() {} }\nclass B extends A { b() {} }\nexport { A };\n' }, 'p/a.mjs'),
    { A: 'class', 'A.a': '()', 'A.b': '()' });
});

// Review of PR 82: the provider's own tests import its internals; they are not its users.
test('entry files: an importer in the provider\'s tests is not a user; with only its tests importing it, its index files', () => {
  const root = makeRepo({
    'prov/src/index.mjs': "export { f } from './internal.mjs';\n",
    'prov/src/internal.mjs': 'export function f(a) {}\nexport function helper(b) {}\n',
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

// ===== file: state-writes.test.mjs =====

// Defect sweep 4 Nov, #9, #11, #12 and three lower items: state-branch writes that raced, the
// address writers that wrote from a stale read, the review brief's suite command, survival in a
// shallow clone and a found mark number already taken by a local branch.
import assert from 'node:assert/strict';
import { appendFileSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { commit, entry, makeRepo, openPassed } from './helpers.mjs';
import { found } from '../lib/found.mjs';
import { survival } from '../lib/metrics.mjs';
import { reviewBrief } from '../lib/review.mjs';
import { handoverConfirm, promptRefresh, readAddress, recordStart } from '../lib/roles.mjs';
import { messages, readState, writeState } from '../lib/state.mjs';
import { git } from '../lib/util.mjs';

const quiet = () => {};
const SB = 'process-state';
const R = 'session_root1';
const B1 = 'session_bob1';
const B2 = 'session_bob2';

function withOrigin() {
  const root = makeRepo({ 'README.md': 'x', 'process/config.json': { tranche: 'tranche' } });
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  return { root, bare };
}
// A second checkout of the same origin: another session.
function other(bare) {
  const dir = join(mkdtempSync(join(tmpdir(), 'p3-other-')), 'c');
  git(['clone', '-q', '-b', 'tranche', bare, dir]);
  for (const [k, v] of [['user.email', 't@t'], ['user.name', 'T'], ['commit.gpgsign', 'false']]) git(['config', k, v], { cwd: dir });
  return dir;
}
const onOrigin = (bare, f) => git(['show', `${SB}:${f}`], { cwd: bare });

// The append send makes: the next number counted from the file, one row appended.
const appendSent = (wt, text) => {
  const f = join(wt, 'messages/bob.jsonl');
  mkdirSync(dirname(f), { recursive: true });
  let t = '';
  try { t = readFileSync(f, 'utf8'); } catch { /* none yet */ }
  const n = messages(t).reduce((m, x) => Math.max(m, x.n), 0) + 1;
  appendFileSync(f, JSON.stringify({ at: 'now', row: 'sent', n, to: 'job-x', text }) + '\n');
  return { n };
};

test('#12: two appends to one state jsonl file both land: the rejected one is made again on the fresh tip, renumbered', () => {
  const { root, bare } = withOrigin();
  const two = other(bare);
  writeState(root, SB, 'seed', (wt) => appendSent(wt, 'first'));
  let raced = false;
  const r = writeState(root, SB, 'ours', (wt) => {
    // Another BOB call appends to the same file after our fetch, before our push.
    if (!raced) { raced = true; writeState(two, SB, 'theirs', (w) => appendSent(w, 'theirs')); }
    return appendSent(wt, 'ours');
  });
  assert.equal(r.n, 3, 'the number is counted again on the other writer\'s row');
  const rows = messages(onOrigin(bare, 'messages/bob.jsonl'));
  assert.deepEqual(rows.map((m) => `${m.n}:${m.text}`), ['1:first', '2:theirs', '3:ours']);
  assert.equal(git(['rev-parse', `refs/heads/${SB}`], { cwd: bare }), r.tip);
  // Never a merge: the tip's history is a line.
  assert.equal(git(['rev-list', '--merges', '--count', r.tip], { cwd: bare }), '0');
});

test('#12: a change that fails when made again on the fresh tip pushes nothing', () => {
  const { root, bare } = withOrigin();
  const two = other(bare);
  writeState(root, SB, 'seed', (wt) => writeFileSync(join(wt, 'a.txt'), 'x'));
  const before = git(['rev-parse', `refs/heads/${SB}`], { cwd: bare });
  let k = 0;
  assert.throws(() => writeState(root, SB, 'ours', (wt) => {
    if (k++ === 0) { writeState(two, SB, 'theirs', (w) => writeFileSync(join(w, 'b.txt'), 'y')); return {}; }
    throw new Error('refused on the fresh tip');
  }), /refused on the fresh tip/);
  assert.notEqual(git(['rev-parse', `refs/heads/${SB}`], { cwd: bare }), before, 'theirs landed');
  assert.equal(onOrigin(bare, 'b.txt'), 'y');
  assert.equal(git(['show', `${SB}~0:a.txt`], { cwd: bare }), 'x');
  assert.equal(git(['log', '--format=%s', '-1', SB], { cwd: bare }), 'theirs');
});

test('#11: the old BOB\'s prompt refresh after ROOT\'s handover confirm refuses, and bob stays the new BOB', () => {
  const { root, bare } = withOrigin();
  recordStart(root, 'root', R, { log: quiet });
  recordStart(root, 'bob', B1, { log: quiet });
  // The old BOB's record names a prompt this pin no longer prints, so its wake would rewrite it.
  writeState(root, SB, 'old prompt', (d) => writeFileSync(join(d, 'addresses/bob.json'), JSON.stringify({ session: B1, at: '2026-01-01T00:00:00Z', prompt: { hash: '0'.repeat(64) } }) + '\n'));
  assert.equal(readAddress(root).bob.session, B1, 'the old BOB\'s read, kept for the command');
  // ROOT, in its own checkout, confirms the handover.
  const rootSession = other(bare);
  handoverConfirm(rootSession, B2, { log: quiet });
  assert.throws(() => promptRefresh(root, { session: B1, pin: 'f'.repeat(40), log: quiet }), /refused: bob's address moved to session_bob2 while the prompt refresh ran; nothing was changed/);
  assert.equal(JSON.parse(onOrigin(bare, 'addresses/bob.json')).session, B2);
});

test('#11: start record and handover confirm refuse an address that moved since their read', () => {
  const { root, bare } = withOrigin();
  recordStart(root, 'root', R, { log: quiet });
  assert.equal(readAddress(root).root.session, R);
  // Another session records a different ROOT after this command's read.
  recordStart(other(bare), 'root', 'session_root2', { log: quiet });
  assert.throws(() => recordStart(root, 'root', 'session_root3', { log: quiet }), /refused: root's address moved to session_root2 while start record root ran/);
  assert.equal(JSON.parse(onOrigin(bare, 'addresses/root.json')).session, 'session_root2');
  // Recording the same id again still works (the address may already name it).
  const fresh = other(bare);
  recordStart(fresh, 'root', 'session_root2', { log: quiet });
  // handover confirm: BOB moved after ROOT's read.
  const r2 = other(bare);
  recordStart(r2, 'bob', B1, { log: quiet });
