**Who starts and who ends a lane.**
- Start: "BOB is the only creator of jobs and lanes" [F2]; "You identify the need for a lane and BOB opens it" [F4]; roles table "Lane | BOB, when you identify the need; some stay open, UX always" [F5]; 6 Nov answer as a session recorded it: "BOB starts jobs and lanes, not ROOT" [R9]. Against: ledger statement "BOB defines lanes without Bob's approval" [L4]; and for PROCESS, "M1: ROOT" [O3].
- End: silent in his words. "some stay open for extended periods; the UX lane is always there" [F4]; "A long-lived lane refreshes under BOB's management so depth stays consistent" [F5, L2].

**How lanes talk to each other, to ARCH, the coordinator, ROOT and him.**
- Through the architecture session only [F3, L4, L3].
- "Lanes work because BOB knows how to delegate: it recognises a design question, passes it to the lane with enough context to decide, waits for the lane's decision, and keeps the final say." [F4]
- To him: "design documents that lanes create/update/interact with me using are CC artifacts" [R5b]. The ux lane's boundary with him, recorded as his "agreed" [C5].
- PROCESS: "that I interact with" [O1]; "ARCH can ask ROOT to start PROCESS if it isn't already running, and the coordinator can talk to PROCESS" [O3].
- ROOT and lanes otherwise, the coordinator and design lanes, the watcher and lanes: silent.

**What a design lane is and produces.** Designs, never product code [L4]. For ux: "the design stream (docs/development/ux-substrate)" [A1]; "it writes and updates design documents (like the UX Design doc). The UX design lane can create the word table" [R3]. His typed words of 14 Nov connect that folder to the two walks: "screens and journeys are kept in docs/development/ux-substrate/ in the product repo" [O5]; "An internal walk uses the UX Screens document ... The external walk follows the UX journeys" [O4]. The folder's own README (a session's text): "This folder holds only what the product's build and checks read (Bob, 5 Nov 2026). The design documents are claude.ai artifacts, kept by the ux lane"; it lists "Journeys" and "Screens" as claude.ai links [C6].

**Qualification.** "a lane is fully qualified to fulfill their role as the load-bearing source of truth in their area"; first run "should start by using workers to fully research canon documents, existing code, and best practices"; research "recording in a lane-specific area of the product repo for subsequent sessions to draw from and evolve" [R6]. All three are a session's quotation of him.

**PROCESS in his words.** [O1] in full, [O2], [O3]. A lane; he interacts with it; it explains the problem and offers options; several proposals may be open at once and are considered together; the changed process must still meet the Process4 requirements; a product moves to a changed process only with his prior approval; ROOT starts it; ARCH can ask ROOT to start it; the coordinator can talk to it; it holds "the processes".

**Limits.**
- One session per lane at a time [A1, R2].
- Depth: "depth stays at most 3 (coordinator, ROOT, BOB, job)" [L5]; the ledger's source line for it is "lane reached depth 4 in a day" [L5].
- Eight slots: "O8: across the account" [O6], said of job slots. Nothing in his documents says whether a lane session takes a slot.
- How many lanes at once: silent.

### Gaps and contradictions (both sides quoted)

