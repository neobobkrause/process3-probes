# Canon analysis: how much of the Process3 failure was written into the documents the owner approved

Prepared 13 Nov 2026 by one of the independent analysts on the post-mortem.

## Summary

The canon carried a heavy check load before any drift, and its restraints could not hold that load down.

- **Day-zero load.** The approved canon mandates about 195 distinct checks, reviews, measurements, alarms, records, roles and recurring tasks (Inventory A). On 3 Nov the canon's own map showed only 51 of its 151 rows as simply built. The rest were owed work, and most of the owed work was checks.
- **Restraints.** I count 47 lines or sentences that restrain adding checks, rules or caution (Inventory B). The 25 that restrain one specific thing (hooks, in-session gates, review rounds) are mostly held by code or by the design. The 22 that restrain growth in general are all held by text alone. None of the 47 limits the number of checks, the size of the tool, the number of process changes in a run, or the share of effort spent on the process.
- **The central rule is a test of justification, not a budget.** GAP-3 allows a check "only against a measured failure or your word". A failure of the process's own machinery is a measured failure, and a session writes the owner's chat words into the record. Both sources are produced by the run itself, so the test is always passable.
- **The fix is mandatory and the mechanism is the session's to choose.** "Every problem is an architecture bug: BOB finds why, corrects the design ... and builds the correction; a workaround for the moment is not a fix." Mechanisms, including which checks exist, are BOB's without the owner. The same sessions may change the process and move the running product onto it.
- **Judgment.** The direction of the collapse was foreseeable from the canon alone, and the Ledger's own "Against" column foresaw most of it in terms. The speed was not determinable from the text. Section 6 names the eight features most responsible.

## Scope, method and limits

I read three inputs in full: the Process3 Foundations (292 lines, about 9,800 words), the Ledger map (dated 3 Nov), and the Keep and Drop Ledger page (exported 5 Nov). The Ledger's content sits in JavaScript inside the HTML; a small parser extracted the 159 lines, their 126 detail entries and the 159 stored decisions. The full extraction is in `/tmp/claude-0/-home-user/5fb00928-6c32-53d3-a000-4e1f643cb17f/scratchpad/work/ledger_lines.md`.

Four limits apply.

1. **"Day zero" is 3 to 5 Nov, not 31 Oct.** The Foundations is dated 31 Oct but carries text through 4 Nov, and the Ledger export is from 5 Nov. I cannot separate the 31 Oct text from later insertions except by the dated parentheticals. The inventories describe the canon as approved by 5 Nov.
2. **I did not see what sessions actually loaded.** The rulebooks, starting prompts, reading sets, the Build Plan and the tool's code are not among my inputs. Statements about where a session would meet a line are inferences from the canon's own design for what sessions load, and are marked as such.
3. **Counts in the inventories are my reading.** Another reader would merge or split some items. The totals are good to within perhaps ten percent; the pattern does not depend on the exact numbers.
4. **One exposure to another analyst's material.** A file `review.txt` sits in the same work directory. Its opening lines (a headline verdict and a few numbers) appeared when I listed the directory. I read no further and used none of it; everything below rests on the three named inputs and the background given in my brief.

"The canon" below means the Ledger and the Foundations together. The Ledger map is a record derived from them, used here as evidence of what was built.

## 1. The Ledger lines

### What the page holds

| Group | Lines | Kept | Modified | Dropped | Decisions recorded (UTC) |
| --- | --- | --- | --- | --- | --- |
| Original lines | 126 | 98 | 21 | 7 | 31 Oct 00:54 to 02:32; six re-dated 3 Nov 19:30 to 20:00 |
| Principles of the earlier processes (P1 to P23, without P14 and P15) | 21 | 10 | 10 | 1 | 3 Nov 16:58 to 17:13 |
| Gaps found 3 Nov (GAP-1 to GAP-12) | 12 | 11 | 1 | 0 | 3 Nov 17:28 to 17:36 |
| Total | 159 | 119 | 32 | 8 |  |

