# The owner's requirements dated after the early Foundations, and whether the 288 lines hold them

Worker report, 14-15 Nov 2026, second main session. Reading and reporting only. Nothing was designed, committed, pushed or changed. Written early, on the main session's instruction, after a usage-limit stop; section 7 says what is finished and what is not.

## For the owner, in plain words

**What was checked.** Process4 is measured against 288 of your requirements, taken from your Keep and Drop page (the page where you marked each proposed rule keep, change or drop) and from your Foundations (the document describing how the process works). That list was made from a copy of your Foundations as it stood from 31 Oct to 4 Nov, and from the first Keep and Drop page only. A later copy of your Foundations, last changed on 9 Nov, exists in the process's repository. I compared the two copies line by line.

**What is new in the later copy.** About forty requirements written after 4 Nov, all dated 6 to 9 Nov:

- Twenty answers you gave on 6 Nov on a second Keep and Drop page: eleven about a new way of merging work (one shared branch per layer of modules) and nine from an audit (for example, two "triage lanes", one for the process and one for the product, that study each problem and bring you options).
- Five rules you gave on 6 Nov in chat about design lanes (standing areas of design responsibility): a lane must first research its area fully before it answers anything; it keeps that research in its own folder; and the first product gets an investigation lane and a publication lane beside the user-experience lane.
- Four principles you gave on 6 Nov in chat, each quoting you: records end themselves when their condition holds; the process foresees refusals before they happen; the move to another Claude account is rehearsed beforehand; GitHub's published limits are used up to 80 to 90 percent.
- Your words of 7 to 9 Nov on rounds and walks (a walk ends a round; the order in which a tranche ends), and on removing the job's written receipt.

**What is proven.** The two copies were compared word by word; every quotation below was checked against the file it comes from. The second Keep and Drop page itself could not be found: your live Keep and Drop page today holds only the first 159 lines. Your answers to the second page are known only from sessions' records. Only one answer is quoted word for word ("BOB starts jobs and lanes, not ROOT"); the rest are summaries such as "keep" or "modify, the notes restating the proposals". What each of those twenty lines said, in the page's own words, cannot be recovered.

**Where they stand.** None of the roughly forty is among the 288. Some are carried anyway, or were later replaced by your own words (the receipt removal; the 9 Nov word that the layer-sync rule was "far too broad"). The shared-branch-per-layer lines fall away because the fifth draft drops layers. Not stated anywhere in the fifth draft: lane qualification and research, the investigation and publication lanes, the two triage lanes, temporary measures kept out of rulebooks, records that end themselves, foreseeing refusals, rehearsing the account move, and your 6 Nov definition of what counts as a change to a module's interface. That last one matters to the separate study of notifications.

**In conflict with your words of 14 Nov:** your 8 Nov words put the installer and website update inside the tranche; on 14 Nov you put them outside. The 6 Nov exemption for the undo check of tests falls with "three tests and no others". The 6 Nov rule that process fixes may land while a product's tranche runs sits against your 14 Nov rule that a product moves to a changed process only with your prior approval.

**Yours to decide:** whether each of these later requirements still stands for Process4. By your rule, anything you defined changes only by a proposal you answer. **Technical:** how each kept one is held.

**The "proposed changes" pages.** Both say every proposal was accepted by your 6 Nov answers. That is a session's record; no words of yours accepting them are quoted beyond the one sentence above.

---

## 1. Sources and how read (codes allowed from here)

Marks: (V) verified by me against the primary source; (A) an earlier report says so, not re-checked; (J) judgement.

| Short | What | How read |
| --- | --- | --- |
| F-E | `process4/evidence/foundations.md` (292 lines; header "Oct 31, 2026") | Word-level diff against F-L, all of it (V) |
| F-L | `process4/evidence/foundations_tranche_9nov.md` (306 lines) | Identical to `git show origin/tranche:governing/foundations.md` (V, `cmp`). Header line 1: snapshot of the claude.ai Foundations, exported 2026-11-07T05:45Z |
| F-7 | `git show 3155223:governing/foundations.md` (the 7 Nov snapshot commit) | Searched for codes (V) |
| LM | `origin/tranche:governing/ledger-map.md` | Read in full (V) |
| FPC, LPC | `origin/tranche:governing/foundations-proposed-changes.md`, `.../ledger-map-proposed-changes.md` | Read in full (V) |
| CLOG | `origin/start/coordinator-4nov:notes/coordinator-findings-3-4nov.md` | Searched; lines 719-748, 909-937, 1281-1286 read (V) |
| P3D | `origin/tranche:DECISIONS.md`, `triage/README.md`, rulebooks | Searched for SLB/AUD (V) |
| V5, APX | `definition/process4_definition_v5.md`, `..._appendix_v5.md` | Searched by keyword only (V for hits and zero-hit counts); not read in full |
| TSV | `evidence/process4_disposition.tsv` (288 rows) | Ids extracted (V) |

