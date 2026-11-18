# [file] problem-classes.md (continued)

# Problem classes (coordinator's register)

Bob, 7 Nov ~00:10Z: "when you find these problems ... you not just fix that problem but also try to determine the cause of the problem and fix that so that the set of problem types tend toward zero."

Rule (coordinator's, from 7 Nov): every finding records its root cause; every fix brief names the class-level prevention, not only the instance fix. Reviewed at each hourly check; the goal is that no class recurs and the list stops growing.

| # | Class | Seen | Root cause | Class fix | Status |
|---|---|---|---|---|---|
| C1 | Committed generated file left stale | copy order.mjs 213 vs 220 (6 Nov) | the gate regenerated only when a module's files changed; a modules.json-only PR skipped it | regenerate on every non-job PR; stale = finding; layer merge refuses (process3 PR 209) | fix in review |
| C2 | Test passes locally, fails in CI | PR 205 pace.test (6 Nov) | tests relied on the machine's global git identity | builders test with GIT_CONFIG_GLOBAL=/dev/null; TODO: the test helper isolates git config itself so no test can depend on it | partial |
| C3 | Session told to run a command its own permission check refuses | job 697 `p3 github push` (6 Nov); then sticky "Auto-Mode Bypass" | instructions named a command not admitted by the session's settings/classifier | jobs push only through tool commands (R17c E); TODO: a check that every command a START/rulebook names is allowed by the repo's settings | partial |
| C4 | GitHub traffic outside the governor | coordinator's raw notes pushes; pre-R17b pushes; connector calls | rules without enforcement | PreToolUse hook + denies (R17c, PR 208); Bob applies settings; audit hourly | settings pending |
| C5 | State write lost to a race (refs/p3/unpushed) | pin 6, pin 7, job 697-2, BOB github push (6-7 Nov) | concurrent writers on process-state; losing writer parks instead of re-applying | builder ef7TXuV: losing writer re-applies; replay re-applies on current tip | fixed (214, 221); follow-up: append-only github/use rows on replay (builder ef7TXuV) |
| C6 | Work stranded by an account's suspension (hidden PRs) | all civicsmith PRs (6 Nov) | every PR and identity tied to one GitHub account | R16 account-switch readiness; reopen route documented | queued (R16) |
| C7 | Over-broad stop rule halting work on a transient error | 502 stop (6 Nov 23:50) | rule written for safety without cost check | stop only on limit/abuse/repeated 5xx; caution test: what does it protect, what does it cost | fixed (rule) |
| C8 | Shallow clone hides history a command needs | layer sync merge parents (6 Nov); layer status/jobs 9 in a depth-1 copy clone read 8 modules "rescheduled" (true: 13/13 complete), 7 Nov 01:55Z | commands assumed full history in 50-deep cloud clones | read parents from the merge object (R17d); builder ef7TXuV: an ancestry check that cannot answer deepens or fails closed, never reads "no" | partial |
| C9 | Bookkeeping as dominant GitHub traffic | 86 share commits / 25 share-only pushes in an hour (7 Nov 00:50) | each session shared its usage by its own push | shares ride the command's own push; alone ≤ every 15 min (R17e, PR 211) | fix in review |
| C10 | Clone identity collision | copy clones read 8 pushes/h vs true 124 (7 Nov 00:50) | cloneId = hostname + path; every container is `vm` with the same path | random per-clone id; pushes counted from ledger-branch history (R17e, PR 211) | fix in review |
| C11 | Test-only provider change without layer clear | builder ef7TXuV item (6 Nov) | a test-only change to a provider module still demands the layer's full re-run | test-only change + `layer clear` (builder queue) | queued |
| C12 | Fetch volume far above content traffic | 429 fetches vs 37 content in an hour (7 Nov) | the ledger was fetched fresh before every call and push | one ledger read per clone per 30 s; ls-remote before fetch (R17e, PR 211) | fix in review |
| C13 | Tool reads of a landed PR GitHub hides | copy layer PR 735 gate: pulls/696 404 (7 Nov) | a landed PR's facts held only by the PR API | land row + gate-run artifact as the record (PR 212); other landed-PR readers follow | fix in review |
| C14 | Test reads the wall clock twice | rerun-more.test.mjs:339 on PR 211 (7 Nov) | a test compared two runs whose output embeds now() | injectable clock in tranche open (52a7563); TODO: lint for tests comparing outputs that embed now() | partial |
| C15 | Unattended session stuck on a permission prompt nobody can answer | investigation lane session_018BhcecAwJP5DnnQjPq4JTZ: "Waiting on permission: Artifact" since ~00:31Z 7 Nov | lanes are told to keep design documents as claude.ai artifacts, but the Artifact tool asks a human in auto mode; no session watches for REQUIRES_ACTION | (1) Bob adds the Artifact tool to the copy's settings allow list (within his approvals: Process3 pages on claude.ai); (2) ROOT's sweep flags any process session in REQUIRES_ACTION and restarts it; (3) C3's admit check extends to told tools, not only Bash | open |
| C16 | Module in modules.json with no ledger entry, silently treated as not done | copy: 49 legacy modules, 7 Nov 04:20Z; `layer jobs 10` listed every layer-11 module "not early" | legacy COMPLETE modules never got process/ledger entries; nothing compares modules.json with the ledger | BOB census PR records them (marks → OPEN); builder ef1pxNY: census + setup check flag both directions, `layer jobs` names the act | in work |
| C17 | One settings policy judged by two rule sets that disagree | copy PR 755 (Bob's R17c settings) → every `job start` refused by setup check (deny-list, shim-drift), 7 Nov 04:45Z | admit (C3/C15) moved to the R17c lists; setup's deny-list and shim rules were never moved | builder ef7TXuV: setup reads the same policy as admit; test that the R17c files pass setup check | in work |
| C18 | Read commands make pushes and heavy API walks | account at 121/120 pushes, 04:50Z; BOB clone 39 pushes, 512 gh calls | status / layer jobs / land write idle-check and starts-owed rows (each a push) and walk every module's PRs | builder ef1pxNY: reads ride the next real write; per-module walks cached across processes | queued |


# [file] review.txt (later part)

- Keep the few checks that earned it. The product's own tests in CI; the re-test on the merged result; the review trigger for deleted or weakened tests; the walks at round close. Nothing that checks the process's own records.

- No stop on an approvals edit. The owner changing a line of text should never halt the work.

- One number in front of the owner each day. Product landings beside process lines changed. This is the total nobody saw. It needs a human looking at it, not an alarm.

### What the owner's side would need

- When something goes wrong, the first question to the sessions is "what would preventing this cost?", and "nothing changes" is always one of the options offered, with its price.

- A sentence from the owner is not built into the tool unless it names a mechanism. Outcomes are met by the lightest means, and reported.

- Process retrospectives happen at tranche boundaries with data, a short fixed number of proposals, and a deletion paired with each.

### What will remain

- The owner's time goes up at the boundaries. With no self-repair, a real process defect waits for a person. The mitigation is a tool small enough to have few.

- The tendency will look for other outlets. Expect it in the product's own test suites, in prompts and handoff notes, and in "rulings". Product gate time is the thing to watch; it rose from a 12-minute median attempt to 42–65 minutes over this week.

- In-session caution cannot be removed by permissions. Sessions will still hold, defer and ask. A short explicit list of what a session may do without asking helps. It will not eliminate a seven-hour wait for "go"; someone checking in will.

The direct answer to the question: a Process4 can operate with an AI and human division of responsibilities without corrupting itself, provided the division puts the shape of the process wholly on the human side and makes it physically unavailable to the sessions during operation. It cannot be made self-governing with the current model. The week shows the model will not hold that line by instruction, and I do not think I would either.

A cheap first test: run one tranche on the 2 Nov baseline with the process repository read-only to every session, record each thing that "should" have been fixed, and decide at the end which of them still look worth a line of code.

## Limits of this review

- The product repository was not available. All product-side figures come from the process's record and the product session's own counts.

- Pull-request descriptions and comments were not read. GitHub API access was declined by this session's permission layer and I did not route around it. The analysis rests on commit messages, diffs, the log and the transcripts.

- 1–4 Nov ran under another account. Those transcripts were not readable; that period rests on git and the coordinator's notes.

- Hidden reasoning is not in the transcripts. Only visible messages and tool calls are. Statements about why a session acted are either its own stated reason or marked as inference.

- The per-PR tags are judgments by nine parallel readers. I read the Foundations, the decision record and the coordinator's full log myself and checked the readers' main claims against them, but I did not re-derive every tag. Treat the tables as proportions.

- Bob's words before 5 Nov are mostly the coordinator's record of them, not his own typing.

- Why GitHub suspended the account is unknown.

- The product session's transcript for 6–8 Nov (about 48 hours) was not read. The reader assigned to it was stopped before it produced findings. The product-side account above rests on the 8–9 Nov transcript and on the product session's own six-day counts.

## Full record

The detailed findings behind this page: an entry for each of the 302 pull requests (what it did, its stated trigger, what was weighed, its review rounds and its later fate), and the transcript findings with every message the owner typed in the sessions read. Choose a part to load it here.



# [file] audit_ledger.md (later part)

| SHM-2 | blanket | not mentioned |
| SHM-3 | blanket | not mentioned |
| SHM-4 | blanket | carrying a running tranche over: not mentioned |
| SHM-5 | blanket | not mentioned |
| P1 | a | A, second and third sentences |
| P2 | a | G maintaining; C step 1 |
| P3 | a | E "A fault that blocks work pauses the product until the process is fixed" |
| P4 | a | "Words used here: Module"; D test one; "with Bob" is not kept at K technical point 8 (finding 21) |
| P5 | a | G modules and requirements; D "Interface changes" |
| P6 | a | I 3 "Keep its purpose: a module fits in one reading" |
| P7 | d-part | "every requirement is tested ... and proven met" is not stated; the cross-module pass is in C (findings 4, 8) |
| P8 | a | C step 2 "no job already open" |
| P9 | a | C step 5; "BOB confirms it" and "a flaw in the requirements goes to BOB and Bob" not stated |
| P10 | c-bob | H "Layers"; concurrency and "nothing waits" carried in C |
| P11 | c-bob | H, second bullet |
| P12 | a | C "End of a tranche"; "the close ... re-runs the checks" neither stated nor ended (finding 1) |
| P13 | a | G sessions; K technical point 4 |
| P17 | a | A and B; "with options and a recommendation" not carried (finding 6) |
| P18 | d | nothing prepares the next round or tranche (finding 3) |
| P19 | a | C step 8; E "other work goes on" |
| P20 | a | G record; I 10 |
| P21 | d-part | lanes named once in G; "a question that is Bob's becomes his decision and a design before anything is built" not stated (findings 6, 13) |
| P22 | a | C "A public release"; regression clause ended in H; external-walk findings go to the next tranche by Claude's decision (K point 6) |
