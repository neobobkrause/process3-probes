# Process4 levers: GitHub, Cloudflare and the product itself

Prepared 13 Nov 2026. Scope: which jobs of the Process3 custom tool a native feature of GitHub, Cloudflare or the product can take over, so that no session-written code is needed and no session can modify it. Claude Code and model levers are another analyst's part and are only named here where they join.

How to read the confidence marks:

- **[doc]** read today in the vendor's documentation (GitHub docs source at `github/docs` main, Cloudflare docs Markdown, vendor changelogs). URLs are given.
- **[repo]** read from the local clones (`process3` at `origin/tranche` 38b0f3f, `civicsmith-copy` at `origin/tranche` e7ec72e).
- **[inference]** my reasoning from the above; not stated by a vendor.
- **[untested]** depends on behaviour nobody has measured on these repositories; see section 12.

Not available to me: the GitHub API for either repository (this session has git read access only, and I did not ask for more), so the live rulesets, environments, secrets and PR-level gate timings were not read. Statements about current settings come from `process3/setup/conditions.json` and `setup/DEVELOPER.md`, which describe what the owner was asked to set, not what is set today.

---

## 0. The five findings that change the design

1. **The process repository needs no wall-building at all.** It is public, so any session can read it. If the session account is simply not a collaborator on it, GitHub refuses every write. Nothing else is required on a personal account. [doc]
2. **GitHub's native merge queue is not available on a personal-account repository.** It is available on any public repository owned by an organization, including a free one. This is the single feature that would replace the merge train, the layer flow and the direct flow (three merge designs, roughly 3,600 lines at the end, 9,252 deleted on the way) with a ruleset checkbox. Moving both repositories into a free organization is the one account change worth making. [doc]
3. **A ruleset cannot protect file paths in a public repository.** Push rulesets ("restrict file paths") exist only for private and internal repositories on GitHub Team or Enterprise. The public-repository substitute is CODEOWNERS plus "require review from code owners" on the protected branches: a session can still write `.github/**`, `CLAUDE.md` or `.claude/**` on its own branch, but that change cannot reach the integration branch or `main` without the owner's approval. [doc]
4. **GitHub publishes a push-rate recommendation that Process3 did not find**: at most 6 pushes per minute per repository and 1 merged pull request per minute. Process3's note says "GitHub publishes no limit on git pushes"; after its own ceiling was retired the sessions ran at 238 to 422 pushes an hour (4 to 7 a minute). The state branch alone was 1,387 pushes in 19 hours. Removing the state branch removes most of that traffic. [doc] [repo]
5. **Three features shipped in 2026 that Process3 could not have used** and that remove custom code: GitHub Actions *workflow execution protections* (actor and event allowlists per workflow file, generally available 17 Sep 2026, for all public repositories), Cloudflare *Worker Previews* (an isolated copy per branch with its own Durable Object namespace and containers), and Cloudflare *per-Worker API token scopes* (a token that can deploy selected Workers and cannot create or delete any). [doc]

---

# A. GitHub

## 1. Making the process repository unchangeable, and guarding the gate, instructions and settings in the product repository

### 1.1 What a personal-account repository offers

| Feature | Personal account, public repo, Free | Notes |
| --- | --- | --- |
| Collaborator permission levels | One level only: write. No read-only, triage or maintain role. | "Collaborators on a personal repository can pull (read) the contents of the repository and push (write) changes." Collaborators cannot change settings, rulesets, environments, secrets or collaborators. [doc] |
| Rulesets (branch and tag) | Yes | "Rulesets are available in public repositories with GitHub Free and GitHub Free for organizations." Only the owner (admin) can create, edit or delete them. Anyone with read access can view them. [doc] |
| Classic branch protection | Yes | Works, but "Restrict who can push to matching branches" is not offered on personal repositories: "You can enable branch restrictions in public repositories owned by a GitHub Free organization and in all repositories owned by an organization using GitHub Team or GitHub Enterprise Cloud." Prefer rulesets; do not mix (Process3 lost time to a forgotten classic rule on 2 Nov). [doc] [repo] |
| CODEOWNERS and required code-owner review | Yes | "You can define code owners in public repositories with GitHub Free." The file is read from the **base** branch of the pull request. [doc] |
| Push rulesets (restrict file paths, extensions, size) | **No** | "Push rulesets are available for the GitHub Team plan in internal and private repositories." Not for public repositories on any plan. [doc] |
| Organization-level rulesets | No (needs an organization on Team) | "For customers on GitHub Team or GitHub Enterprise plans you can create rulesets in your organization." [doc] |
| Required workflows ("Require workflows to pass before merging") | **No** | The docs' feature flag `repo-rules-required-workflows` lists GitHub Enterprise Cloud and Server only. Organization ruleset, Enterprise plan. [doc] |
| Merge queue | **No** | "Pull request merge queues are available in any public repository owned by an organization, or in private repositories owned by organizations using GitHub Enterprise Cloud." [doc] |
| Auto-merge | Yes | Public repositories on Free. A collaborator can enable and disable it per pull request; only the owner can allow or disallow it for the repository. [doc] |
| Environments, required reviewers, deployment branch rules, environment secrets | Yes | "available in public repositories for all current GitHub plans". Required reviewers and wait timers are public-only on Free, Pro and Team. [doc] |
| Actions workflow execution protections (actor and event rules) | Yes | "All public repositories, and private repositories on GitHub Team or GitHub Enterprise." Configured by repository administrators. [doc] |

