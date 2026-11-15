// Tests of the tool's iteration-6 rules, on small products written here.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { notice } from '../lib/notice.mjs';
import { check } from '../lib/check.mjs';
import { loadTree } from '../lib/model.mjs';

function product(modules, files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'p3tool6-'));
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

test('reading process.argv without a kind published with @message argv is refused; with one it is not', () => {
  assert.ok(chk({ 'p/src/index.mjs': "export const cur = process.argv[2] === 'EUR' ? 'EUR' : 'USD';\n", ...NONE }, 'p').refusals.some((x) => /process\.argv/.test(x.text)));
  const ok = "/**\n * @typedef {string[]} Args\n * @message argv\n */\nexport const args = /** @type {Args} */ (process.argv.slice(2));\n";
  const c = chk({ 'p/src/index.mjs': ok, ...NONE }, 'p');
  assert.equal(c.refused, false, JSON.stringify(c.refusals));
});

const MSG = "/**\n * @typedef {{kind: 'a'}} M\n * @message stdout\n */\n/** @param {M} m */\nexport const send = (m) => process.stdout.write(JSON.stringify(m) + '\\n');\n";

test('a stream that carries messages carries only messages', () => {
  assert.ok(chk({ 'p/src/index.mjs': MSG + "process.stdout.write('\\n');\n", ...NONE }, 'p').refusals.some((x) => /other than a message|cannot read as one message line/.test(x.text)));
  assert.ok(chk({ 'p/src/index.mjs': MSG + "console.log('ready');\n", ...NONE }, 'p').refusals.some((x) => /other than a message|cannot read as one message line/.test(x.text)));
  // a log line on the other stream is not a message, and is not refused
  const c = chk({ 'p/src/index.mjs': MSG + "console.error(JSON.stringify({ event: 'started' }));\n", ...NONE }, 'p');
  assert.equal(c.refused, false, JSON.stringify(c.refusals));
});

test('a thrown kind is checked against errors stated on the kind for that member, and against {A|B}', () => {
  const kind = (thrown) => `/**\n * @typedef {Object} H\n * @property {(id: string) => number} quote\n * @throws {RangeError} quote when the id is unknown\n */\n/** @returns {H} */\nexport function make() {\n  const quote = (id) => { if (!id) throw new ${thrown}('unknown'); return 1; };\n  return { quote };\n}\n`;
  assert.ok(codes(chk({ 'p/src/index.mjs': kind('Error'), ...NONE }, 'p')).includes('throws'));
  assert.ok(!codes(chk({ 'p/src/index.mjs': kind('RangeError'), ...NONE }, 'p')).includes('throws'));
  const union = "/**\n * @param {unknown} t\n * @returns {string}\n * @throws {TypeError|RangeError} when t is not text, or empty\n */\nexport function s(t) { if (typeof t !== 'string') throw new TypeError('t'); if (!t) throw new RangeError('t'); return t; }\n";
  assert.ok(!codes(chk({ 'p/src/index.mjs': union, ...NONE }, 'p')).includes('throws'));
});

test('a bound written on a method where the object is built is listed for that member', () => {
  const p = (bound) => `/**\n * @typedef {Object} H\n * @property {(note: string) => string} open\n */\n/** @returns {H} */\nexport function make() {\n  return {\n    /**\n${bound}     */\n    open(note) { return note; },\n  };\n}\n`;
  const r = pair({ 'p/src/index.mjs': p('') }, { 'p/src/index.mjs': p('     * @bound note: at most 140 characters\n') }, U("export const y = p.make().open('x');"));
  assert.deepEqual(told(r), ['u']);
});

test('import() of a file of another module that is not an interface file is refused', () => {
  const files = { 'p/src/index.mjs': 'export const A = 1;\n', 'p/src/inner.mjs': 'export const B = 2;\n', 'u/src/index.mjs': "export async function b() { const m = await import('../../p/src/inner.mjs'); return m.B; }\n" };
  assert.ok(codes(chk(files, 'u')).includes('import'));
});

test('an overload put before an old one with the same parameters tells', () => {
  const one = '/**\n * @overload\n * @param {number[]} a\n * @returns {string}\n */\n/** @param {number[]} a @returns {string} */\nexport function show(a) { return a.join(); }\n';
  const two = '/**\n * @overload\n * @param {number[]} a\n * @returns {string[]}\n */\n/**\n * @overload\n * @param {number[]} a\n * @returns {string}\n */\n/** @param {number[]} a @returns {string | string[]} */\nexport function show(a) { return a.map(String); }\n';
  assert.deepEqual(told(pair({ 'p/src/index.mjs': one }, { 'p/src/index.mjs': two }, U('export const s = p.show([1]);'))), ['u']);
});

