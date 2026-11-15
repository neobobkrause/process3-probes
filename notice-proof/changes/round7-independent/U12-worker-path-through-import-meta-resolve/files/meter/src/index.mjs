/**
 * The meter: a separately running program that prices the minutes rooms were used.
 * It is sent MeterInput lines on its standard input and answers with MeterMsg lines on its standard output,
 * each one JSON on a line of its own. Both sides use the kinds written here.
 */
import { fileURLToPath } from 'node:url';
/** @import { Amount } from '../../money/src/index.mjs' */

/** The price of one minute of use, in euro cents. */
export const RATE_CENTS_PER_MINUTE = 20;

/**
 * Where the meter's program is, for whoever starts it: a path as the file system writes it (a URL's pathname writes a
 * space in a folder's name as %20, and the meter would not start from such a folder).
 * @type {string}
 */
export const WORKER_FILE = fileURLToPath(import.meta.resolve('./worker.mjs'));

/**
 * What the meter is sent: one use of a room.
 * @typedef {{kind: 'use', room: string, minutes: number}} MeterInput
 * @bound minutes: whole number, 1 to 1440
 * @message stdin
 */

/**
 * What the meter sends back: a reading for each use it was sent, in the same order, then done once its input ends.
 * A use outside its bound gets a refusal in place of a reading.
 * @typedef {{kind: 'reading', room: string, minutes: number, cost: Amount}
 *   | {kind: 'refused', room: string, reason: string}
 *   | {kind: 'done', count: number}} MeterMsg
 * @message stdout
 */
