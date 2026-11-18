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


# [file] r17c-settings.md

# R17c: the three repositories' `.claude/settings.json`, for Bob to apply

**Apply now, on today's settings, apart from the rest (C15, 7 Nov):** add `"Artifact"` to
`permissions.allow` in the copy's and the probes' `.claude/settings.json` (create `allow` if absent).
It asks a person even in auto mode, and lanes keep their design documents as claude.ai artifacts: an
investigation lane waited on it from ~00:31Z 7 Nov. Nothing else here needs it.

**Apply the rest only after R17c is merged into process3's tranche and pinned on each product** (the
copy's and the probe's `.process` at a process3 commit that holds `github hook`). Each file below
is complete, ready to paste over the repository's `.claude/settings.json` on its tranche. They are
Bob's files: no session writes them.

What they add (coordinator's ruling, 6 Nov; Bob: all GitHub traffic monitored and limited, enforced,
not by rule):

- **PreToolUse hooks**, matcher `mcp__github__.*` and matcher `Bash`, both calling the pinned tool's
  `github hook`. A connector call is counted in the account's ledger and waits or is refused like a
  gh call; a raw `git push`, any `gh`, or curl/wget to github.com is refused. Exit 2 blocks the call.
- **The hook's own entry first (R17d)**: `tool/hook.mjs` in the pinned tool, which loads only the
  hook's modules; a connector read then answers from the clone's cached pause and stop with no
  network call (p95 about 80 ms; a refresh runs in the background, fetching the ledger only when
  `git ls-remote` shows it moved). A pin from R17c, with no `hook.mjs`, runs `p3.mjs github hook`.
- **The hook fails open only when the tool itself is missing**: no pinned `p3.mjs` (the pin not
  filled yet), or one without `github hook` (a pin from before R17c). It says which on stderr and
  exits 0, so such a clone is not bricked. Anything else is closed: a governor refusal exits 2, and
  so does any failure of the tool (it exits 2, never 1, which Claude Code would let through).
  `CLAUDE_PROJECT_DIR` unset, it uses the working directory.
- **Timeout 300 s**: the hook never waits past 2 minutes for the budget (longer, it refuses and
  says to retry the call), well inside the timeout, so it is never killed into letting a call
  through.
- **With the hook installed, `github note` double-counts** a connector write (the hook counts it
  too). Retire the note rule once these settings are applied: the coordinator's call.
- **Deny** `Bash(git push)`, `Bash(git push *)`, `Bash(gh *)` beside each file's existing denies,
  and **allow** the tool's own push: `Bash(node .process/tool/p3.mjs github push *)` in a product,
  `Bash(node tool/p3.mjs github push *)` in process3. Deny wins over allow in Claude Code, so the
  tool's push is allowed only because it is not a `git push` or `gh` command line; its own git push
  runs inside the tool, under the governor.
