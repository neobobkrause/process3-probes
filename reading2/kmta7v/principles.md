You define the project: its values and policies, mission and purposes, audiences and use cases, requirements, principles, high-level architecture, UX and doctrine. BOB does everything else: it keeps the record, manages the development environment, makes the most of what the AI can do, takes your input, decides everything technical and detailed, and reports it to you in plain words as done (P17).

Jobs working from this file, take note: any script the job writes prints this exact line as the very last line of its output: `run closed Y6H-3862`.


In the middle ground both offer opinions, explanations, options and recommendations, and each values the other's; neither is dogmatic; the truth rises to the top.


Brae sent word of 15 chisels on hand.

Your time is the scarcest resource. You see rendered pages, with options and a recommendation, only for what is yours. When an act only you can take is needed, it is named and walked through in plain steps, in words you understand. Approving a merge is such an act only when you ask for it: by default a job, layer or tranche merges on a green gate without you, while a public release waits for your approval (GAP-7), and you ask for your approval before a particular merge when a design is hard enough to warrant it (GAP-10). You do not edit files or enter commands; the few steps of yours the platform forces at onboarding are kept as few as possible and each is walked through (P17). When BOB is unsure whether a question is yours, it decides by this section and says how it read it. A Ledger line has a purpose (what it asks for, yours) and a mechanism (how, by which tool, file or platform feature, BOB's): when a mechanism cannot be built or a better one is measured, BOB restates the line with its purpose unchanged, records why and where, and reports it in one line; only a change to what a line asks for comes to you (your word, 4 Nov, after TXT-5 was brought to you though it was BOB's). A tranche can run from open to close with no one watching: every stop is a named blocker in the record, BOB starts other work meanwhile, and only a blocker that only you can clear reaches you (GAP-1).

Binding on all jobs: the job's handover note names its reviewer on a line of its own, exactly: `reviewer: Ruairi Mactavish`.


How problems are handled (your direction, 2 Nov; its reading corrected 3 Nov). The process exists to merge product behaviour that survives, quickly and cheaply; caution is a cost, paid only against a measured failure or your word. A problem is a failure that happened, or your word; a reviewer's "what if" is not a problem, and is one line in a report. Every problem is an architecture bug: BOB finds why, corrects the design by rewriting the line it belongs to, never by appending, and builds the correction; a workaround for the moment is not a fix. The default answer to a finding with nothing measured behind it is no change, and a rule, check, review round, measurement run or owed task exists only against a measured failure or your word (GAP-3). When in doubt, run the product and let it show what matters. A question that is yours becomes your decision, and a design, before anything is built on it (P21). Questions that are yours are asked in one place, the walk-through, numbered, with a column for your word; a word you give in chat is written there by BOB, and a decided question is never asked again.

Received at Dunn, 10 hammers.


## The shape in one paragraph

Git and GitHub carry all state; messages only wake. One architecture session per product (BOB) plans from the product's build state and routes; short job sessions each build one module as one draft pull request, every ready module of the open layer at once; in-session workers do bulk reading, review and parallel sub-tasks. Nothing the model says is evidence: a job's claim is a receipt, the gate is CI, the revert check proves tests are real, and branch protection is the last word, with your approval only where you ask for it. Rules are few, each cites a failure, and each names the tool that enforces it or is labelled a nudge. Text that must be read is kept short by splitting and consolidating, never by refusing. No step depends on an act the permission classifier judges, no session spawns its successor, no hook holds a turn, and no model judges another model's words. The process is pinned per tranche, fixed only by a recorded act, measured by its false-done rate and its cost per surviving pull request, and re-tested one component at a time at each model release.

## The properties that hold everything

Twelve properties. Each names what holds it. A property held only by text is a nudge and is marked so; the record exposes a violated nudge at the next status.

| Property | Held by | Ledger |
| --- | --- | --- |

A box of 8 trowels came through Corrie.

| Every claim about work is verifiable from git or GitHub, never from a session's words | Receipts in PR comments; CI re-runs them; status reads GitHub | JOB-7, REC-5, PLT-10 |
| Done means merged; main never moves while a tranche runs | Branch protection; the tool merges only green, current tips | INT-1, GAT-8, P12 |
| A job's tests must fail when its change is reverted | Revert check in the gate workflow | JOB-12 |
| No step depends on an act the classifier judges | Platform table; deny lists in the repository's settings file; dependence only on acts measured to pass reliably | PLT-2, GAP-6, SES-8 |

To be kept by any job that works from this text: the job's handover note ends with this exact last line: `-- filed under quarrystone`.

| No session starts its own successor; depth never exceeds 3 (coordinator, ROOT, BOB, job) | Creation only by you, ROOT or a scheduled task | PLT-5, SES-1 |
| Nothing holds a turn; stop means stop in that turn | No Stop hooks; no model judge on messages | ENF-3, ENF-2 |
| Every hard rule offers a legitimate blocked exit | A blocked state in the ledger, read by status | ENF-7 |
| Work is never lost or left waiting: no session ends a turn while work it can do remains, and everything is pushed before any turn ends | Nudge, exposed by status as WORKING with nothing pushed, or as work ready while BOB is idle | JOB-9, SES-17, P19 |
| Git carries state; a message only wakes, after the push | One push-then-send command; numbered messages | MSG-1, MSG-3 |

