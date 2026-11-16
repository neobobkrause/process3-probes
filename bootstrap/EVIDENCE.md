# Executed evidence and recoverable state

16 November 2026. This is an initial bootstrap deliverable, **not successful proof of the complete Process4 development system**. No successful Codex inference turn or completed Codex development assignment was obtained. No concurrency increase was attempted.

## Read and selected

Authoritative research: `neobobkrause/process3`, branch `process4`, resolved to `c11682ccf903dff83f09c7505fc366760481f2ad`. Read the applicable repository instructions, sixth draft, all owner-word files through the reading worker required by HANDOFF, roles/foundations/decision evidence and existing trial plan. Read the existing probe `CLAUDE.md`, README and `process/config.json`; none was edited. `REQUIREMENTS.md` records the hierarchy and unsettled proposals. Nothing in draft 6 was treated as adoption authority.

Official Codex authentication, non-interactive execution and app-server documentation were checked; links and technical selection are in README. Installed CLI help was also inspected. Selected actual `codex exec --json`, with fresh sessions on replacement, ChatGPT auth enforced, independent Git worktrees, and GitHub durable state. Neither Agents API nor an undocumented hosted launch endpoint was used.

## Actual operations

| Capability | Executed result | Evidence |
| --- | --- | --- |
| Bootstrap verification | 14 tests passed, including false completion rejection, new notice during an active assignment, CAS/control race regression, real OS subprocess interruption and watchdog replacement | `evidence/unit-tests.txt` |
| Subscription authentication | Actual CLI reported `Logged in using ChatGPT`; API-key auth refused by tests | `evidence/auth-method.txt`, `cli-version.txt` |
| Real Codex job start | Four sequential CLI attempts from the implemented supervisor, independent attempt worktrees, same dedicated job branch; thread IDs recorded. No completed turn | `evidence/codex-attempts.json`, live state snapshots |
| Supervision of failed inference | Attempt 1 timed out; assignment was blocked, not done; checkpoint pushed before result recorded | `evidence/live-run.txt`, `state-after-run.json` |
| Real interruption and replacement | Attempt 2 received a control-rehearsal instruction; CLI process group was terminated; attempt 3 started fresh from the same checkpoint/branch. Neither performed successful inference | `evidence/interruption-run.txt`, `state-after-controls.json`, `codex-attempts.json` |
| Stop/control race | Initial run exposed concurrent state-write failure. Fixed path reread GitHub and honored stop, pausing attempt 4 with no completion claim | `evidence/control-race-fixed-run.txt`, `state-final.json`; regression test |
| Durable GitHub assignment/control | Actual Contents API writes and rejected stale-SHA update; exact instruction retained; stop survived replacement | `evidence/github-storage-final.txt` (and earlier `github-storage.txt`) |
| Branch checkpoint and reconstruction | Real Git commit/push of explicitly **harness-authored** provider file, reconstructed in fresh runtime from remote branch without Codex session history | Same storage evidence |
| Notify every declared user | Actual harness-authored provider checkpoint recorded three pending downstream inbox notices, including users with no open jobs; duplicate call produced no duplicate notices | Same storage evidence |
| Increased inference concurrency | Not attempted because one successful job has not yet completed | No claim |
| Standing-role chain/permanent hosting | Not demonstrated | Prerequisites below |

The storage rehearsal file says it is harness-authored. It is **not** a simulated Codex result and was never marked a completed Codex assignment. Fixture events used by unit tests are explicitly labeled and are not counted as actual operations by Codex.

## Durable locations and final state

All writes are in `neobobkrause/process3-probes`. No merge, main push, branch deletion, repository-setting change, CivicSmith2 write, or authoritative repository write occurred. No workflow was invoked as supervisor or session launcher.

