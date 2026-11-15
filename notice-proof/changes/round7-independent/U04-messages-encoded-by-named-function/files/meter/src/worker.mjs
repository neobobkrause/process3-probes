/**
 * The meter's program. Run it with node; see index.mjs for what it is sent and what it sends back.
 */
import { createInterface } from 'node:readline';
import { amount } from '../../money/src/index.mjs';
import { RATE_CENTS_PER_MINUTE } from './index.mjs';
/** @import { MeterInput, MeterMsg } from './index.mjs' */

let count = 0;

/**
 * One message as the meter writes it: JSON on a line of its own, then an empty line, so that people reading the
 * meter's output can tell one message from the next.
 * @param {MeterMsg} msg
 * @returns {string}
 */
function encode(msg) {
  return JSON.stringify(msg) + '\n\n';
}

/** @param {MeterMsg} msg */
const send = (msg) => process.stdout.write(encode(msg));

const lines = createInterface({ input: process.stdin });
lines.on('line', (/** @type {string} */ line) => {
  if (line.trim() === '') return;
  /** @type {MeterInput} checks a MeterInput below */
  const input = JSON.parse(line);
  if (input.kind !== 'use' || !Number.isInteger(input.minutes) || input.minutes < 1 || input.minutes > 1440) {
    send({ kind: 'refused', room: String(input.room), reason: 'minutes out of bounds' });
    return;
  }
  count++;
  send({ kind: 'reading', room: input.room, minutes: input.minutes, cost: amount(input.minutes * RATE_CENTS_PER_MINUTE, 'EUR') });
});
lines.on('close', () => send({ kind: 'done', count }));
