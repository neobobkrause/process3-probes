# Process3 Foundations

Oct 31, 2026 · @Sparky2

## How this was decided

This is the third development process, drawn from the Keep and Drop Ledger: 126 lines decided on 31 Oct 2026 (103 kept, 16 modified, 7 dropped; on 3 Nov you restated PLT-2 and PLT-5), then on 3 Nov the 21 principles of the two earlier processes (10 kept, 10 modified, 1 dropped) and 12 lines for gaps found that day (11 kept, 1 modified). Every line came from the 30 Oct requirements draft, the 29 Oct neoProcess page, the research report on other Claude Code processes, the earlier processes' principles, or our discussion, and each cites its source.

It is a foundations document, not a requirements specification. It states the properties the process must have and the mechanism that holds each one. The rulebooks, the requirements files and the tool follow from it. Nothing here is in force until it has run on a real tranche with the two health metrics measured.

Five lines were decided against the suggestion, and their notes are carried into the sections below: whole-product checks move to release (ARC-4), a restarted job must understand why it was corrected (JOB-14), the start table also picks the permission mode (SES-8), and BOB stays the hub between spokes, routing every request and translating only where needed (SES-15), and a tranche can run with no one watching rather than must (GAP-1). Lines where the note said to measure first are gathered under To measure.

What follows this document is a detailed build plan derived from it, which we review, assess and evolve. Implementation starts only when we are confident the result will function for development projects large and small, be efficient and productive, and produce production-quality workflows for Civicsmith and the products after it. The Ledger, this document and the Build Plan agree: each section here and each Build Plan row cites the Ledger lines it serves, and no build starts on a line any of them contradicts (GAP-9).

## What this process is for

This is a development process, mostly software development, and it exists to meet the standards you set in two roles: product manager and software engineer.

A product starts as the description of a need. The need is described from the perspective of the audiences who share it, even though their interests differ. Each audience has requirements, use cases, priorities, journeys, perspectives, resources and styles. Beyond leadership, these audience attributes are most of what you contribute in the product management role. In the engineering role you set the standards for architecture, user experience, reliability, versatility, scalability, performance and responsiveness, cost, and the other factors of a sound system.

| Role | What you set | Where the process carries it |
| --- | --- | --- |
| Product manager | Audiences and their requirements, use cases, priorities, journeys, perspectives, resources and styles | The canon and each module's requirements, cited by id; lanes for design areas you identify |
| Software engineer | Architecture, user experience, reliability, versatility, scalability, performance and responsiveness, cost | The module order and layers, the checks, the gate, measurements at scale (REQ-3), and the cost metrics |

The process exists to put correct, working product behaviour that meets its requirements onto main, quickly and cheaply, so that it survives, with your time spent only where it is yours (P1). Nothing else is output: a rule, a record, a check or a test has value only as far as it serves that, and one that does not is wrong. Everything below is machinery for it.

## The human and the AI

You are human; the sessions are AI; the process uses the strengths of each.

You define the project: its values and policies, mission and purposes, audiences and use cases, requirements, principles, high-level architecture, UX and doctrine. BOB does everything else: it keeps the record, manages the development environment, makes the most of what the AI can do, takes your input, decides everything technical and detailed, and reports it to you in plain words as done (P17).

In the middle ground both offer opinions, explanations, options and recommendations, and each values the other's; neither is dogmatic; the truth rises to the top.

Your time is the scarcest resource. You see rendered pages, with options and a recommendation, only for what is yours. When an act only you can take is needed, it is named and walked through in plain steps, in words you understand. Approving a merge is such an act only when you ask for it: by default a job, layer or tranche merges on a green gate without you, while a public release waits for your approval (GAP-7), and you ask for your approval before a particular merge when a design is hard enough to warrant it (GAP-10). You do not edit files or enter commands; the few steps of yours the platform forces at onboarding are kept as few as possible and each is walked through (P17). When BOB is unsure whether a question is yours, it decides by this section and says how it read it. A Ledger line has a purpose (what it asks for, yours) and a mechanism (how, by which tool, file or platform feature, BOB's): when a mechanism cannot be built or a better one is measured, BOB restates the line with its purpose unchanged, records why and where, and reports it in one line; only a change to what a line asks for comes to you (your word, 4 Nov, after TXT-5 was brought to you though it was BOB's). A tranche can run from open to close with no one watching: every stop is a named blocker in the record, BOB starts other work meanwhile, and only a blocker that only you can clear reaches you (GAP-1).

How problems are handled (your direction, 2 Nov; its reading corrected 3 Nov). The process exists to merge product behaviour that survives, quickly and cheaply; caution is a cost, paid only against a measured failure or your word. A problem is a failure that happened, or your word; a reviewer's "what if" is not a problem, and is one line in a report. Every problem is an architecture bug: BOB finds why, corrects the design by rewriting the line it belongs to, never by appending, and builds the correction; a workaround for the moment is not a fix. The default answer to a finding with nothing measured behind it is no change, and a rule, check, review round, measurement run or owed task exists only against a measured failure or your word (GAP-3). When in doubt, run the product and let it show what matters. A question that is yours becomes your decision, and a design, before anything is built on it (P21). Questions that are yours are asked in one place, the walk-through, numbered, with a column for your word; a word you give in chat is written there by BOB, and a decided question is never asked again.

