| GAP-5 | No role waits on ROOT or a scheduled task for work the record allows: a job's report or a merge wakes BOB at once, and a scheduled wake only catches … | kept | O |  |
| GAP-6 | Bob's standing approvals in each repository's CLAUDE.md on the tranche are the one policy for every act at every depth; the start check confirms each … | kept | C |  |
| GAP-7 | A public release or promotion to installed sites waits for Bob's approval through the protected GitHub environment; development releases are drafts … | kept | C |  |
| GAP-8 | On one plain request the process stops development under one Claude account and writes a tested page of steps to restart it under another; open jobs … | kept | O |  |
| GAP-9 | The Ledger, the Foundations and the Build Plan agree: each Foundations section and Build Plan row cites the Ledger lines it serves, and no build … | kept | C |  |
| GAP-10 | Review findings go to the job as diagnosis and review is never the merge gate; a green gate merges without Bob, who approves a particular merge only … | kept | X |  |
| GAP-11 | A platform behaviour is measured once by default, more only when the first result is ambiguous or a failure recurs, and its row records how many … | kept | X |  |
| GAP-12 | A tranche's report also states BOB's idle time while work was ready and the minutes of Bob's it took. Extends PLN-6. | kept | M |  |

## 2. Inventory A: what the approved canon itself mandates

This is the load present before any drift. Each row is something the canon says must exist, run or be written. "Map" is the status the Ledger map gave on 3 Nov; a dash means the map has no row for it.

### A. Checks on the commit, merge and release path (33)

