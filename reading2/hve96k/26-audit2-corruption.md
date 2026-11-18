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
