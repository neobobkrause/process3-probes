# Round 8: an independent adversary's series against the seventh design (notes/iteration-7-design.md), written before
# anything was run on it. Each change is one commit's worth of edits to ONE provider (and that provider's own tests
# where its job would keep them true to its rules). Set-ups (series 'setups', ids T..a-...) put the product in a state
# that both "before" and "after" share. Read by changes/make.py.
#
# The seventh design is silent about an entry only when its own comparison finds nothing AND TypeScript's printed
# declaration is the same, and its checks are meant to fail closed in the places the rules govern. This round aims at:
#   break a user, untold, nothing stops it:
#     T01  a handle built as a class instance whose methods need `this` (rule 49 looks only at plain objects)
#     T02  a bound on a handle method that reaches an operation through a handler that is not "straight" (rule 43's
#          narrowing), on the product's own bookquote handler
#     T03  an unstated error thrown from a private helper the stated function calls (rule 46 reads only the
#          function's own throw statements)
#     T04  a class member's stated error kind changes (class members are entries, but their @throws are not listed)
#     T05  an empty line written with console.log() on a message channel (a zero-argument write is never recorded)
#     T06  a partial comments-only first step: an entry with no stated kinds is compared as "anything"
#     T07  two same-kind parameters of a callback the provider accepts change places (rule 48 looks at top-level
#          parameters only; the backstop prints every parameter as `_`)
#     T08  a bound test's limit kept in a helper function of another test file of the module
#     T09  messages pretty-printed over several lines (the one-line rule recognises JSON.stringify(x, null, 2) + '\n')
#   the method tells for nothing:
#     T10  a brand-new operation (the door's generic methods list every operation name in their constraint)
#     T11  messages added to the assertions of a bound test (each message is a "value" of the check)
#     T12  a list kind written Array<Amount> where it was Amount[]
#   the check refuses honest code:
#     T13  a data file read at a URL named once in a constant (rule 44 recognises only the inline form)
#     T14  process.stdout.write(line, 'utf8') (the tool's description of Node has no encoding argument)
#     T15  a message line written as a template, `${JSON.stringify(msg)}\n` (rules 19 and 45, by the letter)
#     T16  errors made by a helper that returns its stated kind, `throw outOfBounds(...)` (rule 46, by the letter)
#     T17  a test's console.log in a module whose worker writes messages to its own standard output (rule 35)
S = 'round8-independent'
TR, MO, RO, BO, ME = ('text-rules/src/index.mjs', 'money/src/index.mjs', 'rooms/src/index.mjs',
                      'bookings/src/index.mjs', 'meter/src/index.mjs')
TRT, MOT, BOT, MET = ('text-rules/test/index.test.mjs', 'money/test/index.test.mjs', 'bookings/test/index.test.mjs',
                      'meter/test/index.test.mjs')
MEW = 'meter/src/worker.mjs'
CA, CAT = 'calendar/src/index.mjs', 'calendar/test/index.test.mjs'
BI, BIT = 'billing/src/index.mjs', 'billing/test/index.test.mjs'
MOE = 'money/test/edges.mjs'
TRJ = 'text-rules/src/reserved.json'

# =================================================================================================================
# Break a user, untold, nothing stops it
# =================================================================================================================

# ---------------------------------------------------------------------------------------------------------------
# T01: rule 49 (iteration 7) refuses `this` in the methods of a handle built as a PLAIN OBJECT, "since a user may hand
# one on as a value". A handle built as an instance of a class has the same problem and is not looked at: the check
# walks only object literals, the listing writes the handle by its kind (Rooms, unchanged), and the printed
# declaration of createRooms is `(_: {store: Store}): Rooms` before and after. Turning a closure into a class with a
# private field is an ordinary refactor. Set-ups Z07 (front maps ids through rooms.find) and U07a (reports hands
# rooms.add to forEach) are earlier rounds' honest standing states.

change(S, 'T01-rooms-handle-built-as-class', "The rooms' handle is built as an instance of a class that keeps its store in a private field, so that the state of the rooms is in one place", 'rooms',
       ['a handle built as a class instance', 'its methods read this', 'rule 49 looks only at handles built as plain objects', 'users hand the methods on as values'],
       {RO: [("""/**
 * Makes the rooms' handle over a store.
 * @param {{store: Store}} deps
 * @returns {Rooms}
 */
export function createRooms(deps) {
  const { store } = deps;
  return {
    add(input) {
      if (!ROOM_KINDS.includes(input.kind)) throw new RangeError(`rooms: unknown kind: ${input.kind}`);
      if (!Number.isInteger(input.seats) || input.seats < 1 || input.seats > 500) {
        throw new RangeError('rooms: seats out of bounds');
      }
      const id = slugify(input.name);
      if (store.get('rooms', id)) throw new Error(`rooms: already taken: ${id}`);
      /** @type {Room} builds a Room */
      const room = { id, name: input.name, kind: input.kind, seats: input.seats };
      store.put('rooms', id, room);
      return room;
    },
    find(id) {
      const rec = store.get('rooms', id);
      return rec ? /** @type {Room} checks nothing: the store holds only Rooms in this table */ (rec.value) : undefined;
    },
    list(kind) {
      return store
        .list('rooms')
        .map((r) => /** @type {Room} */ (r.value))
        .filter((r) => kind === undefined || r.kind === kind)
        .sort((a, b) => a.name.localeCompare(b.name));
    },
  };
}""", """/**
 * The rooms' handle as one object that keeps its store, so that the state of the rooms is in one place (the class)
 * rather than in a closure.
 */
class RoomDirectory {
  /** @type {Store} */
  #store;

  /** @param {Store} store */
  constructor(store) {
    this.#store = store;
  }

  /**
   * @param {NewRoom} input
   * @returns {Room}
   */
  add(input) {
    if (!ROOM_KINDS.includes(input.kind)) throw new RangeError(`rooms: unknown kind: ${input.kind}`);
    if (!Number.isInteger(input.seats) || input.seats < 1 || input.seats > 500) {
      throw new RangeError('rooms: seats out of bounds');
    }
    const id = slugify(input.name);
    if (this.#store.get('rooms', id)) throw new Error(`rooms: already taken: ${id}`);
    /** @type {Room} builds a Room */
    const room = { id, name: input.name, kind: input.kind, seats: input.seats };
    this.#store.put('rooms', id, room);
    return room;
  }

  /**
   * @param {string} id
   * @returns {Room | undefined}
   */
  find(id) {
    const rec = this.#store.get('rooms', id);
    return rec ? /** @type {Room} checks nothing: the store holds only Rooms in this table */ (rec.value) : undefined;
  }

  /**
   * @param {RoomKind} [kind]
   * @returns {Room[]}
   */
  list(kind) {
    return this.#store
      .list('rooms')
      .map((r) => /** @type {Room} */ (r.value))
      .filter((r) => kind === undefined || r.kind === kind)
      .sort((a, b) => a.name.localeCompare(b.name));
  }
}

/**
 * Makes the rooms' handle over a store.
 * @param {{store: Store}} deps
 * @returns {Rooms}
 */
export function createRooms(deps) {
  return new RoomDirectory(deps.store);
}""")]},
       before=['setups/Z07-front-maps-rooms-find', 'setups/U07a-reports-adds-rooms-from-a-list'],
       note="rooms' own tests, bookings', billing's and front's other tests call the methods on the handle and pass. front's Z07 test maps ids through rooms.find and reports' U07a test hands rooms.add to forEach: `this` is undefined, reading this.#store throws a TypeError, and both tests fail. rooms' listing and printed declarations are unchanged, so nobody is told (reports, not followed, is told only when a listing changes).")

