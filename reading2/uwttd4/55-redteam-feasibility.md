**Correction.** One sentence in G4: "No `paths` filter on the workflow; a planning job lists the changed modules; one always-running job named `gate` is the required check and passes when every listed suite passed or none was listed." Add to S1: a PR that touches only `build/requirements/x.md` merges; the check name produced through the reusable workflow is the name the ruleset requires. State as a known limit: a re-run tests the original merge commit, so a PR that went green hours ago merges on old evidence; auto-merge keeps that window to one gate run.

### 5. The gate as sketched needs 52 concurrent runners in a measured peak hour; the account has 20. The 10-minute budget stands on a baseline that the record contradicts

**Evidence and arithmetic.**
- Concurrency: 20 jobs on Free, 40 on Pro [doc: levers 3.2].
- Runs per landing without record triggers: 495 / 238 = 2.1 [repo]. The draft adds one `push` run: 3.1.
- Levers' shape: 1 planning job + 4 shards of 10 minutes + 1 aggregator, about 42 runner-minutes a run. Per landing: 3.1 × 42 = 130.
- Day average at 135 landings: 17,550 runner-minutes, 12.2 of 20 runners busy all day.
- Peak hour: 24 landings (7 Nov 18:00Z; 19, 24 and 20 in three of four hours) [repo]. 24 × 130 = 3,120 runner-minutes in an hour that supplies 1,200. The queue grows by 1.6 hours per peak hour. "Median ready-to-merged under 30 minutes" fails exactly when work is flowing.
- Merge rate is not the limit: 24 an hour is 0.4 a minute against GitHub's guidance of 1; the worst minute had 4 merges and 28 minutes had two or more [repo], with no refusal.
- G5's "today 40–65 as one job" is the review's "median attempt". The gate rows give a median of 1.1 minutes over 789 runs (63% not started by code) and module suites of 1.9 to 2.5 minutes; 40 to 42 minutes is `plane` and `control-plane` only [repo: product_side 6; `process-gate.yml` comment]. Sharding a two-minute suite four ways multiplies the fixed install cost of ten lock files by four.

**Correction.** Restate G5 as two numbers: median wall time ≤ 10 minutes, and **≤ 50 runner-minutes per landing** (24 × 50 = 1,200, the measured peak on 20 runners). Reach it by configuration: the gate runs on ready PRs only; `cancel-in-progress` per PR; shards only for suites the planning job knows are heavy; the `push` run in one concurrency group so it tests the newest tip, not every merge. S5 first measures the code-triggered median and 90th percentile from Actions history; it is a day of product CI work, not an hour. If the count still exceeds 20, Pro is the cheapest fix.

### 6. Nothing in the draft sees a cross-module break, and "ready" ignores that 182 of 220 modules depend on a module in their own layer

**Evidence.** In `build/modules.json`, 721 of 3,120 `uses` edges are within a layer; 182 modules have at least one; the longest chain is 65 modules overall and 16 inside layer 11; in-layer chain depths sum to 86 [repo]. The PR gate runs only the changed module's suite, and so would a `push` run of the same scope. The 2.1% the draft cites (3 conflicts in 146 merges) is that same narrow scope re-run on a newer base. A provider change that breaks a dependant already merged is caught by neither. Process3's catcher was notices (178 notices, 2,707 notifications, 90% "not affected"); N7 deletes them "with no replacement". What remains is the walk, plus `regression.yml`, which exists, is manual only, and is never mentioned [repo].

Waiting for every used module to merge is not the answer: 65 links × (about 30 minutes of job + up to 60 minutes for the hourly wake) is roughly four days of pure latency.

**Correction.** Two sentences. N1: "ready = an open item in the lowest layer that still has open items, with no open pull request; items in a layer start together" (what Process3 measured at 135 landings a day). F1: "`regression.yml` runs on a schedule on the integration branch (every six hours) and at each layer close; each red suite becomes one item for its module." Count cross-module reds per layer; only if the count is high, start a layer in waves by in-layer depth. Defer contract tests and type-checking as P4 already does.

### 7. "Plan minus merged minus open" has no data model, and the work of run 1 is items, not modules

**Evidence.** 170 distinct jobs landed 508 times, 113 of them more than once [repo: product_side 2]; "merged" is not a state a module has. Run 1 is completion-round and walk-fix work, whose unit is an item with dependencies on other items ("re-pass of CR2-9 once CR2-16/17/18 land") [repo: `build/plan/completion-round-2.md`]. The draft names no file for the plan, no key that joins a plan line to a pull request, and no place where a walk failure becomes work. N1 also forbids the tool to write, so something else must.

**Correction (the minimum; no new record).**
- `build/modules.json`, as it is: `id`, `layer`, `paths`, `tests`, `uses`. Read by the gate's planning job and by `status`.
- One round file per round, written by BOB in a planning PR before the round opens and not edited by jobs: one line per item, `id · module · what · after: ids`. Jobs do not tick it; 24 PRs editing adjacent lines of one file would bring back the sync merges (1,339 against 508 landings [repo]).
- State is derived, never written: open = an open PR whose head branch is `job/<item id>`; done = a merged PR with that head; blocked = a label; layer closed = no undone item in it.
- Requirement marks stay in each module's own file and are struck in the job's own PR (about 600 marks in 171 files today [repo]); a walk or regression failure enters as a line in the next round file.

