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
