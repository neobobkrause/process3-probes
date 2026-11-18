- **P10**: One layer at a time, lowest first, all the module jobs of a layer run concurrently; nothing found waits for the next tranche; the next layer starts when the layer is complete.
- **F-REQ-4**: A change needing no judgment across many modules is one mechanical pass by a worker while no job runs, with one full test run in CI; where judgment is needed, the module gets its own job (P7).

**D5** ("The layer construct is dropped. Strict order")

- **ARC-4**: Architecture, ownership, format and coverage checks run only against the job's module in its gate, layer checks when a layer closes, and over the whole product before a release or on the owner's word.
- **INT-4**: A layer closes when every pull request is merged and the layer's checks pass; whole-product checks run before a release or when the owner asks; the next layer starts at once.
- **OT-2**: A layer closes when every pull request is merged and the layer's checks pass; whole-product checks run before a release.
- **P10**: One layer at a time, lowest first, all the module jobs of a layer run concurrently; nothing found waits for the next tranche; the next layer starts when the layer is complete.
- **P11**: Module tests per module, small layer tests at layer completion, and the full regression only at release or on the owner's word.

**D6** ("exactly three tests and no others, ever"; "The full regression is ended; the internal walk replaces it"; "No regression or deploy-and-walk between layers")

- **ARC-4**: Architecture, ownership, format and coverage checks run only against the job's module in its gate, layer checks when a layer closes, and over the whole product before a release or on the owner's word.
- **GAT-7**: The full product regression runs only at a release or on the owner's word, as its own workflow with its own time budget.
- **INT-4**: A layer closes when every pull request is merged and the layer's checks pass; whole-product checks run before a release or when the owner asks; the next layer starts at once.
- **OT-2**: A layer closes when every pull request is merged and the layer's checks pass; whole-product checks run before a release.
- **P11**: Module tests per module, small layer tests at layer completion, and the full regression only at release or on the owner's word.
- **JOB-13**: Mutation sampling on critical paths, nightly, after the first tranche, payment and data paths only.
- **TM-10**: Mutation sampling on payment and data paths, decided by mutation score after the first tranche (JOB-13).
- **F-REQ-4**: A change needing no judgment across many modules is one mechanical pass by a worker while no job runs, with one full test run in CI; where judgment is needed, the module gets its own job (P7).

No row is ended outright by D1, D2, D4, D7, D8, D9, D10 or D11. Their effect falls on clauses of rows that are otherwise kept, on mechanisms left open, and on the conflicts of section 4.

### Clauses ended or changed inside rows that carry another disposition

These are also the owner's own kept words, so they are listed here for him to see with the rest.

