# [file] proof_outcome.md (continued)


1. **The proof answered the question.** On the changes it can see (names, fields, kinds, operations called by name) the method decides rightly. It cannot be made complete, because a user can depend on things no written interface records. What it misses has, in every case recounted, shown up as a failing test of the user.
2. **Rule 53 as written would cost more than the old method on the real product.** On today's module list a module has on average 79 users directly or through another (measured). Over the 178 recorded changes rule 53 would have run about 14,500 module test runs (estimated from the module list), against Process3's 2,707 notifications. One user's tests took about three minutes here (measured, one module). That is the reverse of Bob's goal. It is also a new gate on every merge, where Bob has said no new tests, gates or checks.
3. **Without rule 53 the misses are caught later, not never.** They are caught when the user's own job next runs its module tests, or in the internal or external walk. That is what Bob accepted on 15 Nov in calling the method "usable".
4. **"Two orders of magnitude" is still not measured.** The proof's mix of changes was chosen to attack the tool, so its 2.6 times fewer notices is no guide. The real record is the guide. There, 74 of 2,707 notifications were needed (judged), and 64 of 178 changes would have sent nothing even with no comments added (measured). The proof session and I agree on the next step that measures it: comment a cluster of real, heavily used modules and replay their recorded changes with the tool.

## What is Bob's to decide

1. **Rule 53, the test run before each merge.** I recommend no, for the cost in point 2 above.
2. **The 23 refusals of design 7.** Each is listed, one line each, in the proof's report under "Every rule added beyond the brief's nine points". I recommend none, beyond the two Bob already approved. They answer attacks written to defeat the tool, and they refused honest code in every blind round.
3. **Whether to run the replay on real modules** before the method goes into Process4's definition.

Design 8's other rules on who is told, and rule 54, are technical. I would take them as the proof session recommends.


# [file] codex-subscription-context-pricing-20261117.md

# Codex subscription context windows: plan, override and usage research

17 November 2026. **Status: research evidence / assistant analysis, not governing Process4 policy or an owner's new decision.** Supplement to [GPT-6 context-window investigation](codex-gpt6-context-window-investigation-20261117.md). The owner's GPT-6+ / **verified effective >=1 million token** requirement is unchanged and remains unverified for native child sessions.

## A. Does the subscription tier affect effective context-window size?

**Official evidence:** https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex says GPT-6.1 Sol's default is **500,000 tokens in Codex and ChatGPT Work**, and model availability depends on plan, workspace settings and rollout. https://help.openai.com/en/articles/9793128-about-chatgpt-pro-tiers and https://help.openai.com/en/articles/20001516-managing-usage-with-gpt-6-astra-in-work-and-codex document different allowances by plan; they do **not** give a tier-by-tier GPT-6.1 Sol context-window entitlement table.

**Inference only:** observed client/account/catalog variation makes different effective windows across deployments plausible, but no reliable official evidence establishes Plus=272K/Pro=500K, that Pro always has a larger context, or that upgrading guarantees 1M.

## B. Can a subscription session request 500K or 1M?

The **Codex CLI** config option `model_context_window` is documented: https://learn.chatgpt.com/docs/config-file/config-reference. Subscription-authenticated CLI users can request `model_context_window = 500000` or `1000000`; requests are subject to the catalog maximum and effective context factor. The public real-world reproduction https://github.com/openai/codex/issues/47805 requested 1M through ChatGPT sign-in and observed an **828,400-token effective** limit after 872K catalog cap * 95%. There is no demonstrated supported context override, compaction control or usage meter for current subscription-hosted **native Process4 child sessions**. CLI settings cannot be assumed to configure unrelated hosted children.

In a known 272K-default/872K-max/95%-usable catalog, 500K requested -> 475K usable, 800K -> 760K usable, 1M requested -> 828.4K usable. The **500K product default** is not guaranteed to share the particular 272K fallback catalog; these are illustrative/runtime-observed variants, not all user's sessions.

## C. Extra billing versus subscription allowance

**Explicit official statement:** https://developers.openai.com/api/docs/models/gpt-6.1-sol states "**Usage drawn from your subscription has no long-context surcharge**." https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex repeats no additional long-context surcharge for subscription-covered GPT-6.1 Sol. Thus asking for a larger window does **not by itself** create a long-context fee within included subscription usage.

**However** https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan and https://help.openai.com/en/articles/20001625-understanding-chatgpt-and-codex-usage-limits say usage depends on model, context, task, reasoning, tools and token processing. A larger available window by itself need not process more tokens; **actually filling and repeatedly processing longer context can exhaust included allowances sooner**. Depending on plan and usage controls, exhausted allowances can lead to waiting/reset, upgrade, or spending additional purchased credits. Do not automatically authorize credit purchases or assume the owner's subscription-funded/no-extra-cost condition permits them.

**Separate API**: https://developers.openai.com/api/docs/models/gpt-6.1-sol states API requests with >272K input tokens are billed **2x input/cache and 1.5x output for the whole request**; API calls are **separately billed**, and that surcharge cannot be imported into subscription-funded Codex claims. No per-token API inference is authorized for Process4.

## Implication

