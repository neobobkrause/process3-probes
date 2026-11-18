# [file] study.md (continued)


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


# [file] no_layers_width.md

# Scheduling from the total order and uses graph alone: figures for the work that remains

13 Nov 2026. Source: `neobobkrause/civicsmith-copy` at `origin/tranche` (`build/modules.json`, `build/requirements/*.md`), read-only, and PD-25 in `neobobkrause/process3` `DECISIONS.md` at `origin/tranche`. Scripts: `/tmp/claude-0/-home-user/5fb00928-6c32-53d3-a000-4e1f643cb17f/scratchpad/audit_d/remaining.py` and `dag.py`.

## Summary

- **65 of 220 modules still carry an unmet mark** (466 marks). 43 of them carry a T53 mark (362 marks).
- **Under PD-25's rule the remaining work is narrow:** 21 waves for the 65 modules, 3 ready at once at the median, 7 at most. A bound above 7 never binds.
- **With the three order-breaking uses left in, 27 of the 65 can never start,** because `agent-runner`, `agent-worker` and `ai-gate` sit on a cycle and have work.
- **Starting earliest-first up to a bound gets the width and gives up the order:** at a bound of 24, 50 of the 65 modules run beside an upstream module that also has work.
- **A notification touches far fewer modules this round than on the whole map:** median 3 direct users with work, maximum 19.
- **Layers add no ordering.** No pair of modules is ordered by layer and not by list position.

## How marks were counted

The convention is in `build/requirements/README.md`, rule 5: "A requirement main does not yet meet is marked right after it: `*(not yet met: <row or entry>)*`." There is one requirement file per module (220 files for 220 modules, plus the README), so a file's marks are its module's marks.

Counted with `git grep -c -E '\*\(not yet met:'` over `build/requirements` at `origin/tranche`, README excluded.

| Count | Marks | Modules |
| --- | --- | --- |
| Every unmet mark | 466 | 65 |
| T53 marks only (`*(not yet met: T53`) | 362 | 43 |
| Older tranche marks (T52 32, T50 6, T49 3, T47 2, N345 2) | 45 | |
| Other entries (base-red 16, coordinator and BOB rulings, lanes, walk, job references) | 59 | |
| Marks placed on an `R` id | 152 | |
| Marks placed on an `F` (found) id | 57 | |

- The product-side analysis gave 357 T53 marks and 51 found marks. This count gives 362 and 57. The five and six extra were not reconciled; 338 T53 marks are the bare `*(not yet met: T53)*` and 24 carry trailing text such as "waits on ...".
- `origin/layer/14` has the same 362 T53 marks and four fewer marks overall (462).
- A mark is not the same as startable work. Some marks say they wait on a decision or on another module. PD-25 also counts "an owed reopen or an outstanding reschedule" as work and "BLOCKED" as settled; neither can be read from the tree. The figures below treat every module with a mark as having work.

**Distribution of marks per module.**

| | All unmet marks (65 modules) | T53 only (43 modules) |
| --- | --- | --- |
| Median, mean, maximum | 2, 7.2, 57 | 3, 8.4, 57 |
| Modules with 1 mark | 21 | 11 |
| 2 to 4 | 23 | 16 |
| 5 to 9 | 5 | 3 |
| 10 to 19 | 9 | 7 |
| 20 or more | 7 | 6 |

**By layer (modules with work, marks), all unmet marks.** Layer 1: 3, 3. Layer 2: 4, 7. Layer 3: 2, 3. Layer 4: 2, 3. Layer 5: 4, 9. Layer 6: 10, 66. Layer 7: 1, 1. Layer 8: 5, 16. Layer 9: 0, 0. Layer 10: 2, 2. Layer 11: 32, 356. Three quarters of the marks are in layer 11.

**Largest.** `screens-document` 57, `agent-worker` 41, `screens-settings` 32, `journey-check` 31, `screens-investigate` 27, `screens-intake` 25, `screens-intake-rounds` 21, `control-plane` 17, `screens-publish` 15, `store-request` 15, `interface-shell-t53` 14, `screens-ai` 14.

