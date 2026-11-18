
### Finding 16. How a process fault is reported, and the cost alarm (MSG-5 silently dropped; MNT-7 by the blanket; GAP-2 part dropped)

1. Lines: MSG-5 (kept): "A flaw report from a product session reaches the process by the state branch and the reply by main of the process repository". MNT-7 (kept): "A flaw report is filed from any session by one command, listed at each status, answered by main; a flaw found anywhere is never fixed in place." GAP-2 (kept): "its cost per attempt is an alarm the sweep reads, not a cap."
2. Main text: E: "**The process itself has a fault.** Claude fixes it." K technical point 2: "a short session started for that one fix". K technical point 1 ends the state branch that MSG-5 travels on. I 4: "end it as a duty on jobs. Report cost where it can be read." Nothing says who reports a fault, to whom, who starts the fix session, or that a fault is "never fixed in place". Nothing says the cost alarm ends.
3. Evidence: MEASURED: both routes were "never built" (`ledger_map.md`: later gate). REASONING for the effect.
4. How bad: costs time; a job that works around a fault in place is the Process3 pattern.
5. Proposed correction: E: "A session that finds a fault in the process reports it to ARCH and does not fix it where it stands. ARCH starts the fix session." I 4: add "The cost alarm in your ledger goes with it."

### Finding 17. Decision records (REC-11, silently dropped)

1. Line: REC-11 (kept): "Decisions go to short architecture decision records the moment they are made, each in its own file, never as a line in a long plan."
2. Main text: nothing says where ARCH's technical decisions, or your decisions, are kept. G counts the line among the 45 whose way is "set by your decisions or still open"; no way is set and K lists none as open.
3. Evidence: MEASURED: "DECISIONS.md went from nothing to 49 KB and 31 headings in four days, in one file"; "23 of the 26 PD records are headed "coordinator"" (disposition row REC-11).
4. How bad: misleads Bob (ARCH "tells you in plain words what it did", with no place named).
5. Proposed correction: G, "The record": "A decision is written once, where it is made: yours in your own words, ARCH's in the pull request it concerns." Or declare the line ended and name the decider.

### Finding 18. The shadow slice has become a list of small trials, and section J says a small trial can "prove" (MNT-8 changed from nowhere; dropped MNT-12 echoed)

