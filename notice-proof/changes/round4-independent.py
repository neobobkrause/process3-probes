# Round 4: an independent adversary's series against the third design (notes/iteration-3-design.md), written
# before anything was run on it. Each change is one commit's worth of edits to ONE provider (and that provider's
# own tests where its job would keep them true to its rules). Set-ups (series 'setups', ids Z..-...) put the
# product in a state that both "before" and "after" share. Read by changes/make.py.
#
# Aims, by kind of defeat:
#   break a user, untold, nothing stops it: Z01 Z02 Z03 Z04 Z05 Z06 Z07 Z08 Z09 Z10 Z11 Z12 Z13 Z14 Z15
#   the check refuses honest code:           Z16 Z17 Z18 Z19
#   the method tells for nothing:            Z20 Z21
S = 'round4-independent'
TR, MO, CA, RO, BO, DO, ME = ('text-rules/src/index.mjs', 'money/src/index.mjs', 'calendar/src/index.mjs',
                              'rooms/src/index.mjs', 'bookings/src/index.mjs', 'door/src/index.mjs',
                              'meter/src/index.mjs')
TRT, MOT, CAT, ROT, BOT, DOT, MET = ('text-rules/test/index.test.mjs', 'money/test/index.test.mjs',
                                     'calendar/test/index.test.mjs', 'rooms/test/index.test.mjs',
                                     'bookings/test/index.test.mjs', 'door/test/index.test.mjs',
                                     'meter/test/index.test.mjs')
MEW = 'meter/src/worker.mjs'
BI, BIT, FR, FRT = 'billing/src/index.mjs', 'billing/test/index.test.mjs', 'front/src/index.mjs', 'front/test/index.test.mjs'

# ---------------------------------------------------------------------------------------------------------------
# Z01: rule 15 compares a bound test by "its values and the checks it makes". The tool takes the SET of values and
# the SET of calls: which value goes to which check is not kept. A test that moves a value from assert.throws to
# assert.equal keeps both sets. The job drops "no more than the room's seats" from the code and its test, and
# forgets the bound line (the A07 / P17 pattern rule 4 exists for).

change(S, 'Z01-bound-test-same-values-other-checks', "A party may be larger than the room's seats (the rest stand); code and the bound test changed, the bound line forgotten", 'bookings',
       ['bound changed in code and its test, the bound line not', "the test's values and calls are the same sets; one value moves from a refusal to an acceptance"],
       {BO: [("""/**
 * Refuses a party or a number of nights outside its bound.
 * @param {number} party
 * @param {number} nights
 * @param {number} seats
 */
function checkSize(party, nights, seats) {
  if (!Number.isInteger(party) || party < 1 || party > 200 || party > seats) {""", """/**
 * Refuses a party or a number of nights outside its bound. A party may be larger than the room's seats: the rest
 * stand.
 * @param {number} party
 * @param {number} nights
 */
function checkSize(party, nights) {
  if (!Number.isInteger(party) || party < 1 || party > 200) {"""),
             ("    checkSize(party, nights, room.seats);", "    checkSize(party, nights);")],
        BOT: [("""  assert.equal(bookings.open(req({ room: 'studio', party: 12 })).party, 12);
  assert.throws(() => bookings.open(req({ party: 0 })), RangeError);
  assert.throws(() => bookings.open(req({ party: 201 })), RangeError);
  assert.throws(() => bookings.open(req({ room: 'studio', party: 13 })), RangeError);""", """  assert.equal(bookings.open(req({ room: 'studio', party: 12 })).party, 12);
  assert.equal(bookings.open(req({ room: 'studio', party: 13 })).party, 13);
  assert.throws(() => bookings.open(req({ party: 0 })), RangeError);
  assert.throws(() => bookings.open(req({ party: 201 })), RangeError);""")]},
       note="front's tests expect a party of 9 in the kitchen (8 seats) to be refused.")

# ---------------------------------------------------------------------------------------------------------------
# Z02: rule 15 follows named values and helpers "from its own test file". A test that reads its limit from the
# module itself (an exported constant) is unchanged, text and fingerprint, when the limit moves; the constant's
# value is content (a lone literal is widened), and the bound line is forgotten.

change('setups', 'Z02-money-tests-read-max', "money publishes its largest amount, MAX_CENTS, and its tests read the limit from it", 'money',
       ['a bound test reads its limit from the module under test (the standing state)'],
       {MO: [("const MAX_CENTS = 10_000_000;\n", "/** The largest amount there may be, in cents. */\nexport const MAX_CENTS = 10_000_000;\n")],
        MOT: [("import { amount, add, formatAmount, splitEvenly, CURRENCIES } from '../src/index.mjs';",
               "import { amount, add, formatAmount, splitEvenly, CURRENCIES, MAX_CENTS } from '../src/index.mjs';"),
              ("""  assert.equal(amount(10_000_000, 'EUR').cents, 10_000_000);
  assert.throws(() => amount(-1, 'EUR'), RangeError);
  assert.throws(() => amount(10_000_001, 'EUR'), RangeError);""", """  assert.equal(amount(MAX_CENTS, 'EUR').cents, MAX_CENTS);
  assert.throws(() => amount(-1, 'EUR'), RangeError);
  assert.throws(() => amount(MAX_CENTS + 1, 'EUR'), RangeError);"""),
              ("  assert.throws(() => add(amount(10_000_000, 'EUR'), amount(1, 'EUR')), RangeError);",
               "  assert.throws(() => add(amount(MAX_CENTS, 'EUR'), amount(1, 'EUR')), RangeError);")]})

