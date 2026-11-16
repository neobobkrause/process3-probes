# Process4 Codex bootstrap probe

This is executable experimental process software, not adoption of draft 6 and not a claim that a Process4 tranche has run. Writes are hardcoded to `neobobkrause/process3-probes`, dedicated branches only. No merge, branch deletion, settings modification, Actions launch or Agents API is implemented.

## What runs

Python 3 standard library, Git, authenticated `gh`, and official `codex exec`. An ordinary Linux cloud machine hosts the supervisor and independent Git worktrees; the owner's computer is not used. Codex must report **Logged in using ChatGPT**. The child environment removes API-key/base-URL overrides, ignores user provider configuration, and forces ChatGPT login. Subscription limits still apply; a thread-start event does not establish successful inference.

The current managed task's original Codex home is read-only. For this task only, a writable `CODEX_HOME=/workspace/work/codex-runtime` references the existing auth file through a local symlink. Do not commit, print, upload, or copy authentication to GitHub. On another cloud machine use the documented Codex ChatGPT login flow; this symlink is not a portable login mechanism.

### Start small

Run from the implementation checkout on its dedicated branch. Choose a unique state suffix; `init` intentionally fails rather than overwrite an existing branch.

```sh
python bootstrap/coordinator.py --state codex/p4-state-MY-RUN init --base codex/process4-bootstrap-20261116
python bootstrap/coordinator.py --state codex/p4-state-MY-RUN declare bootstrap/examples/consumer.json
python bootstrap/coordinator.py --state codex/p4-state-MY-RUN assign bootstrap/examples/provider.json
python bootstrap/coordinator.py --state codex/p4-state-MY-RUN serve --runtime /workspace/work/p4-MY-RUN --seconds 300
```

The example starts **one** job. Do not raise live concurrency until one real Codex job completes. `declare` registers module users with no job. `assign` registers an assignment and its module declaration. `uses` names provider module IDs. Supply the complete module declarations **before** provider work starts. There is no selective interface analysis: each checkpoint changing a provider records an inbox notice for every declared user, including users without assignments. Duplicate `(provider, commit, user)` notices are suppressed; another changed commit creates another notice. Module-list-change semantics remain unsettled and are not invented here.

Assignments contain a unique ID, total-order position, owned paths, provider uses, exact work prompt, written completion condition, verification argv, and optional timeout. These are ARCH's technical inputs, not questions passed to the owner. A job does not wait for a provider with no ready work. Only explicit owner priority changes override module order. The experiment starts with one slot; owner control can set 1–8. One state branch is the account's scheduler; do not run separate state branches concurrently as independent schedulers and claim an account-wide cap. Multi-product allocation remains unresolved.

### Owner front door

This chat is the plain-language front door during the assignment. The executable control surface below is also available to a cloud coordinator/operator. A question in chat does not itself cause a build. Only explicitly marked instructions should be entered using `instruction`; text and date are preserved, with no invented owner decision.

```sh
python bootstrap/coordinator.py --state codex/p4-state-MY-RUN status
python bootstrap/coordinator.py --state codex/p4-state-MY-RUN control instruction --job provider --value 'Instruction: ...'
python bootstrap/coordinator.py --state codex/p4-state-MY-RUN control priority --job provider --value 10
python bootstrap/coordinator.py --state codex/p4-state-MY-RUN control interrupt --job provider
python bootstrap/coordinator.py --state codex/p4-state-MY-RUN control replace --job provider
python bootstrap/coordinator.py --state codex/p4-state-MY-RUN control stop
python bootstrap/coordinator.py --state codex/p4-state-MY-RUN control continue
python bootstrap/coordinator.py --state codex/p4-state-MY-RUN control retry --job provider
python bootstrap/coordinator.py --state codex/p4-state-MY-RUN control slots --value 2
```

Controls and progress live in `bootstrap-state.json` on the state branch, readable on GitHub from any device. Controls are read every 15 seconds by default. New instructions interrupt an active job and schedule a fresh session with the exact text, same durable branch and completion condition. `replace` likewise replaces, without calling an interrupted job complete. `interrupt` pauses until `retry`. `stop` persists across supervisor replacement and prevents starts; `continue` clears it but deliberately does not automatically retry blocked or paused jobs. Status includes attempts, checkpoints, thread IDs when observed, event counts, elapsed time, verifier results, and pending notices. It is an operational CLI, not a finished hosted conversational coordinator UI.

### Durable state, completion, recovery

GitHub's Contents API SHA is the state transaction's optimistic lock. Conflicts trigger a fresh read before pure state actions are retried; reservation conflicts likewise reread before dispatch. Other failures fail closed. A renewable 90-second lease prevents two active dispatchers using the same state branch. A branch and `running` reservation are durable before each launch. One job uses one new detached worktree per attempt and one dedicated remote branch across replacements. Each attempt starts a fresh Codex session, reading prior checkpointed files, instructions and notices; recovery does not depend on local Codex history or `resume --last`.

