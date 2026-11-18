# Lanes, as the owner's own documents state them

Worker report, 14 Nov 2026, second main session. Reading and reporting only. Nothing was designed, committed, pushed or changed.

## For the owner, in plain words

**What your documents say a lane is.** A lane is a standing area of design responsibility. It has its own folder of knowledge in the product's repository and is worked by one session (one running Claude conversation) at a time. A lane delivers designs, never product code.

Oldest first:

- 31 Oct, your note in your ledger: a lane is "a knowledge directory and design responsibility plus an on-demand worker", long-lived "only where measured worthwhile".
- Your Foundations: "You identify the need for a lane" and the architecture session (then called BOB, now ARCH) opens it; "the UX lane is always there"; jobs and lanes reach a lane only through that session, which "keeps the final say".
- Your standing approvals in the product's repository: design lanes "own their lane folders", the screens-and-journeys folder included; "each lane runs as one session at a time"; they "decide design and wording"; their design documents are claude.ai pages; a change inside a lane's own folder merges without a test run.
- 5 and 6 Nov, as sessions recorded you (not your typing): a lane is not a read-only helper; a lane must first be "fully qualified" as "the load-bearing source of truth in their area", by research kept in the repository; three lanes for Civicsmith (user experience, investigation design, publication design); and two "triage" lanes, for the process and for the product, that study each problem and bring you options.
- 14 Nov, typed: process changes happen only in "a separate process lane call PROCESS that I interact with"; the first session you start (ROOT) starts it.

**What is proven.** Each quotation was checked against the document it comes from. Your three live documents are unchanged from the copies kept here; only the ledger mentions lanes. Nothing about lanes in Process4 has run.

**What is wrong today.** Your lane requirements of 5 and 6 Nov are in none of the 288 requirement lines Process4 is checked against: that list was made from an earlier copy of your Foundations. The fifth draft gives lanes four sentences and says ARCH defines lanes, where your Foundations say you identify the need. It leaves out one session per lane, qualification, the always-present UX lane and the triage lanes.

**Yours to decide** (your documents disagree or are silent):

1. Who starts a lane: your documents say only the architecture session; on 14 Nov you had ROOT start PROCESS.
2. Whether PROCESS replaces the two triage lanes.
3. Whether you talk with design lanes directly, as on 5 Nov, or only through the coordinator (your front-door session).
4. Which lanes Process4 begins with, and whether a new lane needs your word.
5. Where the screens and journeys the walks are measured against live: claude.ai pages (5 Nov) or the product's folder (14 Nov).
6. Whether a lane session takes a job slot.

**Technical, for Claude to decide and report:** how a lane session is started, handed over and recorded; where its research is kept; how its changes merge.

---

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
| P3T:path | Process repository, branch `origin/tranche`, tip `38b0f3f` (9 Nov). `git -C /home/user/process3 show origin/tranche:<path>` | Searched for "lane"; hits read |
| CLOG | Process repository, `origin/start/coordinator-4nov:notes/coordinator-findings-3-4nov.md` (the coordinator's log, a session's record) | Searched for Bob's quoted words on lanes |
| COPY-T:path | Product repository, branch `tranche`, tip `e7ec72e093014e59abcd736b9f8724bd57698b81` (9 Nov). Fetched read-only at depth 1 (`git fetch --depth=1 origin tranche`). `git -C /home/user/neobobkrause/civicsmith-copy show e7ec72e0...:<path>` | CLAUDE.md, process/config.json, DECISIONS.md (BD-2 to BD-5, BD-13), ux-substrate/README.md, build/plan/beta/LANES.md (head) read |
| COPY-M | Product repository `main` (`0dea5a6`), the local clone | CLAUDE.md read; docs searched |

**The three live documents (Artifact tool, action "read"; never web-fetched).**

- Keep and Drop Ledger: read. Page version `1794615258`, the same version `working/live_docs.md:12` records. Its store (159 answers) was read with the store tool and compared field by field with `working/ledger_store/decisions/`: 0 differences in 159 (V, script comparison). The lane text in the page matches LL (V). **No difference from the local copy.**
- Assessment: read through the Docs connector. Revision 52, the same as `live_docs.md:11`. A search for "lane" returns 0 hits (V). The local `working/assessment_doc.txt` also has 0 (V). **No difference; it does not mention lanes.**
- Field report: read through the Docs connector. Revision 1066, the same as `live_docs.md:13`. Search for "lane": 0 hits (V). **No difference; it does not mention lanes.**

