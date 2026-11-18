7. **Whose.** Bob's to decide whether his rule covers the requirements file (it is his rule and his word "module"); the steps are Claude's.

### 8. The mechanical edit has one allowed moment, and the jobs that need it can stop that moment from coming

1. **The fault.** A mechanical edit may be made only after a round's last merge. A job that cannot finish without such an edit stops as blocked, with its pull request still open. A round's jobs are over only when every module with work is finished. So the round never reaches the moment the edit waits for. The same holds on day one: the repair of the module list must come before the first jobs, and the stated moment is after them.
2. **Sentences.** Section D: "*Claude decided* the moment: when no job is open, between a round's last merge and its internal walk." Section D round step 2: "When every module that had work is finished". Section D: "A job stopped by another module's flaw ... records that it is blocked, pushes and stops. Its slot is freed." Section C: "Modules that hold requirements and no code ... ARCH decides which module's code meets each, and the move is made as a mechanical edit." Section A: "seven modules with work hold no code".
3. **Rests on.**
   - Counted today: 11 of the 220 modules have no paths at all in the list. First-round count: seven modules with work own only a requirements file; 58 unmet marks sit in them.
   - Measured (first-round finding 11; `merge.mjs`): Process3's rule was "a pass runs while no job holds its modules", a narrower condition than "no job is open".
   - Measured (`permissions_inventory.md` row 35): the one attempt to let a change through without its required run was refused, "[CI Bypass]". Measured (`process-gate.yml` comment): a change touching every module "would run every suite past the gate's cap"; two suites take 40 to 42 minutes.
   - Reasoning: folding 29 modules back moves requirement numbers that tests cite, across perhaps sixty modules; that is one very large change whose test run is either every touched module's or none, and the draft leaves which to the trial. Who judges that an edit is trivial enough for none is not said.
4. **How bad.** Stops a round as worded; stops the first round for the seven modules.
5. **Status.** RAISED BEFORE (register 53, 68, 32; first-round findings 6 and 11). The moment and the single merge are NOW ANSWERED by Claude's decision and Bob's question; the answer does not meet the blocked-job case or the day-one case, which are NEW.
6. **Best answer.** A change of wording to the condition: a mechanical edit is made when no job has an open pull request on any module it touches, at any time, and before the first job of a tranche where the list needs it. Keep the test-run question as an honest unproven item.
7. **Whose.** Claude's to decide; the test-run part needs the trial.

### 9. PROCESS in motion: several links exist only as a sentence, and one link has no actor at all

1. **The fault.** Follow one process fault met at night. The job tells ARCH. ARCH asks ROOT. ROOT starts PROCESS on the process's repository. Then the draft runs out. It does not say which branch PROCESS starts on or what approvals it loads there; who tells Bob that PROCESS is waiting for him; who merges the change PROCESS writes; who replaces PROCESS when it fills up with a week of conversation; or, above all, who moves the product to the changed process once Bob approves. PROCESS cannot: it holds the other repository. No product session may: the draft forbids it.
2. **Sentences.** Section H: "So a job reports a process fault to ARCH. ARCH asks ROOT to start PROCESS if it is not running. You talk to PROCESS, and the coordinator can talk to it too." "Which repository it holds ... the process's own repository." "No session building a product may change the process, add a test, check, gate or review to it, or adopt a changed process." "None of this has run." Section C table: "Commit your standing approvals ... in the product's repository and in the process's (section I)". Section G: "For ARCH or the coordinator, ROOT starts a successor". Bob's words: "The transition ... will be done only with my prior approval, with PROCESS proposing the best and least disruptive means of making the update."
3. **Rests on.**
   - Measured, and in the draft's favour (`roles_root_coordinator.md` 3.2): from 5 Nov 23:54 UTC a ROOT holding the product's repository started each new coordinator on the process's repository. So a session starting a session on another repository did run in Process3, for each coordinator from then on (the record does not give the count), under Process3's approvals and with a role prompt that named the act. The draft's notes say this was not established; it is.
   - Measured, against (`permissions_inventory.md` row 34): pushes from sessions started across repositories into the probes repository were refused 2 of 2 on 8 Nov, after approvals were split by repository.
   - Counted today, in the working copy of the process repository: the branch `process4` is cut from main. It carries the approvals of 1 and 2 Nov, which speak of "Process3", and it has no `.claude/settings.json` at all, so no deny list. The repository's default branch is main. Section I, which the acts table cites, says nothing about the process's repository.
   - Platform text (`create_session`, today): a new session inherits the caller's cloud environment. So PROCESS would hold the product's deploy tokens.
   - Measured (section H): one question carried as Bob's waited about nine hours. Measured (`roles` 1.1): coordinators, the nearest thing to PROCESS, lasted four to eight hours each.
   - Reasoning: if the fault is in the tool's push or merge, every slot is idle until Bob wakes, reads, chooses, approves the change and then approves the move. That is his rule and I do not attack it. What is missing is everything a session would need in order to act on each link.
