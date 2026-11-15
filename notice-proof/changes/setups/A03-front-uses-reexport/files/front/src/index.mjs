/**
 * The front desk: what people see when they book.
 */
import { isEmail, titleCase } from '../../text-rules/src/index.mjs';
import { ROOM_KINDS, slugify } from '../../rooms/src/index.mjs';

/**
 * The id a room of this name has.
 * @param {string} name
 * @returns {string}
 */
export function roomIdFor(name) {
  return slugify(name);
}
/** @import { RoomKind } from '../../rooms/src/index.mjs' */
/** @import { Door } from '../../door/src/index.mjs' */

/**
 * What a person fills in to book.
 * @typedef {Object} BookingForm
 * @property {string} email
 * @property {string} room the room's id
 * @property {string} day
 * @property {number} nights
 * @property {number} party
 * @property {string} [note]
 */

/**
 * The front desk's handle.
 * @typedef {Object} Front
 * @property {(form: BookingForm) => Promise<{id: string, text: string}>} book refuses a form without a valid email
 * @property {(id: string) => Promise<string>} cancel
 * @property {() => string[]} kindsMenu one line per kind of room
 * @property {(kind?: RoomKind) => Promise<string[]>} roomMenu one line per room
 */

/**
 * Makes the front desk.
 * @param {{door: Door}} deps
 * @returns {Front}
 */
export function createFront(deps) {
  const { door } = deps;
  return {
    async book(form) {
      if (!isEmail(form.email)) throw new RangeError('front: a valid email is needed');
      const b = await door.call('bookopen', {
        room: form.room,
        day: form.day,
        nights: form.nights,
        party: form.party,
        ...(form.note === undefined ? {} : { note: form.note }),
      });
      const price = `${(b.total.cents / 100).toFixed(2)} ${b.total.currency}`;
      return { id: b.id, text: `Booked ${b.room} from ${b.day} to ${b.until} for ${b.party}: ${price}` };
    },
    async cancel(id) {
      const b = await door.call('bookcancel', { id });
      return `Cancelled ${b.id}`;
    },
    kindsMenu() {
      return ROOM_KINDS.map((k) => titleCase(k));
    },
    async roomMenu(kind) {
      const { rooms } = await door.call('roomlist', kind === undefined ? {} : { kind });
      return rooms.map((r) => `${r.name} (${r.seats} seats)`);
    },
  };
}
