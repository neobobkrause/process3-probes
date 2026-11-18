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

