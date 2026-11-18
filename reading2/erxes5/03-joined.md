# [file] lanes_process3_record.md (continued)

3. At an account switch the lanes' claude.ai documents must be shared to the new account with edit access by the owner (`T:rulebooks/account-switch.md:36`).
4. One repository per session (the fifth draft's own rule, and Process3's PLT-7): a lane in the process repository and a lane in the product repository cannot be the same session.

**Not proven by anything I read:** that long-lived lane sessions gave better designs than a helper started with the lane's folder (the Foundations left this "measured", `T:governing/foundations.md:91, 288`; no measurement exists); what a lane session cost; that a replaced lane session picks up correctly from its research folder and artifact links.


# [file] proof_outcome.md

# The proof of the notice method: outcome

15 Nov 2026. For Bob and for the main Process4 session. Written by Claude (the study session). Nothing here is in force.

Four words are kept apart. *Measured*: counted by a script. *Estimated*: worked out from measured figures. *Judged*: somebody's reading; it says whose. *Unproven*: never run.

## Where it is

The proof session's report is `notice-proof/PROOF_RESULT.md` on branch `notice-proof` of `neobobkrause/process3-probes`, at commit `10ad3d98a41e651a132be73f5c0390642cc891e2`. Its rules, results and every change are beside it in `notice-proof/`. It ran from 01:00 to 14:43 UTC on 15 Nov 2026, and its session record shows about $99 spent.

## What it did

It built the tool and a made-up product of eleven modules holding every route between modules that the study found. It then ran 150 changes: 29 planned, 12 attacks of its own, and 109 written blind. "Blind" means by a fresh helper that had seen no results, attacking the newest design. It built seven designs of the rules, each answering the failures of the round before, and described an eighth without building it. It stopped on Bob's words of 15 Nov: "Stop, write it up. It's usable, even if there's an occasional extra unnecessary notice sent out. It's 2 orders of magnitude better than the old method."

## Its main findings, and what I checked

