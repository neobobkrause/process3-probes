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

