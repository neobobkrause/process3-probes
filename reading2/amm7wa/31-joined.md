# [file] draft-approvals-split-8nov.md (continued)


Design lanes, run under BOB, own their lane folders, the design stream (docs/development/ux-substrate) included, and each lane runs as one session at a time. Within the product’s principles they decide design and wording there. Their design documents are claude.ai artifacts, not repository files. A pull request that changes only files in its own lane's folder lands through the merge tool without a test suite run, and the large files a lane's generators build are built at layer close, deploy and release, never committed.

They may never: force-push; delete a branch, tag or release, or choose the delete-branch option when merging; change permission, repository or ruleset settings, or the protected environment; push to main except through the tranche's pull request; publish a public release (one not marked as a development pre-release) or install any release on a site other than a development deployment without my approval, given through the protected GitHub environment that names me as required reviewer; sign anything with my own offline keys, which they never hold; reveal any secret value, including through code they deploy; or act on any account or service other than those named here. Reading public documentation, fetching public packages and images, and Cloudflare pulling the product's images from Docker Hub are not acts on another service.

One exception to the paragraph above: the process's scheduled branch cleanup workflow, running in this repository, may delete branches whose commits are all in the tranche, and the merge train's train/head/* branches whose pull request is closed; never main, the tranche or the state branch, a branch with an open pull request, or one with a commit in the last 2 hours.

## B. process3 (given to Bob in chat, 8 Nov ~17:58Z, date filled)

### Standing approvals from Bob (paste as "## ")

Standing approvals from Bob for Process3, the development process, restated on 8 Nov 2026 for process3's own repository only. They cover every Claude session working on Process3, including sessions that other sessions started. Each product developed with Process3 carries its own approvals in its own repository. A session's acts on a product's repository, accounts and services are governed only by that product's approvals, and are made only from a session started in that product's repository (one repository per session, PLT-7).

Such sessions may, without asking me: start, message, interrupt and archive Claude sessions working on Process3 or on a product developed with it, on the Claude account the acting session itself runs under; subscribe to and unsubscribe from activity on the process's pull requests; create, switch off and delete the process's scheduled tasks on that account; notify me by push notification; and create and edit Process3 pages and documents on claude.ai under that account.

In this repository, neobobkrause/process3, only, they may: push to their own working branches and to the process's state branch; create tranche branches from main; open, edit, comment on, review without approving, mark ready or draft, close and reopen pull requests; through the process's merge tool, merge pull requests into working and tranche branches once its gate and their required checks pass, without a person's review, and merge the tranche's pull request into main the same way; run builds and tests, fetching public packages and images for them; run, re-run and cancel this repository's own workflows; and change its workflow files only through pull requests the merge tool merges after a green gate, never adding or renaming a job whose name matches a required check, never widening any workflow's or job's permissions, and never adding a pull_request_target trigger.

They may never: force-push; delete a branch, tag or release, or choose the delete-branch option when merging; change permission, repository or ruleset settings, or a protected environment; push to main except through the tranche's pull request; reveal any secret value; or act on any account or service other than those named here, except under a product's own approvals from a session started in that product's repository. Reading public documentation and fetching public packages and images are not acts on another service.

One exception to the paragraph above: the process's scheduled branch cleanup workflow, running in this repository, may delete branches whose commits are all in the tranche, and the merge train's train/head/* branches whose pull request is closed; never main, the tranche or the state branch, a branch with an open pull request, or one with a commit in the last 2 hours.

## C. process3-probes

### Standing approvals from Bob (paste as "## ")

Standing approvals from Bob for process3-probes, the process's test bed, restated on 8 Nov 2026 for this repository only. They cover every Claude session working in this repository, including sessions that other sessions started. Such sessions may, without asking me: start, message, interrupt and archive Claude sessions working on Process3 or on a product developed with it, on the Claude account the acting session itself runs under; subscribe to and unsubscribe from activity on the process's pull requests; create, switch off and delete the process's scheduled tasks on that account; and notify me by push notification.

In this repository, neobobkrause/process3-probes, only, they may: push to their own working branches and to the process's state branch; create tranche branches from main; open, edit, comment on, review without approving, mark ready or draft, close and reopen pull requests; through the process's merge tool, merge pull requests into working and tranche branches once its gate and their required checks pass, without a person's review, and merge the tranche's pull request into main the same way; run builds and tests, fetching public packages and images for them; run, re-run and cancel this repository's own workflows; and change its workflow files only through pull requests the merge tool merges after a green gate, never adding or renaming a job whose name matches a required check, never widening any workflow's or job's permissions, never adding a pull_request_target trigger, and never making the process gate anything but the process's own shim at the pinned process.

They may never: force-push; delete a branch, tag or release, or choose the delete-branch option when merging; change permission, repository or ruleset settings, or a protected environment; push to main except through the tranche's pull request; cut or publish any release; reveal any secret value; or act on any account or service other than those named here. Reading public documentation and fetching public packages and images are not acts on another service.

One exception to the paragraph above: the process's scheduled branch cleanup workflow, running in this repository, may delete branches whose commits are all in the tranche, and the merge train's train/head/* branches whose pull request is closed; never main, the tranche or the state branch, a branch with an open pull request, or one with a commit in the last 2 hours.

Commit order: A (copy), then B (process3), then C (probes).


# [file] coordinator-handoff-6nov-b.md

# Coordinator handoff, 6 Nov 2026 15:33 UTC (session_018BhcefWe4WxFWZ4TbLMirV)

Full log: the entries after 06:57 in notes/coordinator-findings-3-4nov.md. Bob's decisions today are marked "BOB'S DECISION" there.

## State
- The copy runs the SHARED LAYER BRANCH: pin process3 4a85f26, merge_strategy "layer" (copy PR 623, 10:01Z). The MERGER and train are stopped and archived (SLB-8). Fresh BOB is session_018Bhceff4p3dNtYx3XNk4CX on the layer-mode prompt.
- SLB-10 trial: layer 7 opened 12:33Z and merged 14:01Z (1.47 h). Layer 8 opened 14:03Z: 15 modules; most landed; re-tests are staggered by provider. Figures are at the 15:20 entry. Layer 8 can't merge until the second pin move:
  - 4 modules (case-carriage, publish-schedule, project-stage, case-account) wait on R4;
  - corpus-export's BLOCKED draft 631 holds the merge until R4b.
- Copy: dist pass 624 landed 12:11; Bob merged workflow PR 625. Draft copy PR 648 (regression Chromium `|| true`; release-sign build-image; round-close digest order) waits for R1 in the copy's pin, then goes through the tool. The agent-runner and file-scanner images are STALE until the round close.
- process3 tranche 6208c8a. Merged today: 186, 187, 181, 184 and 189 by me; 188 by Bob.

## Open process3 PRs, merge order
1. 190 (R3 holds end at layer open; R4 ledger entry carried from the tranche, and layer open checks entries; R4b BLOCKED counts as deferred; R5 unshallow). Builder session_018BhceetVvqFedhb4N42ZAK. ci green on ca2e95f, but it conflicts with the tranche; the builder is merging the tranche in. Reviewed (3 defects fixed).
2. 192 (R1: workflow edits merge within Bob's limits L1-L5, plus Bob's "new steps only after the last existing step in a required job"). Builder session_018Bhcef1pxNYJCcaejqj138 is adding that rule. Reviewed (6 bypasses fixed).
3. 193 (R7 `layer retest`, option A: CI-only, no session; R8 tighter triggers, plus Bob's "c": additive changes get a gate-only retest and breaking ones a full reschedule; publication 632 is the fixture). Same builder as 190; stacked on 190; R8 cold review pending.
4. R2 PR B (same builder as 192): status warning at 70% of suite_timeout_minutes; the gate-speed `sleep 30` test fix; R9 measurement rows (p3 test run rows, gate minutes in state, layer report wall/test/work per module). 178 and the train-scan fix are DROPPED.
5. 191: DELETE the merge-train flow (Bob: dead code goes). Builder session_018Bhcef7TXuVjVZ4eN1SCzE. It keeps (d) the stale coordinator-id flag and (e) the lane-row module warning. Merges last; probes gets merge_strategy layer if needed.
Then the copy's SECOND PIN MOVE (no live session for it; start one, as with copy PR 623: plain PR moving .process to the new tranche, setup check --at HEAD, merge --plain). After it: BOB starts the 4 held layer 8 modules, corpus-export defers, 648 goes through R1, and layer 8 merges.

## Rules in force from Bob today
- R1 (limits as above), R2, R6 B (rulebook PR 189: a door test owed to a later layer is not-verified and owed there), R8 plus "c", remove the train code. 188 and 625 were merged by Bob by hand.

## Sessions
- ROOT session_018BhceduipEp2mmEFHN9Diu (it holds audit 2 session_018Bhced5SCACwF5S3dkLLft and my 3 builders; it may archive builders as their PRs merge). Watcher session_018BhcefMKiLuojtdyeh1nzG.
- My tasks: hourly flow trig_01NPbCjwcYiEH9RDNyLyh4wF (prompt updated for the trial); survival reads trig_0144Gamm24fz712aDcSwZK4T (16 Nov) and trig_01Qepit1jkXt3vYX9C65THcD (18 Nov). Move them to yourself and delete these.
- I'm subscribed to process3 190, 191, 192 and 193. Subscribe yourself.

## Open for Bob
Nothing pending. At the trial's end: report layers 7-10 against the layer 6 baseline (with the R9 split once pinned).

## Lessons
- A ci re-run keeps the old workflow; a push picks up the new one.
- Builders' reports can cross my messages: check the head sha before merging.
- Ask BOB for figures; `layer report` lacks starts, wall and gate minutes until R9.

## Addendum 15:36
- Bob: schedule jobs earliest in the total order first. BOB starts in dependency order now (a user starts after its in-layer providers land; early starts only on idle capacity, logged). R10 (tool support: layer jobs ordered, after-provider marks, early-start counts) to builder session_018BhceetVvqFedhb4N42ZAK after 190 and 193.


# [file] bob-workflow-diffs-4nov.md

# Bob's act 4: two workflow changes for the copy's first tranche close (4 Nov 07:00)

The first close of neobobkrause/civicsmith-copy (tranche into main) is refused by the merge tool until these two diffs reach main. They are workflow changes, so only Bob can approve them. Route, recommended: commit them to the copy's main through GitHub's website, after which the close merges through the tool. The alternative is for Bob to merge the first close himself.
