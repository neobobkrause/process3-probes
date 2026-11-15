/**
 * The price list bookings works from, kept apart so that the venue's prices can be read in one place.
 */
/** @import { RoomKind } from '../../rooms/src/index.mjs' */

/**
 * The price of one seat for one night, in euro cents, by kind of room.
 * @type {Readonly<Record<RoomKind, number>>}
 */
export const SEAT_NIGHT_CENTS = Object.freeze({ hall: 1500, studio: 1500, kitchen: 1500 });
