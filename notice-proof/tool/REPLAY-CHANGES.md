# Changes to the tool made by the replay on the real record

(Kept beside the tool, not in `notes/`, because the replay writes only in `notice-replay/` and `notice-proof/tool/`.)

Written by Claude (the replay session), 15 Nov 2026, while replaying 32 recorded changes of six real providers of civicsmith (`notice-replay/` on the branch `notice-replay`). Every change here is Claude's decision and can be overruled. None changes the method's rules; each changes how the tool writes a kind, after the tool as the proof left it (design 7) answered real code wrongly. The replay reports its results with both: design 7 exactly as committed at `10ad3d9`, and design 7 with these changes.

## Changes to the tool only

| # | Change | Answers |
| --- | --- | --- |
| R1 | **A class of the product, read as the kind of its instances, is a named kind** (`canon.mjs`, `productAlias`). Where an entry accepts or hands back an object that has methods and is an instance of a class the product declares, the entry writes it by the class's name ("handle ai-accounts.AiAccounts"), as it already did for an object of a named comment kind. The class's members were already entries of their own (rule 27), so a change to one member still tells the users of that member. | On real code, `aiAccountsOf` hands back an `AiAccounts` object, and the tool wrote that object out member by member, its 85 internal methods included, inside `aiAccountsOf`'s entry and inside every user entry that handed it on. Any change to any member read as `aiAccountsOf` handing back differently, which tells every user that calls it (almost all), and changed the listing of every user that passes the object on (8 to 12 modules "changed through" ai-runs or ai-accounts at every replayed change). |
| R1 | **Members with a private name (`#name`) are not entries and are not written into an object's shape** (`canon.mjs`, `listing.mjs`; the printed declaration of `ts.mjs` leaves out the class's `#private` marker). JavaScript lets no code outside the class reach them. | ai-runs, ai-catalogue, ai-use and wizard-scripts hold 38 to 95 private methods each; every change to one was a change of the class entry and of every entry that wrote the class out. |
| R2 | **A member keyed by a symbol is written without the reader's serial number** (`canon.mjs`): `__@iterator@152` is written `__@iterator`. | The number is the reader's own count, which differs between the reading before and the reading after; a `ReadonlySet<string>` (wizard-scripts' `ADMIN_ACTS`) and a field keyed by a unique symbol (action-plans' `WITHHELD`) read as changed at every replayed change although nothing about them changed. |

## How these changes were tested

1. The tool's own tests: 86, all passing, after each change.
2. Rule 54 of design 8 (no regressions): `npm run proof` was run again after R1 and again after R2, and every one of the 150 recorded changes was compared with its committed result at design 7, leaving out timings. Who is told, every hole and every refusal are the same on all 150 (measured; the comparison script is `notice-replay/replay/same-as-recorded.py`, its output `notice-replay/results/proof-rerun-with-R1-R2.txt`; the rerun's result files were not kept, since they differ from the committed ones only in timings and in the four displays named here). Four results differ in how an entry is shown: the made-up product's `Tally` class is now written "handle money.Tally" where it was written out, and in one of them (Y13) the entry `Tally` gains the label "bound changed" next to "cannot stand in". The users told are the same.
3. The replay's 32 real changes, run with design 7 and with these changes; both results are kept (`notice-replay/results/notice-design7/`, `notice-replay/results/notice/`).

## What these changes do not do

- They do not change the rule that a user the tool cannot follow fully is told whenever the provider's listing changes at all. On the real product every user is in that state, so whenever a listing changes, every user is still told.
- A method whose name starts with `_` is still an entry: JavaScript lets any user call it, and the tool tells the users it finds calling it.
