# Round 3: an independent adversary's series against the second design (notes/iteration-2-design.md), written
# before anything was run on it. Each change is one commit's worth of edits to ONE provider (and that provider's
# own tests where its job would keep them true to its rules). Set-ups (series 'setups', ids Y..-...) put the
# product in a state that both "before" and "after" share. Read by changes/make.py.
#
# Aims, by kind of defeat:
#   break a user, untold, nothing stops it: Y01 Y02 Y03 Y04 Y05 Y06 Y07 Y08 Y13
#   the check refuses honest code:           Y09 Y10 Y11
#   the method tells for nothing:            Y12
S = 'round3-independent'
TR, MO, ST, RO, BO, DO, ME = ('text-rules/src/index.mjs', 'money/src/index.mjs', 'store/src/index.mjs',
                              'rooms/src/index.mjs', 'bookings/src/index.mjs', 'door/src/index.mjs',
                              'meter/src/index.mjs')
MOT, ROT, BOT, DOT, MET = ('money/test/index.test.mjs', 'rooms/test/index.test.mjs', 'bookings/test/index.test.mjs',
                           'door/test/index.test.mjs', 'meter/test/index.test.mjs')
MEW = 'meter/src/worker.mjs'
BI, FR, FRT = 'billing/src/index.mjs', 'front/src/index.mjs', 'front/test/index.test.mjs'

# ---------------------------------------------------------------------------------------------------------------
# Y01: rule 1 of the second design puts errors in what an entry hands back, but the tool reads @throws only on
# functions. The kind of error a handle's method or an operation raises is in no listing.

change('setups', 'Y01-front-names-unknown-booking', "Front tells a person there is no such booking when bookings refuses an unknown one", 'front',
       ['a user that relies on the kind of error an operation raises (the standing state)'],
       {FR: [(" * @property {(id: string) => Promise<string>} cancel\n",
              " * @property {(id: string) => Promise<string>} cancel says which booking was cancelled, or that there is no such booking\n"),
             ("""    async cancel(id) {
      const b = await door.call('bookcancel', { id });
      return `Cancelled ${b.id}`;
    },""", """    async cancel(id) {
      try {
        const b = await door.call('bookcancel', { id });
        return `Cancelled ${b.id}`;
      } catch (e) {
        // bookings refuses an unknown booking with a RangeError: the person is told there is no such booking
        if (e instanceof RangeError) return `No booking ${id}`;
        throw e;
      }
    },""")],
        FRT: [("test('the kinds menu has one line per kind", """test('cancelling an unknown booking says there is no such booking', async () => {
  const front = system();
  assert.equal(await front.cancel('b-999'), 'No booking b-999');
});

test('the kinds menu has one line per kind""")]})

change(S, 'Y01-method-error-kind', "An unknown booking is refused with an Error, not a RangeError (kept for values out of bounds); the methods' comments say so", 'bookings',
       ['kind of error raised by a handle method and an operation changes', 'errors are part of what an entry hands back (second design, rule 1)'],
       {BO: [("""    cancel(id) {
      const b = find(id);
      if (!b) throw new RangeError(`bookings: unknown booking: ${id}`);""", """    /**
     * @param {string} id
     * @throws {Error} when no booking has the id (an unknown booking is not a value out of bounds), or it is not open
     */
    cancel(id) {
      const b = find(id);
      if (!b) throw new Error(`bookings: no booking ${id}`);"""),
             ("""    bookstatus: (req) => {
      const b = bookings.find(req.id);
      if (!b) throw new RangeError(`bookings: unknown booking: ${req.id}`);""", """    /** @throws {Error} when no booking has the id */
    bookstatus: (req) => {
      const b = bookings.find(req.id);
      if (!b) throw new Error(`bookings: no booking ${req.id}`);""")],
        BOT: [("  assert.throws(() => bookings.cancel('b-999'), RangeError);", "  assert.throws(() => bookings.cancel('b-999'), /no booking b-999/);"),
              ("  assert.throws(() => h.bookstatus({ id: 'b-999' }), RangeError);", "  assert.throws(() => h.bookstatus({ id: 'b-999' }), /no booking b-999/);")]},
       before=['setups/Y01-front-names-unknown-booking'],
       note="The Bookings handle and the BookingOps table are unchanged; the error kinds are written on the methods that raise them, where the tool does not read @throws.")

