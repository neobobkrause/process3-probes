# [file] audit_C.md (continued)


### Setup: the conditions the work stands on

| Id | Requirement | Kind | Process4 result | Central | If not met |
| --- | --- | --- | --- | --- | --- |
| F-SET-1 | Owner's word, 2 Nov: every account, setting and branch rule is listed, checked before each job starts, and set by the developer "through the fewest steps, each with its reason and tested to work the first time" | Purpose | **WEAKENED.** Listed: N8. Tested first: tests 2, 3, 6, 7. Checked before each job: gone. Fewest steps: the owner's steps grow (section E) | (1), (2) | Proposal must change on the number of steps. The per-job check: see F-SET-3 |
| F-SET-2 | The setup list names each condition: what, why, its value, who sets it; reviewed like code | Mechanism | **MET** (N8), as a list of headings. What, why, value and who are not written | (1) | |
| F-SET-3 | `setup check` reads every condition at onboarding and before every job start; "a missing one stops the start"; it only reads | Mechanism for a purpose (no job meets a missing setting as a refusal) | **CONTRADICTED.** The only tool left "cannot refuse, hold or write" (N1); N7 deletes the "tranche-open grant trials". The proposal does not name setup check as removed | (2) | Candidate for the owner to change: it refused every job start on the copy after he applied new settings, read a Cloudflare 429 as "missing" and stopped a pin move, and grew to about 15 minutes twice per pin move; it was cut to once per pin on his word on 9 Nov (change_sample row 15, removal 296). The proposal must say what tells him a setting is missing before a run stalls on it |
| F-SET-4 | One document, the developer's steps, lists only the acts the developer must take, each with why; each product gets one onboarding page with its names filled in; "BOB does every other part of onboarding" | Purpose | **WEAKENED.** N8 lists; R3 says each act "is walked through". The per-product page and "every other part" are not designed. Run 0 gives him five kinds of act, including merging a pull request and creating a task | (1) | Proposal must change |
| F-SET-5 | Sessions act on GitHub as a collaborator that cannot change settings; the owner acts as the owner | Mechanism | **MET** (G1, G2, M4) | (1) | |
| F-SET-6 | GitHub holds: every branch refuses deletion and force-push; main and the tranche take changes only by pull request, merge commits only, with the gate and record required. The deny list holds the rest, including the plain merge routes | Mechanism | **MET DIFFERENTLY** (G2, G3, G4, C7). The record check is deleted (N7). Force-push is denied in the settings file (C7), not stated as a GitHub rule on every branch, though the proposal's own rule is "Put every must-not on GitHub's side" and it now reads in-flight work "from branches, which survive" | none | Proposal should state whether the undeletable, no-force-push rule on every branch stays |
| F-SET-7 | A session reads the deny list only when it holds one repository and starts from a branch that carries it; every session starts from the tranche | Mechanism | **MET** (C4, C7), subject to tests 5 and 6 | (2) | |
| F-SET-8a | Owner's word, 2 Nov: "The process deploys so walkers can run, so a project runs unattended only if it can deploy" | Purpose | **MET DIFFERENTLY** (F1, F3, G10): a workflow deploys and walks. Unproven until test 7 | (2) | |
| F-SET-8b | Deploy tokens are added to the cloud environment as environment variables; setup check confirms each by name | Mechanism | **CONTRADICTED.** G10: "The eleven secrets now in the sessions' cloud environment, including the release seed, are removed from it." The development token moves to a GitHub `dev` environment | (2) | Candidate for the owner to change: the session environment held a Cloudflare token and signing seeds beside product code (redteam_feasibility, finding 11), against the Foundations' own rule that production keys never sit there; the token check misread a 429 and stopped a pin move (change_sample removal 235) |
| F-SET-8c | Deploying, releasing and acting on a live site are BOB's acts, not a job's | Purpose | **MET DIFFERENTLY** (F1: "never from a session"; ARCH dispatches) | none | |
| F-SET-9 | The checks hold against mistakes and outsiders' fork pull requests; a deliberate attack is held by GitHub's walls and "your approval for production"; a finding that needs a deliberate attack "is a known limit, not code" | Purpose | **MET** (Known limits; WA 5) | none | |

Moving accounts is graded at GAP-8.

### Maintenance, certification and the two health metrics

