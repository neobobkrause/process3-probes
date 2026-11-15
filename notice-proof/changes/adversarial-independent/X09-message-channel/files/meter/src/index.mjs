/**
 * The meter: a separately running program that prices the minutes rooms were used.
 * It is sent MeterInput lines on its standard input and answers with MeterMsg lines, refusals on its standard
 * error and everything else on its standard output, each one JSON on a line of its own. Both sides use the kinds written here.
 */
/** @import { Amount } from '../../money/src/index.mjs' */

/** The price of one minute of use, in euro cents. */
export const RATE_CENTS_PER_MINUTE = 20;

/** Where the meter's program is, for whoever starts it. */
export const WORKER_FILE = new URL('./worker.mjs', import.meta.url).pathname;

/**
 * What the meter is sent: one use of a room.
 * @typedef {{kind: 'use', room: string, minutes: number}} MeterInput
 * @bound minutes: whole number, 1 to 1440
 */

/**
 * What the meter sends back: a reading for each use it was sent, in the same order, then done once its input ends.
 * A use outside its bound gets a refusal in place of a reading, written to standard error.
 * @typedef {{kind: 'reading', room: string, minutes: number, cost: Amount}
 *   | {kind: 'refused', room: string, reason: string}
 *   | {kind: 'done', count: number}} MeterMsg
 */