# ---------------------------------------------------------------------------------------------------------------
# Y02: what TypeScript calls an Amount is not what crosses a copy. Amounts become instances with private fields
# and getters: still assignable to Amount, so every comment stays true to the reader, but JSON and structuredClone
# (the door, the store, the meter's messages) copy them as {}.

change(S, 'Y02-amount-cannot-be-changed', "An amount cannot be changed once made: cents and currency are read through getters", 'money',
       ['what is handed back changes from plain data to an instance; its kind as TypeScript reads it does not',
        'values cross copies (JSON through the door and the meter, structuredClone in the store)'],
       {MO: [("const MAX_CENTS = 10_000_000;\n", """const MAX_CENTS = 10_000_000;

/**
 * An amount as money makes it: its cents and currency can be read, and nothing can change them afterwards.
 */
class FixedAmount {
  /** @type {number} */
  #cents;
  /** @type {Currency} */
  #currency;
  /**
   * @param {number} cents
   * @param {Currency} currency
   */
  constructor(cents, currency) {
    this.#cents = cents;
    this.#currency = currency;
  }
  get cents() {
    return this.#cents;
  }
  get currency() {
    return this.#currency;
  }
}
"""),
             (" * Makes an amount, refusing one outside its bound.\n", " * Makes an amount, refusing one outside its bound. The amount cannot be changed once made.\n"),
             ("  /** @type {Amount} builds an Amount */\n  const out = { cents, currency };",
              "  /** @type {Amount} builds an Amount that cannot be changed */\n  const out = new FixedAmount(cents, currency);")],
        MOT: [("test('add sums amounts of one currency", """test('an amount cannot be changed once made', () => {
  const a = amount(100, 'EUR');
  assert.throws(() => {
    /** @type {any} */ (a).cents = 5;
  }, TypeError);
  assert.equal(a.cents, 100);
});

test('add sums amounts of one currency""")]},
       note="Every @returns {Amount} stays true as TypeScript reads it (a getter is a member); the listing is read from the comments.")

# ---------------------------------------------------------------------------------------------------------------
# Y03: a handle's member becomes optional. The listing writes each member with its optionality stripped
# (getNonNullableType), and the factory only gains an optional parameter: "accepts more".

