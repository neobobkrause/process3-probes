# Can the notice method tell real users only when they need it? Result of the replay on civicsmith's own record

15 Nov 2026. For Bob. Written by Claude (the replay session). Nothing here is in force.

Four words are kept apart throughout. **Measured**: counted by a script in this folder. **Estimated**: worked out from a sample, or from a rule that was computed but not built. **Judged**: somebody's reading; it says whose. **Unproven**: never run.

Bob's goal, 15 Nov 2026: "The goal is to not miss notifications and to strike the proper balance of reducing the false notifications by as close to 2 orders of magnitude with a reasonable amount of effort for projects of the size of civicsmith."

## The answer first

**On this cluster the method does not come close to two orders of magnitude.** Six real providers, 32 recorded changes, 665 notifications by Process3, of which 629 went to a user judged to need nothing. Two orders of magnitude fewer would be about 6 notifications for nothing.

| How users are told | Notifications | Of them for nothing | Broken users missed (of 23) | Adopters missed (of 13) | Status |
| --- | --- | --- | --- | --- | --- |
| Process3 as it ran | 665 | 629 | 0 | 0 | measured (the record) |
| The tool as the proof left it (design 7) | 668 | 632 | 0 | 0 | measured |
| The tool with three fixes made here | 408 | 377 | 3 | 2 | measured |
| The same, with a narrower rule for users the tool cannot follow | 363 | 333 | 4 | 2 | estimated: computed from the tool's own reports, not built |
| Only users the tool finds using a changed entry, as if every user were followable | 140 | 119 | 11 | 4 | estimated: the same |

So: **about 1.7 times fewer notices for nothing, measured, with 3 broken users missed; at most about 5 times fewer if every user could be followed, with 11 missed** (estimated). "Broken" and "adopted" are the study session's judged reading of the record.

**Where it works.** In 13 of the 32 changes the provider's interface, as its comments state it, did not change. There the tool told 2 users where Process3 told 269 (measured). That part does what Bob's rule says: "if both domain and range stay the same, then no retesting of users is needed" (Bob, 14 Nov 2026). The helpers who wrote the comments had predicted, before any run, whether each change would alter the interface; the tool agreed on 31 of 32 (measured).

**Where it does not.** In the other 19 changes the interface did change, and the tool told every user, 406 notifications where Process3 sent 396. The reason is a rule of the method: a user the tool cannot follow fully counts as using everything, and is told whenever the provider's interface changes at all. On the real product **no user can be followed**: each reads or calls hundreds to thousands of values whose kind no comment states (measured: 471 to 17,775 per user of ai-runs). One user, plan-work, was made followable; it was then told only for the four entries it uses (measured, one case), at a cost of about 20 minutes and 300,000 tokens of a helper's work, and with 309 places its own check now refuses.

**What it misses.** The 3 broken users missed by the tool (measured against the judged reading) all broke through something no interface comment carries: a value's format (`ann` became `member:ann`, ai-accounts 316) and the contents of lists of act names (wizard-scripts 163). A run of the users' own tests is the only thing that could find those; here, at ai-runs 96, it found 1 of 11 broken users (measured; section "The users' own tests").

**The effort** (measured on six helpers; estimated for the product):

- **First comments**: 12 to 17 minutes of a helper's work per module of 1,300 to 3,800 lines, and about 210,000 to 300,000 tokens (estimated share of each helper's measured total). For civicsmith's 193 modules that other modules use: **about 40 to 55 hours of helper time and about 40 to 60 million tokens** (estimated, from a sample of six).
- **Upkeep**: about 1 to 4 minutes per later change (10 for one rewrite), about 17,000 to 79,000 tokens; 17 of the 32 changes needed no comment line added or removed (measured). For the record's 178 changes: **about 3 to 12 hours and 3 to 14 million tokens** (estimated).
- **Making users followable**, which the bigger saving needs: of the same order again as the first comments, for every module (estimated from one module), and not yet clean.

**Saved to the product.** As Bob asked on 15 Nov 2026 ("Yes, working branch."), the comments are on the branch `notice-comments` of civicsmith-copy, commit f08b62e1, made from main. Section "What is on the branch".

## Words used here

