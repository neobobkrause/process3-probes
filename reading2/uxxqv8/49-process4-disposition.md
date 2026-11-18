| 65 | F-HUM-14 | When in doubt, run the product and let it show what matters. | PURPOSE | **KEEP** | D6(iii), the internal walk, is of this kind; the checks that held up were the ones that ran the product (change_sample §5). |
| 66 | F-HUM-15 | A question that is the owner's becomes his decision, and a design, before anything is built on it (P21). | PURPOSE | **KEEP** | Under D2 only the work that depends on the answer waits. |
| 67 | F-HUM-16 | Questions that are the owner's are asked in one place, numbered, with a column for his word; a decided question is never asked again. | PURPOSE | **KEEP** | D10: the column holds only words he wrote. |
| 68 | F-HUM-17 | A word the owner gives in chat is written into the walk-through by ARCH. | MECHANISM | **KEEP PURPOSE, MECHANISM OPEN** | D10: "only words the owner himself wrote count as his word", so a session's transcription cannot be what makes a word his. Evidence: of 218 attributions to him, 64 were his traceable words and 48 were a session's own decision written as his (bob_naming, table total; 47 of the 48 by the coordinator). |

### Foundations: The shape in one paragraph

| # | Id | Requirement | Kind | Disposition | Note |
| --- | --- | --- | --- | --- | --- |
| 69 | F-SHAPE-1 | Git and GitHub carry all state; messages only wake; each job's coordination is in its pull request. | PURPOSE | **KEEP** |  |
| 70 | F-SHAPE-2 | One architecture session per product plans from the build state and routes; job sessions each build one module as one draft pull request, every ready module of the open layer at once; in-session workers do bulk reading, review and sub-tasks. | MECHANISM | **KEEP PURPOSE, MECHANISM OPEN** | "Open layer" is ended by D5, which gives the readiness rule; D4 gives the bound (8 job slots, actively filled); D10 renames the architecture session. "One module, one job" is D3. |
| 71 | F-SHAPE-3 | Nothing the model says is evidence: a job's claim is a receipt, the gate is CI, the revert check proves tests real, and branch protection is the last word. | PURPOSE | **KEEP PURPOSE, MECHANISM OPEN** | The purpose stands. Two of its named mechanisms are in question: the receipt (JOB-7, removed on the owner's word on 9 Nov) and the revert check (JOB-12, conflict CHK). |
| 72 | F-SHAPE-4 | Rules are few, each cites a failure, and each names the tool that enforces it or is labelled a nudge. | PURPOSE | **KEEP PURPOSE, MECHANISM OPEN** | D9 restates "few". Evidence against citation as the brake: every growth was cited (causal_forensics §7), and check-adding stayed at 41% of merges before and after the owner's 5 Nov instruction (change_sample, summary). |
| 73 | F-SHAPE-5 | The process is measured by its false-done rate and its cost per surviving pull request; these are the standing judge of every other line. | MECHANISM (two metrics) for a PURPOSE (an honest judge) | **KEEP PURPOSE, MECHANISM OPEN** | Evidence: 218 of 220 jobs read COMPLETE and 98.8% of landed lines survived while 147 of 157 live walk steps failed (product_side, summary 2 and 3), so both metrics would have read healthy on a product that did not work. D7 makes a failure-free round the test of a tranche. The definition must say what judges, and the owner should see any change to his judge. |
| 74 | F-SHAPE-6 | The process is re-tested one component at a time at each model release. | MECHANISM | **KEEP** | A trial of the process, not of the product (section 5). Leans with D9. |

### Foundations: The properties