change(S, 'Y03-handle-member-optional', "Request lines become opt-in: only a door made with {lines: true} has get", 'door',
       ["a handle's method becomes optional (may be missing)", 'the factory gains an optional parameter (accepts more)'],
       {DO: [(" * @property {<K extends keyof AllOps>(line: `op=${K}&${string}`) => Promise<AllOps[K]['res']>} get calls an operation written as a request line, op=name&field=value; every value arrives as text\n",
              " * @property {<K extends keyof AllOps>(line: `op=${K}&${string}`) => Promise<AllOps[K]['res']>} [get] calls an operation written as a request line, op=name&field=value; every value arrives as text. Only a door made with {lines: true} has it\n"),
             ("""/**
 * Makes a door over the handlers.
 * @param {Handlers} handlers
 * @returns {Door}
 */
export function createDoor(handlers) {""", """/**
 * Makes a door over the handlers. Request lines are the older way of calling: only a door made with {lines: true}
 * reads them.
 * @param {Handlers} handlers
 * @param {{lines?: boolean}} [options]
 * @returns {Door}
 */
export function createDoor(handlers, options = {}) {"""),
             ("""  return {
    call: (op, body) => dispatch(op, body),
    get: (line) => {
      const params = new URLSearchParams(line);
      const op = params.get('op');
      if (!op) throw new Error('door: request line without op');
      /** @type {Record<string, string>} */
      const body = {};
      for (const [k, v] of params) if (k !== 'op') body[k] = v;
      return dispatch(op, body);
    },
  };
}""", """  /** @type {Door} builds a Door */
  const door = { call: (op, body) => dispatch(op, body) };
  if (options.lines) {
    door.get = (line) => {
      const params = new URLSearchParams(line);
      const op = params.get('op');
      if (!op) throw new Error('door: request line without op');
      /** @type {Record<string, string>} */
      const body = {};
      for (const [k, v] of params) if (k !== 'op') body[k] = v;
      return dispatch(op, body);
    };
  }
  return door;
}""")],
        DOT: [("""test('get reads a request line; every value arrives as text', async () => {
  const door = loose(createDoor(echo));""", """test('get reads a request line; every value arrives as text', async () => {
  const door = loose(createDoor(echo, { lines: true }));"""),
              ("""test('an unknown operation is refused', async () => {
  const door = loose(createDoor(echo));""", """test('an unknown operation is refused', async () => {
  const door = loose(createDoor(echo, { lines: true }));"""),
              ("  assert.throws(() => door.get('room=hall'), /without op/);\n});\n", """  assert.throws(() => door.get('room=hall'), /without op/);
});

test('a door made without lines has no get', () => {
  assert.equal(loose(createDoor(echo)).get, undefined);
});
""")]},
       note="billing calls deps.door.get on a door its tests make with createDoor(handlers).")

# ---------------------------------------------------------------------------------------------------------------
# Y04: rule 2 of the second design, followed honestly: rooms gives its table a row kind of its own. The only users
# of the table's rows the tool can see are calls to the store's carriers; front's tests write rooms rows through
# the store's test helper seededStore, by an object key.

change(S, 'Y04-row-kind-written-through-helper', "The rooms table keeps seats under capacity, in a row kind of its own (RoomRow, @storedrows rooms); Room is unchanged", 'rooms',
       ["a table's row kind changes, honestly marked", "a user writes the table's rows through the store's test helper (seededStore), named by an object key"],
       {RO: [(" * @bound seats: whole number, 1 to 500\n * @storedrows rooms\n */\n", """ * @bound seats: whole number, 1 to 500
 */

/**
 * A room as the rooms table holds it. The seats are kept under capacity, the name the venue's booking system gives
 * them, so that the table can be handed to it as it is.
 * @typedef {Object} RoomRow
 * @property {string} id
 * @property {string} name
 * @property {RoomKind} kind
 * @property {number} capacity the room's seats
 * @storedrows rooms
 */
"""),
             ("""/**
 * Makes the rooms' handle over a store.""", """/**
 * A room as rooms hands it back, from a row of the rooms table.
 * @param {RoomRow} row
 * @returns {Room}
 */
function toRoom(row) {
  return { id: row.id, name: row.name, kind: row.kind, seats: row.capacity };
}

/**
 * Makes the rooms' handle over a store."""),
             ("""      /** @type {Room} builds a Room */
      const room = { id, name: input.name, kind: input.kind, seats: input.seats };
      store.put('rooms', id, room);
      return room;""", """      /** @type {RoomRow} builds a RoomRow */
      const row = { id, name: input.name, kind: input.kind, capacity: input.seats };
      store.put('rooms', id, row);
      return toRoom(row);"""),
             ("      return rec ? /** @type {Room} checks nothing: the store holds only Rooms in this table */ (rec.value) : undefined;",
              "      return rec ? toRoom(/** @type {RoomRow} checks nothing: the store holds only RoomRows in this table */ (rec.value)) : undefined;"),
             ("        .map((r) => /** @type {Room} */ (r.value))", "        .map((r) => toRoom(/** @type {RoomRow} */ (r.value)))")],
        ROT: [("test('list filters by kind and keeps name order'", """test('the rooms table keeps the seats under capacity', () => {
  const store = createStore();
  const rooms = createRooms({ store });
  rooms.add({ name: 'Hall', kind: 'hall', seats: 80 });
  assert.deepEqual(store.get('rooms', 'hall')?.value, { id: 'hall', name: 'Hall', kind: 'hall', capacity: 80 });
  assert.equal(rooms.find('hall')?.seats, 80);
});

test('list filters by kind and keeps name order'""")]},
       note="front's tests seed the rooms table with seededStore({rooms: [{id, value: {id, name, kind, seats}}]}).")

