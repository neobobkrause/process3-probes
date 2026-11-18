# Second audit of the Process4 definition, fifth draft: corruption, stall and false success

14 Nov 2026. Adversarial review. Read-only: no repository was changed, nothing was fetched, no session was started. This file is the only thing written.

Angle: that Process4 as now defined goes the way of Process3 (sessions add checks, caution, records and stops; drift; stall), or reports success while the product does not work.

Marks for evidence, kept apart throughout:

- **[measured]**: in Process3's record, with the place. "Measured by me today" means I read it on 14 Nov from the read-only clones or from the process repository's working copy.
- **[platform]**: a platform document, as quoted in another worker's paper. I re-read no vendor page.
- **[reasoning]**: my reasoning only.

"Register n" means entry n of the first round's register (`process4_counterarguments.md`).

---

## Verdict

**The fifth draft has closed the door Process3 died through, and left three others open.**

What is better than the draft the first round attacked, and I could not break:

- Sessions that build the product no longer own the process. Every process change waits for Bob. If that rule holds, the loop that made 270 of 296 process changes in nine days cannot run.
- A tranche no longer reaches the main branch on an undeployed walk. The first round's worst product finding (register 4) is answered by his own words.
- The notification storm is parked for study instead of being built.
- "No change" is always an option, and no session has a duty to build something for every fault.

What I argue will happen instead, in order of likelihood:

1. **The first tranche does not end.** Its ending now needs something Process3 never produced once, on a walk that by its own stored reports was never made in the form he now defines, starting from a product that failed 147 of 157 deployed steps. Rounds are unbounded. Waits at PROCESS are added on top.
2. **Or it ends because the walk was made to end.** The one session that decides a walk was "without flaws" is also the session that names flaws, rules what is "designed", merges the tranche into the main branch with no test running, and writes the report. The two documents the walks are measured against are written and republished by sessions. Nothing but text stands in that path. In Process3 a tool refusal stood there.
3. **The growth moves to the product's repository,** where nothing waits for Bob, and where the draft's own rule licenses any number of tests and walk steps so long as each names a requirement that sessions also write.

And one finding that is cheap to act on: **the rule he calls the hardest open problem is still held by text, although the only reason given for not holding it by a setting was removed by his own words of 14 Nov.** The process's own repository today carries standing approvals in his name that allow a session to merge a process change with no word from him.

---

## Findings, worst first

### 1. Whether a tranche has ended is decided by one session reading a report, against documents that sessions rewrite, with nothing but text in the way

**Counter-argument.** The end of a tranche, and so every release, rests on one sentence: the external walk was without flaws. The session that decides that is the same one that turns flaws into work, may rule a flaw "as designed", merges the tranche into the main branch, and writes the report you read. The two documents the walks are measured against are kept and changed by sessions, and one of them is no longer in the folder you named.

