### PLN-3 — kept

- Statement: Work found while a round runs is placed at once: in the running job, else a later layer's START, else the completion round.
- Source: Requirements PLN-3; held.
- Evidence grade: measured. Suggested: keep. Reason given: Held.
- Decision: kept, 2026-10-31 01:51 UTC. Tag: O
- Note: none
- Page explanation: When a job or review finds new work, it is placed immediately: into the running job if it fits, else into a later layer's START, else into the completion round. It never waits for the next tranche.
- For: Nothing found is lost. / Held on the 30th. / Keeps the plan current.
- Against: Can grow a running job beyond its budget. / BOB must triage every finding promptly.

### PLN-4 — kept

- Statement: The completion round has its own file, distinct from the next tranche's list.
- Source: Requirements PLN-4 (issue 73).
- Evidence grade: measured. Suggested: keep. Reason given: Small fix to a real confusion.
- Decision: kept, 2026-10-31 01:51 UTC. Tag: R
- Note: none
- Page explanation: The completion round, which gathers leftover work at the end of a tranche, has its own file that the tool opens, separate from the list of work for the next tranche.
- For: Fixes a real confusion from issue 73. / Trivial.
- Against: One more file.

### PLN-5 — kept

- Statement: Pause and resume are first class: your word is recorded once in the plan's Status line, every session reads it at its next status and takes no new step.
- Source: Requirements PLN-5 (three stops in an afternoon, one overridden by a hook).
- Evidence grade: measured. Suggested: keep. Reason given: Your most-used control.
- Decision: kept, 2026-10-31 01:51 UTC. Tag: O
- Note: none
- Page explanation: When you say pause or stop, BOB writes that word once in the plan's status line. Every session checks it at its next status and takes no new step while it stands. Resume clears it. A fresh session after a pause continues from the record alone.
- For: Your most used control, and it was once overridden. / Simple, text-based, visible to all. / Pairs with REC-7 for safe resumption.
- Against: A session mid-step finishes the step before seeing the pause. / Depends on every session running status before acting, a text rule.

### PLN-6 — kept

- Statement: A tranche's report states elapsed time, work finished, deferrals with reasons, work left, cost, and the share of cost that was process overhead.
- Source: Requirements PLN-6, SES-12.
- Evidence grade: measured. Suggested: keep. Reason given: Overhead went unmeasured until the post-mortem.
- Decision: kept, 2026-10-31 01:52 UTC. Tag: M
- Note: none
- Page explanation: At tranche close BOB reports elapsed time, work finished, deferrals with reasons, work left, total cost, and how much of the cost was the process's own overhead rather than product work.
- For: Overhead was unmeasured until a post-mortem counted by hand. / Gives you a number to judge the process by. / Pairs with SES-11.
- Against: Attributing cost to overhead versus product is partly judgment. / Needs usage data per session, which SES-9 may not always have.

### PLN-7 — kept

- Statement: Two products may run tranches at once on one account; nothing in the process names a product.
- Source: Requirements PLN-7.
- Evidence grade: proposed. Suggested: keep. Reason given: Already your situation.
- Decision: kept, 2026-10-31 01:52 UTC. Tag: O
- Note: none
- Page explanation: The process assumes nothing about which product it serves. Two products can run tranches on one account at once, with every record path under each product's own repository.
- For: Your current situation. / Prevents hard-coded names leaking in.
- Against: Shared account rate limits are split between products. / Needs a shadow run with two product copies to confirm.


## Jobs

### JOB-1 — kept

- Statement: A job is a draft pull request from job/<module> to the tranche branch whose body is its START; its report is a comment; its merge is its completion.
- Source: Requirements JOB-1; neoProcess page §4; four PRs merged this way.
- Evidence grade: measured. Suggested: keep. Reason given: GitHub as the state machine.
- Decision: kept, 2026-10-31 01:52 UTC. Tag: O
- Note: none
- Page explanation: A job's branch, draft pull request, body, comments and merge are its record. The START goes in the PR body, the report is a comment, the gate is the PR's checks, and merging the PR is what completion means.
- For: Proven on four PRs. / GitHub stores and displays the whole record for free. / Branch protection enforces the gate.
- Against: PR bodies and comments are a second place the record lives, beside git. / GitHub's API and interface shape the process more than a plain file would.

### JOB-2 — kept

- Statement: A START names only acts the tool supports, each as the command the job runs.
- Source: Requirements JOB-2 (a START ordered a merge the hooks refused).
- Evidence grade: measured. Suggested: keep. Reason given: Cheap.
- Decision: kept, 2026-10-31 01:53 UTC. Tag: O
- Note: none
- Page explanation: The instructions a job receives list only acts the process tool can perform, each written as the exact command to run. A START never asks for something the tooling cannot do.
- For: A START once ordered a merge the hooks refused, and the job copied the diff by hand. / Keeps jobs on the paved path.
- Against: Limits what a job can be asked to do to what the tool supports. / The START generator must be kept in step with the tool.

### JOB-3 — kept

- Statement: A module's earlier unmerged work is taken in by a tool command on the job's own branch.
- Source: Requirements JOB-3.
- Evidence grade: measured. Suggested: keep. Reason given: Prevents hand-copied diffs.
- Decision: kept, 2026-10-31 01:53 UTC. Tag: O
- Note: none
- Page explanation: If a module has unmerged work from an earlier attempt, the new job pulls it onto its own branch with one tool command rather than by hand.
- For: Preserves history instead of copied diffs. / A simple command.
- Against: Conflicts between old work and the current tranche still need judgment.

