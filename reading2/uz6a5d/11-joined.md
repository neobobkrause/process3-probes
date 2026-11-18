# [file] first-class-session-minimal-owner-result-20261117.md (continued)

- **Tool inventory and environment, by 18:05:28 UTC.** No exposed connector provides general Codex Cloud task creation, listing, or messaging. Codex Document Control is scoped to connected document surfaces. The Cloud Environment status tool returned the current managed runtime instance, whose ID does not establish a published Codex Cloud task target. No eligible published environment ID was verified. Desktop threads, ChatGPT Projects, and Codex product projects are separate from the published execution environment and the Cloud task. The official Cloud documentation describes task creation and continuation through authenticated clients with a published environment. It identifies the GitHub and Linear integration workflows as legacy. Neither those workflows nor automation or local threads established the required creation route in this preflight. [Using Codex Cloud](https://help.openai.com/en/articles/20001545-using-codex-cloud)

The missing prerequisite is a supported Codex Cloud creation surface available to this execution context under the owner's authenticated account, with access to an existing authorized published environment and included usage. The managed browser presented sign-in, the inherited CLI route has the reported 401 with no established change in authentication state, and the connector inventory supplied no alternate creation operation. Owner-initiated sign-in to the Codex Cloud web client would address the observed browser gate. Access to the target and included usage would still require a fresh preflight.

| Capability | Observation |
|---|---|
| Autonomous independent Cloud task creation | Blocked before submission |
| Owner's ordinary Codex task list | Unverified |
| Direct owner message and second turn | Untested |
| Product project assignment | Untested |
| Reactivation by another Process4 session | Untested |

No owner UI verification was requested. No manual replacement task, subagent, automation, metered inference, purchase, or account change was made. Repository changes for the experiment are limited to this report.


# [file] audit2_feasibility.md

# Second audit of the Process4 definition, fifth draft: feasibility

14 Nov 2026. Read-only. Nothing was committed, pushed, fetched or started. Audited: `/home/user/handoff/process4_definition_v5.md`.

**Verdict.** As written, the fifth draft would still not run. It has answers, in a sentence each, to most of what the first round found, and it is honest that none of them has run. But walked through as each session would live it, it stops in four places before the first job merges, and in at least five more before a tranche could end. Two of the stops are new and rest on things I measured today:

- The answer chosen for ROOT's start (make the tranche branch the default branch) is aimed at a fault that did not happen. The record's own commit shows the ROOT that Bob started came up on an old copy of the tranche branch, not on the main branch. The default-branch setting does not touch that.
- The folder Bob named for the walks' documents says of itself that the design documents are not in it. What it holds is machine data, and 135 of the 679 screen acts in it are marked as not built yet.

The rest is a design that names actors for most steps and leaves five steps with none: writing new work into a module, moving a product to a changed process, deploying, preparing a release, and archiving finished sessions.

**Evidence labels, kept apart.**

- **Measured:** in Process3's record, with the passage; or "counted today", taken by me from the read-only clones (`civicsmith-copy` at `origin/tranche` e7ec72e; `process3` at `origin/tranche` 38b0f3f and the checked-out branch `process4`; `process3-probes`).
- **Platform text:** a platform document, or the tool definitions this audit session was given today. Not tried on Bob's repositories.
- **Reasoning:** mine only.

"The register" is `/home/user/handoff/process4_counterarguments.md` (87 entries). "First round" is `/home/user/work/attack_feasibility.md`.

---

## Findings, worst first

### 1. The fix for ROOT's start is aimed at the wrong fault

1. **The fault.** The draft says a ROOT that Bob started came up on the main branch, and answers that by making the tranche branch the default. The record shows something else: Bob's ROOT came up on an hour-old copy of the tranche branch itself, missing the approvals he had committed sixteen minutes earlier. Changing the default branch does not cure an old copy.
2. **Sentences.** Section I: "The fault to avoid, measured in Process3: a ROOT you started plainly came up on the main branch, which held old approvals, both times it was tried. *Claude decided:* the branch a tranche is built on keeps one fixed name, and you make it the default branch of the product's repository ... Then your commits on GitHub's website and a plain start both land on it." Section C: "Start the first session, ROOT | ... after each edit to your approvals". Section I: "a long-lived session compares the approvals it loaded with the newest, and on a difference does nothing."
3. **Rests on.**
   - Measured (`roles_root_coordinator.md` 3.1): "The owner-started ROOT's container stood on an old commit both times: 'first start check failed (container on 18935dc7, older than the tip) ... the Bob-app ROOT clones the default ref, not the tip' (LOG L667); again on 8 Nov (L1190)." Step 3 of the same passage: Bob "opens a new session on the product repository, picks branch `tranche`, pastes the prompt." So neither start was plain, and he had chosen the tranche branch.
   - Counted today in `civicsmith-copy`: commit 18935dc7 is "Merge job PR 458", made on 5 Nov at 17:32:56 UTC. It is in the history of the tranche branch and is not in the history of main (main still stands at the 1 Nov commit 0dea5a6). Bob's approvals edit (pull request 550) merged into the tranche at 18:25:29 UTC. ROOT was started at 18:41. So ROOT stood seven merges behind the tip and behind his approvals. 18935dc7 was the tip at 17:45, when Bob had started the ROOT before it. Limit of this check: only the 5 Nov commit id is in what I read; for 8 Nov the record says "again" and gives no id.
   - Measured (`permissions_inventory.md` 1c): "measured 3 Nov, a branch name landed on a stale local copy of it in the saved container"; a start by commit id landed fresh, 1 of 1.
   - Reasoning: Bob's approvals commit is by construction the newest commit, so it is exactly what an old copy lacks; and the draft makes "start ROOT" the act that follows every approvals edit. With the comparison kept, such a ROOT "does nothing", and no other session exists to put it right. That is how Process3 ended (measured: five edits, five full stops, no restart after the last).
4. **How bad.** Stops the first hour, and again at every approvals edit.
5. **Status.** RAISED BEFORE AND NOW ANSWERED (register 26, first-round finding 2), by a decision of Claude's. The answer does not meet it: it rests on a misreading of the measured fault. The trial the draft lists first would show this, so the trial can settle it.
6. **Best answer.** A correction, a removal and a structural choice. Correct the sentence about the main branch. Let ROOT act on Bob's own typed prompt whatever copy it stands on (2 Nov: 0 of 21 refusals when his consent was typed in the acting session; stated in his Foundations, with no evidence file), and drop the comparison for ROOT alone. ROOT then finds the newest commit and starts ARCH and the coordinator by commit id, the one way measured to land fresh. Whether approvals read by a session after it started count as loaded is unmeasured; that is a one-off trial. The default-branch setting may still be worth having for Bob's website commits, but it is not the cure.
7. **Whose.** Claude's to decide; needs a trial.

### 2. Nothing says in what order the two repositories are converted, or by whom, and Bob's first commit cannot merge until that is built

1. **The fault.** Before any Process4 session can act, the product's repository must stop telling sessions to "act on nothing", must allow the new tool to push, and must have a test run that answers on a change touching no module. Each of those changes has to get past the Process3 machinery it replaces, and the draft names neither the order nor the session that does it. Bob's own approvals commit is one of the changes that cannot merge until it is done.
2. **Sentences.** Section M: "The product's repository is not converted ... So a ROOT you start with a plain prompt is told to do nothing. The test run must also report on pull requests that change no module, such as your approvals commit, or that commit cannot merge." "Builder: Claude, before anything is in force." Section I: "In settings.json the rule that allows pushing names the Process3 tool by its file path and must match Process4's tool, or no session can push". Section I: "The tranche branch takes a change only by pull request with its tests passing."
3. **Rests on.**
   - Counted today, product `CLAUDE.md` at the tranche tip: "Act only as it says; with none, act on nothing." Product `.claude/settings.json`: deny `Bash(git push *)`, `Bash(gh *)`; allow only `Bash(node .process/tool/p3.mjs github push *)`; two retired hooks still present.
   - Measured (first-round finding 1; `process-gate.yml`): the product's required test run is Process3's, fetched at the product's recorded Process3 version, and a pull request that swaps that version fails it.
   - Measured (`permissions_inventory.md` 1f): the rule on the tranche requires the check named `gate`, with an empty bypass list. A change to the check's name is a change to Bob's rule.
   - Measured (product history): Bob's own approvals commit of 9 Nov was pull request 1115, merged by him after the check.
   - Reasoning: three files are involved that only Bob may commit (his approvals, the deny list) or that the old check guards (the process version). Change the push rule first and no session can push the rest. Change the version first and the old check fails it. The same is true of `process3-probes`, whose tranche branch is a Process3 copy too (finding 17).
4. **How bad.** Stops the first hour, and stops the trial before it.
5. **Status.** RAISED BEFORE AND STILL OPEN: register 3 ("NO ANSWER FOUND") and the unanswered part of register 25 ("converting the product must either pass the Process3 check it is removing, or needs you to change a GitHub rule first"). The fifth draft restates the problem in M and does not answer it.
6. **Best answer.** A written order, with settings. One page listing each step, who does it and which rule is in force at that step: Bob lifts the required check on the trial or tranche branch (a setting), the conversion goes in as one change that Bob merges, Bob commits his two files, Bob puts the required check back under its new name. Say plainly that this is a sitting of Bob's of more than one act, in each repository.
7. **Whose.** Needs the build; the count of Bob's acts is his to accept.

### 3. A session holds one repository, and the draft does not say how the process's tool and role texts reach it

1. **The fault.** Every session must hold the product's repository alone, yet every session must use the process's tool and read its role text, which live in the process's repository. The draft never says how they arrive. A ROOT started by a plain prompt has the further problem that nothing tells it what a ROOT does.
2. **Sentences.** Section I: "with one repository only, because a session that holds more loads no deny list". Section I: "So the process's tool is each session's only door to GitHub." Section J: "The process has its own repository and one fixed version for each tranche, moved only with your prior approval." Section C: "You start it with a plain prompt on the product's repository." Section I: "ROOT, started by your plain prompt, does not meet the last condition. Whether that works is unproven." Section J: "The product's CLAUDE.md stays under thirty lines."
3. **Rests on.**
   - Measured (`permissions_inventory.md` 1c): Process3 carried the process as a pinned copy inside the product; "A clone pinned as a git submodule arrives **empty**", so every session's first command fetched it.
   - Measured (same, 1e rows 19 and 23): an act a session's starting text did not name was declined by the session itself 6 of 6; merges asked on consent quoted in the starting text were declined 11 of 11. The only measured working ROOTs had a 4 KB role prompt pasted in.
   - Measured (`enforcement_levers.md`): the recorded version sits in a file of the product that any session can change; sessions moved it 116 times in nine days.
   - Searched today: the fifth draft does not contain the words "pin", "pinned" or "submodule".
   - Reasoning: the route by which the tool arrives decides three other things the draft treats as settled: what "one fixed version for each tranche" is physically; who can move it (finding 9); and what a plainly started ROOT reads to learn its acts.
4. **How bad.** Stops the first hour (no tool, no role), and decides whether the rule "moved only with your prior approval" is held by anything.
5. **Status.** NEW as a whole. Part was in register 25 (no tool) and is answered there only by "Claude builds these".
6. **Best answer.** A structural choice, stated in the definition: the product carries one line naming the process version; the tool and texts are fetched from the public process repository at that version as each session's first act; the product's CLAUDE.md carries one short passage, below Bob's approvals, saying what a session does when Bob's prompt says he is starting development. Mark it unproven and put it first in the trial.
7. **Whose.** Claude's to decide; needs the build and the trial.

### 4. Step 8 of every job cannot be carried out until the notification is settled, and neither can the tool

1. **The fault.** When a job merges, someone must decide whether its module's interface changed and whom to tell. The draft says, rightly, that this is not settled. But the same draft lists "send notifications" among the six things the tool does and puts no notification in any trial. So the tool cannot be finished, and the first real job cannot complete its last step.
2. **Sentences.** Section D step 8: "If the job changed its module's interface, every user of that module is notified". Section F: "Until you decide, this definition says no more on these three things than your recorded lines do. The form of the notification is written after the study." Section M: "a new small tool that does only this: push; open a pull request and mark it ready; merge; start the next job; send notifications; and write the shared state."
3. **Rests on.** Measured (section F's own figures): 71% of job merges change one of the four parts; 2,101 of 2,342 judged notifications needed nothing; nothing exists that can pick "the tests that relate". Reasoning: record line 3 does not say who judges that an interface changed (the job, ARCH or the tool), and a session cannot act on a rule with no actor.
4. **How bad.** Stops the first job's completion on the real product. Does not stop the trial on made-up modules if notifications are left out of it, which then leaves step 8 untried.
5. **Status.** RAISED BEFORE AND STILL OPEN (register 7, first-round finding 5). Bob's words of 14 Nov set aside both proposals and started a study; the draft says so honestly.
6. **Best answer.** An honest statement in sections M and O: the process cannot start on the real product until the study is decided, and the trial as listed does not exercise the notification. I do not re-derive the study.
7. **Whose.** Bob's to decide (it is his definition of a module's interface and of who is told); the study brings the proposal.

### 5. The named folder does not hold the two documents, and nothing says how much of them a tranche's walk must cover

1. **The fault.** The draft says the screens document and the journeys are in the folder Bob named, "checked by Claude". The folder's own first page says the design documents are kept elsewhere, as pages on claude.ai, and that the folder holds only what the product's build reads. What is there describes 679 screen acts, 135 of them marked as not built yet. A walk against all of it cannot come clean until the whole product is built; a walk against part of it needs someone to say which part, and no one is named.
2. **Sentences.** Section D: "So the UX Screens document and the UX journeys are kept in that folder of the product's repository. Checked by Claude: the folder exists on the branch the product is built on, with a screens sub-folder and files describing journeys. Which exact files each walk reads is Claude's to settle in the build." Section D: "a walk is without flaws when it lists no flaw and leaves out no step that the walk before it made." Section D step 4: "The tranche ends only when an external walk completes without flaws." Measured against Bob's words of 14 Nov: "An internal walk uses the UX Screens document to confirm that the workflow matches the definition" and "screens and journeys are kept in docs/development/ux-substrate/ in the product repo".
3. **Rests on.**
   - Counted today, `docs/development/ux-substrate/README.md` at the tranche tip: "This folder holds only what the product's build and checks read (Bob, 5 Nov 2026). The design documents are claude.ai artifacts, kept by the ux lane ... Their earlier repository copies ... are in git history, before the commit that removed them." Its table lists "Journeys" and "Screens" as claude.ai links.
   - Counted today, Bob's own approvals in the product's CLAUDE.md: "Their design documents are claude.ai artifacts, not repository files."
   - Counted today: the folder has 90 files. The nearest things to the two documents are `screens/registry.json` (91 screens, 679 acts: 462 declared, 82 by function, 135 "owed"), `screens/mock-journeys.js` (32 journey entries with steps and with steps marked for the AI path only), and `layouts.html` (a 1.5 MB built mock). They are data for programs, not a document a session reads.
   - Counted today: the module list gives the folder to a module, `ux-design`, and also lists `docs/` as belonging to no module. Bob's approvals give the same folder to the design lanes, whose changes merge with no test.
   - Reasoning: three things follow that the draft does not settle. Which is "the UX Screens document": the page on claude.ai, which a cloud session may or may not be able to open and which moved accounts on 6 Nov, or the registry file. Who changes it when a walk shows the document is wrong: a lane, or the job of the module that owns the folder. And what a tranche's walk covers when the document describes more than the tranche builds.
4. **How bad.** Stops a tranche from ending; and misleads Bob, because "checked by Claude" reads as if the documents were found.
5. **Status.** NEW. It touches register 1 (a tranche may never end; no answer found) and register 39.
6. **Best answer.** A correction and two questions. Correct "checked by Claude" to say what is and is not in the folder. Two of Bob's own statements differ here (his words of 5 Nov as the folder and his approvals carry them, and his fourth message of 14 Nov); I report the difference and do not choose. Put to him: which is the document, and what part of it a tranche's walk must cover.
7. **Whose.** Bob's to decide: where his design documents live and what a tranche contains are product definition, not technique.

### 6. A walk run by several sessions sharing journeys was never run, needs product work nobody is named to order, and may rest on a wrong limit

1. **The fault.** The product's walker is one program that walks its journeys in order, each building on what the one before left. Sharing it among sessions by journey needs changes to that program, which is itself a module of the product. In Process3 the walks of a deployed site ran on GitHub's machines, never from a session. And the reason given for sharing, that a session can run one thing for only about thirty minutes, does not match the tool text I was given today.
2. **Sentences.** Section D: "So sessions run both. *Claude decided* the rest: a walk happens when no job is open, so walking sessions use the job slots, and the walk is shared out among them by journey ... Unproven: a session can run one thing for about 30 minutes, and Process3's two late deploy-and-walk runs took 60 and 64 minutes (both measured), so a walk must be shared among sessions. That never ran." Section C: ARCH "has the product deployed to the development site". Section E.2: the internal walk "is made at the end of a round's jobs, or at any time on your word to the coordinator".
3. **Rests on.**
   - Counted today: the walker is the module `journey-check`, 218th of 220 in the order. Its entry point (`run.mjs`) has two arms. The local arm "walks journey 28 from the installer through the hand-over into the copy and on, then journey 3, then sweeps the registry's screens"; later journeys are passed the project and question made by earlier ones. I found no option to run one journey alone.
   - Measured (`DECISIONS.md` PD-16, 8 Nov): "Product walker changes needed for parallel walks go to BOB as a job". Measured (process3 README, `walk`): Process3 ran more walkers at once inside one run, by a count handed to the walker, not by more sessions.
   - Measured (register 35's answer; `k_evidence.md` line 279): "the two runs took 60 and 64 minutes ... so they ran on GitHub's machines." The walker starts its browser to go round any proxy; a cloud session reaches the internet through one (this session's own environment notes say so). Whether a session's browser can reach the development site at all is unmeasured.
   - Platform text (the Bash tool definition given to this session today): a background command's limit is "default 1800000, max 7200000" milliseconds, that is, thirty minutes unless asked, up to two hours. Not tried by me. Bob's kept ledger line PLT-4 says: "No step runs longer than the in-session background limit; anything that can is a CI workflow." His hint of 14 Nov says "sessions". The draft follows the hint and does not show him the kept line.
   - Reasoning: "has the product deployed" names no session. A walk "at any time on your word" cannot also be a walk that "happens when no job is open". The draft's own notes say "by journey" may need to be "by screen" for the internal walk.
4. **How bad.** Stops the end of the first round: there is no way to run either walk as described.
5. **Status.** RAISED BEFORE AND STILL OPEN (register 35, register 66, first-round finding 14). Marked unproven and put in the trial; but the trial uses made-up modules, which have no walker, no screens and nothing to deploy (finding 17). The points on the limit, on the walker being one program, and on reach from a session are NEW.
6. **Best answer.** A one-off trial, then probably a removal. On the real product, one session runs the existing walker once in the background with the two-hour limit. If it finishes, remove "shared among sessions by journey" and keep one walking session using the walker's own count of walkers, which is the form Process3 built. Name the session that deploys. Say which gives way when Bob asks for a walk while jobs are open.
7. **Whose.** Needs a trial; then Claude's to decide. The kept ledger line against the hint is Bob's.

### 7. New work has no door into a module, and a job that needs something from another module has only the door marked "flaw"

1. **The fault.** A module's requirements file is part of the module, and only the module's own job or a mechanical edit may change a module. So nobody is allowed to write a new requirement into a module, or mark one "not yet met". The same gap meets a job in its first hour: if it needs a service an earlier module does not offer, or needs to use a module it has not declared, the draft gives it only the route for reporting a flaw.
2. **Sentences.** Section A: "Module: one part of the product, with its own code files, tests and requirements file." Section D step 1: "The module has work. A requirement in its file is marked 'not yet met', or a walk flaw or a notification has been placed against it." Section C: "A job for module A isn't allowed to change module B. The only other way of editing a module is when a mechanical edit ... makes the change." Section D step 5: "A flaw it finds in another module goes to ARCH, which passes it to that module's job." Section E.1: module tests "include a check that the module's declared uses match its imports". Section D: "A job stopped by another module's flaw reports the flaw to ARCH, records that it is blocked, pushes and stops."
3. **Rests on.**
   - Measured (`foundations.md`, "Where the work is"): in Process3 the build state, "each module's requirements with their not-yet-met marks", was "written only through the process", and the architecture session wrote requirements (counted today: ten of its branches named `bob/T53-req-...` on the product).
   - Counted today: declared uses live in the module list (`build/modules.json`, 3,120 uses), which belongs to no module and which the draft gives to ARCH. A job that adds one import of an undeclared earlier module fails its own module tests and cannot fix that itself.
   - Reasoning: a missing service is not a flaw in the provider. For it to become the provider's work, a requirement must be written into the provider's file. The draft names no one. For a new use, ARCH must change the list in a change of its own (which needs the required test run to answer on a change touching no module, finding 2), and the job's tests must then run again; none of that is a step in section D. Step 1's list of what counts as work also leaves out the flaw a job reports.
4. **How bad.** Stops a tranche: the first requirement that crosses a module boundary has no route. Costs time on every new use between modules.
5. **Status.** NEW. (Register 54 restored "prepares what the next round or tranche needs", which names the duty and not the door.)
6. **Best answer.** Wording, with one reading put to Bob. Say that ARCH writes requirements and their marks, and that this is not "editing a module" in the sense of his rule; or say that it is and that requirements reach a module only through its own job, with ARCH's text handed to the job. Add two steps to the job's life: asking ARCH for a use to be declared, and asking for a service from a provider.
7. **Whose.** Bob's to decide whether his rule covers the requirements file (it is his rule and his word "module"); the steps are Claude's.

### 8. The mechanical edit has one allowed moment, and the jobs that need it can stop that moment from coming

1. **The fault.** A mechanical edit may be made only after a round's last merge. A job that cannot finish without such an edit stops as blocked, with its pull request still open. A round's jobs are over only when every module with work is finished. So the round never reaches the moment the edit waits for. The same holds on day one: the repair of the module list must come before the first jobs, and the stated moment is after them.
2. **Sentences.** Section D: "*Claude decided* the moment: when no job is open, between a round's last merge and its internal walk." Section D round step 2: "When every module that had work is finished". Section D: "A job stopped by another module's flaw ... records that it is blocked, pushes and stops. Its slot is freed." Section C: "Modules that hold requirements and no code ... ARCH decides which module's code meets each, and the move is made as a mechanical edit." Section A: "seven modules with work hold no code".
3. **Rests on.**
   - Counted today: 11 of the 220 modules have no paths at all in the list. First-round count: seven modules with work own only a requirements file; 58 unmet marks sit in them.
   - Measured (first-round finding 11; `merge.mjs`): Process3's rule was "a pass runs while no job holds its modules", a narrower condition than "no job is open".
   - Measured (`permissions_inventory.md` row 35): the one attempt to let a change through without its required run was refused, "[CI Bypass]". Measured (`process-gate.yml` comment): a change touching every module "would run every suite past the gate's cap"; two suites take 40 to 42 minutes.
   - Reasoning: folding 29 modules back moves requirement numbers that tests cite, across perhaps sixty modules; that is one very large change whose test run is either every touched module's or none, and the draft leaves which to the trial. Who judges that an edit is trivial enough for none is not said.
4. **How bad.** Stops a round as worded; stops the first round for the seven modules.
5. **Status.** RAISED BEFORE (register 53, 68, 32; first-round findings 6 and 11). The moment and the single merge are NOW ANSWERED by Claude's decision and Bob's question; the answer does not meet the blocked-job case or the day-one case, which are NEW.
6. **Best answer.** A change of wording to the condition: a mechanical edit is made when no job has an open pull request on any module it touches, at any time, and before the first job of a tranche where the list needs it. Keep the test-run question as an honest unproven item.
7. **Whose.** Claude's to decide; the test-run part needs the trial.

### 9. PROCESS in motion: several links exist only as a sentence, and one link has no actor at all

1. **The fault.** Follow one process fault met at night. The job tells ARCH. ARCH asks ROOT. ROOT starts PROCESS on the process's repository. Then the draft runs out. It does not say which branch PROCESS starts on or what approvals it loads there; who tells Bob that PROCESS is waiting for him; who merges the change PROCESS writes; who replaces PROCESS when it fills up with a week of conversation; or, above all, who moves the product to the changed process once Bob approves. PROCESS cannot: it holds the other repository. No product session may: the draft forbids it.
2. **Sentences.** Section H: "So a job reports a process fault to ARCH. ARCH asks ROOT to start PROCESS if it is not running. You talk to PROCESS, and the coordinator can talk to it too." "Which repository it holds ... the process's own repository." "No session building a product may change the process, add a test, check, gate or review to it, or adopt a changed process." "None of this has run." Section C table: "Commit your standing approvals ... in the product's repository and in the process's (section I)". Section G: "For ARCH or the coordinator, ROOT starts a successor". Bob's words: "The transition ... will be done only with my prior approval, with PROCESS proposing the best and least disruptive means of making the update."
3. **Rests on.**
   - Measured, and in the draft's favour (`roles_root_coordinator.md` 3.2): from 5 Nov 23:54 UTC a ROOT holding the product's repository started each new coordinator on the process's repository. So a session starting a session on another repository did run in Process3, for each coordinator from then on (the record does not give the count), under Process3's approvals and with a role prompt that named the act. The draft's notes say this was not established; it is.
   - Measured, against (`permissions_inventory.md` row 34): pushes from sessions started across repositories into the probes repository were refused 2 of 2 on 8 Nov, after approvals were split by repository.
   - Counted today, in the working copy of the process repository: the branch `process4` is cut from main. It carries the approvals of 1 and 2 Nov, which speak of "Process3", and it has no `.claude/settings.json` at all, so no deny list. The repository's default branch is main. Section I, which the acts table cites, says nothing about the process's repository.
   - Platform text (`create_session`, today): a new session inherits the caller's cloud environment. So PROCESS would hold the product's deploy tokens.
   - Measured (section H): one question carried as Bob's waited about nine hours. Measured (`roles` 1.1): coordinators, the nearest thing to PROCESS, lasted four to eight hours each.
   - Reasoning: if the fault is in the tool's push or merge, every slot is idle until Bob wakes, reads, chooses, approves the change and then approves the move. That is his rule and I do not attack it. What is missing is everything a session would need in order to act on each link.
4. **How bad.** Stops a tranche at the first process fault that blocks work, for as long as Bob is away plus however long the missing links take to invent.
5. **Status.** RAISED BEFORE (register 33, 44; first-round finding 10). NOW ANSWERED in part by Bob's hints of 14 Nov (who starts it, the channel, the repository). Those answers are his and are enough to name the links. The missing actor for the move, the branch and approvals, the telling of Bob, the merge and the replacement of PROCESS are NEW.
6. **Best answer.** Wording and settings, no new step. Name: the branch PROCESS starts on and that Bob's approvals and a deny list are committed there; the session that sends Bob the one message; that PROCESS merges its own change with the tool once the tool's tests pass; that pending proposals live in the process repository so that a replaced PROCESS can read them; and one actor for the move, for example a short session started on the product's repository for that single change, after his approval is recorded. State that the move restarts every product session, if it does.
7. **Whose.** Claude's to decide, except who may carry out the move, which reads Bob's sentence "No session building a product ..." and is his to confirm.

### 10. At the size of the real product, the first walk comes after about 177 jobs, and nothing suggests the tranche can then end

1. **The fault.** On the real list a first round is about 177 jobs before any walk is made. In Process3, with more sessions, 508 merges took six and a half days. The first internal walk then has to find nothing at all before the product is deployed, and the deployed walk has to find nothing at all before the tranche ends. Neither ever happened.
2. **Sentences.** Section D: "Nothing bounds the number of rounds ... Only your word ends a tranche that will not come clean." Section F: "the 65 modules with real work led to about 177 jobs ... (estimated)". Section O: "Whether a tranche can end."
3. **Rests on.** Measured (`product_side.md`): all 12 development deployments of 4 to 8 Nov ended "ok: false"; after 80 hours without a deployment the first walk found 1,691 failures; the last walk failed 147 of 157 live steps. Measured (draft, section D): on 8 Nov the internal walk had all 238 steps marked ok with 63 failures listed. Measured (register 1): 113 of 1,187 test runs failed on 3 to 5 Nov and 74% of those passed again with no change. Reasoning: the order (deploy only after a clean internal walk) follows Bob's words of 8 Nov, so it is not Claude's to remove; its cost is that what only a deployed walk can see is found last.
4. **How bad.** Stops a tranche, without limit.
5. **Status.** RAISED BEFORE AND STILL OPEN (register 1, "NO ANSWER FOUND"). The draft states it honestly.
6. **Best answer.** No answer found that makes the tranche end. Two honest additions: say how long the first round is estimated to take before its first walk; and say that the size of a tranche is Bob's to set, since a smaller tranche is the only lever in his hands that is not a new check.
7. **Whose.** Bob's to decide (what a tranche contains); only the first real tranche can show.

### 11. Every edit to Bob's approvals replaces every session, and the draft is of two minds about when the comparison is made

1. **The fault.** After Bob edits his approvals, every long-lived session does nothing. A new ROOT must then replace ARCH, the coordinator, the watcher, PROCESS and up to eight jobs: thirteen new sessions, thirteen dead ones left on the account. One passage calls the comparison a start-up act, another has long-lived sessions making it later.
2. **Sentences.** Section I: "a long-lived session compares the approvals it loaded with the newest, and on a difference does nothing ... So an edit to your approvals is one act together with restarting ROOT." Section J: "Named: the three tests, and the start-up comparison of your approvals".
3. **Rests on.** Measured (section I): five edits, five full stops, no restart after the last. Measured (`permissions_inventory.md` row 18): with job-like starting texts the approvals made "NO DIFFERENCE" to the checker; they act through the session's own model. Reasoning: a comparison made only at start-up cannot stop a long-lived session; one made at every wake is a standing check that stops work. The draft needs to say which it keeps.
4. **How bad.** Stops a tranche for as long as the restart takes, each time; with finding 1, it can end the product as it did on 9 Nov.
5. **Status.** RAISED BEFORE AND STILL OPEN (register 28: "the stop itself is kept, so the counter-argument stands, now as a stated cost").
6. **Best answer.** A removal already offered in the first round and not taken: sessions carry on under the text they loaded, and only sessions started after the edit load the new text. If it is kept, say when the comparison is made.
7. **Whose.** Claude's to decide under record line 12; Bob can overrule.

### 12. Finished sessions pile up, nobody is named to archive them, and new starts fail silently at about fifty

1. **The fault.** A round of about 177 jobs leaves about 177 finished sessions. If idle sessions count toward the account's limit of about fifty, starts fail while reporting success after the first forty or so. The draft does not say who archives a finished session.
2. **Sentences.** Section O: "Finished sessions do not use up the account's room. Process3 saw new starts fail silently at about 50 live sessions (one event)." Searched today: the word "archive" does not occur in the fifth draft.
3. **Rests on.** Measured (`permissions_inventory.md` row 14): about 50, one event. Measured (`roles` 1.3): "21 finished job sessions archived by ROOT's cap sweep"; Process3's rule was "Whoever starts a session archives it". Measured (rows 5 and 6): archiving passed 2 of 5 and 1 of 4 before the approvals; "15 of 15" after has no evidence file.
4. **How bad.** Silently stops a round.
5. **Status.** RAISED BEFORE AND STILL OPEN (register 67; first-round finding 13). Now listed for trial; the trial needs about fifty live sessions on Bob's account, which its stated cost does not count.
6. **Best answer.** Wording: name who archives (the session that started it, as in Process3). Keep the trial.
7. **Whose.** Claude's to decide; needs a trial.

### 13. ARCH carries every start, merge and notification alone, and nobody is named to notice a job that died after its tests passed

1. **The fault.** ARCH does everything between jobs. It was replaced 21 times in six and a half days when it did less. A job that dies between a passing test and its message leaves a slot held; the hourly alarm wakes ROOT, not ARCH, and no rule says how ROOT tells a stopped session from a waiting one.
2. **Sentences.** Section C: "It starts jobs, merges them, and passes notifications between modules ..." Section C: "Once an hour an alarm wakes it as a safety net ... to wake or replace a session that has stopped." Section G: "After two failed corrections ARCH replaces the session".
3. **Rests on.** Measured: 21 architecture sessions for 508 merges, about 24 each. Measured (`foundations.md`): "with no event, BOB noticed attempt 1's completion after 194 minutes". Platform text (`subscribe_pr_activity`): "A PR's events go to one session at a time." In Process3 the architecture session held that subscription; a job listening to its own test result is the platform's design but has no run in the record. Reasoning: at about 177 jobs a round, ARCH is replaced about seven times a round with jobs open, which the draft lists as unproven.
4. **How bad.** Costs hours per stall; with eight slots, a few stalls idle the round.
5. **Status.** RAISED BEFORE AND STILL OPEN: register 8 ("NO ANSWER FOUND"), register 11 (who counts failed corrections), the unanswered part of register 34 (the rule for "has stopped"). Register 30 (waking) is ANSWERED well enough to build from.
6. **Best answer.** Wording: at each hourly wake ROOT wakes ARCH, and ARCH reads the open pull requests; state the rule for "stopped" in one line (for example: its tests passed and no message came by the next wake). Replacing ARCH at each round's end, offered in the first round, is a structural choice still open.
7. **Whose.** Claude's to decide; replacement with jobs open needs the trial.

### 14. The watcher is back, and with it two sentences that cannot both hold

1. **The fault.** The draft says no session starts its own replacement and sessions are at most three levels deep. It also keeps a watcher which, on the record, ROOT started, and whose takeover put ROOT one level down and left no watcher behind. If Bob starts the watcher instead, that is an act missing from his list. If ROOT dies with no watcher, nobody is named to notice.
2. **Sentences.** Section C: "Sessions are at most three levels deep, and none starts its own replacement." Section C: "both recorded takeovers in Process3 left no watcher behind and left ROOT one level deeper than designed." Section N.4: "Who starts the watcher." Acts table: "Start the first session, ROOT | ... and if ROOT dies and no watcher takes over".
3. **Rests on.** Measured (`roles` 1.6, 3.3): two takeovers; the watcher woke once a day by its own alarm; Process3's own decision called a takeover "a bridge: Bob restarts ROOT from his app at depth 0 at his next opportunity". Reasoning: with a daily wake a dead ROOT is found up to a day late, and for that day nothing replaces a dead ARCH or starts PROCESS.
4. **How bad.** Stops a tranche for up to a day; costs Bob an unlisted act either way.
5. **Status.** RAISED BEFORE (first-round finding 9; register 15, answered then by removing the watcher). Reopened by Bob's question of 14 Nov, which the draft answers honestly. STILL OPEN, and the two sentences now contradict.
6. **Best answer.** Wording: either the sentence about replacements and depth gets its exception written in, or the watcher is described as what the record says it was, a bridge until Bob next starts ROOT. Say who tells Bob that ROOT is dead.
7. **Whose.** Bob's to decide (it is his note and possibly his act); the wording is Claude's.

### 15. The shared state is still one sentence

1. **The fault.** The draft says shared state lives in "one place on GitHub" that needs no merge. It does not say what the place is, who writes each part, or how it squares with the kept rule of one writer per file. If the place is made of things written by the sessions' GitHub account, a second suspension of that account could hide it.
2. **Sentences.** Section C: "What every session needs lives in one place on GitHub, in the product's repository, that needs no merge to write and is written only through the process's tool." Section J: "Git and GitHub hold all state, with one writer per file."
3. **Rests on.** Measured (`notes/github-pacing.md` in process3): the suspended account had made 1,387 pushes to the state branch in 19 hours; the cause of the suspension was never learned. Measured (`permissions_inventory.md` row 20): a session writing relayed words of Bob's into a file other sessions load was refused, "[Instruction Poisoning]"; the shared state is to hold "your instructions quoted exactly". Reasoning: ROOT, ARCH, the coordinator and blocked jobs all write there.
4. **How bad.** Stops the first round at the first replacement of ARCH if it does not work; the suspension case could lose the record.
5. **Status.** RAISED BEFORE (register 27, register 9). NOW ANSWERED by Claude's decision in a sentence; not enough to build from. Register 9 STILL OPEN ("NO ANSWER FOUND").
6. **Best answer.** A structural choice written down: name the place (a branch written rarely holds through a suspension better than comments do, because commits stay), list its few entries and the one role that writes each. Honest statement: writing Bob's quoted words there may be refused, and is unproven.
7. **Whose.** Claude's to decide; needs the trial.

### 16. The release has no actor, two of its workflows do not exist, and sessions are forbidden to touch what it must update

1. **The fault.** "The process prepares it" names no session. The record says the product has no workflow for updating the installer or the website page. Bob's approvals forbid sessions to change the installer and the website. The tool, as listed, cannot start a workflow. And the merge of the tranche into main, 7,339 commits, has never been made on this product.
2. **Sentences.** Section D: "The process prepares it and waits for your approval (line 18) ... The release path is unproven." Section D: "ARCH merges the tranche branch into the main branch as a whole, by pull request ... None of the three tests runs on that pull request." Section P.1: "When the journeys that use AI are walked is not said". Section M: the tool "does only this ...".
3. **Rests on.**
   - Measured (`DECISIONS.md` BD-R3, Bob, 8 Nov): "The product has no workflow for either yet"; "The scoped deploy token is Bob's to add to that environment". Same record: Bob, 8 Nov, "Yes, the installer update and site update wait until a release walk with AI on is also clean." So the record does say when the AI journeys must have been walked; section P says it is not said.
   - Counted today: Bob's approvals: sessions "may not change ... the worker civicsmith-site and its website ..., the installer worker newgroup". `release-sign.yml` exists and waits for Bob in a protected environment; it is started by hand on a branch named for the release. The newest release tag on the product is v0.71.0 of 21 Sep, before Process3.
   - Measured (`permissions_inventory.md` 2a): the tranche merged into main 13 times on the probes repository on 2 Nov; never on the product. So a rehearsal on probes repeats what was done and says nothing about the product's merge.
   - Reasoning: workflow files belong to no module, so under the job rule no job may write the two missing workflows unless ARCH gives those files an owner module.
4. **How bad.** Stops the first release; does not stop a tranche.
5. **Status.** RAISED BEFORE (register 29; first-round finding 8). The merge to main is ANSWERED well enough (ARCH; no test runs; unproven). The release itself is listed as unbuilt and unproven; its missing actor and missing workflows are NEW.
6. **Best answer.** Wording and settings: name ARCH as the one that prepares a release; give the workflow files an owner module; add the protected-environment token to Bob's acts; quote Bob's 8 Nov sentence beside his 14 Nov answers and ask whether it still stands. The two are his own words and I do not choose.
7. **Whose.** Needs the build; the AI-walk question is Bob's.

### 17. The trial costs Bob more than the draft says, and several of its items cannot be settled on made-up modules

1. **The fault.** The trial repository is itself a Process3 copy that tells sessions to act on nothing, and the last pushes sessions made there were refused. Before any trial, it needs the same conversion as the product, with Bob's own commits. Several listed items need things made-up modules do not have: a walker, screens, a deployable product, a release, a second account.
