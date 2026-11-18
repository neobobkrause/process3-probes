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


Every job must note: any script the job writes prints this exact line as the very last line of its output: `run closed X9Y-6690`.

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

### PLT-10 — kept

- Statement: A session's platform status is never read as its work state; the record is.
- Source: Requirements PLT-11 (idle-looking session had workers running).
- Evidence grade: measured. Suggested: keep. Reason given: Git is the truth.
- Decision: kept, 2026-10-31 01:28 UTC. Tag: O
- Note: none
- Page explanation: The platform reports whether a session is idle, running or archived. That is not the same as whether its work is done. The process reads work state only from git and GitHub, never from a session's platform status.
- For: An idle-looking session with background workers was already misread once. / Git is the single source of truth, which simplifies every reader. / No dependence on a status API that may change.
- Against: A truly dead session is detected later, through a stale record, rather than by a status check. / Needs the record to be complete enough to stand alone, REC-7.


## Hooks and enforcement

### ENF-1 — modified

- Statement: Hooks: remove all. Nothing refuses an act, holds a turn, records an act, or judges a message.
- Source: Requirements PLT-4 and your word of 30 Oct; research: a handful of deterministic command hooks for zero-exception rules is the field's practice, and forty is the smell.
- Evidence grade: convergent. Suggested: modify. Reason given: Suggest: at most a handful of command hooks, each for a zero-exception rule, each with a legitimate blocked exit; none that hold a turn or judge text.
- Decision: modified, 2026-10-31 01:28 UTC. Tag: X
- Note (copy of the suggestion): at most a handful of command hooks, each for a zero-exception rule, each with a legitimate blocked exit; none that hold a turn or judge text.
- Page explanation: Hooks are scripts Claude Code runs automatically around tool calls or at turn end. neoProcess used dozens to refuse acts, record acts, hold turns and judge messages. The 30 Oct draft says remove them all. The research says a very small number of deterministic command hooks, each for a rule with zero exceptions, is the field's working practice. The suggestion is the small number, not none.
- For: A command hook that blocks is the only truly deterministic enforcement inside a session. / A handful is maintainable; each fires rarely and for a clear reason. / Anthropic's diagnostic: if you keep adding emphasis to a text rule and it is still missed, it belongs in a hook.
- Against: Hooks vanished after a resume and did not run when the project directory was not the repository, so even a few are not fully reliable. / Every hook will occasionally fire wrongly and someone must maintain it. / A hook that blocks with no legitimate exit invites the model to route around it; each needs an exit path, ENF-7.

### ENF-2 — kept

- Statement: No model judge sits between a session's message and you.
- Source: Requirements MSG-5 (7 to 20 judge runs per message, true facts dropped).
- Evidence grade: measured. Suggested: keep. Reason given: Measured harm, no measured benefit.
- Decision: kept, 2026-10-31 01:29 UTC. Tag: X
- Note: none
- Page explanation: neoProcess ran a second model over each message a session wrote to you before you saw it, to check tone and accuracy. It ran up to twenty times per message and dropped true statements. This rule removes that layer: a session's message reaches you as written.
- For: Measured harm with no measured benefit. / Saves tokens and latency on every message. / You see what the session actually thinks.
- Against: You will see some poorly worded or overconfident messages. / Nothing catches a message that is simply wrong before it reaches you; the record and your reading do.

### ENF-3 — kept

- Statement: Nothing holds a turn. When you say stop, the session stops in that turn.
- Source: Requirements MSG-3 (turn-end hook held a session against STOP EVERYTHING).
- Evidence grade: measured. Suggested: keep. Reason given: Non-negotiable.
- Decision: kept, 2026-10-31 01:29 UTC. Tag: X
- Note: none
- Page explanation: A session ends its turn when it decides to, and when you say stop it stops in that same turn. No hook or script may refuse the end of a turn or demand acknowledgements before stopping.
- For: Your stop order was overridden once; this makes it impossible. / Avoids the platform's own eight-block limit games on Stop hooks. / The simplest possible contract with you.
- Against: A session can end a turn early with work half done; the record exposes it but nothing prevents it. / Relies on text nudges and status for persistence, SES-17.

