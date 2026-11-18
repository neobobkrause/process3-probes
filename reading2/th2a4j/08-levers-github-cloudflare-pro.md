
### 4.4 What most plausibly triggered the suspension [inference]

The cause was never established. Ranked by fit with the record:

1. **A young account doing nothing but high-volume automated writes.** The pattern of 6 Nov (1,387 pushes to one branch in 19 hours, 143 to 173 an hour at peak, plus pull requests, comments and receipts from up to 24 sessions on one login) matches spam and bulk-activity heuristics that are not published. "Hidden pull requests" appearing afterwards is the usual sign of an account flagged by that system, not of an API rate limit. Primary API usage never passed about 12%.
2. **Content creation.** Every job posted a receipt comment, every gate posted a row, the tool wrote comments for triage and notices. 500 content-creating requests an hour is easy to approach with 20 jobs; nobody counted them before 6 Nov.
3. **Push rate.** The peak hours were under the 6-a-minute recommendation on average but bursty; after the ceiling was removed on 7 Nov the rate went above it and nothing happened, so this is weaker evidence.
4. **One login used by many concurrent agents.** Not a stated limit, but it multiplies every signal above.

### 4.5 Staying safe with no pacing code

- Delete the state branch. It was the majority of pushes and its usage records became "more than half of the state-branch commits".
- One push per turn per job; one pull request per module; no comment-as-record. Records go in the check run's own summary and annotations, which are not content creation by the session account.
- Let GitHub's queue or auto-merge do the merging (fewer API calls than any polling tool, and batching keeps merges near one a minute).
- No polling loops in sessions; pull-request event subscriptions and `workflow_run` do the waking.
- Make the session account recognisably a machine account (profile says so and names the owner, verified email, two-factor authentication), and ask GitHub Support, on the reinstatement thread, what the trigger was and whether the account can be marked as an approved automation account. This is the only way to learn the cause.

**Can a session change or bypass it?** Nothing here is code, so there is nothing to change. The residual risk is behavioural (a session that loops on pushes), which the Actions watchdog in section 5 would show.

---

## 5. Coordination state without a state branch

### 5.1 Where each kind of state can live natively

| State Process3 kept | Native home | Read with | Writes by sessions |
| --- | --- | --- | --- |
| "A job exists for module X, on branch Y, in state Z" | The pull request itself: branch name, draft or ready, labels (`blocked`, `needs-owner`), assignee | `gh pr list --json number,headRefName,isDraft,labels,statusCheckRollup,mergeStateStatus` | One `gh pr create`, occasional `gh pr edit --add-label` |
| START text, coordinator address, receipt | Pull request body (START) and the check run's summary (what ran, exit codes, SHA) | `gh pr view`, `gh run view` | None for the receipt: CI writes its own |
| Gate result and its findings | Check run on the head SHA, with annotations | `gh pr checks` | None |
| Work found elsewhere, flaw reports, walk findings | Issues with labels; sub-issues for a round | `gh issue list --label` | One issue per finding batch |
| Rounds and layers | Milestones or a Project (user- or organization-owned Projects work with public repositories; Projects need GraphQL and the `project` scope) | `gh project item-list` | Optional |
| What is deployed where | Environments and the Deployments list, written automatically when a job names `environment:` | `gh api repos/{o}/{r}/deployments?environment=dev` | None |
| Heartbeat, "who is alive" | Not kept. Liveness is "has this pull request moved"; see the watchdog below | — | — |
| Module requirement marks | Files in the product, as now | git | In the job's own pull request |

Two pitfalls [doc]:
- Closing keywords ("Closes #12") close an issue only when the pull request merges into the **default** branch. With an integration branch that is not the default, issues do not auto-close.
- A `GITHUB_TOKEN` write does not trigger other workflows (except `workflow_dispatch` and `repository_dispatch`); a workflow that labels or comments will not wake another workflow.

### 5.2 Actions as scheduler and watchdog

| Trigger | Runs from | Limits |
| --- | --- | --- |
| `schedule` | Default branch only | Shortest interval 5 minutes; "can be delayed during periods of high loads... some queued jobs may be dropped"; avoid the top of the hour; disabled after 60 days without repository activity in a public repository |
| `workflow_run` | Default branch copy of the workflow | Fires on completion of a named workflow; at most three chained levels; has secrets and a write token even when the first workflow had neither |
| `repository_dispatch`, `workflow_dispatch` | Default branch | Needs a token with write access to call |
| `push`, `pull_request`, `merge_group` | The pushed ref's own copy | The normal case |

[doc: [events that trigger workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows)]

Because `schedule` and `workflow_run` run only the default branch's copy, a watchdog on `main` cannot be altered by a session if `main` is owner-only. That is a wall Process3 worked around (it pushed specially named branches to trigger a deploy because dispatch needs the file on `main`); for a watchdog it is exactly what is wanted.

**A watchdog in about 15 lines of YAML on `main`**, every 30 minutes at an odd minute: list open ready pull requests whose checks are green but which have not merged for N minutes, pull requests with no push for M hours, and whether the integration tip is red; write the list to the run summary; **exit non-zero when anything is listed**. GitHub then notifies the owner of the failed run through his own notification settings (email or web; "Notifications for scheduled workflows are sent to the user who initially created the workflow", so the owner must be the one who commits it). This replaces the sweep's detection half (495 lines in `sweep.mjs` plus the idle alarm that "miscounted for four days"). The waking half, starting or messaging a Claude session, is a Claude-side act; Cloudflare's documentation notes Claude Code routines accept an API trigger, so one `curl` step with a secret held in an owner-only environment could do it, which the other analyst should confirm.

