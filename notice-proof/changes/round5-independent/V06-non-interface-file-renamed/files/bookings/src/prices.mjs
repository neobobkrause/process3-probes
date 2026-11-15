/**
 * The price list bookings works from, kept apart so that the venue's prices can be read in one place.
 */
import { amount } from '../../money/src/index.mjs';
/** @import { RoomKind } from '../../rooms/src/index.mjs' */
/** @import { Amount } from '../../money/src/index.mjs' */

/**
 * The price of one seat for one night, by kind of room.
 * @type {Readonly<Record<RoomKind, Amount>>}
 */
export const SEAT_NIGHT = Object.freeze({ hall: amount(1500, 'EUR'), studio: amount(1500, 'EUR'), kitchen: amount(1500, 'EUR') });
