# Round 6: an independent adversary's series against the fifth design (notes/iteration-5-design.md), written before
# anything was run on it. Each change is one commit's worth of edits to ONE provider (and that provider's own tests
# where its job would keep them true to its rules). Set-ups (series 'setups', ids W..-...) put the product in a
# state that both "before" and "after" share. Read by changes/make.py.
#
# The fifth design is silent about an entry only when its own comparison finds nothing AND TypeScript's printed
# declaration is the same. This round aims at what neither looks at, at checks that read a spelling instead of a
# meaning, and at the backstop's own printing:
#   break a user, untold, nothing stops it:  W01 (how a running part is started has no written kind)
#                                            W02 (rule 19 looks only at writes that hold a JSON.stringify)
#                                            W03 (rule 29 checks errors stated on the function, not on the kind)
#                                            W04 (a bound stated where rule 10 lets errors be stated is not listed)
#                                            W05 (rule 28 looks only at import statements, not at import())
#                                            W06 (rule 33: "keeps every old signature" is not "answers every old
#                                                 call the same")
#                                            W17 (rule 26 follows named imports of the module's constants only)
#   the check refuses honest code:           W07 W08 W09 W10 W11 W12
#   the method tells for nothing:            W13 W14 W15 (the backstop's printing) W16 (bound lines split by
#                                                 member name)
S = 'round6-independent'
TR, MO, RO, BO, DO, ME, ST = ('text-rules/src/index.mjs', 'money/src/index.mjs', 'rooms/src/index.mjs',
                              'bookings/src/index.mjs', 'door/src/index.mjs', 'meter/src/index.mjs',
                              'store/src/index.mjs')
TRT, MOT, ROT, BOT, MET, STT = ('text-rules/test/index.test.mjs', 'money/test/index.test.mjs',
                                'rooms/test/index.test.mjs', 'bookings/test/index.test.mjs',
                                'meter/test/index.test.mjs', 'store/test/index.test.mjs')
MEW = 'meter/src/worker.mjs'
BOP = 'bookings/src/prices.mjs'
FR, FRT = 'front/src/index.mjs', 'front/test/index.test.mjs'

# ---------------------------------------------------------------------------------------------------------------
# W01: rule 8 gives every message between running parts a written kind; nothing gives one to how a running part is
# STARTED. The meter now prices in the currency it is started with, its one command-line argument, and will not
# start without it. Its listing is the same (WORKER_FILE is still text; MeterInput and MeterMsg are unchanged); the
# start is described in prose, the only place the rules leave for it. Its own test helper starts it in euros unless
# told otherwise (a default parameter, which the bound test's fingerprint does not see, so the minutes bound test
# reads the same). billing starts the meter with no argument.

