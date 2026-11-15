/**
 * A small in-memory store of records kept in named tables. Values are copied in and out,
 * so a caller never holds the store's own copy.
 */

/**
 * One record as the store hands it back.
 * @typedef {Object} Stored
 * @property {string} id
 * @property {number} version how many times the record has been written, starting at 1
 * @property {unknown} value a copy of what was put
 * @bound version: whole number, 1 or more
 */

/**
 * The store's handle.
 * @typedef {Object} Store
 * @property {(table: string, id: string, value: unknown) => Stored} put writes a record and hands back what is now held
 * @property {(table: string, id: string) => Stored | undefined} get
 * @property {(table: string) => Stored[]} list all records of a table, in the order they were first written
 * @property {(table: string, id: string) => boolean} remove says whether there was a record to remove
 * @bound table: 1 to 40 characters, each a-z, 0-9 or a hyphen
 * @bound id: 1 to 120 characters
 */

const TABLE = /^[a-z0-9-]{1,40}$/;

/**
 * Refuses a table name or id outside its bound.
 * @param {string} table
 * @param {string} [id]
 */
function checkNames(table, id) {
  if (typeof table !== 'string' || !TABLE.test(table)) throw new RangeError(`store: bad table name: ${table}`);
  if (id !== undefined && (typeof id !== 'string' || id.length < 1 || id.length > 120)) {
    throw new RangeError('store: id must be 1 to 120 characters');
  }
}

/**
 * Makes an empty store.
 * @returns {Store}
 */
export function createStore() {
  /** @type {Map<string, Map<string, Stored>>} */
  const tables = new Map();
  /** @param {string} table */
  const tableOf = (table) => {
    let t = tables.get(table);
    if (!t) {
      t = new Map();
      tables.set(table, t);
    }
    return t;
  };
  return {
    put(table, id, value) {
      checkNames(table, id);
      const t = tableOf(table);
      const old = t.get(id);
      /** @type {Stored} builds a Stored */
      const rec = { id, version: old ? old.version + 1 : 1, value: structuredClone(value) };
      t.set(id, rec);
      return structuredClone(rec);
    },
    get(table, id) {
      checkNames(table, id);
      const rec = tableOf(table).get(id);
      return rec ? structuredClone(rec) : undefined;
    },
    list(table) {
      checkNames(table);
      return [...tableOf(table).values()].map((r) => structuredClone(r));
    },
    remove(table, id) {
      checkNames(table, id);
      return tableOf(table).delete(id);
    },
  };
}
