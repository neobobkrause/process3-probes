- [reasoning] A session waiting on PROCESS is a session that has stopped. Nothing tells ROOT's hourly wake to leave it alone. Either ROOT replaces it each hour, or ROOT tells Bob each hour.
- [reasoning] PROCESS holds the process's repository only. It cannot look at the product's repository where the fault happened. It explains "the nature of the problem" to Bob from a description written by a job, passed by ARCH, passed by the coordinator. Each hop is a session's free text, the channel in which "about 6 job sessions" became his agreement (causal_forensics §3C).
- [reasoning] Who decides that a fault is the process's and not the product's, or a session's own slowness, is not said. A job that reports a product fault as a process fault parks its work with Bob. A job that reports a process fault as a product fault fixes it in the product (finding 6).

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