change(S, 'W01-meter-start-argument', "The meter prices in the currency it is started with, its one argument (node worker.mjs EUR), and will not start without one", 'meter',
       ['a newly required argument to start a separately running part', 'no written kind holds how a running part is started'],
       {ME: [(""" * The meter: a separately running program that prices the minutes rooms were used.
 * It is sent MeterInput lines on its standard input and answers with MeterMsg lines on its standard output,
 * each one JSON on a line of its own. Both sides use the kinds written here.""", """ * The meter: a separately running program that prices the minutes rooms were used.
 * It is started with the currency to price in as its one argument (node WORKER_FILE EUR), and will not start
 * without one. It is sent MeterInput lines on its standard input and answers with MeterMsg lines on its standard
 * output, each one JSON on a line of its own. Both sides use the kinds written here."""),
             ("/** Where the meter's program is, for whoever starts it. */",
              "/** Where the meter's program is, for whoever starts it: start it with node, this file and the currency to price in. */")],
        MEW: [(""" * The meter's program. Run it with node; see index.mjs for what it is sent and what it sends back.
 */
import { createInterface } from 'node:readline';
import { amount } from '../../money/src/index.mjs';
import { RATE_CENTS_PER_MINUTE } from './index.mjs';
/** @import { MeterInput, MeterMsg } from './index.mjs' */

let count = 0;""", """ * The meter's program. Run it with node and the currency to price in (node worker.mjs EUR); see index.mjs for what
 * it is sent and what it sends back.
 */
import { createInterface } from 'node:readline';
import { amount, CURRENCIES } from '../../money/src/index.mjs';
import { RATE_CENTS_PER_MINUTE } from './index.mjs';
/** @import { MeterInput, MeterMsg } from './index.mjs' */
/** @import { Currency } from '../../money/src/index.mjs' */

/**
 * The currency the meter prices in: the one argument it is started with. A meter started without one stops at once,
 * since a price in a currency nobody chose is worse than none.
 * @returns {Currency}
 * @throws {RangeError} when the meter was started without a currency of CURRENCIES
 */
function currencyToPriceIn() {
  for (const c of CURRENCIES) if (c === process.argv[2]) return c;
  throw new RangeError(`meter: start it with the currency to price in, one of ${CURRENCIES.join(', ')}`);
}

const currency = currencyToPriceIn();
let count = 0;"""),
              ("cost: amount(input.minutes * RATE_CENTS_PER_MINUTE, 'EUR') });", "cost: amount(input.minutes * RATE_CENTS_PER_MINUTE, currency) });")],
        MET: [(""" * Runs the meter's program on the given lines and collects what it sends back.
 * @param {string[]} lines
 * @returns {Promise<MeterMsg[]>}
 */
function runMeter(lines) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [WORKER_FILE]);""", """ * Runs the meter's program on the given lines and collects what it sends back. It is started in euros unless told
 * otherwise.
 * @param {string[]} lines
 * @param {string[]} [args] what the meter is started with after its file: the currency to price in
 * @returns {Promise<MeterMsg[]>}
 */
function runMeter(lines, args = ['EUR']) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [WORKER_FILE, ...args]);
    child.stdin.on('error', () => {}); // a meter that stopped at once no longer reads what it is sent"""),
              ("test('bound minutes: whole number, 1 to 1440', async () => {", """test('the meter prices in the currency it is started with', async () => {
  const [a] = await runMeter([JSON.stringify({ kind: 'use', room: 'hall', minutes: 30 })], ['GBP']);
  if (a.kind !== 'reading') return assert.fail('expected a reading');
  assert.equal(a.cost.currency, 'GBP');
});

test('a meter started without a currency prices nothing', async () => {
  assert.deepEqual(await runMeter([JSON.stringify({ kind: 'use', room: 'hall', minutes: 30 })], []), []);
});

test('bound minutes: whole number, 1 to 1440', async () => {""")]},
       note="billing's meterUsage spawns [WORKER_FILE] with no argument: the meter stops at once, sends nothing, and billing's promise never settles; both of billing's meter tests fail.")

# ---------------------------------------------------------------------------------------------------------------
# W02: rule 19 (one message per line, nothing else on the channel) is checked only on writes that hold a
# JSON.stringify. The meter writes an empty line on standard output as soon as it is ready (a common readiness
# signal; readers that skip empty lines, as the meter's own test does, never notice). billing parses every line.

change(S, 'W02-meter-ready-line', "The meter writes an empty line as soon as it is ready, so that whoever started it can tell it has started; readers skip empty lines", 'meter',
       ['something other than a message written on a message channel, in a write that holds no JSON.stringify', "the sender's own test skips empty lines; a reader does not"],
       {ME: [(" * each one JSON on a line of its own. Both sides use the kinds written here.",
              " * each one JSON on a line of its own, after an empty line written as soon as it is ready (readers skip empty\n * lines). Both sides use the kinds written here.")],
        MEW: [("const lines = createInterface({ input: process.stdin });\n", r"""const lines = createInterface({ input: process.stdin });
// An empty line as soon as the meter is ready, so that whoever started it can tell it has started.
process.stdout.write('\n');
""")]},
       note="billing splits standard output on line ends and parses every line: JSON.parse('') throws inside its data handler, and its meter tests fail.")

# ---------------------------------------------------------------------------------------------------------------
# W03: rule 10 lets a method's errors be stated on the KIND (@throws {RangeError} quote ...); rule 29 checks a
# thrown kind only against @throws on the function or method itself. bookings states quote's errors on its handle
# (set-up Z06a), so the local function that throws states nothing and is never checked. The job makes an unknown
# room an Error (Z06's honest reason) and forgets the @throws line on the kind, fifty lines up.

