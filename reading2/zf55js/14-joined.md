# [file] attack_corruption.md (continued)


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
- *How bad:* misleads Bob on whether his three-tests decision is honoured. *Answer:* wording. Ask him whose option it is, and when the tranche ends relative to it.

**(c) Keeping the two-part test run.**
- *Attacked:* "It was added on a reviewer's 'what if', and the failure it guards against was never seen. It costs little. *Claude decided:* keep it." (I item 13)
- *Case.* This is the Process3 reasoning in one line: no measured failure, kept because cheap. Change_sample's caution on exactly this class: such rules are "cheap and inert rather than proven", and drew the longest review loops. Bob's kept rule says a check exists only against a measured failure or his word. A definition that keeps a "what if" check on the ground that it is cheap hands every later session its precedent.
- *How bad:* minor in itself; corrosive as an example. *Answer:* removal, or say plainly it is kept against his rule and why.

**(d) Ending the citation rule.**
- *Attacked:* "*Claude decided:* end the citation rule." (I item 7)
- *Case.* The rule failed as a brake. It worked as a trail. The 9 Nov count, "Bob's quoted words: 7 ... Coordinator only: 19", and the finding that 14 of 21 items marked his were mechanisms, could be made only because additions named their authority. Without it, nothing separates his word from a session's after the fact, and "only words you wrote yourself count" has no record to rest on.
- *How bad:* misleads Bob, later. *Answer:* wording. End it as a licence to add; keep the plain habit that any quoted word of his carries its date and source, which the coordinator rule already asks.

**(e) Ending the own-files check.** Finding 7.

**(f) Ending the earlier requirements of section I as a group.**
- *Case.* Thirteen items in section I, six of the earlier open points and fourteen technical points in section K are reported as decided, with "You can overrule any of them." Process3's approval page worked the same way and kept 119 of 126 lines, then 20 of 20 in three minutes (causal_forensics driver 8). A default he must act to reverse is the instrument the forensic record blames. Three purposes are kept with nothing holding them: "a module fits in one reading", "a lean repository", "act only on what you have read in full". Those are now text rules of the kind in finding 8, or they are dead and should be said to be.
- *How bad:* misleads Bob. *Answer:* wording. Fewer items, each with what is lost stated beside what is saved.

Sources: k_evidence K4, K5; causal_forensics §4.1, driver 8; change_sample §5 (caution on trust rules); disposition rows 73, 193.

### 12. Smaller holes

**(a) A change across many modules may skip the tests on a session's judgment.**
- *Attacked:* "Some such changes are so trivial that module tests need not be rerun." (C) and "*Decided:* ARCH, which reports it." (K, technical 7)
- *Case.* GitHub lets nothing into the tranche branch without the tests passing. So either the check reports green without running, which is a way round the only gate, opened by a session's judgment, or the change cannot merge. Process3 built a "light gate" for record-only changes and narrowed it two hours later (change_sample §4, PR 287 then 288). [measured for the precedent; reasoning for the rest]. The preserving of the pass is Bob's; the judge is Claude's choice.
- *How bad:* silently corrupts, rarely. *Answer:* wording. Say exactly how such a change merges, or run the tests of every module touched and drop the exception.

**(b) ARCH is one long session.**
- *Attacked:* "ARCH is the architecture session, one per product." (B) beside "Sessions. Kept short." (G)
- *Case.* Process3's coordinator was replaced about 25 times in six days and each note re-grew its rules within a day (causal_forensics §3). A long session's own summary of itself is the same chain in one body (redteam_corruption 4, checked against this draft: still applies). ARCH also types every job's start text and passes every notice.
- *How bad:* drift. *Answer:* structural, as in finding 10: replace ARCH each round from the status read-out.

**(c) Bob's own words still arrive as orders.**
- *Attacked:* "It passes your words on exactly as written, with the date, and they are followed." (B)
- *Case.* "BE CAREFUL" became one job at a time and a minute between writes; four questions in 26 hours each became a subsystem (causal_forensics §4.2). Passing his words on exactly does not change what the receiving session does with a question.
- *How bad:* costs Bob time; a route for additions with his name on them. *Answer:* wording, for Bob as much as for sessions: a question is answered; only a sentence he marks as a decision changes anything.

