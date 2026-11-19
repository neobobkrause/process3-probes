// units: converts a weight in a named unit to whole grams.

/**
 * @typedef {'g' | 'kg' | 'oz' | 'lb'} WeightUnit
 * grams, kilograms, ounces (avoirdupois) or pounds (avoirdupois)
 */

/**
 * The units a weight may be given in.
 * @type {readonly WeightUnit[]}
 */
export const WEIGHT_UNITS = Object.freeze(['g', 'kg', 'oz', 'lb']);

/** @type {Readonly<Record<WeightUnit, number>>} grams in one of each unit */
const GRAMS_PER = Object.freeze({ g: 1, kg: 1000, oz: 28.349523125, lb: 453.59237 });

/**
 * Converts a weight to whole grams, rounded to the nearest gram (a half rounds up).
 * @param {number} amount the weight in the given unit
 * @param {WeightUnit} unit
 * @returns {number}
 * @bound amount: a finite number, zero or more
 * @bound returns: whole number of grams, zero or more
 * @throws {RangeError} when the amount is negative or not a finite number, or the unit is not one of WEIGHT_UNITS; the message names the bad value or unit
 */
export function toGrams(amount, unit) {
  if (typeof unit !== 'string' || !Object.hasOwn(GRAMS_PER, unit)) {
    throw new RangeError(`unknown weight unit: ${JSON.stringify(unit) ?? String(unit)}; use one of ${WEIGHT_UNITS.join(', ')}`);
  }
  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    throw new RangeError(`weight is not a finite number: ${typeof amount === 'number' ? amount : JSON.stringify(amount) ?? String(amount)}`);
  }
  if (amount < 0) throw new RangeError(`weight is negative: ${amount}`);
  // Fifteen significant digits remove binary noise such as 1.0005 * 1000 = 1000.4999999999999.
  const exact = Number((amount * GRAMS_PER[/** @type {WeightUnit} */ (unit)]).toPrecision(15));
  return Math.round(exact) + 0; // + 0 turns -0 into 0
}