change(S, 'W03-error-stated-on-kind-not-checked', "An unknown room is refused with an Error, not a RangeError (it is not a value out of bounds); the @throws line on the handle is forgotten", 'bookings',
       ['kind of error changed in code, the @throws line on the kind not', 'rule 29 checks only errors stated on the function or method itself'],
       {BO: [("    if (!room) throw new RangeError(`bookings: unknown room: ${roomId}`);",
              "    if (!room) throw new Error(`bookings: unknown room: ${roomId}`); // an unknown room is not a value out of bounds")],
        BOT: [("  assert.throws(() => bookings.open(req({ room: 'attic' })), RangeError);",
               "  assert.throws(() => bookings.open(req({ room: 'attic' })), /unknown room/);")]},
       before=['setups/Z06a-bookings-states-quote-errors', 'setups/Z06b-billing-expects-range-error'],
       note="Bookings still states '@throws {RangeError} quote when the room is unknown'. billing's estimate test expects bookings' RangeError for an unknown room and now gets an Error.")

# ---------------------------------------------------------------------------------------------------------------
# W04: rule 10 lets a method's errors be stated "on the method's own comment where the object is built", and the
# listing reads @throws from there. It reads @bound only from kinds and functions. Set-up: bookings states open's
# errors where the object is built. The change: open newly refuses a long note, and the job writes the new bound in
# that same comment, with a test named for it. Check (d) is satisfied; no listed entry carries the line.

change('setups', 'W04a-bookings-states-open-errors', "bookings states the errors of open on the method where the object is built (rule 10)", 'bookings',
       ['errors of a handle method stated where the object is built (the standing state)'],
       {BO: [("    open(req) {\n      const first = parseDay(req.day);", """    /**
     * @throws {RangeError} when the request is outside its bounds or names an unknown room
     */
    open(req) {
      const first = parseDay(req.day);""")]})

change(S, 'W04-bound-on-built-method', "A booking's note is at most 140 characters, since it is sent to the caretaker in a text message; the bound is stated with open's errors, where the object is built", 'bookings',
       ['newly refused, with a new bound line and its test', 'the bound line is written where rule 10 lets errors be stated; the listing reads only @throws there'],
       {BO: [("""    /**
     * @throws {RangeError} when the request is outside its bounds or names an unknown room
     */
    open(req) {
      const first = parseDay(req.day);""", """    /**
     * A note is sent to the caretaker in a text message, so it is kept short.
     * @bound req.note: at most 140 characters
     * @throws {RangeError} when the request is outside its bounds or names an unknown room
     */
    open(req) {
      if (req.note !== undefined && req.note.length > 140) throw new RangeError('bookings: a note may be at most 140 characters');
      const first = parseDay(req.day);""")],
        BOT: [("test('cancel closes an open booking once; unknown rooms and bookings are refused', () => {", """test('bound req.note: at most 140 characters', () => {
  const { bookings } = system();
  assert.equal(bookings.open(req({ note: 'n'.repeat(140) })).note?.length, 140);
  assert.throws(() => bookings.open(req({ note: 'n'.repeat(141) })), RangeError);
});

test('cancel closes an open booking once; unknown rooms and bookings are refused', () => {""")]},
       before=['setups/W04a-bookings-states-open-errors'],
       note="front passes a person's note through to bookopen and states no bound on it; billing's and reports' tests open bookings without notes.")

# ---------------------------------------------------------------------------------------------------------------
# W05: rule 28 (a module imports only another module's interface files) is checked on import and export
# statements. A dynamic import() is an expression. Set-up: bookings keeps its price list in src/prices.mjs (V06a);
# the front desk reads it with import() the first time the price menu is asked for. The change: the price list is
# kept in euros, as the venue's price sheet writes it.

