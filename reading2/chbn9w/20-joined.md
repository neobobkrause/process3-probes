# [file] coordinator-handoff-7nov-e.md (continued)


## Layer 11 (copy) — IN FLIGHT
Open 16:10Z. At 23:52Z: 50 complete, 2 deferred (queue-producers; journey-check), 16 not complete, 11 PRs open. It fell back from 62: landing instance-setup 948 and installer-steps rescheduled 14 consumers. Asked BOB (23:52Z) whether the retests are running, to land all remaining interface providers before retesting (one wave), and for an ETA. Layer 11 is the copy's LAST layer: `layer merge 11` closes the round and runs the internal walk, dev deploy and walk inline (C23). BOB runs it in the background and reports. Stop rule 27.6 h → about 19:45Z 8 Nov.
corpus-export: ruled (a): restart on the tranche after layer merge 11 (hold asked of BOB). store-assembly reopen (spread wholeExportOps) and op-grades confirm the rows first.
journey-check (1): installer regression (agent-worker dropped `runner` from /version), fixed in instance-setup F2 (948, landed or landing). (2) group-word scan: BOB routes what remains.

## Process3 today (merged; pins)
241 C24 (marks on sub-lines), 242 C23 Foundations sentence, 243 C25 (startable count agrees; alarm names jobs), 244 PD-7, 245 C26 (published job holds no slot), 246 C27 (no BOB wake on a BOB-less product), 247 PD-8. Pinned on copy and probes: e779f92 (C24), 8a0fabee (C25), f390ebe4 (C26). NOT yet pinned: C27 (6dd556ae) and PD-8 (docs only). Pin C27 with the next fix.

## Bob's decisions today (all recorded)
Q7 "as recommended", Q8 one term per concept → BD-16. Q9.1 → BD-17 (his principle "If it can't be proven, then it shouldn't be part of the conclusion"; marks only order exploration; a rival is ruled out only by a conclusion at the bar that names it; walkthrough v5 WCzdua7ccBB95KbtwGvatt "I like the walkthrough experience"; IV-H1..H3 placed as hypotheses F1, inquiry F2 for the next layer). IV-9 → PD-8 at his word that it is technical (parity rule; floor after first run under AD13, his unless delegated; ai-gate F4). Grade C → BD-18 (doctrine C stands; raw-bytes archive replay = B "via archive"; rewritten replay = C; acquisition F1; provenance reopens after layer 11).
Decisions page: https://claude.ai/artifact/UhokMjV6vDiqwGZHmowKrD (all settled).

## Bob still owes
1. Investigation canon amendments (BD-16): https://claude.ai/artifact/THyuxTMAiQHUSo6rDLYVX4 (the "problem" into "question" judgment).
2. Grade C canon amendments (BD-18): https://claude.ai/artifact/8Jm355VxBXBjJJRtAYcrNq.
On his approval, BOB has the amendments placed.

## Coordinator decisions today
PD-7 (a published job holds no slot), PD-8 (IV-9 parity rule). Rulings: corpus-export (store-assembly + op-grades first, then (a) restart on the tranche after layer merge 11); a fresh watcher after the ROOT takeover.

## Merge practice
As in 7nov-d: from /home/user/p3-base merge the head with the tranche, run the suite, then `node tool/p3.mjs merge <n> --plain --rounds <r> --reviewed "..."`. Mark a draft ready first. Pin: `pin move neobobkrause/<repo> --report <me> --why ... --pin <sha>` prints a prompt; create_session with it (title, source_url, revision tranche, depth 1).


# [file] coordinator-handoff-7nov-c-switch.md

# Coordinator handoff for the NEW account, 7 Nov 2026 ~05:35Z (session_018Bhcefb8RbwzBi1TvvFVgT, old account)

Bob's words (7 Nov): "Please start the process of shutting down development in this account so that the development process can be restarted in a different account."
Runbook: rulebooks/account-switch.md on process3's tranche. Section 1 (switch out) is DONE on the old account. Sections 2 (Bob) and 3 (switch in) follow.

## Done on the old account (switch out)
- Manifests: copy process-state switch/manifest.json at 72a5c7ba2d (6 tasks, 3 live jobs, 211 unanswered messages, layer 10 open); probes at 2dd466c962 (no live jobs, no addresses).
- Stop acts sent, in order:
  - jobs ai-catalogue, op-capabilities and inquiry;
  - tasks switched off, never deleted: Phase 1/2 survival reads, coordinator hourly, ROOT sweep, watcher. Bob's alpha-pipeline-runner is not the process and was left as it is;
  - lanes investigation, publication and ux;
  - BOB, ROOT and the watcher.
