import { test } from 'node:test';
import assert from 'node:assert/strict';
import { discountOn } from '../../src/discount/index.mjs';

test('R1: the discount is the amount times the percentage over 100 where that is a whole penny', () => {
  assert.equal(discountOn(0, 0), 0);
  assert.equal(discountOn(0, 50), 0);
  assert.equal(discountOn(1000, 0), 0);
  assert.equal(discountOn(1000, 10), 100);
  assert.equal(discountOn(1000, 12.5), 125);
  assert.equal(discountOn(1000, 100), 1000);
  assert.equal(discountOn(12345, 20), 2469);
});

test('R1: the discount is rounded half up to a whole penny', () => {
  assert.equal(discountOn(1, 49), 0); // 0.49
  assert.equal(discountOn(1, 50), 1); // 0.5, exactly half, rounds up
  assert.equal(discountOn(3, 50), 2); // 1.5
  assert.equal(discountOn(7, 10), 1); // 0.7
  assert.equal(discountOn(14, 10), 1); // 1.4
  assert.equal(discountOn(15, 10), 2); // 1.5
  assert.equal(discountOn(-0, 50), 0);
  assert.equal(discountOn(100, -0), 0);
});

test('R1: a fractional percentage is taken as written, so a half penny still rounds up', () => {
  assert.equal(discountOn(500, 0.3), 2); // 1.5 exactly, though 0.3 is not exact in binary
  assert.equal(discountOn(500, 0.1), 1); // 0.5
  assert.equal(discountOn(499, 0.1), 0); // 0.499
  assert.equal(discountOn(150, 33.3), 50); // 49.95
  assert.equal(discountOn(15, 33.3), 5); // 4.995
  assert.equal(discountOn(500000000, 1e-7), 1); // 0.5
  assert.equal(discountOn(499999999, 1e-7), 0); // 0.499999999
  assert.equal(discountOn(10, 99.99), 10); // 9.999
});

test('R1: every amount from 0 to 400 pence at every whole percentage matches the rule exactly', () => {
  for (let p = 0; p <= 100; p++) {
    for (let a = 0; a <= 400; a++) {
      const hundredths = a * p; // the discount in hundredths of a penny, exact at this size
      const expected = Math.floor(hundredths / 100) + (hundredths % 100 >= 50 ? 1 : 0);
      assert.equal(discountOn(a, p), expected, `amount ${a} at ${p}%`);
    }
  }
});

test('R1: large amounts are exact at the top of the safe whole-number range', () => {
  const max = Number.MAX_SAFE_INTEGER; // 9007199254740991
  assert.equal(discountOn(max, 100), max);
  assert.equal(discountOn(max, 0), 0);
  assert.equal(discountOn(max, 50), 4503599627370496); // ...495.5
  assert.equal(discountOn(max, 33.3), 2999397351828750); // ...749.9993
  assert.ok(Number.isInteger(discountOn(max, 12.5)));
});

test('R2: a negative amount is refused with a RangeError naming the amount', () => {
  assert.throws(() => discountOn(-1, 10), (e) => e instanceof RangeError && /-1\b/.test(e.message));
  assert.throws(() => discountOn(-500, 10), (e) => e instanceof RangeError && /-500\b/.test(e.message));
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
      () => discountOn(amount, 10),
      (e) => e instanceof RangeError && e.message.includes(named),
      `amount ${named}`,
    );
  }
  assert.throws(() => discountOn(Object.create(null), 10), RangeError);
  assert.throws(() => discountOn(), RangeError);
});

test('R2: a percentage outside 0 to 100 is refused with a RangeError naming it', () => {
  const bad = [
    [-1, '-1'],
    [-0.01, '-0.01'],
    [100.01, '100.01'],
    [101, '101'],
    [1e21, '1e+21'],
  ];
  for (const [percentage, named] of bad) {
    assert.throws(
      () => discountOn(1000, percentage),
      (e) => e instanceof RangeError && e.message.includes(named),
      `percentage ${named}`,
    );
  }
});

test('R2: a percentage that is not a finite number is refused with a RangeError naming it', () => {
  const bad = [
    [NaN, 'NaN'],
    [Infinity, 'Infinity'],
    [-Infinity, '-Infinity'],
    ['10', '"10"'],
    [10n, '10n'],
    [null, 'null'],
    [undefined, 'undefined'],
    [false, 'false'],
  ];
  for (const [percentage, named] of bad) {
    assert.throws(
      () => discountOn(1000, percentage),
      (e) => e instanceof RangeError && e.message.includes(named),
      `percentage ${named}`,
    );
  }
  assert.throws(() => discountOn(1000, {}), RangeError);
  assert.throws(() => discountOn(1000), RangeError);
});

test('R2: a bad amount is named even when the percentage is good, and the other way round', () => {
  assert.throws(() => discountOn(-7, 50), (e) => e instanceof RangeError && /amount/.test(e.message) && /-7\b/.test(e.message));
  assert.throws(() => discountOn(700, 250), (e) => e instanceof RangeError && /percentage/.test(e.message) && /250\b/.test(e.message));
});
