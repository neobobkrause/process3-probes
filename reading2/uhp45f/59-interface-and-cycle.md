No signal the old tool recorded separates affected from not affected. The rate runs from 6% to 19% in every class.

### Can the records serve as a replay set?

**Yes, with one piece of work.**

- Each notice names the provider and the pull request. Each verdict names the user and gives evidence a person can check.
- To score a new rule properly, each of the 178 changes must be re-read at its own commit: the provider's source, requirement file and tests before and after. That is a bounded fetch of the changed files of 178 pull requests, not a walk of history. Receipts give the base commit of each job attempt.
- The replays above used the tip of the tree instead. They are indicative.
- Two cautions. "Affected" was an LLM worker's judgment, and 134 notifications have neither a triage row nor an answer. A rule's false-negative rate measured this way is a rate against the old triage, not against truth.

## 1f. The minimal precise definition this codebase can support today

**Interface of module M.** Four surfaces, each read mechanically from the repository:

1. **Names.** For every file of M that another module's source or tests import: the exported names; for a function its parameter list; for a class its public methods and their parameter lists; for exported data a hash of its value.
2. **Public requirements.** Every line under `## Public`, by id, with its met or unmet mark, in every requirement file that governs M's code.
3. **Interface tests.** M's own tests, by the public id in their titles.
4. **Published files that are not code.** The files in M's paths that other modules read: `wrangler.jsonc`, `fleet-member.json`, schemas.

**Interface change.** Any difference in the four surfaces between a job's base and its merge, or any other change to M's source, which is reported as "unattributed". The notice lists the changed names with before and after, the changed ids with the kind of change, and the ids whose tests changed.

**What must be true of every module for this to be sound, and how many are there already.**

| Condition | Sample (36) | All (220) |
| --- | --- | --- |
| It has one entry file | 24 | 152 |
| Other modules' source imports only its entry file | 12 | 74 |
| Other modules' source and tests import only its entry file | 4 | 38 |
| Every exported name is named in its Public part | 2 | 12 |
| Every live public id is named in one of its own test titles | 25 | 170 |
| As a user, every import it makes, tests included, is a declared use | 23 | 157 |
| As a user, it imports no later module, tests included | 27 | 194 |
| Every module that imports it declares the use | 20 | 166 |
| All of the above | 0 | 3 |

Three further conditions cannot be counted module by module, and none holds across the tree:

- **No dependency without an import or a declaration.** 181 declared uses have no import; SQL, bindings, word keys and handed-in instances are in section 1a.
- **Every code file has an owner.** 52 do not.
- **Every module with requirements owns the code that meets them.** 29 do not.

**The conditions that matter most are the ones about undeclared dependence.** Notification goes to declared users. A module that depends on a provider without declaring it is never told. The 38 undeclared test dependencies on later modules, and the couplings with no import, are where a false negative would come from.

### The sample