# ---------------------------------------------------------------------------------------------------------------
# T02: rule 43 (added while running iteration 6, narrowed the same day) lets a handler inherit the bounds of the entry
# it calls only when its whole body is that one call made with its own parameters. The product's own bookquote
# handler is `(req) => ({ total: bookings.quote(req.room, req.party, req.nights) })`: not "straight". A bound newly
# written on Bookings.quote therefore never reaches op:bookquote, through which billing asks for quotes. This is W04
# again, on the one handler of the product whose shape the narrowing excludes.

change(S, 'T02-quote-bound-not-reaching-operation', "A quote is given for a stay of up to three nights (a weekend); a longer stay is priced by the venue's staff. The bound is written on quote, with a test named for it", 'bookings',
       ['a bound newly written on a handle method', 'the operation handler wraps the method\'s answer, so it is not "straight"', 'rule 43 passes bounds on only through straight handlers'],
       {BO: [(" * @property {(room: string, party: number, nights: number) => Amount} quote what a booking would cost\n */",
              " * @property {(room: string, party: number, nights: number) => Amount} quote what a booking would cost; a quote is\n *   given for a stay of up to three nights (a weekend), and a longer stay is priced by the venue's staff\n * @bound quote.nights: whole number, 1 to 3\n */"),
             ("""  /**
   * @param {string} roomId
   * @param {number} party
   * @param {number} nights
   */
  const quote = (roomId, party, nights) => {
    const room = rooms.find(roomId);
    if (!room) throw new RangeError(`bookings: unknown room: ${roomId}`);
    checkSize(party, nights, room.seats);
    return amount(PRICE_PER_SEAT_NIGHT * party * nights, 'EUR');
  };""", """  /**
   * What a stay costs, for any number of nights a booking may have.
   * @param {string} roomId
   * @param {number} party
   * @param {number} nights
   */
  const price = (roomId, party, nights) => {
    const room = rooms.find(roomId);
    if (!room) throw new RangeError(`bookings: unknown room: ${roomId}`);
    checkSize(party, nights, room.seats);
    return amount(PRICE_PER_SEAT_NIGHT * party * nights, 'EUR');
  };
  /**
   * A quote: the price of a stay of up to three nights; a longer stay is priced by the venue's staff.
   * @param {string} roomId
   * @param {number} party
   * @param {number} nights
   */
  const quote = (roomId, party, nights) => {
    if (Number.isInteger(nights) && nights > 3) throw new RangeError('bookings: a quote is for at most 3 nights');
    return price(roomId, party, nights);
  };"""),
             ("      const total = quote(req.room, req.party, req.nights);", "      const total = price(req.room, req.party, req.nights);")],
        BOT: [("test('bound bookquote.total:", """test('bound quote.nights: whole number, 1 to 3', () => {
  const { bookings } = system();
  assert.equal(bookings.quote('hall', 10, 1).cents, bookings.open(req({ party: 10, nights: 1 })).total.cents);
  assert.equal(bookings.quote('hall', 10, 3).cents, bookings.open(req({ party: 10, nights: 3 })).total.cents);
  assert.throws(() => bookings.quote('hall', 10, 0), RangeError);
  assert.throws(() => bookings.quote('hall', 10, 4), RangeError);
  assert.throws(() => bookings.quote('hall', 10, 1.5), RangeError);
});

test('bound bookquote.total:""")]},
       note="bookings' own tests pass (they quote 1 to 3 nights; open still takes up to 14). billing's estimate test asks bookquote for 4 nights through the door: bookings.quote refuses it, and the test fails. Bookings.quote's bound changes, so its users are told: none outside bookings (billing reaches quotes only through op:bookquote, which is unchanged); reports, not followed, is told because bookings' listing changed.")

# ---------------------------------------------------------------------------------------------------------------
# T03: rule 46 (iteration 7): where errors are stated, every throw is of a kind the tool can read and is a stated
# kind. The check reads only the throw statements in the stated function's own body. An unknown room refused in a
# private helper that quote calls is never compared with quote's stated errors (set-up Z06a states them on the
# handle: RangeError). Moving a lookup into a helper is an ordinary refactor; this is U03's honest reason (an unknown
# room is not a value out of bounds) with the @throws line on the handle forgotten, as there.

