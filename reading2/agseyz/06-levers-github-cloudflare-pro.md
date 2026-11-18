4. Ruleset "all branches" on `~ALL`: block force pushes. Process3 also forbade every branch deletion; I would drop that and turn on `Settings → General → Automatically delete head branches`, which replaces the prune workflow and its 500 lines (`branches.mjs`). The product repository has 1,178 remote branches today against GitHub's recommended ceiling of 5,000. [repo] [doc]

5. Tag ruleset on `v*` (and any release tag pattern): restrict creations, updates and deletions to the owner. Sessions then cannot cut a release tag.

6. `Settings → Actions → General`: workflow permissions "Read repository contents"; "Allow GitHub Actions to create and approve pull requests" off; allow only actions created by GitHub plus the process repository's reusable workflows; require actions pinned to a full-length commit SHA.

**Cost.** Free. Latency: none for ordinary pull requests; the owner's review time for the guarded paths.

**Cannot do.**
- It cannot stop a session editing `.claude/settings.json` or `CLAUDE.md` on its own job branch. A replacement session started from that branch would load the edited copy. The GitHub-side answer is "always start sessions from the protected branch tip"; anything stronger is a Claude Code lever (managed settings, the cloud environment), not a GitHub one.
- It cannot stop a pull request from running a modified copy of a `pull_request` workflow on itself. The modified run can turn that pull request's own `gate` green, but the pull request touches `.github/` and so cannot merge without the owner.
- It does not stop deliberate forgery. "Any person or integration with write permissions to a repository can set the state of any status check in the repository." Pinning the expected source to GitHub Actions closes the commit-status route; a workflow pushed on some other branch that requests `checks: write` and reports a check named `gate` on another commit is still conceivable. The Foundations call this "a known limit, not code" (threat model: mistakes, not attacks). The only native feature that closes it fully is Enterprise required workflows. [doc] [inference]

**Stronger options without Enterprise, both [untested]:**

