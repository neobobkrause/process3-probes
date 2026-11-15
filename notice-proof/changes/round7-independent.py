# Round 7: an independent adversary's series against the sixth design (notes/iteration-6-design.md), written before
# anything was run on it. Each change is one commit's worth of edits to ONE provider (and that provider's own tests
# where its job would keep them true to its rules). Set-ups (series 'setups', ids U..-...) put the product in a
# state that both "before" and "after" share. Read by changes/make.py.
#
# The sixth design is silent about an entry only when its own comparison finds nothing AND TypeScript's printed
# declaration is the same; its checks enforce rules of form by spotting particular spellings. This round aims at:
#   break a user, untold, nothing stops it:  U01 U02 (the rows rule reads only literal names of owned tables)
#                                            U03 (rule 36 looks only at `throw new X`)
#                                            U04 (rules 19/35 follow variables, not named functions)
#                                            U05 (rule 34 looks only at the spelling process.env / process.argv)
#                                            U06 (a bound test's limit read from a JSON file of its own module)
#                                            U07 (what a handed-out method needs of its receiver is in no kind)
#                                            U08 (parameter names are left out, so a reorder of same-kind
#                                                 parameters is invisible)
#                                            U09 (rules 28/38 look only at import and import(), not at a file read)
#                                            U10 (members of a renamed handle kind are never compared)
#   the check refuses honest code:           U11 U12 (the tool's own description of Node is incomplete)
#                                            U13 (a subclass of a stated error kind is not that kind)
#   the method tells for nothing:            U14 U15 (the backstop prints spellings) U16 (a bound test's checks
#                                                 are compared by name, and equal is strictEqual under assert/strict)
S = 'round7-independent'
TR, MO, ST, RO, BO, DO, ME = ('text-rules/src/index.mjs', 'money/src/index.mjs', 'store/src/index.mjs',
                              'rooms/src/index.mjs', 'bookings/src/index.mjs', 'door/src/index.mjs',
                              'meter/src/index.mjs')
TRT, MOT, ROT, BOT, MET, STT = ('text-rules/test/index.test.mjs', 'money/test/index.test.mjs',
                                'rooms/test/index.test.mjs', 'bookings/test/index.test.mjs',
                                'meter/test/index.test.mjs', 'store/test/index.test.mjs')
MEW = 'meter/src/worker.mjs'
STX = 'store/src/testing.mjs'
MOJ = 'money/src/limits.json'
BOJ = 'bookings/src/prices.json'
BI, BIT = 'billing/src/index.mjs', 'billing/test/index.test.mjs'
FR, FRT = 'front/src/index.mjs', 'front/test/index.test.mjs'
RET = 'reports/test/index.test.mjs'

# ---------------------------------------------------------------------------------------------------------------
# U01: rule 2 (iteration 2) gives a shared table's rows one written kind, owned by the module that writes them, and
# the check refuses a write to an OWNED table with a value of another kind. It does not refuse a write to a table
# nobody owns, nor an owner's mark that names a table its module no longer writes. The job moves bookings' rows to a
# table named for the version of their shape (an ordinary way to keep an older version's rows from being read as
# current ones) and forgets the @storedrows line on Booking, eighty lines up. The rows are still Bookings.

change(S, 'U01-table-renamed-mark-forgotten', "Bookings' rows go into the table bookings-2, named for the version of their shape, so that rows an older version wrote are never read as current ones; the @storedrows mark is forgotten", 'bookings',
       ['the table a module writes is renamed in its code', 'its @storedrows mark still names the old table', 'a write to a table nobody owns is not refused'],
       {BO: [(" * Bookings of rooms for one or more nights.\n */",
              " * Bookings of rooms for one or more nights. Their rows are kept in the store's table bookings-2: a table named\n * for the version of the rows' shape, so that rows an older version wrote are never read as current ones.\n */"),
             ("    const rec = store.get('bookings', id);", "    const rec = store.get('bookings-2', id);"),
             ("      store.put('bookings', b.id, b);", "      store.put('bookings-2', b.id, b);"),
             ("      store.put('bookings', id, done);", "      store.put('bookings-2', id, done);")]},
       note="reports reads source.list('bookings'), which is now empty: its first test (counts by state) fails. bookings' listing is unchanged (table:bookings still comes from the forgotten mark), so reports, which the tool cannot follow, is not told either.")

