import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from '../../store/src/index.mjs';
import { createRooms, roomHandlers, ROOM_KINDS } from '../src/index.mjs';

const fresh = () => createRooms({ store: createStore() });

test('add then find hands back the room under its slug', () => {
  const rooms = fresh();
  const r = rooms.add({ name: 'Main Hall', kind: 'hall', seats: 120 });
  assert.match(r.id, /^[a-z0-9]+(-[a-z0-9]+)*$/);
  assert.deepEqual(rooms.find(r.id), r);
  assert.equal(rooms.find('nowhere'), undefined);
});

test('bound seats: whole number, 1 to 500', () => {
  const rooms = fresh();
  assert.equal(rooms.add({ name: 'One', kind: 'studio', seats: 1 }).seats, 1);
  assert.equal(rooms.add({ name: 'Many', kind: 'hall', seats: 500 }).seats, 500);
  assert.throws(() => rooms.add({ name: 'None', kind: 'hall', seats: 0 }), RangeError);
  assert.throws(() => rooms.add({ name: 'Too', kind: 'hall', seats: 501 }), RangeError);
  assert.throws(() => rooms.add({ name: 'Half', kind: 'hall', seats: 2.5 }), RangeError);
});

test('add refuses an unknown kind and a taken name', () => {
  const rooms = fresh();
  rooms.add({ name: 'Studio A', kind: 'studio', seats: 10 });
  assert.throws(() => rooms.add({ name: 'Studio A', kind: 'studio', seats: 10 }));
  assert.throws(() => rooms.add({ name: 'Pool', kind: /** @type {any} */ ('pool'), seats: 10 }), RangeError);
});

test('the rooms table keeps the seats under capacity', () => {
  const store = createStore();
  const rooms = createRooms({ store });
  rooms.add({ name: 'Hall', kind: 'hall', seats: 80 });
  assert.deepEqual(store.get('rooms', 'hall')?.value, { id: 'hall', name: 'Hall', kind: 'hall', capacity: 80 });
  assert.equal(rooms.find('hall')?.seats, 80);
});

test('list filters by kind and keeps name order', () => {
  const rooms = fresh();
  rooms.add({ name: 'B Hall', kind: 'hall', seats: 50 });
  rooms.add({ name: 'A Hall', kind: 'hall', seats: 50 });
  rooms.add({ name: 'Kitchen', kind: 'kitchen', seats: 8 });
  assert.deepEqual(rooms.list('hall').map((r) => r.name), ['A Hall', 'B Hall']);
  assert.equal(rooms.list().length, 3);
  for (const r of rooms.list()) assert.ok(ROOM_KINDS.includes(r.kind));
});

test('roomlist operation answers with the rooms of a kind', () => {
  const rooms = fresh();
  rooms.add({ name: 'Kitchen', kind: 'kitchen', seats: 8 });
  rooms.add({ name: 'Hall', kind: 'hall', seats: 80 });
  const h = roomHandlers(rooms);
  assert.deepEqual(h.roomlist({ kind: 'kitchen' }).rooms.map((r) => r.kind), ['kitchen']);
  assert.equal(h.roomlist({}).rooms.length, 2);
});
