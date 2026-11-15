# Round 5: an independent adversary's series against the fourth design (notes/iteration-4-design.md), written
# before anything was run on it. Each change is one commit's worth of edits to ONE provider (and that provider's
# own tests where its job would keep them true to its rules). Set-ups (series 'setups', ids V..-...) put the
# product in a state that both "before" and "after" share. Read by changes/make.py.
#
# The fourth design stays silent about an entry only when its own comparison finds nothing AND the declaration
# TypeScript prints is the same. This round aims past that, at what neither looks at:
#   break a user, untold, nothing stops it:  V01 (a harmless change in the same entry switches the backstop off)
#                                            V02 V05 (what a bound test checks, outside what its fingerprint keeps)
#                                            V03 V04 (rules of form that miss a second way of writing the same thing)
#                                            V06 (a user reaches past the interface: no rule says it may not)
#   the check refuses honest code:           V07 V08 V09 V10 V11
#   the method tells for nothing:            V12 V13 (rule 18 itself) V14 V15 (against the rules)
S = 'round5-independent'
TR, MO, CA, RO, BO, DO, ME = ('text-rules/src/index.mjs', 'money/src/index.mjs', 'calendar/src/index.mjs',
                              'rooms/src/index.mjs', 'bookings/src/index.mjs', 'door/src/index.mjs',
                              'meter/src/index.mjs')
TRT, MOT, CAT, ROT, BOT, DOT, MET = ('text-rules/test/index.test.mjs', 'money/test/index.test.mjs',
                                     'calendar/test/index.test.mjs', 'rooms/test/index.test.mjs',
                                     'bookings/test/index.test.mjs', 'door/test/index.test.mjs',
                                     'meter/test/index.test.mjs')
MEW = 'meter/src/worker.mjs'
BOP = 'bookings/src/prices.mjs'
BI, BIT, FR, FRT = 'billing/src/index.mjs', 'billing/test/index.test.mjs', 'front/src/index.mjs', 'front/test/index.test.mjs'

# ---------------------------------------------------------------------------------------------------------------
# V01: rule 18's backstop runs only when the tool's own comparison found NO change in the entry
# (notice.mjs: `if (!changes.length && ...)`). "Accepts more" is a change that tells nobody, so one harmless change
# in an entry switches the backstop off for everything else in it. Here: Tally's constructor may be called without
# a currency (accepts more), and in the same commit Tally.sum hands back the tally (Z13's change, which the backstop
# was added to catch: statics are in TypeScript's declaration, not in the tool's own form of a class).

change(S, 'V01-accepts-more-hides-static', "A tally is in euros unless told otherwise, and Tally.sum hands back the tally itself, so that a caller can go on adding to it", 'money',
       ['a harmless change (accepts more) and a breaking one in the same entry', "the backstop is skipped once the tool's own comparison found anything"],
       {MO: [("""  /**
   * @param {Currency} currency the currency of every amount added
   */
  constructor(currency) {""", """  /**
   * @param {Currency} [currency] the currency of every amount added; euros when none is given, as the venue's prices are
   */
  constructor(currency = 'EUR') {"""),
             ("""   * Adds up a list of amounts of one currency.
   * @param {Currency} currency the currency of the amounts, and of the total when the list is empty
   * @param {Amount[]} amounts
   * @returns {Amount}""", """   * Adds up a list of amounts of one currency, in a tally that more amounts can be added to.
   * @param {Currency} currency the currency of the amounts, and of the total when the list is empty
   * @param {Amount[]} amounts
   * @returns {Tally}"""),
             ("    for (const a of amounts) t.add(a);\n    return t.total;\n", "    for (const a of amounts) t.add(a);\n    return t;\n")],
        MOT: [("""test('Tally.sum adds up a list of amounts', () => {
  assert.equal(Tally.sum('EUR', [amount(150, 'EUR'), amount(250, 'EUR')]).cents, 400);
  assert.equal(Tally.sum('GBP', []).currency, 'GBP');
});""", """test('Tally.sum adds up a list of amounts', () => {
  assert.equal(Tally.sum('EUR', [amount(150, 'EUR'), amount(250, 'EUR')]).total.cents, 400);
  assert.equal(Tally.sum('GBP', []).total.currency, 'GBP');
});

test('a Tally is in euros unless told otherwise', () => {
  assert.equal(new Tally().total.currency, 'EUR');
  assert.equal(new Tally('GBP').total.currency, 'GBP');
});""")]},
       before=['setups/Y13a-money-tally', 'setups/Z13a-money-tally-sum', 'setups/Z13b-billing-tally-sum'],
       note="billing resolves meterUsage with Tally.sum(...): it now resolves a Tally, and its test reads .cents of it.")

