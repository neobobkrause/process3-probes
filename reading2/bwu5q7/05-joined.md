# [file] audit_D_central.md (continued)


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
| 9 | An act the approvals text does not cover is refused by Auto mode | G3, C11; test 3 | Owner, not complete | Unbounded. No session may write the approvals (Foundations); an edit "takes effect in sessions started after it" |
| 10 | A question that is his | M5 | Owner, not complete | Unbounded. The proposal does not say work proceeds on ARCH's recommendation meanwhile |
| 11 | End of a run: product work stops until he commissions the retrospective, reads it, merges and resumes | N2, N4 | Owner, not complete | Unbounded, at every run boundary |
| 12 | Run 0: Layer 14 is "one merge short" and waits for five run 0 steps and seven tests | Run 0; "Before run 1" | Owner, not complete | Days; 13 of the 21 setup acts are not settings |
| 13 | Run 1 stop rule | Run 1: "If a wall is found missing, the run stops" | Owner, not complete | Until the next run |
| 14 | Idle or finished sessions fill the account's live limit and new starts fail silently at about 50 | C12; test 5 | Idle | Until the watchdog fires. Archiving is a judged act that Process3 ruled "never needed for correctness" |
| 15 | A cross-module break waits for the scheduled regression, then for ARCH | G6 | Idle | The schedule's interval (not stated) plus 60 minutes |
| 16 | Deploy-and-walk at layer close "when ARCH dispatches it" | F1 | Idle | 60 minutes, or 24 hours if the dispatch is refused and only the daily schedule runs |
| 17 | Runner queue: 24 landings an hour at 50 runner-minutes is exactly 20 runners | G5 | Idle | Grows with every landing above the budget |
| 18 | The interaction limit is left on and the retrospective's fork pull request cannot be opened | G1, N4 | Owner, not complete | Until he toggles it. The act is a setting |
| 19 | A process fix exceeds a line or byte budget | M1, N1; Known limits | Owner, not complete | Until he changes the number, which is a file edit |
| 20 | The sessions' GitHub account is suspended again | Known limits | Completely blocked | Unbounded; only he can write to Support |
| 21 | A public release | G10, G11 | Completely blocked for the release only | Until he approves. His own rule (GAP-7) |
| 22 | His stop | G9 | By design | Until he resumes |

**Counts.** 22 situations. 12 wait for the owner although not completely blocked (1, 2, 4, 7, 8, 9, 10, 11, 12, 13, 18, 19). 6 are idle waits with no owner involved (3, 5, 14, 15, 16, 17). 4 are complete blocks or his own act (6, 20, 21, 22), and in one of those (6) the act that ends the block is a merge, which requirement 1 excludes. 16 of the 22 (the 12 and the 4) end only when the owner acts, so the proposal sets no bound on them; the 6 idle waits are bounded by a schedule.

## 3. Requirement 3: total order, single job, notification

> A product consists of a total order of modules, where the services of a module can only be used by modules that follow it. Each module is updated and tested by a single job, with the jobs of earlier modules run before those later in the order. If a job changes a module's interface, all users of that module are notified so that the jobs for those user modules are updated as necessary and tested.

### 3a. Clauses

| Id | Clause | Test |
| --- | --- | --- |
| 3a | The product is a total order of modules | One ordered list; every module has one position |
| 3b | A module's services are used only by modules that follow it | No declared or actual use points to a module at the same or a later position |
| 3c | Each module has a single job | At most one job per module; nothing else changes the module |
| 3d | That job both updates and tests the module | The job that changes the module's code also writes and runs its tests |
| 3e | Jobs of earlier modules run before those of later modules | No module's job runs ahead of the job of an earlier module |
| 3f | A job that changes a module's interface causes all users of the module to be notified | Every module that declares a use of the changed module receives the notice; none is missed |
| 3g | The users' jobs are updated as necessary | Each notified module's job takes the change in, where it is affected |
| 3h | The users' jobs are tested | Each notified module is tested against the changed interface |

### 3b. How the Foundations and Ledger meant it to be met

| Clause | Line | Words | Held by (Ledger map) |
| --- | --- | --- | --- |
| 3a, 3b | ARC-1 | "Modules in one total order, each in one layer, lower first, uses declared and matched by imports; a violation fails the gate." | "Not in the tool's gate": **Gap** on 3 Nov |
| 3a, 3b | P4 | "one total order; each module is in one layer; a module uses only earlier modules; declared use is checked against imports and a violation fails the build." | "As ARC-1": **Gap** |
| 3c | P8 | "at most one job per module at a time; a job applies every plan entry for its module and deals with what it finds in its own module within the job whenever it can." | "job start refuses a second": Built |
| 3c | ARC-2 | "Each file has one owner module; a job writes only its module's paths and tests and the strike of its own marks." For: "Makes parallel jobs safe from overwriting each other." | "gate and merge": Built |
| 3d | P7 | "Only module jobs change module code, and every requirement is tested at the interface and proven met" | "Revert check only": **Gap** |
| 3d | REQ-4 | "A not-yet-met mark is struck only by the job that meets it, in its own commit." | ARC-2's ownership: Built |
| 3e | P10 (modified) | "A tranche runs one layer at a time, lowest first, and all the module jobs of a layer run concurrently ... The next layer starts when every job of the layer is complete." | "status next work; layer close": Phase 2, Phase 3 |
| 3e | INT-4 | "a layer closes when every PR is merged and the layer's checks pass ... the next layer starts at once." | Phase 3 |
| 3e | Foundations, A job's life 1 | "each module of the open layer (INT-4), the lowest layer in the product's layer map not yet closed (P10) ... as many at once as the live-session limit allows" | |
| 3f, 3g, 3h | GAT-3 | "A change to a provided service reaches its users through the architecture session's requirement notice and each user module's own job." Against: "BOB must not miss a user." | "Provider-change route": Phase 3 |
| 3f | P5 | "BOB carries a change to every user of a service." | Nudge |
| 3h | Foundations, the gate | "never another module's suite (GAT-2)"; "A change to a provided service reaches its users through BOB's requirement notice and each user module's own job, not through the provider's gate (GAT-3)." | |
| 3f | REQ-5 | A meaning change "goes to you only by the DES 1 test; every other change is BOB's" | Nudge |

