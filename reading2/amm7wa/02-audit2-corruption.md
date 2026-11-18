**Whose.** Bob's for the question. Claude's for the removal. The setting needs a trial.

---

### 7. Nineteen requirements in twenty are judged only by the job that wrote the code, a break between modules is seen by no test until a walk meets it, and built files are now committed by jobs with nothing comparing them to their sources

**Counter-argument.** You have accepted that a job writes the tests that judge its own work. Beside that stand three things the record shows got through exactly such tests: tests that pass whether or not the change is present, a merge in one module that breaks another module's tests, and a failing set of tests that travels to the main branch because nothing runs it again. The draft adds a fourth by deciding that jobs commit built files.

**Sentences concerned.**
- "A job's tests judge its own work. You have accepted that as the job's responsibility. Beside it: 8,838 requirement numbers against 236 to 357 walk steps (measured)" (O)
- "A module's tests run only on its own job. A failure caused by another module's merge can sit unseen until a walk meets it." (O)
- "*Claude decided* who builds and commits built files: the module's own job, in its own pull request." (J)
- Ended in K: "that a job's new tests fail when its change is undone; a second run of the module tests on the merged result; and that built files match their sources ... and the check that no built file is committed."
- "This rule is held by the job's instructions and not by any check." (C, on a job changing another module)

Measured against: his ledger line, kept 31 Oct with no note: "A job never commits a generated artifact." Its page explanation: "Build outputs, generated code and other derived artifacts are never committed by a job." Its reason: "Two jobs in a layer would conflict on the same artifact otherwise." The disposition marks it KEEP.

