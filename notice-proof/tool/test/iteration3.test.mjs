// Tests of the tool's iteration-3 rules, on small products written here.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { notice } from '../lib/notice.mjs';
import { check, commentsOnly } from '../lib/check.mjs';
import { loadTree } from '../lib/model.mjs';

function product(modules, files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'p3tool3-'));
  fs.writeFileSync(path.join(root, 'modules.json'), JSON.stringify({ modules }));
  for (const [f, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, f)), { recursive: true });
    fs.writeFileSync(path.join(root, f), text);
  }
  return root;
}
const MODS = [{ id: 'p', uses: [] }, { id: 'u', uses: ['p'] }];
const pair = (before, after, users, mods = MODS) => notice(product(mods, { ...before, ...users }), product(mods, { ...after, ...users }), 'p');
const told = (r) => r.told.map((t) => t.user).sort();
const chk = (files, mod, mods = MODS) => check(loadTree(product(mods, files)), mod);

const HANDLE = (err) => `/**
 * @typedef {Object} Shop
 * @property {(id: string) => number} price
 * @property {(id: string) => number} cost
 */
/** @returns {Shop} */
export function createShop() {
  return {
    /**
     * @param {string} id
     * @throws {${err}} when the id is unknown
     */
    price(id) { if (!id) throw new ${err}('no'); return 1; },
    cost: (id) => createShop().price(id),
  };
}
`;
const SHOP_USER = { 'u/src/index.mjs': "/** @import { Shop } from '../../p/src/index.mjs' */\n/** @param {Shop} s */\nexport const f = (s) => s.cost('a');\n" };

test('errors stated on a method where the object is built, and inherited by a method that hands its call on', () => {
  const r = pair({ 'p/src/index.mjs': HANDLE('RangeError') }, { 'p/src/index.mjs': HANDLE('TypeError') }, SHOP_USER);
  assert.ok(r.entries.some((e) => e.entry === 'Shop.price' && e.changes.includes('hands back differently')));
  assert.ok(r.entries.some((e) => e.entry === 'Shop.cost' && e.changes.includes('hands back differently')));
  assert.deepEqual(told(r), ['u']);
});

test('a member that becomes optional tells its users', () => {
  const p = (opt) => `/**\n * @typedef {Object} D\n * @property {(x: string) => string} ${opt ? '[get]' : 'get'}\n */\n/** @returns {D} */\nexport function d() { return { get: (x) => x }; }\n`;
  const r = pair({ 'p/src/index.mjs': p(false) }, { 'p/src/index.mjs': p(true) }, { 'u/src/index.mjs': "import { d } from '../../p/src/index.mjs';\nexport const y = d().get?.('a');\n" });
  assert.deepEqual(told(r), ['u']);
});

test('a plain-data kind built as a class instance is refused', () => {
  const files = { 'p/src/index.mjs': `/**\n * @typedef {Object} Amount\n * @property {number} cents\n */\nclass Fixed { #c; constructor(c) { this.#c = c; } get cents() { return this.#c; } }\n/** @param {number} c @returns {Amount} */\nexport function amount(c) { return new Fixed(c); }\n`, 'u/src/index.mjs': 'export {};\n' };
  const c = chk(files, 'p');
  assert.ok(c.refusals.some((x) => x.code === 'plain-data'), JSON.stringify(c.refusals));
});

test('a cast that turns a value of a known kind into a product kind it is not is refused; a cast from unknown is not', () => {
  const files = { 'p/src/index.mjs': `/**\n * @typedef {Object} Row\n * @property {string} id\n * @property {string} day\n */\n/** @param {Row} r @returns {Row} */\nexport function trim(r) { const { day, ...rest } = r; return /** @type {Row} */ (rest); }\n/** @param {unknown} v @returns {Row} */\nexport function read(v) { return /** @type {Row} */ (v); }\n`, 'u/src/index.mjs': 'export {};\n' };
  const c = chk(files, 'p');
  assert.equal(c.refusals.filter((x) => x.code === 'cast').length, 1, JSON.stringify(c.refusals));
});

