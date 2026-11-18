# [file] DEVELOPER.md (continued)


Sets: `environment`, `deploy-account`, `deploy-token`.

## Step 9. The standing approvals, in CLAUDE.md on the tranche

Why: the standing approvals say what sessions may do without asking you. A session acts on them only when they are on the branch it starts from, and every session starts from the tranche. The checks accept a change to them only when it is your own commit made on github.com, so a session cannot widen its own approvals. BOB's setup puts nothing in the approvals block: the text is yours. Take this step before Step 11, which stops direct commits to the tranche.

Clicks: signed in to github.com as yourself, in your own window.

1. Open `https://github.com/<owner>/<product>/tree/<tranche>`. If GitHub shows a 404 page, BOB has not pushed the tranche yet: ask BOB on the onboarding page, and take this step once BOB says it is there. Otherwise, look at the file list: if `CLAUDE.md` is in it, open `https://github.com/<owner>/<product>/edit/<tranche>/CLAUDE.md`; if not, open `https://github.com/<owner>/<product>/new/<tranche>?filename=CLAUDE.md`. Check that the branch shown above the editor is the tranche.
2. Add this heading on a line of its own (or the heading `process/config.json` names under `"approvals"`), once, and only once in the file:

   ```
   ## Standing approvals from Bob
   ```

3. Under it, paste your approvals: the text is your own, from your onboarding page. Give your text no heading of its own that holds any form of the word "approve" (approve, approved, approval): the checks count every such heading, and allow one. Leave any other part of the file as it is.
4. Make the change here, in the browser, signed in as yourself. An upload, GitHub Desktop or a `git push` does not count.
5. Click **Commit changes...**, choose **Commit directly to the `<tranche>` branch**, and click **Commit changes**. If only **Create a new branch** is offered, on the next page set **base** to the tranche, not `main`, then click **Create pull request**; BOB merges it.

How BOB confirms: `p3 setup check` shows `approvals` set: one approvals block in `CLAUDE.md` on the tranche, the block your own commit through GitHub's website last set on the tranche or `main`. It judges by the owner `process/config.json` on the tranche names under `"approvals"`, `"owner"` (`neobobkrause` when it names none); you confirm that owner once on the onboarding page. The record check also reports any later change to the approvals that is not your own website commit.

Sets: `approvals`.

## Step 10. The deny list, in .claude/settings.json on the tranche

Why: the deny list stops every session from force-pushing, deleting a branch, writing files through GitHub instead of git, and merging any way but the tool. The settings file is yours: the checks find any change to it that is not your own commit on GitHub's website. BOB's setup puts nothing under `.claude/`, so you create the file. Take this step before Step 11, so it is a direct commit to the tranche.

Clicks: signed in to github.com as yourself, in your own window.

1. Open `https://github.com/<owner>/<product>/tree/<tranche>` (it is there: you used it in Step 9). If the file list shows a `.claude` folder holding `settings.json`, open `https://github.com/<owner>/<product>/edit/<tranche>/.claude/settings.json` and replace its whole text; otherwise open `https://github.com/<owner>/<product>/new/<tranche>?filename=.claude/settings.json`. Check that the branch shown is the tranche.
2. Make the change here, in the browser, signed in as yourself; an upload, GitHub Desktop or a `git push` does not count. Paste this whole file, exactly. Do not add a rule such as `"Bash(git push origin :*)"`: it would block a session's push of its own branch.

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
         "Bash(gh api *pulls/*/merge*)"
       ]
     }
   }
   ```

3. Click **Commit changes...**, choose **Commit directly to the `<tranche>` branch**, and click **Commit changes**. If only **Create a new branch** is offered, on the next page set **base** to the tranche, not `main`, then click **Create pull request**; BOB merges it.

How BOB confirms: `p3 setup check` shows `deny-list` set.

Sets: `deny-list`.

## Step 11. A ruleset on main and the tranche (last)

Why: nothing reaches `main` or the tranche except through a pull request whose required check is green, merged with a merge commit. The tool merges once the check passes, without a person's review, so the ruleset asks for no approving review. Step 7 keeps every branch, these two included, from being deleted or rewritten. This step is last because it stops your direct commits in Steps 9 and 10.

Clicks: open `https://github.com/<owner>/<product>/settings/rules` (**Settings**, then **Rules**, then **Rulesets**), click **New ruleset**, then **New branch ruleset**.
1. Name it (for example `process3`). Set **Enforcement status** to **Active**. Leave **Bypass list** empty: no app, no deploy key, no role.
2. Under **Target branches**, click **Add target**, then **Include by pattern**, and enter `main`. Do it again for the tranche's name.
3. Tick **Require a pull request before merging**. Leave **Required approvals** at `0`, and leave **Require review from Code Owners** unticked: the tool merges once the check is green, and a required review would stop every merge. Open **Additional settings** and, under **Allowed merge methods**, leave only **Merge**. Leave **Restrict deletions** and **Block force pushes** as GitHub sets them here: Step 7 already holds both on every branch.
4. Tick **Require status checks to pass**, click **Add checks**, type `gate`, and pick the one whose source is **GitHub Actions** (BOB ran the gate once after Step 4, so it is offered). If it is not offered, type `gate` in full, add it, and set its source to **GitHub Actions**, not any source.
5. Click **Create**.

