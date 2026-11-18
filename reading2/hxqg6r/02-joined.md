# [file] process4_disposition.md (continued)


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


Binding on all jobs: the job's handover note names its reviewer on a line of its own, exactly: `reviewer: Dmitri Volkonsky`.

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


# [file] DECISIONS.md

# Process3 decision records

Process technical decisions are the coordinator's; each is written here as a short decision record (REC-11) and reported to Bob in one line (AUD-5, kept by Bob 6 Nov). A product's decisions are BOB's and go in that product's own DECISIONS.md. Bob's own rulings are not recorded here: they live in the line they refine (REQ-7).

Each record, newest last, rewritten in place when superseded, never appended to:

```
## PD-<n>: <title> (coordinator, <date>)
Context: the measured failure or Bob's dated words it answers.
Decision: what was chosen, and the options weighed.
Consequences: what it costs, what it removes, and the Ledger line it restates, if any.
```

## PD-1: Roles, layer branch and technical authority in the Foundations (coordinator, 6 Nov)
Context: applying Bob's 6 Nov Keep and Drop answers (SLB-8 "BOB starts jobs and lanes, not ROOT"; SLB-11; AUD-5) to the Foundations, the Ledger map and the Ledger doc left three conflicts (coordinator's log, 6 Nov 01:0x).
Decision: (1) ROOT runs at depth 0 from Bob's app and starts BOB, the watcher and the coordinator; BOB starts jobs and lanes; PLT-5's "whoever starts ROOT starts the watcher" is read as ROOT starting it. (2) Under the layer branch no MERGER runs; its code goes if the trial keeps the branch (SLB-11); layer 6 still runs on the train. (3) AUD-5 replaces "BOB decides everything technical": BOB decides the product's technical matters, the coordinator the process's.
Consequences: restates PLT-5, the roles table and P17; the MERGER's removal waits on the layer-branch trial's result. The Build Plan was not readable on this account, so its rows were not checked.

## PD-2: The watcher's takeover is a bridge (coordinator, 6 Nov)
Context: the Foundations' heartbeat paragraph ("watcher started beside ROOT rather than by it") conflicted with ROOT now starting the watcher (PD-1; coordinator's log, 6 Nov 01:1x).
Decision: the watcher takes over as ROOT only when `watch` says so (watcher.md principle 1); that is a standby taking the role and starts no new session. A takeover moves ROOT one level down, so it is a bridge: Bob restarts ROOT from his app at depth 0 at his next opportunity, and the new ROOT starts a fresh watcher.
Consequences: the heartbeat paragraph is rewritten; SES-1's "nothing creates its own successor" holds; depth grows by one only until Bob's restart.

## PD-3: An account-wide push ceiling of the process's own (coordinator, 6 Nov)
Context: the civicsmith account was suspended on 6 Nov at 19:19Z, most likely for automated bulk activity. GitHub publishes no limit on git pushes, and push volume is the likely cause: the copy's state branch alone took 1,387 pushes in 19 hours, 173 in the busiest hour, about 70 an hour in the layer flow. Bob's P27 (6 Nov) holds the tool to 80–90% of GitHub's published limits; pushes have none to hold to.
Decision: a ceiling of the process's own, `pacing.pushes_per_hour`, default 120. That is 85% of a 140-an-hour own limit, about twice the layer flow's measured rate. It is counted account-wide in the GitHub ledger and applied like a window: a push waits for room, and a refusal says why. Every push goes through the tool: its own, state-branch pushes included (they were most of 6 Nov's volume), and sessions' through `p3 github push`. Only the ledger's own pause, stop and resume writes pass while the account is paused, stopped or at the ceiling. A command whose state push would wait past 15 minutes keeps its writes under `refs/p3/unpushed/` and names `state replay`; it never drops them. The usage share is gated but never waits: it is tried again later. Options weighed: no ceiling (GitHub sets none, but the suspension came anyway); a fixed per-session spacing (does not add up across sessions).
Consequences: the layer flow can be throttled at busy hours, and `p3 github budget` shows how near. The ceiling is revisited from the budget's data. It restates no Ledger line; it serves P27.

## PD-4: A module missing from the layer map is flagged, not a stop (coordinator, 7 Nov)
Context: R16's census found COMPLETE modules missing from the copy's build/layers.md; its first form refused `layer open` for any layer holding one, which would stop the copy's layers 2, 4 and 11 until the map is fixed (builder ef1pxNY's cold review, 7 Nov).
Decision: the gap is a finding the census and `layer open` print, naming the modules; it stops nothing. Options weighed: refuse (protects against a module silently left out of a layer's order, but a COMPLETE module has no job to order, and the stop costs a layer's start on a map edit); flag (the map is fixed by the product's own PR, BOB's).
Consequences: layer 11 can open on time; BOB fixes build/layers.md from the finding. Serves Bob's 7 Nov words that too much caution destroys productivity.