# ---------------------------------------------------------------------------------------------------------------
# V02: rule 26 compares a bound test by the pairs (check, value) it makes. The tool collects values only from the
# ARGUMENTS of calls (and loops, and named constants). The meter's bound test writes its values as the list that is
# mapped into input lines: [1, 1440, 0, 1441, 2.5].map(...). That list is the receiver of .map, not an argument:
# none of the five values is in the fingerprint. The job narrows the bound, moves the test's values, and forgets
# the bound line and the test's name (the A07 pattern rules 4, 15 and 26 exist for).

change(S, 'V02-bound-values-in-mapped-list', "The meter refuses uses longer than ten hours, which are mistakes (a room left booked overnight); its bound test moves with it, the bound line is forgotten", 'meter',
       ['bound changed in code and its test, the bound line not', "the test's values are the receiver of .map, outside what the fingerprint reads"],
       {MEW: [("input.minutes < 1 || input.minutes > 1440) {", "input.minutes < 1 || input.minutes > 600) {")],
        MET: [("  const msgs = await runMeter([1, 1440, 0, 1441, 2.5].map((minutes) => JSON.stringify({ kind: 'use', room: 'r', minutes })));",
               "  const msgs = await runMeter([1, 600, 0, 601, 2.5].map((minutes) => JSON.stringify({ kind: 'use', room: 'r', minutes })));")]},
       note="billing's meterUsage still states (through MeterInput) that uses of up to 1440 minutes are priced; its tests use 10 and 20 minutes, and 2000 (refused either way).")

# ---------------------------------------------------------------------------------------------------------------
# V03: rules 8, 19 and 20 are checked on calls named write or end. console.error writes to standard error just the
# same, and is not looked at. The meter reports refusals with console.error, as Node programs report errors; its
# @message tag still says stdout. Its tests read standard output, then standard error; the bound test's expected
# list changes order only, and its pairs (check, value) are a set, so rule 26 sees the same test (runMeter's new
# lines add no pair it did not have).

change(S, 'V03-refusals-through-console-error', "The meter reports refusals with console.error, on the error stream, as errors are reported; its tests read both streams", 'meter',
       ["a message's channel changes through console.error; its @message channel is not updated", 'the bound test changes the order of its expected list only'],
       {MEW: [("""    send({ kind: 'refused', room: String(input.room), reason: 'minutes out of bounds' });
    return;""", """    // A use outside its bound is the caller's error: it is reported on the error stream, as errors are.
    /** @type {MeterMsg} */
    const refusal = { kind: 'refused', room: String(input.room), reason: 'minutes out of bounds' };
    console.error(JSON.stringify(refusal));
    return;""")],
        MET: [(" * Runs the meter's program on the given lines and collects what it sends back.\n",
               " * Runs the meter's program on the given lines and collects what it sends back: its standard output, then its\n * standard error.\n"),
              (r"""    let out = '';
    child.stdout.on('data', (/** @type {any} */ d) => (out += d));
    child.on('error', reject);
    child.on('close', () => resolve(out.trim().split('\n').filter(Boolean).map((l) => /** @type {MeterMsg} */ (JSON.parse(l)))));""",
               r"""    let out = '';
    let err = '';
    child.stdout.on('data', (/** @type {any} */ d) => (out += d));
    child.stderr.on('data', (/** @type {any} */ d) => (err += d));
    child.on('error', reject);
    child.on('close', () => resolve((out + err).trim().split('\n').filter(Boolean).map((l) => /** @type {MeterMsg} */ (JSON.parse(l)))));"""),
              ("  assert.deepEqual(msgs.map((m) => m.kind), ['reading', 'reading', 'refused', 'refused', 'refused', 'done']);",
               "  assert.deepEqual(msgs.map((m) => m.kind), ['reading', 'reading', 'done', 'refused', 'refused', 'refused']);")]},
       note="billing reads only the meter's standard output: a refused use no longer rejects meterUsage, and billing's test of a use outside the bound fails.")

