| 13 | Set the cloud environment variable that switches auto memory off | C8 | Once | N | A Claude setting |
| 14 | Commission the session that builds the Process4 kit in a fork | Run 0 step 2; N6 | Once | N | Starting a session with an instruction |
| 15 | Have the gate replayed against 20 to 30 merged pull requests and set the runner-minute budget from it | Run 0 step 3; G5; N6 | Once | N | Commissioning; deciding a number held in a file |
| 16 | Merge the kit as the first process version | G1, N2, N6 | Once | N | Merging |
| 17 | Merge the clean-up pull request on the product, which also puts the workflow files on main | P1; run 0 step 4; G8 ("Workflow file you merge") | Once | N | Merging |
| 18 | Run or commission the seven one-hour tests, and do his side of tests 2, 3 and 7 | "Before run 1" | Once; again at each model release (M6) | N | Commissioning; trying merges |
| 19 | Start the ARCH session | Start smaller 4 | Once in the small start; recurring whenever that session is exhausted | N | Starting a session |
| 20 | Decide whether type-checking and lint are added | P5 | Once | N | A decision delivered in words |
| 21 | Conditional: move both repositories to a free GitHub organization | G6 | Once, if more than 5% of merges break the integration branch | B | Account and ownership, not a permission or rule |

**Recurring.**

| # | Act | Item | How often | Class | Why |
| --- | --- | --- | --- | --- | --- |
| 22 | Merge each process change | G1; N2; N4; six conditions 1; "What reaches you" | At least once per run; mid-run "at any moment" for a blocking defect; "expected in a first run" | N | Merging. Process3 merged 294 process changes in nine days |
| 23 | Review and merge every pull request that touches his paths in the product: `.github/**`, `.claude/**`, `CLAUDE.md`, `CODEOWNERS`, the process pin, the walker's step definitions, the reviewer's brief | G2, F2, C7, C10 | Each process version, each walker-step change, each settings or workflow change | N | Reviewing and merging |
| 24 | Switch GitHub's interaction limit on at the start of a run and off for the retrospective's fork pull request | G1 | Twice per run | A | Moderation setting |
| 25 | Stop and resume, part one: lock and unlock the integration branch | G9 | On demand | A | Ruleset lock |
| 26 | Stop and resume, part two: switch the hourly task off and on | G9 | On demand | N | A Claude task toggle |
| 27 | Answer questions in the pinned issue "in your own words" | M5; "What reaches you"; N5 | Unbounded, "batched" | N | Writing a comment |
| 28 | Put any word he wants to outlast a run in writing as a commit, review or comment | M4 | Whenever he wants a remark to hold | N | Writing; a commit is a file edit |
| 29 | Read the daily report (nine numbers) and watch the six signs of failure | Daily report; "Signs that it is going wrong"; division table | Daily | N | Reading |
| 30 | Respond to the watchdog's failure email | G8 ("GitHub emails you. It repairs nothing.") | At every stall | N | The response act is not defined; in practice starting or replacing ARCH |
| 31 | Commission a retrospective | N4 | Per run | N | Starting a session |
| 32 | Read the retrospective (up to three priced changes plus "change nothing"), choose, and decide each repair | N4, N5; "What it costs you" | Per run, "perhaps an hour" | N | Reading and deciding |
| 33 | Change a budget number before a change may exceed it | M1, N1, G5; Known limits | Occasional | N | A file edit through a merge |
| 34 | Approve a public release in `production` | G10, G11 | Per public release | B | An approval click, not a setting. His own rule (GAP-7) |
| 35 | Fallback form only: replace ARCH at each layer close and switch the old task off "in the same step" | C3; "What reaches you" | Per layer close (Process3: 13 closes in 5.3 days) | N | Starting a session; task acts |
| 36 | Small start only: "look in once or twice a day" | Start smaller | Once or twice a day | N | Attendance |

**Counts.**

