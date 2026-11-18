# [file] coordinator-handoff-5nov.md (continued)

- Known gaps for the first dev release notes: ratification does not call docket R33; exploring runs (K5821) not yet met; AI runs do not dispatch on a deployment until agent-model's path source (R35, layer 6) exists.
- Debt inventory (22:50 entry): 185 base-red (61 now real browser reds), 19 deferred marks, 16 skips/todos, 22 over-cap files, 12 modules with requirements-pinning tests (found marks go in as the module job's first commit), ~15 large tracked files.
- Tool size tonight: +42, +76, +128, +56, +47, +91, +109/-70, +18, +96 non-test lines (each cited); the cap is NOT met; the trust-layer simplifications are the offset (notes/trust-layer-review-4nov.md on review/trust-layer-4nov).

OPEN (yours):
1. First release path: interface-shell, journey-check, control-plane, plane, op-declarations to merge; then set plan: close (partial close), round close: internal walk, deploy dev, live walk, findings into a completion round, redeploy until the walk passes, tranche close, release dev, install from scratch, upgrade test.
2. Lanes: build only after Bob says he has read LAN-1..LAN-10.
3. Per-area walkers (R7): the copy holds walk-T51-final/BRIEF.md (13 sittings), walk-coverage-T51.md (13 areas), lane-journeys/.
4. Debt paydown plan to Bob after the release (order in my 23:00 message to him).
5. Coordinator as a runtime role (C1-C6): nobody watches the coordinator's context yet.

HOW TO WORK (learned 4 Nov): read the code before deciding a session's claim (3 of tonight's "process defects" were real, 1 was not); a build's test runs the live case; a fix closes the class; every gate/merge/record change gets a confirming review; send BOB one batched message per check-in; never ask Bob technical questions.

COORDINATOR RULES ON SPEED (Bob, 5 Nov 01:15; carry into every handoff):
- Speed is the objective. Cost, risk and tidiness are constraints only where Bob has named them. Never trade throughput for them by default. Subscription usage is Bob's to watch, never a reason to hold work (Bob, 5 Nov 01:50); he says when to move to another account.
- Never limit work below the job cap by an instruction. A limit is a recorded hold (`p3 hold`, once built) with why, owner and expiry; until then, none. Bob alone sets a long or large hold.
- A handoff lists every limit in force, who set it, why, and when it ends. An unexplained limit is lifted, not inherited.
- Answer "is it moving with urgency?" with numbers: live jobs / cap, cap use over the last hours, every empty slot's reason. Activity is not an answer.
- Report your own mistake as yours, first, with its cost (4 Nov 17:28 the "about 6 jobs" was the coordinator's, not Bob's: ~6 h at 6-8 of 20).
- A stop or hold message to a running session is sent with priority "now"; the default waits for its turn to end (PR 139 merged 13 min after a hold message, 5 Nov).
- Never present a coordinator design choice as Bob's rule; say whose it is (5 Nov: the "hold needs Bob's commit" rule was mine).
- A change to the merge path, gate or record gets a compared-options design study before any build brief (5 Nov: merge train).


# [file] coordinator-handoff-5nov-c.md

Process3 STOPPED, 5 Nov 05:44 UTC, on Bob's word: "stop all work so that I can start it up under another account". Last coordinator: session_01RAN5emGGSGfSPCvNY5yUpv (old account). Read with notes/coordinator-handoff-5nov-b.md (its rules still bind) and notes/coordinator-findings-3-4nov.md (every finding, newest at the end).

