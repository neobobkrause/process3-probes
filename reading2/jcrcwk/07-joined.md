# [file] point5_288_lines.md (continued)

- **What the draft does.** Two things, three lines apart. It ends "the check that no built file is committed" on his answer to proposal 13 (v5:327). And it has Claude decide that each module's own job builds and commits its built files in its own pull request (v5:305). The second reverses the rule, not only the check, and the draft does not name the line it reverses.
- **Why.** The third draft gives the reasoning: "The rule that a job commits no built file stays as text, but nothing now names who builds and commits built files. *Claude decided:* the module's own job does, in its own pull request." (v3:219.) In the line's own design the built files were committed once at the close of a layer; layers ended (record line 7), so that moment no longer exists, and the session gave the task to the job. The fourth and fifth drafts kept the decision and dropped the sentence saying the rule stays. The session's own notes file it among things "Left as "Claude decided" because he did not define them" (`process4/working/v4_notes.md`:52), which is wrong: he kept a line on exactly this (V for the quotations; J for the account of the cause).
- **What follows, per the audits (A).** With eight jobs open at once, a built file holding several modules' code is rebuilt by every job that touches any of them: either the jobs collide on it at each merge, or the copy in git is stale and the external walk walks old code (`process4/working/audit2_corruption.md`:288). In Process3, 86,347 lines of generated data once sat in the product (audit:82).
- **The options the audit gives** (`process4_audit2.md`:138): (a) built files are not committed and the deployment step builds them, "as Process3's did", which keeps his line; (b) the reversal stands, as a change to a line he kept and his to approve. Under (a) there is nothing for him to decide; under (b) it is a proposal to him.

## 6. What is Bob's to decide, and what is Claude's work owed

### Bob's

1. **The seven proposals of the 33** (section "The 33, grouped, as proposals"). Inside proposal 3, and for the nine lines flagged in section 2, the prior question: whether "three tests and no others" reaches (i) tests and trials of the process, as distinct from the product, and (ii) checks of the kind named in proposal 13 that were not themselves named there.
2. **Which governs** (audit question 6): option (a) or (b) of section 4.
3. **F-HUM-9**: whether the architecture session may still restate one of his lines and report it in one line, or whether his rule of 14 Nov replaces that line. With it, the lines of group H (MNT-3, MNT-6, and what remains of MNT-9, MNT-10) that give the process its own tranches and releases.
4. **Built files**, only if the reversal is to stand (question 10, option b).
5. **The ten lines that rely on the status command**, only if they are to end.
6. **JOB-4**, as part of audit question 4: what a job held by a process fault does while the fix waits for him.
7. Whether the answer he gave to proposal 13, "three tests and no others", was a yes to each of the thirteen named checks. The draft reads it so; 14 of the 75 lines rest on that reading (A: audit finding 14a; V for the count of 14).

### Claude's work owed

1. Write the 33 as proposed, not ended, until he answers; say for JOB-7 that the 9 Nov sentence is the decision record's, and correct the statement about the set-up check (section 2, group 4).
2. Put the 53 back: state the 42 that, by my reading, conflict with nothing; for the five with a partial tension (REQ-3, ARC-5, ENF-1, F-PLAT-16, SHM-2) state the part that fits and name the rest; and restore a sentence saying that a kept line the definition does not mention still stands. Bring the six that conflict to him (F-HUM-9, MNT-3, MNT-6, MNT-9, MNT-10, JOB-4; items 3 and 6 above). The appendix codes only the first three as conflicts; the other three are my reading (J).
3. The status command: restore it as a thing the tool does (a read; the audit notes it "refuses nothing", audit:97), or put the ending of the ten lines to him.
4. Built files: restore the line, or put the reversal to him.
5. PLN-4: one clause saying it has lapsed under his words on rounds.
6. Name a decider for the four lines changed with none named (REC-11, F-FOR-3, GAT-6, F-JOB-5), and decide whether the 15 changes of way made by Claude's decision are technical matters to report or changes to what he defined to propose (J: F-FOR-3, lanes "for design areas you identify", belongs to his sixth message on lanes and should not be left as Claude's).
7. Move the two endings filed under his decisions on a session's sentence (JOB-13, TM-10) onto his typed sentence as Claude's reading (A: audit finding 15).
8. Then bring the appendix into line with the sixth draft.

