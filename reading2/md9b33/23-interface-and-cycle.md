## 1c. Candidate definitions of "the interface changed"

Each is judged against the old process's record (section 1e). That record holds 2,342 verdicts on a (change, user) pair: 241 "affected", 2,101 "not affected".

### (i) The set and shape of the entry file's exported names changed

- **Catches** added and removed names and changed parameter lists. Example: `actions:715` recorded `actionOverdue(fm, nowMs, place = null)` becoming `actionOverdue(fm, nowMs, place = null, layers = null)`. The old tool also descended into classes (`Actions.zoneRead`, `Membership.isAdministrator`).
- **Misses a changed value under an unchanged name.** `op-declarations:289` extended `REAUTH_ACTS`, and admission's default changed. `ai-accounts:483`, `local-facts:429` and `mail-door:428` changed weights inside `DECLARED_OPS`. `member-roster:286` and `:446` grew `MODULE_IDS`, which changed the order membership runs listeners in.
- **Misses a changed answer under an unchanged signature.** `action-grammar:396`: `governingLawsOf(fm)` entries "now carry layer". `content:440`: `cellsAt` "now answers cells:null reason removed". `basis-versions:177`: grades "now capped".
- **Misses the 13% of imports that go to inner files,** unless every imported file is treated as an entry.
- **Misses every coupling of section 1a that has no import.** `interface-shell:310` affected journey-check through the served page. `interface-assets:443` affected the installer through a committed bundle. `agent-worker:569` affected signin-door through a binding in `wrangler.jsonc`.
- **False positives:** names only added. 50 of the 71 notices with an export record were additions only. An added name cannot break an importer, with one exception found in the record: agent-worker's test "calls every function agent-harness exports and fails on any uncalled one".
- **Replay.** On the 71 notices with an export record, the rule "notify the users that import a changed or removed name" notifies 55 pairs, catches 13 of 104 affected and misses 91. Most misses are a method called on a handed-in instance, which no import analysis can attribute.

### (ii) Any file reachable from the entry file's exports changed

- In the sample, 98% of source lines are reachable from an entry or an imported file (112,794 of 114,598). Modules are a few large files: `ai-runs/index.mjs` has 4,841 lines.
- So this is "any source file of the module changed". It is what the old process did: a notice was raised when a merged pull request "changed a file of the module's source".
- **Catches** every change that travels by import, including behaviour with no signature change.
- **Misses** changes outside source: a provider's fixtures under its tests (1,254 imports), and couplings with no import where the user is not a declared user.
- **False positives: about 90%.** 2,101 of 2,342 verdicts were "not affected". 67 of the 167 notices that were triaged had no affected user at all.

### (iii) The Public part of the requirement file changed, by id

- **Catches** a stated change of service: an amended line, a new id, a retired id. It also catches a requirement becoming met, because the `*(not yet met: …)*` mark is struck from the id's own line. 392 unmet marks stand in Public parts today, each a future change of this kind.
- **Misses** a change of behaviour that leaves the text alone: a bug fix, or a change in the Private part with an outward effect. 73 of the 178 notices carried ids. The 105 without ids still drew 117 "affected" verdicts out of 1,338 (8.7%), against 124 of 1,004 (12.4%) for those with ids.
- **False positives:** wording edits and moves. `agent-worker:97` lists seven ids, all of them lines moved to agent-drafts with no change of behaviour.
- **One complication.** 18 modules hold requirements split off another module's file for size. The Public part that governs `jurisdictions`' code is in three files.

### (iv) The provider's interface-level tests changed

- By the job rules every module test is at the module's interface and names an id, and a code change needs "a test of your own for the change, failing with it reverted". Where that rule is enforced, every behaviour change comes with a changed or added test.
- **Catches** bug fixes and behaviour changes that (i) and (iii) miss, and names the public id through the test title.
- **Misses** a behaviour change made with no test change, which the revert check exists to refuse.
- **False positives:** coverage added with no change of behaviour; the 195 `notice-*` tests, which record a user's answer to someone else's change; tests that pin requirement ids.
- **Not measured.** The old notices did not record test changes. Measuring this needs each pull request's diff.

### (v) The job declares it

- **Catches** what the job knows it changed, including couplings no tool sees (a wire shape, a table column).
- **Misses** what the job does not notice. It cannot be verified.
- It is safe only as an addition: a declaration may add a part, never remove one.

### Which combination gives no false negatives

**The union of all five, with (ii) as the floor.**

1. Raise a change whenever any of these differs between the job's base and its merge: a source file of the module, a file under its tests that another module imports, a Public line of any requirement file that governs its code, or a non-source file in its paths that another module reads (`wrangler.jsonc`, `fleet-member.json`).
2. Name the parts from (i), (iii), (iv) and (v): names with before and after signatures, class members, a value hash for exported data; public ids edited, added, retired or newly met; public ids whose tests changed; anything the job adds.
3. When step 1 fires and step 2 names nothing, send the change as "unattributed". On the record, 65 of 178 notices had neither ids nor an export difference, and they carried 63 of the 241 affected verdicts (26%). Test changes were not recorded then, so the true unattributed share under this rule would be lower.
4. Notify every declared user, and every module whose tests import the provider.

**How many false positives.** As many as the old process: about nine notifications in ten reach a user that is not affected. Naming the parts does not reduce the number of notifications. It reduces what each notified job must read.

**Could the parts excuse a user mechanically?** Not soundly today.

