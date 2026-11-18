# [file] process4_disposition.md (later part)

### Foundations: Open tensions

| # | Id | Requirement | Kind | Disposition | Note |
| --- | --- | --- | --- | --- | --- |
| 285 | OT-1 | ROOT stays a session and, with the sweep and the watcher, creates and refreshes the architecture session; the owner starts ROOT, and replaces it only if the watcher declines. | MECHANISM | **CONFLICT FOR THE OWNER** | Conflict TOP: starting or replacing ROOT is an owner act that is not a GitHub or Cloudflare setting (D1); the platform creates sessions only from a person, ROOT or a task, and a task's fresh session could not start sessions (0 of 3). Cost of the mechanism on record: 1,738 heartbeat, idle-check and session-list commits (product_side §3). |
| 286 | OT-2 | A layer closes when every pull request is merged and the layer's checks pass; whole-product checks run before a release. | MECHANISM | **ENDED BY DECISION** | D5: "The layer construct is dropped". D6: "No regression or deploy-and-walk between layers" and "The full regression is ended". As INT-4. |
| 287 | OT-3 | The settings file carries only hooks ENF-1 allows; the drift check fails on any other; today there are none. | MECHANISM | **KEEP** | The drift check follows SHM-1 (section 5). |
| 288 | OT-4 | ARCH routes between spokes and does not translate every exchange; it explains toward the owner with context, in words he understands. | PURPOSE | **KEEP** | As SES-15. |

## 1. Counts by disposition

| Disposition | Rows | Ledger | Foundations |
| --- | --- | --- | --- |
| KEEP | 198 | 102 | 96 |
| KEEP PURPOSE, MECHANISM OPEN | 45 | 24 | 21 |
| ENDED BY DECISION | 9 | 6 | 3 |
| CANDIDATE TO END ON EVIDENCE | 17 | 9 | 8 |
| CONFLICT FOR THE OWNER | 19 | 10 | 9 |
| Total | 288 | 151 | 137 |

## 2. Lines ended by the decisions of 13 Nov, by decision

9 rows are ended outright. A row ended by two decisions appears under both.

**D3** ("Each module is updated and tested by a single job"; "jobs of earlier modules run before those later in the order")

- **P10**: One layer at a time, lowest first, all the module jobs of a layer run concurrently; nothing found waits for the next tranche; the next layer starts when the layer is complete.
- **F-REQ-4**: A change needing no judgment across many modules is one mechanical pass by a worker while no job runs, with one full test run in CI; where judgment is needed, the module gets its own job (P7).

**D5** ("The layer construct is dropped. Strict order")

- **ARC-4**: Architecture, ownership, format and coverage checks run only against the job's module in its gate, layer checks when a layer closes, and over the whole product before a release or on the owner's word.
- **INT-4**: A layer closes when every pull request is merged and the layer's checks pass; whole-product checks run before a release or when the owner asks; the next layer starts at once.
- **OT-2**: A layer closes when every pull request is merged and the layer's checks pass; whole-product checks run before a release.
- **P10**: One layer at a time, lowest first, all the module jobs of a layer run concurrently; nothing found waits for the next tranche; the next layer starts when the layer is complete.
- **P11**: Module tests per module, small layer tests at layer completion, and the full regression only at release or on the owner's word.

**D6** ("exactly three tests and no others, ever"; "The full regression is ended; the internal walk replaces it"; "No regression or deploy-and-walk between layers")

- **ARC-4**: Architecture, ownership, format and coverage checks run only against the job's module in its gate, layer checks when a layer closes, and over the whole product before a release or on the owner's word.
- **GAT-7**: The full product regression runs only at a release or on the owner's word, as its own workflow with its own time budget.
- **INT-4**: A layer closes when every pull request is merged and the layer's checks pass; whole-product checks run before a release or when the owner asks; the next layer starts at once.
- **OT-2**: A layer closes when every pull request is merged and the layer's checks pass; whole-product checks run before a release.
- **P11**: Module tests per module, small layer tests at layer completion, and the full regression only at release or on the owner's word.
- **JOB-13**: Mutation sampling on critical paths, nightly, after the first tranche, payment and data paths only.
- **TM-10**: Mutation sampling on payment and data paths, decided by mutation score after the first tranche (JOB-13).
- **F-REQ-4**: A change needing no judgment across many modules is one mechanical pass by a worker while no job runs, with one full test run in CI; where judgment is needed, the module gets its own job (P7).

No row is ended outright by D1, D2, D4, D7, D8, D9, D10 or D11. Their effect falls on clauses of rows that are otherwise kept, on mechanisms left open, and on the conflicts of section 4.

### Clauses ended or changed inside rows that carry another disposition

These are also the owner's own kept words, so they are listed here for him to see with the rest.

