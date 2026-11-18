# [file] audit_D_central.md (continued)

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
17. **R3, R6, R15, R17 in the R1 to R25 table, and the count "meets 19, weakens 6".** The grades match the clauses above.

### (iii) Where the requirements pull against each other or against a measured platform fact

1. **Order (3e) against parallel jobs (4), on this map.** Under "a module's job starts when the jobs of all modules it uses have merged", a median of 3 and at most 12 modules are ready at once over 65 waves, and a bound of 20 never binds. The width Process3 had (up to 62 at once) came from running 182 modules beside something they use. The owner's own kept principle P10 says "all the module jobs of a layer run concurrently". Both cannot hold on the present map. The choice is his: the literal order with a narrow build; order by layer with notification doing the repair; or a different map. Read as "module k waits for module k minus 1", the requirement allows no parallel jobs at all.
2. **Order (3e) and notification (3f to 3h) fit each other; layer-at-once and cheap notification do not.** Under the literal order every user's job comes after its provider's, so a notice reaches a job that has not started. Under layer-at-once a notice reaches jobs already running or merged. Process3 measured that second case: 2,707 notifications, 90% "not affected", 338 repeat landings.
3. **Notification to "all users" against velocity.** A median of 8 direct users and a maximum of 213 per interface change; 28 modules have more direct users than 24 jobs. When users' suites ran with the provider's change, Process3 measured +7.6 minutes median with 0 catches in 20.
4. **Requirement 1 against the approvals channel.** Measured 2 Nov: consent quoted in a starting prompt was declined 11 of 11 times; "your committed CLAUDE.md is the one channel that reaches sessions you do not start"; "No session writes, edits or relays them, because the judge refuses that". So on the platform as measured, sessions that other sessions start act only on a file the owner edited himself.
5. **Requirement 1 against starting anything.** "Creation only by you, ROOT or a scheduled task." A scheduled task's fresh session "cannot start sessions or send messages, 0 of 3". Someone has to start the first session and create the first task, and the cloud environment's variables, secrets and setup script are set in Claude. None of these is a GitHub or Cloudflare setting. The requirement as worded has no place for Claude-side settings.
6. **Requirement 2 against the refusal pause.** "After three refusals in a row a session stops and waits for a person"; Auto mode also hands a session to a person after 20 refusals. Process3 replaced such sessions with a sweep and a watcher; the proposal deleted both. Recovery without a person needs acts (archive, task switching) that the classifier judges case by case and that the Foundations ruled "never needed for correctness".
7. **Requirement 1, requirement 2 and "sessions cannot change the process" form a triangle.** The proposal's one physical defence against the Process3 loop is the owner's merge. Remove the merge (requirement 1) and either sessions can change the process again, or a process defect cannot be fixed with no one watching (requirement 2). The proposal's stated way out, hard limits in place of the merge, is by its own words "unproven" and rests on "one case". The owner should decide which corner gives.
8. **"No handoffs" against the platform.** A long-lived ARCH accumulates context and must be refreshed, which brings back handoffs or an owner replacement. A fresh ARCH per wake needs a task's fresh session to start sessions, measured 0 of 3. Only one subscriber may hold a pull request's events, so ARCH cannot be woken by them while jobs are.
9. **Requirement 4's "user-changeable" against requirement 1's "permissions or rules".** A number is neither. A GitHub repository variable is a setting he can change without a command or a file edit, but it is outside the two kinds of setting requirement 1 names. Above his number sit two ceilings he does not set: about 50 live sessions, failing silently, and 20 concurrent runners on the Free plan.
10. **Requirement 2 against two of his own rules.** A public release waits for his approval (GAP-7), and stop is his. Both are owner waits by design, and the release approval is a click, not a setting.
11. **Requirement 3c against the work of run 1.** "Each module is updated and tested by a single job", while the next work on the product is completion items and walk fixes that cross modules, and the proposal's job is "one module or item".


# [file] session_brief.md

# Brief for a session on one question: when must a module's users be updated?

Written 14 Nov 2026 as the starting text for a separate session that continues this study with Bob, the owner. It stands on its own; the full study is `process4/working/notice_study/study.md` in this repository (branch `process4`).

## How to talk to Bob (his standing rules)

