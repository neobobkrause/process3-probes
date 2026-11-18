# [file] redteam_feasibility.md (continued)


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

**Must exist before run 1** (all are settings, owner acts or sentences):
1. One owner page: every setting with its value and link (rulesets and bypass, CODEOWNERS, auto-merge on, delete head branches on, Actions permissions, the two GitHub environments, the cloud environment's variables and `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`, the session account).
2. Secrets moved: the eleven variables out of the cloud environment; signing seeds only in the owner-reviewed environment; development Cloudflare token only in `dev`.
3. The owner's rewritten approvals (finding 3).
4. Workflow files on `main` and the session start rule (finding 1).
5. The round file and item naming (finding 7); the product's setup command named in START.
6. The run's close rule, one sentence: "a run closes with one integration-to-main pull request; required: the regression and a passed development walk (`Require deployments to succeed`); the owner merges it."
7. Pause (finding 9) and the BOB replacement steps (finding 10).

**Can wait for a count or a first need:** release cutting and a tag ruleset (before the first public release, not run 1); cost measurement beyond "unmeasured" (but say who reads it); a second product and the account-wide session limit; Worker Previews; type-check and lint; the merge queue; a contract for onboarding a new product (run 1 is the same product).

### 12. The success test rewards the wrong thing, and the decisive number is one sessions can move

**Evidence.**
- "Landings per day at or above 4 Nov's level": 4 Nov was 135 landings of first-time layer work. Run 1 is one layer merge and walk-fix rounds of some tens of items (round 2 had 33 [repo]). There is no comparable work, and landings were the number Process3 inflated: 105 of 508 changed only records and jobs landed 3.0 times each [repo: product_side].
- "Walk steps passing rises every day": the walker, `journey-check`, is a module that jobs edit (CR2-2), and its step count moved from 238 to 357 inside one round [repo: product_side 9]. A job told to make the walk pass can change the walk. The draft's own P5 warns of this tendency and guards only gate time.
- "Median ready-to-merged under 30 minutes": Process3's good days were 6 to 13 minutes and its bad day had a 90th percentile of 670 [repo]; a median hides the failure.
- R22's two health numbers (false-done rate, cost per surviving change) have no successor in the test.

**Correction.** Replace the landings line with "items merged once; re-landings counted separately" and "no ready item waited over 60 minutes for a start". State the walk as passing/total, with the total and "steps removed or loosened since run start" printed beside it; decide on that count whether the step list needs the owner. Add a 90th percentile under 60 minutes. Add "hours the integration branch was red" and "cost per merged item, or the word unmeasured".

**Spikes.** S1, S2, S3, S6 and S7 are right. S4 and S5 need the changes in findings 2, 5 and 10. Missing:
- **S8.** One subscriber per PR: the job receives a red check and the merge; a replacement receives events only after the first session is archived; how many turns one CI run produces.
- **S9.** `create_session` with a commit as `source_revision`, model and effort set by BOB: the child loads that commit's deny list and `CLAUDE.md`. Whether finished idle sessions count toward the live limit.
- **S10.** Re-measure whether a task's fresh session can start a session, push and open a PR. If it can, a stateless BOB per wake replaces the long-lived one, and S4's compaction question disappears.
- **S1 additions:** a no-module PR merges; the owner's own guarded-path PR merges by bypass; the gitlink path is owned.

---

## C. R1 to R25

| # | Verdict | One line |
| --- | --- | --- |
| R1 | Weakened | Work reaches the integration branch; the draft never says how or when it reaches `main` (F11). |
| R2 | Met differently | The check set and the process move to the owner; the rest stays BOB's once `modules.json` leaves the guarded set (F8). |
| R3 | Weakened | New owner acts: merge process PRs, approve guarded paths, restart BOB, hold the settings page. No route for a question that is his, rendered with options. |
| R4 | Weakened | M4 covers "only merged words are rules"; nothing holds "asked once, never asked again", and O5 lets a ruling expire and return. |
| R5 | Met | M3.6 and O2 keep a question a question. |
| R6 | Weakened | Blockers are labels and work goes on, but BOB's death or pause waits for the owner, found by a daily alarm (F10). |
| R7 | Not met | No pause; the hourly prompt restarts work against the owner's word (F9). |
| R8 | Met differently | Check runs and merges are the evidence; receipts go. Stronger than before. |
| R9 | Met | Merged is done; `main` is walled. The integration branch may be red briefly, by design. |
| R10 | Weakened | The revert check becomes a nightly sample; the "weakened tests" flag that calls the reviewer is defined nowhere in the gate (G4 forbids it). |
| R11 | Weakened | Not addressed: who keeps requirement files and marks, now that format checks and the ledger go (F7 supplies the minimum). |
| R12 | Weakened | Module at the PR, yes. Layer close is the walk only; the whole-product regression is not mentioned (F6). |
| R13 | Met differently | PRs, issues and product files carry state. One gap: which session is BOB, and its task, is recorded nowhere (F10). |
| R14 | Weakened | "Push before you stop" is not in the working agreement; an unpushed draft is invisible to the watchdog. |
| R15 | Met differently | A session may stop; a freed slot can wait up to an hour (F2), counted. |
| R16 | Met | Stronger: sessions cannot write the process, and the pin moves only between runs. |
| R17 | Weakened | Layers and single ownership rest on a sentence; the imports check that enforced `uses` is deleted, and "ready" ignores in-layer dependencies (F6). |
| R18 | Met | Caps and split-at-planning. The `CLAUDE.md` cap is in the wrong unit (F3). |
| R19 | Met | One pass, five findings, never the merge decision. |
| R20 | Weakened | The production wall is right; development and public release cutting have no mechanism after the tool goes, and signing seeds sit in the session environment (F11). |
| R21 | Met | Stronger: removal is the default, changes only between runs. |
| R22 | Weakened | Daily numbers exist; false-done rate and cost per surviving change are dropped, cost may read "unmeasured", owner minutes are self-reported (F12). |
| R23 | Met differently, conditional | Holds only if the spikes run; today it stands on four unmeasured behaviours (F2, F3, F8, F10) and on approvals text written for Process3. |
| R24 | Weakened | No onboarding page, no setup list, nothing for a second product sharing the account's session limit (F11). Account moves get easier. |
| R25 | Met | M2. |

Not met: R7. Weakened: R1, R3, R4, R6, R10, R11, R12, R14, R17, R20, R22, R24. Seven of those thirteen close with the sentences in section B (R1, R7, R11, R12, R14, R17 in part, R20 in part); R3, R4, R6, R10, R22 and R24 are real trades the draft should state as trades.


# [file] gate-map-4nov.md

# Gate map: Phase 2 gate and Phase 3, against what Process3 measures (4 Nov 2026, about 01:20 UTC)

Sources: Build Plan doc cccf8cb8 (rev 223, exported to build-plan.md beside this file), notes/coordinator-findings-3-4nov.md (to 01:06), notes/coordinator-handoff-4nov.md, process3 README command table, process3 git at 7f50bdd (local origin/tranche; PR 65 is not in this local ref).

Owner key: coord = the coordinator; BOB = the copy's BOB; build = a process3 build or a copy job; Bob = needs his categories, approvals or accounts, or an act only he can take.

## Phase 2 gate

| id | requires (Plan's words, short) | status | evidence | act owed, whose |
|---|---|---|---|---|
| P2-G1 | "Every ready module of layer 1 started at once" | met and measured | 22:18 all five layer-1 jobs started within 4 s | none; coord writes it |
| P2-G2 | "...and merged on green without Bob" | met with one deferral | copy PRs 36, 37, 39, 40 merged; PR 40 needed PR 64 (amended receipt) and gate re-run green 00:52-01:05; runtime-limits BLOCKED on unrecorded M-R7, PR 38 closed unmerged, deferred at layer close 249b62e (R47); jurisdictions 5 marks deferred. ROOT took PR 40's A/B to Bob (P17 breach); coord answered, Bob took no act | coord writes it as 4 of 5 merged, 1 deferred with its reason; BOB records whether a deferral meets "merged" (technical, not Bob's); M-R7 measure owed by a job |
| P2-G3 | "the first job with zero refusals" | owed | no finding records the layer-1 refusal count | coord or BOB reads metrics/refusals rows and the measured rows for the first job |
| P2-G4 | "BOB's idle time while work was ready no longer than one sweep interval per occurrence" | owed (measure built, not read) | PR 47 metrics: `metrics report` bob_idle_by_day from sweep rows. One known occurrence: 23:21 pin move woke no one, BOB idle until the sweep, woken by hand; fixed by PR 59 (merge --plain prints wake BOB). ROOT's sweep deleted 00:05, so no sweep rows until the watcher takes over | coord runs `metrics report`, lists each occurrence; names 00:05 to takeover unmeasured by design (the fault) |
| P2-G5a | "one handover" | met and measured | handover observed five times, 3 Nov | coord writes it |
| P2-G5b | "one silent-BOB replacement ... re-observed after [PR 38's fix] with none lost" | not started | planned: after the new ROOT's first wake of BOB, interrupt BOB; sweep should hand over 2 h later. Five BOB-to-ROOT messages not recorded delivered, "to read before the gate" | coord injects the fault, reads the handover row and `send` undelivered list |
| P2-G6 | "one stopped job replaced from its branch ... by an injected fault and observed in the record" | in flight | first try 22:31 (interrupt, jurisdictions) recovered by BOB's message, not replacement; PR 45 (sweep sees pushed-then-stopped). Second: 01:06 mail-door session archived, branch job/mail-door, draft PR 55, nothing pushed; flag due ~03:06 | BOB restarts with `job start mail-door --restart`; coord reads the start row and restart |
| P2-G7 | "one ROOT replacement by the watcher, ... by an injected fault" | in flight | 00:05 ROOT's sweep trig_01DTWrTNrfiSWcG7Z3JkvP6x deleted (last fired 23:59:30); watcher task to be fired by hand 04:10 (trig_017dnQE5uPvGqPnRQLnQ8PEX) | coord fires 04:10; reads: took over, `start record root`, new sweep task, push to Bob |
| P2-G8 | "one development deploy and walk with its findings entered" | in flight | p3dev-l1 dry run every step "p3dev guard: passed" (names -p3dev-l1, images by digest); real deploy running 01:05; walk next. Run from copy PR 47's branch worktree, not `deploy dev` (copy has no deploy block), so no deploys/dev.jsonl row | BOB finishes deploy and walk, enters findings as found-work entries; coord records the run since the tool row will not exist |
| P2-G9 | "the Phase 1 metrics and the overhead share recorded for every job" (reading set, tokens, gate minutes, denials, per attempt) | owed | PR 47 overhead share per job and layer; README: ROOT has no way to record its own cost and gate runs have no cost, both print unmeasured; BOB loses cost if it ends without a row | coord runs `metrics report`; checks a measured row exists for each of the five jobs; names ROOT and gate cost unmeasured |
| P2-G10 | "ROOT's lifetime estimated from its context per sweep" | not started (nothing measures it) | sweep row holds bob_acts, bob_quiet_h, heartbeat; no ROOT context | coord reads ROOT's context share from its session record at each of several sweeps, or a build adds it to the sweep row |
| P2-G11 | "The next layer opens with Phase 3's layer close, once layer 1's checks pass (INT-4)" | met for the close; next layer not opening | PR 48; layer 1 closed at 249b62e 00:52-01:05. Status then listed only mail-door (layer 3, by plain PR 54) and no layer-2 work: "check why at the gate". Tranche open record: "passed or not shown: check" | coord: find why no layer-2 work; read metrics/tranche-open.jsonl for the 12 acts |
| P2-G12 | "Size: ... sizes against rule 8" | owed | rule 8 baseline 2,914 lines / 12 commands; 3,120 / 20 at 237c02a; 4,543 at fba322a; 5,752 lines (tool/p3.mjs + tool/lib) at 7f50bdd; README command table has 38 rows; BOB reading set 5,973 bytes at 237c02a; ROOT prompt 4,248 > 4,096 trimmed by PR 61 | coord reads lines, commands and always-loaded text per role at the gate tip; cites each rise to a Phase 2/3 row |
| P2-P | Proves, measured at the gate: live count held at the cap; BOB's starting reading set; routing share of BOB's context; refusals by role and act | owed; routing share not measured | live_cap in sweep (24); reading set in status; refusals in `report tranche`; nothing measures routing share | coord reads each; routing share named unmeasured or read from BOB's session record |
| R5 | rule 5: one review and one fix pass; "a second review only for the gate, the record check, the approvals check or the merge tool" | mostly held; two to check | second review held on PR 54 (PR 57 found path traversal), 64, 65. PR 46 changed gate.mjs: one review, a bug fixed, no confirming review. PR 44 changed record.mjs: one review, verdict merge. PR 59 changed merge.mjs: no confirming review, "only its printed next act" | coord records at the gate whether PR 46 and 44 owed a confirming review; if so, run one now |
| R9 | rule 9: the ask-Bob test | fixed in text; one breach | ROOT took a technical A/B to Bob 00:05 (its pin b226aed lacked the rule); rulebooks/root.md rule 5 and bob.md rule 4 now hold the test (PR 61) | coord checks ROOT's and BOB's pins carry it (copy pin 7f50bdd does) |

## Phase 3

| id | requires (Plan's words, short) | status | evidence | act owed, whose |
|---|---|---|---|---|
| P3-M1 | PLT-8: "a pull request or push made by a workflow starts the gate, with the workflow's own token and with Bob's" | partly measured | GITHUB_TOKEN push starts no workflow (run 41733911709); workflow PR creation blocked by repo setting; Bob's token not run (P3_PROBE_OWNER_TOKEN not set; session pushes start workflows, run 41735339482) | BOB records "Bob's token not needed" with the reason (rule 2), or keeps it and it becomes Bob's (token) |
| P3-M2 | PLT-8: "a ruleset change by a workflow with Bob's token" | not started | no finding; sessions may never change repository settings | BOB decides: drop with reason (no public release, no ruleset need) or it is Bob's (his token, his settings) |
| P3-M3 | PLT-8: "a scheduled workflow firing on time" | owed (unmeasured) | cron runs on the default branch only, hour-start delays per docs | build: a schedule on the probe's main can land only through the probe's tranche PR to main; or BOB names it unneeded (nothing in the release path is scheduled) |
| P3-M4 | PLT-8: "the longest job a runner allows, against the full regression" | met and measured | 6 h limit vs longest gate job 270 s; copy regression.yml 120 min | coord writes it |
| P3-M5 | PLT-8: "signing with a test key held as a secret and cutting a draft release" | met and measured | 4b PASS, Ed25519, secret masked, draft, run 41735339840; draft has no tag until publish, so the shim pushes the tag (PR 52) | coord writes it |
| P3-B1 | backlog: "an organization-owned product names its approver by the owner's own onboarding commit (process3 PR 26)" | not started | README Known limits: org-owned onboarding held only by GitHub's walls | build at Phase 3 open, or BOB defers it to the backlog with reason (Civicsmith is person-owned) |
| P3-B2 | backlog: "a one-time click-through of the developer's steps' external labels at the next real onboarding (PR 24)" | not started | none | Bob, at Civicsmith's onboarding |
| P3-1 | "Layer start and layer close: ... the next layer starts at once" | built; close measured once; next start not seen | PR 48; layer 1 closed 249b62e; no layer-2 work listed | coord/BOB find why; observe layer 2 start right after a close |
| P3-2 | "Tranche open with the grants check, the pin, and the open check ... tranche close by one PR to main after main is merged into the tranche" | built; open in flight, close not started | PR 50 (12 acts at BOB and probe depth, metrics/tranche-open.jsonl); copy's tranche had no open record, BOB told to run it | coord reads the 12 rows; close at the slice's end, BOB |
| P3-3 | "The completion round's own file" | built, not exercised | PR 63; copy's completion file "in the old format" | BOB (copy plain PR) converts the file and sets completion_file |
| P3-4 | release cut, full regression and whole-product checks as workflows, release note fields; install-from-scratch and upgrade tests as release-tier fixtures; dev releases each round; public release only through a production environment with Bob as reviewer | built on process3; blocked on the copy | PR 52 (release dev + shim), PR 60 (one archive), PR 62 (note fields). Copy: no release block, no assemble script (bundles.mjs rebuilds in place across 8 dist dirs; agent-worker, bio-plane stale; CONTAINER_IMAGE_STALE; duplicate worker.json); install-from-scratch has no live fixture; upgrade test migrate-released.test.mjs local only; public release dropped (Bob, 3 Nov) | build (copy jobs): assemble script, install-from-scratch fixture, upgrade test in the release checks; BOB adds the release block and the shim; coord writes Bob's dev-only word |
| P3-5 | "The tranche report with elapsed time, work, deferrals, cost and overhead share" | built, not run on a closed tranche | PR 49; depth-1 gap fixed in PR 51 (a7800e6, --shallow-exclude=main) | BOB runs `report tranche` after close |
| P3-6 | provider-change route; "if none arises the route is named not exercised, never staged" | built, not exercised | PR 54, PR 57 (path traversal and hidden notice fixed) | BOB: slice reaches a layer-6 user; name it not exercised if no change arises |
| P3-7 | requirements cap: "a provisional number is set at Phase 3's open ..., and the real number at the gate" | built; provisional set | PR 53: 70,000 bytes = p90 of 109 copy files; 11 files over | BOB splits or consolidates the 11 before their jobs; coord sets the real number at the gate |
| P3-8 | "Take-in and tranche carry for a product converting mid-tranche" | built, live use pending | PR 55; setup check lists carry; plan: PR 47 taken in as a bundler job | BOB runs `job start <bundler> --take-in 47` |
| P3-9 | "One lane, UX, opened at Phase 3's open ... consulted by BOB with context" | built, not exercised | PR 63; copy lane dir docs/development/ux-substrate/ set in copy PR 53 | BOB, at the first design question: `lane ask ux` |
| P3-10 | "Onboarding's size measurement against the certified ranges" | built; ranges empty | PR 62: `p3 size`, ranges.json empty, "no certified range yet"; it fills at the first certified release | BOB decides what fills ranges while every release is development only; coord writes it |
| P3-11 | "The prune workflow for the transient branch, built only if a transient branch still exists" | not started | none; grants branches "kept, never deleted" | BOB checks whether a transient branch exists at the open; a prune would delete branches, which the approvals forbid |
| P3-G1 | "The slice tranche merged to main" | not started | `tranche close` built (PR 50) | BOB, after every layer of the slice closes |
| P3-G2 | "a release cut" | not started | see P3-4 | build (copy assemble), then BOB `release dev` |
| P3-G3 | "the tranche report delivered with every metric filled or named unmeasured" | not started | PR 49, 51 | BOB runs it; coord delivers it |
| P3-G4 | "every flaw the slice found fixed and its run repeated from the step that found it (MNT-9)" | in flight (practised) | PR 40: PR 64 fix, gate re-run, merged; copy PR 53: PR 65 fix, same command re-run, merged | coord keeps the list of flaws and their repeated steps for the gate |
| P3-G5 | "The 14-day survival of the Phase 1 and Phase 2 pull requests is read, so the first cost per surviving pull request is a number" | not started; Phase 2 part unscheduled | Phase 1 read 16 Nov (trig_013TMPWVjD618iuitub2tVQh); Phase 2 PRs (3-4 Nov) reach 14 days 17-18 Nov, no task; no command computes cost per surviving PR | coord: schedule the Phase 2 read; compute cost per surviving PR by hand or a build adds it |
| P3-G6 | "Size: five to eight build jobs, then the slice, roughly six to ten product jobs" | over | process3 PRs 47 to 65 for Phase 3 builds, about 19 PRs against 5 to 8 | coord cites the overrun at the gate (rule 8) |
| P3-A1 | "One BOB wake runs as a fresh stateless session and its tokens are counted against a handover row, so SES-16 is decided on a number" | not started (nothing measures it) | handover rows in metrics/handover.jsonl; no stateless-wake procedure | coord runs one stateless BOB wake and counts its tokens from the session record |
| P3-A2 | "The shims carry the product's CLAUDE.md lines under the per-line test, with the pin and the fetch command beside your approvals, and run the product's setup script at a session's first command" | built, measured on the copy | PR 56 (setup check process-lines, shim-drift; start check runs setup_script once); copy pin moves 51, 53 passed setup check | coord confirms the per-line test exists or names it a nudge |
| P3-P | Proves: "a public release waits for your approval and runs only after it"; overhead vs 30 Oct hand counts (sessions per job, gate runs per merged job, record-only commits) | first conflicts with practice; second built | Bob 3 Nov: development only; `report tranche` prints the three counts | coord rewrites the first; BOB reads the second from the report |

## Gaps: criteria nothing yet measures

1. P2-G10, ROOT's lifetime from its context per sweep: no command records ROOT's context; the sweep row does not carry it.
2. P2-P, the routing share of BOB's context: no command or row measures it.
3. P2-G9, the overhead share is partial by design: ROOT's own cost and gate-run cost print unmeasured.
4. P2-G3, the first job's zero refusals: measurable (refusal rows), but no finding reads it.
5. P2-G4, BOB's idle time: the measure is built and unread, and the 00:05 to takeover window has no sweep rows.
6. P2-G8, the deploy and walk run from PR 47's branch, outside `deploy dev`, so it leaves no deploys/dev.jsonl row.
7. P3-A1 (SES-16), the stateless BOB wake: no procedure and no token count.
8. P3-G5, cost per surviving PR: no command computes it, and nothing is scheduled to read Phase 2's PRs at 14 days.
9. P3-M2 and P3-M3 (ruleset change, cron): nothing measured.
10. P3-4, install-from-scratch has no fixture, and the upgrade test runs locally, not in CI. The copy has no assemble script, so no release can be cut.
11. P3-6 and P3-9 (provider route, UX lane): built but not exercised.
12. P3-1, "the next layer starts at once": not seen; status listed no layer-2 work after layer 1 closed.

## The plan against current practice


Eyre desk entered 3 plovers on the sheet.

1. Public release. Phase 3's release row and Proves require a public release through a production environment with Bob as reviewer, and that it "waits for your approval". Bob said on 3 Nov that everything released is development only, and no public path is built or tested.
2. Certified ranges. P3-10 measures against certified ranges. ranges.json fills only at a certified release, and under development only none exists.
3. Rulebooks. The text row (line 316) lists "Rulebooks: platform, record, jobs, gate, integration, sessions, messages, maintenance". PR 58 made them per role (bob, root, watcher, job, worker), each named by its role prompt.
4. The skill. The text rows "Product CLAUDE.md ... pin, fetch command, skill" (line 324) and "The one skill | What each role loads at start, by role" (line 325) conflict with PR 58. A skill cannot load by role without a hook (ENF-1), so there is no skill. CLAUDE.process.md carries the pin, the fetch command, and where the role prompt comes from.
5. Stopped-job fault. The plan says the session "is interrupted and left stopped". Practice moved to archiving: the environment's stop hook pushed WIP, and BOB's message rescued the interrupted job.
6. Silent-ROOT fault. The plan says the sweep is switched off "more than four hours before the watcher's daily wake" (11:17 UTC). Practice fires the watcher's task by hand at 04:10. Detection is unchanged, but its timing is set by hand. The sweep task was deleted, not switched off.
7. Phase 2 gate, "every ready module ... merged". In practice runtime-limits was deferred BLOCKED and its PR closed unmerged, which the tool counts as a valid layer close.
8. The Phase 3 build count was "five to eight build jobs". About 19 merged.
9. PLT-8 asks for runs "with Bob's" token and a ruleset change. The approvals forbid sessions from changing repository settings, and the owner token was found unneeded.
10. The prune workflow (P3-11) would delete branches. Sessions may never delete a branch, and grants branches are kept by design.
11. Workflow files on the copy. Copy PR 47's merge was refused because "workflow edit needs Bob". Adding the dev-release shim, which P3-4 needs, is also a workflow file and may meet the same refusal. The README says a plain PR may add it byte for byte; this is not yet measured on the copy.
12. Deploy route. Rule "Deploy and walk" says BOB deploys "the tranche". The gate's deploy runs from a worktree of an unmerged branch (PR 47) merged with the tip, outside the tool's clean-tip check.
13. Rule 5. PR 46 (gate.mjs) merged after one review whose bug fix had no confirming review. PR 44 (record.mjs) had one review. Practice in the handoff is a confirming review for every gate, record or merge change.

## Build Plan lines the coordinator owes at the gate

1. The Phase 2 gate's results, one line per criterion P2-G1 to G12, with measured figures, the deferral of runtime-limits, and each fault's record.
2. Bob's 3 Nov word that every release is development only: rewrite Phase 3's release row and its Proves line on public release; say what "certified ranges" means now.
3. The text row on rulebooks (line 316): per role, named by each role prompt.
4. Also owed from the findings:
    - The Product CLAUDE.md row (line 324) and "The one skill" row (line 325): no skill (ENF-1), CLAUDE.process.md contents.
    - PLT-8 results into Phase 3's open paragraph: 1a/b, 4, 5 measured; Bob's token not needed; ruleset and cron unmeasured or dropped with reason.
    - Rule 8's size line: 5,752 lines and the command count at the gate tip, with each rise cited.
    - The Phase 2 table's "State" cells: PRs 44 to 65 (sweep stall PR 45, metrics PR 47, restart, deploy act PR 59, pin-move wake), and the stale-start setup line measured 1 of 1, which goes to Bob as a proposed step.
    - The fault-injection paragraph: archive in place of interrupt, the watcher fired by hand.
    - Phase 3's size: the build count overran, with its reason.
    - Phase 3 rows' states: PR numbers for layer close 48, tranche report 49 and 51, tranche open and close 50, dev release 52 and 60, cap 53 (70,000 provisional), provider route 54 and 57, take-in 55, shims 56, lanes and completion 63, size ranges 62.
    - Rule 5's practice, if BOB rules that PR 44 and 46 owed a confirming review.


# [file] point3_first_hour.md

# Point 3, "The first hour": the detail

Reading worker, 14 Nov 2026, second main session. Read-only: nothing committed, pushed, started or changed. Labels: **(V)** verified by me in this session against a primary source (command or file:line given); **(A)** an earlier auditor's report says so, not re-checked; **(J)** a judgement. Paths are under `/home/user/process3/process4/` unless they start with `/`.

## For the owner, in plain words

**What happened on 5 Nov.** A session is one running AI conversation. It runs on a cloud machine that is handed a copy of your repository when the session starts. Your approvals and the list of forbidden commands are read from that copy, once, at the start. On 5 Nov at 18:41 UTC you started ROOT, the first session, from your app, on the correct branch (the line of work the product is being built on). The machine was given a saved copy of that branch, about an hour old: seven changes behind, and without the approvals you had committed sixteen minutes earlier. ROOT's first check saw this and ROOT stopped. Another session sent it one message; it fetched the newest copy and carried on. On 8 Nov the same happened, with the same saved copy, by then three days old. Proven: both starts are in Process3's log; I checked the copy's age against the repository's history. Not proven: why the cloud hands out a saved copy, and whether it still does.

**The fifth draft's fix.** It asks you to make that branch the one GitHub opens by default. But ROOT was not on the wrong branch, and the setting does nothing about an old saved copy. What ran, twice, was ROOT fetching the newest copy, then starting the other sessions at an exact point in the history. Not proven: whether approvals read after a session has started count like those read at the start.

**How the process reaches a session.** A session should hold only the product's repository, but the process's tool and each role's instructions live in the process's repository. The draft never says how they arrive. Your Keep and Drop Ledger does: the product names one fixed version of the process, and each session fetches a read-only copy of it. Process3 ran that way. You marked those lines "keep"; the draft omits them.

**Converting the repositories.** Before Process4 can run, three repositories need changes: the product's, the trial one and the process's. Some only you can make: new wording in your approvals, a changed list of forbidden commands, perhaps a GitHub rule. The draft gives no order and names nobody. Your present approvals forbid sessions to replace the required test run, so an edit of yours must come first. The trial repository refused sessions' last two attempts to save work there; why was never found.

**Five steps with nobody named.** For deploying, preparing a release and moving to a changed process, your earlier documents name the session that directs the build. The draft drops this.

**Yours to decide.** How many acts you accept at the start, in three repositories. Whether the default branch changes. Who carries out a product's move to a changed process after you approve. Whether the directing session may write a new requirement into a module.

**Technical, for Claude to decide and report.** How ROOT gets onto the newest copy. The written order of conversion. Where the tool lives. Who archives finished sessions.

---

## 0. Wrong or stale in the handoff, the draft and the audits (found in this session)

1. **The run audit's limit on 8 Nov is stale.** `working/audit2_feasibility.md:30` says "for 8 Nov the record says only 'again' and gives no id", and `definition/process4_audit2.md:183` repeats it. The primary log gives the id: the same commit, `18935dc7`. Log line 1190: "new ROOT ... (Bob started it; first checkout was an old commit 18935dc7, fixed by fetching the tip; recorded 19:00:44Z)". (V: `git show origin/start/coordinator-4nov:notes/coordinator-findings-3-4nov.md`, line 1190, in `/home/user/process3`.) The auditor read the summary in `evidence/roles_root_coordinator.md:228`, which shortens it to "again on 8 Nov".
2. **The fifth draft's sentence is wrong three ways** (`definition/process4_definition_v5.md:293`: "a ROOT you started plainly came up on the main branch, which held old approvals, both times it was tried"). Not plain: he pasted a prompt of about 4 KB printed by the tool (log line 663; `evidence/roles_root_coordinator.md:97`, `:220`). Not the main branch: a commit that is on the tranche branch and not on main (V, section 2). Not "both times it was tried": he started ROOT from his app three times, and the first landed on the newest commit (log line 652, "Start check ok"). Drafts three and four had it right: "came up on an old copy, twice out of twice" (`definition/process4_definition_v4.md:330`). The error is new in the fifth draft.
3. **The drift audit repeats the draft's error**: `working/audit2_corruption.md:495`, "ROOT came up on the main branch both times". Already noted in `working/audit2_notes.md:137`.
4. **The audits call the missing route for the tool "new" and offer a structure for it** (`working/audit2_feasibility.md:64-65`). Bob's Ledger already holds kept lines that state the route (section 3). The fifth draft's own appendix says so: "how a product session reads the process is not said" (`definition/process4_definition_appendix_v5.md:124`). So this is not an open design matter; it is among the 53 kept lines the draft states nowhere.
5. **"Five steps have nobody named"** is true of the fifth draft's text. For three of the five, Bob's Foundations name the actor (section 5), and the appendix marks one of those lines "Kept as written" while noting "which session deploys is not said" (`definition/process4_definition_appendix_v5.md:370`).
6. **"The draft forbids the product's sessions to do it"** (`definition/process4_audit2.md:75`, on moving a product). The forbidding sentence, "No session building a product may ... adopt a changed process" (`definition/process4_definition_v5.md:264`), is Claude's, under "What follows". Bob's typed words say only who approves and who proposes the means (section 5, step 2).
7. **The run audit's claim that Bob's commit "cannot merge until that is built"** (`working/audit2_feasibility.md:38-47`) is reasoning, not a measurement. One fact against it: Process3's required test run takes its workflow file from the pull request itself (V, section 4). Whether a conversion change can pass GitHub's required check is untested either way.
8. **`working/trial_plan_facts.md:23` and `:377`** say a new throwaway repository must be created and that the probes repository "must not be used for the new trials". It was written before Bob typed "The throwaway repo that you need already exists: process3-probes." (`owner_words/bob_words_14nov_b.md:3`). Stale on that point; the handoff has it right.
9. Small: the probes repository has 310 branches today (V: `git ls-remote --heads`), not 312 (`working/trial_plan_facts.md:366`).

## 1. What the audits say

### The "four places before the first job merges"

The run audit states the count and never lists the four (V: the phrase occurs once, `working/audit2_feasibility.md:5`; the combined audit copies it at `definition/process4_audit2.md:13`). What it does give:

- Three findings rated "Stops the first hour": finding 1, ROOT stands on an old copy (`audit2_feasibility.md:24-36`, rating at `:33`); finding 2, no order or actor for the conversion (`:38-51`, `:48`); finding 3, no route for the tool and role texts, and nothing tells a plainly started ROOT what a ROOT does (`:53-66`, `:63`). `working/audit2_notes.md:16` maps "First hour" to exactly these three.
- Its walk-through, in order, of every stop before a job merges (`audit2_feasibility.md:301-307`):
  1. Before any session: Bob's commits cannot merge until the conversion is built and ordered (finding 2); the process repository's branch and approvals are not specified (finding 9); Process3's leftovers are untouched (finding 21).
  2. ROOT: it stands on an old copy (finding 1); nothing tells it what ROOT does and the tool is not in its repository (finding 3).
  3. ARCH's first hour: the mechanical edit's one allowed moment is after the jobs, yet the module list must be repaired before the first job (finding 8, `:121-133`, "stops the first round for the seven modules"); every change to the list needs a test run that answers on a change touching no module (finding 2).
- (J) Read by where the rating falls, the four are findings 1, 2, 3 and 8. Finding 4 (the notification, "Stops the first job's completion", `:73`) comes at step 8 of a job, after its merge, so it belongs to the "at least five more".

### Section 1 and the map of the combined audit

- Item 3: `definition/process4_audit2.md:21`. Item 4, the five steps: `:22`.
- Map, permissions and starting sessions: `:41`. Run audit "contradictory" (its row: `audit2_feasibility.md:385`); drift and requirements audits "stated but unproven" (`audit2_corruption.md:603`, `audit2_requirements.md:323`).
- Map, shared facts and waking: `:42` (`audit2_feasibility.md:386`, `audit2_corruption.md:604`, `audit2_requirements.md:324`).
- Map, recovery: `:43` (`audit2_feasibility.md:387`: "nobody archives"; `audit2_corruption.md:605`; `audit2_requirements.md:325`).

### Sections 3 to 6 of the combined audit, items bearing on this point

- Question 3, last sentence: who moves a product once he approves (`:75`). Question 5: how new work enters a module (`:85-91`). Question 9: the stop at each edit of his approvals (`:124-130`). Question 12: the watcher, and who notices a dead ROOT (`:154-160`). Question 14, fourth bullet: the cost to him of trial and conversion (`:175`).
- Section 4: "Claude was wrong about ROOT's start" (`:183`); two things listed as untried that the record already has (`:192`); "Named in a sentence, and not enough to build from": shared facts (`:204`), the tool and role texts (`:205`), the order of converting (`:206`), PROCESS after it starts (`:207`), who deploys and who prepares a release (`:208`), the tool's list (`:209`), who archives (`:210`), Process3's leftovers (`:218`).
- Section 5: "Before any trial can run": five decisions of Claude's, what must be built, and his acts in a written order in the trial repository (`:228-231`). Trial 3: whether a ROOT he starts acts on his typed prompt whatever copy it stands on (`:236`).
- Section 6 has no item on this point.

### The three reports, further detail

- Run audit, finding 1, best answer (`audit2_feasibility.md:35`): correct the sentence; let ROOT act on his typed prompt whatever copy it stands on; drop the approvals comparison for ROOT alone; ROOT finds the newest commit and starts the others by commit id. "Whose: Claude's to decide; needs a trial" (`:36`).
- Run audit, finding 2, best answer (`:50`): a written order with settings; "a sitting of Bob's of more than one act, in each repository". "Whose: needs the build; the count of Bob's acts is his to accept" (`:51`).
- Run audit, finding 3, best answer (`:65`): the product carries one line naming the process version; tool and texts fetched at that version as each session's first act; one short passage in the product's CLAUDE.md below his approvals. "Whose: Claude's" (`:66`).
- Run audit, finding 17 (`:225-236`): the trial repository needs the same conversion; the cost line in the draft leaves it out. Finding 21 (`:268-276`): Process3's sessions and hourly alarm may still be alive. Finding 22 row c (`:286`): the draft's table of his acts points to a passage that says nothing about the process's repository. Row i (`:292`): "how a plain start learns its role" is counted as decided though left to the build.
- Run audit, "Relied on by the draft and missing" items 1, 2, 4, 7, 8, 12 (`:340-351`); "The smallest set that must exist before any trial can run" (`:355-360`); "Probed and not found broken" (`:364-367`).
- Drift audit: the process repository's own approvals let sessions merge there, and it has no deny list (`audit2_corruption.md:93`); a product session can start a session on any repository, so "holds one repository" does not keep it off the process (`:100`); after a process change, standing sessions still carry the old role text (`:395`); the default-branch setting makes the unfinished branch what every visitor sees and hides main (`:544`).
- Requirements audit: the default-branch setting is a new act of his that rests on Claude's decision, and "restart ROOT after every edit" is Claude's consequence, not the record's (`audit2_requirements.md:227-228`); ROOT starting PROCESS crosses kept lines on one repository per session (`:260`); "Who writes the rest of the product's CLAUDE.md is not said" (`:262`).


Every job must note: every file the job writes begins with this exact first line: `# ref N7J-2756`.

## 2. The record of ROOT's start

**Primary record.** The Process3 coordinator's running log: `notes/coordinator-findings-3-4nov.md` on branch `origin/start/coordinator-4nov` of `/home/user/process3` (1,302 lines). It is a session's record. `origin/process-state` in `/home/user/process3` holds only GitHub-usage rows (V: `git ls-tree origin/process-state` shows one folder, `github`). The role addresses are on the product's `process-state` branch, which I read (below).

**What the log says** (V, exact):

- Line 652, 5 Nov 17:52: "NEW ROOT session_018BhcefQE6Fhbhczqxpav9v, started by Bob from his app (depth 0, no parent). Start check ok, recorded as root 17:45:45".
- Line 663, 18:35: "Bob committed the CLAUDE.md updates in all three repos (copy f575c3b1 18:25:29 UTC) ... New approvals hash 9d44cc63: every role stops at its next start check ... Restart: Bob starts ROOT from his app (notes/root-prompt.txt, regenerated at pin 89d87b9)".
- Line 667, 18:44: "ROOT 2 session_018BhceduipEp2mmEFHN9Diu (Bob's app, depth 0, approvals 9d44cc63): first start check failed (container on 18935dc7, older than the tip), it stopped correctly; on my message it stood on the tip, check passed, recorded 18:41 ... NOTE: the Bob-app ROOT clones the default ref, not the tip: the prompt's step 2 then fails; next time tell Bob to pick branch tranche (he did) - the clone was cached from earlier (18935dc7)."
- Line 1190, 8 Nov 19:15: quoted in section 0, item 1.

**Checked against the product's history** (V: a commits-only fetch of `tranche`, `main` and `process-state` into a scratch repository, then `git log`, `git merge-base --is-ancestor`, `git rev-list --count`):

- `18935dc7c400...` is "Merge job PR 458", made 5 Nov 17:32:56 UTC. It is in the history of `tranche`. It is not in the history of `main`. `main` stands at `0dea5a6`, 1 Nov, and is the repository's default branch (V: `git ls-remote --symref`).
- It was the newest commit of `tranche` from 17:32:56 to 17:46:33. Bob's first app-started ROOT was recorded at 17:45:50 (state-branch commit `066fceea4`). So that first start landed on the newest commit, and that commit is the one the two later starts came up on.
- At 18:41:16 on 5 Nov (state-branch commit `cb6359d83`, "address: root session_018BhceduipEp2mmEFHN9Diu") the newest commit was `f575c3b1f`, Bob's merge of pull request 550 at 18:25:29, his approvals edit. Between the two lie 7 merges on the branch's main line. The run audit's figures (`audit2_feasibility.md:30`) are confirmed.
- At 19:00:45 on 8 Nov (state-branch commit `2228150a8`) the newest commit was `535f05965`, Bob's merge of pull request 1067 at 18:02:46, again an approvals edit. The copy ROOT came up on was the same `18935dc7`: 73 hours old, 260 main-line merges (2,346 commits) behind.

**So, exactly.** Which branch: the tranche branch, which Bob had picked (log 667, "he did"). How old: about an hour on 5 Nov; three days on 8 Nov; the same saved copy both times. What went wrong: the copy held the approvals as they were before his edit, and was not the newest commit. Process3's first command, `start check`, compares the copy with the branch's newest commit and the approvals with those there; on a difference the session "acts on nothing" and reports (V: `origin/tranche:tool/lib/start.mjs:1-11`; ROOT's prompt step 2, `origin/tranche:tool/lib/roles.mjs:143`). ROOT stopped. Nothing else was lost. Both times ROOT then moved to the newest commit (on 5 Nov "on my message", from the coordinator), passed the check, and started the other roles (log 667, 668, 1190). At a first hour of Process4 no coordinator exists yet to send that message: ROOT starts it.
