# Ledger map

Every kept or modified Ledger line, and where it is held: built (named code), a Phase row, a later gate, a nudge (text only, exposed by status), a measurement, or the design itself. Read from the tool at process3 tranche 237c02a and the Build Plan on 3 Nov. On 3 Nov 17 lines had no home or were not built where the plan assumed; each now has a place in a phase, listed first, and stays marked **Gap** below (GAP-9).

## Gaps

| Line | Gap | Where it goes |
| --- | --- | --- |
| ARC-1, ARC-3, ARC-4 | The tool's gate runs no architecture, text-key or scoped checks; the module suite may hold some | Phase 2: read once which checks the copy's suites run; build the missing ones before layer 1's jobs merge |
| JOB-8, GAT-4 | No check that a job commits no generated artifact, and no regeneration step, though the CI table lists one; Phase 2 now runs a layer's jobs at once, which is when they conflict | Phase 2 |
| P18 | The pipeline is a nudge in BOB's prompt only | As civicos-process held it: the cycle itself (all of a layer's jobs at once, each close straight into the next open, Phase 3) and BOB's preparation in order of value (Phase 2 prompt); BOB's idle time measured before anything more. A listed set of preparation acts with Stop guards was removed by Bob in civicos as too inefficient (K5787) |
| P9, PLN-3 | Status prints no reports to route | Phase 2, in the status row |
| P7 | Nothing shows each struck requirement has a test; the mechanical pass has no procedure | Phase 2: the receipt names the test for each struck mark and the review brief checks it; mechanical pass a later gate |
| REC-8, P20 | The reading audit has no build | Later gate |
| TXT-1 | The product's CLAUDE.md holds only the approvals; no pin or fetch line | Phase 3, with the shims |
| TXT-3, TXT-5 | No rulebooks and no skill written | Phase 3, with the shims, as Text to write says |
| SES-16 | Measured on the first tranche, but nothing runs a stateless wake to compare | Phase 3: one stateless BOB wake, tokens counted against a handover row |
| SHM-5 | Start check runs no product setup script | Phase 3, with the shims |
| MNT-9 | Not in Phase 3's gate | Phase 3 gate |

## Platform facts

| Line | Requires | Held by | Where |
| --- | --- | --- | --- |
| PLT-1 | Dated table of measured behaviours | The platform table on the probe | Phase 0, met |
| PLT-2 | Depend only on acts the approvals cover and measured to pass; archive and task deletion are housekeeping (restated by Bob, 3 Nov) | Permission physics; archive and task acts are housekeeping | Built |
| PLT-4 | Long steps run in CI | The gate workflow | Built |
| PLT-5 | No session starts its own successor; depth at most 3 (restated by Bob, 3 Nov) | start | Built |
| PLT-6 | A task is never needed for correctness | Sweep and watcher design | Built |
| PLT-7 | One repository; process as a pinned clone | The .process submodule | Built |
| PLT-8 | Privileged GitHub acts by workflows | Privileged workflow | Phase 3 |
| PLT-9 | Grants gathered once, checked at open | setup check; grants at tranche open | Built; Phase 3 |
| PLT-10 | Platform status is not work state | status reads git | Built |
| PLT-3 | Replaced by GAP-6 |  |  |

## Hooks and enforcement

| Line | Requires | Held by | Where |
| --- | --- | --- | --- |
| ENF-1 | A handful of command hooks at most | No hooks today; drift check with the shims | Built; Phase 3 |
| ENF-2 | No model judge on messages | The design | Design |
| ENF-3 | Nothing holds a turn | The design | Design |
| ENF-6 | Early stops caught without /goal | status and the sweep | Built |
| ENF-7 | Every hard rule has a blocked exit | block | Built |

## The record

| Line | Requires | Held by | Where |
| --- | --- | --- | --- |
| REC-1 | Durable on the tranche, transient on a state branch | process-state branch; home measured | Built; Measure |
| REC-2 | One writer per file | Per-participant state files | Nudge |
| REC-3 | Status reads the whole state | status | Built |
| REC-4 | Record writes cost no gate run | Gate's record-only pass | Built |
| REC-5 | Recorded from the result | The tool | Built |
| REC-6 | Address read from git | address, send | Built |
| REC-7 | A halted build is readable | status; five handovers 3 Nov | Built |
| REC-8 | Reads are a matter of record | Start prints the reading set; no audit | **Gap** |
| REC-9 | JSON ledger, one mutable field | ledger check | Built; Measure |
| REC-10 | Size and transient check; prune | record check; prune | Built; Phase 3 |
| REC-11 | Decision records | Template file | Later gate |