- A **module** is one part of the product with its own code, tests and declared list of modules it uses. A **provider** is a module that changed; a **user** is a module that uses it.
- **Structured comments** are comments in a fixed form (JSDoc) that TypeScript's reader understands. They state the **kinds** of values a module accepts and hands back, field by field. A **bound** is a limit a kind cannot express, on its own line starting `@bound`. Nothing runs differently because of them.
- **TypeScript's reader** is a free program that reads plain JavaScript with those comments. The **tool** (built by the proof session, `notice-proof/tool/`) uses it to write out a module's **listing**: its interface as a list of **entries**, one per function, method, constant or kind of data.
- A **notice** tells a user that a provider's interface changed in a way that may concern it. A notice is **for nothing** when the user was judged neither broken nor to have adopted something.
- A user is **followed** when the tool can see every value it reads and calls, and so knows which entries it uses. A user that is not followed is told whenever the provider's listing changes at all.
- **Broken** and **adopted** are the study session's reading of the record (`process4/working/notice_study/data/classified241.tsv`): a user that was wrong or failing until it changed, and a user that changed its code to take up something new.
- A **helper** is a separate worker started by this session, working alone on one module, the way one job would.

## What was done

1. **The cluster** (`CLUSTER.md`): the six providers of the AI-account work, ai-runs, ai-accounts, op-declarations, ai-catalogue, ai-use and wizard-scripts. Their 32 recorded changes carry 665 of the record's 2,707 notifications (25%), 23 of its 40 broken users and 13 of its 34 adopters, including the two changes that broke the most users.
2. **The replay product**: an adaptor (`adaptor/`) copies each change's provider and its 9 to 30 users, before and after, out of a read-only bare clone of the product, into the tool's layout. The after side differs from the before side only in the provider's own files. Nothing was checked out in, or written to, the product's history.
3. **The comments**: one helper per provider wrote the comments at the state before its first recorded change, then carried them through every later change, mechanically where the code had not moved (a three-way merge) and by hand where it had. Every one of the 70 commented states was checked by the tool: "comments only: yes, running code unchanged" (measured).
4. **Expected answers** first: each helper wrote, before the tool was run on a change, whether the change alters the interface and which entries (`expected/`), committed in commits of their own before any result. I wrote down the rule for who is told (`expected/README.md`) before the first run.
5. **The replay**: the tool's notice on all 32 changes, three times: as the proof left it, with two fixes, and with three (`results/notice-design7/`, `notice-R1R2/`, `notice/`). Compared with the record, the judged verdicts and the expected answers (`replay/compare.mjs`, `results/compare*.md`).
6. **The users' own tests** before and after, in a scratch copy of the product, where they could be run (`replay/tests.mjs`, `results/tests/`).
7. **One user made followable** (plan-work), and its notice run again.
8. **The comments carried to the product's main branch** and pushed to a working branch.

## What the tool did, change by change

All measured (`results/compare.md` has every row).

| Provider | Changes | Interface unchanged (tool) | Process3 told | Tool told | Tool told for nothing | Broken (missed by the tool) | Adopted (missed) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ai-runs | 8 | 3 | 217 | 147 | 134 | 11 (0) | 2 (0) |
| ai-accounts | 5 | 2 | 138 | 86 | 85 | 2 (1) | 0 |
| op-declarations | 4 | 2 | 84 | 42 | 33 | 6 (0) | 3 (0) |
| ai-catalogue | 7 | 2 | 75 | 56 | 55 | 1 (0) | 0 |
| ai-use | 3 | 0 | 56 | 56 | 49 | 1 (0) | 6 (0) |
| wizard-scripts | 5 | 4 | 95 | 21 | 21 | 2 (2) | 2 (2) |
| **All** | **32** | **13** | **665** | **408** | **377** | **23 (3)** | **13 (2)** |