test('a helper that names tables as keys makes its callers users of those tables', () => {
  const mods = [{ id: 's', uses: [] }, { id: 'p', uses: ['s'] }, { id: 'u', uses: ['s', 'p'] }];
  const store = `/**\n * @carriestable keys\n * @param {Object<string, unknown[]>} tables\n */\nexport function seed(tables) { return tables; }\n`;
  const owner = (f) => `/**\n * @typedef {Object} Pet\n * @property {string} ${f}\n * @storedrows pets\n */\nexport const X = 1;\n`;
  const user = "import { seed } from '../../s/src/index.mjs';\nexport const t = seed({ pets: [{ name: 'a' }] });\n";
  const r = notice(product(mods, { 's/src/index.mjs': store, 'p/src/index.mjs': owner('name'), 'u/src/index.mjs': user }), product(mods, { 's/src/index.mjs': store, 'p/src/index.mjs': owner('title'), 'u/src/index.mjs': user }), 'p');
  assert.deepEqual(told(r), ['u']);
});

test('a message line built first and written in the next statement is still checked', () => {
  const files = { 'p/src/index.mjs': `/**\n * @typedef {{kind: 'a'}} M\n * @message stdout\n */\n/** @param {M} m */\nexport function send(m) { const line = JSON.stringify(m) + '\\n'; process.stderr.write(line); }\n`, 'u/src/index.mjs': 'export {};\n' };
  assert.ok(chk(files, 'p').refusals.some((x) => /stderr/.test(x.text)));
});

const BOUNDED = '/**\n * @param {number} n\n * @returns {number}\n * @bound n: whole number, 1 to 9\n */\nexport function f(n) { if (!(n >= 1 && n <= 9)) throw new RangeError("n"); return n; }\n';
const USER_F = { 'u/src/index.mjs': "import { f } from '../../p/src/index.mjs';\nexport const y = f(2);\n" };
const T = (body, head = '') => `import { test } from 'node:test';\nimport assert from 'node:assert/strict';\nimport { f } from '../src/index.mjs';\n${head}test('bound n: whole number, 1 to 9', () => {\n${body}\n});\n`;

test('a bound test rewritten with the same values and checks is not a change', () => {
  const a = T('  assert.equal(f(1), 1);\n  assert.equal(f(9), 9);\n  assert.throws(() => f(0));\n  assert.throws(() => f(10));');
  const b = T('  for (const v of [1, 9]) assert.equal(f(v), v);\n  for (const v of [0, 10]) assert.throws(() => f(v));');
  const r = pair({ 'p/src/index.mjs': BOUNDED, 'p/test/index.test.mjs': a }, { 'p/src/index.mjs': BOUNDED, 'p/test/index.test.mjs': b }, USER_F);
  assert.deepEqual(told(r), []);
});

test('a limit held in a named value of the test file is part of the bound test', () => {
  const t = (max) => T('  assert.equal(f(MAX), MAX);\n  assert.throws(() => f(MAX + 1));', `const MAX = ${max};\n`);
  const r = pair({ 'p/src/index.mjs': BOUNDED, 'p/test/index.test.mjs': t(9) }, { 'p/src/index.mjs': BOUNDED, 'p/test/index.test.mjs': t(5) }, USER_F);
  assert.deepEqual(told(r), ['u']);
});

test('a bound test regrouped under describe/it with the same checks is not a change', () => {
  const a = T('  assert.equal(f(9), 9);');
  const b = "import { describe, it } from 'node:test';\nimport assert from 'node:assert/strict';\nimport { f } from '../src/index.mjs';\ndescribe('f', () => {\n  it('bound n: whole number, 1 to 9', () => {\n  assert.equal(f(9), 9);\n  });\n});\n";
  const r = pair({ 'p/src/index.mjs': BOUNDED, 'p/test/index.test.mjs': a }, { 'p/src/index.mjs': BOUNDED, 'p/test/index.test.mjs': b }, USER_F);
  assert.deepEqual(told(r), []);
});

