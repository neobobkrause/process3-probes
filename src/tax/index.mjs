// tax: the tax on an amount of money held in whole pence.

/**
 * The rates a caller may ask for, by name.
 * @typedef {'standard' | 'reduced' | 'zero'} Rate
 */

/** Each rate as a fraction, and as a whole percent: standard 20 percent (1/5), reduced 5 percent (1/20), zero 0 percent (0/1). */
const RATES = {
  standard: { numerator: 1n, denominator: 5n, percent: 20 },
  reduced: { numerator: 1n, denominator: 20n, percent: 5 },
  zero: { numerator: 0n, denominator: 1n, percent: 0 },
};

/**
 * The tax on an amount at the rate asked for (the standard rate of 20 percent when none is asked for,
 * the reduced rate of 5 percent, or the zero rate, which gives 0), rounded half up to a whole penny.
 * Worked in whole numbers, so no fraction of a penny is ever lost to floating point.
 *
 * @param {number} amount the amount, in whole pence
 * @param {Rate} [rate] the rate asked for; absent is 'standard'
 * @returns {number} the tax, in whole pence
 * @bound amount: whole number of pence, zero or more
 * @bound rate: 'standard' (20 percent), 'reduced' (5 percent) or 'zero' (0 percent); absent is 'standard'
 * @bound returns: whole number of pence, zero or more
 * @throws {RangeError} when the amount is negative or not a whole number of pence, or the rate is not 'standard', 'reduced' or 'zero'; the message names the bad amount or rate
 */
export function taxOn(amount, rate = 'standard') {
  if (!Number.isInteger(amount) || amount < 0) {
    throw new RangeError(`tax: the amount must be a whole number of pence, zero or more; got ${describe(amount)}`);
  }
  if (typeof rate !== 'string' || !Object.hasOwn(RATES, rate)) {
    throw new RangeError(`tax: the rate must be 'standard', 'reduced' or 'zero'; got ${describe(rate)}`);
  }
  const { numerator, denominator } = RATES[rate];
  // amount * num / den, rounded half up: floor((2 * amount * num + den) / (2 * den)).
  const twice = 2n * BigInt(amount) * numerator;
  return Number((twice + denominator) / (2n * denominator));
}

/**
 * The tax on an amount, with the rate that was used for it.
 * @typedef {Object} TaxDetail
 * @property {number} tax the tax, in whole pence, as taxOn gives it
 * @property {Rate} rate the name of the rate used
 * @property {20 | 5 | 0} percent the rate used, as a whole percent
 * @bound tax: whole number of pence, zero or more
 */

/**
 * The tax on an amount, as taxOn gives it, together with the rate that was used: its name and its
 * whole percent. It takes what taxOn takes and refuses what taxOn refuses, with the same RangeError.
 *
 * @param {number} amount the amount, in whole pence
 * @param {Rate} [rate] the rate asked for; absent is 'standard'
 * @returns {TaxDetail}
 * @bound amount: whole number of pence, zero or more
 * @bound rate: 'standard' (20 percent), 'reduced' (5 percent) or 'zero' (0 percent); absent is 'standard'
 * @throws {RangeError} when the amount is negative or not a whole number of pence, or the rate is not 'standard', 'reduced' or 'zero'; the message names the bad amount or rate
 */
export function taxDetail(amount, rate = 'standard') {
  const tax = taxOn(amount, rate);
  /** @type {TaxDetail} builds a TaxDetail */
  const detail = { tax, rate, percent: RATES[rate].percent };
  return detail;
}

function describe(value) {
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'bigint') return `${value}n`;
  try {
    return String(value);
  } catch {
    return Object.prototype.toString.call(value);
  }
}
