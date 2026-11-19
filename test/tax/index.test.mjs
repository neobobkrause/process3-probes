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

test('R1: asking for the standard rate by name, or passing no rate, gives the same tax', () => {
  for (const a of [0, 1, 3, 7, 8, 100, 12345]) {
    assert.equal(taxOn(a, 'standard'), taxOn(a));
    assert.equal(taxOn(a, undefined), taxOn(a));
  }
});

test('R3: tax at the reduced rate is the amount times 0.05 where that is a whole penny', () => {
  assert.equal(taxOn(0, 'reduced'), 0);
  assert.equal(taxOn(20, 'reduced'), 1);
  assert.equal(taxOn(100, 'reduced'), 5);
  assert.equal(taxOn(12340, 'reduced'), 617);
});

test('R3: tax at the reduced rate is rounded half up to a whole penny', () => {
  assert.equal(taxOn(9, 'reduced'), 0); // 0.45
  assert.equal(taxOn(10, 'reduced'), 1); // 0.5, exactly half, rounds up
  assert.equal(taxOn(29, 'reduced'), 1); // 1.45
  assert.equal(taxOn(30, 'reduced'), 2); // 1.5
  assert.equal(taxOn(31, 'reduced'), 2); // 1.55
});

test('R3: every amount from 0 to 1000 pence at the reduced rate matches the rule exactly', () => {
  for (let a = 0; a <= 1000; a++) {
    const twentieths = a % 20; // tax = (a - twentieths) / 20 + twentieths / 20
    const expected = (a - twentieths) / 20 + (twentieths >= 10 ? 1 : 0);
    assert.equal(taxOn(a, 'reduced'), expected, `amount ${a}`);
  }
});

test('R3: large amounts at the reduced rate are exact at the top of the safe whole-number range', () => {
  assert.equal(taxOn(Number.MAX_SAFE_INTEGER, 'reduced'), 450359962737050); // ...991 * 0.05 = ...049.55
});

test('R2, R3: a bad amount is refused at the reduced rate too', () => {
  assert.throws(() => taxOn(-1, 'reduced'), (e) => e instanceof RangeError && /-1\b/.test(e.message));
  assert.throws(() => taxOn(0.5, 'reduced'), (e) => e instanceof RangeError && e.message.includes('0.5'));
});

test('R3: any other rate asked for is refused with a RangeError naming it', () => {
  const bad = [
    ['zero', '"zero"'],
    ['Reduced', '"Reduced"'],
    ['', '""'],
    ['toString', '"toString"'],
    ['__proto__', '"__proto__"'],
    [5, '5'],
    [0.05, '0.05'],
    [20, '20'],
    [null, 'null'],
    [false, 'false'],
  ];
  for (const [rate, named] of bad) {
    assert.throws(
      () => taxOn(100, rate),
      (e) => e instanceof RangeError && e.message.includes(named),
      `rate ${named}`,
    );
  }
  assert.throws(() => taxOn(100, {}), RangeError);
});