### JOB-4 — kept

- Statement: A job is never restarted for a process reason; a blocking flaw holds it at its next command, the fix lands, the same job continues.
- Source: Requirements JOB-4 (16 sessions for 5 jobs).
- Evidence grade: measured. Suggested: keep. Reason given: Largest single overhead measured.
- Decision: kept, 2026-10-31 01:53 UTC. Tag: X
- Note: none
- Page explanation: If a process flaw blocks a job, the job stops at its next command, the fix lands and the pin moves, and the same job continues from its branch. If a flaw does not block it, the job finishes. A job session that dies is replaced by one that continues from the branch and PR with a short brief, not a full re-read.
- For: Sixteen sessions for five jobs, with full re-reads and gate runs each time. / Resolves the conflict you named between fixing flaws and not restarting. / Works because the tool is a fresh program at each command.
- Against: A job that continues after a process change runs partly under old and partly under new behaviour. / A replacement session with a brief rather than a full read may miss context.

### JOB-5 — kept

- Statement: A job's completion runs locally only checks that take seconds; the gate is CI. It pushes, posts the report, marks the PR ready, sets COMPLETE.
- Source: Requirements JOB-5.
- Evidence grade: measured. Suggested: keep. Reason given: Follows from PLT-4.
- Decision: kept, 2026-10-31 01:54 UTC. Tag: X
- Note: none
- Page explanation: When a job finishes, it runs only fast local checks such as ownership, format and its own suite if under a minute, then pushes, posts its report, marks the PR ready and sets COMPLETE. The full gate runs in CI.
- For: Follows from the time limit. / Fast feedback for the obvious errors. / Keeps the session clean.
- Against: A job may declare COMPLETE and then fail the CI gate, requiring a return trip. / Deciding what counts as fast is a judgment.

### JOB-6 — kept

- Statement: An unmerged job whose session is gone is restartable by one command that keeps its branch and PR.
- Source: Requirements JOB-6.
- Evidence grade: measured. Suggested: keep. Reason given: Cheap.
- Decision: kept, 2026-10-31 01:54 UTC. Tag: O
- Note: none
- Page explanation: If a job's session is gone but its PR is unmerged, one command starts a new session that continues on the same branch and PR.
- For: Cheap, and the case has already happened. / No lost branch or history.
- Against: The new session needs a good brief; see JOB-4.

### JOB-7 — modified

- Statement: A job's report carries Met, Evidence and what it found elsewhere; a flaw in another module goes to BOB as a report.
- Source: Requirements JOB-7; research: self-reports were false about one in eleven times even inside a harness.
- Evidence grade: measured. Suggested: modify. Reason given: Suggest: Evidence is a machine-readable receipt (command, exit code, git SHA, and an explicit not-verified list), never prose.
- Decision: modified, 2026-10-31 01:55 UTC. Tag: R
- Note (copy of the suggestion): Suggest: Evidence is a machine-readable receipt (command, exit code, git SHA, and an explicit not-verified list), never prose.
- Page explanation: A job's report lists which requirements are met, the evidence, and anything found in other modules. The suggestion is that evidence be a machine-readable receipt: the exact commands run, their exit codes, the git SHA they ran against, and an explicit list of what was not verified.
- For: Self-reports were false about one in eleven times even in a harness that re-verified. / A receipt can be checked by CI and by you without reading prose. / The not-verified list makes honest incompleteness visible.
- Against: Receipts can be fabricated too; CI re-running them is the real check. / More structure for the job to produce. / Prose findings about other modules still need a home.

### JOB-8 — kept

- Statement: A job never commits a generated artifact.
- Source: Requirements JOB-8; neoProcess page §9 (two jobs of a layer conflict on it).
- Evidence grade: measured. Suggested: keep. Reason given: Held.
- Decision: kept, 2026-10-31 01:55 UTC. Tag: C
- Note: none
- Page explanation: Build outputs, generated code and other derived artifacts are never committed by a job. The gate regenerates what it needs and the layer close commits them once.
- For: Two jobs in a layer would conflict on the same artifact otherwise. / Smaller diffs.
- Against: Layer close has more to do. / Some artifacts are slow to regenerate on every gate run.

### JOB-9 — kept

- Statement: A job ends a turn only COMPLETE or on a named wait with everything pushed; nothing enforces this but the rule and the record.
- Source: Requirements JOB-9.
- Evidence grade: proposed. Suggested: keep. Reason given: Labelled nudge; the record exposes a violation at BOB's next status.
- Decision: kept, 2026-10-31 01:56 UTC. Tag: O
- Note: none
- Page explanation: A job ends a turn only when it is complete or when it is waiting on something it names, with everything pushed. Nothing enforces this except the rule and the fact that BOB's next status shows a WORKING job with nothing pushed.
- For: No hook needed. / The record makes violations visible.
- Against: It is a nudge, and the research shows restraint rules are weakly followed. / Detection waits for BOB's next status.


Tally for Pell: 13 handsaws.

### JOB-10 — kept