`status` is then a join of two files and two `gh pr list` calls, about 150 lines; 500 is ample. This also answers "where can sessions update product-technical planning": in ordinary PRs to those product files, which is why finding 8 takes the layer map out of the guarded set.

### 8. CODEOWNERS as drafted locks the owner out of his own approvals and puts him in the path of routine planning

**Evidence.**
- With code-owner review required, a PR that touches an owned path "must be approved by that code owner" [doc: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets]. A PR author cannot approve his own PR (long-standing GitHub behaviour, not re-read today), so the sole code owner's own `CLAUDE.md` PR can never satisfy the rule. Rulesets bind the admin unless he is on the bypass list, and the setting Process3 asked for is "every ruleset's bypass list is empty" [repo: `setup/conditions.json`]. The owner committed to `CLAUDE.md` at least 9 times in 8 days (product_side counts 16 owner patches) [repo].
- G2 guards "the plan's layer map". Sessions changed `build/modules.json` in 41 commits on 4 to 8 Nov, 17 on each of 4 and 5 Nov, mostly `uses` edges the gate's import finding demanded and module splits [repo]. Each would now wait for the owner, against "owner minutes per day under 15" and against the canon's "you decide only the layers and modules that carry product capability".
- An approval survives later pushes unless stale approvals are dismissed; with auto-merge on, a later push to a guarded file would merge on the earlier approval.
- Behaviour of code-owner review at zero required approvals, a bot's inability to satisfy it, and whether a submodule gitlink path can be owned are [unverified]; S1 is the right spike. A CODEOWNERS line with a syntax error is skipped silently.

**Correction.** In G2: bypass list = repository admin; "dismiss stale approvals" on; guard `.github/**`, `.claude/**`, `CLAUDE.md` and the pin only, not `modules.json` (the daily report prints its diff-stat instead). Run S1 once on the real repository as well as a scratch one. Known limit, one line: settings reload during a session and `Edit` deny rules do not cover Bash, so a session can alter its own deny list in its own checkout; the wall is that the change cannot merge.

### 9. Pause and stop do not exist, and the standing prompt overrides the owner every hour

**Evidence.** Process3 held pause as a field every session read at its next status (PLN-5). The draft has "the owner can end a run at any time" and no mechanism. C2 makes the hourly prompt BOB's whole instruction: "Start a job for every ready module". An owner's "pause" said in chat is gone at the next compaction and contradicted at the next wake. This is R7, and it is not met.

**Correction.** One GitHub object and two prompt lines. A `paused` label on the pinned process-log issue (one click for the owner, or BOB sets it on his word). `status` prints PAUSED first. BOB's prompt begins "If status says paused, start nothing and stop." Hard stop: BOB interrupts and archives job sessions (15 of 15 after approvals [measured]).

### 10. BOB is a single point of failure with a daily alarm, and replacing BOB can produce two

**Evidence.**
- G8 runs "once a day" and fails "if ready work has not moved in N hours": worst-case detection is 24 hours plus N. It also cannot tell a dead BOB from an empty queue unless it computes "ready", which only `status` knows.
- A paused session waits for a person: three refusals in a row, or 20 in total [measured, doc]. Nothing in the draft counts refusals (C9 says "count them" with no counter).
- A replaced session's bound task "keeps firing into the old session" [measured]. The draft deleted the address-in-git guard that stopped two ROOTs acting. Deleting or switching off a task is judged case by case, and Process3 ruled that nothing may depend on it [measured], so it cannot be BOB's job.
- "At about 50 live sessions the account stops starting new ones, while the create call still reports success" [measured]. A run makes over 100 sessions a day. The draft gives the live limit no number, never checks that a started job appeared, and never archives a finished one. Whether idle finished sessions count toward the limit is [unverified].
- BOB's standing prompt omits acts the walks need: replace a stalled job (archiving the dead session first, or its PR events stay with it [tool]); archive merged jobs; move its checkout to the tip so new approvals load.

**Correction.** G8 gets two schedules in the same file: every 30 minutes it runs the pinned `status` and fails if a ready item has had no PR for two hours or a ready PR has not moved; daily it reports. The charter's "start a new BOB" step for the owner has two clicks before the prompt: delete the old task and archive the old BOB. BOB's prompt gains four short lines: fetch the tip; archive sessions whose PR is merged or closed; start to at most 24 live; a job with no PR after 15 minutes or a stalled PR is archived and replaced once. Replace BOB at every run boundary as a matter of course. S4 counts refusals over a simulated day. This weakens R6 honestly: the owner is the only recovery for BOB, and the count decides whether ROOT returns.

### 11. Missing altogether: the road to `main`, the release, the secrets, and the owner's setup list

**Evidence.** R1 is "onto main". The draft protects `main` and never merges into it; Process3 ended with `main` untouched since 1 Nov [repo]. `p3 release` and `process-dev-release.yml` cut development releases; both go with the tool, and no replacement is named. The sessions' cloud environment holds eleven variables today, among them `CLOUDFLARE_API_TOKEN`, `BIO_RELEASE_SEED` and `BIO_RATIFY_SEED` [repo: `process/config.json`]; G6 asserts "no session ever holds a deploy token" and lists no act that makes it true. Auto-merge is off and bypass lists are empty by Process3's own setup list [repo]; the success test says "if any wall is found missing, the run stops", but no list says what the walls are.

