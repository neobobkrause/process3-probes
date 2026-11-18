# [file] audit_C.md (continued)

| 13 | Commission the session that builds the kit; merge the clean-up pull request | Run 0 steps 2 and 4; lever P1 | **New** |
| 14 | Set rulesets, environments and secrets from the setup list; create `dev` and `production` | Run 0 step 5; G10 | Accepted (onboarding settings) |
| 15 | Open a separate Cloudflare account for development and scope its token | F3 | Accepted in kind (Cloudflare settings at onboarding); a new instance, and his approvals named "the product's own account" |
| 16 | Set the cloud environment's setup script and the auto-memory variable, and change the script when the toolchain changes | C7, C8 | Accepted at onboarding; **new recurrence**, since the product's own script used to do it |
| 17 | Change a budget number before merging over a cap | M1, N1 | **New.** A file change in the process repository |
| 18 | Repair the gate during run 1 | Run 1: "Your own repairs to the gate ... are expected in a first run" | **New** |
| 19 | Write to GitHub Support about the 6 Nov suspension | G12 | **New**, once |
| 20 | Move to a GitHub organization if more than 5% of merges break the integration branch | G6 | **New**, once, conditional |
| 21 | Decide on type-checking and lint at the first retrospective | Lever P5 | His by role (engineering standards) |
| 22 | Approve a public release in `production`; ask for his approval on a close | G10, G11 | Accepted |

The proposal's own list has five standing acts. It leaves out numbers 2, 6, 9, 10, 11, 16 and 17, each of which recurs. Fourteen of the 22 are new in kind (1 to 6, 9 to 11, 13, 17 to 20); two of those are one-off (19, 20). Of the fourteen, only numbers 6 and 20 are changes to GitHub or Cloudflare settings.


# [file] no_layers_width.md (later part)

## A. The cycle

Positions are 1-based places in the total order. All six modules are in layer 6.

| Module | Position | Paths |
| --- | --- | --- |
| hypotheses | 96 | `bio-plane/src/hypotheses/` |
| steps | 97 | `bio-plane/src/steps/` |
| agent-runner | 115 | `agent-runner/` |
| agent-drafts | 116 | three files inside `agent-worker/src/`: `draft.mjs`, `action-drafts.mjs`, `untested.mjs` |
| agent-worker | 117 | `agent-worker/` |
| ai-gate | 118 | `ai-gate/src/` |

**Every declared use among the four.**

| Edge | Direction | What is behind it |
| --- | --- | --- |
| agent-runner (115) uses ai-gate (118) | **Later** | `agent-runner/src/run.mjs` lines 7 to 10 import seventeen names from `ai-gate/src/index.mjs` |
| agent-drafts (116) uses agent-worker (117) | **Later** | `agent-worker/src/draft.mjs` line 42 imports from `./ask.mjs` and line 46 from `./signin.mjs`, both agent-worker's files |
| agent-worker (117) uses agent-drafts (116) | Earlier | `agent-worker/src/index.mjs` line 155 imports `handleDraft` from `./draft.mjs`; `ask.mjs` line 47 imports `untestedOf`, `UNTESTED_BAD` from `./untested.mjs` |
| agent-worker (117) uses agent-runner (115) | Earlier | No source import. A cross-script Durable Object binding, `RUNNER`, to agent-runner's class `AgentRunner` (`agent-worker/src/remote.mjs`) |
| ai-gate (118) uses agent-worker (117) | Earlier | `ai-gate/src/run.mjs` line 16 imports `PLANE_OPS` from `agent-worker/src/ops.mjs`; line 17 imports `admitRead`, `readTool` from `agent-worker/src/ask.mjs` |

There are two loops. agent-drafts and agent-worker use each other. agent-runner uses ai-gate, which uses agent-worker, which uses agent-runner. Together all four reach each other.

**The two later-pointing edges.**

