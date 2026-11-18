# [file] audit2_common.md (continued)

- A tranche ends only when an external walk of a development deployment completes without flaws; flaws go to the next round. A tranche can end without an AI-enabled run. Installer and website are outside the tranche and wait for a clean development release walk.
- A job writes its own tests. A job for module A is not allowed to change module B; the only other way a module is edited is a mechanical edit.
- The process is changed only in a separate lane, PROCESS, that he interacts with; he chooses among options; a product moves to an updated process only with his prior approval.
- No layers; one total order of modules; eight job slots across the account; no review by a fresh reviewer; permission management preserved from Process3.
- The notification rule (what counts as an interface change, who is told, what a told module does) is under study in a separate session; audit what the draft says about it but do not re-derive the study (/home/user/work/notice_study/study.md holds the groundwork).

## Hard rule for remedies
You may NOT propose a new test, gate, review, check, audit, monitoring job or approval step by a session as the answer to anything. A remedy may be: removing something; a structural choice; a permission or setting; a change of wording; restoring something from his documents; an honest statement that a risk is accepted and unproven; a one-off trial before the process is in force. If the only remedy you can see is a new check, say exactly that and leave the finding unanswered.

## Evidence
- Folder /home/user/handoff/: the post-mortem and design evidence (review.txt, verify_numbers.md, causal_forensics.md, change_sample.md, canon_analysis.md, product_side.md, interface_and_cycle.md, no_layers_width.md, roles_root_coordinator.md, permissions_inventory.md, levers_github_cloudflare_product.md, DECISIONS.md).
- Folder /home/user/work/: the first audit round on the second draft (attack_corruption.md, attack_feasibility.md, audit_foundations.md, audit_ledger.md), its register (/home/user/handoff/process4_counterarguments.md, 87 entries with answers, and /home/user/work/register_notes.md), the memo of answers (decisions_memo_d3.md), drafting notes (v3_notes.md, v4_notes.md, v5_notes.md), enforcement_levers.md, k_evidence.md, trial_plan_facts.md, replay/results.md, notice_study/study.md.
- Read-only clones: /home/user/repos/process3, /home/user/repos/civicsmith-copy (product; branches origin/tranche and origin/process-state), /home/user/repos/process3-probes. Never commit, push, fetch into or check out in them. Start no cloud sessions.
Use grep and read passages; do not read every file end to end.

## How to report
Write your full findings to the file named in your task. For every finding:
 1. The counter-argument or fault, in one to three plain sentences Bob could read (no ids, codes or file names in that sentence).
 2. The sentence(s) of the fifth draft concerned (quoted), and the source it is measured against.
 3. What it rests on: measured in the record (cite) / a platform document / reasoning only. Keep apart.
 4. How bad: stops the first hour / stops a tranche / silently spoils the result / costs Bob time / misleads Bob / minor.
 5. Status against the first round: NEW; or RAISED BEFORE AND STILL OPEN (name the register entry); or RAISED BEFORE AND NOW ANSWERED (say by what — his words, a decision, a correction — and whether the answer really meets it).
 6. Your best answer within the hard rule, or "no answer found".
 7. Whose it is: Bob's to decide (say why it is not technical) / Claude's to decide / needs a trial / needs the build.
Rank worst first. Do not pad. Do not soften. At the end give a one-page MAP: the areas of the design (roles and sessions; flow of a job; rounds, walks and tranche end; release; notification; PROCESS and process change; permissions and starting; state and waking; recovery; reports; what is unbuilt; what is unproven), each rated solid / stated but unproven / thin / contradictory / missing, with one line of why.


# [file] codex-context-avoidance-experiment-20261117.md

# Experimental protocol: Codex context capacity, complete reading and compaction avoidance

**Status:** Executable research specification, **not** a passed test, adopted Process4 policy, or permission expansion. Owner clarification: [compaction-avoidance direction](../owner_words/bob_words_17nov_compaction_avoidance.md). Research foundation: [context-fidelity study](codex-context-study-20261117/REPORT.md), [model-capacity discrepancy](codex-gpt6-context-window-investigation-20261117.md), [subscriptions](codex-subscription-context-pricing-20261117.md).

## Question and hard experimental boundaries

Can Process4 **reliably detect or conservatively preclude** contexts in which Codex might silently compact, truncate authoritative reading, or lose canon fidelity, while achieving useful, source-correct work for a reasonable token/time investment? What **actual context size** can one request and verify with an already authorized **subscription**, and on which actual execution surface?

Run only on disposable canon and probes, not CivicSmith2. Avoid metered API calls, paid infrastructure, credential inspection, auth retries, patched client catalogs and unapproved settings changes. Do not modify the installed Claude Code implementation or standing grants. No forced-compaction experiment in a session holding product authority. If experimental compaction cannot be observed safely, label it NOT TESTED rather than simulating a native event.

## Surfaces: never conflate

