// units: converts a weight in a named unit, or written as text with a unit's symbol or full name, to whole grams.

/**
 * @typedef {'mg' | 'g' | 'kg' | 'oz' | 'lb' | 'st' | 't' | 'ct'} WeightUnit
 * milligrams, grams, kilograms, ounces (avoirdupois), pounds (avoirdupois), stones (14 pounds), tonnes (1,000 kilograms) or carats (0.2 grams)
 */

/**
 * @typedef {Object} Weight
 * @property {number} value the weight in its unit
 * @property {'mg' | 'g' | 'kg' | 'oz' | 'lb' | 'st' | 't' | 'ct'} unit
 * @bound value: a finite number, zero or more
 */

/**
 * The units a weight may be given in.
 * @type {readonly WeightUnit[]}
 */
export const WEIGHT_UNITS = Object.freeze(['mg', 'g', 'kg', 'oz', 'lb', 'st', 't', 'ct']);

/** @type {Readonly<Record<WeightUnit, number>>} grams in one of each unit */
const GRAMS_PER = Object.freeze({ mg: 0.001, g: 1, kg: 1000, oz: 28.349523125, lb: 453.59237, st: 6350.29318, t: 1000000, ct: 0.2 });

/** @type {Readonly<Record<string, WeightUnit>>} each unit's full name, singular and plural, in lower case */
const UNIT_NAMES = Object.freeze({
  milligram: 'mg', milligrams: 'mg', gram: 'g', grams: 'g', kilogram: 'kg', kilograms: 'kg', ounce: 'oz', ounces: 'oz',
  pound: 'lb', pounds: 'lb', stone: 'st', stones: 'st', tonne: 't', tonnes: 't', carat: 'ct', carats: 'ct',
});

/** Text of a weight: a number, optional spaces, then a word of letters (a unit's symbol or full name). */
const WEIGHT_TEXT = /^([+-]?(?:\d+(?:\.\d*)?|\.\d+)) *([A-Za-z]+)$/;

/**
 * The unit a word of weight text names: one of WEIGHT_UNITS exactly as written, or a full name in any letter case.
 * @param {string} word
 * @returns {WeightUnit | undefined}
 */
const unitOfWord = (word) => {
  if (Object.hasOwn(GRAMS_PER, word)) return /** @type {WeightUnit} */ (word);
  const lower = word.toLowerCase();
  return Object.hasOwn(UNIT_NAMES, lower) ? UNIT_NAMES[lower] : undefined;
};

/** @param {unknown} v */
const show = (v) => (typeof v === 'number' ? String(v) : JSON.stringify(v) ?? String(v));

/**
 * Converts a weight to whole grams, rounded to the nearest gram (a half rounds up).
 * A weight may be given as text such as "2.5 kg", "12oz", "0.01 t", "2500 mg", "50 ct" or "2 Kilograms".
 * @param {Weight | string} weight
 * @returns {number}
 * @bound weight: as text, a number (digits with an optional decimal point and sign), optional spaces, then one of WEIGHT_UNITS exactly as written or a unit's full name singular or plural in any letter case (milligram, gram, kilogram, ounce, pound, stone, tonne, carat), nothing else
 * @bound returns: whole number of grams, zero or more
 * @throws {RangeError} when the weight is text of any other form (the message quotes it), is neither text nor an object, its value is negative or not a finite number, or its unit is not one of WEIGHT_UNITS; the message names the bad value or unit
 */
export function toGrams(weight) {
  if (typeof weight === 'string') {
    const m = WEIGHT_TEXT.exec(weight);
    const unit = m === null ? undefined : unitOfWord(m[2]);
    if (m === null || unit === undefined) throw new RangeError(`weight text is not a number and a unit: ${JSON.stringify(weight)}`);
    return toGrams({ value: Number(m[1]), unit });
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
