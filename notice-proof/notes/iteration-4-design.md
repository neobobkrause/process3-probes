# Iteration 4: silent only when the interface is shown unchanged

Written by Claude (the proof session), 15 Nov 2026, after round 4: a fresh independent adversary found 15 holes, 6 false refusal lines and 4 notices for nothing in iteration 3. Every change here is Claude's decision and can be overruled.

## What round 4 showed

The blind rounds found 5, then 8, then 15 holes. The adversaries read the tool's code, and each found corners of the language the tool's own comparison did not know (a second overload, a list parameter turned into a rest parameter, a read-only list made writable, a type parameter's constraint, a static method, a member written `| undefined`). Patching corners one at a time does not converge: there will always be another corner, and the real product will have its own.

## The change of approach (rule 18)

**The tool may stay silent about an entry only when it can show that the entry is unchanged.** Besides its own comparison, the tool now writes out each module's declared interface as TypeScript itself prints it (its "declaration" output, with comments removed and plain constants' values widened to their kinds). If an entry's declaration differs before and after the change, and the tool's own comparison found no change in it, the entry counts as changed in a way the tool does not classify, and its users are told. The tool's own comparison is used only to say that a change is harmless (it only accepts more); it can no longer hide a difference it does not understand.

"Accepting more" stays the one difference that tells nobody, and so the comparison that decides it is made stricter: a rest parameter where a list was, a read-only list made writable, or any change to a type parameter is "cannot stand in".

## Other changes to the method (rules)

| # | Rule | Answers |
| --- | --- | --- |
| 19 | A message is written one per line: `JSON.stringify(x) + '\n'`, or a list of them joined by line ends. Anything else written with a message on a channel is refused. | Z03 |
| 20 | A message is written where the channel can be read: if a write's stream cannot be named, it is refused. | Z04 |
| 21 | A real change to a module without interface comments, made without the comments-only first step, tells every module that declares it (the listing before has nothing to compare). | Z15 |
| 22 | A value handed back as a plain-data kind may not be an instance of a class, however it was built. | Z05 |
| 23 | A method or handler inherits the stated errors of every listed entry it calls, not only when it hands its call straight on. | Z06 |
| 24 | A method of a handed-out object handed on as a value is treated like a function handed on. | Z07 |
| 25 | A bound on a number or text kind reaches what an entry hands back, as well as fields and parameters. | Z12 |
| 26 | A bound test is compared by the pairs (check, value) it makes, values in a loop counted for each check in the loop; constants it imports from its own module count; the names of helpers in its own test file do not. | Z01, Z02, Z20 |

## Changes to the tool only

| # | Change | Answers |
| --- | --- | --- |
| 18 | Overloads are all listed. A member that may be `undefined` is "may be missing". The same kind of error stated twice is one. | Z08, Z14, Z21 |
| 19 | The reader is told of Node's `crypto`, `fetch` and `performance`, and given the library parts Node 22 has beyond 2023 (Object.groupBy and Map.groupBy, Promise.withResolvers, Array.fromAsync, the newer string methods). | Z16, Z18 |
| 20 | `filter(Boolean)` is "cannot tell". | Z17 |
| 21 | A bound line is read from the comment as written, so an `@` inside its words no longer cuts it; a complaint of the comment parser inside a comment is "cannot tell". | Z19 |

## Defects met while running iteration 4

- 15 Nov 2026, independent change 8 (round 1): the stricter comparison of type parameters compared the constraint as TypeScript printed it, and the same set of operation names printed in another order looked like a change: front was told for nothing. Fixed by comparing the constraint in the tool's own ordered form; the first result is kept in `results/iter4/before-fix/`.
