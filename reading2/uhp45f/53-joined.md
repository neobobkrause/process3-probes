# [file] coordinator-handoff-5nov-e.md (continued)


ROLES LIVE (all on this account, all from the restart)
- ROOT session_018BhcefwaVtx4V7dYW63amA (sweep trig_01Hvg2iQ6kzaZUvoF3LJNYww, :55).
- BOB session_018BhcecdJKXpFycvRBgqmS5.
- MERGER session_018BhceeZ4P42p7PhwvxNiVm. Clone unshallowed by hand 07:18; train restarts ~07:27:30 when its own lease lapses (see DEFECTS).
- Watcher session_018BhceeMjF6AwKvAHJwkQ1L (daily trig_01AvKAsQ3dLkB3pryqQ6C3Ji, 11:17).

STATE AT HANDOFF
- process3 tranche: 7ce6425 (PRs 145, 147, 146, and 148 merged 07:24: the train unshallows a shallow clone at start; 804/804; one cold review). Copy pin is still c4f2cae: move it to 7ce6425 with the next batch (this MERGER is already unshallowed, so it is not urgent).
- Copy: tranche e234b71, pin c4f2cae (PR 449), process-gate.yml job cap 90. Coordinator id in config names me (PR 448); probe too (PR 224).
- Live jobs at 07:19: 1/20 (control-plane restart on PR 290, release path). BOB is making the other replacement starts one at a time: journey-check 314, answer-envelope 386, interface-assets 443, member-roster 446, screens-daily 439, screens-settings 437, question-explorer 346, capture-requests, screens-wizards, case-checker (--reopen), plane (--fresh-branch, ruled 07:19).
- Release path: control-plane 290 and journey-check 314 need a gate on a branch that took in the tranche (a pull_request gate runs the head's process-gate.yml). Then round close for the first dev release (handoff b OPEN 2).
- Merge train: no land since 06:32 (Bob's stop, then the restart, then the shallow-clone stall). ~20 green job PRs queued. 406 noted by BOB, mergeable.
- Holds in force (BOB's draft marks; provider first): 420, 431 until 396; 441 until 423; 425, 432 until 430; 394 after 364. With the clone unshallowed the train's own provider hold works (429, 398 held on 422; 427 on 398); BOB drops a manual draft when the train holds it.
- Still Bob's: train study option C (speculative parallel gates, asked, no answer); words queue; lanes after LAN-1..10; allow rules (above).

DEFECTS FOUND TODAY (process3; none built except PR 148)
1. Role start check fails on any tranche move during the start (I caused it twice). Start roles only after the last queued tranche merge lands; a fix would re-anchor roles as job start does.
2. BOB counts live sessions by paging the account's whole history (1,843 sessions, ~5 min per wake).
3. BOB ran git in parallel in one shallow clone (review subagent deepen + notice triage + job start): "shallow file has changed", stale shallow.lock, no job started. Rulebook or tool: one git user per clone; reviewers in their own clones.
4. Train in a shallow clone: hold reads fail open and burn minutes. Fixed by PR 148 once pinned.
5. A killed train cannot retake its own session's lease until it lapses (~9 min lost 07:18-07:27).
6. After a train merge, the module's job branch holds the train's merged-result push, off the tranche; the next tranche-cut start cannot push (plane). Needs --fresh-branch by hand today.
7. Account switch: tasks, sessions and addresses are per account; ~40 reports to old sessions sit unanswered in status. A switch runbook would list: attach civicsmith first, setup check, then ids, roles, tasks, restarts.

MY MISTAKES TODAY (with cost)
- Started ROOT and the watcher before my own id merge moved the tranche, then BOB and the MERGER before my pin move did: four failed start checks, a few minutes each.
- Ran unchanged tests once after a failed edit chain (caught before push).
- Did copy and probe acts from a three-repository session, which raised Bob's permission dialogs.


# [file] coordinator-handoff-7nov.md

# Coordinator handoff, 7 Nov 2026 ~01:45 UTC (session_018BhcedK5yPyjY6UfMKmxzM)

Full log: notes/coordinator-findings-3-4nov.md (entries from 22:20 on 6 Nov). Problem-class register: notes/problem-classes.md (Bob, 7 Nov: find root causes so problem types tend to zero; every fix brief states root cause and class prevention). Bob's words are quoted there with times.

## Situation
- GitHub identity: believeinoakland (civicsmith suspended 6 Nov 19:19Z; Bob's support ticket open; Bob sent a short follow-up ~23:50Z). Every PR civicsmith opened is HIDDEN (404) and still holds its head branch: reopen work on <module>-2 via `job start --reopen`; tool reads of landed hidden PRs break (C13).
- BOB'S WORDS that bound this: 'BE CAREFUL. I don't want to lose access to this account too.' AND 'we need to constantly watch that we're not being overly cautious. Too much caution destroys protectivity.' Test every caution: what does it protect, what does it cost.
- Bob decided 8 job slots (copy pacing.jobs 8, pushes_per_hour 120 = PD-3, share_s 900). Recommendation given: keep 8, re-measure an hour after R17e is pinned.
- Bob waits for R17d+ pinned before applying the hook settings: send him the three complete files from notes/r17c-settings.md (process3 tranche) once R17e is pinned on the copy AND probes; then live-test (raw git push blocked, connector call counted) and run `p3 github audit`.

## In flight (in order)
1. process3 PR 211 R17e (C9 shares ride pushes, C10 one budget for every clone — copy clones were blind: same clone id 'vm', C12 cheap ledger reads). First ci red: rerun-more.test.mjs:339 compared two wall-clock readings (C14, came in with R17d); fixed at 52a7563 (injectable clock). Merge with `merge 211 --plain --rounds 2 --reviewed "..."` from a tranche worktree when ci is green. Re-subscribe (subscribe_pr_activity) first.
2. process3 PR 212 C13 (builder ef7TXuV, session_018Bhcef7TXuVjVZ4eN1SCzE): the layer gate covers a landed PR GitHub hides (land row + run artifact; pr_unreadable); head d334d38; cold review running, fixes to follow on the branch. URGENT: blocks `layer merge 9` (copy layer PR 735 gate red on pulls/696 404). Merge when green with the review in; the other landed-PR readers (receipts, --reopen, --take-in, prsFromBranch) follow as a separate PR. Re-subscribe first.
3. Then ONE pin move (after BOTH 211 and 212 merge) (copy + probes; `node tool/p3.mjs pin move ... --pin <tranche>` prints the session prompt; create_session with it) carrying R17d (1cbf056), R17e, C13. Probe pin to 46cf3f5 failed earlier (our ceiling); redo with this one.
4. BOB re-runs 735's gate; layer merge 9; layer open 10 and start its 3 jobs (monitoring, following, link-sweep; scheduler complete). Layer 11 (~60 modules) after R17e pinned and budget readable.
5. Builder ef7TXuV queue after C13, each its own PR via `node tool/p3.mjs github push`, I open PRs: C5 state-race (a6654bcb), C2 test git isolation (e85b1e66), C3 settings-admit (948d8d12), C11 test-only change + `layer clear` (bdd83b45), C8 unshallow, then R14 1b layer-prestart.
6. Builder ef1pxNY (session_018Bhcef1pxNYJCcaejqj138): after R17e, R16 switch-ready (held branch build/switch-ready).
- Push ceiling: TRUE rate was ~184/h at 01:0x (above the 6 Nov peak ~173). Keep PD-3 at 120; let the window drain after R17e pins. Read the budget only from a process3 clone until R17e is pinned (copy clones undercount).

- Problem classes added since the register was written: C8 unshallow (builder ef7TXuV, narrowing per its review), C9 bookkeeping as dominant traffic, C10 clone id collision, C11 test-only provider change, C12 fetch volume, C13 hidden landed PRs, C14 tests reading the wall clock twice. Add them to notes/problem-classes.md.

## Rules in force
- Jobs push only through their tool commands (layer publish, job sync, job complete); never retry a push a session's own permission check refused — restart.
- GitHub 5xx: wait 60 s, rerun once; stop only on repeated 5xx, rate-limit/abuse 403/429, or governor pause/stop.
- My notes: keep running notes in the scratchpad and commit + push once an hour via `node /home/user/p3-base/tool/p3.mjs github push origin start/coordinator-4nov` (the stop hook forces a push of any commit).
- Scheduled tasks: ROOT sweep trig_01HBGHt8e2s7qwtHsNoiphgs (enabled); my hourly trig_01BfrkZggFs5bCj8mdeJyo5Z (bound to this session: rebind to the successor).

## Layer state
- Layer 9: 13/13 complete; merge blocked only by C13. Layer 10: 4 modules. Lanes ux/publication told to push nothing until R17e; investigation lane idle/blocked since 17:44 6 Nov (unexamined).
- process3 merged this session: 205 R17, 206 R17b, 207 R8, 208 R17c, 209 stale-generated, 210 R17d. Copy pins: 709 (471e3cf), 710 (de5ea3a), 721 (a8a6252), 728 (46cf3f5).

## Open for Bob
- GitHub support reply.
- Settings files once R17e is pinned.
- Slot re-measure an hour after R17e is pinned.


# [file] coordinator-handoff-9nov-c.md

# Coordinator handoff, 9 Nov 2026 ~16:55Z (session_018BhceeXRALDRSHRWf5FYNw)

Previous: notes/coordinator-handoff-9nov-b.md. Log: notes/coordinator-findings-3-4nov.md (12:57Z on). Audit: notes/velocity-audit-9nov.md (read it first: Bob's rulings and the K/B items).

## Addresses
ROOT session_018Bhceg3m4o8qXzgi9JC4Ux (STOPS at its next wake: Bob changed the copy's approvals block ~16:45Z; Bob starts a new ROOT with the `start root` call BOB is printing for him). BOB session_018BhceeL7ktcpogArqPTSPB. Watcher session_018BhcefG1j3sNc5UxYXrgdK (stops too).
My tasks (rebind to yourself, then delete mine): hourly trig_014pGSG9SpN1hGVg2dvzW2De (:51), Phase 1 survival trig_01ULgj1VsSoBeUxf8cKvhQkf (16 Nov), Phase 2 trig_01LnNEeqEfWF6o6uN7ceowri (18 Nov), token expiry trig_012Hj2UeFnUG2CHbLQGfCgow (25 Oct 2027).
Live child: builder C61 session_018BhcecEW7KcWKVQ9jm6dS1 (PR 302). Builder C57 session_018BhcecdeeJCyGwdn8kd8ZX is watching PR 297 for Bob; archive it after 297 merges.

## Bob's direction today (quoted in the log, 14:00Z-16:30Z)
Velocity has stopped; subtraction first; no blind reruns; no safeguards without data; pin moves light, as needed, ganged; all ready jobs open at once; total module order, no layer holds; revert check per AUD-1 with a reviewed exemption (grant now in the copy's approvals); receipt removed entirely; GitHub usage limited only to published limits.

## Merged in process3 today (since 12:57Z)
C50 289, C53 292, C54 293 (PD-20 light triage), C55 294 (PD-19b), C58 295 (PD-22, -3,523 lines), C57 296 (PD-21, receipt removed, -903), C56 298 (PD-23 in-place layer pin, layer-land triage fix, PD-24), C60 300 (retired hook is a warning), C59 299 (PD-25 the direct flow). Copy pinned at 58f96824 (PR 1110, pin-91); layer/14 pinned in place.

## Open acts for you
1. PR 302 (C61: the layer gate needs no cover for paths equal to the base) is green on ci, but `record` (record-pr, pull_request_target) fails with startup_failure: a GitHub brownout of pull_request_target on public repos, until 18:00:00Z 9 Nov. Bob was asked to explicitly allow pull_request_target in process3's Actions event policy (GitHub will make the block default later). After it is allowed or after 18:00Z: edit the PR body to re-trigger record-pr, then `node tool/p3.mjs merge 302 --plain --rounds 1 --reviewed "..."`, then pin move the copy to the new tranche tip (the `pin move` prompt from the tool; add "for every open layer the choice is apply").
2. Then BOB: re-land credentials (PR 1113, attempt 4), layer merge 14, a config PR with merge_strategy "direct" + coordinator id, round next --apply under direct, start every ready job (`direct jobs`). Tell Bob when jobs run.
3. PR 297 (ci.yml: one Node, edit reuse, docs-only skip, duplicate record step removed): Bob merges it (merge tool refuses workflow changes). It needs record too: after the brownout.
4. ROOT restart: when BOB sends the `start root` call, give it to Bob verbatim with steps (new session in civicsmith-copy, branch tranche, paste as first message). The new ROOT re-records BOB and the coordinator.
5. Bundler F3: once ROOT is back, a reviewer session (not BOB, not the job) records `p3 revert exempt` under the new grant.
6. After direct runs: retire the layer machinery (C59's PR body lists it, about -1,500); decision records one file per record (stops DECISIONS.md conflicts); blocked-reason study (rulings awaited 33 and requirements cap 20 were the top BLOCKED reasons, 4-8 Nov).
