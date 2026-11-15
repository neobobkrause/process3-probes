import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from '../../store/src/index.mjs';
import { createRooms } from '../../rooms/src/index.mjs';
import { createBookings } from '../../bookings/src/index.mjs';
import { summarize } from '../src/index.mjs';
/** @import { NewRoom } from '../../rooms/src/index.mjs' */

test('summary counts real bookings by state, kind and weekday', () => {
  const store = createStore();
  const rooms = createRooms({ store });
  /** @type {NewRoom[]} */
  const toAdd = [
    { name: 'Hall', kind: 'hall', seats: 100 },
    { name: 'Kitchen', kind: 'kitchen', seats: 8 },
  ];
  toAdd.forEach(rooms.add);
  const bookings = createBookings({ store, rooms });
  bookings.open({ room: 'hall', day: '2026-11-16', nights: 1, party: 5 });
  bookings.open({ room: 'hall', day: '2026-11-17', nights: 1, party: 5 });
  const k = bookings.open({ room: 'kitchen', day: '2026-11-16', nights: 1, party: 2 });
  bookings.cancel(k.id);
  const s = summarize(store);
  assert.deepEqual(s.byState, { open: 2, cancelled: 1 });
  assert.equal(s.byKind.hall, 2);
  assert.equal(s.byKind.kitchen, 1);
  assert.equal(s.byKind.studio, 0);
  assert.equal(Object.values(s.byWeekday).reduce((a, b) => a + b, 0), 3);
  assert.equal(Object.keys(s.byWeekday).length, 2);
});

test('an empty store gives zero counts', () => {
  const s = summarize(createStore());
  assert.deepEqual(s.byState, {});
  assert.ok(Object.values(s.byKind).every((n) => n === 0));
});