# ---------------------------------------------------------------------------------------------------------------
# Y05: rule 2's check asks whether the value written to a table is of the row kind, as the reader types the
# argument. A comment cast at the write makes any value "a Booking".

change(S, 'Y05-row-cast-at-write', "The bookings table keeps no first day (worked out from until and nights when read); the row is written as a Booking", 'bookings',
       ['rows written to a shared table no longer of the row kind', "a comment cast at the write, which rule 2's check takes at its word"],
       {BO: [("""/**
 * Makes the bookings' handle.""", """/**
 * The row bookings keeps for a booking: the booking without its first day, which is worked out again from until
 * and nights when the row is read. Rows are smaller, and the first day cannot disagree with until and nights.
 * @param {Booking} b
 * @returns {Booking}
 */
function toRow(b) {
  const { day, ...row } = b;
  return /** @type {Booking} a Booking whose first day is worked out again when it is read */ (row);
}

/**
 * Makes the bookings' handle."""),
             ("""    const rec = store.get('bookings', id);
    return rec ? /** @type {Booking} */ (rec.value) : undefined;""", """    const rec = store.get('bookings', id);
    if (!rec) return undefined;
    const row = /** @type {Booking} the first day is not kept: it is worked out from until and nights */ (rec.value);
    return { ...row, day: formatDay(addDays(parseDay(row.until), -row.nights)) };"""),
             ("      store.put('bookings', b.id, b);", "      store.put('bookings', b.id, toRow(b));"),
             ("      store.put('bookings', id, done);", "      store.put('bookings', id, toRow(done));")],
        BOT: [("test('cancel closes an open booking once", """test('the table keeps no first day; find works it out again', () => {
  const { store, bookings } = system();
  const b = bookings.open(req({ day: '2026-12-30', nights: 3 }));
  assert.equal(/** @type {any} */ (store.get('bookings', b.id)?.value).day, undefined);
  assert.equal(bookings.find(b.id)?.day, '2026-12-30');
});

test('cancel closes an open booking once""")]},
       note="reports reads rows of the bookings table straight from the store (b.day).")

# ---------------------------------------------------------------------------------------------------------------
# Y06: the channel moves (as in X09), the @message tag is not updated, and the write is built in two statements:
# the check looks for JSON.stringify only inside the write call's own statement.

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
const parse = (text) => text.trim().split('\n').filter(Boolean).map((l) => /** @type {MeterMsg} */ (JSON.parse(l)));

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

change(S, 'Y06-channel-line-built-first', "The meter writes refusals to standard error, as errors; the line is built first, then written; the @message tag is left as it was", 'meter',
       ["a message's channel changes; its @message channel is not updated", 'the write of JSON.stringify is split over two statements'],
       {ME: [(""" * It is sent MeterInput lines on its standard input and answers with MeterMsg lines on its standard output,
 * each one JSON on a line of its own.""", """ * It is sent MeterInput lines on its standard input and answers with MeterMsg lines: refusals on its standard
 * error, as errors, and everything else on its standard output, each one JSON on a line of its own."""),
             (" * A use outside its bound gets a refusal in place of a reading.\n", " * A use outside its bound gets a refusal in place of a reading, written to standard error.\n")],
        MEW: [(r"""/** @param {MeterMsg} msg */
const send = (msg) => process.stdout.write(JSON.stringify(msg) + '\n');""", r"""/**
 * Writes a message on a line of its own: a refusal to standard error, as an error; everything else to standard output.
 * @param {MeterMsg} msg
 */
const send = (msg) => {
  const line = JSON.stringify(msg) + '\n';
  if (msg.kind === 'refused') process.stderr.write(line);
  else process.stdout.write(line);
};""")],
        MET: METER_TEST},
       note="MeterMsg keeps '@message stdout'. billing reads the meter's standard output only.")