- Copy pin move to f6a9846: my STOP arrived after its push. Copy PR 761 (p3/pin-f6a9846db1, e4bbb2fe62) is OPEN and unmerged; no wake was sent. The new account reuses it or closes it in favour of a pin carrying C19/C20/R17g. The copy is still pinned at 19fe9dd.
- Lanes: ux pushed (lane/ux cb138ca4b7, draft PR 762, open-work list in docs/development/ux-substrate-research/open-work-2026-11-07.md). Investigation's handoff 17908ea60 (open-asks A1–A10) was held by the old 120 ceiling; I told it to push with the tranche config. Check lane/investigation for it. If it's missing, the asks are in the artifacts THTtouNJzkhmHqyR4Pfa4g and UgRF58WWCfuDu88ztaKNbL. Publication pushed (lane/publication b82aa884, PR 764 lane-only: open-asks.md). BOB reported switch-out complete at 05:38Z. Job op-capabilities pushed at 3a67501a07. The probes are at f6a9846 (PR 239).
- Builders ef7TXuV (C19/C20, append-only-state) and ef1pxNY (R17g, C18) were told to push and write notes/builder-handoff-ef7.md / -ef1.md on their branches. Heads are below once they report.
- Builder ef7TXuV (handoff notes/builder-handoff-ef7.md on build/settings-credit 1ef83293):
  - append-only-state is PR 232 (2ad2a86b, 1117/1117, cold-reviewed): merge it.
  - R17g is on build/limits-only-github e55bcd4c. ef7 started it before the reassignment; the full suite and the cold audit were unfinished and there is no PR. The brake table is in the handoff. Reconcile it with ef1pxNY's R17g branch, if that builder pushed one.
  - C19 and C20 are not started; next steps are in the note.
- Investigation lane: pushed. lane/investigation is at 17908ea60a, with draft PR 763. Its open asks A1–A10 are safe.

## State at shutdown
- process3 tranche: 372438c (C17 PR 230, C16 PR 229, PD-5/PD-6 PR 231 merged).
- Copy: layer 10 complete (4/4 landed). Layer PR 759 blocked by the record-check settings finding: C19 credits a settings change that a merge carries from an owner's commit already on tranche. PR 752 op-capabilities is parked for layer 11. Config PR 760 merged (pushes_per_hour 1000000, coordinator = the old coordinator's id, to be reset).
- Bob's holds and decisions:
  - No layer 11 open until Bob says (account switch).
  - Q9 recorded as BD-14 (copy PR 758). Q9.1 fallback "rules-out marks only"; UX check "Q9.1 only".
  - Walkthrough https://claude.ai/artifact/WCzdua7ccBB95KbtwGvatt is waiting on Bob's B-vs-fallback call.
  - IV-9 contrary-recall bar is owed by Bob (the lane recommends 0.8 / gap ≤0.1).
- PD-6 (Bob: "baseless overcaution NEVER"): only GitHub's published limits (at 85%) or GitHub's actual refusals brake. Pushes are counted, never refused. R17g implements it (builder ef1pxNY). Until it is pinned, configs set pushes_per_hour 1000000. Process3 clones still default to 120: merge R17g first.

## New account: first acts, in order
1. Bob's section 2: connect GitHub as the collaborator, install the GitHub App on the three repos, recreate environment BioDefault with its Cloudflare secret, share the claude.ai documents, approvals if their wording needs it.
2. `switch in --sessions <file> --by <new id>` on the copy and the probes (section 3). Then its acts (a)–(h), EXCEPT that layer 11 stays shut until Bob lifts his hold.
3. Builders: restart from their handoff notes. Priority: C19 (unblocks layer merge 10), C20, R17g, then append-only-state, then C18.
4. One pin move (copy + probes) carrying C17, C19, C20 and R17g. Then BOB re-runs the PR 759 gate and `layer merge 10`.
5. Recreate the coordinator's tasks: hourly (:51, with the PD-3 line replaced by PD-6), Phase 1 survival read (16 Nov 17:00Z), Phase 2 (18 Nov 17:00Z).
6. Bob archives the old account's sessions and deletes its switched-off tasks once the new ones run.

