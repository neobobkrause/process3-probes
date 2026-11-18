### 28. The stop that ended Process3 is kept

**The counter-argument.** Each of your five edits to your approvals stopped every long-lived session, and after the last one the product never restarted. The second draft keeps that stop and puts its cure on the list of unproven things. Process4 will need such edits, because it changes how merges are made.

**What it rests on.** Measured: every edit of yours stopped every role (4 Nov, 5 Nov twice, 8 Nov, 9 Nov). The last product merge was at 16:35 UTC on 9 Nov; your edit merged at 16:45; nothing carrying product work moved again. You made 16 edits to the product's standing instructions in nine days. Reasoning only: that Process4 will need edits.

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
- Not answered: Process3's own inventory of permissions says that without the old record check nothing in git stops a session's proposed change from altering your approvals or the deny list. Ending that guard leaves the permission checker's refusal as the only thing in the way. The memo does not say how this sits with the recorded decision that permission management is preserved.

### 38. Ending the check on a job's own files leaves an edit to another module's files with nothing behind it

**The counter-argument.** If a job edits another module's file, test one runs only the job's own module's tests, so the edit merges untested and the other module is never told. Process3's clean record was made with a check standing in four places. Process4 ends the check and gives jobs a new reason to stray, because a job now runs while the modules it uses are unfinished. The record of your answer of 13 Nov says of this rule "Kept", and the second draft filed the ending of the check under "Claude decided".

**What it rests on.** Measured: 0 of 2,540 job commits changed another module's code or tests, with the check in place. Thirty-four blocked jobs said the fix they needed lay outside their own files and handed it on. The record cannot tell whether the check or the instructions held them. A platform document: no GitHub setting can restrict which files a push changes on a public repository. Reasoning only: the new reason to stray.

**How bad if true.** Silently spoils the result.

**The answer.** Claude decided: test one runs the tests of every module whose files a proposed change alters, so an edit that strays into another module's files is at least run against that module's tests. The rule that a job writes only its own files stays in the job's instructions, with no check. The third draft notes that the record of 13 Nov says of the rule "Kept", and that the 0 of 2,540 was measured with the check in place.
- Not answered: the reviewer said two things here were yours. Whether "Kept" meant the check. And whether test one may run another module's tests, since the second draft said "never another module's". The memo decides both as Claude's. Two jobs writing one file is still held back only by words.

### 39. Your words of 8 Nov on when a tranche ends were overturned without telling you

**The counter-argument.** Process3's decision record quotes you on 8 Nov: rounds continue until the walk of the release deployment also finds no flaws, the installer and the website are updated, "and that ends the tranche". The second draft ends the tranche at the clean internal walk, merges it to the main branch, and sends what the external walk finds to the next tranche. It follows a session's record of 13 Nov and never tells you that this replaces what you said five days earlier.

**What it rests on.** Read in the documents: your words of 8 Nov as quoted; the record of 13 Nov, "A round that completes with no failures ends the tranche. An optional multi-session deploy-and-external-walk runs after that"; your Foundations, "so nothing found waits for the next tranche". Measured: in Process3 nothing reached the main branch before a clean external walk; and the 20 of 175 of entry 4.

**How bad if true.** Silently spoils the result: the main branch receives a product no deployed walk has passed, on the strength of a record you did not type.

**The answer.** Claude decided: the conflict is declared in two places, and the definition follows the later record. This is Claude's choice between two records, not a decision of yours, and the list of your decisions as recorded asks you to correct any that is recorded wrongly (entry 70). Three consequences are stated in plain words. The main branch can receive a tranche that fails when deployed. What the external walk finds waits for the next tranche, where your Foundations said nothing found waits. Section A must not call what is on the main branch "working" without that caveat.

### 40. About thirty-five rules are held by words alone, and the one limit that held in Process3 was a test

**The counter-argument.** Process3 measured this: the rule with a hard stop behind it held all week and every rule held by words drifted. The second draft has 36 rules held by words, three of them with anything physical behind them. The hard stop that worked was a test in the process's own repository, which is not one of the three tests, and the draft does not say whether it survives.

