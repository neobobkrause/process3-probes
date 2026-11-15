# The adversarial round, written by the proof session (Claude). Each change tries to defeat the method: to break
# a user without the tool telling it, to make the check refuse honest code, or to make the tool tell for nothing.
# Setups (changes/setups/A..) put the product in a state that both "before" and "after" share.
S = 'adversarial'
TR, MO, ST, RO, BO, ME = ('text-rules/src/index.mjs', 'money/src/index.mjs', 'store/src/index.mjs',
                          'rooms/src/index.mjs', 'bookings/src/index.mjs', 'meter/src/index.mjs')
TRT, MOT, BOT, MET = ('text-rules/test/index.test.mjs', 'money/test/index.test.mjs', 'bookings/test/index.test.mjs', 'meter/test/index.test.mjs')
BI, BIT, FR, FRT = ('billing/src/index.mjs', 'billing/test/index.test.mjs', 'front/src/index.mjs', 'front/test/index.test.mjs')

change(S, 'A01-stored-row-shape', "bookings keeps its interface but stores its rows in a shorter form of its own", 'bookings',
       ['attack: a user reads another module\'s rows straight out of the shared store'],
       {BO: [("""  /** @param {string} id */
  const find = (id) => {
    const rec = store.get('bookings', id);
    return rec ? /** @type {Booking} */ (rec.value) : undefined;
  };""", """  /**
   * Bookings are kept in the store in a shorter form of their own.
   * @param {Booking} b
   */
  const toRow = (b) => ({ i: b.id, r: b.room, d: b.day, u: b.until, n: b.nights, p: b.party, s: b.state, t: b.total, ...(b.note === undefined ? {} : { o: b.note }) });
  /** @param {string} id */
  const find = (id) => {
    const rec = store.get('bookings', id);
    if (!rec) return undefined;
    const r = /** @type {ReturnType<typeof toRow>} */ (rec.value);
    /** @type {Booking} builds a Booking */
    const b = { id: r.i, room: r.r, day: r.d, until: r.u, nights: r.n, party: r.p, state: r.s, total: r.t };
    if (r.o !== undefined) b.note = r.o;
    return b;
  };"""),
             ("      store.put('bookings', b.id, b);", "      store.put('bookings', b.id, toRow(b));"),
             ("      store.put('bookings', id, done);", "      store.put('bookings', id, toRow(done));")]})

change('setups', 'A03-front-uses-reexport', 'rooms re-exports slugify; front imports it from rooms', 'front',
       ['setup'],
       {RO: [("import { slugify } from '../../text-rules/src/index.mjs';", "import { slugify } from '../../text-rules/src/index.mjs';\nexport { slugify } from '../../text-rules/src/index.mjs';")],
        FR: [("import { ROOM_KINDS } from '../../rooms/src/index.mjs';", """import { ROOM_KINDS, slugify } from '../../rooms/src/index.mjs';

/**
 * The id a room of this name has.
 * @param {string} name
 * @returns {string}
 */
export function roomIdFor(name) {
  return slugify(name);
}""")],
        FRT: [("import { createFront } from '../src/index.mjs';", "import { createFront, roomIdFor } from '../src/index.mjs';"),
              ("test('booking needs a valid email'", """test('a room id is the slug of its name', () => {
  assert.equal(roomIdFor('Big Hall'), 'big-hall');
});

test('booking needs a valid email'""")]})