The process must exit successfully, emit `turn.completed`, and pass the assignment's explicit verification argv before its **bootstrap assignment** is `done`. `done` is not a module merge, tranche completion, or release. A zero exit or final prose is insufficient. Timeout and inference failure leave `blocked`. Interrupted work is checkpointed then paused/requeued as requested. A changed provider wakes a previously completed consumer assignment; an active consumer acknowledges only the notices in its own launch packet. New notices cannot disappear under its completion.

Owned paths are committed and pushed before recording completion. Jobs are instructed not to write outside them. This is an instruction boundary, not a proven Codex permission isolation or an additional product check. The host has repository access; it is not safe to expose this supervisor to untrusted public assignments. Acceptance commands are trusted ARCH/operator input, never arbitrary anonymous owner-web input.

A new supervisor claims an expired lease and returns abandoned `running` reservations to `ready`. It recovers from the remote checkpoint; changes lost with a host **before** a checkpoint cannot be recovered. If push or state write fails, completion is not reported. A later lease-holder reconciles from GitHub. State events are retained without pruning in this initial small probe.

```sh
# On a replacement cloud host, clone the implementation branch, authenticate GitHub
# and Codex with ChatGPT, then point at the SAME state branch:
python bootstrap/coordinator.py --state codex/p4-state-MY-RUN serve --runtime /workspace/work/new-runtime --seconds 300
```

`watch.py` is a cloud OS liveness helper: it runs the supervisor and replaces it after a nonzero exit, waiting 95 seconds for lease expiry. A bounded clean run exits normally. It does not start a second AI supervisor or silently undo a stop.

```sh
python bootstrap/watch.py --state codex/p4-state-MY-RUN --repo /workspace/process3-probes --runtime /workspace/work/p4-MY-RUN
```

This task has not provisioned a permanent server or enabled background hosting. Running a helper inside a managed task does not prove it outlives that task. An independently persistent cloud host/service and ChatGPT authentication usable there are prerequisites for unattended operation after this task ends. A service manager can host `watch.py`, with process-group cleanup on termination; no owner's computer and no GitHub Actions are needed. Such hosting has not been demonstrated here.

## Responsibility boundaries and limits

`REQUIREMENTS.md` distinguishes owner decisions, recorded decisions, technical choices and open proposals at authoritative commit `c11682ccf903dff83f09c7505fc366760481f2ad`. The current assignment overrides selective notices and older prohibitions on probe writes. It does not authorize adoption of unresolved draft proposals.

The implementation provides deterministic dispatch/recovery plumbing for ARCH, coordinator controls, and OS liveness. It does **not** yet establish independent Codex ROOT, watcher, ARCH and coordinator conversations, the hourly hosted wake, their replacement chain, PROCESS communication, a permission-checker equivalent, or all their authority boundaries. Names in the state explain responsibilities; they are not evidence of running standing-role sessions. Jobs receive their module restrictions and cannot launch sessions through this tool. The bootstrap never changes the process pin or owner approvals.

It does not implement product walks, deployment, product merging or releases. The three product tests remain module tests, internal walk, external walk. These bootstrap tests verify the process tool itself, as the definition permits, and introduce no additional product stage. No successful Codex job completion, concurrent Codex success or permanent cloud supervision may be inferred from fixture tests. Actual CLI process interruption/replacement is recorded separately from successful inference.

## Verify and inspect evidence

```sh
python -m unittest discover -s bootstrap -p 'test_*.py' -v
```

The unit tests explicitly use subprocess fixtures where needed; they are never represented as Codex sessions. See `EVIDENCE.md` for actual operations and precise remaining prerequisites.

## Supported execution mechanism research (16 Nov 2026)

Installed CLI: `codex-cli 0.167.0-alpha.4`; `codex exec --help`, `codex login status`, and an actual invocation were inspected. Official documentation checked:

- [Non-interactive mode](https://learn.chatgpt.com/docs/non-interactive-mode): `codex exec`, JSONL events, specific-session resume. Selected because it is the smallest subprocess interface. Fresh replacement from GitHub works without a local history database.
- [Authentication](https://learn.chatgpt.com/docs/auth): ChatGPT login provides subscription access; API-key login is usage billed. The bootstrap requires the former. Enterprise Codex access tokens are a documented option, not presumed available to this owner.
- [App server](https://learn.chatgpt.com/docs/app-server): a supported JSON-RPC interface with initialize, threads, turns, steering and interruption. It is a possible richer control transport; this implementation does not fabricate or claim to execute its methods.

No private Codex Cloud session-launch HTTP API, metered Agents API or Actions supervisor is used. Official CLI process termination is used for this subprocess transport's interruption; app-server `turn/interrupt` has not been executed.
