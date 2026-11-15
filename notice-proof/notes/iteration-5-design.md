# Iteration 5

Written by Claude (the proof session), 15 Nov 2026, after round 5: a fresh independent adversary found 6 holes, 5 false refusal lines and 11 notices for nothing in iteration 4 (holes in the blind rounds so far: 5, 8, 15, 6). Every change here is Claude's decision and can be overruled.

## Changes to the method (rules)

| # | Rule | Answers |
| --- | --- | --- |
| 27 | **Members of a class are entries of their own**, static ones included, so the backstop looks at each member, and a harmless change to the constructor cannot hide a change to a static method. | V01 |
| 28 | **A module may import only another module's interface files.** The check refuses an import of any other file of another module. | V06 |
| 29 | **A thrown kind must be a stated kind**: where a function or method states its errors, the check refuses `throw new X` of a kind it does not state. | V05 |
| 30 | **Messages written with `console.log`, `console.info` (standard output), `console.error` or `console.warn` (standard error)** follow the same rules as `write`. | V03 |
| 31 | **Plain data is never a class instance, wherever the value is written**, a branch of a conditional included. | V04 |
| 32 | **A bound test's values include the list a check is run over** (`[1, 600].map(...)`), the error kinds it names, and values handed to its own helpers' parameters. | V02, V05, V15 |
| 33 | **An added overload that keeps every old signature only accepts more.** | V14 |

## Changes to the backstop (rule 18)

| # | Change | Answers |
| --- | --- | --- |
| 22 | The printed declaration leaves out the names and written shapes of parameters (a parameter written `{ store }` or `deps` is the same parameter). | V12 |
| 23 | A kind of the module that is a union or a plain kind (not an object) is written out where it is used in the printed declaration, so naming an inline union is not a change. | V13 |

## Changes to the tool only

| # | Change | Answers |
| --- | --- | --- |
| 24 | Node's `write` and `end` take a callback; the one-per-line rule looks only at the data written. | V07 |
| 25 | The reader reads JSON modules. | V08 |
| 26 | "Possibly missing" about a value that comes from the language's own library (`pop`, `shift`, `find`, `at`, `Map.get`) is "cannot tell"; it is refused only when the missing value comes from a product kind that says it may be missing. | V09 |
| 27 | A copy made with `JSON.stringify` then `JSON.parse` in two statements is not a message. | V11 |
