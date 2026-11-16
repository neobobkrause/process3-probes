# Stream C — practical authority, PROCESS and design lanes

Scope: owner-authorized Process4 bootstrap only, process3-probes branch
`codex/p4-stream-c-20261116`, worktree `/workspace/work/p4-stream-c`, baseline
`c901c9f`. No central cycle/layout/role-instruction, product, process-pin, workflow,
Claude implementation, repository-setting or owner-grant file changed. The approved
ROOT identity is settled, not a pending approval gate.

## Interfaces for the bootstrap integrator

`native.governance.check_operation(subject, operation, request, facts)` reexports
the same function from `grants.grants`. It returns an explicit technical-scope
allow dictionary or raises existing `Denied` **before an adapter**. It is a
restriction of current instructions, not a generated owner policy, authenticated
caller interface or proof of platform-exclusive privileges. `Host.perform` composes
it before the existing `Broker`/separately pinned policy. `Host.configured` and
`GrantPolicy` approval bytes/digest contract remain unchanged. The guard cannot
expand a narrower pinned policy, and no `owner_approved` profile is synthesized.

The integrator may compose this at the end of existing
`NativeInstructionScope.authorize`, retaining its closed native schema/ref checks
and existing Broker adapter. The fixed native ARCH Subject at generation0 is
accepted. Current native state/ref/exact-SHA checkpoint/draft/ready PR/working merge
request shapes remain compatible. An omitted repo defaults only to the immutable
trusted Subject's probe repo, preserving the preexisting Host contract; an explicit
other repo is denied. Never use this default to select an account or another repo.

Guard behavior:

- Deny unknown settings/admin/process-pin/public-release/external-account or hosted
  infrastructure operations. Main/tranche merges and direct working-integration
  pushes are denied; integration is only the existing pinned process tool route.
- Typed working merge requires ARCH, `codex/p4-integration-*`, positive integer PR,
  exact40hex expected head, matching trusted `observed_head`, and strictly true
  `existing_gate_green`. Optional ownership/module/target facts, if supplied, must
  be strictly true. Existing Cycle actual ownership/module acceptance and provider
  checks are still required; this API is not a replacement product acceptance test.
- Native ARCH checkpoints carry exact SHA to a probe job branch. Path-bearing
  updates additionally require host-derived `owned_paths` and reject consequential
  metadata/grant/pin/credential paths. Optional `changed_paths` on native checkpoint
  requests receives the same ownership check. Actual Git diff derivation stays
  with the existing controller; agent-declared paths are not evidence.
- Optional `expected_generation` rejects stale subjects; explicit owner stop denies
  dispatch. Unknown subjects are rejected by Broker before trusted-fact lookup.
- Routine GitHub communications are not allowed. A PR comment needs trusted
  `comment_purpose=development_artifact|review`; it is not a message/ack/heartbeat
  escape hatch. Native session operations retain parent/slot/relation checks;
  PROCESS starts additionally need `process_request_verified=true`, derived with
  the validators below. A's actual native creator/depth checks still apply.

## PROCESS provenance

`process_request(state, *, actor, generation, evidence)` returns the existing
schema `{arch:{target,generation}, source:'observed-native-ARCH-request', evidence}`
for an actual trusted current-ARCH observation. It does not mutate state or start
anything. `validate_process_request(state, request=None)` rejects missing, stale,
wrong-source or malformed requests. `plan_process_lane(state, *, actor)` validates
current ROOT creator, preserves stop, and proposes create/continue with
`requires_actual_native_event=true`; the existing layout/native tools perform and
register the action. JSON source labels themselves authenticate nobody.

`require_owner_evidence(record, *, allowed_kinds=...)` consumes a **trusted adapter**
record `{source:'observed-owner-input', kind, text, evidence}` while preserving exact
text. Questions, technical proposals and non-owner assertions do not authorize
mutation. A's console envelope can normalize verbatim/source evidence into this
shape; that normalization must reflect an actual observation, not promote a packet.

## Explicit design lanes

A and C agreed `state.design_lanes[name]`:

```
{need:{source:'observed-owner-need',evidence,text}, paths:[...],
 arch:{target,generation}, status:'requested'|'active',
 session?:{target,generation}}
```

`request_lane(state, name, *, actor, generation, owner_need, paths)` returns an
explicit requested lane only after current ARCH and owner-identified need checks.
`validate_lane`, `plan_lane` and `validate_design_changes` validate provenance,
nonoverlapping module/lane ownership, depth3 ARCH-child session, and design-only
changes. Permitted design formats are Markdown/text/JSON/diagram/image artifacts;
a lane is not a product-code, module-build or merge authority. Retained lane sessions
can continue after ARCH replacement without native reparenting, but creating a new
session requires current ARCH revalidation. No draft section C is automatically
adopted and no lane/session is created merely by returning a plan.

The integrator should obtain need text/evidence from an actual durable observed
owner record, never an arbitrary agent packet. Merely possessing an owner record ID
is insufficient: a ROOT-layout approval or unrelated owner message is not an owner
identification of a particular product design need. Explicit classification by the
trusted coordinator/integrator must preserve the actual context. Current lane tests
use clearly labeled fixtures, not new owner decisions. A owns corresponding
`LANE:name` lifecycle validation; cherry-pick A then C, no cross-stream source edit.

## Verification and limits

Meaningful fixture tests cover denial before even a permissive adapter, exact head/
gate, wrong branches/repo/settings/pin/release/account/protected paths, pinned policy
still denying a technically scoped action, invalid subject before fact lookup,
stale PROCESS provenance, proposals/questions not becoming owner authority,
owner stop, no implicit lane adoption, ownership conflicts, design-only changes,
and retained session scope after ARCH replacement.

These are process-tool tests, not another product stage or live provider mutation
trial. No new credentials, account scopes, provider settings, model launches,
GitHub message history or native agents are created by these modules. Existing
raw shell/connector routes remain available to native agents; no physical module
sandbox or credential-exclusive enforcement is claimed. Code/source checks do not
mark the overall Process4 bootstrap complete.

Final stream verification: `python -m unittest discover -s bootstrap -p 'test_*.py' -v`
passed **167 tests**; separate `bootstrap/grants` discovery passed **46 tests**.
This includes 19 new native governance/design-lane cases and two added grant/Broker
regressions. `git diff --check` passed. Output is bounded local test evidence in
`/tmp/p4-stream-c-{bootstrap,grants}-final.txt`, not a GitHub operational log stream.

Follow-up guard correction: non-ARCH branch writers and PR authors must have an
explicit matching assigned Subject branch. Native controller ARCH generation0 with
no branch remains compatible. Denial-before-adapter regressions cover missing and
wrong branch bindings. No provider trial or scope expansion was used.
