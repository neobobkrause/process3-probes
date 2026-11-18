# [file] DECISIONS.md (continued)

Decision, four cuts (C57):
1. The receipt is gone, end to end (Bob, 9 Nov, first: "It doesn't sound necessary."; then: "get rid of it completely."). `job complete` posts no receipt and takes no `--test`, `--not-verified` or `--exempt-revert` (ignored if given); the complete row records the attempt, the session and the tool. The gate compares nothing with a receipt and never runs a records-only head's suite to check one; CI's own run is the truth. merge needs a verified green gate row on the tip and takes the attempt from the job's last complete row. A layer retest carries nothing. The gate row records the job's `attempt` from its complete row, so the false-done count costs nothing: a red suite or revert check on that attempt's run (rows before this read `receipt_attempt`). A refactor's revert exemption is the reviewed one (`revert exempt`), as before.
2. process3's own CI runs the tool tests once, on Node 22 (the shims' default for a product's runners, `cfg.node // "22"`), across the runner's cores (`--test-concurrency`), then the record check, which guards the approvals block. Its own pull request (build/c57-ci), merged by Bob, since the merge tool holds a workflow change for his word.
3. The security-path review trigger is cut, with its config key `review_triggers.security_paths` (no paths configured since 5 Nov; useful 0 of 4 times), and the trial's measures: the report line (`triggerSummary`) and the re-judge of triggers at the land. The `test` trigger stays as it is.
4. The setup check runs once per pin: job start keeps a passing check in the clone's git directory, keyed by the tranche's pin, workflows and settings, and runs it again only when one changes; a start in between reads only the session's own checkout. A deny rule refusing a told command other than the session's push is a warning (admit.mjs), not a missing condition.
Consequences: fewer reds that are not defects, one CI run instead of two, less code to keep. Comments and rows written before keep their receipt fields; nothing reads them. The shims' header comment still names the receipt check; it changes with the next shim change, not on its own (a shim must stay the pin's byte for byte). On reruns, Bob, 9 Nov: "This fixation ... with blindly rerunning tests when they're not needed is what kills velocity." Builders run locally only the test files for what they change; CI runs the whole suite.

## PD-22: GitHub's limits are kept by reading GitHub's own count, not by a ledger of the process's calls (Bob, 9 Nov)
Context: R17 (6 Nov) answered the account's suspension with a per-call ledger: every gh call, push, fetch and connector call logged per clone, shared to the state branch (`github/use/`, `github/pause.json`), audited hourly against GitHub (`github audit`), and counted by a PreToolUse hook on every connector call and Bash command, with a detached share, a share lock and foreground marks (C34, C40, C47, C52, C53). Primary use never went above about 12% of the limit, and about 11 builder fixes in three days went into that machinery.
Decision, in Bob's words (9 Nov): "If github usage reporting is expensive then don't do it beyond just making sure that we don't exceed published limits." The limit stays his of 6 Nov: "80% or 90% of github's published limits" (P27; `pacing.target`, 0.85). So the tool reads GitHub's own count, `/rate_limit` (free against the primary limit), only before a GitHub-heavy act (a job or lane start) and when a gh call fails with GitHub's 403 or 429 rate-limit refusal or a 5xx. It backs off while a primary bucket's use is at least 85% of its limit, until its reset, or for GitHub's Retry-After; a refusal it waits out (up to 15 minutes) and makes the call again, a 5xx at the target it refuses, naming when to rerun. `github budget` is one read of `/rate_limit`.
Consequences: no ledger rows, no share to the state branch, no audit, no hook, no `github note` or `github resume`; PD-13's hand-run hook ends. `pacing` keeps `target` and `poll_first_s`; its other keys are accepted and ignored. `github push` stays, without pacing: the R17c settings files (Bob's) deny a raw `git push` and allow only it, and its refspec checks hold Bob's no-force, no-delete, never-main approvals. The PreToolUse hooks leave `shims/settings.hooks.json`; until Bob removes them from each repository's settings, the hook finds no `github hook` in the pinned tool and lets each call through with a note, and a product's `setup check` reports the extra hooks as shim drift. The secondary limits (points and content a minute) are no longer counted: GitHub's refusal of them is obeyed when it comes.

## PD-23: A pin move reaches every open layer itself, in place unless it changes how the layer is judged (coordinator, 9 Nov)
Context: Bob, 9 Nov: "I don't see why a pin move should cause a layer reset. Pin moves should be lightweight fixes that improve velocity, not ruin it. So they should happen as needed, but also ganged up when possible and move efficiently." And on SLB-12: "SLB-12 sounds far too broad. An open layer may need to keep the old process version - if the process update would affect the proper completion of the layer. If it wouldn't then ... we should change the process without resetting the layer. If a change would affect the layer, then ... look at whether it's more efficient to hold the process change until after the layer [closes] or put the change in and reset. We need to be smart." Under SLB-12 (Bob, 6 Nov) a pin move made while a layer was open left the layer on its old tool until BOB ran `layer sync <n>`, a merge of the whole tranche; `layer jobs` and status led with that act, and `layer merge` refused when a job had landed after the pin moved.
Decision: the pin move brings each open layer the new pin itself. The pin-move session's step after its merge is `layer pin --open`. For each open layer it reads the pin diff: one that changes nothing that judges the layer's jobs or merge (gate, gate class, checks, record, merge, the layer flow's land and merge code, the shims) moves in place, as one commit on the layer carrying only `.process` and the workflow files, on the light pin-only gate class (C49), landed by the merge tool; lands already made are never re-gated, open job pull requests are not reset, and nothing is held. One that does is printed, and the coordinator chooses with `layer pin <n> --layers apply|hold|reset`: in place, as above; hold (the layer keeps its pin until it merges, the tranche moves now); or reset (today's layer sync). The SLB-12 refusal at `layer merge` goes: a held layer merges with its own pin, and the tranche's pin wins at the merge.
Consequences: C56 removes the SLB-12 hold (syncOwed, its lines in `layer jobs` and status, its refusal at `layer merge`), adds `layer pin` (its judging-file read, the `layer-pin/<n>-<hex>` branch, a `pin` row per act), teaches the gate class a pin moved in place (one commit, not a merge, on the layer, only pin files), makes `layer merge`'s tool merge take the tranche's `.process` and shims on a conflict, adds the pin-move prompt's step 12, and rewords the rulebooks. `layer sync <n>` stays as the reset.

