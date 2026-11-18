# Appendix, second draft: recount and findings

14 Nov 2026. Worker's notes for the coordinator. Written with `/home/user/handoff/process4_definition_appendix_v2.md`; nothing else was changed.

Read for this: the first-draft main text and appendix, `process4_disposition.md` and `.tsv` (all 288 rows with notes), the Ledger texts of the lines in question, `live_docs.md`, `k_evidence.md`, the assessment document's decision passages, and the six notes in the saved copy of the Ledger store.

"Main" below means `process4_definition_main.md`, first draft, as the brief named it. Section K points are numbered as that draft numbers them (K1 to K7), and v2 does the same.

**One thing to settle before v2 ships.** `process4_definition_v2.md` was being edited while I worked (file time 01:28 UTC). As I saw it, its section K lists the seven points as closed points 1 to 8, because it splits K1 in two, and it gives the fourteen technical points as decided by Claude. v2 of the appendix follows the first draft's numbering, as briefed, and says so in its "Place" paragraph with the mapping: K1 there is points 1 and 2 of the second draft, and K2 to K7 are its points 3 to 8. If the appendix should carry the second draft's numbers, the rows to renumber are those listed in section 4 below. My brief did not list the technical points as decided, so v2 says only that they are "Claude's".

## 1. The recount

Counted by script from the rows of v2. Each row has one "Now" value.

| Category | "Now" values counted in it | Lines |
| --- | --- | --- |
| A. Kept as written | "Kept" 184; "Kept by Claude's decision, 14 Nov" 2 | 186 |
| B. Kept with the way of doing it changed | "Purpose kept; how it is done: see place" | 46 |
| C. Ended by Bob's decisions | "Ended by Bob's decision" | 15 |
| D. Ended by Claude's decision | "Ended by Claude's decision, 14 Nov" | 11 |
| E. Ended in part | "Kept; one clause ended or changed" 23; "Kept by Claude's decision, 14 Nov; one clause ended" 1; "Ended in part by Claude's decision, 14 Nov" 3 | 27 |
| F. Open, Bob's to decide | "Open: Bob's to decide" | 3 |
| Total | 186 + 46 + 15 + 11 + 27 + 3 | 288 |

**C, ended by Bob's decisions (15):** ARC-4, GAT-7, P11 (the full regression and whole-product checks); P10, INT-4, OT-2 (layers); JOB-13, TM-10 (deliberate-fault sampling); INT-2, INT-7 (review); F-PLAT-3 (default of 24); F-PROP-3, JOB-12, GAT-8, GAT-4 (the three checks).

**D, ended by Claude's decision (11):** F-SET-3, REQ-6, TM-6, JOB-10, REC-10, REC-9, TM-2, TXT-6, TXT-2, F-REQ-9, REC-8.

**E, ended in part (27):**

- By Claude's decision (4): JOB-7 (receipt half), SES-6 and F-REQ-12 (for the process's own texts), F-SET-8b (kept; its confirming check gone).
- The first draft's 23 rows with one clause ended or changed, all unchanged in status: ARC-1, PLN-3, F-HUM-2, F-HUM-6, F-HUM-10, F-HUM-12, F-REQ-1, F-REQ-4, GAT-2, INT-3, SES-15, SES-18, F-ROLES-1, F-ROLES-5, F-JOB-6, F-JOB-10, F-PLAT-4, P4, GAP-1, GAP-10, F-SET-2, TM-9, OT-1. In 21 the clause is ended or changed by one of Bob's decisions. In F-ROLES-5 and OT-1 nothing is ended: one clause (the daily standby) is technical point 4, which is Claude's. I left them in this group because no decision moves them.

**F, open (3):** MNT-1, MSG-5, MNT-5.

**Judgment calls that move a count by one.** Each is flagged in v2.

