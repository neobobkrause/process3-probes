# [file] audit_ledger.md (continued)

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
| P23 | a | I 5 "Keep its purpose: a lean repository" |
| GAP-1 | b-bob | A "while nobody watches"; E "completely blocked": his "CAN RUN" and "reaches him" are reworded (finding 6) |
| GAP-2 | d-part | own checkout by the blanket; the cost alarm neither stated nor ended (finding 16) |
| GAP-3 | b-bob | E "may only correct or remove" (14 Nov record) with I 7 |
| GAP-4 | a | G "starts from a status read-out"; C step 3 |
| GAP-5 | a | B "woken by events"; C step 8 |
| GAP-6 | a | F; I 11; the check that guarded the approvals block in git is not mentioned (finding 1) |
| GAP-7 | a | C "A public release" |
| GAP-8 | a | B coordinator paragraph and table; J12 |
| GAP-9 | blanket | the appendix does this; the main text does not say which document governs (finding 20) |
| GAP-10 | a | C step 7; K point 4 |
| GAP-11 | blanket | not mentioned; J1 asks for twenty or more measurements (finding 23) |
| GAP-12 | d-part | "the minutes it took of yours" carried; "BOB's idle time while work was ready" dropped (finding 11) |

## 7. Slips inside the main text met on the way (not ledger findings)

- F: "Unchanged from Process3: all of the above, and merging through the merge tool. The tool's three rules that demanded a review come out, which is a removal." K point 1 also takes the own-files check out of the merge tool, and H takes out the second test run. "Unchanged" and "three rules" understate it.
- K: "Your seven earlier open points" has eight numbered items; "Six were technical and Claude decided them" fits five of them (1, 2, 5, 6, 7).
- D: a notified job "runs only the tests that relate to them", while test one runs "that module's tests" on GitHub's machines whenever the module's files change, and C step 6 says tests do not run in the session. Where the narrower run happens is not said.
- G: "Releases. The process owns ... nothing on a live site." C deploys to a development site and walks it there.

## 8. Limits of this audit

- I read the main text against the ledger lines only. The 137 Foundations rows of the 288 were used as evidence, not audited.
- "Stated in the main text" is a judgment. Where a line is carried by a few words of a theme in G, I counted it (a) and wrote what is missing in section 6.
- Whether Bob himself made the six store changes of 14 Nov cannot be shown; the store has no author field.
- I could not read the conversation in which Bob gave his decisions of 13 and 14 Nov. Every statement here about what he "decided" on those days rests on `assessment_doc.txt`, a session's text.


# [file] process4_definition_v6.md (later part)

**The first hour**

7. **Your own acts in converting the repositories.** Not asked today. Some steps only you can do: new wording in your approvals, a changed list of forbidden commands, perhaps the GitHub rule in question 6. Your present approvals in the product forbid sessions to replace the required test run, so an edit of yours must come first there. Claude will bring you the full list of your acts, in order and in one piece, before asking for any of them.
8. **How new work is written into a module.** Your words of 14 Nov: "A job for module A isn't allowed to change module B. The only other way of editing a module is when a mechanical edit (like a word table change) makes the change." As worded, nobody but a module's own job may write a new requirement into it. Claude will bring this to you separately, with its options.

**The release**

9. **Which reading of "a clean development release walk" you meant.** Either the walk that already ended the tranche, so nothing further is walked; or, after the tranche ends, a development release is cut, installed on a test site and walked, and only then are the installer and the website updated. Claude's recommendation: the second. Under the first, three things reach a real team unwalked: the real installer placing the product into a Cloudflare account, an existing team's site being upgraded with its stored data in it, and the assistant working with a real AI model. The cost of the second is that all of it has to be built, and the installer's need for a person to sign in may mean an act from you at each release; that is not yet known.
10. **Whether "with AI on" still holds before the installer and website are updated.** Process3's decision record, written by a session, quotes you on 9 Nov: "Yes, the installer update and site update wait until a release walk with AI on is also clean." It costs you connecting an AI account. Claude's recommendation: yes, at a release only, since you have said a tranche can end without it.

Binding on all jobs: the job's handover note is saved under the file name `drumlin-relay.md`, and under no other name.

11. **Whether an upgrade of an existing site is walked before a release,** or left to one module's own tests. Claude's recommendation: walked, as part of the same release walk.
12. **Where flaws go when a walk made after the tranche finds some.** No recommendation yet; it depends on your answer to question 9.

**Your requirement lines**