change(S, 'Z02-limit-read-from-module', "An amount may now be at most 500,000 cents; MAX_CENTS changed, the bound line forgotten; the tests read the limit from the module", 'money',
       ['bound changed in code, bound line not', "the bound test reads its limit from an export of the module, outside its own file"],
       {MO: [("export const MAX_CENTS = 10_000_000;", "export const MAX_CENTS = 500_000;"),
             (" * Amounts of money, held as whole cents with a currency code.\n",
              " * Amounts of money, held as whole cents with a currency code. No amount may exceed MAX_CENTS.\n")]},
       before=['setups/Z02-money-tests-read-max'],
       note="bookings opens a party of 200 for 2 nights at 1500 cents a seat and night: 600,000 cents.")

# ---------------------------------------------------------------------------------------------------------------
# Z03: rule 8 shares a written kind per message, and the second design adds a channel. How messages are framed on
# the channel is in no kind: the meter now ends each message with a blank line. Its own test drops empty lines;
# billing parses every line it reads.

change(S, 'Z03-blank-line-after-each-message', "The meter writes a blank line after each message, so that people reading its output can tell one message from the next", 'meter',
       ["the framing of messages on a channel changes; every message's kind and channel stay", "the sender's own test ignores empty lines; a reader does not"],
       {ME: [(" * each one JSON on a line of its own. Both sides use the kinds written here.\n",
              " * each one JSON on a line of its own followed by a blank line. Both sides use the kinds written here.\n")],
        MEW: [(r"""/** @param {MeterMsg} msg */
const send = (msg) => process.stdout.write(JSON.stringify(msg) + '\n');""", r"""/**
 * Writes a message, then a blank line, so that people reading the meter's output can tell one message from the next.
 * @param {MeterMsg} msg
 */
const send = (msg) => process.stdout.write(JSON.stringify(msg) + '\n\n');""")]},
       note="billing's meterUsage splits what it reads at each newline and parses every line, empty ones included.")

# ---------------------------------------------------------------------------------------------------------------
# Z04: the check of a write to a standard stream finds the stream by name in the text of the write's target. With
# the stream chosen into a variable first (out.write), no stream is named and nothing is checked. The job moves
# refusals to standard error and leaves '@message stdout'. Its test is rewritten with the same values and calls.

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

change(S, 'Z04-stream-chosen-into-variable', "The meter writes refusals to standard error, among the errors; the stream is chosen first, then written to; the @message tag is left as it was", 'meter',
       ["a message's channel changes; its @message channel is not updated", 'the stream written to is held in a variable, so the write names no stream'],
       {ME: [(""" * It is sent MeterInput lines on its standard input and answers with MeterMsg lines on its standard output,
 * each one JSON on a line of its own.""", """ * It is sent MeterInput lines on its standard input and answers with MeterMsg lines: refusals on its standard
 * error, among the errors, and everything else on its standard output, each one JSON on a line of its own."""),
             (" * A use outside its bound gets a refusal in place of a reading.\n", " * A use outside its bound gets a refusal in place of a reading, written to standard error.\n")],
        MEW: [(r"""/** @param {MeterMsg} msg */
const send = (msg) => process.stdout.write(JSON.stringify(msg) + '\n');""", r"""/**
 * Writes a message on a line of its own: a refusal to standard error, so that it shows among the errors; everything
 * else to standard output.
 * @param {MeterMsg} msg
 */
const send = (msg) => {
  const out = msg.kind === 'refused' ? process.stderr : process.stdout;
  out.write(JSON.stringify(msg) + '\n');
};""")],
        MET: METER_TEST},
       note="MeterMsg keeps '@message stdout'. billing reads the meter's standard output only.")

# ---------------------------------------------------------------------------------------------------------------
# Z05: rule 11 refuses "a value of a plain-data kind built with new from a class". The tool looks for `new` where
# the plain-data kind is expected. Built through the class's static factory, the `new` stands where a FixedAmount is
# expected, and the Amount is a call's answer.

change(S, 'Z05-amount-built-by-static-factory', "An amount cannot be changed once made: money builds it with FixedAmount.of, whose cents and currency are read through getters", 'money',
       ['what is handed back changes from plain data to an instance; its kind as TypeScript reads it does not',
        "the instance is built by a static factory of the class, not by `new` where an Amount is expected"],
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
  /**
   * Makes a fixed amount.
   * @param {number} cents
   * @param {Currency} currency
   * @returns {FixedAmount}
   */
  static of(cents, currency) {
    return new FixedAmount(cents, currency);
  }
}
"""),
             (" * Makes an amount, refusing one outside its bound.\n", " * Makes an amount, refusing one outside its bound. The amount cannot be changed once made.\n"),
             ("  /** @type {Amount} builds an Amount */\n  const out = { cents, currency };",
              "  /** @type {Amount} builds an Amount that cannot be changed */\n  const out = FixedAmount.of(cents, currency);")],
        MOT: [("test('add sums amounts of one currency", """test('an amount cannot be changed once made', () => {
  const a = amount(100, 'EUR');
  assert.throws(() => {
    /** @type {any} */ (a).cents = 5;
  }, TypeError);
  assert.equal(a.cents, 100);
});

test('add sums amounts of one currency""")]},
       note="Every @returns {Amount} stays true as TypeScript reads it (a getter is a member). JSON (door, meter) and structuredClone (store) copy an instance with private fields as {}.")

# ---------------------------------------------------------------------------------------------------------------
# Z06: rule 10: "a method or handler that only hands its call to another listed entry inherits that entry's
# errors". The tool recognises only a body that IS one call. bookings' bookquote handler hands its call to quote
# and wraps the answer in {total}: it inherits nothing, so a changed error of quote never reaches op:bookquote.