## The shape in one paragraph

Git and GitHub carry all state; messages only wake. One architecture session per product (BOB) plans from the product's build state and routes; short job sessions each build one module as one draft pull request, every ready module of the open layer at once; in-session workers do bulk reading, review and parallel sub-tasks. Nothing the model says is evidence: a job's claim is a receipt, the gate is CI, the revert check proves tests are real, and branch protection is the last word, with your approval only where you ask for it. Rules are few, each cites a failure, and each names the tool that enforces it or is labelled a nudge. Text that must be read is kept short by splitting and consolidating, never by refusing. No step depends on an act the permission classifier judges, no session spawns its successor, no hook holds a turn, and no model judges another model's words. The process is pinned per tranche, fixed only by a recorded act, measured by its false-done rate and its cost per surviving pull request, and re-tested one component at a time at each model release.

## The properties that hold everything

Twelve properties. Each names what holds it. A property held only by text is a nudge and is marked so; the record exposes a violated nudge at the next status.

| Property | Held by | Ledger |
| --- | --- | --- |
| Every claim about work is verifiable from git or GitHub, never from a session's words | Receipts in PR comments; CI re-runs them; status reads GitHub | JOB-7, REC-5, PLT-10 |
| Done means merged; main never moves while a tranche runs | Branch protection; the tool merges only green, current tips | INT-1, GAT-8, P12 |
| A job's tests must fail when its change is reverted | Revert check in the gate workflow | JOB-12 |
| No step depends on an act the classifier judges | Platform table; deny lists in the repository's settings file; dependence only on acts measured to pass reliably | PLT-2, GAP-6, SES-8 |
| No session starts its own successor; depth never exceeds 3 (coordinator, ROOT, BOB, job) | Creation only by you, ROOT or a scheduled task | PLT-5, SES-1 |
| Nothing holds a turn; stop means stop in that turn | No Stop hooks; no model judge on messages | ENF-3, ENF-2 |
| Every hard rule offers a legitimate blocked exit | A blocked state in the ledger, read by status | ENF-7 |
| Work is never lost or left waiting: no session ends a turn while work it can do remains, and everything is pushed before any turn ends | Nudge, exposed by status as WORKING with nothing pushed, or as work ready while BOB is idle | JOB-9, SES-17, P19 |
| Git carries state; a message only wakes, after the push | One push-then-send command; numbered messages | MSG-1, MSG-3 |
| Text that must be read is short; overrun triggers consolidation, never refusal | Size alarms in the tool; per-line test on instruction files; ten rules per area | REQ-6, SES-6, TXT-2, TXT-3 |
| Every rule, check, review round and measurement cites a measured failure or your marked decision | Audit of citations; rulings deleted once absorbed | TXT-6, GAP-3, REQ-7 |
| The process is pinned per tranche and changed only by a recorded act | Pin in the plan, verified once at start; one act moves it | MNT-4, MNT-5 |

## Roles and sessions

&#91;embedded content: roles and who starts whom · 6 boxes, depth 0 to 2\]

ROOT is the only creator of BOB, and the scheduled tasks only wake ROOT and watch its heartbeat; BOB is the only creator of jobs and lanes; nothing creates its own successor. The record, git and GitHub, sits beside every box and is the only thing any of them trusts. A session that outlives its parent is ordinary and costs nothing idle; no step counts on a parent being alive (SES-13).


Jobs working from this file, take note: the job's handover note names its reviewer on a line of its own, exactly: `reviewer: Lucinda Abernathy`.

| Role | Started by | Permission mode (SES-8) | Refresh |
| --- | --- | --- | --- |
| ROOT | You | Auto; its starting prompt lists every act it and its sweep may take | Replaced by the watcher when full or silent, or by you if the watcher declines |
| BOB | ROOT (SES-1); the hourly sweep is ROOT's backstop | Auto; its starting prompt names its acts | Two-phase handover below; threshold printed by status (SES-4) |
| Job | BOB | Auto; the START names its acts (JOB-2) | Never for a process reason (JOB-4); a dead session is replaced on the same branch (JOB-6) |
| Lane | BOB, when you identify the need; some stay open, UX always (SES-14) | Inherits BOB's; tool-restricted | A long-lived lane refreshes under BOB's management so depth stays consistent |
| In-session worker | BOB or a job (SES-18) | Inherits its parent's; tool-restricted by the harness | None; runs in the background, reads exactly what its brief names, returns a machine-readable receipt and ends (SES-10) |

**Handover (SES-2).** ROOT creates the new BOB and repoints the address in git. The new BOB verifies the pin, runs status, reads its one-screen handoff (SES-3), reports running, and drains messages queued during startup. The old BOB waits for its workers, forwards anything it receives, reports ready, and ROOT archives it. The archive is housekeeping; nothing waits on it, because the classifier may refuse it.