13. **The seven proposals** for the 33 lines of yours that the fifth draft ended without asking you; they are listed at the end of this section.
14. **Which document governs** where your ledger and your Foundations still say the opposite of the definition, for 75 of your lines. Claude's recommendation: a sentence saying the definition is followed from the day you accept it, with the ledger and the Foundations kept as the record of what you decided before; and only once the definition accounts for every line of yours, since otherwise the lines it does not state would vanish by default.
15. **Whether a job may commit built files** (files produced from other files). A line you kept says a job never does; the definition says it does (section J). With it comes the wording in your approvals that the large files a lane's tools build "are built at layer close, deploy and release, never committed": layers are ended, so "layer close" names something that no longer exists. Claude will bring new wording together with this question.
16. **Rewording a requirement.** One older line of yours lets the directing session reword a requirement and tell you in one line afterwards. Your rule of 14 Nov puts such a change to you first. Both cannot stand.

**Lanes** (section C)

17. **Who starts a lane.** Your Foundations: "BOB is the only creator of jobs and lanes". Your answer of 6 Nov as recorded: "BOB starts jobs and lanes, not ROOT". Your hint of 14 Nov has ROOT start PROCESS. Claude's recommendation: both stand. ARCH starts a product's design lanes; PROCESS is the one lane ROOT starts, because it belongs to the process and not to any one product. It needs only your yes.
18. **PROCESS and the two triage lanes.** On 6 Nov you kept a process triage lane and a product triage lane, each to study a problem and bring you options. Claude's recommendation: PROCESS takes the place of the process triage lane, and no product triage lane is started: Process3 built it and never once started a session for it, and in Process4 a flaw found by a walk already becomes work in the next round. That would end something you kept, so it needs your yes or no.
19. **Whether you work with design lanes directly.** On 5 Nov, as recorded, you described lanes' design documents as pages they "create/update/interact with me using". The session's record of 13 Nov has the coordinator as your front door. Claude's recommendation: you work with a lane through its design pages, and with PROCESS directly; everything else comes through the coordinator.
20. **Which lanes Civicsmith begins with.** Claude's recommendation: UX, investigation design and publication design, as on 6 Nov, and any further lane when you identify the need. It needs only your yes.
21. **Your approvals name "BOB".** They say lanes are "run under BOB"; the definition calls that session ARCH. Proposed: the approvals name ARCH when they are next edited. Nothing else about the sentence changes.

**Other matters**

22. **The record's line 11 and your words of 15 Nov.** Line 11 of the session's record of 13 Nov says: "Recognising that an interface changed must be proved rigorous and correct." Your words of 15 Nov: "there is no means to reliably tell the difference when there's a change in a module between when that change changed the interface or changed something other than the interface." Proposed: line 11 is replaced by your words of 15 Nov and your choice of the same day, so that the notice is a way of saving work and not a guarantee (section F).
23. **Tests for the process's own tool.** You agreed in the fourth draft's proposal 5 that the small tool sessions use has tests of its own, and in the same message wrote that there is no need for any more tests. Claude reads the two together this way: the tool's tests test no product and never run on a product's work, so the three tests stay three (section E). Say if you meant otherwise.
24. **A product question that will come to you.** Whether a member's own Claude sign-in through the runner still exists: one module still passes that sign-in to four addresses that now answer "not found", and its requirements file states both positions. Not decided here.

**The seven proposals for the 33 lines.** For each, yes means the ending stands; no means your lines stand as you wrote them. Until you answer, the lines are proposed for ending, not ended. Each proposal is written out in full and ready; say when you want them. Nine of the 33 are checks or re-tests that your "three tests and no others" may already end, but you were never asked whether your words reach that far.

1. **When Process4 counts as in force, and the first of your two numbers for judging the process** (5 lines): the first number, false "done" claims caught by a second look, is dropped, and nothing is in force until it has run on a real tranche.
2. **Three things to be measured on the first tranche** (5 lines): an architecture session that keeps no memory between wakes, trimming the principles each role loads, and the share of the architecture session's work spent passing things on; all three end unmeasured.
3. **Two duties repeated at each new model version and at each tranche's opening** (5 lines): taking parts of the process away one at a time to see what is still needed, and recording, counting and re-trying refusals of acts you approved.
4. **Two removals for which the fifth draft cited what Process3's decision record says you said on 9 Nov** (3 lines): the job's written receipt of its commands, and the set-up check before every job start, which that record in fact kept, run less often.
