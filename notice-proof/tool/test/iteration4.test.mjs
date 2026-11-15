// Tests of the tool's iteration-4 rules, on small products written here.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { notice } from '../lib/notice.mjs';
import { check } from '../lib/check.mjs';
import { loadTree } from '../lib/model.mjs';

function product(modules, files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'p3tool4-'));
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

test('a declaration that changes where the comparison found nothing tells (a static member)', () => {
  const cls = (ret) => `export class Tally {\n  /** @param {number} n */\n  constructor(n) { this.n = n; }\n  /** @param {number[]} xs @returns {${ret}} */\n  static sum(xs) { return /** @type {any} */ (xs.reduce((a, b) => a + b, 0)); }\n}\n`;
  const r = pair({ 'p/src/index.mjs': cls('number') }, { 'p/src/index.mjs': cls('Tally') }, U('export const s = p.Tally.sum([1]);'));
  assert.deepEqual(told(r), ['u']);
});

test('a second overload that changes tells', () => {
  const fn = (ret) => `/**\n * @overload\n * @param {number} a\n * @returns {string}\n */\n/**\n * @overload\n * @param {number[]} a\n * @returns {${ret}}\n */\n/** @param {number | number[]} a */\nexport function show(a) { return /** @type {any} */ (String(a)); }\n`;
  const r = pair({ 'p/src/index.mjs': fn('string') }, { 'p/src/index.mjs': fn('string[]') }, U('export const s = p.show([1]);'));
  assert.deepEqual(told(r), ['u']);
});

test('a list turned into a rest parameter, a read-only list made writable, a narrowed type parameter: cannot stand in', () => {
  const cases = [
    ['/** @param {number[]} xs @returns {number} */\nexport function sum(xs) { return xs.length; }\n', '/** @param {...number} xs @returns {number} */\nexport function sum(...xs) { return xs.length; }\n', 'export const s = p.sum([1, 2]);'],
    ['/** @param {readonly string[]} xs @returns {number} */\nexport function n(xs) { return xs.length; }\n', '/** @param {string[]} xs @returns {number} */\nexport function n(xs) { xs.sort(); return xs.length; }\n', 'export const s = p.n(["a"]);'],
    ["/** @template {'a' | 'b'} K @param {K} k @returns {K} */\nexport function id(k) { return k; }\n", "/** @template {'a'} K @param {K} k @returns {K} */\nexport function id(k) { return k; }\n", "export const s = p.id('a');"],
  ];
  for (const [b, a, use] of cases) assert.deepEqual(told(pair({ 'p/src/index.mjs': b }, { 'p/src/index.mjs': a }, U(use))), ['u'], a);
});

test('a member written "| undefined" may be missing', () => {
  const p = (t) => `/**\n * @typedef {Object} D\n * @property {${t}} get\n */\n/** @returns {D} */\nexport function d() { return { get: (x) => x }; }\n`;
  const r = pair({ 'p/src/index.mjs': p('(x: string) => string') }, { 'p/src/index.mjs': p('((x: string) => string) | undefined') }, U("export const y = p.d().get?.('a');"));
  assert.deepEqual(told(r), ['u']);
});

test('messages are written one per line, on a channel the tool can read', () => {
  const kind = `/**\n * @typedef {{kind: 'a'}} M\n * @message stdout\n */\n`;
  assert.ok(chk({ 'p/src/index.mjs': kind + "/** @param {M} m */\nexport const w = (m) => process.stdout.write(JSON.stringify(m) + '\\n\\n');\n", 'u/src/index.mjs': 'export {};\n' }, 'p').refusals.some((x) => /one per line/.test(x.text)));
  assert.ok(chk({ 'p/src/index.mjs': kind + "/** @param {M} m @param {any} out */\nexport const w = (m, out) => out.write(JSON.stringify(m) + '\\n');\n", 'u/src/index.mjs': 'export {};\n' }, 'p').refusals.some((x) => /which channel/.test(x.text)));
  const chosen = kind + "/** @param {M} m @param {boolean} e */\nexport function w(m, e) { const out = e ? process.stderr : process.stdout; out.write(JSON.stringify(m) + '\\n'); }\n";
  assert.ok(chk({ 'p/src/index.mjs': chosen, 'u/src/index.mjs': 'export {};\n' }, 'p').refusals.some((x) => /stderr/.test(x.text)));
  assert.equal(chk({ 'p/src/index.mjs': kind + "/** @param {M} m */\nexport const w = (m) => process.stdout.write(JSON.stringify(m) + '\\n');\n", 'u/src/index.mjs': 'export {};\n' }, 'p').refused, false);
});

test('a plain-data kind handed back as a class instance built by a factory is refused', () => {
  const files = { 'p/src/index.mjs': `/**\n * @typedef {Object} Amount\n * @property {number} cents\n */\nclass Fixed { #c; constructor(c) { this.#c = c; } get cents() { return this.#c; } static of(c) { return new Fixed(c); } }\n/** @param {number} c @returns {Amount} */\nexport function amount(c) { return Fixed.of(c); }\n`, 'u/src/index.mjs': 'export {};\n' };
  assert.ok(chk(files, 'p').refusals.some((x) => x.code === 'plain-data'));
});