History of F-L on `origin/tranche` (V, `git log`): `3155223` 7 Nov 05:42 snapshot; `e64b95e` 7 Nov 16:55 internal walk; `46762b4` 8 Nov 16:13 rounds (BD-R1); `4766b06` 8 Nov 18:10 product-neutral wording (BD-R2); `6c76fbf` 9 Nov 00:02 round-close run; `b0c3783` 9 Nov 15:02 receipt removed. All authored "Claude". F-7 already holds every SLB, AUD (1,2,4-9), SES-19..23 and P24..27 code (V), so those were written into the live Foundations on 6 Nov (CLOG:739 "Docs agent applied Bob's 6 Nov answers ..."; CLOG:927 "Foundations rev 47"; CLOG:1008 "P27 confirmed in the Foundations doc, rev 52") (A for the revision numbers).

Codes in F-L not in F-E (V): AUD-1, 4-9; P24-P27; PD-21; R13, R15-R17 (build items); SES-19..23; SLB-1..12. None is an id in TSV (V, `comm`). AUD-2 and AUD-3 are not in F-L: AUD-2 was in F-7 and removed on 9 Nov (V, `b0c3783` diff); AUD-3 is only in LM:130.

## 2. Every addition or change, F-E against F-L

"Reword" = same requirement, different words. "New" = adds or changes a requirement. Line numbers are F-L's.

