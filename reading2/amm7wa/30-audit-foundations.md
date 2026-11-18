### 15. Seven standing duties in Bob's documents are neither kept nor ended in the main text

**Counter-argument.** Each of these is a count, a trial or a check that is not one of the three tests. Bob's rule of three tests may end some of them, and his decision to preserve permission management may keep others. The text does not say which.

**Sources and what is missing.**
- Foundations: every refusal of an approved act is "counted per tranche, tried with a handful of approved acts at the depths they run at, at each tranche's open before any job starts, and re-tested at each model release".
- Foundations: "At each model release and each Claude Code version change ... components are removed one at a time and the result observed".
- Foundations: "a check fails any change to the approvals block not made by you through GitHub's website"; main and the tranche take changes "with the gate (or ci) and record required". The text says only "with the tests passing".
- Foundations: "The sweep catches lack of progress, not only silence". The text has the alarm only for "a session that has stopped".
- Foundations: "every new session is checked to have started".
- Foundations: "Every requirement is tested at the module's interface and proven met; none goes untested (P7)."
- Bob, 6 Nov: hold to "80% or 90% of github's published limits"; 9 Nov: "don't do it beyond just making sure that we don't exceed published limits." GitHub suspended the sessions' account on 6 Nov. The text mentions the suspension and no limit.

**Kind.** (d).

**How bad.** Misleads Bob: the builder of Process4 will keep or drop each by its own judgment.