# ---------------------------------------------------------------------------------------------------------------
# Y07: rule 4 compares the body of the test named for a bound. Here the test reads its limit from a constant at
# the top of the test file, so the body does not change when the limit does; the bound line is forgotten.

change('setups', 'Y07-money-tests-name-the-limit', "money's tests name the largest amount once, at the top", 'money',
       ['bound test reads its limit from outside its own body (the standing state)'],
       {MOT: [("import { amount, add, formatAmount, splitEvenly, CURRENCIES } from '../src/index.mjs';\n",
               "import { amount, add, formatAmount, splitEvenly, CURRENCIES } from '../src/index.mjs';\n\n"
               "/** The largest amount there may be, in cents. */\nconst MAX = 10_000_000;\n"),
              ("""  assert.equal(amount(10_000_000, 'EUR').cents, 10_000_000);
  assert.throws(() => amount(-1, 'EUR'), RangeError);
  assert.throws(() => amount(10_000_001, 'EUR'), RangeError);""", """  assert.equal(amount(MAX, 'EUR').cents, MAX);
  assert.throws(() => amount(-1, 'EUR'), RangeError);
  assert.throws(() => amount(MAX + 1, 'EUR'), RangeError);"""),
              ("  assert.throws(() => add(amount(10_000_000, 'EUR'), amount(1, 'EUR')), RangeError);",
               "  assert.throws(() => add(amount(MAX, 'EUR'), amount(1, 'EUR')), RangeError);")]})

change(S, 'Y07-limit-outside-bound-test', "An amount may now be at most 500,000 cents; code and the tests' limit changed, the bound line forgotten", 'money',
       ['bound changed in code and tests, bound line not', "the bound test's body is unchanged (its limit is a constant outside it)"],
       {MO: [("const MAX_CENTS = 10_000_000;", "const MAX_CENTS = 500_000;")],
        MOT: [("const MAX = 10_000_000;", "const MAX = 500_000;")]},
       before=['setups/Y07-money-tests-name-the-limit'])

# ---------------------------------------------------------------------------------------------------------------
# Y08: bound lines of a kind are carried into every entry that writes the kind out, but only for object kinds. A
# bound on a kind that names a number (Cents) stays on that kind's own entry, which nobody names.

change('setups', 'Y08-money-cents-kind', "money names its kind of cents; the bound of cents moves onto it", 'money',
       ['a bound on a kind that is not an object (the standing state)'],
       {MO: [("""/**
 * An amount of money.
 * @typedef {Object} Amount
 * @property {number} cents the amount in whole cents
 * @property {Currency} currency
 * @bound cents: whole number, 0 to 10,000,000 inclusive
 */""", """/**
 * A number of whole cents.
 * @typedef {number} Cents
 * @bound cents: whole number, 0 to 10,000,000 inclusive
 */

/**
 * An amount of money.
 * @typedef {Object} Amount
 * @property {Cents} cents the amount in whole cents
 * @property {Currency} currency
 */"""),
             (" * @param {number} cents\n", " * @param {Cents} cents\n")]})

