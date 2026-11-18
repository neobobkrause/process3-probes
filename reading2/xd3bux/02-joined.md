# [file] audit_C.md (continued)

| F-STOP-2 | Release packaging is the Release workflow (installer artifact, update manifest, signing, draft releases); a development release stops as a draft; install-from-scratch and upgrade tests run as release-tier fixtures first | Mechanism for a purpose (a release can be cut without him until publication) | **SILENT.** G11 covers the close and the public approval only. The feasibility review found "development and public release cutting have no mechanism after the tool goes" and graded R20 weakened; the proposal grades it "Met" | (2) | Proposal must change: say what cuts a release. His 8 and 9 Nov decisions on the installer and site updates (DECISIONS.md BD-R1, BD-R3, BD-R5) are not mentioned |
| F-STOP-3 | Coming back: the walk's findings after a deployment enter the next round as entries | Purpose | **MET DIFFERENTLY** (F2: "Walk failures become product jobs in the next round"). The release note going out is MNT-10 | none | |
| F-REL-1 | A development release is cut and deployed by the process "in each round, without you", to the product's own site, reaching no one else, on the owner's standing approval | Purpose (deploy and walk without him); mechanism (cadence, place) | **CONTRADICTED** on cadence and place. F1: "at each layer close, when ARCH dispatches it, and at least once a day on a schedule". F3: "A separate Cloudflare account for development." Without him: met | (2) | Candidate for the owner to change, on evidence: no deployment for 80 hours while 308 landings went in, and all 12 deployments failed (product_side §1). But the proposal reverses two of his decisions without naming them: on 4 Nov the deploy and walk were moved to round close only, a change the record attributes to him (change_sample removal 135); and on 8 Nov he said "The live walk will take a long time and will end up being an expensive means of identifying many of the same the flaws the internal walk found" (DECISIONS.md PD-16). It must say which walk, internal or live, runs when. The two late runs took 60 and 64 minutes |
| F-REL-2 | A public release is a development release the walkers have passed, published only with the owner's approval; the production environment holds the publishing job and the keys, "never the sessions' cloud environment" | Purpose | **MET** (G10, G11). "Shows you what it carries" is not mentioned | (1) | |

### Dropped, and why

The requirement here is that a dropped line does not come back.

| Id | Dropped line | Process4 result |
| --- | --- | --- |
| F-DROP-1 | Hook refusing partial reads (ENF-4) | **MET.** C7: "No hooks." |
| F-DROP-2 | Stop hook enforcing the refresh threshold (ENF-5) | **MET.** No hooks; G9 makes stop the owner's |
| F-DROP-3 | Mandated test-first red step (INT-6) | **MET.** Not reintroduced |
| F-DROP-4 | Twelve-module process architecture (MNT-2) | **MET.** N1 budgets the tool at 500 lines |
| F-DROP-5 | In force the day written, certified on a toy (MNT-12) | **MET DIFFERENTLY.** Seven tests, a replay on real history, then a short live run; not the slice shadow |
| F-DROP-6 | Repository doorbell and mailboxes (MSG-7) | **MET.** Pinned issues, nothing in the repository |
| F-DROP-7 | Git-synced multi-writer tracker (REC-12) | **MET.** G7 goes further and deletes its replacement, the JSON ledger |
| F-DROP-8 | Every rule names the principle it serves (P16) | **MET.** Not reintroduced |

### To measure on the first tranche

The requirement: "Each is kept or changed on a number from the first real tranche, not on argument." TXT-4's row is graded above and the health metrics at F-MNT-7.

| Id | Question | Process4 result | If not met |
| --- | --- | --- | --- |
| TM-1 | Stateless BOB against long-lived, by tokens per wake (SES-16) | **MET DIFFERENTLY.** C3 chooses stateless; test 1 decides whether it can exist. Decided on other evidence (26 handoffs acted as the rulebook), not on tokens per wake, which was never measured | |
| TM-2 | The JSON ledger, on corruption or bypass (REC-9) | **MET DIFFERENTLY.** G7 deletes it on other numbers: no recorded catch; about 70% of commits were state | |
| TM-4 | BOB's routing share of its context (SES-15) | **SILENT** | Moot if lanes go; the proposal should say so |
| TM-5 | Which lanes run as sessions and which as workers (SES-14) | **SILENT** | See P21 |
| TM-6 | The requirements cap number (REQ-6) | **MET DIFFERENTLY.** Lever P1 removes the cap's refusal; files are split at planning. Evidence: the cap was overridden 32 times of 32 with no catch and drove 30 split files (product_side §6b) | |
| TM-7 | Home for transient state (REC-1) | **MET DIFFERENTLY.** G7: none. Evidence: 12,881 state-branch commits, 70% of all (product_side §3) | |
| TM-8 | Permission mode per role, with "denials per role counted in the metrics" (SES-8) | **WEAKENED.** Auto mode is assumed (test 3). No count of denials or refusals is on the daily report | Proposal must change: the owner's 13 Nov restatement names "permission refusals" first among interruptions, and nothing in the proposal counts them |
| TM-9 | Merging without a person, settled at 0 refusals in about 450 acts | **MET DIFFERENTLY.** G3 replaces the measured merge with a new act (a job enables auto-merge) under approvals text he must rewrite; test 3 tries it once | The proposal should say it replaces a settled, measured route with an untested one |
| TM-10 | Mutation sampling on payment and data paths (JOB-13) | **SILENT** | Proposal should say whether it is dropped |
| TM-11 | Model and effort table, by tokens per merged pull request (SES-8) | **WEAKENED.** C9 sets effort from Anthropic's documentation, with no measurement | Proposal should give the count that will decide it |