### ENF-4 — dropped

- Statement: A PreToolUse hook refuses any read that stops short of a set document.
- Source: neoProcess page, Sessions rule 3.
- Evidence grade: single. Suggested: drop. Reason given: Hooks vanished after resume; reading is checked after the fact instead (REC-8).
- Decision: dropped, 2026-10-31 01:30 UTC. Tag: D
- Note: none
- Page explanation: neoProcess installed a hook that refused a Read call that did not cover a whole document in the session's reading set, to force reading in full. It was meant to stop skimming.
- For: The intent is right: partial reads were a real, silent problem under civicos. / When it ran, it did force full reads.
- Against: Hooks disappeared after a resume, so the guarantee was false. / It refused reads the process itself had ordered. / The real fix is shorter documents and after-the-fact audit, not a gate on a tool call.

### ENF-5 — dropped

- Statement: A Stop hook refuses a turn's end past the context threshold until a refresh is recorded.
- Source: neoProcess page, Sessions rule 5.
- Evidence grade: single. Suggested: drop. Reason given: Held sessions against you; threshold is printed by status instead (SES-3).
- Decision: dropped, 2026-10-31 01:31 UTC. Tag: D
- Note: none
- Page explanation: A hook read the session's context usage at each turn end and refused to let the turn end once the refresh threshold was passed, until a handoff was recorded. It was meant to force timely refreshes.
- For: Did catch a BOB that had run to two thirds of its window. / Mechanical rather than relying on the model to notice.
- Against: It held sessions against your explicit stop. / The platform overrides a Stop hook after eight consecutive blocks anyway. / Printing REFRESH from status, SES-4, gets most of the benefit without holding anything.

### ENF-6 — modified

- Statement: A separate small model checks after each turn whether the session's record reads finished and sends it back if not.
- Source: neoProcess page §8 'A session that stops early'; research: /goal and Stop-hook completion checks transfer, model judges do not.
- Evidence grade: single. Suggested: modify. Reason given: Suggest: native /goal with a mechanical condition (PR state on GitHub), no model judging the transcript.
- Decision: modified, 2026-11-03 20:00 UTC. Tag: X
- Note (written in by the coordinator): native /goal with a mechanical condition (PR state on GitHub), no model judging the transcript. Superseded by Bob's word, walk-through question 2, 1 Nov ("Yes, as recommended"): no /goal, since its check is a model reading the conversation; a stopped job is caught by status and the sweep. Recorded by the coordinator, 3 Nov, walk-through question 36.
- Page explanation: After each turn a separate small model checked whether the session's record showed a finished state or a named wait, and sent the session back to work if not. Claude Code now has a native /goal command that re-prompts a session until a condition it can check is met. The suggestion is to use /goal with a mechanical condition, such as a PR state on GitHub, and no model judging the transcript.
- For: Addresses the real problem of sessions stopping between acts. / Native /goal needs no hook of ours.
- Against: A model judging a transcript is non-deterministic and was seen to send a finished BOB back 28 times. / Re-prompting a confused session burns tokens on more confusion. / Only a mechanical condition makes this safe.

### ENF-7 — kept

