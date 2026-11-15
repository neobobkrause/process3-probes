/**
 * Small rules for text that several modules share.
 */

const SLUG_MAX = 80;

/**
 * Turns a name into a slug: lower-case letters and digits joined by single hyphens.
 * Accents are dropped, and anything that is not a letter or a digit separates words.
 * @param {string} text the name to turn into a slug
 * @returns {string} the slug
 * @bound text: 1 to 80 characters, with at least one letter or digit
 * @bound result: only a-z, 0-9 and single hyphens between them
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
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
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

/**
 * Writes a list of words for people to read, in alphabetical order, so that a list reads the same whatever order
 * its words come in: "a, b and c".
 * @param {string[]} words
 * @returns {string}
 */
export function listWords(words) {
  words.sort((x, y) => x.localeCompare(y));
  if (words.length <= 1) return words.join('');
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}
