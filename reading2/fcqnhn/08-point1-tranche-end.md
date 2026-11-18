1. **"The two documents ... are not in the folder" (A2:19; F:78; C:42, C:56; R:70; the handoff).** Partly right. Right for a file called the Journeys document on the tranche branch, and right that the tranche README says the design documents are claude.ai pages. Wrong or incomplete in four ways:
   - It is true of the tranche branch only. All three audits counted there (F:14; R:73 "on the tranche branch"). On main the folder still holds `journeys.html`, `layouts.html` and the rest. **(V)**
   - The Screens document is generated from the folder. Its whole source is on the tranche branch and current to 8 Nov; an older built copy (28 Oct) is there too; the claude.ai page states it was built from the tranche. What is missing from git is only the current built page, kept out by a size cap and by the approvals sentence "never committed". **(V)**
   - The claude.ai Journeys page is the oldest copy of the journeys (27 journeys, 6 Oct, without the "folded" note). The newest journey list (32) is the script in the folder. So "the documents are claude.ai pages" does not hold for the journeys either. **(V)**
   - "It holds machine data" (handoff): on the tranche it also holds one human page (`layouts.html`) and a human-readable page source.
2. **Journey count.** F:85 and C:56 "32": right **(V)**. R:72, R:74 "29": wrong as a count; 29 is what the file's header comment names. N:136 left this unsettled.
3. **"Sessions made 61 of the 63 changes" (C:57; A2:55).** The count 63 is right. The other two are also session identities (the architecture session, and a merge by the sessions' GitHub account). No change to the folder was made by Bob's GitHub account. **(V)**
4. **"The audits give no date, and do not show who drafted the sentence" (A2:55; N:72, N:148).** The date is now found: his commit of 5 Nov 2026. The drafter is still not shown.
5. **"Whether a cloud session can open them is not known" (A2:59).** Measured once, in this session: both pages opened read-only with the Artifact tool, which treated them as public pages made outside this account and returned a summary plus the saved page source. Not measured: any other session or account, or editing.
6. **"135 of its 679 screen acts marked not built yet" (A2:55; F:8, F:80).** The count is right. The registry's word is "owed (a ruling owes it)". "Not built yet" is the auditor's gloss **(J: a fair reading, not the file's own words).**

Brae sent word of 18 mallets on hand.

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
