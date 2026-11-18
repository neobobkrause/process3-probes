# [file] codex-context-avoidance-experiment-20261117.md (continued)

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
- Time and token burden of rereading sources, handoffs and worker delegation; any remote Git state growth.
- The actual reduction in parent context ingress using workers and bounded evidence packets, without calling that reduction total inference savings.

Predeclare candidate success criteria based on measured results; do not invent thresholds after seeing outcomes. Aim to find the **smallest proven sufficient window** for repeatable correct work rather than maximizing the window.

## Acceptance and decision

**Pass** for a given surface requires: actual model/capacity/meter receipts, safe/observable 40%-or-earlier refresh and role continuity, no compaction before completed handoff, verified full-reading, clean authority-sensitive answers, and acceptable measured task productivity. State the exact window/model/surface for every PASS.

**Qualified/partial:** larger request works only in CLI, or source fidelity works but hosted child usage/compaction state unavailable. This is valuable evidence **but cannot certify production avoidance of silent compaction**.

**Fail/blocked:** no supported way to detect/preclude compaction or preserve required authority for a target native role; stop claiming readiness for that role, preserve evidence and investigate supported alternate runtime management. Do not weaken owner guardrails or introduce metered inference without approval.

## Reporting and repository discipline

Write one compact report plus raw machine-readable evidence for actual observations, with `OBSERVED`, `DOCUMENTED`, `INFERRED`, `NOT TESTED` separated. Pin tool/client/model/catalog versions and source commits. Integrate substantive findings once in `neobobkrause/process3` on `process4`; proof-specific implementation may use authorized `process3-probes` branches. No routine message/ACK/heartbeat Git traffic. Preserve the original Claude process and owner wording unchanged.

Suggested independent experimental role: **Codex context-limit/refresh probe worker**. The existing research session's completed scope need not be kept alive; create a fresh bounded worker or instruct the bootstrap's ARCH/PROCESS to commission it under established controls.


# [file] restart-speed-options.md

# Restart speed: options for items 2 and 4 (build/restart-speed, 5 Nov)

## Item 2: a killed train cannot retake its own session's lease

Today the lease names the session and a per-process token; a new train in the same session is
refused as "another train in this session" until the lease lapses (15 min; 9 min lost 07:18-07:27).

- A. Record the train's process in the lease (pid, the container's boot id, and the process start
  time from /proc). A train in the same session takes the lease when that process is not alive on
  this machine: no such pid, another start time (pid reused), or another boot id (a new container).
  A live second train is still refused. Where /proc cannot be read, nothing changes (it waits).
- B. A lock file under .git held by the running train; the same session may take the lease when
  the file's lock is free. Misses a second clone in the same session and a file left by a kill
  (the same stale-lock problem item 5 names).
- C. A `--retake` flag the MERGER passes after it checks no train runs. Fast, but a session's word
  decides, and a wrong one runs two trains.

Chosen: A. It decides from the machine, not a session's word; a live train (same pid and start
time) is always refused; other sessions are judged by the lease time as now.

## Item 4: after a train merge, the next start of that module cannot push job/<id>

Found in job start: in a shallow clone (BOB's), whether the branch's last attempt merged is asked
of GitHub against the tranche's name, the tip now, while the new attempt is cut from the anchored
tip read earlier. When the train lands the module's pull request between the two (a provider's
merge then reopens it for its notice), GitHub says merged (ahead 0), the cut lacks that merge, and
the push of job/<id> is not a fast-forward. A full clone counts against the anchored tip and
refuses instead.

- A. Count against the anchored tip's sha (GitHub compare takes a sha), as the cut is; when the
  branch is behind the anchor only because its own merge landed after it, anchor again once and
  count again. A branch truly off the tranche goes on as today (an abandoned attempt: a fresh
  branch with its why recorded; an open pull request: refused with its route).
- B. Count against the anchored sha only. The race reads as an abandoned attempt and cuts a fresh
  branch job/<id>-<n> with a wrong why in the record, a branch per race.
- C. Cut from the tranche tip now instead of the anchored one. Skips the approvals and pin check
  of that tip, which the anchor's confirming review forbade.

Chosen: A. One tip decides both the count and the cut, the anchor's checks hold, and the race
costs one more anchor instead of a hand choice.

Question for the coordinator: if plane's branch held a merged result that never landed (the
killed train's push, its pull request closed), say so; A already starts that case on a fresh
branch by itself when it is a reopen.

## Built (after the 10 minutes, no answer)

Item 2 as A. Item 4 as A, and a second cause the test found: in a depth-1 clone the tranche tip
the start is cut from has no parents, so git itself cannot see origin's job/<id> below the new
commit and refuses the push as not a fast-forward even when it is one. Before the push, the
tranche is deepened (doubling, then whole) until origin's tip is provably below HEAD.


# [file] verify_numbers.md (later part)


Fixes are the largest single kind in my sample and 44 of the 56 fix PRs add no new check or capability by subject. By period the fix share is 5 of 22 (1 to 3 Nov), 28 of 49 (4 to 5 Nov), 14 of 27 (6 to 7 Nov), 9 of 20 (8 to 9 Nov). The review's central proportion (more changes repair the process's own earlier code than add capability) holds.

Supporting figure for the review's "review rounds supplied roughly 10 to 35% of the lines": of 705 non-merge commits touching tool code or tests, 278 have a review-fix subject (review / fix pass / findings) and they carry 20,406 of 85,977 added lines, **24%** (by day 11% to 51%). Roughly right.