The Foundations did not hold clause 3e as the restated requirement words it. P10 orders layers, not modules: within a layer every job runs at once. The total order allows a module to use an earlier module of its own layer, so P10 runs users beside or ahead of their providers. P10's own note says how that was to be repaired: "a later service change reaches its users by GAT-3."

### 3c. What Process3 did

| Clause | Process3 actual | Source |
| --- | --- | --- |
| 3a | 220 modules in one ordered list in 11 layers (39, 10, 12, 9, 21, 27, 3, 20, 13, 4, 62). `layers.md`: "The modules, in their total order, are in `modules.json`." The map changed 40 times in the week. | `build/modules.json`; process4_doc P4 |
| 3b | 3,120 declared uses. None points to a higher layer. **Three point to a later position in the same layer**: `hypotheses` → `steps`, `agent-runner` → `ai-gate`, `agent-drafts` → `agent-worker` (and `agent-worker` also uses `agent-drafts`, a cycle). With those three edges kept, 44 of the 220 modules sit on or behind a cycle. `origin/main` (178 modules, 2,689 uses) has no such edge, so all three arrived during Process3; `agent-drafts` was split from `agent-worker` on 4 Nov. The imports check does not look at position. | Computed today from `origin/tranche` and `origin/main` |
| 3c | 220 ledger jobs for 220 modules; a second job for a module was refused. But a job was not single in practice: 3.1 job starts and 3.0 landings per job; 170 distinct jobs landed 508 times, 113 more than once; three modules landed 14 times each; 330 job branches. Outside module jobs: 248 `bob/*` pull requests, 43 found-mark pull requests, 33 lanes. | product_side 1, 2, 5 |
| 3d | Jobs wrote their own tests: +43,882 net test lines against +23,090 source. 11,410 of the test lines served the process (187 notice tests, 24 requirement-id tests). Module suites ran in 1.9 to 2.5 minutes median. | product_side 5, 6c |
| 3e | Layers ran roughly lowest first with every job of a layer at once. Not strictly: layer 3 closed (4 Nov 02:13Z) before layer 2 (05:31Z). Layers closed with modules deferred: 2, 0, 1, 1, 3, 8, 0, 2, 0, 1, 28 for layers 1 to 11, 46 in all, so later layers started while earlier modules' work was open. Within a layer there was no order across 721 in-layer uses. A "companion land order" rule deadlocked on 9 Nov: 351 minutes for 63 and 28 lines. | product_side 5, 7 |
| 3f | 178 notices fanned out to 2,707 module-notifications, 15.2 per notice; 1,341 on 4 Nov alone. The first notice "listed 56 modules as next work". "Widely imported providers ... raise notices with 100 or more importing users per bug-fix pull request". | product_side 6d; change_sample rows 54, 68, 82 |
| 3g | 2,342 triage verdicts; 2,101 (90%) "not affected"; 241 "affected"; 441 answered by a job landing; 69 commits were notice confirmations with no code change. Some real fixes followed, for example `capture-requests` reading a field `ai-runs` had renamed. The mechanism took thirteen process changes (PR 54 and twelve follow-ups) and the owner asked on 9 Nov "how do we get it back to a lightweight process". | product_side 6d, 9; change_sample |
| 3h | Running users' suites in the provider's gate (process PR 112) cost "+7.6 min median and +28.6 worst per job gate, and of 20 refuted job claims today none came from another module's failure"; reverted in 2.2 hours. The notice test in the receipt "answered nothing and the revert check found it inert"; dropped at 19 hours. One real miss on 4 Nov: a job "merged green on its own suite and broke another module; nobody saw it until the first development deploy served 500s". | change_sample rows 40, 54, 118, and section on PR 112 |

The proposal says "Process3's version took a median of 52 hours to record a notice by 9 Nov, against 0.2 at the start". That figure is in none of the evidence files given to this audit.

### 3d. What the proposal says, clause by clause

