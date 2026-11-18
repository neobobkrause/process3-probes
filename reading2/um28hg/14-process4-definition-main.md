# Process4: definition, first draft

14 Nov 2026. For Bob, the owner. Written by Claude.

**How to read this.** The main body uses plain words and no reference codes. It states what you have decided and what your requirement documents already say. It designs nothing new. Anything undecided or unproven is marked, and listed again in section J or K. The appendix shows where each of your 288 requirement lines went.

## A. What Process4 is for

Process4 is the way AI sessions build a software product for you in a GitHub repository while nobody watches. Its one output is correct, working product behaviour that meets its requirements, merged to the main branch quickly and cheaply, and still there later. You define the product: its purpose, audiences, requirements, principles and broad design. The AI decides everything technical and tells you in plain words what it did. Process3 failed because its sessions kept adding checks, reviews and record-keeping to the process itself until product work stopped. Process4 keeps almost all of your requirements and takes away the parts of the process that grew.

**Words used here**

- **Session:** one running AI conversation in Claude Code's cloud.
- **Module:** one part of the product, with its own files, tests and requirements file. The product is one ordered list of modules, and a module may use only modules before it.
- **Job:** one session's work on one module, delivered as one pull request.
- **Slot:** room for one job to run. Eight by default.
- **Tranche:** one batch of product work, built on its own branch, reaching the main branch only as a whole.
- **Round:** one pass within a tranche. Every module that has work gets its job, then the product is walked.
- **Walk:** a scripted journey through the product as a user would make it, with checks at each step.

## B. Who does what

**You, the owner.** You define the project and answer the questions that are yours. You enter no commands and edit no source files. Technical questions are not brought to you. Your acts:

| Your act | How often |
| --- | --- |
| Change a permission or rule setting in GitHub or Cloudflare | Very occasionally |
| Commit your standing approvals to the product's CLAUDE.md, and the deny list to its settings.json, on GitHub's website, as in Process3 (section F) | At the start of Process4, then only when the wording must change |
| Start the first session, ROOT | Once per start or restart of development |
| Tell the coordinator things in conversation | Whenever you choose |
| Approve a public release | Once per public release |

There are no others. Section K names two acts in your earlier documents that are not on this list. Only words you wrote yourself count as your word. A session never records its own decision, or its summary of what you said, as yours.

**ROOT** is the first session. You start it on the product's repository. Your first prompt says you are starting or restarting development of a named product with Process4 and names its repository. It may suggest a model and effort, and mention an account switch or other pertinent details. ROOT starts ARCH and the coordinator. Once an hour an alarm wakes it as a safety net, exactly as in Process3, to wake or replace a session that has stopped. ROOT decides nothing and builds nothing.

**The coordinator** is your front door: the session you talk to. ROOT starts it. You tell it when accounts are about to change, so it can stop development in the old account, and you tell it a new slot count. It passes your words on exactly as written. It decides nothing about the product and never brings you a technical question.

**ARCH** is the architecture session, one per product. It is never called "BOB", so it cannot be confused with you. ROOT starts it. It starts jobs, merges them, passes notices between modules, and decides every technical matter of the product. It does not choose which job starts next; a fixed rule does (section C). It never edits your approvals or publishes a release without you.

**A job** is a session ARCH starts to do one module's work. It decides how to meet that module's requirements. It writes only its own module's files, and never merges, starts a session or deploys.

**A worker** is a helper that ARCH or a job starts inside its own session, for bulk reading or side-by-side sub-tasks. It returns its result and ends. It decides nothing and never reviews another session's work.

Sessions are at most three levels deep, and none starts its own replacement. Git and GitHub hold all state. Sessions are woken by events, such as a job finishing or merging; the hourly alarm is only the safety net.

## C. How work flows

**The life of one module's job**

1. **The module has work.** A requirement in its file is marked "not yet met", or a walk finding or a notice has been placed against it. A notice says that a module it uses has changed.
2. **Its job is ready:** the module has work and no job already open. It does not wait for the modules it uses to finish.
3. **It takes a slot.** When a slot is free, the ready module earliest in the order takes it. The rule is fixed and gives the same answer every time. ARCH carries it out and has no discretion over it.
4. **ARCH starts the job session,** with instructions naming every act the job may take.
5. **The job works** in a draft pull request, writing only its own module's files. A flaw it finds in another module goes to ARCH, which passes it to that module's open job or records it as that module's work.
6. **The job completes.** It pushes and marks the pull request ready. Its module tests run on GitHub's machines, not in the session.
7. **ARCH merges it** into the tranche branch once the tests pass, using the process's merge tool, the only way a session can merge. There is no review and no act of yours. Done means merged.
8. **The slot is refilled.** The merge wakes ARCH at once and the slot goes to the next ready job. If the change altered the module's interface (what other modules rely on), every module that uses it is notified.

