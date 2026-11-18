**How bad.** Stops the first round at the first ARCH or coordinator replacement; makes "a stop on your word" not work; leaves the status read-out with nothing to read.

**Answer.** A structural choice plus wording. Name one home that is not a job's pull request and does not need a merge: for example one GitHub-side object per product (a pinned issue, or repository variables, which `enforcement_levers.md` lever 2 records the sessions' account can write), holding the addresses, the slot number and the stop. Say who writes each line. Say that a stop reaches running jobs by ARCH interrupting them (measured in Process3: 14 of 15), not by their reading a file. Notices and findings for a module with no open job need a named place too. All unproven; add one rehearsal of an ARCH replacement with jobs open to section J.

Sources: roles_root_coordinator 1.2 to 1.4, 3.2; permissions_inventory 1e; causal_forensics section 6 (state branch volume); definition J12.

---

### 4. "The merge wakes ARCH at once" names no mechanism, and the only one available serves one session per pull request

**Counter-argument.** ARCH is the one that merges, so a merge cannot be what wakes it. What must wake ARCH is the test run finishing, and the platform sends a pull request's events to one session only, so either ARCH or the job is left uninformed.

**Attacks.**
- "ARCH merges it into the tranche branch once the tests pass".
- "The merge wakes ARCH at once and the slot goes to the next ready job."
- "*A failure* goes back to the job."
- "Sessions are woken by events, such as a job finishing or merging; the hourly alarm is only the safety net."
- "Nothing needed for correctness depends on archiving a session".

