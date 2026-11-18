# [file] results.md (continued)


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

Twelve job merges (eleven after the route went live) changed a public requirement id with no source change, had declared users, and raised nothing (for example `jurisdictions` 462, 61 users; `acquisition` 467, 33 users; `interface-shell` 551, 18 users). `calculations:70` is the same kind of change and drew an "affected" verdict.

A side finding on the trigger: under "any of the four parts", 360 of 504 job merges (71%) are interface changes, because nearly every job adds or edits a test whose title bears a requirement id. That includes the tests a user writes in answer to a notice. Process3 raised 178.

**(3) The trigger** (`j4c3.py`; measured)

The 14 changes with no file under the provider's source paths:

| Change | What changed | Affected verdicts | "Source file changed" | Four parts | Which part |
| --- | --- | --- | --- | --- | --- |
| `entities:63` | test, requirement file | 0 of 48 judged | no | yes | R68 newly met; test R68 |
| `local-facts:62` | test, requirement file | 0 of 20 | no | yes | R23, R25 newly met |
| `calculations:70` | requirement file only | **1** (`op-declarations`) of 15 | no | yes | R53 newly met |
| `membership:77` (withdrawn) | test, requirement file | 0 of 7 judged (108 told) | no | yes | R154 newly met |
| `credentials:74` (withdrawn) | test, requirement file | **1** (`ai-runs`) of 4 judged (39 told) | no | yes | R27, R63, R73 newly met |
| `bundler:82` | a script outside its paths, test, requirement file | 0 of 10 | no | yes | R45 reworded |
| `bundler:88` | a script outside its paths, test, requirement file | 0 of 10 | no | yes | R46 added |
| `case-import:635` (withdrawn) | test, requirement file | none judged (12 told) | no | yes, by a test id only | test R36; R36 is in the Private part |
| `public-read:642` | fixture, test, requirement file | none judged (9 told) | no | yes | R53 reworded |
| `case-authoring:681` (withdrawn) | requirement file only | none judged (11 told) | no | yes | R14 reworded |
| `filings:727` | one fixture under its tests | 0 of 1 judged (9 told) | no | **no** | nothing nameable |
| `monitoring:743` | test, requirement file | 0 of 1 judged (9 told) | no | yes | R81 newly met |
| `hypotheses:1050` | two tests, requirement file (found mark only) | 0 of 4 | no | yes, by a test id only | test R31, which is not a public id |
| `ai-runs:1073` | one test | 0 of 18 | no | yes, by a test id only | tests R91, R103 |

Each wording against all 178 changes and the 241 affected verdicts:

| Trigger wording | Fires on | Affected reached | Missed |
| --- | --- | --- | --- |
| A: a source file of the module changed (Process3 from 4 Nov) | 164 | 239 | `calculations:70`, `credentials:74` |
| B: one of the four parts changed (names with value hash, public ids, test ids, non-code files) | 167 | 236 | `agent-drafts:570`, `agent-steps:185`, `agent-steps:497`, `ai-accounts:316`, `member-roster:286` (one each) |
| C: the four parts without the value hash | 163 | 231 | B's five, plus `extraction:432`, `local-facts:429`, `mail-door:428`, `member-roster:446` (2) |
| D: names or public ids only | 121 | 175 | 66 verdicts in 38 changes |
| E: one of the four parts **or** any source file changed | 177 | **241** | none (does not fire on `filings:727`) |
| F: a public requirement id changed **or** any source file changed | 174 | **241** | none (does not fire on `case-import:635`, `filings:727`, `hypotheses:1050`, `ai-runs:1073`; 0 affected among their 23 judged, 20 never judged) |
| G: any file of the module changed: source, tests or requirement file | 178 | **241** | none |

**The wording that misses none of the 241 on this record,** narrowest first:

> F. "A merged job changed a file under its module's source paths, or changed a public requirement of its module (an id added, removed, reworded, or its mark struck or set)."

"Source" is as Process3 read it: under the module's `paths`, not under its `tests`, not Markdown. G ("any file of the module") is the only wording that fires on all 178. The definition's present wording (B) and Process3's (A) each miss recorded effects. The five that B misses are changes of behaviour with nothing nameable: a body-only change, or a value changed in a file no other module imports.

### J4 d. Order-breaking (`j4d.py`; measured)

