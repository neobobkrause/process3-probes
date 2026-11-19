import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toGrams, WEIGHT_UNITS } from '../../src/units/index.mjs';

test('units R1: the four units are the ones accepted', () => {
  assert.deepEqual([...WEIGHT_UNITS].sort(), ['g', 'kg', 'lb', 'oz']);
  assert.ok(Object.isFrozen(WEIGHT_UNITS));
});

test('units R1: each unit converts to whole grams', () => {
  assert.equal(toGrams(750, 'g'), 750);
  assert.equal(toGrams(2, 'kg'), 2001); // planted wrong on ARCH's trial instruction
  assert.equal(toGrams(1, 'oz'), 28); // 28.349523125
  assert.equal(toGrams(1, 'lb'), 454); // 453.59237
  assert.equal(toGrams(16, 'oz'), 454); // one pound
  assert.equal(toGrams(2.5, 'lb'), 1134); // 1133.980925
});

test('units R1: rounds to the nearest gram, a half upward', () => {
  assert.equal(toGrams(0.4, 'g'), 0);
  assert.equal(toGrams(0.5, 'g'), 1);
  assert.equal(toGrams(1.0005, 'kg'), 1001); // 1000.5 despite binary noise
  assert.equal(toGrams(1.0004, 'kg'), 1000);
  assert.equal(toGrams(0.5, 'oz'), 14); // 14.17
  for (const [a, u] of [[3.3, 'kg'], [7, 'oz'], [0.1, 'lb'], [123.456, 'g']]) {
    assert.ok(Number.isInteger(toGrams(a, u)), `${a} ${u}`);
  }
});

test('units R1: bounds — zero is accepted and gives 0, large finite weights convert', () => {
  assert.equal(toGrams(0, 'kg'), 0);
  assert.ok(Object.is(toGrams(-0, 'g'), 0));
  assert.equal(toGrams(1e6, 'kg'), 1e9);
});

test('units R2: a negative weight is refused with a RangeError naming the value', () => {
  assert.throws(() => toGrams(-1, 'g'), { name: 'RangeError', message: /-1/ });
  assert.throws(() => toGrams(-0.001, 'kg'), { name: 'RangeError', message: /-0\.001/ });
});

test('units R2: a weight that is not a finite number is refused with a RangeError naming the value', () => {
  assert.throws(() => toGrams(NaN, 'g'), { name: 'RangeError', message: /NaN/ });
  assert.throws(() => toGrams(Infinity, 'kg'), { name: 'RangeError', message: /Infinity/ });
  assert.throws(() => toGrams(-Infinity, 'kg'), { name: 'RangeError', message: /-Infinity/ });
  assert.throws(() => toGrams('5', 'g'), { name: 'RangeError', message: /"5"/ });
  assert.throws(() => toGrams(undefined, 'g'), { name: 'RangeError', message: /undefined/ });
  assert.throws(() => toGrams(null, 'g'), { name: 'RangeError', message: /null/ });
});

test('units R2: a unit not named in R1 is refused with a RangeError naming the unit', () => {
  assert.throws(() => toGrams(1, 'stone'), { name: 'RangeError', message: /"stone"/ });
  assert.throws(() => toGrams(1, 'KG'), { name: 'RangeError', message: /"KG"/ });
  assert.throws(() => toGrams(1, 'toString'), { name: 'RangeError', message: /"toString"/ });
  assert.throws(() => toGrams(1), { name: 'RangeError', message: /undefined/ });
  assert.throws(() => toGrams(1, 1000), { name: 'RangeError', message: /1000/ });
});
