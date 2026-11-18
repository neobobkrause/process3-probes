# [file] coordinator-handoff-4nov-d.md (continued)


START, in order:
1. Record your id as `coordinator` in process/config.json on the copy's tranche and the probe's tranche, each through a short session (as copy PR 258 and probe PR 219 did at 14:49). Target the tranche only, never main.
2. Move my three scheduled tasks to yourself (create the same prompt bound to you with create_trigger or send_later, then delete mine; read each with get_trigger first): trig_01GiFw3tuB2XerznAuehFoZX (16 Nov 17:00 Phase 1 survival read), trig_01R8S18TfkuSXsjrsbNwbyXB (18 Nov 17:00 Phase 2 survival read), trig_018Wf6AKEanuzgr7u5MPjMe5 (5 Nov 19:00 review-trigger day-1 cost check).
3. Adopt my one open child: session_01RAN5eosbknEoNoECoDwkTw (copy pin move to process3 b8e5502, PR 125, then the review_triggers config PR). It reports to my id; read its result with get_session / list_events, archive it when done.
4. Tell BOB (session_01RAN5eomXNvM23EMwtLVBHG) and ROOT (session_01RAN5emK1snYonbEbVPHbAP) your id. Then archive me.
5. Check your own context at every check-in; hand over at 60% (nobody else watches the coordinator yet; see OPEN 6).

