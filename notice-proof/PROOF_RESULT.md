# Does the notice method work? Result of the proof session

15 Nov 2026. For Bob. Written by Claude (the proof session). Nothing here is in force.

Four words are kept apart throughout. **Measured**: counted by a script in this folder. **Estimated**: worked out from a sample. **Judged**: somebody's reading; it says whose. **Unproven**: never run.

## The answer first

ANSWER_PARAGRAPH

## Words used here

- A **module** is one part of the product with its own code, its own tests and a declared list of the modules it uses. A **provider** is a module that changed; a **user** is a module that uses it.
- **Structured comments** are comments written in a fixed form (JSDoc) that TypeScript's reader understands. They state the **kinds** of values: what a function is handed and hands back, field by field. A **bound** is a limit a kind cannot express (for example "whole number, 1 to 200"); it is written on its own line starting `@bound`.
- **TypeScript's reader** is a free program that reads plain JavaScript together with those comments. The tool uses it; nothing in the product runs differently because of it.
- The **listing** is a module's interface as the tool writes it out: each **entry** (a function, a list, a kind, a method of an object handed out, an operation called by name, the rows of a shared table) with what it accepts, what it hands back, the errors it raises and its bound lines.
- A **notice** tells a user that a provider's interface changed in a way that may concern it. A notice is **for nothing** when the user, on reading, needed no change.
- The **check** runs inside one module's own job. A **refusal** is the check stopping that job, because a comment disagrees with the module's code, the code disagrees with a provider's stated interface, or the code breaks one of the method's rules of form. A **false refusal** is one where the code was right.
- A **hole** is a user that needed a change and was not told, with nothing else stopping the change. A change is **stopped by another guard** when no notice is due but the provider's own check or own tests stop it before it merges.
- A **design** is one version of the method's rules together with the tool that applies them. There were three. A **round** is one set of changes run on one design. A round is **blind** when whoever wrote its changes had seen no result of the design they attack.

## What was built

All of it is in `notice-proof/` on the branch `notice-proof` of this repository.

1. **The tool** (`tool/`, about 1,850 lines): `listing` writes a module's interface; `notice` takes the product before and after a change and says which entries changed and how, who is told, and why; `check` makes the refusals for one module and verifies that a first step touched comments only; `audit` runs every later module's tests after a change and compares them with the notice (see "How the tool learns", below). Its own tests: 43, all passing (measured).
2. **The made-up product** (`product/`): eleven modules with real behaviour and 51 tests of their own written to Bob's rule on tests: text rules, money, a calendar that starts with no interface comments, a store that hands out an object whose methods users call, rooms, bookings, a shared door that carries calls by name, a meter that runs as a separate program and sends messages, billing, a front desk, and reports, which is handed the store as "anything" so that the tool cannot follow it. Between them they hold every route the study found (table below).
3. **The changes** (`changes/`): 29 planned changes and ADV_TOTAL adversarial ones in ADV_ROUNDS rounds. Each is a folder with the files the change writes, a description and the difference in readable form.
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

## How the proof was run

Every round followed the same order, and the git history shows it: the changes were committed; then the expected answers, written from the rules before anything was run on them, in a commit of their own; then the results; then my reading of which users truly needed a change, written after the results and kept in its own file. Expected answers were never edited after a result; where one was wrong, a dated note says so.

| Round | Changes | Written by | Run on | Blind? |
| --- | --- | --- | --- | --- |
| 1 | 29 planned, 12 adversarial | me | the first design | no: the planned changes test what I meant; my attacks were written knowing the tool |
| 1 | 10 adversarial | an independent helper that saw the rules and the tool but no results, and ran nothing | the first design | yes |
| 2 | all 51 above | | the second design, built to answer round 1 | no |
| 3 | 13 adversarial | a fresh independent helper (no results seen; ran the tool on the unchanged product only) | the second design | yes |
| 3 | all 64 above | | the third design, built to answer round 3 | no |
ROUND4_ORDER_ROWS

