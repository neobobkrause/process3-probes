/**
 * The shared door that carries calls by name to whichever module answers them.
 * Bodies and answers are copied as JSON on the way through, as they would be over a connection.
 */
/** @import { BookingOps } from '../../bookings/src/index.mjs' */
/** @import { RoomOps } from '../../rooms/src/index.mjs' */

/**
 * Every operation that can be called by name: the gathered list of the providers' tables.
 * @typedef {BookingOps & RoomOps} AllOps
 */

/**
 * One handler for each operation in the gathered list.
 * @typedef {{[K in keyof AllOps]: (req: AllOps[K]['req']) => AllOps[K]['res']}} Handlers
 */

/**
 * The door's handle. The name of the operation selects what is handed and what comes back.
 * @typedef {Object} Door
 * @property {<K extends keyof AllOps>(op: K, body: AllOps[K]['req']) => Promise<AllOps[K]['res']>} call calls an operation by name with a body
 * @property {(<K extends keyof AllOps>(line: `op=${K}&${string}`) => Promise<AllOps[K]['res']>) | undefined} get calls an operation written as a request line, op=name&field=value; every value arrives as text. Request lines are the older way of calling: only a door made with {lines: true} has get; on any other door it is undefined
 * @carriesop call get
 */

/**
 * Makes a door over the handlers.
 * @param {Handlers} handlers
 * @param {{lines?: boolean}} [options] request lines are read only when lines is true
 * @returns {Door}
 */
export function createDoor(handlers, options = {}) {
  /**
   * @param {string} op
   * @param {unknown} body
   */
  const dispatch = async (op, body) => {
    const h = /** @type {Record<string, ((req: unknown) => unknown) | undefined>} */ (handlers)[op];
    if (typeof h !== 'function') throw new Error(`door: unknown operation: ${op}`);
    await Promise.resolve();
    return JSON.parse(JSON.stringify(h(JSON.parse(JSON.stringify(body)))));
  };
  /** @type {Door} builds a Door */
  const door = { call: (op, body) => dispatch(op, body), get: undefined };
  if (options.lines) {
    door.get = (line) => {
      const params = new URLSearchParams(line);
      const op = params.get('op');
      if (!op) throw new Error('door: request line without op');
      /** @type {Record<string, string>} */
      const body = {};
      for (const [k, v] of params) if (k !== 'op') body[k] = v;
      return dispatch(op, body);
    };
  }
  return door;
}
