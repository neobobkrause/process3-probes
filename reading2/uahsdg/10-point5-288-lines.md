His words: "Do not add tests, gates, reviews or checks. Process4 has three tests, ever." (words-b:34); "There is no need to any any more tests. PERIOD!" (words-c:14); "O13: three tests and no others" (words-c:46). All classifications below are (J).

**Arguably ended (9): the line is itself a check that can stop work, a re-test, or a review.**

| Code | Why arguably ended | Why arguably not |
| --- | --- | --- |
| F-SET-3 | A check that stops a job's start; same kind as the credentials check named in proposal 13 | Not named in proposal 13 |
| F-SET-8b | Part of the same check | As above |
| REC-10 | "A CI check fails any commit" | Its second half, the scheduled clean-up, is not a check |
| F-SET-6 | "record required": a second required check beside the module tests | Proposal 13 named only the guard inside that check |
| REC-8 | An audit, "a later gate" (FD:121); never built, so building it would be adding a review | It files a report and stops nothing |
| F-SHAPE-6, MNT-11, F-MNT-2 | "re-tested"; "The approval test reruns too" | They test the process, not the product; he typed "O5: agreed" (words-c:38) to tests for the process's own tool in the same message |
| F-PLAT-9 | "tried ... at each tranche's open before any job starts": a check before work begins | The recording and counting are a measurement |

**Reached only weakly or in part (4).** REC-9: only the schema check that held it (FD:110), not the file format. TXT-2, F-REQ-9, TXT-1: a rule for writing called a "test", with deletion "on review"; not a test of the product and not a check that stops work.

**Not ended by his words, but left without a source by what the draft takes his answer to proposal 13 to end (5).** F-MNT-4, SES-12, F-SHAPE-5, F-MNT-7, F-HOW-1. The first health number is defined by "the gate's re-run and revert check" (FD:233) and "independent re-verification" (LL:1007); the re-run and the revert check ended on that answer and review on record line 21.

**Nothing of his typed words ends them (15).** SES-16, TM-1, TXT-4, F-REQ-7, TM-4, TM-8, JOB-7, JOB-10, JOB-11, GAP-2, TM-2, REQ-6, TM-6, TXT-6, F-SHAPE-4. JOB-7 rests on a session's record of him of 9 Nov. For TXT-6 the draft leans on his PROCESS paragraph (words-b:25), which makes him the chooser of each process change but does not say a rule need not cite a failure.

9 + 4 + 5 + 15 = 33.

The statements of his that the draft used instead of proposals: "Decide technical matters yourself and tell me what you decided." (words-b:31) and "Many of the questions asked in section M of v4 are technical and highly detailed. You're better qualified than I am to answer many of these questions." (words-c:22). The second was about the fourth draft's list of unsettled points, says "many", and names none (V for the wording; A for the reading, audit:106). His rule for changes to what he defined: "When you change something I defined you need to describe the PROPOSED change in words I understand so that I know what you're proposing and whether to approve the change or not." (words-b:15).

## 3. The 53 kept lines stated nowhere

The appendix lists them at appendix:73 (50 coded f, 3 coded g). The audit says of the absence: "Measured by search of the fifth draft for each line's subject." (audit:64) (A). Spot-check by me: the draft has no occurrence, in any letter case, of "status", "refresh", "threshold", "lock file", "undelivered", "duplicate", "shim", "onboarding", "live site", "archiv", "certif", "one reading", "Node", "setup script", "run the product", "dogmatic", "unmerged work", "restat", "provided service", "deliberate attack"; "hook" appears once, about two retired hooks (v5:297); "audience" once, in another sense (v5:13) (V: grep of v5). That supports the audit for the lines those words belong to. I did not re-read the whole draft against all 53.

The third draft had a sentence saying how many lines stand as written, which covered unmentioned lines; the fifth has none and says the lines "were not recounted" (v5:303) (V for v5; A for the third draft, audit:62).

"Conflict" below means conflict with his typed words of 14 Nov. All conflict judgements are (J) unless a source is given.

### Group A. Sessions: short, replaceable, started from the record (8 lines)

| Code | Exact text | Source |
| --- | --- | --- |
| F-REC-3 | "Sessions are kept short, because a session's cost grows with its context times its turns; BOB refreshes at the start table's threshold (P13, SES-4)." | FD:106 |
| P13 | "Sessions are kept short: state lives in the build state, never in a long context; a session's cost grows with its context times its turns; BOB refreshes past a set share of its window (40% then)." Note (copy of the suggestion): "Keep the cost reason and the rule; the threshold stays in the start table (SES-4, SES-6) rather than a fixed 40%." | LL:1536, 1540; modified 3 Nov |
| SES-4 | "The refresh threshold is read from get_session by status and printed as REFRESH when passed; the rule is text, not a hook." | LL:919; kept |
| SES-13 | "A session that outlives its parent is ordinary and costs nothing idle; no step counts on a parent being alive." | LL:1018; kept |
| PLT-10 | "A session's platform status is never read as its work state; the record is." | LL:111; kept |
| INT-5 | "Nothing in a merge or close depends on archiving a session; retirement of a job is a record line." | LL:850; kept |
| SES-17 | "Urgency and persistence instilled through memory, style and goals so sessions keep working until legitimately blocked." | LL:1062; kept |
| TM-11 | "Model and effort table costs (SES-8)" / "Tokens per merged PR by role and model" / "Tranche close" | FD:281 |

To state them the definition would have to say: sessions are kept short and the architecture session is replaced at a set fill level, not only when it "dies or fills up"; where that level is kept and what prints it; that no step relies on the session that started another still being alive, on the platform's own status for a session, or on archiving; how sessions are made to keep working; and whether the cost of the model and effort settings is measured. SES-4 needs the command that prints the state (section 5). No conflict.

### Group B. Recording acts and sending messages (3 lines)

| Code | Exact text | Source |
| --- | --- | --- |
| REC-5 | "A remote act is recorded as done only from the tool call's result, never from its request." | LL:249; kept |
| MSG-3 | "Push-then-send is one tool command; messages are numbered and a duplicate is ignored." | LL:1189; kept |
| MSG-6 | "A message that cannot be delivered is recorded as undelivered in the sender's record and listed by status." | LL:1222; kept |

To state them: three sentences on the process's tool. MSG-6 needs the command that prints the state. No conflict.

### Group C. What each session reads: reading lists, rulebooks, plain texts, module size (11 lines)

| Code | Exact text | Source |
| --- | --- | --- |
| SES-5 | "Each role's reading set is fixed in advance and printed with sizes at its start." | LL:930; kept |
| F-REQ-11 | "Each role's reading set is fixed and printed with sizes (SES-5)." | FD:173 |
| SES-7 | "A summary for a task is an option BOB may take, written by workers citing sources, never required by the tool." | LL:952; kept |
| F-REQ-13 | "A summary is an option BOB may take for a set far over budget, never a requirement (SES-7)." | FD:173 |
| TXT-5 | "Process rulebooks load by role through one skill; product rules load by path when a matching file is read." | LL:1131; kept |
| F-REQ-6 | "Each role's starting prompt names its own rulebook in the pinned process (rulebooks/\<role>.md), so a role loads only its rules; product rules load by path (TXT-5)." | FD:169 |
| TXT-7 | "Every text names its audience and speaks to it directly: plain words, no jargon, enough context to understand." | LL:1153; kept |
| F-REQ-10 | "Every text names its audience and speaks plainly (TXT-7)." | FD:171 |
| SES-10 | "Workers run in the background, read exactly what their brief names, and return machine-readable receipts rather than narration." | LL:985; kept |
| P6 | "A module fits in one reading: one session can read, in full, its code, its requirements and the requirements of the services it uses." | LL:1480; kept 3 Nov |
| F-REQ-3 | "A module fits in one reading: one session can read in full its code, its requirements and those of the services it uses (P6)." | FD:165 |

To state them: each role's reading list is fixed and printed with sizes; a summary is optional; each role's starting text names its own rulebook; every text names its reader and is plain; helpers read what their brief names and return a result a program can read; a module fits in one reading. No conflict. How a role's rulebook reaches a session that holds only the product's repository is one of the unsettled matters of the handoff's third point, so TXT-5 and F-REQ-6 cannot be stated in full until that is settled. P6 and F-REQ-3 are the purpose behind the size cap of proposal 6.

### Group D. Requirements, and how tests are written (7 lines)

| Code | Exact text | Source |
| --- | --- | --- |
| REQ-2 | "A requirement states behaviour at the interface, never an implementation; an ambiguity is removed by rewriting the text." | LL:409; kept |
| REQ-3 | "A figure at a scale beyond the suite is a measurement with its own plan id, never a Test line; a review never counts an untaken measurement as a gap." | LL:420; kept |
| REQ-4 | "A not-yet-met mark is struck only by the job that meets it, in its own commit." | LL:431; kept |
| REQ-5 | "A change to what a provided service means goes to you only by the DES 1 test; every other change is BOB's, recorded once." (Foundations: "A change to what a service means comes to you only where it changes what the product does for its users and the canon is silent (REQ-5).", FD:165) | LL:442; kept |
| ARC-3 | "A test asserts on a text's key, never on its words; every user-facing sentence lives once in the word table." | LL:362; kept |
| ARC-5 | "Every check and gate finding names module, file and line in one machine-readable result that status reads; a red is never searched for in a log." | LL:384; kept |
| F-FOR-2 | "The canon and each module's requirements, cited by id" (the cell saying where his product-manager attributes are carried) | FD:23 |

To state them: a requirement states behaviour, not how it is built; only the job that meets a "not yet met" mark removes it; which changes to a service come to him; tests check a text's key, not its wording; a test failure names module, file and line; his audience attributes live in the product's canon and the modules' requirements. Conflicts: REQ-3 keeps measurement runs at scale beside the tests, which may read as a further test (A: audit:253, conflict 5), and speaks of "a review", which has ended. ARC-5 speaks of "every check and gate"; only the module tests remain as a gate, and "status reads" needs the command that prints the state. The record of 13 Nov lists ARC-3 among lines ended, in the session's own sentence, which the draft does not follow (A: appendix:96). REQ-5 bears on the notification study; no conflict.

### Group E. A job's working rules and its test run (6 lines)

| Code | Exact text | Source |
| --- | --- | --- |
| JOB-3 | "A module's earlier unmerged work is taken in by a tool command on the job's own branch." | LL:580; kept |
| JOB-4 | "A job is never restarted for a process reason; a blocking flaw holds it at its next command, the fix lands, the same job continues." | LL:591; kept |
| GAT-5 | "The gate installs every lock file the product has, where it sits, and runs the product's Node version." | LL:759; kept |
| F-GATE-1 | "... the tool's test command does the same for the module's lock files in a job session, so a job's suite never depends on the session's setup hook (measured 2 Nov: the hook installed 7 of 10)." | FD:153 |
| SHM-5 | "A product's own session setup (toolchain, installs) is the product's script, run by the session's first command on the product's instruction, not by a hook." | LL:1426; kept |
| P23 | "Repository: it holds only what a session must read or a merge must carry; generated output, captures and finished records leave the working tree; history is kept and is never required reading." | LL:1600; kept 3 Nov |
