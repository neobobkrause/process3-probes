// discount: the discount on an amount of money held in whole pence, at a percentage.

/**
 * The discount on an amount at a percentage: the amount times the percentage divided by 100,
 * rounded half up to a whole penny. The percentage is taken exactly as it is written in decimal
 * (12.5 is twelve and a half percent, 0.3 is three tenths of a percent), and the sum is worked in
 * whole numbers, so no fraction of a penny is lost to floating point.
 *
 * @param {number} amount the amount, in whole pence
 * @param {number} percentage the percentage, from 0 to 100; it need not be whole
 * @returns {number} the discount, in whole pence
 * @bound amount: whole number of pence, zero or more
 * @bound percentage: finite number from 0 to 100 inclusive; fractions allowed
 * @bound returns: whole number of pence, from zero up to the amount
 * @throws {RangeError} when the amount is negative or not a whole number of pence, or the percentage is not a finite number or is outside 0 to 100; the message names the bad amount or percentage
 */
export function discountOn(amount, percentage) {
  if (!Number.isInteger(amount) || amount < 0) {
    throw new RangeError(`discount: the amount must be a whole number of pence, zero or more; got ${describe(amount)}`);
  }
  if (typeof percentage !== 'number' || !Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
    throw new RangeError(`discount: the percentage must be a finite number from 0 to 100; got ${describe(percentage)}`);
  }
  const { numerator, denominator } = asDecimalFraction(percentage);
  // amount * (numerator / denominator) / 100, rounded half up: floor((2 * amount * num + den100) / (2 * den100)).
  const den100 = 100n * denominator;
  const twice = 2n * BigInt(amount) * numerator;
  return Number((twice + den100) / (2n * den100));
}

/** A finite number from 0 to 100 as the exact fraction of its shortest decimal writing. */
function asDecimalFraction(value) {
  const match = /^(\d+)(?:\.(\d+))?(?:e([+-]\d+))?$/.exec(String(value));
  const whole = match[1];
  const fraction = match[2] ?? '';
  const exponent = Number(match[3] ?? 0) - fraction.length;
  const digits = BigInt(whole + fraction);
  return exponent >= 0
    ? { numerator: digits * 10n ** BigInt(exponent), denominator: 1n }
    : { numerator: digits, denominator: 10n ** BigInt(-exponent) };
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
