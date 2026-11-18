# [file] problem-classes.md (continued)

| C3 | Session told to run a command its own permission check refuses | job 697 `p3 github push` (6 Nov); then sticky "Auto-Mode Bypass" | instructions named a command not admitted by the session's settings/classifier | jobs push only through tool commands (R17c E); TODO: a check that every command a START/rulebook names is allowed by the repo's settings | partial |
| C4 | GitHub traffic outside the governor | coordinator's raw notes pushes; pre-R17b pushes; connector calls | rules without enforcement | PreToolUse hook + denies (R17c, PR 208); Bob applies settings; audit hourly | settings pending |
| C5 | State write lost to a race (refs/p3/unpushed) | pin 6, pin 7, job 697-2, BOB github push (6-7 Nov) | concurrent writers on process-state; losing writer parks instead of re-applying | builder ef7TXuV: losing writer re-applies; replay re-applies on current tip | fixed (214, 221); follow-up: append-only github/use rows on replay (builder ef7TXuV) |
| C6 | Work stranded by an account's suspension (hidden PRs) | all civicsmith PRs (6 Nov) | every PR and identity tied to one GitHub account | R16 account-switch readiness; reopen route documented | queued (R16) |
| C7 | Over-broad stop rule halting work on a transient error | 502 stop (6 Nov 23:50) | rule written for safety without cost check | stop only on limit/abuse/repeated 5xx; caution test: what does it protect, what does it cost | fixed (rule) |
| C8 | Shallow clone hides history a command needs | layer sync merge parents (6 Nov); layer status/jobs 9 in a depth-1 copy clone read 8 modules "rescheduled" (true: 13/13 complete), 7 Nov 01:55Z | commands assumed full history in 50-deep cloud clones | read parents from the merge object (R17d); builder ef7TXuV: an ancestry check that cannot answer deepens or fails closed, never reads "no" | partial |
| C9 | Bookkeeping as dominant GitHub traffic | 86 share commits / 25 share-only pushes in an hour (7 Nov 00:50) | each session shared its usage by its own push | shares ride the command's own push; alone ≤ every 15 min (R17e, PR 211) | fix in review |
| C10 | Clone identity collision | copy clones read 8 pushes/h vs true 124 (7 Nov 00:50) | cloneId = hostname + path; every container is `vm` with the same path | random per-clone id; pushes counted from ledger-branch history (R17e, PR 211) | fix in review |
| C11 | Test-only provider change without layer clear | builder ef7TXuV item (6 Nov) | a test-only change to a provider module still demands the layer's full re-run | test-only change + `layer clear` (builder queue) | queued |
| C12 | Fetch volume far above content traffic | 429 fetches vs 37 content in an hour (7 Nov) | the ledger was fetched fresh before every call and push | one ledger read per clone per 30 s; ls-remote before fetch (R17e, PR 211) | fix in review |
| C13 | Tool reads of a landed PR GitHub hides | copy layer PR 735 gate: pulls/696 404 (7 Nov) | a landed PR's facts held only by the PR API | land row + gate-run artifact as the record (PR 212); other landed-PR readers follow | fix in review |
| C14 | Test reads the wall clock twice | rerun-more.test.mjs:339 on PR 211 (7 Nov) | a test compared two runs whose output embeds now() | injectable clock in tranche open (52a7563); TODO: lint for tests comparing outputs that embed now() | partial |
| C15 | Unattended session stuck on a permission prompt nobody can answer | investigation lane session_018BhcecAwJP5DnnQjPq4JTZ: "Waiting on permission: Artifact" since ~00:31Z 7 Nov | lanes are told to keep design documents as claude.ai artifacts, but the Artifact tool asks a human in auto mode; no session watches for REQUIRES_ACTION | (1) Bob adds the Artifact tool to the copy's settings allow list (within his approvals: Process3 pages on claude.ai); (2) ROOT's sweep flags any process session in REQUIRES_ACTION and restarts it; (3) C3's admit check extends to told tools, not only Bash | open |
| C16 | Module in modules.json with no ledger entry, silently treated as not done | copy: 49 legacy modules, 7 Nov 04:20Z; `layer jobs 10` listed every layer-11 module "not early" | legacy COMPLETE modules never got process/ledger entries; nothing compares modules.json with the ledger | BOB census PR records them (marks → OPEN); builder ef1pxNY: census + setup check flag both directions, `layer jobs` names the act | in work |
| C17 | One settings policy judged by two rule sets that disagree | copy PR 755 (Bob's R17c settings) → every `job start` refused by setup check (deny-list, shim-drift), 7 Nov 04:45Z | admit (C3/C15) moved to the R17c lists; setup's deny-list and shim rules were never moved | builder ef7TXuV: setup reads the same policy as admit; test that the R17c files pass setup check | in work |
| C18 | Read commands make pushes and heavy API walks | account at 121/120 pushes, 04:50Z; BOB clone 39 pushes, 512 gh calls | status / layer jobs / land write idle-check and starts-owed rows (each a push) and walk every module's PRs | builder ef1pxNY: reads ride the next real write; per-module walks cached across processes | queued |


# [file] train-robust-options.md

# Merge train robustness: options (build/train-robust, 5 Nov)

Three defects on the copy (neobobkrause/civicsmith-copy) on 5 Nov. Read from tool/lib/train.mjs,
merge.mjs (mergePlain), state.mjs (fetchState, writeState, send, outcome), util.mjs (pushRetry),
p3.mjs (main's "starts owed" write), and the copy's process-state history (metrics/train.jsonl,
merger/plain.jsonl, messages/merger.jsonl, the commit log 12:10-12:40).

## What the copy's state branch shows

- 12:18:24 the train takes PR 499 (queue row 9851d2b5, an older row of the same caller's pin move;
  the caller was waiting on row 70643fc9). mergePlain lands it on GitHub (4f18d846) about 12:20.
- 12:21:13 `message from pin to bob`: a `p3 send` run in the train's clone. 12:21:23 the train's
  lease is released: the train stopped. There is no `merged` row for that land.
- 12:21:30 the caller sees no live lease, withdraws 70643fc9 ("the train stopped"), reads the pull
  request, finds it merged and prints `merged pull request 499 at ... (by the train)`: that path
  prints no wake. Exit 0; then p3.mjs main writes `starts owed: merge 499` (12:21:42), and that
  write's push is what printed "process-state moved on origin; fetching and trying again (2 of 5),
  (3 of 5)". The retries are noise after the fact, not the cause.
- 12:22:52 a restarted train takes 9851d2b5 again, finds 499 merged and writes
  `result: merged, elsewhere: true` with no `what` and no `wake`.
- 12:34:50 the train takes PR 502. 12:36:26-12:36:50 the merger runs `send` / `send delivered` in
  the same clone (merger-35, merger-36). mergePlain's beforeLand (leaseHeld -> fetchState fresh)
  fails `cannot lock ref 'refs/remotes/origin/process-state': is at ae959b78 but expected
  645e94ca`. That message matches nothing in PLAIN_AGAIN, so the row is `refused`, sent to BOB,
  and the caller's merge exits 1.

## 1. Lock clash: a transient ref-lock failure refuses a plain row

Cause. Every state-branch read and write fetches `+refs/heads/process-state:refs/remotes/origin/
process-state` into the clone (fetchState; pushRetry's fetch, which runs in a worktree of the same
clone and so updates the same ref). Two git processes updating one ref at once: the loser fails
with "cannot lock ref ... is at X but expected Y" (or "unable to update local ref"). fetchState
turns any such failure into a Fail (`cannot read origin's process-state`). In plainOne that Fail is
not in PLAIN_AGAIN, so a transient clash is a refusal: the queue row ends, BOB is told, the caller
exits 1. In mergeOne `lasting()` decides; and any Fail from writeState *after* a land (the train's
row write) is outside the try, so it propagates and stops the train (this lost 499's row, item 2).

Option 1A: retry the clash where it happens. fetchState, and pushRetry's fetch, retry a ref-lock
failure (`cannot lock ref|unable to update local ref|but expected`) up to 4 times with a jittered
wait (0.5, 1, 2, 4 s) before failing. The train classes a remaining one as transient: the plain
row gets a `retry` row (tried again in 1 min, the caller keeps waiting), a job gets its backoff.
- Cost: about 25 lines, 40 of tests (a fake git that fails the first fetch with the lock text).
- Covers any concurrent git in the clone, including a hand-run `git fetch` or `git pull` (their
  default refspec updates the same remote ref), which no lock of the tool's can cover.
- Fails when: contention lasts past ~8 s of tries (not seen: a fetch takes 1-3 s); then the train
  still retries the row a minute later rather than refusing it.

Option 1B: a per-clone lock around the tool's state-branch ref updates (see 3A), no retry.
- Cost: about 50 lines, 50 of tests.
- Fails when: anything outside the tool touches the ref (a session's `git fetch`/`git pull` in the
  train's clone), or a lock holder hangs; the clash then refuses the row exactly as today.

Recommendation: 1A. It is the smaller change and the only one that covers git outside the tool;
3A then removes the tool's own collisions so the retries are rarely needed.

## 2. Missing wake: a pin land whose train row was lost wakes no one

Cause. The wake for a pin move is computed only inside mergePlain (pin at the head vs at the merge
base) and travels to the caller only in the train's `merged` row (`what`). Three paths land or find
the pull request merged without that row, and each prints no wake and records none:
(a) the caller's fallback after a withdrawal: `getPR(...).merged` -> "merged ... (by the train)";
(b) plainOne's `elsewhere` branch, which a restarted train writes when it finds the PR merged
(the 12:22:52 row);
(c) the train stopping after the land but before its row is written (any Fail from writeState or
send after mergePlain returns propagates out of plainOne/mergeOne and the train ends; 499's row was
lost this way).
The retries the caller printed are main's `starts owed` write, after the merge; they did not cause
the miss.

Option 2A: derive the wake from git wherever a merge is seen without it. One function,
`pinWakeOf(root, cfg, mergeSha, as)`: fetch the tranche, compare the pin at the merge commit with
the pin at its first parent; when it moved into the tranche and `as` is not bob, return `what` and
the wake. The caller's fallback (a) and plainOne's `elsewhere` row (b) use it, so the caller prints
the wake line and the train's row records `what` and `wake`. If the merge commit cannot be read,
the caller prints the wake anyway, marked "pin not read" (an extra wake costs BOB one status; a
missing one stalls the tranche).
- Cost: about 35 lines, 50 of tests (the fallback path and the elsewhere row, each with a pin move
  and without one).
- Fails when: the land was not a merge commit (the tool merges with merge_method merge only, and
  the ruleset allows only that, so the first parent is the tranche before the land); a pull
  request merged by hand another way would be judged against its first parent, still the tranche.

Option 2B: the train never loses a record after a land. After mergePlain/merge returns, the row
write and BOB's message are each tried with the 1A retry and, if still not written, kept in
ctx.pending and written at the top of the next pass; a record failure after a land never stops the
train. The caller then always gets the `merged` row with `what`.
- Cost: about 40 lines, 50 of tests.
- Fails when: the train is killed or its session ends between land and row (the row never comes);
  the caller still needs 2A for that, and for rows an older train already wrote without `what`.

Recommendation: both, 2A first. 2A is the caller's guarantee whatever the train did; 2B's small
part (a failed post-land record retried at the next pass and never stopping the train) keeps the
measures row and the merger's "merged PR" message, which 2A cannot. No local journal file: a row
lost to a killed train is covered by 2A's wake and the next train's `elsewhere` row.

## 3. send in the train's clone races the train

Cause. `send`, `send delivered|failed` (and `handoff`, `merge train beat`, any writer) each run
writeState in whatever clone they are run in. The MERGER's session runs the train in the background
in its clone and runs `p3 send` there between passes, so two processes fetch and push the state
branch through the same `refs/remotes/origin/process-state` at once (item 1's clash). Nothing in
the tool serialises processes sharing a clone; pushRetry only handles another *writer on origin*.

Option 3A: a per-clone state lock. Every state-branch fetch and write in the tool (fetchState and
writeState with its push) takes an exclusive lock file in the clone's common git dir
(`<git-common-dir>/p3-state.lock`, created O_EXCL, holding pid, host and time), held only for that
one fetch or write (seconds), never across a train pass or a gate wait. Another process waits for
it (jittered, up to 90 s, then fails as today with the holder named). A lock whose pid is gone on
this host, or older than 5 min, is broken and taken. The train, send and every other writer share
it, so they take turns instead of colliding.
- Cost: about 50 lines, 60 of tests (two processes in one clone; a stale lock from a dead pid).
- Fails when: a holder hangs inside a git call for minutes (waiters fail after 90 s, as a clash
  would today); git outside the tool (covered by 1A's retry).

Option 3B: send refuses in a clone whose train runs. send and send delivered|failed read the lease;
when its proc is a live process on this host, they refuse: "the merge train runs in this clone; run
send from another clone of the product".
- Cost: about 20 lines, 30 of tests.
- Fails when: the train is not the only other writer (handoff, beat, another send); and the MERGER,
  whose every exception goes to BOB through send, needs a second full clone (a worktree shares the
  refs, so it does not help). It moves the race onto the operator.

Recommendation: 3A. With 1A as its backstop, a send in the train's clone simply waits seconds for
the train's fetch to finish; nothing is refused and the MERGER's workflow does not change.

## Summary of the recommendation

1A (retry ref-lock clashes; the train treats them as transient) + 2A (wake derived from git on
every merged-without-row path, recorded in the elsewhere row) + 2B's small part (post-land record
failure retried next pass, never stopping the train) + 3A (per-clone state lock). About 150 lines
and 200 of tests, in state.mjs, util.mjs, train.mjs and merge.mjs (pinWakeOf beside mergePlain's
own pin check, which then uses it).

## Ruling (coordinator, 5 Nov 12:42) and items 4 and 5

Ruled: 1A + 2A + 2B's small part + 3A, as recommended. Conditions: the lock is never held across a
gate wait or a network call other than the state fetch or push itself; a stale lock from a dead
pid is broken, a live one waited on up to 90 s then reported, never skipped; the wake printed and
recorded once, deduplicated by merge commit (`merger/wakes.jsonl`: one `wake` row, the record, and
one `printed` row per merge commit; the train records, its caller prints, the train's own log
carries no wake line, so the MERGER no longer sends one too, as it did for 499 at 12:21:13).

4. In-train jobs in the idle alarm. The copy's alarm (merger-35, 12:36) came from the idle check
that runs before commands, which reads status offline: a reopened module (its entry COMPLETE on
the tranche, commits on its branch) reads as "its attempt is open" with no pull request known,
and each took an empty slot's reason. The idle check now reads GitHub's open pull requests once
and, for those modules only, each head's gate (sweep.mjs markInTrain): one ready with a green gate
is named "in the train (PR n)", apart from the empty slots' reasons
(`in the train, not startable: <id> PR <n>, ...`). GitHub unread leaves the lines as before.

5. Cap and alarm count working sessions. With a listing (`--sessions`, the sweep's), a job's
latest session that is idle, unarchived, with its pull request ready and its gate green
(status.mjs parkedSessions) is not counted against the cap: status, job start --ready and the sweep
subtract them and print `<k> job sessions parked in the train ... not counted against the cap:
<id> PR <n>`; the sweep and ready rows record the working count as `live` and `parked`, so the
idle check between sweeps judges on working sessions too. With `--live <n>` alone, n is taken as
given (no listing says which sessions are parked). The sweep's "over the job cap" owed line still
counts every job session.

6. The release path's cost (coordinator, 5 Nov: 13.8 s of a warm pass on the copy). The train
recomputed the release set whenever the tranche moved or the open job set changed. It is now
cached (train.mjs releaseSet) by the inputs releaseModules reads: the tranche's tree, the
closed-layer rows on the state branch, origin's main, the config, the tool's commit, and the open
jobs on COMPLETE or BLOCKED entries (an open job on any other entry changes no input: layerState
counts it open already). In memory and in the clone (`.git/p3-train-release.json`), so an
unchanged tranche costs three ref reads and a restarted train at the same tip reads no file.
The test compares cached and uncached sets for every open set of the fixture.

7. Modules with no ledger entry after the open layer (coordinator, 5 Nov: 14 on the copy, skipped
silently). nextWork names each module of a layer after the open one whose requirement file has
unmet marks and that has no ledger entry, `- <id> (layer <n>): no ledger entry: cannot start;
<k> unmet marks`, and returns them apart (noEntry), never as work; the idle-capacity line adds
`no ledger entry, cannot start: <id> (<k> unmet), ...`.

## Review rounds

Round 1 (cold): five findings, all fixed, each with a test: the stale-lock break could restore a
released lock (now broken under a `.break` file; a lock naming this process that it does not hold
is stale); a state failure at the top of a pass stopped the train (now the next pass); the sweep
never marked in-train modules (markInTrain there too); the sweep's over-cap line counted parked
sessions (overCapOwed); a late row could be written twice (deduplicated).

Round 2 (confirming): (a) to (e) confirmed fixed (the lock race run with 6 processes, 180 counted
updates, none lost); release cache key complete; no deadlock in the re-entrant path. Two low
findings: markInTrain ignored a flagged row (fixed, tested); a lock left by another host is never
broken (kept: the ruling has an unknown holder waited on and reported, and the report names the
file to remove).

## 8. A transient GitHub error under an in-flight gate (copy PR 290, 5 Nov 12:48-13:15): options

Cause, as read in tool/lib. merge() (merge.mjs) pushes the merged result to the job branch and
waits on its gate in waitForGate, which reads the pull request (`pr()`, io.getPR) and the gate
(`read`, io.checkRun) each round. Neither read is guarded: one GitHub 503 (or a timeout, or a rate
limit) is a Fail out of merge(). mergeOne (train.mjs) classes it with `lasting()`: not lasting, so
a `retry` row and ctx.backoff for `<pr>@<head as listed>`; the merge is over. At the next pass
ready() lists 290 at its new head (the merged result), whose gate is still running, so it is not
green and is skipped; and loop() takes queued plain rows before any job (`plain.length ?
plainOne : mergeOne`), so 505 and 506 landed, the tranche moved, and 290's merged result went
stale (its green gate would now gate a stale result: merge() would bring the tranche in again and
gate afresh). waitForChecks (mergePlain's wait) has the same unguarded reads.

What else can move the tranche under an in-flight gate. Within the train: only plain rows and the
next job, and the loop is serial, so only after merge() returned or threw. Outside it: `merge
--plain` with no live lease (the train killed or stopped mid-gate: its lease lapses or is
released), BOB's `merge <pr>` of a job by hand, and anything on GitHub itself (its UI). A train
restart mid-gate has the same hole as the 503: the new train does not know a gate was in flight.

Option 8A: transient reads inside the waits are retried. waitForGate and waitForChecks catch a
Fail from their pull-request or check read that is transient (HTTP 5xx, 429 / rate limit,
timeout, connection reset, the proxy's gateway errors: one TRANSIENT pattern beside util.mjs
SERVER_ERROR) and read again with a growing wait (15 s, 30 s, 60 s, then every 2 min), counted
against the same deadline; only the deadline, a lasting error or the gate's own end ends the wait.
- Cost: about 25 lines, 40 of tests (a fake read that throws 503 twice mid-gate: the same gate
  lands, nothing else does).
- Fails when: GitHub is down past the gate's whole wait (the merge fails as today, and 8B holds
  the tranche); a non-transient error during the wait (a real refusal) still ends it.

Option 8B: an in-flight hold that outlives the merge call. When merge() has pushed a merged result
(or found one), the train records `inflight` {pr, tip, at} on the state branch (TRAIN_FILE, one
row) before it waits, and an end row when the gate ends (landed, red, PR closed or its head moved
by anything else, or the gate past its cap). While an inflight row is open, each pass goes back
into merge() for that PR first, which waits on the running gate at that tip (merge() already does
this for a head holding its own merge row: jobChecks' rowTip wait), before any plain row or other
job; plain rows wait (their callers keep renewing; their take_by counts from the take, so nothing
expires for the wait). A restarted train reads the open row and does the same.
- Cost: about 60 lines, 70 of tests (a 503 that still escapes, and a train restart mid-gate: in
  both, 505 waits and 290 lands on the same merged result).
- Fails when: the train is stopped for good mid-gate (nothing lands, as wanted; the row ends when
  the next train finds the gate ended); a merge from outside the train (no-lease `merge --plain`,
  BOB by hand, GitHub's UI) is not held by a train row. A small addition closes the first two:
  mergePlain and merge() into the tranche refuse while another PR's inflight row is open and its
  gate still running (about 10 lines; the refusal names the PR and the gate run).

Recommendation: 8A + 8B, with the small addition. 8A removes the cause seen (the 503 never ends the
wait); 8B makes "nothing lands under an in-flight gate" hold across any other failure and a
restart, which 8A alone cannot; the addition covers the tool's own merges outside the train.
GitHub's UI stays outside the tool, and merge()'s land check ("moved past the merged result the
gate checked") still catches it as today.

## 8. Ruling (coordinator, 5 Nov 13:27) and what was built (build/train-inflight)

Ruled: 8A + 8B + the addition, in a PR of its own after PR 156. Conditions, and how each is met:
- A hold never blocks past the gate's own cap: each `inflight` row carries `until` = now + max(90,
  suite_timeout_minutes) + 15 min (the queue allowance); a pass that finds an unended row past its
  until ends it ("its gate's cap passed"), whichever train wrote it; refuseUnderHold reads only
  holds within their until.
- The end row names its cause: landed; refused: <why> (a red gate among them); merged (elsewhere);
  pull request closed; head moved to <sha>; tranche moved; its gate's cap passed; or the merge's
  own failure when it leaves nothing to wait on (HOLD_ENDS).
- Re-entry never re-pushes: the train calls merge() with noPush; a head that already holds this
  PR's merge row on the current tip waits on its gate (jobChecks' rowTip wait), and anything that
  would push a new merged result fails instead ("would need a new one"), which ends the hold.
- A restarted train that finds an open hold on a tip the tranche has moved past ends it ("tranche
  moved") and does not wait.
Code: tool/lib/inflight.mjs (rows, open, start, end, refuseUnderHold), merge.mjs (TRANSIENT,
guarded reads in waitForGate and waitForChecks, onGate, noPush, refusals in merge and mergePlain
outside the train), train.mjs (hold, unhold, heldPass, the loop's hold-first pass).

Item 8 review round 1 (cold): fixed, each tested: a held gate ending red kept the hold to its cap
(now ended "gate <conclusion>"); a held PR made a draft or retargeted kept it (now ended
"withdrawn: made a draft" / "retargeted to <base>"); a restarted clone lacking the held tip ended
the hold as "tranche moved" and landed the next job (the tip is now fetched, and an unreadable tip
keeps the hold); the outside refusal let a merge through once the held gate was green but not yet
landed (now only a red or cancelled gate frees it); TRANSIENT gained "context deadline exceeded"
and "connection refused". Kept: the hold's until (105 min with the 90-minute cap) can end before a
late-starting gate's run does; that only frees merges outside the train (the train stays serial),
and the ruling bounds a hold by the gate's cap. Kept: the first return to a held PR is not backed
off (the loop's idle pause stands between passes; backing it off only delays the held gate).

Item 8 review round 2 (confirming): (a) to (e) confirmed fixed; both kept items judged acceptable.
Two low findings, fixed: a held PR that landed outside the train (no end row) kept merges outside
it refused until until (refuseUnderHold now reads the held PR: merged, closed or off its tip holds
nothing; tested); a held PR handed to BOB after its retries kept the hold (now ended "handed to BOB
after 5 tries: ...").


# [file] process4_five_points.md

# Process4: the five things that most stand in the way, in detail

14 Nov 2026. For Bob, from Claude. Nothing here is your decision, and nothing here is proven to work.

You asked: "Let's begin the next session by going into greater detail on each of the points you make in the 'What most stands in the way' section of your last response."

How this was made. Five AI workers each took one point. Each re-read the three audit reports and then checked the facts against the repositories and Process3's stored records. Where a sentence below says "checked today", a worker checked it today, unless I say I checked it myself. Where the earlier session told you something that turned out wrong, I say so.

Words used throughout. A **session** is one running Claude conversation. A **branch** is one line of work in a repository; the **main branch** is the finished line, the **tranche branch** is the line a tranche is built on. **ARCH** is the long-running session that directs the building of one product. **ROOT** is the first session you start. **Your approvals** are the paragraphs in your name, in a repository, that say what sessions may do without asking.

---

## 1. The end of a tranche

Your words: "a tranche only ends when an external walk (of a development deployment) completes without flaws." "An internal walk uses the UX Screens document to confirm that the workflow matches the definition. The external walk follows the UX journeys to confirm that all journeys can be completed successfully to produce proper results." "screens and journeys are kept in docs/development/ux-substrate/ in the product repo".

**What is in that folder (checked today; I checked the second item myself).**

- The folder is different on the two branches. On the main branch, which has not moved since 1 November, it holds 133 files, with a Journeys page and a Screens page among them.
- On the tranche branch, where Process3 did its building, a design session removed 49 files on 6 November, the Journeys page among them. The folder's own note now says: "This folder holds only what the product's build and checks read (Bob, 5 Nov 2026). The design documents are claude.ai artifacts". It lists Journeys and Screens as links to claude.ai pages.
- So the earlier session's statement to you, that the documents are not in the folder, is only partly right. The Journeys page is gone from the tranche branch. The Screens page is still there as an old copy of 28 October, together with everything needed to rebuild it, current to 8 November. The claude.ai Screens page says it was built from that folder.
- There are three lists of journeys, and they do not agree: the claude.ai Journeys page (27 journeys, dated 6 October, the oldest); the Journeys page on the main branch (27, marked on 13 October as folded into the Screens page); and a script in the folder that the Screens page is built from (32 journeys). Nothing says which of these is "the UX journeys".
- A worker opened both claude.ai pages today from a session, to read only. The earlier session told you it was not known whether a session could.

**Who writes those documents (checked today).** Every one of the 892 changes to that folder between 2 October and 9 November was made by an AI session. None came from your own GitHub account. The earlier session told you "61 of 63" for November; it is 63 of 63. This is not sessions going outside your word: your approvals in the product's repository say design lanes "own their lane folders, the design stream (docs/development/ux-substrate) included" and "Within the product's principles they decide design and wording there." That is the lanes question, taken up in the lanes document.

**What the walks did in Process3 (checked today).** Five walk reports were stored: three internal, two external. None was clean. The two external walks visited each screen once as an administrator and once as a member. Neither followed a journey from start to finish. So the external walk as you define it has never run, and nobody knows how long it takes, what data it needs, or whether it can finish. All twelve recorded deployments failed, and the tranche never ended.

**Who decided whether a walk passed.** In Process3 the walking program's own pass or fail decided, and sessions wrote the rules for what could be excused: the last external walk carried 36 notes reading "the designed absence", written in by the architecture session. In the fifth draft, ARCH starts the walks, turns flaws into work, and merges the tranche when the walk is clean. No other session has a part. That one session decides "clean" is the auditors' reading of the draft, and I agree with it.

**What the draft leaves unset.** How large a tranche is. How many rounds it may take; the draft says "Nothing bounds the number of rounds." What happens to a tranche that never comes clean. The draft's sentence "Only your word ends a tranche that will not come clean" was Claude's, not yours, and it was not marked as Claude's. I am withdrawing it; the truth is that the case is undefined.

**Yours to decide.**

1. *What each walk is measured against, and which journey list counts.* The choices: the claude.ai pages; pages kept in the folder; or the folder's machine data. The pages on claude.ai cost nothing to keep, but their history is outside the repository and the Journeys page there is the oldest list. Pages in the folder mean restoring the Journeys page and allowing the built Screens page to be kept there, which your approvals now forbid ("never committed"). The machine data you cannot read, and it describes more than is built. **My recommendation:** pages in the folder, because your words of 14 November say that is where they are kept, and because the repository then records every change to what a walk is measured against. It needs one proposal from me to you about the "never committed" sentence. For the journey list I have no recommendation yet: I need to show you how the 27 and the 32 differ first, and I have not had that compared.
2. *What a tranche contains.* Either all open work, which means the first walk comes after about 177 jobs (an estimate) and carries every flaw Process3 left; or a smaller content you name for each tranche. **My recommendation:** a smaller content you name. It is the one lever here that is not a new check. Its cost is a decision from you at each tranche, and a clean walk of a part says less about the whole.
3. *What happens to a tranche that will not come clean.* Merged with its flaws, which sits against your sentence "So a release is always fully tested and walked successfully"; or dropped; or kept open. I have no recommendation I can support with evidence, because no tranche has ever been walked your way.
4. *Which journeys count toward "all journeys".* Three journeys begin at the website or the installer, which you put outside the tranche. Six have steps only the AI assistant can do (one of the six is also among the three), and one more is connecting a Claude account; you wrote "A tranche can end without an AI enabled run". That is nine journeys of the 32 touched. **My recommendation:** a tranche's external walk follows every journey, and what it leaves out is named beforehand: the three journeys that begin outside the tranche, the connecting of a Claude account, and the steps that need the assistant. Then leaving them out is neither counted as a flaw nor hidden as a note.
5. *Who runs the walks.* Your hint was "sessions". A line you kept in your ledger, and Process3 itself, had GitHub's machines run them, and that form is the only one that has ever run. Whether a session's browser can even reach the development site is unmeasured. **My recommendation:** keep your hint, and let me try one walk from a session in the trial repository before the definition depends on it. That needs your go-ahead, because it starts a session and a deployment on your accounts.

**One risk with no remedy inside your rules.** One session judges the walk clean and then merges. Every stop the auditors could think of is a check or a gate, which you have ruled out. It is a risk to accept knowingly, not one I can remove.

---

## 2. The rule that only PROCESS changes the process is held by words only

Your words: "Process changes only happen in a separate process lane call PROCESS that I interact with." And: "The transition from the process a product is being built using to the updated process will be done only with my prior approval".

**What stands behind that rule today (checked today, this time by reading GitHub's settings directly).**

- Your approvals in the process's repository still say sessions may "merge pull requests into working and tranche branches once their required checks pass, without a person's review, and merge the tranche's pull request into main once its required checks pass". They forbid changing settings. They do not forbid changing the process.
- GitHub's own rule on that repository asks for nobody's approval. A change merges once two automatic checks pass. The sessions' GitHub account can write there, and on 9 November it opened and merged the last change to the process with no person looking.
- A list of forbidden commands exists only on Process3's own branch, where it steers merges through Process3's tool without stopping them. The branch this Process4 work sits on has none. The earlier session told you there was no such list at all; that was imprecise.
- In Process3, sessions made 270 of the 296 changes to the process.

So today a session that decided to change the process could do it, with your approvals on its side.

**The history, which I owe you plainly.** On 13 November Claude proposed that the process change only when you yourself merge the change, and then withdrew it, because it made work wait for you. On 14 November the second draft proposed the same thing again without saying it was the same, called its cost "one click", and said silent growth became "impossible". Both statements were wrong, and that was withdrawn too. A narrower question followed, and your answer was the PROCESS paragraph. Since then nobody has asked you whether anything physical should stand behind it.

One correction to what you were told: the earlier session said your words of 14 November "accept the acts" such a setting would cost you. That was an auditor's judgement. Your paragraph says you explore, choose and approve. It does not say you merge.

**Yours to decide: whether anything physical stands behind your rule.** The four choices, with their real cost:

1. *Words only, as now.* Nothing for you to do. The risk stays exactly as it is.
2. *Your approvals are reworded* to say a process change is merged only on your word given at PROCESS. One edit, made by you, because sessions may not write your approvals. It is still only words, but today's words say the opposite of your rule, so this at least removes the contradiction.
3. *A GitHub rule so that only your account can update the branch of the process that products use.* You set it once; sessions cannot, and may not. After that, each time you approve a change at PROCESS, you also press merge on GitHub's website, and possibly do a second act to move a product onto it. Nothing merges while you are away. This is the centre of the proposal that was withdrawn twice, and I am saying so.
4. *The sessions' account loses the right to write to the process's repository at all.* The same acts as 3, and PROCESS could then no longer save its own proposals there.

**My recommendation:** 2 now, and 3. My reason for bringing 3 back is one thing that changed since it was withdrawn: it was withdrawn because it made work wait for you, and your own PROCESS paragraph now makes every process change wait for you anyway ("Because updates require my involvement and I might be away from my computer for extended periods"). What 3 adds on top of that waiting is the pressing of merge, each time. What I cannot tell you: that it works. It has never been tried on your repositories; it rests on GitHub's documentation. I would try it in the trial repository first, which needs you to set the rule there.

What none of the four stops: tests and walk steps growing inside the product itself, and what one session tells another to do. Whether pressing merge counts, for you, as one of the gates you have ruled out is yours to say.

---

## 3. The first hour

**What happened to ROOT on 5 November (checked today against Process3's log and the product's history).** A session runs on a cloud machine that is handed a copy of your repository when it starts. Your approvals are read from that copy, once, at the start. At 18:41 that day you started ROOT on the correct branch. The machine was handed a saved copy of that branch about an hour old: seven changes behind, and without the approvals you had committed sixteen minutes earlier. ROOT's first check noticed and ROOT stopped. Another session sent it one message, it fetched the newest copy, and it carried on. On 8 November the same thing happened with the same saved copy, by then three days old.

**The fifth draft got this wrong.** It said your ROOT "plainly came up on the main branch, which held old approvals, both times it was tried". Three things in that sentence are false: you did not start it plainly, you pasted the starting text the tool printed; it was not on the main branch; and you started ROOT three times, the first of which landed on the newest copy. The draft then asked you to make the tranche branch the one GitHub opens by default. That would not have helped, because ROOT was on the right branch and the setting does nothing about an old copy.

**What I have decided, and report.**

- I withdraw the request that you change the default branch.
- ROOT's first act is to fetch the newest copy of its branch and to stop if it cannot. That is what actually ran, twice. Not proven: why the cloud hands out an old copy, whether it still does, and whether approvals that arrive after a session has started count the same as approvals read at the start.
- How the process reaches a session. The draft never said. Your ledger does, in lines you marked "keep": the product names one fixed version of the process, and each session fetches a read-only copy of it. Process3 ran that way. I am putting those lines back; this was never an open design question.
- For three of the five steps the earlier session told you had "nobody named" (deploying, preparing a release, moving a product to a changed process), your Foundations name the session that directs the build. The draft dropped the name. I am restoring it, with the third now under your rule of 14 November: only with your prior approval, by the means PROCESS proposes. Archiving finished sessions I will assign and report.
- I owe you a written order for converting the three repositories (the product's, the trial one, the process's), saying who does each step.

**Yours, though I am not asking for an answer today.** Some conversion steps only you can do: new wording in your approvals, a changed list of forbidden commands, perhaps the GitHub rule from point 2. Your present approvals in the product forbid sessions to replace the required test run, so an edit of yours must come before anything else there. I will bring you the full list of your acts, in order, in one piece, before asking for any of them. One thing to know now: the trial repository refused the sessions' last two attempts to save work there, on 8 November, and why was never found.

The fifth step, how new work is written into a module, is a real question for you and I will bring it with its options separately.

---

## 4. The release reads two ways

**Your statements.** Typed on 14 November: "A release can (optionally) be started after a tranche completes. So a release is always fully tested and walked successfully." And: "A tranche can end without an AI enabled run", "installer and website are outside the tranche", "installer and site updates wait for a clean development release walk". And one sentence in Process3's decision record, written by a session and quoting you on 9 November: "Yes, the installer update and site update wait until a release walk with AI on is also clean."

**Two things that are easy to mix up.** A *development deployment* is the product put on a test site in your Cloudflare account straight from the branch it is being built on. A *development release*, in your approvals, is a packaged, numbered test version that sessions may cut and then install.

**The two readings.**

- First: "a clean development release walk" is the walk that already ended the tranche. Nothing further is walked. The fifth draft took this reading.
- Second: after the tranche ends, a development release is cut, installed on a test site and walked, and only then are the installer and the website updated.

**What goes unwalked under the first reading.** The real installer placing the product into a Cloudflare account. An existing team's site being upgraded with its stored data in it. The assistant working with a real AI model. A real team could be the first to meet each of these.

**What exists (checked today).** Process3 cut no release of any kind. It built the step that cuts a development release; that step never ran on the product. Nothing can yet install a cut release on a test site, and Process3's own tool says why: the installer needs a person to sign in. The steps that update the installer and the website were never built. So "none of it is built" was a little too broad: one step was built and never used. Your approvals on the product's tranche branch already allow sessions to "install and upgrade" a release on a test site and walk it.

A correction: the audit said the draft never showed you your 9 November sentence. It did, before you answered, and said that under its reading "nothing walks what the installer places". The earlier session removed that passage when it recorded your answer.

**Yours to decide.**

1. Which reading you meant. **My recommendation:** the second. Under the first, three things reach a real team unwalked. The cost of the second is that all of it has to be built, and the installer's need for a person to sign in may mean an act from you at each release; that is not yet known.
2. Whether "with AI on" still holds before the installer and website are updated. It costs you connecting an AI account. **My recommendation:** yes, at a release only, since you have said a tranche can end without it.
3. Whether an upgrade of an existing site is walked before a release, or left to one module's own tests. **My recommendation:** walked, as part of the same release walk.
4. Where flaws go when a walk made after the tranche finds some. No recommendation yet; it depends on your answer to 1.

Technical, mine to settle and report: which session prepares a release (your Foundations name the directing session), and how a release is packaged and put on a test site.

---

## 5. Your 288 lines

**Where the 288 come from.** 151 are from your Keep and Drop Ledger: a session drafted 159 statements and you marked each keep, modify or drop; the 151 are the ones marked keep (119) or modify (32). The other 137 come from your Foundations, the document a session wrote for you from the Ledger. Earlier auditors, not you, cut it into those 137.

**Where they stand in the fifth draft (a worker recounted today; the counts agree with the audit and add up to 288).**

- 112 kept and stated in the draft.
- 43 kept in purpose, with the way of doing them changed.
- 53 kept, but the draft says nothing about them.
- 75 ended, in whole or in one clause. Of these: 18 on something you typed on 14 November; 22 on a session's written record of your decisions of 13 and 14 November; 2 on a sentence a session wrote; and 33 by Claude without being put to you.
- 4 contradicted: the draft does what the line forbids.
- 1 no longer mentioned at all.

**The 33.** They are now grouped into seven proposals for a yes or no each: when Process4 counts as in force, and your first health number; three measurements owed on the first tranche; two duties repeated at each new model version; two removals the draft blamed on a 9 November remark of yours; records and cost figures for each job; size limits on what goes into the repository; and rules about the process's own instruction texts. Nine of the 33 are checks or re-tests that your "three tests and no others" may already end, but you were never asked whether your words reach that far. Until you answer, I will write "proposed", not "ended".

One of them was wrongly laid at your door. The draft says the set-up check ended "on your instruction" of 9 November. Process3's decision record, under your quoted words ("Is this needed at all? If so, it must be done efficiently. If not, then cut it."), decided to keep the check and run it less often. Ending it was Claude's doing.

**The 53.** Grouped into nine subjects, such as how sessions are kept short and replaceable, what each session reads, and how the process reaches a product. Putting them back is my work. Three clash with your words on PROCESS and will come to you instead.

**The 75 and "which governs".** For these lines your Ledger still says keep or modify, and your Foundations still state them, while the definition says otherwise. Nothing says which of the three a session should follow. A session that reads the Ledger does one thing; a session that reads the definition does another. The audit's two choices: a sentence saying the definition is followed from the day you accept it, with the older two kept as history; or the older two withdrawn from what sessions read. **My recommendation:** the first, and only once the definition accounts for every line, since otherwise the 53 unstated lines would vanish by default.

**Something new, found today.** The 288 are not all of your requirements. They were made from an early copy of your Foundations (up to 4 November) and from the first Keep and Drop page only. A later copy of the Foundations, and a second Keep and Drop page you answered on 6 November, hold requirements that are in none of the 288: among them everything you said on 5 and 6 November about lanes. A worker is now listing exactly what is missing. I will report the count when it is done.