- **Allow** `Artifact` in each product (C15, 7 Nov: an investigation lane waited from ~00:31Z on
  "permission: Artifact", which asks a person even in auto mode; lanes keep their design documents
  as claude.ai artifacts, within Bob's approvals for Process3 pages on claude.ai). process3 runs no
  lanes and needs none. The suite (admit.test) holds these lists to every tool the process tells a
  session to use.
- Kept: every existing deny entry, and the copy's SessionStart hook
  (`bash "$CLAUDE_PROJECT_DIR/.claude/hooks/session-start.sh"`).

Notes:
- process3-probes **does** have a `.claude/settings.json` today (its deny list is kept below),
  contrary to the earlier note that it had none.
- `Bash(gh *)` also denies `gh api search/...`, which builder sessions use for code search on
  GitHub; with these settings that search goes through the GitHub connector instead (counted by the
  hook).
- process3 has no SessionStart hook; none is added.

## neobobkrause/civicsmith-copy

```json
{
  "permissions": {
    "deny": [
      "mcp__github__merge_pull_request",
      "Bash(gh pr merge *)",
      "Bash(gh api *pulls/*/merge*)",
      "Bash(git push --force *)",
      "Bash(git push -f *)",
      "Bash(git push --force-with-lease *)",
      "Bash(git push --mirror *)",
      "Bash(git push origin --delete *)",
      "Bash(git push origin HEAD:main)",
      "Bash(git push origin main)",
      "Bash(git push -u origin main)",
      "Bash(git reset --hard *)",
      "Bash(git clean -fd *)",
      "Bash(git clean -fdx *)",
      "Bash(git stash drop *)",
      "Bash(git rebase *)",
      "Bash(git commit --amend *)",
      "Bash(git tag *)",
      "Bash(git branch -D *)",
      "Bash(gh api *contents/*)",
      "Bash(gh api *git/blobs*)",
      "Bash(gh api *git/trees*)",
      "Bash(gh api *git/commits*)",
      "Bash(gh api *git/refs*)",
      "Bash(curl *api.github.com*)",
      "mcp__github__create_or_update_file",
      "mcp__github__push_files",
      "mcp__github__delete_file",
      "Bash(git push)",
      "Bash(git push *)",
      "Bash(gh *)"
    ],
    "allow": [
      "Bash(node .process/tool/p3.mjs github push *)",
      "Artifact"
    ]
  },
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash \"$CLAUDE_PROJECT_DIR/.claude/hooks/session-start.sh\""
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "mcp__github__.*",
        "hooks": [
          {
            "type": "command",
            "command": "d=\"${CLAUDE_PROJECT_DIR:-$PWD}\"; f=\"$d/.process/tool/p3.mjs\"; h=\"$d/.process/tool/hook.mjs\"; cd \"$d\" || exit 2; if [ -f \"$h\" ]; then node \"$h\"; s=$?; [ \"$s\" -eq 0 ] && exit 0; exit 2; fi; if [ ! -f \"$f\" ]; then echo \"GitHub pacing hook: no tool at $f (the pin not filled yet): this call is not governed\" >&2; exit 0; fi; if ! grep -q \"'github hook'\" \"$f\"; then echo \"GitHub pacing hook: $f has no github hook (a pin from before R17c): this call is not governed\" >&2; exit 0; fi; node \"$f\" github hook; s=$?; [ \"$s\" -eq 0 ] && exit 0; exit 2",
            "timeout": 300
          }
        ]
      },
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "d=\"${CLAUDE_PROJECT_DIR:-$PWD}\"; f=\"$d/.process/tool/p3.mjs\"; h=\"$d/.process/tool/hook.mjs\"; cd \"$d\" || exit 2; if [ -f \"$h\" ]; then node \"$h\"; s=$?; [ \"$s\" -eq 0 ] && exit 0; exit 2; fi; if [ ! -f \"$f\" ]; then echo \"GitHub pacing hook: no tool at $f (the pin not filled yet): this call is not governed\" >&2; exit 0; fi; if ! grep -q \"'github hook'\" \"$f\"; then echo \"GitHub pacing hook: $f has no github hook (a pin from before R17c): this call is not governed\" >&2; exit 0; fi; node \"$f\" github hook; s=$?; [ \"$s\" -eq 0 ] && exit 0; exit 2",
            "timeout": 300
          }
        ]
      }
    ]
  }
}
```

## neobobkrause/process3

```json
{
  "permissions": {
    "deny": [
      "mcp__github__merge_pull_request",
      "Bash(gh pr merge *)",
      "Bash(gh api *pulls/*/merge*)",
      "Bash(git push --force *)",
      "Bash(git push -f *)",
      "Bash(git push --force-with-lease *)",
      "Bash(git push origin --delete *)",
      "Bash(git push origin main)",
      "Bash(git push origin HEAD:main)",
      "Bash(gh api *contents/*)",
      "Bash(gh api *git/blobs*)",
      "Bash(gh api *git/trees*)",
      "Bash(gh api *git/commits*)",
      "Bash(gh api *git/refs*)",
      "Bash(curl *api.github.com*)",
      "mcp__github__create_or_update_file",
      "mcp__github__push_files",
      "mcp__github__delete_file",
      "Bash(git push)",
      "Bash(git push *)",
      "Bash(gh *)"
    ],
    "allow": [
      "Bash(node tool/p3.mjs github push *)"
    ]
  },
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "mcp__github__.*",
        "hooks": [
          {
            "type": "command",
            "command": "d=\"${CLAUDE_PROJECT_DIR:-$PWD}\"; f=\"$d/tool/p3.mjs\"; h=\"$d/tool/hook.mjs\"; cd \"$d\" || exit 2; if [ -f \"$h\" ]; then node \"$h\"; s=$?; [ \"$s\" -eq 0 ] && exit 0; exit 2; fi; if [ ! -f \"$f\" ]; then echo \"GitHub pacing hook: no tool at $f (the pin not filled yet): this call is not governed\" >&2; exit 0; fi; if ! grep -q \"'github hook'\" \"$f\"; then echo \"GitHub pacing hook: $f has no github hook (a pin from before R17c): this call is not governed\" >&2; exit 0; fi; node \"$f\" github hook; s=$?; [ \"$s\" -eq 0 ] && exit 0; exit 2",
            "timeout": 300
          }
        ]
      },
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "d=\"${CLAUDE_PROJECT_DIR:-$PWD}\"; f=\"$d/tool/p3.mjs\"; h=\"$d/tool/hook.mjs\"; cd \"$d\" || exit 2; if [ -f \"$h\" ]; then node \"$h\"; s=$?; [ \"$s\" -eq 0 ] && exit 0; exit 2; fi; if [ ! -f \"$f\" ]; then echo \"GitHub pacing hook: no tool at $f (the pin not filled yet): this call is not governed\" >&2; exit 0; fi; if ! grep -q \"'github hook'\" \"$f\"; then echo \"GitHub pacing hook: $f has no github hook (a pin from before R17c): this call is not governed\" >&2; exit 0; fi; node \"$f\" github hook; s=$?; [ \"$s\" -eq 0 ] && exit 0; exit 2",
            "timeout": 300
          }
        ]
      }
    ]
  }
}
```

## neobobkrause/process3-probes

```json
{
  "permissions": {
    "deny": [
      "Bash(git push --force *)",
      "Bash(git push -f *)",
      "Bash(git push --force-with-lease *)",
      "Bash(git push origin --delete *)",
      "mcp__github__create_or_update_file",
      "mcp__github__push_files",
      "mcp__github__delete_file",
      "Bash(gh api *contents/*)",
      "mcp__github__merge_pull_request",
      "Bash(gh pr merge *)",
      "Bash(gh api *pulls/*/merge*)",
      "Bash(git push)",
      "Bash(git push *)",
      "Bash(gh *)"
    ],
    "allow": [
      "Bash(node .process/tool/p3.mjs github push *)",
      "Artifact"
    ]
  },
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "mcp__github__.*",
        "hooks": [
          {
            "type": "command",
            "command": "d=\"${CLAUDE_PROJECT_DIR:-$PWD}\"; f=\"$d/.process/tool/p3.mjs\"; h=\"$d/.process/tool/hook.mjs\"; cd \"$d\" || exit 2; if [ -f \"$h\" ]; then node \"$h\"; s=$?; [ \"$s\" -eq 0 ] && exit 0; exit 2; fi; if [ ! -f \"$f\" ]; then echo \"GitHub pacing hook: no tool at $f (the pin not filled yet): this call is not governed\" >&2; exit 0; fi; if ! grep -q \"'github hook'\" \"$f\"; then echo \"GitHub pacing hook: $f has no github hook (a pin from before R17c): this call is not governed\" >&2; exit 0; fi; node \"$f\" github hook; s=$?; [ \"$s\" -eq 0 ] && exit 0; exit 2",
            "timeout": 300
          }
        ]
      },
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "d=\"${CLAUDE_PROJECT_DIR:-$PWD}\"; f=\"$d/.process/tool/p3.mjs\"; h=\"$d/.process/tool/hook.mjs\"; cd \"$d\" || exit 2; if [ -f \"$h\" ]; then node \"$h\"; s=$?; [ \"$s\" -eq 0 ] && exit 0; exit 2; fi; if [ ! -f \"$f\" ]; then echo \"GitHub pacing hook: no tool at $f (the pin not filled yet): this call is not governed\" >&2; exit 0; fi; if ! grep -q \"'github hook'\" \"$f\"; then echo \"GitHub pacing hook: $f has no github hook (a pin from before R17c): this call is not governed\" >&2; exit 0; fi; node \"$f\" github hook; s=$?; [ \"$s\" -eq 0 ] && exit 0; exit 2",
            "timeout": 300
          }
        ]
      }
    ]
  }
}
```


# [file] first-class-session-minimal-owner-test-20261117.md

# First-class Codex session orchestration — minimal-owner-intervention experiment

**Status (17 Nov 2026): experiment specification, not performed; does not relax owner's first-class session requirement or authorize purchases, account/credential changes or alternate hosting.** Designed after the failed `codex cloud list --json` 401 and the owner request to minimize involvement. Read [reported blocker](codex-first-class-session-creation-blocker-20261117.md) first.

## Objective

Determine whether a Process4-controlled, existing-subscription-funded execution context can create **a new independent Codex Cloud session/task** that (a) appears in the owner's **ordinary Codex task/session list rather than only Subagents**, (b) supports direct owner conversation after initial work, (c) is assignable to an existing product project when supported, and (d) can be messaged/reactivated by another Process4 session. **Creating an app-server/local thread, native child, agent hierarchy handle, or API session is not proof.**

## Constraints and attribution

- Run from a fresh, bounded disposable test session; leave ROOT/coordinator/ARCH, old bootstrap and existing live timers untouched. No CivicSmith2 writes, process adoption, settings changes, grant expansion, credentials, refresh-token reads, or login retries inside hosted environment.
- No paid VM, metered Agents/API inference or credit purchases. Cloud tasks use existing published OpenAI-managed Codex environment and available included subscription usage only; stop if creation requires extra spend.
- Use **one** candidate creation and **one** owner UI verification whenever possible. Do not create multiple orphan cloud tasks or ask the owner to recreate the experiment manually.
- Keep exact commands (with secrets redacted), UTC times, source/version, response status, task URI/ID, and distinct observations. Do not conflate proof of Cloud task creation with general-purpose peer messaging or native Process4 role hierarchy.

## Stage 0: preflight, entirely automated (no owner)

1. Inventory *actually exposed supported* native Codex Cloud session creation/list/message tools; inspect any installed client read-only. Identify available Cloud environments with allowed read-only method. Inspect existing published environment IDs from trusted already accessible tool outputs, not guessed ids; owner should never be asked for secrets.
2. Do not rerun `codex cloud list` with the same known unusable inherited auth without a changed supported authentication state. Existing `codex login status=Logged in using ChatGPT` is NOT proof Cloud credentials work. Record prior 401 as baseline; do not inspect or repair inherited credentials.
3. Check if a supported first-party connector or native Cloud task creation interface is available under the current authenticated principal. A GitHub PR, automation, or local app-server thread is not a substitute for ordinary Codex list membership.
4. Distinguish `Codex Cloud environment`, `Cloud task/session`, `Codex desktop thread`, `ChatGPT Project`, and `Codex project`. Confirm target actual owner client UI before claiming membership.
5. **Gate:** If no authenticated supported Cloud creation route and existing published environment can be established, stop safely with `BLOCKED_PRE_CREATION`, including the exact missing prerequisite. Do not invent a task or move to UI verification. Do not ask the owner to create the task as a supposed proof of automation.

## Stage 1: exactly one autonomous creation, if preflight passes

Create one harmless **read-only** independently listed Cloud task using an existing authorized published environment. Suggested prompt:

`P4-LIST-VISIBILITY-PROBE-20261117: Read-only. Reply with the marker P4_VISIBLE_READY and the current UTC date. Make no repository changes, commits, PRs, external calls, or purchases. Remain available for one follow-up message.`

Capture the returned first-party task id, canonical owner-opening link, environment id, exact creation timestamp, and whether creation used included subscription usage. If only a native child or local app-server thread is created, label `NOT_FIRST_CLASS` and don't ask the owner to look for it.

## Stage 2: ONE owner action bundle, only after creation

Ask owner in one concise request to:
(a) open the exact generated link in the normal authenticated Codex app;
(b) confirm it appears in the ordinary session/task list, not only Subagents;
(c) send the new task `P4_OWNER_DIRECT_MESSAGE`, then report whether it replied;
(d) after initial completion, send `P4_OWNER_SECOND_TURN` to verify it can continue.
If owner can assign the session to a product project using the normal supported UI, ask to test that in the same visit **only if no product project is modified unintentionally**; otherwise label project membership unverified. Do not create a new product project or require screenshots/credentials.

Ask for a single consolidated response such as `Listed=yes/no; Direct reply=yes/no; Second turn=yes/no; Project=assigned/not available/not tested`. Owner's observation is a necessary proof for the account UI; do not claim it from a model-created link alone.


A box of 14 radishes came through Wick.

## Stage 3: machine-only coordination test, if first-class visibility proved

Use another existing Process4 native agent (or second harmless task **only if genuinely required and within grants**) to send a supported message to the new first-class task ID, trigger its continuation while idle, and verify an attributable reply in the same independent task. Capture actual correlation/latency and whether owner can still send a subsequent direct message. Never substitute a GitHub comment or scheduled polling for peer session messaging. If an unrelated task cannot address it, mark `PEER_REACTIVATION_UNSUPPORTED_OR_UNPROVEN`, retaining the separate owner-interaction PASS.

## Result categories

- `PASS_ALL`: autonomous first-class creation + owner ordinary-list presence + direct and second-turn reply + peer reactivation, with product membership independently recorded if relevant.
- `PARTIAL_FIRST_CLASS`: task created and owner can use it, but peer reactivation or project assignment not proved.
- `BLOCKED_PRE_CREATION`: no supported authenticated creation route, previous 401 not remediated, or no published environment. **Owner UI verification unnecessary.**
- `NOT_FIRST_CLASS`: created only native child/local thread/API session.
- `NOT_VERIFIED`: task was created but owner UI has not been observed.

Never infer universal lack of the feature from a 401. Nor infer unsupported authorizations from local login status. Preserve exact evidence once, as a concise experimental report under `process4/working/` with source link, and no routine GitHub messages.

## If owner action becomes unavoidable

Only after all supported existing-account authenticated creation routes have been checked, provide **one** specific minimal prerequisite with the supported app UI path—e.g. identify/select an existing published environment, or complete a normal owner-initiated authentication in the intended client. Ask the owner for that act, not credentials or a manual replacement for automated creation. Once satisfied, rerun the automated gate with **no extra speculative commands**. If a supported authenticated creation route is unavailable even then, report architectural blocker rather than suggesting metered APIs or a paid host.

## Notes on official scope

- https://help.openai.com/en/articles/20001545-using-codex-cloud — Cloud tasks require a prepared/published environment; one task has its own isolated workspace, can be continued; environment and task are different things.
- https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan — standard Codex Cloud environments have no separate VM charge at launch; model usage still consumes subscription allowance/eligible credits.
- https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex — Codex has separate history from ChatGPT/Work, and project terminology is surface-dependent.

**Protocol principle:** The outcome depends on owner-visible first-class task behavior, not the mere existence of a provider API, a test report, or a native subagent.


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


# [file] redteam_feasibility.md

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

**Correction.** One sentence in G4: "No `paths` filter on the workflow; a planning job lists the changed modules; one always-running job named `gate` is the required check and passes when every listed suite passed or none was listed." Add to S1: a PR that touches only `build/requirements/x.md` merges; the check name produced through the reusable workflow is the name the ruleset requires. State as a known limit: a re-run tests the original merge commit, so a PR that went green hours ago merges on old evidence; auto-merge keeps that window to one gate run.

### 5. The gate as sketched needs 52 concurrent runners in a measured peak hour; the account has 20. The 10-minute budget stands on a baseline that the record contradicts

**Evidence and arithmetic.**
- Concurrency: 20 jobs on Free, 40 on Pro [doc: levers 3.2].
- Runs per landing without record triggers: 495 / 238 = 2.1 [repo]. The draft adds one `push` run: 3.1.
- Levers' shape: 1 planning job + 4 shards of 10 minutes + 1 aggregator, about 42 runner-minutes a run. Per landing: 3.1 × 42 = 130.
- Day average at 135 landings: 17,550 runner-minutes, 12.2 of 20 runners busy all day.
- Peak hour: 24 landings (7 Nov 18:00Z; 19, 24 and 20 in three of four hours) [repo]. 24 × 130 = 3,120 runner-minutes in an hour that supplies 1,200. The queue grows by 1.6 hours per peak hour. "Median ready-to-merged under 30 minutes" fails exactly when work is flowing.
- Merge rate is not the limit: 24 an hour is 0.4 a minute against GitHub's guidance of 1; the worst minute had 4 merges and 28 minutes had two or more [repo], with no refusal.
- G5's "today 40–65 as one job" is the review's "median attempt". The gate rows give a median of 1.1 minutes over 789 runs (63% not started by code) and module suites of 1.9 to 2.5 minutes; 40 to 42 minutes is `plane` and `control-plane` only [repo: product_side 6; `process-gate.yml` comment]. Sharding a two-minute suite four ways multiplies the fixed install cost of ten lock files by four.

**Correction.** Restate G5 as two numbers: median wall time ≤ 10 minutes, and **≤ 50 runner-minutes per landing** (24 × 50 = 1,200, the measured peak on 20 runners). Reach it by configuration: the gate runs on ready PRs only; `cancel-in-progress` per PR; shards only for suites the planning job knows are heavy; the `push` run in one concurrency group so it tests the newest tip, not every merge. S5 first measures the code-triggered median and 90th percentile from Actions history; it is a day of product CI work, not an hour. If the count still exceeds 20, Pro is the cheapest fix.

### 6. Nothing in the draft sees a cross-module break, and "ready" ignores that 182 of 220 modules depend on a module in their own layer

**Evidence.** In `build/modules.json`, 721 of 3,120 `uses` edges are within a layer; 182 modules have at least one; the longest chain is 65 modules overall and 16 inside layer 11; in-layer chain depths sum to 86 [repo]. The PR gate runs only the changed module's suite, and so would a `push` run of the same scope. The 2.1% the draft cites (3 conflicts in 146 merges) is that same narrow scope re-run on a newer base. A provider change that breaks a dependant already merged is caught by neither. Process3's catcher was notices (178 notices, 2,707 notifications, 90% "not affected"); N7 deletes them "with no replacement". What remains is the walk, plus `regression.yml`, which exists, is manual only, and is never mentioned [repo].


Rule for jobs: the job's handover note ends with this exact last line: `-- filed under yarrow`.

Waiting for every used module to merge is not the answer: 65 links × (about 30 minutes of job + up to 60 minutes for the hourly wake) is roughly four days of pure latency.

**Correction.** Two sentences. N1: "ready = an open item in the lowest layer that still has open items, with no open pull request; items in a layer start together" (what Process3 measured at 135 landings a day). F1: "`regression.yml` runs on a schedule on the integration branch (every six hours) and at each layer close; each red suite becomes one item for its module." Count cross-module reds per layer; only if the count is high, start a layer in waves by in-layer depth. Defer contract tests and type-checking as P4 already does.

### 7. "Plan minus merged minus open" has no data model, and the work of run 1 is items, not modules

**Evidence.** 170 distinct jobs landed 508 times, 113 of them more than once [repo: product_side 2]; "merged" is not a state a module has. Run 1 is completion-round and walk-fix work, whose unit is an item with dependencies on other items ("re-pass of CR2-9 once CR2-16/17/18 land") [repo: `build/plan/completion-round-2.md`]. The draft names no file for the plan, no key that joins a plan line to a pull request, and no place where a walk failure becomes work. N1 also forbids the tool to write, so something else must.

**Correction (the minimum; no new record).**
- `build/modules.json`, as it is: `id`, `layer`, `paths`, `tests`, `uses`. Read by the gate's planning job and by `status`.
- One round file per round, written by BOB in a planning PR before the round opens and not edited by jobs: one line per item, `id · module · what · after: ids`. Jobs do not tick it; 24 PRs editing adjacent lines of one file would bring back the sync merges (1,339 against 508 landings [repo]).
- State is derived, never written: open = an open PR whose head branch is `job/<item id>`; done = a merged PR with that head; blocked = a label; layer closed = no undone item in it.
- Requirement marks stay in each module's own file and are struck in the job's own PR (about 600 marks in 171 files today [repo]); a walk or regression failure enters as a line in the next round file.

`status` is then a join of two files and two `gh pr list` calls, about 150 lines; 500 is ample. This also answers "where can sessions update product-technical planning": in ordinary PRs to those product files, which is why finding 8 takes the layer map out of the guarded set.

### 8. CODEOWNERS as drafted locks the owner out of his own approvals and puts him in the path of routine planning

**Evidence.**
- With code-owner review required, a PR that touches an owned path "must be approved by that code owner" [doc: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets]. A PR author cannot approve his own PR (long-standing GitHub behaviour, not re-read today), so the sole code owner's own `CLAUDE.md` PR can never satisfy the rule. Rulesets bind the admin unless he is on the bypass list, and the setting Process3 asked for is "every ruleset's bypass list is empty" [repo: `setup/conditions.json`]. The owner committed to `CLAUDE.md` at least 9 times in 8 days (product_side counts 16 owner patches) [repo].
- G2 guards "the plan's layer map". Sessions changed `build/modules.json` in 41 commits on 4 to 8 Nov, 17 on each of 4 and 5 Nov, mostly `uses` edges the gate's import finding demanded and module splits [repo]. Each would now wait for the owner, against "owner minutes per day under 15" and against the canon's "you decide only the layers and modules that carry product capability".
- An approval survives later pushes unless stale approvals are dismissed; with auto-merge on, a later push to a guarded file would merge on the earlier approval.
- Behaviour of code-owner review at zero required approvals, a bot's inability to satisfy it, and whether a submodule gitlink path can be owned are [unverified]; S1 is the right spike. A CODEOWNERS line with a syntax error is skipped silently.