- **Confirmed for declared uses:** exactly three declared uses of a later module at the tip: `hypotheses` (96) uses `steps` (97); `agent-runner` (115) uses `ai-gate` (118); `agent-drafts` (116) uses `agent-worker` (117). The last pair is also mutual (each declares the other). `origin/main` has 178 modules and none.
- **Corrected for real dependence:** 39 module pairs have tests importing a later module (3 declared, 36 undeclared; listed by `j4d.py`). By path reference 28 undeclared source pairs and 65 undeclared test pairs point later; by SQL, 5.

---

## J5. "Naming the changed parts lets a notified job read less without missing an effect"

### J5 a. Parts derived mechanically (`extract.py`, `parts_run.py`, `j5c.py`, `j5a_extra.py`; measured)

The extractor: (1) exported names of the provider's entry files (source files another module imports, else its index files), with function parameter lists, class public members, re-exports followed, and a hash of the initialiser text of exported data; (2) ids under `## Public` of `build/requirements/<module>.md`, added, removed, reworded, newly met, retired; (3) ids in the titles of tests added, removed or changed under the module's tests; (4) non-code, non-Markdown files under the module's source paths.

**Check of the extractor** (`validate_names.py`): against the 71 export records Process3 wrote into notices, 67 agree exactly on names added, removed and changed. The other 4 were looked at: in 3 the port reads a class member that Process3's reader of that date lost (one is a bug its own source comments record); in 1 names moved to a re-export from another module (handled since). The 107 notices without an export record have no such check.

| Changes of 178 with | Count | Affected verdicts in them |
| --- | --- | --- |
| at least one named part (all four, with value hash) | **167** | 236 |
| no named part | **11** | 5 |
| a name added, removed or re-signed | 76 (23 with a removal or new signature; 53 additions only) | 118 |
| a value hash changed | 67 | 130 |
| a public id changed | 93 (69 newly met, 20 reworded, 11 added, 6 retired, 2 removed) | 130 |
| an id whose tests changed | 151 | 205 |
| a published non-code file changed | 3 | 5 |

Unattributed changes under each reading of the part list:

