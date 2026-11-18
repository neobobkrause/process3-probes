# [file] interface_changes_log_pr96.txt (continued)

73 | OpenManyOpened.estimate (ai-use's answer relayed) | the inner `estimate` is ai-use's own figures (an object) where the test before showed a word; the comment says `as it came`, no edit needed | HANDS BACK | BREAKING kind changed (ai-use's field, relayed) | (d) t41.test.mjs

--- not interface changes, recorded for the reader's complaints ---
N1 | ExitNotFound | `@property {never} [status]` added so `aiStop` and `aiWithout` may read `status` off the one exit's answer; the form itself is unchanged (it never carried `status`) | annotation only | (a) index.mjs(5497,78) (5507,78)
N2 | private helpers #dispatchMember, #memberChoice, #afterStop, #redispatch, #hopAnswered (and its inner `lvl`), #flagOnly | given a kind in a comment, the file's own device ("typed so the public answers built from it can be checked") | annotation only | needed so the new public answers check
N3 | stale notes removed | "not yet met" notes on R9 (OpenArgs, DECLARED_OPS), R19 (RunSession), R28 (RunFacts), R72 (UsageEntry), R78 (partAdmitted), R99 (RunLogEntry), R100 (RunLogRow): the requirements diff unmarks these and the code meets them | (c) confirms what (a)/(b) found
N4 | kept as it was | testBarRecord's note that R75 moves the act to ai-gate: R75 is still marked not yet met
N5 | not touched | R106 (`idem` on tick, close, spawnPayload) is still marked not yet met; the comments before the change did not speak of it and the code does not read `idem`
N6 | narrative (not interface) comments | two inline parameter comments of `tick` and one sentence added to the narrative above `dispatchMemberRun` were corrected because they state a public method's handed shape or refusal order; other narrative comments on private methods (#aiRunDispatch's body, #dispatchAccount, #aiAccounts, #segmentEnd) still describe the path before T53 and were left

--- tally ---
73 changes recorded. By how found: (a) reader complained 16; (b) code diff only 52; (c) requirements diff only 2; (d) tests diff only 3.
Could break an existing user: 22 = (a) 5, (b) 14, (d) 3. Only add or widen: 51 = (a) 11, (b) 38, (c) 2.
The reader's 45 complaints before: 27 new with the change (25 map onto the 16 (a) lines above, 2 are N1) and 18 that stand against the pre-change source too.

--- at the end ---
Reader run again (work/reader-after-ai-runs.txt): 18 complaints remain on index.mjs, 0 on schema.mjs. They are the same 18, message for message and column for column, that the reader lists against the source as it stood before the change (work/reader-baseline-before-change.txt): 6 in workProducts (a lens block read off `{}`), 1 in open (`origin` a text where OpenStarted names two words), 2 in openMany and 1 in listInContext (a text where RunContextType or RunMode is named), 4 in wake (`dispatch` added to a wake after it is built), 2 in verificationRecord and 2 in testBarRecord (run-rules' refusal `ok: boolean`, `mode`/`part` a text). Each is the code being looser than a kind that is right about what it answers; none says a comment is untrue of the change, and silencing one would take either a change to running code or a loosened kind.
Only comments changed: both files, pristine copy and edited, were written out by `tsc --allowJs --removeComments --noResolve` and the two outputs compared byte for byte: identical (index.mjs 2,626 lines, schema.mjs 191 lines; work/verify.sh, work/nc/). A second check: of the 845 changed lines every one begins a comment line (`/**`, `*`, `/*`) but one, the continuation line of an inline block comment in `tick`'s parameter list.
Interface written out to writeout-after-change/ (ai-runs/index.d.mts 4,047 lines, ai-runs/schema.d.mts 38 lines).


# [file] register_notes.md (later part)

- **L section 5 and 6** (tables): evidence for L2 and for every line-by-line class; no separate argument.
- **Fnd "What I could not check"**, **L "Limits"**: not counter-arguments.
- No finding was left unplaced.

## 4. Places where the memo's answer does not meet the counter-argument

Each of these is also marked "Not answered" in the register entry.

1. **Entry 1 (C1).** The memo defines a clean round and says rounds are unbounded. It does not take the reviewer's one-off measurement (walk one unchanged build three times), without which nobody knows whether a clean round is reachable under the new, stricter definition. Under that definition no Process3 round was clean, so the stricter definition makes the "never ends" horn worse, not better. Tranche size is not addressed.
2. **Entry 3 (F16c).** Memo silent for Bob's own approvals commit and ARCH's module-list edits; severity as the reviewer states it is a first-hour stop.
3. **Entry 4 (C2).** The reviewer said the two decisions (three tests; a tranche ends on a clean deployed walk) conflict and "only he can pick". The memo declares the conflict and picks the later record. It is not put to Bob as a question.
4. **Entry 13 (C4).** The memo still recommends an untested mechanism while saying the rate of blocking faults is unknown, which is the reviewer's objection to the old wall. The reviewer's rehearsal before Bob answers is not taken; the reviewer's third option (protect only what can stop a merge) is not put. The fixed-version form still makes the product wait for Bob at every mid-tranche blocking fault, which is the "waits for a man who is asleep" argument restated as a cost. Also: the memo's phrase "one question waited nine hours for you" rests on a case that the corruption report (appendix A row 24) describes as "a question that was not his"; the register words it as "a question that sessions carried as yours".
5. **Entry 14 and 32 (F12, F6).** Internal tension in the memo: §4 says do not decide "modules with requirements and no code", list it as a product question for Bob; §7 has ARCH fold requirement-only modules back and correct the definition of "module". The second acts on the first.
6. **Entry 20 (Fnd5, C11a).** Both reviewers said ending the judge is Bob's ("a purpose, not a way"; "put it back in section K as his question"). The memo rewords it as a consequence of the recorded decisions and does not ask him.
7. **Entry 26 (F2).** The memo's answer is "build decision, proven in J2". The reviewer's point was that no mechanism exists; none is named. Twice out of twice it failed in Process3, and at the first start there is no other session to repair it.
8. **Entry 28 (C10).** The stop is kept. The answer is a stated cost (every approvals edit stops every long-lived session; Bob restarts ROOT) plus a trial. In Process3 the product never restarted after the last edit; nothing in the memo shows a restart of ROOT is enough.
9. **Entry 31 (F7, C6).** The removed sentence ("a failure already on the tranche branch ... is named") has a source in the Foundations according to the ledger audit (its list of things "not counted as additions, because a source exists"). The memo removes it without saying that it departs from a Foundations line.
10. **Entry 37 (L1) and 43 (Fnd15).** The memo ends "the guard on the approvals block inside the old record check". permissions_inventory (quoted in L1) says that without the record check nothing in git stops a session's pull request changing the approvals or the deny list. Fnd15 asked the draft to say where "permission management is preserved" and "three tests" pull against each other; the memo does not. Five of Fnd15's seven duties are not named at all (refusal counts and trial at tranche open; component removal at model release; sweep catching lack of progress; every new session checked to have started; GitHub's published limits, which rest on Bob's quoted words of 6 and 9 Nov). Under §2's rule they end by silence, which is what the finding objected to.
11. **Entry 38 (C7).** The reviewer said two things were Bob's: whether "Kept" meant the check, and whether test one may run another module's tests ("is his to allow"). The memo decides both as Claude's and only notes the record. The second half of the argument (the other module's owner is never told; two writers on one file) is not met.
12. **Entry 40 (C8).** Answer covers the one cap. For the 36 rules held by words the memo is silent; the reviewer's "delete what cannot be held" is not taken.
13. **Entry 48 (Fnd10, L13).** The second draft said the lane clause was "yours to keep or drop". The memo has Claude decide it stays. Both reviewers asked for it to be put to Bob with reasons and a recommendation.
14. **Entry 63 (L17).** Bob's line says each decision in its own file, never a long file. The memo says "the product's decision file" (one file), the form the audit's evidence shows growing to 49 KB in four days.
15. **Entry 65 (L18).** The memo says "the combined trial run is that slice". Nothing says the combined run is made on a representative slice of the real product; the reason the toy line was dropped is that toy flaws and product flaws were disjoint.
16. **Entry 68 (C12a, F11).** The memo's condition was met (the sentence is in the 13 Nov record, assessment_doc.txt line 94), so the sentence is kept and attributed. How a change that skips the required test would merge, and whether the checker passes it, is left open; the corruption reviewer's point (a way round the only gate, on a session's judgment) stands.
17. **Entry 69 (L20).** The memo's sentence does not say that the definition governs; a session could still cite the unchanged Ledger.
18. **Entry 70 (L2).** The auditor asked for "a session's record has you deciding" everywhere until Bob writes it himself. The memo keeps "you decided" for list items, resting on Bob's phrase "my decisions of 13-14 Nov".
19. **Entry 72 (F trial J4).** The memo says J4 "can break but not prove". The reviewer said it cannot fail at all on the question of who is told. The replay's own report agrees with the reviewer ("'241 of 241' cannot fail on this record"). Only the trigger half could break, and two narrower wordings did.
20. **Entry 78 (C11f).** Memo silent. The reviewer's "fewer items" cannot be met: the memo adds Claude-decided items. The memo's authority is Bob's typed "Decide technical matters yourself and tell me what you decided", which the register quotes.
21. **Entries 8, 9, 10, 11, 12, 52, 86** are memo-silent with no usable correction from the reviewer (or, for 8, a remedy the opening rule does not let through).
22. **Entry 7 against the replay.** The memo's estimate of needless jobs assumed Process3's rule; the replay adds that under "any of the four parts" 71% of job merges count as interface changes, and that Process3 did not tell every declared user (167 pairs). The memo's trigger ("source or requirements file") is close to the replay's wording F, which reaches 241; the definition's old wording ("interface changed") reaches 236. The memo was written before the replay finished.

## 5. Figures corrected against the replay, as instructed

- "65 of 178 notices could name no part": appears only in entry 21, where it is given as the reviewer's quoted figure with the re-derived 17 beside it.
- "38 undeclared pairs" and "202 imports": entries 36 and 73 give the reviewer's figure with the replay's (198 statements, 122 pairs in all, 36 to a later module). Entry 31 no longer quotes them.
- "52 code files belong to no module" (entry 32): the replay counts 49; both are given.
- The feasibility report's statement that Process3 "notified every declared user" (its J4 note) is contradicted by the replay (167 pairs not told). The register does not repeat it.

## 6. Other things noticed

- The memo's instruction on the 8 and 9 Nov rulings was conditional ("if audit_foundations.md finding 3 quotes them"). It does quote both, so entry 16 records them as restored.
- The memo says of the second health number "stays as a reported number where cost can be read" and of the rule "the first half of that now cannot be met as written". The register reads "first half" as the first of the two numbers.
