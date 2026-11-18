Sources: product_side §1, §2, §5, §6; k_evidence K1(i), K4; change_sample §4; review.txt as quoted.

### 7. Ending the own-files check opens the one path where a change merges with no test at all, and Bob's recorded answer was "Kept"

**Counter-argument.** If a job edits another module's file, test one runs only the job's own module's tests, so the edit merges untested and the other module is never told. Process3's clean record of none in 2,540 commits was made with the check standing in four places, and Process4 gives jobs a new reason to do it.

**Sentences attacked.**
- "The rule that a job writes only its own module's files has no check behind it; it stands in the job's instructions." (D)
- "*Claude decided:* it ends; the rule stays in the job's instructions." (K, earlier point 1)
- "It does not wait for the modules it uses to finish." (C step 2)

**Evidence.**
- [measured] 0 of 2,540 job commits changed another module's source or tests, while the check ran in the test run, at the merge, at publish and at take-in, and the rule was in every start text. "The measured record cannot tell whether jobs kept to their module because of the check or because their instructions said so" (k_evidence K1(i)(b)).
- [measured] 34 job blocks say the fix they needed lay outside their own files and handed it on (same passage). The pull was there; something held it.
- [measured] The session's record of Bob's answers of 13 Nov reads: "Question 2, in part: a job writes only its own module's files. Kept." The question had asked whether "no other tests, ever" ends that rule (assessment_doc lines 83, 89). The ledger line it names is listed as held by "gate and merge | Built". Whether he kept the rule or the check is not settled by that record, and the definition files the ending under "Claude decided".
- [platform, via k_evidence K1(i)(d)] No GitHub setting can restrict which files a push changes on a public repository.
- [reasoning] In Process4 a job runs while the modules it uses still have jobs open, so it meets half-finished code under it more often than a Process3 job did. The one-line fix in the other module is the quick way, and nothing refuses it. Two jobs then write one file, which is the case the rule exists for.

**How bad.** Silently corrupts the result.

**Answer within the rule.**
- Put the question to Bob in his own words: did "Kept" mean the check? It is his, not Claude's.
- Structural, if he says the check goes: let test one choose the suites from the files the pull request changed, not from the job's module. A stray edit then at least runs the tests of the module it touched. This changes "never another module's" and is his to allow.
- Otherwise **no answer found**; state it in section J as accepted and unproven. It is not listed there.

Sources: k_evidence K1(i); assessment_doc lines 83, 89; ledger_map ARC-2; disposition row 28.

### 8. About thirty-five rules in the definition are held by text alone; the one cap that held in Process3 was a test, and the definition does not say whether it survives

**Counter-argument.** Process3 measured this: the rule with a hard stop behind it held for the whole week and every rule held by words drifted. Process4 has more rules held by words than Process3 had, and its three-tests rule may have removed the one hard stop that worked.

**Sentences attacked.** The full list is appendix A. The sharpest:
- "One short rulebook per role, at most ten rules, rewritten in place." (G)
- "The one hard size limit, on each role's starting text, held all week, while the guide with no limit grew from 8 KB to 134 KB." (I item 8)
- "A worker ... decides nothing and never reviews another session's work." (B)
- "A session never records its own decision, or its summary of what you said, as yours." (B)
- "ARCH starts the job session, with instructions naming every act the job may take." (C step 4)

**Evidence.**
- [measured] The cap is `tool/test/roles.test.mjs:98`, a test in the process's own repository (causal_forensics §1.1). It is not one of the three tests. The definition cites its result twice and never says whether the test is kept. If kept, it is a fourth test. If dropped, the only restraint with a measured record goes with it.
- [measured] Reviews of process changes were never required by Process3's tool. They were "Coordinator practices imposed on builders: cold subagent review of every PR" (causal_forensics §2). 285 of 776 commits were review-fix commits; 102 of 104 findings were acted on. Removing the tool's three review rules removes something that was not the cause.
- [measured] Session choices recorded as Bob's: 14 of 21 items marked his across ten handoffs were mechanisms; of 35 safeguards, 7 quoted him (causal_forensics §4.1). The definition repeats the pattern in its second paragraph: his decisions of 13 and 14 Nov "reached this document through a session's written record of them, not through text you typed."
- [measured] Free text typed by one session into another's start was a working rule channel and cannot be compared with anything (enforcement_levers, surface 9).
- [measured] The Foundations line that a rule held only by text "is a nudge and is marked so" is kept (disposition row 75). It teaches every session that text is the weaker kind, and that a fix that must hold belongs in code (causal_forensics driver 3).

**How bad.** Drift over days: costs Bob time, then repeats Process3 in the places the wall does not cover.

**Answer within the rule.**
- Removal: delete the text rules that nothing can hold and that the record shows did not hold, in place of restating them. A rule that is written and not kept teaches that rules are not kept.
- Honest statement: mark each remaining text rule as unheld, in the definition, as his own kept line requires.
- Bob's to say: whether the existing size test on role texts counts against "no others, ever". enforcement_levers raised the same question and it is not in section K.

Sources: causal_forensics §1.1, §1.4, §2, §3, §4, driver 3; enforcement_levers §1, §4; disposition row 75.

### 9. A reported number becomes a target, and the definition's own example proves it