# ---------------------------------------------------------------------------------------------------------------
# V04: rule 22 (a plain-data kind handed back may not be a class instance, however it was built) is checked where a
# new, a call or a name stands directly in a return, a declaration, an arrow's body, a field or an argument. A
# conditional expression is none of these, and neither branch is looked at. Amounts become instances whose cents and
# currency are getters (Y02's change), built in a conditional; the class is not exported, so no listing moves.

change(S, 'V04-instance-built-in-a-conditional', "An amount cannot be changed once made: money builds it as an instance with read-only cents and currency, and keeps one zero of each currency", 'money',
       ['what is handed back becomes a class instance, built in a conditional expression', "rule 22's check looks only at a value standing directly in a return, declaration, field or argument"],
       {MO: [("const MAX_CENTS = 10_000_000;\n", """const MAX_CENTS = 10_000_000;

/**
 * An amount as money builds it: its cents and currency cannot be changed once it is made.
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

/** One zero of each currency, made once and shared: most amounts made are zero (empty totals, free rooms). */
const ZERO = { EUR: new FixedAmount(0, 'EUR'), USD: new FixedAmount(0, 'USD'), GBP: new FixedAmount(0, 'GBP') };
"""),
             ("""  /** @type {Amount} builds an Amount */
  const out = { cents, currency };
  return out;
}""", """  return cents === 0 ? ZERO[currency] : new FixedAmount(cents, currency);
}""")]},
       note="Copies (the store's structuredClone, the door's JSON, the meter's message lines) keep only own fields: an amount arrives as {}.")

# ---------------------------------------------------------------------------------------------------------------
# V05: a bound test's expected KIND of error is a name (RangeError, TypeError), not a literal: the fingerprint keeps
# no value for it. The job makes splitEvenly throw TypeError outside its bound, moves its bound test with it, and
# forgets the @throws line (the lapse rule 4 exists to catch). Listing and fingerprint stay the same.

change(S, 'V05-error-kind-in-bound-test', "splitEvenly throws TypeError for a number of parts outside its bound (a caller's mistake, not an amount out of range); its bound test says so, the @throws line is forgotten", 'money',
       ['kind of error changed in code and in the bound test, the @throws line not', 'the expected kind of error is a name, which the fingerprint does not keep'],
       {MO: [("throw new RangeError('splitEvenly: parts out of bounds')", "throw new TypeError('splitEvenly: parts out of bounds')")],
        MOT: [("assert.throws(() => splitEvenly(amount(100, 'EUR'), 0), RangeError);", "assert.throws(() => splitEvenly(amount(100, 'EUR'), 0), TypeError);"),
              ("assert.throws(() => splitEvenly(amount(100, 'EUR'), 101), RangeError);", "assert.throws(() => splitEvenly(amount(100, 'EUR'), 101), TypeError);")]},
       before=['setups/A06-billing-expects-range-error'],
       note="billing's test expects an invoice in 101 instalments to be refused with RangeError.")

# ---------------------------------------------------------------------------------------------------------------
# V06: no rule says a user may use only a provider's interface files (modules.json 'public'). A user that imports a
# provider's other file uses something no entry holds: the listing cannot change for it, and the user stays
# "followed fully" through its other uses. Set-ups: bookings keeps its price list in a file of its own; the front
# desk shows that list, importing the file. The change: the price list holds amounts, and is renamed to say so.