| Part list | Name no part | Affected in them |
| --- | --- | --- |
| Process3's record as written (no ids, no export difference) | 65 | 63 |
| Names and public ids, re-derived | 57 | 66 |
| Names, public ids, ids whose tests changed (the definition's notice) | 17 | 15 |
| ... and non-code files (the four parts) | 15 | 10 |
| ... and the value hash | 11 | 5 |

The 11: `agent-drafts:570`, `agent-steps:185`, `agent-steps:497`, `ai-accounts:188`, `ai-accounts:316`, `ai-catalogue:204`, `ai-catalogue:336`, `filings:727`, `member-roster:157`, `member-roster:286`, `run-rules:330`.

How narrow the named parts are (the only measure of "read less" this replay gives): in the 151 changes that name a public id, the median is 4 ids, 9.6% of the module's live public ids; 12 changes name more than half of them; the largest names 71.

### J5 b. Do the named parts lead to each of the 241? (`j5b.py`, `j5b_support.py`, `j5b_judged.py`)

Mechanical form (measured): the verdict's evidence sentence contains a name or id that the extraction also names.

| Class | Verdicts |
| --- | --- |
| Evidence names a changed exported name | 79 |
| Evidence names exported data whose value hash changed | 36 |
| Evidence cites a changed public id | 50 |
| Evidence cites an id whose tests changed | 3 |
| Evidence names a changed non-code file | 1 |
| **Evidence names a part: total** | **169** |
| **The change is one where nothing could be named** | **5** |
| **Cannot be decided mechanically** | **67** |

The 53 id matches were read one by one; each attributes the id to the provider. The same split under other part lists: without the value hash 139 / 10 / 92; without test ids 166 / 34 / 41; names and public ids only 135 / 66 / 40.

Judged form (my judgment, all 67 read, no sampling). For each I read the evidence sentence and searched the text a job would read if it read only the named parts (the named signatures, the requirement lines of the named ids, the changed tests bearing those ids, the diff of a named non-code file; saved as `scratch/parttext_<change>.txt`) for the thing the evidence says changed.

| Judgment | Verdicts |
| --- | --- |
| Led: the named parts' own text states the changed thing | 53 |
| Led, but only through the diff of a named non-code file (`agent-worker:364` three users, `agent-worker:569` one) | 4 |
| Led, but the named parts are most of the module (`ai-runs:96`, 62 ids, four users; `op-declarations:95`, 45 or more ids, three users) | 7 |
| Weak: a named part points at the area, its text does not state it (`signin-door:153` to `store-request`) | 1 |
| **Not led** | **2** |

The two not led:

- `ai-runs:323` to `queue-producers`: the effect is a changed test fixture (`world.mjs`) that the user's test imports. A fixture bears no requirement id, so no part names it.
- `registers:426` to `corpus-export`: the effect is a new declared table in `schema.mjs`. The parts name `DECLARED_OPS` and four test ids; none mentions the table.

**The result as separate numbers:** of 241, 169 are led to by the mechanical test, 64 more by my judgment (11 of them with the reservations above), 1 is weak, **2 are not led to**, and 5 sit in unattributed changes where naming saves nothing. The claim "without missing an effect" is broken for 2 of 241 if a notified job reads only the named parts, and holds for the 5 only because the notice says "nothing could be named".

Limits. My judged form is weaker than the plan's: I knew the effect and looked for it in the parts; a blind reader given only the parts and the user module might not find it. The mechanical form shows the part is *named in the evidence*, which is strong for names and weaker for a test id. The verdicts are AI judgments.

### J5 c. What the four parts do not see (`j5c.py`; measured, counts across all 178)

| Kind | Changes | Affected verdicts in them |
| --- | --- | --- |
| A changed value under an unchanged name, seen only if the notice carries a value hash (value changed, no name added, removed or re-signed) | 30 | 57 |
| ... of which nothing else is nameable either (unattributed without the hash) | 4 | 5 |
| An export of a file no other module imports changed, nothing at the entry files (an indirect value, as `MODULE_IDS` behind `MODULE_ORDER`, or an inner file) | 15 | 24 |
| Source code changed with no exported name, signature or value hash changed (a changed answer under an unchanged signature, if anything changed for users) | 58 | 64 |
| ... and no public id changed either | 37 | 39 |
| ... and no test id either | 12 | 10 |
| Requirement file changed with no public R id changed | 54 | 78 |
| ... changed **only** in found marks (F ids) | **39** | 61 |
| ... found marks plus other non-public text | 10 | 11 |
| ... private ids or other text only | 5 | 6 |
| Requirement file changed a found mark at all | 62 | 84 |
| Public text outside any id line changed (Purpose, Terms) | 19 | 28 |
| Test files changed, none bearing a requirement id | 23 | 33 |
| A non-test file under the module's tests changed (a fixture or helper other modules may import) | 53 | 104 |
| No source file changed | 14 | 2 |

The earlier sample's two kinds are confirmed and counted: a changed value under an unchanged name (30 changes; 4 with nothing else nameable; 15 more where the value changed in a file the hash does not reach), and requirement files changed only in found marks (39). A third kind did the damage in J5 b: a changed fixture under the provider's tests (53 changes), which no part names. Not countable from the repository: a served page, a committed bundle, a wire shape.

### J5 d. "Test less"

**This replay cannot measure it.** It reads text. Whether a notified job could run fewer tests without missing a failure needs the users' tests run at 178 commits, with and without a selection rule, and there is no mechanical rule today that selects a user's tests from a named part. The replay measures only "read less", and only as how few ids a notice names (median 4, 9.6% of the module's public ids).

---

## Scripts and data

| Script | Does | Output |
| --- | --- | --- |
| `lib.py` | git helpers, notice loading, merge resolution, module map | |
| `extract.py` | the four-part extractor | |
| `validate_names.py` | extractor against Process3's 71 export records | printed |
| `j4a.py`, `j4a_untold_names.py` | J4 a | `data/j4a_*.json` |
| `undeclared.py`, `undeclared_names.py`, `bindings.py` | J4 c(1) | `data/undeclared_*.json`, `data/bindings_tip.json` |
| `no_notice.py`, `no_notice_summary.py` | J4 c(2) | `data/no_notice_rows.json` |
| `j4c3.py` | J4 c(3) | printed |
| `j4d.py` | J4 d | printed |
| `parts_run.py`, `j5a_extra.py`, `j5c.py` | J5 a, c | `data/parts.json`, `data/j5c_counts.json`, `data/j5a_extra.json` |
| `j5b.py`, `j5b_support.py`, `j5b_judged.py` | J5 b | `data/j5b_rows.json`, `data/j5b_judged.json`, `scratch/parttext_*.txt` |

Order: `j4a.py`, `parts_run.py` (about 100 s), `validate_names.py`, `undeclared.py` (about 75 s), `undeclared_names.py`, `bindings.py`, `no_notice.py` (about 100 s), `no_notice_summary.py`, `j4c3.py`, `j4d.py`, `j4a_untold_names.py`, `j5b.py`, `j5b_support.py`, `j5b_judged.py`, `j5c.py`, `j5a_extra.py`. `scratch/` holds exports of `notices/` and `layerflow/` from the state branch and can be deleted; the scripts recreate the first two.

## Known weaknesses of the measurement

- The code reader is a scanner with regular expressions, a port of Process3's, not a JavaScript parser. Code built inside template strings is not seen.
- The value hash is of the initialiser's text. A value computed from another file's data does not change its hash (`member-roster:286`).
- Only the provider's own requirement file is read. Requirement files split off for size (18 modules) are treated as their own modules, as the module map does.
- "Requirements whose tests changed" takes every `R<n>` in a changed test's title. 151 of 178 changes name one, so this part attributes almost everything and narrows least.
- If "requirements whose tests changed" is restricted to the module's *public* ids, 146 changes name one (not 151), and 13 changes name no part (not 11; `case-import:635` and `hypotheses:1050` join them); the affected verdicts in unattributed changes stay at 5.
- The path and SQL routes of undeclared dependence are pattern matches and hold some noise.
- One notice (`ai-catalogue:194`) does not match the module named in its merge commit and is absent from the J4 c(2) table's "with a notice" column.


# [file] proof_outcome.md

# The proof of the notice method: outcome

15 Nov 2026. For Bob and for the main Process4 session. Written by Claude (the study session). Nothing here is in force.

Four words are kept apart. *Measured*: counted by a script. *Estimated*: worked out from measured figures. *Judged*: somebody's reading; it says whose. *Unproven*: never run.

## Where it is

The proof session's report is `notice-proof/PROOF_RESULT.md` on branch `notice-proof` of `neobobkrause/process3-probes`, at commit `10ad3d98a41e651a132be73f5c0390642cc891e2`. Its rules, results and every change are beside it in `notice-proof/`. It ran from 01:00 to 14:43 UTC on 15 Nov 2026, and its session record shows about $99 spent.

## What it did

It built the tool and a made-up product of eleven modules holding every route between modules that the study found. It then ran 150 changes: 29 planned, 12 attacks of its own, and 109 written blind. "Blind" means by a fresh helper that had seen no results, attacking the newest design. It built seven designs of the rules, each answering the failures of the round before, and described an eighth without building it. It stopped on Bob's words of 15 Nov: "Stop, write it up. It's usable, even if there's an occasional extra unnecessary notice sent out. It's 2 orders of magnitude better than the old method."

## Its main findings, and what I checked

| Finding (the proof session's) | Checked by the study session against its committed data |
| --- | --- |
| On design 7, all 133 changes written before that design were told exactly as the rules say | Agrees: the history file shows 0 holes and every answer matching the rules on those 133 |
| Holes found by each blind round, designs 1 to 7: 5, 8, 15, 6, 7, 10, 8; no downward trend | Agrees: 59 holes in 109 blind changes |
| Over all 150 changes, design 7 sent 182 notices, 111 of them for nothing; telling every declaring module would have sent 474, 376 for nothing | Agrees with its comparison file |
| 28 users that needed a change went untold on design 7 | Agrees with my own recount from its tables |
| "All 40" untold users that needed a change or broke had a failing test | My recount from the same tables finds 50, not 40; I could not reconcile the definitions. In all 50 the user's own tests failed, so the conclusion holds |
| In the blind rounds, 66 of 70 untold users had a failing test | Not checked |

## Design 8, which it recommends

It is not built and not run. It keeps design 7's 28 rules on who is told, drops design 7's 23 new refusals, and adds three rules:

- **Rule 52.** "Accepts more", the one difference that tells nobody, is accepted only when TypeScript's own type checker confirms it. The proof session records that Bob chose this fix in that session on 15 Nov. I have not seen his words there.
- **Rule 54.** No version of the tool is accepted while any recorded change is answered worse than before. The recorded changes are the tool's own tests.
- **Rule 53.** After every provider change, the tests of every module that uses it, directly or through another module, run before the change merges, and a failure stops the merge. This is the proof session's recommendation. Nothing it records shows Bob approved it.

## My assessment

This is my judgment, the study session's.

1. **The proof answered the question.** On the changes it can see (names, fields, kinds, operations called by name) the method decides rightly. It cannot be made complete, because a user can depend on things no written interface records. What it misses has, in every case recounted, shown up as a failing test of the user.
2. **Rule 53 as written would cost more than the old method on the real product.** On today's module list a module has on average 79 users directly or through another (measured). Over the 178 recorded changes rule 53 would have run about 14,500 module test runs (estimated from the module list), against Process3's 2,707 notifications. One user's tests took about three minutes here (measured, one module). That is the reverse of Bob's goal. It is also a new gate on every merge, where Bob has said no new tests, gates or checks.
3. **Without rule 53 the misses are caught later, not never.** They are caught when the user's own job next runs its module tests, or in the internal or external walk. That is what Bob accepted on 15 Nov in calling the method "usable".
4. **"Two orders of magnitude" is still not measured.** The proof's mix of changes was chosen to attack the tool, so its 2.6 times fewer notices is no guide. The real record is the guide. There, 74 of 2,707 notifications were needed (judged), and 64 of 178 changes would have sent nothing even with no comments added (measured). The proof session and I agree on the next step that measures it: comment a cluster of real, heavily used modules and replay their recorded changes with the tool.

## What is Bob's to decide

1. **Rule 53, the test run before each merge.** I recommend no, for the cost in point 2 above.
2. **The 23 refusals of design 7.** Each is listed, one line each, in the proof's report under "Every rule added beyond the brief's nine points". I recommend none, beyond the two Bob already approved. They answer attacks written to defeat the tool, and they refused honest code in every blind round.
3. **Whether to run the replay on real modules** before the method goes into Process4's definition.

Design 8's other rules on who is told, and rule 54, are technical. I would take them as the proof session recommends.


# [file] dot-versus-owner-front-door-feasibility-20261117.md

# Process4 first-class session feasibility: dot and owner-created front door

**17 November 2026. Status:** assistant research and proposed small experiments, not owner approval/adopted Process4 design. Builds on [Decision C](codex-first-class-feasibility-20261117.md). The owner supplied two options: use Dots if viable; or create one owner-visible front-door chat whose only role is communications conduit over Process4's existing session-message channels. No claim of direct runtime access has been tested.

## Official Dot evidence

- https://learn.chatgpt.com/docs/dots/tasks-and-memory — a dot can create **separate visible cloud threads**, send follow-up instructions, and run/coordinate background agents while owner talks with dot; owner can also open and directly steer created threads.
- https://learn.chatgpt.com/docs/dots — Dots gradual availability by plan/region/workspace. Eligible Pro/Business Premium delegated Codex use draws from ordinary Codex allowance; Enterprise charging may differ. Do not assume this account has Dot access.
- https://learn.chatgpt.com/docs/dots/computers-and-apps — Dot can use a previously prepared Codex Cloud environment for software work; owner can interact with the separate tasks.
- https://learn.chatgpt.com/docs/whats-new/dots-october-9-2026 — release notes say Dot can start and follow up Codex threads.

**Still not established:** account entitlement, account's own ordinary Codex sidebar listing, assignment to product project, general native inter-session message bus from unrelated Codex roles *to* Dot, peer-to-peer communication, trusted unattended relay of arbitrary Process4 messages, event-driven delivery latency, or original owner-facing independent session controls after completion. Documentation proves product possibility, not this account's end-to-end Process4 requirements.

## Owner-created front-door hypothesis

One **manually created ordinary, visible chat** acts as minimally stateful communications interface; standing roles and authoritative product/process state remain elsewhere. On each turn the front door reads compact checked routing contract and current role bindings, forwards exact owner wording, and returns correlated attributed replies. No product decisions, canon interpretation, grants, process adoption, or session-memory authority. Core message ID, recipient verification, approval provenance and transport live in deterministic tools/controller, not a model instruction that compaction could forget.

**Potential advantage:** front-door compaction does not directly discard binding canon if no authoritative decisions are stored only in that conversation and all relevant routing controls are reloaded and enforced on each turn.

**Critical unknown:** does a manually created top-level Codex session have a **supported** tool path into the existing bootstrap's child-only native messaging tree, including reactive idle recipient wake and return replies? Native followup previously worked only for addressable descendants within a managed tree; manually created peers are not automatically addressable. It may be easier for an owner-created console to spawn its **own** child tree, but that returns to a single-console UI rather than independent visible first-class role sessions.

**Compaction warning:** Even a conduit can mistransmit or fabricate authority after compaction. It is not enough that it remembers "I am the front door". Verify source reload and deterministic routing/authority checks each turn, especially exact owner approvals and pending messages. Use bounded prompts/turns and refresh where possible.

## Small decisive experiments

### Test 1: Dot visibility and continuation (only if account already eligible)

Have the owner start one dot using existing supported UI and supply one bounded prompt asking it to create **one read-only, independently visible Codex cloud task** in an already configured environment, capture the task URL/ID, and after task completion send a follow-up to that same thread. Owner checks ordinary Codex list and messages thread directly. Record whether the dot can respond to that direct owner turn and follow up later. No paid API, credentials, product writes or new grants. If Dot unavailable, mark ENTITLEMENT_UNAVAILABLE; no speculative alternative subscription purchase.

Then conduct a second gated **reactive inter-session** test: a different supported Process4 role tries to send a real identified message to Dot-created thread through a documented message method. Distinguish Dot's ability to follow up on Dot-owned tasks from general arbitrary peer access. If no supported cross-role interface, mark PEER_ROUTING_UNPROVEN even if independent creation passes.

### Test 2: Owner-created conduit to existing native roles

Owner creates **one independent test chat** (or use an already existing manually created test chat) and grants no new privileges. Execute one read-only addressed request to an actual *existing* Process4 role via a supported native tool; record canonical message ID, actual target generation, observed wake, role reply and correlated response. Verify no Github per-message write. Repeat after a completed turn. If the separate chat cannot access the prior agent tree, stop: **NO_SUPPORTED_CROSS_TREE_ROUTE**, not a guessed success. Do not claim typing a message in another chat or manually copy/pasting constitutes native reactive transport.

**Possible alternate scope, if owner accepts:** use newly owner-created console as sole root of a *new* native hierarchy. That can recover mediated interaction but does **not** satisfy earlier independent-first-class visibility of every role. Do not silently replace the earlier requirement with it.

### Decision grid

- Dot creates visible persistent tasks + Dot followup + owner direct interaction: first-class owner experience is demonstrated **for Dot-owned threads**. Inter-role reactive communication needs its own evidence.
- Owner-created conduit reaches existing role tree with attributed native reply: owner-console relay demonstrated without old bootstrap. Independent role-list presence remains unsatisfied unless owner expressly changes requirement.
- Neither works: existing Decision C stands; pause migration dependent on first-class session orchestration.
- No entitlement or no tool exposed: report a bounded blocker and exact minimal owner prerequisite, not universal impossibility.

Use existing subscription only; no separate Agents API, paid VM, purchased credits, credential reads, speculative login changes, or changes to CivicSmith2 and Claude implementation.


# [file] session_brief.md

# Brief for a session on one question: when must a module's users be updated?

Written 14 Nov 2026 as the starting text for a separate session that continues this study with Bob, the owner. It stands on its own; the full study is `process4/working/notice_study/study.md` in this repository (branch `process4`).

## How to talk to Bob (his standing rules)

- **Plain words.** No reference codes, no shorthand, no rule letters. Say "the rule that tells a module only when something it names has changed", not "g1". Module names are fine. Explain any technical word the first time, in a sentence.
- **Only his own typed words count as his.** Quote them exactly, with the date. Anything a session wrote down for him is the session's record, not his words. Never say "you decided" for something he did not type.
- **No assurances.** Do not say a thing works, is safe, or will hold unless it was measured, and then say what was measured and on what.
- **Keep four things apart, every time:** *measured* (counted by a script), *estimated* (worked out from a sample), *judged* (somebody's reading; say whose), *unproven* (never run).
- **No new tests, checks, gates or reviews.** Process4 has exactly three tests: each job's own module tests, the internal walk, the external walk. The notice to a user module is a notification, not a test. No session reviews another's work. A remedy may be: a sharper statement of what a module's interface is; a rule the provider's job follows when it writes requirements and tests; a mechanical rule for who is told, worked out from the change itself; a way for the told module to dispose of a notice cheaply; a change to how modules publish what others rely on.
- **When you propose changing something he defined,** describe the proposed change in words he understands and wait for his yes or no. His words of 14 Nov: "When you change something I defined you need to describe the PROPOSED change in words I understand so that I know what you're proposing and whether to approve the change or not."
- He enters no commands and edits no files. Bring him questions that are his (what the product and the process should be), not technical ones. Put a question once, with the options and what each costs.

## The question, in his words

Typed 14 Nov 2026:

> "If every user is told when the implementation of a module changes but the interface doesn't, then every change will continue to cause every user of that module to be rebuilt and tested. That's very (very!) inefficient and unnecessary. There must be a practical means of identifying when a change doesn't require user modules to be updated. Maybe we should create a separate session that focuses only on this issue so that we can explore the challenge in as much detail as necessary to find a means of being more efficient during the build process."

> "Explain why using the current criteria 5 of the 241 changes that AI workers judged real would have been missed. What was different in those 5 modules?"

Background he has set (the session's record of 13 Nov, which he has referred to as his decisions): the product is about 220 modules in one order; a module may use only modules before it; each module is built and tested by one job; "When a job changes a module's interface, every user of that module is notified, so those modules' jobs are updated as needed and tested"; "Recognising that an interface changed must be proved rigorous and correct."

## What exists to measure against

Process3, the earlier process, left a record in the public repository `neobobkrause/civicsmith-copy` (clone it read-only; it is not attached to the session) (branch `origin/process-state`, folder `notices/`): 178 changes to a module, 2,707 notifications to modules that use it, and 2,342 written verdicts by AI workers, 241 "affected" and 2,101 "not affected". Each verdict gives a one-sentence reason with a file and line. An earlier replay of this record is in `process4/working/replay/` (`results.md`).

**Read-only.** Never commit, push, fetch into or check out in any clone of the product repository. Start no cloud sessions for this work.

## What has been measured so far

**1. "Affected" did not mean "had to be updated."** For each of the 241, the study looked at what the user module's own job did afterwards. (Counts of merges and files are measured. The sorting into three kinds is judged, by one reader, from the verdict's reason, the job's own written words and the changes it made.)

| | Of the 241 |
| --- | --- |
| The user was wrong or failing until it changed ("broken") | 40 (26 in its code, 14 only in its existing tests) |
| The user changed its code to take up something new; nothing was wrong without it ("adopted") | 34 |
| The user's job changed no code for it; often it added one test saying so | 140 |
| No follow-up ever ran (the process stopped); the reason reads as nothing to change | 26 |
| Cannot tell | 1 |

So of 2,707 notifications, 40 (1.5%) found a module that needed updating and 34 (1.3%) one that chose to adopt something. The 40 are in 23 of the 178 changes. 17 of the 40 come from two changes that retired old names.

**2. What breaks users is removal.** 22 of 27 cases where a name, an operation or a field was removed or renamed broke the user. Every other kind of change (a changed answer under the same name, a changed table, a new capability, a changed way of calling) broke its user at most one time in eight. (Judged kinds.)

**3. The five that the present wording would have missed.** The present wording says the interface changed when one of four things changed: an exported name, a numbered public requirement, a test whose title names a requirement number, or a published file that is not code. In five changes none of those changed and a user was still judged affected. In all five the provider changed what its callers see, inside a function or a list, without changing anything that carries a name or a number.

| Change | What happened | What the user had to do |
| --- | --- | --- |
| agent-drafts, pull request 570, user agent-worker | Drafts stopped saying which "runner" to use. The behaviour was written down only in the other module's file | Add a guard to its code (done in a job already open) |
| agent-steps, 185, user agent-worker | A usage record lost two fields and gained two. The public requirement already described the new shape and was marked "not yet met"; the mark was left as it was | Change one line of code (in a job already open) |
| agent-steps, 497, user agent-worker | A new refusal is added to a list the user hands on. Written in no requirement | Nothing; it added one test saying so |
| ai-accounts, 316, user store-assembly | A fix: a name is now recorded as "member:ann", not "ann". Recorded as a found flaw, not as a public requirement | Respell three lines of its own tests |
| member-roster, 286, user membership | A generated list of all modules gained one, because the product's module list did | Nothing; it added one test saying so |

Three were real breaks, two were not. Four of the five involve modules that had been split apart for file size or had code moved between them that week.

**4. Why the 2,101 were not affected** (estimated from 120 drawn at random, seed 20261114): in about 39% (range 30 to 48%) the user had no code that uses the provider at all, only a line in the module list; in about 53% it used the provider but not the part that changed; the rest were small groups. Measured on all 2,707: in 510 (19%) nothing of the user imports the provider; in 685 (25%) only its tests do.

**5. Most users had work of their own anyway.** 1,735 of the 2,707 notifications went to a module that already had an unmet requirement or an open job; 33 of the 40 broken users were among them. 972 went to a module with no other work. (Measured. That week nearly everything had work; an ordinary week may differ.)

## The candidate rules and how each scored

Each rule was worked out for all 2,707 notified pairs from the code as it stood at each change. "Broken reached" uses the judged sorting above.

| Rule, in words | Notifications it would send (of 2,707) | Broken users reached (of 40) | Adopters reached (of 34) |
| --- | --- | --- | --- |
| Process3 as it ran: tell every declared user | 2,707 | 40 | 34 |
| Tell every declared user whenever the provider's code changed | 2,385 | 40 | 32 |
| Tell only users that import a name which was removed or is now called differently | 26 | 1 | 2 |
| The same, widened to methods the user calls | 124 | 12 | 9 |
| Add users whose own requirements or tests mention, by number, a public requirement of the provider that changed | 186 | 22 | 22 |
| Add users that import a test helper the change touched | 241 | 24 | 22 |
| Tell everyone, but only when a public requirement, or a test named for one, changed | 2,213 | 37 | 33 |
| Tell everyone, but only when a public requirement's wording changed or it was removed | 420 | 21 | 8 |
| **Tell a user only when something it names changed**: a name or method it uses, a table it imports, a test helper it imports, a requirement it mentions by number, or a word of the provider's that it writes out and the provider has dropped | **460** | **35** | **29** |
| The same, leaving out "a requirement it mentions became met" | 387 | 30 | 17 |
| The same as the bold rule, plus users whose own unmet requirement names the provider | 737 | 37 | 31 |
| Tell users whose own existing tests fail against the provider's change | could not be worked out by reading | | |

What the bold rule misses: five broken users. In three, what broke was a test of the user's own. Three of the five had work of their own at the time. Two (`signin-door`, `store-assembly`) had none and were found only because everyone was told.

What the rules need from jobs to be dependable (rules for writing, not checks): a module's requirement file says, by number, which of each provider's public requirements it relies on; a provider changes a public requirement's wording or its "not yet met" mark in the same change as the behaviour; a fix that changes what callers see is written on the public requirement and not only as a found flaw; a test's title names its requirement number in one standard form; a name is retired by removing it, never by leaving it with a new meaning.

## Two candidate definitions to put to him

1. **"Something this module holds was taken away or changed."** A user must be updated when its own files name something the change removed, renamed, called differently, changed the contents of, or reworded. A requirement that only became met is not a change; a user waiting for it has its own "not yet met" line, and that line makes its job run. On the record: 387 notifications; reaches 30 of the 40 broken. Unproven as a working process.
2. **"Anything this module names changed,"** including a requirement it mentions becoming met. On the record: 460 notifications; reaches 35 of the 40. Unproven as a working process.

Neither has been run. Both rest on a sorting that one reader made.

## Open questions

**For Bob's judgment (his to answer, in his words):**

1. Which matters to him: that no module is ever left wrong without being told, or that almost none is, at a sixth of the cost? On the record the cheapest rule that reached all 40 broken users sent 2,385 of 2,707.
2. When a provider's answer changes and a user simply hands it on, with no change to the user's own code, does he want that user told? That was most of the 241.
3. When a provider finishes something a user was waiting for, is the user's own "not yet met" line enough to bring its job, or does he want a notice as well?
4. A module that already has work gets a job anyway, and that job's module tests run against the provider as merged. Is that enough for such a module, so that a notice starts a job only for a module with no other work?
5. May a module's own existing tests be run because a module it uses changed, when the module has no job of its own? Two readings were written down and not decided. One: these are module tests, run for an informed reason, as his record says users' jobs "are updated as needed and tested". The other: it is a run his three tests do not list, and done everywhere it is the full regression the internal walk replaces. Only he can say.
6. Is he willing to have every job write, in its requirement file, the numbers of the provider requirements it relies on? The better rules depend on it.
