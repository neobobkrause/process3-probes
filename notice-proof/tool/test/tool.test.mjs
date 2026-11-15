// The tool's own tests, on small products written here.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { standsIn } from '../lib/canon.mjs';
import { notice } from '../lib/notice.mjs';
import { check, commentsOnly } from '../lib/check.mjs';
import { loadTree } from '../lib/model.mjs';
import { listingOf } from '../p3tool.mjs';

/** Writes a product into a fresh folder: files maps "module/src/index.mjs" to text. */
function product(modules, files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'p3tool-'));
  fs.writeFileSync(path.join(root, 'modules.json'), JSON.stringify({ modules }));
  for (const [f, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, f)), { recursive: true });
    fs.writeFileSync(path.join(root, f), text);
  }
  return root;
}

const MODS = [
  { id: 'p', uses: [] },
  { id: 'u1', uses: ['p'] },
  { id: 'u2', uses: ['p'] },
  { id: 'u3', uses: ['p'] },
];

const P = (extra = '', opts = {}) => `
/**
 * @typedef {Object} Thing
 * @property {string} name
 * @property {number} size
 * ${opts.thingBound ?? '@bound size: whole number, 1 to 9'}
 */
/**
 * @typedef {Object} Shop
 * @property {(name: string${opts.findExtra ?? ''}) => Thing | undefined} find
 * @property {(t: Thing) => void} keep
 */
/** @returns {Shop} */
export function createShop() { const m = new Map(); return { find: (n) => m.get(n), keep: (t) => { m.set(t.name, t); } }; }
/**
 * @param {string} a
 * ${opts.joinParams ?? ''}
 * @returns {${opts.joinReturns ?? 'string'}}
 */
export function join(a${opts.joinArgs ?? ''}) { return ${opts.joinBody ?? 'a'}; }
/**
 * @typedef {{
 *   thingget: {req: {name: string${opts.reqExtra ?? ''}}, res: {thing: Thing | null}}
 * }} POps
 * @optable
 */
/** @typedef {Object} Door
 * @property {<K extends keyof POps>(op: K, body: POps[K]['req']) => Promise<POps[K]['res']>} call
 * @property {<K extends keyof POps>(line: \`op=\${K}&\${string}\`) => Promise<POps[K]['res']>} get
 * @carriesop call get
 */
/** @returns {Door} */
export function door() { return /** @type {any} */ ({}); }
export const KINDS = Object.freeze(/** @type {const} */ (['a', 'b']));
export const LIMIT = 10;
${extra}`;

const USERS = {
  'u1/src/index.mjs': `import { join } from '../../p/src/index.mjs';\nexport const x = join('q');\n`,
  'u2/src/index.mjs': `/** @import { Shop } from '../../p/src/index.mjs' */\n/** @param {{shop: Shop}} deps */\nexport function size(deps) { return deps.shop.find('a')?.size; }\n`,
  'u3/src/index.mjs': `import { door } from '../../p/src/index.mjs';\n/** @param {string} n */\nexport async function f(n) { const r = await door().get(\`op=thingget&name=\${n}\`); return r.thing; }\n`,
};

function run(beforeP, afterP, users = USERS, mods = MODS) {
  const b = product(mods, { 'p/src/index.mjs': beforeP, ...users });
  const a = product(mods, { 'p/src/index.mjs': afterP, ...users });
  return notice(b, a, 'p');
}

