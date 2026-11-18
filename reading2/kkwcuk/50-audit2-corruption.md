- [platform, via enforcement_levers levers 1 and 2] If the sessions' GitHub account is not a collaborator on the process's repository, GitHub refuses every write; a branch can be made updatable only by him. Neither was ever measured here.
- [measured] No case was found of the permission checker enforcing a "never" that had no deny rule or GitHub rule behind it (enforcement_levers lever 8). And the rule against adding checks "was never in Bob's committed text in Process3".
- [reasoning] A product session can start a session on any repository (ROOT is designed to start PROCESS on the process's). So "holds one repository" does not keep a product session's hands off the process.
- [reasoning] "Nothing else counts as approval" is recorded by the session whose change is being approved. No one can compare the record with what he typed.

**How bad.** Without a physical holder: repeats Process3, on the measured rate. Also misleads Bob: the draft tells him the rule exists while his own committed approvals in that repository grant the opposite.

**Status.** RAISED BEFORE AND STILL OPEN (register 2, 5, 13, 17). Register 13 was "put to you as a question"; his answer was the PROCESS paragraph, which sets the rule and is silent on what holds it. NEW: the reason for the withdrawal no longer stands; the state of the process repository's approvals and settings.

**Best answer within the rule.**
- Wording, his to commit: the process repository's approvals say that a change there is merged only on his word at PROCESS, and name what PROCESS may do. That puts the rule in the one text channel Process3 never tried.
- Permission or setting, put to him as a proposal: the branch of the process's repository that products use can be updated only by him; his merge of the change on GitHub's website is the approval. He already commits his approvals there. This costs one act per approved change, which he now makes anyway by typing his approval, and it makes "prior approval" something a session cannot write for him. It also means a product cannot move to a changed process that he has not merged.
- Honest statement: neither stops growth outside the process's repository (finding 6).

**Whose.** Bob's. It adds a kind of act (a merge on GitHub's website) to his list, and that is not technical. Building it needs a trial: none of it is measured.

---

### 3. A tranche may never end, for reasons that have nothing to do with tests growing

**Counter-argument.** You give the growth of tests as the reason no tranche finished. The record shows other reasons a walk failed that would recur in a process that does not grow at all: the walker's own machinery, the deployment's data, and a browser that died. The external walk as you now define it was never made in Process3. And three of the journeys begin at the installer or the website, which you have put outside the tranche.

**Sentences concerned.**
- "Nothing bounds the number of rounds. You give the reason no tranche finished in Process3: it 'kept adding test after test'. So the risk that a tranche does not come clean is unmeasured for a process that does not grow. Only your word ends a tranche that will not come clean." (D)
- "No walk of either kind finished without flaws in Process3 (measured), so that ending is unproven" (A)
- External walk: "follows the UX journeys to confirm that all journeys can be completed successfully to produce proper results" (A, his words)
- "A development deployment does not use the installer" (D)
- "a walk is shared out among them by journey, with at most as many walking sessions as there are slots" (D)

