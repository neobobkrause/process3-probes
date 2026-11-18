# Process4: definition, sixth draft

15 Nov 2026. For Bob, the owner. Written by Claude.

**How to read this.** Plain words, no reference codes. Nothing here is in force. Section B lists your decisions: the words you typed on 14 and 15 Nov, then the session's record of 13 and 14 Nov. Section N says what is not yet settled, section O what is not proven, and section P what is still open with you. Four words are kept apart. *Measured*: counted in Process3's record or on today's code. *Estimated*: worked out from measured figures. *Judged*: an opinion, Claude's or an AI worker's. *Unproven*: never run.

**Whose decision each thing is.** A thing is called yours only if it is in section B (the record is cited as "line 6" and so on), is an answer stored in your ledger, or is quoted from you with its source. Your typed words outrank the session's record wherever they differ. "Claude decided" marks a technical matter you did not define, or one you left to Claude on 14 or 15 Nov; you can overrule any. Where a matter was a proposal in the fourth draft, this draft gives the proposal in one sentence and then your answer exactly as you typed it.

**What changed since the fifth draft.** Section B now also holds your fifth and sixth messages of 14 Nov, the messages you typed to the session that studied the notification, and your two messages of 15 Nov, each exactly as typed. Four of your short answers that the fifth draft wrote out as longer statements are now quoted exactly, with Claude's reading marked as Claude's. Section F, on the notification, is rewritten from your words to that session and of 15 Nov; your rule for how module tests are written is in section E. Lanes are filled in from your documents in section C, as a proposal waiting for your answers; the fifth draft's "ARCH defines lanes" was Claude's error and is corrected. Claude has withdrawn the request that you make the tranche branch the default branch, and has corrected what the fifth draft said about ROOT's start on 5 Nov (section I). The sentence "Only your word ends a tranche that will not come clean" was Claude's, unmarked, and is gone: that case is undefined and is yours to decide. The statement about where the screens and journeys are is corrected; the fifth draft's "Checked by Claude" there was not true. Section C again names the session that deploys, prepares a release and moves a product to a changed process, as your Foundations do. Section I says how the process reaches a session, as lines you kept in your ledger say. The fifth draft was wrong to say the set-up check ended on your instruction of 9 Nov. The 33 lines of yours that the fifth draft ended without asking you are now "proposed for ending", not ended, and are put to you as seven proposals in section P. Section P now lists every question open with you. A few smaller errors of fact and of whose words are whose are corrected where they stood.

## A. What Process4 is for

Process4 is the way AI sessions build a software product for you in a GitHub repository, and can do so with nobody watching. Its one output is product behaviour that meets its requirements, merged to the main branch quickly and cheaply, and still there later. Following your words of 14 Nov, a tranche reaches the main branch only after the three tests: its modules' tests, an internal walk, and an external walk of a development deployment. No walk of either kind finished without flaws in Process3 (measured), so that ending is unproven (section D). You define the product: its purpose, audiences, requirements, principles and broad design. The AI decides everything technical and tells you in plain words what it decided.

**Words used here**

- **Session:** one running AI conversation in Claude Code's cloud.
- **Pull request:** a proposed change to a repository, which GitHub can test and then merge. A draft pull request is one not yet offered for merging.
- **Module:** one part of the product, with its own code files, tests and requirements file. The product is one ordered list of modules, and a module may use only modules before it. A module that uses another is that module's user; the one used is the provider. Today's list of 220 does not fully fit this: seven modules with work hold no code, four are new and have no files, and about 50 code files belong to no module (measured). ARCH edits the list until it fits.
- **Job:** one session's work on one module, delivered as one pull request.
- **Slot:** room for one job to run. Eight by default, counted across the account.
- **Tranche:** one batch of product work, built on the tranche branch, apart from the main branch, and reaching the main branch only as a whole.
- **Round:** one pass within a tranche: jobs, then the internal walk, then, if that finds no flaws, a deployment and the external walk.
- **Internal walk:** in your words, it "uses the UX Screens document to confirm that the workflow matches the definition". It is made on the product as built, without deploying it.
- **External walk:** in your words, it "follows the UX journeys to confirm that all journeys can be completed successfully to produce proper results". It is made on a development deployment: the product put on a development site in its own Cloudflare account, reaching no one else.
- **Mechanical edit:** one change that touches many modules in the same trivial way and needs no judgment. Your example: "a word table change".

## B. Your decisions

### Your own typed words of 14 Nov: the second message

Exactly as typed. The working rules of your first message are quoted where used.

- On the trial repository: "The throwaway repo that you need already exists: process3-probes."
- On the tranche: "A tranche ends after a successful external walk of a development deployment. So a deployment is a step in a tranche. But if flaws are found during an external walk those flaws are added to the next round, not the next tranche. So a tranche only ends when an external walk (of a development deployment) completes without flaws. A release can (optionally) be started after a tranche completes. So a release is always fully tested and walked successfully."
- On tests: "Yes, a job writes its own tests. That's an important responsibility. It's also a challenge because tests must be complete yet fast and efficient."
- On the walks: your two sentences defining the internal walk and the external walk, quoted in section A.
- On Process3: "Process3 never finished a tranche because it kept adding test after test so that it stopped making progress before it could finish."
- On changing the process: the paragraph that begins "Lets be clear about how the process is changed (and how it's not changed)", quoted in full in section H.
- "You can create a subtree in the process3 repo for the container being used to update to process4."

