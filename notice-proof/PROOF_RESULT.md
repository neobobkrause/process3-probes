# Does the notice method work? Result of the proof session

15 Nov 2026. For Bob. Written by Claude (the proof session). Nothing here is in force.

Four words are kept apart throughout. **Measured**: counted by a script in this folder. **Estimated**: worked out from a sample. **Judged**: somebody's reading; it says whose. **Unproven**: never run.

## The answer first

ANSWER_PARAGRAPH

## Words used here

- A **module** is one part of the product with its own code, its own tests and a declared list of the modules it uses. A **provider** is a module that changed; a **user** is a module that uses it.
- **Structured comments** are comments written in a fixed form (JSDoc) that TypeScript's reader understands. They state the **kinds** of values: what a function is handed and hands back, field by field. A **bound** is a limit a kind cannot express (for example "whole number, 1 to 200"); it is written on its own line starting `@bound`.
- **TypeScript's reader** is a free program that reads plain JavaScript together with those comments. The tool uses it; nothing in the product runs differently because of it.
- The **listing** is a module's interface as the tool writes it out: each **entry** (a function, a list, a kind, a method of an object handed out, an operation called by name) with what it accepts, what it hands back and its bound lines.
- A **notice** tells a user that a provider's interface changed in a way that may concern it. A notice is **for nothing** when the user, on reading, needed no change.
- The **check** runs inside one module's own tests. A **refusal** is the check stopping the module because a comment disagrees with the module's code, or the code disagrees with a provider's stated interface. A **false refusal** is one where the code was right.
- A **hole** is a user that needed a change and was not told, with nothing else stopping the change.

## What was built

All of it is in `notice-proof/` on the branch `notice-proof` of this repository.

1. **The tool** (`tool/`, about 900 lines): three commands. `listing` writes a module's interface. `notice` takes the product before and after a change and the module that changed, and says whether the interface changed, which entries changed and how (accepts more, cannot stand in, hands back differently, bound changed, new entry, removed, kind renamed), who is told, and why (which entry, at which lines of the user, or "not followed fully"). `check` makes the two refusals for one module and verifies that a change touched comments only. Its own tests: 15, all passing (measured).
2. **The made-up product** (`product/`): eleven modules with real behaviour and 51 tests of their own written to Bob's rule on tests: text rules, money, a calendar (which starts with no interface comments), a store that hands out an object whose methods users call, rooms, bookings, a shared door that carries calls by name, a meter that runs as a separate program and sends messages, billing, a front desk and reports (which is handed the store as "anything", so the tool cannot follow it). Between them they hold every route the study found; the table at the end of this section says where.
3. **The changes** (`changes/`): 29 planned changes and ADV_COUNT adversarial ones. Each is a folder with the files the change writes, a description, and the difference in readable form (`change.diff`).
4. **The proof runner** (`proof/`): for each change it builds the product before and after, runs the tool, runs the check on the provider and every later module, and, separately and without the tool, runs every module's own tests before and after.

| Route the study found | Where it is in the made-up product |
| --- | --- |
| A function imported by name | text rules' `slugify`, `isEmail`, `titleCase`; money's functions |
| An object handed out by a factory, reaching users inside a bag of dependencies | the store's and rooms' objects, handed to bookings as `{store, rooms}` |
| Operations called by name through a shared door | the door; bookings' and rooms' operation tables; front calls `bookopen` |
| A name inside a request line built as a template string | billing calls `` `op=bookstatus&id=${bookingId}` `` |
| A message between two separately running parts | the meter's program and billing, sharing the kind `MeterMsg` |
| An exported list that users read | rooms' `ROOM_KINDS`, read by front and reports |
| A test helper a provider publishes and a user's tests import | the store's `seededStore`, used by front's tests |
| A module that starts with no interface comments | the calendar |
| A user that receives a provider as "anything" | reports, handed the store as `*` |
| A bound enforced only by code that runs | bookings' party of 1 to 200 |
| A value that reaches a user only through a third module | front reads the cents of a total that bookings hands back; front does not use money |

## How the proof was run, in order

