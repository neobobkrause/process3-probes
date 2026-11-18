# [file] attack_feasibility.md (continued)

- Measured (`foundations.md`, platform table). "the in-session background limit is about thirty minutes, so anything longer is CI". The two late external walks took 60 and 64 minutes (product_side 6).
- Measured (definition). On 8 Nov the internal walk passed every step while the external walk of the same build passed 20 of 175.
- Reasoning. One reinserted break can show the walk misses it. It cannot show the walk "finds what a full regression would"; no full regression was run in Process3 to compare with. The trial can break the claim and cannot support it, which the definition admits for item 8 but not for item 11. Where a walking session runs an hour-long walk against the 30-minute limit is not said; I did not establish where Process3 ran it.

**How bad.** Stalls the end of the first round; misleads Bob about what trial 11 can show.

**Answer.** Wording and a trial. Name ARCH as the one that assigns each finding to a module. Add "several sessions share one walk by journey" to section J with one rehearsal. Reword J11 to say the trial can only break the claim.

Sources: process3 README and deploy.mjs; DECISIONS PD-11, PD-16; foundations platform table.

---

### 15. Bob's suggested model and effort do not reach the jobs

**Counter-argument.** ROOT does not start jobs; ARCH does. Effort is not inherited.

**Attacks.**
- "**Model and effort for each session.** *Decided:* ROOT passes your suggestion to every session it starts."

**Evidence.**
- Platform text (tool definition of `create_session`, today): "Effort level for the new session; not inherited from this session"; model "Defaults to the calling session's model".
- Measured (`permissions_inventory.md` 1c). "Effort per role. Not set anywhere in the tool"; the start table's effort column "never built".

**How bad.** Misleads Bob: he suggests an effort and jobs run on the default.

