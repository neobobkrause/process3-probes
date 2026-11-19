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