1. F-SET-8b is counted in E, not A. Main item I 12 says "keep the route. Let the check go with item 2", and the line's second half is that check. If it is counted as kept as written: A 187, E 26.
2. Open is MNT-1, MSG-5 and MNT-5. MNT-1 is who builds and merges changes to the process. MSG-5 is the answer to a flaw report coming back "by main of the process repository". MNT-5 is the recorded act that moves the version a tranche uses; if sessions lose write access, that act may be Bob's too (enforcement_levers, lever 2). MNT-7, JOB-4, P3 and F-PROP-12 stand under either answer and only wait on it; they keep their status and carry a flag. If MNT-5 is counted as way-changed instead: B 47, F 2.
3. SES-12 and F-MNT-4 moved from A to B, beside F-SHAPE-5, F-MNT-7 and F-MNT-5, which were B already. I read K4 as keeping the purpose (the process is judged by something measured) and replacing the two numbers with the walk result. F-MNT-4 also counts by two checks Bob ended. If the lines that define the numbers are instead counted as ended by Claude's decision (SES-12, F-MNT-4, F-MNT-5): B 43, D 14.
4. F-ROLES-4 moved from open to B. No decision names it. Main has replacing ROOT at technical point 4, not among Bob's points. If it is kept open: B 45, F 4.
5. ARC-2 is in B (rule kept, the way of holding it changed). Its text has no clause about a check, so it could be counted A: A 187, B 45.

## 2. Against the first draft's figures

| First draft | Now | Difference, line by line |
| --- | --- | --- |
| 198 kept as written by the audit | 176 of those 198 are kept as written | 20 had a clause ended or changed by Bob's decisions already in the first draft (ARC-1, PLN-3, F-HUM-2, F-HUM-6, F-HUM-10, F-REQ-1, GAT-2, INT-3, SES-15, SES-18, F-ROLES-1, F-ROLES-5, F-JOB-6, F-JOB-10, F-PLAT-4, P4, GAP-1, GAP-10, F-SET-2, TM-9), so "198 as written" was 178 then. 2 more now: SES-12 and F-MNT-4 (K4). 198 - 20 - 2 = 176 |
| 208 standing (185 kept + 23 with a clause changed) | 210 on the same footing (184 + 2 + 23 + 1) | - 2: SES-12, F-MNT-4 to B. + 1: F-SET-4 from open (K2, a fact). + 3: F-MNT-1, F-GATE-4, F-SET-8b kept from section I by Claude's decision. 208 - 2 + 1 + 3 = 210. Counting the 3 lines ended only in part as well gives 213 |
| 45 keeping their purpose | 46 | + ARC-2 and F-ROLES-4 from open. + SES-12 and F-MNT-4 from kept. - MSG-5, MNT-1 and MNT-5 to open. 45 + 4 - 3 = 46 |
| 15 ended (main, section H) | 15 by Bob, the same 15 lines; 11 more by Claude; 3 ended in part by Claude | The first draft's appendix table showed 11 because the four lines of the three checks were still listed as open. The 11 and 3 are section I, items 1 to 10 |
| 17 lines in section I | 0 waiting | 11 ended, 3 ended in part, 3 kept (one of them with its check clause gone). 11 + 3 + 3 = 17 |
| 7 open points for the owner (appendix) | 3 open, all new | F-PROP-3, JOB-12, GAT-4, GAT-8 ended by Bob. ARC-2 to B (K1). F-SET-4 kept (K2). F-ROLES-4 to B (technical point 4). MNT-1, MSG-5 and MNT-5 newly open on the write-access question |

Check by the first draft's own five rows: 208 + 45 + 11 + 17 + 7 = 288. Now: 210 + 46 + 15 + (11 + 3) + 3 = 288.

## 3. Section I: lines each item covers