**What it rests on.** Measured: role texts stayed between 4,032 and 4,197 bytes while the guide with no limit grew from 8 KB to 134 KB. Reviews of changes to the process were never required by Process3's tool; they were a practice, and 285 of 776 commits came from them. Reasoning only: that Process4's rules in words will drift.

**How bad if true.** Costs you time as rules drift over days, then repeats Process3.

**The answer.** Claude decided, as Claude's reading of "three tests", to be told to you: the process's own tool has tests of its own. They run only when the process itself is changed, are not among the three, and can never stop product work. The size limit on each role's starting text is one of them and stays. For the other rules held by words the memo is silent. Answer taken from the reviewer's own proposed correction: each rule that is held only by words is marked as such in the definition.
- Not answered: the reviewer also proposed deleting the rules in words that did not hold in Process3. The memo names none to delete.

### 41. A reported number becomes a target

**The counter-argument.** The second draft's own example of a bad fix began with a report: two jobs recorded a cost of zero, a report read wrong, and a session made the figure compulsory and stopped every job. Process4 keeps that report and adds numbers to it. With the job record ended, somebody must still gather time, cost, overhead and your minutes, and a session will build something to do it.

**What it rests on.** Measured: that episode took 45 minutes. Cost was recorded for 229 of 693 claims, and 106 of those said "unmeasured". Two questions of yours about a number each came back as a mechanism. 89% of commits were bookkeeping, and 105 of 508 merges changed only records. Reasoning only: that a session will build the gathering.

**How bad if true.** Costs you time.

**The answer.** Claude decided: the tranche report is produced once, at the tranche's end, only from what git and GitHub already hold. It gives time, work done, cost where it can be read and "unmeasured" otherwise, the share that was overhead, your minutes, idle time while work was ready, anything put off with its reason, and work left. No number is a target, and nothing reads the report to decide anything. The walk-step line is withdrawn (entry 23). A question from you is answered in words, never by building anything (entry 57).
- Not answered: the reviewer proposed leaving cost and overhead out until a way to read them has been measured. The memo keeps them.

### 42. The slot number: four numbers on four dates, and "for each product" settled without you

**The counter-argument.** Your words give four different numbers on four dates, and your words of 6 Nov tie the number to GitHub traffic for the whole account. The second draft states "eight by default" and "for each product" as settled and mentions only the 24 of your Foundations.

**What it rests on.** Read in the documents: 24 in the Foundations; your quoted words of 6 Nov, "as many as 8 jobs at a time" and "account wide"; Process3's decision record has the slots set to 20 on 7 Nov, and "(default: 20)" is typed in the draft field report; 8 in the record of 13 Nov. The record's own question, "is eight per product or across the account?", has no recorded answer.

**How bad if true.** Costs you time. Two products at sixteen jobs repeat the load on GitHub that your number was set against.

**The answer.** Claude decided: the third draft names the numbers and dates, and follows eight. On what the number covers: Process3 counted across the account; with one product running the two readings are the same; for two products Claude's judgment is that you tell each coordinator its own number. This is marked as a judgment on a point you were asked on 13 Nov and have not answered.

### 43. Seven standing duties in your documents are neither kept nor ended

**The counter-argument.** Seven duties in your documents are not placed. Counting permission refusals each tranche, with a trial of a few approved acts when each tranche opens and at each model release. Removing parts of the process one at a time at each model release. A check that fails any change to your approvals not made by you. The hourly sweep catching lack of progress, not only silence. Checking that every new session has started. Every requirement tested and proven met. And keeping within GitHub's published limits. The builder of Process4 will keep or drop each by its own judgment.

**What it rests on.** Read in the documents: your Foundations for the first six. For the seventh, Process3's decision record quotes you on 6 Nov, "80% or 90% of github's published limits", and on 9 Nov, "don't do it beyond just making sure that we don't exceed published limits". Measured: GitHub suspended the sessions' account on 6 Nov.

