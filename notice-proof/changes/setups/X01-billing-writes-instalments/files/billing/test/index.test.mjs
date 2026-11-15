import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from '../../store/src/index.mjs';
import { createRooms, roomHandlers } from '../../rooms/src/index.mjs';
import { createBookings, bookingHandlers } from '../../bookings/src/index.mjs';
import { createDoor } from '../../door/src/index.mjs';
import { createBilling } from '../src/index.mjs';

function system() {
  const store = createStore();
  const rooms = createRooms({ store });
  rooms.add({ name: 'Hall', kind: 'hall', seats: 300 });
  const bookings = createBookings({ store, rooms });
  const door = createDoor({ ...bookingHandlers(bookings), ...roomHandlers(rooms) });
  return { bookings, billing: createBilling({ door }) };
}

test('an invoice splits the booking total into instalments that add up to it', async () => {
  const { bookings, billing } = system();
  const b = bookings.open({ room: 'hall', day: '2026-12-01', nights: 3, party: 7 });
  const inv = await billing.invoice(b.id, 3);
  assert.equal(inv.booking, b.id);
  assert.equal(inv.total.cents, b.total.cents);
  assert.equal(inv.instalments.length, 3);
  assert.equal(inv.instalments.reduce((s, p) => s + p.cents, 0), inv.total.cents);
  assert.ok(inv.text.includes(b.id));
  const written = inv.text.split(': ').slice(-1)[0].split(' + ');
  assert.equal(written.length, inv.instalments.length);
  for (const w of written) assert.match(w, /^[A-Z]{3} \d+\.\d\d$/);
});

test('an invoice for a cancelled booking is refused', async () => {
  const { bookings, billing } = system();
  const b = bookings.open({ room: 'hall', day: '2026-12-01', nights: 1, party: 2 });
  bookings.cancel(b.id);
  await assert.rejects(() => billing.invoice(b.id, 1), /not open/);
});

test('an estimate is what the booking then costs, with a deposit of a fifth', async () => {
  const { bookings, billing } = system();
  const est = await billing.estimate('hall', 6, 4);
  const b = bookings.open({ room: 'hall', day: '2026-12-01', nights: 4, party: 6 });
  assert.equal(est.total.cents, b.total.cents);
  assert.equal(est.deposit.cents, Math.floor(b.total.cents / 5));
  assert.equal(est.deposit.currency, b.total.currency);
});

test('metered use is priced by the meter and added up', async () => {
  const { billing } = system();
  const one = await billing.meterUsage([{ kind: 'use', room: 'hall', minutes: 10 }]);
  const two = await billing.meterUsage([
    { kind: 'use', room: 'hall', minutes: 10 },
    { kind: 'use', room: 'hall', minutes: 20 },
  ]);
  assert.ok(one.cents > 0);
  assert.equal(two.cents, one.cents * 3);
});

test('metered use outside the meter\'s bound is refused', async () => {
  const { billing } = system();
  await assert.rejects(() => billing.meterUsage([{ kind: 'use', room: 'hall', minutes: 2000 }]), RangeError);
});