| Id | Requirement | Kind | Process4 result | Central | If not met |
| --- | --- | --- | --- | --- | --- |
| F-MNT-1 | Every session starts at the tranche's tip by commit and first verifies the pin, HEAD and the approvals block; on a mismatch "it acts on nothing"; a change to approvals is taken up by replacing long-lived sessions | Mechanism | **CONTRADICTED** on approvals (C11, quoted at GAP-6). Start by commit is met (C4) | (2) | Candidate for the owner to change; evidence and its limit as at GAP-6 |
| F-MNT-2 | Re-test at each model release and each Claude Code version change; the approval test reruns too (the tranche-open check, and an unnamed act with and without CLAUDE.md) | Mechanism | **CONTRADICTED** on the approval test. N7: "Deleted with no replacement: ... tranche-open grant trials". Claude Code version changes are not mentioned. The component re-test is met (M6) | (2) | Candidate for the owner to change (N7: "None has a recorded catch"; the confirming round was 0 refusals in about 450 acts). But the proposal changes the approved acts and the approvals text and offers one trial (test 3); it must say how a refusal of an approved act is seen. The daily report carries no refusal count |
| F-MNT-3 | Per tranche: commits by purpose, sessions per job, gate runs per merged job, restarts, tokens by role; the tranche report states elapsed time, work done, deferrals, cost, the overhead share, BOB's idle time and the owner's minutes | Mechanism for a purpose (the process is honest about its cost) | **WEAKENED**, admitted in part at R22. The daily report has nine items; of the list here it keeps cost "where it can be read" and a proxy for gate runs. No tranche report | (1), (2) | Proposal must change or the owner accepts the shorter list |
| F-MNT-4 | False-done rate: the share of COMPLETE claims refuted by the gate's re-run and revert check, from the first tranche | Purpose | **WEAKENED.** R22: it "comes from the revert check's count". It is not on the daily report, and the suite's refutations are left out | none | Proposal must change. The measure earned its place: "20 false 'complete' claims refuted by the suite in one day" (change_sample §5) |
| F-MNT-5 | Cost per surviving pull request: tokens or dollars per pull request still in place after a two-week revert window | Purpose | **WEAKENED**, admitted: cost "is not yet confirmed" readable. The survival window is not carried | none | Cost half: candidate for the owner to change, since sessions "frequently could not obtain a cost figure" (product_side, limits). Survival half is readable from git (98.8%; product_side §5) and should stay; the map shows it was due to be read on 16 Nov |
| F-MNT-6 | Usage is read by an allowed route or named unmeasured | Mechanism | **MET** (daily report: "otherwise 'not measured'") | none | |
| F-MNT-7 | The process is "judged by two numbers"; they "are the standing judge of every other line" | Purpose | **CONTRADICTED.** F2: "'Walk steps passing' is the deciding number". Condition 6: "The scoreboard is the product." A check "stays on its count of real catches". The two metrics judge nothing | none | Candidate for the owner to change by addition: both metrics would have read healthy (218 of 220 complete, 98.8% surviving) while 147 of 157 live steps failed (product_side §1, §9.2). That is evidence for adding the walk as a judge. It is not evidence for dropping the two, and the proposal does not tell him they stop judging |
| F-STOP-1 | The process owns what can be proven in git and CI and nothing on a live site; rollout and operations are the owner's, through the protected environment | Purpose | **MET** (G10, G11) | (1) | |
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


# [file] redteam_corruption.md

# Process4 draft: adversarial review (corruption, stall, loopholes)

Reviewed: `recommendations_draft.md` against `causal_forensics.md`, `change_sample.md`, `product_side.md`, `canon_analysis.md` (sections 4 to 6) and `levers_github_cloudflare_product.md`, with spot checks in both repositories (read-only). Twelve findings, ranked by likelihood times damage. "Evidenced" means the record or a platform document says it; "conjecture" means my reasoning. Platform facts I state from memory and did not re-read today are marked "from memory".

Short verdict: the wall around the process repository is sound and I could not break it. The draft then assumes that walling the place where Process3's growth happened removes the growth. The record says growth goes to whatever is uncapped (prompts flat at 4,032 to 4,044 bytes, code 16 times larger). Process4 leaves uncapped: everything on the Claude side (task prompts, session prompts, messages, subagents), the product's tests and walker, and the owner's own merge button. It also turns every defect in the frozen parts into a stop only the owner can clear, and gives him a once-a-day signal that does not see most of those stops.

---

## Findings

### 1. The first gate defect in run 1 stops all product work, and only the owner can clear it

(a) Scenario. The gate is rebuilt before run 1 (sharded, cached, containerised, called from another repository at a SHA). On day 1 it has a defect: a shard times out, a cache key is wrong, the Playwright container lacks something, the plan step maps a path to no module. Every job pull request is red or pending. Sessions cannot touch `.github/**` or the process repository, so D4's "workaround and one line" has no workaround to offer. N3 then applies: every job sets blocked and stops, BOB has nothing to start, and the owner is told by a daily workflow. The repair is an owner merge in the process repository plus an owner merge of the pin, which is a "process change during the run". The success test (zero process changes, owner under 15 minutes a day) fails on the first day by construction, or the owner starts treating gate fixes as exempt, which is Process3's "during the first build, changes are expected" (licence L9) again.

