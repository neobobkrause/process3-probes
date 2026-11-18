# [file] v4_notes.md (continued)

6. **The UX Screens document and the UX journeys.** I used his names and did not find files with those names in the product clone (file names only, branch origin/tranche: there are screens-* job files and a journey-check job, no file called UX Screens). M item 7 lists how walkers read them as not yet settled.
7. **Point 6(a).** The task's wording (equal job times, 65 modules, about 177 jobs, about 100) is from attack_feasibility.md lines 125 to 140. That simulation sent a notice on every change. The draft adds one sentence that under his own definition (a notice only when the interface changed) there would be fewer, by an amount not worked out. That sentence is mine.
8. **The simulation's 59% to 71% shares** (attack_corruption.md) are no longer in the draft, to avoid a second "71%" beside the one he asked about.
9. **Nothing physical stops a product session changing the process.** Written as a risk with no trial (N), with his own sentence from the first message. I did not write in the lever from enforcement_levers.md (the sessions' account holding no write access to the process's repository), because PROCESS itself would work under that account and the task did not ask for a mechanism. The main session may want it under "not yet settled".
10. **One trial re-added from v3** (group 3, item 22): "one comparison from git, once, when the tranche ends", reworded as whether the process stayed as he approved it. It is in v3; say if it should go.
11. **Proposal 5** says the tool's tests "cannot stop a product job". That is the proposal's own term, not a measured fact.

## 4. New or changed figures, with source and kind

| Figure | Where | Source | Kind |
| --- | --- | --- | --- |
| 270 of 296 process changes made by sessions | N | enforcement_levers.md line 31 | measured |
| 116 version moves in nine days | N | as v3 | measured |
| 0 of 3,029 import statements undeclared in source | E | replay/results.md line 74 | measured |
| 122 pairs; 36 to a later module; 86 to an earlier one | E | results.md line 74; 86 is 122 less 36 | measured by a pattern search |
| 504 merges; 360; 167, "about a third" | E | results.md lines 97 to 101, 118 | measured by script |
| 236 of 241 (four parts); 175 (names and public requirements only) | E, N, O1 | results.md lines 146, 148 | measured on this record |
| 169; 64, 1, 2; 5 | O3 | results.md lines 209 to 223 | 169 and 5 measured; the rest one reader's judgment |
| 65 modules, about 177 jobs, about 100 | E, N | attack_feasibility.md line 138 | estimated |
| 2,342; 241; 2,101 | E | results.md line 36 | measured; verdicts are judgments |
| 285 of 776 commits were review fixes | O9 | change_sample.md line 33 | measured |
| 41,777 test lines in nine days | O5 | enforcement_levers.md table row 4 | measured |
| 8 KB to 134 KB | O5, K8 | as v3 | measured |
| 238 to 357 steps inside one round; 63 failures with every step ok | D, O10 | attack_corruption.md lines 49 to 57 | measured |
| about nine hours | G | attack_corruption.md line 165 | measured |
| both takeovers left no watcher, new ROOT one level deeper | O7 | roles_root_coordinator.md lines 134, 244 | measured |

## 5. Re-read against his standing rules: what I found and fixed

- Plain words: "signature" became "the way it is called"; "pattern scan" became "a script that searches today's code"; "fixture" is explained at first use; "refactoring" (his recorded word) is explained once; "registration" removed; no ids or codes (searched).
- Only his words count as his: every passage in the typed-words list and the PROCESS paragraph was checked by script as an exact substring of bob_words_14nov_b.md. A heading that put "All journeys." in quotation marks with a capital was changed, since his text has "all journeys". "By your words of 14 Nov, what reaches the main branch has passed ..." was a paraphrase put as his; now "Following your words of 14 Nov ...". The period inside the quotation of line 5's first test was moved outside.
- No assurance: "Now it is you who sees every proposed change" became "Now every proposed change is put to you"; the AI-journeys reading is marked as Claude's reading.
- Proven and unproven apart: kind added to figures that lacked one; the 122 is marked as measured by a search; the example pair is marked as from the record.
- No tests, gates, reviews or checks added: none added by this draft. Proposals 2, 5 and 10 each widen or add a condition; each was a "Claude decided" in v3 and is now put to him, and proposals 2 and 10 say in their own text that they widen or add.


# [file] process4_lanes.md

# Process4: lanes, filled in from your documents

14 Nov 2026. For Bob, from Claude. A proposed section for the sixth draft. Nothing here is in force, nothing here is your decision until you say so, and nothing here has run in Process4.

You wrote on 14 Nov: "Lanes are an important element of the development process, though they haven't been fill into the process4 design."

How this was made. One worker collected every statement about lanes in your documents and quoted each exactly. A second worker read what Process3 actually built and did with lanes. I then read the two passages that matter most myself: the lanes paragraph in your approvals in the product's repository, and the lanes paragraphs in the later copy of your Foundations. This document starts from those statements. Where I had to decide something technical, it is marked *Claude decided*. Where your documents disagree with each other, I have not chosen for you; those are in section 3.