## What each round found

Measured counts, except "needed a change", which is my reading (judged, Claude).

| Round and design | Changes | Holes | Stopped by another guard | False refusal lines | Notices for nothing | Notices sent |
| --- | --- | --- | --- | --- | --- | --- |
| 1, first design: planned | 29 | 1 | 2 | 0 | 32 | 57 |
| 1, first design: my attacks | 12 | 4 | 0 | 13 | 8 | 15 |
| 1, first design: independent attacks (blind) | 10 | 5 | 0 | 5 | 14 | 15 |
| 2, second design: the 51 changes of round 1 | 51 | 0 | 4 | 1 | 53 | 93 |
| 3, second design: fresh independent attacks (blind) | 13 | 8 | 0 | 4 | 7 | 8 |
| 3, third design: all 64 changes | 64 | 0 | 8 | 0 | 65 | 110 |
ROUND4_ROWS

ROUND4_PATTERN

ROUND4_SECTION

## What changed from design to design, and why

Each change answers a failure that was measured. Full notes: `notes/iteration-2-design.md`, `notes/iteration-3-design.md`ITER4_NOTE.

**Second design** (after round 1):

1. The kinds of error a function raises are part of what it hands back.
2. A shared table's rows have one written kind, owned by the module that writes them (`@storedrows`); only the owner writes them, and only rows of that kind; a module that reads a table it does not own is told when its rows change.
3. A message between running parts is read and written with the kind its sender publishes, which states its channel (`@message stdout`).
4. A bound and its test move together: every bound line has a test named for it, and a test named for a bound whose checks change while the line does not counts as a changed bound.
5. A function handed on as a value (as in `parts.map(formatAmount)`) is told even when the provider only accepts more.
6. A new operation whose name another module already answers tells that operation's users.
7. The door carries request-line values as text.
8. Tool fixes: caught errors no longer make a user "not followed"; kinds joined with `&` keep their bounds; Node's `assert` and timers are described to the reader; an unreadable request line is "cannot tell".

**Third design** (after round 3):

1. The first comments step may add the tests named for the bound lines it writes (two rules of the second design conflicted).
2. Errors of methods and operations are read where the object is built, and passed on by a method that only hands its call on.
3. Plain data is built as plain data: a class instance standing for a plain-data kind is refused.
4. A member that becomes optional is a change.
5. A helper that writes tables names them where the tool can read them (`@carriestable keys`).
6. A cast may not turn a value of a known kind into a product kind it is not.
7. Bound tests are compared by what they check (their values and checks, including named values from the top of their file), not by their exact text.
8. A bound on a kind that is just a number reaches every field written with it.
9. An exported class lists what its constructor accepts.
10. Tool fixes: the 2023 language library; `Map.has` guarding `Map.get`; tests grouped with `describe`/`it`; a line built a statement before it is written.

ITER4_CHANGES

## Every change, on the latest design

"Expected" is what the rules of the latest design say, written before that design was run. "Told" is what the tool said. "Tests that failed" is measured: the user's own tests passed before the change and failed after. "Needed a change" is my reading. The last column is the verdict the same change had on the first design (or "not run" if it was written later).

TABLES

## The holes that remain, and what the method cannot see

REMAINING

## Notices for nothing

NOTICE_COST

## False refusals

FALSE_REFUSALS

## How the tool learns what it gets wrong

Bob asked on 15 Nov 2026: "I see that you're adjusting the tool based on the conditions you're finding in the test source tree. I think that this portends that the civicsmith source tree will include conditions you've not yet seen in your test data. How do we design a system that can recognize false positives and negatives and update the tool accordingly?"

The rounds above bear out the first half of that: every blind round found conditions the tool had not met, and the real product will hold more. The design that answers it is in `notes/learning-loop.md`; in short:

1. **A shadow run after every provider merge**: the tests of every module that declares the provider are run, told or not. A module whose tests newly fail without a notice is a possible hole; a told module whose job ends with no change is a notice for nothing; a refusal a job disputes is a possible false refusal.
2. **Each mistake becomes a case** (the change, what the tool said, what happened, a reading of why), exactly like this proof's change folders, expected answers and readings.
3. **The cases are the tool's tests.** A new version of the tool must give every past case its recorded verdict, or change it on purpose with the reason written down. Changes to the method's rules need Bob's word; fixes to how the tool reads code do not. This proof worked that way: all earlier changes were rerun on every new design.
4. **The tool says what it does not understand**: values of unknown kind, names it cannot read, places where it cannot tell, complaints of the reader it has never classified. A rise in these counters on the real product is the early warning.
5. **Fail safe**: what the tool cannot follow tells more, never less.
6. **Shadow before trust**: on the real product the tool runs beside the present rule (tell every declared user), deciding nothing, for a window of merges Bob sets, and decides notices only after a window with no hole.

**Built here:** `tool/audit.mjs` does steps 1 and 4 for one change and writes a case file. Run on two changes of the made-up product (measured): on planned change 15 it found no possible hole; on adversarial change 1 it flagged reports as a possible hole and showed that bookings' own check refuses the change. **Unproven:** all of it on the real product.

## What I had to decide myself

The method leaves these open. Each is in the tool's code, and each can be overruled.