Do not confuse (1) model API total 1.05M, (2) selected Codex catalog raw window, (3) usable window and compaction threshold, (4) subscription allowance and (5) API billing. Verify actual hosted model/capacity through a supported session-specific receipt. Until then owner-mandated >=1M is **not certified**, even with Pro or a CLI request. Retain proactive refresh and canon reading protections regardless of capacity.


# [file] train-spec-plan.md

# Speculative gates in the merge train (option C): build plan

5 Nov 2026, build/train-spec from tranche 74c3679. Design: notes/train-throughput-study.md §3 C on
study/train-throughput, as the coordinator restated it (points 1-5). This page maps each point to
code, lists where the code shows the design cannot run as worded, and says how it is tested.

## Where the code shows a flaw (deviation, put to the coordinator before it is built)

The design says process-gate "runs unchanged" on a draft PR from the job's branch into
`train/spec-<i>`, and that spec branches are reused per position. Four things in the code stop that:

1. **A draft PR's gate runs no suite, and a spec PR has no receipt.** gate.mjs reads the PR's draft
   state live (line 86) and a draft gets trigger `draft`: no suite, no revert, no receipt (line 151).
   Made ready instead, the receipt is read only from that PR's own comments by its opener (line 94):
   a spec PR has none, so the gate is red ("ready but has no receipt", line 269). The gate needs a
   spec mode either way.
2. **A second PR from `job/<id>` breaks three checks that guard against exactly that.**
   - verifyRow (github.mjs 158-161) refuses a run whose listed PRs include one into a base other than
     the tranche ("not a second PR on the same commit into a branch that carries a workflow of its
     own"). While the spec PR is open, the job PR's own rows can stop verifying, and the spec PR's
     rows never verify against the tranche.
   - branchBound (gate.mjs 433-440): any PR ever opened from `job/<id>` into another base removes the
     tranche cover for that job's merge, for good (PRs cannot be deleted). Every speculated module's
     suite would run again in the tranche into main, which is what the cover exists to avoid (cap).
   - Check runs attach to the head commit, shared by both PRs: `checkRun(head, 'gate')` (ready,
     jobChecks, waitForGate, the ruleset's required check) returns whichever ran last. A red spec
     run shows red on the job PR's head.
3. **Reusing `train/spec-<i>` needs a force-push.** Rebuilding position i on a new base is a
   non-fast-forward update. Making each rebuild a descendant of the old tip instead keeps old ahead
   heads reachable; when a job later sits behind a spec that once held its own older head, the merge
   base of the job and the spec becomes that head and GitHub's test merge drops part of the job's
   change (a false red, sent back to the job).
4. **The land as worded loses the tranche cover and the merge row.** GitHub's merge of the job's head
   into a tranche that is not its ancestor is a new merge computed at land time, not checked bytes;
   jobMerge (gate.mjs 450-451) covers only a merge whose head was brought up to the tranche and holds
   the merge row (merge.mjs 204), which today's merge() pushes onto the job branch before its gate.

## The deviation proposed (C', same strength: every land is the tree a green gate tested)

- **Spec pair per build, fresh names, never reused or deleted:** base `train/spec/<pr>-<seq>` at
  R(i-1), head `train/head/<pr>-<seq>` at R(i), where R(i) is the predicted merged result of window
  position i: the job's head merged onto R(i-1) (R(-1) = the tranche tip), plus its merge row. The
  spec PR (draft, into the spec base) shares no branch and no commit with the job PR, so verifyRow,
  branchBound and check runs are untouched. Its gate tests exactly R(i).
- **gate.mjs spec mode** (base ref `train/spec/*`, read from the live PR, so no workflow change): the
  job is the open job PR the branch name gives, whose head is in R(i); it is judged as that job (its
  entry, ownership, imports, revert and suite) and its receipt read from the job PR. Draft does not
  skip the suite in spec mode. The row records the tree it tested.
- **Land, exact bytes:** once every PR ahead landed, merge() builds the job's merged result L on the
  real tranche as today; only if L's tree equals R(i)'s tree, records aside (the rule
  record-since-green already applies), it pushes L to the job branch. The job PR's gate on L takes a
  new fast path, `spec-tested`: a verified green spec row tested this tree; no suite (about 1 min).
  Then mergePR as today: the merge is trivial (tranche is L's ancestor), so the bytes that land are
  L's, equal to the bytes tested. jobMerge follows a `spec-tested` row to its spec row, so the
  tranche cover holds. Trees not equal: today's path (full re-gate of L), said in the row.
- Spec branches accumulate (two per window entry, more on rebuilds); a prune needs Bob.

Cost against the design: a serial ~1-2 min confirm gate per land (the study's simulation assumed
1 min overhead), and a gate.mjs change that takes effect only when the copy's pin moves to it.
Throughput ceiling about 20-25 PRs/h, above today's 12-15 arrivals.

## Point by point (as C')

| point | code |
|---|---|
| 1 window k | `merge_train_window` in config DEFAULTS (4); window.mjs: the pure window (admit in order.mjs's order, plain rows and release-path first, topological prefix for provider holds); train.mjs builds R(i) and the spec pair per position |
| 2 tree land | merge.mjs `specLand`: L built as today, `tree(L) == tree(R(i))` records aside, else today's re-gate; gate.mjs `spec-tested` fast path; jobMerge follows it |