Words used. A **session** is one running Claude conversation. **ARCH** is the session that directs the building of one product; your documents of October and early November call it BOB. **ROOT** is the first session you start. A **job** is a session that builds one module.

---

## 1. What your documents say

In order of date. For each I say whose words they are.

**31 Oct, your note in your Keep and Drop Ledger** (a session's suggestion to which you added words): "a lane is a knowledge directory and design responsibility plus an on-demand worker BOB starts with that directory as its reading set; a long-lived lane only where measured worthwhile. The lifecycle of a lane includes refreshes that BOB manages to keep the session depth consistant."

**3 Nov, a line of your Ledger you marked "modify":** "A lane has one area of focus, reads it whole and delivers designs, never product code; jobs and lanes reach a lane only through BOB".

**Your Foundations** (written by a session from your Ledger): "Lanes are ad hoc. You identify the need for a lane and BOB opens it; some stay open for extended periods; the UX lane is always there, as a directory and a design responsibility; whether any lane runs as a long-lived session is measured". "Lanes work because BOB knows how to delegate: it recognises a design question, passes it to the lane with enough context to decide, waits for the lane's decision, and keeps the final say." "Requests between jobs and lanes pass through BOB ... Spokes never see each other." "BOB is the only creator of jobs and lanes".

**5 Nov, Process3's log, a session quoting you:**
- "there should only be ONE session per lane at a time."
- "I'm not sure we should say that a lane is a read-only helper. For example, it writes and updates design documents (like the UX Design doc). The UX design lane can create the word table".
- "the modules that use the word table have already passed their suites - they don't need to be retested. And the lane-specific documents, like the UX Design doc, doesn't need to be tested. So again, I don't believe that lanes' file changes need to be tested the way jobs do."
- "It's worth noting design documents that lanes create/update/interact with me using are CC artifacts. So they don't need to be checked in."

**5 Nov, your approvals in the product's repository** (committed by your account; the wording was handed to you by a session): "Design lanes, run under BOB, own their lane folders, the design stream (docs/development/ux-substrate) included, and each lane runs as one session at a time. Within the product's principles they decide design and wording there. Their design documents are claude.ai artifacts, not repository files. A pull request that changes only files in its own lane's folder lands through the merge tool without a test suite run, and the large files a lane's generators build are built at layer close, deploy and release, never committed."

**6 Nov, the later copy of your Foundations, quoting you:**
- "The important thing to remember when setting up lanes is the insure that a lane is fully qualified to fulfill their role as the load-bearing source of truth in their area".
- "So The first time a lane is defined and run, it should start by using workers to fully research canon documents, existing code, and best practices related to their specialty area".
- "This initial and ongoing research should be recording in a lane-specific area of the product repo for subsequent sessions to draw from and evolve".
- "The lane charters used in earlier process versions included an investigation design lane and a publication design lane. Perhaps that's an appropriate partition to continue to use".
- "These requirements related to lane startup and ongoing operations should be part of the process3 canon of requirements".

**6 Nov, the same copy, a session's wording, to which the record says you answered "keep":** "A process triage lane and a product triage lane study each identified problem and bring you options with context before a response is chosen".

**6 Nov, the product's decision record, a session's wording to which the record says you answered "agreed":** you keep the product's UX direction, its audiences and its principles; beneath them the UX lane decides screens, flows, words, layout and visual language; a decision that would change a direction, an audience or a principle comes to you with options and the lane's recommendation.

**6 Nov, your answer on the second Keep and Drop page, as a session recorded it:** "BOB starts jobs and lanes, not ROOT".

**14 Nov, typed by you:** "Process changes only happen in a separate process lane call PROCESS that I interact with." "M1: ROOT" (who starts PROCESS). "ARCH can ask ROOT to start PROCESS if it isn't already running, and the coordinator can talk to PROCESS." "screens and journeys are kept in docs/development/ux-substrate/ in the product repo".

---

## 2. Lanes, as the definition would state them

Each sentence is from the statements above unless marked *Claude decided*.

**What a lane is.** A lane is a standing design responsibility for one area of a product. It has a folder of design knowledge in the product's repository, which it owns. It reads its area whole. It delivers designs, never product code. It is the source of truth in its area, and it is qualified for that before it decides anything.

**Which lanes.** You identify the need for a lane, and ARCH opens it. The UX lane is always there. For Civicsmith the lanes are UX, investigation design and publication design. PROCESS is a lane of a different kind; see below.

**One session.** A lane runs as one session at a time. Whether a lane's session is kept running or is started when a question arrives is ARCH's call, judged by cost, and is one of the measurements your Foundations set for the end of the first tranche. That measurement was never taken in Process3. A long-running lane session is replaced by a fresh one under ARCH's management.

**Qualification.** The first time a lane runs, it uses workers to research the product's founding documents, the existing code and the best practice of its area, and it answers no question until that research is recorded. The research is kept in the lane's own area of the product's repository. Every later session of the lane reads it first, draws on it and adds to it.
