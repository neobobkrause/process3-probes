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

ARCH designed a real small workshop-card quote HTTP app: ordered provider and web
modules, plus an unassigned report user. Provider changes must notify both web and
report. The run is initialized and provider attempt 1 is assigned to an actual
native JOB. Completion/PR/integration must be recorded only after real execution.
Read state before any next operation; never restart this run or duplicate a reservation.

Next: provider checkpoint/PR/integration; web job and integration; provider revision
and all-user notices; consumer processing; preservation/interruption/replacement of
an unfinished web correction; internal Screens walk and external journeys walk
against the loopback development service on the existing OpenAI-managed computer.
This is an isolated proof application, not a CivicSmith2 tranche or product adoption.

Reactive message routing and latency trials are in progress in the native
communication worker; keep measured native evidence separate from helper unit tests.

## Continuation

The existing continuation is ACTIVE every ten minutes for substantive unattended
work. It is a ROOT safety/continuation wake, not reactive message transport. Idle
message recipients must use their supported native wake operation immediately.
The automation's prompt reflects these clarified requirements and retains all
standing prohibitions. Pause only for actual individually confirmed external
conditions after independent implementation work is exhausted—not optional isolation
or deletion-resurrection experiments. Do not duplicate timers or repeat completed
capability probes merely to produce activity.
