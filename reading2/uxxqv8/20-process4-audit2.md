
**Why it matters to you.** In Process3 sessions made 270 of 296 process changes (measured). And your approval at PROCESS is written down by the session whose change is being approved.

**The options.** (a) Words only, as now: no new act; the risk stays. (b) The auditor's suggestion (drift audit): the branch of the process's repository that products use can be updated only by you, and your merge on GitHub's website is the approval. One act of yours for each approved change. Never measured; needs a trial. (c) With either, you commit new approvals there saying a change is merged only on your word at PROCESS. None of these stops growth in the product's repository (question 8). Also yours to confirm: who moves a product to a changed process once you approve. The draft forbids the product's sessions to do it, and nobody is named.

### 4. What a session building the product does while a process fault waits for you

**What it is.** You wrote on 14 Nov: "Because updates require my involvement and I might be away from my computer for extended periods". The draft says no session building a product "fixes it or works round it". "Works round" is Claude's wording. The post-mortem review of Process3, a session's report, said the opposite: "A process flaw found mid-tranche gets one line in a log and a workaround." The draft does not say what waiting sessions do.

**Why it matters to you.** The first tranche runs on a tool not yet built, so such faults are the expected case in its first hours (judged). In Process3 one question carried as yours waited about nine hours (measured).

**The options.** (a) Wait and nothing else: the stopped job says so in one line and stops; work the fault does not touch goes on. Cost: idle hours while you are away, and (judged) pressure to put a fix into the product instead. (b) A session may do by hand, once, what the tool failed to do, write one line, and change no file of the process. Cost: a session judges what "by hand, once" covers. The audit does not choose.

### 5. How new work enters a module

**What it is.** You wrote on 14 Nov: "A job for module A isn't allowed to change module B. The only other way of editing a module is when a mechanical edit (like a word table change) makes the change." A module's requirements file is part of the module. So, as worded, nobody but its own job may write a new requirement into it. In Process3 the architecture session wrote requirements (measured).

**Why it matters to you.** The first requirement that crosses from one module to another has no route (judged: stops a tranche).

**The options.** (a) ARCH writes requirements and their marks, and that is not "editing a module" in your sense. (b) Requirements reach a module only through its own job, with ARCH handing over the text: a job start for each.

### 6. Which governs where your Ledger and Foundations say the opposite of the definition

**What it is.** The definition ends or cuts 75 of your lines. Your stored Ledger still says "keep" or "modify" for 38 of them, and your Foundations still state the other 37. The definition does not say that it governs.

**Why it matters to you.** Role texts will be written from one or the other. In Process3 a session brought back a removed check by citing Ledger lines (measured).

**The options** (both the auditor's suggestion, requirements audit). (a) One sentence: where they differ, the definition is followed from the day you accept it, and the Ledger and Foundations are kept as the record of what you decided before 13 Nov. (b) Both are retired as documents sessions read. Either way the 53 kept lines the definition states nowhere must first be put back into it (Claude's work).

### 7. Whether a release has a further walk

**What it is.** Your statements; the audits do not choose between them.

- 14 Nov: "A release can (optionally) be started after a tranche completes. So a release is always fully tested and walked successfully."
- 14 Nov: "A tranche can end without an AI enabled run"; "installer and website are outside the tranche"; "installer and site updates wait for a clean development release walk".
- 9 Nov, as Process3's decision record quotes you: "Yes, the installer update and site update wait until a release walk with AI on is also clean."
- 14 Nov, the external walk "follows the UX journeys to confirm that all journeys can be completed successfully to produce proper results."

The draft reads "development release walk" as the walk that ends the tranche, never says what a development release is, and did not show you the 9 Nov sentence. Measured: three journeys in the folder's script begin at the installer or the website, and about nine need the assistant.

**Why it matters to you.** It is what "released" means. Five earlier releases each broke existing stored data, unseen because every test began from a fresh copy (measured).

**The options.** (a) The release waits only for the walk that ended the tranche: the installer, an upgrade and the AI journeys go out unwalked. (b) A development release is cut and walked, with the installer and with AI on, before the installer and website are updated. The drift audit judges this an external walk of another deployment, not a new kind of test. Cost: one more deployment and walk for each release, and an AI account connected by you. Either way a development deployment cannot complete the journeys that begin at the installer or the website.

### 8. What "no more tests" bounds inside the product's own tests and walk steps

**What it is.** You wrote on 14 Nov: "There is no need to any any more tests. PERIOD!" and "Process3 never finished a tranche because it kept adding test after test so that it stopped making progress before it could finish." The draft, as Claude's decision, allows any number of module tests and walk steps so long as each names a product requirement. Sessions also write the requirement lines.