# ---------------------------------------------------------------------------------------------------------------
# U02: the rows rule reads the table's name from the argument as written; a name held in a constant is "not
# readable", and the rule is then skipped altogether (check.mjs: `c.member === 'put' && c.names`). Hoisting a
# repeated literal into a constant is an ordinary tidy-up. In the same job bookings keeps its rows without the first
# day (worked out from until and nights when read), as in A01: the row written is not a Booking.

change(S, 'U02-table-name-in-constant-rows-compact', "bookings names its table once, in a constant, and keeps each row without its first day, which is worked out from until and nights when the row is read", 'bookings',
       ['a table name held in a constant', 'rows written are not of the owned kind', 'the rows rule is skipped when the name is not a literal'],
       {BO: [("""/**
 * Refuses a party or a number of nights outside its bound.""", """/** The table bookings keeps its rows in. */
const TABLE = 'bookings';

/**
 * A booking as its row is kept: without its first day, which is worked out from until and nights when the row is
 * read, so that a row cannot hold a first day and a last morning that disagree.
 * @param {Booking} b
 */
function toRow(b) {
  const { day, ...row } = b;
  return row;
}

/**
 * A booking read back from its row.
 * @param {unknown} value what the store holds for a booking
 * @returns {Booking}
 */
function fromRow(value) {
  const row = /** @type {Omit<Booking, 'day'>} the store holds only rows written by toRow in this table */ (value);
  /** @type {Booking} builds a Booking */
  const b = { ...row, day: formatDay(addDays(parseDay(row.until), -row.nights)) };
  return b;
}

/**
 * Refuses a party or a number of nights outside its bound."""),
             ("""    const rec = store.get('bookings', id);
    return rec ? /** @type {Booking} */ (rec.value) : undefined;""", """    const rec = store.get(TABLE, id);
    return rec ? fromRow(rec.value) : undefined;"""),
             ("      store.put('bookings', b.id, b);", "      store.put(TABLE, b.id, toRow(b));"),
             ("      store.put('bookings', id, done);", "      store.put(TABLE, id, toRow(done));")]},
       note="reports reads each booking row's day: parseDay(undefined) throws, and reports' first test fails. bookings' listing is unchanged (toRow, fromRow and TABLE are not exported).")

# ---------------------------------------------------------------------------------------------------------------
# U03: rule 36 refuses a thrown kind that is not stated, but the check looks only at `throw new X`. Node's own way of
# giving an error a code is `throw Object.assign(new Error(msg), { code })`. Set-up Z06a states quote's errors on the
# handle (@throws {RangeError} quote ...); Z06b has billing expect bookings' RangeError for an unknown room. The job
# refuses an unknown room with a coded Error (Z06's honest reason) and forgets the @throws line on the kind.

change(S, 'U03-coded-error-through-object-assign', "An unknown room is refused with an Error whose code says so (BOOKINGS_UNKNOWN_ROOM), not a RangeError: it is not a value out of bounds; the @throws line on the handle is forgotten", 'bookings',
       ['kind of error changed in code, the stated kind not', 'the error is thrown as Object.assign(new Error(...), {code})', 'rule 36 checks only throw new X'],
       {BO: [("    if (!room) throw new RangeError(`bookings: unknown room: ${roomId}`);",
              "    // An unknown room is not a value out of bounds: it is refused with an Error whose code says what was wrong.\n    if (!room) throw Object.assign(new Error(`bookings: unknown room: ${roomId}`), { code: 'BOOKINGS_UNKNOWN_ROOM' });")],
        BOT: [("  assert.throws(() => bookings.open(req({ room: 'attic' })), RangeError);",
               "  assert.throws(() => bookings.open(req({ room: 'attic' })), { code: 'BOOKINGS_UNKNOWN_ROOM' });")]},
       before=['setups/Z06a-bookings-states-quote-errors', 'setups/Z06b-billing-expects-range-error'],
       note="Bookings still states '@throws {RangeError} quote when the room is unknown'. billing's estimate test (Z06b) expects bookings' RangeError for an unknown room and now gets an Error.")

# ---------------------------------------------------------------------------------------------------------------
# U04: rules 19 and 35 (one message per line; a stream that carries messages carries only messages) look for
# JSON.stringify in what a write is handed, following variables set in the same file. A named function is not a
# variable: when the meter encodes its messages in `function encode(msg)`, no write holds a message as far as the
# check can see, so neither rule has anything to look at. The job writes an empty line after each message, for
# people reading the meter's output (Z03's honest reason), and says so in the prose.