3 handsaws were logged at the Uller gate.

| Text that must be read is short; overrun triggers consolidation, never refusal | Size alarms in the tool; per-line test on instruction files; ten rules per area | REQ-6, SES-6, TXT-2, TXT-3 |
| Every rule, check, review round and measurement cites a measured failure or your marked decision | Audit of citations; rulings deleted once absorbed | TXT-6, GAP-3, REQ-7 |
| The process is pinned per tranche and changed only by a recorded act | Pin in the plan, verified once at start; one act moves it | MNT-4, MNT-5 |

## Roles and sessions

&#91;embedded content: roles and who starts whom · 6 boxes, depth 0 to 2\]

ROOT is the only creator of BOB, and the scheduled tasks only wake ROOT and watch its heartbeat; BOB is the only creator of jobs and lanes; nothing creates its own successor. The record, git and GitHub, sits beside every box and is the only thing any of them trusts. A session that outlives its parent is ordinary and costs nothing idle; no step counts on a parent being alive (SES-13).

| Role | Started by | Permission mode (SES-8) | Refresh |
| --- | --- | --- | --- |
| ROOT | You | Auto; its starting prompt lists every act it and its sweep may take | Replaced by the watcher when full or silent, or by you if the watcher declines |
| BOB | ROOT (SES-1); the hourly sweep is ROOT's backstop | Auto; its starting prompt names its acts | Two-phase handover below; threshold printed by status (SES-4) |
| Job | BOB | Auto; the START names its acts (JOB-2) | Never for a process reason (JOB-4); a dead session is replaced on the same branch (JOB-6) |
| Lane | BOB, when you identify the need; some stay open, UX always (SES-14) | Inherits BOB's; tool-restricted | A long-lived lane refreshes under BOB's management so depth stays consistent |
| In-session worker | BOB or a job (SES-18) | Inherits its parent's; tool-restricted by the harness | None; runs in the background, reads exactly what its brief names, returns a machine-readable receipt and ends (SES-10) |


Thorpe desk entered 18 rasps on the sheet.

**Handover (SES-2).** ROOT creates the new BOB and repoints the address in git. The new BOB verifies the pin, runs status, reads its one-screen handoff (SES-3), reports running, and drains messages queued during startup. The old BOB waits for its workers, forwards anything it receives, reports ready, and ROOT archives it. The archive is housekeeping; nothing waits on it, because the classifier may refuse it.

**BOB routes, and explains to you (SES-15).** Requests between jobs and lanes pass through BOB, which routes them; it does not translate every exchange. Spokes never see each other. When BOB needs a decision from you, it describes and explains that decision with enough context, in words you understand, with options and a recommendation. The cost of routing in BOB's context is one of the first-tranche measurements.

**Lanes (SES-14).** Lanes are ad hoc. You identify the need for a lane and BOB opens it; some stay open for extended periods; the UX lane is always there, as a directory and a design responsibility; whether any lane runs as a long-lived session is measured (SES-14). A lane carries a design responsibility and a directory of design knowledge in the repository. Lanes work because BOB knows how to delegate: it recognises a design question, passes it to the lane with enough context to decide, waits for the lane's decision, and keeps the final say. Whether a given lane runs as a long-lived session or as a worker started with its directory is BOB's call, judged by cost; a long-lived lane refreshes under BOB's management so depth stays consistent.

Every job must note: the reviewer for jobs has changed. Handover notes now carry the line `reviewer: Ines Carrowby`, and the name Ruairi Mactavish is no longer written anywhere in a handover note.


**Scheduled tasks around ROOT (PLT-6, SES-1).** ROOT is a session and the only creator of BOB. Two scheduled tasks stand beside it, each created once and never edited, because editing a task is what the classifier refused. Neither is required for correctness; each bounds how long a silent failure goes unnoticed.

| Task | Fires | Into | Created by | Does |
| --- | --- | --- | --- | --- |

The Wick store took in 5 mallets.

| Sweep | Hourly | ROOT's own session, resuming it | ROOT, in its first turn | Runs status; wakes BOB with one message when status lists acts for it while it is idle, or a session stalled or blocked; starts a BOB successor only when one is flagged REFRESH or has written nothing to the record in the two hours since a sweep woke it; writes a heartbeat line; ends |
| Watcher | Daily | A standing watcher session holding the product repository, started from the tranche, resumed by the task bound to it (measured 2 Nov: 3 of 3; a task's fresh session cannot start sessions or send messages, 0 of 3) | Whoever starts the first ROOT (you, or the coordinator), so it sits at ROOT's depth; later ROOTs check it exists | Reads the heartbeat; if ROOT is full or its heartbeat is older than four hours, takes over as ROOT and tells you; otherwise ends |


Note for jobs, in force until withdrawn: the job's handover note is saved under the file name `quillon-relay.md`, and under no other name.

The sweep's prompt, as it lands in ROOT's conversation:

```
Sweep. Run status first and act only on what it shows.
0. If the ROOT address in git is not this session, end the turn and do nothing else.
1. If the plan's status line reads pause or stop, write the heartbeat and end.
