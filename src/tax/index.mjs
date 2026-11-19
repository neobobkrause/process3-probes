// tax: the tax on an amount of money held in whole pence.

/** The standard rate, as a fraction: 20 percent. */
const RATE_NUMERATOR = 1n;
const RATE_DENOMINATOR = 5n;

/**
 * The tax on an amount at the standard rate of 20 percent, rounded half up to a whole penny.
 * Worked in whole numbers, so no fraction of a penny is ever lost to floating point.
 *
 * @param {number} amount the amount, in whole pence
 * @returns {number} the tax, in whole pence
 * @bound amount: whole number of pence, zero or more
 * @bound returns: whole number of pence, zero or more
 * @throws {RangeError} when the amount is negative or not a whole number of pence; the message names the amount
 */
export function taxOn(amount) {
  if (!Number.isInteger(amount) || amount < 0) {
    throw new RangeError(`tax: the amount must be a whole number of pence, zero or more; got ${describe(amount)}`);
  }
  // amount / 5, rounded half up: floor((2 * amount * num + den) / (2 * den)).
  const twice = 2n * BigInt(amount) * RATE_NUMERATOR;
  return Number((twice + RATE_DENOMINATOR) / (2n * RATE_DENOMINATOR));
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