**(d) The first contents are written before any rule or wall exists.** Process4's tool, texts and walk are written by sessions before the first tranche (enforcement_levers §4, item 10). The definition gives no size for them. [reasoning]. *Answer:* state the starting size in the definition, so that there is a round 1 to compare with in J 9.

---

## Appendix A. Every place the definition relies on a rule in text, and what Process3's record shows

"Held" names anything physical behind the rule. "Text only" means nothing is.

| # | Rule, in the definition's words | Section | Held by | What the record shows |
| --- | --- | --- | --- | --- |
| 1 | "A session never records its own decision, or its summary of what you said, as yours." | B | Text only | 14 of 21 items marked Bob's were mechanisms; 7 of 35 safeguards quoted him (causal_forensics §4.1) |
| 2 | "ROOT decides nothing and builds nothing." | B | Text only | No direct evidence against |
| 3 | The coordinator "passes your words on exactly as written", "decides nothing about the product and never brings you a technical question" | B | Text only | "about 6 job sessions" became his agreement; a technical question waited nine hours as "Bob's" (§3C, §3D) |
| 4 | ARCH "does not choose which job starts next"; "has no discretion over it" | B, C | Text, unless the rule is code | Sessions set the session count themselves several times (definition H); "told BOB '6 at most'" |
| 5 | ARCH "never edits your approvals or publishes a release without you" | B | Held: checker, protected area | Held in Process3 with a deny or GitHub rule behind it |
| 6 | A job "writes only its own module's files" | B, D | Text only (check ended) | 0 of 2,540, with the check standing (finding 7) |
| 7 | A job "never merges, starts a session or deploys" | B | Merge: held by deny list. Rest: text | Merge held |
| 8 | A worker "decides nothing and never reviews another session's work" | B | Text only | Cold review of every process change by practice, not by tool; 102 of 104 findings acted on (§2) |
| 9 | "Sessions are at most three levels deep, and none starts its own replacement." | B | Text only | Coordinator refreshes needed tool support of their own (§3B) |
| 10 | "Only your own word ... puts a module ahead." | C | Text only | As row 4 |
| 11 | "instructions naming every act the job may take" | C | Text only; free text typed by ARCH | "MY STANDING RULES TO BOB"; start texts carried lessons (enforcement_levers, surface 9) |
| 12 | "A flaw it finds in another module goes to ARCH" | C | Text only | 34 blocks did hand such fixes on, with the check standing |
| 13 | "There is no review" | C | Text only | As row 8 |
| 14 | A cross-module change "needing no judgment"; tests skipped when "so trivial" | C | Text only; a session judges | Light gate added then narrowed in two hours (PR 287, 288) |
| 15 | External walk: "no session chooses" | C | Text, unless the rule is code | In Process3 a rule or Bob decided; no deployment for 80 hours on a paraphrase of his word (k_evidence K5) |
| 16 | "exactly three tests, and no others, ever" | D | Text only | 211 process test files grew inside the product's own tests (product_side §6c) |
| 17 | "A test runs only when there is a fully informed reason to run it." | D | Text only | 63% of gate runs were not started by a code change (product_side §4) |
| 18 | A failure already there "is not the job's to fix" | D | Text only | 48 blocks; five merges of exemption code (finding 6) |
| 19 | A notified job "runs only the tests that relate" | D | Text only; the definition says it "must judge" | Notices narrowed then widened in 34 minutes (PR 79, 82) |
| 20 | "After two failed corrections ARCH replaces the session" | E | Text only | The round limit of 2 Nov was overridden all 17 times it applied (change_sample §5) |
| 21 | A blocked job "records that it is blocked, pushes everything and stops" | E | Text only | 165 block commits, median 1,389 characters (product_side §6d) |
| 22 | A fix "may only correct or remove" | E | Text only (the definition says so) | Finding 3 |
| 23 | "A fault that blocks nothing waits for the next tranche." | E | Text only; the fixer judges | 116 version moves; median 3 to 21 minutes from process merge to product (product_side §4) |
| 24 | "Only then does it wait for you" | E | Text only | Nine-hour wait on a question that was not his (§3D) |
| 25 | "One judged act per command"; "A refused act is never reworded or handed to another session" | F | Text only | After one refusal the checker treated the next push as a bypass (enforcement_levers lever 8) |
| 26 | "Three refusals in a row stop a session." | F | Held: platform | Measured |
| 27 | How a session must be started (one repository, newest tranche commit, every act named) | F | Text only | "a ROOT you started twice came up on an old copy of the branch" (definition J 2) |
| 28 | "One writer per file." | G | Text only | As row 6 |
| 29 | "acts only on what it has read in full or measured, and starts from a status read-out, not from notes" | G | Text only; the audit for it is ended | 26 handoff notes; a 540 KB findings log "read from ... down" (§1.1) |
| 30 | "One short rulebook per role, at most ten rules, rewritten in place." | G | Was a byte test in Process3; unstated here | The one restraint that held (finding 8) |
| 31 | "Sessions. Kept short." | G | Text only | A coordinator's own "60% rule" became a start step (§3B) |
| 32 | "One fixed version per tranche, changed only by a recorded act." | G | Text only without the wall | 116 recorded acts |
| 33 | "reported, never enforced" | G | Text only | Finding 9 |
| 34 | Purposes kept with the mechanism ended: "a module fits in one reading", "a lean repository" | I | Text only | The size cap was overridden 32 of 32; first run of the file check gave 947 findings |
| 35 | The four things section K says the wall does not stop | K | Text only (the definition says so) | Finding 4 |
| 36 | "Each fix comes to you with one plain sentence saying what it corrects or removes" | K | Text; the fixer describes its own fix | Every Process3 addition carried the label asked for (finding 3) |

