# [file] bob_words_17nov_codex_context.md (continued)


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


# [file] bob_words_17nov_fresh_context_and_process_self_development.md

# Owner direction: fresh context tests and Process4 developing itself

**Status:** Verbatim owner message followed by a clearly separate interpretation for experimental planning. This is not approval to adopt new governing rules, change grants, modify CivicSmith2, or alter the existing Claude Code implementation.

## Owner's words — verbatim

> The bootstrap session has itself been running for an extended period that must hve involved multiple compactions. While the session may still be useful, we need to be realistic about the risks of continuing to rely on compacted sessions, whether this one or any other.
>
> So, yes, we need to run these experiments. I suggest that you give me instructions for a fresh session to run the tests. I also suggest that we prioritize trying to get process4 development to the point that its constructs can be used for its further development. It would be a more efficient use of calendar time, my time, and token costs if the infrastructure we in place for your work to continue as PROCESS, with lanes, as needed, used for continuing work related to context management, permissions management, inter-session communication and coordination, etc.

## Assistant interpretation (not owner words)

- The owner is concerned about **unrecognized compaction** in the old bootstrap, not asserting a verified event count. Preserve its work but validate claims from authoritative repository sources rather than treating its conversational memory as a trustworthy canon.
- Use a **fresh, bounded experimental session** to run the existing protocol: `process4/working/codex-context-avoidance-experiment-20261117.md`. Use only disposable fixtures. Distinguish native child capabilities from CLI documentation.
- Prioritize making Process4's **existing experimental implementation manage its own further development**, with a fresh standing PROCESS role and scoped design/research lanes for context, permissions, communication and coordination, subject to the owner's unchanged authority to approve governing process changes.
- A new independent chat is **not automatically** the runtime's registered PROCESS role. It may establish/coordinate the role through supported native tools only after verifying identity and supervision; preserve active bindings and do not create competing ROOTs or duplicate timers.
- Work autonomously, in parallel where source ownership permits. Keep a durable repository checkpoint for handoff and refresh before approaching the conservative 40% context guardrail. If current context occupancy is unavailable, **do not assert measured compliance** or an assurance of zero compaction.
- Do not assume Process4 is already self-hosting just because its PROCESS role exists. Demonstrate one genuine self-managed bounded development/research cycle before claiming the transition is complete.

Related: `../owner_words/bob_words_17nov_compaction_avoidance.md`, `../working/codex-context-avoidance-experiment-20261117.md`, `../working/codex-context-study-20261117/REPORT.md`.


# [file] coordinator-handoff-9nov.md

# Coordinator handoff, 9 Nov 2026 ~03:55Z (session_018BhcedocxexhtJW2Rz2gdo)

Previous: notes/coordinator-handoff-8nov-d.md. Log: notes/coordinator-findings-3-4nov.md, entries 19:12Z 8 Nov to 03:55Z 9 Nov.

