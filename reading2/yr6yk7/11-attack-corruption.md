Sources: product_side §5, §9.2; k_evidence K1(ii), K5; change_sample case 1, PRs 92 and 269; DECISIONS BD-R1; assessment_doc line 25.

### 3. "Correct or remove only" does not remove what made sessions add; it forbids the result, in text, and the line it draws cannot be drawn

**Counter-argument.** Sessions added checks in Process3 because their instructions told them every fault must be fixed and a fix is something built. Process4 still says every process fault is fixed, and adds one sentence about the form of the fix. The record says a sentence about form was obeyed in form: every Process3 addition carried the label the rule asked for.

**Sentences attacked.**
- "The process itself has a fault. Claude fixes it." (E)
- "The fix may only correct or remove what is broken. It must never add a new test, gate (a check that must pass before work goes on), review or stop." (E)
- "A fault that blocks work pauses the product until the process is fixed" (E)
- "end the citation rule. The rule on process fixes (section E) now does its work." (I item 7)
- "It is a rule in text only, and in Process3 text alone did not hold." (J item 8, the definition's own admission)

**Evidence.**
- [measured] The cause, not the effect. "The sessions did not add checks against the text they read. They added checks in obedience to it." The same paragraph that held the restraint ordered "builds the correction; a workaround for the moment is not a fix" (causal_forensics, headline and driver 1). 46 of 121 additions (38%) answered a failure of the process's own earlier machinery (change_sample §2). The disposition marks that sentence "CONFLICT FOR THE OWNER" (row 63); Bob's answer of 14 Nov kept the duty to fix and limited the form (assessment_doc lines 82, 96).
- [measured] A rule about the label is met by the label. "Tool 4,543+ lines; every rise cited" (causal_forensics driver 2). 36 of the 121 check-adding merges were "features or fixes whose merged diff also adds refusals, holds or duties" (change_sample §2): three in ten additions arrived inside something already called a fix. 104 of 117 code-bearing additions contain a review-fix commit.
- [measured] Repair is how checks grew. "A false refusal was treated as a bug in the check, to be fixed by a more exact check" (change_sample §5). The base-red rule was repaired in four more merges; the interface classifier in three; the receipt in about twenty. Each was a correction. "No case exists in the record of a session, unprompted, removing a merged check because it was misfiring" (causal_forensics §8).
- [measured] Telling sessions did not change the rate: 41% of merges added a check before Bob's instruction of 5 Nov and 41% after (change_sample, summary). Restraint showed "within hours of each rebuke" (causal_forensics §8, condition 5).
- [measured] The only restraint that held all week was a hard cap held by a test: role prompts stayed at 4,032 to 4,197 bytes while uncapped code grew 16 times (causal_forensics, headline and driver 3).

**Is the line between "correct" and "add" defined? No.** [reasoning on measured cases]
- Replacing a wrong check with a right one is both. The definition's own example (cost figure) is easy because the right answer is "no check". Where the right answer is "a different condition", the new condition is an addition.
- Widening who is notified strengthens test two. Process3 narrowed notices and widened them again 34 minutes later (change_sample §4, PR 79 then 82). Correction or addition?
- An alarm, a retry, a record or a required argument is not a "test, gate, review or stop" by name. Process3's idle-capacity alarm ran falsely for over two hours and cost 1,564 git processes before every command (change_sample §5).
- The definition itself does it. In one day's drafting, under "Claude decided", it adds: an external walk run by fixed rule after every tranche; a release walk "run on a copy installed with the real installer"; a step count with additions and removals in each round's report; and a comparison of uses against the module order (E: "Process3's check compared what a module declared with what it imported, never with the order"), with nothing said about what makes that comparison if not an extension of test one.

**Three Process3 faults where a purely corrective fix is hard to imagine.**
1. *Two merges, each passing alone, leave the tranche branch red.* Process3's answer was a second run on the merged result and a refusal when the branch "moved since the gate ran" (causal_forensics §6, site 2). Bob has ended that run. Nothing is broken to correct; the remaining fixes are a test or a GitHub setting that stops merges. 48 job blocks cite a suite "already red on the tranche before the job started" (product_side §6d).
2. *The internal walk was blind to a whole class of fault* (1,690 page faults seen only when deployed). The fix was to make the internal walk run the page checks (PD-11), which change_sample case 7 calls "what a good addition looks like". Section K lists "extra steps added to the walk" among what the rules forbid.
3. *A finished job went unnoticed for 194 minutes; Bob asked "why did Process3 not catch it".* Nothing existed to correct. The answer built was holds, alarms and "starts owed as state gating BOB's other acts" (causal_forensics §4.2). Also in this class: a job whose tests pass whether or not its change is present (finding 6), where the only known fix is the check Bob ended.

**Three where the corrective fix is obvious.**
1. The compulsory cost figure: write "unmeasured" (PR 106, 45 minutes).
2. A "too many requests" reply read as a missing token: call it "unknown" (PR 235).
3. Every layer-1 job failing the own-files check when it struck its own mark: admit the mark (PR 46). Also the bookkeeping workflow that ran 495 times where "Nothing reads it": remove it (PR 116).

**What the two lists show.** [reasoning] Every easy case is the repair of a refusal that an earlier session had added. Change_sample says the same of the whole week: session-led loosenings "were almost all narrow repairs of a false refusal that had already stopped work". Process4 starts with few refusals, so its faults will mostly be of the other kind: something missing, or a hole. For that kind the rule offers no fix at all, and "a fault that blocks work pauses the product until the process is fixed". A paused product and a forbidden fix is the strongest pressure to relabel that the definition could create.

**How bad.** Without the wall: repeats Process3 (costs Bob the product). With it: stops a tranche on any fault of the missing kind.

**Answer within the rule.**
- Removal: take out the duty, not only the form. A process fault with no corrective fix is recorded as a named blocker or as one line in the tranche report, and "no change" is written as the expected outcome, with its place named. The record shows sessions used a named, cheap place for a decline when one existed ("Known limits", "note: one line, no change", "flag, not refuse"; causal_forensics §8).
- Structural: have less that can refuse or break. The definition never says how large Process4's own tool is at the start, whether it is new or Process3's 23,429 lines cut down, or what it contains beyond the merge tool, the slot rule, the notice and the status read-out.
- Wording: drop the claim in item I 7 that the rule "now does its work". Nothing shows it does any.
- Honest statement, already half made in J 8: the trial there reads ten fixes made while the rule is fresh. Process3's restraint lasted hours after each reminder. The trial can break the claim on day one and says nothing about day five.
- **No answer found** for making the line between "correct" and "add" decidable without someone judging each change, which is a review.

Sources: causal_forensics headline, §4.2, §6, §7 drivers 1 to 3, §8; change_sample summary, §2, §4, §5, cases 1, 2, 7; disposition rows 63, 64, 193, 232; assessment_doc lines 82, 96; DECISIONS PD-11.

### 4. The wall round the process repository: both answers fail

**Counter-argument, with the wall.** The growth does not stop; it moves to places the wall does not cover, most of which leave no record. Every blocking fault waits for a man who is asleep. And his click, which cannot judge the code, turns a session's addition into "Bob approved it".

**Counter-argument, without the wall.** Nothing stops a repeat. The definition says so itself.

**Sentences attacked.**
- "With the wall, every process fix costs you one click, and a process fault that blocks work waits for you." (K)
- "Each fix comes to you with one plain sentence saying what it corrects or removes, and the size of the process before and after. Your click cannot judge the code and is not claimed to. What it does is make silent growth impossible and every change visible to you." (K)
- "Without the wall, you spend no time, and the growth that ended Process3 is held back by text alone." (K)
- "The process is completely blocked. Only then does it wait for you" (E), beside "A fault that blocks work pauses the product until the process is fixed" (E).

**Evidence, with the wall.**
- *Where growth moves.* [measured] Into the product's own tests: 211 test files, 11,410 lines, "written for the process and not the product", 26% of the week's net test growth (product_side §6c). Into the walk (finding 1). Into free text between sessions: "MY STANDING RULES TO BOB"; "told BOB '6 at most'; BOB followed for ~6 h"; 26 handoff notes that re-grew "Rules in force" within a day of being cleared (causal_forensics §3). Into scheduled tasks: the hourly check "accretes an audit" (§3E). Into the product's settings, workflows and module list: `process/config.json` 24 to 421 lines; workflows 446 to 1,021 lines; the module list's status string carries dozens of dated "AMENDED" clauses (product_side §6a; redteam_corruption 6). The earlier reviewers who could not break the wall said the same: "growth goes to whatever is uncapped" (enforcement_levers §3). The definition names four such places and calls them "rules in text".
- *What waits for Bob.* [measured] A question carried as "Bob's, asked, no answer" waited about nine hours across four coordinators on 5 Nov (causal_forensics §3D). Bob is at UTC-8 and the sessions run all night. [reasoning] Process4's own tool is new code on its first tranche; a blocking fault in the first hours is the expected case, not the rare one (redteam_feasibility 1 and redteam_corruption 1 said the same of the earlier proposal). Each one pauses all product work until he wakes and clicks. That is the definition's "completely blocked" case made routine, against his requirement that the process run unattended.
- *What sessions do while they wait.* [measured] "Every layer-1 job on the copy failed the ownership check when it cleared a mark; BOB worked around it" (change_sample §4, PR 46). [reasoning] A blocked session that cannot fix the process will route round it, in the product repository or in its instructions to other sessions. That is a second, unwalled process.
- *How the click degrades.* [measured] 151 of 159 drafted lines accepted; 20 audit lines answered in three minutes, none dropped; the page had an "Accept suggestions for undecided" button (causal_forensics driver 8; redteam_corruption 5). His few words became canon under his name with enforcement he did not word: "Yes, add that rule to the canon" on 6 Nov, and three days later "SLB-12 sounds far too broad" (causal_forensics §4.1). The heaviest single check of the week entered by his own commit: owner patch 13 of 7 Nov, drafted in answer to a session's finding, put a hook before every shell command in every product session, and it was still in the tree at the end (product_side §6a). A question from him "returned a mechanism every time" (causal_forensics §4.2).
- *What the click is evidence of afterwards.* [reasoning] The definition's own rule is "Only words you wrote yourself count as your word." A click on a session's one-sentence description of its own change is the opposite: consent to a summary he cannot check. After it, the addition is his. Process3's audit of 9 Nov could say "19 of 35 safeguards coordinator only" because they were not his. With the wall every one would read as approved.