change(S, 'U04-messages-encoded-by-named-function', "The meter writes an empty line after each message, so that people reading its output can tell one message from the next; the encoding is one named function", 'meter',
       ['something other than a message written on a message channel', 'the message is encoded by a function declaration, which the check does not follow'],
       {ME: [(" * each one JSON on a line of its own. Both sides use the kinds written here.",
              " * each one JSON on a line of its own, followed by an empty line so that people reading the output can tell one\n * message from the next. Both sides use the kinds written here.")],
        MEW: [(r"""/** @param {MeterMsg} msg */
const send = (msg) => process.stdout.write(JSON.stringify(msg) + '\n');""", r"""/**
 * One message as the meter writes it: JSON on a line of its own, then an empty line, so that people reading the
 * meter's output can tell one message from the next.
 * @param {MeterMsg} msg
 * @returns {string}
 */
function encode(msg) {
  return JSON.stringify(msg) + '\n\n';
}

/** @param {MeterMsg} msg */
const send = (msg) => process.stdout.write(encode(msg));""")]},
       note="The meter's own test skips empty lines (filter(Boolean)) and passes. billing splits standard output on line ends and parses every line: JSON.parse('') throws in its data handler, and its meter tests fail.")

# ---------------------------------------------------------------------------------------------------------------
# U05: rule 34 (how a running part is started is a message too) is checked on the spelling `process.env` /
# `process.argv`. `import { env } from 'node:process'` is the idiomatic modern spelling, and the reader, which has no
# description of node:process, only "cannot tell". The meter now prices in the currency the venue sets in
# METER_CURRENCY and will not start without it. Its own test helper sets it, in euros unless told otherwise (a
# default parameter, which the minutes bound test's fingerprint does not see).

change(S, 'U05-start-environment-through-node-process', "The meter prices in the currency the venue sets in METER_CURRENCY in its environment, and will not start without one", 'meter',
       ['a newly required setting to start a separately running part', 'the environment read through import { env } from node:process', 'rule 34 matches only process.env and process.argv'],
       {ME: [(""" * The meter: a separately running program that prices the minutes rooms were used.
 * It is sent MeterInput lines on its standard input and answers with MeterMsg lines on its standard output,
 * each one JSON on a line of its own. Both sides use the kinds written here.""", """ * The meter: a separately running program that prices the minutes rooms were used.
 * It prices in the currency the venue sets in METER_CURRENCY in its environment, and will not start without one.
 * It is sent MeterInput lines on its standard input and answers with MeterMsg lines on its standard output,
 * each one JSON on a line of its own. Both sides use the kinds written here.""")],
        MEW: [("""import { createInterface } from 'node:readline';
import { amount } from '../../money/src/index.mjs';
import { RATE_CENTS_PER_MINUTE } from './index.mjs';
/** @import { MeterInput, MeterMsg } from './index.mjs' */

let count = 0;""", """import { createInterface } from 'node:readline';
import { env } from 'node:process';
import { amount, CURRENCIES } from '../../money/src/index.mjs';
import { RATE_CENTS_PER_MINUTE } from './index.mjs';
/** @import { MeterInput, MeterMsg } from './index.mjs' */
/** @import { Currency } from '../../money/src/index.mjs' */

/**
 * The currency the meter prices in, as the venue sets it in METER_CURRENCY in the meter's environment. A meter started
 * without one stops at once, since a price in a currency nobody chose is worse than none.
 * @returns {Currency}
 * @throws {RangeError} when METER_CURRENCY is not one of CURRENCIES
 */
function currencyToPriceIn() {
  for (const c of CURRENCIES) if (c === env.METER_CURRENCY) return c;
  throw new RangeError(`meter: set METER_CURRENCY to the currency to price in, one of ${CURRENCIES.join(', ')}`);
}

const currency = currencyToPriceIn();
let count = 0;"""),
              ("cost: amount(input.minutes * RATE_CENTS_PER_MINUTE, 'EUR') });", "cost: amount(input.minutes * RATE_CENTS_PER_MINUTE, currency) });")],
        MET: [("""import { spawn } from 'node:child_process';
import { WORKER_FILE } from '../src/index.mjs';""", """import { spawn } from 'node:child_process';
import { env } from 'node:process';
import { WORKER_FILE } from '../src/index.mjs';"""),
              (""" * Runs the meter's program on the given lines and collects what it sends back.
 * @param {string[]} lines
 * @returns {Promise<MeterMsg[]>}
 */
function runMeter(lines) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [WORKER_FILE]);""", """ * Runs the meter's program on the given lines and collects what it sends back. It prices in euros unless told
 * otherwise.
 * @param {string[]} lines
 * @param {string} [currency] what METER_CURRENCY is set to in the meter's environment
 * @returns {Promise<MeterMsg[]>}
 */
function runMeter(lines, currency = 'EUR') {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [WORKER_FILE], { env: { ...env, METER_CURRENCY: currency } });
    child.stdin.on('error', () => {}); // a meter that stopped at once no longer reads what it is sent"""),
              ("test('bound minutes: whole number, 1 to 1440', async () => {", """test('the meter prices in the currency it is started with', async () => {
  const [a] = await runMeter([JSON.stringify({ kind: 'use', room: 'hall', minutes: 30 })], 'GBP');
  if (a.kind !== 'reading') return assert.fail('expected a reading');
  assert.equal(a.cost.currency, 'GBP');
});

test('a meter started without a currency prices nothing', async () => {
  assert.deepEqual(await runMeter([JSON.stringify({ kind: 'use', room: 'hall', minutes: 30 })], ''), []);
});

test('bound minutes: whole number, 1 to 1440', async () => {""")]},
       note="billing's meterUsage spawns the meter with its own environment, which has no METER_CURRENCY: the meter stops at once, sends nothing, and billing's two meter tests fail (the promise never settles, or the write to the dead meter's input fails).")