## PD-5: The governor is the only push brake; no hand-held windows (coordinator, 7 Nov)
Context: at 04:51Z the account read 121/120 pushes, and BOB deferred `layer merge 10` and the found-mark PRs 756/757 by hand for ~20 min. At 05:17Z the readings were pushes 89/120 (74%), primary 6%, content 6%, no pause. Bob asked whether this was velocity lost to baseless caution (7 Nov).
Decision: no session defers pushes by hand on top of PD-3. The governor refuses a push over the ceiling and keeps held state writes replayable, so a refusal costs one rerun. A session stops only on a governor refusal, a GitHub rate-limit or abuse response, or an unexplained refusal.
Consequences: lands and merges are not queued behind manual windows. Bob's 6 Nov "BE CAREFUL" is served by the governor's ceiling, not by sessions' guesses. Each new caution must name what it protects and what it costs.

## PD-6: Only GitHub's published limits and GitHub's own refusals brake; PD-3's push ceiling is retired as a brake (coordinator, 7 Nov)
Context: Bob's 7 Nov words: "We need to study why the decision was made to hold layer 10 due to github concerns when measured usage was nowhere near defined limits. We have to fix all code related to github limiting so make sure that this baseless overcaution NEVER happens. NEVER!" Study: the only brake that tripped was PD-3, the process's own 120/h push ceiling. GitHub publishes no push limit. Its own evidence (1,387 pushes in 19 h on 6 Nov, about 73/h) sits below 120, so the ceiling would not have prevented the suspension it was set against. The same hour, GitHub's published limits read primary 3%, content 7%. The tool also refuses every new session at the ceiling (budgetGate), and a third of pushes are the process's own bookkeeping (state writes, usage shares).
Decision: a brake may act only on (a) a limit GitHub publishes, at the 85% target, or (b) a refusal GitHub actually returns (secondary rate limit, 403 or 429 with retry-after, abuse). Pushes and fetches are counted and reported, never refused. budgetGate no longer refuses a session start on pushes. The coordinator's hourly check watches the push count and acts only on a GitHub signal. PD-3 is superseded as a brake. PD-5 keeps sessions from adding manual windows.
Consequences: no layer, land or start waits on a number of the process's own making. The risk accepted: if GitHub's unpublished push heuristics caused the 6 Nov suspension, nothing local now slows pushes before GitHub signals. The mitigation is the stop on GitHub's first refusal, which is kept. The builder audits every brake in tool/lib (pace, ghshare, ghhook, util, the gates) and each role's start text, and removes or demotes to a reported measure any brake that cites no published limit or GitHub refusal.

## PD-7: A published job does not hold a job slot (coordinator, 7 Nov)
Context: C25 (process3 PR 243) measured layer 11's idle-capacity alarm. At 18:55Z, 17 job sessions were live against the cap of 20, but 11 of them were waiting, not working. A job session usually ends its turn once its pull request is marked ready, then sits idle until BOB archives it after the land, so most of those were published jobs holding slots. Bob set the number of slots (20, 7 Nov) as concurrent job work. An idle published session does no work and costs nothing.
Decision: the job cap counts jobs still working toward publish. A job whose pull request into the layer is published (marked ready, waiting on its gate or its land) holds no slot. Its session stays alive, so a red gate is fixed in the same session, without a restart. If its gate goes red and the job resumes, it takes a slot again; if none is free, it still resumes ahead of new starts, because finishing a layer beats opening work. The account's total live sessions stay printed by status and the sweep, so any platform limit stays visible.
Consequences: about half the slots ROOT saw at 18:55Z free up for startable jobs, without losing the warm session for gate fixes. The risk accepted: more live sessions on the account at once (up to 20 working plus the published ones). The mitigation: the sweep prints the total, and a platform refusal to create a session is a stop the tool reports. The builder changes the one cap reader (cap.mjs, jobCap's callers, the sweep's alarm, the flow line) and pins the rule with tests.

