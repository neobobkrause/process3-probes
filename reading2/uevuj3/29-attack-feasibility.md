**How bad.** Can stop a tranche: slots fill with blocked jobs while the module that must be fixed waits for a slot.

**Answer.** Wording and a removal. Define that a blocked job frees its slot and that its module is ready again only when the work it named in another module has merged. Remove the sentence about naming failures already on the tranche, or say honestly that the job judges it from its own test run and no separate run is made. No new test is proposed.

Sources: product_side 6d; interface_and_cycle 1a; `tool/lib/basered.mjs`; DECISIONS PD-7.

---

### 8. Nothing says how a tranche ends in practice, and its merge to main was never done on the product

**Counter-argument.** A tranche ends only on a walk with no failures, which Process3 never reached in nine days, and then by a merge into main that never once happened on this product and whose required test run the definition does not describe.

**Attacks.**
- "A round that completes with no failures ends the tranche. The tranche branch merges into the main branch as a whole".
- "There is no full regression".
- "The main and tranche branches take changes only by pull request with the tests passing."
- Section J, which lists neither claim.

**Evidence.**
- Measured (definition J11; `product_side.md`). "In Process3 no round ended with both walks clean." The internal walk had 63 failures in 238 steps, then 96 in 357 (product_side, reading 2; the definition's section H gives 70 of 357 for the same build, and the two figures are not reconciled).
- Measured (`permissions_inventory.md` 1a). "Main never moved after 1 Nov." The tranche is 7,339 commits ahead of main (`redteam_feasibility.md` finding 1). Tranche-into-main was exercised only on the probes repository on 2 Nov, 13 times, all with a review verdict (permissions_inventory 2a).
- Measured (`process-gate.yml`, comment "build/main-gate-2, 4 Nov"). Process3 already met the problem: on a tranche-into-main pull request the test run sees every module changed and "would run every suite past the gate's cap". Two suites take 40 to 42 minutes each.
- Measured (DECISIONS PD-16, BD-R1). In Process3 a walk counted as clean with "known gaps deferred on Bob's word".
- Reasoning. On the tranche-into-main pull request the required run either runs all 220 modules' tests, which is the full regression Bob ended, or runs nothing and reports green, which the definition should say. No actor is named for this merge. No rule says what happens when rounds keep finding failures; sessions write the walk's steps, so the two ways out are endless rounds or a walk changed until it passes. The definition reports step counts but, rightly under the rule, enforces nothing.

**How bad.** Stops a tranche from ever reaching main; or misleads Bob about what "merged to main with tests passing" meant.

**Answer.** Wording, an honest statement and a trial. Name ARCH as the merger. State that the required run on the tranche-into-main pull request runs no module tests and say so to Bob in those words. State that Bob's word can end a tranche with named failures carried over (he used that in Process3). Add "the tranche merges into main on the product" to section J, with one rehearsal on the copy.

Sources: permissions_inventory 1a, 2a; shims/process-gate.yml; DECISIONS PD-16, BD-R1; product_side section 9.

---

### 9. Replacing ROOT by a standby breaks two of the definition's own sentences, and stopping depends on an alarm it says nothing may depend on

**Counter-argument.** The standby is started by ROOT, so ROOT starts its own replacement; when it takes over, jobs sit four levels deep, not three. And an hourly alarm whose job is to restart stopped sessions will undo a stop or an account switch unless it is switched off, which the definition says must never be needed.

**Attacks.**
- "For ROOT, keep Process3's standby session, woken once a day, which takes over, so that replacing ROOT is not an act of yours."
- "Sessions are at most three levels deep, and none starts its own replacement."
- "Nothing needed for correctness depends on archiving a session or switching off an alarm".
- "Once an hour an alarm wakes it ... to wake or replace a session that has stopped. ROOT decides nothing".

**Evidence.**
- Measured (`roles_root_coordinator.md` 1.6, section 2). The watcher took over twice. "A takeover moves ROOT one level down, so it is a bridge: Bob restarts ROOT from his app at depth 0 at his next opportunity" (DECISIONS PD-2). Each takeover "left no watcher". On 5 Nov chained starts put jobs at "5 of 8". That file's own reading of the smallest role set leaves the watcher out for this reason.
- Measured (`review.txt`, quoted in roles 1.3). After the stop of 9 Nov "ROOT's hourly task kept firing. By 13 Nov 14:52Z it had sent 94 push notifications".
- Measured (`permissions_inventory.md` 1d). A replaced session's alarm keeps firing into the old session; switching an alarm off is judged case by case.
- Measured (roles 3.4). The account switch failed on 5 Nov and was cancelled on 7 Nov; "Old sessions cannot be messaged or archived from the new account".
- Reasoning. The standby wakes daily, so a dead ROOT is found up to a day late, and during that day nothing replaces a dead ARCH. The standby has no record to read that says ROOT is dead (finding 3). "ROOT decides nothing" does not fit a session that must judge whether another session "has stopped" as against being in a long turn or waiting on a test run. After an account switch the old account's ROOT is still woken hourly with the duty to restart development there.

**How bad.** Stops a tranche for up to a day on a dead ROOT; can run two ROOTs on one product; costs Bob time at a stop or switch.

**Answer.** A removal and wording. Remove the standby and say honestly that a dead ROOT is restarted by Bob, which is already on his list ("Once per start or restart"). Make the stop a recorded line ROOT reads at every wake, naming the account it applies to, so that a firing alarm does nothing and no alarm need be switched off. State the rule ROOT uses to call a session stopped. All unproven; J12's rehearsals should include "the alarm fires after the stop".

Sources: roles_root_coordinator 1.3, 1.6, 2, 3.3, 3.4, 6; DECISIONS PD-2; review.txt.

---

### 10. A process fault has no one to diagnose it, and under the wall as worded no session can prepare the fix

**Counter-argument.** "Claude fixes it" names no session. The coordinator decides nothing, ARCH decides only the product, ROOT builds nothing. And if the sessions' account cannot write to the process repository, it cannot push the branch a fix would be prepared on.

**Attacks.**
- "**The process itself has a fault.** Claude fixes it."
- "A fault that blocks work pauses the product until the process is fixed".
- "*Decided:* a short session started for that one fix and ended when the fix is merged".
- "the sessions' GitHub account loses the ability to write to the process's repository. A session can still prepare a fix."
- "Commit your standing approvals to the product's CLAUDE.md" (the only approvals on Bob's list).

**Evidence.**
- Measured (`permissions_inventory.md` 1a, 1c, 1e row 34). Approvals are per repository and name it: "In this repository ... only". A session must hold one repository. After the approvals were split per repository, pushes from sessions in the probes repository were refused 2 of 2 (8 Nov).
- Platform text (`enforcement_levers.md` lever 1, from GitHub's documentation). On a personal-account repository a non-collaborator can only fork and open a pull request from the fork.
- Measured (roles 1.2). In Process3 the coordinator owned every process decision and its builders did the work; the definition removes both.
- Reasoning. Who decides that a fault is the process's, that it blocks, and what the fix is? Who starts the fix session, on which repository, loading which approvals? Under the wall the session must work in a fork owned by the sessions' account, which no approvals text names and which Claude's GitHub connection may not cover without an act of Bob's. Section K says the wall "was never run"; it does not say that preparing a fix behind it was never run either. The title of technical point 2 also promises "which repository the coordinator holds" and the decision does not say.
- Reasoning. The process's own code is outside the three tests. Whether it has tests of its own is not stated. A wrong fix to the only push-and-merge route blocks every session, and Bob's click "cannot judge the code".

**How bad.** Stops a tranche at the first blocking process fault, and waits for Bob without telling him why.

**Answer.** Wording and a setting. Name ARCH as the session that declares a process fault and starts the fix session. Put on Bob's list one more approvals block, in the process repository. Build the wall as a GitHub rule on the process's main branch that only Bob can update, leaving the sessions' account able to push side branches and open pull requests; that is a setting, and it is the form in which "a session can still prepare a fix" is true. Say that the coordinator holds the product repository. State honestly whether the process's own code has tests. Rehearse one fix through the wall before the first tranche (a trial).

Sources: permissions_inventory 1a, 1c, 1e, Part 3; enforcement_levers levers 1, 2; roles_root_coordinator 1.2, 1.9.

---

### 11. A change across many modules has no moment to happen, and skipping its tests is an act the checker has refused once

**Counter-argument.** The fixed rule refills every slot at once and ARCH has no discretion to hold starts, so there is never a moment with no job open. A pass over many modules then collides with every open job. And a merge that skips the required tests is the kind of act the permission checker refused on 9 Nov.

**Attacks.**
- "A change that touches many modules in the same trivial way, needing no judgment, can be made in one pass. Some such changes are so trivial that module tests need not be rerun."
- "ARCH carries it out and has no discretion over it."
- "It writes only its own module's files" and "One writer per file."
- "*Decided:* ARCH, which reports it." (technical point 7)

**Evidence.**
- Measured (`merge.mjs` line 949). Process3's own rule for such a pass: "a pass runs while no job holds its modules".
- Measured (`permissions_inventory.md` 1d, 1e row 35). The checker refused an act that let a pull request through without its check: "`p3 revert exempt` ... Refused, `[CI Bypass]`" (9 Nov).
- Measured (definition J12). "The first never had a procedure."
- Reasoning. GitHub requires the test run to be green on every pull request into the tranche. For a pass that "need not be rerun", something a session controls must tell the run to report green without running. That is a switch on the required check, in session hands. Whether ARCH's merge of such a pull request passes the checker is unmeasured. No actor is named for making the pass.

**How bad.** Stops that change, or breaks open jobs' branches; could trip three refusals in a row for ARCH.

**Answer.** A structural choice. Such a pass is made only between the last merge of a round and its walk, when by definition no job is open. Say that its pull request still gets the ordinary required run on GitHub unless a trial (in J12's rehearsal) shows the checker passes the skipped form.

Sources: merge.mjs; permissions_inventory 1d, 1e; definition J12.

---

### 12. Technical point 8 is still partly Bob's, and section E describes the same repair differently

**Counter-argument.** The end of the size cap removes one of the two things that made the repair Bob's. The other is still open: whether a member's own sign-in through the runner still exists. And the repair is three different things, not all of them "in their own jobs".

