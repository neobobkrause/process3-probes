# [file] draft-approvals-biosmoke-8nov.md (continued)


Bob in session, 8 Nov: "The biosmoke8 install (indeed, any biosmokeN release) is for development testing purposes only. The deployment and any data captured or generated during testing with by deleting when testing is completed."
Answer the same day: releases are walked on biosmokeN; Bob amends CLAUDE.md.

The same approvals block is in three repositories (process3, civicsmith-copy, process3-probes). Make both edits in each.

## Edit 1: the protected list

Replace:
> except those this paragraph forbids changing below (today the Workers biosmoke8, plat-s1, agent-runner, agent-runner-plat-s1, agent-worker, agent-worker-plat-s1, file-scanner, ocr-worker, pdf-worker, pdf-worker-plat-s1 and sheet-worker, the R2 buckets bio-captures, bio-published, bio-captures-plat-s1, bio-published-plat-s1 and bio-walks, and the Durable Objects and container applications those Workers define)

with:
> except those this paragraph forbids changing below (today the Workers plat-s1, agent-runner-plat-s1, agent-worker-plat-s1 and pdf-worker-plat-s1, the R2 buckets bio-captures-plat-s1, bio-published-plat-s1 and bio-walks, and the Durable Objects and container applications those Workers define). Any Worker named biosmoke followed by a number is a development deployment, for testing releases only, together with the Workers it binds (today agent-runner, agent-worker, file-scanner, ocr-worker, pdf-worker and sheet-worker) and the R2 buckets bio-captures and bio-published; sessions may install and upgrade a release in it, walk it, and delete it and all data captured or generated in testing once testing is complete

Checked 8 Nov: plat-s1 binds only its own -plat-s1 Workers and buckets, and agent-worker's PLANE binding is biosmoke8. So the generic fleet serves biosmoke alone. bio-walks stays protected; say if it should move.

## Edit 2: deleting a test deployment that holds secrets

Replace:
> never deleting a secret that neither the session nor a p3dev- install it ran set, or a resource that holds one

with:
> never deleting a secret that neither the session nor a p3dev- install a process session ran set, or a resource that holds one, except that a development deployment named p3dev- or biosmoke followed by a number may be deleted whole, its secrets with it, once its testing is complete

Why: round 1's stacks p3dev-l1, p3dev-l3 and p3dev-t1 each hold an ADMIN_TOKEN that an earlier session's walk setup generated. Read literally, the current text forbids any later session from deleting them, and the rest of each stack is bound to those Workers. biosmoke8 holds secrets set by the installer (ACCOUNT_SEAL_SECRET, ADMIN_TOKEN, DAEMON_TOKEN, PROBE_TOKEN, CIVICSMITH_TEST_INSTANCE).

Unchanged: newgroup, civicsmith-site, DNS, domains and routes, the account's settings, the no-reveal rule, never reading or printing a secret's value, and plat-s1's set.

After you commit it: the coordinator deletes p3dev-l1, p3dev-l3 and p3dev-t1, and a builder wires `deploy release` to install each cut release into biosmokeN and walk it.


# [file] coordinator-handoff-4nov.md

