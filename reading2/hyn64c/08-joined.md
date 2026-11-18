# [file] audit2_feasibility.md (continued)

2. **Sentences.** Section O: "Judged cost to you: one sitting of about half an hour, one settings change, two session starts, one edit to your approvals and one 'stop'. Each claim gets one rehearsal unless a number is given." And the list under it.
3. **Rests on.**
   - Counted today, `process3-probes`: default branch main; its tranche branch has a pinned Process3, the "act on nothing" line, the Process3 required check, and the allow rule naming the Process3 tool.
   - Measured (`permissions_inventory.md` row 34): pushes by sessions in that repository were "Refused 2 of 2" on 8 Nov, "judged dangerous", no reason recorded.
   - Reasoning, item by item. *Walk shared by journey; deployment and external walk; Cloudflare bearing the walkers; a release prepared:* made-up modules have nothing to walk, deploy or release, so these cannot be tried there at all. *Account switch:* needs a second Claude account with its GitHub connection and cloud environment, which are acts of Bob's not in the cost line. *Watcher takeover:* needs a dead ROOT and the watcher's next wake. *The alarm does not undo a stop:* needs at least an hour's wait. *Finished sessions and the limit:* needs about fifty sessions. *Tranche into main:* already done 13 times on this very repository. *Mechanical edit with every touched module's tests:* cannot show the real size (60 modules, 40-minute suites). *Twenty merges:* the draft itself says they bound the refusal rate only below about 14%. *The slot rule gives the same answer every time:* true of any script; it settles nothing about sessions.
4. **How bad.** Costs Bob time; misleads him on what the trial will have shown.
5. **Status.** Partly RAISED BEFORE (register 65, 71, 72). The probes facts and the item-by-item reading are NEW.
6. **Best answer.** Split the trial list in two, honestly: what the made-up modules can show (start, approvals, merges, slots, state, stop, PROCESS start), and what only the real product's copy can show (walks, deployment, release, the merge to main, the big mechanical edit). Restate Bob's cost with the conversion commits counted.
7. **Whose.** Claude's to decide; the cost is Bob's to accept.

### 18. An account switch and a suspended GitHub account are named but not described

1. **The fault.** The body has no passage on switching accounts: only a row in Bob's acts and a line in the trial list. For a suspended sessions' account there is one line under risks. Both happened in Process3 and both stopped everything.
2. **Sentences.** Acts table: "At the start of a product and at an account switch". Section O: "An account switch loses no work. It failed on 5 Nov and was cancelled on 7 Nov." "Why GitHub suspended the sessions' account on 6 Nov was never learned." Section G: "The stop is a line in the shared state naming the account."
3. **Rests on.** Measured (`roles` 3.4): on 5 Nov the new account first had no GitHub connection, then pushed as Bob himself, and "every job start refused"; "13 job sessions were stranded"; old sessions "cannot be messaged or archived from the new account". On 7 Nov the switch was cancelled after "about 9.5 h". Reasoning: after a switch every role named in the shared state points to a session the new account cannot reach.
4. **How bad.** Stops a tranche for hours; costs Bob time.
5. **Status.** RAISED BEFORE (first-round finding 9; register 9, 34). STILL OPEN: thin.
6. **Best answer.** A short passage: what Bob does, what the new ROOT does first (replace every role named in the shared state and restart each open job from its branch). Honest statement that it has failed twice.
7. **Whose.** Claude's to decide; needs a trial that costs Bob a second account.

### 19. The tool "does only this", and the draft asks more of it

1. **The fault.** Six things are listed for the tool. Elsewhere the draft needs it to do at least six more.
2. **Sentences.** Section M: "does only this: push; open a pull request and mark it ready; merge; start the next job; send notifications; and write the shared state." Section I: "the process's tool is each session's only door to GitHub." Section J: GitHub's limits are kept "the way Process3 kept to them ... carried over unchanged".
3. **Rests on.** Counted today: the deny list removes every `gh` command. Measured (`notes/github-pacing.md`, PD-22): at its end Process3 kept to GitHub's limits by having the tool read GitHub's own figure "before a job or lane start" and back off at 85% until the limit reset. Reasoning: the draft also needs the tool, or something, to close a pull request (a notified job that changes nothing), read a failed run's output for the job, start a workflow (the release), deploy, record a blocked job, and hold back starts at GitHub's limit. The last is a wait built into the tool and is not among the things section J names as able to stop work.
4. **How bad.** Minor now; costs time in the build, and "does only this" will not be true on the day it is built.
5. **Status.** NEW (register 25 answered "a new small tool" with the same short list).
6. **Best answer.** Wording: list what the tool must do from the body, once, and say which of those can make work wait.
7. **Whose.** Claude's to decide; needs the build.

### 20. Switching the uses check to read tests is a change to the process in the middle of the first tranche

1. **The fault.** The check cannot read tests until 122 pairs are corrected. 36 of them are corrected by jobs, during a tranche. So the check changes while the tranche runs, which the draft says happens only at PROCESS with Bob's approval; or the first tranche runs without what Bob's hint asked for.
2. **Sentences.** Section E: "Before the check can read tests, those 122 are corrected ... 36 point to a later module ... those modules' jobs do it." Section J: "one fixed version for each tranche, moved only with your prior approval."
3. **Rests on.** Measured by the draft's own search (122, 86, 36). Reasoning: each of the 36 moves something between two modules, so it is two jobs that must merge in an order, with the second blocked until the first lands.
4. **How bad.** Costs time; a small mislead on when his hint takes effect.
5. **Status.** RAISED BEFORE (register 36), NOW ANSWERED by Bob's hint. The order of switching on is NEW.
6. **Best answer.** An honest sentence: the check reads tests from the second tranche, or from a move Bob approves at PROCESS once the 36 are done.
7. **Whose.** Claude's to decide.