## R17g cold audit (build/limits-only-github e55bcd4c), relayed by ef7TXuV at 05:36Z
Full suite 1114/1114 at e55bcd4c (finished after shutdown). Core is correct: pace.test 20/20; 524 pushes an hour pass with no wait; budgetGate admits at any push count; published limits and GitHub's pause and stop still brake. Fix before merging:
1. Med: limitSignal misses a bare `gh: HTTP 429` (no message or URL). Treat any 429 from gh as GitHub's unless it names a proxy, and add a test.
2. Med, pre-existing: git push `RPC failed; HTTP 429` matches SERVER_ERROR (util.mjs ~610), so pushRetry and ghshare's ledger write retry at 1/2/4/8 s inside GitHub's refusal. Route push stderr through limitSignal to a pause, and take 429/403 out of SERVER_ERROR.
3. Low: an old config's poll_most_s 300 brings the 5-min back-off back; retire it. merge.mjs transientPause's TRANSIENT pattern matches proxy 429s and "rate limit".
4. Low: reword POLL_FLOOR_S and `--every >= 30` (p3.mjs ~146) as poll cadence, not GitHub pacing.
5. Low: stale text (merge.mjs:70, layerflow.mjs ~962, p3.mjs:144/530, pace.mjs:86/344, notes/github-pacing.md:44,48). Dead code: lane.mjs laneCap (~393-399), util.mjs lower/from (~470).
6. Info: `gh api graphql -F query=@file` holding a mutation is counted as a read. Notes are not spaced (GitHub's 1-s write guidance).

## Builder ef1pxNY at shutdown (05:45Z)
- Handoff notes/builder-handoff-ef1.md on build/github-no-overcaution 796b2b60 (brief only). R17g itself is ef7's build/limits-only-github e55bcd4c, above: use that one.
- C18 is on build/read-no-push 08105d31. DO NOT MERGE AS IS: the cold review found 6 bugs (double push after replay or concurrency, a lost waiting record on an unlocked rewrite, an unlocked state-ref move, idle-check alarms from every session, usage shares no longer reaching other clones). Fixes are in notes/builder-handoff-ef1.md on build/github-no-overcaution d16ea49c. The caching half is sound. `status --role bob` warm: 21 requests (from 357), 144 s (from 399).
- C16 is merged (PR 229). C15's build/sweep-permission 0be0b850 is an old branch (C15 merged as PR 219); drop it unless its handoff says otherwise.
- New PRs carrying the claude.ai documents into git: process3 233 (governing/: Foundations and Ledger map), copy 765 (Q9 paper and BD-14 requirements), copy 766 (Q9.1 walkthrough HTML). Merge any still open.


# [file] coordinator-handoff-5nov-b.md

Process3 coordinator handoff, 5 Nov (b), from session_01RAN5ekK8nutcUSV3rTsfxn. Bob is the owner; his words are instructions. You are the Process3 coordinator. Bob defines requirements; you decide everything technical and never bring him technical choices. Plain words, no em-dashes. Every finding with times: notes/coordinator-findings-3-4nov.md (read from "# 5 Nov, coordinator session_01RAN5ekK8nutcUSV3rTsfxn" down). Read notes/coordinator-handoff-5nov.md's COORDINATOR RULES ON SPEED and its added lines: they bind you.

START, in order:
1. Record your id as `coordinator` in process/config.json on the copy's and the probe's tranche, each by a short session (copy PR 341 and probe PR 221 are the pattern: merge with `--plain --no-review "one-field coordinator id change"`; tranche only, never main, never force-push).
2. Move my scheduled tasks to yourself (get_trigger, create the same prompt bound to you, delete mine): trig_01WBadBUrZQcUg1R4FAoyLzg (16 Nov Phase 1 survival read), trig_01DyYeP535c2Re5DnyjZ5SZo (18 Nov Phase 2 survival read), trig_0184DpPd8aFiFWGQ29G2vwP3 (5 Nov 19:00 review-trigger check), trig_014xnuA1o4AqdnUiWWudxgJx (hourly flow check, cron; recreate hourly), trig_01PjMXPQHKt4e3pc5T9JVyY3 (6 Nov 04:50 merge-train trial report).
3. Adopt my open child: build/start-anchor session_01RAN5eobMSjCJEoW5q294U4 (see OPEN 1); tell it your id. The MERGER (session_01RAN5ep7bdABTc1Cuxosa4J) is ROOT's, not a child: tell it your id too.
4. Tell BOB (session_01RAN5eomXNvM23EMwtLVBHG) and ROOT (session_01RAN5emK1snYonbEbVPHbAP) your id. Archive me.
5. Check your context at every check-in; hand over at 60%.
