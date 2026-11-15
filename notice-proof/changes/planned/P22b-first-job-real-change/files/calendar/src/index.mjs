/**
 * Days of the calendar, held as Dates at midnight UTC and written YYYY-MM-DD.
 */
const DAY_MS = 86400000;
const NAMES = /** @type {const} */ (['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);

/**
 * Reads a day written YYYY-MM-DD.
 * @param {string} text
 * @returns {Date} midnight UTC of that day
 * @bound text: a real calendar day written YYYY-MM-DD
 * @throws {RangeError} when text is outside its bound
 */
export function parseDay(text) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!m) throw new RangeError('parseDay: expected YYYY-MM-DD');
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  if (d.getUTCMonth() !== Number(m[2]) - 1 || d.getUTCDate() !== Number(m[3])) {
    throw new RangeError('parseDay: no such day');
  }
  return d;
}

/**
 * Writes a day as YYYY-MM-DD.
 * @param {Date} day
 * @returns {string}
 */
export function formatDay(day) {
  return day.toISOString().slice(0, 10);
}

/**
 * The day n days after a day (before it, when n is negative).
 * @param {Date} day
 * @param {number} n
 * @returns {Date}
 * @bound n: a whole number of days
 * @throws {RangeError} when n is outside its bound
 */
export function addDays(day, n) {
  if (!Number.isInteger(n)) throw new RangeError('addDays: n must be a whole number of days');
  return new Date(day.getTime() + n * DAY_MS);
}

/**
 * How many days from a to b, rounded to a whole number; negative when b is before a.
 * @param {Date} a
 * @param {Date} b
 * @returns {number}
 */
export function daysBetween(a, b) {
  return Math.round((b.getTime() - a.getTime()) / DAY_MS);
}

/**
 * The day of the week, in three letters.
 * @param {Date} day
 * @returns {'Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat'}
 */
export function weekday(day) {
  return NAMES[day.getUTCDay()];
}