| Clause | Result | The proposal's words, and what is missing |
| --- | --- | --- |
| 3a total order | PARTLY | The requirement is restated. R17: "Met ... The imports check stays in the gate." P4: "The module map and round plan are ARCH's files, not guarded." Nothing in any item holds the order: no check that a declared use points to an earlier module. |
| 3b used only by later modules | PARTLY | G4 keeps "imports match declared uses". That compares code with the map. It passes the three edges that break the order today. |
| 3c one job per module | PARTLY | C4: "A job is one module or item, one branch, one draft pull request." Run 1's work is items, not modules. "At most one job per module" is said nowhere; the refusal that held it goes with the tool (N1: "It cannot refuse, hold or write"). The ownership check (ARC-2) is not among G4's checks: "imports match declared uses, generated files are current, built rows verify. Nothing else." G6: "A red result is a fix job for ARCH", which does not say that the broken module's own job fixes it. |
| 3d that job updates and tests | MET, weakened | G4: the gate "runs the changed module's tests, the revert check". R11 grades itself "Weakened": "Nothing proves each struck mark has a test". |
| 3e earlier before later | CONTRADICTED | P3: "A layer's jobs start together. 182 of 220 modules depend on a module in their own layer; starting in strict dependency order would cost about four days." Held by "ARCH's pinned text". Order between layers is implied (R15, F1 "at each layer close") and stated in no item; "ready" is not defined. G3 merges in arrival order. N7 deletes "forced layer re-sync, companion land order". |
| 3f notify all users | CONTRADICTED | N7: "Deleted with no replacement: ... notice triage as a mechanism". "Ledger lines that end": "provider notices as a route (GAT-3)". Working agreement 4: "If it is elsewhere, tell ARCH in one line." |
| 3g users' jobs updated | NOT ADDRESSED | No item opens or updates a user module's job on an interface change. Nothing says how an interface change is recognised. |
| 3h users' jobs tested | PARTLY | G6: "Cross-module breaks are found after merging, on the integration branch. The existing full regression runs there on a schedule." G11: the full regression at close. This tests every module some hours later. It finds only breaks an existing test exercises, it is not tied to the change or to its users, and it does not test a user "updated as necessary". |

Items that touch requirement 3: G3, G4, G6, G11; C4, C5, C6; F2; P3, P4; N1, N7; R10, R11, R12, R17; "Ledger lines that end"; working agreement 4; Known limits ("Requirement files are edited by jobs"). None of the seven tests and none of the five run 1 measures tests order or notification. Run 1's goal, "Merge Layer 14, then one round to raise the walk", is completion items and exercises neither.

The admission table says: "Keep the order and the notification. Derive the users of a changed interface from the module map and open their jobs." That is a direction. P3 and N7 stand unchanged below it.

### 3g. What the actual module map permits

Method: `build/modules.json` at `origin/tranche`, list order taken as the total order, the three forward edges set aside as violations. Each job is taken as one time unit. These are properties of the map, not measurements of a run. A tranche in which fewer modules have work would be wider. T53 gave all 220 modules a job, so the full figures apply to it.

**If a module's job may start only when the jobs of every module it uses have merged.**

| Measure | Value |
| --- | --- |
| Longest chain of uses | 65 modules |
| Waves | 65 |
| Modules ready at once | Median 3, mean 3.4, maximum 12 |
| Wave sizes in order | 3, 7, 7, 10, 12, 9, 6, 4, 2, 2, 1, 4, 5, 2, 2, 2, 4, 3, 2, 3, 4, 4, 6, 4, 2, 3, 3, 2, 3, 6, 6, 5, 2, 3, 4, 1, 1, 1, 1, 2, 1, 1, 1, 2, 2, 1, 2, 2, 2, 4, 5, 2, 4, 2, 5, 1, 2, 1, 1, 1, 1, 9, 8, 3, 4 |
| Waves with exactly one module ready | 14 of 65 |
| Waves with two or fewer | 32 of 65 |
| Modules with no uses at all (the first wave) | 3 |
| With the three order-breaking edges kept as real dependencies | 44 modules can never start |

**The same rule under a bound on concurrent jobs.**

| Bound | Rounds to finish | Average jobs running | Rounds in which the bound binds |
| --- | --- | --- | --- |
| 1 | 220 | 1.0 | 220 |
| 2 | 110 | 2.0 | 110 |
| 3 | 85 | 2.6 | 62 |
| 4 | 77 | 2.9 | 35 |
| 6 | 71 | 3.1 | 12 |
| 8 | 68 | 3.2 | 4 |
| 12 | 65 | 3.4 | 1 |
| 20 or 24 | 65 | 3.4 | 0 |

A bound of 12 or more changes nothing. The owner's default of 20 and the proposal's 24 would never be reached.

**The proposal's "a layer's jobs start together".**

| Measure | Value |
| --- | --- |
| Rounds | 11, one per layer |
| Jobs wanted at once per layer | 39, 10, 12, 9, 21, 27, 3, 20, 13, 4, 62 |
| Layers that exceed a bound of 24 | 3 (layers 1, 6 and 11) |
| Uses that cross within a layer | 721 of 3,120 (23%) |
| Modules whose job starts beside or before a module they use | 182 of 220 (83%) |
| In-layer chain depth per layer | 8, 4, 7, 4, 11, 11, 2, 12, 8, 3, 16; sum 86 |
| Modules per layer with no in-layer use, which could start at layer open under the strict rule | 1, 4, 4, 6, 2, 3, 2, 2, 2, 1, 11 |

Three differences from the requirement.