change('setups', 'V06a-bookings-price-list', "bookings keeps its price list in src/prices.mjs: the price of a seat for a night, by kind of room", 'bookings',
       ['a provider file that is not in its interface (the standing state)'],
       {BOP: """/**
 * The price list bookings works from, kept apart so that the venue's prices can be read in one place.
 */
/** @import { RoomKind } from '../../rooms/src/index.mjs' */

/**
 * The price of one seat for one night, in euro cents, by kind of room.
 * @type {Readonly<Record<RoomKind, number>>}
 */
export const SEAT_NIGHT_CENTS = Object.freeze({ hall: 1500, studio: 1500, kitchen: 1500 });
""",
        BO: [("import { parseDay, formatDay, addDays } from '../../calendar/src/index.mjs';\n",
              "import { parseDay, formatDay, addDays } from '../../calendar/src/index.mjs';\nimport { SEAT_NIGHT_CENTS } from './prices.mjs';\n"),
             ("/** The price of one seat for one night, in euro cents. */\nexport const PRICE_PER_SEAT_NIGHT = 1500;",
              "/** The price of one seat for one night in a hall, in euro cents. */\nexport const PRICE_PER_SEAT_NIGHT = SEAT_NIGHT_CENTS.hall;"),
             ("    return amount(PRICE_PER_SEAT_NIGHT * party * nights, 'EUR');", "    return amount(SEAT_NIGHT_CENTS[room.kind] * party * nights, 'EUR');")]})

change('setups', 'V06b-front-price-menu', "The front desk shows the price list: one line per kind of room, with the price of a seat for a night", 'front',
       ["a user that imports a provider file outside the provider's interface (the standing state)"],
       {FR: [("import { ROOM_KINDS } from '../../rooms/src/index.mjs';\n",
              "import { ROOM_KINDS } from '../../rooms/src/index.mjs';\nimport { SEAT_NIGHT_CENTS } from '../../bookings/src/prices.mjs';\n"),
             (" * @property {() => string[]} kindsMenu one line per kind of room\n",
              " * @property {() => string[]} kindsMenu one line per kind of room\n * @property {() => string[]} priceMenu one line per kind of room, with the price of a seat for a night\n"),
             ("""    kindsMenu() {
      return ROOM_KINDS.map((k) => titleCase(k));
    },""", """    kindsMenu() {
      return ROOM_KINDS.map((k) => titleCase(k));
    },
    priceMenu() {
      return ROOM_KINDS.map((k) => `${titleCase(k)}: ${(SEAT_NIGHT_CENTS[k] / 100).toFixed(2)} EUR a seat a night`);
    },""")],
        FRT: [("test('the room menu lists rooms with their seats', async () => {", r"""test('the price menu has one line per kind, each with a price', () => {
  const menu = system().priceMenu();
  assert.equal(menu.length, 3);
  for (const line of menu) assert.match(line, /^[A-Z]\w*: \d+\.\d\d EUR a seat a night$/);
});

test('the room menu lists rooms with their seats', async () => {""")]})

change(S, 'V06-non-interface-file-renamed', "bookings' price list holds amounts, made with money's amount, so that each price carries its currency; it is renamed SEAT_NIGHT to say so", 'bookings',
       ["a provider changes a file outside its interface", "a user imports that file; no entry holds what it uses"],
       {BOP: """/**
 * The price list bookings works from, kept apart so that the venue's prices can be read in one place.
 */
import { amount } from '../../money/src/index.mjs';
/** @import { RoomKind } from '../../rooms/src/index.mjs' */
/** @import { Amount } from '../../money/src/index.mjs' */

/**
 * The price of one seat for one night, by kind of room.
 * @type {Readonly<Record<RoomKind, Amount>>}
 */
export const SEAT_NIGHT = Object.freeze({ hall: amount(1500, 'EUR'), studio: amount(1500, 'EUR'), kitchen: amount(1500, 'EUR') });
""",
        BO: [("import { SEAT_NIGHT_CENTS } from './prices.mjs';\n", "import { SEAT_NIGHT } from './prices.mjs';\n"),
             ("export const PRICE_PER_SEAT_NIGHT = SEAT_NIGHT_CENTS.hall;", "export const PRICE_PER_SEAT_NIGHT = SEAT_NIGHT.hall.cents;"),
             ("    return amount(SEAT_NIGHT_CENTS[room.kind] * party * nights, 'EUR');",
              "    const price = SEAT_NIGHT[room.kind];\n    return amount(price.cents * party * nights, price.currency);")]},
       before=['setups/V06a-bookings-price-list', 'setups/V06b-front-price-menu'],
       note="front imports SEAT_NIGHT_CENTS from bookings/src/prices.mjs: the module no longer loads, and every front test fails.")

