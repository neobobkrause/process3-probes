# Audit D: the Process4 proposal against the four central requirements

13 Nov 2026. Audited: `process4_doc.md` (all 551 lines, every table row). Read in full: `foundations.md`, `ledger_map.md`, `product_side.md`, `redteam_feasibility.md`. Read by line id: `ledger_lines.md` (ARC-1, ARC-2, GAT-3, P1 to P23, PLN-1 to PLN-3, JOB-1 to JOB-6, JOB-9, INT-4, SES-1, SES-8, SES-15 to SES-17, PLT-2, PLT-6 to PLT-10, REQ-4, REQ-5, GAP-1 to GAP-12). Read by search: `change_sample.md`, `causal_forensics.md`, `levers_github_cloudflare_product.md`, `field_report.md`. Read from the product repository, read-only: `build/modules.json`, `build/layers.md`, `process/config.json`, `CLAUDE.md` at `origin/tranche` (identical module map at `origin/layer/14`), and `build/modules.json` at `origin/main`.

Classification words: MET, PARTLY, NOT ADDRESSED, CONTRADICTED. A clause is graded on the proposal's operative items (G, C, M, F, P, N, "Start smaller than this", "What reaches you", "Known limits", run 0, run 1, the seven tests), not on its admission table.

## 0. Findings in brief

1. **The proposal's body was not rewritten to the four requirements.** A section was put in front of it ("The requirements everything must serve") that restates them and admits shortfalls. It says the recommendations "fall short of three" and then lists four rows. Each row gives a "direction of the correction" in one sentence. No numbered item, no run 0 step, no test, no line of "What reaches you" and no grade in the R1 to R25 table was changed to match. The six conditions still open with "The process changes only by your merge"; "Known limits" still says "Your merge is the last wall"; "What reaches you" still says "Your standing acts are five".
2. **Of 18 testable clauses, the proposal's items meet 2, partly meet 6, do not address 1 and contradict 9.**
3. **Requirement 1 is contradicted on every clause.** The proposal asks 36 distinct acts of the owner. 8 are changes to GitHub or Cloudflare settings about permissions or rules. 3 are borderline. 25 are something else: merging, reviewing, writing, creating a task, starting or commissioning sessions, editing a file, setting Claude's cloud environment, reading reports. Of the 15 recurring acts, 2 are allowed.
4. **Requirement 2 is contradicted in the form the proposal recommends starting with.** "Start smaller than this" gives up overnight running and has no wake at all. There are 22 situations in which product work stops or waits; in 12 of them it waits for the owner although it is not completely blocked, and 16 end only when he acts.
5. **Requirement 3 is contradicted on order and on notification.** P3 starts a layer's jobs together. N7 deletes notices "with no replacement". Nothing in the proposal holds the total order itself: the check it keeps compares imports with declared uses and does not look at position.
6. **The module map at the tranche tip already breaks the total order in three places,** all introduced during Process3: `hypotheses` uses `steps`, `agent-runner` uses `ai-gate`, and `agent-drafts` and `agent-worker` use each other. `origin/main` has none. No evidence file and no line of the proposal mentions this.
7. **Requirements 3 and 4 pull against each other on this product as it is mapped.** If a module's job may start only when the jobs of all modules it uses have merged, the 220 modules form 65 waves, the median number ready at once is 3, the maximum is 12, and a bound of 12 or more never binds. The owner's default of 20 could not be used.
8. **Requirement 4's bound is a sentence.** C12 puts "24" in ARCH's pinned text. Changing it is a merged process change. It counts live sessions, not jobs. Nothing enforces it.

## 1. Requirement 1: the owner's acts

> The user doesn't enter commands nor edit source files. The only actions he will very occasionally take are changes to GitHub or Cloudflare settings related to permissions or rules.

### 1a. Clauses