The git history shows the order. The expected answers were committed before any result existed, in commits of their own:

1. The tool, its tests and the product (commit `cd9542c`).
2. The 29 planned changes (`35423ce`), then the expected answers for them, written from the rules (`df509be`).
3. The first run (`results/planned-run1/`, commit `5bd6eeb`). 28 of 29 notices were as expected. In planned change 9 the tool told one user where the rules say four: TypeScript's reader, with the setting the tool had, reads the comment kind `object` as "anything", so a narrowing looked like accepting more.
4. The fix to the tool's reader setting (`0e35811`), and the second run (`results/planned/`, commit `81303ed`), which is the one reported below. My reading of which users truly needed a change was written after the test results were seen and is kept in its own file (`changes/planned-reading.json`).
5. My adversarial changes (`227a15c`), their expected answers (`346baf2`), their results (`6d6a0f8`).
6. INDEPENDENT_ORDER

## Every planned change

"Expected" is what the rules say, written before running. "Told" is what the tool said. "Tests that failed" is measured: the user's own tests passed before the change and failed after. "Needed a change" is my reading (judged, Claude) of whose code, comments or tests had to change.

| No. | Change | Expected by the rules | Told by the tool | Tests that failed (measured) | Needed a change (judged) | Verdict |
|---|---|---|---|---|---|---|
| 1 | The price per seat and night goes up: a different valid answer, same domain and range | - | - | - | - | held |
| 2 | slugify's explanation is reworded; no bound line changes | - | - | - | - | held |
| 3 | titleCase is removed | front | front | front | front | held |
| 4 | splitEvenly is renamed splitAmount | billing | billing | billing | billing | held |
| 5 | bookstatus no longer hands back the room | billing, reports | billing, reports | - | billing | held; 1 told for nothing |
| 6 | A room's seats are now called capacity in what rooms hands back | billing, bookings, front, reports | billing, bookings, front, reports | bookings | bookings, front | held; 2 told for nothing |
| 7 | Opening a booking accepts an optional arrival time | reports | reports | - | - | held; 1 told for nothing |
| 8 | Opening a booking now requires a contact email | billing, front, reports | billing, front, reports | billing, front, reports | billing, front, reports | held |
| 9 | The store refuses a value that is not an object | bookings, front, reports, rooms | bookings, front, reports, rooms | - | - | held; 4 told for nothing |
| 10 | A booking now also says when it was opened | billing, front, reports | billing, front, reports | - | - | held; 3 told for nothing |
| 11 | A new kind of room: garden | billing, bookings, front, reports | billing, bookings, front, reports | - | - | held; 4 told for nothing |
| 12 | An amount may now be at most 500,000 cents (code and bound line both changed) | billing, bookings, front, meter, reports | billing, bookings, front, meter, reports | bookings | bookings | held; 4 told for nothing |
| 13 | The kind Amount is renamed Money; its shape is unchanged | billing, bookings, front, meter, reports | billing, bookings, front, meter, reports | - | billing, bookings, meter | held; 2 told for nothing |
| 14 | bookquote's total now means one night, and its bound line says so | billing, reports | billing, reports | billing | billing | held; 1 told for nothing |
| 15 | bookquote's total now means one night; the bound line is left as it was | - | - | billing | billing | HOLE: billing needed a change and was not told |
| 16 | isEmail now hands back {ok, reason}; its comment still says boolean | - | - | front | front | not told, stopped by another guard: The check refuses text-rules' own comment, so this job cannot merge as it stands. |
| 17 | A party may now be at most 100 in the code; bound line and tests left as they were *(the provider's own tests fail)* | - | - | front | front | not told, stopped by another guard: bookings' own test named for the party bound fails, so this job cannot merge as it stands. |
| 18 | The bookcancel operation is retired (cancelling stays possible through the handle) | door, front, reports | door, front, reports | front | front | held; 2 told for nothing |
| 19 | bookquote's body field party is renamed people | billing, reports | billing, reports | billing | billing | held; 1 told for nothing |
| 20 | The meter's reading now carries price where it carried cost | billing | billing | billing | billing | held |
| 21 | The store gains a count method | reports | reports | - | - | held; 1 told for nothing |
| 22a | calendar's first job, step one: interface comments added, describing the module as it stands | - | - | - | - | held |
| 22b | calendar's first job, step two: addDays refuses a number of days that is not whole | bookings, reports | bookings, reports | - | - | held; 2 told for nothing |
| 23 | splitEvenly now hands back {parts, each}; billing already disagreed with money before this | billing | billing | billing | billing | held |
| 24 | text-rules gains truncate | - | - | - | - | held |
| 25 | rooms: adding a room accepts an optional floor, and roomlist's answer renames rooms to items | front, reports | front, reports | front | front | held; 1 told for nothing |
| 26 | Amount's field cents is renamed minor; front reads it only from what bookings passes on | billing, bookings, front, meter, reports | billing, bookings, front, meter, reports | billing, bookings, front, meter | billing, bookings, front, meter | held; 1 told for nothing |
| 27 | The store's test helper seededStore now takes a list of rows, each naming its table | front, reports | front, reports | front | front | held; 1 told for nothing |
| 28 | The store handle's get is renamed read | bookings, reports, rooms | bookings, reports, rooms | bookings, rooms; billing, front, reports only through a told module | bookings, rooms | held; 1 told for nothing |

**Totals for the planned series (measured unless marked):**

- The tool told exactly the users the rules expected in 29 of 29 changes (28 of 29 before the fix).
- 57 notices were sent. Telling every user that declares the changed module, as Process3 did, would have sent 103 on the same changes, and would have missed one user that needed a change (front in planned change 26, which reads money's field through bookings without declaring money; the tool found it by following the field).
- 28 user changes were needed (judged). 25 of them were told. Of the other 3: one is a hole (planned change 15); two were stopped before merging by something else (planned changes 16 and 17).
- 32 notices were for nothing (judged). 17 of them went to reports, the user the tool cannot follow, which by the rules is told on every change to its four providers. The other 15 are notices the rules require that turned out not to matter (an answer gained a field nobody reads; a list gained a name; a narrowing no user's value hit; comments of a module in the middle going stale after a rename).
- 63 refusal lines in the checks. All 63 are real disagreements (judged, Claude): 0 false refusals. 22 of them carry the wrong label (they say "a comment disagrees with this module's code" where the disagreement is with a provider; measured as lines with that label in a user whose own files did not change).
- The comments-only step on the calendar (planned change 22, first part) was verified mechanically as changing no running code, and sent no notice. The real change after it told bookings (which calls `addDays`) and reports.

## The adversarial rounds

ADV_INTRO

ADV_TABLES

## The holes, one by one

Each hole is a user whose own tests failed (measured) or whose code I read as wrong (judged), that was not told, with nothing else stopping the change.

**1. A change of meaning that no comment records (planned change 15).** Bookings' quote operation began to answer with the price of one night instead of the whole stay. The name, the kinds and the bound line stayed as they were; the job updated its own tests to the new meaning but not the bound line. The listing was identical, so nobody was told; billing's estimate became wrong and its test failed (measured). The same change with the bound line updated (planned change 14) told billing (measured). This is the blind spot the study already named: the method sees meaning only where a comment states it. *What would close it:* nothing in the tool can see an unrecorded meaning. A partial guard: the check could refuse a job that changes the body of a test named for a bound (`bound bookquote.total: ...`) without changing that bound line, since Bob's rule ties each bound to a test named for it. That is unproven.

**2. Rows shared through the store (adversarial change 1).** Bookings kept its interface but began to keep its rows in the store in a shorter form of its own. Reports reads those rows straight out of the store. No listing describes stored rows, so no listing changed and nobody was told; reports' test failed (measured). The study saw the same route in the real product (tests writing rows straight into a provider's table). *What would close it:* treat what a module writes into a shared store as part of its interface: a written kind for each table's rows, owned by the module that writes them, and every read of that table typed with it. Then a change to the row's kind is a listing change. Unproven.

**3. Two running parts that do not share one kind (adversarial change 4).** Billing read the meter's messages with its own copy of the message kind instead of the shared one. When the meter renamed a field, nothing billing uses changed; billing was not told and its test failed (measured). The method's rule 8 ("share one written kind for each message") would prevent this, but nothing checks that it is kept. *What would close it:* the check could refuse code that parses a message from another running part (a `JSON.parse` of what comes over a connection) unless it is typed with a kind the other part owns. Unproven.

**4. The kind of error a provider raises (adversarial change 6).** Money's `splitEvenly` began to throw a different kind of error outside its bound; its `@throws` comment said so. The tool reads `@throws` as explanation, not as part of the listing, so nobody was told; billing, whose test expects the old kind of error, failed (measured). *What would close it:* put the kinds named by `@throws` in each entry's "hands back", so a change to them tells the entry's users. A small change to the tool; unproven.

**5. A bound test moved without its bound line (adversarial change 7).** As in planned change 17, bookings' code began to refuse parties above 100; here the job also changed its own bound test to 100 but left the test's name ("1 to 200") and the bound line. Its tests passed, the listing was the same, nobody was told; front, which books 150 people, failed (measured). In planned change 17, where the job left its test alone, bookings' own bound test failed and would have stopped the merge. *What would close it:* the same guard as in hole 1 (a test named for a bound may not change unless the bound line changes too, or its name and line are compared). Unproven.

INDEPENDENT_HOLES

**Stopped by other guards, not by a notice (planned changes 16 and 17).** In 16, text rules' `isEmail` began to hand back an object while its comment still said true or false; the listing was the same and nobody was told, but the check refused text rules' own comment (7 refusal lines, all real; judged), so the job could not merge as it stood. In 17, bookings' code began to refuse parties above 100 with nothing else changed; nobody was told, but bookings' own test named for the bound failed (measured). In both, front would have broken (measured).

## Notices for nothing

In the planned series, 32 of 57 notices were for nothing (judged, Claude). In my adversarial round, 8 of 15 (judged).

- **The user the tool cannot follow** (reports) received 17 of the planned series' 32. It is handed the store as "anything" and reads bookings' rows, so by the rules it is told on every change to any of the four modules it declares. This is the price of rule 4, and it grows with how much a module uses "anything".
- **Notices the rules require that turned out not to matter** (15 in the planned series): an answer that gained a field nobody reads (change 10: billing and front); a list that gained a name (change 11: bookings, billing, front); a narrowing that no user's value hit (change 9: rooms, bookings, front); a changed bound of money's amount that only bookings came near (change 12: meter, billing, front); a rename whose stale comments in bookings changed bookings' listing and so told front (change 13); the door told when an operation it only gathers was retired (change 18); billing told because its tests add a room whose answer changed (change 6); bookings told about a new bound on `addDays` it always met (change 22, second part).
- **Two adversarial changes made the tool tell for nothing** (measured, against my expected answers): writing Booking as two kinds joined with `&` lost the parts' bound lines in the tool, so every entry handing back a Booking appeared changed and billing and front were told (adversarial change 10; a defect of this tool, fixable); and a test of front that reads the message of a caught error made the tool stop following front altogether, so front was told about a change that only accepted more (adversarial change 12; a consequence of decided rule 9 above, which could exempt caught errors).
INDEPENDENT_UNNEEDED

## False refusals

- **Planned series:** 0 false refusals in 63 refusal lines (judged, Claude). Every refusal pointed at a real disagreement; for the users that had to change, the refusal lines pointed at the lines to change (judged).
- **My adversarial round:** 13 false refusal lines from two causes (judged, Claude). (a) A request line built in two steps (`let line = 'op=bookstatus'; line += ...`): the reader cannot read the operation's name from it, refuses the call, and then refuses every use of the answer (6 lines in billing; adversarial change 8). (b) A test that narrows a message with `assert.equal(a.kind, 'reading')` before reading its fields: the reader has no description of Node's `assert` and cannot see the narrowing (7 lines in meter; adversarial change 9). Cause (b) was already met while building (`notes/development-log.md`). Both are places where the reader merely cannot tell, which rule 5 says must not be refused; the tool cannot yet tell those apart from real disagreements.
- **While building, before any change was run:** 2 false refusals (the two causes in the development log; one fixed in the reader's settings, the other is cause (b) above).
INDEPENDENT_FALSE

## What I had to decide myself

The method leaves these open. Each is in the tool's code where it applies, and each can be overruled.

1. **What an entry is.** Every export of a module's interface files: functions, values, kinds. A kind whose members include functions (an object handed out, such as the store) is written by name, and each of its methods is an entry of its own, so a change to one method tells only the users of that method. A kind of plain data is written out in full wherever it appears. An operation table gives one entry per operation, plus one for the table's list of names.
2. **Accepted, handed back, or both.** A kind of plain data counts as accepted, handed back or both according to where the module's own entries use it; a kind no entry uses (a message kind) counts as both.
3. **Bound lines.** A line `@bound` in a kind's comment belongs to the member its first word names, or to every member when it names none. The bound lines of every kind written out inside an entry are part of that entry, so a changed bound of money's amount reaches every entry that hands back an amount, in any module.
4. **Plain constants.** A constant's single value (a price) is content: its kind is widened from "the number 1500" to "a number". A list marked constant keeps its names, so a list gaining a name is a change.
5. **Renamed kinds.** A kind renamed with its shape unchanged tells only users that write its name.
6. **Lists of names.** A table or object kind gaining a name tells nobody (the new member is a new entry); losing one tells users that write the table's or kind's name.
7. **Accepting more, decided strictly.** Removing an accepted field counts as "cannot stand in" even though old calls still run, because the rules list "something removed" among the changes that tell. A function that is itself accepted (a callback) stands in only if unchanged.
8. **Who is a user.** Every later module, whether it declares the provider or not; a use that is not declared is reported. Uses are read from the user's source and its tests, as they stood before the change.
9. **Not followed fully.** A user is not followed fully for a provider when it declares the provider and no use of it is found, or when anywhere in its files it reads from or calls a value of unknown kind ("anything"), except values from outside the product (Node's own modules and names) and callbacks handed to them. A call by a name the tool cannot read makes the user not followed for every provider that has operations.
10. **Changed through a module.** When a later module's own files did not change but its listing did (because it passes on a kind of the changed provider), it is treated as changed too, and its users are told, marked "through".
11. **Calls by name.** The door's kind marks its carrying members with `@carriesop call get`; the tool reads the operation's name from the kind of the first argument, either a name or a request line whose text begins `op=<name>&`.
12. **The check's "cannot tell".** Not refused: a kind no comment states; Node's own modules and names, for which the reader has no description (TypeScript is the only development dependency, so none is installed).
13. **The first comments step** sends no notice only if the module had no interface comments before (found mechanically) and the step changes no running code (comparing the code with comments and grouping brackets left out).
14. **Changes are file overlays,** applied to a copy of the product, not commits in a separate history; a change may name earlier changes or set-ups that stand before it.
15. **Errors are not in the listing.** The tool reads `@throws` as an explanation. My expected answer for adversarial change 6 took the opposite view (that the error a provider raises is part of what it hands back). The tool and the expectation disagree there on purpose; see the holes.

## Changes made to the tool during the proof

- **Before any planned change was run** (in `notes/development-log.md`): two false refusals met on honest code while building. One was fixed by the reader's settings (the browser library's iteration part was missing), one by rewriting a test so the reader could see its narrowing.
- **After the first run**: the reader's "no implicit anything" setting was turned on, so that the comment kinds `object` and `Object` are read as written (planned change 9). The reader's complaints about unstated kinds are treated as "cannot tell". The first run is kept in `results/planned-run1/`.
- **Not fixed**, though found: the defect in adversarial change 10 (bound lines of kinds joined with `&` are lost), the label of refusals, and every hole below. Fixing them would mean writing the tool again and running everything again; I left them as found.

## Measurements

On the made-up product as committed, Node 22.23.4, TypeScript 5.6.3, in this container (measured, `results/measurements.json`):

| Module | `listing` (ms, median of 5) | `check` (ms, median of 5) | Code lines | Comment lines (source) | of which lines with a tag |
| --- | --- | --- | --- | --- | --- |
| text-rules | 218 | 229 | 20 | 22 | 9 |
| money | 217 | 239 | 51 | 19 | 9 |
| calendar | 158 | 177 | 23 | 0 | 0 |
| store | 196 | 217 | 58 | 35 | 16 |
| rooms | 203 | 228 | 42 | 45 | 21 |
| bookings | 202 | 217 | 74 | 71 | 39 |
| door | 183 | 215 | 21 | 30 | 12 |
| meter | 160 | 199 | 19 | 26 | 7 |
| billing | 208 | 227 | 45 | 32 | 17 |
| front | 185 | 201 | 31 | 28 | 16 |
| reports | 163 | 202 | 17 | 11 | 5 |

- Comment lines against code lines in the modules' source: 319 against 401, 0.8 comment lines per code line (measured; a line with both counts as code). In the tests: 14 comment lines against 444 code lines.
- `notice`, which reads the whole product twice: median NOTICE_MEDIAN ms, slowest NOTICE_MAX ms, over NOTICE_COUNT changes (measured).
- The whole planned series, including all module tests twice per change: 2 minutes 44 seconds (measured once).
- Refusals that were not real disagreements: 0 of 63 in the planned series, FALSE_REFUSAL_TOTALS (judged, Claude).

## What this proof does not show

- **The made-up modules are not the real product.** Eleven small modules, about 400 lines of code, all in one language and one process apart from the meter. The real product's routes (Workers, stored rows, HTTP between services) were imitated, not used.
- **No real job wrote these comments.** I wrote the product, its comments and its tests knowing the tool. The comments are cleaner than a job would write; the study measured that writing them for one real module took about 27 minutes and left kinds it could not determine.
- **The same session wrote the tool, the planned changes, the expected answers and the reading of ground truth.** The planned series therefore tests whether the tool does what I meant, more than whether the rules survive changes I did not foresee. INDEPENDENCE_NOTE
- **"Needed a change" is one reader's judgement** (mine). The tests that failed are measured; whether a user's code is wrong without a failing test is read.
- **What a told job does was not run.** No user's job was started on a notice. Whether a told user can act on the notice, and whether a chain of jobs (provider, then a module in the middle, then its users) reaches the end, is unproven; one planned change (26) and one adversarial change (14) only show the first step of such a chain.
- **The module list itself never changed** (no module added, removed or moved). Who is told then is not studied.
- **Size and speed** are on eleven modules. The real product has about 190.
- **Only one version of the reader** (TypeScript 5.6.3) and one version of Node were used.

## How to rerun everything

From the repository root:

```
cd notice-proof
npm ci
npm run proof
```

This runs the tool's own tests, the product's tests and the check on every module as committed, every series of changes (tool and ground truth), the comparisons and the measurements, and writes them to `results/`. It took about RUNALL_TIME here (measured once). One series: `node proof/run-series.mjs planned` (or `adversarial`, `adversarial-independent`). One change by hand: `node tool/p3tool.mjs notice .scratch/planned/<change>/before .scratch/planned/<change>/after <module>` after the series has built `.scratch/`.

## Files

| File | What it is |
| --- | --- |
| `tool/` | The tool and its tests |
| `product/` | The made-up product |
| `changes/planned.py`, `changes/adversarial.py`, `changes/adversarial-independent.py`, `changes/make.py` | How each change was written |
| `changes/planned/`, `changes/adversarial/`, `changes/adversarial-independent/`, `changes/setups/` | The changes themselves |
| `changes/*-expected.json` | Expected answers, written before any result |
| `changes/*-reading.json` | My reading of who truly needed a change, written after the results |
| `results/<series>/` | Everything the tool said and every test result, per change |
| `results/<series>-table.md`, `results/<series>-summary.json` | The comparisons |
| `results/planned-run1/` | The first run, before the fix |
| `results/measurements.json` | Times and line counts |
| `notes/development-log.md` | False refusals met while building, before any change was run |
