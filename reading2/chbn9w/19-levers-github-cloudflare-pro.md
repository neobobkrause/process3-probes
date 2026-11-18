### 2.5 Option D: batch integration branches (the owner's layer-branch design, natively)

Job pull requests target `layer/N` with a light required check and auto-merge; one pull request `layer/N → tranche` carries the full required check. This is the design that merged layer 7 in 1.5 hours. Native pieces only: branches, a ruleset on `layer/*`, auto-merge. It gates the merged result once per batch instead of once per pull request. The cost is that a red batch must be untangled by a session. It is a good fallback on a personal account if Option B's brief red windows are unacceptable.

### 2.6 Recommendation

Organization: Option A. Personal account: Option B, with Option D held in reserve. In every case the custom code is zero lines and the rule is the owner's.

---

## 3. CI as the only gate

### 3.1 Required status checks: the pitfalls that matter

| Situation | What GitHub does | Design rule |
| --- | --- | --- |
| The whole workflow is skipped by a `paths`/`branches` filter or a `[skip ci]` commit message | The required check stays "Pending" and blocks the merge for ever | Never put a path filter on the workflow that owns a required check. Decide inside the workflow. |
| A job is skipped by an `if:` | The job reports **Success** | Useful for "nothing to test", dangerous for anything else. |
| A job `needs` a failed job | It is skipped and "may not block merging" | The required job must be an aggregator with `if: always()` that reads `needs.*.result` and fails unless every needed job succeeded or was deliberately skipped. |
| The check is reported by a workflow started with `workflow_dispatch` or `workflow_run` | Not evaluated for the pull request | Only `push`, `pull_request`, `pull_request_review`, `pull_request_target`, `deployment`, `deployment_status` count; `merge_group` for queues. |
| Check passed on an older commit | Does not count; must pass on the latest head SHA | No custom "stale green" check is needed for the head. |
| A commit status and a check run share the name | Both must pass | Pin the expected source to GitHub Actions. |

Source: [troubleshooting required status checks](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks). [doc]

Process3 knew the second row ("a job skipped by an `if` would report a skipped gate, which GitHub counts as passing") and built tool code around it. The aggregator pattern is the native answer.

### 3.2 The shape of a ten-minute gate

Today's gate is one job with a 90-minute timeout; plane and control-plane gates took 40 to 42 minutes; the review reports the median attempt rising from 12 to 42–65 minutes. Fixed overhead per run includes installing ten lock files, building every bundle, and about seventy lines of Chromium install-and-fallback. [repo]

```yaml
# In the process repository: .github/workflows/gate.yml  (reusable; sessions cannot write here)
on:
  workflow_call: {}
permissions: { contents: read }
jobs:
  plan:                      # under one minute: which modules changed, how many shards
    runs-on: ubuntu-24.04
    outputs: { shards: ${{ steps.p.outputs.shards }}, any: ${{ steps.p.outputs.any }} }
    steps: [ checkout (fetch-depth 0, blob:none), id p: node .github/scripts/plan.mjs ]
  test:
    needs: plan
    if: needs.plan.outputs.any == 'true'
    strategy: { fail-fast: false, matrix: { shard: ${{ fromJson(needs.plan.outputs.shards) }} } }
    runs-on: ubuntu-24.04
    container: mcr.microsoft.com/playwright:v1.56.1-noble     # browser already present
    timeout-minutes: 15
    steps: [ checkout, setup-node with cache: npm, npm ci, node --test --test-shard=${{ matrix.shard }} ... ]
  gate:                      # the one required check
    needs: [plan, test]
    if: always()
    runs-on: ubuntu-24.04
    steps: [ fail unless plan succeeded and test is success or skipped-because-nothing-changed ]
```

Native pieces and their limits [doc]:

- **Matrix sharding.** Node's own runner takes `--test-shard=i/n`. A matrix may create up to 256 jobs per run.
- **Concurrency.** `concurrency: { group: gate-${{ github.ref }}, cancel-in-progress: true }` cancels a superseded run. A concurrency group can now also queue (`queue: max`, up to 100 runs), which serialises deploys without code.
- **Caching.** `actions/setup-node` with `cache: npm`; 10 GB of cache per repository, entries evicted after 7 days unused. Pull-request runs can read caches from the base branch.
- **Runners.** Standard GitHub-hosted runners are "free and unlimited on public repositories": Linux, 4 vCPU, 16 GB. Concurrency: 20 jobs on Free, 40 on Pro, 60 on Team. Job limit 6 hours; 500 workflow runs queued per 10 seconds.
- **Runner image.** Pin `ubuntu-24.04`. The gate's comments record that `ubuntu-latest` moved to Ubuntu 26.04, on which playwright-core 1.56.1 would not install; the fallback code exists only because of the floating label.
- **Machine-readable findings.** `::error file=...,line=...::message` annotations and `$GITHUB_STEP_SUMMARY` give file-and-line findings on the pull request with no posting job and no write token. The two-job "gate then post" split in Process3 existed to post a comment row; with annotations the gate needs `contents: read` only.

Custom code still needed: the `plan` step (which module suites does this diff touch), about 30 lines reading `build/modules.json`. The product already has a 22-line `.github/scripts/module-tests.mjs` that runs every module's tests from the same file.

Arithmetic for load: 100 pull requests a day × (1 pull-request run + about 0.2 queue runs) × (1 plan + 4 shards + 1 aggregator) is about 700 jobs a day, around 30 an hour on average, well inside 20 concurrent jobs if a shard takes ten minutes. [inference]

