### 5.2 Claude laziness: stopping short of work it could do

| | |
| --- | --- |
| Items | The proposal answers a different question. "Lazy: not in effort ... The laziness is in diagnosis." Working agreement 3 and 7; R15 ("'Never idle' is no longer a fault of the session"); C2 (hourly wake); C6 (stuck work is ARCH's hourly work); G8 (watchdog); N1 (status prints what is ready); C9 (jobs at medium effort) |
| Physical | The hourly task and the 30-minute watchdog are platform schedules. Both detect; neither makes a session continue |
| Text only | Working agreement 7: "Push before you stop. When you are done or blocked, say so and stop; stopping with nothing to do is correct." |
| Left unaddressed | A job that ends its turn with work unpushed is "invisible to status" (R14, graded Weakened). A job that stops mid-work waits for "open too long" plus up to an hour. ARCH starting some ready jobs and ending its turn has no check until the next hour. GAP-5's event wake, P18's preparing of the next round, and P19's "BOB never idles while work remains" are dropped. Nothing separates "nothing to do" from "stopped short" except the next hourly read of status. In the small start there is no wake at all. N7 deletes the idle alarm with no replacement |

### 5.3 Handoff scanning

| | |
| --- | --- |
| Items | "What is fundamentally different" 2 ("There are no handoff notes, no long-lived coordinator and no carried memory"); C1; C3 (fresh session per wake); C8 (auto memory off); M1 (4,096-byte caps); M2 (one charter page); G7 (state from branches and pull requests); N1; N7 |
| Physical | Deleting the roles that wrote handoffs. Byte caps "held by a required test" in the process repository |
| Text only | "Each ARCH wake starts from the pinned text and the repository's state" |
| Left unaddressed | The preferred form rests on a platform behaviour Process3 measured failing, 0 of 3. In the fallback, ARCH is one resumed session whose context grows until the owner replaces it. Two new places a fresh ARCH must read have no cap and never shrink: the questions issue (M5: "the answer is on the page") and the process log (N3). START bodies can grow ("Visible, not walled"). The byte cap is a required check in the process repository, but the product's `CLAUDE.md` lives in the product repository, whose gate runs "Nothing else"; that file is 8,664 bytes of owner approvals today, the cap is 4,096, and run 0 asks him to add to it. The cost of a fresh ARCH re-reading everything each hour was never measured (SES-16: "No comparison arm") |

### 5.4 Every utterance becoming a rule until the rules overflow

| | |
| --- | --- |
| Items | M4 ("Your word is what your GitHub account wrote"; a chat remark "lapses at the end of the run"); working agreement 6 ("A question from Bob is a question"); G1, G2 (sessions cannot write the process); M1, M2; N4 (at most three changes, net zero); the rename to ARCH; "What is fundamentally different" 4 |
| Physical | Sessions cannot merge into the process (collaborator setting). Byte caps. GitHub authorship as the record of who said what |
| Text only | Working agreement 6. "Sessions quote it with a link and never paraphrase it as yours" |
| Left unaddressed | M4 makes the owner write on GitHub for any word to last, which requirement 1 excludes. The questions issue is a rulebook by another name: every answer stands for ever, nothing expires, nothing caps it, and ARCH must read all of it not to ask twice. Rule text can still grow where sessions write freely: the round plan and module map (P4: "not guarded"), requirement files ("not walled"), START bodies, and the product's existing `build/rulings.md`, `build/rulings-active.md` and `DECISIONS.md`, which P1 does not clear. The cap bounds size and does not say who removes; removal is the owner's choice at a retrospective. The admission table's correction, "Claude may change the process only inside fixed limits ... To add, it must remove", is by the proposal's own word "unproven" and rests on "one case" |

### 5.5 Over-caution piling up tests, reviews, gates and checks

| | |
| --- | --- |
| Items | G1, G2 (sessions cannot add checks to the process); G4 (gate is tests, the revert check and three narrow checks); G5 (50 runner-minutes per landing); six conditions 2 and 5; M1; N1 (status "cannot refuse", 500 lines); N2; N4; N5 ("Whatever misfired is removed by default"); N7; C9; C10 (review on a trigger, five findings); working agreement 5; the signs table |
| Physical | The collaborator wall. The code-owner ruleset, if test 2 passes. Line and byte budgets held by required tests in the process repository |
| A number only | G5 is "Number on the daily report" and stops nothing. Test lines against source lines is a line on the report |
| Text only | Working agreement 5. C10's "at most five findings". C9's effort levels |
| Left unaddressed | The outlet the proposal itself names first: checks moving into the product's own tests (Process3: 43,882 test lines against 23,090 source, 11,410 of them serving the process). Nothing bounds it; the owner is to notice a ratio. The revert check stays, although 61 block texts named it and it once removed real test repairs. "Sessions will still hesitate, over-ask and over-test inside their own work" (Known limits). N5 removes a misfiring check only at the retrospective; during a run it keeps blocking until the owner merges. The proposal adds gates of its own around the run: seven tests, a replay, code-owner review, a regression and walk required at close, nine daily numbers, six signs, a retrospective. The pile moves from the tool to the run's edges and to the owner. The retrospective is still a channel that brings up to three changes every run |

## 6. Summary

### (i) Clause by requirement, Process3 and Process4

| Clause | Required | Process3 actual | Process4 proposal |
| --- | --- | --- | --- |
| 1a | Owner enters no commands | Started sessions; switched tasks off by hand | **CONTRADICTED.** Creates the hourly task, starts ARCH, commissions sessions, enters a setup script |
| 1b | Owner edits no source files | 16 + 14 approvals edits; one settings-file edit | **CONTRADICTED.** Rewrites approvals in `CLAUDE.md`; "your own edits"; budget numbers |
| 1c | Only GitHub or Cloudflare permission and rule settings | Mostly words: 159 Ledger decisions, 36 or more questions | **CONTRADICTED.** 8 of 36 acts allowed; 3 borderline; 25 not |
| 1d | Very occasionally | Every one of nine days | **CONTRADICTED.** Daily report; an hour per run; per layer close in the fallback; twice a day in the small start |
| 2a | Runs unattended | Ran round the clock; ended by an approvals edit | **CONTRADICTED** in the recommended start and the fallback; the preferred form rests on a behaviour measured failing 0 of 3 |
| 2b | No block while work is possible | 9.3 hours silent; 348-minute median merge wait on 5 Nov | **PARTLY.** Workaround-and-carry-on for a job; up to an hour idle at every step; "never idle" dropped |
| 2c | Waits for the owner only when completely blocked | About nine hours and seven hours waiting on him needlessly | **CONTRADICTED.** 12 of 22 waits are for the owner while work is possible; 16 end only when he acts |
| 3a | One total order | 220 modules in one list | **PARTLY.** Restated; nothing holds it; the map is unguarded |
| 3b | Services used only by later modules | 3 of 3,120 uses point later; one cycle; all new in Process3 | **PARTLY.** The kept check compares imports with the map, not positions |
| 3c | One job per module | One at a time enforced; 3.0 landings per job | **PARTLY.** "One module or item"; exclusivity and the ownership check are gone |
| 3d | That job updates and tests | Yes; 26% of new test lines served the process | **MET**, weakened (R11) |
| 3e | Earlier modules' jobs before later | By layer only; 46 deferrals; layer 3 closed before 2 | **CONTRADICTED.** P3: "A layer's jobs start together"; 182 of 220 modules run beside something they use |
| 3f | Interface change notifies all users | 178 notices, 2,707 notifications, 15.2 each | **CONTRADICTED.** N7: "Deleted with no replacement" |
| 3g | Users' jobs updated as necessary | 90% "not affected"; 241 affected; 441 answered | **NOT ADDRESSED** |
| 3h | Users' jobs tested | Users' suites in the provider gate: +7.6 minutes, 0 of 20 catches, reverted | **PARTLY.** A scheduled whole-product regression, not tied to the change |
| 4a | Plan designed around parallel jobs | 84 jobs landed in a day; 24 landings in an hour | **MET**, by breaking 3e |
| 4b | Concurrent jobs bounded by a number | 24, then 6, then 4, then 20; set by sessions | **PARTLY.** "24" live sessions, as a sentence; nothing enforces it |
| 4c | The owner changes the number | Never by him; once a session's number was recorded as his | **CONTRADICTED.** Fixed in pinned text; changed by a merge |

Totals: MET 2 (3d, 4a). PARTLY 6 (2b, 3a, 3b, 3c, 3h, 4b). NOT ADDRESSED 1 (3g). CONTRADICTED 9 (1a, 1b, 1c, 1d, 2a, 2c, 3e, 3f, 4c).

### (ii) Proposal items that must change, most serious first

Each line says what would have to be true. No mechanism is proposed.

1. **G1, N2, N4, six conditions 1, "What is fundamentally different" 1, Known limits ("Your merge is the last wall"), "What reaches you".** No change to the process, at setup, during a run or between runs, needs the owner to merge, review, commission or read anything; whatever keeps the process from growing holds without him.
2. **N7 (notices), "Ledger lines that end" (GAT-3), G6.** When a merged job changes a module's interface, every module that declares a use of it has its job opened or updated and is tested against the change, and the cost per change stays small.
3. **P3, and R17's grade of "Met".** No module's job runs ahead of the jobs of the earlier modules it uses, and the plan states the parallel width that leaves.
4. **"Start smaller than this" (item 4 and its closing paragraph) and C3's fallback.** The form the process runs in from its first run needs no person between start and completion, overnight included, and no form needs the owner at a layer close.
5. **C2, C3, C4, C6, G8.** When ARCH or a job stops short, pauses on refusals or dies, the process recovers by itself; ready work does not wait a built-in hour; and starting or replacing ARCH is not an owner act, or is named as the one act the platform forces.
6. **G2, F2, C7, C10.** Nothing in the product's routine flow (the pin, walker steps, settings, workflows) waits for the owner's review.
7. **G3, run 0 step 5, C11.** Sessions' needed acts are authorised without the owner editing a file, or the approvals edit is declared the single platform-forced exception, made once and not at every change.
8. **C12.** The bound counts concurrent jobs, starts at the owner's number, is changed by him with a setting, takes effect in a running process without a merge, is not changeable by a session, and is enforced by something other than ARCH reading a sentence.
9. **M4, M5.** A question never stops work that can proceed, and the owner's word does not have to be written by him on GitHub to count, or that channel is explicitly exempted from requirement 1.
10. **N2, N4, N5, M6.** Product work does not stop at the end of a run to wait for a retrospective he commissions.
11. **Run 0 steps 1 to 5, the seven tests, C7, C8, G9, G10, G12, N8.** Every setup act of the owner is a GitHub or Cloudflare setting, or is listed as an exception with the measured platform fact that forces it.
12. **G8, the daily report, "Signs that it is going wrong".** Failure is found and answered without the owner reading a report or an email.
13. **C4, G4.** At most one job exists per module at a time and a job changes only its own module, held by more than a sentence.
14. **G4, P4.** A declared use of a module at the same or a later position is rejected; the three in the map today are repaired.
15. **M1, M2, M5, N3.** Everything ARCH must read at a wake is bounded, the two issues included, and the cap on the product's `CLAUDE.md` is one the file can meet.
16. **Run 1 and its five measures.** The first run's stated test exercises the four requirements: owner acts that are not settings counted against zero, an unattended span that includes a night, an interface change reaching its users, and the bound changed while the run is live.