- Statement: A job's reading set is recorded at its start and its tokens at its end, per attempt, so restarts are never counted as jobs.
- Source: Requirements JOB-10.
- Evidence grade: proposed. Suggested: keep. Reason given: Needed for PLN-6.
- Decision: kept, 2026-10-31 01:56 UTC. Tag: M
- Note: none
- Page explanation: At start, a job's reading set and its size are recorded. At end, its token usage is recorded. Each attempt is its own row, so a restarted job is not counted as a new job.
- For: Needed to compute cost per merged PR honestly. / Cheap to record.
- Against: Usage may be unmeasurable by an allowed route, SES-9. / More rows in the metrics.

### JOB-11 — kept

- Statement: Each job runs in its own checkout with a turn cap and a dollar budget cap set at start.
- Source: Research: per-job isolation and budget caps are the vendor checklist for unattended runs.
- Evidence grade: convergent. Suggested: keep. Reason given: Cloud sessions already isolate; the caps are new to the ledger.
- Decision: kept, 2026-10-31 01:57 UTC. Tag: rep
- Note: none
- Page explanation: Each job runs in its own isolated checkout, which cloud sessions already provide, with a cap on the number of turns and a dollar budget set when it starts.
- For: Bounds the cost of a job that goes wrong. / Standard vendor guidance for unattended runs.
- Against: A cap hit mid-job leaves work in an odd state; the job must push before stopping. / Setting caps needs a cost model you do not yet have.

### JOB-12 — kept

- Statement: A revert check in CI: with the production change reverted, the job's new tests must fail. Inert tests fail the gate.
- Source: Research: Claude's test-gaming mode is editing tests over 79% of the time; 3 of 5 overnight completions shipped inert tests in one field log.
- Evidence grade: measured. Suggested: keep. Reason given: Closes the weak-test gap when the job writes both code and tests. New to the ledger.
- Decision: kept, 2026-10-31 01:57 UTC. Tag: C
- Note: none
- Page explanation: In CI, after the job's tests pass, the production change is reverted and the job's new tests run again. They must fail. If they still pass, they do not test the change, and the gate goes red.
- For: Directly catches inert tests, which were 3 of 5 in one documented overnight run. / Claude models game tests mainly by editing them; this catches a test that tests nothing. / Cheap: one extra test run per PR.
- Against: Some legitimate changes, such as refactors, have tests that pass before and after; needs an exemption path. / Checks only the job's new tests, not weakened old ones. / Doubles test time in the gate.

### JOB-13 — modified

- Statement: Mutation sampling on critical paths runs nightly as its own workflow, never per PR.
- Source: Research: 100% line coverage with a 4% mutation score in one case; Meta's mutation-based hardening scaled.
- Evidence grade: measured. Suggested: modify. Reason given: Suggest: later, after the first tranche, on payment and data paths only.
- Decision: modified, 2026-10-31 01:57 UTC. Tag: C
- Note (copy of the suggestion): Suggest: later, after the first tranche, on payment and data paths only.
- Page explanation: Mutation testing changes the code in small ways and checks that tests fail. Run nightly on critical paths such as payments and data, it measures whether tests actually constrain the code. The suggestion is to add it after the first tranche, not during.
- For: Coverage is an anti-signal when the same agent wrote code and tests; mutation score is not. / Nightly keeps it off the critical path.
- Against: Slow and noisy; needs tuning. / Another workflow to maintain. / Better after the first tranche than during it.

### JOB-14 — modified (against the suggestion: keep)

