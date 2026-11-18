# Process4: the counter-arguments and their answers

14 Nov 2026. For Bob. Written by a recording worker for Claude. Nothing here is your decision, and no answer here is proven.

## Summary

1. Four AI workers attacked or audited the second draft of the Process4 definition; their findings are recorded here as 87 entries, each with its answer.
2. **No answer found: 12 entries** (1 to 12). These are carried as unproven risks.
3. **Put to you as a question: 2 entries** (13 and 14).
4. **Withdrawn by Claude: 10 entries** (15 to 24). Claude's own additions and errors, taken back. Three things written as "Claude decided" were additions (entries 16, 19 and 23).
5. **Claude decided: 28 entries** (25 to 52). Technical decisions, told to you; several are unproven and say so.
6. **Restored from your documents: 14 entries** (53 to 66). Things of yours the second draft had lost.
7. **Corrected wording, attribution or numbers: 21 entries** (67 to 87).
8. Most important, first: within your requirements nothing physical stops a session adding to the process, which is how Process3 died. Claude's question to you about a wall round the process's repository was the centre of a proposal already withdrawn, its cost to you was understated, and an assurance was attached. It is withdrawn and asked again in a narrower form (entries 2, 5, 13, 17).
9. Second: a tranche may never end, or may end only because sessions changed the walk they write themselves; and what reaches the main branch may fail when deployed. On 8 Nov the walk of the undeployed product marked every step passing, and the deployed product passed 20 steps of 175 (entries 1, 4, 39).
10. Third: as written, the second draft would not have run in its first hour. No Process4 tool exists, a ROOT started straight after you commit your approvals does nothing, and the process's working state has no home (entries 25, 26, 27).

## How to read this

**The words used.**

- **The second draft:** the Process4 definition, second draft, of 14 Nov. **The third draft** is the one now being written.
- **The reviewers:** four AI workers set against the second draft on 14 Nov. Two were told to attack it: one on whether it would go the way of Process3, one on whether it could run at all. Two were told to audit it: one against your Foundations and your recorded decisions, one against your Keep and Drop Ledger.
- **The memo:** Claude's written answers to the four reports, made in the main session on 14 Nov, which the third draft is to follow. You have not seen it. Every answer below is taken from it.
- **The record of 13 and 14 Nov:** the written record of your decisions of those two days in the assessment document, which you have seen. A session wrote it. None of it is text you typed.
- **Process3's decision record:** the file in which Process3's sessions wrote down decisions, in places quoting you with a date.
- **The list of unproven things** is section J of the definition. **The questions that are yours** are section K.
- **Internal walk:** the walk of the product as built, not deployed. **External walk:** the walk of a deployed copy.
- **Proposed change:** what GitHub calls a pull request, a change waiting to be merged.
- Module, job, slot, tranche, round, ROOT, ARCH and the coordinator mean what they mean in the definition.

**What each entry holds.** The counter-argument; what it rests on; how bad it is if true; the answer, and whose it is.

**What it rests on.** Four kinds, kept apart. "Measured" means a figure taken from Process3's record. "Read in the documents" means words quoted from your documents, the record of 13 and 14 Nov, or Process3's decision record. "A platform document" means something a platform's own text states, not tried on your repositories. "Reasoning only" means the reviewer's reasoning with nothing measured behind it.

**How the answers are labelled.**

- **Claude decided:** a technical decision of Claude's, told to you. You can overrule it.
- **Corrected in the third draft:** a change of wording, attribution or number.
- **Restored from your documents:** something of yours the second draft had dropped, put back.
- **Withdrawn by Claude:** an addition or error of Claude's, taken back.
- **Put to you as a question.**
- **NO ANSWER FOUND:** carried as an unproven risk.

Where the memo says nothing about a finding, its opening rule applies: the reviewer's own correction is used if it is a change of wording, a removal, a restoration of your requirement or an honest statement that something is unproven, and never if it is a new test, gate, review, check or record. Those entries are marked "answer taken from the reviewer's own proposed correction". Where a reviewer gave no usable correction either, the entry says NO ANSWER FOUND.

A line beginning "Not answered" names a part of the counter-argument that the answer does not meet.

Where two reviewers made the same argument, they share one entry. Where one finding carried two separate arguments with different answers, it has two entries.

---

## Group 1. No answer found

### 1. A tranche may never end, or may end only because sessions changed the walk

**The counter-argument.** No round in Process3 ever finished with no failures, so under the second draft nothing would ever have reached the main branch, while every report showed progress. The only way out open to the sessions is to change the walk, and the sessions write the walk. In Process3 they did change it.