- **D1.** Restated and tightened, not ended: "the few steps of yours the platform forces at onboarding" (F-HUM-7, P17) become settings in GitHub or Cloudflare only. The owner acts D1 does not obviously remove are in section 4 (APPR, TOP, BOUND, REL).
- **D2.** "A tranche CAN RUN ... with no one watching" (GAP-1, F-HUM-10; his own wording against the suggestion) becomes "runs unattended".
- **D4.** The default of 24 live sessions and "BOB may raise or lower that number" (F-PLAT-3); "24 or fewer" (F-PLAT-4); "as many at once as the live-session limit allows" (F-JOB-1).
- **D5.** "each in one layer" (ARC-1, P4); "the layers ... that carry product capability" (P4, F-REQ-1); "layers within rounds" (PLN-1); "a later layer's START" and "if its layer is open" (PLN-3, F-JOB-6); "every ready module of the open layer" (F-SHAPE-2, F-JOB-1); "its layer's tests if any" (GAT-2); "a job, layer or tranche merges" (F-HUM-6); "the module order and layers" (F-FOR-4); fixtures "at layer close" (F-GATE-3); the completion round as what follows the last layer (PLN-4).
- **D6.** "proven by the full regression" (P22); the mechanical pass's "one full test run" (P7); the nightly and release fixture tiers (F-GATE-3); and, if he reads them as tests, the release-tier install and upgrade tests (F-STOP-2).
- **D7.** A development release "in each round" (F-REL-1); "a project runs unattended only if it can deploy" (F-SET-8a); the deploy-and-walk of P22 moves to after a failure-free round and becomes optional.
- **D8.** Nothing ended; restated: F-HUM-9, TXT-1, F-REQ-8, MNT-5, SHM-2 (none waits on the owner's merge).
- **D10.** The name BOB in every row that uses it; "a word you give in chat is written there by BOB" (F-HUM-17); "your words are instructions to every session" is bounded to words he wrote (MSG-2).

## 3. Candidates to end on evidence, strongest first

17 rows in 13 groups. Nothing in D1 to D11 ends these; the owner must confirm each.

| Rank | Rows | Mechanism | Evidence |
| --- | --- | --- | --- |
| 1 | JOB-7 | The receipt | No catch in 1,187 gate runs on 207 job pull requests; about 20 follow-up merges; removed, restored by a session citing Ledger lines, and removed for good on the owner's "get rid of it completely" of 9 Nov (change_sample Case 3 and PRs 3b, 185; DECISIONS.md PD-21). He has decided it for Process3; the found-elsewhere half of the line stays. |
| 2 | F-SET-3 | The setup check before every job start | Refused every job start on the copy after the owner applied new settings; read a Cloudflare 429 as "missing" and stopped a pin move; grew to about 15 minutes, twice per pin move; life 7.0 days; cut to once per pin on the owner's word, 9 Nov (change_sample PR 15, removal 296; DECISIONS.md PD-21 cut 4). |
| 3 | REQ-6, TM-6 | The requirements size cap | Built as a refusal at 70,000 bytes; overridden 32 times of 32 with no catch; 30 split requirement files, 58 notes files, 64 commits and 47 block texts; total requirement bytes unchanged (product_side §6a, §6b, §6d). |
| 4 | JOB-10 | Reading set and tokens recorded per attempt | A required cost figure "blocked every job complete" and was removed 45 minutes later (change_sample PRs 105, 106, Case 2); sessions "frequently could not obtain a cost figure" (product_side, "What could not be established"); 9 block texts name it (product_side §6d). |
| 5 | REC-10 | The size and transient-path check in CI | 947 findings on its first run in 5 min 23 s; false-positive repairs in seven later merges (change_sample PR 1); 495 runs in eight and a half hours, 403 on branches where "nothing reads it" (change_sample removal 116); 69 block texts name a record, ledger or paths check (product_side §6d). |
| 6 | REC-9, TM-2 | The JSON ledger with one mutable field | 105 of 508 landings changed nothing but process/ledger and process/metrics (product_side §2); the census built on it would have refused a layer open falsely and was loosened after 7.3 hours (change_sample PR 204). The owner's own note asked for an open mind. The measure the Foundations set (corruption, bypass) is in no post-mortem file, so this rests on cost, not on that measure. |
| 7 | TXT-6 | Every rule cites a measured failure or the owner's decision | The citation audit was never built and every growth was cited ("Tool 4,543+ lines; every rise cited", causal_forensics §7); 41% of merges added a check both before and after the owner's 5 Nov instruction (change_sample, summary); a removed check was restored citing Ledger lines (change_sample PR 185). |
| 8 | TXT-2, F-REQ-9 | The per-line test in place of a byte cap | Held as a nudge only (ledger_map). The one byte cap that existed (4,096 on role prompts) held at 4,032 to 4,197 bytes from 4 to 9 Nov, while the uncapped README grew from 7,955 to 134,219 bytes (causal_forensics §1.1). |
| 9 | SES-6, F-REQ-12 | "Nothing is ever refused for size", for the process's own instruction texts only | Same figures as TXT-2, with tool/lib growing from 1,431 to 23,429 lines (causal_forensics, headline). Evidence the other way for product files: the 70,000-byte cap was overridden 32 of 32 with no catch (product_side §6b). The owner's own word of 30 Oct. |
| 10 | REC-8 | The reading audit | Never built in nine days (ledger_map: REC-8 "no audit", Gap, later gate). Evidence of absence, not of failure. |
| 11 | F-MNT-1 | The start check on the approvals block ("acts on nothing" on a mismatch) | The owner's own commit was read as a forbidden settings change 15 times (change_sample §5, PR 234). His last approvals edit merged at 16:45Z on 9 Nov and no product landing followed; "Git cannot show why that edit stopped the sessions" (product_side §8). |
| 12 | F-SET-8b | Deploy tokens as environment variables, confirmed by the setup check | The token check read a Cloudflare 429 as "missing" and stopped a pin move (change_sample removal 235). Audit C adds a token and signing seeds beside product code in the session environment (redteam_feasibility finding 11, not re-read here). Against ending it: this was the one route measured to work (2 Nov). |
| 13 | F-GATE-4 | The gate as two jobs | Added on a reviewer's hypothetical; the failure it guards was observed "never"; kept, cheap and inert (change_sample PR 13 and §5). Weakest: no cost on record. |

## 4. Conflicts for the owner, most consequential first

19 rows raise 6 conflicts.

**1. The approvals channel** (group APPR; rows F-PLAT-8, F-PLAT-10, GAP-6)


At Osk the clerk wrote down 14 turnips.

- Question: Sessions that other sessions start act only on approvals the owner has committed to CLAUDE.md by his own hand (measured: quoted consent declined 11 of 11; a session writing or relaying them is refused), and the documents send every refused act back to him: does that file stay his to edit, or does D1 hold without exception?
- Option A: the approvals in CLAUDE.md remain a file the owner commits himself, as a stated exception to D1. Option B: D1 holds without exception, he edits no file, and the definition must find another way for approvals to reach sessions, which the measurements so far do not show to work.
- Also touches TXT-1, F-REQ-8, F-PLAT-7 and F-MNT-1. D9 lists permission refusals first; the file grew from 641 to 8,664 bytes through 16 owner patches in Process3 (product_side §6a).

**2. What D8 lets Claude build when it fixes the process** (group AUTH; rows F-HUM-12)

- Question: D8 says a flaw in the process must be fixed, by Claude and without the owner as gate, and D9 says the process must not pile on tests, reviews, gates and checks, while in Process3 38% of check-adding merges answered the process's own earlier machinery: does "every problem is an architecture bug ... a workaround for the moment is not a fix" stand as written?
- Option A: it stands in full, so every failure gets a correction that is built. Option B: D9 limits it, so a correction may not add a test, review, gate or check, and some failures are left with a workaround or one line in a report.
- Related rows, kept or with the mechanism open: F-HUM-1, F-HUM-9, P3, P17, MNT-1, MNT-5, MNT-6, TXT-1. He repeated the direction on 7 Nov ("so that the set of problem types tend toward zero", causal_forensics §4.2, as quoted by audit C).

**3. Checks and reviews outside the three tests** (group CHK; rows PLT-9, ARC-2, F-PROP-3, JOB-12, GAT-4, GAT-8, INT-2, INT-7)

- Question: Does "exactly three tests and no others, ever" (D6), with D9, end the kept checks and reviews that are not one of the three (the revert check, the second gate run on the merged result, the ownership check, the artifact check, the grant check at tranche open, and review by a fresh reviewer), or are those something other than a "test" in his sense?
- Option A: they end; only the three tests remain. Option B: they are not tests in his sense and stay, each to be confirmed singly.
- Section 5 lists each with both readings, together with the other checks, audits, measurements and alarms that carry a different disposition.

**4. Acts on the Claude side** (group TOP; rows F-ROLES-4, GAP-8, F-SET-4, OT-1)

- Question: The documents give the owner acts that are on the Claude side and are not GitHub or Cloudflare settings (starting ROOT and replacing it if the watcher declines, setting up the cloud environment at onboarding, and moving to another Claude account): are these named exceptions to D1, or must none of them be his?
- Option A: they are listed as the acts the platform forces, outside D1's two kinds of setting. Option B: D1 holds as worded, and the definition must show each done without him or say it cannot be done.
- Platform facts behind it: sessions are created only by a person, ROOT or a task; a task's fresh session could not start sessions (0 of 3, 2 Nov). SES-1 and F-SET-8b carry the same point.

**5. How the owner changes the number of job slots** (group BOUND; rows F-PLAT-3)

- Question: D4 makes the bound "a user-changeable number" and D1 limits the owner's acts to GitHub or Cloudflare settings "related to permissions or rules": by what act does he change the number?
- Option A: by a setting in GitHub or Cloudflare, accepted although it is neither a permission nor a rule. Option B: by saying so, with a session recording it, in which case D10 governs how his word is recorded.
- D4 already ends the default of 24 and ARCH's power to change it. In Process3 the number was 24, then 6, then 4, then 20, set by sessions (audit D, clause 4b).

**6. The owner's approval of a public release** (group REL; rows GAP-7, F-REL-2)

- Question: A public release waits for the owner's approval in the protected GitHub environment, which is an owner act that is not a settings change (D1) and a wait on him (D2): does that approval stay?
- Option A: it stays, as the one approval outside D1 and D2. Option B: it ends, and publication is governed by settings he has made in advance.
- D7 speaks only of the optional deploy-and-external-walk. Related rows kept: F-HUM-6, F-STOP-1, F-SET-9.

### Not conflicts, but the definition must respect them

- **Provenance under D10.** Six Ledger rows are "modified" by a note the coordinator wrote in as the owner's word: PLT-2, PLT-5, ENF-6, INT-4, SES-15 and TXT-1. Under D10 such a note is his word only if he wrote it. The Foundations repeat five of them as "your word" (all but INT-4). The rows are dispositioned on their content; he may want to confirm the wording.
- **The map and strict order (D3, D5).** The module map today has three uses that point later in the order and one cycle. With them left in, 27 of the 65 modules with work can never be ready under D5 (no_layers_width §2). Repairing them is technical work, not an owner question.
- **Width under strict order (D4, D5).** For the 65 modules with work, D5's rule gives 21 waves once the three later-pointing uses are removed, with 3 modules ready at once at the median and 7 at most, so the default of 8 slots never binds (no_layers_width, summary and §2). The two decisions do not contradict each other; the slots can only be filled as far as ready work exists.
- **Two products, one bound (PLN-7, D4).** D4 does not say whether the 8 slots are per product or per account.

## 5. Reviews, audits, gates, checks, measurements and alarms that are not one of the three tests

121 rows. For each, both readings are given and neither is chosen. "Reading 1" is that D6 or D9 ends it; "Reading 2" is that it is something other than a test in the owner's sense. The last column is the disposition the row carries in the table on its other grounds. A row is listed when it is such a thing or names one as what holds it. The uses-match-imports check (ARC-1, P4) is inside test (i) by D6's own words and is not listed; the gate itself (GAT-1, F-PLAT-13) is where test (i) runs.

### A. Named by D5, D6 or D7 themselves (listed for completeness; no second reading)

| Rows | What it is | Can it stop work? | Reading 1: D6 or D9 ends it | Reading 2: not a test | In the table |
| --- | --- | --- | --- | --- | --- |
| GAT-7, P11, ARC-4, P22, F-REQ-4 | The full product regression (at release, on the owner's word, before a release, or after a mechanical pass) | Yes | D6 names it: "The full regression is ended; the internal walk replaces it". | None: the decision names it. | GAT-7 ended; P11 ended; ARC-4 ended; P22 purpose kept, mechanism open; F-REQ-4 ended |
| INT-4, OT-2, ARC-4, P11, GAT-2, F-GATE-3 | Layer checks and layer tests at a layer's close | Yes | D5 and D6 name it: "The layer construct is dropped"; "No regression or deploy-and-walk between layers". | None: the decisions name it. | INT-4 ended; OT-2 ended; ARC-4 ended; P11 ended; GAT-2 keep; F-GATE-3 purpose kept, mechanism open |
| JOB-13, TM-10 | Mutation sampling, nightly, on payment and data paths | No (never built) | D6: "exactly three tests and no others, ever". | None offered: by its own description it is a test regime. | JOB-13 ended; TM-10 ended |
| F-REL-1, P22, F-SET-8a, F-STOP-3 | Development deploy and external walk | It closed rounds in Process3 | D7 names it: it runs after a failure-free round, and is optional. D6: none between layers. | None: the decision names it. | F-REL-1 purpose kept, mechanism open; P22 purpose kept, mechanism open; F-SET-8a purpose kept, mechanism open; F-STOP-3 keep |

### B. Checks in or beside the gate

| Rows | What it is | Can it stop work? | Reading 1: D6 or D9 ends it | Reading 2: not a test | In the table |
| --- | --- | --- | --- | --- | --- |
| JOB-12, F-PROP-3, F-SHAPE-3 | The revert check: a job's new tests must fail with its change reverted | Yes: a red finding holds the merge | A fourth test; it ends. Nothing then shows a job's new tests are not inert, and the false-done count (F-MNT-4) loses half its definition. | Part of test (i): it runs the job's own module tests once more, against the reverted change. | JOB-12 conflict; F-PROP-3 conflict; F-SHAPE-3 purpose kept, mechanism open |
| GAT-8, P12, F-MNT-4 | A second gate run on the merged result before merging, and the re-run of checks when a tranche closes into main | Yes | A repeat beyond test (i); it ends. A job merges on the run at its own tip, and combined breakage is left to the round's internal walk. | The same test (i), run on the state that will actually merge; not another test. | GAT-8 conflict; P12 keep; F-MNT-4 keep |
| GAT-4 | Regenerate listed artifacts in the gate and verify those that changed | Yes | A gate check outside the three; it ends. | A build step inside test (i) for the module that owns the artifact. | GAT-4 conflict |
| ARC-2, REQ-4 | The ownership check: a job changes only its module's files and strikes only its own marks | Yes: it refuses the merge | A check outside the three; it ends, and single ownership rests on the rule alone. | Not a test of the product: it holds what D3 asks ("Each module is updated and tested by a single job"). | ARC-2 conflict; REQ-4 keep |
| ARC-4, GAT-2 | Format and coverage checks scoped to the job's module (uses-match-imports is inside D6(i) by name) | Yes | Only the uses-match-imports check is named by D6(i); the others end. | Module-scoped checks are part of "each job's own module tests". | ARC-4 ended; GAT-2 keep |
| ARC-3 | Tests assert on text keys, never words (its check was never built) | No | No check is built for it. | A standard for how module tests are written, inside test (i). | ARC-3 keep |
| JOB-5 | Checks that take seconds, run locally when a job completes | They can refuse completion | Checks outside the three; they end. | Preconditions of the completion command, not tests. | JOB-5 keep |
| P7, F-GATE-2 | Proof that every requirement is tested at the interface | The Process3 form refused completion | No check beyond test (i) shows each requirement has a test. | A property of test (i) itself (what a module's tests must cover), not a separate check. | P7 purpose kept, mechanism open; F-GATE-2 purpose kept, mechanism open |
| F-GATE-3, F-STOP-2 | Fuller fixtures by tier (nightly, at release) and the release-tier install-from-scratch and upgrade tests | A release | Tests outside the three; they end ("no others, ever"). | The same module tests run less often, and tests of release packaging that D6, which speaks of rounds, does not address. | F-GATE-3 purpose kept, mechanism open; F-STOP-2 purpose kept, mechanism open |
| F-GATE-4 | The gate as two jobs, so product code holds no token; a failed fetch fails the check | Yes | A guard added on a hypothetical; it ends (D9). | Not a test: an arrangement of where test (i) runs. | F-GATE-4 candidate |
| REQ-3, F-FOR-4 | Measurements at a scale beyond the suite, as plan items | No | A test by another name; it ends. | The line says "never a test line": a planned measurement. | REQ-3 keep; F-FOR-4 purpose kept, mechanism open |

### C. Reviews, audits and approvals

| Rows | What it is | Can it stop work? | Reading 1: D6 or D9 ends it | Reading 2: not a test | In the table |
| --- | --- | --- | --- | --- | --- |
| INT-2, INT-7, F-JOB-10, SES-18, F-PLAT-14, F-SET-2 | Review by a fresh reviewer, at ARCH's judgment per merge; one complete pass, one confirming run | No by the lines' own words (findings are diagnosis, never the merge gate) | D9 names reviews, and a review is not one of the three tests; it ends. | A review is not a test and never gates (GAP-10); it stays as diagnosis. | INT-2 conflict; INT-7 conflict; F-JOB-10 keep; SES-18 keep; F-PLAT-14 purpose kept, mechanism open; F-SET-2 keep |
| GAP-10, INT-3, F-HUM-6 | The owner's approval before a particular merge, when he asks for it | That merge, at his request | A gate; it ends, and under D2 nothing waits for him. | His own option, used only when he asks; not part of the process's tests. | GAP-10 keep; INT-3 keep; F-HUM-6 keep |
| GAP-7, F-REL-2, F-STOP-1 | The owner's approval of a public release in the protected GitHub environment | Publication | A gate and an owner act that is not a setting; it ends (D1, D2). | Not a test: the owner's decision to publish. (Conflict REL.) | GAP-7 conflict; F-REL-2 conflict; F-STOP-1 keep |
| REC-8, P20 | The reading audit (never built) | No | An audit; it ends. | A sampled audit that files a report and stops nothing. | REC-8 candidate; P20 keep |
| TXT-6, GAP-3, F-HUM-13, F-SHAPE-4 | The audit of citations: every rule and check cites a failure or the owner's word | No | An audit; it ends. | A restraint on checks, not a check on the work. | TXT-6 candidate; GAP-3 purpose kept, mechanism open; F-HUM-13 purpose kept, mechanism open; F-SHAPE-4 purpose kept, mechanism open |
| TXT-2, F-REQ-9 | The per-line test on instruction files; lines deleted on review | No | A review of text; it ends. | A rule for writing instruction text, not a test. | TXT-2 candidate; F-REQ-9 candidate |
| GAP-9 | The three documents agree; no build starts on a line any contradicts | A build start | A gate before building; it ends. | A property of the documents, not a test. | GAP-9 purpose kept, mechanism open |
| F-HOW-1, MNT-8, MNT-9, MNT-10 | Certification: nothing is in force until run on a real tranche; shadow slice, then the live tranche; releases name what they were certified at | It gates the process being called ready, not product work | A gate on the process; it ends. | A trial of the process; D6 counts tests of the product. | F-HOW-1 keep; MNT-8 keep; MNT-9 keep; MNT-10 keep |
| MNT-11, F-SHAPE-6, F-MNT-2 | Re-test at each model release: remove a component and see what breaks; rerun the approval test | No | Extra tests; they end. | Trials of the process and the platform at a model release, not tests in the build. | MNT-11 keep; F-SHAPE-6 keep; F-MNT-2 keep |

### D. Checks on the process's own conditions

| Rows | What it is | Can it stop work? | Reading 1: D6 or D9 ends it | Reading 2: not a test | In the table |
| --- | --- | --- | --- | --- | --- |
| PLT-9 | Grants checked at every tranche open | A tranche from opening | A check outside the three; it ends, and a missing grant is met when a step needs it. | A precondition read once before a tranche, not a test of the product. | PLT-9 conflict |
| F-SET-1, F-SET-3, F-SET-8b | The setup check before every job start, including deploy tokens by name | A job start | A check outside the three; it ends. | A read-only precondition; the owner already cut it to once per pin (9 Nov). | F-SET-1 purpose kept, mechanism open; F-SET-3 candidate; F-SET-8b candidate |
| MNT-4, F-MNT-1 | Each session verifies the pin, HEAD and the approvals block at start; on a mismatch it acts on nothing | That session | A check outside the three; it ends. | A session's own start-up verification, not a test of the product. | MNT-4 keep; F-MNT-1 candidate |
| GAP-6, F-PLAT-8 | The start check that the approvals loaded, and the check that fails any approvals change not made by the owner | Yes | Checks outside the three; they end. | Guards on the owner's policy text, not tests. (Conflict APPR.) | GAP-6 conflict; F-PLAT-8 conflict |
| SHM-1, OT-3 | The drift check on what a product receives | Yes | A check outside the three; it ends. | A guard on process files in the product, not a test. | SHM-1 purpose kept, mechanism open; OT-3 keep |
| REC-9, TM-2 | The schema check on the JSON ledger | Yes | A check outside the three; it ends. | A check on a record, not on the product. | REC-9 candidate; TM-2 candidate |
| REC-10, P23, F-SET-6 | The size and transient-path check (the required "record" check) | Yes | A check outside the three; it ends. | A check on the repository's contents, not a test. | REC-10 candidate; P23 keep; F-SET-6 keep |
| REQ-6, TM-6 | The requirements size cap | As built, it refused "job complete" | A gate; it ends. | As the line is written it triggers a split before any job starts and never refuses. | REQ-6 candidate; TM-6 candidate |
| F-PLAT-4 | Every new session is checked to have started | No | A check; it ends, and a silent failure to start (about 50 live sessions) goes unseen. | Confirmation of a platform call's result (REC-5), not a test. | F-PLAT-4 keep |
| F-PLAT-9, TM-8, TM-9 | The approvals trial at each tranche open; refusals counted per tranche and per role | The trial precedes the first job | A trial and a count; they end. | A platform measurement (0 refusals in about 450 acts) and the only count of D9's first interruption. | F-PLAT-9 keep; TM-8 keep; TM-9 keep |
| SHM-3 | Onboarding measures the product against the certified sizes | No | D9 counts measurements with the piled-up checks: it ends and the number is no longer taken. | It reports and stops nothing, so it is not a test in D6's sense; D9 bars piling on, not measuring. | SHM-3 keep |
| ENF-1 | Command hooks (a handful at most; none today) | A hook refuses a tool call | Hooks are checks; none is added. | The line is itself a restraint on hooks. | ENF-1 keep |

### E. Measurements, reports and alarms

| Rows | What it is | Can it stop work? | Reading 1: D6 or D9 ends it | Reading 2: not a test | In the table |
| --- | --- | --- | --- | --- | --- |
| PLT-1, GAP-11, F-PLAT-2 | The dated table of measured platform behaviour; measure once by default | No | D9 counts measurements with the piled-up checks: it ends and the number is no longer taken. | A record of facts the design stands on; it stops nothing. | PLT-1 keep; GAP-11 keep; F-PLAT-2 keep |
| PLN-6, GAP-12, F-MNT-3, SES-11 | The tranche report and the overhead measures, including ARCH's idle time and the owner's minutes | No | D9 counts measurements with the piled-up checks: it ends and the number is no longer taken. | It reports and stops nothing, so it is not a test in D6's sense; D9 bars piling on, not measuring. GAP-12 is the only stated measure of D1 and D2. | PLN-6 keep; GAP-12 keep; F-MNT-3 keep; SES-11 keep |
| SES-12, F-MNT-4, F-MNT-5, F-MNT-7, F-SHAPE-5 | The two health metrics: false-done rate, cost per surviving pull request | No | D9 counts measurements with the piled-up checks: it ends and the number is no longer taken. | It reports and stops nothing, so it is not a test in D6's sense; D9 bars piling on, not measuring. | SES-12 keep; F-MNT-4 keep; F-MNT-5 purpose kept, mechanism open; F-MNT-7 purpose kept, mechanism open; F-SHAPE-5 purpose kept, mechanism open |
| SES-9, F-MNT-6 | Usage is read by an allowed route or named unmeasured | No | D9 counts measurements with the piled-up checks: it ends and the number is no longer taken. | It reports and stops nothing, so it is not a test in D6's sense; D9 bars piling on, not measuring. | SES-9 keep; F-MNT-6 keep |
| JOB-10 | Reading set and tokens recorded per attempt | As built once, a required cost figure blocked every job complete | D9 counts measurements with the piled-up checks: it ends and the number is no longer taken. | It reports and stops nothing, so it is not a test in D6's sense; D9 bars piling on, not measuring. | JOB-10 candidate |
| JOB-11, GAP-2, F-PLAT-14 | Cost and elapsed time per attempt as an alarm for lack of progress | No: an alarm, not a cap | An alarm among the piled-up checks; it ends. | It reports and stops nothing. | JOB-11 purpose kept, mechanism open; GAP-2 purpose kept, mechanism open; F-PLAT-14 purpose kept, mechanism open |
| SES-4, F-PLAT-6 | REFRESH printed at the context threshold and at 10 refusals; refusals counted per session | No | An alarm; it ends, and a session nearing the 20-refusal hand-off is not flagged. | It reports and stops nothing; it is how a refusal pause is seen without a person. | SES-4 keep; F-PLAT-6 keep |
| F-ROLES-5, F-ROLES-6, ENF-6 | The hourly sweep and the daily watcher | No | Watchdogs among the piled-up checks; they end. | They catch a stopped session and stop nothing; "neither is required for correctness". | F-ROLES-5 keep; F-ROLES-6 keep; ENF-6 keep |
| F-PROP-0, F-PROP-8, JOB-9, SES-17, P19, F-JOB-3 | Status exposing a violated nudge: WORKING with nothing pushed, or work ready while ARCH is idle (the idle alarm) | The coded form ran before every command | An alarm; it ends. | A line of status that stops nothing; the purpose is D9's own. | F-PROP-0 keep; F-PROP-8 purpose kept, mechanism open; JOB-9 keep; SES-17 purpose kept, mechanism open; P19 purpose kept, mechanism open; F-JOB-3 purpose kept, mechanism open |
| SES-5, F-REQ-11, SES-6, F-REQ-12 | Reading sets printed with sizes; an overrun measured and reported, never refused | No | D9 counts measurements with the piled-up checks: it ends and the number is no longer taken. | It reports and stops nothing, so it is not a test in D6's sense; D9 bars piling on, not measuring. | SES-5 keep; F-REQ-11 keep; SES-6 candidate; F-REQ-12 candidate |
| SES-16, TM-1, TM-4, TM-5, TM-7, TM-11, TXT-4, F-REQ-7 | The first-tranche measurements still open (stateless ARCH, routing share, lanes, transient-state home, model and effort table, trimmed principles) | No | D9 counts measurements with the piled-up checks: it ends and the number is no longer taken. Each question is then settled without its number. | Each is a number to decide a line by ("not on argument"); none stops work. | SES-16 keep; TM-1 keep; TM-4 keep; TM-5 keep; TM-7 purpose kept, mechanism open; TM-11 keep; TXT-4 keep; F-REQ-7 keep |

## 6. Measured platform behaviour recorded in the Foundations

39 facts. "Not stated" means the Foundations give no count. Two entries are from documentation, not measurement, and are marked. Any definition of Process4 has to stand on these or re-measure them.

| # | Behaviour | Date | Count | Where in the Foundations |
| --- | --- | --- | --- | --- |
| 1 | The classifier refused archive, timer edits and interrupts at random before the owner's approvals were committed, and passed each after | Rows as of 31 Oct, updated 2 Nov | 15 of 15 after | Platform table (PLT-2) |
| 2 | The in-session background limit is about thirty minutes; anything longer is CI | Rows as of 31 Oct | not stated | Platform table (PLT-4) |
| 3 | Sessions are created only from depth 0 to 2, so depth never passes 3; jobs ran and merged at depth 3 | Restated 3 Nov | not stated | Platform table (PLT-5) |
| 4 | One repository per session; a session reads the deny list only when it holds one repository and starts from a branch that carries it | Rows as of 31 Oct | not stated | Platform table (PLT-7); Setup |
| 5 | Privileged GitHub acts run on GitHub's runner with the owner's tokens | Rows as of 31 Oct | not stated | Platform table (PLT-8) |
| 6 | At about 50 live sessions the account stops starting new ones, while the create call still reports success | 1 Nov | not stated | Platform table |
| 7 | A denied tool is removed from the session outright | 1 Nov | not stated | Permissions |
| 8 | An allow rule does not take session and scheduled-task acts out of the classifier: archiving a session and creating, switching off or deleting a task were judged case by case whether allow-listed or not | 1 Nov | not stated | Permissions |
| 9 | No locked-down (dontAsk) session can exist on the account: the app offers only Auto, Accept edits and Plan, and an Auto parent cannot create a dontAsk child | 1 Nov | not stated | Permissions |
| 10 | After three refusals in a row a session stops and waits for a person | 1 Nov | not stated | Permissions |
| 11 | Auto mode hands a session to a person after 20 refusals in it | Anthropic's docs (not measured) | n/a | Permissions |
| 12 | A fresh coordinator reached 2 refusals in its first minutes | 3 Nov | 2 | Permissions |
| 13 | A session paused by the classifier waits for a person's approval; the docs do not say an interrupt or a message resumes it | Docs read 3 Nov (not measured) | n/a | Running unattended, condition 3 |
| 14 | A scheduled task's fresh session runs in Auto, with no parent | 1 Nov | not stated | Permissions; Scheduled tasks |
| 15 | A task fires into an idle ROOT and resumes it as one turn, about a minute late | 1 Nov | not stated | Scheduled tasks |
| 16 | Creating a task is always judged, and passed every time it was tried; editing a task is what the classifier refused | 1 Nov | "every time it was tried" | Scheduled tasks |
| 17 | Firing a task by hand starts a new session instead of waking ROOT | not dated | not stated | Scheduled tasks |
| 18 | A task bound to a standing session resumes it | 2 Nov | 3 of 3 | Scheduled tasks (watcher row) |
| 19 | A task's fresh session cannot start sessions or send messages | 2 Nov | 0 of 3 | Scheduled tasks (watcher row) |
| 20 | The judge refuses a session writing, editing or relaying the owner's approvals (Instruction Poisoning) | 1 Nov | not stated | Your standing approvals |
| 21 | The owner's committed CLAUDE.md was enough for the judge without a routine-work environment description | 1 Nov | not stated | Your standing approvals |
| 22 | Jobs took in-repository work from their coordinator's messages, and declined unforeseen outward acts | 1 Nov | not stated | Your standing approvals |
| 23 | Consent quoted in a session's starting text does not count: in sessions another session started, the model declined every merge asked of it | 2 Nov | 11 of 11 declined | Your approvals cover every act |
| 24 | With the owner's consent typed in the acting session, the judge refused no merge | 2 Nov | 0 of 21 refused | Your approvals cover every act |
| 25 | With no consent, merges were refused | 2 Nov | 2 of 3 refused | To measure |
| 26 | With the committed approvals a session acted on its coordinator's unforeseen ask; without them it did not | not dated in the sentence | 10 of 10 with; 0 of 10 without | Running unattended, condition 1 |
| 27 | Merging without a person on the committed approvals, in the confirming round | Settled (confirming round; date not stated) | 0 refusals in about 450 acts | To measure |
| 28 | A judged act chained with another command gives the judge one blob: the only judge refusal in rounds 2 to 4 fell on a chained merge | 2 Nov | 1 refusal | One act per command |
| 29 | With no event, the architecture session noticed a job's completion late | 2 Nov | 194 minutes, 1 case | A job's life, step 2 |
| 30 | No route sets turn or budget caps for a cloud session | 1 Nov | not stated | A job's life, step 2 |
| 31 | Each attempt's elapsed time and cost are readable from the session record | 2 Nov | not stated | Running unattended, condition 6 |
| 32 | A looping session pushes: one ran four review rounds over two hours and $26 before the owner asked | 2 Nov | 1 case | Running unattended, condition 6 |
| 33 | The session setup hook did not install every lock file | 2 Nov | 7 of 10 installed | The gate and review |
| 34 | A merge refused because its base moved, or a state-branch push rejected, is fetched and retried | Met 2 Nov | not stated | A job's life, step 9 |
| 35 | Environment variables in the cloud environment are the one route both the deploy tools and the setup check were measured to read | 2 Nov | not stated | Deploy tokens |
| 36 | A session started by branch name landed on an old copy; a start by commit landed fresh | 2 and 3 Nov; process3 PR 36 | 1 of 1 by commit | Versions |
| 37 | Approvals load only at a session's start | not dated | not stated | Versions |
| 38 | Reported refusal rates moved several-fold between Claude Code versions | reported, not dated | not stated | Re-test per model |
| 39 | Hooks vanished after a resume | not dated | not stated | Dropped, and why (ENF-4) |

The Foundations draw these consequences from them, which the decisions leave standing: every role runs in Auto; hard rules live in deny lists; nothing needed for correctness depends on archiving a session or on switching off or deleting a task; no session starts its own successor; a scheduled task is never required for correctness; every new session is checked to have started; a session stopped by refusals is replaced, not resumed; the owner's committed CLAUDE.md is the one channel that reaches sessions he does not start.


# [file] decisions_memo_d3.md

# Decisions memo for the third draft (Claude, main session, 14 Nov 2026)

This memo answers the findings in attack_corruption.md, attack_feasibility.md, audit_foundations.md and audit_ledger.md (all in /home/user/work/). Where this memo is silent on a finding, use the finding's own proposed correction if it is a change of wording, a removal, a restoration of Bob's requirement, or an honest "unproven / accepted risk" statement; never a new test, gate, review, check or record. Where a finding says "no answer found", record it as an unanswered risk in section J, in plain words.

Authority: Bob's own typed words today include "Process4 has three tests, ever", "Do not add tests, gates, reviews or checks", "Only words I wrote count as my word", "Decide technical matters yourself and tell me what you decided", "Do not assure me that something will work", and he refers to "my decisions of 13-14 Nov" as stated in the first draft.

## 1. Attribution (ledger 2, 2b-2f, 14; foundations 12, 13, 14)
- Add a short section near the top, "Your decisions as recorded", listing each decision of 13 and 14 Nov once, in one plain line each (use the exact quotations in live_docs.md part A). Say plainly: these reached this document through a session's written record; on 14 Nov you referred to them in your own words as "my decisions of 13-14 Nov"; correct any that is recorded wrongly. Everywhere else, "you decided" may then be used ONLY for an item on that list, for a stored ledger answer, or for words quoted from him with their source ("Process3's decision record quotes you on <date>: ...").
- Everything else is "Claude decided". In particular these are Claude's, not Bob's: the three checks alongside module tests ending (a consequence Claude draws from "three tests"; his ledger still shows them kept; no confirmation is recorded; remove the composite quotation); "reviewing as a use for workers" ending; the name "BOB" ending; "a session writing down a word you give in chat as yours" ending; reading "earlier modules' jobs run before later ones" as the rule for who takes a free slot.
- Declare the two records of ROOT's repository (13 Nov: process repository; 14 Nov: product repository); the definition follows the later.
- Fix each minor attribution wording as the ledger audit's file proposes (I 2, I 6, I 7, I 11, D "kept on 8 Nov" -> the record quotes him narrowing it, F "your standing design areas" -> ARCH defines lanes).
- The ledger store still shows "keep" or "modify" for every line this definition ends. One sentence in G: the ledger is unchanged; where the two differ, this definition states which decision it follows, and Bob's ledger is his to change.

## 2. Checks: a check stays only if this document names it (ledger 1; appendix inconsistencies 4, 5; corruption 8)
State that rule in G, right after the count. Then, as Claude's decisions following from "three tests, ever":
- END: the credentials check at tranche open; the check of the process version at session start; the drift check; the guard on the approvals block inside the old record check; format and coverage checks; the re-run of checks at tranche close; the check that no built file is committed (the rule itself stays as text; say that nothing now names who builds and commits built files, and Claude decides: the module's own job does, in its own pull request).
- A job running its own module's tests in its session before pushing is the job's own practice, not a gate; it stays as that.
- The rule that tests check the text key and not the words stays as a rule for writing tests; it has no check.
- Bob's option to ask for a whole-product check "when I ask for one": his word to the coordinator runs the internal walk at any time. Say so in H.
- The process's own code: say plainly that the process's own tool has tests of its own, which run only when the process itself is changed, are not among the three, and can never stop product work; and that the size limit on each role's starting text (the one limit that held in Process3) is one of them and stays. List this in the "things to tell Bob" (it is Claude's reading of "three tests").
- "Nothing is ever refused for size" (I 9): only Process3's existing limits on role texts refuse; nothing new refuses.

## 3. Tranche end and the two walks (corruption 1, 2; feasibility 8, 14; foundations 2, 3; ledger A1, A2, A3)
- WITHDRAW Claude's decision that a rule runs the external walk after every tranche. Follow the record: it is optional, runs after the tranche has ended. Claude's reading of "optional": it runs when Bob tells the coordinator, and before every public release (Foundations: a public release is a development release the walkers have passed). Its findings are work for the next tranche.
- REMOVE "on a copy installed with the real installer". State instead, in J, that no release of any kind was ever cut in Process3, that development deployments do not use the installer, and that the whole release path, including a real install into an empty account, is unproven. Restore Bob's 8 Nov ruling on installer and website order and his 9 Nov ruling that walking AI journeys needs him to connect an AI account (an act of his, add to the list of acts as "before an external walk of AI journeys") if audit_foundations.md finding 3 quotes them; otherwise say they could not be found.
- DECLARE the conflict in C and H: Process3's decision record quotes Bob on 8 Nov that rounds continue until the walk of the release deployment also finds no flaws "and that ends the tranche"; the 13 Nov record ends the tranche on a clean internal round and makes the deployed walk optional and later. The definition follows the later. Three consequences in plain words: the main branch can receive a tranche that fails when deployed (8 Nov: internal walk 238 steps none failing, external walk of the same build 20 of 175 passing); findings of the external walk wait for the next tranche (the Foundations said nothing found waits); section A must not call what is on main "working" without that caveat — reword A.
- Define "a round with no failures" once (Claude decided): the walk's list of failures is empty, and no step that was walked in the previous round is left unwalked. Note the stored reports used "ok" for steps while listing 63 failures; under this definition those rounds were not clean. Rewrite the sentence about 8 Nov accordingly ("every step marked ok while 63 failures were listed").
- Unbounded rounds: say plainly no Process3 round was ever clean and nothing bounds the number of rounds. Only Bob's word ends a tranche that will not come clean (his word is always followed), with the failures named. List in J as a risk. The second horn (sessions write and count the walk's steps; a loosened step cannot be seen) is an unanswered risk: list it in J.
- Tranche into main: ARCH opens and merges that pull request. Say honestly that none of the three tests runs there; the branch rule on main therefore requires only whatever GitHub setting Bob has set, and the wording in F ("with the tests passing") is corrected to say tests run on jobs' pull requests into the tranche branch. This merge never happened in Process3 (main unmoved since 1 Nov): add to J with a rehearsal.
- Walk actors: ARCH starts the walking sessions and turns each finding into work for a named module. "Several sessions, by journey" never ran in Process3 (one script started by the tool): mark unproven, add to J. Walks took 60 and 64 minutes and ran on GitHub's machines because a session's background limit is about 30 minutes: say where the walk runs is a build decision, unproven.
