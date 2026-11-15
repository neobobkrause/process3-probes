/**
 * Helpers that the store publishes for other modules' tests.
 */
import { createStore } from './index.mjs';

/**
 * @carriestable keys
 * Makes a store already holding the given records, each written once, in the order given.
 * @param {Array<{table: string, id: string, value: unknown}>} rows the records to put
 * @returns {import('./index.mjs').Store}
 */
export function seededStore(rows) {
  const store = createStore();
  for (const row of rows) store.put(row.table, row.id, row.value);
  return store;
}