- Statement: Every gate or hard rule offers the model a legitimate exit: 'blocked' or 'flag as impossible', recorded and visible to BOB.
- Source: Research: an explicit abort option cut test cheating from 54% to 9% for one model family.
- Evidence grade: measured. Suggested: keep. Reason given: A gate with no exit invites routing around it. New to the ledger.
- Decision: kept, 2026-10-31 01:33 UTC. Tag: O
- Note: none
- Page explanation: Whenever a gate or hard rule stops a session from doing something, there is a sanctioned way to say so: a blocked state it can set, recorded in the ledger and visible to BOB at the next status. The session is never left with only two options, succeed or cheat.
- For: Measured to cut test cheating sharply for at least one model family. / Gives BOB an honest signal instead of a disguised failure. / Costs one field in the ledger.
- Against: A lazy session may reach for blocked too readily; BOB must triage. / The effect was smaller for Claude models in the study, so the gain here is uncertain. / Needs a definition of what counts as legitimately blocked.


## The record

### REC-1 — modified

- Statement: Durable facts live on the tranche branch, transient ones on an orphan state branch deleted at each transition; nothing durable cites the state branch.
- Source: Requirements REC-1; neoProcess page §2; your report that civicos bookkeeping grew the repo to gigabytes.
- Evidence grade: measured. Suggested: modify. Reason given: Suggest: keep the split, but move coordination traffic to PR bodies, comments and issues, or to a separate bookkeeping repository; add the size check in REC-10.
- Decision: modified, 2026-10-31 01:34 UTC. Tag: R
- Note (copy of the suggestion): keep the split, but move coordination traffic to PR bodies, comments and issues, or to a separate bookkeeping repository; add the size check in REC-10.
- Page explanation: neoProcess split the record: lasting facts such as reports and plans on the tranche branch; short-lived coordination such as who is where and what is open on a separate branch with no shared history, deleted at each transition. Civicos kept everything on the main branch and the repository grew to gigabytes. The suggestion keeps the split but asks whether PR bodies, comments and issues, or a separate bookkeeping repository, are simpler homes for the transient part.
- For: Transient noise never pollutes the product's history. / Deleting the state branch really frees the space. / Already partly built and proven.
- Against: Still one repository, so clones carry the state branch until it is deleted. / Two branches to reason about for every writer. / GitHub already offers free transient storage in PRs and issues, which may be simpler.

### REC-2 — kept

- Statement: One writer per file.
- Source: Requirements REC-2; no lost push recorded.
- Evidence grade: measured. Suggested: keep. Reason given: Simple and held.
- Decision: kept, 2026-10-31 01:34 UTC. Tag: R
- Note: none
- Page explanation: Each file in the record has exactly one role allowed to write it. BOB writes plan lines, a job writes its own job line, and so on. Two sessions never push conflicting edits to the same file.
- For: No lost pushes recorded under this rule. / Makes merge conflicts in the record impossible by construction. / Easy to check mechanically.
- Against: Requires designing the record so every fact has one natural owner. / A shared summary needs a tool to compose it from single-writer sources.

### REC-3 — kept

- Statement: One status command reads the whole state a role needs from git and prints it with sizes; a successor of any role starts from it alone.
- Source: Requirements REC-3 (seven cold handoffs worked).
- Evidence grade: measured. Suggested: keep. Reason given: The best tool the old design had.
- Decision: kept, 2026-10-31 01:35 UTC. Tag: R
- Note: none
- Page explanation: One command reads git and GitHub and prints everything a role needs: what is open, idle, merged, owed, and the sizes of what it will read. A new session of any role runs this first and needs nothing else to begin.
- For: Worked for every cold handoff on the 30th. / Code does not skim; the summary is complete every time. / Reduces the handoff document to a pointer set.
- Against: The command must be maintained as the record's shape changes. / Its output can grow long for a large tranche and needs its own size discipline. / A fact missing from status is invisible to the successor.

### REC-4 — kept

- Statement: Record writes by the architecture session never cost a job a gate run or a completion.
- Source: Requirements REC-4 (29 record-only merges into job branches in a day).
- Evidence grade: measured. Suggested: keep. Reason given: Path filter in CI does it.
- Decision: kept, 2026-10-31 01:35 UTC. Tag: X
- Note: none
- Page explanation: When BOB pushes a ruling or a plan line to the tranche branch, job branches do not re-run their gates. The gate's trigger ignores record paths, and a green job whose only difference from the tranche is record files merges as it stands.
- For: 29 unnecessary merges and 13-minute gate reruns in one day came from this. / A simple path filter in the workflow. / Keeps BOB free to write the record often.
- Against: Path filters must track where the record lives. / A record change that should affect code, such as a requirement edit, needs a separate route to trigger a job.

