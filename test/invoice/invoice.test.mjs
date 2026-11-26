import { test } from 'node:test';
import assert from 'node:assert/strict';
import { invoiceFor } from '../../src/invoice/index.mjs';
import { shippingCost } from '../../src/shipping/index.mjs';
import { taxOn, taxDetail } from '../../src/tax/index.mjs';
import { formatPence } from '../../src/money/index.mjs';
import { discountOn } from '../../src/discount/index.mjs';

/** @import { Weight } from '../../src/units/index.mjs' */
/** @import { Invoice, InvoiceOptions } from '../../src/invoice/index.mjs' */

/** @typedef {Weight} Parcel the parcel's weight, as the shipping module accepts it */

/**
 * @typedef {Object} Amounts the invoice's five amounts in whole pence
 * @property {number} goods
 * @property {number} discount
 * @property {number} shipping
 * @property {number} tax
 * @property {number} total
 */

/** @typedef {{ error: Error | null }} Caught the Error a call threw, captured */

/** @type {(value: number) => Parcel} a weight in grams */
const g = (value) => ({ value, unit: 'g' });

/** Escapes a string so it matches itself exactly as a RegExp. @type {(s: string) => string} */
const literal = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * The invoice's amounts in whole pence, without its pounds text, its tax rate or its tax label.
 * @param {Invoice} invoice
 * @returns {Amounts}
 */
const pence = (invoice) => ({
  goods: invoice.goods,
  discount: invoice.discount,
  shipping: invoice.shipping,
  tax: invoice.tax,
  total: invoice.total,
});

/**
 * An assert.throws validator that records the Error thrown into `out.error`, so the very same
 * error (its name and message) can then be looked for on the invoice. The call it validates may
 * pass a deliberately wrong-typed argument, read as "cannot tell" (design part 2, section 6).
 * The captured Error, passed back to assert.throws, is Node's own name-and-message check.
 * @type {(out: Caught) => (e: unknown) => boolean}
 */
const grab = (out) => (e) => {
  if (e instanceof Error) {
    out.error = e;
    return true;
  }
  return false;
};

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
  for (const [goods, parcel] of /** @type {Array<[number, Parcel]>} */ ([[0, g(0)], [99, g(1999)], [12345, { value: 3, unit: 'lb' }], [777, { value: 20, unit: 'kg' }]])) {
    const inv = invoiceFor(goods, parcel);
    const shipping = shippingCost(parcel);
    const tax = taxOn(goods + shipping);
    assert.deepEqual(pence(inv), { goods, discount: 0, shipping, tax, total: goods + shipping + tax });
    const a = pence(inv);
    for (const v of [a.goods, a.discount, a.shipping, a.tax, a.total]) assert.ok(Number.isSafeInteger(v) && v >= 0);
  }
});

test('invoice R1: bounds, no goods and an empty parcel; the small-parcel limit; the heaviest parcel', () => {
  assert.deepEqual(pence(invoiceFor(0, g(0))), { goods: 0, discount: 0, shipping: 150, tax: 30, total: 180 });
  assert.deepEqual(pence(invoiceFor(0, g(100))), { goods: 0, discount: 0, shipping: 150, tax: 30, total: 180 });
  assert.deepEqual(pence(invoiceFor(0, g(101))), { goods: 0, discount: 0, shipping: 300, tax: 60, total: 360 });
  assert.deepEqual(pence(invoiceFor(10000, { value: 20, unit: 'kg' })), { goods: 10000, discount: 0, shipping: 4200, tax: 2840, total: 17040 });
});

test('invoice R2: a goods amount the tax module refuses is refused with its RangeError, unchanged', () => {
  /** @type {Array<[unknown, string]>} */
  const bad = [[-1, '-1'], [-300, '-300'], [0.5, '0.5'], [12.34, '12.34'], [NaN, 'NaN'], [Infinity, 'Infinity'], ['100', '"100"'], [100n, '100n'], [null, 'null'], [undefined, 'undefined']];
  for (const [goods, label] of bad) {
    /** @type {Caught} */
    const caught = { error: null };
    assert.throws(() => taxOn(goods), grab(caught), `goods ${label}`);
    const want = caught.error;
    assert.ok(want instanceof RangeError, `goods ${label}`);
    assert.throws(() => invoiceFor(goods, g(500)), want, `goods ${label}`);
  }
});