### Open tensions to settle

| Id | Settled as | Process4 result | Central | If not met |
| --- | --- | --- | --- | --- |
| OT-1 | ROOT stays a session and, with the sweep and the watcher, creates and refreshes BOB. The owner starts ROOT, and replaces it only if the watcher declines | **CONTRADICTED.** C1 removes "coordinator, ROOT, MERGER, watcher, sweep, standing builders, two-phase handover, handoff notes". C2: the task is one "that you create". C3 fallback: ARCH is "replaced by you at each layer close ... with the old task switched off in the same step" | (1), (2) | Mechanism: candidate for the owner to change (handoffs became a rulebook, causal_forensics §3; heartbeat, idle-check and session-list commits were 1,738 on the state branch, product_side §3). Purpose (the architecture session is created and refreshed without him): proposal must change in the fallback form |
| OT-2 | A layer closes when every pull request is merged and the layer's checks pass; whole-product checks run before a release | **CONTRADICTED** by G6, as at P11 | (3) lightly | As at P11 |
| OT-3 | The settings file carries only hooks ENF-1 allows; the drift check fails on any other; today there are none | **MET DIFFERENTLY.** C7: no hooks, and the Bash hook now in the product is removed. Drift is held by G2 | none | |
| OT-4 | BOB routes between spokes and does not translate; it explains toward the owner with context, in words he understands | **MET DIFFERENTLY** toward the owner (M5; "What reaches you"). Routing between spokes: see P9 and P21 | (1) | |

### One cross-reference outside this part

