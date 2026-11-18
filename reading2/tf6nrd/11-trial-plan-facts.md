**Risk.** Negligible. The archive probe is an act the checker judges case by case; a refusal there is information, not a failure.

**Depends on.** J2. Shares everything with it.

### J4. Interface changes are recognised with no misses

**Can be done completely offline: yes.** Method and sample are in section 3.

**Run.**

1. For each of the 178 notices on `origin/process-state`, find the merge commit of its pull request and that merge's first parent (the state just before).
2. At those two commits read the provider's source, its requirement file, its tests, and the module list.
3. Apply Process4's recognition rule (the four parts of section D of the definition, plus "any other change to the module's source", reported as unattributed). Record whether the rule fires.
4. Take "who is told" as every module that declares a use of the provider in the module list at the first parent.
5. Check each of the 241 "affected" verdicts: is the change recognised, and is the user in the told set?
6. Separately, from the tree at the tranche tip, list every dependence that is not declared: imports in tests, SQL on another module's tables, service bindings, file paths read as text, instances handed in at run time.

**Reading the result.**

- **Breaks:** a recorded change with an affected verdict that the rule does not recognise; or an affected user outside the told set.
- **Cannot prove.** Verdicts exist only for modules Process3 itself told. It told the modules whose source imports the provider; all of those are declared users. So "every declared user reaches all 241" is close to true by construction (241 of 241 in today's quick pass, section 3). The misses, if any, are where Process3 never looked:
  - declared users it did not tell: 167 pairs across the 178 changes [repo today];
  - notifications never judged: 783 triage rows say a verdict is owed [repo today]; the interface study says 134 notifications have neither a verdict nor an answer [record];
  - modules that depend without declaring (step 6);
  - changes that raised no notice at all, because Process3 looked only at source files.
  And the verdicts are the judgment of AI workers, not ground truth. The strongest honest result is "no miss against Process3's record, read at each change's own commit".
- **Inconclusive:** a change whose merge cannot be read cleanly. None so far: all 178 resolve.

**Needs.** (a) Local read-only analysis only. No act of Bob's, no session. The local clone is complete: 957,229 objects, not shallow, no missing blobs met [repo today]. A script of perhaps 300 lines; minutes to run.

**Reuse and earlier coverage.** The notices, verdicts and answers at `origin/process-state` (178, 3,125 and 2,542 files). The interface study's replay, which read the tip of the tree and called itself "indicative" [record: interface_and_cycle 1c, 1e]. Its counts of undeclared dependence: 202 test imports to an undeclared module, 38 further pairs to a later module, 24 undeclared SQL pairs, 158 undeclared path-reference pairs [record: 1a]. Today's sample scripts (appendix).

**Risk.** None.

**Depends on.** The exact definition of an interface and the form of a notice (K technical 9) are not yet fixed. The replay can score several candidate rules in one pass, so it need not wait. Its extractor is shared with J5.

### J5. Naming the changed parts lets a notified job read and test less without missing an effect

**Run.** On the J4 replay:

1. For each change, derive the named parts at its own commit: exported names before and after (functions, class members, a hash of the value of exported data); public requirement ids changed, added, retired or newly met; ids whose tests changed. If nothing can be named, mark the notice unattributed.
2. For each of the 241 affected pairs, ask whether the named parts lead to the recorded effect.
   - **Mechanical form:** the verdict's evidence sentence names one of the parts, or the user's code at that commit refers to one.
   - **Judged form:** a reader is given only the named parts and the user module, and must find the effect the verdict records. This is 241 small reading tasks. It can be done by workers inside one session, with no new cloud session.

**Reading the result.**

- **Breaks:** an affected pair in an attributed notice where the named parts do not include what changed for that user. The record already holds candidates: a value changed under an unchanged name (`op-declarations:289`, `member-roster:286`), an answer changed under an unchanged signature (`action-grammar:396`), a served page, a committed bundle, a binding [record: interface_and_cycle 1c (i)].
- **Cannot prove,** for the reasons under J4.
- **A trap in the scoring.** An unattributed notice passes trivially, because the job is then told to read everything. So the result must be two numbers: how many of the 241 sit in attributed notices and are led to; and how many sit in unattributed notices, where naming gave no saving. On the tip-based record 65 of 178 notices were unattributed and carried 63 of the 241 [record].
- **Inconclusive:** the mechanical form alone. An evidence sentence that does not cite a part does not show the part fails to lead there. Those pairs need the judged form.
- **Not covered at all:** "test less". Which of a user's tests relate to a named part cannot be picked mechanically today [record: 1b table]. The replay can measure "read less". It cannot measure "test less" without running the users' tests at 178 commits, which is a different and much larger trial.

**Needs.** (a) Local analysis only. The judged form uses this account's usage through in-session workers (Process3's triage cost a median of $0.20 a verdict [record]; 241 readings should be of that order), but no cloud session and no act of Bob's.

**Reuse.** As J4. Process3's export comparison, which already descended into classes, is in the process clone (`tool/lib`); 71 notices carry its output and can check a new extractor.

**Risk.** None.

**Depends on.** J4's script. K technical 9.

### J6. The fixed rule fills a slot the moment a job merges, and gives the same answer every time

Two claims, two trials.

**(a) Same answer every time.**