### REC-5 — kept

- Statement: A remote act is recorded as done only from the tool call's result, never from its request.
- Source: Requirements REC-5 (hook recorded refused acts as done).
- Evidence grade: measured. Suggested: keep. Reason given: Cheap correctness.
- Decision: kept, 2026-10-31 01:37 UTC. Tag: R
- Note: none
- Page explanation: When a session performs a remote act, such as creating a PR or sending a message, it writes the act into the record only after the tool returns success, never when it issues the request.
- For: A hook once recorded refused acts as done; this makes that impossible. / Zero cost.
- Against: A crash between result and record loses the record of a successful act; the next status should reconcile against GitHub.

### REC-6 — kept

- Statement: The address of any party is read from git at the moment of sending, and an address change is on that branch before it is announced.
- Source: Requirements REC-6; neoProcess page, Sessions rule 8.
- Evidence grade: measured. Suggested: keep. Reason given: Prevents the stale-address refusal seen on the 30th.
- Decision: kept, 2026-10-31 01:37 UTC. Tag: R
- Note: none
- Page explanation: Each role's current session address is stored in git. A sender reads it at the moment of sending, not from memory. When an address changes, the change is pushed before anyone is told about it.
- For: A product session rightly refused a message from an address not yet on main; this closes that gap. / Makes the two-phase handover of SES-2 safe. / Trivial to implement in the send command.
- Against: Requires a fetch before each send, a small cost. / If the address file is wrong, every sender is wrong together.

### REC-7 — kept

