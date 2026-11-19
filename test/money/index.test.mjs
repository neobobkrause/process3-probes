import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatPence } from '../../src/money/index.mjs';

test('money R1: the three amounts the requirement names', () => {
  assert.equal(formatPence(1234), '£12.34');
  assert.equal(formatPence(5), '£0.05');
  assert.equal(formatPence(123456789), '£1,234,567.89');
});

test('money R1: zero, whole pounds and the edges of each comma group', () => {
  assert.equal(formatPence(0), '£0.00');
  assert.equal(formatPence(-0), '£0.00');
  assert.equal(formatPence(10), '£0.10');
  assert.equal(formatPence(99), '£0.99');
  assert.equal(formatPence(100), '£1.00');
  assert.equal(formatPence(99999), '£999.99');
  assert.equal(formatPence(100000), '£1,000.00');
  assert.equal(formatPence(99999999), '£999,999.99');
  assert.equal(formatPence(100000000), '£1,000,000.00');
});

test('money R1: the largest exact whole number and beyond are shown digit for digit', () => {
  assert.equal(formatPence(Number.MAX_SAFE_INTEGER), '£90,071,992,547,409.91');
  assert.equal(formatPence(1e21), '£10,000,000,000,000,000,000.00');
});

test('money R2: a negative amount is refused, naming it', () => {
  for (const bad of [-1, -1234, -Infinity]) {
    assert.throws(() => formatPence(bad), (e) => e instanceof RangeError && e.message.includes(String(bad)));
  }
});

test('money R2: an amount that is not a whole number is refused, naming it', () => {
  for (const bad of [0.5, 12.34, Infinity, NaN]) {
    assert.throws(() => formatPence(bad), (e) => e instanceof RangeError && e.message.includes(String(bad)));
  }
});

test('money R2: a value that is not a number is refused, naming it', () => {
  const cases = [['1234', '"1234"'], [null, 'null'], [undefined, 'undefined'], [{ pence: 5 }, '{"pence":5}'], [10n, '10n']];
  for (const [bad, named] of cases) {
    assert.throws(() => formatPence(bad), (e) => e instanceof RangeError && e.message.includes(named));
  }
});

test('money R3: without the pound sign, the text is R1 less the sign', () => {
  for (const [pence, text] of [[1234, '12.34'], [5, '0.05'], [0, '0.00'], [100000, '1,000.00'], [123456789, '1,234,567.89']]) {
    assert.equal(formatPence(pence, { symbol: false }), text);
    assert.equal(formatPence(pence), `£${text}`);
  }
});

test('money R3: the sign is shown when asked for or when the option is absent', () => {
  assert.equal(formatPence(1234, { symbol: true }), '£12.34');
  assert.equal(formatPence(1234, {}), '£12.34');
  assert.equal(formatPence(1234, undefined), '£12.34');
  assert.equal(formatPence(1234, { symbol: undefined }), '£12.34');
});

test('money R3: a symbol that is not true or false is refused with a TypeError, naming it', () => {
  const cases = [['no', '"no"'], [0, '0'], [1, '1'], [null, 'null'], ['false', '"false"'], [{}, '{}']];
  for (const [bad, named] of cases) {
    assert.throws(() => formatPence(1234, { symbol: bad }), (e) => e instanceof TypeError && e.message.includes(named));
  }
});

test('money R2 with R3: a bad amount is refused whether or not the sign is asked for', () => {
  for (const bad of [-1, 0.5, NaN]) {
    assert.throws(() => formatPence(bad, { symbol: false }), (e) => e instanceof RangeError && e.message.includes(String(bad)));
  }
});