**How bad if true.** Misleads you.

**The answer.** Claude decided the general rule: a check stays only if the definition names it (entry 37). Two of the seven are named: the guard on your approvals ends (entry 37), and "every requirement is tested and proven met" is restored as a rule (entry 56).
- Not answered: the other five. The memo names none of them, so under its rule those that are checks end by not being named, which is the silence the reviewer objected to. Whether keeping within GitHub's limits counts as a "check" under that rule, the memo does not say. The reviewer's own correction was to list all seven as kept or ended, with who decided, and to say where preserving permission management and "three tests" pull against each other.

### 44. The session that fixes the process is a new kind of session

**The counter-argument.** The list of roles does not have a session that fixes the process. Your Ledger has the process built "as a product under itself", by jobs. The second draft replaces that with one-off fix sessions without saying so, and without saying who starts one or how deep it sits.

**What it rests on.** Read in the documents: your Ledger line, and the draft's list of roles.

**How bad if true.** Misleads you. The reviewer gave no grade; this one is the recorder's.

**The answer.** Claude decided: it stays, and it is added to the list of roles. ARCH starts it, and it holds the process's repository. For the rest, answer taken from the reviewer's own proposed correction: the third draft says that this replaces your line that the process is built like a product, by jobs in tranches, and that Claude decided it.
- Not answered: how deep it sits.

### 45. "Earlier modules' jobs run before later ones" was read down to a tie-break

**The counter-argument.** Your sentence of 13 Nov, "with the jobs of earlier modules run before those later in the order", is read as: among modules ready at the same moment, the earlier takes the free slot, and a later module does not wait for an earlier one. The second draft did not say that this is a reading.

**What it rests on.** Read in the documents: your requirement as an earlier audit quotes it; the record of 13 Nov gives the reading as your decision.

**How bad if true.** Misleads you. The reviewer gave no grade; this one is the recorder's.

**The answer.** Claude decided, and it is now written as Claude's and not yours: reading "earlier modules' jobs run before later ones" as the rule for who takes a free slot.

### 46. Which repository ROOT starts on is recorded two ways

**The counter-argument.** The record has your answer two ways. 13 Nov: "You start a session with the process repository mounted." 14 Nov: "ROOT starts with the product repository". The second draft uses the second and does not show you the first. ROOT as described also fails the draft's own conditions for starting a session: your plain prompt does not name ROOT's acts, and you have to choose the branch.

**What it rests on.** Read in the documents: both sentences are the session's, and the earlier one is not struck out. Measured: ROOT twice came up on an old copy (entry 26).

**How bad if true.** Misleads you.

**The answer.** Claude decided: both records are declared (13 Nov, the process's repository; 14 Nov, the product's), and the definition follows the later. This is Claude's choice between two records. That a plain start lands on your newest approvals is a build decision to be shown in a trial (entry 26). For your plain prompt, answer taken from the reviewer's own proposed correction: the draft says that your prompt does not name ROOT's acts as is required of every other session, and that whether this works is unproven.

### 47. Your option to call for a whole-product check ended without being named

**The counter-argument.** In your own words of 31 Oct the whole-product checks run "before a release or when I ask for one". The second draft tells you two of your powers stay, and does not tell you that this third one ends.

**What it rests on.** Read in the documents: your Ledger line in your own words; the record of 13 Nov, "The internal walk replaces the full regression".

**How bad if true.** Misleads you.

**The answer.** Claude decided: the option stays in this form. Your word to the coordinator runs the internal walk at any time, and the third draft says so where it lists what ends. What runs on your word is the internal walk, not the full regression your words of 31 Oct were about.

### 48. A second question was handed to you in half a sentence

**The counter-argument.** The opening of the second draft says one question is yours. A second was put elsewhere in half a sentence, with no reason and no recommendation: a clause in your approvals lets a design lane's change merge with no tests run, "which is yours to keep or drop". That is a second way to merge, outside the eight steps of a job.

