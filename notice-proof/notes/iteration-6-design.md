# Iteration 6

Written by Claude (the proof session), 15 Nov 2026, after round 6: a fresh independent adversary found 7 holes (6 of them in code an ordinary job could write), 7 false refusal lines and 9 notices for nothing in iteration 5. Holes in the blind rounds so far: 5, 8, 15, 6, 7. Every change here is Claude's decision and can be overruled.

## Changes to the method (rules)

| # | Rule | Answers |
| --- | --- | --- |
| 34 | **How a running part is started is a message too.** Code that reads `process.argv` or `process.env` reads it into a kind published with `@message argv` or `@message env`; otherwise the check refuses it. | W01 |
| 35 | **A stream that carries messages carries only messages.** In a module that writes messages to a stream, every other write to that stream must be a message line. | W02 |
| 36 | **A thrown kind must be a stated kind wherever the error is stated**: on the function, on the method where the object is built, or on the kind (`@throws {Kind} member ...`). | W03 |
| 37 | **A bound written on a method where the object is built belongs to that member**, as errors written there do. | W04 |
| 38 | **Only a module's interface files are imported, however they are loaded** (`import()` included). | W05 |
| 39 | **An added overload only accepts more if every old overload keeps its place**, so none can be shadowed by a broader one before it. | W06 |
| 40 | **Rules 3 and 30 cover messages only.** A file read with `readFileSync` and parsed is not a message (it still needs a stated kind), and a log line written with `console` is not a message unless what it writes has a message kind. | W10, W11 |
| 41 | **A bound line on a kind belongs to one member only when written `member.<rest>`**; any other line belongs to every member. (A new member's name can no longer capture a line.) | W16 |
| 42 | **A bound test's values include constants read through `import * as module`.** | W17 |

## Changes to the tool and the backstop

| # | Change | Answers |
| --- | --- | --- |
| 28 | `@throws {A|B}` names two kinds. | W07 |
| 29 | A cast that only drops "missing" (`T | undefined` to `T`) is not refused. | W08 |
| 30 | A row written in place is compared field by field, each value with its own written kind (`'cancelled'`, not "text"). | W09 |
| 31 | A property added to an error object is "cannot tell". | W12 |
| 32 | The printed declaration lists the fields of an object kind in a fixed order. | W13 |
| 33 | A named plain kind is written out without brackets unless it is a union or a function. | W14 |

## A rule added while running iteration 6

| # | Rule | Answers |
| --- | --- | --- |
| 43 | **A method or operation handler inherits the bounds of every listed entry it calls**, as it inherits their stated errors (rule 23). A bound newly written on `open` limits what `bookopen` accepts just as much. | W04 |

Added 15 Nov 2026 after the first run of iteration 6, in which W04 was still a hole: rule 37 put the new bound on `Bookings.open`, but front reaches `open` only through the operation `bookopen`, whose handler calls it.

## Defects met while running iteration 6

- 15 Nov 2026, round 5 change V03: rule 40 lets a log line written with `console` pass unless what it writes has a message kind. The meter writes a refusal held in a variable declared with the message kind, but the reader narrows the variable to one member of that kind, which carries no mark; the tool took it for a log line and refused nothing, where iteration 5 had refused it. A hole, opened by iteration 6. Fixed by reading the kind the variable is declared with. Rerunning V03 overwrote its first result before it was committed; its first comparison line read: refusals none, billing broken and not told.
- 15 Nov 2026, round 5 change V11: the door's check newly refuses one line, judged a real disagreement under rule 36 (see the iteration-6 reading). The expected answers did not foresee it.