Of 36, three have something physical behind them (5, 7 in part, 26). One had it in Process3 and is unstated now (30).

## Appendix B. The ten causes in the forensic record: removed, or only forbidden?

| Cause (causal_forensics §7) | Removed by the definition? |
| --- | --- |
| 1. The texts ordered a build for every failure and outlawed the cheap alternative | **No.** "The process itself has a fault. Claude fixes it." The form of the fix is limited; the duty stands, and a blocking fault pauses the product until it is discharged |
| 2. The restraint was mechanised as a citation test with no cost term | **Yes** (I item 7). Replaced by another test of the label ("corrects or removes"), again with no cost term |
| 3. Text had a budget and code had none; a fix that must "hold" had one place to go | **No.** No budget on the process's code is stated; the one budget that held is unstated (finding 8); the kept "nudge" line still ranks text below code |
| 4. A fix-it reflex that closes a problem with a guard and fails closed | **No**, and not claimed (K: "A session being over-cautious in its own work") |
| 5. Review as a generator of obligations | **In part.** The tool's three review rules go. The reviews of process changes were practice, not tool (row 8) |
| 6. The roles that wrote the process carried no restraint text; handoff notes were their rulebook | **Not stated.** A "short session started for that one fix"; what it loads is not said. ARCH's successor starts from the status read-out, which removes the notes in text |
| 7. The scoreboard (process merges) and the cost (on the product) sat apart | **No.** The fix session's "done" is its fix merged |
| 8. Session choices recorded as Bob's, and his few words turned into canon | **No.** A rule in text; the wall's click would add to it (finding 4); the definition's own source for his decisions is a session's record |
| 9. Bob's inputs pushed both ways and each question returned a mechanism | **No.** His words are passed on "and they are followed" |
| 10. No session saw the total; audits were themselves additive | **In part.** The tranche report and, under the wall, a size line. J 9's comparison runs in the first tranche only |

## Appendix C. The decisions Claude made today in sections I and K: the strongest case against each

