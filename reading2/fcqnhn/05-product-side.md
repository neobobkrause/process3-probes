# Process3 post-mortem: what the product repository shows

Source: `neobobkrause/civicsmith-copy` (blobless clone; all blobs for 30 Oct – 9 Nov fetched, so every figure below is measured, not sampled), cross-checked against `neobobkrause/process3` (`origin/tranche`). Times are UTC. "Day" is the committer date in UTC.

Scripts and intermediate data are in `/tmp/claude-0/-home-user/5fb00928-6c32-53d3-a000-4e1f643cb17f/scratchpad/`:
`parse.py` (all 18,389 commits with first-parent numstat), `daily.py` (commit buckets), `landings.py` (landing classes), `queue.py` (waits), `survive.py` (line survival), `marks.py` (requirement marks), `size.py` (code size at a commit), `cat.awk` (path categories).

## Summary

1. **The review's landing counts are right.** 135 landings on 4 Nov, 92 on 5 Nov, 7 on 9 Nov (3 by 14:20Z). The git record gives 65 / 128 / 74 for 6 / 7 / 8 Nov. But 105 of the 508 landings changed nothing except process records, and those are concentrated on 6–8 Nov (22, 44, 34).
2. **The product was materially advanced, and what landed stayed landed.** 218 of the 220 planned jobs are marked COMPLETE; all 11 planned layers closed by 8 Nov 06:15Z; hand-written source grew by a net 23,090 lines and tests by 43,882; 98.8% of landed source lines and 98.4% of landed test lines are still present at the last layer tip. The week's waste was in waiting, re-syncing and re-testing, not in product code being rewritten.
3. **It never passed its own walk.** All 12 development deployments recorded 4–8 Nov ended `ok: false`. No deployment was made for 80 hours (4 Nov 23:14Z → 8 Nov 07:20Z) while 308 landings went in. The first walk after that found 1,691 failures; the last one (8 Nov 23:50Z) still failed 147 of 157 live steps.
4. **Commits are 89% bookkeeping.** Of 18,295 commits on 3–9 Nov, 70% are on the process state branch and a further 19% are records, pins and sync merges on code branches. 767 commits (4.2%) are non-merge commits that touch product source or tests.
5. **The stop left the work one merge short.** Layer 14 had every one of its items landed by 16:35Z on 9 Nov and was never merged into the tranche. The last recorded activity in the product repository is a process pin move at 18:15–19:05Z.

## 1. Orientation

| Ref | What it is | Size |
|---|---|---|
| `origin/main` | Product mainline before Process3. Last commit 1 Nov 22:24Z ("Add standing approvals from Bob to CLAUDE.md"). Not touched during the week. | 68,685 commits from 24 Jul |
| `origin/tranche` | Process3's integration branch for tranche T53. Base for this analysis is `4250e8860a` (30 Oct, "plan: PAUSED by Bob while the process's health is assessed"); Process3 was set up on it by `8a80914dae` at 1 Nov 23:14Z. Tip `e7ec72e093`, 9 Nov 18:59Z. | 837 first-parent commits since 30 Oct |
| `origin/layer/7` … `layer/14` | Per-layer integration branches, used from 6 Nov. Layers 1–6 landed straight on the tranche (4–5 Nov via the merge train). Layers 12–14 are "completion rounds" after the 11 planned layers. `layer/14` is 48 commits ahead of the tranche and unmerged. | 8 branches |
| `origin/process-state` | Orphan state branch: messages, heartbeats, layer flow rows, notices, usage ledger, deploy and walk reports. First commit 3 Nov 02:07Z, last 9 Nov 19:05:44Z. | 12,881 commits |
| `origin/job/*` | One branch per job attempt. 330 refs; 27 with November tips are not merged into `layer/14`. | |
| `origin/bob/*` | The product coordinator's (BOB's) own pull requests: ledger entries, requirement splits, pins before 3 Nov, rulings. | 248 refs |
| `origin/p3/pin-*` | One branch per process pin move from 3 Nov. | ~110 refs |
| `origin/layer-sync/*`, `layer-pin/*`, `train/head/*` | Tranche-into-layer syncs (48), in-place layer pin applies (3, 9 Nov only), merge-train heads (29, 5 Nov). | |
| `origin/found/*`, `lane/*` | Found-mark pull requests (43) and design lanes (33). | |

The process pin is the `.process` git submodule (gitlink in the tree, `.gitmodules` → `https://github.com/neobobkrause/process3`). All 116 pinned commits are on process3's `origin/tranche`. Product-side process configuration lives in `process/config.json`, job records in `process/ledger/*.json` (220 entries) and `process/metrics/*.jsonl`.

