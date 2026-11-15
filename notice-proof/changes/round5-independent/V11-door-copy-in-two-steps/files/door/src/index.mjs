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
 * @property {<K extends keyof AllOps>(line: `op=${K}&${string}`) => Promise<AllOps[K]['res']>} get calls an operation written as a request line, op=name&field=value; every value arrives as text
 * @carriesop call get
 * @throws {RangeError} when an answer is larger than the door carries, MAX_ANSWER characters of JSON
 */

/** The most a door carries in one answer, in characters of JSON: what one message of a connection holds. */
const MAX_ANSWER = 65536;

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
    const answer = JSON.stringify(h(JSON.parse(JSON.stringify(body))));
    if (answer.length > MAX_ANSWER) throw new RangeError(`door: the answer to ${op} is larger than ${MAX_ANSWER} characters`);
    return JSON.parse(answer);
  };
  return {
    call: (op, body) => dispatch(op, body),
    get: (line) => {
      const params = new URLSearchParams(line);
      const op = params.get('op');
      if (!op) throw new Error('door: request line without op');
      /** @type {Record<string, string>} */
      const body = {};
      for (const [k, v] of params) if (k !== 'op') body[k] = v;
      return dispatch(op, body);
    },
  };
}
