# Durable continuation handoff

Updated 16 November 2026 after the owner reported adding `chatgpt.com` and republishing the environment.

**Start here in the next Codex Cloud task.** The original execution assignment remains authorized. Continue implementation and actual demonstrations; do not stop at a plan or ask the owner for ordinary technical choices. Do not claim the complete Process4 system is established.

## Branch and pull request

- Repository: `neobobkrause/process3-probes`.
- Working branch: **`codex/process4-bootstrap-20261116`**.
- Draft PR: **[#268](https://github.com/neobobkrause/process3-probes/pull/268)**, targeting main for eventual review only. Do not merge or mark it ready.
- Implementation/evidence commit before this handoff: `daf6edb47b4f798fd79f4056455e472302db79c7`; this handoff is committed afterward on the same branch. Fetch its latest remote tip rather than pinning to the earlier implementation commit.
- Authoritative research, read-only: `neobobkrause/process3`, `process4`, `c11682ccf903dff83f09c7505fc366760481f2ad`, folder `process4/`.

All useful code, verification and evidence are tracked under `bootstrap/`. No intermediate runtime directory or local authentication file is required to reconstruct the assignments. Credentials must never go into GitHub.

## Owner update and actual environment state

The owner wrote: "I have added chatgpt.com to the environment's permitted domains and republished the environment."

The owner then directed this task to commit/push useful work, record a durable handoff, identify the branch/PR, leave main alone, and finish independent work under existing restrictions. This does not authorize merges, settings changes, branch deletion, product writes or metered inference.

After that update, the environment-status tool still reported **current observations, enforced revision 1**, custom hosts `api.github.com`, **`chatgpt.com` absent from effective hosts**. Republishing the source configuration has not changed this existing task. The next task must be created from the newly published configuration; do not keep retrying blocked inference here or ask the owner to repeat the same configuration action.

The first action there is to verify the new instance's current enforced policy includes `chatgpt.com`, then test the actual Codex client. The published configuration has not been observed from a new instance yet, so working inference remains unproven. If another destination is concretely denied (for example token refresh), identify it from actual client evidence before requesting a narrowly necessary grant; do not preemptively widen the network.

## Completed and verified

- Implemented `coordinator.py`: real `codex exec --json`, enforced ChatGPT authentication, independent attempt worktrees and dedicated persistent job branches, GitHub state transactions and lease, total-order scheduling with explicit priority, assignments and acceptance commands, timeout/unfinished statuses, checkpoints, interrupted-session replacement and stop/instruction/slot controls.
- Implemented all-declared-user notices. Persistent inboxes include declared modules without open jobs; changed checkpoints notify all users, with idempotent keys. A new notice arriving during a consumer's active assignment cannot be incorrectly acknowledged at that assignment's completion.
- Implemented `watch.py`: a bounded OS-process liveness helper. This is not a proven permanent cloud ROOT/watcher arrangement.
- **14 bootstrap tests passed** on the final software, covering completion failures, transaction/control conflict handling, unfinished recovery, all-user notices, exact control text, real subprocess interruption and watchdog restart. These are tool tests, not new product-test stages. Fixture events are never counted as Codex inference.
- Executed real GitHub storage rehearsal twice, including the final code: assignment/declarations, stale-SHA rejection, instruction preservation, durable stop across replacement, actual harness-authored provider checkpoint push, three pending downstream notices, fresh-runtime reconstruction from GitHub. Both rehearsal states are stopped, lease released. Harness work was not represented as Codex-authored or completed inference.
- Launched **four sequential real Codex CLI attempts**, all under ChatGPT login. Captured actual thread IDs/events. Attempt 1 timed out and remained blocked; attempt 2 was interrupted for an instruction, attempt 3 replaced it from the same durable branch/checkpoint and was stopped. Attempt 4 verified the fix for a control/state-write race and stopped cleanly. **No attempt completed a successful inference turn.** Actual requests were blocked with HTTP CONNECT 403.
- Resolved the original read-only Codex-home problem by using a writable runtime with a local symlink to the existing ChatGPT auth file. This was not credential export or an API-key workaround.
- Recorded research and authority distinctions in `REQUIREMENTS.md`, operating instructions in `README.md`, and actual operations/limits in `EVIDENCE.md` plus `evidence/`.
- Opened draft PR #268 and verified it is open/draft and points to this dedicated branch. Main remains `f353d60ef6b00da3a040b048788cb571a2870e64`.

## Exact durable operational state

Live probe: [`codex/p4-state-bootstrap-20261116/bootstrap-state.json`](https://github.com/neobobkrause/process3-probes/blob/codex/p4-state-bootstrap-20261116/bootstrap-state.json).

- `stopped: true`, `lease: null`, `slots: 1`.
- Job `provider`: `status: paused`, `attempt: 4`, completion not verified, blocker is subscription inference denied by the current cloud outbound policy.
- Job branch: `codex/p4-job-bootstrap-20261116-provider`.
- Last remote checkpoint: `d5c6f2a628daff023ba6e63864755fa14acafadb` (initial implementation base; no Codex product work occurred).
- Provider has `toy/provider` ownership, `value() == 42` and nonempty passing job-written module tests as completion; consumer is declared as its downstream user, without a consumer assignment yet.
- Timeout is currently **45 seconds**, deliberately short for the blocked probe. Raise to **180 seconds** before the first reachable development attempt; that is a delegated technical adjustment.
- Rehearsal instruction retained in job text is explicitly labeled a bootstrap control rehearsal, not a new owner product decision.
- `external_dependencies` records the old-instance policy failure and the owner's republish update/next-task requirement.

Storage rehearsal state: `codex/p4-state-storage-final-20261116`. Its branch checkpoint is `8873bd7d01ec169cf32b349aadc4a08f8a57a64c`, three user notices are pending, unfinished harness assignment is ready under a durable stop. Earlier rehearsal branches remain because deletion is prohibited. **Do not resume storage harness assignments as real Codex development jobs.**

All spawned Codex CLI processes were terminated, and no hosted automation, permanent server or background supervisor was left running.

## Exact continuation steps in the new task

1. Read the original assignment, this handoff, `README.md`, `REQUIREMENTS.md`, `EVIDENCE.md`, and applicable instructions. Preserve all original prohibitions. Inspect the new environment's current status and network policy. It must be the newly published environment, not this old task.
2. Use the existing probe checkout if present and clean; otherwise clone only the probe repository. Fetch the working branch and work on its latest tip. Never switch to main to make changes. For a fresh checkout:

   ```sh
   git clone --branch codex/process4-bootstrap-20261116 --single-branch https://github.com/neobobkrause/process3-probes.git /workspace/process3-probes
   cd /workspace/process3-probes
   git status --short --branch
   gh auth status
   codex --version
   codex login status
   python -m unittest discover -s bootstrap -p 'test_*.py' -v
   ```

3. If the supplied Codex home is read-only again, create a writable runtime **in the new task** and reference that task's existing auth file. Do not assume an old task's `/workspace/work` or `/home` file exists. Do not print credential contents. A local setup that fails if no existing auth is available:

   ```sh
   mkdir -p /workspace/work
   python - <<'PY'
   import os
   from pathlib import Path
   source = Path(os.environ.get('CODEX_HOME', str(Path.home()/'.codex'))).resolve()
   runtime = Path('/workspace/work/p4-codex-runtime')
   runtime.mkdir(parents=True, exist_ok=True)
   credential = source/'auth.json'
   if not credential.is_file():
       raise SystemExit('No supplied ChatGPT auth file: use supported Codex ChatGPT login on this cloud host; do not use an API key.')
   target = runtime/'auth.json'
   if not target.exists():
       target.symlink_to(credential)
   print('Writable runtime prepared; no credential content displayed.')
   PY
   CODEX_HOME=/workspace/work/p4-codex-runtime codex login status
   ```

   If normal supplied authentication works without this setup, continue using it. No environment-variable name should be repurposed for scratch values; only set `CODEX_HOME` to the actual Codex runtime.

4. Inspect the latest durable state, extend this technical probe's timeout, record that the new environment is being verified, then explicitly resume the existing stopped assignment:

   ```sh
   cd /workspace/process3-probes
   python bootstrap/coordinator.py --state codex/p4-state-bootstrap-20261116 status
   python - <<'PY'
   import sys
   sys.path.insert(0, 'bootstrap')
   import coordinator as c
   def update(s):
       s['jobs']['provider']['timeout'] = 180
       s['external_dependencies']['codex-inference']['status'] = 'retesting-on-new-instance'
       c.event(s, 'technical-probe-timeout', job='provider', seconds=180)
   c.GitHub('codex/p4-state-bootstrap-20261116').mutate(update)
   PY
   python bootstrap/coordinator.py --state codex/p4-state-bootstrap-20261116 control continue
   python bootstrap/coordinator.py --state codex/p4-state-bootstrap-20261116 control retry --job provider
   CODEX_HOME=/workspace/work/p4-codex-runtime python bootstrap/coordinator.py --state codex/p4-state-bootstrap-20261116 serve --runtime /workspace/work/p4-new-task --seconds 300
   ```

   Adapt only `CODEX_HOME` if step 3 was unnecessary. The supervisor fetches the old remote job branch into a new attempt worktree and starts a fresh conversation. It does not require the old task's Codex history.

5. Read actual JSONL/error logs and remote state. A thread ID, process exit or prose is not success. Require `turn.completed`, successful process exit, a passing nonempty module test suite with the actual `value() == 42` acceptance command, and a pushed remote checkpoint. Fix implementation bugs within delegated authority; preserve failed attempts as evidence. Clear the durable external dependency only after successful inference is observed.
6. Then add a real consumer assignment that uses the provider and acts on its notice. Prove changed-provider fanout, in-development interruption/replacement and fresh-runtime reconstruction. Begin with one successful job, then modest concurrency. Keep module work on owned paths and dedicated branches. Do not treat prior fixture or harness work as Codex proof.
7. Implement/rehearse the remaining standing-role orchestration and job-PR lifecycle as needed; continue the original assignment without waiting for another owner prompt. Update this same draft PR with code, tests, actual evidence and unresolved dependencies. Do not merge anything.

## Unresolved work and dependencies

- Successful subscription inference and actual module development remain the immediate prerequisite; republished network access is owner-reported, new-instance execution is not yet observed.
- Independent ROOT, watcher, ARCH and coordinator conversations and communications, hourly safety wake, role replacement chain and PROCESS routing remain unimplemented/unproven beyond current dispatch/control/liveness plumbing. Do not claim role labels in a state file are running roles. These are technical implementation tasks once inference can be tested, not owner choices to ask back.
- Module-job draft PR lifecycle and ARCH merge machinery remain incomplete. The initial implementation draft PR exists. Merges and main/tranche changes are prohibited by this assignment, so do not run historical trial-plan merge rehearsals under it.
- Meaningful owner progress/control currently works through this conversation plus GitHub-backed CLI/state; permanent hosted conversational availability remains unproven.
- Permanent independent cloud hosting beyond a managed task remains an external infrastructure dependency. No cloud provisioning identity or persistent-service tool is configured here. Do not use the owner's computer or Actions as fallback. Decide implementation details yourself if a permitted persistent cloud facility is available in the new task; otherwise record the precise minimum provision needed.
- Job instructions/workspace sandbox do not demonstrate equivalence to Claude's owner-authored approvals/deny-list/permission checker. Measure Codex behavior and preserve authority boundaries; do not silently adopt different owner rules or fabricate settings compatibility.
- Multi-product allocation and draft-6 owner proposals remain as documented in `REQUIREMENTS.md`. The three product tests stay module tests, internal walk and external walk. No toy/harness result establishes a clean real tranche or a Process4 adoption decision.

The remaining system has not been declared complete. This is the recoverable starting point, with functioning software and explicit measured limits, for the next authorized task.
