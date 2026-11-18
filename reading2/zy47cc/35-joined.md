# [file] draft-approvals-biosmoke-8nov.md

# Draft: CLAUDE.md approvals amendment for biosmoke (for Bob to commit), 8 Nov

Bob in session, 8 Nov: "The biosmoke8 install (indeed, any biosmokeN release) is for development testing purposes only. The deployment and any data captured or generated during testing with by deleting when testing is completed."
Answer the same day: releases are walked on biosmokeN; Bob amends CLAUDE.md.

The same approvals block is in three repositories (process3, civicsmith-copy, process3-probes). Make both edits in each.

## Edit 1: the protected list

Replace:
> except those this paragraph forbids changing below (today the Workers biosmoke8, plat-s1, agent-runner, agent-runner-plat-s1, agent-worker, agent-worker-plat-s1, file-scanner, ocr-worker, pdf-worker, pdf-worker-plat-s1 and sheet-worker, the R2 buckets bio-captures, bio-published, bio-captures-plat-s1, bio-published-plat-s1 and bio-walks, and the Durable Objects and container applications those Workers define)

with:
> except those this paragraph forbids changing below (today the Workers plat-s1, agent-runner-plat-s1, agent-worker-plat-s1 and pdf-worker-plat-s1, the R2 buckets bio-captures-plat-s1, bio-published-plat-s1 and bio-walks, and the Durable Objects and container applications those Workers define). Any Worker named biosmoke followed by a number is a development deployment, for testing releases only, together with the Workers it binds (today agent-runner, agent-worker, file-scanner, ocr-worker, pdf-worker and sheet-worker) and the R2 buckets bio-captures and bio-published; sessions may install and upgrade a release in it, walk it, and delete it and all data captured or generated in testing once testing is complete

Checked 8 Nov: plat-s1 binds only its own -plat-s1 Workers and buckets, and agent-worker's PLANE binding is biosmoke8. So the generic fleet serves biosmoke alone. bio-walks stays protected; say if it should move.

## Edit 2: deleting a test deployment that holds secrets

Replace:
> never deleting a secret that neither the session nor a p3dev- install it ran set, or a resource that holds one

with:
> never deleting a secret that neither the session nor a p3dev- install a process session ran set, or a resource that holds one, except that a development deployment named p3dev- or biosmoke followed by a number may be deleted whole, its secrets with it, once its testing is complete

Why: round 1's stacks p3dev-l1, p3dev-l3 and p3dev-t1 each hold an ADMIN_TOKEN that an earlier session's walk setup generated. Read literally, the current text forbids any later session from deleting them, and the rest of each stack is bound to those Workers. biosmoke8 holds secrets set by the installer (ACCOUNT_SEAL_SECRET, ADMIN_TOKEN, DAEMON_TOKEN, PROBE_TOKEN, CIVICSMITH_TEST_INSTANCE).

Unchanged: newgroup, civicsmith-site, DNS, domains and routes, the account's settings, the no-reveal rule, never reading or printing a secret's value, and plat-s1's set.

After you commit it: the coordinator deletes p3dev-l1, p3dev-l3 and p3dev-t1, and a builder wires `deploy release` to install each cut release into biosmokeN and walk it.


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
- Nothing in the register is written as a decision of Bob's. Where the memo says "your decisions", the register says "the record has you ..." or "decisions recorded as yours".


# [file] bob_words_17nov_codex_context.md

# Owner direction: Codex Process4 context fidelity (17 November 2026)

**Status:** Verbatim owner direction from conversation, not an adopted rewrite of the sixth draft. This material is authoritative as the owner's words for the Codex context-fidelity investigation. It does not modify the existing Claude Code implementation, grants or Process4 adoption status.