change(S, 'Y08-bound-on-number-kind', "An amount may now be at most 500,000 cents; code, the bound line of Cents and its test all changed", 'money',
       ['bound line changed honestly, on a kind that names a number', 'entries that hand back the kind do not carry its bound'],
       {MO: [(" * @bound cents: whole number, 0 to 10,000,000 inclusive", " * @bound cents: whole number, 0 to 500,000 inclusive"),
             ("const MAX_CENTS = 10_000_000;", "const MAX_CENTS = 500_000;")],
        MOT: [("""test('bound cents: whole number, 0 to 10,000,000 inclusive', () => {
  assert.equal(amount(0, 'EUR').cents, 0);
  assert.equal(amount(10_000_000, 'EUR').cents, 10_000_000);
  assert.throws(() => amount(-1, 'EUR'), RangeError);
  assert.throws(() => amount(10_000_001, 'EUR'), RangeError);""", """test('bound cents: whole number, 0 to 500,000 inclusive', () => {
  assert.equal(amount(0, 'EUR').cents, 0);
  assert.equal(amount(500_000, 'EUR').cents, 500_000);
  assert.throws(() => amount(-1, 'EUR'), RangeError);
  assert.throws(() => amount(500_001, 'EUR'), RangeError);"""),
              ("  assert.throws(() => add(amount(10_000_000, 'EUR'), amount(1, 'EUR')), RangeError);",
               "  assert.throws(() => add(amount(500_000, 'EUR'), amount(1, 'EUR')), RangeError);")]},
       before=['setups/Y08-money-cents-kind'])

# ---------------------------------------------------------------------------------------------------------------
# Y09: honest code the runtime has (Node 22) and the reader's library (ES2022) does not: Array.prototype.toSorted.

change(S, 'Y09-newer-library-method', "rooms sorts its list with toSorted, which leaves the list it sorts as it was", 'rooms',
       ['honest code using a method of the language newer than the reader\'s library (ES2023)'],
       {RO: [("        .sort((a, b) => a.name.localeCompare(b.name));", "        .toSorted((a, b) => a.name.localeCompare(b.name));")]})

# ---------------------------------------------------------------------------------------------------------------
# Y10: Map.has then Map.get, honest code the reader cannot follow, where the value is of another module's kind and
# the complaint is "not assignable" (2345), not "possibly undefined": neither exception of tool change 13 applies.

change(S, 'Y10-map-has-get-provider-kind', "bookings adds up what the open bookings of each room come to (takings)", 'bookings',
       ['new handle method (new entry)', "honest Map.has/get the reader cannot follow, with a value of money's kind"],
       {BO: [("import { amount } from '../../money/src/index.mjs';", "import { amount, add } from '../../money/src/index.mjs';"),
             (" * @property {(room: string, party: number, nights: number) => Amount} quote what a booking would cost\n",
              " * @property {(room: string, party: number, nights: number) => Amount} quote what a booking would cost\n"
              " * @property {() => Record<string, Amount>} takings what the open bookings of each room come to, by the room's id\n"),
             ("""      store.put('bookings', id, done);
      return done;
    },
  };
}""", """      store.put('bookings', id, done);
      return done;
    },
    takings() {
      /** @type {Map<string, Amount>} what the open bookings of each room come to */
      const byRoom = new Map();
      for (const rec of store.list('bookings')) {
        const b = /** @type {Booking} */ (rec.value);
        if (b.state !== 'open') continue;
        if (!byRoom.has(b.room)) byRoom.set(b.room, amount(0, 'EUR'));
        byRoom.set(b.room, add(byRoom.get(b.room), b.total));
      }
      return Object.fromEntries(byRoom);
    },
  };
}""")],
        BOT: [("test('cancel closes an open booking once", """test('takings add up the open bookings of each room', () => {
  const { bookings } = system();
  const a = bookings.open(req({ party: 2, nights: 1 }));
  const b = bookings.open(req({ party: 3, nights: 1 }));
  const c = bookings.open(req({ room: 'studio', party: 1, nights: 1 }));
  bookings.cancel(c.id);
  const t = bookings.takings();
  assert.equal(t.hall.cents, a.total.cents + b.total.cents);
  assert.equal(t.studio, undefined);
});

test('cancel closes an open booking once""")]})

# ---------------------------------------------------------------------------------------------------------------
# Y11: node:test's it is test under another name. The check finds tests named for a bound only in calls of test.

