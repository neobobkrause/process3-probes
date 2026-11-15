// Tests of the tool's iteration-2 rules, on small products written here.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { notice } from '../lib/notice.mjs';
import { check } from '../lib/check.mjs';
import { loadTree } from '../lib/model.mjs';

function product(modules, files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'p3tool2-'));
  fs.writeFileSync(path.join(root, 'modules.json'), JSON.stringify({ modules }));
  for (const [f, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, f)), { recursive: true });
    fs.writeFileSync(path.join(root, f), text);
  }
  return root;
}
const MODS = [{ id: 'p', uses: [] }, { id: 'u', uses: ['p'] }];
const MODS3 = [{ id: 'p', uses: [] }, { id: 'u', uses: ['p'] }, { id: 'v', uses: ['p'] }];
const pair = (before, after, users, mods = MODS) => notice(product(mods, { ...before, ...users }), product(mods, { ...after, ...users }), 'p');
const told = (r) => r.told.map((t) => t.user).sort();
const refusals = (files, mod, mods = MODS) => check(loadTree(product(mods, files)), mod);

test('the kinds of error a function raises are part of what it hands back', () => {
  const fn = (err) => `/**\n * @param {number} n\n * @returns {number}\n * @throws {${err}} when n is negative\n */\nexport function root(n) { if (n < 0) throw new ${err}('neg'); return Math.sqrt(n); }\n`;
  const r = pair({ 'p/src/index.mjs': fn('RangeError') }, { 'p/src/index.mjs': fn('TypeError') }, { 'u/src/index.mjs': "import { root } from '../../p/src/index.mjs';\nexport const x = root(4);\n" });
  assert.deepEqual(told(r), ['u']);
  assert.ok(r.entries[0].changes.includes('hands back differently'));
});

const STORE = `/**
 * @typedef {Object} Store
 * @property {(table: string, id: string, value: unknown) => void} put
 * @property {(table: string) => {id: string, value: unknown}[]} list
 * @carriestable put list
 */
/** @returns {Store} */
export function createStore() { const m = new Map(); return { put: (t, id, v) => { m.set(t + id, v); }, list: (t) => [...m.entries()].filter(([k]) => k.startsWith(t)).map(([id, value]) => ({ id, value })) }; }
`;
const STORE_MODS = [{ id: 's', uses: [] }, { id: 'p', uses: ['s'] }, { id: 'u', uses: ['s', 'p'] }];
const OWNER = (field) => `/** @import { Store } from '../../s/src/index.mjs' */
/**
 * @typedef {Object} Pet
 * @property {string} ${field}
 * @storedrows pets
 */
/** @param {Store} store @param {Pet} pet */
export function keep(store, pet) { store.put('pets', 'x', pet); }
`;

test('a table read by a module that does not own it: the reader is told when the rows change', () => {
  const reader = "/** @import { Store } from '../../s/src/index.mjs' */\n/** @param {Store} store */\nexport function count(store) { return store.list('pets').length; }\n";
  const r = notice(product(STORE_MODS, { 's/src/index.mjs': STORE, 'p/src/index.mjs': OWNER('name'), 'u/src/index.mjs': reader }),
    product(STORE_MODS, { 's/src/index.mjs': STORE, 'p/src/index.mjs': OWNER('title'), 'u/src/index.mjs': reader }), 'p');
  assert.deepEqual(told(r), ['u']);
  assert.ok(r.told[0].reasons.some((x) => x.entry === 'table:pets'));
});

test('a table is written only by its owner, and only with rows of its kind', () => {
  const bad = OWNER('name').replace("store.put('pets', 'x', pet)", "store.put('pets', 'x', { other: 1 })");
  const c = refusals({ 's/src/index.mjs': STORE, 'p/src/index.mjs': bad, 'u/src/index.mjs': 'export {};\n' }, 'p', STORE_MODS);
  assert.ok(c.refusals.some((x) => x.kind.startsWith('(c)') && /not a Pet/.test(x.text)));
  const intruder = "/** @import { Store } from '../../s/src/index.mjs' */\n/** @param {Store} store */\nexport function f(store) { store.put('pets', 'y', { name: 'z' }); }\n";
  const c2 = refusals({ 's/src/index.mjs': STORE, 'p/src/index.mjs': OWNER('name'), 'u/src/index.mjs': intruder }, 'u', STORE_MODS);
  assert.ok(c2.refusals.some((x) => /belong to p/.test(x.text)));
  assert.equal(refusals({ 's/src/index.mjs': STORE, 'p/src/index.mjs': OWNER('name'), 'u/src/index.mjs': 'export {};\n' }, 'p', STORE_MODS).refused, false);
});

const MSG = (channel) => `/**\n * @typedef {{kind: 'hello', who: string}} Hello\n * @message ${channel}\n */\nexport const NAME = 'p';\n`;