## PD-24: A round after the first is one layer; every job starts at once (coordinator, 9 Nov)
Context: Bob, 9 Nov: "All jobs of a layer should open at once up to the maximum slot cap." A round after the first ran as a sequence of small round layers, one per plan layer holding a flawed module, each waiting on the last to merge.
Decision: from round 2, `round next` (and `layer open`) opens ONE layer holding every module with an owed reopen or an unmet found mark, whatever its plan layer, named for the plan's last layer it passes over. Every job is listed to start at once, up to the slot cap; within the layer the jobs are listed in dependency order (R10), and a user that lands before its provider is rescheduled when that provider's land changes the interface it uses, so the layer settles in dependency order. A mark found after the layer opens waits for the next round. A round already part-way under the old rule takes all that is left in one layer.
Consequences: C56 changes the plan in rounds.mjs and the open, round next and README wording, and rewrites the round tests to one layer. No check is added: the land order is the existing provider-reschedule mechanism, not a new hold.

## PD-25: The direct flow: every job is based on the tranche, and a module starts once every module upstream of it is settled (Bob, 9 Nov)
Context: under the shared layer branch a layer's jobs wait for the layer before to merge. A study of the layer-level checks (the coordinator's velocity audit, 9 Nov, "Layer study") found that no test suite runs at layer level (INT-4, Bob, 5 Nov): each layer-level check either moves to job start or the land, is already done per job, or goes. The cross-module backstop is the tranche-into-main gate, which already re-runs a user's suite whose provider changed after it was gated.
Decision, in Bob's words (9 Nov): "Because modules are in a total order, perhaps holding jobs in upper layers until an earlier layer closes isn't necessary", and "All jobs of a layer should open at once up to the maximum slot cap." On velocity: no blind reruns, no new safeguards, subtraction first. So `process/config.json` may say `"merge_strategy": "direct"`. Every job is cut from the tranche and publishes onto it (`layer publish`, which still halts a run on a reschedule). Its rows go under one key per tranche, `layerflow/direct-<tranche>/`. A module is ready when it has an unmet mark, an owed reopen or an outstanding reschedule, has no open job, and every module upstream of it in the uses graph is settled (no open job, no unmet mark, no outstanding reschedule; BLOCKED counts as settled). Every ready job starts at once, up to the slot cap (`direct jobs`, and status, the sweep and `round next`). `job start` runs that module's census. `layer land <pr>` accepts a job PR into the tranche once its gate is green, every module it uses is settled, and their interface-changing lands are ancestors of its head. A change to its interface reschedules every open user and notifies the others, and the notice is triaged at once by rule (PD-20). A ready direct job PR gets its whole suite at the gate. At the tranche into main, a land counts as gated when the land's own gate run was verified green (`jobMerge`, by layerCover's judge). A round is every flawed module at once (each recorded found mark starts its job at once), and its walk is owed once every module is settled. Modules that use each other land in map order, and the later one's land reschedules the earlier ones.
Consequences: no layer branch, layer open, layer sync, layer merge, layer gate, join, companion or early start under the direct flow. The combined state is tested only at the tranche into main, and a provider's interface change reaches more users at once. The layer flow stays in the tool until the copy's open layer 14 merges; the copy then switches its config, and the layer machinery is retired after that.


# [file] ledger-map.md

<!-- Snapshot of the claude.ai document https://claude.ai/artifact/8yMEUaEdwxSXcA8fcZYFnh, exported 2026-11-07T05:45Z for the account switch. The live document stays the working copy until Bob says otherwise. -->

# Ledger map

*Recomposed 5 Nov 2026 from Bob's export of his original; unchanged. No losses were found in the export.*

*Proposed changes awaiting Bob are kept apart, on their own tab: Proposed changes (awaiting Bob)*

Every kept or modified Ledger line, and where it is held: built (named code), a Phase row, a later gate, a nudge (text only, exposed by status), a measurement, or the design itself. Read from the tool at process3 tranche 237c02a and the Build Plan on 3 Nov. On 3 Nov 17 lines had no home or were not built where the plan assumed; each now has a place in a phase, listed first, and stays marked **Gap** below (GAP-9).

## Gaps

| Line | Gap | Where it goes |
| --- | --- | --- |
| ARC-1, ARC-3, ARC-4 | The tool's gate runs no architecture, text-key or scoped checks; the module suite may hold some | Phase 2: read once which checks the copy's suites run; build the missing ones before layer 1's jobs merge |
| JOB-8, GAT-4 | No check that a job commits no generated artifact, and no regeneration step, though the CI table lists one; Phase 2 now runs a layer's jobs at once, which is when they conflict | Phase 2 |
| P18 | The pipeline is a nudge in BOB's prompt only | As civicos-process held it: the cycle itself (all of a layer's jobs at once, each close straight into the next open, Phase 3) and BOB's preparation in order of value (Phase 2 prompt); BOB's idle time measured before anything more. A listed set of preparation acts with Stop guards was removed by Bob in civicos as too inefficient (K5787) |
| P9, PLN-3 | Status prints no reports to route | Phase 2, in the status row |
| P7 | Nothing shows each struck requirement has a test; the mechanical pass has no procedure | Phase 2: the receipt names the test for each struck mark and the review brief checks it; mechanical pass a later gate |
| REC-8, P20 | The reading audit has no build | Later gate |
| TXT-1 | The product's CLAUDE.md holds only the approvals; no pin or fetch line | Phase 3, with the shims |
| TXT-3, TXT-5 | No rulebooks and no skill written | Phase 3, with the shims, as Text to write says |
| SES-16 | Measured on the first tranche, but nothing runs a stateless wake to compare | Phase 3: one stateless BOB wake, tokens counted against a handover row |
| SHM-5 | Start check runs no product setup script | Phase 3, with the shims |
| MNT-9 | Not in Phase 3's gate | Phase 3 gate |

