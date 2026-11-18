- Do your typed words of 14 Nov end it? No. These are records and an alarm. Only the format check that held (c) in place is a check.
- Yes means: no per-job record of reading or cost, no cost alarm, no strictly formatted job record. No means: they stand as written, and the trial your note asked for is still owed. The cost alarm can be answered apart from the records.

[JOB-10, JOB-11, GAP-2, REC-9, TM-2]

**Proposal 6. Size limits and checks on what goes into the repository (4 lines)**

- What your documents say. (a) A cap on the size of a module's requirements file that makes the architecture session split or merge modules before any job starts, never a refusal at a job's start, with the number set from the real product. (b) A check that fails any commit adding an oversized file or a file under a path kept for temporary files, with a scheduled clean-up of finished temporary files. (c) A second required check, the "record" check, beside the module tests, before a change reaches the main branch or the tranche's branch.
- What the draft does instead. No cap; the 29 modules that hold requirements and no code are what the cap left behind. No oversized-file check, no record check, and nothing about the clean-up.
- Why the earlier session ended it. Built as a refusal, the cap was overridden 32 times out of 32 (from an earlier review, not re-measured). The record check gave 947 findings on its first run (the draft's figure).
- Do your typed words of 14 Nov end it? (b) and (c) are checks that can stop a merge, so "three tests and no others" arguably ends them. (a), as you modified it, is not a refusal and is not ended by those words. The purpose behind (a), that a module fits in one reading, is a line you kept that the draft no longer states.
- Yes means: none of the three exists. No means: they stand as written; (b) and (c) would then be named beside the three tests as things that can stop work.

[REQ-6, TM-6, REC-10, F-SET-6]

**Proposal 7. Rules about the process's own rules and instruction texts (6 lines)**

- What your documents say. (a) Every rule cites the measured failure or your decision that justified it, and a rule with neither is removed. (b) Every line of an instruction file must pass a three-part test (backed by a failure, not something the code already shows, or enforced by a tool) or be deleted; this includes the product's own short instruction file. (c) An audit judges whether a session read a document whole by what it can cite from the document's end, with shorter documents as the lasting remedy.
- What the draft does instead. It ends all three. In their place: every change to the process comes to you in the lane where the process is changed, whatever it cites; a size limit on each role's starting text is among the tests for the process's own tool, which you agreed; and the rule that a session acts only on what it has read in full stays as words.
- Why the earlier session ended it. Checks were added in 41% of Process3's merges both before and after 5 Nov, each with a citation. The line-by-line test was only advice, and the guide with no size limit grew from 8 KB to 134 KB. The reading audit was never built. (The draft's figures.)
- Do your typed words of 14 Nov end it? (c) is an audit, which is a review, so your rule against added reviews arguably ends it. (b) is a rule for writing with deletion "on review"; your words reach it only weakly. (a) is not ended: your words make you the judge of each process change, but do not say a rule need not cite a failure.
- Yes means: none of the three stands. No means: they stand as written, as rules for whoever writes the process's texts.

[TXT-6, F-SHAPE-4, TXT-2, F-REQ-9, TXT-1, REC-8]

---

## How to read the rest

Marks: (V) verified by me in this session against the source named; (A) an earlier report says so and I did not re-check; (J) my judgement. "The draft" is `process4/definition/process4_definition_v5.md` (v5). "The appendix" is `process4/definition/process4_definition_appendix_v5.md`. "The audit" is `process4/working/audit2_requirements.md`. Bob's typed words are in `process4/owner_words/bob_words_14nov_b.md` (words-b) and `bob_words_14nov_c.md` (words-c). The Ledger extraction is `process4/evidence/ledger_lines.md` (LL). The Foundations are `process4/evidence/foundations.md` (FD). Process3's decision record is `process4/evidence/DECISIONS.md`.

What each source is:

- words-b, words-c: Bob's own typed words.
- LL: his Ledger page as exported 5 Nov. The statements, suggestions and reasons were drafted by the session that built the page (LL:5). The decision (kept, modified, dropped) is recorded there as "the owner's decision with its timestamp" (LL:5). A note is his only where labelled "owner's own words"; the labels are the extracting analyst's comparison (LL:5).
- FD: his Foundations document, headed "Oct 31, 2026 · @Sparky2" (FD:3), written by a session and addressing him as "you" throughout (e.g. FD:7). It reports his words where it says "your word" with a date; those are a session's record of him.
- DECISIONS.md and section B of the draft ("the record of 13-14 Nov"): sessions' records of him.

## 1. Where the 288 come from, and the recount

### Where they come from

- **151 from the Ledger.** The page holds 159 statements; the stored choices are 119 keep, 32 modify, 8 drop (V: counted from `process4/working/ledger_store/decisions/*.json`; LL:3 says the same). The 151 are the 119 + 32. By section: PLT 10, ENF 5, REC 11, ARC 5, REQ 7, PLN 7, JOB 14, GAT 8, INT 6, SES 18, MSG 6, TXT 7, MNT 10, SHM 5, principles 20, GAP 12 (V: `process4_disposition.tsv`, source column).
- **137 from the Foundations and its lists.** By section: what the process is for 6; the human and the AI 17; the shape 6; the properties 5; the record 6; requirements, rules and text 13; roles and sessions 7; a job's life 10; the gate and review 4; platform, permissions and messages 16; how this was decided 2; setup 11; maintenance, certification, metrics 12; dropped and why 8; to measure 10; open tensions 4 (V: same file; sums to 137). The cutting of the Foundations into 137 rows and their ids (F-..., TM-..., OT-...) is the work of three earlier auditors, not Bob (V: `process4_disposition.md`:7, "The row list and ids are those of audits A, B and C").
- **What "kept", "modified" and "dropped" meant.** Kept: the statement stands as the page printed it. Modified: it stands as changed by the note stored with the decision. Dropped: it is out. (V for the page's structure, LL:5; J for the gloss.) The 8 dropped statements are not among the 151; they appear in the 288 only as the eight rows of the Foundations' table "Dropped, and why" (FD:250-263), which the appendix counts as kept as written because the draft says "The eight things you dropped in your ledger stay dropped" (v5:309) (V).
- **Who marked them.** The page records each choice as Bob's, with a time. 120 choices carry times on 31 Oct between 00:54 and 02:32 UTC; 39 carry times on 3 Nov between 16:58 and 20:00 UTC (V: script over LL "Decision" lines). 151 of the 159 choices are the same as the session's suggestion; 8 are marked "against the suggestion" (PLT-2, PLT-5, ARC-4, JOB-14, INT-4, SES-8, TXT-1, GAP-1) (V: script). The store has no author field (A: appendix:114), so that each choice was made by his hand cannot be shown from the store. Six notes were saved again on 14 Nov between 00:15 and 00:17 UTC (V: the six latest "at" times in the store; which six, A: appendix:114).
- **The notes.** 126 of the 159 lines have no note. Of the 33 notes, the extraction labels 5 "owner's own words", 4 "suggestion plus owner words", 14 "copy of the suggestion", 4 "near-copy of the suggestion", 6 "written in by the coordinator" (V: counted from LL; the labels themselves are A).
- **Overlap.** The 288 are not 288 different requirements. Many Foundations rows restate a Ledger line (TXT-2 and F-REQ-9; P6 and F-REQ-3; JOB-11 and GAP-2). The 33 lines of section 2 are about 18 distinct matters; the 53 of section 3 are about 45 (J).

### The recount

Counted by script from the 288 table rows of the appendix (rows 118 to 405 of the file), one code per row (V).

| Category | Appendix code | My count | Audit's count |
| --- | --- | --- | --- |
| Kept and stated | a | 112 | 112 |
| Kept in purpose, way changed | bT 17, bR 7, bC 15, bN 4 | 43 | 43 |
| Kept and stated nowhere | f 50, g 3 | 53 | 53 |
| Ended or cut | cT 18, cR 22, cC 33, cX 2 | 75 | 75 |
| Contradicted | e | 4 | 4 |
| Dropped without a word | d | 1 | 1 |
| Total | | 288 | 288 |

112 + 43 + 53 + 75 + 4 + 1 = 288. The "Now" column gives the same seven totals independently: kept as written 112, stated nowhere 53, way changed 43, ended 36, ended in part 39, contradicted 4, dropped 1 (V). By source document my counts equal the audit's table at audit:38-42 in every cell (V): for example ended by Claude 15 Ledger and 18 Foundations; stated nowhere (f) 34 and 16; contradicted 4 and 0.

**The 75 ended or cut, by who decided** (V: read from the "Now" column of each row):

| Decider | Lines | Which |
| --- | --- | --- |
| Bob's typed answer "three tests and no others" to proposal 13 of the fourth draft | 14 | PLT-9, F-PROP-3, JOB-12, GAT-4, GAT-8, F-PLAT-8, MNT-4, SHM-1, P12, F-MNT-1, F-STOP-2, OT-3; and with the record beside it GAT-2, F-GATE-3 |
| Bob's typed "agreed" to proposals 5 and 9 | 3 | F-REQ-12, SES-6 (proposal 5); SES-18 (proposal 9) |
| Bob's typed hint "ROOT", with the record | 1 | F-ROLES-1 |
| The session's record of 13-14 Nov | 22 | ARC-1, ARC-4, F-HUM-2, F-HUM-6, F-REQ-1, F-REQ-4, GAT-7, INT-2, INT-3, INT-4, INT-7, SES-15, F-JOB-10, F-PLAT-3, P4, P10, P11, GAP-10, F-SET-2, TM-9, OT-2, OT-4 |
| Claude, no proposal | 33 | section 2 |
| Filed under his decisions on a sentence the session wrote | 2 | JOB-13, TM-10 |

So of the 18 lines coded as ended by his typed words, 17 rest on an answer to a proposal and 1 on a hint; none rests on typed words outside those answers (V). His answer to proposal 13 was "O13: three tests and no others" (words-c:46), not "agreed"; that it is a yes to each of the thirteen checks is the draft's reading (A: audit finding 14a; V for the answer's wording).

**Disagreements, reported exactly.**

1. None in the totals or in any cell of the by-source table.
2. One difference inside the appendix itself. Its prose "By who decided" (appendix:70-71) lists Claude as a decider of an ending in 34 rows: 21 ended, 10 ended in part, and 3 "by Claude with another" (SES-15, F-SET-6, TM-8). Its code column gives 33. The difference is SES-15, coded under the record (cR) because its main ended clause rests on record line 17; the clause of its note that Claude ended is the measurement of the routing share. So "33" is 33 lines by main code; 34 lines have a clause ended by Claude without a proposal (V).
3. Outside the 75, the draft changes the way 15 kept lines are done by Claude's declared decision (bC) and 4 with no decider named (bN), also without proposals (V: codes; A: audit:250 names "33 endings and 15 changes of way"). Whether his rule of 14 Nov reaches those 19 is not something the audit or this report settles (J). The 19: REC-1, REC-6, PLN-5, F-SHAPE-3, F-REC-4, SES-2, SES-3, MSG-2, F-ROLES-7, F-PLAT-4, F-PLAT-12, F-PLAT-13, F-PLAT-14, F-SET-1, TM-7; REC-11, F-FOR-3, GAT-6, F-JOB-5.

## 2. The 33 lines Claude ended without a proposal, each quoted

Grouped as in the proposals above. "Whole" means the line is ended; "clause" names the part ended. Ledger lines give the page's decision and note; where a line was modified, the note is the operative text.

### Group 1. The in-force condition and the first health number

| Code | Exact text | Source | Ended |
| --- | --- | --- | --- |
| F-HOW-1 | "Nothing here is in force until it has run on a real tranche with the two health metrics measured." | FD:9 | Clause: the first metric "can no longer be produced" (v5:379) |
| SES-12 | "Two health metrics from day one: the false-done rate caught by independent re-verification, and cost per PR that survives a revert window." | LL:1007; kept 31 Oct, no note | Clause: the first metric |
| F-SHAPE-5 | "The process is pinned per tranche, fixed only by a recorded act, measured by its false-done rate and its cost per surviving pull request, and re-tested one component at a time at each model release." (the clause "measured by its false-done rate and its cost per surviving pull request") | FD:42 | Clause: the first metric |
