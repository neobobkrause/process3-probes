# Keep and Drop Ledger: full extraction

Extracted from the page source exported 5 Nov 2026 (ITEMS, window.DETAILS and SEED inside the HTML). 159 lines: 126 decided 31 Oct (six of them re-dated 3 Nov), 21 principles and 12 gap lines decided 3 Nov. Decisions: 119 kept, 32 modified, 8 dropped.

Fields per line: statement (verbatim), source, evidence grade, the suggestion and its one-line reason (both drafted by the session that built the page), the owner's decision with its timestamp (UTC), the note stored with the decision (verbatim), and where present the page's own explanation, pros and cons. "Note origin" is this analyst's comparison of the note with the suggestion text. "Tag" is this analyst's primary classification: C = check / gate / review / verification; R = record or bookkeeping artefact; M = measurement, metric or alarm; S = role or session structure; X = restraint (limits checks, rules, caution or cost); O = other design constraint, structure or policy; D = dropped; rep = kept on the page but replaced by a GAP line.


## Platform facts

### PLT-1 — kept

- Statement: Keep one dated table of platform constraints: each a measured fact, how often measured, the evidence, and the workaround the process uses. Nothing depends on a behaviour that is not a row.
- Source: Requirements PLT-1, PLT-12; research: every harness component encodes an assumption about the model that goes stale.
- Evidence grade: measured. Suggested: keep. Reason given: The one artifact from both attempts that gets more valuable with age.
- Decision: kept, 2026-10-31 00:54 UTC. Tag: M
- Note: none
- Page explanation: A single file in the process repository lists what the Claude Code cloud platform has been seen to allow and refuse: one row per behaviour, with the date it was last confirmed, how many times it was measured, a link to the evidence, and what the process does about it. Every other part of the process may rely only on behaviours that appear as a row.
- For: Turns scattered, painful discoveries into one reference a new session reads in a minute. / Makes a platform change visible as a stale row rather than a surprise in the middle of a tranche. / Cheap to keep: a row is a few lines.
- Against: Rows go stale silently unless someone re-measures; a re-measure schedule is itself work. / Becomes a dumping ground for every oddity unless there is a rule for what qualifies as a row. / Only as good as the discipline of refusing to depend on unlisted behaviour, which is a text rule.

### PLT-2 — modified (against the suggestion: keep)

- Statement: Depend on no act the auto-mode permission classifier decides case by case: archiving sessions, editing or deleting scheduled tasks, interrupting sessions, editing settings files.
- Source: Requirements PLT-2 (same call passed and failed minutes apart); research: classifier misses 17% of real overeager actions by Anthropic's own measurement.
- Evidence grade: measured. Suggested: keep. Reason given: Non-determinism is by design, so design around it.
- Decision: modified, 2026-11-03 19:30 UTC. Tag: O
- Note (written in by the coordinator): Bob's word in chat, 3 Nov (written here by the coordinator): depend only on acts the committed approvals cover and that were measured to pass; archiving sessions and switching off or deleting tasks are housekeeping, counted and reported, never needed for correctness.
- Page explanation: In auto mode, some tool calls are approved or refused by a model-based classifier that judges each call on its own. The record shows the same call passing once and failing minutes later. This rule says the process is designed so no step needs those calls at all, rather than trying to make them reliable.
- For: Removes a whole class of random failures with no code. / Anthropic's own measurement confirms the classifier both misses and refuses unpredictably. / Forces simpler designs: nothing waits on an archive or a timer change.
- Against: Gives up convenience: old sessions stay idle instead of being cleaned up, timers cannot be retargeted. / Needs the table of PLT-1 to know which acts are gated, and that set can change with platform releases. / If a future need genuinely requires one of these acts, the only fallback is you doing it by hand.

### PLT-3 — kept

- Statement: Hard permission rules live in allow and deny lists in user settings plus the sandbox, which run before the classifier. The classifier is defence in depth, never the policy.
- Source: Research: deny and PreToolUse run before the classifier; autoMode config honoured only in user settings.
- Evidence grade: measured. Suggested: keep. Reason given: Explains the refusals that looked random when settings did not load. New to the ledger.
- Decision: kept, 2026-10-31 01:26 UTC. Tag: rep
- Note: none
- Page explanation: Claude Code checks deny rules, allow rules and PreToolUse hooks before it asks the classifier. Anything that must always pass, or must never happen, is written as an allow or deny rule in the user-level settings, where the classifier honours it. The classifier then judges only what falls between.
- For: Deterministic where it matters, with no hook code. / Explains past refusals of allow-listed acts: project-level settings were not where the classifier looked. / Lists are short, reviewable and version-controlled.
- Against: User-level settings are per environment, not per repository, so the shims must install them in the right place. / A broad allow rule such as unrestricted shell is dropped on entering auto mode, so some acts still need the classifier or a CI runner. / Platform behaviour here changed through 2026 and may change again; the row in PLT-1 needs a date.

### PLT-4 — kept