# ---------------------------------------------------------------------------------------------------------------
# U06: rules 15, 26 and 42 compare a bound test by its (check, value) pairs, values held in named constants of its own
# file or of its module's source included. A value read from a JSON file of the module is not followed. Set-up:
# money reads its largest amount from limits.json (V08's honest change) and its tests read the limit from the same
# file, naming it once. The change lowers the limit in limits.json; the bound line is forgotten (W17's pattern).

change('setups', 'U06a-money-limit-in-json', "money reads its largest amount from limits.json, which the venue's treasurer keeps, and its tests read the limit from the same file", 'money',
       ['a limit kept in a JSON file of the module (the standing state)', "the bound test reads the limit from that file"],
       {MOJ: '{\n  "maxCents": 10000000\n}\n',
        MO: [(" * Amounts of money, held as whole cents with a currency code.\n */\n",
              " * Amounts of money, held as whole cents with a currency code.\n */\nimport limits from './limits.json' with { type: 'json' };\n"),
             ("const MAX_CENTS = 10_000_000;\n", "/** The largest amount, in cents, as the venue's treasurer has set it in limits.json. */\nconst MAX_CENTS = limits.maxCents;\n")],
        MOT: [("import { amount, add, formatAmount, splitEvenly, CURRENCIES } from '../src/index.mjs';",
               "import { amount, add, formatAmount, splitEvenly, CURRENCIES } from '../src/index.mjs';\nimport limits from '../src/limits.json' with { type: 'json' };"),
              ("  assert.equal(amount(10_000_000, 'EUR').cents, 10_000_000);", "  assert.equal(amount(limits.maxCents, 'EUR').cents, limits.maxCents);"),
              ("  assert.throws(() => amount(10_000_001, 'EUR'), RangeError);", "  assert.throws(() => amount(limits.maxCents + 1, 'EUR'), RangeError);"),
              ("  assert.throws(() => add(amount(10_000_000, 'EUR'), amount(1, 'EUR')), RangeError);", "  assert.throws(() => add(amount(limits.maxCents, 'EUR'), amount(1, 'EUR')), RangeError);")]})

change(S, 'U06-limit-lowered-in-json', "An amount may now be at most 500,000 cents, the most the venue's payment provider takes in one payment; limits.json changed, the bound line forgotten", 'money',
       ['bound changed in a JSON file the code and the bound test both read', 'the bound line not changed', "the bound test's fingerprint does not follow values read from JSON"],
       {MOJ: '{\n  "maxCents": 500000\n}\n',
        MO: [("/** The largest amount, in cents, as the venue's treasurer has set it in limits.json. */",
              "/** The largest amount, in cents, as the venue's treasurer has set it in limits.json: the most the venue's payment provider takes in one payment. */")]},
       before=['setups/U06a-money-limit-in-json'],
       note="money's tests pass (they read the limit). bookings' bound party test opens a booking of 200 people for 2 nights (600,000 cents), which amount now refuses: bookings' test fails. Amount's bound line still says 10,000,000.")

# ---------------------------------------------------------------------------------------------------------------
# U07: a handle's method is declared as a property holding a function, `(input: NewRoom) => Room`, which says it may
# be called on its own. Nothing in a kind says what a method needs of its receiver. Set-up: reports' tests add their
# rooms from one list with forEach(rooms.add). The change: add asks the handle's own find whether the slug is taken
# (this.find), so that rooms are read from the store in one place. Listing and declaration are the same.