test('invoice R2: a parcel the shipping module refuses is refused with its RangeError, unchanged', () => {
  /** @type {Array<[unknown, string]>} */
  const bad = [[g(20001), '20001 g'], [{ value: 21, unit: 'kg' }, '21 kg'], [g(-1), '-1 g'], [g(NaN), 'NaN g'], [{ value: 1, unit: 'stone' }, 'stone'], [null, 'null'], [undefined, 'undefined']];
  for (const [parcel, label] of bad) {
    /** @type {Caught} */
    const caught = { error: null };
    assert.throws(() => shippingCost(parcel), grab(caught), `parcel ${label}`);
    const want = caught.error;
    assert.ok(want instanceof RangeError, `parcel ${label}`);
    assert.throws(() => invoiceFor(1000, parcel), want, `parcel ${label}`);
  }
});

test('invoice R2: when both are refused, the refusal is one of the two modules\' RangeErrors, unchanged', () => {
  /** @type {Caught} */
  const taxCaught = { error: null };
  assert.throws(() => taxOn(-1), grab(taxCaught));
  /** @type {Caught} */
  const shipCaught = { error: null };
  assert.throws(() => shippingCost(g(20001)), grab(shipCaught));
  const taxErr = taxCaught.error;
  const shipErr = shipCaught.error;
  assert.ok(taxErr instanceof RangeError);
  assert.ok(shipErr instanceof RangeError);
  const either = new RegExp(`^(?:${literal(taxErr.message)}|${literal(shipErr.message)})$`);
  assert.throws(() => invoiceFor(-1, g(20001)), { name: 'RangeError', message: either });
});

test('invoice R3: express shipping takes the express cost from the shipping module, and tax and total follow from it', () => {
  assert.deepEqual(pence(invoiceFor(1000, g(500), { express: true })), { goods: 1000, discount: 0, shipping: 600, tax: 320, total: 1920 });
  assert.deepEqual(pence(invoiceFor(1, g(501), { express: true })), { goods: 1, discount: 0, shipping: 800, tax: 160, total: 961 }); // tax on 801 = 160.2
  assert.deepEqual(pence(invoiceFor(3, g(0), { express: true })), { goods: 3, discount: 0, shipping: 300, tax: 61, total: 364 }); // 60.6
  assert.deepEqual(pence(invoiceFor(3, g(101), { express: true })), { goods: 3, discount: 0, shipping: 600, tax: 121, total: 724 }); // 120.6
});