| Finding (the proof session's) | Checked by the study session against its committed data |
| --- | --- |
| On design 7, all 133 changes written before that design were told exactly as the rules say | Agrees: the history file shows 0 holes and every answer matching the rules on those 133 |
| Holes found by each blind round, designs 1 to 7: 5, 8, 15, 6, 7, 10, 8; no downward trend | Agrees: 59 holes in 109 blind changes |
| Over all 150 changes, design 7 sent 182 notices, 111 of them for nothing; telling every declaring module would have sent 474, 376 for nothing | Agrees with its comparison file |
| 28 users that needed a change went untold on design 7 | Agrees with my own recount from its tables |
| "All 40" untold users that needed a change or broke had a failing test | My recount from the same tables finds 50, not 40; I could not reconcile the definitions. In all 50 the user's own tests failed, so the conclusion holds |
| In the blind rounds, 66 of 70 untold users had a failing test | Not checked |

## Design 8, which it recommends

It is not built and not run. It keeps design 7's 28 rules on who is told, drops design 7's 23 new refusals, and adds three rules:

- **Rule 52.** "Accepts more", the one difference that tells nobody, is accepted only when TypeScript's own type checker confirms it. The proof session records that Bob chose this fix in that session on 15 Nov. I have not seen his words there.
- **Rule 54.** No version of the tool is accepted while any recorded change is answered worse than before. The recorded changes are the tool's own tests.
- **Rule 53.** After every provider change, the tests of every module that uses it, directly or through another module, run before the change merges, and a failure stops the merge. This is the proof session's recommendation. Nothing it records shows Bob approved it.

## My assessment

This is my judgment, the study session's.

1. **The proof answered the question.** On the changes it can see (names, fields, kinds, operations called by name) the method decides rightly. It cannot be made complete, because a user can depend on things no written interface records. What it misses has, in every case recounted, shown up as a failing test of the user.
2. **Rule 53 as written would cost more than the old method on the real product.** On today's module list a module has on average 79 users directly or through another (measured). Over the 178 recorded changes rule 53 would have run about 14,500 module test runs (estimated from the module list), against Process3's 2,707 notifications. One user's tests took about three minutes here (measured, one module). That is the reverse of Bob's goal. It is also a new gate on every merge, where Bob has said no new tests, gates or checks.
3. **Without rule 53 the misses are caught later, not never.** They are caught when the user's own job next runs its module tests, or in the internal or external walk. That is what Bob accepted on 15 Nov in calling the method "usable".
4. **"Two orders of magnitude" is still not measured.** The proof's mix of changes was chosen to attack the tool, so its 2.6 times fewer notices is no guide. The real record is the guide. There, 74 of 2,707 notifications were needed (judged), and 64 of 178 changes would have sent nothing even with no comments added (measured). The proof session and I agree on the next step that measures it: comment a cluster of real, heavily used modules and replay their recorded changes with the tool.

## What is Bob's to decide

1. **Rule 53, the test run before each merge.** I recommend no, for the cost in point 2 above.
2. **The 23 refusals of design 7.** Each is listed, one line each, in the proof's report under "Every rule added beyond the brief's nine points". I recommend none, beyond the two Bob already approved. They answer attacks written to defeat the tool, and they refused honest code in every blind round.
3. **Whether to run the replay on real modules** before the method goes into Process4's definition.

Design 8's other rules on who is told, and rule 54, are technical. I would take them as the proof session recommends.


# [file] github-pacing.md

# GitHub limit conformance (R17, 6 Nov)

**PD-22 (9 Nov) replaced what follows.** Bob: "If github usage reporting is expensive then don't do it
beyond just making sure that we don't exceed published limits." The tool now keeps no ledger, share,
audit or hook. It reads GitHub's `/rate_limit` before a job or lane start and after a gh call GitHub
refuses (403/429) or fails (5xx), and backs off at 85% of a limit until its reset, or for Retry-After
(`tool/lib/pace.mjs`). The rest of this note is R17's history.

The civicsmith account was suspended at 19:19Z on 6 Nov, most likely for automated bulk activity: GitHub's Acceptable Use Policies, section 4, and the API terms' "excessively frequent requests".

Bob, 6 Nov ~21:10Z: "If github publishes limits, then we should introduce process3 tooling that conforms to those limits. But rather than limiting usage to a small fraction of github's stated limits, I'd suggest that the tooling limit usage to 80% or 90% of github's published limits. That feels like the proper balance."

So the tool conforms to GitHub's published limits at a target share of each. Every setting is under `"pacing"` in process/config.json (Foundations P27).

## Measured on 6 Nov (the copy's state branch, one commit per push)

- 1,387 state-branch pushes from 00:00 to 19:19Z.
- The busiest hours were 00–03Z, at 143–173 pushes an hour, while the merge train ran. The train's lease writes alone made 143 pushes.
- In the layer flow, after the train was retired, the rate was about 70 an hour (17–18Z).
- The largest kinds of write: idle check 106, message delivered 98, starts owed 81, message to BOB 59, live job sessions 49.
- Not measured: the tool logged no gh calls, and the job branches' pushes could not be read once GitHub refused access. Both are logged now.

## GitHub's published limits, held as data

`pacing.github_limits`, read 6 Nov 2026 from https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api:

| Limit | Published | At the 85% target |
|---|---|---|
| Primary, per user token | 5,000 requests an hour | 4,250 |
| GITHUB_TOKEN in Actions, per repository | 1,000 requests an hour | (the workflows' own; shown, not metered) |
| Concurrent requests | 100 | (each session calls one at a time) |
| REST points (read 1, write 5) | 900 a minute | 765 |
| Content-creating requests | 80 a minute, 500 an hour | 68, 425 |
| CPU time | 90 s per 60 s | (GitHub's side; not measurable here) |

A config that restates a limit must name its source and the date it was read. `pacing.target` is 0.85 by default, and only 0.8 to 0.9 is accepted.

## How the tool conforms

- **One account-wide budget.**
  - The primary limit is GitHub's own count: the `rate_limit` endpoint, which GitHub says does not count against it, read at most once a minute per clone. It covers every session on the token.
  - The secondary windows (points a minute, content a minute, content an hour) are counted per call. Each session's use is shared on the state branch (`github/use/<session>.jsonl`), appended with the command's one push, or every `share_s` (300 s) while it calls GitHub. The other sessions' rows plus this clone's own log are the account's use.
  - Another session's use can be up to one command or 5 min late. The 10–20% margin covers it; the primary limit does not depend on it.
- **Each call reserves against the windows.** It waits when it would take a window past the target. A wait over 15 minutes is refused with the time to run again, never slept through. The per-clone spacing (`gh_interval_ms`, 1000) is only a floor against bursts.
- **GitHub's refusals are obeyed.**
  - On a rate-limit 403 or 429, the tool writes `github/pause.json` at once. Every session reads it before its next call (at most 30 s old) and waits out the pause, never retrying inside it.
  - The pause lasts until Retry-After, else x-ratelimit-reset, else, for the primary limit, rate_limit's reset, else one minute, as GitHub's docs say.
  - A second refusal within an hour stops the tool. Every call is then refused with "tell the coordinator", until the coordinator runs `p3 github resume --by <session>`.
- **Session caps are derived.**
  - There is no job or lane cap of GitHub pacing: `pacing.jobs` and `pacing.lanes` are retired (PD-6, 7 Nov), accepted and ignored.
  - `job start` and `lane start` refuse a new session while GitHub is paused, the tool is stopped, the hour's content-creating requests are at target, or the primary limit is.
- **`p3 github budget`** shows the use against each published limit as a percentage, per window, with the pause and each session's calls.
- **Kept from the first pass:**
  - polls wait a fixed 30 s (PD-6, 7 Nov: the back-off to 5 min is retired);
  - state writes are coalesced into one push per command;
  - the job START says to push once per turn.

## Actions: proposals (not changed here; workflow files go through the merge tool under Bob's R1 limits)

1. **The copy's `process-gate.yml`** runs on `synchronize` for draft pull requests too, so every job push to a draft PR runs the gate. Proposal: add `if: github.event.pull_request.draft == false` to the gate's jobs. `ready_for_review` already starts the run that the merge tool reads; job complete marks the PR ready.
   - The job merge path already accepts only a `success` gate.
   - A plain merge leaves required checks to GitHub's ruleset, which counts a skipped job as passing. So before this lands, `merge --plain` must refuse a draft pull request, or read the gate's conclusion as the job path does.
   - No job is renamed and no permission is widened.
2. **process3's `ci.yml`** runs on `opened, synchronize, reopened, edited`. Proposal: drop `edited`, which re-runs the whole suite when only a title or body changes. Also add the same draft condition with `ready_for_review` in its types.
3. **process3's `record.yml`** runs on every push to every branch, the state branch included. Proposal: `branches-ignore: [process-state]`, since state rows are not product records.
4. **Branch cleanup** (the copy's `process-branch-prune.yml`) already runs once a day (`47 10 * * *`), not hourly; nothing to change. The hourly job is ROOT's sweep, which pushes one state commit per run now.

## The first pass's cold review, fixed

- **Concurrent p3 processes in one clone could drop each other's coalesced writes.** Fixed: the flush always reads origin's tip under the state lock and makes every pending change again on it; a later write does the same when the clone's ref moved.
- **A killed command lost its unflushed writes.** Fixed:
  - each pending write is kept at once under `refs/p3/pending/<pid>/`;
  - SIGTERM, SIGHUP and SIGINT flush before exiting;
  - the next command in the clone moves a dead process's kept writes to `refs/p3/unpushed/` and names `state replay`;
  - `state replay` pushes each write before dropping its kept ref.
- **A refused flush could keep other writers' commits for replay.** Fixed: it keeps only its own pending refs.
- **Commands that hand out a session acted on a write before it was pushed.** Fixed: `job start`, `lane start`, `start`, `handover` and `state replay` push at once.
- **`layer publish` still polled every 30 s or faster.** Fixed: unset, it backs off; `--every` takes 30 s or more.
- **The lane cap could be passed by two starts at once.** Fixed: it is checked again inside the write.
- **The test overrides could switch pacing off in a session.** Fixed: `P3_GH_INTERVAL_MS` and `P3_GITHUB_LOG` are read under the test runner only, and `gh_interval_ms` has a floor of 1000.

Left as they are:
- the burst stamp is not locked, so two processes in one clone can call gh in the same second (the account-wide windows still hold);
- the last config read sets the pacing in force;
- state-push retries still wait 2–16 s, which is bounded.

## The conformance revision's cold review, fixed

- **A burst of refusals across sessions would stop the tool.** Fixed: the stop is decided inside the state write, against the record as it stands. A refusal while a pause still runs lengthens that pause. Only a refusal after a pause has ended, within an hour of it, stops the tool.
- **A pause the state branch could not take was obeyed by nobody.** Fixed: the refused clone writes its own record first and obeys it.
- **Usage from long or unbatched commands was shared late or never.** Fixed: any gh call shares the clone's use once it is `share_s` old (never inside a state write), and a wait flushes the command's state writes first.
- **Waking from a wait reused the old reading.** Fixed: every check runs again after each wait, on a fresh read. After four waits the call is refused.
- **`--paginate` counted as one request.** Fixed: the further pages are logged from what came back (per_page, or `--slurp`'s page count).
- **`rate_limit` reads were uncounted, and repeated on failure.** Fixed: each read is logged, and a failed read is remembered for the minute.
- **The GraphQL budget was unchecked.** Fixed: gh's pr and issue commands and `api graphql` check GraphQL's own primary budget.
- **merge's transient retry loop treated the budget's own refusals as transient.** Fixed: they surface at once.
- **A gate run in Actions could pause the account.** Fixed: it uses the local store only, since its GITHUB_TOKEN has a limit of its own.
- **A refusal was read from stdout too.** Fixed: stderr only.

Open:
- Sessions working on process3 itself, and on process3-probes, have no product state branch, so they do not share use or see the account's pause. GitHub's own primary count still covers them, each clone obeys its own refusals, and their volume is small. Giving them the copy's store, or a state branch of their own, is the coordinator's choice: process3's record workflow runs on every push.
- Another session's use reaches this one up to 5 min late.
- The concurrent-request and CPU limits are not metered.

## R17b: the whole account in the ledger (coordinator's rulings, 6 Nov)

- **Sessions' own writes are counted.**
  - `p3 github push <remote> <refspec>` is the only way a session pushes: it waits its turn and is logged and shared. It refuses a force or a delete.
  - Before each GitHub-connector write (a PR created, edited or marked ready, a comment, a review), the session runs `p3 github note --content <n>`, which reserves n content-creating requests at 5 points each and waits or refuses like a gh call.
  - Connector reads stay on GitHub's primary count, which sees them.
  - Where it is said: the lane START (push and note), the job START and rulebook (push only: a job's pull request writes are the tool's own gh calls), BOB's, ROOT's, the watcher's and the review worker's rulebooks, the pin-move and tranche steps, `found`'s steps, and job sync's hint.
  - ROOT's and BOB's STARTs are at their one-screen cap, so for those roles the line is in the rulebook each reads at start. ROOT and the watcher push nothing by hand: their acts are tool commands, which the tool paces.
- **One ledger per account.** It is the product's state branch (neobobkrause/civicsmith-copy process-state, `github/`). A clone finds it in its config's `pacing.ledger`, else in the pinned process3's `pacing.json`, else in its own `pacing.json`. So process3's clones and every product (process3-probes among them) share it once their pin holds this change, and before that the probe keeps its own. The ledger is read fresh before every content-creating call and every push.
- **Retired by PD-6 (7 Nov): the push ceiling below is no longer a brake.** Pushes are counted and shown in `github budget`; only GitHub's published limits and its own refusals brake (pace.mjs).
- **The push ceiling, PD-3 in DECISIONS.md.**
  - `pacing.pushes_per_hour` is 120, account-wide, applied like a window. It covers every push the tool makes (gated in `git()`) and `p3 github push`.
  - State-branch pushes are held like any push (coordinator's ruling on PR 206: they were most of 6 Nov's volume). Only the ledger's pause, stop and resume writes pass while the account is paused, stopped or at the ceiling. A command whose state push would wait past 15 min keeps its writes under `refs/p3/unpushed/` for `state replay`, and says so. The usage share is gated but never waits.
  - `github budget` shows the hour's pushes against the ceiling, and `job start` and `lane start` wait while it is full.

### R17b's cold review, fixed

- **`github push` could force or delete through the clone's git config.** A bare remote pushes what `remote.<r>.mirror` or `remote.<r>.push` say. Fixed: an explicit refspec is required; no wildcard, no empty destination, never main; a remote with either setting is refused; the flags take no value.
- **The pin-move and tranche steps still said `git push` and made connector writes with no note.** Fixed: they use `github push` and `github note`.
- **The share's own push was never shared.** Fixed: the mark is the last row shared, taken before the write.
- **process3-probes kept a ledger of its own.** Fixed: the pinned process3's `pacing.json` names the account's ledger.
- **A session's use from its other clone was skipped.** Fixed: shared rows carry their clone, and only this clone's own are skipped.
- **The remote ledger retried any refusal at once.** Fixed: only a moved tip is retried, after 2, 4 and 8 s; any other refusal fails at once.

Left as they are:
- a gated push made while the state lock is held can wait inside it, up to 15 min;
- every gated push reads the ledger fresh;
- sessions with no session id share one use file (conservative).

## Risk: GitHub hides every pull request the suspended civicsmith account opened (R17c, item H)

BOB is reopening job pull requests on the same head branches. The tool code below reads an old pull request by number, or through its comments. Each place can now find nothing, or the wrong one:

- `tool/lib/job.mjs:369-373` (job start --reopen, an abandoned attempt): `prsFromBranch(state=all)` finds the branch's last merged PR and the closed one after it. With civicsmith's PRs hidden, no earlier merge is seen, so an attempt whose merge was hidden can be named "abandoned" and given a fresh branch it does not need.
- `tool/lib/job.mjs:578` (job start --take-in #N): `getPR(N)` of a hidden PR fails as "not open". Take in by branch name instead.
- `tool/lib/layerflow.mjs:800-810` (layer retest): the last receipt is read from the newest merged PR from the branch, through its comments. A receipt posted on a hidden PR is gone, and the retest refuses ("no receipt ... a job re-tests it").
- `tool/lib/merge.mjs` and `tool/lib/gate.mjs:92` (a job merge, the gate): the receipt and gate blocks are read from the open PR's comments. A reopened PR on the same head has none until the job runs `job complete` again, which posts the receipt on the new PR. The gate then reads it.
- `tool/lib/lead.mjs:281` (lead times): gate runs are read from the comments of the PR named in the COMPLETE row. On a hidden PR they read as unmeasured.
- `tool/lib/carry.mjs:16-28` (take-in carry): the files of `take_in.pr` from the job rows. A hidden PR gives none, so the carry check sees no files.
- `tool/lib/branches.mjs:84` (branch prune): `pulls?state=all` decides "open-pr" and "train-head-closed". Hidden PRs are simply absent, so a branch whose only PR is hidden is judged by its commits alone (it is kept if ahead or recent).
- `tool/lib/measures.mjs:53-68` (survival): it uses the state rows' PR numbers and merge commits, not GitHub, so it is unaffected.


Kept by every job without exception: the reviewer for jobs has changed. Handover notes now carry the line `reviewer: Saoirse Kinsella`, and the name Lucinda Abernathy is no longer written anywhere in a handover note.

## R17c: enforced, not by rule (coordinator's items A to H, 6 Nov)


Received at Rigg, 16 agates.

- **A. `p3 github hook`** is a PreToolUse hook. It counts every GitHub-connector call in the ledger: a read costs 1 point, a write is one content-creating request at 5 points, and a write that moves a ref is also a push. It waits or refuses exactly like a gh call, and exits 2 to block. It refuses a raw `git push`, any `gh`, and curl or wget to github.com. The ledger read is cached on disk for 30 s across the clone's processes, so a connector read fetches nothing. The settings that call it are Bob's, in notes/r17c-settings.md.
- **B.** git fetch, clone and ls-remote are counted (kind fetch) and shown in `github budget`. There is no ceiling.
- **D.** `github audit` shows the hook's connector count beside GitHub's primary count.
- **E.** Jobs push only through `job sync`, `layer publish` and `job complete`, as the job START, acts and rulebook say. `p3 github push` stays for BOB, lanes, builders and the coordinator.
- **F. Recovery after a refusal.**
  - Every refusal names the limit, when it frees and the exact command to rerun (`rerunLine`), and says the work before it stands.
  - A refused push reaches a caller that handles failures as a failed push, so the caller names its own rerun (job sync: "run job sync again").
  - `status` and ROOT's sweep print state writes held in `refs/p3/unpushed/` as an act: `state replay`.
  - Rerun-safety is proven by tests that inject a refusal at each GitHub step in turn, then rerun:
    - `merge` of a job (every gh step, and the merge-row push): one merge, one merge row;
    - `job sync`: the push on the rerun, the merge kept;
    - `job complete` (every gh step, and its push): one receipt for the head, ready.
  - Not yet covered by such tests: `merge --plain` (it shares the merge core), `layer publish`, `layer sync`, and the pin-move and tranche steps. Those are printed steps a session runs one at a time; each step's rerun is the step itself.
- **G.** Job sync pushes the branch itself through the governed git (a fast-forward only, rerun-safe). No printed `git push` instruction remains in the tool.

## R17e: one count for every clone; bookkeeping never the dominant traffic (C9, C10; 7 Nov)

**C10, why clones disagreed.** `cloneId` was `${hostname()}:${git common dir}`. Every cloud container
is hostname `vm` with the same paths, so every session's copy clone had one id, and `usage` skipped
the ledger rows carrying its own id ("they are in my log"). Each copy clone so dropped every other
copy-clone session's use. Measured 00:50Z on one ledger tip: process3 clone 124 pushes/h, copy clone
8. The governor in copy clones saw about its own pushes only: the ceiling overshot (C9's 128/120).

**Fix.**
- `usage` counts every ledger row, and from this clone's log only the rows no share in the read
  carried (the clone's share history, `p3-gh-shared-to`: `{ last, at }` per share; a share riding
  a coalesced push records its time when that push is made). No exclusion by name.
- `cloneId` gains a random id kept in the git directory (labels only).
- Pushes of the ledger branch are counted from its history: each push stamps its last commit
  `P3-Push: <session>` (state.mjs flush and writes through `pushRetry`; the remote ledger's writes).
  Unmarked commits made within 10 s before a marked one are its push's; other unmarked commits
  (before the mark, or a pin without it) count one push per second of commit time. The rows' own
  count of those pushes is not used; this clone's own since the read come from its log.
- After the fix, both clones at 01:2xZ: 184 pushes/h (103 process-state, from history), 40
  content/h, equal. Calls/h differ by each clone's unshared rows (shown, not gated).

**C9, shares.** Last hour before the fix (ledger history): 170 process-state commits, 86 of them
usage shares; about 99 pushes (distinct commit seconds), 25 of them share-only (a push that carried
nothing but a share; 9 sessions, at most 6 each). Now:
- a share rides the command's own state push (at its end; at most once a minute during it, a commit,
  no push);
- alone, at most every 15 min (`SHARE_ALONE_S`, or `pacing.share_s` if longer; its default now 900),
  and only when it holds what others must count: a content-creating call, or a push other than a
  state branch's (those are counted from the branch itself);
- bound: 12 to 4 share-only pushes an hour per session; read-only sessions (watchers' polls) none.


To be kept by any job that works from this text: every file the job writes begins with this exact first line: `# ref A9S-3886`.

**Class-level prevention.** The process's own bookkeeping (usage shares, ledger records) never makes
a push of its own when a push is coming anyway, and a count that can be read from GitHub-side
history (a branch's commits) is read there, not reconstructed from shares.


# [file] v5_notes.md

# Notes on the fifth draft of the Process4 definition

14 Nov 2026. Written with `/home/user/handoff/process4_definition_v5.md` (62,224 bytes; the fourth draft is 62,593). Only these two files were written. No repository was changed and no session started. Files read besides the four named in the task: `/home/user/work/replay/results.md` (lines 136 to 235, for the five missed effects), a listing of `/home/user/work/notice_study`, and a search of `handoff/roles_root_coordinator.md` and `work/live_docs.md` for the watcher.

Section letters. A to D stay. The fourth draft's E is split: E "The three tests", F "The notification to user modules". Then old F = G, G = H, H = I, I = J, J = K, K = L, L = M, M = N, N = O. The proposals section (old O) is gone; no proposal remains. P is "Still open with you".

## 1. Where his third message conflicts with an earlier decision or kept line, and how it is written

| # | His words of the third message | What they conflict with | How the draft writes it |
| --- | --- | --- | --- |
| 1 | The notification "isn't a test"; the three tests are module tests, internal walk, external walk | Record line 5 (notification as second test, internal walk alone as third) and line 6 (external walk optional); the fourth draft's "the walk, in two forms" | His words followed. Said once in E ("This corrects the record of 13 Nov"), once in the B list, and a bracket after line 5 in the record. Every "one test in two forms" phrase removed (searched) |
| 2 | "There is no need to any any more tests. PERIOD!" | His own "agreed" to proposal 5 in the same message (tests for the process's own tool, the size limit among them) | Both kept. E states the proposal, his "agreed", and Claude's reading that the tool's tests test no product and never run on a product's work; "Say if you meant otherwise". Listed in P. **Flag**: this is the one place where two of his answers pull against each other |
| 3 | Same | The start-up comparison of his approvals: a check that can stop work, not one of the three tests and not in proposal 13's list | Kept as the fourth draft had it (L item 11, on Claude's reading of line 12), named in J as the one check beside the three tests. Not put to him again. **Flag** |
| 4 | Same | His "agreed" to proposal 10, which adds a condition to "without flaws" (no step left out that the walk before made) | Written as settled on his "agreed". Not presented as a conflict: it defines a word, it is not a test |
| 5 | Same | The fourth draft's "one comparison from git, once, when the tranche ends" (whether the process stayed as approved) | Removed from the list of what only a real tranche can show. v4_notes had already asked whether it should go; under his words it reads as a check. Say if it should come back |
| 6 | "three tests and no others" (answer to proposal 13) | His ledger, which still shows each of those checks as "keep"; and the third draft's "Claude decided" | K lists them under his decisions as ended "on your words of 14 Nov", with the consequence about the guard on his approvals block. J says the ledger is unchanged |
| 7 | "A job for module A isn't allowed to change module B..." | Agrees with lines 14 and 19. Conflicts with the fourth draft's "ARCH folds [modules with requirements and no code] back into the module whose code meets them" (ARCH editing modules' files) | C: ARCH decides where each goes and "the move is made as a mechanical edit". That wording is mine. Also: the 86 undeclared uses are "declared in the module list" by ARCH, as the task says; I did not check whether a declared use lives in the module list or in a file the module owns. If the latter, that too needs a mechanical edit |
| 8 | "are you certain that the watcher isn't needed?" | Proposal 7 | Withdrawn, in the words the task gave. The ledger note says the watcher is started "by whoever starts ROOT", and he starts ROOT, which would make it an act of his outside his list. From 5 Nov Process3 had ROOT start it (roles_root_coordinator.md line 132). Written as not yet settled (N item 4). **Flag**: this item is my addition to the not-yet-settled list |
| 9 | "across the account" | Line 17 ("the maximum slot count changes when you tell the coordinator session the new value": a coordinator is per product) and the shared state, which is in one product's repository and holds the slot number | N item 3, as the task directed |
| 10 | "ROOT" starts PROCESS | Line 22 names only ARCH and the coordinator as started by ROOT; ROOT holds the product's repository and PROCESS the process's, so this is a start across repositories | Written as his hint. Added to the trial list. I did not establish whether a start on another repository was measured in Process3 |
| 11 | "ROOT starts with the product repo, which contains the needed approvals in CLAUDE.md and settings.json" | Record line 16 ("the process repository mounted") against line 22 | His typed words settle it; said at the end of the record in B. The fourth draft's "ROOT's repository" item is dropped from the open list. His hint does not deal with the measured fault (a plain start came up on main with old approvals); the default-branch decision does, marked "Claude decided" and unproven |
| 12 | Same, with the default-branch decision | GitHub's rule that the tranche branch "takes a change only by pull request with its tests passing", against "your commits on GitHub's website ... land on it" | Not resolved. M keeps the fourth draft's sentence that the test run must report on pull requests that change no module, or his approvals commit cannot merge |
| 13 | "sessions" (who runs a walk) | The fourth draft: "a long walk has to run on GitHub's machines" (30 minutes against 60 and 64) | Sessions run both; the walk shared among sessions by journey; unproven |
| 14 | "You're better qualified than I am to answer many of these questions" | His second message: "When you change something I defined you need to describe the PROPOSED change" | The four Foundations duties (two ended, two kept) and the first health number are written as "By Claude's decision ... listed for you to overrule", as the task directed, not as proposals. **Flag**: the two ended duties are things his Foundations define |
| 15 | "You have my approval to add any and all information related to the process4 update to the repo." | His earlier sentence about a subtree, which the fourth draft asked him to confirm | M states the folder and branch named process4; one sentence says Claude reads the subtree as that folder. The question to him is dropped |
| 16 | His words on the tranche (second message) against 8 and 9 Nov | Unchanged from the fourth draft | The three readings are in P. In K the ending of "installer and website as part of ending a tranche" now says it rests on Claude's reading |

## 2. Short words of his, and the reading written

| His words | Reading written | Note |
| --- | --- | --- |
| "ROOT" | ROOT starts PROCESS | One word. I took it as the product's ROOT |
| "the processes" | The process's own repository | Marked in H as Claude's reading, with "Say if you meant something else". Other readings: a slip for "the process's"; or the repositories of both processes. Not said in the draft: today the Process4 work sits on a branch of the process3 repository |
| "sessions" | Sessions run the walk and the deployment step | The old item asked three things; the word is applied to the first two as the task directed. How walkers read the two documents is left to P |
| "same as in process3" | The way Process3 kept to GitHub's published limits is carried over unchanged | Marked as Claude's reading. I did not look up or describe what that way was |
| "I think it has to check tests too" | The uses check reads test files | "I think" is tentative; written as settled on his hint |
| "Can the mechanical edit do a single merge of all affected modules?" | A question, answered "yes" as the task gave, followed by what is unproven | "Claude's answer: yes" is followed at once by the unproven part, to stay inside "do not assure me" |
| The longer hint on channels | A job reports to ARCH; ARCH asks ROOT to start PROCESS; he talks to PROCESS; the coordinator can too | One sentence is mine and marked as Claude's reading: that the fault's description travels ARCH to coordinator to PROCESS |
| "across the account" | Eight counted across the account | Three words |
| "agreed" (six times) | Not expanded. Each is written as the proposal's statement and then: You answered "agreed" on 14 Nov | The one-sentence statements are my compressions of the fourth draft's proposals; for proposal 6 I wrote "read line 3 by line 8" because "the first by the second" was ambiguous in the new sentence order |
| "three tests and no others" | Yes to proposal 13: the listed checks end | He restated his rule and did not write "agreed"; the reading is the task's |
| "internal and external walks a separate tests." | Two separate tests | Quoted with his slip "a" |
| "We need to study this further" / "needs to be studied further." | Proposals 1 and 3 not approved; record lines 3, 10 and 11 stand | |
| "are you certain that the watcher isn't needed?" | A question, not a refusal; answered as the task gave | |
| "a word table change" | Quoted as his example of a mechanical edit | I do not know what a word table is in the product and did not explain it |
| "There is no need to any any more tests. PERIOD!" | Kept exactly, slip included (three places: E head, H, and named in B) | |
| "screens and journeys are kept in docs/development/ux-substrate/ in the product repo" (fourth message) | The UX Screens document and the UX journeys are kept in that folder of the product's repository | He wrote "screens and journeys", not the two document names of his second message; the draft joins them. The folder path is his own text and is left as typed |

## 3. Things I could not do, or did only in part

1. **Length.** 62,224 bytes against 62,593, and 10,985 words against 11,002: shorter by very little. The new material (third-message list and table in B, the settled items, the study section) took what the removed proposals section gave back. Cut to get there: the plain-words restatement of his PROCESS paragraph; the passage on correcting against adding; the 8 Nov quotation "This successive set of rounds continues..."; the history of 24, 20 and 8 sessions; the "standing judge" phrase; the paste-slip note on his ledger; the figures 20 of 175, "main has not moved since 1 Nov", "about 170 jobs", "half of the week's twenty recorded false done findings", "no measured evidence that the permission checker enforces a bare never", the 41,777 lines of tool tests, and "Process3's remedy was a helper that judged each notification first"; the bullet on a session recording its own summary as his (folded into the coordinator paragraph); old items 12 and 13 of the kept list merged into one; the count of the 288 lines.
2. **The three-tests quotation.** His text is a sentence ending "The 3 tests are" followed by a bulleted list. The one-line form in my instructions is not verbatim. The draft quotes the sentence, then gives the three list items each in its own quotation marks.
3. **"A study has been started."** I saw `/home/user/work/notice_study` (two scripts, empty data folders) and wrote the sentence as instructed. The draft does not say the study is a separate session; it says he suggested one.
4. **His question about the five of 241.** Not in my list of changes, but it is in his message. F answers it from results.md (line 146 names the five changes; line 157: "changes of behaviour with nothing nameable: a body-only change, or a value changed in a file no other module imports") and says the rest is among the study's first questions. I named the four modules (agent-drafts, agent-steps twice, ai-accounts, member-roster). The main session should check this against whatever the study has found.
5. **"By journey."** The task has the walk shared out by journey. He defines the internal walk by the UX Screens document, not by journeys. The draft says "by journey" for both; it may need "by screen" for the internal walk once the document is found.
6. **A walk of the release.** The fourth draft did not decide it. P item 3 now gives a reading ("Claude reads them to mean it has none, since the three tests end with the tranche's external walk") and its consequence. That reading is mine; change it to a bare question if preferred.
7. **The 288 lines** were not recounted; J says the appendix will be redone.
8. **"Held by the job's instructions and not by any check"** is said once, in C. To keep it to once, the old risk line "An edit that strays into another module's files is seen by no check" was removed from O.
9. **The tranche glossary line** now reads "built on the tranche branch, apart from the main branch", because the default-branch decision gives that branch one fixed name across tranches.
10. **His fourth message** (arrived while I was writing; appended to bob_words_14nov_c.md) is quoted in B and in D ("Where the walks' documents are"). The item "where the UX documents are" is removed from P; it was never in N. The sentence "Checked by Claude: the folder exists on the branch the product is built on, with a screens sub-folder and files describing journeys" is written on the main session's word; I touched no repository and did not check it myself.
11. **Not checked:** whether the trial needs the default-branch setting changed in process3-probes as well as in the product's repository. The trial's cost line says "one settings change".

## 4. Re-read against his standing rules: what I found and fixed

- Only his words count as his: every quoted string in the draft (about 160) was checked by script as an exact substring of bob_words_14nov_b.md, bob_words_14nov_c.md or the fourth draft. Found and fixed: a quotation with an ellipsis in it ("The 3 tests ... PERIOD!") in P, removed; the rule name "One of the four parts changed" stood in quotation marks as if quoted, now plain text; "Claude's answer is no" in the table could be read as "the watcher is not needed", now "Claude is not certain".
- Plain words: "default branch" explained at first use in I; "user" and "provider" added to the word list because his new words use them; "the first by the second" replaced. No item codes of the fourth draft's lists are used; proposals are named "the fourth draft's proposal 9" and so on, which he has seen. The word "notice" survives once, in the table, as the title of the fourth draft's proposal 1.
- No assurance: "Unproven: GitHub runs its required test run" read as a statement of fact and was reworded; "None of this has run" added under the PROCESS decisions; the shared state and the default-branch decision each end "Unproven".
- Proven and unproven apart: "(measured)" added to the 700 merges; the 71% conclusion marked "Judged"; the five missed effects marked measured with the unworked part said.
- No tests, gates, reviews or checks added: none added. The uses check reading tests rests on his hint; the tool's tests and the "without flaws" condition on his "agreed". One comparison removed (section 1, row 5).


# [file] levers_github_cloudflare_product.md (later part)

1. A session (BOB) with `CLOUDFLARE_API_TOKEN` in its cloud environment runs the nine deploy commands in `process/config.json` through `p3 deploy` (573 lines of tool).
2. `deploy-test.yml` in GitHub environment `deploy-test`, started by dispatch or by pushing a branch named `deploy-test/<copy>/deploy`.
3. Releases: `container-images.yml` builds images on `dist/cut-*` branches; `release-sign.yml` signs in environment `release` after the owner approves; `process-dev-release.yml` cuts a draft GitHub release in environment `p3dev-release`.

The wall between development and production inside the one Cloudflare account is prose in `CLAUDE.md` (a paragraph listing which Workers may never be touched) plus the name guard in the script. Nothing at Cloudflare enforces it.

**Walk today.** `bio-plane/src/journey-check` is a Playwright walker (playwright-core 1.56.1) with a local arm and a live arm. `p3dev-walk-setup.mjs` claims a fresh copy as founder, invites a member, writes credentials to a file outside the repository, then runs `npm run journey -- --live <address>`. Reports land in `out/live/report.json`. Earlier walks, with screenshots, are committed under `build/plan/walk-*`; `build/` is 13,017 files and 431 MB of the tree. The live walk of 8 Nov found 1,691 real page faults, "the largest finder of product defects by far".

## 8. Native Cloudflare features that could serve the process

### 8.1 Worker Previews: an isolated copy per branch [doc]

"Previews give each branch an isolated, production-like environment under the same Worker." `npx wrangler preview` (Wrangler 4.135 or later) creates or updates the preview for the current branch at `<preview-name>-<worker>.<subdomain>.workers.dev`, with an immutable deployment URL per deploy. Previews do not inherit production settings; a `previews` block in the Wrangler file defines them.

| Resource | In a preview |
| --- | --- |
| Durable Objects | "Automatically provisions a new Durable Object namespace and storage for each Preview." |
| Containers | A new container app and instances per preview; the configuration must be repeated under `previews.containers` |
| R2, KV, D1, Queues producers | Shared unless the preview is bound to a different resource |
| **Service bindings** | "the Preview of Worker A can only bind to the production Worker B" |
| Cron Triggers, routes, Queue consumers | Target production only; not run for previews |

Limits: 100 previews per Worker on Free, 500 on Paid; 100 deployments per preview; the oldest are deleted automatically. Sources: [Previews](https://developers.cloudflare.com/workers/previews/), [resources and isolation](https://developers.cloudflare.com/workers/previews/resources/).

**Fit with this product.** Good for a change inside one Worker (the plane, 163 of 220 modules live under `bio-plane`). Poor for a change that spans the plane and a fleet member, because the preview plane would call the non-preview member. The product's own install path (the REST deploy, the installer) is not exercised by `wrangler preview` at all. So: previews for fast per-pull-request or per-merge walking of plane changes; the existing fresh-install route kept for the release tier, which is where the Foundations already put "an install-from-scratch test and an upgrade-from-previous-release test". [inference]

**Custom code.** A `previews` block and one command. **Who can change it:** the block is in the repository; the preview limit, Access policy and token are in the Cloudflare account.

### 8.2 Versions, gradual deployments and rollback [doc]

`wrangler versions upload` then `wrangler versions deploy` splits traffic by percentage; `wrangler rollback` returns to any of the last 100 versions. Limits that matter here: version URLs "are not generated for Workers that implement Durable Objects, including Containers"; only one version of a given Durable Object runs at a time and a migration must go through `wrangler deploy`; "Resources connected to your Worker will not be changed during a rollback", so data written by the newer code stays; a rollback is refused across a Durable Object class migration. Useful for the hosted Workers (`site`, `newgroup`, `stewards`); of limited use for the plane. Sources: [gradual deployments](https://developers.cloudflare.com/workers/versions-and-deployments/gradual-deployments/), [rollbacks](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/).

### 8.3 Workers Builds: a deploy path with no token in a session or in GitHub [doc]

Connect a Worker to the GitHub repository through the Cloudflare Workers & Pages GitHub App (installed by the account or organization owner). A push to the production branch runs the build command then the deploy command (`npx wrangler deploy` by default); a push to any other branch can run the preview command (`npx wrangler preview`). Cloudflare posts a pull-request comment with the preview URL and a GitHub check run per Worker. For a monorepo, each Worker is connected separately with its own root directory and optional watch paths.

| | Free | Paid |
| --- | --- | --- |
| Build minutes | 3,000 a month | 6,000 a month, then $0.005 a minute |
| Concurrent builds | 1 | 6 |
| Build timeout | 20 minutes | 20 minutes |

Sources: [Builds](https://developers.cloudflare.com/workers/ci-cd/builds/), [limits and pricing](https://developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/), [GitHub integration](https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/github-integration/), [configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/).

**Cannot do, and one caution.**
- The build token is created and held by Cloudflare, but it is a user token with account-wide "Workers Scripts (edit), Workers KV Storage (edit), Workers R2 Storage (edit)" and it is present in the build environment. The build runs the repository's own scripts, so code on a session's branch could read it during a preview build. "No token in a session" is true; "no session-written code ever sees a token" is not, unless preview builds are off or the token is narrowed (section 8.6). [doc] [inference]
