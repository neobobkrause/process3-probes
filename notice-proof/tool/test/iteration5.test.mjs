// Tests of the tool's iteration-5 rules, on small products written here.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { notice } from '../lib/notice.mjs';
import { check } from '../lib/check.mjs';
import { loadTree } from '../lib/model.mjs';

function product(modules, files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'p3tool5-'));
  fs.writeFileSync(path.join(root, 'modules.json'), JSON.stringify({ modules }));
  for (const [f, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, f)), { recursive: true });
    fs.writeFileSync(path.join(root, f), text);
  }
  return root;
}
const MODS = [{ id: 'p', uses: [] }, { id: 'u', uses: ['p'] }];
const pair = (before, after, users) => notice(product(MODS, { ...before, ...users }), product(MODS, { ...after, ...users }), 'p');
const told = (r) => r.told.map((t) => t.user).sort();
const chk = (files, mod) => check(loadTree(product(MODS, files)), mod);
const U = (body) => ({ 'u/src/index.mjs': `import * as p from '../../p/src/index.mjs';\n${body}\n` });
const NONE = { 'u/src/index.mjs': 'export {};\n' };

test('a static method that changes is told even when the constructor only accepts more', () => {
  const cls = (opt, ret) => `export class Tally {\n  /** @param {string} ${opt ? '[c]' : 'c'} */\n  constructor(c) { this.c = c; }\n  /** @param {number[]} xs @returns {${ret}} */\n  static sum(xs) { return /** @type {any} */ (xs.length); }\n}\n`;
  const r = pair({ 'p/src/index.mjs': cls(false, 'number') }, { 'p/src/index.mjs': cls(true, 'Tally') }, U('export const s = p.Tally.sum([1]);'));
  assert.deepEqual(told(r), ['u']);
});

test('importing a file of another module that is not one of its interface files is refused', () => {
  const files = { 'p/src/index.mjs': 'export const A = 1;\n', 'p/src/inner.mjs': 'export const B = 2;\n', 'u/src/index.mjs': "import { B } from '../../p/src/inner.mjs';\nexport const b = B;\n" };
  assert.ok(chk(files, 'u').refusals.some((x) => x.code === 'import'));
});

test('throwing a kind the comment does not state is refused', () => {
  const files = { 'p/src/index.mjs': '/**\n * @param {number} n\n * @returns {number}\n * @throws {RangeError} when n is negative\n */\nexport function f(n) { if (n < 0) throw new TypeError("neg"); return n; }\n', ...NONE };
  assert.ok(chk(files, 'p').refusals.some((x) => x.code === 'throws'));
});

test('a message written with console.error must be published for standard error', () => {
  const files = { 'p/src/index.mjs': `/**\n * @typedef {{kind: 'a'}} M\n * @message stdout\n */\n/** @param {M} m */\nexport const w = (m) => console.error(JSON.stringify(m));\n`, ...NONE };
  assert.ok(chk(files, 'p').refusals.some((x) => /stderr/.test(x.text)));
});

test('plain data built as a class instance inside a conditional is refused', () => {
  const files = { 'p/src/index.mjs': `/**\n * @typedef {Object} Amount\n * @property {number} cents\n */\nclass Fixed { #c; constructor(c) { this.#c = c; } get cents() { return this.#c; } }\nconst ZERO = { cents: 0 };\n/** @param {number} c @returns {Amount} */\nexport function amount(c) { return c === 0 ? ZERO : new Fixed(c); }\n`, ...NONE };
  assert.ok(chk(files, 'p').refusals.some((x) => x.code === 'plain-data'));
});

const B = (lo, hi) => `/**\n * @param {number} n\n * @returns {number}\n * @throws {RangeError} when n is outside its bound\n * @bound n: whole number, 1 to 9\n */\nexport function f(n) { if (!(n >= ${lo} && n <= ${hi})) throw new RangeError("n"); return n; }\n`;
const T = (body) => `import { test } from 'node:test';\nimport assert from 'node:assert/strict';\nimport { f } from '../src/index.mjs';\n${body}\n`;
const USER_F = { 'u/src/index.mjs': "import { f } from '../../p/src/index.mjs';\nexport const y = f(2);\n" };