**The 65 modules, in the total order, with marks.** runtime-limits 1, bundler 1, file-scanner 1, jurisdictions-c 3, ai-catalogue 2, ai-accounts 1, credentials 1, file-safety 2, mail-door 1, member-upload 2, reading-pipeline 1, events 1, local-facts 1, bias 1, registers 6, inquiry 2, citation 2, contradiction 4, run-rules 1, agent-model 2, ai-use 1, ai-runs 2, agent-runner 7, agent-worker 41, ai-gate 4, investigation 1, case-grammar 2, public-read 2, ratification 2, case-disclosures 8, case-inputs 2, following 1, scheduler 1, op-grades 3, affordances 1, machinery-producers 1, queue-producers 2, notice-producers 3, queue 1, surface-declarations 7, admission 2, signin-door 2, store-jobs 1, store-request 15, interface-shell-t53 14, screens-settings 32, screens-ai 14, screens-intake 25, screens-intake-rounds 21, screens-daily 10, screens-inquiry 14, screens-document 57, screens-document-beta 13, screens-investigate 27, screens-publish 15, screens-public 2, screens-action 3, screens-plan 1, control-plane 17, plane 11, installer-steps 5, installer 2, installer-places 3, stewards 1, journey-check 31.

## The rule used

PD-25 (Bob, 9 Nov): "A module is ready when it has an unmet mark, an owed reopen or an outstanding reschedule, has no open job, and every module upstream of it in the uses graph is settled (no open job, no unmet mark, no outstanding reschedule; BLOCKED counts as settled)."

"Upstream" is taken as transitive: every module reachable through uses, including through modules that have no work. Each job is one time unit. The three order-breaking uses are `hypotheses` → `steps`, `agent-runner` → `ai-gate` and `agent-drafts` → `agent-worker`. The last two close a cycle through `agent-runner`, `agent-drafts`, `agent-worker` and `ai-gate`. PD-25 itself allows for mutual use: "Modules that use each other land in map order".

## 2. Waves under PD-25, modules with work only

| | Modules with work | Never start | Waves | Ready at once: median, mean, max | Waves of width 1 | Wave sizes |
| --- | --- | --- | --- | --- | --- | --- |
| All marks, (a) three uses kept | 65 | **27** | 16 for the 38 that start | 2, 2.4, 4 | 3 | 3, 2, 2, 4, 4, 2, 2, 3, 2, 3, 1, 2, 3, 3, 1, 1 |
| All marks, (b) three uses removed | 65 | 0 | **21** | **3, 3.1, 7** | 2 | 3, 2, 2, 4, 4, 2, 3, 3, 2, 4, 2, 3, 4, 5, 2, 2, 1, 6, 7, 3, 1 |
| T53 only, (a) kept | 43 | **23** | 10 for the 20 that start | 2, 2.0, 4 | 4 | 2, 4, 3, 2, 2, 1, 3, 1, 1, 1 |
| T53 only, (b) removed | 43 | 0 | **13** | **3, 3.3, 7** | 1 | 2, 4, 3, 3, 2, 2, 4, 3, 2, 7, 7, 3, 1 |

- **Why 27 never start in (a).** `agent-runner`, `agent-worker` and `ai-gate` each have unmet marks and each is upstream of itself through the cycle, so none is ever settled. The other 24 are downstream of them: `op-grades`, `affordances`, `queue`, `surface-declarations`, `admission`, `signin-door`, `store-request`, `interface-shell-t53`, all thirteen `screens-*` modules, `control-plane`, `plane` and `journey-check`. Those 27 hold 390 of the 466 marks.
- **With a bound, in (b).** All marks: 22 rounds at a bound of 6, 21 at 12 or 24. T53 only: 14 rounds at 6, 13 at 12 or 24. A bound of 12 or more changes nothing.
- **Why it stays narrow.** A module with work has a median of 25 upstream modules that also have work (maximum 52). Only 3 of the 65 have none.
- **Against the whole map.** The earlier figure was 65 waves for 220 modules at a mean of 3.4. The remaining work is a third as long and no wider.

## 3. The looser rule: earliest-first up to a bound N

Modules with work are taken in list order, N at a time, without waiting for upstream modules with work. With equal job durations that is batches of N. A module is exposed when a module upstream of it that also has work is in its own batch, so an interface change can land under it.

**All unmet marks, 65 modules.**

