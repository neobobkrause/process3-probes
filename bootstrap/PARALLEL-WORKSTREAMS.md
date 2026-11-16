# Parallel Codex Process4 implementation — owner authorized

Approved ROOT identity is settled (exact Yes recorded); no repeat approval gate.
Baseline c901c9f passed148bootstrap tests; unchanged grants44. Existing mode/run,
branches/PRs and originalClaude/.process implementation preserved. Four worktrees
start at this same baseline. Console is sole bootstrap integrator for authorized
codex/p4-grants-broker-20261116, never main/tranche. No worker merges others' changes.

## Exclusive ownership

| Stream | Branch / worktree | Exclusive source and tests |
| --- | --- | --- |
| A ROOT/coordinator/lifecycle/communications | codex/p4-stream-a-20261116 / /workspace/work/p4-stream-a | native/layout.py, communication.py, continuation.py, NEW supervision.py and coordination.py; role_instructions.py; corresponding test_native_{layout,communication,continuation,supervision,coordination}.py; native/workstreams/A.md |
| B ARCH scheduling/concurrency/dependencies/recovery | codex/p4-stream-b-20261116 / /workspace/work/p4-stream-b | NEW native/scheduling.py, job_recovery.py; corresponding test_native_{scheduling,job_recovery}.py; native/workstreams/B.md |
| C permissions/designlanes/PROCESS/consequential protection | codex/p4-stream-c-20261116 / /workspace/work/p4-stream-c | grants/{grants,host}.py and matching existing tests; NEW native/governance.py, design_lanes.py and test_native_{governance,design_lanes}.py; native/workstreams/C.md |
| D walks/deployment/tranche/dev-release | codex/p4-stream-d-20261116 / /workspace/work/p4-stream-d | NEW native/walks.py, development.py, releases.py and test_native_{walks,development,releases}.py; native/workstreams/D.md |

All paths in source column are relative to bootstrap/. No other source changes by
workers. Integrator ALONE owns native/cycle.py, test_native_cycle.py, centraldocs/
CLIwiring and integration. ARCH's pilotdesign folder approved-layout-design/ stays
ARCHowned, productsource only explicitmoduleJOBownership aftercombinedintegration.
No processpin/workflow/settings/grant/Claudeimplementation changes are authorized.
If another file is needed, messageintegrator beforeediting. Each stream commits
only its paths on its own branch, verifies meaningful behavior, pushes samebranch
without force and provides a reviewable draftPR if practical (source artifact, not
routine communications). No raw provider mutation trials beyond existing authority.

## Narrow interfaces before modifications

All components consume existing native durablestate dictionaries and explicit
fresh native observations; plans are pureJSON-compatible decisions, not proof of
execution. Sideeffects stay in existing typedprovider/controller or actual native
collaboration tools. No module launches inference or invents task APIs.

A preserves existing layout/configure/adopt/creator/validate_binding/plan interfaces
and LocalMailbox interface. New supervision/coordination helpers plan console-safety
replacement and exactownerquestion/instruction forwarding; questions cannot build.
Input actor/observation fields are trustedhost inputs, not authentication. Add
LAYOUT awareness of LANE:name as ARCHchilddepth3 only through agreed interface;
PROCESSrequest currentfield native_layout.process_request must remain compatible.

B exports plan_dispatch(state, *, observations, active_account_jobs=0,
native_capacity=None) and reconcile_jobs(state, observations). Return proposed
ordered dispatch/recovery actions, expected attempt/generation and explicit reasons.
Do not mutate remote state or wait on ordinary providers as readiness prerequisite.
Validate totalmoduleorder/uses; retain everyuser provider obligations; enforce owner
stop/cap≤8 and currenttechnicalslots; reject stale/obsolete boundJOB for editing.
Integrator wires results to existing prepare/session/checkpoint/integrate flow.

C exports check_operation(subject, operation, request, facts) (deny/allow before
adapter using existing approvedauthority/instructions; no generated ownerpolicy),
plus explicit lane/process request validation/plans. Keep existing Broker/Host
contracts. Use layout's existingcurrentARCHrequest schema; coordinate A as needed,
no editsAfiles. Distinguish instructed/controller/provider/alternativetool authority.
Existing approvals/grants remain immutable; unknown actions failclosed. Designlane
needs provenance/ownership; no automatic wholesale adoption of draftproposals.

D exports validate_module_evidence, record_walk/assess_round-style functions with
actual SHA-bound evidence, deployment allowlist127.0.0.1 and selected runtime,
tranche progress from internal/external flaws back to owned jobs and rewalk. Public
release always ownerapproval-gated; local development release is preparation only.
No new productstage: module, internalwalk, externalwalk. Integrator wires commands
only after validated interface supplied; no sharedcycle.py edits or deployment now.

Components may raise specific ValueError/PermissionError or return explicit hold/
proposed actions. No action receipts manufactured from plans. Durable snapshots
only at meaningful recovery milestones; no GitHubmessages/acks/heartbeat/pollrecords.
Routine coordination uses nativefollowup (idlewake) or active delivery, not GitHub.

## Concurrency and integration

Start A+B, get first ownership/interface acknowledgements, then activate independent
C+D while A+B continue. This is not waiting for area completion. Four implementation
streams≤8accountjobceiling; reduceactive work for native/subscriptioncapacity. ROOT,
PROCESS and other supervisory roles also use nativecapacity when active. Measure
firstusefulcommit/verifiedbehavior, actual overlap/conflicts and rework; do not create
telemetrycommits or agents merelytoinflateparallelism. Share bounded native progress.

Integrator inspects actual branchdiff ownership before experimental integration,
rejects/corrects out-of-scope commits, reviews interfaces, cherry-picks accepted
streamcommits, runs appropriate combined codeverification. DraftPR/testsuccess is
not completion. Afterallfour are integrated, operationalROOT/ARCH run combined
unattendedpilot: concurrent independentmodulework when slotspermit, provider fanout,
interruption/recovery, automaticpreservation/draftPR/pinnedtool workingintegration,
real module/internal/external stages and multi-round flaw correction, development
release preparation only. Existingproofapprevisionmin1→2design is retained forpilot;
ARCH owns product decisions. No CivicSmith2/main/tranche/paidinfra/meteredAPI/login.