BOB'S DECISIONS TODAY (binding, in order):
- ~14:50 plan: (1) drive the copy through first tranche close, dev deploy, dev release, install from scratch; defects there first. (2) design review of the trust layer, aimed at SIMPLIFYING. (3) cap the tool's size. (4) write results into the Build Plan's gates (doc cccf8cb8-a719-4f73-96f2-9ab0e2aaa897; notes/gate-map-4nov.md).
- Created GitHub environment p3dev-release on the copy, deployment branch rule `tranche` (his word, 15:20; sessions cannot read environment settings; verify by the first release run's publish job and one negative test after).
- Threat model (b): hostile session too, held by GitHub's walls first; the tool holds only where no wall exists. README.md:129 to be rewritten to say so.
- Running users' suites in a job gate is a drag with little benefit (his history): reverted (PR 118). Use a product smoke list instead (PR 120, live).
- Cap: split vs consolidate on evidence, balanced, measured (no bias to splitting). Cap work is PAUSED until the first dev release.
- Reviews (~19:05): product job PRs reviewed before merge on two triggers, security-list changes and deleted or loosened tests; measure for 1-2 days, not a week; review the decision sooner if early cost is significant.
- Agreed (16:55): copy work narrowed to the release path only, about 6 job sessions; a partial first close (`plan: close` in the tranche's config) once conditions hold.

STATE AT HANDOFF:
- process3 tranche b8e5502 (PRs 109-125 merged today). Copy pin a331a17 (copy PR 300); move to b8e5502 in flight (above).
- Tool size: non-test .mjs grew about +250 lines today plus PR 125 (about +200 non-test), each growth cited to a measured defect or Bob's decision. The cap is NOT met. The offset is the trust review's simplifications (notes/trust-layer-review-4nov.md on branch review/trust-layer-4nov, 0fc4373): about 1,100 lines, groups A done (0, 3), B next (5, 6, 9, 10), C after milestones (1 after first close; 2, 11 after first dev release), D on inputs (7 now unblocked by threat model b; 4 needs a ruleset measured on the probe first), E hold (8). Report the net line figure daily.
- First close and release conditions (BOB 17:31): (a) REAUTH fix merged: DONE (copy PR 289); (b) known gap to list in release notes: ratification does not yet call docket R33's signed edition entry; (c) p3dev-t1 serves pages and the walk passes: needs screens-daily 281 and screens-inquiry 173 merged (together they clear the smoke t46-app), then redeploy. Then: `plan: close` partial close into main, deploy, `release dev` by dispatch on the tranche (never push a p3dev-release branch), install from scratch, upgrade test.
- Audit (17:19, 63% of sampled requirements met and tested): product defects routed to BOB; 1 (REAUTH) and 5 (case-checker, via the new --fresh-branch restart on job/case-checker-2) in hand; 2 control-plane, 3 screens-settings, then 4, 6, 7.
- M-R7 is BOB's measurement (not Bob's), queued after the redeploy serves.
- Review triggers: backtest 28 of 116 merges (24%), catches PRs 253, 174, 95. First live data: 6 hand reviews, 0.9-2.3 min each, one real catch (plane 175's control test could not fail). Early-warning lines: >15% of PRs, median +10 min to merge, most reviews with nothing acted on. 24% is over the first line; I recommended keeping it for the trial because the per-review cost is small; Bob has not objected. Judge on live numbers at the day-1 check.
- ROOT sweeps hourly at :14 with `--sessions` (live 20, leftovers 0 at 18:20). Watch: ROOT's state-branch pushes needed 3-4 of 5 tries.

OPEN (mine to drive):
1. The first close and release as above; then the trust-review simplifications to bring the tool size down.
2. Gate browser policy (receipts mismatch on Chromium-measured tests; jobs rerun without a browser).
3. `p3dev-*` tag ruleset for Bob: first measure which identity creates the release tag and which identity sessions push as, from the first release run; then give Bob exact settings or say it cannot work.
4. Fresh restarts write no restart.jsonl row (lead figures miss that stop).
5. Build Plan gates (plan step 4) not yet updated with today's results.
8. QUEUED after the first dev release: Process3 (b): the gate accepts removing a generated file that .gitignore lists (copy PR 306 refused 20:47; tracked program.mjs is 6.9 MB and stale, R13/R32 base-red); then BOB untracks it and case-checker restarts on a fresh branch with only its test change.
7. QUEUED (Bob, ~20:10): self-merge trial after the first dev release; design, prerequisites, measures and stop rules in notes/self-merge-trial.md.
6. Nobody watches the coordinator's context: propose that the sweep reads the coordinator's context too and pushes Bob at 60%.

HOW TO WORK (learned today):
- Builds: one fresh review, one fix pass; a build's test must run the live case that motivated it, end to end, with real data shapes (two builds today shipped tests on invented shapes: sweep fields, fresh-branch with a COMPLETE module).
- Before re-adding a mechanism, check the process's history (users' suites in the gate had been tried and dropped).
- Design check before review rounds: code that reads session-controlled text to decide trust goes back for redesign; fixes close the class, not the instance.
- Pin moves one at a time via a short copy session: setup check, then `pin move neobobkrause/civicsmith-copy --pin <full sha> --why "..." --report <your id>`, start the printed session.
- Builds must poll checks in their own turn; never end a turn to wait, never re-push to retrigger.
- Archive every session you start once it reports. Only the owning session can change its own scheduled task's prompt.
- GitHub Actions had an outage 15:50-16:49; exclude it from urgency measures.


# [file] records-inventory.md

# Records that carry a condition or can go stale (R13)

Bob, 6 Nov, about 17:00Z: "Go with option 2, fix it in the tool, not just for this case, but fix process3 to anticipate and address these kinds of situations." Recorded state carries a checkable end condition; the tool ends it when the condition holds; stale state is found and cleared by the process, not by hand (Foundations, Bob's, 6 Nov). The code: `tool/lib/ends.mjs` (conditions), `tool/lib/expire.mjs` (stale records found and ended), `tool/lib/hold.mjs` (holds).

| Record (state branch unless said) | Its end condition | The tool can check it | How it ends |
|---|---|---|---|
| Hold (`holds/holds.jsonl`) | its PRs land (`--prs`), a condition (`--when`), or its time (`--until`); words alone are refused | yes | the tool writes its end row, by `process3`, naming the condition, after any act that writes, at layer open and at the sweep; status shows it holding nothing at once |
| Hold from before conditions (free text) | "until layer <n> closes / opens", read from its words where plain | yes, when plain | as above, the end row marked read from its words; words that say something follows ("after it", "then", "pauses") are not read and are reported by id until their `--until` time |
| Starts owed (`flow/owed.json`) | a start made after it | yes | paid by `job start --ready` (already) |
| Reschedule (`layerflow/<n>/reschedule`) | the user's land holds the provider's land | yes | answered by the land (already, `outstanding`) |
| Layer events (`layerflow/<n>`) | open ends when the layer merges | yes | `layer merge` writes merged (already) |
| Layer close (`layers/closed.jsonl`) | none: a fact | — | — |
| Lane seat (`lanes/sessions.jsonl`) | its session is archived | yes, with list_sessions | the sweep (which reads list_sessions) writes its end row, by `process3`; a session the list does not hold is unknown, never gone |
| Lane ask (`lanes/asks.jsonl`) | a recorded decision | yes | `lane ask --record` (already); one whose lane is no longer configured is reported |
| Triage owed (`notices/triage/owed`) | the triage recorded | yes | `notice triage` (already) |
| Role address (`addresses/<role>.json`) | its session archived | yes, with list_sessions | reported: a role's next session is named by handover or `address`, which the sweep's own steps start |
| Coordinator id (`process/config.json`) | its session archived | yes, with list_sessions | reported: the config changes by pull request |
| BLOCKED mark (ledger entry) | a person's ruling | no | reported with its age (status, already) |
| Deferral at a layer close (`layers/closed.jsonl` deferred) | its module's next job | yes | the job's start carries it (already) |
| Merger lease, in flight, plain queue (`merger/`) | their expiry time | yes | time-limited (already); the train is being removed |

Seen on the copy, 6 Nov: hold-19 to hold-22 ("until layer 6 closes … ends when the coordinator says") end by `layer_closed:6`, read from their words. hold-18 ("until layer 6 closes start only layer 6 work; after it product work pauses for the layer-branch pin") is not read: its words say something follows the close, so it holds until its time, 7 Nov 00:15Z, and is reported. hold-23 and hold-24 name no condition the tool reads; they hold until their time, 7 Nov 03:08Z and 03:49Z.


# [file] draft-approvals-biosmoke-8nov.md

# Draft: CLAUDE.md approvals amendment for biosmoke (for Bob to commit), 8 Nov

Bob in session, 8 Nov: "The biosmoke8 install (indeed, any biosmokeN release) is for development testing purposes only. The deployment and any data captured or generated during testing with by deleting when testing is completed."
Answer the same day: releases are walked on biosmokeN; Bob amends CLAUDE.md.

The same approvals block is in three repositories (process3, civicsmith-copy, process3-probes). Make both edits in each.

## Edit 1: the protected list

Replace:
> except those this paragraph forbids changing below (today the Workers biosmoke8, plat-s1, agent-runner, agent-runner-plat-s1, agent-worker, agent-worker-plat-s1, file-scanner, ocr-worker, pdf-worker, pdf-worker-plat-s1 and sheet-worker, the R2 buckets bio-captures, bio-published, bio-captures-plat-s1, bio-published-plat-s1 and bio-walks, and the Durable Objects and container applications those Workers define)

with:
> except those this paragraph forbids changing below (today the Workers plat-s1, agent-runner-plat-s1, agent-worker-plat-s1 and pdf-worker-plat-s1, the R2 buckets bio-captures-plat-s1, bio-published-plat-s1 and bio-walks, and the Durable Objects and container applications those Workers define). Any Worker named biosmoke followed by a number is a development deployment, for testing releases only, together with the Workers it binds (today agent-runner, agent-worker, file-scanner, ocr-worker, pdf-worker and sheet-worker) and the R2 buckets bio-captures and bio-published; sessions may install and upgrade a release in it, walk it, and delete it and all data captured or generated in testing once testing is complete