change(S, 'A03-reexported-function', "slugify joins words with underscores; front reaches slugify only through rooms' re-export", 'text-rules',
       ['attack: a function reached through another module\'s re-export'],
       {TR: [(" * @bound result: only a-z, 0-9 and single hyphens between them", " * @bound result: only a-z, 0-9 and single underscores between them"),
             ("    .replace(/[^a-z0-9]+/g, '-')\n    .replace(/^-+|-+$/g, '');", "    .replace(/[^a-z0-9]+/g, '_')\n    .replace(/^_+|_+$/g, '');")],
        TRT: [("test('bound result: only a-z, 0-9 and single hyphens between them'", "test('bound result: only a-z, 0-9 and single underscores between them'"),
              ("    assert.match(slugify(t), /^[a-z0-9]+(-[a-z0-9]+)*$/);", "    assert.match(slugify(t), /^[a-z0-9]+(_[a-z0-9]+)*$/);"),
              ("test('slugify keeps the words in order, joined by hyphens', () => {\n  assert.equal(slugify('Main Hall'), 'main-hall');\n  assert.equal(slugify('Café Øst 2'), 'cafe-st-2');",
               "test('slugify keeps the words in order, joined by underscores', () => {\n  assert.equal(slugify('Main Hall'), 'main_hall');\n  assert.equal(slugify('Café Øst 2'), 'cafe_st_2');")]},
       before=['setups/A03-front-uses-reexport'])

change('setups', 'A04-billing-own-copy-of-message-kind', "billing reads the meter's messages with its own copy of their kind, not the shared one", 'billing',
       ['setup'],
       {BI: [("/** @import { MeterInput, MeterMsg } from '../../meter/src/index.mjs' */", "/** @import { MeterInput } from '../../meter/src/index.mjs' */"),
             ("            /** @type {MeterMsg} checks a MeterMsg by its kind */",
              "            /** @type {{kind: 'reading', room: string, minutes: number, cost: Amount} | {kind: 'refused', room: string, reason: string} | {kind: 'done', count: number}} checks a message by its kind (billing's own copy) */")]})

change(S, 'A04-message-kind-not-shared', "The meter's reading carries price in place of cost; billing kept its own copy of the message kind", 'meter',
       ['attack: two running parts that do not share one written kind for their message'],
       {ME: [(" * @typedef {{kind: 'reading', room: string, minutes: number, cost: Amount}", " * @typedef {{kind: 'reading', room: string, minutes: number, price: Amount}")],
        'meter/src/worker.mjs': [('cost: amount(input.minutes * RATE_CENTS_PER_MINUTE', 'price: amount(input.minutes * RATE_CENTS_PER_MINUTE')],
        MET: [('assert.ok(a.cost.cents > b.cost.cents);', 'assert.ok(a.price.cents > b.price.cents);'),
              ('assert.equal(a.cost.cents, b.cost.cents * 30);', 'assert.equal(a.price.cents, b.price.cents * 30);')]},
       before=['setups/A04-billing-own-copy-of-message-kind'])

change('setups', 'A06-billing-expects-range-error', "billing's tests expect a RangeError when an invoice asks for too many instalments", 'billing',
       ['setup'],
       {BIT: [("test('an invoice for a cancelled booking is refused'", """test('an invoice in more instalments than allowed is refused', async () => {
  const { bookings, billing } = system();
  const b = bookings.open({ room: 'hall', day: '2026-12-01', nights: 1, party: 2 });
  await assert.rejects(() => billing.invoice(b.id, 101), RangeError);
});

test('an invoice for a cancelled booking is refused'""")]})

change(S, 'A06-error-kind-changed', "splitEvenly now throws TypeError, not RangeError, outside its bound; its @throws comment says so", 'money',
       ['attack: the kind of error a provider raises is part of what it hands back, but not of the listing'],
       {MO: [(" * @throws {RangeError} when parts is outside its bound", " * @throws {TypeError} when parts is outside its bound"),
             ("throw new RangeError('splitEvenly: parts out of bounds')", "throw new TypeError('splitEvenly: parts out of bounds')")],
        MOT: [("assert.throws(() => splitEvenly(amount(100, 'EUR'), 0), RangeError);", "assert.throws(() => splitEvenly(amount(100, 'EUR'), 0), TypeError);"),
              ("assert.throws(() => splitEvenly(amount(100, 'EUR'), 101), RangeError);", "assert.throws(() => splitEvenly(amount(100, 'EUR'), 101), TypeError);")]},
       before=['setups/A06-billing-expects-range-error'])