## Addresses
ROOT session_018Bhceg3m4o8qXzgi9JC4Ux. BOB was session_018BhcedsAGpicjoH84dSXRZ, handing over to a fresh BOB at ~03:25Z (read `address bob`). Watcher session_018BhcefG1j3sNc5UxYXrgdK (daily 11:17Z, trig_01LpPRjtUY8Gwa1Ji165hFkb). Lane ux session_018BhcefJXoCL3spfVV8dnjK kept (round 2's CR2-23..27 rest on its DECs).
My tasks, bound to me (rebind to yourself, then delete mine): hourly trig_01GELGk3h7UwbjTNyaKdEMDi (:51), Phase 1 survival trig_0164Jo1hrgfyunxvk72eMQsZ (16 Nov 17:00Z), Phase 2 survival trig_011VvFsZ7EfRDsKjKGNLFic6 (18 Nov 17:00Z), Cloudflare release token expiry reminder trig_019fiTs6zwJzGjYyuGgfjmja (25 Oct 2027).

## Bob's decisions since 8nov-d (DECISIONS.md on process3 tranche)
- BD-R3 (PR 275): installer-update workflow built only after a clean internal walk; site-update only after clean external walks.
- BD-R4 (PR 276): migrate-released covers only the last 3 releases.
- BD-R5 (PR 279 + 280): first release walks run without an AI account (AI-assisted steps 'not walked'); AI configured only after non-AI journeys are clean; installer and site updates wait for a clean AI-on release walk.
- Bob also: release deploy token added (Cloudflare account token 'civicsmith-copy release deploy', 1 year) in the copy's protected GitHub environment **p3dev-release** (not 'release'), secret CLOUDFLARE_API_TOKEN, variable CLOUDFLARE_ACCOUNT_ID; neobobkrause required reviewer. Site is civicsmith.org (civicsmith.dev registered, no site). Naming: "layers are in rounds which are in tranches".
- Mine: PD-16 (PR 277): round close is the internal walk only; live walk only on the release after a clean internal walk; walks parallel within Cloudflare limits. PD-17 (to record): rehearse new process paths in process3 (C46's round-loop test, the probes) before the product uses them.
- Bob: "I don't do stuff like that, you do it" (housekeeping PRs are the coordinator's).

## Merged in process3 tonight
C40 (274), C43 (278: walk round; walk concurrency block, live default min(cap, CPUs); walk.ai/{assistant}), C44 (281: owed reopens; --covers; PD-16 set-aside), C46 (282: `round next`; naming 'tranche · round · layer m (internal n)'). Decision PRs 275-277, 279-280.
Pins: copy at 544f5089 (C43+C44; copy PR 1083). Probes at a6bd8f11 (pushes from coordinator-started probes sessions are refused by the auto-mode classifier; Bob runs probes pin moves from his own session in Accept-edits mode; prompt template in notes/probes-pin-for-bob.md).

## Open acts for you
1. C45 (light gates for record-only and pin-only PRs), builder session_018BhcegrFHtZ2VbgqoV26We: was idle 03:14-03:51, nudged. Review (fail-closed classification; no real code may skip its suite), merge, then ONE pin move of the copy to the tranche tip carrying C45+C46. Then tell BOB `round next` exists for the next round close.
2. Round 2 (tranche · round 2): layer 1 open (internal layer 13) with jobs bundler PR 1086, file-scanner PR 1087, reader-container PR 1088 (older found marks). Layer 11 next: interface-shell DEC-340 (owed reopen, covers 96), plane F1 (BD-R4 + speed fixes B-D; PR 1084), journey-check F12 (parallel walk pool; PR 1085; must forward --concurrency and --assistant, p3dev-walk-setup.mjs:197). Config PR 1089 (walk.cloudflare_plan paid, argvs) merging. Then the round's internal walk (round close = walk round).
3. Plane suite: report the first measured gate time after plane F1 lands (Bob asked).
4. Audit oddity: start/coordinator-4nov@7d1c763 (00:53Z, pushed with the tool) missing from the ledger; one raw push of mine at 23:49Z noted. Check whether the tool's ledger write from a clone with no process/config.json is reliable.
5. Record PD-17 in DECISIONS.md.
6. p3dev-l12 resources (walk deployment of round 1) still up: a teardown when convenient (development deployment; the product's approvals cover it; via a copy-rooted session).

## Practice
Merge: worktree at the tranche, merge the head, run the suite (HOME=$(mktemp -d) GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_NOSYSTEM=1 node --test 'tool/test/*.test.mjs'), then `node tool/p3.mjs merge <n> --plain --rounds 1 --reviewed "..."` (timeout ~1200 s). Pins: `pin move neobobkrause/<repo> --report <you> --why ... --pin <sha>`, create_session with its prompt, archive when it reports. Push notes only with the tool's `github push`. Product acts only through product-rooted sessions (BOB or short sessions).


# [file] coordinator-handoff-7nov-b.md

# Coordinator handoff, 7 Nov 2026 ~04:55Z (session_018BhcefrJ17LisCLZSvEMCV)

Previous handoff: notes/coordinator-handoff-7nov.md. Log: notes/coordinator-findings-3-4nov.md (entries 01:47Z–04:55Z). Problem classes: notes/problem-classes.md (C1–C18). Bob's settings files, one per repo: notes/settings/*.settings.json (from notes/r17c-settings.md on the tranche).

## Situation
- Layer 9 MERGED 03:39Z (copy PR 735, 8.88 h). Layer 10 open since 03:39Z: monitoring landed (743), link-sweep landed (745), following (744) republishing/job-syncing, scheduler (748, early, reopen R34/R35) in flight. Early start into layer 11: op-capabilities (PR 752, layer/11 cut ahead). setup-words and record-core joined layer 11 (ruled: setup-words runs first; ~40 layer-11 modules depend on it). The 5 investigation reopens (steps, hypotheses, retrieval, project-roster, observation-log) joined layer 11; ruling: 4 with marks start ≤2 at a time, observation-log gets `layer retest` only.
