// shipping: the cost of sending one parcel, from its weight, whether it is express, and its zone.

/** @import { Weight } from '../units/index.mjs' */
import { toGrams } from '../units/index.mjs';

/** The heaviest parcel accepted, in grams (20 kilograms). */
export const MAX_GRAMS = 20000;

/**
 * @typedef {Object} ShippingOptions
 * @property {boolean} [express] true for an express parcel; absent or false is a standard parcel
 * @property {'home' | 'far'} [zone] where the parcel is sent; absent is 'home'
 */

/** @param {unknown} v */
const show = (v) => (typeof v === 'string' ? JSON.stringify(v) : String(v));

/**
 * The shipping cost of one parcel: 300 pence for the first 500 grams, plus
 * 100 pence for each further 500 grams or part of it. An express parcel costs
 * twice that. A parcel sent to the far zone costs half as much again as the
 * same parcel at home, express or not. The 20 kilogram limit is the same for all.
 *
 * @param {Weight} weight the parcel's weight, in any unit the units module accepts
 * @param {ShippingOptions} [options] absent is a standard parcel sent at home
 * @returns {number} the cost in pence
 * @bound weight: once converted to whole grams by units, 0 to 20000 grams
 * @bound returns: whole number of pence, 300 to 4200 for a standard parcel, 600 to 8400 for an express one, at home; half as much again for the far zone, 450 to 6300 standard and 900 to 12600 express
 * @throws {RangeError} when the weight is over 20 kilograms, or when units refuses the weight
 * @throws {TypeError} when options is given and is not an object, its express is given and is not true or false, or its zone is given and is not 'home' or 'far'; the message names the bad value
 */
export function shippingCost(weight, options) {
  /** @type {ShippingOptions | undefined} checks a ShippingOptions */
  const opts = options;
  if (opts !== undefined && (typeof opts !== 'object' || opts === null)) {
    throw new TypeError(`shipping: options must be an object such as { express: true }; got ${show(opts)}`);
  }
  const express = opts?.express;
  if (express !== undefined && typeof express !== 'boolean') {
    throw new TypeError(`shipping: express must be true or false; got ${show(express)}`);
  }
  const zone = opts?.zone;
  if (zone !== undefined && zone !== 'home' && zone !== 'far') {
    throw new TypeError(`shipping: zone must be "home" or "far"; got ${show(zone)}`);
  }
  const grams = toGrams(weight);
  if (grams > MAX_GRAMS) {
    throw new RangeError(`the weight is over the limit of 20 kilograms: ${grams} grams`);
  }
  const further = Math.max(0, Math.ceil((grams - 500) / 500));
  const standard = 300 + 100 * further;
  const atHome = express ? 2 * standard : standard;
  return zone === 'far' ? (3 * atHome) / 2 : atHome;
}