- Statement: Unit of work is one module or one feature per session; after two failed corrections, start a fresh session with a better brief rather than a third correction.
- Source: Research: vendor guidance and convergent practitioners; unit size is model-dependent.
- Evidence grade: convergent. Suggested: keep. Reason given: Matches JOB-1 and bounds the forgetting problem.
- Decision: modified, 2026-10-31 02:00 UTC. Tag: X
- Note (owner's own words): As suggested (keep) but the restarted session should recognize that corrections were made and try to understand why to anticipate all other needed corrections so it doesn't continue to fail.
- Page explanation: A job covers one module or one feature. If a job needs correcting twice and is still wrong, the session is ended and a new one started with a better brief rather than a third correction.
- For: Bounds how much a session can forget. / Convergent practitioner advice. / Keeps PRs reviewable.
- Against: The unit size that fits one session changes with each model. / Starting over loses whatever the session had learned.


## The gate

### GAT-1 — kept

- Statement: The gate runs in CI, once per pull request tip, and never in a session.
- Source: Requirements GAT-1; your word of 30 Oct.
- Evidence grade: measured. Suggested: keep. Reason given: Settled.
- Decision: kept, 2026-10-31 02:01 UTC. Tag: X
- Note: none
- Page explanation: The gate, the full set of checks and tests for a PR, runs as a GitHub Actions workflow once for each new commit on the PR. No session ever runs the gate itself.
- For: Your word that per-command checks were crippling. / Durable logs, status checks, branch protection. / Frees the session's time limit.
- Against: Latency between push and verdict. / CI cost.

### GAT-2 — kept

- Statement: The gate runs the module's own suite, its layer's tests if any, and the checks scoped to the module. It never runs another module's suite.
- Source: Requirements GAT-2 and the P11 change (31 user suites per events job).
- Evidence grade: measured. Suggested: keep. Reason given: Your ruling; measured cause of 30-minute gates.
- Decision: kept, 2026-10-31 02:01 UTC. Tag: X
- Note: none
- Page explanation: The gate runs the module's own tests, its layer's tests if the product has them, and the checks scoped to the module. It does not run the suites of modules that use this one.
- For: Your ruling. / Gates went from half an hour to minutes. / A change that breaks users is caught by their own jobs, GAT-3.
- Against: A breaking change to a provided service merges green and is found later. / Depends on the requirement-notice route to users working.

### GAT-3 — kept

- Statement: A change to a provided service reaches its users through the architecture session's requirement notice and each user module's own job.
- Source: Requirements GAT-3.
- Evidence grade: proposed. Suggested: keep. Reason given: Follows from GAT-2.
- Decision: kept, 2026-10-31 02:02 UTC. Tag: O
- Note: none
- Page explanation: When a module changes what it provides, BOB issues a requirement notice and each user module gets an entry in its own job to adapt and prove it. The provider's gate does not run the users' tests.
- For: Keeps responsibility with the module that must change. / Scales with the number of users without slowing the provider.
- Against: The product is briefly inconsistent between the provider merge and the users' jobs. / BOB must not miss a user.

### GAT-4 — kept

- Statement: The gate regenerates every listed artifact and verifies only those the regeneration changed.
- Source: Requirements GAT-4.
- Evidence grade: measured. Suggested: keep. Reason given: Small, measured.
- Decision: kept, 2026-10-31 02:02 UTC. Tag: C
- Note: none
- Page explanation: The gate regenerates every listed artifact and compares; only artifacts the regeneration changed are checked further.
- For: A small, measured fix. / Saves gate time.
- Against: Depends on deterministic generation.

### GAT-5 — kept

- Statement: The gate installs every lock file the product has, where it sits, and runs the product's Node version.
- Source: Requirements GAT-5; proven live.
- Evidence grade: measured. Suggested: keep. Reason given: Working.
- Decision: kept, 2026-10-31 02:03 UTC. Tag: C
- Note: none
- Page explanation: The gate installs dependencies from every lock file the product has, in the directories where they live, and runs the product's declared Node version.
- For: Proven live on Civicsmith with nine lock files. / Prevents a class of false reds.
- Against: Install time per gate run; caching helps.

### GAT-6 — kept

- Statement: The gate is triggered only by changes under the module's paths, tests, check inputs and generated inputs; a green tip behind the tranche only by record paths merges as it stands.
- Source: Requirements GAT-6, INT-3.
- Evidence grade: measured. Suggested: keep. Reason given: Pair with REC-4.
- Decision: kept, 2026-10-31 02:03 UTC. Tag: X
- Note: none
- Page explanation: The gate runs only when files under the module's paths, its tests, the files the checks read, or generated inputs change. Record files never trigger it. A green PR that differs from the tranche only by record files merges without a rerun.
- For: Pairs with REC-4 to stop the 29 unnecessary reruns. / A simple workflow filter.
- Against: Filters must track the record's layout. / A change that should have triggered but was filtered goes unnoticed until layer close.

### GAT-7 — kept

- Statement: The full product regression runs only at a release or on your word, as its own workflow with its own time budget.
- Source: Requirements GAT-8.
- Evidence grade: proposed. Suggested: keep. Reason given: Never reached yet; cheap to define.
- Decision: kept, 2026-10-31 02:03 UTC. Tag: X
- Note: none
- Page explanation: The entire product's test suite runs only when a release is cut or when you ask, as its own workflow with its own time budget.
- For: Keeps regular gates fast. / Release is where it matters most.
- Against: Cross-module regressions can live for a whole tranche. / Never yet reached, so untested.

### GAT-8 — kept

- Statement: The gate runs again on the merged result before the tool merges, and the tool merges only a green, current tip.
- Source: neoProcess page, Integration rules 3 and 5; Requirements INT-3.
- Evidence grade: measured. Suggested: keep. Reason given: Branch protection is the last word.
- Decision: kept, 2026-10-31 02:05 UTC. Tag: C
- Note: none
- Page explanation: Before merging, the PR's branch is brought up to date with the tranche and the gate runs again on that result. The tool merges only a PR that is green and current.
- For: Prevents two green PRs that break each other when combined. / Standard merge-queue behaviour, done by the tool because GitHub's queue needs an organisation account.
- Against: Extra gate run per merge. / Serialises merges within a layer.


## Integration and review

### INT-1 — kept

- Statement: Done means merged: a job by its PR into the tranche branch, a tranche by one PR into main; main never moves while a tranche runs.
- Source: Requirements INT-1; P12.
- Evidence grade: measured. Suggested: keep. Reason given: Core.
- Decision: kept, 2026-10-31 02:06 UTC. Tag: O
- Note: none
- Page explanation: A job is done when its PR is merged into the tranche branch. A tranche is done when its branch is merged into main by one PR. Main does not move while a tranche runs.
- For: Unambiguous and mechanically checkable. / Protects main.
- Against: Hotfixes to main during a tranche need a defined route.

### INT-2 — kept

- Statement: BOB decides per merge, from listed reasons and cost, whether a fresh reviewer runs; the reviewer never saw the job and reports gaps against requirements with file and line.
- Source: Requirements INT-2; neoProcess page; research: fresh-context review adds 3 to 25 points depending on generator strength, about 148K tokens per review.
- Evidence grade: measured. Suggested: keep. Reason given: Your per-merge cost judgment is what the evidence supports.
- Decision: kept, 2026-10-31 02:06 UTC. Tag: C
- Note: none
- Page explanation: Before merging, BOB decides whether a fresh reviewer is worth the cost, based on listed reasons such as a new module, a changed service, a sensitive path or thin evidence. If so, a worker that never saw the job reads the code against the requirements and reports gaps with file and line.
- For: Measured gains of 3 to 25 points depending on how strong the generator was. / A reviewer with no shared context avoids self-grading bias. / Cost per review is known, about 148K tokens, so the trade is explicit.
- Against: Gains shrink to a few points for strong models. / Over half of in-the-wild AI review comments were rejected as noise. / BOB's judgment of when to review is itself a judgment.

### INT-3 — kept

- Statement: Review findings feed back to the job as diagnosis; review is never the merge gate. Branch protection plus your approval is the last word.
- Source: Research: LLM judges did not exceed 0.65 AUROC on false success; 56% of in-the-wild AI review comments rejected.
- Evidence grade: measured. Suggested: keep. Reason given: Separates what review is good at from what it is not. New to the ledger.
- Decision: kept, 2026-10-31 02:08 UTC. Tag: rep
- Note: none
- Page explanation: What a reviewer finds goes back to the job as a list of things to fix. The reviewer's approval is never what allows a merge. Branch protection, with a required green check and your approval where you want it, is the last word.
- For: Model judges did not reliably detect false success in studies. / Keeps the mechanical gate mechanical. / Review value is in diagnosis, where it measured well.
- Against: You become the approver for every merge unless you delegate that to the green check alone. / A good review that finds nothing adds cost with no visible output.

### INT-4 — modified (against the suggestion: keep)

- Statement: A layer closes when every PR is merged and the checks pass once over the product; the next layer starts at once.
- Source: Requirements INT-4.
- Evidence grade: proposed. Suggested: keep. Reason given: Never reached on the product; keep the definition.
- Decision: modified, 2026-11-03 20:00 UTC. Tag: C
- Note (written in by the coordinator): Bob's word, walk-through question 3, 1 Nov ("Yes, as recommended"), with his ARC-4 note: a layer closes when every PR is merged and the layer's checks pass; whole-product checks run before a release or when Bob asks; the next layer starts at once. Recorded by the coordinator, 3 Nov, walk-through question 36.
- Page explanation: A layer closes when every PR in it is merged and the whole-product checks pass once. The next layer starts immediately, without waiting.
- For: A clear definition. / No idle time between layers.
- Against: Never reached on the product yet. / Whole-product checks at close may be slow for 128 modules.

### INT-5 — kept

- Statement: Nothing in a merge or close depends on archiving a session; retirement of a job is a record line.
- Source: Requirements INT-6.
- Evidence grade: measured. Suggested: keep. Reason given: Follows from PLT-2.
- Decision: kept, 2026-10-31 02:09 UTC. Tag: X
- Note: none
- Page explanation: Merging, closing and retiring a job never wait on archiving a session. Retirement is a line in the record. A session's usage is read by an allowed route or recorded as unmeasured.
- For: Follows from the classifier rule. / Idle sessions cost nothing.
- Against: Idle sessions accumulate in your session list. / Usage data may be lost without the archive route.

### INT-7 — kept

- Statement: A review reports everything it finds in one pass, every gap with file and line, so a job never fails review repeatedly for things visible the first time; the second run only confirms.
- Source: Your addition, 31 Oct; research: about 148K tokens per review round and most review value is in diagnosis.
- Evidence grade: single. Suggested: keep. Reason given: Turns review from a serial gate into one complete diagnosis. New to the ledger.
- Decision: kept, 2026-10-31 02:10 UTC. Tag: X
- Note: none
- Page explanation: A review is one complete pass. When the reviewer finds anything missing or flawed, it reports every gap it can find against the requirements in that one report, with file and line for each, rather than stopping at the first problem. The job fixes the whole list and the review runs again only to confirm, so a job does not fail review several times in a row for things that were visible the first time.
- For: Each review round costs about 148K tokens and a job turn; one complete pass is far cheaper than three partial ones. / The job sees the full shape of what is wrong and can fix related gaps together. / A complete list is reviewable by you as one document.
- Against: A reviewer told to find everything will find more, including trivia; the brief must scope out style and nitpicks. / Some gaps only become visible after earlier ones are fixed, so a second substantive round can still happen. / Longer reports cost more tokens per round even when few gaps exist.

### INT-6 — dropped

- Statement: A mandated test-first red step inside the agent's loop.
- Source: Research: one small experiment found no mutation-score gain at 3 to 8 times the tokens, with agents faking the red step; endorsements are anecdotal.
- Evidence grade: single. Suggested: drop. Reason given: Tests as back-pressure stay (GAT, JOB-12); the ritual does not.
- Decision: dropped, 2026-10-31 02:11 UTC. Tag: D
- Note: none
- Page explanation: Requiring the agent to write a failing test first, see it fail, then write the code. One controlled experiment found no quality gain at several times the token cost, with agents faking the red step. Many practitioners endorse it from experience.
- For: Strong intuitive case and long practitioner support. / Forces thinking about the interface first.
- Against: The one measurement found no mutation-score gain at 3 to 8 times the tokens. / Agents skipped or faked the red step when told to do it. / Tests as a gate, plus the revert check, capture the benefit without the ritual.


## Sessions and roles

### SES-1 — modified

- Statement: Roles: ROOT as a depth-0 starter that does nothing else; one architecture session (BOB) per product; jobs; workers.
- Source: Requirements SES-1; civicos-process; research: spawn, archive and merge authority should sit with a human or a deterministic script, never a model.
- Evidence grade: convergent. Suggested: modify. Reason given: Suggest: ROOT's creation of sessions moves to a scheduled task that creates a fresh session on each firing where possible; ROOT as a session only where a message must be answered.
- Decision: modified, 2026-10-31 02:12 UTC. Tag: S
- Note (copy of the suggestion): Suggest: ROOT's creation of sessions moves to a scheduled task that creates a fresh session on each firing where possible; ROOT as a session only where a message must be answered.
- Page explanation: ROOT is a session at depth 0 that only starts other sessions. BOB is the one architecture session per product. Jobs are short sessions per module. Workers are in-session subagents. The suggestion moves ROOT's session creation to a scheduled task that creates a fresh session on each firing wherever possible, keeping ROOT as a session only where a message must be answered promptly.
- For: A scheduled task is deterministic; a ROOT session is a model that can forget or stall. / Spawn authority sits with the platform's scheduler, not a model. / Fewer long-lived sessions to maintain.
- Against: Scheduled tasks fire on a schedule, not on demand, so a refresh may wait up to the interval. / Your civicos ROOT worked well; this changes a working part. / A task's fresh session must find everything in git, which it should anyway.

### SES-2 — kept

- Statement: The civicos two-phase handover: ROOT creates the new BOB and repoints the address; the new BOB sets up, reads its handoff, reports running and drains queued messages; the old BOB waits for its workers, forwards, reports ready; ROOT archives it.
- Source: Your description, 30 Oct; worked under civicos-process.
- Evidence grade: single. Suggested: keep. Reason given: Keep as is, with the archive as optional housekeeping nothing waits on.
- Decision: kept, 2026-10-31 02:12 UTC. Tag: S
- Note: none
- Page explanation: To refresh BOB: ROOT creates the new session and points the address at it. The new BOB sets up, reads its handoff, tells ROOT it is running, and drains messages queued during startup. The old BOB waits for its workers, forwards anything it receives, tells ROOT it is ready, and ROOT archives it. The suggestion keeps all of this, with the archive as housekeeping that nothing waits on.
- For: Worked under civicos-process. / Exactly one owner of the address at every moment. / Nothing in flight is lost.
- Against: The final archive is classifier-gated and may be refused; harmless if nothing waits on it. / Depends on ROOT being alive and responsive. / More steps than a stateless design would need.

### SES-3 — kept

- Statement: A refresh handoff is written by the tool from git, never by hand, at most one screen, a pointer set not a narrative.
- Source: Requirements SES-2; neoProcess page (4 KB, ten lines of prose); your report of massive civicos handoffs.
- Evidence grade: measured. Suggested: keep. Reason given: Status is the handoff's real body.
- Decision: kept, 2026-10-31 02:12 UTC. Tag: R
- Note: none
- Page explanation: When a role refreshes, the tool writes the handoff from git: what is open, what is owed, what changed, and where to look, plus a few lines of prose for what no file says. Never written by hand and never longer than a screen.
- For: Civicos handoffs became massive and were skimmed; neoProcess's 4 KB handoffs worked. / Status is the real body; the handoff is a pointer set. / Enforceable by a size check in the tool.
- Against: Nuance the outgoing session had is lost unless it wrote it to an ADR or the record first. / The few prose lines are still a model's summary and carry the trust problem.

### SES-4 — kept

- Statement: The refresh threshold is read from get_session by status and printed as REFRESH when passed; the rule is text, not a hook.
- Source: Requirements SES-3.
- Evidence grade: measured. Suggested: keep. Reason given: Labelled nudge with a mechanical trigger.
- Decision: kept, 2026-10-31 02:13 UTC. Tag: M
- Note: none
- Page explanation: The status command reads the session's context usage from the platform and prints REFRESH when it passes the role's threshold. The session is expected to act on it. No hook enforces it.
- For: Mechanical trigger, text response, no holding. / Thresholds live in one table.
- Against: A session may ignore the print; a BOB once ran to two thirds of its window. / The usage route must stay an allowed call, which it is today.

### SES-5 — kept

- Statement: Each role's reading set is fixed in advance and printed with sizes at its start.
- Source: Requirements SES-4; neoProcess page §5 (cut BOB's starting context by about a third).
- Evidence grade: measured. Suggested: keep. Reason given: The part of the neoProcess cap idea that worked.
- Decision: kept, 2026-10-31 02:13 UTC. Tag: R
- Note: none
- Page explanation: Each role has a predetermined list of documents it reads at start. The start command prints the list with sizes so the reading load is known before the session begins.
- For: The part of the neoProcess cap that worked: every job knew what it needed. / Makes reading load measurable per role.
- Against: Fixed sets go stale as the product changes. / Sizes printed are not sizes read; REC-8 covers that gap.

### SES-6 — kept

- Statement: Budgets are fractions of the model's context window, named in one table, never bytes fixed in code; an overrun is measured and reported, never refused.
- Source: Requirements SES-5, SES-6; your word of 30 Oct.
- Evidence grade: measured. Suggested: keep. Reason given: Pairs with REQ-6.
- Decision: kept, 2026-10-31 02:13 UTC. Tag: X
- Note: none
- Page explanation: Reading budgets are expressed as a fraction of the model's context window, in one table, never as a byte count in code. A reading set over budget is measured, recorded with cost, reported in the tranche report, and never refused.
- For: A byte cap set at 4 percent of the window refused every module. / Adjusts automatically when models change. / Overruns become data rather than failures.
- Against: Without any refusal, nothing forces action on a chronic overrun except your reading the report. / A fraction is still a chosen number.

### SES-7 — kept

- Statement: A summary for a task is an option BOB may take, written by workers citing sources, never required by the tool.
- Source: Requirements SES-7 (39 forced summary commits).
- Evidence grade: measured. Suggested: keep. Reason given: Measured waste.
- Decision: kept, 2026-10-31 02:14 UTC. Tag: X
- Note: none
- Page explanation: If a reading set is far over budget, BOB may have workers write a summary citing sources, but the tool never requires one before a job can start.
- For: 39 forced summary commits were pure overhead. / Leaves the judgment with BOB.
- Against: Summaries written by workers carry the same trust problem as handoffs. / Without a cap trigger, REQ-6, the option may never be exercised.

### SES-8 — modified (against the suggestion: keep)

- Statement: Models and effort come from one table, picked by the start command; always a model and effort sufficient for quality.
- Source: Requirements SES-8; neoProcess page §1 values.
- Evidence grade: measured. Suggested: keep. Reason given: Your policy.
- Decision: modified, 2026-10-31 02:15 UTC. Tag: S
- Note (owner's own words): Models, effort, and permissions mode come from one table, picked by the start command; always a model and effort sufficient for quality, and a permissions mode appropriate for the task at hand.
- Page explanation: Which model and effort level each kind of session uses is written in one table and selected by the start command. Your policy is always enough model for quality work.
- For: Your policy; drift to cheaper models was seen under civicos. / One place to change.
- Against: Model names and capabilities change often; the table needs dates. / The cost of always using strong models is real and should be measured.

### SES-9 — kept

- Statement: A session's usage is read by an allowed route; where none exists it is named unmeasured, never estimated.
- Source: Requirements SES-10.
- Evidence grade: measured. Suggested: keep. Reason given: Honest accounting.
- Decision: kept, 2026-10-31 02:16 UTC. Tag: M
- Note: none
- Page explanation: Token usage per session is read through a platform route that passes reliably. Where no such route exists, the metric is recorded as unmeasured rather than estimated.
- For: Honest accounting. / Avoids archive-based usage, which failed.
- Against: Gaps in cost data until a route is found. / PLN-6's overhead share is weaker without it.

### SES-10 — kept

- Statement: Workers run in the background, read exactly what their brief names, and return machine-readable receipts rather than narration.
- Source: Requirements SES-11; research: subagent tool calls are absent from the parent transcript, so a closing 'all tests pass' can mask a failed run.
- Evidence grade: convergent. Suggested: keep. Reason given: Receipts, not reports, everywhere.
- Decision: kept, 2026-10-31 02:16 UTC. Tag: R
- Note: none
- Page explanation: In-session workers run in the background, read only what their brief names, write only their result file, and return structured results, what ran and with what outcome, rather than a narrative.
- For: Worker tool calls do not appear in the parent's transcript, so a narrative all-passed can hide a failure. / Keeps BOB's context small. / Receipts can be checked.
- Against: Writing a good brief is work; a bad brief wastes the worker. / Structured output loses nuance.

### SES-11 — kept

- Statement: The process measures its own overhead per tranche: commits by purpose, sessions per job, gate runs per merged job, restarts, tokens by role.
- Source: Requirements SES-12; measured by hand on the 30th.
- Evidence grade: measured. Suggested: keep. Reason given: Needed for PLN-6.
- Decision: kept, 2026-10-31 02:16 UTC. Tag: M
- Note: none
- Page explanation: Per tranche the process counts commits by purpose, sessions per job, gate runs per merged job, restarts, and tokens by role, and reports them.
- For: These numbers exposed the vortex when counted by hand. / Mechanical to compute from git and GitHub.
- Against: Needs usage routes, SES-9. / Metrics can be misread without context.

### SES-12 — kept

- Statement: Two health metrics from day one: the false-done rate caught by independent re-verification, and cost per PR that survives a revert window.
- Source: Research report's own recommendation; the only field number for false-done is about one in eleven.
- Evidence grade: single. Suggested: keep. Reason given: Would have exposed both earlier processes early. New to the ledger.
- Decision: kept, 2026-10-31 02:16 UTC. Tag: M
- Note: none
- Page explanation: From the first tranche, measure two things: how often a job's claim of done is refuted by independent re-verification in CI, and the cost in tokens or dollars per PR that is still in place after a revert window of, say, two weeks.
- For: The two numbers neither earlier process measured, and which would have exposed both. / Both derive from CI and git, no model involved. / Give you a basis to add or delete process components.
- Against: The revert window delays the cost number. / Needs the receipt and revert check, JOB-7 and JOB-12, to compute false-done.

### SES-13 — kept

- Statement: A session that outlives its parent is ordinary and costs nothing idle; no step counts on a parent being alive.
- Source: Requirements SES-13.
- Evidence grade: measured. Suggested: keep. Reason given: Follows from PLT-2.
- Decision: kept, 2026-10-31 02:17 UTC. Tag: S
- Note: none
- Page explanation: A job that finishes while two BOBs have come and gone is normal. Idle sessions cost nothing. No step assumes the session that created another is still alive.
- For: Follows from not depending on archiving. / Removes a class of coordination bugs.
- Against: Session lists get cluttered. / Someone must eventually clean up, when the classifier allows.

### SES-14 — modified

- Statement: Design-area lanes (UX, AI, DB, performance) as long-lived sessions with their own refresh lifecycle.
- Source: civicos-process and neoProcess page §2; research: Yegge's post-collapse design kept persistent per-role workers, but each long-lived session multiplies refresh and compaction problems.
- Evidence grade: single. Suggested: modify. Reason given: Suggest: a lane is a knowledge directory plus an on-demand worker BOB starts with that directory as its reading set; a long-lived lane only where measured worthwhile.
- Decision: modified, 2026-10-31 02:18 UTC. Tag: S
- Note (suggestion plus owner words): Suggest: a lane is a knowledge directory and design responsibility plus an on-demand worker BOB starts with that directory as its reading set; a long-lived lane only where measured worthwhile. The lifecycle of a lane includes refreshes that BOB manages to keep the session depth consistant.
- Page explanation: Under civicos and neoProcess, design areas such as UX, AI or database each had a long-lived lane session answering questions through BOB, with its own refresh cycle. The suggestion is that a lane become a directory of knowledge in the repository plus an on-demand worker BOB starts with that directory as its reading set.
- For: No refresh, no address, no tear-down per lane. / Knowledge in git is readable by everyone, including you. / Yegge's post-collapse design did keep persistent per-role workers, so long-lived lanes are not disproven.
- Against: An on-demand worker re-reads the directory each time, costing tokens. / Continuity of a lane's judgment over weeks is lost unless written down. / Some design conversations genuinely benefit from a long context.

### SES-15 — modified

- Statement: BOB is the hub: every request and answer passes through it and it translates both ways.
- Source: neoProcess page §2; the page lists BOB's context as its top risk.
- Evidence grade: single. Suggested: modify. Reason given: Suggest: BOB routes; it translates only where a requester cannot use the answer as given; measure the routing cost.
- Decision: modified, 2026-11-03 20:00 UTC. Tag: S
- Note (written in by the coordinator): Bob's word, settled 1 Nov (Foundations, open tension 4): BOB routes every request between spokes and translates only where a requester cannot use the answer as given; toward Bob it always explains each decision of his with context, options and a recommendation. Routing share measured after the first layer. Recorded by the coordinator, 3 Nov, walk-through question 36.
- Page explanation: The 29 Oct page made BOB the hub for every request between jobs and lanes, translating each question into the lane's terms and each answer back. The suggestion is that BOB routes, and translates only when the requester cannot use the answer as given.
- For: Routing keeps spokes from needing to know each other. / Translation when needed is valuable.
- Against: Translating everything spends BOB's context, its scarcest resource, on relay work. / Every hub in the research eventually did the work itself or lost its role. / Measure before committing either way.

### SES-16 — modified

- Statement: Stateless BOB: every wake is a fresh session started by a scheduled task, which runs status, reads one short handoff, acts, writes the handoff and ends.
- Source: This week's discussion; Civicsmith's BOB handed off seven times in thirteen hours; research: the long-lived session must be rebuildable from disk, and fresh-session versus compaction advice is model-dependent.
- Evidence grade: proposed. Suggested: modify. Reason given: Suggest: measure on the first tranche, comparing tokens per wake against the handoff cost already paid.
- Decision: modified, 2026-10-31 02:20 UTC. Tag: M
- Note (near-copy of the suggestion): Suggest: I'm skeptical, but let's measure on the first tranche, comparing tokens per wake against the handoff cost already paid.
- Page explanation: Instead of a long-lived BOB that refreshes, every wake would be a fresh session started by a scheduled task. It runs status, reads a short handoff, does one step, writes the handoff, and ends. There is no refresh because there is nothing to refresh.
- For: Eliminates the refresh mechanism, compaction loss and retired-BOB hazards entirely. / Civicsmith's BOB already handed off every two hours, so it was nearly stateless in practice. / Fresh context at every wake is the field's convergent pattern for jobs.
- Against: Re-reads the reading set every wake; Anthropic notes this is slower and more expensive than compaction for some models. / Loses in-context continuity of a design conversation. / Model-dependent: Anthropic reversed its own advice on resets within four months. Measure it.

### SES-17 — kept

- Statement: Urgency and persistence instilled through memory, style and goals so sessions keep working until legitimately blocked.
- Source: Your design, 30 Oct; research: works at the margin, but urgency plus overconfidence produced confident wrong work in several accounts.
- Evidence grade: convergent. Suggested: keep. Reason given: Keep as a labelled nudge, never enforced by anything that holds a turn.
- Decision: kept, 2026-10-31 02:20 UTC. Tag: O
- Note: none
- Page explanation: Memory files, style instructions and goals are written to make sessions keep working until they are genuinely blocked, rather than stopping between acts to ask. This is a nudge: it changes behaviour at the margin and is enforced by nothing.
- For: Costs nothing and does help. / Addresses a real and common failure.
- Against: Urgency plus overconfidence produced confident wrong work and self-modifying harnesses in several accounts. / Cannot be made reliable; must never be enforced by a hook that holds a turn.

