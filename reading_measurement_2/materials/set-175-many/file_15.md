# Verification of the Process3 forensic review against the git record

Verifier pass, 13 Nov 2026. Record: `/home/user/neobobkrause/process3` (read-only; nothing pushed, no ref changed).
Review under test: `/tmp/claude-0/-home-user/5fb00928-6c32-53d3-a000-4e1f643cb17f/scratchpad/work/review.txt`.
GitHub API not used. Everything below is from git objects only. Times are UTC unless marked PT (the merge commits carry -08:00).

Verdict scale: confirmed / roughly right / wrong / cannot be checked from git.

## 0. Method and scripts

All scripts are in `/tmp/claude-0/-home-user/5fb00928-6c32-53d3-a000-4e1f643cb17f/scratchpad/v/`:

| Script | What it does | Output |
| --- | --- | --- |
| `series.py` | For each of the 296 first-parent commits of `origin/tranche`: lines in `tool/lib/**` + `tool/p3.mjs` (code), `tool/test/**` minus fixtures (tests), fixtures, "refus" counts, `test(`/`it(` counts | `series.json` |
| `series2.py` | Same commits: `fail(` call sites, `throw`, setup conditions, PD/BD headings, P-numbers, line/byte size of prompt, rulebook and governing files | `series2.json` |
| `numstat.py` | `git log --first-parent -m --numstat --no-renames` per merge, split by area | `numstat.json` |
| `prlist.py` | One record per merged PR: deltas plus the PR's own non-merge commit subjects/bodies (`git log --no-merges <merge>^1..<merge>^2`) | `prs.json`, `prlist.txt` |
| `classify.py` | My hand labels for a 118-PR systematic sample and the tally | stdout |
| `phrases.py` | `git grep -i -c -E <phrase> <commit>` at every first-parent commit, printing each change in which files hold the phrase | `phrases.txt` |
| `blame_deleted.py` | Age of the lines a commit deletes (`git diff -U0` then `git blame --line-porcelain <parent>`) | stdout |

Plain git commands that reproduce the headline figures without the scripts:

```sh
cd /home/user/neobobkrause/process3
git rev-list --all --count                      # 2459
git rev-list --count origin/tranche             # 1269 ; origin/main 40
git log --first-parent --format='%s' origin/tranche \
  | grep -c -E 'Merge PR [0-9]+|Merge pull request #[0-9]+|\(#[0-9]+\)$'     # 294
# merges per day, UTC and Pacific
TZ=UTC git log --first-parent --date=format-local:'%Y-%m-%d' --format='%cd %s' origin/tranche \
  | grep -E 'Merge PR [0-9]+|Merge pull request #[0-9]+|\(#[0-9]+\)$' | cut -d' ' -f1 | sort | uniq -c
TZ=America/Los_Angeles git log --first-parent --date=format-local:'%Y-%m-%d' --format='%cd %s' origin/tranche | (same pipe)
# size and string counts at a commit C  (237c02a = PR 37, 0819c83 = PR 293 peak, cd2254a = end of 8 Nov, 38b0f3f = tip)
git grep -c '' C -- tool/lib tool/p3.mjs | awk -F: '{s+=$NF} END{print s}'          # tool code lines
git grep -c '' C -- 'tool/test/*.mjs'   | awk -F: '{s+=$NF} END{print s}'          # test lines (fixtures excluded)
git grep -o -i 'refus' C -- tool/lib tool/p3.mjs | wc -l                            # "refus*" strings
git grep -o -i -w -E 'refuse|refusal' C -- tool/lib tool/p3.mjs | wc -l             # the two exact words only
git grep -E '^\s*(test|it)\(' C -- tool/test | wc -l                                # tests
git grep -o -E '(^|[^A-Za-z0-9_.])fail\(' C -- tool/lib tool/p3.mjs | wc -l         # fail() call sites
# gross written / deleted, PR granularity
git log --first-parent -m --numstat --no-renames --format='@@%H' origin/tranche -- tool
# a merge's own figures
git diff --shortstat <merge>^1 <merge>            ;  git diff --shortstat <merge>^1 <merge> -- tool
```

Definitions used throughout: **tool code** = `tool/lib/**` + `tool/p3.mjs`, raw line count (`wc -l` equivalent, blank lines and comments included). **Tests** = `tool/test/**` excluding `tool/test/fixtures/**`. This is the review's own definition ("tool/lib and p3.mjs") and reproduces its baseline exactly, so the comparison is like for like.

## 1. Pull requests and merges per day

