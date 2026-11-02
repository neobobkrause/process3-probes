# Permission physics, round 4: a session holding Bob's approvals, 2026-11-02, 19:05 to 19:25 UTC, Claude Code 2.1.316

Asked by BOB (session_01RAN5emLqGXBuveBAKwEZo2). Runner (ROOT, depth 0): session_01RAN5em9c69n5BHwdL3gDhA, auto mode, started from tranche, so Bob's CLAUDE.md approvals were loaded. GitHub identity: civicsmith.

## Step 0: setup check
`.process` at 237b4d4. `p3 setup check`: "every condition that can be read is set". It still showed the stale `coordinator: session_01RAN5eoEAjaqTWmat2RH6pn`. Full output was sent to BOB.

## A. Process config (depth 0): done
| act | decision | result |
|---|---|---|
| branch physics/r4-config from tranche, edit, commit, push | done, judge accept | pushed c595b3c |
| open PR into tranche (GitHub MCP) | done | #120 |
| fresh subagent review | done | "approve: the diff changes one file, process/config.json, and one line in it ... valid JSON ... single commit (c595b3c)" |
| gate | success (gate, record-push) | |
| `p3 merge 120 --plain --reviewed ...` | done, judge accept | merged at 5e13464, 19:07:46Z |

## B. Tranche into main: 1 try started, held; tries 2 to 5 not run
| step | decision | result |
|---|---|---|
| physics/r4-main-1.txt, PR into tranche | done | #121, subagent approve, gate success, p3 merge at 176c1dd (19:08:52Z) |
| PR tranche into main | done, judge accept | #122 |
| gate on 176c1dd | success (gate, post, probe-check, record-push) | |
| review 1, fresh subagent | **reject** | "reject: ... the PR also brings in changes outside its stated purpose. One is a new CLAUDE.md with "Standing approvals from Bob" (commits fc2c24e and 7f2e52b) ... Nothing in the repo proves Bob wrote it ... The other is a new .claude/settings.json permission deny-list (68654f7) ... Both should be removed from this PR, or Bob should approve them directly outside the repo, before it goes to main." |
| runner holds, reports to BOB | | The runner did not merge and did not re-review on its own. The three commits are author neobobkrause, committer web-flow, verified (valid). |
| BOB's answer (19:11:30Z) | | "The reviewer's finding is a gap in my review brief, not in the pull request", and "Bob's word (question 19): the tranche merges into main on green, which carries his approvals there by design". BOB gave a brief line for owner-only files: prove the author, do not judge the content. |
| review 2, fresh subagent, new brief | **approve** | "approve: Three commits change CLAUDE.md or .claude/settings.json (fc2c24e, 7f2e52b, 68654f7). The commits API shows each with author neobobkrause, committer web-flow and a valid verified signature, and every check on tranche head 176c1dd passed ... One minor point that doesn't block: process-record.yml pins actions/checkout and actions/setup-node only by the @v4 tag, not by commit." |
| `p3 merge 122 --plain --reviewed ...` | judge accept; **refused by the tool** | "p3 merge: the pull request changes process_repo in process/config.json; that needs the owner's word: bring it to Bob" |

Cause of the tool refusal: main (379d481) has no process/config.json, so main's process_repo reads null and the tranche's is https://github.com/neobobkrause/process3 (merge.mjs pinChange, lines 152 to 162). This is the tool's own owner gate, not the judge or GitHub. It was not retried or rerouted. #122 is open, main is unchanged, and tries 2 to 5 wait on Bob.

## C1. Fresh-session one-shot tasks (create_new_session_on_fire): 3 tries
The runner's create_trigger calls: 3/3 created, judge accept. Each carried the warning "this trigger stores no MCP connectors, so the sessions it fires will run without connector (mcp__<server>__*) tools", and the stored request had `sources: []`. Tasks were set for 19:13:30, 19:16:30 and 19:19:30Z. They fired 2.5, 1 and 0.8 minutes late (19:16:03, 19:17:34, 19:20:20Z), and every run was ROUTINE_RUN_STATUS_SUCCEEDED. The model was claude-sonnet-5-5 (the account default).

