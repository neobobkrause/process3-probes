# The independent adversary's series. Each change is one commit's worth of edits to one provider (and that
# provider's own tests where its job would). Setups (series 'setups', ids X..-...) put the product in a state that
# both before and after share: a user written in a certain way. Read by changes/make.py.
S = 'adversarial-independent'
TR, MO, CA, ST, RO, BO, ME = ('text-rules/src/index.mjs', 'money/src/index.mjs', 'calendar/src/index.mjs',
                              'store/src/index.mjs', 'rooms/src/index.mjs', 'bookings/src/index.mjs', 'meter/src/index.mjs')
MOT, STT, ROT, BOT, MET = ('money/test/index.test.mjs', 'store/test/index.test.mjs', 'rooms/test/index.test.mjs',
                           'bookings/test/index.test.mjs', 'meter/test/index.test.mjs')
MEW = 'meter/src/worker.mjs'
BI, BIT, FRT = 'billing/src/index.mjs', 'billing/test/index.test.mjs', 'front/test/index.test.mjs'

# ---------------------------------------------------------------------------------------------------------------
# X01: an optional parameter is "accepting more"; but a user that hands the function to map() already passes a
# second argument (the index), which now means something.

change('setups', 'X01-billing-writes-instalments', "Billing's invoice text lists each instalment", 'billing',
       ['a user that hands a provider function to Array.prototype.map (the standing state)'],
       {BI: [("text: `Invoice for ${bookingId} (${status.room}): ${formatAmount(status.total)} in ${parts.length} payment(s)`,",
              "text: `Invoice for ${bookingId} (${status.room}): ${formatAmount(status.total)} in ${parts.length} payment(s): ${parts.map(formatAmount).join(' + ')}`,")],
        BIT: [("  assert.ok(inv.text.includes(b.id));\n",
               "  assert.ok(inv.text.includes(b.id));\n"
               "  const written = inv.text.split(': ').slice(-1)[0].split(' + ');\n"
               "  assert.equal(written.length, inv.instalments.length);\n"
               r"  for (const w of written) assert.match(w, /^[A-Z]{3} \d+\.\d\d$/);" "\n")]})

change(S, 'X01-optional-param-callback', 'formatAmount takes an optional number of digits after the point', 'money',
       ['optional parameter added (accepts more)', 'user passes the function as a callback to map'],
       {MO: [(""" * Writes an amount for people to read.
 * @param {Amount} a
 * @returns {string}
 */
export function formatAmount(a) {
  return `${a.currency} ${(a.cents / 100).toFixed(2)}`;
}""", """ * Writes an amount for people to read.
 * @param {Amount} a
 * @param {0 | 1 | 2} [decimals] how many digits to show after the point; 2 when left out
 * @returns {string}
 */
export function formatAmount(a, decimals = 2) {
  return `${a.currency} ${(a.cents / 100).toFixed(decimals)}`;
}""")],
        MOT: [("test('bound parts: whole number, 1 to 100', () => {", r"""test('formatAmount shows as many digits after the point as asked, two when not asked', () => {
  assert.match(formatAmount(amount(1240, 'EUR'), 0), /^EUR 12$/);
  assert.match(formatAmount(amount(1240, 'EUR'), 1), /^EUR 12\.4$/);
  assert.match(formatAmount(amount(1240, 'EUR')), /^EUR 12\.40$/);
});

test('bound parts: whole number, 1 to 100', () => {""")]},
       before=['setups/X01-billing-writes-instalments'],
       note="Before the change billing writes parts.map(formatAmount): map hands formatAmount (amount, index, list). The extra arguments were ignored; now the index is the number of decimals.")

# ---------------------------------------------------------------------------------------------------------------
# X02: an opaque id's content changes; its kind (string) and every comment stay true. The door's request-line rule
# ("a value of digits only arrives as a number") turns the new ids into numbers on the way to bookstatus.

change(S, 'X02-opaque-id-digits', 'Booking ids become plain numbers written as text, easier to read out over the phone', 'bookings',
       ['content of an opaque value changes; kind and comments unchanged', 'door request line coerces digits to numbers'],
       {BO: [(" * @property {string} id\n * @property {string} room",
              " * @property {string} id an opaque reference to the booking; read nothing into its form\n * @property {string} room"),
             ("id: `b-${next++}`,", "id: String(next++),")]},
       note="The job reads 'id' as opaque (no bound line before or after). billing passes the id through door.get('op=bookstatus&id=...').")

