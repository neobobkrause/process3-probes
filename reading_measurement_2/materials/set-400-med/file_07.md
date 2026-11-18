# What a module's interface is, and the order-breaking uses among four modules

Written 13 Nov 2026. Read-only analysis of `origin/tranche` in `/home/user/neobobkrause/civicsmith-copy`, with the notice records at the tip of `origin/process-state`. Nothing was changed, fetched or checked out: every blob read was already in the local object store.

## Summary

**Part 1. The interface.**

- **A module exposes its services through named exports of `.mjs` files, usually one `index.mjs`.** 152 of the 220 modules have one. Users do not keep to it: 388 of 3,088 source imports between modules (13%) reach into an internal file, and 110 modules are reached that way.
- **Imports are not the only way one module depends on another.** 181 declared uses by modules that own code have no import behind them. The other routes are instances handed in at run time, service bindings, SQL on another module's tables, word keys, declared-op tables, generated files and served pages.
- **No rule that names exported names alone can be sound here.** Replayed on the old process's own records, a rule that notifies only the users importing a changed or removed name would have caught 13 of 104 users judged affected.
- **The only recognition with no false negatives on that record is the coarse one: any change to a module's source notifies every declared user.** The old process did this, and 90% of the notifications were needless.
- **"Which parts changed" can be stated mechanically and precisely in three vocabularies:** exported names with their before and after signatures, public requirement ids, and the provider's own tests keyed by the id in their titles. It cannot yet be used to excuse a user mechanically.
- **The old process left a replay set:** 178 notices, 2,707 notifications and 2,342 written verdicts with evidence. It can score any new rule, once each notice's change is re-read at its own commit.

**Part 2. The four modules.**

- **The loop is in the module map, not in the code.** File by file, the imports already run one way: `untested.mjs` → `ask.mjs` → `draft.mjs` → `index.mjs`. The size split of 4 Nov put the bottom and middle files in one module and the files between and above them in another.
- **agent-runner is in the wrong place by a decision already taken.** The planning fold of 27 Oct placed it after ai-gate ("it is ai-gate's container") and took off agent-worker's use of it. The map was never brought into line.
- **Recommended: put the map right.** Move agent-runner after ai-gate, drop agent-worker's use of it, and give agent-drafts' three files back to agent-worker. No source file, import or test changes.
- **Three things need the owner.** The requirement size cap that caused the split; whether a member's own Claude sign-in through the runner still exists; and, for hypotheses and steps, whether one refusal may change places with another.

## Method and limits

- The module map is `build/modules.json`: 220 modules in one list, each with `paths`, `tests`, `uses` and a layer. A file belongs to the module with the longest matching path.
- Every `.mjs` and `.js` file under a module's paths or tests was parsed for `import`, `export … from` and `import()` statements: 5,385 files, 10,771 import statements that cross a module boundary. The parser is a comment-aware scanner with regular expressions, not a JavaScript parser. Code built inside template strings (child-process scripts in tests) is not seen.
- "Entry file" means `index.mjs` at the root of a module's directory, or each listed file where a module is a list of loose files.
- The sample is 36 modules across the order. Most figures are also given for all 220, because the whole tree could be measured.
- The replay uses the code as it stands at the tip, not as it stood when each notice was raised. The verdicts are the judgments of the old process's triage workers, not ground truth.
- Scripts are in `/tmp/claude-0/-home-user/5fb00928-6c32-53d3-a000-4e1f643cb17f/scratchpad/ic/` (`graph.py`, `analyse.py`, `stats.py`, `reqmap.py`, `cites.py`, `nonimport.py`).

---

# Part 1. What exactly is a module's interface?

## 1a. How a module exposes its services

### Entry files

| Shape | Modules |
| --- | --- |
| One `index.mjs` | 152 |
| One loose file (for example `idspaces.mjs`) | 10 |
| Several loose files, each its own entry (test-support has 14, bundler 11, runtime-limits 5) | 21 |
| No entry file | 37 |

Of the 37 with no entry file, 29 own no code at all: 18 own only a requirement file (the size-cap splits such as `jurisdictions-b`), and 11 have empty `paths`. The other 8 have code but no `index.mjs` at the root, for example agent-harness (`harness.mjs`, `subsession.mjs`), agent-model, agent-runner and docprofile.

`ai-issuer` has empty `paths` in the map but 11 code files in `ai-issuer/`. In all, 52 code files belong to no module, and they hold 75 imports of modules.

### Imports through the entry, and deep imports

| Importing file | To the provider's entry | To another file of the provider (deep) | To the provider's test files |
| --- | --- | --- | --- |
| Source, all 220 modules | 2,700 | 388 (13%) | 0 |
| Tests, all 220 modules | 5,794 | 635 (10%) | 1,254 |
| Source, the 36 sampled providers | 1,494 | 247 (14%) | 0 |
| Tests, the 36 sampled providers | 3,438 | 386 (10%) | 491 |

- The 388 deep source imports reach 173 files of 110 provider modules, from 84 user modules.
- The largest group is record-grammar: 139 deep source imports of its inner files (`actors.mjs` 31, `sha256.mjs` 20, `frontmatter.mjs` 18, `types.mjs` 18).
- A second group is each module's `checks.mjs`, imported whole as a namespace by `answer-envelope/families.mjs`.
- Among the four modules: ai-gate imports `agent-worker/src/ops.mjs` and `agent-worker/src/ask.mjs`; control-plane's, plane's and store-assembly's tests import `agent-worker/src/ops.mjs`.
- The 1,254 imports of another module's test files are the "published fixtures" and helpers the job rules require (`build/situations/job.md`: "it uses the provider's published fixture"). They are part of the provider's interface in practice, and they live under its tests, not its source.