## PD-8: IV-9's contrary-recall bar starts as a parity rule; the floor follows AD13 (coordinator, 7 Nov)
Context: Bob adopted a contrary-recall measure and release bar for AI reading parts (BD-14, Q9.5; investigation IV-8, IV-9). IV-9 left the numbers to him; the lane recommended contrary recall at least 0.8 and a gap to supporting recall of at most 0.1. On 7 Nov Bob said: "I think that IV-9 is a technical decision that should be decided based on existing decisions and UX considerations." The existing decisions: no Gate 1 number is set before the first measuring run (AD13, K5475; ai-gate R29), and the gate states every figure as an interval with its counts and compares two figures by interval overlap, never as a bare percentage (ai-gate R33, R52). Nothing has been measured yet.
Decision: from the first Gate 1 run, a reading part fails Gate 1 if its contrary-recall interval lies wholly below its supporting-recall interval (it is measurably worse at finding evidence against than for). No number is needed for this. The absolute floor is a gate pass mark, so under AD13 it is set after the first measuring run and brought to Bob with that measurement, unless he delegates it. Until then the floor is recorded as unset, and the gate's verdict says so wherever it is shown.
Consequences: a tilted reading part is blocked from the first run without an invented number, using the gate's own comparison. A part with too few contrary-marked test items gets wide intervals and rarely fails the parity rule, so the number of contrary-marked items is shown beside the verdict (IV-8 already reports it). ai-gate's F3 mark and IV-9's text are reworded by BOB and the investigation lane.

## PD-9: The gate verifies built generated rows on every pull request (coordinator, 8 Nov)
Context: copy layer merge 11 failed on the words-reads verify, a fault that came in with screens-action T53 on 7 Nov. Every job gate since passed it, because the gate runs a row's verify only when git shows its paths changed, and a built (gitignored) row never shows a change. Only layer merge verified built rows, so the fault surfaced at round close, a day late, and cost a second merge run.
Decision: the gate runs the verify of every built row after building it, on job and plain pull requests alike, as layer merge does. One shared helper serves both.
Consequences: a fault in a built file's checker fails the pull request that brings it in, not the layer close. The cost is the built rows' verify time on each gate (seconds today). Committed rows are unchanged: verified when regenerated with a change.

## PD-10: A known, owed walk finding does not block a development release (coordinator, 8 Nov)
Context: the copy's layer merge 11 closed the first round. Its internal walk exited 1: 238 steps, 63 failures, every one an R21 carried state not reached on the local arm (journey-check F10, already recorded and owed to layer 12); every walked step passed. The dev deploy to p3dev-l11 succeeded. The README's release dev follows the round's deploy and walk.
Decision: a walk failure that is wholly a found mark already recorded and owed to a named layer does not block `release dev`; the release notes name the mark and its failing steps as a known gap. Any failure outside a recorded mark blocks the release and goes through `found`. This covers development pre-releases only; a public release stays Bob's, through the protected environment.
Consequences: the round's development release is cut on time, with its known gap stated. The risk accepted: a new fault hidden inside a recorded mark's failures. The mitigation: the failures must all match the mark's own description (here, the same R21 states on the local arm), checked step by step before the release.