change(S, 'T03-unknown-room-refused-in-helper', "The lookup of a booking's room moves into one helper, roomOf, which refuses an unknown room with an Error, not a RangeError: it is not a value out of bounds. The @throws line on the handle is forgotten", 'bookings',
       ['a stated function calls a private helper that throws an unstated kind', 'rule 46 reads only the function\'s own throw statements', 'the kind stated on the handle is unchanged'],
       {BO: [("/** @import { Rooms } from '../../rooms/src/index.mjs' */", "/** @import { Rooms, Room } from '../../rooms/src/index.mjs' */"),
             ("""  if (!Number.isInteger(nights) || nights < 1 || nights > 14) throw new RangeError('bookings: nights out of bounds');
}
""", """  if (!Number.isInteger(nights) || nights < 1 || nights > 14) throw new RangeError('bookings: nights out of bounds');
}

/**
 * The room a booking is for. An unknown room is not a value out of bounds, so it is refused with an Error, not a
 * RangeError, as rooms refuses a name already taken.
 * @param {Rooms} rooms
 * @param {string} roomId
 * @returns {Room}
 */
function roomOf(rooms, roomId) {
  const room = rooms.find(roomId);
  if (!room) throw new Error(`bookings: unknown room: ${roomId}`);
  return room;
}
"""),
             ("""    const room = rooms.find(roomId);
    if (!room) throw new RangeError(`bookings: unknown room: ${roomId}`);
    checkSize(party, nights, room.seats);""", """    const room = roomOf(rooms, roomId);
    checkSize(party, nights, room.seats);""")],
        BOT: [("  assert.throws(() => bookings.open(req({ room: 'attic' })), RangeError);",
               "  assert.throws(() => bookings.open(req({ room: 'attic' })), /unknown room/);")]},
       before=['setups/Z06a-bookings-states-quote-errors', 'setups/Z06b-billing-expects-range-error'],
       note="bookings' own tests pass (the unknown-room test now matches the message). billing's Z06b test expects bookings' RangeError for an estimate of an unknown room and gets an Error: it fails. Nothing exported changes, so bookings' listing is the same and nobody is told.")

# ---------------------------------------------------------------------------------------------------------------
# T04: rule 27 (iteration 5) makes each member of a class an entry of its own; rule 1 (iteration 2) makes the kinds of
# error named by @throws part of what an entry hands back. The listing keeps @throws for functions, handle members,
# operations and a class's constructor, but not for a class's other members, and the printed declaration has no
# @throws at all. Set-ups: Y13a (money's Tally) and Y13b (billing adds the meter's readings with a Tally), and T04a
# (billing passes a tally's refusal on, and its tests expect money's RangeError for a total too large).

change('setups', 'T04a-billing-passes-on-a-full-total', "billing refuses metered use worth more than an amount can hold, passing on the tally's refusal; its tests expect money's RangeError", 'billing',
       ["a user that depends on the error kind of a class member (the standing state)"],
       {BI: [(" * @property {(uses: MeterInput[]) => Promise<Amount>} meterUsage runs the meter and adds up its readings; refuses if the meter refuses any use\n",
              " * @property {(uses: MeterInput[]) => Promise<Amount>} meterUsage runs the meter and adds up its readings; refuses if the meter refuses any use, or, with money's RangeError, if the total would be more than an amount can hold\n"),
             ("            if (msg.kind === 'reading') tally.add(msg.cost);\n",
              """            if (msg.kind === 'reading') {
              // a total larger than an amount can hold is refused with the tally's own error
              try {
                tally.add(msg.cost);
              } catch (err) {
                reject(err);
              }
            }
""")],
        BIT: [("import { createBilling } from '../src/index.mjs';\n",
               "import { createBilling } from '../src/index.mjs';\n/** @import { MeterInput } from '../../meter/src/index.mjs' */\n"),
              ("""  await assert.rejects(() => billing.meterUsage([{ kind: 'use', room: 'hall', minutes: 2000 }]), RangeError);
});
""", """  await assert.rejects(() => billing.meterUsage([{ kind: 'use', room: 'hall', minutes: 2000 }]), RangeError);
});

test('metered use worth more than an amount can hold is refused with a RangeError', async () => {
  const { billing } = system();
  /** @type {MeterInput[]} */
  const uses = [];
  for (let i = 0; i < 400; i++) uses.push({ kind: 'use', room: 'hall', minutes: 1440 });
  await assert.rejects(() => billing.meterUsage(uses), RangeError);
});
""")]},
       before=['setups/Y13a-money-tally', 'setups/Y13b-billing-uses-tally'])

change(S, 'T04-tally-full-error', "A full tally is refused with an Error in its own words, not a RangeError: the amount added is not out of bounds, the tally is full. add's @throws lines say so", 'money',
       ['a class member\'s stated error kind changes', 'class members are entries, but their @throws are not in the listing', 'the printed declaration has no @throws'],
       {MO: [("""  /**
   * Adds an amount of the tally's currency.
   * @param {Amount} a
   * @throws {RangeError} when the currency differs or the total would leave the bound of cents
   */
  add(a) {
    this.total = add(this.total, a);
  }""", """  /**
   * Adds an amount of the tally's currency.
   * @param {Amount} a
   * @throws {RangeError} when the currency differs
   * @throws {Error} when the tally is full: the total would leave the bound of cents. The amount added is not out of
   *   bounds, so this is not a RangeError.
   */
  add(a) {
    if (a.currency !== this.total.currency) throw new RangeError('Tally: the currency differs');
    if (this.total.cents + a.cents > MAX_CENTS) throw new Error('Tally: full');
    this.total = add(this.total, a);
  }""")],
        MOT: [("""  assert.throws(() => t.add(amount(1, 'USD')), RangeError);
});
""", """  assert.throws(() => t.add(amount(1, 'USD')), RangeError);
});

test('a full Tally refuses more', () => {
  const t = new Tally('EUR');
  t.add(amount(10_000_000, 'EUR'));
  assert.throws(() => t.add(amount(1, 'EUR')), /full/);
  assert.equal(t.total.cents, 10_000_000);
});
""")]},
       before=['setups/Y13a-money-tally', 'setups/Y13b-billing-uses-tally', 'setups/T04a-billing-passes-on-a-full-total'],
       note="money's own tests pass. billing's T04a test (400 uses of 1440 minutes, 11,520,000 cents) expects a RangeError and gets the tally's Error: it fails. Tally#add is (Amount) => void before and after, in the tool's form and in the printed declaration; its @throws are not listed, so nobody is told.")