| Id | Clause | Test |
| --- | --- | --- |
| 1a | He enters no commands | No act of his is typing a command, a script or an instruction to be executed |
| 1b | He edits no source files | No act of his changes the content of a file in a repository, by any route including GitHub's website |
| 1c | His only actions are changes to GitHub or Cloudflare settings related to permissions or rules | Every act asked of him is on a GitHub or Cloudflare settings page and concerns who may do what, or a rule |
| 1d | Very occasionally | The count of his acts per run is near zero and is not periodic |

### 1b. How the Foundations and Ledger meant it to be met

- P17 (modified 3 Nov): "Bob does not edit files or enter commands; when an act only he can take is needed, BOB names it and walks him through it." Suggested and kept with: "during onboarding the platform forces a few GitHub steps of yours; keep those as few as possible, each walked through." Ledger map: held by "Walk-through; every role", status "Design". No mechanism.
- Foundations, "The human and the AI": "Your time is the scarcest resource." "Approving a merge is such an act only when you ask for it: by default a job, layer or tranche merges on a green gate without you, while a public release waits for your approval (GAP-7)". "You do not edit files or enter commands; the few steps of yours the platform forces at onboarding are kept as few as possible and each is walked through (P17)."
- GAP-10: "a green gate merges without Bob, who approves a particular merge only when he asks to."
- REQ-5: "A change to what a provided service means goes to you only by the DES 1 test; every other change is BOB's, recorded once."
- PLT-8: "GitHub acts a session cannot take run on GitHub's runner by workflows with your tokens as secrets."
- PLT-9: "Every credential is gathered once before a product's first tranche". Its own "Against": "each addition is an act of yours."
- Setup: "set by the developer through the fewest steps, each with its reason and tested to work the first time".

The Foundations already carried exceptions that the restated requirement does not allow:

- **A file edit.** "They live only where your own hand puts them: committed by you to each repository's CLAUDE.md." "a check fails any change to the approvals block not made by you through GitHub's website."
- **Starting sessions.** Roles table: ROOT "Started by: You". "If the watcher's session declines, replacing ROOT stays yours".
- **Writing answers.** "Questions that are yours are asked in one place, the walk-through, numbered, with a column for your word".
- **An approval click.** GAP-7: "A public release or promotion to installed sites waits for Bob's approval through the protected GitHub environment".

### 1c. What Process3 did

| Clause | Process3 actual | Source |
| --- | --- | --- |
| 1a | The owner started the first sessions. Tasks were switched off by hand at the 3 Nov halt. | Ledger map PLN-5 |
| 1b | 16 owner patches to the product's `CLAUDE.md` in nine days (641 to 8,664 bytes). 14 owner approvals edits in the process repository. Owner patch 13 (7 Nov) also edited `.claude/settings.json`: a deny on every `git push` and `gh` command and a hook before every Bash call. | product_side 6a; process4_doc line 52 |
| 1c | His acts were mostly words, not settings: decisions on 159 Ledger lines (151 as suggested), at least 36 walk-through questions, 14 of 32 check removals driven by his words, account switches on 5 and 7 Nov. | process4_doc; change_sample; product_side 9 |
| 1d | "Process3 drew objections, approvals and audits from you on every one of its nine days." A coordinator chain carried a question as "Bob's, asked, no answer" for about nine hours on 5 Nov. "Every approvals edit in Process3 halted the process, and the last one ended it." | process4_doc lines 195, 475; causal_forensics 3D |

### 1d. What the proposal says, clause by clause