| # | Id | Requirement | Kind | Disposition | Note |
| --- | --- | --- | --- | --- | --- |
| 75 | F-PROP-0 | Each property names what holds it; one held only by text is a nudge and is marked so; the record exposes a violated nudge at the next status. | PURPOSE | **KEEP** | Evidence about nudges as holders: restraint was a nudge read once while checks were code that refused on every call (causal_forensics, headline 3). |
| 76 | F-PROP-2 | Done means merged; main never moves while a tranche runs. | PURPOSE | **KEEP** |  |
| 77 | F-PROP-3 | A job's tests must fail when its change is reverted. | PURPOSE | **CONFLICT FOR THE OWNER** | Conflict CHK: this property is held by the revert check (JOB-12). |
| 78 | F-PROP-8 | Work is never lost or left waiting: no session ends a turn while work it can do remains, and everything is pushed before any turn ends. | PURPOSE | **KEEP PURPOSE, MECHANISM OPEN** | D9 ("Claude stopping short of work it could do") and D4 ("slots are actively filled") restate the purpose. Evidence against the mechanisms built for it: the idle alarm misfired for 2 h 22 min and the idle check before every command cost 1,564 git processes (change_sample PRs 139, 140). The Foundations hold it as a nudge. |
| 79 | F-PROP-12 | The process is pinned per tranche and changed only by a recorded act. | PURPOSE | **KEEP** | D8: the recorded act is not the owner's merge. The cost of frequent pin moves is at MNT-5. |

### Foundations: The record

| # | Id | Requirement | Kind | Disposition | Note |
| --- | --- | --- | --- | --- | --- |
| 80 | F-REC-1 | The process and the product are separate; the process lives in its own repository (P2). | PURPOSE | **KEEP** |  |
| 81 | F-REC-2 | The product's build state lives at the paths the product's config names, is written only through the process, and is what tells ARCH what to do. | MECHANISM | **KEEP** |  |
| 82 | F-REC-3 | Sessions are kept short, because cost grows with context times turns; ARCH refreshes at a threshold. | PURPOSE | **KEEP** | How a refresh happens without handoff scanning (D9) is open at SES-2 and SES-3. |
| 83 | F-REC-4 | The handoff is a pointer set on one screen, written by the tool, never by hand. | MECHANISM | **KEEP PURPOSE, MECHANISM OPEN** | D9 lists "handoff scanning" among the interruptions; the definition must say how a successor starts. The line as written was not what ran: 26 hand-written handoff notes became the rulebook (causal_forensics, headline 4 and §3). |
| 84 | F-REC-5 | No branch is deleted or force-pushed; the owner's approvals and rulesets forbid both. | PURPOSE (the owner's prohibition) | **KEEP** | Rulesets are the kind of setting D1 leaves to him. |
| 85 | F-REC-6 | A session acts only on what it has read in full or measured; every claim names its source; anything unread or unmeasured is unknown; a cause is named, and a fix written, only once evidence shows it (P20). | PURPOSE | **KEEP** |  |

### Foundations: Requirements, rules and text

