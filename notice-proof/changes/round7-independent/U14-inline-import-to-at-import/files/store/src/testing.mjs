/**
 * Helpers that the store publishes for other modules' tests.
 */
import { createStore } from './index.mjs';
/** @import { Store } from './index.mjs' */

/**
 * @carriestable keys
 * Makes a store already holding the given records, each written once.
 * @param {Object<string, Array<{id: string, value: unknown}>>} tables the records to put, by table name
 * @returns {Store}
 */
export function seededStore(tables) {
  const store = createStore();
  for (const [table, rows] of Object.entries(tables)) {
    for (const row of rows) store.put(table, row.id, row.value);
  }
  return store;
}