| Decision | Strongest case that it is wrong | Weight |
| --- | --- | --- |
| I 1. End the job's receipt | None of weight; Bob said "get rid of it completely" and it caught nothing in 1,187 runs | None |
| I 2. End the set-up check before every job | A missing setting now shows as a job failing later for an unclear reason. Minor; the false stops were measured | Minor |
| I 3. End the size cap on requirement files | The purpose "fits in one reading" now has no holder. But 32 of 32 overrides and a loop put into the order | Minor |
| I 4. End compulsory recording of cost | "Cheaply" is half of Bob's purpose and now may never be reported: 106 of 229 rows said "unmeasured" when it was a duty | Real; say so |
| I 5. End the oversized-file check | 86,347 lines of generated data had been in the tree before (product_side §5). Nothing now keeps them out | Minor |
| I 6. End the job record as a data file | With state in pull requests, a second account suspension hides the record with the account (redteam_corruption 10; the suspension of 6 Nov is measured, the hiding is not) | Real; unproven |
| I 7. End the citation rule | Finding 11(d) | Real |
| I 8, 9. End the advice on instruction texts; allow refusal for size on the process's own texts | Something must do the refusing. That is a test outside the three (finding 8) | Real; Bob's to rule |
| I 10. End the reading audit | Never built. None | None |
| I 11. Keep the approvals check at start-up | Finding 10 | Serious |
| I 12. Keep tokens in the cloud environment's settings | None found | None |
| I 13. Keep the two-part test run | Finding 11(c) | As precedent |
| K 1. End the own-files check | Finding 7 | Serious |
| K 2. End install and upgrade tests as release tests | Releases 0.59.0 to 0.63.0 each broke existing stores. The release walk "on a copy installed with the real installer" is unbuilt, and first runs while Bob waits to approve | Real |
| K 5. Retire the two judging numbers | Finding 11(a) | Bob's, not Claude's |
| K 6. External walk by fixed rule | Finding 11(b) | Bob's, not Claude's |
| K 7. Eight slots for each product | None on my angle | None |
| Technical 1. State in each job's pull request | A notified job with no change has no pull request to hold its state (finding 5) | Real |
| Technical 3. "only a fix for a blocking fault, once" | "Once" is not defined (per tranche, per fault?). If per tranche, the second blocking fault has no route; if per fault, it is Process3's 116 | Real; wording |
| Technical 7. ARCH judges a change trivial enough to skip tests | Finding 12(a) | Real |
| Technical 11. No completion-round list; rounds repeat | Finding 1: no bound | Serious |

## Appendix D. Earlier attacks checked against this draft

| Earlier finding (on the withdrawn proposal) | Still applies to the second draft? |
| --- | --- |
| redteam_corruption 1: the first gate defect stops all work and only the owner can clear it | Yes, under the wall (finding 4) |
| redteam_corruption 3: the process moves to the Claude side | Yes; the definition admits two of the channels in K and offers nothing |
| redteam_corruption 4: a long-lived coordinating session is the handoff chain in one body | Yes (finding 12b) |
| redteam_corruption 5: the owner's merge button is the route for growth | Yes, under the wall (finding 4) |
| redteam_corruption 6: checks move into the product's tests and the walk | Yes; now worse, because the walk alone ends a tranche (finding 1) |
| redteam_corruption 7: byte and line caps that do not cap | Changed: this draft has no caps at all (finding 8) |
| redteam_corruption 11: the draft commits the sins it diagnoses | Yes (finding 3, "The definition itself does it"; finding 11f) |
| redteam_feasibility 4: the required check must report on every pull request | Yes, as findings 5 and 12(a): the no-change job and the skipped-tests change |

## What I did not establish

- The diffs of the nine walker commits whose subjects excuse or retire a step. I read subjects only.
- Whether "no failures" was ever defined by Bob more exactly than the sentence quoted.
- The length of an internal walk. Only the deploy-and-walk runs are timed (60 and 64 minutes).
- A false-failure rate for the walk itself. The 7% figure is for module test runs on 3 to 5 Nov and includes red results caused by record checks, not only by chance.
- The simulation's job lengths and the placing of walk findings are assumptions; the graph, the modules with work and the 10% are from the record.
- I did not re-read vendor documentation. Platform statements are quoted through enforcement_levers and k_evidence.


# [file] enforcement_levers.md

# Process4: what could physically stop a session adding a test or a check

14 Nov 2026. Read-only research. Nothing in any repository was changed; no session was started.

## 0. Scope, marks and limits

**The question.** Process4 has three tests and no others. A process fix may only correct or remove. Today that rule is text only (definition, section J item 8). This paper asks what permission settings and structural choices could make an addition impossible, or leave it with no power to stop work, without adding any check, scan, gate or reviewer.

**Marks on every platform fact.**