change('setups', 'U07a-reports-adds-rooms-from-a-list', "reports' tests add their rooms from one list, handing rooms.add to forEach", 'reports',
       ["a handle's method handed on as a value, called without its handle (the standing state)"],
       {RET: [("import { summarize } from '../src/index.mjs';",
               "import { summarize } from '../src/index.mjs';\n/** @import { NewRoom } from '../../rooms/src/index.mjs' */"),
              ("""  const rooms = createRooms({ store });
  rooms.add({ name: 'Hall', kind: 'hall', seats: 100 });
  rooms.add({ name: 'Kitchen', kind: 'kitchen', seats: 8 });""", """  const rooms = createRooms({ store });
  /** @type {NewRoom[]} */
  const toAdd = [
    { name: 'Hall', kind: 'hall', seats: 100 },
    { name: 'Kitchen', kind: 'kitchen', seats: 8 },
  ];
  toAdd.forEach(rooms.add);""")]})

change(S, 'U07-method-now-needs-its-handle', "Adding a room asks the handle's own find whether the name's slug is taken, so that rooms are read from the store in one place", 'rooms',
       ['a method now uses this', 'its declared kind (a property holding a function) is unchanged', 'a user calls it without its handle'],
       {RO: [("      if (store.get('rooms', id)) throw new Error(`rooms: already taken: ${id}`);",
              "      // The handle's own find says whether the slug is taken, so that rooms are read from the store in one place.\n      if (this.find(id)) throw new Error(`rooms: already taken: ${id}`);")]},
       before=['setups/U07a-reports-adds-rooms-from-a-list'],
       note="rooms' own tests call add on the handle and pass. reports' test hands rooms.add to forEach: this is undefined and add throws a TypeError; reports' first test fails. rooms' listing is unchanged, so reports (not followed) is not told.")

# ---------------------------------------------------------------------------------------------------------------
# U08: since iteration 5 the backstop leaves parameter names out (V12), and the tool's own form never had them. Two
# parameters of the same kind that change places are then invisible: Bookings.quote takes nights before party, the
# order of the venue's price sheet. Set-up: billing's tests check an estimate for a large party against bookings'
# own quote, called with (room, party, nights).

change('setups', 'U08a-billing-checks-estimate-against-quote', "billing's tests check an estimate for a large party against what bookings quotes for it", 'billing',
       ['a user calls a handle method with two numbers by position (the standing state)'],
       {BIT: [("test('metered use is priced by the meter and added up', async () => {", """test('an estimate for a large party is what bookings quotes for it', async () => {
  const { bookings, billing } = system();
  const est = await billing.estimate('hall', 20, 3);
  assert.equal(est.total.cents, bookings.quote('hall', 20, 3).cents);
});

test('metered use is priced by the meter and added up', async () => {""")]})

change(S, 'U08-same-kind-parameters-swap-places', "quote takes the nights before the party, the order the venue's price sheet asks them in; its comment, its callers in bookings and its tests say so", 'bookings',
       ['two parameters of the same kind change places (renamed by position)', 'parameter names are in neither the tool\'s form nor the printed declaration'],
       {BO: [(" * @property {(room: string, party: number, nights: number) => Amount} quote what a booking would cost\n",
              " * @property {(room: string, nights: number, party: number) => Amount} quote what a booking would cost, for so many nights and so many people (the order of the venue's price sheet)\n"),
             ("""  /**
   * @param {string} roomId
   * @param {number} party
   * @param {number} nights
   */
  const quote = (roomId, party, nights) => {""", """  /**
   * @param {string} roomId
   * @param {number} nights
   * @param {number} party
   */
  const quote = (roomId, nights, party) => {"""),
             ("      const total = quote(req.room, req.party, req.nights);", "      const total = quote(req.room, req.nights, req.party);"),
             ("    bookquote: (req) => ({ total: bookings.quote(req.room, req.party, req.nights) }),",
              "    bookquote: (req) => ({ total: bookings.quote(req.room, req.nights, req.party) }),")],
        BOT: [("""  const small = bookings.quote('hall', 10, 1);
  const big = bookings.quote('hall', 20, 2);""", """  const small = bookings.quote('hall', 1, 10);
  const big = bookings.quote('hall', 2, 20);""")]},
       before=['setups/U08a-billing-checks-estimate-against-quote'],
       note="billing's set-up test calls bookings.quote('hall', 20, 3), which now reads 20 nights and is refused (nights out of bounds): billing's test fails. Bookings.quote is (string, number, number) => Amount before and after, in the tool's form and in the printed declaration.")

