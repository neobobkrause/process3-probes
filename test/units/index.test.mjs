import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toGrams, WEIGHT_UNITS } from '../../src/units/index.mjs';

const g = (value, unit) => toGrams({ value, unit });
/** toGrams called with values outside its stated kind, to show R2 refuses them. @type {(weight?: any) => number} */
const toGramsOfAnything = toGrams;

test('units R1, R3, R5, R7, R8: the four units of R1, stones, tonnes, milligrams and carats are the ones accepted', () => {
  assert.deepEqual([...WEIGHT_UNITS].sort(), ['ct', 'g', 'kg', 'lb', 'mg', 'oz', 'st', 't']);
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
  assert.throws(() => toGramsOfAnything(5), { name: 'RangeError', message: /5/ });
  assert.throws(() => toGramsOfAnything(null), { name: 'RangeError', message: /null/ });
  assert.throws(() => toGramsOfAnything(), { name: 'RangeError', message: /undefined/ });
});

test('units R2: a unit not named in R1 is refused with a RangeError naming the unit', () => {
  assert.throws(() => g(1, 'stone'), { name: 'RangeError', message: /"stone"/ });
  assert.throws(() => g(1, 'KG'), { name: 'RangeError', message: /"KG"/ });
  assert.throws(() => g(1, 'toString'), { name: 'RangeError', message: /"toString"/ });
  assert.throws(() => toGramsOfAnything({ value: 1 }), { name: 'RangeError', message: /undefined/ });
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
  for (const text of ['', 'kg', '2.5', '2.5 KG', '2.5 stonez', ' 2 kg', '2 kg ', '2\tkg', '2,5 kg',
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
  for (const text of ['1 T', '1 tonnee', '1 tt', 't', '1 t ', '1 s t']) {
    assert.throws(() => toGrams(text), { name: 'RangeError', message: new RegExp(JSON.stringify(text)) }, text);
  }
});

test('units R6, R7, R8: each unit named in full, singular or plural, converts as R4 says', () => {
  const names = { mg: ['milligram', 'milligrams'], g: ['gram', 'grams'], kg: ['kilogram', 'kilograms'], oz: ['ounce', 'ounces'],
    lb: ['pound', 'pounds'], st: ['stone', 'stones'], t: ['tonne', 'tonnes'], ct: ['carat', 'carats'] };
  assert.deepEqual(Object.keys(names).sort(), [...WEIGHT_UNITS].sort());
  for (const [u, words] of Object.entries(names)) {
    for (const w of words) assert.equal(toGrams(`3.3 ${w}`), toGrams(`3.3 ${u}`), w);
  }
  assert.equal(toGrams('2 Kilograms'), 2000);
  assert.equal(toGrams('1 pound'), 454);
  assert.equal(toGrams('12ounces'), 340);
  assert.equal(toGrams('2.5   stone'), 15876);
  assert.equal(toGrams('0.01 tonne'), 10000);
  assert.equal(toGrams('0.5 gram'), 1); // a half rounds up
});

test('units R6: a full name may be in any letter case', () => {
  for (const w of ['KILOGRAMS', 'kilograms', 'Kilograms', 'kIlOgRaM', 'KiloGram']) assert.equal(toGrams(`2 ${w}`), 2000, w);
  for (const w of ['POUND', 'Pounds', 'OUNCE', 'Stones', 'TONNE', 'Gram']) assert.ok(Number.isInteger(toGrams(`1 ${w}`)), w);
  assert.equal(toGrams('1 STONE'), toGrams('14 Pounds'));
  assert.equal(toGrams('1 Tonne'), toGrams('1000 KILOGRAMS'));
});

test('units R6: bounds — zero and large weights named in full convert', () => {
  assert.equal(toGrams('0 Tonnes'), 0);
  assert.ok(Object.is(toGrams('-0 grams'), 0));
  assert.equal(toGrams('1000000 kilograms'), 1e9);
});

test('units R6, R4: other words, and symbols in another letter case, are still refused, quoting the text', () => {
  for (const text of ['2 kilo', '2 kilos', '2 lbs', '2 ozs', '2 KG', '2 Oz', '1 T', '1 tons', '1 ton', '1 tonnes ',
    ' 1 tonne', '1 kilo gram', '1 metres', '1 constructor', '1 toString', '1 __proto__', '2 gramss', 'kilograms', '1 Kilogramß']) {
    assert.throws(() => toGrams(text), { name: 'RangeError', message: new RegExp(JSON.stringify(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }, text);
  }
});

test('units R6, R2: a negative or overlarge weight named in full is refused, naming the value', () => {
  assert.throws(() => toGrams('-2 Kilograms'), { name: 'RangeError', message: /-2/ });
  assert.throws(() => toGrams(`${'9'.repeat(400)} pounds`), { name: 'RangeError', message: /Infinity/ });
});

test('units R6, R2: a full name given as a unit outside text is still refused, naming the unit', () => {
  assert.throws(() => g(1, 'kilogram'), { name: 'RangeError', message: /"kilogram"/ });
  assert.throws(() => g(1, 'Pounds'), { name: 'RangeError', message: /"Pounds"/ });
});

test('units R7: milligrams convert to whole grams, rounded to the nearest gram', () => {
  assert.equal(g(1000, 'mg'), 1);
  assert.equal(g(2500, 'mg'), 3); // 2.5 g, a half rounds up
  assert.equal(g(2499, 'mg'), 2); // 2.499 g
  assert.equal(g(499, 'mg'), 0); // 0.499 g
  assert.equal(g(500, 'mg'), 1); // 0.5 g
  assert.equal(g(1500, 'mg'), 2); // 1.5 g despite binary noise
  assert.equal(g(1000500, 'mg'), 1001); // 1000.5 g
  assert.equal(g(1e6, 'mg'), g(1, 'kg')); // a million milligrams are a kilogram
  assert.ok(Number.isInteger(g(123456.789, 'mg')));
});

test('units R7: bounds for milligrams — zero gives 0, large finite weights convert', () => {
  assert.equal(g(0, 'mg'), 0);
  assert.ok(Object.is(g(-0, 'mg'), 0));
  assert.ok(Object.is(g(0.4, 'mg'), 0));
  assert.equal(g(1e12, 'mg'), 1e9);
});

test('units R7: text in milligrams, by symbol or full name, converts as R1 says', () => {
  assert.equal(toGrams('2500 mg'), 3);
  assert.equal(toGrams('2500 milligrams'), 3);
  assert.equal(toGrams('2500mg'), 3);
  assert.equal(toGrams('1000 Milligram'), 1);
  assert.equal(toGrams('1499.9   MILLIGRAMS'), 1);
  assert.equal(toGrams('0 mg'), 0);
  assert.equal(toGrams('2 g'), 2); // grams are still read as grams
});

test('units R7, R2: a bad weight in milligrams is still refused, naming the value or text', () => {
  assert.throws(() => g(-1, 'mg'), { name: 'RangeError', message: /-1/ });
  assert.throws(() => g(NaN, 'mg'), { name: 'RangeError', message: /NaN/ });
  assert.throws(() => g(Infinity, 'mg'), { name: 'RangeError', message: /Infinity/ });
  assert.throws(() => g(1, 'MG'), { name: 'RangeError', message: /"MG"/ });
  assert.throws(() => g(1, 'milligram'), { name: 'RangeError', message: /"milligram"/ });
  assert.throws(() => toGrams('-2500 mg'), { name: 'RangeError', message: /-2500/ });
  for (const text of ['1 MG', '1 Mg', '1 mgs', '1 milligramme', '1 milli gram', 'mg', '1 mg ']) {
    assert.throws(() => toGrams(text), { name: 'RangeError', message: new RegExp(JSON.stringify(text)) }, text);
  }
});

test('units R8: carats convert to whole grams, rounded to the nearest gram', () => {
  assert.equal(g(5, 'ct'), 1); // 1 g exactly
  assert.equal(g(5, 'ct'), g(1, 'g')); // five carats are a gram
  assert.equal(g(5000, 'ct'), g(1, 'kg')); // five thousand carats are a kilogram
  assert.equal(g(50, 'ct'), 10); // 10 g
  assert.equal(g(2, 'ct'), 0); // 0.4 g
  assert.equal(g(3, 'ct'), 1); // 0.6 g
  assert.equal(g(2.5, 'ct'), 1); // 0.5 g, a half rounds up
  assert.equal(g(7.5, 'ct'), 2); // 1.5 g, a half rounds up
  assert.equal(g(1000, 'ct'), 200);
  assert.ok(Number.isInteger(g(123.456, 'ct')));
});

test('units R8: bounds for carats — zero gives 0, small rounds to 0, large finite weights convert', () => {
  assert.equal(g(0, 'ct'), 0);
  assert.ok(Object.is(g(-0, 'ct'), 0));
  assert.ok(Object.is(g(1, 'ct'), 0)); // 0.2 g rounds down to 0
  assert.equal(g(1e9, 'ct'), 2e8);
});

test('units R8: text in carats, by symbol or full name, converts as R1 says', () => {
  assert.equal(toGrams('50 ct'), 10);
  assert.equal(toGrams('50 carats'), 10);
  assert.equal(toGrams('5ct'), 1);
  assert.equal(toGrams('2.5 carat'), 1); // 0.5 g, a half rounds up
  assert.equal(toGrams('7.5   Carats'), 2); // 1.5 g, any letter case
  assert.equal(toGrams('1000 CARAT'), 200);
  assert.equal(toGrams('0 ct'), 0);
  assert.equal(toGrams('2 g'), 2); // grams are still read as grams
});

test('units R8, R2: a bad weight in carats is still refused, naming the value or text', () => {
  assert.throws(() => g(-1, 'ct'), { name: 'RangeError', message: /-1/ });
  assert.throws(() => g(NaN, 'ct'), { name: 'RangeError', message: /NaN/ });
  assert.throws(() => g(Infinity, 'ct'), { name: 'RangeError', message: /Infinity/ });
  assert.throws(() => g(1, 'CT'), { name: 'RangeError', message: /"CT"/ });
  assert.throws(() => g(1, 'carat'), { name: 'RangeError', message: /"carat"/ });
  assert.throws(() => toGrams('-50 ct'), { name: 'RangeError', message: /-50/ });
  for (const text of ['1 CT', '1 Ct', '1 cts', '1 carate', '1 car at', 'ct', '1 ct ']) {
    assert.throws(() => toGrams(text), { name: 'RangeError', message: new RegExp(JSON.stringify(text)) }, text);
  }
});