# ---------------------------------------------------------------------------------------------------------------
# T05: rules 35 and 45: on a stream the module's own message kinds are published for, every write in its source is a
# message line the tool can read. The check records a write only when it is handed data (`if (data.length)`), and a
# console write with no message in it is skipped. console.log() with no argument writes an empty line to standard
# output and is never looked at. W02's honest reason (a ready line; readers skip empty lines), written the plainest way.

change(S, 'T05-meter-ready-line-console-log', "The meter writes an empty line as soon as it runs, so that whoever started it can tell it is ready; readers skip empty lines. It is written with console.log()", 'meter',
       ['a write to a message channel with no argument', 'the check records only writes that are handed data', 'console.log() writes an empty line to standard output'],
       {MEW: [("const lines = createInterface({ input: process.stdin });",
               "// An empty line first, as soon as the meter runs, so that whoever started it can tell it is ready; readers skip\n// empty lines.\nconsole.log();\n\nconst lines = createInterface({ input: process.stdin });")]},
       note="meter's own tests trim the output and skip empty lines, and pass. billing reads every line as a MeterMsg: JSON.parse('') throws in its data handler, and billing's meter tests fail. MeterInput and MeterMsg are unchanged, so nobody is told.")

# ---------------------------------------------------------------------------------------------------------------
# T06: rule 6: a module with no interface comments gets them as a comments-only first step, verified mechanically.
# Nothing asks that the step describe every entry: the verification checks only that running code is unchanged, and
# after it the module "has interface comments", so the ordinary comparison applies. An entry left without stated kinds
# is listed as accepting "anything", in the tool's form and in the printed declaration (`day: any`), so a change to
# what it accepts is invisible. Set-up T06a: calendar's first step, done for the two functions the job was about.
# The change is Z15's (weekday takes the day as written), which iteration 4's rule 21 answered only for a module with
# no comments at all.

change('setups', 'T06a-calendar-first-step-partial', "calendar's first job, step one, comments only: parseDay and formatDay, the two functions the job is about, get their interface comments", 'calendar',
       ['a comments-only first step that describes part of the module (the standing state)'],
       {CA: [("export function parseDay(text) {", """/**
 * Reads a day written YYYY-MM-DD as midnight, UTC, of that day.
 * @param {string} text
 * @returns {Date}
 * @throws {RangeError} when text is not a real day written YYYY-MM-DD
 */
export function parseDay(text) {"""),
             ("export function formatDay(day) {", """/**
 * Writes a day as YYYY-MM-DD.
 * @param {Date} day
 * @returns {string}
 */
export function formatDay(day) {""")]})

change(S, 'T06-weekday-takes-text-after-partial-first-step', "weekday takes the day as written, YYYY-MM-DD, since every caller had to parse it first; weekday was not among the functions the first step described", 'calendar',
       ['an entry with no stated kinds', 'what it accepts changes from a day to text', 'the tool\'s form and the printed declaration both say "anything"'],
       {CA: [("""export function weekday(day) {
  return NAMES[day.getUTCDay()];
}""", """// takes the day as written, YYYY-MM-DD, since every caller had to parse it first
export function weekday(day) {
  return NAMES[parseDay(day).getUTCDay()];
}""")],
        CAT: [("""  assert.equal(weekday(parseDay('2026-11-15')), 'Sun');
  assert.equal(weekday(parseDay('2026-11-16')), 'Mon');""", """  assert.equal(weekday('2026-11-15'), 'Sun');
  assert.equal(weekday('2026-11-16'), 'Mon');""")]},
       before=['setups/T06a-calendar-first-step-partial'],
       note="calendar's own tests pass. reports calls weekday(parseDay(b.day)): parseDay is now handed a Date, finds no YYYY-MM-DD in its text and throws a RangeError; reports' first test fails. weekday is (any) => string before and after, in the tool's form and in the printed declaration, so nobody is told.")

# ---------------------------------------------------------------------------------------------------------------
# T07: rule 48 (iteration 7): if a name of an old parameter appears in the new entry at another place, the entry has
# changed. The tool compares the names of an entry's own parameters only; the parameters of a callback the entry
# accepts are written in the same comment and are not compared, and the backstop prints every parameter as `_`.
# Set-ups: bookings lets a venue hand in its own price function (T07a), and billing's tests check an estimate made
# with one (T07b). The change is U08's honest reason (the order the venue's price sheet asks them in), one level down.

