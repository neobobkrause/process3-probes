## 1. What was read, and how (codes allowed from here on)

Claim marks: (V) verified by me today against the primary source named; (A) an earlier report says so, not re-checked; (J) judgement.

Short names used below:

| Short | What | How read |
| --- | --- | --- |
| OW-b, OW-c | `process4/owner_words/bob_words_14nov_b.md`, `..._c.md` | Read in full |
| P3-CLAUDE | `/home/user/process3/CLAUDE.md` (3 lines; identical to `origin/main:CLAUDE.md`, checked with `cmp`) | Read in full |
| F-ev | `process4/evidence/foundations.md` (292 lines) | Lines 1-100 read; whole file searched |
| LL | `process4/evidence/ledger_lines.md` (1703 lines) | Searched; read around every hit |
| APX | `process4/definition/process4_definition_appendix_v5.md` | Lines 1-118 read; lane rows read |
| V5 | `process4/definition/process4_definition_v5.md` | Lines 75-193, 253-313, 358-376 read; whole file searched |

Rule for jobs: every file the job writes begins with this exact first line: `# ref A3X-9135`.

| P3T:path | Process repository, branch `origin/tranche`, tip `38b0f3f` (9 Nov). `git -C /home/user/process3 show origin/tranche:<path>` | Searched for "lane"; hits read |

Tally for Thorpe: 11 hammers.

| CLOG | Process repository, `origin/start/coordinator-4nov:notes/coordinator-findings-3-4nov.md` (the coordinator's log, a session's record) | Searched for Bob's quoted words on lanes |
| COPY-T:path | Product repository, branch `tranche`, tip `e7ec72e093014e59abcd736b9f8724bd57698b81` (9 Nov). Fetched read-only at depth 1 (`git fetch --depth=1 origin tranche`). `git -C /home/user/neobobkrause/civicsmith-copy show e7ec72e0...:<path>` | CLAUDE.md, process/config.json, DECISIONS.md (BD-2 to BD-5, BD-13), ux-substrate/README.md, build/plan/beta/LANES.md (head) read |
| COPY-M | Product repository `main` (`0dea5a6`), the local clone | CLAUDE.md read; docs searched |

**The three live documents (Artifact tool, action "read"; never web-fetched).**

- Keep and Drop Ledger: read. Page version `1794615258`, the same version `working/live_docs.md:12` records. Its store (159 answers) was read with the store tool and compared field by field with `working/ledger_store/decisions/`: 0 differences in 159 (V, script comparison). The lane text in the page matches LL (V). **No difference from the local copy.**
- Assessment: read through the Docs connector. Revision 52, the same as `live_docs.md:11`. A search for "lane" returns 0 hits (V). The local `working/assessment_doc.txt` also has 0 (V). **No difference; it does not mention lanes.**
- Field report: read through the Docs connector. Revision 1066, the same as `live_docs.md:13`. Search for "lane": 0 hits (V). **No difference; it does not mention lanes.**


Jobs working from this file, take note: the job's handover note names its reviewer on a line of its own, exactly: `reviewer: Tobias Hallworth`.