Six facts about the page matter for the rest of this analysis.

1. **The owner accepted the drafted suggestion on 151 of 159 lines.** The eight against the suggestion are all "keep" turned into "modify": PLT-2, PLT-5, ARC-4, JOB-14, INT-4, SES-8, TXT-1 and GAP-1.
2. **Most notes are not the owner's own words.** Of 33 notes, 18 are a copy, near-copy or excerpt of the session's suggestion text, 6 say they were "written here by the coordinator" or "recorded by the coordinator", 4 add a few owner words to the suggestion, and 5 are the owner's own (REC-9, ARC-4, JOB-14, SES-8, GAP-1).
3. **The decisions were recorded quickly.** The first 126 took 98 minutes, about 47 seconds a line. The 21 principles took 15 minutes and the 12 gap lines took 8. GAP-3, the central restraint, was recorded between GAP-2 at 17:28 and GAP-4 at 17:31. The owner may have read and discussed the lines beforehand; the timestamps show only when choices were saved.
4. **The evidence grades do not meet the canon's own citation rule.** The page grades 99 lines "measured", 11 "convergent", 30 "single" (one source or anecdote) and 19 "proposed" (reasoning only). Of the 151 kept or modified lines, 43 are "single" or "proposed". Many "measured" lines cite only the earlier requirements draft with a reason such as "Working" or "Held". The lines stand because the owner clicked Keep, which is "your word". That is how the second half of GAP-3's test discharges the first half.
5. **The Foundations and the page disagree on the counts.** The Foundations reports 103 kept, 16 modified and 7 dropped for the original 126 and names two lines restated on 3 Nov. The export shows 98, 21 and 7, with six lines re-dated 3 Nov. The canon did not satisfy its own GAP-9 ("the three documents agree") on its headline numbers.
6. **Three kept lines are dead.** PLT-3, JOB-11 and INT-3 are still marked kept, and each is "replaced" by a GAP line appended on 3 Nov. The correction was made by appending, which the canon forbids ("never by appending").

### Tag counts

My primary tag for each line gives a rough balance of the canon. It is a judgment, shown in the table so it can be challenged.

| Tag | Meaning | Lines |
| --- | --- | --- |
| C | Adds a check, gate, review or verification | 29 |
| R | Adds a record or bookkeeping artefact | 24 |
| M | Adds a measurement, metric or alarm | 11 |
| S | Defines a role or session structure | 7 |
| X | Restrains checks, rules, caution or cost | 32 |
| O | Other design constraint, structure or policy | 45 |
| D | Dropped | 8 |
| rep | Kept on the page but replaced by a GAP line | 3 |

Lines that add machinery (C, R, M, S) number 71. Lines that restrain it number 32. The restraint lines are more numerous than the canon's critics might expect; Section 3 shows why their number did not matter.

### Every line

The table gives the opening words of each line, the decision, my tag, and the note stored with the decision. A note in square brackets is labelled with its origin. Full statements, sources, suggestions, notes and the page's own pros and cons are in `ledger_lines.md`.

