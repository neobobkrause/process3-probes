# The planned series. Each change is one commit's worth of edits to one provider (and, where a job would,
# that provider's own tests). Read by changes/make.py.
S = 'planned'
TR, MO, CA, ST, RO, BO, ME = ('text-rules/src/index.mjs', 'money/src/index.mjs', 'calendar/src/index.mjs',
                              'store/src/index.mjs', 'rooms/src/index.mjs', 'bookings/src/index.mjs', 'meter/src/index.mjs')
TRT, MOT, CAT, STT, ROT, BOT, MET = ('text-rules/test/index.test.mjs', 'money/test/index.test.mjs', 'calendar/test/index.test.mjs',
                                     'store/test/index.test.mjs', 'rooms/test/index.test.mjs', 'bookings/test/index.test.mjs', 'meter/test/index.test.mjs')

change(S, 'P01-price-content', 'The price per seat and night goes up: a different valid answer, same domain and range', 'bookings',
       ['content only'],
       {BO: [('export const PRICE_PER_SEAT_NIGHT = 1500;', 'export const PRICE_PER_SEAT_NIGHT = 1800;')]})

change(S, 'P02-reword-explanation', "slugify's explanation is reworded; no bound line changes", 'text-rules',
       ['explanation in a comment reworded'],
       {TR: [(""" * Turns a name into a slug: lower-case letters and digits joined by single hyphens.
 * Accents are dropped, and anything that is not a letter or a digit separates words.""",
              """ * Makes a slug out of a name. Letters lose their accents and become lower case; each run of
 * other characters becomes a single hyphen, and hyphens at either end are dropped.""")]})

change(S, 'P03-remove-function', 'titleCase is removed', 'text-rules', ['function removed', 'function imported by name'],
       {TR: [("""

/**
 * Upper-cases the first letter of each word and leaves the rest alone.
 * @param {string} text
 * @returns {string}
 */
export function titleCase(text) {
  return text.replace(/\\b([a-z])/g, (m) => m.toUpperCase());
}
""", '\n')],
        TRT: [("import { slugify, isEmail, titleCase } from '../src/index.mjs';", "import { slugify, isEmail } from '../src/index.mjs';"),
              ("""

test('titleCase upper-cases the first letter of each word', () => {
  assert.equal(titleCase('small hall'), 'Small Hall');
  assert.equal(titleCase('Hall'), 'Hall');
});
""", '\n')]})

change(S, 'P04-rename-function', 'splitEvenly is renamed splitAmount', 'money', ['function renamed'],
       {MO: [('export function splitEvenly(a, parts) {', 'export function splitAmount(a, parts) {'),
             ("'splitEvenly: parts out of bounds'", "'splitAmount: parts out of bounds'")],
        MOT: [('ALL', 'splitEvenly', 'splitAmount')]})

change(S, 'P05-answer-field-removed', "bookstatus no longer hands back the room", 'bookings',
       ['field of an answer removed', 'operation called by name in a request line'],
       {BO: [(" *   bookstatus: {req: {id: string}, res: {state: Booking['state'], total: Amount, room: string}},",
              " *   bookstatus: {req: {id: string}, res: {state: Booking['state'], total: Amount}},"),
             ('return { state: b.state, total: b.total, room: b.room };', 'return { state: b.state, total: b.total };')],
        BOT: [("{ state: 'open', total: b.total, room: 'hall' }", "{ state: 'open', total: b.total }")]})

change(S, 'P06-answer-field-renamed', "A room's seats are now called capacity in what rooms hands back", 'rooms',
       ['field of an answer renamed', 'factory handle reaching users in a bag of dependencies'],
       {RO: [(""" * @property {number} seats
 * @bound seats: whole number, 1 to 500""", """ * @property {number} capacity
 * @bound capacity: whole number, 1 to 500"""),
             ('const room = { id, name: input.name, kind: input.kind, seats: input.seats };',
              'const room = { id, name: input.name, kind: input.kind, capacity: input.seats };')],
        ROT: [("test('bound seats: whole number, 1 to 500'", "test('bound capacity: whole number, 1 to 500'"),
              ("kind: 'studio', seats: 1 }).seats, 1);", "kind: 'studio', seats: 1 }).capacity, 1);"),
              ("kind: 'hall', seats: 500 }).seats, 500);", "kind: 'hall', seats: 500 }).capacity, 500);")]})

