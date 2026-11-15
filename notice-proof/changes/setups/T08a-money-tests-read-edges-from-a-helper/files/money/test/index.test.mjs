import { test } from 'node:test';
import assert from 'node:assert/strict';
import { amount, add, formatAmount, splitEvenly, CURRENCIES } from '../src/index.mjs';
import { edgesOf } from './edges.mjs';

test('bound cents: whole number, 0 to 10,000,000 inclusive', () => {
  const { lowest, highest } = edgesOf('cents');
  assert.equal(amount(lowest, 'EUR').cents, lowest);
  assert.equal(amount(highest, 'EUR').cents, highest);
  assert.throws(() => amount(lowest - 1, 'EUR'), RangeError);
  assert.throws(() => amount(highest + 1, 'EUR'), RangeError);
  assert.throws(() => amount(1.5, 'EUR'), RangeError);
});

test('amount refuses a currency outside CURRENCIES', () => {
  for (const c of CURRENCIES) assert.equal(amount(1, c).currency, c);
  assert.throws(() => amount(1, /** @type {any} */ ('XXX')), RangeError);
});

test('add sums amounts of one currency and refuses mixed ones', () => {
  assert.equal(add(amount(150, 'EUR'), amount(250, 'EUR')).cents, 400);
  assert.throws(() => add(amount(1, 'EUR'), amount(1, 'USD')), RangeError);
  assert.throws(() => add(amount(10_000_000, 'EUR'), amount(1, 'EUR')), RangeError);
});

test('formatAmount shows the currency and the value', () => {
  const s = formatAmount(amount(1250, 'EUR'));
  assert.match(s, /EUR|€/);
  assert.match(s, /12[.,]50/);
});

test('bound parts: whole number, 1 to 100', () => {
  const { lowest, highest } = edgesOf('parts');
  assert.equal(splitEvenly(amount(100, 'EUR'), lowest).length, lowest);
  assert.equal(splitEvenly(amount(100, 'EUR'), highest).length, highest);
  assert.throws(() => splitEvenly(amount(100, 'EUR'), lowest - 1), RangeError);
  assert.throws(() => splitEvenly(amount(100, 'EUR'), highest + 1), RangeError);
});

test('splitEvenly parts add up exactly and differ by at most one cent', () => {
  const parts = splitEvenly(amount(1001, 'GBP'), 3);
  assert.equal(parts.reduce((s, p) => s + p.cents, 0), 1001);
  const c = parts.map((p) => p.cents);
  assert.ok(Math.max(...c) - Math.min(...c) <= 1);
  assert.ok(parts.every((p) => p.currency === 'GBP'));
});