| | A allowed | B borderline | N not allowed | Total |
| --- | --- | --- | --- | --- |
| Setup (1 to 21) | 6 | 2 | 13 | 21 |
| Recurring (22 to 36) | 2 | 1 | 12 | 15 |
| All | 8 | 3 | 25 | 36 |

Optional acts the proposal offers and that are not counted: asking for the reviewer (C10 "or when you ask"), asking to approve a tranche close (G11 "unless you ask"). One act the proposal leaves undefined and that is not counted: how the owner gives purpose, audiences, requirements, architecture and UX "as before". M4 says a remark in chat "lapses at the end of the run unless you put it in writing", so the only durable channel the proposal gives him is writing on GitHub.

## 2. Requirement 2: unattended

> The process runs unattended. It doesn't block waiting for user input unless it is completely blocked with no further work possible without additional user action.

### 2a. Clauses

| Id | Clause | Test |
| --- | --- | --- |
| 2a | The process runs unattended | From start to completion, including overnight, no person is needed for it to continue |
| 2b | It does not block while further work is possible | When any work can be done, some work is being done; no built-in idle wait |
| 2c | It waits for user input only when completely blocked | Every wait for the owner is a state in which no work at all is possible without him. By requirement 1 the act that ends the wait is a settings change |

### 2b. How the Foundations and Ledger meant it to be met