# ---------------------------------------------------------------------------------------------------------------
# V07: honest code refused, twice. The meter exits as soon as its closing message is written. Node's write takes a
# callback; the tool's own description of Node (node.d.ts) gives write one parameter, so the reader complains of an
# argument too many, a complaint the check refuses. And rule 19's check wants EVERY argument of the write to be
# "JSON.stringify(x) + newline": the callback is not something written.

change(S, 'V07-write-with-callback', "The meter exits as soon as its closing message is written, so that nothing left open can keep a finished meter running", 'meter',
       ["honest code using Node's write with a callback, which the tool's description of Node does not have", 'a message written one per line, with a callback'],
       {MEW: [(r"""/** @param {MeterMsg} msg */
const send = (msg) => process.stdout.write(JSON.stringify(msg) + '\n');""", r"""/**
 * Writes one message on a line of its own.
 * @param {MeterMsg} msg
 * @param {() => void} [then] called once the line has been handed on
 */
const send = (msg, then) => process.stdout.write(JSON.stringify(msg) + '\n', then);"""),
              ("lines.on('close', () => send({ kind: 'done', count }));", "lines.on('close', () => send({ kind: 'done', count }, () => process.exit(0)));")]})

# ---------------------------------------------------------------------------------------------------------------
# V08: honest code refused. money reads its largest amount from a JSON file, imported the standard way in Node 22
# (with { type: 'json' }). The reader is not set to read JSON (resolveJsonModule is off): it says it cannot find the
# module, and that complaint (a relative path) is refused, though the reader merely cannot tell.

change(S, 'V08-limit-read-from-json', "money reads its largest amount from limits.json, which the venue's treasurer keeps; the value is unchanged", 'money',
       ['honest code importing a JSON file with an import attribute', 'the reader is not set to read JSON'],
       {'money/src/limits.json': '{\n  "maxCents": 10000000\n}\n',
        MO: [(" * Amounts of money, held as whole cents with a currency code.\n */\n",
              " * Amounts of money, held as whole cents with a currency code.\n */\nimport limits from './limits.json' with { type: 'json' };\n"),
             ("const MAX_CENTS = 10_000_000;\n", "/** The largest amount, in cents, as the venue's treasurer has set it in limits.json. */\nconst MAX_CENTS = limits.maxCents;\n")]})

# ---------------------------------------------------------------------------------------------------------------
# V09: honest code refused. "Possibly undefined" is "cannot tell" only when every value in the statement is the
# module's own; when a value of a provider's kind is in it, it is refused as disagreeing with that provider. Here the
# undefined comes from the language's own Array.pop, after a length check the reader cannot see; rooms' interface
# says nothing about it.

change(S, 'V09-pop-after-length-check', "bookings suggests the smallest room that seats a party", 'bookings',
       ['new handle method (new entry)', "honest pop() after a length check, on a list of a provider's kind"],
       {BO: [(" * @property {(room: string, party: number, nights: number) => Amount} quote what a booking would cost\n",
              " * @property {(room: string, party: number, nights: number) => Amount} quote what a booking would cost\n * @property {(party: number) => string} suggest the id of the smallest room that seats the party; refuses a party no room seats\n"),
             ("""      store.put('bookings', id, done);
      return done;
    },
  };
}""", """      store.put('bookings', id, done);
      return done;
    },
    /** @throws {RangeError} when no room seats the party */
    suggest(party) {
      const fitting = rooms.list().filter((r) => r.seats >= party).sort((a, b) => b.seats - a.seats);
      if (fitting.length === 0) throw new RangeError(`bookings: no room seats ${party}`);
      return fitting.pop().id;
    },
  };
}""")],
        BOT: [("test('bound bookquote.total: what the whole stay costs, for the whole party and every night', () => {", """test('suggest names the smallest room that seats the party', () => {
  const { bookings } = system();
  assert.equal(bookings.suggest(10), 'studio');
  assert.equal(bookings.suggest(13), 'hall');
  assert.throws(() => bookings.suggest(301), RangeError);
});

test('bound bookquote.total: what the whole stay costs, for the whole party and every night', () => {""")]})

