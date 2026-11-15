import { test } from 'node:test';
import assert from 'node:assert/strict';
import { seededStore } from '../../store/src/testing.mjs';
import { createRooms, roomHandlers } from '../../rooms/src/index.mjs';
import { createBookings, bookingHandlers } from '../../bookings/src/index.mjs';
import { createDoor } from '../../door/src/index.mjs';
import { createFront } from '../src/index.mjs';

function system() {
  const store = seededStore({
    rooms: [
      { id: 'big-hall', value: { id: 'big-hall', name: 'Big Hall', kind: 'hall', seats: 300 } },
      { id: 'kitchen', value: { id: 'kitchen', name: 'Kitchen', kind: 'kitchen', seats: 8 } },
    ],
  });
  const rooms = createRooms({ store });
  // A fixed time, so that what the tests see does not depend on the day they run.
  const clock = { now: () => '2026-11-15T09:30:00.000Z' };
  const bookings = createBookings({ store, rooms, clock });
  return createFront({ door: createDoor({ ...bookingHandlers(bookings), ...roomHandlers(rooms) }) });
}

test('booking with a valid form says what was booked', async () => {
  const front = system();
  const r = await front.book({ email: 'ann@example.org', room: 'big-hall', day: '2026-12-05', nights: 2, party: 150 });
  assert.match(r.id, /\S/);
  assert.ok(r.text.includes('big-hall'));
  assert.ok(r.text.includes('150'));
  assert.match(r.text, /\d+\.\d\d/);
});

test('booking needs a valid email', async () => {
  const front = system();
  await assert.rejects(() => front.book({ email: 'nope', room: 'big-hall', day: '2026-12-05', nights: 1, party: 2 }), RangeError);
});

test('a booking outside the bounds is refused', async () => {
  const front = system();
  await assert.rejects(() => front.book({ email: 'a@b.cd', room: 'kitchen', day: '2026-12-05', nights: 1, party: 9 }));
});

test('cancel names the cancelled booking', async () => {
  const front = system();
  const { id } = await front.book({ email: 'a@b.cd', room: 'kitchen', day: '2026-12-05', nights: 1, party: 2, note: 'baking' });
  assert.ok((await front.cancel(id)).includes(id));
});

test('the kinds menu has one line per kind, each starting with a capital', () => {
  const menu = system().kindsMenu();
  assert.ok(menu.length >= 1);
  for (const line of menu) assert.match(line, /^[A-Z]/);
});

test('the room menu lists rooms with their seats', async () => {
  const front = system();
  const all = await front.roomMenu();
  assert.equal(all.length, 2);
  const kitchens = await front.roomMenu('kitchen');
  assert.equal(kitchens.length, 1);
  assert.match(kitchens[0], /8 seats/);
});