test('tests named for bounds are found in it and describe', () => {
  const t = "import { describe, it } from 'node:test';\nimport assert from 'node:assert/strict';\nimport { f } from '../src/index.mjs';\ndescribe('f', () => {\n  it('bound n: whole number, 1 to 9', () => { assert.equal(f(9), 9); });\n});\n";
  assert.equal(chk({ 'p/src/index.mjs': BOUNDED, 'p/test/index.test.mjs': t, 'u/src/index.mjs': 'export {};\n' }, 'p').refused, false);
});

test('a bound on a kind that is just a number reaches the fields written with it', () => {
  const p = (hi) => `/**\n * @typedef {number} Cents\n * @bound cents: whole number, 0 to ${hi}\n */\n/**\n * @typedef {Object} Amount\n * @property {Cents} cents\n */\n/** @param {number} c @returns {Amount} */\nexport function amount(c) { return { cents: c }; }\n`;
  const r = pair({ 'p/src/index.mjs': p(100) }, { 'p/src/index.mjs': p(50) }, { 'u/src/index.mjs': "import { amount } from '../../p/src/index.mjs';\nexport const a = amount(1);\n" });
  assert.deepEqual(told(r), ['u']);
});

test('an exported class lists what its constructor accepts', () => {
  const p = (param) => `export class Tally {\n  /** @param {${param}} start */\n  constructor(start) { this.start = start; }\n}\n`;
  const r = pair({ 'p/src/index.mjs': p('string') }, { 'p/src/index.mjs': p('number') }, { 'u/src/index.mjs': "import { Tally } from '../../p/src/index.mjs';\nexport const t = new Tally('a');\n" });
  assert.deepEqual(told(r), ['u']);
});

test('the reader knows the 2023 library, and Map.has guarding Map.get on another module\'s kind is "cannot tell"', () => {
  const files = {
    'p/src/index.mjs': '/**\n * @typedef {Object} Amount\n * @property {number} cents\n */\nexport const Z = 1;\n',
    'u/src/index.mjs': "/** @import { Amount } from '../../p/src/index.mjs' */\n/** @param {Amount} a @returns {number} */\nconst c = (a) => a.cents;\n/** @param {Map<string, Amount>} m @param {string} k */\nexport function g(m, k) { return m.has(k) ? c(m.get(k)) : 0; }\n/** @param {Map<string, Amount>} m @param {string} k */\nexport function h(m, k) {\n  if (!m.has(k)) m.set(k, { cents: 0 });\n  return c(m.get(k));\n}\nexport const sorted = [3, 1, 2].toSorted();\n",
  };
  const r = chk(files, 'u');
  assert.equal(r.refused, false, JSON.stringify(r.refusals));
});

test('the first comments step may add tests named for the bound lines it writes, and nothing else', () => {
  const bare = 'export function f(n) { return n; }\n';
  const before = { 'p/src/index.mjs': bare, 'p/test/index.test.mjs': "import { test } from 'node:test';\nimport { f } from '../src/index.mjs';\ntest('f', () => f(1));\n" };
  const commented = '/**\n * @param {number} n\n * @returns {number}\n * @bound n: whole number\n */\nexport function f(n) { return n; }\n';
  const ok = { 'p/src/index.mjs': commented, 'p/test/index.test.mjs': before['p/test/index.test.mjs'] + "test('bound n: whole number', () => f(2));\n" };
  const bad = { 'p/src/index.mjs': commented, 'p/test/index.test.mjs': before['p/test/index.test.mjs'] + "test('another', () => f(2));\n" };
  const mods = [{ id: 'p', uses: [] }];
  assert.equal(commentsOnly(loadTree(product(mods, before)), loadTree(product(mods, ok)), 'p').same, true);
  assert.equal(commentsOnly(loadTree(product(mods, before)), loadTree(product(mods, bad)), 'p').same, false);
});