| Module | Pos | Entry | Declared users | Source imports: entry / deep | Test imports: entry / deep / test files | Exported names (named in Public) | Live public ids (in a test title) | Median share of users per imported name |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| setup-words | 1 | 2 files | 213 | 578 / 2 | 992 / 11 / 0 | 6 (5) | 18 (16) | 2% |
| record-grammar | 2 | index | 132 | 178 / 139 | 293 / 72 / 1 | 60 (60) | 60 (60) | 4% |
| jurisdictions | 3 | index | 61 | 47 / 0 | 124 / 0 / 9 | 72 (7) | 34 (34) | 7% |
| test-support | 7 | 14 files | 153 | 0 / 0 | 522 / 0 / 0 | 60 (15) | 28 (28) | 25% |
| runtime-limits | 8 | 5 files | 58 | 88 / 0 | 108 / 0 / 0 | 34 (27) | 41 (41) | 7% |
| signatures | 9 | 3 files | 29 | 28 / 0 | 78 / 0 / 0 | 50 (43) | 47 (47) | 7% |
| docprofile | 24 | none | 14 | 0 / 32 | 0 / 69 / 0 | 0 (0) | 22 (22) | 14% |
| pdf-worker | 35 | index | 4 | 0 / 0 | 3 / 0 / 3 | 2 (1) | 15 (0) | 25% |
| record-core | 43 | index | 116 | 114 / 1 | 217 / 2 / 20 | 19 (15) | 86 (86) | 4% |
| membership | 44 | index | 116 | 121 / 1 | 272 / 5 / 4 | 26 (16) | 49 (48) | 7% |
| ai-catalogue | 46 | index | 12 | 6 / 2 | 8 / 3 / 16 | 46 (13) | 47 (47) | 25% |
| promotion | 49 | 2 files | 63 | 54 / 4 | 102 / 1 / 24 | 29 (10) | 55 (55) | 6% |
| provenance | 52 | index | 73 | 44 / 4 | 79 / 24 / 46 | 42 (10) | 58 (58) | 7% |
| capture | 57 | index | 44 | 24 / 8 | 66 / 13 / 25 | 44 (4) | 33 (33) | 11% |
| extraction | 69 | 2 files | 39 | 30 / 4 | 70 / 15 / 28 | 67 (14) | 88 (87) | 13% |
| observation-log | 76 | index | 26 | 15 / 9 | 27 / 7 / 1 | 75 (5) | 31 (31) | 12% |
| inquiry | 95 | index | 38 | 33 / 0 | 43 / 3 / 26 | 71 (22) | 54 (54) | 11% |
| hypotheses | 96 | index | 9 | 3 / 1 | 18 / 1 / 7 | 40 (2) | 16 (16) | 22% |
| steps | 97 | index | 14 | 9 / 1 | 12 / 0 / 15 | 26 (2) | 24 (24) | 14% |
| run-rules | 103 | index | 20 | 24 / 2 | 71 / 3 / 0 | 124 (46) | 34 (34) | 15% |
| agent-harness | 104 | none | 8 | 0 / 12 | 0 / 36 / 0 | 0 (0) | 16 (16) | 25% |
| agent-model | 105 | none | 7 | 0 / 9 | 0 / 22 / 3 | 0 (0) | 48 (48) | 14% |
| ai-runs | 107 | index | 30 | 18 / 0 | 43 / 0 / 25 | 10 (5) | 68 (67) | 3% |
| answers | 113 | index | 19 | 7 / 8 | 25 / 12 / 7 | 49 (5) | 31 (31) | 11% |
| agent-steps | 114 | index | 3 | 4 / 1 | 5 / 0 / 15 | 26 (12) | 53 (0) | 33% |
| agent-runner | 115 | none | 1 | 0 / 0 | 0 / 0 / 0 | 0 (0) | 32 (32) | |
| agent-drafts | 116 | 3 files | 1 | 2 / 0 | 5 / 0 / 0 | 22 (0) | 7 (5) | 100% |
| agent-worker | 117 | index | 7 | 0 / 4 | 5 / 8 / 2 | 4 (1) | 52 (13) | 43% |
| ai-gate | 118 | index | 5 | 1 / 0 | 2 / 0 / 0 | 130 (49) | 67 (67) | 20% |
| publication | 126 | 2 files | 27 | 20 / 2 | 33 / 8 / 14 | 72 (4) | 41 (41) | 15% |
| actions | 146 | index | 19 | 14 / 0 | 31 / 0 / 11 | 36 (7) | 78 (77) | 11% |
| monitoring | 155 | index | 12 | 8 / 1 | 12 / 2 / 9 | 64 (2) | 58 (57) | 25% |
| op-declarations | 176 | index | 21 | 14 / 0 | 117 / 6 / 1 | 111 (15) | 47 (47) | 14% |
| store-assembly | 183 | index | 3 | 3 / 0 | 3 / 59 / 10 | 11 (11) | 66 (66) | 100% |
| interface-shell | 186 | index | 18 | 4 / 0 | 50 / 0 / 152 | 46 (7) | 75 (75) | 17% |
| control-plane | 205 | index | 4 | 3 / 0 | 2 / 4 / 17 | 18 (3) | 95 (93) | 50% |

Notes on the table. "Test files" counts imports of the provider's own test helpers and fixtures. Zero ids in a test title for pdf-worker and agent-steps reflects their test style, not missing tests. ai-gate's count omits ai-issuer, whose files have no owner in the map and which imports three of ai-gate's inner files.

---

# Part 2. agent-runner (115), agent-drafts (116), agent-worker (117), ai-gate (118)

## 2a. What each module is for, and what it takes from the others

**agent-runner** is the container in which a gate run happens, and the small Worker that hosts it.

- Someone gives it a declared AI provider, model and plan, a key, the tiers and parts to run, and a spending ceiling.
- It asks the issuer for a challenge, runs ai-gate's public test items against the provider through one outbound door, keeps within the ceiling, scrubs and scans for secrets, seals and signs the results, shows a manifest for approval and hands over the bundle.
- Its routes are `GET /version`, `POST /run`, `GET /run/status`, `GET /run/manifest`, `POST /run/approve`, `GET /run/bundle` and `POST /run/discard`.
- Until T53 it was something else: the container that ran Claude Code on a member's own Claude sign-in. Those requirements (R1 to R4, R17 to R24) are retired in its file.

**agent-drafts** is the handler of one route of the agent Worker, `POST /draft`.