| Clause | Result | The proposal's words |
| --- | --- | --- |
| 1a no commands | CONTRADICTED | C2: "ARCH is woken once an hour by a scheduled task that you create. Its prompt is one line". Start smaller 4: "one ARCH session that you start". C7: "Installing Node and dependencies moves ... to the cloud environment's setup script". Run 0 step 2: "A commissioned session builds the Process4 kit". N4: "when you commission it". |
| 1b no file edits | CONTRADICTED | G3: "Your approvals text in `CLAUDE.md` is rewritten by you to name this act." Run 0 step 5: "rewrite your approvals to name the new merge act". G2: "with you as bypass so you can merge your own edits". Run 1: "Your own repairs to the gate are counted separately and are expected in a first run." Known limits: "exceeding a budget means changing its number on purpose. You can still do that." |
| 1c only GitHub or Cloudflare permission and rule settings | CONTRADICTED | "What reaches you": "Your standing acts are five: merge a process change, answer a question, stop or resume, approve a public release, and, only in the fallback form, replace ARCH at a layer close." None of the five is wholly a permission or rule setting. R3 grades itself "Weakened": "You gain acts: creating the hourly task once, merging process changes, two clicks to stop. Each is a click or a comment". |
| 1d very occasionally | CONTRADICTED | Division table: "One daily number to read. Questions that are yours, batched." "What it costs you": "a retrospective between runs needs perhaps an hour of your attention. I cannot put a firm number on it". Start smaller: "You would look in once or twice a day." C3 fallback: "replaced by you at each layer close". |

Items that touch requirement 1: G1, G2, G3, G5, G6, G8, G9, G10, G11, G12; C2, C3, C7, C8, C10, C11, C12; M1, M3, M4, M5, M6; F1, F2, F3; P1, P5; N2, N4, N5, N6, N8; Start smaller 1 to 5; the six conditions 1 and 4; the division table; "What it costs you"; "What reaches you"; Known limits ("A defect in a frozen part waits for you", "Your merge is the last wall"); R2, R3, R4, R7, R20; tests 2, 3 and 7; run 0 steps 1 to 5; run 1 ("Your acts are counted: merges, answers, stops").

The admission table names three acts that are not settings changes: "merger of every process change (G1, N2, N4), the creator of the hourly task (C2) and the answerer in an issue (M5)". The count below is 25.

### 1e. Every act the proposal asks of the owner

A = a change to GitHub or Cloudflare settings related to permissions or rules. B = borderline: an act of his on GitHub or Cloudflare that is not a permission or rule setting. N = something else.

**At setup (run 0 and before run 1).**

| # | Act | Item | How often | Class | Why |
| --- | --- | --- | --- | --- | --- |
| 1 | Write to GitHub Support about the 6 Nov suspension | G12; run 0 step 1 | Once | N | Writing a message |
| 2 | Process repository public; sessions' account not a collaborator | G1 | Once | A | Collaborator setting |
| 3 | Ruleset on main and the integration branch: code-owner review for his paths, himself as bypass | G2; Start smaller 1; test 2 | Once | A | Ruleset |
| 4 | Auto-merge allowed; required check `gate` | G3, G4 | Once | A | Repository rule |
| 5 | Close rule: required regression and walk on the integration-to-main pull request | G11 | Once | A | Ruleset |
| 6 | GitHub environments `production` (himself as required reviewer, production keys) and `dev` (development Cloudflare token) | G10 | Once | A | Environment protection and secrets |
| 7 | Remove the eleven secrets from the sessions' cloud environment | G10 | Once | N | A Claude setting, not GitHub or Cloudflare |
| 8 | Create a separate Cloudflare account for development | F3; test 7 | Once | B | Cloudflare, but creating an account |
| 9 | Create the scoped development Cloudflare token | F3, G10 | Once | A | Cloudflare token permissions |
| 10 | Rewrite the approvals text in `CLAUDE.md` in his own hand | G3; run 0 step 5; test 3; C11 | Once, then at every change to what sessions may do (Process3: 16 + 14 edits in nine days) | N | A file edit |
| 11 | Create the hourly scheduled task and type its prompt | C2; run 0 step 5; N8 | Once; again at each ARCH replacement in the fallback | N | A Claude task; typed instruction |
| 12 | Enter the cloud environment's setup script (Node, dependencies) | C7; N8 | Once; again when the toolchain changes | N | Entering commands, in a Claude setting |
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

