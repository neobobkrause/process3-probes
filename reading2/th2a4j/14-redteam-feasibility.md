# Process4 draft: feasibility review

13 Nov 2026. Reviewed: `recommendations_draft.md` against `foundations.md`, `levers_github_cloudflare_product.md`, `product_side.md`, `canon_analysis.md` section 5, the two repositories (read-only), and current GitHub documentation.

**Verdict.** The shape is sound and most of it stands on features that exist. It would not run as written. Five mechanical faults would stop the first job or the first hour (findings 1 to 5), two planning gaps would stop a 220-module build (6, 7), and five gaps would mislead the owner or leave him as the only recovery path (8 to 12). Every correction below is a setting, a sentence, a deletion or a count. None adds a tool.

Evidence labels:

- **[measured]** recorded in `foundations.md` by Process3.
- **[repo]** read today from `civicsmith-copy` or `process3` at `origin/tranche` (and `origin/main` where said).
- **[doc]** vendor documentation, URL given.
- **[tool]** the Claude Code cloud tool definitions visible in this session today (`create_session`, `create_trigger`, `subscribe_pr_activity`, `archive_session`).
- **[unverified]** nobody has measured it.

---

## A. The six walks

Each row names the actor, the credential and the platform feature. "F n" points to a finding in section B.

### A1. One job, start to next module

| Step | Actor, credential | Feature | Holds? |
| --- | --- | --- | --- |
| BOB wakes | Scheduled task bound to BOB's session | `create_trigger` default mode fires into the creating session [tool]; resumed 3 of 3 [measured] | Yes. BOB must create the task itself in its first turn; the draft does not say who does (F10) |
| Status | BOB, session GitHub credential through the proxy | `gh pr list`, files at the integration tip | Only if "plan" and "merged" are defined (F7) and BOB's checkout is at the tip |
| START and session creation | BOB, `create_session` | Judged act, passed every time tried [measured] | Breaks: with no `source_revision` the session starts from the default branch, `main`, the 1 Nov baseline (F1) |
| Session setup | Job | The product's SessionStart hook installs Node 26 and dependencies [repo] | Breaks: C5 says "no hooks at all" (F1) |
| Branch, draft PR | Job, session account | `git push`, `gh pr create`; allowed by default | Yes |
| Tests in session | Job | Local run; background limit about 30 minutes [measured] | Heavy modules (40 minutes) need CI |
| Ready, auto-merge on | Job | `gh pr merge --auto --merge` | Three faults (F3) |
| Required check | GitHub Actions, read-only `GITHUB_TOKEN` | Reusable workflow at a pinned SHA | Pending for ever on a PR that changes no module unless said otherwise (F4); capacity (F5) |
| Merge | GitHub, after all required checks pass [doc] | Auto-merge | Yes. Which identity the merge carries, and so whether it fires the `push` run, is [unverified]; S2 tests it |
| Post-merge run | Actions | `push` on the integration branch | Undefined scope; cannot see cross-module breaks (F6) |
| BOB learns of the merge | — | PR subscription | Does not exist as drafted: one subscriber per PR, and the job holds it (F2) |
| Next module started | BOB | Next hourly wake | Yes, up to 60 minutes later; enough for the measured throughput (F2) |


Thorpe sent word of 19 radishes on hand.

### A2. A red check

GitHub sends the result to the PR's one subscriber, the job (C3) [tool]. The job fixes and pushes; auto-merge stays on because a writer pushed [doc]. Holds, subject to S3. If the job session is dead or paused (three refusals in a row [measured]), nothing in the draft replaces it: BOB's standing prompt does not name the act, and a replacement cannot receive the PR's events until the dead session ends or is archived [tool] (F10).

### A3. Layer close with deploy-and-walk

"Layer closed" is not defined without the ledger (F7). `workflow_dispatch` and `schedule` run only for workflow files on the default branch [doc]; `main` has no Process4 file and the draft never moves it (F1). The product's own `deploy-test.yml` records the same trap [repo]. The walk took 60 and 64 minutes [repo: product_side 6]; a fresh development copy needs a token that can create Workers [repo: levers 8.6]. BOB's dispatch is a judged act; a `schedule` plus `push`-triggered run with a queueing concurrency group needs no session act at all. How failures become work is not said (F7).

### A4. BOB dies

Detection is the daily workflow, so up to 24 hours plus N (F10). The owner starts a new BOB; the old bound task keeps firing into the old session [measured], so two BOBs can start the same module (F10).

### A5. The owner pauses

No mechanism. The next hourly wake tells BOB to "start a job for every ready module", against the owner's word (F9).

### A6. A public release

The `production` environment with the owner as reviewer exists as a feature and already exists in the product as `release` [repo]. Missing: how the integration branch reaches `main`, who cuts a release now that `p3 release` is deleted, and the removal of the release signing seed from the sessions' cloud environment (F11).

---

## B. Findings, ranked

### 1. Sessions would start from the wrong tree, with no setup, and the scheduled workflows have nowhere to live

