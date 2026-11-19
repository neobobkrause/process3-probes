// money: shows an amount of whole pence as pounds text.

/** @param {unknown} v */
const show = (v) => (typeof v === 'number' || typeof v === 'bigint' ? `${v}${typeof v === 'bigint' ? 'n' : ''}` : JSON.stringify(v) ?? String(v));

/**
 * @typedef {Object} FormatOptions
 * @property {boolean} [symbol] absent or true shows the pound sign; false leaves it out
 */

/**
 * Shows an amount of whole pence as pounds text: a pound sign, the whole
 * pounds with a comma between each group of three digits, a point, and two
 * digits of pence. 1234 gives "£12.34", 5 gives "£0.05", 123456789 gives
 * "£1,234,567.89". With options.symbol false the text is the same less the
 * pound sign: 1234 gives "12.34".
 * @param {number} pence
 * @param {FormatOptions} [options]
 * @returns {string}
 * @bound pence: whole number, zero or more
 * @throws {RangeError} when pence is negative, not a whole number, or not a number; the message names the bad value
 * @throws {TypeError} when options.symbol is given and is not true or false; the message names the bad value
 */
export function formatPence(pence, options) {
  if (typeof pence !== 'number' || !Number.isInteger(pence) || pence < 0) {
    throw new RangeError(`money: pence must be a whole number, zero or more; got ${show(pence)}`);
  }
  const all = BigInt(pence);
  const pounds = String(all / 100n).replace(/\B(?=(\d{3})+$)/g, ',');
  const rest = String(all % 100n).padStart(2, '0');
  const symbol = options?.symbol;
  if (symbol !== undefined && typeof symbol !== 'boolean') {
    throw new TypeError(`money: symbol must be true or false; got ${show(symbol)}`);
  }
  const sign = symbol === false ? '' : '£';
  return `${sign}${pounds}.${rest}`;
}
