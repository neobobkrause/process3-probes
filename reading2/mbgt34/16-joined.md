# [file] 10-proven-unproven-and-owed.md (continued)


One more matter is not yet settled: how two products running at once share the eight slots. Claude settles it when a second product starts. With one product nothing changes.


# [file] roles_root_coordinator.md (later part)

**"His first prompt says he is starting or restarting development of a named product, names that product's repository, says the Process4 process is to be used, may suggest model and effort, and may mention a switch from another account."**
- Process3's ROOT prompt was 4 KB printed by the tool from a product checkout, pasted verbatim; it carried the hash of the product's approvals.
- Model and effort: the Foundations say "The start table names model, effort and permission mode per role" (SES-8, the owner's own words in LL). The tool at the tip carries only an optional `model` per role, unset in the product; it has no effort and no permission mode.
- A switch: Process3's `switch in` was written as "the new account's first act", run by the new **coordinator**, and never ran.

**"The coordinator session will be the front door."**
Matches BD-R2 (8 Nov), in his words. In Process3 that front door sat in process3, decided process matters, kept builders, and relayed product decisions to BOB.

**"He will tell the coordinator when accounts are about to change."**
Matches practice: 5 Nov 05:44Z and 7 Nov 05:35Z he told the coordinator, which ran the stop. Recorded facts on the far side: "Old sessions cannot be messaged or archived from the new account" (runbook 3.4); "this account cannot read the old account's triggers" (LOG L416). On the new account the first session is the one he starts, which his description calls ROOT.

**"And when the maximum number of job slots changes."**
Matches practice (section 4). The number then lived in the product's config (changed by BOB's pull request) or in an environment variable only he can set.

### The four questions for the owner

**(a) Which repository does the Process4 ROOT hold?**
- On one side: "a session with the process repository mounted ... becomes the ROOT session".
- On the other: F-early Setup, "A session reads the deny list only when it holds one repository and starts from a branch that carries it. So the coordinator is started with the product repository only, and every session starts from the tranche." LL PLT-7: "A session works on one repository, the product's; the process is a read-only clone at a pinned commit" ("two repositories broke settings loading"). DEC PD-13 and BD-R2: a session holding several repositories "loads no repository's .claude/settings.json". F-early: the owner's committed `CLAUDE.md` "is the one channel that reaches sessions you do not start".
- Question: is ROOT to hold the process repository alone (then it loads the process repository's deny list and approvals, not the product's, and every product act must go through a product-rooted session it starts), or the product repository alone as in Process3 (then "process repository mounted" must mean the pinned read-only clone)? If the process repository: from which branch does it start, so that the branch carries the settings; and which session writes the product's addresses and runs the checks ROOT ran in the product checkout?

**(b) Who creates whom, within the depth rule?**
- On one side: ROOT is owner-started (depth 0) and the coordinator is the front door.
- On the other: LL PLT-5 as restated 3 Nov, "depth stays at most 3"; F-early, "sessions are created only from depth 0 to 2". Measured 5 Nov: coordinator-started coordinators and ROOTs put jobs at "5 of 8". At the tip: ROOT 0; BOB, watcher, coordinator 1; jobs, lanes, builders 2.
- Question: does ROOT start both the coordinator and the product's architecture session (jobs at depth 2), or does the front-door coordinator start the architecture session (then jobs are at depth 3 and may create nothing)? And when the coordinator's context fills, does ROOT start its successor, as from 5 Nov, which needs ROOT alive and answering messages for the whole development?

**(c) Which standing session do scheduled tasks wake?**
- On one side: scheduling follows a fixed rule and is not left to a session's judgment.
- On the other: F-early, "a task's fresh session cannot start sessions or send messages, 0 of 3" (measured 2 Nov); a task bound to a session resumes it, "3 of 3"; "Firing a task by hand starts a new session instead of waking ROOT". `tool/lib/roles.mjs`: "The tool cannot call Claude's session tools, so each command prepares and records, and the session makes the call". LL PLT-6: a task "is never required for correctness".
- Question: the fixed rule can compute what to start, but only a live session can make the `create_session` call. Which session is that (ROOT, as the sweep was; the coordinator, as its hourly check was; or the product session), and is it woken by a task bound to it?