### Declared uses against imports

- **Every source import is declared.** None of the 3,088 source imports points to a module missing from the importer's `uses`.
- **Tests are not held to the map.** 202 test imports go to a module the importer does not declare.
- **81 test imports point to a later module.** Six belong to the three known pairs. The other 75 are spread over 38 further pairs, none declared. Examples: membership's tests import credentials, ai-accounts, instance-setup and admission; ai-use's tests import store-request, store-assembly and admission; op-grades-folds' tests import op-grades (30 statements).
- **Of 3,120 declared uses, 1,936 have a source import, 792 have only a test import, and 392 have no import at all.** 211 of the 392 belong to the 29 modules without code. The other 181 are couplings that do not pass through an import, or stale declarations.

### Couplings without an import

| Route | Example | Extent |
| --- | --- | --- |
| An instance handed in at run time | `hypotheses` takes a steps instance (`deps.steps` or `bindSteps`) and calls its `registerRivalSource` and `stepsOfRival`; the comment reads "`steps` handed in, never imported" | 158 distinct `register…`/`on…` methods on module classes; 313 call sites |
| A service binding between deployed Workers | `agent-worker/wrangler.jsonc` line 97 binds `RUNNER` to agent-runner's class `AgentRunner`; the plane binds `AGENT_WORKER`, and agent-worker binds `PLANE` back | 5 fleet bindings on the plane; agent-worker calls the plane (module 209) over the wire with no declared use |
| SQL on another module's tables | inquiry, actions, reevaluation, queue and retrieval query record-core's `bundles`; public-read queries publication's `published_cases` | about 226 module pairs (pattern match, some noise); 24 not declared |
| Constants copied and held equal by tests | `TRACE_HEADER = "x-civicsmith-trace"` is defined in 7 files of 7 modules; agent-worker's `NAMESPACES` is "a COPY, because a fleet member cannot import the plane" | not counted |
| Word keys and a generated table | every sentence is `localize(id, en, vars)`; a build step extracts the table `setup-words/rows.mjs` | 8,250 call sites |
| Declared-op tables read as data | store-assembly imports each module's `DECLARED_OPS` and registers it with op-grades; a changed weight changes the assembly | op-declarations declares 83 uses |
| The module order compiled into the product | `member-roster/order.mjs` is generated from `build/modules.json`; `MODULE_ORDER` fixes the order in which registered checks and listeners run in promotion, extraction, reading-pipeline, money, duties, capture-requests and membership | 7 consumers |
| A served page or route | journey-check tests the page interface-shell serves: "no import, it tests the served page" | not counted |
| A committed bundle | the installer's committed `newgroup.bundled.mjs` holds a copy of interface-assets | not counted |
| File paths read as text | tests that read another module's source, `wrangler.jsonc` or requirement file | 930 path references outside import statements; 349 module pairs, 158 not declared, 140 to a later module |

## 1b. The Public part, exported names and tests

**The requirement file.** All 220 modules have one, each with `## Public` (Purpose and Provides). Ids are written `**R<n>**` first on the line and are permanent. A requirement not yet met carries `*(not yet met: …)*` on its line. There are 7,077 live public ids.

**Public ids to exported names: no explicit mapping.**

- 28% of entry-file exports (1,742 of 6,245) are named in backticks anywhere in the module's Public part.
- 12 of 183 modules have every export named there.
- 18% of live public ids (1,248) name an exported name.
- The reason is the shape of the code. 104 modules export a class and a factory (`stepsOf(host)`), and the services are the class's methods: 2,896 public methods against 6,245 exported names. The requirement lines name methods and wire routes, not exports.

**Public ids to tests: a convention that mostly holds.**

- The job rules say "A test names a requirement id at the module's interface". 94% of test titles (23,025 of 24,433) name an id of their own module.
- 92% of live public ids (6,517) are named in at least one of the module's own test titles. 170 of 219 modules have every one named.
- Tests sit in one directory per module (`bio-plane/test/m/<module>/`, or `<worker>/test/`).
- File names are not the key. Of 3,639 test files, 2,420 are named by topic, 563 by tranche (`t45.test.mjs`), 391 by requirement id, 195 are `notice-<provider>-<pr>.test.mjs`, 29 by a ruling id, and 41 have no owner.
- Three modules (agent-steps, pdf-worker, pdf-pixels) and most of agent-worker do not use `test("R…")` titles. They run a check function inside one long file. agent-worker has 13 of its 52 live public ids in a test title.
- Job receipts in `process/metrics/*.jsonl` carry a second record: 1,220 rows `{req, file, name}` and 231 rows `{notice, file, name}`, in 274 receipts of 121 modules.

**Can "only the tests that relate to the changed parts" be selected mechanically?**

| Whose tests | Key | Works for | Limit |
| --- | --- | --- | --- |
| The provider's own | The public id in the test title (`node --test --test-name-pattern`) | 92% of public ids | Not agent-worker, agent-steps, pdf-worker; ids must be matched as whole words (R3 against R31) |
| A user's | The user test file imports the changed name | Named imports | Under-selects: a typical user test file reaches a provider through the user's own code. The median user test suite has 4.5% of its files importing any one provider name directly |
| A user's | The user test file is reachable from the provider | Everything | Selects nearly all tests: every test imports its module's `index.mjs`, which imports every provider |
| A user's | The user's test title or comment cites the provider's id (`` `run-rules` R29 ``) | 2,857 cited (provider, id) pairs in tests | A convention, not complete |

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

