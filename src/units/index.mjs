// units: converts a weight in a named unit, or written as text, to whole grams.

/**
 * @typedef {'g' | 'kg' | 'oz' | 'lb' | 'st'} WeightUnit
 * grams, kilograms, ounces (avoirdupois), pounds (avoirdupois) or stones (14 pounds)
 */

/**
 * @typedef {Object} Weight
 * @property {number} value the weight in its unit
 * @property {'g' | 'kg' | 'oz' | 'lb' | 'st'} unit
 * @bound value: a finite number, zero or more
 */

/**
 * The units a weight may be given in.
 * @type {readonly WeightUnit[]}
 */
export const WEIGHT_UNITS = Object.freeze(['g', 'kg', 'oz', 'lb', 'st']);

/** @type {Readonly<Record<WeightUnit, number>>} grams in one of each unit */
const GRAMS_PER = Object.freeze({ g: 1, kg: 1000, oz: 28.349523125, lb: 453.59237, st: 6350.29318 });

/** Text of a weight: a number, optional spaces, then one of WEIGHT_UNITS. */
const WEIGHT_TEXT = /^([+-]?(?:\d+(?:\.\d*)?|\.\d+)) *(g|kg|oz|lb|st)$/;

/** @param {unknown} v */
const show = (v) => (typeof v === 'number' ? String(v) : JSON.stringify(v) ?? String(v));

/**
 * Converts a weight to whole grams, rounded to the nearest gram (a half rounds up).
 * A weight may be given as text such as "2.5 kg" or "12oz".
 * @param {Weight | string} weight
 * @returns {number}
 * @bound weight: as text, a number (digits with an optional decimal point and sign), optional spaces, then one of WEIGHT_UNITS, nothing else
 * @bound returns: whole number of grams, zero or more
 * @throws {RangeError} when the weight is text of any other form (the message quotes it), is neither text nor an object, its value is negative or not a finite number, or its unit is not one of WEIGHT_UNITS; the message names the bad value or unit
 */
export function toGrams(weight) {
  if (typeof weight === 'string') {
    const m = WEIGHT_TEXT.exec(weight);
    if (m === null) throw new RangeError(`weight text is not a number and a unit: ${JSON.stringify(weight)}`);
    return toGrams({ value: Number(m[1]), unit: /** @type {WeightUnit} */ (m[2]) });
  }
  if (typeof weight !== 'object' || weight === null) throw new RangeError(`weight is not text or an object with a value and a unit: ${show(weight)}`);
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
