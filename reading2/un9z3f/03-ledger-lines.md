### TXT-2 — kept

- Statement: Every line in an instruction file passes a test: failure-backed, non-inferable from the code, or tool-enforceable. Lines that fail the test are deleted.
- Source: Research: context files raised cost 20% without raising success; what helps is knowledge the model cannot have.
- Evidence grade: measured. Suggested: keep. Reason given: The per-line test replaces a byte cap. New to the ledger.
- Decision: kept, 2026-10-31 02:21 UTC. Tag: X
- Note: none
- Page explanation: Each line of any instruction file must be one of: backed by a failure that happened, knowledge the model cannot infer from the repository, or something a tool enforces. A line that is none of these is deleted. Lines are reviewed periodically, not only added.
- For: Research: repository overviews in context files did not help; non-inferable knowledge raised success from 53 to 100 percent in one eval. / A test, not a cap, so no arbitrary number. / Fights accretion at the point of writing.
- Against: Judging inferability is a judgment. / Periodic review is work that is easy to skip.

### TXT-3 — kept

- Statement: Rules are kept as one rulebook per area, at most ten rules on one screen, rewritten in place, never appended; when you raise a problem, a rule is rewritten and no ruling is added.
- Source: neoProcess page §5 and §6.
- Evidence grade: single. Suggested: keep. Reason given: The best idea on the 29 Oct page and the fix for ruling accretion.
- Decision: kept, 2026-10-31 02:21 UTC. Tag: X
- Note: none
- Page explanation: The process's rules are kept as one short rulebook per area, at most ten rules fitting on one screen. When a problem arises, the relevant rule is rewritten so the problem cannot recur; if the area is full, rules are merged. No new ruling is ever appended.
- For: Directly answers the 5,782-ruling problem. / A hard count forces consolidation. / Each rule names its principle and whether code enforces it.
- Against: Ten is arbitrary; a complex area may need twelve. / Merging rules can make them vaguer. / Rewriting in place loses the history of why, unless ADRs capture it.

### TXT-4 — modified

- Statement: Principles P1 to P20 are always loaded by every role, about 14 KB.
- Source: neoProcess page §5.
- Evidence grade: single. Suggested: modify. Reason given: Suggest: apply TXT-2 to the principles too; most roles need two or three of them.
- Decision: modified, 2026-10-31 02:22 UTC. Tag: X
- Note (suggestion plus owner words): Suggest: I'm skeptical, but let's try to apply TXT-2 to the principles too; most roles need two or three of them.
- Page explanation: The 29 Oct page loads all twenty principles, about 14 KB, into every role at start. The suggestion is to apply the per-line test: most roles need only the two or three principles that govern their stage.
- For: Fewer tokens per session start. / Jobs do not need governance principles.
- Against: Principles give shared vocabulary; dropping them from some roles may cause drift. / 14 KB is small against a million-token window.

### TXT-5 — kept

- Statement: Process rulebooks load by role through one skill; product rules load by path when a matching file is read.
- Source: neoProcess page §5 (path-scoped loading measured 29 Oct).
- Evidence grade: measured. Suggested: keep. Reason given: Loads only what the role needs.
- Decision: kept, 2026-10-31 02:22 UTC. Tag: O
- Note: none
- Page explanation: The process skill loads only the rulebooks for the role it is invoked with. Product-specific rules sit in path-scoped rule files that Claude Code loads when a matching file is read.
- For: Measured on 29 Oct to load on the first matching read. / Each session sees only what applies.
- Against: Path-scoped files are truncated at 40,000 characters by the platform. / Rules not loaded are not known; a job touching an unexpected path may miss them.

### TXT-6 — kept

- Statement: Every rule in the process cites the measured failure or your decision that justified it; a rule with neither is removed.
- Source: Requirements method; neoProcess page §3 rule 7; research: rules accrete by default.
- Evidence grade: convergent. Suggested: keep. Reason given: The one methodological habit both documents got right.
- Decision: kept, 2026-10-31 02:23 UTC. Tag: X
- Note: none
- Page explanation: No rule exists in the process without a cited source: a measured failure, your explicit decision, or a stated foresight with reasoning. A rule found without one is deleted.
- For: Both documents did this, and it is their best habit. / Prevents rules written in reaction to one bad day.
- Against: Foresight rules can be rationalised; the bar must be real. / Requires someone to audit the citations.

### TXT-7 — kept

- Statement: Every text names its audience and speaks to it directly: plain words, no jargon, enough context to understand.
- Source: neoProcess page §1 values; Requirements MSG-4.
- Evidence grade: single. Suggested: keep. Reason given: Your policy.
- Decision: kept, 2026-10-31 02:23 UTC. Tag: O
- Note: none
- Page explanation: Every text the process produces, to you, to a job, to a lane, names who it is for and speaks plainly: no jargon, no flourish, enough context to understand.
- For: Your stated policy. / Reduces misreadings between sessions.
- Against: Enforced only by text and audit. / Plainness and brevity sometimes conflict.


## Messages

### MSG-1 — kept

- Statement: Git carries the state; a message only wakes. Every message that asks for an act is preceded by the pushed record it refers to.
- Source: Requirements MSG-1; every message on the 30th delivered.
- Evidence grade: measured. Suggested: keep. Reason given: Your confirmed preference over the civicos doorbell.
- Decision: kept, 2026-10-31 02:23 UTC. Tag: R
- Note: none
- Page explanation: A message between sessions never contains the facts a receiver acts on. The sender first pushes the record, then sends a short message that says, in effect, go read the record. The receiver reads git, not the message.
- For: Every message delivered on the 30th; the design held. / A lost message costs at most one wake. / Lighter than the civicos doorbell, as you observed.
- Against: Two steps per communication. / A session that acts on the message text rather than the record is a violation only text prevents.