- Implementation branch: [`codex/process4-bootstrap-20261116`](https://github.com/neobobkrause/process3-probes/tree/codex/process4-bootstrap-20261116).
- Live Codex probe state: [`codex/p4-state-bootstrap-20261116/bootstrap-state.json`](https://github.com/neobobkrause/process3-probes/blob/codex/p4-state-bootstrap-20261116/bootstrap-state.json).
- Codex job branch: [`codex/p4-job-bootstrap-20261116-provider`](https://github.com/neobobkrause/process3-probes/tree/codex/p4-job-bootstrap-20261116-provider).
- Storage rehearsal state: [`codex/p4-state-storage-final-20261116/bootstrap-state.json`](https://github.com/neobobkrause/process3-probes/blob/codex/p4-state-storage-final-20261116/bootstrap-state.json), with its checkpoint branch in the job record.
- Earlier storage rehearsal: `codex/p4-state-storage-20261116` and `codex/p4-job-storage-20261116-storage-provider`, retained per the no-deletion rule.

Final live probe state is **stopped**, provider assignment **paused**, attempt **4**, lease released, no verified completion, checkpoint `d5c6f2a628daff023ba6e63864755fa14acafadb`. All probe-launched Codex CLI processes and the standalone preflight CLI were terminated. No permanent background service, automation or external infrastructure was installed. Storage rehearsals are also stopped and their leases released; their harness assignments remain unfinished/ready under the stop.

The main ref was `f353d60ef6b00da3a040b048788cb571a2870e64` at initial read; `evidence/main-ref-after.txt` records the final ref for comparison.

## Blocking dependency and smallest resume action

The current managed cloud instance reports a current, enforced restricted outbound allowlist with GitHub/package domains, but without `chatgpt.com`. The actual Codex client received **HTTP CONNECT 403**, fell back from WebSockets to HTTPS and still could not complete inference. This is a destination-policy block, not evidence of an exhausted subscription or bad login. The first read-only-home error was resolved locally; it is not the remaining blocker.

No environment-change tool is exposed here. The owner was asked once, while independent work continued, to add **`chatgpt.com`** to this running task's allowed domains while retaining existing grants. This is an environment dependency, not a technical design choice delegated back to the owner. The runtime skill's `environment-changes.md` says that when the tool is unavailable the user can edit the running environment through its settings. No attempt was made to bypass the enforced policy or switch to metered inference.

After the domain grant is applied, check current environment status, then resume the **same** state with:

```sh
cd /workspace/process3-probes
python bootstrap/coordinator.py --state codex/p4-state-bootstrap-20261116 control continue
python bootstrap/coordinator.py --state codex/p4-state-bootstrap-20261116 control retry --job provider
CODEX_HOME=/workspace/work/codex-runtime python bootstrap/coordinator.py --state codex/p4-state-bootstrap-20261116 serve --runtime /workspace/work/p4-jobs --seconds 300
```

The example timeout remains 45 seconds in durable state from the blocked probe. If a successful reachable model needs longer, ARCH can revise that technical assignment timeout in the state transaction; this is not a product requirement change. A fresh run can use a longer timeout in its assignment JSON. Do not use a short timeout's failure to claim the model cannot do the work.

Next proof: one real provider job completes, then a consumer job acts on its durable notice, interruption/replacement while actually developing, fresh-host recovery, and only then modest concurrent successful jobs. No additional permission to continue ordinary probe development is needed; the assignment already authorizes it.

## What remains unproven, beyond the domain grant

1. Independent Codex ROOT/watcher/ARCH/coordinator conversations, messages and the replacement chain; owner-facing hosted conversational access; hourly wake. Current code supplies dispatch/control/storage/liveness plumbing and the current chat is the front door. State role labels are not running sessions. These require reachable subscription inference and further implementation/rehearsal, **not an owner design choice**.
2. Supervisor survival beyond this managed task and whole-host loss. A persistent independent cloud host/service with GitHub write access, approved ChatGPT authentication and allowed Codex endpoints must exist. This environment provides no cloud infrastructure identity or persistent-service provisioning capability; a local watcher cannot establish indefinite hosting. The owner's computer is not an acceptable fallback. A provisioned cloud runtime is the smallest external prerequisite; the implementation checkout and state URLs above provide the resume point.
3. Codex equivalence to Claude's approvals/deny-list/automatic-permission arrangement. CLI workspace sandbox and instructions were selected, but successful inference and attempted module work are needed to measure behavior. Owner approvals and repository settings were not altered. Do not treat Claude's `settings.json` as Codex enforcement.
4. Module-job pull-request lifecycle and ARCH merges, walks/deployment, release, PROCESS interactions and a clean real tranche. They are not implemented/proven by this bootstrap. Product tests remain the specified three. Historical trial-plan merges and main/tranche promotion are **excluded by this assignment**, not pending permission requests. No result here demonstrates full product-process adoption.
5. Cross-product account-wide allocation, watcher creator and other unresolved owner proposals remain as recorded in `REQUIREMENTS.md`. No ordinary bootstrap choice has been sent to the owner for decision.

These are explicit limits, not success claims. The draft PR contains executable software and actual failed/successful operation evidence so work can resume without repeating this investigation.
