# [file] codex_context_fidelity_research_handoff.md (continued)

7. Evaluate a canon-authority map that identifies source precedence and scope without becoming a substitute summary for full reading.
8. Verify inactive chat archive, transcript retrieval and unarchive, and separately test support for native subagents. Completed short-scope workers do **not** need to stay alive after assignment completion.

## Source vs platform evidence

The assistant-generated standalone Markdown research report in the originating chat, named `process4_context_fidelity_research.md`, is not automatically present in an independent session's workspace. The owner can attach it if necessary. Do not claim to have read it unless supplied.

OpenAI documentation starting points (verify current contents):
- https://developers.openai.com/api/docs/models
- https://learn.chatgpt.com/docs/config-file/config-reference
- https://learn.chatgpt.com/docs/agent-configuration/agents-md
- https://learn.chatgpt.com/docs/hooks
- https://learn.chatgpt.com/docs/developer-commands
- https://learn.chatgpt.com/docs/agent-configuration/subagents

All output belongs to experimental process research, not product development: do not change CivicSmith2, `main`, owner grants or any existing Claude Code runtime/configuration.


# [file] account-switch-review.md

Account switch review, 5 Nov (coordinator session_018BhcecCMP7CZRbiR8kruPn). Bob asked why the switch went badly and to fix it so the next one works.

TIMELINE (UTC)
- 05:44 Bob: stop all work for the switch. Old coordinator stopped tasks and sessions, wrote handoff c.
- 05:52 new coordinator on the new account. 05:55 blocked: the account had no GitHub connection. Bob connected it at 05:59.
- 05:59-06:16 ids, ROOT, BOB, MERGER, watcher and tasks started. Every push and merge went as neobobkrause, the repos' owner and admin.
- 06:19 the first setup check (pin move) refused: `account` needs a non-admin collaborator. 06:23 every job start refused for the same reason. 0/20.
- 06:37 Bob closed everything again; the new coordinator started with civicsmith attached at 06:43.
- 06:50-06:58 roles started twice over: four start checks failed because the tranche moved under them.
- 07:07 BOB's first --ready broke its own shallow clone (parallel git); 07:10 BOB had paged 1,843 sessions to count 7.
- 07:12-07:28 the train stalled in a shallow clone, then waited 9 min for its own dead lease.
- 07:18 first job live. 07:28 train running.
- Cost: 0 jobs live 05:44-07:18 (94 min at 0/20, against 19/20 at 05:20). No train land 05:47-07:28 apart from PR 391 at 06:32.

WHY (root causes, not symptoms)
1. No preflight. The process has setup check, but nothing made it the first act of a new account. GitHub not connected, and GitHub connected as the wrong user, were each found by the first act that needed them, after roles and pushes had started.
2. Account-held state was not written down where the new account can read it. Scheduled tasks, live job sessions and role addresses live on the Claude account. The old account's task prompts were unreadable from the new one and were rebuilt from prose; 13 job sessions were stranded and each needed a hand restart; ~40 reports stayed addressed to dead sessions.
3. No order for the restart. Roles were started while the coordinator's own id and pin merges were still moving the tranche, so their start checks failed (four times).
4. Fresh-start defects that only bite on a cold start: a shallow MERGER clone (fixed, PR 148), a killed train cannot retake its own lease (9 min), BOB counts sessions by paging the whole account history (~5 min every wake), a job branch left holding the train's merged-result push needs --fresh-branch by hand (plane), BOB ran git in parallel in one clone.
5. The coordinator held three repositories, so its outward acts raised Bob's permission dialogs (handoff e). Now one repository.

