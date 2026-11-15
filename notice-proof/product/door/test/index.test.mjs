import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDoor } from '../src/index.mjs';

/**
 * Handlers that hand back what they were handed, so that what is tested is the door itself.
 * @type {any}
 */
const echo = {
  roomlist: (/** @type {unknown} */ req) => ({ rooms: [], seen: req }),
  bookstatus: (/** @type {unknown} */ req) => ({ seen: req }),
  bookquote: (/** @type {unknown} */ req) => ({ seen: req }),
};

/**
 * The door seen loosely, as a caller that does not know the table would see it.
 * @typedef {{call: (op: string, body: unknown) => Promise<{seen?: unknown}>, get: (line: string) => Promise<{seen?: unknown}>}} LooseDoor
 */
const loose = (/** @type {unknown} */ door) => /** @type {LooseDoor} */ (door);

test('call carries the body to the named operation and hands back a copy', async () => {
  const door = loose(createDoor(echo));
  const r = await door.call('roomlist', { kind: 'hall' });
  assert.deepEqual(r.seen, { kind: 'hall' });
});

test('get reads a request line; every value arrives as text', async () => {
  const door = loose(createDoor(echo));
  const r = await door.get('op=bookquote&room=hall&party=12&nights=3');
  assert.deepEqual(r.seen, { room: 'hall', party: '12', nights: '3' });
});

test('an unknown operation is refused', async () => {
  const door = loose(createDoor(echo));
  await assert.rejects(() => door.call('nosuch', {}), /unknown operation/);
  assert.throws(() => door.get('room=hall'), /without op/);
});