One correction to the review's framing: this was not a new or toy product. `main` carries 68,685 commits; at the base the product had about 457,000 lines of source and 684,000 lines of tests across 4,847 files, and 191 requirement files holding 8,838 requirement ids. The first job landings are on 2 Nov (job PRs 3 and 9, 02:39Z and 03:19Z), not 3 Nov 22:18Z.

## 2. Landings per day

A landing is a merge titled `Merge job PR N` (into the tranche, to 5 Nov) or `Merge layer PR N` (into a layer branch, from 6 Nov). 508 in total. Each is classed by what its diff against the first parent touched.

| Day | Landings | Source changed | Tests only | Requirements or docs only | Records only | Distinct jobs | First-time jobs | Marks struck (net) |
|---|---|---|---|---|---|---|---|---|
| 2 Nov | 2 | 1 | 1 | 0 | 0 | 1 | 1 | 1 |
| 3 Nov | 5 | 3 | 1 | 1 | 0 | 5 | 5 | 8 |
| 4 Nov | 135 | 83 | 48 | 1 | 3 | 84 | 83 | 221 |
| 5 Nov | 92 | 48 | 37 | 6 | 1 | 74 | 32 | 253 |
| 6 Nov | 65 | 26 | 15 | 2 | 22 | 48 | 14 | 101 |
| 7 Nov | 128 | 45 | 24 | 15 | 44 | 69 | 34 | 164 |
| 8 Nov | 74 | 23 | 14 | 3 | 34 | 34 | 0 | 11 |
| 9 Nov | 7 | 6 | 0 | 0 | 1 | 6 | 1 | 7 |
| Total | 508 | 235 | 140 | 28 | 105 | 170 | | 766 |

- Review's figures: 135, 92, 126, 75, "about 6" for 4, 5, 7, 8, 9 Nov. Confirmed to within two.
- "Records only" means the merge changed only `process/ledger` and `process/metrics` (typically +3 −1 lines). These are the re-test landings the review mentions. They are 34% of landings on 6–8 Nov and essentially absent on 4–5 Nov.
- Counting only landings that changed source or tests: 131, 85, 41, 69, 37, 6. The fall from 4 Nov to 8 Nov is 72%, not the 45% the raw counts show.
- 170 distinct jobs landed; 57 landed once, 113 more than once. `op-declarations`, `affordances` and `store-assembly` landed 14 times each. Of 338 repeat landings, 92 were records-only and 96 tests-only.
- Lines landed (first-parent diffs of landings): source +29,320 −7,202; tests +60,950 −8,913; requirements +1,906 −2,944.
- In the window the review took from the BOB transcript (8 Nov 11:51Z → 9 Nov 16:48Z) git shows 50 landings: 27 that changed source or tests and 23 records-only. The review has 20 and 27. Same total within three; the split depends on whether a tests-only landing counts as product work.

## 3. Commit composition per day

All commits reachable from any ref, deduplicated, by committer day.

| Day | All commits | State branch | of which usage ledger | Records, pins, sync merges on code branches | Landing merges | Other (requirements, docs, config, other PR merges) | Product-code commits | of which touch source |
|---|---|---|---|---|---|---|---|---|
| 3 Nov | 171 | 90 | 0 | 52 | 5 | 14 | 10 | 6 |
| 4 Nov | 2,890 | 1,314 | 0 | 1,023 | 135 | 162 | 256 | 129 |
| 5 Nov | 4,012 | 2,620 | 0 | 887 | 92 | 162 | 251 | 100 |
| 6 Nov | 2,021 | 1,522 | 61 | 275 | 65 | 120 | 39 | 21 |
| 7 Nov | 4,941 | 3,731 | 1,625 | 762 | 128 | 181 | 139 | 66 |
| 8 Nov | 3,265 | 2,717 | 1,094 | 351 | 74 | 64 | 59 | 38 |
| 9 Nov | 995 | 887 | 370 | 68 | 7 | 20 | 13 | 7 |
| 3–9 Nov | 18,295 | 12,881 (70%) | 3,150 | 3,418 (19%) | 506 | 723 | 767 (4.2%) | 367 (2.0%) |

Share of the day's commits that are product-code commits: 5.8%, 8.9%, 6.3%, 1.9%, 2.8%, 1.8%, 1.3%. State branch share: 53%, 45%, 65%, 75%, 76%, 83%, 89%.

"Product-code commits" are non-merge commits touching product source, scripts or tests. Of the 767, 386 are tests-only. By subject, 69 are notice confirmations with no code change, 20 are re-tests, 42 are reverts or restores, and 169 answer a found mark or completion-round item.