**Proposed correction.** One paragraph in section H or F: "Your documents also ask for seven things this document has not placed", then the list, each marked "kept as Process3 ran it", or "ended, because it is a check outside the three tests", with the decider named. Where preserving permission management and "three tests and no others" pull in opposite directions (the trial at each tranche's open, the check on your approvals), say that they do.

### 16. The mechanical pass has lost its two conditions

**Sentence attacked.** Section C: "A change that touches many modules in the same trivial way, needing no judgment, can be made in one pass."

**Source.** Foundations: "one mechanical pass by a worker in BOB's session while no job runs ...; a module where it needs judgment gets its own job in the same tranche (P7)." Record of 13 Nov: "The cross-module mechanical pass is preserved."

**Kind.** (d). With eight jobs open, a pass across many modules writes files that open jobs are also writing.

**Proposed correction.** "... can be made in one pass, by a helper in ARCH's session, while no job is open. A module where the change needs judgment gets its own job." Or declare the two conditions ended, with the decider.

### 17. The trial in section J, item 9, is a comparison at every round's end, which is a recurring check

**Sentence attacked.** "*Trial:* at each round's end in the first tranche, compare the process's files with round 1. Any difference other than a recorded corrective fix breaks the claim."

**Source.** Bob, 14 Nov: "Do not add tests, gates, reviews or checks."

**Kind.** (f).

**Proposed correction.** "*Trial:* once, when the first tranche ends, read from git how often the fixed version moved and what each move changed."

### 18. Ending "nothing is ever refused for size" for the process's own texts may add refusals

**Sentence attacked.** Section I, item 9: "*Claude decided:* end it for the process's own texts only."

**Source.** Foundations: "Text is kept short by splitting and consolidating ... Nothing is ever refused for size." Bob, 14 Nov: no added checks.

**Kind.** (g) unclear; possible (f).

**Proposed correction.** Add: "The only limits that refuse are the two Process3 already had: the size of each role's starting text, and ten rules per role. No new limit is added."

### 19. Four smaller conflicts with Bob's own notes or words, settled without mention

- **Models and effort (technical point 12).** "ROOT passes your suggestion to every session it starts." Bob's own note of 31 Oct: "Models, effort, and permissions mode come from one table, picked by the start command; always a model and effort sufficient for quality". Jobs are started by ARCH, so the sentence does not reach them. *Correction:* say the table is ended and by whom, or keep it; say what happens when no model is suggested and how the suggestion reaches jobs.
- **How many walk (technical point 13).** "*Decided:* by journey" answers how the walk is shared, not how many. Bob, 8 Nov: "run as many walks as is reasonable ... (But be careful that there aren't too many external walkers to cause the Cloudflare system to exceed limits of the account." *Correction:* add his caution; say the number is not yet set.
- **When a process fix reaches a running tranche (technical point 3, section E).** "A fault that blocks nothing waits for the next tranche." Bob, 9 Nov: "Pin moves should be lightweight fixes that improve velocity, not ruin it. So they should happen as needed, but also ganged up when possible". *Correction:* say that the Foundations' rule is followed over his words of 9 Nov, and why.
- **The line-by-line test (section I, item 8).** Ended by Claude. The ledger note Bob edited on 14 Nov still reads "each line passing the per-line test". *Correction:* say so in item 8.

### 20. Numbers: 24 checked, 8 faulty

Right, and supported by a named source: 2,342 / 241 / 2,101 and 90% (assessment document); 65 of 178; 20 of 175 and 147 of 157 and 70 of 357 (`k_evidence.md`, read from the stored reports); 218 of 220 (`product_side.md`); 28 of 279 (`permissions_inventory.md`); 1,187 runs; 105 of 508; 41% before and after (71 of 175, 50 of 121); 8 KB to 134 KB (7,955 to 134,219 bytes, `verify_numbers.md`); 116 moves; 70% of commits (12,881 of 18,389); 194 minutes; 45 minutes; 11 of 11; about 450; about 700.

Faulty:

| Text | What the evidence says | Correction |
| --- | --- | --- |
| K: "sessions made 270 of the 296 changes ..., and 121 of those added a check" | `change_sample.md`: "121 of the 296 merges". 270 is merges made by the sessions' accounts (`enforcement_levers.md`); 14 of the other 26 are Bob's own edits to his approvals and settings | "121 of the 296 added a check" |
| K1: "the check's three known firings were all false alarms" | `k_evidence.md`: "How often it fired: not found." Three false-alarm episodes are known; one alone was 455 findings | "How often it fired is not recorded. The three episodes that are recorded were all false alarms" |
| I5: "Its first run gave 947 findings, and seven later changes repaired false alarms" | `change_sample.md`, PR 1: the 947 findings and the seven repairs belong to the whole record check (file size, temporary folders, the approvals block, the job-record format), not to the size check alone | Say "the check it was part of" |
| D: "38 such pairs exist in tests today" | `interface_and_cycle.md`: 38 pairs are tests importing a later module. Also undeclared: 24 pairs that read another module's tables, and 158 of 349 pairs that read another module's files | "at least 38" and name the other two kinds |
| J7: "The hourly alarm wakes ROOT itself. Measured ..., eight times out of eight" | `permissions_inventory.md`: 5 of 5 on 1 Nov into an idle session; 3 of 3 on 2 Nov were the daily alarm of the standby | "five times out of five, and three of three for the standby's daily alarm" |
| D: "241 were truly affected" | Judged by AI workers on today's code; the assessment calls the figures "indicative" | "judged affected" |
| G: "198 ... ten more ..., so 208 stand. Another 45"; H: "Fifteen"; I: "seventeen" | These sum to 285 of 288 | Say where the other three lines went (they appear to be the three settled in section K: writing only one's own files, the set-up page, replacing ROOT) |
| K: "Process3's rate, 296 changes in nine days, was mostly the growth itself" | No source measures "mostly"; `verify_numbers.md` labels 47% of a sample as fixes to earlier process code | Mark as Claude's judgment |

Also: I3, "overridden 32 times out of 32", comes from the earlier review (`review.txt`) and was not re-measured; `product_side.md` says "The review lists this". Numbers that are choices, not measurements, are not marked as such: "twenty or more merges", "ten Process3 faults". A: "Process4 keeps almost all of your requirements" against the text's own 208 of 288 kept as written.

### 21. Plain words

- **Undefined terms.** "status read-out" (four uses; Bob's documents call it "status"); "standby session" (his documents call it "the watcher"); "its real level" (J1); "probe" (J3); "turn one registration between two modules around" (K); "force-pushing" (F); "pull request" and "draft pull request" (used in the definitions in A without one of their own).
- **References to things Bob has not seen.** "that earlier reviewers could not break" (K); "Later platform notes suggest" (J7); "Three facts were corrected" (opening; the three are not named); "the audit kept 198" (G; which audit is not said).
- **Counts that do not read straight.** "Your seven earlier open points" heads a list numbered 1 to 8. "Six were technical and Claude decided them", while five items say "Claude decided", two say "It stays" and one says "Not a decision".
- **Other assurances or facts stated more firmly than the evidence.** B: "the platform gives no session a way to do either act, so it is a fact and not a choice"; `k_evidence.md` says of the cloud environment "in part", observed only in tool descriptions and never tried. *Correction:* "no way that has been measured". C, step 3: "gives the same answer every time", which J6 lists as unproven; say "is meant to".
- **Hard to read.** C: "the internal walk had every one of its 238 steps passing (with 63 failures of a kind already known)". A reader cannot tell how every step passed with 63 failures. Say what the 63 were.

### 22. The list of Bob's acts against his sentence of 13 Nov

**Sentence attacked.** Section B: "Your acts: ... There are no others, unless you choose the wall in section K. The set-up row is new on this list".

**Source.** Bob, 13 Nov, quoted in audit D: "The only actions he will very occasionally take are changes to GitHub or Cloudflare settings related to permissions or rules."

**Kind.** (e), minor and mostly declared. One of six rows is a settings change. Four others rest on a session's record of his answers of 13 Nov; the set-up row rests on the platform and on his Foundations ("the developer recreates the cloud environment and Claude's GitHub connection from a page the process writes"). "Three times in nine days" is not "very occasionally". Finding 3 adds a seventh act (connecting an AI account).

**Proposed correction.** Add under the table: "Only the first row is a settings change of the kind your sentence of 13 Nov allows. Rows two, four, five and six rest on your answers of 13 Nov as a session recorded them. Row three is forced by the platform and is in your Foundations."

---

## Smaller silent drops, for completeness

Each is a kept line that the main text never states, where the silence could matter to a builder. No correction beyond one clause in section G is proposed for any of them.

- Foundations: "while a tranche runs it prepares the next round or tranche ... so the next opens the moment this one closes". The text does not say how a tranche opens or who writes its work.
- Foundations: the product's CLAUDE.md is "under thirty lines, written by BOB line by line", each change "listed in the tranche report". The text speaks only of the approvals block.
- Foundations: "two ROOTs never both start a BOB" (the address in git decides). It matters once a standby can take over.
- Record of 13 Nov: lists "tests asserting on text keys as a separate check" among the lines the three-tests decision ends. Section H does not list it.
- Foundations, certification: "a shadow run of one representative slice of the product, then the live first tranche". Section J's trials stand in for it without saying so.