MONEY_TEST_IT = r"""import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { amount, add, formatAmount, splitEvenly, CURRENCIES } from '../src/index.mjs';

describe('amount', () => {
  it('bound cents: whole number, 0 to 10,000,000 inclusive', () => {
    assert.equal(amount(0, 'EUR').cents, 0);
    assert.equal(amount(10_000_000, 'EUR').cents, 10_000_000);
    assert.throws(() => amount(-1, 'EUR'), RangeError);
    assert.throws(() => amount(10_000_001, 'EUR'), RangeError);
    assert.throws(() => amount(1.5, 'EUR'), RangeError);
  });

  it('refuses a currency outside CURRENCIES', () => {
    for (const c of CURRENCIES) assert.equal(amount(1, c).currency, c);
    assert.throws(() => amount(1, /** @type {any} */ ('XXX')), RangeError);
  });
});

describe('add', () => {
  it('sums amounts of one currency and refuses mixed ones', () => {
    assert.equal(add(amount(150, 'EUR'), amount(250, 'EUR')).cents, 400);
    assert.throws(() => add(amount(1, 'EUR'), amount(1, 'USD')), RangeError);
    assert.throws(() => add(amount(10_000_000, 'EUR'), amount(1, 'EUR')), RangeError);
  });
});

describe('formatAmount', () => {
  it('shows the currency and the value', () => {
    const s = formatAmount(amount(1250, 'EUR'));
    assert.match(s, /EUR|€/);
    assert.match(s, /12[.,]50/);
  });
});

describe('splitEvenly', () => {
  it('bound parts: whole number, 1 to 100', () => {
    assert.equal(splitEvenly(amount(100, 'EUR'), 1).length, 1);
    assert.equal(splitEvenly(amount(100, 'EUR'), 100).length, 100);
    assert.throws(() => splitEvenly(amount(100, 'EUR'), 0), RangeError);
    assert.throws(() => splitEvenly(amount(100, 'EUR'), 101), RangeError);
  });

  it('parts add up exactly and differ by at most one cent', () => {
    const parts = splitEvenly(amount(1001, 'GBP'), 3);
    assert.equal(parts.reduce((s, p) => s + p.cents, 0), 1001);
    const c = parts.map((p) => p.cents);
    assert.ok(Math.max(...c) - Math.min(...c) <= 1);
    assert.ok(parts.every((p) => p.currency === 'GBP'));
  });
});
"""

change(S, 'Y11-tests-grouped-with-it', "money's tests are grouped by function with describe and it; every assertion and every test name stays", 'money',
       ["tests named for bounds written with node:test's it", 'no change to running code or comments'],
       {MOT: MONEY_TEST_IT})

# ---------------------------------------------------------------------------------------------------------------
# Y12: rule 4 treats any change to the body of a test named for a bound as a changed bound. A test rewritten with
# the same assertions in loops tells the users of every entry, in every module, that carries the line.

change(S, 'Y12-bound-test-rewritten-same-meaning', "The test of the bound of cents is written as two loops; the same values, the same assertions", 'money',
       ['body of a test named for a bound changes; its meaning does not', 'the line is carried by entries of four modules'],
       {MOT: [("""  assert.equal(amount(0, 'EUR').cents, 0);
  assert.equal(amount(10_000_000, 'EUR').cents, 10_000_000);
  assert.throws(() => amount(-1, 'EUR'), RangeError);
  assert.throws(() => amount(10_000_001, 'EUR'), RangeError);
  assert.throws(() => amount(1.5, 'EUR'), RangeError);""", """  for (const cents of [0, 10_000_000]) assert.equal(amount(cents, 'EUR').cents, cents);
  for (const cents of [-1, 10_000_001, 1.5]) assert.throws(() => amount(cents, 'EUR'), RangeError);""")]})

# ---------------------------------------------------------------------------------------------------------------
# Y13: an exported class is listed as a value: its prototype's members are written out, its constructor's
# parameters are not (only call signatures are read).

