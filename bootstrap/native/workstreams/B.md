# Stream B: native ARCH scheduling and recovery

Branch `codex/p4-stream-b-20261116`, baseline `c901c9f`. Exclusive changes:
`native/scheduling.py`, `native/job_recovery.py`, their two test modules and this
file. Central `cycle.py` remains integrator-owned. No other stream files changed.

## Interfaces

Both interfaces are pure: they neither mutate the input snapshot nor call native
session tools, GitHub, inference or a persistence service. They return proposals,
not execution receipts or completion proofs. Existing typed controller methods
must reread accepted ownership, exact heads/gates and actual provider state.

`plan_dispatch(state, *, observations, active_account_jobs=0, native_capacity=None)`
returns `{status, dispatch, holds, capacity, pending_notices}`. Each dispatch is a
`prepare` proposal with job ID, expected/next attempt, preserved branch/PR,
current notice IDs and an explicit requirement for a fresh session binding.

`active_account_jobs` is a fresh account-wide total INCLUDING jobs in this run.
The planner uses at least the known local active count, so omitting the argument
cannot undercount this run. `native_capacity` is currently available execution
capacity, not a changed owner cap. Capacity is narrowed by all of: owner cap
(default 8), technical slots, account occupancy and free native capacity. Running,
interrupting and review/integration-pending jobs retain a slot until resolution.
Unknown external account occupancy is not proof the account is empty: callers
must supply actual observations when other runs exist.

Ready modules use the declared total order. A nonzero priority must match the
latest trusted `owner-control` priority event; arbitrary job fields do not authorize
an override. Provider `uses` entries must exist earlier in that total order, but
ready consumers do **not** wait for ordinary provider completion. Blocked jobs are
handled separately; provider change suggests reviewing a recorded blocker, not
automatically pretending it was resolved.

`reconcile_jobs(state, observations)` returns
`{status, actions, holds, pending_notices, deferred_notices}`. Ordered actions include
`inspect_unbound_reservation`, `inspect_result`, `interrupt`, `preserve_then_replace`,
`prepare_replacement`, `review_blocker`, `observe_pr`, `integrate`, and
`reconcile_integration`. Retain actions do not instruct edits or manufacture progress.
Every proposal includes expected attempt and preserved branch/PR references.

## Observation contract and controller mapping

Observations are trusted host inputs, not authentication of agent text. Native
activity is keyed by `JOB:<id>` and contains `{target, generation, activity}`, where
activity is `idle`, `running` or `unavailable` from a fresh actual inventory/event.
The target/generation must match the durable binding. A's shared packet may also
contain `observed_at` (Unix seconds) and `source: actual-native-inventory`; B accepts
those metadata fields without rejecting the packet. **The integrator must apply
A's freshness/source validator before both B APIs** (currently at most 60 seconds)
and omit stale/unknown entries. B deliberately does not independently interpret
wall-clock timestamps or treat a caller-asserted source string as authentication.
Its narrow responsibility is identity/generation/activity consistency after that
host validation. Missing observations hold for a fresh read; they are never treated
as a dead session. An idle turn does not
prove assignment completion. An unbound reservation requires inventory review
before another spawn, avoiding duplicate work after a crash between spawn and bind.

In the approved layout, a live binding outside the current ARCH's native parentage
must be inspected/interrupted and preserved before replacement; it never receives
new edit instructions. In particular, historical web generation 3 below the old
ARCH cannot receive new work under the current ARCH. A ready web assignment is
prepared as attempt 4 and bound to its actual new depth-3 JOB first. Partial work
and the same branch/PR are preserved. No session creates its own successor.

A review observation may contain `pr={number, head_ref, base_ref, head_sha, state}`.
The exact tuple must match the accepted job and experimental integration branch.
Merged recovery additionally requires fresh `integration_sha` and
`contains_head: true`; the integration SHA must be exact. These proposals still
require `Cycle.integrate` or `Cycle.record_integration` to recheck provider facts.
A done label without accepted tests, checkpoint/PR/integration and matching
`native-integrated` milestone is inspected rather than called completed.

`preserve_then_replace` maps to actual interruption when needed, controller
checkpointing, then the existing retry/prepare/session path. `prepare_replacement`
is used only after a paused current attempt already has its interrupted checkpoint.
Proposals never consume a product notice. Native first-processing acknowledgement
also cannot complete one. Unassigned declared users remain in `deferred_notices`;
no report-module job is invented simply to consume the pending report obligation.

## Verification and remaining integration

The branch's new regression cases cover concurrent ready provider/consumer dispatch,
account/native/technical capacity, owner stops and priorities, graph errors,
protected branch state, missing/stale observations, reservation discovery,
interruption preservation, old-ARCH bindings, exact merged-PR recovery, real
acceptance predicates and all-user notices. These are control-plane fixture tests,
not live inference or a fourth product-test stage. Product stages remain module
tests, internal walk and external walk.

The bootstrap integrator must wire the pure interfaces to the existing CLI and
native executor before the combined unattended pilot. No claim of live dispatch,
new provider enforcement, subscription billing proof or overall completion is made
by the planning module or this branch's unit tests.