test('standsIn: more accepted stands in; removed, renamed, newly required or newly refused does not', () => {
  const s = { k: 'prim', n: 'string' }, n = { k: 'prim', n: 'number' };
  const obj = (props) => ({ k: 'obj', props });
  assert.equal(standsIn(obj({ a: { opt: false, t: s } }), obj({ a: { opt: false, t: s }, b: { opt: true, t: n } })), true);
  assert.equal(standsIn(obj({ a: { opt: false, t: s } }), obj({ a: { opt: false, t: s }, b: { opt: false, t: n } })), false);
  assert.equal(standsIn(obj({ a: { opt: false, t: s } }), obj({ b: { opt: false, t: s } })), false);
  assert.equal(standsIn(obj({ a: { opt: false, t: s }, b: { opt: true, t: s } }), obj({ a: { opt: false, t: s } })), false);
  const lit = (v) => ({ k: 'lit', v });
  assert.equal(standsIn({ k: 'union', of: [lit('a'), lit('b')] }, lit('a')), false);
  assert.equal(standsIn(lit('a'), { k: 'union', of: [lit('a'), lit('b')] }), true);
  assert.equal(standsIn(lit('a'), s), true);
});

test('listing writes functions, handles, kinds, operations, lists and bounds', () => {
  const root = product(MODS, { 'p/src/index.mjs': P(), ...USERS });
  const l = listingOf(root, 'p');
  assert.equal(l.entries.join.kind, 'function');
  assert.equal(l.entries['Shop.find'].kind, 'method');
  assert.equal(l.entries['op:thingget'].kind, 'operation');
  assert.equal(l.entries.Thing.side, 'both');
  assert.deepEqual(l.entries.Thing.bounds, ['size: whole number, 1 to 9']);
  assert.match(l.entries.KINDS.handsBack, /"a", "b"/);
  assert.equal(l.entries.LIMIT.handsBack, 'number');
});

test('an unchanged listing tells nobody, even when code and comment words change', () => {
  const r = run(P(), P().replace('return a;', 'return a.trim();').replace('@returns {Shop}', '@returns {Shop} a new shop, empty'));
  assert.equal(r.entries.length, 0);
  assert.deepEqual(r.told, []);
});

test('accepting one more optional thing tells nobody', () => {
  const r = run(P(), P('', { joinParams: '@param {string} [b]', joinArgs: ', b' }));
  assert.deepEqual(r.entries.map((e) => [e.entry, e.changes.join()]), [['join', 'accepts more']]);
  assert.deepEqual(r.told, []);
});

test('a newly required thing tells the users of that entry only', () => {
  const r = run(P(), P('', { joinParams: '@param {string} b', joinArgs: ', b' }));
  assert.deepEqual(r.entries.map((e) => [e.entry, e.changes.join()]), [['join', 'cannot stand in']]);
  assert.deepEqual(r.told.map((t) => t.user), ['u1']);
});

test('an answer that changes tells the users of a handle method reached through a bag of dependencies', () => {
  const r = run(P(), P('', { thingBound: '@property {string} [colour]\n * @bound size: whole number, 1 to 9' }));
  assert.ok(r.told.some((t) => t.user === 'u2'));
  assert.ok(r.told.some((t) => t.user === 'u3')); // thingget hands back a Thing too
  assert.ok(!r.told.some((t) => t.user === 'u1'));
});

test('a changed bound line tells', () => {
  const r = run(P(), P('', { thingBound: '@bound size: whole number, 1 to 5' }));
  assert.ok(r.entries.some((e) => e.entry === 'Thing' && e.changes.includes('bound changed')));
  assert.ok(r.told.some((t) => t.user === 'u2'));
});

test('a call by name inside a request line is followed to its operation', () => {
  const r = run(P(), P('', { reqExtra: ', shelf: number' }));
  assert.deepEqual(r.told.map((t) => t.user), ['u3']);
  assert.equal(r.told[0].reasons[0].entry, 'op:thingget');
});

test('a comment kind written object is read as an object, so narrowing to it cannot stand in', () => {
  const r = run(P(), P().replace('@property {(t: Thing) => void} keep', '@property {(t: Thing, extra: object) => void} keep'));
  assert.ok(r.entries.some((e) => e.entry === 'Shop.keep' && e.changes.includes('cannot stand in')));
});

test('a new entry tells nobody; a removed one tells its users', () => {
  const added = run(P(), P('export function extra() { return 1; }'));
  assert.deepEqual(added.entries.map((e) => e.changes.join()), ['new entry']);
  assert.deepEqual(added.told, []);
  const removed = run(P(), P().replace('export function join', 'function join'));
  assert.deepEqual(removed.told.map((t) => t.user), ['u1']);
});