**Answer.** Wording: every session passes the suggestion on to each session it starts. Unproven; one line in trial J2 (read the job's reported effort).

Sources: permissions_inventory 1c, "What was surprising" item 6.

---

### 16. Smaller gaps and contradictions in the text

Each is wording unless said otherwise.

| # | Gap | Sentences | Evidence | How bad |
| --- | --- | --- | --- | --- |
| a | Bob's answer on ROOT's repository is recorded two ways. 13 Nov: "You start a session with the process repository mounted." 14 Nov: "ROOT starts with the product repository". The definition uses the second and does not show Bob the first. | "You start it on the product's repository." | Measured: `assessment_doc.txt` lines 91 and 99 | Misleads Bob. Answer: show him both and ask which is his. |
| b | Design lanes are kept but are not in the list of roles: who starts them, whether they take a slot, whether Bob talks to them. | "Design lanes, with user experience always there." against section B's six roles and "Kept short." | Measured: roles 1.1 ("lanes ... started by BOB"); approvals lanes paragraph | Costs time |
| c | The required test run must report on pull requests that change no module: Bob's own approvals commits (PR 1115 was his, merged by him after the check), ARCH's edits to the module list, the tranche into main. | "*Trigger:* a job's pull request changes its module's files or tests." | Measured: product history, PR 1115. Platform text: a required check that never reports blocks for ever (redteam_feasibility finding 4, GitHub documentation) | Stops Bob's first commit if missed |
| d | Bob's commit to `CLAUDE.md` is an edit, a pull request, a wait for the test run and a merge click, not one act. | "Commit your standing approvals ... on GitHub's website" | Measured: PR 1115 | Misleads Bob slightly |
| e | Two retired hooks still run before every shell command of every session in the product. Only Bob can delete them. Not on his list. | "Wording changes only you can make." | Measured: product `.claude/settings.json`; permissions_inventory 1b | Minor |
| f | "Two failed corrections" then replacement: who counts, and where, is not said. | "After two failed corrections ARCH replaces the session" | Reasoning | Minor |
| g | The tranche report has no author. Cost "where it can be read" was often unreadable. | "A tranche report: time, work done, cost, overhead" | Measured: definition I4 | Minor |
| h | Keeping the test run in two parts keeps a second part whose Process3 purpose was to post the row the merge tool checked, which has ended. | "*Claude decided:* keep it." | Measured: `process-gate.yml` job `post` | Minor |
| i | Test one includes "a check that the uses the module declares match what its code imports". If "code" includes tests, 202 imports fail on day one and 81 of them become later-pointing uses. If not, the 38 pairs stay invisible. | Section D, test 1 | Measured: interface_and_cycle 1a | Stops jobs in up to 63 modules, or leaves the hole; say which |
| j | Bob's relayed words are "followed". Followed by ARCH only while its instructions name the current coordinator session (finding 3). | "It passes your words on exactly as written, with the date, and they are followed." | Measured: permissions_inventory rows 26, 27. Platform text: `send_message` | Costs Bob time |

---

## Section J: what is missing, and which trials cannot settle their claim

**Claims the definition relies on that are not listed as unproven.**

1. The tranche merges into main on the product (finding 8).
2. ARCH can be replaced mid-tranche without losing the open jobs (findings 3, 4).
3. Working state held in job pull requests, and a status read-out computed from them, works (finding 3). Never run; Process3 used the state branch.
4. A standby can replace ROOT within the three-level rule (finding 9). The record says it cannot.
5. Finished sessions do not use up the account's live-session ceiling (finding 13).
6. Several sessions can share one walk by journey (finding 14).
7. A fix can be prepared and merged behind the wall (finding 10).
8. Bob's model and effort reach every session (finding 15).
9. The number of jobs a round takes under "tell every declared user" (finding 5). J4 and J5 test whether notices miss anything, not what they cost.
10. A public release walked "on a copy installed with the real installer". I found no run of it in what I read; the definition does not list it.

**Trials that cannot settle their claim.**

- **J4.** "require that all 241 real effects are reached". The 241 were found only among modules Process3 notified, and Process3 notified every declared user (`notice.mjs`, `usersOf`). Any rule that tells every declared user reaches all 241 by construction. The trial cannot fail, so it proves nothing about misses. The misses are outside the record: the 38 undeclared pairs and the dependences with no import. Listing them does not measure them.
- **J6.** Two slots and three modules, no failing run, no replacement: too small to show the waking problem of finding 4.
- **J10.** Tests a claim for which the definition gives no mechanism (finding 2).
- **J11.** One reinserted break can break the claim and cannot support it (finding 14).
- **J2.** Does not include the case that matters on day one: a ROOT started by Bob straight after an approvals commit (finding 2).

---

## Things I probed and did not find broken

- **Concurrent test runs on GitHub.** Eight slots at two machine-jobs per run is 16, inside the 20 a free account allows (levers 3.2, GitHub documentation as recorded there). The account's plan is not stated anywhere I read. No stop found.
- **Pull requests by the sessions' account triggering the tests.** Same repository, collaborator with write: this ran all week in Process3.
- **A dead job session.** Replacement on the same branch and pull request was built and used in Process3 (`job start --restart`). The definition says enough for this one.
- **The hourly alarm waking ROOT itself.** Measured eight of eight, and today's tool definition of `create_trigger` says the default "fires into THIS SESSION, resuming the same conversation each time". J7 is right to re-measure; I found nothing against it.
- **GitHub suspending the account again.** The likeliest cause recorded, 1,387 pushes to the state branch in 19 hours, goes away with the state branch. The cause was never established (review.txt), so this is hope, not proof. The definition's handling (one message to Bob) is enough.


# [file] v5_notes.md

# Notes on the fifth draft of the Process4 definition

14 Nov 2026. Written with `/home/user/handoff/process4_definition_v5.md` (62,224 bytes; the fourth draft is 62,593). Only these two files were written. No repository was changed and no session started. Files read besides the four named in the task: `/home/user/work/replay/results.md` (lines 136 to 235, for the five missed effects), a listing of `/home/user/work/notice_study`, and a search of `handoff/roles_root_coordinator.md` and `work/live_docs.md` for the watcher.

Section letters. A to D stay. The fourth draft's E is split: E "The three tests", F "The notification to user modules". Then old F = G, G = H, H = I, I = J, J = K, K = L, L = M, M = N, N = O. The proposals section (old O) is gone; no proposal remains. P is "Still open with you".

## 1. Where his third message conflicts with an earlier decision or kept line, and how it is written

| # | His words of the third message | What they conflict with | How the draft writes it |
| --- | --- | --- | --- |
| 1 | The notification "isn't a test"; the three tests are module tests, internal walk, external walk | Record line 5 (notification as second test, internal walk alone as third) and line 6 (external walk optional); the fourth draft's "the walk, in two forms" | His words followed. Said once in E ("This corrects the record of 13 Nov"), once in the B list, and a bracket after line 5 in the record. Every "one test in two forms" phrase removed (searched) |
| 2 | "There is no need to any any more tests. PERIOD!" | His own "agreed" to proposal 5 in the same message (tests for the process's own tool, the size limit among them) | Both kept. E states the proposal, his "agreed", and Claude's reading that the tool's tests test no product and never run on a product's work; "Say if you meant otherwise". Listed in P. **Flag**: this is the one place where two of his answers pull against each other |
| 3 | Same | The start-up comparison of his approvals: a check that can stop work, not one of the three tests and not in proposal 13's list | Kept as the fourth draft had it (L item 11, on Claude's reading of line 12), named in J as the one check beside the three tests. Not put to him again. **Flag** |
| 4 | Same | His "agreed" to proposal 10, which adds a condition to "without flaws" (no step left out that the walk before made) | Written as settled on his "agreed". Not presented as a conflict: it defines a word, it is not a test |
| 5 | Same | The fourth draft's "one comparison from git, once, when the tranche ends" (whether the process stayed as approved) | Removed from the list of what only a real tranche can show. v4_notes had already asked whether it should go; under his words it reads as a check. Say if it should come back |
| 6 | "three tests and no others" (answer to proposal 13) | His ledger, which still shows each of those checks as "keep"; and the third draft's "Claude decided" | K lists them under his decisions as ended "on your words of 14 Nov", with the consequence about the guard on his approvals block. J says the ledger is unchanged |
| 7 | "A job for module A isn't allowed to change module B..." | Agrees with lines 14 and 19. Conflicts with the fourth draft's "ARCH folds [modules with requirements and no code] back into the module whose code meets them" (ARCH editing modules' files) | C: ARCH decides where each goes and "the move is made as a mechanical edit". That wording is mine. Also: the 86 undeclared uses are "declared in the module list" by ARCH, as the task says; I did not check whether a declared use lives in the module list or in a file the module owns. If the latter, that too needs a mechanical edit |
| 8 | "are you certain that the watcher isn't needed?" | Proposal 7 | Withdrawn, in the words the task gave. The ledger note says the watcher is started "by whoever starts ROOT", and he starts ROOT, which would make it an act of his outside his list. From 5 Nov Process3 had ROOT start it (roles_root_coordinator.md line 132). Written as not yet settled (N item 4). **Flag**: this item is my addition to the not-yet-settled list |
| 9 | "across the account" | Line 17 ("the maximum slot count changes when you tell the coordinator session the new value": a coordinator is per product) and the shared state, which is in one product's repository and holds the slot number | N item 3, as the task directed |
| 10 | "ROOT" starts PROCESS | Line 22 names only ARCH and the coordinator as started by ROOT; ROOT holds the product's repository and PROCESS the process's, so this is a start across repositories | Written as his hint. Added to the trial list. I did not establish whether a start on another repository was measured in Process3 |
| 11 | "ROOT starts with the product repo, which contains the needed approvals in CLAUDE.md and settings.json" | Record line 16 ("the process repository mounted") against line 22 | His typed words settle it; said at the end of the record in B. The fourth draft's "ROOT's repository" item is dropped from the open list. His hint does not deal with the measured fault (a plain start came up on main with old approvals); the default-branch decision does, marked "Claude decided" and unproven |
| 12 | Same, with the default-branch decision | GitHub's rule that the tranche branch "takes a change only by pull request with its tests passing", against "your commits on GitHub's website ... land on it" | Not resolved. M keeps the fourth draft's sentence that the test run must report on pull requests that change no module, or his approvals commit cannot merge |
| 13 | "sessions" (who runs a walk) | The fourth draft: "a long walk has to run on GitHub's machines" (30 minutes against 60 and 64) | Sessions run both; the walk shared among sessions by journey; unproven |
| 14 | "You're better qualified than I am to answer many of these questions" | His second message: "When you change something I defined you need to describe the PROPOSED change" | The four Foundations duties (two ended, two kept) and the first health number are written as "By Claude's decision ... listed for you to overrule", as the task directed, not as proposals. **Flag**: the two ended duties are things his Foundations define |
| 15 | "You have my approval to add any and all information related to the process4 update to the repo." | His earlier sentence about a subtree, which the fourth draft asked him to confirm | M states the folder and branch named process4; one sentence says Claude reads the subtree as that folder. The question to him is dropped |
| 16 | His words on the tranche (second message) against 8 and 9 Nov | Unchanged from the fourth draft | The three readings are in P. In K the ending of "installer and website as part of ending a tranche" now says it rests on Claude's reading |