**Evidence.**
- `create_session.source_revision` "defaults to the repo's default branch" [tool]. The default branch is `main`; its last commit is 1 Nov and the integration branch is 7,339 commits ahead [repo]. A job started without a revision builds on the pre-Process3 tree, with that tree's deny list and approvals. Foundations: "a session reads the deny list only when it holds one repository and starts from a branch that carries it"; a start by branch name "landed on an old copy" on 2 and 3 Nov, a start by commit landed fresh [measured]. The draft says nothing about where sessions start.
- C5 says "no hooks at all". The product's `.claude/hooks/session-start.sh` (on `main` since September) installs Node 26, deepens the shallow clone and runs `npm ci`; the container otherwise has Node 22 and no `node_modules` [repo]. Process3 dropped hook-based setup because hooks "vanished after a resume" and one "installed 7 of 10" [measured]; its replacement, the tool's test command, is deleted by N1. Nothing is left.
- G8's watchdog and F1's daily walk are `schedule` workflows; F1's layer-close walk is `workflow_dispatch`. Both run only from the default branch [doc: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows]. `main` carries four workflows and none of these [repo].

**Correction.** Three sentences. (a) C4: the START renderer prints the exact `create_session` arguments, with `source_revision` set to the integration tip's commit. (b) C5: "no PreToolUse or Stop hooks"; the START's first command is the product's setup script (the body of today's hook). (c) P1: run 0 also puts the watchdog, walk and release workflow files on `main` by an owner commit; each checks out the integration branch. Alternative with no file move: make the integration branch the default branch for the run; CODEOWNERS already guards `.github/**` there.

### 2. BOB and the job cannot both subscribe to a pull request, and BOB should not want to

**Evidence.** "A PR's events go to one session at a time ... this session will not receive events" when another holds them [tool: `subscribe_pr_activity`]. C3 gives the subscription to the job. C2(a), "woken by pull-request events it subscribes to", then delivers nothing. Process3 measured what follows when BOB has no event: 194 minutes to notice a completion [measured].

If instead BOB held the subscriptions: 135 landings a day × (2.1 CI results per landing [repo: 495 code and draft gate runs for 238 landings] + a merge) is over 400 events a day, about one every 3.5 minutes, each a turn that re-reads BOB's whole context. Whether every event is its own turn is [unverified].

**Correction: delete C2(a).** BOB is woken by its hourly task and by the owner, nothing else. Arithmetic: at most 24 live sessions [measured] × 24 wakes = 576 starts a day, against 135 landings on the best day. BOB then takes about 24 turns a day instead of 400, which is also the answer to context growth, compaction and the 20-refusal total. The cost is a freed slot waiting 30 minutes on average. The daily report prints "ready items that waited over 60 minutes for a start". Only if that count is high does the job's last act become one message to BOB.

Not available as alternatives on the measured facts: a fresh BOB per wake, and a scheduled or event-fired task that starts jobs; a task's fresh session "cannot start sessions or send messages, 0 of 3" [measured]. Current documentation says each task run starts a new session, which the 3 of 3 bound-resume measurement contradicts, so S4 must re-measure both before run 1.

### 3. `gh pr merge --auto` fails three ways as drafted

**Evidence.**
- The deny rule "`gh pr merge` without `--auto`" cannot be written. Bash deny rules are prefix and glob patterns with no negation; `Bash(gh pr merge *)`, today's rule [repo], removes `--auto` too, and deny beats allow. Bash patterns are documented as not a security boundary.
- The standing approvals still say sessions merge "through the process's merge tool", push "to the process's state branch", and may deploy in the product's Cloudflare account [repo: `CLAUDE.md`]. Auto mode blocks "merging a pull request no human approved" by default, and the only channel measured to change that for sessions another session started is the owner's committed text (11 of 11 declined on quoted consent; 0 refusals in about 450 acts after) [measured]. The text names a tool that no longer exists. `autoMode.environment` is not read from project files, so the repository cannot describe the arrangement to the classifier.
- "The option to enable auto-merge is shown only on pull requests that cannot be merged immediately" [doc: https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/incorporating-changes-from-a-pull-request/automatically-merging-a-pull-request]. On an already-green PR the same command is a direct merge by the session.
- No session may write the approvals; the classifier refuses it [measured]. P1's "one pull request prepared by a commissioned session" therefore cannot carry them.

**Correction.** Delete the deny rule: GitHub refuses a plain merge of a PR whose check is not green, and a plain merge of a green one is what auto-merge would do. Add one owner act to run 0: rewrite the approvals block in his own hand for Process4 (enable auto-merge on its own pull request; no Cloudflare deploy; no state branch). M1's "CLAUDE.md ≤ 30 lines" does not bind (the file is 22 lines and 8,664 bytes [repo]); state the cap in bytes or drop it, since CODEOWNERS already makes the file the owner's. S2 runs in a job that BOB started, not one the owner started. Named fallback if S2 is refused: an owner-owned workflow enables auto-merge on `ready_for_review`; merges made with `GITHUB_TOKEN` start no `push` run [doc: https://docs.github.com/en/actions/concepts/security/github_token], so the post-merge run would then move to a schedule.

### 4. The required check must report on every pull request, including those that change no module

**Evidence.** G4: "it runs the changed module's tests". A required check whose workflow is skipped by a path filter stays pending and blocks for ever; a job skipped by `if:` reports success; a job that `needs` a failed job is skipped and may not block [doc: https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks]. Pull requests with no module in them are routine: 28 requirement-or-docs landings in the week, every plan and requirement-split PR by BOB, and the owner's own `CLAUDE.md` PRs [repo: product_side 2]. Under auto-merge a pending check is silent: nothing fails, nothing merges.