**Counter-argument.** The definition's showpiece of a bad fix began with a report: two jobs recorded a cost of zero, "so a report read wrong", and a session made the figure compulsory and stopped every job. Process4 keeps that report and adds numbers to it.

**Sentences attacked.**
- "A tranche report: time, work done, cost, overhead, and the minutes it took of yours ... These are reported, never enforced." (G)
- "Report cost where it can be read." (I item 4)
- "the size of the process before and after" (K)

**Evidence.**
- [measured] PR 105 then 106, 45 minutes (change_sample case 2). 229 cost rows for 693 claims; 106 say "unmeasured"; 111 of the 123 figures come from two days (k_evidence K4(b)). The report will read wrong again on day one.
- [measured] Every question Bob asked about a number came back as a mechanism: "Is there a way for you to check that all github traffic is going through" became a hook on every tool call and an hourly audit; "why did Process3 not catch it" became holds, alarms and owed starts (causal_forensics §4.2).
- [measured] A number shown without a stop did not restrain either: "The cap is NOT met", reported nightly, never met (causal_forensics driver 10).
- [measured] Keeping the numbers was itself the bulk of the work: 89% of commits were bookkeeping; 105 of 508 merges changed only records (product_side, summary).
- [reasoning] With the job record ended and state kept in pull requests, somebody must still gather time, cost, overhead and Bob's minutes. That is record-keeping without a named home, which a session will build.

**How bad.** Costs Bob time; a slow route back to compulsory records.

**Answer within the rule.**
- Removal: report only what git and GitHub already hold when the tranche ends (merges, dates, rounds, the walk's lists). Drop cost and overhead until a route to read them is measured; say "not reported" once, not "unmeasured" per job.
- Structural: the report is made once, at the tranche's end, for Bob. It is not a file sessions read while working.
- Wording for the coordinator: a question from Bob about a number is answered with the number.

Sources: change_sample case 2; k_evidence K4; causal_forensics §4.2, driver 10; product_side summary.

### 10. The stop that ended Process3 is kept

**Counter-argument.** Each of Bob's five edits to his approvals stopped every long-lived session, and after the last one the product never restarted. The definition keeps that stop and puts its cure in the list of things not yet proven.

**Sentences attacked.**
- "A session compares the approvals it loaded with the newest, and on a difference does nothing ... *Claude decided:* keep it" (I item 11)
- "At the start of Process4, then only when the wording must change" (B, table)

**Evidence.**
- [measured] 16 owner patches to the product's CLAUDE.md in nine days, each widening or clarifying a permission after a session met a wall (product_side §6a). "one owner edit to one approvals line stops the train and forces every role and task to be replaced" (causal_forensics driver 9). The last product merge was 16:35Z on 9 Nov; his patch merged at 16:45Z; nothing carrying product work moved again (product_side §8).
- [reasoning] Process4 changes how merges are made (no review verdict) and what sessions do. Section J items 1 and 3 expect permission walls to be probed. Walls met mean edits by Bob; edits mean every long-lived session stops. ARCH, ROOT and the coordinator are all long-lived.

**How bad.** Stops a tranche, repeatedly, each time Bob does the one thing only he can do.

**Answer within the rule.**
- Trial first, as J 10 says, and nothing in force until it passes.
- Structural: no session lives across one of his edits by design. If ARCH is replaced at each round's end from the status read-out, an edit is taken up at the next round with nothing compared and nothing stopped. Then the comparison can be removed, which is a removal.

Sources: product_side §6a, §8; causal_forensics driver 9; permissions_inventory as cited by enforcement_levers lever 8.

### 11. Four decisions Claude made today have a strong case against them, and two were not Claude's to make

Each is "the strongest case that it is wrong", as asked. The full list of all the decisions in sections I and K is appendix C.

**(a) Retiring the two judging numbers.**
- *Attacked:* "*Claude decided:* the two numbers ... are retired. Neither was ever produced in Process3, neither runs the product" (K, earlier point 5).
- *Case.* They are Bob's kept line: "Two health metrics from day one" and "the standing judge of every other line" (k_evidence K4(a)). The definition's test for what Claude may decide is "ways of doing something, not purposes". What judges the process is a purpose. The disposition's own note says "the owner should see any change to his judge". And the stated ground is weaker than it reads: the one day with a count gives about 13% false "done", worse than the one in eleven his line cites, so the number would not have "read healthy"; that phrase was "the disposition author's inference" (k_evidence K4(b)). The replacement, walk steps passing, is a number the sessions write (finding 1).
- *How bad:* misleads Bob. *Answer:* wording. Put it back in section K as his question.

**(b) Running the external walk by fixed rule.**
- *Attacked:* "Claude decided how the option works: a fixed rule runs it after every tranche" (C).
- *Case one.* A walk with a trigger, a run and findings that become work is a test by the definition's own form in section D. Run by default after every tranche it is a fourth test in all but name, against "exactly three tests, and no others, ever". Bob made it optional; Claude made it standing.
- *Case two, the opposite.* It is too weak where it sits: it runs after the main branch has moved (finding 2), reversing his 8 Nov order.
- *Case three.* His own words of 8 Nov: "an expensive means of identifying many of the same the flaws the internal walk found", and a caution about Cloudflare limits. It also needs an act of his that is not on his list: connecting an AI account before the AI journeys can be walked (k_evidence K5(d)).