WHAT WAS STOPPED (old account)
- Scheduled tasks switched off (enabled=false, kept, not deleted): sweep trig_01CvCFiaqFxxDJJ6jxh4VVCJ (ROOT, :14 hourly), watcher trig_0112LZi3YvbYtEDcRq7BJ7rS (daily 11:17), coordinator hourly flow trig_01WqgpLR3GtHEMiD286RLWCE, review-trigger check trig_01JKhKPQfDkWQM8VP9ibm9AQ (5 Nov 19:00), merge-train report trig_01BjeJaDb1X75cQefzsAUgEe (6 Nov 04:50), survival reads trig_015zqrVaogCGYXT2uzuNAQoB (16 Nov), trig_01MRGUY7NyfRrVmqYwNywVD8 (18 Nov). The p0-row* "Reply OK" probe tasks (31 Dec) were left as they are. Scheduled tasks belong to an account: recreate those you want on the new account (prompts: get_trigger on the old account, or the findings file).
- STOP sent (priority now) to: MERGER session_01RAN5ep7bdABTc1Cuxosa4J (finish one in-flight merge, stop the train, release the lease), BOB session_01RAN5ejkzH3MteyRfhrb2cm, ROOT session_01RAN5emK1snYonbEbVPHbAP, builds train-order session_01RAN5ekTNu2YHqrY4K4kMFy (PR 146, draft) and abandoned-attempt session_01RAN5ekgxxnyTjxfAGcQHeu (PR 145), working jobs answer-envelope, screens-wizards 445, capture-requests 444, interface-assets 443 (push WIP, end). Idle job sessions were left idle. Nothing archived by the stop.

STATE AT STOP
- Copy pin: process3 86a12f1 (start-anchor, copy PR 442). Copy coordinator field still names session_01RAN5emGGSGfSPCvNY5yUpv (PR 424); probe too (PR 222). A new coordinator records its own id first (handoff b, START 1).
- Merge train trial (merge_train: true on the copy): landed 416, 175 (plane, release path), 409, 410, 412 by 05:42; 413 prepared; ~21 green queued. Restarting means ROOT starts a MERGER again (`start merger`, no clone_depth now).
- Release path left: control-plane 290 (gate cancelled twice; cause asked of BOB) and journey-check 314 (gate re-run). Then round close for the first dev release (handoff b OPEN 2).
- Draft holds (provider first) in force: 420, 431 until 396; 441 until 423; 425, 432 until 430. agent-worker 364 needs a review note (merger-5). agent-runner 394 after 364; ai-runs reopen after 391; registers F1 after 440; citation after 422/426/427/423.
- Parked on the restart/reopen loop until PR 145 merges and the pin moves: case-checker, question-explorer 346 (agent-steps 392 was worked around by unarchiving).
- Builds open: process3 PR 145 (abandoned-attempt: --reopen of never-merged work starts the next attempt branch; --restart for COMPLETE-but-red with open PR) and PR 146 (train-order: release first, shortest gate, 45-min aging, precise provider-first hold; disk_mb is disk used, not free). Both need suite, reviews, merge, then a pin move (`pin move` from process3 prints the short session).
- Design study for Bob: notes/train-throughput-study.md on study/train-throughput (ebfae95). Recommends F: speculative parallel gates k=4 + ordering + plane gate cuts. BOB ASKED, NO ANSWER: may the train gate up to 4 PRs in parallel on speculative bases (train/spec-* branches kept)?
- Ruled to BOB, not yet reported done: plane E1 (base-red load tests to regression tier, by the right route) and E2 (test concurrency, measured).
- Gap noted: `job start --ready` does not list base-red reopens, restarts or over-cap splits; BOB starts them by hand.
- Still Bob's: the 8,402-sentence words queue (words-unreviewed.json); lanes after he reads LAN-1..LAN-10.

TO RESTART ON THE NEW ACCOUNT
1. Bob adds the new account where the standing approvals need it (CLAUDE.md names "the Claude account the acting session itself runs under"; GitHub and Cloudflare access as before).
2. Start a coordinator from start/coordinator-4nov; it reads this file, then handoff b.
3. Coordinator records its id on copy and probe tranches; ROOT, BOB, MERGER and watcher are started fresh on the new account by the process's own start commands; recreate the scheduled tasks above.
4. Archive the old account's sessions once the new ones run (old sessions cannot be messaged from another account).