# ---------------------------------------------------------------------------------------------------------------
# X03: a provider kind the USER implements (a port). The user writes an object that fits it without naming it, so
# the tool never records the use. The port's bound line changes.

change('setups', 'X03a-bookings-clock', 'Bookings takes an optional clock and stamps each booking with the time it was opened', 'bookings',
       ['provider defines a kind that users implement (a port)'],
       {BO: [(" * @property {string} [note]\n * @bound day: a real calendar day written YYYY-MM-DD",
              " * @property {string} [note]\n * @property {string} created when the booking was opened, as the clock gave it\n * @bound day: a real calendar day written YYYY-MM-DD"),
             ("""/**
 * The bookings' handle.""", """/**
 * Where bookings learns the time. Handed in, so that tests can fix it.
 * @typedef {Object} Clock
 * @property {() => string} now the time now
 * @bound now: an ISO date and time, such as 2026-11-15T09:30:00.000Z
 */

/**
 * The bookings' handle."""),
             ("""/**
 * Makes the bookings' handle.
 * @param {{store: Store, rooms: Rooms}} deps""", """/** @type {Clock} the clock bookings uses when none is handed in */
const SYSTEM_CLOCK = { now: () => new Date().toISOString() };

/**
 * Makes the bookings' handle.
 * @param {{store: Store, rooms: Rooms, clock?: Clock}} deps"""),
             ("  const { store, rooms } = deps;\n", "  const { store, rooms, clock = SYSTEM_CLOCK } = deps;\n"),
             ("""      const first = parseDay(req.day);
      const total = quote(req.room, req.party, req.nights);""", """      const first = parseDay(req.day);
      const created = clock.now();
      if (Number.isNaN(Date.parse(created)) || !created.includes('T')) throw new RangeError('bookings: the clock is outside its bound');
      const total = quote(req.room, req.party, req.nights);"""),
             ("        state: 'open',\n        total,\n      };", "        state: 'open',\n        total,\n        created,\n      };")],
        BOT: [("test('cancel closes an open booking once", """test('bound now: an ISO date and time, such as 2026-11-15T09:30:00.000Z', () => {
  const { store, rooms } = system();
  const fixed = createBookings({ store, rooms, clock: { now: () => '2026-11-15T09:30:00.000Z' } });
  assert.equal(fixed.open(req()).created, '2026-11-15T09:30:00.000Z');
  const wrong = createBookings({ store, rooms, clock: { now: () => 'soon' } });
  assert.throws(() => wrong.open(req()), RangeError);
});

test('cancel closes an open booking once""")]})

change('setups', 'X03b-front-fixed-clock', "Front's tests hand bookings a fixed clock", 'front',
       ['user implements a provider kind without naming it (the standing state)'],
       {FRT: [("  const rooms = createRooms({ store });\n  const bookings = createBookings({ store, rooms });\n",
               "  const rooms = createRooms({ store });\n"
               "  // A fixed time, so that what the tests see does not depend on the day they run.\n"
               "  const clock = { now: () => '2026-11-15T09:30:00.000Z' };\n"
               "  const bookings = createBookings({ store, rooms, clock });\n")]})

change(S, 'X03-port-bound-changed', "The clock bookings is handed now gives today's date, YYYY-MM-DD, and bookings keeps only the day", 'bookings',
       ['bound line of a kind the user implements changes', 'use of a provider kind that the user never names'],
       {BO: [(" * @property {() => string} now the time now\n * @bound now: an ISO date and time, such as 2026-11-15T09:30:00.000Z",
              " * @property {() => string} now today's date\n * @bound now: today's date, written YYYY-MM-DD"),
             (" * @property {string} created when the booking was opened, as the clock gave it",
              " * @property {string} created the day the booking was opened, as the clock gave it"),
             ("const SYSTEM_CLOCK = { now: () => new Date().toISOString() };", "const SYSTEM_CLOCK = { now: () => new Date().toISOString().slice(0, 10) };"),
             ("""      const created = clock.now();
      if (Number.isNaN(Date.parse(created)) || !created.includes('T')) throw new RangeError('bookings: the clock is outside its bound');
""", """      const created = formatDay(parseDay(clock.now()));
""")],
        BOT: [("""test('bound now: an ISO date and time, such as 2026-11-15T09:30:00.000Z', () => {
  const { store, rooms } = system();
  const fixed = createBookings({ store, rooms, clock: { now: () => '2026-11-15T09:30:00.000Z' } });
  assert.equal(fixed.open(req()).created, '2026-11-15T09:30:00.000Z');
  const wrong = createBookings({ store, rooms, clock: { now: () => 'soon' } });""", """test('bound now: today\\'s date, written YYYY-MM-DD', () => {
  const { store, rooms } = system();
  const fixed = createBookings({ store, rooms, clock: { now: () => '2026-11-15' } });
  assert.equal(fixed.open(req()).created, '2026-11-15');
  const wrong = createBookings({ store, rooms, clock: { now: () => '2026-11-15T09:30:00.000Z' } });""")]},
       before=['setups/X03a-bookings-clock', 'setups/X03b-front-fixed-clock'])

