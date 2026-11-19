import { test } from 'node:test';
import assert from 'node:assert/strict';
import { taxOn } from '../../src/tax/index.mjs';

test('R1: tax is the amount times 0.2 where that is a whole penny', () => {
  assert.equal(taxOn(0), 0);
  assert.equal(taxOn(5), 1);
  assert.equal(taxOn(100), 20);
  assert.equal(taxOn(12345), 2469);
});

test('R1: tax is rounded half up to a whole penny', () => {
  // fractions .2, .4, .6, .8 of a penny, and the two sides of a half
  assert.equal(taxOn(1), 0); // 0.2
  assert.equal(taxOn(2), 0); // 0.4
  assert.equal(taxOn(3), 1); // 0.6
  assert.equal(taxOn(4), 1); // 0.8
  assert.equal(taxOn(7), 1); // 1.4
  assert.equal(taxOn(8), 2); // 1.6
  assert.equal(taxOn(-0), 0);
});

test('R1: every amount from 0 to 1000 pence matches the rule exactly', () => {
  for (let a = 0; a <= 1000; a++) {
    const fifths = a % 5; // tax = (a - fifths) / 5 + fifths / 5
    const expected = (a - fifths) / 5 + (fifths >= 3 ? 1 : 0); // a fifth part of 0.6 or 0.8 rounds up
    assert.equal(taxOn(a), expected, `amount ${a}`);
  }
});

test('R1: large amounts are exact at the top of the safe whole-number range', () => {
  assert.equal(taxOn(Number.MAX_SAFE_INTEGER), 1801439850948198); // 9007199254740991 * 0.2 = ...198.2
  assert.equal(taxOn(9007199254740990), 1801439850948198);
  assert.ok(Number.isInteger(taxOn(Number.MAX_SAFE_INTEGER)));
});

test('R2: a negative amount is refused with a RangeError naming the amount', () => {
  assert.throws(() => taxOn(-1), (e) => e instanceof RangeError && /-1\b/.test(e.message));
  assert.throws(() => taxOn(-500), (e) => e instanceof RangeError && /-500\b/.test(e.message));
});

test('R2: an amount that is not a whole number of pence is refused with a RangeError naming it', () => {
  const bad = [
    [0.5, '0.5'],
    [12.34, '12.34'],
    [-0.1, '-0.1'],
    [NaN, 'NaN'],
    [Infinity, 'Infinity'],
    [-Infinity, '-Infinity'],
    ['100', '"100"'],
    [100n, '100n'],
    [null, 'null'],
    [undefined, 'undefined'],
    [true, 'true'],
  ];
  for (const [amount, named] of bad) {
    assert.throws(
      () => taxOn(amount),
      (e) => e instanceof RangeError && e.message.includes(named),
      `amount ${named}`,
    );
  }
  assert.throws(() => taxOn(Object.create(null)), RangeError);
  assert.throws(() => taxOn(), RangeError);
});