## Platform facts

| Line | Requires | Held by | Where |
| --- | --- | --- | --- |
| PLT-1 | Dated table of measured behaviours | The platform table on the probe | Phase 0, met |
| PLT-2 | Depend only on acts the approvals cover and measured to pass; archive and task deletion are housekeeping (restated by Bob, 3 Nov) | Permission physics; archive and task acts are housekeeping | Built |
| PLT-4 | Long steps run in CI | The gate workflow | Built |
| PLT-5 | No session starts its own successor; depth at most 3 (restated by Bob, 3 Nov); ROOT (depth 0, Bob's app) starts BOB, the watcher and the coordinator, and "whoever starts ROOT starts the watcher" is read as ROOT starting it (coordinator, 6 Nov) | start | Built |
| PLT-6 | A task is never needed for correctness | Sweep and watcher design | Built |
| PLT-7 | One repository; process as a pinned clone | The .process submodule | Built |
| PLT-8 | Privileged GitHub acts by workflows | Privileged workflow | Phase 3 |
| PLT-9 | Grants gathered once, checked at open | setup check; grants at tranche open | Built; Phase 3 |
| PLT-10 | Platform status is not work state | status reads git | Built |
| PLT-3 | Replaced by GAP-6 |  |  |

## Hooks and enforcement

| Line | Requires | Held by | Where |
| --- | --- | --- | --- |
| ENF-1 | A handful of command hooks at most | No hooks today; drift check with the shims | Built; Phase 3 |
| ENF-2 | No model judge on messages | The design | Design |
| ENF-3 | Nothing holds a turn | The design | Design |
| ENF-6 | Early stops caught without /goal | status and the sweep | Built |
| ENF-7 | Every hard rule has a blocked exit | block | Built |

## The record

| Line | Requires | Held by | Where |
| --- | --- | --- | --- |
| REC-1 | Durable on the tranche, transient on a state branch | process-state branch; home measured | Built; Measure |
| REC-2 | One writer per file | Per-participant state files | Nudge |
| REC-3 | Status reads the whole state | status | Built |
| REC-4 | Record writes cost no gate run | Gate's record-only pass | Built |
| REC-5 | Recorded from the result | The tool | Built |
| REC-6 | Address read from git | address, send | Built |
| REC-7 | A halted build is readable | status; five handovers 3 Nov | Built |
| REC-8 | Reads are a matter of record | Start prints the reading set; no audit | **Gap** |
| REC-9 | JSON ledger, one mutable field | ledger check | Built; Measure |
| REC-10 | Size and transient check; prune | record check; prune | Built; Phase 3 |
| REC-11 | Decision records; process technical decisions are the coordinator's and product decisions BOB's, each a decision record, reported; only what P17 makes Bob's comes to him, with options and context (Bob's answer, Keep and Drop page, 6 Nov 2026, AUD-5) | Template file | Later gate |

## Architecture and checks

| Line | Requires | Held by | Where |
| --- | --- | --- | --- |
| ARC-1 | Uses match imports | Not in the tool's gate | **Gap** |
| ARC-2 | One owner module per file | gate and merge | Built |
| ARC-3 | Tests assert on text keys | Not in the tool's gate | **Gap** |
| ARC-4 | Scoped checks; layer checks; whole product at release | Scoped: not in the tool; layer and release workflows | **Gap**; Phase 3 |
| ARC-5 | Machine-readable findings | gate | Built |

## Requirements

| Line | Requires | Held by | Where |
| --- | --- | --- | --- |
| REQ-1 | Public and private parts, permanent ids | The product's requirement files | Built (product) |
| REQ-2 | Behaviour at the interface | BOB writing requirements | Nudge |
| REQ-3 | Scale figures are measurements | START and review brief | Nudge |
| REQ-4 | Marks struck only by their job | ARC-2's ownership | Built |
| REQ-5 | A meaning change goes to Bob only by DES 1 | BOB's prompt | Nudge |
| REQ-6 | Cap triggers a split, never a refusal | Requirements cap | Phase 3; Measure |
| REQ-7 | Rulings deleted once absorbed | Template file | Later gate |

## Planning

| Line | Requires | Held by | Where |
| --- | --- | --- | --- |
| PLN-1 | Layers in rounds in tranches | merge, tranche open and tranche close | Phase 3 |
| PLN-2 | Plan from the remaining work | status next work | Phase 2 |
| PLN-3 | Found work placed at once | Reports to route; walk findings | **Gap** (Phase 2) |
| PLN-4 | Completion round's own file |  | Phase 3 |
| PLN-5 | Pause and resume | The plan field in process/config.json, read by the sweep; the 3 Nov halt switched tasks off by hand | Built (sweep); status prints it in Phase 2 |
| PLN-6 | Tranche report | release; tranche close | Phase 3 |
| PLN-7 | Nothing names a product | Config-driven tool | Built |

## Jobs

