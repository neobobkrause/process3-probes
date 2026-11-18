**When a module's work is finished** (*Claude decided*). When its job merges, or when its notified job tells ARCH that nothing needs changing.

**A job stopped by another module's flaw** reports the flaw to ARCH, records that it is blocked, pushes and stops. Its slot is freed. When the other module merges, ARCH makes this module's job ready again.

**A change across many modules: the mechanical edit.** In your words of 14 Nov: "A job for module A isn't allowed to change module B. The only other way of editing a module is when a mechanical edit (like a word table change) makes the change." A module where the change needs judgment gets its own job (your documents). You asked: "Can the mechanical edit do a single merge of all affected modules?" Claude's answer: yes. A helper in ARCH's session makes the edit as one change covering every affected module, and it is merged once. *Claude decided* the moment: when no job is open, between a round's last merge and its internal walk. What is unproven is the test run GitHub requires on that one change: either the module tests of every touched module run once there or, for a change that line 19 calls so trivial "that module tests need not be rerun", none run. The one time a session tried to merge without a required run in Process3, on 9 Nov, the permission checker refused (measured). Rehearsed in the trial.

**A round, step by step**

1. **Jobs.** Every module that has work gets its job.
2. **The internal walk.** When every module that had work is finished, ARCH starts sessions that walk the product as built against the UX Screens document. Each flaw becomes work for a named module in the next round.
3. **Deployment and the external walk.** Only when the internal walk finds no flaws is the product deployed to the development site. Walking sessions then follow the UX journeys there. Each flaw becomes work for a named module in the next round, "not the next tranche" (your words).
4. **The tranche ends** only when an external walk completes without flaws.

*Claude decided* the order: jobs, then the internal walk, and deployment only after an internal walk with no flaws.

**Who runs a walk and the deployment.** The fourth draft left open whether sessions or GitHub's machines run them. Your hint of 14 Nov, exactly: "sessions". Claude reads it as: sessions run both the walks and the deployment. Who runs the walks is among the questions open with you (section P). *Claude decided* the rest: a walk happens when no job is open, so walking sessions use the job slots, and the walk is shared out among them by journey, with at most as many walking sessions as there are slots. Unproven: a session can run one thing for about 30 minutes, and Process3's two late deploy-and-walk runs took 60 and 64 minutes (both measured), so a walk must be shared among sessions. That never ran. How many external walkers the Cloudflare account can bear is unproven and is measured in the trial. Process3's decision record quotes you on 8 Nov: "be careful that there aren't too many external walkers to cause the Cloudflare system to exceed limits of the account".

**Where the walks' documents are.** Your words of 14 Nov: "screens and journeys are kept in docs/development/ux-substrate/ in the product repo". The fifth draft said "Checked by Claude" that the folder held them. That was written on another session's word, was not checked, and was only partly right. What a worker found on 14 Nov, reading the product's repository: the folder is different on the product's main branch and on the branch Process3 built on. On the main branch it holds a Journeys page and a Screens page among its files. On the building branch a design session removed the Journeys page on 6 Nov, and the folder's own note there says the design documents are claude.ai pages and lists Journeys and Screens as links to them; the Screens page is still there as an old copy of 28 Oct, with everything needed to rebuild it. There are three lists of journeys, and they do not agree: the claude.ai Journeys page (27 journeys), the Journeys page on the main branch (27), and a script in the folder that the Screens page is built from (32). Nothing says which of these is "the UX journeys". What each walk is measured against, and which journey list counts, is yours to decide (section P).

**What "without flaws" means.** The fourth draft's proposal 10: a walk is without flaws when it lists no flaw and leaves out no step that the walk before it made. You answered "agreed" on 14 Nov. The measured facts behind it: no walk of either kind finished without flaws in Process3; on 8 Nov its stored report of the internal walk had all 238 steps marked ok with 63 failures listed; and the step count moved from 238 to 357 inside one round.

**Nothing bounds the number of rounds.** You give the reason no tranche finished in Process3: it "kept adding test after test". So the risk that a tranche does not come clean is unmeasured for a process that does not grow. What happens to a tranche that will not come clean is not defined. It is yours to decide (section P). The fifth draft's sentence "Only your word ends a tranche that will not come clean" was Claude's, not marked as Claude's, and is withdrawn.

**When the tranche ends,** ARCH merges the tranche branch into the main branch as a whole, by pull request. The main branch never moves while a tranche runs. None of the three tests runs on that pull request. This merge never happened in Process3 (measured).

**A release** "can (optionally) be started after a tranche completes" (your words of 14 Nov). ARCH prepares it (your Foundations, section C) and waits for your approval (line 18). No release of any kind was cut in Process3 (measured). A development deployment does not use the installer, so no walk shows that the installer can place a release into an empty account. The release path is unproven. You answered the fifth draft's three readings on the tranche and the release (section B). Whether a release has a walk of its own is still open with you (section P).

## E. The three tests

Your words of 14 Nov: "The 3 tests provide an appropriate opportunity to identify and debug as necessary every flaw and to test everything that needs to work in a released product. There is no need to any any more tests. PERIOD!"

And: "Process4 does have 3 tests, but calling the notification of a user module that a provider has changed isn't a test, it's simply a notification. The 3 tests are" and then your list: "module tests", "internal walk", "external walk". Asked whether the two walks count as one test, you answered: "internal and external walks a separate tests." This corrects the record of 13 Nov, which listed the notification as the second test.

A test runs only when there is a fully informed reason to run it (line 19).

1. **Module tests.** The record of 13 Nov: "Each job's own module tests, which include a check that the module's declared uses match its imports". The job writes them; that is its responsibility, and they "must be complete yet fast and efficient" (your words). They run for the job's own module only, on GitHub's machines, when the job marks its pull request ready. *A failure* goes back to the job. A rule for the job, from your Foundations: "every requirement is tested at the module's interface and proven met". Your rule for how every job writes its module tests, typed 14 Nov to the study session: "The tests are supposed to confirm bounds, confirm the accuracy of results under valid conditions, and confirm the recognition of an error when out of bounds. Tests should not fail because they expect a specific valid response but receive a different though still valid response." And: "The comments and tool can also inform module tests to ensure that boundaries are properly checked."
2. **The internal walk,** as you defined it (section A). It is made at the end of a round's jobs, or at any time on your word to the coordinator (that second part is *Claude decided*; it was not marked in the fifth draft). *A flaw* becomes work for a named module in the next round.
3. **The external walk,** as you defined it (section A). It is made on a development deployment, after an internal walk with no flaws. *A flaw* becomes work for a named module in the next round. A tranche ends only when an external walk completes without flaws.


Binding on all jobs: the job's handover note names its reviewer on a line of its own, exactly: `reviewer: Ruairi Mactavish`.

**The check of declared uses reads tests too.** The fourth draft asked whether that check, inside module tests, should read a module's test files as well as its source. Your hint of 14 Nov, exactly: "I think it has to check tests too". Claude has followed it: in this draft the check reads tests too. Process3's check read only source code, and found no undeclared use there (measured: 0 of 3,029 import statements). It never looked at tests, and the job rules told jobs to use a provider's published test fixtures and helpers, that is, ready-made test data and tools kept among the provider's tests. A script that searches today's code finds 122 pairs where one module's tests import from a module it does not declare (measured by that search). Before the check can read tests, those 122 are corrected. Who corrects them is *Claude decided*: 86 point to an earlier module; ARCH declares each in the module list. 36 point to a later module, which line 13 calls a design error "to be fixed by refactoring them", that is, reshaping the code without changing what it does; those modules' jobs do it.

**Tests and steps that jobs write** (*Claude decided*). A module's tests and a walk's steps are product work. Each exists only to prove a product requirement, which it names. A test or step that serves the process (records, formats, bookkeeping) is not allowed. This is a rule in text. Process3 had 211 such test files (measured).

**The process's own tool.** The fourth draft's proposal 5: the small tool through which sessions reach GitHub has tests of its own, the size limit on each role's starting text among them; they run only when PROCESS changes the process, and cannot stop a product job. You answered "agreed" on 14 Nov. In the same message you wrote that there is no need for any more tests. Claude reads the two together this way: the tool's tests test no product and never run on a product's work, so the three tests stay three. Say if you meant otherwise.

## F. The notification to user modules

Words used. A **provider** is a module whose services another module uses; that other module is its **user**. A module's **interface** is what it accepts and what it hands back. A **job** is a session that builds one module.

### What it is

It is a notification, not a test. Your words of 14 Nov: "calling the notification of a user module that a provider has changed isn't a test, it's simply a notification."

Its purpose, your words of 14 Nov: "If every user is told when the implementation of a module changes but the interface doesn't, then every change will continue to cause every user of that module to be rebuilt and tested. That's very (very!) inefficient and unnecessary."

### What it cannot do

Your words of 15 Nov: "After much research it seems pretty clear that there is no means to reliably tell the difference when there's a change in a module between when that change changed the interface or changed something other than the interface."

So the notice is a way of saving work. It is not a guarantee. It will sometimes tell a user that needed no change, and sometimes miss a user that did. Asked which way to go given that, your answer of 15 Nov: "Okay, I'll follow your recommendation: 2". The recommendation was to use the method below as a filter, accepting both kinds of error, with a missed user caught later by the three tests.

**What catches a missed user.** Nothing new. The user's own module tests, the next time its job runs for any reason; or the internal or external walk, where the break is a flaw and becomes work for that module in the next round. Your words of 15 Nov: "There will be no additional tests added to the process than the 3 already identified." So no test of users runs before a provider's change merges.

