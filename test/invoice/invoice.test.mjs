import { test } from 'node:test';
import assert from 'node:assert/strict';
import { invoiceFor } from '../../src/invoice/index.mjs';
import { shippingCost } from '../../src/shipping/index.mjs';
import { taxOn, taxDetail } from '../../src/tax/index.mjs';
import { formatPence } from '../../src/money/index.mjs';
import { discountOn } from '../../src/discount/index.mjs';

const g = (value) => ({ value, unit: 'g' });

/** The invoice's amounts in whole pence, without its pounds text or its tax rate. */
const pence = ({ text, taxRate, ...amounts }) => amounts;

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
  assert.deepEqual(pence(invoiceFor(1000, g(500))), { goods: 1000, discount: 0, shipping: 300, tax: 260, total: 1560 });
  assert.deepEqual(pence(invoiceFor(1, g(501))), { goods: 1, discount: 0, shipping: 400, tax: 80, total: 481 }); // tax on 401 = 80.2
  assert.deepEqual(pence(invoiceFor(1234, { value: 1.2, unit: 'kg' })), { goods: 1234, discount: 0, shipping: 500, tax: 347, total: 2081 }); // 346.8
});

test('invoice R1: the tax is on goods plus shipping together, rounded half up by the tax module', () => {
  assert.deepEqual(pence(invoiceFor(3, g(500))), { goods: 3, discount: 0, shipping: 300, tax: 61, total: 364 }); // 60.6
  assert.deepEqual(pence(invoiceFor(2, g(500))), { goods: 2, discount: 0, shipping: 300, tax: 60, total: 362 }); // 60.4
});

test('invoice R1: amounts agree with the shipping and tax modules, all whole pence', () => {
  for (const [goods, parcel] of [[0, g(0)], [99, g(1999)], [12345, { value: 3, unit: 'lb' }], [777, { value: 20, unit: 'kg' }]]) {
    const inv = invoiceFor(goods, parcel);
    const shipping = shippingCost(parcel);
    const tax = taxOn(goods + shipping);
    assert.deepEqual(pence(inv), { goods, discount: 0, shipping, tax, total: goods + shipping + tax });
    for (const v of Object.values(pence(inv))) assert.ok(Number.isSafeInteger(v) && v >= 0);
  }
});

test('invoice R1: bounds, no goods and an empty parcel; the heaviest parcel', () => {
  assert.deepEqual(pence(invoiceFor(0, g(0))), { goods: 0, discount: 0, shipping: 300, tax: 60, total: 360 });
  assert.deepEqual(pence(invoiceFor(10000, { value: 20, unit: 'kg' })), { goods: 10000, discount: 0, shipping: 4200, tax: 2840, total: 17040 });
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
  assert.deepEqual(pence(invoiceFor(1000, g(500), { express: true })), { goods: 1000, discount: 0, shipping: 600, tax: 320, total: 1920 });
  assert.deepEqual(pence(invoiceFor(1, g(501), { express: true })), { goods: 1, discount: 0, shipping: 800, tax: 160, total: 961 }); // tax on 801 = 160.2
  assert.deepEqual(pence(invoiceFor(3, g(0), { express: true })), { goods: 3, discount: 0, shipping: 600, tax: 121, total: 724 }); // 120.6
});

test('invoice R3: express amounts agree with the shipping and tax modules, all whole pence', () => {
  for (const [goods, parcel] of [[0, g(0)], [99, g(1999)], [12345, { value: 3, unit: 'lb' }], [777, { value: 20, unit: 'kg' }]]) {
    const inv = invoiceFor(goods, parcel, { express: true });
    const shipping = shippingCost(parcel, { express: true });
    const tax = taxOn(goods + shipping);
    assert.deepEqual(pence(inv), { goods, discount: 0, shipping, tax, total: goods + shipping + tax });
    for (const v of Object.values(pence(inv))) assert.ok(Number.isSafeInteger(v) && v >= 0);
  }
});

test('invoice R3: bounds, the heaviest express parcel', () => {
  assert.deepEqual(pence(invoiceFor(10000, { value: 20, unit: 'kg' }, { express: true })), { goods: 10000, discount: 0, shipping: 8400, tax: 3680, total: 22080 });
});

