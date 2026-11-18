# [file] CLAUDE.md (continued)


Design lanes, run under BOB, own their lane folders, the design stream (docs/development/ux-substrate) included, and each lane runs as one session at a time. Within the product’s principles they decide design and wording there. Their design documents are claude.ai artifacts, not repository files. A pull request that changes only files in its own lane's folder lands through the merge tool without a test suite run, and the large files a lane's generators build are built at layer close, deploy and release, never committed.

They may never: force-push; delete a branch, tag or release, or choose the delete-branch option when merging; change permission, repository or ruleset settings, or the protected environment; push to main except through the tranche's pull request; publish a public release (one not marked as a development pre-release) or install any release on a site other than a development deployment without my approval, given through the protected GitHub environment that names me as required reviewer; sign anything with my own offline keys, which they never hold; reveal any secret value, including through code they deploy; or act on any account or service other than those named here. Reading public documentation, fetching public packages and images, and Cloudflare pulling the product's images from Docker Hub are not acts on another service.

One exception to the paragraph above: the process's scheduled branch cleanup workflow, running in those GitHub repositories, may delete branches whose commits are all in the tranche, and the merge train's train/head/* branches whose pull request is closed; never main, the tranche or the state branch, a branch with an open pull request, or one with a commit in the last 2 hours.


# [file] root.md

# ROOT's rulebook

For ROOT, read once at start, after your prompt. Your prompt wins where the two differ; a rule your prompt already states lives there, not here. At most ten rules, rewritten in place, never appended (TXT-3). Each cites its line (TXT-6) and names what holds it, or says nudge.

## Principles (TXT-4)

1. No session starts its own successor: a new BOB comes only from you, by the handover, and a new coordinator only from you, at its ask, after it pushed its handoff (PLT-5, SES-1; Bob, 5 Nov 16:33). Held by `start bob` and `start record bob`, which refuse a second BOB, and `start coordinator`, which refuses unless `--replace` names the addressed coordinator and its handoff is on its branch.
2. Git carries state and a message only wakes, after the push (MSG-1). Your pushes are the tool's, paced account-wide by it (P27): push nothing and write nothing through the GitHub connector by hand. Held by `send` and the tool's pacing.

## Rules

1. Run `send delivered` only after send_message returned; a message not recorded delivered stays listed by `status` (MSG-6). Held by `status`.
2. A message to Bob is one per turn, plain, with a link, and a numbered list only for an act of his (MSG-4). Nudge.
3. Nothing holds a turn; stop means stop in that turn (ENF-2, ENF-3). Nudge.
4. A reviewer's or session's "what if" is not a problem and starts nothing; only a failure that happened, or Bob's word, does (GAP-3; Bob, 2 Nov, before the log; unverified). Nudge.
5. Technical choices (a process3 fix or not, a restart, a route) are the coordinator's, never Bob's. A product's are BOB's. Each is a short decision record (REC-11), in its repository's DECISIONS.md, reported in one line. Bob gets only what P17 makes his: what the Foundations say he defines (values, policies, mission, audiences, requirements, principles, high-level architecture, UX, doctrine), his approvals or accounts, or an act only he can take, sent with options and context. Anything else: decide it if it is yours, else send it to the coordinator. A Ledger line whose mechanism must change keeps its purpose and is restated by you; an earlier session asking Bob is no reason to ask (P17; AUD-5, kept by Bob 6 Nov). Nudge.
6. Urgency is a chain, job to BOB to you to the watcher to Bob, each step waiting `targets.decision_minutes` in process/config.json (30 by default) for an answer. An escalation is acted on in the turn it arrives, never left for the sweep; a BOB found archived or idle that long is handed over then. A reversible act the coordinator leaves unanswered that long is taken as you recommended and reported in one line; an irreversible one waits (coordinator, 4 Nov). Nudge.
7. Recorded state carries a checkable end; the tool ends it when that holds, and the sweep reports what stays stale. Never end one by hand: report it, and its fix is a process3 build (Bob, 6 Nov). Held by `sweep` and the tool's ends.

In your prompt, not here: what you may start, the sweep and the watcher tasks, the wake check, one judged act per command, refusals reported word for word, and keeping your context empty.

A switch of Bob's Claude account follows `rulebooks/account-switch.md` (`.process/rulebooks/account-switch.md` in a product): `switch out` on the old account, `switch in` as the new account's first act.


# [file] 07-how-bobs-words-become-decisions.md

# Process4 Foundations, part 7: How Bob's words become decisions

Length: 68 lines. Last section: "What waits for Bob".

## Why this needs a rule

Bob's rule for sessions is that only words he wrote count as his word, and that no session records its own decision or its own summary as his. The rule is in `process4/owner_words/bob_words_14nov_b.md`.

Writer's reading: the danger it answers is a session that hears a remark in conversation, treats it as a decision, writes it down in its own words, and passes it on as Bob's. The record then holds things Bob never said.

## Marked words

A message of Bob's that begins "Decision:" or "Instruction:" is copied exactly, with its date. Everything else is conversation.

A session that thinks Bob has decided something without the mark asks once: "Shall I record that as a decision?"

A question from Bob is answered in words. It is never answered by building something.

## Two records

A decision about a product being built is made through the coordinator. A change to Process4 itself is made through PROCESS, because the process is not a product. Each of the two keeps its own record and is its only writer.

Writer's reading: this follows the rule that every file has one writer (part 5).

## The front door

The coordinator is Bob's front door.

He may also watch ARCH and the lanes, and sometimes speak to them. A marked message given to ARCH or to a lane is followed. It is also passed to the coordinator exactly as typed, to be recorded.

Bob works with a lane through its design pages, and with PROCESS directly.

Before changing accounts, Bob tells the coordinator, so that it can stop development in the old account. He changes the number of slots by telling the coordinator the new value.

## How a question is put

A question is put to Bob inline, and always in the same form:

- a title;
- the question;
- an explanation of the issue;
- the options, each with its own identity;
- the recommendation and its reasons;
- the freedom to set the options aside.

The form answers Bob's working rule: bring him only what is his to decide, say what it is and why it matters to him, and give a recommendation (`bob_words_14nov_b.md`). It also answers his third message in `bob_words_15nov_main.md`. Bob does not follow what every session says in detail. He asks to be walked through what he needs to know, in an organised way, in plain words and with context.

No session assures Bob that something will work. Each claim put to him says what is proven and what is not, names its source, and calls anything unread or unmeasured unknown. His rule is in `bob_words_14nov_b.md`.

## What Bob can see of the work

Bob can see each open job's progress and status without speaking to it. He seldom speaks to jobs, but he counts seeing their progress as important (`bob_words_16_17nov_codex_development.md`).

A product's ROOT, ARCH, coordinator, lanes and jobs are grouped under that product. Helpers are left out. A finished session is archived, not deleted (part 5).

Codex: how sessions are grouped and archived there is not yet known. See `process4/working/codex_shortcomings_to_fill.md`.

## What waits for Bob

One standing page always shows everything that is waiting for Bob. Each act of his with a known date appears on that page before the date, with the steps.

A notification goes to his phone when something arrives that only he can clear. Codex: what carries the notification there is not yet known. See the same file.

When the process is completely blocked, Bob gets one plain message with a numbered list of what is his to do.

Writer's reading: the two serve different moments. The notification tells him that something needs him now. The page lets him see the whole list at any time he chooses, so nothing depends on his having caught a message. Bob may be away from his computer for long periods (`bob_words_14nov_b.md`).

Every reasonable effort is made to renew a token before it expires, so that no full stop is needed. Sessions other than ROOT and the watcher are relatively short-lived. So once a new token is in place, fresh sessions start with it before the old one expires. A full stop happens only if the token is not replaced in time. Claude's reading, not yet confirmed by Bob: a role such as ARCH lasts, while its sessions are refreshed often (part 5).


# [file] lane-charters.md (later part)

**What it was forbidden**
- "Write ONLY `docs/development/actions-design/` on `design/actions`. Never `build/`, canon (`docs/architecture/`), product code, `docs/development/ux-substrate/`, or `main`" (RESUME.md).
- "Requirements stay BOB's (P5). Canon changes are approved by Bob and placed by BOB."
- "Screens are owed to the UX design stream; this lane designs behaviour, requirements, capabilities and use cases."
- It minted no K or DEC numbers.

**How it started and qualified (research first)**
- "**Step 1, research: done.** `research/R1`–`R6` (core canon; other canon; rulings incl. UX DECs; the old 2026-09-29/30 action-design lane; the 11 action modules with tests run 2026-10-09 ...; adjacent modules and what a member can do today)".
- Then "**Step 2, map**", "**Step 3, use cases**", "**Step 4, the decisions**" and "**Step 5**" (canon draft and requirements hand-off) (RESUME.md "Where the work stands").
- HANDOFF H1: "It begins step 1, research of canon, rulings, requirements and built modules on actions, including the old-process lane's `docs/development/action-design/`" (HANDOFF.md H1, @ `9185526c7d`).
- H2: "No ruling is asked of Bob yet; his questions come with the use cases (step 3) and the design (step 4)."

**Predecessor: ACTION_DESIGN #1, 29–30 Sept**
- Branch `claude/brave-johnson-5fqmix`, PR #5, folder `docs/development/action-design/`.
- Its rulings are K590, K597, K600 and K608.
- Its hand-off is `build/plan/action-design/HANDOFF.md` on `copy` main: "everything is under `docs/development/action-design/`, nothing in `build/`, product code or canon".

**End**
- K3469 (2026-10-15), Bob: "the ACTIONS-DESIGN lane [isn't] needed any more". Every hand-off was folded (actions H31, K2775–K2780). Its branches were kept as history.

**Why "publication design" probably means this lane**
- No lane, branch, folder or ruling named publication design exists. Searched: every `copy` branch fetched, the mail outboxes, the history of `build/rulings.md`, `build/manifest.md` and CLAUDE.md on main back to 2026-08-09, and the artifacts.
- In BOB #333's product-area table, publication and actions are one area, "Publication & action", which owns the Publication, Case Making (case) and Action v0.2 canon. Its lane is "none". Sources: https://claude.ai/artifact/J8E73nE7Y4qNczAVPTB5Sn §"Ten product areas"; https://claude.ai/artifact/FXfQapxoZFhKbJ4c3UzX3E §1.
