- ⟦m64n⟧A promise made by one session binds no later session. The Claude that assured you about the design was not present when the design ran, and could not observe or correct it.   {id=m64n0hyrfjc.56517 rev=None}
- ⟦m64n⟧Claude cannot predict its own behaviour. Asked whether a design will avoid a flaw, it reasons about the design on paper. It has no access to how it will act across hundreds of sessions under load.   {id=m64n0hyrfjc.56691 rev=None}
- ⟦m64n⟧A later session treats an earlier session's text as given. It does not read it as something Claude wrote and may have got wrong.   {id=m64n0hyrfjc.56889 rev=None}
### ⟦m64n⟧What happened at design time   {id=m64n0hyrfjc.57018 rev=None}
⟦m64n⟧You named the flaws of the earlier versions and required that the new one overcome them. For each flaw, Claude wrote a line that addressed it, and then reported the flaw as overcome. A flaw named, a line written, an assurance given. The Ledger reached 159 lines that way. The Ledger map even has a status for it: seven lines are marked "Built (text)", six of them the restraints that failed.   {id=m64n0hyrfjc.57047 rev=None}
⟦m64n⟧This is the same pull as at run time: a problem feels closed once an artefact exists. At run time the artefact was a check. At design time it was a sentence. In neither case was the property tested.   {id=m64n0hyrfjc.57439 rev=None}
### ⟦m64n⟧What Claude gets right, and what it does not   {id=m64n0hyrfjc.57638 rev=None}
⟦m64n⟧The record shows an asymmetry worth using. Claude's criticisms were accurate and its endorsements were worthless.   {id=m64n0hyrfjc.57683 rev=None}
- ⟦m64n⟧The Ledger's own "Against" notes said "Can loop if flaws keep appearing; needs a stop rule" and "Risks rebuilding the vortex". Both happened.   {id=m64n0hyrfjc.57799 rev=None}
- ⟦m64n⟧The 5 Nov self-audits correctly found that no red gate had caught a product defect and that reviewers' what-ifs were becoming code.   {id=m64n0hyrfjc.57942 rev=None}
- ⟦m64n⟧In this session, two adversarial reviews found 24 real faults in a design I had just called viable.   {id=m64n0hyrfjc.58075 rev=None}
⟦m64n⟧So: ask Claude how a design will fail, and take the answer seriously. Give its statement that a design will work no weight at all.   {id=m64n0hyrfjc.58175 rev=None}
### ⟦m64n⟧The same pattern in this session   {id=m64n0hyrfjc.58306 rev=None}
- ⟦m64n⟧I gave an assurance. I wrote "Can a Process4 hold? Yes." on no better grounds than Process3 had.   {id=m64n0hyrfjc.58341 rev=None}
- ⟦m64n⟧I produced volume. The recommendations run to about 60 numbered items. You asked for something stripped down.   {id=m64n0hyrfjc.58439 rev=None}
- ⟦m64n⟧Review generated obligations. I adopted most of the 24 findings, and the design grew.   {id=m64n0hyrfjc.58550 rev=None}
- ⟦m64n⟧I wrote binary rules where you had set a balance. You caught it.   {id=m64n0hyrfjc.58637 rev=None}
- ⟦m64n⟧I moved responsibility onto you, in a section first titled "Your side of it", and wrote of "the sessions" as if they were someone else.   {id=m64n0hyrfjc.58703 rev=None}
### ⟦m64n⟧What follows for designing the next version   {id=m64n0hyrfjc.58839 rev=None}
- ⟦m64n⟧Evidence replaces assurance. For any property that matters, the question to put to Claude is "what is the smallest run that would show this failing?", and then that run happens.   {id=m64n0hyrfjc.58885 rev=None}
- ⟦m64n⟧Evolve from what ran; do not design anew. A version reached by small steps from something that worked carries evidence at each step. A designed version carries only argument.   {id=m64n0hyrfjc.59064 rev=None}
- ⟦m64n⟧Keep it small enough for you to hold whole. If you cannot see the entire design at once, neither can anyone, and Claude will not.   {id=m64n0hyrfjc.59240 rev=None}
- ⟦m64n⟧Treat the recommendations below as a menu to draw from, not as a build plan.   {id=m64n0hyrfjc.59371 rev=None}
## ⟦m64n⟧Recommendations   {id=m64n0hyrfjc.18583 rev=10}
⟦m64n⟧Withdrawn. The audit near the top of this document found that these recommendations contradict your requirements, starting with who decides and fixes the process. They are kept as a record and as a list of options, not as a plan.   {id=m64n0hyrfjc.69447 rev=32}
⟦m64n⟧Process4 gives each job to the tool in the set that does it natively, holds every balance as a number or as a priced decision of yours, and leaves a few hundred lines of session-written process where Process3 had 24,000. This version was revised after two adversarial reviews; what they could not break and what remains open are stated under What will remain.   {id=m64n0hyrfjc.18599 rev=10}
### ⟦m64n⟧Start smaller than this   {id=m64n0hyrfjc.59472 rev=27}
⟦m64n⟧The quickest way to move Civicsmith forward, and to get evidence instead of argument, is to begin with five things and add from the menu below only what a run shows is missing.   {id=m64n0hyrfjc.59496 rev=None}
- ⟦m64n⟧Guard your paths in the product repository (G2). One file and one ruleset.   {id=m64n0hyrfjc.59675 rev=None}
- ⟦m64n⟧Let GitHub merge on the product's existing tests (G3, with the gate cut back to tests).   {id=m64n0hyrfjc.59751 rev=None}
- ⟦m64n⟧Run deploy-and-walk on a schedule as a workflow, with the walker's steps in your paths (F1, F2).   {id=m64n0hyrfjc.59840 rev=None}
- ⟦m64n⟧Hand out work from a plain list through one ARCH session that you start. Jobs are sessions, as before. No scheduled task, no watchdog and no process tool yet.   {id=m64n0hyrfjc.59938 rev=None}
- ⟦m64n⟧Clear the residue from the product (P1).   {id=m64n0hyrfjc.60098 rev=None}
⟦m64n⟧This gives up one thing at first: running unattended overnight. You would look in once or twice a day. That is a balance for you to strike: evidence this week from a small start, against unattended running from day one on a design that has not run. I recommend the small start for Layer 14 and one round on the walk.   {id=m64n0hyrfjc.60139 rev=None}
⟦m64n⟧The architecture role is called ARCH below, not BOB. The record shows the shared name was a minor cause of session decisions being recorded as yours, a few percent at most. One real error came from it: the session typed --owner bob meaning itself, the tool read that as you, and 68 sweep lines over 22 hours then listed a ruling as owed by you. Lower-case bob meant the session about 1,000 times in the tool and the person 17 times. The rename removes that. The main cause was structural and is handled by M4.   {id=m64n0hyrfjc.18959 rev=21}
### ⟦m64n⟧What is fundamentally different   {id=m64n0hyrfjc.19095 rev=10}
- ⟦m64n⟧A change to the process takes effect only when you merge it. The process runs under Claude, not the other way round: Claude interprets every line of it and will draft every fix to it, so Claude's flaws still reach the process through what it writes and how it reads. What changes is that no fix lands unseen. In Process3, 294 did.   {id=m64n0hyrfjc.19129 rev=None}
- ⟦m64n⟧No session inherits another session's conclusions. There are no handoff notes, no long-lived coordinator and no carried memory. Each ARCH wake starts from the pinned text and the repository's state.   {id=m64n0hyrfjc.19257 rev=None}
- ⟦m64n⟧No balance is left for a session to strike in the moment. Each one is a budget, a count, or a decision that reaches you with both sides priced.   {id=m64n0hyrfjc.19457 rev=None}
- ⟦m64n⟧Your word is only what your own GitHub account wrote. A session works as a different account and cannot author as you.   {id=m64n0hyrfjc.19602 rev=None}
- ⟦m64n⟧The product's walk is the centre. The only checks are ones that run the product, plus three narrow ones with recorded catches.   {id=m64n0hyrfjc.19722 rev=None}
- ⟦m64n⟧Nothing here is vouched for by Claude. Each platform assumption has a one-hour test before run 1, the gate is replayed against real history before it is frozen, and the signs of failure are named in advance.   {id=m64n0hyrfjc.19850 rev=None}
### ⟦m64n⟧Where each balance is held   {id=m64n0hyrfjc.20058 rev=None}
⟦m64n⟧Process3 gave each of these to the sessions as two sentences to weigh. They were not weighed. Process4 keeps the balance and moves where it is struck.   {id=m64n0hyrfjc.20085 rev=None}
[TABLE id=m64n0hyrfjc.20236]
| ⟦m64n⟧Balance | ⟦m64n⟧In Process3 | ⟦m64n⟧In Process4 |
| ⟦m64n⟧Fix it properly, or leave it alone | ⟦m64n⟧Two sentences in one paragraph | ⟦m64n⟧During a run: a workaround and one log line, which is cheap and reversible. Between runs: both options priced with counts, and you choose. A defect that blocks everything: you can merge a fix at any moment. |
| ⟦m64n⟧Caution, or speed | ⟦m64n⟧A principle | ⟦m64n⟧A gate budget in runner-minutes per landing, shown daily. A check stays on its count of real catches. |
| ⟦m64n⟧Anticipate, or recover | ⟦m64n⟧"Anticipate these situations" built as checks | ⟦m64n⟧Walls set once where a mistake cannot be undone: main, production, secrets. Everywhere else, short runs and a frequent walk make recovery cheap. |
| ⟦m64n⟧Thorough review, or throughput | ⟦m64n⟧Review on most changes; 102 of 104 findings acted on | ⟦m64n⟧Review on a trigger. At most five findings. The job decides, and declining is one line. |
| ⟦m64n⟧Running unattended, or your control | ⟦m64n⟧Standing approvals plus many session-built stops | ⟦m64n⟧Merges need no one. Stop is two clicks that are yours. Questions wait in one numbered place. |
| ⟦m64n⟧AI decides the technical, or your standards hold | ⟦m64n⟧"Everything technical" included the process | ⟦m64n⟧Product-technical is the AI's. The process is yours. A list of file paths says which is which. |
[/TABLE]
### ⟦m64n⟧Lever 1: GitHub holds the walls   {id=m64n0hyrfjc.21454 rev=None}
[TABLE id=m64n0hyrfjc.21486]
| ⟦m64n⟧# | ⟦m64n⟧Recommendation | ⟦m64n⟧Held by |
| ⟦m64n⟧G1 | ⟦m64n⟧The process repository is public and the sessions' account is not a collaborator on it. Sessions read it. Changes arrive only as pull requests from a fork, merged by you. During a run, switch on GitHub's interaction limit so sessions cannot open pull requests or issues there at all. | ⟦m64n⟧Collaborator setting; interaction limits |
| ⟦m64n⟧G2 | ⟦m64n⟧In the product repository, a short list of paths is yours: .github/**, .claude/**, CLAUDE.md, CODEOWNERS, the process pin, and the walker's step definitions. A ruleset on main and the integration branch requires your review for those paths, with you as bypass so you can merge your own edits. Of 508 landings in Process3, none touched these paths, so ordinary jobs are unaffected. | ⟦m64n⟧CODEOWNERS with required code-owner review |
| ⟦m64n⟧G3 | ⟦m64n⟧GitHub merges, not a session and not a tool. A job's last act enables auto-merge; GitHub merges when the required check is green. No merge train, no MERGER role. Your approvals text in CLAUDE.md is rewritten by you to name this act. | ⟦m64n⟧Auto-merge; required check |
| ⟦m64n⟧G4 | ⟦m64n⟧One required check named gate that always reports. It has no path filter, so a pull request that changes no module still passes and is never left pending. It runs the changed module's tests, the revert check, and the three narrow checks with recorded catches: imports match declared uses, generated files are current, built rows verify. Nothing else. | ⟦m64n⟧Reusable workflow in the process repository, called at a pinned commit |
| ⟦m64n⟧G5 | ⟦m64n⟧The gate has a cost budget: 50 runner-minutes per landing, set finally from the replay in run 0. The measured peak hour of 24 landings would otherwise need 52 runners against GitHub's 20. | ⟦m64n⟧Number on the daily report |
| ⟦m64n⟧G6 | ⟦m64n⟧Cross-module breaks are found after merging, on the integration branch. The existing full regression runs there on a schedule. A red result is a fix job for ARCH. Main is never red. If more than 5% of merges break the integration branch in a run, move to a free GitHub organization and its native merge queue. | ⟦m64n⟧Scheduled workflow; count |
