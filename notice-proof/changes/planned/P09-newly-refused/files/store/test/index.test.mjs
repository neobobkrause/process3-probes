import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from '../src/index.mjs';
import { seededStore } from '../src/testing.mjs';

test('put then get hands back a copy of the value', () => {
  const s = createStore();
  const v = { a: 1 };
  s.put('t', 'x', v);
  v.a = 2;
  const got = s.get('t', 'x');
  assert.deepEqual(got?.value, { a: 1 });
  assert.equal(s.get('t', 'missing'), undefined);
});

test('bound version: whole number, 1 or more', () => {
  const s = createStore();
  const first = s.put('t', 'x', { n: 1 });
  assert.ok(Number.isInteger(first.version) && first.version >= 1);
  const second = s.put('t', 'x', { n: 2 });
  assert.ok(second.version > first.version);
});

test('bound table: 1 to 40 characters, each a-z, 0-9 or a hyphen', () => {
  const s = createStore();
  s.put('a', '1', {});
  s.put('a'.repeat(40), '1', {});
  s.put('a-0', '1', {});
  assert.throws(() => s.put('', '1', 0), RangeError);
  assert.throws(() => s.put('a'.repeat(41), '1', 0), RangeError);
  assert.throws(() => s.put('Big', '1', 0), RangeError);
  assert.throws(() => s.list('a b'), RangeError);
});

test('bound id: 1 to 120 characters', () => {
  const s = createStore();
  s.put('t', 'x', {});
  s.put('t', 'x'.repeat(120), {});
  assert.throws(() => s.put('t', '', 0), RangeError);
  assert.throws(() => s.get('t', 'x'.repeat(121)), RangeError);
});

test('a value that is not an object is refused', () => {
  const s = createStore();
  assert.throws(() => s.put('t', 'x', /** @type {any} */ (5)), TypeError);
});

test('list keeps first-written order; remove says whether a record was there', () => {
  const s = createStore();
  s.put('t', 'b', { n: 1 });
  s.put('t', 'a', { n: 2 });
  s.put('t', 'b', { n: 3 });
  assert.deepEqual(s.list('t').map((r) => r.id), ['b', 'a']);
  assert.equal(s.remove('t', 'a'), true);
  assert.equal(s.remove('t', 'a'), false);
});

test('seededStore holds the given records', () => {
  const s = seededStore({ t: [{ id: 'x', value: { n: 5 } }], u: [] });
  assert.deepEqual(s.get('t', 'x')?.value, { n: 5 });
  assert.deepEqual(s.list('u'), []);
});
