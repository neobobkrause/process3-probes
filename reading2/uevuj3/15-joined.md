# [file] attack_corruption.md (continued)

| I 6. End the job record as a data file | With state in pull requests, a second account suspension hides the record with the account (redteam_corruption 10; the suspension of 6 Nov is measured, the hiding is not) | Real; unproven |
| I 7. End the citation rule | Finding 11(d) | Real |
| I 8, 9. End the advice on instruction texts; allow refusal for size on the process's own texts | Something must do the refusing. That is a test outside the three (finding 8) | Real; Bob's to rule |
| I 10. End the reading audit | Never built. None | None |
| I 11. Keep the approvals check at start-up | Finding 10 | Serious |
| I 12. Keep tokens in the cloud environment's settings | None found | None |
| I 13. Keep the two-part test run | Finding 11(c) | As precedent |
| K 1. End the own-files check | Finding 7 | Serious |
| K 2. End install and upgrade tests as release tests | Releases 0.59.0 to 0.63.0 each broke existing stores. The release walk "on a copy installed with the real installer" is unbuilt, and first runs while Bob waits to approve | Real |
| K 5. Retire the two judging numbers | Finding 11(a) | Bob's, not Claude's |
| K 6. External walk by fixed rule | Finding 11(b) | Bob's, not Claude's |
| K 7. Eight slots for each product | None on my angle | None |
| Technical 1. State in each job's pull request | A notified job with no change has no pull request to hold its state (finding 5) | Real |
| Technical 3. "only a fix for a blocking fault, once" | "Once" is not defined (per tranche, per fault?). If per tranche, the second blocking fault has no route; if per fault, it is Process3's 116 | Real; wording |
| Technical 7. ARCH judges a change trivial enough to skip tests | Finding 12(a) | Real |
| Technical 11. No completion-round list; rounds repeat | Finding 1: no bound | Serious |

## Appendix D. Earlier attacks checked against this draft

| Earlier finding (on the withdrawn proposal) | Still applies to the second draft? |
| --- | --- |
| redteam_corruption 1: the first gate defect stops all work and only the owner can clear it | Yes, under the wall (finding 4) |
| redteam_corruption 3: the process moves to the Claude side | Yes; the definition admits two of the channels in K and offers nothing |
| redteam_corruption 4: a long-lived coordinating session is the handoff chain in one body | Yes (finding 12b) |
| redteam_corruption 5: the owner's merge button is the route for growth | Yes, under the wall (finding 4) |
| redteam_corruption 6: checks move into the product's tests and the walk | Yes; now worse, because the walk alone ends a tranche (finding 1) |
| redteam_corruption 7: byte and line caps that do not cap | Changed: this draft has no caps at all (finding 8) |
| redteam_corruption 11: the draft commits the sins it diagnoses | Yes (finding 3, "The definition itself does it"; finding 11f) |
| redteam_feasibility 4: the required check must report on every pull request | Yes, as findings 5 and 12(a): the no-change job and the skipped-tests change |

## What I did not establish

- The diffs of the nine walker commits whose subjects excuse or retire a step. I read subjects only.
- Whether "no failures" was ever defined by Bob more exactly than the sentence quoted.
- The length of an internal walk. Only the deploy-and-walk runs are timed (60 and 64 minutes).
- A false-failure rate for the walk itself. The 7% figure is for module test runs on 3 to 5 Nov and includes red results caused by record checks, not only by chance.
- The simulation's job lengths and the placing of walk findings are assumptions; the graph, the modules with work and the 10% are from the record.
- I did not re-read vendor documentation. Platform statements are quoted through enforcement_levers and k_evidence.


# [file] process4_five_points.md (later part)

What none of the four stops: tests and walk steps growing inside the product itself, and what one session tells another to do. Whether pressing merge counts, for you, as one of the gates you have ruled out is yours to say.

---

## 3. The first hour

**What happened to ROOT on 5 November (checked today against Process3's log and the product's history).** A session runs on a cloud machine that is handed a copy of your repository when it starts. Your approvals are read from that copy, once, at the start. At 18:41 that day you started ROOT on the correct branch. The machine was handed a saved copy of that branch about an hour old: seven changes behind, and without the approvals you had committed sixteen minutes earlier. ROOT's first check noticed and ROOT stopped. Another session sent it one message, it fetched the newest copy, and it carried on. On 8 November the same thing happened with the same saved copy, by then three days old.

**The fifth draft got this wrong.** It said your ROOT "plainly came up on the main branch, which held old approvals, both times it was tried". Three things in that sentence are false: you did not start it plainly, you pasted the starting text the tool printed; it was not on the main branch; and you started ROOT three times, the first of which landed on the newest copy. The draft then asked you to make the tranche branch the one GitHub opens by default. That would not have helped, because ROOT was on the right branch and the setting does nothing about an old copy.

**What I have decided, and report.**