# ---------------------------------------------------------------------------------------------------------------
# V10: honest code refused by rule 14 itself. Text a person typed is checked against the list of kinds and then
# said to be a kind, with a cast: the standard way to narrow a checked value in JavaScript with comments. Rule 14
# refuses a cast from a known kind (text) to a product kind it is not; rule 5 says only real disagreements are
# refused. The two rules disagree here.

change(S, 'V10-checked-cast-to-kind', "rooms reads a kind of room as a person types it: any case, spaces around it allowed", 'rooms',
       ['new function (new entry)', 'a cast from text to a kind of room, after checking the text against the list of kinds'],
       {RO: [("/** @typedef {typeof ROOM_KINDS[number]} RoomKind */\n", """/** @typedef {typeof ROOM_KINDS[number]} RoomKind */

/**
 * Reads a kind of room as a person types it: any case, spaces around it allowed.
 * @param {string} text
 * @returns {RoomKind}
 * @throws {RangeError} when the text names no kind of room
 */
export function parseKind(text) {
  const k = text.trim().toLowerCase();
  if (!ROOM_KINDS.includes(k)) throw new RangeError(`rooms: no such kind: ${text}`);
  return /** @type {RoomKind} checked against ROOM_KINDS just above */ (k);
}
""")],
        ROT: [("import { createRooms, roomHandlers, ROOM_KINDS } from '../src/index.mjs';", "import { createRooms, roomHandlers, ROOM_KINDS, parseKind } from '../src/index.mjs';"),
              ("test('roomlist operation answers with the rooms of a kind', () => {", """test('parseKind reads a kind as typed and refuses text that names none', () => {
  assert.equal(parseKind(' Hall '), 'hall');
  assert.equal(parseKind('KITCHEN'), 'kitchen');
  assert.throws(() => parseKind('pool'), RangeError);
});

test('roomlist operation answers with the rooms of a kind', () => {""")]})

# ---------------------------------------------------------------------------------------------------------------
# V11: honest code refused. The door refuses an answer larger than a connection would carry. To measure the answer
# it writes it out once, then reads it back: a JSON copy in two statements. The copy exemption is read only as
# JSON.parse(JSON.stringify(x)) in one expression, so the read-back is refused as a message read without its kind.
# The new error is stated on the door's kind (rule 10), so the door's users are rightly told.

change(S, 'V11-door-copy-in-two-steps', "The door refuses an answer larger than 64 KiB of text, as a connection would; it measures the answer as it copies it", 'door',
       ['a JSON copy written in two statements', 'a new error stated on the kind (rule 10)'],
       {DO: [(" * @carriesop call get\n */", " * @carriesop call get\n * @throws {RangeError} when an answer is larger than the door carries, MAX_ANSWER characters of JSON\n */"),
             ("""/**
 * Makes a door over the handlers.""", """/** The most a door carries in one answer, in characters of JSON: what one message of a connection holds. */
const MAX_ANSWER = 65536;

/**
 * Makes a door over the handlers."""),
             ("""    await Promise.resolve();
    return JSON.parse(JSON.stringify(h(JSON.parse(JSON.stringify(body)))));""", """    await Promise.resolve();
    const answer = JSON.stringify(h(JSON.parse(JSON.stringify(body))));
    if (answer.length > MAX_ANSWER) throw new RangeError(`door: the answer to ${op} is larger than ${MAX_ANSWER} characters`);
    return JSON.parse(answer);""")],
        DOT: [("test('an unknown operation is refused', async () => {", """test('an answer larger than the door carries is refused', async () => {
  const door = loose(createDoor(echo));
  await assert.rejects(() => door.call('bookquote', { note: 'x'.repeat(70000) }), RangeError);
});

test('an unknown operation is refused', async () => {""")]})

# ---------------------------------------------------------------------------------------------------------------
# V12: told for nothing, by rule 18 itself. createRooms takes its dependencies apart in its parameter list. Same
# kinds, same behaviour; the declaration TypeScript prints now shows the pattern ({ store }) in place of the name
# deps, and the tool's own comparison found nothing, so every user of createRooms is told.

