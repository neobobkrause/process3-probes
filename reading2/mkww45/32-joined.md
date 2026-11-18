# [file] ledger_lines.md (continued)

- Evidence grade: measured. Suggested: keep. Reason given: No Ledger line holds the approvals; PLT-3's user settings is not what was measured.
- Decision: kept, 2026-11-03 17:32 UTC. Tag: C
- Note: none

### GAP-7 — kept

- Statement: A public release or promotion to installed sites waits for Bob's approval through the protected GitHub environment; development releases are drafts and need none.
- Source: Your word, 2 Nov (question 21); your approvals.
- Evidence grade: measured. Suggested: keep. Reason given: Your rule; no Ledger line holds it.
- Decision: kept, 2026-11-03 17:32 UTC. Tag: C
- Note: none

### GAP-8 — kept

- Statement: On one plain request the process stops development under one Claude account and writes a tested page of steps to restart it under another; open jobs resume by JOB-6.
- Source: Your words, 2 Nov about 18:58.
- Evidence grade: proposed. Suggested: keep. Reason given: Your requirement; no line holds it.
- Decision: kept, 2026-11-03 17:35 UTC. Tag: O
- Note: none

### GAP-9 — kept

- Statement: The Ledger, the Foundations and the Build Plan agree: each Foundations section and Build Plan row cites the Ledger lines it serves, and no build starts on a line any of them contradicts.
- Source: Your word, 3 Nov.
- Evidence grade: measured. Suggested: keep. Reason given: The drift of 3 Nov came from lines the Ledger held and the other two lost.
- Decision: kept, 2026-11-03 17:35 UTC. Tag: C
- Note: none

### GAP-10 — kept

- Statement: Review findings go to the job as diagnosis and review is never the merge gate; a green gate merges without Bob, who approves a particular merge only when he asks to. Replaces INT-3.
- Source: INT-3; question 19 and the Foundations (merge on green).
- Evidence grade: measured. Suggested: keep. Reason given: INT-3's your approval is the last word reads against merge on green.
- Decision: kept, 2026-11-03 17:35 UTC. Tag: X
- Note: none

### GAP-11 — kept

- Statement: A platform behaviour is measured once by default, more only when the first result is ambiguous or a failure recurs, and its row records how many tries. Bounds PLT-1.
- Source: Your words, 2 and 3 Nov (15 tries, not 20; measure once by default); PLT-1.
- Evidence grade: measured. Suggested: keep. Reason given: PLT-1 set no bound, which is how the repeated permission rounds grew.
- Decision: kept, 2026-11-03 17:36 UTC. Tag: X
- Note: none

### GAP-12 — kept

- Statement: A tranche's report also states BOB's idle time while work was ready and the minutes of Bob's it took. Extends PLN-6.
- Source: P19; P17; PLN-6.
- Evidence grade: proposed. Suggested: keep. Reason given: Makes urgency and your time measurable, so the mechanisms for them can be judged.
- Decision: kept, 2026-11-03 17:36 UTC. Tag: M
- Note: none


# [file] ledger-map.md (later part)

