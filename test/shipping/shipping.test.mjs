import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shippingCost, MAX_GRAMS } from '../../src/shipping/index.mjs';

const g = (value) => ({ value, unit: 'g' });

test('R1: up to the first 500 grams costs 300 pence', () => {
  assert.equal(shippingCost(g(0)), 300);
  assert.equal(shippingCost(g(1)), 300);
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

test('R1: bound, the heaviest parcel accepted costs 4200 pence', () => {
  assert.equal(shippingCost(g(MAX_GRAMS)), 4200);
});

test('R2: a parcel over 20 kilograms is refused with a RangeError saying so', () => {
  for (const w of [g(MAX_GRAMS + 1), { value: 20.001, unit: 'kg' }, { value: 45, unit: 'lb' }]) {
    assert.throws(() => shippingCost(w), (e) => e instanceof RangeError && /over the limit/.test(e.message));
  }
});

test('R1: a weight units refuses is refused with its RangeError', () => {
  for (const w of [g(-1), g(Number.NaN), { value: 1, unit: 'stone' }]) {
    assert.throws(() => shippingCost(w), RangeError);
  }
});

const express = { express: true };

test('R3: an express parcel costs twice what R1 gives for its weight', () => {
  for (const [w, standard] of [[g(0), 300], [g(500), 300], [g(501), 400], [g(2750), 800], [{ value: 1.2, unit: 'kg' }, 500]]) {
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
    assert.throws(() => shippingCost(w, express), (e) => e instanceof RangeError && /over the limit/.test(e.message));
  }
});

test('R3: a weight units refuses is refused for an express parcel too', () => {
  assert.throws(() => shippingCost(g(-1), express), RangeError);
});

test('R3: an express marking that is not true or false is refused with a TypeError naming it', () => {
  for (const [opts, named] of [[{ express: 'yes' }, '"yes"'], [{ express: 1 }, '1'], [null, 'null'], ['express', '"express"']]) {
    assert.throws(() => shippingCost(g(100), opts), (e) => e instanceof TypeError && e.message.includes(named));
  }
});

const far = { zone: 'far' };

test('R4: a parcel sent to the far zone costs half as much again as at home', () => {
  for (const [w, home] of [[g(0), 300], [g(500), 300], [g(501), 400], [g(2750), 800], [{ value: 1.2, unit: 'kg' }, 500]]) {
    assert.equal(shippingCost(w, { zone: 'home' }), home);
    assert.equal(shippingCost(w, far), home * 1.5);
  }
});

test('R4: an express parcel sent to the far zone costs half as much again as express at home', () => {
  for (const [w, home] of [[g(0), 600], [g(1001), 1000], [{ value: 2, unit: 'lb' }, 800]]) {
    assert.equal(shippingCost(w, { express: true, zone: 'home' }), home);
    assert.equal(shippingCost(w, { express: true, zone: 'far' }), home * 1.5);
  }
  assert.equal(shippingCost(g(1001), { express: false, zone: 'far' }), 750);
});

test('R4: a parcel with no zone costs what it costs at home', () => {
  assert.equal(shippingCost(g(1001), {}), shippingCost(g(1001), { zone: 'home' }));
  assert.equal(shippingCost(g(1001), { zone: undefined }), 500);
  assert.equal(shippingCost(g(1001), express), shippingCost(g(1001), { express: true, zone: 'home' }));
});

test('R4: bound, the heaviest far parcel costs 6300 pence, 12600 express', () => {
  assert.equal(shippingCost(g(MAX_GRAMS), far), 6300);
  assert.equal(shippingCost(g(MAX_GRAMS), { express: true, zone: 'far' }), 12600);
});

test('R4: the R2 limit holds for a far parcel', () => {
  for (const opts of [far, { express: true, zone: 'far' }]) {
    assert.throws(() => shippingCost(g(MAX_GRAMS + 1), opts), (e) => e instanceof RangeError && /over the limit/.test(e.message));
  }
});

test('R4: a zone that is not home or far is refused with a TypeError naming it', () => {
  for (const [zone, named] of [['near', '"near"'], ['Far', '"Far"'], ['', '""'], [null, 'null'], [2, '2']]) {
    assert.throws(() => shippingCost(g(100), { zone }), (e) => e instanceof TypeError && e.message.includes(named));
  }
});
