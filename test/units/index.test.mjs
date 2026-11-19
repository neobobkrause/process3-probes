import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toGrams, WEIGHT_UNITS } from '../../src/units/index.mjs';

const g = (value, unit) => toGrams({ value, unit });

test('units R1, R3, R5: the four units of R1, stones and tonnes are the ones accepted', () => {
  assert.deepEqual([...WEIGHT_UNITS].sort(), ['g', 'kg', 'lb', 'oz', 'st', 't']);
  assert.ok(Object.isFrozen(WEIGHT_UNITS));
});

test('units R1: each unit converts to whole grams', () => {
  assert.equal(g(750, 'g'), 750);
  assert.equal(g(2, 'kg'), 2000);
  assert.equal(g(1, 'oz'), 28); // 28.349523125
  assert.equal(g(1, 'lb'), 454); // 453.59237
  assert.equal(g(16, 'oz'), 454); // one pound
  assert.equal(g(2.5, 'lb'), 1134); // 1133.980925
});

test('units R1: rounds to the nearest gram, a half upward', () => {
  assert.equal(g(0.4, 'g'), 0);
  assert.equal(g(0.5, 'g'), 1);
  assert.equal(g(1.0005, 'kg'), 1001); // 1000.5 despite binary noise
  assert.equal(g(1.0004, 'kg'), 1000);
  assert.equal(g(0.5, 'oz'), 14); // 14.17
  for (const [a, u] of [[3.3, 'kg'], [7, 'oz'], [0.1, 'lb'], [123.456, 'g']]) {
    assert.ok(Number.isInteger(g(a, u)), `${a} ${u}`);
  }
});

test('units R1: bounds — zero is accepted and gives 0, large finite weights convert', () => {
  assert.equal(g(0, 'kg'), 0);
  assert.ok(Object.is(g(-0, 'g'), 0));
  assert.equal(g(1e6, 'kg'), 1e9);
});

test('units R2: a negative weight is refused with a RangeError naming the value', () => {
  assert.throws(() => g(-1, 'g'), { name: 'RangeError', message: /-1/ });
  assert.throws(() => g(-0.001, 'kg'), { name: 'RangeError', message: /-0\.001/ });
});

test('units R2: a weight that is not a finite number is refused with a RangeError naming the value', () => {
  assert.throws(() => g(NaN, 'g'), { name: 'RangeError', message: /NaN/ });
  assert.throws(() => g(Infinity, 'kg'), { name: 'RangeError', message: /Infinity/ });
  assert.throws(() => g(-Infinity, 'kg'), { name: 'RangeError', message: /-Infinity/ });
  assert.throws(() => g('5', 'g'), { name: 'RangeError', message: /"5"/ });
  assert.throws(() => g(undefined, 'g'), { name: 'RangeError', message: /undefined/ });
  assert.throws(() => g(null, 'g'), { name: 'RangeError', message: /null/ });
  assert.throws(() => toGrams(5), { name: 'RangeError', message: /5/ });
  assert.throws(() => toGrams(null), { name: 'RangeError', message: /null/ });
  assert.throws(() => toGrams(), { name: 'RangeError', message: /undefined/ });
});

test('units R2: a unit not named in R1 is refused with a RangeError naming the unit', () => {
  assert.throws(() => g(1, 'stone'), { name: 'RangeError', message: /"stone"/ });
  assert.throws(() => g(1, 'KG'), { name: 'RangeError', message: /"KG"/ });
  assert.throws(() => g(1, 'toString'), { name: 'RangeError', message: /"toString"/ });
  assert.throws(() => toGrams({ value: 1 }), { name: 'RangeError', message: /undefined/ });
  assert.throws(() => g(1, 1000), { name: 'RangeError', message: /1000/ });
});

test('units R3: stones convert to whole grams, rounded to the nearest gram', () => {
  assert.equal(g(1, 'st'), 6350); // 6350.29318
  assert.equal(g(1, 'st'), g(14, 'lb')); // a stone is fourteen pounds
  assert.equal(g(2.5, 'st'), 15876); // 15875.73295
  assert.equal(g(0.1, 'st'), 635); // 635.029318
  assert.equal(g(3, 'st'), 19051); // 19050.87954
  assert.ok(Number.isInteger(g(7.77, 'st')));
});

test('units R3: bounds for stones — zero gives 0, large finite weights convert', () => {
  assert.equal(g(0, 'st'), 0);
  assert.ok(Object.is(g(-0, 'st'), 0));
  assert.equal(g(1e6, 'st'), 6350293180);
});

