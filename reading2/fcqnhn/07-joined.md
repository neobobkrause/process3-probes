# [file] no_layers_width.md (continued)

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
- The pickaxe search that was stopped fetched some historical objects into the clone and triggered git's automatic repacking. No working-tree or sparse setting was changed.


# [file] levers_github_cloudflare_product.md (later part)

| 6 | **Wake-ups and sweep** | `sweep` 495, `triggers`, `roles` | Pull-request event subscriptions wake the session that owns the work (Claude side). `workflow_run` and `schedule` on `main` for anything periodic. Cloudflare Issues automations for product failures. | About 15 lines of YAML | Owner (`main` is owner-only) |
| 7 | **Heartbeat and watchdog** | Heartbeat file on the state branch, watcher role, idle alarm | Scheduled workflow on `main` that exits non-zero when ready work is not moving; GitHub notifies the owner of the failed run | Same 15 lines | Owner |
| 8 | **Pacing** (usage ledger, push ceiling, hooks, hourly audit; 3,523 lines deleted) | `pace` 131 remaining | No state branch; one push per turn; queue batches merges. GitHub's own published numbers as plain guidance: 6 pushes a minute per repository, 1 merge a minute, 500 content creations an hour. | 0 | Nothing to change |
| 9 | **Deploy (development)** | `deploy` 573, `deploycfg`, `walkcfg` | Actions job on `push` to the integration branch in environment `dev`, holding a development-only Cloudflare token; or Worker Previews; the walk as its last step | A workflow file calling the product's existing deploy and walk scripts | Workflow: owner via CODEOWNERS. Token scope and Access: owner in Cloudflare |
| 10 | **Release approval** | `release` 255, `process-dev-release.yml` | GitHub environment `production` with the owner as required reviewer, restricted to `main` and release tags; tag ruleset; "require deployments to succeed" on `main`; or Workers Builds from `main` | 0 | Owner |
| 11 | **State and ledger** (state branch, addresses, ledger entries, triage register, notices) | `state` 692, `ledger` 196, `triage`, `notice`, `register`, `found` | Pull request (branch, draft, labels, body), check runs, issues, Deployments. Module marks stay in the product's files. | 0 | Nothing to change; labels are session-writable by design |
| 12 | **Approvals-integrity check** (owner's website commit, fingerprint in every prompt; caused the final standstill) | `anchor`, parts of `record`, `setup`, `start` | CODEOWNERS on `CLAUDE.md` and `.claude/**` with required code-owner review on protected branches; sessions always start from the protected tip. No fingerprint, so an owner edit stops nothing. | 0 | Owner |
| 13a | **Receipt comparison** (17 reds, no catch in 1,187 runs) | Removed 9 Nov | Delete. The check run's own log and summary are the receipt. | 0 | — |
| 13b | **Revert check** (new tests must fail with the change reverted; 10 of 20 "false done" findings were false) | `testdiff` 235, `review` | No native equivalent. Either drop it, or keep the narrower trigger that earned its place: flag deleted or weakened tests. Report as a warning annotation and a review request to the owner, never as a block. | 0, or about 20 lines of `git diff --diff-filter` in the reusable gate | Owner (process repository) |
