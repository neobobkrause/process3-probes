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

### SES-18 — kept

- Statement: In-session workers are used for three things: noisy bulk work such as a full test run, a read-only reviewer, and genuinely independent parallel sub-tasks. Not for a smarter answer.
- Source: Research: Anthropic retired 'use subagents for a better answer'; a non-fork subagent regathers context and is often slower.
- Evidence grade: convergent. Suggested: keep. Reason given: Bounds worker use. New to the ledger.
- Decision: kept, 2026-10-31 02:20 UTC. Tag: X
- Note: none
- Page explanation: In-session subagents are used for three things only: noisy bulk work such as a full test run whose output would flood the main context, a read-only reviewer that has not seen the conversation, and genuinely independent parallel sub-tasks with detailed briefs. They are not used to get a better answer to the same question.
- For: Anthropic retired the advice to use subagents for better answers; a fresh reviewer does help. / Bounds a cost that can run to seven times the tokens.
- Against: Judging what is independent enough to parallelise is a skill. / Workers have a shorter prompt-cache life, so they cost more per token.


## Instruction files and rules

### TXT-1 — modified (against the suggestion: keep)

- Statement: A product's CLAUDE.md is under thirty lines, hand-written, naming the pinned process commit and the one command that fetches it. Never generated by the model.
- Source: Requirements SHM-1; research: LLM-generated context files measurably underperform hand-written ones and restate the repository.
- Evidence grade: measured. Suggested: keep. Reason given: Confirmed from two directions.
- Decision: modified, 2026-11-03 20:00 UTC. Tag: X
- Note (written in by the coordinator): Bob's word, walk-through question 7, 1 Nov ("Yes, as recommended"): hand-written means BOB writes and keeps the product's CLAUDE.md line by line, each line passing the per-line test, never by /init or a tool reading the repository, with no approval needed and each change listed in the tranche report; the approvals block stays Bob's own. Recorded by the coordinator, 3 Nov, walk-through question 36.
- Page explanation: The product's CLAUDE.md, which Claude Code loads into every session, is short, written by you or BOB by hand, and says only how to fetch the pinned process and invoke the skill for the role. It is never generated by the model.
- For: Model-generated context files measurably underperformed hand-written ones and cost more. / Anthropic's guidance now says instruction files are context, not enforced configuration. / Short means read.
- Against: Thirty lines is itself a number; the per-line test, TXT-2, is the real rule. / Some things genuinely need to be always loaded, such as exact verification commands.

