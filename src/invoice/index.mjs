// invoice: an invoice for goods and one parcel, standard or express: goods, shipping, tax and total, in whole pence.

import { shippingCost } from '../shipping/index.mjs';
import { taxOn } from '../tax/index.mjs';

/**
 * @typedef {Object} Invoice
 * @property {number} goods the goods, in whole pence, as given
 * @property {number} shipping the shipping cost of the parcel, standard or express as asked, from the shipping module
 * @property {number} tax the standard-rate tax on goods plus shipping, from the tax module
 * @property {number} total goods plus shipping plus tax
 * @bound goods, shipping, tax, total: whole numbers of pence, zero or more
 */

/**
 * The invoice for goods worth `goods` pence sent as one parcel, by standard
 * shipping unless `options` asks for express.
 *
 * The goods amount is first given to the tax module on its own, so that an amount
 * it refuses is refused with its RangeError unchanged; the parcel and the options
 * are then given to the shipping module as they are, whose errors are likewise
 * passed on unchanged.
 *
 * @param {number} goods the goods, in whole pence
 * @param {Parameters<typeof shippingCost>[0]} parcel the parcel's weight, as the shipping module accepts it
 * @param {Parameters<typeof shippingCost>[1]} [options] the shipping options, as the shipping module accepts them: `{ express: true }` for express; absent is standard
 * @returns {Invoice}
 * @bound goods: whole number of pence, zero or more, as the tax module accepts
 * @bound parcel: as the shipping module accepts
 * @bound options: as the shipping module accepts; absent is standard shipping
 * @throws {RangeError} the tax module's, unchanged, when it refuses the goods amount; else the shipping module's, unchanged, when it refuses the parcel
 * @throws {TypeError} the shipping module's, unchanged, when it refuses the options
 */
export function invoiceFor(goods, parcel, options) {
  taxOn(goods); // only to have the tax module judge the goods amount on its own
  const shipping = shippingCost(parcel, options);
  const tax = taxOn(goods + shipping);
  const total = goods + shipping + tax;
  /** @type {Invoice} builds an Invoice */
  const invoice = { goods, shipping, tax, total };
  return invoice;
}
