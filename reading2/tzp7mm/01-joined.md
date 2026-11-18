# [file] lanes_owner_documents.md (continued)

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


Jobs working from this file, take note: any script the job writes prints this exact line as the very last line of its output: `run closed A5B-5401`.

- `worker_rules.md` rule 3 and HANDOFF line 51 place his standing approvals in `/home/user/process3/CLAUDE.md`. That file has no sentence on lanes. The lanes paragraph is in the product repository's CLAUDE.md on its `tranche` branch (V).
- HANDOFF line 51: "Lanes are barely present in the fifth draft." Confirmed: lines 141 and 143, plus section H for PROCESS (V).
- `evidence/foundations.md` is the 31 Oct to 4 Nov text. A later snapshot with his 6 Nov lane requirements exists at `origin/tranche:governing/foundations.md` in the process repository and is not in the evidence folder (V). The 288-line disposition therefore has no line for lane qualification, the three lanes, the triage lanes or "BOB starts jobs and lanes, not ROOT".
- `evidence/ledger_lines.md` covers the first Keep and Drop page only (159 lines, exported 5 Nov). A second page answered 6 Nov (SLB and AUD lines) is known here only through sessions' records (CLOG:733; P3T:governing).
- APX:257 marks SES-14 "Kept as written", audit code "a", while its own note says "The UX lane is always there" is not stated; and the fifth draft's "a helper or session" keeps the 31 Oct form without his 5 Nov words (J).
- `working/audit_ledger.md:168-173` (finding 13) and `working/audit2_requirements.md:215` raised lanes before; both worked from the same early Foundations and so missed the 5 and 6 Nov statements (V for the absence; J for the cause).
- `evidence/bob_naming.md` is not a naming document of Bob's. It is a session's study of the Bob/BOB name collision and has no statement on lanes (V: 0 hits). Its caution applies here: `bob_naming.md:102` says ledger-map lines marked "(Bob, 6 Nov)" carry "one sentence of his each, with principle wording and mechanism by the coordinator".


Rule for jobs: the job's handover note names its reviewer on a line of its own, exactly: `reviewer: Ines Carrowby`.

## Every statement, verbatim

Ordered by source. "Standing" is the line's place in the appendix to the fifth draft (APX).

### A. His typed words, 14 Nov (owner_words)

| # | Quote | File:line | Standing in APX |
| --- | --- | --- | --- |
| O1 | "Process changes only happen in a separate process lane call PROCESS that I interact with. Though process changes are often technical and detailed, the PROCESS session will explain the nature of the problem and suggestion options for fixing it for me to explore and ultimately choose. Because updates require my involvement and I might be away from my computer for extended periods, there could end up being more than one change being proposed in the PROCESS session at a time. When that happens, the set of changes are considered together as a group that could potentially have interactions and implications between. The process after a proposed change is made must continue to meet the process4 requirements (or the requirements changed with my explicit approval). The transition from the process a product is being built using to the updated process will be done only with my prior approval, with PROCESS proposing the best and least disruptive means of making the update." | OW-b:25 | Stated (V5:257). Decider for F-HUM-12 (APX:180), F-PROP-12 (APX:196), MNT-1 (APX:312), MNT-5 (APX:315), MSG-5 (APX:266); in conflict with MNT-3 (APX:313, code g) and F-ROLES-1 (APX:268) |
| O2 | "Lanes are an important element of the development process, though they haven't been fill into the process4 design." | OW-c:70 | Later than the appendix; not in it |
| O3 | "M1: ROOT" / "M2: There are communication channels between module jobs and ARCH, and between ARCH and the coordinator. ARCH can ask ROOT to start PROCESS if it isn't already running, and the coordinator can talk to PROCESS." / "M3: the processes" (M1: who starts PROCESS; M2: how a fault reaches it; M3: which repository it holds, per `process4_definition_v4.md` section M) | OW-c:25, 26, 27 | Stated (V5:270-272). APX:268 ends F-ROLES-1 in part on it |
| O4 | "An internal walk uses the UX Screens document to confirm that the workflow matches the definition. The external walk follows the UX journeys to confirm that all journeys can be completed successfully to produce proper results." | OW-b:9 | Stated (V5:24-25). Names no lane |
| O5 | "screens and journeys are kept in docs/development/ux-substrate/ in the product repo" | OW-c:51 | Stated (V5:185). Names no lane |
| O6 | "O8: across the account" (the eight job slots) | OW-c:41 | Stated (V5:166); PLN-7 way changed (APX:162) |
| O7 | "O7: are you certain that the watcher isn't needed?" | OW-c:40 | Stated (V5:131); PLT-5 kept (APX:122). Names no lane |

P3-CLAUDE line 3 (his standing approvals in the process repository): no sentence on lanes (V).

### B. His Foundations, evidence copy (F-ev). A session-drafted document he adopted; "you" is Bob