test('bound tests: the list a check runs over counts, and so do error kinds named', () => {
  const a = T("test('bound n: whole number, 1 to 9', () => { [1, 9].map((v) => assert.equal(f(v), v)); });");
  const b = T("test('bound n: whole number, 1 to 9', () => { [1, 5].map((v) => assert.equal(f(v), v)); });");
  assert.deepEqual(told(pair({ 'p/src/index.mjs': B(1, 9), 'p/test/index.test.mjs': a }, { 'p/src/index.mjs': B(1, 5), 'p/test/index.test.mjs': b }, USER_F)), ['u']);
  const c = T("test('bound n: whole number, 1 to 9', () => { assert.throws(() => f(0), RangeError); });");
  const d = T("test('bound n: whole number, 1 to 9', () => { assert.throws(() => f(0), TypeError); });");
  assert.deepEqual(told(pair({ 'p/src/index.mjs': B(1, 9), 'p/test/index.test.mjs': c }, { 'p/src/index.mjs': B(1, 9), 'p/test/index.test.mjs': d }, USER_F)), ['u']);
});

test('bound tests: the same checks written through a helper and loops are not a change', () => {
  const a = T("test('bound n: whole number, 1 to 9', () => { assert.equal(f(1), 1); assert.equal(f(9), 9); assert.throws(() => f(0), RangeError); });");
  const b = T("const ok = (v) => assert.equal(f(v), v);\nconst bad = (v) => assert.throws(() => f(v), RangeError);\ntest('bound n: whole number, 1 to 9', () => { for (const v of [1, 9]) ok(v); for (const v of [0]) bad(v); });");
  assert.deepEqual(told(pair({ 'p/src/index.mjs': B(1, 9), 'p/test/index.test.mjs': a }, { 'p/src/index.mjs': B(1, 9), 'p/test/index.test.mjs': b }, USER_F)), []);
});

test('an added overload that keeps the old one only accepts more', () => {
  const one = '/** @param {number} a @returns {string} */\nexport function show(a) { return String(a); }\n';
  const two = '/**\n * @overload\n * @param {number} a\n * @returns {string}\n */\n/**\n * @overload\n * @param {number[]} a\n * @returns {string[]}\n */\n/** @param {number | number[]} a */\nexport function show(a) { return /** @type {any} */ (Array.isArray(a) ? a.map(String) : String(a)); }\n';
  assert.deepEqual(told(pair({ 'p/src/index.mjs': one }, { 'p/src/index.mjs': two }, U('export const s = p.show(1);'))), []);
});

test('a destructured parameter, or an inline union given a name, is not a change', () => {
  const a = '/** @param {{n: number}} deps @returns {number} */\nexport function f(deps) { return deps.n; }\n/** @typedef {{state: "open" | "shut"}} S */\n/** @returns {S} */\nexport function s() { return { state: "open" }; }\n';
  const b = '/** @param {{n: number}} deps @returns {number} */\nexport function f({ n }) { return n; }\n/** @typedef {"open" | "shut"} State */\n/** @typedef {{state: State}} S */\n/** @returns {S} */\nexport function s() { return { state: "open" }; }\n';
  assert.deepEqual(told(pair({ 'p/src/index.mjs': a }, { 'p/src/index.mjs': b }, U('export const x = [p.f({ n: 1 }), p.s().state];'))), []);
});

test('no refusal for a write with a callback, a JSON module, pop after a length check, or a copy in two steps', () => {
  const files = {
    'p/src/limits.json': '{"max": 9}\n',
    'p/src/index.mjs': `import limits from './limits.json' with { type: 'json' };\n/**\n * @typedef {{kind: 'a'}} M\n * @message stdout\n */\n/** @param {M} m */\nexport const w = (m) => process.stdout.write(JSON.stringify(m) + '\\n', () => {});\nexport const MAX = limits.max;\n/** @param {{id: string}[]} xs @returns {string} */\nexport function last(xs) { if (xs.length === 0) return ''; return xs.pop().id; }\n/** @param {object} x @returns {number} */\nexport function size(x) { const text = JSON.stringify(x); const back = JSON.parse(text); return Object.keys(back).length; }\n`,
    ...NONE,
  };
  const c = chk(files, 'p');
  assert.equal(c.refused, false, JSON.stringify(c.refusals));
});