change('setups', 'Y13a-money-tally', "money gains Tally, a running total of amounts of one currency", 'money',
       ['an exported class (the standing state)'],
       {MO: [("""  for (let i = 0; i < parts; i++) out.push(amount(base + (i < extra ? 1 : 0), a.currency));
  return out;
}
""", """  for (let i = 0; i < parts; i++) out.push(amount(base + (i < extra ? 1 : 0), a.currency));
  return out;
}

/**
 * A running total of amounts of one currency, for adding up many amounts as they come.
 */
export class Tally {
  /**
   * @param {Currency} currency the currency of every amount added
   */
  constructor(currency) {
    /** @type {Amount} the total so far */
    this.total = amount(0, currency);
  }

  /**
   * Adds an amount of the tally's currency.
   * @param {Amount} a
   * @throws {RangeError} when the currency differs or the total would leave the bound of cents
   */
  add(a) {
    this.total = add(this.total, a);
  }
}
""")],
        MOT: [("import { amount, add, formatAmount, splitEvenly, CURRENCIES } from '../src/index.mjs';",
               "import { amount, add, formatAmount, splitEvenly, CURRENCIES, Tally } from '../src/index.mjs';"),
              ("""  assert.ok(parts.every((p) => p.currency === 'GBP'));
});
""", """  assert.ok(parts.every((p) => p.currency === 'GBP'));
});

test('a Tally adds up amounts of one currency', () => {
  const t = new Tally('EUR');
  t.add(amount(150, 'EUR'));
  t.add(amount(250, 'EUR'));
  assert.equal(t.total.cents, 400);
  assert.throws(() => t.add(amount(1, 'USD')), RangeError);
});
""")]})

change('setups', 'Y13b-billing-uses-tally', "billing adds up the meter's readings with a Tally", 'billing',
       ['a user that constructs a provider class (the standing state)'],
       {BI: [("import { amount, add, formatAmount, splitEvenly } from '../../money/src/index.mjs';",
              "import { amount, formatAmount, splitEvenly, Tally } from '../../money/src/index.mjs';"),
             ("""      return new Promise((resolve, reject) => {
        const child = spawn(process.execPath, [WORKER_FILE]);
        let buffer = '';
        let total = amount(0, 'EUR');""", """      return new Promise((resolve, reject) => {
        // One running total for all the readings.
        const tally = new Tally('EUR');
        const child = spawn(process.execPath, [WORKER_FILE]);
        let buffer = '';"""),
             ("            if (msg.kind === 'reading') total = add(total, msg.cost);", "            if (msg.kind === 'reading') tally.add(msg.cost);"),
             ("            else if (msg.kind === 'done') resolve(total);", "            else if (msg.kind === 'done') resolve(tally.total);")]})

change(S, 'Y13-constructor-accepts-differently', "A Tally now starts from an amount (a deposit already paid, say), not from a currency", 'money',
       ["a class's constructor accepts a different kind (cannot stand in)", 'constructors are not in the listing'],
       {MO: [("""  /**
   * @param {Currency} currency the currency of every amount added
   */
  constructor(currency) {
    /** @type {Amount} the total so far */
    this.total = amount(0, currency);
  }""", """  /**
   * @param {Amount} start the amount to start from; its currency is the tally's
   */
  constructor(start) {
    /** @type {Amount} the total so far */
    this.total = amount(start.cents, start.currency);
  }"""),
             (" * A running total of amounts of one currency, for adding up many amounts as they come.\n",
              " * A running total of amounts of one currency, for adding up many amounts as they come, from a given start.\n")],
        MOT: [("  const t = new Tally('EUR');", "  const t = new Tally(amount(0, 'EUR'));"),
              ("  assert.equal(t.total.cents, 400);", "  assert.equal(t.total.cents, 400);\n  assert.equal(new Tally(amount(100, 'GBP')).total.cents, 100);")]},
       before=['setups/Y13a-money-tally', 'setups/Y13b-billing-uses-tally'])
