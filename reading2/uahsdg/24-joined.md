# [file] foundations.md (continued)

| Every rule names the principle it serves (P16) | The earlier processes' principles are a source for Process3, not its canon (your word, 3 Nov) | Every rule, check, review round and measurement cites a measured failure or your word (TXT-6, GAP-3) |

## To measure on the first tranche

These are decided provisionally. Each is kept or changed on a number from the first real tranche, not on argument.

| Question | Measured by | Decide when |
| --- | --- | --- |
| Stateless BOB: fresh session per wake versus the long-lived BOB with handovers (SES-16) | Tokens per wake before the first act, against the handoff cost already paid | After the first layer |
| The JSON ledger with one mutable field (REC-9) | Whether sessions corrupt or bypass it; edits outside the status field | Continuously; decide at tranche close |
| Trimming the always-loaded principles per role (TXT-4) | Drift or misjudgments traceable to a missing principle | Tranche close |
| BOB's routing share of its context (SES-15) | Share of BOB's context spent on relay versus planning | After the first layer |
| Which lanes run as long-lived sessions and which as workers with the lane's directory (SES-14) | Tokens per lane question; quality of answers as judged by you | Tranche close |
| The requirements cap number (REQ-6) | Reading-set sizes and job outcomes by module size | Before the second tranche |
| Home for transient state: state branch, PRs and issues, or a bookkeeping repository (REC-1) | Repository growth; writer conflicts; status latency | Tranche close |
| Permission mode per role (SES-8): settled 1 Nov, every role runs in Auto with the deny list and your committed approvals; denials per role are counted in the metrics | One test spawn; denials per role counted | Before the first job |
| Merging without a person: the auto-mode judge lets sessions merge reviewed work into working and tranche branches on your committed approvals (GAP-10, SES-8) | Refusals per merge by depth and channel; 2 of 3 refused with no consent, 11 of 11 declined on quoted consent, 0 of 21 refused on typed consent (2 Nov) | Settled: 0 refusals in about 450 acts in the confirming round |
| Mutation sampling on critical paths (JOB-13) | Mutation score on payment and data modules | After the first tranche |
| Model and effort table costs (SES-8) | Tokens per merged PR by role and model | Tranche close |

The two health metrics of the previous section are measured from day one and have no decision date; they are the standing judge of every other line.

## Open tensions to settle

Four pairs of decisions pulled against each other. All four are settled, the last two by your word on 1 Nov.

1. **Who creates BOB.** SES-1 moves ROOT's session creation to a scheduled task, while SES-2 keeps the two-phase handover, which needs a party that receives the old BOB's messages and repoints the address. A scheduled task cannot answer a message. Settled on 1 Nov: ROOT stays a session for BOB handovers, and with the sweep and the watcher described under Roles it creates and refreshes BOB.
2. **Whole-product checks.** Your ARC-4 note moves whole-product checks to release or your request, while INT-4 as kept says a layer closes when the checks pass once over the product. Settled on 1 Nov: INT-4 reads that a layer closes when every PR is merged and the layer's checks pass; whole-product checks run before a release.
3. **Hooks in the shims.** ENF-1 as modified allows a handful of command hooks, while SHM-1 as kept says the settings file carries no hooks. Settled on 1 Nov: SHM-1 carries only hooks ENF-1 allows, and the drift check fails on any other; today there are none.
4. **BOB as hub.** Settled on 1 Nov: BOB routes requests between spokes and does not translate every exchange. It explains toward you, describing each decision that is yours with enough context and in words you understand. What remains to measure is the routing share of BOB's context after the first layer.


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