change('setups', 'T07a-bookings-takes-a-price-function', "A venue that sets its own prices hands bookings a price function: what a stay costs, in euro cents, for a party and a number of nights", 'bookings',
       ['a provider that accepts a callback with two parameters of the same kind (the standing state)'],
       {BO: [("""/**
 * Makes the bookings' handle.
 * @param {{store: Store, rooms: Rooms}} deps
 * @returns {Bookings}
 */
export function createBookings(deps) {
  const { store, rooms } = deps;
  let next = 1;""", """/**
 * Makes the bookings' handle. A venue that sets its own prices hands in price: what a stay costs, in euro cents, for
 * a party and a number of nights; without it a seat costs PRICE_PER_SEAT_NIGHT a night.
 * @param {{store: Store, rooms: Rooms, price?: (party: number, nights: number) => number}} deps
 * @returns {Bookings}
 */
export function createBookings(deps) {
  const { store, rooms } = deps;
  /** @type {(party: number, nights: number) => number} */
  const priceOf = deps.price ?? ((party, nights) => PRICE_PER_SEAT_NIGHT * party * nights);
  let next = 1;"""),
             ("    return amount(PRICE_PER_SEAT_NIGHT * party * nights, 'EUR');", "    return amount(priceOf(party, nights), 'EUR');")],
        BOT: [("test('bound party:", """test('a venue that sets its own prices is quoted in them', () => {
  const store = createStore();
  const rooms = createRooms({ store });
  rooms.add({ name: 'Hall', kind: 'hall', seats: 300 });
  const bookings = createBookings({ store, rooms, price: (party, nights) => 1000 * party + 100 * nights });
  assert.equal(bookings.quote('hall', 10, 2).cents, 10_200);
});

test('bound party:""")]})

change('setups', 'T07b-billing-estimates-in-venue-prices', "billing's tests check that a venue that sets its own prices gets estimates in them", 'billing',
       ['a user that hands the provider a callback, naming its parameters by position (the standing state)'],
       {BIT: [("test('metered use is priced by the meter and added up', async () => {", """test('a venue that sets its own prices gets estimates in them', async () => {
  const store = createStore();
  const rooms = createRooms({ store });
  rooms.add({ name: 'Hall', kind: 'hall', seats: 300 });
  const bookings = createBookings({ store, rooms, price: (party, nights) => 2000 * party + 500 * nights });
  const door = createDoor({ ...bookingHandlers(bookings), ...roomHandlers(rooms) });
  const est = await createBilling({ door }).estimate('hall', 6, 4);
  assert.equal(est.total.cents, 2000 * 6 + 500 * 4);
});

test('metered use is priced by the meter and added up', async () => {""")]},
       before=['setups/T07a-bookings-takes-a-price-function'])

change(S, 'T07-price-function-parameters-swap', "A venue's own price function is asked for the nights first, then the party, the order the venue's price sheet lists them; the comment, the call and bookings' own test say so", 'bookings',
       ['two same-kind parameters of an accepted callback change places', 'rule 48 compares only the entry\'s own parameters', 'the backstop prints every parameter as _'],
       {BO: [("""/**
 * Makes the bookings' handle. A venue that sets its own prices hands in price: what a stay costs, in euro cents, for
 * a party and a number of nights; without it a seat costs PRICE_PER_SEAT_NIGHT a night.
 * @param {{store: Store, rooms: Rooms, price?: (party: number, nights: number) => number}} deps""", """/**
 * Makes the bookings' handle. A venue that sets its own prices hands in price: what a stay costs, in euro cents, for
 * a number of nights and a party, asked in that order, the order the venue's price sheet lists them; without it a
 * seat costs PRICE_PER_SEAT_NIGHT a night.
 * @param {{store: Store, rooms: Rooms, price?: (nights: number, party: number) => number}} deps"""),
             ("""  /** @type {(party: number, nights: number) => number} */
  const priceOf = deps.price ?? ((party, nights) => PRICE_PER_SEAT_NIGHT * party * nights);""", """  /** @type {(nights: number, party: number) => number} */
  const priceOf = deps.price ?? ((nights, party) => PRICE_PER_SEAT_NIGHT * party * nights);"""),
             ("    return amount(priceOf(party, nights), 'EUR');", "    return amount(priceOf(nights, party), 'EUR');")],
        BOT: [("price: (party, nights) => 1000 * party + 100 * nights", "price: (nights, party) => 1000 * party + 100 * nights")]},
       before=['setups/T07a-bookings-takes-a-price-function', 'setups/T07b-billing-estimates-in-venue-prices'],
       note="bookings' own tests pass. billing's T07b test hands in (party, nights) => 2000 * party + 500 * nights and expects 14,000 cents for 6 people and 4 nights; it now gets 11,000 and fails. createBookings accepts { price?: (number, number) => number; rooms; store } before and after; its own parameter is still deps; the printed declaration writes the callback's parameters as _. Nobody is told.")

# ---------------------------------------------------------------------------------------------------------------
# T08: rules 15, 26, 42 and 51 widened, one round at a time, what a bound test's fingerprint follows: the test file's
# constants and helpers, constants imported from the module's source, `import * as`, JSON files. A helper FUNCTION in
# another test file of the module (a shared fixture file, test/edges.mjs) is not followed: the fingerprint keeps
# `edgesOf(s:cents)` and never the number it hands back. Set-up T08a: money's bound tests read their edges from that
# file. The change is the forgotten-bound-line story of Y07, Z02, W17 and U06 (the payment provider's limit).

