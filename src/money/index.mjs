// money: shows an amount of whole pence as pounds text, and reads pounds text back.

/** @param {unknown} v */
const show = (v) => (typeof v === 'number' || typeof v === 'bigint' ? `${v}${typeof v === 'bigint' ? 'n' : ''}` : JSON.stringify(v) ?? String(v));

/**
 * @typedef {Object} FormatOptions
 * @property {boolean} [symbol] absent or true shows the pound sign; false leaves it out
 * @property {boolean} [pence] absent or true always shows the point and pence; false leaves them out of a whole number of pounds
 */

/**
 * Shows an amount of whole pence as pounds text: a pound sign, the whole
 * pounds with a comma between each group of three digits, a point, and two
 * digits of pence. 1234 gives "£12.34", 5 gives "£0.05", 123456789 gives
 * "£1,234,567.89". With options.symbol false the text is the same less the
 * pound sign: 1234 gives "12.34". With options.pence false an amount that is
 * a whole number of pounds is shown without the point and pence: 1200 gives
 * "£12", 123400 gives "£1,234"; any other amount is shown as before.
 * @param {number} pence
 * @param {FormatOptions} [options]
 * @returns {string}
 * @bound pence: whole number, zero or more
 * @throws {RangeError} when pence is negative, not a whole number, or not a number; the message names the bad value
 * @throws {TypeError} when options.symbol or options.pence is given and is not true or false; the message names the bad value
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
  const showPence = options?.pence;
  if (showPence !== undefined && typeof showPence !== 'boolean') {
    throw new TypeError(`money: pence option must be true or false; got ${show(showPence)}`);
  }
  const sign = symbol === false ? '' : '£';
  if (showPence === false && rest === '00') return `${sign}${pounds}`;
  return `${sign}${pounds}.${rest}`;
}

// Whole pounds as formatPence writes them, or with every comma left out;
// the pence are always a point and two digits.
const POUNDS_TEXT = /^£?(0|[1-9]\d*|[1-9]\d{0,2}(?:,\d{3})+)\.(\d{2})$/;

/**
 * Reads pounds text back to its whole pence, the reverse of formatPence:
 * "£1,234,567.89" gives 123456789 and "0.05" gives 5. The pound sign may be
 * there or not. The commas between groups of three digits may all be left
 * out ("£1234.56"), but where given they sit as formatPence places them.
 * The point and two digits of pence are always required.
 * @param {string} text
 * @returns {number}
 * @bound text: pounds text as formatPence gives it, with or without the pound sign; its commas all left out or all where formatPence places them
 * @throws {RangeError} when text is not of that form; the message quotes it
 * @throws {TypeError} when text is not text; the message names the bad value
 */
export function parsePounds(text) {
  if (typeof text !== 'string') {
    throw new TypeError(`money: pounds text must be text; got ${show(text)}`);
  }
  const m = POUNDS_TEXT.exec(text);
  if (m === null) {
    throw new RangeError(`money: not pounds text: ${JSON.stringify(text)}`);
  }
  // A match always captures both groups; the fallbacks only satisfy the checker.
  const whole = m[1] ?? '';
  const frac = m[2] ?? '';
  return Number(BigInt(whole.replaceAll(',', '')) * 100n + BigInt(frac));
}