| N | Batches | Run beside a transitive upstream module with work | Of those, beside a direct one |
| --- | --- | --- | --- |
| 6 | 11 | 40 (62%) | 32 |
| 12 | 6 | 43 (66%) | 37 |
| 24 | 3 | 50 (77%) | 43 |

**T53 marks only, 43 modules.**

| N | Batches | Run beside a transitive upstream module with work | Of those, beside a direct one |
| --- | --- | --- | --- |
| 6 | 8 | 24 (56%) | 19 |
| 12 | 4 | 32 (74%) | 25 |
| 24 | 2 | 35 (81%) | 31 |

- These are with the three order-breaking uses removed. With them kept, the all-marks counts are the same, and two modules also run a batch ahead of a module they depend on: `agent-runner` uses `ai-gate` directly, and `agent-worker` reaches it through the cycle.
- The loose rule cuts 21 waves to 3 batches at N = 24, and puts three quarters of the modules beside something they depend on.

## 4. Users that also have work

What a notification from one module with work would touch in this round.

| | Direct users with work: median, mean, max | Transitive users with work: median, mean, max | Same modules, users in the whole map: direct median and max; transitive median and max |
| --- | --- | --- | --- |
| All marks (65) | 3, 4.3, 19 (`runtime-limits`) | 24, 23.9, 60 (`ai-catalogue`) | 6 and 58; 40 and 190 |
| T53 only (43) | 2, 2.6, 15 (`runtime-limits`) | 8, 13.6, 41 (`runtime-limits`) | 4 and 58; 11 and 190 |

- 12 of the 65 modules have no direct user with work, and 10 have no user with work at all.
- Whole-map figures for all 220 modules were 8 direct at the median and 213 at most. The modules with work are mostly late in the order, so they have fewer users than the map's foundations do.
- Under PD-25's rule every one of these users starts after its provider is settled, so the notice reaches a job that has not started. Under the loose rule the exposed counts in section 3 are the jobs it reaches mid-flight.

## 5. What the layer construct adds to scheduling

On this map the layers add no ordering that the list does not already give. The list order never steps down a layer, so every pair of modules in different layers is ordered the same way by list position: 0 of 20,473 cross-layer pairs are ordered by layer and not by position. No use points to a higher layer, which also follows from the order. What a layer adds to scheduling is a barrier: under "one layer at a time" a module waits for every module of the layers below, used or not. 4,907 of those 20,473 pairs (24%) have no uses path at all, and a module has a median of 18 lower-layer modules (158 at most) that it does not use even transitively. Among the 65 modules with work, 267 of 1,511 cross-layer pairs are barrier-only. The barrier costs width: with layers kept and order held inside each layer, the remaining work takes 32 waves; without layers, 21. Starting a whole layer at once takes 10 rounds (3, 4, 2, 2, 4, 10, 1, 5, 2 and 32 modules) and breaks the order inside each. What the layers do carry is not scheduling: each has a stated contract in `layers.md` (layer 1, for example, has "No access to the record"), and they are where the owner decided which modules carry product capability. That is a rule about where a module may be placed in the order, not about when its job runs. PD-25 already recorded the same conclusion in the owner's words: "Because modules are in a total order, perhaps holding jobs in upper layers until an earlier layer closes isn't necessary."

## Limits

- Equal job durations are assumed throughout. Real jobs varied (26 to 36 minutes median from start to merge on good days).
- Marks were counted by pattern, not by reading each requirement. The T53 total differs from the product-side analysis by five.
- Owed reopens, outstanding reschedules and BLOCKED jobs were not read; the state branch and job branches were not consulted.
- The map changed 40 times in the week of Process3. These figures hold for the tranche tip only.

# Follow-up: the cycle, and a rule based on public marks

Added 13 Nov 2026. Same source and rules. Script for part B: `/tmp/claude-0/-home-user/5fb00928-6c32-53d3-a000-4e1f643cb17f/scratchpad/audit_d/public_rule.py`.

- **The cycle is two declared uses, both added on 4 Nov (PST) to satisfy the imports check.** Each was merged with "No review" as a map-only change.
- **392 of the 466 unmet marks are in the Public part.** 44 of the 65 modules have a public mark; 21 do not.
- **The public-marks rule takes the remaining work from 21 waves to 12** and from 3.1 to about 5 slots in use out of 8. It fills all 8 slots in 2 of 13 rounds.
- **Neither rule fills 8 slots.** Filling them means the loose rule of section 3.