change(S, 'A07-bound-test-moved-line-not', "A party may now be at most 100; the job moved its own bound test to 100 but left the bound line and the test's name", 'bookings',
       ['attack: the test named for a bound no longer tests what its name and the bound line say'],
       {BO: [('party < 1 || party > 200 || party > seats', 'party < 1 || party > 100 || party > seats')],
        BOT: [("assert.equal(bookings.open(req({ party: 200 })).party, 200);", "assert.equal(bookings.open(req({ party: 100 })).party, 100);"),
              ("assert.throws(() => bookings.open(req({ party: 201 })), RangeError);", "assert.throws(() => bookings.open(req({ party: 101 })), RangeError);")]})

change(S, 'A08-request-line-built-in-steps', "billing builds its request line in two steps; the code is right", 'billing',
       ['attack: make the check refuse honest code (a call by name the reader cannot read)'],
       {BI: [("      const status = await deps.door.get(`op=bookstatus&id=${bookingId}`);",
              "      let line = 'op=bookstatus';\n      line += `&id=${encodeURIComponent(bookingId)}`;\n      const status = await deps.door.get(line);")]})

change(S, 'A09-assert-narrowing', "meter's test narrows a message with assert.equal before reading its fields; the test is right", 'meter',
       ['attack: make the check refuse honest code (narrowing the reader cannot see)'],
       {MET: [("  if (a.kind !== 'reading' || b.kind !== 'reading' || done.kind !== 'done') return assert.fail('unexpected kinds');",
               "  assert.equal(a.kind, 'reading');\n  assert.equal(b.kind, 'reading');\n  assert.equal(done.kind, 'done');")]},
       note='Known from development (notes/development-log.md, item 2) before this round was written.')

change(S, 'A10-kind-split-same-shape', "Booking is rewritten as two parts joined; its shape is the same", 'bookings',
       ['attack: make the tool tell for nothing (a refactor of the comments with no change of shape)'],
       {BO: [("""/**
 * A booking.
 * @typedef {Object} Booking
 * @property {string} id
 * @property {string} room the room's id
 * @property {string} day the first night, YYYY-MM-DD
 * @property {string} until the morning after the last night, YYYY-MM-DD
 * @property {number} nights
 * @property {number} party how many people
 * @property {'open' | 'cancelled'} state
 * @property {Amount} total what the booking costs
 * @property {string} [note]
 * @bound day: a real calendar day written YYYY-MM-DD
 * @bound nights: whole number, 1 to 14
 * @bound party: whole number, 1 to 200, and no more than the room's seats
 * @storedrows bookings
 */""", """/**
 * What a booking is for.
 * @typedef {Object} BookingCore
 * @property {string} id
 * @property {string} room the room's id
 * @property {string} day the first night, YYYY-MM-DD
 * @property {string} until the morning after the last night, YYYY-MM-DD
 * @property {number} nights
 * @property {number} party how many people
 * @property {'open' | 'cancelled'} state
 * @property {string} [note]
 * @bound day: a real calendar day written YYYY-MM-DD
 * @bound nights: whole number, 1 to 14
 * @bound party: whole number, 1 to 200, and no more than the room's seats
 */

/**
 * What a booking costs.
 * @typedef {Object} BookingPrice
 * @property {Amount} total what the booking costs
 */

/**
 * A booking.
 * @typedef {BookingCore & BookingPrice} Booking
 * @storedrows bookings
 */""")]},
       note='Iteration 2: the @storedrows mark that the product now carries on Booking is kept on Booking.')

change(S, 'A11-string-spelled-String', "slugify's comment writes String where it wrote string", 'text-rules',
       ['attack: make the tool tell for nothing, or refuse, over a spelling of the same kind'],
       {TR: [(" * @param {string} text the name to turn into a slug\n * @returns {string} the slug", " * @param {String} text the name to turn into a slug\n * @returns {String} the slug")]})

