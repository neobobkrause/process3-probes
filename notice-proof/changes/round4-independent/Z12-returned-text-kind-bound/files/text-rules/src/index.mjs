/**
 * Small rules for text that several modules share.
 */

const SLUG_MAX = 80;

/**
 * A slug: what slugify makes of a name.
 * @typedef {string} Slug
 * @bound slug: only a-z, 0-9 and single underscores between them
 */

/**
 * Turns a name into a slug: lower-case letters and digits joined by single underscores, as the venue's booking
 * system needs.
 * Accents are dropped, and anything that is not a letter or a digit separates words.
 * @param {string} text the name to turn into a slug
 * @returns {Slug} the slug
 * @bound text: 1 to 80 characters, with at least one letter or digit
 * @throws {RangeError} when text is outside its bound
 */
export function slugify(text) {
  if (typeof text !== 'string' || text.length < 1 || text.length > SLUG_MAX) {
    throw new RangeError('slugify: text must be 1 to 80 characters');
  }
  const slug = text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  if (slug === '') throw new RangeError('slugify: text needs at least one letter or digit');
  return slug;
}

/**
 * Says whether text looks like an email address: something, an at sign, something, a dot, something; no spaces.
 * @param {string} text
 * @returns {boolean}
 */
export function isEmail(text) {
  return typeof text === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
}

/**
 * Upper-cases the first letter of each word and leaves the rest alone.
 * @param {string} text
 * @returns {string}
 */
export function titleCase(text) {
  return text.replace(/\b([a-z])/g, (m) => m.toUpperCase());
}