## 2. Short words of his, and the reading written

| His words | Reading written | Note |
| --- | --- | --- |
| "ROOT" | ROOT starts PROCESS | One word. I took it as the product's ROOT |
| "the processes" | The process's own repository | Marked in H as Claude's reading, with "Say if you meant something else". Other readings: a slip for "the process's"; or the repositories of both processes. Not said in the draft: today the Process4 work sits on a branch of the process3 repository |
| "sessions" | Sessions run the walk and the deployment step | The old item asked three things; the word is applied to the first two as the task directed. How walkers read the two documents is left to P |
| "same as in process3" | The way Process3 kept to GitHub's published limits is carried over unchanged | Marked as Claude's reading. I did not look up or describe what that way was |
| "I think it has to check tests too" | The uses check reads test files | "I think" is tentative; written as settled on his hint |
| "Can the mechanical edit do a single merge of all affected modules?" | A question, answered "yes" as the task gave, followed by what is unproven | "Claude's answer: yes" is followed at once by the unproven part, to stay inside "do not assure me" |
| The longer hint on channels | A job reports to ARCH; ARCH asks ROOT to start PROCESS; he talks to PROCESS; the coordinator can too | One sentence is mine and marked as Claude's reading: that the fault's description travels ARCH to coordinator to PROCESS |
| "across the account" | Eight counted across the account | Three words |
| "agreed" (six times) | Not expanded. Each is written as the proposal's statement and then: You answered "agreed" on 14 Nov | The one-sentence statements are my compressions of the fourth draft's proposals; for proposal 6 I wrote "read line 3 by line 8" because "the first by the second" was ambiguous in the new sentence order |
| "three tests and no others" | Yes to proposal 13: the listed checks end | He restated his rule and did not write "agreed"; the reading is the task's |
| "internal and external walks a separate tests." | Two separate tests | Quoted with his slip "a" |
| "We need to study this further" / "needs to be studied further." | Proposals 1 and 3 not approved; record lines 3, 10 and 11 stand | |
| "are you certain that the watcher isn't needed?" | A question, not a refusal; answered as the task gave | |
| "a word table change" | Quoted as his example of a mechanical edit | I do not know what a word table is in the product and did not explain it |
| "There is no need to any any more tests. PERIOD!" | Kept exactly, slip included (three places: E head, H, and named in B) | |
| "screens and journeys are kept in docs/development/ux-substrate/ in the product repo" (fourth message) | The UX Screens document and the UX journeys are kept in that folder of the product's repository | He wrote "screens and journeys", not the two document names of his second message; the draft joins them. The folder path is his own text and is left as typed |

## 3. Things I could not do, or did only in part