### 21. Process3's own sessions and hourly alarm may still be alive on the account

1. **The fault.** Process3's ROOT was never stopped; its alarm had sent 94 notifications by 13 Nov. Nothing in Bob's acts or the process's start deals with what Process3 left running on the same account and the same repository.
2. **Sentences.** Section G: "After your stop of 9 Nov the alarm went on firing and had sent 94 notifications by 13 Nov (measured)." Section D: eight slots "counted across the account".
3. **Rests on.** Measured (`review.txt`, as quoted in `roles` 1.3). Not determined (`trial_plan_facts.md` section 6): "Whether Process3's sessions and its hourly task are still alive on his account." Reasoning: they count toward the limit of about fifty, they still notify Bob, and they hold Process3 instructions for the repository Process4 is about to convert.
4. **How bad.** Minor; costs Bob confusion on day one.
5. **Status.** NEW in the definition.
6. **Best answer.** One line in the start: before the first ROOT, the old alarm is deleted and the old sessions archived, by a session under his existing approvals or by Bob in his app.
7. **Whose.** Claude's to decide.

### 22. Places where the text contradicts itself or has gone stale

Each is wording. None stops anything alone; together they mislead.

| # | What | Sentences | Status |
| --- | --- | --- | --- |
| a | Section D says three readings on the tranche and release "are still open with you (section P)". Section P says "You answered each". Section K still says "as Claude reads your words of 14 Nov". | D, K, P | NEW |
| b | Section B lists Bob's second, third and fourth messages. His fifth, with the three answers, appears only in P. The body and the list of his words disagree on what he has said. | B, P | NEW |
| c | The acts table sends the reader to section I for committing approvals "in the process's" repository. Section I says nothing about that repository. | C, I | NEW |
| d | "ARCH edits the list until every file has one owner module." The module list itself, CLAUDE.md, the settings file, the decision file and the workflows can have none, or jobs could edit them. | C, J | NEW |
| e | The internal walk is made "at any time on your word", and "a walk happens when no job is open". | E.2, D | NEW |
| f | Step 1 lists three kinds of work (an unmet requirement, a walk flaw, a notification). Step 5 creates a fourth: a flaw a job reports. | D | NEW |
| g | "Without flaws" means leaving out "no step that the walk before it made". A tranche "can end without an AI enabled run". After one walk with AI on, every later walk without it leaves steps out. | D, P.1 | NEW |
| h | "When a module's work is finished: ... when its notified job tells ARCH that nothing needs changing." That job's pull request stays open; nothing closes it, and "ready" is defined as "no job already open". | D | Register 7, part still open |
| i | Section N: "Thirteen are now decided in the body". At least four of those are decided only as "Claude's to settle in the build": the form of the shared state, which files each walk reads, how a plain start learns its role, and the mechanical edit's test run. | N, C, D, I | NEW |
| j | The comparison of approvals is "start-up" in J and L, and something a long-lived session does in I (finding 11). | I, J, L | NEW |
| k | "Sessions are at most three levels deep, and none starts its own replacement", beside the watcher (finding 14). | C | Register 15 reopened |
| l | "Model and effort. Every session passes your suggestion on." Platform text: effort is "not inherited" and is to be set "only when the person or your standing instructions ask". Unproven and not in the list of unproven things. | C | Register 64, still unproven |

---

## The walk-through, in order, with where it stops

**Before any session.** Bob changes the default branch, commits his approvals and the deny list in two repositories, connects GitHub as the sessions' account and fills the cloud environment. Stops: his commits cannot merge until the conversion is built and ordered (finding 2); the process repository's branch and approvals are not specified (finding 9); Process3's leftovers are untouched (finding 21).