**What it rests on.** Measured: the clause is in your approvals as you committed them. Read in the documents: your typed words of 14 Nov, "Bring me only what is mine to decide, with what it is, why it matters to me, and your recommendation".

**How bad if true.** Costs you time, and misleads you.

**The answer.** Claude decided: it stays. A lane's change merges with no test because none of the three applies, and the clause is among the wordings in your approvals.
- Not answered: the second draft called this yours to keep or drop, and both reviewers asked for it to be put to you properly. The memo does not put it to you.

### 49. Cost may never be reported, and the cost alarm in your Ledger is neither kept nor ended

**The counter-argument.** "Cheaply" is half of your purpose. With recording of cost ended as a duty it may never be reported: when it was a duty, 106 of 229 recorded costs said "unmeasured". The cost alarm in your Ledger ("its cost per attempt is an alarm the sweep reads, not a cap") is neither kept nor ended.

**What it rests on.** Measured: 229 recorded costs for 693 claims; 106 "unmeasured"; 111 of the 123 real figures came from two days.

**How bad if true.** Misleads you.

**The answer.** Claude decided: cost is reported where it can be read, and "unmeasured" otherwise (entry 41). The cost alarm is declared ended, together with the compulsory recording of cost.

### 50. Three measurements you asked for are neither kept nor ended

**The counter-argument.** Three times you wrote "I'm skeptical, but let's measure" or "let's try": an architecture session that keeps no memory against one that is handed over; trimming the principles each role loads; and the share of the architecture session's work that is routing. The second draft settles each matter without the measurement and without saying so.

**What it rests on.** Measured: none of the three was ever taken. A platform document: a session started by an alarm cannot start sessions (0 of 3, 2 Nov), which rules the first one out.

**How bad if true.** Minor in effect; misleads you by silence.

**The answer.** Claude decided: all three are declared ended, unmeasured, with the reason given for each.

### 51. The two-part test run was kept on the ground that "it costs little"

**The counter-argument.** The second draft keeps running the tests in two parts because "it costs little", while saying itself that the failure this guards against was never seen. That is Process3's reasoning in one line, and a precedent for every later session. The second part's job in Process3, posting the record the merge tool checked, has also ended.

**What it rests on.** Measured: an earlier worker's caution that such rules are "cheap and inert rather than proven"; the second part's purpose, read from Process3's own files.

**How bad if true.** Minor in itself; harmful as an example.

**The answer.** Claude decided: it is kept. Corrected in the third draft: the reason is not "it costs little". It is kept because removing it changes how secret keys reach test code, which is part of the permission management that the record has you preserving.

### 52. The tranche report has no author

**The counter-argument.** Nobody is named to produce the tranche report, and cost "where it can be read" was often not readable.

**What it rests on.** Measured for cost (entry 49). Reasoning only for the author.

**How bad if true.** Minor.

**The answer.** Claude decided what the report holds and when it is made (entry 41).
- Not answered: who produces it.

---

## Group 5. Restored from your documents

### 53. The change across many modules lost its two conditions and has no moment to happen

**The counter-argument.** Your line had a change across many modules made by a helper in the architecture session, while no job runs, with any module that needs judgment getting its own job. The second draft dropped both conditions and named nobody. Because the fixed rule refills every slot at once, there is never a moment with no job open, so the pass would write files that open jobs are also writing.

**What it rests on.** Read in the documents: your Foundations line; the record of 13 Nov, "The cross-module mechanical pass is preserved". Measured: Process3's own rule was "a pass runs while no job holds its modules"; the second draft itself admits the pass never had a procedure. Reasoning only: the collision with open jobs.

**How bad if true.** Stops a tranche, or spoils open jobs' work, the first time it is used.

**The answer.** Restored from your documents: the change is made by a helper inside ARCH's session, and a module where it needs judgment gets its own job. Claude decided the moment: between a round's last merge and its walk, when no job is open. Unproven; it is in the rehearsals. Skipping the tests for such a change is entry 68.

### 54. Nothing prepares the next round or tranche

