# [file] process4_definition_v6.md (continued)

5. **Records and cost figures kept for each job** (5 lines): no per-job record of reading or cost, no cost alarm, and no strictly formatted job record.
6. **Size limits and checks on what goes into the repository** (4 lines): no size cap on a module's requirements file, no check on oversized or temporary files, and no second required "record" check.
7. **Rules about the process's own rules and instruction texts** (6 lines): every rule citing a measured failure or your decision, the line-by-line test of instruction files, and the audit of whether sessions read documents whole.

---


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


# [file] process4_counterarguments.md (later part)

### 82. Twenty measurements where your line says one

**The counter-argument.** Your kept line says a platform behaviour is measured once by default. One trial asks for "twenty or more merges" and does not give the reason.

**What it rests on.** Read in the documents. Measured: the permission checker has passed and refused the same act minutes apart.

**How bad if true.** Minor.

**The answer.** The memo is silent. Answer taken from the reviewer's own proposed correction: the reason is given, twenty and not one because the checker has passed and refused the same act minutes apart.

### 83. The first contents of Process4 are written before any rule exists, and no size is given

**The counter-argument.** Process4's tool, texts and walk are written by sessions before the first tranche. The second draft gives no size for them, so there is nothing to compare later growth with.

**What it rests on.** Reasoning only.

**How bad if true.** Minor.

**The answer.** Corrected in the third draft: the tool's starting size is stated once it is built (entry 25). It is not known now.

### 84. Committing your approvals is not one act

**The counter-argument.** Your commit of your approvals is an edit, a proposed change, a wait for the test run and a click to merge.

**What it rests on.** Measured: your own commit in Process3 went that way.

**How bad if true.** Misleads you slightly.

**The answer.** The memo is silent on these steps. Answer taken from the reviewer's own proposed correction, which is wording: the act is described as it is. The memo does restate the act in other ways (entries 28 and 33).

### 85. Two retired hooks still run in the product

**The counter-argument.** Two retired hooks still run before every command of every session in the product. Only you can delete them, and that is not on the list of your acts.

**What it rests on.** Measured: the product's settings as they stand.

**How bad if true.** Minor.

**The answer.** Corrected in the third draft: stated in "What does not exist yet" (entry 25). The memo does not say that deleting them is added to the list of your acts.

### 86. Two small reports nobody asked for

**The counter-argument.** The process "shows you what [a release] carries", and ARCH "reports" a change across many modules. No line of yours asks for either. The reviewer calls them new, small and harmless.

**What it rests on.** Read in the documents.

**How bad if true.** Minor.

**The answer.** The memo is silent. The reviewer's own proposed correction is "leave, or drop" the words about the release. Which of the two the third draft does is not settled.

### 87. Two kept lines the main text never states

**The counter-argument.** Two lines of yours are kept only by a blanket sentence, where the silence could matter to a builder: that the product's standing instructions are "under thirty lines", written by the architecture session line by line, with each change listed in the tranche report; and that two ROOTs never both start an architecture session.

**What it rests on.** Read in the documents: your Foundations.

**How bad if true.** Minor.

**The answer.** The memo is silent. Answer taken from the reviewer's own proposed correction: one clause that names them among the lines that stand. The second mattered once a standby could take over; the standby is dropped (entry 15).

---

## What the first trial showed

One measurement finished on 14 Nov after the memo was written: a replay, on paper and with nothing run, of Process3's 178 recorded interface changes against the rules for notices. It bears on entries 7, 21, 36, 72 and 73. Each figure is marked measured, inferred or judged. "Judged effects" means the 241 cases where one of Process3's AI workers judged a notified module to be affected; that is a judgment, not ground truth.

- **(a) Telling every declared user reaches all 241 judged effects.** Measured: 241 of 241, when every module that declares a use is told on any merged change to a module's source or public requirements. Inferred: this could only have broken the rule, not proved it, because Process3 judged only the modules it told. On who is told, the result could not have come out otherwise on this record.
