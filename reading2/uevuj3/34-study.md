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

