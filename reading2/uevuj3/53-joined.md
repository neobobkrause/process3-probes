# [file] interface_changes_log_pr96.txt (continued)

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

--- not interface changes, recorded for the reader's complaints ---
N1 | ExitNotFound | `@property {never} [status]` added so `aiStop` and `aiWithout` may read `status` off the one exit's answer; the form itself is unchanged (it never carried `status`) | annotation only | (a) index.mjs(5497,78) (5507,78)
N2 | private helpers #dispatchMember, #memberChoice, #afterStop, #redispatch, #hopAnswered (and its inner `lvl`), #flagOnly | given a kind in a comment, the file's own device ("typed so the public answers built from it can be checked") | annotation only | needed so the new public answers check
N3 | stale notes removed | "not yet met" notes on R9 (OpenArgs, DECLARED_OPS), R19 (RunSession), R28 (RunFacts), R72 (UsageEntry), R78 (partAdmitted), R99 (RunLogEntry), R100 (RunLogRow): the requirements diff unmarks these and the code meets them | (c) confirms what (a)/(b) found
N4 | kept as it was | testBarRecord's note that R75 moves the act to ai-gate: R75 is still marked not yet met
N5 | not touched | R106 (`idem` on tick, close, spawnPayload) is still marked not yet met; the comments before the change did not speak of it and the code does not read `idem`
N6 | narrative (not interface) comments | two inline parameter comments of `tick` and one sentence added to the narrative above `dispatchMemberRun` were corrected because they state a public method's handed shape or refusal order; other narrative comments on private methods (#aiRunDispatch's body, #dispatchAccount, #aiAccounts, #segmentEnd) still describe the path before T53 and were left

--- tally ---
73 changes recorded. By how found: (a) reader complained 16; (b) code diff only 52; (c) requirements diff only 2; (d) tests diff only 3.
Could break an existing user: 22 = (a) 5, (b) 14, (d) 3. Only add or widen: 51 = (a) 11, (b) 38, (c) 2.
The reader's 45 complaints before: 27 new with the change (25 map onto the 16 (a) lines above, 2 are N1) and 18 that stand against the pre-change source too.

--- at the end ---
Reader run again (work/reader-after-ai-runs.txt): 18 complaints remain on index.mjs, 0 on schema.mjs. They are the same 18, message for message and column for column, that the reader lists against the source as it stood before the change (work/reader-baseline-before-change.txt): 6 in workProducts (a lens block read off `{}`), 1 in open (`origin` a text where OpenStarted names two words), 2 in openMany and 1 in listInContext (a text where RunContextType or RunMode is named), 4 in wake (`dispatch` added to a wake after it is built), 2 in verificationRecord and 2 in testBarRecord (run-rules' refusal `ok: boolean`, `mode`/`part` a text). Each is the code being looser than a kind that is right about what it answers; none says a comment is untrue of the change, and silencing one would take either a change to running code or a loosened kind.
Only comments changed: both files, pristine copy and edited, were written out by `tsc --allowJs --removeComments --noResolve` and the two outputs compared byte for byte: identical (index.mjs 2,626 lines, schema.mjs 191 lines; work/verify.sh, work/nc/). A second check: of the 845 changed lines every one begins a comment line (`/**`, `*`, `/*`) but one, the continuation line of an inline block comment in `tick`'s parameter list.
Interface written out to writeout-after-change/ (ai-runs/index.d.mts 4,047 lines, ai-runs/schema.d.mts 38 lines).


# [file] coordinator-handoff-4nov-b.md

Process3 coordinator handoff, 4 Nov about 04:52 UTC, from session_01RAN5eniJPZwnDgHRYfWFQb (context 73%, over refresh). Bob is the owner; his words are instructions. You are BOB, the Process3 coordinator; Bob defines, you decide everything technical (P17). Bring Bob only acts only he can take (rule 9), as one list. Plain words, no em-dashes.
PRIORITIES (Bob, 3-4 Nov): as fast and as safely as possible; urgency must be fully supported in process3's initial release; Process3 must be ready for Civicsmith soon; development releases only. Fix by rewriting the line a thing belongs to. Measure once.
READ FIRST: this note; notes/coordinator-findings-3-4nov.md (every measured finding, 3-4 Nov, with times); notes/gate-map-4nov.md (Build Plan gate map). Build Plan doc cccf8cb8-a719-4f73-96f2-9ab0e2aaa897 is at rev 232 (urgency targets in the Phase 3 gate; settled corrections in).