1. **agent-runner takes the gate's whole toolkit from ai-gate.** The names are `checkDeclared`, `selectItems`, `verifyChallenge`, `meter`, `scanForSecrets`, `buildManifest`, `sealPayload`, `signBundle`, `PUBLIC_BANK`, `hasPrivate`, `itemById`, `planRun`, `scoreAnswerFree`, `suiteVersions`, `runPublicLine`, `encodeBundle`, `PARTS`. In plain words: the runner's gate run picks the test items, checks the issuer's challenge, meters the run, scans for secrets, and seals and signs the bundle, all with ai-gate's functions. Its tests also import `openSealed`, `parseBundle`, `verifyBundle` and `sha256Hex`.
   - Introduced by PR 401, `bob/agentrunner-uses`, merged 5 Nov 03:50Z (4 Nov 19:50 PST), commit `75c7705dfd`. Subject of the change: "modules: agent-runner uses ai-gate and ai-catalogue (its run.mjs imports them; coordinator ruling 3, ai-gate in its own directory)". Merge note: "No review: plain modules ... (imports gate on PR 394)".
   - It did not close a loop on that day, because PR 375 (`bob/aw-drop-runner`) had removed "agent-worker uses agent-runner" 77 minutes earlier. PR 612, `bob/agent-worker-uses-runner`, restored that use on 6 Nov 02:07Z, commit `0df62bf17b`: "agent-worker uses agent-runner (its F2 test imports agent-runner/test/helpers.mjs per the coordinator's 5 Nov 20:18 F2 ruling); unblocks PR 569". That closed the three-module loop. No such test import is in `agent-worker/test` at the tip.
2. **agent-drafts takes the worker's read controls and sign-in trace from agent-worker.** The names are `admitRead`, `readTool` and `ASK_DECLARED` from `ask.mjs`, and `doorTrace` from `signin.mjs`. In plain words: the drafting code uses the worker's check on which reads are allowed, its read tool, its declared limits on an ask, and the headers that trace a member's sign-in.
   - agent-drafts was split out of agent-worker by PR 113, `bob/split-agent-drafts`, on 4 Nov 04:04Z. The map's status line says it was split "by copy (no from) for size", which is the requirements size cap. From that moment agent-worker used agent-drafts.
   - The reverse use was added by PR 371, `bob/agentdrafts-uses`, merged 5 Nov 01:46Z (4 Nov 17:46 PST), commit `93c817d1a7`. Subject: "modules: agent-drafts uses agent-worker (its files import their agent-worker siblings; the imports check reads this file)". Merge note: "No review: modules file only". This was the first later-pointing edge in the map.

**hypotheses (96) uses steps (97).** Later-pointing, and not a loop: steps declares no use of hypotheses. There is no source import. `bio-plane/src/hypotheses/index.mjs` is handed a steps instance (`deps.steps` or `bindSteps`), with the comment "`steps` handed in, never imported", and calls its `registerRivalSource` and `stepsOfRival`. In plain words: hypotheses registers itself with steps so that a step can be opened from a rival explanation and the rival can list what its steps produced. One test, `bio-plane/test/m/hypotheses/rivals-legs.test.mjs` line 9, imports `stepsOf` from steps. Introduced by PR 1032, `bob/hypotheses-uses-steps`, merged 8 Nov 12:36Z, commit `e1bac7eda3`: "BOB: completion round 2 gains hypotheses uses steps (steps R31)". "No review".

**What the history shows about the check.**

- Both loop-making edges were declared because the imports check demanded that the map match the code. Nothing compared the new use with the modules' positions.
- The map had four later-pointing uses for three hours on 5 Nov (after PR 474, `bob/cap-splits-1`). PR 503, `bob/modules-layer-order-2`, brought it back to two. So order was repaired by hand once, and these two were left.
- The first Process3 snapshot of the map (3 Nov) had none.