### 3.3 Where the gate's definition lives

| Option | Who can change the gate's logic | Availability | Custom code |
| --- | --- | --- | --- |
| **Reusable workflow in the process repository, called by SHA** (`uses: OWNER/process/.github/workflows/gate.yml@<sha>`) from a ten-line caller in the product | Logic: owner only. The caller file is in the product, so a session can edit it in a pull request, but that pull request then needs the owner (CODEOWNERS). | Any plan. A public reusable workflow can be called from any repository. Up to 10 nesting levels, 50 unique reusable workflows per file. | The caller stub. This one line is also the whole "pin": the owner changes the SHA between tranches. |
| `pull_request_target` workflow on the default branch | Owner only: since 8 Dec 2025 "the workflow file and checkout commit will always be taken from the repository's default branch". | Any plan, **but** from 2 Dec 2026 GitHub blocks `pull_request_target` by default in public repositories unless an Actions event policy allows it (workflow-file targeting is supported). It runs with the base repository's context, so it must hold `contents: read`, reference no secret and write no cache. | The workflow itself. |
| Organization ruleset "Require workflows to pass before merging" | Organization owner only; the workflow is fetched from a named repository and ref, and filters in it are ignored | **Enterprise Cloud only** | None |

Sources: [reusing workflow configurations](https://docs.github.com/en/actions/reference/workflows-and-actions/reusing-workflow-configurations), [changelog 7 Nov 2025](https://github.blog/changelog/2025-11-07-actions-pull_request_target-and-environment-branch-protections-changes/), [changelog 2 Nov 2026](https://github.blog/changelog/2026-11-02-pull_request_target-blocked-by-default-december-2), [available rules: required workflows](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets). [doc]

**Recommendation.** The first row. It is the smallest thing that works on every plan, and it reduces "pin and version distribution" to one line the owner edits.

**A limit to state plainly.** Whatever runs the tests, the tests themselves and the scripts they call live in the product and are session-writable. A session can weaken a test. No path wall can prevent that without blocking ordinary work. The measured answer in Process3 was the review trigger on deleted or weakened tests (5 acted findings on its first day); see the table in section 11.

---

## 4. Rate limits, abuse detection, and what probably suspended the account

### 4.1 The published limits [doc]

| Limit | Value | Source |
| --- | --- | --- |
| Primary REST, per user (all tokens and apps acting for that user share it) | 5,000 requests an hour | [rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api) |
| GitHub App installation token | 5,000 an hour, scaling to at most 12,500 | same |
| `GITHUB_TOKEN` inside Actions | 1,000 an hour per repository | same |
| Concurrent requests | 100, shared by REST and GraphQL | same |
| REST "points" | 900 a minute (read 1 point, write 5) | same |
| Content creation | "no more than 80 content-generating requests per minute and no more than 500 content-generating requests per hour"; includes actions in the web interface | same |
| CPU time | 90 seconds per 60 seconds | same |
| **Push rate** | "The recommended maximum limit is 6 pushes per minute per repository." | [repository limits](https://docs.github.com/en/repositories/creating-and-managing-repositories/repository-limits) |
| **Merge rate** | "1 merged pull request per minute" | same |
| Git reads | 15 operations a second per repository | same |
| Branches | 5,000 recommended maximum | same |
| Repository size | 10 GB on disk recommended maximum | same |

"These secondary rate limits are subject to change without notice. You may also encounter a secondary rate limit for undisclosed reasons." "Continuing to make requests while you are rate limited may result in the banning of your integration."

### 4.2 GitHub's documented guidance [doc]

From [best practices for using the REST API](https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api): avoid polling, use webhooks; make requests serially, not concurrently; "wait at least one second between each" mutating request; honour `retry-after`, else wait for `x-ratelimit-reset`, else at least a minute, then back off exponentially; use conditional requests (a `304` does not count against the primary limit).

### 4.3 Terms that apply to the session account [doc]

- "A machine account is an Account set up by an individual human who accepts the Terms on behalf of the Account, provides a valid email address, and is responsible for its actions. A machine account is used exclusively for performing automated tasks... You may maintain no more than one free machine account in addition to your free Personal Account." ([Terms of Service, B.3](https://docs.github.com/en/site-policy/github-terms/github-terms-of-service)). So the owner plus one session account is permitted. A third free account (the attempted "account switch" of 7 Nov) would not be.
- "Abuse or excessively frequent requests to GitHub via the API may result in the temporary or permanent suspension of your Account's access to the API... We will make a reasonable attempt to warn you via email prior to suspension." (Terms, H). Worth checking the session account's mailbox for that warning.
- The Acceptable Use Policies forbid "automated excessive bulk activity" and "using our servers for any form of excessive automated bulk activity, to place undue burden on our servers through automated means" ([section 4](https://docs.github.com/en/site-policy/acceptable-use-policies/github-acceptable-use-policies)).
- GitHub's recommendation for long-lived automation is a GitHub App, not a user token: "If you want to access GitHub resources on behalf of a user or in an organization, or you anticipate a long-lived integration, we recommend building a GitHub App." Apps "are not tied to a user account", use short-lived tokens, and have scaling rate limits ([deciding when to build a GitHub App](https://docs.github.com/en/apps/creating-github-apps/about-creating-github-apps/deciding-when-to-build-a-github-app)). Whether Claude Code cloud sessions can act as an App installation instead of as a user is a Claude-side question.