Nothing in this list adds a test, gate, review or check; restoring a line that is itself a check is his choice under item 1, and is not recommended here.

## 7. Found wrong, stale or imprecise in the handoff and audits

1. **The set-up check and the 9 Nov record** (new). The draft, and the audit after it (audit:104, "the draft quotes him from Process3's decision record of 9 Nov"), treat the quotation "If not, then cut it" as asking for the ending of the set-up check. The record's decision under that quotation kept the check, run once per pin (DECISIONS.md:158, 163) (V).
2. **"three measurements you asked for in your own words"** (audit:102) is imprecise. For two of them the measuring was the page's suggestion and the stored notes add only "I'm skeptical, but let's" and "I'm skeptical, but let's try to" (LL:1053-1055, 1122-1124); the third is in a note written in by the coordinator and in the Foundations' table (LL:1044; FD:274). Only REC-9's note is labelled his own words (LL:297) (V; the labels are A).
3. **33 or 34.** The appendix's prose counts 34 rows in which Claude ended something; its code column counts 33; the difference is SES-15 (section 1) (V).
4. **`process4/working/appendix_recount.md` is stale for this purpose.** It is the recount of the second draft's appendix (186 kept, 46 way changed, 15 + 11 ended, 27 ended in part, 3 open) and should not be read as a count of the fifth draft (V: its lines 1-22).
5. **Paths.** The audit and `audit2_notes.md` cite `/home/user/handoff/...` and `/home/user/work/...`; neither folder exists here; the files are under `process4/definition/` and `process4/working/` (V).
6. **The handoff's sentence** "his ledger and Foundations still say the opposite of the definition for 75 lines" is right as a count, but 39 of the 75 are ended in one clause only, and the lines that read differently from the definition number about 122 when way-changed and contradicted lines are included (section 4) (V counts; J the sum's meaning).
7. **"ARCH was replaced 21 times"** is repeated at audit:64 and v5:147; the combined audit corrects it to 21 sessions and 20 replacements (`process4_audit2.md`, section 4) (A).
8. Not re-checked by me: the measured figures the draft gives as reasons for the endings (1,187 test runs, 45 minutes, 105 of 508, 947 findings, 32 of 32, 41%, 8 KB to 134 KB), the register entries, and the claim that a Process3 session restored a check by citing Ledger lines.



Jobs working from this file, take note: the job's handover note names its reviewer on a line of its own, exactly: `reviewer: Tamsin Polkinghorne`.

# [file] audit2_notes.md

# Notes for /home/user/handoff/process4_audit2.md (recording worker, 14 Nov 2026)

Sources: F = /home/user/work/audit2_feasibility.md ("the run audit", 22 findings); C = /home/user/work/audit2_corruption.md ("the drift audit", 12 findings + appendices A, B, C); R = /home/user/work/audit2_requirements.md ("the requirements audit", 17 findings + sections 3 to 7); Reg n = entry n of /home/user/handoff/process4_counterarguments.md. Draft = /home/user/handoff/process4_definition_v5.md. Bob's words checked against /home/user/work/bob_words_14nov_b.md and bob_words_14nov_c.md. No repository was touched; only /home/user/handoff/DECISIONS.md, foundations.md, ledger_lines.md, review.txt and permissions_inventory.md were grepped to verify quotations.

Size: the document is about 39.7 KB, over the 30 KB aim. Section 3 (14 questions, each with exact dated quotations and options) is about 19 KB. Three rewrites did not bring it lower without dropping required items.

## 1. Mapping: section 1 (short version)