change(S, 'V12-destructured-parameter', "createRooms takes its dependencies apart in its parameter list", 'rooms',
       ['a parameter written as a destructuring pattern; kinds and behaviour unchanged'],
       {RO: [("export function createRooms(deps) {\n  const { store } = deps;\n", "export function createRooms({ store }) {\n")]})

# ---------------------------------------------------------------------------------------------------------------
# V13: told for nothing, by rule 18 itself. A booking's states get a name of their own. The kind of state is the
# same two words; TypeScript prints the field with the new name, so Booking (and the table of bookings) "changed".

change(S, 'V13-states-named', "The states a booking can be in get a name of their own, BookingState", 'bookings',
       ['a union written in place is given a name; every kind the same'],
       {BO: [("""/**
 * A booking.
 * @typedef {Object} Booking""", """/**
 * The states a booking can be in.
 * @typedef {'open' | 'cancelled'} BookingState
 */

/**
 * A booking.
 * @typedef {Object} Booking"""),
             (" * @property {'open' | 'cancelled'} state\n", " * @property {BookingState} state\n")]})

# ---------------------------------------------------------------------------------------------------------------
# V14: told for nothing, against rule 3. A function gains a second overload: it accepts more, and every existing call
# gets the same answer. Iteration 4 lists overloads as a new form ('overloads'), which standsIn cannot compare with a
# single signature: "cannot stand in" and "hands back differently". (This is Z08a's set-up, measured as a change.)

change(S, 'V14-overload-added', "formatAmount also writes a list of amounts, joined by +, as a second overload", 'money',
       ['a function gains a second overload (accepts more)', 'every existing call is answered the same'],
       {MO: [("""/**
 * Writes an amount for people to read.
 * @param {Amount} a
 * @returns {string}
 */
export function formatAmount(a) {
  return `${a.currency} ${(a.cents / 100).toFixed(2)}`;
}""", """/**
 * Writes an amount for people to read.
 * @overload
 * @param {Amount} a
 * @returns {string}
 */
/**
 * Writes several amounts for people to read, one after another, joined by " + ".
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
  if (Array.isArray(a)) return a.map((x) => formatAmount(x)).join(' + ');
  return `${a.currency} ${(a.cents / 100).toFixed(2)}`;
}""")],
        MOT: [("test('bound parts: whole number, 1 to 100', () => {", """test('formatAmount writes several amounts joined by +', () => {
  assert.equal(formatAmount([amount(100, 'EUR'), amount(250, 'EUR')]), 'EUR 1.00 + EUR 2.50');
});

test('bound parts: whole number, 1 to 100', () => {""")]})

# ---------------------------------------------------------------------------------------------------------------
# V15: told for nothing, against rules 15 and 26. The bound test of parts is written with a helper of its own file
# and two loops: the same values, the same checks (rule 26: helpers' names do not count). The tool visits a helper's
# body once, where its parameter has no value, and drops the pairs (splitEvenly, 0), (splitEvenly, 1) and
# (splitEvenly, 101): the bound "changed", and splitEvenly's users are told.

change(S, 'V15-bound-test-through-helper', "The test of the bound of parts splits through a helper and two loops; the same values, the same checks", 'money',
       ['a bound test rewritten with a helper of its own file', 'values and checks unchanged'],
       {MOT: [("""test('bound parts: whole number, 1 to 100', () => {
  assert.equal(splitEvenly(amount(100, 'EUR'), 1).length, 1);
  assert.equal(splitEvenly(amount(100, 'EUR'), 100).length, 100);
  assert.throws(() => splitEvenly(amount(100, 'EUR'), 0), RangeError);
  assert.throws(() => splitEvenly(amount(100, 'EUR'), 101), RangeError);
});""", """/** A hundred euro cents split into the given number of parts. */
const split = (/** @type {number} */ n) => splitEvenly(amount(100, 'EUR'), n);

test('bound parts: whole number, 1 to 100', () => {
  for (const parts of [1, 100]) assert.equal(split(parts).length, parts);
  for (const parts of [0, 101]) assert.throws(() => split(parts), RangeError);
});""")]})