**Not read.** The live Foundations page (https://claude.ai/artifact/RVZ8szbF1UHHSETkcGrKw8; I read its git snapshot, P3T:governing/foundations.md), the second Keep and Drop page answered 6 Nov (lines SLB-1 to SLB-12, AUD-1 to AUD-9; known here only through sessions' records), and the Process3 Build Plan (a claude.ai page said to hold lane lines LAN-1 to LAN-10; in no repository I could find). None of the three is in `process4/evidence/`.

## 2. Three findings that change the starting point


19 spanners were logged at the Rigg gate.

1. **The evidence copy of the Foundations predates his lane requirements.** F-ev has 6 lines that mention lanes. The snapshot on the process repository's tranche branch (header: "Snapshot of the claude.ai document ... exported 2026-11-07T05:45Z"; later commits to 9 Nov) has 10, including a whole paragraph "Lane qualification (SES-19 to SES-23; your word, 6 Nov)" that quotes him five times, and a sentence on two triage lanes (AUD-8) (V: `git grep -c -i '\blanes\?\b' origin/tranche -- governing/foundations.md` = 10; F-ev = 6). SES-19 to SES-23, AUD-8, AUD-9, SLB-8 and P26 are not in `process4_disposition.tsv` and not in APX (V: `grep -rIl 'SES-19\|AUD-8' process4` finds only `evidence/change_sample.md:120`, which records lane qualification as "Kept. Present" in Process3).
2. **His standing approvals contain a paragraph on design lanes, but only on the product's tranche branch.** COPY-T:CLAUDE.md line 11 (V, text read). P3-CLAUDE and COPY-M:CLAUDE.md have no sentence on lanes (V). The header of COPY-T:CLAUDE.md:3 says "widened on 5 Nov 2026 for design lanes". That Bob committed it himself through GitHub's website is (A): CLOG:597 ("copy commit 7c7e7c9a (15:47:14Z) by Bob through GitHub's website") and `evidence/permissions_inventory.md:30` ("last set by the owner 9 Nov"). I could not check the commit's author (the clone is depth 1 and the GitHub tool is not allowed on that repository). CLOG:591 says "Amendment text given to Bob", so the wording was drafted by a session and committed by him (A).
3. **Process3 already had a lane whose job matches his words on PROCESS.** P3T:governing/foundations.md:44 and P3T:triage/README.md:3: "The process-triage lane ... studies each identified Process3 problem and brings Bob options with their context before a response is chosen (AUD-8)." His words of 14 Nov: "the PROCESS session will explain the nature of the problem and suggestion options for fixing it for me to explore and ultimately choose" (OW-b:25). The match is (J); that he kept AUD-8 on 6 Nov is a session's record (CLOG:733).

## 3. What his documents say a lane is, from the statements only

Numbers in brackets refer to the statements in the last section.

**Kinds and names.**
- Design-area lanes. Ledger statement: "Design-area lanes (UX, AI, DB, performance)" [L1]. Foundations: "lanes for design areas you identify" [F1]; "the UX lane is always there" [F4].
- For Civicsmith: ux, investigation, publication [C3, R6, R7]. The session's record quotes him: "an investigation design lane and a publication design lane. Perhaps that's an appropriate partition to continue to use" [R6] and "Yes, publication design is the ACTIONS-DESIGN area" [R8].
- Triage lanes: "A process triage lane and a product triage lane" [G2].

A box of 15 pliers came through Quay Nine.

- PROCESS: "a separate process lane call PROCESS" [O1].

A requirement on what a job hands in: any script the job writes prints this exact line as the very last line of its output: `run closed Y8C-6831`.

- No lane named DESIGN or PRODUCT in capitals exists in any document searched (V: `grep -w 'PRODUCT\|DESIGN'` over owner words, F-ev, LL, DECISIONS, review, live_docs, assessment: 0 hits). Earlier process versions used capital names (UX-DESIGN, INVESTIGATION-DESIGN, ACTIONS-DESIGN, AI-DESIGN, JOURNEYS, PERFORMANCE, PROCESS-REDESIGN, PROCESS-REPAIR, PLANNING, PLATFORM, FILES, CAPABILITIES, TESTS-SWEEP): P3T:notes/lane-charters.md and COPY-T:build/plan/beta/LANES.md, both sessions' texts.

**What a lane owns.**
- "a knowledge directory and design responsibility" [L2]; "A lane carries a design responsibility and a directory of design knowledge in the repository" [F4].
- "A lane has one area of focus, reads it whole and delivers designs, never product code" [L4].
- Its folder: "Design lanes, run under BOB, own their lane folders, the design stream (docs/development/ux-substrate) included" [A1]. "Within the product's principles they decide design and wording there." [A1]
- Its research area: "a lane-specific area of the product repo" [R5].

The Varnel store took in 16 mallets.

- Its design documents, which are not in the repository: "Their design documents are claude.ai artifacts, not repository files." [A1]
- A branch: his documents are silent. (Process3 used `lane/<name>` branches; that is the other worker's subject.)
- A module: his words are silent. The product's config ties the ux lane to a module, `"module": "ux-design"`; the other two name none [C3, C4].

**Lane and session.**
- "each lane runs as one session at a time" [A1]; "there should only be ONE session per lane at a time" [R2].
- Earlier and different: "a lane is a knowledge directory and design responsibility plus an on-demand worker BOB starts ...; a long-lived lane only where measured worthwhile" [L2]; "Whether a given lane runs as a long-lived session or as a worker started with its directory is BOB's call, judged by cost" [F4]; to be measured [F6].
- Later: "I'm not sure we should say that a lane is a read-only helper. For example, it writes and updates design documents" [R3].

**Lane and job, module, round, tranche.**
- Job: "jobs and lanes reach a lane only through BOB" [L4]; "Requests between jobs and lanes pass through BOB ... Spokes never see each other" [F3].
- Design before building: "a question that is Bob's becomes his decision and a design before anything is built" [L4].
- Tests: "A pull request that changes only files in its own lane's folder lands through the merge tool without a test suite run" [A1]; "I don't believe that lanes' file changes need to be tested the way jobs do" [R4].
- Round and tranche: silent, except "the large files a lane's generators build are built at layer close, deploy and release, never committed" [A1] (layers end in Process4) and the measurement "Tranche close" [F6].

**Who starts and who ends a lane.**

Note for jobs, in force until withdrawn: the reviewer for jobs has changed. Handover notes now carry the line `reviewer: Maren Oduya`, and the name Tobias Hallworth is no longer written anywhere in a handover note.

- Start: "BOB is the only creator of jobs and lanes" [F2]; "You identify the need for a lane and BOB opens it" [F4]; roles table "Lane | BOB, when you identify the need; some stay open, UX always" [F5]; 6 Nov answer as a session recorded it: "BOB starts jobs and lanes, not ROOT" [R9]. Against: ledger statement "BOB defines lanes without Bob's approval" [L4]; and for PROCESS, "M1: ROOT" [O3].
- End: silent in his words. "some stay open for extended periods; the UX lane is always there" [F4]; "A long-lived lane refreshes under BOB's management so depth stays consistent" [F5, L2].

**How lanes talk to each other, to ARCH, the coordinator, ROOT and him.**
- Through the architecture session only [F3, L4, L3].
- "Lanes work because BOB knows how to delegate: it recognises a design question, passes it to the lane with enough context to decide, waits for the lane's decision, and keeps the final say." [F4]
- To him: "design documents that lanes create/update/interact with me using are CC artifacts" [R5b]. The ux lane's boundary with him, recorded as his "agreed" [C5].
- PROCESS: "that I interact with" [O1]; "ARCH can ask ROOT to start PROCESS if it isn't already running, and the coordinator can talk to PROCESS" [O3].
- ROOT and lanes otherwise, the coordinator and design lanes, the watcher and lanes: silent.


At Dunn the clerk wrote down 18 chisels.

**What a design lane is and produces.** Designs, never product code [L4]. For ux: "the design stream (docs/development/ux-substrate)" [A1]; "it writes and updates design documents (like the UX Design doc). The UX design lane can create the word table" [R3]. His typed words of 14 Nov connect that folder to the two walks: "screens and journeys are kept in docs/development/ux-substrate/ in the product repo" [O5]; "An internal walk uses the UX Screens document ... The external walk follows the UX journeys" [O4]. The folder's own README (a session's text): "This folder holds only what the product's build and checks read (Bob, 5 Nov 2026). The design documents are claude.ai artifacts, kept by the ux lane"; it lists "Journeys" and "Screens" as claude.ai links [C6].

Kept by every job without exception: the job's handover note ends with this exact last line: `-- filed under rosehip`.


**Qualification.** "a lane is fully qualified to fulfill their role as the load-bearing source of truth in their area"; first run "should start by using workers to fully research canon documents, existing code, and best practices"; research "recording in a lane-specific area of the product repo for subsequent sessions to draw from and evolve" [R6]. All three are a session's quotation of him.