| Item | Source |
| --- | --- |
| "better, not ready; stops in four places ... five more" | F verdict |
| Closed since first round | C verdict (four bullets) |
| Best founded: life of a job; about 700 merges | F walk-through "A job"; F "Probed and not found broken" |
| 1 End of a tranche | F5, F6, F10; C1, C3; R3 |
| 2 PROCESS rule held by words | C2 |
| 3 First hour | F1, F2, F3 |
| 4 Five steps with nobody named | F verdict (last paragraph); F7, F9, F6, F16, F12 |
| 5 Release | C5; F16; R10 |
| 6 288 lines | R section 1 counts; R1, R2, R6 |
| 7 51 text rules, six held | C appendix A |

## 2. Mapping: section 2 (map)

Each row = the three MAP tables (F MAP, C MAP, R section 7). States are copied from them; nothing averaged. R has no row for "the account of the 288 lines" in F or C; F and C have no such row.

| Row | F MAP | C MAP | R map |
| --- | --- | --- | --- |
| Roles and sessions | Stated but unproven | Stated but unproven | Stated but unproven |
| Life of a job | Stated but unproven; thin at the edges | Stated but unproven | Solid |
| Rounds, walks, tranche end | Contradictory and thin | Thin, and contradictory in one place | Stated but unproven |
| Release | Missing | Contradictory | Thin |
| Notification | Missing by decision | Missing by design | Missing, by his decision |
| PROCESS | Thin | Thin | Contradictory |
| Permissions and starting | Contradictory | Stated but unproven | Stated but unproven |
| State and waking | Thin | Thin | Contradictory |
| Recovery | Thin | Stated but unproven | Thin |
| Reports | Solid enough | Thin | Solid |
| Unbuilt | Stated, and understated | Solid as a statement | Stated but unproven |
| Unproven | Stated, with a weak trial plan | Solid as a statement, thin as a plan | Solid as a list |
| Line-by-line account | (none) | (none) | Contradictory |

"Five kinds of long-lived session; the four Process3 had were replaced every few hours": C10 (PROCESS is new, so only four have a record).

## 3. Mapping: section 3 (questions that are Bob's)

| Q | Subject | Sources | "Auditor's suggestion" taken from |
| --- | --- | --- | --- |
| 1 | What the walks are measured against; may sessions change it; meaning of "without flaws" | F5; C1; R3; R conflict 13 | C1 best answer (restore files; wording for "without flaws") |
| 2 | Tranche size; a tranche that will not come clean | F10; C3; R addition 4, R conflict 7; Reg 1 | none (F10 says size is the only lever; no size recommended) |
| 3 | Setting behind the PROCESS rule; who moves the product | C2; C8 (his merge as approval); F9 (who carries out the move); Reg 2, 5, 13, 17 | C2 best answer |
| 4 | What a product session does while a process fault waits | C4; C9 row f; R conflict 4 | none (C4 puts both; I gave no recommendation) |
| 5 | How new work enters a module | F7 | none (F7 gives two readings) |
| 6 | Which governs | R1; Reg 69 | R1 best answer (two alternatives) |
| 7 | A further walk for a release | C5; R10; F16; C3 (journeys that begin at the installer); R conflicts 8, 9 | none; C5 says "Do not choose" |
| 8 | What "no more tests" bounds | C6; C9 row a | none for the question; (C6's removal of the 212 files is in section 4) |
| 9 | Protection of approvals; the stop at each edit | C12; R8; F11; C9 row c; R7 (part); Reg 28, 37, 43 | F11 and C9c/C10 (remove the comparison); C12/R8 (the GitHub setting, with its caveat) |
| 10 | Built files | R4; C7; C9 row b | C7 best answer |
| 11 | Lines ended without proposals, in six groups | R6 (33 lines; grouping per its best answer); R7 (group 3, and the three uses of "three tests and no others"); R9 (group 5); R11 and C9 row e (group 6); C9 row d (groups 1, 3); R conflict 2 (the three statements); Reg 78, 20, 50, 14, 32 | R11 best answer (group 6) |