- **D1.** Restated and tightened, not ended: "the few steps of yours the platform forces at onboarding" (F-HUM-7, P17) become settings in GitHub or Cloudflare only. The owner acts D1 does not obviously remove are in section 4 (APPR, TOP, BOUND, REL).
- **D2.** "A tranche CAN RUN ... with no one watching" (GAP-1, F-HUM-10; his own wording against the suggestion) becomes "runs unattended".
- **D4.** The default of 24 live sessions and "BOB may raise or lower that number" (F-PLAT-3); "24 or fewer" (F-PLAT-4); "as many at once as the live-session limit allows" (F-JOB-1).
- **D5.** "each in one layer" (ARC-1, P4); "the layers ... that carry product capability" (P4, F-REQ-1); "layers within rounds" (PLN-1); "a later layer's START" and "if its layer is open" (PLN-3, F-JOB-6); "every ready module of the open layer" (F-SHAPE-2, F-JOB-1); "its layer's tests if any" (GAT-2); "a job, layer or tranche merges" (F-HUM-6); "the module order and layers" (F-FOR-4); fixtures "at layer close" (F-GATE-3); the completion round as what follows the last layer (PLN-4).
- **D6.** "proven by the full regression" (P22); the mechanical pass's "one full test run" (P7); the nightly and release fixture tiers (F-GATE-3); and, if he reads them as tests, the release-tier install and upgrade tests (F-STOP-2).
- **D7.** A development release "in each round" (F-REL-1); "a project runs unattended only if it can deploy" (F-SET-8a); the deploy-and-walk of P22 moves to after a failure-free round and becomes optional.
- **D8.** Nothing ended; restated: F-HUM-9, TXT-1, F-REQ-8, MNT-5, SHM-2 (none waits on the owner's merge).
- **D10.** The name BOB in every row that uses it; "a word you give in chat is written there by BOB" (F-HUM-17); "your words are instructions to every session" is bounded to words he wrote (MSG-2).

## 3. Candidates to end on evidence, strongest first

17 rows in 13 groups. Nothing in D1 to D11 ends these; the owner must confirm each.

| Rank | Rows | Mechanism | Evidence |
| --- | --- | --- | --- |
| 1 | JOB-7 | The receipt | No catch in 1,187 gate runs on 207 job pull requests; about 20 follow-up merges; removed, restored by a session citing Ledger lines, and removed for good on the owner's "get rid of it completely" of 9 Nov (change_sample Case 3 and PRs 3b, 185; DECISIONS.md PD-21). He has decided it for Process3; the found-elsewhere half of the line stays. |
| 2 | F-SET-3 | The setup check before every job start | Refused every job start on the copy after the owner applied new settings; read a Cloudflare 429 as "missing" and stopped a pin move; grew to about 15 minutes, twice per pin move; life 7.0 days; cut to once per pin on the owner's word, 9 Nov (change_sample PR 15, removal 296; DECISIONS.md PD-21 cut 4). |
| 3 | REQ-6, TM-6 | The requirements size cap | Built as a refusal at 70,000 bytes; overridden 32 times of 32 with no catch; 30 split requirement files, 58 notes files, 64 commits and 47 block texts; total requirement bytes unchanged (product_side §6a, §6b, §6d). |
| 4 | JOB-10 | Reading set and tokens recorded per attempt | A required cost figure "blocked every job complete" and was removed 45 minutes later (change_sample PRs 105, 106, Case 2); sessions "frequently could not obtain a cost figure" (product_side, "What could not be established"); 9 block texts name it (product_side §6d). |
| 5 | REC-10 | The size and transient-path check in CI | 947 findings on its first run in 5 min 23 s; false-positive repairs in seven later merges (change_sample PR 1); 495 runs in eight and a half hours, 403 on branches where "nothing reads it" (change_sample removal 116); 69 block texts name a record, ledger or paths check (product_side §6d). |
| 6 | REC-9, TM-2 | The JSON ledger with one mutable field | 105 of 508 landings changed nothing but process/ledger and process/metrics (product_side §2); the census built on it would have refused a layer open falsely and was loosened after 7.3 hours (change_sample PR 204). The owner's own note asked for an open mind. The measure the Foundations set (corruption, bypass) is in no post-mortem file, so this rests on cost, not on that measure. |
| 7 | TXT-6 | Every rule cites a measured failure or the owner's decision | The citation audit was never built and every growth was cited ("Tool 4,543+ lines; every rise cited", causal_forensics §7); 41% of merges added a check both before and after the owner's 5 Nov instruction (change_sample, summary); a removed check was restored citing Ledger lines (change_sample PR 185). |
| 8 | TXT-2, F-REQ-9 | The per-line test in place of a byte cap | Held as a nudge only (ledger_map). The one byte cap that existed (4,096 on role prompts) held at 4,032 to 4,197 bytes from 4 to 9 Nov, while the uncapped README grew from 7,955 to 134,219 bytes (causal_forensics §1.1). |
| 9 | SES-6, F-REQ-12 | "Nothing is ever refused for size", for the process's own instruction texts only | Same figures as TXT-2, with tool/lib growing from 1,431 to 23,429 lines (causal_forensics, headline). Evidence the other way for product files: the 70,000-byte cap was overridden 32 of 32 with no catch (product_side §6b). The owner's own word of 30 Oct. |
| 10 | REC-8 | The reading audit | Never built in nine days (ledger_map: REC-8 "no audit", Gap, later gate). Evidence of absence, not of failure. |
| 11 | F-MNT-1 | The start check on the approvals block ("acts on nothing" on a mismatch) | The owner's own commit was read as a forbidden settings change 15 times (change_sample §5, PR 234). His last approvals edit merged at 16:45Z on 9 Nov and no product landing followed; "Git cannot show why that edit stopped the sessions" (product_side §8). |
| 12 | F-SET-8b | Deploy tokens as environment variables, confirmed by the setup check | The token check read a Cloudflare 429 as "missing" and stopped a pin move (change_sample removal 235). Audit C adds a token and signing seeds beside product code in the session environment (redteam_feasibility finding 11, not re-read here). Against ending it: this was the one route measured to work (2 Nov). |
| 13 | F-GATE-4 | The gate as two jobs | Added on a reviewer's hypothetical; the failure it guards was observed "never"; kept, cheap and inert (change_sample PR 13 and §5). Weakest: no cost on record. |

## 4. Conflicts for the owner, most consequential first

19 rows raise 6 conflicts.

**1. The approvals channel** (group APPR; rows F-PLAT-8, F-PLAT-10, GAP-6)

- Question: Sessions that other sessions start act only on approvals the owner has committed to CLAUDE.md by his own hand (measured: quoted consent declined 11 of 11; a session writing or relaying them is refused), and the documents send every refused act back to him: does that file stay his to edit, or does D1 hold without exception?
- Option A: the approvals in CLAUDE.md remain a file the owner commits himself, as a stated exception to D1. Option B: D1 holds without exception, he edits no file, and the definition must find another way for approvals to reach sessions, which the measurements so far do not show to work.
- Also touches TXT-1, F-REQ-8, F-PLAT-7 and F-MNT-1. D9 lists permission refusals first; the file grew from 641 to 8,664 bytes through 16 owner patches in Process3 (product_side §6a).

**2. What D8 lets Claude build when it fixes the process** (group AUTH; rows F-HUM-12)

- Question: D8 says a flaw in the process must be fixed, by Claude and without the owner as gate, and D9 says the process must not pile on tests, reviews, gates and checks, while in Process3 38% of check-adding merges answered the process's own earlier machinery: does "every problem is an architecture bug ... a workaround for the moment is not a fix" stand as written?
- Option A: it stands in full, so every failure gets a correction that is built. Option B: D9 limits it, so a correction may not add a test, review, gate or check, and some failures are left with a workaround or one line in a report.
- Related rows, kept or with the mechanism open: F-HUM-1, F-HUM-9, P3, P17, MNT-1, MNT-5, MNT-6, TXT-1. He repeated the direction on 7 Nov ("so that the set of problem types tend toward zero", causal_forensics §4.2, as quoted by audit C).

**3. Checks and reviews outside the three tests** (group CHK; rows PLT-9, ARC-2, F-PROP-3, JOB-12, GAT-4, GAT-8, INT-2, INT-7)

- Question: Does "exactly three tests and no others, ever" (D6), with D9, end the kept checks and reviews that are not one of the three (the revert check, the second gate run on the merged result, the ownership check, the artifact check, the grant check at tranche open, and review by a fresh reviewer), or are those something other than a "test" in his sense?
- Option A: they end; only the three tests remain. Option B: they are not tests in his sense and stay, each to be confirmed singly.
- Section 5 lists each with both readings, together with the other checks, audits, measurements and alarms that carry a different disposition.