change('setups', 'T08a-money-tests-read-edges-from-a-helper', "money's bound tests read the edges of each bound from one helper, test/edges.mjs, so that an edge is written once", 'money',
       ["a bound test's values handed back by a helper function of another test file (the standing state)"],
       {MOE: """/**
 * The edges of money's bounds, kept in one place for its tests: the lowest and the highest value each bound allows.
 * @param {'cents' | 'parts'} bound
 * @returns {{lowest: number, highest: number}}
 */
export function edgesOf(bound) {
  if (bound === 'cents') return { lowest: 0, highest: 10_000_000 };
  return { lowest: 1, highest: 100 };
}
""",
        MOT: [("import { amount, add, formatAmount, splitEvenly, CURRENCIES } from '../src/index.mjs';\n",
               "import { amount, add, formatAmount, splitEvenly, CURRENCIES } from '../src/index.mjs';\nimport { edgesOf } from './edges.mjs';\n"),
              ("""  assert.equal(amount(0, 'EUR').cents, 0);
  assert.equal(amount(10_000_000, 'EUR').cents, 10_000_000);
  assert.throws(() => amount(-1, 'EUR'), RangeError);
  assert.throws(() => amount(10_000_001, 'EUR'), RangeError);
  assert.throws(() => amount(1.5, 'EUR'), RangeError);""", """  const { lowest, highest } = edgesOf('cents');
  assert.equal(amount(lowest, 'EUR').cents, lowest);
  assert.equal(amount(highest, 'EUR').cents, highest);
  assert.throws(() => amount(lowest - 1, 'EUR'), RangeError);
  assert.throws(() => amount(highest + 1, 'EUR'), RangeError);
  assert.throws(() => amount(1.5, 'EUR'), RangeError);"""),
              ("""  assert.equal(splitEvenly(amount(100, 'EUR'), 1).length, 1);
  assert.equal(splitEvenly(amount(100, 'EUR'), 100).length, 100);
  assert.throws(() => splitEvenly(amount(100, 'EUR'), 0), RangeError);
  assert.throws(() => splitEvenly(amount(100, 'EUR'), 101), RangeError);""", """  const { lowest, highest } = edgesOf('parts');
  assert.equal(splitEvenly(amount(100, 'EUR'), lowest).length, lowest);
  assert.equal(splitEvenly(amount(100, 'EUR'), highest).length, highest);
  assert.throws(() => splitEvenly(amount(100, 'EUR'), lowest - 1), RangeError);
  assert.throws(() => splitEvenly(amount(100, 'EUR'), highest + 1), RangeError);""")]})

change(S, 'T08-limit-lowered-in-test-helper', "An amount may now be at most 500,000 cents, the most the venue's payment provider takes in one payment; the code and the edge in money's test helper change, the bound line is forgotten", 'money',
       ['a limit lowered in code and in a test helper file', 'the bound line forgotten', 'the bound test\'s own text unchanged'],
       {MO: [("const MAX_CENTS = 10_000_000;", "// the most the venue's payment provider takes in one payment\nconst MAX_CENTS = 500_000;")],
        MOE: [("  if (bound === 'cents') return { lowest: 0, highest: 10_000_000 };", "  if (bound === 'cents') return { lowest: 0, highest: 500_000 };")]},
       before=['setups/T08a-money-tests-read-edges-from-a-helper'],
       note="money's own tests pass (add's overflow test still throws: amount(10,000,000) itself is now refused). bookings' bound party test opens 200 people for 2 nights, 600,000 cents: amount refuses it and the test fails. The bound line and the bound test's text are unchanged and the fingerprint keeps edgesOf('cents'), not the edge; nobody is told.")

# ---------------------------------------------------------------------------------------------------------------
# T09: rule 19 (iteration 4): one message per line, JSON.stringify(x) + '\n'. The check recognises the form by the
# name stringify and the '\n' after it, whatever stringify's other arguments: JSON.stringify(msg, null, 2) + '\n'
# passes, though it writes each message over several lines. The meter's own test is changed to read the new form.
# (Contrived: the job has to rewrite its own reader, knowing it no longer writes one message per line.)

change(S, 'T09-messages-pretty-printed', "The meter writes each message indented, so that the venue's operators can read its output; its tests read a message as starting at a line that begins with {", 'meter',
       ["JSON.stringify's indent argument", 'each message written over several lines', 'the one-line rule recognises the spelling, not the line'],
       {MEW: [("/** @param {MeterMsg} msg */\nconst send = (msg) => process.stdout.write(JSON.stringify(msg) + '\\n');",
               "/** @param {MeterMsg} msg written indented, so that the venue's operators can read the meter's output */\nconst send = (msg) => process.stdout.write(JSON.stringify(msg, null, 2) + '\\n');")],
        MET: [("    child.on('close', () => resolve(out.trim().split('\\n').filter(Boolean).map((l) => /** @type {MeterMsg} */ (JSON.parse(l)))));",
               "    // each message starts at a line that begins with {\n    child.on('close', () => resolve(out.trim().split(/\\n(?=\\{)/).filter(Boolean).map((l) => /** @type {MeterMsg} */ (JSON.parse(l)))));")]},
       note="meter's own tests pass with their new reader. billing splits the meter's output at every line end and parses '{' as a message: JSON.parse throws and billing's meter tests fail. MeterMsg is unchanged; nobody is told.")

# =================================================================================================================
# The method tells for nothing
# =================================================================================================================

# ---------------------------------------------------------------------------------------------------------------
# T10: rule 3: a brand-new entry has no users; rule 7: a new operation tells only when another provider already
# answers its name. The door's call and get are generic, `<K extends keyof AllOps>`, and the tool writes K's
# constraint out as the union of every operation name; a type parameter that differs makes the whole parameter list
# "cannot stand in" (iteration 4). So a new operation of bookings changes Door.call and Door.get "through" bookings,
# and every user of the door is told, though the door accepts only more names.

