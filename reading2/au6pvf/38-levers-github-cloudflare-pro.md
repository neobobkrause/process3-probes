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