- I withdraw the request that you change the default branch.
- ROOT's first act is to fetch the newest copy of its branch and to stop if it cannot. That is what actually ran, twice. Not proven: why the cloud hands out an old copy, whether it still does, and whether approvals that arrive after a session has started count the same as approvals read at the start.
- How the process reaches a session. The draft never said. Your ledger does, in lines you marked "keep": the product names one fixed version of the process, and each session fetches a read-only copy of it. Process3 ran that way. I am putting those lines back; this was never an open design question.
- For three of the five steps the earlier session told you had "nobody named" (deploying, preparing a release, moving a product to a changed process), your Foundations name the session that directs the build. The draft dropped the name. I am restoring it, with the third now under your rule of 14 November: only with your prior approval, by the means PROCESS proposes. Archiving finished sessions I will assign and report.
- I owe you a written order for converting the three repositories (the product's, the trial one, the process's), saying who does each step.

**Yours, though I am not asking for an answer today.** Some conversion steps only you can do: new wording in your approvals, a changed list of forbidden commands, perhaps the GitHub rule from point 2. Your present approvals in the product forbid sessions to replace the required test run, so an edit of yours must come before anything else there. I will bring you the full list of your acts, in order, in one piece, before asking for any of them. One thing to know now: the trial repository refused the sessions' last two attempts to save work there, on 8 November, and why was never found.

The fifth step, how new work is written into a module, is a real question for you and I will bring it with its options separately.

---

## 4. The release reads two ways

**Your statements.** Typed on 14 November: "A release can (optionally) be started after a tranche completes. So a release is always fully tested and walked successfully." And: "A tranche can end without an AI enabled run", "installer and website are outside the tranche", "installer and site updates wait for a clean development release walk". And one sentence in Process3's decision record, written by a session and quoting you on 9 November: "Yes, the installer update and site update wait until a release walk with AI on is also clean."

**Two things that are easy to mix up.** A *development deployment* is the product put on a test site in your Cloudflare account straight from the branch it is being built on. A *development release*, in your approvals, is a packaged, numbered test version that sessions may cut and then install.

**The two readings.**

- First: "a clean development release walk" is the walk that already ended the tranche. Nothing further is walked. The fifth draft took this reading.
- Second: after the tranche ends, a development release is cut, installed on a test site and walked, and only then are the installer and the website updated.

**What goes unwalked under the first reading.** The real installer placing the product into a Cloudflare account. An existing team's site being upgraded with its stored data in it. The assistant working with a real AI model. A real team could be the first to meet each of these.

**What exists (checked today).** Process3 cut no release of any kind. It built the step that cuts a development release; that step never ran on the product. Nothing can yet install a cut release on a test site, and Process3's own tool says why: the installer needs a person to sign in. The steps that update the installer and the website were never built. So "none of it is built" was a little too broad: one step was built and never used. Your approvals on the product's tranche branch already allow sessions to "install and upgrade" a release on a test site and walk it.

A correction: the audit said the draft never showed you your 9 November sentence. It did, before you answered, and said that under its reading "nothing walks what the installer places". The earlier session removed that passage when it recorded your answer.

**Yours to decide.**

1. Which reading you meant. **My recommendation:** the second. Under the first, three things reach a real team unwalked. The cost of the second is that all of it has to be built, and the installer's need for a person to sign in may mean an act from you at each release; that is not yet known.
2. Whether "with AI on" still holds before the installer and website are updated. It costs you connecting an AI account. **My recommendation:** yes, at a release only, since you have said a tranche can end without it.
3. Whether an upgrade of an existing site is walked before a release, or left to one module's own tests. **My recommendation:** walked, as part of the same release walk.
4. Where flaws go when a walk made after the tranche finds some. No recommendation yet; it depends on your answer to 1.

Technical, mine to settle and report: which session prepares a release (your Foundations name the directing session), and how a release is packaged and put on a test site.

---

## 5. Your 288 lines

**Where the 288 come from.** 151 are from your Keep and Drop Ledger: a session drafted 159 statements and you marked each keep, modify or drop; the 151 are the ones marked keep (119) or modify (32). The other 137 come from your Foundations, the document a session wrote for you from the Ledger. Earlier auditors, not you, cut it into those 137.

**Where they stand in the fifth draft (a worker recounted today; the counts agree with the audit and add up to 288).**

- 112 kept and stated in the draft.
- 43 kept in purpose, with the way of doing them changed.
- 53 kept, but the draft says nothing about them.
- 75 ended, in whole or in one clause. Of these: 18 on something you typed on 14 November; 22 on a session's written record of your decisions of 13 and 14 November; 2 on a sentence a session wrote; and 33 by Claude without being put to you.
- 4 contradicted: the draft does what the line forbids.
- 1 no longer mentioned at all.

**The 33.** They are now grouped into seven proposals for a yes or no each: when Process4 counts as in force, and your first health number; three measurements owed on the first tranche; two duties repeated at each new model version; two removals the draft blamed on a 9 November remark of yours; records and cost figures for each job; size limits on what goes into the repository; and rules about the process's own instruction texts. Nine of the 33 are checks or re-tests that your "three tests and no others" may already end, but you were never asked whether your words reach that far. Until you answer, I will write "proposed", not "ended".