**Why it matters to you.** The draft holds the process's repository still and leaves the product's open; growth can go there without waiting for you (judged). The walk's steps went from 238 to 357 inside one round of Process3 (measured).

**The options.** (a) Three kinds of test with no limit on their number, as the draft has it: the risk stays, held by text. (b) The walks' steps are held to your screens and journeys documents: depends on question 1, and a step the documents lack cannot be added without changing them.

### 9. What protects your approvals, and the stop at each edit of them

**What it is.** Two statements meet. Yours, 14 Nov: "three tests and no others". The record of your decisions of 13 Nov, written by a session: "Process3's permission management is preserved." On the first, the draft ends the guard that stopped a session's proposed change from altering your approvals. On the second, it keeps the comparison that stops every long-lived session when you edit them.

**Why it matters to you.** With the guard gone, the permission checker alone protects your approvals. It refused such an edit 2 times of 2, and elsewhere passed and refused the same act minutes apart (both measured). A line you kept in your Ledger says: "The classifier is defence in depth, never the policy." (The classifier is the permission checker.) The comparison stopped everything at each of your five edits in Process3, and after the last the product never restarted (measured).

**The options.** The comparison: keep it, with a full stop and restart at each edit; or remove it, so that only sessions started after your edit load the new text (the auditor's suggestion, run and drift audits) and old and new approvals are in use together for a time. The protection: accept the checker alone; or a GitHub setting so that only your account can change the two files. That setting is unproven, and it works by requiring your approval on a change, which you may count as a gate. If you do, no answer was found.

### 10. The reversal of your kept line that a job never commits a built file

**What it is.** A line in your Ledger that you marked "keep" on 31 Oct reads: "A job never commits a generated artifact." The draft, under "Claude decided", has each job build and commit its module's built files, and does not name the line it reverses.

**Why it matters to you.** With eight jobs at once, a built file holding many modules' code is rebuilt by every job that touches any of them. Either jobs collide on it at every merge, or the copy in git is stale and the external walk walks old code (judged).

**The options.** (a) Built files are not committed; the deployment step builds them, as Process3's did (the auditor's suggestion, drift audit). This keeps your line. (b) The reversal stands, as a change to a line you kept and yours to approve.

### 11. The lines Claude ended without putting them to you

**What it is.** Three statements of yours, all 14 Nov. "When you change something I defined you need to describe the PROPOSED change in words I understand so that I know what you're proposing and whether to approve the change or not." "Decide technical matters yourself and tell me what you decided." "You're better qualified than I am to answer many of these questions." The draft used the first for thirteen proposals, and the other two to end or cut 33 more of your lines, "listed for you to overrule". The audits do not choose which statement covers them. The draft's sentence "No proposal is waiting for your yes or no" was wrong.

**Why it matters to you.** A list of decided things you must act to reverse is how Process3's approval page worked (measured: 151 of 159 drafted lines accepted).

**The groups, for a yes (it ends) or no (it is restored) each.**
1. *The condition for coming into force, and one of your two judges of the process.* Your Foundations: "Nothing here is in force until it has run on a real tranche with the two health metrics measured." The draft ends the first number (false "done" claims caught by a second look), so that sentence can no longer be met as written.
2. *Three measurements your Ledger asked for,* ended unmeasured: an architecture session that keeps no memory between wakes; trimming each role's principles line by line; the share of ARCH's work that is passing things on.
3. *Two standing duties from your Foundations,* ended on your words "three tests and no others" (14 Nov) though they test the process, not the product: counting refused acts and trying them again at each tranche's opening and each model release; and removing parts of the process one at a time at each model release. The second is the only standing force for removal in your documents (drift audit). The same words were not used to end the tool's own tests or the comparison in question 9.
4. *Ten endings made "on the evidence":* the job's written receipt of its commands; the set-up check before every job start; the size cap on a module's requirements file; recording each job's reading list and cost, with the cost alarm; the check on oversized files; the job record as a strictly formatted file; the rule that every rule cite a measured failure or your decision; the line-by-line test of instruction files; "nothing is ever refused for size", for the process's own texts; the reading audit.
5. *Older lines that had sessions repair the process themselves,* which your words on PROCESS replace and the draft leaves unmentioned: one has ARCH restate a rule and report it to you in one line; another has a fix that stops nothing wait for the next process release.
6. *Moving the requirements of 29 modules that hold no code "as a mechanical edit",* on ARCH's judgment of which module's code meets each. By your example a mechanical edit needs no judgment. The auditor's suggestion (requirements audit): each receiving module's own job takes them in, and you are asked whether any of the 29 is a product matter.

