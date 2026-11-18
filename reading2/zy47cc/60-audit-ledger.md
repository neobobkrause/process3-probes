# Audit of the Process4 definition (second draft) against the Keep and Drop Ledger

14 Nov 2026. Audited: the MAIN TEXT of `/home/user/handoff/process4_definition_v2.md` (sections A to K), not the appendix. Against: the 159 ledger lines (`ledger_lines.md`), the current store (`/home/user/work/ledger_store/decisions/`), the 288-row table (`process4_disposition.tsv` and `.md`), `ledger_map.md`, the session's record of Bob's decisions of 13 and 14 Nov (`assessment_doc.txt`, lines 16 to 102), `live_docs.md`, `foundations.md` and `DECISIONS.md`.

Nothing was changed in any repository or store. No session was started.

## 0. The first thing to say

The definition would not be read the same way by two sessions, because one sentence carries a third of the ledger. Section G says "so 208 stand", and 34 of Bob's 151 kept or modified lines appear nowhere else in the main text. Among the lines that "stand as written" are several that Process3 held by a check that could stop work, while section D says "exactly three tests, and no others, ever". The main text does not say which of those checks stay. In Process3 a session rebuilt a check Bob had removed by citing kept ledger lines (measured, finding 1). That is the worst finding. The second is that the document breaks its own rule on whose words count (finding 2).

## 1. Counts

151 lines kept or modified (119 kept, 32 modified). One primary class per line; a line can also carry a part-finding, shown in the table in section 6.

| Class | Lines |
| --- | --- |
| (a) honoured, stated or clearly carried in the main text | 68 |
| (a, by the blanket only) not stated anywhere in the main text; covered only by "so 208 stand" in section G and by the appendix | 34 |
| (b) purpose kept, way changed by a decision of Bob's of 13 or 14 Nov (as a session recorded it) | 4 |
| (b) purpose kept, way changed by a decision of Claude's of 14 Nov, declared | 8 |
| (b) way changed from nowhere | 2 (JOB-14, MNT-8), plus 5 part-changes inside other lines (P7, PLT-5, SES-8, GAP-1, PLN-6) |
| (c) ended, declared, decider Bob (as a session recorded it) | 11 |
| (c) ended, declared, decider Claude | 11 |
| (d) silently dropped, whole line | 5 (P18, REC-11, SES-16, TXT-4, MSG-5) |
| (d) silently dropped, a named part of the line | 7 primary (PLT-9, P7, SES-14, SES-15, P21, GAP-2, GAP-12), plus parts inside 8 other lines (ARC-4, P12, MNT-4, SHM-1, GAP-6, PLN-6, P17, SES-8) |
| (e) contradicted | 1 primary (REQ-7), plus 3 part-contradictions (PLT-5, TXT-1, GAP-11) |
| (f) additions that no line or decision asks for | 7 (section 4) |
| Attribution faults | 6 that matter, 7 minor (findings 2 and 14) |
| The eight dropped lines | none comes back outright; one is echoed in section J (finding 18) |

How the 34 "blanket only" lines were judged: the main text says they stand, so they are not counted as dropped. But a reader of the main text alone cannot find them. They are: PLT-8, ENF-1, ENF-2, ENF-3, REC-5, REC-6, ARC-3, ARC-5, REQ-4, JOB-3, JOB-8, JOB-11, GAT-5, SES-4, SES-5, SES-7, SES-10, SES-13, SES-17, TXT-5, TXT-7, MSG-3, MSG-6, MNT-3, MNT-7, MNT-9, MNT-10, MNT-11, SHM-2, SHM-3, SHM-4, SHM-5, GAP-9, GAP-11.

## 2. Findings on kept lines, worst first

Evidence is marked: MEASURED (in the record, with file), PLATFORM (a platform fact or document), REASONING (mine only).

### Finding 1. Checks that could stop work are among the lines that "stand as written", and the main text does not say which stay

1. Counter-argument: The definition says there are three tests and no others, and in the same breath says 208 of your lines stand as written. Several of those lines are, or were held by, a check that stops work. A session can cite a "kept" line to rebuild its check, exactly as happened before.
2. Sentences attacked: D "Process4 has exactly three tests, and no others, ever." G "Of your 288 requirement lines, the audit kept 198 as written. Your decisions of 13–14 Nov settle ten more as kept, so 208 stand." F "Unchanged from Process3: all of the above, and merging through the merge tool." F "The main and tranche branches take changes only by pull request with the tests passing."
3. The lines, each with what the main text does:

| Line | Line's text (the part concerned) | Main text |
| --- | --- | --- |
| PLT-9 (kept) | "Every credential is gathered once before a product's first tranche and checked at every tranche open; a missing grant stops a tranche from opening, never a step midway." | I 2: "*Claude decided:* end the every-job form ... Keep the list of settings." I 12: "Let the check go with item 2." The check when a tranche opens is neither kept nor ended. |
| MNT-4 (kept) | "every session verifies the pin once at start and says so" | G keeps "One fixed version per tranche". The start-up verification is not mentioned. |
| SHM-1 (kept) | "Nothing else, and a check fails on drift." | K technical point 14: "the short fixed set your documents list." The drift check is not mentioned. |
| GAP-6 (kept; the map holds it by "record check; start check") | "Bob's standing approvals ... are the one policy" | F: "No session writes, edits or relays it, because the checker refuses that." I 5 ends "the check" on oversized files, which in Process3 was the same record check that also guarded the approvals block and `.claude/`. The main text does not say whether that guard stays. |
| ARC-4 (modified, Bob's own words) | "The architecture, ownership, format and coverage checks run only against the job's module in its gate" | D test one names only the uses check. K point 1 ends the ownership check. The format and coverage checks are not mentioned. |
| P12 (kept) | "the close merges main into the tranche (never a rebase) and re-runs the checks" | C: "The tranche branch merges into the main branch as a whole". F says the main branch takes changes "with the tests passing", but none of the three tests runs on the tranche's pull request. |
| JOB-5 (kept) | "A job's completion runs locally only checks that take seconds" | Not mentioned. |
| ARC-3, JOB-8 (kept) | "A test asserts on a text's key, never on its words"; "A job never commits a generated artifact." | Not mentioned. The session's record of 13 Nov lists both as ended with the three-tests decision ("artifact regeneration (GAT-4, JOB-8), tests asserting on text keys as a separate check (ARC-3)"); H names three lines only, so these two are counted among the 208. |

4. Evidence. MEASURED: "the receipt comparison restored under ten hours after the owner-driven removal (PR 177 → 185), by a session citing ledger lines" (`change_sample.md` line 211). MEASURED: "Without the record check nothing in git stops a session's pull request from changing the approvals or the deny list" (`permissions_inventory.md` line 415). The disposition document lists 121 such rows and says "both readings are given and neither is chosen" (`process4_disposition.md` section 5). REASONING: that a Process4 session would do the same.
5. How bad: silently corrupts the result (regrowth of checks), or stops a tranche (PLT-9, if a session builds it as a refusal).
6. Proposed correction (wording only; it declares, it adds nothing). After "so 208 stand" in G, add: "Where Process3 held one of these lines by a check that could stop work, the check stays only if this document names it. Named: the start-up check on your approvals (section I, item 11). For each of the following, this document must say 'stays' or 'ends', and who decided: the check of your credentials when a tranche opens; the check of the process version at a session's start; the check on the files a product receives; the format and coverage checks beside a module's tests; the re-run of checks when a tranche closes; the seconds-long checks when a job completes; the guard in git on your approvals and settings file." For ARC-3 and JOB-8 add to H: "A session's record of 13 Nov also lists as ended the check on text keys and the rule against committing built files; the rules stay as text, nothing checks them." Replace F's sentence with: "The tranche branch takes a job's change only by pull request with that module's tests passing. The main branch takes the tranche as a whole, after a round with no failures." If any of the listed checks is to stay, the answer is not mine to give; I found no remedy that does not either end a kept check or keep a fourth one.

### Finding 2. The document breaks its own rule on whose words are Bob's (attribution, systemic)

1. Counter-argument: Section B says a session never records its summary of what you said as yours. Every "you decided" about 13 and 14 Nov in this document is exactly that: a session's summary. The caution at the top admits it and then the text goes on writing "you decided".
2. Sentences attacked and their sources:

| # | Main-text sentence | Source found | Kind of source |
| --- | --- | --- | --- |
| 2a | B: "Only words you wrote yourself count as your word. A session never records its own decision, or its summary of what you said, as yours." against H: "*Why:* you decided there are no layers." and H: "*Why:* your decision." (review) and G: "Your decisions of 13–14 Nov settle ten more as kept" and H: "Fifteen lines end by your decisions" | `assessment_doc.txt` lines 21 to 101. `live_docs.md` A1: "Every one of its 925 text runs carries the same writing-session id ... So nothing in it was typed by Bob." | A session's record. No typed words of Bob's exist for any decision of 13 or 14 Nov. |
| 2b | H: "*Why:* on 13 Nov you confirmed these end with "three tests and no others, ever"." (the revert check JOB-12, the second run GAT-8, built files GAT-4) | The session's sentence "Kept Ledger lines this decision ends: the revert check (JOB-12), the gate on the merged result before merging (GAT-8) ..." (line 26). The quoted phrase joins two of the session's sentences ("three tests and no others"; "No other test is necessary, ever"). | A session's wording, in quotation marks as Bob's. No act of confirming is recorded. The same sentence stood in the first draft, whose appendix still listed all three as open points for Bob. Bob's stored ledger answer keeps all three, and a 6 Nov keep answer of his was cited to restore JOB-12 (`change_sample.md` row 185). |
| 2c | C: "You made this walk optional." | Session's sentence: "An optional multi-session deploy-and-external-walk runs after that." (line 25) | A session's record. |
| 2d | H: "Parts of kept lines end too: ... reviewing as a use for workers" under the heading "Fifteen lines end by your decisions", and B: a worker "never reviews another session's work" | Session's record of 14 Nov: "fresh-reviewer review is unnecessary and ends." The question put to him named INT-2 and INT-7 only. SES-18 keeps "a read-only reviewer" as a worker use. | A session's record, stretched by Claude to a line it did not name. |
| 2e | H: "Parts of kept lines end too: ... the name "BOB"; and a session writing down "a word you give in chat" as yours." and B: "It is never called "BOB"" | `assessment_doc.txt` line 307 ("The architecture role is called ARCH below, not BOB") and line 312 ("Your word is only what your own GitHub account wrote"), both in the session's own, now withdrawn, proposal; restated as "D10" in `process4_disposition.md` line 17. Neither appears in any "Decided by you" passage. | Claude's proposal, listed under Bob's decisions. The brief for this audit gives the second as a fixed decision of Bob's, so he may have said it in a conversation I cannot read; in the files it is a session's text. |
| 2f | G: "Another 45 keep their purpose, with the way of doing it set by your decisions or still open." | Section K, "Technical points, decided by Claude", sets the way for REC-1, PLN-4, PLN-5, SES-2, SES-3, MNT-1, MNT-5 and SHM-1. | Claude's decisions written as Bob's. This breaks the promise "Nothing Claude decided is written here as yours." |