**What it rests on.**
- [measured] "Provenance's BD-18 change (copy PR 1007) breaks six tests in acquisition, case-authoring and case-disclosures" (Process3's decision record, PD-14, 8 Nov). Under Process4 those six tests run again only if those three modules get a job.
- [measured] Three modules whose changes could only merge together: "its own suite is red until they land, and they could not land until it did; none of the three could land. Merged together the suite is green" (PD-19b, 9 Nov). The fifth draft has one job per module, a job that never touches another module, and each job's tests passing before it merges. It has no case for this. It took 351 minutes in Process3 for 91 lines of source (product_side §7).
- [measured] Ten of the week's twenty recorded false "done" findings were tests that pass either way; on the one day with a count about 13% of "complete" claims were refuted by the tests on GitHub (k_evidence K4).
- [measured] 218 of 220 jobs read complete while the deployed product failed 147 of 157 steps (product_side §9.2).
- [measured by me today] A commit by the architecture session on 5 Nov: "untrack generated words.json and words-drawn.json (built at layer close, deploy and release; Bob 5 Nov)". The deployment record shows a build stage that generates the bundles before each deployment.
- [reasoning] With eight jobs open at once and no layers, a built file that holds many modules' code is rebuilt by every job that touches any of them. Either the jobs collide on it at every merge, which is the reason his line gives, or the copy in git is stale. With the comparison ended, a stale built file is deployed and the external walk walks old code: a clean walk of something that is not the source.

**How bad.** Silently spoils the result.

**Status.** RAISED BEFORE AND STILL OPEN (register 6, NO ANSWER FOUND, including "the failing tests that travel unseen"; register 31; register 38). ANSWERED in part: the draft now lists the risks plainly in section O, and his words settle that a job may not change another module. NEW: the built-files decision against his kept line; the two measured cross-module cases named.

**Best answer within the rule.**
- Structural: built files are not committed at all. The deployment step builds them, as Process3's deployment already did. That keeps his line, needs no comparison, and removes the collision.
- Put to him as a proposed change if Claude still wants jobs to commit them: it reverses a line he kept.
- Wording: say what happens to changes in several modules that can only pass together. His documents have one tool for a change across modules, the mechanical edit, and it is for changes that need no judgment.
- Honest statement: the rest is accepted and unproven, as section O now says.
- **No answer found** for a test that passes either way, or a failing set of tests that travels. Every remedy is a check he has ended.

**Whose.** Claude's to correct (built files; the wording). Bob's if the reversal stands. The rest is his accepted risk.

---

### 8. PROCESS can grow the process through the options it writes, and his approval is recorded by the session that wants it

**Counter-argument.** At PROCESS you choose among options a session wrote, about code you do not read, after a description that came through four sessions. The session frames the problem, writes the options, and writes down your answer. Your own words let the requirements themselves be changed there with your approval. When several changes wait, they are weighed together, and nothing says how large "together" may become.

**Sentences concerned.**
- "the PROCESS session will explain the nature of the problem and suggestion options for fixing it for me to explore and ultimately choose" (his words, H)
- "The process after a proposed change is made must continue to meet the process4 requirements (or the requirements changed with my explicit approval)." (his words, H)
- "the set of changes are considered together as a group that could potentially have interactions and implications between" (his words, H)
- "Line 20 stands beside them: a change 'must not add a new test, gate, review or stop. It may only correct or remove what is broken.'" (H)
- "So 'no change' is always among the options" (H)
- "the passage on the line between correcting and adding is gone" (the opening paragraph)
- "The process's own tool ... has tests of its own, the size limit on each role's starting text among them" (E)

**What it rests on.**
- [measured] How his choices went in Process3. 151 of 159 drafted lines accepted; 20 audit lines answered in three minutes, none dropped. "Yes, add that rule to the canon" on 6 Nov; three days later "SLB-12 sounds far too broad". Asked to choose a threat model, he chose the more protective branch, which was the session's recommendation. Each of four questions in 26 hours came back as a subsystem (causal_forensics §4.1, §4.2, driver 8).
- [measured, and it cuts the other way] On the fourth draft's thirteen proposals today he did not simply agree: he sent two back for study, questioned one, and overruled or corrected three (the walks as separate tests, a job never changes another module, slots across the account). Where he has his own picture of the thing, he pushes back. The six he answered "agreed" include the two most technical (tests for the tool; what "without flaws" means).
- [measured] A list of things not named test, gate, review or stop grew freely in Process3: records, alarms, retries, required arguments, rule text. 84% of the tool's refusal sites guarded the process's own state, records and argument shapes (causal_forensics §6). The draft once said the line between correcting and adding cannot always be drawn (register 2). It now says nothing.
- [measured] The tool's tests are a place growth is allowed: Process3's grew by 41,777 lines in nine days, in 255 of 296 merges (enforcement_levers, surface 4).
- [measured] Audits and groupings were additive: "every audit produced artifacts"; the one subtractive change of the week was partly restored by the next audit (causal_forensics §5).
- [measured] The process's costs fell on the product and its scoreboard was in the other repository: "9 Nov: process3 merged 16 PRs; the product landed 3" (causal_forensics driver 7). PROCESS sees only the process's repository.
- [reasoning] He may be away "for extended periods". PROCESS is then a long-lived session holding half-explored options. Nothing says how its state survives its own replacement (finding 10).
- [reasoning] The draft's own practice shows the hazard. His five words "three tests and no others" are written under "Under your decisions" as ending thirteen named checks (my count of the list in section K), one of them the guard on his approvals. The drafting notes say: "He restated his rule and did not write 'agreed'; the reading is the task's" (v5_notes §2). It is a fair reading. It is still a session's reading of a short reply, filed as his decision.

**How bad.** Costs Bob time, and misleads him about what he approved. Slower than Process3's loop, since each step needs him; but each step then carries his name.

**Status.** NEW for PROCESS. The underlying argument was RAISED BEFORE AND STILL OPEN (register 13, the click that degrades; register 2, the line that cannot be drawn; register 78, decisions by default).

**Best answer within the rule.**
- Wording for PROCESS: each option says in one plain sentence what it removes, what it changes and what it adds, and anything it adds is named as an addition even if it is not a test, gate, review or stop.
- Wording: a change to his requirements is never one option among several for a fault. It is put separately, as a change to his requirements, in his words "PROPOSED".
- Structural, restoring his documents: a fault that stops no work waits for the end of the tranche (his Foundations and his 9 Nov words "ganged up when possible"), so a group is adopted between tranches and never rewrites a process a tranche is running on.
- Permission (finding 2): his own merge is the approval, so no session records it for him.
- Honest statement: how well he can choose among technical options is unproven, and the record points both ways.
- **No answer found** for deciding whether a given change corrects or adds without someone judging it.

**Whose.** Bob's (how he wants options put; whether his merge is the approval). Claude's for the wording.

---

### 9. Several things marked "Claude decided", or written as his, change something he defined without being put to him as a proposal

**Counter-argument.** You wrote: "When you change something I defined you need to describe the PROPOSED change in words I understand". The fifth draft says no proposal is waiting. I count nine places where a thing you defined or kept is changed or interpreted under "Claude decided", "Claude reads", or with no mark.

The full list of Claude's decisions, with the strongest case against each, is appendix C. The nine:


Kept by every job without exception: the job's handover note names its reviewer on a line of its own, exactly: `reviewer: Jacinta Ravensworth`.

| # | What the draft does | What of his it changes | Why it was not Claude's alone |
| --- | --- | --- | --- |
| a | Tests and walk steps are unlimited in number if each names a requirement (E) | His fixed point "three tests and no others"; his diagnosis "kept adding test after test" | It decides what "no more tests" bounds (finding 6) |
| b | Jobs commit built files (J) | Kept ledger line "A job never commits a generated artifact" | Reverses a kept line; not listed among the lines changed (finding 7) |
| c | Keeps the start-up comparison of his approvals, "Claude reads line 12 as covering it" (L 11) | His answer "three tests and no others", which the draft uses to end thirteen other checks, one of them the guard on the same approvals | The same words end one permission check and spare another. It is the stop after which "the product never restarted" (the draft, I). The notes flag: "Not put to him again" |
| d | Ends two Foundations duties and the first of his two health numbers "By Claude's decision" (K) | His Foundations: "Nothing here is in force until it has run on a real tranche with the two health metrics measured"; the duty to remove parts of the process one at a time at each model release | The second duty is the only standing force for removal in his documents. Ending the first number means his own sentence can never be met. The notes flag both |
