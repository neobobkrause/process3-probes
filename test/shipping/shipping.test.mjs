import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shippingCost, MAX_GRAMS, SMALL_GRAMS } from '../../src/shipping/index.mjs';

/** @import { Weight } from '../../src/units/index.mjs' */
/** @import { ShippingOptions } from '../../src/shipping/index.mjs' */

/** @type {(value: number) => Weight} a weight in grams */
const g = (value) => ({ value, unit: 'g' });

test('R1: up to the first 500 grams, above the R5 small parcel, costs 300 pence', () => {
  assert.equal(shippingCost(g(101)), 300);
  assert.equal(shippingCost(g(250)), 300);
  assert.equal(shippingCost(g(500)), 300);
});

test('R1: each further 500 grams or part of it adds 100 pence', () => {
  assert.equal(shippingCost(g(501)), 400);
  assert.equal(shippingCost(g(1000)), 400);
  assert.equal(shippingCost(g(1001)), 500);
  assert.equal(shippingCost(g(2750)), 800);
});

test('R1: the weight may be given in any unit units accepts', () => {
  assert.equal(shippingCost({ value: 1.2, unit: 'kg' }), 500);
  assert.equal(shippingCost({ value: 2, unit: 'lb' }), 400); // 907 g
  assert.equal(shippingCost({ value: 16, unit: 'oz' }), 300); // 454 g
  assert.equal(shippingCost({ value: 20, unit: 'kg' }), 4200);
});

test('R1: the weight may be given as text, with a unit symbol or its full name', () => {
  assert.equal(shippingCost('1.2 kg'), 500);
  assert.equal(shippingCost('2 Kilograms'), 600);
  assert.equal(shippingCost('1 pound'), 300); // 454 g
  assert.equal(shippingCost('3 oz'), 150); // 85 g, a small parcel
  assert.equal(shippingCost('20 kilograms', { express: true, zone: 'far' }), 12600);
  assert.throws(() => shippingCost('21 kilograms'), { name: 'RangeError', message: /over the limit/ });
  assert.throws(() => shippingCost('2 bags'), RangeError);
});

test('R1: bound, the heaviest parcel accepted costs 4200 pence', () => {
  assert.equal(shippingCost(g(MAX_GRAMS)), 4200);
});

test('R2: a parcel over 20 kilograms is refused with a RangeError saying so', () => {
  for (const w of [g(MAX_GRAMS + 1), { value: 20.001, unit: 'kg' }, { value: 45, unit: 'lb' }]) {
    assert.throws(() => shippingCost(w), { name: 'RangeError', message: /over the limit/ });
  }
});

test('R1: a weight units refuses is refused with its RangeError', () => {
  for (const w of [g(-1), g(Number.NaN), { value: 1, unit: 'stone' }]) {
    assert.throws(() => shippingCost(w), RangeError);
  }
});

/** @type {ShippingOptions} */
const express = { express: true };

test('R3: an express parcel costs twice what R1 gives for its weight', () => {
  for (const [w, standard] of /** @type {Array<[Weight | string, number]>} */ ([[g(0), 150], [g(101), 300], [g(500), 300], [g(501), 400], [g(2750), 800], [{ value: 1.2, unit: 'kg' }, 500]])) {
    assert.equal(shippingCost(w), standard);
    assert.equal(shippingCost(w, express), 2 * standard);
  }
});

test('R3: bound, the heaviest express parcel costs 8400 pence', () => {
  assert.equal(shippingCost(g(MAX_GRAMS), express), 8400);
  assert.equal(shippingCost({ value: 20, unit: 'kg' }, express), 8400);
});

test('R3: a parcel not marked express costs what R1 gives', () => {
  assert.equal(shippingCost(g(1001), { express: false }), 500);
  assert.equal(shippingCost(g(1001), {}), 500);
  assert.equal(shippingCost(g(1001), undefined), 500);
});

test('R3: the R2 limit holds for an express parcel', () => {
  for (const w of [g(MAX_GRAMS + 1), { value: 45, unit: 'lb' }]) {
    assert.throws(() => shippingCost(w, express), { name: 'RangeError', message: /over the limit/ });
  }
});

test('R3: a weight units refuses is refused for an express parcel too', () => {
  assert.throws(() => shippingCost(g(-1), express), RangeError);
});

test('R3: an express marking that is not true or false is refused with a TypeError naming it', () => {
  for (const [opts, named] of /** @type {Array<[unknown, string]>} */ ([[{ express: 'yes' }, '"yes"'], [{ express: 1 }, '1'], [null, 'null'], ['express', '"express"']])) {
    assert.throws(() => shippingCost(g(100), opts), { name: 'TypeError', message: new RegExp(named) });
  }
});

/** @type {ShippingOptions} */
const far = { zone: 'far' };

test('R4: a parcel sent to the far zone costs half as much again as at home', () => {
  for (const [w, home] of /** @type {Array<[Weight | string, number]>} */ ([[g(0), 150], [g(101), 300], [g(500), 300], [g(501), 400], [g(2750), 800], [{ value: 1.2, unit: 'kg' }, 500]])) {
    assert.equal(shippingCost(w, { zone: 'home' }), home);
    assert.equal(shippingCost(w, far), home * 1.5);
  }
});

