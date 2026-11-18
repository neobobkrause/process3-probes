# [file] audit_ledger.md (continued)


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


# [file] audit2_corruption.md (later part)

**Whose.** Bob's (how he wants options put; whether his merge is the approval). Claude's for the wording.

---

### 9. Several things marked "Claude decided", or written as his, change something he defined without being put to him as a proposal

**Counter-argument.** You wrote: "When you change something I defined you need to describe the PROPOSED change in words I understand". The fifth draft says no proposal is waiting. I count nine places where a thing you defined or kept is changed or interpreted under "Claude decided", "Claude reads", or with no mark.

The full list of Claude's decisions, with the strongest case against each, is appendix C. The nine:

| # | What the draft does | What of his it changes | Why it was not Claude's alone |
| --- | --- | --- | --- |
| a | Tests and walk steps are unlimited in number if each names a requirement (E) | His fixed point "three tests and no others"; his diagnosis "kept adding test after test" | It decides what "no more tests" bounds (finding 6) |
| b | Jobs commit built files (J) | Kept ledger line "A job never commits a generated artifact" | Reverses a kept line; not listed among the lines changed (finding 7) |
| c | Keeps the start-up comparison of his approvals, "Claude reads line 12 as covering it" (L 11) | His answer "three tests and no others", which the draft uses to end thirteen other checks, one of them the guard on the same approvals | The same words end one permission check and spare another. It is the stop after which "the product never restarted" (the draft, I). The notes flag: "Not put to him again" |
| d | Ends two Foundations duties and the first of his two health numbers "By Claude's decision" (K) | His Foundations: "Nothing here is in force until it has run on a real tranche with the two health metrics measured"; the duty to remove parts of the process one at a time at each model release | The second duty is the only standing force for removal in his documents. Ending the first number means his own sentence can never be met. The notes flag both |
| e | Moves requirements between modules "as a mechanical edit" (C) | His definition: a mechanical edit "touches many modules in the same trivial way and needs no judgment"; his example "a word table change" | Deciding which module's code meets each of 29 modules' requirements is judgment. It uses his one exception as a door (register 14) |
| f | "No session building a product ... works round it" (G) | His PROCESS paragraph, which does not say it | Finding 4 |
| g | Reads "development release walk" as the walk that ends the tranche (P) | His 9 Nov words on AI; his term "development release" | Finding 5. Put to him, but without the other reading or the 9 Nov sentence |
| h | Withdraws the proposal to drop the watcher because he asked "are you certain that the watcher isn't needed?" (C) | Nothing of his; but it treats his question as an instruction | The draft's own rule for the coordinator: "A question from you is answered in words, never by building anything." The answer in words exists and is not given to him as an answer (finding 10) |
| i | "Claude reads this as: the way Process3 kept to them is carried over unchanged" (J, GitHub's limits) | His hint "same as in process3" | The notes say: "I did not look up or describe what that way was". Process3's way was built, found useless ("Primary use never went above about 12% of the limit") and removed on 9 Nov (PD-22). Two of its hooks are still in the product's settings |

**What it rests on.** [measured] in each row from the draft, the drafting notes (v5_notes §1 rows 3, 7, 14; §2), the ledger, and Process3's decision record. Whether each is "not Claude's" is [reasoning].

**How bad.** Misleads Bob. Each is small; together they are the instrument the forensic record names: a list of decided things he must act to reverse (causal_forensics driver 8).

**Status.** RAISED BEFORE AND STILL OPEN as a class (register 78; register 20 for the health number; register 14 for the modules). Rows a, b, c, f, g, h, i are NEW with this draft. ANSWERED in part: the draft marks most of these as Claude's and invites him to overrule, and his third message did hand Claude the technical questions ("You're better qualified than I am to answer many of these questions").

**Best answer within the rule.** Wording only: move rows a, b, c, d, e, g to section P as proposals, each with what he defined, what changes, and what is lost. For c, the removal is also available: a session started after his edit loads the new approvals, and he already restarts ROOT with each edit, so the comparison can go without anything being added. Correct f and i. Answer h with the measured facts (finding 10).

**Whose.** Claude's to correct; then Bob's on each.

---

### 10. Five kinds of long-lived session, each replaced often, each started with text another session types

**Counter-argument.** ROOT, the watcher, the coordinator, ARCH and now PROCESS all live for hours or days. In Process3 the same kinds were replaced about every four to eight hours, each replacement was briefed by its predecessor, and within a day the brief had grown rules again. The draft replaces the briefing note with a shared state, and says little about what that holds or how it is kept from becoming the same note.

**Sentences concerned.**
- "For ARCH or the coordinator, ROOT starts a successor, which begins from the shared state and GitHub. For ROOT, the watcher takes over." (G)
- "Shared state (*Claude decided*)... It holds: which sessions hold the standing roles; the slot number; a stop; your instructions quoted exactly; notifications and walk flaws for modules with no open job; and the time ROOT last woke." (C)
- "ARCH was replaced 21 times in six and a half days in Process3 (measured)." (C)
- "The watcher is a standby session that takes over if ROOT dies... Claude withdraws the proposal, and the watcher stays as your documents have it." (C)
- "So only words you mark as a decision or an instruction are passed on" (C)
- "As in Process3, a long-lived session compares the approvals it loaded with the newest, and on a difference does nothing." (I)

**What it rests on.**
- [measured] ROOT: 11 sessions from 3 to 8 Nov, living from 46 minutes to about 48 hours; "every change to the owner's approvals forced one". The coordinator: about 26 in six days. The architecture session: 21 sessions, that is one start and 20 handovers (roles_root_coordinator §1.1, §1.4; the draft's "replaced 21 times" is one too many). The watcher: 10 records, two takeovers.
- [measured] What a takeover is worth: "A takeover moves ROOT one level down, so it is a bridge: Bob restarts ROOT from his app at depth 0 at his next opportunity" (PD-2, quoted in roles_root_coordinator §1.6). So the watcher did not remove his act. It postponed it, and both times left no watcher behind (the draft). The watcher also has its own daily alarm and reads a record ROOT must keep writing.
- [measured] The briefing chain: 26 notes; one coordinator's "60% rule" became a start step; a note that carried "no rules and no restatement of Bob's words" was followed within 24 hours by "Rules in force" (causal_forensics §3).
- [measured] Session choices recorded as his: 14 of 21 items marked his were mechanisms; 7 of 35 safeguards quoted him (causal_forensics §4.1).
- [measured] Each of his five edits to his approvals stopped every long-lived session, and after the last the product never restarted (the draft, I). The first tranche will need edits: the draft lists wording that "only you can make" before any session can push.
- [reasoning] What the next ARCH needs is not in the list of what the shared state holds: which flaws it ruled "designed", what it is waiting for from PROCESS, what it has asked him. Either it re-derives them or the outgoing session writes them down, and then the note is back.
- [reasoning] "Your instructions quoted exactly" has no end. In Process3 the same list was called "BOB'S WORDS (binding)". Nothing says how a marked word is marked, who judges that it is, or when it stops applying. The coordinator decides, in the night, what was an instruction. Today's drafting, done carefully and by day, turned "ROOT", "the processes", "sessions", "same as in process3" and a question into decisions.
- [reasoning] The shared state is a branch written with no merge and no test, by every standing session. Process3's was 12,881 commits and 8,937 files, and its volume was the coordinator's own explanation of the account's suspension ("1,387 state pushes in 19 h", causal_forensics §6).
- [reasoning] After he approves a process change mid-tranche, the standing sessions still carry the old role text in their context. The check of the process version at a session's start is ended.

**How bad.** Drift over days; then a stop each time he edits his approvals. Costs Bob time.

**Status.** RAISED BEFORE AND STILL OPEN (register 8, ARCH is one long session, NO ANSWER FOUND; register 28, the stop that ended Process3 is kept; register 34, the alarm against a stop; register 15, the standby). ANSWERED in part by "sessions name roles, not session addresses" and by reading the stop at each wake, both unproven. NEW: PROCESS as a fifth standing session; the watcher restored without the measured answer to his question; the unbounded list of his instructions.

**Best answer within the rule.**
- Structural: no standing session lives across a round. ARCH and the coordinator are replaced at each round's end from git, by design, so replacement is the normal case and carries nothing typed. This was offered in the first round and not taken.
- Removal: with that, the start-up comparison of approvals can go (finding 9, row c).
- Wording: answer his question on the watcher with the three measured facts (both takeovers left no watcher; a takeover leaves ROOT a level deeper; Process3's own ruling called it a bridge until he restarts ROOT) and let him choose. Do not decide it by withdrawal.
- Wording: a marked instruction is one he begins with a word he chooses, it is stored once with its date, and it ends with the tranche unless he repeats it.
- Honest statement: the shared state is Process3's state branch under a new name, and the draft should give it a fixed list of what it may hold and say that nothing enforces the list.

**Whose.** Claude's for the structure and wording. Bob's for the watcher and for how he marks his words. Needs the trial for takeover and replacement.

---

### 11. A tranche that does not end reports nothing

**Counter-argument.** The one report is written when the tranche ends. Process3's tranche never ended, so no report was ever written, and every day's messages showed progress. Under the fifth draft the same stall would look the same to you.

**Sentences concerned.** "The tranche report. One report, written once by ARCH at the tranche's end... Nothing reads the report to decide anything." (J) "The coordinator tells you what ARCH decided, one plain line each" (C).

**What it rests on.** [measured] "The tranche never closed, so no tranche report was written" (k_evidence K4). "9 Nov: process3 merged 16 PRs; the product landed 3" was noticed only when the owner asked (causal_forensics driver 7). 218 of 220 jobs read complete while the deployed product failed (product_side). [reasoning] The author of the report is the session it describes, and after 20 handovers the ARCH that writes it did not see the tranche.

**How bad.** Misleads Bob, by silence.

**Status.** NEW. (Register 52 raised only that the report had no author; that is ANSWERED.)

**Best answer within the rule.** Wording: when a round ends, the coordinator tells him in two plain lines what the walks listed and how many rounds the tranche has had, taken from what the walks already wrote. That is telling, not a new record or number. And say in section D that a tranche with no end produces no report.

**Whose.** Claude's.

---

### 12. "Permission management is preserved" and "three tests and no others" are applied to the same kind of thing in opposite ways

**Counter-argument.** Two of your statements meet at the checks that guard your approvals. The draft ends the guard that stopped a session's pull request from changing your approvals, on "three tests and no others", and keeps the comparison that stops every long-lived session when you change them, on "permission management is preserved". It does not tell you the two statements pull against each other there.

**Sentences concerned.** "One consequence: with the guard gone, nothing in git stops a session's pull request from changing your approvals; what remains is the permission checker." (K) "The start-up comparison of your approvals. Claude reads line 12 as covering it. *Kept*" (L 11).

**What it rests on.** [measured] The permission checker refused such an edit 2 times of 2 ("Instruction Poisoning", permissions_inventory via enforcement_levers surface 15); the same checker passed and refused the same act minutes apart elsewhere (the draft, O). [measured] The first round's register notes, item 10: the first audit "asked the draft to say where 'permission management is preserved' and 'three tests' pull against each other; the memo does not". [reasoning] With the lane clause ("A lane's pull request merges with no test") there is a merge path on which nothing runs at all.

**How bad.** Misleads Bob; and leaves his approvals behind a checker measured twice.

**Status.** RAISED BEFORE AND STILL OPEN (register 37 and 43; register notes §4 item 10). ANSWERED in part: the consequence is now stated in section K.

**Best answer within the rule.** Report the conflict to him; do not choose. One setting exists on GitHub's side that would make the approvals files changeable only with his approval (enforcement_levers lever 4). It is unproven on his kind of account, and it works by requiring his approval on a pull request, which he may count as a gate. If he does, **no answer found**: what stands behind his approvals is the permission checker, measured twice.

**Whose.** Bob's.

---

## Appendix A. Every rule in the fifth draft that is held only by text

"Held" names anything physical. Where a rule is partly held, the table says by what. Record entries are [measured] unless marked.

| # | Rule, in the draft's words | Section | Held by | What Process3's record shows about such text |
| --- | --- | --- | --- | --- |
| 1 | "only words you mark as a decision or an instruction are passed on, exactly as written"; "no session writes its own summary of your words as yours" | C | Text | 14 of 21 items marked his were mechanisms; 7 of 35 safeguards quoted him |
| 2 | "A question from you is answered in words, never by building anything." | C | Text | Four questions in 26 hours each returned a subsystem |
| 3 | The coordinator "decides nothing about the product and brings you no technical question"; puts a question "once" | C | Text | A technical question was carried as his for about nine hours by four coordinators |
| 4 | ROOT "decides nothing about the product and builds nothing" | C | Text | No evidence against; 11 ROOTs in five days |
| 5 | ARCH "never edits your approvals, changes the process, or publishes a release without you" | C | Approvals: the permission checker (2 of 2), nothing in git. Process: text. Release: not stated | Process: 270 of 296 changes by sessions |
| 6 | ARCH "settles a design before anything is built on it"; "writes each decision in the product's decision file" | C | Text | The process's decision file went from nothing to 49 KB in four days |
| 7 | A job "writes only its own module's files"; "never changes another module" | C, D | Text ("not by any check") | 0 of 2,540 commits strayed, with the check standing in four places; 34 blocks say the fix lay outside |
| 8 | A job "never merges, starts a session, deploys or changes the process" | C | Merge: deny list. The rest: text | The merge part held |
| 9 | "no helper is briefed to review another session's work" | C | Text | A review of every process change, by practice not by tool; 102 of 104 findings acted on |
| 10 | A design lane "delivers designs, never product code"; its pull request "merges with no test" | C | Text | The ux lane made 61 of 63 commits to the folder the walks are measured against |
| 11 | "Every session passes your suggestion on" (model and effort) | C | Text | Not recorded |
| 12 | The shared state "is written only through the process's tool" and holds six named things | C | Direct pushes: deny list. Contents: text | The state branch grew to 12,881 commits |
| 13 | "Sessions name roles, not session addresses" | C | Text | Unproven |
| 14 | "Sessions are at most three levels deep, and none starts its own replacement." | C | Text | Both watcher takeovers left ROOT a level deeper; coordinators started their own successors until 5 Nov |
| 15 | Ready jobs take slots "earliest in the order first"; "Only your marked instruction puts a module ahead." | D | Text, unless the tool's code chooses | "told BOB '6 at most'; BOB followed for ~6 h" |
| 16 | "instructions naming every act the job may take" | D | Free text typed by ARCH | "MY STANDING RULES TO BOB" |
| 17 | "A flaw it finds in another module goes to ARCH" | D | Text | Held, with the check standing |
| 18 | "There is no review" | D | Text; the tool has no review argument | See row 9 |
| 19 | "The slot is refilled in the same turn" | D | Text | A finished job went unnoticed for 194 minutes |
| 20 | A blocked job "records that it is blocked, pushes and stops" | D | Text | 165 block notes, median 1,389 characters |
| 21 | A mechanical edit "needs no judgment"; some are "so trivial that module tests need not be rerun" | D | A session judges | A light test run for record-only changes was added and narrowed two hours later |
| 22 | "Only when the internal walk finds no flaws is the product deployed" | D | ARCH's reading | Round 1's close deployed and walked after the internal walk had found flaws (PD-16) |
| 23 | "Each flaw becomes work for a named module" | D | ARCH's judgment | 36 notes "the designed absence, BOB, 8 Nov"; PD-10 |
| 24 | A walk "lists no flaw and leaves out no step that the walk before it made" | D | ARCH's reading of reports sessions write | Every step ok with 63 failures listed; 175 steps then 157; notes 17 then 60 |
| 25 | "The tranche ends only when an external walk completes without flaws"; then ARCH merges into the main branch with no test | D | Text. In Process3: a tool refusal | Never reached |
| 26 | "Only your word ends a tranche that will not come clean." | D | Text | Unproven |
| 27 | "A test runs only when there is a fully informed reason to run it" | E | Text | 63% of test runs were not started by a code change |
| 28 | Tests "complete yet fast and efficient"; "every requirement is tested at the module's interface and proven met" | E | Text | Ten of twenty false "done" findings were tests that pass either way |
| 29 | A test or step "exists only to prove a product requirement, which it names"; one that serves the process "is not allowed" | E | Text (the draft says so) | 211 files; every addition carried the label asked for |
| 30 | The tool's tests "run only when PROCESS changes the process, and cannot stop a product job" | E | Structure, unbuilt | Tool tests grew 41,777 lines |
| 31 | "After two failed corrections ARCH replaces the session" | G | Text; nobody is named to count (register 11) | A round limit was overridden all 17 times it applied |
| 32 | "No session building a product fixes it or works round it." | G | Text | "BOB worked around it" |
| 33 | One plain message when completely blocked; a blocker only he can clear "is told to you at once" | G | Text | The nine-hour wait |
| 34 | ROOT reads the stop at every wake "so that the hourly alarm does not undo it" | G | Text | 94 notifications after the stop |
| 35 | A process change "must not add a new test, gate, review or stop" | H | Text, and his choice | 41% before and after he said so |
| 36 | "No session building a product may change the process ... or adopt a changed process." | H | Text (the draft says so) | 116 moves of the version |
| 37 | "'no change' is always among the options" | H | Text | Decline was used where a named, cheap place for it existed |
| 38 | "PROCESS writes your approving words ... Nothing else counts as approval." | H | Text, written by the session concerned | "Yes, add that rule to the canon", then "far too broad" |
| 39 | Several changes "considered together as a group" | H | Text | Every audit produced artifacts |
| 40 | "No session writes, edits or relays" his approvals | I | The permission checker; nothing in git | 2 of 2 refused; the checker is uneven elsewhere |
| 41 | A long-lived session "on a difference does nothing" | I | The session's own act | Held too well: 5 stops of 5 |
| 42 | A session is started "with one repository only ... from the newest commit ... with starting instructions that name every act" | I | Text | ROOT came up on the main branch both times; coordinators held three repositories at times |
| 43 | "One judged act per command. A refused act is never reworded or handed to another session." | I | Text | After one refusal the checker treated the next push as a way round |
| 44 | "A session acts only on what it has read in full or measured" | J | Text | A 540 KB log "read from ... down" |
| 45 | "One short rulebook per role, at most ten rules." | J | Size of starting text: the tool's tests. Rule count: text | The one hard limit held all week |
| 46 | "The product's CLAUDE.md stays under thirty lines." | J | Text | 641 bytes to 8,664 |
| 47 | "one fixed version for each tranche, moved only with your prior approval" | J | Text | 116 |
| 48 | GitHub's limits kept "same as in process3" | J | Not stated | The machinery for it was removed on 9 Nov |
| 49 | In the report "No number is a target. Nothing reads the report to decide anything." | J | Text | A cost figure was made compulsory within 45 minutes of reading wrong |
| 50 | "one writer per file"; "one owner module per file" | J | Text | See row 7 |
| 51 | A walk "is shared out among them by journey" | D | ARCH assembles it | Never ran |


9 mackerel were logged at the Marsh Lane gate.

Of 51, something physical stands behind six in whole or part (5, 8, 12, 30, 40, 45). Outside the table and physical: the deny list in a session that holds one repository; GitHub's rules on the branches; the platform's stop after three refusals; settings only he can change. The first round counted 36 text rules in the second draft with three held. The fifth draft has more rules and says more honestly which are text. It has not reduced the number.

## Appendix B. The ten causes of growth: removed, only forbidden, or changed by PROCESS

Causes as ranked in causal_forensics §7.

| Cause | In the fifth draft | Verdict |
| --- | --- | --- |
| 1. The texts ordered a build for every failure and outlawed the cheap alternative | The duty to build is gone for product sessions and for PROCESS ("no change" is an option). But "or works round it" keeps the second half, and a product fault still always becomes work. PROCESS moves the builder away from the session that met the fault | **Changed by PROCESS.** Half removed, half kept in the draft's own words (finding 4) |
| 2. The restraint was built as a citation test with no cost term | The citation rule is ended. In the process it is replaced by his choice. In the product a new label rule appears: each test or step "names" a requirement | **Removed in the process. Reintroduced in the product** (finding 6) |
| 3. Text had a size limit and code had none, so a fix that must hold went into code | The limit on starting texts stays, as the tool's tests. Nothing limits the tool's code, the product's workflows, tests, walk or shared state. The draft itself teaches that text does not hold | **Not removed.** Forbidden in text |
| 4. A reflex that closes a problem with a guard, fails closed, and reads a question as a request for assurance | Coordinator rule in text. The draft does it itself with the watcher question and the start-up comparison, which fails closed | **Only forbidden** |
| 5. Review as a generator of obligations | No fresh reviewer, no helper as reviewer, no review argument in the tool | **Removed**, as far as the tool goes. A briefed helper is still possible (text) |
| 6. The roles that wrote the process carried no restraint text; briefing notes were their rulebook | PROCESS is a named lane with two rules of his quoted. No role text exists yet. PROCESS is long-lived across his absences and nothing says how it hands over | **Changed by PROCESS.** Unbuilt, unproven |
| 7. The scoreboard (process changes merged) and the cost (on the product) sat apart | PROCESS holds only the process's repository and cannot see the product | **Not removed.** Slowed by needing him |
| 8. Session choices recorded as his; his few words made into rules under his name | "Only marked words"; approval "exactly as typed". But PROCESS makes his short answer the only route for a process change, recorded by the session concerned | **Changed by PROCESS, and made central** (finding 8) |
| 9. His inputs pushed both ways; each edit to his approvals stopped everything | The stop on an approvals edit is kept. His words reach sessions through the coordinator | **Not removed** |
| 10. No session saw the total; audits were additive | The report comes once, at an end that may not come. Nothing shows him the size of the process when he chooses at PROCESS. A comparison that would have shown whether the process stayed as approved was taken out of the draft as a check (v5_notes §1 row 5) | **Not removed** |

Count: removed, 1 (cause 5) and half of 2. Changed by the PROCESS lane, 4 (causes 1, 6, 7 in rate only, 8). Only forbidden or untouched, 5 (causes 3, 4, 7, 9, 10). The first round counted two removed in the second draft. The real change since then is not in this table: it is that the sessions building the product are no longer the ones who may change the process, if finding 2 is dealt with.

## Appendix C. Everything marked "Claude decided" or "Claude reads": the strongest case against each

"Whose" says whether it was Claude's to make.

| Decision (section) | Strongest case that it is wrong | Whose |
| --- | --- | --- |
| Shared state in the product's repository, written with no merge (C) | It is Process3's state branch again: every record needs guards on form, freshness and writer, and the branch's volume was the coordinator's own account of the suspension. It also holds "your instructions quoted exactly", written by sessions. And the slot number, which he has now made an account-wide number, sits in one product | Claude's. Weight: real |
| Requirement-only modules moved "as a mechanical edit" (C) | Finding 9, row e | Bob's |
| A module's work is finished when "its notified job tells ARCH that nothing needs changing" (D) | A walk flaw placed against a module is "work" too. So a flaw can be closed by the job saying nothing needs changing, and the walk then finds it again or not. It also settles part of what he sent for study ("what a notified job does") | Claude's for jobs; under study for notifications. Weight: real |
| The mechanical edit merges once, between a round's last merge and its internal walk, with all touched modules' tests or none (D) | It is then the last change before the walk, across many modules, possibly with no test run. "None run" needs the required check to report without running, which is a way round the one gate on a session's judgment (register 68, still open) | Claude's. Unproven |
| Order of a round: jobs, internal walk, deployment only after a clean internal walk (D) | Faults only a deployment shows are found last. A walker fault on the internal walk (63 failures for three days) blocks every deployment. But his own words of 8 Nov ask for this order | His words support it. Weight: low |
| Walking sessions use the job slots, share a walk by journey, at most eight (D) | The internal walk is by screens, not journeys (the notes admit it). Eight walkers on one site change each other's data. Across the account they compete with another product's jobs | Claude's. Unproven |
| Tests and steps: product work, each names a requirement (E) | Finding 6 | Bob's |
| The tool's tests do not count against "no more tests" (E, "Claude reads") | Put to him in P. Fair | Put to him |
| The fault's description travels ARCH to coordinator to PROCESS (H, "Claude reads") | Finding 4: three hops of free text, and PROCESS cannot see the product | Claude's. Weight: real |
| "the processes" means the process's own repository (H, "Claude reads") | That repository today holds Process3's whole tool, guide and decision record on other branches, and his Process3 approvals. PROCESS starts among ready-made answers to every fault, each of them an addition (finding 2) | Put to him. Weight: real |
| His approval is recorded by PROCESS (H) | Findings 2 and 8 | Bob's |
| The tranche branch becomes the default branch (I) | On a public repository the unfinished, unwalked branch becomes what every visitor and every default-branch feature of GitHub uses, and the main branch, the only one a release is cut from, is hidden. His commits on the website then land on a branch that needs a pull request with tests passing, which a change touching no module cannot yet get (register 3, still open; the draft says so in M) | Claude's to propose; his act makes it. Unproven |
| Jobs build and commit built files (J) | Finding 7 | Bob's (reverses a kept line) |
| "same as in process3" for GitHub's limits (J, "Claude reads") | Finding 9, row i | Claude's to correct |
| ARCH writes the tranche report, once, at the end (J) | Finding 11 | Claude's |
| The first health number ended; three measurements ended unmeasured; two Foundations duties ended (K) | Finding 9, row d | Bob's |
| The hourly wake stands as the alarm for lack of progress (K) | Finding 4: it cannot tell waiting from dead | Claude's. Weight: real |
| L 1, 2, 3, 5, 8, 10: receipt, set-up check, size cap, oversized-file check, line-by-line test, reading audit, all ended | None of weight. Each rests on his quoted words or on a measured zero | Claude's |
| L 4, 6: cost recording and the job record ended | Cost may then never be reported ("cheaply" is half his purpose). With state in pull requests, a second suspension hides the record (register 9, 49) | Claude's. Stated |
| L 7: the citation rule ended | It failed as a brake and worked as a trail: the counts of what was his could be made only because additions named their authority (register 77, still open) | Claude's. Weight: low now that PROCESS records each change |
| L 9: refusal for size allowed for the process's own texts | Something refuses; he agreed it as the tool's tests | Settled by his "agreed" |
| L 11: the start-up comparison kept | Finding 9, row c | Bob's |
| L 12: tokens in the cloud environment; the test run in two parts | The two-part run was kept in the second draft because "it costs little" with no measured failure (register 51). It is now filed as permission management. Every session in that environment holds the deploy token, so "a job never deploys" is text | Claude's. Weight: low |
| Two products and the eight slots: "Claude will settle this when a second product starts" (N) | "Across the account" is his; a session sees one product; the number lives in one product's state. Nothing can count across the account today | Deferred. Honest |
| "development release walk" (P, "Claude reads") | Finding 5 | Bob's |
| The process4 folder is the "subtree" (M, "Claude reads") | None of weight | Claude's |

## What three tests do not see: a summary for findings 3, 5 and 7

Classes of real failure in Process3's product record that would pass all three tests as defined and could reach a release. Each is [measured] as a class in the record; that it would pass is [reasoning].

| Class | Record | Why each test misses it |
| --- | --- | --- |
| An upgrade breaks existing stored data | Releases 0.59.0 to 0.63.0 | Module tests: one module's test, run only on that module's job. Both walks start from a fresh copy |
| The installer cannot place a release | Never run | A development deployment does not use it |
| The assistant does not work | 14 walk notes "not walked, the assistant does not work" | A tranche can end with no AI account connected |
| One module's merge breaks another's tests | PD-14: six tests in three modules | Those tests run only when those modules next have a job |
| A test passes whether or not the change is there | Ten of twenty false "done" findings | It is the job's own test; nothing else reads it |
| A state the walk cannot reach on the site | 63 notes "not reached on this instance" | A note is not a listed flaw |
| A requirement no screen or journey touches | 8,838 requirement numbers against a few hundred steps | Only the job's own tests look |
| A stale built file | Not measured as a failure | The comparison is ended; the walk walks what was built |
| Changes that only work together | PD-19b | No single job's tests can pass |

What each walk does not see, by his definitions. The internal walk (screens, product not deployed): the deployed site's real data and settings, whether a journey completes with a proper result, sign-in on a real account, anything that needs the installer or an AI account. The external walk (journeys, development deployment): screens no journey visits, states the seeded data does not hold, an upgrade, the installer, the AI journeys unless an account is connected, a second team's site, and anything that depends on time or volume.

## What I did not establish

- I did not read the claude.ai pages that now hold the Journeys and Screens documents. I read the folder's README, its history and the mock journeys file.
- Whether the labels "R7", "R9", "R21" in the stored internal walks correspond to numbered journeys. I say only that two numbered journeys appear by name.
- The count of journeys that use AI is by script on one file, not by reading each journey.
- Whether the 68 browser-closed failures of 8 Nov were caused by Cloudflare's limits, by the runner, or by the walker. The report gives the message only.
- The live settings of either repository on GitHub (rulesets, collaborators). I read files only.
- Whether a session started on the process's repository from the `process4` branch would in fact merge a change there. I read what his approvals in that branch allow; I started no session.
- The diffs of the walker commits whose titles excuse or retire a step (carried from the first round).
- I did not re-derive the notification study and say nothing on its three open questions beyond appendix C.

---

## MAP

Rated: solid / stated but unproven / thin / contradictory / missing.

| Area | Rating | Why, in one line |
| --- | --- | --- |
| Roles and sessions | Stated but unproven | Clear on paper; five long-lived kinds, each replaced every few hours in Process3; the watcher is restored without the measured answer to his question, and who starts it is open |
| Flow of a job | Stated but unproven | The best-defined part. Open: changes that only pass together; who counts failed corrections; a flaw closed by a job saying nothing needs changing |
| Rounds, walks and tranche end | **Thin, and contradictory in one place** | The end is one session's reading against session-kept documents; the external walk as defined never ran; three journeys need the installer he put outside the tranche; rounds unbounded; no tranche size |
| Release | **Contradictory** | His sentence "always fully tested and walked", his 9 Nov words on AI, today's three answers and the draft's reading do not all hold together; installer, upgrade and AI can go out unwalked |
| Notification | Missing by design | Honestly marked as under study. The rule for when a module's work is finished already pre-empts part of it |
| PROCESS and process change | **Thin** | His words are clear; nothing physical holds them; the process's repository's own approvals say the opposite today; what waiting sessions do is undefined; "works round" is not his |
| Permissions and starting | Stated but unproven | Carefully reasoned and honest about what is unmeasured; the stop on an approvals edit is kept; his approvals now stand behind the permission checker alone |
| State and waking | Thin | The shared state is Process3's state branch under a new name with no stated bound; the hourly wake cannot tell waiting from dead |
| Recovery | Stated but unproven | Replacement of ARCH with jobs open, takeover by the watcher, restart after an approvals edit: all untried, two of them failed in Process3 |
| Reports | Thin | One report, at an end that may never come, written by the session it describes; nothing tells him a tranche is stalling |
| What is unbuilt | Solid as a statement | Section M is complete and plain. Missing from it: who removes the 212 Process3 test files; the two documents the walks need |
| What is unproven | Solid as a statement, thin as a plan | Section O is the most honest part of the draft. It still omits the one trial asked for twice: whether a walk of an unchanged build gives the same answer twice |

**Where the focus is still needed, in order:** the tranche's end and who may change what the walks are measured against (findings 1, 3); what holds the PROCESS rule (finding 2); what a release has been walked for (finding 5); what sessions do while they wait (finding 4); the product's repository as the place growth goes (finding 6).


# [file] interface_and_cycle.md

# What a module's interface is, and the order-breaking uses among four modules

Written 13 Nov 2026. Read-only analysis of `origin/tranche` in `/home/user/neobobkrause/civicsmith-copy`, with the notice records at the tip of `origin/process-state`. Nothing was changed, fetched or checked out: every blob read was already in the local object store.

## Summary

**Part 1. The interface.**

- **A module exposes its services through named exports of `.mjs` files, usually one `index.mjs`.** 152 of the 220 modules have one. Users do not keep to it: 388 of 3,088 source imports between modules (13%) reach into an internal file, and 110 modules are reached that way.
- **Imports are not the only way one module depends on another.** 181 declared uses by modules that own code have no import behind them. The other routes are instances handed in at run time, service bindings, SQL on another module's tables, word keys, declared-op tables, generated files and served pages.
- **No rule that names exported names alone can be sound here.** Replayed on the old process's own records, a rule that notifies only the users importing a changed or removed name would have caught 13 of 104 users judged affected.
- **The only recognition with no false negatives on that record is the coarse one: any change to a module's source notifies every declared user.** The old process did this, and 90% of the notifications were needless.
- **"Which parts changed" can be stated mechanically and precisely in three vocabularies:** exported names with their before and after signatures, public requirement ids, and the provider's own tests keyed by the id in their titles. It cannot yet be used to excuse a user mechanically.
- **The old process left a replay set:** 178 notices, 2,707 notifications and 2,342 written verdicts with evidence. It can score any new rule, once each notice's change is re-read at its own commit.

**Part 2. The four modules.**

- **The loop is in the module map, not in the code.** File by file, the imports already run one way: `untested.mjs` → `ask.mjs` → `draft.mjs` → `index.mjs`. The size split of 4 Nov put the bottom and middle files in one module and the files between and above them in another.
- **agent-runner is in the wrong place by a decision already taken.** The planning fold of 27 Oct placed it after ai-gate ("it is ai-gate's container") and took off agent-worker's use of it. The map was never brought into line.
- **Recommended: put the map right.** Move agent-runner after ai-gate, drop agent-worker's use of it, and give agent-drafts' three files back to agent-worker. No source file, import or test changes.
- **Three things need the owner.** The requirement size cap that caused the split; whether a member's own Claude sign-in through the runner still exists; and, for hypotheses and steps, whether one refusal may change places with another.

## Method and limits

- The module map is `build/modules.json`: 220 modules in one list, each with `paths`, `tests`, `uses` and a layer. A file belongs to the module with the longest matching path.
- Every `.mjs` and `.js` file under a module's paths or tests was parsed for `import`, `export … from` and `import()` statements: 5,385 files, 10,771 import statements that cross a module boundary. The parser is a comment-aware scanner with regular expressions, not a JavaScript parser. Code built inside template strings (child-process scripts in tests) is not seen.
- "Entry file" means `index.mjs` at the root of a module's directory, or each listed file where a module is a list of loose files.
- The sample is 36 modules across the order. Most figures are also given for all 220, because the whole tree could be measured.
- The replay uses the code as it stands at the tip, not as it stood when each notice was raised. The verdicts are the judgments of the old process's triage workers, not ground truth.
- Scripts are in `/tmp/claude-0/-home-user/5fb00928-6c32-53d3-a000-4e1f643cb17f/scratchpad/ic/` (`graph.py`, `analyse.py`, `stats.py`, `reqmap.py`, `cites.py`, `nonimport.py`).

---

# Part 1. What exactly is a module's interface?

## 1a. How a module exposes its services

### Entry files

| Shape | Modules |
| --- | --- |
| One `index.mjs` | 152 |
| One loose file (for example `idspaces.mjs`) | 10 |
| Several loose files, each its own entry (test-support has 14, bundler 11, runtime-limits 5) | 21 |
| No entry file | 37 |

Of the 37 with no entry file, 29 own no code at all: 18 own only a requirement file (the size-cap splits such as `jurisdictions-b`), and 11 have empty `paths`. The other 8 have code but no `index.mjs` at the root, for example agent-harness (`harness.mjs`, `subsession.mjs`), agent-model, agent-runner and docprofile.

`ai-issuer` has empty `paths` in the map but 11 code files in `ai-issuer/`. In all, 52 code files belong to no module, and they hold 75 imports of modules.

### Imports through the entry, and deep imports

| Importing file | To the provider's entry | To another file of the provider (deep) | To the provider's test files |
| --- | --- | --- | --- |
| Source, all 220 modules | 2,700 | 388 (13%) | 0 |
| Tests, all 220 modules | 5,794 | 635 (10%) | 1,254 |
| Source, the 36 sampled providers | 1,494 | 247 (14%) | 0 |
| Tests, the 36 sampled providers | 3,438 | 386 (10%) | 491 |

- The 388 deep source imports reach 173 files of 110 provider modules, from 84 user modules.
- The largest group is record-grammar: 139 deep source imports of its inner files (`actors.mjs` 31, `sha256.mjs` 20, `frontmatter.mjs` 18, `types.mjs` 18).
- A second group is each module's `checks.mjs`, imported whole as a namespace by `answer-envelope/families.mjs`.
- Among the four modules: ai-gate imports `agent-worker/src/ops.mjs` and `agent-worker/src/ask.mjs`; control-plane's, plane's and store-assembly's tests import `agent-worker/src/ops.mjs`.
- The 1,254 imports of another module's test files are the "published fixtures" and helpers the job rules require (`build/situations/job.md`: "it uses the provider's published fixture"). They are part of the provider's interface in practice, and they live under its tests, not its source.

### Declared uses against imports

- **Every source import is declared.** None of the 3,088 source imports points to a module missing from the importer's `uses`.
- **Tests are not held to the map.** 202 test imports go to a module the importer does not declare.
- **81 test imports point to a later module.** Six belong to the three known pairs. The other 75 are spread over 38 further pairs, none declared. Examples: membership's tests import credentials, ai-accounts, instance-setup and admission; ai-use's tests import store-request, store-assembly and admission; op-grades-folds' tests import op-grades (30 statements).
- **Of 3,120 declared uses, 1,936 have a source import, 792 have only a test import, and 392 have no import at all.** 211 of the 392 belong to the 29 modules without code. The other 181 are couplings that do not pass through an import, or stale declarations.

### Couplings without an import

| Route | Example | Extent |
| --- | --- | --- |
| An instance handed in at run time | `hypotheses` takes a steps instance (`deps.steps` or `bindSteps`) and calls its `registerRivalSource` and `stepsOfRival`; the comment reads "`steps` handed in, never imported" | 158 distinct `register…`/`on…` methods on module classes; 313 call sites |
| A service binding between deployed Workers | `agent-worker/wrangler.jsonc` line 97 binds `RUNNER` to agent-runner's class `AgentRunner`; the plane binds `AGENT_WORKER`, and agent-worker binds `PLANE` back | 5 fleet bindings on the plane; agent-worker calls the plane (module 209) over the wire with no declared use |
| SQL on another module's tables | inquiry, actions, reevaluation, queue and retrieval query record-core's `bundles`; public-read queries publication's `published_cases` | about 226 module pairs (pattern match, some noise); 24 not declared |
| Constants copied and held equal by tests | `TRACE_HEADER = "x-civicsmith-trace"` is defined in 7 files of 7 modules; agent-worker's `NAMESPACES` is "a COPY, because a fleet member cannot import the plane" | not counted |
| Word keys and a generated table | every sentence is `localize(id, en, vars)`; a build step extracts the table `setup-words/rows.mjs` | 8,250 call sites |
