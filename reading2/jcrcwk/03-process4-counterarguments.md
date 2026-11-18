**What it rests on.** Measured: on the morning of 8 Nov, on one build, the internal walk marked 238 of 238 steps ok and the external walk passed 20 of 175, with 1,691 failures. Late on 8 Nov: internal 287 of 357, external 10 of 157. 218 of 220 jobs were complete while the deployed product failed 147 of 157 steps. Five releases in a row each broke an existing user's stored data, unseen because every test builds a fresh store. Reasoning only: that nothing in the draft says what runs when the tranche merges into the main branch; that "the first work of the next tranche" assumes there is a next tranche.

**How bad if true.** Silently spoils the result, and misleads you.

**The answer.**
- Corrected in the third draft: section A no longer calls what is on the main branch "working" without the caveat that the main branch can receive a tranche that fails when deployed.
- Claude decided: the conflict between your quoted words of 8 Nov and the record of 13 Nov is declared, and the later record is followed (entry 39). None of the three tests runs when the tranche merges into the main branch, and the draft says so (entry 29).
- NO ANSWER FOUND, carried as an unproven risk: nothing keeps "three tests, ever" and also makes the main branch hold a product measured to work when deployed. Also carried as unproven: the whole path to a release, including a real install into an empty account. No release of any kind was cut in Process3.
- Not answered: the reviewer asked for both walks to be run once on one build, to measure the gap of 8 Nov again. The memo does not take it up.

### 5. Growth moves to wherever nothing stops it

**The counter-argument.** Whatever is done to protect the process's own repository, the growth does not stop. It moves to places that protection does not cover, most of which leave no record: the product's own tests, the walk, the text one session types to another, scheduled tasks, the product's settings and its module list.

**What it rests on.** Measured: 211 test files (11,410 lines) written for the process and not the product sat among the product's tests, 26% of the week's net growth in tests. One settings file in the product grew from 24 lines to 421. The files that tell GitHub what to run grew from 446 lines to 1,021. Twenty-six handover notes each grew a new list of "rules in force" within a day of being cleared. Reasoning only: that Process4's sessions would do the same.

**How bad if true.** Silently spoils the result, over days. In the reviewer's words, it repeats Process3 in the places not covered.

**The answer.** NO ANSWER FOUND, carried as an unproven risk. Any stop in those places is a check. The third draft says in plain words that the fixed version put to you in entry 13 stops nothing outside the process's own repository, and lists what is left. A test or walk step that serves the process is forbidden in words only (entry 2).

### 6. A job writes the tests that judge its own work, and nothing else looks at nineteen requirements in twenty

**The counter-argument.** A job writes the code, writes the tests, strikes its own "not yet met" mark and merges with no reader. The only other look at the product is a walk of a few hundred steps over a product with nearly nine thousand requirements.

**What it rests on.** Measured: 8,838 requirement numbers against 236 to 357 walk steps. Ten of the week's twenty recorded false "done" findings were tests that pass whether or not the change is present. On the one day with a count, 20 of about 155 "complete" claims were refuted by the tests run on GitHub, about 13%. Reasoning only: that a module's tests run only when its own files change, so a failing set of tests can travel to the main branch unseen.

**How bad if true.** Silently spoils the result.

**The answer.**
- NO ANSWER FOUND, carried as an unproven risk. The list of unproven things says plainly that a job writes the tests that judge its own work, that about nineteen requirements in twenty have no other look than the walk, and that half of the week's recorded false "done" findings were tests that pass either way. Every remedy the reviewer could see is a check that has ended.
- Restored from your documents, as a rule for the job with nothing checking it: every requirement is tested at the module's interface and proven met (entry 56).
- Not answered: the failing tests that travel unseen. The memo does not mention them, and the reviewer found no answer.

### 7. Most jobs would be started by notices that need no change, and such a job cannot finish

**The counter-argument.** In Process3 nine notices in ten needed no change, and a cheap helper cleared each for about 20 cents. In the second draft each notice gives a module "work" and takes one of the eight slots with a whole job, so most jobs would be for modules where nothing needs changing. Such a job has nothing to merge, so by "done means merged" the round never closes.

**What it rests on.** Measured: 2,101 of 2,342 judged notifications were "not affected" (89.7%). The helper's reading cost a median of $0.20; a job cost a median of $2.45. A module has 14.2 declared users on average (the middle value is 8, the most 213). Reasoning on measured inputs, from two simulations that are not measurements: for the 65 or 66 modules with real work, about 177 jobs, about 100 of them finding nothing to change; in a first round 59% to 71% of job starts come from notices alone, and in the later rounds about nine in ten. Reasoning only: that a job with nothing to change cannot finish.

**How bad if true.** Stops a tranche by the letter, because rounds cannot close. Read loosely, it costs you most of the slots and most of the money on jobs that change nothing.

**The answer.**
- Claude decided: a module's work in a round is finished when its job merges, or when its notified job reports that nothing needs changing. That report is the job's closing message to ARCH. No file, and no merge of a record.
- Corrected in the third draft: the rule for who is told is stated the same way everywhere. Every module that declares a use is told on any merged change to the provider's source or requirements file. A notified job reads the named parts and decides. If it changes its module, the module's whole tests run on GitHub as test one. If nothing needs changing, it runs nothing.
- Corrected in the third draft: the price is stated, as an estimate from a simulation on the real module list and not as a measurement.
- NO ANSWER FOUND, carried as an unproven risk: no remedy within the rules was found for the needless jobs. Process3's remedy was a helper judging each notice first, which is a judgment by a worker. It is also carried as a technical point Claude will settle after the replay (see the last section).