**Usage ledger.** `github: N minute(s) of use` commits: 3,150, from 6 Nov 22:46Z to 9 Nov 15:54Z. Over that life they are 42.5% of state-branch commits (3,150 of 7,416). They pass half in one six-hour window only (7 Nov 00–06Z, 52%). The review's "over half" overstates it; "about two fifths, for 65 hours" is what the record shows. Of the 2,713 pushes the ledger itself counted, 1,936 (71%) were pushes to the state branch, 706 to product branches and 71 to process3. It was mostly measuring the process's own record-keeping.

Other state-branch traffic: 3,293 message commits, 1,738 heartbeat, idle-check and session-list commits, and 4,700 others (layer flow rows, merge-train rows, starts-owed rows, notices).

## 4. Pin moves

Changes to `.process` on the tranche's first-parent line: **116** from 1 to 9 Nov, all distinct, all forward along process3's tranche.

| Day | Pin moves | Median gap between moves | Process commits adopted | Median lag, process merge → product pin |
|---|---|---|---|---|
| 1–2 Nov | 6 | 167 min | 22 | 4–8 min |
| 3 Nov | 8 | 25 min | 24 | 3 min |
| 4 Nov | 45 | 21 min | 80 | 6 min |
| 5 Nov | 18 | 66 min | 45 | 8 min |
| 6 Nov | 7 | 119 min | 27 | 6 min |
| 7 Nov | 10 | 54 min | 38 | 8 min |
| 8 Nov | 12 | 73 min | 28 | 15 min |
| 9 Nov | 10 | 137 min | 27 | 21 min |

4–9 Nov is 102 moves; the review's 98 matches the count of `process: pin <sha>` commits exactly (earlier moves used other titles). The lag column is the sharper fact: a change merged in the process repository was running on the product a median 3 to 21 minutes later, every day. There was no soak.

What each move dragged along:

- **Sync merges.** 1,339 sync merges in the week (1,130 `Bring job/X up to …`, 94 layer-sync commits, the rest train and pin branches) against 508 landings. 592 of them (44%) carried a pin change. 80 carried nothing but the pin, or the pin plus records and config.
- **Layer syncs.** 48 tranche-into-layer syncs from 6 Nov. 47 of 48 brought no product code at all; 27 brought a pin; the other 21 brought a ledger entry, a decision record, a design-lane file or a requirement wording. On 7 Nov there were 22 layer syncs between 17:02Z and 22:33Z, none with product code. Each one obliges every open job in the layer to sync again.
- **Gate runs.** The state branch has gate rows for the layer era only (6–9 Nov): 789 gate runs for 238 layer landings, 3.6 per landing (maximum 16). By trigger: 290 code, 294 record, 205 draft. So 63% of gate runs were not started by a code change.
- **In-place pin applies** (`layer-pin/14-*`, 9 Nov 15:50Z onward) replaced the full sync for a pin-only change. Three were used before the stop.

Could not establish from git: the wall-clock cost of each re-gate before 6 Nov, and the 55-minute full-gate runs the review cites. GitHub Actions run data is not in the repository.

## 5. What product work got done

**Jobs and layers.** `process/ledger` holds 220 jobs across 11 planned layers. At both the tranche tip and the `layer/14` tip: 218 COMPLETE, 2 OPEN (`runtime-limits`, waiting on an unrecorded measure; `ai-accounts-lists`). Layer close times from the state branch:

| Layer | Closed | Deferred modules |
|---|---|---|
| 1, 3, 2 | 4 Nov 01:02Z, 02:13Z, 05:31Z | 2, 0, 1 |
| 4, 5 | 5 Nov 00:08Z, 00:44Z | 1, 3 |
| 6 | 6 Nov 05:53Z | 8 |
| 7, 8 | 6 Nov 14:01Z, 18:41Z | 0, 2 |
| 9, 10 | 7 Nov 03:39Z, 16:10Z | 0, 1 |
| 11 | 8 Nov 06:15Z | 28 |
| 12 (completion round 1) | 8 Nov 22:41Z | 9 |
| 13 | 9 Nov 08:44Z | 1 |
| 14 (completion round 2 of 2) | never | |

Layer 6 took 29 hours (the merge-train day). Layer 11 closed with 28 modules carrying deferred marks.

**Requirement marks.** `*(not yet met: T53…)*` marks in `build/requirements`: 899 at the base, 357 at the end. 542 struck, 60% of the tranche's marks. By layer tip: 525 (layer 7), 515, 502, 490, 359 (layer 11), then 357, 357, 357. Almost nothing was struck after layer 11 closed; layers 12–14 worked on found marks instead. 183 `F` (found) marks were added during the week and 132 of them were met.

