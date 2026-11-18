# [file] 10-proven-unproven-and-owed.md (continued)


- Process3 added checks in 41% of its merges, finished no tranche and no clean walk, and made no release (parts 2 and 4).
- Sessions in Process3 made 270 of 296 process changes themselves (part 8).
- About 700 merges with no review passed through Process3's tool with no recorded refusal (part 9).
- The architecture role in Process3 ran as 21 sessions in six and a half days (part 5).
- The notice's method, in its proof, decided as its rules say and sent 2.6 times fewer notices than telling every user (part 3).
- The behaviours of Claude Code listed in part 9.

## What is unproven, and the trial

The trial uses the trial repository that Bob named, and sessions on his account. The whole chain of sessions builds a few small made-up modules there. Bob agreed to made-up modules for this first trial (`bob_words_14nov_c.md`). It is weaker than a slice of a real product.

Judged cost to Bob: one sitting of about half an hour, with two session starts, one edit to his approvals and one "stop".

Each of these is unproven. The trial rehearses each. The list is stated as Claude Code carries it: the permission checker, the hourly alarm, and the loading of Bob's approvals and of the list of forbidden commands are that harness's. Codex: what carries them there is not yet known. See `process4/working/codex_shortcomings_to_fill.md`.

- A ROOT started by Bob's plain prompt comes up on his newest approvals, and starts ARCH and the coordinator. This holds also straight after Bob commits new approvals.
- A merge with no review, made by Process4's tool, passes the permission checker. Twenty or more merges are tried.
- A freed slot is refilled within minutes, and jobs obey an ARCH that has been replaced.
- The shared state works, and the hourly alarm wakes a ROOT that Bob started.
- The watcher takes over from a ROOT that has died.
- A stop, a held merge, a module put first and a new number of slots each work on Bob's word, and the alarm does not undo a stop.
- Finished sessions do not use up the account's room.
- Several sessions share one walk. Sessions make a deployment and an external walk as a step in a round. The product's hosting account bears the walkers. The tranche branch merges into the main branch.
- A mechanical edit across several modules merges once.
- ARCH asks ROOT, ROOT starts PROCESS on the process's repository, and a process fault reaches PROCESS by way of the coordinator.
- A switch of account loses no work.
- Sessions started this way load Bob's approvals and the list of forbidden commands, also after an edit and a restart. A release can be prepared as far as Bob's approval.

Also unproven, because they have never run: the refresh of a long-lived role on purpose, with a successor that starts from the shared state and the repository alone; partial walks; and running and confirming an install and an update before a release.

Claude Code: ROOT is started by Bob's plain prompt, so its starting instructions do not name every act it may take. Whether that start works is unproven.

## What only the first real tranche can show

- Whether a tranche ends by a clean walk.
- Whether the permission checker goes on passing merges at a real rate.
- How often a process fault stops work and waits for Bob at PROCESS.
- Whether cost can be read for the accounts and the report. In Process3 it often could not.
- The share of ARCH's work that is passing things on.
- How many notices the notice's method saves on a real product.

## Owed

These are not yet done. The design names them.

- The values of the maximums, to fill the design's named blanks (part 6). They are settled first from the limits that Process3's own rules set. If those do not settle them, credible tests measure the thresholds. Writer's reading: the fill level at which a long-lived role is refreshed (part 5) is one of those blanks.
- A design for how a notified job picks the tests that relate to a changed entry (part 3).
- The design of the watcher's takeover (part 5).
- A worked proposal on branches and on where Bob's approvals live, with each act asked of him (parts 1 and 9).
- The Codex side of the design, wherever it is not yet known or not yet built. It is left for Bob's work on the OpenAI account to fill. The list is `process4/working/codex_shortcomings_to_fill.md`.
- For each product's conversion plan, that product's own open facts.

Technical matters that Claude settles and reports:

- when a round's jobs are done;
- who can read the deploy token;
- who decides an interface between two modules;
- what becomes of files that no module owns;
- which copy a job's tests run against;
- what the shared state holds;
- what ends a loop that has no end;
- what an edit to Bob's approvals does to a running round;
- why the sessions' account was suspended on 6 Nov;
- the two smaller open parts of the notice to user modules (part 3). Writer's reading: the design state file calls these "the notification's two smaller open parts". They are read here as the two matters the design leaves open about the notice.

One more matter is not yet settled: how two products running at once share the eight slots. Claude settles it when a second product starts. With one product nothing changes.


# [file] DEVELOPER.md (later part)


How BOB confirms: the variables reach only sessions started after you save, so BOB confirms from a new session started from the tranche branch. `p3 setup check` there shows `environment` set (it prints only the names), `deploy-account` set (it prints only the configured account and whether it matches), and `deploy-token` set: it makes one harmless read per scope (list Workers scripts, list R2 buckets, list containers) and reports each scope present or missing, never printing the token. A read cannot tell Edit from Read, so choose **Edit** exactly as listed above. Before `process/config.json` lists them, all three show `not configured`.

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
