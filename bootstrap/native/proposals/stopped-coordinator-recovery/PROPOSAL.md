# PROCESS proposal: supervisory continuity during a product stop

Status: PROPOSED, NOT ADOPTED. Owner approval is required before any governing change. No process source, owner grant, pin, standing controls, or provider resource was changed by PROCESS.

## Observed problem and authority

The exact owner request remains canonical at `bootstrap/OWNER-RELIABILITY-ASSESSMENT-20261116.txt`; this proposal does not duplicate or reinterpret it. Item 4 authorizes preparing a proposed correction and explicitly forbids changing the governing process or inventing approval. Item 5 asks that a stop survive scheduled continuation and session replacement. This proposal is PROCESS reasoning, never owner words.

In the isolated, explicitly synthetic controls exercise, owner-source stop correctly blocks product preparation and technical continue. It also suppresses all supervisory actions, including a coordinator with pending work. That prevents the supported planner from restoring the owner front door while stopped. Whether stop should prohibit this recovery is a governing semantic decision, not an implementation assumption that PROCESS may override.

The current ARCH generation 5 routed the actual defect to ROOT; ROOT created and registered PROCESS generation 2 at /root/p4_root_g2/p4_process_g2. The current request and registration are in the existing native state. No self-successor or child-depth expansion was used.

## Actual reproduction

Exercise state: codex/p4-state-native-controls-exercise-20261117-g4. Runtime: /workspace/work/p4-controls-exercise-20261117-g4. See actual-repro.json for exact argv, times, stdout and return codes copied from coordinator results.json.

At the observed stopped-state checkpoint, stopped=true and stop_source=owner. The actual supervision-plan command with ROOT actor and pending COORDINATOR returned actions=[] and durable-stop holds for ARCH and COORDINATOR. prepare beta failed, and technical continue failed with “technical control cannot clear an actual owner stop.” Those product-stop denials are correct and must remain.

Code explains the result: native/supervision.py plan_supervision returns all-role holds immediately on stopped; native/layout.py plan independently returns a stop hold before any followup/interrupt/spawn action. Native governance.plan_process_lane also holds while stopped. The observed limitation concerns supported automatic supervisory recovery; it is not evidence of state loss or a failed product stop.

## Minimal proposed correction, pending owner decision

Define the stop domain explicitly before implementation. If the owner approves supervisory continuity, permit only current-creator recovery of the COORDINATOR as an owner-front-door recipient while preserving stopped=true and stop_source unchanged. The replacement must begin in a constrained stopped role: receive questions, explain status, preserve exact input, and request a real owner continue. It must not prepare JOBs, resume product work, integrate, deploy, clear stop, broaden grants, or treat a question as work authority.

Any implementation would need consistent narrow exceptions in both supervision and layout planners, plus review of operation checks that currently reject all actions under owner_stopped. A blanket removal of stop guards is expressly not proposed. Normal depth, current-generation, fresh-inventory, creator, capacity and provenance checks remain necessary. ROOT/ARCH/PROCESS recovery exceptions are outside this minimal proposal and require separate explicit decisions.

## Verification plan if approved

1. A stopped run with unavailable coordinator and fresh actual inventory yields only the narrowly authorized coordinator recovery intent; stale/obsolete observations still hold.
2. Execute that supported intent with a real native replacement. The new role reads the same persisted stop before handling input. Record actual event and generation.
3. Real scheduled continuation preserves the stop and does not dispatch product work.
4. Questions never create product instructions; synthetic or PROCESS proposal text never becomes owner approval. Only exact actual owner continue can clear an owner stop.
5. prepare, integration/deployment initiation, technical continue and JOB replacement remain denied while stopped. No permissions, grants, pin or public release changes occur.
6. Repeated recovery observations do not create duplicate sessions or routine GitHub bookkeeping.

These are proposed tests, not executed passing results. Current evidence establishes the existing all-role hold and guard rejection only.

## Alternatives and present limitation

Retain the present conservative all-role hold and depend on the active console/owner for recovery. This minimizes semantic change but leaves autonomous owner-front-door replacement unavailable while stopped.

A newly created read-only assessment recipient can inspect unchanged stopped state under the separate bounded exercise authorization. That can establish durable-stop persistence across a native assessment-session replacement. It must not be described as controller-driven automatic coordinator replacement or used to evade the existing hold.

## Actual adoption denial

The existing native.governance.require_owner_evidence guard was called locally with this explicitly labeled PROCESS proposal. It rejected the input with OBSERVED_OWNER_AUTHORITY_REQUIRED; see authority-denial.json. No adapter/provider action was invoked. This is an actual provenance-guard denial, not a fabricated adoption endpoint or a physical confinement claim. There is no observed owner approval for the proposed semantics, so adoption remains DENIED pending that decision. Unrelated authorized product work can continue.

## Independently reviewable candidate artifact — not adopted

PROCESS generation2 authored the original proposal/reproduction above. After that role completed, console requested a concrete review candidate; ROOT generation3 authored `candidate-NOT-ADOPTED.patch` and the nine isolated offline assertions recorded in `candidate-offline-verification.json`. Do not attribute this later patch to PROCESS.

This source proposal branch contains artifacts only. The patch is not applied to the active controller, no policy field is written, and no actual owner approval exists. Its proposed future policy field and synthetic offline approval packet are hypothetical interfaces, not observed owner authority. The candidate intentionally contains no adoption command/writer. Native stopped coordinator recovery has not been executed or established.

The nine offline checks passed against an isolated copy of the planner files: conservative default hold; proposal packet rejected; synthetic future opt-in permits only unavailable coordinator replacement; stop unchanged; stale observation held; running coordinator not steered/interrupted; ARCH held; explicit running replacement held; wrong creator rejected. These are narrow candidate checks, not a controller/grants regression suite or an adopted governing process. Owner semantic approval, a trusted adoption adapter, complete guard review and actual supported native verification are still required before any adoption.

A separate normal real-run coordinator5 replacement was executed while that real run was not stopped. The isolated controls exercise remained stopped. That event does not demonstrate the proposed stopped-policy exception and does not authorize it.

The stored patch uses zero context to avoid whitespace-only patch context lines; inspect it as a proposal, and if testing an isolated copy use `git apply --unidiff-zero candidate-NOT-ADOPTED.patch`. Do not apply it to the active controller.