### Your own typed words of 14 Nov: the third and fourth messages, on the fourth draft

Exactly as typed.

- On the three tests: the passage that begins "Process4 does have 3 tests", quoted in full at the head of section E. *This corrects* line 5 of the record, which listed the notification as the second test and the internal walk alone as the third.
- On more tests: the passage that ends "There is no need to any any more tests. PERIOD!", quoted in full at the head of section E. *This settles* the fourth draft's passage on the line between correcting the process and adding to it, which is removed. It agrees with line 20.
- A question to Claude: "Explain why using the current criteria 5 of the 241 changes that AI workers judged real would have been missed. What was different in those 5 modules?" The fifth draft answered it as far as the record went. Section F is now rewritten from your later words, and that answer is no longer carried in this draft.
- On telling users of every change: the paragraph that begins "If every user is told when the implementation of a module changes but the interface doesn't", quoted in section F. *This sets aside* the fourth draft's proposals 1 and 3. Lines 3, 10 and 11 stand as recorded. How users are told is now set by your later words to the study session and of 15 Nov (section F). What a told job does (line 10) is still open (section F). Line 11 stands as recorded beside your words of 15 Nov that there is "no means to reliably tell the difference" (section F).
- On the repository: the two sentences that begin "The process3 repo is public", quoted in full in section M. *This settles* where the Process4 work is kept.
- On the fourth draft's list of things not yet settled: "Many of the questions asked in section M of v4 are technical and highly detailed. You're better qualified than I am to answer many of these questions." You added eight hints, one of them a question. Each is quoted where it is used (sections D, E, H, I and J), and the rest are marked "Claude decided".

- Your fourth message, complete: "screens and journeys are kept in docs/development/ux-substrate/ in the product repo". *This settles* where the two documents the walks use are kept (section D).

Your answers to the fourth draft's thirteen proposals:

| Proposal in the fourth draft | Your answer, exactly | What it settles |
| --- | --- | --- |
| 1. When the notice is sent | "We need to study this further" | Not approved. Since settled by your words to the study session and of 15 Nov (section F) |
| 2. Another module's tests run when a job's edit strays into it | "A job for module A isn't allowed to change module B. The only other way of editing a module is when a mechanical edit (like a word table change) makes the change." | Proposal removed. Agrees with lines 14 and 19 |
| 3. What a notified job does | "needs to be studied further." | Not approved. Line 10 stands; still open, not yet studied (section F) |
| 4. The two walks counted as one test | "internal and external walks a separate tests." | Two tests. Corrects lines 5 and 6 |
| 5. Tests for the process's own tool | "agreed" | Settled (section E) |
| 6. Who takes a free slot | "agreed" | Settled: how lines 3 and 8 are read together (section D) |
| 7. No watcher beside ROOT | "are you certain that the watcher isn't needed?" | Claude is not certain. Proposal withdrawn; the note in your ledger stands (section C) |
| 8. Eight slots for each product | "across the account" | Line 9 is counted across the account (section D) |
| 9. A helper never reviews | "agreed" | Settled; ends one use in a ledger line you kept (section C) |
| 10. What "without flaws" means | "agreed" | Settled (section D) |
| 11. The first trial uses made-up modules | "agreed" | Settled (section O) |
| 12. Three acts of yours beyond settings changes | "agreed" | Settled; adds to line 1 (section C) |
| 13. Checks ended because there are three tests | "three tests and no others" | Claude reads your answer as ending the checks listed in section K, whatever your ledger still shows. Say if you meant otherwise |

**Which recorded lines your second message changed,** as the fourth draft set out: your words on the tranche and the walks change lines 5 and 6; your words on changing the process change lines 1 and 2 and put line 20 in your hands (section H).

### Your own typed words of 14 Nov: the fifth and sixth messages

Exactly as typed. In your fifth message the numbers 1 to 3 answer the three readings that the fifth draft put to you in its last section.

| Your words, exactly | What it settles |
| --- | --- |
| "1. A tranche can end without an AI enabled run" | The external walk that ends a tranche may be made with no AI account connected (section D) |
| "2. installer and website are outside the tranche" | Updating the installer and the website is not part of a tranche (section K) |
| "3. installer and site updates wait for a clean development release walk" | The installer and the website are updated only after a clean development release walk. Whether that is the walk that ends the tranche or a further walk is still open with you (section P) |
| "We'll use a different session then. Give me what I need to start it and task it." | A request: the separate session on the notification. It has reported (section F) |
| "Meanwhile, perhaps this is a good time to repeat the full audit of process4 as currently defined, including a counter-argument audit. This will give a clearer look at that shape the design is in and provide a map where the focus is still needed." | A request: the second full audit. It was made, and the corrections in this draft come from it |