1. **What an entry is.** Every export of a module's interface files: functions, classes, values, kinds. A kind whose members include functions (an object handed out, such as the store) is written by name, and each of its methods is an entry of its own. A kind of plain data is written out in full wherever it appears. An operation table gives one entry per operation, and a shared table one entry for its rows.
2. **Accepted, handed back, or both**, for a kind of plain data, follows where the module's own entries use it.
3. **Bound lines** belong to the member their first word names, or to every member. The bound lines of every kind written out inside an entry are part of that entry.
4. **Plain constants** are content: a price's single value is widened to "a number". A list marked constant keeps its names.
5. **Renamed kinds** with an unchanged shape tell only users that write the name.
6. **Lists of names**: a table or object kind gaining a name tells nobody; losing one tells users that write its name. Objects merged with `...` into such a kind (handlers wired into the door) count as a use of its list of names only.
7. **Accepting more, strictly**: removing an accepted field is "cannot stand in". Something newly accepted where nothing was accepted is "accepts more".
8. **Who is a user**: every later module, declared or not. Uses are read from the user's source and tests as they stood before the change, including values the user builds and hands where a provider's kind is expected.
9. **Not followed fully**: a user that declares a provider and has no use of it, or that reads or calls a value of unknown kind anywhere (except Node's own values and caught errors), or that calls by a name or names a table the tool cannot read.
10. **Changed through a module**: a later module whose files did not change but whose listing did is treated as changed, and its users are told.
11. **The check's "cannot tell"** (never refused): an unstated kind; Node's own modules and names not described to the reader; an unreadable call by name and the uses of its answer; a membership question asked with a wider value; "possibly missing" about a value only the module's own code produces; `Map.has` guarding `Map.get`.
12. **The reader's settings**: TypeScript 5.6.3, strict, the 2023 language library, and a short description of the Node features the product uses, written for the tool (`tool/lib/node.d.ts`), since TypeScript is the only development dependency.
13. **The rules of the second and third designs** above are mine, made to answer measured failures. None has Bob's word.
14. **Changes are file overlays** applied to a copy of the product, not commits in a separate history.

## Changes made to the tool while a round was running

Recorded where they happened (`notes/development-log.md`, and the "Defects" sections of the design notes). Each time, the first result was kept and the change was run again.

- First design, after its first run: the reader read the comment kinds `object` and `Object` as "anything" (planned change 9). Fixed by a reader setting.
- Second design: the check crashed on planned change 13; the check still refused 5 lines of adversarial change 8.
- Third design: a regrouped bound test told five users for nothing (round 3, change 11); a "set when missing" guard was refused (round 3, change 10).
ITER4_DEFECTS

## Measurements

On the made-up product as committed, Node 22.23.4, TypeScript 5.6.3, in this container, latest design (measured, `MEASURE_FILE`):

| Module | `listing` (ms, median of 5) | `check` (ms, median of 5) | Code lines | Comment lines (source) | of which lines with a tag |
| --- | --- | --- | --- | --- | --- |
MEASURE_ROWS

- Comment lines against code lines in the modules' source: MEASURE_RATIO (measured; a line with both counts as code). In the tests: 14 comment lines against 444 code lines.
- `notice`, which reads the whole product twice: median NOTICE_MEDIAN ms, slowest NOTICE_MAX ms, over NOTICE_COUNT changes (measured).
- The rules of form added in the second and third designs required 9 lines of marks in the product (`@storedrows`, `@carriestable`, `@message`) and one behaviour change (the door carries text as text).

## What this proof does not show

- **The made-up modules are not the real product.** Eleven small modules, about 400 lines of code. The real product's routes (Workers, stored rows, HTTP between services) were imitated, not used.
- **No real job wrote these comments.** I wrote the product, its comments and its tests knowing the tool. The study measured that writing comments for one real module took about 27 minutes and left kinds it could not determine.
- **Each design was built knowing the attacks it was then run on.** Only the blind rounds test a design against changes its author did not foresee. The helpers that wrote them were instances of the same model as me.
- **"Needed a change" is one reader's judgement** (mine). The failing tests are measured.
- **What a told job does was not run.** No user's job was started on a notice. Whether a told user can act on the notice, and whether a chain of jobs reaches the end, is unproven.
- **The module list itself never changed.**
- **Size and speed** are on eleven modules; the real product has about 190.
- **One version of the reader** (TypeScript 5.6.3) and of Node were used.
- **The rules of form** (rows, messages, plain data, casts, bound tests) were checked only on what these rounds wrote. Whether real jobs can keep them is unproven.

## How to rerun everything

From the repository root:

```
cd notice-proof
npm ci
npm run proof
```

This runs the tool's own tests, the product's tests and the check on every module as committed, every series of changes on the latest design (tool and ground truth), the comparisons and the measurements, and writes them to `results/LATEST/`. To rerun an earlier design, check out its commit and set `ROUND=iter1` or `ROUND=iter2`. It took RUNALL_TIME here (measured once). One series: `ROUND=LATEST node proof/run-series.mjs planned`. One change by hand, after the series has built `.scratch/`: `node tool/p3tool.mjs notice .scratch/planned/<change>/before .scratch/planned/<change>/after <module>`, or `node tool/audit.mjs` with the same arguments.

## Files

| File | What it is |
| --- | --- |
| `tool/` | The tool, its tests, and `audit.mjs` |
| `product/` | The made-up product |
| `changes/*.py`, `changes/make.py` | How each change was written |
| `changes/planned/`, `changes/adversarial/`, `changes/adversarial-independent/`, `changes/round3-independent/`, `changes/round4-independent/`, `changes/setups/` | The changes themselves |
| `changes/*-expected.json` (first design), `changes/iter2/`, `changes/iter3/`ITER4_FILES | Expected answers, written before each design was run, and my readings, written after |
| `results/iter1/`, `results/iter2/`, `results/iter3/`ITER4_RESULTS | Everything the tool said and every test result, per change and per design; the comparisons; measurements |
| `notes/iteration-2-design.md`, `notes/iteration-3-design.md`ITER4_NOTES | Each design's rules and why, and the defects met while running it |
| `notes/learning-loop.md` | How the tool learns what it gets wrong |
| `notes/development-log.md` | False refusals met while building, before any change was run |
