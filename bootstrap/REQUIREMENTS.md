# Owner clarification superseding earlier acceptance assumptions

Read OWNER-CLARIFICATION-20261116.txt verbatim. The effective Claude Remote Process4
capabilities are the target; do not impose stronger conditions due to Codex design.
Independent ROOT resurrection after archival/deletion/whole-task loss is NOT required.
Physical module sandboxing is desirable, NOT required. Explicit module assignments,
actual-change inspection/rejection before integration, and ordinary compliance
observation ARE required. Consequential standing grants and prohibitions are unchanged.
Reactive idle-recipient wake, active delivery/queueing, nonblocking sends and
replacement routing are essential under the owner's subsequent message; timer
polling is not an acceptable message-wake substitute.

The previous conclusion that optional isolation or independent resurrection blocks
all development is superseded. Existing factual evidence stays valid. Continue the
native controller/ARCH/JOB/coordinator cycle and three prescribed product tests.

---

# Bootstrap operating requirements and authority

Research read from `neobobkrause/process3`, `process4` commit `c11682ccf903dff83f09c7505fc366760481f2ad`. Sources: all owner_words files; sixth draft sections B–P; HANDOFF; roles_root_coordinator evidence; foundations and DECISIONS passages; trial_plan_facts introduction and trials. No authoritative or product writes.

## What governs this assignment

The folder README and sixth draft explicitly say nothing there is in force. Owner typed words outrank session transcriptions; technical choices and unapproved proposals must remain labeled. The current assignment directly authorizes a Codex bootstrap and experiments in process3-probes only, dedicated branches and draft PR, and forbids main writes/merges, settings changes, branch deletion, Actions supervision, API-key inference, extra product-test stages. It explicitly supersedes draft 6's selective notification: every declared downstream user is notified on every provider change. Existing trial-plan assertions that probes must be read-only or a new repository is required are stale against both owner's 14 Nov words and this assignment.

## Responsibilities to preserve

- ROOT: first, owner-started role; starts/replaces ARCH and coordinator, starts PROCESS when ARCH requests it; hourly safety wake; no product decisions and no building.
- Watcher: standby that takes over if ROOT dies. Proposal to remove it was withdrawn. Who starts it beside an owner-started ROOT remains unresolved; historical ROOT started it. Two historical takeovers left no watcher and increased depth, so they do not demonstrate a satisfactory replacement design.
- Coordinator: owner's front door; records explicitly marked decisions/instructions exactly and dated, relays them; answers questions without triggering builds; reports ARCH's technical decisions plainly; carries hold, priority, cap, stop and account-switch instructions. No product decisions and no ordinary technical questions for owner. ROOT replaces coordinator, never itself.
- ARCH: one per product; all product technical/design decisions; ordered module list and file ownership; starts jobs and walkers, coordinates provider notices, merges through process tool, mechanical helpers, development deploy, release preparation and tranche report. Cannot change process, approvals, process pin without prior owner approval, or publish release.
- Job: one module, one branch/draft PR, own requirements implementation and own tests. Only own module files; cross-module flaw reports to ARCH. No merge, session starts, deploy, process changes. Replacement continues same branch/PR. A blocked job records blocker, pushes and frees slot, becoming ready after provider resolution.
- Worker: in-session bulk/independent helper, not reviewer of another session's work. Sessions at most three levels deep; none starts its successor.
- PROCESS: separate lane, owner interacts directly; ROOT starts; process problems travel job→ARCH→coordinator→PROCESS. Process changes and transition require owner approval. No product session may repair/work around process faults or add tests/gates/reviews.
- Product design lanes in section C are explicitly proposed, not approved whole. Owner identifies need, ARCH opens, designs only, owned design folder, questions through ARCH. Do not silently adopt all lane details.

## Executable scheduling and recovery requirements

One total module order, provider uses point earlier. Ready means work and no open job; does not wait for providers. Earliest ready first; only owner's marked instruction overrides priority. Eight job slots account-wide by default, owner changes via coordinator. Slot refilled immediately after completion/merge in v6. Walking sessions consume slots when no jobs open. Shared GitHub state holds role addresses, slots, stop scoped to account, exact instructions, pending notices/flaws and ROOT wake time; role identity must not be hardcoded session address. One writer per file. A stopped account must remain stopped across wakes/restarts. Dead/full job replaced on same branch/PR; ARCH/coordinator successor from durable state; watcher ROOT takeover. After two failed corrections ARCH replaces job; actual prior corrections must be understood. Unfinished assignments remain unfinished and resumable, not closed by process exit or plausible prose.

Durable assignments need module, requested work, acceptance evidence, branch/base, session/attempt, status/blocker, provider-notice inbox and completion records. GitHub must preserve enough to reconstruct without local session files; local CLI resume alone cannot prove host-loss recovery. Tests passing is distinct from ARCH-authorized completion/merge; assignment explicitly forbids experimental merges.

## Tests and completion

Only product module tests, internal walk, external walk. Provider notification is not a test. Module tests are job-written, own module, bounds/valid-result accuracy/out-of-bounds error recognition; valid changed result alone must not fail. Draft retains source-and-test declared-use checking inside module tests. Tool's own tests are permitted fourth-draft proposal 5 accepted, run only for process changes, cannot become product gates. Current assignment expressly requests bootstrap verification.

Internal walk uses UX Screens; external walk follows UX journeys on development deployment. Flaws become module work next round of same tranche. Tranche ends only at flawless external walk; installer/site outside tranche; release optional and owner-approved. Never claim toy bootstrap verification demonstrates a real clean tranche.

## Permission boundaries and unsettled points

V6 preserves Process3 permission management: owner-authored approvals and deny list loaded at startup, newest branch fetch, pinned read-only process version, one repository per session, auto permission checker, merge through process tool, no branch deletion/force push/settings changes. Codex technical arrangement must be measured rather than assume Claude settings.json/Auto/checker semantics work in Codex. Approval edits historically stopped every role; draft says stop and owner restarts ROOT. Never generate/edit owner approvals as if owner wrote them. Refused act is not reworded/delegated to evade refusal.

Unapproved: authoritative status of definition versus ledger/foundations; 33 kept lines proposed for ending; physical PROCESS enforcement/branch rules; precise watcher creator; two-product shared cap arrangement; notifying module-list changes; notified job's exact response; declared-but-unused uses; built files; exact walks' authoritative source and journey list (27 versus 32), tranche scope, endless-tranche fate, release-walk/AI/upgrade reading, lane workflow questions. These need not block isolated bootstrap implementation under present assignment, but must not be represented as settled product decisions.

## What existing evidence does and does not demonstrate

Process3 role evidence records ~26 coordinator sessions, 21 architecture sessions (20 replacements), stale initial checkout twice even on correct branch, stopped roles after approvals edits, stale watcher addresses, delayed discovery of finished jobs (194 minutes), account switches with lost work and wrong identity. Platform counts are Claude 2.1.316/Opus 5.5 and do not prove Codex interfaces or authority.

Trial plan J1 requires real owner→ROOT→ARCH chain and 20 unreviewed merges; rehearsed chain is not equivalent. Current assignment forbids merges, so cannot execute J1 as written. J2 owner plain prompt/two startups cannot be impersonated. J6 scheduling deterministic script and role replacement, J7 bound safety wake, J12 stop/account switch are relevant capability trials; do small actual Codex jobs first. Do not run Actions workflow to supervise or start sessions. Do not claim local subprocess fixtures simulate actual Codex proof; label harness tests separately.