test('a message is read and written with the kind its sender publishes, on its channel', () => {
  const reader = "/** @import { Hello } from '../../p/src/index.mjs' */\n/** @param {string} line */\nexport function read(line) {\n  /** @type {Hello} */\n  const m = JSON.parse(line);\n  return m.who;\n}\nexport const loose = (/** @type {string} */ line) => JSON.parse(line).who;\nexport const copy = (/** @type {object} */ x) => JSON.parse(JSON.stringify(x));\n";
  const c = refusals({ 'p/src/index.mjs': MSG('stdout'), 'u/src/index.mjs': reader }, 'u');
  assert.equal(c.refusals.length, 1, JSON.stringify(c.refusals));
  assert.match(c.refusals[0].text, /without a kind/);
  const writer = "/** @import { Hello } from '../../p/src/index.mjs' */\n/** @param {Hello} m */\nexport const out = (m) => process.stdout.write(JSON.stringify(m) + '\\n');\n/** @param {Hello} m */\nexport const err = (m) => process.stderr.write(JSON.stringify(m) + '\\n');\n";
  const w = refusals({ 'p/src/index.mjs': MSG('stdout'), 'u/src/index.mjs': writer }, 'u');
  assert.equal(w.refusals.length, 1);
  assert.match(w.refusals[0].text, /stderr/);
});

test('a message kind moved to another channel tells its readers', () => {
  const reader = "/** @import { Hello } from '../../p/src/index.mjs' */\n/** @param {string} line */\nexport function read(line) { /** @type {Hello} */ const m = JSON.parse(line); return m.who; }\n";
  const r = pair({ 'p/src/index.mjs': MSG('stdout') }, { 'p/src/index.mjs': MSG('stderr') }, { 'u/src/index.mjs': reader });
  assert.deepEqual(told(r), ['u']);
});

const BOUNDED = '/**\n * @param {number} n\n * @returns {number}\n * @bound n: whole number, 1 to 9\n */\nexport function f(n) { if (!(n >= 1 && n <= 9)) throw new RangeError("n"); return n; }\n';
const BTEST = (hi) => `import { test } from 'node:test';\nimport assert from 'node:assert/strict';\nimport { f } from '../src/index.mjs';\ntest('bound n: whole number, 1 to 9', () => { assert.equal(f(${hi}), ${hi}); assert.throws(() => f(${hi + 1})); });\n`;

test('a test named for a bound whose code changes while its line does not: the bound counts as changed', () => {
  const r = pair({ 'p/src/index.mjs': BOUNDED, 'p/test/index.test.mjs': BTEST(9) }, { 'p/src/index.mjs': BOUNDED, 'p/test/index.test.mjs': BTEST(5) },
    { 'u/src/index.mjs': "import { f } from '../../p/src/index.mjs';\nexport const y = f(2);\n" });
  assert.deepEqual(told(r), ['u']);
  assert.ok(r.entries.some((e) => e.changes.includes('bound test changed')));
});

test('each bound needs its test, and each bound test its line', () => {
  const c = refusals({ 'p/src/index.mjs': BOUNDED, 'p/test/index.test.mjs': "import { test } from 'node:test';\ntest('bound n: something else', () => {});\n", 'u/src/index.mjs': 'export {};\n' }, 'p');
  assert.equal(c.refusals.filter((x) => x.kind.startsWith('(d)')).length, 2);
  assert.equal(refusals({ 'p/src/index.mjs': BOUNDED, 'p/test/index.test.mjs': BTEST(9), 'u/src/index.mjs': 'export {};\n' }, 'p').refused, false);
});

test('a caught error does not stop the tool following a user', () => {
  const user = "import { f } from '../../p/src/index.mjs';\nexport function g() { try { return f(1); } catch (e) { return e.message; } }\n";
  const r = pair({ 'p/src/index.mjs': BOUNDED }, { 'p/src/index.mjs': BOUNDED + 'export function extra() { return 1; }\n' }, { 'u/src/index.mjs': user });
  assert.deepEqual(told(r), []);
});

test('a function handed on as a value is told when it accepts more', () => {
  const p1 = '/** @param {number} n @returns {string} */\nexport function show(n) { return String(n); }\n';
  const p2 = '/** @param {number} n @param {number} [digits] @returns {string} */\nexport function show(n, digits) { return digits === undefined ? String(n) : n.toFixed(digits); }\n';
  const r = pair({ 'p/src/index.mjs': p1 }, { 'p/src/index.mjs': p2 }, {
    'u/src/index.mjs': "import { show } from '../../p/src/index.mjs';\nexport const all = [1, 2].map(show);\n",
    'v/src/index.mjs': "import { show } from '../../p/src/index.mjs';\nexport const one = show(1);\n",
  }, MODS3);
  assert.deepEqual(told(r), ['u']);
});

test('a value handed where a provider kind is expected uses the members it fills', () => {
  const p = (bound) => `/**\n * @typedef {Object} Clock\n * @property {() => string} now\n * @bound now: ${bound}\n */\n/** @param {Clock} clock @returns {string} */\nexport function stamp(clock) { return clock.now(); }\n`;
  const user = "import { stamp } from '../../p/src/index.mjs';\nconst clock = { now: () => '2026-01-01' };\nexport const s = stamp(clock);\n";
  const r = pair({ 'p/src/index.mjs': p('an ISO date and time') }, { 'p/src/index.mjs': p('a day, YYYY-MM-DD') }, { 'u/src/index.mjs': user });
  assert.deepEqual(told(r), ['u']);
  assert.ok(r.told[0].reasons.some((x) => x.entry === 'Clock.now'));
});