1. **Order.** The requirement orders jobs by module. P3 orders them by layer only. 182 modules run ahead of or beside something they use.
2. **Notification.** Under the requirement's order, every user of a module comes later, so its job has not yet run in this pass when the provider's interface changes. Under P3 a user may already be running or merged, so an interface change means rework. Process3 ran P3's form and had 338 repeat landings and 2,707 notifications. P3 keeps that form and N7 removes the notification that repaired it.
3. **The cost the proposal cites.** P3's "about four days" is 65 links times about 90 minutes: some 30 minutes of job and up to 60 minutes waiting for the proposal's own hourly wake (C2). 65 hours of the 97 are the wake. For comparison, Process3 took 4 days 5 hours from its first layer close to its eleventh, with every layer's jobs started together.

**What the notification clause costs on this map.**

| Users of a module | Median | Mean | 90th percentile | Maximum |
| --- | --- | --- | --- | --- |
| Direct (modules that declare a use of it) | 8 | 14.2 | 31 | 213 (`setup-words`) |
| Transitive (users, their users, and so on) | 70.5 | 79.0 | 162 | 217 (`setup-words`) |

27 modules have no users. Among the 193 that have any, the medians are 10 direct and 82 transitive. 28 modules have 24 or more direct users, so one interface change in any of them notifies more modules than the proposal's bound allows jobs. The most-used providers: `setup-words` 213 direct, `test-support` 153, `record-grammar` 132, `record-core` 116, `membership` 116. Process3's measured mean of 15.2 notifications per notice matches the direct mean of 14.2, so Process3 notified direct users.

## 4. Requirement 4: parallel jobs under a bound the owner changes

> The build plan is designed around parallel jobs running, with the concurrent job count bounded by a user-changeable number.

### 4a. Clauses

| Id | Clause | Test |
| --- | --- | --- |
| 4a | The build plan is designed around parallel jobs | The plan states which jobs run at once and is laid out for that |
| 4b | The concurrent job count is bounded by a number | A number of jobs, and the count does not pass it |
| 4c | The number is user-changeable | The owner changes it, and by requirement 1 he does so with a setting |

### 4b. How the Foundations and Ledger meant it to be met

- P10: "all the module jobs of a layer run concurrently". Its note: "Keep concurrency, which was lost and is why Phase 2 planned only two jobs".
- A job's life 1: "as many at once as the live-session limit allows".
- Platform section: "at about 50 live sessions the account stops starting new ones, while the create call still reports success. So the process keeps at most 24 live sessions by default, and BOB fills that room with jobs for the ready work; BOB may raise or lower that number from what it measures, and records each change (your word, 1 Nov)."
- Unattended condition 4: "The live count stays at 24 or fewer, and every new session is checked to have started."
- ARC-2: "Makes parallel jobs safe from overwriting each other."

In the Foundations the number was BOB's to change, and it counted live sessions. The restated requirement makes it the user's and makes it a count of jobs. The owner's field report gives his default as 20.

### 4c. What Process3 did

| Clause | Process3 actual | Source |
| --- | --- | --- |
| 4a | Parallel in fact: 84 distinct jobs landed on 4 Nov; 24 landings in the peak hour (7 Nov 18:00Z). On 5 Nov the merge train made landing serial: median 348 minutes from complete to merge. | product_side 2, 7; redteam 5 |
| 4b | The number moved at least four times: 24 by default; "about 6 job sessions" on 4 Nov, followed for about six hours; "session caps (jobs 4, lanes 1)" after the suspension (process PR 205, life 2.7 days); `"pacing": {"jobs": 20}` in `process/config.json` at the end. Above about 50 the platform fails silently. | causal_forensics 3C; change_sample row 205; `process/config.json` |
| 4c | The owner never set it by a setting. Sessions set it, in a config file and in handoff notes. Once a session's own number was recorded as his: "the coordinator's number recorded as Bob's agreement". | causal_forensics 3C, 4.1 |

### 4d. What the proposal says, clause by clause

| Clause | Result | The proposal's words |
| --- | --- | --- |
| 4a designed around parallel jobs | MET, by breaking 3e | P3: "A layer's jobs start together." C2: "room for about 576 job starts a day against a peak of 135 landings". G5 sizes the gate for 24 landings an hour. The width comes from running users beside their providers. |
| 4b bounded count | PARTLY | C12: "Live sessions stay at or below 24, and ARCH archives a job's session when its pull request merges." Held by "ARCH's pinned text; count on the daily report". It counts live sessions, which includes ARCH and may include idle sessions (test 5 does not yet know). It is a sentence ARCH is asked to follow. Known limits: "a job is not physically prevented from starting a session." N7 deletes the "six-job limit". |
| 4c user-changeable | CONTRADICTED | The number 24 is written into ARCH's pinned text. Changing it means a pull request from a fork to the process repository, merged by the owner, inside a 4,096-byte cap, and N2 allows "One process version per run". The proposal's number is not the owner's default. |

Items that touch requirement 4: C2, C12, P3, G5, G7, N2, N7, the daily report ("live sessions"), test 5, Known limits.

### 4h. Where the bound lives, who can change it, and whether that is a setting

