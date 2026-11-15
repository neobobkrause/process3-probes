/**
 * Bookings of rooms for one or more nights.
 */
import { amount } from '../../money/src/index.mjs';
import { parseDay, formatDay, addDays } from '../../calendar/src/index.mjs';
import prices from './prices.json' with { type: 'json' };
/** @import { Amount } from '../../money/src/index.mjs' */
/** @import { Store } from '../../store/src/index.mjs' */
/** @import { Rooms } from '../../rooms/src/index.mjs' */

/** The price of one seat for one night, in euro cents, from the venue's price sheet (prices.json, which its staff keep in euros). */
export const PRICE_PER_SEAT_NIGHT = prices.seatNightEuros * 100;

/**
 * A booking.
 * @typedef {Object} Booking
 * @property {string} id
 * @property {string} room the room's id
 * @property {string} day the first night, YYYY-MM-DD
 * @property {string} until the morning after the last night, YYYY-MM-DD
 * @property {number} nights
 * @property {number} party how many people
 * @property {'open' | 'cancelled'} state
 * @property {Amount} total what the booking costs
 * @property {string} [note]
 * @bound day: a real calendar day written YYYY-MM-DD
 * @bound nights: whole number, 1 to 14
 * @bound party: whole number, 1 to 200, and no more than the room's seats
 * @storedrows bookings
 */

/**
 * What it takes to open a booking.
 * @typedef {Object} BookingRequest
 * @property {string} room the room's id
 * @property {string} day
 * @property {number} nights
 * @property {number} party
 * @property {string} [note]
 */

/**
 * The bookings' handle.
 * @typedef {Object} Bookings
 * @property {(req: BookingRequest) => Booking} open opens a booking; refuses one outside the bounds or for an unknown room
 * @property {(id: string) => Booking} cancel cancels an open booking; refuses an unknown or already cancelled one
 * @property {(id: string) => Booking | undefined} find
 * @property {(room: string, party: number, nights: number) => Amount} quote what a booking would cost
 */

/**
 * The operations bookings answers by name through the door.
 * @typedef {{
 *   bookopen: {req: BookingRequest, res: Booking},
 *   bookcancel: {req: {id: string}, res: Booking},
 *   bookstatus: {req: {id: string}, res: {state: Booking['state'], total: Amount, room: string}},
 *   bookquote: {req: {room: string, party: number, nights: number}, res: {total: Amount}}
 * }} BookingOps
 * @optable
 * @bound bookquote.total: what the whole stay costs, for the whole party and every night
 */

/**
 * The handlers of bookings' operations, one per entry of BookingOps.
 * @typedef {{[K in keyof BookingOps]: (req: BookingOps[K]['req']) => BookingOps[K]['res']}} BookingHandlers
 */

/**
 * Refuses a party or a number of nights outside its bound.
 * @param {number} party
 * @param {number} nights
 * @param {number} seats
 */
function checkSize(party, nights, seats) {
  if (!Number.isInteger(party) || party < 1 || party > 200 || party > seats) {
    throw new RangeError('bookings: party out of bounds');
  }
  if (!Number.isInteger(nights) || nights < 1 || nights > 14) throw new RangeError('bookings: nights out of bounds');
}

/**
 * Makes the bookings' handle.
 * @param {{store: Store, rooms: Rooms}} deps
 * @returns {Bookings}
 */
export function createBookings(deps) {
  const { store, rooms } = deps;
  let next = 1;
  /**
   * @param {string} roomId
   * @param {number} party
   * @param {number} nights
   */
  const quote = (roomId, party, nights) => {
    const room = rooms.find(roomId);
    if (!room) throw new RangeError(`bookings: unknown room: ${roomId}`);
    checkSize(party, nights, room.seats);
    return amount(PRICE_PER_SEAT_NIGHT * party * nights, 'EUR');
  };
  /** @param {string} id */
  const find = (id) => {
    const rec = store.get('bookings', id);
    return rec ? /** @type {Booking} */ (rec.value) : undefined;
  };
  return {
    quote,
    find,
    open(req) {
      const first = parseDay(req.day);
      const total = quote(req.room, req.party, req.nights);
      /** @type {Booking} builds a Booking */
      const b = {
        id: `b-${next++}`,
        room: req.room,
        day: formatDay(first),
        until: formatDay(addDays(first, req.nights)),
        nights: req.nights,
        party: req.party,
        state: 'open',
        total,
      };
      if (req.note !== undefined) b.note = req.note;
      store.put('bookings', b.id, b);
      return b;
    },
    cancel(id) {
      const b = find(id);
      if (!b) throw new RangeError(`bookings: unknown booking: ${id}`);
      if (b.state !== 'open') throw new Error(`bookings: not open: ${id}`);
      /** @type {Booking} builds a Booking */
      const done = { ...b, state: 'cancelled' };
      store.put('bookings', id, done);
      return done;
    },
  };
}

/**
 * Makes the handlers of bookings' operations.
 * @param {Bookings} bookings
 * @returns {BookingHandlers}
 */
export function bookingHandlers(bookings) {
  return {
    bookopen: (req) => bookings.open(req),
    bookcancel: (req) => bookings.cancel(req.id),
    bookstatus: (req) => {
      const b = bookings.find(req.id);
      if (!b) throw new RangeError(`bookings: unknown booking: ${req.id}`);
      return { state: b.state, total: b.total, room: b.room };
    },
    bookquote: (req) => ({ total: bookings.quote(req.room, req.party, req.nights) }),
  };
}