change(S, 'P07-accept-optional', 'Opening a booking accepts an optional arrival time', 'bookings',
       ['one more optional thing accepted'],
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
      const total""")],
        BOT: [("test('bound nights: whole number, 1 to 14'", """test('an arrival time is accepted and checked', () => {
  const { bookings } = system();
  assert.equal(bookings.open(req({ arrival: 'evening' })).state, 'open');
  assert.throws(() => bookings.open(req({ arrival: /** @type {any} */ ('midnight') })), RangeError);
});

test('bound nights: whole number, 1 to 14'""")]})

change(S, 'P08-newly-required', 'Opening a booking now requires a contact email', 'bookings',
       ['field newly required'],
       {BO: [(""" * @property {number} party
 * @property {string} [note]
 */

/**
 * The bookings' handle.""", """ * @property {number} party
 * @property {string} contact an email address to reach the party
 * @property {string} [note]
 * @bound contact: an email address, something@something.something
 */

/**
 * The bookings' handle."""),
             ("""      const first = parseDay(req.day);
      const total""", """      if (typeof req.contact !== 'string' || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(req.contact)) {
        throw new RangeError('bookings: a contact email is needed');
      }
      const first = parseDay(req.day);
      const total""")],
        BOT: [("  room: 'hall', day: '2026-12-01', nights: 2, party: 10, ...over,", "  room: 'hall', day: '2026-12-01', nights: 2, party: 10, contact: 'desk@example.org', ...over,"),
              ("test('bound nights: whole number, 1 to 14'", """test('bound contact: an email address, something@something.something', () => {
  const { bookings } = system();
  assert.equal(bookings.open(req({ contact: 'a@b.cd' })).state, 'open');
  assert.throws(() => bookings.open(req({ contact: 'nobody' })), RangeError);
});

test('bound nights: whole number, 1 to 14'""")]})

change(S, 'P09-newly-refused', 'The store refuses a value that is not an object', 'store',
       ['value newly refused', 'test helper published by a provider'],
       {ST: [(' * @property {(table: string, id: string, value: unknown) => Stored} put writes a record and hands back what is now held',
              ' * @property {(table: string, id: string, value: object) => Stored} put writes a record and hands back what is now held; the value must be an object'),
             ("""    put(table, id, value) {
      checkNames(table, id);""", """    put(table, id, value) {
      checkNames(table, id);
      if (typeof value !== 'object' || value === null) throw new TypeError('store: a value must be an object');""")],
        'store/src/testing.mjs': [(' * @param {Object<string, Array<{id: string, value: unknown}>>} tables', ' * @param {Object<string, Array<{id: string, value: object}>>} tables')],
        STT: [("  const first = s.put('t', 'x', 1);\n  assert.ok(Number.isInteger(first.version) && first.version >= 1);\n  const second = s.put('t', 'x', 2);",
               "  const first = s.put('t', 'x', { n: 1 });\n  assert.ok(Number.isInteger(first.version) && first.version >= 1);\n  const second = s.put('t', 'x', { n: 2 });"),
              ('ALL', ", 0);", ", {});"),
              ("  s.put('t', 'b', 1);\n  s.put('t', 'a', 2);\n  s.put('t', 'b', 3);", "  s.put('t', 'b', { n: 1 });\n  s.put('t', 'a', { n: 2 });\n  s.put('t', 'b', { n: 3 });"),
              ("  const s = seededStore({ t: [{ id: 'x', value: 5 }], u: [] });\n  assert.equal(s.get('t', 'x')?.value, 5);",
               "  const s = seededStore({ t: [{ id: 'x', value: { n: 5 } }], u: [] });\n  assert.deepEqual(s.get('t', 'x')?.value, { n: 5 });"),
              ("test('list keeps first-written order", """test('a value that is not an object is refused', () => {
  const s = createStore();
  assert.throws(() => s.put('t', 'x', /** @type {any} */ (5)), TypeError);
});

