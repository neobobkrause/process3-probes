/**
 * The meter's program. Run it with node; see index.mjs for what it is sent and what it sends back.
 */
import { createInterface } from 'node:readline';
import { amount } from '../../money/src/index.mjs';
import { RATE_CENTS_PER_MINUTE } from './index.mjs';
/** @import { MeterInput, MeterMsg } from './index.mjs' */

let count = 0;

/**
 * Writes a message on a line of its own: a refusal to standard error, so that it shows among the errors; everything
 * else to standard output.
 * @param {MeterMsg} msg
 */
const send = (msg) => {
  const out = msg.kind === 'refused' ? process.stderr : process.stdout;
  out.write(JSON.stringify(msg) + '\n');
};

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