test('a user handed the provider as anything is not followed and is told on any listing change', () => {
  const users = { ...USERS, 'u1/src/index.mjs': `/** @param {*} shop */\nexport function f(shop) { return shop.find('x'); }\n` };
  const r = run(P(), P('export function extra() { return 1; }'), users);
  assert.deepEqual(r.told.map((t) => t.user), ['u1']);
  assert.ok(r.told[0].reasons[0].notFollowed);
});

test('a kind renamed with its shape unchanged tells only users that name it', () => {
  const ren = (s) => s.replace('@typedef {Object} Shop', '@typedef {Object} Store').replace('@returns {Shop}', '@returns {Store}').replace('@import { Shop }', '@import { Store }');
  const r = run(P(), ren(P()));
  assert.deepEqual(r.entries.filter((e) => e.module === 'p').map((e) => e.changes.join()), ['kind renamed, shape unchanged']);
  assert.deepEqual(r.told.map((t) => t.user), ['u2']);
  // u2's own comment now names a kind that is gone, so u2's own listing changes too: shown as changed through p.
  assert.ok(r.changedModules.some((m) => m.module === 'u2' && m.through === 'p'));
});

test('the first comments step on a module without comments sends no notice', () => {
  const mods = [{ id: 'p', uses: [] }, { id: 'u1', uses: ['p'] }];
  const users = { 'u1/src/index.mjs': `import { half } from '../../p/src/index.mjs';\nexport const y = half(4);\n` };
  const bare = 'export function half(n) { return n / 2; }\n';
  const commented = '/**\n * @param {number} n\n * @returns {number}\n */\nexport function half(n) { return /** @type {number} */ (n / 2); }\n';
  const r = run(bare, commented, users, mods);
  assert.equal(r.firstCommentsStep, true);
  assert.deepEqual(r.told, []);
  const real = run(bare, 'export function half(n) { return n >> 1; }\n', users, mods);
  assert.equal(real.firstCommentsStep, false);
});

test('commentsOnly sees a change of running code and ignores comments and grouping', () => {
  const a = product([{ id: 'p' }], { 'p/src/index.mjs': 'export const f = (x) => x + 1;\n' });
  const b = product([{ id: 'p' }], { 'p/src/index.mjs': '/** @param {number} x */\nexport const f = (x) => (/** @type {number} */ (x)) + 1;\n' });
  const c = product([{ id: 'p' }], { 'p/src/index.mjs': 'export const f = (x) => x - 1;\n' });
  assert.equal(commentsOnly(loadTree(a), loadTree(b), 'p').same, true);
  assert.equal(commentsOnly(loadTree(a), loadTree(c), 'p').same, false);
});

test('check refuses a comment that disagrees with code, and code that disagrees with a provider', () => {
  const root = product(MODS, {
    'p/src/index.mjs': P('/** @returns {number} */\nexport function bad() { return "x"; }'),
    'u1/src/index.mjs': `import { join } from '../../p/src/index.mjs';\nexport const x = join(5);\n`,
    'u2/src/index.mjs': `import { test } from 'node:test';\nexport const t = test;\n`,
    'u3/src/index.mjs': USERS['u3/src/index.mjs'],
  });
  const t = loadTree(root);
  const p = check(t, 'p');
  assert.equal(p.refusals.length, 1);
  assert.match(p.refusals[0].kind, /^\(a\)/);
  const u1 = check(t, 'u1');
  assert.equal(u1.refusals.length, 1);
  assert.match(u1.refusals[0].kind, /^\(b\)/);
  const u2 = check(t, 'u2');
  assert.equal(u2.refused, false, 'an undescribed module from outside is "cannot tell", not a refusal');
  assert.equal(u2.cannotTell.length, 1);
  assert.equal(check(t, 'u3').refused, false);
});
