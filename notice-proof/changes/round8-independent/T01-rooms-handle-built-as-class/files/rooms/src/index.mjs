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
 * The rooms' handle as one object that keeps its store, so that the state of the rooms is in one place (the class)
 * rather than in a closure.
 */
class RoomDirectory {
  /** @type {Store} */
  #store;

  /** @param {Store} store */
  constructor(store) {
    this.#store = store;
  }

  /**
   * @param {NewRoom} input
   * @returns {Room}
   */
  add(input) {
    if (!ROOM_KINDS.includes(input.kind)) throw new RangeError(`rooms: unknown kind: ${input.kind}`);
    if (!Number.isInteger(input.seats) || input.seats < 1 || input.seats > 500) {
      throw new RangeError('rooms: seats out of bounds');
    }
    const id = slugify(input.name);
    if (this.#store.get('rooms', id)) throw new Error(`rooms: already taken: ${id}`);
    /** @type {Room} builds a Room */
    const room = { id, name: input.name, kind: input.kind, seats: input.seats };
    this.#store.put('rooms', id, room);
    return room;
  }

  /**
   * @param {string} id
   * @returns {Room | undefined}
   */
  find(id) {
    const rec = this.#store.get('rooms', id);
    return rec ? /** @type {Room} checks nothing: the store holds only Rooms in this table */ (rec.value) : undefined;
  }

  /**
   * @param {RoomKind} [kind]
   * @returns {Room[]}
   */
  list(kind) {
    return this.#store
      .list('rooms')
      .map((r) => /** @type {Room} */ (r.value))
      .filter((r) => kind === undefined || r.kind === kind)
      .sort((a, b) => a.name.localeCompare(b.name));
  }
}

/**
 * Makes the rooms' handle over a store.
 * @param {{store: Store}} deps
 * @returns {Rooms}
 */
export function createRooms(deps) {
  return new RoomDirectory(deps.store);
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