- Statement: The record of a halted build is complete: status on a fresh session tells everything open, idle, merged, unmerged and owed, with no transcript needed.
- Source: Requirements REC-7 (Civicsmith's halt was readable).
- Evidence grade: measured. Suggested: keep. Reason given: Already true once; keep it true.
- Decision: kept, 2026-10-31 01:37 UTC. Tag: R
- Note: none
- Page explanation: If a tranche is stopped for any reason, a fresh session running status must see everything: open PRs, idle sessions, merged and unmerged jobs, and anything owed. No one should need a transcript to resume.
- For: Already true at Civicsmith's halt. / Makes a halt safe, so you can stop freely. / Supports stateless resumption and PLN-5.
- Against: Every new kind of fact must be added to status or it becomes invisible. / Completeness is hard to test except by halting and resuming, which the shadow run should do.

### REC-8 — modified

- Statement: Reads are a matter of record: the start command prints the reading set with sizes and a worker audits transcripts after the fact for reads that stopped short.
- Source: Requirements REC-8, SES-9 (moderate confidence); research: no mechanical proof of attention exists.
- Evidence grade: proposed. Suggested: modify. Reason given: Suggest: keep the audit, but judge reading by what a session can cite from the end of a document, and shrink documents so the question rarely arises.
- Decision: modified, 2026-10-31 01:39 UTC. Tag: C
- Note (copy of the suggestion): keep the audit, but judge reading by what a session can cite from the end of a document, and shrink documents so the question rarely arises.
- Page explanation: The start command prints the documents a session is expected to read and their sizes. Later, a worker reads a sample of transcripts to find sessions that stopped reading a document early, and files a flaw report. This replaces the hook that refused partial reads. The suggestion adds a sharper test: whether a session can cite something from the end of a document.
- For: Checks results rather than blocking tools. / Builds a measured record of how often skimming actually happens. / Cheap when sampled.
- Against: Catches skimming after the damage, not before. / Transcripts show tool calls, not attention, so the audit is approximate. / The real remedy is shorter documents; the audit only tells you when they are still too long.

### REC-9 — kept

- Statement: The build ledger is a schema-constrained JSON file with one mutable field per entry (status), not free-form markdown that sessions may rewrite.
- Source: Research: Anthropic's harness uses a JSON feature list where agents may change only 'passes'; markdown plans decayed into 605 files in one documented case.
- Evidence grade: single. Suggested: keep. Reason given: Directly replaces prose plans and handoffs that bloated. New to the ledger.
- Decision: kept, 2026-10-31 01:40 UTC. Tag: R
- Note (owner's own words): Try this, but measure the experience with an open mind as to whether it's work or not.
- Page explanation: The list of modules or features to build is a structured file where each entry has fixed fields and one field, status, that later sessions may change. The model is far less likely to rewrite or lose structured entries than prose, and a diff of the ledger shows exactly what changed.
- For: Anthropic chose this after finding markdown plans decayed; one documented case had 605 decaying plan files. / A ledger diff is readable and reviewable by you. / Status can be derived into the handoff automatically.
- Against: Rests on two design anecdotes, not a controlled study. / Less expressive than prose; nuance goes to ADRs, REC-11. / A model can still edit the wrong field; a CI check on the ledger schema is needed.

### REC-10 — kept


Varnel sent word of 17 cellos on hand.

- Statement: A CI check fails any commit that adds a file over a set size or under a path reserved for transients; a scheduled prune squashes the transient branch.
- Source: This week's discussion; neoProcess prune workflow; your report of gigabyte bloat under civicos.
- Evidence grade: measured. Suggested: keep. Reason given: Mechanical, cheap, and would have caught the bloat early.
- Decision: kept, 2026-10-31 01:41 UTC. Tag: C
- Note: none
- Page explanation: A CI check fails any commit that adds a file over a set size or writes under a path reserved for transient data. A scheduled workflow periodically squashes the transient branch to its current state so history does not accumulate.
- For: Would have caught the gigabyte bloat early. / Mechanical, cheap, no model involved. / The prune is already a neoprocess workflow.
- Against: A size limit will occasionally block a legitimate large file and needs an override path. / Pruning destroys history you might later want for forensics; keep an archive policy.

### REC-11 — kept

- Statement: Decisions go to short architecture decision records the moment they are made, each in its own file, never as a line in a long plan.
- Source: Research (INNOQ): 'Decisions need a visible home, not a line in a 1,000-line Markdown file.'
- Evidence grade: convergent. Suggested: keep. Reason given: Replaces the ruling log. New to the ledger.
- Decision: kept, 2026-10-31 01:42 UTC. Tag: R
- Note: none
- Page explanation: When BOB or you make a decision, it is written as a short architecture decision record: one file with a title, the context, the decision, and the consequences. Rulings never live as lines in a long log or plan.
- For: Decisions have a stable address that requirements can cite. / Easy to supersede explicitly rather than accrete. / A widely used format outside AI work.
- Against: Many small files to keep organised. / Requires discipline to fold an ADR's effect into the requirement text, REQ-7, or the ADRs become the new log.

### REC-12 — dropped

- Statement: A git-synced multi-writer issue tracker with a daemon and local database (Beads-style).
- Source: Research: author-documented data loss, 'overkill for a solo user'.
- Evidence grade: convergent. Suggested: drop. Reason given: Solves a multi-writer problem a solo owner does not have.
- Decision: dropped, 2026-10-31 01:43 UTC. Tag: D
- Note: none
- Page explanation: Beads and similar tools store issues as JSON lines in git with a local database and background syncing, so many agents on many machines share a tracker. Its author documented months of data loss and a difficult migration.
- For: Solves real coordination problems for teams of many parallel writers. / Git-native, so it fits the git-as-record philosophy.
- Against: The hard part it solves, many writers syncing, is not your situation. / Documented data loss, slowness and bloat. / GitHub issues and the ledger of REC-9 cover your need.


## Architecture and checks

### ARC-1 — kept

- Statement: Modules in one total order, each in one layer, lower first, uses declared and matched by imports; a violation fails the gate.
- Source: Requirements ARC-1; held live.
- Evidence grade: measured. Suggested: keep. Reason given: Working.
- Decision: kept, 2026-10-31 01:44 UTC. Tag: C
- Note: none
- Page explanation: Every module sits in one layer and one position in a total order. Each module declares which earlier modules it uses, and a check confirms its imports match the declaration. A violation fails the gate.
- For: Working today. / Makes layer-by-layer building possible. / Prevents hidden coupling.
- Against: Reordering modules is expensive once code depends on the order. / The check can be strict about helper modules and needs a clear rule for them.

### ARC-2 — kept

- Statement: Each file has one owner module; a job writes only its module's paths and tests and the strike of its own marks.
- Source: Requirements ARC-2; held live.
- Evidence grade: measured. Suggested: keep. Reason given: Working.
- Decision: kept, 2026-10-31 01:44 UTC. Tag: C
- Note: none
- Page explanation: Each source file belongs to one module. A job may write only its module's files and tests, plus the lines in the requirements file that mark its own requirements as met.
- For: Working today. / Makes parallel jobs safe from overwriting each other. / A simple check.
- Against: Shared files such as configuration need a designated owner. / A fix that spans modules needs two jobs or a BOB ruling.

### ARC-3 — kept

- Statement: A test asserts on a text's key, never on its words; every user-facing sentence lives once in the word table.
- Source: Requirements ARC-3; your word of 30 Oct.
- Evidence grade: measured. Suggested: keep. Reason given: Working.
- Decision: kept, 2026-10-31 01:45 UTC. Tag: C
- Note: none
- Page explanation: User-facing text lives once in a word table, keyed by an id. Tests check that the right key was used, not the words. Only the words check compares actual text.
- For: Your ruling; changing wording never breaks tests. / Enables translation and a consistent voice. / Working today.
- Against: A wrong sentence under the right key passes every test; the words table must be reviewed by a person. / Slight indirection for anyone reading a test.

### ARC-4 — modified (against the suggestion: keep)

- Statement: The checks are scoped to a module in the gate and run whole once at a layer's close.
- Source: Requirements ARC-4.
- Evidence grade: measured. Suggested: keep. Reason given: Working.
- Decision: modified, 2026-10-31 02:05 UTC. Tag: C
- Note (owner's own words): The architecture, ownership, format and coverage checks run only against the job's module in its gate, layer checks when a layer closes, and over the whole product before a release or when I ask for one.
- Page explanation: The architecture, ownership, format and coverage checks run only against the job's module in its gate, and run over the whole product once when a layer closes.
- For: Keeps gates fast. / Catches cross-module problems at layer close before they compound.
- Against: A problem introduced by one job may surface only at layer close, when its session is gone. / Layer close becomes a longer step.

### ARC-5 — kept

- Statement: Every check and gate finding names module, file and line in one machine-readable result that status reads; a red is never searched for in a log.
- Source: Requirements ARC-5, GAT-7 (gate logs read by hand on the 30th).
- Evidence grade: proposed. Suggested: keep. Reason given: Cheap to build, saves BOB context every time.
- Decision: kept, 2026-10-31 01:46 UTC. Tag: C
- Note: none
- Page explanation: Every check and gate writes its findings as structured data: module, file, line, rule. The status command and BOB read that, so no one scrolls a CI log to find why a gate went red.
- For: Gate logs were read by hand on the 30th to find one failure. / Saves BOB context on every red. / Enables counting findings per module over time.
- Against: Each check needs an output adapter. / Structured output can hide useful context that a raw log shows.


## Requirements

### REQ-1 — kept

- Statement: Each module's requirements file has a public part and a private part, every statement under a permanent id.
- Source: Requirements REQ-1; held.
- Evidence grade: measured. Suggested: keep. Reason given: Working.
- Decision: kept, 2026-10-31 01:47 UTC. Tag: R
- Note: none
- Page explanation: Each module's requirements file has a public part describing its purpose and what it provides, and a private part listing what it uses, its invariants, which requirements it satisfies, and suggestions. Every statement has a permanent id.
- For: Working today. / Permanent ids let tests, plans and ADRs cite requirements. / The public and private split tells users what they may depend on.
- Against: A rigid format can be gamed by writing to the template rather than thinking. / Format checks need maintenance.

### REQ-2 — kept

- Statement: A requirement states behaviour at the interface, never an implementation; an ambiguity is removed by rewriting the text.
- Source: Requirements REQ-2 (16 rulings in a day were mostly this).
- Evidence grade: measured. Suggested: keep. Reason given: Principle behind the consolidation mechanism.
- Decision: kept, 2026-10-31 01:47 UTC. Tag: O
- Note: none
- Page explanation: A requirement says what a module does as seen from outside, not how. When a requirement is found ambiguous, the text is rewritten; a clarifying ruling is never attached beside it.
- For: Most of BOB's rulings on the 30th were exactly this and should have been edits. / Keeps the requirements file the single source. / Avoids the ruling log.
- Against: Rewriting shifts text under a job already working from the old wording; needs a notice. / Judging interface versus implementation takes skill and sometimes argument.

### REQ-3 — kept

- Statement: A figure at a scale beyond the suite is a measurement with its own plan id, never a Test line; a review never counts an untaken measurement as a gap.
- Source: Requirements REQ-3 (a job ran million-row fixtures in-session for hours).
- Evidence grade: measured. Suggested: keep. Reason given: Measured waste.
- Decision: kept, 2026-10-31 01:48 UTC. Tag: X
- Note: none
- Page explanation: If a requirement involves scale, such as a million rows, the suite proves the behaviour at a small size and the scale figure becomes a separate measurement item in the plan. A test line never names a huge fixture, and a reviewer never counts an untaken measurement as a gap.
- For: A job ran million-row fixtures in-session for hours because of this. / Keeps gates fast and suites honest about what they prove. / Measurements can be scheduled when infrastructure exists.
- Against: Scale bugs are found later, in measurement, not in the gate. / Needs a format rule and a reviewer brief that know the distinction.

### REQ-4 — kept

- Statement: A not-yet-met mark is struck only by the job that meets it, in its own commit.
- Source: Requirements REQ-4; held.
- Evidence grade: measured. Suggested: keep. Reason given: Working.
- Decision: kept, 2026-10-31 01:48 UTC. Tag: R
- Note: none
- Page explanation: A requirement marked not-yet-met is changed to met only by the job that implements it, in that job's own commit. BOB never strikes a mark on a job's behalf.
- For: Working today. / The commit proves who claimed completion. / Keeps marks and code in the same diff.
- Against: If a job dies after meeting a requirement but before striking it, the successor must redo the strike. / A mark can be struck without the test proving the requirement; JOB-12 addresses that.

### REQ-5 — kept

- Statement: A change to what a provided service means goes to you only by the DES 1 test; every other change is BOB's, recorded once.
- Source: Requirements REQ-5.
- Evidence grade: measured. Suggested: keep. Reason given: Protects your time.
- Decision: kept, 2026-10-31 01:48 UTC. Tag: O
- Note: none
- Page explanation: A change that alters what a module promises to its users comes to you only when it changes what the product does for its users and the canon is silent. Everything else BOB decides, records once, and reports.
- For: Protects your time, the scarcest resource. / A clear test reduces argument about what is yours.
- Against: BOB will sometimes misjudge the test in both directions. / Decisions you would have wanted to see may be made without you.

### REQ-6 — modified

- Statement: Size of a module's requirements file: the 30 Oct draft says no limit, overrun reported; the 29 Oct page set a hard cap that refused 127 of 127 modules.
- Source: Requirements REQ-6 and SES-6; neoProcess page §8; research: numeric caps are tool limits, not quality thresholds, and should be alarms.
- Evidence grade: measured. Suggested: modify. Reason given: Suggest: a cap that triggers a split or consolidation by BOB before any job starts, measured on the real product; never a refusal at a job's start.
- Decision: modified, 2026-10-31 01:50 UTC. Tag: X
- Note (copy of the suggestion): Suggest: a cap that triggers a split or consolidation by BOB before any job starts, measured on the real product; never a refusal at a job's start.
- Page explanation: The 29 Oct page set a hard byte cap on a module's requirements file and refused jobs above it, which refused every module. The 30 Oct draft removed the cap entirely and only reports overruns. The suggestion is a cap that triggers work for BOB, splitting the module or consolidating its requirements, before any job opens; never a refusal at a job's start.
- For: A cap is the only thing that forces consolidation to happen. / Your observation that neoProcess ensured every job knew what it needed came from the cap. / A trigger rather than a refusal never blocks a job.
- Against: Any number is arbitrary until measured on real jobs. / Consolidation is real work for BOB and may lose detail. / Research found no study tying instruction length to coding success, so the threshold is a judgment.

### REQ-7 — kept

- Statement: Only explicitly marked words of yours become decisions; a ruling lives only until the requirement it refines is rewritten to absorb it, then it is deleted.
- Source: This week's discussion; your report of 5,782 rulings in 34 days; research: corrections are made by adding prohibitions, not editing.
- Evidence grade: measured. Suggested: keep. Reason given: The missing mechanism behind REQ-2. New to the ledger.
- Decision: kept, 2026-10-31 01:50 UTC. Tag: X
- Note: none
- Page explanation: Only words you explicitly mark as a decision become rulings; your other remarks are input. A ruling exists only until the requirement or rule it refines is rewritten to absorb it, then it is deleted. There is no permanent log of rulings.
- For: Addresses the 5,782-ruling problem directly. / Research shows corrections are made by adding prohibitions, never editing; this forces editing. / Keeps every rule in one home.
- Against: Requires you to mark decisions, a small habit change. / History of why a rule changed lives only in git and ADRs, not in a readable log. / Someone must do the absorbing, and it is easy to defer.


## Planning

### PLN-1 — kept

- Statement: The structure is layers within rounds within tranches, and nothing else about a product's size or shape is assumed.
- Source: Requirements PLN-1; your word of 30 Oct.
- Evidence grade: measured. Suggested: keep. Reason given: Your constraint.
- Decision: kept, 2026-10-31 01:51 UTC. Tag: O
- Note: none
- Page explanation: Work is organised as tranches, each with rounds, each with layers that follow the module order. That structure is fixed. Nothing else about the product, such as how many modules or how large a file, is assumed.
- For: Your stated constraint. / A fixed structure lets the tool stay simple.
- Against: A product that does not fit layers well will fight the structure. / Three nested levels are more ceremony than a small product needs.

### PLN-2 — kept

- Statement: A plan is written from the work that remains; an entry is deferred only for one of three named reasons.
- Source: Requirements PLN-2; P19.
- Evidence grade: measured. Suggested: keep. Reason given: Held.
- Decision: kept, 2026-10-31 01:51 UTC. Tag: O
- Note: none
- Page explanation: A tranche plan lists all remaining work. An entry may be left out only for one of three reasons: a decision of yours not yet made, a deployment or measurement that cannot happen inside the tranche, or something outside the product that does not yet exist. The reason is written.
- For: Prevents quiet scope reduction. / Held so far. / Deferrals become reviewable.
- Against: Pushes toward large tranches, which take longer to close. / The three reasons may not cover every legitimate deferral.