**What it rests on.**
- [measured by me today, from the stored reports on the product's state branch]

  | Walk | Steps | Steps failing | What the failures were |
  | --- | --- | --- | --- |
  | Internal, 5 Nov 15:38Z | 236 | 0 marked | 63 failures listed, all of one kind: states the local walker could not reach |
  | Internal, 8 Nov 07:20Z | 238 | 0 marked | the same 63, three days later |
  | External, 8 Nov 07:20Z | 175 | 155 | 1,050 layout overlaps, 640 undefined style classes, 1 step |
  | Internal, 8 Nov 23:50Z | 357 | 70 | 96 layout overlaps |
  | External, 8 Nov 23:50Z | 157 | 147 | 80 steps on layout overlaps; **68 steps only because the walker's browser had closed** ("page.goto: Target page, context or browser has been closed", 67 times, and once at "browser.newContext") |

  So in the last external walk, about 68 of the 147 failing steps (about 46%) were one crash of the walker running through the rest of the "as member" steps; none of those steps lists any other failure. That is not growth and not a product fault.
- [measured] The same 63 failures stood on the internal walk for three days while its step count moved from 236 to 238. PD-10 names them: "every one an R21 carried state not reached on the local arm". A fault of the walker, owed for three days, then excused for a development release.
- [measured by me today] Of twelve development deployments, the first two stopped in the script that prepares the site for the walk and starts it (`p3dev-walk-setup.mjs --walk`; the record does not say in which part), one stopped at the build and one at the trial run of the deployment. The first external walk carries 63 notes "not reached on this instance" and one "no case on this instance": the deployed site did not hold the data the steps needed.
- [measured] 113 of 1,187 test runs failed on 3 to 5 Nov and 74% of those passed with no change to code or tests; module test runs were 21% failing on 7 and 8 Nov (k_evidence K1; product_side §6).
- [measured by me today] By their labels, the deployed walks were visits to each screen in two roles, not journeys followed to a result: 154 of the 157 steps of the last one are "screen <name>". The journey-like steps were in the internal walk, and of the 32 numbered journeys only two (3 and 28) appear there by name. His definitions of 14 Nov put the screens in the internal walk and the journeys in the external one. So the walk that must come clean to end a tranche has no ancestor in the record: its length, its failure rate and its data needs are all unknown. The 60 and 64 minutes the draft cites are for screen visits.
- [measured by me today] Journeys 1, 28 and 29 in the mock journeys file begin at the installer or at civicsmith.org ("Bob installs his team's Civicsmith from civicsmith.org"). "All journeys can be completed" cannot be true on a deployment that does not use the installer.
- [measured] The first Process4 tranche starts from Process3's end state: 357 requirement marks unmet, 51 found marks unmet, 147 of 157 deployed steps failing, 96 failures on the internal walk (product_side §8, §9). A walk is of the whole product. So whatever a tranche is said to contain, it cannot end until everything a walk can see is clean, including faults that were there before it began. Nothing in the draft says what sets the content or size of a tranche.
- [reasoning] Each round repeats both walks in full. Each fix round changes modules whose effects on other modules no module test sees (finding 7), so a round can add flaws while it removes them. The record has one data point: failures fell 89% in one round and 147 of 157 steps still failed.
- [reasoning] A walk shared among up to eight sessions against one deployed site adds what Process3 never had: walkers changing each other's data, and a "clean" result assembled by ARCH from eight partial reports.

**How bad.** Stops a tranche, without limit. Nothing reaches the main branch and no release can start.

**Status.** RAISED BEFORE AND STILL OPEN (register 1, first horn, and its "Not answered": the one-off measurement was not taken; tranche size is still not said). NEW: the measured causes that are not growth; the external walk as now defined never ran; the three journeys that need the installer.

**Best answer within the rule.**
- One-off trials before the process is in force, on Process3's last build, with no change to it: (a) make the same walk three times and count the steps that differ; (b) make one external walk as he now defines it, by journey, and record its length and how many journeys the deployed data lets it reach. Without these nobody knows whether a clean walk can be reached at all.
- Put to him, as a conflict between his own statements and not chosen here: "all journeys can be completed" against "installer and website are outside the tranche", for the journeys that begin there.
- Bob's to say: what a tranche contains, and whether a flaw that was there before the tranche began holds it open.
- Honest statement, already half made: rounds are unbounded. Add what his word does when he ends a tranche that will not come clean. The draft does not say whether it then merges with its flaws, which would contradict "a release is always fully tested and walked", or is dropped.
- **No answer found** for a walk step that fails for no reason in the product. Every remedy I can see (run it again, excuse it) is either a check or the loosening of finding 1.

**Whose.** Needs a trial first. Then Bob's for the two questions; Claude's for the rest.

---

### 4. While a process fault waits for him, the draft does not say what the product's sessions do, and what it does say recreates the pressure that made sessions add

**Counter-argument.** Every process fault that stops work now waits for you, for hours or days. The draft forbids the waiting sessions both to fix it and to work round it, says nothing of what they do instead, keeps an hourly alarm whose job is to wake or replace sessions that have stopped, and sends the fault to PROCESS as a description passed through three other sessions. The first tranche runs on a tool that does not exist yet, so such faults are the expected case in its first hours.

**Sentences concerned.**
- "The process itself has a fault. No session building a product fixes it or works round it. The job reports it to ARCH, and any change is made only at PROCESS, with you" (G)
- "Now a process fault that stops work waits for you at PROCESS... In Process3 one question that sessions carried as yours waited about nine hours (measured)." (H)
- "Once an hour an alarm wakes it as a safety net, as in Process3, to wake or replace a session that has stopped." (C)
- "Claude reads your hint to mean that the fault's description travels from ARCH to the coordinator and from the coordinator to PROCESS." (H)
- "In every other case the stop is recorded as a named blocker and other work goes on" (G)
- "How often a process fault stops work and so waits for you at PROCESS" (O, "Only the first real tranche can show")

Measured against: his PROCESS paragraph, which says where changes are made and that he may be "away from my computer for extended periods". It does not say "works round".

**What it rests on.**
- [measured] "or works round it" is the draft's wording, not his. The Foundations line it echoes, "a workaround for the moment is not a fix", is ranked first among the ten causes: "The texts mandated a build for every failure and outlawed the cheap alternative" (causal_forensics driver 1). The post-mortem recommended the opposite for a running tranche: "A process flaw found mid-tranche gets one line in a log and a workaround" (review.txt, "What has to be true"). The question put to him on 13 Nov named the sentence; his recorded answer limits the form of a fix and says nothing on working round (assessment_doc, the six questions and line "Question 1").
- [measured] What blocked sessions did: "Every layer-1 job on the copy failed the ownership check when it cleared a mark; BOB worked around it" (change_sample §4, PR 46). "Most of those edits [to his approvals] were drafted by the coordinator to work around some other refusal" (review.txt). On 8 Nov a ruling of "no workaround, no exemption" left a merge blocked for 96 minutes with 20 slots empty (review.txt).
- [measured] 296 changes merged into the process in nine days; about 38 of 53 later fixes repaired "defects or slowness that earlier process changes made" (causal_forensics driver 1). Process4's tool is new code (M: "No Process4 tool exists").
- [measured] After the stop of 9 Nov the hourly alarm fired until 13 Nov and sent 94 notifications (the draft, G). An alarm that ran falsely for over two hours cost 1,564 git processes before every command (change_sample §5, via first round).
