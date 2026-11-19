// units: converts a weight in a named unit to whole grams.

/**
 * @typedef {'g' | 'kg' | 'oz' | 'lb'} WeightUnit
 * grams, kilograms, ounces (avoirdupois) or pounds (avoirdupois)
 */

/**
 * @typedef {Object} Weight
 * @property {number} value the weight in its unit
 * @property {'g' | 'kg' | 'oz' | 'lb'} unit
 * @bound value: a finite number, zero or more
 */

/**
 * The units a weight may be given in.
 * @type {readonly WeightUnit[]}
 */
export const WEIGHT_UNITS = Object.freeze(['g', 'kg', 'oz', 'lb']);

/** @type {Readonly<Record<WeightUnit, number>>} grams in one of each unit */
const GRAMS_PER = Object.freeze({ g: 1, kg: 1000, oz: 28.349523125, lb: 453.59237 });

/** @param {unknown} v */
const show = (v) => (typeof v === 'number' ? String(v) : JSON.stringify(v) ?? String(v));

/**
 * Converts a weight to whole grams, rounded to the nearest gram (a half rounds up).
 * @param {Weight} weight
 * @returns {number}
 * @bound returns: whole number of grams, zero or more
 * @throws {RangeError} when the weight is not an object, its value is negative or not a finite number, or its unit is not one of WEIGHT_UNITS; the message names the bad value or unit
 */
export function toGrams(weight) {
  if (typeof weight !== 'object' || weight === null) throw new RangeError(`weight is not an object with a value and a unit: ${show(weight)}`);
  /** @type {Weight} checks a Weight */
  const { value, unit } = weight;
  if (typeof unit !== 'string' || !Object.hasOwn(GRAMS_PER, unit)) {
    throw new RangeError(`unknown weight unit: ${show(unit)}; use one of ${WEIGHT_UNITS.join(', ')}`);
  }
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new RangeError(`weight is not a finite number: ${show(value)}`);
  if (value < 0) throw new RangeError(`weight is negative: ${value}`);
  // Fifteen significant digits remove binary noise such as 1.0005 * 1000 = 1000.4999999999999.
  const exact = Number((value * GRAMS_PER[unit]).toPrecision(15));
  return Math.round(exact) + 0; // + 0 turns -0 into 0
}