| Id | Line (opening words; full text in ledger_lines.md) | Decision | Tag | Owner's note |
| --- | --- | --- | --- | --- |
| PLT-1 | Keep one dated table of platform constraints: each a measured fact, how often measured, the evidence, and the workaround the process uses. Nothing … | kept | M |  |
| PLT-2 | Depend on no act the auto-mode permission classifier decides case by case: archiving sessions, editing or deleting scheduled tasks, interrupting … | modified (suggested keep); re-dated 3 Nov | O | [written in by the coordinator] Bob's word in chat, 3 Nov (written here by the coordinator): depend only on acts the committed approvals cover and that were measured to pass; archiving sessions and switching off or deleting tasks are housekeeping, counted and reported, never needed for correctness. |
| PLT-3 | Hard permission rules live in allow and deny lists in user settings plus the sandbox, which run before the classifier. The classifier is defence in … | kept | rep |  |
| PLT-4 | No step runs longer than the in-session background limit; anything that can is a CI workflow. | kept | O |  |
| PLT-5 | No session starts its own successor. Sessions are started only from depth 0 or 1, so depth never grows past 2. | modified (suggested keep); re-dated 3 Nov | O | [written in by the coordinator] Bob's word in chat, 3 Nov, option A (written here by the coordinator): no session starts its own successor; depth stays at most 3 (coordinator, ROOT, BOB, job), as ran on 3 Nov when the explore and review jobs merged at depth 3. The watcher is started beside ROOT by whoever starts ROOT. |
| PLT-6 | A scheduled task is never required for correctness; a wake is a convenience and the record is read at every wake regardless. | kept | O |  |
| PLT-7 | A session works on one repository, the product's; the process is a read-only clone at a pinned commit. | kept | O |  |
| PLT-8 | GitHub acts a session cannot take run on GitHub's runner by workflows with your tokens as secrets. | kept | O |  |
| PLT-9 | Every credential is gathered once before a product's first tranche and checked at every tranche open; a missing grant stops a tranche from opening, … | kept | C |  |
| PLT-10 | A session's platform status is never read as its work state; the record is. | kept | O |  |
| ENF-1 | Hooks: remove all. Nothing refuses an act, holds a turn, records an act, or judges a message. | modified | X | [copy of the suggestion] at most a handful of command hooks, each for a zero-exception rule, each with a legitimate blocked exit; none that hold a turn or judge text. |
| ENF-2 | No model judge sits between a session's message and you. | kept | X |  |
| ENF-3 | Nothing holds a turn. When you say stop, the session stops in that turn. | kept | X |  |
| ENF-4 | A PreToolUse hook refuses any read that stops short of a set document. | dropped | D |  |
| ENF-5 | A Stop hook refuses a turn's end past the context threshold until a refresh is recorded. | dropped | D |  |
| ENF-6 | A separate small model checks after each turn whether the session's record reads finished and sends it back if not. | modified; re-dated 3 Nov | X | [written in by the coordinator] native /goal with a mechanical condition (PR state on GitHub), no model judging the transcript. Superseded by Bob's word, walk-through question 2, 1 Nov ("Yes, as recommended"): no /goal, since its check is a model reading the conversation; a stopped job is caught by status and the sweep. Recorded by the coordinator, 3 Nov, … |
| ENF-7 | Every gate or hard rule offers the model a legitimate exit: 'blocked' or 'flag as impossible', recorded and visible to BOB. | kept | O |  |
| REC-1 | Durable facts live on the tranche branch, transient ones on an orphan state branch deleted at each transition; nothing durable cites the state branch. | modified | R | [copy of the suggestion] keep the split, but move coordination traffic to PR bodies, comments and issues, or to a separate bookkeeping repository; add the size check in … |
| REC-2 | One writer per file. | kept | R |  |
| REC-3 | One status command reads the whole state a role needs from git and prints it with sizes; a successor of any role starts from it alone. | kept | R |  |
| REC-4 | Record writes by the architecture session never cost a job a gate run or a completion. | kept | X |  |
| REC-5 | A remote act is recorded as done only from the tool call's result, never from its request. | kept | R |  |
| REC-6 | The address of any party is read from git at the moment of sending, and an address change is on that branch before it is announced. | kept | R |  |
| REC-7 | The record of a halted build is complete: status on a fresh session tells everything open, idle, merged, unmerged and owed, with no transcript needed. | kept | R |  |
| REC-8 | Reads are a matter of record: the start command prints the reading set with sizes and a worker audits transcripts after the fact for reads that … | modified | C | [copy of the suggestion] keep the audit, but judge reading by what a session can cite from the end of a document, and shrink documents so the question rarely arises. |