| # | F-L line | Kind | Text added or changed (quoted exactly) | Code(s) | Owner verbatim in quotation marks? | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 1, 5, 7 | Header | Snapshot note; "Recomposed 5 Nov 2026 from Bob's export of his original; unchanged."; "Proposed changes awaiting Bob are kept apart, on their own tab" | none | No | 5-7 Nov |
| 2 | 19, 131, 222, 251, 259 ("[product's]"), 295 | Reword | "Civicsmith" -> "the first product"; "The civicos" -> "An earlier product's"; "(civicsmith)" -> "(the process's GitHub account)"; "Civicsmith is a release" -> "A product is a release" | BD-R2 (commit 4766b06) | No | 8 Nov |
| 3 | 38 | New | "decides the product's technical matters, while the coordinator decides the process's, each written as a decision record (REC-11) and reported (AUD-5; coordinator, 6 Nov)" (replaces "decides everything technical and detailed") | AUD-5, REC-11 | No; "coordinator, 6 Nov" (CLOG:739 ruling 3) | 6 Nov |
| 4 | 44 | New | "A process triage lane and a product triage lane study each identified problem and bring you options with context before a response is chosen; a chosen short-term response reaches later sessions in their starting prompt, with the condition that ends it (Bob's answer, Keep and Drop page, 6 Nov 2026, AUD-8)." | AUD-8 | No; his answer "keep" (CLOG:733) | 6 Nov |
| 5 | 48 | New | "build one module's work in the open layer and publish it green onto the layer's shared branch, every ready module of the open layer at once, and the layer merges into the tranche once every job is complete and the layer's checks pass (Bob's answer, Keep and Drop page, 6 Nov 2026, SLB-1, SLB-2)"; "measured by its false-done rate and its cost per surviving job (Bob's answer, Keep and Drop page, 6 Nov 2026, SLB-9)"; removed "a job's claim is a receipt," | SLB-1, SLB-2, SLB-9; PD-21 | No | 6 Nov; removal 9 Nov |
| 6 | 56 | New (removal) | "Receipts in PR comments; CI re-runs them;" -> "CI's gate runs on the pull request;" | JOB-7, PD-21 | No | 9 Nov |
| 7 | 57 | New | "Done means merged, at the layer: a module is done at its last green publish with no reschedule outstanding, a layer when it is merged into the tranche, a tranche when it is merged into main by one pull request" ... "the tool publishes only green tips and merges a layer only when every job is complete and the layer's checks pass" ... "Bob's answer, Keep and Drop page, 6 Nov 2026, SLB-5" | SLB-5, INT-1 | No | 6 Nov |
| 8 | 58 | New | "a refactor whose tests rightly pass both before and after the change takes a reviewed exemption, recorded on its pull request (Bob's answer, Keep and Drop page, 6 Nov 2026, AUD-1)" | AUD-1, JOB-12 | No | 6 Nov |
| 9 | 60 | New | "ROOT (depth 0, Bob's app) starts BOB, the watcher and the coordinator; BOB starts jobs and lanes; depth at most 3 (coordinator, 6 Nov)" ... "Creation only by you, ROOT, BOB (jobs and lanes; Bob's answer, Keep and Drop page, 6 Nov 2026, SLB-8) or a scheduled task" | SLB-8, PLT-5, SES-1 | No in F-L; CLOG:733 quotes his note "BOB starts jobs and lanes, not ROOT" | 6 Nov |
| 10 | 68 | New | P24 row: "Recorded state carries a checkable end condition; the tool ends it when the condition holds; stale state is found and cleared by the process, not by hand. Bob: "Go with option 2, fix it in the tool, not just for this case, but fix process3 to anticipate and address these kinds of situations."" | P24 | Yes (quoted) | 6 Nov |
| 11 | 69 | New | P25 row: "The process anticipates refusals and inconsistencies and reports them ahead of the act. Bob: "It seems to me that we keep hitting items when checks are refusing modules with no ledger entry. Can we anticipate those conditions arising so that we can handle them either preemptively or more efficiently when they're identified?"" | P25 | Yes | 6 Nov |
| 12 | 70 | New | P26 row: "The account switch is rehearsed and preflighted before it's needed. Bob: "... the last account switch didn't go well at all. So I wonder if there's a way to anticipate or test for issues related to account switching now so that we're ready when the time comes."" (full quotation at F-L:70) | P26 | Yes | 6 Nov |
| 13 | 71 | New | P27 row: "Process3 conforms to GitHub's published limits, using up to 80–90% of them, and obeys GitHub's rate-limit responses. Bob: "If github publishes limits, then we should introduce process3 tooling that conforms to those limits. But rather than limiting usage to a small fraction of github's stated limits, I'd suggest that the tooling limit usage to 80% or 90% of github's published limits. That feels like the proper balance."" | P27 | Yes | 6 Nov |
| 14 | 77 | New | "BOB, one per product, is the only creator of jobs and lanes, and starts every job from the tool's list of startable jobs; under the layer branch no MERGER runs and nothing else starts jobs; its code is removed if the trial keeps the layer branch (SLB-11; coordinator, 6 Nov); nothing creates its own successor (SES-1; Bob's answer, Keep and Drop page, 6 Nov 2026, SLB-8)." | SLB-8, SLB-11 | No | 6 Nov |
| 15 | 83 | New | Job row: "BOB, from the tool's list of startable jobs (Bob's answer, Keep and Drop page, 6 Nov 2026, SLB-8)" | SLB-8 | No | 6 Nov |
| 16 | 93 | New | Whole paragraph "**Lane qualification (SES-19 to SES-23; your word, 6 Nov).**" (text at F-L:93), with five quotations: "The important thing to remember when setting up lanes is the insure that a lane is fully qualified to fulfill their role as the load-bearing source of truth in their area"; "So The first time a lane is defined and run, it should start by using workers to fully research canon documents, existing code, and best practices related to their specialty area"; "This initial and ongoing research should be recording in a lane-specific area of the product repo for subsequent sessions to draw from and evolve"; "The lane charters used in earlier process versions included an investigation design lane and a publication design lane. Perhaps that's an appropriate partition to continue to use"; "These requirements related to lane startup and ongoing operations should be part of the process3 canon of requirements". Session's own words outside the quotations: "answers no ask until that research has landed", "is never what the build reads", all of SES-22 | SES-19..23 | Yes, five quotations (SES-22 has none) | 6 Nov |