(b) Evidence. Evidenced: the Process3 gate needed repeated repair for environment reasons, not logic: timeout 45 to 90 minutes after two cancellations (PR 147), 41 of 113 tests ENOENT (PR 80), `ubuntu-latest` moving and breaking the browser install (levers 3.2), three rehearsals that each "needed a follow-up commit because CI's environment differed from a session's" (PR 283). `process-gate.yml` went 77 to 273 lines through pin moves. Spike S5 measures speed on one module, not correctness across 220. From memory: re-running a failed pull-request run reuses the original merge commit, so after the pin is fixed every open pull request needs a new push to pick the fix up.

(c) Smallest change. Three edits, no new standing mechanism. (i) Before the freeze, replay 20 to 30 pull requests already merged in Process3 through the new gate, once, with no sessions running. (ii) Change the success test from "zero process changes" to two counts: session-originated process changes (must be 0) and owner gate repairs (expected to be above 0 in run 1, reported). (iii) Say in the draft that a gate defect ends the run, and that this is the designed outcome of a short first run, so nobody builds around it.

### 2. Pull requests get stuck with no event to wake anyone, and the watchdog neither runs often enough nor looks at the right thing

(a) Scenarios, all without an owner present.
- Base red: a merge breaks module X on the integration branch. Every open pull request touching X is red through no fault of its own. The fix lands. Nothing re-runs: the required check is non-strict, so a base move triggers no run, and a manual re-run reuses the old merge commit. The jobs were woken once by the red check and have nothing further to wake them.
- Textual conflict: GitHub builds no test merge, so the gate never starts, the check stays "expected", there is no red event, and auto-merge waits for ever.
- Dead or paused job (three classifier refusals, a permission prompt, a crash): its pull request stays open, so `status` never lists the module as ready, and its dependants (median 71 transitive) never become ready.
- BOB dead: no pull request is "ready but unmerged", because ready ones auto-merge. G8's listed signals all read healthy.
- Wrong requirement: the job blocks correctly, and everything above that module waits silently.
In each case the draft's answer is the watchdog, which runs "once a day". Time to notice is up to 24 hours plus N. The emailed failure goes to whoever last edited the workflow's schedule; if run 0's clean-up pull request is authored by the commissioned session, that is the session account.

(b) Evidence. Evidenced: "so no merge waits on checks GitHub never starts (copy PR 108)" (PR 85). 48 of 165 job blocks cite "the suite already red on the tranche before the job started"; a base-red exemption had to be built (PR 101) and repaired four times. "A BOB waiting on a gate goes idle with no wake" (coordinator log, 6 Nov 11:51) and it was a coordinator, a role now deleted, who nudged it. A lane session sat waiting on a permission prompt until a later sweep change named it (C15, PR 219). 9.3 hours with no commit of any kind on 7 Nov. Levers 5.2: "Notifications for scheduled workflows are sent to the user who initially created the workflow". Platform fact from this session's own tool definitions: "A PR's events go to one session at a time", so C2 (BOB subscribes to pull-request events) and C3 (each job subscribes to its own) cannot both hold, and a dead job's pull request delivers its events to nobody.

(c) Smallest change. Replace G8's stall list with one signal computed from git alone and checked hourly: "no merge into the integration branch for N hours while unmerged modules remain". Keep the daily comment daily. The owner pastes the workflow file himself. Put two acts on the job's "may do without asking" list: merge the integration branch into your own branch; close your pull request and stop. Give BOB's hourly text one clause inside its byte cap: for any job pull request with no push in N hours, close it and start the module again. Delete C2(a) (BOB's pull-request subscription), since the platform does not allow it alongside C3.

### 3. The effective process moves to the Claude side, where nothing is walled, capped or counted, and the "process changes: 0" line cannot see it

(a) Scenario. The draft says "the hourly task's prompt IS BOB's whole standing instruction" and "BOB does not add rules to a START". Both are sentences. BOB types the START into `create_session` (a free-text `prompt`, plus `append_system_prompt`); nothing compares it with the rendered template. BOB can rewrite the prompt of the task bound to it. BOB can message any job at any time. Any session can create scheduled tasks and helper sessions. Any job can brief its own subagent however it likes, as often as it likes. After a week: the hourly prompt carries six "also check" clauses; STARTs carry a paragraph of "lessons"; there are three extra scheduled tasks (a walk reminder, a "flow check", a retrospective prep); every job runs a self-briefed cold review before marking ready and fixes all of it. The daily report prints "process changes during the run: 0" throughout, because it counts commits to paths that the wall already holds at zero.