**ROOT.** Bob types a plain prompt. Stops: ROOT stands on an old copy (finding 1); nothing tells it what ROOT does, and the tool is not in its repository (finding 3). If it gets through: it starts ARCH and the coordinator (measured in Process3 with a role prompt), sets its hourly alarm (measured, including on a ROOT Bob started: the 8 Nov ROOT's alarm went on firing and had sent 94 notifications by 13 Nov), and writes the roles into a shared state that is not yet designed (finding 15). Who starts the watcher is open (finding 14).

**ARCH's first hour.** It must repair the module list for 29 modules, four new ones, about 50 unowned files and 86 undeclared uses before the first job is right. Stops: the mechanical edit's moment is after the jobs (finding 8); every list change needs a test run that answers on a change touching no module (finding 2).

**A job.** ARCH starts it by commit id with instructions naming its acts (measured form). It works, pushes through the tool, marks ready, hears its own test result, messages ARCH. ARCH merges and refills. This part is the best-founded in the draft: about 700 unreviewed merges went through Process3's tool without a recorded refusal. Stops: step 8, the notification (finding 4); a needed use or service in another module (finding 7); a job that dies after its tests pass (finding 13); after about forty jobs, the session limit (finding 12).

**The eight slots across the account.** With one product nothing changes, as the draft says. For two products the count sits in one product's repository and the other product's sessions cannot see it. Process3 kept an account-wide cap as a setting of the cloud environment, which Bob sets and every new session reads (`permissions_inventory.md` 1f). That is a structural answer available for the draft's open item 3; it would move the act from "tell the coordinator" to a setting, which is Bob's to choose.

**End of the round's jobs.** Stops: blocked jobs keep the round open (finding 8). **Internal walk.** Stops: no document to walk against as described, no stated scope (finding 5); no way to share the walker among sessions (finding 6). **Deployment.** No session named; tokens are in the cloud environment, which is the measured route. **External walk.** Never run from a session (finding 6). **Flaws to modules.** ARCH is named; a flaw in a file with no owner still has no module until the list is repaired.

**Tranche end and release.** Findings 10 and 16.

**A process fault at night.** Finding 9. **Recovery.** A dead job: answered and was built in Process3. A dead ARCH or coordinator: ROOT replaces it; unproven with jobs open. A dead ROOT: finding 14. A dead PROCESS: not in the draft (finding 9). Account switch and suspension: finding 18. A stop on Bob's word: answered in a sentence, depends on the shared state (finding 15) and on interrupts (measured 14 of 15).

---

## The first round's findings the fifth draft says are answered

| First-round finding | The fifth draft's answer | Enough to build from? |
| --- | --- | --- |
| No Process4 tool | Section M lists six things it does; "Builder: Claude" | A list, not a design. The list is short of what the body asks (finding 19); how the tool reaches a session is unsaid (finding 3); the conversion order is unsaid (finding 2) |
| Working state has no home | "one place on GitHub ... that needs no merge to write" | Only a sentence (finding 15) |
| Waking: who hears the test result | The job hears it and sends ARCH one message | Yes. The platform supports it; no run in the record. The dead-job case is open (finding 13) |
| Default branch, so that approvals are the newest | Bob makes the tranche branch the default | No. It answers a fault that did not happen (finding 1) |
| Modules with no files | ARCH decides; the move is a mechanical edit | Half. The edit's moment and test run do not fit day one (finding 8) |
| Undeclared uses | The check reads tests; 86 declared by ARCH, 36 refactored by jobs | Yes for what is done; the order of switching on is unsaid (finding 20), and how a job gets a new use declared is unsaid (finding 7) |
| A blocked job | Reports, records, pushes, stops, frees its slot | Yes for a flaw. Not for a needed service or a needed mechanical edit (findings 7, 8) |
| How a tranche ends; the merge to main | ARCH merges; no test runs there | Yes, unproven. The rehearsal on probes repeats what was done there (finding 16) |
| A process fault has no one | Bob's hints: ROOT starts PROCESS; job to ARCH to coordinator to PROCESS | The links are named; five things a session needs are not (finding 9) |
| The hourly alarm undoes a stop | A stop line ROOT reads at each wake | Yes in a sentence; rests on the shared state |

---

## Sections M, N and O

**Relied on by the draft and missing from all three.**

1. How the tool and role texts reach a session that holds one repository (finding 3).
2. The order of converting each repository, and that the trial repository needs it too (findings 2, 17).
3. Who writes requirements into a module, and how a job gets a use declared (finding 7).
4. Who moves a product to a changed process; PROCESS's branch, approvals and replacement (finding 9).
5. That the walker is a module of the product and must be changed before a walk can be shared (finding 6).
6. That a session's browser can reach the development site (finding 6).
7. Who deploys; who prepares a release; the two missing release workflows (findings 6, 16).
8. Who archives finished sessions (finding 12).
9. The account switch as a procedure (finding 18).
10. What is in the walks' folder, and what part of the documents a tranche's walk covers (finding 5).
11. That effort reaches each session (finding 22, row l).
12. Process3's leftovers on the account (finding 21).

**Trials that cannot settle their claim.** See finding 17. In short: nothing about walks, deployment, Cloudflare's limits or the release can be tried on made-up modules; the merge to main on the probes repository was already done 13 times; the slot rule's sameness is true of any script; twenty merges bound little; the internal-walk trial can only break its claim (the draft says so).

**The smallest set that must exist before any trial can run.**

- Decisions, each a paragraph: where the shared state is and who writes each entry; how the tool reaches a session; what a plainly started ROOT reads; who starts the watcher or that the trial runs without one; the branch PROCESS starts on.
- Built: the tool for push, open, ready, merge and state; role texts for ROOT, ARCH, the coordinator and a job; a required test run that answers on every pull request including one that touches no module; three to ten made-up modules with a list and tests.
- Bob's acts, in a written order: lift and restore the required check on the trial branch; merge the conversion; commit his approvals and deny list there in Process4's words; make that branch the default; start ROOT.
- Not needed for the first trial, and so not tried by it: the notification, the walks, deployment, the release, PROCESS beyond its start.

---

## Probed and not found broken

- **A session starting a session on another repository.** Done in Process3 from 5 Nov: a product-rooted ROOT started each coordinator on the process's repository. The draft's notes say this was not established. It is better founded than the draft claims, though only under Process3's approvals and a prompt naming the act.
- **The hourly alarm on a ROOT Bob started.** The 8 Nov ROOT was started by Bob and its alarm fired until at least 13 Nov. The draft lists this as to be tried; the record already has it.
- **Merges with no review.** About 700 through Process3's tool, no recorded refusal. The new tool is unmeasured, as the draft says.
- **A dead job.** Restart on the same branch and pull request was built and used.
- **GitHub's machines for eight jobs at once.** Nothing found against it.
- **Depth.** ROOT, ARCH, job is three levels; PROCESS and the coordinator sit at the second. Only a watcher's takeover goes deeper, and jobs ran at that depth on 3 Nov.

---

## MAP

| Area | Rating | Why, in one line |
| --- | --- | --- |
| Roles and sessions | Stated but unproven | Every standing role is named and most duties have an actor; the watcher contradicts a sentence beside it, and PROCESS has no replacement. |
| Flow of a job | Stated but unproven; thin at the edges | Start, test, message, merge and refill are clear and close to what ran; step 8, a needed use or service elsewhere, and a job that dies after passing are not. |
| Rounds, walks and tranche end | Contradictory and thin | The folder does not hold the documents as described; no way exists to run either walk as written; blocked jobs keep a round open; nothing suggests a walk can come clean. |
| Release | Missing | No actor, two workflows that do not exist, sessions forbidden to touch what it updates; honestly marked unbuilt. |
| Notification | Missing by decision | Under study on Bob's word; the draft says so; the process cannot start on the real product until it is settled. |
| PROCESS and process change | Thin | Bob's rule is clear and his hints name the first three links; branch, approvals, telling Bob, the merge, replacement and the actor for the move are absent. |
| Permissions and starting | Contradictory | The preserved parts are the best measured in the design; the one new decision, the default branch, answers a fault the record does not show, and the conversion has no order. |
| State and waking | Thin | Waking is answered. The shared state is a sentence, with no named place or writers. |
| Recovery | Thin | Job, ARCH and coordinator have an answer; ROOT, PROCESS, the account switch and a suspended GitHub account do not; nobody archives. |
| Reports | Solid enough | One report, one author, from what git holds, nothing reads it to decide; cost may be unreadable, as stated. |
| What is unbuilt | Stated, and understated | Section M is honest about the tool, texts, conversion and nine other things; twelve more are missing from it, and the tool's list is short of the body. |
| What is unproven | Stated, with a weak trial plan | Section O is candid; but the trial repository needs converting first, its cost to Bob is understated, and a third of its items cannot be tried on made-up modules. |


# [file] v3_notes.md

# Notes on the third draft of the Process4 definition

14 Nov 2026. Written with `/home/user/handoff/process4_definition_v3.md` (62.6 KB). Nothing else was written or changed. No repository was touched and no session started.

Section letters. The third draft re-letters: v2 A = v3 A; new B "Your decisions as recorded"; v2 B = C; v2 C = D; v2 D = E; v2 E = F; v2 F = G; v2 G = H; v2 H = I; v2 I = J; new K "What does not exist yet"; v2 J = L; v2 K = M. The memo's section letters are v2's.

## 1. Size: the one instruction not met

Target was about 48 KB; the draft is 62.6 KB. I made two tightening passes. What pushed it over: the new section B (4.3 KB, exact quotations as the memo asks), section K (1.6 KB), the replay results (about 2 KB in E and L), and the memo's additions to C (roles, shared state, standby), D (the 8 Nov conflict, quoted; tranche end; release rulings, quoted), F and L (36 items against 12). I did not drop any memo item to make the size. If it must come down, the cuts that lose least are, in order: shorten section B to one short quotation per line (about 1.5 KB); drop the evidence clause from each item of section J (about 1.2 KB); fold G's "working rules" list into one sentence (about 0.7 KB); merge L's groups 3 and 4 (about 0.8 KB); drop M's "Notes in your ledger" and "Records to confirm or correct" (about 0.9 KB). That gives about 57 KB. Reaching 48 KB would need memo items removed, which is not mine to choose.

## 2. Mid-task instruction received

While I was drafting, the coordinator sent a message: the replay had finished; use `/home/user/work/replay/results.md` in place of the "REPLAY RESULT PENDING" marker, with seven decisions (trigger wording; the correction on who Process3 told; 65 becomes 17 or 11; named parts are a guide; undeclared figures; limits; the 71% figure), and move the two replay claims to "already tried" in the unproven list. I read results.md in full and did so. The draft therefore contains no "REPLAY RESULT PENDING" marker. Where the coordinator's summary and results.md differ, I followed results.md (section 5 below).

## 3. Places where I could not follow the memo, or followed it only in part

1. **Size** (above).
2. **Memo 5, "Remove 'runs only the tests that relate'".** Done, but those words are in the record of 13 Nov as Bob's decision (live_docs.md line 52: "updates and runs only the tests that relate to them"). The memo does not say this. The draft quotes the line in section B (line 10) and says in section E that the notified-job rule "departs from line 10", with the replay's reason. It is also listed under "Records to confirm or correct" in M.
3. **Memo 5 and 6, wider triggers.** Test one's trigger (tests of every module a pull request changes) widens "Each job's own module tests" (live_docs line 37); test two's trigger widens "when a job changes a module's interface" (line 33). Both are written as "Claude decided" and the difference from the recorded line is stated in E. attack_corruption finding 7 said the test-one change "is his to allow"; the memo makes it Claude's. I followed the memo and listed it in M for Bob to confirm.
4. **Memo 1, "reading 'earlier modules' jobs run before later ones' as the rule for who takes a free slot" is Claude's.** The record itself lists "ready jobs take free slots earliest in the order first" under "Decided by you, 13 Nov" (live_docs line 47). So the slot rule is on the recorded list; what is Claude's is reading line 3 by line 8. The draft says exactly that (D, step 3) and asks Bob to say if it is wrong.
5. **Memo 9 counts against memo 1.** Memo 9 gives "15 ended by decisions recorded as yours". Four of those 15 are the three checks (appendix_recount.md line 25: F-PROP-3, JOB-12, GAT-8, GAT-4), which memo 1 says are Claude's consequence. The draft gives the memo's numbers, says they were counted on the appendix as it stood for the second draft, says four of the 15 are counted here as Claude's, and says the first and third figures will fall when the appendix is redone (memo 2 ends further checks inside lines the recount has as "kept as written": the credentials check, the version check at start, the drift check, the re-run at close). I did not recount; the appendix is not mine to write.
6. **Memo 9, "3 open on question 1".** The three (MNT-1, MSG-5, MNT-5) were open on the wall question. Under the new question only the line on moving the version clearly waits on Bob; memo 7 decides the other two (ARCH starts the fix session; faults are reported to ARCH). I kept "3 wait on the question in section M" as the memo says. It is probably 1.
7. **Memo 4 against memo 7 on modules with requirements and no code.** Memo 4 says do not decide it (a product question for Bob). Memo 7 has ARCH fold requirement-only modules back. The draft does both and says so: the product question in M ends "ARCH's folding in section C assumes the answer is no."
8. **Memo 7, the tool "does only: push, open and mark ready a pull request, merge, start the next job by the fixed rule, and send notices".** The same memo section has shared state "written through the tool". I added "and write the shared state" to K's list.
9. **Memo 8, "say the combined trial run is that slice".** Done as "Claude decided", with one honest sentence added: the combined run uses small made-up modules (trial_plan_facts.md section 4: "three to ten toy modules"), so it is weaker than the note asks. Bob dropped the ledger line that certified on a toy, and the Foundations record "Toy flaws and product flaws were disjoint" (audit_ledger.md finding 18).
10. **Memo 3, "Walks took 60 and 64 minutes and ran on GitHub's machines".** The 60 and 64 minutes are the two late deploy-and-walk runs (product_side.md line 175). That they ran on GitHub's machines is k_evidence.md line 279's inference from the 30-minute limit; attack_feasibility finding 14 says "I did not establish where Process3 ran it". The draft states the two facts and the inference ("so a long walk has to run on GitHub's machines") and does not say where Process3 ran them.
11. **Memo 2, "List this in the 'things to tell Bob'".** No such list exists in the shape given to me. The process's-own-tests reading is stated in E under its own bold heading, marked as Claude's reading to overrule, and repeated in M under "Records to confirm or correct".
12. **Memo 4, the residue list.** Taken from enforcement_levers.md section 4. I listed six of its ten items in plain words (over-caution; demands in instructions or messages; helper as reviewer; process-serving tests and walk steps; helper commands in the product; drafts for Bob). Left out for length: rule text in files sessions must write, scheduled tasks as watchers, a refusal added inside existing code by the fixer (covered by the question itself), and the first contents (covered by section K).
13. **Findings on which the memo is silent and the finding gives no wording to use.** Left out, not invented: who counts "two failed corrections" (feasibility 16f); replacing ARCH at each round's end (corruption 10, 12b; a structural change, not wording); the trial "walk one unchanged build three times" (corruption 1); "what sizes a tranche" (corruption 1). Written as "not yet settled": who writes the tranche report (feasibility 16g); the number of walkers (foundations 19); four of the seven standing duties of audit_foundations finding 15 (refusals counted and tried at tranche open and model release; parts removed one at a time at each model release; the alarm catching lack of progress; checking each new session started); how GitHub's limits are kept.
14. **audit_foundations finding 19, process version moves.** The finding says: say the Foundations' rule is followed over Bob's words of 9 Nov, "and why". The memo gives no why. I gave the second draft's reason (116 moves in nine days) as Claude's and asked Bob to say if his words of 9 Nov should govern. This reason is my wording; strike it if it is not the main session's.
15. **Memo 2 ends the guard on the approvals block.** I added one sentence of consequence (H): with it gone, nothing in git stops a session's pull request from changing the approvals (permissions_inventory.md line 415, quoted in audit_ledger finding 1). The memo does not ask for this sentence. It is a statement of risk, not a mechanism.
16. **Memo 7, 52 unowned code files.** results.md line 80 counts 49. The draft says "about 50".

## 4. Things in the memo I believe are wrong or that contradict a source

1. **Memo 3: "8 Nov: internal walk 238 steps none failing".** The stored report has 238 steps marked ok and 63 failures listed (attack_corruption.md lines 49 to 50). The memo's own next bullet says to write "every step marked ok while 63 failures were listed". The draft follows the source.
2. **Memo 4: "in Process3 one question waited nine hours for you".** The source says a question "carried as 'Bob's, asked, no answer' waited about nine hours across four coordinators" (attack_corruption.md line 165), and that it "was not his" (same file, line 440; causal_forensics.md line 189, "stalls a decision for nine hours"). The draft says "one question that sessions carried as yours waited about nine hours".
3. **Memo 4 puts "one fixed version per tranche, changed only by a recorded act" in quotation marks as Bob's documents' words.** That is the second draft's sentence. The nearest sources are the Foundations ("A tranche names the process commit it runs on"; "adopted by one recorded act that moves the pin", foundations.md line 223). The draft states it without quotation marks.
4. **Memo 6: "fails on 202 test imports or cannot see the 38 undeclared pairs".** results.md line 74 measures 198 import statements in 122 undeclared pairs, 36 of them to a later module, and line 82 says the earlier study's scripts no longer exist. The draft uses 198, 122 and 36, and says 36 is the second draft's "38".
5. **Memo 7: "Correct the 'eight out of eight' alarm figure to five of five (three more were the standby's)".** Consistent with audit_foundations finding 20 (5 of 5 on 1 Nov; 3 of 3 on 2 Nov were the standby's daily alarm). trial_plan_facts.md lines 215 and 220 add that the five were on sessions another session had started, not a ROOT Bob started. The draft's trial line says "one firing on a ROOT you started".
6. **Coordinator's replay message, item 4: "65 were led".** results.md lines 217 to 223: 53 + 4 + 7 = 64 led (11 of them with reservations), 1 weak, 2 not led. The draft says "64 led, 1 weakly led and 2 not led".
7. **Coordinator's replay message, item 2: "167 declared pairs were never told".** results.md line 42: 101 of the 167 were told by another route (a reschedule record) and never judged; 66 were told by no route. The draft says so.
8. **Coordinator's replay message, item 7: "so nearly every merge will send notices".** The 71% (360 of 504) is measured for the four-parts reading (results.md line 118). The trigger chosen (source or public requirement changed) was not counted over all job merges; 73 of the merges in the 71% changed only tests bearing a requirement number (results.md line 107), which the chosen trigger does not fire on. The draft gives the 71% as measured, the conclusion as Claude's inference, and says the share under the chosen trigger was not counted.
9. **Memo 1 quotes the 14 Nov instructions of Bob** ("Process4 has three tests, ever", "Only words I wrote count as my word", "my decisions of 13-14 Nov"). I have not seen the message they come from. I quoted them from the memo (line 5) and audit_foundations.md (lines 47, 88, 234). If the main session's wording of any is inexact, three sentences in the draft are affected: the head of section B, the sentence under the table in C, and the first line of E.

## 5. Quotations used, with source

Section B, each line is from `/home/user/work/live_docs.md` part A1 (the session's record; its own source is assessment_doc.txt lines 16 to 102):

| Draft line | live_docs.md line | Note |
| --- | --- | --- |
| 1 to 4 | 31 to 34 | whole |
| 5 | 36 to 39 | second quotation cut after "changes an interface" |
| 6 | 41 | first four sentences |
| 7 | 46 | first sentence |
| 8 | 47 | from "A job does not wait" |
| 9 | 48, 49 | second quotation without "Nothing waits for a timer." |
| 10 | 52 | whole |
| 11 | 53 | first sentence |
| 12 | 54, 55 | first sentence of each |
| 13 | 56 | whole |
| 14 | 61 | from "a job writes" |
| 15 | 62 | whole |
| 16, 17 | 63, 64 | 16 stops before "That session becomes ROOT" |
| 18 | 65 | whole |
| 19 | 66 | whole |
| 20 | 69 | whole |
| 21 | 70 | first sentence |
| 22 | 71, 72 | first sentence of each |
| 23 | 73 | first sentence |
| 24 | 75 | "because there are no layers any more: your word" (the session's sentence; no quotation marks in the record) |

Other quotations:

| Quotation (start) | Where in draft | Source |
| --- | --- | --- |
| "my decisions of 13-14 Nov" | B | decisions_memo_d3.md line 5 |
| "Only words I wrote count as my word." | C | decisions_memo_d3.md line 5; audit_foundations.md line 234 |
| "Process4 has three tests, ever" | E | decisions_memo_d3.md line 5; audit_foundations.md line 88 |
| "Only explicitly marked words of yours become decisions" | C | /home/user/handoff/ledger_lines.md line 464 (a kept line, session-drafted) |
| "a knowledge directory and design responsibility" | C | live_docs.md line 120 ("and design responsibility" is Bob's addition) |
| "always a model and effort sufficient for quality, and a permissions mode appropriate for the task at hand" | C | live_docs.md line 119 |
| "ARCH as named in the shared state" | C | decisions_memo_d3.md line 62 (Claude's phrase, not Bob's) |
| "earlier modules' jobs run before later ones" | D | live_docs.md line 33 |
| "be careful that there aren't too many external walkers ..." | D | /home/user/handoff/DECISIONS.md line 117 |
| "This successive set of rounds continues until ... and that ends the tranche." | D | DECISIONS.md line 92 |
| "nothing found waits for the next tranche" | D | /home/user/handoff/foundations.md line 130 |
| "A public release is a development release the walkers have passed" | D | foundations.md line 248 |
| "build the installer only when the internal walk completes ..." | D | DECISIONS.md line 108 |
| "The first run or two of the external system will run without without an AI account connected" | D | DECISIONS.md line 123 (the doubled "without" is in the source) |
| "the installer update and site update wait until a release walk with AI on is also clean." | D | DECISIONS.md line 125 (source begins "Yes, ") |
| "each job's own module tests" | E | live_docs.md line 37 (source has a capital E) |
| "every requirement is tested at the module's interface and proven met" | E | foundations.md line 155 |
| "Kept" | E | live_docs.md line 61 |
| "the last 2 or 3 versions" | E | DECISIONS.md line 113 |
| "changes a module's interface" | E | live_docs.md line 33 |
| "those parts and no others"; "only the tests that relate to them" | E | live_docs.md line 52 |
| "the restarted session should recognize that corrections were made ..." | F | live_docs.md line 117 (Bob's own wording) |
| "caution is a cost, paid only against a measured failure or your word"; "the default answer to a finding with nothing measured behind it is no change" | F | live_docs.md line 91; foundations.md line 38 |
| "should happen as needed, but also ganged up when possible" | F | DECISIONS.md line 172 |
| "80% or 90% of github's published limits"; "don't do it beyond just making sure that we don't exceed published limits" | H | DECISIONS.md line 168 |
| "and nothing that happens on a live site" | H | foundations.md line 238 |
| "keep", "modify" | H | live_docs.md lines 97, 110 (store values) |
| "when I ask for one" | I | live_docs.md line 118 (Bob's own wording, 31 Oct) |
| "as many as 8 jobs at a time" | I | k_evidence.md line 314 (a session's log quoting Bob, 6 Nov) |
| "(default: 20)" | I | live_docs.md line 148 (typed by the field report's editor, taken to be Bob; the draft does not say who typed it) |
| "the standing judge of every other line" | I | foundations.md line 283 |
| "get rid of it completely" | J 1 | DECISIONS.md line 160 |
| "Is this needed at all? If so, it must be done efficiently. If not, then cut it." | J 2 | DECISIONS.md line 158 |
| "Try this, but measure the experience with an open mind as to whether it's work or not." | J 6 | live_docs.md line 116 (Bob's own wording) |
| "We only add additional checks when we can confirm from factual study and data" | J 7 | live_docs.md line 91; /home/user/handoff/causal_forensics.md line 249 (longer form) |
| "Nothing is ever refused for size" | J 9 | audit_foundations.md line 303, quoting the Foundations |
| "Act only as it says; with none, act on nothing." | K | attack_feasibility.md line 33 (product CLAUDE.md at the tranche tip) |
| "Nothing here is in force until it has run on a real tranche with the two health metrics measured." | L | foundations.md line 9 |
| "one shadow of a representative slice" | L | live_docs.md line 123 (the page's suggestion text, accepted by Bob) |

## 6. Numbers, with source and kind

Kinds: M = measured (counted in the record or on today's code by a worker); E = estimated; J = judged; R = recorded in a session-written document with no evidence file found.

| Number | Where | Source | Kind |
| --- | --- | --- | --- |
| 288; 186; 46; 15; 11; 27 (4 by Claude); 3 | A, H | appendix_recount.md lines 17 to 23 | M (script count of the second-draft appendix; see section 3, items 5 and 6) |
| 220 modules; seven with work and no code; four new | A | attack_feasibility.md lines 160 to 161 | M |
| about 50 unowned code files | A | 52: interface_and_cycle.md line 49; 49: replay/results.md line 80 | M, two counts |
| three times in nine days (set-up acts) | C | second draft, section B (not re-checked) | M, carried over |
| both takeovers left no standby, ROOT one level down | C | attack_feasibility.md line 234; roles_root_coordinator.md line 134 | M |
| ARCH replaced 21 times in 6.5 days | C | attack_feasibility.md line 82 | M |
| 60 and 64 minutes | D | product_side.md line 175 | M |
| about 30 minutes for one step | D | foundations.md line 179 (platform table) | R |
| 63 failures, every step ok, 5 and 8 Nov; 238 steps | D | attack_corruption.md lines 49 to 50 | M |
| 20 of 175 | D | attack_corruption.md line 52 | M |
| main branch unmoved since 1 Nov | D | attack_corruption.md line 44; permissions_inventory.md via attack_feasibility.md line 210 | M |
| checker refused once on 9 Nov | D | permissions_inventory.md line 272 | M, one event |
| no round clean; no release cut | D | attack_corruption.md line 44; k_evidence.md line 86 | M |
| 211 process test files | E | attack_corruption.md line 164 (product_side section 6c) | M |
| 0 of 2,540 | E | k_evidence.md line 48 | M |
| 198 import lines; 122 pairs; 36 to a later module; 3,029; 240 | E | replay/results.md lines 74, 78 | M (240 includes pattern matches) |
| 178 changes; 241; 236; 239; 45 | E | replay/results.md lines 19, 114, 145 to 150 | M |
| 167; 101; 66; 3 of the 66; 14 | E | replay/results.md lines 38 to 44 | M; "three real effects" is the replay worker's inference |
| 65; 17; 11 | E | replay/results.md line 18 | M |
| 169; 67; 64, 1, 2; 5 | E, L | replay/results.md lines 209 to 223 | 169 and 5 M; 64, 1, 2 J (one worker who knew the answer) |
| 65 modules, about 177 jobs, about 100; 59% to 71% | E | attack_feasibility.md line 138; attack_corruption.md lines 208 to 209 | E (simulation on measured inputs) |
| 71%, 360 of 504 | E | replay/results.md line 118 | M (four-parts reading only) |
| 20 cents median | E | attack_corruption.md line 200 | M |
| 532; 2,342; 2,101 | E | replay/results.md lines 36, 57 | M |
| three declared uses of a later module; 39 pairs | F | replay/results.md lines 161 to 162 | M |
| 45 minutes | F, J 4 | attack_corruption.md line 134 | M |
| 1,690 page faults | F | change_sample.md lines 144, 332 | M |
| 194 minutes | F, L | attack_feasibility.md line 109 (Foundations) | M |
| 116 moves in nine days | F, M | attack_corruption.md line 174 (product_side section 4) | M |
| 94 notifications by 13 Nov | F | /home/user/handoff/review.txt line 92 | M |
| 11 of 11; about 450 acts | G | trial_plan_facts.md line 376 says these rest on the Foundations alone | R (the draft says so) |
| five edits each stopped every long-lived session | G | attack_feasibility.md line 58 | M |
| about 700 merges, no recorded refusal | G | trial_plan_facts.md line 58 | M, "in use, not counted" |
| 218 of 220; 147 of 157; 70 of 357 with 96 listed | I | attack_corruption.md lines 51, 53, 87 | M (70 = 357 less 287 marked ok) |
| 28 of 279 | I | audit_foundations.md line 318 (permissions_inventory) | M |
| 24; 8; 20; 8 | I | audit_foundations.md lines 165 to 168; DECISIONS.md line 45 | recorded figures |
| 0 of 3 | I | permissions_inventory.md line 265 | M |
| 1,187 test runs | J 1 | audit_foundations.md line 318 | M |
| 32 of 32 | J 3 | audit_foundations.md line 333: from review.txt, not re-measured | R (the draft says so) |
| 947 findings; seven repairs | J 5 | audit_foundations.md line 326 | M, for the whole record check |
| 105 of 508 | J 6 | audit_foundations.md line 318 | M |
| 41% before and after | J 7 | audit_foundations.md line 318 | M |
| 8 KB to 134 KB | J 8 | audit_foundations.md line 318 | M |
| half an hour; two starts; one edit; one stop | L group 2 | trial_plan_facts.md lines 435, 505 | J |
| twice out of twice (old copy) | L 6 | attack_feasibility.md lines 47, 56 | M |
| five of five; three more the standby's | L 10 | audit_foundations.md line 328 | M |
| about 50 live sessions, one event; about 170 jobs | L 14 | attack_feasibility.md lines 328, 322 | M (one event); E |
| ten faults; twenty or more merges | L 17, L 5 | second draft; trial_plan_facts.md | choices, not measurements |
| below about 14% | L 23 | trial_plan_facts.md line 45 | E |
| 8,838; 236 to 357; nineteen in twenty | L 29 | attack_corruption.md lines 242, 49 to 51 | M; the ratio E |
| ten of twenty false "done" findings | L 29 | attack_corruption.md line 243 (review.txt) | M |
| about 100 in a round of 65 | L 34 | attack_feasibility.md line 138 | E |
| 121 of the 296 | M | audit_foundations.md line 324 (change_sample) | M (a worker's classification of all 296 merges) |
| about nine hours | M | attack_corruption.md line 165 | M |
| three false alarms; full count not made | M point 1 | audit_foundations.md line 325 | M / not found |
| 29 of the 220 | M | interface_and_cycle.md line 511 | M |

## 7. Re-read against the five rules: what I found and fixed

- Rule 1: replaced "method" with "function"; glossed "refactoring", "gate", "hook", "registration", "pushing with force", "pull request"; removed "status read-out", "probe", "real level", "earlier reviewers", "later platform notes", "the audit". No line ids or record codes remain (checked by search). "Claude's study of the module order" and "the worker who ran the replay" are explained in their sentences.
- Rule 2: "you decided" does not appear as a claim. Recorded decisions are cited as "line N" of section B. "your words of 6 Nov" changed to "which Process3's log quotes you saying". "Your ledger says" changed to "A line you kept in your ledger says" where the wording is a session's.
- Rule 3: "11 of 11" and "about 450" re-marked as recorded with no evidence file; "ARCH and the jobs carry on" changed to "are meant to carry on"; "would do nothing" changed to "is told to do nothing"; "so that a replaced ARCH is obeyed" changed to "can be obeyed"; kinds added to numbers that lacked one.
- Rule 4: removed a "count kept through the first tranche" I had written into group 3 of L. Trials kept are those in the second draft, the memo, or a finding's own proposal (one measurement of the live-session ceiling; one release rehearsal as far as approval; one rehearsal of the tranche-to-main merge). The trial for the fixed-version setting (L 18) is the memo's "prove in a trial"; its wording is mine.
- Rule 5: one question, in the form asked. The five "records to confirm or correct" are not put as questions.


# [file] train-plain-options.md

# Plain merges beside the merge train: options (build/train-plain, 5 Nov)

## The problem (copy, 5 Nov 08:00-08:34)

The train (tool/lib/train.mjs) is the one steady writer to the tranche: it lands job pull requests
one after another, each re-gated on the job merged with the tranche as it is. Every other pull
request into the tranche (BOB's plain ones: found marks, ledger entries, an untracked generated
file; and pin moves, `merge --plain --as pin`) goes through `merge <pr> --plain` from another
session (merge.mjs mergePlain). Such a merge needs its required checks green on a head that has
the current tranche. The train moves the tranche every few minutes (green to merged median 8.7
min in the simulation, 11 in the merge rows), so a plain head brought up to date goes stale
again before its own gate ends, and the plain merge fails: PR 338 twice; the ledger PR 465 held
7 job starts behind it. Nothing pauses the train; this morning the coordinator stopped it by hand
for a 15-minute window.

notes/merge-train-trial.md, named in the brief, is not on the tranche or any branch fetched here;
the train's own header and notes/train-throughput-study.md's order were read instead, with
train.mjs, merge.mjs (merge, mergePlain, mergeRetry, waitForChecks), order.mjs and
tool/test/train*.test.mjs, merge*.test.mjs.

Measures used below: P, a plain pull request's gate on an up-to-date head; J, a job's re-gate (the
train's land interval while it has a queue). A plain change touches records only, so its gate
often runs no suite (trigger record-since-green), but a ledger entry or a pin move runs one: P can
be as long as J.

## A. The train takes plain pull requests and pin moves into its queue, ahead of jobs

How it works. `merge <pr> --plain ...` into the tranche, while a live train lease is held, does not
merge: it checks what it can check now (the plain rules: not a job branch, mergeable, the module
files, the pin, the workflows) and records a queue row on the state branch (`merge train plain`):
the pull request, its head, the review flags as given (BOB's, as a review note is), and `--as`.
The train reads the rows each round. A queued plain pull request goes before every job (the oldest
row first). The train brings the tranche into it (a merge commit pushed to its branch, only when
the merge is clean; a conflict goes to BOB), waits for the required checks on that head, and