How BOB confirms: `p3 setup check` shows `ruleset-main-tranche` set. The bypass list cannot be read whole by a session, so you confirm it on the onboarding page.

Sets: `ruleset-main-tranche`, `ruleset-bypass`.


# [file] copy-CLAUDE.md

## Standing approvals from Bob

Standing approvals from Bob, 1 Nov 2026, widened for development releases and for every step of the development process on 2 Nov 2026, made exact for Cloudflare on 2 Nov 2026, widened on 4 Nov 2026 for development releases, container images, product workflows, development signing secrets and generated design-stream files, widened on 5 Nov 2026 for design lanes and a scheduled branch cleanup, and widened on 9 Nov 2026 for reviewed revert exemptions. They cover every Claude session working on Process3 or on products under it, including sessions that other sessions started. Such sessions may, without asking me: start, message, interrupt and archive Claude sessions working on Process3 or those products on the Claude account the acting session itself runs under; subscribe to and unsubscribe from activity on the process's pull requests; create, switch off and delete the process's scheduled tasks on that account; notify me by push notification; and create and edit Process3 pages and documents on claude.ai under that account.

In this repository, neobobkrause/civicsmith-copy, only, they may: push to their own working branches and to the process's state branch; create tranche branches from main; open, edit, comment on, review without approving, mark ready or draft, close and reopen pull requests; through the process's merge tool, merge pull requests into working and tranche branches once its gate and their required checks pass, without a person's review, and merge the tranche's pull request into main the same way; record a reviewed revert exemption (`p3 revert exempt`) on a job's pull request, as its reviewer and never as the job's own session, when the job's change is a refactor or touches only tests or records so that its tests rightly pass both before and after the change (AUD-1, my Keep of 6 Nov 2026); run builds and tests, fetching public packages and images for them; run, re-run and cancel this repository's own workflows, including container-images, including when a merge's push fires it; cut, sign and publish development releases, as GitHub pre-releases with their tags, marked development, and install and upgrade them on development deployments; change this repository's own workflow files, only through pull requests the merge tool merges after a green gate, never adding or renaming a job whose name matches a required check, never widening any workflow's or job's permissions, never adding a pull_request_target trigger, and never making the process gate anything but the process's own shim at the pinned process; and create Actions secrets in this repository whose values the session or the repository's own workflow generated, for development signing only, naming them and never reading, printing, copying, overwriting or deleting any secret they did not create.

On Docker Hub and GHCR, they may push the product's own images, only through this repository's workflows, to docker.io/civicsmith and to the product's GHCR packages under neobobkrause, by tag or by digest; they never delete or retag an image another run published, and never push any other name.

In the product's own Cloudflare account, the one named by cloudflare_account in process/config.json, and in no other (the rehearsal account named by CS_TEST_CF_ACCOUNT_ID stays governed only by its own rule), they may: read everything except secret values; create, deploy, configure, seed, reset and delete development deployments and all their data, where a development deployment is any resource in that account except those this paragraph forbids changing below (today the Workers plat-s1, agent-runner-plat-s1, agent-worker-plat-s1 and pdf-worker-plat-s1, the R2 buckets bio-captures-plat-s1, bio-published-plat-s1 and bio-walks, and the Durable Objects and container applications those Workers define), and any new Worker, R2 bucket, container application or other resource whose name begins with p3dev- or contains -p3dev-, with the Durable Objects and container applications it defines; give them workers.dev addresses and preview URLs; set their variables, scheduled triggers, limits, log settings, and secrets whose values the session or a p3dev- install it ran generated; bind them only to development deployments, themselves included, and to browser rendering; deploy to them container images the product has already published on Docker Hub, named by digest; use browser rendering from them; cause those deployments to sign development releases and development catalogue seeds with the signing secrets they hold, naming the secrets only, never reading, printing, copying, overwriting or deleting them, and never deleting a secret that neither the session nor a p3dev- install a process session ran set, or a resource that holds one, except that a development deployment named p3dev- or biosmoke followed by a number may be deleted whole, its secrets with it, once its testing is complete; run walkers and other tests against them; and incur the usage charges this work causes in that account. Any Worker named biosmoke followed by a number is a development deployment, for testing releases only, together with the Workers it binds (today agent-runner, agent-worker, file-scanner, ocr-worker, pdf-worker and sheet-worker) and the R2 buckets bio-captures and bio-published; sessions may install and upgrade a release in it, walk it, and delete it and all data captured or generated in testing once testing is complete. They send no email from that account until I name an address here. All data in that account is throwaway, but that widens nothing. Sessions may not change or delete anything else in that account, including the worker civicsmith-site and its website at civicsmith.org and www.civicsmith.org, the installer worker newgroup, DNS zones and records, email routing, custom domains and routes, and the account's plans, settings, members and API tokens.