| Question | Answer |
| --- | --- |
| Where it lives | In the ARCH text in the process repository (C12), pinned into the product at one commit per run |
| What it bounds | Live sessions, not concurrent jobs |
| What enforces it | Nothing. ARCH reads a sentence; the daily report prints a count the next day |
| Who can change it | The owner only, by merging a process change that a session drafted in a fork |
| When | Between runs, or mid-run as a counted process version |
| Is that a settings change | No. It is a merge of a file change |
| The admission table's correction | "The bound is a repository variable in GitHub's settings, which is a setting you change". No item carries it. A repository variable is a GitHub setting, but it is not a permission or a rule. Whether the sessions' collaborator account could change a repository variable itself was not tested in any evidence file, and GitHub's API documentation is worth checking on that point before it is relied on |
| Other bounds the owner does not hold | About 50 live sessions on the account, failing silently (measured 1 Nov). 20 concurrent Actions runners on the Free plan, which the proposal's gate budget exactly fills at 24 landings an hour (G5) |

## 5. The five interruptions

### 5.1 Permissions

| | |
| --- | --- |
| Items | Six conditions 3 ("Refusals come from GitHub. The tool that remains reads and prints."); N1; working agreement 2 ("You may do these without asking: the listed acts for your role"); G3 (approvals rewritten to name auto-merge); C7 (deny lists); C11 (approvals fingerprint removed); G10 (secrets out of sessions); N7 (deletes "tranche-open grant trials", "settings rollback refusal"); tests 1, 3, 5, 6 |
| Physical | Deleting the tool's 818 stop sites. Deny lists, which remove a tool from a session (measured 1 Nov). GitHub rulesets |
| Text only | The list of acts needing no permission. The approvals in `CLAUDE.md`, which are text the classifier reads (0 refusals in about 450 acts in Process3) and which only the owner's hand may write |
| Left unaddressed | A session paused by three refusals "waits for a person" (measured); the proposal removed the sweep and watcher that caught it and added only ARCH's hourly look at jobs. The 20-refusal hand-off in Auto mode. New dependence on judged acts that the Foundations ruled out: archiving (C12, C6), task switching (G9, C3), workflow dispatch (F1), a task's fresh session starting sessions (measured 0 of 3). PLT-9's check that a missing grant stops a tranche at its open is deleted, so a missing grant is met mid-run. Every missing approval is an owner file edit. G2 adds a new refusal: any job that needs to touch a walker step or a workflow now stops at the owner. The claim "Of 508 landings in Process3, none touched these paths" sits beside the feasibility review's finding that the walker is "a module that jobs edit" and that its step count moved from 238 to 357 in one round; the two were not reconciled |

### 5.2 Claude laziness: stopping short of work it could do

