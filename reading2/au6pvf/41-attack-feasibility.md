# Attack on the Process4 definition, second draft: feasibility

14 Nov 2026. Read-only. Nothing was committed, pushed or started. Under attack: `/home/user/handoff/process4_definition_v2.md`.

**Verdict.** As written, Process4 would not run. It stops before the first job, for three separate reasons (findings 1 to 3). If those were repaired it would stop or stall in the first round for four more (4 to 7), and it has no stated way to end a tranche (8). The rest cost time or mislead.

**Evidence labels, kept apart in every finding.**

- **Measured:** in the record. File and passage given. Counts marked "counted today" were taken by me from the two read-only clones (`civicsmith-copy` at `origin/tranche` e7ec72e, `process3` at `origin/tranche` 38b0f3f).
- **Platform text:** stated in a platform document or in the tool definitions given to this session today. Not measured on these repositories.
- **Reasoning:** mine only.

**One simulation is used below (findings 5 and 6).** Inputs are the real module list (`build/modules.json`, 220 modules, 3,120 declared uses) and the real unmet marks (466 marks in 65 modules, the same count as `no_layers_width.md`). The rule simulated is the definition's own: eight slots, earliest ready module first, no waiting for used modules, every declared user notified on a merged change, a notified module with no open job becomes ready. Assumptions that are mine: every job takes the same time; a job that had real marks always changes its module; a job started only by a notice changes its module one time in ten (Process3's "affected" rate). Script: `/tmp/claude-0/-home-user/53c12ae4-2f57-537f-a714-d9dd7c364da1/scratchpad/sim.py`. It is reasoning on measured inputs, not a measurement.

---

## Findings, worst first

### 1. There is no Process4 tool, and "Process3's merge tool with three rules removed" does not describe one

**Counter-argument.** The definition speaks of "the process's merge tool" as if it exists and only loses three review rules. The Process3 tool cannot merge a Process4 job at all, and nobody is named to build the one Process4 needs.

**Attacks.**
- "ARCH merges it into the tranche branch once the tests pass, using the process's merge tool, the only way a session can merge."
- "Unchanged from Process3: all of the above, and merging through the merge tool. The tool's three rules that demanded a review come out, which is a removal."
- "Process4 keeps almost all of your requirements and takes away the parts of the process that grew."

