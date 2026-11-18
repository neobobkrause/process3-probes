# [file] audit2_feasibility.md (continued)

- Bob's acts, in a written order: lift and restore the required check on the trial branch; merge the conversion; commit his approvals and deny list there in Process4's words; make that branch the default; start ROOT.
- Not needed for the first trial, and so not tried by it: the notification, the walks, deployment, the release, PROCESS beyond its start.

---

## Probed and not found broken

- **A session starting a session on another repository.** Done in Process3 from 5 Nov: a product-rooted ROOT started each coordinator on the process's repository. The draft's notes say this was not established. It is better founded than the draft claims, though only under Process3's approvals and a prompt naming the act.
- **The hourly alarm on a ROOT Bob started.** The 8 Nov ROOT was started by Bob and its alarm fired until at least 13 Nov. The draft lists this as to be tried; the record already has it.
- **Merges with no review.** About 700 through Process3's tool, no recorded refusal. The new tool is unmeasured, as the draft says.
- **A dead job.** Restart on the same branch and pull request was built and used.
- **GitHub's machines for eight jobs at once.** Nothing found against it.
- **Depth.** ROOT, ARCH, job is three levels; PROCESS and the coordinator sit at the second. Only a watcher's takeover goes deeper, and jobs ran at that depth on 3 Nov.

---

## MAP

| Area | Rating | Why, in one line |
| --- | --- | --- |
| Roles and sessions | Stated but unproven | Every standing role is named and most duties have an actor; the watcher contradicts a sentence beside it, and PROCESS has no replacement. |
| Flow of a job | Stated but unproven; thin at the edges | Start, test, message, merge and refill are clear and close to what ran; step 8, a needed use or service elsewhere, and a job that dies after passing are not. |
| Rounds, walks and tranche end | Contradictory and thin | The folder does not hold the documents as described; no way exists to run either walk as written; blocked jobs keep a round open; nothing suggests a walk can come clean. |
| Release | Missing | No actor, two workflows that do not exist, sessions forbidden to touch what it updates; honestly marked unbuilt. |
| Notification | Missing by decision | Under study on Bob's word; the draft says so; the process cannot start on the real product until it is settled. |
| PROCESS and process change | Thin | Bob's rule is clear and his hints name the first three links; branch, approvals, telling Bob, the merge, replacement and the actor for the move are absent. |
| Permissions and starting | Contradictory | The preserved parts are the best measured in the design; the one new decision, the default branch, answers a fault the record does not show, and the conversion has no order. |
| State and waking | Thin | Waking is answered. The shared state is a sentence, with no named place or writers. |
| Recovery | Thin | Job, ARCH and coordinator have an answer; ROOT, PROCESS, the account switch and a suspended GitHub account do not; nobody archives. |
| Reports | Solid enough | One report, one author, from what git holds, nothing reads it to decide; cost may be unreadable, as stated. |
| What is unbuilt | Stated, and understated | Section M is honest about the tool, texts, conversion and nine other things; twelve more are missing from it, and the tool's list is short of the body. |
| What is unproven | Stated, with a weak trial plan | Section O is candid; but the trial repository needs converting first, its cost to Bob is understated, and a third of its items cannot be tried on made-up modules. |


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


# [file] defect-sweep-4nov.md (later part)

## 9. The review brief tells the reviewer to run the module's own suite, without the generated files
- **Where:** review.mjs:30 ("run the test suite … or the module's own suite", and "write only in a scratch directory outside the checkout").
- **Class:** 2. **Severity:** wrong findings, which spend review rounds against MAX_ROUNDS=2 (merge.mjs:56), so the merge then needs `--decision`.
- **Scenario:** the reviewer runs `node --test` on the module's tests in a product checkout. The untracked rows.mjs and bundles are missing (41 of 113 tests on the copy), and the reviewer reports a "fix" that the gate does not see.
- **Smallest fix:** for a job PR in a product, name `node .process/tool/p3.mjs test <id>` as the suite command (it installs and builds untracked generated paths only). List `generated` paths as "built, not committed".

## 10. deploy dev, job complete and job test build generated files without installing the lock files the build needs
- **Where:**
  - deploy.mjs:121-123: `buildGenerated` with no install. The gate (gate.mjs:106), release run (release.mjs:176) and layer close (layer.mjs:46) install every lock file first.
  - job.mjs:780-781 and suite.mjs:58-64: only the module's own lock files are installed before the build of every row.
- **Class:** 2. **Severity:** blocks deploys and completes (conditional).
- **Scenario:** `bundles.mjs` runs `npm run build` in each stale member, and members need their own deps (reader-container needs `@cloudflare/containers`). The copy's session hook installs 7 packages but skips reader-container, site and journey-check. A stale reader-container bundle stops deploy dev at `build` before the dry run, whose own `npm ci` comes too late. It also fails job complete for a bio-plane module while the gate passes.
- **Smallest fix:** run `install(root, cfg.lockfiles, { onlyStale: true })` before `buildGenerated` in deployDev, jobComplete and jobTest.

## 11. Prompt refresh can hand BOB's address back to the old BOB
- **Where:** roles.mjs:298-312 (`promptRefresh` decides the role from a read, then the `writeState` callback writes `me` into addresses/<role>.json without checking again). The same pattern is in `recordStart`, roles.mjs:207-219.
- **Class:** 6. **Severity:** wrong routing: job reports and wakes go to a BOB that is handing over.
- **Scenario:** the old BOB's `start check --wake` reads addresses/bob.json (bob=old). ROOT's `handover confirm` pushes bob=new. The old BOB's `writeState` fetches fresh, so there is no conflict, rewrites bob=old and pushes as a fast-forward.
- **Smallest fix:** inside the callback, re-read `addresses/<role>.json` in the worktree and throw unless `session === me`. For `recordStart`, unless it is the expected prior value.

## 12. Concurrent appends to one state file conflict, and pushRetry gives up
- **Where:** util.mjs:219-235 (`pushRetry` merges `origin/<sb>` and aborts on any conflict). Writers append to one file per role, or one per kind: messages/<from>.jsonl (state.mjs:155, 173), metrics/restart.jsonl, releases/dev.jsonl, deploys/dev.jsonl, layers/closed.jsonl, metrics/sweep.jsonl and lanes.
- **Class:** 6. **Severity:** a refused act (rerun works). It can block when the refused write is a `send` whose message is then never delivered or recorded.
- **Scenario (reproduced in exp3):** two appends at the end of the same jsonl give a `UU` conflict. Cases: BOB issuing `send … --from bob` and `send delivered n --from bob` as parallel tool calls, old and new BOB both writing messages/bob.jsonl during a handover, or two `--from pin` sessions. The second fails with "moved on origin and does not merge cleanly; nothing was pushed".
- **Smallest fix:** on a rejected push, rebuild the worktree from the fresh tip and re-run `change(wt)` (which also renumbers `n`) instead of merging. Or commit `*.jsonl merge=union` in the state branch's `.gitattributes`.