test('invoice R3: not asking for express, or asking for it as false, gives the standard invoice of R1', () => {
  const standard = { goods: 1000, discount: 0, shipping: 300, tax: 260, total: 1560 };
  assert.deepEqual(pence(invoiceFor(1000, g(500), undefined)), standard);
  assert.deepEqual(pence(invoiceFor(1000, g(500), {})), standard);
  assert.deepEqual(pence(invoiceFor(1000, g(500), { express: false })), standard);
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

test('invoice R4: a discount is taken off the goods before tax; tax is on goods less discount plus shipping, and the total follows', () => {
  assert.deepEqual(pence(invoiceFor(1000, g(500), { discount: 10 })), { goods: 1000, discount: 100, shipping: 300, tax: 240, total: 1440 });
  assert.deepEqual(pence(invoiceFor(1005, g(500), { discount: 10 })), { goods: 1005, discount: 101, shipping: 300, tax: 241, total: 1445 }); // 100.5 up; tax on 1204 = 240.8
  assert.deepEqual(pence(invoiceFor(1000, g(500), { express: true, discount: 25 })), { goods: 1000, discount: 250, shipping: 600, tax: 270, total: 1620 });
});

test('invoice R4: bounds, a discount of 0 gives the invoice of R1, and of 100 takes off all the goods', () => {
  assert.deepEqual(pence(invoiceFor(1000, g(500), { discount: 0 })), { goods: 1000, discount: 0, shipping: 300, tax: 260, total: 1560 });
  assert.deepEqual(pence(invoiceFor(1000, g(500), { discount: 100 })), { goods: 1000, discount: 1000, shipping: 300, tax: 60, total: 360 });
  assert.deepEqual(pence(invoiceFor(0, g(0), { discount: 50 })), { goods: 0, discount: 0, shipping: 300, tax: 60, total: 360 });
});

test('invoice R4: amounts agree with the discount, shipping and tax modules, all whole pence', () => {
  const cases = [[0, g(0), 0], [99, g(1999), 33], [12345, { value: 3, unit: 'lb' }, 12.5], [777, { value: 20, unit: 'kg' }, 100], [1, g(1), 50]];
  for (const [goods, parcel, percent] of cases) {
    for (const express of [false, true]) {
      const inv = invoiceFor(goods, parcel, { express, discount: percent });
      const discount = discountOn(goods, percent);
      const shipping = shippingCost(parcel, { express });
      const tax = taxOn(goods - discount + shipping);
      assert.deepEqual(pence(inv), { goods, discount, shipping, tax, total: goods - discount + shipping + tax });
      for (const v of Object.values(pence(inv))) assert.ok(Number.isSafeInteger(v) && v >= 0);
      assert.ok(inv.discount <= inv.goods);
    }
  }
});

test('invoice R4 with R2: a percentage the discount module refuses is refused with its RangeError, unchanged', () => {
  for (const percent of [-1, 100.5, 101, NaN, Infinity, -Infinity, '10', null, 10n]) {
    const got = errorOf(() => invoiceFor(1000, g(500), { discount: percent }));
    const expected = errorOf(() => discountOn(1000, percent));
    assert.ok(got instanceof RangeError, `percent ${String(percent)}`);
    assert.equal(got.message, expected.message, `percent ${String(percent)}`);
  }
});

test('invoice R4 with R2: with a discount asked, a refused goods amount or parcel is still refused with that module\'s RangeError, unchanged', () => {
  const byGoods = errorOf(() => invoiceFor(-1, g(500), { discount: 10 }));
  assert.ok(byGoods instanceof RangeError);
  assert.equal(byGoods.message, errorOf(() => taxOn(-1)).message);
  const byParcel = errorOf(() => invoiceFor(1000, g(20001), { discount: 10 }));
  assert.ok(byParcel instanceof RangeError);
  assert.equal(byParcel.message, errorOf(() => shippingCost(g(20001))).message);
});

test('invoice R5: each amount is also shown as pounds text from the money module', () => {
  assert.deepEqual(invoiceFor(1000, g(500), { discount: 10 }).text, { goods: '£10.00', discount: '£1.00', shipping: '£3.00', tax: '£2.40', total: '£14.40' });
  assert.deepEqual(invoiceFor(5, g(0)).text, { goods: '£0.05', discount: '£0.00', shipping: '£3.00', tax: '£0.61', total: '£3.66' }); // tax on 305 = 61
  const big = invoiceFor(123456789, g(0));
  for (const k of ['goods', 'discount', 'shipping', 'tax', 'total']) assert.equal(big.text[k], formatPence(big[k]), k);
  assert.equal(big.text.goods, '£1,234,567.89');
});

test('invoice R5: the pounds text agrees with the money module for every amount, with and without a discount, express or far', () => {
  for (const options of [undefined, { discount: 33 }, { express: true, zone: 'far', discount: 12.5 }]) {
    for (const [goods, parcel] of [[0, g(0)], [99, g(1999)], [100000, { value: 20, unit: 'kg' }]]) {
      const inv = invoiceFor(goods, parcel, options);
      assert.deepEqual(Object.keys(inv.text).sort(), ['discount', 'goods', 'shipping', 'tax', 'total']);
      for (const k of Object.keys(inv.text)) assert.equal(inv.text[k], formatPence(inv[k]), `${k} ${JSON.stringify(options)}`);
    }
  }
});

test('invoice R5: the far zone takes its cost from the shipping module, standard or express, and tax and total follow', () => {
  assert.deepEqual(pence(invoiceFor(1000, g(500), { zone: 'far' })), { goods: 1000, discount: 0, shipping: 450, tax: 290, total: 1740 });
  assert.deepEqual(pence(invoiceFor(1000, g(500), { express: true, zone: 'far' })), { goods: 1000, discount: 0, shipping: 900, tax: 380, total: 2280 });
  assert.deepEqual(pence(invoiceFor(1000, g(500), { zone: 'far', discount: 10 })), { goods: 1000, discount: 100, shipping: 450, tax: 270, total: 1620 });
  for (const [parcel, express] of [[g(0), false], [g(501), true], [{ value: 20, unit: 'kg' }, false], [{ value: 20, unit: 'kg' }, true]]) {
    const shipping = shippingCost(parcel, { express, zone: 'far' });
    assert.equal(invoiceFor(10, parcel, { express, zone: 'far' }).shipping, shipping);
  }
});

test('invoice R5: the home zone, asked or not, gives the same invoice', () => {
  assert.deepEqual(invoiceFor(1000, g(500), { zone: 'home' }), invoiceFor(1000, g(500)));
  assert.deepEqual(invoiceFor(1000, g(500), { zone: 'home', express: true }), invoiceFor(1000, g(500), { express: true }));
});

test('invoice R5 with R2: a zone or parcel the shipping module refuses is refused with its error, unchanged', () => {
  for (const zone of ['near', 'FAR', '', null, 1, true]) {
    const got = errorOf(() => invoiceFor(1000, g(500), { zone }));
    const expected = errorOf(() => shippingCost(g(500), { zone }));
    assert.equal(got.constructor, expected.constructor, `zone ${JSON.stringify(zone)}`);
    assert.equal(got.message, expected.message, `zone ${JSON.stringify(zone)}`);
  }
  const byParcel = errorOf(() => invoiceFor(1000, g(20001), { zone: 'far' }));
  assert.ok(byParcel instanceof RangeError);
  assert.equal(byParcel.message, errorOf(() => shippingCost(g(20001), { zone: 'far' })).message);
});

test('invoice R6: the invoice says the tax rate it charged, the standard rate by name and whole percent', () => {
  assert.deepEqual(invoiceFor(1000, g(500)).taxRate, { rate: 'standard', percent: 20 });
  assert.deepEqual(invoiceFor(1000, g(500), { express: true, zone: 'far', discount: 25 }).taxRate, { rate: 'standard', percent: 20 });
  assert.deepEqual(Object.keys(invoiceFor(1, g(1))).sort(), ['discount', 'goods', 'shipping', 'tax', 'taxRate', 'text', 'total']);
});

test('invoice R6: the rate and the tax agree with the tax module, for every kind of invoice', () => {
  const cases = [[0, g(0), undefined], [1, g(501), { express: true }], [1005, g(500), { discount: 10 }],
    [1000, g(500), { discount: 100 }], [12345, { value: 20, unit: 'kg' }, { express: true, zone: 'far', discount: 12.5 }]];
  for (const [goods, parcel, options] of cases) {
    const inv = invoiceFor(goods, parcel, options);
    const detail = taxDetail(inv.goods - inv.discount + inv.shipping);
    assert.deepEqual(inv.taxRate, { rate: detail.rate, percent: detail.percent }, JSON.stringify(options));
    assert.equal(inv.tax, detail.tax, JSON.stringify(options));
    assert.ok(Number.isInteger(inv.taxRate.percent) && inv.taxRate.percent >= 0 && inv.taxRate.percent <= 100);
  }
});

test('invoice R6 with R2: asking for the rate changes no refusal; a refused goods amount is the tax module\'s RangeError, unchanged', () => {
  for (const goods of [-1, 0.5, '100']) {
    const got = errorOf(() => invoiceFor(goods, g(500)));
    assert.ok(got instanceof RangeError);
    assert.equal(got.message, errorOf(() => taxDetail(goods)).message);
  }
});