Process3 coordinator handoff, 4 Nov about 00:25 UTC, from session_01RAN5ek9qx8mduYhfE77Ldc (refreshed on Bob's word at 60% context). Bob is the owner; his words are instructions. You are BOB, the Process3 coordinator; Bob defines, you decide everything technical (P17). Bring Bob only acts only he can take, as one list, and only what passes the test in Build Plan rule 9 (his categories, his approvals or accounts, an act only he can take); restating a Ledger line's mechanism with its purpose kept is yours, and precedent is no reason to ask (Bob, 4 Nov). Plain words, no em-dashes.
PRIORITIES. Process3 development is the priority; civicsmith-copy is throwaway and exists to test process3. Bob, 3 Nov: as fast and as safely as possible; Process3 must be ready for Civicsmith development soon; don't be sloppy, don't be so cautious it takes days. Everything released in this work is development only; there is no public release (Bob, 3 Nov ~23:08). Fix by rewriting the line a thing belongs to. Measure once. Run independent builds in parallel; each merges the tranche into its branch before merging.
START. On neobobkrause/process3, branch start/coordinator-4nov at tranche d79308e plus this note. First: `git fetch origin tranche` and say whether origin/tranche moved past d79308e (builds below may have merged). Read this note and notes/coordinator-findings-3-4nov.md beside it (every measured finding of 3-4 Nov). Open the Build Plan (claude.ai doc cccf8cb8-a719-4f73-96f2-9ab0e2aaa897, Phase 3 section; export to a file, never inline), the Foundations (https://claude.ai/artifact/QSPaAnz5ReEiw8ae97nsZR) and the walk-through (231c545f-57d9-4126-95da-ab1c71054bcf) only when a step needs a line.
GUARD RAILS. Attach no other repository. Copy or probe work goes through ROOT, BOB, or a short session started in that repository from its tranche with clone_depth 1. Refusals word for word, never reworded or rerouted; two in a row, pause judged acts. Only Bob changes CLAUDE.md approvals, settings and .claude/. Merges only through the tool. One judged act per command. No session starts its own successor. Rule 5: a change to the gate, record check, approvals check or merge tool gets a second, confirming review (PR 57 found a path traversal that way).
FIRST WORK.
1. Record your id as `coordinator` in process/config.json of the copy and the probe, each by a short session (as copy PR 41 and probe PR 215 did). Move these scheduled tasks to yourself (create the same prompt bound to you, then delete mine): trig_014QyfFhBeaaM5GdCN88jjQF (01:05 UTC check-in, stopped-job fault), trig_01X22gz9EoQgLdjwK3UBFt4f (04:10 UTC: fire the watcher, silent-ROOT fault), trig_01BPagmf1cnKowXEZpjfvrE9 (16 Nov 17:00 survival read). Then archive session_01RAN5ek9qx8mduYhfE77Ldc.
2. Sessions reporting to my id: tell each your id by send_message. Copy pin move to d79308e (session_01RAN5en1PFxJWAaCa3LL1ir: setup check --at HEAD before merge, release block if the unsigned build writes files; told not to run the printed wake). Process3 builds: UX lane and completion round file (session_01RAN5ekrJXgxvkgZJ2AY5Ni), onboarding size and release note fields (session_01RAN5ekNP1PX8Lh2E9qVvrW). When the builds merge, move the copy's pin once more by a short session with `setup check --at HEAD`.
3. Live on the copy: ROOT session_01RAN5eoLwXYE4bHDP3xJr9G, BOB session_01RAN5encoEVihASNRBVBYKE (context ~30%, started with blob_limit_kb 1024 before PR 43; leave it), watcher session_01RAN5ejatoMxXYS7DSiFHuj with daily task trig_01YBk7KVsZ1o1ozWs6Z4mZMn (11:17 UTC). Layer 1: doc-clean, file-scanner, format-registry merged (copy PRs 36, 37, 39); jurisdictions complete, PR 40 merging; runtime-limits BLOCKED on unrecorded measure M-R7 (deferred: BOB closes PR 38 unmerged, then layer close). BOB was told (via ROOT) to run tranche open (12 acts), close layer 1, start layer 2. Copy pin was b226aed at copy PR 50.
4. Faults in flight (Phase 2 gate). Silent ROOT: ROOT's sweep task was deleted 00:05 (last run 23:59:30); at 04:10 fire the watcher's own task by hand (heartbeat over 4 h), then read whether it took over as ROOT, made its sweep and told Bob. Stopped job: the first try (interrupt on jurisdictions 22:31) was rescued by BOB's message, not a replacement; at 01:05 archive one layer-2 job session that has pushed nothing (tell no one); the new ROOT's sweep or BOB's status should flag it after 2 h and BOB restart it with job start --restart. Then silent BOB: after the new ROOT's first wake of BOB, interrupt BOB; the sweep should hand over two hours later. Relay to BOB only through ROOT (BOB takes instructions from ROOT's address); keep ROOT quiet until the watcher fire.
5. Deploy and walk: held until layer 1 closes. Then BOB runs it from a local worktree of copy PR 47's branch (p3dev/deploy-route, guarded p3dev names, never merged as is: it edits a workflow) merged with the tranche tip, with the proxy's Cloudflare credential (dummy CLOUDFLARE_API_TOKEN), dry run first (every step 'p3dev guard: passed'), then deploy, then `node bio-plane/scripts/p3dev-walk-setup.mjs p3dev-l1 --walk`; findings enter as found-work entries. Later: BOB takes PR 47 in as a bundler job with --take-in (workflow edit dropped), then the copy's `deploy` block lets `p3 deploy dev` run (process3 PR 59).
6. Then Phase 3 by running it: layer 2 onward with the requirements cap (11 copy files over 70000 bytes need splits), a provider notice if one arises, the first development release (`p3 release dev`, draft only), one stateless BOB wake measured (SES-16), tranche close to main, `p3 report tranche`. Write the Phase 2 gate and Bob's 3 Nov word on development-only releases into the Build Plan when the gate's measurements are in.
PROCESS3 MERGED 3-4 Nov (tranche d79308e): PRs 44 to 61 (owed fixes, sweep stall by push, requirements ownership, metrics, layer close, tranche report, tranche open/close, blocked deferred, dev release, requirements cap, provider route, take-in, product shims, notice confirm, rulebooks, deploy act, --at HEAD and one archive, prompt caps). Tool 4,543+ lines; every rise cited.
FOR BOB: nothing open. The probe holds his test signing key (P3_PROBE_TEST_SIGNING_KEY, verified, run 41735339840); his owner token was not needed.
UPDATE 00:26. Copy pin move to d79308e merged (copy PR 51, 3ef8062; checked with setup check --at HEAD, all set). Drop that session from item 2. Release block still out: the copy's build (`node bio-plane/scripts/bundles.mjs`) rebuilds stale bundles in place across eight member dist directories and writes no single output directory; a dev release needs a small product script that gathers the members' dist outputs into one directory (product work for a job, e.g. the bundler module, alongside the PR 47 take-in). Measured: agent-worker and bio-plane bundles are stale on the copy's tranche. Status at 00:25: tranche open line gone (passed or not shown: check), jurisdictions PR 40 gate failure (BOB is on it: revert-check exemption), runtime-limits BLOCKED.


# [file] coordinator-handoff-5nov-e.md

Process3 coordinator handoff, 5 Nov (e), ~07:25 UTC, from session_018BhcecFLE3NZJnVDC127ku (Bob's account "Sparky", GitHub as civicsmith). Bob is the owner; his words are instructions. Read with notes/coordinator-handoff-5nov-b.md (rules, Bob's words), the speed rules in notes/coordinator-handoff-5nov.md, and notes/coordinator-findings-3-4nov.md from "# 5 Nov, coordinator session_018BhcecFLE3NZJnVDC127ku" down.

WHY THIS HANDOFF
- Bob saw permission dialogs all through this session. Cause, as far as known: this coordinator had three repositories attached (process3, the copy, the probe) and did outward acts itself (session starts, task creates and deletes, pushes and merges into the copy and the probe). Auto mode stops on those. A one-repository session also reads the repository's committed .claude/settings.json; a three-repository session does not.
- So: the new coordinator runs with ONLY process3 attached. It does not attach the copy or the probe. Copy and probe acts go through the roles (BOB merges and starts jobs, ROOT starts roles) and through short sessions started on that repository (coordinator id, pin moves), as the process was built. Bob was offered, and has not yet answered, allow rules in process3's .claude/settings.json for the coordinator's routine acts (his standing approvals forbid sessions to change permission settings without him).
- Ask Bob which session titles show dialogs. If BOB, the MERGER or job sessions show them too, the cause is wider: look before changing anything.

START, in order
1. Record your id as `coordinator` in process/config.json on the copy's and the probe's tranche, each by a SHORT SESSION started on that repository (source_url the repo, clone_depth 1, from tranche): its prompt edits the one field on a branch p3/coordinator-<x>, opens a PR into tranche, runs `node .process/tool/p3.mjs merge <pr> --plain --no-review "one-field coordinator id change"` and reports back. Copy PR 448 and probe PR 224 are the pattern.
2. Move my scheduled tasks to yourself (list_triggers; create the same prompt bound to you; delete mine): hourly flow trig_01K1C44kP7orMgaFwUEeXLoM (:51), review-trigger check trig_01TYsmhr38k7MdTote3hm7Z7 (5 Nov 19:00), merge-train report trig_0117LM8PADy3UZh1V162srvV (6 Nov 04:50), survival reads trig_01MX1uVwo4NPdwNFNRHrRMYk (16 Nov 17:00), trig_01VhfvTC7zXsJdwAQoSZdxBr (18 Nov 17:00). Delete my check-in trig_01AkGDwHoJeV1jKYJoJomeCg if it has not fired.
3. Tell ROOT, BOB and the MERGER your id once config names you. Archive me.

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


At Corrie the clerk wrote down 12 limes.

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


# [file] bob_words_17nov_compaction_avoidance.md

# Owner direction: preventing Codex context-fidelity failures (17 November 2026)

**Status:** Exact owner wording followed by separately identified assistant analysis. Later, more specific clarification supersedes the older assumption that a verified one-million-token context window is the fundamental acceptance condition. No governing Process4 definition or Claude Code implementation is changed by preserving these words.

## Direct owner statement — verbatim

> Process4 is architected around the reality that every all software, even AIs, have shortcomings that must be mitigated. Whereas I often see software trying to "recover" from shortcomings, I find that the most effective means of mitigation is to avoid situations when the shortcomings become a factor. But a fundamental requirement of this approach is to identify (or sense), either at runtime or when coding, when the shortcoming is about to come into play. If a Codex-based process4 is even a possibility requires that we be able to avoid compaction entirely, because any work that happens after an unrecognized compaction could cause (silent) damage that difficult/impossible to recover from.
>
> In that light, process4 sessions don't require 1m tokens. What they require is sufficient token to perform enough useful - and correct! - work to justify the investment of time and tokens, all while protecting development from damage caused by things like document scanning, compaction, and other context management shortcomings. That is our challenge.
>
> This research confirms process4's policy of refreshing sessions when the context window exceeds 40% or more. What we need to do rigorously while we're exploring a Codex-based process4 version is identify those conditions and limits that will provide the assurances we need to productive work at a reasonable investment of time and tokens.
>
> We should set up a test to confirm those aspects of Codex related to contexts that we don't yet have, like our ability to obtain larger context windows upon request, etc.

## Assistant's implementation reading — not owner words

- The earlier absolute >=1,000,000-token requirement is superseded by a **sufficient verified context for useful, correct work**, with robust avoidance of unrecognized compaction and incomplete reading.
- **No production-authoritative work may knowingly continue after compaction or when the system cannot reliably tell whether its refresh-before-compaction operating discipline holds.** How this is enforceable with limited native hosted telemetry is a critical research question, not already solved.
- A 40% context threshold is the confirmed conservative refresh policy/direction from the owner's text; investigate role-specific early checkpoint lead time and whether 40% of a measured resolved window guarantees time to complete a bounded handoff before any compaction trigger. Never infer percent from cumulative billing tokens.
- Session replacement does not absolve the need for complete canonical reading, source version checks, and protection against truncated tool outputs.
- Efficiency is an explicit criterion: useful/correct work completed, source/decision compliance, session setup/refresh overhead, model/tool usage and ongoing state growth. A huge window with unknown telemetry is not automatically better.
- The first experiment should use disposable, source-grounded fixtures; it should determine supported context selection and runtime receipts across subscription-authenticated CLI and **native hosted child** surfaces without pretending those are the same thing.
- Continue only within subscription-funded tools and existing grants. Do not silently force compaction in any session holding authoritative product state, and do not modify CivicSmith2.


# [file] bob_words_17nov_codex_context.md

# Owner direction: Codex Process4 context fidelity (17 November 2026)

**Status:** Verbatim owner direction from conversation, not an adopted rewrite of the sixth draft. This material is authoritative as the owner's words for the Codex context-fidelity investigation. It does not modify the existing Claude Code implementation, grants or Process4 adoption status.

## Owner's direct statement (verbatim)

> Given the documented context windows sizes, process4 should be designed and always run in GPT-6 or later models having context windows of 1m tokens or more.
>
> My Claude experience confirms that incomplete reading (scanning) to be a very significant danger that must be mitigated. The OpenAI limits and capacities you're describing are similar in scale to Claude's. As I've already mentioned, process4 has constructs meant to mitigate these and other context related dangers. So it's essential that Codex-based process4 utilize these process4 constructs.
>
> What I found in Claude, and is probably the case in ChatGPT, is that there's no reliable means of controlling the conditions that degrade context fidelity. As such, process4 defines specific limits on things like session handoff document sizes, session refresh requirements that rigorously eleminate the need for compaction, limits on the size and complexity of process4's principals of operation, the use of highly targeted and structured subagents to do research and complete tasks for the benefit of parents without clogging the parents' context window, and so on.
>
> I'm open to the addition of a canon authority map. The model must not mistake a local implementation decision for permission to violate a higher-level principle.
>
> I agree with your recommendation of using options A and C, along with other tactics already inherent in the process4 design like its session refresh strategy and others. It's worth mentioning that the charters of subagents often focuses on reading large document sets, but these workers are also sometimes tasked with making material decisions based on information they gather.
>
> I agree that a dedicated Process4 experiment should be run in a dedicated context-fidelity research session, separate from the ongoing development bootstrap, with a bounded experimental mandate, as you describe. I've started that session.
>
> I also agree that it's not necessarily the case that Codex needs exactly the same context rules as Claude. We need to investigate and fully consider the Codex environment as unique from that of Claude and develop a load-bearing understanding and strategy for it.

## Source pointers (not substitutes for reading)

- Process4 definition (sixth **draft**, not in force): `process4/definition/process4_definition_v6.md` in this repository's `process4` branch.
- Owner's earlier words and evidence: `process4/owner_words/`, `process4/evidence/` in this branch.
- Process principles and historical reading/refresh rules: `neobobkrause/neoprocess`, `PROCESS-DESIGN.md` and `SESSIONS.md`, branch `main`.
- Product canon registry (read-only): `believeinoakland/civicsmith2`, branch `tranche`, `requirements/README.md`.
- A separate ChatGPT-produced research report has been generated in the originating conversation as `process4_context_fidelity_research.md`. It was **not** automatically attached to the independent research session or committed with this owner-direction file. Treat its conclusions as research groundwork, not owner rulings.

## Preservation boundary

This captures only the verbatim owner message above, not all conversations or unpublished research. Additional owner decisions, implementation outcomes, and validation should be recorded separately with clear provenance. No authority to modify CivicSmith2 or the Claude Code implementation is implied.


# [file] coordinator-handoff-6nov.md

# Coordinator handoff, 6 Nov 2026 06:55 UTC (session_018BhcefjWx4gCEPSaQ6JGxj)

Read the last entries of notes/coordinator-findings-3-4nov.md for the full log.

## Where things stand
- civicsmith-copy: LAYER 6 CLOSED at tranche 710b475d97 (05:56). PRODUCT WORK PAUSED. Holds hold-18..22 (layers 7-11), hold-23 (ai-catalogue F4) and hold-24 (inquiry R31) stand. The MERGER's starter has been OFF since 05:39; nothing starts unless BOB starts it. Green layer 11 PRs 452, 507, 513 and 504 are drafts until after the pause.
- process3 merged so far: 183 (layer branch, 48d42ed) and 185 (AUD-1/2/7, 491a48d).
- Still to merge, in order, each brought up to tranche by its builder and green before the merge tool runs (`node tool/p3.mjs merge <n> --plain --reviewed "<what>" --rounds <n>` from a process3 tranche checkout; mark ready first):
  1. 186: mechanical pass `--pass` (P7) + job push refusal of dist/ and oversized files + lane-only plain merge. Builder session_018BhcedugabJDoZULNK5PfY; 1 cold review, accepted.
  2. 187: status red gates first (same builder); 1 cold review, accepted.
  3. 181: triage lanes (AUD-8/9). Builder session_018BhcecgGurDZDMke441V16 (told done; may need a new session to merge tranche in); 1 cold review, accepted.
  4. 184: citations (AUD-4/5, DECISIONS.md PD-1/PD-2). Builder session_018BhcecWQagoxMhBKuRBBxq; text only, accepted.
  - 188 (ci timeout 10 -> 20): the merge tool refuses a workflow change without Bob's word. Asked Bob at 06:47; merge it only on his "yes". ci runs 9m46-9m51 of a 10-min cap; re-run once if a run is cancelled at the cap.
- Then: copy pin move to the new process3 tranche with merge_strategy "layer" (a pin-move session as before). Then BOB runs the dist pass as one `--pass` PR: bob-257's survey plus container-images.yml build-image.mjs; keep bio-plane/dist/SECRETS.txt; leave release/ (44 MB) for later. Then lift hold-18 and open layer 7 as the SLB-10 trial. Keep the MERGER and starter off (SLB-8). Brief layer 11 with the reschedule check (460 -> 430 + store-assembly; ai-catalogue F4; op-declarations ACT_HELP for ai-use's ops).
- Layer 6 baseline (05:10 entry): 27.6 h open to last merge; 11.8 gate runs per module (max 27); 2.9 starts per module; green-to-merged median 386 min. Trial stop rule: layer 7 slower to close than 27.6 h.
- Bob's Keep and Drop answers are all in (6 Nov 00:27-00:30). The Foundations, Ledger map and Ledger doc are updated, and my rulings are cited as the coordinator's. The Build Plan is not on this account.
- Sessions to keep: build/layer-branch session_018BhcecugKLxZHVRfKX4bo7 (until the pin move lands; tell ROOT when it can go); audit 2 session_018Bhced5SCACwF5S3dkLLft (Bob may return to it).
- My tasks (move to yourself): hourly flow trig_01XLmuM6ofCn78C3gtUQ1733 (:51); survival reads trig_016pnkXpxg1P6RzpSNGM4EbP (16 Nov), trig_018MZu9XWhc33Yg2LRFkyaH9 (18 Nov). The baseline task has fired. I'm watching process3 PR 188.

## Open for Bob
- "Yes" to PR 188 (ci timeout).
- Assistant sign-in conflict (T53 retires /signin; agent-runner R109/R35 contradict agent-worker F5): still deferred by Bob; BOB holds the decision entry.

## Lessons
- Check the merge tool's own refusals before planning a route (workflow files, lane folders, module files).
- A deferral is not a hold: the starter reopens deferred found marks. Record a hold too.


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
2. DONE 19:00Z: p3dev-l1, -l3 and -t1 deleted (24 Workers, 12 apps, 6 buckets); p3dev-l11 kept.
3. Release walk on biosmokeN: once the copy pin carries C39, a builder wires `deploy release <version>` to install the cut, signed release into biosmokeN and walk it. Evidence: the installer is newgroup/ (wrangler deploy; the build embeds the signed release checked against RELEASE.json); the site is site/ (worker civicsmith-site, custom domains civicsmith.org and www.civicsmith.org, INSTALLER_ADDRESS points at newgroup's workers.dev). Cloudflare shows only wrangler deploys from Bob's account, last 27 Oct. The token was verified 8 Nov: R2, a Worker with a DO migration, R2 and browser bindings, cron, workers.dev and delete all ok; D1 and KV are refused (unused).
4. Tranche-end workflows: installer-update and site-update in the copy, behind the protected `release` environment (Bob: "Process, on my approval"). Proposed to Bob as round-2 found marks. Ask him for the go, the scoped Cloudflare deploy token in that environment (his to add), and whether the site is civicsmith.org or civicsmith.dev (Cloudflare shows only .org).
5. Layer 12: plane 1066 and journey-check 999 were left at 18:01Z. When both land: layer merge 12, then the round-close run, then the findings as found marks (DEC-340 covers 518 -> 96 at journey-check's local walk), then round 2 under C39.
7. Watcher: none live. addresses/watcher.json names an archived session; ROOT starts a watcher only when none is addressed. Fix by tool change (an archived address reads as none) or a re-record.
6. Hourly check as before. The 18:53Z audit showed a process3 push gap of 5 (likely C40's split ledger; re-audit with both ledgers after C40 merges). For copy state, read with git from a clone, or ask BOB; never act on a product from your own session.

## Merge practice
As 8nov-c: a process3 worktree at the tranche; merge the head onto the tranche and run the suite (HOME=$(mktemp -d) GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_NOSYSTEM=1 node --test 'tool/test/*.test.mjs'); mark ready; `node tool/p3.mjs merge <n> --plain --rounds 1 --reviewed "..."` (timeout 1200 s). Pins: `pin move neobobkrause/<repo> --report <me> --why ... --pin <sha>`, then create_session with its JSON, then archive each when it reports.


# [file] bob-workflow-diffs-4nov.md

# Bob's act 4: two workflow changes for the copy's first tranche close (4 Nov 07:00)

The first close of neobobkrause/civicsmith-copy (tranche into main) is refused by the merge tool until these two diffs reach main. They are workflow changes, so only Bob can approve them. Route, recommended: commit them to the copy's main through GitHub's website, after which the close merges through the tool. The alternative is for Bob to merge the first close himself.

Note: container-images.yml publishes to GHCR and Docker Hub. The first diff adds a new published image, reader-container.

Commits on the tranche: container-images.yml fd9fe9a0ac (K5646, reader-container's matrix row), carried in 740d8f562f; regression.yml 7bd724f2f5 (ONB-6, the site's browser test).

```diff
diff --git a/.github/workflows/container-images.yml b/.github/workflows/container-images.yml
--- a/.github/workflows/container-images.yml
+++ b/.github/workflows/container-images.yml
@@ -15,6 +15,8 @@ on:
     paths: ["agent-runner/Dockerfile", "agent-runner/package.json", "agent-runner/package-lock.json", "agent-runner/src/**",
             "file-scanner/Dockerfile.*", "file-scanner/package.json", "file-scanner/package-lock.json",
             "file-scanner/packages-*.json", "file-scanner/container/**", "file-scanner/src/**",
+            "reader-container/Dockerfile", "reader-container/package.json", "reader-container/package-lock.json",
+            "reader-container/packages.json", "reader-container/container/**", "reader-container/src/**",
             ".github/workflows/container-images.yml"]
   workflow_dispatch:
 
@@ -33,6 +35,7 @@ jobs:
           - { name: agent-runner, context: agent-runner, file: agent-runner/Dockerfile, member: agent-runner }
           - { name: file-scanner-scanner, context: file-scanner, file: file-scanner/Dockerfile.scanner, member: file-scanner }
           - { name: file-scanner-renderer, context: file-scanner, file: file-scanner/Dockerfile.renderer, member: file-scanner }
+          - { name: reader-container, context: reader-container, file: reader-container/Dockerfile, member: reader-container }
     steps:
       - uses: actions/checkout@v4
       - uses: docker/setup-buildx-action@v3
diff --git a/.github/workflows/regression.yml b/.github/workflows/regression.yml
--- a/.github/workflows/regression.yml
+++ b/.github/workflows/regression.yml
@@ -31,7 +31,8 @@ jobs:
         timeout-minutes: 30
         run: |
           set -euo pipefail
-          for pkg in bio-plane pdf-worker ocr-worker newgroup agent-runner sheet-worker; do
+          # site: its browser test imports playwright-core from its own lock (ONB-6).
+          for pkg in bio-plane pdf-worker ocr-worker newgroup agent-runner sheet-worker site; do
             [ -f "$pkg/package-lock.json" ] || continue
             (cd "$pkg" && npm ci --no-audit --no-fund --loglevel=error)
           done
@@ -44,6 +45,10 @@ jobs:
         run: |
           set -uo pipefail
           failed=""
+          # site's browser test launches $CHROMIUM (default /opt/pw-browsers/chromium, absent on the runner):
+          # the Chromium journey-check's step installed, same playwright-core 1.56.1 (ONB-6).
+          CHROMIUM="$(ls -d "$HOME"/.cache/ms-playwright/chromium-*/chrome-linux*/chrome 2>/dev/null | head -1)"
+          [ -n "$CHROMIUM" ] && export CHROMIUM || echo "::warning::no installed Chromium found; site's browser test will fail by name"
           for pkg in bio-plane pdf-worker ocr-worker newgroup agent-worker; do
             [ -f "$pkg/package.json" ] || continue
             echo "::group::$pkg"
```


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


# [file] bob_words_14nov_notice_session.md

# Bob's own typed words, 14 Nov 2026, to the session on one question: when must a module's users be updated? (verbatim, complete, in order)

These are every message Bob typed to that session, exactly as typed. Lines in *italics between messages* are the session's notes on what a message answered; they are not his words.

---

## 1

I am Bob. This session has one question: when a module changes, how do we know which of the modules that use it must be updated, so that the others are left alone?