**The counter-argument.** Your principle that the architecture session gets the next stage ready while this one runs is gone, and nothing says where a tranche's work comes from when it opens.

**What it rests on.** Read in the documents: your Ledger line, kept on 3 Nov. Measured: gaps of 11.4, 8.7, 7.6 and 6.3 hours between merges that carried code on 7 and 8 Nov.

**How bad if true.** Costs you time at every tranche boundary, and stops a tranche from starting if no module has work marked.

**The answer.** Restored from your documents: while a tranche runs, ARCH prepares what the next round or tranche needs, so that it opens the moment this one closes.

### 55. Your own brake on growth was gone, and the rule said to replace it is narrower

**The counter-argument.** Your sentences that caution is a cost, and that the default answer to an unmeasured worry is no change, appeared nowhere in the main text. The second draft ended the rule that every addition cite its authority and said the rule on process fixes "now does its work". That rule forbids only a new test, gate, review or stop. It does not cover new records, rules, alarms or duties, which the draft itself names as part of what killed Process3.

**What it rests on.** Read in the documents: your Foundations; Process3's decision record quotes you on 7 Nov, "make sure that this baseless overcaution NEVER happens. NEVER!". Measured: the 121 additions were of "a check, gate, refusal, hold, review requirement, audit, alarm or bookkeeping duty".

**How bad if true.** Silently spoils the result: the way Process3 grew is only half forbidden.

**The answer.** Restored from your documents: the two sentences, as rules for every session. They are rules in words and nothing enforces them. Corrected in the third draft: "now does its work" goes. What Claude decided to draw from the two sentences is in entry 2.

### 56. "No requirement goes untested" was lost again

**The counter-argument.** On 3 Nov you kept "no requirement goes untested, which was lost". It is lost again. The main text never says a module's tests must cover every requirement, so "the tests pass" can mean that no test exists for a requirement marked as met.

**What it rests on.** Read in the documents: your Ledger line and its note. Measured: Process3's form of this rule was loosened after 22 hours and removed on 9 Nov. Reasoning only: the effect.

**How bad if true.** Silently spoils the result.

**The answer.** Restored from your documents, as a rule for the job with nothing checking it: every requirement is tested at the module's interface and proven met. Whether a rule with nothing checking it holds is carried in entry 6.

### 57. Every word you say to the coordinator was to be "followed"

**The counter-argument.** Your Ledger says only words you explicitly mark become decisions. The second draft says the coordinator passes on whatever you tell it, "and they are followed". In Process3 "BE CAREFUL" became one job at a time and a minute between writes, and four questions of yours in 26 hours each came back as a mechanism.

**What it rests on.** Read in the documents: your Ledger line; the record of 13 Nov, which names "every utterance of yours being turned into a new rule until the rules overflow". Measured: of the items carried as yours across handovers, 14 of 21 were found on 5 Nov to be mechanisms.

**How bad if true.** Silently spoils the result, as rules grow back out of conversation, and costs you time.

**The answer.** Restored from your documents: only words you mark as a decision or an instruction are passed on and followed. The rest is conversation, and a question from you is answered in words, never by building anything.

### 58. How a blocker or a question that is yours reaches you was missing, and "CAN RUN" had become "runs"

**The counter-argument.** Your lines say a blocker that only you can clear reaches you while other work goes on, and that what is yours comes to you explained, with options and a recommendation. The second draft tells you only when everything has stopped, names no session that brings you a question of yours, and turns your "CAN RUN", in your capitals, into "runs".

**What it rests on.** Read in the documents: your Ledger lines; the stored change of 3 Nov, "runs" changed to "CAN RUN". Reasoning only: that blockers which are yours pile up unseen until nothing else can move.

**How bad if true.** Costs you time, and misleads you about what you will be told.

**The answer.** Restored from your documents: the process "can do so with nobody watching". A blocker only you can clear is told to you at once, with options and a recommendation, while other work goes on. A design is settled before anything is built.

### 59. Design lanes were named once and defined nowhere

