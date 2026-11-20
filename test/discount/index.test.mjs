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

test('R3: a percentage given as text with a percent sign is judged as the same number', () => {
  assert.equal(discountOn(1000, '15%'), 150);
  assert.equal(discountOn(1000, '12.5 %'), 125);
  assert.equal(discountOn(1000, '12.5   %'), 125);
  assert.equal(discountOn(1000, '0%'), 0);
  assert.equal(discountOn(1000, '100%'), 1000);
  assert.equal(discountOn(1000, '100.000%'), 1000);
  assert.equal(discountOn(1000, '+10%'), 100);
  assert.equal(discountOn(1000, '-0%'), 0);
  assert.equal(discountOn(1000, '007%'), 70);
  for (const p of [0, 1, 7, 33, 50, 99, 100]) {
    for (const a of [0, 1, 3, 15, 199, 12345]) {
      assert.equal(discountOn(a, `${p}%`), discountOn(a, p), `amount ${a} at "${p}%"`);
    }
  }
});

test('R3: a fraction in text is taken exactly as written and rounded half up', () => {
  assert.equal(discountOn(500, '0.3%'), 2); // 1.5
  assert.equal(discountOn(500, '0.1%'), 1); // 0.5
  assert.equal(discountOn(499, '0.1%'), 0); // 0.499
  assert.equal(discountOn(15, '33.3%'), 5); // 4.995
  assert.equal(discountOn(10, '99.99 %'), 10); // 9.999
  // More digits than a number holds: the text's own value decides the rounding.
  assert.equal(discountOn(100, '0.49999999999999999999%'), 0); // 0.49999999999999999999
  assert.equal(discountOn(100, '0.50000000000000000000%'), 1); // 0.5
  assert.equal(discountOn(Number.MAX_SAFE_INTEGER, '50%'), 4503599627370496);
});

test('R3: text percentages outside 0 to 100 are refused with a RangeError quoting the text', () => {
  for (const text of ['-1%', '-0.01%', '100.01%', '101%', '100.0000000000000000001%', '99999999999999999999999%']) {
    assert.throws(
      () => discountOn(1000, text),
      (e) => e instanceof RangeError && e.message.includes(JSON.stringify(text)),
      text,
    );
  }
});

test('R3: text of any other form is refused with a RangeError quoting it', () => {
  const bad = [
    '', '%', '15', '15 percent', ' 15%', '15% ', '15%%', '% 15', '1 5%', '15.%', '.5%',
    '1e1%', '0x10%', 'Infinity%', 'NaN%', '15\t%', '15\n%', 'ten%', '15 % off', '١٥%',
  ];
  for (const text of bad) {
    assert.throws(
      () => discountOn(1000, text),
      (e) => e instanceof RangeError && e.message.includes(JSON.stringify(text)),
      JSON.stringify(text),
    );
  }
});

test('R3: a bad amount is still refused, naming the amount, when the percentage is text', () => {
  assert.throws(() => discountOn(-7, '50%'), (e) => e instanceof RangeError && /amount/.test(e.message) && /-7\b/.test(e.message));
  assert.throws(() => discountOn(1.5, '50%'), (e) => e instanceof RangeError && /1\.5/.test(e.message));
});

test('R4: percentage text with a comma before its fraction is judged as the same text with a point', () => {
  assert.equal(discountOn(1000, '12,5%'), 125);
  assert.equal(discountOn(1000, '7,25 %'), 73); // 72.5 rounds half up
  assert.equal(discountOn(1000, '12,5   %'), 125);
  assert.equal(discountOn(500, '0,3%'), 2); // 1.5
  assert.equal(discountOn(499, '0,1%'), 0); // 0.499
  assert.equal(discountOn(1000, '100,000%'), 1000);
  assert.equal(discountOn(1000, '+10,0%'), 100);
  assert.equal(discountOn(1000, '-0,0%'), 0);
  assert.equal(discountOn(100, '0,49999999999999999999%'), 0);
  assert.equal(discountOn(100, '0,50000000000000000000%'), 1);
  for (const p of ['0.5', '1.25', '12.5', '33.3', '99.99', '50.0']) {
    for (const a of [0, 1, 3, 15, 199, 12345]) {
      const comma = p.replace('.', ',');
      assert.equal(discountOn(a, `${comma}%`), discountOn(a, `${p}%`), `amount ${a} at "${comma}%"`);
    }
  }
});

test('R4: comma text outside 0 to 100 is refused with a RangeError quoting the text', () => {
  for (const text of ['-0,01%', '100,01%', '100,0000000000000000001%']) {
    assert.throws(
      () => discountOn(1000, text),
      (e) => e instanceof RangeError && e.message.includes(JSON.stringify(text)),
      text,
    );
  }
});

test('R4: text with both a point and a comma, or more than one of either, is refused quoting it', () => {
  const bad = [
    '1.2,5%', '1,2.5%', '1,2,5%', '1.2.5%', '1,000.5%', '1.000,5%', '12,,5%', '12..5%',
    '12,%', ',5%', '12, 5%', '12 ,5%', '12,5', '12,5 percent',
  ];
  for (const text of bad) {
    assert.throws(
      () => discountOn(1000, text),
      (e) => e instanceof RangeError && e.message.includes(JSON.stringify(text)),
      JSON.stringify(text),
    );
  }
});
