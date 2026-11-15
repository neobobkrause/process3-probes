/**
 * The rooms that can be booked.
 */
import { slugify } from '../../text-rules/src/index.mjs';
/** @import { Store } from '../../store/src/index.mjs' */

/** The kinds of room there are. */
export const ROOM_KINDS = Object.freeze(/** @type {const} */ (['hall', 'studio', 'kitchen']));

/** @typedef {typeof ROOM_KINDS[number]} RoomKind */

/**
 * A room.
 * @typedef {Object} Room
 * @property {string} id the room's slug, made from its name
 * @property {string} name
 * @property {RoomKind} kind
 * @property {number} seats
 * @bound seats: whole number, 1 to 500
 */

/**
 * A room as the rooms table holds it. The seats are kept under capacity, the name the venue's booking system gives
 * them, so that the table can be handed to it as it is.
 * @typedef {Object} RoomRow
 * @property {string} id
 * @property {string} name
 * @property {RoomKind} kind
 * @property {number} capacity the room's seats
 * @storedrows rooms
 */

/**
 * What it takes to add a room.
 * @typedef {Object} NewRoom
 * @property {string} name
 * @property {RoomKind} kind
 * @property {number} seats
 */

/**
 * The rooms' handle.
 * @typedef {Object} Rooms
 * @property {(input: NewRoom) => Room} add adds a room; refuses a name whose slug is already taken
 * @property {(id: string) => Room | undefined} find
 * @property {(kind?: RoomKind) => Room[]} list rooms, only of one kind when it is given, in name order
 */

/**
 * The operations rooms answers by name through the door.
 * @typedef {{
 *   roomlist: {req: {kind?: RoomKind}, res: {rooms: Room[]}}
 * }} RoomOps
 * @optable
 */

/**
 * The handlers of rooms' operations, one per entry of RoomOps.
 * @typedef {{[K in keyof RoomOps]: (req: RoomOps[K]['req']) => RoomOps[K]['res']}} RoomHandlers
 */

/**
 * A room as rooms hands it back, from a row of the rooms table.
 * @param {RoomRow} row
 * @returns {Room}
 */
function toRoom(row) {
  return { id: row.id, name: row.name, kind: row.kind, seats: row.capacity };
}

/**
 * Makes the rooms' handle over a store.
 * @param {{store: Store}} deps
 * @returns {Rooms}
 */
export function createRooms(deps) {
  const { store } = deps;
  return {
    add(input) {
      if (!ROOM_KINDS.includes(input.kind)) throw new RangeError(`rooms: unknown kind: ${input.kind}`);
      if (!Number.isInteger(input.seats) || input.seats < 1 || input.seats > 500) {
        throw new RangeError('rooms: seats out of bounds');
      }
      const id = slugify(input.name);
      if (store.get('rooms', id)) throw new Error(`rooms: already taken: ${id}`);
      /** @type {RoomRow} builds a RoomRow */
      const row = { id, name: input.name, kind: input.kind, capacity: input.seats };
      store.put('rooms', id, row);
      return toRoom(row);
    },
    find(id) {
      const rec = store.get('rooms', id);
      return rec ? toRoom(/** @type {RoomRow} checks nothing: the store holds only RoomRows in this table */ (rec.value)) : undefined;
    },
    list(kind) {
      return store
        .list('rooms')
        .map((r) => toRoom(/** @type {RoomRow} */ (r.value)))
        .filter((r) => kind === undefined || r.kind === kind)
        .sort((a, b) => a.name.localeCompare(b.name));
    },
  };
}

/**
 * Makes the handlers of rooms' operations.
 * @param {Rooms} rooms
 * @returns {RoomHandlers}
 */
export function roomHandlers(rooms) {
  return {
    roomlist: (req) => ({ rooms: rooms.list(req.kind) }),
  };
}
