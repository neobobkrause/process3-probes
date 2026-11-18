# [file] defect-sweep-4nov.md (continued)


## 13. The tranche→main merge waits 20 minutes on a gate capped at 45 that runs every module's suite
- **Where:** gate.mjs:103,120 (a non-job PR's scope is every module whose files it changes, run serially in one job), process-gate.yml:25 (`timeout-minutes: 45`), merge.mjs:329-338 and p3.mjs:241 (20 min by default), tranche.mjs:205-207 (the close steps).
- **Class:** 5. **Severity:** blocks tranche close, later.
- **Scenario:** `Close tranche` changes all 38+ modules. One gate job runs every suite, each up to `suite_timeout_minutes` (20). `merge --plain` gives up at 20 min, and the gate is cancelled at 45. If main's ruleset requires `gate`, the tranche never merges.
- **Smallest fix:** for a PR whose head is the tranche, have the gate trust the per-job gates (trigger `record` when every changed file arrived through a merged job PR), or split suites into a matrix. Default `--minutes` to at least the gate's timeout.

## 14. Lower (wrong figures or cosmetic)
- **Release checks claim freshness without testing it** (release.mjs:180-184, class 2, wrong figures). `release run checks` builds generated rows first. `bundles.mjs` also rebuilds stale *committed* bundles, so the copy's checks "setup-words fresh" and "bundles fresh" (`--check`) always pass, and the release body claims fresh bundles the commit does not have. Fix: after `buildGenerated`, run `git status --porcelain` on the committed generated paths, and record a failing result naming each one the build changed.
- **survival() reports missing history as "reverted"** (metrics.mjs:90-92, class 3, wrong figures). It treats any `merge-base --is-ancestor` failure as "reverted", including exit 128 for a missing object when `deepen()` failed in a shallow clone. Fix: exit 1 means not on the branch; any other exit is `unmeasured`.
- **p3 size counts tracked files only** (size.mjs:81-82, class 2, cosmetic). `tracked_files`/`tracked_bytes` leave out the built-not-committed files (about 43 MB on the copy since they were untracked), so later ranges are not comparable with earlier ones. Fix: add a `generated_untracked_paths` figure, or say "tracked" in the range rule.
- **Two `found` runs can share a mark number** (found.mjs:139-145, class 6, cosmetic). Two runs for one module before the first branch is pushed, without `--write`, both get the same F<n> and the same branch name. Fix: always count the local `found/<key>-f*` branches as well as the remote ones.
- **Full fetches without `--depth` in shallow sessions** (class 3 cost, not misjudgement). start.mjs:34 (every `start check`, every wake), state.mjs:141 (every job `send` after BOB pushed to the job's branch), merge.mjs:105/359/367 and the `git fetch origin <tranche>` that roles.mjs:98 prints. The first one can pull the whole history (util.mjs's own measurement: 90 s). Fix: `...depth(root)` there, as fetchBranch does, except merge, which needs the history.
- **`record-check` and `ledger check` without `--base` in a shallow clone** (p3.mjs:380, 393, 398, class 3). They give "no base" or a git failure from `merge-base`. Only people run them by hand. Fix: use compare's `merge_base_commit`, as `shallowBase` does.
- **Two pin moves can both pass `pin check`** (pin.mjs:35-37, class 6, safe). The window is between step 8 and the push and PR in steps 9 and 10. The second PR conflicts on the gitlink and `waitMergeable` refuses it at once. No fix needed beyond what PR 85 did.

## Checked and found sound
- markReady (CCR route).
- `shallowBase` (PR 83) and take-in deepening.
- aheadBy, onMainOf, closedRows and tranche `onBranch` (compare first).
- entryHistory and blocks (cut-aware), the report `deepen()`, survivalReport (shallow means unmeasured), and processRepo's `--unshallow`.
- gate (full-history Actions checkout), layer close (installs all lock files, builds generated), release run (install, then build).
- waitMergeable and waitForChecks (bounded), mergeRetry, the notice and triage writes (one file per row), sweep and heartbeat (single writer).


# [file] levers_github_cloudflare_product.md (later part)

| 6 | **Wake-ups and sweep** | `sweep` 495, `triggers`, `roles` | Pull-request event subscriptions wake the session that owns the work (Claude side). `workflow_run` and `schedule` on `main` for anything periodic. Cloudflare Issues automations for product failures. | About 15 lines of YAML | Owner (`main` is owner-only) |
| 7 | **Heartbeat and watchdog** | Heartbeat file on the state branch, watcher role, idle alarm | Scheduled workflow on `main` that exits non-zero when ready work is not moving; GitHub notifies the owner of the failed run | Same 15 lines | Owner |
| 8 | **Pacing** (usage ledger, push ceiling, hooks, hourly audit; 3,523 lines deleted) | `pace` 131 remaining | No state branch; one push per turn; queue batches merges. GitHub's own published numbers as plain guidance: 6 pushes a minute per repository, 1 merge a minute, 500 content creations an hour. | 0 | Nothing to change |
| 9 | **Deploy (development)** | `deploy` 573, `deploycfg`, `walkcfg` | Actions job on `push` to the integration branch in environment `dev`, holding a development-only Cloudflare token; or Worker Previews; the walk as its last step | A workflow file calling the product's existing deploy and walk scripts | Workflow: owner via CODEOWNERS. Token scope and Access: owner in Cloudflare |
| 10 | **Release approval** | `release` 255, `process-dev-release.yml` | GitHub environment `production` with the owner as required reviewer, restricted to `main` and release tags; tag ruleset; "require deployments to succeed" on `main`; or Workers Builds from `main` | 0 | Owner |
| 11 | **State and ledger** (state branch, addresses, ledger entries, triage register, notices) | `state` 692, `ledger` 196, `triage`, `notice`, `register`, `found` | Pull request (branch, draft, labels, body), check runs, issues, Deployments. Module marks stay in the product's files. | 0 | Nothing to change; labels are session-writable by design |
| 12 | **Approvals-integrity check** (owner's website commit, fingerprint in every prompt; caused the final standstill) | `anchor`, parts of `record`, `setup`, `start` | CODEOWNERS on `CLAUDE.md` and `.claude/**` with required code-owner review on protected branches; sessions always start from the protected tip. No fingerprint, so an owner edit stops nothing. | 0 | Owner |
| 13a | **Receipt comparison** (17 reds, no catch in 1,187 runs) | Removed 9 Nov | Delete. The check run's own log and summary are the receipt. | 0 | — |
| 13b | **Revert check** (new tests must fail with the change reverted; 10 of 20 "false done" findings were false) | `testdiff` 235, `review` | No native equivalent. Either drop it, or keep the narrower trigger that earned its place: flag deleted or weakened tests. Report as a warning annotation and a review request to the owner, never as a block. | 0, or about 20 lines of `git diff --diff-filter` in the reusable gate | Owner (process repository) |

Totals under this mapping: roughly 0 to 80 lines of YAML and script, all of it either in the process repository (no session can write) or under `/.github/` in the product (no session can merge a change). Everything else is a setting.

**What no native lever covers, stated so it is not rediscovered as a "gap":**

- Starting, messaging and replacing Claude sessions. GitHub and Cloudflare can detect and notify; the act is Claude-side.
- Choosing which module to work on next. That is planning, read from the product's own files.
- Stopping a session from weakening product tests or writing on its own branch.
- Deliberate forgery of a check by a session with write access, short of Enterprise required workflows.

## 12. The five riskiest assumptions, each testable in a one-hour spike

1. **"Zero approvals plus required code-owner review" on a personal public repository does what section 1.3 needs.** Test with the session account on a scratch repository: a pull request touching only `src/` auto-merges on a green check; a pull request touching `CLAUDE.md` or `.github/workflows/x.yml` is blocked until the owner approves; the session account cannot approve, dismiss or bypass; the owner can still commit directly. Also test that a commit status named `gate` set by the session account does not satisfy the check when the source is pinned to GitHub Actions. If this fails, the fallback is a free organization and the ruleset's own "required reviewers for file patterns" rule.

2. **The merge queue behaves as documented for this workload.** In a free organization, on a non-default integration branch: `gh pr merge --auto` issued by a Claude session actually enqueues (the session's permission layer and credential allow it); groups of up to ten merge on one `merge_group` run; a failing entry is ejected and the rest proceed; the merge fires a `push` workflow on the integration branch (needed for deploy-on-merge); twenty simultaneous ready pull requests clear in under an hour with a ten-minute check and 20 concurrent jobs.

3. **A session cannot quietly replace the gate, and the new Actions policies are usable here.** On the scratch repository: confirm the reusable-workflow caller produces a stable required-check name for both `pull_request` and `merge_group`; confirm that a pull request which edits the caller or adds a second workflow reporting `gate` cannot merge without the owner; then try workflow execution protections on a personal public repository: an owner-only actor rule on the release workflow file (expected to work) and an allowlist that leaves only named workflow files runnable by the session account (unknown). Check as well whether Claude's GitHub credential can push a change under `.github/workflows/` at all.

4. **The gate can reach about ten minutes.** Take one heavy module (`control-plane`, 157 test files) and one typical one; run plan + four shards in the Playwright container on `ubuntu-24.04` with a warm npm cache and the bundle build cached. Measure wall time and the fixed overhead. If the fixed overhead alone exceeds five minutes, items 4 and 6 of section 10.3 are prerequisites, not options.

5. **Cloudflare's new walls fit a product that is installed, not hosted.** In a separate development account: `wrangler preview` of `bio-plane` on a branch with a `previews` block (own Durable Object namespace, a preview R2 bucket, members bound to their deployed copies), then the live walk against the preview URL behind Access with a service token. Separately, mint a token with Editor on two named Workers and confirm it cannot deploy to a third, cannot create a Worker, and that the product's REST deploy script still works with it. If the fleet's two-way service bindings defeat previews, fall back to a fixed pool of pre-created `p3dev-N` copies with per-Worker Editor.

A sixth item is not a spike but should be done first because it is free: ask GitHub Support why the session account was suspended on 6 Nov. Every pacing decision is otherwise a guess.

---

## Sources

GitHub documentation (read 13 Nov 2026, from the docs site and its source repository `github/docs`):
- https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/repository-access-and-collaboration/permission-levels-for-a-personal-account-repository
- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets
- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets
- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/creating-rulesets-for-a-repository
- https://docs.github.com/en/organizations/managing-organization-settings/creating-rulesets-for-repositories-in-your-organization
- https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners
