# Iteration 2: what changes in the method and the tool

Written by Claude (the proof session), 15 Nov 2026, after the first round's results, at Bob's request to "keep evolving the design and testing until we get it right". Every change here is Claude's decision and can be overruled. Each answers a failure measured in the first round.

## Changes to the method (rules)

| # | New rule | Answers | Kind of change |
| --- | --- | --- | --- |
| 1 | **Errors are part of what an entry hands back.** The kinds named by `@throws` are in the listing; a change to them is "hands back differently". | Adversarial change 6 (a changed kind of error broke billing unseen) | Listing |
| 2 | **A shared table's rows have one written kind, owned by the module that writes them.** The owner marks it on the kind: `@storedrows <table>`. Every write to that table must give a value of that kind, and the check refuses one that does not. A module that reads a table it does not own uses the owner's entry `table:<name>` and is told when that kind changes. The store's handle marks which of its methods take a table name: `@carriestable get list put remove`. | Adversarial change 1 (rows read straight out of the store) | New route, like calls by name |
| 3 | **A message between running parts is read with the kind its sender publishes.** The sender marks the kind `@message`. The check refuses a `JSON.parse` whose result is not given a `@message` kind (a `JSON.parse(JSON.stringify(x))` copy is not a message and is left alone). | Adversarial change 4 (billing kept its own copy of the message kind) | Enforces rule 8, which nothing checked |
| 4 | **A bound and its test move together.** Every `@bound` line needs a test named `bound <the line's words>`, and every test named `bound ...` needs its line (the check refuses either missing). At the merge, if the body of a test named for a bound changed but the bound line did not, the merge is refused. | Planned change 15 and adversarial change 7 (a test moved, its bound line not) | New merge gate |

## Changes to the tool only

| # | Change | Answers |
| --- | --- | --- |
| 5 | A value caught in `catch (e)` is not a provider's value: reading `e.message` no longer makes the tool stop following the module. | Adversarial change 12 (told for nothing) |
| 6 | A kind written as parts joined with `&` keeps the bound lines of its parts. | Adversarial change 10 (told for nothing) |
| 7 | The reader is given a short hand-written description of Node's `assert` (`tool/lib/node-assert.d.ts`), so it sees `assert.equal(x.kind, 'reading')` and `assert.ok(...)` narrow a value. This is a file of the tool, not a new dependency. | Adversarial change 9 (7 false refusal lines) |
| 8 | A call by name whose name the reader cannot read (a request line built in steps) is "cannot tell": its own complaint, and complaints about uses of its answer, are not refused. The caller stays "not followed fully" for every provider with operations, so it is still told. | Adversarial change 8 (6 false refusal lines) |
| 9 | A refusal is labelled "disagrees with a provider" when any value in the statement has a kind declared in another module, not only when a name in it is. | 22 mislabelled lines in the planned series |

## Changes to the made-up product

Only what the new rules require: `@storedrows` on the kinds rooms and bookings store, `@carriestable` on the store's handle, `@message` on the meter's kinds, a test named for every bound line that lacked one, and the meter's test reading its messages with the published kind. No behaviour changes.

## How iteration 2 is tested

1. Expected answers for every change of every earlier round are written again under the new rules, before anything is run on iteration 2, and committed on their own. The first round's expected answers and results stay as they are.
2. Every earlier series is run again on iteration 2.
3. A fresh adversarial round is written against iteration 2, by an independent helper that sees the rules and the tool but no results, with its expected answers written before it is run.
4. Repeat while a round finds a hole or a false refusal that a change to the design can close. A hole the method cannot close by construction (a change of meaning that no comment or test records) is reported, not chased.