## PD-11: The internal walk runs the page checks the live walk runs (coordinator, 8 Nov)
Context: the copy's round 1 close (layer merge 11) walked 238 internal steps green, then the live walk of p3dev-l11 found 1,690 page faults: 640 classes no loaded stylesheet defines, and 1,050 DEC-340 overlaps. journey-check's local arm (run.mjs runLocal) never calls pageLimits, dec340Limits or publicPass; only runLive does (run.mjs:386, 388, 403). So class and DEC-340 faults could surface only on a deployed walk, after the layer had merged, and they blocked the round's development release.
Decision: the internal walk runs the same page checks on the pages it serves as the live walk runs. The product's journey-check is reopened in layer 12 with this as a found mark, beside F10, with a test where a local page drawing an undefined class fails the walk.
Consequences: a page fault fails layer merge's internal walk, before the merge, not the deploy after it. The cost is the page checks' time on each internal walk. Faults that depend on deployed data or real bindings stay the live walk's to find.

## PD-12: Reopens after the plan's last layer run as the completion round (coordinator, 8 Nov)
Superseded by BD-R1 (Bob, 8 Nov), below: a walk's findings start a new round over the plan's layers, not an extra layer. Layer 12 on the copy finishes under PD-12 as its last use.
Context: the copy closed layer 11, the last of the 11 layers in its approved plan (build/layers.md, Bob, 25 Sep). The round 1 walks left reopens owed (journey-check F10 and PD-11, interface-assets and interface-shell from the live walk's undefined classes, screens-daily R22, provenance BD-18, ai-runs, the IV-H marks on hypotheses and inquiry). `layer open 12` refuses: the map has no layer 12. The Foundations give a completion round its own file (PLN-4), and the tool reads it as completion_file; the copy's config named none.
Decision: the plan's layers stay as approved. Work owed after the last layer runs as the completion round: completion_file is set in the product's process config, one line per item, each started as a reopen on the tranche (as corpus-export's restart, PR 825). The round closes when every item is ticked or deferred with a reason, then the deploy, the walk, and release dev under PD-10.
Consequences: no change to Bob's layer map; the tool's own round model governs, and `tranche close` and `release dev` read the file. Reopens on the tranche merge one by one, with no layer branch to batch them, so each is gated against the tranche itself.

## PD-13: A session whose GitHub hook did not load runs it by hand before each connector call (coordinator, 8 Nov)
Context: the 08:51Z audit found process3 PR 256 opened with no ledger entry. Builder ef1 traced it: its container's project root is /home/user, which has no .claude/settings.json, so process3's PreToolUse hooks (mcp__github__.* and Bash, to tool/hook.mjs) never loaded, and none of its connector calls this session were counted (PR opens 239, 242, 245, 248, 252, 256, ready marks, reads). The coordinator's own session, rooted on start/coordinator-4nov, whose settings carry no hooks, had the same gap. Pushes through `github push` were counted throughout.
Decision: until the tool detects the gap itself, a session whose hook did not load pipes each GitHub connector call's JSON to `node tool/hook.mjs` from a process3 checkout at the tranche before making the call, and does not make it if the hook exits 2. The tool change (a session learns at start, and the audit names, that its hook is not loaded) goes to a builder.
Consequences: the ledger again counts every connector call, so the audit's unexplained-write line means traffic around the tool, not a hook that never loaded. Bob's .claude/settings.json is unchanged.


Tally for Dunn: 6 gulls.

## PD-14: An item added to an open completion round joins that round (coordinator, 8 Nov)
Context: the copy's layer 12, the completion round (PD-12, C33), opened at 09:04Z with the 9 items open then. Its modules are fixed by its open row. Provenance's BD-18 change (copy PR 1002) breaks six tests in acquisition, case-authoring and case-disclosures, so BOB added them as CR2-11, CR2-12 and CR2-13 (copy PR 1007). `layer join` refuses them, since no layer follows layer 12 in the map, and the tool would only open them as a layer 13 after 12 merges, which provenance cannot do green without them.
Decision: while a completion layer is open, a module with an open item in completion_file that is not in that layer joins the open layer by `layer join`, and starts, merges and is ticked as one of its own. A module already in the open layer whose new items come after its open or its join joins them the same way: it runs again with their words, and an item is ticked only by a land from a job started after it joined (C35b, process3 PR 261). A next completion layer opens only for items added after the open one merged. The tool change is C35.
Consequences: a round's coupled work lands in that round, not one round later, with no new layer opened. The round's close still waits on every open item, so adding items lengthens the round the stop rule measures, and that cost shows in the hourly flow line.

## PD-15: A test-only land after an earlier source land is at most additive (coordinator, 8 Nov)
Context: C11 (7 Nov) reads a land that changes only the provider's own test files as no interface change, except for the users that import a changed test file. Its exception: when an earlier land of the same provider in the layer changed its source, the tests' own verdict stands, since the test change may be the only sign of that earlier change. On the copy's layer 12, hypotheses' land c2e2567196 changed only rivals-f1.test.mjs ("an existing token changed"). Because 1025 had changed hypotheses' source earlier, it was classed breaking, and `layer retest` refused it, so four full re-test jobs started (affordances 1053, op-declarations 1054, store-assembly 1055, screens-inquiry 1056). BOB measured roughly $1-3 per session, and most of these jobs end with no code changed.
Decision: in that exception, a breaking verdict from the tests alone becomes additive when this land changed neither the provider's source nor its exports. Each user is re-tested through its gate (`layer retest`), and a red re-test still falls back to a job (Bob's "c"). A user that imports a changed test file stays breaking, as under C11. A land that changes source or exports is classed as before. The tool change is C38.
Consequences: a provider correcting its own tests after an earlier change costs its users one gate run each instead of a job session each. A changed answer the users rely on is still caught by their own tests on that gate run. The earlier source land was already classed, and its users were rescheduled, when it landed.

## BD-R1: Walks end rounds; rounds repeat over the plan's layers until the release walk is clean (Bob, 8 Nov)
Context: under PD-12 the copy ran the fixes from round 1's walks as layer 12, one extra layer after the plan's 11, fed by a completion file.
Decision, in Bob's words (8 Nov): "I think that it's incorrect to designate the fixes of an internal walk as an additional layer. Rather, the errors found in a walk, whether internal or external, should be related to changes to modules. Once a walk completes, that ends the current round, and a new round (of the same tranche) is started to work (layer by layer) to fix to those modules that have been identified as having flaws. This successive set of rounds continues until an internal walk doesn't find flaws, the release deployment happens, and the walk of the release also doesn't identify flaws. When the release walk is clean, the installer is updated for that release, then the civicsmith.dev website is updated to refer to the new install, and that ends the tranche."
Bob's answers to the coordinator the same day: layer 12 finishes as this round's work, and the switch takes effect from the next round ("Finish, then switch"). The process prepares the installer and website updates and runs them only through the protected GitHub environment that names Bob as required reviewer; his standing approvals are unchanged ("Process, on my approval").
Consequences: each walk's findings become ledger entries against named modules (PLN-3). The next round opens the plan's layers in order and starts jobs only for the flawed modules, skipping layers that hold none. A round ends at its walk. A clean internal walk leads to the release deployment and its walk. A clean release walk leads to the installer update, then the civicsmith.dev update, each on Bob's approval, and the tranche closes. The completion file (PLN-4) and PD-12 retire once layer 12 merges. The tool change is C39, and the Foundations lines on rounds and on where the process stops are rewritten to match.

## BD-R2: Process3 is product-neutral; one repository per session; the coordinator is Bob's front door (Bob, 8 Nov)
Context: process3's CLAUDE.md, tool, docs and tests name the first product under it. The coordinator has acted on that product from a session holding several repositories. PD-13 measured what that costs: such a session loads no repository's .claude/settings.json (PLT-7).
Decision, in Bob's words (8 Nov): "Process3 is a develop process that is designed for use to develop any product, not just civicsmith." "There should be an process3-specific subtree in the civicsmith-copy repo that contains info related to civicsmith-copy's process3-driven development." "Ideally the process3 CLAUDE.md shouldn't reference civicsmith or any other product being developed using process3. In that regard, any grants related to biosmoke8 should be in civicsmith-copy's CLAUDE.md." On who he talks to: "Having the coordinator as the front door has been working well. Let's continue to do so if that's possible."
Consequences:
- Each repository's approvals cover that repository only. Bob commits them (the draft is notes/draft-approvals-split-8nov.md on start/coordinator-4nov).
- Every session works in one repository. The coordinator, in process3, acts on a product only through a session started in that product's repository (BOB, or a short session, as pin moves already do), and relays Bob's words to it quoted and dated.
