// Tests of the tool's iteration-7 rules (the checks fail closed), on small products written here.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { notice } from '../lib/notice.mjs';
import { check } from '../lib/check.mjs';
import { loadTree } from '../lib/model.mjs';

function product(modules, files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'p3tool7-'));
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
const codes = (c) => c.refusals.map((x) => x.code);
const clean = (files, mod = 'p') => { const c = chk(files, mod); assert.equal(c.refused, false, JSON.stringify(c.refusals)); };

test('rule 44: Node\'s process module imported, process named another way, or a file of another module read, is refused', () => {
  assert.ok(codes(chk({ 'p/src/index.mjs': "import { env } from 'node:process';\nexport const c = env.CUR;\n", ...NONE }, 'p')).includes('outside'));
  assert.ok(codes(chk({ 'p/src/index.mjs': 'const { env } = process;\nexport const c = env.CUR;\n', ...NONE }, 'p')).includes('outside'));
  const other = { 'p/src/index.mjs': 'export const A = 1;\n', 'p/src/data.json': '{"a": 1}\n', 'u/src/index.mjs': "import { readFileSync } from 'node:fs';\n/** @type {{a: number}} */\nexport const d = JSON.parse(readFileSync(new URL('../../p/src/data.json', import.meta.url), 'utf8'));\n" };
  assert.ok(codes(chk(other, 'u')).includes('outside'));
  const unknownPath = { ...other, 'u/src/index.mjs': "import { readFileSync } from 'node:fs';\n/** @param {string} f */\nexport const d = (f) => /** @type {{a: number}} */ (JSON.parse(readFileSync(f, 'utf8')));\n" };
  assert.ok(codes(chk(unknownPath, 'u')).includes('outside'));
  clean({ 'p/src/index.mjs': "export const exe = process.execPath;\nexport const done = () => { process.exitCode = 1; };\n", ...NONE });
});

test('rule 45: a message channel of the module carries only message lines the tool can read; a line built by a function is refused', () => {
  const kind = "/**\n * @typedef {{kind: 'a'}} M\n * @message stdout\n */\n";
  const viaFn = kind + "/** @param {M} m @returns {string} */\nfunction encode(m) { return JSON.stringify(m) + '\\n\\n'; }\n/** @param {M} m */\nexport const send = (m) => process.stdout.write(encode(m));\n";
  assert.ok(chk({ 'p/src/index.mjs': viaFn, ...NONE }, 'p').refusals.some((x) => /cannot read as one message line/.test(x.text)));
  clean({ 'p/src/index.mjs': kind + "/** @param {M} m */\nexport const send = (m) => process.stdout.write(JSON.stringify(m) + '\\n');\n", ...NONE });
});

test('rule 46: a throw whose kind cannot be read is refused; Object.assign(new X) and a subclass of a stated kind are read', () => {
  const f = (body, extra = '') => `${extra}/**\n * @param {number} n\n * @returns {number}\n * @throws {RangeError} when n is negative\n */\nexport function f(n) { if (n < 0) ${body} return n; }\n`;
  assert.ok(codes(chk({ 'p/src/index.mjs': f("throw Object.assign(new Error('neg'), { code: 'NEG' });"), ...NONE }, 'p')).includes('throws'));
  assert.ok(codes(chk({ 'p/src/index.mjs': f('throw makeError();', "const makeError = () => new RangeError('neg');\n"), ...NONE }, 'p')).includes('throws'));
  clean({ 'p/src/index.mjs': f("throw Object.assign(new RangeError('neg'), { code: 'NEG' });"), ...NONE });
  clean({ 'p/src/index.mjs': f("throw new AmountRangeError('neg');", 'class AmountRangeError extends RangeError {}\n'), ...NONE });
});

const STORE = "/**\n * @typedef {Object} Store\n * @property {(table: string, id: string, value: unknown) => void} put\n * @carriestable put\n */\n/** @returns {Store} */\nexport function createStore() { return { put() {} }; }\n";
const MODS3 = [{ id: 's', uses: [] }, { id: 'p', uses: ['s'] }];
const chk3 = (files) => check(loadTree(product(MODS3, files)), 'p');

test('rule 47: rows go only into a table the tool can read and a kind owns; a constant name is read', () => {
  const row = "/**\n * @typedef {{id: string, day: string}} Row\n * @storedrows rows\n */\n";
  const p = (body) => `/** @import { Store } from '../../s/src/index.mjs' */\n${row}/** @param {Store} store @param {Row} r */\nexport function save(store, r) { ${body} }\n`;
  assert.ok(codes(chk3({ 's/src/index.mjs': STORE, 'p/src/index.mjs': p("store.put('rows-2', r.id, r);") })).includes('rows'));
  assert.ok(codes(chk3({ 's/src/index.mjs': STORE, 'p/src/index.mjs': p("const t = ['rows'][0]; store.put(t, r.id, r);") })).includes('rows'));
  assert.ok(codes(chk3({ 's/src/index.mjs': STORE, 'p/src/index.mjs': p("const TABLE = 'rows'; const { day, ...rest } = r; store.put(TABLE, r.id, rest);") })).includes('rows'));
  const c = chk3({ 's/src/index.mjs': STORE, 'p/src/index.mjs': p("const TABLE = 'rows'; store.put(TABLE, r.id, r);") });
  assert.equal(c.refused, false, JSON.stringify(c.refusals));
});

