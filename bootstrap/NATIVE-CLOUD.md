# Native Process4: current requirements and development cycle

The owner's 16 November clarification is preserved verbatim in
[OWNER-CLARIFICATION-20261116.txt](OWNER-CLARIFICATION-20261116.txt).
This supersedes earlier feasibility blockers invented by this implementation.

## Acceptance that governs current work

Essential: standing ROOT with scheduled continuation; coordinator; ARCH-managed
native JOBs; explicit module ownership instructions; actual-change checks before
integration; rejection/correction of unauthorized changes; automated preservation,
draft PRs and authorized working-branch integration; notice to every declared user
on every provider change; unfinished-work/interruption/replacement handling; module
tests, internal UX Screens walk, external UX-journey development-deployment walk;
and unchanged consequential owner grants/prohibitions.

Reactive inter-session communication is also essential under the owner's later
instruction. An idle recipient must begin processing promptly without waiting for
polling/scheduled continuation. A running recipient must receive or durably queue
the message. The sender must return without waiting for a response. Native
`followup_task` wakes an idle child; native `send_message` queues to a running child
but does not itself wake an idle child. Measure both separately, and replacement
redelivery. No periodic timer can substitute for message wake. Current-tree native
addresses must not be represented as arbitrary unrelated Cloud-session controls.

Desirable: physical module-only sandboxing. The sibling-canary finding remains
useful evidence about inherited native permissions, but is NOT a feasibility failure.
Not required: independent ROOT recreation after deletion, archival or whole-task loss.
A standing ROOT plus scheduled same-chat continuation matches the requested lifetime.

Consequential boundaries remain essential: no unauthorized accounts, credential
access/disclosure, protected branches/settings, production/public-release/grant
changes, CivicSmith2 writes, main merge/push, paid hosting or metered inference.
No clarification grants wider authority. Controller operations are a technical
restriction of existing authority, not new owner-approved policy text.

## Existing demonstrated native capabilities (do not repeat)

Native hosted model execution; two scheduled after-final same-chat continuations;
ROOT→ARCH→JOB delegation; module work with six tests; interruption and replacement;
remote preservation/reconstruction; module artifact draft PR #270. The historical
parent manually performed checkpoint/PR operations, so that did not establish the
new autonomous controller route. Historical evidence remains under evidence/native-cloud.
Previous platform_blocked/pause classifications based on optional/stronger conditions
are superseded; keep observations, discard the unjustified acceptance requirements.

## Current implementation

`native/capabilities.py` separates essential acceptance from desirable sandboxing
and nonrequired resurrection. `native/cycle.py` is the native ARCH's restricted
controller. It never invokes model inference: the hosted ROOT/ARCH use supported
native collaboration tools, while the controller handles durable state and bounded
GitHub operations through existing approved access.

Controller side effects are hardcoded to process3-probes and dedicated native
state/job/integration branches. It checks real committed/staged/working/untracked
changes against module ownership before checkpoint/integration, rejects protected
configuration and unsafe paths, preserves violations for correction, runs module
acceptance without inherited provider credential environment, commits/pushes owned
work, creates/reuses a draft PR, and fans out notices to ALL declared users.
Credential hygiene is not described as physical role isolation.

Integration uses the EXISTING exact .process pin
`7a1b45dc97b0532f77b1300c11c5263682cfe7a5` and its plain working-branch merge route.
No process pin, configured tranche, workflows, settings or owner grants change.
The controller checks accepted ownership/module evidence and exact-head existing
`gate` success, then calls the pinned process tool. `--no-review` states truthfully
why no additional reviewer is used; `--reviewed` must not fabricate review. This
administrative experimental route is not claimed as legacy job/* receipt/tranche
adoption. No new product test stage is added.

## Actual new development run

State: `codex/p4-state-native-workshop-20261116/native-cycle.json`.
Working integration: `codex/p4-integration-workshop-20261116`.
Runtime: `/workspace/work/p4-native-cycle`.
Design and job assignments: `native/probe-design/`.
ARCH: `/root/p4_arch_native_cycle`; coordinator: `/root/p4_coordinator`.

ARCH and actual native JOBs completed the workshop-card quote HTTP app, then
revised its provider and web consumer. Controller-created PRs #271–274 integrated
through the existing process tool into the authorized experimental branch. Final
head: `7fbcbd444c748179ad76220c22c3d0f93f6ad901`. Provider 4 and final web 12 module
tests passed; internal Screens and actual Chromium external journeys walks passed.
Reports and screenshot are preserved under native/probe-design and evidence/native-development-cycle.

An unfinished failing web correction was checkpointed, interrupted and completed
by a distinct replacement on the same branch/PR. Actual out-of-scope provider
bytecode was rejected and mechanically quarantined before integration. Both declared
users received durable provider notices; the unassigned report user's notices remain
pending, rather than being falsely reported delivered to a nonexistent session.

Reactive idle/active/replaced child-session communication is implemented and measured;
see REACTIVE-COMMUNICATION.md. Production always uses native followup_task to avoid
the running-to-idle race. Retained idle top-level ROOT wake remains unproven: the
advertised immediate automation action actually returned HTTP404 before invocation.
This is an isolated proof application, not CivicSmith2 adoption or full Process4 completion.

## Continuation

The existing continuation is ACTIVE every ten minutes for substantive unattended
work. It is a ROOT safety/continuation wake, not reactive message transport. Idle
message recipients must use their supported native wake operation immediately.
The automation's prompt reflects these clarified requirements and retains all
standing prohibitions. Pause only for actual individually confirmed external
conditions after independent implementation work is exhausted—not optional isolation
or deletion-resurrection experiments. Do not duplicate timers or repeat completed
capability probes merely to produce activity.

## Native provider broker integration

All closed native Provider write methods now traverse the existing grants Broker
with a supervisor-constructed Subject and NativeInstructionScope. This scope is a
technical restriction of this already-authorized experiment; it is not a generated
owner-approved policy, and Host.configured remains unchanged. Typed state/ref/push/
PR routes reject other repositories, protected refs and unknown mutation payloads.
Merge refreshes actual PR scope/head/gate before the existing pinned process tool.
Cycle's actual ownership/module checks remain prerequisites, not replaced by the
broker. Raw mutating _api calls are rejected before transport.

This is controller-route integration, not platform-exclusive provider authority:
the internal Python adapter and inherited native tools are not an OS security
boundary. Current validation: 111 bootstrap and 44 grants tests pass. Actual native
ARCH state-write/denial evidence is recorded separately, without treating fixture
adapters or supervisor-supplied identity text as platform authentication.