- **[doc today]** read today in the vendor's documentation. GitHub pages were read from the documentation's own source (`github/docs`, branch `main`) and are cited by their docs.github.com address. Claude Code pages were read at code.claude.com. Two GitHub pages (the permission levels page and the REST page for Actions policies) were read through a fetch that summarises, so their quotations may not be exact to the letter.
- **[tool today]** stated in the tool definitions this session was given today, or observed in this session today.
- **[P3 measured]** measured in Process3; file and passage given.
- **[repo today]** counted today from the two public clones (`process3` at `origin/tranche` 38b0f3f, `civicsmith-copy` at `origin/tranche` e7ec72e).
- **[memory]** from memory, not checked.
- **[untested]** nobody has measured it on these repositories.

**Limits.** GitHub's API was closed to this session for both repositories ("GitHub access to this repository is not enabled for this session" [tool today]). So live rulesets, collaborators, Actions settings and the plan of the owner's account were not read. Session transcripts were not available.

**What the evidence shows about plan and visibility.**

- Both repositories are public: an anonymous clone of each succeeded today [tool today].
- Both are owned by a personal account, not an organization: the owner's setup guide says "On a repository you own personally, a collaborator gets Write, never admin" [repo today: `process3` `setup/DEVELOPER.md` Step 2]. Not read live.
- The GitHub plan (Free or Pro) is not stated anywhere I read. For public repositories the two plans offer the same features used below.
- The owner's Claude plan is not stated. It matters for one lever only (managed settings, lever 9).

---

## 1. Surface map