| # | Check | Line or place | Runs | Map, 3 Nov |
| --- | --- | --- | --- | --- |
| A1 | Module's own test suite | GAT-1, GAT-2 | Every PR tip | Built |
| A2 | Layer tests | GAT-2, P11 | Every PR tip | Built |
| A3 | Module order and declared uses matched against imports | ARC-1, P4 | Every PR tip | Gap |
| A4 | File ownership: a job writes only its module's paths, tests and own marks | ARC-2, REQ-4 | PR tip and merge | Built |
| A5 | Tests assert on text keys, never words; the words check | ARC-3 | Every PR tip | Gap |
| A6 | Requirements format check | ARC-4 note, REQ-1 | Every PR tip | Gap |
| A7 | Coverage: every requirement tested at the interface, "none goes untested" | ARC-4 note, P7 | Every PR tip | Gap |
| A8 | Revert check: new tests must fail with the change reverted | JOB-12 | Every PR tip | Built |
| A9 | Artifact regeneration, verify what changed | GAT-4 | Every PR tip | Gap |
| A10 | No generated artifact committed | JOB-8 | PR | Gap |
| A11 | Record check: file size | REC-10, P23 | Every commit | Built |
| A12 | Record check: reserved transient paths | REC-10 | Every commit | Built |
| A13 | Build-ledger schema check, one mutable field | REC-9 | CI | Built |
| A14 | Approvals block changed only by the owner through GitHub's website | GAP-6; Standing approvals | CI | Built |
| A15 | History checked without file contents; "a failed fetch fails the check" | Gate as two jobs | PR | — |
| A16 | Gate split in two jobs: product code with no token, findings posted by the second | Gate as two jobs | PR | — |
| A17 | Machine-readable finding with module, file and line from every check | ARC-5 | Every check | Built |
| A18 | Gate re-run on the merged result | GAT-8 | Before each merge | Built |
| A19 | Tool merges only a green, current tip; bounded retry; plain merge routes denied | GAT-8, INT-1 | Each merge | Built |
| A20 | Merge not resolved "with an old copy" | What the checks defend against | Each merge | — |
| A21 | Pin moves only onto released process commits | MNT-5; What the checks defend against | Each pin move | Built |
| A22 | Defence against outsiders' fork pull requests | What the checks defend against | PR | — |
| A23 | Layer checks | ARC-4, INT-4 | Layer close | Phase 3 |
| A24 | Whole-product checks | ARC-4 (owner's note) | Before a release, or on request | Phase 3 |
| A25 | Full regression | GAT-7, P11, P22 | Before a release | Phase 3 |
| A26 | Install-from-scratch test | Where the process stops | Release workflow | — |
| A27 | Upgrade-from-previous-release test | Where the process stops | Release workflow | — |
| A28 | Mutation sampling on payment and data paths | JOB-13 | Nightly, after the first tranche | Later |
| A29 | One full CI test run before a mechanical pass merges | P7 | Each pass | Later gate |
| A30 | Shim drift check, including no hook beyond ENF-1's allowance | SHM-1; tension 3 | CI | Phase 3 |
| A31 | Branch protection: PR only, merge commits only, required gate and record checks, no deletion or force-push | Setup; INT-1 | Always | Setup |
| A32 | Deny list: settings files, writes through GitHub's interface, plain merge routes | GAP-6; Setup | Always | Built |
| A33 | Production environment with the owner as required reviewer | GAP-7 | Public release | Phase 3 |

### B. Checks at session start and inside tool commands (26)

| # | Check | Line or place | Runs | Map, 3 Nov |
| --- | --- | --- | --- | --- |
| B1 | Start check: process pin | MNT-4 | Every session start | Built |
| B2 | Start check: HEAD at the tranche tip, by commit | MNT-4 | Every session start | Built |
| B3 | Start check: approvals block equals the tip's | GAP-6, MNT-4 | Every session start | Built |
| B4 | Re-check at each later wake of BOB, ROOT and the watcher; on mismatch the session "acts on nothing" | Versions | Every wake | — |
| B5 | `setup check` of every readable condition; "a missing one stops the start" | Setup | Onboarding and before every job start | Built |
| B6 | Deploy tokens confirmed by name | Deploy tokens | With setup check | — |
| B7 | Grants check; a missing grant stops the tranche opening | PLT-9 | Each tranche open | Built; Phase 3 |
| B8 | Trial of a handful of approved acts at their real depth | Standing approvals | Each tranche open, each model release | — |
| B9 | Every new session checked to have started | Unattended 4 | Each creation | — |
| B10 | Live sessions at 24 or fewer | Platform; Unattended 4 | Each creation | — |
| B11 | At most one job per module; a second start is refused | P8 | Job start | Built |
| B12 | START names only tool commands | JOB-2 | START generator | Built |
| B13 | Fast local checks at completion | JOB-5 | Job complete | Built |
| B14 | Requirements size cap, triggering a split before a job opens | REQ-6 | Before job opens | Phase 3 |
| B15 | Handoff size check | SES-3 | Each handoff | Built |
| B16 | Reading-budget size alarm | SES-6 | Start | Built; nudge |
| B17 | Per-line test on instruction files | TXT-2 | Each line added or removed | Nudge |
| B18 | Ten rules per rulebook | TXT-3 | — | Gap |
| B19 | CLAUDE.md under thirty lines | TXT-1 | — | Gap |
| B20 | Push-then-send in one command, numbered, duplicates ignored | MSG-1, MSG-3 | Each message | Built |
| B21 | Address read from git at the moment of sending | REC-6, MSG-2 | Each message | Built |
| B22 | Remote act recorded only from the tool's result | REC-5 | Each remote act | Built |
| B23 | Pause or stop field read at each status; "takes no new step" | PLN-5 | Each status | Built |
| B24 | Sweep guards: ROOT address (step 0) and pause (step 1) | Sweep prompt | Hourly | Built |
| B25 | Product size measured against certified sizes | SHM-3, MNT-10 | Onboarding | Built; Phase 3 |
| B26 | Refusal counter per session | Permissions | Each refusal | — |

### C. Reviews, audits and trials (17)

| # | Review or audit | Line or place | Map, 3 Nov |
| --- | --- | --- | --- |
| C1 | Fresh reviewer per merge, on listed reasons and cost | INT-2 | Built |
| C2 | Second review run to confirm | INT-7 | Built |
| C3 | Post-merge review that may reopen a module | A job's life, step 9 | — |
| C4 | Sampled reading audit of transcripts, filing flaw reports | REC-8, P20 | Gap |
| C5 | Audit of citations for every rule, check, review round and measurement | TXT-6, GAP-3 (properties table) | Text only |
| C6 | Review of instruction-file lines; CLAUDE.md changes listed in the tranche report | TXT-2, TXT-1 | Nudge |
| C7 | Setup list "reviewed like code" | Setup | — |
| C8 | Next modules' requirements "drafted and reviewed" ahead | P18 | Phase 2 |
| C9 | The process's own jobs "with tests and review" | MNT-1 | Phase 4 |
| C10 | Agreement of Ledger, Foundations and Build Plan; "no build starts on a line any of them contradicts" | GAP-9 | Text (the map) |
| C11 | BOB confirms each cross-module report before routing it | P9 | Gap |
| C12 | Walk of each development deployment, every round | P22 | Phase 2 |
| C13 | Shadow run of a slice, repeated from the step that found a flaw | MNT-8, MNT-9 | Phase 3; Gap |
| C14 | Live first tranche as the certification | MNT-8 | Phase 3 |
| C15 | Component-by-component re-test at each model release and Claude Code version | MNT-11 | Phase 4 |
| C16 | Approval test re-run at each model release | Re-test per model | — |
| C17 | Rehearsal of the account move | GAP-8 | Later gate |

### D. Measurements and metrics (36 rows, 34 distinct)

| # | Measurement | Line or place |
| --- | --- | --- |
| D1 | False-done rate | SES-12 |
| D2 | Cost per pull request surviving a two-week window | SES-12 |
| D3 | Commits by purpose | SES-11 |
| D4 | Sessions per job | SES-11 |
| D5 | Gate runs per merged job | SES-11 |
| D6 | Restarts | SES-11 |
| D7 | Tokens by role | SES-11 |
| D8 | Tranche elapsed time | PLN-6 |
| D9 | Work done, work left, deferrals with reasons | PLN-6 |
| D10 | Tranche cost | PLN-6 |
| D11 | Overhead share of cost | PLN-6 |
| D12 | BOB's idle time while work was ready | GAP-12 |
| D13 | Minutes of the owner's time | GAP-12 |
| D14 | Reading set and its size per attempt | JOB-10, SES-5 |
| D15 | Tokens per attempt | JOB-10 |
| D16 | Session usage, or "unmeasured" | SES-9 |
| D17 | Elapsed time and cost per attempt against the role's median | GAP-2; Unattended 6 |
| D18 | Refusals per session | Permissions |
| D19 | Refusals of approved acts by act, depth and channel, per tranche | Standing approvals |
| D20 | Housekeeping acts "counted and reported" | PLT-2 as restated |
| D21 | Platform table rows: dated, with evidence and number of tries | PLT-1, GAP-11 |
| D22 | Reading-budget overruns "measured and reported" | SES-6 |
| D23 | Context share against the refresh threshold | SES-4 |
| D24 | Live session count | Platform |
| D25 | Scale measurements as plan items | REQ-3 |
| D26 | Stateless BOB: tokens per wake | To measure (SES-16) |
| D27 | JSON ledger: corruption, bypass, edits outside the status field | To measure (REC-9) |
| D28 | Trimmed principles: drift traceable to a missing principle | To measure (TXT-4) |
| D29 | BOB's routing share of its context | To measure (SES-15) |
| D30 | Lanes: tokens per question, quality of answers | To measure (SES-14) |
| D31 | Requirements cap number | To measure (REQ-6) |
| D32 | Home for transient state: growth, conflicts, latency | To measure (REC-1) |
| D33 | Permission mode: denials per role | To measure (SES-8) |
| D34 | Merge refusals by depth and channel (overlaps D19) | To measure (GAP-10) |
| D35 | Mutation score on payment and data modules | To measure (JOB-13) |
| D36 | Model and effort table costs (tokens per merged PR by role and model) | To measure (SES-8) |

### E. Alarms and wake conditions (15)

| # | Alarm | Line or place |
| --- | --- | --- |
| E1 | REFRESH when context passes the role's threshold | SES-4 |
| E2 | REFRESH at 10 refusals in a session | Permissions |
| E3 | Session stopped after three refusals in a row, "which status and the sweep must catch" | Permissions; Unattended 3 |
| E4 | Job WORKING with nothing pushed for over two hours | JOB-9, ENF-6; sweep step 3 |
| E5 | Attempt far over its role's time or cost median | GAP-2; Unattended 6 |
| E6 | Any session blocked | ENF-7; sweep step 3 |
| E7 | Status lists acts for an idle BOB | GAP-4; sweep step 3 |
| E8 | BOB silent for two hours after a sweep woke it: successor started | Sweep step 2 |
| E9 | BOB flagged REFRESH: successor started | Sweep step 2 |
| E10 | ROOT full, or heartbeat older than four hours: watcher takes over | Watcher |
| E11 | Undelivered message listed by status | MSG-6 |