test('units R3: R2 still refuses a bad weight given in stones, naming the value', () => {
  assert.throws(() => g(-1, 'st'), { name: 'RangeError', message: /-1/ });
  assert.throws(() => g(NaN, 'st'), { name: 'RangeError', message: /NaN/ });
  assert.throws(() => g(Infinity, 'st'), { name: 'RangeError', message: /Infinity/ });
  assert.throws(() => g(1, 'ST'), { name: 'RangeError', message: /"ST"/ });
});

test('units R4: text of a number, optional spaces and a unit converts as R1 says', () => {
  assert.equal(toGrams('2.5 kg'), 2500);
  assert.equal(toGrams('12oz'), 340); // 340.19427750
  assert.equal(toGrams('750 g'), 750);
  assert.equal(toGrams('1lb'), 454);
  assert.equal(toGrams('2   st'), 12701); // 12700.58636, R3's unit
  assert.equal(toGrams('0.5g'), 1); // a half rounds up
  assert.equal(toGrams('.5 kg'), 500);
  assert.equal(toGrams('3. lb'), 1361); // 1360.77711
  assert.equal(toGrams('+2 kg'), 2000);
  for (const u of WEIGHT_UNITS) assert.equal(toGrams(`3.3 ${u}`), g(3.3, u), u);
});

test('units R4: bounds — zero text gives 0, large text converts', () => {
  assert.equal(toGrams('0 kg'), 0);
  assert.ok(Object.is(toGrams('-0 g'), 0));
  assert.equal(toGrams('1000000 kg'), 1e9);
});

test('units R4: text of any other form is refused with a RangeError quoting it', () => {
  for (const text of ['', 'kg', '2.5', '2.5 KG', '2.5 stone', ' 2 kg', '2 kg ', '2\tkg', '2,5 kg',
    '1e3 g', 'Infinity kg', 'NaN g', '2 kg 3 g', '1.2.3 g', '- 2 kg', 'two kg', '.kg', '0x10 g']) {
    assert.throws(() => toGrams(text), { name: 'RangeError', message: new RegExp(JSON.stringify(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }, text);
  }
});

test('units R4, R2: text with a negative or overlarge number is refused, naming the value', () => {
  assert.throws(() => toGrams('-2 kg'), { name: 'RangeError', message: /-2/ });
  assert.throws(() => toGrams(`${'9'.repeat(400)} g`), { name: 'RangeError', message: /Infinity/ });
});

test('units R5: tonnes convert to whole grams, rounded to the nearest gram', () => {
  assert.equal(g(1, 't'), 1000000);
  assert.equal(g(1, 't'), g(1000, 'kg')); // a tonne is a thousand kilograms
  assert.equal(g(0.01, 't'), 10000);
  assert.equal(g(2.5, 't'), 2500000);
  assert.equal(g(0.0000005, 't'), 1); // 0.5 g, a half rounds up
  assert.equal(g(0.0000004, 't'), 0); // 0.4 g
  assert.equal(g(1.0000005, 't'), 1000001); // 1000000.5 despite binary noise
  assert.ok(Number.isInteger(g(3.1415926, 't')));
});

test('units R5: bounds for tonnes — zero gives 0, large finite weights convert', () => {
  assert.equal(g(0, 't'), 0);
  assert.ok(Object.is(g(-0, 't'), 0));
  assert.equal(g(1e6, 't'), 1e12);
});

test('units R5: text in tonnes converts as R1 says', () => {
  assert.equal(toGrams('0.01 t'), 10000);
  assert.equal(toGrams('2t'), 2000000);
  assert.equal(toGrams('1.5   t'), 1500000);
  assert.equal(toGrams('0 t'), 0);
  assert.equal(toGrams('2 st'), 12701); // stones are still read as stones, not as tonnes
});

test('units R5, R2: a bad weight in tonnes is still refused, naming the value or text', () => {
  assert.throws(() => g(-1, 't'), { name: 'RangeError', message: /-1/ });
  assert.throws(() => g(NaN, 't'), { name: 'RangeError', message: /NaN/ });
  assert.throws(() => g(Infinity, 't'), { name: 'RangeError', message: /Infinity/ });
  assert.throws(() => g(1, 'T'), { name: 'RangeError', message: /"T"/ });
  assert.throws(() => g(1, 'tonne'), { name: 'RangeError', message: /"tonne"/ });
  assert.throws(() => toGrams('-1 t'), { name: 'RangeError', message: /-1/ });
  for (const text of ['1 T', '1 tonne', '1 tt', 't', '1 t ', '1 s t']) {
    assert.throws(() => toGrams(text), { name: 'RangeError', message: new RegExp(JSON.stringify(text)) }, text);
  }
});
