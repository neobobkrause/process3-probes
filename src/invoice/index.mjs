// invoice: an invoice for goods and one parcel: goods, shipping, tax and total, in whole pence.

import { shippingCost } from '../shipping/index.mjs';
import { taxOn } from '../tax/index.mjs';

/**
 * @typedef {Object} Invoice
 * @property {number} goods the goods, in whole pence, as given
 * @property {number} shipping the shipping cost of the parcel, from the shipping module
 * @property {number} tax the standard-rate tax on goods plus shipping, from the tax module
 * @property {number} total goods plus shipping plus tax
 * @bound goods, shipping, tax, total: whole numbers of pence, zero or more; total at most Number.MAX_SAFE_INTEGER
 */

/**
 * The invoice for goods worth `goods` pence sent as one parcel.
 *
 * The goods amount is first given to the tax module on its own, so that an amount
 * it refuses is refused with its RangeError unchanged; the parcel is then given to
 * the shipping module, whose RangeError is likewise passed on unchanged.
 *
 * @param {number} goods the goods, in whole pence
 * @param {Parameters<typeof shippingCost>[0]} parcel the parcel's weight, as the shipping module accepts it
 * @returns {Invoice}
 * @bound goods: whole number of pence, zero or more, as the tax module accepts
 * @bound parcel: as the shipping module accepts
 * @bound returns: total at most Number.MAX_SAFE_INTEGER, so every amount is exact
 * @throws {RangeError} the tax module's, unchanged, when it refuses the goods amount; else the shipping module's, unchanged, when it refuses the parcel; else invoice's own when the total would be over Number.MAX_SAFE_INTEGER pence
 */
export function invoiceFor(goods, parcel) {
  taxOn(goods); // only to have the tax module judge the goods amount on its own
  const shipping = shippingCost(parcel);
  const tax = taxOn(goods + shipping);
  const total = goods + shipping + tax;
  if (!Number.isSafeInteger(goods + shipping) || !Number.isSafeInteger(total)) {
    throw new RangeError(`invoice: the total is over ${Number.MAX_SAFE_INTEGER} pence and cannot be exact; goods ${goods}`);
  }
  /** @type {Invoice} builds an Invoice */
  const invoice = { goods, shipping, tax, total };
  return invoice;
}
