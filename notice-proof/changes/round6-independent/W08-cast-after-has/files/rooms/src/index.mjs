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
 * @property {(ids: string[]) => Room[]} pick the rooms with the given ids, in the order given
 * @throws {RangeError} pick when an id names no room
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
      /** @type {Room} builds a Room */
      const room = { id, name: input.name, kind: input.kind, seats: input.seats };
      store.put('rooms', id, room);
      return room;
    },
    find(id) {
      const rec = store.get('rooms', id);
      return rec ? /** @type {Room} checks nothing: the store holds only Rooms in this table */ (rec.value) : undefined;
    },
    pick(ids) {
      /** @type {Map<string, Room>} */
      const byId = new Map();
      for (const rec of store.list('rooms')) byId.set(rec.id, /** @type {Room} the store holds only Rooms in this table */ (rec.value));
      const missing = ids.find((id) => !byId.has(id));
      if (missing !== undefined) throw new RangeError(`rooms: unknown room: ${missing}`);
      return ids.map((id) => /** @type {Room} every id is in byId: checked just above */ (byId.get(id)));
    },
    list(kind) {
      return store
        .list('rooms')
        .map((r) => /** @type {Room} */ (r.value))
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