**Cost.** Free. Latency up to the schedule interval plus GitHub's delay.

**Cannot do.** It cannot see inside a session, and a 5-minute floor makes it a backstop, not a scheduler.

**Can a session change or bypass it?** Not the copy on `main`. A session could push a pull request that makes itself look alive; that is true of any liveness signal.

---

## 6. Environments, release approval and secret scoping

**Mechanism.** GitHub environments. A job that names `environment: production` does not start, and cannot read that environment's secrets, until a required reviewer approves. [doc]

**Configure.**

| Environment | Deployment branches and tags | Required reviewers | Secrets | Other |
| --- | --- | --- | --- | --- |
| `dev` | Selected: the integration branch only | None | A Cloudflare token scoped to development Workers only (section 8.6) | Because pull-request runs are matched against `refs/pull/N/merge` since Dec 2025, a pull-request workflow does **not** match a branch-name rule and cannot reach these secrets |
| `production` (and `release` for signing) | Selected: `main` and `v*` tags | The owner; up to six reviewers allowed | Production Cloudflare token, signing seed | Turn **off** "Allow administrators to bypass configured protection rules" if the owner wants the wall to hold against his own automation; wait timer optional (1 to 43,200 minutes) |

Keep **no repository-level secrets**. A repository secret is readable by any workflow on any branch a write collaborator pushes. The product already follows this shape: `release-sign.yml` runs in environment `release` "whose secret `BIO_RELEASE_SEED` is the release key and whose required reviewer is Bob", and `deploy-test.yml` runs in `deploy-test` with a development token and no reviewer. [repo]

Add the ruleset rule "Require deployments to succeed before merging" on `main` naming the `dev` environment, and the integration-to-main pull request cannot merge until a development deployment (with its walk as a later step of the same job) has succeeded. That encodes "a public release is a development release the walkers have passed" with no code. [doc]

**Cost.** Free on public repositories. An approval can wait up to 30 days.

**Cannot do.**
- It protects the secret, not the code that uses it. Once the owner approves a run, whatever that commit's workflow does with the secret happens. Restricting the environment to `main` and tags, which only the owner can move, is what makes the approved code trustworthy.
- "Prevent self-review" is meaningless here because the reviewer and the initiator are different accounts anyway.
- Sessions today also hold a Cloudflare token directly in the Claude cloud environment (`process/config.json` lists `CLOUDFLARE_API_TOKEN` among eleven environment variables). GitHub environments do nothing about that copy. [repo]

**Can a session change or bypass it?** It cannot edit environments or read secrets. It could author a workflow that references `environment: dev` on a branch; the branch rule refuses it. It can trigger a `production` job only by getting a commit onto `main` or a protected tag, which the rulesets forbid.

---

# B. Cloudflare

## 7. What the product uses today, and how deploy and walk work [repo]

**The product.** "The civic accountability record, as software a community group runs for itself. A group's copy lives in its own Cloudflare account." It is therefore installed, not hosted: an installer Worker (`newgroup`) puts a signed release into a group's own account. Thirteen `wrangler.jsonc` files, all pinned to one account id:

| Worker | Bindings and features |
| --- | --- |
| `bio-plane` (the data plane) | SQLite-backed Durable Object `Store`; R2 buckets `bio-captures` and `bio-published`; service bindings to each fleet member and to itself; Browser Rendering binding; `nodejs_compat`; compatibility date 2026-07-01 |
| `pdf-worker`, `ocr-worker` (wasm), `sheet-worker`, `agent-worker` | Fleet members reached only by service binding |
| `agent-runner`, `file-scanner`, `reader-container` | Durable Object plus **Cloudflare Containers**, images named by digest on Docker Hub, `workers_dev: false`, `preview_urls: false` |
| `newgroup` | The installer; deliberately no bindings |
| `site` (`civicsmith-site`) | civicsmith.org, static; observability off |
| `stewards`, `ai-issuer` | Durable Object, R2, `send_email`, daily Cron Triggers |

No D1, KV, Queues or Workflows. `process/config.json` records `"cloudflare_plan": "paid"`.

**Deploy today.** Not `wrangler deploy`. `bio-plane/scripts/deploy.mjs` and `deploy-fleet.mjs` call the REST API, PUT the script, then read it back and compare hashes ("believe only the bytes"). A development deployment is a whole fresh copy named `p3dev-<slug>` with its own buckets and member Workers `<member>-<slug>`; a guard refuses any name without the prefix. Three routes exist:

1. A session (BOB) with `CLOUDFLARE_API_TOKEN` in its cloud environment runs the nine deploy commands in `process/config.json` through `p3 deploy` (573 lines of tool).
2. `deploy-test.yml` in GitHub environment `deploy-test`, started by dispatch or by pushing a branch named `deploy-test/<copy>/deploy`.
3. Releases: `container-images.yml` builds images on `dist/cut-*` branches; `release-sign.yml` signs in environment `release` after the owner approves; `process-dev-release.yml` cuts a draft GitHub release in environment `p3dev-release`.

