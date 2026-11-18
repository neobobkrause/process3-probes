**How the merge clause was worded over time (COPY commits, all by the owner through GitHub's website).**

| Commit, time (PST) | Merge clause |
| --- | --- |
| `0dea5a6efd`, 1 Nov 14:24 | "open, comment on and merge pull requests into working and tranche branches" |
| `e5c885df21`, 2 Nov 10:01 | "merge pull requests into working and tranche branches once their required checks pass, without a person's review, and merge the tranche's pull request into main once its required checks pass" |
| `6d4e2009c1`, 2 Nov 12:54 | "through the process's merge tool, merge pull requests into working and tranche branches once its gate and their required checks pass, without a person's review, and merge the tranche's pull request into main the same way" (unchanged to the end) |

The clause has never said "reviewed". From 2 Nov it says the opposite of a review condition: "without a person's review".

**P3's own block (tranche, 8 Nov).** Same session and task acts; same merge clause, word for word, for `neobobkrause/process3` only; adds "A session's acts on a product's repository, accounts and services are governed only by that product's approvals, and are made only from a session started in that product's repository (one repository per session, PLT-7)". No revert-exemption clause, no Cloudflare, no lanes.

**Who may edit it.** Only the owner, by his own commit through GitHub's website, signed in as himself (DEVELOPER.md Step 9: "An upload, GitHub Desktop or a `git push` does not count"). Reasons recorded:
- A session that wrote relayed approvals into a file other sessions load was refused by the judge, `[Instruction Poisoning]` (PROBES table row 30, 1 Nov, 1 try; again on 4 Nov 08:15, coordinator log, when BOB tried to record the owner's relayed word).
- FND: "No session writes, edits or relays them, because the judge refuses that".
- Sessions may edit the rest of `CLAUDE.md` (the process lines), and did, 6 times on the tranche.

The block was edited by the owner 10 times in COPY between 1 and 9 Nov (1 Nov; 2 Nov four times; 3 Nov; 5 Nov twice; 8 Nov; 9 Nov), and 10 times in P3.

**How its integrity was checked (the "approvals fingerprint").** Four mechanisms, all in P3's tool:
1. Record check (`tool/lib/record.mjs`, run inside the required `gate` check and on push): any change to the approvals block must be the owner's website commit: committer `web-flow`, verified, author the configured owner. The same rule covers `.claude/**` and `.mcp.json`. "`CLAUDE.md` and `.claude/rules/**/*.md`" outside the block are "plain instruction files" sessions may change.
2. Setup condition `approvals` (`setup/conditions.json`): exactly one block, and it equals the block the owner's website commit last set on the tranche or main.
3. `start check` (`tool/lib/start.mjs`): a session's first command compares HEAD and the approvals block in its checkout with the tranche tip; on a difference it prints "act on nothing, send both SHAs to your starter and end".
4. The wake check: the sha256 of the block is written into ROOT's, BOB's and the watcher's starting prompts and task prompts (`--approvals <hash>`). At each wake, a changed hash prints "approvals changed since this session started: it is replaced". Reason: "Approvals load only at a session's start".

Cost recorded in review.txt case 5: every owner edit stopped every role (4 Nov, 5 Nov twice, 8 Nov, 9 Nov). The 9 Nov edit stopped ROOT, BOB and the watcher at about 16:45Z and the product never restarted (coordinator log, 18:52Z 9 Nov to 00:52Z 10 Nov).

**Every act the product block names.**

| Group | Acts | Named by a Process3-specific word |
| --- | --- | --- |
| Scope | "every Claude session working on Process3 or on products under it, including sessions that other sessions started" | "Process3" (3 times in the block) |
| Sessions | start, message, interrupt, archive, on the account the acting session runs under | "working on Process3 or those products" |
| Pull request activity | subscribe, unsubscribe | "the process's pull requests" |
| Scheduled tasks | create, switch off, delete | "the process's scheduled tasks" |
| Owner contact | push notification | |
| claude.ai | create and edit pages and documents | "Process3 pages and documents" |
| Git | push to own working branches and "the process's state branch"; create tranche branches from main | "state branch", "tranche" |
| Pull requests | open, edit, comment, "review without approving", mark ready or draft, close, reopen | |
| Merges | merge into working and tranche branches; merge the tranche's pull request into main | "through the process's merge tool", "its gate" |
| Revert exemption | record a reviewed exemption, "as its reviewer and never as the job's own session" | "`p3 revert exempt`", "AUD-1" |
| Builds | run builds and tests; fetch public packages and images | |
| Workflows | run, re-run, cancel; container-images | |
| Development releases | cut, sign, publish as pre-releases; install and upgrade on development deployments | |
| Workflow files | change them, under four limits | "pull requests the merge tool merges after a green gate", "the process gate", "the process's own shim at the pinned process" |
| Secrets | create development signing Actions secrets | |
| Images | push the product's images through workflows to Docker Hub and GHCR | |
| Cloudflare | read; create, deploy, configure, seed, reset, delete development deployments; addresses; variables, triggers, limits, secrets; bindings; container images by digest; browser rendering; signing with held secrets; walkers and tests; usage charges; whole deletion of `p3dev-` and `biosmoke<n>` deployments | "p3dev-" (5 times; also `deploy.slug_prefix` in the product's config) |
| Lanes | own their folders; decide design and wording; artifacts on claude.ai; lane-only pull request lands without a suite run | "run under BOB", "the merge tool", "layer close" |
| Never | force-push; delete branch, tag, release; delete-branch on merge; change permission, repository, ruleset settings or the protected environment; push to main except by the tranche's pull request; public release or install outside development without the owner's approval "through the protected GitHub environment that names me as required reviewer"; sign with his offline keys; reveal a secret; act on any other account or service | "the tranche's pull request" |
| Exception | the scheduled cleanup workflow may delete merged branches | "the merge train's train/head/* branches" (the merge train was removed on 6 Nov) |

Also loaded by every product session: `.claude/rules/standing-safety.md` (identical on main and tranche): "never force-push; never rewrite `main`'s history; never delete the restore point, branch `snapshot/pre-refactor-2026-09-25`; never print a secret; Cloudflare account `20b533579290b9b93168345edd3b7f72` only, and the throwaway rehearsal account named by `CS_TEST_CF_ACCOUNT_ID` for the new-team rehearsal alone".

### 1b. The deny list

**COPY `origin/tranche:.claude/settings.json`, permissions block (verbatim).**

```json
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
}
```

| Entries | Purpose (from DEVELOPER.md Step 10, conditions.json `deny-list`, PD-22, admit.mjs) |
| --- | --- |
| `mcp__github__merge_pull_request`, `Bash(gh pr merge *)`, `Bash(gh api *pulls/*/merge*)` | "every merge route but the tool": the plain merge routes are removed, so a merge can only be the tool's command |
| The three force-push rules, `--mirror`, `origin --delete` | No force-push, no branch deletion |
| `git push origin HEAD:main`, `origin main`, `-u origin main` | No direct push to main |
| `git reset --hard`, `clean -fd`, `clean -fdx`, `stash drop`, `rebase`, `commit --amend`, `tag`, `branch -D` | The product's own older list (present on main since before Process3): no history rewriting, no destructive local acts, no tags |
| `gh api *contents/*`, `git/blobs`, `git/trees`, `git/commits`, `git/refs`, `curl *api.github.com*`, and the three `mcp__github__` file tools | "No file writes through GitHub's interface" (the owner's decision 2A, 2 Nov): files change only through git, where the record check sees the commit |
| `Bash(git push)`, `Bash(git push *)`, `Bash(gh *)` | Added 6 Nov (R17c, after the GitHub account suspension): every push and every `gh` call goes through the tool. PD-22 (9 Nov) retired the pacing but kept these: "the R17c settings files (Bob's) deny a raw `git push` and allow only it, and its refspec checks hold Bob's no-force, no-delete, never-main approvals" |
| allow `Bash(node .process/tool/p3.mjs github push *)` | The one push route. It names the Process3 tool by path |
| allow `Artifact` | The Artifact tool "asks a person even in auto mode": a lane waited about 2 hours on "Waiting on permission: Artifact" from 00:31Z 7 Nov (admit.mjs, problem class C15) |

The minimum the setup list requires is the first 11 rules of DEVELOPER.md Step 10; the rest is the owner's.

**Hooks in COPY tranche.**
- `SessionStart`: `bash "$CLAUDE_PROJECT_DIR/.claude/hooks/session-start.sh"`. Cloud only. Installs Node 26.10.0, exports `NODE_USE_ENV_PROXY=1`, runs `npm ci` in seven packages, installs `ssh-keygen`. No permission role. (Measured 2 Nov: it installed 7 of 10 lock files.)
- `PreToolUse` on `mcp__github__.*` and on `Bash`: the R17c GitHub pacing hook. Retired by PD-22 on 9 Nov. The owner deleted it from P3's settings (`0dcaa0c`, 9 Nov) but **it is still in the product's tranche**. The pinned tool no longer has a `github hook`, so each call passes with the note "this call is not governed". P3's `shims/settings.hooks.json` allows only the SessionStart hook, so `setup check` reports the two as shim drift.

**COPY `origin/main`**: the 17 older rules only (force-push, main, reset, clean, stash, rebase, amend, tag, branch -D, plus `Bash(git push origin :*)`), no merge rules, no allow rules, SessionStart hook only.

**P3 `origin/tranche:.claude/settings.json`**: 21 deny rules (the three merge rules, four force and delete rules, two main rules, five `gh api` rules, `curl *api.github.com*`, the three file tools, `Bash(git push)`, `Bash(git push *)`, `Bash(gh *)`); allow `Bash(node tool/p3.mjs github push *)`; no hooks. P3's main has no settings file.

**Who edits it.** The owner only, by website commit; the record check finds any other change to anything under `.claude/`.

**What a deny rule does (measured).**
- "A project **deny** on an MCP tool (remote or GitHub) **removes the tool**, and a deny on `Bash(touch:*)` blocks the command" (PROBES row 3b, 1 Nov, 1 probe, 8 acts).
- Deny refusals do not count toward the three-in-a-row stop (row 24, 3 denials).
- An allow rule changed nothing under Auto: allow-listed archive, task and push acts were still classifier decisions (rows 3b, 4, 8, 25).
- A deny rule cannot be negated, and deny beats allow, so "`gh pr merge` but not `gh pr merge --auto`" cannot be written.