| Item | Lines | In five words | Now |
| --- | --- | --- | --- |
| 1 | JOB-7 | Job's written receipt of commands | Ended in part (receipt half), Claude |
| 2 | F-SET-3 | Set-up check before every start | Ended, Claude |
| 3 | REQ-6, TM-6 | Size cap on requirements file | Ended, Claude |
| 4 | JOB-10 | Reading list and cost recorded | Ended, Claude |
| 5 | REC-10 | Oversized and temporary file check | Ended, Claude |
| 6 | REC-9, TM-2 | Job record as strict data | Ended, Claude |
| 7 | TXT-6 | Every rule cites a failure | Ended, Claude |
| 8 | TXT-2, F-REQ-9 | Line-by-line test of instructions | Ended, Claude |
| 9 | SES-6, F-REQ-12 | Nothing ever refused for size | Ended in part (process's own texts), Claude |
| 10 | REC-8 | Audit of reading to end | Ended, Claude |
| 11 | F-MNT-1 | Start-up check on Bob's approvals | Kept, Claude |
| 12 | F-SET-8b | Deploy tokens in cloud environment | Kept, Claude; confirming check gone |
| 13 | F-GATE-4 | Module tests in two parts | Kept, Claude |

1 + 1 + 2 + 1 + 1 + 2 + 1 + 2 + 2 + 1 + 1 + 1 + 1 = 17. Main's "thirteen items cover seventeen lines" is right.

Other lines these items touch without being counted in the 17. Their status is unchanged; their flags say what moved: F-SHAPE-3 (item 1), F-SET-1 (2), JOB-11, GAP-2, F-PLAT-14, F-MNT-5, SES-9 (4), P23, SHM-1, F-SET-6 (5), F-HUM-13, F-SHAPE-4, GAP-3 (7), TXT-4, TXT-1 (8), F-PLAT-8, GAP-6 (11).

## 4. Section K: lines each decision covers

| Point (second draft's number) | Lines | In five words | What v2 records |
| --- | --- | --- | --- |
| K1, first check (1) | ARC-2 (and REQ-4, flag only) | Own-files check at merge | Check ended by Claude; the rule stays in the job's instructions. ARC-2 from open to B |
| K1, second (2) | F-STOP-2, F-GATE-3 | Install and upgrade release tests | Ended as separate tests by Claude. Both stay B |
| K2 (3) | F-SET-4, GAP-8, SHM-3, F-HUM-7 | Claude-side set-up acts, Bob's | A fact, not a decision. F-SET-4 from open to kept |
| K3 (4) | F-HUM-6, INT-3, GAP-10 | Bob may approve a merge | Kept by Claude; no mechanism; his word to the coordinator |
| K4 (5) | F-SHAPE-5, F-MNT-7, SES-12, F-MNT-4, F-MNT-5 | Two health numbers as judge | Retired as the judge by Claude. SES-12 and F-MNT-4 from kept to B |
| K5 (6) | P22, F-REL-1, F-REL-2, F-SET-8a, F-STOP-3 | External walk after each tranche | Runs by rule, by Claude; status of the five unchanged |
| K6 (7) | PLN-7 | Eight slots for each product | Claude; stays kept |
| K7 (8) | F-JOB-1 | Bob's word reorders work | Kept by Claude; stays B |
| Open | MNT-1, MSG-5, MNT-5 (flags on MNT-7, JOB-4, P3, F-PROP-12) | Write access to process repository | Open, Bob's |

## 5. ARC-3 and JOB-8

Both rows are byte for byte as the first draft had them. They are flagged in v2's opening notes, not in their rows.

The claim that they end is in the assessment document (`assessment_doc.txt`, line 26): "Kept Ledger lines this decision ends: ... artifact regeneration (GAT-4, JOB-8), tests asserting on text keys as a separate check (ARC-3) ...". That document was typed by one session (live_docs, section 0). The sentence is the session's reading of the 13 Nov decision, not Bob's words.

**ARC-3.** Ledger text: "A test asserts on a text's key, never on its words; every user-facing sentence lives once in the word table." Source: Bob's word of 30 Oct. It asks two things: how tests are written (they check which key was used), and where text lives (once, in the word table). It is not a test and names no check. A check for it was listed and never built (ledger_map: "Not in the tool's gate", Gap; canon_analysis A5). The assessment document itself says only that it ends "as a separate check". Keeping the line as a rule is consistent with "exactly three tests, and no others, ever": it governs what test one's module tests look like. Building the separate check would not be consistent. Nothing needs to end, because nothing was built.

**JOB-8.** Ledger text: "A job never commits a generated artifact." The Ledger page explains it: "The gate regenerates what it needs and the layer close commits them once." It is a rule for jobs, not a test. Three points:

- A check for it was built on 3 Nov ("no committed generated artifacts", one of four checks added to the test run; change_sample PR 39). The ledger map of the same day still called it a gap. Under "exactly three tests" that check is in the same position as the three Bob ended. Nobody has ruled on it by name. Section H does not list it.
- The rule leaned on two things that Bob's decisions end: the rebuild-and-compare check (GAT-4) and the layer close that committed built files (INT-4, OT-2). With both gone, nothing says who builds and commits those files. Audit B already noted this ("it must say who commits generated files").
- In Process3 built files were in fact committed, and the architecture session refreshed them (change_sample PRs 95, 209, 251; DECISIONS.md PD-9).

So keeping JOB-8 as a rule is consistent with the three tests, and keeping its check is not. The line cannot stand as written without a new answer to who builds and commits built files. That answer is a technical point missing from section K.

## 6. Inconsistencies between the appendix rows and main sections G, H, I, K

