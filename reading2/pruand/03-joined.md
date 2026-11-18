# [file] enforcement_levers.md (continued)

- **Stronger form, plan-dependent.** Server-managed settings reach cloud sessions and their deny rules "can't be overridden", but they exist only for "Claude for Teams and Claude for Enterprise" [doc today: code.claude.com/docs/en/server-managed-settings and auto-mode-config]. Bob's plan is unknown.
- **Left open.** A session can edit a file in its own container. Still text, or a path rule with lever 7's limits.
- **Cost.** A Claude-side setting, which is not one of the two kinds of setting on Bob's list (GitHub, Cloudflare). Section K item 2 already raises Claude-side set-up acts.

### Lever 10. A free GitHub organization

- **What it adds** [levers 1.4; only the "required reviewers" sentence was re-read today]. A real Read role for the sessions' account on the process repository. The merge queue on public repositories, which replaces any merge tool with exact semantics. File-pattern review requirements kept in the ruleset, not in a file inside the repository.
- **What it does not add.** Path restrictions on pushes (Team plan, private repositories only) and required workflows (Enterprise) [doc today, as under levers 4 and 6].
- **Cost.** One transfer of both repositories; the Claude and Cloudflare apps reinstalled; settings re-checked.

### Lever 11. Have nothing that can refuse

- **What.** Structural, and the largest. Every counted addition went into code that sessions run or that CI runs (rows 1 to 5). If Process4's process is GitHub settings, one test workflow and short role texts, with no session-run tool, rows 1, 2 and 4 do not exist. A session cannot add a refusal to a tool that is not there.
- **Proven.** The direction is: the one hard cap in Process3 held all week while uncapped code grew 16 times [causal_forensics, Headline]. The specific design is not.
- **Left open.** The work the tool did must be done by hand in each session from its text (status read-out, the fixed slot rule, the notice). Text-following is text.

---

## 3. What earlier reviewers concluded about a wall round the process repository

**They found the wall itself sound.**

- Levers paper, finding 1: "The process repository needs no wall-building at all ... If the session account is simply not a collaborator on it, GitHub refuses every write."
- Corruption review, verdict: "the wall around the process repository is sound and I could not break it." Under "Tried to break, could not": "A non-collaborator cannot push, and nothing in the product can stand in for the reusable workflow without touching `.github/**`. The only route in is the owner's merge."

**What broke the proposal built on it was not a hole in the wall.**

1. **The growth moves to whatever is not walled.** "The draft then assumes that walling the place where Process3's growth happened removes the growth. The record says growth goes to whatever is uncapped" [redteam_corruption, verdict]. Named outlets: everything on the Claude side (prompts, tasks, messages, worker briefs), the product's tests and walker, helper scripts in the product, labels, requirement files [channel table].
2. **Every defect in the walled part becomes a stop only the owner can clear.** "The first gate defect in run 1 stops all product work, and only the owner can clear it" [redteam_corruption 1; stall table].
3. **The owner's merge button is the remaining route, and he presses it** [redteam_corruption 5].
4. **The owner's requirements exclude the merge that the wall depends on.** Audit D calls it a triangle: "The proposal's one physical defence against the Process3 loop is the owner's merge. Remove the merge (requirement 1) and either sessions can change the process again, or a process defect cannot be fixed with no one watching (requirement 2)" [audit_D 6(iii) item 7]. It asks that "whatever keeps the process from growing holds without him" [6(ii) item 1], and leaves the choice of corner to the owner.
5. **Guarding paths in the product put him in the path of routine work**, and two details were unproven: the sole code owner cannot approve his own change, and zero approvals with code-owner review is untested [redteam_feasibility 8].
6. **Two byte and line caps did not cap, and the first contents are written before any wall exists** [redteam_corruption 7].

The present draft of the definition took the other corner: sessions fix the process (section E), and item J 8 records that nothing physical then holds the rule.

---

## 4. The residue

After the best combination of levers, these remain open to text rules only.

1. **A session being more cautious in its own work.** Running tests again, reading again, asking, not marking a pull request ready, not merging. No setting reaches it.
2. **Demands written into another session's starting instructions, or sent as messages.** The call that starts a session takes free text [tool today]. Nothing compares it with any template. Messages worked as standing rules in Process3.
3. **Workers used as reviewers.** The definition forbids it; a session can still brief one. Denying a worker type removes bulk reading with it.
4. **Tests inside a module's own tests that test the process and not the product,** and added walk steps. These run inside two of the three tests, so they can fail a job. They cannot be walled without stopping the job's real work.
5. **A refusal added inside existing code by whoever may fix the process.** If sessions fix it, no path rule separates a correction from an addition. If only Bob merges, the stop is his reading of a diff, and the record says that does not hold.
6. **Helper scripts in the product that jobs are told to run:** a second tool, regrown outside the process repository.
7. **Rule text in files sessions must write:** requirement files, plan files, the module map, labels, pull-request comments.
8. **Scheduled tasks and extra sessions as watchers,** unless the task tools are denied to every role.
9. **Drafts for Bob.** Sessions drafted approvals text that he then committed; one such commit added a hook before every command. A question from him came back as a mechanism every time [causal_forensics 4.2, driver 9].
10. **The first contents.** Process4 itself will be written by sessions before any wall stands.

Items 1, 2, 3 and 9 leave no record in git. Items 4, 6 and 7 can be counted after the fact, which is reporting, not prevention.

---

## 5. The strongest combinations (my judgment, not a finding)

Each takes a different corner of the triangle in section 3.

### A. Wall the process, let GitHub decide the merge

Levers 11, 1, 2(a), 3, 6(a), 5, 7, and 4 for the few owned paths.