- It makes labelled machine drafts: writing help, a group description, interface words translated, a passage translated for reading, and the action drafts (text check, infraction, bearing, status report). It stores nothing.
- It is three files inside `agent-worker/src/`: `draft.mjs`, `action-drafts.mjs` and `untested.mjs`. It was split from agent-worker on 4 Nov because agent-worker's requirement file passed the 70,000-byte cap.

**agent-worker** is the fleet Worker that does AI work for the plane.

- `/run` walks the fixed control-flow table of an AI run and calls the plane back under the run's credential. `/ask` answers a member's question from the record under a read-only grant and returns only what the plane's checks pass. `/draft` hands the request to agent-drafts. `/transcribe` turns page pictures into text. `/signin` relays a member's own Claude sign-in to a runner. `/version` and `/health` report.
- It also holds the tables of what the agent may call on the plane (`ops.mjs`).

**ai-gate** is the library that decides, with evidence, whether an AI at a host can do the product's work, part by part.

- It holds the signed item bank, the planner, the scorer, the thresholds and verdicts, the cost estimate and meter, the canaries, the bundle format with its sealing, signing and verification, and its words.
- It runs each item through agent-model against an in-memory stub of the plane. It holds no network client.

### Every import among them

| From | To | Names | What they do |
| --- | --- | --- | --- |
| agent-runner `src/run.mjs` | ai-gate `src/index.mjs` | `checkDeclared`, `PARTS` | Check the run request |
| | | `PUBLIC_BANK`, `hasPrivate`, `itemById`, `selectItems`, `suiteVersions` | The item bank and what is drawn from it |
| | | `verifyChallenge`, `runPublicLine` | The issuer's challenge and the run's key |
| | | `planRun`, `meter` | Plan the calls and hold the ceiling |
| | | `scoreAnswerFree` | Score an answer without the expected answers |
| | | `scanForSecrets`, `buildManifest`, `sealPayload`, `signBundle`, `encodeBundle` | Scan, seal, sign and pack the bundle |
| agent-runner tests | ai-gate `src/index.mjs` | `openSealed`, `parseBundle`, `verifyBundle`, `sha256Hex`, `verifyChallenge`, `PUBLIC_BANK` | Open and verify what the runner produced |
| agent-drafts `draft.mjs` | agent-worker `ask.mjs` | `admitRead`, `readTool`, `ASK_DECLARED` | The check on which reads are allowed, the read tool, the declared bounds |
| agent-drafts `draft.mjs` | agent-worker `signin.mjs` | `doorTrace` | Read the two trace headers of a request |
| agent-drafts tests | agent-worker `src/index.mjs`, `test/account.mjs`, `test/remote.mjs` | the Worker itself, `MEMBER`, `remoteBindings` | Drive `/draft` through the whole Worker |
| agent-worker `index.mjs` | agent-drafts `draft.mjs` | `handleDraft` | Route `POST /draft` |
| agent-worker `ask.mjs` | agent-drafts `untested.mjs` | `untestedOf`, `UNTESTED_BAD` | The test-instance label and its refusal |
| agent-worker tests | agent-drafts' three files | `machineLabel`, `untestedOf`, `DRAFT_OPS`, `READ_TEXT_MAX`, `ACTION_DRAFT_OPS`, `READS_AS`, `AUDIENCES`, `BEARINGS`, `TEXTCHECK_TEXT_MAX` | Pin the draft tables and labels |
| ai-gate `src/run.mjs` | agent-worker `ops.mjs` | `PLANE_OPS` | The table of ops a run may call, and which write |
| ai-gate `src/run.mjs` | agent-worker `ask.mjs` | `admitRead`, `readTool` | The same read check and read tool production uses |
| ai-gate tests | agent-worker `ops.mjs`, `ask.mjs` | `ASK_OPS`, `PLANE_OPS`, `readTool` | Pin the stub plane to the tables |

Three couplings have no import:

- **agent-worker to agent-runner.** `agent-worker/wrangler.jsonc` binds `RUNNER` to agent-runner's class `AgentRunner`. `remote.mjs` reads the binding, and `signin.mjs` relays to `/signin`, `/signin/code`, `/signin/state` and `/signout`.
- **agent-runner to agent-worker.** `agent-runner/fleet-member.json` names agent-worker under `bind`, and `agent-runner/test/worker.test.mjs` reads `agent-worker/wrangler.jsonc`.
- **agent-runner to agent-worker, through ai-gate.** ai-gate's `index.mjs` re-exports its `run.mjs`, which imports agent-worker's `ask.mjs`. The runner's image build bundles ai-gate "and the plane modules it reads", so the ask handler's file and what it imports travel into the image's build.
