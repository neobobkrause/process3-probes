# Stream A — native supervision and owner coordination

Owner-approved layout remains console0 → ROOT1 → ARCH/coordinator2 → JOB3.
This stream does not change grants, the process pin, other implementations, the
integrator's cycle/CLI, source ownership or any product-test stage. All new helpers
are pure decisions/state operations: no provider write, native call, inference,
GitHub message bus or new service. Tests are control-plane fixtures, not live proof.

## Supervision API

`supervision.plan_supervision(state, *, observations, actor='/root',
native_capacity=None, pending_roles=(), now=None, state_branch=None)` returns:

- `actions`: existing supported native tool intents (`spawn_agent` or
  `followup_task`); actual tool execution and real-event registration are required.
- `holds`: role/reason, e.g. unknown/stale observation, durable owner stop or native
  capacity. No missing observation is relabeled as a failed session.
- `healthy`: running roles or idle roles without pending work.
- Preserved `owner_job_cap`, `technical_slots` and supplied native capacity.

`observations` maps role names to EXACT dictionaries:

```python
{'target': '/root/process4_root', 'generation': 1,
 'activity': 'idle', 'observed_at': 1790000000.0,
 'source': 'actual-native-inventory'}
```

Allowed activity is idle/completed/running/interrupted/unavailable. Completed is
retained idle, not dead. Interrupted is eligible for replacement by its creator.
Observed target/generation must match current binding. An unbound role must have
None target/generation with explicit unavailable observation after reconciling any
unbound actual native agent. Default maximum age is60seconds; future/old/unknown
entries hold. These are trusted-host observation fields, not authentication.

Console supervises ROOT/WATCHER and creates siblings at depth1. Current ROOT
supervises ARCH/coordinator at depth2; no role replaces itself. Healthy running
roles are untouched. Existing console safety wake can steer idle ROOT. ARCH is
steered when actual module work remains; coordinator when explicitly pending role
work exists. `pending_roles` comes from local operational inputs, not a new remote
polling log. `native_capacity` reduces actions without changing owner slot cap.
No claim is made that an idle console wakes reactively or that instant failover
exists. The existing native safety schedule remains the recovery backstop.

## Owner forwarding API

`coordination.plan_owner_message(state, *, actor, text, kind, message_id,
marked=False, expected_generation=None)` returns an `enqueue_local` proposal. Its
`message` dictionary can be passed to existing Cycle.message (or LocalMailbox
communication.enqueue). It includes sender CONSOLE, recipient COORDINATOR, exact
JSON envelope and stable message_id. Then derive the normal native followup intent.

Only the console can originate this route. Recipient must be current coordinator;
optional expected_generation rejects stale forwarding. Text is preserved exactly,
including whitespace/Unicode. Kind is question/instruction/decision. Questions
cannot be marked, never become work authorization, and require no durable record.
Instructions/decisions require explicit owner mark. Forwarding itself never changes
owner controls or authorizes builds. Unknown/oversized input fails before an intent.
Oversized exact owner artifacts should be preserved meaningfully and referenced,
not silently truncated or split into a permanent stream of GitHub messages.

`coordination.record_owner_words(state, *, actor, envelope, observed_at,
source_evidence)` mutates the supplied recovery dictionary only for current
coordinator, exact marked instruction/decision and actual source evidence. It puts
one idempotent record in `owner_records[message_id]`, preserving original words and
source; changed reuse is rejected. Questions/agent assertions are refused. This is
a meaningful recovery milestone for the integrator's Store, not routine transport.
No policy or grant is synthesized. Semantic stop/cap/priority actions still require
the existing authorized typed path, supplied by the integrator/governance stream.

C governance provenance adapter is explicit: trusted integrator may produce
`{source:'observed-owner-input', kind, text:envelope.verbatim, evidence:actualSource}`.
That source label alone is not authentication. C owns owner-need/request validation;
A does not convert proposals/questions into approved design work.

## Layout and continuation changes

Existing layout APIs and process_request fields are preserved. LANE:name is a
current ARCH child at native depth3. New binding requires declared design_lanes
entry, requested/active status and matching current ARCH reference; C owns full
owner-need/provenance/path/authority validation before binding. Lane generations
remain monotonic in native_roles. Optional C session uses the same target/generation
shape. Retained existing native sessions may remain addressable after supervisor
replacement; there is no native reparenting or progressively deeper successor tree.

Owner-approved adoption alone is not actual role startup evidence. Continuation
emits runnable `layout:ROOT`, `layout:ARCH`, `layout:COORDINATOR` for missing current
bindings even if historical capability evidence was observed. These missing bindings
cannot be turned into external blockers by a supplied dependency. Existing accepted
job evidence, local pending messages, owner stop/cap and deferred unassigned-user
notices retain their semantics. No top-level idle-wake or credential-isolation
proof is manufactured.

LANE technical instructions restrict it to the explicit design need and design
paths. No product implementation/merge/deploy/session creation or automatic adoption
of unapproved draft process proposals is authorized.

## Verification and limits

Focused fixtures test current/stale/missing observations, completed-vs-dead roles,
no selfreplacement, sibling ROOT recovery, capacity/ownerstop preservation, exact
question forwarding, no build authority, idempotent explicit owner records, current
coordinator checks, bounded packet rejection, lane depth/declaration/ARCH provenance
and missing-binding continuation. No raw provider mutation or credential read occurs.
Actual combined pilot and live native timing evidence remain integrator-owned work.

Stream verification at first useful checkpoint: `python -m unittest discover -s
bootstrap -p 'test_*.py' -v` passed162tests in7.161s; full output is transient
`/tmp/p4-stream-a-tests.txt`. Diff whitespace check passed. This count includes
baseline tests; fourteen added control-plane regressions exercise this stream.
No source/GitHub mutation trial, inference proof or full Process4 completion is
inferred from that result. The integrator must run combined verification/pilot.

Final typed-input correction rejects JSON boolean generations and unprepared JOB
attempt0/None before an intent. Malformed native activity data holds rather than
raising an unhashable-value error. The final full bootstrap run passed164tests
in6.982s (sixteen added regressions above baseline148); diff check passed. All
changes remain within Stream A paths and independent component interfaces.