| # | Id | Requirement | Kind | Disposition | Note |
| --- | --- | --- | --- | --- | --- |
| 86 | F-REQ-1 | The owner decides only the layers and modules that carry product capability; the rest is ARCH's. | PURPOSE | **KEEP** | "Layers" is ended by D5. The product's layer contracts are placement rules, not scheduling (no_layers_width §5); D5 does not say whether they remain as text. |
| 87 | F-REQ-2 | Each module's file states the services it provides, the services it uses by module, its invariants and the product requirements it satisfies; it may suggest but never require an implementation; it is concise because it is read whole (P5). | PURPOSE | **KEEP** | The provided-services part is what an interface change is measured against (D3). |
| 88 | F-REQ-3 | A module fits in one reading: one session can read in full its code, its requirements and those of the services it uses (P6). | PURPOSE | **KEEP** |  |
| 89 | F-REQ-4 | A change needing no judgment across many modules is one mechanical pass by a worker while no job runs, with one full test run in CI; where judgment is needed, the module gets its own job (P7). | MECHANISM | **ENDED BY DECISION** | D3: "Each module is updated and tested by a single job". D6: "The full regression is ended; the internal walk replaces it". The pass never had a procedure (ledger_map: P7 gap). The owner kept this clause on 3 Nov ("Keep the mechanical pass, shorter"), so he should see that D3 and D6 end it. |
| 90 | F-REQ-5 | One rulebook per role, at most ten rules on one screen, rewritten in place and never appended; when the owner raises a problem a rule is rewritten and no ruling is added (TXT-3). | MECHANISM | **KEEP** | D9 restates the purpose. The ten-rule cap held all week (verify_numbers §7). |
| 91 | F-REQ-6 | Each role's starting prompt names its own text in the pinned process, so a role loads only its rules (TXT-5). | MECHANISM | **KEEP** |  |
| 92 | F-REQ-7 | The principles are trimmed so each role loads only the few that govern its stage (TXT-4). | MECHANISM | **KEEP** | On trial at the owner's word ("I'm skeptical, but let's try"); not measured. Section 5. |
| 93 | F-REQ-8 | The product's CLAUDE.md is under thirty lines, written by ARCH line by line, and changes without the owner's approval (his word, 1 Nov). | PURPOSE (the owner's word about his time) | **KEEP** | D8 agrees. The approvals block inside the file is the conflict at GAP-6. Fact: the file ended at 22 lines and 8,664 bytes, all growth from 16 owner patches (product_side §6a). |
| 94 | F-REQ-9 | Every line in any instruction file is failure-backed, non-inferable from the code, or tool-enforced; lines are deleted on review (TXT-2). | MECHANISM | **CANDIDATE TO END ON EVIDENCE** | As TXT-2. |
| 95 | F-REQ-10 | Every text names its audience and speaks plainly (TXT-7). | PURPOSE | **KEEP** |  |
| 96 | F-REQ-11 | Each role's reading set is fixed and printed with sizes (SES-5). | MECHANISM | **KEEP** | A printed measure that blocks nothing (section 5). |
| 97 | F-REQ-12 | Nothing is ever refused for size: budgets are fractions of the model's window in one table, never bytes in code; an overrun is measured and reported, never refused (SES-6). | MECHANISM | **CANDIDATE TO END ON EVIDENCE** | As SES-6: a candidate for the process's own instruction texts only. |
| 98 | F-REQ-13 | A summary is an option ARCH may take, never a requirement (SES-7). | MECHANISM | **KEEP** |  |

### Ledger JOB

| # | Id | Requirement | Kind | Disposition | Note |
| --- | --- | --- | --- | --- | --- |
| 99 | JOB-1 (kept) | A job is a draft pull request from `job/<module>` to the tranche branch; its body is its START, its report is a comment, its merge is its completion. | MECHANISM | **KEEP** | Fits D3 and D4 (a slot frees when the job "completes and is merged"). |
| 100 | JOB-2 (kept) | A START names only acts the tool supports, each as the command the job runs. | MECHANISM | **KEEP** |  |
| 101 | JOB-3 (kept) | A module's earlier unmerged work is taken in by a tool command on the job's own branch. | MECHANISM (purpose: no work lost, no hand-copied diffs) | **KEEP** | The need is real now: 27 unmerged November job branches (product_side §1, §5). |
| 102 | JOB-4 (kept) | A job is never restarted for a process reason; a blocking flaw holds it at its next command, the fix lands, and the same job continues. | PURPOSE (mechanism: hold, fix, continue) | **KEEP PURPOSE, MECHANISM OPEN** | The purpose stands and D8 agrees that the flaw is fixed. Evidence against the mechanism as it ran: 116 pin moves reaching the product a median 3 to 21 minutes after merging, 1,339 sync merges against 508 landings, and 3.1 job starts per job (product_side §4, §5). |
| 103 | JOB-5 (kept) | A job's completion runs locally only checks that take seconds; the gate is CI. It pushes, posts its report, marks the pull request ready and sets COMPLETE. | MECHANISM | **KEEP** | The receipt part of the report is at JOB-7. The seconds-long local checks are in section 5. |
| 104 | JOB-6 (kept) | An unmerged job whose session is gone is restartable by one command that keeps its branch and pull request. | PURPOSE | **KEEP** |  |
| 105 | JOB-7 (modified) | A job's report carries Met, Evidence as a machine-readable receipt, and what it found elsewhere; a flaw in another module goes to ARCH as a report. | MECHANISM (receipt) and PURPOSE (what a job finds elsewhere reaches ARCH) | **CANDIDATE TO END ON EVIDENCE** | The candidate is the receipt only. Evidence: no catch in 1,187 gate runs, about 20 follow-up merges, and the owner's "get rid of it completely" on 9 Nov (change_sample Case 3; DECISIONS.md PD-21). He decided it for Process3; he must confirm it for Process4. The found-elsewhere half stands (F-JOB-6). |
| 106 | JOB-8 (kept) | A job never commits a generated artifact. | PURPOSE | **KEEP** | No check was built for it (ledger_map Gap). |
