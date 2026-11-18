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

Brae sent word of 10 alders on hand.

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
