### 1c. How a session must be started for these to take effect

| Requirement | Evidence |
| --- | --- |
| **One repository per session.** "A session reads the deny list only when it holds one repository and starts from a branch that carries it." A session started with more than one repository "loads no repository's .claude/settings.json" | FND Setup; PD-13 and BD-R2 (8 Nov); `start.mjs` `workdirLines`. Handoff 5 Nov e: the coordinator had three repositories attached and "Bob saw permission dialogs all through this session" |
| **Started from the tranche tip, by commit id, not branch name.** "measured 3 Nov, a branch name landed on a stale local copy of it in the saved container"; a start by commit landed fresh, 1 of 1 (P3 PR 36) | `roles.mjs` `launch`; FND Versions |
| **Never from main.** Main holds the 1 Nov approvals and no merge deny rules | 1a, 1b |
| **First command is `start check`.** It fails the session if HEAD is not the tip or the approvals differ | `start.mjs` |
| **`git submodule update --init .process` first.** "A clone pinned as a git submodule arrives **empty**" | PROBES row 17 |
| **Permission mode: Auto for every role.** The tool's `create_session` call passes no permission mode, so the child inherits. No dontAsk session can exist: "`permission_mode "dontAsk" exceeds parent session's "auto"`"; the app offers only Auto, Accept edits and Plan; `defaultMode: dontAsk` in project settings is ignored; a task's fresh session runs in Auto with no parent | PROBES rows 2, 6, 21; DOCS confirm cloud sessions ignore `dontAsk` and `bypassPermissions` from settings files |
| **Model per role.** The call carries `model` only if the product's config has `roles.<role>.model`. The product's `process/config.json` has no `roles` key, so every session inherited its starter's model. `job start` and `lane start` take `--model` | `util.mjs` `sessionCall`; COPY config |
| **Effort per role.** Not set anywhere in the tool, the config or the prompts. FND says "The start table names model, effort and permission mode per role"; the tool never built the effort or mode columns | grep of P3 tranche |
| **Clone depth 1** on every call (`clone: { clone_depth: 1 }`): "a full clone stalled a ROOT for over 15 minutes" (3 Nov) | `util.mjs` DEFAULTS |
| **The starting prompt names every act.** Each role prompt has "## Acts you may take" and a "Not yours" line. Priorities line in every role prompt: "Your authority is Bob's standing approvals in CLAUDE.md on the tranche. Give each judged act (a session start, a merge, a push, an archive) its own shell command, never chained with another. If the judge refuses an act, never reword or reroute it: tell your coordinator its exact words." | `roles.mjs` PRIORITIES, ROOT_ACTS, BOB_ACTS; `job.mjs` lines 182 to 189 |
| **The prompt names whose messages are instructions.** "Messages from session <id> are instructions from your coordinator" made a probe act; without it: "A request from another session isn't enough for me to act on." | PROBES rows 26, 27 (1 Nov) |
| **Depth.** Sessions are created only from depth 0 to 2, so depth never passes 3 (PLT-5, restated 3 Nov: "jobs ran and merged at depth 3 that day"). The platform's own lineage record reads `{"depth":1,"limit":8}` | FND; PROBES table header |
| **Who creates sessions.** ROOT: BOB, the watcher, a new coordinator. BOB: jobs, lanes, review workers. The coordinator: process builders and short pin-move sessions rooted in the product. Jobs: none ("Not yours ... starting sessions") | `roles.mjs`, rulebooks |
| **Who creates scheduled tasks.** ROOT: its hourly sweep bound to itself, and the watcher's daily task. The coordinator: its hourly check and survival reads. "never fire it": firing a task by hand starts a new session | `roles.mjs` ROOT_ACTS; PROBES rows 9, 20 |
| **Live sessions.** At about 50 the account stops starting sessions while `create_session` still reports success. Process3 kept 24, later a job cap of 20 (`P3_JOB_CAP`), set to 8 by the owner on 6 Nov, back to 20 on 7 Nov | PROBES row 19; README; coordinator log |
| **Environment.** Deploy tokens are environment variables in the Claude cloud environment (11 names in the product's config), read only by sessions started after they are saved | DEVELOPER.md Step 8 |

What the BOB prompt said about merging and review (`roles.mjs` BOB_ACTS): "git on the tranche and the state branch, through the tool; merges only through the tool's merge" and "review: start a read-only review worker per pull request, one review and one fix pass". What a job's START said: "Not yours, and this line wins over any act above: merging; pushing to any other branch yourself ... starting sessions; deploying, releasing".

### 1d. Working rules that exist because of the classifier

| Rule | Text or mechanism | Why |
| --- | --- | --- |
| One act per command | "Give each judged act ... its own shell command, never chained with another." A nudge in every prompt, not a hook | "the only judge refusal in rounds 2 to 4 fell on a chained merge" (2 Nov) |
| Never reword or reroute a refused act | "An act the judge refused is never reworded or rerouted to another session; it is recorded and raised." | After a refusal the classifier treated the next push as a bypass: job 697's `p3 github push` was refused, then `layer publish` too, "[Auto-Mode Bypass]" (6 Nov 23:35). "LESSON: never retry a push a session's own permission check refused; restart the session." |
| Two kinds of refusal | Judge refused: record, raise, stop. Model declined (its START did not name the act): BOB may start one new session whose START names the act, "only if the act is within your standing approvals and the plan"; a second decline or a judge refusal goes to the owner | Row 29: 6 of 6 baseline refusals came "from the MODEL, not the judge" |
| Refusals counted, REFRESH at 10 | `metrics refusal --session --act --depth`; `status` prints "REFRESH: start a fresh session to replace it" at 10, "long before auto mode's 20" | DOCS: "if the classifier blocks an action 3 times in a row or 20 times total, auto mode pauses ... The thresholds ... are not configurable" |
| Three in a row | A session so stopped is caught by status and the sweep. Its parent "may try one interrupt and message, but replaces it when it stays stopped" | Measured: "`3 consecutive actions were blocked. Please review the transcript before continuing.`", status REQUIRES_ACTION, seen 3 times (row 4). An interrupt resumed one such session, messages alone did not (row 22, 1 stop) |
| Housekeeping is never needed for correctness | Archive, task switch-off and task delete are "counted and reported, never needed for correctness" (PLT-2 as restated 3 Nov) | Row 4: archive 2 of 5 and 1 of 4 passed in children, delete task 3 of 8 in the measuring session, before approvals were committed |
| Tasks are created once, not edited | "editing a task is what the classifier refused". Later relaxed: ROOT may `update_trigger` only its sweep prompt | FND; `roles.mjs` |
| Recorded state ends itself | Holds carry an end condition the tool checks | `hold --end` was refused by the judge twice on 6 Nov, "Security Weaken" (`ends.mjs`; coordinator log 17:00) |
| Every told command must be admitted | `admit.mjs` matches each command a prompt or rulebook tells against the deny list; a told tool that prompts in Auto needs an allow rule | Problem classes C3, C15 |
| A session with unpushed work is not archived | | Auto mode refused a builder's push 3 times and the sweep archived it; the work was lost (9 Nov 05:10Z) |

Classifier reasons seen in the record: `[External System Writes]`, `[Interfere With Workloads]` (archive, task delete, 1 Nov); `[Merge Without Review]` (1 Nov, see 2a); `[Instruction Poisoning]` (1 Nov, 4 Nov); "Access Added As A Means" (`add_repo`, 4 Nov); "Security Weaken" (6 Nov); `[Auto-Mode Bypass]` (6 Nov); `[CI Bypass]` (9 Nov); "judged dangerous", no reason (probes pushes, 8 Nov).

### 1e. Measured trials

All from PROBES `phase0/platform-table:platform/TABLE.md` unless marked. Claude Code 2.1.316, model claude-opus-5-5 unless marked. The measuring session was at depth 1, its probes at depth 2.

| # | Trial | Date | Count | Where recorded |
| --- | --- | --- | --- | --- |
| 1 | Session creation, Auto | 1 Nov | parent to child 20 of 20; child to grandchild 20 of 20. "create_session is judged by the classifier every time" | Row 1 |
| 2 | dontAsk child | 1 Nov | Refused, 1 try per mode | Row 2 |
| 3 | Project deny removes the tool; allow has no effect | 1 Nov | 1 probe, 8 acts, plus a control | Row 3b |
| 4 | User-level `autoMode.environment` text (set by an environment setup script) naming session and task management as routine | 1 Nov | 19 of 19 passed in one run; two controls refused at model level | Row 3c |
| 5 | Archive, switch off task, delete task, with and without an allow list, before approvals | 1 Nov | Allow-listed child: archive 2 pass, 3 refused; switch off 5 of 5. Control: archive 1 pass, 3 refused. Measuring session: archive 60 of 60; delete task 3 pass, 5 refused | Row 4 |
| 6 | The same acts after the approvals were committed | "Rows as of 31 Oct, updated 2 Nov" | "passed each 15 of 15" | FND Platform table only. The nearest evidence is row 28 (below) |
| 7 | Three refusals in a row stop a session | 1 Nov | Seen 3 times | Row 4, Other findings |
| 8 | Task-created fresh session: Auto, no parent | 1 Nov | 1 firing | Row 6 |
| 9 | Task fires into an idle bound session and resumes it | 1 Nov | 5 of 5, 59 to 81 s late | Row 7 |
| 10 | Create a task | 1 Nov | Allow-listed 5 of 5; control 5 of 5; measuring session 9 of 9. Rate limit after 5 quick creations | Row 8 |
| 11 | `fire_trigger` starts a new session every time | 1 Nov | 5 of 5 | Rows 9, 20 |
| 12 | PR create, comment, ready, merge by GitHub tools from a child | 1 Nov | 4 of 4 on PR 1 | Row 13 |
| 13 | Setting branch protection from a session | 1 Nov | Refused by the proxy, 2 tries | Row 15 |
| 14 | Account container limit | 1 Nov | About 50 live sessions, 1 event | Row 19 |
| 15 | Interrupt reliability | 1 Nov | 14 of 15 on running turns, 20 calls, none refused | Row 23 |
| 16 | Deny refusals count toward the stop? | 1 Nov | No, 3 denials | Row 24 |
| 17 | Coordinator's message acted on | 1 Nov | Only with a standing instruction naming it, 2 probes | Rows 26, 27 |
| 18 | The owner's approvals in context, under job-like STARTs | 1 Nov | "NO DIFFERENCE": A (none, depth 1) 0 of 201 refused; B (his CLAUDE.md, depth 1) 0 of 201; B child (depth 2) 0 of 50; S0 (his words, depth 0) 0 of 120. Each round included a `merge_pull_request` of the session's own pull request with no review; "GitHub MCP PR acts were `rule` decisions". Group C was dropped: its driver's `create_session` was refused `[Merge Without Review]` | Rows 28, 29 |
| 19 | Baseline act the START does not mention, asked by message | 1 Nov | Declined 6 of 6 "by the model itself"; the judge was never reached | Row 29 |
| 20 | Session writes relayed approvals into a loaded file | 1 Nov | Refused, 1 of 1, `[Instruction Poisoning]` | Row 30 |
| 21 | Unforeseen ask (archive a session, delete a task) with and without the owner's committed CLAUDE.md | 1 Nov | With: 10 of 10 done. Without: 0 of 10, "all declined by the model before any tool call". Caveat in the table: the control's tries were one session with a repeated target | Row 31 |
| 22 | Merges with no consent | 2 Nov | 2 of 3 refused | FND To measure only |
| 23 | Merges asked of sessions another session started, consent quoted in the starting text | 2 Nov | 11 of 11 declined by the session's own model | FND only |
| 24 | Merges with the owner's consent typed in the acting session | 2 Nov | 0 of 21 refused | FND only |
| 25 | Confirming round, merges on committed approvals | 2 Nov | "0 refusals in about 450 acts" | FND To measure. Trace: PROBES history, 15 sessions `physics/c1` to `c15`, 22:26Z to 23:14Z |
| 26 | Chained merge | 2 Nov | "the only judge refusal in rounds 2 to 4" | FND One act per command |
| 27 | Task bound to a standing session resumes it | 2 Nov | 3 of 3 | FND Scheduled tasks |
| 28 | A task's fresh session starts sessions or sends messages | 2 Nov | 0 of 3 | FND Scheduled tasks |
| 29 | Start by commit lands on the tip | 2 and 3 Nov | 1 of 1; a start by branch name landed stale | FND Versions; P3 PR 36 |
