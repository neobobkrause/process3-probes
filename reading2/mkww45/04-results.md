# Offline replay for trials J4 and J5: results

Run 14 Nov 2026. Read-only against `/home/user/repos/civicsmith-copy` (and, for reading Process3's tool source only, `/home/user/repos/process3`). Nothing was committed, fetched, checked out or pushed; no session was started. Every script is in this directory and runs with `python3 -I <script>`.

## Commits used

| Ref | Commit |
| --- | --- |
| `origin/process-state` (the records) | `c4c252913b0727096a978c581016f362937c61c4` |
| `origin/tranche` ("the tip", "today's module list") | `e7ec72e093014e59abcd736b9f8724bd57698b81` |
| `origin/main` | `0dea5a6efdd24dd5b74a08c231a9603848ad7d5d` |
| Process3 tool read for its rules (`origin/tranche` of `process3`, files `tool/lib/notice.mjs`, `exports.mjs`, `layerflow.mjs`, `checks.mjs`) | copies in `scratch/p3_*.mjs` |

Each of the 178 changes is read as `git diff <first parent> <merge>`; the merge and first parent of every change are listed in the appendix (`appendix_commits.md`) and in `data/j4a_rows.json`. 175 merges are reachable from `origin/tranche`; three (pull requests 1097, 1098, 1099) only with `--all`. All 178 resolve to exactly one merge commit.

## Results that contradict a number or a sentence in the definition

1. **"If no part can be named ... That happened in 65 of Process3's 178 notices."** 65 is what Process3 *recorded* (no ids and no export difference in the notice file; reproduced exactly, holding 63 affected verdicts). Re-derived at each change's own commit with the parts the definition lists, the number is **17** (names, public ids, ids whose tests changed), **15** with published non-code files, **11** with a hash of exported data as well. With names and public ids only it is 57.
2. **"A merged job changed its module's interface" as the trigger of test two.** Read as "one of the four parts changed", it fires on 167 of the 178 recorded changes and reaches **236 of 241** affected verdicts, not 241. Process3's "any source file changed" reaches **239 of 241**. Neither wording misses none.
3. **"Process3's rule ... notified every module that declares a use of it."** It did not: 167 declared-user pairs were never sent a notice, 66 of them were told by no route at all, and three of those 66 call the very method whose change drew 14 "affected" verdicts from the users that were told.
4. **"38 such pairs exist in tests today."** My scan finds **36** undeclared test-import pairs *to a later module* (the study's 38), but **122** undeclared test-import pairs in all. The sentence in the definition reads as if 38 were all of them. In non-test source: 0 by import, 24 by SQL, 35 by file-path reference, 4 by service binding.
5. **"Today's module list has three such uses."** True of declared uses only (3). By import there are 39 module pairs whose tests import a later module (3 declared, 36 not).

---

## J4. "Telling every declared user on any change in the provider misses none"

### J4 a. Declared users at each change's own commit (`j4a.py`; measured)

| | Count |
| --- | --- |
| Changes (notices) resolved, both parents present | 178 of 178 (144 "Merge job PR", 34 "Merge layer PR") |
| Notifications recorded in the notices | 2,707 |
| Declared-user pairs at the first parent (same number at the merge) | 2,874 |
| Notified modules that were not declared users at the change's commit | 0 |
| Verdicts: affected / not affected | 241 / 2,101 |
| Affected users inside the declared-user set at the first parent | **241 of 241** |
| Declared-user pairs Process3 did not notify | **167** (confirms the earlier sample) |

**Why 167 were not notified.** All 167 sit in the 34 layer-flow notices (6 to 9 Nov). Under layer flow (`tool/lib/layerflow.mjs`) a notice went only to users whose work was in a *later* layer; users in the provider's layer were to be "rescheduled" instead, a different record (`layerflow/<n>/reschedule/`), with no verdict.

- 101 of the 167 have a reschedule row for that provider and pull request: told by the other route, never judged.
- **66 were told by no route.** Each is a user in the provider's own map layer when the provider was reopened in a later "completion" layer (12, 13, 14): neither "same layer" nor "later". Examples: `ai-runs:1004` (7 users), `inquiry:1006` and `inquiry:1028` (9 each), `provenance:1002` (7), `leg-earning:1003` (6), `membership:1030` (4).
- Follow-up (`j4a_untold_names.py`, static signal only): of the 66, 60 import the provider; none imports a removed or re-signed name; 3 hold a class whose member was re-signed. Those 3 are `ai-accounts`, `credentials` and `project-roster` on `membership:1030`: their source calls `Membership.isAdministrator` (2, 2 and 3 call sites at the merge), the method whose changed signature is the stated reason for all 14 "affected" verdicts on that notice. By the record's own standard these are three real effects outside the 241.

**Verdicts still owed.** The "783 owed" in the plan is the count of owed *rows*; 771 of them were later followed by a verdict.

| | Count |
| --- | --- |
| Notifications with no verdict | 365 (2,707 less 2,342) |
| ... closed without a verdict by the user's own pull request or layer land | 228 |
| ... with neither a verdict nor an answer (truly open) | **137** (134 with no triage row at all, matching the study, plus 3 owed rows) |
| Owed rows still without a verdict | 12 (9 answered by a pull request or land, 3 open) |
| Declared users never asked (above) | 167 |
| Affected verdicts with no answered record | 28 of 241 |

So 532 declared-user pairs on these 178 changes carry no judgment (365 + 167), against 2,342 that do.

### J4 b. What this shows and does not show

- **Shown (measured):** every one of the 241 users Process3's workers judged affected was a declared user of the provider at the change's own commit. A rule that tells every declared user would have told all 241.
- **True by construction:** Process3 judged only modules it had notified, and it notified only declared users (0 exceptions). So no affected verdict *could* lie outside the declared set. "241 of 241" cannot fail on this record and is not evidence that undeclared users are unaffected.
- **Not shown:** that the 241 are all the real effects. 365 notified pairs and 167 declared-but-unnotified pairs were never judged; undeclared dependents were never asked; merges that raised no notice were never examined; "affected" is an AI worker's judgment.
- **Shown against Process3, not against Process4:** the three `membership:1030` users above. They are declared users, so Process4's rule reaches them.

### J4 c. Attempts to break the claim

**(1) Dependence that is not declared** (`undeclared.py`, `undeclared_names.py`, `bindings.py`; measured, with the heuristics named)

At the tip (`e7ec72e`):

| Route | From non-test source | From tests |
| --- | --- | --- |
| Import statements between modules | 3,029 statements, 1,936 pairs, **0 undeclared** | 7,522 statements, 2,423 pairs; **198 statements to an undeclared module, 122 undeclared pairs**; 36 of those pairs (71 statements) are to a later module |
| File-path string naming another module's file (heuristic: a string literal that resolves to a file another module owns) | 35 undeclared pairs (28 to a later module) | 72 undeclared pairs |
| SQL naming a table another module's source creates (pattern match) | 24 undeclared pairs (5 to a later module) | not scanned |
| Service or cross-script binding in a `wrangler.jsonc` | 7 bindings to another module, **4 not declared** (agent-worker to plane; plane to pdf-worker, ocr-worker, sheet-worker) | |
| Union of import, path and SQL | **240 undeclared pairs** | |

Not read by any script: instances handed in at run time, word keys, wire routes, copied constants. Also 49 code files with no owner module hold 134 imports of module files; nothing can be told to them.

Against the study's figures: source imports undeclared 0 (same); undeclared test-import statements 198 (study 202); undeclared test pairs to a later module 36 (study 38); undeclared SQL pairs 24 (same); path pairs differ (96 here, 158 there) because the heuristics differ. The study's scripts no longer exist, so the difference of two pairs cannot be traced.

Did the provider of an undeclared pair change in the record?

- From the tip list: 135 of the 240 pairs have a provider that is the provider of at least one recorded change (320 pair-and-change combinations).
- Re-read at each change's own commit (the stronger form): **190 (change, undeclared dependent) pairs across 68 of the 178 changes** where a module depended on the provider without declaring it and was not told. By route: 103 by a test import (42 changes), 55 by path, 34 by SQL. In **78** of them (45 changes) the very file referenced changed in the merge.
- One pair was a non-test source import: `agent-worker:97`, where `agent-drafts`' source imported `agent-worker` undeclared (the size split of 4 Nov; declared since).
- Of the 48 test-import pairs whose imported file changed: 1 imports a name whose signature changed (`following:744`: `monitoring`'s test imports `following`'s fixture `world`, which gained an optional parameter; additive); 5 import the whole file while some name changed; 42 import only names whose signatures did not change.

Reading: these are real users no notice could have reached. None has a verdict, so none can be called affected. No removed name was imported by an undeclared user. The claim is **not broken by a demonstrated effect and not proven**: 190 pairs at risk were never looked at, and a changed answer under an unchanged signature is invisible to this check.

**(2) Merges that changed an interface and raised no notice** (`no_notice.py`, `no_notice_summary.py`; measured)

Universe: every pull-request merge Process3 made, 941 merge commits (269 "Merge job PR", 239 "Merge layer PR", 433 non-job merges on the tranche's first-parent line since the set-up commit `8a80914dae`). 505 of the 508 job and layer merges change a module file; 504 change a file of the module named in the commit body (`job: <module>`); 177 of the 178 notices match one (`ai-catalogue:194` does not).

| Definition of "interface changed" | Job and layer merges, own module | With a notice | Without | Share without |
| --- | --- | --- | --- | --- |
| Any of the four parts | 360 of 504 | 166 | **194** | 54% |
| A name removed or re-signed, or a public id changed | 167 | 99 | **68** | 41% |
| Names or public ids (Process3's own vocabulary) | 191 | 120 | 71 | 37% |

Why the 194 (four parts) raised none:

| Reason | Count |
| --- | --- |
| Job merge with no source file changed, with declared users, after the route was live; Process3's rule from 4 Nov raised nothing (73 changed only tests bearing an id, 11 changed a public id) | 84 |
| Layer flow: users rescheduled, no notice | 53 |
| The module had no declared user | 34 |
| Layer flow: neither notice nor reschedule (12 where its own check said "unchanged", 3 where it said "breaking": `op-declarations` 1104, `screens-inquiry` 1019, `interface-assets` 1000) | 15 |
| Merged before the first notice was written (4 Nov 00:58Z) | 6 |
| Source changed, users declared, rule of that hour required a changed requirement id (`filings` 85, `affordances` 92, 4 Nov 03:20 to 04:28Z) | 2 |

Outside job merges, with no route at all: **45** (module, merge) cases where a non-job merge (`bob/…`, `pass/dist`) changed one of the four parts of a module, 32 of them a public id or a removed or re-signed name. Example: `bob/deploy-release-blocks` (PR 80) re-signed two exported names of `setup-words`, which had 183 declared users. And 12 cases where a job changed a part of a module other than its own. Counting those, 251 of 417 interface-changing (module, merge) cases raised no notice (60%).

