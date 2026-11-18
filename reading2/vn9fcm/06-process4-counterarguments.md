**How bad if true.** Stops a tranche, each time you do the one thing only you can do.

**The answer.** Claude decided: the comparison stays as in Process3, as part of the permission management that the record has you preserving. Its known cost is stated plainly instead of promising otherwise: after you edit your approvals, every long-lived session stops, and you restart ROOT. So an approvals edit is one act together with the restart, and it goes on the list of your acts in that form. What is to be tried becomes: after an edit and a restart, the whole chain runs on the new approvals. Unproven.
- Not answered: the stop itself is kept, so the counter-argument stands, now as a stated cost. The reviewer's remedy, that no session lives across one of your edits so that the comparison can be removed, is not taken.

### 29. Nothing says how a tranche ends in practice, and its merge into the main branch has never been done

**The counter-argument.** A tranche ends only on a walk with no failures, which Process3 never reached in nine days, and then by a merge into the main branch that never once happened on this product. The second draft does not say who makes that merge, or what test run GitHub requires on it: either every module's tests, which is the full regression that has ended, or nothing.

**What it rests on.** Measured: the main branch never moved after 1 Nov, and the tranche is 7,339 commits ahead of it. A merge of a tranche into a main branch was done only on a practice repository on 2 Nov. Process3 met the problem on 4 Nov: two sets of tests take 40 to 42 minutes each. In Process3 a walk counted as clean with known gaps put off on your word. Reasoning only: the either-or.

**How bad if true.** Stops a tranche from ever reaching the main branch, or misleads you about what "merged to main with the tests passing" meant.

**The answer.** Claude decided: ARCH opens and merges that proposed change. The third draft says honestly that none of the three tests runs there, so the rule on the main branch requires only whatever GitHub setting you have set. "With the tests passing" is corrected to say that tests run on jobs' changes into the tranche branch. This merge never happened in Process3; it goes on the list of unproven things with a rehearsal. Nothing limits the number of rounds, and only your word ends a tranche that will not come clean (entry 1).

### 30. "The merge wakes ARCH at once" names nothing that could wake it

**The counter-argument.** ARCH is the one that merges, so a merge cannot be what wakes it. What must wake ARCH is the test run finishing, and the platform sends a proposed change's events to one session only, so either ARCH or the job is left uninformed. A replaced ARCH keeps the events until it ends.

**What it rests on.** A platform document, the platform's own descriptions of its tools as read on 14 Nov: "A PR's events go to one session at a time" (a PR is a proposed change), and "a session that finishes cleanly may not report back". Measured: a finished job went unnoticed for 194 minutes; 21% of module test runs failed on 7 and 8 Nov; an architecture session lasted about 24 merges before it was replaced. Reasoning only: the stall after each replacement.


A requirement on what a job hands in: the reviewer for jobs has changed. Handover notes now carry the line `reviewer: Odette Fairweather`, and the name Ruairi Mactavish is no longer written anywhere in a handover note.

**How bad if true.** Stalls every round.

**The answer.** Claude decided: the job stays the listener to its own proposed change's test result, fixes its own failures, and sends ARCH one message when the tests pass. ARCH merges and refills the slot. "The merge wakes ARCH at once" is removed. The trial is enlarged to eight slots, one failing job and one replacement of ARCH. Unproven.

### 31. A job stopped by another module's fault has no way through

**The counter-argument.** GitHub will not merge a change whose test run is failing. If the failure comes from another module, the job may not fix it and cannot merge, and the second draft does not say whether it keeps its slot. Eight such jobs would hold all eight slots. And naming "a failure already on the tranche branch" needs a test run that none of the three tests has.

**What it rests on.** Measured: 48 of 165 records of a blocked job named tests that were already failing on the tranche before the job began; Process3 needed a separate mechanism to tell. Reasoning only: that the slots fill.

**How bad if true.** Can stop a tranche.

**The answer.** Claude decided: the sentence "A failure already on the tranche branch before the job began is named, and is not the job's to fix" is removed. In its place: if a job's module tests fail because of a flaw in another module, the job reports the flaw to ARCH, records that it is blocked, pushes and stops, and its slot is freed. When the other module merges, the notice makes this module's job ready again. Not tried.

### 32. Seven modules with work own no code, four do not exist yet, and 52 code files belong to no module

**The counter-argument.** The second draft says a module has its own files and a job writes only its own module's files. On the real list, seven modules with work own only a requirements file and tests, four are new and have no files at all, and 52 code files belong to no module. Those jobs cannot write the code that would meet their requirements, and a walk finding in an unowned file has no module to be named.

**What it rests on.** Measured, counted on 14 Nov: 29 of 220 modules own no code; eleven of them carry unmet marks, 124 of the 466; 52 code files have no owner (the replay counts 49).

**How bad if true.** Stalls the first round for 11 of the 65 modules with work.

**The answer.** Claude decided: ARCH edits the module list, folding the modules that hold only requirements back into the others now that the size limit on requirement files has ended, and giving the unowned files an owner. The definition of "module" is corrected to match. See the tension noted in entry 14.

### 33. A fault in the process has nobody to report it, judge it or start the fix