change('setups', 'A12-front-test-reads-error', "front's tests read the message of a caught error", 'front',
       ['setup'],
       {FRT: [("test('cancel names the cancelled booking'", """test('a refused booking says what was wrong', async () => {
  const front = system();
  try {
    await front.book({ email: 'a@b.cd', room: 'kitchen', day: '2026-12-05', nights: 1, party: 9 });
  } catch (e) {
    assert.match(e.message, /party/);
    return;
  }
  assert.fail('not refused');
});

test('cancel names the cancelled booking'""")]})

change(S, 'A12-caught-error-makes-user-unfollowed', "Opening a booking accepts an optional arrival time (accepts more); front's tests read a caught error's message", 'bookings',
       ['attack: make the tool tell for nothing (a user made "not followed" by a value that has nothing to do with its providers)'],
       {BO: [(""" * @property {number} party
 * @property {string} [note]
 */

/**
 * The bookings' handle.""", """ * @property {number} party
 * @property {string} [note]
 * @property {'morning' | 'afternoon' | 'evening'} [arrival] when the party expects to arrive; checked, not kept
 */

/**
 * The bookings' handle."""),
             ("""      const first = parseDay(req.day);
      const total""", """      const first = parseDay(req.day);
      if (req.arrival !== undefined && !['morning', 'afternoon', 'evening'].includes(req.arrival)) {
        throw new RangeError('bookings: unknown arrival');
      }
      const total""")]},
       before=['setups/A12-front-test-reads-error'])

change('setups', 'A13-rooms-computed-member', "rooms calls the store's get by a computed name", 'rooms',
       ['setup'],
       {RO: [('ALL', "store.get('rooms', id)", "store[/** @type {any} */ ('get')]('rooms', id)")]})

change(S, 'A13-computed-member-renamed', "The store handle's get is renamed read; rooms calls it by a computed name", 'store',
       ['attack: a use the tool cannot see by name'],
       {ST: [(' * @property {(table: string, id: string) => Stored | undefined} get\n', ' * @property {(table: string, id: string) => Stored | undefined} read\n'),
             ('    get(table, id) {', '    read(table, id) {')],
        'store/test/index.test.mjs': [('ALL', 's.get(', 's.read(')]},
       before=['setups/A13-rooms-computed-member'])

change('setups', 'A14-bookings-own-price-kind', "bookings writes the total with a kind of its own, Price, a copy of money's Amount", 'bookings',
       ['setup'],
       {BO: [(" * @property {Amount} total what the booking costs\n", " * @property {Price} total what the booking costs\n"),
             ("""/**
 * What it takes to open a booking.""", """/**
 * A price, as bookings writes it.
 * @typedef {{cents: number, currency: 'EUR' | 'USD' | 'GBP'}} Price
 */

/**
 * What it takes to open a booking."""),
             (" *   bookstatus: {req: {id: string}, res: {state: Booking['state'], total: Amount, room: string}},", " *   bookstatus: {req: {id: string}, res: {state: Booking['state'], total: Price, room: string}},"),
             (" *   bookquote: {req: {room: string, party: number, nights: number}, res: {total: Amount}}", " *   bookquote: {req: {room: string, party: number, nights: number}, res: {total: Price}}")]})

change(S, 'A14-copy-of-kind-in-the-middle', "Amount's cents is renamed minor; bookings, in the middle, wrote its own copy of the kind", 'money',
       ['attack: a value passed on by a third module that copied the kind instead of naming it'],
       {MO: [(' * @property {number} cents the amount in whole cents', ' * @property {number} minor the amount in whole cents'),
             (' * @bound cents: whole number, 0 to 10,000,000 inclusive', ' * @bound minor: whole number, 0 to 10,000,000 inclusive'),
             ('const out = { cents, currency };', 'const out = { minor: cents, currency };'),
             ('ALL', 'a.cents', 'a.minor'), ('ALL', 'b.cents', 'b.minor')],
        MOT: [('ALL', '.cents', '.minor'), ("test('bound cents:", "test('bound minor:")]},
       before=['setups/A14-bookings-own-price-kind'])
