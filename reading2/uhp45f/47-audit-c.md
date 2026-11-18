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