## Architecture and checks

| Line | Requires | Held by | Where |
| --- | --- | --- | --- |
| ARC-1 | Uses match imports | Not in the tool's gate | **Gap** |
| ARC-2 | One owner module per file | gate and merge | Built |
| ARC-3 | Tests assert on text keys | Not in the tool's gate | **Gap** |
| ARC-4 | Scoped checks; layer checks; whole product at release | Scoped: not in the tool; layer and release workflows | **Gap**; Phase 3 |
| ARC-5 | Machine-readable findings | gate | Built |

## Requirements

| Line | Requires | Held by | Where |
| --- | --- | --- | --- |
| REQ-1 | Public and private parts, permanent ids | The product's requirement files | Built (product) |
| REQ-2 | Behaviour at the interface | BOB writing requirements | Nudge |
| REQ-3 | Scale figures are measurements | START and review brief | Nudge |
| REQ-4 | Marks struck only by their job | ARC-2's ownership | Built |
| REQ-5 | A meaning change goes to Bob only by DES 1 | BOB's prompt | Nudge |
| REQ-6 | Cap triggers a split, never a refusal | Requirements cap | Phase 3; Measure |
| REQ-7 | Rulings deleted once absorbed | Template file | Later gate |

## Planning

| Line | Requires | Held by | Where |
| --- | --- | --- | --- |
| PLN-1 | Layers in rounds in tranches | merge, tranche open and tranche close | Phase 3 |
| PLN-2 | Plan from the remaining work | status next work | Phase 2 |
| PLN-3 | Found work placed at once | Reports to route; walk findings | **Gap** (Phase 2) |
| PLN-4 | Completion round's own file |  | Phase 3 |
| PLN-5 | Pause and resume | The plan field in process/config.json, read by the sweep; the 3 Nov halt switched tasks off by hand | Built (sweep); status prints it in Phase 2 |
| PLN-6 | Tranche report | release; tranche close | Phase 3 |
| PLN-7 | Nothing names a product | Config-driven tool | Built |

## Jobs

| Line | Requires | Held by | Where |
| --- | --- | --- | --- |
| JOB-1 | Job is a draft PR | job start | Built |
| JOB-2 | START names only tool acts | START generator | Built |
| JOB-3 | Take in earlier work | job start | Phase 3 |
| JOB-4 | Never restarted for a process reason | Pin by pull request; BOB's prompt | Nudge; Built |
| JOB-5 | Fast local checks; gate in CI | job complete | Built |
| JOB-6 | Restart a dead job | job start restarts from the branch and pull request | Phase 2 |
| JOB-7 | Receipt | job complete | Built |
| JOB-8 | No generated artifact committed | Nothing | **Gap** (Phase 2) |
| JOB-9 | Turn ends COMPLETE or on a named wait | status and the sweep | Nudge; Built |
| JOB-10 | Reading set and tokens per attempt | metrics | Built |
| JOB-12 | Revert check | gate | Built |
| JOB-13 | Mutation sampling | Nightly workflow | After the first tranche |
| JOB-14 | Fresh session after two failed corrections | Review-round limit in merge; brief rule | Built; Nudge |
| JOB-11 | Replaced by GAP-2 |  |  |

## The gate

| Line | Requires | Held by | Where |
| --- | --- | --- | --- |
| GAT-1 | Gate in CI once per tip | Gate workflow | Built |
| GAT-2 | Module suite only | gate | Built |
| GAT-3 | Provider change reaches users by their jobs | Provider-change route | Phase 3 |
| GAT-4 | Regenerate artifacts, verify changed | Nothing | **Gap** (Phase 2) |
| GAT-5 | Every lock file; product's Node | gate, test | Built |
| GAT-6 | Triggered by the module's paths | Gate workflow | Built |
| GAT-7 | Full regression at release | Release workflow | Phase 3 |
| GAT-8 | Gate on the merged result | merge | Built |

## Integration and review