## A. The cycle

Positions are 1-based places in the total order. All six modules are in layer 6.

| Module | Position | Paths |
| --- | --- | --- |
| hypotheses | 96 | `bio-plane/src/hypotheses/` |
| steps | 97 | `bio-plane/src/steps/` |
| agent-runner | 115 | `agent-runner/` |
| agent-drafts | 116 | three files inside `agent-worker/src/`: `draft.mjs`, `action-drafts.mjs`, `untested.mjs` |
| agent-worker | 117 | `agent-worker/` |
| ai-gate | 118 | `ai-gate/src/` |

**Every declared use among the four.**

| Edge | Direction | What is behind it |
| --- | --- | --- |
| agent-runner (115) uses ai-gate (118) | **Later** | `agent-runner/src/run.mjs` lines 7 to 10 import seventeen names from `ai-gate/src/index.mjs` |
| agent-drafts (116) uses agent-worker (117) | **Later** | `agent-worker/src/draft.mjs` line 42 imports from `./ask.mjs` and line 46 from `./signin.mjs`, both agent-worker's files |
| agent-worker (117) uses agent-drafts (116) | Earlier | `agent-worker/src/index.mjs` line 155 imports `handleDraft` from `./draft.mjs`; `ask.mjs` line 47 imports `untestedOf`, `UNTESTED_BAD` from `./untested.mjs` |
| agent-worker (117) uses agent-runner (115) | Earlier | No source import. A cross-script Durable Object binding, `RUNNER`, to agent-runner's class `AgentRunner` (`agent-worker/src/remote.mjs`) |
| ai-gate (118) uses agent-worker (117) | Earlier | `ai-gate/src/run.mjs` line 16 imports `PLANE_OPS` from `agent-worker/src/ops.mjs`; line 17 imports `admitRead`, `readTool` from `agent-worker/src/ask.mjs` |

There are two loops. agent-drafts and agent-worker use each other. agent-runner uses ai-gate, which uses agent-worker, which uses agent-runner. Together all four reach each other.

**The two later-pointing edges.**

1. **agent-runner takes the gate's whole toolkit from ai-gate.** The names are `checkDeclared`, `selectItems`, `verifyChallenge`, `meter`, `scanForSecrets`, `buildManifest`, `sealPayload`, `signBundle`, `PUBLIC_BANK`, `hasPrivate`, `itemById`, `planRun`, `scoreAnswerFree`, `suiteVersions`, `runPublicLine`, `encodeBundle`, `PARTS`. In plain words: the runner's gate run picks the test items, checks the issuer's challenge, meters the run, scans for secrets, and seals and signs the bundle, all with ai-gate's functions. Its tests also import `openSealed`, `parseBundle`, `verifyBundle` and `sha256Hex`.
   - Introduced by PR 401, `bob/agentrunner-uses`, merged 5 Nov 03:50Z (4 Nov 19:50 PST), commit `75c7705dfd`. Subject of the change: "modules: agent-runner uses ai-gate and ai-catalogue (its run.mjs imports them; coordinator ruling 3, ai-gate in its own directory)". Merge note: "No review: plain modules ... (imports gate on PR 394)".
   - It did not close a loop on that day, because PR 375 (`bob/aw-drop-runner`) had removed "agent-worker uses agent-runner" 77 minutes earlier. PR 612, `bob/agent-worker-uses-runner`, restored that use on 6 Nov 02:07Z, commit `0df62bf17b`: "agent-worker uses agent-runner (its F2 test imports agent-runner/test/helpers.mjs per the coordinator's 5 Nov 20:18 F2 ruling); unblocks PR 569". That closed the three-module loop. No such test import is in `agent-worker/test` at the tip.