(wizard-scripts 546 added one exported constant; that changes the listing, and every user, none of them followed, was told; at wizard-scripts 255 two users were told because store-assembly, which passes wizard-scripts' data on, gained entries. The helper had read the constant as private and expected no change: the one disagreement of 31 against 32.)

**The three broken users the tool missed** (judged by the study; the reasons are mine, from the changes):

- ai-accounts 316, store-assembly: a recorded name became `member:ann` where it was `ann`. Its kind is "text" before and after. Three of store-assembly's tests wrote the old form.
- wizard-scripts 163, affordances and screens-inquiry: the generated registry of screens and acts changed its contents. Its kind ("a list of screens") did not change.

**The two adopters it missed**: wizard-scripts 98, interface-shell and screens-inquiry, which took up new registry contents. Same cause.

## Why every user is still told when anything changes

**The rule.** A user the tool cannot follow fully counts as using everything of the provider (the study's decision 2; the proof's design). The tool applies it whenever the listing changes at all, even when the only change is a new entry, which by itself tells nobody.

**The fact** (measured on the state before ai-runs 96, `adaptor/follow.mjs`): every user of ai-runs with code reads or calls values of unknown kind, from 471 (skills) to 17,775 (screens-inquiry) places each. Users with no code that uses the provider at all (7 of ai-runs' 29) are told by the same rule. The comments on the providers do not change this: the unknown values come from the users' own code, their other providers, the platform (storage, requests) and their tests.

**Two estimates of what would change it**, computed from the tool's own reports, not built:

- **A narrower rule**: tell a user the tool cannot follow only when an entry changed in a way that can break a user (removed, accepts less, hands back differently, bound changed), not when entries were only added or only accept more. 363 notifications, 333 for nothing, and 1 more broken user missed: at ai-catalogue 484, store-assembly's tests signed the old seed, and the change only added entries (judged by the study). Bob has not been asked about this rule.
- **Every user followable**: tell only users found using a changed entry. 140 notifications, 119 for nothing, and 11 broken users missed. Six of those are op-declarations 95's: screens that name retired operations as words in their code (`'groupkeystate'`), which no import shows; op-declarations' helper could not state its roughly 1,030 operation names as a table the tool reads, because they are built in code. Two are users the tool found no use in (signin-door at ai-accounts 124 and op-declarations 95). The users being uncommented here, the use the tool finds is a lower bound: commenting them might find more uses, and more notices.

**The one user made followable** (measured): plan-work, 1,427 lines, about 20 minutes of a helper's work (15:26 to 15:45 by the clock) and 296,976 tokens: unknown reads 1,840 to 0, 803 comment lines. Its notice at ai-runs 96 then named it only for the four entries it uses, as written down before the run. But the tool's check now refuses 309 places in plan-work: test reads of answers never narrowed, test casts, and calls into ai-runs whose uncommented defaults read as `null`. So no comments-only state of plan-work is both followable and accepted by the check without changing its tests. And had the helper written its own copy of ai-runs' shape instead of importing ai-runs' kind, the tool would not have linked plan-work's call to ai-runs at all (the helper's finding).

## The tool needed three fixes on real code

As the proof left it (design 7), the tool reported an interface change at every one of the 32 changes, including the 13 where nothing a user can see changed, and so told everyone: 668 notifications against Process3's 665 (measured). Three faults of the tool, not of the method (judged, Claude), each recorded in `notice-proof/tool/REPLAY-CHANGES.md` in the form of the proof's design notes:

1. **A class handed back was written out member by member**, so a change to any member, its 85 internal ones included (ai-accounts), read as a change to the function that hands it back; and private members (`#name`), which no other module can reach, were entries.
2. **The reader's own serial numbers** in some names differed between the two readings and made unchanged entries look changed.
3. **A list of re-exported names** was recorded whole as the declaration of each name in it, so adding one name changed all of them (31 entries at ai-catalogue 317).

After each fix, the proof's whole rerun (`npm run proof`) gave all 150 of its recorded changes the same users told, the same holes and the same refusals; three show an entry differently (measured, `results/proof-rerun-with-R1-R2-R3.txt`).

Faults the replay found and did not fix: the check refuses a reading of a value that may be null as a disagreement under one code of the reader (2531) and as "cannot tell" under another (18047); and it mistakes `JSON.parse` of a value the module itself stored for a message between running parts. Both draw refusals of true comments.

## The users' own tests

Measured at ai-runs 96, every user (`results/tests/ai-runs-96.json`): of the 11 users judged broken, **1** (store-assembly) has tests that newly fail after the change (3 tests). Two users not judged broken also gained one failure each (op-declarations, plane; not read further). The other broken users' tests pass before and after: the record's breaks there were in code paths their tests do not exercise, or showed only together with the other modules' changes of that week (judged, Claude; for scheduler I checked by hand that the change was really in the copy the tests ran on, and the test the record names still passed).

Some suites cannot be judged in this container: screens-inquiry fails all 69 tests before the change, store-request 110 of 117, and control-plane's suite ran out of its 15-minute limit. A full run of all 29 users of one change took two hours here.

The other six changes that broke a user: only the users judged broken or adopted were run (see "Dated notes" at the end for their outcome, if it came in time).

A run of the tests of every module that uses the provider directly or through another: the declared closure is 25 to 165 modules per change (measured, `data/reach.json`), most of the product for ai-accounts and ai-catalogue. Not run here.

## The effort

Measured from the helpers' own logs (written as they worked, `effort/<provider>.jsonl`), their files (`adaptor/effort.mjs`), and the harness's count of each helper's tokens (`effort/helpers-usage.json`). Gathered in `effort.json` and `effort-log.md`. The time is a helper's wall-clock time on a shared 4-core machine; it is not a person's time, and a person would need much longer (the helpers' own remark; unmeasured).