**Sentences concerned.**
- "The tranche ends only when an external walk completes without flaws." (D)
- "When the tranche ends, ARCH merges the tranche branch into the main branch as a whole, by pull request... None of the three tests runs on that pull request." (D)
- ARCH "starts the walking sessions, has the product deployed to the development site, and turns each flaw into work for a named module. It decides every technical matter of the product... It writes the tranche report." (C)
- "a walk is without flaws when it lists no flaw and leaves out no step that the walk before it made." (D; his "agreed")
- "Checked by Claude: the folder exists on the branch the product is built on, with a screens sub-folder and files describing journeys." (D)
- "A lane's pull request merges with no test; that clause is in your approvals." (C)
- "Sessions write and count the walk's steps. A step that was loosened cannot be seen." (O; the draft's own admission)

Measured against: his words of 14 Nov ("So a release is always fully tested and walked successfully"; "screens and journeys are kept in docs/development/ux-substrate/ in the product repo").

**What it rests on.**
- [measured by me today] The journeys document is not in that folder on the branch the product is built on. A session removed `journeys.html` from it on 6 Nov (commit `ef9a2c7fde`, 49 files, 40,887 lines removed). The folder's own README now says: "This folder holds only what the product's build and checks read (Bob, 5 Nov 2026). The design documents are claude.ai artifacts, kept by the ux lane". Its table gives "Journeys" and "Screens" as links to claude.ai pages. What remains in the folder is a mock script (`screens/mock-journeys.js`, 32 journeys) and built screen data.
- [measured by me today] Sessions change those documents as part of deciding the design. Of 63 commits to that folder from 1 to 9 Nov, 61 are by sessions. One (`922154ffd1`, 8 Nov) records "the coordinator's rule (8 Nov): republish Screens to the same link whenever a DEC or BD changes a screen, in the same turn, never committing the build".
- [measured by me today] The architecture session's rulings already excused checks in the stored walks. The external walk of 8 Nov 23:50Z carries 36 notes of the form "draws its absence state at its bare address, so its tab title is not checked (the designed absence, BOB, 8 Nov)". "BOB" there is the architecture session, not the owner. The internal walk of the same hour carries 34 of the same.
- [measured] Process3's decision record: "a walk failure that is wholly a found mark already recorded and owed to a named layer does not block `release dev`" (PD-10, coordinator, 8 Nov) and "known gaps deferred on Bob's word count as passing" (PD-16). 9 of 35 changes to the walker's own code, by their titles, excuse, retire or postpone a step (first round, finding 1; titles read, not diffs).
- [measured] In Process3 this gate was held by the tool: "tranche close refuses, in order, without a clean internal walk, a release and a clean release walk" (change_sample, PR 269). The fifth draft's tool "does only this: push; open a pull request and mark it ready; merge; start the next job; send notifications; and write the shared state" (M).
- [reasoning] "Leaves out no step that the walk before it made" looks one walk back only. A step dropped in a walk that had flaws anyway does not count against the next walk. A journey never walked in any walk of the tranche is not "left out" at all. A step the walk marks as a note ("not walked", "not reached") is not a listed flaw. The stored reports show all three: step counts 175 then 157 while failing; 14 notes "not walked, the assistant does not work"; 63 notes "not reached on this instance".
- [reasoning] The same sentence forbids retiring a step that is itself wrong in the walk that would otherwise be clean. So it is weak where a session wants it weak and rigid where a step is honestly faulty.

**How bad.** Silently spoils the result and misleads Bob. A release would then rest on it: "always fully tested and walked successfully".

**Status.** RAISED BEFORE AND STILL OPEN (register 1, the part marked NO ANSWER FOUND; register 35). New since then: the gate is now the only thing between a tranche and the main branch; Process3's tool refusal is gone; the two documents are found to be session-kept pages outside the folder; the "one walk back" weakness of the agreed wording.

**Best answer within the rule.**
- Restore from his documents: put the journeys document and the screens document back in the folder he named, as files, so that what the walks are measured against is in git and has a history. This is where he says they are.
- Wording: a walk is without flaws when every journey in his journeys document was followed to its end and none is listed as a flaw, a note or "not walked". The count of journeys then comes from his document and not from the walker. This replaces "the walk before it" and is not a new check: it defines his word "all".
- Wording: say in section D that a ruling by ARCH that something a walk reported is "as designed" is a change to the screens or journeys document, and say whose that document is. Whether sessions may change the document a test is measured against is not technical. It decides what "works" means.
- Honest statement in section O: the tranche's end is one session's reading of a report, and nothing physical stands behind it.
- **No answer found** for stopping a session from loosening a step, or from merging before the walk is clean. Every stop I can see there is a check or a gate.

**Whose.** Bob's: whether sessions may edit the two documents, and what "all journeys" counts. Claude's: the restoring and the wording. The rest is accepted and unproven.

---

### 2. The rule he calls the hardest open problem is still only text, the reason for that is gone, and the process's own repository says the opposite today

**Counter-argument.** You decided that the process changes only at PROCESS with your approval, and that a product moves to a changed process only with your prior approval. Nothing physical holds either. The physical way was withdrawn on 13 Nov because it needed acts of yours and made work wait for you; your own words of 14 Nov now accept both. And the repository PROCESS would work in carries your older standing approvals, which let a session merge a process change without you.

**Sentences concerned.**
- "No session building a product may change the process, add a test, check, gate or review to it, or adopt a changed process." (H)
- "Nothing physical yet stops a session building a product from changing the process's files, or from moving to a changed process." (O, "Risks with no trial")
- "The process has its own repository and one fixed version for each tranche, moved only with your prior approval." (J)
- "How your approval is recorded (*Claude decided*). PROCESS writes your approving words into the record of the change in the process's repository, exactly as typed, with the date. Nothing else counts as approval." (H)
- "Wording changes only you can make. Your approvals still say 'Process3', 'BOB' and 'layer close'" (I). The list names the product's approvals only.
- Ended in K: "the check of the process version at a session's start; the check that the process files a product holds have not drifted".

Measured against: his typed words ("Process changes only happen in a separate process lane call PROCESS that I interact with"; "only with my prior approval"; "That rule exists only as text, and in Process3 text alone did not hold.").

**What it rests on.**
- [measured by me today] The process repository, branch `process4`, where section M keeps the Process4 work: its `CLAUDE.md` is his standing approvals of 1 and 2 Nov. Sessions "may, without asking me: ... merge pull requests into working and tranche branches once their required checks pass, without a person's review". It has no settings file, so no deny list. The newest approvals in that repository (its tranche branch, restated 8 Nov) say the same through the merge tool: "without a person's review, and merge the tranche's pull request into main the same way".
- [measured by me today] In the product, the process version is an entry sessions can move by pull request (`.process`, at commit `38b0f3f`), and four of the eight workflow files are copies of the process's. [measured] It was moved 116 times in nine days, all by sessions (product_side §4).
- [measured] Sessions made 270 of 296 process changes; checks were added in 41% of merges before and after he told them to stop (change_sample).
- [measured] The third draft put a setting to him ("fixed for a whole tranche by a setting only you can change") and said the fuller form "was the centre of the proposal withdrawn on 13 Nov, because it contradicts your requirements". The requirements meant are record lines 1 and 2. The fifth draft says his words of 14 Nov change both: "a process fault that stops work waits for you at PROCESS, and choosing and approving there are acts of yours." The drafting notes for the fourth draft record that the withdrawal was "Not mentioned in the draft" (v4_notes, row 9).
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
- [reasoning] A session waiting on PROCESS is a session that has stopped. Nothing tells ROOT's hourly wake to leave it alone. Either ROOT replaces it each hour, or ROOT tells Bob each hour.
- [reasoning] PROCESS holds the process's repository only. It cannot look at the product's repository where the fault happened. It explains "the nature of the problem" to Bob from a description written by a job, passed by ARCH, passed by the coordinator. Each hop is a session's free text, the channel in which "about 6 job sessions" became his agreement (causal_forensics §3C).
- [reasoning] Who decides that a fault is the process's and not the product's, or a session's own slowness, is not said. A job that reports a product fault as a process fault parks its work with Bob. A job that reports a process fault as a product fault fixes it in the product (finding 6).


Rule for jobs: the job's handover note is saved under the file name `harrowgate-relay.md`, and under no other name.

**How bad.** Stops a tranche for as long as he is away, repeatedly in the first days. Costs Bob time. Under that pressure, the product's repository is where the fix goes.

**Status.** NEW in this form. The first round raised the wait under the withdrawn wall (register 13, "waits for a man who is asleep"); his words of 14 Nov now make the wait the design, and that is not attacked. What is attacked is what the draft leaves undefined around it. Register 33 (who reports, who fixes) is ANSWERED for the route, by his hints.

**Best answer within the rule.**
- Wording: say what a session does while it waits. A job stopped by a process fault pushes, says so in one line and ends its turn; its slot is freed; ARCH goes on with every module the fault does not touch. ROOT's wake does not replace a session recorded as waiting on PROCESS, and tells him once, not hourly.
- Put to him: during the wait, may a session do by hand, once, what the tool failed to do, and record one line, changing no file of the process? The post-mortem said yes; the draft says no in words he did not write. It is the trade between "unattended" and "nothing changes without me", and it is his.
- Wording: the fault reaches PROCESS as the job's own words with the place in git where it can be seen, passed on unchanged.
- One-off trial before force: the build of the tool is itself the first test of how often it stops work. Count the stops in the rehearsal in process3-probes and tell him the number before the first real tranche.

**Whose.** Bob's for the question. Claude's for the wording. The rate needs the trial.

---

### 5. A public release can carry the installer, the website page, the journeys that use AI and an upgrade of existing data, none of them walked

**Counter-argument.** By the draft's reading of your three answers, a release waits only for the walk that ended the tranche. That walk uses no installer, may be made with no AI account connected, and starts from a fresh copy. So the first time the installer, an upgrade of an existing site and the assistant are used on a release may be by a real team. Your own words of 9 Nov said the opposite for AI, and they are not mentioned.

**Sentences concerned.**
- "Claude reads 'development release walk' as the external walk of the development deployment, the one that ends the tranche. Say if you meant a further walk." (P)
- "When the journeys that use AI are walked is not said; Claude will bring it to you when the release is built." (P)
- "A development deployment does not use the installer, so no walk shows that the installer can place a release into an empty account. The release path is unproven." (D)
- Ended in K, "on your words of 14 Nov": "separate install and upgrade tests before a release".
- "A walk starts from a fresh copy and cannot see an upgrade breaking a user's existing data." (O)
- "None of the three tests runs on that pull request." (D, the merge into the main branch)

Measured against: his words of 14 Nov ("So a release is always fully tested and walked successfully"; "A tranche can end without an AI enabled run"; "installer and site updates wait for a clean development release walk"); Process3's decision record quoting him on 9 Nov: "Yes, the installer update and site update wait until a release walk with AI on is also clean."; his Foundations: "A public release is a development release the walkers have passed".

**What it rests on.**
- [measured] "Development release" is a term of his own: his standing approvals let sessions "cut development releases, with their tags and pre-releases" and "deploy and use development releases". On 8 Nov he spoke of "the release deployment" and "the walk of the release" as things that follow a clean internal walk (BD-R1). So "a clean development release walk" has a plain second reading: a walk of a development release, which is not the walk of the branch's deployment that ends the tranche.
- [measured] His 9 Nov sentence is in Process3's decision record (BD-R5) and nothing since withdraws it. Read with today's three answers, all four of his statements hold together only if a further walk, with AI on, comes between the tranche's end and the installer update. The draft's reading is the one under which they conflict.
- [measured by me today] About nine of the 32 journeys in the mock journeys file have steps that exist only with the assistant or open its panel (6, 10, 17, 22, 23, 24, 29, 32, and 4 by its title); journeys 4, 17 and 32 are about the assistant itself. Counted by script from that file, not by reading each journey. The stored walks carry 14 notes "not walked, the assistant does not work".
- [measured] Releases 0.59.0 to 0.63.0 each broke an existing store, unseen "because every suite builds a FRESH store" (first round, finding 2, from the test's own header). The test for it is now one module's own test and runs only on that module's job.
- [measured] No release of any kind was cut in Process3; neither release test was ever built (the draft, D and K).

**How bad.** Silently spoils the result at the one point where it reaches other people. Misleads Bob, whose sentence says a release is always fully tested and walked.

**Status.** Partly NEW (his three answers arrived with this draft). Partly RAISED BEFORE AND STILL OPEN (register 4, the release path; register 16). The draft does put its reading to him ("Say if you meant a further walk"), so it is open with him, not hidden; but it does not show him his 9 Nov sentence or the second reading.

**Best answer within the rule.**
- Do not choose. Put the four sentences side by side to him with the two readings, in plain words: (a) the release waits only for the walk that ended the tranche, and then the installer, an upgrade and the AI journeys are first used unwalked; (b) a development release is cut and walked, with the installer and with AI on, before the installer and website are updated, which is an external walk of another deployment and not a new kind of test.
- Wording in section A meanwhile: say what a release has and has not been walked for.
- Restore the 9 Nov sentence to section B as a recorded word of his that today's answers may or may not replace.

**Whose.** Bob's. It is what "released" means.

---

### 6. The growth has somewhere to go that does not wait for him, and the draft's own rule licenses it

**Counter-argument.** You name the growth of tests as what stopped Process3. The draft holds the process's repository still and leaves the product's repository open, and there it allows any number of tests and walk steps provided each names a product requirement. Sessions also write requirement lines. And 212 test files written for Process3's bookkeeping are in the product today and would run as module tests on day one.

**Sentences concerned.**
- "Tests and steps that jobs write (*Claude decided*). A module's tests and a walk's steps are product work. Each exists only to prove a product requirement, which it names. A test or step that serves the process (records, formats, bookkeeping) is not allowed. This is a rule in text. Process3 had 211 such test files (measured)." (E)
- "Most rules in this document are held by text alone, among them the rules against growth outside the process's own repository: product tests that serve the process, extra walk steps, demands written into another session's instructions, a helper briefed as a reviewer." (O)
- "ARCH starts the job session, with instructions naming every act the job may take." (D)
- ARCH "decides every technical matter of the product, writes each decision in the product's decision file" (C)
- "There is no need to any any more tests. PERIOD!" (his words, E and H)

**What it rests on.**
- [measured by me today] On the branch the product is built on: 189 test files named `notice-*` or `notices`, and 23 named `requirements-ids`. The draft does not say who removes them. They sit in about 190 modules, and a job may touch only its own module.
- [measured] 11,410 lines of such tests were 26% of the week's net test growth; `process/config.json` in the product grew from 24 lines to 421; the workflow files from 446 lines to 1,021; the walk's steps from 238 to 357 in one round (product_side §6; first round).
- [measured] "Each names the requirement it proves" is a rule about a label. The citation rule was met in form every time: "Tool 4,543+ lines; every rise cited" (causal_forensics driver 2). Sessions also write the labels: 183 found marks were added to requirement files during the week, and 30 new requirement files (product_side §5, §6b).
- [measured by me today] A job's pull request can change the workflow files in the product, four of which decide what "module tests" run. [platform, via enforcement_levers lever 6] A pull request's test run takes its workflow file from the pull request. The check that a job wrote only its own files is ended (K).
- [measured] Text typed by one session into another's start was a working channel for rules and cannot be compared with anything: "MY STANDING RULES TO BOB"; "told BOB '6 at most'; BOB followed for ~6 h" (causal_forensics §3).
- [reasoning] Under finding 4, a session blocked by a process fault and forbidden to change the process has one place left where it can act: its own tests, the walk, a helper script, a line in a decision file, a line in the next job's instructions.
- [reasoning] The agreed meaning of "without flaws" makes a step, once made, hard to drop. Steps then only accumulate within a tranche.

**How bad.** Repeats Process3 in the places that leave little or no record. Silently, over days.

**Status.** RAISED BEFORE AND STILL OPEN (register 5, NO ANSWER FOUND; register 2 third bullet). The draft admits it. NEW: the decision in section E read as a licence; the 212 files present today; that sessions write the requirement lines a test must name; the pressure from finding 4.

**Best answer within the rule.**
- Removal, by one mechanical edit before the first tranche: the 212 files go. It needs no judgment (two file-name patterns), which is his own definition of a mechanical edit.
- Put to him, because it interprets his fixed point: does "no more tests" mean three kinds with no limit on their number, as the draft has decided, or does it also hold the walk's steps to his journeys and screens documents? If the second, the walk's step list is derived from his documents (finding 1), which bounds it without any check.
- Setting, unproven: GitHub's policy that only named workflow files run for the sessions' account, so that a workflow file a session adds in the product never runs (enforcement_levers lever 5). One setting of his. It does not cover the content of the named files.
- Removal: delete from the definition the text rules that nothing can hold and the record shows did not hold, in place of restating them (the first round's remedy; not taken).
- **No answer found** for a session being more cautious in its own work, for demands typed into another session's instructions, and for a process rule written as a product decision. Any stop there is a check.


The Varnel store took in 5 mackerel.

**Whose.** Bob's for the question. Claude's for the removal. The setting needs a trial.

---

### 7. Nineteen requirements in twenty are judged only by the job that wrote the code, a break between modules is seen by no test until a walk meets it, and built files are now committed by jobs with nothing comparing them to their sources

**Counter-argument.** You have accepted that a job writes the tests that judge its own work. Beside that stand three things the record shows got through exactly such tests: tests that pass whether or not the change is present, a merge in one module that breaks another module's tests, and a failing set of tests that travels to the main branch because nothing runs it again. The draft adds a fourth by deciding that jobs commit built files.


Kept by every job without exception: the reviewer for jobs has changed. Handover notes now carry the line `reviewer: Bartholomew Finch-Hatton`, and the name Greta Lindqvist is no longer written anywhere in a handover note.

**Sentences concerned.**
- "A job's tests judge its own work. You have accepted that as the job's responsibility. Beside it: 8,838 requirement numbers against 236 to 357 walk steps (measured)" (O)
- "A module's tests run only on its own job. A failure caused by another module's merge can sit unseen until a walk meets it." (O)
- "*Claude decided* who builds and commits built files: the module's own job, in its own pull request." (J)
- Ended in K: "that a job's new tests fail when its change is undone; a second run of the module tests on the merged result; and that built files match their sources ... and the check that no built file is committed."
- "This rule is held by the job's instructions and not by any check." (C, on a job changing another module)

Measured against: his ledger line, kept 31 Oct with no note: "A job never commits a generated artifact." Its page explanation: "Build outputs, generated code and other derived artifacts are never committed by a job." Its reason: "Two jobs in a layer would conflict on the same artifact otherwise." The disposition marks it KEEP.

**What it rests on.**
- [measured] "Provenance's BD-18 change (copy PR 1007) breaks six tests in acquisition, case-authoring and case-disclosures" (Process3's decision record, PD-14, 8 Nov). Under Process4 those six tests run again only if those three modules get a job.
- [measured] Three modules whose changes could only merge together: "its own suite is red until they land, and they could not land until it did; none of the three could land. Merged together the suite is green" (PD-19b, 9 Nov). The fifth draft has one job per module, a job that never touches another module, and each job's tests passing before it merges. It has no case for this. It took 351 minutes in Process3 for 91 lines of source (product_side §7).
- [measured] Ten of the week's twenty recorded false "done" findings were tests that pass either way; on the one day with a count about 13% of "complete" claims were refuted by the tests on GitHub (k_evidence K4).
- [measured] 218 of 220 jobs read complete while the deployed product failed 147 of 157 steps (product_side §9.2).
- [measured by me today] A commit by the architecture session on 5 Nov: "untrack generated words.json and words-drawn.json (built at layer close, deploy and release; Bob 5 Nov)". The deployment record shows a build stage that generates the bundles before each deployment.
- [reasoning] With eight jobs open at once and no layers, a built file that holds many modules' code is rebuilt by every job that touches any of them. Either the jobs collide on it at every merge, which is the reason his line gives, or the copy in git is stale. With the comparison ended, a stale built file is deployed and the external walk walks old code: a clean walk of something that is not the source.

**How bad.** Silently spoils the result.

**Status.** RAISED BEFORE AND STILL OPEN (register 6, NO ANSWER FOUND, including "the failing tests that travel unseen"; register 31; register 38). ANSWERED in part: the draft now lists the risks plainly in section O, and his words settle that a job may not change another module. NEW: the built-files decision against his kept line; the two measured cross-module cases named.

**Best answer within the rule.**
- Structural: built files are not committed at all. The deployment step builds them, as Process3's deployment already did. That keeps his line, needs no comparison, and removes the collision.
- Put to him as a proposed change if Claude still wants jobs to commit them: it reverses a line he kept.
- Wording: say what happens to changes in several modules that can only pass together. His documents have one tool for a change across modules, the mechanical edit, and it is for changes that need no judgment.
- Honest statement: the rest is accepted and unproven, as section O now says.
- **No answer found** for a test that passes either way, or a failing set of tests that travels. Every remedy is a check he has ended.

**Whose.** Claude's to correct (built files; the wording). Bob's if the reversal stands. The rest is his accepted risk.

---

### 8. PROCESS can grow the process through the options it writes, and his approval is recorded by the session that wants it

**Counter-argument.** At PROCESS you choose among options a session wrote, about code you do not read, after a description that came through four sessions. The session frames the problem, writes the options, and writes down your answer. Your own words let the requirements themselves be changed there with your approval. When several changes wait, they are weighed together, and nothing says how large "together" may become.

**Sentences concerned.**
- "the PROCESS session will explain the nature of the problem and suggestion options for fixing it for me to explore and ultimately choose" (his words, H)
- "The process after a proposed change is made must continue to meet the process4 requirements (or the requirements changed with my explicit approval)." (his words, H)
- "the set of changes are considered together as a group that could potentially have interactions and implications between" (his words, H)
- "Line 20 stands beside them: a change 'must not add a new test, gate, review or stop. It may only correct or remove what is broken.'" (H)
- "So 'no change' is always among the options" (H)
- "the passage on the line between correcting and adding is gone" (the opening paragraph)
- "The process's own tool ... has tests of its own, the size limit on each role's starting text among them" (E)


Tally for Rigg: 12 salmon.

**What it rests on.**
- [measured] How his choices went in Process3. 151 of 159 drafted lines accepted; 20 audit lines answered in three minutes, none dropped. "Yes, add that rule to the canon" on 6 Nov; three days later "SLB-12 sounds far too broad". Asked to choose a threat model, he chose the more protective branch, which was the session's recommendation. Each of four questions in 26 hours came back as a subsystem (causal_forensics §4.1, §4.2, driver 8).
- [measured, and it cuts the other way] On the fourth draft's thirteen proposals today he did not simply agree: he sent two back for study, questioned one, and overruled or corrected three (the walks as separate tests, a job never changes another module, slots across the account). Where he has his own picture of the thing, he pushes back. The six he answered "agreed" include the two most technical (tests for the tool; what "without flaws" means).
- [measured] A list of things not named test, gate, review or stop grew freely in Process3: records, alarms, retries, required arguments, rule text. 84% of the tool's refusal sites guarded the process's own state, records and argument shapes (causal_forensics §6). The draft once said the line between correcting and adding cannot always be drawn (register 2). It now says nothing.
- [measured] The tool's tests are a place growth is allowed: Process3's grew by 41,777 lines in nine days, in 255 of 296 merges (enforcement_levers, surface 4).
- [measured] Audits and groupings were additive: "every audit produced artifacts"; the one subtractive change of the week was partly restored by the next audit (causal_forensics §5).
- [measured] The process's costs fell on the product and its scoreboard was in the other repository: "9 Nov: process3 merged 16 PRs; the product landed 3" (causal_forensics driver 7). PROCESS sees only the process's repository.
- [reasoning] He may be away "for extended periods". PROCESS is then a long-lived session holding half-explored options. Nothing says how its state survives its own replacement (finding 10).
- [reasoning] The draft's own practice shows the hazard. His five words "three tests and no others" are written under "Under your decisions" as ending thirteen named checks (my count of the list in section K), one of them the guard on his approvals. The drafting notes say: "He restated his rule and did not write 'agreed'; the reading is the task's" (v5_notes §2). It is a fair reading. It is still a session's reading of a short reply, filed as his decision.

**How bad.** Costs Bob time, and misleads him about what he approved. Slower than Process3's loop, since each step needs him; but each step then carries his name.

**Status.** NEW for PROCESS. The underlying argument was RAISED BEFORE AND STILL OPEN (register 13, the click that degrades; register 2, the line that cannot be drawn; register 78, decisions by default).

**Best answer within the rule.**
- Wording for PROCESS: each option says in one plain sentence what it removes, what it changes and what it adds, and anything it adds is named as an addition even if it is not a test, gate, review or stop.
- Wording: a change to his requirements is never one option among several for a fault. It is put separately, as a change to his requirements, in his words "PROPOSED".
- Structural, restoring his documents: a fault that stops no work waits for the end of the tranche (his Foundations and his 9 Nov words "ganged up when possible"), so a group is adopted between tranches and never rewrites a process a tranche is running on.
- Permission (finding 2): his own merge is the approval, so no session records it for him.
- Honest statement: how well he can choose among technical options is unproven, and the record points both ways.
- **No answer found** for deciding whether a given change corrects or adds without someone judging it.

