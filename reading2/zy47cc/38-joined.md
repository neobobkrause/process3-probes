# [file] receipt-regate-options.md (continued)

   gate is left alone, so a pull request the train holds (it takes only green heads) never gets
   a new run under it, and its land is not delayed by a check going pending.
3. No marker line already names this receipt comment, so a rerun of job complete after a
   failed edit edits again, and a rerun after a good edit does nothing (idempotent, as the rest
   of `finish`).

A failed PATCH stops job complete with "run job complete again"; the receipt is already posted,
so the rerun posts nothing and only edits. A cancelled run (a newer event) is handled by GitHub's
concurrency group as today. A plain pull request has no receipt and is untouched. The first
complete keeps its route (draft, then `markReady` fires `ready_for_review`); a new attempt keeps
its push.

## Recommendation

A, with the three conditions above. It removes the person from the loop at the cost of exactly
the one gate run a person would have started, keeps every head-keyed record, judges the current
base, and uses a call the job's account already makes.


# [file] change_sample.md (later part)

What "no change" would have cost. Nothing measurable: CI's run was already the truth, and the false-done count survives without it ("a red suite or revert check on that attempt's run"). This is the clearest case of a check on a record about the work standing beside a check that runs the work.

### Case 4. GitHub pacing (PRs 205, 206, 208 → 237 → 295): one external event, 17 follow-up merges

What happened. On 6 Nov the session account was suspended, "likely for automated bulk activity"; the copy had pushed its state branch 1,387 times that day, much of it the process's own bookkeeping. The response was a ledger of every call, 2-second spacing, session caps of 4, a push ceiling of 120 an hour that GitHub does not publish, an hourly audit and a hook on every tool call. PD-3 did weigh alternatives ("no ceiling (GitHub sets none, but the suspension came anyway)") and named the cost ("the layer flow can be throttled at busy hours"). The next morning the ceiling read 121/120, a layer merge was held, and the owner wrote: "make sure that this baseless overcaution NEVER happens. NEVER!" The study then found the ceiling "would not have prevented the suspension it was set against". The ledger lived two more days and drew fixes to its own completeness (C34, C47, C52, C53) before PD-22: "Primary use never went above about 12% of the limit, and about 11 builder fixes in three days went into that machinery."

What "no change" would have cost. The record itself points at the cheaper answer that was partly taken later: push less (PR 236, read commands make no pushes) and obey GitHub's own refusal. That would have cost one or two merges. The unmeasured cause was guarded with a guessed number, then the guard was guarded.

### Case 5. Branch-bound and gate-check-bind (PRs 165, 171 → 177): reviewer-constructed attacks, lives of about two hours

What happened. Two cold reviews on 5 Nov constructed ways a gate row or check could be forged: "a second PR from a job branch into a base with a workflow of its own, then closed"; "a run of another branch at the merged result's commit could stand in for it". Each became a fail-closed binding with roughly 100–200 lines of tests, confirmed by a second review as "no bypass, no fail-open". Neither attack had happened, and the only parties who could mount one were the process's own sessions. Both were removed within 2 h 19 min and 1 h 40 min by the owner-driven audit: no measured catch.

What "no change" would have cost. Nothing observed. The foundations already say a reviewer's "what if" "is one line in a report". Here it was two merges.

### Case 6. The companion land order and the reverted safeguards (PRs 290 → 294, and 293): the last additions and the first refusal to add

What happened. On 9 Nov jobs were blocked because a registry module could not join the open layer. PD-19 opened that route, which was needed, and attached an order: the dependent "lands only after its companion", with a list of refusals that "fail closed". No failure of unordered lands is cited; the stated reason is "It is never a way around the plan." Under four hours later layer 14 was deadlocked: the companion's "own suite is red until they land, and they could not land until it did". PD-19b removed the order and ends "No new check is added." The same morning PR 293 shows the change of stance inside one branch: a commit "fail closed on the cold review's holes" is reverted four minutes later, "Bob is auditing safeguards that piled up without his approval ... the cold review's asks go in the PR body for later."

What "no change" would have cost. For the land order, nothing: the layer's merge gate already checked the layer whole. The route was the fix; the ordering was added out of habit and stopped the work it was meant to release.

### Case 7. Verifying built files and matching the two walks (PR 251 / PD-9, PR 254 / PD-11): what a good addition looks like

What happened. On 7–8 Nov two product faults got through to round close: a built file's checker failed only at layer merge, "a day late", and the live walk found 1,690 page faults the internal walk never ran checks for. Each response extends an existing product-running step to where the fault entered, and each decision record states its cost in one line: "The cost is the built rows' verify time on each gate (seconds today)"; "The cost is the page checks' time on each internal walk." PR 251 is a net +27 code lines. Neither has needed a repair.

What "no change" would have cost. A second merge run per round and a deploy-then-fix cycle for every page fault, both measured once already. These are the pattern: an observed product failure, the product executed earlier, a narrow change, a cost in seconds stated up front.

### Case 8. The approvals history rules (PR 26 → 32): six review passes, 1,232 lines, 3 hours