Method: `git log -S` was not cheap on this clone (it fetched each historical blob and set off git's automatic repacking), so it was stopped. The dates come from reading `build/modules.json` at each of the 40 first-parent commits that changed it from 3 to 8 Nov.

## B. Public and private marks

**How the files separate the parts.** Every one of the 65 files has a `## Public` heading (with `### Purpose` and `### Provides`), and 60 have a `## Private` heading (with `### Uses`, `### Invariants`, and often `### Satisfies` and `### Suggestions`). 18 also have `## Open for Bob`, and a few have other trailing sections. A mark was assigned to the `##` section it sits under. This split is reliable: it is by heading, not by judgment.

| Section | Unmet marks |
| --- | --- |
| Public | 392 (352 under `### Provides`) |
| Private | 50 (31 under Suggestions, 16 under Invariants) |
| Open for Bob | 16 |
| Other trailing sections ("Decided by BOB", "Old ids", "Later requirements") | 8 |
| Total | 466 |

| Modules | Count |
| --- | --- |
| With work | 65 |
| With at least one unmet Public mark | 44 |
| With no unmet Public mark | 21 |
| Of those 21, with Private marks only | 11 |
| Of those 21, with marks in "Open for Bob" or another trailing section | 10 |
| With both Public and Private marks | 9 |

The 21 with no public mark: bundler, file-scanner, ai-catalogue, ai-accounts, credentials, member-upload, events, inquiry, run-rules, ai-gate, investigation, case-grammar, public-read, ratification, case-inputs, scheduler, machinery-producers, queue, admission, signin-door, store-request. They hold 47 marks; store-request has 15 of them.

**Readiness under the public-marks rule.** A module with work is ready when no module upstream of it, transitively, has an unmet Public mark and is unfinished. The three order-breaking uses are removed. Jobs are of equal length.

| | Strict (PD-25) | Public-marks rule | Public rule, counting "Open for Bob" and other trailing marks as public |
| --- | --- | --- | --- |
| Waves | 21 | **12** | 15 |
| Wave sizes | 3, 2, 2, 4, 4, 2, 3, 3, 2, 4, 2, 3, 4, 5, 2, 2, 1, 6, 7, 3, 1 | 5, 6, 6, 6, 4, 5, 6, 4, 11, 8, 3, 1 | 5, 6, 5, 2, 5, 2, 4, 4, 4, 5, 3, 9, 7, 3, 1 |
| Ready at once: median, mean, max | 3, 3.1, 7 | **5.5, 5.4, 11** | 4, 4.3, 9 |
| Upstream modules holding a module back: median, max | 25, 52 | 12, 32 | 17, 41 |

With the three uses kept, 27 modules still never start under any of the three rules, because agent-runner and agent-worker have public marks.

**Eight slots with continuous refill.** With equal job lengths, every job ends at the same moment, so refilling a slot the moment a job ends is the same as running in rounds. Staggering only appears when job lengths differ; a second row gives that case.

| 8 slots | Strict (PD-25) | Public-marks rule |
| --- | --- | --- |
| Elapsed, job-units, equal lengths | **21** | **13** (12 if the longest chain is started first) |
| Average slots in use | **3.1 of 8** | **5.0 of 8** (5.4) |
| Share of time all 8 are full | 0% | 15%: 2 of 13 rounds |
| At a bound of 6: elapsed, average | 22, 3.0 | 13, 5.0 |
| At a bound of 12 or more: elapsed, average | 21, 3.1 | 12, 5.4 |
| Job length taken as the module's mark count (466 mark-units in all; 58 would be perfect packing): elapsed, average in use | 188, 2.5 | 162, 2.9 |

- The public-marks rule shortens the remaining work by about 40% in job-units and uses about five slots. It does not use eight.
- When job length follows the number of marks, the gain is much smaller (188 to 162), because the long jobs sit on one chain: the screens modules in layer 11 hold 356 of the 466 marks, nearly all of them public, and they depend on each other.
- The rule helps where a module's remaining work is private. Only 21 modules are like that, and they are the small ones.

**What filling 8 slots would cost.** Under the loose rule of section 3 with N = 8 (9 batches), 37 of the 65 modules run beside an upstream module that has work. 29 run beside an upstream module that has an unmet Public mark, and 20 of those beside a direct one. Those 29 are the jobs under which, by the candidate rule's own premise, an interface can change.

**One thing the premise does not settle.** A public mark says a published requirement is not yet met. The requirement's text is already there for users to read, so meeting it changes behaviour and not necessarily the stated interface. How often meeting a public mark also changes the text its users rely on was not measured here.

## Limits of the follow-up

- Equal job lengths, as before. The mark-count row is a sensitivity run, not a forecast.
- "Open for Bob" marks were kept out of the public count in the main column; the third column shows the effect of counting them in.
