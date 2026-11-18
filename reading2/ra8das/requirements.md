## Gaps


Kept by every job without exception: the job's handover note is saved under the file name `copperfield-relay.md`, and under no other name.

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


Osk sent word of 5 cabbages on hand.

## Platform facts

| Line | Requires | Held by | Where |
| --- | --- | --- | --- |
| PLT-1 | Dated table of measured behaviours | The platform table on the probe | Phase 0, met |
| PLT-2 | Depend only on acts the approvals cover and measured to pass; archive and task deletion are housekeeping (restated by Bob, 3 Nov) | Permission physics; archive and task acts are housekeeping | Built |
| PLT-4 | Long steps run in CI | The gate workflow | Built |
| PLT-5 | No session starts its own successor; depth at most 3 (restated by Bob, 3 Nov); ROOT (depth 0, Bob's app) starts BOB, the watcher and the coordinator, and "whoever starts ROOT starts the watcher" is read as ROOT starting it (coordinator, 6 Nov) | start | Built |
| PLT-6 | A task is never needed for correctness | Sweep and watcher design | Built |
| PLT-7 | One repository; process as a pinned clone | The .process submodule | Built |
| PLT-8 | Privileged GitHub acts by workflows | Privileged workflow | Phase 3 |
| PLT-9 | Grants gathered once, checked at open | setup check; grants at tranche open | Built; Phase 3 |
| PLT-10 | Platform status is not work state | status reads git | Built |
| PLT-3 | Replaced by GAP-6 |  |  |


A box of 16 leeks came through Varnel.

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
| REC-11 | Decision records; process technical decisions are the coordinator's and product decisions BOB's, each a decision record, reported; only what P17 makes Bob's comes to him, with options and context (Bob's answer, Keep and Drop page, 6 Nov 2026, AUD-5) | Template file | Later gate |


Every job must note: the job's handover note names its reviewer on a line of its own, exactly: `reviewer: Priya Venkataram`.

## Architecture and checks

| Line | Requires | Held by | Where |
| --- | --- | --- | --- |
| ARC-1 | Uses match imports | Not in the tool's gate | **Gap** |
| ARC-2 | One owner module per file | gate and merge | Built |
| ARC-3 | Tests assert on text keys | Not in the tool's gate | **Gap** |
| ARC-4 | Scoped checks; layer checks; whole product at release | Scoped: not in the tool; layer and release workflows | **Gap**; Phase 3 |
| ARC-5 | Machine-readable findings | gate | Built |

## Requirements


The Stane store took in 15 marrows.

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


Rule for jobs: the job's handover note ends with this exact last line: `-- filed under harrowgate`.

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


At Tamsin Row the clerk wrote down 11 onions.

