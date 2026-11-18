| F-REQ-11 | Each role's reading set is fixed and printed with sizes (SES-5). | MECHANISM | **MET DIFFERENTLY** (pinned texts per role; the daily report prints "bytes auto-loaded into a session"). A job's requirement reading is not sized. | (2) | — |
| F-REQ-12 | "Nothing is ever refused for size." Budgets are "fractions of the model's window in one table, never bytes in code; an overrun is measured and reported, never refused" (SES-6; property 10). | MECHANISM | **CONTRADICTED** by M1: "Everything a session loads automatically has a byte cap", held by "A test that is a required check in the process repository, with no bypass", and by N1, "Line-count test, required, no bypass". R18 is graded "Met" with no mention of the reversal. | (2) | Candidate for the owner to change the requirement, for the process's own texts and tool only. The one hard cap was the one restraint that held (causal_forensics, headline and driver 3), while the uncapped README grew 17 times (verify_numbers). The same record argues against refusing product work for size: the 70,000-byte requirements cap was cited in 47 job blocks and 64 commits and moved no bytes (product_side, 6b and 6d). |
| F-REQ-13 | A summary is an option BOB may take, never a requirement (SES-7). | MECHANISM | **MET**; nothing requires one. | — | — |

### Foundations sentences that only restate a Ledger line in my families (not counted)

| Foundations text | See row |
| --- | --- |
| Property 1, claims verifiable from git or GitHub | REC-5, PLT-10, F-SHAPE-3 |
| Property 4, no step depends on an act the classifier judges | PLT-2 |
| Property 5, no session starts its own successor | PLT-5 |
| Property 6, nothing holds a turn | ENF-3, ENF-2 |
| Property 7, every hard rule offers a blocked exit | ENF-7 |
| Property 9, git carries state | F-SHAPE-1 |
| Property 10, text is short, overrun never refused | F-REQ-12, REQ-6 |
| Property 11, every rule and check cites a failure or decision | F-HUM-13, REQ-7 |
| Record table: ledger, decision records, status, transient state, platform table | REC-9, REC-11, REC-3, REC-1, PLT-1 |
| "Three rules hold the record together"; record writes cost no gate run | REC-2, REC-5, REC-6, REC-4 |
| Size discipline | REC-10 |
| Requirements paragraph: order, file parts, interface, scale, marks, service changes, cap, text keys | ARC-1, REQ-1 to REQ-6, ARC-3 |
| Decisions paragraph | REQ-7, REC-11 |

---

## A. Counts by result

| Result | Ledger (45) | Foundations (53) | All (98) |
| --- | --- | --- | --- |
| MET | 11 | 20 | 31 |
| MET DIFFERENTLY | 12 | 15 | 27 |
| WEAKENED | 10 | 6 | 16 |
| CONTRADICTED | 7 | 8 | 15 |
| SILENT | 5 | 4 | 9 |

- Not met in some way: 40 of 98.
- Of the 15 contradictions, the proposal itself states 8 as deletions, ended lines or admitted conflicts: PLT-6, REC-9, REC-10 and REC-11 (in N7), F-HUM-1, F-HUM-7, F-HUM-10, F-HUM-12. The other 7 are graded met, graded stronger, or not shown as reversals: PLT-2, ARC-4 (R12 "Met"), PLN-5 (R7 "Stronger"), F-HUM-9, F-HUM-17 (R4 "Met"), F-REQ-8, F-REQ-12 (R18 "Met").
- Disposition of the 40: 32 "proposal must change" and 8 "candidate for the owner to change the requirement" (REC-8, REC-9, REC-10, ARC-4, F-HUM-12, F-HUM-17, F-SHAPE-5, F-REQ-12). Seven of the eight candidates concern a mechanism. The one purpose marked a candidate is F-HUM-12, where the evidence is the loop itself.

## B. CONTRADICTED and SILENT rows, ranked

Ranked by weight on the four central requirements and the owner's role.

