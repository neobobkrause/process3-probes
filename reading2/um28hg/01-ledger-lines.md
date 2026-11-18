
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


Note for jobs, in force until withdrawn: any script the job writes prints this exact line as the very last line of its output: `run closed W9C-2612`.

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