What happened. On 2 Nov a "review follow-ups" change tightened how the owner's approvals block may change. Review A and B asked for changes; four re-reviews each found another route by which a stale block could arrive, and each produced another rule: a date floor, carry-dating of merges, eligibility by ancestry. It merged at +444 code and +788 test lines with the remaining findings "listed as known limits or owed". About three hours later BOB's "Build J: cut the tool back" replaced it with "one rule" and dropped "the history machinery, the date floor, carry-dating, the owner's-own range and eligibility". The round limit added the same evening (PR 29) was meant to stop this; it was overridden every time it applied.

What "no change" would have cost. Nothing observed: no session had tried to alter the approvals block, and branch protection plus the owner's website-commit rule already stood. The case shows the review loop as a generator of checks with no stopping rule: each pass is individually reasonable and the sum is discarded.

## Method and limits

- Merge list: first-parent history of `origin/tranche`, diffed against each merge's first parent. Scripts are in `/tmp/claude-0/-home-user/5fb00928-6c32-53d3-a000-4e1f643cb17f/scratchpad/` (`merges.py`, `kw.py`, `classify.py`, `survive.py`, `fate.py`, `records.py`, `tally.py`, `report.py`); per-merge messages are in `work/msgs/`.
- Fates were checked by searching the tip for each mechanism's identifiers and by listing the merges whose diffs touch them. Follow-up counts are approximate.
- "Failure seen" and "fails closed" are read from the messages; I checked diffs only for a minority. A check I mark "never observed" may have had an incident the message does not cite.
- The sample is weighted toward larger and later changes, so its rates are not exact population rates; the trigger tally in section 2 covers all additions but rests on a lighter reading for the unsampled ones.
- The record ends on 9 Nov with the direct flow just merged. Checks counted as kept had between a few hours and eight days to be removed.


# [file] codex-first-class-feasibility-20261117.md

# Process4 first-class Codex session feasibility

**November 17, 2026. Decision C for the current hosted Process4 architecture. Pause development that depends on autonomous creation and reactivation of independently listed Codex sessions.** A supported interface must allow an existing hosted Process4 session to start a current Cloud conversation under the owner's account and add a new turn to an existing one by ID. That interface is unavailable in the tested runtime. A dot-led coordinator is a conditional architecture change worth one bounded test if the account already includes it.

## Evidence and findings

- **Demonstrated in prior Process4 experiments.** Native child creation, follow-up after completion, reactive supervision and replacement with context preservation worked. The owner's PROCESS question was relayed through the console. This proves native hierarchy behavior only. Current implementation documents were reviewed in full at [probe branch head](https://github.com/neobobkrause/process3-probes/tree/3a73a354c9950164c6bfdb0c6d6b0762106e3674/bootstrap), including HANDOFF, INTERACTIVE-SESSIONS, ROOT-LAYOUT-PROPOSAL and the interactivity evidence index.
- **Demonstrated in the earlier preflight, with the 401 reported separately.** The installed CLI previously reported ChatGPT login mode while its Cloud list request received a token-parse 401. Login mode is local state and says nothing about acceptance by a given service. The exact cause remains unknown. The browser observation applied to managed Chrome. No earlier test submitted a Cloud task. The three prior reports in this directory were reviewed in full. [Earlier preflight](first-class-session-minimal-owner-result-20261117.md)
- **Officially documented, with a source-confirmed implementation gap.** Experimental `codex cloud exec --env` submits a task and prints its URL when accepted. The public implementation still discovers environments through the older WHAM service and lacks an add-turn operation in its Cloud task interface. A same-account report obtained HTTP 200 yet could see only the legacy catalog in that CLI, independently of the previous Process4 401. The legacy CLI may create eligible legacy tasks, but success would leave current Cloud visibility and programmatic continuation unproved. [CLI reference](https://learn.chatgpt.com/docs/cli/reference) · [Environment discovery](https://github.com/openai/codex/blob/c08843a5bd16de5524129b2f4270490447991984/codex-rs/cloud-tasks/src/env_detect.rs) · [Task backend](https://github.com/openai/codex/blob/c08843a5bd16de5524129b2f4270490447991984/codex-rs/cloud-tasks-client/src/api.rs#L136) · [Catalog report](https://github.com/openai/codex/issues/50182) · [Lifecycle request](https://github.com/openai/codex/issues/24777)
- **Officially documented preview, source-confirmed primitives, account access unverified.** The experimental macOS/Linux TUI Cloud connection is a different client path. At public main c08843a5bd16de5524129b2f4270490447991984, its backend lists threads, prewarms a thread, activates it by ID, and submits a message with start-if-idle, steer or queue semantics. The documented entry point is a signed-in TUI host switch. No documented headless entry point or hosted delegation/authentication contract usable by Process4 was found. The reusable Rust client takes caller-supplied authorization and its README qualifies public ingress. The source is evidence that primitives exist, not a deployment or entitlement result. [TUI preview](https://learn.chatgpt.com/docs/developer-commands?surface=cli) · [Cloud backend](https://github.com/openai/codex/blob/c08843a5bd16de5524129b2f4270490447991984/codex-rs/app-server-client/src/cloud_backend/requests.rs) · [Native client](https://github.com/openai/codex/blob/c08843a5bd16de5524129b2f4270490447991984/codex-rs/cloud-client/README.md)