change('setups', 'W05b-front-price-menu-loaded-later', "The front desk shows the price list, reading it the first time the menu is asked for", 'front',
       ["a user that reaches a provider file outside the provider's interface with import() (the standing state)"],
       {FR: [(" * @property {() => string[]} kindsMenu one line per kind of room\n",
              " * @property {() => string[]} kindsMenu one line per kind of room\n * @property {() => Promise<string[]>} priceMenu one line per kind of room, with the price of a seat for a night\n"),
             ("""    kindsMenu() {
      return ROOM_KINDS.map((k) => titleCase(k));
    },""", """    kindsMenu() {
      return ROOM_KINDS.map((k) => titleCase(k));
    },
    async priceMenu() {
      // The price list is read the first time the menu is asked for, not when the front desk starts.
      const { SEAT_NIGHT_CENTS } = await import('../../bookings/src/prices.mjs');
      return ROOM_KINDS.map((k) => `${titleCase(k)}: ${(SEAT_NIGHT_CENTS[k] / 100).toFixed(2)} EUR a seat a night`);
    },""")],
        FRT: [("test('the room menu lists rooms with their seats', async () => {", r"""test('the price menu has one line per kind, each with a price', async () => {
  const menu = await system().priceMenu();
  assert.equal(menu.length, 3);
  for (const line of menu) assert.match(line, /^[A-Z]\w*: \d+\.\d\d EUR a seat a night$/);
});

test('the room menu lists rooms with their seats', async () => {""")]},
       before=['setups/V06a-bookings-price-list'])

change(S, 'W05-price-list-in-euros', "bookings' price list is kept in euros, as the venue's price sheet writes it, and renamed SEAT_NIGHT_EUROS to say so", 'bookings',
       ['a provider changes a file outside its interface', "a user reaches that file with import(), which rule 28's check does not look at"],
       {BOP: """/**
 * The price list bookings works from, kept apart so that the venue's prices can be read in one place.
 */
/** @import { RoomKind } from '../../rooms/src/index.mjs' */

/**
 * The price of one seat for one night, in euros, by kind of room, as the venue's price sheet writes it.
 * @type {Readonly<Record<RoomKind, number>>}
 */
export const SEAT_NIGHT_EUROS = Object.freeze({ hall: 15, studio: 15, kitchen: 15 });
""",
        BO: [("import { SEAT_NIGHT_CENTS } from './prices.mjs';\n", "import { SEAT_NIGHT_EUROS } from './prices.mjs';\n"),
             ("export const PRICE_PER_SEAT_NIGHT = SEAT_NIGHT_CENTS.hall;", "export const PRICE_PER_SEAT_NIGHT = SEAT_NIGHT_EUROS.hall * 100;"),
             ("    return amount(SEAT_NIGHT_CENTS[room.kind] * party * nights, 'EUR');",
              "    return amount(SEAT_NIGHT_EUROS[room.kind] * 100 * party * nights, 'EUR');")]},
       before=['setups/V06a-bookings-price-list', 'setups/W05b-front-price-menu-loaded-later'],
       note="front's priceMenu takes SEAT_NIGHT_CENTS out of the module it imports: it is undefined, the menu rejects with a TypeError, and front's price menu test fails.")

# ---------------------------------------------------------------------------------------------------------------
# W06: rule 33 says an added overload that keeps every old signature only accepts more, and then skips the
# backstop. TypeScript answers a call with the FIRST overload that fits. The job puts the new list form (one line
# per amount) before the old one, and keeps the old one after it "so that every call written for it is still
# accepted": every old (parameters, answer) pair is still in the list, and no old call reaches it.

change(S, 'W06-old-overload-kept-behind', "formatAmount's list form hands back one line per amount; the old joined form is kept as a later overload, so that calls written for it are still accepted", 'money',
       ['a new overload placed before an old one with the same parameters', "rule 33 compares the set of signatures, not which one a call reaches"],
       {MO: [(""" * Writes several amounts for people to read, one after another, joined by " + ".
 * @overload
 * @param {Amount[]} list
 * @returns {string}
 */
/**
 * Writes one amount, or several, for people to read.
 * @param {Amount | Amount[]} a
 * @returns {string}
 */
export function formatAmount(a) {
  if (Array.isArray(a)) return a.map((x) => formatAmount(x)).join(' + ');""", """ * Writes several amounts for people to read, one line each, so that the caller can lay them out.
 * @overload
 * @param {Amount[]} list
 * @returns {string[]}
 */
/**
 * Writes several amounts for people to read, one after another, joined by " + ". Kept, so that every call written
 * for it is still accepted.
 * @overload
 * @param {Amount[]} list
 * @returns {string}
 */
/**
 * Writes one amount, or several, for people to read.
 * @param {Amount | Amount[]} a
 * @returns {string | string[]}
 */
export function formatAmount(a) {
  if (Array.isArray(a)) return a.map((x) => formatAmount(x));""")],
        MOT: [("""test('formatAmount writes several amounts joined by +', () => {
  assert.equal(formatAmount([amount(100, 'EUR'), amount(250, 'EUR')]), 'EUR 1.00 + EUR 2.50');
});""", """test('formatAmount writes several amounts, one line each', () => {
  assert.deepEqual(formatAmount([amount(100, 'EUR'), amount(250, 'EUR')]), ['EUR 1.00', 'EUR 2.50']);
});""")]},
       before=['setups/Z08a-money-formats-lists', 'setups/Z08b-billing-lists-instalments'],
       note="billing writes formatAmount(parts) into its invoice text: the call reaches the first list overload, a list of lines comes out joined by commas, and billing's invoice test fails.")