**The counter-argument.** "Claude fixes it" names no session. The coordinator decides nothing, ARCH decides only the product, ROOT builds nothing. Your Ledger lines on how a flaw is reported, and that a flaw "is never fixed in place", are gone. Approvals belong to one repository each, and only the product's are on the list of your acts.

**What it rests on.** Measured: after your approvals were split by repository, pushes from sessions in another repository were refused 2 of 2 on 8 Nov. In Process3 the coordinator owned every decision about the process. Both of your Ledger's routes for reporting a flaw were never built. Reasoning only: the effect.

**How bad if true.** Stops a tranche at the first blocking fault in the process, and waits for you without telling you why.

**The answer.** Claude decided: any session reports a process fault to ARCH. ARCH starts the fix session, which holds the process's repository. Your standing approvals must also be committed in the process's repository, so your act of committing approvals becomes: both repositories, at the start. The coordinator holds the product's repository. Answer taken from the reviewer's own proposed correction, restoring your Ledger's words: a session that finds a fault in the process does not fix it where it stands. The reviewer's worry about preparing a fix behind the wall falls with the wall question as written (entry 17).

### 34. The hourly alarm would undo a stop

**The counter-argument.** An hourly alarm whose job is to restart stopped sessions will undo a stop on your word, or a switch of accounts, unless it is switched off, and the second draft says nothing may depend on switching an alarm off.

**What it rests on.** Measured: after your stop of 9 Nov the hourly task kept firing and had sent 94 notifications by 13 Nov. The switch of accounts failed on 5 Nov and was cancelled on 7 Nov. A replaced session's alarm keeps firing into the old session.

**How bad if true.** Costs you time at every stop or switch, and can leave two ROOTs on one product.

**The answer.** Claude decided: on your word the coordinator tells ARCH, and ARCH interrupts each job. The stop is a line in the shared state that names the account, read by ROOT at every wake, so the hourly alarm does not undo it. Unproven; it is in the rehearsals.
- Not answered: the rule by which ROOT judges that a session "has stopped", which the reviewer asked for.

### 35. The walks as described never ran that way, and nobody is named to turn a finding into work

**The counter-argument.** Process3 ran the internal walk as one script started by the tool in one session. "Several sessions, by journey" is new and was not listed as unproven. Nobody is named to turn a finding into a module's work. The walks took about an hour, while a session can keep something running in the background for about thirty minutes, and the draft does not say where the walk runs. The trial offered can break the claim that the walk finds what a full regression would; it cannot support it.

**What it rests on.** Measured: one run, started by the tool. On 8 Nov the work to share a walk between sessions was still to be done. The two late external walks took 60 and 64 minutes. A platform document: the thirty-minute limit, as your Foundations record it. Reasoning only: what the trial can show.

**How bad if true.** Stalls the end of the first round, and misleads you about what the trial can show.

**The answer.** Claude decided: ARCH starts the walking sessions and turns each finding into work for a named module. Corrected in the third draft: "several sessions, by journey" never ran in Process3 and is marked unproven. Where the walk runs is a build decision, also unproven; in Process3 the walks ran on GitHub's machines because of that limit. The trial's entry says it can break the claim only.

### 36. The check on declared uses inside test one either fails on day one or cannot see the hole

**The counter-argument.** Test one includes a check that the uses a module declares match what its code imports. If "code" includes the tests, about 200 imports fail on the first day. If it does not, the undeclared uses stay invisible. The second draft does not say which.

**What it rests on.** Measured. The reviewer gives 202 undeclared imports in tests and 38 pairs of modules where a test imports a later module. The replay counted again: 198 imports, 122 undeclared pairs in all by test import, 36 of them to a later module, and none in code that is not a test.

**How bad if true.** Stops jobs in up to 63 modules, or leaves the hole.

**The answer.** Claude decided: which of the two the check covers is a build decision, and the third draft says the check either fails on those imports on day one or cannot see the undeclared pairs. The undeclared pairs are repaired by ARCH correcting the module list, that is, declaring them.
- Not answered: which of the two it will be.

### 37. Checks that could stop work are among the lines that "stand as written"

**The counter-argument.** The second draft says there are three tests and no others, and in the same breath that 208 of your lines "stand as written". Several of those lines are, or were held by, a check that stops work, and the main text does not say which stay. A session can cite a "kept" line to rebuild its check, as happened before.

**What it rests on.** Measured: in Process3 a check removed at your instigation was restored within ten hours by a session citing Ledger lines. Thirty-four of your 151 kept or modified Ledger lines appear nowhere in the main text except under the words "208 stand". Reasoning only: that a Process4 session would do the same.

**How bad if true.** Silently spoils the result as checks grow back, or stops a tranche.

**The answer.** Claude decided, as following from "three tests, ever": a check stays only if the definition names it. These end: the check of your credentials when a tranche opens; the check of the process's version when a session starts; the check that a product's copy of the process's files has not drifted; the guard on your approvals inside the old record check; the format and coverage checks; the re-run of checks when a tranche closes; and the check that no built file is committed. That last rule stays as words, and Claude decided that a module's own job builds and commits its built files in its own change. A job running its own module's tests in its session before it pushes is the job's own practice, not a gate, and stays as that. The rule that a test checks a text's key and not its words stays as a rule for writing tests, with no check.