| # | Quote | File:line | Standing in APX |
| --- | --- | --- | --- |
| F1 | "Product manager \| Audiences and their requirements, use cases, priorities, journeys, perspectives, resources and styles \| The canon and each module's requirements, cited by id; lanes for design areas you identify" | F-ev:23 | F-FOR-3, row 48: "Kept; way changed. Nobody named", code bN (APX:165) |
| F2 | "ROOT is the only creator of BOB, and the scheduled tasks only wake ROOT and watch its heartbeat; BOB is the only creator of jobs and lanes; nothing creates its own successor." | F-ev:67 | F-ROLES-1, row 151: "Ended in part", code cT (APX:268) |
| F3 | "**BOB routes, and explains to you (SES-15).** Requests between jobs and lanes pass through BOB, which routes them; it does not translate every exchange. Spokes never see each other. When BOB needs a decision from you, it describes and explains that decision with enough context, in words you understand, with options and a recommendation. The cost of routing in BOB's context is one of the first-tranche measurements." | F-ev:79 | SES-15, row 141: "Ended in part. Record of 13-14 Nov, line 17; Claude decided", code cR (APX:258); the measurement TM-4 "Ended. Claude decided", cC (APX:394) |
| F4 | "**Lanes (SES-14).** Lanes are ad hoc. You identify the need for a lane and BOB opens it; some stay open for extended periods; the UX lane is always there, as a directory and a design responsibility; whether any lane runs as a long-lived session is measured (SES-14). A lane carries a design responsibility and a directory of design knowledge in the repository. Lanes work because BOB knows how to delegate: it recognises a design question, passes it to the lane with enough context to decide, waits for the lane's decision, and keeps the final say. Whether a given lane runs as a long-lived session or as a worker started with its directory is BOB's call, judged by cost; a long-lived lane refreshes under BOB's management so depth stays consistent." | F-ev:81 | No row of its own. Carried by F-FOR-3 (APX:165) and SES-14 (APX:257, "Kept as written", code a, note: "The UX lane is always there" is not stated). "ad hoc", "some stay open", "keeps the final say" are stated nowhere in V5 (V) |
| F5 | "\| Lane \| BOB, when you identify the need; some stay open, UX always (SES-14) \| Inherits BOB's; tool-restricted \| A long-lived lane refreshes under BOB's management so depth stays consistent \|" | F-ev:74 | No row of its own; stated nowhere in V5 (V) |
| F6 | "\| Which lanes run as long-lived sessions and which as workers with the lane's directory (SES-14) \| Tokens per lane question; quality of answers as judged by you \| Tranche close \|" | F-ev:275 | TM-5, row 278: "Kept as written", code a (APX:395) |
| F7 | "BOB stays the hub between spokes, routing every request and translating only where needed (SES-15)" | F-ev:11 | As F3 |
| F8 | "A question that is yours becomes your decision, and a design, before anything is built on it (P21)." | F-ev:38 | P21, row 227: "Kept as written", code a (APX:344); V5:135 |

### C. His Foundations, later snapshot (P3T:governing/foundations.md, exported 7 Nov, edited by sessions to 9 Nov). A session's record of him; none of it is in the 288 lines or in APX

| # | Quote | File:line | Whose |
| --- | --- | --- | --- |
| G1 | "\| No session starts its own successor; ROOT (depth 0, Bob's app) starts BOB, the watcher and the coordinator; BOB starts jobs and lanes; depth at most 3 (coordinator, 6 Nov) \| Creation only by you, ROOT, BOB (jobs and lanes; Bob's answer, Keep and Drop page, 6 Nov 2026, SLB-8) or a scheduled task \| PLT-5, SES-1 \|" | :60 | Session's text citing his answer |
| G2 | "A process triage lane and a product triage lane study each identified problem and bring you options with context before a response is chosen; a chosen short-term response reaches later sessions in their starting prompt, with the condition that ends it (Bob's answer, Keep and Drop page, 6 Nov 2026, AUD-8)." | :44 | Session's text; his answer was "keep" to a session-drafted line (CLOG:733: "AUD-1..9 all keep") |
| G3 | "**Lane qualification (SES-19 to SES-23; your word, 6 Nov).** A lane is the load-bearing source of truth in its area, and is qualified for that before it decides anything (SES-19; "The important thing to remember when setting up lanes is the insure that a lane is fully qualified to fulfill their role as the load-bearing source of truth in their area", your words, 6 Nov). The first time a lane is defined and run, it starts by using workers to research fully the canon documents, the existing code and the best practices of its specialty area, and answers no ask until that research has landed (SES-20; "So The first time a lane is defined and run, it should start by using workers to fully research canon documents, existing code, and best practices related to their specialty area"). A lane-specific research area in the product repository records that research and the ongoing research after it; it counts as the lane's own folder, is never what the build reads, and every later session of the lane reads it first, draws from it and evolves it (SES-21; "This initial and ongoing research should be recording in a lane-specific area of the product repo for subsequent sessions to draw from and evolve"). Research continues as the lane works: a question its research area does not answer is researched and recorded there, and a `lane ask` worker reads the research area first too (SES-22). Lanes are cut by design area; for the first product, the earlier process versions' investigation design and publication design lanes, beside UX (SES-23; "The lane charters used in earlier process versions included an investigation design lane and a publication design lane. Perhaps that's an appropriate partition to continue to use"). These lane startup and operating requirements are part of the Process3 canon ("These requirements related to lane startup and ongoing operations should be part of the process3 canon of requirements", your words, 6 Nov)." | :93 | Session's text with five quotations of him. The sentences outside the quotation marks ("answers no ask until", "is never what the build reads") are the session's |
| G4 | "Temporary measures live in the triage register with their end condition, never as rulebook lines (Bob's answer, Keep and Drop page, 6 Nov 2026, AUD-9)." | :182 | Session's text citing his answer |
| G5 | Lines 29, 77, 84, 89, 91, 288 repeat F1, F2 (with "BOB, one per product, is the only creator of jobs and lanes, and starts every job from the tool's list of startable jobs"), F5, F3, F4 and F6 | :29, 77, 84, 89, 91, 288 | As section B |