(b) Evidence. Evidenced: the coordinator's hourly task "now also tracks layer 6 close and Bob's SLB/AUD answers" (log, 5 Nov 23:58), then ran `github audit` each hour (forensics 3E); coordinators carried three to five scheduled tasks each (handoffs 4nov-c to 8nov-c); "only ROOT's own session can update its trigger's prompt", so the bound session can; "MY STANDING RULES TO BOB" and "told BOB '6 at most'; BOB followed for ~6 h" show messages working as rules; builders' ad hoc cold reviews bypassed the tool's restrained brief, and 102 of 104 findings were acted on. Growth went wherever there was no cap (forensics driver 3).

(c) Smallest change. Walls and one honest label. (i) The owner creates the one hourly task; its prompt is a single line: "Read `bob.md` at the pinned process SHA and do it." The text then lives behind the process wall and under the byte test. (ii) Protected settings deny `create_trigger`, `update_trigger`, `delete_trigger` and `send_later` for every session, and the general-purpose subagent for jobs, leaving the read-only explorer and the fixed reviewer. Add these to spike S6, which already asks whether a deny removes an MCP tool. (iii) Rename the report line to "commits to guarded paths" so nobody reads it as "the process did not change". Accept as a known limit that BOB's messages cannot be walled; finding 4 removes most of their persistence.

### 4. A long-lived BOB is the handoff chain in one body

(a) Scenario. BOB "keeps nothing durable in itself", but its compaction summary is durable: it carries "standing decisions", owner remarks, and holds. Restating the role every hour does not remove what the summary holds. Owner chat rulings that M4 says expire live exactly there. An owner edit to CLAUDE.md never reaches a session that started before it (C8), and BOB started before everything.

(b) Evidence. Evidenced: 25 coordinator takeovers, each note re-growing "Rules in force" within 24 hours of handoff 5nov-g's "this page carries no rules"; 21 items marked as the owner's across ten handoffs, 14 of them mechanisms; "about 6 job sessions" recorded as his agreement. Conjecture: a compaction summary behaves like a handoff note. That is what S4 would be testing, and S4 as written only tests that BOB resumes, not what it carries.

(c) Smallest change. A deletion: BOB is not a session. The hourly task starts a fresh session each firing (the platform offers this), which reads `status`, starts jobs, and ends. That removes compaction, S4, the "BOB dies" case, the ROOT-restoration clause and the stale-CLAUDE.md problem, and meets R13 outright. The owner talks to any session he opens. Cost: a newly ready module waits up to an hour for the next firing. Accept it. One thing to check in the spike: the tool text says deleting a scheduled task deletes the sessions it started.

### 5. The owner's merge button is the remaining route for mid-run process change, and the record says he presses it

(a) Scenario. Day 3, the walk number falls or the account is flagged again. The owner asks BOB "why did this not get caught, can we prevent it". BOB cannot push to the process repository, but any session can fork it and open a pull request (levers 1.2), and the owner receives a green pull request with a merge button. Or he ends the run, merges, and starts a new run the same hour: N2's "only between runs" is satisfied and the pin has moved mid-work. Or a session drafts a CLAUDE.md paragraph and he pastes it.

(b) Evidence. Evidenced: 151 of 159 drafted canon lines accepted; 20 audit lines answered in three minutes, none dropped; four anticipation requests in 26 hours on 6 to 7 Nov, each returned as a subsystem; 16 owner patches to the product's CLAUDE.md in nine days, with session-written drafts in `notes/` (`claude-md-approvals-draft-4nov.md`, `draft-approvals-split-8nov.md`); owner inputs "sufficient whenever [they] came as a question about a failure" (driver 9). Of the six practices: O3 (totals) and O4 (one number) are realistic because the artefacts are built that way. O1 depends on BOB volunteering a number and is not in BOB's text. O5 depends on finding 4. O2 and O6 are pure willpower and are the two the record shows failing under stress.

(c) Smallest change. Walls on the owner's side, set by him once. (i) During a run, set the process repository's interaction limit to collaborators only, so no session can open a pull request or issue there; lift it for the retrospective. (ii) Process repository ruleset: the caps test is a required check with an empty bypass list, so even the owner cannot merge over a cap without first editing the cap in a visible commit. (iii) One count on the daily comment: process versions pinned in the last seven days. Accept as a known limit that the owner can still override all of it; the aim is that it takes him three deliberate acts, not one click.