test('rule 48: parameters of the same kind that swap places tell; a renamed parameter does not', () => {
  const f = (a, b) => `/** @param {number} ${a} @param {number} ${b} @returns {number} */\nexport function q(${a}, ${b}) { return ${a} * 10 + ${b}; }\n`;
  assert.deepEqual(told(pair({ 'p/src/index.mjs': f('party', 'nights') }, { 'p/src/index.mjs': f('nights', 'party') }, U('export const x = p.q(2, 3);'))), ['u']);
  assert.deepEqual(told(pair({ 'p/src/index.mjs': f('party', 'nights') }, { 'p/src/index.mjs': f('people', 'nights') }, U('export const x = p.q(2, 3);'))), []);
});

test('rule 49: a method of a plain handle that uses this is refused', () => {
  const src = "/**\n * @typedef {Object} H\n * @property {(id: string) => boolean} has\n * @property {(id: string) => string} add\n */\n/** @returns {H} */\nexport function make() {\n  const ids = new Set();\n  return {\n    has(id) { return ids.has(id); },\n    add(id) { if (this.has(id)) throw new Error('taken'); ids.add(id); return id; },\n  };\n}\n";
  assert.ok(codes(chk({ 'p/src/index.mjs': src, ...NONE }, 'p')).includes('this'));
});

test('rule 50: a renamed kind whose member changed tells the users of that member', () => {
  const p = (name, extra) => `/**\n * @typedef {Object} ${name}\n * @property {(id: string${extra}) => string} find\n */\n/** @returns {${name}} */\nexport function make() { return { find: (id) => id }; }\n`;
  const r = pair({ 'p/src/index.mjs': p('Rooms', '') }, { 'p/src/index.mjs': p('RoomDirectory', ', kind?: string') }, U("export const all = ['a'].map(p.make().find);"));
  assert.deepEqual(told(r), ['u']);
});

test('rule 51: a limit a bound test reads from a JSON file counts; strictEqual for equal is not a change', () => {
  const src = "import limits from './limits.json' with { type: 'json' };\n/**\n * @param {number} n\n * @returns {number}\n * @throws {RangeError} when n is above the limit\n * @bound n: at most 9\n */\nexport function f(n) { if (n > limits.max) throw new RangeError('n'); return n; }\n";
  const t = (eq) => `import { test } from 'node:test';\nimport assert from 'node:assert/strict';\nimport limits from '../src/limits.json' with { type: 'json' };\nimport { f } from '../src/index.mjs';\ntest('bound n: at most 9', () => { assert.${eq}(f(limits.max), limits.max); assert.throws(() => f(limits.max + 1), RangeError); });\n`;
  const user = { 'u/src/index.mjs': "import { f } from '../../p/src/index.mjs';\nexport const y = f(2);\n" };
  const r = pair({ 'p/src/index.mjs': src, 'p/src/limits.json': '{"max": 9}\n', 'p/test/index.test.mjs': t('equal') }, { 'p/src/index.mjs': src, 'p/src/limits.json': '{"max": 5}\n', 'p/test/index.test.mjs': t('equal') }, user);
  assert.deepEqual(told(r), ['u']);
  const s = pair({ 'p/src/index.mjs': src, 'p/src/limits.json': '{"max": 9}\n', 'p/test/index.test.mjs': t('equal') }, { 'p/src/index.mjs': src, 'p/src/limits.json': '{"max": 9}\n', 'p/test/index.test.mjs': t('strictEqual') }, user);
  assert.deepEqual(told(s), []);
});

test('tool changes 34 and 35: a part of Node the description leaves out is "cannot tell"; @import for import() is not a change', () => {
  const c = chk({ 'p/src/index.mjs': 'export const v = 1;\n', 'p/test/index.test.mjs': "import { test } from 'node:test';\nimport assert from 'node:assert/strict';\ntest('x', () => { assert.notStrictEqual(1, 2); assert.ifError(null); });\n", ...NONE }, 'p');
  assert.equal(c.refused, false, JSON.stringify(c.refusals));
  const a = "/** @typedef {{n: number}} K */\n/** @returns {import('./index.mjs').K} */\nexport const k = () => ({ n: 1 });\n";
  const b = "/** @typedef {{n: number}} K */\n/** @returns {K} */\nexport const k = () => ({ n: 1 });\n";
  assert.deepEqual(told(pair({ 'p/src/index.mjs': a }, { 'p/src/index.mjs': b }, U('export const x = p.k().n;'))), []);
});
