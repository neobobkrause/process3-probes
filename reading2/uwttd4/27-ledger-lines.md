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
