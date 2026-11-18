# [file] coordinator-handoff-4nov-b.md (continued)

- DONE 04:52: process3 PR 87 (efe3e97) REST draft/ready (convert_to_draft by the proxy's REST route), missing attempt-N receipt posted on rerun; answers' record-check case was a pre-PR-83 pin, no change. Copy PR 131 (f3c504c) pinned 6b1aac8 at 04:56; copy PR 132 (69fde56) pinned efe3e97 at 05:01 (BOB woken pin-11; site and signatures rerun job complete). No pin move is open.
- DONE 04:49: process3 PR 86 (6b1aac8) take-in record scope (rule 5 held). Pin move to 6b1aac8 started 04:52 via a copy short session; it reports to my id: read its result (list_sessions, "pin move 6b1aac88b1"), then tell BOB that registers (copy PR 86) re-runs its gate by a fresh push.
- DONE 05:30: build/report-right, process3 PR 90 (20ee0bf): figures right. Re-run on the copy (tip de5dce6): ready to start 21 of 30 measured, median 49.5 min, worst 255.5 (signatures), target 10: still the urgency gap (causes measured by BOB 05:08: untriaged notices hold users, tool faults, split cycles; fixes in build/merge-waits). Refusals since the opening 0; 23 distinct job PRs; elapsed 5.7 h; tranche cost unmeasured (no cost rows since the opening: make jobs record cost, or BOB passes --attempt to sweep). Pin move to 20ee0bf started 05:32 (a copy starter session reports to my id).
- Defect sweep DONE: notes/defect-sweep-4nov.md (13 ranked, 7 lower; #1 fixed by PR 87). Builds started 05:00 from it, each told a successor may message it with its own id:
  - DONE 05:27: build/job-sync, process3 PR 91 (b8bd3ee): `p3 job sync <id>`; job complete and p3 test refuse a stale tool (naming submodule update or job sync) and unsynced origin commits; restart START syncs first; committed generated paths restored; installs before builds. Copy PR 141 (e04977e) pinned b8bd3ee at 05:31; BOB told (05:32): BLOCKED and held jobs run `job sync <id>` (branches pinned before b8bd3ee get it by restart or by `git submodule update --init .process` at the tranche tip). Open: deploy.mjs:123 deploy dev builds without installing stale lock files (small follow-up); merge.mjs:130's refusal to name job sync (sent to merge-waits).
  - DONE 05:35: build/merge-waits, process3 PR 89 (a068e7b, rule 5 held): merge waits end (head moved, closed, 60 min default past the 45 min cap only while in progress, no merge-row livelock); merge bases from GitHub compare for triage, withdraw and the notices-only rerun; retired ids record no notice; an untriaged notice holds no module (only triage-affected ones wait); triage briefs carry only importing files, 25 modules a share; conflict refusal names job sync. Copy PR 142 (55bafbf) pinned 20ee0bf at 05:36; copy PR 144 (3c2614f) pinned a068e7b at 05:42; no pin move open.
  - STARTED 05:37 as build/main-gate (rule 5): tranche into main runs every changed module's suite serially in one gate job capped at 45 min (gate.mjs:103,120; shims/process-gate.yml:25); the copy's main requires only `gate`. Tranche close will likely exceed it. Fix: on a tranche-into-main PR trust the per-job gates (record-only when every changed file came through a merged job PR with a green gate on its merge), or split suites into a matrix. Needed before `tranche close`.
  - Smaller open items: deploy.mjs:123 install stale lock files before building; retired regex misses parentheses inside the note; triage searches users' paths not tests; duplicate checks before writeState not repeated on redo; depth-1 wake fetch vs merge.mjs:111, tipApprovals, job.mjs:212; jobs record no cost rows since the opening (tranche cost unmeasured); `send delivered` hit a local 'cannot lock ref ... expected <sha>' on the state branch at 05:42 and passed on retry (a race PR 88's redo does not cover: treat a ref-lock failure like a rejected push); --live should count only sessions updated in the last few hours (ROOT passed 30 with stale ones; 7 stale archived 05:38).
  - DONE 05:16: build/state-writes, process3 PR 88 (ec2d220): state writes redo on the fresh tip, address writes re-read, review brief names `p3 test`. Copy PR 136 (e255f11) pinned ec2d220 at 05:21. Open from its review: duplicate checks before writeState (tranche close, lane asks, release and deploy rows) are not repeated on a redo; a depth-1 fetch at a wake makes the tranche tip a shallow boundary, which merge.mjs:111's merge-base, tipApprovals (roles.mjs:94) and job.mjs:212 can trip on. Candidates for the next build.
  When each merges, move the pin (one at a time, as below), and tell BOB what it unblocks: job sync lets the 8 BLOCKED job branches merge the tranche and re-complete.
PIN MOVES: only the coordinator starts them, one at a time. `pin move` (PR 85) refuses while a p3/pin-* PR is open and needs to read the copy's PRs, which a process3-scoped session cannot: run it through a short copy session that fetches .process at the new pin, runs `node .process/tool/p3.mjs pin move neobobkrause/civicsmith-copy --pin <sha> --report <your id> --why "..."`, and starts the printed session exactly as printed (as session_01RAN5enaHvExm9iCBgZ7YuU did). Fetch pins without --depth.
COPY STATE (04:38): layer 1 closed (249b62e), layer 3 closed (96a2c4c), layer 2 held by the ai-accounts compatibility job (draft PR 124, session_01RAN5engM4FH5URR5iDtUPN: the removed T53 names over the new model, deprecated, tested; five users broke on them). 933 unmet marks (PR 77 parser). Seven requirement splits landed (copy PRs 107-118, 122). Running: registers 86, site 79 (waits on rest-ready), signatures 101 (waits on rest-ready), ai-runs, ai-use, question-explorer, wizard-scripts, screens-action, instance-setup, agent-worker, op-declarations restarts; store-assembly archived until the seam. Deploy and release blocks are in config (PR 80); first `p3 deploy dev`, walk, and `p3 release dev` (draft) are BOB's next after LOGIN_FAILED's fix (a walk-script bug, bundler PR 88).
MEASURED (04:47): ready to start median 106 min vs target 10 (the urgency gap; BOB asked why, answer comes to me); green to merge median 10.5 (target 15); replace 28 (one batch); layer close to next start 9. Phase 2 faults: handover met (02:07 by prompt refresh), stopped job met (38 min, before PR 72), silent ROOT met (04:11). Silent BOB still owed: after ROOT's first wake of BOB, interrupt BOB and watch ROOT's escalation-driven handover (PR 71); target 30 min.
FOR BOB: none. Bob, ~07:35 4 Nov: "These are technical details, and I've already give sufficient approvals for you to do them yourself." His former items (catalogue seed, .cs-btn, words-reads generator, workflow diffs) are the process's; see findings 07:36.
OWED AT THE GATE (coordinator writes): Phase 2 gate results into the Build Plan when silent BOB is measured; Phase 3 rows' states (PRs 64-85); the lead-time figures against targets.


# [file] merge-train-trial.md

# Merge train trial (Bob's design and word, 5 Nov ~02:20 UTC; design revised 02:35 after the design study)

Bob, 5 Nov: "Yes, begin the trial of the merge train when we're ready. But be sure to measure so that we understand the tradeoffs and balance being struck." Replaces the self-merge trial (notes/self-merge-trial.md): jobs do not merge their own PRs; one actor runs the train.

## Design (revised 02:35)
GitHub's merge queue is not offered on these user-owned repos (Bob checked the ruleset editor, 02:33). The design study found most of the gain is removing pickup (sim: automatic one-at-a-time 7.0/20.5 vs actual 8.7/33.7 median/p90 min; batches 5.2/13.5) and that batch gates would be weaker than today's per-PR job re-gate. So the trial runs: automatic serial per-PR merges on green, next PR prepared during the current gate, in a dedicated MERGER session; batching stays off and is reconsidered with Bob when measured queue depth at merge time stays at 3 or more. The original batch design follows for reference.

### Original batch design (not built)
- No per-PR merge queue. While batch N's gate runs, batch N+1 is assembled from every job PR that is green on its own receipt, ready, and compatible: merges cleanly with the tranche and with the batch's other members (git merge-tree), review-triggered PRs only after their review passed.
- One gate per batch, on the tranche plus all members. Each member is still its own merge commit in order, with its own merge row, cost row and receipt check, so records and reverts stay per PR.
- On failure: bisect (halves, gated), merge the passing part, send the culprit back to its job with the failing run.
- The next batch is formed when the current one's gate is near its end (median duration known; the tool polls every 15 s), then the train continues. Batches size themselves: small when greens trickle in, large in bursts or behind long gates.
- Run by the MERGER, a session of its own that ROOT starts and replaces (not BOB's loop): `p3 merge train`, one serial loop over the tool's per-PR merge under a lease on the state branch. No batches. (process3 PR 142, b8d5176)


Every job must note: the reviewer for jobs has changed. Handover notes now carry the line `reviewer: Annelise Brouwer`, and the name Lucinda Abernathy is no longer written anywhere in a handover note.

## Measures (baseline: 4-5 Nov, measured 01:50 and by measure/merge-train-sim)
- green -> merged per PR: median, worst (baseline median 11.0 min, worst 85)
- PR-minutes waiting after green; idle job sessions waiting on merge (01:54: 11 of 19)
- gate runs and gate-minutes per merged PR; cancelled runs per PR
- batch size distribution; batches failed; bisection gates; culprits and how often a good PR was delayed by a bad one (minutes)
- conflicts caught at batch time vs after merge; reverts; post-merge defects (survival read)
- velocity, efficiency, quality as the velocity audit defines them, before vs during
- state-branch push tries per write (batch merges add rows at once)

## Stop rules
- more than one merged PR needing a revert, or a post-merge defect the per-PR path would have caught
- any state-branch push hitting its try limit
- median green -> merged worse than the baseline over 3 hours

## Decision after one day on the copy
Keep, adjust or drop, reported to Bob with the figures and the balance struck.


# [file] interface_changes_log_pr96.txt

INTERFACE CHANGES LOG — ai-runs, comments brought in line with the code after the T53 change
Columns: # | entry | what changed | HANDED or HANDS BACK | BREAKING (removed / renamed / newly required / newly refused / answer lost a field or changed kind) or ADDS-WIDENS | how found: (a) reader complained, (b) code diff only, (c) requirements diff only, (d) tests diff only
Baseline: the reader listed 45 complaints on the two files before any edit (work/reader-before-ai-runs.txt); 18 of them stand against the pre-change source too (work/reader-baseline-before-change.txt) and are not this change's.

--- the changes ---
1 | AI_RUNS_TABLES (schema.mjs, exported list) | two names added: ai_run_segments, ai_run_producers (tuple of 7 is now 9) | HANDS BACK | ADDS-WIDENS | (a) schema.mjs(8,14)
2 | AI_RUNS_ADDED_COLUMNS (schema.mjs, exported list) | two names added: hold, wait_choice | HANDS BACK | ADDS-WIDENS | (a) schema.mjs(18,14)
3 | AI_RUNS_ADDED_TABLE_COLUMNS (schema.mjs, new export, had no comment) | new frozen map {ai_test_bar: [entry_id]} | HANDS BACK | ADDS-WIDENS | (b) an export with no comment draws no complaint
4 | AI_RUNS_SCHEMA / table ai_runs | columns principal_claude, principal_claude_ref renamed principal_ai, principal_ai_ref (migrate renames in place, rows kept) | HANDS BACK (the row a reader of the table gets) | BREAKING renamed | (b) the kind is `string`: no complaint possible
5 | AI_RUNS_SCHEMA / table ai_test_bar | column entry_id TEXT added (NULL when no entry named) | HANDS BACK | ADDS-WIDENS | (b)
6 | AI_RUNS_SCHEMA / tables ai_run_segments, ai_run_producers | two new tables, declared to record-core with a run's sight | HANDS BACK | ADDS-WIDENS | (b)
7 | OpenArgs.principalAi (open, op=airunopen) | argument renamed from principalClaude; still required | HANDED | BREAKING renamed | (a) index.mjs(2210,38)
8 | OpenArgs.principalAiRef | argument renamed from principalClaudeRef (accepted, never read) | HANDED | BREAKING renamed | (a) index.mjs(2210,58)
9 | OpenArgs.principalClaude, .principalClaudeRef / OpenRefusal AI_RUN_CAPABILITY_UNAVAILABLE | the old names are refused whenever sent (any value but undefined, null included), even beside principalAi | HANDED | BREAKING newly refused | (b) run-time check in open's body; the reader saw only the new names
10 | OpenArgs.mode / OpenRefusal AI_RUN_MODE_NOT_DEPLOYED, .deployed | a mode is admitted only on a Gate 1 verdict (passes, passes_with_limits) held for the entry the opener's account serves the act on; a held test-bar record (R75) no longer admits; `deployed` lists the modes admitted for that entry | HANDED | BREAKING newly refused | (b)
11 | OpenArgs.origin / AI_RUN_EXPLORE_NOT_DEPLOYABLE | `investigate`'s admission for an exploring run is asked on the same entry (Gate 1), no longer on the test bar | HANDED | BREAKING newly refused | (b)
12 | OpenArgs.project / open's account (R52, R89) | accountFor is asked with the project the run is opened in, not only a project context: a run over a question opened in a project may now be paid by the project's account (principal_ai `project:<id>`) | HANDED | ADDS-WIDENS (who pays can differ; no kind changed) | (b)
13 | OpenRefusal.code (relayed from ai-accounts) | a notice unread is relayed as RECIPIENT_NOTICE_DUE where GROUP_KEY_NOTICE_DUE and PROJECT_KEY_NOTICE_DUE were relayed | HANDS BACK | BREAKING refusal code retired and replaced (ai-accounts' change, relayed unchanged by open) | (d) usage.test.mjs; nothing in this module's code names these codes
14 | RunLogEntry.read, .disagree (tick's log entries) + new kinds LogReadField, LogDisagreeField | passed on to observation-log's writer unchanged (were dropped); one not of its shape refuses the entry OBSERVATION_FIELD_MALFORMED / _NOT_ALLOWED in `refused` | HANDED | ADDS-WIDENS | (b) the entry is untyped where it is read: no complaint
15 | RunLogEntry.produced_by + new kind ConversationLabel | new optional list of labels; a malformed one refuses that entry AI_RUN_CONSUME_INVALID in `refused` | HANDED | ADDS-WIDENS | (a) index.mjs(2950,59) (2950,105)
16 | SegmentEnd.ai_stop + new kind AiStop | new optional field {reason, class, retry_after?, recipient?}, each bounded; a segment carrying it is not continued by R84 | HANDED | ADDS-WIDENS | (b) the reader complained only on the answer side
17 | UsageEntry (tick's usage) | entry_id and label are newly required: an entry of the shape before T53 is refused whole AI_RUN_CONSUME_INVALID | HANDED | BREAKING newly required | (b) #entryFault and #labelFault at run time; the entries are untyped where read
18 | UsageEntry.model, .effort | no longer read at the top of an entry: they ride on label.model_version and label.effort | HANDED | BREAKING removed | (b)
19 | UsageEntry.label (ConversationLabel) bounds | all seven fields of AiRuns.LABEL_FIELDS present; display_name equal to ai-catalogue's entryOf(entry_id).display_name (R104); effort a lowercase word of 1 to 16 letters or null (R88); ai-use refuses a further key | HANDED | BREAKING newly refused | (b)
20 | UsageEntry.mode, .usage, .calls | now judged here before ai-use: mode a non-blank text, usage a plain object, calls present and null or a safe integer of one or more (calls no longer written optional; an absent one was already refused by ai-use) | HANDED | ADDS-WIDENS (same refusals in effect, judged one step earlier) | (b)
21 | TickRefusal.code (relayed limit) / tick | the limit asked is that of the owner paying now: after a hop the last segment's payer_owner, never the first account's | HANDS BACK | ADDS-WIDENS (behaviour; no kind changed) | (b)
22 | SegmentEndAnswer.next | closed list gains `stop` | HANDS BACK | ADDS-WIDENS | (a) index.mjs(3013,7) (3060,58)
23 | SegmentEndAnswer.stop + new kinds StopDecision, AccountLevel, Redispatch (tickAndContinue) | new optional field: what became of an ai_stop (ended, none, hopped, offered, held) | HANDS BACK | ADDS-WIDENS | (a) index.mjs(3063,59)
24 | TickDone.refused | may now hold this module's own AI_RUN_CONSUME_INVALID (with `reason`) for a malformed produced_by, and the writer's read/disagree codes | HANDS BACK | ADDS-WIDENS | (b) `refused` is an untyped list where it is filled
25 | DispatchOutcome.state, .withheld, .recipient (wake, continuation, member dispatch) | new state WITHHELD with `withheld` RECIPIENT_NOTICE_DUE (R96) or AI_PATH_NOT_READY (R97): a dispatch that was sent before can now be held back | HANDS BACK | BREAKING newly refused (and a closed list grew) | (a) index.mjs(3605,67) (3611,33) (3633,65) (5436,101) (5436,124)
26 | agent-worker /run body (RunsEnv.AGENT_WORKER, described at DispatchOutcome) | `account` in the body lost `kind` and `secret` (R79 retired); it is now ai-accounts' in-plane account (account_id, level, owner, provider, plan, means, entry_id, entries, member, project?, suggestions, personal, disclosed) | HANDED (to the binding) | BREAKING fields removed, kind changed | (b) the body is JSON text to the reader
27 | dispatch's account (wake, continuation, member) | a run is dispatched on its last segment's account; only a hop moves it; an accepted dispatch writes the segment's row and clears the hold | HANDS BACK | ADDS-WIDENS (behaviour) | (b)
28 | WithheldReason NO_ACCOUNT (wake's decision) | whether an account serves is ai-accounts.servingAccountOf for use `run` in the run's project (any level), no longer the member's reference, sign-in or the group key read one by one | HANDS BACK | ADDS-WIDENS | (b)
29 | MemberDispatchAnswer.withheld | NO_ACCOUNT added | HANDS BACK | ADDS-WIDENS | (a) index.mjs(3763,66)
30 | MemberDispatchAnswer.withheld | MEMBER_PRINCIPAL_RUN retired at this door: the run is dispatched on any account that serves her act, not her own sign-in alone | HANDS BACK | BREAKING refusal code retired | (b) the reader asked for the new word, it cannot see an unused one
31 | MemberDispatchAnswer.code MEMBER_RUN_MODE_NOT_ADMITTED | also answered when partAdmitted(mode, entry) does not admit the mode on the serving account's entry (Gate 1) | HANDS BACK | BREAKING newly refused | (b)
32 | MemberDispatchAnswer.code (relayed) | any refusal of ai-accounts.accountFor but NO_ACCOUNT is relayed (before, AI_KEPT_AWAY alone) | HANDS BACK | ADDS-WIDENS | (b)
33 | dispatchMemberRun / MemberDispatchArgs | null is tolerated as no argument; the mint is handed the account's id; comment block restored (it had found no place) | HANDED | ADDS-WIDENS | (b) a method with no comment draws no complaint
34 | RunSession.principal (read, listInContext) | key `claude` renamed `ai` | HANDS BACK | BREAKING renamed | (a) index.mjs(3908,48)
35 | RunSession.segments, .labels, .held + new kinds RunSegment, HopRecord, HopPair, RunLabelUse, RunHeld | three optional fields, answered only to the run's member and the paying owners | HANDS BACK | ADDS-WIDENS | (b) spread into the answer under a condition: no complaint
36 | RunLogRow.read, .disagree, .produced_by (log, op=airunlog) | three fields added to every entry, null where none | HANDS BACK | ADDS-WIDENS | (b) (reads.test.mjs lists the keys)
37 | RunFacts.principal_ai (runFor, runGate) | renamed from principal_claude | HANDS BACK | BREAKING renamed | (a) index.mjs(4646,82)
38 | RunHolder.enabled_by | now read from the column principal_ai; description only, kind unchanged | HANDS BACK | ADDS-WIDENS (no kind change) | (b)
39 | RunsEnv.AI_RUN_PAUSE_MAX_MS, .AI_RUN_PROBE_INTERVAL_MS | two new optional overrides | HANDED | ADDS-WIDENS | (a) index.mjs(5148,43) (5152,43)
40 | RunsEnv.AGENT_WORKER (its answer) | an answer whose reason, code or type holds AI_PATH_NOT_READY is read as the path not ready | HANDED | ADDS-WIDENS | (b)
41 | RunsDeps.aiAccounts | the methods asked changed: servingAccountOf, recipientNoticeDue, hopFor, accountState newly asked; accountUses, groupKeySwitches, accountReferenceState, groupKeyState no longer; accountFor must answer the in-plane account (text account_id and owner, a level), an answer of the old shape {level, kind, key} is read as no account | HANDED | BREAKING newly required | (b) the methods are kind `Function`, called through an untyped private
42 | RunsDeps.gateRecords | new optional wiring for a module test | HANDED | ADDS-WIDENS | (a) index.mjs(1584,28) (1584,67)
43 | RunCounts.aiRunSegments (counts) | new figure | HANDS BACK | ADDS-WIDENS | (a) index.mjs(1391,7) (1403,7)
44 | AiRuns.COUNT_KEYS | fifth key aiRunSegments; comment block restored (it had found no place) | HANDS BACK | ADDS-WIDENS | (b) no comment, no complaint
45 | partAdmitted(part, entry) | takes a second argument, the entry; with no entry nothing is admitted outside a test instance; admission rests on Gate 1's verdict for the entry, a test-bar record no longer admits and a failed one withdraws the entry | HANDED | BREAKING newly required | (b) the comment block had found no place, so no complaint
46 | registerGateVerdicts(module, fn) + new kind GateVerdictSource | new public method: the one seam for Gate 1's verdicts | HANDED | ADDS-WIDENS | (b)
47 | VerificationDone.next.deployable (verificationRecord, op=airunverify) | now the verification chain alone (run-rules deployable); before it was partAdmitted whole (bar and test instance too) | HANDS BACK | BREAKING meaning changed, kind unchanged | (b)
48 | TestBarRecord.entry_id / TestBarArgs (testBarRecord, testBarRecords) | new optional entry_id: handed, stored, answered back when a text; a blank one is AI_TEST_BAR_UNFIT field entry_id | HANDED and HANDS BACK | ADDS-WIDENS | (a) index.mjs(5024,30)
49 | GroupTestResults.results (groupTestResults) | each result gains entry_id (null when none) and part | HANDS BACK | ADDS-WIDENS | (b) (t41.test.mjs shows it)
50 | DeclaredOp | optional machineClasses and needs | HANDS BACK | ADDS-WIDENS | (b)
51 | DECLARED_OPS.airunopen | accepts principalAi, principalAiRef and requires principalAi; principalClaude, principalClaudeRef gone | HANDS BACK | BREAKING renamed | (b) the row is a list of texts to the reader
52 | DECLARED_OPS | eight rows added: aicontinue, aistop, aiwait, aiswitchaccount, aiwithout, aisendrefuse, airunparts, aiwaitswitch | HANDS BACK | ADDS-WIDENS | (b)
53 | AiRunsOps / aiRunsOps | eight ops added to the route map | HANDS BACK | ADDS-WIDENS | (a) index.mjs(5870,5)
54 | aiRunsOps (url, body) | the new ops read `run` and `wait` from the body, else the query; `by` is the stamp actor, else viewer, never the body's | HANDED | ADDS-WIDENS | (b)
55 | registerPathReady(module, fn) + new kind PathReadySource | new public method: the one source of op=aipathready | HANDED | ADDS-WIDENS | (b)
56 | runParts({run, viewer}) + new kinds RunPartsAnswer, RunPart, HopAnswered, HopSide | new public read, op=airunparts | HANDS BACK | ADDS-WIDENS | (b)
57 | aiContinue + new kinds MemberChoiceArgs, ChoiceNotFound, ChoiceBase, ContinueAnswer | new public method, op=aicontinue | HANDED and HANDS BACK | ADDS-WIDENS | (b)
58 | aiStop + new kind StopAnswer | new public method, op=aistop; ends the run cancelled, writes end_refusal on a declined hop | HANDED and HANDS BACK | ADDS-WIDENS | (b)
59 | aiWithout | new public method, op=aiwithout | HANDED and HANDS BACK | ADDS-WIDENS | (b)
60 | aiSwitchAccount + new kind SwitchAnswer | new public method, op=aiswitchaccount | HANDED and HANDS BACK | ADDS-WIDENS | (b)
61 | aiWait + new kinds WaitArgs, WaitAnswer | new public method, op=aiwait; WAIT_INVALID outside 5, 15, 60 (no catalogue row held: check and translation null) | HANDED and HANDS BACK | ADDS-WIDENS | (b)
62 | waitThenSwitch + new kind WaitChoice | new public method, op=aiwaitswitch; reads `member` when `by` is absent | HANDED and HANDS BACK | ADDS-WIDENS | (b)
63 | aiSendRefuse + new kind SendRefuseAnswer | new public method, op=aisendrefuse | HANDED and HANDS BACK | ADDS-WIDENS | (b)
64 | registerHealthProbe(slot) | new public method | HANDED | ADDS-WIDENS | (b)
65 | healthProbe() + new kinds HealthProbeConsumer, HealthProbeTick | new public method: the scheduler consumer ai-health-probe | HANDS BACK | ADDS-WIDENS | (b)
66 | AiRuns.LABEL_FIELDS, .EFFORT_WORD_MAX | two new public statics | HANDS BACK | ADDS-WIDENS | (b)
67 | AiRuns.RUN_PARTS_LIMIT, .WAIT_THEN_SWITCH_CHOICES, .PAUSE_MAX_MS, .PROBE_BATCH, .PROBE_INTERVAL_MS, .RUN_LEASE_MS, .HOP_STOPS, .READY_STATES | eight new public statics | HANDS BACK | ADDS-WIDENS | (b)
68 | AiRuns.AI_RUN_LEASE_MS (description) | a held run's lease runs to PAUSE_MAX_MS from its stop | HANDS BACK | ADDS-WIDENS (behaviour) | (b)
69 | migrate() | renames the two principal columns in place first; adds the other tables' columns | HANDS BACK | ADDS-WIDENS (the rename itself is the ai_runs line above) | (b)
70 | open vs requirement R40 | R40's own refusal PART_NOT_PASSED is still marked not yet met: the code answers AI_RUN_MODE_NOT_DEPLOYED; said in OpenArgs.mode | HANDS BACK | ADDS-WIDENS (a difference stated, nothing moved) | (c) the mark left on R40 in the requirements diff
71 | DECLARED_OPS vs requirement R90 | R90, now unmarked, lists `aisend` among the declared ops; this module declares none (it is ai-accounts' act); said in DECLARED_OPS | HANDS BACK | ADDS-WIDENS (a difference stated) | (c)
72 | RunCost.by_entry (session.cost, close's cost; ai-use's answer relayed) | the conversations are listed as by_entry [{entry_id, label, calls}] where by_model [{model, effort, calls}] was; the comment already said by_entry, no edit needed | HANDS BACK | BREAKING renamed, kind changed (ai-use's field, relayed) | (d) t50.test.mjs
73 | OpenManyOpened.estimate (ai-use's answer relayed) | the inner `estimate` is ai-use's own figures (an object) where the test before showed a word; the comment says `as it came`, no edit needed | HANDS BACK | BREAKING kind changed (ai-use's field, relayed) | (d) t41.test.mjs


A requirement on what a job hands in: the job's handover note carries, on a line of its own, exactly: `desk: tamarind`.

--- not interface changes, recorded for the reader's complaints ---
N1 | ExitNotFound | `@property {never} [status]` added so `aiStop` and `aiWithout` may read `status` off the one exit's answer; the form itself is unchanged (it never carried `status`) | annotation only | (a) index.mjs(5497,78) (5507,78)
N2 | private helpers #dispatchMember, #memberChoice, #afterStop, #redispatch, #hopAnswered (and its inner `lvl`), #flagOnly | given a kind in a comment, the file's own device ("typed so the public answers built from it can be checked") | annotation only | needed so the new public answers check
N3 | stale notes removed | "not yet met" notes on R9 (OpenArgs, DECLARED_OPS), R19 (RunSession), R28 (RunFacts), R72 (UsageEntry), R78 (partAdmitted), R99 (RunLogEntry), R100 (RunLogRow): the requirements diff unmarks these and the code meets them | (c) confirms what (a)/(b) found
N4 | kept as it was | testBarRecord's note that R75 moves the act to ai-gate: R75 is still marked not yet met
N5 | not touched | R106 (`idem` on tick, close, spawnPayload) is still marked not yet met; the comments before the change did not speak of it and the code does not read `idem`
N6 | narrative (not interface) comments | two inline parameter comments of `tick` and one sentence added to the narrative above `dispatchMemberRun` were corrected because they state a public method's handed shape or refusal order; other narrative comments on private methods (#aiRunDispatch's body, #dispatchAccount, #aiAccounts, #segmentEnd) still describe the path before T53 and were left


At Eyre the clerk wrote down 4 carp.

--- tally ---
73 changes recorded. By how found: (a) reader complained 16; (b) code diff only 52; (c) requirements diff only 2; (d) tests diff only 3.
Could break an existing user: 22 = (a) 5, (b) 14, (d) 3. Only add or widen: 51 = (a) 11, (b) 38, (c) 2.
The reader's 45 complaints before: 27 new with the change (25 map onto the 16 (a) lines above, 2 are N1) and 18 that stand against the pre-change source too.

--- at the end ---
Reader run again (work/reader-after-ai-runs.txt): 18 complaints remain on index.mjs, 0 on schema.mjs. They are the same 18, message for message and column for column, that the reader lists against the source as it stood before the change (work/reader-baseline-before-change.txt): 6 in workProducts (a lens block read off `{}`), 1 in open (`origin` a text where OpenStarted names two words), 2 in openMany and 1 in listInContext (a text where RunContextType or RunMode is named), 4 in wake (`dispatch` added to a wake after it is built), 2 in verificationRecord and 2 in testBarRecord (run-rules' refusal `ok: boolean`, `mode`/`part` a text). Each is the code being looser than a kind that is right about what it answers; none says a comment is untrue of the change, and silencing one would take either a change to running code or a loosened kind.
Only comments changed: both files, pristine copy and edited, were written out by `tsc --allowJs --removeComments --noResolve` and the two outputs compared byte for byte: identical (index.mjs 2,626 lines, schema.mjs 191 lines; work/verify.sh, work/nc/). A second check: of the 845 changed lines every one begins a comment line (`/**`, `*`, `/*`) but one, the continuation line of an inline block comment in `tick`'s parameter list.
Interface written out to writeout-after-change/ (ai-runs/index.d.mts 4,047 lines, ai-runs/schema.d.mts 38 lines).


# [file] coordinator-handoff-7nov.md

# Coordinator handoff, 7 Nov 2026 ~01:45 UTC (session_018BhcedK5yPyjY6UfMKmxzM)

Full log: notes/coordinator-findings-3-4nov.md (entries from 22:20 on 6 Nov). Problem-class register: notes/problem-classes.md (Bob, 7 Nov: find root causes so problem types tend to zero; every fix brief states root cause and class prevention). Bob's words are quoted there with times.

## Situation
- GitHub identity: believeinoakland (civicsmith suspended 6 Nov 19:19Z; Bob's support ticket open; Bob sent a short follow-up ~23:50Z). Every PR civicsmith opened is HIDDEN (404) and still holds its head branch: reopen work on <module>-2 via `job start --reopen`; tool reads of landed hidden PRs break (C13).
- BOB'S WORDS that bound this: 'BE CAREFUL. I don't want to lose access to this account too.' AND 'we need to constantly watch that we're not being overly cautious. Too much caution destroys protectivity.' Test every caution: what does it protect, what does it cost.
- Bob decided 8 job slots (copy pacing.jobs 8, pushes_per_hour 120 = PD-3, share_s 900). Recommendation given: keep 8, re-measure an hour after R17e is pinned.
- Bob waits for R17d+ pinned before applying the hook settings: send him the three complete files from notes/r17c-settings.md (process3 tranche) once R17e is pinned on the copy AND probes; then live-test (raw git push blocked, connector call counted) and run `p3 github audit`.

## In flight (in order)
1. process3 PR 211 R17e (C9 shares ride pushes, C10 one budget for every clone — copy clones were blind: same clone id 'vm', C12 cheap ledger reads). First ci red: rerun-more.test.mjs:339 compared two wall-clock readings (C14, came in with R17d); fixed at 52a7563 (injectable clock). Merge with `merge 211 --plain --rounds 2 --reviewed "..."` from a tranche worktree when ci is green. Re-subscribe (subscribe_pr_activity) first.
2. process3 PR 212 C13 (builder ef7TXuV, session_018Bhcef7TXuVjVZ4eN1SCzE): the layer gate covers a landed PR GitHub hides (land row + run artifact; pr_unreadable); head d334d38; cold review running, fixes to follow on the branch. URGENT: blocks `layer merge 9` (copy layer PR 735 gate red on pulls/696 404). Merge when green with the review in; the other landed-PR readers (receipts, --reopen, --take-in, prsFromBranch) follow as a separate PR. Re-subscribe first.
3. Then ONE pin move (after BOTH 211 and 212 merge) (copy + probes; `node tool/p3.mjs pin move ... --pin <tranche>` prints the session prompt; create_session with it) carrying R17d (1cbf056), R17e, C13. Probe pin to 46cf3f5 failed earlier (our ceiling); redo with this one.
4. BOB re-runs 735's gate; layer merge 9; layer open 10 and start its 3 jobs (monitoring, following, link-sweep; scheduler complete). Layer 11 (~60 modules) after R17e pinned and budget readable.
5. Builder ef7TXuV queue after C13, each its own PR via `node tool/p3.mjs github push`, I open PRs: C5 state-race (a6654bcb), C2 test git isolation (e85b1e66), C3 settings-admit (948d8d12), C11 test-only change + `layer clear` (bdd83b45), C8 unshallow, then R14 1b layer-prestart.
6. Builder ef1pxNY (session_018Bhcef1pxNYJCcaejqj138): after R17e, R16 switch-ready (held branch build/switch-ready).
- Push ceiling: TRUE rate was ~184/h at 01:0x (above the 6 Nov peak ~173). Keep PD-3 at 120; let the window drain after R17e pins. Read the budget only from a process3 clone until R17e is pinned (copy clones undercount).

- Problem classes added since the register was written: C8 unshallow (builder ef7TXuV, narrowing per its review), C9 bookkeeping as dominant traffic, C10 clone id collision, C11 test-only provider change, C12 fetch volume, C13 hidden landed PRs, C14 tests reading the wall clock twice. Add them to notes/problem-classes.md.

## Rules in force
- Jobs push only through their tool commands (layer publish, job sync, job complete); never retry a push a session's own permission check refused — restart.
- GitHub 5xx: wait 60 s, rerun once; stop only on repeated 5xx, rate-limit/abuse 403/429, or governor pause/stop.
- My notes: keep running notes in the scratchpad and commit + push once an hour via `node /home/user/p3-base/tool/p3.mjs github push origin start/coordinator-4nov` (the stop hook forces a push of any commit).
- Scheduled tasks: ROOT sweep trig_01HBGHt8e2s7qwtHsNoiphgs (enabled); my hourly trig_01BfrkZggFs5bCj8mdeJyo5Z (bound to this session: rebind to the successor).

## Layer state
- Layer 9: 13/13 complete; merge blocked only by C13. Layer 10: 4 modules. Lanes ux/publication told to push nothing until R17e; investigation lane idle/blocked since 17:44 6 Nov (unexamined).
- process3 merged this session: 205 R17, 206 R17b, 207 R8, 208 R17c, 209 stale-generated, 210 R17d. Copy pins: 709 (471e3cf), 710 (de5ea3a), 721 (a8a6252), 728 (46cf3f5).

## Open for Bob
- GitHub support reply.
- Settings files once R17e is pinned.
- Slot re-measure an hour after R17e is pinned.


# [file] bob_words_17nov_compaction_avoidance.md

# Owner direction: preventing Codex context-fidelity failures (17 November 2026)

**Status:** Exact owner wording followed by separately identified assistant analysis. Later, more specific clarification supersedes the older assumption that a verified one-million-token context window is the fundamental acceptance condition. No governing Process4 definition or Claude Code implementation is changed by preserving these words.

## Direct owner statement — verbatim

> Process4 is architected around the reality that every all software, even AIs, have shortcomings that must be mitigated. Whereas I often see software trying to "recover" from shortcomings, I find that the most effective means of mitigation is to avoid situations when the shortcomings become a factor. But a fundamental requirement of this approach is to identify (or sense), either at runtime or when coding, when the shortcoming is about to come into play. If a Codex-based process4 is even a possibility requires that we be able to avoid compaction entirely, because any work that happens after an unrecognized compaction could cause (silent) damage that difficult/impossible to recover from.
>
> In that light, process4 sessions don't require 1m tokens. What they require is sufficient token to perform enough useful - and correct! - work to justify the investment of time and tokens, all while protecting development from damage caused by things like document scanning, compaction, and other context management shortcomings. That is our challenge.
>
> This research confirms process4's policy of refreshing sessions when the context window exceeds 40% or more. What we need to do rigorously while we're exploring a Codex-based process4 version is identify those conditions and limits that will provide the assurances we need to productive work at a reasonable investment of time and tokens.
>
> We should set up a test to confirm those aspects of Codex related to contexts that we don't yet have, like our ability to obtain larger context windows upon request, etc.

## Assistant's implementation reading — not owner words

- The earlier absolute >=1,000,000-token requirement is superseded by a **sufficient verified context for useful, correct work**, with robust avoidance of unrecognized compaction and incomplete reading.
- **No production-authoritative work may knowingly continue after compaction or when the system cannot reliably tell whether its refresh-before-compaction operating discipline holds.** How this is enforceable with limited native hosted telemetry is a critical research question, not already solved.
- A 40% context threshold is the confirmed conservative refresh policy/direction from the owner's text; investigate role-specific early checkpoint lead time and whether 40% of a measured resolved window guarantees time to complete a bounded handoff before any compaction trigger. Never infer percent from cumulative billing tokens.
- Session replacement does not absolve the need for complete canonical reading, source version checks, and protection against truncated tool outputs.
- Efficiency is an explicit criterion: useful/correct work completed, source/decision compliance, session setup/refresh overhead, model/tool usage and ongoing state growth. A huge window with unknown telemetry is not automatically better.
- The first experiment should use disposable, source-grounded fixtures; it should determine supported context selection and runtime receipts across subscription-authenticated CLI and **native hosted child** surfaces without pretending those are the same thing.
- Continue only within subscription-funded tools and existing grants. Do not silently force compaction in any session holding authoritative product state, and do not modify CivicSmith2.


# [file] coordinator-handoff-5nov-d.md

Process3 STOPPED again, 5 Nov ~06:37 UTC, on Bob's word "Close everything": he starts a new coordinator session with the civicsmith GitHub account attached. Last coordinator: session_018Bhcec9qpHxbPMJhPWd4dX (new Claude account "Sparky"). Read with notes/coordinator-handoff-5nov-c.md (state at the 05:44 stop and how to restart), handoff b (rules, Bob's words) and the findings file from "# 5 Nov, coordinator session_018Bhcec9qpHxbPMJhPWd4dX" down.

WHY IT STOPPED
- On this Claude account, Claude's GitHub connection acted as neobobkrause (the repos' owner: GitHub reports push true, admin true on civicsmith-copy). The process's setup condition `account` (setup/conditions.json; DEVELOPER.md step 3) needs a non-admin collaborator, so `job start` and `pin move` refused at setup check. The old account acted as civicsmith (copy PRs 442 and 445 and process3 PR 145 were opened by civicsmith). Bob restarts with civicsmith attached.
- FIRST CHECK in the new session: `gh api user --jq .login` must print civicsmith, and `node .process/tool/p3.mjs setup check` (from a copy checkout at the tranche) must show `account` set. If it shows neobobkrause again, stop and tell Bob before any push.
- My mistake: I pushed and merged as neobobkrause for ~20 minutes before the setup check showed it (PRs below). All through the merge tool with its checks, nothing forced or bypassed. Run setup check before the first push next time.

DONE THIS SESSION (stands)
- process3 PR 145 (abandoned-attempt) merged 6a742cd; process3 PR 147 (gate cap 90 min, merge wait 95; one cold review, nothing blocking) merged 1b5ce60. process3 tranche tip 1b5ce60.
- Coordinator id session_018Bhcec9qpHxbPMJhPWd4dX on copy (PR 447, 8599ecf) and probe (PR 223, 68bff9d). The next coordinator records its own id again (handoff b START 1).
- Copy pin still 86a12f1: the pin move to 1b5ce60 stopped at setup check (account), nothing pushed. Redo it first: from process3 at the tranche, `node tool/p3.mjs pin move neobobkrause/civicsmith-copy --report <you> --why "PR 145 and PR 147 (gate cap 90: control-plane 290)" --pin 1b5ce60a8735756f145246559c78b60989695ed2`, start the short session it prints. Then BOB gives 290 a fresh gate event and re-gates 314.
- Copy tranche tip 8599ecf (413 last land 3e9a7e4, then PR 447).

SESSIONS ON THIS ACCOUNT (STOP sent, priority now; archived by me after their replies, see findings)
- ROOT session_018BhcegPWDbYbWFcurTADy5; BOB session_018Bhcef6ZxDw3oEq7kS2zZh (handover confirmed over old BOB session_01RAN5ejkzH3MteyRfhrb2cm); MERGER session_018BhcedtpEzDg3GepAcdV9p; watcher session_018Bhceg3QjL3CTqrQmhr3En; build/train-order session_018BhcecDHwBpChDvLZUdbKM (PR 146).
- Addresses on process-state still name these: the restart replaces them as handoff c says (start root; ROOT's handover begin for BOB; start watcher --replace <watcher above>; start merger --replace <MERGER above>). Its lease lapses 15 min after its last renewal.
- No job session was started on this account (every start refused). Live jobs 0 / 20 since 05:44.

SCHEDULED TASKS ON THIS ACCOUNT (switched off, kept; delete each once its replacement is bound to the new session)
- ROOT sweep trig_01Na422G28SHwSe2PYqPwvg8; watcher trig_01D9duefu3fb8BAjgBrLGNdi; mine: hourly flow trig_01VcLEPt7WGgBVPXasBPq54S, review-trigger check trig_01DZep9aGCsRpH9oE8vpRCgf (5 Nov 19:00), merge-train report trig_01Qwc9NxGNkp8VAiGCn6aZBw (6 Nov 04:50), survival reads trig_01AhSvTsYGmVyyUdRJC91J6r (16 Nov 17:00), trig_01YasCHRNbVkRLErtS5iUarS (18 Nov 17:00). Their prompts are readable with get_trigger on this account: reuse them.

STILL OPEN (from handoff c, unchanged): PR 146 finish and its pin move; 413 notice triage; 364 review note; 338/368 re-gate; plane attempt 4 (4cc71be1ff); holds 420/431 until 396, 441 until 423, 425/432 until 430; train study C (speculative parallel gates) awaits Bob; plane E1/E2 with BOB; words queue and lanes are Bob's.

STOP REPLIES (06:37)
- MERGER: last land PR 391 (ai-runs) at fcc0ac2f25 06:32:26Z (as neobobkrause). PR 414 (store-assembly) not landed; its re-gate on baec3a1535 was running. Lease not released; it lapses by ~06:52.
- ROOT: stopped, no further step.
- build/train-order: PR 146 tip 2e5f6c9, pushed, 803/803, tranche merged in, disk part cut to a rename, 3 review rounds (round 2's one blocking finding fixed with a test), reviews in the PR body, marked ready. Left: once ci and record are green, from a process3 tranche checkout: `node tool/p3.mjs merge 146 --plain --reviewed "3 rounds: round 1 nothing blocking, 5 fixes; round 2 1 blocking fixed with a test; round 3 nothing blocking; 803/803" --rounds 3 --decision "train order: release first, shortest gate, 45-min aging, precise provider-first hold"`, then pin move carrying 145, 147 and 146 in one move.
- BOB: no reply before the close.
- Bob archives all sessions on this account himself (his word, 06:37).


# [file] coordinator-handoff-7nov-b.md

# Coordinator handoff, 7 Nov 2026 ~04:55Z (session_018BhcefrJ17LisCLZSvEMCV)

Previous handoff: notes/coordinator-handoff-7nov.md. Log: notes/coordinator-findings-3-4nov.md (entries 01:47Z–04:55Z). Problem classes: notes/problem-classes.md (C1–C18). Bob's settings files, one per repo: notes/settings/*.settings.json (from notes/r17c-settings.md on the tranche).

## Situation
- Layer 9 MERGED 03:39Z (copy PR 735, 8.88 h). Layer 10 open since 03:39Z: monitoring landed (743), link-sweep landed (745), following (744) republishing/job-syncing, scheduler (748, early, reopen R34/R35) in flight. Early start into layer 11: op-capabilities (PR 752, layer/11 cut ahead). setup-words and record-core joined layer 11 (ruled: setup-words runs first; ~40 layer-11 modules depend on it). The 5 investigation reopens (steps, hypotheses, retrieval, project-roster, observation-log) joined layer 11; ruling: 4 with marks start ≤2 at a time, observation-log gets `layer retest` only.
- Pins: copy and probes at process3 19fe9dd (C8, R14 1b, replay-each, C12 p2, landed-PR readers). process3 tranche since then: 226 C15p3 (d88b577), 227 leftovers (0dc34de).
- BLOCKER: Bob applied R17c settings to the copy (copy PR 755, 04:35Z). Setup check at pin 19fe9dd refuses every `job start` (deny-list, shim-drift) = C17. Builder ef7TXuV has the fix on build/one-settings-policy (751dd0f6, reproduced on the copy's real settings), suite + cold review running, push waiting on the push budget. Merge it the moment it's green, then ONE pin move (copy + probes) at once; tell BOB. Bob's settings stay.
- PUSH CEILING: account at 121/120 at 04:51Z (PD-3 kept at 120, coordinator's call; Bob 6 Nov "BE CAREFUL"). BOB clone 208b86bb was 39 pushes + 512 gh calls (real work + read commands writing state = C18). BOB paused non-essential pushes ~20 min from 04:53Z (only `layer land` for 744/748); its found-mark PRs 756/757 (gates green) wait. My copy config.json coordinator-id push was cancelled (copy process/config.json still names session_018BhcecWcETw22rxhPvoZ53: redo by plain PR p3/coordinator-<date> when budget allows; probes already done, PR 234).
- My notes push (C17/C18 commit) is queued behind the budget; this handoff commit too.

## Open process3 PRs / builder queues
- 229 C16 (census flags modules without ledger entries; ef1pxNY): local merge with tranche 1110/1110; merge on green CI.
- ef7TXuV: (1) C17 build/one-settings-policy — URGENT; (2) build/append-only-state (github/use rows replayed by append; origin head 251c0b1b is DEFECTIVE — do not open until the builder sends head ed06a1b2 or later).
- ef1pxNY: fetch-split measurement 04:12–05:12Z due ~05:15Z (compare 02:25–03:25Z: 275 fetches, 24 state pushes); then C18 (read commands ride the next write; cache per-module walks).
- Merge practice: `merge <n> --plain --rounds <r> --reviewed "..."` from a tranche worktree (/home/user/p3-base) after merging the PR head with the current tranche locally and running `HOME=$(mktemp -d) GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_NOSYSTEM=1 node --test 'tool/test/*.test.mjs'`. Pin move: `node tool/p3.mjs pin move <slug> --report <me> --why "..." --pin <sha>` prints a session prompt; create_session with it (probe has no BOB address: tell its session the wake send may fail).

## For Bob (step-by-step given to him at ~04:40Z)
1–2. Settings: copy DONE (PR 755). process3 and process3-probes remain (paste notes/settings/<repo>.settings.json over .claude/settings.json via a PR into tranche). After all three: live-test raw `git push` refused, connector call counted, `p3 github audit`; retire the `github note` rule.
3. Investigation Q7–Q9 (paper https://claude.ai/artifact/THTtouNJzkhmHqyR4Pfa4g); pass answers to BOB for the copy's DECISIONS.md.
4. GitHub support ticket (civicsmith suspended 6 Nov).

## Decisions this session (coordinator)
PD-4 (census not-in-layer-map flags, not refuses; in process3 DECISIONS.md via PR 213). Rulings: C13b limits accepted (hidden-path credit from state rows only for 404 PRs); hold-26 lifted to 8 slots; lanes push again; census entries for 49 legacy modules (record, not tool guess); reopens join layer 11 (no early layer open); PD-3 stays 120.

## Scheduled tasks bound to me (rebind to successor)
hourly trig_01M3hYFufXMMvLkn6Xuas2Fz (:51); Phase 1 survival read trig_016cLJDrmGe8aSK8cgKbfd2v (16 Nov 17:00Z); Phase 2 trig_01WrTvQD3gzXNuSGj1fX2Jq6 (18 Nov 17:00Z). Create new ones bound to the successor and delete these.

## Subscriptions to renew
process3 PR 229 (and whatever ef7TXuV opens next).


# [file] coordinator-handoff-5nov.md

Process3 coordinator handoff, 5 Nov about 00:15 UTC, from session_01RAN5enU4cvkBoxmmSGsudK (context 60%, my own rule). Bob is the owner; his words are instructions. You are the Process3 coordinator: per process, BOB is per product (Bob agreed 4 Nov). Bob defines requirements; you decide everything technical and never bring him technical choices (he said so twice on 4 Nov). Plain words, no em-dashes. Every finding with times: notes/coordinator-findings-3-4nov.md (read from "19:26 took over" down).
