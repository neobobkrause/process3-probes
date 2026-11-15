# Iteration 7: the checks fail closed

Written by Claude (the proof session), 15 Nov 2026, after round 7: a fresh independent adversary found 10 holes (all in code an ordinary job could write), 3 false refusal lines and 8 notices for nothing in iteration 6. Every change here is Claude's decision and can be overruled.

## What round 7 showed

Holes found by the blind rounds, one round per design: 5, 8, 15, 6, 7, 10. Each design answered every change it had seen, and each next blind round found about as many new holes as the one before. Patching corners one at a time is not converging.

Seven of round 7's ten holes are one kind of weakness: a check that looks for one spelling and lets every other spelling through. The rows rule looked only at a literal table name with an owner. The error rule looked only at `throw new X`. The one-line rule followed variables but not functions. The start rule looked only at the spelling `process.env`. The interface-file rule looked only at imports. Iteration 4 turned the notice around for this reason: the tool may be silent only when it can show an entry unchanged. Iteration 7 turns the checks around the same way: **a check passes code only when it recognises it as one of the forms the rules allow; anything else in the places the rules govern is refused.** A refusal of honest code costs the job a rewrite; a hole costs a broken user nobody told.

The other three holes are outside kinds altogether: a method that starts to need its handle (`this`), two parameters of the same kind that swap places, and a limit kept in a JSON data file. They are answered one by one below, and they are the kind of change the proof expects to keep finding.

## Changes to the method (rules)

| # | Rule | Answers |
| --- | --- | --- |
| 44 | **The outside world is reached only in recognised forms.** In a module's source, `process` may be named only as `process.stdout`, `process.stderr`, `process.stdin`, `process.argv`, `process.env` (rule 34), `process.execPath`, `process.exit` or `process.exitCode`; Node's `process` module may not be imported; a file is read with `readFileSync` only at a path the tool can work out, and only from the module's own folder. Anything else is refused. | U05, U09 |
| 45 | **A stream that the module's own message kinds are published for carries only message lines the tool can read**: in the module's source every write to it is `JSON.stringify(message) + '\n'` (or a list of them joined by line ends), directly or through a variable. A line built any other way, by a function included, is refused. | U04 |
| 46 | **Where errors are stated, every `throw` is of a kind the tool can read**: `new X(...)`, `Object.assign(new X(...), ...)`, a variable set to one of these, or a caught error thrown again. `X` passes if it is a stated kind or a class that extends one. Anything else is refused. | U03, U13 |
| 47 | **Rows are written only where the tool can see them**: in a module's source, a write through a table carrier must name its table so that the tool can read it (a literal, or a constant set to one), and the table must be one that a kind marks with `@storedrows`. | U01, U02 |
| 48 | **Parameters keep their places**: if a name of an old parameter appears in the new entry at another place, the entry has changed, and its users are told. (A renamed parameter, or one written as `{ store }`, still tells no one.) | U08 |
| 49 | **The methods of a handle built as a plain object do not use `this`**, since a user may hand one on as a value. | U07 |
| 50 | **A renamed kind's members are compared too**: renaming a kind no longer hides a change in one of its members. | U10 |
| 51 | **A bound test's values include those it reads from a JSON file**, and `equal` and `strictEqual` (and the other pairs that are the same check under `node:assert/strict`) count as the same check. | U06, U16 |

## Changes to the tool and the backstop

| # | Change | Answers |
| --- | --- | --- |
| 34 | A complaint that a property is missing from something the tool's description of Node describes is "cannot tell" (the description is the tool's, not Node's); `notStrictEqual` and `import.meta.resolve` are added to it. | U11, U12 |
| 35 | The printed declaration writes a kind named through `import("...")` by its name alone, as `@import` would. | U14 |