# ---------------------------------------------------------------------------------------------------------------
# X04: honest code the reader types too narrowly: includes() on a list of literal names, asked about any text.

change(S, 'X04-includes-on-literal-list', 'rooms gains isRoomKind, and add uses it', 'rooms',
       ['new entry', 'honest code that the reader types too narrowly (includes on a constant list)'],
       {RO: [("/** @typedef {typeof ROOM_KINDS[number]} RoomKind */\n", """/** @typedef {typeof ROOM_KINDS[number]} RoomKind */

/**
 * Says whether a text names a kind of room.
 * @param {string} text
 * @returns {text is RoomKind}
 */
export function isRoomKind(text) {
  return ROOM_KINDS.includes(text);
}
"""),
             ("if (!ROOM_KINDS.includes(input.kind)) throw", "if (!isRoomKind(input.kind)) throw")],
        ROT: [("import { createRooms, roomHandlers, ROOM_KINDS } from '../src/index.mjs';",
               "import { createRooms, roomHandlers, ROOM_KINDS, isRoomKind } from '../src/index.mjs';"),
              ("test('roomlist operation answers with the rooms of a kind'", """test('isRoomKind says which texts name a kind of room', () => {
  for (const k of ROOM_KINDS) assert.equal(isRoomKind(k), true);
  assert.equal(isRoomKind('pool'), false);
  assert.equal(isRoomKind(''), false);
});

test('roomlist operation answers with the rooms of a kind'""")]})

# ---------------------------------------------------------------------------------------------------------------
# X05: store's put can refuse a stale write. Honest code the reader cannot follow (Map.has then get; assert.ok then
# use), and a kind that was only handed back is now also accepted.

change(S, 'X05-stale-write', "store's put can be handed the record as it was read, and refuses the write if it has changed since", 'store',
       ['honest code the reader cannot follow (Map.has then get, assert.ok then use)', 'kind handed back now also accepted'],
       {ST: [(' * @property {(table: string, id: string, value: unknown) => Stored} put writes a record and hands back what is now held',
              ' * @property {(table: string, id: string, value: unknown, expected?: Stored) => Stored} put writes a record and hands back what is now held; when handed the record as it was read, refuses the write if the record has changed since'),
             ("""    put(table, id, value) {
      checkNames(table, id);
      const t = tableOf(table);
      const old = t.get(id);""", """    put(table, id, value, expected) {
      checkNames(table, id);
      const t = tableOf(table);
      if (expected !== undefined && (!t.has(id) || t.get(id).version !== expected.version)) {
        throw new Error(`store: ${table}/${id} has changed since it was read`);
      }
      const old = t.get(id);""")],
        STT: [("test('list keeps first-written order", """test('put handed the record as it was read refuses a write when the record has changed since', () => {
  const s = createStore();
  s.put('t', 'x', { n: 1 });
  const read = s.get('t', 'x');
  assert.ok(read);
  assert.equal(read.version, 1);
  s.put('t', 'x', { n: 2 }, read);
  assert.throws(() => s.put('t', 'x', { n: 3 }, read), /changed since/);
  assert.throws(() => s.put('t', 'y', { n: 1 }, read), /changed since/);
});

test('list keeps first-written order""")]})

# ---------------------------------------------------------------------------------------------------------------
# X06: a bound line is reworded; it means exactly what it meant.