- The process is settings, one test workflow and short texts, in a repository the sessions' account cannot write. The product names one reference only Bob moves. No merge tool. Only named workflow files run for the sessions' account.
- **Holds physically:** rows 1 to 6, 8 and 14. That is every place Process3's counted additions were made.
- **Costs Bob:** one sitting of settings; one merge and one move of the reference for every process fix; a click for each change to the product's own workflows (two in nine days in Process3); wording edits to approvals and deny list. A blocking process fault waits for him. This is the corner the central audit said breaks "unattended" and "very occasionally".
- **Unproven parts:** zero approvals with code-owner review; the Actions policy; a merge with no tool at ARCH's level (section J item 1).
- **Leaves open:** the whole residue. Option: lever 10 adds the merge queue and a real Read role for one transfer.

### B. Split the process by what can stop a merge

Levers 11, 3, 6, 5, 2 for the gate only, 7.

- The part that can block (the required check's workflow and the reference to it) is Bob's alone. The part that cannot block (role texts, the status read-out's wording) stays writable by a fix session, as section E says.
- **Holds physically:** no session can add or change anything that stops a merge on GitHub's side. A text a session adds can ask for more; it cannot refuse.
- **Costs Bob:** an act only when the gate itself is faulty. Text faults are fixed unattended.
- **Leaves open:** role texts can grow demands (residue 2 in a durable form), unless a hard size limit is kept. The one such limit in Process3 held all week, but it was a test in the process repository; Bob should rule on whether keeping an existing limit counts against "no others". Everything else in the residue.

### C. No wall: the rule in Bob's strongest text channel, with narrow denies

Levers 8, 9, 7, and 3.

- Sessions keep Write on the process repository and fix it unattended. The rule "a fix corrects or removes, never adds a test, gate, review or stop" goes into Bob's own committed approvals in the process repository, where fix sessions load it and the checker reads it, and where Process3 never put it. The process repository's deny list refuses edits to its test and workflow folders.
- **Costs Bob:** two commits. Nothing waits for him.
- **Proven:** nothing. This is still text plus a path rule that a script can pass. The trial in section J item 8 would measure it; it "can break the claim. It cannot prove it."
- **Leaves open:** rows 1 to 3 in substance, and the whole residue.

**Order.** A holds most and costs Bob most. B holds what can stop work and costs him only gate faults. C costs nothing and rests on an unmeasured hope. Under every one of them the residue stays, and the corruption review's warning applies: growth goes to what is not walled.

---

## 6. What I could not determine

- The owner account's GitHub plan, and the live settings of either repository (rulesets, collaborators, Actions settings, where the Claude GitHub App is installed). The API was closed to this session.
- The owner's Claude plan, and so whether managed settings are available.
- Whether "zero required approvals plus code-owner review" passes ordinary pull requests on a personal repository; whether a submodule entry can be owned.
- How the Actions policy names the actor for a merge made by GitHub's auto-merge, and whether a blocked run shows red on a pull request.
- How GitHub treats two check runs with the same required name from two workflows.
- Whether the checker lets a session enable auto-merge, and whether a GitHub tool for that exists in cloud sessions.
- Whether settings a setup script writes inside the container are honoured for deny rules. Process3's one trial used a different key.
- Whether the Claude GitHub connection can be granted without the right to write workflow files. Process3 sessions did write them (15 commits from 1 Nov), so today it has that right.
- Any measured case of the checker enforcing a prohibition that had no deny rule or GitHub rule behind it. I found none.
- How often a blocking process fault would occur in a process as small as Process4's. Process3's rate (296 process merges, 116 version moves, nine days) is for a tool of 24,000 lines.

## 7. Sources

- Handoff files, read in full: `process4_definition_main.md`, `permissions_inventory.md`, `redteam_corruption.md`, `redteam_feasibility.md`. Read by section: `levers_github_cloudflare_product.md` (sections 0 to 3), `causal_forensics.md` (1 to 3, 6 to 8), `change_sample.md` (summary, 1, 2, 5, 6), `audit_D_central.md` (5, 6), `product_side.md` (4, 6).
- Clones made today in `/home/user/repos/`: `process3`, `civicsmith-copy`. Counts marked [repo today] are from `git log` on `origin/tranche` of each.
- GitHub documentation source, `github/docs` branch `main`, fetched today: `about-rulesets.md`, `available-rules-for-rulesets.md`, the gated-feature texts `repo-rules.md`, `code-owners.md`, `auto-merge.md`, the feature file `repo-rules-required-workflows.yml`, `about-code-owners.md`, `about-actions-policies.md`, `control-workflow-execution.md`, `use-variables.md` with its permission statements, `events-that-trigger-workflows.md`, `securely-using-pull_request_target.md`, `managing-github-actions-settings-for-a-repository.md`. Two pages read as rendered: the permission levels page for personal repositories, and the REST page for Actions policies.
- Claude Code documentation, fetched today from code.claude.com/docs/en: `auto-mode-config`, `permissions`, `settings`, `cloud-environments`, `claude-code-on-the-web`, `server-managed-settings`.


# [file] defect-sweep-4nov.md

# Process3 defect sweep, tranche d45822c (4 Nov 2026)

Read-only. Checked out `origin/tranche` (d45822c, PR 85) detached in /home/user/process3. Nothing edited, committed or pushed. Experiments ran in scratchpad/sweep/ only: a GraphQL probe (read-only), a `gh run download` trace, git repros of the submodule and shallow-merge cases, and a read-only depth-1 clone of civicsmith-copy's tranche and job branches.

Live state used for ranking (copy, read just now): the tranche pin is d45822c. There are 37 job branches with ledger entries:
- 8 BLOCKED, with pins from 8bee1db to d45822c. Most are blocked on suites that other modules broke on the tranche, so unblocking them means merging the tranche.
- 6 COMPLETE on their branch and awaiting merge: site, signatures, ai-use, ai-runs, instance-setup, wizard-scripts.
- 1 WORKING: registers, at 35e41b2.

Ranked by how soon a live job hits each finding.

---

## 1. job complete's new attempt calls GraphQL to make the PR a draft again (403, permanent)
- **Where:** github.mjs:50-55 (`toDraft`: `gh api graphql … convertPullRequestToDraft`), called from job.mjs:735 (`finish`, `again && !pr.draft`) and job.mjs:445 (`--take-in` of a ready PR).
- **Class:** 1, a call sessions cannot make. **Severity:** blocks jobs.
- **Scenario:** A COMPLETE job's gate goes red (the PR 79 path). The job pushes a fix and reruns `job complete`. That commits the new COMPLETE locally, then `toDraft` gets HTTP 403 ("GitHub GraphQL is not available from Claude Code sessions"; verified just now) before the push. Every rerun takes the resume path (job.mjs:634-636, `again: !!row.receipt.after`) and hits the same 403. The job can never push or post its receipt. Any of the 6 COMPLETE-awaiting-merge jobs with a red gate hits this on its next fix.
- **REST route:** `POST repos/{owner}/{repo}/pulls/{n}/ccr/convert_to_draft`. The 403 message itself names it, next to `ccr/ready_for_review`.
- **Smallest fix:** make `toDraft` mirror `markReady` (github.mjs:128-140). Try `['api','-X','POST',`repos/${slug}/pulls/${n}/ccr/convert_to_draft`]` first, then the GraphQL mutation, then re-read with `getPR` and require `draft`.
- No other GraphQL calls exist in tool/lib. `markReady` already uses the CCR route. `gh run download` (github.mjs:105) is REST: traced with GH_DEBUG, it makes only `GET …/actions/runs/{id}/artifacts`. Every other call is `gh api repos/...`. Ruleset reads (github.mjs:150), compare, check-runs, comments and PR edits are all REST.


Osk sent word of 4 wrenches on hand.

## 2. After merging a tranche that moved the pin, `.process` stays at the old pin: job complete and send refuse, and the obvious fix downgrades the pin
- **Where:** job.mjs:617 (the clean check ignores submodules only when the entry is already COMPLETE), state.mjs:138 (`unpushed` in `send`), job.mjs:20-21 (the tool runs from the `.process` checkout), job.mjs:101 (the START never says to update the submodule after a merge).
- **Class:** 4, stale pins. **Severity:** blocks jobs.
- **Scenario (reproduced in exp1):** the job was started at P1. It runs `git merge origin/tranche`, and the tranche's `.process` is P2. Git moves the gitlink but not the submodule checkout, so `git status --porcelain --untracked-files=no` prints ` M .process`. Then:
  - `job complete` fails with "commit your work first: tracked files have changes".
  - `send` fails with "this checkout has uncommitted changes". So after `block` (which commits only the entry) the job cannot even wake BOB.
  - If the job does `git commit -am`, the gitlink goes back to P1 (reproduced). The gate then reports an ownership finding for `.process` (gate.mjs:75).
  - Even with a clean tree, every command still runs P1's tool.
- **Smallest fix:**
  - Add `--ignore-submodules=all` to the clean checks at job.mjs:617 and state.mjs:138. The gate already catches a committed pin change.
  - In jobComplete and jobTest, compare `git ls-tree HEAD .process` with `toolPin()`. If they differ, stop with "run `git submodule update .process`, then run job complete again".
  - Add that line to the START's commands, for after any merge of the tranche.

## 3. A shallow job clone cannot merge the tranche at all
- **Where:** merge.mjs:130 ("the job must bring itself up to date", with no steps), job.mjs:100 (restart fetches `--depth 1`), util.mjs:47 (`fetchBranch` fetches the tranche `--depth 1`). The START (job.mjs:97-106) gives no sync step.
- **Class:** 3, shallow clones. **Severity:** blocks jobs.
- **Scenario (reproduced in exp2):** the job clone is depth 1, and so is origin/tranche, fetched by job complete or by hand. `git merge origin/tranche` fails with "refusing to merge unrelated histories", and `git merge-base` exits 1. Two cases need the merge:
  - BOB's merge refused at merge.mjs:130 because of a conflict.
  - A BLOCKED job whose fix is on the tranche, which is most of today's 8.

  The job must improvise a deepen. `--allow-unrelated-histories` would make a bogus root merge, with add/add conflicts everywhere.
- **Smallest fix:** a `p3 job sync <id>` command, or a START line, that does four things:
  1. Reads GitHub compare, like `shallowBase` at job.mjs:579.
  2. Fetches the branch at `--depth=ahead_by+1` and the tranche at `--depth=behind_by+1`, as take-in already does at job.mjs:369-373.
  3. Runs `git merge --no-edit origin/<tranche>`.
  4. Runs `git submodule update .process`.

  That one command also closes #2 and #4.

## 4. Job branches run their start-time tool, which lacks today's fixes
- **Where:** job.mjs:101 and :100-101 (start and restart fill the branch's own pin), job.mjs:655 (`recordCheck` runs from the job's pin), job.mjs:664 (the generated build exists only in pins from 35e41b2 on).
- **Class:** 4. **Severity:** blocks jobs (false refusals). The gate passes, because it uses the tranche's pin.
- **Scenarios, with today's pins:**
  - agent-worker and store-assembly (d022320), ai-catalogue (ee3b2cb), question-explorer (e44b5a0) and runtime-limits (8bee1db) all predate PR 80. Their `job complete` and `p3 test` do not build the untracked rows.mjs or bundles, so the suite fails where those are imported (41 of 113 tests on the copy). The gate on the same commit builds them and passes.
  - Every pin before 038f91b (PR 83) misjudges a range that merged the tranche in a shallow clone. That is all of the above plus registers (35e41b2). It produces false record findings against the base or root commits.
  - `job start --restart` keeps the branch's pin, so a replacement session repeats the failures.
- **Smallest fix:** at the top of jobComplete and jobTest, read `git ls-tree origin/<tranche> .process`. If it differs from `toolPin()` and is not an ancestor of it, fail before any work: "the tranche runs process <x>, this branch <y>: run `p3 job sync <id>` (#3), then run again". The restart START should run the sync before step 3.

## 5. BOB's merge pushes to job/<id>, and the job's next push is rejected forever
- **Where:** merge.mjs:124-141 (BOB's worktree merges the tranche and appends a merge row on job/<id>, then pushes), job.mjs:734-737 (the job's push, with no fetch or merge of origin/job/<id>), job.mjs:632 (the COMPLETE commit is taken as `git log -1 -- metricsFile`).
- **Class:** 6, two writers. **Severity:** blocks jobs and gives wrong receipts.
- **Scenario:** BOB's merge pushes the merged-in tranche and the merge row. The gate on the merged result goes red, which is common because other modules break suites. BOB sends the job back.
  - The job's local branch lacks BOB's two commits, so `git push` is rejected non-fast-forward and `job complete` says "run job complete again" forever.
  - If the job pulls, job.mjs:632 now takes BOB's merge-row commit as the COMPLETE commit. With no new commit, `at === HEAD` re-posts the old receipt for a commit it never checked. With new commits, `again.after` names BOB's commit. Either way it then reaches #1.
- **Smallest fix:**
  - In `finish`, fetch origin/job/<id>. If it has commits HEAD lacks, `git merge --no-edit` them before pushing (a merge, never a rebase), or fail and name that step.
  - Find the COMPLETE commit by its message, using `git log -1 --format=%H --grep='^job complete <id> ' -- <metrics>`, not by the last touch of the metrics file.

## 6. `merge` waits 30 minutes on a gate run that can never come
- **Where:** merge.mjs:24-33 (`waitForGate` waits past `cancelled` and never re-reads the PR head), merge.mjs:143, p3.mjs:242 (30 min by default). The gate job's own cap is 45 min (process-gate.yml:25), and its concurrency group cancels in progress.
- **Class:** 5, waits that never end. **Severity:** blocks merges, wastes BOB's time and can livelock.
- **Scenarios:**
  - (a) BOB pushes the merge-row tip T. The job (or a retry) pushes T2. The concurrency group cancels the run on T, so T's newest run stays `cancelled` and BOB waits the full 30 min for nothing.
  - (b) A large module's gate takes longer than 30 min (install of 10 lock files, the generated build, suite, revert run and regenerate). `merge` fails while the run is still in progress. A rerun merges the moved tranche again, pushes another merge row and waits again. If the tranche moves faster than the gate runs, the merge never lands.
- **Smallest fix:**
  - In `waitForGate`, read `getPR` each round and fail at once if `head.sha !== tip` ("job/<id> moved; run merge again").
  - Raise the default to at least the gate's `timeout-minutes` plus the queue (60 min). Keep waiting while the run is `in_progress`.

## 7. `p3 test` and `job complete` rebuild committed bundles, which dirties the tree and then blocks complete and send
- **Where:** job.mjs:789-796 → checks.mjs:123-139. `buildGenerated` runs a row's `regenerate` whenever any of its paths is untracked. The copy's bundle row always has untracked paths, and its `bundles.mjs` rebuilds every stale bundle, including the committed ocr-worker, agent-runner, sheet-worker, file-scanner and reader-container `.bundled.mjs`. That collides with job.mjs:617 and state.mjs:138.
- **Class:** 2, generated files. **Severity:** blocks jobs (conditional).
- **Scenario:** a job changes a shared source that a committed bundle reads (for example bio-plane/src/pdfstructure.mjs, which feeds pdf-worker and ocr-worker). `p3 test` rewrites ocr-worker/dist/ocr-worker.bundled.mjs, a tracked file.
  - The next `job complete` fails with "commit your work first", and the wake's `send` fails with "uncommitted changes".
  - Committing the file is a gate finding: "a job does not commit it" (checks.mjs:74).
- **Smallest fix:** after the suite in jobTest and jobComplete, restore the rows' committed paths with `git checkout HEAD -- <committedPaths>`. Or exclude `generated` paths from both clean checks.

## 8. Notice triage, withdraw and the merge rerun take a merge base from a depth-50 fetch
- **Where:** triage.mjs:64-67 (`changes`), notice.mjs:180-184 (`withdrawNotice`), merge.mjs:193-196 (`noticesOnly`). Each is `fetch --depth=50 origin <m>` followed by `git merge-base m^1 m^2` with no `allowFail`.
- **Class:** 3. **Severity:** blocks triage, and with it every notice-only job; also blocks withdraw and notice recording on a merge rerun.
- **Scenario:** in a shallow BOB clone not yet deepened (a fresh BOB after a handover, whose first act is `notice triage`), the provider job's merge base lies more than 49 commits back on either side. The tranche moved 50 merges during a long job, or the job has more than 49 commits since its last tranche merge. `git merge-base` exits 1 and the command dies with "git merge-base … failed".
- **Smallest fix:** take the base from GitHub with `compare(slug, m+'^1', m+'^2').merge_base_commit.sha` (the PR's base and head SHAs also work), then `git fetch --depth=1 origin <mb>`. Only trees at mb and m^2 are read.

## 9. The review brief tells the reviewer to run the module's own suite, without the generated files
- **Where:** review.mjs:30 ("run the test suite … or the module's own suite", and "write only in a scratch directory outside the checkout").
- **Class:** 2. **Severity:** wrong findings, which spend review rounds against MAX_ROUNDS=2 (merge.mjs:56), so the merge then needs `--decision`.
- **Scenario:** the reviewer runs `node --test` on the module's tests in a product checkout. The untracked rows.mjs and bundles are missing (41 of 113 tests on the copy), and the reviewer reports a "fix" that the gate does not see.
- **Smallest fix:** for a job PR in a product, name `node .process/tool/p3.mjs test <id>` as the suite command (it installs and builds untracked generated paths only). List `generated` paths as "built, not committed".

## 10. deploy dev, job complete and job test build generated files without installing the lock files the build needs
- **Where:**
  - deploy.mjs:121-123: `buildGenerated` with no install. The gate (gate.mjs:106), release run (release.mjs:176) and layer close (layer.mjs:46) install every lock file first.
  - job.mjs:780-781 and suite.mjs:58-64: only the module's own lock files are installed before the build of every row.
- **Class:** 2. **Severity:** blocks deploys and completes (conditional).
- **Scenario:** `bundles.mjs` runs `npm run build` in each stale member, and members need their own deps (reader-container needs `@cloudflare/containers`). The copy's session hook installs 7 packages but skips reader-container, site and journey-check. A stale reader-container bundle stops deploy dev at `build` before the dry run, whose own `npm ci` comes too late. It also fails job complete for a bio-plane module while the gate passes.
- **Smallest fix:** run `install(root, cfg.lockfiles, { onlyStale: true })` before `buildGenerated` in deployDev, jobComplete and jobTest.

## 11. Prompt refresh can hand BOB's address back to the old BOB
- **Where:** roles.mjs:298-312 (`promptRefresh` decides the role from a read, then the `writeState` callback writes `me` into addresses/<role>.json without checking again). The same pattern is in `recordStart`, roles.mjs:207-219.
- **Class:** 6. **Severity:** wrong routing: job reports and wakes go to a BOB that is handing over.
- **Scenario:** the old BOB's `start check --wake` reads addresses/bob.json (bob=old). ROOT's `handover confirm` pushes bob=new. The old BOB's `writeState` fetches fresh, so there is no conflict, rewrites bob=old and pushes as a fast-forward.
- **Smallest fix:** inside the callback, re-read `addresses/<role>.json` in the worktree and throw unless `session === me`. For `recordStart`, unless it is the expected prior value.

## 12. Concurrent appends to one state file conflict, and pushRetry gives up
- **Where:** util.mjs:219-235 (`pushRetry` merges `origin/<sb>` and aborts on any conflict). Writers append to one file per role, or one per kind: messages/<from>.jsonl (state.mjs:155, 173), metrics/restart.jsonl, releases/dev.jsonl, deploys/dev.jsonl, layers/closed.jsonl, metrics/sweep.jsonl and lanes.
- **Class:** 6. **Severity:** a refused act (rerun works). It can block when the refused write is a `send` whose message is then never delivered or recorded.
- **Scenario (reproduced in exp3):** two appends at the end of the same jsonl give a `UU` conflict. Cases: BOB issuing `send … --from bob` and `send delivered n --from bob` as parallel tool calls, old and new BOB both writing messages/bob.jsonl during a handover, or two `--from pin` sessions. The second fails with "moved on origin and does not merge cleanly; nothing was pushed".
- **Smallest fix:** on a rejected push, rebuild the worktree from the fresh tip and re-run `change(wt)` (which also renumbers `n`) instead of merging. Or commit `*.jsonl merge=union` in the state branch's `.gitattributes`.

## 13. The tranche→main merge waits 20 minutes on a gate capped at 45 that runs every module's suite
- **Where:** gate.mjs:103,120 (a non-job PR's scope is every module whose files it changes, run serially in one job), process-gate.yml:25 (`timeout-minutes: 45`), merge.mjs:329-338 and p3.mjs:241 (20 min by default), tranche.mjs:205-207 (the close steps).
- **Class:** 5. **Severity:** blocks tranche close, later.
- **Scenario:** `Close tranche` changes all 38+ modules. One gate job runs every suite, each up to `suite_timeout_minutes` (20). `merge --plain` gives up at 20 min, and the gate is cancelled at 45. If main's ruleset requires `gate`, the tranche never merges.
- **Smallest fix:** for a PR whose head is the tranche, have the gate trust the per-job gates (trigger `record` when every changed file arrived through a merged job PR), or split suites into a matrix. Default `--minutes` to at least the gate's timeout.

## 14. Lower (wrong figures or cosmetic)
- **Release checks claim freshness without testing it** (release.mjs:180-184, class 2, wrong figures). `release run checks` builds generated rows first. `bundles.mjs` also rebuilds stale *committed* bundles, so the copy's checks "setup-words fresh" and "bundles fresh" (`--check`) always pass, and the release body claims fresh bundles the commit does not have. Fix: after `buildGenerated`, run `git status --porcelain` on the committed generated paths, and record a failing result naming each one the build changed.
- **survival() reports missing history as "reverted"** (metrics.mjs:90-92, class 3, wrong figures). It treats any `merge-base --is-ancestor` failure as "reverted", including exit 128 for a missing object when `deepen()` failed in a shallow clone. Fix: exit 1 means not on the branch; any other exit is `unmeasured`.
- **p3 size counts tracked files only** (size.mjs:81-82, class 2, cosmetic). `tracked_files`/`tracked_bytes` leave out the built-not-committed files (about 43 MB on the copy since they were untracked), so later ranges are not comparable with earlier ones. Fix: add a `generated_untracked_paths` figure, or say "tracked" in the range rule.
- **Two `found` runs can share a mark number** (found.mjs:139-145, class 6, cosmetic). Two runs for one module before the first branch is pushed, without `--write`, both get the same F<n> and the same branch name. Fix: always count the local `found/<key>-f*` branches as well as the remote ones.
- **Full fetches without `--depth` in shallow sessions** (class 3 cost, not misjudgement). start.mjs:34 (every `start check`, every wake), state.mjs:141 (every job `send` after BOB pushed to the job's branch), merge.mjs:105/359/367 and the `git fetch origin <tranche>` that roles.mjs:98 prints. The first one can pull the whole history (util.mjs's own measurement: 90 s). Fix: `...depth(root)` there, as fetchBranch does, except merge, which needs the history.
- **`record-check` and `ledger check` without `--base` in a shallow clone** (p3.mjs:380, 393, 398, class 3). They give "no base" or a git failure from `merge-base`. Only people run them by hand. Fix: use compare's `merge_base_commit`, as `shallowBase` does.
- **Two pin moves can both pass `pin check`** (pin.mjs:35-37, class 6, safe). The window is between step 8 and the push and PR in steps 9 and 10. The second PR conflicts on the gitlink and `waitMergeable` refuses it at once. No fix needed beyond what PR 85 did.

## Checked and found sound
- markReady (CCR route).
- `shallowBase` (PR 83) and take-in deepening.
- aheadBy, onMainOf, closedRows and tranche `onBranch` (compare first).
- entryHistory and blocks (cut-aware), the report `deepen()`, survivalReport (shallow means unmeasured), and processRepo's `--unshallow`.
- gate (full-history Actions checkout), layer close (installs all lock files, builds generated), release run (install, then build).
- waitMergeable and waitForChecks (bounded), mergeRetry, the notice and triage writes (one file per row), sweep and heartbeat (single writer).


# [file] attack_common.md

# Common brief for workers attacking the Process4 definition (14 Nov 2026)

## Background
Bob is the owner. He is not a programmer in this role: he defines the product and the process in plain words; Claude decides everything technical and reports it. Process3 was his development process: Claude Code cloud sessions, in Auto mode, built his product Civicsmith in a GitHub repository unattended. It failed: sessions kept adding checks, gates, reviews and record-keeping to the process's own tooling until product work stopped. Process4 is its successor. Its definition, second draft, is the document under attack:

  /home/user/handoff/process4_definition_v2.md   (read it in full, first)

The first draft is process4_definition_main.md in the same folder (for comparison only). The appendix (process4_definition_appendix.md, being updated separately as _v2) maps 288 requirement lines.

## Bob's fixed decisions (not open to attack as decisions; attack whether the definition honours them and whether they can work)
- Exactly three tests, and no others, ever: a job's own module tests; the interface notice; the internal walk.
- No layers. One total order of modules. A job does not wait for the modules it uses. Eight job slots by default; only Bob changes the number.
- No review by a fresh reviewer.
- A process fix may only correct or remove; it never adds a test, gate, review or stop.
- Process3's permission management is preserved (standing approvals in CLAUDE.md committed by Bob, deny list in settings.json, merging through the process's merge tool).
- ROOT is the first session; ROOT and the coordinator are different sessions.
- Bob enters no commands and edits no source files. Only words Bob wrote count as his word.
- Nothing may be asserted to work that has not been measured. "Proven" and "not proven" must be kept apart.

## Hard rule for your remedies
You may NOT propose, as the answer to any weakness, a new test, gate, review, check, audit, approval step by a session, or monitoring job. Process4 has three tests, ever. A remedy may be: removing something, a structural choice, a permission or setting, a change of wording, an honest statement that a risk is accepted and unproven, or a trial (a one-off measurement before the process is in force, not a standing check). If the only remedy you can see is a new check, say exactly that and leave it as an unanswered counter-argument.

## Evidence available (folder /home/user/handoff/; use grep, read passages not whole files)
- Bob's requirement documents: foundations.md (Process3 Foundations), ledger_lines.md (the Keep and Drop Ledger, 159 lines with his decisions and notes), ledger_map.md, DECISIONS.md (Process3 decision records; quotes Bob), process4_disposition.md / .tsv (288 rows: every requirement line with id, text and disposition).
- /home/user/work/assessment_doc.txt: a session's record of Bob's decisions of 13 and 14 Nov (near the top). /home/user/work/live_docs.md: what is and is not in Bob's own words. /home/user/work/ledger_store/: his stored answers.
- Post-mortem evidence: review.txt, verify_numbers.md, causal_forensics.md, change_sample.md, canon_analysis.md, product_side.md, bob_naming.md.
- Design evidence: interface_and_cycle.md, no_layers_width.md, roles_root_coordinator.md, permissions_inventory.md, levers_github_cloudflare_product.md.
- Earlier attacks on an earlier, withdrawn proposal (not this definition): redteam_corruption.md, redteam_feasibility.md, audit_A.md to audit_D_central.md. Use them as a source of attacks that may still apply; check each against the second draft before repeating it.
- Notes by today's workers: /home/user/work/enforcement_levers.md (physical stops against added checks), /home/user/work/k_evidence.md (evidence on Bob's seven questions).
- Read-only clones: /home/user/repos/process3, /home/user/repos/civicsmith-copy (product; branches origin/tranche and origin/process-state). Never commit, push, or change anything in them. Start no cloud sessions.

## How to report
Write your full findings to the file named in your task. For every finding give:
 1. The counter-argument, in one or two plain sentences Bob could read (no ids or codes in that sentence; put ids in a separate "sources" line).
 2. Which sentence(s) of the definition it attacks (quote them).
 3. Evidence: measured in the record (cite file and passage) / stated in a platform document / your reasoning only. Keep these apart.
 4. How bad if true: stops the first hour / stops a tranche / silently corrupts the result / costs Bob time / misleads Bob / minor.
 5. Your best answer within the hard rule above, or "no answer found".
Rank findings worst first. Do not pad: a finding you cannot support is noise. Do not soften: if the definition would not run as written, say so first.


# [file] first-class-session-minimal-owner-test-20261117.md

# First-class Codex session orchestration — minimal-owner-intervention experiment

**Status (17 Nov 2026): experiment specification, not performed; does not relax owner's first-class session requirement or authorize purchases, account/credential changes or alternate hosting.** Designed after the failed `codex cloud list --json` 401 and the owner request to minimize involvement. Read [reported blocker](codex-first-class-session-creation-blocker-20261117.md) first.

## Objective

Determine whether a Process4-controlled, existing-subscription-funded execution context can create **a new independent Codex Cloud session/task** that (a) appears in the owner's **ordinary Codex task/session list rather than only Subagents**, (b) supports direct owner conversation after initial work, (c) is assignable to an existing product project when supported, and (d) can be messaged/reactivated by another Process4 session. **Creating an app-server/local thread, native child, agent hierarchy handle, or API session is not proof.**

## Constraints and attribution

- Run from a fresh, bounded disposable test session; leave ROOT/coordinator/ARCH, old bootstrap and existing live timers untouched. No CivicSmith2 writes, process adoption, settings changes, grant expansion, credentials, refresh-token reads, or login retries inside hosted environment.
- No paid VM, metered Agents/API inference or credit purchases. Cloud tasks use existing published OpenAI-managed Codex environment and available included subscription usage only; stop if creation requires extra spend.
- Use **one** candidate creation and **one** owner UI verification whenever possible. Do not create multiple orphan cloud tasks or ask the owner to recreate the experiment manually.
- Keep exact commands (with secrets redacted), UTC times, source/version, response status, task URI/ID, and distinct observations. Do not conflate proof of Cloud task creation with general-purpose peer messaging or native Process4 role hierarchy.

## Stage 0: preflight, entirely automated (no owner)

1. Inventory *actually exposed supported* native Codex Cloud session creation/list/message tools; inspect any installed client read-only. Identify available Cloud environments with allowed read-only method. Inspect existing published environment IDs from trusted already accessible tool outputs, not guessed ids; owner should never be asked for secrets.
2. Do not rerun `codex cloud list` with the same known unusable inherited auth without a changed supported authentication state. Existing `codex login status=Logged in using ChatGPT` is NOT proof Cloud credentials work. Record prior 401 as baseline; do not inspect or repair inherited credentials.
3. Check if a supported first-party connector or native Cloud task creation interface is available under the current authenticated principal. A GitHub PR, automation, or local app-server thread is not a substitute for ordinary Codex list membership.
4. Distinguish `Codex Cloud environment`, `Cloud task/session`, `Codex desktop thread`, `ChatGPT Project`, and `Codex project`. Confirm target actual owner client UI before claiming membership.
5. **Gate:** If no authenticated supported Cloud creation route and existing published environment can be established, stop safely with `BLOCKED_PRE_CREATION`, including the exact missing prerequisite. Do not invent a task or move to UI verification. Do not ask the owner to create the task as a supposed proof of automation.

## Stage 1: exactly one autonomous creation, if preflight passes

Create one harmless **read-only** independently listed Cloud task using an existing authorized published environment. Suggested prompt:

`P4-LIST-VISIBILITY-PROBE-20261117: Read-only. Reply with the marker P4_VISIBLE_READY and the current UTC date. Make no repository changes, commits, PRs, external calls, or purchases. Remain available for one follow-up message.`

Capture the returned first-party task id, canonical owner-opening link, environment id, exact creation timestamp, and whether creation used included subscription usage. If only a native child or local app-server thread is created, label `NOT_FIRST_CLASS` and don't ask the owner to look for it.

## Stage 2: ONE owner action bundle, only after creation

Ask owner in one concise request to:
(a) open the exact generated link in the normal authenticated Codex app;
(b) confirm it appears in the ordinary session/task list, not only Subagents;
(c) send the new task `P4_OWNER_DIRECT_MESSAGE`, then report whether it replied;
(d) after initial completion, send `P4_OWNER_SECOND_TURN` to verify it can continue.
If owner can assign the session to a product project using the normal supported UI, ask to test that in the same visit **only if no product project is modified unintentionally**; otherwise label project membership unverified. Do not create a new product project or require screenshots/credentials.

Ask for a single consolidated response such as `Listed=yes/no; Direct reply=yes/no; Second turn=yes/no; Project=assigned/not available/not tested`. Owner's observation is a necessary proof for the account UI; do not claim it from a model-created link alone.

## Stage 3: machine-only coordination test, if first-class visibility proved

Use another existing Process4 native agent (or second harmless task **only if genuinely required and within grants**) to send a supported message to the new first-class task ID, trigger its continuation while idle, and verify an attributable reply in the same independent task. Capture actual correlation/latency and whether owner can still send a subsequent direct message. Never substitute a GitHub comment or scheduled polling for peer session messaging. If an unrelated task cannot address it, mark `PEER_REACTIVATION_UNSUPPORTED_OR_UNPROVEN`, retaining the separate owner-interaction PASS.

## Result categories

- `PASS_ALL`: autonomous first-class creation + owner ordinary-list presence + direct and second-turn reply + peer reactivation, with product membership independently recorded if relevant.
- `PARTIAL_FIRST_CLASS`: task created and owner can use it, but peer reactivation or project assignment not proved.
- `BLOCKED_PRE_CREATION`: no supported authenticated creation route, previous 401 not remediated, or no published environment. **Owner UI verification unnecessary.**
- `NOT_FIRST_CLASS`: created only native child/local thread/API session.
- `NOT_VERIFIED`: task was created but owner UI has not been observed.

Never infer universal lack of the feature from a 401. Nor infer unsupported authorizations from local login status. Preserve exact evidence once, as a concise experimental report under `process4/working/` with source link, and no routine GitHub messages.

## If owner action becomes unavoidable

Only after all supported existing-account authenticated creation routes have been checked, provide **one** specific minimal prerequisite with the supported app UI path—e.g. identify/select an existing published environment, or complete a normal owner-initiated authentication in the intended client. Ask the owner for that act, not credentials or a manual replacement for automated creation. Once satisfied, rerun the automated gate with **no extra speculative commands**. If a supported authenticated creation route is unavailable even then, report architectural blocker rather than suggesting metered APIs or a paid host.

## Notes on official scope

- https://help.openai.com/en/articles/20001545-using-codex-cloud — Cloud tasks require a prepared/published environment; one task has its own isolated workspace, can be continued; environment and task are different things.
- https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan — standard Codex Cloud environments have no separate VM charge at launch; model usage still consumes subscription allowance/eligible credits.
- https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex — Codex has separate history from ChatGPT/Work, and project terminology is surface-dependent.

**Protocol principle:** The outcome depends on owner-visible first-class task behavior, not the mere existence of a provider API, a test report, or a native subagent.


# [file] appendix_commits.md

# Appendix: the merge and first parent of each of the 178 recorded changes

Each change is `git diff <first parent> <merge>` in `/home/user/repos/civicsmith-copy`.

| Change | Kind | Merge | First parent | Told | Declared users at first parent | Affected |
| --- | --- | --- | --- | --- | --- | --- |
| `acquisition:1024` | layer | `e9f7b1b4bcc4c735b178e4e7c212d1d02c3db3bc` | `30943b5bd3740ec678ec4cc0bd7f17d4e15d26cc` | 27 | 33 | 1 |
| `action-clocks:60` | job | `468014b3e23a568e5f54fa1d3cbe8d9dab5ba600` | `e59fbb54ded373633a2281e1bab0a56db908ea99` | 14 | 14 | 4 |
| `action-grammar:396` | job | `3246bba2aa75d12e2ca0e37aad919305f4943064` | `0753837ec852940127525bc00b9d95e7f00fabfc` | 11 | 11 | 2 |
| `action-plans:183` | job | `8b365335314c2bbabd9e7e41c0647543d724074e` | `f3ddb981a2f2b10d39d37b066bc26d66e78b3442` | 12 | 12 | 0 |
| `action-plans:726` | layer | `d6c444a5cf1e2c2c9ed7661fbe57568a6c91dfc1` | `19dd8818ae4f1af8a88f62c6a67057253927ad47` | 11 | 12 | 0 |
| `action-records:696` | layer | `c06702976dce378737b9512763d3cbf5ec176bf3` | `7623d9796904801881e9b051e7fc8447aa471537` | 6 | 8 | 0 |
| `actions:715` | layer | `d02c296694f7f774392a034e59bdef59eb6c442c` | `b17aea00663f3be9fb3aff862ac8167db9da1acc` | 12 | 19 | 0 |
| `admission:171` | job | `e31f49938c8874f690cadb4430688c73a8a513b6` | `e71640ada5ce94e2ef76b074c92a109146ebd0fe` | 7 | 7 | 1 |
| `affordances:252` | job | `52b3c9bf008c5225038e17f8be2bfcfe5f9f0cf8` | `ad50bef5458fc0e24ca7928815e80a890781f3a5` | 7 | 7 | 1 |
| `affordances:374` | job | `328cb52ad0b2701b10babe142e6784d5bfa21a1c` | `f82b92a76bafcd916cacb64b9b8ee794af4ae6a7` | 7 | 7 | 0 |
| `agent-drafts:358` | job | `3f16c0a7b8543c3991ddbc80569524c66d728a9a` | `203c5f140c0e613b79d36e82203decaad78e6a34` | 1 | 1 | 1 |
| `agent-drafts:408` | job | `a8ae4a39bdfb94e2b044ba57e4ccd1761f5af916` | `8599ecfd70797646ed9cf28f03689f6230cc6d16` | 1 | 1 | 1 |
| `agent-drafts:570` | job | `f6049ea4a41ceade6c5abc8c20032c2bde015b41` | `ca983c4b7a59712addce1f6cafc996bf27a07c50` | 1 | 1 | 1 |
| `agent-harness:353` | job | `5e8ae0c2fac4424faaa67f0778cc355ce21573e8` | `1185b6d699421af3c94a0991e1d81e6fc53c7842` | 8 | 8 | 2 |
| `agent-model:355` | job | `ca282a6a36575aa2e112f25455c4e02a02ffe3c2` | `30fb4f018ea853f96c45ab9911a265fb85583a06` | 7 | 7 | 1 |
| `agent-model:395` | job | `dc0daad8a3621b9535f298345644c1875aa3e963` | `0e65c98c73bd549271b83ba58e648a22597a8d26` | 7 | 7 | 5 |