1. **Length.** 62,224 bytes against 62,593, and 10,985 words against 11,002: shorter by very little. The new material (third-message list and table in B, the settled items, the study section) took what the removed proposals section gave back. Cut to get there: the plain-words restatement of his PROCESS paragraph; the passage on correcting against adding; the 8 Nov quotation "This successive set of rounds continues..."; the history of 24, 20 and 8 sessions; the "standing judge" phrase; the paste-slip note on his ledger; the figures 20 of 175, "main has not moved since 1 Nov", "about 170 jobs", "half of the week's twenty recorded false done findings", "no measured evidence that the permission checker enforces a bare never", the 41,777 lines of tool tests, and "Process3's remedy was a helper that judged each notification first"; the bullet on a session recording its own summary as his (folded into the coordinator paragraph); old items 12 and 13 of the kept list merged into one; the count of the 288 lines.
2. **The three-tests quotation.** His text is a sentence ending "The 3 tests are" followed by a bulleted list. The one-line form in my instructions is not verbatim. The draft quotes the sentence, then gives the three list items each in its own quotation marks.
3. **"A study has been started."** I saw `/home/user/work/notice_study` (two scripts, empty data folders) and wrote the sentence as instructed. The draft does not say the study is a separate session; it says he suggested one.
4. **His question about the five of 241.** Not in my list of changes, but it is in his message. F answers it from results.md (line 146 names the five changes; line 157: "changes of behaviour with nothing nameable: a body-only change, or a value changed in a file no other module imports") and says the rest is among the study's first questions. I named the four modules (agent-drafts, agent-steps twice, ai-accounts, member-roster). The main session should check this against whatever the study has found.
5. **"By journey."** The task has the walk shared out by journey. He defines the internal walk by the UX Screens document, not by journeys. The draft says "by journey" for both; it may need "by screen" for the internal walk once the document is found.
6. **A walk of the release.** The fourth draft did not decide it. P item 3 now gives a reading ("Claude reads them to mean it has none, since the three tests end with the tranche's external walk") and its consequence. That reading is mine; change it to a bare question if preferred.
7. **The 288 lines** were not recounted; J says the appendix will be redone.
8. **"Held by the job's instructions and not by any check"** is said once, in C. To keep it to once, the old risk line "An edit that strays into another module's files is seen by no check" was removed from O.
9. **The tranche glossary line** now reads "built on the tranche branch, apart from the main branch", because the default-branch decision gives that branch one fixed name across tranches.
10. **His fourth message** (arrived while I was writing; appended to bob_words_14nov_c.md) is quoted in B and in D ("Where the walks' documents are"). The item "where the UX documents are" is removed from P; it was never in N. The sentence "Checked by Claude: the folder exists on the branch the product is built on, with a screens sub-folder and files describing journeys" is written on the main session's word; I touched no repository and did not check it myself.
11. **Not checked:** whether the trial needs the default-branch setting changed in process3-probes as well as in the product's repository. The trial's cost line says "one settings change".

## 4. Re-read against his standing rules: what I found and fixed

- Only his words count as his: every quoted string in the draft (about 160) was checked by script as an exact substring of bob_words_14nov_b.md, bob_words_14nov_c.md or the fourth draft. Found and fixed: a quotation with an ellipsis in it ("The 3 tests ... PERIOD!") in P, removed; the rule name "One of the four parts changed" stood in quotation marks as if quoted, now plain text; "Claude's answer is no" in the table could be read as "the watcher is not needed", now "Claude is not certain".
- Plain words: "default branch" explained at first use in I; "user" and "provider" added to the word list because his new words use them; "the first by the second" replaced. No item codes of the fourth draft's lists are used; proposals are named "the fourth draft's proposal 9" and so on, which he has seen. The word "notice" survives once, in the table, as the title of the fourth draft's proposal 1.
- No assurance: "Unproven: GitHub runs its required test run" read as a statement of fact and was reworded; "None of this has run" added under the PROCESS decisions; the shared state and the default-branch decision each end "Unproven".
- Proven and unproven apart: "(measured)" added to the 700 merges; the 71% conclusion marked "Judged"; the five missed effects marked measured with the unworked part said.
- No tests, gates, reviews or checks added: none added. The uses check reading tests rests on his hint; the tool's tests and the "without flaws" condition on his "agreed". One comparison removed (section 1, row 5).


# [file] process4_definition_appendix_v5.md (later part)