- **S1: Subscription-authenticated Codex CLI**, only if an already supported, authorized, functional login exists. Inspect read-only `/status` or supported app-server usage telemetry in a **fresh disposable session**. Never bootstrap a nested CLI with inaccessible/inherited credentials or perform re-login. Existing read-only CLI help/schema inspection alone is insufficient evidence.
- **S2: Native subscription-hosted Process4 child**, started with supported native collaboration/continuation tools in a disposable tree. Check actual child model ID, context denominator/numerator, compaction events and whether an **effective** per-child context override is supported. Do **not** send text `/compact` or `model_context_window=...` and claim that it changed the native runtime.
- **S3: Official published specs and pinned Codex source catalog**, used only to explain options/caps, not to certify S1 or S2.

S1 success does **not** establish S2 support. S2 without a context meter is INSTRUMENTATION UNKNOWN, not PASS. Explicitly report if hosted configuration must be changed by the owner, and whether the change affects only future sessions.

## Phase 0 — capability/usage receipts before any load

1. Identify running model from **actual runtime response**, not prompt self-identification. Record client/runtime version and subscription authentication surface without reading credentials; record provider model-catalog origin/refresh if supported.
2. Obtain actual session `selected/raw_context_window`, `max_context_window`, `usable_context_window`, `current-context-used`, `auto_compact_threshold`, `compaction_count/events` and whether values are live or stale. Record a missing field explicitly.
3. Obtain a supported session-specific indication of input/tool-history size or token usage; do **not** equate all-time token usage with active context occupancy.
4. Record the account's included usage meter **only where available without asking for secrets**; do not fabricate billing costs.

**Gate:** If effective context and compaction state are not observable, the agent cannot certify a percentage-based pre-compaction guarantee. Continue only with bounded disposable investigation of safe controls and declare production compaction avoidance **UNPROVEN**; do not run risky saturation.

## Phase 1 — test larger-window requests (isolated fresh disposable sessions)

For S1, where a supported config override is genuinely available, create otherwise equivalent new sessions with:
- **control:** no explicit `model_context_window` override;
- **500K requested**, and
- **1M requested**.

Keep the same available model, reasoning effort, minimal bounded test and subscription login. Use supported session-only `-c model_context_window=...` or equivalent ephemeral config. Do not modify system/global settings. Read session status **after first real inference** and, if supported, the actual model catalog chosen at that point. Record whether request is accepted, rejected, or silently clamped; distinguish raw versus usable; verify the compaction threshold separately.

For S2, repeat only **if a documented native control actually exists**. Otherwise mark REQUEST CONTROL UNAVAILABLE and separately report which future API/platform interface is needed. Never infer S2 from S1.

Where the 500K request resolves to 475K usable, state the 95% headroom explicitly; when 1M resolves to 828.4K, state the catalog cap. Neither implies 1M effective. No session should be filled up to its cap just to prove its configuration.

## Phase 2 — early warning and refresh without compaction

On isolated **measured** disposable sessions only:
1. Establish baseline current context and token change for bounded realistic work: initial read set, 1 task, N structured research workers, one parent decision and exact source confirmations.
2. Measure **increments**, not merely totals, including tool-output truncation. Note whether reported usage is a last-turn, conversation-scope, or compaction-scope counter.
3. At an observed **<=30% of the effective resolved window**, initiate checkpoint/handoff preparation for work expected to approach 40%. Refresh the parent at or before the owner's **40% guardrail**, with allowance for one whole bounded handoff and the largest expected response before threshold. Never execute a step projected to exceed that guardrail.
4. Compare before/after exact owner instructions, canon-scoped decisions, unfinished questions, pending messages, generation ownership, measured context, productivity and overhead.
5. Reject as NOT CERTIFIED any experiment where the chosen meter is absent, compaction occurs, the effective threshold shifts without detection, or a materially binding source is incompletely read.

For S2 with **no usage meter**, do not pretend to verify 30/40%. A conservative per-turn/source byte budget is a provisional damage-limiting device, **not** proof of never compacting; report this limitation openly.

## Phase 3 — full-read and fidelity controls

Reuse the independently stored, source-pinned hierarchical canon fixture from the prior research, add an unseen nontrivial task and a delegated **decision** worker with a strictly defined choice set and governing exceptions. The reader must report source revision, complete file/section coverage, expected vs delivered bytes/lines, truncation warnings and skipped segments. If tool output truncates, fail the read and re-read in bounded contiguous portions; do not silently accept a beginning/end excerpt. Require correct binding decisions and explicit abstention where source is unknown. Include an invalid higher-authority override trap and conflicting historical text.

Compare (i) fresh full-read, (ii) bounded targeted-worker packet with correct scope/references, and (iii) proactive fresh-session restoration. **Do not add a new product test stage**; these are runtime/process experiments on disposable canon.

## Phase 4 — productivity and cost

Report per surface/configuration:
- Work items and authority-sensitive decisions **correctly completed**; omission/conflict counts.
- Fresh-session startup, reading, delegation, execution and handoff latency; context headroom at checkpoints; failures/retries.
- Actual usage/credits if the subscription provides them; otherwise use explicitly **proxy** tool/token counts and avoid claiming billed cost.
