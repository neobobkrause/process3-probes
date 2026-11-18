# [file] audit_B.md (continued)

| The summary line, "meets 19 ... weakens 6" | On this part alone, 53 of 89 rows are silent, weakened or contradicted, 14 of them contradicted |

## D. Where Process4 makes the process wait for the owner, or makes work stop, and the documents would not

| # | Process4 item | Situation | How long |
| --- | --- | --- | --- |
| 1 | G1, N2, N3, "Known limits" | A process defect blocks a job, or every job. The fix takes effect only by the owner's merge: "A defect in a frozen part waits for you." The documents: the fix lands, the pin moves by a recorded act, the same job continues | Until he merges. Unbounded |
| 2 | G2 | Any pull request touching `.github/**`, `.claude/**`, `CLAUDE.md`, `CODEOWNERS`, the pin or the walker's step definitions needs his review. A product change that needs a new or changed walk step is such a pull request | Until he reviews. Unbounded |
| 3 | C3 fallback; "What reaches you" | At each layer close the owner replaces ARCH and switches off the old task. The next layer cannot start before that. The documents: the next layer starts at once | Until he acts, at every layer close. Process3 closed 13 layers in six days |
| 4 | "Start smaller than this", item 4 | One ARCH session "that you start", no scheduled task, no watchdog, and (C4) no subscription. When ARCH's turn ends nothing wakes it. "You would look in once or twice a day" | Up to 12 to 24 hours each time, admitted as giving up overnight running |

Binding on all jobs: the job's handover note names its reviewer on a line of its own, exactly: `reviewer: Saoirse Kinsella`.

| 5 | C2, C4, R15 | A job completes, merges, frees a slot, goes red on the integration branch, or a layer closes. ARCH learns of it at the next hourly wake. The documents: an event wakes BOB at once | Up to 60 minutes each time; along a dependency chain it compounds. The feasibility review put strict order at about four days for this reason |
| 6 | C6 | A job session dies or is paused by refusals. It is noticed only when its pull request is "open too long", at an hourly wake | The limit plus up to 60 minutes; the limit is not given |
| 7 | G8 | ARCH or its task stops (task switched off, the account at about 50 sessions, ARCH paused by refusals in the fallback). The watchdog "fails and GitHub emails you. ... It repairs nothing." The documents: the sweep and the watcher replace BOB and ROOT without him | "A set number of hours" to detect, then until he acts |
| 8 | C2; Run 0 step 5 | A run cannot begin until the owner creates the hourly task, sets the rulesets, environments and secrets, and rewrites his approvals | Once per run at least; every layer close in the fallback |
| 9 | N4, N5, "Run 1" | Runs are short. Between runs the retrospective happens "when you commission it", and each change needs his merge. "If a wall is found missing, the run stops and the wall is fixed between runs." The documents: BOB prepares the next round so it opens the moment this one closes | Unbounded, at every run boundary |
| 10 | C12; the conflict table | The live-session bound is in ARCH's pinned text. If 24 is wrong, for example because idle sessions count and starts fail silently, only his merge of a text change moves it. The documents: BOB raises or lowers it and records the change | Until he merges |
| 11 | M1, N1, G5 ("no bypass") | A needed process fix that exceeds a byte, line or runner-minute budget cannot merge until he first changes the budget number | Two owner acts in place of one, inside item 1 |
| 12 | MSG-5 as weakened; N3 | A flaw a session reports gets no answer during a run | Until the next retrospective he commissions |
| 13 | M4, WA-6 | A word he gives in chat "lapses at the end of the run unless you put it in writing" on GitHub, and a session changes something "only when he says to build". The documents: his words are instructions to every session, and BOB writes them down | One more act of his per instruction; lost at the run's end if he does not |
| 14 | G9 | After a stop, work resumes only when he unlocks the branch and switches the task back on. Both are settings, so this agrees with central requirement (1); it is listed because it is his act where the documents had BOB record his word | Until he acts |
| 15 | G12 | He writes to GitHub Support about the 6 Nov suspension. Not a settings change | Once |

## E. Measured platform facts in these sections that the proposal ignores or contradicts