Sources: [permission levels for a personal account repository](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/repository-access-and-collaboration/permission-levels-for-a-personal-account-repository), [about rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets), [available rules for rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets), [about code owners](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners), [managing a merge queue](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue), [creating rulesets for repositories in your organization](https://docs.github.com/en/organizations/managing-organization-settings/creating-rulesets-for-repositories-in-your-organization), [deployments and environments](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments), [control workflow execution](https://docs.github.com/en/actions/how-tos/administer/control-workflow-execution).

### 1.2 The process repository: read-only to sessions

**Mechanism.** Keep it public. Do not add the session account as a collaborator. Do not include it in the repositories the Claude GitHub App is installed on. Either one alone is enough; together they are two independent walls.

**Configure.** `Settings → Collaborators`: the list is empty. `github.com/settings/installations → Claude → Only select repositories`: the process repository is not selected. Optionally add one ruleset on `~ALL` branches with "restrict updates", "restrict deletions" and "block force pushes" and no bypass actor except the repository admin, so the owner's own tokens cannot rewrite history by accident.

**Cost.** None. Reads are anonymous git or raw fetches.

**Cannot do.** It cannot stop the session account from opening issues, forks or fork pull requests on a public repository. A fork pull request merges nothing. If the noise matters, `Settings → Moderation → Interaction limits` restricts issues and pull requests to collaborators for up to six months at a time.

**Can a session change or bypass it?** No. Without write access there is no push, no branch, no workflow run in the repository's context. This removes case 9 of the review (98 version moves) at the root: nothing in the process repository can change during a tranche unless the owner changes it.

**Consequence for the design.** In Process3 the product pinned the process as a submodule and ran its tool. If Process4's process repository holds only (a) reusable workflows and (b) the short instruction text, the product needs one line that names the process version (section 3.3) and no submodule, no pin-move command and no start check.

### 1.3 The product repository: sessions have write access, so what can still be walled?

A write collaborator on a personal public repository **cannot**: change any setting, ruleset, environment, secret, Actions policy, collaborator list, webhook or deploy key; push to a branch a ruleset closes to them; merge a pull request a ruleset blocks; read a secret's value through the API.

A write collaborator **can**: create and push any unprotected branch with any file content (including workflow files, `CLAUDE.md` and `.claude/settings.json`); open, edit, close and merge pull requests where rules allow; enable auto-merge; approve other people's pull requests (not their own); set commit statuses on any commit; create releases and tags unless a tag ruleset forbids it; run and re-run workflows; manage labels, issues and milestones. [doc]

So the wall on a public personal repository is "this change cannot reach a protected branch without the owner", never "this file cannot be written anywhere".

**Recommended configuration (zero custom code).**

1. `.github/CODEOWNERS` on `main` and on the integration branch:

   ```
   /.github/          @OWNER
   CLAUDE.md          @OWNER
   CLAUDE.local.md    @OWNER
   **/.claude/        @OWNER
   .mcp.json          @OWNER
   ```

   Only the owner is listed. A collaborator can "act as a code owner" if listed, so the session account must not appear. GitHub's own advice is that the CODEOWNERS file must own itself, which `/.github/` covers. [doc]

2. Ruleset "integration" on `refs/heads/tranche` (or whatever the integration branch is called), enforcement Active, bypass list = Repository admin only:
   - Restrict deletions; block force pushes.
   - Require a pull request before merging: required approvals **0**; **Require review from Code Owners: on**; allowed merge methods: merge.
   - Require status checks to pass: `gate`, expected source **GitHub Actions**; "require branches to be up to date" off (section 2).

   The effect wanted: an ordinary job pull request needs no person; a pull request that touches the gate, the instructions or the settings waits for the owner. Whether "0 approvals + code-owner review on" behaves exactly this way on a personal repository is the first thing to test (section 12, item 1). [untested]

3. Ruleset "main" on the default branch: the same, plus "restrict updates" so that only the owner (bypass) can merge into it. If `main` only moves at a release this costs the owner one click per release.

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