| Provider | Source lines | First comments (minutes) | Comment lines written | per source line | Later changes | Their minutes in all | Helper's tokens, all steps |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ai-runs | 3,814 | 12.8 | 997 | 0.26 | 8 | 15.2 | 504,056 |
| ai-accounts | 3,292 | 15.4 | 894 | 0.27 | 5 | 6.9 | 427,096 |
| op-declarations | 3,479 | 12.0 | 306 | 0.09 | 4 | 3.4 | 306,001 |
| ai-catalogue | 1,470 | 12.4 | 868 | 0.59 | 7 | 11.6 | 405,587 |
| ai-use | 1,313 | 13.8 | 711 | 0.54 | 3 | 14.0 | 471,647 |
| wizard-scripts | 2,914 | 17.1 | 1,037 | 0.36 | 5 | 6.2 | 394,788 |
| plan-work (made followable) | 1,427 | about 20 | 803 | 0.56 | | | 296,976 |
| ai-accounts carried to main | 1,788 | 7.7 | 721 | | | | 261,095 |

**First comments, per module** (measured on six): 12 to 17 minutes, whatever the size between 1,300 and 3,800 lines. The time went mostly to reading the module's code (the helpers' logs) and to running and reading the check. Comment lines per source line varied six-fold with the kind of module: 0.09 for op-declarations, a module of declarations whose names are built in code, which the helper left as content; 0.5 to 0.6 for ai-catalogue and ai-use, whose answers are many small kinds of data. Tokens for the first step alone: about 210,000 to 300,000 (estimated: each helper's measured total split by its logged minutes).

**Upkeep, per later change** (measured on 32): 17 changes left the number of comment lines unchanged, most with no comment edit at all. The rest took 0.4 to 4 minutes, except ai-use 105, a rewrite of the module, which took 10. Tokens about 17,000 to 79,000 per change (estimated the same way). Carrying ai-accounts' comments to an older version of the module took 8 minutes and 261,095 tokens; a three-way merge carried none of it.

**For all of civicsmith** (estimated):

- The sample: six providers of 1,300 to 3,800 lines, all classes of the main plane with tables and operations, 9 to 30 users each. No separate Worker (such as agent-worker), no pure data module.
- The product at the record's last commit: 193 modules that other modules use, 459,601 source lines; half are under 1,790 lines, a quarter over 3,164, and about 15 over 4,000 (the largest, jurisdictions, 19,819 lines, mostly data) (measured, `data/sizes-e7ec72e093.json`).
- **First comments for all 193**: 193 times 12 to 17 minutes, about **40 to 55 hours** of helper time, and 193 times 210,000 to 300,000, about **40 to 60 million tokens**. Modules larger than the sample would add to that; how much is not known. Jobs run side by side, so the calendar time is far less.
- **Upkeep**: about 1 to 4 minutes and 17,000 to 79,000 tokens per provider change; over the record's 178 changes, about **3 to 12 hours and 3 to 14 million tokens**.
- **Making users followable** (needed for anything beyond the measured 1.7 times): every module is some module's user, so of the order of plan-work's 20 minutes and 300,000 tokens for each of about 190 modules, **another 60 hours and 60 million tokens or so**, from one sample, plus an unmeasured cost to bring tests to a form the check accepts.
- **What changes the time**: in this sample, not size (between 1,300 and 3,800 lines) and not the number of users. The kind of module changed what was written (0.09 to 0.59 comment lines per source line) and what could not be written (generated files, operation names built in code), not the minutes.
- **This session's own use** could not be read: the session tool shows no token count. The helpers' total is 3,067,246 tokens (measured, eight helpers).

## What is on the branch

`notice-comments` in civicsmith-copy, made from main (0dea5a6, 1 Nov 2026), two commits:

1. **9d0c5cc3**: the comments for ai-runs, ai-accounts, op-declarations, ai-use and wizard-scripts, 16 source files. main is older than every recorded change: for four of the five modules its source is exactly the state the replay commented first, so their comments are those; ai-accounts on main is an older version, and its comments were carried to it by a helper (8 minutes; most rewritten by hand). ai-catalogue does not exist on main.
2. **f08b62e1**: two generated records the product's own test preparation rewrites when a source file changes: the bundle manifest (each source file's size and checksum) and the index of words with their line numbers. The product's rule is to commit them with the change.

