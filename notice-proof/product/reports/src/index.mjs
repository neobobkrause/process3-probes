/**
 * Counts of bookings for the people who run the halls.
 */
import { ROOM_KINDS } from '../../rooms/src/index.mjs';
import { parseDay, weekday } from '../../calendar/src/index.mjs';

/**
 * Counts bookings by state, by kind of room and by weekday of the first night.
 * @param {*} source anything with a list(table) method; normally the store
 * @returns {{byState: Record<string, number>, byKind: Record<string, number>, byWeekday: Record<string, number>}}
 */
export function summarize(source) {
  const roomKind = new Map(source.list('rooms').map((r) => [r.id, r.value.kind]));
  /** @type {Record<string, number>} */
  const byState = {};
  /** @type {Record<string, number>} */
  const byKind = Object.fromEntries(ROOM_KINDS.map((k) => [k, 0]));
  /** @type {Record<string, number>} */
  const byWeekday = {};
  for (const rec of source.list('bookings')) {
    const b = rec.value;
    byState[b.state] = (byState[b.state] ?? 0) + 1;
    const kind = roomKind.get(b.room) ?? 'unknown';
    byKind[kind] = (byKind[kind] ?? 0) + 1;
    const day = weekday(parseDay(b.day));
    byWeekday[day] = (byWeekday[day] ?? 0) + 1;
  }
  return { byState, byKind, byWeekday };
}
