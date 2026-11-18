- ⟦m64n⟧Platform facts are from documentation read on 13 Nov 2026. Where Process3 measured something different, both are stated, and the seven tests decide.   {id=m64n0hyrfjc.52992 rev=None}
- ⟦m64n⟧Process4 itself is untested. It is a design judged viable on evidence, reviewed adversarially twice, and not yet run.   {id=m64n0hyrfjc.53142 rev=None}
### ⟦m64n⟧Lever 2: Claude Code runs the sessions   {id=m64n0hyrfjc.25165 rev=11}
[TABLE id=m64n0hyrfjc.25204]
| ⟦m64n⟧# | ⟦m64n⟧Recommendation | ⟦m64n⟧Held by |
| ⟦m64n⟧C1 | ⟦m64n⟧Two roles: ARCH and jobs, with in-session subagents for reading and review. Removed: coordinator, ROOT, MERGER, watcher, sweep, standing builders, two-phase handover, handoff notes. | ⟦m64n⟧Nothing to build |
| ⟦m64n⟧C2 | ⟦m64n⟧ARCH is woken once an hour by a scheduled task that you create. Its prompt is one line: read the pinned ARCH text and act on status. Sessions are denied the tools that create or edit tasks, so no session can rewrite it. One wake an hour gives room for about 576 job starts a day against a peak of 135 landings. | ⟦m64n⟧Task you own; settings deny |
| ⟦m64n⟧C3 | ⟦m64n⟧Preferred form: each wake is a fresh session, so nothing accumulates. Process3 measured that a task's fresh session could not start other sessions; that is re-tested first. Fallback: one ARCH session resumed by the task, which Process3 measured working, replaced by you at each layer close from status alone, with the old task switched off in the same step. | ⟦m64n⟧Spike 1 decides |
| ⟦m64n⟧C4 | ⟦m64n⟧A job is one module or item, one branch, one draft pull request. It starts at the integration branch's current commit, named in its START. It subscribes to its own pull request, so a red check wakes the job itself. GitHub allows one subscriber per pull request, so ARCH does not subscribe. | ⟦m64n⟧Platform subscription |
| ⟦m64n⟧C5 | ⟦m64n⟧A job's START is one line: read the pinned START text and do the named item. The START is the pull request's body, so anything ARCH adds beyond that line is visible to you. | ⟦m64n⟧Pinned text; visible record |
| ⟦m64n⟧C6 | ⟦m64n⟧Stuck work is ARCH's ordinary hourly work. Status lists pull requests open too long without a green check or a merge. ARCH re-runs a check, updates a branch, or replaces a dead job from its branch. | ⟦m64n⟧Read-only status |
| ⟦m64n⟧C7 | ⟦m64n⟧Settings in the product repository, a path that is yours: deny edits to your paths, deny force-push, deny the task and environment tools. No hooks. The Bash hook now in the product is removed. Installing Node and dependencies moves from the session-start hook to the cloud environment's setup script. | ⟦m64n⟧Settings file; environment |
| ⟦m64n⟧C8 | ⟦m64n⟧Auto memory is switched off on the cloud environment, so rules cannot build up silently between sessions. | ⟦m64n⟧Environment variable |
| ⟦m64n⟧C9 | ⟦m64n⟧Effort is set per role and not left at maximum. Jobs and reviewers run at medium; ARCH's planning at high. Anthropic documents that higher effort verifies more and tests more edge cases, so it is a dial on over-caution. | ⟦m64n⟧Start table |
| ⟦m64n⟧C10 | ⟦m64n⟧The reviewer is a fixed subagent in a path that is yours: read-only tools and a fixed brief. It runs when the gate reports deleted or weakened tests, or when you ask. One pass and at most five findings, each naming the requirement not met with file and line. Anything else is one line under Known limits. The job decides. | ⟦m64n⟧Subagent file; gate output |
| ⟦m64n⟧C11 | ⟦m64n⟧The approvals fingerprint is removed. An edit to your approvals takes effect in sessions started after it and stops nothing. Every approvals edit in Process3 halted the process, and the last one ended it. | ⟦m64n⟧Deletion |
| ⟦m64n⟧C12 | ⟦m64n⟧Live sessions stay at or below 24, and ARCH archives a job's session when its pull request merges. Process3 measured the account silently failing to start sessions at about 50. | ⟦m64n⟧ARCH's pinned text; count on the daily report |
[/TABLE]
### ⟦m64n⟧Lever 3: Claude, and the text it reads   {id=m64n0hyrfjc.28434 rev=None}
[TABLE id=m64n0hyrfjc.28473]
| ⟦m64n⟧# | ⟦m64n⟧Recommendation | ⟦m64n⟧Held by |
| ⟦m64n⟧M1 | ⟦m64n⟧Everything a session loads automatically has a byte cap, not a line cap. The product's CLAUDE.md ended Process3 at 22 lines and 8,664 bytes, which a 30-line rule would have passed. Caps: CLAUDE.md 4,096 bytes; ARCH text, START text and reviewer brief 4,096 bytes each. | ⟦m64n⟧A test that is a required check in the process repository, with no bypass, so even your merge needs the budget number changed first |
| ⟦m64n⟧M2 | ⟦m64n⟧One charter page replaces the Ledger, Foundations, Ledger map, README, decision records and rulebooks as reading for sessions. It states purposes. The frozen artefacts are the mechanism. | ⟦m64n⟧Byte cap |
| ⟦m64n⟧M3 | ⟦m64n⟧Prompts are written the way current guidance recommends: say what to do, give the reason, plain words, no emphatic words, no verification instructions, no lists of prohibitions. | ⟦m64n⟧Your merge |
| ⟦m64n⟧M4 | ⟦m64n⟧Your word is what your GitHub account wrote: a commit, a review, or a comment. Sessions quote it with a link and never paraphrase it as yours. Text a session drafted and you approved is recorded as approved by you, not as said by you. A session's own decision is recorded under the session's name, which the charter allows as a citation. A remark in chat applies to the task in hand and lapses at the end of the run unless you put it in writing. | ⟦m64n⟧GitHub authorship |
| ⟦m64n⟧M5 | ⟦m64n⟧Questions for you live in one pinned issue, numbered. ARCH adds a question with options and a recommendation. You answer there in your own words. A decided question is never asked again because the answer is on the page. | ⟦m64n⟧One issue |
| ⟦m64n⟧M6 | ⟦m64n⟧Re-test at each model release stays: remove one component at a time and observe. | ⟦m64n⟧Retrospective |
[/TABLE]
⟦m64n⟧The working agreement every session reads (draft, about 120 words; it replaces the rulebooks):   {id=m64n0hyrfjc.29926 rev=None}
- ⟦m64n⟧The output that counts is product behaviour merged and passing its walk.   {id=m64n0hyrfjc.30023 rev=None}
- ⟦m64n⟧You may do these without asking: the listed acts for your role.   {id=m64n0hyrfjc.30097 rev=None}
- ⟦m64n⟧The process is fixed for this run. If it gets in your way, work around it, add one line to the process log, and carry on.   {id=m64n0hyrfjc.30162 rev=None}
- ⟦m64n⟧When something fails, find out why before changing anything. If the cause is in your module, fix it there. If it is elsewhere, tell ARCH in one line.   {id=m64n0hyrfjc.30285 rev=None}
- ⟦m64n⟧A "what if" gets one line under Known limits. Build against things that have happened.   {id=m64n0hyrfjc.30436 rev=None}
- ⟦m64n⟧A question from Bob is a question. Answer it. Change something only when he says to build.   {id=m64n0hyrfjc.30524 rev=None}
- ⟦m64n⟧Push before you stop. When you are done or blocked, say so and stop; stopping with nothing to do is correct.   {id=m64n0hyrfjc.30616 rev=None}
### ⟦m64n⟧Lever 4: Cloudflare shows whether the product works   {id=m64n0hyrfjc.30725 rev=12}
[TABLE id=m64n0hyrfjc.30777]
| ⟦m64n⟧# | ⟦m64n⟧Recommendation | ⟦m64n⟧Held by |
| ⟦m64n⟧F1 | ⟦m64n⟧Deploy-and-walk runs as a GitHub workflow, never from a session: at each layer close, when ARCH dispatches it, and at least once a day on a schedule. In Process3 no deployment ran for 80 hours while 308 landings went in. | ⟦m64n⟧Workflow in the dev environment |
| ⟦m64n⟧F2 | ⟦m64n⟧The walker's step definitions are yours. "Walk steps passing" is the deciding number, so the code that computes it must be out of a job's reach. Walk failures become product jobs in the next round. | ⟦m64n⟧Your path list (G2) |
| ⟦m64n⟧F3 | ⟦m64n⟧A separate Cloudflare account for development. The product's fresh-copy-per-walk design needs account-level rights, which should never sit beside production. | ⟦m64n⟧Account boundary; token scope |
| ⟦m64n⟧F4 | ⟦m64n⟧No coordination or heartbeat service is built on Cloudflare. It would be another custom tool to maintain. | ⟦m64n⟧Deletion |
| ⟦m64n⟧F5 | ⟦m64n⟧Branch previews and live observability are tried after run 1, on evidence. | ⟦m64n⟧Retrospective |
[/TABLE]
### ⟦m64n⟧Lever 5: The product makes the true checks cheap   {id=m64n0hyrfjc.31705 rev=None}
[TABLE id=m64n0hyrfjc.31754]
| ⟦m64n⟧# | ⟦m64n⟧Recommendation | ⟦m64n⟧Held by |
| ⟦m64n⟧P1 | ⟦m64n⟧Run 0 clears the residue: the 211 process-artefact test files, the Bash hook, the state branch, the push ceiling set to 1,000,000, and the requirements size-cap refusal. The gate workflow shrinks from 273 lines to a call to the reusable one. | ⟦m64n⟧One pull request you merge |
| ⟦m64n⟧P2 | ⟦m64n⟧Run 1 has a product goal: merge Layer 14, left one merge short, then make the walk pass. It failed 147 of 157 live steps at the stop. | ⟦m64n⟧The daily number |
| ⟦m64n⟧P3 | ⟦m64n⟧A layer's jobs start together. 182 of 220 modules depend on a module in their own layer; starting in strict dependency order would cost about four days. | ⟦m64n⟧ARCH's pinned text |
| ⟦m64n⟧P4 | ⟦m64n⟧The module map and round plan are ARCH's files, not guarded. The map changed 40 times in the week through legitimate splits. Requirement files too large to read whole are split at planning time. | ⟦m64n⟧Product-technical by the path list |
| ⟦m64n⟧P5 | ⟦m64n⟧Type-checking and lint are absent from the product. They are fast and run the product's code, and adding them is your engineering decision. Decide at the first retrospective, on a count of walk failures they would have caught. | ⟦m64n⟧Count |
[/TABLE]
### ⟦m64n⟧Lever 6: What is left of the process tool   {id=m64n0hyrfjc.32874 rev=None}
[TABLE id=m64n0hyrfjc.32916]
| ⟦m64n⟧# | ⟦m64n⟧Recommendation | ⟦m64n⟧Held by |
| ⟦m64n⟧N1 | ⟦m64n⟧The tool is one read-only status command, rebuilt small, not trimmed down from 23,429 lines. It reads the module map, the round file, branch names and pull requests, and prints what is ready, what is stuck, and the last walk. It cannot refuse, hold or write. Budget 500 lines. | ⟦m64n⟧Line-count test, required, no bypass |
| ⟦m64n⟧N2 | ⟦m64n⟧One process version per run. The pin moves only by your merge. You can merge a fix mid-run when you judge it worth it; the daily report counts process versions per week so the total stays in view. Process3 moved 102 times in six days. | ⟦m64n⟧Your path list; count |
| ⟦m64n⟧N3 | ⟦m64n⟧A process log: one pinned issue, one line per problem with the workaround used. If no workaround exists, the job marks its pull request blocked and stops, and ARCH works on something else. | ⟦m64n⟧One issue |
| ⟦m64n⟧N4 | ⟦m64n⟧A retrospective between runs, when you commission it. A fresh session in a fork reads the log and the daily numbers. It brings at most three changes, each net zero or smaller in tool lines and prompt bytes. "Change nothing" is always the first option and is priced. | ⟦m64n⟧Fork pull request; budget tests |
| ⟦m64n⟧N5 | ⟦m64n⟧Whatever misfired is removed by default. At the retrospective, a check that wrongly blocked product work even once goes, unless you decide to keep it. Repair needs your decision; removal does not. | ⟦m64n⟧Retrospective rule in the charter |
| ⟦m64n⟧N6 | ⟦m64n⟧Run 0 has its own budget and a replay. The Process4 kit is built in a fork under a line budget. Before it is frozen, the gate is replayed against 20 to 30 pull requests that already merged in Process3. | ⟦m64n⟧Budget test; replay result |
| ⟦m64n⟧N7 | ⟦m64n⟧Deleted with no replacement: receipts, record and size checks, census, forced layer re-sync, companion land order, notice triage as a mechanism, idle alarm, six-job limit, push ceiling, usage ledger, hourly audits, session-written decision records, handoff notes, tranche-open grant trials, shim drift check, settings rollback refusal. None has a recorded catch. | ⟦m64n⟧Deletion |