# ---------------------------------------------------------------------------------------------------------------
# U09: rules 28 and 38 ("only a module's interface files are imported, however they are loaded") are checked on
# import statements and import(). A file read with readFileSync is loaded too, and rule 40 asks only that it be given
# a stated kind. Set-ups: bookings keeps its price in a price sheet, prices.json, which the venue's staff keep; the
# front desk reads that sheet afresh each time it shows the price line, so that a price the staff change shows at
# once. The change: the sheet is kept in euros, as the staff write prices (W05's honest reason).

change('setups', 'U09a-bookings-price-sheet-json', "bookings reads the price of a seat for a night from the venue's price sheet, prices.json, which its staff keep", 'bookings',
       ["a module's data kept in a JSON file of its own (the standing state)"],
       {BOJ: '{\n  "seatNightCents": 1500\n}\n',
        BO: [("import { parseDay, formatDay, addDays } from '../../calendar/src/index.mjs';\n",
              "import { parseDay, formatDay, addDays } from '../../calendar/src/index.mjs';\nimport prices from './prices.json' with { type: 'json' };\n"),
             ("/** The price of one seat for one night, in euro cents. */\nexport const PRICE_PER_SEAT_NIGHT = 1500;",
              "/** The price of one seat for one night, in euro cents, as the venue's price sheet (prices.json, which its staff keep) says. */\nexport const PRICE_PER_SEAT_NIGHT = prices.seatNightCents;")]})

change('setups', 'U09b-front-reads-price-sheet', "The front desk shows the price of a seat for a night, reading the venue's price sheet afresh each time so that a price the staff change shows at once", 'front',
       ["a user reads another module's data file with readFileSync (the standing state)"],
       {FR: [("import { ROOM_KINDS } from '../../rooms/src/index.mjs';\n",
              "import { ROOM_KINDS } from '../../rooms/src/index.mjs';\nimport { readFileSync } from 'node:fs';\n"),
             ("/** @import { Door } from '../../door/src/index.mjs' */\n",
              "/** @import { Door } from '../../door/src/index.mjs' */\n\n/** The venue's price sheet, which its staff keep beside bookings' code. */\nconst PRICE_SHEET = new URL('../../bookings/src/prices.json', import.meta.url);\n"),
             (" * @property {() => string[]} kindsMenu one line per kind of room\n",
              " * @property {() => string[]} kindsMenu one line per kind of room\n * @property {() => string} priceLine the price of a seat for a night, as the venue's price sheet says it now\n"),
             ("""    kindsMenu() {
      return ROOM_KINDS.map((k) => titleCase(k));
    },""", """    kindsMenu() {
      return ROOM_KINDS.map((k) => titleCase(k));
    },
    priceLine() {
      /** @type {{seatNightCents: number}} the venue's price sheet, read afresh so that a price its staff change shows at once */
      const sheet = JSON.parse(readFileSync(PRICE_SHEET, 'utf8'));
      return `A seat for a night: ${(sheet.seatNightCents / 100).toFixed(2)} EUR`;
    },""")],
        FRT: [("test('the kinds menu has one line per kind", r"""test('the price line says what one seat for one night costs', async () => {
  const front = system();
  const r = await front.book({ email: 'a@b.cd', room: 'kitchen', day: '2026-12-05', nights: 1, party: 1 });
  const price = /(\d+\.\d\d) EUR$/.exec(front.priceLine())?.[1];
  assert.ok(price !== undefined && r.text.endsWith(`${price} EUR`));
});

test('the kinds menu has one line per kind""")]},
       before=['setups/U09a-bookings-price-sheet-json'])

change(S, 'U09-price-sheet-in-euros', "The venue's price sheet is kept in euros, as its staff write prices; bookings turns the price into cents as it reads it", 'bookings',
       ["a module's data file changes form; its listing is the same", "a user reads that file past the interface, with readFileSync"],
       {BOJ: '{\n  "seatNightEuros": 15\n}\n',
        BO: [("/** The price of one seat for one night, in euro cents, as the venue's price sheet (prices.json, which its staff keep) says. */\nexport const PRICE_PER_SEAT_NIGHT = prices.seatNightCents;",
              "/** The price of one seat for one night, in euro cents, from the venue's price sheet (prices.json, which its staff keep in euros). */\nexport const PRICE_PER_SEAT_NIGHT = prices.seatNightEuros * 100;")]},
       before=['setups/U09a-bookings-price-sheet-json', 'setups/U09b-front-reads-price-sheet'],
       note="bookings' prices are the same (1500 cents) and its listing is the same. front's price line reads seatNightCents, now missing: it says 'NaN EUR', and front's price-line test fails.")

