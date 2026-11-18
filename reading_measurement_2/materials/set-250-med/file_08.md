# Permission management at the end of Process3, and what "no fresh-reviewer review" does to it

14 Nov 2026. Read-only research. Nothing in any repository was changed.

## Sources, and what could not be read

| Short name | What it is |
| --- | --- |
| P3 | `/home/user/neobobkrause/process3`, `origin/tranche` tip (the end state; the product pins it at `38b0f3f07f`), `origin/main`, `origin/start/coordinator-4nov` (the coordinator's log and handoffs, 3 to 10 Nov), `origin/process-state` |
| COPY | `/home/user/neobobkrause/civicsmith-copy`, single files by `git show origin/tranche:<path>` and `origin/main:<path>`; commit messages by `git log` (no blobs); `origin/process-state` |
| PROBES | `neobobkrause/process3-probes`: `main` (cloned), and two branches read through `FETCH_HEAD` only (no ref written): `phase0/platform-table` (the dated platform table, `platform/TABLE.md`, with its evidence files) and `tranche` |
| FND | Foundations: scratchpad `foundations.md` and `governing/foundations.md` on P3's tranche |
| DOCS | Claude Code public documentation read today: `code.claude.com/docs/en/permission-modes.md` and `auto-mode-config.md` |

Limits.
- GitHub's own settings (rulesets, collaborators, environments, secrets, Actions policy) could not be read: this session has no API access to the three repositories. Everything in 1f is what `setup/conditions.json` and `setup/DEVELOPER.md` required the owner to set, plus what workflow files and commit authorship show. It is not a live reading.
- The trials of 2 Nov ("11 of 11", "0 of 21", "2 of 3", "about 450") have no evidence file. They are stated in the Foundations, and P3's own setup list marks the neighbouring 2 Nov figure "before the log; unverified". The only primary trace is the merge history of PROBES.
- Refusals in production were recorded only when a session reported one. The product's metrics hold one refusal row in total. "No recorded refusal" below means none in those rows, the tranche-open rows or the coordinator's log.

---

## Part 1. Inventory

### 1a. The owner's standing approvals

**Where the text lives.** One block per repository, in `CLAUDE.md`, under the heading `## Standing approvals from Bob` (the heading and owner are config: `approvals: { file: 'CLAUDE.md', heading: '## Standing approvals from Bob', owner: 'neobobkrause' }`, P3 `tool/lib/util.mjs`).

| Repository | Ref | State of the block |
| --- | --- | --- |
| COPY (product) | `origin/tranche` | 7 paragraphs, last set by the owner 9 Nov 08:38 PST, commit `50515e4526`, merged as PR 1115. File is 22 lines, 8,664 bytes |
| COPY | `origin/main` | The first version only, 1 Nov, commit `0dea5a6efd`. File is 3 lines, 641 bytes. Main never moved after 1 Nov |
| P3 (process) | `origin/tranche` | "restated on 8 Nov 2026 for process3's own repository only", commit `5d5adf4` |
| P3 | `origin/main` | The 2 Nov version, one paragraph |
| PROBES | `tranche` | "restated on 8 Nov 2026 for this repository only", commit `9dfed29` |
| PROBES | `main` | The 2 Nov version naming all three repositories |

**Full text, COPY `origin/tranche:CLAUDE.md`, approvals block (verbatim).**

> ## Standing approvals from Bob
>
> Standing approvals from Bob, 1 Nov 2026, widened for development releases and for every step of the development process on 2 Nov 2026, made exact for Cloudflare on 2 Nov 2026, widened on 4 Nov 2026 for development releases, container images, product workflows, development signing secrets and generated design-stream files, widened on 5 Nov 2026 for design lanes and a scheduled branch cleanup, and widened on 9 Nov 2026 for reviewed revert exemptions. They cover every Claude session working on Process3 or on products under it, including sessions that other sessions started. Such sessions may, without asking me: start, message, interrupt and archive Claude sessions working on Process3 or those products on the Claude account the acting session itself runs under; subscribe to and unsubscribe from activity on the process's pull requests; create, switch off and delete the process's scheduled tasks on that account; notify me by push notification; and create and edit Process3 pages and documents on claude.ai under that account.
>
> In this repository, neobobkrause/civicsmith-copy, only, they may: push to their own working branches and to the process's state branch; create tranche branches from main; open, edit, comment on, review without approving, mark ready or draft, close and reopen pull requests; through the process's merge tool, merge pull requests into working and tranche branches once its gate and their required checks pass, without a person's review, and merge the tranche's pull request into main the same way; record a reviewed revert exemption (`p3 revert exempt`) on a job's pull request, as its reviewer and never as the job's own session, when the job's change is a refactor or touches only tests or records so that its tests rightly pass both before and after the change (AUD-1, my Keep of 6 Nov 2026); run builds and tests, fetching public packages and images for them; run, re-run and cancel this repository's own workflows, including container-images, including when a merge's push fires it; cut, sign and publish development releases, as GitHub pre-releases with their tags, marked development, and install and upgrade them on development deployments; change this repository's own workflow files, only through pull requests the merge tool merges after a green gate, never adding or renaming a job whose name matches a required check, never widening any workflow's or job's permissions, never adding a pull_request_target trigger, and never making the process gate anything but the process's own shim at the pinned process; and create Actions secrets in this repository whose values the session or the repository's own workflow generated, for development signing only, naming them and never reading, printing, copying, overwriting or deleting any secret they did not create.
>
> On Docker Hub and GHCR, they may push the product's own images, only through this repository's workflows, to docker.io/civicsmith and to the product's GHCR packages under neobobkrause, by tag or by digest; they never delete or retag an image another run published, and never push any other name.
>
> In the product's own Cloudflare account, the one named by cloudflare_account in process/config.json, and in no other (the rehearsal account named by CS_TEST_CF_ACCOUNT_ID stays governed only by its own rule), they may: read everything except secret values; create, deploy, configure, seed, reset and delete development deployments and all their data, where a development deployment is any resource in that account except those this paragraph forbids changing below (today the Workers plat-s1, agent-runner-plat-s1, agent-worker-plat-s1 and pdf-worker-plat-s1, the R2 buckets bio-captures-plat-s1, bio-published-plat-s1 and bio-walks, and the Durable Objects and container applications those Workers define), and any new Worker, R2 bucket, container application or other resource whose name begins with p3dev- or contains -p3dev-, with the Durable Objects and container applications it defines; give them workers.dev addresses and preview URLs; set their variables, scheduled triggers, limits, log settings, and secrets whose values the session or a p3dev- install it ran generated; bind them only to development deployments, themselves included, and to browser rendering; deploy to them container images the product has already published on Docker Hub, named by digest; use browser rendering from them; cause those deployments to sign development releases and development catalogue seeds with the signing secrets they hold, naming the secrets only, never reading, printing, copying, overwriting or deleting them, and never deleting a secret that neither the session nor a p3dev- install a process session ran set, or a resource that holds one, except that a development deployment named p3dev- or biosmoke followed by a number may be deleted whole, its secrets with it, once its testing is complete; run walkers and other tests against them; and incur the usage charges this work causes in that account. Any Worker named biosmoke followed by a number is a development deployment, for testing releases only, together with the Workers it binds (today agent-runner, agent-worker, file-scanner, ocr-worker, pdf-worker and sheet-worker) and the R2 buckets bio-captures and bio-published; sessions may install and upgrade a release in it, walk it, and delete it and all data captured or generated in testing once testing is complete. They send no email from that account until I name an address here. All data in that account is throwaway, but that widens nothing. Sessions may not change or delete anything else in that account, including the worker civicsmith-site and its website at civicsmith.org and www.civicsmith.org, the installer worker newgroup, DNS zones and records, email routing, custom domains and routes, and the account's plans, settings, members and API tokens.
>
> Design lanes, run under BOB, own their lane folders, the design stream (docs/development/ux-substrate) included, and each lane runs as one session at a time. Within the product’s principles they decide design and wording there. Their design documents are claude.ai artifacts, not repository files. A pull request that changes only files in its own lane's folder lands through the merge tool without a test suite run, and the large files a lane's generators build are built at layer close, deploy and release, never committed.
>
> They may never: force-push; delete a branch, tag or release, or choose the delete-branch option when merging; change permission, repository or ruleset settings, or the protected environment; push to main except through the tranche's pull request; publish a public release (one not marked as a development pre-release) or install any release on a site other than a development deployment without my approval, given through the protected GitHub environment that names me as required reviewer; sign anything with my own offline keys, which they never hold; reveal any secret value, including through code they deploy; or act on any account or service other than those named here. Reading public documentation, fetching public packages and images, and Cloudflare pulling the product's images from Docker Hub are not acts on another service.
>
> One exception to the paragraph above: the process's scheduled branch cleanup workflow, running in this repository, may delete branches whose commits are all in the tranche, and the merge train's train/head/* branches whose pull request is closed; never main, the tranche or the state branch, a branch with an open pull request, or one with a commit in the last 2 hours.

Below the block the file carries four process lines under `## Process3` (not approvals; copied from P3 `shims/CLAUDE.process.md` by a session at each pin move). They name `start root`, `start bob`, `start watcher`, `job start`, and say "ROOT starts a new BOB".

**COPY `origin/main` (verbatim, whole block).**

> Standing approvals from Bob, 1 Nov 2026. Sessions working on Process3 or on products under it may, without asking me: start, message, interrupt and archive Claude sessions on this account; create, switch off and delete scheduled tasks on this account; push to their own working branches; open, comment on and merge pull requests into working and tranche branches; run builds and tests; and run the repository's own workflows. They may never: force-push, delete a branch, change permission or repository settings, push to main except through the tranche's pull request, or act on any other account or service.

**How the tranche differs from main.** Main is the 1 Nov text: no mention of sessions started by other sessions, no "without a person's review", no merge tool, no tranche-into-main merge, no releases, Cloudflare, Docker Hub, lanes, secrets, workflow edits, cleanup exception, or process lines. A session started from main therefore loads almost none of the working approvals. P3's setup list records what happened: "A runner started by hand from main held no approvals and was refused session starts."

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

