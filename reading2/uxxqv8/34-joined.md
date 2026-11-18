# [file] coordinator-handoff-7nov-b.md (continued)

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