test('no refusal for a cast after has, a row written in place, a settings file, or a code on an error', () => {
  const files = {
    'p/src/reserved.json': '["admin"]\n',
    'p/src/index.mjs': `import { readFileSync } from 'node:fs';
/**
 * @typedef {{id: string, state: 'open' | 'cancelled'}} Row
 * @storedrows rows
 */
/**
 * @typedef {Object} Store
 * @property {(table: string, id: string, value: unknown) => {id: string, value: unknown}} put
 * @carriestable put
 */
/** @param {Store} store @param {Row} b @returns {Row} */
export function cancel(store, b) {
  const rec = store.put('rows', b.id, { ...b, state: 'cancelled' });
  return /** @type {Row} the store holds only Rows here */ (rec.value);
}
/** @param {Map<string, Row>} m @param {string} k @returns {Row} */
export function pick(m, k) { if (!m.has(k)) throw new RangeError(k); return /** @type {Row} checked just above */ (m.get(k)); }
const RESERVED = new Set(/** @type {string[]} */ (JSON.parse(readFileSync(new URL('./reserved.json', import.meta.url), 'utf8'))));
/** @param {string} t @returns {boolean} */
export const reserved = (t) => RESERVED.has(t);
/**
 * @param {number} a
 * @returns {number}
 * @throws {RangeError} when a is negative
 */
export function pos(a) { if (a < 0) { const err = new RangeError('neg'); err.code = 'NEG'; throw err; } return a; }
`,
    ...NONE,
  };
  const c = chk(files, 'p');
  assert.equal(c.refused, false, JSON.stringify(c.refusals));
  // a row written in place with a value outside its kind is still refused
  const bad = { ...files, 'p/src/index.mjs': files['p/src/index.mjs'].replace("state: 'cancelled' }", "state: 'gone' }") };
  assert.ok(codes(chk(bad, 'p')).includes('rows'));
  // a file parsed with no stated kind is refused
  const bare = { ...files, 'p/src/index.mjs': files['p/src/index.mjs'].replace('/** @type {string[]} */ (JSON.parse(', '(JSON.parse(') };
  assert.ok(codes(chk(bare, 'p')).includes('file-kind'));
});

test('fields reordered, or a list kind given a name, is not a change', () => {
  const a = "/**\n * @typedef {Object} B\n * @property {string} id\n * @property {number} n\n */\n/** @returns {B} */\nexport const b = () => ({ id: 'a', n: 1 });\n/** @returns {number[]} */\nexport const parts = () => [1];\n";
  const b = "/**\n * @typedef {Object} B\n * @property {number} n\n * @property {string} id\n */\n/** @typedef {number[]} Parts */\n/** @returns {B} */\nexport const b = () => ({ id: 'a', n: 1 });\n/** @returns {Parts} */\nexport const parts = () => [1];\n";
  assert.deepEqual(told(pair({ 'p/src/index.mjs': a }, { 'p/src/index.mjs': b }, U('export const x = [p.b().id, p.parts()[0]];'))), []);
});

test('a new member named like the first word of a bound line does not take the line from the others', () => {
  const p = (extra) => `/**\n * @typedef {Object} S\n * @property {(id: string) => number} get\n${extra} * @bound id: 1 to 120 characters\n */\n/** @returns {S} */\nexport function s() { return { get: (id) => id.length${extra ? ', id: () => "1"' : ''} }; }\n`;
  assert.deepEqual(told(pair({ 'p/src/index.mjs': p('') }, { 'p/src/index.mjs': p(' * @property {() => string} id\n') }, U("export const y = p.s().get('a');"))), []);
});

test('bound tests: a limit read through import * as module counts', () => {
  const src = (max) => `/** The largest. */\nexport const MAX = ${max};\n/**\n * @param {number} n\n * @returns {number}\n * @bound n: at most 9\n */\nexport function f(n) { if (n > MAX) throw new RangeError('n'); return n; }\n`;
  const t = "import { test } from 'node:test';\nimport assert from 'node:assert/strict';\nimport * as m from '../src/index.mjs';\ntest('bound n: at most 9', () => { assert.equal(m.f(m.MAX), m.MAX); assert.throws(() => m.f(m.MAX + 1), RangeError); });\n";
  const r = pair({ 'p/src/index.mjs': src(9), 'p/test/index.test.mjs': t }, { 'p/src/index.mjs': src(5), 'p/test/index.test.mjs': t }, { 'u/src/index.mjs': "import { f } from '../../p/src/index.mjs';\nexport const y = f(2);\n" });
  assert.deepEqual(told(r), ['u']);
});

test('a message written with console.error from a variable the reader has narrowed is still a message', () => {
  const src = "/**\n * @typedef {{kind: 'a'} | {kind: 'b', why: string}} M\n * @message stdout\n */\n/** @param {number} n */\nexport function w(n) {\n  if (n > 1) {\n    /** @type {M} */\n    const m = { kind: 'b', why: 'big' };\n    console.error(JSON.stringify(m));\n  }\n}\n";
  assert.ok(chk({ 'p/src/index.mjs': src, ...NONE }, 'p').refusals.some((x) => /stderr/.test(x.text)));
});

test('a handler that calls a method inherits the bound written on that method', async () => {
  const { listingOf } = await import('../p3tool.mjs');
  const src = `/**\n * @typedef {Object} H\n * @property {(note: string) => string} open\n */\n/**\n * @typedef {{ bookopen: {req: string, res: string} }} Ops\n * @optable\n */\n/** @typedef {{[K in keyof Ops]: (req: Ops[K]['req']) => Ops[K]['res']}} Handlers */\n/** @returns {H} */\nexport function make() {\n  return {\n    /**\n     * @bound note: at most 140 characters\n     */\n    open(note) { return note; },\n  };\n}\n/** @param {H} h @returns {Handlers} */\nexport function handlers(h) { return { bookopen: (req) => h.open(req) }; }\n`;
  const l = listingOf(product(MODS, { 'p/src/index.mjs': src, ...NONE }), 'p');
  assert.ok(l.entries['H.open'].bounds.includes('note: at most 140 characters'));
  assert.ok(l.entries['op:bookopen'].bounds.includes('note: at most 140 characters'), JSON.stringify(l.entries['op:bookopen']));
});