change(S, 'X06-bound-reworded', "Amount's bound line is reworded; it means the same", 'money',
       ['bound line reworded with the same meaning'],
       {MO: [(' * @bound cents: whole number, 0 to 10,000,000 inclusive', ' * @bound cents: a whole number from 0 to 10,000,000, both ends included')],
        MOT: [("test('bound cents: whole number, 0 to 10,000,000 inclusive'", "test('bound cents: a whole number from 0 to 10,000,000, both ends included'")]})

# ---------------------------------------------------------------------------------------------------------------
# X07: a list gains a name; a user keeps a lookup table with one entry per name. The reader reports the gap under a
# code the check counts as "cannot tell".

change('setups', 'X07-bookings-price-by-kind', 'Bookings prices a seat by the kind of room', 'bookings',
       ['user keeps a lookup table with one entry per name of a provider list (the standing state)'],
       {BO: [("""/** The price of one seat for one night, in euro cents. */
export const PRICE_PER_SEAT_NIGHT = 1500;""", """/** The price of one seat for one night in a hall, in euro cents. */
export const PRICE_PER_SEAT_NIGHT = 1500;

/** What one seat for one night costs in each kind of room, in euro cents. */
const PRICE_BY_KIND = { hall: PRICE_PER_SEAT_NIGHT, studio: 1800, kitchen: 1200 };"""),
             ("return amount(PRICE_PER_SEAT_NIGHT * party * nights, 'EUR');", "return amount(PRICE_BY_KIND[room.kind] * party * nights, 'EUR');")]})

change(S, 'X07-list-gains-name-lookup-table', 'A new kind of room: garden (a user keeps a price for each kind)', 'rooms',
       ['list gains a name', 'user indexes its own table by the provider\'s kind'],
       {RO: [("(['hall', 'studio', 'kitchen'])", "(['hall', 'studio', 'kitchen', 'garden'])")],
        ROT: [("test('list filters by kind and keeps name order'", """test('a garden can be added like any other room', () => {
  const rooms = fresh();
  assert.equal(rooms.add({ name: 'Rose Garden', kind: 'garden', seats: 40 }).kind, 'garden');
});

test('list filters by kind and keeps name order'""")]},
       before=['setups/X07-bookings-price-by-kind'])

# ---------------------------------------------------------------------------------------------------------------
# X08: a brand-new operation "has no users"; but the door gathers every table into one namespace, and the new name
# is one that another provider already answers.

change(S, 'X08-new-op-name-clash', 'rooms answers bookstatus: whether a room can be booked, and its seats', 'rooms',
       ['new operation (a name gained)', 'name already answered by another provider through the same door'],
       {RO: [(""" *   roomlist: {req: {kind?: RoomKind}, res: {rooms: Room[]}}
 * }} RoomOps
 * @optable
 */""", """ *   roomlist: {req: {kind?: RoomKind}, res: {rooms: Room[]}},
 *   bookstatus: {req: {id: string}, res: {bookable: boolean, seats: number}}
 * }} RoomOps
 * @optable
 * @bound bookstatus.seats: whole number, 0 to 500, and 0 when bookable is false
 */"""),
             ("    roomlist: (req) => ({ rooms: rooms.list(req.kind) }),\n", """    roomlist: (req) => ({ rooms: rooms.list(req.kind) }),
    bookstatus: (req) => {
      const room = rooms.find(req.id);
      return room ? { bookable: true, seats: room.seats } : { bookable: false, seats: 0 };
    },
""")],
        ROT: [("test('roomlist operation answers with the rooms of a kind'", """test('bound bookstatus.seats: whole number, 0 to 500, and 0 when bookable is false', () => {
  const rooms = fresh();
  rooms.add({ name: 'Hall', kind: 'hall', seats: 80 });
  const h = roomHandlers(rooms);
  assert.deepEqual(h.bookstatus({ id: 'hall' }), { bookable: true, seats: 80 });
  assert.deepEqual(h.bookstatus({ id: 'attic' }), { bookable: false, seats: 0 });
});

test('roomlist operation answers with the rooms of a kind'""")]},
       note="The door is built as {...bookingHandlers(bookings), ...roomHandlers(rooms)}: rooms' handler of the same name wins.")

# ---------------------------------------------------------------------------------------------------------------
# X09: the shared kind of each message is unchanged; which channel a message travels on is not part of any kind.