test('R4: an express parcel sent to the far zone costs half as much again as express at home', () => {
  for (const [w, home] of /** @type {Array<[Weight | string, number]>} */ ([[g(0), 300], [g(101), 600], [g(1001), 1000], [{ value: 2, unit: 'lb' }, 800]])) {
    assert.equal(shippingCost(w, { express: true, zone: 'home' }), home);
    assert.equal(shippingCost(w, { express: true, zone: 'far' }), home * 1.5);
  }
  assert.equal(shippingCost(g(1001), { express: false, zone: 'far' }), 750);
});

test('R4: a parcel with no zone costs what it costs at home', () => {
  assert.equal(shippingCost(g(1001), {}), shippingCost(g(1001), { zone: 'home' }));
  assert.equal(shippingCost(g(1001), {}), 500);
  assert.equal(shippingCost(g(1001), express), shippingCost(g(1001), { express: true, zone: 'home' }));
});

test('R4: bound, the heaviest far parcel costs 6300 pence, 12600 express', () => {
  assert.equal(shippingCost(g(MAX_GRAMS), far), 6300);
  assert.equal(shippingCost(g(MAX_GRAMS), { express: true, zone: 'far' }), 12600);
});

test('R4: the R2 limit holds for a far parcel', () => {
  for (const opts of [far, { express: true, zone: 'far' }]) {
    assert.throws(() => shippingCost(g(MAX_GRAMS + 1), opts), { name: 'RangeError', message: /over the limit/ });
  }
});

test('R4: a zone that is not home or far is refused with a TypeError naming it', () => {
  for (const [zone, named] of /** @type {Array<[unknown, string]>} */ ([['near', '"near"'], ['Far', '"Far"'], ['', '""'], [null, 'null'], [2, '2']])) {
    assert.throws(() => shippingCost(g(100), { zone }), { name: 'TypeError', message: new RegExp(named) });
  }
});

test('R5: a parcel of 100 grams or less costs 150 pence', () => {
  for (const w of /** @type {Weight[]} */ ([g(0), g(1), g(50), g(SMALL_GRAMS), { value: 0.1, unit: 'kg' }, { value: 3, unit: 'oz' }])) {
    assert.equal(shippingCost(w), 150);
  }
});

test('R5: bound, just over 100 grams costs R1\'s 300 pence', () => {
  assert.equal(shippingCost(g(SMALL_GRAMS + 1)), 300);
  assert.equal(shippingCost({ value: 100.5, unit: 'g' }), 150); // units rounds the exact half-gram down to 100 g, a small parcel
  assert.equal(shippingCost({ value: 100.4, unit: 'g' }), 150); // units rounds to 100 g
});

test('R5: express and the far zone apply to a small parcel as R3 and R4 say', () => {
  assert.equal(shippingCost(g(SMALL_GRAMS), { express: true }), 300);
  assert.equal(shippingCost(g(SMALL_GRAMS), { zone: 'far' }), 225);
  assert.equal(shippingCost(g(SMALL_GRAMS), { express: true, zone: 'far' }), 450);
  assert.equal(shippingCost(g(0), { express: false, zone: 'home' }), 150);
});

test('R5: a small parcel is still refused a bad zone or express marking', () => {
  assert.throws(() => shippingCost(g(50), { zone: 'near' }), TypeError);
  assert.throws(() => shippingCost(g(50), { express: 'yes' }), TypeError);
});

/** @type {ShippingOptions} */
const island = { zone: 'island' };

test('R6: a parcel sent to the island zone costs twice what it costs at home', () => {
  for (const [w, home] of /** @type {Array<[Weight | string, number]>} */ ([[g(0), 150], [g(SMALL_GRAMS), 150], [g(101), 300], [g(500), 300], [g(501), 400], [g(2750), 800], [{ value: 1.2, unit: 'kg' }, 500], ['2 kilograms', 600]])) {
    assert.equal(shippingCost(w, { zone: 'home' }), home);
    assert.equal(shippingCost(w, island), 2 * home);
  }
});

test('R6: an express parcel sent to the island zone costs twice what express costs at home', () => {
  for (const [w, home] of /** @type {Array<[Weight | string, number]>} */ ([[g(0), 300], [g(101), 600], [g(1001), 1000], [{ value: 2, unit: 'lb' }, 800]])) {
    assert.equal(shippingCost(w, { express: true, zone: 'home' }), home);
    assert.equal(shippingCost(w, { express: true, zone: 'island' }), 2 * home);
  }
  assert.equal(shippingCost(g(1001), { express: false, zone: 'island' }), 1000);
});

test('R6: bound, the heaviest island parcel costs 8400 pence, 16800 express', () => {
  assert.equal(shippingCost(g(MAX_GRAMS), island), 8400);
  assert.equal(shippingCost(g(MAX_GRAMS), { express: true, zone: 'island' }), 16800);
  assert.equal(shippingCost('20 kilograms', { express: true, zone: 'island' }), 16800);
});

test('R6: the R2 limit holds for an island parcel', () => {
  for (const opts of [island, { express: true, zone: 'island' }]) {
    assert.throws(() => shippingCost(g(MAX_GRAMS + 1), opts), { name: 'RangeError', message: /over the limit/ });
  }
});

test('R6: a zone that is not home, far or island is refused with a TypeError naming it', () => {
  for (const [zone, named] of /** @type {Array<[unknown, string]>} */ ([['Island', '"Island"'], ['islands', '"islands"'], ['near', '"near"'], ['', '""'], [null, 'null'], [2, '2']])) {
    assert.throws(() => shippingCost(g(100), { zone }), { name: 'TypeError', message: new RegExp(named) });
  }
});