### 8. ARCH is one long-lived session

**The counter-argument.** ARCH starts every job, types every job's instructions and passes every notice. In Process3 the long-lived coordinating session was replaced about 25 times in six days, and each handover note grew its own rules again within a day. One long session summarising itself is the same chain in one body.

**What it rests on.** Measured: about 25 replacements in six days; 26 handover notes that grew rules again. Reasoning only: that ARCH would drift in the same way.

**How bad if true.** Costs you time: drift over days.

**The answer.** NO ANSWER FOUND in the memo for the drift. The reviewer's remedy, replacing ARCH at the end of every round, is a design choice the memo does not take. What the memo does say about replacing ARCH is in entry 27.

### 9. A second suspension of the sessions' GitHub account could hide the record

**The counter-argument.** With the job record ended and each job's working state kept in its proposed change on GitHub, a second suspension of the sessions' account could hide that record with the account.

**What it rests on.** Measured: the account was suspended once, on 6 Nov. Reasoning only: the hiding. The reviewer says it was not measured.

**How bad if true.** The reviewer says only "real, unproven". At the least it costs you time.

**The answer.** NO ANSWER FOUND. The memo is silent. Carried as an unproven risk, which is the reviewer's own statement of it.

### 10. "Once" is not defined

**The counter-argument.** The second draft lets a process fix reach a running tranche "only for a blocking fault, once". If "once" means once in a tranche, the second blocking fault has no route. If it means once for each fault, it is what Process3 did 116 times.

**What it rests on.** Measured: the process's version moved 116 times in nine days. Reasoning only for the rest.

**How bad if true.** Costs you time, or stops a tranche at its second blocking fault.

**The answer.** NO ANSWER FOUND. The memo does not define the word. If you take the fixed version in entry 13, each move during a tranche is an act of yours, one for each fault that stops work. If you do not, the word is still undefined.

### 11. Nobody is named to count a job's failed corrections

**The counter-argument.** "After two failed corrections ARCH replaces the session." Who counts the corrections, and where the count is kept, is not said.

**What it rests on.** Reasoning only.

**How bad if true.** Minor.

**The answer.** NO ANSWER FOUND. The memo is silent on who counts. What the fresh session then does is restored in entry 60.

### 12. "Nothing on a live site" against a deployment the process makes

**The counter-argument.** The second draft says the process owns "nothing on a live site". Elsewhere it has the process deploy the product to a development site and walk it there.

**What it rests on.** Reasoning only: two sentences of the draft read side by side.

**How bad if true.** Minor.

**The answer.** NO ANSWER FOUND. The memo is silent, and the reviewer proposed no wording.

---

## Group 2. Put to you as a question

### 13. With a wall the process waits for you; without one, only words stop a repeat


At Osk the clerk wrote down 6 cedars.

**The counter-argument.** With a wall round the process's repository, where only you can merge a change to the process, every process fault that stops work waits for you, at night, and your click, which cannot judge the code, turns a session's addition into "Bob approved it". Without a wall, nothing but words stops a repeat of Process3, and the second draft says so itself.

**What it rests on.** Measured: one question that sessions carried as yours waited about nine hours on 5 Nov. Of 159 drafted Ledger lines, 151 were accepted; 20 audit lines were answered in three minutes with none dropped. The heaviest single check of the week entered by your own commit of 7 Nov, drafted in answer to a session's finding. Sessions made and merged 270 of the 296 changes to the process; 121 of the 296 added a check; a change to the process was running on the product a median of 3 to 21 minutes after it merged; the process's version moved 116 times. A platform document, as another worker quoted it: a proposed change's test run takes its instructions from the proposed change itself. Reasoning only: that a blocking fault in the first hours of a new tool is the expected case; that a blocked session will route round the process.

**How bad if true.** With the wall: stops a tranche repeatedly, costs you time at night, and misleads you about what you approved. Without it: repeats Process3.

**The answer.** Put to you as a question, the first of the questions that are yours, in a new form. The wall question as the second draft wrote it is withdrawn (entry 17). The memo frames the new question like this:
- Within your requirements as they stand (Claude decides and fixes the process; you take no act on it; it runs unattended), nothing physical stops a session adding to the process. Every physical stop that was found needs an act of yours each time the process changes.
- One narrower form asks for no judgment and no merge from you. Sessions go on deciding and making every process fix, but the version of the process that a product uses is fixed for a whole tranche by a setting only you can change. Your documents already require "one fixed version per tranche, changed only by a recorded act". The cost to you: one settings change at the start of each tranche, and one more whenever a process fault stops work during a tranche, while the product waits for you. It does not stop additions gathering between tranches, which you would take on whole when you move the setting. It stops nothing outside the process's own repository. It is untested; how the setting is built is Claude's to work out and to try before it is relied on. How often a small Process4 meets a blocking process fault is unknown.
