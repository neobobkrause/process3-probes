/**
 * The price list bookings works from, kept apart so that the venue's prices can be read in one place.
 */
/** @import { RoomKind } from '../../rooms/src/index.mjs' */

/**
 * The price of one seat for one night, in euros, by kind of room, as the venue's price sheet writes it.
 * @type {Readonly<Record<RoomKind, number>>}
 */
export const SEAT_NIGHT_EUROS = Object.freeze({ hall: 15, studio: 15, kitchen: 15 });