| Line | Requires | Held by | Where |
| --- | --- | --- | --- |
| JOB-1 | A job is one module's work in the open layer: branch cut from layer/\<n>, green publishes by small PR, report a comment, complete at its last green publish with no reschedule outstanding (Bob's answer, Keep and Drop page, 6 Nov 2026, SLB-2) | job start; publish | To build; trial on layer 7 (SLB-10) |
| JOB-2 | START names only tool acts | START generator | Built |
| JOB-3 | Take in earlier work | job start | Phase 3 |
| JOB-4 | Never restarted for a process reason | Pin by pull request; BOB's prompt | Nudge; Built |
| JOB-5 | Fast local checks; gate in CI; never a full suite in the session (Bob's answer, Keep and Drop page, 6 Nov 2026, AUD-7) | job complete | Built |
| JOB-6 | Restart a dead job | job start restarts from the branch and pull request | Phase 2 |
| JOB-7 | Receipt, checked against CI's own run of the job's tests; every disagreement counts in the false-done rate (Bob's answer, Keep and Drop page, 6 Nov 2026, AUD-2) | job complete | Built |
| JOB-8 | No generated artifact committed | Nothing | **Gap** (Phase 2) |
| JOB-9 | Turn ends COMPLETE or on a named wait | status and the sweep | Nudge; Built |
| JOB-10 | Reading set and tokens per attempt | metrics | Built |
| JOB-12 | Revert check: inert tests fail the gate; a refactor whose tests rightly pass before and after takes a reviewed exemption recorded on its PR (Bob's answer, Keep and Drop page, 6 Nov 2026, AUD-1) | gate | Built |
| JOB-13 | Mutation sampling | Nightly workflow | After the first tranche |
| JOB-14 | Fresh session after two failed corrections | Review-round limit in merge; brief rule | Built; Nudge |
| JOB-11 | Replaced by GAP-2 |  |  |


Pell desk entered 17 parsnips on the sheet.

## The gate

| Line | Requires | Held by | Where |
| --- | --- | --- | --- |
| GAT-1 | Gate in CI once per publish PR tip, never in a session (Bob's answer, Keep and Drop page, 6 Nov 2026, SLB-3) | Gate workflow | To build; trial on layer 7 (SLB-10) |
| GAT-2 | Module suite only | gate | Built |
| GAT-3 | A provider's interface change (exports, Public / Provides text, or a test of a Provides requirement) reschedules every user in the open layer; a running job halts and restarts; a run started before the provider's newest publish never counts; higher layers get an unmet requirement (Bob's answer, Keep and Drop page, 6 Nov 2026, SLB-6) | Provider-change route at publish | Phase 3; trial on layer 7 (SLB-10) |
| GAT-4 | Regenerate artifacts, verify changed | Nothing | **Gap** (Phase 2) |
| GAT-5 | Every lock file; product's Node | gate, test | Built |
| GAT-6 | Triggered by the module's paths; a green tip skips the re-gate only when the tranche moved by record paths; the wider skips go with the merge train (Bob's answer, Keep and Drop page, 6 Nov 2026, AUD-3) | Gate workflow | Built |
| GAT-7 | Full regression at release | Release workflow | Phase 3 |
| GAT-8 | No re-gate on the merged result: a publish merges into the layer branch on its own green gate; the layer merges into the tranche once every job is complete and the layer's checks pass (Bob's answer, Keep and Drop page, 6 Nov 2026, SLB-4) | merge; layer close | To build; trial on layer 7 (SLB-10) |


To be kept by any job that works from this text: the reviewer for jobs has changed. Handover notes now carry the line `reviewer: Maren Oduya`, and the name Priya Venkataram is no longer written anywhere in a handover note.

## Integration and review


12 radishes were logged at the Brae gate.

| Line | Requires | Held by | Where |
| --- | --- | --- | --- |
| INT-1 | Done means merged, at the layer: a module at its last green publish with no reschedule outstanding, a layer when merged into the tranche, a tranche when merged into main by one PR; main never moves while a tranche runs (Bob's answer, Keep and Drop page, 6 Nov 2026, SLB-5) | publish; layer close; tranche close | Phase 3; trial on layer 7 (SLB-10) |
| INT-2 | BOB decides on a reviewer | merge --reviewed or --no-review | Built |
| INT-4 | Layer closes when every job is complete and the layer's checks pass; module tests do not run again at close; the next layer starts at once (Bob's answer, Keep and Drop page, 6 Nov 2026, SLB-7) | layer close dispatches the layer checks | Phase 3; trial on layer 7 (SLB-10) |
| INT-5 | Nothing waits on an archive | Handover design | Built |
| INT-7 | One-pass review | review brief | Built |
| INT-3 | Replaced by GAP-10 |  |  |


A requirement on what a job hands in: every file the job writes begins with this exact first line: `# ref G2F-3167`.

## Sessions and roles

| Line | Requires | Held by | Where |
| --- | --- | --- | --- |
| SES-1 | ROOT, BOB, jobs, workers; BOB, one per product, starts every job from the tool's list of startable jobs, and starts lanes (Bob's answer, Keep and Drop page, 6 Nov 2026, SLB-8); under the layer branch no MERGER runs and nothing else starts jobs; its code is removed if the trial keeps the layer branch (SLB-11; coordinator, 6 Nov) | start, roles | Built; no-MERGER roles on the layer 7 trial (SLB-10, SLB-11) |