change('setups', 'Z06a-bookings-states-quote-errors', "bookings states the errors of quote on its handle (rule 10)", 'bookings',
       ['errors of a handle method stated on the kind (the standing state)'],
       {BO: [(" * @property {(room: string, party: number, nights: number) => Amount} quote what a booking would cost\n */\n",
              " * @property {(room: string, party: number, nights: number) => Amount} quote what a booking would cost\n"
              " * @throws {RangeError} quote when the room is unknown, or the party or the nights are outside their bounds\n */\n")]})

change('setups', 'Z06b-billing-expects-range-error', "billing's estimate refuses an unknown room with bookings' RangeError, and its tests say so", 'billing',
       ['a user that relies on the kind of error an operation raises (the standing state)'],
       {BI: [(" * @property {(room: string, party: number, nights: number) => Promise<Estimate>} estimate what a stay would cost, and the deposit to ask for\n",
              " * @property {(room: string, party: number, nights: number) => Promise<Estimate>} estimate what a stay would cost, and the deposit to ask for; refuses an unknown room, or a party or nights outside their bounds, with bookings' RangeError\n")],
        BIT: [("test('metered use is priced by the meter and added up'", """test('an estimate for an unknown room is refused with a RangeError', async () => {
  const { billing } = system();
  await assert.rejects(() => billing.estimate('attic', 2, 1), RangeError);
});

test('metered use is priced by the meter and added up'""")]})

change(S, 'Z06-wrapping-handler-error-kind', "An unknown room is refused with an Error, not a RangeError (kept for values out of bounds); the handle's @throws lines say so", 'bookings',
       ["kind of error stated for a handle method changes", "the operation's handler hands its call to that method and wraps the answer"],
       {BO: [(" * @throws {RangeError} quote when the room is unknown, or the party or the nights are outside their bounds\n",
              " * @throws {RangeError} quote when the party or the nights are outside their bounds\n"
              " * @throws {Error} quote when the room is unknown (an unknown room is not a value out of bounds)\n"),
             ("    if (!room) throw new RangeError(`bookings: unknown room: ${roomId}`);",
              "    if (!room) throw new Error(`bookings: unknown room: ${roomId}`);")],
        BOT: [("  assert.throws(() => bookings.open(req({ room: 'attic' })), RangeError);",
               "  assert.throws(() => bookings.open(req({ room: 'attic' })), /unknown room/);\n  assert.throws(() => bookings.quote('attic', 1, 1), /unknown room/);")]},
       before=['setups/Z06a-bookings-states-quote-errors', 'setups/Z06b-billing-expects-range-error'],
       note="bookquote: (req) => ({ total: bookings.quote(req.room, req.party, req.nights) }). billing calls bookquote through the door.")

# ---------------------------------------------------------------------------------------------------------------
# Z07: the second design's rule 6: "a function handed on as a value, not called, counts as using all of what it
# accepts". The tool applies it only to function declarations and arrow constants, not to a handle's method handed
# to map. find gains an optional second parameter (accepts more); map hands it the index.

change('setups', 'Z07-front-maps-rooms-find', "front's tests check that every seeded room is found, mapping the ids through rooms.find", 'front',
       ["a handle's method handed on as a value (the standing state)"],
       {FRT: [("test('the kinds menu has one line per kind", """test('every seeded room can be found by its id', () => {
  const rooms = createRooms({
    store: seededStore({
      rooms: [
        { id: 'big-hall', value: { id: 'big-hall', name: 'Big Hall', kind: 'hall', seats: 300 } },
        { id: 'kitchen', value: { id: 'kitchen', name: 'Kitchen', kind: 'kitchen', seats: 8 } },
      ],
    }),
  });
  assert.deepEqual(['big-hall', 'kitchen'].map(rooms.find).map((r) => r?.seats), [300, 8]);
});

test('the kinds menu has one line per kind""")]})