An example: all eight slots are full and the module at place 40 merges. Modules 12 and 57 are ready. Module 12 starts, even though a module it uses still has a job open.

**A change across many modules.** A change that touches many modules in the same trivial way, needing no judgment, can be made in one pass. Some such changes are so trivial that module tests need not be rerun.

**End of a round.** When every module that had work has merged, several sessions walk the product. Each finding becomes work for a named module, and the next round begins.

**End of a tranche.** A round that completes with no failures ends the tranche. The tranche branch merges into the main branch as a whole; the main branch never moves while a tranche runs. An optional deploy-and-external-walk may follow: the product is deployed to a development site in its own Cloudflare account, reaching no one else, and several sessions walk it there. What that walk finds becomes the next round's work.

**A public release.** The process prepares it and shows you what it carries. It waits for your approval, given in a protected area of GitHub that names you as required reviewer and holds the production keys. Updating the public release means updating the installer and the page of the website that refers to the current release and installer. Other work goes on meanwhile.

## D. The three tests

Process4 has exactly three tests, and no others, ever. A test runs only when there is a fully informed reason to run it.

1. **The job's own module tests.** *Trigger:* a job's pull request changes its module's files or tests. *Runs:* that module's tests, never another module's, including a check that the uses the module declares match what its code imports. *A failure* goes back to the job. A failure already on the tranche branch before the job began is named, and is not the job's to fix.
2. **The interface notice.** *Trigger:* a merged job changed its module's interface. *Runs:* every module that uses it is notified; each one's job updates its module as needed and tests it. *A failure* is fixed by that module's job.
3. **The internal walk.** *Trigger:* the end of a round. *Runs:* several sessions walk the product as built, without deploying it. *A failure* becomes work for a named module in the next round. No failures ends the tranche.

There is no full regression; the internal walk replaces it. There are no layers, so nothing runs between layers.

### Interface changes

**What counts as a module's interface.** Your documents say: the services listed in the public part of its requirements file. Measured on today's code, other modules rely on four things: the names a module exports; its public requirements, each under a permanent number; its own tests, which name the requirement they prove; and a few published files that are not code, such as a deployment setting.

**How a change is recognised today.** Process3's rule was coarse: any merged change to a module's source notified every module that declares a use of it. Of 2,342 notifications that were judged, 241 were truly affected and 2,101 (90%) were not. That rule is the only one that missed none. Two narrower rules for who is told were replayed on the same record: only users that import a changed name, or only users that cite a changed requirement. Alone or together they missed more than half of the 241. So today every declared user is told, on any change in the provider.

**What the notice says.** It names the parts that changed: exported names, before and after; public requirements changed, added, retired or newly met; and requirements whose tests changed. If no part can be named, it says so. That happened in 65 of Process3's 178 notices.

**What a notified job does.** If the notified module has a job open, that job gets the notice. If not, the notice is work and the module's job becomes ready. The job looks only at what the named parts mean for its own module, and runs only the tests that relate to them.

**Measured, and still to be proved.** Measured: telling every declared user misses none on Process3's record, which is the judgment of AI workers, not ground truth. Not proved: that recognising an interface change is rigorous and correct, as you require. A fault either runs users' jobs needlessly or leaves a module not updated. Two holes are known. A module that depends on another without declaring it is never told; 38 such pairs exist in tests today. And "only the tests that relate" cannot yet be picked mechanically, so the notified job must judge. Naming the changed parts can safely narrow what a notified job reads and tests. It cannot yet safely narrow who is told.

## E. When something goes wrong

**A job fails its tests.** The job fixes its module and the tests run again. After two failed corrections ARCH replaces the session with a fresh one, whose brief says what was corrected and why. A job that cannot go on records that it is blocked, pushes everything and stops. Other jobs carry on.

**A job's session dies.** ARCH starts a new session that continues from the same branch and pull request. The hourly alarm catches a dead session that no event reported.

**A module is found to use a later module.** That is a design error in those modules, fixed by refactoring them in their own jobs. Today's module list has three such uses. Process3's check compared what a module declared with what it imported, never with the order.

**The process itself has a fault.** Claude fixes it. The fix may only correct or remove what is broken. It must never add a new test, gate (a check that must pass before work goes on), review or stop. An example from Process3: two jobs recorded a cost of zero, so a report read wrong. The fix made then was additive: the command that completes a job was made to refuse without a cost figure. Jobs could not read that figure, so every job completion was blocked, and the refusal came out 45 minutes later. A corrective fix writes "unmeasured" where the figure cannot be read, as your documents already ask. It adds nothing and can stop nothing.