| Id | Requirement | Process4 result | If not met |
| --- | --- | --- | --- |
| X-1 (Foundations, "How problems are handled", the owner's direction of 2 Nov; not counted below) | "Every problem is an architecture bug: BOB finds why, corrects the design by rewriting the line it belongs to, never by appending, and builds the correction; a workaround for the moment is not a fix." | **CONTRADICTED.** WA 3: "If it gets in your way, work around it, add one line to the process log, and carry on." The proposal lists as ending "'a workaround is not a fix' for process problems during a run" | The proposal names this one, and its evidence is strong: 38% of check-adding changes answered the process's own earlier machinery, and 47% of additions were removed or loosened after a median 28 hours (change_sample). But he repeated the direction on 7 Nov: "not just fix that problem but also try to determine the cause of the problem and fix that so that the set of problem types tend toward zero" (causal_forensics §4.2). This is a change to what the line asks and is his to make |

## A. Counts by result

| | MET | MET DIFFERENTLY | WEAKENED | SILENT | CONTRADICTED | Total |
| --- | --- | --- | --- | --- | --- | --- |
| TXT | 2 | 3 | 1 | 0 | 1 | 7 |
| MNT | 2 | 3 | 1 | 3 | 1 | 10 |
| SHM | 0 | 3 | 1 | 1 | 0 | 5 |
| Principles | 3 | 6 | 5 | 2 | 4 | 20 |
| GAP | 2 | 3 | 1 | 1 | 5 | 12 |
| **Ledger lines** | **9** | **18** | **9** | **7** | **11** | **54** |
| Foundations: How decided | 0 | 0 | 2 | 0 | 0 | 2 |
| Foundations: Setup | 4 | 3 | 2 | 0 | 2 | 11 |
| Foundations: Maintenance | 3 | 1 | 3 | 1 | 4 | 12 |
| Foundations: Dropped | 7 | 1 | 0 | 0 | 0 | 8 |
| Foundations: To measure | 0 | 5 | 2 | 3 | 0 | 10 |
| Foundations: Open tensions | 0 | 2 | 0 | 0 | 2 | 4 |
| **Foundations rows** | **14** | **12** | **9** | **4** | **8** | **47** |
| **All rows** | **23** | **30** | **18** | **11** | **19** | **101** |

Of the 19 contradicted rows, 8 are marked as candidates for the owner to change on evidence (P11, OT-2, GAP-6, F-MNT-1, F-MNT-2, F-SET-3, F-SET-8b, F-REL-1), and one more by addition (F-MNT-7). In each the proposal still owes him the statement that it reverses something he decided. The other 10 need the proposal to change.

The proposal's own count is "meets 19 ... weakens 6" of 25 purposes. On the 54 Ledger lines of this part, half are met or met differently (27); 27 are weakened, silent or contradicted.

## B. Contradicted and silent rows, ranked by weight on the four central requirements

| Rank | Row | Result | Central | The item at fault |
| --- | --- | --- | --- | --- |
| 1 | P17: the owner defines, the AI decides everything technical; he edits no files and enters no commands | Contradicted | (1), (2) | "The division, amended"; G1, N2, N4; "Your standing acts are five" |
| 2 | MNT-5: a blocking fix is adopted in the run by one recorded act | Contradicted | (1), (2) | N2 "The pin moves only by your merge"; "Ledger lines that end" |
| 3 | GAP-10: a green gate merges without him | Contradicted | (1), (2) | G2: his review on six path groups, including the pin, the workflows and the walker's steps |
| 4 | GAP-1: a tranche can run with no one watching | Contradicted | (2) | "Start smaller than this"; C3 fallback; frozen-part defects wait for him |
| 5 | P5: BOB carries a change to every user of a service | Contradicted | (3) | N7; "provider notices as a route (GAT-3)" |
| 6 | GAP-5: events wake BOB at once; a scheduled wake is only a net | Contradicted | (2), (4), (3) | C2, C4 |
| 7 | P19: never idle; the work never stops for him | Contradicted | (2), (4) | R15 "Met, restated"; WA 7; N7 |
| 8 | OT-1: BOB is created and refreshed without him | Contradicted | (1), (2) | C1, C2, C3 |
| 9 | P18: the pipeline; the next stage opens the moment this one closes | Silent | (2), (4) | Nothing; R15's hour |
| 10 | GAP-9: the design agrees with the decided lines | Contradicted | all | M2; "do not carry over as lines"; run 0 |
| 11 | TXT-1: CLAUDE.md changes need no approval | Contradicted | (1), (2) | G2 |
| 12 | SHM-3: onboarding | Silent | (1) | R24 "not designed here" |
| 13 | GAP-8: move accounts on one request | Silent | (1), (2) | R24; C2 adds account-bound things |
| 14 | GAP-6 and F-MNT-1: the start check on approvals | Contradicted (candidate) | (2) | C11; M1's cap on CLAUDE.md |
| 15 | F-MNT-2: the approval trial reruns | Contradicted (candidate) | (2) | N7 |
| 16 | F-SET-3: setup check before each job | Contradicted (candidate) | (2) | N1, N7 |
| 17 | F-STOP-2: cutting a release | Silent | (2) | G11 stops at the close |
| 18 | F-REL-1: development release in each round | Contradicted (candidate) | (2) | F1, F3 |
| 19 | F-SET-8b: deploy tokens in the cloud environment | Contradicted (candidate) | (2) | G10 |
| 20 | P21: lanes and the UX lane | Silent | (1) lightly | C1 |
| 21 | P11 and OT-2: full regression only at release or his word | Contradicted (candidate) | (3) lightly | G6 |
| 22 | F-MNT-7: the two metrics are the standing judge | Contradicted (candidate, by addition) | none | F2, condition 6 |
| 23 | MNT-10: releases name the sizes they were tested at | Silent | (4) lightly | Nothing |
| 24 | MNT-3, MNT-9 | Silent | none | N4, N6 |
| 25 | TM-4, TM-5, TM-10 | Silent | none | Nothing |

## C. Grades in "Against the Process3 requirements" that are too generous

The table grades 25 purposes that "one worker" extracted, not the lines. Of the 54 kept or modified lines in this part, 26 are not named as the source of any purpose in that worker's table (canon_analysis §5): TXT-4, TXT-5, MNT-1, MNT-3, MNT-5, MNT-7 to MNT-11, SHM-1 to SHM-5, P5, P8, P9, P13, P20, P21, P23, GAP-2, GAP-4, GAP-9, GAP-11. Their fate cannot be read from the grades. The same worker listed "One total order" as a mechanism "that is not the purpose" under R17, and wrote that "R15 also needs restating".

| Grade | Why it is too generous |
| --- | --- |
| R1 "Met" | P1 as the owner modified it includes "my time only where it is mine" and "meets every defined requirement". The row's wording drops both, while R3 and R11 admit each is weakened |
| R2 "Met, with the split" | P17 says BOB "decides every technical matter". Moving the process to the owner changes what the line asks. That is a contradiction to put to him, not a way of meeting it |
| R3 "Weakened" | Understated. "Each is a click or a comment" does not describe judging and merging a process change, commissioning a session, changing a budget number in a file, or putting chat remarks in writing. The proposal's own first section calls this a conflict with a requirement he does not negotiate |
| R4 "Met" | The Foundations say "a word you give in chat is written there by BOB". M4 reverses it: a remark "lapses at the end of the run unless you put it in writing" |
| R6 "Met in the preferred form" | The preferred form depends on test 1, which Process3 measured failing 0 of 3. The form recommended to start is attended. In every form, process defects are routed to him by design |
| R12 "Met" | G6 runs the full regression on a schedule. P11 and his ARC-4 decision, made against the suggestion, say release or his word only. The layer tier is absent |
| R15 "Met, restated" | The largest overstatement. P19, P18 and GAP-5 are its sources. The proposal removes the event wake, has no pipeline, accepts an hour between layers and tells sessions that stopping is correct. A restated purpose is a changed requirement |
| R16 "Met, for the first time" | The separation is met. The second half of P3, that the product "resumes on the fixed version", now waits for him; and workflow files on main change during a run when he merges |
| R17 "Met" | "A layer's jobs start together" is graded met here and listed as a conflict with central requirement (3) in the proposal's first section. Carrying a change to users (P5) is not in the row at all |
| R19 "Met" | The second half of GAP-10, that work merges on green without him unless he asks, fails for every pull request touching G2's paths |
| R20 "Met" | The production wall is met. Cutting a development or public release has no mechanism; the feasibility reviewer graded this row weakened for that reason and only the secrets were corrected. The walk's cadence reverses two of his decisions unmentioned |
| R21 "Met by structure" | The structure is "your merge", which the proposal's first section withdraws in favour of limits it calls "unproven" |
| R22 "Weakened" | Understated. The false-done rate is not on the daily report; idle time and his minutes are gone; the two metrics no longer judge anything |
| R23 "Met if the tests run" | A condition is not a grade. The half about his approvals being the one policy loses its start check (C11) and its tranche-open trial (N7) |
| R24 "Weakened" | "Not designed here" is absent, not weakened |

"Ledger lines that end" names eight families. Kept lines in this part that also end or are reversed, and are not named there: the no-approval rule for CLAUDE.md (TXT-1), release-only regression (P11), the pipeline (P18), event wakes (GAP-5), lanes (P21), MNT-3, the answer to a flaw report (MNT-7), MNT-9, MNT-10, onboarding (SHM-3), account moves (GAP-8), setup check, the idle-time and owner-minutes report (GAP-12), the development release in each round, and release cutting. Two more are named only in the lever tables: the approvals check (C11) and the grant trials (N7).

## D. A process flaw found during a build: the documents and the proposal side by side

| Step | Under the documents | Under the proposal |
| --- | --- | --- |
| Who notices | Any session. It files a flaw report by one command, listed at each status (MNT-7). A blocked job sets the blocked state and ends its turn with everything pushed | Any session. It "adds one line to the process log" with the workaround used (N3, WA 3). With no workaround, "the job marks its pull request blocked and stops, and ARCH works on something else" |
| Who decides whether to fix | BOB, which "decides every technical matter" (P17). The test is a measured failure or the owner's word (GAP-3). A real problem must be fixed at its cause: "a workaround for the moment is not a fix" | During a run, no session. "The process is fixed for this run." Only the owner: "You can merge a fix mid-run when you judge it worth it" (N2). Between runs he chooses between priced options (N4); "Repair needs your decision; removal does not" (N5) |
| Blocking or not | Blocking: fixed and adopted in the run (MNT-5). Non-blocking: waits for the next process release and the next tranche (MNT-6) | Both wait for the retrospective by default. A blocking defect "waits for you" |
| Who builds the fix | The process repository under its own thin process, with the last released version: jobs on branches with tests and review (MNT-1, MNT-3). "Answered on main, never fixed in place" (MNT-7) | "A fresh session in a fork", at "a retrospective between runs, when you commission it": at most three changes, each net zero or smaller (N4). For a mid-run fix the proposal does not say who drafts it; G1 has him switch on a limit so sessions "cannot open pull requests or issues there at all" |
| Who adopts | BOB: "one recorded act that moves the pin"; the same job continues and none restarts (MNT-5, JOB-4) | The owner, twice: he merges the fork pull request in the process repository (G1), then the pin, which is one of his paths in the product repository (G2). If a cap is exceeded he must first change the budget number (M1) |
| What the owner does | Nothing. It is reported "in plain words as done". He acts only if the fix needs a grant only he can give, or changes what a line asks | Reads the log and the daily numbers; decides; commissions a session; reads a proposal "with totals before and after"; merges in two repositories; switches the interaction limit off and on. "Perhaps an hour of your attention" per retrospective |
| How long product work waits | Only the blocked jobs, until the fix lands and the pin moves; BOB starts other work meanwhile (GAP-1). A serious flaw pauses the product until the fixed version (P3). No wait on the owner | Non-blocking: no wait, and the workaround stays for the whole run. Blocking: until the owner acts, with no bound. The watchdog emails him after "a set number of hours" with nothing merged |

What actually ran in Process3 was neither column. MNT-6's waiting was held by text; MNT-1, MNT-3 and the flaw command were never built; the sessions that changed the process had no role or rulebook (causal_forensics §1.4). The pin moved 116 times, a median 3 to 21 minutes after each process merge (product_side §4). The proposal answers that record, not the documents' flow.

Where the proposal departs:

1. **From MNT-5 and P17.** The decision and the adoption move from BOB to the owner. The Ledger's line is ended, not bounded.
2. **From the owner's direction on problems (X-1).** During a run a workaround is the prescribed answer for a process problem, where his direction of 2 Nov, repeated 7 Nov, was to find the cause and fix it.
3. **From MNT-7.** A report is recorded and not answered until he commissions the answer.
4. **From MNT-1 and MNT-3.** Process changes are again built outside any process, by a commissioned session, as they were in Process3.
5. **From central requirement (1).** Merging a pull request is not a settings change, and here it happens in two repositories for each change. Commissioning a session is not one either. Changing a budget number is a file change. The proposal's first section admits the merge and proposes limits held in GitHub rules instead; conditions 1 and 4, "What is fundamentally different" item 1, G1, G2, N2, N4, N5 and "Your standing acts are five" all still say his merge. The document was amended at the top and not below.
6. **From central requirement (2).** A blocking process flaw stops the run until he acts. The requirement allows waiting only when "completely blocked with no further work possible without additional user action". Here his action is made necessary by the design, not by the platform: a fix could be drafted, tested and adopted without him, and the wall forbids it.
7. **A limit on the mid-run route.** "More than one process version in a week" is listed as a sign of failure, so the proposal treats a second mid-run fix in a week as a warning, whatever the second flaw blocks.

## E. Owner acts: what the documents accept and what the proposal adds

### Acts the documents accept

| Act | Where | How bounded |
| --- | --- | --- |
| GitHub accounts, branch rules, Actions settings, collaborators, secrets | Setup; developer's steps | At onboarding; "the fewest steps, each with its reason and tested to work the first time"; confirmed once |
| The cloud environment and Claude's GitHub connection, including deploy tokens | Setup; Deploy tokens; Moving accounts | At onboarding, and again on an account move "from a page the process writes" |
| Standing approvals, committed by his own hand to each repository's CLAUDE.md through GitHub's website | Platform section; GAP-6 | "Recorded once"; a missing grant is asked for and then recorded as standing |
| Starting ROOT, and the watcher beside it; replacing ROOT if the watcher declines | Roles | Once, and a rare fallback |
| Answering questions that are his, in one place, numbered | The human and the AI; P21 | "A word you give in chat is written there by BOB"; never asked twice |
| Pause and resume, by his word | PLN-5 | Recorded once by the process |
| Identifying the need for a lane; marking a word as a decision | SES-14; REQ-7 | When he chooses |
| Clearing a blocker only he can clear; an act the judge refused | GAP-1 | Only those |
| Asking for his approval before a particular merge; asking for whole-product checks | GAP-10; ARC-4 | Only when he asks |
| Approving a public release or a rollout in the protected environment | GAP-7; Where the process stops | Per public release |
| One plain request to move accounts | GAP-8 | One request |

### Acts the proposal requires

| # | Act | Item | New? |
| --- | --- | --- | --- |
| 1 | Merge every process change in the process repository | G1, N2, N4, condition 1 | **New.** Not a settings change |
| 2 | Review every product pull request touching `.github/**`, `.claude/**`, `CLAUDE.md`, `CODEOWNERS`, the pin or the walker's step definitions | G2 | **New.** The documents had CLAUDE.md change without his approval and BOB move the pin; the record of 4 and 6 Nov has workflow changes judged by rules so they need not go to him. The walker's steps changed within one round in Process3, so this may be frequent |
| 3 | Create the hourly task; switch it off to stop; in the fallback switch it off and recreate it at each layer close | C2, C3, G9 | **New.** ROOT created its own sweep. Comparable in count to starting ROOT only in the preferred form. A task is not a GitHub or Cloudflare setting |
| 4 | Replace ARCH at each layer close | C3 fallback | **New**, recurring. Process3 closed 13 layers in six days |
| 5 | Start the ARCH session and "look in once or twice a day" | Start smaller, item 4 | **New** |
| 6 | Switch on the process repository's interaction limit for a run and lift it for the retrospective | G1 | **New**, each run. A settings act, so of the allowed kind; GitHub's limit lasts at most six months (levers §1.2) |
| 7 | Stop by locking the integration branch and switching off the task | G9 | Changed form. The lock is a GitHub setting; the task toggle is not. Before, his word was enough |
| 8 | Answer questions as comments on a pinned issue, in his own words; put in writing any chat remark he wants to last | M4, M5 | Accepted in kind; **new burden.** BOB used to write his chat word down |
| 9 | Commission each retrospective, read it, choose among priced options | N4, "What it costs you" | **New.** "Perhaps an hour" each |
| 10 | Decide whether a misfired check is repaired | N5 | **New.** A technical decision that was BOB's |
| 11 | Read "One daily number", and the watchdog's emails | The division, amended; G8 | **New.** GAP-1 had no one watching |
| 12 | Rewrite the approvals in CLAUDE.md to name the new merge act, within 4,096 bytes | G3, M1, run 0 | Accepted in kind; a new instance, at half the file's present size |
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


# [file] trust-layer-review-4nov.md

# Trust layer design review, 4 Nov 2026

Read-only review of tranche f9e82ad, asked for by the coordinator on Bob's word: "a design
review of the trust layer, aimed at simplifying it, not adding to it." No code was changed.

Scope read in full: tool/lib/gate.mjs (548 lines), merge.mjs (706), record.mjs (415),
anchor.mjs (95), workflows.mjs (296), shims/ (process-gate.yml, process-record.yml,
process-dev-release.yml, settings.hooks.json, CLAUDE.process.md), and what they call to decide
trust: github.mjs verifyRow, checks.mjs (generated rows), basered.mjs, found.mjs foundOnly,
p3.mjs record-check. Between 7f50bdd and f9e82ad these trust files grew by 1,527 lines and lost
152 (git diff --stat); workflows.mjs, anchor.mjs and basered.mjs are wholly new.

The security outcomes every proposal is measured against:
- O1: no unreviewed code reaches a trusted branch (main, the tranche).
- O2: no session can widen its own approvals (approvals block, .claude/, config anchored keys).
- O3: the gate runs from a trusted base (its code and policy cannot come from the change it judges).

One framing point first. README.md:129 says the tool's checks hold against mistakes, and that
"deliberate attacks by a session with Write access are held by GitHub's walls (rulesets,
required checks, ...), not by the tool." Most of the 4 to 5 review rounds on approvals,
workflows and generated files were spent closing deliberate constructions (a U+2028 line break
in YAML, two config edits that compose in a line merge, a PR retargeted after its run, a side
branch dated ahead). Either the README's line is the policy, and much of that code can go, or
the tool is meant to stop a hostile session, and then the README is wrong and the walls need
measuring. Bob should pick one; the proposals below assume the outcomes O1 to O3 still hold
against a hostile session, and say where they lean on a wall.

