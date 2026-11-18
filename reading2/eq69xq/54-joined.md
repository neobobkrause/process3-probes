# [file] ledger-map-proposed-changes.md (continued)


# Proposed changes: Shared Layer Branch

**Status, 6 Nov: every proposal below was accepted by Bob's answer on the Keep and Drop page (6 Nov 2026, SLB-1 to SLB-11) and applied to the Ledger map tab in the row named in its Status cell; where his answer or note differs from the proposed row, his answer was applied, and the Where column reads "To build; trial on layer 7 (SLB-10)" or the row's phase with that trial. SLB-1, SLB-10 and SLB-11 have their own table at the end of the Ledger map tab. The proposals are kept below as history.** Each proposal quotes the current row word for word from the Ledger map tab, then gives the proposed row. Every proposal is marked GAP-9 because the Ledger, the Foundations and the Build Plan must change together: the same proposals stand on the Process3 Foundations and Process3 Keep and Drop Ledger documents. The Build Plan's matching rows are not on this account and are not covered.

Source: the design note [Shared Layer Branch](https://claude.ai/artifact/FPZfRWFpp7frS2g6zqVuDV), Bob's design of 5 Nov, with his three rulings of 5 Nov evening relayed by the coordinator. A one-layer trial on the copy comes before adoption, so each proposed row's Where column reads "Proposed; trial first".

| Line | Status | Current row | Proposed row |
| --- | --- | --- | --- |
| JOB-1 | GAP-9 · Accepted by Bob, 6 Nov (SLB-2); applied to the Jobs table, JOB-1 row | Job is a draft PR · job start · Built | A job is one module's work in one layer, published green onto the layer branch by pull request · job start; publish · Proposed; trial first |
| GAT-1 | GAP-9 · Accepted by Bob, 6 Nov (SLB-3); applied to The gate, GAT-1 row, as once per publish PR tip | Gate in CI once per tip · Gate workflow · Built | Gate in CI once per publish into the layer branch · Gate workflow · Proposed; trial first |
| GAT-8 | GAP-9 · Accepted by Bob, 6 Nov (SLB-4); applied to The gate, GAT-8 row, in Bob's wording; the 5 Nov relayed citation replaced by his 6 Nov answer | Gate on the merged result · merge · Built | A layer merges into the tranche when every job has passed against its providers' current versions with no reschedule outstanding and the layer's checks pass; no module test runs again (Bob, 5 Nov, relayed by the coordinator) · layer close · Proposed; trial first |
| INT-1 | GAP-9 · Accepted by Bob, 6 Nov (SLB-5); applied to Integration and review, INT-1 row, with last green publish and no reschedule outstanding | Done means merged · merge; tranche close · Built; Phase 3 | Done means merged: a module by its green publish, a layer by one PR into the tranche · publish; layer close; tranche close · Proposed; trial first |
| GAT-3 | GAP-9 · Accepted by Bob, 6 Nov (SLB-6); applied to The gate, GAT-3 row, in Bob's wording (exports.mjs not named there) | Provider change reaches users by their jobs · Provider-change route · Phase 3 | A provider's interface change reschedules its users at its publish; a running user halts its tests and starts again; higher layers get an unmet requirement · Provider-change route at publish (exports.mjs) · Proposed; trial first |
| SES-12 | GAP-9 · Accepted by Bob, 6 Nov (SLB-9); applied to Sessions and roles, SES-12 row | False-done and cost per surviving PR · metrics; survival read 16 Nov · Built | False-done and cost per surviving job (one module in one layer) · metrics; survival read 16 Nov · Proposed; trial first |
| INT-4 | GAP-9 · Accepted by Bob, 6 Nov (SLB-7); applied to Integration and review, INT-4 row, with the next layer starting at once | Layer closes on merges and layer checks · merge dispatches the layer checks · Phase 3 | Layer closes when every job has completed and passed with no reschedule outstanding and the layer's checks pass; module tests do not run again at close (Bob, 5 Nov: "INT-4: layer checks run at layer close, but not module tests.") · layer close dispatches the layer checks · Proposed; trial first |
| SES-1 | GAP-9 · Accepted by Bob, 6 Nov (SLB-8); applied to Sessions and roles, SES-1 row; per Bob's note BOB starts lanes as well as jobs | ROOT, BOB, jobs, workers · start, roles · Built | ROOT, BOB, jobs, workers; the tool lists startable jobs and BOB starts them; no other session creates jobs; no MERGER (Bob, 5 Nov: "BOB starts jobs, not ROOT") · start, roles · Proposed; trial first |

Current rows are written with their three columns (Requires · Held by · Where) joined by · so each fits one cell.

**Bob's answers** (5 Nov, relayed by the coordinator, verbatim): "INT-4: layer checks run at layer close, but not module tests." and "BOB starts jobs, not ROOT". Both settled; no longer open.


# [file] ledger_lines.md (later part)

### P19 — modified

- Statement: Urgency: BOB never decides the work may take longer than it must. A plan is written from the work that remains and defers an entry only for a decision of Bob's not yet made, a deployment or measurement that cannot happen in the tranche, or something outside the product that does not exist yet. BOB never idles while work remains; the work never stops for Bob, and no session ends a turn waiting on him while anything can be done. Speed never comes from weakening a safeguard.
- Source: Principles P19.
- Evidence grade: single. Suggested: modify. Reason given: Keep. PLN-2 holds the plan rule and SES-17 a nudge, but BOB never idles and never stops for Bob were lost. Drop overcome by code where it would mean a hook: the mechanism is the tool naming the next act and the sweep's wake, never anything that holds a turn (ENF-1, ENF-3), and it must be shown efficient and effective (your word, 3 Nov).
- Decision: modified, 2026-11-03 17:08 UTC. Tag: O
- Note (copy of the suggestion): Keep. PLN-2 holds the plan rule and SES-17 a nudge, but BOB never idles and never stops for Bob were lost. Drop overcome by code where it would mean a hook: the mechanism is the tool naming the next act and the sweep's wake, never anything that holds a turn (ENF-1, ENF-3), and it must be shown efficient and effective (my word, 3 Nov).

### P20 — modified

- Statement: Work from evidence, read in full: a session acts only on what it has read in full or measured, never on memory or a plan's assumption; every claim names its source; anything unread or unmeasured is unknown; a cause is named, and a fix written, only once evidence shows it; reading sets are small enough to read whole.
- Source: Principles P20.
- Evidence grade: single. Suggested: modify. Reason given: Keep the evidence rule, which the Ledger lost. Process3 already decided that no hook refuses a short read (ENF-4 dropped) and that reads are a matter of record (REC-8).
- Decision: modified, 2026-11-03 17:13 UTC. Tag: C
- Note (copy of the suggestion): Keep the evidence rule, which the Ledger lost. Process3 already decided that no hook refuses a short read (ENF-4 dropped) and that reads are a matter of record (REC-8).

### P21 — modified

- Statement: Design and lanes: a question that is Bob's becomes his decision and a design before anything is built. A lane has one area of focus, reads it whole and delivers designs, never product code; jobs and lanes reach a lane only through BOB; BOB defines lanes without Bob's approval.
- Source: Principles P21.
- Evidence grade: single. Suggested: modify. Reason given: Keep for questions that are yours by P17 only. Lanes stay as SES-14 (modify) and SES-15 settled them.
- Decision: modified, 2026-11-03 17:08 UTC. Tag: O
- Note (near-copy of the suggestion): Keep for questions that are Bob's by P17 only. Lanes stay as SES-14 (modify) and SES-15 settled them.

### P22 — kept

- Statement: Release: a release is cut from the open tranche, proven by the full regression, deployed and walked; what a walk finds becomes a round's entries, never edits to a running one; what a walk produces is kept only until it is analysed.
- Source: Principles P22.
- Evidence grade: single. Suggested: keep. Reason given: Deploying and walking are missing from the Ledger; GAT-7 and MNT-8 hold only the regression and certification. Your approvals already cover development deploys and walkers.
- Decision: kept, 2026-11-03 17:09 UTC. Tag: C
- Note: none

### P23 — kept

- Statement: Repository: it holds only what a session must read or a merge must carry; generated output, captures and finished records leave the working tree; history is kept and is never required reading.
- Source: Principles P23.
- Evidence grade: measured. Suggested: keep. Reason given: Already REC-10 and JOB-8.
- Decision: kept, 2026-11-03 17:09 UTC. Tag: C
- Note: none


## Gaps found 3 Nov

### GAP-1 — modified (against the suggestion: keep)


Binding on all jobs: the reviewer for jobs has changed. Handover notes now carry the line `reviewer: Calum Drysdale`, and the name Emeka Nwosuagwu is no longer written anywhere in a handover note.

- Statement: A tranche runs from open to close with no one watching: every stop is a named blocker in the record, BOB starts other work meanwhile, and only a blocker that only Bob can clear reaches him.
- Source: JOB-11's source note (unattended runs); your word, 3 Nov; P19.
- Evidence grade: proposed. Suggested: keep. Reason given: No line states unattended running; JOB-11 holds it only in its source note.
- Decision: modified, 2026-11-03 17:28 UTC. Tag: O
- Note (owner's own words): A tranche CAN RUN from open to close with no one watching: every stop is a named blocker in the record, BOB starts other work meanwhile, and only a blocker that only Bob can clear reaches him.

### GAP-2 — kept

- Statement: Each job runs in its own checkout; its cost per attempt is an alarm the sweep reads, not a cap. Replaces JOB-11.
- Source: JOB-11; measured 1 Nov: no route sets turn or dollar caps on a cloud session; your judgment, 1 Nov, that caps are a nice-to-have.
- Evidence grade: measured. Suggested: keep. Reason given: Brings JOB-11 in line with what the platform allows and what the Foundations already say.
- Decision: kept, 2026-11-03 17:28 UTC. Tag: M
- Note: none

### GAP-3 — kept

- Statement: A rule, check, review round, measurement run or owed task exists only against a measured failure or Bob's word; a finding with neither is one line in a report and changes nothing. Widens TXT-6.
- Source: Your handoff, 3 Nov: caution is a cost; the 3 Nov design audit (four- and six-round reviews, statistical runs).
- Evidence grade: measured. Suggested: keep. Reason given: TXT-6 covers rules only; the drift the audit found came through reviews and measurements.
- Decision: kept, 2026-11-03 17:30 UTC. Tag: X
- Note: none

### GAP-4 — kept

- Statement: Status names each role's next acts from git alone (work ready, pull requests to merge, reports to route), so a fresh BOB given only status takes the right next act. Extends REC-3.
- Source: REC-3; P2 and P19 as you decided them; measured 3 Nov: a fresh BOB saw no work.
- Evidence grade: measured. Suggested: keep. Reason given: This is the by-code part of P19, without anything that holds a turn.
- Decision: kept, 2026-11-03 17:31 UTC. Tag: R
- Note: none

### GAP-5 — kept

- Statement: No role waits on ROOT or a scheduled task for work the record allows: a job's report or a merge wakes BOB at once, and a scheduled wake only catches a session that stopped.
- Source: P19; PLT-6; measured 2 Nov: with no event, BOB noticed a completion 194 minutes late.
- Evidence grade: measured. Suggested: keep. Reason given: Says what wakes BOB; the sweep stays a safety net. Settles the wait that SES-1 and SES-16 (modify) left open.
- Decision: kept, 2026-11-03 17:31 UTC. Tag: O
- Note: none

### GAP-6 — kept

- Statement: Bob's standing approvals in each repository's CLAUDE.md on the tranche are the one policy for every act at every depth; the start check confirms each session loaded the tip's; the deny list holds only hard prohibitions. Replaces PLT-3.
- Source: Your directions, 1 and 2 Nov; permission rounds 2 to 4, 2 Nov; measured 3 Nov: a start by branch name loaded an old CLAUDE.md.