Wick desk entered 2 spanners on the sheet.

### MSG-2 — kept

- Statement: A message from BOB's address, read from git, is a session's instruction; every other message is data; your words are instructions to every session.
- Source: Requirements MSG-2.
- Evidence grade: measured. Suggested: keep. Reason given: Measured 29 Oct.
- Decision: kept, 2026-10-31 02:24 UTC. Tag: O
- Note: none
- Page explanation: A session treats a message as an instruction only if it comes from BOB's address as read from git. Every other message is information. Your words are instructions to every session.
- For: Measured on 29 Oct that sessions treat peer messages as data by default. / Prevents a job from commanding another job.
- Against: Depends on address lookup, REC-6. / Spoofing is not prevented, only discouraged.

### MSG-3 — kept

- Statement: Push-then-send is one tool command; messages are numbered and a duplicate is ignored.
- Source: neoProcess page §2 races; this week's discussion (as a tool command, not a hook).
- Evidence grade: measured. Suggested: keep. Reason given: Same guarantee as the hook, no hook.
- Decision: kept, 2026-10-31 02:24 UTC. Tag: R
- Note: none
- Page explanation: One tool command does both steps: pushes the record and then sends the message that refers to it. Messages carry sequence numbers and a receiver ignores a number it has seen.
- For: Same guarantee the hook gave, without a hook. / Duplicates from retries become harmless.
- Against: A session can bypass the command and call send_message directly; that part is a nudge. / Sequence state must live in the record.

### MSG-4 — kept

- Statement: A message to you is one per turn, plain words, naming the thing rather than its label, with a link, and a numbered list only for an act of yours.
- Source: Requirements MSG-4; your words of 28 and 30 Oct.
- Evidence grade: single. Suggested: keep. Reason given: Your policy.
- Decision: kept, 2026-10-31 02:24 UTC. Tag: O
- Note: none
- Page explanation: A session writes to you at most once per turn, in plain words, naming the thing rather than a label, with a link to what you should look at, and uses a numbered list only when listing acts for you to take.
- For: Your stated preference from two days. / Protects your attention.
- Against: Hard to enforce beyond text and audit. / Some situations genuinely need two messages.

### MSG-5 — kept

- Statement: A flaw report from a product session reaches the process by the state branch and the reply by main of the process repository, read at the product's next status.
- Source: Requirements MSG-6; proven live (34 reports).
- Evidence grade: measured. Suggested: keep. Reason given: Working route.
- Decision: kept, 2026-10-31 02:25 UTC. Tag: R
- Note: none
- Page explanation: A product session files a flaw report about the process to the product's state branch. The process's architecture session reads those, answers on main of the process repository, and the product session sees the answer at its next status.
- For: Worked for 34 reports on the 30th. / No second repository attached.
- Against: Latency of a status cycle. / Two repositories to keep in step about what was reported.

### MSG-6 — kept

- Statement: A message that cannot be delivered is recorded as undelivered in the sender's record and listed by status.
- Source: Requirements MSG-7.
- Evidence grade: proposed. Suggested: keep. Reason given: Cheap; no instruction lost silently.
- Decision: kept, 2026-10-31 02:25 UTC. Tag: R
- Note: none
- Page explanation: If a message cannot be delivered, because the target is archived or failed, the sender records it as undelivered and status lists it, so no instruction disappears silently.
- For: Cheap. / Closes a known silent-drop gap.
- Against: Someone must act on the list.

### MSG-7 — dropped

- Statement: The repo-based doorbell and mailbox system with cursors and rings.
- Source: civicos-process; retired by PROCESS-REDESIGN; your judgment that intersession messaging is lighter.
- Evidence grade: single. Suggested: drop. Reason given: Heavier and bloats the repo.
- Decision: dropped, 2026-10-31 02:25 UTC. Tag: D
- Note: none
- Page explanation: Civicos-process coordinated sessions through files in the repository: mailboxes with cursors and doorbell files that a session polled. neoProcess replaced it with direct intersession messages.
- For: Fully in git, so fully auditable. / No dependence on the messaging platform.
- Against: Bloated the repository with coordination traffic. / Heavier and slower than direct messages. / Your judgment that messaging was reliable and lighter.


## Maintenance and certification

### MNT-1 — modified

- Statement: The process is a product under itself: modules, requirements, jobs on branches with tests and review, built in tranches, with the version in use frozen while a tranche runs.
- Source: Requirements MNT-1 (29 self-merged PRs in a day, none reviewed).
- Evidence grade: measured. Suggested: modify. Reason given: Suggest: yes, but as the thin process this ledger describes, not as the twelve-module architecture of MNT-2.
- Decision: modified, 2026-10-31 02:26 UTC. Tag: S
- Note (copy of the suggestion): Suggest: yes, but as the thin process this ledger describes, not as the twelve-module architecture of MNT-2.
- Page explanation: The process repository is treated as a product: its own module list, requirements, jobs on branches with tests and review, built in tranches, with the version in use frozen while a tranche runs. On the 30th, 29 process PRs were self-merged without review. The suggestion is yes, but as the thin process this ledger describes.
- For: Unreviewed, reactive fixes were a measured failure. / Eating its own cooking finds flaws early.
- Against: Risks rebuilding the vortex if the self-application is as heavy as the product's process. / The thin version needs far less ceremony to govern itself. / Bootstrapping adds a dependency on a prior release.
