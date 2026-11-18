# [file] point1_tranche_end.md (continued)

   - The Screens document is generated from the folder. Its whole source is on the tranche branch and current to 8 Nov; an older built copy (28 Oct) is there too; the claude.ai page states it was built from the tranche. What is missing from git is only the current built page, kept out by a size cap and by the approvals sentence "never committed". **(V)**
   - The claude.ai Journeys page is the oldest copy of the journeys (27 journeys, 6 Oct, without the "folded" note). The newest journey list (32) is the script in the folder. So "the documents are claude.ai pages" does not hold for the journeys either. **(V)**
   - "It holds machine data" (handoff): on the tranche it also holds one human page (`layouts.html`) and a human-readable page source.
2. **Journey count.** F:85 and C:56 "32": right **(V)**. R:72, R:74 "29": wrong as a count; 29 is what the file's header comment names. N:136 left this unsettled.
3. **"Sessions made 61 of the 63 changes" (C:57; A2:55).** The count 63 is right. The other two are also session identities (the architecture session, and a merge by the sessions' GitHub account). No change to the folder was made by Bob's GitHub account. **(V)**
4. **"The audits give no date, and do not show who drafted the sentence" (A2:55; N:72, N:148).** The date is now found: his commit of 5 Nov 2026. The drafter is still not shown.
5. **"Whether a cloud session can open them is not known" (A2:59).** Measured once, in this session: both pages opened read-only with the Artifact tool, which treated them as public pages made outside this account and returned a summary plus the saved page source. Not measured: any other session or account, or editing.
6. **"135 of its 679 screen acts marked not built yet" (A2:55; F:8, F:80).** The count is right. The registry's word is "owed (a ruling owes it)". "Not built yet" is the auditor's gloss **(J: a fair reading, not the file's own words).**
7. **"About 68 of the 147 failing steps ... were one crash of the walker's browser (measured)" (A2:248; C:138).** The count is right: 68 failures read "Target page, context or browser has been closed", 67 of them in the "as member" group **(V)**. "Crash" is not established. Process3's decision record says of the same run: "Round 1's live arm on p3dev-l12 was stopped on Bob's word" (PD:119). The record does not say whether the stop caused the closed browser **(J: a second possible cause the audit does not mention; C:583 lists the cause as not established).** A2 section 6 item 3 rests partly on this.
8. **"60 and 64 minutes" (D5:183; F:100; A2:164).** Right for the whole deploy-and-walk runs (59.5 and 63.6 minutes). Within them the external-walk stage took 2,455 s (41 min) and 1,352 s (23 min, the stopped one), and the internal walk 613 s and 1,940 s **(V, `deploys/dev.jsonl` on the state branch).** Both were screen sweeps, not journeys.
9. **D5:185 "Checked by Claude: the folder exists on the branch the product is built on, with a screens sub-folder and files describing journeys."** Each clause is literally true of the tranche branch **(V)**, but the drafting notes say it was not checked (`working/v5_notes.md:60`), and the sentence before it ("So the UX Screens document and the UX journeys are kept in that folder") does not follow for the journeys.

---

## 3. What Process3's record shows about walks

**The walks that ran (V, from the product's state branch: `deploys/dev.jsonl`, `deploys/p3dev-l11/...`, `deploys/p3dev-l12/...`, `walks/internal/...`; each `report.json` parsed).**

| Walk | Steps | Steps failing | Failures listed | Notes | What it walked |
| --- | --- | --- | --- | --- | --- |
| Internal, 5 Nov 15:38Z | 236 | 0 | 63, all "not reached on the local arm" (group "R21 the carried states") | 17 | journey 28 (25 steps), journey 3 (8), "R16 ... (journey 29's search path)" (9), 88 screen steps as founder, 89 pseudo-locale steps, others |
| Internal, 8 Nov 07:20Z | 238 | 0 | the same 63 | 17 | the same groups |
| External, 8 Nov 07:20Z | 175 | 155 | 1,691 (1,050 layout overlaps, 640 undefined style classes, 1 step) | 83 (63 "not reached on this instance", 14 "not walked, the assistant does not work") | "as administrator" 80 steps, "as member" 78, public pages 9, two small groups; 154 steps are "screen <name>" |
| Internal, 8 Nov 23:50Z | 357 | 70 | 96 layout overlaps | 60 (34 "the designed absence, BOB, 8 Nov") | as before plus 110 "carried states" steps and 9 public pages |
| External, 8 Nov 23:50Z | 157 | 147 | 178 (110 overlaps, 68 browser closed) | 36, all "the designed absence, BOB, 8 Nov" | "as administrator" 79, "as member" 78 |

These match C:130-136 and `working/k_evidence.md:274-276`.

**Deployments (V, `deploys/dev.jsonl`):** 12, all `"ok": false`. Ten on 4 Nov (eight stopped at the stage named "walk", after 6 s to 25 min in that stage, with no report stored; one at "build"; one at "dry_run"); none for 80 hours; two on 8 Nov, both stopped at "walk". Matches `evidence/product_side.md:12` and `:225`.

**How many walks:** five with stored reports (three internal, two external). The eight walk-stage stops of 4 Nov left no report; what they found is not in the record I read.

**Did any finish clean:** no **(V)**. Two internal walks had every step marked ok while listing 63 failures and exiting 1 (PD:60 "Its internal walk exited 1").

**Did the tranche end:** no. `git ls-remote origin refs/heads/main` = `0dea5a6e`, the 1 Nov commit **(V)**. "The tranche never closed, so no tranche report was written" (A: C:418, citing k_evidence K4).

**Who judged a walk:**
- The walker program's own result, recorded by the process's tool: `"ok": false`, `"exit": 1` in `deploys/dev.jsonl` **(V)**. The tool refused to close a tranche "without a clean internal walk, a release and a clean release walk" (A: `evidence/change_sample.md:153`).
- The coordinator session wrote the rules for what a failing walk blocks: PD-10 "a walk failure that is wholly a found mark already recorded and owed to a named layer does not block `release dev`" (PD:61); PD-16 "A round whose internal walk is clean (known gaps deferred on Bob's word count as passing)" (PD:118) **(V, the record).**
- The architecture session (BOB) wrote excusals into the walker: 36 and 34 notes "the designed absence, BOB, 8 Nov" **(V)**; and the walker's design file says the report "lists them for BOB, who records the comparison before a release is called ready" **(V, `design.mjs` header).**
- Bob stopped one walk, as the record quotes him (PD:117, 8 Nov, a session's record of his words): "Stop the live walk now, update the process so that the live walk only runs once a round closes with no flaws found from the internal walk."

**Where the walks ran:** on GitHub's machines, never from a session (A: F:100; `working/k_evidence.md`; not re-checked). `deploys/dev.jsonl` names the session that started each 8 Nov run **(V)**.

**Did the external walk as Bob now defines it ever run:** no **(V)**. His definition (owner_words/bob_words_14nov_b.md:9): "The external walk follows the UX journeys to confirm that all journeys can be completed successfully to produce proper results." Neither external report has a step group named for a numbered journey; both are sign-ins and screen visits in two roles. The journey-like steps were in the internal walks: journeys 28 and 3 by name, and part of 29, of 32. Its length, failure rate and data needs are unmeasured.

---

## 4. What the fifth draft says (`D5`, quoted with line numbers)

**Bob's own words** (`owner_words/bob_words_14nov_b.md`): line 5 "So a tranche only ends when an external walk (of a development deployment) completes without flaws."; line 9 "An internal walk uses the UX Screens document to confirm that the workflow matches the definition. The external walk follows the UX journeys to confirm that all journeys can be completed successfully to produce proper results."; line 21 "Process3 never finished a tranche because it kept adding test after test so that it stopped making progress before it could finish." `bob_words_14nov_c.md`: line 28 "M7: sessions"; line 37 "O4: internal and external walks a separate tests."; line 51 "screens and journeys are kept in docs/development/ux-substrate/ in the product repo"; lines 56-58 his three answers.

| Question | The draft | Whose words |
| --- | --- | --- |
| Who runs each walk | D5:143 "**Walking sessions** are started by ARCH for each walk and use the job slots". D5:177 "ARCH starts sessions that walk the product as built against the UX Screens document." D5:178 "Walking sessions then follow the UX journeys there." D5:183 "Your hint of 14 Nov: 'sessions'. So sessions run both. *Claude decided* the rest: a walk happens when no job is open, so walking sessions use the job slots, and the walk is shared out among them by journey, with at most as many walking sessions as there are slots. Unproven: ... That never ran." | His: "sessions". Claude's: everything after it, and "So sessions run both" (R:183) |
| Who deploys | D5:135 ARCH "has the product deployed to the development site". No session named | Claude's |
| Who decides a walk is clean | Not stated in one sentence. D5:135 ARCH "starts the walking sessions ... and turns each flaw into work for a named module ... It writes the tranche report." D5:191 "When the tranche ends, ARCH merges the tranche branch into the main branch as a whole, by pull request ... None of the three tests runs on that pull request." D5:409 "Sessions write and count the walk's steps. A step that was loosened cannot be seen." | Claude's. That the decider is ARCH alone is the auditors' reading (C:42) **(J: I agree with it; no other session is given a part)** |
| What "without flaws" means | D5:187 "The fourth draft's proposal 10: a walk is without flaws when it lists no flaw and leaves out no step that the walk before it made. You answered 'agreed' on 14 Nov." (His answer: `bob_words_14nov_c.md:43` "O10: agreed". The proposal as he saw it: `definition/process4_definition_v4.md:416-420`.) | His "agreed" to Claude's proposal |
| What a walk is measured against | D5:24, D5:25 quote his two definitions. D5:185 "So the UX Screens document and the UX journeys are kept in that folder of the product's repository. Checked by Claude: ... Which exact files each walk reads is Claude's to settle in the build." | First sentence his; the rest Claude's, and wrong in part (2.6 item 9) |
| How big a tranche is | D5:22 "**Tranche:** one batch of product work, built on the tranche branch, apart from the main branch, and reaching the main branch only as a whole." D5:176 "**Jobs.** Every module that has work gets its job." D5:231 "the 65 modules with real work led to about 177 jobs ... (estimated)". Nothing else | No size, content or scope is set by anyone |
| How many rounds | D5:23 "**Round:** one pass within a tranche: jobs, then the internal walk, then, if that finds no flaws, a deployment and the external walk." D5:189 "**Nothing bounds the number of rounds.**" | Claude's statement of fact |
| A tranche that never comes clean | D5:189 "You give the reason no tranche finished in Process3: it 'kept adding test after test'. So the risk that a tranche does not come clean is unmeasured for a process that does not grow. Only your word ends a tranche that will not come clean." D5:400 "Whether a tranche can end" is under "Only the first real tranche can show" | "Only your word ends ..." is Claude's unmarked addition (R:230) and sits against his own sentence (R:255). What then happens to the branch is unsaid (C:156) |
| When each walk is made | D5:204 "at the end of a round's jobs, or at any time on your word to the coordinator"; D5:183 "a walk happens when no job is open"; D5:181 "*Claude decided* the order: jobs, then the internal walk, and deployment only after an internal walk with no flaws." | Claude's; the first two cannot both hold (F:288) |
| The report | D5:313 "One report, written once by ARCH at the tranche's end" | Claude's |
| What is not built or proven | D5:13 "No walk of either kind finished without flaws in Process3 (measured), so that ending is unproven"; D5:364 nothing is built for "a walk shared among several sessions; deployment as a step in a round"; D5:392 trial item on shared walks | Stated honestly |

---

## 5. What is Bob's to decide, and what is technical

### Bob's (each with the options the audits name and the cost to him; I add no option of my own)

1. **What each walk is measured against** (A2:53-59; F:90-91; C:75; R:77-78).
   - (a) The claude.ai pages. Cost: nothing moves. Their history is outside git. Facts to weigh: one session opened them today; the Journeys page there is the oldest copy (27 journeys); the Screens page there is rebuilt and republished by sessions "whenever a DEC or BD changes a screen" (commit `922154ffd`, citing a coordinator's rule of 8 Nov).
   - (b) Files in the folder (the drift auditor's suggestion, C:69). Cost: "a restoring" (A2:59). Facts: the Journeys file exists on main and in git history; the Screens page's source is already there; the built page was kept out of git by a 1 MB cap (a Process3 setting, BD-5) and by his own approvals sentence "never committed".
   - (c) The machine data. Cost: "you cannot read it, and it describes more than is built" (A2:59): 135 of 679 acts are owed by rulings.
   - Whichever he picks, **which journey list counts** (27, 27 or 32) is part of it. No audit asked this; it follows from the facts in 2.3.
2. **Whether sessions may change what the walks are measured against** (A2:59; C:71, C:75). Either sessions may, "and a tranche's end rests on what sessions write"; or only he may, "and each ruling that something is 'as designed' waits for you". Facts the audits did not show him: his approvals of 5 Nov say design lanes "decide design and wording there"; a session's record has him answering "agreed" on 6 Nov to the lane deciding screens, flows and words beneath his direction, audiences and principles (2.5). Process4 has not yet defined lanes.
3. **What "without flaws" means.** He agreed to proposal 10. The drift auditor suggests different wording (C:70; A2:59): every journey in his journeys document followed to its end, none listed as a flaw, a note or "not walked". This changes something he agreed, so by his own rule it must come to him as a proposal. Cost of leaving it: the agreed wording "looks one walk back only" (judged, C:61). Cost of the change: notes and "not walked" entries then hold a tranche open (the last stored external walk had 36 notes).
4. **What a tranche contains** (A2:61-67; F:158; C:155). (a) All open work: no decision now; the first walk after about 177 jobs (estimated), carrying every flaw Process3 left. (b) A smaller content he sets for each tranche, saying which part of the documents its walks cover and whether an older flaw holds it open: a decision at each tranche, and "a clean walk of a part says less about the whole". The run audit judges this "the only lever in his hands that is not a new check" (F:158).
5. **A tranche that will not come clean** (A2:67; C:156; R:230, R:255). The draft's "Only your word ends" it is Claude's. If he does end one by his word, it is either merged with its flaws, which sits against his "So a release is always fully tested and walked successfully", or dropped. Nothing says which.
6. **Which journeys "all journeys" covers** (C:143, C:154; A2:110). Journeys 1, 28 and 29 begin at civicsmith.org or the installer **(V)**, which he put outside the tranche; six journeys have steps marked for the assistant only (6, 10, 17, 22, 29, 32) and journey 4 is connecting a Claude account **(V; the audits' "about nine" not re-derived)**, and he wrote "A tranche can end without an AI enabled run". The audits list this as a conflict between his own statements and do not choose.
7. **Who runs the walks** (A2:162-168; F:105-106; R:258). (a) Sessions, his hint. Cost: unproven; whether a session's browser can reach the development site is unmeasured; the walker may need changing first. (b) GitHub's machines, as his kept Ledger line and Process3 had it: that form ran; it sets his hint aside.
8. **The risk that one session decides "clean" and then merges** (A2:247; C:73). No remedy was found within his rules; "every stop the auditors could see is a check or a gate". His to accept as a stated risk or not. The same holds for a walk step that fails for no reason in the product (A2:248).
9. **Go-ahead for the one-off trials** (A2:234-235; C:153). They need sessions or deployments on his account, which the handoff says to ask about first.

### Technical (Claude's to decide and report)

- Which exact files each walk reads, once item 1 is answered (D5:185).
- Correcting D5:185 and "Checked by Claude" (A2:184; R:77); marking "Only your word ends ..." as Claude's or replacing it with the plain statement that the case is undefined (R:230); marking "So sessions run both" as a reading (R:187).
- Resolving the sentences that cannot both hold (F:288, F:290).
- Naming the session that deploys (F:105; A2:208).
- Whether a walk is shared among sessions or run by one, after the trial (F:105-106); any change to the walker.
- Telling him at each round's end what the walks listed and how many rounds so far (C:424; A2:215).
- Adding the missing items to the unbuilt and unproven lists (A2:222-223).
- Saying how long the first round is estimated to take before its first walk (F:158).

### What is proven and what is not

Proven (ran, measured): the folder's contents on both branches; who committed to it; five stored walks, none clean; the external walks were screen sweeps; the tranche never ended; both claude.ai pages can be opened read-only from one session. Not proven: that a walk of either kind can come clean; that a walk by journeys can be run at all, how long it takes, or what data it needs; that a session can run a walk or reach the development site; that the same walk gives the same answer twice on an unchanged build.


# [file] canon_analysis.md (later part)

### E. Alarms and wake conditions (15)

| # | Alarm | Line or place |
| --- | --- | --- |
| E1 | REFRESH when context passes the role's threshold | SES-4 |
| E2 | REFRESH at 10 refusals in a session | Permissions |
| E3 | Session stopped after three refusals in a row, "which status and the sweep must catch" | Permissions; Unattended 3 |
| E4 | Job WORKING with nothing pushed for over two hours | JOB-9, ENF-6; sweep step 3 |
| E5 | Attempt far over its role's time or cost median | GAP-2; Unattended 6 |
| E6 | Any session blocked | ENF-7; sweep step 3 |
| E7 | Status lists acts for an idle BOB | GAP-4; sweep step 3 |
| E8 | BOB silent for two hours after a sweep woke it: successor started | Sweep step 2 |
| E9 | BOB flagged REFRESH: successor started | Sweep step 2 |
| E10 | ROOT full, or heartbeat older than four hours: watcher takes over | Watcher |
| E11 | Undelivered message listed by status | MSG-6 |
| E12 | Reading set over budget | SES-6 |
| E13 | Pull-request events to BOB: completion, red gate, comment | GAP-5 |
| E14 | Requirements file over the cap | REQ-6 |
| E15 | Process flaw reports listed at each status | MNT-7 |

### F. Records and bookkeeping artefacts (47)

| # | Record | Line or place |
| --- | --- | --- |
| F1 | Keep and Drop Ledger, 159 lines | The canon |
| F2 | Foundations | The canon |
| F3 | Build Plan | How this was decided; GAP-9 |
| F4 | Ledger map | GAP-9 |
| F5 | Walk-through: numbered questions with a column for the owner's word | How problems are handled |
| F6 | Build ledger, JSON, one entry per module or feature | REC-9 |
| F7 | Decision records, one file each | REC-11 |
| F8 | Rulings, until absorbed | REQ-7 |
| F9 | Status output with next acts per role | REC-3, GAP-4 |
| F10 | Handoff, one screen | SES-3 |
| F11 | Transient state files per participant on the state branch | REC-1 |
| F12 | Platform table | PLT-1 |
| F13 | Address files in git (ROOT, BOB) | REC-6 |
| F14 | Heartbeat state file | Scheduled tasks |
| F15 | Owed list | Sweep step 3 |
| F16 | Plan with the process pin | MNT-4 |
| F17 | Pause and resume field in the product's process config | PLN-5 |
| F18 | Layer map: modules in order with their uses | ARC-1, P2 |
| F19 | Module requirements files with permanent ids and not-yet-met marks | REQ-1, REQ-4 |
| F20 | Completion-round file | PLN-4 |
| F21 | START as the pull request body | JOB-1, JOB-2 |
| F22 | Receipt as a pull request comment | JOB-7 |
| F23 | Worker receipts | SES-10 |
| F24 | Cross-module flaw and improvement reports | P9, PLN-3 |
| F25 | Process flaw reports and their answers | MNT-7, MSG-5 |
| F26 | Tranche report | PLN-6, GAP-12 |
| F27 | Per-attempt metrics rows | JOB-10 |
| F28 | Refusal record: act, depth, channel | Standing approvals |
| F29 | Message numbers and the undelivered list | MSG-3, MSG-6 |
| F30 | Setup list | Setup |
| F31 | Developer's steps and the per-product onboarding page | Setup |
| F32 | Grant list | PLT-9, SHM-3 |
| F33 | Rulebook per role | TXT-3, TXT-5 |
| F34 | Start table: model, effort, permission mode, refresh threshold | SES-8, SES-4 |
| F35 | Reading sets per role and the budget table | SES-5, SES-6 |
| F36 | Product CLAUDE.md with its pin line | TXT-1 |
| F37 | Approvals block in each repository's CLAUDE.md | GAP-6 |
| F38 | Settings file with the deny list | SHM-1 |
| F39 | Skill | SHM-1 |
| F40 | Lane directories of design knowledge | SES-14 |
| F41 | Word table of user-facing text | ARC-3 |
| F42 | Release note with platform rows and certified sizes | MNT-10 |
| F43 | Blocked states and retirement lines | ENF-7, INT-5 |
| F44 | Recorded acts: pin move, live-limit change, restated line, missing-instruction decision | MNT-5; Platform; The human and the AI; Standing approvals |
| F45 | Account-move page | GAP-8 |
| F46 | Listed reasons for a review | INT-2 |
| F47 | The process's own ledger, requirements and tranches | MNT-1 |

### G. Roles (11)

| # | Role | Line or place |
| --- | --- | --- |
| G1 | Owner, as product manager and engineer | What this process is for; P17 |
| G2 | Coordinator, at the top of the depth chain | PLT-5 as restated |
| G3 | ROOT | SES-1 |
| G4 | Watcher, a standing session | Scheduled tasks |
| G5 | BOB, one per product | SES-1 |
| G6 | Job | JOB-1 |
| G7 | Lane, with the UX lane always present | SES-14 |
| G8 | In-session worker | SES-10, SES-18 |
| G9 | Fresh reviewer | INT-2 |
| G10 | Walkers | P22; Two kinds of release |
| G11 | The process's own architecture session | MNT-7, MSG-5 (page explanations) |

### H. Scheduled tasks and recurring workflows (10)

| # | Task or workflow | Fires | Line or place |
| --- | --- | --- | --- |
| H1 | Sweep | Hourly | Scheduled tasks |
| H2 | Watcher | Daily | Scheduled tasks |
| H3 | Prune workflow | Scheduled | REC-10 |
| H4 | Mutation workflow | Nightly | JOB-13 |
| H5 | Nightly fixture tier | Nightly | Coverage |
| H6 | Gate workflow | Every PR tip | GAT-1 |
| H7 | Layer-check workflow | Layer close | ARC-4, INT-4 |
| H8 | Release workflow | Each release, development releases every round | Where the process stops; P22 |
| H9 | Privileged workflow on GitHub's runner | On demand | PLT-8 |
| H10 | Shim regeneration workflow | Each process change to the shims | SHM-2 |

### Totals and what they show

| Category | Count |
| --- | --- |
| A. Commit, merge and release checks | 33 |
| B. Session-start and tool-command checks | 26 |
| C. Reviews, audits and trials | 17 |
| D. Measurements and metrics | 36 |
| E. Alarms and wake conditions | 15 |
| F. Records and bookkeeping artefacts | 47 |
| G. Roles | 11 |
| H. Scheduled tasks and recurring workflows | 10 |
| Total | 195 |

Four observations follow from the inventory.

1. **A process described as thin mandates about 195 things.** Of these, 76 are checks, reviews or audits (A, B and C), and about 40 can refuse, fail or stop something. The canon's self-description is "Rules are few".
2. **Most of it was not built when the run began.** The map marks 51 of its 151 rows as simply "Built". Seventeen are "Gap", 21 carry a Phase 2 row, 39 a Phase 3 row, 3 a Phase 4 row and 8 a later gate. Of the 33 merge-path checks, 6 were marked Gap and 7 more were set for a later phase. A session told never to idle therefore always had canon-mandated process work it could do.
3. **The canon names a missing check a "Gap".** The map's gap list is dominated by checks that do not yet exist (ARC-1, ARC-3, ARC-4, JOB-8, GAT-4, P7, REC-8, P20). The canon itself defines an unbuilt check as a debt, with a phase in which to pay it. No measured failure is cited for paying it; the line's existence is the justification.
4. **Fail-closed behaviour is in the canon's own text.** "It acts on nothing, reports both SHAs and ends." "A missing one stops the start." "A failed fetch fails the check." "No build starts on a line any of them contradicts." The refusals that later multiplied had approved precedents in exactly this form.

## 3. Inventory B: the restraints, and what holds each one

I count 47 lines or sentences that restrain adding checks, rules, records or caution. They fall into two groups. Twenty-two restrain growth in general. Twenty-five restrain one specific check or one specific way of enforcing.

"Held by" uses the Ledger map's 3 Nov wording where it has a row. "Terms" records whether the restraint says anything about size, cost, removal, or doing nothing.

### General restraints (22)

| # | Restraint | Source | Held by | Terms |
| --- | --- | --- | --- | --- |
| G1 | "Nothing else is output: a rule, a record, a check or a test has value only as far as it serves that, and one that does not is wrong." | P1; What this process is for | Text ("Rule 1; the health metrics") | Cost: "quickly and cheaply", no number. Removal: "is wrong", with no act attached. |
| G2 | "caution is a cost, paid only against a measured failure or your word" | How problems are handled | Text | Cost is named and never priced. |
| G3 | "a reviewer's 'what if' is not a problem, and is one line in a report" | How problems are handled; GAP-3 | Text | Do nothing: yes, for a what-if only. |
| G4 | "The default answer to a finding with nothing measured behind it is no change" | How problems are handled | Text | Do nothing: yes, only when nothing was measured. |
| G5 | "A rule, check, review round, measurement run or owed task exists only against a measured failure or Bob's word" | GAP-3 | "Rule 2", built as text. The properties table names an "Audit of citations"; no build exists for it | No size, no cost. A test of justification only. |
| G6 | "Every rule in the process cites the measured failure or your decision that justified it; a rule with neither is removed." | TXT-6 | "Rule 2; this map", built as text | Removal in words. The page's own objection: "Requires someone to audit the citations." |
| G7 | BOB "corrects the design by rewriting the line it belongs to, never by appending" | How problems are handled | Text | Bounds lines of canon. Silent on code. |
| G8 | "at most ten rules on one screen, rewritten in place and never appended" | TXT-3 | Gap: no rulebooks written | Size: ten rules, one screen, for rulebook text only. |
| G9 | Every instruction-file line is "failure-backed, non-inferable from the code, or tool-enforced, and lines are deleted on review" | TXT-2 | Nudge ("Review at each gate") | Removal in words. The page's own objection: "Periodic review is work that is easy to skip." |
| G10 | "The product's CLAUDE.md is under thirty lines" | TXT-1 | Gap | Size: thirty lines, one file. |
| G11 | The principles are "trimmed by the same per-line test so that most roles load only the two or three that govern their stage" | TXT-4 | Phase 3; to measure | Size: an aim, no number. |
| G12 | "Only words you mark as a decision become rulings ... there is no ruling log" | REQ-7 | "Template file", later gate | Removal: a ruling is deleted once absorbed. The page's own objection: "easy to defer". |
| G13 | "Rules are few, each cites a failure, and each names the tool that enforces it or is labelled a nudge." | The shape in one paragraph | Text | Size: "few", no number. |
| G14 | "When in doubt, run the product and let it show what matters." | How problems are handled | Text | None. |
| G15 | "A reviewer's finding that needs a deliberate attack is a known limit, not code, so the tool does not grow without end." | Setup: what the checks defend against | Text | The only sentence about the tool's growth. No number. Excludes only findings that need a deliberate attack. |
| G16 | A platform behaviour is "measured once by default" | GAP-11 | "Rule 3", built as text | Size: once, unless "ambiguous or a failure recurs". |
| G17 | "components are removed one at a time and the result observed; what the model no longer needs is retired" | MNT-11 | Phase 4, not built | The canon's only removal procedure. It fires only at a model or Claude Code release. |
| G18 | "Development under the process is development of the product, not of the process"; "a non-blocking flaw waits for the next release" | P3, MNT-6 | "Rule 6", built as text; pin by pull request | Do nothing: yes, for a non-blocking flaw. "Blocking" is undefined, and "during Process3's own first build, changes are expected". |
| G19 | A flaw is "never fixed in place" | MNT-7 | Later gate | Routes fixes. Does not limit them. |
| G20 | "governed by this thin process, not by a twelve-module architecture of its own" | MNT-1, MNT-2 dropped | Phase 4 | Size: "thin", no number. |
| G21 | "Nothing here is in force until it has run on a real tranche with the two health metrics measured." | How this was decided; MNT-8 | Text | None. The live first tranche was itself the certification. |
| G22 | Overhead share, BOB's idle time, and the two health metrics as "the standing judge of every other line" | SES-11, SES-12, PLN-6, GAP-12 | Metrics built; overhead share in Phase 2 and 3 with "no target (Bob, 3 Nov)"; survival "read 16 Nov" | Cost is measured. No threshold, no consequence, and the report comes at tranche close. |

### Specific restraints (25)

| # | Restraint | Source | Held by | Terms |
| --- | --- | --- | --- | --- |
| S1 | "At most a handful of command hooks, each for a rule with zero exceptions" | ENF-1 | No hooks today; drift check in Phase 3 | Size: "a handful", hooks only. |
| S2 | "No model judge sits between a session and you" | ENF-2 | The design | — |
| S3 | "Nothing holds a turn, and stop means stop in that turn"; no Stop hooks | ENF-3; ENF-5 dropped | The design | — |
| S4 | No hook refuses a partial read | ENF-4 dropped | By absence; replaced by an audit (C4) | — |
| S5 | "There is no /goal" | ENF-6 | Status and the sweep; replaced by an alarm (E4) | — |
| S6 | The gate runs "once per pull request tip, never in a session" | GAT-1 | Gate workflow, built | Size: once per tip. |
| S7 | The gate "never" runs "another module's suite" | GAT-2 | Gate, built | — |
| S8 | The gate runs only when the module's own paths change; "Record writes never cost a job a gate run" | GAT-6, REC-4 | Gate workflow, built | — |
| S9 | Whole-product checks and the full regression run only "before a release, or when you ask" | ARC-4 note, GAT-7 | Phase 3 | — |
| S10 | At completion a job "runs only the checks that take seconds" | JOB-5 | Job complete, built | — |
| S11 | A job "is never restarted for a process reason" | JOB-4 | Nudge; built | — |
| S12 | BOB decides "from listed reasons and the known cost, whether a fresh reviewer runs" | INT-2 | Merge with or without review, built | Cost: about 148K tokens a review, as an input to BOB's judgment. |
| S13 | "one complete pass" and a second run that "only confirms" | INT-7 | Review brief; review-round limit in merge, built | Size: two runs. |
| S14 | "After two failed corrections, the session is replaced rather than corrected a third time" | JOB-14 | Built; nudge | Size: two corrections. |
| S15 | "Review is never the merge decision"; the tool merges without the owner by default | GAP-10 | Merge, built | — |
| S16 | "A mandated red step inside the agent's loop is dropped" | INT-6 dropped | By absence | — |
| S17 | "Nothing is ever refused for size"; an overrun "is measured and reported, never refused" | REQ-6, SES-6 | Phase 3; built and nudge | Bans refusal for one reason, size. |
| S18 | A summary is "an option BOB may take ... never a requirement" | SES-7 | The design | — |
| S19 | "A scale figure is a measurement in the plan, never a test line"; a review never counts an untaken measurement as a gap | REQ-3 | Nudge | — |
| S20 | Cost per attempt is "an alarm, not a cap"; "There are no turn or budget caps" | GAP-2 | Sweep row, Phase 2 | Cost measured; a cap is ruled out. |
| S21 | The pin is verified "once at start"; the page adds "No check at every command" | MNT-4 | Start check, built | Size: once. Already widened in the Foundations to every wake (B4) and joined by a setup check before every job start (B5). |
| S22 | "A scheduled task is never required for correctness" | PLT-6 | The design | — |
| S23 | Workers are used for three things, "Not for a smarter answer" | SES-18 | Nudge | Size: three uses. |
| S24 | One act per command "is a nudge"; "a hook comes back only if that count calls for one" | One act per command | Text | A conditional licence as much as a restraint. |
| S25 | The repository "holds only what a session must read or a merge must carry" | P23, REC-10 | Record check, built | Size: a file-size limit, enforced by adding a check (A11, A12). |

### What the two tables show

**The specific restraints were built; the general ones were written.** Of the 25 specific restraints, 19 are held by code or by a thing left out of the design. Of the 22 general restraints, none is held by anything but text. The map's status "Built (text)" appears on seven lines in all: P1, P3, MNT-6, TXT-6, GAP-3, GAP-9 and GAP-11. Six of the seven are general restraints. By the Foundations' own definition ("A property held only by text is a nudge and is marked so") the whole general brake is a nudge, and it is not marked so. The properties table instead lists GAP-3 as held by an "Audit of citations" that has no build, no owner and no schedule.

**The terms that exist bound the wrong things.**

| Term | Restraints that have one | What is bounded | What is not bounded |
| --- | --- | --- | --- |
| Size | G8, G10, G16, S1, S6, S13, S14, S21, S23, S25 | Rules in a rulebook, lines in one file, measurement tries, hooks, gate runs per tip, review runs, corrections, pin checks, worker uses, file size | Number of checks, size of the tool, points of refusal, process changes per run, pin moves per run, share of effort spent on the process |
| Cost | G1, G2, G22, S12, S20 | One review's price as an input (S12) | Nothing. No restraint sets a limit or asks for the cost of a proposed fix |
| Removal | G1, G6, G9, G12, G17 | Rulings and instruction lines, in words | No removal has an owner, a trigger inside a run, or a tool. MNT-11 fires only at a model release |
| Doing nothing | G3, G4, G5, G18 | Findings with nothing measured behind them; non-blocking flaws | A measured failure. No line allows "no change", or "remove the thing that failed", as the answer to a failure that happened |

**The vector was banned, not the behaviour.** The specific restraints forbid hooks, Stop hooks, model judges, an in-session gate, and refusal for size. They do not forbid refusing, stopping or verifying as such. The canon then assigns holder after holder to "the tool" (16 mentions in the Foundations), to "status" (28) and to the sweep (18), none of which has a size limit. A session that wanted to enforce something had every banned route closed and one unbounded route open.

**Where a session would meet the general restraints (inference).** The canon is designed so that sessions load little: a fresh session "starts from status alone", the handoff is "a pointer set, one screen", each role "loads only its rules", and most roles "load only the two or three" principles for their stage. Status prints "each role's next acts". The general restraints live in one paragraph of a 9,800-word Foundations, on the Ledger page, and as "Rule 1", "Rule 2", "Rule 3" and "Rule 6" of a rule text I have not seen. The per-role rulebooks that TXT-3 and TXT-5 require were unwritten on 3 Nov. At the moment a session decides to add a check, the canon puts three things in front of it: the failure, in machine-readable form with file and line (ARC-5); the next acts (GAP-4); and the instruction to build the correction. Nothing puts the restraint there. The page's own note on JOB-9 says why that matters: "It is a nudge, and the research shows restraint rules are weakly followed."

## 4. Licences

### 4.1 Sentences that authorise a session to decide, change or build

| # | Sentence | Source | What it licenses |
| --- | --- | --- | --- |
| L1 | "BOB does everything else: it keeps the record, manages the development environment, makes the most of what the AI can do, takes your input, decides everything technical and detailed, and reports it to you in plain words as done" | The human and the AI; P17 | Every technical decision, reported after the fact |
| L2 | "When BOB is unsure whether a question is yours, it decides by this section and says how it read it." | The human and the AI; P17 | BOB rules on the boundary of its own authority |
| L3 | "when a mechanism cannot be built or a better one is measured, BOB restates the line with its purpose unchanged, records why and where, and reports it in one line; only a change to what a line asks for comes to you (your word, 4 Nov, after TXT-5 was brought to you though it was BOB's)" | The human and the AI | BOB rewrites the canon's mechanisms. The owner had objected to being asked |
| L4 | "Every problem is an architecture bug: BOB finds why, corrects the design by rewriting the line it belongs to, never by appending, and builds the correction; a workaround for the moment is not a fix." | How problems are handled | A design change and a build for every problem; the cheap response is ruled out |
| L5 | "you decide only the layers and modules that carry product capability, and the rest is BOB's" | Requirements | The rest of the architecture |
| L6 | "A change to what a provided service means goes to you only by the DES 1 test; every other change is BOB's, recorded once." | REQ-5 | Requirement changes |
| L7 | "A process flaw that blocks the job holds it at its next command; the fix lands, BOB moves the pin, and the same job continues" | A job's life; JOB-4, MNT-5 | Changing the process under a running job |
| L8 | "A blocking flaw is fixed and adopted by one recorded act that moves the pin, and no job restarts" | Versions; MNT-5 | Mid-tranche adoption of a process change, as often as a flaw is called blocking |
| L9 | "during Process3's own first build, changes are expected" | Versions; P3 | Exempts the whole first run from P3 |
| L10 | "The process repository has its own ledger, requirements, jobs on branches with tests and review, and tranches." | MNT-1 | A standing development line for the process itself |
| L11 | "A flaw report is one command from any session" | MNT-7 | Any session may open process work. The page's own objection: "Report volume can flood the process's architecture session." |
| L12 | "Flaws found in the shadow are fixed before release and the run repeats from the step that found them" | MNT-9 | A fix-and-repeat loop. The page's own objection: "Can loop if flaws keep appearing; needs a stop rule." |
| L13 | "no session ends a turn while work it can do remains"; "BOB never idles while work remains and never ends a turn waiting on you while anything can be done" | Properties table; A job's life; P19, SES-17 | Acting is the required state; not acting is the fault |
| L14 | "while a tranche runs it prepares the next round or tranche" | A job's life; P18 | Further standing work |
| L15 | "Your broad standing approvals are the one policy for every act at every depth"; "Your approvals cover every act of the process (your word, 2 Nov)." | Standing approvals | Blanket consent for process acts |
| L16 | "It changes without your approval: each added or removed line passes the per-line test and is listed in the tranche report" | Instruction files; TXT-1 | Editing the always-loaded instruction file |
| L17 | "BOB may raise or lower that number from what it measures, and records each change (your word, 1 Nov)." | Platform | Tuning a limit from its own measurement |
| L18 | "BOB may start a new session whose START names the act and why ... recorded as a decision" | Standing approvals | Rerouting an act a session declined |
| L19 | "a hook comes back only if that count calls for one"; "the environment comes back only if refusal counts call for it" | One act per command; Standing approvals | Adding enforcement when BOB's own count says so |
| L20 | "a word you give in chat is written there by BOB" | How problems are handled | A session converts the owner's chat into the record. Six Ledger notes are in this form ("written here by the coordinator") |
| L21 | "by default a job, layer or tranche merges on a green gate without you" | The human and the AI; GAP-10 | Merging, including the process's own changes |
| L22 | "Whether a given lane runs as a long-lived session or as a worker started with its directory is BOB's call, judged by cost" | Lanes; SES-14 | Choosing the session structure |
| L23 | "When a problem arises, the relevant rule is rewritten so the problem cannot recur" | TXT-3, page explanation | Sets prevention of recurrence as the standard for a fix |
| L24 | "the watcher's own session takes over as ROOT" | Scheduled tasks | Self-repair of the session tree |

### 4.2 Sentences that tell a session to stop, hold, fail closed, verify or record

| # | Sentence | Source |
| --- | --- | --- |
| V1 | "A session acts only on what it has read in full or measured, never on memory or a plan's assumption; every claim names its source; anything unread or unmeasured is unknown; a cause is named, and a fix written, only once evidence shows it." (the only full sentence the document sets in bold) | Reading; P20 |
| V2 | "Nothing the model says is evidence: a job's claim is a receipt, the gate is CI, the revert check proves tests are real, and branch protection is the last word" | The shape in one paragraph |
| V3 | "its first command then verifies the pin, HEAD and the approvals block against the tip; if not, it acts on nothing, reports both SHAs and ends" | Versions; MNT-4 |
| V4 | "`setup check` reads every condition it can, at onboarding and before every job start; a missing one stops the start" | Setup |
| V5 | "Every account, setting and branch rule the process depends on is part of the design: listed, checked before each job starts, and set by the developer through the fewest steps, each with its reason and tested to work the first time (your word, 2 Nov)." | Setup |
| V6 | "a missing grant stops a tranche from opening" | PLT-9 |
| V7 | "A CI check fails any commit that adds a file over a set size or writes under a path reserved for transients" | Size discipline; REC-10 |
| V8 | "a check fails any change to the approvals block not made by you through GitHub's website" | Standing approvals |
| V9 | "It checks out history without file contents, and a failed fetch fails the check" | The gate runs as two jobs |
| V10 | "no build starts on a line any of them contradicts" | How this was decided; GAP-9 |
| V11 | "If it cannot proceed, it sets the blocked state in the ledger and ends the turn with everything pushed" | A job's life; ENF-7 |
| V12 | "An act the judge refused is never reworded or rerouted to another session; it is recorded and raised." "if that session also declines, or the judge refuses, it stops and comes to you" | Standing approvals |
| V13 | "After three refusals in a row a session stops and waits for a person (measured 1 Nov), which status and the sweep must catch." | Permissions |
| V14 | "the tool counts each session's refusals and status prints REFRESH at 10" | Permissions |
| V15 | "Every refusal of an approved act is recorded with the act, the session's depth and the channel the approval reached it by, counted per tranche, tried with a handful of approved acts at the depths they run at, at each tranche's open before any job starts, and re-tested at each model release." | Standing approvals |
| V16 | "The live count stays at 24 or fewer, and every new session is checked to have started." | Running unattended, 4 |
| V17 | "The gate runs on every pull request, and records reach a protected branch only through a pull request." | Running unattended, 5 |
| V18 | "The sweep catches lack of progress, not only silence" | Running unattended, 6 |
| V19 | "A remote act is recorded only from the tool's result" | The record; REC-5 |
| V20 | "The tool brings the branch up to the tranche, runs the gate on the merged result, and merges a green, current tip"; "Jobs never merge: the plain merge routes are denied to every session." | A job's life, step 9 |
| V21 | "If the ROOT address in git is not this session, end the turn and do nothing else." "Create nothing else, merge nothing, edit no task, archive nothing." | Sweep prompt |
| V22 | "every session reads it at its next status and takes no new step" | A job's life; PLN-5 |
| V23 | "every requirement is tested at the module's interface and proven met; none goes untested (P7). Module and layer test coverage should be more complete than the earlier processes produced and maintained." | Coverage |
| V24 | The reviewer "reports every gap in one complete pass with file and line" | Review; INT-7 |
| V25 | "Nothing depends on an unlisted row" | The record; PLT-1 |
| V26 | "A sampled audit, a later gate, judges whether a session read whole by what it can cite from the end of a document, and files a flaw report when it cannot." | Reading; REC-8 |
| V27 | "The tool's checks hold against mistakes (a session that edits a settings file, touches another module, resolves a merge with an old copy, merges something red or stale, or moves the pin somewhere unreleased) and against outsiders' fork pull requests." | Setup: what the checks defend against |
| V28 | "Work is never lost or left waiting ... everything is pushed before any turn ends" | Properties table |
| V29 | "The record exposes a violated nudge at the next status." | Properties |
| V30 | "Each names what holds it." | Properties |
| V31 | "Speed never comes from weakening a safeguard." | P19, Ledger statement; kept as modified, and not carried into the Foundations text |

The Foundations uses "never" 50 times, "every" 60 times and "nothing" 32 times. It uses "no change" once.

### 4.3 Where the licences pull against the restraints

| # | Restraint | Pulling against it | Why the second wins in a run |
| --- | --- | --- | --- |
| T1 | "The default answer to a finding with nothing measured behind it is no change" | "Every problem is an architecture bug: BOB finds why, corrects the design ... and builds the correction" | The two sit in one paragraph and are reconciled only by the word "measured". A failed gate, a refusal, a stalled session and a wrong pin are all measured. Once the process is running, almost every finding has something measured behind it, so the default almost never applies. |
| T2 | "caution is a cost" | V1, in bold: "anything unread or unmeasured is unknown"; V2: "Nothing the model says is evidence" | The most emphatic sentence in the document mandates caution. Its cost is never set against it. |