## 0. Fix first: one place where O3 does not hold today

shims/process-dev-release.yml:133-135, job publish, reads the tranche's name from the pushed
commit's own config (`git -C repo show "$GITHUB_SHA:process/config.json"`) and then checks the
commit is an ancestor of `origin/<that name>`. A commit whose config names its own branch
(for example `"tranche": "p3dev-release/x"`) passes trivially. The same step takes
process_repo, the pin and `release.sign_secret` from that commit, and the job holds
`contents: write` and the named secret. Separately, a push trigger runs the pushed commit's
copy of the workflow file, so no check written inside this file can bind a session that can
push the branch: it can push a different file.

Simplest fix, which also removes code: trigger the release by `workflow_dispatch` on the
tranche ref (`gh workflow run process-dev-release.yml --ref <tranche>`), so the file, the
commit, the config and the pin all come from the trusted branch, and put the signing secret in
an environment whose deployment branch rule allows only the tranche. The ancestry check and the
branch-name version parsing go; the version becomes a dispatch input. Lines: about -10 in the
shim, release.mjs `version --branch` simplified. Risk: low. Tests: release.test.mjs, shims.test.mjs.
This needs Bob for the environment (sessions may not change it).

process-record.yml:30 has the same shape (tranche name from the pushed commit) but it is not a
required check, so it only misreports; it can read the name from origin/main's config instead.

## 1. Where each check reads its code and policy today

| Check | Code (tool) from | Policy (config, ledger) from | Workflow file from |
|---|---|---|---|
| gate, job gate | base's `.process` pin (process-gate.yml:57); head's pin at bootstrap (:58); the tranche's pin for the tranche into main when it descends on process3 (:76-87) | base's config (:64), head's at bootstrap (:65); gate.mjs:59 `lastConfigAt(base)`; bootstrap takes the head's RUN_KEYS (gate.mjs:55-71) | the merge commit, so the head's |
| gate, ledger entries and ownership | as above | **the head's** ledger (gate.mjs:103 `entriesAt(root, head)`, used for ownership at :110 and scope) | head's |
| gate, job post | base's pin only (process-gate.yml:151) | base's config | head's |
| record check in the gate | base's pin | `loadConfig(root, base)` (p3.mjs:413); record_since from the head (record.mjs:137); take-in tips from the head's metrics (record.mjs:172) | head's |
| process-record (push) | origin/<tranche>'s pin, else the pushed commit's (:203-204) | the pushed commit's config names the tranche (:30) | pushed commit's |
| record-pr (process3 only) | main's tool | main's config | main's (pull_request_target) |
| merge (job PR) | BOB's checkout of the tool | `loadConfig(root)`, the **working tree** (merge.mjs:118); entry from the merge base (:157) | n/a |
| merge --plain | BOB's tool; `processRepo()` is the tool's own clone (merge.mjs:448) | base's last config (:610), base's ledger (:632), base's generated rows | n/a |
| close workflows (rules 1 to 4) | BOB's tool | structure from the base's copy of each workflow (workflows.mjs:293); record_since from the head (:233); pin and gate shim at each gated commit (:216) | n/a |
| dev release | pushed commit's pin | pushed commit's config, tranche name and secret name (:133-141) | pushed commit's |
| setup check | the pin | settings.hooks.json at the pin | n/a |