**Evidence.**
- Platform text (tool definition of `subscribe_pr_activity`, today): "A PR's events go to one session at a time. ... This session can take over only once that one stops: it unsubscribes or ends".
- Platform text (tool definition of `create_session`, today): "a session that finishes cleanly may not report back". So "a job finishing" is not an event the platform delivers.
- Measured (`foundations.md`, A job's life, step 2). Process3 had the architecture session subscribe to each job's pull request; "with no event, BOB noticed attempt 1's completion after 194 minutes". It also had jobs send a message. The median wait from finished job to merge was 8 minutes before the merge train (`levers`, 2.1).
- Measured (`product_side.md` 6; `redteam_feasibility.md` finding 5). 21% of module test runs failed on 7 to 8 Nov; 2.1 test runs per landing (495 runs for 238 landings).
- Measured (`roles_root_coordinator.md` 1.4). 21 architecture sessions for 508 landings: about 24 landings per session before it filled.
- Reasoning. If ARCH holds the subscription, every result of every open pull request is an ARCH turn, and every failure must be relayed to the job by a further message. If the job holds it, ARCH learns nothing unless the job tells it. When ARCH is replaced, the old ARCH keeps the subscriptions until it "unsubscribes or ends"; a dead or silent ARCH can do neither except by being archived, which the definition says nothing may depend on. At Process3's rate ARCH would be replaced about seven times in a round of the size finding 5 predicts.
- Reasoning. Trial J6 (two slots, three modules) cannot show any of this: it has no failing run, no eight open pull requests and no replacement.

**How bad.** Stalls every round: after each ARCH replacement freed slots wait for the hourly alarm, and that alarm wakes ROOT, not ARCH.

**Answer.** A structural choice and a wording change. The job stays the one subscriber of its own pull request: it fixes a failing run itself, and when the run is green it sends ARCH one message. ARCH then needs one turn per job and holds no subscriptions to lose. Rewrite step 8 to say that the job's message wakes ARCH. Enlarge trial J6 to eight slots, one failing run and one ARCH replacement mid-run.

Sources: foundations "A job's life"; redteam_feasibility finding 2 (still applies); permissions_inventory row "Who creates sessions and tasks".

---

### 5. On the real module list the notice rule turns 65 jobs into about 170, and the definition contradicts itself on how a notified job tests and finishes

**Counter-argument.** Telling every declared user on every change, and making each notice a job, means a round with 65 modules of real work runs about 170 job sessions, about 100 of them for modules where nothing needed changing. The text also gives a notified job no consistent way to test or to be done.

**Attacks.**
- "So today every declared user is told, on any change in the provider."
- "If not, the notice is work and the module's job becomes ready."
- "The job looks only at what the named parts mean for its own module, and runs only the tests that relate to them."
- "Its module tests run on GitHub's machines, not in the session." and "*Runs:* that module's tests, never another module's".
- "Done means merged."
- "**Round:** ... Every module that has work gets its job, then the product is walked."

**Evidence.**
- Measured (counted today). A module has 14.2 declared users on average (median 8, most 213). The 65 modules with work have 9.2 (median 6, most 58). One merge from each of the 65 notifies 158 distinct modules, 103 of which have no work of their own.
- Measured (definition and `interface_and_cycle.md` 1e). 2,101 of 2,342 judged notifications were "not affected". In Process3 each of those cost a reading by a helper, median $0.20. In Process4 each is a job: a session, a pull request and a test run.
- Reasoning (the simulation above). 65 modules with work: about 177 jobs, about 100 of them needless, about 730 notifications, and about 120 notices arriving at a job that is already running. Elapsed time 22.6 job-lengths against 8.1 for the 65 alone. A first build touching all 220: about 3,120 notifications, about 400 of them into running jobs. Equal job lengths understate the last figure, because the long jobs are the late screens modules that use the most.
- Measured (`no_layers_width.md`, section B end). With eight slots and no waiting, 37 of the 65 modules run beside a module they depend on that also has work; 29 beside one with an unmet public requirement; 20 beside a direct one.
- Reasoning, from the text. A notified job that runs "only the tests that relate" must run them in the session, which the definition forbids, or through its pull request, where the test run is the whole module's. A notified job that finds nothing to change has no change to push, so no test run and no merge; "Done means merged" then never becomes true, the notice is never cleared, and "every module that had work has merged" never holds.

**How bad.** Costs most of a round's time and money; and, read literally, the round cannot end.

**Answer.** Partly. Wording: say what "done" is for a notified job that changes nothing (it closes its pull request and that clears the notice), and say that a notified job's tests are the whole module's test run on GitHub. Honest statement: put the figure in the definition, "about 100 needless jobs in a round of 65, on today's list, by estimate". A trial: extend the replay of J4 to count jobs per round under the rule. For the needless jobs themselves, the only remedy I can see is a cheaper judgment before a job is started, which is Process3's triage of notices; whether that is a new check is not mine to say. **No answer found** within the rule for that part.

Sources: `build/modules.json`, `build/requirements/*.md` at the tranche tip; no_layers_width sections 3, 4, B; interface_and_cycle 1e.

---

### 6. Seven modules with work own no code, four do not exist yet, and 52 code files belong to no module

**Counter-argument.** The definition says a module has its own files and a job writes only its own module's files. On the real list, 58 unmet requirements sit in modules whose only file is the requirements file, so their own job cannot write the code that would meet them.

**Attacks.**
- "**Module:** one part of the product, with its own files, tests and requirements file."
- "It writes only its own module's files".
- "Each finding becomes work for a named module".

**Evidence.**
- Measured (counted today). 29 of 220 modules own no code (same count as `interface_and_cycle.md` 1a). Eleven of them carry unmet marks, 124 marks in all. Seven own only a requirements file and tests: jurisdictions-c 3, member-upload 2, interface-shell-t53 14, screens-intake-rounds 21, screens-document-beta 13, screens-public 2, installer-places 3 (58 marks). Four have no files at all because they are new: screens-document 57, surface-declarations 7, store-jobs 1, screens-plan 1.
- Measured (`interface_and_cycle.md` 1a, 2d). "52 code files belong to no module"; "Whether a module may own requirements and no code. 29 of the 220 modules do. Under 'each module is updated and tested by a single job', their requirements are met by changes to another module's files." That file lists it as a decision still open.
- Measured (product `build/modules.json`, `not_product`). The module list itself, the workflows and `CLAUDE.md` belong to no module. A new module's files enter the list only by an edit to a file no job owns.
- Reasoning. The seven jobs can only report "a flaw in another module" to ARCH and wait for the parent module's job. That is two jobs for each, and the split module's own marks can be struck only after the parent merges. A walk finding in one of the 52 unowned files has no module to be "named".

**How bad.** Stalls the first round for 11 of 65 modules (124 of 466 marks) unless ARCH improvises; the round cannot end until they merge.

**Answer.** A removal and wording. The size cap that created the 18 requirement-only modules has ended (section I item 3), so fold each back into the module whose code meets it; that removes modules from the list and needs no source change. Assign the 52 unowned files in the list. Say who edits the module list (ARCH) and that a new module's job may create its files. Correct the definition of "module".

Sources: `build/modules.json`; interface_and_cycle 1a, 2c, 2d.

---

### 7. A job stopped by another module's fault has no way through, and "a failure already on the tranche" cannot be named without a test the definition forbids

**Counter-argument.** GitHub will not merge a pull request whose test run is red. If the red comes from another module, the job may not fix it, cannot merge, and the text does not say whether it keeps its slot. Eight such jobs would hold all eight slots.

**Attacks.**
- "A failure already on the tranche branch before the job began is named, and is not the job's to fix."
- "ARCH merges it into the tranche branch once the tests pass".
- "A job that cannot go on records that it is blocked, pushes everything and stops. Other jobs carry on."
- "**Slot:** room for one job to run."
- "A test runs only when there is a fully informed reason to run it."

**Evidence.**
- Measured (`product_side.md` 6d). Of 165 block records in Process3, 48 named "the suite already red on the tranche before the job started".
- Measured (`interface_and_cycle.md` 1a). 202 test imports go to a module the importer does not declare; 81 point to a later module, in 38 undeclared pairs. No notice reaches these, and a module's tests run only when its own pull request changes.
- Measured (`process3` `tool/lib/basered.mjs`, 23 KB). Process3 needed a separate mechanism to know and tolerate tests already failing on the tranche.
- Reasoning. Naming a failure as already present needs a run of the module's tests on the tranche as it stood before the job. None of the three tests has that trigger. With jobs no longer waiting for the modules they use, this case becomes more common than in Process3, not rarer (finding 5: 37 of 65 run beside a dependency with work). Whether a blocked job still holds its slot is undefined; Process3 had to decide it (the coordinator's decision of 7 Nov that the cap counts jobs "still working").

