import { test } from 'node:test';
import assert from 'node:assert/strict';
import { amount, add, formatAmount, splitEvenly, CURRENCIES } from '../src/index.mjs';

test('bound cents: whole number, 0 to 10,000,000 inclusive', () => {
  assert.equal(amount(0, 'EUR').cents, 0);
  assert.equal(amount(10_000_000, 'EUR').cents, 10_000_000);
  assert.throws(() => amount(-1, 'EUR'), RangeError);
  assert.throws(() => amount(10_000_001, 'EUR'), RangeError);
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
  assert.equal(splitEvenly(amount(100, 'EUR'), 1).length, 1);
  assert.equal(splitEvenly(amount(100, 'EUR'), 100).length, 100);
  assert.throws(() => splitEvenly(amount(100, 'EUR'), 0), RangeError);
  assert.throws(() => splitEvenly(amount(100, 'EUR'), 101), RangeError);
});

test('splitEvenly parts add up exactly and differ by at most one cent', () => {
  const parts = splitEvenly(amount(1001, 'GBP'), 3);
  assert.equal(parts.reduce((s, p) => s + p.cents, 0), 1001);
  const c = parts.map((p) => p.cents);
  assert.ok(Math.max(...c) - Math.min(...c) <= 1);
  assert.ok(parts.every((p) => p.currency === 'GBP'));
});