# ---------------------------------------------------------------------------------------------------------------
# W07: rule 29 compares a thrown kind with the TEXT of each @throws kind. A union, {TypeError|RangeError}, is one
# text that matches neither kind. slugify refuses a value that is not text with a TypeError, as the language's own
# functions do, and says so with a union in its one @throws line.

change(S, 'W07-throws-union', "slugify refuses a value that is not text with a TypeError, as the language's own functions do; its @throws line names both kinds", 'text-rules',
       ['a @throws line written with a union of kinds', 'a new kind of error for a value outside the kind (hands back differently)'],
       {TR: [(""" * @throws {RangeError} when text is outside its bound
 */
export function slugify(text) {
  if (typeof text !== 'string' || text.length < 1 || text.length > SLUG_MAX) {""", """ * @throws {TypeError|RangeError} TypeError when text is not text at all; RangeError when it is outside its bound
 */
export function slugify(text) {
  if (typeof text !== 'string') throw new TypeError('slugify: text must be a string');
  if (text.length < 1 || text.length > SLUG_MAX) {""")],
        TRT: [("test('slugify keeps the words in order, joined by hyphens', () => {", """test('slugify refuses a value that is not text with a TypeError', () => {
  assert.throws(() => slugify(/** @type {any} */ (12)), TypeError);
});

test('slugify keeps the words in order, joined by hyphens', () => {""")]},
       note="Every throw in slugify is a kind its comment states.")

# ---------------------------------------------------------------------------------------------------------------
# W08: rule 14 refuses a cast that turns a value of a known kind into a product kind it is not. A cast is also how
# JSDoc says "this is there": a Map's get after its has. Iteration 5 made "possibly missing" from Map.get "cannot
# tell"; the cast that says the same thing out loud is refused.

change(S, 'W08-cast-after-has', "rooms gains pick: the rooms with the given ids, in the order given; an id with no room is refused", 'rooms',
       ['new handle method (new entry)', "honest cast of a Map's get after its has, which drops 'undefined'"],
       {RO: [(" * @property {(kind?: RoomKind) => Room[]} list rooms, only of one kind when it is given, in name order\n */",
              " * @property {(kind?: RoomKind) => Room[]} list rooms, only of one kind when it is given, in name order\n"
              " * @property {(ids: string[]) => Room[]} pick the rooms with the given ids, in the order given\n"
              " * @throws {RangeError} pick when an id names no room\n */"),
             ("""      return rec ? /** @type {Room} checks nothing: the store holds only Rooms in this table */ (rec.value) : undefined;
    },""", """      return rec ? /** @type {Room} checks nothing: the store holds only Rooms in this table */ (rec.value) : undefined;
    },
    pick(ids) {
      /** @type {Map<string, Room>} */
      const byId = new Map();
      for (const rec of store.list('rooms')) byId.set(rec.id, /** @type {Room} the store holds only Rooms in this table */ (rec.value));
      const missing = ids.find((id) => !byId.has(id));
      if (missing !== undefined) throw new RangeError(`rooms: unknown room: ${missing}`);
      return ids.map((id) => /** @type {Room} every id is in byId: checked just above */ (byId.get(id)));
    },""")],
        ROT: [("test('roomlist operation answers with the rooms of a kind', () => {", """test('pick hands back the rooms with the given ids, in the order given', () => {
  const rooms = fresh();
  rooms.add({ name: 'Hall', kind: 'hall', seats: 80 });
  rooms.add({ name: 'Kitchen', kind: 'kitchen', seats: 8 });
  assert.deepEqual(rooms.pick(['kitchen', 'hall']).map((r) => r.name), ['Kitchen', 'Hall']);
  assert.throws(() => rooms.pick(['hall', 'attic']), RangeError);
});

test('roomlist operation answers with the rooms of a kind', () => {""")]})