METER_TEST = r"""import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { WORKER_FILE } from '../src/index.mjs';
/** @import { MeterMsg } from '../src/index.mjs' */

/**
 * The messages in what one output of the meter wrote.
 * @param {string} text
 * @returns {MeterMsg[]}
 */
const parse = (text) => text.trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));

/**
 * Runs the meter's program on the given lines and collects what it sends back on each of its two outputs.
 * @param {string[]} lines
 * @returns {Promise<{out: MeterMsg[], err: MeterMsg[]}>}
 */
function runMeter(lines) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [WORKER_FILE]);
    let out = '';
    let err = '';
    child.stdout.on('data', (/** @type {any} */ d) => (out += d));
    child.stderr.on('data', (/** @type {any} */ d) => (err += d));
    child.on('error', reject);
    child.on('close', () => resolve({ out: parse(out), err: parse(err) }));
    child.stdin.end(lines.join('\n') + '\n');
  });
}

test('one reading per use, in order, then done', async () => {
  const { out: msgs, err } = await runMeter([
    JSON.stringify({ kind: 'use', room: 'hall', minutes: 30 }),
    JSON.stringify({ kind: 'use', room: 'studio', minutes: 1 }),
  ]);
  assert.deepEqual(err, []);
  assert.deepEqual(msgs.map((m) => m.kind), ['reading', 'reading', 'done']);
  const [a, b, done] = msgs;
  if (a.kind !== 'reading' || b.kind !== 'reading' || done.kind !== 'done') return assert.fail('unexpected kinds');
  assert.deepEqual([a.room, b.room], ['hall', 'studio']);
  assert.ok(a.cost.cents > b.cost.cents);
  assert.equal(a.cost.cents, b.cost.cents * 30);
  assert.equal(done.count, 2);
});

test('bound minutes: whole number, 1 to 1440', async () => {
  const { out, err } = await runMeter([1, 1440, 0, 1441, 2.5].map((minutes) => JSON.stringify({ kind: 'use', room: 'r', minutes })));
  assert.deepEqual(out.map((m) => m.kind), ['reading', 'reading', 'done']);
  assert.deepEqual(err.map((m) => m.kind), ['refused', 'refused', 'refused']);
});
"""

change(S, 'X09-message-channel', 'The meter writes refusals to its standard error, as errors; readings and done stay on standard output', 'meter',
       ['which channel a message travels on changes; every message kind unchanged', 'separately running parts'],
       {ME: [(""" * It is sent MeterInput lines on its standard input and answers with MeterMsg lines on its standard output,
 * each one JSON on a line of its own.""", """ * It is sent MeterInput lines on its standard input and answers with MeterMsg lines, refusals on its standard
 * error and everything else on its standard output, each one JSON on a line of its own."""),
             (" * A use outside its bound gets a refusal in place of a reading.", " * A use outside its bound gets a refusal in place of a reading, written to standard error.")],
        MEW: [("""/** @param {MeterMsg} msg */
const send = (msg) => process.stdout.write(JSON.stringify(msg) + '\\n');""", """/**
 * Writes a message: refusals to standard error, as errors; everything else to standard output.
 * @param {MeterMsg} msg
 */
const send = (msg) => (msg.kind === 'refused' ? process.stderr : process.stdout).write(JSON.stringify(msg) + '\\n');""")],
        MET: METER_TEST})

# ---------------------------------------------------------------------------------------------------------------
# X10: honest Node code that the reader misreads because it reads the browser's description of setTimeout.

change(S, 'X10-node-timer', 'The meter stops on its own when its input goes quiet for 30 seconds', 'meter',
       ["honest code using Node's own timer methods, which the reader describes as the browser's"],
       {MEW: [("""const lines = createInterface({ input: process.stdin });
lines.on('line', (/** @type {string} */ line) => {
  if (line.trim() === '') return;""", """const lines = createInterface({ input: process.stdin });

/** How long the meter waits for its next line before it stops on its own, in milliseconds. */
const IDLE_MS = 30_000;
// A meter whose input goes quiet stops on its own, so that a forgotten one does not linger. The wait alone does
// not keep the program running.
const idle = setTimeout(() => lines.close(), IDLE_MS);
idle.unref();

lines.on('line', (/** @type {string} */ line) => {
  idle.refresh();
  if (line.trim() === '') return;"""),
              ("lines.on('close', () => send({ kind: 'done', count }));", """lines.on('close', () => {
  clearTimeout(idle);
  send({ kind: 'done', count });
});""")]})