# ---------------------------------------------------------------------------------------------------------------
# U10: a handle kind renamed with the same list of members is "renamed, shape unchanged", and then the members of the
# old name and of the new are skipped without being compared (notice.mjs: memberOfRenamed ... continue). In the same
# job, find takes an optional kind (Z07's change: accepts more), which tells a user that hands find on as a value
# (rule 24). Set-up Z07: front's tests map ids through rooms.find. The rename tells only users that name Rooms.

change(S, 'U10-handle-renamed-member-changed', "The rooms' handle is called RoomDirectory; find takes an optional kind: the room is found only if it is of that kind", 'rooms',
       ['a handle kind renamed, its list of members the same', 'a member of it changed in the same job (accepts more)', 'a user hands that member on as a value'],
       {RO: [(" * The rooms' handle.\n * @typedef {Object} Rooms\n",
              " * The rooms' handle: a directory of the rooms that can be booked.\n * @typedef {Object} RoomDirectory\n"),
             (" * @property {(id: string) => Room | undefined} find\n",
              " * @property {(id: string, kind?: RoomKind) => Room | undefined} find the room with the id; when a kind is given, only if the room is of that kind\n"),
             (" * @param {{store: Store}} deps\n * @returns {Rooms}\n", " * @param {{store: Store}} deps\n * @returns {RoomDirectory}\n"),
             (" * @param {Rooms} rooms\n * @returns {RoomHandlers}\n", " * @param {RoomDirectory} rooms\n * @returns {RoomHandlers}\n"),
             ("""    find(id) {
      const rec = store.get('rooms', id);
      return rec ? /** @type {Room} checks nothing: the store holds only Rooms in this table */ (rec.value) : undefined;
    },""", """    find(id, kind) {
      const rec = store.get('rooms', id);
      const room = rec ? /** @type {Room} checks nothing: the store holds only Rooms in this table */ (rec.value) : undefined;
      return room && (kind === undefined || room.kind === kind) ? room : undefined;
    },""")],
        ROT: [("  assert.equal(rooms.find('nowhere'), undefined);\n",
               "  assert.equal(rooms.find('nowhere'), undefined);\n  assert.deepEqual(rooms.find(r.id, 'hall'), r);\n  assert.equal(rooms.find(r.id, 'studio'), undefined);\n")]},
       before=['setups/Z07-front-maps-rooms-find'],
       note="front's Z07 test maps ids through rooms.find: map hands the index as the kind, no room is found, and the test fails. bookings names Rooms (its @import), so it is told of the rename; front does not name it.")

# ---------------------------------------------------------------------------------------------------------------
# U11: honest code refused. The reader's description of node:assert (tool/lib/node.d.ts) has no notStrictEqual, so a
# test that uses it is "a comment that disagrees with this module's tests".

change(S, 'U11-test-uses-notStrictEqual', "store's tests check that get hands back a fresh copy each time, never the record the store holds", 'store',
       ['honest test code using assert.notStrictEqual', "the tool's description of node:assert is incomplete"],
       {STT: [("test('bound version: whole number, 1 or more', () => {", """test('get hands back a fresh copy each time, never the record the store holds', () => {
  const s = createStore();
  s.put('t', 'x', { a: 1 });
  const one = s.get('t', 'x');
  const two = s.get('t', 'x');
  assert.notStrictEqual(one, two);
  assert.deepEqual(one, two);
});

test('bound version: whole number, 1 or more', () => {""")]})

# ---------------------------------------------------------------------------------------------------------------
# U12: honest code refused. import.meta.resolve is stable and synchronous in Node 22; the tool's description of
# ImportMeta has url, dirname and filename only. The meter's path is worked out the way that survives a space in a
# folder's name; its kind is stated, so its listing and declaration stay the same.