test('invoice R3: express amounts agree with the shipping and tax modules, all whole pence', () => {
  for (const [goods, parcel] of /** @type {Array<[number, Parcel]>} */ ([[0, g(0)], [99, g(1999)], [12345, { value: 3, unit: 'lb' }], [777, { value: 20, unit: 'kg' }]])) {
    const inv = invoiceFor(goods, parcel, { express: true });
    const shipping = shippingCost(parcel, { express: true });
    const tax = taxOn(goods + shipping);
    assert.deepEqual(pence(inv), { goods, discount: 0, shipping, tax, total: goods + shipping + tax });
    const a = pence(inv);
    for (const v of [a.goods, a.discount, a.shipping, a.tax, a.total]) assert.ok(Number.isSafeInteger(v) && v >= 0);
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
  /** @type {Array<[unknown, string]>} */
  const bad = [[null, 'null'], ['express', '"express"'], [1, '1'], [true, 'true'], [{ express: 'yes' }, '{express:"yes"}'], [{ express: 1 }, '{express:1}'], [{ express: null }, '{express:null}']];
  for (const [options, label] of bad) {
    /** @type {Caught} */
    const caught = { error: null };
    assert.throws(() => shippingCost(g(500), options), grab(caught), `options ${label}`);
    const want = caught.error;
    assert.ok(want, `options ${label}`);
    assert.throws(() => invoiceFor(1000, g(500), options), want, `options ${label}`);
  }
});

test('invoice R3 with R2: an express invoice refuses a goods amount or parcel with the module\'s RangeError, unchanged', () => {
  const express = { express: true };
  /** @type {Caught} */
  const goodsCaught = { error: null };
  assert.throws(() => taxOn(-1), grab(goodsCaught));
  const goodsErr = goodsCaught.error;
  assert.ok(goodsErr instanceof RangeError);
  assert.throws(() => invoiceFor(-1, g(500), express), goodsErr);
  /** @type {Caught} */
  const parcelCaught = { error: null };
  assert.throws(() => shippingCost(g(20001), express), grab(parcelCaught));
  const parcelErr = parcelCaught.error;
  assert.ok(parcelErr instanceof RangeError);
  assert.throws(() => invoiceFor(1000, g(20001), express), parcelErr);
});

test('invoice R4: a discount is taken off the goods before tax; tax is on goods less discount plus shipping, and the total follows', () => {
  assert.deepEqual(pence(invoiceFor(1000, g(500), { discount: 10 })), { goods: 1000, discount: 100, shipping: 300, tax: 240, total: 1440 });
  assert.deepEqual(pence(invoiceFor(1005, g(500), { discount: 10 })), { goods: 1005, discount: 101, shipping: 300, tax: 241, total: 1445 }); // 100.5 up; tax on 1204 = 240.8
  assert.deepEqual(pence(invoiceFor(1000, g(500), { express: true, discount: 25 })), { goods: 1000, discount: 250, shipping: 600, tax: 270, total: 1620 });
});

test('invoice R4: bounds, a discount of 0 gives the invoice of R1, and of 100 takes off all the goods', () => {
  assert.deepEqual(pence(invoiceFor(1000, g(500), { discount: 0 })), { goods: 1000, discount: 0, shipping: 300, tax: 260, total: 1560 });
  assert.deepEqual(pence(invoiceFor(1000, g(500), { discount: 100 })), { goods: 1000, discount: 1000, shipping: 300, tax: 60, total: 360 });
  assert.deepEqual(pence(invoiceFor(0, g(0), { discount: 50 })), { goods: 0, discount: 0, shipping: 150, tax: 30, total: 180 });
});

test('invoice R4: amounts agree with the discount, shipping and tax modules, all whole pence', () => {
  const cases = /** @type {Array<[number, Parcel, number]>} */ ([[0, g(0), 0], [99, g(1999), 33], [12345, { value: 3, unit: 'lb' }, 12.5], [777, { value: 20, unit: 'kg' }, 100], [1, g(1), 50]]);
  for (const [goods, parcel, percent] of cases) {
    for (const express of [false, true]) {
      const inv = invoiceFor(goods, parcel, { express, discount: percent });
      const discount = discountOn(goods, percent);
      const shipping = shippingCost(parcel, { express });
      const tax = taxOn(goods - discount + shipping);
      assert.deepEqual(pence(inv), { goods, discount, shipping, tax, total: goods - discount + shipping + tax });
      const a = pence(inv);
      for (const v of [a.goods, a.discount, a.shipping, a.tax, a.total]) assert.ok(Number.isSafeInteger(v) && v >= 0);
      assert.ok(inv.discount <= inv.goods);
    }
  }
});

test('invoice R4 with R2: a percentage the discount module refuses is refused with its RangeError, unchanged', () => {
  /** @type {Array<[unknown, string]>} */
  const bad = [[-1, '-1'], [100.5, '100.5'], [101, '101'], [NaN, 'NaN'], [Infinity, 'Infinity'], [-Infinity, '-Infinity'], ['10', '"10"'], [null, 'null'], [10n, '10n']];
  for (const [percent, label] of bad) {
    /** @type {Caught} */
    const caught = { error: null };
    assert.throws(() => discountOn(1000, percent), grab(caught), `percent ${label}`);
    const want = caught.error;
    assert.ok(want instanceof RangeError, `percent ${label}`);
    assert.throws(() => invoiceFor(1000, g(500), { discount: percent }), want, `percent ${label}`);
  }
});

test('invoice R4 with R2: with a discount asked, a refused goods amount or parcel is still refused with that module\'s RangeError, unchanged', () => {
  /** @type {Caught} */
  const goodsCaught = { error: null };
  assert.throws(() => taxOn(-1), grab(goodsCaught));
  const goodsErr = goodsCaught.error;
  assert.ok(goodsErr instanceof RangeError);
  assert.throws(() => invoiceFor(-1, g(500), { discount: 10 }), goodsErr);
  /** @type {Caught} */
  const parcelCaught = { error: null };
  assert.throws(() => shippingCost(g(20001)), grab(parcelCaught));
  const parcelErr = parcelCaught.error;
  assert.ok(parcelErr instanceof RangeError);
  assert.throws(() => invoiceFor(1000, g(20001), { discount: 10 }), parcelErr);
});

test('invoice R5: each amount is also shown as pounds text from the money module', () => {
  assert.deepEqual(invoiceFor(1000, g(500), { discount: 10 }).text, { goods: '£10.00', discount: '£1.00', shipping: '£3.00', tax: '£2.40', total: '£14.40' });
  assert.deepEqual(invoiceFor(5, g(0)).text, { goods: '£0.05', discount: '£0.00', shipping: '£1.50', tax: '£0.31', total: '£1.86' }); // tax on 155 = 31
  const big = invoiceFor(123456789, g(0));
  /** @type {Array<[string, number]>} */
  const pairs = [[big.text.goods, big.goods], [big.text.discount, big.discount], [big.text.shipping, big.shipping], [big.text.tax, big.tax], [big.text.total, big.total]];
  for (const [shown, amount] of pairs) assert.equal(shown, formatPence(amount));
  assert.equal(big.text.goods, '£1,234,567.89');
});

test('invoice R5: the pounds text agrees with the money module for every amount, with and without a discount, express or far', () => {
  for (const options of /** @type {Array<InvoiceOptions | undefined>} */ ([undefined, { discount: 33 }, { express: true, zone: 'far', discount: 12.5 }])) {
    for (const [goods, parcel] of /** @type {Array<[number, Parcel]>} */ ([[0, g(0)], [99, g(1999)], [100000, { value: 20, unit: 'kg' }]])) {
      const inv = invoiceFor(goods, parcel, options);
      assert.deepEqual(Object.keys(inv.text).sort(), ['discount', 'goods', 'shipping', 'tax', 'total']);
      /** @type {Array<[string, number]>} */
      const pairs = [[inv.text.goods, inv.goods], [inv.text.discount, inv.discount], [inv.text.shipping, inv.shipping], [inv.text.tax, inv.tax], [inv.text.total, inv.total]];
      for (const [shown, amount] of pairs) assert.equal(shown, formatPence(amount), `${JSON.stringify(options)} ${amount}`);
    }
  }
});

test('invoice R5: the far zone takes its cost from the shipping module, standard or express, and tax and total follow', () => {
  assert.deepEqual(pence(invoiceFor(1000, g(500), { zone: 'far' })), { goods: 1000, discount: 0, shipping: 450, tax: 290, total: 1740 });
  assert.deepEqual(pence(invoiceFor(1000, g(500), { express: true, zone: 'far' })), { goods: 1000, discount: 0, shipping: 900, tax: 380, total: 2280 });
  assert.deepEqual(pence(invoiceFor(1000, g(500), { zone: 'far', discount: 10 })), { goods: 1000, discount: 100, shipping: 450, tax: 270, total: 1620 });
  for (const [parcel, express] of /** @type {Array<[Parcel, boolean]>} */ ([[g(0), false], [g(501), true], [{ value: 20, unit: 'kg' }, false], [{ value: 20, unit: 'kg' }, true]])) {
    const shipping = shippingCost(parcel, { express, zone: 'far' });
    assert.equal(invoiceFor(10, parcel, { express, zone: 'far' }).shipping, shipping);
  }
});

test('invoice R5: the home zone, asked or not, gives the same invoice', () => {
  assert.deepEqual(invoiceFor(1000, g(500), { zone: 'home' }), invoiceFor(1000, g(500)));
  assert.deepEqual(invoiceFor(1000, g(500), { zone: 'home', express: true }), invoiceFor(1000, g(500), { express: true }));
});

test('invoice R5 with R2: a zone or parcel the shipping module refuses is refused with its error, unchanged', () => {
  /** @type {Array<[unknown, string]>} */
  const badZones = [['near', '"near"'], ['FAR', '"FAR"'], ['', '(empty)'], [null, 'null'], [1, '1'], [true, 'true']];
  for (const [zone, label] of badZones) {
    /** @type {Caught} */
    const caught = { error: null };
    assert.throws(() => shippingCost(g(500), { zone }), grab(caught), `zone ${label}`);
    const want = caught.error;
    assert.ok(want, `zone ${label}`);
    assert.throws(() => invoiceFor(1000, g(500), { zone }), want, `zone ${label}`);
  }
  /** @type {Caught} */
  const parcelCaught = { error: null };
  assert.throws(() => shippingCost(g(20001), { zone: 'far' }), grab(parcelCaught));
  const parcelErr = parcelCaught.error;
  assert.ok(parcelErr instanceof RangeError);
  assert.throws(() => invoiceFor(1000, g(20001), { zone: 'far' }), parcelErr);
});

test('invoice R6: the invoice says the tax rate it charged, the standard rate by name and whole percent', () => {
  assert.deepEqual(invoiceFor(1000, g(500)).taxRate, { rate: 'standard', percent: 20 });
  assert.deepEqual(invoiceFor(1000, g(500), { express: true, zone: 'far', discount: 25 }).taxRate, { rate: 'standard', percent: 20 });
  assert.deepEqual(Object.keys(invoiceFor(1, g(1))).sort(), ['discount', 'goods', 'shipping', 'tax', 'taxLabel', 'taxRate', 'text', 'total']);
});

test('invoice R6: the rate and the tax agree with the tax module, for every kind of invoice', () => {
  const cases = /** @type {Array<[number, Parcel, InvoiceOptions | undefined]>} */ ([[0, g(0), undefined], [1, g(501), { express: true }], [1005, g(500), { discount: 10 }],
    [1000, g(500), { discount: 100 }], [12345, { value: 20, unit: 'kg' }, { express: true, zone: 'far', discount: 12.5 }]]);
  for (const [goods, parcel, options] of cases) {
    const inv = invoiceFor(goods, parcel, options);
    const detail = taxDetail(inv.goods - inv.discount + inv.shipping);
    const { taxRate } = inv;
    assert.deepEqual(taxRate, { rate: detail.rate, percent: detail.percent }, JSON.stringify(options));
    assert.equal(inv.tax, detail.tax, JSON.stringify(options));
    assert.ok(Number.isInteger(taxRate.percent) && taxRate.percent >= 0 && taxRate.percent <= 100);
  }
});

test('invoice R6 with R2: asking for the rate changes no refusal; a refused goods amount is the tax module\'s RangeError, unchanged', () => {
  /** @type {Array<[unknown, string]>} */
  const bad = [[-1, '-1'], [0.5, '0.5'], ['100', '"100"']];
  for (const [goods, label] of bad) {
    /** @type {Caught} */
    const caught = { error: null };
    assert.throws(() => taxDetail(goods), grab(caught), `goods ${label}`);
    const want = caught.error;
    assert.ok(want instanceof RangeError, `goods ${label}`);
    assert.throws(() => invoiceFor(goods, g(500)), want, `goods ${label}`);
  }
});

test('invoice R7: the invoice shows the tax rate\'s label from the tax module, "VAT 20%" for the standard rate, alongside the rate name and percent of R6', () => {
  const inv = invoiceFor(1000, g(500));
  assert.equal(inv.taxLabel, 'VAT 20%');
  assert.deepEqual(inv.taxRate, { rate: 'standard', percent: 20 });
  assert.equal(invoiceFor(1, g(501), { express: true, zone: 'far', discount: 25 }).taxLabel, 'VAT 20%');
  assert.equal(invoiceFor(0, g(0)).taxLabel, 'VAT 20%');
});

test('invoice R7: the label is the tax module\'s own, agreeing with taxDetail and carrying the same whole percent R6 reports, for every kind of invoice', () => {
  const cases = /** @type {Array<[number, Parcel, InvoiceOptions | undefined]>} */ ([[0, g(0), undefined], [1, g(501), { express: true }], [1005, g(500), { discount: 10 }],
    [1000, g(500), { discount: 100 }], [12345, { value: 20, unit: 'kg' }, { express: true, zone: 'far', discount: 12.5 }]]);
  for (const [goods, parcel, options] of cases) {
    const inv = invoiceFor(goods, parcel, options);
    const detail = taxDetail(inv.goods - inv.discount + inv.shipping);
    const { taxLabel, taxRate } = inv;
    assert.equal(taxLabel, detail.label, JSON.stringify(options));
    assert.equal(typeof taxLabel, 'string', JSON.stringify(options));
    assert.equal(taxLabel, `VAT ${taxRate.percent}%`, JSON.stringify(options));
  }
});

test('invoice R7: showing the label is the only change; a refused goods amount still throws the tax module\'s RangeError, unchanged, with no invoice built', () => {
  /** @type {Array<[unknown, string]>} */
  const bad = [[-1, '-1'], [0.5, '0.5'], ['100', '"100"'], [NaN, 'NaN'], [Infinity, 'Infinity']];
  for (const [goods, label] of bad) {
    /** @type {Caught} */
    const caught = { error: null };
    assert.throws(() => taxDetail(goods), grab(caught), `goods ${label}`);
    const want = caught.error;
    assert.ok(want instanceof RangeError, `goods ${label}`);
    assert.throws(() => invoiceFor(goods, g(500)), want, `goods ${label}`);
  }
});
