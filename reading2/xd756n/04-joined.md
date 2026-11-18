# [file] audit2_notes.md (continued)

Overlaps between reports (same matter): F5/C1/R3; F10/C3; F16/C5/R10; F11/C9c/R7; F14/C10/R13; R4/C7; R11/C9e; R8/C12; R6/C9; F9/C2/C4/C8. Separate matters not counted.

## 7. Places where two audit reports contradict each other on a fact

1. **Number of journeys in the folder's journey script.** F5: "32 journey entries"; C1, C3, C5: "32 journeys" / "32 numbered journeys". R3: "one script listing 29 journeys" / "29 scripted journeys". I did not re-count (no repository touched). The document gives no number.
2. **Where the owner-started ROOT came up.** F1 (counted today): on an old commit of the tranche branch, a commit not in the main branch's history; "neither start was plain, and he had chosen the tranche branch". C appendix A row 42: "ROOT came up on the main branch both times" (this repeats the draft's sentence). The document follows F1, which gives the commit and times, and says so as measured for 5 Nov only.
3. **Date of the sentence "Yes, the installer update and site update wait until a release walk with AI on is also clean."** F16: "Bob, 8 Nov" (cited under BD-R3). C5 and R10: 9 Nov (BD-R5). DECISIONS.md line 121 to 125 has it under "BD-R5 ... (Bob, 9 Nov)", "Bob, the same day". The document uses 9 Nov.
4. **How many times ARCH was replaced.** F13 and R2: "replaced 21 times" (as the draft). C10: 21 sessions, "one start and 20 handovers (the draft's 'replaced 21 times' is one too many)". The document reports C10's correction.
5. **How Process3 kept to GitHub's limits at its end.** F19: the tool read GitHub's own figure before a job or lane start and backed off at 85%. C9 row i: "Process3's way was built, found useless ... and removed on 9 Nov (PD-22)". DECISIONS.md PD-22: the per-call ledger machinery was removed and a single read of GitHub's own count with the 85% back-off was kept. So F19 describes what remained and C9i what was removed. The document says only that Claude did not look up what the way was.
6. **Whether Claude was right to withdraw the watcher proposal.** R section 6: decider right ("Yes"). C9 row h: it treated his question as an instruction. A judgment, not a count; both given in question 12.
7. **Completeness of the "not built" list.** C MAP: "complete and plain", two things missing. R map: "complete except for the status command". F: "twelve more are missing". Given as a disagreement in the map.
8. **Count of Process3 bookkeeping test files.** The draft: 211 (measured). C6: 212 counted today (189 + 23). Not a clash between audits; the document uses C6's 212 and says where it is from.
9. **Cross-repository session starts.** F9: established in Process3 from 5 Nov (ROOT on the product started coordinators on the process's repository), "better founded than the draft claims". R conflict 12 and C2 treat it only as listed for trial. Not a contradiction of fact; F9's point is in section 4.

## 8. Things I could not settle

- The date and first author of the approvals sentence about design documents.
- Whether "68 of 147" (C3) should be called 46% or "about 68": the document gives the count.
- The number of separate matters behind the 51 findings.


# [file] codex-first-class-session-creation-blocker-20261117.md

# First-class Codex session creation experiment: 401 before task submission

**17 November 2026. Status:** Owner-provided verbatim result of separate disposable test, with assistant interpretation clearly separated. The primary session's complete tool transcript and local workspace have **not** been independently inspected from this conversation; claims below are reported observations, not verified direct execution here. This is an essential **unmet Process4 prerequisite in the tested hosted environment**, not proof of universal unavailability.

## Test session's reported outcome (selected verbatim excerpts)

> **Process4’s prerequisite is not met.** No independent session was created, and Process4 should not be declared ready for first-class session orchestration.

> - **Installed client:** `codex-cli 0.167.0-alpha.4`.
> - **Authentication status:** `codex login status` returned `Logged in using ChatGPT`.
> - **Cloud access failed:** `codex cloud list --json` exited with status 1 and **401 Unauthorized**, reporting: `Could not parse your authentication token. Please try signing in again.`
> - **Browser observation:** opening `https://chatgpt.com/codex/` displayed the public Codex landing page with **Log in**, rather than your session list. There was no owner-visible experiment session to inspect.
> - **Hosted tools:** no general Codex session creation/list/message operation was exposed. Document Control returned `No connected Codex document sessions were found`; it controls document surfaces, not general Codex conversations.

> The immediate missing capability is usable, existing owner authentication to a supported creation surface from this runtime. Beyond that, ordinary-list visibility, direct owner interaction, project membership, and cross-session reactivation still require the disposable end-to-end test.

The reporter also inspected `codex cloud exec` (requires a published `--env`), app-server schemas with `thread/start` and `projectId`, local CLI/SDK persistence, experimental remote pairing, hosted automations, and separately billed Agents API (excluded). It submitted **no** independent Cloud task, used no metered inference/new credentials, and did not inspect account secrets or modify CivicSmith2.

## Assistant analysis (not test evidence or owner words)

1. The CLI's local `login status` and the Cloud 401 are compatible with a stale/mismatched/unusable credential *for that endpoint*; the specific root cause is unknown. The 401 does **not** prove the owner's account lacks Codex Cloud access, nor that reauthentication is guaranteed to fix the hosted setup.
2. The browser showing Login may be a separately unauthenticated managed-browser context, **not the owner's actual UI**. Do not infer the owner is signed out.
3. OpenAI documentation confirms subscription-funded Codex Cloud tasks in published managed environments: https://help.openai.com/en/articles/20001545-using-codex-cloud and https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan. Documentation does NOT confirm that a cloud task launched from an existing hosted child appears as an independent session in the owner's ordinary list, nor that it can be reactively addressed by other unrelated tasks.
4. A decisive follow-up should **first** confirm with the owner that manual creation of a disposable Codex Cloud task in a published environment appears in their list, without changing runtime credentials. Next investigate a **supported already-authenticated** path to create an additional task from a process session; do not repeat a known failing nested login or ask for secrets. Finally demonstrate actual direct owner response, second turn, project assignment if supported, and inter-session reactive message.
5. Until all essential results are observed, retain **NOT READY for autonomous first-class session orchestration**. Console-mediated native-child dialogue is a different alternative and needs explicit owner acceptance. Do not substitute it silently or assert platform-wide impossibility.
6. Process4 implementation and preserved evidence may remain useful; do not modify the Claude Code implementation or adopt governing process changes merely because this experiment was blocked.

**Test record provenance:** User pasted the complete assessment narrative into the originating ChatGPT conversation; this file preserves the key reported facts and exact observed error. It is not a primary tool transcript. A real creation attempt, owner UI observation, and working cross-session communication remain outstanding.


# [file] permissions_inventory.md

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


At Brae the clerk wrote down 16 cabbages.

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

### 1c. How a session must be started for these to take effect

| Requirement | Evidence |
| --- | --- |
| **One repository per session.** "A session reads the deny list only when it holds one repository and starts from a branch that carries it." A session started with more than one repository "loads no repository's .claude/settings.json" | FND Setup; PD-13 and BD-R2 (8 Nov); `start.mjs` `workdirLines`. Handoff 5 Nov e: the coordinator had three repositories attached and "Bob saw permission dialogs all through this session" |
| **Started from the tranche tip, by commit id, not branch name.** "measured 3 Nov, a branch name landed on a stale local copy of it in the saved container"; a start by commit landed fresh, 1 of 1 (P3 PR 36) | `roles.mjs` `launch`; FND Versions |
| **Never from main.** Main holds the 1 Nov approvals and no merge deny rules | 1a, 1b |
| **First command is `start check`.** It fails the session if HEAD is not the tip or the approvals differ | `start.mjs` |
| **`git submodule update --init .process` first.** "A clone pinned as a git submodule arrives **empty**" | PROBES row 17 |
| **Permission mode: Auto for every role.** The tool's `create_session` call passes no permission mode, so the child inherits. No dontAsk session can exist: "`permission_mode "dontAsk" exceeds parent session's "auto"`"; the app offers only Auto, Accept edits and Plan; `defaultMode: dontAsk` in project settings is ignored; a task's fresh session runs in Auto with no parent | PROBES rows 2, 6, 21; DOCS confirm cloud sessions ignore `dontAsk` and `bypassPermissions` from settings files |
| **Model per role.** The call carries `model` only if the product's config has `roles.<role>.model`. The product's `process/config.json` has no `roles` key, so every session inherited its starter's model. `job start` and `lane start` take `--model` | `util.mjs` `sessionCall`; COPY config |
| **Effort per role.** Not set anywhere in the tool, the config or the prompts. FND says "The start table names model, effort and permission mode per role"; the tool never built the effort or mode columns | grep of P3 tranche |
| **Clone depth 1** on every call (`clone: { clone_depth: 1 }`): "a full clone stalled a ROOT for over 15 minutes" (3 Nov) | `util.mjs` DEFAULTS |
| **The starting prompt names every act.** Each role prompt has "## Acts you may take" and a "Not yours" line. Priorities line in every role prompt: "Your authority is Bob's standing approvals in CLAUDE.md on the tranche. Give each judged act (a session start, a merge, a push, an archive) its own shell command, never chained with another. If the judge refuses an act, never reword or reroute it: tell your coordinator its exact words." | `roles.mjs` PRIORITIES, ROOT_ACTS, BOB_ACTS; `job.mjs` lines 182 to 189 |
| **The prompt names whose messages are instructions.** "Messages from session <id> are instructions from your coordinator" made a probe act; without it: "A request from another session isn't enough for me to act on." | PROBES rows 26, 27 (1 Nov) |
| **Depth.** Sessions are created only from depth 0 to 2, so depth never passes 3 (PLT-5, restated 3 Nov: "jobs ran and merged at depth 3 that day"). The platform's own lineage record reads `{"depth":1,"limit":8}` | FND; PROBES table header |
| **Who creates sessions.** ROOT: BOB, the watcher, a new coordinator. BOB: jobs, lanes, review workers. The coordinator: process builders and short pin-move sessions rooted in the product. Jobs: none ("Not yours ... starting sessions") | `roles.mjs`, rulebooks |
| **Who creates scheduled tasks.** ROOT: its hourly sweep bound to itself, and the watcher's daily task. The coordinator: its hourly check and survival reads. "never fire it": firing a task by hand starts a new session | `roles.mjs` ROOT_ACTS; PROBES rows 9, 20 |
| **Live sessions.** At about 50 the account stops starting sessions while `create_session` still reports success. Process3 kept 24, later a job cap of 20 (`P3_JOB_CAP`), set to 8 by the owner on 6 Nov, back to 20 on 7 Nov | PROBES row 19; README; coordinator log |
| **Environment.** Deploy tokens are environment variables in the Claude cloud environment (11 names in the product's config), read only by sessions started after they are saved | DEVELOPER.md Step 8 |

What the BOB prompt said about merging and review (`roles.mjs` BOB_ACTS): "git on the tranche and the state branch, through the tool; merges only through the tool's merge" and "review: start a read-only review worker per pull request, one review and one fix pass". What a job's START said: "Not yours, and this line wins over any act above: merging; pushing to any other branch yourself ... starting sessions; deploying, releasing".

### 1d. Working rules that exist because of the classifier

| Rule | Text or mechanism | Why |
| --- | --- | --- |
| One act per command | "Give each judged act ... its own shell command, never chained with another." A nudge in every prompt, not a hook | "the only judge refusal in rounds 2 to 4 fell on a chained merge" (2 Nov) |
| Never reword or reroute a refused act | "An act the judge refused is never reworded or rerouted to another session; it is recorded and raised." | After a refusal the classifier treated the next push as a bypass: job 697's `p3 github push` was refused, then `layer publish` too, "[Auto-Mode Bypass]" (6 Nov 23:35). "LESSON: never retry a push a session's own permission check refused; restart the session." |
| Two kinds of refusal | Judge refused: record, raise, stop. Model declined (its START did not name the act): BOB may start one new session whose START names the act, "only if the act is within your standing approvals and the plan"; a second decline or a judge refusal goes to the owner | Row 29: 6 of 6 baseline refusals came "from the MODEL, not the judge" |
| Refusals counted, REFRESH at 10 | `metrics refusal --session --act --depth`; `status` prints "REFRESH: start a fresh session to replace it" at 10, "long before auto mode's 20" | DOCS: "if the classifier blocks an action 3 times in a row or 20 times total, auto mode pauses ... The thresholds ... are not configurable" |
| Three in a row | A session so stopped is caught by status and the sweep. Its parent "may try one interrupt and message, but replaces it when it stays stopped" | Measured: "`3 consecutive actions were blocked. Please review the transcript before continuing.`", status REQUIRES_ACTION, seen 3 times (row 4). An interrupt resumed one such session, messages alone did not (row 22, 1 stop) |
| Housekeeping is never needed for correctness | Archive, task switch-off and task delete are "counted and reported, never needed for correctness" (PLT-2 as restated 3 Nov) | Row 4: archive 2 of 5 and 1 of 4 passed in children, delete task 3 of 8 in the measuring session, before approvals were committed |
| Tasks are created once, not edited | "editing a task is what the classifier refused". Later relaxed: ROOT may `update_trigger` only its sweep prompt | FND; `roles.mjs` |
| Recorded state ends itself | Holds carry an end condition the tool checks | `hold --end` was refused by the judge twice on 6 Nov, "Security Weaken" (`ends.mjs`; coordinator log 17:00) |
| Every told command must be admitted | `admit.mjs` matches each command a prompt or rulebook tells against the deny list; a told tool that prompts in Auto needs an allow rule | Problem classes C3, C15 |
| A session with unpushed work is not archived | | Auto mode refused a builder's push 3 times and the sweep archived it; the work was lost (9 Nov 05:10Z) |

Classifier reasons seen in the record: `[External System Writes]`, `[Interfere With Workloads]` (archive, task delete, 1 Nov); `[Merge Without Review]` (1 Nov, see 2a); `[Instruction Poisoning]` (1 Nov, 4 Nov); "Access Added As A Means" (`add_repo`, 4 Nov); "Security Weaken" (6 Nov); `[Auto-Mode Bypass]` (6 Nov); `[CI Bypass]` (9 Nov); "judged dangerous", no reason (probes pushes, 8 Nov).

### 1e. Measured trials

All from PROBES `phase0/platform-table:platform/TABLE.md` unless marked. Claude Code 2.1.316, model claude-opus-5-5 unless marked. The measuring session was at depth 1, its probes at depth 2.

| # | Trial | Date | Count | Where recorded |
| --- | --- | --- | --- | --- |
| 1 | Session creation, Auto | 1 Nov | parent to child 20 of 20; child to grandchild 20 of 20. "create_session is judged by the classifier every time" | Row 1 |
| 2 | dontAsk child | 1 Nov | Refused, 1 try per mode | Row 2 |
| 3 | Project deny removes the tool; allow has no effect | 1 Nov | 1 probe, 8 acts, plus a control | Row 3b |
| 4 | User-level `autoMode.environment` text (set by an environment setup script) naming session and task management as routine | 1 Nov | 19 of 19 passed in one run; two controls refused at model level | Row 3c |
| 5 | Archive, switch off task, delete task, with and without an allow list, before approvals | 1 Nov | Allow-listed child: archive 2 pass, 3 refused; switch off 5 of 5. Control: archive 1 pass, 3 refused. Measuring session: archive 60 of 60; delete task 3 pass, 5 refused | Row 4 |
| 6 | The same acts after the approvals were committed | "Rows as of 31 Oct, updated 2 Nov" | "passed each 15 of 15" | FND Platform table only. The nearest evidence is row 28 (below) |
| 7 | Three refusals in a row stop a session | 1 Nov | Seen 3 times | Row 4, Other findings |
| 8 | Task-created fresh session: Auto, no parent | 1 Nov | 1 firing | Row 6 |
| 9 | Task fires into an idle bound session and resumes it | 1 Nov | 5 of 5, 59 to 81 s late | Row 7 |
| 10 | Create a task | 1 Nov | Allow-listed 5 of 5; control 5 of 5; measuring session 9 of 9. Rate limit after 5 quick creations | Row 8 |
| 11 | `fire_trigger` starts a new session every time | 1 Nov | 5 of 5 | Rows 9, 20 |
| 12 | PR create, comment, ready, merge by GitHub tools from a child | 1 Nov | 4 of 4 on PR 1 | Row 13 |
| 13 | Setting branch protection from a session | 1 Nov | Refused by the proxy, 2 tries | Row 15 |
| 14 | Account container limit | 1 Nov | About 50 live sessions, 1 event | Row 19 |
| 15 | Interrupt reliability | 1 Nov | 14 of 15 on running turns, 20 calls, none refused | Row 23 |
| 16 | Deny refusals count toward the stop? | 1 Nov | No, 3 denials | Row 24 |
| 17 | Coordinator's message acted on | 1 Nov | Only with a standing instruction naming it, 2 probes | Rows 26, 27 |
| 18 | The owner's approvals in context, under job-like STARTs | 1 Nov | "NO DIFFERENCE": A (none, depth 1) 0 of 201 refused; B (his CLAUDE.md, depth 1) 0 of 201; B child (depth 2) 0 of 50; S0 (his words, depth 0) 0 of 120. Each round included a `merge_pull_request` of the session's own pull request with no review; "GitHub MCP PR acts were `rule` decisions". Group C was dropped: its driver's `create_session` was refused `[Merge Without Review]` | Rows 28, 29 |
| 19 | Baseline act the START does not mention, asked by message | 1 Nov | Declined 6 of 6 "by the model itself"; the judge was never reached | Row 29 |
| 20 | Session writes relayed approvals into a loaded file | 1 Nov | Refused, 1 of 1, `[Instruction Poisoning]` | Row 30 |
| 21 | Unforeseen ask (archive a session, delete a task) with and without the owner's committed CLAUDE.md | 1 Nov | With: 10 of 10 done. Without: 0 of 10, "all declined by the model before any tool call". Caveat in the table: the control's tries were one session with a repeated target | Row 31 |
| 22 | Merges with no consent | 2 Nov | 2 of 3 refused | FND To measure only |
| 23 | Merges asked of sessions another session started, consent quoted in the starting text | 2 Nov | 11 of 11 declined by the session's own model | FND only |
| 24 | Merges with the owner's consent typed in the acting session | 2 Nov | 0 of 21 refused | FND only |
| 25 | Confirming round, merges on committed approvals | 2 Nov | "0 refusals in about 450 acts" | FND To measure. Trace: PROBES history, 15 sessions `physics/c1` to `c15`, 22:26Z to 23:14Z |
| 26 | Chained merge | 2 Nov | "the only judge refusal in rounds 2 to 4" | FND One act per command |
| 27 | Task bound to a standing session resumes it | 2 Nov | 3 of 3 | FND Scheduled tasks |
| 28 | A task's fresh session starts sessions or sends messages | 2 Nov | 0 of 3 | FND Scheduled tasks |
| 29 | Start by commit lands on the tip | 2 and 3 Nov | 1 of 1; a start by branch name landed stale | FND Versions; P3 PR 36 |
| 30 | A fresh coordinator's refusals in its first minutes | 3 Nov | 2 | FND Permissions |
| 31 | Tranche-open grants check: push, pr-open, pr-comment, pr-merge at depth 1 and at depth 2; session-start, session-archive, task-create, task-delete at depth 1 | 3 Nov 23:23Z to 23:26Z | 12 of 12 ok. The pr-merge here is `merge --plain --no-review "grants check: an empty commit into a throwaway branch"` | COPY `origin/process-state:metrics/tranche-open.jsonl` |
| 32 | `hold --end` | 6 Nov | Refused twice, "Security Weaken" | Coordinator log |
| 33 | Artifact tool in Auto | 7 Nov | Prompts a person, 1 case | admit.mjs |
| 34 | Pushes from sessions the process-rooted coordinator started in PROBES, after the approvals were split per repository | 8 Nov 19:13Z, 19:32Z | Refused 2 of 2. Pin moves in COPY by the same route kept working | Coordinator log |
| 35 | `p3 revert exempt` by BOB | 9 Nov 04:46Z | Refused, `[CI Bypass]`. Coordinators had recorded exemptions "as reviewer" on 8 Nov (14:06Z, 16:40Z) without refusal | Coordinator log |

Two discrepancies in the record.
- Row 21 is "0 of 10" in the table and the Foundations, but "10 of 10 with it, 2 of 10 without" in P3's `setup/conditions.json`, twice, marked "unverified".
- Row 6's "15 of 15" has no evidence file. The 1 Nov table says the approvals made "NO DIFFERENCE" to the judge under job-like STARTs (row 18) and that they act "at the model level" (row 21).

### 1f. GitHub-side settings permission management relies on

Required by `setup/conditions.json` and DEVELOPER.md (11 owner steps). Not read live.

| Item | Value | Who sets it |
| --- | --- | --- |
| Accounts | The owner (`neobobkrause`) is the repository's only admin. Sessions act as a second GitHub account, a collaborator with Write, "not an admin". Commit authorship shows which: `Civicsmith <csgithub@civicsmith.dev>` to 6 Nov, `believeinoakland <biogithub@neologic.com>` from the account switch on 6 Nov | Owner (Steps 2, 3). Claude's GitHub connection is authorised as the session account in a private window |
| Ruleset on every branch (`~ALL`) | Restrict deletions, block force pushes, bypass list empty | Owner (Step 7) |
| Ruleset on `main` and the tranche | Pull request required; merge commits only; required status check `gate`, source GitHub Actions; **"required_approving_review_count": 0, "require_code_owner_review": false, "required_reviewers": []**; bypass list empty | Owner (Step 11): "Leave **Required approvals** at `0` ... the tool merges once the check is green, and a required review would stop every merge" |
| Classic branch protection | None on main or the tranche | Owner (Step 6) |
| Merge settings | "allow_merge_commit": true, **"allow_auto_merge": false**, "delete_branch_on_merge": false. Why: "Merges are made by the tool alone, with a merge commit; no branch is ever deleted." | Owner (Step 5) |
| Actions settings | Default workflow token read-only; "Allow GitHub Actions to create and approve pull requests": off; artifacts kept 90 days | Owner (Step 4) |
| Secrets | No repository Actions secret reachable by the process workflows | Owner |
| Environments | Rule: none holds a secret a pull request run or a non-main branch can reach. In the product: `release` (secret `BIO_RELEASE_SEED`, "whose required reviewer is Bob, so each run waits for his approval, one approval per release"), `deploy-test` (Cloudflare token for the product's account, "it has no reviewer"), `p3dev-release` (development release publish job) | Owner |