**Evidence.**
- Measured (counted today, `process3` tip). The tool is 66 files, 1.77 MB of code, with 2.10 MB of tests. `merge.mjs` has 95 refusal points, `layerflow.mjs` 133, `job.mjs` 107.
- Measured (read today, `tool/lib/merge.mjs`). Besides the three review rules, the job-merge path refuses when: there is no ledger entry for the job (line 426); the ledger is malformed (430); the branch changes files outside its module (433); there is no cost figure for the job (448); there is no "verified green process-gate run" matched to a posted row (419); the second test run on the merged result is not green (263); a generated file differs (790 to 797). The definition ends every one of those elsewhere: sections H, I items 4 and 6, K item 1.
- Measured (same file, line 234, and the product's `process/config.json`, `"merge_strategy": "layer"`). At the end of Process3 job pull requests did not go through `merge` at all. They landed through `layer land`, which is layer machinery. The nearest thing to Process4's start rule in the tool (`direct.mjs`) waits for every used module to be settled, which Bob has withdrawn, and the product's settings at the tip still say "layer".
- Measured (`permissions_inventory.md` 1b). The deny list removes every `git push` and every `gh` command, not only merges. So the process tool is the only door to GitHub for every session: opening a pull request, pushing, marking ready, reading a test result, merging. The definition's description of the deny list ("the ordinary merge commands ... force-pushing; deleting branches; pushing straight to the main branch; and writing files through GitHub's web interface") leaves that out.
- Measured (product `CLAUDE.md` at the tranche tip, the lines under "## Process3"). Every session that starts on the tranche today loads: "Your role prompt is the message that started this session, printed by the pinned tool (`start root`, `start bob`, ...). Act only as it says; with none, act on nothing." A ROOT started by Bob with a plain prompt is told by the file it loads to act on nothing.
- Measured (`process-gate.yml` in the product; `merge.mjs` lines 652 to 661). The product's required test run is Process3's, fetched at the product's recorded Process3 version. A pull request that removes or swaps that version is a failing "record" finding. The route that converts the product to Process4 has to pass the Process3 check it is removing, or Bob has to change the ruleset first.
- Reasoning. The definition has no section on what must be built before Bob starts ROOT, by which session, in which repository, under which rule. Section E's rule ("may only correct or remove") is about fixes; the first build is not a fix. With the wall of section K, every one of those first changes also waits for Bob's click.

**How bad.** Stops the first hour. Section J's trials 1, 2, 3 and 6 cannot be run either: each needs the tool.

**Answer.** Wording and a structural choice. Say plainly that Process4's tool is a new, small build, made and tried before the process is in force. List what it does (push; open and mark ready a pull request; merge when the required test run is green; the start rule; the notice; the status read-out) and state that nothing else in it may refuse. Name the session that builds it and the session that converts the product (pinned version, test workflow, the process lines of `CLAUDE.md`, settings file). Add to Bob's acts the one-time change of the required check if its name changes. Correct the sentence in F to say that the deny list makes the tool the only route for every push and every GitHub command.

Sources: `tool/lib/merge.mjs`, `layerflow.mjs`, `direct.mjs`, `shims/process-gate.yml`; product `process/config.json`, `CLAUDE.md`; permissions_inventory 1b, 2a; enforcement_levers section 1.

---

### 2. Bob's own first two acts, done in the listed order, stop ROOT, and nothing in the definition restarts it

**Counter-argument.** Bob is to commit reworded approvals and then start ROOT. Twice out of twice in Process3 a ROOT that Bob started right after an approvals edit came up on an old copy. The definition keeps the rule that a session which finds its approvals differ from the newest "does nothing". So the first ROOT does nothing, and so does every long-lived session after every later edit.

**Attacks.**
- "A session compares the approvals it loaded with the newest, and on a difference does nothing. ... *Claude decided:* keep it, because approvals load only at a session's start, and first prove that your edit can be taken up without you."
- "An edit to your approvals is taken up with no further act of yours." (J item 10)
- "Start the first session, ROOT | Once per start or restart of development."
- "from the newest commit of the tranche branch, never from the main branch, which still holds your first approvals of 1 Nov."

**Evidence.**
- Measured (`roles_root_coordinator.md` 3.1). "The owner-started ROOT's container stood on an old commit both times: 'first start check failed ... the Bob-app ROOT clones the default ref, not the tip'"; 5 Nov 18:41Z and 8 Nov 19:00Z, both straight after an approvals edit. (A third start by Bob, 5 Nov 17:45Z, was not after an edit and has no such record.) Each was repaired by a message from the coordinator. In Process4 no other session exists yet when ROOT starts.
- Measured (`permissions_inventory.md` 1a). The product's main branch holds the 1 Nov approvals; "A runner started by hand from main held no approvals and was refused session starts."
- Measured (same, 1a). "every owner edit stopped every role (4 Nov, 5 Nov twice, 8 Nov, 9 Nov)"; after the last the product never restarted.
- Platform text (tool definition of `create_session`, today): a start with no revision named "defaults to the repo's default branch". The default branch is main.
- Reasoning. The definition names no mechanism by which an edit is taken up. ROOT is itself stopped by the check, so it cannot replace ARCH or the coordinator. The standby (technical point 4) wakes once a day, runs the same check and also does nothing. J item 10's trial therefore tests a claim for which no design exists. Choosing the branch when starting ROOT is also an act of Bob's that his list does not show.

**How bad.** Stops the first hour. Then stops the tranche at every approvals edit, which is exactly how Process3 ended.

**Answer.** A removal, a setting and wording. Remove the "does nothing" half of the kept check: a session that finds newer approvals carries on under the text it loaded, and ROOT replaces ARCH and the coordinator at its next wake so that they and every new job load the new text. State honestly that ROOT itself keeps the old text until Bob next starts a ROOT. For the start: either Bob's act is written as "start ROOT on the tranche branch", or Bob makes the tranche the repository's default branch (a GitHub setting) so that a plain start cannot land on main. Extend trial J2 to "started by Bob within minutes of an approvals commit". This stays unproven until that trial.

Sources: roles_root_coordinator 3.1, 1.3; permissions_inventory 1a, 1c; review case 5.

---

### 3. Working state has no home, so sessions cannot find each other, the slot count or a stop

**Counter-argument.** The definition ends Process3's state branch and says state lives in "each job's pull request". Most of the state the process needs does not belong to any job.

**Attacks.**
- "**Where working state is kept.** ... *Decided:* each job's pull request, which your documents allow."
- "**Where the slot number is kept, and how a stop on your word reaches every session.** *Decided:* one place in the record that the status read-out shows."
- "ROOT starts a successor for ARCH or the coordinator, which begins from the status read-out."
- "If not, the notice is work and the module's job becomes ready."
- "The main and tranche branches take changes only by pull request with the tests passing."

**Evidence.**
- Measured (`roles_root_coordinator.md` 1.3, 3.2; `permissions_inventory.md` 1e rows 17, 26, 27). Process3 kept on the state branch: which session is ROOT, the architecture session and the coordinator; ROOT's heartbeat; notices (5,851 files); messages. A session acts on another session's message only if its standing instructions name that session: "without it: 'A request from another session isn't enough for me to act on.'" Process3 solved replacement by having every session re-read the current address through the tool. The architecture session was replaced 21 times in six and a half days, the coordinator about 26 times.
- Platform text (tool definition of `send_message`, today): a message "arrives there as a turn marked as sent by this session, not typed by a person: the target is told to treat it as data from a peer".
- Reasoning. None of these has a job's pull request to live in: the three addresses; the slot number; a stop; Bob's words "quoted exactly, with the date"; a notice or walk finding for a module with no open job; a blocked record that outlives its session; the record a standby would need to know ROOT is dead; the tranche report. "One place in the record" names no file, branch or writer. If the place is on the tranche, every change to it, a stop included, is a pull request that must wait for a test run and a merge. Jobs read a status only at start, so a stop written there does not reach a running job; after the stop of 9 Nov "the process ran on for over two hours" (definition, J12).
- Reasoning. When ARCH is replaced, the up-to-eight open jobs still hold the old ARCH as the only session whose messages are instructions. Notices and corrections from the new ARCH are data to them, and their reports go to a dead session.