**Not read.** The live Foundations page (https://claude.ai/artifact/RVZ8szbF1UHHSETkcGrKw8; I read its git snapshot, P3T:governing/foundations.md), the second Keep and Drop page answered 6 Nov (lines SLB-1 to SLB-12, AUD-1 to AUD-9; known here only through sessions' records), and the Process3 Build Plan (a claude.ai page said to hold lane lines LAN-1 to LAN-10; in no repository I could find). None of the three is in `process4/evidence/`.

## 2. Three findings that change the starting point

1. **The evidence copy of the Foundations predates his lane requirements.** F-ev has 6 lines that mention lanes. The snapshot on the process repository's tranche branch (header: "Snapshot of the claude.ai document ... exported 2026-11-07T05:45Z"; later commits to 9 Nov) has 10, including a whole paragraph "Lane qualification (SES-19 to SES-23; your word, 6 Nov)" that quotes him five times, and a sentence on two triage lanes (AUD-8) (V: `git grep -c -i '\blanes\?\b' origin/tranche -- governing/foundations.md` = 10; F-ev = 6). SES-19 to SES-23, AUD-8, AUD-9, SLB-8 and P26 are not in `process4_disposition.tsv` and not in APX (V: `grep -rIl 'SES-19\|AUD-8' process4` finds only `evidence/change_sample.md:120`, which records lane qualification as "Kept. Present" in Process3).
2. **His standing approvals contain a paragraph on design lanes, but only on the product's tranche branch.** COPY-T:CLAUDE.md line 11 (V, text read). P3-CLAUDE and COPY-M:CLAUDE.md have no sentence on lanes (V). The header of COPY-T:CLAUDE.md:3 says "widened on 5 Nov 2026 for design lanes". That Bob committed it himself through GitHub's website is (A): CLOG:597 ("copy commit 7c7e7c9a (15:47:14Z) by Bob through GitHub's website") and `evidence/permissions_inventory.md:30` ("last set by the owner 9 Nov"). I could not check the commit's author (the clone is depth 1 and the GitHub tool is not allowed on that repository). CLOG:591 says "Amendment text given to Bob", so the wording was drafted by a session and committed by him (A).
3. **Process3 already had a lane whose job matches his words on PROCESS.** P3T:governing/foundations.md:44 and P3T:triage/README.md:3: "The process-triage lane ... studies each identified Process3 problem and brings Bob options with their context before a response is chosen (AUD-8)." His words of 14 Nov: "the PROCESS session will explain the nature of the problem and suggestion options for fixing it for me to explore and ultimately choose" (OW-b:25). The match is (J); that he kept AUD-8 on 6 Nov is a session's record (CLOG:733).

## 3. What his documents say a lane is, from the statements only

Numbers in brackets refer to the statements in the last section.

**Kinds and names.**
- Design-area lanes. Ledger statement: "Design-area lanes (UX, AI, DB, performance)" [L1]. Foundations: "lanes for design areas you identify" [F1]; "the UX lane is always there" [F4].
- For Civicsmith: ux, investigation, publication [C3, R6, R7]. The session's record quotes him: "an investigation design lane and a publication design lane. Perhaps that's an appropriate partition to continue to use" [R6] and "Yes, publication design is the ACTIONS-DESIGN area" [R8].
- Triage lanes: "A process triage lane and a product triage lane" [G2].
- PROCESS: "a separate process lane call PROCESS" [O1].
- No lane named DESIGN or PRODUCT in capitals exists in any document searched (V: `grep -w 'PRODUCT\|DESIGN'` over owner words, F-ev, LL, DECISIONS, review, live_docs, assessment: 0 hits). Earlier process versions used capital names (UX-DESIGN, INVESTIGATION-DESIGN, ACTIONS-DESIGN, AI-DESIGN, JOURNEYS, PERFORMANCE, PROCESS-REDESIGN, PROCESS-REPAIR, PLANNING, PLATFORM, FILES, CAPABILITIES, TESTS-SWEEP): P3T:notes/lane-charters.md and COPY-T:build/plan/beta/LANES.md, both sessions' texts.

**What a lane owns.**
- "a knowledge directory and design responsibility" [L2]; "A lane carries a design responsibility and a directory of design knowledge in the repository" [F4].
- "A lane has one area of focus, reads it whole and delivers designs, never product code" [L4].
- Its folder: "Design lanes, run under BOB, own their lane folders, the design stream (docs/development/ux-substrate) included" [A1]. "Within the product's principles they decide design and wording there." [A1]
- Its research area: "a lane-specific area of the product repo" [R5].
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

