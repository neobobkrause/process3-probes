// shipping: the cost of sending one parcel, from its weight.

/** @import { Weight } from '../units/index.mjs' */
import { toGrams } from '../units/index.mjs';

/** The heaviest parcel accepted, in grams (20 kilograms). */
export const MAX_GRAMS = 20000;

/**
 * The shipping cost of one parcel: 300 pence for the first 500 grams, plus
 * 100 pence for each further 500 grams or part of it.
 *
 * @param {Weight} weight the parcel's weight, in any unit the units module accepts
 * @returns {number} the cost in pence
 * @bound weight: once converted to whole grams by units, 0 to 20000 grams
 * @bound returns: whole number of pence, 300 to 4200
 * @throws {RangeError} when the weight is over 20 kilograms, or when units refuses the weight
 */
export function shippingCost(weight) {
  const grams = toGrams(weight);
  if (grams > MAX_GRAMS) {
    throw new RangeError(`the weight is over the limit of 20 kilograms: ${grams} grams`);
  }
  const further = Math.max(0, Math.ceil((grams - 500) / 500));
  return 300 + 100 * further;
}