- **Plain words.** No reference codes, no shorthand, no rule letters. Say "the rule that tells a module only when something it names has changed", not "g1". Module names are fine. Explain any technical word the first time, in a sentence.
- **Only his own typed words count as his.** Quote them exactly, with the date. Anything a session wrote down for him is the session's record, not his words. Never say "you decided" for something he did not type.
- **No assurances.** Do not say a thing works, is safe, or will hold unless it was measured, and then say what was measured and on what.
- **Keep four things apart, every time:** *measured* (counted by a script), *estimated* (worked out from a sample), *judged* (somebody's reading; say whose), *unproven* (never run).
- **No new tests, checks, gates or reviews.** Process4 has exactly three tests: each job's own module tests, the internal walk, the external walk. The notice to a user module is a notification, not a test. No session reviews another's work. A remedy may be: a sharper statement of what a module's interface is; a rule the provider's job follows when it writes requirements and tests; a mechanical rule for who is told, worked out from the change itself; a way for the told module to dispose of a notice cheaply; a change to how modules publish what others rely on.
- **When you propose changing something he defined,** describe the proposed change in words he understands and wait for his yes or no. His words of 14 Nov: "When you change something I defined you need to describe the PROPOSED change in words I understand so that I know what you're proposing and whether to approve the change or not."
- He enters no commands and edits no files. Bring him questions that are his (what the product and the process should be), not technical ones. Put a question once, with the options and what each costs.

## The question, in his words

Typed 14 Nov 2026:

> "If every user is told when the implementation of a module changes but the interface doesn't, then every change will continue to cause every user of that module to be rebuilt and tested. That's very (very!) inefficient and unnecessary. There must be a practical means of identifying when a change doesn't require user modules to be updated. Maybe we should create a separate session that focuses only on this issue so that we can explore the challenge in as much detail as necessary to find a means of being more efficient during the build process."

> "Explain why using the current criteria 5 of the 241 changes that AI workers judged real would have been missed. What was different in those 5 modules?"

Background he has set (the session's record of 13 Nov, which he has referred to as his decisions): the product is about 220 modules in one order; a module may use only modules before it; each module is built and tested by one job; "When a job changes a module's interface, every user of that module is notified, so those modules' jobs are updated as needed and tested"; "Recognising that an interface changed must be proved rigorous and correct."

## What exists to measure against

Process3, the earlier process, left a record in the public repository `neobobkrause/civicsmith-copy` (clone it read-only; it is not attached to the session) (branch `origin/process-state`, folder `notices/`): 178 changes to a module, 2,707 notifications to modules that use it, and 2,342 written verdicts by AI workers, 241 "affected" and 2,101 "not affected". Each verdict gives a one-sentence reason with a file and line. An earlier replay of this record is in `process4/working/replay/` (`results.md`).

**Read-only.** Never commit, push, fetch into or check out in any clone of the product repository. Start no cloud sessions for this work.

## What has been measured so far

**1. "Affected" did not mean "had to be updated."** For each of the 241, the study looked at what the user module's own job did afterwards. (Counts of merges and files are measured. The sorting into three kinds is judged, by one reader, from the verdict's reason, the job's own written words and the changes it made.)

| | Of the 241 |
| --- | --- |
| The user was wrong or failing until it changed ("broken") | 40 (26 in its code, 14 only in its existing tests) |
| The user changed its code to take up something new; nothing was wrong without it ("adopted") | 34 |
| The user's job changed no code for it; often it added one test saying so | 140 |
| No follow-up ever ran (the process stopped); the reason reads as nothing to change | 26 |
| Cannot tell | 1 |

So of 2,707 notifications, 40 (1.5%) found a module that needed updating and 34 (1.3%) one that chose to adopt something. The 40 are in 23 of the 178 changes. 17 of the 40 come from two changes that retired old names.

**2. What breaks users is removal.** 22 of 27 cases where a name, an operation or a field was removed or renamed broke the user. Every other kind of change (a changed answer under the same name, a changed table, a new capability, a changed way of calling) broke its user at most one time in eight. (Judged kinds.)

**3. The five that the present wording would have missed.** The present wording says the interface changed when one of four things changed: an exported name, a numbered public requirement, a test whose title names a requirement number, or a published file that is not code. In five changes none of those changed and a user was still judged affected. In all five the provider changed what its callers see, inside a function or a list, without changing anything that carries a name or a number.

| Change | What happened | What the user had to do |
| --- | --- | --- |
| agent-drafts, pull request 570, user agent-worker | Drafts stopped saying which "runner" to use. The behaviour was written down only in the other module's file | Add a guard to its code (done in a job already open) |
| agent-steps, 185, user agent-worker | A usage record lost two fields and gained two. The public requirement already described the new shape and was marked "not yet met"; the mark was left as it was | Change one line of code (in a job already open) |
| agent-steps, 497, user agent-worker | A new refusal is added to a list the user hands on. Written in no requirement | Nothing; it added one test saying so |
| ai-accounts, 316, user store-assembly | A fix: a name is now recorded as "member:ann", not "ann". Recorded as a found flaw, not as a public requirement | Respell three lines of its own tests |
| member-roster, 286, user membership | A generated list of all modules gained one, because the product's module list did | Nothing; it added one test saying so |

Three were real breaks, two were not. Four of the five involve modules that had been split apart for file size or had code moved between them that week.

**4. Why the 2,101 were not affected** (estimated from 120 drawn at random, seed 20261114): in about 39% (range 30 to 48%) the user had no code that uses the provider at all, only a line in the module list; in about 53% it used the provider but not the part that changed; the rest were small groups. Measured on all 2,707: in 510 (19%) nothing of the user imports the provider; in 685 (25%) only its tests do.

**5. Most users had work of their own anyway.** 1,735 of the 2,707 notifications went to a module that already had an unmet requirement or an open job; 33 of the 40 broken users were among them. 972 went to a module with no other work. (Measured. That week nearly everything had work; an ordinary week may differ.)

## The candidate rules and how each scored

Each rule was worked out for all 2,707 notified pairs from the code as it stood at each change. "Broken reached" uses the judged sorting above.

| Rule, in words | Notifications it would send (of 2,707) | Broken users reached (of 40) | Adopters reached (of 34) |
| --- | --- | --- | --- |
| Process3 as it ran: tell every declared user | 2,707 | 40 | 34 |
| Tell every declared user whenever the provider's code changed | 2,385 | 40 | 32 |
| Tell only users that import a name which was removed or is now called differently | 26 | 1 | 2 |
| The same, widened to methods the user calls | 124 | 12 | 9 |
| Add users whose own requirements or tests mention, by number, a public requirement of the provider that changed | 186 | 22 | 22 |
| Add users that import a test helper the change touched | 241 | 24 | 22 |
| Tell everyone, but only when a public requirement, or a test named for one, changed | 2,213 | 37 | 33 |
| Tell everyone, but only when a public requirement's wording changed or it was removed | 420 | 21 | 8 |
| **Tell a user only when something it names changed**: a name or method it uses, a table it imports, a test helper it imports, a requirement it mentions by number, or a word of the provider's that it writes out and the provider has dropped | **460** | **35** | **29** |
| The same, leaving out "a requirement it mentions became met" | 387 | 30 | 17 |
| The same as the bold rule, plus users whose own unmet requirement names the provider | 737 | 37 | 31 |
| Tell users whose own existing tests fail against the provider's change | could not be worked out by reading | | |

What the bold rule misses: five broken users. In three, what broke was a test of the user's own. Three of the five had work of their own at the time. Two (`signin-door`, `store-assembly`) had none and were found only because everyone was told.

What the rules need from jobs to be dependable (rules for writing, not checks): a module's requirement file says, by number, which of each provider's public requirements it relies on; a provider changes a public requirement's wording or its "not yet met" mark in the same change as the behaviour; a fix that changes what callers see is written on the public requirement and not only as a found flaw; a test's title names its requirement number in one standard form; a name is retired by removing it, never by leaving it with a new meaning.

## Two candidate definitions to put to him

1. **"Something this module holds was taken away or changed."** A user must be updated when its own files name something the change removed, renamed, called differently, changed the contents of, or reworded. A requirement that only became met is not a change; a user waiting for it has its own "not yet met" line, and that line makes its job run. On the record: 387 notifications; reaches 30 of the 40 broken. Unproven as a working process.
2. **"Anything this module names changed,"** including a requirement it mentions becoming met. On the record: 460 notifications; reaches 35 of the 40. Unproven as a working process.

Neither has been run. Both rest on a sorting that one reader made.

## Open questions

**For Bob's judgment (his to answer, in his words):**

1. Which matters to him: that no module is ever left wrong without being told, or that almost none is, at a sixth of the cost? On the record the cheapest rule that reached all 40 broken users sent 2,385 of 2,707.
2. When a provider's answer changes and a user simply hands it on, with no change to the user's own code, does he want that user told? That was most of the 241.
3. When a provider finishes something a user was waiting for, is the user's own "not yet met" line enough to bring its job, or does he want a notice as well?
4. A module that already has work gets a job anyway, and that job's module tests run against the provider as merged. Is that enough for such a module, so that a notice starts a job only for a module with no other work?
5. May a module's own existing tests be run because a module it uses changed, when the module has no job of its own? Two readings were written down and not decided. One: these are module tests, run for an informed reason, as his record says users' jobs "are updated as needed and tested". The other: it is a run his three tests do not list, and done everywhere it is the full regression the internal walk replaces. Only he can say.
6. Is he willing to have every job write, in its requirement file, the numbers of the provider requirements it relies on? The better rules depend on it.
7. The product's module list is itself something modules depend on (seven of them run things in its order). Who is told when ARCH edits it?
8. 510 notifications went to a module with a declared use and no import. Should a declared use have to say what it rests on?

**For more measurement (a session can do these without him):**

1. Run each user's existing tests against each of the 178 provider changes, to learn what "the user's own tests fail" would have caught. Large: up to 2,707 runs; one suite takes six minutes.
2. Have a second reader sort the 241 without seeing the first sorting, and compare.
3. Re-examine a sample of the 2,101 "not affected" for users that were in fact broken. The replay found three such users among modules never told.
4. Measure how completely modules mention the requirement numbers they rely on today.
5. Try the rules on the 365 notified pairs that were never judged and the 167 declared pairs never told.
6. Count false alarms of the "word the provider dropped" rule on code outside this record.

## Where everything is

- The study: `process4/working/notice_study/study.md` in this repository (branch `process4`). Scripts beside it, run with `python3 -I <script>`; the order is at the end of the study. `signals.py` takes about five minutes.
- One row per affected verdict, with its sorting, its follow-up and which rules reach it: `process4/working/notice_study/data/classified241.tsv`.
- The reader's sorting of the 241: `judged241.txt`. Of the 120 sampled: `judged_sample.txt`. Rule scores: `data/rules.json`.
- The earlier replay: `process4/working/replay/results.md`, with its scripts and data, which this study's scripts read.
- Background: `process4/evidence/interface_and_cycle.md` (what a module's interface is in practice), `process4/evidence/no_layers_width.md`, `process4/evidence/process4_definition_v4.md` sections D and E.
- The record: the public repository `neobobkrause/civicsmith-copy` (clone it read-only; it is not attached to the session), branch `origin/process-state` at `c4c252913b`, folder `notices/`; the code at `origin/tranche` `e7ec72e093`.


# [file] k_evidence.md

# Section K, points 1 to 7: evidence for Bob's decisions

14 Nov 2026. Research worker's findings. Read-only: nothing was changed, committed or pushed in any repository.

## How to read this

- **Measured** means a count taken from git or from a stored report, either by a named evidence file or by me today. **Judgment** means someone's reading, mine included; each is marked.
- **Sources.** The handoff files in `/home/user/handoff/`. The clones `/home/user/repos/process3` and `/home/user/repos/civicsmith-copy` (made today by a sibling worker; I only read them). The coordinator's running log, `notes/coordinator-findings-3-4nov.md` on `origin/start/coordinator-4nov` in process3 (1,302 lines; "LOG Ln" below). My own scripts are in the session scratchpad and are not kept.
- **Bob's words.** A line in quotation marks after "Bob" is quoted in the source as his. Where the source only paraphrases him I say so, because his decision of 13 Nov is that only words he wrote count as his.
- **The decisions of 13 and 14 Nov.** No handoff file holds their full text. I quote them only as far as `process4_disposition.md` and `audit_D_central.md` quote them.
- **What I could not read.** The GitHub API is not attached to this session (attaching it would mint credentials, which my brief rules out). Pull-request comments, where each gate run posted its findings, are therefore unread. This limits K1 and K4.

---

## K1. Two checks beyond the three tests

### K1(i). The check that a job's pull request wrote only its own module's files

**(a) Bob's documents**

- ARC-2, kept 31 Oct 01:44 UTC, no note: "Each file has one owner module; a job writes only its module's paths and tests and the strike of its own marks." The page's own points: for, "Working today. / Makes parallel jobs safe from overwriting each other. / A simple check."; against, "Shared files such as configuration need a designated owner. / A fix that spans modules needs two jobs or a BOB ruling."
- Foundations, "A job's life", step 4: "It writes only its module's files and tests (ARC-2), strikes only its own marks (REQ-4), and never commits a generated artifact (JOB-8)."
- Foundations, "What the checks defend against": "The tool's checks hold against mistakes (a session that edits a settings file, touches another module, resolves a merge with an old copy, merges something red or stale, or moves the pin somewhere unreleased) and against outsiders' fork pull requests."
- Ledger map: "ARC-2 | One owner module per file | gate and merge | Built".
- Decision of 13 Nov as quoted in the disposition: "Each module is updated and tested by a single job"; "exactly three tests and no others, ever".
- Disposition row 28: conflict for the owner. Its note: "No evidence against the check: one false refusal, repaired on 3 Nov (change_sample PR 46, cited by audit A)."
- Section H of the draft records that on 13 Nov Bob confirmed three sibling checks end (new tests fail when the change is undone; the second run on the merged result; built files match their sources). He has not ruled on this one.

**(b) What Process3 did**

How it was built (read from `tool/lib` at `origin/tranche` of process3):

- It ran in the test run on GitHub and again at the merge. In the test run: `gate.mjs:153`, for each changed file not under the module's own paths, a finding "job <id> may not change files outside its module". At the merge: `merge.mjs:433`, the merge tool refused with "<branch> changes files outside its module".
- By the end the same rule was applied in two more places: the command by which a job published its work "refuses any file outside your paths" (`job.mjs:171`), and the command that took another branch's work into a job refused files outside the module's paths (`job.mjs:666`).
- The rule was also in every job's starting text: "Not yours, and this line wins over any act above: ... editing ... another module's files" (`job.mjs:189`).
- A module's own paths were its ledger entry's `paths` and `tests`, its requirements file, and its own two record files (`gate.mjs:67`). The merge tool read the paths from the tranche's copy of the entry, never from the job's branch.
- The merge tool repeated the check because "it repeats the checks a pull request could switch off in its own copy of the gate workflow" (`merge.mjs`, header comment).

How often it fired: **not found.** The gate's findings were posted as pull-request comments, which I could not read. The gate rows kept in git "carry no reason field" (product_side, "What could not be established"). Related counts that are measured:

- 1,187 gate runs on 207 job pull requests, 3 to 5 Nov: 113 red (9.5%); "74% went green with no change to job code or tests". The audit listed "ownership/ledger" under KEEP and gave it no count (LOG L681, the coordinator's check audit of 5 Nov; the audit document itself is not in the repository).
- 6 to 9 Nov: 70 of 789 gate runs red; 43 red with the module's tests passing; the reason is not recorded (product_side §9.3).
- Of 171 "block" messages jobs wrote in November, none names the ownership check or its refusal text. 34 say the fix needed lies outside the job's own paths and hand it to the coordinating session (measured by me, keyword search of the block commits). product_side's larger figure, 69, counts "a record, ledger or paths check" together.

Real cross-module writes against false alarms:

- Measured by me from git today. I took every commit a job brought to a merge (506 job merges on the tranche and layer branches, 2,414 commits) and every unmerged commit on job branches (25 branches, 126 commits), and compared the files each commit changed with the module's own paths as its ledger entry lists them at the last tip.
  - Commits that changed another module's source or tests: **0 of 2,540.**
  - One pull request (57, `bundler`, 3 to 4 Nov) changed a file outside its paths, a workflow file, and undid it before merging: "leave deploy-test.yml as the tranche has it (a workflow edit is Bob's)".
  - One commit (pull request 365, `op-grades`, 5 Nov) wrote a new requirements file that a later split made another module's. That is a by-product of the size cap (section I item 3), not a cross-module write.
- Limit of that measurement: it uses each module's paths as they stood at the end. Where the check fired because the list of paths was wrong and the list was then widened, my count cannot see it.
- Known false alarms, each from the map or the tool and none from a job writing another module's code:
  - 3 Nov: "Every layer-1 job on the copy failed the ownership check when it cleared a mark; BOB worked around it" (change_sample PR 46). The check was loosened 47.6 hours after it was added.
  - 5 Nov: "ledger: case-authoring and queue paths gain their requirements-notes files (PR 456, 455 ownership findings)" (product commit `c40b90c79c`).
  - 7 Nov: "screens-ai's entry had empty paths and tests, so the gate fails ownership on every screens-ai file" (product commit `651461f5ca`).
- No recorded case in Process3 of the check stopping a job from overwriting another module's code. **Judgment (mine):** the measured record cannot tell whether jobs kept to their module because of the check or because their instructions said so. Every job's starting text carried the rule, and 117 of the 220 job entries also say "Edit no other module" (my count).

**(c) Options, with cost and risk**

1. **The check ends; the rule rests on the job's instructions.** Cost to Bob: none. Risk: two parallel jobs overwrite each other's files, the case ARC-2 names. Measured rate of a job writing another module's code in Process3: 0 in 2,540 commits, while the check existed in up to four places.
2. **The check stays, read as part of the first test.** The first test already carries one check that is not a test of behaviour ("the uses the module declares match what its code imports"). Cost to Bob: none in acts. Risk: it needs a correct list of every module's files; each of the three recorded false alarms came from that list or from the tool, and each stopped jobs until a session repaired it.
3. **The rule is held inside the merge tool, with no separate check.** The merge tool is the only way a session can merge. **Judgment (mine):** a refusal inside the merge tool is still a check by another name; section H counts such things as checks.
4. **A GitHub setting holds it.** See (d): none is available on this repository.

**(d) Constraints**

- GitHub cannot restrict which files a push may change on a public repository: "Push rulesets are available for the GitHub Team plan in internal and private repositories" (levers §1, from GitHub's documentation). Both repositories are public.
- Making the repository private to get that rule "forfeits free Actions minutes, the merge queue ... and required reviewers on environments (public-only below Enterprise)" (levers, line 126). The release approval in section C of the draft depends on a required reviewer on an environment.
- CODEOWNERS can only require a named person's review of a path. That makes Bob a reviewer of merges, which is against unattended running and against his act list.
- The deny list is one file per repository, committed by Bob. It cannot differ per job unless a session writes settings files, which the permission checker judges case by case (PLT-2) and which permission management as preserved does not allow. **Judgment (mine).**
- "Exactly three tests, and no others, ever", read with Bob's confirmation of 13 Nov on the three sibling checks, points to option 1 unless he reads this check as part of the first test.

### K1(ii). The install-from-scratch test and the upgrade test before a public release

**(a) Bob's documents**

- Foundations, "Where the process stops": "A development release stops as a draft, deployed only as a development deployment in the product's own account, and the Release workflow runs an install-from-scratch test and an upgrade-from-previous-release test as release-tier fixtures before it does." This is disposition row 263, F-STOP-2: purpose kept, mechanism open.
- No Ledger line asks for either test. The canon analysis lists them as A26 and A27 with no phase and no builder ("—").
- BD-R4, Bob, 8 Nov, on the product's existing migration test: "There are no earlier versions of the plane that exist. So migrate-released need only look at perhaps the last 2 or 3 versions just to make sure that the migration process actually works." (The record adds "the last 3 releases (the coordinator's reading of "2 or 3", the safer end)".)
- BD-R3, Bob, 8 Nov: "build the installer only when the internal walk completes without the need for another round, and build the site update only once the external walks complete without the need for another round."
- The disposition gives both readings: "Tests outside the three; they end ("no others, ever")" against "tests of release packaging that D6, which speaks of rounds, does not address".

**(b) What Process3 did**

- **Neither was built as a release-tier test, and neither ran.** Measured by me: the product's release configuration (`process/config.json`, `release.checks`, at `origin/layer/14`) holds two checks, "setup-words fresh" and "fleet bundles". Neither installs from scratch or upgrades.
- **No release of any kind was cut.** "So NO release dev for round 1" (LOG). No tag beginning `p3dev` is on the product's remote (measured by me; a development release would have pushed one). All 12 development deployments ended `ok: false` (product_side, re-read by me in `deploys/dev.jsonl`).
- **The product already has an upgrade test, as a module test.** `bio-plane/test/system/migrate-released.test.mjs` is listed in the `plane` module's own tests (its ledger entry at `origin/layer/14`). Its header records why it exists: "Every release from 0.59.0 to 0.63.0 BRICKED an existing store ... The battery never saw it because every suite builds a FRESH store ... DIST found it live on biosmoke7, at 0.62.0."
- **The installer has module tests too:** `newgroup/test/` and `bio-plane/test/system/newgroup-bundle-fresh.test.mjs`, in the `installer` module's entry. The internal walk also walks the installer's pages (journey 28, for example "install: the installer's first page", in the stored walk report).

**What the two tests would catch that a scripted walk would not**

- **Upgrade.** A walk runs on a fresh copy. Every development deployment is "a whole fresh copy named `p3dev-<slug>`" (levers §7). A fault that appears only when new code meets data written by an older release cannot show on a fresh copy. The migration test's own header is the recorded case.
- **Install from scratch.** Development deployments are made by the product's deploy scripts over Cloudflare's interface, not by the installer (levers §7, §8.1: "The product's own install path (the REST deploy, the installer) is not exercised"). **Judgment (mine):** a walk therefore proves the product runs once deployed, and proves the installer's screens, but not that the installer can place a signed release into an empty account.

**(c) Options, with cost and risk**

1. **Both end as tests of their own; what exists stays where it is.** The upgrade test and the installer's tests remain module tests of `plane` and `installer`, inside the first test. Cost to Bob: none. Risk: they run only when those modules' own files change, so an upgrade fault introduced by another module is seen only if the notice to `plane` leads its job to run that test. **Judgment (mine).**
2. **Both are kept as steps of preparing a public release.** Cost to Bob: none in acts; they run before he is asked to approve. Risk to the product: none added. It is a fourth and fifth test unless he reads release preparation as outside "three tests".
3. **The external walk is made to cover them:** it walks a copy installed by the installer, and a copy upgraded from the last release. Cost to Bob: none in acts. Risk: unbuilt and unproven; the external walk took 60 and 64 minutes each time it ran (measured, product_side).
4. **Both end, nothing replaces them.** Risk: the first public release that meets an existing group's data is the first test of upgrading. The recorded history is releases 0.59.0 to 0.63.0, each of which broke existing stores.

**(d) Constraints**

- "Exactly three tests, and no others, ever" rules out option 2 unless Bob says release preparation is not a test in his sense.
- Bob's own word of 8 Nov (BD-R4) keeps the migration test, bounded to the last two or three releases. Option 4 would drop what he chose to keep five days earlier.
- A public release needs his approval in any case, so options 2 and 3 add no act of his.

---

## K2. Set-up acts on the Claude side

**(a) Bob's documents**

- P17, modified 3 Nov; the stored note is a copy of the suggestion: "Keep it whole after onboarding; no Ledger line holds it today. Your word, 3 Nov: during onboarding the platform forces a few GitHub steps of yours; keep those as few as possible, each walked through."
- Foundations, "The human and the AI": "You do not edit files or enter commands; the few steps of yours the platform forces at onboarding are kept as few as possible and each is walked through (P17)."
- Foundations, "Setup": "One document, the developer's steps ... lists only the acts the developer must take, each with why ... What the check cannot read (secrets, Actions settings, collaborators, the cloud environment) is confirmed there once." (F-SET-4.)
- Foundations, "Deploy tokens": "Onboarding adds the product's deploy tokens to the cloud environment as environment variables, the one route both the deploy tools and setup check were measured to read (2 Nov)". (F-SET-8b; section I item 12.)
- Foundations, "Moving accounts": "development can stop under one Claude account and restart under another on one plain request (your word, 2 Nov; GAP-8): ... the developer recreates the cloud environment and Claude's GitHub connection from a page the process writes".
- GAP-8, kept 3 Nov 17:35 UTC, no note; source "Your words, 2 Nov about 18:58".
- Decision of 13 Nov, quoted in audit D: "The user doesn't enter commands nor edit source files. The only actions he will very occasionally take are changes to GitHub or Cloudflare settings related to permissions or rules."

**(b) What Process3 did**

The acts, exactly (process3 `setup/DEVELOPER.md`, 11 steps, and `rulebooks/account-switch.md` section 2):

1. **Connect Claude to GitHub as the session account** (Step 3). In a private browser window: sign in to GitHub as the second account, accept the repository invitation, open claude.ai's GitHub connection page signed in to Claude as himself, and authorise with the second account showing. Why: "If it is connected as you, every session would act as the owner, and the rules below would not hold them."
2. **Install the Claude GitHub App on the repository** (Step 2). This is on GitHub's side, as owner.
3. **Put the deploy token into the Claude cloud environment** (Step 8). Create the Cloudflare token (Cloudflare's side), then on claude.ai open the environment's settings and add each variable the product lists, "as an environment variable (not under Network secrets)". The product lists 11 names. "The variables reach only sessions started after you save."
4. **At an account switch,** on the new Claude account: connect GitHub as the session account; install the App; "Recreate each product's cloud environment: its network, its setup script, its variables and the network secret for api.cloudflare.com, with the values only Bob holds"; share the documents; start the first session.

How often (my count from the record; the dates are the record's):

- Onboarding, 1 to 2 Nov: once.
- Account switch of 5 Nov: GitHub connected twice. The first connection was as Bob's own owner account, so "06:23 every job start refused"; the second was as the collaborator. "Cost: 0 jobs live 05:44-07:18 (94 min at 0/20, against 19/20 at 05:20)."
- 6 Nov 19:19Z: GitHub suspended the session account. A new session account followed; every merge from 7 Nov is by `believeinoakland` (permissions_inventory).
- 7 Nov: a second account switch was prepared and cancelled. Bob: "The account switch didn't work... So start everything back up here in this account." Cost "about 9.5 h" (LOG L1067, L1075).
- So in nine days: three occasions that needed these acts, and a fourth that was abandoned. Bob, 6 Nov, on why switches happen: "I'm watching weekly usage. So I'll let you know when it's time to start shutting down development under this account and prepare for the move to another." (LOG L980.)

Can a session do any of them?

- **GitHub's settings: no.** Measured 1 Nov: setting branch protection from a session was "Refused by the proxy, 2 tries"; sessions also cannot read Actions settings, secrets, collaborators or environments (permissions_inventory).
- **Claude's GitHub connection: no tool for it.** The tool a session has for reaching a repository tells it, on refusal, that "the user should reconnect GitHub under claude.ai Settings → Connectors". Observed in this session's tool descriptions today; not a Process3 measurement.
- **The cloud environment: in part.** Observed in this session today, not trialled as a Process4 route:
  - A session can read its environment's variable names, never the values. This account's environment, named "BIO", shows 16 names, among them the 11 the product lists, one network secret for `api.cloudflare.com`, and a setup script. It reads as editable by the session's proposal.
  - A session can propose a new environment or an edit: network hosts, a setup script, and variables that are not secret. Each proposal shows Bob an approval prompt "every time, in every permission mode", and "nothing is created unless they approve".
  - A session must not put a secret into a variable. For a secret, a session can ask the platform to show Bob a secure form; the value is stored as a network secret that the platform adds to requests to one named host. The session never sees it.
  - Process3's deploy tools read the token from an environment variable, and its steps said "not under Network secrets". The signing seeds are not credentials for a web host. **Judgment (mine):** so the token values still pass through Bob's hands, and whether the network-secret route can replace the variable for deploying is unmeasured.
- **Starting the first session on a new account: no.** Sessions are created only by a person, by ROOT, or by a scheduled task, and a task's fresh session could not start sessions, "0 of 3" (2 Nov).

**(c) Options, with cost and risk**

1. **Accept them as listed acts, outside the two kinds of setting.** Cost to Bob: about one sitting per product start and per account switch. Risk: the one recorded mistake, connecting GitHub as the owner, was part of a 94-minute outage: job starts were refused at 06:23 and everything was closed again at 06:37.
2. **Accept them, and have sessions prepare what they can:** a session proposes the environment and its non-secret variables, and Bob approves a prompt and types only the secret values. Cost to Bob: fewer steps, but each proposal is a prompt that waits for him. Risk: unproven; a prompt that waits for Bob stops that session while nobody watches. **Judgment (mine).**
3. **Not accepted: the definition must show each done without him.** The evidence says it cannot be done for the GitHub connection or for secret values.

**(d) Constraints**

- The decision of 13 Nov names only GitHub and Cloudflare settings. These acts are on claude.ai, so they are an exception he must grant or refuse; the platform leaves no third way for the connection and the secrets.
- Permission management as preserved requires that sessions act as a second GitHub account that "can push and merge but cannot change settings". That is exactly what Step 3 sets up. Skipping it means sessions act as the owner.
- "Bob enters no commands and edits no source files": none of these acts is a command or a source edit. They are clicks and pasted values in two web pages.

---

## K3. Bob's approval before one particular merge

**(a) Bob's documents**

- GAP-10, kept 3 Nov 17:35 UTC, no note: "Review findings go to the job as diagnosis and review is never the merge gate; a green gate merges without Bob, who approves a particular merge only when he asks to. Replaces INT-3."
- INT-3 (31 Oct), which it replaced: "Branch protection plus your approval is the last word." The page's "against": "You become the approver for every merge unless you delegate that to the green check alone."
- Foundations, "The human and the AI": "Approving a merge is such an act only when you ask for it: by default a job, layer or tranche merges on a green gate without you, while a public release waits for your approval (GAP-7), and you ask for your approval before a particular merge when a design is hard enough to warrant it (GAP-10)."
- Foundations, "Review": "the tool merges without you by default; you ask for your approval before a particular job, layer or tranche merges as the exception, not the norm (GAP-10, replacing INT-3)."
- Disposition rows 57, 123 and 239: all KEEP. Section 5 gives both readings: "A gate; it ends, and under D2 nothing waits for him" against "His own option, used only when he asks; not part of the process's tests."

**(b) What Process3 did**

- **Used: not found.** I searched the coordinator's log for Bob asking to approve a merge before it happened and found no case.
- **How it was built: no mechanism of its own.** The ledger map marks GAP-10 "Merge on green without Bob | merge | Built", which is the default half. Nothing in the tool marks one pull request as waiting for Bob. The nearest things:
  - The GitHub rule on the main and tranche branches required no approving review ("required_approving_review_count": 0), so Bob could merge any pull request himself on GitHub's website.
  - The merge tool refused some kinds of change and said "that needs the owner's word: bring it to Bob": a workflow file change outside set limits, a change to the process pin's source, a deleted config (`merge.mjs` lines 639 to 708).
  - A "hold" row could keep a module's work from starting (`hold.mjs`); it held starts, not merges, and "no hold needs Bob".
- **Merges Bob made himself** (measured by me from the first-parent history; reading the author and the title format is my judgment):
