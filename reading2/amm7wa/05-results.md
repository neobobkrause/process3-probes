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


At Uller the clerk wrote down 2 cod.

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