| Rule, replayed on all 2,342 verdicts | Notified | Affected caught | Affected missed | Needless |
| --- | --- | --- | --- | --- |
| Notify all (the old process) | 2,342 | 241 | 0 | 2,101 |
| Users importing a changed or removed name | 55 | 13 | 228 | 42 |
| Users citing a changed public id in their requirement file, source or tests | 195 | 104 | 137 | 91 |
| Either of the two | 237 | 112 | 129 | 125 |
| Citing users when the notice has ids, all users when it has none | 1,533 | 221 | 20 | 1,312 |

- The citation figures are an upper bound. They read the tip of the tree, where many citations were written in answer to the notice itself. Counting only citations in requirement files, the rule catches 44 of the 124 affected in notices that have ids.
- So a notified job still has to judge. The parts tell it where to look.

**Where behaviour change is invisible, and what could show it.**

| Invisible to a signature check | What in the repository shows it |
| --- | --- |
| A changed answer or refusal under the same signature | The public id's line or its mark (iii); the provider's test for that id (iv) |
| A changed value of an exported table | A hash of the evaluated export, taken by importing the module in Node |
| A changed method of a class | The class-member comparison the old tool already made |
| A changed wire route or page | `fleet-member.json` `surface`, which lists each route against its ids; the public id |
| A changed table or column | `schema.mjs` and `declaredTables`, as data |
| A fix with no requirement change | Only the provider's test (iv) or the job's declaration (v) |

## 1d. Precision available per user

**For a changed exported name, the importing users can be listed mechanically.** The imports are static and named. Three exceptions must be treated as "imports everything": 163 namespace imports whose members cannot be traced, 76 dynamic imports in tests with no destructuring, and any instance passed on to other code.

**How much it narrows.**

- For the sampled providers, the median imported name is imported by **14%** of the provider's declared users. That is the median over providers of each provider's median.
- For the most used providers it is far lower: setup-words 2%, record-grammar 4%, record-core 4%, ai-runs 3%, membership 7%. The exception is test-support at 25%.
- Over all 144 providers with five or more declared users, the median is 18%. A quarter of names are imported by a tenth of users or fewer.
- 51% of exported names (3,855 of 7,539) have no importer outside their own module. A change to one of them concerns no user.

**Where the narrowing fails.** The names with the most importers are factories: `membershipOf` is imported by 100 of membership's 116 users, `recordOf` by 110 of record-core's 116. A change to a method of the `Membership` class maps to everyone who holds the instance. The replay in 1c shows the result: name-level listing misses most affected users.

## 1e. Evidence from the old process's records

### What exists

| Where | What | Count |
| --- | --- | --- |
| `origin/process-state`, `notices/<provider>-<pr>.json` | One notice per recognised change | 178 |
| `origin/process-state`, `notices/triage/<user>-<provider>-<pr>.json` | A verdict, or a row saying a verdict is owed | 3,125 (2,342 verdicts, 783 owed) |
| `origin/process-state`, `notices/answered/…` | How each notification was closed | 2,542 (2,101 by triage, 209 by "layer land", 232 by a pull request) |
| `origin/process-state`, `notices/withdrawn/…` | Notices taken back | 6 |
| `origin/tranche`, `process/metrics/<module>.jsonl` | Job starts, receipts, merges | 1,885 rows: 688 starts (287 list the notices handed to the job), 688 receipts, 279 merges |
| `origin/tranche`, test trees | `notice-*.test.mjs` | 195 files |
| `origin/tranche`, `process/ledger/<module>.json` | One job record per module | 220 |

The notices are not in the tranche tree. They are 5,851 small files (2.06 MB) at the tip of the state branch.

### How a change was recognised

- **When:** at the merge of a pull request, if it changed a file of the provider's source. Two notices were withdrawn because the pull request "changed no file of membership's source".
- **Who was told:** every module whose source imports the provider. An owed row gives the reason as "`bio-plane/src/money/index.mjs` imports local-facts". All 2,707 notified modules are declared users at the tip.
- **What a notice held:** `provider`, `pr`, `users`, `source` (the number of source files changed, median 1), and `ids` (requirement ids, present on 73).
- **From 4 Nov 05:21Z a notice could also hold `exports`:** `removed`, `added`, and `changed` with each name's `before` and `after` signature, including class members. 71 notices have it: 21 with a changed or removed name, 50 with additions only.
- **What a verdict held:** `verdict`, `evidence` (a file and line in the user and one sentence, median 188 characters), `worker`, `cost`.

### What the records show

| | Count |
| --- | --- |
| Notices | 178, from 95 provider modules |
| Notifications | 2,707 (median 11 per notice; largest 108, `membership:77`) |
| Verdicts | 2,342: 2,101 "not affected" (89.7%), 241 "affected" |
| Triaged notices with no affected user | 67 of 167 |
| Triage cost recorded | $565 over 1,914 verdicts, median $0.20 |

| Kind of notice | Notices | Verdicts | Affected | Rate |
| --- | --- | --- | --- | --- |
| Signature changed or name removed, with ids | 9 | 139 | 26 | 18.7% |
| Signature changed or name removed, no ids | 12 | 196 | 28 | 14.3% |
| Names added only, with ids | 22 | 230 | 24 | 10.4% |
| Names added only, no ids | 28 | 423 | 26 | 6.1% |
| No export record, with ids | 42 | 635 | 74 | 11.7% |
| No export record, no ids | 65 | 719 | 63 | 8.8% |