| SES-8 | Model, effort, mode table | start | Built |
| SES-9 | Usage read or named unmeasured | metrics | Built |
| SES-10 | Workers return receipts | Worker briefs | Nudge |
| SES-11 | Overhead per tranche | Overhead share per job and layer, then the tranche report; no target (Bob, 3 Nov) | Phase 2; Phase 3 |
| SES-12 | False-done rate by independent re-verification and cost per surviving job, counted per job (one module's work in one layer) (Bob's answer, Keep and Drop page, 6 Nov 2026, SLB-9) | metrics; survival read 16 Nov | To build; trial on layer 7 (SLB-10) |
| SES-13 | Outliving a parent is ordinary | The design | Design |
| SES-14 | Lanes; a process triage lane and a product triage lane bring Bob options with context before a response is chosen; a chosen short-term response reaches later sessions in their starting prompt with its end condition (Bob's answer, Keep and Drop page, 6 Nov 2026, AUD-8) | UX lane | Phase 3 |
| SES-15 | BOB routes | Routing share measured | Phase 2; Measure |
| SES-16 | Stateless BOB, measured | No comparison arm | **Gap** (Phase 3) |
| SES-17 | Urgency as a nudge | BOB's prompt | Phase 2 |
| SES-18 | Workers for three uses only | Worker briefs | Nudge |
| SES-19 | A lane is the load-bearing source of truth in its area, qualified before it decides anything (Bob, 6 Nov) | lane start, lane ask (qualification record) | Built (build/lane-qualification) |
| SES-20 | First run qualifies: workers research the canon, the existing code and best practice of the lane's area (Bob, 6 Nov) | lane start's QUALIFICATION brief; lane ask refuses until it lands | Built (build/lane-qualification) |
| SES-21 | A lane-specific research area in the product repo, read first, drawn from and evolved by every later session (Bob, 6 Nov) | lanes\[\].research (default \<dir>-research), counted as the lane's folder by the gate | Built (build/lane-qualification) |
| SES-22 | Research continues as the lane works; lane ask workers read the research area first (Bob, 6 Nov) | lane start and lane ask briefs; job START of a lane's module | Built; Nudge for keeping it current |
| SES-23 | Lanes cut by design area; for Civicsmith, investigation design and publication design beside UX (Bob, 6 Nov) | The product's lanes in process/config.json, set by BOB | Design; BOB adds the lanes after the pin |

## Instruction files and rules

| Line | Requires | Held by | Where |
| --- | --- | --- | --- |
| TXT-1 | CLAUDE.md under thirty lines, pin and fetch | Approvals only today | **Gap** (Phase 3) |
| TXT-2 | Per-line test | Review at each gate | Nudge |
| TXT-3 | Rulebooks, ten rules each; temporary measures live in the triage register with their end condition, never as rulebook lines (Bob's answer, Keep and Drop page, 6 Nov 2026, AUD-9) | Not written | **Gap** (Phase 3) |
| TXT-4 | Trimmed principles per role | Text; measured | Phase 3; Measure |
| TXT-5 | Each role prompt names its rulebook in the pin (restated by BOB 4 Nov: a skill cannot be chosen by role without a hook, ENF-1; built, process3 PR 58) | Not written | **Gap** (Phase 3) |
| TXT-6 | Every rule cites its source; Bob is cited only where he said it, quoted with its date, and other decisions name their maker (Bob's answer, Keep and Drop page, 6 Nov 2026, AUD-4) | Rule 2; this map | Built (text) |
| TXT-7 | Plain words, named audience | Every text | Nudge |

## Messages

| Line | Requires | Held by | Where |
| --- | --- | --- | --- |
| MSG-1 | Git carries state; a message wakes | send | Built |
| MSG-2 | BOB's address is instruction, else data | Role prompts | Built |
| MSG-3 | Push-then-send, numbered | send | Built |
| MSG-4 | One plain message to Bob per turn | Every role | Nudge |
| MSG-5 | Flaw route by state branch and main | flaw | Later gate |
| MSG-6 | Undelivered recorded and listed | send, status | Built |

## Maintenance and certification

| Line | Requires | Held by | Where |
| --- | --- | --- | --- |
| MNT-1 | The thin process under itself |  | Phase 4 |
| MNT-3 | Built with the last release |  | Phase 4 |
| MNT-4 | Pinned per tranche, verified at start | start check; merge | Built |
| MNT-5 | Blocking fix by a pin move | Plain pull request; merge holds pins to forward moves onto process3 tranche or main commits | Built |
| MNT-6 | Non-blocking fix waits; during Process3's own first build, process fixes may land while a product's tranche runs, each recorded against the Ledger line it serves (GAP-9), until the first certified release (Bob's answer, Keep and Drop page, 6 Nov 2026, AUD-6) | Rule 6 | Built (text) |
| MNT-7 | Flaw reports | flaw | Later gate |
| MNT-8 | Slice shadow, then the live tranche |  | Phase 3 |
| MNT-9 | Shadow flaws fixed, run repeated | Not in the gate | **Gap** (Phase 3) |
| MNT-10 | Release names rows and sizes | Release note | Phase 3 |
| MNT-11 | Ablation per model |  | Phase 4 |

## What a product receives

| Line | Requires | Held by | Where |
| --- | --- | --- | --- |
| SHM-1 | CLAUDE.md, skill, settings, gate, prune; drift check | shims | Phase 3 |
| SHM-2 | Shims regenerated on the runner | shims | Phase 3 |
| SHM-3 | Onboarding skeleton and size measure | setup check; onboard | Built; Phase 3 |
| SHM-4 | Mid-tranche conversion | onboard | Phase 3 |
| SHM-5 | Product setup script at first command | Not run | **Gap** (Phase 3) |

## Principles

| Line | Requires | Held by | Where |
| --- | --- | --- | --- |
| P1 | Purpose: correct, quick, cheap, surviving | Rule 1; the health metrics | Built (text) |
| P2 | The build state tells BOB what to do | status next acts | Phase 2 |
| P3 | A serious process flaw pauses the product | Rule 6; pin by pull request | Built (text) |
| P4 | Total order, uses checked | As ARC-1 | **Gap** |
| P5 | Requirements' four-part shape, concise | BOB writing; cap | Nudge; Phase 3 |
| P6 | A module fits one reading | Reading-set sizes; cap | Phase 3 |
| P7 | Every requirement tested; mechanical pass | Revert check only | **Gap** (Phase 2; later gate) |
| P8 | One job per module | job start refuses a second | Built |
| P9 | Reports routed by BOB | Not in status | **Gap** (Phase 2) |
| P10 | Layer at a time, all its jobs at once | status next work; layer close | Phase 2; Phase 3 |
| P11 | Tests follow the architecture | gate; release | Built; Phase 3 |
| P12 | Done means merged; close merges main in | merge; tranche close | Built; Phase 3 |
| P13 | Sessions short; refresh | REFRESH | Built |
| P17 | Bob defines, BOB decides | Walk-through; every role | Design |
| P18 | Pipeline: prepare the next stage | The cycle (close into open); BOB's prompt in value order; idle time measured | **Phase 2; Phase 3** |
| P19 | Never idle; never stop for Bob | status, sweep wake, BOB's prompt | Phase 2 |
| P20 | Act on what was read in full | Reading audit not built | **Gap** (Later gate) |
| P21 | Bob's questions become designs; lanes | Walk-through; UX lane | Built (practice); Phase 3 |
| P22 | Release deployed and walked | Deploy and walk; release | Phase 2; Phase 3 |
| P23 | The repository holds only what is needed | record check | Built |
| P24 | Recorded state ends itself: a checkable end condition, ended by the tool, stale state cleared by the process (Bob, 6 Nov) | ends.mjs conditions; expire.mjs at every write, layer open and the sweep; status reports stale; hold refuses words alone | Built (R13, build/self-expiring-records) |
| P25 | Refusals and inconsistencies are anticipated and reported ahead of the act (Bob, 6 Nov) | census.mjs census and preflight: setup check, status --role bob gaps block, layer open, the gate's census finding | Built (R15, build/preflight) |
| P26 | The account switch is rehearsed and preflighted before it's needed (Bob, 6 Nov) | switch.mjs: switch out --dry-run, switch in --preflight and the session checks, the manifest's layers, lanes, asks and old sessions, switch/retired.json read by ends.mjs session\_gone; rulebooks/account-switch.md; notes/account-switch-canary.md | Built (R16, build/switch-ready) |
| P27 | Process3 conforms to GitHub's published limits, using up to 80–90% of them, and obeys rate-limit responses (Bob, 6 Nov) | pace.mjs: GITHUB\_LIMITS, pacing.target, ghTurn's windows and primary check, ghAfter's pause and stop, budgetGate on job and lane starts, github budget; ghshare.mjs: github/pause.json and github/use/ on the state branch; github resume | Built (R17, build/github-pacing; unpushed while GitHub is suspended) |

## Gaps found 3 Nov

| Line | Requires | Held by | Where |
| --- | --- | --- | --- |
| GAP-1 | Runs with no one watching | Phase 2's gate | Phase 2 |
| GAP-2 | Cost per attempt is an alarm | Sweep row | Phase 2 |
| GAP-3 | Nothing without a failure or Bob's word | Rule 2 | Built (text) |
| GAP-4 | Status names next acts | status | Phase 2 |
| GAP-5 | Events wake BOB | Subscribe step; sweep wake | Built; Phase 2 |
| GAP-6 | Approvals are the one policy | record check; start check | Built |
| GAP-7 | Public release waits for Bob | Production environment | Phase 3 |
| GAP-8 | Move accounts on one request | A tested page of steps | Later gate |