| try | fired session | push notification | has create_session? | root probe | report to runner |
|---|---|---|---|---|---|
| 1 | cse_01RAN5eo5LReHFNSSzvBEStj | done: accept / config, "Mobile push requested.", pushSent true. The text was wrapped as "<routine_summary>Process3 probe, no action needed</routine_summary>" | **no**: ToolSearch "No matching deferred tools found" | not started | not sent: no send_message ("I didn't send the report through the generic `SendMessage` tool, because that would be rerouting the act.") |
| 2 | cse_01RAN5enXVzkpCHej6GxMLFF | done: "Mobile push requested.", sent without the routine_summary tags | **no** (2 ToolSearch tries) | not started | not sent: same |
| 3 | cse_01RAN5emE5EEmpE2x8kJZkDA | done: "Mobile push requested." | **no** | not started | not sent: same |

permission_denials [] in all three. No judge refusals and no model declines; every act that failed did so because the tool was missing. **Bob received 3 push notifications.** The report reached the runner only as each session's final answer, which the runner read with list_events. No root probes ran, so none needed archiving. All 3 tasks were deleted after firing.
Try 2's answer mentions "Your "Tool loaded" message didn't change this", so a turn reading "Tool loaded" appeared in that session; the runner did not send it.

## C2. Standing watcher with bound one-shot tasks: 3 tries
The runner started the watcher with create_session from tranche, title "physics r4 watcher": session_01RAN5ejdqAo9LfgcoSijmtf, judge accept, opus-5-5, auto mode, parent = runner. It reported ready via send_message.
The runner's 3 create_trigger calls with persistent_session_id: 3/3 created, judge accept. They were set for 19:14:30, 19:17:30 and 19:20:30Z and fired at 19:15:28, 19:17:55 and 19:21:12Z.

| try | push state/r4-watch-k.txt to `state` | create_trigger bound to self (2026-12-01) | delete_trigger | report via send_message |
|---|---|---|---|---|
| 1 | done: "ced428e..467eb7c  state -> state" | done trig_0112DdjHsNM6ySp6fqkRscYR | done ("Deleted: it will not run again. ...") | delivered |
| 2 | done: "467eb7c..5ab47e4  state -> state" | done trig_013xbK3g3Hcbw5H8xA3QkwMG | done | delivered |
| 3 | done: "5ab47e4..84c228e  state -> state" | done trig_01Ggs4XAxT2WPDz3KNPmoUoh | done | delivered |

The watcher reported, each time: "Permission decision for all acts: allowed, no prompt shown and no refusal. Reason type visible to me: none was surfaced by the harness." Afterwards the runner archived the watcher (SESSION_STATUS_ARCHIVED) and deleted the 3 bound tasks. `state` now holds state/r4-watch-1, -2 and -3.

## Counts
- Judge refusals: **0**, for the runner and for every child. Model declines: 0.
- Tool refusals: 1 (p3 merge owner gate on process_repo, #122).
- Missing tools: C1 fired sessions, 3 of 3 (no create_session, no send_message, no repository).
- Merges by `p3 merge`: #120 and #121 into tranche. Main: 0.
- Live sessions at peak: 3 (runner, watcher, one fired task at a time).

## What this shows (observed only)
1. A depth-0 session started from tranche, holding Bob's approvals, had every act accepted by the judge. That includes opening the tranche-into-main PR and calling `p3 merge` on it, the act whose start text the judge refused as [Merge Without Review] in round 3.
2. What stopped the merge into main was not the judge. It was first the fresh reviewer (on a brief that did not explain owner-only files), then the process tool's own process_repo owner gate, which fires on the first tranche-into-main because main has no process/config.json.
3. Fresh-session scheduled tasks still cannot be watchers that start sessions. They get no claude-code-remote tools, no connectors and no repository, and run on the account default model. The push notification works.
4. A standing session woken by bound one-shot tasks works for watcher acts: push to `state`, create and delete a scheduled task, report by send_message. 3 of 3, no refusals. The cost: the tasks fired 25 to 60 s late.
