# Does the notice method work? Result of the proof session

15 Nov 2026. For Bob. Written by Claude (the proof session). Nothing here is in force.

Four words are kept apart throughout. **Measured**: counted by a script in this folder. **Estimated**: worked out from a sample. **Judged**: somebody's reading; it says whose. **Unproven**: never run.

## The answer first

**What the method decides rightly (measured).** On the latest built design (design 7), all 133 changes written before it, the 29 planned ones and every attack of rounds 1 to 7, were run again: the tool told exactly whom the method's rules say on all 133, and no user that needed a change went untold and unstopped. The 29 planned changes cover every route the study found. Over all 150 changes, the tool sent 182 notices where the old rule (tell every module that declares the provider) sends 474, and 111 of the tool's notices were for nothing against 376 of the old rule's: about 2.6 times fewer notices and 3.4 times fewer notices for nothing, on this made-up product of 11 modules.

**The holes a fresh attacker still finds (measured).** Each design was attacked once by a fresh helper who had read the latest rules and tool and seen no result. The holes found, design 1 to design 7: **5, 8, 15, 6, 7, 10, 8**. There is no downward trend. All but one of the 59 were in code the attacker itself marked as one an ordinary job could write. Each design answered every hole it had seen, and the next attacker found about as many new ones. The method as built does not converge to zero holes, and I do not expect it to (judged, Claude): a user can depend on what a provider does in more ways than its written interface says (a file it reads, what a method needs of the object it belongs to, which of two numbers means what), and each design closed only the ways an attacker had named.

**What catches them (measured).** In every one of the 40 cases on design 7 where a user needed a change or broke and was not told, a test of that user's own failed after the change; and in all seven blind rounds, 66 of the 70 users that went untold had a failing test. Running, after each provider change, the tests of every module that uses the provider directly or through another module would have caught all 40 on design 7, at about 4.5 module test runs per change (3.2 for declaring modules only).

**The cost (measured).** On design 7: 111 notices for nothing over 150 changes, against 99 users that needed a change; and the latest blind round's 7 false refusal lines (honest code stopped by a check), plus 1 on the earlier changes.

