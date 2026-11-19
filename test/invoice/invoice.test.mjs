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

test('invoice R1: bound, the largest exact total is given; one penny more is refused with a RangeError', () => {
  const most = 7505999378950526; // with a 0 g parcel the total is exactly Number.MAX_SAFE_INTEGER
  assert.deepEqual(invoiceFor(most, g(0)), {
    goods: most, shipping: 300, tax: 1501199875790165, total: Number.MAX_SAFE_INTEGER,
  });
  assert.throws(() => invoiceFor(most + 1, g(0)), (e) => e instanceof RangeError && /cannot be exact/.test(e.message));
  assert.throws(() => invoiceFor(Number.MAX_SAFE_INTEGER, g(0)), RangeError);
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
