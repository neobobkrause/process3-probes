/**
 * Invoices for bookings, and the price of metered use, worked out by the separately running meter.
 */
import { spawn } from 'node:child_process';
import { amount, add, formatAmount, splitEvenly } from '../../money/src/index.mjs';
import { WORKER_FILE } from '../../meter/src/index.mjs';
/** @import { Amount } from '../../money/src/index.mjs' */
/** @import { MeterInput } from '../../meter/src/index.mjs' */
/** @import { Door } from '../../door/src/index.mjs' */

/**
 * An invoice.
 * @typedef {Object} Invoice
 * @property {string} booking the booking's id
 * @property {Amount} total
 * @property {Amount[]} instalments what is due at each payment; they add up to the total
 * @property {string} text the invoice written for people
 */

/**
 * The billing's handle.
 * @typedef {Object} Billing
 * @property {(bookingId: string, instalments: number) => Promise<Invoice>} invoice refuses a booking that is not open
 * @property {(uses: MeterInput[]) => Promise<Amount>} meterUsage runs the meter and adds up its readings; refuses if the meter refuses any use
 * @property {(room: string, party: number, nights: number) => Promise<Estimate>} estimate what a stay would cost, and the deposit to ask for
 */

/**
 * An estimate before booking.
 * @typedef {Object} Estimate
 * @property {Amount} total what the whole stay would cost
 * @property {Amount} deposit a fifth of the total, rounded down to whole cents
 */

/**
 * Makes the billing's handle.
 * @param {{door: Door}} deps
 * @returns {Billing}
 */
export function createBilling(deps) {
  return {
    async invoice(bookingId, instalments) {
      const status = await deps.door.get(`op=bookstatus&id=${bookingId}`);
      if (status.state !== 'open') throw new Error(`billing: booking ${bookingId} is not open`);
      const parts = splitEvenly(status.total, instalments);
      return {
        booking: bookingId,
        total: status.total,
        instalments: parts,
        text: `Invoice for ${bookingId} (${status.room}): ${formatAmount(status.total)} in ${parts.length} payment(s)`,
      };
    },
    async estimate(room, party, nights) {
      const { total } = await deps.door.call('bookquote', { room, party, nights });
      return { total, deposit: amount(Math.floor(total.cents / 5), total.currency) };
    },
    meterUsage(uses) {
      return new Promise((resolve, reject) => {
        const child = spawn(process.execPath, [WORKER_FILE]);
        let buffer = '';
        let total = amount(0, 'EUR');
        child.on('error', reject);
        child.stdout.on('data', (/** @type {any} */ chunk) => {
          buffer += String(chunk);
          let nl;
          while ((nl = buffer.indexOf('\n')) >= 0) {
            const line = buffer.slice(0, nl);
            buffer = buffer.slice(nl + 1);
            /** @type {{kind: 'reading', room: string, minutes: number, cost: Amount} | {kind: 'refused', room: string, reason: string} | {kind: 'done', count: number}} checks a message by its kind (billing's own copy) */
            const msg = JSON.parse(line);
            if (msg.kind === 'reading') total = add(total, msg.cost);
            else if (msg.kind === 'refused') reject(new RangeError(`billing: meter refused ${msg.room}: ${msg.reason}`));
            else if (msg.kind === 'done') resolve(total);
          }
        });
        child.stdin.end(uses.map((u) => JSON.stringify(u)).join('\n') + '\n');
      });
    },
  };
}