STOP REPLIES (05:44-05:45)
- build/train-order stopped: tip 4015f05, 792/792; PR 146 draft. Left: cut the disk part to the rename (disk_used_mb + disk_free_mb), independent review, confirming review, suite, ready, merge.
- build/abandoned-attempt stopped: tip 5aa3eaf (784/784 on 513595c; last commit a help comment); PR 145 unmerged, ci check was running. Left: `merge 145 --plain --reviewed "..." --rounds 1` once green, then pin move.
- BOB stopped, nothing half done. 441 back to draft. CONTROL-PLANE 290 CAUSE: process-gate.yml:30 timeout-minutes: 45 cuts the gate (runs 1619, 1671; last green took 40): raise the timeout or shorten the suite by a workflow PR before 290 can merge (release path). answer-envelope restarted (session_01RAN5ejpY66LXEUm7cFwFEi, PR 386). Plain PRs 338, 368 brought up to tranche, need a fresh gate, unmerged. plane attempt 4 not started: remote job/plane has 4cc71be1ff (train's merged-result push) not on tranche (likely the reopen loop; check after PR 145). question-explorer 346 reopen refused while its PR is open. agent-worker 364 review note still owed. Live job sessions 13.
- Old BOB session_01RAN5eomXNvM23EMwtLVBHG still showed working: STOP sent.
- MERGER stopped 05:47: last land PR 413 (plan-work) at 3e9a7e4 05:46:57Z (lands: 416, 175, 409, 410, 412, 413). 408 prepared, not pushed. 364 held for BOB's review note. Lease had no release command; it lapses within 15 min (by ~06:02). NOT DONE for 413: its notice triage and the BOB message (merger-9) were never written: the new BOB runs notice triage for 413 first.


# [file] coordinator-handoff-8nov-d.md

# Coordinator handoff, 8 Nov 2026 ~18:55Z (session_018BhcedbUiTG6UuAPgNfkA9)

Previous: notes/coordinator-handoff-8nov-c.md. Log: notes/coordinator-findings-3-4nov.md, entries 12:52Z to 18:55Z 8 Nov.

## Why now
Bob committed new approvals blocks A, B and C in all three repositories at ~18:00Z (copy 5371d2da, probes 9dfed29d, process3 5d5adf47; drafts in notes/draft-approvals-split-8nov.md). Sessions load approvals only at start. My session also held three repositories, which BD-R2 rules out. START THE SUCCESSOR WITH process3 ONLY.

## Addresses
ROOT session_018BhcefMKiLuojtdyeh1nzG. BOB session_018BhcegCnnPxsYfe31RVw9N (on the old approvals: ROOT's start check / handover replaces it). Watcher session_018BhcegBeapVuoF7cgLpEeR.
My tasks, bound to me (rebind to yourself, then delete mine): hourly trig_0113AcnEKfENELB7wb65xEwh (:51), Phase 1 survival trig_013Zwbn1Mrdm6oG4vC34xexK (16 Nov 17:00Z), Phase 2 survival trig_013GhdrwCMZmXKjyuCftNdE5 (18 Nov 17:00Z).
Probes' process/config.json coordinator: me (probes PR 259). Under C42's new prompt rule, change it through a probes-rooted session, not your own.

## Bob's decisions today (DECISIONS.md on process3 tranche)
- BD-R1 (PR 268): walks end rounds. Each round re-runs the plan's layers over the flawed modules. Repeat until a clean internal walk, then the release deployment and its clean walk, then the installer update, then the site update, both on Bob's approval. Layer 12 finishes as is ("Finish, then switch").
- Bob, in session: flaws found in a module cannot imply flaws in lower layers (total order), so one upward pass per round suffices.
- BD-R2 (PR 270): process3 is product-neutral; each repository's approvals cover it alone; one repository per session; the coordinator stays Bob's front door and acts on a product only through a product-rooted session (BOB, or a short session as pin moves do).
- Biosmoke: biosmokeN is development-testing only. Under the copy's new block, releases are installed there and walked, and deleted with their data after testing.
Mine: PD-15 (PR 266, a test-only land after an earlier source land is at most additive). Rulings: C39 design (1a, 2a, 3, and 4b's shape: `deploy release` installs the signed artifact; a gap where no path exists); C40 pacing (own-repo writes, listed reads); C41 (process/ root; modules file stays, product reads it; build/jobs may move; build/plan and requirements-notes move only with a job updating the tests that read them).

## Merged today
C37 (265), C38 (267), C39 (269), C41/C42 (273). Copy and probes are pinned at c52faf45 (C39). C41/C42 are NOT pinned yet: I held the pin to ride with C40.

## Open acts for you
1. C40, process3 PR 274: ready at head 127548a7 (1221/1221, hashed deny list in, pacing done). Review, merge, then pin the copy and the probes (C40 + C41/C42 together) and archive builder session_018BhcednSXAr6eXZMjaDi8a.