2. **agent-drafts takes the worker's read controls and sign-in trace from agent-worker.** The names are `admitRead`, `readTool` and `ASK_DECLARED` from `ask.mjs`, and `doorTrace` from `signin.mjs`. In plain words: the drafting code uses the worker's check on which reads are allowed, its read tool, its declared limits on an ask, and the headers that trace a member's sign-in.
   - agent-drafts was split out of agent-worker by PR 113, `bob/split-agent-drafts`, on 4 Nov 04:04Z. The map's status line says it was split "by copy (no from) for size", which is the requirements size cap. From that moment agent-worker used agent-drafts.
   - The reverse use was added by PR 371, `bob/agentdrafts-uses`, merged 5 Nov 01:46Z (4 Nov 17:46 PST), commit `93c817d1a7`. Subject: "modules: agent-drafts uses agent-worker (its files import their agent-worker siblings; the imports check reads this file)". Merge note: "No review: modules file only". This was the first later-pointing edge in the map.

**hypotheses (96) uses steps (97).** Later-pointing, and not a loop: steps declares no use of hypotheses. There is no source import. `bio-plane/src/hypotheses/index.mjs` is handed a steps instance (`deps.steps` or `bindSteps`), with the comment "`steps` handed in, never imported", and calls its `registerRivalSource` and `stepsOfRival`. In plain words: hypotheses registers itself with steps so that a step can be opened from a rival explanation and the rival can list what its steps produced. One test, `bio-plane/test/m/hypotheses/rivals-legs.test.mjs` line 9, imports `stepsOf` from steps. Introduced by PR 1032, `bob/hypotheses-uses-steps`, merged 8 Nov 12:36Z, commit `e1bac7eda3`: "BOB: completion round 2 gains hypotheses uses steps (steps R31)". "No review".

**What the history shows about the check.**

- Both loop-making edges were declared because the imports check demanded that the map match the code. Nothing compared the new use with the modules' positions.
- The map had four later-pointing uses for three hours on 5 Nov (after PR 474, `bob/cap-splits-1`). PR 503, `bob/modules-layer-order-2`, brought it back to two. So order was repaired by hand once, and these two were left.
- The first Process3 snapshot of the map (3 Nov) had none.