| 122 | INT-2 | ARCH decides per merge, from listed reasons and cost, whether a fresh reviewer runs; the reviewer never saw the job ... | Conflict | Ended. Record of 13-14 Nov, line 21 | K | cR |  |
| 123 | INT-3 | Review findings are diagnosis, never the merge gate; a green gate merges without the owner, who approves a ... | Keep | Ended in part. Record of 13-14 Nov, line 21 | D step 7; C (the coordinator) | cR | Review clause moot. Approval of one merge stays, untried |
| 124 | INT-4 | A layer closes when every pull request is merged and the layer's checks pass; whole-product checks run before a ... | Ended | Ended. Record of 13-14 Nov, lines 7 and 24 | K | cR | The store still shows "modify", and its note holds the text of PLT-5's note since 14 Nov. The fifth draft no longer mentions this slip |
| 125 | INT-5 | Nothing in a merge or close depends on archiving a session; retirement of a job is a record line. | Keep | Kept; stated nowhere in the main text | none | f |  |
| 126 | INT-7 | A review reports everything it finds in one pass, every gap with file and line, so a job never fails review ... | Conflict | Ended. Record of 13-14 Nov, line 21 | K | cR |  |
| 127 | SES-1 | Roles: ROOT as a depth-0 starter; one architecture session per product; jobs; workers. ROOT's creation of sessions ... | Purpose kept, mechanism open | Kept; way changed. Record of 13-14 Nov, lines 16 and 22; Claude decided | C; K (three measurements) | bR | Starting sessions from a scheduled task is not adopted (0 of 3, measured) |
| 128 | SES-2 | The two-phase handover: ROOT creates the new architecture session and repoints the address; nothing in flight is ... | Purpose kept, mechanism open | Kept; way changed. Claude decided | G; C (shared state) | bC | Replacing ARCH while jobs are open is unproven |
| 129 | SES-3 | A refresh handoff is written by the tool from git, never by hand, at most one screen, a pointer set, not a narrative. | Purpose kept, mechanism open | Kept; way changed. Claude decided | G | bC | A successor begins from the shared state and GitHub |
| 130 | SES-4 | The refresh threshold is read by status and printed as REFRESH; it is text, not a hook. | Keep | Kept; stated nowhere in the main text | none | f | Relies on a status command (see REC-3) |
| 131 | SES-5 | Each role's reading set is fixed in advance and printed with sizes at its start. | Keep | Kept; stated nowhere in the main text | none | f |  |
| 132 | SES-6 | Budgets are fractions of the model's context window, in one table, never bytes fixed in code; an overrun is measured ... | Candidate | Ended in part. Bob's "agreed" to proposal 5, 14 Nov | L 9 | cT | CHANGED DECIDER, as F-REQ-12 |
| 133 | SES-7 | A summary is an option ARCH may take, never required by the tool. | Keep | Kept; stated nowhere in the main text | none | f |  |
| 134 | SES-8 | Models, effort and permission mode come from one table, picked by the start command: "always a model and effort ... | Keep | Kept as written | C (model and effort); I | a | His note is quoted. The one table is not mentioned; every session runs in Auto mode |
| 135 | SES-9 | A session's usage is read by an allowed route; where none exists it is named unmeasured, never estimated. | Keep | Kept as written | J (the tranche report) | a |  |
| 136 | SES-10 | Workers run in the background, read exactly what their brief names, and return machine-readable receipts. | Keep | Kept; stated nowhere in the main text | none | f |  |
| 137 | SES-11 | The process measures its own overhead per tranche: commits by purpose, sessions per job, gate runs per merged job, ... | Keep | Kept as written | J (the tranche report) | a | Only "the overhead share" is named |
| 138 | SES-12 | Two health metrics from day one: the false-done rate, and cost per pull request that survives a revert window. | Keep | Ended in part. Claude decided | K (by Claude's decision) | cC | A ledger line he kept. The first number can no longer be produced. Not put as a proposal |
| 139 | SES-13 | A session that outlives its parent is ordinary and costs nothing idle; no step counts on a parent being alive. | Keep | Kept; stated nowhere in the main text | none | f |  |
| 140 | SES-14 | A lane is a knowledge directory and design responsibility plus an on-demand worker; the UX lane is always there. | Keep | Kept as written | C (a design lane) | a | "The UX lane is always there" is not stated |
| 141 | SES-15 | ARCH routes every request between spokes and translates only where needed; spokes never see each other; toward the ... | Keep | Ended in part. Record of 13-14 Nov, line 17; Claude decided | C (the coordinator); K (three measurements) | cR | The measurement in its note ends unmeasured by Claude; not put as a proposal. The note was saved again on 14 Nov |
| 142 | SES-16 | A stateless architecture session, every wake a fresh session started by a scheduled task: to be measured on the ... | Keep | Ended. Claude decided | K (three measurements) | cC | His own note asked for the measurement ("let's measure on the first tranche"). Not put as a proposal |
| 143 | SES-17 | Urgency and persistence are instilled through memory, style and goals so sessions keep working until legitimately ... | Purpose kept, mechanism open | Kept; stated nowhere in the main text | none | f | CHANGED: the third draft had it way changed by lines 2 and 9; nothing in the fifth draft speaks of memory, style or goals |
| 144 | SES-18 | In-session workers are used for three things only: noisy bulk work, a read-only reviewer, independent parallel ... | Keep | Ended in part. Bob's "agreed" to proposal 9, 14 Nov | C (a worker); K | cT | CHANGED DECIDER: was Claude |
| 145 | MSG-1 | Git carries the state; a message only wakes; every message that asks for an act is preceded by the pushed record. | Keep | Kept as written | J; C | a | "Every message that asks for an act is preceded by the pushed record" is not stated |
| 146 | MSG-2 | A message from the architecture session's address, read from git, is a session's instruction; every other message is ... | Purpose kept, mechanism open | Kept; way changed. Record of 13-14 Nov, line 17; Claude decided | C | bC |  |
| 147 | MSG-3 | Push-then-send is one tool command; messages are numbered and a duplicate is ignored. | Keep | Kept; stated nowhere in the main text | none | f |  |
| 148 | MSG-4 | A message to the owner is one per turn, in plain words, with a link, and a numbered list only for an act of his. | Keep | Kept as written | G (completely blocked) | a |  |
| 149 | MSG-5 | A flaw report from a product session reaches the process by the state branch and the reply by main of the process ... | Purpose kept, mechanism open | Kept; way changed. Bob's typed hint, 14 Nov; Claude's reading of it | H (how PROCESS is started and reached) | bT | CHANGED DECIDER: was Claude. A job reports to ARCH; ARCH asks ROOT to start PROCESS. That the report then travels by the coordinator is Claude's reading, and is marked so |
| 150 | MSG-6 | A message that cannot be delivered is recorded as undelivered and listed by status. | Keep | Kept; stated nowhere in the main text | none | f | Relies on a status command (see REC-3) |
| 151 | F-ROLES-1 | ROOT is the only creator of the architecture session; that session is the only creator of jobs and lanes; nothing ... | Keep | Ended in part. Record of 13-14 Nov, line 22; Bob's typed hint, 14 Nov ("ROOT") | C; H | cT | CHANGED: ROOT also starts PROCESS, which he calls a lane; the line has only the architecture session create lanes. Listed under (g) |
| 152 | F-ROLES-2 | The record, git and GitHub, is the only thing any role trusts. | Keep | Kept as written | J | a |  |
| 153 | F-ROLES-3 | Every role runs in Auto, and its starting prompt or START lists every act it may take. | Keep | Kept as written | I (how a session must be started) | a | Part contradicted and said so: ROOT, started by his plain prompt, does not get instructions naming every act. Unproven |
| 154 | F-ROLES-4 | A full or silent ROOT is replaced by the watcher, and by the owner only if the watcher declines; the architecture ... | Conflict | Kept as written | C (the watcher; table of acts); G | a | CHANGED: was ended in part. Restored with the watcher |
| 155 | F-ROLES-5 | The two scheduled tasks are created once and never edited; neither is required for correctness; each bounds how long ... | Keep | Kept as written | C (ROOT; the watcher) | a | CHANGED: was ended in part. The hourly alarm is named; the watcher's own task is not described |
| 156 | F-ROLES-6 | The hourly sweep runs status, wakes the architecture session when acts are listed while it is idle or when a session ... | Keep | Kept as written | C (ROOT; shared state) | a | Relies on a status command; REFRESH and "silent for two hours" are not stated |
| 157 | F-ROLES-7 | Two coordinators never both act: the address in git decides, and a replaced ROOT's old task finds another address ... | Keep | Kept; way changed. Claude decided | C (shared state) | bC | Matters again now that a watcher can take over |
| 158 | F-JOB-1 | ARCH takes its work from the record without being asked: every module of the open layer with unmet marks and no open ... | Purpose kept, mechanism open | Kept; way changed. Record of 13-14 Nov, lines 7, 8 and 9; Bob's "agreed" to proposal 6 | D steps 1 to 3 | bR | CHANGED DECIDER for reading line 3 by line 8: now his "agreed" |
| 159 | F-JOB-2 | A module has at most one job at a time, and the job applies every plan entry for its module. | Keep | Kept as written | D step 2 | a |  |
| 160 | F-JOB-3 | ARCH never idles while work remains and never ends a turn waiting on the owner while anything can be done. | Purpose kept, mechanism open | Kept; way changed. Record of 13-14 Nov, lines 2 and 9 | D step 8 | bR |  |
| 161 | F-JOB-4 | While a tranche runs ARCH prepares the next round or tranche, so the next opens the moment this one closes. | Keep | Kept as written | C (ARCH) | a |  |
| 162 | F-JOB-5 | ARCH subscribes to the job's pull request so its completion, a red gate or a comment reaches it as an event; no role ... | Keep | Kept; way changed. Nobody named | D step 6 | bN | The job, not ARCH, hears its test result and sends ARCH one message. The third draft marked this as Claude's; the fifth names no decider |
| 163 | F-JOB-6 | A flaw or improvement in another module goes to ARCH as a report in that module's terms; ARCH confirms it and sends ... | Keep | Kept; way changed. Record of 13-14 Nov, line 7; Bob's typed words, 14 Nov | D step 5; D (a round) | bT | CHANGED: was ended in part. "Nothing found waits for the next tranche" holds again: walk flaws go to the next round. The completion round is not mentioned |
| 164 | F-JOB-7 | A job that cannot proceed sets the blocked state and ends the turn with everything pushed; a turn ends only COMPLETE ... | Keep | Kept as written | D (a job stopped by another module's flaw) | a |  |
| 165 | F-JOB-8 | A red is fixed by the job; a red the tranche already had is named, not owned. | Keep | Kept as written | D step 6; D | a |  |
| 166 | F-JOB-9 | Jobs never merge: the plain merge routes are denied to every session; a refused merge is retried a bounded number of ... | Keep | Kept as written | C (a job); I (the deny list) | a |  |
| 167 | F-JOB-10 | A module whose post-merge review finds gaps may be reopened for a second attempt (the owner's 1A). | Keep | Ended in part. Record of 13-14 Nov, line 21 | K; D step 1 | cR | Post-merge review ended. A module is reopened by a walk flaw or a notification |
| 168 | F-GATE-1 | The tool's test command installs the module's lock files in a job session, so a job's suite never depends on the ... | Keep | Kept; stated nowhere in the main text | none | f |  |
| 169 | F-GATE-2 | Every requirement is tested at the module's interface and proven met; none goes untested (P7). | Purpose kept, mechanism open | Kept as written | E test 1 | a | Quoted as a rule for the job. "None goes untested" is not quoted |
| 170 | F-GATE-3 | Module and layer coverage should be more complete than the earlier processes produced; fuller fixtures run by tier: ... | Purpose kept, mechanism open | Ended in part. Record of 13-14 Nov, lines 6 and 7; Bob's typed answer to proposal 13 | K | cT | CHANGED: was way changed. Tiers "at layer close" and "nightly" end by the record; the release tier ends on his answer to proposal 13 |
| 171 | F-GATE-4 | The gate runs as two jobs: product code with no token, so no test can read one; a failed fetch fails the check (the ... | Candidate | Kept as written | L 12 | a | Kept by Claude under line 12. "A failed fetch fails the check" is not named |
| 172 | F-PLAT-1 | The process depends only on acts the committed approvals cover and that were measured to pass; archiving sessions ... | Keep | Kept as written | I; J | a | As PLT-2 |
| 173 | F-PLAT-2 | The process stands only on platform behaviour that has been measured. | Keep | Kept as written | J | a |  |
| 174 | F-PLAT-3 | The process keeps at most 24 live sessions by default and ARCH fills that room with jobs for the ready work; ARCH ... | Conflict | Ended. Record of 13-14 Nov, line 9; Bob's typed words ("across the account") | K; D | cR |  |
| 175 | F-PLAT-4 | The live count stays within the bound, and every new session is checked to have started. | Keep | Kept; way changed. Claude decided | K (two more duties stay); D | bC | CHANGED: was not yet settled. Confirming a started session exists is "part of the act of starting", not a check |
| 176 | F-PLAT-5 | Hard rules live in deny lists in the repository's settings file. | Keep | Kept as written | I (the deny list) | a |  |
| 177 | F-PLAT-6 | A session stopped by three refusals in a row is caught by status and the sweep; the tool counts each session's ... | Keep | Kept as written | I (working rules) | a | Three refusals stop a session. The per-session count and REFRESH at 10 are not stated |
| 178 | F-PLAT-7 | A session stopped by refusals is replaced by its parent (a job from its branch and pull request, the architecture ... | Keep | Kept as written | I; G; C (the watcher) | a | CHANGED: was ended in part. "ROOT by the watcher" is restored |
| 179 | F-PLAT-8 | The owner's standing approvals are the one policy at every depth, in his own words, committed by him to each ... | Conflict | Ended in part. Bob's typed answer to proposal 13, 14 Nov | I; K; L 11 | cT | CHANGED DECIDER: was Claude. The guard ends. Section K states the consequence: nothing in git stops a session's pull request from changing his approvals. The start-up comparison is kept on Claude's reading of line 12 |
| 180 | F-PLAT-9 | Every refusal of an approved act is recorded with the act, depth and channel and counted per tranche; the approvals ... | Keep | Ended. Claude decided, citing Bob's "three tests and no others" | K (two duties) | cC | CHANGED: was not yet settled. Counting refusals and trying approved acts again are ended by Claude under his words; he was not asked whether those words reach them |
| 181 | F-PLAT-10 | An act the judge refused is never reworded or rerouted to another session; it is recorded and raised. A model's own ... | Conflict | Kept as written | I (working rules) | a | Its second sentence (one new session for a model's own decline) is not stated |
| 182 | F-PLAT-11 | Outward acts (sessions, tasks, merges) belong to ARCH and ROOT; STARTs name every act a job needs. | Keep | Kept as written | C; I | a |  |
| 183 | F-PLAT-12 | Every START carries the session's authority, and who its coordinator is, through the address file in git. | Keep | Kept; way changed. Claude decided | C (shared state); D step 4 | bC |  |
| 184 | F-PLAT-13 | The gate runs on every pull request, and records reach a protected branch only through a pull request. | Keep | Kept; way changed. Claude decided; record line 19 | E test 1; D; M | bC | No test runs on the tranche's pull request into main or on a lane's. The test run must still report on pull requests that change no module (M) |
| 185 | F-PLAT-14 | The sweep catches lack of progress, not only silence: status reads each attempt's elapsed time and cost against its ... | Purpose kept, mechanism open | Kept; way changed. Claude decided | K (two more duties stay) | bC | CHANGED: was not yet settled. Said to "stay" as ROOT's hourly wake. That wake is described as catching a session that has stopped; nothing reads lack of progress, and the cost reading ended at L 4 |
| 186 | F-PLAT-15 | One act per command: a judged act is never chained with another command; a nudge in every START and in the tool's ... | Keep | Kept as written | I (working rules) | a |  |
| 187 | F-PLAT-16 | At most a handful of command hooks; no model judge between a session and the owner; nothing holds a turn; no /goal. | Keep | Kept; stated nowhere in the main text | none | f | As ENF-1 |
| 188 | TXT-1 | The product's CLAUDE.md is under thirty lines, hand-written, naming the pinned process commit and the command that ... | Keep | Ended in part. Claude decided | J; L 8; I | cC | The line as printed stands. The per-line test in its note ends (Claude). "Each change listed in the tranche report" is not in the report. ARCH changing CLAUDE.md with no approval is listed under (g). Note saved again on 14 Nov |
| 189 | TXT-2 | Every line in an instruction file is failure-backed, non-inferable from the code, or tool-enforceable; failing lines ... | Candidate | Ended. Claude decided | L 8 | cC | Not put as a proposal |
| 190 | TXT-3 | One rulebook per area, at most ten rules on one screen, rewritten in place, never appended; when the owner raises a ... | Keep | Kept as written | J | a |  |
| 191 | TXT-4 | Apply the per-line test to the principles, so most roles load two or three; tried and measured. | Keep | Ended. Claude decided | K (three measurements) | cC | His own note asked for the trial ("let's try"). Not put as a proposal |
| 192 | TXT-5 | Each role's starting prompt names its own rulebook in the pinned process; product rules load by path. | Keep | Kept; stated nowhere in the main text | none | f |  |
| 193 | TXT-6 | Every rule cites the measured failure or the owner's decision that justified it; a rule with neither is removed. | Candidate | Ended. Claude decided | L 7 | cC | Rests on his words on PROCESS ("every process change now comes to you"). Not put as a proposal |
| 194 | TXT-7 | Every text names its audience and speaks plainly. | Keep | Kept; stated nowhere in the main text | none | f |  |
| 195 | MNT-1 | The process is a product under itself, as the thin process: its own ledger, requirements, jobs on branches with ... | Purpose kept, mechanism open | Kept; way changed. Bob's typed words, 14 Nov (PROCESS); record lines 20 and 21; his "agreed" to proposal 5 | H; E (the process's own tool) | bT | CHANGED DECIDER. The process is no longer built by jobs in tranches: it is changed at PROCESS, with him. Listed under (g) |
| 196 | MNT-3 | A tranche of the process is built with the last released version of the process. | Keep | Kept; stated nowhere in the main text | none | g | Assumes the process has tranches and releases of its own. His typed words give it one lane, PROCESS, and proposals he chooses among. The main text does not state or end the line |
| 197 | MNT-4 | A tranche runs on one pinned process version, named in the plan; every session verifies the pin once at start and ... | Keep | Ended in part. Bob's typed answer to proposal 13, 14 Nov | J; K | cT | CHANGED DECIDER: was Claude. The version check at a session's start ends. One fixed version for each tranche stands |
| 198 | MNT-5 | A fix for a blocking flaw is adopted by a running tranche once, as an explicit recorded act that moves the pin; no ... | Purpose kept, mechanism open | Kept; way changed. Bob's typed words, 14 Nov | H; J | bT | CHANGED: was open. A product moves to a changed process only with his prior approval; PROCESS proposes how. "No job restarts" is not stated |
| 199 | MNT-6 | A fix for a non-blocking flaw waits for the next process release and the product's next tranche. | Keep | Kept; stated nowhere in the main text | none | g | A fixed rule (wait for the next release and the next tranche) against his typed words: he approves each move and PROCESS proposes "the best and least disruptive means". Not stated, not ended |
| 200 | MNT-7 | A flaw report is filed from any session by one command, listed at each status, answered by main; never fixed in place. | Keep | Kept; way changed. Bob's typed words and hint, 14 Nov | G; H | bT | CHANGED DECIDER. Reported to ARCH, changed only at PROCESS, never fixed in place. "Listed at each status" needs the status command |
| 201 | MNT-8 | Certification is a long-term goal that indicates readiness for general use (the owner's words): a shadow of one ... | Keep | Kept; way changed. Bob's "agreed" to proposal 11, 14 Nov | O | bT | CHANGED DECIDER: was Claude. The trial with made-up modules stands as the shadow slice. Of its health numbers the first can no longer be produced (Claude) |
| 202 | MNT-9 | Flaws found in the shadow are fixed before release and the run repeats from the step that found them. | Keep | Kept; stated nowhere in the main text | none | f | Fixes found in the trial would now be process changes at PROCESS |
| 203 | MNT-10 | Each release names the platform rows and product sizes it was certified against, so a larger product is told at ... | Keep | Kept; stated nowhere in the main text | none | f |  |
| 204 | MNT-11 | On each model release, remove one component at a time and see what breaks. | Keep | Ended. Claude decided, citing Bob's "three tests and no others" | K (two duties) | cC | CHANGED: was not yet settled. Section K calls it a duty "from your Foundations"; it is also a ledger line he kept on 31 Oct. He was not asked whether his words reach it |
| 205 | SHM-1 | A product receives the short CLAUDE.md, one skill, a settings file with the permission list, the gate workflow and ... | Purpose kept, mechanism open | Ended in part. Bob's typed answer to proposal 13, 14 Nov | K | cT | CHANGED DECIDER for the drift check. The short fixed set a product receives is no longer stated |
| 206 | SHM-2 | Shims are regenerated on GitHub's runner with the owner's token and merged by pull request; no session attaches a ... | Keep | Kept; stated nowhere in the main text | none | f |  |
| 207 | SHM-3 | Onboarding writes the build state's skeleton, the grant list and the first plan, and measures the product against ... | Keep | Kept; stated nowhere in the main text | M (the product's repository is not converted) | f |  |
| 208 | SHM-4 | A product mid-tranche at conversion carries it by one command ("Needed for Civicsmith now"). | Keep | Kept; stated nowhere in the main text | M | f |  |
| 209 | SHM-5 | A product's session setup is the product's own script, run by the session's first command, not by a hook. | Keep | Kept; stated nowhere in the main text | none | f |  |
| 210 | P1 | The process exists to put correct, working product behaviour that meets every defined requirement onto main; the ... | Keep | Kept as written | A | a |  |
| 211 | P2 | Process and product are separate; the build state at the product's own paths tells ARCH what to do. | Keep | Kept as written | J; D step 1 | a |  |
| 212 | P3 | Development under the process is development of the product, not of the process; a serious enough flaw pauses the ... | Keep | Kept as written | G (the process itself has a fault); H | a | Agrees with his typed words on PROCESS |
| 213 | P4 | One total order; each module in one layer; a module uses only earlier modules; declared use is checked against ... | Keep | Ended in part. Record of 13-14 Nov, line 7 | A (words); E | cR | Layer clauses ended. A use of a later module is fixed by refactoring (line 13). "The owner decides ... the modules that carry product capability" is not stated; ARCH edits the list |
