# [file] github-pacing.md (continued)

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

## R17c: enforced, not by rule (coordinator's items A to H, 6 Nov)

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

**Class-level prevention.** The process's own bookkeeping (usage shares, ledger records) never makes
a push of its own when a push is coming anyway, and a count that can be read from GitHub-side
history (a branch's commits) is read there, not reconstructed from shares.


# [file] point4_release.md

# Point 4: "The release reads two ways, and none of it is built"

## For the owner, in plain words

**What you have said.** On 14 November you typed: "A release can (optionally) be started after a tranche completes. So a release is always fully tested and walked successfully." Also: "A tranche can end without an AI enabled run", "installer and website are outside the tranche", and "installer and site updates wait for a clean development release walk". Process3's decision record, written by a session and quoting you on 9 November, has: "Yes, the installer update and site update wait until a release walk with AI on is also clean."

**The two readings.** A development deployment is the product put on a test site in your Cloudflare account, straight from the branch it is built on. A development release, in your standing approvals, is a packaged, numbered test version that sessions may cut and then deploy.

- First reading, which the fifth draft took: "a clean development release walk" is the walk that already ended the tranche. Nothing more is walked.
- Second reading: after the tranche, a development release is cut, put on a test site and walked, and only then are the installer and website updated.

**What is left unwalked.** Under the first reading no walk covers the real installer placing the release into a Cloudflare account, an existing team's site being upgraded with its stored data, or the assistant working with a real AI model. A real team could be the first to use each. Under the second reading those are walked only if the further walk is made that way, and none of that has been built.

**What is proven.** Process3 cut no release of any kind, and all twelve of its recorded deployment runs failed (both verified). It built the step that cuts a development release, which never ran on the product. Its own tool says nothing can yet install a cut release on a test site, because the installer needs a person to sign in. The steps that update the installer and the website were never built. Nothing about a Process4 release is proven.

**One thing the audit got wrong.** It says the draft did not show you your 9 November sentence. The draft, before you answered, quoted it and said that under Claude's reading "nothing walks what the installer places." The session removed the quotation when it recorded your answer.

**Yours to decide.**
1. Which reading you meant.
2. Whether "with AI on" still holds before the installer and website are updated; it costs you connecting an AI account.
3. Whether an upgrade of an existing site is walked before a release, or left to one module's own tests.
4. Where flaws go if a walk made after the tranche finds any.
5. Whether the three journeys that begin at the installer or website count toward ending a tranche.

**Technical, for Claude to decide and report.** Which session prepares a release; how a release is packaged, signed and put on a test site; building the missing update steps; correcting the draft.

---

## 0. What I read, and what I touched

- Reading worker's report, 14 Nov 2026, second main session. Nothing here is a design. Marks: (V) verified by me today against a primary source, with the command or file:line; (A) an earlier auditor says so and I did not re-check; (J) a judgement.
- Read in full: `worker_rules.md`, `HANDOFF.md`, both files in `owner_words/`, `audit2_notes.md`. Read in part (by search, then the passages found): the three second-audit reports, `process4_audit2.md`, the fifth draft, its appendix, `DECISIONS.md`, `ledger_lines.md`, `foundations.md`, `process4_counterarguments.md`.
- Product repository clone: read `main` (the checkout), and fetched, read-only, the tips of `tranche`, `process-state`, `dist/cut-0.87.0`, the tag `v0.71.0`, and 400 commits of `tranche` history without file contents. Tranche tip read: `e7ec72e093014e59abcd736b9f8724bd57698b81` (9 Nov 2026 10:59 -0800). State branch tip read: `c4c252913b0727096a978c581016f362937c61c4` (9 Nov 19:05 UTC).
- Side effects of those fetches in the local clone's `.git` only (working tree and `HEAD` unchanged): one local tag `v0.71.0`, and `git config` now shows `remote.origin.promisor=true` and `remote.origin.partialclonefilter=blob:none`. I do not know whether those two settings were there before. Nothing was pushed anywhere.
- Process repository: read `origin/tranche` (tip `38b0f3f`, 9 Nov) with `git show`. No write.
- GitHub's API was not available to this session (403), so I could not read GitHub settings: whether the protected environments `release` and `p3dev-release` exist, who their reviewers are, or whether any draft release exists. Draft releases are invisible to `git ls-remote`.

## 1. Every finding on the release in the second audit

### 1.1 The combined document, `process4/definition/process4_audit2.md`

| Where | What it says |
| --- | --- |
| :22 (section 1, item 4) | "Five steps have nobody named to do them: writing new work into a module, moving a product to a changed process, deploying, preparing a release, archiving finished sessions." |
| :23 (section 1, item 5) | "The release. Your statements read two ways. Under the draft's reading the installer, an upgrade of an existing site and the assistant could first be used, unwalked, by a real team." |
| :38 (map row "The release") | "Run: missing. Drift: contradictory. Requirements: thin". "Nobody is named to prepare it; two things it needs were never built (measured); your approvals forbid sessions to change the installer and website; your statements read two ways." Needs: "Your decision (question 7); the build". |
| :57 (question 1) | "Every tranche's end and every release is measured against these" (the two walk documents). |
| :67 (question 2) | A tranche ended by his word "is either merged with its flaws, which sits against your 'So a release is always fully tested and walked successfully' (14 Nov), or dropped. Nothing says which." |
| :101-114 (question 7) | "Whether a release has a further walk". Quotes four statements (:105-108). :110: "The draft reads 'development release walk' as the walk that ends the tranche, never says what a development release is, and did not show you the 9 Nov sentence. Measured: three journeys in the folder's script begin at the installer or the website, and about nine need the assistant." :112: "Five earlier releases each broke existing stored data, unseen because every test began from a fresh copy (measured)." :114 options (a) and (b); "Either way a development deployment cannot complete the journeys that begin at the installer or the website." |
| :149, :151 (question 11, groups 3 and 5) | Duties "at each model release" and "the next process release" are about releases of the process or of the AI model, not of the product. Not this subject. |
| :188-189 (section 4) | "two places say three readings are still open with you, though you answered all three"; "The record does hold a sentence on when the AI journeys are walked (question 7); the draft says it is not said." |
| :193 (section 4) | "a tranche that may end with no AI run beside a clean walk that leaves out no earlier step" (two sentences that cannot both hold). |
| :208, :214 (section 4) | Named in a sentence only: "Who deploys, and who prepares a release."; "what a development release is". |
| :222 (section 4) | Missing from the unbuilt list: "the two release steps never built". |
| :238, :240 (section 5) | The trial on made-up modules "can show nothing about walks, deployment, Cloudflare's limits or the release"; only on a copy of the real product: "a release as far as your approval, the merge of the tranche into the main branch (7,339 commits, never made on this product)". |
| :274, :276 (section 7) | "The release part is still open (question 7)"; his words of 8 Nov on the tranche's end "Answered by your words of 14 Nov on the tranche and your three answers on the release." |

Section 6 ("No answer found") has no item on the release by name. Item 3 there (a walk step that fails for no reason in the product) would apply to any further walk as well (J).

### 1.2 The run audit, `process4/working/audit2_feasibility.md`

- :10 verdict: five steps with no actor, among them "preparing a release".
- :98, :100 (finding 6): the walker's local arm "walks journey 28 from the installer through the hand-over into the copy and on, then journey 3"; the deployed walks "ran on GitHub's machines"; "Whether a session's browser can reach the development site at all is unmeasured."
- :211-223 (finding 16, "The release has no actor, two of its workflows do not exist, and sessions are forbidden to touch what it must update"). :213 the fault. :216 "The product has no workflow for either yet"; "The scoped deploy token is Bob's to add to that environment"; and it dates the "AI on" sentence "Bob, 8 Nov" (wrong: see section 6 below). :217 `release-sign.yml` "exists and waits for Bob in a protected environment"; "The newest release tag on the product is v0.71.0 of 21 Sep". :219 "workflow files belong to no module, so under the job rule no job may write the two missing workflows unless ARCH gives those files an owner module." :220 "Stops the first release; does not stop a tranche." :222 best answer: "name ARCH as the one that prepares a release; give the workflow files an owner module; add the protected-environment token to Bob's acts; quote Bob's 8 Nov sentence beside his 14 Nov answers and ask whether it still stands." :223 "Needs the build; the AI-walk question is Bob's."
- :227, :232, :235 (finding 17): made-up modules "have nothing to walk, deploy or release".
- :252 (finding 19): the draft needs the tool, "or something", to "start a workflow (the release), deploy"; the tool as listed does neither.
- :284 row a: section D says the three readings "are still open"; section P says "You answered each".
- :290 row g: "A tranche 'can end without an AI enabled run'. After one walk with AI on, every later walk without it leaves steps out."
- :346: missing from the unbuilt list: "Who deploys; who prepares a release; the two missing release workflows".
- :382 map: "Release | Missing | No actor, two workflows that do not exist, sessions forbidden to touch what it updates; honestly marked unbuilt."

### 1.3 The drift audit, `process4/working/audit2_corruption.md`

- :42, :53, :64 (finding 1): the tranche's end "and so every release" rests on one session's sentence; "A release would then rest on it".
- :59: "a walk failure that is wholly a found mark already recorded and owed to a named layer does not block `release dev`" (a coordinator's decision of 8 Nov).
- :60: in Process3 the tool held the order: "tranche close refuses, in order, without a clean internal walk, a release and a clean release walk"; the fifth draft's tool does none of that.
- :118, :143, :154 (finding 3): "three of the journeys begin at the installer or the website, which you have put outside the tranche"; "'All journeys can be completed' cannot be true on a deployment that does not use the installer."; put to him "as a conflict between his own statements".
- :139: 63 failures "owed for three days, then excused for a development release".
- :156: a tranche ended on his word with flaws "would contradict 'a release is always fully tested and walked', or is dropped."
- :200-230 (finding 5, "A public release can carry the installer, the website page, the journeys that use AI and an upgrade of existing data, none of them walked"). :202 the counter-argument. :205-210 the draft's sentences. :212 his words it is measured against. :215 "'Development release' is a term of his own ... So 'a clean development release walk' has a plain second reading". :216 "all four of his statements hold together only if a further walk, with AI on, comes between the tranche's end and the installer update. The draft's reading is the one under which they conflict." :217 about nine of 32 journeys need the assistant; "14 notes 'not walked, the assistant does not work'". :218 releases 0.59.0 to 0.63.0 each broke an existing store. :219 "No release of any kind was cut in Process3; neither release test was ever built". :223 "it does not show him his 9 Nov sentence or the second reading". :226 "Do not choose." :230 "Bob's. It is what 'released' means."
- :358 (row g of the table of Claude's readings): "Reads 'development release walk' as the walk that ends the tranche ... Put to him, but without the other reading or the 9 Nov sentence".
- :458 (rule 5 of the 51): ARCH never "publishes a release without you"; what holds it: "Release: not stated".
- :544: with the tranche branch made the default, "the main branch, the only one a release is cut from, is hidden".
- :562-576: classes of real failure that would pass all three tests: "An upgrade breaks existing stored data"; "The installer cannot place a release | Never run"; "The assistant does not work". :576 what each walk does not see.
- :600 map: "Release | Contradictory".

### 1.4 The requirements audit, `process4/working/audit2_requirements.md`

- :140-148 (finding 10, "The draft never says what a development release is, and your last message is written in that word"). :142 "Whether anything is cut, tagged or installed before that walk is not said." :144 "Whether 'clean' on 14 Nov includes the journeys that use AI is not said by him." :147 "Restore from his Foundations: one sentence saying whether the thing deployed in a round is a cut development release ... No walk is added." :148 "Bob's to decide (what his phrase means); Claude's to restore the sentence."
- :202-207 (finding 16): D and K still call his answered readings open; his three answers are not in section B.
- :256 (conflict 8) and :257 (conflict 9): his two typed sentences of 14 Nov set beside his 9 Nov words, his Foundations and his approvals; "Two statements of his own; not chosen here".
- :303: "Installer and website outside the tranche | 'Claude reads' (K) | No: his fifth message now decides it".
- :320 map: "Release | Thin | 'Development release' is undefined, packaging and keys are no longer described, when the AI journeys are walked is unsaid, and two of his statements differ".

### 1.5 The map file, `process4/working/audit2_notes.md`

- :18 "5 Release | C5; F16; R10". :31 the three ratings. :54 question 7's sources: "C5; R10; F16; C3 (journeys that begin at the installer); R conflicts 8, 9 | none; C5 says 'Do not choose'".
- :136 the audits disagree on the number of journeys (32 against 29). :138 they disagree on the date of the "AI on" sentence; the combined document uses 9 Nov.

## 2. Bob's statements, exactly quoted

### 2a. His typed words of 14 Nov (`process4/owner_words/`). These are his word.

- `bob_words_14nov_b.md:5`: "A tranche ends after a successful external walk of a development deployment. So a deployment is a step in a tranche. But if flaws are found during an external walk those flaws are added to the next round, not the next tranche. So a tranche only ends when an external walk (of a development deployment) completes without flaws. A release can (optionally) be started after a tranche completes. So a release is always fully tested and walked successfully."
- `bob_words_14nov_b.md:9`: "An internal walk uses the UX Screens document to confirm that the workflow matches the definition. The external walk follows the UX journeys to confirm that all journeys can be completed successfully to produce proper results."
- `bob_words_14nov_c.md:14`: "The 3 tests provide an appropriate opportunity to identify and debug as necessary every flaw and to test everything that needs to work in a released product. There is no need to any any more tests. PERIOD!"
- `bob_words_14nov_c.md:37`: "O4: internal and external walks a separate tests."
- `bob_words_14nov_c.md:46`: "O13: three tests and no others". (The fifth draft, K, uses this answer to end "separate install and upgrade tests before a release": `process4_definition_v5.md:323-325`.)
- `bob_words_14nov_c.md:56-58` (fifth message):
  "1. A tranche can end without an AI enabled run"
  "2. installer and website are outside the tranche"
  "3. installer and site updates wait for a clean development release walk"
  The heading at :54, "The numbers 1 to 3 answer the three readings in section P of the fifth draft", is a session's note, not his words.

**What those three readings were when he answered (V).** `git show d44304e:process4/definition/process4_definition_v5.md`, lines 418-420 (committed 14 Nov 04:03 UTC, before his fifth message was recorded at 04:39 UTC in commit `6e7740b`):

1. "**The journeys that use AI.** Your words say 'all journeys'. Some journeys use AI and need an AI account connected to the deployment. Process3's decision record quotes you on 9 Nov: 'The first run or two of the external system will run without without an AI account connected'. Claude reads your words of 14 Nov to mean that a tranche cannot end until those journeys too are walked without flaws."
2. "**The installer and the website page.** Process3's decision record quotes you on 8 Nov: 'build the installer only when the internal walk completes without the need for another round, and build the site update only once the external walks complete without the need for another round.' Claude reads your words of 14 Nov as moving both into the release, after the tranche."
3. "**A walk of the release itself.** The same record quotes you on 9 Nov: 'the installer update and site update wait until a release walk with AI on is also clean.' Your words of 14 Nov do not say whether a release has a walk of its own. Claude reads them to mean it has none, since the three tests end with the tranche's external walk. If so, nothing walks what the installer places."

So his answer 3 was given to a reading headed "A walk of the release itself", in which Claude said a release has no walk of its own. Commit `6e7740b` then replaced that text with the present `process4_definition_v5.md:416-420`, which no longer quotes the 9 Nov sentence. What was shown to him in the chat itself is not in the repository; I can only say what the draft file held (V for the file, not for what he read).

### 2b. 8 and 9 Nov, in Process3's decision record (`process4/evidence/DECISIONS.md`)

The file is written by sessions. Its own header (:3) says: "Process technical decisions are the coordinator's; each is written here ... Bob's own rulings are not recorded here: they live in the line they refine (REQ-7)." It nonetheless holds records headed "(Bob, <date>)". Every quotation below is therefore **a session's record of him**. Where the record puts words inside quotation marks under "in Bob's words", I mark it "recorded as a verbatim quote"; I could not compare any of them with what he typed.

| Line | Text | What it is |
| --- | --- | --- |
| :90 | "BD-R1: Walks end rounds; rounds repeat over the plan's layers until the release walk is clean (Bob, 8 Nov)" | Session's heading |
| :92 | "I think that it's incorrect to designate the fixes of an internal walk as an additional layer. Rather, the errors found in a walk, whether internal or external, should be related to changes to modules. Once a walk completes, that ends the current round, and a new round (of the same tranche) is started to work (layer by layer) to fix to those modules that have been identified as having flaws. This successive set of rounds continues until an internal walk doesn't find flaws, the release deployment happens, and the walk of the release also doesn't identify flaws. When the release walk is clean, the installer is updated for that release, then the civicsmith.dev website is updated to refer to the new install, and that ends the tranche." | Recorded as a verbatim quote ("Decision, in Bob's words (8 Nov)") |
| :93 | "The process prepares the installer and website updates and runs them only through the protected GitHub environment that names Bob as required reviewer; his standing approvals are unchanged ('Process, on my approval')." | Session's sentence; only "Finish, then switch" and "Process, on my approval" are recorded as his words |
| :94 | "A clean internal walk leads to the release deployment and its walk. A clean release walk leads to the installer update, then the civicsmith.dev update, each on Bob's approval, and the tranche closes." | Session's "Consequences" |
| :107 | "The product has no workflow for either yet; the coordinator proposed building both as round-2 work." | Session's "Context" |
| :108 | "build the installer only when the internal walk completes without the need for another round, and build the site update only once the external walks complete without the need for another round." | Recorded as a verbatim quote ("in Bob's words (8 Nov)") |
| :109 | "The scoped deploy token is Bob's to add to that environment, needed first when the installer-update workflow is built." | Session's "Consequences" |
| :113 | "There are no earlier versions of the plane that exist. So migrate-released need only look at perhaps the last 2 or 3 versions just to make sure that the migration process actually works." | Recorded as a verbatim quote ("in Bob's words (8 Nov)"). It is about the upgrade test |
| :114 | "No installed site holds an older store, so no upgrade path from older releases is promised." | Session's "Consequences" |
| :117 | "The live walk will take a long time and will end up being an expensive means of identifying many of the same the flaws the internal walk found. Stop the live walk now, update the process so that the live walk only runs once a round closes with no flaws found from the internal walk. And try to configure both walks to run as many walks as is reasonable to speed up the walking process. (But be careful that there aren't too many external walkers to cause the Cloudflare system to exceed limits of the account." | Recorded as a verbatim quote inside a coordinator's record (PD-16, "Bob, 8 Nov:") |
| :118 | "A round whose internal walk is clean (known gaps deferred on Bob's word count as passing) owes the release deployment and its live walk, and nothing else owes a live walk." | Coordinator's decision |
| :121 | "BD-R5: The first release walks run without an AI account; AI-assisted journeys are walked only after the non-AI journeys are clean (Bob, 9 Nov)" | Session's heading |
| :123 | "The first run or two of the external system will run without without an AI account connected. Once the external walks identify and fixed all the flaws to be found by walking all the non-AI journeys, we'll configure an AI so that the AI-assisted journeys can be run and debugged." | Recorded as a verbatim quote ("in Bob's words (9 Nov)") |
| :124 | "a release deployment is walked first with no AI account; the walk runs the non-AI journeys and reports each AI-assisted journey as not walked (AI not configured), never as passed or failed. ... When a release walk of the non-AI journeys is clean, Bob configures an AI account, and the AI-assisted journeys are walked and fixed the same way." | Session's "Consequences" |
| :125 | "Yes, the installer update and site update wait until a release walk with AI on is also clean." | Recorded as a verbatim quote ("Bob, the same day, on the tranche-end acts:"). The question he answered "Yes" to is not recorded |
| :125 | "A clean release walk of the non-AI journeys alone never makes BD-R3's installer-update or site-update builds due." | Session's sentence |
| :59-62 | "PD-10: A known, owed walk finding does not block a development release (coordinator, 8 Nov)" ... "This covers development pre-releases only; a public release stays Bob's, through the protected environment." | Coordinator's decision, not his |

Also a session's record of him, in the fifth draft's section B ("These reached this document through a session's written record", `process4_definition_v5.md:77`):
- :86 (13 Nov, line 6): "No other test is necessary, ever. The internal walk replaces the full regression. A round that completes with no failures ends the tranche. An optional multi-session deploy-and-external-walk runs after that." (Corrected by his typed words of 14 Nov.)
- :98 (13 Nov, line 18): "you approve a public release. Updating the public release means updating the installer and the page of the website that refers to the current release and installer."

And in Process3's own files (sessions' records of him; V by `git show origin/tranche:README.md` in the process repository): README :147 "Everything this releases is for development only (Bob's word, 3 Nov): no public release, no production environment, no promotion to installed sites."; README :81 "A release belongs to a round close, never between layers (Bob, 5 Nov ...)".

### 2c. His standing approvals

**`/home/user/process3/CLAUDE.md:3`** (the process repository, branch `process4`; committed by Bob Krause through GitHub's website, last on 2 Nov 2026: `git log -- CLAUDE.md`, V). This is his word under the worker rules:

- "Standing approvals from Bob, 1 Nov 2026, widened for development releases and for every step of the development process on 2 Nov 2026."
- Sessions may "merge the tranche's pull request into main once its required checks pass; run builds and tests; run the repository's own workflows; cut development releases, with their tags and pre-releases in the product's repository; and deploy and use development releases in every way development needs, in the product's own Cloudflare account, the one its process config names: deploy, configure, seed, reset and remove development deployments and their data, and run walkers and other tests against them. Development deployments hold no secrets and keep no permanent record."
- "They may never: force-push, delete a branch, change permission or repository settings, push to main except through the tranche's pull request, publish a public release or promote a release to installed sites without my approval, or act on any other account or service."

**The product repository's approvals differ by branch (V).**

- `main` (`CLAUDE.md:3` in the clone; his commit `0dea5a6e`, 1 Nov): the first, short approvals. It does not mention releases, deployment or Cloudflare at all.
- `tranche` (`git show e7ec72e:CLAUDE.md`; the block was last committed by Bob Krause through GitHub's website on 9 Nov, commit `50515e452`; `git log e7ec72e -- CLAUDE.md` shows ten website commits of his from 1 to 9 Nov and five commits by sessions in between, which by their titles change the Process3 lines below the block; titles read, not diffs). It is text he committed; the audits say sessions drafted most of its edits (A, `audit2_notes.md:72`). Release passages:
  - :5 sessions may "cut, sign and publish development releases, as GitHub pre-releases with their tags, marked development, and install and upgrade them on development deployments".
  - :9 "Any Worker named biosmoke followed by a number is a development deployment, for testing releases only, together with the Workers it binds ... sessions may install and upgrade a release in it, walk it, and delete it and all data captured or generated in testing once testing is complete."
  - :9 "Sessions may not change or delete anything else in that account, including the worker civicsmith-site and its website at civicsmith.org and www.civicsmith.org, the installer worker newgroup, DNS zones and records ..."
  - :13 "They may never: ... publish a public release (one not marked as a development pre-release) or install any release on a site other than a development deployment without my approval, given through the protected GitHub environment that names me as required reviewer; sign anything with my own offline keys, which they never hold".

So text he committed on 9 Nov already lets sessions install a release on a test site, upgrade it there and walk it, and already forbids them to touch the real installer and the real website. The requirements audit's quotation at `audit2_requirements.md:143` is from this tranche text, not from the process repository's file.

### 2d. His Ledger lines and Foundations lines on release, and where each stands

**What these documents are.** `ledger_lines.md` is an extraction of his Keep and Drop Ledger: the statements, suggestions and reasons were drafted by a session; the decisions (kept, modified, dropped) are his; a note is his only where marked "(owner's own words)" (`ledger_lines.md:1-5`). `foundations.md` is the Process3 Foundations, a document written up by sessions from his Ledger decisions (the later version in the process repository was committed by "Claude": `git log origin/tranche -- governing/foundations.md`, V). Neither is typed words. Status below is from `process4/definition/process4_definition_appendix_v5.md` (A: I read the rows, I did not re-audit them). Where a quoted Foundations passage is a table row, its column breaks are shown as " / ".

| Line | Text (file:line) | His decision | Stands in the fifth draft (appendix row) |
| --- | --- | --- | --- |
| ARC-4 | Note, "(owner's own words)": "The architecture, ownership, format and coverage checks run only against the job's module in its gate, layer checks when a layer closes, and over the whole product before a release or when I ask for one." (`ledger_lines.md:377`) | modified, 31 Oct | Ended (:147). "His own option 'when I ask for one' is ended under 'your decisions' by inference from line 6; no word of his ends it by name" |
| GAT-7 | "The full product regression runs only at a release or on your word, as its own workflow with its own time budget." (`ledger_lines.md:781`) | kept, 31 Oct | Ended, record of 13-14 Nov line 6 (:236) |
| P11 | "Tests follow the architecture: each module has its own tests, each layer may have small layer tests run at its completion, and the full regression runs only at release or on Bob's word." (`ledger_lines.md:1520`) | kept, 3 Nov | Ended, record line 6 (:337) |
| P22 | "Release: a release is cut from the open tranche, proven by the full regression, deployed and walked; what a walk finds becomes a round's entries, never edits to a running one; what a walk produces is kept only until it is analysed." (`ledger_lines.md:1592`) | kept, 3 Nov | Kept; way changed (:345). "'A release is cut from the open tranche' is listed under (g)", that is, in conflict with his typed words |
| GAP-7 | "A public release or promotion to installed sites waits for Bob's approval through the protected GitHub environment; development releases are drafts and need none." Source given: "Your word, 2 Nov (question 21); your approvals." (`ledger_lines.md:1659-1660`) | kept, 3 Nov | Kept as written (:353). "The protected GitHub environment and promotion to installed sites are not named" |