1. Lines: MNT-8 (modified; first sentence is Bob's): "Certification is a long-term goal that indicates that it's ready for general use. ... one shadow of a representative slice, then the live first tranche is the certification with SES-11 and SES-12 measured". MNT-12 (dropped by Bob): "A process is declared in force the day it is written, certified on a two-module toy."
2. Main text: J: "Each item is a claim, then the smallest trial that would prove or break it." J6: "*Trial:* two slots, three modules with work." J2: "*Trial:* one run through."
3. Evidence: MEASURED: "Toy flaws and product flaws were disjoint" (`foundations.md` line 260, the reason MNT-12 was dropped). Section J8 itself is careful ("It cannot prove it"); the header sentence is not.
4. How bad: misleads Bob (a passed toy trial read as proof).
5. Proposed correction: J header: "Each item is a claim, then the smallest trial that could break it. A trial that passes proves nothing by itself: your ledger makes a slice of the real product, and then the first real tranche, the proof." No trial is added.

### Finding 19. The per-line test is ended at I 8 but still stands in a note re-saved on 14 Nov (TXT-1, contradicted in part)

1. Line: TXT-1 (modified; note as stored 2026-11-14T00:15:24Z): "hand-written means BOB writes and keeps the product's CLAUDE.md line by line, each line passing the per-line test ... each change listed in the tranche report; the approvals block stays Bob's own."
2. Main text: I 8: "**A line-by-line test of instruction files in place of a size limit** (two lines). ... *Claude decided:* end it."
3. Evidence: MEASURED (the store). The store cannot show who re-saved the note.
4. How bad: minor; a third line is touched and not counted.
5. Proposed correction: I 8: "(two lines, and a clause in a third: the note on who writes the product's CLAUDE.md, re-saved on 14 Nov, still asks for it)".

### Finding 20. Which document governs (GAP-9, by the blanket)

1. Line: GAP-9 (kept): "The Ledger, the Foundations and the Build Plan agree ... no build starts on a line any of them contradicts."
2. Main text: the opening, "The appendix shows where each of your 288 requirement lines went." After this definition the store still shows "keep" or "modify", not "drop", for all 22 lines the definition ends, INT-4 among them.
3. Evidence: MEASURED: a session restored a removed check by citing ledger lines (finding 1).
4. Proposed correction: G, last bullet: add "Where this definition and the Ledger differ, the definition governs once you accept it. No session changes your stored answers."

### Finding 21. The module order is repaired by Claude alone (P4, part)

1. Line: P4 (kept): "BOB, with Bob, defines layers and modules in one total order".
2. Main text: K technical point 8: "*Decided:* correct the module list where the code already runs one way, and turn one registration between two modules around. Nothing a user sees changes."
3. Evidence: MEASURED: the session's own record said the repair "depends on two things that are yours" (`assessment_doc.txt` line 47). One of the two (the size cap) is ended at I 3; the other (a sign-in relay to retired routes) is not mentioned.
4. Proposed correction: K technical point 8: add "Your line has the order defined with you; this repair moves three modules and is reported here for that reason. The session's record named one thing in it as yours, a sign-in relay to retired routes; Claude judges it changes nothing a user sees."

### Finding 22. Long steps (PLT-4)

Line: "No step runs longer than the in-session background limit; anything that can is a CI workflow." Main text: C "several sessions walk it there ... Each external walk took about an hour." The main text does not say that the walk's steps run on GitHub's machines. MEASURED: 60 and 64 minutes (disposition row PLT-4); PLATFORM: the limit is about thirty minutes. Proposed correction: C, "End of a round": "The walking sessions start the journeys on GitHub's machines and read the results; no session runs a step longer than the platform's limit."

### Finding 23. Twenty measurements where your line says one (GAP-11, contradicted in part)

Line: GAP-11 (kept): "A platform behaviour is measured once by default, more only when the first result is ambiguous or a failure recurs". Main text: J1: "*Trial:* twenty or more merges by ARCH". The reason exists (the checker passes and refuses the same act minutes apart, PLT-2's source) but is not given. Proposed correction: J1: "Twenty, not one, because the checker has passed and refused the same act minutes apart."

## 3. The eight dropped lines

None comes back as a rule. Checked one by one:

| Dropped line | In the main text? |
| --- | --- |
| ENF-4 a hook refuses a short read | No. Its softer successor, the reading audit, is ended by Claude (I 10). |
| ENF-5 a hook refuses a turn's end until a refresh | No. |
| REC-12 a multi-writer issue tracker | No. |
| INT-6 a mandated test-first red step | No. The nearest thing, the revert check, is ended in H. |
| MSG-7 doorbell and mailbox | No. Notices are work against a module, not a mailbox. |
| MNT-2 the process as twelve modules | No. |
| MNT-12 in force the day written, certified on a toy | Echoed in J's header sentence (finding 18). J's first sentence says the opposite. |
| P16 every rule names its principle; principles change only with Bob's approval | No. The wall in K gives Bob the say over every change to the process, which is a different thing and is put to him as a question. |

## 4. Additions: things in the main text that no line and no decision of Bob's asks for

Bob's rule is that the definition starts from his documents and designs nothing afresh. Each of these is labelled "Claude decided" in the text unless noted. None is hidden; all are new.

| # | Addition | Main-text sentence | Why it is new | Proposed correction |
| --- | --- | --- | --- | --- |
| A1 | A release walk on a copy installed by the real installer | C: "Claude decided that this walk is run on a copy installed with the real installer, since a development deployment does not use the installer." | A new mechanism. The worker who studied it called it "unbuilt and unproven" (`k_evidence.md` line 99). It is not in section J, so the text asserts something unmeasured. It also sits oddly beside D: "there is no separate install test ... before a release". | Remove the sentence, leaving "It must have passed an external walk, as your documents say." Or keep it and add it to J as unproven and unbuilt. |
| A2 | The external walk run by a fixed rule after every tranche | C: "Claude decided how the option works: a fixed rule runs it after every tranche, no session chooses, and you skip it by telling the coordinator." | The session's record says only "An optional ... walk runs after that". Run by default, with its findings made "the first work of the next tranche", it works as a fourth standing test beside "exactly three tests, and no others, ever", and exercising the option becomes an act of Bob's. | "It runs when you ask for it, and before a public release, which your documents require. It is not one of the three tests and holds nothing back." This removes a standing run. |
| A3 | A new item in the tranche report | G: "Claude decided that it also carries the walk result at the end of each round: steps passing out of steps in all, with any steps added or removed since the last round shown beside it" | A new record kept round by round, replacing two measures Claude retired (K point 5), while three things Bob's lines put in the report are left out (finding 11). | Remove "with any steps added or removed since the last round shown beside it". State the caution once in J11 instead: "sessions write the walk's steps, and in Process3 the count moved". |
| A4 | A new kind of session: the process-fix session | K technical point 2: "a short session started for that one fix and ended when the fix is merged, by itself or by you" | Not among B's roles. Bob's line MNT-1 has the process built "as a product under itself", by jobs. Who starts it and at what depth is not said. The heading's second half ("which repository the coordinator holds") is not answered. | Add it to B with its starter and depth, and say in K: "This replaces your line that the process is built like a product, by jobs in tranches; Claude decided." Answer the second half or delete it. |
| A5 | The wall and what comes with it | K: "It reaches the process only when you press the merge button"; "Each fix comes to you with one plain sentence ... and the size of the process before and after"; "keeping the version of the process that a product uses where only you can move it, and running the module tests from a place a job's pull request cannot alter" | A new act of Bob's for every fix, a new record, a second new act (moving the version), and a new mechanism. The text says honestly "Your requirements exclude such an act today" (GAP-10, P19, MNT-5). | It is put as a question, which is the right form. Add to "Why it matters to you": "Taking the wall also makes moving the process version an act of yours, and ends your line that a blocking fix is adopted without you." |
| A6 | A comparison at the end of every round of the first tranche | J9: "at each round's end in the first tranche, compare the process's files with round 1" | Called a trial, but it recurs through a real tranche and no session is named to do it. | "At the end of the first tranche, compare the process's files with those at its start." One measurement, once. |
| A7 | Two small reports | C: "The process prepares the release and shows you what it carries." K technical point 7: "ARCH, which reports it." | New, small, harmless. | Leave, or drop "and shows you what it carries" (GAP-7 asks only for the approval). |