Today there are at least six different answers to "what is trusted": the base commit, the
base's last config, the head (bootstrap), the tranche's pin (into main), the working tree
(merge), and the pushed commit (release, record push).

**Proposed single rule.** Code and policy come from the current tip of a trusted branch, read
by name from origin: for a pull request into X, the tip of X; for the tranche into main, the
tranche tip itself (it is a trusted branch, and the head must equal it). The tool is the
`.process` pin at that tip; config, ledger entries, generated rows and the owner are read from
that same tip. Nothing in the head is read except as data being judged. A missing config or pin
at that tip fails closed; there is no fallback.

What the rule removes or simplifies:
- The tranche-into-main pin exception (process-gate.yml:68-87, 20 lines): replace with one
  test, `HEAD_SHA = origin/<tranche>` tip, then the tranche's pin judges.
- Bootstrap routes (section 2, item B).
- `lastConfigAt` (anchor.mjs:66-70) and its four callers: a deleted config fails closed.
- merge.mjs:118 reads the working tree's config; it should read `origin/<tranche>`'s.
- gate.mjs:103 reads the head's ledger for ownership; reading the base's (as merge already does
  at merge.mjs:157) makes the gate and merge agree.

## 2. Special cases, carve-outs, bypass flags and tolerances

Each with where it is, what it protects, and whether a general rule makes it unnecessary.

A. **Tranche cover** (gate.mjs:336-404 trancheCover, :423-458 jobMerge, :413-422 branchBound,
github.mjs:148-156 the `merged` branch of verifyRow). Protects the 45 min cap on the tranche
into main by skipping suites of files a green job merge already gated. Needs title regexes,
tree equality, PR reads, branch binding against retargeted PRs, provider-change propagation.
General rule that removes it: every tranche commit's tree is a gated merged result by
construction. merge already gates the merged result for job PRs (merge.mjs:200-210); require
"branches up to date" on the tranche's ruleset so plain PRs are too, and make a PR's gate scope
include modules that use the changed ones (the provider rule, moved to scope selection). Then
the tranche into main only checks that the tip's merge was gated green (one verifyRow) and
reruns what was tolerated on the way. Needs Bob's ruleset change.

B. **Bootstrap, the first close** (process-gate.yml:55-65 and :149-152; gate.mjs:44-71
gateConfig and RUN_KEYS; merge.mjs:525-535 bootstrapHead, :612-618, :674-678, :682; anchor.mjs:72-73
isBootstrap). Protects a product whose main has no Process3 yet. General rule: onboarding ends
with Bob's own website commit putting `process/config.json` and `.process` on main, so no base
is ever without Process3. One owner act per product, which README's Onboarding already asks of
him (values confirmed once). Check first: if civicsmith-copy's main now holds both files (its
first close landed on 4 Nov), this route is dead code for the only product.

C. **record_since and earlier work** (record.mjs:125-150 recordSince, :247-249 onBase, :362-376
the record_since half of the config check; workflows.mjs:222-240 earlierWork; p3.mjs:415).
record_since is "used only while the base has no config" (record.mjs:138). Under B's rule every
base has a config, so recordSince always returns null and all of this goes.

D. **Take-in tips** (record.mjs:152-221 takenIn, p3.mjs:416-419, job.mjs:837). Protects the
record check from flagging pre-Process3 commits that a take-in merged. General rule: a take-in
brings earlier work in as one new commit of its tree (not a merge of its history), so no old
commit is ever in a checked range. The old branch keeps its history. Removes about 70 lines
and the six-step honour test.

E. **Base-red tolerance** (gate.mjs:186-200; basered.mjs, 114 lines; revertCheck `tolerated`
gate.mjs:526-547; receiptAgrees base-red branches :296-303; job.mjs callers). Protects a PR
from failures already on the base. Under A's rule the tranche is green at every tip, so
base-red only covers flakes and drift. It can go once A holds; until then keep it. Highest
risk to throughput, so ranked low.