FIX (being built in process3)
- build/account-switch: `p3 switch out` on the old account writes a manifest to the state branch (every scheduled task's name, schedule, prompt and role; every live job with module, branch, PR and state; role addresses; messages in flight), stops the train and releases its lease, and prints the stop acts in order. `p3 switch in` on the new account is the first act: preflight (GitHub reachable, acting user is the collaborator not the admin, push reachable on each repo, approvals hash) and refuses to go on if any fails; then prints the restart in order: coordinator ids, wait for a quiet tranche, ROOT, BOB, MERGER, watcher, the tasks recreated from the manifest bound to the new sessions, every recorded job restarted in one command release-first, then --ready, then old messages re-addressed. A runbook in rulebooks.
- build/restart-speed: session count from the start rows (no history paging), a train can retake its own session's lapsed-process lease, role start checks re-anchor to the tip as job start does, a job whose branch holds the train's merged-result push gets a fresh branch on its next start without a hand choice, and BOB's rulebook: one git user per clone, reviewers in their own clones.


# [file] account-switch-canary.md

# Account switch: inventory, canary and downtime (R16, 6 Nov)

Bob, 6 Nov: "the last account switch didn't go well at all. So I wonder if there's a way to anticipate or test for issues related to account switching now so that we're ready when the time comes." The runbook is rulebooks/account-switch.md.

## What the old account holds that git does not

All tests were run on 6 Nov from a builder session on the current account (creator 3a2e701f…).

| Item | Test now | Result 6 Nov | Switch step | Who |
|---|---|---|---|---|
| Scheduled tasks | list_triggers, enabled only | 7 enabled: the hourly flow check, the Phase 1 and 2 survival reads (all three the coordinator's), BOB's layer 9 check-in, sweep (ROOT), watcher; plus Bob's alpha-pipeline-runner, which is not the process's | Switch out step 3 switches them off; switch in (d) recreates them | Coordinator; alpha-pipeline-runner is Bob's |
| Role, job and lane sessions | `switch out --dry-run` on the copy | BOB, ROOT and the watcher (the MERGER then, gone with PR 191); 8 live jobs; 3 lane seats (investigation, publication, ux) and 1 open ask; layer 9 open; 16 old sessions named | Switch out stop acts; switch in (c), (e), (f), (h); `switch/retired.json` ends their seats | Coordinator, ROOT, BOB |
| Unanswered messages | The same dry run | 211 in all. 201 are to BOB: 147 refusals from the former MERGER and job reports back to 3 Nov | Switch in (g): those to BOB stay in the record for `status --role bob`; about 10 others are resent | Coordinator |
| GitHub identity | `switch in --preflight` on the copy, the probe and process3 | ok: acting as civicsmith (the process's GitHub account until 6 Nov; now believeinoakland); push true, admin false on all three; push dry run ok | Bob connects GitHub as civicsmith on the new account | Bob |
| Claude GitHub App | The same preflight (its push dry run) | ok on this account | Bob installs it for the three repositories | Bob |
| Cloud environment | get_environment | BioDefault (personal): unrestricted network; walk-certificate setup script; 1 network secret (api.cloudflare.com); variables BIO_*, CF_*, CLOUDFLARE_*, GITHUB_TOKEN, JOURNEY_*. A personal environment does not move with the account | Bob recreates it with the values only he holds | Bob |
| Cloudflare | GET api.cloudflare.com/client/v4/user/tokens/verify | 200 | Bob: the Cloudflare connector or the environment's network secret | Bob |
| Google Drive | list_recent_files | ok; the files are owned by neobobkrause@neologic.com | Bob connects Drive on the new account | Bob |
| claude.ai documents | Docs read and update | Read and write ok on this account (P24 and P25 written 6 Nov). The documents belong to this account and are shared by link for viewing, so the new account can read them but not yet write. Only the canary can test that | Bob gives the new account edit access, or the coordinator re-creates the documents on the new account from the last read | Bob |
| Docker Hub, GHCR, Cloudflare account resources | None needed | They are reached by the repositories' workflows and the account token, not by the Claude account | Nothing | — |

## Canary: Bob, on the target account, days ahead

1. Sign in to the target Claude account. Connect GitHub (claude.ai, Settings, Connectors) as **the process's GitHub account (now believeinoakland)**, never as neobobkrause, the repositories' owner.
2. Install the Claude GitHub App for civicsmith-copy, process3 and process3-probes.
3. Recreate the cloud environment BioDefault (network, setup script, variables, the api.cloudflare.com network secret), and connect Google Drive and Cloudflare.
4. Share the Foundations and the Ledger map (and the lanes' design artifacts) with the target account with edit access. Open each one there.
5. Check that the copy's `.process` pin includes process3 R16 (`switch in --preflight` must exist there). Then start ONE session on the target account, on civicsmith-copy, in that environment, with this prompt:

   > Read-only canary for the account switch. Change nothing: no push, no session, no task, no document edit beyond the one comment below. Run `git fetch origin tranche && git checkout -q --detach FETCH_HEAD && git submodule update --init .process`, then `node .process/tool/p3.mjs switch in --preflight --by <your session id>`. Then run each session check it prints with your own tools; for the documents, create a comment "switch canary <date>" on the Foundations and delete it. Send the coordinator (`node .process/tool/p3.mjs address coordinator`) every line, ok or failed with its words, then end your turn.

6. The coordinator reads the report and sends Bob each failure with its fix. Run the canary again after any fix.

## Rehearsal, measured 6 Nov (this account)

| Step | Where | Time |
|---|---|---|
| `switch out --dry-run` | the probe | 5.1 s |
| `switch out --dry-run` | the copy (8 jobs, 3 lanes, layer 9, 211 messages) | 41.6 s |
| `switch in --preflight` | the probe / the copy | 2.5 s / 3.2 s |
| A lane session started and recorded | the copy, 5 starts on 6 Nov | 27 s to 2 min 23 s (median 48 s) |
| A job restarted | the copy, 3 restarts 17:22–17:24 | 20 s to 1 min 22 s apart |

The rehearsal found five defects, and each is fixed in this change:

- the manifest kept every task's prompt empty, because list_triggers keeps it under derived_state;
- a task that starts a fresh session each time was not marked as one, and was taken for Bob's (cold review);
- Bob's own task would have been switched off;
- the probe's manifest listed the copy's 8 jobs, because the account holds every product's sessions;
- switch out demanded every page of 1,800+ sessions, about 5 min.

A sixth defect is also fixed: switch in would have resent 211 messages one by one.

The cold review found three more, each fixed:

- (h)'s `lane start --replace` was refused once ROOT's sweep had ended the retired seat;
- a task bound to a lane was to be created at (d), before the lane's new session existed;
- a later preflight compared the approvals with an earlier switch's spent manifest.

The real switch out and the role restarts on the probe were not run. The probe has no role sessions to restart, and starting them on the copy costs usage at "allowed_warning". The coordinator can order a live rehearsal on the probe.

## Downtime estimate

Downtime runs from the stop acts to jobs working again on the new account. The figures assume the canary passed, so Bob's step 2 is only the switch itself.

| Phase | Likely | Late |
|---|---|---|
| Lists saved, switch out (42 s), stop acts and job pushes | 12 min | 20 min |
| Bob between the accounts (canaried: connect, start the coordinator) | 10 min | 40 min (the environment's values re-entered, App or sharing missed) |