**What I would hand to the real process (judged, Claude; decided by Bob, 15 Nov 2026).** The notice part of design 7 with one change to how it compares interfaces (TypeScript's own type checker must confirm every "accepts more"), and, beside it, the test run above. This is described below as design 8; it is **not built and not run**. Bob's words, relayed to me by the study session on 15 Nov 2026: "Stop, write it up. It's usable, even if there's an occasional extra unnecessary notice sent out. It's 2 orders of magnitude better than the old method." The measured figure on this product is the one above: about 2.6 times fewer notices than telling every declaring module.

## Words used here

- A **module** is one part of the product with its own code, its own tests and a declared list of the modules it uses. A **provider** is a module that changed; a **user** is a module that uses it.
- **Structured comments** are comments written in a fixed form (JSDoc) that TypeScript's reader understands. They state the **kinds** of values: what a function is handed and hands back, field by field. A **bound** is a limit a kind cannot express (for example "whole number, 1 to 200"); it is written on its own line starting `@bound`.
- **TypeScript's reader** is a free program that reads plain JavaScript together with those comments. Its **type checker** is the part that decides whether one kind can stand where another is expected. The tool uses both; nothing in the product runs differently because of them.
- The **listing** is a module's interface as the tool writes it out: each **entry** (a function, a constant, a kind, a method of an object handed out, an operation called by name, the rows of a shared table) with what it accepts, what it hands back, the errors it raises and its bound lines. The **printed declaration** is the same interface as TypeScript itself writes it out.
- A **notice** tells a user that a provider's interface changed in a way that may concern it. A notice is **for nothing** when the user, on reading, needed no change.
- The **check** runs inside one module's own job. A **refusal** stops that job. A **false refusal** is one where the code was right.
- A **hole** is a user that needed a change and was not told, with nothing else stopping the change. A change is **stopped by a check** when the provider's own check or own tests stop it before it merges.
- A **design** is one version of the method's rules together with the tool that applies them. There were seven built, and an eighth described. A **round** is one set of changes. A round is **blind** when whoever wrote it had seen no result of the design it attacks.
- A **regression** is an earlier change that a later design answers worse than an earlier design did.

## Bob's question and the method under test

Bob, 14 Nov 2026: "The interface to a provider is it's domain. The bounds of valid values passed to and received from a provider are it's range. So what I'm saying is that any change to either a provider's domain or range necessitates that its users be retested. But if both domain and range stay the same, then no retesting of users is needed."

Bob, 14 Nov 2026: "If a job makes changes but none of those changes result in interface comment changes, then that provider's users don't need to be notified. Is that a solid strategy?"

Bob, 14 Nov 2026, on tests: "The tests are supposed to confirm bounds, confirm the accuracy of results under valid conditions, and confirm the recognition of an error when out of bounds. Tests should not fail because they expect a specific valid response but receive a different though still valid response."

The method as briefed had nine points: interface comments; listings before and after; per entry, "accepts more" tells no one and any change to what is handed back tells; only users of the changed entry are told, worked out by the tool; inside a module's own tests the check refuses a comment that disagrees with the module's code and code that disagrees with a provider's stated interface (the two refusals Bob approved); a comments-only first step for an uncommented module; calls by name followed through marked tables; one written kind per message between running parts; and tests named for bounds.

## What was built

All of it is in `notice-proof/` on the branch `notice-proof` of this repository.

1. **The tool** (`tool/`, about 2,300 lines of JavaScript): `listing`, `notice` (who is told, and why), `check` (the refusals), and `audit` (runs every later module's tests after a change and compares them with the notice). Its own tests: 86, all passing (measured).
2. **The made-up product** (`product/`): eleven modules with real behaviour and their own tests written to Bob's rule on tests, holding every route the study found: functions imported by name, objects handed out by a factory, operations called by name through a shared door, a name inside a request line, messages between separately running parts, an exported list, a test helper another module's tests import, a module that starts with no comments, a user handed a provider as "anything", a bound enforced only by running code, and a value reaching a user through a third module.
3. **The changes** (`changes/`): 29 planned changes and 121 adversarial ones in 9 series, 150 in all; each a folder with the files it writes, a description and the difference in readable form.
4. **The proof runner** (`proof/`): for each change it builds the product before and after, runs the tool, runs the check on the provider and every later module, and, separately and without the tool, runs every module's own tests before and after.

## How the proof was run

Every round followed the same order, and the git history shows it: the changes were committed; then the expected answers, written from the rules before anything was run on them, in a commit of their own; then the results; then my reading of which users truly needed a change, written after the results and kept in its own file. Expected answers were never edited after a result; where one was wrong, a note in the reading says so. Each new design was run on every earlier change, so the earlier changes served as its regression tests.

| Round | Changes | Written by | First run on | Blind? |
| --- | --- | --- | --- | --- |
| 1 | 29 planned, 12 attacks | me | design 1 | no |
| 1 | 10 attacks | an independent helper (saw the rules and the tool, no results, ran nothing on changed states) | design 1 | yes |
| 3 | 13 attacks | a fresh independent helper, the same terms | design 2 | yes |
| 4 | 21 | the same terms | design 3 | yes |
| 5 | 15 | the same terms | design 4 | yes |
| 6 | 17 | the same terms | design 5 | yes |
| 7 | 16 | the same terms | design 6 | yes |
| 8 | 17 | the same terms | design 7 | yes |

(The rounds are numbered as in the files; round 2 was the rerun of round 1's changes on design 2.) The helpers were instances of the same model as me.

## What each round found

Measured counts, except "needed a change", which is my reading (judged, Claude). Every row below is printed by `node proof/history.mjs` from the committed comparisons.

**The blind rounds, each on the design it attacked:**

| Design attacked | Changes | Holes | of them in code an ordinary job could write (the attacker's own mark) | False refusal lines | Notices for nothing | Notices sent |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 10 | 5 | 5 | 5 | 14 | 15 |
| 2 | 13 | 8 | 8 | 4 | 7 | 8 |
| 3 | 21 | 15 | 15 | 6 | 9 | 9 |
| 4 | 15 | 6 | 6 | 5 | 13 | 13 |
| 5 | 17 | 7 | 6 | 7 | 9 | 9 |
| 6 | 16 | 10 | 10 | 3 | 8 | 9 |
| 7 | 17 | 8 | 8 | 7 | 11 | 12 |

**Every earlier change, on each later design:** from design 2 on, every series written before a design had 0 holes on it. On design 7, all 133 earlier changes were told as the rules say (measured):

| Series, on design 7 | Changes | Holes | Stopped by a check | False refusal lines | Notices for nothing | Notices sent |
| --- | --- | --- | --- | --- | --- | --- |
| planned | 29 | 0 | 2 | 0 | 34 | 60 |
| my attacks, round 1 | 12 | 0 | 2 | 0 | 9 | 18 |
| independent, round 1 | 10 | 0 | 0 | 0 | 12 | 17 |
| independent, round 3 | 13 | 0 | 2 | 0 | 12 | 19 |
| independent, round 4 | 21 | 0 | 2 | 1 | 13 | 26 |
| independent, round 5 | 15 | 0 | 3 | 0 | 5 | 8 |
| independent, round 6 | 17 | 0 | 4 | 0 | 9 | 12 |
| independent, round 7 | 16 | 0 | 7 | 0 | 6 | 10 |
| independent, round 8 (blind) | 17 | 8 | 0 | 7 | 11 | 12 |

The full table of every change, with what the rules expected, what the tool said, which tests failed and my reading, is in `results/iter7/<series>-table.md`; every earlier design's in `results/iter<N>/`.

## Why the holes keep coming

Seven of round 7's ten holes, and most of the earlier ones, were one kind of weakness: a check that recognised one way of writing something and let every other way through (a table named in a constant, an error built by a helper, a message line built by a function, the environment read through an import). Design 7 turned the checks round so that, in the places the rules govern, anything they do not recognise is refused; round 8 then found 8 holes again, in places the checks still did not govern (a handle built as a class, an error raised in a private helper, an empty `console.log()`, a limit in a test helper of another file) and in the comparison itself (the parameters of a function handed in swapping places).

The rest are outside what any interface comment holds: a method that starts to need the object it belongs to, two parameters of the same kind that swap places, a limit kept in a data file. A change of meaning that no comment and no kind records cannot be seen by comparing interfaces, by construction. Bob's own rule on tests is what catches these: in every case on design 7, the user's own tests failed.

In the written interface itself (not the side checks, not behaviour), the holes of the last three blind rounds came mostly from one place: the tool's own comparison declaring a difference harmless ("accepts more") and so overruling TypeScript's printed declaration (a static method's change hidden behind a constructor that accepted more; an overload placed before an old one; a member changed inside a renamed kind). That is what design 8 answers.

## Regressions: why an earlier change was ever answered worse

Measured over every design: no earlier change that a design answered rightly became a hole on a later design. Earlier changes were answered worse in two ways (judged, Claude, from the results):

1. **Defects of mine, caught by rerunning every earlier change and fixed before the design's final result.** Two rules of design 2 contradicted each other (the bound-test rule required a test the comments-only first step forbade), and one honest first step was refused until design 3 settled it. A rule of design 6, in its first form, passed on the bounds of every call a method makes instead of only a call handed straight on, and told two changes' users for nothing; it was narrowed the same day. A narrowing in design 6 of what counts as a message made one earlier change a hole on its first run; fixed. The cause each time: the rules are separate patches to the same few checks, and nothing but the rerun shows that a new patch leaves the old cases alone.
2. **Costs kept on purpose.** A rule cannot tell an attack from honest code of the same shape. Design 7's rule that a plain handle's methods do not use `this` stops a method that starts needing its object, and also refuses an honest method that calls `this.list()`: 1 false refusal line on an earlier change. The stricter backstop of design 4 and the operation-name rule of design 2 added 3 notices for nothing on earlier changes. Each such rule trades a hole for a refusal or a notice.

## Every rule added beyond the brief's nine points

All of them are Claude's decisions; Bob has approved only the two refusals of the brief (a comment that disagrees with its module's code; code that disagrees with a provider's stated interface), and has said no new tests or checks. "New refusal" means the rule adds a reason for the check, inside a module's own tests, to stop its job. "Product" says whether the made-up product had to change for it. The design notes give each rule's full wording (`notes/iteration-N-design.md`); the numbers are theirs.

| # | Design | The rule in plain words | The failure it answers | New refusal | Product |
| --- | --- | --- | --- | --- | --- |
| 1 | 2 | The kinds of error an entry raises are part of what it hands back. | A changed kind of error broke a user unseen. | no | no |
| 2 | 2 | A shared table's rows have one written kind, owned by the module that writes them; only it writes them, only rows of that kind. | A row of a new shape broke a reader. | yes | yes: marks |
| 3 | 2 | A message read between running parts is given the kind its sender publishes. | A message's shape changed unseen. | yes | yes: marks, one test |
| 4 | 2 | Every bound line has a test named for it and every such test its line; a bound test whose checks change counts as a changed bound. | A limit moved in the test, not the comment. | yes | yes: tests named |
| 5 | 2 | A message kind states its channel; a message written to another channel is refused. | Messages moved to the error stream. | yes | yes: marks |
| 6 | 2 | A function handed on as a value counts as using all it accepts. | An added parameter broke a `map`. | no | no |
| 7 | 2 | A new operation whose name another module answers tells that operation's users. | Two modules answering one name. | no | no |
| 8 | 2 | The door carries request-line values as text. | The door's own conversion broke a user. | no | yes: behaviour |
| 9 | 3 | The comments-only first step may add the tests named for its bounds. | Rules 4 and the first-step rule in conflict. | no | no |
| 10 | 3 | Errors of a method are stated where the object is built or on its kind; a method that hands its call on inherits them. | A method's error changed unseen. | no | no |
| 11 | 3 | Plain data is built as plain data, never a class instance. | Copies lost a class's fields. | yes | no |
| 12 | 3 | A member that may be missing says so; becoming optional is a change. | A member became optional unseen. | no | no |
| 13 | 3 | A helper that writes tables names them where the tool can read them. | Rows written through a helper. | no | yes: one mark |
| 14 | 3 | A cast may not turn a value of a known kind into a product kind it is not. | A cast hid a wrong row. | yes | no |
| 15 | 3 | Bound tests are compared by what they check, not their text. | A limit moved inside a named value. | no | no |
| 16 | 3 | A bound on a plain number or text kind reaches every field written with it. | A bound on a kind went unseen. | no | no |
| 17 | 3 | An exported class lists its constructor. | A class's change unseen. | no | no |
| 18 | 4 | Silent only when TypeScript's printed declaration is unchanged; "accepts more" judged strictly. | Corners the tool's own comparison did not know. | no | no |
| 19 | 4 | A message is written one per line. | A blank line after each message. | yes | no |
| 20 | 4 | A message is written where its channel can be read. | A stream chosen at run time. | yes | no |
| 21 | 4 | A real change to an uncommented module, without the first step, tells every user. | An uncommented module changed unseen. | no | no |
| 22 | 4 | Plain data is never a class instance, however built. | An instance from a factory. | yes | no |
| 23 | 4 | A method inherits the stated errors of every listed entry it calls. | A wrapping handler's error. | no | no |
| 24 | 4 | An object's method handed on as a value is treated like a function. | `map(rooms.find)`. | no | no |
| 25 | 4 | A bound on a number or text kind reaches what an entry hands back. | A returned value's bound. | no | no |
| 26 | 4 | Bound tests compared by the pairs (check, value) they make. | Values moved between checks. | no | no |
| 27 | 5 | Each member of a class is an entry, statics too. | A static method's change hidden. | no | no |
| 28 | 5 | A module imports only another module's interface files. | A user reached into a provider's private file. | yes | no |
| 29 | 5 | A thrown kind must be a stated kind. | An error kind changed, comment not. | yes | no |
| 30 | 5 | Messages written with `console` follow the write rules. | Messages moved to `console.error`. | yes | no |
| 31 | 5 | Plain data is never a class instance in any position. | An instance in a conditional. | yes | no |
| 32 | 5 | Bound tests count the list a check runs over, error kinds, helpers' values. | A limit in a mapped list. | no | no |
| 33 | 5 | An added overload that keeps every old one only accepts more. | Told for nothing. | no | no |
| 34 | 6 | How a running part is started (arguments, environment) is read into a published kind. | A new required start argument. | yes | no |
| 35 | 6 | A stream that carries messages carries only messages. | An empty "ready" line. | yes | no |
| 36 | 6 | A thrown kind is checked against errors stated on the kind too. | An error stated on the kind, not checked. | yes | no |
| 37 | 6 | A bound written where an object is built belongs to that member. | A bound the listing did not read. | no | no |
| 38 | 6 | `import()` counts as an import (rule 28). | A private file loaded later. | yes | no |
| 39 | 6 | An added overload accepts more only if old ones keep their place. | A new overload shadowing an old one. | no | no |
| 40 | 6 | Rules 3 and 30 cover messages only; a file read and parsed needs a stated kind. | False refusals of a settings file and a log line. | yes (narrower) | no |
| 41 | 6 | A bound line belongs to one member only when written `member.<rest>`. | A new member's name captured a line. | no | no |
| 42 | 6 | Bound tests follow constants read through `import * as`. | A limit read through a namespace. | no | no |
| 43 | 6 | A handler that hands its call straight on inherits the callee's bounds. | A new bound not reaching an operation. | no | no |
| 44 | 7 | The outside world (`process`, files) is reached only in recognised forms. | The environment read through an import; another module's data file read. | yes | no |
| 45 | 7 | A module's message channels carry only message lines the tool can read. | A line built by a function. | yes | no |
| 46 | 7 | Every `throw` is of a kind the tool can read. | An error built through `Object.assign`. | yes | no |
| 47 | 7 | Rows go only into tables the tool can read and a kind owns. | A table renamed, or named in a constant. | yes | no |
| 48 | 7 | A parameter's name found at another place is a change. | Two parameters swapped. | no | no |
| 49 | 7 | The methods of a plain handle do not use `this`. | A method that started needing its object. | yes | no |
| 50 | 7 | A renamed kind's members are compared too. | A member changed inside a renamed kind. | no | no |
| 51 | 7 | Bound tests follow JSON files; `equal` and `strictEqual` are one check. | A limit in a data file; told for nothing. | no | no |

Besides these, 35 changes were made to how the tool reads code (for example, describing parts of Node to TypeScript's reader, or calling a complaint "cannot tell" instead of refusing). They add no rule; they are listed in the design notes. In all: **23 new refusals**, 28 rules that change who is told; the product changed for 6 rules, all in design 2 or 3 (9 lines of marks, tests named for bounds, and the door's handling of text).

## What each block of rules bought

Measured from the history table: each design's block of rules answered every hole of the round it was built on (0 holes on that round afterwards), and the next blind round found as many new ones (5, 8, 15, 6, 7, 10, 8). So no block bought a measured fall in the rate at which a fresh attacker finds holes. What the blocks did buy: the 150 changes now written down, each answered rightly by design 7 except round 8's 8; and on design 7, 31 users stopped at the provider by a check rather than told.

With the test run beside the notice, most of that check work is covered anyway (measured on design 7): of the 40 users that needed a change or broke and were not told, all 40 had a failing test, and all 40 use the provider directly or through another module.

## Which design I would hand over

| | Design 1 (the brief) | Design 7 (latest built) | Design 8 (recommended; described, not built) |
| --- | --- | --- | --- |
| Rules | 9 points | 9 points + 51 rules | 9 points + the 28 rules of design 7 that change who is told + rule 52, + the test run (rule 53) |
| New refusals beyond Bob's two | none | 23 | none required; the 23 are offered for Bob's yes or no, each on its own line above |
| Holes from its own blind round | 5 | 8 | not run |

**Design 8** (judged, Claude; Bob chose the interface fix, 15 Nov 2026; full text in `notes/iteration-8-design.md`):

- **Rule 52: TypeScript has the last word.** The one difference that tells nobody, a provider accepting more, is accepted only when TypeScript's own type checker, reading the old and new interface in one program, confirms that the new entry can stand wherever the old one was used. Otherwise, or where the tool cannot find the entry to ask, the users are told. This closes the class of interface holes of the last three blind rounds where the tool's own comparison overruled the printed declaration (judged; unproven).
- **Rule 53: the test run.** After every provider change, the tests of every module that uses it, directly or through another module, run before the change merges; a failure stops the merge, told or not. It adds no test; it runs the ones that exist.
- **The rules of form** (the 23 new refusals) are not needed for safety once the test run is in place (measured above), and Bob has not approved them. My recommendation is to leave them out, except as Bob chooses from the table.

The notice then decides who must act; the test run catches what the notice misses, where the user's tests confirm what Bob's rule on tests says they should. What neither catches is a user that needed a change and has no test that fails: in the seven blind rounds, 4 of 70 untold users (measured).

## Notices for nothing

On design 7, over 150 changes: 111 of 182 notices were for nothing (measured). Almost half, 54, went to the one module the tool cannot follow fully (reports, handed the store as "anything"), which the rules tell whenever a provider's listing changes at all; then billing 23, front 17, meter 8, bookings 6, rooms 2, door 1. The rest come from the backstop (a printed declaration that differs where nothing that matters changed: `Amount[]` written `Array<Amount>`), from bound tests rewritten without changing what they check (a message added to an assertion), and from the stricter "accepts more". Each was judged by reading the user; the reading is in `changes/iter7/*-reading.json`.

## False refusals

On design 7: 1 line on the earlier changes (the `this` rule, above) and 7 lines in round 8 (measured, judged honest by me): a data file's address held in a constant, `write(text, 'utf8')`, a message line written as a template string, errors made by a helper function, a `console.log` in a module's own test. All but the one about `write` are refusals by rules of form that design 8 would leave out unless Bob keeps them.

## How the tool learns what it gets wrong

Bob asked on 15 Nov 2026: "I see that you're adjusting the tool based on the conditions you're finding in the test source tree. I think that this portends that the civicsmith source tree will include conditions you've not yet seen in your test data. How do we design a system that can recognize false positives and negatives and update the tool accordingly?"

The rounds bear out the first half of that. The design that answers it is in `notes/learning-loop.md`, and the test run of design 8 is its first step:

1. **A test run after every provider change** of every module that uses it. A module whose tests newly fail without a notice is a hole; a told module whose job ends with no change is a notice for nothing; a refusal a job disputes is a possible false refusal.
2. **Each mistake becomes a case** (the change, what the tool said, what happened, a reading of why), exactly like this proof's change folders, expected answers and readings.
3. **The cases are the tool's tests.** A new version of the tool must give every past case its recorded verdict, or change it on purpose with the reason written down. This proof worked that way, and it is what caught the regressions above.
4. **The tool says what it does not understand**: values of unknown kind, names it cannot read, complaints of the reader it has never classified.
5. **Fail safe**: what the tool cannot follow tells more, never less.
6. **Shadow before trust**: on the real product the tool runs beside the present rule, deciding nothing, for a window of merges Bob sets.

**Built here:** `tool/audit.mjs` does steps 1 and 4 for one change and writes a case file. **Unproven:** all of it on the real product.

## What I had to decide myself

Each is in the tool's code, and each can be overruled.

1. **What an entry is**: every export of a module's interface files; each method of an object handed out, and each member of a class, is an entry of its own; an operation table gives one entry per operation; a shared table one entry for its rows.
2. **Accepted, handed back, or both**, for a kind of plain data, follows where the module's own entries use it.
3. **Plain constants are content**: a price's single value is widened to "a number".
4. **Renamed kinds** with an unchanged shape tell only users that write the name; their members are compared.
5. **Who is a user**: every later module, declared or not; uses are read from the user's source and tests as they stood before the change.
6. **Not followed fully**: a user that reads or calls a value of unknown kind, or calls by a name the tool cannot read; it is told whenever the provider's listing changes.
7. **The check's "cannot tell"** is never refused.
8. **The reader's settings**: TypeScript 5.6.3, strict, the 2023 language library and the parts of later years Node 22 has, and a short description of the Node features the product uses (`tool/lib/node.d.ts`).
9. **Every rule in the table above.**
10. **Changes are file overlays** applied to a copy of the product, not commits in a separate history.
11. **Stopping.** The proof stopped on Bob's word with round 8's holes unanswered; design 8 was not built.

## Measurements

On the made-up product as committed, Node 22.23.4, TypeScript 5.6.3, in this container, design 7 (measured, `results/iter7/measurements.json`):

| Module | `listing` (ms, median of 5) | `check` (ms, median of 5) | Code lines | Comment lines (source) | of which lines with a tag |
| --- | --- | --- | --- | --- | --- |
| text-rules | 81 | 85 | 20 | 22 | 9 |
| money | 58 | 90 | 51 | 19 | 9 |
| calendar | 46 | 64 | 23 | 0 | 0 |
| store | 86 | 90 | 58 | 37 | 18 |
| rooms | 90 | 87 | 42 | 46 | 22 |
| bookings | 101 | 96 | 74 | 72 | 40 |
| door | 153 | 89 | 21 | 30 | 12 |
| meter | 68 | 80 | 19 | 28 | 9 |
| billing | 142 | 95 | 45 | 32 | 17 |
| front | 101 | 74 | 31 | 28 | 16 |
| reports | 75 | 73 | 17 | 11 | 5 |

- Comment lines against code lines in the modules' source: 325 against 401, 0.81 per code line (measured; a line with both counts as code). In the tests: 14 against 444.
- `notice`, which reads the whole product twice: median 641 ms, slowest 1,141 ms, over 150 changes (measured).
- The tool against the old rule, over 150 changes (measured, `results/iter7/old-rule.json`): notices 182 against 474; for nothing 111 against 376; users that needed a change and were missed: 9 (round 8's holes; 31 more stopped by a check) against 1 for the old rule (a user reached only through a third module).
- The rerun of everything (`npm run proof`): RUNALL_TIME (measured once).

## What this proof does not show

- **The made-up modules are not the real product.** Eleven small modules, about 400 lines of code; the real product has about 190 modules. The ratio of notices to the old rule's depends on how many modules declare each provider, and is unmeasured there.
- **No real job wrote these comments.** I wrote the product, its comments and its tests knowing the tool. The study measured that writing comments for one real module took about 27 minutes.
- **Each design was built knowing the attacks it was then run on.** Only the blind rounds test a design against changes its author did not foresee, and their helpers were the same model as me, told to hunt for defeats with the tool's code in hand: their rate of holes is not a rate for real jobs.
- **"Needed a change" is one reader's judgement** (mine). The failing tests are measured.
- **What a told job does was not run.** No user's job was started on a notice.
- **Design 8 was not built or run.** Rule 52's effect and rule 53's cost on the real product are unproven.
- **The test run's protection depends on the users' tests** doing what Bob's rule on tests says; in the seven blind rounds, 4 of 70 untold users had no failing test.
- **One version of the reader** (TypeScript 5.6.3) and of Node were used.

## How to rerun everything

From the repository root:

```
cd notice-proof
npm ci
npm run proof
```

This runs the tool's own tests, the product's tests and the check on every module as committed, every series of changes on design 7 (tool and test results), the comparisons, the measurements, the comparison with the old rule, and the history table, writing to `results/iter7/` and `results/history.json`. It reproduces the tables above for design 7; the rows of earlier designs come from their committed results, rebuilt by `node proof/history.mjs`. To rerun an earlier design, check out its commit and set `ROUND=iter<N>`. One series: `node proof/run-series.mjs planned`.

## Files

| File | What it is |
| --- | --- |
| `tool/` | The tool, its tests, and `audit.mjs` |
| `product/` | The made-up product |
| `changes/*.py`, `changes/make.py` | How each change was written |
| `changes/<series>/`, `changes/setups/` | The changes themselves |
| `changes/*-expected.json` (design 1), `changes/iter2/` to `changes/iter7/` | Expected answers, written before each design was run, and my readings, written after |
| `results/iter1/` to `results/iter7/` | Everything the tool said and every test result, per change and per design; the comparisons; measurements; first runs kept under `before-fix/` and `rule43-broad/` where a design was fixed while running |
| `results/history.json` | The history table, design by design |
| `notes/iteration-2-design.md` to `notes/iteration-8-design.md` | Each design's rules and why, and the defects met while running it; design 8 described, not built |
| `notes/learning-loop.md` | How the tool learns what it gets wrong |
| `notes/development-log.md` | False refusals met while building, before any change was run |