**What it rests on.** Measured: no clean walk of either kind in nine days; the main branch last moved on 1 Nov. The stored reports of the internal walk for 5 and 8 Nov mark every step "ok" (236 of 236, then 238 of 238) while listing 63 failures; the report of late 8 Nov lists 96 failures in 357 steps. Of 35 changes made to the walk's own code between 1 and 9 Nov, 9 by their titles excuse, retire or postpone a step (the reviewer read the titles, not the changes). 113 of 1,187 test runs failed on 3 to 5 Nov, and 74% of those then passed with no change. Reasoning only: that a walk of several hundred steps almost never returns no failures at all; that a report cannot show a step whose check was loosened.

**How bad if true.** Stops a tranche, without limit. Or silently spoils the result and misleads you: a round that was made clean, not found clean.

**The answer.**
- Claude decided: "a round with no failures" is defined once. The walk's list of failures is empty, and no step that was walked in the previous round is left unwalked. Under that meaning the rounds of 5 and 8 Nov were not clean, and the sentence about 8 Nov is rewritten to say that every step was marked ok while 63 failures were listed.
- Corrected in the third draft: it says plainly that no Process3 round was ever clean and that nothing limits the number of rounds. Only your word ends a tranche that will not come clean, with the failures named. This is listed as a risk.
- NO ANSWER FOUND, carried as an unproven risk: sessions write, change and count the walk's steps, and a loosened step cannot be seen. Any stop on that would be a new check.
- Not answered: the reviewer asked for one measurement before the process is in force (walk one unchanged build three times and count the steps that differ), saying that without it nobody knows whether a clean round can be reached at all. The memo does not take it up. Nor does it say what sets the size of a tranche.

### 2. "Correct or remove only" forbids the result and leaves the cause, and the line it draws cannot be drawn

**The counter-argument.** Sessions added checks in Process3 because their instructions said every fault must be fixed and a fix is something built. The second draft keeps that duty and adds one sentence about the form of the fix. The line between correcting and adding cannot be drawn without someone judging each change, which would be a review.

**What it rests on.** Measured: of 121 changes that added a check, 46 (38%) answered a failure of the process's own earlier machinery, and 36 arrived inside something already called a feature or a fix. Checks were added in 41% of merges both before and after 5 Nov. The one limit that held all week was a hard size limit on each role's starting text, while code with no limit grew sixteen times. No case was found of a session removing, unprompted, a merged check because it misfired. Reasoning only, on measured cases: that the line cannot be drawn; that a small new process will mostly meet faults where something is missing, for which the rule offers no fix at all.

**How bad if true.** Without a physical stop, repeats Process3. With one, stops a tranche on any fault that has no corrective fix.

**The answer.**
- Restored from your documents: two sentences your Foundations carry, "caution is a cost, paid only against a measured failure or your word" and "the default answer to a finding with nothing measured behind it is no change". Claude decided what follows from them: a process fault that stops no work may be answered with "no change"; nobody has a duty to build something for every fault; only a fault that stops work must be fixed; a fix session's work is done when the stopped job runs again, not when its change merges. The fix session's rulebook carries these sentences. They are rules in words.
- Corrected in the third draft: the claim that the rule on process fixes "now does its work" goes. That rule covers tests, gates, reviews and stops only. Records, rules, alarms and duties are held back only by the two sentences above.
- Claude decided: a module's tests and the walk's steps are product work. Each exists only to prove a product requirement, which it names, and adding one to prove a requirement is not adding a test to the process. A test or step that serves the process (records, formats, bookkeeping) is not allowed. This is a rule in words only; Process3 had 211 such files.
- NO ANSWER FOUND, carried as an unproven risk: the line between correcting and adding cannot always be drawn, and a real hole in a small process may have no corrective fix. The third draft gives the reviewer's three hard cases from Process3: two merges that each pass alone and together leave the tranche branch failing; an internal walk blind to a whole class of fault; a finished job that went unnoticed for 194 minutes.

### 3. GitHub's required test run must report on changes that touch no module

**The counter-argument.** The second draft says test one runs when a job's change touches its module's files. GitHub's rule needs a result on every proposed change, including your own commit of your approvals and ARCH's edits to the module list. A required check that never reports blocks the change for ever.

**What it rests on.** Measured: your own approvals commit in Process3 went through a proposed change that waited for the check before you merged it. A platform document: GitHub's statement, as an earlier reviewer recorded it, that a required check which never reports blocks.

**How bad if true.** Stops the first hour: it stops your first commit if it is missed.

**The answer.** NO ANSWER FOUND in the memo for your approvals commit or for ARCH's edits to the module list. For the tranche's merge into the main branch only, Claude decided that none of the three tests runs there (entry 29). The reviewer's own remedy is wording: say what the required run reports on such a change. What the third draft will say is not settled.

### 4. A product that fails when deployed reaches the main branch by design

**The counter-argument.** On the one day Process3 could compare them, the internal walk had every step marked passing and the deployed product passed 20 steps of 175. Under the second draft that build goes to the main branch, and "merged to the main branch" is the definition's own word for working product.

