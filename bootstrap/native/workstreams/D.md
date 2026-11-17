# Stream D — walks, development service, rounds and development-release preparation

Owned branch: `codex/p4-stream-d-20261116`; baseline `c901c9f`.
Owned files: `native/{walks,development,releases}.py`, corresponding three test files,
and this document, all relative to `bootstrap/`. Shared controller/CLI belongs to
the bootstrap integrator. No product source, provider or deployment was modified
by this workstream. ROOT mapping approval is already given and is not a gate here.

## Integrator interfaces

These APIs use plain dictionaries/JSON-compatible plans. They authenticate nothing:
the protected/trusted controller must derive identity from actual native events,
fetch current Git facts and keep agent packets separate from trusted arguments.
No helper starts inference, native agents, servers, GitHub operations or a cloud
resource. No GitHub message transport is introduced.

### Product evidence

`walks.start_round(state, head, modules=None)` starts or idempotently returns the
latest round at an exact integration SHA. Default module scope is actual assigned
jobs, not every declared consumer: it does not invent a report-module assignment.
The round also snapshots each required job's owned paths. Trusted facts and stored
proof must match the current assigned job paths and current declared ownership;
a same-head assignment-path change invalidates the round instead of relabeling old
acceptance. At a new head it clears stale module/walk receipts and carries unresolved flaws.
Only current-round state is retained; source commits and meaningful report references
remain in Git. Outstanding flaws are bounded to 256; capacity errors preserve work.

`walks.validate_module_evidence(evidence, expected_head, module=..., trusted=...)`
requires actual-observation metadata, positive test count, successful exact command
argv, integration head and tested head. The trusted supervisor argument must contain:

- `accepted: True`, `checkpoint`: the latest accepted job checkpoint.
- `owned_paths`, `tested_trees`, `current_trees`: same complete owned-path key set,
  exact tree SHAs and equal tested/current trees.
- `required_dependencies`: explicit declared provider list (empty for no providers);
  `tested_dependencies`, `current_dependencies`: equal complete provider tree snapshots.
  Missing providers cannot be omitted from both maps to bypass stale-dependency checks.

An ancestor checkpoint alone cannot show that tests still cover the current code.
This interface explicitly rejects a newer module/dependency tree with stale tests.
The tested-tree and dependency-tree values must come from the workspace actually
used by that module command. Never label current provider trees as tested if tests
ran before provider integration; refresh the trusted baseline and rerun that module
when facts differ. The integrator can obtain tree IDs using exact Git revisions/owned paths and must
not treat an agent-supplied boolean as this provenance. These are acceptance controls,
not another product-test stage.

Evidence fields: `observed=True`, `module`, actual `actor`, `source` report/receipt
reference, `observed_at`, `integration_head`, `tested_head`, integer `returncode=0`,
positive integer `test_count`, list `command`. `observed_at` records the actual
observation, not a guessed historical run time. Existing old job state without a
timestamp is not retroactively assigned one. A fresh controller run can capture
these facts at verification time. `record_module_evidence(state,module,evidence,
trusted=...)` stores normalized accepted evidence and its provenance in the latest
round. Later changes to the accepted job checkpoint invalidate the stage.

`walks.record_walk(state, stage, evidence)` accepts **only** `internal_walk` and
`external_walk`, after current module evidence. Fields: actual observation metadata,
`head`, `design` (UX Screens/Journeys reference), nonempty `coverage`, `outcome`
(`clean` or `flaws`), explicit `flaws` list and optional `resolved_flaws` map from
prior flaw ID to actual rewalk observation reference. Each flaw has `id`, declared
`module`, `description` and `evidence`. It cannot silently change module ownership.
External evidence requires a current clean internal walk and an observed running
loopback deployment receipt. Plans, future walks and pasted passing prose are not
receipts. A recorded same-head flaw cannot be erased by replacing the result with
`clean`; a corrective integration/new round and explicit rewalk are required.

`walks.assess_round(state, expected_head=None)` returns current stage, correction
requests by module, or `clean`. Provide the freshly observed head in live use.
Unassigned declared modules yield `needs_arch_assignment`, never a fabricated JOB.
Corrected rounds cannot finish until carried flaws have explicit rewalk coverage.
Owner stops return a hold without dispatch or falsely marking completion.
No extra security/review/release test stage exists: stages remain module tests,
internal walk, external walk. Only latest-round evidence is retained.

### Development service

`development.plan_deployment(head, runtime=..., worktree=..., entrypoint=...,
provider_path=..., observed_head=..., host='127.0.0.1', port=8766)` supports the
existing Python proof-app CLI. It requires a fresh trusted HEAD match, existing
source entrypoint/provider paths contained in the selected deployment worktree,
and worktree inside the explicit runtime. Paths/URLs cannot expand to another
repository, credential directory, public interface or paid infrastructure. It
returns exact argv, cwd, a minimal credential-free environment, loopback URL and
plan digest, with `requires_actual_start_and_probe=True`; it does not execute them.
The native ARCH/integrator starts the service through the normal provided command
tool and records actual process/service observations. The plan explicitly sets
`environment_mode='replace'`: execute with `env=plan['environment']`, never merge
with `os.environ` or use a shell-prefix assignment that leaves inherited provider
credentials available. Before starting, create the HOME/CODEX_HOME directories
inside the selected runtime with owner-only permissions. No credentials are copied
or read. Runtime paths and launch environment are trusted controller inputs. Filesystem/tool confinement
is not claimed by environment hygiene or path validation.

`development.validate_deployment_receipt(receipt, expected_head, plan=None)` requires
actual actor/source/time, exact SHA, `status='running'`, explicit-port
`http://127.0.0.1:<port>/` and a successful actual `http_status`. With a plan, it
also checks exact URL and plan ID. This binds receipt metadata; the trusted caller
must verify the observed process actually serves that checked-out code. It is not
proof created by testing a plan. Public URLs, userinfo, query/fragment tricks and
hostname suffixes are rejected. No deployment is executed in the fixture suite.

### Development release

`releases.prepare_development_release(state, expected_head=..., release_id=...)`
returns a nonpublic manifest only after a current clean three-stage round.
`releases.stage_development_release(manifest,destination,runtime=...)` writes at
most 64KiB JSON inside the selected runtime, atomically creates a new file and
refuses conflicting existing artifacts. Equal data is idempotent; no archive,
installer, provider upload or publication is claimed. The runtime artifacts should
be retired with their completed run, not archived per message.

`releases.publish_release(...)` **always denies**, including a caller assertion of
approval. A future public-release action needs independently observed owner approval
and a separately authorized adapter; a clean round does not grant publication.
No owner grant, protected branch/settings, existing Claude implementation or process
pin was changed.

## Verification and live-pilot boundary

The focused suite verifies 15 control-plane cases: stale module/dependency tests,
missing/prose evidence, stage order, exact SHA, flaw-to-job routing, new-round rewalk,
prior flaw closure, newly assigned scope changes, owner stop, loopback/path/symlink limits, real-receipt requirements,
manifest idempotency/bounds and unconditional publication denial. These are code
fixtures, not product module tests, walks, service deployment or a clean tranche.
Module failures are not walk flaws. Do not manufacture a failed walk or skip the
module prerequisite to claim multi-round behavior: only an actually observed walk
flaw can demonstrate the corrective-round path. Otherwise retain the fixture proof
and explicitly state that live flaw closure was not observed.
The integrator must wire the components and ARCH must execute the combined pilot
before any live claims. Product execution remains held until four-stream integration.