- Statement: No step runs longer than the in-session background limit; anything that can is a CI workflow.
- Source: Requirements PLT-5 (gate killed at 30 minutes in-session).
- Evidence grade: measured. Suggested: keep. Reason given: Platform fact, not a preference.
- Decision: kept, 2026-10-31 01:26 UTC. Tag: O
- Note: none
- Page explanation: A command started in a cloud session's background is killed by the platform after a fixed time, about thirty minutes today. Anything that might run that long, such as a full test suite, runs as a GitHub Actions workflow instead, where the limit is hours.
- For: Removes the observed failure of a gate dying at the limit and repeating. / CI gives a durable log and a status check for free. / Keeps session context clean of long outputs.
- Against: CI adds queue latency and a second environment to keep in step with the session's. / CI minutes cost money on private repositories. / Needs lock-file and Node-version installs to match the product, which GAT-5 covers.

### PLT-5 — modified (against the suggestion: keep)

- Statement: No session starts its own successor. Sessions are started only from depth 0 or 1, so depth never grows past 2.
- Source: Requirements PLT-6 (lane reached depth 4 in a day); civicos ROOT; research: every self-spawning hub failed.
- Evidence grade: convergent. Suggested: keep. Reason given: The most consistently documented failure in the field.
- Decision: modified, 2026-11-03 19:30 UTC. Tag: O
- Note (written in by the coordinator): Bob's word in chat, 3 Nov, option A (written here by the coordinator): no session starts its own successor; depth stays at most 3 (coordinator, ROOT, BOB, job), as ran on 3 Nov when the explore and review jobs merged at depth 3. The watcher is started beside ROOT by whoever starts ROOT.
- Page explanation: A session never creates its own replacement. New sessions are created only by you, by ROOT, or by a scheduled task. The tree of sessions stays shallow and no session's survival depends on a session it created.
- For: Prevents the runaway chains seen on the 30th and documented in every orchestration framework studied. / Depth stays well inside what the platform allows. / Each session has one clear creator, which simplifies the record.
- Against: A refresh needs a round trip through ROOT or a timer, which adds latency. / ROOT becomes a single point you must restart if it dies. / Natural patterns such as a job splitting itself are forbidden and must go through BOB.

### PLT-6 — kept

- Statement: A scheduled task is never required for correctness; a wake is a convenience and the record is read at every wake regardless.
- Source: Requirements PLT-7 (task fired into an archived session).
- Evidence grade: measured. Suggested: keep. Reason given: Tasks are cheap wakes, not state.
- Decision: kept, 2026-10-31 01:26 UTC. Tag: O
- Note: none
- Page explanation: Scheduled tasks can fire late, twice, or into a session that no longer exists. They are used only to wake a session that would otherwise sit idle. Correctness never depends on one firing, because every wake starts by reading the record in git.
- For: No work is lost when a timer misfires, as happened on the 30th. / Timers need no cleanup when sessions are replaced. / Idempotent wakes make duplicate firings harmless.
- Against: A session nobody messages may sit idle until someone notices. / Needs an explicit backstop, such as your own check or a periodic status, to catch stalls. / A stale timer firing into a retired session wastes a turn, though a harmless one.

### PLT-7 — kept

- Statement: A session works on one repository, the product's; the process is a read-only clone at a pinned commit.
- Source: Requirements PLT-8 (two repositories broke settings loading).
- Evidence grade: measured. Suggested: keep. Reason given: Measured twice.
- Decision: kept, 2026-10-31 01:27 UTC. Tag: O
- Note: none
- Page explanation: A session works inside the product's repository only. The process tooling is fetched as a read-only copy at a specific commit, at a path the product's shims name. The session never attaches the process repository as a second working repository.
- For: Settings and hooks load reliably with one repository; two broke them. / The pinned commit guarantees every session in a tranche runs the same process code. / A product session cannot accidentally change the process.
- Against: Fetching the clone costs a few seconds at every session start. / A process fix requires moving the pin deliberately, MNT-5. / Process-side flaw reports have to travel by a separate route, MSG-5.

### PLT-8 — kept

- Statement: GitHub acts a session cannot take run on GitHub's runner by workflows with your tokens as secrets.
- Source: Requirements PLT-9; proven live on four runs.
- Evidence grade: measured. Suggested: keep. Reason given: Already working.
- Decision: kept, 2026-10-31 01:27 UTC. Tag: O
- Note: none
- Page explanation: Some GitHub operations, such as creating repositories, changing rulesets or deleting branches, cannot be done with a session's token. These run as workflows in the process repository using your tokens stored as secrets, one per owner account. The session triggers the workflow and reads its result.
- For: Already proven live on four runs. / Keeps powerful credentials out of sessions. / Workflow runs leave an audit trail.
- Against: Secrets must be rotated and scoped by you. / One more moving part, and the trigger call itself can be refused if made the wrong way. / A workflow's failure is only seen if the session reads the run result.

### PLT-9 — kept

- Statement: Every credential is gathered once before a product's first tranche and checked at every tranche open; a missing grant stops a tranche from opening, never a step midway.
- Source: Requirements PLT-10.
- Evidence grade: measured. Suggested: keep. Reason given: Cheap and already live.
- Decision: kept, 2026-10-31 01:27 UTC. Tag: C
- Note: none
- Page explanation: Before a product's first tranche, every token and permission the process will need is collected and recorded. At each tranche open, a command checks they are all present and valid. If one is missing, the tranche does not open. Nothing fails for a missing grant halfway through a layer.
- For: Fails early and cheaply instead of mid-job. / Already live. / Gives you one list of what the process can do with your accounts.
- Against: Grants can expire mid-tranche; the check at open does not catch that. / The list grows as the process adds capabilities, and each addition is an act of yours. / Checking validity may itself need calls the classifier judges.