**The counter-argument.** Design lanes are in your approvals and in two of your Ledger lines, partly in your own words. The second draft gives them nine words in a list and no place among the sessions: who starts them, whether they take a slot, whether you talk to them.

**What it rests on.** Read in the documents: your Ledger lines and your approvals.

**How bad if true.** Costs you time.

**The answer.** Restored from your documents: design lanes are added to the list of roles, from your lines. ARCH defines them, and user experience is always present. Their merging with no test is entry 48.
- Not answered: whether a lane takes a slot.

### 60. The fresh session after two failed corrections: your reason was cut

**The counter-argument.** You wrote on 31 Oct that the restarted session "should recognize that corrections were made and try to understand why to anticipate all other needed corrections so it doesn't continue to fail". The second draft kept the brief and cut the purpose.

**What it rests on.** Read in the documents: your own words in the Ledger note. Your Foundations carried the purpose whole.

**How bad if true.** Costs you time; minor in wording.

**The answer.** Restored from your documents, quoting your words: the fresh session's first task is to understand why the corrections were needed, so as to foresee the others.

### 61. Four kinds of session the draft relies on were not listed, and nobody was named to tell you anything

**The counter-argument.** "Who does what" names five kinds of session. The text relies on four more: the standby, design lanes, the session that fixes the process, and the sessions that walk. Who starts each, and on which repository, is not said. The draft asks which repository the coordinator holds and does not answer. Nothing says which session tells you what ARCH decided, or brings you the questions that are yours.

**What it rests on.** Read in the documents: your Foundations, that the architecture session "reports it to you in plain words as done", and that questions that are yours "are asked in one place".

**How bad if true.** Misleads you, and costs you time. The reviewer gave no grade; this one is the recorder's.

**The answer.** Restored from your documents: ARCH records its decisions in the product's decision file, and the coordinator reports them to you in plain words, one line each. A design is settled before anything is built. The questions that are yours come in one place, each as what it is, why it matters and a recommendation. Claude decided: design lanes, the walking sessions and the session that fixes the process are added to the list of roles; the standby is dropped (entry 15); the coordinator holds the product's repository.

### 62. The tranche report had lost three things your lines put in it

**The counter-argument.** The report in the second draft leaves out the architecture session's idle time while work was ready, what was put off and why, and the work left.

**What it rests on.** Read in the documents: your two Ledger lines. Measured: idle time is the only stated measure of whether the slots were kept full; Process3's alarm for it misfired for 2 hours 22 minutes.

**How bad if true.** Misleads you.

**The answer.** Restored from your documents: all three are in the report (entry 41).

### 63. Nothing said where decisions are kept

**The counter-argument.** Your kept line says decisions go to short records the moment they are made, each in its own file, never as a line in a long plan. The second draft says nowhere where ARCH's decisions, or yours, are kept.

**What it rests on.** Read in the documents: your Ledger line. Measured: Process3's one decision file grew to 49 KB and 31 headings in four days, and 23 of its 26 process decisions are headed "coordinator".

**How bad if true.** Misleads you.

**The answer.** Restored from your documents, in part: ARCH records its decisions in the product's decision file, and the coordinator reports them to you. Your own decisions of 13 and 14 Nov are listed once, near the top of the definition (entry 70).
- Not answered: your line says each decision has its own file. The memo names one file, which is the form that grew in Process3.

### 64. Your suggested model and effort would not reach the jobs

**The counter-argument.** The second draft says ROOT passes your suggested model and effort to every session it starts. Jobs are started by ARCH, not by ROOT, and the platform does not hand effort down. Your own note also asks for "always a model and effort sufficient for quality, and a permissions mode appropriate for the task at hand". The first clause was lost, and the second cannot be met.

**What it rests on.** A platform document: effort is "not inherited" by a new session, and no locked-down session can exist on the account. Measured: effort for each role was never set anywhere in Process3's tool.

**How bad if true.** Misleads you; minor. A job on a weak model costs a round.