F. **Records-only fast paths for a ready job PR** (gate.mjs:124-152 sinceGreen, stands,
receiptRun; :309-320 measuredBy; :254-256 refresh carry-over; :266-275 receipt measured;
merge.mjs:299-306 unagreed). Protects gate minutes on records-only pushes. Three review rounds
(copy PRs 105, 247). General rule: a ready job PR's gate always runs its module's suite; keep
the record fast path only for drafts and plain PRs. Cost: one suite run per records-only push on
a ready job PR, which merge's merged-result push mostly triggers anyway.

G. **Generated-file refresh by a plain PR** (gate.mjs:120-127, :240-262; checks.mjs:96-120
refreshOthers, refreshCheck; merge.mjs:573-584 refreshGate, :646-662). Protects committed
generated files from hand edits. Five review rounds (PR 95). General rule: no module's generated
file is committed. JOB-8 already forbids a job committing one (checks.mjs:70 committedGenerated),
and buildGenerated (gate.mjs:172-179) builds untracked rows before the suite, as deploy and
release do. Extend JOB-8 to every PR and the refresh route goes. Bob's 4 Nov approval for the
design stream already allows "stop committing a generated file ... and have it built where it
is needed".

H. **Found marks in a requirement file by a plain PR** (merge.mjs:633-645; found.mjs:51-89
foundOnly, a markdown diff parser). found.mjs already has a second home for marks,
`process/found/<module>.md` (found.mjs:15-17), which is a records path. General rule: found
marks always go there. The exception and foundOnly go; the module's requirement file stays
job-only.

I. **Close workflow changes, rules 1 to 3 and shapes S1 to S3** (workflows.mjs, all 296 lines;
merge.mjs:504-516 the `close` branch). See section 3.

J. **Approvals and settings across merges** (record.mjs:105-123 introduced with guarded and
judged; :259-283 landed, onTrusted, cleanFrom, mergeBases; :322-333 fromTrusted, carried
"review A"; :52-71 ownerBlock per ref). Protects O2 for merge commits that carry an old block
from one side. See section 3, item 2.

K. **Anchored config keys** (anchor.mjs:8-59 keyAt, keySetAt, unanchored; :81-95
mergedUnanchored, a merge-tree composition check; merge.mjs:473-489 pinChange). Protects O2 for
process_repo, tranche and approvals. Duplicated: record.mjs:362-376 judges the approvals key in
the config again, per commit, with its own JSON reading. See section 3, item 3.

L. **Size waiver** (record.mjs:350-355, :388-401). Oversize blobs up to 2x the limit are waived
when the head is within it. Reasonable and small; keep.

M. **Shallow cuts** (record.mjs:232-236, :298-305). Keep: fails closed, 10 lines.

N. **Draft read live** (gate.mjs:85-101). Keep: small, fixes a measured race.

O. **mergeRowSince rerun path, job cost rerun** (merge.mjs:25-29, :140, :197-218). Not trust;
bookkeeping. Out of scope, noted for the next simplification pass.

## 3. Allowlists of exact shapes or hashes instead of parsers

1. **Workflow YAML (workflows.mjs).** It reads YAML as lines with an LCS diff (`hunks`,
   :69-93), detects run blocks, path lists and matrix rows by regex (:104-149), and judges each
   hunk (:152-188), plus plainText for line-break tricks (:50-64), plus rule 1, which walks the
   tranche's first-parent history and binds each commit to a gated PR (:190-281). It took four
   rounds on PR 98. S1 already allows any shell inside an existing `run:` block, so the
   security it buys is "no new key, job, permission or event", which a frozen file gives too.
   Proposal: freeze every product workflow file. Each must equal the pin's shim, or a blob hash
   listed in an owner-set allowlist (a file only Bob's website commit changes, like the
   approvals). Product logic that changes moves out of YAML into scripts the frozen file runs
   (`run: ./ci/<name>.sh`, owned by a module, gated as code), and matrices and path lists into
   a JSON file read with `fromJSON`. Same reach as S1 to S3 today (arbitrary commands, no new
   jobs or permissions), no parser. Removes workflows.mjs (296) and the close branch of
   workflowChanges (about 10). One migration on civicsmith-copy, through PRs.

