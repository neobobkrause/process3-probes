/**
 * Amounts of money, held as whole cents with a currency code.
 */

/** The currencies the product handles. */
export const CURRENCIES = Object.freeze(/** @type {const} */ (['EUR', 'USD', 'GBP']));

/** @typedef {typeof CURRENCIES[number]} Currency */

/**
 * An amount of money.
 * @typedef {Object} Amount
 * @property {number} cents the amount in whole cents
 * @property {Currency} currency
 * @bound cents: whole number, 0 to 10,000,000 inclusive
 */

const MAX_CENTS = 10_000_000;

/**
 * Makes an amount, refusing one outside its bound.
 * @param {number} cents
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

/**
 * A running total of amounts of one currency, for adding up many amounts as they come.
 */
export class Tally {
  /**
   * @param {Currency} [currency] the currency of every amount added; euros when none is given, as the venue's prices are
   */
  constructor(currency = 'EUR') {
    /** @type {Amount} the total so far */
    this.total = amount(0, currency);
  }

  /**
   * Adds an amount of the tally's currency.
   * @param {Amount} a
   * @throws {RangeError} when the currency differs or the total would leave the bound of cents
   */
  add(a) {
    this.total = add(this.total, a);
  }

  /**
   * Adds up a list of amounts of one currency, in a tally that more amounts can be added to.
   * @param {Currency} currency the currency of the amounts, and of the total when the list is empty
   * @param {Amount[]} amounts
   * @returns {Tally}
   * @throws {RangeError} when a currency differs or the total would leave the bound of cents
   */
  static sum(currency, amounts) {
    const t = new Tally(currency);
    for (const a of amounts) t.add(a);
    return t;
  }
}
