/**
 * Amounts of money, held as whole cents with a currency code.
 */

/** The currencies the product handles. */
export const CURRENCIES = Object.freeze(/** @type {const} */ (['EUR', 'USD', 'GBP']));

/** @typedef {typeof CURRENCIES[number]} Currency */

/**
 * A number of whole cents.
 * @typedef {number} Cents
 * @bound cents: whole number, 0 to 500,000 inclusive
 */

/**
 * An amount of money.
 * @typedef {Object} Amount
 * @property {Cents} cents the amount in whole cents
 * @property {Currency} currency
 */

const MAX_CENTS = 500_000;

/**
 * Makes an amount, refusing one outside its bound.
 * @param {Cents} cents
 * @param {Currency} currency
 * @returns {Amount}
 * @throws {RangeError} when cents is outside its bound or the currency is not one of CURRENCIES
 */
export function amount(cents, currency) {
  if (!Number.isInteger(cents) || cents < 0 || cents > MAX_CENTS) {
    throw new RangeError(`amount: cents out of bounds: ${cents}`);
  }
  if (!CURRENCIES.includes(currency)) throw new RangeError(`amount: unknown currency: ${currency}`);
  /** @type {Amount} builds an Amount */
  const out = { cents, currency };
  return out;
}

/**
 * Adds two amounts of the same currency.
 * @param {Amount} a
 * @param {Amount} b
 * @returns {Amount}
 * @throws {RangeError} when the currencies differ or the sum is outside the bound of cents
 */
export function add(a, b) {
  if (a.currency !== b.currency) throw new RangeError('add: currencies differ');
  return amount(a.cents + b.cents, a.currency);
}

/**
 * Writes an amount for people to read.
 * @param {Amount} a
 * @returns {string}
 */
export function formatAmount(a) {
  return `${a.currency} ${(a.cents / 100).toFixed(2)}`;
}

/**
 * Splits an amount into equal parts that add up to it exactly; leftover cents go to the first parts.
 * @param {Amount} a
 * @param {number} parts
 * @returns {Amount[]}
 * @bound parts: whole number, 1 to 100
 * @throws {RangeError} when parts is outside its bound
 */
export function splitEvenly(a, parts) {
  if (!Number.isInteger(parts) || parts < 1 || parts > 100) throw new RangeError('splitEvenly: parts out of bounds');
  const base = Math.floor(a.cents / parts);
  const extra = a.cents - base * parts;
  /** @type {Amount[]} builds Amounts */
  const out = [];
  for (let i = 0; i < parts; i++) out.push(amount(base + (i < extra ? 1 : 0), a.currency));
  return out;
}