| Rank | Row | Result | Process4 item at fault | Why it ranks here |
| --- | --- | --- | --- | --- |
| 1 | F-HUM-1, the division of work | CONTRADICTED | Verdict; condition 1; G1, N2, N4 | Reverses the role the owner stated. Breaks (1). The proposal's own correction is "unproven" and not carried into any recommendation. |
| 2 | F-HUM-7, no file edits, no commands | CONTRADICTED | G1, G2, G3, C2, C7, M1, M5 | (1) directly. 24 new acts in section D; 2 are purely settings changes. |
| 3 | F-HUM-10, runs with no one watching | CONTRADICTED | "Start smaller than this"; C3 fallback; G8 | (2) directly. The recommended start is attended; the preferred form rests on a behaviour measured at 0 of 3. |
| 4 | F-HUM-9, changes of mechanism are the AI's | CONTRADICTED | Conditions 1 and 4; N4, N5 | The owner's own correction of 4 Nov, reversed. (1) and (2): "A real process defect now waits for you". |
| 5 | PLN-5, pause and resume by the owner's word | CONTRADICTED | G9 | His most-used control becomes four acts, two outside GitHub; jobs in flight are not stopped. Graded "Stronger". |
| 6 | PLT-6, a scheduled task is never required | CONTRADICTED | C2, C4 | (2): one task is the only driver, and he creates it. |
| 7 | PLT-2, no dependence on judged housekeeping acts | CONTRADICTED | C12; N7 | (2) and (4): the bound leans on archiving; the trials that measured approved acts are deleted. |
| 8 | F-HUM-17, his chat word is written down for him | CONTRADICTED | M4, M5 | (1): he must write on GitHub or his word lapses. Evidence supports the change; the act is still new. |
| 9 | REC-11, decisions have a home | CONTRADICTED | N7, M2 | Role ("reports as done") and (3): with no handoff and no records, an ARCH decision has no stated place. |
| 10 | REQ-5, who decides and records a change to a provided service | SILENT | none; N7 nearby | (3) and the owner's time: the deciding half of interface change is unaddressed while the notifying half is deleted. |
| 11 | F-HUM-8, whose question is it | SILENT | none | (2) and his time: over-asking is detected afterwards, not prevented. |
| 12 | F-REQ-8, `CLAUDE.md` changes without his approval | CONTRADICTED | G2, M1 | (1): his 1 Nov word reversed. |
| 13 | F-REQ-2, a module file states what it provides and uses | SILENT | none | (3): nothing defines the interface whose change must notify users. |
| 14 | REQ-2, requirements at the interface, ambiguity fixed in the text | SILENT | none; C5 nearby | (3). |
| 15 | ARC-4, the owner's own note on when checks run | CONTRADICTED | G6; G4 | His own modification reversed and graded "Met". Evidence supports the change. |
| 16 | F-HUM-12, a workaround is not a fix | CONTRADICTED | Condition 4 | Admitted; strong evidence; candidate. |
| 17 | REC-9, the JSON ledger | CONTRADICTED | G7 | Admitted; his note invites the judgment; the measure he asked for is not reported. |
| 18 | F-REQ-12, nothing refused for size | CONTRADICTED | M1, N1 | Strong evidence for the process's texts; not flagged as a reversal. |
| 19 | ARC-5, machine-readable findings | SILENT | none | (2): how a job reads its red. |
| 20 | F-REQ-4, the mechanical pass | SILENT | none | (3). |
| 21 | REC-10, size check | CONTRADICTED | N7 | Purpose (no repository bloat) left with no holder. |
| 22 | F-FOR-3, lanes | SILENT | none | The owner's UX direction. |
| 23 | REQ-3, scale measurements | SILENT | none | The owner's performance standards. |
| 24 | ARC-3, text keys | SILENT | none | The owner's word of 30 Oct. |

### Central requirements: conflicts that reach my part only indirectly

These rest mainly on lines outside my families (GAT-3, Ledger P8 and P10, the platform section). They are listed so they are not lost between the two audits.

- **(3) Earlier modules' jobs before later ones.** Rec. P3: "A layer's jobs start together." The Foundations in my part say the same ("every ready module of the open layer at once"), so here the documents and the 13 Nov restatement differ, and the proposal follows the documents. Its case is a cost figure, "about four days". The shortfall table admits the conflict; rec. P3 is unchanged.
- **(3) Interface changes notify users.** N7 deletes "notice triage as a mechanism" and "Ledger lines that end" lists "provider notices as a route (GAT-3)". The shortfall table says to keep the notification; no recommendation does. In my part the supporting lines are also unaddressed: REQ-5, REC-11, F-REQ-2, PLN-3. The record shows both the cost and the worth: 2,707 notifications, 90% "not affected", and 241 "affected", some leading to real fixes (product_side, 6d and 9.3).
- **(3) One job per module.** C4 defines a job as "one module or item", and ARC-2's holder is gone.
- **(4) A bound the owner can change.** C12 holds 24 in "ARCH's pinned text", an owner-merged process file. The shortfall table proposes a repository variable; C12 is unchanged. Ready slots also wait up to an hour for a wake (F-PROP-8), so the bound is often not reached.