Method: `git log -S` was not cheap on this clone (it fetched each historical blob and set off git's automatic repacking), so it was stopped. The dates come from reading `build/modules.json` at each of the 40 first-parent commits that changed it from 3 to 8 Nov.

## B. Public and private marks

**How the files separate the parts.** Every one of the 65 files has a `## Public` heading (with `### Purpose` and `### Provides`), and 60 have a `## Private` heading (with `### Uses`, `### Invariants`, and often `### Satisfies` and `### Suggestions`). 18 also have `## Open for Bob`, and a few have other trailing sections. A mark was assigned to the `##` section it sits under. This split is reliable: it is by heading, not by judgment.

| Section | Unmet marks |
| --- | --- |
| Public | 392 (352 under `### Provides`) |
| Private | 50 (31 under Suggestions, 16 under Invariants) |
| Open for Bob | 16 |
| Other trailing sections ("Decided by BOB", "Old ids", "Later requirements") | 8 |
| Total | 466 |

| Modules | Count |
| --- | --- |
| With work | 65 |
| With at least one unmet Public mark | 44 |
| With no unmet Public mark | 21 |
| Of those 21, with Private marks only | 11 |
| Of those 21, with marks in "Open for Bob" or another trailing section | 10 |
| With both Public and Private marks | 9 |

The 21 with no public mark: bundler, file-scanner, ai-catalogue, ai-accounts, credentials, member-upload, events, inquiry, run-rules, ai-gate, investigation, case-grammar, public-read, ratification, case-inputs, scheduler, machinery-producers, queue, admission, signin-door, store-request. They hold 47 marks; store-request has 15 of them.

**Readiness under the public-marks rule.** A module with work is ready when no module upstream of it, transitively, has an unmet Public mark and is unfinished. The three order-breaking uses are removed. Jobs are of equal length.

| | Strict (PD-25) | Public-marks rule | Public rule, counting "Open for Bob" and other trailing marks as public |
| --- | --- | --- | --- |
| Waves | 21 | **12** | 15 |
| Wave sizes | 3, 2, 2, 4, 4, 2, 3, 3, 2, 4, 2, 3, 4, 5, 2, 2, 1, 6, 7, 3, 1 | 5, 6, 6, 6, 4, 5, 6, 4, 11, 8, 3, 1 | 5, 6, 5, 2, 5, 2, 4, 4, 4, 5, 3, 9, 7, 3, 1 |
| Ready at once: median, mean, max | 3, 3.1, 7 | **5.5, 5.4, 11** | 4, 4.3, 9 |
| Upstream modules holding a module back: median, max | 25, 52 | 12, 32 | 17, 41 |

With the three uses kept, 27 modules still never start under any of the three rules, because agent-runner and agent-worker have public marks.

**Eight slots with continuous refill.** With equal job lengths, every job ends at the same moment, so refilling a slot the moment a job ends is the same as running in rounds. Staggering only appears when job lengths differ; a second row gives that case.

| 8 slots | Strict (PD-25) | Public-marks rule |
| --- | --- | --- |
| Elapsed, job-units, equal lengths | **21** | **13** (12 if the longest chain is started first) |
| Average slots in use | **3.1 of 8** | **5.0 of 8** (5.4) |
| Share of time all 8 are full | 0% | 15%: 2 of 13 rounds |
| At a bound of 6: elapsed, average | 22, 3.0 | 13, 5.0 |
| At a bound of 12 or more: elapsed, average | 21, 3.1 | 12, 5.4 |
| Job length taken as the module's mark count (466 mark-units in all; 58 would be perfect packing): elapsed, average in use | 188, 2.5 | 162, 2.9 |

- The public-marks rule shortens the remaining work by about 40% in job-units and uses about five slots. It does not use eight.
- When job length follows the number of marks, the gain is much smaller (188 to 162), because the long jobs sit on one chain: the screens modules in layer 11 hold 356 of the 466 marks, nearly all of them public, and they depend on each other.
- The rule helps where a module's remaining work is private. Only 21 modules are like that, and they are the small ones.

**What filling 8 slots would cost.** Under the loose rule of section 3 with N = 8 (9 batches), 37 of the 65 modules run beside an upstream module that has work. 29 run beside an upstream module that has an unmet Public mark, and 20 of those beside a direct one. Those 29 are the jobs under which, by the candidate rule's own premise, an interface can change.

**One thing the premise does not settle.** A public mark says a published requirement is not yet met. The requirement's text is already there for users to read, so meeting it changes behaviour and not necessarily the stated interface. How often meeting a public mark also changes the text its users rely on was not measured here.

## Limits of the follow-up

- Equal job lengths, as before. The mark-count row is a sensitivity run, not a forecast.
- "Open for Bob" marks were kept out of the public count in the main column; the third column shows the effect of counting them in.
- The pickaxe search that was stopped fetched some historical objects into the clone and triggered git's automatic repacking. No working-tree or sparse setting was changed.


# [file] appendix_recount.md

# Appendix, second draft: recount and findings

14 Nov 2026. Worker's notes for the coordinator. Written with `/home/user/handoff/process4_definition_appendix_v2.md`; nothing else was changed.

Read for this: the first-draft main text and appendix, `process4_disposition.md` and `.tsv` (all 288 rows with notes), the Ledger texts of the lines in question, `live_docs.md`, `k_evidence.md`, the assessment document's decision passages, and the six notes in the saved copy of the Ledger store.

"Main" below means `process4_definition_main.md`, first draft, as the brief named it. Section K points are numbered as that draft numbers them (K1 to K7), and v2 does the same.

**One thing to settle before v2 ships.** `process4_definition_v2.md` was being edited while I worked (file time 01:28 UTC). As I saw it, its section K lists the seven points as closed points 1 to 8, because it splits K1 in two, and it gives the fourteen technical points as decided by Claude. v2 of the appendix follows the first draft's numbering, as briefed, and says so in its "Place" paragraph with the mapping: K1 there is points 1 and 2 of the second draft, and K2 to K7 are its points 3 to 8. If the appendix should carry the second draft's numbers, the rows to renumber are those listed in section 4 below. My brief did not list the technical points as decided, so v2 says only that they are "Claude's".

## 1. The recount

Counted by script from the rows of v2. Each row has one "Now" value.

| Category | "Now" values counted in it | Lines |
| --- | --- | --- |
| A. Kept as written | "Kept" 184; "Kept by Claude's decision, 14 Nov" 2 | 186 |
| B. Kept with the way of doing it changed | "Purpose kept; how it is done: see place" | 46 |
| C. Ended by Bob's decisions | "Ended by Bob's decision" | 15 |
| D. Ended by Claude's decision | "Ended by Claude's decision, 14 Nov" | 11 |
| E. Ended in part | "Kept; one clause ended or changed" 23; "Kept by Claude's decision, 14 Nov; one clause ended" 1; "Ended in part by Claude's decision, 14 Nov" 3 | 27 |
| F. Open, Bob's to decide | "Open: Bob's to decide" | 3 |
| Total | 186 + 46 + 15 + 11 + 27 + 3 | 288 |

**C, ended by Bob's decisions (15):** ARC-4, GAT-7, P11 (the full regression and whole-product checks); P10, INT-4, OT-2 (layers); JOB-13, TM-10 (deliberate-fault sampling); INT-2, INT-7 (review); F-PLAT-3 (default of 24); F-PROP-3, JOB-12, GAT-8, GAT-4 (the three checks).

**D, ended by Claude's decision (11):** F-SET-3, REQ-6, TM-6, JOB-10, REC-10, REC-9, TM-2, TXT-6, TXT-2, F-REQ-9, REC-8.

**E, ended in part (27):**

- By Claude's decision (4): JOB-7 (receipt half), SES-6 and F-REQ-12 (for the process's own texts), F-SET-8b (kept; its confirming check gone).
- The first draft's 23 rows with one clause ended or changed, all unchanged in status: ARC-1, PLN-3, F-HUM-2, F-HUM-6, F-HUM-10, F-HUM-12, F-REQ-1, F-REQ-4, GAT-2, INT-3, SES-15, SES-18, F-ROLES-1, F-ROLES-5, F-JOB-6, F-JOB-10, F-PLAT-4, P4, GAP-1, GAP-10, F-SET-2, TM-9, OT-1. In 21 the clause is ended or changed by one of Bob's decisions. In F-ROLES-5 and OT-1 nothing is ended: one clause (the daily standby) is technical point 4, which is Claude's. I left them in this group because no decision moves them.