**The answer.** Restored from your documents: "always a model and effort sufficient for quality". Claude decided: every session passes your suggestion on to each session it starts. Corrected in the third draft: Auto mode is the only permission mode the platform allows here, which overrides your "permissions mode appropriate for the task".
- Not answered: nothing shows that a suggested effort reaches a job. The reviewer calls it unproven. The memo does not put it on the list of unproven things.

### 65. Your proof by a slice of the real product had become a list of small trials

**The counter-argument.** Your Ledger makes the proof "one shadow of a representative slice" of the real product and then the first real tranche. You dropped the line that certified a process on a two-module toy. The second draft's small trials stand where the slice stood, and its heading says a small trial can "prove".

**What it rests on.** Read in the documents: your Ledger lines; your Foundations, "Toy flaws and product flaws were disjoint".

**How bad if true.** Misleads you: a passed toy trial read as proof.

**The answer.** Restored from your documents: the requirement of "one shadow of a representative slice". Corrected in the third draft: each trial "could break" its claim, and proof is the first real tranche. The draft says that the combined run of the trials is that slice.
- Not answered: the memo does not say that the combined run will be made on a representative slice of the real product.

### 66. How many sessions walk, and your caution about Cloudflare's limits

**The counter-argument.** "By journey" answers how the walk is shared out, not how many sessions walk. Your caution of 8 Nov is missing: "be careful that there aren't too many external walkers to cause the Cloudflare system to exceed limits of the account".

**What it rests on.** Read in the documents: your words as Process3's decision record quotes them.

**How bad if true.** Minor.

**The answer.** The memo is silent. Answer taken from the reviewer's own proposed correction, a restoration from your documents: your caution is added, and the draft says the number is not yet set.

---

## Group 6. Corrected wording, attribution or numbers

### 67. New sessions failed to start, silently, at about 50 live sessions

**The counter-argument.** At about 50 live sessions the account stopped starting new ones while still reporting success. A round of about 170 jobs leaves finished sessions behind. If finished sessions count, the slots look full and nothing is running, while the second draft says nothing depends on archiving a session.

**What it rests on.** Measured: one event, on 1 Nov; Process3 relied on archiving in practice. Not measured: whether a finished, idle session counts.

**How bad if true.** Silently stalls a round.

**The answer.** Corrected in the third draft: this goes on the list of unproven things. New starts failed silently at about 50 live sessions, once; a round may need about 170 jobs; whether finished sessions count is unmeasured. Nothing is decided. The reviewer says one measurement before the process is in force would settle it.

### 68. A change across many modules may skip its tests on a session's judgment

**The counter-argument.** "Some such changes are so trivial that module tests need not be rerun." GitHub lets nothing into the tranche branch without the tests passing. So either the check reports a pass without running, which is a way round the only gate, opened on a session's judgment, or the change cannot merge. The permission checker has refused an act of this kind once.

**What it rests on.** Measured: on 9 Nov the checker refused an act that let a change through without its check, under the label "CI Bypass". Process3 built a lighter gate for changes to records only and narrowed it two hours later. Reasoning only: the either-or.

**How bad if true.** Silently spoils the result, rarely; or stops that change; and could bring three refusals in a row on ARCH.

**The answer.** Corrected in the third draft, as a matter of attribution: the sentence stands in the session's record of 13 Nov, so it is kept and attributed to that record, not written as words you typed. The draft notes that skipping the required test was refused once on 9 Nov and is unproven.
- Not answered: how such a change would merge.

### 69. Nothing says which document governs

**The counter-argument.** After this definition your stored Ledger still shows "keep" or "modify" for every line the definition ends. Nothing in the main text says which document governs, and a Process3 session brought back a removed check by citing Ledger lines.

**What it rests on.** Measured: the stored answers; the check brought back (entry 37).

**How bad if true.** Silently spoils the result. The reviewer gave no grade; this one is the recorder's.

**The answer.** Corrected in the third draft, in one sentence: the Ledger is unchanged; where the two differ, this definition states which decision it follows; and your Ledger is yours to change. The reviewer proposed the words "the definition governs once you accept it". The memo's sentence does not say that.

