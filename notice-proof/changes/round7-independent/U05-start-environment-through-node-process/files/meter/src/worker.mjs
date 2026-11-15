/**
 * The meter's program. Run it with node; see index.mjs for what it is sent and what it sends back.
 */
import { createInterface } from 'node:readline';
import { env } from 'node:process';
import { amount, CURRENCIES } from '../../money/src/index.mjs';
import { RATE_CENTS_PER_MINUTE } from './index.mjs';
/** @import { MeterInput, MeterMsg } from './index.mjs' */
/** @import { Currency } from '../../money/src/index.mjs' */

/**
 * The currency the meter prices in, as the venue sets it in METER_CURRENCY in the meter's environment. A meter started
 * without one stops at once, since a price in a currency nobody chose is worse than none.
 * @returns {Currency}
 * @throws {RangeError} when METER_CURRENCY is not one of CURRENCIES
 */
function currencyToPriceIn() {
  for (const c of CURRENCIES) if (c === env.METER_CURRENCY) return c;
  throw new RangeError(`meter: set METER_CURRENCY to the currency to price in, one of ${CURRENCIES.join(', ')}`);
}

const currency = currencyToPriceIn();
let count = 0;

/** @param {MeterMsg} msg */
const send = (msg) => process.stdout.write(JSON.stringify(msg) + '\n');

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
  send({ kind: 'reading', room: input.room, minutes: input.minutes, cost: amount(input.minutes * RATE_CENTS_PER_MINUTE, currency) });
});
lines.on('close', () => send({ kind: 'done', count }));
