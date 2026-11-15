/**
 * The edges of money's bounds, kept in one place for its tests: the lowest and the highest value each bound allows.
 * @param {'cents' | 'parts'} bound
 * @returns {{lowest: number, highest: number}}
 */
export function edgesOf(bound) {
  if (bound === 'cents') return { lowest: 0, highest: 500_000 };
  return { lowest: 1, highest: 100 };
}