| Line | Requires | Held by | Where |
| --- | --- | --- | --- |
| JOB-1 | A job is one module's work in the open layer: branch cut from layer/\<n>, green publishes by small PR, report a comment, complete at its last green publish with no reschedule outstanding (Bob's answer, Keep and Drop page, 6 Nov 2026, SLB-2) | job start; publish | To build; trial on layer 7 (SLB-10) |
| JOB-2 | START names only tool acts | START generator | Built |
| JOB-3 | Take in earlier work | job start | Phase 3 |
| JOB-4 | Never restarted for a process reason | Pin by pull request; BOB's prompt | Nudge; Built |
| JOB-5 | Fast local checks; gate in CI; never a full suite in the session (Bob's answer, Keep and Drop page, 6 Nov 2026, AUD-7) | job complete | Built |
| JOB-6 | Restart a dead job | job start restarts from the branch and pull request | Phase 2 |
| JOB-7 | Receipt, checked against CI's own run of the job's tests; every disagreement counts in the false-done rate (Bob's answer, Keep and Drop page, 6 Nov 2026, AUD-2) | job complete | Built |
| JOB-8 | No generated artifact committed | Nothing | **Gap** (Phase 2) |
| JOB-9 | Turn ends COMPLETE or on a named wait | status and the sweep | Nudge; Built |
| JOB-10 | Reading set and tokens per attempt | metrics | Built |
| JOB-12 | Revert check: inert tests fail the gate; a refactor whose tests rightly pass before and after takes a reviewed exemption recorded on its PR (Bob's answer, Keep and Drop page, 6 Nov 2026, AUD-1) | gate | Built |
| JOB-13 | Mutation sampling | Nightly workflow | After the first tranche |
| JOB-14 | Fresh session after two failed corrections | Review-round limit in merge; brief rule | Built; Nudge |
| JOB-11 | Replaced by GAP-2 |  |  |

## The gate

| Line | Requires | Held by | Where |
| --- | --- | --- | --- |
| GAT-1 | Gate in CI once per publish PR tip, never in a session (Bob's answer, Keep and Drop page, 6 Nov 2026, SLB-3) | Gate workflow | To build; trial on layer 7 (SLB-10) |
| GAT-2 | Module suite only | gate | Built |
| GAT-3 | A provider's interface change (exports, Public / Provides text, or a test of a Provides requirement) reschedules every user in the open layer; a running job halts and restarts; a run started before the provider's newest publish never counts; higher layers get an unmet requirement (Bob's answer, Keep and Drop page, 6 Nov 2026, SLB-6) | Provider-change route at publish | Phase 3; trial on layer 7 (SLB-10) |
| GAT-4 | Regenerate artifacts, verify changed | Nothing | **Gap** (Phase 2) |
| GAT-5 | Every lock file; product's Node | gate, test | Built |
| GAT-6 | Triggered by the module's paths; a green tip skips the re-gate only when the tranche moved by record paths; the wider skips go with the merge train (Bob's answer, Keep and Drop page, 6 Nov 2026, AUD-3) | Gate workflow | Built |
| GAT-7 | Full regression at release | Release workflow | Phase 3 |
| GAT-8 | No re-gate on the merged result: a publish merges into the layer branch on its own green gate; the layer merges into the tranche once every job is complete and the layer's checks pass (Bob's answer, Keep and Drop page, 6 Nov 2026, SLB-4) | merge; layer close | To build; trial on layer 7 (SLB-10) |

## Integration and review

| Line | Requires | Held by | Where |
| --- | --- | --- | --- |
| INT-1 | Done means merged, at the layer: a module at its last green publish with no reschedule outstanding, a layer when merged into the tranche, a tranche when merged into main by one PR; main never moves while a tranche runs (Bob's answer, Keep and Drop page, 6 Nov 2026, SLB-5) | publish; layer close; tranche close | Phase 3; trial on layer 7 (SLB-10) |
| INT-2 | BOB decides on a reviewer | merge --reviewed or --no-review | Built |
| INT-4 | Layer closes when every job is complete and the layer's checks pass; module tests do not run again at close; the next layer starts at once (Bob's answer, Keep and Drop page, 6 Nov 2026, SLB-7) | layer close dispatches the layer checks | Phase 3; trial on layer 7 (SLB-10) |
| INT-5 | Nothing waits on an archive | Handover design | Built |
| INT-7 | One-pass review | review brief | Built |
| INT-3 | Replaced by GAP-10 |  |  |

## Sessions and roles

| Line | Requires | Held by | Where |
| --- | --- | --- | --- |
| SES-1 | ROOT, BOB, jobs, workers; BOB, one per product, starts every job from the tool's list of startable jobs, and starts lanes (Bob's answer, Keep and Drop page, 6 Nov 2026, SLB-8); under the layer branch no MERGER runs and nothing else starts jobs; its code is removed if the trial keeps the layer branch (SLB-11; coordinator, 6 Nov) | start, roles | Built; no-MERGER roles on the layer 7 trial (SLB-10, SLB-11) |
| SES-2 | Two-phase handover | handover | Built |
| SES-3 | Tool-written handoff | handoff | Built |
| SES-4 | REFRESH printed by status | status | Built |
| SES-5 | Reading set printed | status, job start | Built |
| SES-6 | Budgets are fractions; overrun reported | REFRESH percent; size alarms | Built; Nudge |
| SES-7 | Summaries optional | The design | Design |
| SES-8 | Model, effort, mode table | start | Built |
| SES-9 | Usage read or named unmeasured | metrics | Built |
| SES-10 | Workers return receipts | Worker briefs | Nudge |
| SES-11 | Overhead per tranche | Overhead share per job and layer, then the tranche report; no target (Bob, 3 Nov) | Phase 2; Phase 3 |
| SES-12 | False-done rate by independent re-verification and cost per surviving job, counted per job (one module's work in one layer) (Bob's answer, Keep and Drop page, 6 Nov 2026, SLB-9) | metrics; survival read 16 Nov | To build; trial on layer 7 (SLB-10) |
| SES-13 | Outliving a parent is ordinary | The design | Design |
| SES-14 | Lanes; a process triage lane and a product triage lane bring Bob options with context before a response is chosen; a chosen short-term response reaches later sessions in their starting prompt with its end condition (Bob's answer, Keep and Drop page, 6 Nov 2026, AUD-8) | UX lane | Phase 3 |
| SES-15 | BOB routes | Routing share measured | Phase 2; Measure |
| SES-16 | Stateless BOB, measured | No comparison arm | **Gap** (Phase 3) |
| SES-17 | Urgency as a nudge | BOB's prompt | Phase 2 |
| SES-18 | Workers for three uses only | Worker briefs | Nudge |
| SES-19 | A lane is the load-bearing source of truth in its area, qualified before it decides anything (Bob, 6 Nov) | lane start, lane ask (qualification record) | Built (build/lane-qualification) |
| SES-20 | First run qualifies: workers research the canon, the existing code and best practice of the lane's area (Bob, 6 Nov) | lane start's QUALIFICATION brief; lane ask refuses until it lands | Built (build/lane-qualification) |
| SES-21 | A lane-specific research area in the product repo, read first, drawn from and evolved by every later session (Bob, 6 Nov) | lanes\[\].research (default \<dir>-research), counted as the lane's folder by the gate | Built (build/lane-qualification) |
| SES-22 | Research continues as the lane works; lane ask workers read the research area first (Bob, 6 Nov) | lane start and lane ask briefs; job START of a lane's module | Built; Nudge for keeping it current |
| SES-23 | Lanes cut by design area; for Civicsmith, investigation design and publication design beside UX (Bob, 6 Nov) | The product's lanes in process/config.json, set by BOB | Design; BOB adds the lanes after the pin |

## Instruction files and rules

| Line | Requires | Held by | Where |
| --- | --- | --- | --- |
| TXT-1 | CLAUDE.md under thirty lines, pin and fetch | Approvals only today | **Gap** (Phase 3) |
| TXT-2 | Per-line test | Review at each gate | Nudge |
| TXT-3 | Rulebooks, ten rules each; temporary measures live in the triage register with their end condition, never as rulebook lines (Bob's answer, Keep and Drop page, 6 Nov 2026, AUD-9) | Not written | **Gap** (Phase 3) |
| TXT-4 | Trimmed principles per role | Text; measured | Phase 3; Measure |
| TXT-5 | Each role prompt names its rulebook in the pin (restated by BOB 4 Nov: a skill cannot be chosen by role without a hook, ENF-1; built, process3 PR 58) | Not written | **Gap** (Phase 3) |
| TXT-6 | Every rule cites its source; Bob is cited only where he said it, quoted with its date, and other decisions name their maker (Bob's answer, Keep and Drop page, 6 Nov 2026, AUD-4) | Rule 2; this map | Built (text) |
| TXT-7 | Plain words, named audience | Every text | Nudge |

## Messages

| Line | Requires | Held by | Where |
| --- | --- | --- | --- |
| MSG-1 | Git carries state; a message wakes | send | Built |
| MSG-2 | BOB's address is instruction, else data | Role prompts | Built |
| MSG-3 | Push-then-send, numbered | send | Built |
| MSG-4 | One plain message to Bob per turn | Every role | Nudge |
| MSG-5 | Flaw route by state branch and main | flaw | Later gate |
| MSG-6 | Undelivered recorded and listed | send, status | Built |

## Maintenance and certification

| Line | Requires | Held by | Where |
| --- | --- | --- | --- |
| MNT-1 | The thin process under itself |  | Phase 4 |
| MNT-3 | Built with the last release |  | Phase 4 |
| MNT-4 | Pinned per tranche, verified at start | start check; merge | Built |
| MNT-5 | Blocking fix by a pin move | Plain pull request; merge holds pins to forward moves onto process3 tranche or main commits | Built |
| MNT-6 | Non-blocking fix waits; during Process3's own first build, process fixes may land while a product's tranche runs, each recorded against the Ledger line it serves (GAP-9), until the first certified release (Bob's answer, Keep and Drop page, 6 Nov 2026, AUD-6) | Rule 6 | Built (text) |
| MNT-7 | Flaw reports | flaw | Later gate |
| MNT-8 | Slice shadow, then the live tranche |  | Phase 3 |
| MNT-9 | Shadow flaws fixed, run repeated | Not in the gate | **Gap** (Phase 3) |
| MNT-10 | Release names rows and sizes | Release note | Phase 3 |
| MNT-11 | Ablation per model |  | Phase 4 |

## What a product receives

| Line | Requires | Held by | Where |
| --- | --- | --- | --- |
| SHM-1 | CLAUDE.md, skill, settings, gate, prune; drift check | shims | Phase 3 |
| SHM-2 | Shims regenerated on the runner | shims | Phase 3 |
| SHM-3 | Onboarding skeleton and size measure | setup check; onboard | Built; Phase 3 |
| SHM-4 | Mid-tranche conversion | onboard | Phase 3 |
| SHM-5 | Product setup script at first command | Not run | **Gap** (Phase 3) |

## Principles

| Line | Requires | Held by | Where |
| --- | --- | --- | --- |
| P1 | Purpose: correct, quick, cheap, surviving | Rule 1; the health metrics | Built (text) |
| P2 | The build state tells BOB what to do | status next acts | Phase 2 |
| P3 | A serious process flaw pauses the product | Rule 6; pin by pull request | Built (text) |
| P4 | Total order, uses checked | As ARC-1 | **Gap** |
| P5 | Requirements' four-part shape, concise | BOB writing; cap | Nudge; Phase 3 |
| P6 | A module fits one reading | Reading-set sizes; cap | Phase 3 |
| P7 | Every requirement tested; mechanical pass | Revert check only | **Gap** (Phase 2; later gate) |
| P8 | One job per module | job start refuses a second | Built |
| P9 | Reports routed by BOB | Not in status | **Gap** (Phase 2) |
| P10 | Layer at a time, all its jobs at once | status next work; layer close | Phase 2; Phase 3 |
| P11 | Tests follow the architecture | gate; release | Built; Phase 3 |
| P12 | Done means merged; close merges main in | merge; tranche close | Built; Phase 3 |
| P13 | Sessions short; refresh | REFRESH | Built |
| P17 | Bob defines, BOB decides | Walk-through; every role | Design |
| P18 | Pipeline: prepare the next stage | The cycle (close into open); BOB's prompt in value order; idle time measured | **Phase 2; Phase 3** |
| P19 | Never idle; never stop for Bob | status, sweep wake, BOB's prompt | Phase 2 |
| P20 | Act on what was read in full | Reading audit not built | **Gap** (Later gate) |
| P21 | Bob's questions become designs; lanes | Walk-through; UX lane | Built (practice); Phase 3 |
| P22 | Release deployed and walked | Deploy and walk; release | Phase 2; Phase 3 |
| P23 | The repository holds only what is needed | record check | Built |
| P24 | Recorded state ends itself: a checkable end condition, ended by the tool, stale state cleared by the process (Bob, 6 Nov) | ends.mjs conditions; expire.mjs at every write, layer open and the sweep; status reports stale; hold refuses words alone | Built (R13, build/self-expiring-records) |
| P25 | Refusals and inconsistencies are anticipated and reported ahead of the act (Bob, 6 Nov) | census.mjs census and preflight: setup check, status --role bob gaps block, layer open, the gate's census finding | Built (R15, build/preflight) |
| P26 | The account switch is rehearsed and preflighted before it's needed (Bob, 6 Nov) | switch.mjs: switch out --dry-run, switch in --preflight and the session checks, the manifest's layers, lanes, asks and old sessions, switch/retired.json read by ends.mjs session\_gone; rulebooks/account-switch.md; notes/account-switch-canary.md | Built (R16, build/switch-ready) |
| P27 | Process3 conforms to GitHub's published limits, using up to 80–90% of them, and obeys rate-limit responses (Bob, 6 Nov) | pace.mjs: GITHUB\_LIMITS, pacing.target, ghTurn's windows and primary check, ghAfter's pause and stop, budgetGate on job and lane starts, github budget; ghshare.mjs: github/pause.json and github/use/ on the state branch; github resume | Built (R17, build/github-pacing; unpushed while GitHub is suspended) |

## Gaps found 3 Nov

| Line | Requires | Held by | Where |
| --- | --- | --- | --- |
| GAP-1 | Runs with no one watching | Phase 2's gate | Phase 2 |
| GAP-2 | Cost per attempt is an alarm | Sweep row | Phase 2 |
| GAP-3 | Nothing without a failure or Bob's word | Rule 2 | Built (text) |
| GAP-4 | Status names next acts | status | Phase 2 |
| GAP-5 | Events wake BOB | Subscribe step; sweep wake | Built; Phase 2 |
| GAP-6 | Approvals are the one policy | record check; start check | Built |
| GAP-7 | Public release waits for Bob | Production environment | Phase 3 |
| GAP-8 | Move accounts on one request | A tested page of steps | Later gate |
| GAP-9 | The three documents agree | This map | Built (text) |
| GAP-10 | Merge on green without Bob | merge | Built |
| GAP-11 | Measure once by default | Rule 3 | Built (text) |
| GAP-12 | BOB's idle time and Bob's minutes reported | Sweep row; tranche report | Phase 2; Phase 3 |

## Shared Layer Branch, 6 Nov

New lines from Bob's answers on the Keep and Drop page, 6 Nov 2026; the lines they modify are updated in their own tables above.

| Line | Requires | Held by | Where |
| --- | --- | --- | --- |
| SLB-1 | Adopt the Shared Layer Branch: one branch per open layer; a job publishes onto it only when its own tests pass; a provider's interface change reschedules its users; the layer merges into the tranche once every job is complete and the layer's checks pass (Bob's answer, Keep and Drop page, 6 Nov 2026, SLB-1) | Design note; publish; layer close | To build; trial on layer 7 (SLB-10) |
| SLB-10 | Trial on civicsmith-copy's layer 7 after layer 6 closes and product work pauses; measures and stop rule as on the Keep and Drop page (Bob's answer, Keep and Drop page, 6 Nov 2026, SLB-10) | Trial measurements | Layer 7 |
| SLB-11 | If the trial keeps the layer branch, remove the merge train, the MERGER, the parallel window, provider holds, the in-flight hold, the plain queue and the fixes built for them (Bob's answer, Keep and Drop page, 6 Nov 2026, SLB-11) | process3 pull requests | After the trial |
| SLB-12 | Every pin move made while a layer is open is followed by layer sync \<n> for that layer, before any job in it lands; a pin move does not reach an open layer branch, because the gate runs the base's own tool (Bob, 6 Nov 2026) | layer sync; layer jobs and status lead with it while the pins differ; layer merge refuses until in sync | To build: process3 PR 198 (R11); rulebooks/layer-branch.md step 2 |


# [file] ledger-map-proposed-changes.md

<!-- Snapshot of the claude.ai document https://claude.ai/artifact/8yMEUaEdwxSXcA8fcZYFnh (tab: Proposed changes), exported 2026-11-07T05:45Z for the account switch. The live document stays the working copy until Bob says otherwise. -->

# Proposed changes: Shared Layer Branch

**Status, 6 Nov: every proposal below was accepted by Bob's answer on the Keep and Drop page (6 Nov 2026, SLB-1 to SLB-11) and applied to the Ledger map tab in the row named in its Status cell; where his answer or note differs from the proposed row, his answer was applied, and the Where column reads "To build; trial on layer 7 (SLB-10)" or the row's phase with that trial. SLB-1, SLB-10 and SLB-11 have their own table at the end of the Ledger map tab. The proposals are kept below as history.** Each proposal quotes the current row word for word from the Ledger map tab, then gives the proposed row. Every proposal is marked GAP-9 because the Ledger, the Foundations and the Build Plan must change together: the same proposals stand on the Process3 Foundations and Process3 Keep and Drop Ledger documents. The Build Plan's matching rows are not on this account and are not covered.

Source: the design note [Shared Layer Branch](https://claude.ai/artifact/FPZfRWFpp7frS2g6zqVuDV), Bob's design of 5 Nov, with his three rulings of 5 Nov evening relayed by the coordinator. A one-layer trial on the copy comes before adoption, so each proposed row's Where column reads "Proposed; trial first".

| Line | Status | Current row | Proposed row |
| --- | --- | --- | --- |
| JOB-1 | GAP-9 · Accepted by Bob, 6 Nov (SLB-2); applied to the Jobs table, JOB-1 row | Job is a draft PR · job start · Built | A job is one module's work in one layer, published green onto the layer branch by pull request · job start; publish · Proposed; trial first |
| GAT-1 | GAP-9 · Accepted by Bob, 6 Nov (SLB-3); applied to The gate, GAT-1 row, as once per publish PR tip | Gate in CI once per tip · Gate workflow · Built | Gate in CI once per publish into the layer branch · Gate workflow · Proposed; trial first |
| GAT-8 | GAP-9 · Accepted by Bob, 6 Nov (SLB-4); applied to The gate, GAT-8 row, in Bob's wording; the 5 Nov relayed citation replaced by his 6 Nov answer | Gate on the merged result · merge · Built | A layer merges into the tranche when every job has passed against its providers' current versions with no reschedule outstanding and the layer's checks pass; no module test runs again (Bob, 5 Nov, relayed by the coordinator) · layer close · Proposed; trial first |
| INT-1 | GAP-9 · Accepted by Bob, 6 Nov (SLB-5); applied to Integration and review, INT-1 row, with last green publish and no reschedule outstanding | Done means merged · merge; tranche close · Built; Phase 3 | Done means merged: a module by its green publish, a layer by one PR into the tranche · publish; layer close; tranche close · Proposed; trial first |
| GAT-3 | GAP-9 · Accepted by Bob, 6 Nov (SLB-6); applied to The gate, GAT-3 row, in Bob's wording (exports.mjs not named there) | Provider change reaches users by their jobs · Provider-change route · Phase 3 | A provider's interface change reschedules its users at its publish; a running user halts its tests and starts again; higher layers get an unmet requirement · Provider-change route at publish (exports.mjs) · Proposed; trial first |
| SES-12 | GAP-9 · Accepted by Bob, 6 Nov (SLB-9); applied to Sessions and roles, SES-12 row | False-done and cost per surviving PR · metrics; survival read 16 Nov · Built | False-done and cost per surviving job (one module in one layer) · metrics; survival read 16 Nov · Proposed; trial first |
| INT-4 | GAP-9 · Accepted by Bob, 6 Nov (SLB-7); applied to Integration and review, INT-4 row, with the next layer starting at once | Layer closes on merges and layer checks · merge dispatches the layer checks · Phase 3 | Layer closes when every job has completed and passed with no reschedule outstanding and the layer's checks pass; module tests do not run again at close (Bob, 5 Nov: "INT-4: layer checks run at layer close, but not module tests.") · layer close dispatches the layer checks · Proposed; trial first |
| SES-1 | GAP-9 · Accepted by Bob, 6 Nov (SLB-8); applied to Sessions and roles, SES-1 row; per Bob's note BOB starts lanes as well as jobs | ROOT, BOB, jobs, workers · start, roles · Built | ROOT, BOB, jobs, workers; the tool lists startable jobs and BOB starts them; no other session creates jobs; no MERGER (Bob, 5 Nov: "BOB starts jobs, not ROOT") · start, roles · Proposed; trial first |

Current rows are written with their three columns (Requires · Held by · Where) joined by · so each fits one cell.

**Bob's answers** (5 Nov, relayed by the coordinator, verbatim): "INT-4: layer checks run at layer close, but not module tests." and "BOB starts jobs, not ROOT". Both settled; no longer open.


# [file] audit2_requirements.md

# Second audit of the Process4 definition: the fifth draft against the Keep and Drop Ledger and the Foundations

14 Nov 2026. Audited: the main text of `/home/user/handoff/process4_definition_v5.md`, as it stands after Bob's fifth message. Measured against his 288 requirement lines (151 from the Ledger, 137 from the Foundations and its lists), with his typed words of 14 Nov ranked above the session's record, and the record above the documents. The per-line table is `/home/user/handoff/process4_definition_appendix_v5.md`. Ids and codes are used here; the first sentence of every finding is written without them.

## 0. What was done, and its limits

- Every one of the 288 lines was placed again, starting from the third-draft appendix and the two first-round audits. Lines whose status could have moved with the fourth and fifth drafts or with his typed words were re-read against the main text; lines that were "by the count only" in the third draft were checked by searching the fifth draft for their subject.
- Every string in quotation marks in the fifth draft (about 170) was compared by script with his two files of typed words, the record of 13-14 Nov, the Ledger export and store, the Foundations, Process3's decision record and the product's CLAUDE.md. Then every "you decided", "you answered", "your words", "your note", "your hint" was read by hand for what is hung on it.
- Two things were checked in the read-only product clone because the draft says "Checked by Claude" or leans on them: the folder for the walks' documents, and where a module's declared uses are stored. Nothing was written there.
- Not done: the notification study was not re-derived. Feasibility and corruption arguments belong to the other auditors and are touched only where a kept line is at stake.
- The fourth draft's proposals were read to check what Bob was shown before each short answer. That is the only use made of the fourth draft.

## 1. Counts

One code for each of the 288 lines.

| | Lines |
| --- | --- |
| (a) honoured and stated | 112 |
| (b) honoured in purpose, way changed by his typed words of 14 Nov | 17 |
| (b) way changed by the record of 13-14 Nov | 7 |
| (b) way changed by a decision of Claude's that the draft declares | 15 |
| (b) way changed with no decider named | 4 |
| (c) ended or cut, said so, decider his typed words (right decider) | 18 |
| (c) ended or cut, said so, decider the record (right as far as the record goes) | 22 |
| (c) ended or cut by Claude, said so, never put to him as a proposal | 33 |
| (c) ended, shown under his decisions on a ground that is not his words | 2 |
| (d) silently dropped | 1 |
| (e) contradicted | 4 |
| (f) carried by nothing but the promise of an appendix | 50 |
| (g) unstated and in conflict with his typed words, unresolved | 3 |
| Total | 288 |

112 + (17 + 7 + 15 + 4 = 43) + (18 + 22 + 33 + 2 = 75) + 1 + 4 + 50 + 3 = 288.

By source document:

| | a | b typed | b record | b Claude | b nobody | c typed | c record | c Claude | c wrong ground | d | e | f | g | Total |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Ledger | 51 | 11 | 2 | 6 | 2 | 10 | 12 | 15 | 1 | 1 | 4 | 34 | 2 | 151 |
| Foundations | 61 | 6 | 5 | 9 | 2 | 8 | 10 | 18 | 1 | 0 | 0 | 16 | 1 | 137 |
| Both | 112 | 17 | 7 | 15 | 4 | 18 | 22 | 33 | 2 | 1 | 4 | 50 | 3 | 288 |

Beside the per-line codes: 14 conflicts with his own typed words of 14 Nov (section 4; they touch 38 lines, of which 3 are coded g), 13 additions (section 3), and 19 attribution faults, 4 of which matter (section 5). No quotation of his typed words is inexact. No line ended by Claude is shown as ended by Bob, with the two small exceptions of finding 15.

Against the third draft: where it counted 163 lines "kept as written" (24 of them by the count only), there are now 112 kept and stated and 53 kept and stated nowhere; "ended by Claude" has fallen from 22 to 21 and "ended in part by Claude" from 22 to 13, because his answer to proposal 13 and his "agreed" now carry 15 rows that were Claude's; the six "not yet settled" rows are all decided by Claude; the two "open" rows are answered by his words on PROCESS.

## 2. Findings, worst first

### Finding 1. Your Ledger and your Foundations still say the opposite of this definition for 75 lines, and nothing says which a session must follow

1. The definition ends or cuts 75 of your lines. Your stored Ledger still says "keep" or "modify" for the 38 of them that are Ledger lines, and your Foundations still state the other 37. One of your kept lines says no build starts while the documents contradict each other. The definition names Claude as builder and does not say that it governs. In Process3 a session brought back a removed check by citing Ledger lines.
2. Fifth draft, J: "Your ledger is unchanged. It still shows 'keep' or 'modify' for every line this definition ends. Your ledger is yours to change." M: "Builder: Claude, before anything is in force." Measured against GAP-9 ("no build starts on a line any of them contradicts"), kept 3 Nov.
3. Measured: the store (119 keep, 32 modify, 8 drop, unchanged); the check brought back in Process3 (register entry 69). The counts are this audit's: 75 = 18 + 22 + 33 + 2, of which 38 are Ledger lines and 37 Foundations lines.
4. Silently spoils the result.
5. RAISED BEFORE AND STILL OPEN: register entry 69. The third draft's sentence "where the two differ, this definition says which decision it follows" is gone from the fifth.
6. A change of wording, once: "Where this definition and the Ledger differ, the definition is followed from the day you accept it; the Ledger and the Foundations are kept as the record of what you decided before 13 Nov." Or the structural choice: both are retired as documents sessions read, and no role text of Process4 names either.
7. Bob's to decide: it is which of his own documents speaks for him.

### Finding 2. Fifty-three of your kept lines are stated nowhere, and the sentence that said they stand is gone

1. The third draft said in the main text how many lines stand as written, so a line it never mentioned was still kept by that sentence. The fifth draft has no such sentence: it says the lines "were not recounted". Fifty-three lines you kept are now neither stated, nor ended, nor covered by any sentence. A builder will keep or drop each by its own judgment.
2. J: "They were not recounted for this draft; the appendix that lists them one by one will be redone to match it." And: "A check that could stop work stays only if this document names it." The 53 are listed in the appendix under "Kept; stated nowhere". Those that a builder cannot guess: REQ-5 (which changes to a provided service come to you); F-REC-3 and P13 (sessions kept short, ARCH refreshed at a threshold); SES-13 (no step counts on a parent session being alive); MSG-3 (push-then-send as one command, duplicates ignored); REC-5 (an act is recorded as done only from its result); PLT-8 (acts a session cannot take run on GitHub's machines with your tokens); F-STOP-1 (the process owns nothing on a live site); F-HUM-14 (when in doubt, run the product); ARC-3 (tests assert on a text's key, not its words); ENF-1 and F-PLAT-16 (hooks); SHM-3 and SHM-4 (onboarding and carrying Civicsmith's open tranche over).
3. Measured by search of the fifth draft for each line's subject. That a builder would drop them is reasoning; Process3's ARCH was replaced 21 times in six and a half days (measured), which is why the refresh lines matter.
4. Silently spoils the result.
5. RAISED BEFORE AND STILL OPEN, and larger: the first audit found 34 Ledger and 23 Foundations lines kept "by the blanket only" (register entries 87 and 43); the third draft brought it to 24; cutting the theme lists in the fourth and fifth drafts took it to 53 and removed the blanket itself.
6. Restore, in one sentence of the main text: "Every line the appendix marks as kept and unstated stands as you wrote it." And restore by name the dozen above, one clause each, in the paragraph "Kept, by theme". No new duty is created: each is already his.
7. Claude's to decide (wording), except the three that now conflict with his typed words (finding 9), which are Bob's.

### Finding 3. The definition says the walks' documents are in a folder; your own approvals and that folder's own note say the documents are kept elsewhere