4. **How bad.** Stops a tranche at the first process fault that blocks work, for as long as Bob is away plus however long the missing links take to invent.
5. **Status.** RAISED BEFORE (register 33, 44; first-round finding 10). NOW ANSWERED in part by Bob's hints of 14 Nov (who starts it, the channel, the repository). Those answers are his and are enough to name the links. The missing actor for the move, the branch and approvals, the telling of Bob, the merge and the replacement of PROCESS are NEW.
6. **Best answer.** Wording and settings, no new step. Name: the branch PROCESS starts on and that Bob's approvals and a deny list are committed there; the session that sends Bob the one message; that PROCESS merges its own change with the tool once the tool's tests pass; that pending proposals live in the process repository so that a replaced PROCESS can read them; and one actor for the move, for example a short session started on the product's repository for that single change, after his approval is recorded. State that the move restarts every product session, if it does.
7. **Whose.** Claude's to decide, except who may carry out the move, which reads Bob's sentence "No session building a product ..." and is his to confirm.

### 10. At the size of the real product, the first walk comes after about 177 jobs, and nothing suggests the tranche can then end

1. **The fault.** On the real list a first round is about 177 jobs before any walk is made. In Process3, with more sessions, 508 merges took six and a half days. The first internal walk then has to find nothing at all before the product is deployed, and the deployed walk has to find nothing at all before the tranche ends. Neither ever happened.
2. **Sentences.** Section D: "Nothing bounds the number of rounds ... Only your word ends a tranche that will not come clean." Section F: "the 65 modules with real work led to about 177 jobs ... (estimated)". Section O: "Whether a tranche can end."
3. **Rests on.** Measured (`product_side.md`): all 12 development deployments of 4 to 8 Nov ended "ok: false"; after 80 hours without a deployment the first walk found 1,691 failures; the last walk failed 147 of 157 live steps. Measured (draft, section D): on 8 Nov the internal walk had all 238 steps marked ok with 63 failures listed. Measured (register 1): 113 of 1,187 test runs failed on 3 to 5 Nov and 74% of those passed again with no change. Reasoning: the order (deploy only after a clean internal walk) follows Bob's words of 8 Nov, so it is not Claude's to remove; its cost is that what only a deployed walk can see is found last.
4. **How bad.** Stops a tranche, without limit.
5. **Status.** RAISED BEFORE AND STILL OPEN (register 1, "NO ANSWER FOUND"). The draft states it honestly.
6. **Best answer.** No answer found that makes the tranche end. Two honest additions: say how long the first round is estimated to take before its first walk; and say that the size of a tranche is Bob's to set, since a smaller tranche is the only lever in his hands that is not a new check.
7. **Whose.** Bob's to decide (what a tranche contains); only the first real tranche can show.

### 11. Every edit to Bob's approvals replaces every session, and the draft is of two minds about when the comparison is made

1. **The fault.** After Bob edits his approvals, every long-lived session does nothing. A new ROOT must then replace ARCH, the coordinator, the watcher, PROCESS and up to eight jobs: thirteen new sessions, thirteen dead ones left on the account. One passage calls the comparison a start-up act, another has long-lived sessions making it later.
2. **Sentences.** Section I: "a long-lived session compares the approvals it loaded with the newest, and on a difference does nothing ... So an edit to your approvals is one act together with restarting ROOT." Section J: "Named: the three tests, and the start-up comparison of your approvals".
3. **Rests on.** Measured (section I): five edits, five full stops, no restart after the last. Measured (`permissions_inventory.md` row 18): with job-like starting texts the approvals made "NO DIFFERENCE" to the checker; they act through the session's own model. Reasoning: a comparison made only at start-up cannot stop a long-lived session; one made at every wake is a standing check that stops work. The draft needs to say which it keeps.
4. **How bad.** Stops a tranche for as long as the restart takes, each time; with finding 1, it can end the product as it did on 9 Nov.
5. **Status.** RAISED BEFORE AND STILL OPEN (register 28: "the stop itself is kept, so the counter-argument stands, now as a stated cost").
6. **Best answer.** A removal already offered in the first round and not taken: sessions carry on under the text they loaded, and only sessions started after the edit load the new text. If it is kept, say when the comparison is made.
7. **Whose.** Claude's to decide under record line 12; Bob can overrule.

### 12. Finished sessions pile up, nobody is named to archive them, and new starts fail silently at about fifty

1. **The fault.** A round of about 177 jobs leaves about 177 finished sessions. If idle sessions count toward the account's limit of about fifty, starts fail while reporting success after the first forty or so. The draft does not say who archives a finished session.
2. **Sentences.** Section O: "Finished sessions do not use up the account's room. Process3 saw new starts fail silently at about 50 live sessions (one event)." Searched today: the word "archive" does not occur in the fifth draft.
3. **Rests on.** Measured (`permissions_inventory.md` row 14): about 50, one event. Measured (`roles` 1.3): "21 finished job sessions archived by ROOT's cap sweep"; Process3's rule was "Whoever starts a session archives it". Measured (rows 5 and 6): archiving passed 2 of 5 and 1 of 4 before the approvals; "15 of 15" after has no evidence file.
4. **How bad.** Silently stops a round.
5. **Status.** RAISED BEFORE AND STILL OPEN (register 67; first-round finding 13). Now listed for trial; the trial needs about fifty live sessions on Bob's account, which its stated cost does not count.
6. **Best answer.** Wording: name who archives (the session that started it, as in Process3). Keep the trial.
7. **Whose.** Claude's to decide; needs a trial.

