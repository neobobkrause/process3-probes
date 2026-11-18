**Code.** Base → `layer/14` tip, hand-written code files only:

| | Files changed | Added | Deleted | Net |
|---|---|---|---|---|
| Product source | 378 | 30,074 | 6,984 | +23,090 |
| Product tests | 1,041 | 51,981 | 8,099 | +43,882 |

Raw totals are misleading in both directions: 86,347 lines of generated data left the tree (`rows.mjs`, `words-unreviewed.json`, bundles, untracked on 4–5 Nov) and one 8,543-line data file was added. Test files went from 3,766 to 4,248.

**Rework.** For every landing, each non-trivial added line was checked for presence in the same file at the `layer/14` tip. Source: 24,608 of 24,897 survive (98.8%). Tests: 44,843 of 45,552 (98.4%). No day is below 97%. Only 4 commits in the week are titled `Revert …`, all in design-lane docs or records. On the 27 unmerged November job branches there are about 830 non-trivial lines that are not at the tip (largest: `case-checker-3` 239, `plane-2` 144, `op-declarations` 121, `store-assembly` 100); the other 3,800 lines on those branches reached the tip by a later attempt.

So landed product code was not being torn up and rewritten. What was redone was the landing itself: 3.1 job starts and 3.0 landings per job, 2.2 sync merges per landing.

**Was it meaningfully advanced?** By the module-level record, yes: about 5% more source and 6% more tests on a large product, 60% of the tranche's marks met in six working days, nearly all of it on 4–7 Nov. By the end-to-end record, not yet: see section 9, point 2.

## 6. The check-adding tendency inside the product repository

It is here too, in four forms.

**a. Process surfaces in the product tree grew.**

| Item | At setup (1 Nov) | End | Note |
|---|---|---|---|
| `.github/workflows/process-gate.yml` | 77 lines | 273 | every change arrived through a pin PR |
| All workflow files | 446 lines, 6 files | 1,021 lines, 8 files | |
| `process/config.json` | 24 lines | 421 | 79 → 372 on 4 Nov alone |
| `.claude/settings.json` | 35 lines | 75 | see below |
| `CLAUDE.md` | 641 bytes | 8,664 bytes | 16 owner patches |
| `DECISIONS.md` | absent | 174 lines | BD-1 to BD-18, from 6 Nov |
| Requirement files | 191 | 221 | bytes unchanged (8.04 MB) |
| `docs/requirements-notes/` | absent | 58 files | text moved out of requirement files |

`CLAUDE.md` is the exception to the pattern: it is the owner's standing-approvals text, and every one of the 16 patches widens or clarifies a permission. Its growth records sessions meeting a permission wall and the owner removing it, not sessions adding checks.

`settings.json` gained, on 7 Nov 04:39Z (owner patch 13, during the GitHub suspension response): a deny on every `git push` and every `gh` command, an allow for `p3 github push` only, and a `PreToolUse` hook that runs a process script before **every Bash call** in every product session (300-second timeout). The push ceiling this served was retired hours later; the hook and denies were still in the tree at the end, and `process/config.json` ends with `"pushes_per_hour": 1000000`. The limit was neutralised by raising it, not removed.

**b. A requirements size cap turned into product work.** The process refused `job complete` when a requirement file exceeded 70,000 bytes. Product side: 30 new requirement files whose names show the split (`jurisdictions-b`, `jurisdictions-c`, `op-grades-folds`, `interface-shell-t53`, `control-plane-door-pages`, …), 58 notes files, 46 of the 220 ledger jobs mentioning a split or the cap, 64 commits citing it (40 on 4 Nov), and at least one source module physically split to follow its requirements (`reading-pipeline/index.mjs` −2,142, `reader-contract/index.mjs` +2,164). Total requirement bytes did not change. The review lists this check as overridden 32 times of 32 with no catch; the product record shows what it cost before it was overridden.

**c. Tests written for the process, not the product.** Two families now live permanently in the product's suite:

- 187 new `notice-*.test.mjs` / `notices.test.mjs` files, 9,321 lines. Each pins a "provider notice confirmed, no code change" answer.
- 24 `requirements-ids.test.mjs` files, 2,089 lines. Each tests a requirements Markdown file (ids, order, marks, a SHA-256 of kept lines) against a start commit.

Together 11,410 lines, 26% of the week's net test growth.

The gate's revert check (a new test must fail with the change reverted) also shaped tests. 27 tests-only commits cite it in their titles ("fail on assertions, not at load, with the change reverted"). On 9 Nov it cut the other way: `bundler: drop the repairs of four stale tests (BOB bob-337): they pass with the change reverted`. Real test repairs were removed from a pull request because the check could not accept them.

**d. Notices, triage and blocks.** When a landing changed a module's interface, every dependant got a notice. 178 notices fanned out to 2,707 module-notifications (1,341 on 4 Nov). Of 2,342 triage verdicts, 2,101 (90%) were "not affected". 441 were answered by a job landing. Jobs wrote 165 `block` commits, median 1,389 characters each, to hand a stuck job to BOB; 72 on 4 Nov and 50 on 5 Nov. In 72 of them the job states the work is done and pushed and `job complete` refuses. Counting by keyword in the block text (a block often names several): the suite already red on the tranche before the job started (48), the size cap (47), a record, ledger or paths check (69), the revert check (61), a cost figure the session could not obtain (9).

**CI time.** Not in git as such. What the state branch has: per-module suites are fast (median 1.9–2.5 minutes, 403 runs, 21% failing on 7–8 Nov). Gate runs 6–9 Nov: 789, median 1.1 minutes, 2,665 gate-minutes in total, longest 81 minutes. The two late deploy-and-walk runs took 60 and 64 minutes.

## 7. Queueing: job completion to merge

For each landing, the wait is the merge time minus the last `job complete <job>` commit in the merged range. A second column uses the first `job complete` in the range, which includes time lost to re-completion.

| Day | Landings | Last complete → merge: median / p75 / p90 (min) | First complete → merge: median / p90 | Job start → merge: median |
|---|---|---|---|---|
| 3 Nov | 5 | 18 / 18 / 20 | 18 / 20 | 26 |
| 4 Nov | 135 | 13 / 21 / 52 | 17 / 99 | 36 |
| 5 Nov | 92 | 348 / 623 / 670 | 385 / 841 | 459 |
| 6 Nov | 65 | 12 / 249 / 469 | 34 / 855 | 109 |
| 7 Nov | 128 | 6 / 9 / 12 | 8 / 24 | 26 |
| 8 Nov | 74 | 10 / 15 / 29 | 12 / 100 | 39 |
| 9 Nov | 7 | 37 / 111 / 112 | 73 / 112 | 133 |

- Review: 8 minutes on 4 Nov, 289 on 5 Nov. Git gives 13 and 348. Same shape, somewhat worse.
- By half-day the train's effect is sharper: 5 Nov before 12:00Z median 61 minutes, after 12:00Z 623 minutes; 6 Nov before 12:00Z 231 minutes, after 12:00Z (layer branches) 5 minutes.
- The layer design fixed the queue. On 7 and 8 Nov a finished job merged in 6 to 10 minutes. The loss on those days was elsewhere: nothing to land (9.3 hours with no commit of any kind from 7 Nov 05:51Z; gaps between code-carrying landings of 11.4, 8.7, 7.6 and 6.3 hours), and landings that carried no code.
- 9 Nov has seven landings, so its medians are weak. Two of them (`ai-accounts`, `credentials`) took 351 minutes from start to merge for 63 and 28 lines of source, across a deadlock on a companion-order rule (`block op-declarations: PD-19 order deadlock`, 13:47Z).
- Limit: this measures only jobs that eventually merged, and uses commit times on the job branch. It cannot see a job that was finished in a session but not yet committed.

## 8. The final stop

Sequence on 9 Nov from the product record:

| Time (UTC) | Event |
|---|---|
| 15:28–15:29 | `ai-accounts` (PR 1098) and `credentials` (PR 1099) land on layer 14 |
| 15:53 | `op-declarations` (PR 1104) lands, their companion |
| 15:50, 16:13 | Two more pin moves (PRs 1108, 1110), each applied to layer 14 in place |
| 16:20–16:35 | `credentials` restarted (attempt 4), passes, lands again as PR 1113, records only. **Last product landing: 16:35:22Z** |
| 16:38, 16:45:44 | Owner's patch 16 to `CLAUDE.md` ("reviewed revert exemptions") committed and merged to the tranche as PR 1115 |
| 16:47:52 | Last message commit on the state branch, BOB to ROOT |
| 18:15–18:59 | Pin move to process `38b0f3f07f` (process PR 302, a layer-pin fix), merged to the tranche as PR 1116 |
| 19:00–19:05:44 | The same pin applied to layer 14 (PR 1117); `layer 14: pin apply` is the last commit anywhere |

State left behind:

- **Layer 14 is complete but unmerged.** Its four items (ai-catalogue F4 and F5, ai-accounts F6, credentials F1) all landed. `layer/14` is 48 commits and 623 source and test lines ahead of the tranche. The step that was next, by the completion-round plan, was layer merge, then deploy, walk and development release. None happened.
- **No job was mid-flight in git.** The only job branch with a 9 Nov tip that is unmerged is `job/file-scanner`, holding a `block` (the item is another module's).
- **Completion round 2:** 28 of 33 items ticked, 5 deferred to a next round.
- **Ledger:** 218 COMPLETE, 2 OPEN. **Marks:** 357 T53 marks and 51 found marks still unmet.
- The patch merged at 16:45Z changed `CLAUDE.md` on the tranche only. It is not on `layer/14`. Git cannot show why that edit stopped the sessions; that rests on the transcripts.
- The review says nothing moved after 16:45Z. Nothing carrying product work did. But a session was still able to move the process pin on the product twice over the next 2 h 20 min. The last thing done to the product was a process change.

## 9. What contradicts, complicates or sharpens the review

**1. Sharpens: the product record supports the central claim more strongly than the review's own numbers.** Product-code commits are 4.2% of commits; 89% are state or bookkeeping. 47 of 48 layer syncs carried no product code. 63% of gate runs were started by something other than code. 21% of all landings and a third of 6–8 Nov landings changed only process records. Process changes reached the live product a median 3–21 minutes after merging.

**2. Complicates: module-level gating did not produce a working product, and the one check that tests the product was barely run.** The state branch records 12 development deployments. All 12 are `ok: false`; 10 stopped at the walk. Ten are on 4 Nov; then none for 80 hours, during which 308 landings went in (204 with source or test changes). The layer-11 live walk (8 Nov 07:20Z): 175 steps, 1,691 failures. After completion round 1 (8 Nov 23:50Z): 157 steps, 178 failures, and 147 of the 157 steps still failing; the internal walk went from 63 failures in 238 steps to 96 in 357 as it was given more to check. So the failure count fell 89% in one round, which shows the walk's findings were real and fixable, while 218 "COMPLETE" jobs and green module suites coexisted with a product that failed nearly every live screen. The review credits the walks as the largest defect finder. The product record adds that the process spent the week multiplying cheap checks on records while running its one decisive check twice in the last five days.

**3. Complicates: the checks did catch real things, and red gates were rarely about tests.** In the layer era 70 of 789 gate runs were red. Only 5 had a failing suite and 2 were base-red; 43 were red with the suite passing, and 20 were red drafts. That is consistent with the review's finding that red gates seldom reflected a product defect. On the other side: 183 found marks were raised during the week, each naming a specific cross-module defect or gap, and 132 are no longer marked unmet; completion round 2 lists 33 concrete items, several straight from the live walk (an undefined CSS class, a missing door on Home for administrators, a catalogue address that would 404); 241 notice triage verdicts were "affected", and some led to real dependant fixes (for example `capture-requests` reading a field `ai-runs` had renamed). The useful catches came from one module's job reading another's interface, and from the walk. The record-keeping checks produced the blocks in section 6d.

