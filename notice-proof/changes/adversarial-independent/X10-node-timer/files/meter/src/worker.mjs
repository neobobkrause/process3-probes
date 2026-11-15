/**
 * The meter's program. Run it with node; see index.mjs for what it is sent and what it sends back.
 */
import { createInterface } from 'node:readline';
import { amount } from '../../money/src/index.mjs';
import { RATE_CENTS_PER_MINUTE } from './index.mjs';
/** @import { MeterInput, MeterMsg } from './index.mjs' */

let count = 0;

/** @param {MeterMsg} msg */
const send = (msg) => process.stdout.write(JSON.stringify(msg) + '\n');

const lines = createInterface({ input: process.stdin });

/** How long the meter waits for its next line before it stops on its own, in milliseconds. */
const IDLE_MS = 30_000;
// A meter whose input goes quiet stops on its own, so that a forgotten one does not linger. The wait alone does
// not keep the program running.
const idle = setTimeout(() => lines.close(), IDLE_MS);
idle.unref();

lines.on('line', (/** @type {string} */ line) => {
  idle.refresh();
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
lines.on('close', () => {
  clearTimeout(idle);
  send({ kind: 'done', count });
});
