# Iteration 2: what changes in the method and the tool

Written by Claude (the proof session), 15 Nov 2026, after the first round's results, at Bob's request to "keep evolving the design and testing until we get it right". Every change here is Claude's decision and can be overruled. Each answers a failure measured in the first round.

## Changes to the method (rules)

| # | New rule | Answers | Kind of change |
| --- | --- | --- | --- |
| 1 | **Errors are part of what an entry hands back.** The kinds named by `@throws` are in the listing; a change to them is "hands back differently". | Adversarial change 6 (a changed kind of error broke billing unseen) | Listing |
| 2 | **A shared table's rows have one written kind, owned by the module that writes them.** The owner marks it on the kind: `@storedrows <table>`. Every write to that table must give a value of that kind, and the check refuses one that does not. A module that reads a table it does not own uses the owner's entry `table:<name>` and is told when that kind changes. The store's handle marks which of its methods take a table name: `@carriestable get list put remove`. | Adversarial change 1 (rows read straight out of the store) | New route, like calls by name |
| 3 | **A message between running parts is read with the kind its sender publishes.** The sender marks the kind `@message`. The check refuses a `JSON.parse` whose result is not given a `@message` kind (a `JSON.parse(JSON.stringify(x))` copy is not a message and is left alone). | Adversarial change 4 (billing kept its own copy of the message kind) | Enforces rule 8, which nothing checked |
| 4 | **A bound and its test move together.** Every `@bound` line needs a test named `bound <the line's words>`, and every test named `bound ...` needs its line (the check refuses either missing). If the body of a test named for a bound changes while its line does not, the notice treats that bound as changed and tells the users of every entry that carries it. (A merge gate refusing such a change was considered and rejected: it would have refused honest jobs in planned changes 9 and 19.) | Planned change 15 and adversarial change 7 (a test moved, its bound line not) | Listing |
| 5 | **A message kind states its channel** (`@message stdout`), and the channel is part of the listing. The check refuses a write of `JSON.stringify(x)` to a standard stream unless `x` has a `@message` kind for that stream. | Independent change 9 (refusals moved to the error channel) | Enforces rule 8 |
| 6 | **A function handed on as a value, not called** (as in `parts.map(formatAmount)`), counts as using all of what it accepts: for that user, accepting more is a change too. | Independent change 1 | Who is told |
| 7 | **A new operation whose name another provider already answers** tells the users of that operation. | Independent change 8 | Who is told |
| 8 | **A shared piece that carries calls by name carries values as they are.** The door no longer turns text of digits into numbers; a request line's values arrive as text. | Independent change 2 (a content change broke billing through the door's conversion) | Product rule |

## Changes to the tool only

| # | Change | Answers |
| --- | --- | --- |
| 5 | A value caught in `catch (e)` is not a provider's value: reading `e.message` no longer makes the tool stop following the module. | Adversarial change 12 (told for nothing) |
| 6 | A kind written as parts joined with `&` keeps the bound lines of its parts. | Adversarial change 10 (told for nothing) |
| 7 | The reader is given a short hand-written description of Node's `assert` (`tool/lib/node-assert.d.ts`), so it sees `assert.equal(x.kind, 'reading')` and `assert.ok(...)` narrow a value. This is a file of the tool, not a new dependency. | Adversarial change 9 (7 false refusal lines) and independent change 5 |
| 8 | A call by name whose name the reader cannot read (a request line built in steps) is "cannot tell": its own complaint, and complaints about uses of its answer, are not refused. The caller stays "not followed fully" for every provider with operations, so it is still told. | Adversarial change 8 (6 false refusal lines) |
| 9 | A refusal is labelled "disagrees with a provider" when any value in the statement has a kind declared in another module, not only when a name in it is. | 22 mislabelled lines in the planned series |
| 10 | Where a user's value is handed to a provider that expects one of its kinds (in a call, or as a field), the members the value fills count as used, whether or not the user names the kind. | Independent changes 3 and 8 |
| 11 | Something newly accepted where nothing was accepted before is "accepts more", not "cannot stand in". | Independent change 5 (told for nothing) |
| 12 | The reader is given a short description of the Node globals the product uses (process, timers, URL, structuredClone) in place of the browser's. | Independent change 10 (false refusals) |
| 13 | "Cannot tell", not refused: `includes`, `indexOf` or `has` asked about a wider value than the list holds; and "possibly undefined" about a value that comes only from the module's own code. Refused, not "cannot tell": a missing key of a closed set of names. | Independent changes 4, 5 and 7 |

## Changes to the made-up product

Only what the new rules require: `@storedrows` on the kinds rooms and bookings store, `@carriestable` on the store's handle, `@message stdout` and `@message stdin` on the meter's kinds, the door carrying request-line values as text, a test named for every bound line that lacked one, and the meter's test reading its messages with the published kind. No other behaviour changes.

## How iteration 2 is tested

1. Expected answers for every change of every earlier round are written again under the new rules, before anything is run on iteration 2, and committed on their own. The first round's expected answers and results stay as they are.
2. Every earlier series is run again on iteration 2.
3. A fresh adversarial round is written against iteration 2, by an independent helper that sees the rules and the tool but no results, with its expected answers written before it is run.
4. Repeat while a round finds a hole or a false refusal that a change to the design can close. A hole the method cannot close by construction (a change of meaning that no comment or test records) is reported, not chased.

## Defects met while running iteration 2

- 15 Nov 2026: the check crashed on planned change 13 (a complaint about the first line of a file, which has no grandparent node, reached the new "membership question" test). Fixed by guarding the lookup; planned changes 13 to 28 were run after the fix. Recorded in the report.
- 15 Nov 2026: in adversarial change 8 the check still refused 5 lines that read fields of the answer of a call it cannot read (it looked at the field's name, not the expression). Fixed; the first result is kept in `results/iter2/A08-before-fix.json`; adversarial change 8 was run again.
- 15 Nov 2026: in independent change 9 my expected answer missed that the change also rewrote the meter's test named for its "minutes" bound; the tool told billing under rule 4, which is what the rules say. The expected answer is left as written.