change(S, 'Z07-handle-method-handed-on', "rooms' find takes an optional kind: the room is found only if it is of that kind", 'rooms',
       ["a handle's method gains an optional parameter (accepts more)", 'a user hands the method to map, which passes the index as the second argument'],
       {RO: [(" * @property {(id: string) => Room | undefined} find\n",
              " * @property {(id: string, kind?: RoomKind) => Room | undefined} find the room with the id; when a kind is given, only if the room is of that kind\n"),
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
       before=['setups/Z07-front-maps-rooms-find'])

# ---------------------------------------------------------------------------------------------------------------
# Z08: a function with overloads (JSDoc @overload, which the reader understands) is listed by its first call
# signature only. The second overload's answer changes.

change('setups', 'Z08a-money-formats-lists', "formatAmount also writes a list of amounts, joined by +, as a second overload", 'money',
       ['a function with two overloads (the standing state)'],
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
        MOT: [("test('bound parts: whole number, 1 to 100'", """test('formatAmount writes several amounts joined by +', () => {
  assert.equal(formatAmount([amount(100, 'EUR'), amount(250, 'EUR')]), 'EUR 1.00 + EUR 2.50');
});

test('bound parts: whole number, 1 to 100'""")]})

change('setups', 'Z08b-billing-lists-instalments', "billing's invoice text lists the instalments, written by formatAmount's list form", 'billing',
       ["a user of a function's second overload (the standing state)"],
       {BI: [("        text: `Invoice for ${bookingId} (${status.room}): ${formatAmount(status.total)} in ${parts.length} payment(s)`,",
              "        text: `Invoice for ${bookingId} (${status.room}): ${formatAmount(status.total)} in ${parts.length} payment(s): ${formatAmount(parts)}`,")],
        BIT: [("  assert.ok(inv.text.includes(b.id));\n",
               "  assert.ok(inv.text.includes(b.id));\n  assert.match(inv.text, /: EUR \\d+\\.\\d\\d \\+ EUR \\d+\\.\\d\\d \\+ EUR \\d+\\.\\d\\d$/);\n")]})

change(S, 'Z08-second-overload-hands-back', "formatAmount's list form now hands back one line per amount, so that callers lay them out", 'money',
       ["a function's second overload hands back a different kind", 'only the first call signature is listed'],
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
       note="billing writes formatAmount(parts) into a template: a list of lines comes out joined by commas, and the reader raises nothing.")

# ---------------------------------------------------------------------------------------------------------------
# Z09: standsIn compares parameters by kind and optionality. A list parameter that becomes a rest parameter has the
# same kind (Amount[]) and is now optional: "accepts more". A caller that hands a list now hands one element.

change('setups', 'Z09a-money-sum', "money gains sum, which adds up a list of amounts", 'money',
       ['a function that accepts a list (the standing state)'],
       {MO: [("  return amount(a.cents + b.cents, a.currency);\n}\n", """  return amount(a.cents + b.cents, a.currency);
}

/**
 * Adds up a list of amounts of one currency. An empty list adds up to nothing in euros.
 * @param {Amount[]} amounts
 * @returns {Amount}
 * @throws {RangeError} when the currencies differ or the sum is outside the bound of cents
 */
export function sum(amounts) {
  return amounts.reduce((total, a) => add(total, a), amount(0, amounts[0]?.currency ?? 'EUR'));
}
""")],
        MOT: [("import { amount, add, formatAmount, splitEvenly, CURRENCIES } from '../src/index.mjs';",
               "import { amount, add, formatAmount, splitEvenly, CURRENCIES, sum } from '../src/index.mjs';"),
              ("test('formatAmount shows the currency and the value'", """test('sum adds up a list of amounts of one currency', () => {
  assert.equal(sum([amount(150, 'EUR'), amount(250, 'EUR'), amount(100, 'EUR')]).cents, 500);
  assert.equal(sum([]).cents, 0);
  assert.throws(() => sum([amount(1, 'EUR'), amount(1, 'USD')]), RangeError);
});

test('formatAmount shows the currency and the value'""")]})

change('setups', 'Z09b-billing-sums-readings', "billing keeps the meter's readings and adds them up with sum when the meter is done", 'billing',
       ['a user that hands a list to a provider function (the standing state)'],
       {BI: [("import { amount, add, formatAmount, splitEvenly } from '../../money/src/index.mjs';",
              "import { amount, formatAmount, splitEvenly, sum } from '../../money/src/index.mjs';"),
             ("        let buffer = '';\n        let total = amount(0, 'EUR');\n",
              "        let buffer = '';\n        /** @type {Amount[]} the readings' costs, in the order they come */\n        const costs = [];\n"),
             ("            if (msg.kind === 'reading') total = add(total, msg.cost);", "            if (msg.kind === 'reading') costs.push(msg.cost);"),
             ("            else if (msg.kind === 'done') resolve(total);", "            else if (msg.kind === 'done') resolve(sum(costs));")]})

change(S, 'Z09-list-parameter-becomes-rest', "sum takes its amounts one after another, sum(a, b, c), so that a caller adding two need not build a list", 'money',
       ['a list parameter becomes a rest parameter of the same kind', 'standsIn sees the same kind, now optional: accepts more'],
       {MO: [(""" * Adds up a list of amounts of one currency. An empty list adds up to nothing in euros.
 * @param {Amount[]} amounts""", """ * Adds up amounts of one currency, given one after another: sum(a, b, c). No amounts add up to nothing in euros.
 * @param {...Amount} amounts"""),
             ("export function sum(amounts) {", "export function sum(...amounts) {")],
        MOT: [("""test('sum adds up a list of amounts of one currency', () => {
  assert.equal(sum([amount(150, 'EUR'), amount(250, 'EUR'), amount(100, 'EUR')]).cents, 500);
  assert.equal(sum([]).cents, 0);
  assert.throws(() => sum([amount(1, 'EUR'), amount(1, 'USD')]), RangeError);""", """test('sum adds up amounts of one currency', () => {
  assert.equal(sum(amount(150, 'EUR'), amount(250, 'EUR'), amount(100, 'EUR')).cents, 500);
  assert.equal(sum().cents, 0);
  assert.throws(() => sum(amount(1, 'EUR'), amount(1, 'USD')), RangeError);""")]},
       before=['setups/Z09a-money-sum', 'setups/Z09b-billing-sums-readings'])

# ---------------------------------------------------------------------------------------------------------------
# Z10: standsIn compares lists by what they hold and ignores whether they are read-only. A parameter that was
# `readonly string[]` becomes `string[]` (the function now sorts the list in place): newly refused for any caller
# holding a read-only list, and a frozen list throws when sorted.

change('setups', 'Z10a-text-rules-list-words', "text-rules gains listWords, which writes a list for people: 'a, b and c'", 'text-rules',
       ['a function that accepts a read-only list (the standing state)'],
       {TR: [("""export function titleCase(text) {
  return text.replace(/\\b([a-z])/g, (m) => m.toUpperCase());
}
""", """export function titleCase(text) {
  return text.replace(/\\b([a-z])/g, (m) => m.toUpperCase());
}

/**
 * Writes a list of words for people to read: "a, b and c".
 * @param {readonly string[]} words
 * @returns {string}
 */
export function listWords(words) {
  if (words.length <= 1) return words.join('');
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}
""")],
        TRT: [("import { slugify, isEmail, titleCase } from '../src/index.mjs';",
               "import { slugify, isEmail, titleCase, listWords } from '../src/index.mjs';"),
              ("test('titleCase upper-cases the first letter of each word'", """test('listWords writes a list for people to read', () => {
  assert.equal(listWords(['hall', 'studio', 'kitchen']), 'hall, studio and kitchen');
  assert.equal(listWords(['hall']), 'hall');
  assert.equal(listWords([]), '');
});

test('titleCase upper-cases the first letter of each word'""")]})

change('setups', 'Z10b-front-lists-kinds', "front gains a line naming every kind of room, written by listWords from ROOM_KINDS", 'front',
       ['a user that hands a frozen list to a provider function (the standing state)'],
       {FR: [("import { isEmail, titleCase } from '../../text-rules/src/index.mjs';",
              "import { isEmail, titleCase, listWords } from '../../text-rules/src/index.mjs';"),
             (" * @property {() => string[]} kindsMenu one line per kind of room\n",
              " * @property {() => string[]} kindsMenu one line per kind of room\n * @property {() => string} kindsLine one line naming every kind of room\n"),
             ("""    kindsMenu() {
      return ROOM_KINDS.map((k) => titleCase(k));
    },""", """    kindsMenu() {
      return ROOM_KINDS.map((k) => titleCase(k));
    },
    kindsLine() {
      return `We have rooms of these kinds: ${listWords(ROOM_KINDS)}`;
    },""")],
        FRT: [("test('the room menu lists rooms with their seats'", """test('the kinds line names every kind of room', () => {
  assert.equal(system().kindsLine(), 'We have rooms of these kinds: hall, studio and kitchen');
});

test('the room menu lists rooms with their seats'""")]})

change(S, 'Z10-readonly-list-now-sorted', "listWords writes its words in alphabetical order, sorting the list it is given; its comment no longer says read-only, since the reader said a read-only list has no sort", 'text-rules',
       ['a read-only list parameter becomes a mutable one (newly refused)', 'standsIn ignores read-only on lists: accepts more'],
       {TR: [(""" * Writes a list of words for people to read: "a, b and c".
 * @param {readonly string[]} words
 * @returns {string}
 */
export function listWords(words) {
  if (words.length <= 1) return words.join('');""", """ * Writes a list of words for people to read, in alphabetical order, so that a list reads the same whatever order
 * its words come in: "a, b and c".
 * @param {string[]} words
 * @returns {string}
 */
export function listWords(words) {
  words.sort((x, y) => x.localeCompare(y));
  if (words.length <= 1) return words.join('');""")],
        TRT: [("""test('listWords writes a list for people to read', () => {
  assert.equal(listWords(['hall', 'studio', 'kitchen']), 'hall, studio and kitchen');""", """test('listWords writes a list for people to read, in alphabetical order', () => {
  assert.equal(listWords(['studio', 'hall', 'kitchen']), 'hall, kitchen and studio');""")]},
       before=['setups/Z10a-text-rules-list-words', 'setups/Z10b-front-lists-kinds'],
       note="ROOM_KINDS is frozen: sorting it throws a TypeError.")

# ---------------------------------------------------------------------------------------------------------------
# Z11: a generic method's accepted kinds are written as TypeScript prints them, with the constraint of its type
# parameter beside them; standsIn compares the parameters only. The door narrows what get accepts (request lines may
# call only operations that change nothing): the printed parameter is the same text, so "accepts more".

change('setups', 'Z11-front-cancels-by-request-line', "front cancels with the same request line as the cancel link in the confirmation email", 'front',
       ['a user calling a state-changing operation through a request line (the standing state)'],
       {FR: [("""    async cancel(id) {
      const b = await door.call('bookcancel', { id });""", """    async cancel(id) {
      // The same request line as the cancel link in the confirmation email.
      const b = await door.get(`op=bookcancel&id=${id}`);""")]})

change(S, 'Z11-request-lines-change-nothing', "A request line may call only an operation that changes nothing: anyone shown a link can follow it", 'door',
       ["a generic method's type parameter is newly constrained (newly refused)", 'the printed parameter text is the same; the constraint is not compared'],
       {DO: [("""/**
 * One handler for each operation in the gathered list.
 * @typedef {{[K in keyof AllOps]: (req: AllOps[K]['req']) => AllOps[K]['res']}} Handlers
 */
""", """/**
 * One handler for each operation in the gathered list.
 * @typedef {{[K in keyof AllOps]: (req: AllOps[K]['req']) => AllOps[K]['res']}} Handlers
 */

/**
 * The operations a request line may call: those that change nothing. Anyone who is shown a link can follow it, so a
 * request line must not open or cancel a booking.
 * @typedef {Exclude<keyof AllOps, 'bookopen' | 'bookcancel'>} LineOp
 */
"""),
             (" * @property {<K extends keyof AllOps>(line: `op=${K}&${string}`) => Promise<AllOps[K]['res']>} get calls an operation written as a request line, op=name&field=value; every value arrives as text\n",
              " * @property {<K extends LineOp>(line: `op=${K}&${string}`) => Promise<AllOps[K]['res']>} get calls an operation that changes nothing (a LineOp), written as a request line, op=name&field=value; every value arrives as text; refuses any other operation\n"),
             ("""/**
 * Makes a door over the handlers.""", """/** The operations that change something, which a request line may not call. */
const CHANGING = ['bookopen', 'bookcancel'];

/**
 * Makes a door over the handlers."""),
             ("""      if (!op) throw new Error('door: request line without op');
""", """      if (!op) throw new Error('door: request line without op');
      if (CHANGING.includes(op)) throw new Error(`door: a request line cannot call ${op}, which changes something`);
""")],
        DOT: [("  assert.throws(() => door.get('room=hall'), /without op/);\n",
               "  assert.throws(() => door.get('room=hall'), /without op/);\n  assert.throws(() => door.get('op=bookcancel&id=b-1'), /cannot call bookcancel/);\n")]},
       before=['setups/Z11-front-cancels-by-request-line'])

# ---------------------------------------------------------------------------------------------------------------
# Z12: rule 16: a bound on a kind that is just text reaches every field written with it. The tool carries such a
# bound into parameters and fields, not into what a function hands back. slugify hands back a Slug; Slug's bound
# changes honestly, with its test.

change('setups', 'Z12-text-rules-slug-kind', "text-rules names its kind of slug; the bound on slugify's result moves onto it", 'text-rules',
       ['a bound on a kind that is just text, handed back by a function (the standing state)'],
       {TR: [("const SLUG_MAX = 80;\n", """const SLUG_MAX = 80;

/**
 * A slug: what slugify makes of a name.
 * @typedef {string} Slug
 * @bound slug: only a-z, 0-9 and single hyphens between them
 */
"""),
             (" * @returns {string} the slug\n", " * @returns {Slug} the slug\n"),
             (" * @bound result: only a-z, 0-9 and single hyphens between them\n", "")],
        TRT: [("test('bound result: only a-z, 0-9 and single hyphens between them'", "test('bound slug: only a-z, 0-9 and single hyphens between them'")]})

change(S, 'Z12-returned-text-kind-bound', "Slugs join words with single underscores, as the venue's booking system needs; Slug's bound line, its test and slugify's tests say so", 'text-rules',
       ['bound line changed honestly, on a kind that is just text', 'the kind is what a function hands back, not a field or a parameter'],
       {TR: [(" * @bound slug: only a-z, 0-9 and single hyphens between them\n", " * @bound slug: only a-z, 0-9 and single underscores between them\n"),
             (" * Turns a name into a slug: lower-case letters and digits joined by single hyphens.\n",
              " * Turns a name into a slug: lower-case letters and digits joined by single underscores, as the venue's booking\n * system needs.\n"),
             ("    .replace(/[^a-z0-9]+/g, '-')\n    .replace(/^-+|-+$/g, '');", "    .replace(/[^a-z0-9]+/g, '_')\n    .replace(/^_+|_+$/g, '');")],
        TRT: [("test('bound slug: only a-z, 0-9 and single hyphens between them'", "test('bound slug: only a-z, 0-9 and single underscores between them'"),
              ("    assert.match(slugify(t), /^[a-z0-9]+(-[a-z0-9]+)*$/);", "    assert.match(slugify(t), /^[a-z0-9]+(_[a-z0-9]+)*$/);"),
              ("test('slugify keeps the words in order, joined by hyphens', () => {\n  assert.equal(slugify('Main Hall'), 'main-hall');\n  assert.equal(slugify('Café Øst 2'), 'cafe-st-2');",
               "test('slugify keeps the words in order, joined by underscores', () => {\n  assert.equal(slugify('Main Hall'), 'main_hall');\n  assert.equal(slugify('Café Øst 2'), 'cafe_st_2');")]},
       before=['setups/Z12-text-rules-slug-kind'],
       note="rooms makes each room's id with slugify; its tests expect ids of a-z, 0-9 and hyphens.")

# ---------------------------------------------------------------------------------------------------------------
# Z13: rule 17 lists what an exported class's constructor accepts and what it builds. A static method of the class
# is in no listing, and a user's call of it counts as a use of the class entry, which does not change.

change('setups', 'Z13a-money-tally-sum', "money's Tally gains a static sum, which adds up a list of amounts", 'money',
       ['a static method of an exported class (the standing state)'],
       {MO: [("    this.total = add(this.total, a);\n  }\n}\n", """    this.total = add(this.total, a);
  }

  /**
   * Adds up a list of amounts of one currency.
   * @param {Currency} currency the currency of the amounts, and of the total when the list is empty
   * @param {Amount[]} amounts
   * @returns {Amount}
   * @throws {RangeError} when a currency differs or the total would leave the bound of cents
   */
  static sum(currency, amounts) {
    const t = new Tally(currency);
    for (const a of amounts) t.add(a);
    return t.total;
  }
}
""")],
        MOT: [("  assert.throws(() => t.add(amount(1, 'USD')), RangeError);\n});\n", """  assert.throws(() => t.add(amount(1, 'USD')), RangeError);
});

test('Tally.sum adds up a list of amounts', () => {
  assert.equal(Tally.sum('EUR', [amount(150, 'EUR'), amount(250, 'EUR')]).cents, 400);
  assert.equal(Tally.sum('GBP', []).currency, 'GBP');
});
""")]},
       before=['setups/Y13a-money-tally'])

change('setups', 'Z13b-billing-tally-sum', "billing keeps the meter's readings and adds them up with Tally.sum when the meter is done", 'billing',
       ["a user of a class's static method (the standing state)"],
       {BI: [("import { amount, add, formatAmount, splitEvenly } from '../../money/src/index.mjs';",
              "import { amount, formatAmount, splitEvenly, Tally } from '../../money/src/index.mjs';"),
             ("        let buffer = '';\n        let total = amount(0, 'EUR');\n",
              "        let buffer = '';\n        /** @type {Amount[]} the readings' costs, in the order they come */\n        const costs = [];\n"),
             ("            if (msg.kind === 'reading') total = add(total, msg.cost);", "            if (msg.kind === 'reading') costs.push(msg.cost);"),
             ("            else if (msg.kind === 'done') resolve(total);", "            else if (msg.kind === 'done') resolve(Tally.sum('EUR', costs));")]})

change(S, 'Z13-static-method-hands-back', "Tally.sum hands back the tally itself, so that a caller can go on adding to it", 'money',
       ["a static method of an exported class hands back a different kind", 'static members are not in the listing'],
       {MO: [("""   * Adds up a list of amounts of one currency.
   * @param {Currency} currency the currency of the amounts, and of the total when the list is empty
   * @param {Amount[]} amounts
   * @returns {Amount}""", """   * Adds up a list of amounts of one currency, in a tally that more amounts can be added to.
   * @param {Currency} currency the currency of the amounts, and of the total when the list is empty
   * @param {Amount[]} amounts
   * @returns {Tally}"""),
             ("    for (const a of amounts) t.add(a);\n    return t.total;\n", "    for (const a of amounts) t.add(a);\n    return t;\n")],
        MOT: [("""  assert.equal(Tally.sum('EUR', [amount(150, 'EUR'), amount(250, 'EUR')]).cents, 400);
  assert.equal(Tally.sum('GBP', []).currency, 'GBP');""", """  assert.equal(Tally.sum('EUR', [amount(150, 'EUR'), amount(250, 'EUR')]).total.cents, 400);
  assert.equal(Tally.sum('GBP', []).total.currency, 'GBP');""")]},
       before=['setups/Y13a-money-tally', 'setups/Z13a-money-tally-sum', 'setups/Z13b-billing-tally-sum'])

# ---------------------------------------------------------------------------------------------------------------
# Z14: rule 12: a member that may be missing says so, and becoming optional is a change. The tool reads the member
# flag "optional" ([get]) and strips undefined from the member's kind. Written "| undefined", the member may be
# missing, says so, and lists exactly as before.

change(S, 'Z14-member-may-be-undefined', "Request lines become opt-in: only a door made with {lines: true} has get; on any other door get is undefined, as its kind says", 'door',
       ["a handle's method may now be undefined, written as '| undefined' in its kind", 'the factory gains an optional parameter (accepts more)'],
       {DO: [(" * @property {<K extends keyof AllOps>(line: `op=${K}&${string}`) => Promise<AllOps[K]['res']>} get calls an operation written as a request line, op=name&field=value; every value arrives as text\n",
              " * @property {(<K extends keyof AllOps>(line: `op=${K}&${string}`) => Promise<AllOps[K]['res']>) | undefined} get calls an operation written as a request line, op=name&field=value; every value arrives as text. Request lines are the older way of calling: only a door made with {lines: true} has get; on any other door it is undefined\n"),
             ("""/**
 * Makes a door over the handlers.
 * @param {Handlers} handlers
 * @returns {Door}
 */
export function createDoor(handlers) {""", """/**
 * Makes a door over the handlers.
 * @param {Handlers} handlers
 * @param {{lines?: boolean}} [options] request lines are read only when lines is true
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
  const door = { call: (op, body) => dispatch(op, body), get: undefined };
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
# Z15: rule 6: a module with no interface comments gets them as a comments-only first step. Nothing makes a job
# take that step before a real change: the notice then compares two listings of "anything", which cannot differ in
# what is accepted. calendar's weekday now takes the day as written.

change(S, 'Z15-uncommented-module-changed', "calendar's weekday takes the day as written, YYYY-MM-DD, since every caller had to parse it first (no comments-only step first)", 'calendar',
       ['a real change to a module with no interface comments, without the first step', 'what a function accepts changes; "anything" before and after'],
       {CA: [("""export function weekday(day) {
  return NAMES[day.getUTCDay()];
}""", """// The day as written, YYYY-MM-DD: every caller had to parse it first.
export function weekday(day) {
  return NAMES[parseDay(day).getUTCDay()];
}""")],
        CAT: [("""  assert.equal(weekday(parseDay('2026-11-15')), 'Sun');
  assert.equal(weekday(parseDay('2026-11-16')), 'Mon');""", """  assert.equal(weekday('2026-11-15'), 'Sun');
  assert.equal(weekday('2026-11-16'), 'Mon');
  assert.throws(() => weekday('2026-02-30'), RangeError);""")]},
       note="reports calls weekday(parseDay(b.day)): parseDay of a Date finds no YYYY-MM-DD and throws.")

# ---------------------------------------------------------------------------------------------------------------
# Z16: Node's globals that the tool's description of Node does not name. The check counts as "cannot tell" only the
# names the reader itself suggests Node's descriptions for (process, require, Buffer, module); any other global of
# Node's (crypto) is "cannot find name", refused as a comment that disagrees with the code.

change(S, 'Z16-random-booking-ids', "Booking ids are b- and a random UUID, so that one id says nothing about the bookings before it", 'bookings',
       ['honest code using a global of Node the tool does not describe (crypto.randomUUID)', 'content of an id changes; its kind does not'],
       {BO: [("  const { store, rooms } = deps;\n  let next = 1;\n", "  const { store, rooms } = deps;\n"),
             ("""      const total = quote(req.room, req.party, req.nights);
      /** @type {Booking} builds a Booking */
      const b = {
        id: `b-${next++}`,""", """      const total = quote(req.room, req.party, req.nights);
      // An id that says nothing about the bookings before it.
      const id = `b-${crypto.randomUUID()}`;
      /** @type {Booking} builds a Booking */
      const b = {
        id,""")],
        BOT: [("test('cancel closes an open booking once", """test('booking ids are b- and a random UUID, so one says nothing about another', () => {
  const { bookings } = system();
  const a = bookings.open(req());
  const b = bookings.open(req());
  assert.match(a.id, /^b-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  assert.notEqual(a.id, b.id);
});

test('cancel closes an open booking once""")]})

# ---------------------------------------------------------------------------------------------------------------
# Z17: an everyday idiom the reader types too widely: list.filter(Boolean) leaves out what is missing, but the
# reader keeps "| undefined" in the list's kind. The complaint is "not assignable" (2322), not "possibly undefined".

change(S, 'Z17-filter-boolean', "rooms gains findAll: the rooms with the given ids, in order, ids with no room left out", 'rooms',
       ['new handle method (new entry)', 'honest .filter(Boolean) the reader cannot follow'],
       {RO: [(" * @property {(id: string) => Room | undefined} find\n",
              " * @property {(id: string) => Room | undefined} find\n * @property {(ids: string[]) => Room[]} findAll the rooms with these ids, in the same order; an id with no room is left out\n"),
             ("""    find(id) {
      const rec = store.get('rooms', id);
      return rec ? /** @type {Room} checks nothing: the store holds only Rooms in this table */ (rec.value) : undefined;
    },""", """    find,
    findAll(ids) {
      return ids.map(find).filter(Boolean);
    },"""),
             ("  const { store } = deps;\n  return {\n", """  const { store } = deps;
  /** @param {string} id */
  const find = (id) => {
    const rec = store.get('rooms', id);
    return rec ? /** @type {Room} checks nothing: the store holds only Rooms in this table */ (rec.value) : undefined;
  };
  return {
""")],
        ROT: [("test('list filters by kind and keeps name order'", """test('findAll finds the rooms with the given ids, in order, leaving out ids with no room', () => {
  const rooms = fresh();
  rooms.add({ name: 'Hall', kind: 'hall', seats: 80 });
  rooms.add({ name: 'Kitchen', kind: 'kitchen', seats: 8 });
  assert.deepEqual(rooms.findAll(['kitchen', 'attic', 'hall']).map((r) => r.name), ['Kitchen', 'Hall']);
});

test('list filters by kind and keeps name order'""")]})

# ---------------------------------------------------------------------------------------------------------------
# Z18: tool change 15 gave the reader the library of 2023; the product runs on Node 22, whose language has
# Object.groupBy (2024).

change(S, 'Z18-object-groupby', "rooms gains byKind: the rooms of each kind there is a room of, with Object.groupBy", 'rooms',
       ['new handle method (new entry)', "honest code using a method of the runtime's language newer than the reader's library (ES2024)"],
       {RO: [(" * @property {(kind?: RoomKind) => Room[]} list rooms, only of one kind when it is given, in name order\n",
              " * @property {(kind?: RoomKind) => Room[]} list rooms, only of one kind when it is given, in name order\n"
              " * @property {() => Partial<Record<RoomKind, Room[]>>} byKind the rooms of each kind there is a room of, each list in name order\n"),
             ("        .sort((a, b) => a.name.localeCompare(b.name));\n    },\n  };\n}\n", """        .sort((a, b) => a.name.localeCompare(b.name));
    },
    byKind() {
      return Object.groupBy(this.list(), (r) => r.kind);
    },
  };
}
""")],
        ROT: [("test('roomlist operation answers with the rooms of a kind'", """test('byKind lists the rooms of each kind, in name order', () => {
  const rooms = fresh();
  rooms.add({ name: 'B Hall', kind: 'hall', seats: 50 });
  rooms.add({ name: 'A Hall', kind: 'hall', seats: 50 });
  rooms.add({ name: 'Kitchen', kind: 'kitchen', seats: 8 });
  const by = rooms.byKind();
  assert.deepEqual(by.hall?.map((r) => r.name), ['A Hall', 'B Hall']);
  assert.equal(by.kitchen?.length, 1);
  assert.equal(by.studio, undefined);
});

test('roomlist operation answers with the rooms of a kind'""")]})

# ---------------------------------------------------------------------------------------------------------------
# Z19: a bound line is free text. The reader's comment parser starts a new tag at an @ that follows a space and is
# not followed by one, so an honest bound line about email addresses is read cut short, and the check's rule that a
# bound line and its test carry the same words refuses both.

change(S, 'Z19-at-sign-in-bound-line', "isEmail states the bound on its result, with a test named for it", 'text-rules',
       ['a new bound line, with its test, on an existing function', 'the line holds "@," as plain text'],
       {TR: [(""" * Says whether text looks like an email address: something, an at sign, something, a dot, something; no spaces.
 * @param {string} text
 * @returns {boolean}
 */""", """ * Says whether text looks like an email address: something, an at sign, something, a dot, something; no spaces.
 * @param {string} text
 * @returns {boolean}
 * @bound result: true only for text with no spaces and exactly one @, with a dot somewhere after it
 */""")],
        TRT: [("test('isEmail recognises addresses and refuses others'", """test('bound result: true only for text with no spaces and exactly one @, with a dot somewhere after it', () => {
  assert.equal(isEmail('ann@example.org'), true);
  assert.equal(isEmail('ann@@example.org'), false);
  assert.equal(isEmail('ann@ex@ample.org'), false);
  assert.equal(isEmail('ann@example'), false);
  assert.equal(isEmail('a nn@example.org'), false);
});

test('isEmail recognises addresses and refuses others'""")]})

# ---------------------------------------------------------------------------------------------------------------
# Z20: rule 15 compares what a bound test checks, "including named values and helpers it uses"; the tool's
# fingerprint keeps the NAMES of the functions a test calls. Renaming the test file's helper changes every bound
# test that uses it.

change(S, 'Z20-test-helper-renamed', "bookings' test helper system is renamed bookingSystem; nothing else changes", 'bookings',
       ['a helper of the test file renamed', 'the values and checks of every bound test stay'],
       {BOT: [('ALL', 'system()', 'bookingSystem()')]})

# ---------------------------------------------------------------------------------------------------------------
# Z21: the second design's rule 1: the kinds of error named by @throws are in the listing. The tool keeps the list
# of @throws tags of a function as written, one per tag: splitting one explanation into two lines naming the same
# kind changes the list.

change(S, 'Z21-throws-explained-in-two-lines', "add's @throws comment explains its two cases on two lines; the kind of error is the same", 'money',
       ['a @throws comment split into two lines naming the same kind', 'the kinds of error raised do not change'],
       {MO: [(" * @throws {RangeError} when the currencies differ or the sum is outside the bound of cents\n",
              " * @throws {RangeError} when the currencies differ\n * @throws {RangeError} when the sum is outside the bound of cents\n")]})