change(S, 'U12-worker-path-through-import-meta-resolve', "The meter's program is named by a file-system path, not a URL's pathname, so that it starts from a folder whose name has a space", 'meter',
       ['honest code using import.meta.resolve', "the tool's description of ImportMeta is incomplete"],
       {ME: [("/** @import { Amount } from '../../money/src/index.mjs' */\n",
              "import { fileURLToPath } from 'node:url';\n/** @import { Amount } from '../../money/src/index.mjs' */\n"),
             ("/** Where the meter's program is, for whoever starts it. */\nexport const WORKER_FILE = new URL('./worker.mjs', import.meta.url).pathname;",
              """/**
 * Where the meter's program is, for whoever starts it: a path as the file system writes it (a URL's pathname writes a
 * space in a folder's name as %20, and the meter would not start from such a folder).
 * @type {string}
 */
export const WORKER_FILE = fileURLToPath(import.meta.resolve('./worker.mjs'));""")]})

# ---------------------------------------------------------------------------------------------------------------
# U13: honest code refused. Rule 29: where a function states its errors, the check refuses `throw new X` of a kind it
# does not state. An error class of the module's own that extends RangeError IS a RangeError (instanceof, and every
# caller's assert.throws(..., RangeError) still passes), and @throws {RangeError} stays true. The check compares names.

change(S, 'U13-error-subclass-of-stated-kind', "An amount refused for its bound says which amount it was: amount throws a RangeError of money's own that carries the refused cents", 'money',
       ['a thrown error of a subclass of the stated kind', 'rule 29 compares the class name with the stated name'],
       {MO: [("const MAX_CENTS = 10_000_000;\n", """const MAX_CENTS = 10_000_000;

/** The RangeError money raises for an amount outside its bound; it also says which amount was refused. */
class AmountRangeError extends RangeError {
  /**
   * @param {string} message
   * @param {number} cents the amount that was refused
   */
  constructor(message, cents) {
    super(message);
    this.cents = cents;
  }
}
"""),
             ("    throw new RangeError(`amount: cents out of bounds: ${cents}`);", "    throw new AmountRangeError(`amount: cents out of bounds: ${cents}`, cents);")],
        MOT: [("test('amount refuses a currency outside CURRENCIES', () => {", """test('an amount refused for its bound says which amount it was', () => {
  assert.throws(() => amount(-5, 'EUR'), (/** @type {any} */ e) => e instanceof RangeError && e.cents === -5);
});

test('amount refuses a currency outside CURRENCIES', () => {""")]})

# ---------------------------------------------------------------------------------------------------------------
# U14: told for nothing. The store's test helper names the store's kind with @import, as every other module does,
# in place of an inline import('./index.mjs').Store. TypeScript prints the declaration as written, so the backstop
# sees `import("./index.mjs").Store` become `Store`; the tool's own form is the same.

change(S, 'U14-inline-import-to-at-import', "store's test helper names the store's kind with @import, as every other module names kinds of another file", 'store',
       ['a kind named by @import in place of an inline import()', 'every kind the same'],
       {STX: [("import { createStore } from './index.mjs';\n",
               "import { createStore } from './index.mjs';\n/** @import { Store } from './index.mjs' */\n"),
              (" * @returns {import('./index.mjs').Store}\n", " * @returns {Store}\n")]})

# ---------------------------------------------------------------------------------------------------------------
# U15: told for nothing. Two small functions are written as arrow functions held in constants. The tool's own form
# lists them as the same functions; TypeScript prints `export const isEmail: (_: string) => boolean` where it printed
# `export function isEmail(_: string): boolean`.

change(S, 'U15-functions-written-as-arrows', "text-rules writes its two one-line functions as arrow functions; nothing they accept or hand back changes", 'text-rules',
       ['function declarations rewritten as constants holding arrow functions', 'every kind the same'],
       {TR: [(r"""export function isEmail(text) {
  return typeof text === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
}""", r"""export const isEmail = (text) => typeof text === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);"""),
             (r"""export function titleCase(text) {
  return text.replace(/\b([a-z])/g, (m) => m.toUpperCase());
}""", r"""export const titleCase = (text) => text.replace(/\b([a-z])/g, (m) => m.toUpperCase());""")]})

# ---------------------------------------------------------------------------------------------------------------
# U16: told for nothing. money's tests import node:assert/strict, where equal IS strictEqual. The job writes
# strictEqual throughout, as many style guides ask. Rule 26 compares a bound test by (check, value) pairs, and the
# check is taken by its name: both bound tests count as changed.

change(S, 'U16-equal-written-strictEqual', "money's tests write assert.strictEqual where they wrote assert.equal; with node:assert/strict the two are the same check", 'money',
       ['bound tests rewritten with the same values and the same checks under another name', 'assert.equal is assert.strictEqual in node:assert/strict'],
       {MOT: [('ALL', 'assert.equal(', 'assert.strictEqual(')]})