**How it was verified** (measured): the tool's check with `--comments-only-against` main says "comments only: yes, running code unchanged" for each of the five (`adaptor/main-check.sh`); and the five modules' own tests give the same result on main and on the branch: 776 passing on both, and the same one wizard-scripts test failing on both (a registry copy that must equal the design's). Nothing else was done in civicsmith-copy: no pull request, no merge, nothing on any other branch.

## What I had to decide myself

Each can be overruled.

1. **The cluster**: the six AI-account providers (`CLUSTER.md`).
2. **The after side** differs from the before side only in the provider's own files; other files the record's merge touched are left out.
3. **The users**: the modules that declared the provider, plus those Process3 told.
4. **Helpers** wrote the comments, one per provider, at the same time; each kept its own module's comments through every change, as a run of jobs would but with one memory. They were not shown the record's verdicts.
5. **No tests named for bounds** were added; the check's refusals for them are counted, not fixed (design 8 leaves that rule of form out).
6. **The tool was changed three times** (above); the results with the tool as the proof left it are kept beside them.
7. **The users' tests** were run for every user at ai-runs 96 and only for the judged broken and adopted users elsewhere, because one full change took two hours.
8. **The carry to main**: main predates every recorded change, so the carry was mostly a copy; I pushed it as asked.

## What this does not show

- **Six providers of one part of the product, in one week of its record**, dominated by one renaming. Other parts and weeks may differ.
- **The helpers are not the product's jobs.** Each knew the method and worked alone on one module, with the tool at hand; their time is not a person's and not a job's inside the process.
- **"Broken" and "adopted" are one reader's judgement** (the study session); the tool's counts are measured against it.
- **The two estimated rules were not built or run** as rules; they were computed from the tool's reports. Neither has been put to Bob.
- **Users were not commented**, except plan-work. What the tool finds a user uses is therefore a lower bound.
- **The users' tests** ran in a container where some suites fail before any change, and only partly.
- **One version of the reader** (TypeScript 5.6.3) and of Node (22.23.4).

## How to rerun

From the repository root, on the branch `notice-replay`:

```
sh notice-replay/rerun.sh            # the notices with both tools, comparisons, effort (about 2 hours here)
sh notice-replay/rerun.sh --tests    # also the users' tests (several hours more)
```

It clones the public product repository read-only once, installs TypeScript 5.6.3 for the tool, and writes only under `notice-replay/`.

## Files

| File | What it is |
| --- | --- |
| `CLUSTER.md` | The cluster and why |
| `HELPER_BRIEF.md` | What each helper was told |
| `MODULE-DESIGN-NOTES.md` | For the jobs of ai-accounts and wizard-scripts: what makes their interfaces hard to state |
| `adaptor/` | Copying the product into the tool's layout; carrying comments; measuring effort and sizes |
| `commented/<provider>/<pr>-before`, `-after` | The commented provider files at every state; `main-0dea5a6` for ai-accounts on main; `user-plan-work/` |
| `expected/` | Expected answers, written before any run |
| `replay/` | Running the notices, the tests, the comparisons |
| `results/notice-design7/`, `notice-R1R2/`, `notice/` | The tool's notices with design 7, with two fixes, with three |
| `results/compare*.md`, `results/expected-vs-tool.json` | The comparisons |
| `results/tests/` | The users' tests before and after |
| `effort-log.md`, `effort.json`, `effort/` | The effort, as written while working |
| `../notice-proof/tool/REPLAY-CHANGES.md` | The three changes to the tool |

## Dated notes

(none yet)
