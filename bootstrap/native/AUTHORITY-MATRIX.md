# Native authority: observed controls and remaining routes

This is an engineering inventory under the owner's latest guidance, not a new
owner grant or a proposal to expand permissions. Scope: process3-probes only.
No credential values, unauthorized accounts or CivicSmith2 were inspected. No
settings, rulesets, grants, protected branches or releases were changed. Read-only
metadata is evidence of configured controls; it is not a dangerous-write trial.

## Requirement and acceptance

Ordinary JOBs have explicit module assignments, follow their ownership, and have
actual changed files checked before preservation/integration; unauthorized changes
must be rejected/corrected. Physical module sandboxing is optional. Consequential
operations retain the owner's stronger restrictions. A control is described as
exclusive only if alternative provider/tool routes are actually unavailable.

Existing evidence is preserved, not repeated: the real out-of-scope generated-file
rejection/correction and native broker permitted-state/forbidden-adapter checks are
in `../evidence/native-development-cycle/`. The current inventory adds actual
child tool availability and provider enforcement metadata.

## Four distinct authority layers

| Operation | Model instruction | Process4 controller | Independent provider control observed | Alternative route / limit |
| --- | --- | --- | --- | --- |
| Ordinary module edits | JOB writes only assigned paths; cross-module flaws go to ARCH | Checks committed history, index, working and untracked paths; rejects ownership violations and unsafe paths before checkpoint/integration | No module-specific path rule observed in queried branch rules | Child shell can edit shared files; correction/integration checks are the required control, not an OS module sandbox |
| Job/state branch updates | Use assigned experimental branches and typed controller | Hardcoded probes repository; native state/job/integration prefixes and exact SHAs; typed Broker requests | Active all-branch rules prohibit deletion and non-fast-forward updates; metadata says current user can never bypass | Child GitHub connector exposes create/update-ref and contents/commit tools; shell/gh also available. Their possible success beyond the controller was not exercised |
| Experimental working integration | ARCH uses controller plus existing pinned merge tool; JOB cannot merge | Actual ownership/module acceptance, current PR identity/head and authentic gate source checked; no raw merge fallback | Integration branch effective rules contain deletion/non-fast-forward restrictions only; no independently required gate or module ownership rule shown | Direct connector merge tool exists. Availability is not proof that a specific merge would succeed; provider does not encode the controller's working-branch ownership/gate policy |
| Main/tranche | Explicitly prohibited by this experiment | Native branch/base scope rejects main/tranche before adapters | Active process3 rules require PR, merge method merge and gate from GitHub Actions app15368; zero approving reviews required; current user can never bypass | Rules protect the update path, but do not independently express this assignment's absolute no-main-merge rule: a green eligible PR is a different case. No prohibited PR/update was attempted |
| Repository settings / permissions | Prohibited; do not expand grants | Closed native mutation schema has no settings/grant operation | Both gh and GitHub connector repo metadata report admin=false, maintain=false, push=true; legacy branch-protection read returned403 integration-not-accessible | This supports lack of repository administration, not an exhaustive denial proof for every setting endpoint. No settings mutation tried |
| Owner grant/process files | Never edit/expand authority or process pin without owner authorization | Protected metadata/process paths rejected in module changes; pin verified before merge | Main/tranche PR/gate rules apply when those refs are targeted; no owner-grant semantic rule shown | Raw filesystem/contents tools remain available. Instructions and checked integration are not platform-wide write prevention |
| Public release / production resource / unauthorized account | Prohibited | No native typed release/deploy/account operation | Not queried outside the probe repository; no production/account permission assumptions made | Generic shell/gh capability is available; actual release/other-account privileges were not probed. No inaccessible-resource or owner-account scope claim inferred |
| Credential use/disclosure | No credential reads/disclosure, invalid inherited-login retry, API-key inference or paid hosting | Verification uses a restricted environment/private home; controller routes approved provider operations | Hosted subscription authentication is service-managed; token rotation/credential-file protection not observable here | Child shell/tools are inherited; no exposed per-role credential/tool confinement setting observed. No credential file/value was read, and no safe canary is presented as proof of credential access |

## Actual read-only provider results

The child queried only `neobobkrause/process3-probes` metadata:

- Both raw `gh api` and GitHub connector `get_repo` report push/pull/triage true,
  admin/maintain false. Auto-merge is disabled. Connector and shell are distinct
  exposed routes; matching metadata is not a proof they have identical privileges
  for every endpoint.
- Ruleset `every-branch` (26389336), active, includes `~ALL`: deletion and
  non-fast-forward restrictions; `current_user_can_bypass: never`.
- Ruleset `process3` (26389189), active, applies to main/tranche: deletion,
  non-fast-forward, pull request and required `gate` check (integration15368).
  Required approving review count0; allowed merge method `merge`.
- Effective-main rules confirm both rulesets. Its first read returned503 and one
  read-only retry succeeded. Effective-integration rules confirm only every-branch.
- The old branch-protection endpoint returned403; that is not evidence that the
  branch is unprotected. Both branch metadata responses say protected=true because
  rulesets apply even where legacy protection reports enabled=false.

Raw bounded evidence: `../evidence/authority-assessment/actual-provider-metadata.json`,
`actual-ruleset-metadata.json`, `actual-effective-main-rules.json`, and
`actual-child-tool-inventory.json`. No heartbeat/message stream is written here.
These are a one-time meaningful authority assessment, not per-message GitHub records.

The historical `process3/process4/evidence/permissions_inventory.md` explicitly
could not read live provider settings. Its standing-grant source distinctions remain
useful, but its lack of live API access must not override today's actual metadata.
No historical product/Cloudflare permissions have been transferred to this experiment.

## Smallest justified controller correction

Code review found a concrete routing gap independent of OS module isolation:
`Cycle.__init__` checks the fetch URL of origin once, while `Provider.push` later
uses `git push origin`. A configured `remote.origin.pushurl`, multiple push URLs,
or URL push rewriting can select a different destination even when the fetch URL
still names probes. A typed request with repo=probes alone does not bind that
transport destination.

Recommendation sent to ROOT: validate effective push destination(s) immediately
before each push (`git remote get-url --push --all origin`), accepting only the
canonical probes HTTPS destination and rejecting unapproved/multiple destinations;
retain disabled hooks/fsmonitor and exact nonforce refspec. Use an isolated local
Git fixture and sentinel transport to show rejection before network access. Do not
perform a wrong-account push. Concurrent mutable Git configuration remains a
shared-workspace assumption, not a new security boundary.

That correction belongs to the existing code owner and is not implemented by this
read-only inventory. Parent owns the final adoption/test evidence.

## Practical operating recommendation

Keep native roles and their demonstrated reactive child communication. For ordinary
jobs use concise explicit ownership, controller checkpointing, actual diff checking,
and reject/correct unauthorized changes. Keep controller writes typed and fixed-scope,
including the destination check above. Preserve the existing provider rules as a
second layer; do not change them or request a wider account/token grant.

Clearly document that direct connector/CLI routes remain exposed but unauthorized.
Do not describe the broker as impossible to bypass. A literal non-bypassable
credential owner would require a supported platform tool/credential boundary absent
from the current child interface; that observation must not reimpose optional module
sandboxing or stop independent functional work. No elaborate persistence service,
GitHub message bus, paid VM or new machine policy is needed for this pragmatic model.
