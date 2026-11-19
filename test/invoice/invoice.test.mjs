import { test } from 'node:test';
import assert from 'node:assert/strict';
import { invoiceFor } from '../../src/invoice/index.mjs';
import { shippingCost } from '../../src/shipping/index.mjs';
import { taxOn } from '../../src/tax/index.mjs';

const g = (value) => ({ value, unit: 'g' });

/** The error a call throws, or a failure if it throws none. */
function errorOf(fn) {
  try {
    fn();
  } catch (e) {
    return e;
  }
  assert.fail('no error was thrown');
}

test('invoice R1: goods, shipping, standard-rate tax on goods plus shipping, and their total', () => {
  assert.deepEqual(invoiceFor(1000, g(500)), { goods: 1000, shipping: 300, tax: 260, total: 1560 });
  assert.deepEqual(invoiceFor(1, g(501)), { goods: 1, shipping: 400, tax: 80, total: 481 }); // tax on 401 = 80.2
  assert.deepEqual(invoiceFor(1234, { value: 1.2, unit: 'kg' }), { goods: 1234, shipping: 500, tax: 347, total: 2081 }); // 346.8
});

test('invoice R1: the tax is on goods plus shipping together, rounded half up by the tax module', () => {
  assert.deepEqual(invoiceFor(3, g(500)), { goods: 3, shipping: 300, tax: 61, total: 364 }); // 60.6
  assert.deepEqual(invoiceFor(2, g(500)), { goods: 2, shipping: 300, tax: 60, total: 362 }); // 60.4
});

test('invoice R1: amounts agree with the shipping and tax modules, all whole pence', () => {
  for (const [goods, parcel] of [[0, g(0)], [99, g(1999)], [12345, { value: 3, unit: 'lb' }], [777, { value: 20, unit: 'kg' }]]) {
    const inv = invoiceFor(goods, parcel);
    const shipping = shippingCost(parcel);
    const tax = taxOn(goods + shipping);
    assert.deepEqual(inv, { goods, shipping, tax, total: goods + shipping + tax });
    for (const v of Object.values(inv)) assert.ok(Number.isSafeInteger(v) && v >= 0);
  }
});

test('invoice R1: bounds, no goods and an empty parcel; the heaviest parcel', () => {
  assert.deepEqual(invoiceFor(0, g(0)), { goods: 0, shipping: 300, tax: 60, total: 360 });
  assert.deepEqual(invoiceFor(10000, { value: 20, unit: 'kg' }), { goods: 10000, shipping: 4200, tax: 2840, total: 17040 });
});

test('invoice R2: a goods amount the tax module refuses is refused with its RangeError, unchanged', () => {
  for (const goods of [-1, -300, 0.5, 12.34, NaN, Infinity, '100', 100n, null, undefined]) {
    const got = errorOf(() => invoiceFor(goods, g(500)));
    const expected = errorOf(() => taxOn(goods));
    assert.ok(got instanceof RangeError, `goods ${String(goods)}`);
    assert.equal(got.message, expected.message, `goods ${String(goods)}`);
  }
});

test('invoice R2: a parcel the shipping module refuses is refused with its RangeError, unchanged', () => {
  for (const parcel of [g(20001), { value: 21, unit: 'kg' }, g(-1), g(NaN), { value: 1, unit: 'stone' }, null, undefined]) {
    const got = errorOf(() => invoiceFor(1000, parcel));
    const expected = errorOf(() => shippingCost(parcel));
    assert.ok(got instanceof RangeError, `parcel ${JSON.stringify(parcel)}`);
    assert.equal(got.message, expected.message, `parcel ${JSON.stringify(parcel)}`);
  }
});

test('invoice R2: when both are refused, the refusal is one of the two modules\' RangeErrors, unchanged', () => {
  const got = errorOf(() => invoiceFor(-1, g(20001)));
  const either = [errorOf(() => taxOn(-1)).message, errorOf(() => shippingCost(g(20001))).message];
  assert.ok(got instanceof RangeError);
  assert.ok(either.includes(got.message));
});

test('invoice R3: express shipping takes the express cost from the shipping module, and tax and total follow from it', () => {
  assert.deepEqual(invoiceFor(1000, g(500), { express: true }), { goods: 1000, shipping: 600, tax: 320, total: 1920 });
  assert.deepEqual(invoiceFor(1, g(501), { express: true }), { goods: 1, shipping: 800, tax: 160, total: 961 }); // tax on 801 = 160.2
  assert.deepEqual(invoiceFor(3, g(0), { express: true }), { goods: 3, shipping: 600, tax: 121, total: 724 }); // 120.6
});

test('invoice R3: express amounts agree with the shipping and tax modules, all whole pence', () => {
  for (const [goods, parcel] of [[0, g(0)], [99, g(1999)], [12345, { value: 3, unit: 'lb' }], [777, { value: 20, unit: 'kg' }]]) {
    const inv = invoiceFor(goods, parcel, { express: true });
    const shipping = shippingCost(parcel, { express: true });
    const tax = taxOn(goods + shipping);
    assert.deepEqual(inv, { goods, shipping, tax, total: goods + shipping + tax });
    for (const v of Object.values(inv)) assert.ok(Number.isSafeInteger(v) && v >= 0);
  }
});

test('invoice R3: bounds, the heaviest express parcel', () => {
  assert.deepEqual(invoiceFor(10000, { value: 20, unit: 'kg' }, { express: true }), { goods: 10000, shipping: 8400, tax: 3680, total: 22080 });
});

test('invoice R3: not asking for express, or asking for it as false, gives the standard invoice of R1', () => {
  const standard = { goods: 1000, shipping: 300, tax: 260, total: 1560 };
  assert.deepEqual(invoiceFor(1000, g(500), undefined), standard);
  assert.deepEqual(invoiceFor(1000, g(500), {}), standard);
  assert.deepEqual(invoiceFor(1000, g(500), { express: false }), standard);
});

test('invoice R3: shipping options the shipping module refuses are refused with its error, unchanged', () => {
  for (const options of [null, 'express', 1, true, { express: 'yes' }, { express: 1 }, { express: null }]) {
    const got = errorOf(() => invoiceFor(1000, g(500), options));
    const expected = errorOf(() => shippingCost(g(500), options));
    assert.equal(got.constructor, expected.constructor, `options ${JSON.stringify(options)}`);
    assert.equal(got.message, expected.message, `options ${JSON.stringify(options)}`);
  }
});

test('invoice R3 with R2: an express invoice refuses a goods amount or parcel with the module\'s RangeError, unchanged', () => {
  const express = { express: true };
  const byGoods = errorOf(() => invoiceFor(-1, g(500), express));
  assert.ok(byGoods instanceof RangeError);
  assert.equal(byGoods.message, errorOf(() => taxOn(-1)).message);
  const byParcel = errorOf(() => invoiceFor(1000, g(20001), express));
  assert.ok(byParcel instanceof RangeError);
  assert.equal(byParcel.message, errorOf(() => shippingCost(g(20001), express)).message);
});