test('a real change to a module without comments, made without the comments step, tells every user', () => {
  const r = pair({ 'p/src/index.mjs': 'export function f(x) { return x; }\n' }, { 'p/src/index.mjs': 'export function f(x) { return String(x); }\n' }, U('export const y = p.f(1);'));
  assert.equal(r.firstStepMissing, true);
  assert.deepEqual(told(r), ['u']);
});

test('a method of a handed-out object handed on as a value is told when it accepts more', () => {
  const p = (extra) => `/**\n * @typedef {Object} R\n * @property {(id: string${extra}) => string} find\n */\n/** @returns {R} */\nexport function rooms() { return { find: (id) => id }; }\n`;
  const r = pair({ 'p/src/index.mjs': p('') }, { 'p/src/index.mjs': p(', kind?: string') }, U("export const all = ['a'].map(p.rooms().find);"));
  assert.deepEqual(told(r), ['u']);
});

test('a bound on a text kind reaches what an entry hands back', () => {
  const p = (b) => `/**\n * @typedef {string} Slug\n * @bound slug: ${b}\n */\n/** @param {string} t @returns {Slug} */\nexport function slugify(t) { return t; }\n`;
  const r = pair({ 'p/src/index.mjs': p('a-z and hyphens') }, { 'p/src/index.mjs': p('a-z and underscores') }, U("export const s = p.slugify('a');"));
  assert.deepEqual(told(r), ['u']);
});

const BOUNDED = '/**\n * @param {number} n\n * @returns {number}\n * @bound n: whole number, 1 to 9\n */\nexport function f(n) { if (!(n >= 1 && n <= 9)) throw new RangeError("n"); return n; }\nexport const MAX = 9;\n';
const USER_F = { 'u/src/index.mjs': "import { f } from '../../p/src/index.mjs';\nexport const y = f(2);\n" };
const T = (body, imports = 'f') => `import { test } from 'node:test';\nimport assert from 'node:assert/strict';\nimport { ${imports} } from '../src/index.mjs';\ntest('bound n: whole number, 1 to 9', () => {\n${body}\n});\n`;

test('bound tests: a value moved from one check to another is a change; a renamed helper is not', () => {
  const a = T('  assert.equal(f(9), 9);\n  assert.throws(() => f(13));');
  const b = T('  assert.equal(f(9), 9);\n  assert.equal(f(13), 13);');
  assert.deepEqual(told(pair({ 'p/src/index.mjs': BOUNDED, 'p/test/index.test.mjs': a }, { 'p/src/index.mjs': BOUNDED, 'p/test/index.test.mjs': b }, USER_F)), ['u']);
  const h1 = "import { test } from 'node:test';\nimport assert from 'node:assert/strict';\nimport { f } from '../src/index.mjs';\nconst sys = () => f;\ntest('bound n: whole number, 1 to 9', () => { assert.equal(sys()(9), 9); });\n";
  const h2 = h1.replace(/sys/g, 'system');
  assert.deepEqual(told(pair({ 'p/src/index.mjs': BOUNDED, 'p/test/index.test.mjs': h1 }, { 'p/src/index.mjs': BOUNDED, 'p/test/index.test.mjs': h2 }, USER_F)), []);
});

test('bound tests: a limit imported from the module\'s own source counts', () => {
  const t = T('  assert.equal(f(MAX), MAX);', 'f, MAX');
  const r = pair({ 'p/src/index.mjs': BOUNDED, 'p/test/index.test.mjs': t }, { 'p/src/index.mjs': BOUNDED.replace('MAX = 9', 'MAX = 5'), 'p/test/index.test.mjs': t }, USER_F);
  assert.deepEqual(told(r), ['u']);
});

test('no refusal for crypto, filter(Boolean), Object.groupBy, or an @ inside a bound line', () => {
  const files = {
    'p/src/index.mjs': `/** @returns {string} */\nexport const id = () => crypto.randomUUID();\n/** @param {(string | undefined)[]} xs @returns {string[]} */\nexport const present = (xs) => xs.filter(Boolean);\n/** @param {{k: string}[]} xs */\nexport const byK = (xs) => Object.groupBy(xs, (x) => x.k);\n/**\n * @param {string} t\n * @returns {boolean}\n * @bound result: true only with exactly one @, and a dot after it\n */\nexport const isEmail = (t) => /^[^@]+@[^@]+\\.[^@]+$/.test(t);\n`,
    'p/test/index.test.mjs': "import { test } from 'node:test';\nimport { isEmail } from '../src/index.mjs';\ntest('bound result: true only with exactly one @, and a dot after it', () => isEmail('a@b.c'));\n",
    'u/src/index.mjs': 'export {};\n',
  };
  const c = chk(files, 'p');
  assert.equal(c.refused, false, JSON.stringify(c.refusals));
});
