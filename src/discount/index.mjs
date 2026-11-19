// discount: the discount on an amount of money held in whole pence, at a percentage.

/**
 * The discount on an amount at a percentage: the amount times the percentage divided by 100,
 * rounded half up to a whole penny. The percentage is taken exactly as it is written in decimal
 * (12.5 is twelve and a half percent, 0.3 is three tenths of a percent), and the sum is worked in
 * whole numbers, so no fraction of a penny is lost to floating point.
 *
 * The percentage may also be text: a number written in decimal digits, with an optional sign and
 * an optional fraction after a point, then optional spaces, then a percent sign ("15%", "12.5 %").
 * Its number is taken exactly as written and judged as a percentage given as a number is.
 *
 * @param {number} amount the amount, in whole pence
 * @param {number | string} percentage the percentage, from 0 to 100; it need not be whole; or text such as "15%"
 * @returns {number} the discount, in whole pence
 * @bound amount: whole number of pence, zero or more
 * @bound percentage: finite number from 0 to 100 inclusive; fractions allowed; or text of the form digits, optional point and digits, optional spaces, then "%", whose number is from 0 to 100 inclusive
 * @bound returns: whole number of pence, from zero up to the amount
 * @throws {RangeError} when the amount is negative or not a whole number of pence, or the percentage is not a finite number or is outside 0 to 100, or is text of any other form; the message names the bad amount or percentage, and quotes text
 */
export function discountOn(amount, percentage) {
  if (!Number.isInteger(amount) || amount < 0) {
    throw new RangeError(`discount: the amount must be a whole number of pence, zero or more; got ${describe(amount)}`);
  }
  const { numerator, denominator } = percentageAsFraction(percentage);
  // amount * (numerator / denominator) / 100, rounded half up: floor((2 * amount * num + den100) / (2 * den100)).
  const den100 = 100n * denominator;
  const twice = 2n * BigInt(amount) * numerator;
  return Number((twice + den100) / (2n * den100));
}

/**
 * The percentage, number or text, as an exact fraction from 0 to 100, or a RangeError naming it.
 * @param {unknown} percentage
 * @returns {{ numerator: bigint, denominator: bigint }}
 * @throws {RangeError} when it is not a finite number or percent text from 0 to 100
 */
function percentageAsFraction(percentage) {
  const refuse = () =>
    new RangeError(
      `discount: the percentage must be a finite number from 0 to 100, or text such as "15%"; got ${describe(percentage)}`,
    );
  if (typeof percentage === 'number') {
    if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) throw refuse();
    return asDecimalFraction(percentage);
  }
  if (typeof percentage !== 'string') throw refuse();
  const match = /^([+-]?)(\d+)(?:\.(\d+))? *%$/.exec(percentage);
  if (!match) throw refuse();
  const [, sign, whole, fraction = ''] = match;
  const numerator = BigInt(whole + fraction);
  const denominator = 10n ** BigInt(fraction.length);
  if ((sign === '-' && numerator !== 0n) || numerator > 100n * denominator) throw refuse();
  return { numerator, denominator };
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