# ---------------------------------------------------------------------------------------------------------------
# W09: rule 2's check asks whether the value written to a table is assignable to the row kind. A row written in
# place, { ...b, state: 'cancelled' }, is read by the reader with state widened to text (the store's put takes
# unknown, which gives the literal no kind to keep): a valid Booking is refused as "not a Booking".

change(S, 'W09-row-written-in-place', "cancel writes the cancelled booking in one step and hands back what the store now holds", 'bookings',
       ['a row written in place with a spread and one changed field', "the reader widens a literal written where 'unknown' is expected"],
       {BO: [("""      /** @type {Booking} builds a Booking */
      const done = { ...b, state: 'cancelled' };
      store.put('bookings', id, done);
      return done;""", """      const rec = store.put('bookings', id, { ...b, state: 'cancelled' });
      return /** @type {Booking} the store holds only Bookings in this table */ (rec.value);""")]})

# ---------------------------------------------------------------------------------------------------------------
# W10: rule 3 refuses every JSON.parse whose result is not given a @message kind, except a copy. Reading a file of
# settings is not a message between running parts. text-rules reads the names the venue keeps for itself from a JSON
# file its staff keep.

change(S, 'W10-json-settings-file', "text-rules gains isReservedName: whether a name is one the venue keeps for itself, read from reserved.json, which the venue's staff keep", 'text-rules',
       ['new function (new entry)', 'honest JSON.parse of a settings file, which is not a message'],
       {'text-rules/src/reserved.json': '["admin", "staff", "new", "all"]\n',
        TR: [(""" * Small rules for text that several modules share.
 */
""", """ * Small rules for text that several modules share.
 */
import { readFileSync } from 'node:fs';
"""),
             ("const SLUG_MAX = 80;\n", """const SLUG_MAX = 80;

/** The names the venue keeps for itself, lower-case, read once from reserved.json, which the venue's staff keep. */
const RESERVED = new Set(/** @type {string[]} */ (JSON.parse(readFileSync(new URL('./reserved.json', import.meta.url), 'utf8'))));
"""),
             ("""/**
 * Upper-cases the first letter of each word and leaves the rest alone.""", """/**
 * Says whether a name is one the venue keeps for itself, written in any case, with spaces around it or not.
 * @param {string} text
 * @returns {boolean}
 */
export function isReservedName(text) {
  return typeof text === 'string' && RESERVED.has(text.trim().toLowerCase());
}

/**
 * Upper-cases the first letter of each word and leaves the rest alone.""")],
        TRT: [("import { slugify, isEmail, titleCase } from '../src/index.mjs';", "import { slugify, isEmail, titleCase, isReservedName } from '../src/index.mjs';"),
              ("test('titleCase upper-cases the first letter of each word', () => {", """test('isReservedName recognises the names the venue keeps', () => {
  assert.equal(isReservedName('Admin'), true);
  assert.equal(isReservedName(' staff '), true);
  assert.equal(isReservedName('Main Hall'), false);
});

test('titleCase upper-cases the first letter of each word', () => {""")]})

# ---------------------------------------------------------------------------------------------------------------
# W11: rules 5 and 30 refuse any JSON.stringify written to a standard stream unless it is of a @message kind for
# that stream. A log line on the error stream, for the venue's operators, is not a message between running parts.

change(S, 'W11-structured-log-line', "The door writes one line of JSON to the error stream for each call it cannot carry, for the venue's operators", 'door',
       ['a structured log line written with console.error', 'no kind changes'],
       {DO: [("    if (typeof h !== 'function') throw new Error(`door: unknown operation: ${op}`);", """    if (typeof h !== 'function') {
      // The venue's operators collect the error stream: one line of JSON for each call the door cannot carry.
      console.error(JSON.stringify({ event: 'unknown-operation', op }));
      throw new Error(`door: unknown operation: ${op}`);
    }""")]})

# ---------------------------------------------------------------------------------------------------------------
# W12: Node's way of giving an error a code (err.code = '...') is a property the language's Error kind does not
# have. The reader complains (2339); the check files it as a comment disagreeing with the code, though no comment is
# involved and the code is right.