## C. Grades in "Against the Process3 requirements" that are too generous

| Row | Proposal's grade | Why it is too generous |
| --- | --- | --- |
| R2 | "Met, with the split" | The split is the change. Ledger P17 gives the AI "everything technical and detailed"; the owner's 4 Nov word sends only changes of purpose to him (F-HUM-1, F-HUM-9). A purpose altered in its central term is not met. |
| R3 | "Weakened ... Each is a click or a comment" | The acts include judging and merging process code, editing approvals and a budget number, keeping a setup script, commissioning sessions and an hour per retrospective. The proposal's own shortfall table says "None of those is a settings change". Against a requirement the owner calls non-negotiable this is not met. |
| R4 | "Met" | Process3 had BOB write the owner's chat word into the one place. M4 lets it lapse unless he writes it himself (F-HUM-17). The absorb-and-delete half of REQ-7 is not mentioned. The feasibility reviewer graded R4 weakened. |
| R6 | "Met in the preferred form; weakened in the fallback" | The preferred form depends on test 1, which Process3 measured at 0 of 3. The form actually recommended gives up overnight running. PLT-6 is ended. A stall emails the owner and "repairs nothing". |
| R7 | "Met differently ... Stronger" | PLN-5 is the owner's word, recorded once. G9 is four acts of his, two outside GitHub, and jobs in flight keep working. The feasibility reviewer graded the draft "Not met"; the fix adopted moved the act to the owner. |
| R11 | "Weakened" | Right, but it names only the missing test per mark. Also gone or unaddressed: the id tests (rec. P1), the interface rule (REQ-2), the four-part file (F-REQ-2), the test for the owner's service changes (REQ-5). |
| R12 | "Met" | G6 schedules a whole-product regression, which reverses the owner's own ARC-4 note. The ownership, format and coverage checks that note placed now run nowhere. |
| R13 | "Met, more strongly" | State is derived, but decisions (REC-11) and found work (PLN-3) have no durable home, and each ARCH starts with nothing but files and pull requests. |
| R15 | "Met, restated" | Restating a purpose so that it is met is the move the owner's 4 Nov word reserves to him. As restated it still is not met: "Up to an hour can pass". |
| R17 | "Met" | Single ownership has no holder (ARC-2). The "how" cites "A layer's jobs start together", which the proposal's own shortfall table lists as a conflict with (3). |
| R18 | "Met" | Met by a required test with no bypass, which is a refusal for size; the Foundations say "Nothing is ever refused for size" (F-REQ-12). The evidence favours the change, but it is a reversal and should be shown as one. |
| R21 | "Met by structure" | The structure is "Budgets and your merge". Half of it is the act that breaks (1). |
| R23 | "Met if the tests run" | Seven tests cover seven assumptions. The rest stand on "documentation read on 13 Nov 2026"; the platform table is gone (PLT-1) and the trials of approved acts are deleted (PLT-2). |

Two wider points about that section.

- **Its opening count, "meets 19 ... and weakens 6", is a count of 25 purposes drawn by one worker.** Of the 45 kept or modified lines in my six families, 28 are not a cited source of any of the 25 purposes (canon_analysis, section 5), so the table never graded them. This audit finds 14 of those 28 not met: PLT-6, PLT-9, REC-8, REC-9, REC-10, REC-11, ARC-3, ARC-5, REQ-1, REQ-3, REQ-4, REQ-5, PLN-2, PLN-3. Eight of the 14 are contradicted or silent. Four of them surface elsewhere in the proposal as deletions (PLT-6, REC-9, REC-10, REC-11); the other ten appear nowhere. From the Foundations, F-HUM-8 and F-HUM-9 also fall under none of the 25.
- **"Ledger lines that end" under-reports.** From my part it names REC-1, REC-9 and PLT-6. These also end or lose their holder without being named there: REC-10 and REC-11 (only in N7), REC-6, the REC-8 audit, PLN-5's mechanism, ARC-2's check, PLT-9's check, PLT-1's table, ARC-4's timing.