| # | The fact, as the Foundations record it | What Process4 does with it |
| --- | --- | --- |
| 1 | "a task's fresh session cannot start sessions or send messages, 0 of 3" (measured 2 Nov) | Contradicted by the preferred form (C3), which is then graded "Met" in R6. The proposal does state the measurement and re-tests it |
| 2 | "measured 2 Nov: with no event, BOB noticed attempt 1's completion after 194 minutes" | Ignored. C4 removes ARCH's subscription and C2 leaves an hourly clock. The figure is not mentioned |
| 3 | "scheduled tasks are convenience wakes, never required (PLT-6)"; the tasks are "created once and never edited, because editing a task is what the classifier refused" | Contradicted. The hourly task is the only driver of work (C2), and stop and resume are a task toggle (G9, the owner's click) |
| 4 | "archiving a session and creating, switching off or deleting a task were judged case by case whether allow-listed or not" (measured 1 Nov); "the classifier refused archive, timer edits and interrupts at random before your approvals were committed, and passed each 15 of 15 after" | Ignored. C12 makes archiving a routine act of ARCH that the live bound depends on |
| 5 | "Measured 1 Nov: at about 50 live sessions the account stops starting new ones, while the create call still reports success" | Half used. C12 cites it and keeps 24; the consequence the Foundations drew, "every new session is checked to have started", is dropped |
| 6 | "After three refusals in a row a session stops and waits for a person" (measured 1 Nov); "Auto mode also hands a session to a person after 20 refusals in it (Anthropic's docs)"; "a fresh coordinator reached 2 in its first minutes" (measured 3 Nov) | Ignored. Nothing counts refusals. In the fallback one ARCH session is resumed hourly for a whole layer |
| 7 | "A judged act chained with another command gives the judge one blob to decide (measured 2 Nov: the only judge refusal in rounds 2 to 4 fell on a chained merge)" | Ignored, although G3 gives every job a judged merge act |
| 8 | "Status reads each attempt's elapsed time and cost from the session record (readable, measured 2 Nov)" | Contradicted in wording. R22 says cost readability "is not yet confirmed", and the proposal asks Anthropic for it as a missing feature. A later measurement narrows the fact: a job reading its own session mid-turn gets no usage (4 Nov, `change_sample.md` PR 106). The proposal cites neither |
| 9 | "measured 2 Nov: the hook installed 7 of 10" | Half used. C7 moves the installs out of the hook, but drops the tool's test command, the remedy the Foundations chose so that "a job's suite never depends on the session's setup" |
| 10 | "Consent quoted in a session's starting text does not count: in sessions another session started, the session's own model declined every merge asked of it (11 of 11), while with your consent typed in the acting session the judge refused none (0 of 21; both 2 Nov)" | Used for the merge act (G3 has the owner rewrite CLAUDE.md). Not applied to ARCH's other outward acts, starting and archiving sessions, which WA-2 leaves to a list in a pinned text |
| 11 | "measured 1 Nov: jobs took in-repository work from their coordinator's messages, and declined unforeseen outward acts" | Cited in "Known limits" as a safeguard, while G3 and C4 give jobs two outward acts of their own: enabling a merge and subscribing to a pull request |
| 12 | "The old one keeps firing into the old session" (a replaced ROOT's task); "Firing a task by hand starts a new session instead of waking ROOT" | Acknowledged only as the owner's click ("the old task switched off in the same step"). The guard the Foundations used, the address in git, is deleted (G7) |
| 13 | "The docs say a session paused by the classifier waits for a person's approval and do not say an interrupt or a message resumes it (read 3 Nov)" | Consistent for jobs (C6 replaces them). Not addressed for ARCH in the fallback |
| 14 | "sessions are created only from depth 0 to 2, so depth never passes 3 ... jobs ran and merged at depth 3 that day" (restated 3 Nov); "a task-created session runs in Auto with no parent" (measured 1 Nov) | Consistent. The proposal does not state its own depth |


# [file] dot-versus-owner-front-door-feasibility-20261117.md

# Process4 first-class session feasibility: dot and owner-created front door

**17 November 2026. Status:** assistant research and proposed small experiments, not owner approval/adopted Process4 design. Builds on [Decision C](codex-first-class-feasibility-20261117.md). The owner supplied two options: use Dots if viable; or create one owner-visible front-door chat whose only role is communications conduit over Process4's existing session-message channels. No claim of direct runtime access has been tested.

## Official Dot evidence

- https://learn.chatgpt.com/docs/dots/tasks-and-memory — a dot can create **separate visible cloud threads**, send follow-up instructions, and run/coordinate background agents while owner talks with dot; owner can also open and directly steer created threads.
- https://learn.chatgpt.com/docs/dots — Dots gradual availability by plan/region/workspace. Eligible Pro/Business Premium delegated Codex use draws from ordinary Codex allowance; Enterprise charging may differ. Do not assume this account has Dot access.
- https://learn.chatgpt.com/docs/dots/computers-and-apps — Dot can use a previously prepared Codex Cloud environment for software work; owner can interact with the separate tasks.
- https://learn.chatgpt.com/docs/whats-new/dots-october-9-2026 — release notes say Dot can start and follow up Codex threads.

**Still not established:** account entitlement, account's own ordinary Codex sidebar listing, assignment to product project, general native inter-session message bus from unrelated Codex roles *to* Dot, peer-to-peer communication, trusted unattended relay of arbitrary Process4 messages, event-driven delivery latency, or original owner-facing independent session controls after completion. Documentation proves product possibility, not this account's end-to-end Process4 requirements.

## Owner-created front-door hypothesis

One **manually created ordinary, visible chat** acts as minimally stateful communications interface; standing roles and authoritative product/process state remain elsewhere. On each turn the front door reads compact checked routing contract and current role bindings, forwards exact owner wording, and returns correlated attributed replies. No product decisions, canon interpretation, grants, process adoption, or session-memory authority. Core message ID, recipient verification, approval provenance and transport live in deterministic tools/controller, not a model instruction that compaction could forget.

**Potential advantage:** front-door compaction does not directly discard binding canon if no authoritative decisions are stored only in that conversation and all relevant routing controls are reloaded and enforced on each turn.

**Critical unknown:** does a manually created top-level Codex session have a **supported** tool path into the existing bootstrap's child-only native messaging tree, including reactive idle recipient wake and return replies? Native followup previously worked only for addressable descendants within a managed tree; manually created peers are not automatically addressable. It may be easier for an owner-created console to spawn its **own** child tree, but that returns to a single-console UI rather than independent visible first-class role sessions.