| | |
| --- | --- |
| Items | The proposal answers a different question. "Lazy: not in effort ... The laziness is in diagnosis." Working agreement 3 and 7; R15 ("'Never idle' is no longer a fault of the session"); C2 (hourly wake); C6 (stuck work is ARCH's hourly work); G8 (watchdog); N1 (status prints what is ready); C9 (jobs at medium effort) |
| Physical | The hourly task and the 30-minute watchdog are platform schedules. Both detect; neither makes a session continue |
| Text only | Working agreement 7: "Push before you stop. When you are done or blocked, say so and stop; stopping with nothing to do is correct." |
| Left unaddressed | A job that ends its turn with work unpushed is "invisible to status" (R14, graded Weakened). A job that stops mid-work waits for "open too long" plus up to an hour. ARCH starting some ready jobs and ending its turn has no check until the next hour. GAP-5's event wake, P18's preparing of the next round, and P19's "BOB never idles while work remains" are dropped. Nothing separates "nothing to do" from "stopped short" except the next hourly read of status. In the small start there is no wake at all. N7 deletes the idle alarm with no replacement |

### 5.3 Handoff scanning

| | |
| --- | --- |
| Items | "What is fundamentally different" 2 ("There are no handoff notes, no long-lived coordinator and no carried memory"); C1; C3 (fresh session per wake); C8 (auto memory off); M1 (4,096-byte caps); M2 (one charter page); G7 (state from branches and pull requests); N1; N7 |
| Physical | Deleting the roles that wrote handoffs. Byte caps "held by a required test" in the process repository |
| Text only | "Each ARCH wake starts from the pinned text and the repository's state" |
| Left unaddressed | The preferred form rests on a platform behaviour Process3 measured failing, 0 of 3. In the fallback, ARCH is one resumed session whose context grows until the owner replaces it. Two new places a fresh ARCH must read have no cap and never shrink: the questions issue (M5: "the answer is on the page") and the process log (N3). START bodies can grow ("Visible, not walled"). The byte cap is a required check in the process repository, but the product's `CLAUDE.md` lives in the product repository, whose gate runs "Nothing else"; that file is 8,664 bytes of owner approvals today, the cap is 4,096, and run 0 asks him to add to it. The cost of a fresh ARCH re-reading everything each hour was never measured (SES-16: "No comparison arm") |

### 5.4 Every utterance becoming a rule until the rules overflow

| | |
| --- | --- |
| Items | M4 ("Your word is what your GitHub account wrote"; a chat remark "lapses at the end of the run"); working agreement 6 ("A question from Bob is a question"); G1, G2 (sessions cannot write the process); M1, M2; N4 (at most three changes, net zero); the rename to ARCH; "What is fundamentally different" 4 |
| Physical | Sessions cannot merge into the process (collaborator setting). Byte caps. GitHub authorship as the record of who said what |
| Text only | Working agreement 6. "Sessions quote it with a link and never paraphrase it as yours" |
| Left unaddressed | M4 makes the owner write on GitHub for any word to last, which requirement 1 excludes. The questions issue is a rulebook by another name: every answer stands for ever, nothing expires, nothing caps it, and ARCH must read all of it not to ask twice. Rule text can still grow where sessions write freely: the round plan and module map (P4: "not guarded"), requirement files ("not walled"), START bodies, and the product's existing `build/rulings.md`, `build/rulings-active.md` and `DECISIONS.md`, which P1 does not clear. The cap bounds size and does not say who removes; removal is the owner's choice at a retrospective. The admission table's correction, "Claude may change the process only inside fixed limits ... To add, it must remove", is by the proposal's own word "unproven" and rests on "one case" |

### 5.5 Over-caution piling up tests, reviews, gates and checks

| | |
| --- | --- |
| Items | G1, G2 (sessions cannot add checks to the process); G4 (gate is tests, the revert check and three narrow checks); G5 (50 runner-minutes per landing); six conditions 2 and 5; M1; N1 (status "cannot refuse", 500 lines); N2; N4; N5 ("Whatever misfired is removed by default"); N7; C9; C10 (review on a trigger, five findings); working agreement 5; the signs table |
| Physical | The collaborator wall. The code-owner ruleset, if test 2 passes. Line and byte budgets held by required tests in the process repository |
| A number only | G5 is "Number on the daily report" and stops nothing. Test lines against source lines is a line on the report |
| Text only | Working agreement 5. C10's "at most five findings". C9's effort levels |
| Left unaddressed | The outlet the proposal itself names first: checks moving into the product's own tests (Process3: 43,882 test lines against 23,090 source, 11,410 of them serving the process). Nothing bounds it; the owner is to notice a ratio. The revert check stays, although 61 block texts named it and it once removed real test repairs. "Sessions will still hesitate, over-ask and over-test inside their own work" (Known limits). N5 removes a misfiring check only at the retrospective; during a run it keeps blocking until the owner merges. The proposal adds gates of its own around the run: seven tests, a replay, code-owner review, a regression and walk required at close, nine daily numbers, six signs, a retrospective. The pile moves from the tool to the run's edges and to the owner. The retrospective is still a channel that brings up to three changes every run |

## 6. Summary

### (i) Clause by requirement, Process3 and Process4

| Clause | Required | Process3 actual | Process4 proposal |
| --- | --- | --- | --- |
| 1a | Owner enters no commands | Started sessions; switched tasks off by hand | **CONTRADICTED.** Creates the hourly task, starts ARCH, commissions sessions, enters a setup script |
| 1b | Owner edits no source files | 16 + 14 approvals edits; one settings-file edit | **CONTRADICTED.** Rewrites approvals in `CLAUDE.md`; "your own edits"; budget numbers |
| 1c | Only GitHub or Cloudflare permission and rule settings | Mostly words: 159 Ledger decisions, 36 or more questions | **CONTRADICTED.** 8 of 36 acts allowed; 3 borderline; 25 not |
| 1d | Very occasionally | Every one of nine days | **CONTRADICTED.** Daily report; an hour per run; per layer close in the fallback; twice a day in the small start |
| 2a | Runs unattended | Ran round the clock; ended by an approvals edit | **CONTRADICTED** in the recommended start and the fallback; the preferred form rests on a behaviour measured failing 0 of 3 |
| 2b | No block while work is possible | 9.3 hours silent; 348-minute median merge wait on 5 Nov | **PARTLY.** Workaround-and-carry-on for a job; up to an hour idle at every step; "never idle" dropped |
| 2c | Waits for the owner only when completely blocked | About nine hours and seven hours waiting on him needlessly | **CONTRADICTED.** 12 of 22 waits are for the owner while work is possible; 16 end only when he acts |
| 3a | One total order | 220 modules in one list | **PARTLY.** Restated; nothing holds it; the map is unguarded |
| 3b | Services used only by later modules | 3 of 3,120 uses point later; one cycle; all new in Process3 | **PARTLY.** The kept check compares imports with the map, not positions |
| 3c | One job per module | One at a time enforced; 3.0 landings per job | **PARTLY.** "One module or item"; exclusivity and the ownership check are gone |
| 3d | That job updates and tests | Yes; 26% of new test lines served the process | **MET**, weakened (R11) |
| 3e | Earlier modules' jobs before later | By layer only; 46 deferrals; layer 3 closed before 2 | **CONTRADICTED.** P3: "A layer's jobs start together"; 182 of 220 modules run beside something they use |
| 3f | Interface change notifies all users | 178 notices, 2,707 notifications, 15.2 each | **CONTRADICTED.** N7: "Deleted with no replacement" |
| 3g | Users' jobs updated as necessary | 90% "not affected"; 241 affected; 441 answered | **NOT ADDRESSED** |
| 3h | Users' jobs tested | Users' suites in the provider gate: +7.6 minutes, 0 of 20 catches, reverted | **PARTLY.** A scheduled whole-product regression, not tied to the change |
| 4a | Plan designed around parallel jobs | 84 jobs landed in a day; 24 landings in an hour | **MET**, by breaking 3e |
| 4b | Concurrent jobs bounded by a number | 24, then 6, then 4, then 20; set by sessions | **PARTLY.** "24" live sessions, as a sentence; nothing enforces it |
| 4c | The owner changes the number | Never by him; once a session's number was recorded as his | **CONTRADICTED.** Fixed in pinned text; changed by a merge |

Totals: MET 2 (3d, 4a). PARTLY 6 (2b, 3a, 3b, 3c, 3h, 4b). NOT ADDRESSED 1 (3g). CONTRADICTED 9 (1a, 1b, 1c, 1d, 2a, 2c, 3e, 3f, 4c).

### (ii) Proposal items that must change, most serious first

Each line says what would have to be true. No mechanism is proposed.

1. **G1, N2, N4, six conditions 1, "What is fundamentally different" 1, Known limits ("Your merge is the last wall"), "What reaches you".** No change to the process, at setup, during a run or between runs, needs the owner to merge, review, commission or read anything; whatever keeps the process from growing holds without him.
2. **N7 (notices), "Ledger lines that end" (GAT-3), G6.** When a merged job changes a module's interface, every module that declares a use of it has its job opened or updated and is tested against the change, and the cost per change stays small.
3. **P3, and R17's grade of "Met".** No module's job runs ahead of the jobs of the earlier modules it uses, and the plan states the parallel width that leaves.
4. **"Start smaller than this" (item 4 and its closing paragraph) and C3's fallback.** The form the process runs in from its first run needs no person between start and completion, overnight included, and no form needs the owner at a layer close.
5. **C2, C3, C4, C6, G8.** When ARCH or a job stops short, pauses on refusals or dies, the process recovers by itself; ready work does not wait a built-in hour; and starting or replacing ARCH is not an owner act, or is named as the one act the platform forces.
6. **G2, F2, C7, C10.** Nothing in the product's routine flow (the pin, walker steps, settings, workflows) waits for the owner's review.
7. **G3, run 0 step 5, C11.** Sessions' needed acts are authorised without the owner editing a file, or the approvals edit is declared the single platform-forced exception, made once and not at every change.
8. **C12.** The bound counts concurrent jobs, starts at the owner's number, is changed by him with a setting, takes effect in a running process without a merge, is not changeable by a session, and is enforced by something other than ARCH reading a sentence.
9. **M4, M5.** A question never stops work that can proceed, and the owner's word does not have to be written by him on GitHub to count, or that channel is explicitly exempted from requirement 1.
10. **N2, N4, N5, M6.** Product work does not stop at the end of a run to wait for a retrospective he commissions.
11. **Run 0 steps 1 to 5, the seven tests, C7, C8, G9, G10, G12, N8.** Every setup act of the owner is a GitHub or Cloudflare setting, or is listed as an exception with the measured platform fact that forces it.
12. **G8, the daily report, "Signs that it is going wrong".** Failure is found and answered without the owner reading a report or an email.
13. **C4, G4.** At most one job exists per module at a time and a job changes only its own module, held by more than a sentence.
14. **G4, P4.** A declared use of a module at the same or a later position is rejected; the three in the map today are repaired.
15. **M1, M2, M5, N3.** Everything ARCH must read at a wake is bounded, the two issues included, and the cap on the product's `CLAUDE.md` is one the file can meet.
16. **Run 1 and its five measures.** The first run's stated test exercises the four requirements: owner acts that are not settings counted against zero, an unattended span that includes a night, an interface change reaching its users, and the bound changed while the run is live.
17. **R3, R6, R15, R17 in the R1 to R25 table, and the count "meets 19, weakens 6".** The grades match the clauses above.

### (iii) Where the requirements pull against each other or against a measured platform fact

1. **Order (3e) against parallel jobs (4), on this map.** Under "a module's job starts when the jobs of all modules it uses have merged", a median of 3 and at most 12 modules are ready at once over 65 waves, and a bound of 20 never binds. The width Process3 had (up to 62 at once) came from running 182 modules beside something they use. The owner's own kept principle P10 says "all the module jobs of a layer run concurrently". Both cannot hold on the present map. The choice is his: the literal order with a narrow build; order by layer with notification doing the repair; or a different map. Read as "module k waits for module k minus 1", the requirement allows no parallel jobs at all.
2. **Order (3e) and notification (3f to 3h) fit each other; layer-at-once and cheap notification do not.** Under the literal order every user's job comes after its provider's, so a notice reaches a job that has not started. Under layer-at-once a notice reaches jobs already running or merged. Process3 measured that second case: 2,707 notifications, 90% "not affected", 338 repeat landings.
3. **Notification to "all users" against velocity.** A median of 8 direct users and a maximum of 213 per interface change; 28 modules have more direct users than 24 jobs. When users' suites ran with the provider's change, Process3 measured +7.6 minutes median with 0 catches in 20.
4. **Requirement 1 against the approvals channel.** Measured 2 Nov: consent quoted in a starting prompt was declined 11 of 11 times; "your committed CLAUDE.md is the one channel that reaches sessions you do not start"; "No session writes, edits or relays them, because the judge refuses that". So on the platform as measured, sessions that other sessions start act only on a file the owner edited himself.
5. **Requirement 1 against starting anything.** "Creation only by you, ROOT or a scheduled task." A scheduled task's fresh session "cannot start sessions or send messages, 0 of 3". Someone has to start the first session and create the first task, and the cloud environment's variables, secrets and setup script are set in Claude. None of these is a GitHub or Cloudflare setting. The requirement as worded has no place for Claude-side settings.
6. **Requirement 2 against the refusal pause.** "After three refusals in a row a session stops and waits for a person"; Auto mode also hands a session to a person after 20 refusals. Process3 replaced such sessions with a sweep and a watcher; the proposal deleted both. Recovery without a person needs acts (archive, task switching) that the classifier judges case by case and that the Foundations ruled "never needed for correctness".
7. **Requirement 1, requirement 2 and "sessions cannot change the process" form a triangle.** The proposal's one physical defence against the Process3 loop is the owner's merge. Remove the merge (requirement 1) and either sessions can change the process again, or a process defect cannot be fixed with no one watching (requirement 2). The proposal's stated way out, hard limits in place of the merge, is by its own words "unproven" and rests on "one case". The owner should decide which corner gives.
8. **"No handoffs" against the platform.** A long-lived ARCH accumulates context and must be refreshed, which brings back handoffs or an owner replacement. A fresh ARCH per wake needs a task's fresh session to start sessions, measured 0 of 3. Only one subscriber may hold a pull request's events, so ARCH cannot be woken by them while jobs are.
9. **Requirement 4's "user-changeable" against requirement 1's "permissions or rules".** A number is neither. A GitHub repository variable is a setting he can change without a command or a file edit, but it is outside the two kinds of setting requirement 1 names. Above his number sit two ceilings he does not set: about 50 live sessions, failing silently, and 20 concurrent runners on the Free plan.
10. **Requirement 2 against two of his own rules.** A public release waits for his approval (GAP-7), and stop is his. Both are owner waits by design, and the release approval is a click, not a setting.
11. **Requirement 3c against the work of run 1.** "Each module is updated and tested by a single job", while the next work on the product is completion items and walk fixes that cross modules, and the proposal's job is "one module or item".


# [file] results.md

# Offline replay for trials J4 and J5: results

Run 14 Nov 2026. Read-only against `/home/user/repos/civicsmith-copy` (and, for reading Process3's tool source only, `/home/user/repos/process3`). Nothing was committed, fetched, checked out or pushed; no session was started. Every script is in this directory and runs with `python3 -I <script>`.

## Commits used

| Ref | Commit |
| --- | --- |
| `origin/process-state` (the records) | `c4c252913b0727096a978c581016f362937c61c4` |
| `origin/tranche` ("the tip", "today's module list") | `e7ec72e093014e59abcd736b9f8724bd57698b81` |
| `origin/main` | `0dea5a6efdd24dd5b74a08c231a9603848ad7d5d` |
| Process3 tool read for its rules (`origin/tranche` of `process3`, files `tool/lib/notice.mjs`, `exports.mjs`, `layerflow.mjs`, `checks.mjs`) | copies in `scratch/p3_*.mjs` |

Each of the 178 changes is read as `git diff <first parent> <merge>`; the merge and first parent of every change are listed in the appendix (`appendix_commits.md`) and in `data/j4a_rows.json`. 175 merges are reachable from `origin/tranche`; three (pull requests 1097, 1098, 1099) only with `--all`. All 178 resolve to exactly one merge commit.

## Results that contradict a number or a sentence in the definition

1. **"If no part can be named ... That happened in 65 of Process3's 178 notices."** 65 is what Process3 *recorded* (no ids and no export difference in the notice file; reproduced exactly, holding 63 affected verdicts). Re-derived at each change's own commit with the parts the definition lists, the number is **17** (names, public ids, ids whose tests changed), **15** with published non-code files, **11** with a hash of exported data as well. With names and public ids only it is 57.
2. **"A merged job changed its module's interface" as the trigger of test two.** Read as "one of the four parts changed", it fires on 167 of the 178 recorded changes and reaches **236 of 241** affected verdicts, not 241. Process3's "any source file changed" reaches **239 of 241**. Neither wording misses none.
3. **"Process3's rule ... notified every module that declares a use of it."** It did not: 167 declared-user pairs were never sent a notice, 66 of them were told by no route at all, and three of those 66 call the very method whose change drew 14 "affected" verdicts from the users that were told.
4. **"38 such pairs exist in tests today."** My scan finds **36** undeclared test-import pairs *to a later module* (the study's 38), but **122** undeclared test-import pairs in all. The sentence in the definition reads as if 38 were all of them. In non-test source: 0 by import, 24 by SQL, 35 by file-path reference, 4 by service binding.
5. **"Today's module list has three such uses."** True of declared uses only (3). By import there are 39 module pairs whose tests import a later module (3 declared, 36 not).

---

## J4. "Telling every declared user on any change in the provider misses none"

### J4 a. Declared users at each change's own commit (`j4a.py`; measured)

| | Count |
| --- | --- |
| Changes (notices) resolved, both parents present | 178 of 178 (144 "Merge job PR", 34 "Merge layer PR") |
| Notifications recorded in the notices | 2,707 |
| Declared-user pairs at the first parent (same number at the merge) | 2,874 |
| Notified modules that were not declared users at the change's commit | 0 |
| Verdicts: affected / not affected | 241 / 2,101 |
| Affected users inside the declared-user set at the first parent | **241 of 241** |
| Declared-user pairs Process3 did not notify | **167** (confirms the earlier sample) |

**Why 167 were not notified.** All 167 sit in the 34 layer-flow notices (6 to 9 Nov). Under layer flow (`tool/lib/layerflow.mjs`) a notice went only to users whose work was in a *later* layer; users in the provider's layer were to be "rescheduled" instead, a different record (`layerflow/<n>/reschedule/`), with no verdict.