2. **Approvals block and .claude/ settings (record.mjs).** Judged per commit, with special
   handling for each way a merge can carry an old version. What lands on a trusted branch is
   the head's tree, and process-record on push is advisory, so the per-commit walk does not buy
   O2 for trusted branches. Proposal: judge the net state. For each guarded path (approvals
   block, .claude/**, .mcp.json, config approvals), the head's version must equal the trusted
   tip's (base, origin/main or origin/tranche), or the newest first-parent commit that set it
   must be the owner's website commit. Keep the per-commit walk only for size and transient
   paths, which history keeps. Removes introduced's guarded logic, cleanFrom, carried, landed,
   mergeBases and most of ownerBlock: about 120 lines. The "approv" word heuristic on any
   CLAUDE.md line (record.mjs:358-361) is a markdown parser of intent; under the net rule,
   any change to an instruction file outside its owner-set version could need the owner's
   commit instead, which is one blob comparison.

3. **Anchored keys (anchor.mjs).** Move process_repo, tranche and approvals out of
   process/config.json into their own file (process/anchor.json). Rule: its blob at the head,
   and in the merge-tree result, equals the base tip's blob, or the commit that last set it on
   the head's first-parent history is the owner's website commit not already in the base.
   Blob comparison replaces keyAt's JSON reading, duplicate-key handling and per-key loops, and
   drops record.mjs's duplicate config-approvals check. About 50 lines.

4. **Gate rows (verifyRow, checkRow, postRow).** Already close to an allowlist: a fixed set of
   fields with exact validators (gate.mjs:463-470) and a byte comparison with the run's own
   artifact. Keep as it is.

5. **Ledger and metrics JSON.** Read with JSON.parse as data, not to grant trust beyond
   ownership paths; under section 1's rule the paths come from the base. Keep.

## 4. Dead or duplicate code

- gate.mjs:288 `if (pr && post) io.addComment(...)` and p3.mjs:271 `post: !a['no-post']`: the
  shim always passes `--no-post` (process-gate.yml:109), so the gate never posts in CI. Posting
  from the process that ran product code is the very thing the two-job split forbids, so the
  default is the unsafe one. Remove the flag and the post; postRow is the only writer. 4 lines.
- merge.mjs:28 re-exports `isBootstrap, keySetAt, processRepoSetAt` from anchor.mjs; only
  tests import them from merge (merge.test.mjs:427). processRepoSetAt has no caller in the tool.
- Duplicate helpers: `blob` (workflows.mjs:39) and `blobAt` (anchor.mjs:10); `pinOf`
  (workflows.mjs:215) and `pinAt` (anchor.mjs:14); `JOB_MERGE` (workflows.mjs:35) and
  `MERGE_TITLE` (gate.mjs:335); `isJobRef` (workflows.mjs:37) and `isJob` (merge.mjs:441);
  `isAnc` twice (gate.mjs:445, workflows.mjs:48); `entriesAt` three times (gate.mjs:23,
  carry.mjs:20, merge.mjs:632 inline); the no-renames name diff three times (gate.mjs:34,
  merge.mjs:166 and :620, workflows.mjs:266); metrics `rowsAt` three times (merge.mjs:29,
  gate.mjs:435, record.mjs:184). About 30 lines into util.mjs.
- Two `takenIn` functions with different meanings (record.mjs:172 tips, carry.mjs:24 PR
  numbers). Rename one.
- Two implementations of "the approvals in the config changed": anchor.mjs unanchored (key
  `approvals`) and record.mjs:362-376. Section 3 item 3 keeps one.
- Two ownership checks: gate.mjs:110 from the head's ledger, merge.mjs:157-167 from the merge
  base. merge's is the one that holds (BOB's tool); the gate's is early feedback and should
  read the base (section 1).
- `waitForGate` (merge.mjs:47) and `waitForChecks` (:542) are two waits with the same cap logic;
  one could take a list of names. Not trust, about 25 lines.


The Osk store took in 2 willows.

## 5. Proposals, ranked by lines removed per unit of risk

Risk: 1 low (behaviour for the current product unchanged), 2 medium (a migration or a
measured wall), 3 high (changes throughput or needs a new wall). Lines are estimates of
non-test .mjs and shim lines removed, net of what replaces them.

| # | Proposal | Lines | Risk | Ratio | What could break | Tests that cover it today |
|---|---|---|---|---|---|---|
| 1 | Retire bootstrap and record_since: onboarding ends with Bob's website commit of config and pin on main (2B, 2C) | ~175 | 1 | 175 | A new product cannot onboard without that one owner act | gate-bootstrap.test.mjs (7), bootstrap-close.test.mjs (10), record.test.mjs record_since cases (40 mentions), close-workflows.test.mjs (2) |
| 2 | Freeze product workflow YAML: shim or owner-allowlisted hash; logic in scripts (3.1) | ~300 | 2 | 150 | The copy's workflows need one migration; a matrix change becomes a JSON change | close-workflows.test.mjs (14), shims.test.mjs, merge.test.mjs workflow cases |
| 3 | Dead and duplicate code, including removing the gate's in-process post (4) | ~60 | 0.5 | 120 | Nothing in CI; tests that import from merge.mjs move | gate.test.mjs, merge.test.mjs, github.test.mjs |
| 4 | Tranche gated by construction (ruleset up to date on the tranche, reverse-dependency scope); drop the tranche cover and the tranche-pin exception (2A, section 1) | ~150 | 2 | 75 | Needs Bob's ruleset change; plain PRs must be brought up to date before merge; larger PR gate scope | main-gate.test.mjs (17), shims.test.mjs |
| 5 | A ready job PR's gate always runs its suite; drop measuredBy and record-since-green for it (2F) | ~70 | 1 | 70 | More gate minutes on records-only pushes | gate.test.mjs, merge.test.mjs unagreed cases |
| 6 | Never commit module generated files; drop the refresh route (2G) | ~100 | 1.5 | 67 | Anything that reads a committed generated file must build it first (design stream files) | generated-plain.test.mjs (19), generated.test.mjs, checks.test.mjs |
| 7 | Approvals and settings judged at the head's net state (3.2) | ~120 | 2 | 60 | A commit in a range that briefly carried an unapproved block is no longer named (it never reaches a trusted branch) | record.test.mjs, record-tranche-merge.test.mjs, shallow.test.mjs, setup.test.mjs |
| 8 | Base-red goes once 4 holds (2E) | ~180 | 3 | 60 | A flaky or drifted tranche blocks every PR until fixed forward | base-red.test.mjs (22), gate.test.mjs |
| 9 | Take-ins as one tree commit, drop takenIn tips (2D) | ~70 | 1.5 | 47 | Old commit authorship is on the old branch only | take-in-record.test.mjs (14), job.test.mjs take-in cases |
| 10 | Found marks only under process/found (2H) | ~45 | 1 | 45 | Readers of marks in requirement files read both places until moved | found.test.mjs, merge.test.mjs found cases |