change(S, 'W12-error-code', "add's error for currencies that differ carries a code, so that a caller can tell it from an amount out of bounds without reading the message", 'money',
       ["honest Node idiom: a code set on an error before it is thrown", 'kinds of error unchanged'],
       {MO: [(" * @throws {RangeError} when the currencies differ or the sum is outside the bound of cents\n */\nexport function add(a, b) {\n  if (a.currency !== b.currency) throw new RangeError('add: currencies differ');",
              " * @throws {RangeError} when the currencies differ (its code is then MONEY_CURRENCIES_DIFFER) or the sum is outside the bound of cents\n */\nexport function add(a, b) {\n"
              "  if (a.currency !== b.currency) {\n"
              "    const err = new RangeError(`add: currencies differ: ${a.currency} and ${b.currency}`);\n"
              "    err.code = 'MONEY_CURRENCIES_DIFFER';\n"
              "    throw err;\n"
              "  }")],
        MOT: [("  assert.throws(() => add(amount(1, 'EUR'), amount(1, 'USD')), RangeError);",
               "  assert.throws(() => add(amount(1, 'EUR'), amount(1, 'USD')), { name: 'RangeError', code: 'MONEY_CURRENCIES_DIFFER' });")]})

# ---------------------------------------------------------------------------------------------------------------
# W13: the backstop prints a kind's members in the order they are written; the tool's own form sorts them. Booking's
# comment lists its fields in a new order. Nothing else changes.

change(S, 'W13-fields-reordered', "Booking's comment lists its fields in the order the front desk reads a booking out; nothing else changes", 'bookings',
       ["a kind's @property lines reordered", 'the printed declaration keeps the written order'],
       {BO: [(""" * A booking.
 * @typedef {Object} Booking
 * @property {string} id
 * @property {string} room the room's id
 * @property {string} day the first night, YYYY-MM-DD
 * @property {string} until the morning after the last night, YYYY-MM-DD
 * @property {number} nights
 * @property {number} party how many people
 * @property {'open' | 'cancelled'} state
 * @property {Amount} total what the booking costs
 * @property {string} [note]""", """ * A booking, its fields in the order the front desk reads one out.
 * @typedef {Object} Booking
 * @property {string} id
 * @property {'open' | 'cancelled'} state
 * @property {string} room the room's id
 * @property {string} day the first night, YYYY-MM-DD
 * @property {string} until the morning after the last night, YYYY-MM-DD
 * @property {number} nights
 * @property {number} party how many people
 * @property {string} [note]
 * @property {Amount} total what the booking costs""")]})

# ---------------------------------------------------------------------------------------------------------------
# W14: iteration 5 writes a plain kind of the module out where it is used, in brackets, and takes the brackets off
# again only around a union. A list kind given a name comes out as "(Amount[])" where "Amount[]" was.

change(S, 'W14-list-kind-named', "The parts splitEvenly hands back get a name of their own, Parts; every kind the same", 'money',
       ['a list kind written in place is given a name', "the backstop's brackets are removed only around unions"],
       {MO: [("""/**
 * Splits an amount into equal parts""", """/**
 * The parts an amount is split into, in order; they add up to it exactly.
 * @typedef {Amount[]} Parts
 */

/**
 * Splits an amount into equal parts"""),
             (" * @returns {Amount[]}\n * @bound parts: whole number, 1 to 100", " * @returns {Parts}\n * @bound parts: whole number, 1 to 100")]})

# ---------------------------------------------------------------------------------------------------------------
# W15: the backstop prints each exported name's statement. Moving a module's exports to one list at the end of the
# file (export { a, b, c }) changes every printed statement, and every later export added to the list changes them
# all again.

change(S, 'W15-export-list', "text-rules lists what it exports at the end of the file, so that a reader sees its interface in one place", 'text-rules',
       ['exports moved to one export list', 'every kind and every function the same'],
       {TR: [("export function slugify(text) {", "function slugify(text) {"),
             ("export function isEmail(text) {", "function isEmail(text) {"),
             ("export function titleCase(text) {", "function titleCase(text) {"),
             (r"""  return text.replace(/\b([a-z])/g, (m) => m.toUpperCase());
}
""", r"""  return text.replace(/\b([a-z])/g, (m) => m.toUpperCase());
}

export { slugify, isEmail, titleCase };
""")]})

