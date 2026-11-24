// tax: the tax on an amount of money held in whole pence.

/**
 * The rates by name, as the tax module names them back. A caller may ask for one in any letter case.
 * @typedef {'standard' | 'reduced' | 'zero'} Rate
 */

/**
 * Each rate as a fraction, as a whole percent, and as its label for an invoice: standard 20 percent (1/5), reduced 5 percent (1/20), zero 0 percent (0/1).
 * @type {Record<Rate, { numerator: bigint, denominator: bigint, percent: TaxDetail['percent'], label: TaxDetail['label'] }>}
 */
const RATES = {
  standard: { numerator: 1n, denominator: 5n, percent: 20, label: 'VAT 20%' },
  reduced: { numerator: 1n, denominator: 20n, percent: 5, label: 'VAT 5%' },
  zero: { numerator: 0n, denominator: 1n, percent: 0, label: 'VAT 0%' },
};

/**
 * The tax on an amount at the rate asked for (the standard rate of 20 percent when none is asked for,
 * the reduced rate of 5 percent, or the zero rate, which gives 0), rounded half up to a whole penny.
 * Worked in whole numbers, so no fraction of a penny is ever lost to floating point.
 *
 * @param {number} amount the amount, in whole pence
 * @param {string} [rate] the rate asked for, a Rate's name in any letter case; absent is 'standard'
 * @returns {number} the tax, in whole pence
 * @bound amount: whole number of pence, zero or more
 * @bound rate: 'standard' (20 percent), 'reduced' (5 percent) or 'zero' (0 percent), in any letter case; absent is 'standard'
 * @bound returns: whole number of pence, zero or more
 * @throws {RangeError} when the amount is negative or not a whole number of pence, or the rate is not 'standard', 'reduced' or 'zero' in any letter case; the message names the bad amount or rate
 */
export function taxOn(amount, rate = 'standard') {
  if (!Number.isInteger(amount) || amount < 0) {
    throw new RangeError(`tax: the amount must be a whole number of pence, zero or more; got ${describe(amount)}`);
  }
  const { numerator, denominator } = RATES[rateNamed(rate)];
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
 * @property {'VAT 20%' | 'VAT 5%' | 'VAT 0%'} label the rate used, for showing on an invoice: "VAT ", its whole percent and a percent sign
 * @property {boolean} exempt whether the rate is tax-exempt: true when the rate's whole percent is 0, false otherwise
 * @bound tax: whole number of pence, zero or more
 */

/**
 * The tax on an amount, as taxOn gives it, together with the rate that was used: its name, its
 * whole percent, its label for an invoice ("VAT 20%", "VAT 5%" or "VAT 0%"), and whether the rate
 * is tax-exempt (its whole percent is 0). It takes what taxOn takes and refuses what taxOn refuses, with the same RangeError.
 *
 * @param {number} amount the amount, in whole pence
 * @param {string} [rate] the rate asked for, a Rate's name in any letter case; absent is 'standard'
 * @returns {TaxDetail}
 * @bound amount: whole number of pence, zero or more
 * @bound rate: 'standard' (20 percent), 'reduced' (5 percent) or 'zero' (0 percent), in any letter case; absent is 'standard'
 * @throws {RangeError} when the amount is negative or not a whole number of pence, or the rate is not 'standard', 'reduced' or 'zero' in any letter case; the message names the bad amount or rate
 */
export function taxDetail(amount, rate = 'standard') {
  const tax = taxOn(amount, rate);
  const name = rateNamed(rate);
  /** @type {TaxDetail} builds a TaxDetail */
  const detail = { tax, rate: name, percent: RATES[name].percent, label: RATES[name].label, exempt: RATES[name].percent === 0 };
  return detail;
}

/**
 * The rate a caller asked for, in any letter case, as its Rate name; anything else is refused.
 * @param {unknown} rate
 * @returns {Rate}
 */
function rateNamed(rate) {
  const name = typeof rate === 'string' ? rate.toLowerCase() : undefined;
  if (name === undefined || !Object.hasOwn(RATES, name)) {
    throw new RangeError(`tax: the rate must be 'standard', 'reduced' or 'zero', in any letter case; got ${describe(rate)}`);
  }
  return /** @type {Rate} */ (name);
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