- GAP-1 (the owner's own words, 3 Nov): "A tranche CAN RUN from open to close with no one watching: every stop is a named blocker in the record, BOB starts other work meanwhile, and only a blocker that only Bob can clear reaches him." Ledger map: held by "Phase 2's gate". Not a mechanism.
- P19: "BOB never idles while work remains; the work never stops for Bob, and no session ends a turn waiting on him while anything can be done." Held by "status, sweep wake, BOB's prompt".
- GAP-5: "No role waits on ROOT or a scheduled task for work the record allows: a job's report or a merge wakes BOB at once, and a scheduled wake only catches a session that stopped." Source: "measured 2 Nov: with no event, BOB noticed a completion 194 minutes late."
- GAP-4: "Status names each role's next acts from git alone ... so a fresh BOB given only status takes the right next act."
- P18: "while a tranche runs, BOB prepares what the next round or tranche needs ... so it opens the moment this one closes".
- INT-4: "the next layer starts at once."
- JOB-9: "A job ends a turn only COMPLETE or on a named wait with everything pushed; nothing enforces this but the rule and the record." SES-17: urgency "as a labelled nudge".
- PLT-2 as restated: "depend only on acts the committed approvals cover and that were measured to pass". PLT-9: "a missing grant stops a tranche from opening, never a step midway." GAP-6: approvals in `CLAUDE.md` "are the one policy for every act at every depth". GAP-10: "a green gate merges without Bob".
- "Running unattended: six conditions": authority in every START; nothing depends on a refused act; "The sweep runs on its schedule and catches a session stopped by three refusals in a row"; live count at 24 or fewer; the gate on every pull request; "The sweep catches lack of progress, not only silence".

### 2c. What Process3 did

| Clause | Process3 actual | Source |
| --- | --- | --- |
| 2a | It ran round the clock from 4 to 9 Nov: 135, 92, 65, 128, 74 and 7 landings a day. It also stopped for the owner: the last approvals edit (9 Nov 16:45Z) ended it. | product_side 2, 8 |
| 2b | 9.3 hours with no commit of any kind from 7 Nov 05:51Z. Gaps between code-carrying landings of 11.4, 8.7, 7.6 and 6.3 hours. Median wait from complete to merge 348 minutes on 5 Nov (90th percentile 670). 165 `block` commits; in 72 the job says the work is done and pushed and `job complete` refuses. No deployment for 80 hours while 308 landings went in. | product_side 6d, 7, 9 |
| 2c | Waits for the owner while work was possible: about nine hours on the merge-train design across four coordinators ("it was a technical decision within his design and should have been built at 05:31"); a session that "waited seven hours for a 'go' it said it did not need"; a lane session stuck on a permission prompt from about 00:31Z (process PR 219). Measured platform fact: "After three refusals in a row a session stops and waits for a person". | causal_forensics 3D; process4_doc line 118; change_sample row 219; Foundations |

### 2d. What the proposal says, clause by clause

| Clause | Result | The proposal's words |
| --- | --- | --- |
| 2a runs unattended | CONTRADICTED in the recommended start and in the fallback; conditional in the preferred form | Start smaller: "This gives up one thing at first: running unattended overnight. You would look in once or twice a day ... I recommend the small start". C3: "Process3 measured that a task's fresh session could not start other sessions; that is re-tested first. Fallback: one ARCH session resumed by the task ... replaced by you at each layer close". R6: "Met in the preferred form; weakened in the fallback". The only form Process3 measured working is the fallback. |
| 2b no block while work is possible | PARTLY | Met for a single job's process problem: working agreement 3, "work around it, add one line to the process log, and carry on"; N3, "ARCH works on something else". Not met for idle time: R15, "Up to an hour can pass between a layer closing and the next starting"; "'Never idle' is no longer a fault of the session"; working agreement 7, "stopping with nothing to do is correct". C4: "ARCH does not subscribe", which drops GAP-5. |
| 2c waits for the owner only when completely blocked | CONTRADICTED | Six conditions 1: "The process changes only by your merge." "What it costs you": "A real process defect now waits for you". G2: "requires your review for those paths". N4: "A retrospective between runs, when you commission it." M5: "Questions for you live in one pinned issue". G8: "GitHub emails you. It repairs nothing." Run 1: "If a wall is found missing, the run stops". |

Items that touch requirement 2: G3, G6, G8, G9, G11; C2, C3, C4, C6, C11, C12; M5; F1; N2, N3, N4; Start smaller; R6, R15; working agreement 3 and 7; Known limits; tests 1, 3, 4, 5; run 1 ("No stall goes unnoticed"). The run 1 test asks that a stall be noticed, not that it be recovered.

### 2f. Every situation in which work stops or waits

"Owner, not complete" = the process waits for the owner although other work is possible, or the act that ends the wait is not a settings change. "Idle" = work is possible, no owner is involved, and nothing is being done.

| # | Situation | Item | Kind | Worst-case wait |
| --- | --- | --- | --- | --- |
| 1 | Small start: no scheduled task, no watchdog; ARCH's turn ends and nothing wakes it | Start smaller 4 | Owner, not complete | Until he looks in: 12 to 24 hours each time |
| 2 | Fallback ARCH: each layer close waits for him to replace ARCH and switch the old task off | C3 | Owner, not complete | Unbounded, at every layer close |
| 3 | Hourly wake: a freed slot, a closed layer, a red integration branch or a walk failure waits for ARCH's next wake | C2, C4, R15 | Idle | 60 minutes at each step. On a 65-link chain under strict order that is 65 hours of wake latency alone |
| 4 | ARCH dead, paused by refusals, or its task not firing | G8, C3 | Owner, not complete | The watchdog's "set number of hours", plus 30 minutes, plus his response. "It repairs nothing." |
| 5 | A job dead or paused by three refusals | C4, C6 | Idle | "Open too long" (no number given) plus up to 60 minutes. The replacement cannot receive the pull request's events until the dead session is archived, which is a judged act |
| 6 | A defect in the gate or any frozen part that blocks every merge | Six conditions 1; Known limits | Completely blocked, but the unblocking act is a merge | Unbounded. Jobs in flight keep working on branches; nothing lands; no later layer starts |
| 7 | A needed change to his product paths: the pin, a workflow, `.claude/settings.json`, the reviewer brief | G2, C7, C10 | Owner, not complete | Unbounded; other work continues |
| 8 | A walker step that is itself wrong or missing | F2, G11 | Owner, not complete | Unbounded. The tranche cannot close: G11 requires "a passing walk" and the steps are his |