| Claim | Measured | Verdict |
| --- | --- | --- |
| 2,459 commits | `git rev-list --all --count` = 2,459 | confirmed |
| "302 pull requests", "rewrote its own tool 302 times" | Highest PR number is 302. **294** are merged on `origin/tranche` first-parent (the 296 first-parent commits are 2 direct commits on 1 Nov + 294 PR merges). #8 and #21 merged to `main` only. #199 merged into another build branch and reached tranche inside PR 191. #104, #158, #178, #271, #297 never merged (158 "stopped on Bob's word", 271 closed, 297 "waits for Bob", per the coordinator log). Of the 294, **252** changed tool code; 42 did not (14 are the owner's own `neobobkrause-patch-*` approvals/settings edits, 24 are decision-record, governing, rulebook, setup or workflow text, 4 change tests only). | roughly right: 302 is PRs opened, not merges, and not all are tool changes |
| 61 merges on 3 Nov | UTC: 30. Pacific (-08:00): **61**. | confirmed only in Pacific time |
| 75 merges on 4 Nov "(UTC)" | UTC: **75**. Pacific: 49. | confirmed in UTC |
| 16 by early afternoon 9 Nov (to 14:20Z) | 16 merges with commit time <= 14:20Z (the 17th is at 14:23Z). Whole UTC day: 25. | confirmed |

Per day (PR merges on tranche first-parent):

| Day | UTC | Pacific |
| --- | --- | --- |
| 1 Nov | 3 | 7 |
| 2 Nov | 22 | 28 |
| 3 Nov | 30 | 61 |
| 4 Nov | 75 | 49 |
| 5 Nov | 46 | 34 |
| 6 Nov | 25 | 47 |
| 7 Nov | 40 | 23 |
| 8 Nov | 28 | 31 |
| 9 Nov | 25 | 14 |
| total | 294 | 294 |

**The review's day table mixes time zones.** Its "3 Nov: 61" is a Pacific day and its "4 Nov: 75 (UTC)" is a UTC day; the two windows overlap by 8 hours (4 Nov 00:00Z to 08:00Z, which is 3 Nov 16:00 to 24:00 PT), and **41 merges are counted in both figures**, so the two cannot be added or read as consecutive days. In one consistent zone the peak day is 75 (UTC, 4 Nov) or 61 (Pacific, 3 Nov), never both.

## 2. Tool size

| Claim | Measured | Verdict |
| --- | --- | --- |
| Baseline at PR 37 (2 Nov evening PT): 3,120 lines, 213 tests, 18 setup conditions | PR 37 = `237c02a`, 3 Nov 02:21Z (2 Nov 18:21 PT): 3,120 code lines, 3,679 test lines, 213 `test(` calls, 18 entries in `setup/conditions.json` | confirmed exactly |
| Peak 23,900 on 9 Nov | Peak is **24,897** at PR 293 (`0819c83`, 9 Nov 14:23Z), with 30,986 test lines. No commit on the series reads 23,900 (nearest: 23,798 at PR 286, 23,696 at PR 284). | roughly right, understated by about 1,000 lines (4%) |
| "about sevenfold" | 24,897 / 3,120 = 8.0x at peak; 23,429 / 3,120 = 7.5x at the tip | roughly right |

Series at the last merge of each UTC day (`series.json`, `series2.json`):

| End of UTC day | Tool code lines | Test lines | Fixture lines | `test(` calls | `.test.mjs` files | "refus*" strings | `fail(` sites |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 Nov | 1,332 | 709 | 0 | 49 | 5 | 5 | 49 |
| 2 Nov | 2,739 | 3,792 | 0 | 230 | 8 | 17 | 100 |
| PR 37 (3 Nov 02:21Z) | 3,120 | 3,679 | 0 | 213 | 14 | 62 | 141 |
| 3 Nov | 5,175 | 5,760 | 0 | 302 | 23 | 107 | 243 |
| 4 Nov | 11,037 | 15,202 | 272 | 708 | 57 | 187 | 408 |
| 5 Nov | 16,887 | 23,294 | 272 | 1,016 | 83 | 337 | 568 |
| 6 Nov | 19,085 | 22,598 | 1,044 | 1,009 | 86 | 371 | 678 |
| 7 Nov | 21,670 | 26,526 | 1,044 | 1,157 | 103 | 480 | 710 |
| 8 Nov | 22,854 | 28,174 | 1,044 | 1,216 | 109 | 507 | 755 |
| 9 Nov peak (14:23Z, PR 293) | 24,897 | 30,986 | 1,044 | 1,298 | - | 519 | 814 |
| 9 Nov tip (18:13Z, PR 302) | 23,429 | 28,882 | 1,044 | 1,223 | 112 | 464 | **818** |

The tool began 9 Nov at 22,854 code lines and ended it at 23,429: the audit day, cuts included, was net **+575** code lines.

## 3. "refuse / refusal" strings: 62 -> 507

Measured: case-insensitive substring `refus` in tool code = **62** at PR 37 and **507** at the end of 8 Nov (PRs 269 to 280). Verdict: **confirmed**, with three qualifications.