**F, open (3):** MNT-1, MSG-5, MNT-5.

**Judgment calls that move a count by one.** Each is flagged in v2.

1. F-SET-8b is counted in E, not A. Main item I 12 says "keep the route. Let the check go with item 2", and the line's second half is that check. If it is counted as kept as written: A 187, E 26.
2. Open is MNT-1, MSG-5 and MNT-5. MNT-1 is who builds and merges changes to the process. MSG-5 is the answer to a flaw report coming back "by main of the process repository". MNT-5 is the recorded act that moves the version a tranche uses; if sessions lose write access, that act may be Bob's too (enforcement_levers, lever 2). MNT-7, JOB-4, P3 and F-PROP-12 stand under either answer and only wait on it; they keep their status and carry a flag. If MNT-5 is counted as way-changed instead: B 47, F 2.
3. SES-12 and F-MNT-4 moved from A to B, beside F-SHAPE-5, F-MNT-7 and F-MNT-5, which were B already. I read K4 as keeping the purpose (the process is judged by something measured) and replacing the two numbers with the walk result. F-MNT-4 also counts by two checks Bob ended. If the lines that define the numbers are instead counted as ended by Claude's decision (SES-12, F-MNT-4, F-MNT-5): B 43, D 14.
4. F-ROLES-4 moved from open to B. No decision names it. Main has replacing ROOT at technical point 4, not among Bob's points. If it is kept open: B 45, F 4.
5. ARC-2 is in B (rule kept, the way of holding it changed). Its text has no clause about a check, so it could be counted A: A 187, B 45.

## 2. Against the first draft's figures

| First draft | Now | Difference, line by line |
| --- | --- | --- |
| 198 kept as written by the audit | 176 of those 198 are kept as written | 20 had a clause ended or changed by Bob's decisions already in the first draft (ARC-1, PLN-3, F-HUM-2, F-HUM-6, F-HUM-10, F-REQ-1, GAT-2, INT-3, SES-15, SES-18, F-ROLES-1, F-ROLES-5, F-JOB-6, F-JOB-10, F-PLAT-4, P4, GAP-1, GAP-10, F-SET-2, TM-9), so "198 as written" was 178 then. 2 more now: SES-12 and F-MNT-4 (K4). 198 - 20 - 2 = 176 |