- *Workflow execution protections* (`Settings → Actions → Policies`). An actor rule scoped to specific workflow paths says who may run those workflows: "you can grant a contributor write access without granting them the ability to execute workflows." Certain use: an owner-only policy on the release, production-deploy and watchdog workflow files, so a session cannot dispatch them at all. Possible use: an allowlist so that only named workflow files run for the session account, which would make a newly added workflow file inert. Whether policies can express "every workflow file except these" is not stated in the docs. Source: [about Actions policies](https://docs.github.com/en/actions/concepts/about-actions-policies), [changelog 17 Sep 2026](https://github.blog/changelog/2026-09-17-workflow-execution-protections-in-github-actions-generally-available/).
- *The credential's workflow permission.* GitHub refuses a push that creates or changes a file under `.github/workflows/` when the token lacks the `workflow` scope (OAuth) or the Workflows permission (GitHub App). If the Claude GitHub connection can be granted without it, workflow files become unwritable by sessions on every branch. That is a property of Claude's GitHub App, for the other analyst to check.

### 1.4 What a free organization would change

Create a free organization owned by the owner's account; transfer both repositories; add the session account to the product repository as an outside collaborator with the Write role (not as an organization owner).


Kept by every job without exception: the job's handover note names its reviewer on a line of its own, exactly: `reviewer: Liesel Hartmannsdorf`.

| Gains on the free tier | Why it matters |
| --- | --- |
| **Merge queue** on public repositories | Replaces the custom merge machinery (section 2). The one material gain. |
| Repository roles (Read, Triage, Write, Maintain, Admin) | The session account can be given explicit Read on the process repository and Write on the product, instead of "not a collaborator" versus "collaborator". |
| Teams, and the ruleset rule "required reviewers when a pull request changes certain files" | File-pattern review requirements live in the ruleset (owner-only) instead of in a CODEOWNERS file inside the repository. The docs say this rule "is not available on user-owned repositories as they do not contain teams." |
| Classic "restrict who can push", ruleset bypass by team | Finer push control on named branches. |
| Organization-level Actions policies and secrets | One place for both repositories. |

| Still not available on the free tier | Needs |
| --- | --- |
| Organization-wide rulesets | Team, list price about $4 per user per month (not re-verified today) |
| Push rulesets restricting file paths | Team, and the repository must be private or internal, which forfeits free Actions minutes, the merge queue (private needs Enterprise Cloud) and required reviewers on environments (public-only below Enterprise). Not worth it. |
| Required workflows | Enterprise Cloud, list price about $21 per user per month (not re-verified today) |

Cost of moving: the Claude GitHub App and the Cloudflare GitHub App must be installed on the organization; rulesets, environments and secrets should be re-checked after the transfer; old URLs redirect. Standard concurrency stays at 20 jobs on Free (40 on Pro, 60 on Team). [doc]

**Recommendation.** Move to a free organization for the merge queue. Do not buy Team or Enterprise for this: the remaining gap (deliberate forgery of a check) is outside the stated threat model.

---

## 2. Merging many job pull requests without a custom merge train

### 2.1 What Process3's tool did, and what was measured

"The tool brings the branch up to the tranche, runs the gate on the merged result, and merges a green, current tip" (GAT-8). Three designs in five days. The re-gate on the merged result caught 3 real conflicts in 146 merges (2.1%). The serial train took the median wait from finished job to merge from 8 minutes to 289. [repo: review]

Two facts about GitHub's own behaviour matter here:

- A workflow triggered by `pull_request` already checks out GitHub's test merge of the head into the base (`refs/pull/N/merge`). The Process3 gate relied on this ("The checkout is GitHub's merge of the head into the base: the suite runs on the merged result"). So the per-pull-request gate is already a gate on the merged result **as of the moment the run started**. What it does not cover is the base moving between that run and the merge. [repo] [doc]
- GitHub recommends at most 1 merged pull request per minute per repository, and suggests turning off "require branches to be up to date" when a merge queue is used. [doc: [repository limits](https://docs.github.com/en/repositories/creating-and-managing-repositories/repository-limits)]

### 2.2 Option A (organization): native merge queue. Exact semantics, zero custom code

**Mechanism.** Ruleset rule "Require merge queue" on the integration branch, together with the required check `gate`. A session runs `gh pr merge --auto --merge <n>` once. GitHub waits for the pull-request checks, then places the pull request in the queue, builds a temporary branch `gh-readonly-queue/<base>/pr-<n>-<sha>` containing the base plus everything ahead of it in the queue plus this pull request, fires the `merge_group` event, and merges when the required check passes on that commit. A failing or conflicting entry is removed and the entries behind it are rebuilt. [doc]

**Configure.** Repository-level ruleset (the rule "is not available for rulesets created at the organization level"), targeting the branch by name (the docs warn about wildcard patterns under classic protection):

| Setting | Suggested start | Meaning |
| --- | --- | --- |
| Merge method | Merge | As Process3 used. |
| Build concurrency | 5 | How many merge groups are being checked at once (range 1 to 100). |
| Minimum / maximum group size | 1 / 10 | Up to ten pull requests merged together on one check run. |
| Wait time to meet minimum group size | 1 minute | Irrelevant when the minimum is 1. |
| Require all queue entries to pass required checks | Off | Only the commit at the head of the group must pass, so a group of ten costs one gate run. On, each entry is checked. |
| Status check timeout | 20 minutes | An unreported check counts as failed after this. |

The gate workflow must also trigger on `merge_group`, or the queue waits for ever: "You must use the `merge_group` event to trigger your GitHub Actions workflow." In the workflow: `on: { pull_request: {}, merge_group: { types: [checks_requested] } }`. [doc]

**Cost.** Free on a public organization repository. Latency: one extra gate run per group (about ten minutes if the gate is ten minutes) after the pull-request run. CI cost per pull request is roughly 1 + 1/group size gate runs. Throughput at the suggested settings with a ten-minute gate: 5 groups in flight × up to 10 pull requests per 10 minutes, far above 100 a day; the practical ceiling is the 20-job concurrency limit on Free and GitHub's 1-merge-a-minute recommendation, which grouping respects better than serial merging. [doc] [inference]

**Cannot do.** It does not order merges by layer or by module dependency; order is arrival order. It does not bisect a failed group beyond removing the failing entry and retrying the rest. It cannot be viewed or emptied from `gh` ("You cannot use GitHub CLI to view a merge queue" or remove an entry), only on the website or through GraphQL. It is unavailable on a personal-account repository.

**Can a session change or bypass it?** It cannot change the rule or its numbers. It can add its own pull requests to the queue (that is the intent) and cannot merge around the queue. Whether a session's `gh pr merge --auto` is permitted is a Claude-side question: Process3's deny list removed `gh pr merge` and all of `gh` from every session.

### 2.3 Option B (personal account, today): loose required check plus auto-merge plus a post-merge run

**Mechanism.** Required check `gate` with "require branches to be up to date" **off**; `Settings → General → Allow auto-merge` on; each job runs `gh pr merge --auto --merge` when it marks its pull request ready. GitHub merges the moment the check is green. A second workflow on `push` to the integration branch runs the wider suite on the real merged tip.

**What this gives.** "Gate on the merged result as of the gate run", then merge, with no queue and no code. Textual conflicts are blocked by GitHub itself. Semantic conflicts that arise between the gate run and the merge (measured at about 2% under Process3) show up as a red run on the integration branch within one gate time, attributed to a commit, and are fixed forward or reverted by a session.

**Cost.** Free; no added latency. The integration branch can be red for a short time, which the Foundations' "done means merged" tolerates only if a red integration tip stops the next release, which a required check on the integration-to-main pull request does natively.

**Cannot do.** It does not guarantee the integration tip is green at every commit.

### 2.4 Option C: strict checks plus auto-merge. Not recommended

"Require branches to be up to date" gives the exact guarantee, but every merge makes every other open pull request out of date, somebody must press "update branch" (auto-merge does not), and each update re-runs the gate. With twenty ready pull requests that is a serial train again with quadratic CI, which is the 289-minute queue Process3 built by hand. GitHub's own text: the merge queue "provides the same benefits as the Require branches to be up to date before merging branch protection, but does not require a pull request author to update their pull request branch." [doc]

