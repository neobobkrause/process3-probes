# [file] study.md (continued)


### 1.1 agent-drafts, pull request 570, judged to affect agent-worker

- **What changed.** The drafting code stopped telling the AI conversation which "runner" to use (the runner is the container for a member's own Claude sign-in). Four calls lost one argument each; one test file was added. Commits `ca983c4b7a` to `f6049ea4a4`.
- **Why the user was judged affected.** agent-worker hands every draft request to that code. A runner was about to be connected again in agent-worker, so a draft on a member's sign-in would now reach the model with no runner.
- **Why none of the four parts caught it.** No name was added, removed or called differently. The requirement file was not touched. The new test is titled "notice agent-worker:364 ...: converse is called without a runner", which names another module's notice and no requirement number.
- **What would have had to be true.** "No draft names a runner" would have had to be a numbered public requirement of agent-drafts, with a test titled by that number. It existed only as a found flaw in the *other* module's file and a coordinator ruling.
- **Was the verdict right?** Yes, and the user was broken. agent-worker's job, already open, added a gate to its source (pull request 569, merged 74 minutes later: "a sign-in there would reach the model with no runner even while `RUNNER` is bound"). Its later pull request 619 added a test only and says "Confirmed, no code change", because the change was already in.
- **What was different here.** These two modules are one Worker cut in two to keep a requirement file under a size cap, and each uses the other. The change went back and forth between them four times (364, 570, 569, 619).

### 1.2 agent-steps, pull request 185, judged to affect agent-worker

- **What changed.** Each record of AI usage that agent-steps hands on lost the fields `model` and `effort` and gained `entry_id` and `label`. One function body in one file. Commits `589b844ea4` to `efaf53b300`.
- **Why the user was judged affected.** agent-worker read `model` from those records and sent it on. After the change it would send nothing for the model and drop the two new fields.
- **Why none of the four parts caught it.** The function's name and the way it is called did not change. The requirement file was not touched: public requirements 26 and 47 *already* described the new shape and were marked "not yet met", and the job changed the behaviour without striking or editing the marks. The tests that changed do name requirements 26 and 47, but agent-steps writes its tests with a helper of its own (`t("R47: ...")`) inside long files, not as standard test titles, so a reader of test titles sees nothing. Three modules write tests this way.
- **What would have had to be true.** Either the mark on the requirement changed when the behaviour did, or the tests were titled the standard way.
- **Was the verdict right?** Yes, and the user was broken. agent-worker's open job changed one line of source (pull request 97, six and a half hours later), and pull request 257 added a confirming test.

### 1.3 agent-steps, pull request 497, judged to affect agent-worker

- **What changed.** When a run's state holds something that belongs to the AI provider (a session id), agent-steps now publishes no state for that step and adds an entry to the run's list of refusals. Two places in one file. Commits `ef40849d5f` to `0f11547770`. The change was itself agent-steps' answer to a notice from agent-harness.
- **Why the user was judged affected.** agent-worker returns that list of refusals to its caller, so its answer can now carry the new entry.
- **Why none of the four parts caught it.** A change inside a function body. The requirement file was not touched; public requirement 55 says the state holds nothing provider-held, and nothing anywhere says a refusal is added to the list. The tests use the home-made helper again.
- **What would have had to be true.** The new outward behaviour (a refusal a caller can now receive) stated in a public requirement.
- **Was the verdict right?** The effect is real; the user needed no change. Its follow-up (pull request 619) added a test only: "no source change is owed (BOB, 6 Nov 04:42): this test pins the pass-through."

### 1.4 ai-accounts, pull request 316, judged to affect store-assembly

- **What changed.** A fix of a flaw: when a member's sign-in is recorded, the act is now recorded under "member:ann", not "ann". Two lines. In the requirement file a *found flaw* (numbered F4) went from "not yet met" to "met". Commits `202498e237` to `637f73a5cf`.
- **Why the user was judged affected.** Three of store-assembly's own tests recorded the disclosure under the bare name and would fail.
- **Why none of the four parts caught it.** A change inside a function body. A found-flaw number is not a public requirement number. The new test's title names no requirement number.
- **What would have had to be true.** A fix that changes what callers see would have had to be written on the public requirement it corrects, not only as a found flaw. (39 of the 178 changes touched the requirement file only in found-flaw marks; measured by the replay.)
- **Was the verdict right?** Yes; the user's tests were broken, its source was not. store-assembly's job was already open and had started from the provider's merged change; it respelled three test lines (pull request 325, merged about half an hour after the verdict). The flaw had been reported by store-assembly's own job in the first place.

### 1.5 member-roster, pull request 286, judged to affect membership

- **What changed.** A generated file that lists every module in order gained one module, because the product's module list gained one. Commits `14dbe3fc71` to `8e8654c79a`.
- **Why the user was judged affected.** membership runs its registered readers and listeners in that order.
- **Why none of the four parts caught it.** The changed list lives in a file no other module imports. The name other modules do import is computed from it, so its own text did not change and the fingerprint (taken of text, not of the computed value) did not either. Public requirement 61 already says "a module added, moved or dropped in the file changes the list with no edit here"; its text did not change. The changed test is titled by a found-flaw number.
- **What would have had to be true.** A fingerprint of the value as computed. More to the point, the cause was not member-roster's job at all: it was an edit to the module list, a file that belongs to no module.
- **Was the verdict right?** The effect is real; the user needed no change. Its follow-up (pull request 324) added one test file: the new module "ranks where the provider puts it with no change here."

### What was different in those five

| | Changed what callers see, with no name or number changed | Stated in a public requirement whose text did not change | Tests not titled by a requirement number | User already had a job open | What the user changed |
| --- | --- | --- | --- | --- | --- |
| agent-drafts 570 | yes | no (lived in the other module's file) | yes | yes | source (a gate) |
| agent-steps 185 | yes | yes (requirement already written, mark left) | yes (own helper) | yes | source (one line) |
| agent-steps 497 | yes | in part | yes (own helper) | yes | a test only |
| ai-accounts 316 | yes | no (a found flaw) | yes | yes | three test lines |
| member-roster 286 | yes (data) | yes | yes (found-flaw number) | no | a test only |

All five share the first column. Four are from two pairs of modules (agent-drafts, agent-steps and agent-worker) that were split apart for file size or moved code between them that week.

---

## 2. The 241

### 2.1 What the users' own jobs did afterwards (measured)

For each affected verdict the script takes the user's own merges after the provider's merge, up to and including the merge named in the notice's "answered" record (`followup.py`). The "answered" merge alone is not enough: in two of the five the change was made in an earlier merge of a job already open.

| | Verdicts |
| --- | --- |
| A follow-up merge exists | 215 (213 by the answered record, 2 by the user's next merge) |
| No follow-up merge (verdicts of 9 Nov; the process stopped) | 26 |
| Follow-up changed a source file of the user | 138 |
| Follow-up changed only tests | 74 |
| Follow-up changed only records (ledger, receipts, notes) | 3 |
| A test file named for the notice was added | 120 |

"Changed a source file" does not show that the notice was the reason: most of those jobs were doing work of their own. Narrower (`outcome.py`, measured):

| What can be tied to the notice | Verdicts |
| --- | --- |
| The user's job wrote that no code change was needed ("confirmed, no code change" or like words, in a line naming the notice) | 98 |
| A source hunk lies within 25 lines of the place the verdict cited | 63 |
| A test hunk lies there | 3 |
| Source changed somewhere else in the same job | 25 |
| Tests only, no statement | 23 |
| Records only | 3 |
| No follow-up | 26 |

### 2.2 Broken, adopted, or nothing to change (judged)

I read all 241 reasons, the user job's written words for each (`jobsaid.py`), and the source hunks at the cited place for about 80. Classes in `judged241.txt`; the full table is `data/classified241.tsv`.

| Outcome | Verdicts | Share of 241 | Share of 2,707 notifications |
| --- | --- | --- | --- |
| **Broken**: the user's code or its existing tests were wrong or failing until changed | **40** (26 in source, 14 in existing tests only) | 17% | 1.5% |
| **Adopted**: the user changed its code to take up something new, or to tidy; nothing was wrong without it | **34** | 14% | 1.3% |
| **Nothing to change**: the user's job changed no code for it; at most it added a test confirming so | **140** (77 added such a test) | 58% | |
| **No follow-up**, and the reason reads as nothing to change | **26** | 11% | |
| Cannot tell | 1 | | |

- The 40 broken sit in **23 of the 178 changes**. 11 are from `ai-runs` 96 and 6 from `op-declarations` 95, the two changes that retired the old AI-account names.
- Of the 166 with nothing to change, most are *pass-through*: the provider's answer changed and the user hands it on unchanged. The user's behaviour changed; its code did not need to.

### 2.3 Why the user was touched (judged kind; "public requirement changed" is measured)

| Kind of change at the provider | Verdicts | Broken | Adopted | Nothing to change (incl. no follow-up) |
| --- | --- | --- | --- | --- |
| A name, operation or field removed or renamed | 27 | 22 | 3 | 2 |
| The way something is called changed | 38 | 2 | 8 | 28 (14 with no follow-up) |
| A new capability | 19 | 2 | 10 | 7 |
| The answer or behaviour changed under an unchanged name | 103 | 9 | 12 | 82 |
| ... with a public requirement changed in the same change | 61 | 4 | 9 | 48 |
| ... with no public requirement changed | 42 | 5 | 3 | 34 |
| An exported table or list changed its contents | 43 | 4 | 1 | 38 |
| ... with a public requirement changed | 16 | 2 | 1 | 13 |
| ... with none changed | 27 | 2 | 0 | 25 |
| A published test fixture or helper changed | 3 | 0 | 0 | 3 |
| A file that is not code, a wire connection, a served page, a deploy script, a committed bundle | 8 | 1 | 0 | 6 (1 cannot tell) |

Two readings:

- **Removal is the kind that breaks.** 22 of the 27 removals broke the user. Every other kind broke its user at most one time in eight.
- **Verdicts that look wrong as "affected".** The 14 verdicts on `membership` 1030 (a method gained an argument in front; every caller passing a plain member id is unchanged, and the reasons say so) and most of the 82 pass-through cases are "the user calls the thing that changed", not "the user must change". None is false as a statement; they answer a different question from the owner's.

### 2.4 Opportunity and the user's own "not yet met"

Of the 34 adopters, 27 had an unmet requirement of their own at the time and 17 had one on a line that names the provider (measured: a "not yet met" mark in the user's requirement file at the provider's commit). For those the user's job was due to run anyway. Of the 40 broken, 32 had an unmet requirement of their own, and 13 of the 40 had a job open at the moment the provider merged (`jobopen.py`).

---

## 3. The 2,101 not affected

**Sample (estimated).** 120 drawn at random, seed 20261114 (`sample_not_affected.py`); each reason read and classed (`judged_sample.txt`; judged).

| Why not affected | Of 120 | Share | 95% range |
| --- | --- | --- | --- |
| The user has no code, or no file of it imports or names the provider (a declared use only) | 47 | 39% | 30 to 48% |
| The user uses the provider, but not the part that changed | 63 | 53% | 44 to 62% |
| The change only added names (the verdict says so and looks no further) | 4 | 3% | |
| The user uses the changed part and the change does not alter what the user does | 5 | 4% | |
| The provider changed no source | 1 | 1% | |

**Whole record (measured, `srcimp.py`).** Of the 2,707 notified pairs: in 1,512 (56%) the user's source imports the provider; in 685 (25%) only its tests do; in 510 (19%) nothing of the user imports the provider at all. 233 of the 241 affected verdicts are in the first two groups; 8 are in the third (a wire connection, operation names written as words, an instance handed in).

**What each rule would have sent to the 120 sampled** (measured): rule f, 95 of them; rule g1, 18.

---

## 4. Candidate rules

Each rule is computed for every one of the 2,707 notified pairs at the change's own commits (`signals.py`, `rules.py`). The provider is read before and after; the user as it stood before. "Broken" and "adopted" are the judged classes of section 2. Process3 as it ran is the first row.

| Rule | Changes on which anyone is told (of 178) | Notifications (of 2,707) | Of those, judged (of 2,342) | Affected reached (of 241) | Broken reached (of 40) | Adopted reached (of 34) |
| --- | --- | --- | --- | --- | --- | --- |
| Process3 as it ran | 178 | 2,707 | 2,342 | 241 | 40 | 34 |
| **(a)** every declared user, whenever a source file of the provider changed | 164 | 2,385 | 2,204 | 239 | 40 | 32 |
| **(b)** only users that import a name the change removed or re-signed | 11 | 26 | 23 | 8 | 1 | 2 |
| (b, widened) ... or import the class, or call a method of that name | 21 | 124 | 115 | 51 | 12 | 9 |
| **(c)** (b) plus users whose own requirements or tests cite a public requirement of the provider that changed | 53 | 186 | 167 | 67 | 22 | 22 |
| **(d)** (c) plus users importing a changed fixture or helper, or naming a changed non-code file | 68 | 241 | 212 | 73 | 24 | 22 |
| (d, widened) with the widened (b) and citations in source comments too | 76 | 331 | 293 | 102 | 26 | 25 |
| **(e)** users whose own tests fail against the provider's merged change | cannot be computed by reading | | | | | |
| **(f)** everyone, but only when a public requirement or a test naming one changed | 151 | 2,213 | 1,886 | 207 | 37 | 33 |
| (f, tests not counted) everyone, only when a public requirement changed | 93 | 1,388 | 1,104 | 130 | 28 | 30 |
| (f, strict) everyone, only when a public requirement was reworded, removed or retired | 25 | 420 | 390 | 51 | 21 | 8 |
| **(g1)** the user holds, by name, something that changed (defined below) | 110 | 460 | 416 | 150 | 35 | 29 |
| (g1 or the user has its own unmet requirement naming the provider) | 159 | 737 | 664 | 167 | 37 | 31 |
| (k1) g1 without "cites a requirement that became met or was added" | 92 | 387 | 358 | 126 | 30 | 17 |
| (g4) every user that imports the provider at all, on any source change | 158 | 1,900 | 1,748 | 231 | 39 | 29 |

(a) on all declared users, not only those Process3 told, is 2,521 pairs of 2,874.

### What each rule misses, and what it would need to be safe

**(a) Every declared user on any source change.** Misses the two verdicts on changes with no source change (`calculations` 70, `credentials` 74; both adoptions). Reaches every broken user. Saves 12%. *To be safe* it needs nothing new from the provider's job; it needs every dependence declared, and 122 pairs of modules depend through tests without declaring it (the replay's count).

**(b) Imported names removed or re-signed.** Misses 39 of 40 broken. The reason is the shape of the code: 104 modules export a class and a function that makes it, and users call methods on the object they are handed. A removed word inside an answer (`principal_claude`), a retired operation named as a word (`groupkeystate`) and a changed table are not imports at all. *To be safe* every use would have to be a named import of a function, with no objects handed in, no words, no wire. That is a rewrite of the product, not a rule.

**(c) Plus citations of changed public requirements.** Reaches 22 of 40. Citing is the sharpest single signal after removal: of 149 judged pairs where the user cites a changed requirement, 62 were affected (42%, against 10% overall), 22 broken, 20 adopted. *To be safe* every user would have to cite, by the provider's name and number, each public requirement it relies on, and the provider would have to change the requirement's text whenever the behaviour changes. Today citing is a habit, not complete; how complete was not measured.

**(d) Plus fixtures and non-code files.** Adds 2 broken users. "Names a changed non-code file" found no pair at all: the two changes to `agent-worker`'s connection file reached their users over a wire, which nothing in the user's files names.

**(e) The user's own tests fail.** Not computable here: it needs each user's tests run at 178 commits. What the record does show (judged from the written reasons, not by running anything): for 14 of the 40 broken users the verdict or the job names a test of the user that failed or would fail; and the provider `ai-accounts` wrote in its own requirement file, after it removed names on 4 Nov, "ai-runs 137/145 tests red, ai-use about 80, question-explorer 40/46". Of the five broken users that rule g1 misses, three broke in a test of their own. **Does it count as one of the three tests? Both readings, not decided here:**
  - *It is module tests.* The words of 13 Nov say users' jobs "are updated as needed and tested", and that "tests run only when there is a fully informed reason to run them". The user's module tests are the user's own; a provider's merged change to something the user uses is an informed reason to run them. No new kind of test is created.
  - *It is an extra run.* The three tests are "each job's own module tests", the notice, and the walk, and the notice "is a notification, not a test". Running a module's tests when that module has no job, because another module merged, is a run the definition does not list. Done for every user at every merge it is the full regression that "the internal walk replaces".
  - A narrower form avoids the question: a module with work of its own gets a job anyway, and that job's module tests run against the provider as merged. That was 64% of the notified pairs here.

**(f) No notice unless a public requirement or its test changed.** Misses 3 broken users, and they are three of the five of section 1: `agent-drafts` 570, `agent-steps` 185, `ai-accounts` 316. Saves only 18%, because 151 of 178 changes alter a public requirement or a test that names one. Without counting tests it saves 49% and misses 12 of 40. *To be safe* the provider's job would have to (1) hold every behaviour another module relies on as a numbered public requirement with a test titled by that number, in the standard form; (2) change that requirement's text, or strike its mark, in the same change as the behaviour; (3) write a fix that changes what callers see onto the public requirement, not only as a found flaw. And it would still tell every user, used part or not.

**(g1) The user holds, by name, something that changed.** A user is told when at least one of these is true of its own files as they stood before the change:
  1. it imports a name that was removed or whose call changed, or imports the class, or calls a method of that name (124 pairs; 12 broken);
  2. it imports, by name, exported data whose contents changed (112 pairs; 8 broken);
  3. it imports a file under the provider's tests that the change touched (89 pairs; 7 broken);
  4. its requirements, tests or source comments cite a public requirement of the provider that changed (182 pairs; 22 broken);
  5. it uses, as a quoted word, a key or a property, a word of 8 or more letters that the provider's code used before the change and uses nowhere after it (109 pairs; 23 broken). This catches renamed fields and retired operations that no import shows.

  Sends 460 (17%). Misses 5 broken users: `ai-accounts` 124 to `signin-door` (the names it lost were removed from a third module's hand-on list), `ai-accounts` 316 to `store-assembly` (section 1.4), `ai-catalogue` 484 to `store-assembly` (its tests signed the old seed), `answers` 103 to `agent-worker` (a copied list held equal by a test), `jurisdictions` 40 to `instance-setup` (a data file gained entries). *To be safe* it needs what (c) needs, and it would still miss a break that travels through changed data or a third module. Parts 2 and 5 are pattern matches and will mislead on other code.

**Per change:** under g1 nobody is told on 68 of the 178 changes. On the record, 155 of the 178 changes broke no user.

### Who had work anyway (measured, `idle.py`)

| | Notified pairs | Broken among them | Told by g1 | Broken reached by g1 |
| --- | --- | --- | --- | --- |
| User had an unmet requirement of its own or a job open | 1,735 | 33 | 336 | 30 |
| User had neither (the notice alone would start its job) | 972 | 7 | 124 | 5 |

Under Process4 a module with work gets a job without any notice. So the jobs that a notice alone would start are the 972; under g1 they are 124. The two broken users missed there are `signin-door` and `store-assembly` above. The week measured was one in which most modules had work; in a quieter round the second row would be larger.

---

## 5. What a sharper definition could look like

Two candidates, in plain words. Neither adds a test or a check. Each is a rule for who is told, computed from the change and from the user's own files, plus a rule for how jobs write requirements.

### Candidate one: "something this module holds was taken away or changed"

> A change requires a user module to be updated when the user's own files name something that the change removed, renamed, changed the calling of, changed the contents of, or reworded: a name it imports or a method it calls; a table it imports; a test helper it imports; a word of the provider's it writes out; a public requirement it cites, if that requirement was reworded, removed or retired. Nothing else requires an update. A requirement that only became *met* is not a change of promise; a user that was waiting for it has its own "not yet met" line, and that line is what makes its job run.

- *Cost on this record (measured against judged classes):* 387 notifications in place of 2,707 (rule k1).
- *Missed:* 10 of the 40 broken users; 17 of the 34 adopters are reached without being aimed at.
- *Unproven:* that a user's own "not yet met" line brings its job at the right time (17 of 34 adopters had such a line naming the provider); everything about running it.

### Candidate two: "anything this module names changed"

> As candidate one, and also when a public requirement the user cites changed in any way, including becoming met.

- *Cost:* 460 notifications (rule g1). With "or the user has its own unmet requirement naming the provider", 737.
- *Missed:* 5 of the 40 broken users (3 with the addition). Three of the five had work of their own at the time; two did not (`signin-door`, `store-assembly`) and were found only because Process3 told everyone.
- *Unproven:* the same, and that jobs can be held to citing what they rely on.

### What both need from jobs (rules for writing requirements and tests, not checks)

1. **A module's requirement file says what it relies on.** For each provider, the numbers of the public requirements it depends on, written in one agreed form. This is what makes "who is told" computable. On the record, citing is the best signal there is after removal.
2. **A provider changes a public requirement's text, or its mark, in the same change as the behaviour.** Three of the five misses are this rule broken.
3. **A fix that changes what callers see is written on the public requirement,** not only as a found flaw.
4. **A test is titled by the requirement number in one standard form.** Three modules do not.
5. **A name is retired by removing it,** never by leaving it in place with a different meaning. Removal is what the mechanical rules see best, and it is the kind that broke users (22 of 27).

### A structural point from the record

- 510 notifications (19%) went to a user none of whose files imports the provider. Process4's module tests already include "a check that the module's declared uses match its imports". If a declared use with no import is removed from the list, or is required to say what it rests on (a wire connection, an object handed in, a word), those notifications either stop or become explainable. 8 of the 241 affected verdicts, 1 of them broken, are in this group, so the uses cannot simply be dropped.
- The module list itself is an interface. `member-roster` 286 and 446 were not caused by member-roster's job; the module list changed. An edit to that list by ARCH reaches seven modules that run things in its order, and no job's change shows it.

### What is measured, estimated, judged and unproven

- **Measured:** every count of notifications, signals, follow-up merges, files changed, imports, unmet marks and open jobs; each rule's notification count.
- **Estimated:** the reasons behind the 2,101 "not affected" (a sample of 120).
- **Judged (by me, one reader, knowing the outcome):** kind and outcome of each of the 241; therefore "broken reached" and "adopted reached" for every rule. The verdicts themselves are AI workers' judgments. For 26 there is no follow-up to check against.
- **Unproven:** every rule here as a working process. None was run. No rule was tried on pairs Process3 never judged (365 notified, 167 declared and never told) or on modules that depend without declaring it.

---

## 6. What could not be determined

1. **Rule (e).** Whether each user's existing tests would have failed on each provider change. Needs 178 commits checked out and up to 2,707 test runs; the agent-worker suite alone takes six minutes.
2. **Whether broken users exist outside the 241.** The 2,101 "not affected" verdicts were not re-examined for wrong "not affected"; 532 declared pairs were never judged; the replay found three such users on `membership` 1030.
3. **How complete citing is.** How many real dependences a user's files cite by number today.
4. **Whether the figures hold in an ordinary week.** The record is six days dominated by one renaming (the AI-account work); 17 of the 40 broken users come from two changes.
5. **The 26 with no follow-up.** Classed by reading only.
6. **Noise in the word rule.** The "dropped word" signal is a pattern over text; its false alarms on this record are counted (58 of 109 judged pairs not affected), its behaviour on other code is not known.

---

## Files

| File | What it is |
| --- | --- |
| `nlib.py` | helpers; imports the replay's `lib.py` and `extract.py` read-only |
| `followup.py` | each affected verdict's follow-up merges and what they changed → `data/followup.json` |
| `jobsaid.py` | what the user's job wrote about each notice → `data/jobsaid.json` |
| `outcome.py` | mechanical outcome classes → `data/outcome.json`, `scratch/near_hunks.txt` |
| `judged241.txt` | my class for each of the 241 (kind, outcome) |
| `sample_not_affected.py`, `judged_sample.txt` | the seeded sample of 120 and my class for each |
| `signals.py` (about 5 minutes) | the mechanical signals for all 2,707 pairs → `data/signals.json` |
| `srcimp.py`, `jobopen.py` | source or test imports; job open at the provider's merge |
| `rules.py` | the rule table → `data/rules.json`, `data/rules_pairs.json` |
| `signal_table.py`, `idle.py` | per-signal scores, cross tables, users with and without work → `data/tables.json`, `data/idle.json` |
| `data/classified241.tsv` | one row per affected verdict: classes, follow-up, which rules reach it, the verdict's reason |
| `show5.py`, `dump241.py` | print the record for reading |

Order: `followup.py`, `jobsaid.py`, `outcome.py`, `sample_not_affected.py`, `signals.py`, `srcimp.py`, `jobopen.py`, `rules.py`, `signal_table.py`, `idle.py`. The replay's own data in `/home/user/work/replay/data/` must be present.

Commits: records at `origin/process-state` `c4c252913b`; code at `origin/tranche` `e7ec72e093`; each change read as its merge against its first parent (listed in the replay's `appendix_commits.md`).


# [file] audit2_common.md

# Common brief for the second full audit of the Process4 definition (14 Nov 2026)

The owner, Bob, asked for this in his own words: "perhaps this is a good time to repeat the full audit of process4 as currently defined, including a counter-argument audit. This will give a clearer look at that shape the design is in and provide a map where the focus is still needed."

## What is audited
The fifth draft: /home/user/handoff/process4_definition_v5.md. Read it in full, first. It supersedes all earlier drafts.

## Background
Bob is the owner. In this role he is not a programmer: he defines the product and the process in plain words; Claude decides what is technical and reports it. Process3 was his earlier process: Claude Code cloud sessions, in Auto mode, built his product Civicsmith in a GitHub repository unattended. It failed because sessions kept adding checks, gates, reviews and record-keeping to the process until product work stopped. Process4 is its successor.

## What outranks what
1. Bob's own typed words of 14 Nov 2026, verbatim in /home/user/work/bob_words_14nov_b.md and /home/user/work/bob_words_14nov_c.md (read both in full; the second holds three messages, the last answering three readings on the tranche and release). These outrank everything.
2. The session's record of his decisions of 13-14 Nov (quoted in the fifth draft's section B; source text /home/user/work/assessment_doc.txt, near the top).
3. His requirement documents: /home/user/handoff/foundations.md, /home/user/handoff/ledger_lines.md (with his stored answers in /home/user/work/ledger_store/), /home/user/handoff/process4_disposition.tsv (288 rows).
Do not attack his typed words as decisions. Attack whether the definition honours them, whether they can work as written, and what they leave undefined. Where two of his own statements conflict, report the conflict; do not choose.

## His fixed points now
- Three tests, and no others, ever: module tests, the internal walk, the external walk. The notification to a user module is not a test.
- "The 3 tests provide an appropriate opportunity to identify and debug as necessary every flaw and to test everything that needs to work in a released product. There is no need to any any more tests. PERIOD!"
- A tranche ends only when an external walk of a development deployment completes without flaws; flaws go to the next round. A tranche can end without an AI-enabled run. Installer and website are outside the tranche and wait for a clean development release walk.
- A job writes its own tests. A job for module A is not allowed to change module B; the only other way a module is edited is a mechanical edit.
- The process is changed only in a separate lane, PROCESS, that he interacts with; he chooses among options; a product moves to an updated process only with his prior approval.
- No layers; one total order of modules; eight job slots across the account; no review by a fresh reviewer; permission management preserved from Process3.
- The notification rule (what counts as an interface change, who is told, what a told module does) is under study in a separate session; audit what the draft says about it but do not re-derive the study (/home/user/work/notice_study/study.md holds the groundwork).

## Hard rule for remedies
You may NOT propose a new test, gate, review, check, audit, monitoring job or approval step by a session as the answer to anything. A remedy may be: removing something; a structural choice; a permission or setting; a change of wording; restoring something from his documents; an honest statement that a risk is accepted and unproven; a one-off trial before the process is in force. If the only remedy you can see is a new check, say exactly that and leave the finding unanswered.

## Evidence
- Folder /home/user/handoff/: the post-mortem and design evidence (review.txt, verify_numbers.md, causal_forensics.md, change_sample.md, canon_analysis.md, product_side.md, interface_and_cycle.md, no_layers_width.md, roles_root_coordinator.md, permissions_inventory.md, levers_github_cloudflare_product.md, DECISIONS.md).
- Folder /home/user/work/: the first audit round on the second draft (attack_corruption.md, attack_feasibility.md, audit_foundations.md, audit_ledger.md), its register (/home/user/handoff/process4_counterarguments.md, 87 entries with answers, and /home/user/work/register_notes.md), the memo of answers (decisions_memo_d3.md), drafting notes (v3_notes.md, v4_notes.md, v5_notes.md), enforcement_levers.md, k_evidence.md, trial_plan_facts.md, replay/results.md, notice_study/study.md.
- Read-only clones: /home/user/repos/process3, /home/user/repos/civicsmith-copy (product; branches origin/tranche and origin/process-state), /home/user/repos/process3-probes. Never commit, push, fetch into or check out in them. Start no cloud sessions.
Use grep and read passages; do not read every file end to end.

## How to report
Write your full findings to the file named in your task. For every finding:
 1. The counter-argument or fault, in one to three plain sentences Bob could read (no ids, codes or file names in that sentence).
 2. The sentence(s) of the fifth draft concerned (quoted), and the source it is measured against.
 3. What it rests on: measured in the record (cite) / a platform document / reasoning only. Keep apart.
 4. How bad: stops the first hour / stops a tranche / silently spoils the result / costs Bob time / misleads Bob / minor.
 5. Status against the first round: NEW; or RAISED BEFORE AND STILL OPEN (name the register entry); or RAISED BEFORE AND NOW ANSWERED (say by what — his words, a decision, a correction — and whether the answer really meets it).
 6. Your best answer within the hard rule, or "no answer found".
 7. Whose it is: Bob's to decide (say why it is not technical) / Claude's to decide / needs a trial / needs the build.
Rank worst first. Do not pad. Do not soften. At the end give a one-page MAP: the areas of the design (roles and sessions; flow of a job; rounds, walks and tranche end; release; notification; PROCESS and process change; permissions and starting; state and waking; recovery; reports; what is unbuilt; what is unproven), each rated solid / stated but unproven / thin / contradictory / missing, with one line of why.


# [file] audit2_notes.md

# Notes for /home/user/handoff/process4_audit2.md (recording worker, 14 Nov 2026)

Sources: F = /home/user/work/audit2_feasibility.md ("the run audit", 22 findings); C = /home/user/work/audit2_corruption.md ("the drift audit", 12 findings + appendices A, B, C); R = /home/user/work/audit2_requirements.md ("the requirements audit", 17 findings + sections 3 to 7); Reg n = entry n of /home/user/handoff/process4_counterarguments.md. Draft = /home/user/handoff/process4_definition_v5.md. Bob's words checked against /home/user/work/bob_words_14nov_b.md and bob_words_14nov_c.md. No repository was touched; only /home/user/handoff/DECISIONS.md, foundations.md, ledger_lines.md, review.txt and permissions_inventory.md were grepped to verify quotations.

Size: the document is about 39.7 KB, over the 30 KB aim. Section 3 (14 questions, each with exact dated quotations and options) is about 19 KB. Three rewrites did not bring it lower without dropping required items.

## 1. Mapping: section 1 (short version)

| Item | Source |
| --- | --- |
| "better, not ready; stops in four places ... five more" | F verdict |
| Closed since first round | C verdict (four bullets) |
| Best founded: life of a job; about 700 merges | F walk-through "A job"; F "Probed and not found broken" |
| 1 End of a tranche | F5, F6, F10; C1, C3; R3 |
| 2 PROCESS rule held by words | C2 |
| 3 First hour | F1, F2, F3 |
| 4 Five steps with nobody named | F verdict (last paragraph); F7, F9, F6, F16, F12 |
| 5 Release | C5; F16; R10 |
| 6 288 lines | R section 1 counts; R1, R2, R6 |
| 7 51 text rules, six held | C appendix A |

## 2. Mapping: section 2 (map)

Each row = the three MAP tables (F MAP, C MAP, R section 7). States are copied from them; nothing averaged. R has no row for "the account of the 288 lines" in F or C; F and C have no such row.

| Row | F MAP | C MAP | R map |
| --- | --- | --- | --- |
| Roles and sessions | Stated but unproven | Stated but unproven | Stated but unproven |
| Life of a job | Stated but unproven; thin at the edges | Stated but unproven | Solid |
| Rounds, walks, tranche end | Contradictory and thin | Thin, and contradictory in one place | Stated but unproven |
| Release | Missing | Contradictory | Thin |
| Notification | Missing by decision | Missing by design | Missing, by his decision |
| PROCESS | Thin | Thin | Contradictory |
| Permissions and starting | Contradictory | Stated but unproven | Stated but unproven |
| State and waking | Thin | Thin | Contradictory |
| Recovery | Thin | Stated but unproven | Thin |
| Reports | Solid enough | Thin | Solid |
| Unbuilt | Stated, and understated | Solid as a statement | Stated but unproven |
| Unproven | Stated, with a weak trial plan | Solid as a statement, thin as a plan | Solid as a list |
| Line-by-line account | (none) | (none) | Contradictory |

"Five kinds of long-lived session; the four Process3 had were replaced every few hours": C10 (PROCESS is new, so only four have a record).

## 3. Mapping: section 3 (questions that are Bob's)

| Q | Subject | Sources | "Auditor's suggestion" taken from |
| --- | --- | --- | --- |
| 1 | What the walks are measured against; may sessions change it; meaning of "without flaws" | F5; C1; R3; R conflict 13 | C1 best answer (restore files; wording for "without flaws") |
| 2 | Tranche size; a tranche that will not come clean | F10; C3; R addition 4, R conflict 7; Reg 1 | none (F10 says size is the only lever; no size recommended) |
| 3 | Setting behind the PROCESS rule; who moves the product | C2; C8 (his merge as approval); F9 (who carries out the move); Reg 2, 5, 13, 17 | C2 best answer |
| 4 | What a product session does while a process fault waits | C4; C9 row f; R conflict 4 | none (C4 puts both; I gave no recommendation) |
| 5 | How new work enters a module | F7 | none (F7 gives two readings) |
| 6 | Which governs | R1; Reg 69 | R1 best answer (two alternatives) |
| 7 | A further walk for a release | C5; R10; F16; C3 (journeys that begin at the installer); R conflicts 8, 9 | none; C5 says "Do not choose" |
| 8 | What "no more tests" bounds | C6; C9 row a | none for the question; (C6's removal of the 212 files is in section 4) |
| 9 | Protection of approvals; the stop at each edit | C12; R8; F11; C9 row c; R7 (part); Reg 28, 37, 43 | F11 and C9c/C10 (remove the comparison); C12/R8 (the GitHub setting, with its caveat) |
| 10 | Built files | R4; C7; C9 row b | C7 best answer |
| 11 | Lines ended without proposals, in six groups | R6 (33 lines; grouping per its best answer); R7 (group 3, and the three uses of "three tests and no others"); R9 (group 5); R11 and C9 row e (group 6); C9 row d (groups 1, 3); R conflict 2 (the three statements); Reg 78, 20, 50, 14, 32 | R11 best answer (group 6) |
| 12 | The watcher | F14; C10; C9 row h; R13; Reg 15 | none; C10 says give the facts and let him choose |
| 13 | Who runs the walks (his hint against a kept Ledger line) | F6; R conflict 10 | F6 best answer |
| 14a | Eight slots as a cloud-environment setting | F walk-through ("The eight slots across the account"); R conflict 11 | (structural option stated by F) |
| 14b | Marking instructions; how PROCESS puts options | C10; C8 | C10, C8 best answers |
| 14c | "Nothing the model says is evidence" | R17 | none |
| 14d | Cost of trial and conversion | F2 item 7; F17 item 7 | none |
| closing line | Notification | F4 | none |

Ledger/Foundations quotations verified by grep: "A job never commits a generated artifact." (ledger_lines.md 635); "No step runs longer than the in-session background limit; anything that can is a CI workflow." (ledger_lines.md 45); "The classifier is defence in depth, never the policy." (ledger_lines.md 34); "Nothing the model says is evidence" (foundations.md 42); "Nothing here is in force until it has run on a real tranche with the two health metrics measured." (as quoted in the draft section O and R6); "A process flaw found mid-tranche gets one line in a log and a workaround." (review.txt 377); the 9 Nov sentence (DECISIONS.md 125, under BD-R5 "(Bob, 9 Nov)", "Bob, the same day").

Attribution cautions I applied:
- The 9 Nov sentence is given "as Process3's decision record quotes you", not as typed words.
- "Process3's permission management is preserved." is given as the session's record of 13 Nov.
- The approvals sentence "Their design documents are claude.ai artifacts, not repository files." is given as text he committed, with "the audits give no date, and do not show who drafted the sentence". F5 calls it "Bob's own approvals"; C4 cites the post-mortem that "Most of those edits [to his approvals] were drafted by the coordinator". The date of that sentence was not in any audit report.
- The folder note "(Bob, 5 Nov 2026)" is a session-written page citing him; R3 says "quoting you on 5 Nov". I did not quote it as his.
- Group 6 of question 11 (the 29 modules): R11 says Bob's for the product side, Claude's for the route; C9 row e and C appendix C say Bob's. Put to him.
- R5 (status command): Claude's if restored, Bob's only if ten lines end. Placed in section 4 with that condition.
- C9 row i (GitHub limits) is Claude's to correct; placed in section 4, not in question 11.

## 4. Mapping: section 4 (Claude's work)

Wrong or stale statements:
| Item | Source |
| --- | --- |
| ROOT's start aimed at the wrong fault | F1 |
| "Checked by Claude" false | F5; R3 (draft's own notes: written on another session's word); R attribution 4 |
| Four short answers written longer | R14 (a to d); R attribution 2, 3, 5, 6 |
| Coordinator's note quoted as "your ledger note" | R13 |
| Two endings on a session's sentence | R15 |
| Out of date; fifth message missing | R16; F22 rows a, b |
| "Works round it" not his | C4; C9 row f |
| Record does hold the AI sentence | F16; C5 |
| "Same as in process3" not looked up | C9 row i; F19 |
| 21 sessions, 20 replacements | C10 |
| Two things already in the record | F9; F "Probed and not found broken" |
| Sentences that cannot both hold | F22 rows d, e, f, g, i, j; F11 |
| Mechanical edit's moment | F8 |
| Notified job that changes nothing | F22 row h; C appendix C |
| Alarm for lack of progress | R12; C4 |
| Four unmarked additions | R section 3, additions 3, 4, 11, 13 |
| 53 kept lines stated nowhere | R2 |
| Ten smaller attribution faults | R section 5, items 9 to 17 and 19 (5 to 8 and 18 are counted under the items above) |
| Seven smaller things, no decider named | R17 (eight bullets; the F-SHAPE-3 bullet went to question 14) |

Named in a sentence only: shared facts F15, C10, R addition 5; tool and role texts F3; conversion order F2; PROCESS after start F9, F22 row c, C8; who deploys/prepares F6, F16; tool's list F19, R5; archiving F12; dead job after passing F13; account switch F18; needed use or service F7, changes that only pass together C7; waiting sessions C4, resume R17, development release R10; round-end telling C11; effort F22 row l; uses check F20; Process3 leftovers F21.

Missing from the lists: F "Relied on by the draft and missing from all three" (12 items); C MAP rows "What is unbuilt" and "What is unproven", C1 (honest statement), C6 (212 files); R map rows "What is unbuilt", "What is unproven".

Not carried into the document as separate items (judged too small, or covered by another item): F22 row k (covered by question 12); C appendix B (ten causes: counts only); C appendix C rows on the default branch being public-facing, deploy token in every session, cost reporting; R additions 1, 2, 9, 10, 12 (declared additions); R17 PLN-4.

## 5. Mapping: sections 5 and 6

Section 5: "Before any trial can run" = F "The smallest set that must exist before any trial can run", F17. Trials: 1 = F6; 2 = C3 (a), (b); 3 = F1; 4 = C2, C12, R8; 5 = F17, C4 (count the stops); 6 = F12, F14, F17, F18; 7 = F16, F17, F8. First real tranche = draft section O, F10.

Section 6 (no answer found): 1 = F10, Reg 1; 2 = C1; 3 = C3; 4 = C6; 5 = C7; 6 = C8; 7 = C12. Closing line = draft section O, F15, Reg 9 (F15 offers a partial structural answer; C gives none).
Not listed as "no answer found" although the first round did: Reg 3 (F2 now gives a written order with settings), Reg 8 (F13 and C10 give wording and a structural choice), Reg 11 (F13 wording).

## 6. Section 7 counts: how made

Register entries named by any of the three audits (56): 1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 13, 14, 15, 16, 17, 18, 20, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 43, 44, 47, 49, 50, 51, 52, 53, 54, 59, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 76, 77, 78, 87. Not named (31): 10, 12, 19, 21 to 24, 40, 41, 42, 45, 46, 48, 55 to 58, 60, 61, 62, 73, 74, 75, 79 to 86.

My classification, from the auditors' status lines:
- Answered (6): 29 (F16: merge to main answered well enough, unproven), 30 (F13), 33 (C4, F9: route), 36 (F20), 39 (R10, C verdict), 52 (C11).
- Answered in part, or answer found not to meet it (16): 4 (C verdict answered; C5 release path open), 16 (R10 answered by his three answers; C5 still open), 25 (F2, F3, F19), 26 (F1: answer rests on a misreading), 27 (F15: a sentence only), 31 (F table: yes for a flaw only; C7 lists it still open), 34 (F13, F table), 37 (R8: answer does not meet the kept line; C12 answered in part), 44 (F9), 53 (F8), 54 (F7), 59 (R17), 63 (R17), 65, 71, 72 (F17 "partly raised before").
- Still open (31): 1, 2, 3, 5, 6, 7, 8, 9, 11, 13, 14, 17, 18, 20, 28, 32, 35, 38, 43, 47, 50, 64, 66, 67, 68, 69, 70, 76, 77, 78, 87.
- Reopened (1): 15.
- Named with no verdict (2): 49, 51 (C appendix C only).
Judgment calls: 6 is "still open, answered in part" in C7, counted still open; 31 could be counted still open (C7); 4 and 16 are rated differently by different auditors. A different reader could move three or four entries between "in part" and "still open".

Findings this round (51 = 22 + 12 + 17):
- Wholly new (14): F3, F5, F7, F19, F21, F22; C4, C8, C11; R3, R9, R12, R14, R16.
- Raised before with new parts (18): F6, F8, F9, F16, F17, F20; C1, C2, C3, C5, C6, C7, C9, C10; R7, R10, R13, R17.
- Raised before, nothing new (19): F1, F2, F4, F10, F11, F12, F13, F14, F15, F18; C12; R1, R2, R4, R5, R6, R8, R11, R15. (R4 and R5 were raised in the third-draft appendix, not in the register.)
