import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from '../../store/src/index.mjs';
import { createRooms } from '../../rooms/src/index.mjs';
import { createBookings, bookingHandlers } from '../src/index.mjs';

function system() {
  const store = createStore();
  const rooms = createRooms({ store });
  rooms.add({ name: 'Hall', kind: 'hall', seats: 300 });
  rooms.add({ name: 'Studio', kind: 'studio', seats: 12 });
  return { store, rooms, bookings: createBookings({ store, rooms }) };
}
const req = (/** @type {Partial<import('../src/index.mjs').BookingRequest>} */ over = {}) => ({
  room: 'hall', day: '2026-12-01', nights: 2, party: 10, ...over,
});

test('open hands back an open booking that find returns', () => {
  const { bookings } = system();
  const b = bookings.open(req({ note: 'choir' }));
  assert.equal(b.state, 'open');
  assert.equal(b.until, '2026-12-03');
  assert.equal(b.note, 'choir');
  assert.deepEqual(bookings.find(b.id), b);
});

test('the total grows with party and nights and is in whole cents', () => {
  const { bookings } = system();
  const small = bookings.quote('hall', 10, 1);
  const big = bookings.quote('hall', 20, 2);
  assert.ok(Number.isInteger(small.cents) && small.cents > 0);
  assert.equal(big.cents, small.cents * 4);
  assert.equal(bookings.open(req({ party: 10, nights: 1 })).total.cents, small.cents);
});

test('bound party: whole number, 1 to 200, and no more than the room\'s seats', () => {
  const { bookings } = system();
  assert.equal(bookings.open(req({ party: 1 })).party, 1);
  assert.equal(bookings.open(req({ party: 200 })).party, 200);
  assert.equal(bookings.open(req({ room: 'studio', party: 12 })).party, 12);
  assert.throws(() => bookings.open(req({ party: 0 })), RangeError);
  assert.throws(() => bookings.open(req({ party: 201 })), RangeError);
  assert.throws(() => bookings.open(req({ room: 'studio', party: 13 })), RangeError);
});

test('bound nights: whole number, 1 to 14', () => {
  const { bookings } = system();
  assert.equal(bookings.open(req({ nights: 1 })).nights, 1);
  assert.equal(bookings.open(req({ nights: 14 })).nights, 14);
  assert.throws(() => bookings.open(req({ nights: 0 })), RangeError);
  assert.throws(() => bookings.open(req({ nights: 15 })), RangeError);
});

test('bound day: a real calendar day written YYYY-MM-DD', () => {
  const { bookings } = system();
  assert.equal(bookings.open(req({ day: '2028-02-29' })).day, '2028-02-29');
  assert.throws(() => bookings.open(req({ day: '2027-02-29' })), RangeError);
  assert.throws(() => bookings.open(req({ day: 'tomorrow' })), RangeError);
});

test('takings add up the open bookings of each room', () => {
  const { bookings } = system();
  const a = bookings.open(req({ party: 2, nights: 1 }));
  const b = bookings.open(req({ party: 3, nights: 1 }));
  const c = bookings.open(req({ room: 'studio', party: 1, nights: 1 }));
  bookings.cancel(c.id);
  const t = bookings.takings();
  assert.equal(t.hall.cents, a.total.cents + b.total.cents);
  assert.equal(t.studio, undefined);
});

test('cancel closes an open booking once; unknown rooms and bookings are refused', () => {
  const { bookings } = system();
  const b = bookings.open(req());
  assert.equal(bookings.cancel(b.id).state, 'cancelled');
  assert.throws(() => bookings.cancel(b.id));
  assert.throws(() => bookings.cancel('b-999'), RangeError);
  assert.throws(() => bookings.open(req({ room: 'attic' })), RangeError);
});

test('bound bookquote.total: what the whole stay costs, for the whole party and every night', () => {
  const { bookings } = system();
  const h = bookingHandlers(bookings);
  const b = h.bookopen(req({ party: 4, nights: 3 }));
  assert.equal(h.bookquote({ room: 'hall', party: 4, nights: 3 }).total.cents, b.total.cents);
});

test('operations answer as the table says', () => {
  const { bookings } = system();
  const h = bookingHandlers(bookings);
  const b = h.bookopen(req());
  assert.deepEqual(h.bookstatus({ id: b.id }), { state: 'open', total: b.total, room: 'hall' });
  assert.deepEqual(h.bookquote({ room: 'hall', party: 10, nights: 2 }).total, b.total);
  assert.equal(h.bookcancel({ id: b.id }).state, 'cancelled');
  assert.throws(() => h.bookstatus({ id: 'b-999' }), RangeError);
});