test('list keeps first-written order""")]})

change(S, 'P10-answer-gains-field', 'A booking now also says when it was opened', 'bookings', ['answer gains a field'],
       {BO: [(' * @property {Amount} total what the booking costs\n', ' * @property {Amount} total what the booking costs\n * @property {string} created when the booking was opened, as an ISO date and time\n'),
             ("        state: 'open',\n        total,\n", "        state: 'open',\n        total,\n        created: new Date().toISOString(),\n")],
        BOT: [("  assert.equal(b.note, 'choir');", "  assert.equal(b.note, 'choir');\n  assert.ok(!Number.isNaN(Date.parse(b.created)));")]})

change(S, 'P11-list-gains-name', 'A new kind of room: garden', 'rooms', ['list gains a name', 'exported list that users read'],
       {RO: [("(['hall', 'studio', 'kitchen'])", "(['hall', 'studio', 'kitchen', 'garden'])")]})

change(S, 'P12-bound-line-changed', 'An amount may now be at most 500,000 cents (code and bound line both changed)', 'money',
       ['bound line changed'],
       {MO: [(' * @bound cents: whole number, 0 to 10,000,000 inclusive', ' * @bound cents: whole number, 0 to 500,000 inclusive'),
             ('const MAX_CENTS = 10_000_000;', 'const MAX_CENTS = 500_000;')],
        MOT: [("""test('bound cents: whole number, 0 to 10,000,000 inclusive', () => {
  assert.equal(amount(0, 'EUR').cents, 0);
  assert.equal(amount(10_000_000, 'EUR').cents, 10_000_000);
  assert.throws(() => amount(-1, 'EUR'), RangeError);
  assert.throws(() => amount(10_000_001, 'EUR'), RangeError);""", """test('bound cents: whole number, 0 to 500,000 inclusive', () => {
  assert.equal(amount(0, 'EUR').cents, 0);
  assert.equal(amount(500_000, 'EUR').cents, 500_000);
  assert.throws(() => amount(-1, 'EUR'), RangeError);
  assert.throws(() => amount(500_001, 'EUR'), RangeError);"""),
              ("assert.throws(() => add(amount(10_000_000, 'EUR'), amount(1, 'EUR')), RangeError);", "assert.throws(() => add(amount(500_000, 'EUR'), amount(1, 'EUR')), RangeError);")]})

change(S, 'P13-kind-renamed', 'The kind Amount is renamed Money; its shape is unchanged', 'money', ['kind renamed with its shape unchanged'],
       {MO: [('RE', r'\bAmount\b', 'Money')]})

change(S, 'P14-meaning-changed-comment-updated', "bookquote's total now means one night, and its bound line says so", 'bookings',
       ['change of meaning under an unchanged name, comment updated'],
       {BO: [(' * @bound bookquote.total: what the whole stay costs, for the whole party and every night', ' * @bound bookquote.total: what one night costs, for the whole party'),
             ('bookquote: (req) => ({ total: bookings.quote(req.room, req.party, req.nights) }),', 'bookquote: (req) => ({ total: bookings.quote(req.room, req.party, 1) }),')],
        BOT: [("test('bound bookquote.total: what the whole stay costs, for the whole party and every night', () => {", "test('bound bookquote.total: what one night costs, for the whole party', () => {"),
              ("assert.equal(h.bookquote({ room: 'hall', party: 4, nights: 3 }).total.cents, b.total.cents);", "assert.equal(h.bookquote({ room: 'hall', party: 4, nights: 3 }).total.cents * 3, b.total.cents);"),
              ("assert.deepEqual(h.bookquote({ room: 'hall', party: 10, nights: 2 }).total, b.total);", "assert.equal(h.bookquote({ room: 'hall', party: 10, nights: 2 }).total.cents * 2, b.total.cents);")]})

change(S, 'P15-meaning-changed-comment-not-updated', "bookquote's total now means one night; the bound line is left as it was", 'bookings',
       ['change of meaning under an unchanged name, comment NOT updated'],
       {BO: [('bookquote: (req) => ({ total: bookings.quote(req.room, req.party, req.nights) }),', 'bookquote: (req) => ({ total: bookings.quote(req.room, req.party, 1) }),')],
        BOT: [("assert.equal(h.bookquote({ room: 'hall', party: 4, nights: 3 }).total.cents, b.total.cents);", "assert.equal(h.bookquote({ room: 'hall', party: 4, nights: 3 }).total.cents * 3, b.total.cents);"),
              ("assert.deepEqual(h.bookquote({ room: 'hall', party: 10, nights: 2 }).total, b.total);", "assert.equal(h.bookquote({ room: 'hall', party: 10, nights: 2 }).total.cents * 2, b.total.cents);")]},
       note='The job updated its own tests to the new meaning but neither the bound line nor the test name.')

change(S, 'P16-code-changed-comment-forgotten-visible', 'isEmail now hands back {ok, reason}; its comment still says boolean', 'text-rules',
       ['code changed and comment forgotten, where the tool can see it'],
       {TR: [("""export function isEmail(text) {
  return typeof text === 'string' && /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(text);
}""", """export function isEmail(text) {
  if (typeof text !== 'string' || text === '') return { ok: false, reason: 'empty' };
  if (/\\s/.test(text)) return { ok: false, reason: 'has spaces' };
  return /^[^@]+@[^@]+\\.[^@]+$/.test(text) ? { ok: true } : { ok: false, reason: 'not name@place.domain' };
}""")],
        TRT: [("""  assert.equal(isEmail('ann@example.org'), true);
  assert.equal(isEmail('ann@example'), false);
  assert.equal(isEmail('ann example@x.org'), false);
  assert.equal(isEmail(''), false);""", """  assert.equal(isEmail('ann@example.org').ok, true);
  assert.equal(isEmail('ann@example').ok, false);
  assert.equal(isEmail('ann example@x.org').ok, false);
  assert.equal(isEmail('').ok, false);""")]},
       note='The job changed its code and its own tests, and forgot the @returns comment.')

change(S, 'P17-code-changed-comment-forgotten-running-only', 'A party may now be at most 100 in the code; bound line and tests left as they were', 'bookings',
       ['code changed and comment forgotten, where only running code enforces it', 'bound enforced only by running code'],
       {BO: [('party < 1 || party > 200 || party > seats', 'party < 1 || party > 100 || party > seats')]},
       note="The job changed one number in the code and nothing else. Its own test named for the party bound is left as it was.")

change(S, 'P18-operation-retired', 'The bookcancel operation is retired (cancelling stays possible through the handle)', 'bookings',
       ['operation retired', 'operation called by name through the door'],
       {BO: [(' *   bookcancel: {req: {id: string}, res: Booking},\n', ''),
             ('    bookcancel: (req) => bookings.cancel(req.id),\n', '')],
        BOT: [("assert.equal(h.bookcancel({ id: b.id }).state, 'cancelled');", "assert.equal(bookings.cancel(b.id).state, 'cancelled');")]})

change(S, 'P19-operation-body-field-renamed', "bookquote's body field party is renamed people", 'bookings', ["operation's body field renamed"],
       {BO: [(' *   bookquote: {req: {room: string, party: number, nights: number}, res: {total: Amount}}', ' *   bookquote: {req: {room: string, people: number, nights: number}, res: {total: Amount}}'),
             ('bookings.quote(req.room, req.party, req.nights)', 'bookings.quote(req.room, req.people, req.nights)')],
        BOT: [("h.bookquote({ room: 'hall', party: 4, nights: 3 })", "h.bookquote({ room: 'hall', people: 4, nights: 3 })"),
              ("h.bookquote({ room: 'hall', party: 10, nights: 2 })", "h.bookquote({ room: 'hall', people: 10, nights: 2 })")]})

change(S, 'P20-message-kind-changed', "The meter's reading now carries price where it carried cost", 'meter',
       ["message's kind changed between two separately running parts"],
       {ME: [(" * @typedef {{kind: 'reading', room: string, minutes: number, cost: Amount}", " * @typedef {{kind: 'reading', room: string, minutes: number, price: Amount}")],
        'meter/src/worker.mjs': [('cost: amount(input.minutes * RATE_CENTS_PER_MINUTE', 'price: amount(input.minutes * RATE_CENTS_PER_MINUTE')],
        MET: [('assert.ok(a.cost.cents > b.cost.cents);', 'assert.ok(a.price.cents > b.price.cents);'),
              ('assert.equal(a.cost.cents, b.cost.cents * 30);', 'assert.equal(a.price.cents, b.price.cents * 30);')]})

change(S, 'P21-unfollowable-users-provider', 'The store gains a count method', 'store',
       ['any change to the provider of the user that cannot be followed', 'new entry added'],
       {ST: [(" * @property {(table: string, id: string) => boolean} remove says whether there was a record to remove\n",
              " * @property {(table: string, id: string) => boolean} remove says whether there was a record to remove\n * @property {(table: string) => number} count how many records a table holds\n"),
             ("""    remove(table, id) {
      checkNames(table, id);
      return tableOf(table).delete(id);
    },""", """    remove(table, id) {
      checkNames(table, id);
      return tableOf(table).delete(id);
    },
    count(table) {
      checkNames(table);
      return tableOf(table).size;
    },""")],
        STT: [("test('seededStore holds the given records'", """test('count says how many records a table holds', () => {
  const s = createStore();
  assert.equal(s.count('t'), 0);
  s.put('t', 'a', 1);
  s.put('t', 'a', 2);
  s.put('t', 'b', 3);
  assert.equal(s.count('t'), 2);
});

test('seededStore holds the given records'""")]})

CAL_COMMENTED = """/**
 * Days of the calendar, held as Dates at midnight UTC and written YYYY-MM-DD.
 */
const DAY_MS = 86400000;
const NAMES = /** @type {const} */ (['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);

/**
 * Reads a day written YYYY-MM-DD.
 * @param {string} text
 * @returns {Date} midnight UTC of that day
 * @bound text: a real calendar day written YYYY-MM-DD
 * @throws {RangeError} when text is outside its bound
 */
export function parseDay(text) {
  const m = /^(\\d{4})-(\\d{2})-(\\d{2})$/.exec(text);
  if (!m) throw new RangeError('parseDay: expected YYYY-MM-DD');
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  if (d.getUTCMonth() !== Number(m[2]) - 1 || d.getUTCDate() !== Number(m[3])) {
    throw new RangeError('parseDay: no such day');
  }
  return d;
}

/**
 * Writes a day as YYYY-MM-DD.
 * @param {Date} day
 * @returns {string}
 */
export function formatDay(day) {
  return day.toISOString().slice(0, 10);
}

/**
 * The day n days after a day (before it, when n is negative).
 * @param {Date} day
 * @param {number} n
 * @returns {Date}
 */
export function addDays(day, n) {
  return new Date(day.getTime() + n * DAY_MS);
}

/**
 * How many days from a to b, rounded to a whole number; negative when b is before a.
 * @param {Date} a
 * @param {Date} b
 * @returns {number}
 */
export function daysBetween(a, b) {
  return Math.round((b.getTime() - a.getTime()) / DAY_MS);
}

/**
 * The day of the week, in three letters.
 * @param {Date} day
 * @returns {'Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat'}
 */
export function weekday(day) {
  return NAMES[day.getUTCDay()];
}
"""

change(S, 'P22a-first-job-comments-step', "calendar's first job, step one: interface comments added, describing the module as it stands", 'calendar',
       ['the first job on the module without comments: the comments-only step', 'module that starts with no interface comments'],
       {CA: CAL_COMMENTED,
        CAT: [("test('weekday names the day of the week'", """test('bound text: a real calendar day written YYYY-MM-DD', () => {
  assert.equal(formatDay(parseDay('2028-02-29')), '2028-02-29');
  assert.throws(() => parseDay('2027-02-29'), RangeError);
  assert.throws(() => parseDay('2027-2-1'), RangeError);
});

test('weekday names the day of the week'""")]},
       note='Iteration 3 (rule 9): the comments-only step adds the test named for the bound line it writes; in iterations 1 and 2 it did not, and the real change added it.')

change(S, 'P22b-first-job-real-change', "calendar's first job, step two: addDays refuses a number of days that is not whole", 'calendar',
       ['the first job on the module without comments: the real change'],
       {CA: [(""" * @param {number} n
 * @returns {Date}
 */
export function addDays(day, n) {
  return new Date""", """ * @param {number} n
 * @returns {Date}
 * @bound n: a whole number of days
 * @throws {RangeError} when n is outside its bound
 */
export function addDays(day, n) {
  if (!Number.isInteger(n)) throw new RangeError('addDays: n must be a whole number of days');
  return new Date""")],
        CAT: [("test('weekday names the day of the week'", """test('bound n: a whole number of days', () => {
  const a = parseDay('2026-03-01');
  assert.equal(formatDay(addDays(a, -1)), '2026-02-28');
  assert.throws(() => addDays(a, 0.5), RangeError);
});

test('weekday names the day of the week'""")]},
       before=['P22a-first-job-comments-step'])

change('setups', 'P23-billing-already-disagrees', 'Billing calls formatAmount with an extra argument its comment does not have', 'billing',
       ['a user that already disagrees with its provider (the standing state)'],
       {'billing/src/index.mjs': [('${formatAmount(status.total)} in ${parts.length} payment(s)', "${formatAmount(status.total, 'long')} in ${parts.length} payment(s)")]})

change(S, 'P23-user-already-disagrees', 'splitEvenly now hands back {parts, each}; billing already disagreed with money before this', 'money',
       ['a user that already disagrees with its provider\'s stated interface'],
       {MO: [(""" * @returns {Amount[]}
 * @bound parts: whole number, 1 to 100""", """ * @returns {{parts: Amount[], each: number}} the parts, and the smallest part in cents
 * @bound parts: whole number, 1 to 100"""),
             ('  for (let i = 0; i < parts; i++) out.push(amount(base + (i < extra ? 1 : 0), a.currency));\n  return out;',
              '  for (let i = 0; i < parts; i++) out.push(amount(base + (i < extra ? 1 : 0), a.currency));\n  return { parts: out, each: base };')],
        MOT: [("assert.equal(splitEvenly(amount(100, 'EUR'), 1).length, 1);", "assert.equal(splitEvenly(amount(100, 'EUR'), 1).parts.length, 1);"),
              ("assert.equal(splitEvenly(amount(100, 'EUR'), 100).length, 100);", "assert.equal(splitEvenly(amount(100, 'EUR'), 100).parts.length, 100);"),
              ("const parts = splitEvenly(amount(1001, 'GBP'), 3);", "const { parts } = splitEvenly(amount(1001, 'GBP'), 3);")]},
       before=['setups/P23-billing-already-disagrees'])

change(S, 'P24-new-entry', 'text-rules gains truncate', 'text-rules', ['new entry added'],
       {TR: [("""
/**
 * Says whether text looks like an email address""", """
/**
 * Shortens text to at most max characters, ending with an ellipsis when it was cut.
 * @param {string} text
 * @param {number} max
 * @returns {string}
 * @bound max: whole number, 1 to 1000
 * @throws {RangeError} when max is outside its bound
 */
export function truncate(text, max) {
  if (!Number.isInteger(max) || max < 1 || max > 1000) throw new RangeError('truncate: max out of bounds');
  return text.length <= max ? text : text.slice(0, max - 1) + '\\u2026';
}

/**
 * Says whether text looks like an email address""")],
        TRT: [("import { slugify, isEmail, titleCase } from '../src/index.mjs';", "import { slugify, isEmail, titleCase, truncate } from '../src/index.mjs';"),
              ("test('isEmail recognises", """test('bound max: whole number, 1 to 1000', () => {
  assert.equal(truncate('abc', 1).length, 1);
  assert.equal(truncate('abc', 1000), 'abc');
  assert.throws(() => truncate('abc', 0), RangeError);
  assert.throws(() => truncate('abc', 1001), RangeError);
});

test('truncate keeps short text and cuts long text to max', () => {
  assert.equal(truncate('hall', 10), 'hall');
  assert.ok(truncate('a long name', 5).length <= 5);
});

test('isEmail recognises""")]})

change(S, 'P25-two-changes-one-commit', "rooms: adding a room accepts an optional floor, and roomlist's answer renames rooms to items", 'rooms',
       ['two different changes in one commit'],
       {RO: [(""" * What it takes to add a room.
 * @typedef {Object} NewRoom
 * @property {string} name
 * @property {RoomKind} kind
 * @property {number} seats
 */""", """ * What it takes to add a room.
 * @typedef {Object} NewRoom
 * @property {string} name
 * @property {RoomKind} kind
 * @property {number} seats
 * @property {number} [floor] which floor the room is on; checked, not kept
 */"""),
             (' *   roomlist: {req: {kind?: RoomKind}, res: {rooms: Room[]}}', ' *   roomlist: {req: {kind?: RoomKind}, res: {items: Room[]}}'),
             ('roomlist: (req) => ({ rooms: rooms.list(req.kind) }),', 'roomlist: (req) => ({ items: rooms.list(req.kind) }),'),
             ("""      if (!Number.isInteger(input.seats) || input.seats < 1 || input.seats > 500) {""", """      if (input.floor !== undefined && !Number.isInteger(input.floor)) throw new RangeError('rooms: floor must be whole');
      if (!Number.isInteger(input.seats) || input.seats < 1 || input.seats > 500) {""")],
        ROT: [("h.roomlist({ kind: 'kitchen' }).rooms.map", "h.roomlist({ kind: 'kitchen' }).items.map"),
              ("h.roomlist({}).rooms.length", "h.roomlist({}).items.length")]})

change(S, 'P26-reaches-through-third-module', "Amount's field cents is renamed minor; front reads it only from what bookings passes on", 'money',
       ['change that reaches a user only through a third module that passes a value on'],
       {MO: [(' * @property {number} cents the amount in whole cents', ' * @property {number} minor the amount in whole cents'),
             (' * @bound cents: whole number, 0 to 10,000,000 inclusive', ' * @bound minor: whole number, 0 to 10,000,000 inclusive'),
             ('const out = { cents, currency };', 'const out = { minor: cents, currency };'),
             ('ALL', 'a.cents', 'a.minor'), ('ALL', 'b.cents', 'b.minor')],
        MOT: [('ALL', '.cents', '.minor'), ("test('bound cents:", "test('bound minor:")]})

change(S, 'P27-test-helper-changed', "The store's test helper seededStore now takes a list of rows, each naming its table", 'store',
       ['test helper that a provider publishes and a user\'s tests import'],
       {'store/src/testing.mjs': [(""" * Makes a store already holding the given records, each written once.
 * @param {Object<string, Array<{id: string, value: unknown}>>} tables the records to put, by table name
 * @returns {import('./index.mjs').Store}
 */
export function seededStore(tables) {
  const store = createStore();
  for (const [table, rows] of Object.entries(tables)) {
    for (const row of rows) store.put(table, row.id, row.value);
  }
  return store;
}""", """ * Makes a store already holding the given records, each written once, in the order given.
 * @param {Array<{table: string, id: string, value: unknown}>} rows the records to put
 * @returns {import('./index.mjs').Store}
 */
export function seededStore(rows) {
  const store = createStore();
  for (const row of rows) store.put(row.table, row.id, row.value);
  return store;
}""")],
        STT: [("  const s = seededStore({ t: [{ id: 'x', value: 5 }], u: [] });", "  const s = seededStore([{ table: 't', id: 'x', value: 5 }]);")]})

change(S, 'P28-handle-method-renamed', "The store handle's get is renamed read", 'store',
       ['factory handle method renamed, the handle reaching users in a bag of dependencies'],
       {ST: [(' * @property {(table: string, id: string) => Stored | undefined} get\n', ' * @property {(table: string, id: string) => Stored | undefined} read\n'),
             ('    get(table, id) {', '    read(table, id) {')],
        STT: [('ALL', 's.get(', 's.read(')]})