change(S, 'T10-new-operation', "bookings answers a new operation, booklist: the bookings of one room, open and cancelled, in the order they were opened", 'bookings',
       ['a new operation, whose name no one else answers', 'a new member of the bookings\' handle', 'the door\'s generic methods write every operation name'],
       {BO: [(" *   bookquote: {req: {room: string, party: number, nights: number}, res: {total: Amount}}\n * }} BookingOps",
              " *   bookquote: {req: {room: string, party: number, nights: number}, res: {total: Amount}},\n *   booklist: {req: {room: string}, res: {bookings: Booking[]}}\n * }} BookingOps"),
             (" * @property {(room: string, party: number, nights: number) => Amount} quote what a booking would cost\n */",
              " * @property {(room: string, party: number, nights: number) => Amount} quote what a booking would cost\n * @property {(room: string) => Booking[]} forRoom the bookings of one room, open and cancelled, in the order they were opened\n */"),
             ("""    quote,
    find,
""", """    quote,
    find,
    forRoom(room) {
      return store
        .list('bookings')
        .map((r) => /** @type {Booking} */ (r.value))
        .filter((b) => b.room === room);
    },
"""),
             ("    bookquote: (req) => ({ total: bookings.quote(req.room, req.party, req.nights) }),\n",
              "    bookquote: (req) => ({ total: bookings.quote(req.room, req.party, req.nights) }),\n    booklist: (req) => ({ bookings: bookings.forRoom(req.room) }),\n")],
        BOT: [("test('operations answer as the table says', () => {", """test('booklist answers with the bookings of a room, in the order they were opened', () => {
  const { bookings } = system();
  const a = bookings.open(req());
  bookings.open(req({ room: 'studio', party: 2 }));
  const c = bookings.open(req({ day: '2026-12-10' }));
  bookings.cancel(c.id);
  const h = bookingHandlers(bookings);
  assert.deepEqual(h.booklist({ room: 'hall' }).bookings.map((b) => b.id), [a.id, c.id]);
  assert.deepEqual(h.booklist({ room: 'kitchen' }).bookings, []);
});

test('operations answer as the table says', () => {""")]},
       note="Everything else is unchanged; every test passes. bookings' listing gains entries only (op:booklist, BookingHandlers.booklist, Bookings.forRoom, and a name in three lists of names). The door's listing changes through bookings: Door.call and Door.get accept K extends a union that gained 'booklist'.")

# ---------------------------------------------------------------------------------------------------------------
# T11: rules 15 and 26: a bound test is compared by the (check, value) pairs it makes; "rewriting it with the same
# values and checks is not a change". Node's assertions take a message as their last argument; the fingerprint
# collects every literal in a check's arguments, so a message is a new "value" and the bound counts as changed.

change(S, 'T11-bound-test-assertion-messages', "money's bound test of cents says in each assertion what it shows, so that a failure reads as a sentence", 'money',
       ['messages added to the assertions of a bound test', 'the same checks of the same values'],
       {MOT: [("""  assert.equal(amount(0, 'EUR').cents, 0);
  assert.equal(amount(10_000_000, 'EUR').cents, 10_000_000);
  assert.throws(() => amount(-1, 'EUR'), RangeError);
  assert.throws(() => amount(10_000_001, 'EUR'), RangeError);
  assert.throws(() => amount(1.5, 'EUR'), RangeError);""", """  assert.equal(amount(0, 'EUR').cents, 0, 'no money at all is an amount');
  assert.equal(amount(10_000_000, 'EUR').cents, 10_000_000, 'the largest amount is allowed');
  assert.throws(() => amount(-1, 'EUR'), RangeError, 'a negative amount is refused');
  assert.throws(() => amount(10_000_001, 'EUR'), RangeError, 'one cent over the largest amount is refused');
  assert.throws(() => amount(1.5, 'EUR'), RangeError, 'part of a cent is refused');""")]},
       note="Only the messages of five assertions are added; every value and every check is the same, and every test passes.")

# ---------------------------------------------------------------------------------------------------------------
# T12: rule 18's backstop prints a declaration as TypeScript writes it from the comment. TypeScript keeps a JSDoc
# type as written where it can: `Array<Amount>` and `Amount[]` are one kind, written two ways. The tool's own form
# sees the same list; the backstop sees two texts and calls the entry "declaration changed (not classified)".
# The job is a content change (where leftover cents go) whose comment is rewritten at the same time.

change(S, 'T12-list-kind-written-as-Array', "splitEvenly gives leftover cents to the last parts, as the venue's accountant asks; its comment is rewritten and writes the list as Array<Amount>", 'money',
       ['a different valid answer', 'a list kind written Array<T> where it was T[]'],
       {MO: [(""" * Splits an amount into equal parts that add up to it exactly; leftover cents go to the first parts.
 * @param {Amount} a
 * @param {number} parts
 * @returns {Amount[]}""", """ * Splits an amount into equal parts that add up to it exactly; leftover cents go to the last parts, as the venue's
 * accountant asks.
 * @param {Amount} a
 * @param {number} parts
 * @returns {Array<Amount>}"""),
             ("  for (let i = 0; i < parts; i++) out.push(amount(base + (i < extra ? 1 : 0), a.currency));",
              "  for (let i = 0; i < parts; i++) out.push(amount(base + (i >= parts - extra ? 1 : 0), a.currency));")]},
       note="money's tests check that the parts add up and differ by at most a cent, and pass; billing's checks the same. splitEvenly accepts and hands back the same kinds; no bound or error changes.")

# =================================================================================================================
# The check refuses honest code
# =================================================================================================================

# ---------------------------------------------------------------------------------------------------------------
# T13: rule 44: "a file is read with readFileSync only at a path the tool can work out, and only from the module's
# own folder". The check recognises one spelling, `readFileSync(new URL('<literal>', import.meta.url))`, written in
# place. A URL named once in a constant, as the meter names its program (WORKER_FILE), is a path the tool could work
# out just as well (rule 47 reads a table's name through a constant), and is refused. The reason is W10's.

