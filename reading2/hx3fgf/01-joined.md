# [file] audit_A.md (continued)


### "Requirements, rules and text"

| id | Requirement | Kind | Process4 result | Central | If not met |
| --- | --- | --- | --- | --- | --- |
| F-REQ-1 | The owner decides only the layers and modules that carry product capability; the rest is BOB's. | PURPOSE | **MET** (rec. P4: map and round plan "are ARCH's files, not guarded"). | (3), role | — |
| F-REQ-2 | Each module's file states the services it provides, the services it uses by module, its invariants and the product requirements it satisfies; it may suggest but never require an implementation; it is concise because it is read whole (Ledger P5). | PURPOSE (this is what a module's interface is) | **SILENT.** The shortfall table's correction for (3) derives users "from the module map"; nothing says what counts as the interface that changed. | (3) | Proposal must change: state that the provided-services part stays and is what defines an interface change. |
| F-REQ-3 | A module fits in one reading: one session can read in full its code, its requirements and those of the services it uses (Ledger P6). | PURPOSE | **MET DIFFERENTLY** (rec. P4: split at planning time). No measure is named. | (3) | — |
| F-REQ-4 | A change needing no judgment across many modules is one mechanical pass by a worker while no job runs, with one full test run in CI; where judgment is needed, the module gets its own job (Ledger P7). | MECHANISM | **SILENT.** | (3) | Proposal must change: say how a cross-module mechanical change is made, since central (3) gives each module to a single job. |
| F-REQ-5 | One rulebook per role, at most ten rules on one screen, rewritten in place and never appended; when the owner raises a problem a rule is rewritten and no ruling is added (TXT-3). | MECHANISM | **MET DIFFERENTLY** (M1, M2; the working agreement "replaces the rulebooks"; N4 changes are "net zero or smaller"). The ten-rule cap held all week under Process3 (verify_numbers). | (2) | — |
| F-REQ-6 | Each role's starting prompt names its own text in the pinned process, so a role loads only its rules (TXT-5). | MECHANISM | **MET** (C2, C5). | (2) | — |
| F-REQ-7 | The principles are trimmed so each role loads only the few that govern its stage (TXT-4). | MECHANISM | **MET DIFFERENTLY** (M2: one charter page). | — | — |
| F-REQ-8 | The product's `CLAUDE.md` is under thirty lines, written by BOB line by line. "It changes without your approval" (owner's word, 1 Nov). | PURPOSE (the owner's own word about his time) | **CONTRADICTED** by G2, which lists `CLAUDE.md` among the paths where "A ruleset ... requires your review". M1 changes the cap to 4,096 bytes, with evidence: the file ended at 22 lines and 8,664 bytes. | (1) | Proposal must change, or put the case to him. The file's growth was his own 16 approvals patches (product_side, 6a), so nothing shows BOB-written lines there went wrong. His approvals text must also now fit in 4,096 bytes. |
| F-REQ-9 | Every line in any instruction file is failure-backed, non-inferable from the code, or tool-enforced; lines are deleted on review (TXT-2). | MECHANISM | **MET DIFFERENTLY** (M1 byte budget; M3; N4). The per-line test ends; the holder is "Your merge". | (1) | See F-HUM-1. |
| F-REQ-10 | Every text names its audience and speaks plainly (TXT-7). | PURPOSE | **MET** (M3; R25). | role | — |
| F-REQ-11 | Each role's reading set is fixed and printed with sizes (SES-5). | MECHANISM | **MET DIFFERENTLY** (pinned texts per role; the daily report prints "bytes auto-loaded into a session"). A job's requirement reading is not sized. | (2) | — |
| F-REQ-12 | "Nothing is ever refused for size." Budgets are "fractions of the model's window in one table, never bytes in code; an overrun is measured and reported, never refused" (SES-6; property 10). | MECHANISM | **CONTRADICTED** by M1: "Everything a session loads automatically has a byte cap", held by "A test that is a required check in the process repository, with no bypass", and by N1, "Line-count test, required, no bypass". R18 is graded "Met" with no mention of the reversal. | (2) | Candidate for the owner to change the requirement, for the process's own texts and tool only. The one hard cap was the one restraint that held (causal_forensics, headline and driver 3), while the uncapped README grew 17 times (verify_numbers). The same record argues against refusing product work for size: the 70,000-byte requirements cap was cited in 47 job blocks and 64 commits and moved no bytes (product_side, 6b and 6d). |
| F-REQ-13 | A summary is an option BOB may take, never a requirement (SES-7). | MECHANISM | **MET**; nothing requires one. | — | — |


Rule for jobs: every file the job writes begins with this exact first line: `# ref Q7L-3440`.

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

## D. New requirements and acts the proposal places on the owner

Exhaustive for the whole proposal, since "The human and the AI" is in my part. Kind: **S** is a change to a GitHub or Cloudflare setting about permissions or rules. **O** is anything else. "Admitted" means the proposal's shortfall table or its R3 row names it.

### Standing acts, every run or recurring

| # | Act | Source | How often | Kind | In the documents? |
| --- | --- | --- | --- | --- | --- |
| D1 | Judge and merge every process change, from a fork | G1, N2, N4; condition 1 | Up to three per retrospective; any mid-run fix; "Your own repairs to the gate ... are expected in a first run" | O | No. Admitted. |
| D2 | Review every pull request that touches his paths in the product: workflows, `.claude/**`, `CLAUDE.md`, `CODEOWNERS`, the pin, the walker's step definitions, the reviewer's file | G2, F2, C10 | Each pin move; each change to walk steps (the internal walk went from 238 to 357 steps in one round under Process3: product_side 9.2); each settings or workflow change | O | No. Not among the "five standing acts". |
| D3 | Make his own edits to those paths and merge them by bypass | G2: "so you can merge your own edits" | As needed; he patched `CLAUDE.md` 16 times in nine days under Process3 | O, file edits | Only the approvals text was his before. |
| D4 | Stop and resume: lock or unlock the integration branch, and switch the hourly task off or on | G9 | His "most-used control" (PLN-5) | S for the lock, O for the task | No; the documents take his word. Partly admitted (R3). |
| D5 | Answer each question in the pinned issue in his own words; write down on GitHub any chat remark he wants kept | M5, M4 | As questions arise | O | No; BOB wrote his word down. Admitted. |
| D6 | Read the daily report | Division table; Lever 6 | Daily | O, attention | No; the documents ask for a tranche report. |
| D7 | Receive the watchdog's failure email and act on it; the proposal does not say how | G8: "It repairs nothing" | Each stall of "a set number of hours" | O | No. |
| D8 | Retrospective: commission a session, give "perhaps an hour", choose among "change nothing" and up to three priced changes, decide keep or repair for each misfired check | N4, N5; "What it costs you" | Each run boundary | O | No. |
| D9 | Switch GitHub's interaction limit on the process repository on for a run and off after it | G1 | Each run | S | No. |
| D10 | Change a budget number before merging anything over budget | M1, N1: "even your merge needs the budget number changed first" | When a budget is exceeded | O, file edit | No. |
| D11 | Change the job bound, which sits in ARCH's pinned text | C12 | When he wants a different bound | O | No. Admitted; the proposed fix, a repository variable, would be S. |
| D12 | In the fallback form, replace ARCH and its task | C3 | Each layer close; Process3 closed 13 layers in six days (product_side, section 5) | O | No. Admitted. |
| D13 | In the recommended small start, start the ARCH session himself and "look in once or twice a day" | "Start smaller than this", item 4 | Daily through the trial | O | No. Admitted. |
| D14 | Approve a public release | G10, G11 | Each public release | S-like | **Yes** (GAP-7). Not new. |

### One-time acts, per product or before run 1

| # | Act | Source | Kind | In the documents? |
| --- | --- | --- | --- | --- |
| D15 | Create the hourly scheduled task and type its one-line prompt | C2; run 0 step 5 | O | No. Admitted. |
| D16 | Set rulesets, required check, auto-merge, the `production` and `dev` environments and their secrets | Run 0 step 5; N8 | S | **In kind, yes**: the Foundations allow "the few steps of yours the platform forces at onboarding". |
| D17 | Make the process repository public and remove the sessions' account as collaborator | G1 | S | No. |
| D18 | Rewrite his approvals in `CLAUDE.md` to name the auto-merge act, within 4,096 bytes | G3; M1; run 0 step 5 | O, file edit | **In kind, yes**: the approvals were already in his hand. The byte limit is new. |
| D19 | In the Claude cloud environment: remove eleven secrets, set the variable that turns auto memory off, write and keep current the setup script that installs Node and dependencies | G10, C8, C7 | O; neither GitHub nor Cloudflare; a script | No. Sessions are denied the environment tools, so upkeep is his. |
| D20 | Open a separate Cloudflare account for development and issue a development-only token | F3, G10 | O for the account, S for the token scope | No. |
| D21 | Merge the clean-up pull request on the product and put the workflow files on main | Rec. P1; run 0 step 4; G8 | O | No. |
| D22 | Commission the session that builds the Process4 kit, fix its line budget, and set the runner-minute budget from the replay | Run 0 steps 2 and 3; N6; G5 | O | No. |
| D23 | Take his part in the seven one-hour tests: a task (1), a ruleset and his bypass (2), rewritten approvals (3), settings (6), a second Cloudflare account (7) | "Before run 1" | Mixed | No. The proposal does not say who runs them. |
| D24 | Write to GitHub Support about the 6 Nov suspension | G12; run 0 step 1 | O | No. |
| D25 | Remove the state branch, which sessions may not delete and a pull request cannot | Rec. P1, implied | S to lift the rule, O to delete | No. Unstated in the proposal. |

### Decisions newly put to him

| # | Decision | Source | Kind |
| --- | --- | --- | --- |
| D26 | Whether to add type-checking and lint | Rec. P5: "your engineering decision. Decide at the first retrospective" | O |
| D27 | Whether to move to a GitHub organization for its merge queue if more than 5% of merges break the integration branch | G6 | Mixed |
| D28 | Whether to carry the twelve shortcomings and seven product requests to Anthropic | "so you can take them to Anthropic" | O; offered, not required, so not counted below |

### Totals

- 28 items listed. Three exist in the documents already or in kind (D14, D16, D18) and one is only offered (D28). **24 are new acts or decisions placed on the owner.** One of them, D25, is implied and not stated.
- Of the 24: 2 are purely settings changes about permissions or rules (D9, D17); 5 are mixed (D4, D20, D23, D25, D27); 17 are something else.
- The proposal's own statement is "Your standing acts are five". This audit finds 13 new standing acts (D1 to D13).
- The shortfall table and R3 admit 7 of the 24 (D1, D4, D5, D11, D12, D13, D15).


# [file] appendix_recount.md

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

Found beyond what the task listed. Each is flagged in v2 where a row carries it.

1. **Section H, the count of fifteen.** The total is right: fifteen distinct lines. The parts are not. "Three checks (three lines)" are four lines (F-PROP-3 and JOB-12 are both the first check). "The line about when a layer closes also ends" is INT-4, which is already one of the three layer lines (P10, INT-4, OT-2). The two slips cancel.
2. **Section G, "the audit kept 198 as written".** In the first draft's own appendix 20 of those 198 had a clause ended or changed, so 178 were as written. Now 176.
3. **Section K numbering.** The first draft's appendix used K1 to K9. Main has K1 to K7. The appendix's K4 (replacing ROOT, the standby) is not one of Bob's points in main; it is technical point 4. Its K5 to K8 are main's K4 to K7. Its K9 is main's unnumbered "Settled on 14 Nov" line. Its count table called F-ROLES-4 an open point for the owner under "K4", which in main is the judge of the process. Corrected in v2.
4. **Who decided the hourly alarm.** The first draft's rows F-ROLES-5 and F-ROLES-6 said "kept by decision 14", which is one of Bob's. The assessment document says of the hourly wake-up: "That is a technical choice, made by Claude and reported here, not a question for you." Corrected in v2. I could not read the text of decision 14, so the coordinator should confirm.
5. **K1 says two checks are unruled. The rows keep more.** Checks or re-runs that are not among the three tests, sit in kept rows, and are named by no decision: P12 ("re-runs the checks" at the tranche's close; the first draft filed it under K1, which does not list it), GAT-2 ("the checks scoped to the module" other than uses-match-imports), JOB-5 (seconds-long local checks at completion), SHM-1 and OT-3 (the drift check), MNT-4 (the pin verified at every session start), F-SET-6 (the required "record" check, which is REC-10's and so ended with item I 5), JOB-8's check (section 5 above). PLT-9's check at tranche open is kept under decision 13 as the first draft read it; main section F does not mention that check, and it can stop a tranche from opening.
6. **Lines that lean on something a 14 Nov decision ended, still marked kept.** TXT-4 applies the per-line test (ended, I 8). F-HOW-1 and MNT-8 require "the two health metrics" (retired as judge, K4). F-SET-6 as above. Status left; flagged.
7. **OT-4 and SES-15.** They say the same thing toward the owner. SES-15 is marked "one clause changed" by decision 14 (the coordinator is the front door). OT-4 is plain "kept".
8. **The six notes.** Main section K says Bob "rewrote in your own hand the five notes". The store shows six. The wording left in each is the coordinator's with the attribution cut. The store has no author field. INT-4's note is a copy of PLT-5's and the line still reads "modify", though the appendix and section H have it ended. The rewritten notes also keep Process3 terms that main ends: "BOB", "the watcher", "status and the sweep", "the per-line test" (live_docs, part C).
9. **Review clauses.** Decision 12's effect is marked on eight lines. REQ-3 ("a review never counts an untaken measurement as a gap"), F-HUM-11 ("a reviewer's what-if") and F-PLAT-7 ("ROOT by the watcher") carry similar dead or unsettled clauses with no mark. Minor; not changed.
10. **REC-10's prune and GAT-8's second clause.** Item I 5 names the check; REC-10 also asks for a scheduled prune. Section H names the second run; GAT-8 also says the tool merges only a passing, current tip. v2 ends both lines whole, as the decisions were given to me, and flags the prune.

Main-text points outside G to K that the same decisions now contradict, noted in passing: section B's list of Bob's acts says "There are no others" (K2 adds the Claude-side set-up acts as accepted facts); section C calls the external walk "optional" (K5 makes it run by rule); section K's seven points are all answered and one new point is open. The second draft in progress already carries these three changes. It still says "the audit kept 198 as written ... so 208 stand. Another 45" in section G and "three checks (three lines)" in section H.

## 7. What v2 changed, in numbers

- 288 rows, same order, same first four columns. 198 rows are identical to the first draft. 90 differ.
- 40 rows changed their "Now" value. 11 of those are only the relabel of "Ended" as "Ended by Bob's decision". The other 29: 17 section I lines, 4 lines of the three checks, ARC-2, F-SET-4, F-ROLES-4, SES-12, F-MNT-4, MSG-5, MNT-1, MNT-5.
- 50 rows changed only their place or flag.
- Every row decided by Claude says "Claude's decision, 14 Nov". No row gives a 14 Nov decision of Claude's as Bob's.

# Third draft

14 Nov 2026. Worker's notes. Written with `/home/user/handoff/process4_definition_appendix_v3.md`. One other file was changed: two count sentences in `/home/user/handoff/process4_definition_v3.md` (section 4 below). No repository was touched.

Read for this: the third draft of the main text in full; `decisions_memo_d3.md` and `v3_notes.md` in full; the second-draft appendix and the recount above; all 288 rows of `process4_disposition.tsv`; `audit_ledger.md` sections 0, 1, finding 1 and section 6; `audit_foundations.md` findings 5 to 22 and the smaller silent drops; `live_docs.md` part A (the record of 13 and 14 Nov, and the ledger store). Section letters below are the third draft's.

## 1. The recount

Counted by script from the rows of the third-draft appendix. Each row has one status.

| Category | Lines |
| --- | --- |
| A. Kept as written | 163 |
| B. Kept, with the way changed | 44 |
| C. Ended, by the record of 13-14 Nov | 11 |
| D. Ended, by Claude | 22 |
| E. Ended in part | 40 (by the record 13; by Claude 22; by both 5) |
| F. Not yet settled | 6 |
| G. Open on Bob's question | 2 |
| Total | 163 + 44 + 11 + 22 + (13 + 22 + 5) + 6 + 2 = 288 |

**C, ended by the record (11):** ARC-4, GAT-7, P11 (full regression and whole-product checks, line 6); P10, INT-4, OT-2 (layers, lines 7 and 24); JOB-13, TM-10 (deliberate-fault sampling, line 5 as the record lists it); INT-2, INT-7 (review, line 21); F-PLAT-3 (default of 24, line 9). 3 + 3 + 2 + 2 + 1 = 11, which is what section I of the main text lists.

**D, ended by Claude (22):** the three checks, F-PROP-3, JOB-12, GAT-8, GAT-4 (4); section J items 1 to 10, F-SET-3, REQ-6, TM-6, JOB-10, REC-10, REC-9, TM-2, TXT-6, TXT-2, F-REQ-9, REC-8 (11); the three measurements ended unmeasured, SES-16, TM-1, TXT-4, F-REQ-7, TM-4 (5); the first health number, F-MNT-4 (1); the completion round's own file, PLN-4 (1). 4 + 11 + 5 + 1 + 1 = 22.

**E, ended in part (40):**

- By the record (13): ARC-1, F-HUM-6, F-REQ-1, P4 (line 7); F-REQ-4 (lines 6 and 19); F-HUM-2, OT-4 (line 17); F-ROLES-1 (line 22); INT-3, F-JOB-10, GAP-10, F-SET-2, TM-9 (line 21).
- By Claude (22): PLT-9, MNT-4, F-MNT-1, OT-3, F-PLAT-8, F-SET-6, P12 (checks ended in section H); PLT-5, F-ROLES-4, F-ROLES-5, F-PLAT-7, OT-1 (the standby); F-SHAPE-5, SES-12, F-MNT-7, F-HOW-1 (the first health number); JOB-7, SES-6, F-REQ-12, F-SET-8b, TXT-1 (section J items 1, 9, 12 and 8); SES-18 (reviewing as a use for helpers).
- By both (5): PLN-3, F-JOB-6 (layer, line 7; completion round, Claude); F-HUM-12 (line 20; "no duty to build for every fault", Claude); GAT-2 (layer's tests, line 7; format and coverage checks and the wider trigger, Claude); SES-15 (front door, line 17; the measurement in its note, Claude).

**F, not yet settled (6):** F-SHAPE-6, MNT-11 (removing parts one at a time at each model release); F-MNT-2 (re-test at each model release); F-PLAT-9 (counting refusals; trying approved acts at tranche open); F-PLAT-14 (the alarm catching lack of progress); F-PLAT-4 (checking every new session has started).

**G, open (2):** F-PROP-12, MNT-5.

## 2. Each difference from the second-draft recount (186 + 46 + 15 + 11 + 27 + 3)

51 rows changed category. By category:

| Category | Second draft | Out | In | Third draft |
| --- | --- | --- | --- | --- |
| A. Kept as written | 186 | 30 | 7 | 163 |
| B. Way changed | 46 | 12 | 10 | 44 |
| C. Ended by the record | 15 | 4 | 0 | 11 |
| D. Ended by Claude | 11 | 0 | 11 | 22 |
| E. Ended in part | 27 | 3 | 16 | 40 |
| F. Not yet settled | 0 | 0 | 6 | 6 |
| G. Open | 3 | 2 | 1 | 2 |
| Total | 288 | 51 | 51 | 288 |

Move by move, with the reason:

- **C to D (4): F-PROP-3, JOB-12, GAT-4, GAT-8.** The three checks. Section I: "No words of yours confirm it, and your ledger still shows all three as kept. So this is a consequence Claude draws from 'three tests'."
- **A to E (12).** Checks section H ends by Claude's decision: PLT-9 (credentials at tranche open), MNT-4 and F-MNT-1 (process version at a session's start), OT-3 (drift), F-PLAT-8 and F-SET-6 (the guard on the approvals block; the required record check), P12 (re-run at tranche close). The standby: PLT-5 (its ledger note), F-PLAT-7 ("ROOT by the watcher"). TXT-1 (the per-line test in its ledger note, J 8). F-HOW-1 (the first health number cannot be produced). OT-4 (the coordinator is the front door, line 17; the second draft flagged it and left it).
- **A to B (8).** JOB-8 (its check ends; rule stays as text). REC-6, F-PLAT-12, F-ROLES-7 (roles named in the shared state, not an address in git). F-JOB-5 (the job, not ARCH, listens to its own pull request). F-PLAT-13 (tests run only where a pull request changes a module's files). MNT-8 (the combined trial run stands as the shadow slice). F-STOP-3 (external-walk findings go to the next tranche).
- **A to D (5): SES-16, TM-1, TXT-4, F-REQ-7, TM-4.** Section I, "three measurements your ledger asked for, ended unmeasured".
- **A to F (4): F-SHAPE-6, MNT-11, F-MNT-2, F-PLAT-9.** Section I, "not yet settled".
- **A to G (1): F-PROP-12.** See judgment call 1.
- **B to A (5): F-HUM-13, GAP-3** (the two sentences are quoted in section F); **F-GATE-2, P7** (every requirement tested and proven met, restored as a rule); **F-MNT-5** (the second health number "stays as a reported number").
- **B to E (4): F-SHAPE-5, SES-12, F-MNT-7** (first health number cannot be produced; second stays); **F-ROLES-4** (the standby dropped, so "renewed without the owner" ends for ROOT).
- **B to D (2): F-MNT-4** (the first health number itself); **PLN-4** ("No separate list for a completion round").
- **B to F (1): F-PLAT-14.**
- **E to A (2): F-HUM-10, GAP-1.** "Can run" is restored (section A).
- **E to F (1): F-PLAT-4.**
- **G to B (2): MSG-5, MNT-1.** The write-access question is gone; Claude decided that faults are reported to ARCH and ARCH starts a fix session.

Check: A 186 - 12 - 8 - 5 - 4 - 1 + 5 + 2 = 163. B 46 - 5 - 4 - 2 - 1 + 8 + 2 = 44. C 15 - 4 = 11. D 11 + 4 + 5 + 2 = 22. E 27 - 2 - 1 + 12 + 4 = 40. F 0 + 4 + 1 + 1 = 6. G 3 - 2 + 1 = 2.

Decider changed with no change of category: F-SHAPE-3 (the undo check, now Claude's reading), SES-18 (reviewing as a use for helpers, now Claude, "stretches line 21"), F-ROLES-5 and OT-1 (the standby clause, now dropped by Claude), F-HUM-6, INT-3, GAP-10 and F-JOB-1 (given as Claude's in the second draft; the main text has them staying from Bob's ledger and Foundations), F-HUM-12, PLN-3, F-JOB-6, GAT-2, SES-15 (a second decider added). Note changed only: P22, F-REL-1, F-SET-8a, F-STOP-2 (the external walk by rule, and the installer walk, withdrawn).

## 3. Judgment calls that move a count

1. **Open is F-PROP-12 and MNT-5.** I counted as open only the two rows that name the act which moves the process version. Both stand in words under either answer; what waits is whose act it is. If F-PROP-12 is counted kept as written, as the second draft had it and as section H's theme list reads: A 164, G 1. The drafting worker's notes guessed 1. Six more rows carry "Waits on Bob's question" and keep their status: JOB-4, MSG-5, MNT-1, MNT-4, MNT-7, P3.
2. **ARC-4 is counted in C**, as section I counts it, though Claude ends two of its clauses (format and coverage; ownership). If it is counted as ended by both: C 10, and a new cell of 1.
3. **PLT-5 and TXT-1 are in E** for a clause of their ledger notes, not of the printed line. If counted on the printed line only: A 165, E 38.
4. **The boundary between B and E.** A row that was B in the second draft stays B when one more clause in it ends (JOB-11 and GAP-2: the cost alarm; SHM-1: the drift check; F-SHAPE-3; F-GATE-3; F-SET-1). Counted by clause instead, those six would move: B 38, E 46.
5. **JOB-8 is in B**, like ARC-2: the rule stays, its check ends. If a line that names no check is counted as written when its check ends (as REQ-4, P23, GAP-6 are): A 164, B 43.
6. **Kept though the main text is silent on the mechanism:** REC-3 and the other status-command rows; PLN-2 (no written plan is named); SES-8 (the table is not mentioned); F-JOB-8 (how a red from another module is handled is Claude's). Each has a note. Counted as way changed, each moves one from A to B.
7. **F-REQ-7 is in D** with TXT-4. If its trimming is read as carried by "one short rulebook per role": A 164, D 21.
8. **Not yet settled is six rows.** F-ROLES-6, F-PLAT-6 and TM-8 touch the same four things in one clause and stay kept, with a note.

## 4. Against the counts stated in the main text, and the edit made

The main text gave the second-draft figures in two sentences and said they would fall. They differ from the recount, so both were edited. Nothing else in the main text was touched.

Section H, "The count". Before:
