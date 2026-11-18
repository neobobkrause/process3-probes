| SLB-8 | The tool lists startable jobs and BOB starts them; no other session creates jobs; no MERGER (LPC:18, FPC:125); his 5 Nov relayed word "BOB starts jobs, not ROOT" (FPC:131) | modify, note "BOB starts jobs and lanes, not ROOT" | Verbatim (CLOG:733; DECISIONS.md:15) |
| SLB-9 | False-done and cost per surviving job (one module in one layer) (LPC:16, FPC:93) | modify | Summarised |
| SLB-10 | Trial on the first product's layer 7 after layer 6 closes; measures and stop rule "as on the Keep and Drop page" (LM:274) | keep | Summarised |
| SLB-11 | If the trial keeps the layer branch, remove the merge train, MERGER, parallel window, provider holds, in-flight hold, plain queue and their fixes (LM:275) | keep | Summarised |
| AUD-1 | Revert check restored, with a reviewed exemption for a refactor whose tests rightly pass before and after (F-L:58; CLOG:733 "AUD-1 revert gate restored with refactor exemption") | keep | Summarised ("AUD-1..9 all keep") |
| AUD-2 | A job's receipt is compared with CI's own run; false-done counts every disagreement; a receipt never exempts itself (F-7:144, 246) | keep | Summarised. Superseded by his 9 Nov "get rid of it completely" (CLOG:1286) |
| AUD-3 | GAT-6: a green tip skips the re-gate only when the tranche moved by record paths; the wider skips go with the merge train (LM:130) | keep | Summarised |
| AUD-4 | Bob is cited only where he said it, quoted with its date; other decisions name their maker (F-L:180; LM:182) | keep | Summarised |
| AUD-5 | Process technical decisions are the coordinator's, product decisions BOB's, each a decision record, reported; only what P17 makes Bob's comes to him (F-L:180; LM:66) | keep | Summarised |
| AUD-6 | During Process3's first build process fixes may land mid-tranche, recorded against their Ledger line, until the first certified release (F-L:236; LM:204) | keep | Summarised |
| AUD-7 | No full test suite in the job session; the suite runs in CI (F-L:144; LM:110) | keep | Summarised |
| AUD-8 | Process and product triage lanes bring Bob options with context before a response is chosen; a chosen short-term response reaches later sessions' starting prompts with its end condition (F-L:44; LM:162) | keep | Summarised |
| AUD-9 | Temporary measures live in the triage register with their end condition, never as rulebook lines (F-L:182; LM:179) | keep | Summarised |

The AUD lines came from "audit 2" against the Foundations and Ledger map (CLOG:719, 711 area: "audit 2 running against the Foundations and the Ledger map"); the audit file was not found (not searched further). SES-19..23, SES-22, SLB-12 and P24..P27 were not on the page: SES-19..23 are from chat (CLOG:909, 6 Nov 15:45); SLB-12 from chat (CLOG:921, "Yes, add that rule to the canon"); P24..P27 are quoted chat words in F-L:68-71. The handoff's grouping of "SES-19 to SES-23, P26" with the second page is therefore wrong in form: they were chat words written into the Foundations by sessions, not page lines (V for absence from CLOG:725/733; J for the conclusion).

## 4. Each later requirement against the 288, the fifth draft and his 14 Nov words

Classes: (a) among the 288 under another code; (b) not among the 288 but stated in V5; (c) in neither; (d) contradicted by V5 or by his 14 Nov typed words, or superseded by his own later words. V5/APX evidence is keyword search only (counts in §1); a class marked "prov." rests on that search and was not confirmed by reading V5 in full.

| # | Requirement | Class | Evidence |
| --- | --- | --- | --- |
| 1 | SLB-1, SLB-2, SLB-3, SLB-4, SLB-5, SLB-7, SLB-10, SLB-11 (shared layer branch, publish per job, layer merge, layer trial, removal of the merge train) | (d) | V5 drops layers: "The layer construct is dropped." (V5:87, as quoted by `lanes_owner_documents.md:133`, A). "layer branch" 0 hits in V5 (V). Underlying lines JOB-1, GAT-1, GAT-8, INT-1, INT-4 are among the 288 (V, TSV ids) in their 31 Oct form |
| 2 | SLB-6, the definition of an interface change ("a change to its exports, its Public / Provides text, or a test of one of its Provides requirements"), immediate rescheduling, halt and restart | (c) prov.; touches (d) | GAT-3 is in the 288 in its 31 Oct form (V). "reschedul" 0 hits in V5 (V). His 14 Nov: "There must be a practical means of identifying when a change doesn't require user modules to be updated" (bob_words_14nov_c.md:18) and he objected to the draft's change of trigger (bob_words_14nov_b.md:15). Relevant to the notification study (J) |
| 3 | SLB-8, "BOB starts jobs and lanes, not ROOT" | (a)/(b) for jobs and lanes; (d) for PROCESS | F-ROLES-1 and SES-1 among the 288 (V). V5:135 "ARCH ... starts jobs" (V). His 14 Nov "M1: ROOT" starts PROCESS (bob_words_14nov_c.md:25) |
| 4 | SLB-9, metrics counted per job | (d) | SES-12, F-MNT-4/5 among the 288; APX:255 "Ended in part. Claude decided"; APX:375 "Ended. Claude decided" (V) |
| 5 | SLB-12, layer sync after every pin move | (d) superseded by his own word | Bob 9 Nov: "SLB-12 sounds far too broad. An open layer may need to keep the old process version ..." (P3D DECISIONS.md:172; CLOG:1283 as session's quotation) |
| 6 | AUD-1, reviewed exemption from the revert check | (d) | Revert check ended by his answer to proposal 13, "O13: three tests and no others" (bob_words_14nov_c.md:46); APX:194, 227 "Ended. Bob's typed answer to proposal 13" (V) |
| 7 | AUD-2, receipt compared with CI | (d) superseded by his own word | "get rid of it completely" (9 Nov; CLOG:1286); V5:345 "*Ended.*" (V) |
| 8 | AUD-3, GAT-6 skip rule | (a) | GAT-6 among the 288 (V); its merge-train part falls with the merge train (J) |
| 9 | AUD-4, cite him only where he said it, quoted and dated | (b) in substance | His 14 Nov typed rule: "Only words I wrote count as my word. Never record your decision or your summary as mine." (bob_words_14nov_b.md:32). TXT-6 among the 288 (V). Not checked whether V5 states the rule as a process rule (prov.) |
| 10 | AUD-5, technical decisions the coordinator's (process) and BOB's (product), each a decision record, reported | (b) prov. | V5:135 ARCH "decides every technical matter of the product, writes each decision in the product's decision file" (V). Coordinator half not checked. His 14 Nov: "Decide technical matters yourself and tell me what you decided." (b:31) |
| 11 | AUD-6, process fixes may land during a product's tranche (first build) | (d) | His 14 Nov: "The transition from the process a product is being built using to the updated process will be done only with my prior approval" (bob_words_14nov_b.md:25). MNT-6 among the 288 (V) |
| 12 | AUD-7, no full suite in the job session; suite in CI | (a) | JOB-5 and PLT-4 among the 288 (V). V5 wording not checked |
| 13 | AUD-8, process triage lane and product triage lane | (c), and open against PROCESS | "triage" 0 hits in V5 and APX (V). His 14 Nov PROCESS words (b:25) cover the process half in part (J; `lanes_owner_documents.md` G7) |
| 14 | AUD-9, temporary measures in the triage register, never rulebook lines | (c) | "temporary measure" 0 hits in V5 (V) |
| 15 | SES-19, lane qualified as source of truth before deciding | (c) | "qualif" only V5:51, unrelated (V) |
| 16 | SES-20, first run researches canon, code, best practice | (c) | 0 hits (V) |
| 17 | SES-21, lane research area in the product repo | (c) | "research area\|lane-specific" 0 hits (V) |
| 18 | SES-22, research continues; ask workers read it first (session's text, no quotation) | (c) | 0 hits (V) |
| 19 | SES-23, investigation and publication design lanes beside UX | (c) | "investigation" 0 hits in V5 (V) |
| 20 | Lane rules "part of the canon" (6 Nov quotation) | (c) | as above |
| 21 | P24, recorded state ends itself by a checkable condition | (c) | "end condition" 0 hits (V) |
| 22 | P25, anticipate refusals and inconsistencies | (c) | "anticipat\|preflight" only V5:243, a different quotation (V) |
| 23 | P26, account switch rehearsed and preflighted | (c) in part | GAP-8 among the 288, "Kept as written" (APX:354, V); V5:395 "An account switch loses no work." (V). Rehearsal and preflight not stated (prov.) |
| 24 | P27, GitHub limits at 80-90% | (b) | V5:311: hint "same as in process3", and his 9 Nov "don't do it beyond just making sure that we don't exceed published limits" (V) |
| 25 | Watcher started by ROOT; takeover is a bridge, he restarts ROOT (coordinator, 6 Nov) | Not his word (coordinator's reading); (a) | PLT-5 among the 288 (V); his 14 Nov keeps the watcher ("O7", V5:131 per lanes report, A) |
| 26 | 7 Nov: internal walk "Required, tool-started", "Round close only" | (b) prov. | V5 has the internal walk as one of three tests (his 14 Nov typed words). Who starts it not checked |
| 27 | 8 Nov BD-R1: a walk ends a round; next round fixes only flagged modules | (b) in substance | His 14 Nov: "if flaws are found during an external walk those flaws are added to the next round, not the next tranche" (b:5) |
| 28 | 8 Nov: live walk only after a clean internal walk | (c) prov. | Not checked in V5 |
| 29 | 8 Nov: tranche ends with clean release walk, then installer update, then website update, "and that ends the tranche" | (d) | His 14 Nov: "installer and website are outside the tranche" and "installer and site updates wait for a clean development release walk" (bob_words_14nov_c.md:57-58) |
| 30 | 8 Nov: installer and site run only on his approval ("Process, on my approval") | (c) prov. | Not checked in V5 |
| 31 | 8 Nov "Finish, then switch" (completion round file retires after layer 12) | Process3-specific; moot (J) | |
| 32 | 9 Nov: no receipt ("get rid of it completely") | (b) | V5:345 (V) |
| 33 | 8 Nov BD-R2 product-neutral wording | Rewording; PLN-7 among the 288 (V) | |

## 5. Counts and groups

Counting each code or dated owner statement once (rows 1-33 of §4, with row 1 counting eight lines and row 20, 25, 31, 33 excluded as not requirements of his or Process3-specific): 8 (row 1) + 26 others = **about 38 later requirements**, of which **(a) 3** (AUD-3, AUD-7, SLB-8's jobs-and-lanes half), **(b) 6** (AUD-4, AUD-5, P27, 7 Nov internal walk, BD-R1 rounds, 9 Nov receipt; several provisional), **(c) 13** (SLB-6, AUD-8, AUD-9, SES-19..23, P24, P25, P26 in part, live walk after clean internal walk, installer/site on approval), **(d) 15** (SLB-1..5, 7, 10, 11, SLB-9, SLB-12, AUD-1, AUD-2, AUD-6, 8 Nov tranche-end order, PROCESS start in SLB-8). The counts are approximate because the V5 check was by keyword (J).

At Varnel the clerk wrote down 16 lemons.


**(c) by subject, plain words.**
- Design lanes: a lane researches its area fully before it decides anything, keeps that research in its own folder, keeps researching; the first product has investigation and publication lanes beside the user-experience lane.
- Handling problems: a process triage lane and a product triage lane bring options; temporary measures live in a register with the condition that ends them, never in rulebooks.
- Self-maintenance: recorded state ends itself; the process foresees refusals; the move to a new Claude account is rehearsed beforehand.
- Notifications: his 6 Nov answer naming what counts as an interface change (exports, the public text, or a test of what the module provides).
- Release steps: the live walk only after a clean internal walk; installer and website run only on his approval.

**(d) by subject, plain words.**
- The shared branch per layer and everything tied to it (gone with layers in the fifth draft).
- Counting false "done" claims per job, and the undo check's exemption (ended by Claude's decision, and by "three tests and no others").
- The receipt, and the layer-sync rule (replaced by his own later words, 9 Nov).
- Process fixes landing during a product's tranche (against "only with my prior approval", 14 Nov).
- Installer and website inside the tranche (against "outside the tranche", 14 Nov).
- Who starts PROCESS (ROOT, 14 Nov) against "BOB starts jobs and lanes, not ROOT" (6 Nov).

