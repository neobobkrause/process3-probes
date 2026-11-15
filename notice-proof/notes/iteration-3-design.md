# Iteration 3: what changes, and why

Written by Claude (the proof session), 15 Nov 2026, after round 3: a fresh independent adversary that saw no results found 8 holes, 4 false refusal lines and 5 notices for nothing in iteration 2. Every change here is Claude's decision and can be overruled. Each answers one finding of round 3 (numbered as its change, Y01 to Y13) or the rule conflict found in round 2 (planned change 22a).

## Changes to the method (rules)

| # | Rule | Answers |
| --- | --- | --- |
| 9 | **The comments-only first step may add tests named for the bound lines it writes**, and nothing else that runs. Rule 4 needs those tests; rule 6 forbade them. | Planned change 22a (a false refusal from two rules in conflict) |
| 10 | **Errors of a method or an operation are stated where the listing can see them**: on the method's own comment where the object is built, or on the kind as `@throws {Kind} <member> ...`. A method or handler that only hands its call to another listed entry inherits that entry's errors. | Y01 |
| 11 | **A kind of plain data is built as plain data.** The check refuses a value of a plain-data kind built with `new` from a class: copies (JSON, structuredClone, the door, the store) keep only an object's own fields. | Y02 |
| 12 | **A member of a handed-out object that may be missing says so, and becoming optional is a change** ("hands back differently"). | Y03 |
| 13 | **A helper that writes a table names it where the tool can read it** (`@carriestable keys`: the table names are the keys of the first argument, as in `seededStore`). Its callers are users of those tables. | Y04 |
| 14 | **A cast may not turn a value of a known kind into a product kind it is not.** The check refuses `/** @type {K} */ (x)` when x has a known kind that is not K. A cast from "unknown" (reading what the store holds) stays allowed. | Y05 |
| 15 | **A bound test is compared by what it checks**: its values and the checks it makes, including named values and helpers it uses from its own test file. Rewriting it with the same values and checks is not a change; moving a limit held in a named value is. | Y07 (a hole), Y12 (notices for nothing) |
| 16 | **A bound written on a kind that is just a number or text reaches every field written with that kind.** | Y08 |
| 17 | **An exported class lists what its constructor accepts.** | Y13 |

## Changes to the tool only

| # | Change | Answers |
| --- | --- | --- |
| 14 | The check follows a line built in one statement and written to a stream in the next. | Y06 |
| 15 | The reader is given the language library of the Node version the product runs on (2023), not 2022. | Y09 |
| 16 | `Map.has(k)` guarding `Map.get(k)` is "cannot tell", whatever module the value's kind comes from. | Y10 |
| 17 | Tests named for bounds are found in `it(...)` and `describe(...)` as well as `test(...)`. | Y11 |

## What is not changed

- Rule 4 still counts a bound test whose checks really changed as a changed bound, and Bob's rule still counts a reworded bound line as a change (independent change 6, round 1). Both cost notices for nothing; neither can be made exact without reading meaning.
- An error a function raises without stating it anywhere is still invisible; only stated errors are compared.
