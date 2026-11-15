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
 * The operations a request line may call: those that change nothing. Anyone who is shown a link can follow it, so a
 * request line must not open or cancel a booking.
 * @typedef {Exclude<keyof AllOps, 'bookopen' | 'bookcancel'>} LineOp
 */

/**
 * The door's handle. The name of the operation selects what is handed and what comes back.
 * @typedef {Object} Door
 * @property {<K extends keyof AllOps>(op: K, body: AllOps[K]['req']) => Promise<AllOps[K]['res']>} call calls an operation by name with a body
 * @property {<K extends LineOp>(line: `op=${K}&${string}`) => Promise<AllOps[K]['res']>} get calls an operation that changes nothing (a LineOp), written as a request line, op=name&field=value; every value arrives as text; refuses any other operation
 * @carriesop call get
 */

/** The operations that change something, which a request line may not call. */
const CHANGING = ['bookopen', 'bookcancel'];

/**
 * Makes a door over the handlers.
 * @param {Handlers} handlers
 * @returns {Door}
 */
export function createDoor(handlers) {
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
  return {
    call: (op, body) => dispatch(op, body),
    get: (line) => {
      const params = new URLSearchParams(line);
      const op = params.get('op');
      if (!op) throw new Error('door: request line without op');
      if (CHANGING.includes(op)) throw new Error(`door: a request line cannot call ${op}, which changes something`);
      /** @type {Record<string, string>} */
      const body = {};
      for (const [k, v] of params) if (k !== 'op') body[k] = v;
      return dispatch(op, body);
    },
  };
}