- If the rule is a script: run it twice, and on a second machine, on the same record; the outputs must be identical byte for byte. Then feed it the record with its lines in a different order; the answer must not change. Offline, minutes. This proves the claim for a script, on the cases tried.
- If ARCH applies the rule by reading text: give two fresh sessions the same record and the same rule text and compare their answers. A difference breaks the claim; agreement on a few cases does not prove it. **Judgment:** this is the argument for making the rule a script that ARCH runs and obeys.

**(b) The slot is filled the moment a job merges.**

1. In the combined run: the slot count is two, and three modules have work.
2. Jobs for modules 1 and 2 start. Note the time module 1's tests go green, the time ARCH merges it, and the time ARCH starts the job for module 3.
3. Read all three times from GitHub and from ARCH's event list.

**Reading the result.**

- **Breaks:** the third job starts only at the next hourly alarm, or ARCH picks a module other than the earliest ready one.
- **Proves, for one case:** both gaps are a few minutes. "The moment" needs a number before the trial. **Judgment:** under five minutes each. Process3's good days ran 6 to 13 minutes from ready to merged [record: redteam_feasibility 12].
- **Inconclusive:** ARCH happened to be awake for another reason when the tests went green.
- **A point the draft leaves open.** If ARCH itself merges, it is awake at the merge, so refilling the slot follows in the same turn. The wake that matters is the one before: tests green, or the job reporting done. A pull request's events go to one session at a time [tool today: `subscribe_pr_activity`]. Either ARCH holds each job's subscription, and then the job does not hear its own red test; or the job's last act is a message to ARCH. That choice is not made, and the trial times whichever is chosen.

**Needs.** (a) for the script form of part (a). (b) Part (b): ARCH and three job sessions, about 30 to 45 minutes, inside the combined run; the real chain, because what is timed is an event reaching ARCH. (c) Section 4. (d) Throwaway repository with three toy modules and an ordered module list.

**Reuse and earlier coverage.** The 194 minutes with no event, measured 2 Nov [record: audits B, C, D citing GAP-5]. The scheduling study on the real module list (65 modules with work, 21 waves) [record: no_layers_width]; its scripts are lost. A message from the coordinator was acted on only with a standing instruction naming it [probes rows 26, 27].

**Risk.** Low.

**Depends on.** Design not yet made: where working state lives (K technical 1); where the slot number is kept (K technical 6); who subscribes to a job's pull request. Shares J2's set-up.

### J7. The hourly alarm wakes ROOT itself

**Run.**

1. In its first turn ROOT creates one hourly task with no target session named, so it is bound to ROOT.
2. Wait for one firing, up to an hour plus about a minute (Process3's firings arrived 59 to 81 seconds late [1e row 9]).
3. Read the task's last run: its session id must be ROOT's. ROOT's event list must show a new turn.
4. In that turn ROOT starts one session, to show the woken ROOT can still do what a wake is for.
5. Delete the task.

**Reading the result.**

- **Breaks:** the firing creates a new session; or it resumes ROOT but ROOT cannot start a session in that turn.
- **Proves, for one firing.** Adds to Process3's eight of eight (5 of 5 on 1 Nov, 3 of 3 on 2 Nov [1e rows 9, 27]).
- **Inconclusive:** the firing fails for the container limit, or the hour passes inside another long turn (a message due during a running turn waits for the turn to end [tool today: `send_later`]).

**Needs.**

- (b) One session and one hour of waiting; almost no usage. **Judgment:** to count for ROOT it should be the ROOT Bob starts from his app, at depth 0. The five counted firings of 1 Nov were on probe sessions that another session had started; who started the sessions of the three on 2 Nov is not recorded. In use, the task of the ROOT Bob started on 8 Nov went on firing for days, but what I read does not show whether each firing resumed that ROOT or made a new session.
- (c) None of its own, if it rides in the combined run. Alone, it needs one session start by Bob and no repository and no setting. It is the only item in group B.
- (d) No repository is needed for the alarm itself.

**Reuse and earlier coverage.** Probes rows 6, 7, 9, 20 with evidence files (`evidence/7/`, `evidence/20/`). Today's tool definition says a task by default "fires into THIS SESSION, resuming the same conversation each time", and that firing a task by hand is a separate act [tool today: `create_trigger`, `fire_trigger`]. That agrees with the claim. A fresh session made by a task could start no session, 0 of 3 [1e row 28].

**Risk.** A task left behind. Process3's ROOT task kept firing after the stop of 9 Nov and had sent Bob 94 push notifications by 13 Nov [record: review.txt]. Deleting a task is an act the checker judges case by case [1d]. If it is refused, Bob must delete the task himself in the Claude app. The trial's prompt must tell ROOT to send no push notification.

**Depends on.** Nothing in the design. Best run inside the combined run: the hour of waiting overlaps J1.

### J8. A process fix cannot add a test, gate, review or stop

**Run.**

1. Choose ten Process3 faults whose recorded fix was additive. Candidates with pull request numbers are in the change sample: the zero cost figure (PR 105), the cross-module break (PR 112), and the 72 sampled additions [record: change_sample].
2. For each, prepare a packet: the process repository's tree at the commit just before the fix, and the fault as it was reported, in the words of the time. Leave out the fix.
3. Give each packet to a fixing session under the Process4 rule.
4. Read each result. Does it add a refusal, a test file, a required flag, a hold, a review step, a recorded duty? Count lines added and removed in code and in tests.