| # | Subject | One side | Other side |
| --- | --- | --- | --- |
| G1 | Who starts a lane | "BOB is the only creator of jobs and lanes" (F-ev:67); "BOB starts jobs and lanes, not ROOT" (CLOG:733, session's record of his 6 Nov answer) | "Process changes only happen in a separate process lane call PROCESS" (OW-b:25) with "M1: ROOT" (OW-c:25). APX:268 flags this |
| G2 | Who decides that a lane exists | "You identify the need for a lane and BOB opens it" (F-ev:81) | "BOB defines lanes without Bob's approval" (LL:1584, the ledger statement; his note LL:1588 keeps the line "for questions that are Bob's by P17 only" and says "Lanes stay as SES-14 (modify) and SES-15 settled them", which settles neither) |
| G3 | Standing session or helper started on demand | "plus an on-demand worker BOB starts ...; a long-lived lane only where measured worthwhile" (LL:1033); "whether any lane runs as a long-lived session is measured" (F-ev:81) | "I'm not sure we should say that a lane is a read-only helper ... it writes and updates design documents" (CLOG:647); "each lane runs as one session at a time" (COPY-T:CLAUDE.md:11). The measurement was never taken (APX:395 keeps it; `process4_disposition.tsv:279` "Not measured") |
| G4 | Where screens and journeys live | "Their design documents are claude.ai artifacts, not repository files." (COPY-T:CLAUDE.md:11) | "screens and journeys are kept in docs/development/ux-substrate/ in the product repo" (OW-c:51) |
| G5 | Lane changes and the three tests | "lands through the merge tool without a test suite run" (COPY-T:CLAUDE.md:11) | The walks are measured against documents the ux lane owns and changes (OW-b:9, OW-c:51). His words do not say whether a lane change to those documents between walks is allowed. `working/audit2_corruption.md:463` (A): "The ux lane made 61 of 63 commits to the folder the walks are measured against" |
| G6 | Who he talks to | "interact with me" (CLOG:651); "that I interact with" (OW-b:25) | "The coordinator session is the front door." (V5:97, the session's record of 13 Nov) |
| G7 | Triage lanes and PROCESS | "A process triage lane and a product triage lane study each identified problem and bring you options with context before a response is chosen" (P3T:governing/foundations.md:44) | "Process changes only happen in a separate process lane call PROCESS" (OW-b:25). Nothing says whether PROCESS is the process triage lane renamed, or whether a product triage lane remains |
| G8 | Folder owner: lane or module | "own their lane folders" (COPY-T:CLAUDE.md:11) | "a job writes only its own module's files. Kept." (V5:94, session's record); the config gives the ux lane a module, `ux-design` (COPY-T:process/config.json:28-32) |
| G9 | Built files | "the large files a lane's generators build are built at layer close, deploy and release, never committed" (COPY-T:CLAUDE.md:11) | "The layer construct is dropped." (V5:87, session's record). V5:305 has Claude decide that the module's own job builds and commits built files (raised at `working/audit2_requirements.md:83`) |
| G10 | Slots | "O8: across the account" (OW-c:41) | Silent on lanes, on PROCESS, on the coordinator and on the watcher |
| G11 | Ending a lane | "some stay open for extended periods; the UX lane is always there" (F-ev:81) | Silent on who ends one and when |

## 4. What the fifth draft says about lanes

All (V), line numbers of `process4_definition_v5.md`.

- 141: "**A design lane** is, in your ledger note, "a knowledge directory and design responsibility". ARCH defines lanes and starts a helper or session for one when a design is needed. It delivers designs, never product code. A lane's pull request merges with no test; that clause is in your approvals."
- 143: "**PROCESS** is the lane where the process is changed: a session you talk to (section H)."
- 119: his act "At PROCESS: choose among the options offered for a process change, and approve a product's move to the changed process".
- 129: ROOT "starts PROCESS when ARCH asks (section H)".
- 257: his words on PROCESS, quoted in full. 259-275: the rule PROCESS works under; who starts it ("ROOT"); how a fault reaches it; which repository ("the processes"); "None of this has run."
- 362: "No Process4 role texts exist, and no PROCESS lane."
- 135: ARCH "settles a design before anything is built on it" (no lane named).
- 151: "Sessions are at most three levels deep, and none starts its own replacement." (lanes not placed).

**Omitted** (statement number, then what is missing):

- [F4, F1] "You identify the need for a lane"; "the UX lane is always there". APX:165 and APX:257 already note the second.
- [L4, F3] Jobs and lanes reach a lane only through the architecture session; that session keeps the final say.
- [L4] "reads it whole".
- [A1, R2] One session per lane at a time.
- [A1] Lanes own their folders; they decide design and wording "Within the product's principles"; design documents are claude.ai pages.
- [R6] Qualification, the research area, research before any answer.
- [R6, R8, C3] The three Civicsmith lanes.
- [G2] The triage lanes.
- [F6] The decision by measurement between a standing session and a helper (APX:395 marks TM-5 "Kept as written" at "C (a design lane)"; line 141 says "a helper or session" and names no measurement) (J).
- Whether lanes take slots, who ends a lane, how a lane hands over, on which repository and branch it starts, whether Bob talks to it.

**Contradicted or changed.**

- 141 "ARCH defines lanes" against F-ev:81 "You identify the need for a lane and BOB opens it". APX:165 records it as "way changed. Nobody named". (It agrees with the ledger statement LL:1584; see G2.)
- 141 "A lane's pull request merges with no test" is wider than the approvals, which limit it to "A pull request that changes only files in its own lane's folder" (COPY-T:CLAUDE.md:11).
- 141 "that clause is in your approvals": true only of the product's tranche branch. It is not in the process repository's CLAUDE.md nor on the product's main (V).
- 129 and 270, ROOT starts PROCESS, against F-ev:67. This follows his typed hint; APX:268 lists it.
- 305, built files committed by the module's job, against the approvals' "never committed" (G9).
- 185 "Which exact files each walk reads is Claude's to settle in the build" while the approvals give that folder to the ux lane (G4, G5).

## 5. Questions that only Bob can answer, and points for Claude

**Bob's** (his documents contradict each other or are silent on something that is his to define):

1. G1. Does only ARCH start lanes, with PROCESS the one exception that ROOT starts; or do his 14 Nov words change who starts lanes generally?
2. G7. Is PROCESS the process triage lane under a new name, and does a product triage lane remain?
3. G6. Does he work directly with design lanes (as his 5 Nov words describe), or only through the coordinator?
4. G2 with [R6]. Which lanes does Process4 start with for Civicsmith (ux, investigation, publication), and does a new lane need his word or may ARCH define one?
5. G4 and G5. Which governs for the documents the walks are measured against: claude.ai pages kept by the ux lane, or files in the folder; and may the lane change them while a tranche runs.
6. G10. Does a lane session (and PROCESS) count against the eight slots.

His lane statements of 5 and 6 Nov ([R2] to [R9], [G2], [A1]) are his by sessions' records and by his approvals. By the handoff's lesson 2 they change only by a proposal he answers; whether each still stands in Process4 is his.

**Claude's to decide and report:** how a lane session is started (repository, branch, starting text); how one session per lane is held; how a lane hands over and how depth is kept; where the research area is; how asks and answers between ARCH and a lane are recorded; how a lane's folder-only change merges; the file-against-module ownership of a lane's folder (G8); what replaces "layer close" in the built-files clause (G9), put to him as a proposal because the clause is in his approvals; how the 6 Nov measurement in [F6] is settled.

## 6. Wrong or stale in the handoff, the audits and the rules

- `worker_rules.md` rule 3 and HANDOFF line 51 place his standing approvals in `/home/user/process3/CLAUDE.md`. That file has no sentence on lanes. The lanes paragraph is in the product repository's CLAUDE.md on its `tranche` branch (V).
- HANDOFF line 51: "Lanes are barely present in the fifth draft." Confirmed: lines 141 and 143, plus section H for PROCESS (V).
- `evidence/foundations.md` is the 31 Oct to 4 Nov text. A later snapshot with his 6 Nov lane requirements exists at `origin/tranche:governing/foundations.md` in the process repository and is not in the evidence folder (V). The 288-line disposition therefore has no line for lane qualification, the three lanes, the triage lanes or "BOB starts jobs and lanes, not ROOT".
- `evidence/ledger_lines.md` covers the first Keep and Drop page only (159 lines, exported 5 Nov). A second page answered 6 Nov (SLB and AUD lines) is known here only through sessions' records (CLOG:733; P3T:governing).