test('a new operation whose name another module answers tells that operation\'s users', () => {
  const mods = [{ id: 'q', uses: [] }, { id: 'p', uses: [] }, { id: 'd', uses: ['q', 'p'] }, { id: 'u', uses: ['d', 'q'] }];
  const ops = (name, extra = '') => `/**\n * @typedef {{\n *   ${name}: {req: {id: string}, res: {ok: boolean}}${extra}\n * }} ${name.toUpperCase()}Ops\n * @optable\n */\nexport const X = 1;\n`;
  const door = "/** @import { QOPS } from '../../q/src/index.mjs' */\n/** @import { POPS } from '../../p/src/index.mjs' */\n/**\n * @typedef {QOPS & POPS} AllOps\n */\n/**\n * @typedef {Object} Door\n * @property {<K extends keyof AllOps>(op: K, body: AllOps[K]['req']) => Promise<AllOps[K]['res']>} call\n * @carriesop call\n */\n/** @returns {Door} */\nexport function door() { return /** @type {any} */ ({}); }\n";
  const fix = (s) => s.replace('QOPS', 'QOPS').replace('POPS', 'POPS');
  const qfile = ops('qget').replace('QGETOps', 'QOPS');
  const before = { 'q/src/index.mjs': qfile, 'p/src/index.mjs': ops('pget').replace('PGETOps', 'POPS'), 'd/src/index.mjs': fix(door), 'u/src/index.mjs': "import { door } from '../../d/src/index.mjs';\nexport const r = door().call('qget', { id: 'a' });\n" };
  const after = { ...before, 'p/src/index.mjs': ops('pget', ',\n *   qget: {req: {id: string}, res: {ok: boolean}}').replace('PGETOps', 'POPS') };
  const r = notice(product(mods, before), product(mods, after), 'p');
  assert.ok(told(r).includes('u'), JSON.stringify(r.entries));
});

test('the check does not refuse where the reader cannot tell', () => {
  const files = {
    'p/src/index.mjs': `export const KINDS = Object.freeze(/** @type {const} */ (['a', 'b']));
/** @param {string} t @returns {boolean} */
export function isKind(t) { return KINDS.includes(t); }
/** @type {Map<string, {v: number}>} */
const m = new Map();
/** @param {string} k @returns {number} */
export function v(k) { return m.has(k) ? m.get(k).v : 0; }
export function later() { const t = setTimeout(() => {}, 10); t.unref(); return t; }
/** @typedef {{kind: 'a', x: number} | {kind: 'b', y: number}} AB */
/** @param {AB} ab */
export function x(ab) { assert.equal(ab.kind, 'a'); return ab.x; }
import assert from 'node:assert/strict';
`,
    'u/src/index.mjs': 'export {};\n',
  };
  const c = refusals(files, 'p');
  assert.equal(c.refused, false, JSON.stringify(c.refusals));
});

test('a missing name of a closed set is refused', () => {
  const files = {
    'p/src/index.mjs': `/** @typedef {'a' | 'b'} K */\nconst PRICE = { a: 1 };\n/** @param {K} k @returns {number} */\nexport function price(k) { return PRICE[k]; }\n`,
    'u/src/index.mjs': 'export {};\n',
  };
  assert.equal(refusals(files, 'p').refused, true);
});

test('a request line the reader cannot read is "cannot tell", and its caller is not followed', () => {
  const mods = [{ id: 'p', uses: [] }, { id: 'u', uses: ['p'] }];
  const p = (extra = '') => `/**\n * @typedef {{\n *   pget: {req: {id: string}, res: {ok: boolean}}${extra}\n * }} POps\n * @optable\n */\n/**\n * @typedef {Object} Door\n * @property {<K extends keyof POps>(line: \`op=\${K}&\${string}\`) => Promise<POps[K]['res']>} get\n * @carriesop get\n */\n/** @returns {Door} */\nexport function door() { return /** @type {any} */ ({}); }\n`;
  const user = "import { door } from '../../p/src/index.mjs';\n/** @param {string} id */\nexport async function f(id) { let line = 'op=pget'; line += `&id=${id}`; const r = await door().get(line); return r.ok; }\n";
  const c = refusals({ 'p/src/index.mjs': p(), 'u/src/index.mjs': user }, 'u', mods);
  assert.equal(c.refused, false, JSON.stringify(c.refusals));
  const r = notice(product(mods, { 'p/src/index.mjs': p(), 'u/src/index.mjs': user }), product(mods, { 'p/src/index.mjs': p(',\n *   pnew: {req: {}, res: {}}'), 'u/src/index.mjs': user }), 'p');
  assert.deepEqual(told(r), ['u']);
});
