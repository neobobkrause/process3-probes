// invoice: an invoice for goods and one parcel, standard or express, home or far, with an optional discount: goods, discount, shipping, tax and total, in whole pence and as pounds text, and the tax rate charged.

import { shippingCost } from '../shipping/index.mjs';
import { taxOn, taxDetail } from '../tax/index.mjs';
import { formatPence } from '../money/index.mjs';
import { discountOn } from '../discount/index.mjs';

/** @import { Rate } from '../tax/index.mjs' */

/**
 * @typedef {Object} InvoiceText
 * @property {string} goods the goods, as pounds text from the money module
 * @property {string} discount the discount, as pounds text from the money module
 * @property {string} shipping the shipping cost, as pounds text from the money module
 * @property {string} tax the tax, as pounds text from the money module
 * @property {string} total the total, as pounds text from the money module
 */

/**
 * @typedef {Object} InvoiceRate
 * @property {Rate} name the name of the tax rate charged, from the tax module
 * @property {number} percent the tax rate charged, as a whole percent, from the tax module
 * @bound percent: whole number, 0 to 100
 */

/**
 * @typedef {Object} Invoice
 * @property {number} goods the goods, in whole pence, as given
 * @property {number} discount the pence the discount module takes off the goods at the percentage asked; 0 when none is asked
 * @property {number} shipping the shipping cost of the parcel, standard or express and home or far as asked, from the shipping module
 * @property {number} tax the standard-rate tax on goods less discount plus shipping, from the tax module
 * @property {number} total goods less discount, plus shipping, plus tax
 * @property {InvoiceText} text each of the five amounts as pounds text from the money module
 * @property {InvoiceRate} rate the tax rate charged on goods less discount plus shipping: the standard rate, its name and whole percent from the tax module
 * @bound goods, discount, shipping, tax, total: whole numbers of pence, zero or more; discount is at most goods
 */

/**
 * @typedef {Object} InvoiceOptions
 * @property {boolean} [express] given to the shipping module as it is: true for express; absent is standard
 * @property {string} [zone] given to the shipping module as it is: 'home' or 'far'; absent is home
 * @property {number} [discount] a percentage given to the discount module as it is; absent is no discount
 */

/**
 * The invoice for goods worth `goods` pence sent as one parcel, by standard
 * shipping to the home zone unless `options` asks for express or the far zone,
 * less a discount on the goods when `options` asks for one.
 *
 * The goods amount is first given to the tax module on its own, so that an amount
 * it refuses is refused with its RangeError unchanged; the parcel and the express
 * and zone options are then given to the shipping module as they are, and the
 * goods and the discount percentage to the discount module, whose errors are
 * likewise passed on unchanged.
 *
 * @param {number} goods the goods, in whole pence
 * @param {Parameters<typeof shippingCost>[0]} parcel the parcel's weight, as the shipping module accepts it
 * @param {InvoiceOptions} [options] absent is standard shipping to the home zone with no discount
 * @returns {Invoice}
 * @bound goods: whole number of pence, zero or more, as the tax module accepts
 * @bound parcel: as the shipping module accepts
 * @bound options: an object, or absent; its express and zone as the shipping module accepts, its discount as the discount module accepts (0 to 100)
 * @throws {RangeError} the tax module's, unchanged, when it refuses the goods amount; else the shipping module's, unchanged, when it refuses the parcel; else the discount module's, unchanged, when it refuses the percentage
 * @throws {TypeError} the shipping module's, unchanged, when it refuses the options, express or zone
 */
export function invoiceFor(goods, parcel, options) {
  taxOn(goods); // only to have the tax module judge the goods amount on its own
  const shipping = shippingCost(parcel, shippingOptions(options));
  const percent = options?.discount;
  const discount = percent === undefined ? 0 : discountOn(goods, percent);
  const net = goods - discount;
  const charged = taxDetail(net + shipping);
  const tax = charged.tax;
  const total = net + shipping + tax;
  /** @type {InvoiceText} builds an InvoiceText */
  const text = {
    goods: formatPence(goods),
    discount: formatPence(discount),
    shipping: formatPence(shipping),
    tax: formatPence(tax),
    total: formatPence(total),
  };
  /** @type {InvoiceRate} builds an InvoiceRate */
  const rate = { name: charged.rate, percent: charged.percent };
  /** @type {Invoice} builds an Invoice */
  const invoice = { goods, discount, shipping, tax, total, text, rate };
  return invoice;
}

/**
 * The options the shipping module is given: express and zone as the caller gave
 * them, each only when given. Anything that is not an object is given as it is,
 * so that the shipping module refuses it with its own error.
 *
 * @param {unknown} options
 * @returns {any}
 */
function shippingOptions(options) {
  if (typeof options !== 'object' || options === null) return options;
  /** @type {Record<string, unknown>} */
  const given = /** @type {any} */ (options);
  /** @type {Record<string, unknown>} */
  const out = {};
  if ('express' in given) out.express = given.express;
  if ('zone' in given) out.zone = given.zone;
  return out;
}