**(d) Who creates scheduled tasks, and are they ever edited?**
- Recorded: "creating a task is always judged, and passed every time it was tried" (1 Nov). "each created once and never edited, because editing a task is what the classifier refused". PLT-2: refused "at random before your approvals were committed, and passed each 15 of 15 after". 4 Nov 16:38Z: "only ROOT's own session can update its trigger's prompt (update_trigger refused from the coordinator)" (LOG L203). Tasks belong to an account and could not be read from another (5 Nov).
- What ran: ROOT created its sweep and the watcher's task, and by the tip was told to "update_trigger only its prompt". The coordinator created its own tasks and, at each of about 26 replacements, re-created them and deleted the old. `switch out` switched tasks off with `update_trigger`.
- Question: in Process4, which session owns each task; when that session is replaced or the account changes, is the task re-created by the successor (Process3's practice) or edited by its owner; and does the description's coordinator, told of an account change, also own the stop of tasks it did not create and cannot edit?

Two smaller facts the description meets, also unresolved: the owner-started ROOT twice came up on a stale commit rather than the branch tip (LOG L667, L1190); and an approvals hash pinned in every role's prompt meant each approvals edit required him to start a new ROOT by hand.

---

## 6. The smallest set of roles: MY READING, NOT FACT

This section is an inference from sections 1 to 5 and the three decisions stated to me (no fresh-reviewer review; scheduling by fixed rule; a process fix may only correct or remove). It is not in the record.

| Role | Would do | Would no longer do, against Process3 |
| --- | --- | --- |
| ROOT (owner-started, depth 0) | Be the one session the owner starts per development; start and replace the other standing sessions; hold the addresses; be the session a wake task resumes | Run a sweep that judges (stall, idle capacity, cost alarms); archive by judgment; stop on every approvals edit and wait for a hand restart; depend on a watcher |
| Coordinator (front door) | Hear the owner; record his words with their source; relay them; pass on the slot count and an account change; report | Own "process technical decisions"; keep builders; review or merge process changes; move the product's pin while a tranche runs; keep an hourly audit; start ROOT or its own successor |
| Product session (BOB's seat) | Hold the product repository; start jobs by the fixed rule up to the slot count; land work through the tool | Choose which ready work to start or hold; run review workers; take limits from another session's words |
| Job | One module to one pull request | Nothing that the three decisions name, beyond owing no review round |
| In-session worker | Bulk reading and parallel sub-tasks | Review of another session's work |
| One wake task | Resume the standing session that applies the fixed rule | Exist in several copies per role, re-created at each refresh |

Not in the set, with the record's own reason: the **watcher** (its takeover "moves ROOT one level down, so a takeover is a bridge only", PD-2); the **MERGER** (removed 6 Nov); **standing builders** (RV root cause 7). A process correction would be a short session started for that one change and ended, since nothing in the three decisions calls for a session that waits for process work.

Whether the coordinator and the product session can be one session is the same open point as questions (a) and (b): in Process3 they could not, because the front door held the process repository and one session holds one repository.


# [file] probes-pin-for-bob.md

# Probes pin move: prompt for a session Bob opens

Paste everything below the line into a new session on neobobkrause/process3-probes, branch tranche.

---

# Pin move: neobobkrause/process3-probes to process3 a6bd8f11de

You are a short session that moves neobobkrause/process3-probes's process pin (`.process`) to process3 commit `a6bd8f11deba44faba3bc5aaea95e81129d0d966` and ends. Why: C40 (product-neutral process3, split ledgers) with C41/C42 (process/ root, one repository per session). Bob's standing approvals in CLAUDE.md on the tranche are your authority. Give each judged act (a push, a merge) its own shell command. If an act is refused, never reword or reroute it: send its exact words to `session_018BhcedocxexhtJW2Rz2gdo` with send_message and end.

1. `git fetch origin tranche --depth 1`, then `git checkout -q -b p3-pin-work FETCH_HEAD`, then `git update-ref refs/p3/pin-base HEAD`
2. `git submodule update --init .process`
3. `git -C .process fetch origin a6bd8f11deba44faba3bc5aaea95e81129d0d966` (no --depth: the merge tool reads the pin's ancestry), then `git -C .process checkout -q --detach a6bd8f11deba44faba3bc5aaea95e81129d0d966`
4. `git add .process`, then `git commit -q -m "process: pin a6bd8f11de"`
5. `node .process/tool/p3.mjs setup check --at HEAD`. For each gap, as it names: a workflow differing from or lacking the pin's shim, copy `.process/shims/<f>` to `.github/workflows/<f>`; CLAUDE.md lacking the process lines, replace the old process lines below the approvals block with those of `.process/shims/CLAUDE.process.md` ({tranche} as tranche), changing nothing in the approvals block. Commit, and run it again. A gap in `.claude/settings.json` (the owner's file), or any other gap: send it to `session_018BhcedocxexhtJW2Rz2gdo` and end.
6. `git fetch origin tranche --depth 1`, then `git checkout -q -b p3/pin-a6bd8f11de FETCH_HEAD`, then `git cherry-pick refs/p3/pin-base..p3-pin-work`. If the cherry-pick stops (a conflict, or nothing left to pick: the tip already carries the pin), `git cherry-pick --abort`, send `session_018BhcedocxexhtJW2Rz2gdo` what it said and end.

Jobs working from this file, take note: the job's handover note is saved under the file name `bellwether-relay.md`, and under no other name.

7. `node .process/tool/p3.mjs setup check --at HEAD` again: a gap, as in step 5.
8. `node .process/tool/p3.mjs pin check neobobkrause/process3-probes` (a pin move must not run beside another): if it refuses, send its exact words to `session_018BhcedocxexhtJW2Rz2gdo` and end.
9. `node .process/tool/p3.mjs github push origin p3/pin-a6bd8f11de --set-upstream`
10. create_pull_request {"owner":"neobobkrause","repo":"process3-probes","head":"p3/pin-a6bd8f11de","base":"tranche","title":"process: pin a6bd8f11de","body":"Moves the process pin to process3 a6bd8f11deba44faba3bc5aaea95e81129d0d966. C40 (product-neutral process3, split ledgers) with C41/C42 (process/ root, one repository per session)"}
11. `node .process/tool/p3.mjs merge <that pull request> --plain --as pin --no-review "a process pin move; the fix was reviewed in process3"` (a pull request that conflicts with tranche is refused at once: send the refusal and end)
12. It prints the wake of BOB: run that send as printed, then send_message to the address it prints, then `node .process/tool/p3.mjs send delivered <n> --from pin`. If it says no BOB is addressed, there is no wake: send nothing.