change(S, 'T13-data-file-url-in-a-constant', "text-rules gains isReservedName: whether a name is one the venue keeps for itself, read from reserved.json, which the venue's staff keep; the file is named once, in a constant, as the meter names its program", 'text-rules',
       ['readFileSync at a URL held in a constant', 'the URL is new URL(literal, import.meta.url)', 'rule 44 recognises only the inline form'],
       {TR: [("""/**
 * Small rules for text that several modules share.
 */

const SLUG_MAX = 80;
""", """/**
 * Small rules for text that several modules share.
 */
import { readFileSync } from 'node:fs';

const SLUG_MAX = 80;

/** The file of names the venue keeps for itself, kept by its staff, next to this one. */
const RESERVED_FILE = new URL('./reserved.json', import.meta.url);

/** The names the venue keeps for itself, lower-case. */
const RESERVED = new Set(/** @type {string[]} */ (JSON.parse(readFileSync(RESERVED_FILE, 'utf8'))));
"""),
             ("""export function titleCase(text) {
  return text.replace(/\\b([a-z])/g, (m) => m.toUpperCase());
}
""", """export function titleCase(text) {
  return text.replace(/\\b([a-z])/g, (m) => m.toUpperCase());
}

/**
 * Says whether a name is one the venue keeps for itself (its office, its store rooms), whatever its case and the
 * spaces around it.
 * @param {string} text
 * @returns {boolean}
 */
export function isReservedName(text) {
  return RESERVED.has(text.trim().toLowerCase());
}
""")],
        TRJ: '["office", "store room", "boiler room"]\n',
        TRT: [("import { slugify, isEmail, titleCase } from '../src/index.mjs';", "import { slugify, isEmail, titleCase, isReservedName } from '../src/index.mjs';"),
              ("test('titleCase upper-cases the first letter of each word', () => {", """test('isReservedName knows the names the venue keeps for itself', () => {
  assert.equal(isReservedName('Office'), true);
  assert.equal(isReservedName('  store room '), true);
  assert.equal(isReservedName('Main Hall'), false);
});

test('titleCase upper-cases the first letter of each word', () => {""")]},
       note="Every test passes. isReservedName is a new entry: nobody is told. text-rules' check should find nothing to refuse.")

# ---------------------------------------------------------------------------------------------------------------
# T14: rule 5: the check refuses only real disagreements, never where it merely cannot tell. Iteration 7 (tool change
# 34) made a property missing from the tool's description of Node "cannot tell"; a call that Node accepts but the
# description does not is still refused. process.stdout.write(chunk, encoding) is Node's own signature; the
# description has write(chunk, callback?).

change(S, 'T14-write-with-encoding', "The meter writes its lines as UTF-8 whatever the platform's default, so that a room name with accents arrives as written", 'meter',
       ["Node's write(chunk, encoding)", "the tool's description of Node has write(chunk, callback?) only"],
       {MEW: [("/** @param {MeterMsg} msg */\nconst send = (msg) => process.stdout.write(JSON.stringify(msg) + '\\n');",
               "/** @param {MeterMsg} msg written as UTF-8 whatever the platform's default, so that a room name with accents arrives as written */\nconst send = (msg) => process.stdout.write(JSON.stringify(msg) + '\\n', 'utf8');")]},
       note="The meter writes the same bytes; every test passes; no listing changes.")

# ---------------------------------------------------------------------------------------------------------------
# T15: rules 19 and 45 name one way of writing a message line, JSON.stringify(message) + '\n', and refuse "a line
# built any other way". A template literal writes the same bytes; it is what ESLint's prefer-template rule turns the
# product's own line into when the venue's linter is run with --fix.

change(S, 'T15-message-line-as-template', "The meter's code is tidied by the venue's linter (prefer-template): its message line is written as a template literal", 'meter',
       ['a message line written `${JSON.stringify(msg)}\\n`', 'the same bytes written', 'the one-line rule recognises only JSON.stringify(x) + newline'],
       {MEW: [("const send = (msg) => process.stdout.write(JSON.stringify(msg) + '\\n');",
               "const send = (msg) => process.stdout.write(`${JSON.stringify(msg)}\\n`);")]},
       note="The meter writes the same bytes; every test passes; no listing changes.")

# ---------------------------------------------------------------------------------------------------------------
# T16: rule 46: where errors are stated, every throw is new X(...), Object.assign(new X(...), ...), a variable set to
# one of these, or a caught error thrown again; "anything else is refused". An error made by a small helper whose
# comment states what it hands back (@returns {RangeError}) is the commonest way to keep error messages uniform, and
# its kind is as readable as a variable's.

change(S, 'T16-errors-made-by-helper', "money's errors for a value outside its bound are made by one helper, outOfBounds, so that every such message names the value the same way", 'money',
       ['throw helper(...) where the helper\'s comment states it returns RangeError', 'the stated kinds are unchanged'],
       {MO: [("const MAX_CENTS = 10_000_000;\n", """const MAX_CENTS = 10_000_000;

/**
 * The error for a value outside its bound, so that every such message names the value the same way.
 * @param {string} what
 * @param {unknown} value
 * @returns {RangeError}
 */
function outOfBounds(what, value) {
  return new RangeError(`${what} out of bounds: ${value}`);
}
"""),
             ("    throw new RangeError(`amount: cents out of bounds: ${cents}`);", "    throw outOfBounds('amount: cents', cents);"),
             ("if (!Number.isInteger(parts) || parts < 1 || parts > 100) throw new RangeError('splitEvenly: parts out of bounds');",
              "if (!Number.isInteger(parts) || parts < 1 || parts > 100) throw outOfBounds('splitEvenly: parts', parts);")]},
       note="Every error raised is a RangeError, as before; every test passes; no listing changes.")

# ---------------------------------------------------------------------------------------------------------------
# T17: rule 35 (iteration 6): in a module that writes messages to a stream, every other write to that stream must be
# a message line. The check gathers the streams by name over all the module's files, tests included: the worker's
# standard output carries messages, so a console.log in the meter's TEST (whose standard output is the test runner's,
# another process altogether) is refused as "something other than a message to stdout".

change(S, 'T17-test-shows-meter-output', "meter's tests show what the meter wrote alongside their own output, so that a failing test can be read without running the meter by hand", 'meter',
       ["a test's console.log", "the worker's standard output carries messages; the test's is another process's", 'rule 35 matches streams by name across the module'],
       {MET: [("    child.on('close', () => resolve(out.trim().split('\\n').filter(Boolean).map((l) => /** @type {MeterMsg} */ (JSON.parse(l)))));",
               """    child.on('close', () => {
      // what the meter wrote, shown with the test's output, so that a failure can be read without running it by hand
      console.log(`meter wrote:\\n${out}`);
      resolve(out.trim().split('\\n').filter(Boolean).map((l) => /** @type {MeterMsg} */ (JSON.parse(l))));
    });""")]},
       note="Only the meter's test changes; every test passes; no listing changes.")