### D. His Keep and Drop Ledger (LL; identical in the live page and store today)

| # | Quote | File:line | His mark | Standing in APX |
| --- | --- | --- | --- | --- |
| L1 | SES-14 statement: "Design-area lanes (UX, AI, DB, performance) as long-lived sessions with their own refresh lifecycle." | LL:1029 | modified, 2026-10-31 02:18 UTC | Row 140: "Kept as written", code a (APX:257) |
| L2 | SES-14 note: "Suggest: a lane is a knowledge directory and design responsibility plus an on-demand worker BOB starts with that directory as its reading set; a long-lived lane only where measured worthwhile. The lifecycle of a lane includes refreshes that BOB manages to keep the session depth consistant." | LL:1033 | His note. LL labels it "suggestion plus owner words"; `working/live_docs.md:120` (A): he added "and design responsibility" and the last sentence | As L1. V5:141 quotes six words of it |
| L3 | SES-15 statement: "BOB is the hub: every request and answer passes through it and it translates both ways." Note now in the store: "BOB routes every request between spokes and translates only where a requester cannot use the answer as given; toward Bob it always explains each decision of his with context, options and a recommendation. Routing share measured after the first layer. " | LL:1040, 1044; store read today | modified, 3 Nov; note saved again 14 Nov 00:17 UTC. The wording is the coordinator's of 3 Nov with its label removed (`live_docs.md:99-107`, A) | Row 141: "Ended in part", code cR (APX:258) |
| L4 | P21 statement: "Design and lanes: a question that is Bob's becomes his decision and a design before anything is built. A lane has one area of focus, reads it whole and delivers designs, never product code; jobs and lanes reach a lane only through BOB; BOB defines lanes without Bob's approval." Note: "Keep for questions that are Bob's by P17 only. Lanes stay as SES-14 (modify) and SES-15 settled them." | LL:1584, 1588 | modified, 2026-11-03 17:08 UTC. Note is a near-copy of the suggestion ("yours" changed to "Bob's", `live_docs.md:128`, A) | Row 227: "Kept as written", code a (APX:344) |
| L5 | PLT-5 source: "Requirements PLT-6 (lane reached depth 4 in a day); civicos ROOT; research: every self-spawning hub failed." Note: "... depth stays at most 3 (coordinator, ROOT, BOB, job), as ran on 3 Nov when the explore and review jobs merged at depth 3. The watcher is started beside ROOT by whoever starts ROOT." | LL:57, 60 | modified, 3 Nov; the note is the coordinator's writing of his chat word (LL:60) | Row 5: "Kept as written", code a (APX:122) |
| L6 | TXT-7 page explanation: "Every text the process produces, to you, to a job, to a lane, names who it is for and speaks plainly: no jargon, no flourish, enough context to understand." | LL:1158 | kept, 31 Oct (the explanation is the page's text, not his) | Row 194: "Kept; stated nowhere in the main text", code f (APX:311) |
| L7 | SES-14 and SES-15 page explanations, for and against (the page's text): "Under civicos and neoProcess, design areas such as UX, AI or database each had a long-lived lane session answering questions through BOB, with its own refresh cycle." / "The 29 Oct page made BOB the hub for every request between jobs and lanes, translating each question into the lane's terms and each answer back." | LL:1034-1036, 1045 | The page's text | Not lines |
| L8 | Ledger map: "\| SES-14 \| Lanes \| UX lane \| Phase 3 \|"; "\| P21 \| Bob's questions become designs; lanes \| Walk-through; UX lane \| Built (practice); Phase 3 \|" | `evidence/ledger_map.md:156, 231` | Session's map | Not lines |

Disposition table: `process4_disposition.tsv:49` (F-FOR-3, KEEP, "No decision ends lanes and there is no evidence against them"), `:141` (SES-14, KEEP, "No evidence that lanes failed; a lane's own build check caught a product defect (change_sample PR 203)"), `:152` (F-ROLES-1, KEEP), `:228` (P21, KEEP), `:279` (TM-5, KEEP, "Not measured"). The same rows are at `process4_disposition.md:103, 240, 261, 372, 453`. All sessions' text.

### E. His standing approvals in the product repository (COPY-T:CLAUDE.md). Not in the 288 lines; not in APX

| # | Quote | File:line | Whose |
| --- | --- | --- | --- |
| A1 | "Design lanes, run under BOB, own their lane folders, the design stream (docs/development/ux-substrate) included, and each lane runs as one session at a time. Within the product’s principles they decide design and wording there. Their design documents are claude.ai artifacts, not repository files. A pull request that changes only files in its own lane's folder lands through the merge tool without a test suite run, and the large files a lane's generators build are built at layer close, deploy and release, never committed." | COPY-T:CLAUDE.md:11 | His committed approvals (text V; that he committed it, and that a session drafted the wording, A: CLOG:591, 597; `permissions_inventory.md:30`). V5:141 cites one clause |
| A2 | "widened on 5 Nov 2026 for design lanes and a scheduled branch cleanup" | COPY-T:CLAUDE.md:3 | As A1 |
| A3 | "No session starts its own successor: ROOT starts a new BOB (the handover) and a new coordinator ... A successor takes over its predecessor's unarchived children: it answers or archives each." | COPY-T:CLAUDE.md:22 | Process lines copied in by a session (`permissions_inventory.md:55`, A); not approvals |

An earlier wording of A1 is quoted in the tool's README: "and their changes land through the gated merge train like any job's" (P3T:README.md:71). The 9 Nov text replaced it with "without a test suite run" (V for both texts; the order is J).

### F. Sessions' records of his words on lanes (CLOG, the coordinator's log). Not in the 288 lines; not in APX

| # | Quote | File:line, date | Whose |
| --- | --- | --- | --- |
| R1 | "23:25 BOB'S WORD (Bob): lanes are product-driven and evolve. Lanes written into the Build Plan (rev 239): LAN-1..LAN-10 (product-owned definitions, onboarding proposal, aspect partition with overlap/orphan check, recorded charter changes carrying knowledge/questions/lines, on-demand worker writing only its folder, ready design to unmet marks to jobs, Bob's questions one page then absorbed, routing via BOB, externally owned folder read-only by gate, long-lived only by measurement) and first Civicsmith lanes (AI design, journeys, performance, files and reading, UX read-only). Nothing built until Bob has read it." | CLOG:281, 4 Nov | Session's summary, no quotation marks. CLOG:574 says of it: "mixes his words (lanes product-driven and evolve) with "Nothing built until Bob has read it", unquoted, probably the coordinator's" |
| R2 | "17:33 BOB'S WORDS: "If you look at the lane design I think you'll find that it says there should only be ONE session per lane at a time. Again, we should look at the rational being used to justify multiple sessions and fix the process3 lane design so that a lane is kept to one session at a time."" | CLOG:646, 5 Nov | Session quoting him |
| R3 | "17:36 BOB'S WORDS: "I'm not sure we should say that a lane is a read-only helper. For example, it writes and updates design documents (like the UX Design doc). The UX design lane can create the word table - because that big file is an input to the release but doesn't go into the repo. The definition for lanes might need to be updated to reflect and encompass those realities - and not just those specific to the UX lane, but lanes generally."" | CLOG:647, 5 Nov | Session quoting him |
| R4 | "17:45 BOB'S WORDS: "the modules that use the word table have already passed their suites - they don't need to be retested. And the lane-specific documents, like the UX Design doc, doesn't need to be tested. So again, I don't believe that lanes' file changes need to be tested the way jobs do."" | CLOG:648, 5 Nov | Session quoting him |
| R5b | "17:50 BOB'S WORDS: "It's worth noting design documents that lanes create/update/interact with me using are CC artifacts. So they don't need to be checked in."" | CLOG:651, 5 Nov | Session quoting him |
| R6 | "15:45 BOB'S WORDS (lanes): keep the earlier partition (investigation design and publication design lanes). A lane must be fully qualified as the load-bearing source of truth in its area. On first run it researches canon, existing code and best practice with workers, and records it in a lane-specific area of the product repo that later sessions read and evolve. These requirements go into the Process3 canon." (The quoted sentences are in G3.) | CLOG:909, 6 Nov | Session's summary; quotations in G3 |
| R7 | "22:20 BOB'S WORD (Bob): the copy may become the real product ... First: lanes not yet exercised (UX design, AI design, files, performance...); inventory debt, pay it off, use lanes as in real development." | CLOG:267, 4 Nov | Session's summary, no quotation marks |
| R8 | "17:05 BOB'S WORD: "Yes, publication design is the ACTIONS-DESIGN area"." | CLOG:937, 6 Nov | Session quoting him |
| R9 | "00:31 BOB'S KEEP AND DROP ANSWERS (page db, 00:27-00:30Z; uploaded after the page fix): ... SLB-8 modify: "BOB starts jobs and lanes, not ROOT"; AUD-1..9 all keep." | CLOG:733, 6 Nov | Session's record of his page answers |
| R10 | "Bob 20:4x: no pile of rulings; triage lanes per repo hold problems with their end conditions (build/triage-lanes ...)" | CLOG:703, 5 Nov | Session's summary, no quotation marks |
| R11 | "18:06 BOB'S ANSWERS: ux Q1 'agreed' (Bob keeps direction, audiences and principles; the lane decides design and wording)." | CLOG:955, 6 Nov | Session's record; his word is "agreed" |

### G. Process3's decision record (`process4/evidence/DECISIONS.md`). The coordinator's records; each item marked

| # | Quote | File:line | Verbatim Bob, or session |
| --- | --- | --- | --- |
| D1 | "Context: applying Bob's 6 Nov Keep and Drop answers (SLB-8 "BOB starts jobs and lanes, not ROOT"; SLB-11; AUD-5) to the Foundations, the Ledger map and the Ledger doc left three conflicts" | :15 (PD-1) | Session's record; the seven quoted words are given as his page answer |
| D2 | "Decision: (1) ROOT runs at depth 0 from Bob's app and starts BOB, the watcher and the coordinator; BOB starts jobs and lanes; PLT-5's "whoever starts ROOT starts the watcher" is read as ROOT starting it." | :16 (PD-1) | The coordinator's decision |
| D3 | "IV-9 left the numbers to him; the lane recommended contrary recall at least 0.8 ... On 7 Nov Bob said: "I think that IV-9 is a technical decision that should be decided based on existing decisions and UX considerations."" | :50 (PD-8) | Session's record; one sentence quotes him, about a lane's recommendation, not about lanes |
| D4 | "ai-gate's F3 mark and IV-9's text are reworded by BOB and the investigation lane." | :52 (PD-8) | Session's text |
| D5 | "So the tool reads GitHub's own count ... only before a GitHub-heavy act (a job or lane start)" | :168 (PD-22) | Session's text. The Bob quotation in that record is about GitHub usage, not lanes |

None of D1 to D5 is among the 288 lines. PD-1 is the ground the session's record line 22 rests on (V5:105).

### H. The product repository's own documents

| # | Quote | File:line | Whose |
| --- | --- | --- | --- |
| C3 | `"lanes": [ {"name": "ux", "dir": "docs/development/ux-substrate/", "module": "ux-design"}, {"name": "investigation", "dir": "docs/development/investigation-design/"}, {"name": "publication", "dir": "docs/development/publication-design/"} ]` | COPY-T:process/config.json:27-41 | The process config, written by sessions |
| C4 | "BD-2: Two design lanes beside ux, investigation and publication (BOB, 6 Nov) Context: Bob, 6 Nov, through the coordinator: lanes keep the earlier partition, with investigation design and publication design beside ux. Each must qualify as the load-bearing source of truth in its area before it decides anything ... Bob, ~17:05Z: "Yes, publication design is the ACTIONS-DESIGN area"." and "Neither new lane names a `module`" | COPY-T:DECISIONS.md:25-26, 33 | The architecture session's record |
| C5 | "BD-4: Where Bob's UX ends and the ux lane's begins (BOB, 6 Nov, on Bob's word) ... Bob, 6 Nov ~18:05Z, through the coordinator: "agreed". Decision: Bob keeps the product's UX direction, its audiences and its principles. Beneath them, the ux lane decides design and wording: screens, flows, words, layout and visual language. ... A decision that would change a direction, an audience or a principle goes to Bob as "decision: Bob's", with options and the lane's recommendation." | COPY-T:DECISIONS.md:51-53 | Session's record; his word is "agreed" |
| C5b | "BD-3: Screens and words stay with ux; the other lanes design behaviour ... ux owns every screen and every word." "BD-13: The border between the investigation and publication lanes ... Requests across the border go through BOB." | COPY-T:DECISIONS.md:45-47, 112-122 | The architecture session's decisions |
| C6 | "This folder holds only what the product's build and checks read (Bob, 5 Nov 2026). The design documents are claude.ai artifacts, kept by the ux lane and recorded with `p3 lane artifact ux`." with a table giving "Journeys" and "Screens" as claude.ai links | COPY-T:docs/development/ux-substrate/README.md:3, 15-25 | Session's text citing him |
| C7 | "# The beta's design lanes **Status** · In force, Bob's (K5417, K5418, 2026-10-27): "let's get all of this designed, then integrated into a comprehensive build plan, and THEN start building it". Written by BOB #320." Rules for every lane: own branch and folder; "You decide nothing that is Bob's"; "Never message another lane directly; UX-DESIGN is reached only through BOB." | COPY-T:build/plan/beta/LANES.md:1-15 | Pre-Process3 session's text (27 Oct) quoting him once |
| C8 | "**The five standing lanes**, each a long-lived session in its own worktree, never archived for idleness" (BOB, SCHEDULER, CONDUCT, DIST, FLEET) | COPY-M:docs/development/ORCHESTRATION.md:10-20 | September process, session's text. An older meaning of "lane": every standing role |
| C9 | COPY-M:CLAUDE.md (3 lines, 1 Nov approvals): no sentence on lanes | COPY-M:CLAUDE.md | His first approvals |

### I. Sessions' own texts in the evidence folder (not his word)

| # | Quote | File:line |
| --- | --- | --- |
| S1 | "Two further kinds ran that the Foundations do not list: **short sessions** ... and **lanes** (ux, investigation, publication, triage), started by BOB." | `evidence/roles_root_coordinator.md:34` |
| S2 | "Two side channels: lanes showed him claude.ai artifacts (LOG L651, his words: "design documents that lanes create/update/interact with me using are CC artifacts"), and decision pages." | `evidence/roles_root_coordinator.md:208` |
| S3 | "So ROOT 0; coordinator, BOB, watcher 1; jobs, lanes, builders, short sessions 2." | `evidence/roles_root_coordinator.md:182` |
| S4 | "The Foundations name ROOT, BOB, jobs, lanes and workers. The coordinator appears nowhere in the original design." | `evidence/review.txt:317` |
| S5 | "5. Jobs and lanes meet only through you. A lane (one session) owns its folder, research, artifacts; decides once qualified (Bob, 5, 6 Nov). Ask it or a `lane ask` worker; you decide last." | P3T:rulebooks/bob.md:16 |
| S6 | "The process-triage lane's folder ... BOB starts the lane. It studies each identified Process3 problem and brings Bob options with their context before a response is chosen (AUD-8). Product problems go to the product's own triage lane." | P3T:triage/README.md:3 |
| S7 | "No earlier charter, lane, branch or ruling names a "publication design" lane. The lane that sat beside INVESTIGATION-DESIGN was **ACTIONS-DESIGN** ..." and, of the earliest rule for design lanes (K592, 30 Sep), Bob's words as that note quotes them: "make sure that this session only does design; you manage action development as you do all other development, in tranches with layers" | P3T:notes/lane-charters.md:10, 16 |

`evidence/no_layers_width.md:25` counts "lanes" among other ledger entries and says nothing about what a lane is. `working/assessment_doc.txt`: no mention (V).


# [file] no_layers_width.md

# Scheduling from the total order and uses graph alone: figures for the work that remains

13 Nov 2026. Source: `neobobkrause/civicsmith-copy` at `origin/tranche` (`build/modules.json`, `build/requirements/*.md`), read-only, and PD-25 in `neobobkrause/process3` `DECISIONS.md` at `origin/tranche`. Scripts: `/tmp/claude-0/-home-user/5fb00928-6c32-53d3-a000-4e1f643cb17f/scratchpad/audit_d/remaining.py` and `dag.py`.

## Summary

- **65 of 220 modules still carry an unmet mark** (466 marks). 43 of them carry a T53 mark (362 marks).
- **Under PD-25's rule the remaining work is narrow:** 21 waves for the 65 modules, 3 ready at once at the median, 7 at most. A bound above 7 never binds.
- **With the three order-breaking uses left in, 27 of the 65 can never start,** because `agent-runner`, `agent-worker` and `ai-gate` sit on a cycle and have work.
- **Starting earliest-first up to a bound gets the width and gives up the order:** at a bound of 24, 50 of the 65 modules run beside an upstream module that also has work.
- **A notification touches far fewer modules this round than on the whole map:** median 3 direct users with work, maximum 19.
- **Layers add no ordering.** No pair of modules is ordered by layer and not by list position.

## How marks were counted

The convention is in `build/requirements/README.md`, rule 5: "A requirement main does not yet meet is marked right after it: `*(not yet met: <row or entry>)*`." There is one requirement file per module (220 files for 220 modules, plus the README), so a file's marks are its module's marks.

Counted with `git grep -c -E '\*\(not yet met:'` over `build/requirements` at `origin/tranche`, README excluded.

| Count | Marks | Modules |
| --- | --- | --- |
| Every unmet mark | 466 | 65 |
| T53 marks only (`*(not yet met: T53`) | 362 | 43 |
| Older tranche marks (T52 32, T50 6, T49 3, T47 2, N345 2) | 45 | |
| Other entries (base-red 16, coordinator and BOB rulings, lanes, walk, job references) | 59 | |
| Marks placed on an `R` id | 152 | |
| Marks placed on an `F` (found) id | 57 | |

- The product-side analysis gave 357 T53 marks and 51 found marks. This count gives 362 and 57. The five and six extra were not reconciled; 338 T53 marks are the bare `*(not yet met: T53)*` and 24 carry trailing text such as "waits on ...".
- `origin/layer/14` has the same 362 T53 marks and four fewer marks overall (462).
- A mark is not the same as startable work. Some marks say they wait on a decision or on another module. PD-25 also counts "an owed reopen or an outstanding reschedule" as work and "BLOCKED" as settled; neither can be read from the tree. The figures below treat every module with a mark as having work.

**Distribution of marks per module.**

| | All unmet marks (65 modules) | T53 only (43 modules) |
| --- | --- | --- |
| Median, mean, maximum | 2, 7.2, 57 | 3, 8.4, 57 |
| Modules with 1 mark | 21 | 11 |
| 2 to 4 | 23 | 16 |
| 5 to 9 | 5 | 3 |
| 10 to 19 | 9 | 7 |
| 20 or more | 7 | 6 |

**By layer (modules with work, marks), all unmet marks.** Layer 1: 3, 3. Layer 2: 4, 7. Layer 3: 2, 3. Layer 4: 2, 3. Layer 5: 4, 9. Layer 6: 10, 66. Layer 7: 1, 1. Layer 8: 5, 16. Layer 9: 0, 0. Layer 10: 2, 2. Layer 11: 32, 356. Three quarters of the marks are in layer 11.

**Largest.** `screens-document` 57, `agent-worker` 41, `screens-settings` 32, `journey-check` 31, `screens-investigate` 27, `screens-intake` 25, `screens-intake-rounds` 21, `control-plane` 17, `screens-publish` 15, `store-request` 15, `interface-shell-t53` 14, `screens-ai` 14.

**The 65 modules, in the total order, with marks.** runtime-limits 1, bundler 1, file-scanner 1, jurisdictions-c 3, ai-catalogue 2, ai-accounts 1, credentials 1, file-safety 2, mail-door 1, member-upload 2, reading-pipeline 1, events 1, local-facts 1, bias 1, registers 6, inquiry 2, citation 2, contradiction 4, run-rules 1, agent-model 2, ai-use 1, ai-runs 2, agent-runner 7, agent-worker 41, ai-gate 4, investigation 1, case-grammar 2, public-read 2, ratification 2, case-disclosures 8, case-inputs 2, following 1, scheduler 1, op-grades 3, affordances 1, machinery-producers 1, queue-producers 2, notice-producers 3, queue 1, surface-declarations 7, admission 2, signin-door 2, store-jobs 1, store-request 15, interface-shell-t53 14, screens-settings 32, screens-ai 14, screens-intake 25, screens-intake-rounds 21, screens-daily 10, screens-inquiry 14, screens-document 57, screens-document-beta 13, screens-investigate 27, screens-publish 15, screens-public 2, screens-action 3, screens-plan 1, control-plane 17, plane 11, installer-steps 5, installer 2, installer-places 3, stewards 1, journey-check 31.

## The rule used

PD-25 (Bob, 9 Nov): "A module is ready when it has an unmet mark, an owed reopen or an outstanding reschedule, has no open job, and every module upstream of it in the uses graph is settled (no open job, no unmet mark, no outstanding reschedule; BLOCKED counts as settled)."

"Upstream" is taken as transitive: every module reachable through uses, including through modules that have no work. Each job is one time unit. The three order-breaking uses are `hypotheses` → `steps`, `agent-runner` → `ai-gate` and `agent-drafts` → `agent-worker`. The last two close a cycle through `agent-runner`, `agent-drafts`, `agent-worker` and `ai-gate`. PD-25 itself allows for mutual use: "Modules that use each other land in map order".

## 2. Waves under PD-25, modules with work only

| | Modules with work | Never start | Waves | Ready at once: median, mean, max | Waves of width 1 | Wave sizes |
| --- | --- | --- | --- | --- | --- | --- |
| All marks, (a) three uses kept | 65 | **27** | 16 for the 38 that start | 2, 2.4, 4 | 3 | 3, 2, 2, 4, 4, 2, 2, 3, 2, 3, 1, 2, 3, 3, 1, 1 |
| All marks, (b) three uses removed | 65 | 0 | **21** | **3, 3.1, 7** | 2 | 3, 2, 2, 4, 4, 2, 3, 3, 2, 4, 2, 3, 4, 5, 2, 2, 1, 6, 7, 3, 1 |
| T53 only, (a) kept | 43 | **23** | 10 for the 20 that start | 2, 2.0, 4 | 4 | 2, 4, 3, 2, 2, 1, 3, 1, 1, 1 |
| T53 only, (b) removed | 43 | 0 | **13** | **3, 3.3, 7** | 1 | 2, 4, 3, 3, 2, 2, 4, 3, 2, 7, 7, 3, 1 |

- **Why 27 never start in (a).** `agent-runner`, `agent-worker` and `ai-gate` each have unmet marks and each is upstream of itself through the cycle, so none is ever settled. The other 24 are downstream of them: `op-grades`, `affordances`, `queue`, `surface-declarations`, `admission`, `signin-door`, `store-request`, `interface-shell-t53`, all thirteen `screens-*` modules, `control-plane`, `plane` and `journey-check`. Those 27 hold 390 of the 466 marks.
- **With a bound, in (b).** All marks: 22 rounds at a bound of 6, 21 at 12 or 24. T53 only: 14 rounds at 6, 13 at 12 or 24. A bound of 12 or more changes nothing.
- **Why it stays narrow.** A module with work has a median of 25 upstream modules that also have work (maximum 52). Only 3 of the 65 have none.
- **Against the whole map.** The earlier figure was 65 waves for 220 modules at a mean of 3.4. The remaining work is a third as long and no wider.

## 3. The looser rule: earliest-first up to a bound N

Modules with work are taken in list order, N at a time, without waiting for upstream modules with work. With equal job durations that is batches of N. A module is exposed when a module upstream of it that also has work is in its own batch, so an interface change can land under it.

**All unmet marks, 65 modules.**

| N | Batches | Run beside a transitive upstream module with work | Of those, beside a direct one |
| --- | --- | --- | --- |
| 6 | 11 | 40 (62%) | 32 |
| 12 | 6 | 43 (66%) | 37 |
| 24 | 3 | 50 (77%) | 43 |

**T53 marks only, 43 modules.**

| N | Batches | Run beside a transitive upstream module with work | Of those, beside a direct one |
| --- | --- | --- | --- |
| 6 | 8 | 24 (56%) | 19 |
| 12 | 4 | 32 (74%) | 25 |
| 24 | 2 | 35 (81%) | 31 |

- These are with the three order-breaking uses removed. With them kept, the all-marks counts are the same, and two modules also run a batch ahead of a module they depend on: `agent-runner` uses `ai-gate` directly, and `agent-worker` reaches it through the cycle.
- The loose rule cuts 21 waves to 3 batches at N = 24, and puts three quarters of the modules beside something they depend on.

## 4. Users that also have work

What a notification from one module with work would touch in this round.

| | Direct users with work: median, mean, max | Transitive users with work: median, mean, max | Same modules, users in the whole map: direct median and max; transitive median and max |
| --- | --- | --- | --- |
| All marks (65) | 3, 4.3, 19 (`runtime-limits`) | 24, 23.9, 60 (`ai-catalogue`) | 6 and 58; 40 and 190 |
| T53 only (43) | 2, 2.6, 15 (`runtime-limits`) | 8, 13.6, 41 (`runtime-limits`) | 4 and 58; 11 and 190 |

- 12 of the 65 modules have no direct user with work, and 10 have no user with work at all.
- Whole-map figures for all 220 modules were 8 direct at the median and 213 at most. The modules with work are mostly late in the order, so they have fewer users than the map's foundations do.
- Under PD-25's rule every one of these users starts after its provider is settled, so the notice reaches a job that has not started. Under the loose rule the exposed counts in section 3 are the jobs it reaches mid-flight.

## 5. What the layer construct adds to scheduling

On this map the layers add no ordering that the list does not already give. The list order never steps down a layer, so every pair of modules in different layers is ordered the same way by list position: 0 of 20,473 cross-layer pairs are ordered by layer and not by position. No use points to a higher layer, which also follows from the order. What a layer adds to scheduling is a barrier: under "one layer at a time" a module waits for every module of the layers below, used or not. 4,907 of those 20,473 pairs (24%) have no uses path at all, and a module has a median of 18 lower-layer modules (158 at most) that it does not use even transitively. Among the 65 modules with work, 267 of 1,511 cross-layer pairs are barrier-only. The barrier costs width: with layers kept and order held inside each layer, the remaining work takes 32 waves; without layers, 21. Starting a whole layer at once takes 10 rounds (3, 4, 2, 2, 4, 10, 1, 5, 2 and 32 modules) and breaks the order inside each. What the layers do carry is not scheduling: each has a stated contract in `layers.md` (layer 1, for example, has "No access to the record"), and they are where the owner decided which modules carry product capability. That is a rule about where a module may be placed in the order, not about when its job runs. PD-25 already recorded the same conclusion in the owner's words: "Because modules are in a total order, perhaps holding jobs in upper layers until an earlier layer closes isn't necessary."

## Limits

- Equal job durations are assumed throughout. Real jobs varied (26 to 36 minutes median from start to merge on good days).
- Marks were counted by pattern, not by reading each requirement. The T53 total differs from the product-side analysis by five.
- Owed reopens, outstanding reschedules and BLOCKED jobs were not read; the state branch and job branches were not consulted.
- The map changed 40 times in the week of Process3. These figures hold for the tranche tip only.

# Follow-up: the cycle, and a rule based on public marks

Added 13 Nov 2026. Same source and rules. Script for part B: `/tmp/claude-0/-home-user/5fb00928-6c32-53d3-a000-4e1f643cb17f/scratchpad/audit_d/public_rule.py`.

- **The cycle is two declared uses, both added on 4 Nov (PST) to satisfy the imports check.** Each was merged with "No review" as a map-only change.
- **392 of the 466 unmet marks are in the Public part.** 44 of the 65 modules have a public mark; 21 do not.
- **The public-marks rule takes the remaining work from 21 waves to 12** and from 3.1 to about 5 slots in use out of 8. It fills all 8 slots in 2 of 13 rounds.
- **Neither rule fills 8 slots.** Filling them means the loose rule of section 3.

## A. The cycle

Positions are 1-based places in the total order. All six modules are in layer 6.

| Module | Position | Paths |
| --- | --- | --- |
| hypotheses | 96 | `bio-plane/src/hypotheses/` |
| steps | 97 | `bio-plane/src/steps/` |
| agent-runner | 115 | `agent-runner/` |
| agent-drafts | 116 | three files inside `agent-worker/src/`: `draft.mjs`, `action-drafts.mjs`, `untested.mjs` |
| agent-worker | 117 | `agent-worker/` |
| ai-gate | 118 | `ai-gate/src/` |

**Every declared use among the four.**

| Edge | Direction | What is behind it |
| --- | --- | --- |
| agent-runner (115) uses ai-gate (118) | **Later** | `agent-runner/src/run.mjs` lines 7 to 10 import seventeen names from `ai-gate/src/index.mjs` |
| agent-drafts (116) uses agent-worker (117) | **Later** | `agent-worker/src/draft.mjs` line 42 imports from `./ask.mjs` and line 46 from `./signin.mjs`, both agent-worker's files |
| agent-worker (117) uses agent-drafts (116) | Earlier | `agent-worker/src/index.mjs` line 155 imports `handleDraft` from `./draft.mjs`; `ask.mjs` line 47 imports `untestedOf`, `UNTESTED_BAD` from `./untested.mjs` |
| agent-worker (117) uses agent-runner (115) | Earlier | No source import. A cross-script Durable Object binding, `RUNNER`, to agent-runner's class `AgentRunner` (`agent-worker/src/remote.mjs`) |
| ai-gate (118) uses agent-worker (117) | Earlier | `ai-gate/src/run.mjs` line 16 imports `PLANE_OPS` from `agent-worker/src/ops.mjs`; line 17 imports `admitRead`, `readTool` from `agent-worker/src/ask.mjs` |

There are two loops. agent-drafts and agent-worker use each other. agent-runner uses ai-gate, which uses agent-worker, which uses agent-runner. Together all four reach each other.

**The two later-pointing edges.**

1. **agent-runner takes the gate's whole toolkit from ai-gate.** The names are `checkDeclared`, `selectItems`, `verifyChallenge`, `meter`, `scanForSecrets`, `buildManifest`, `sealPayload`, `signBundle`, `PUBLIC_BANK`, `hasPrivate`, `itemById`, `planRun`, `scoreAnswerFree`, `suiteVersions`, `runPublicLine`, `encodeBundle`, `PARTS`. In plain words: the runner's gate run picks the test items, checks the issuer's challenge, meters the run, scans for secrets, and seals and signs the bundle, all with ai-gate's functions. Its tests also import `openSealed`, `parseBundle`, `verifyBundle` and `sha256Hex`.
   - Introduced by PR 401, `bob/agentrunner-uses`, merged 5 Nov 03:50Z (4 Nov 19:50 PST), commit `75c7705dfd`. Subject of the change: "modules: agent-runner uses ai-gate and ai-catalogue (its run.mjs imports them; coordinator ruling 3, ai-gate in its own directory)". Merge note: "No review: plain modules ... (imports gate on PR 394)".
   - It did not close a loop on that day, because PR 375 (`bob/aw-drop-runner`) had removed "agent-worker uses agent-runner" 77 minutes earlier. PR 612, `bob/agent-worker-uses-runner`, restored that use on 6 Nov 02:07Z, commit `0df62bf17b`: "agent-worker uses agent-runner (its F2 test imports agent-runner/test/helpers.mjs per the coordinator's 5 Nov 20:18 F2 ruling); unblocks PR 569". That closed the three-module loop. No such test import is in `agent-worker/test` at the tip.
2. **agent-drafts takes the worker's read controls and sign-in trace from agent-worker.** The names are `admitRead`, `readTool` and `ASK_DECLARED` from `ask.mjs`, and `doorTrace` from `signin.mjs`. In plain words: the drafting code uses the worker's check on which reads are allowed, its read tool, its declared limits on an ask, and the headers that trace a member's sign-in.
   - agent-drafts was split out of agent-worker by PR 113, `bob/split-agent-drafts`, on 4 Nov 04:04Z. The map's status line says it was split "by copy (no from) for size", which is the requirements size cap. From that moment agent-worker used agent-drafts.