# ---------------------------------------------------------------------------------------------------------------
# W16: a bound line on a handle kind belongs to the member its first word names, and to every member when it names
# none. The store gains a method named id, which hands out a fresh id. Its bound line "id: 1 to 120 characters",
# which named no member, now names one: it leaves get, list, put and remove. A new entry tells no one by rule 3; the
# tool sees a changed bound on four methods. (It also stops carrying the id bound on them from now on.)

change(S, 'W16-store-gains-id', "The store hands out a fresh id for a new record of a table: the first whole number, written as text, that no record of it has", 'store',
       ['new handle method (new entry)', "its name is the first word of a bound line that belonged to every member"],
       {ST: [(" * @property {(table: string, id: string) => boolean} remove says whether there was a record to remove\n",
              " * @property {(table: string, id: string) => boolean} remove says whether there was a record to remove\n"
              " * @property {(table: string) => string} id a fresh id for a new record of a table: the first whole number, written as text, that no record of it has\n"),
             (" * @carriestable get list put remove\n", " * @carriestable get list put remove id\n"),
             ("""    remove(table, id) {
      checkNames(table, id);
      return tableOf(table).delete(id);
    },
""", """    remove(table, id) {
      checkNames(table, id);
      return tableOf(table).delete(id);
    },
    id(table) {
      checkNames(table);
      const t = tableOf(table);
      let n = 1;
      while (t.has(String(n))) n++;
      return String(n);
    },
""")],
        STT: [("test('seededStore holds the given records', () => {", """test('id hands out an id that no record of the table has', () => {
  const s = createStore();
  assert.equal(s.id('t'), '1');
  s.put('t', '1', 0);
  s.put('t', '2', 0);
  assert.equal(s.id('t'), '3');
  assert.equal(s.get('t', s.id('t')), undefined);
});

test('seededStore holds the given records', () => {""")]})

# ---------------------------------------------------------------------------------------------------------------
# W17: rule 26 counts the constants a bound test imports from its own module, by name. A test that reads the module
# as a namespace (money.MAX_CENTS) holds no value the fingerprint sees. Set-up: money publishes its largest amount and
# its tests read it through the namespace. The change: the largest amount drops; the bound line is forgotten.

change('setups', 'W17a-money-tests-read-max-through-namespace', "money publishes its largest amount, MAX_CENTS, and its tests read the limit as money.MAX_CENTS", 'money',
       ['a bound test reads its limit from the module under test, imported as a namespace (the standing state)'],
       {MO: [("const MAX_CENTS = 10_000_000;\n", "/** The largest amount there may be, in cents. */\nexport const MAX_CENTS = 10_000_000;\n")],
        MOT: [("import { amount, add, formatAmount, splitEvenly, CURRENCIES } from '../src/index.mjs';",
               "import { amount, add, formatAmount, splitEvenly, CURRENCIES } from '../src/index.mjs';\nimport * as money from '../src/index.mjs';"),
              ("  assert.equal(amount(10_000_000, 'EUR').cents, 10_000_000);", "  assert.equal(amount(money.MAX_CENTS, 'EUR').cents, money.MAX_CENTS);"),
              ("  assert.throws(() => amount(10_000_001, 'EUR'), RangeError);", "  assert.throws(() => amount(money.MAX_CENTS + 1, 'EUR'), RangeError);"),
              ("  assert.throws(() => add(amount(10_000_000, 'EUR'), amount(1, 'EUR')), RangeError);",
               "  assert.throws(() => add(amount(money.MAX_CENTS, 'EUR'), amount(1, 'EUR')), RangeError);")]})

change(S, 'W17-limit-read-through-namespace', "An amount may now be at most 500,000 cents, the most the venue's payment provider takes in one payment; MAX_CENTS changed, the bound line forgotten", 'money',
       ['bound changed in code, bound line not', 'the bound test reads its limit through a namespace import, which the fingerprint does not follow'],
       {MO: [("/** The largest amount there may be, in cents. */\nexport const MAX_CENTS = 10_000_000;\n",
              "/** The largest amount there may be, in cents: the most the venue's payment provider takes in one payment. */\nexport const MAX_CENTS = 500_000;\n")]},
       before=['setups/W17a-money-tests-read-max-through-namespace'],
       note="bookings' bound party test opens a booking for 200 people for 2 nights, 600,000 cents: amount now refuses it.")