"Can write today" means physically, under Process3's end-state settings. The sessions' GitHub account holds Write on both repositories: it authored and merged the work in both (270 of 296 merges into the process repository's integration branch were made by the two session accounts, 26 by the owner [repo today]).

| # | Surface | Where it lives | Who can write it today | Process3 additions of this kind |
| --- | --- | --- | --- | --- |
| 1 | The process tool's code (commands that can refuse) | Process repository, `tool/lib`, `tool/p3.mjs` | Any session with the process repository; sessions merged their own changes | The main site. 121 of 296 merges added or strengthened a check (41%), carrying 60% of tool code lines [change_sample, Summary]. 252 of 296 merges touched tool code; all 659 commits there are session-written, none the owner's [repo today]. 818 refusal sites at the end [causal_forensics 1.1] |
| 2 | The merge tool | Process repository, `merge.mjs`, `layerflow.mjs` and the removed train | Same | 111 of 296 merges touched the merge path [repo today]. 95 and 128 refusal sites in the two files [causal_forensics 6]. Three merge designs in five days [levers 2.1] |
| 3 | The code behind the required check | Process repository, `gate.mjs`, run by a workflow in the product | Same | 56 of 296 merges [repo today]. Receipt comparison, revert check, size cap, branch binding all entered here [change_sample cases 3, 5] |
| 4 | The tool's own tests | Process repository, `tool/test` | Same | 255 of 296 merges; 41,777 test lines added in nine days [repo today; change_sample section 1] |
| 5 | Workflow files in the product | Product, `.github/workflows` (four copied from the process at each version move, four the product's own) | Any session, by pull request; also on any branch without one | The gate workflow grew from 77 to 273 lines, every change through a version-move pull request; all workflows 446 to 1,021 lines [product_side 6a]. 15 session commits from 1 Nov, none by the owner; 13 copied process files at a version move, 2 changed the product's own workflows [repo today] |
| 6 | The pinned process version | Product, the `.process` submodule entry and `.gitmodules` | Any session, by pull request | Moved 116 times in nine days, all by sessions [product_side 4]; 120 session commits touch it, none the owner's [repo today] |
| 7 | The product's process settings file | Product, `process/config.json` (names the process repository's address, the integration branch, limits) | Any session | 24 to 421 lines; 70 session commits [product_side 6a; repo today]. It can point the product at a different process repository |
| 8 | Role instruction texts | Process repository, `rulebooks/`, prompt builders in `roles.mjs`, `job.mjs`, `start.mjs`; `README.md`; `DECISIONS.md` | Any session with the process repository | Prompts stayed at 4,032 to 4,197 bytes, held by a byte test. Uncapped texts grew: guide 8 KB to 134 KB, decisions 0 to 49 KB [causal_forensics 1.1]. Check sentences outnumber act sentences 4 to 1 or more [1.2] |
| 9 | Starting prompts one session types for another; messages | Claude side; free text in the call that creates a session | Any session that may start or message a session | Not countable. "MY STANDING RULES TO BOB"; "told BOB '6 at most'; BOB followed for ~6 h"; 26 handoff notes re-grew "Rules in force" within a day of being cleared [causal_forensics 3] |
| 10 | Scheduled tasks and extra helper sessions | Claude side | Any session with the task and session tools | Coordinators carried three to five tasks each; the hourly check accreted an audit [redteam_corruption 3; causal_forensics 3E] |
| 11 | Briefs to in-session workers used as reviewers | Claude side; free text | Any session | 285 of 776 commits were review-fix commits; 102 of 104 findings acted on [change_sample 1; causal_forensics 2] |
| 12 | A module's own tests | Product, each module's test files | The module's job (and physically any session) | 211 test files, 11,410 lines, written for the process and not the product: 26% of the week's net test growth [product_side 6c] |
| 13 | The walk's steps | Product, the walker module | Any job on that module | 238 to 357 steps within one round [redteam_feasibility 12] |
| 14 | Which checks are required to merge | GitHub ruleset | The owner only. A session's write was refused by the proxy, 2 tries [P3 measured: permissions_inventory 1e row 13] | None by sessions. But the code that the required name runs was session-written (rows 3 and 5) |
| 15 | The product's CLAUDE.md | Product | Approvals block: the owner only by rule; physically any session by pull request. The rule was held by a check in the Process3 tool and by the permission checker ("Instruction Poisoning", 2 of 2) [permissions_inventory 1a] | Owner 10 edits, each widening a permission. Sessions 5 commits, to the process lines below the block [repo today] |
| 16 | The deny list and hooks | Product, `.claude/settings.json`, `.claude/hooks` | Same as row 15 | Owner 4 commits. One added a hook before every shell command, drafted in answer to a session's finding; still in the tree [product_side 6a] |
| 17 | Requirement files, plan files, the module map, labels, pull-request comments | Product and GitHub | Any session | The module map carries dozens of dated "AMENDED" clauses; labels usable as holds [redteam_corruption channel table] |
| 18 | A session's own conduct | Nowhere | The session | Not countable. "Sessions will still hesitate, over-ask and over-test inside their own work" [audit_D 5.5] |

Two readings of the map.

- Almost every counted addition was in rows 1 to 4, in the process repository, written by sessions the coordinator started there, merged by the sessions' own account, and carried to the product by a version move (row 6). Those sessions loaded the process repository's CLAUDE.md, "which is approvals only", and no text carrying the restraint [causal_forensics 1.4].
- The product side grew too (rows 5, 7, 12, 13), mostly as a consequence of rows 1 to 4. Rows 9 to 11 and 18 leave no record that can be counted.

---

## 2. Candidate physical stops

For each: what it is, whether Bob's plan and visibility allow it, whether it is proven, what it leaves open, what it costs.

### Lever 1. The sessions' account cannot write the process repository

- **What.** The process repository stays public. The sessions' account is not a collaborator on it. Anyone can read a public repository; only collaborators can push.
- **Available.** Yes, on any plan. It is the absence of a grant. A personal-account repository has no read-only collaborator level: "Collaborators can't have read-only access to repositories owned by a personal account" [doc today: docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/repository-access-and-collaboration/permission-levels-for-a-personal-account-repository]. So "not a collaborator" is the read-only state.
- **Proven.** By GitHub's rules, yes. Not measured in Process3: the sessions' account had Write there throughout. Today's session saw the same wall from the Claude side: the GitHub proxy answers only for repositories attached to the session [tool today].
- **Covers.** Rows 1 to 4 and 8: every counted addition in Process3.
- **Left open.**
  - A fork and a pull request from it. It merges nothing by itself; the owner's merge button is then the way in. The record says he presses it: 151 of 159 drafted lines accepted, four requests in 26 hours each returned as a subsystem [redteam_corruption 5]. The owner can close this with "Limit interactions", an owner-only setting [doc today, same page], for up to six months at a time [levers 1.2, not re-read].
  - Pointing the product at another copy. The product names the process repository in files sessions can write (rows 6 and 7). See levers 2 and 5.
  - The copy inside a session's own container can be edited there. It affects that one session and does not last.
- **Cost.** Every process fix needs the owner: he merges it. A process fault that blocks work then waits for him. That contradicts section E as drafted ("Claude fixes it") unless the fix is prepared by a session and merged by him. Process3 merged 296 changes to the process in nine days and moved the version 116 times; at that rate this lever is unworkable, so it only works if the process is small enough that faults are rare. How rare is not known. The feasibility review expects the first gate defect on day one [redteam_feasibility 1; redteam_corruption 1].

### Lever 2. The pinned process version lives where only Bob can write

Three forms.

- **(a) No version entry in the product at all.** The product refers to one fixed name in the process repository (a branch or tag). Only Bob can move that name, because of lever 1. This removes row 6 and the 116 moves at the root.
- **(b) A branch only Bob can update.** A ruleset rule: "Restrict updates: only users with bypass permissions can push to branches or tags whose name matches the pattern" [doc today: docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets]. Rulesets are available "in public repositories with GitHub Free" [doc today: .../managing-rulesets/about-rulesets].
- **(c) A variable of a GitHub environment.** "To create secrets or variables for an environment in a personal account repository, you must be the repository owner" [doc today: docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-variables]. A plain repository variable does not serve: "For a personal account repository, you must be a repository collaborator" is all it takes [same page]. So the sessions' account can write repository variables. This matters equally for the slot number.
- **Proven.** None measured. All three rest on documentation read today.
- **Left open.** The product still holds a line that names the reference, in a file a session can write, unless that file is guarded (levers 4, 5). A session's container copy.
- **Cost.** One act of Bob's for each fix a running tranche adopts, plus one per tranche. Under the kept rule "only a fix for a blocking fault, once" that is the number of blocking faults. Unknown; not 116.

### Lever 3. GitHub makes the merge decision; there is no merge tool

- **What.** The required check is already the owner's setting (row 14). If the merge itself is a native GitHub act, no session-written code stands in the merge path, and nothing a session adds outside the required check can block a merge. Two native forms: a plain merge, which GitHub refuses while the required check is not green; or auto-merge, where GitHub merges when it turns green.
- **Available.** Auto-merge "is available in public repositories with GitHub Free" [doc today: gated-feature text in `github/docs`, shown on docs.github.com/en/pull-requests/collaborating-with-pull-requests/incorporating-changes-from-a-pull-request/automatically-merging-a-pull-request]. Only the owner can "Allow or disallow auto-merge"; a collaborator can "Enable and disable auto-merge for a pull request" [doc today: permission-levels page]. The merge queue is not available on a personal-account repository [levers 1.1, not re-read today].
- **Proven.**
  - A plain merge by a session with GitHub's own tool, no merge tool: passed in Process3's first-day trials. Four groups of 201, 201, 50 and 120 acts had none refused, and each round in them included a merge of the session's own pull request with no review [P3 measured: permissions_inventory 1e row 18]. That was 1 Nov, before the merge tool existed.
  - Enabling auto-merge: never tried. The setting was off and the deny list removed the command [permissions_inventory 2c].
  - The checker has a "Merge Without Review" reason and used it once [permissions_inventory 2a].
- **Left open.** ARCH can simply not merge, and a job can leave its pull request in draft. The required check's own content (levers 4 to 6). Whether a second workflow reporting a check with the required name can confuse the rule: "Any person or integration with write permissions to a repository can set the state of any status check" [doc today: available-rules page]; how GitHub treats two runs with one name was not found in the pages read.
- **Cost.** Owner acts, once: one edit to the deny list (it removes every merge command and all of `gh` today), one wording edit to the approvals (they say "through the process's merge tool"), and for auto-merge one tick. Then the trial in section J item 1.

### Lever 4. Bob's review required for a few owned paths (CODEOWNERS)

- **What.** A CODEOWNERS file names Bob as owner of `.github/`, `.claude/`, `CLAUDE.md`, the version entry and the process settings file. The ruleset on the integration branch requires a code owner's review. An ordinary job pull request needs nobody; one that touches those paths cannot merge without Bob.
- **Available.** "You can define code owners in public repositories with GitHub Free" [doc today: docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners]. The file is read from the base branch of the pull request [same]. The alternative that keeps the path list in the ruleset itself, "Required reviewers", "is not available on user-owned repositories as they do not contain teams" [doc today: available-rules page]. Path restrictions on pushes are not available: "Push rulesets are available for the GitHub Team plan in internal and private repositories" [doc today: gated-feature text for rulesets]. Not for a public repository on any plan.
- **Proven.** No. Whether "zero required approvals plus code-owner review" lets ordinary pull requests through on a personal repository is untested [levers 1.3; redteam_feasibility 8]. Whether a submodule entry can be owned is untested. Bob cannot approve his own pull request [memory], so the admin must be on the bypass list.
- **Is it a new review?** It is an approval by the owner, on files that are his, set by a GitHub setting. It is not a reviewer session and not a scan. But it is a stop that waits for him, and "approve a pull request" is not on his list of acts in section B. He should rule on whether it counts.
- **Left open.** A session can still write those files on its own branch; a workflow pushed to a branch runs there; a session started from such a branch loads its edited settings [levers 1.3]. The CODEOWNERS file can be edited by anyone with Write ("People with write permissions for the repository can create or edit the CODEOWNERS file"), which is why it must own itself [doc today: about-code-owners]. The permission levels page lists "Define code owners for the repository" as owner-only; the two pages do not agree, and I did not resolve it.
- **Cost.** Bob's click each time routine work touches an owned path. In Process3 none of 508 job landings did [redteam_corruption, "Tried to break" 2]. Version moves (120 commits), copied workflow files (13) and process lines in CLAUDE.md (5) did; with levers 1, 2 and 6 those disappear. What remains is changes to the product's own workflows: two in nine days [repo today: two commits of 6 Nov, to the regression, release-signing and build workflows]. Each would wait for him while other work goes on.

### Lever 5. An Actions policy: only named workflow files may run for the sessions' account

- **What.** GitHub's workflow execution protections. "Actor rules let you separate who contributes code from who runs your CI, so you can grant a contributor write access without granting them the ability to execute workflows." "You can scope policies to specific workflow paths." [doc today: docs.github.com/en/actions/concepts/about-actions-policies and .../actions/how-tos/administer/control-workflow-execution]. The policy's target takes include and exclude lists of workflow paths [doc today: docs.github.com/en/rest/actions/policies]. So one policy can say: every workflow file except the named ones runs only for Bob. A workflow file a session adds then never runs. It is inert.
- **Available.** "All public repositories"; set by "Repository administrators" [doc today: control-workflow-execution page]. The levers paper dates general availability 17 Sep 2026; I did not re-read the changelog.
- **Proven.** No. New this autumn; never used here. Not determined: who counts as the actor when GitHub's auto-merge makes the push; whether a blocked run shows as a red mark on the pull request ("disallowed workflow runs will fail with an error" [doc today]), which could not block a merge but could prompt a cautious session to stop.
- **Also.** `Settings, Actions, General` can allow only named reusable workflows, by pattern [doc today: docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository]. That stops a product workflow calling a fork of the process.
- **Left open.** The content of the named files themselves. A `pull_request` run takes its workflow file from the pull request, so a job can still change the named gate file for its own run (lever 6).
- **Cost.** One setting. Bob edits the list whenever the product legitimately needs a new workflow file.

### Lever 6. The required check's definition lives where no pull request can change it

Three forms, none proven here.

- **(a) A reusable workflow in the process repository, called from a short file in the product** [levers 3.3]. With lever 1 the logic is Bob's. The short calling file is still in the product; lever 4 or lever 7 must guard it.
- **(b) A workflow on a default branch only Bob can update, triggered by `pull_request_target`.** That event runs "in the context of the default branch of the base repository" [doc today: docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows], so no pull request can alter it. But from 2 Dec 2026 GitHub blocks that event by default in public repositories; an owner policy must allow it [doc today: docs.github.com/en/actions/reference/security/securely-using-pull_request_target]. It runs pull-request code with the base repository's context, so it must hold read permission only and no secret. The default branch must then be one that sessions cannot merge into, which conflicts with "the tranche merges into main" unless a separate owner-only branch is made the default.
