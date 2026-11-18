# Process3 post-mortem: a sample of the changes that added or removed checks, 1–9 Nov 2026

Independent analysis of `/home/user/neobobkrause/process3` (read-only). The record is the commit and merge messages on `origin/tranche` plus `DECISIONS.md`; pull-request descriptions were not available. Every quotation is from a commit message, a merge message or a decision record. Classifications (what counts as "adding a check", what triggered it, whether it fails closed) are my judgment from that text and, where stated, from the diff.

Two reading notes. Merge times are in the owner's local time (UTC−8) as the merge commits record them; times inside quoted messages are UTC. "The copy" is the product repository the process was building.

## Summary

- **121 of the 296 merges into the integration branch (41%) added or strengthened a check**, gate, refusal, hold, review requirement, audit, alarm or bookkeeping duty. They carry 60% of all tool code lines added. 61 merges removed or loosened one.
- In a sample of 72 additions, **9 (12%) weighed any cost of the check** and **8 (11%) mentioned doing nothing or accepting the risk** (another 6 set aside part of a reviewer's list). **32 (44%) guarded against something never observed; 22 (31%) against something seen once.** 54 (75%) fail closed.
- **The process fed itself.** Across all 121 additions the primary trigger was a failure of the process's own earlier machinery in 46 (38%), a plan line in 30, the owner's words in 26, a reviewer's constructed case in 13, and a product defect in 5 (4%).
- **Half of what was added did not last.** 34 of the 72 sampled checks (47%) were removed, materially loosened or superseded by 9 Nov; those lived a median of 28.0 h, and 9 lived under four hours. The survival estimate puts the half-life of an added check at about 5 days.
- **The checks that held up ran the product.** Checks that execute the product's own tests, build or walk were mostly kept without repair; checks on the process's own records, and flow holds, were mostly removed. The pattern is in section 5.
- The owner's instruction of 5 Nov ("add a check only when study and data show it is needed") did not change the rate: 71 of the 175 merges up to it added or strengthened a check (41%), and 50 of the 121 after it (41%).

## 1. Every merge into the integration branch

The full table of all 296 first-parent commits on `origin/tranche` (date, PR, branch, my class, commit count, lines added and removed in tool code, tests, text and data, keyword counts, subject) is at `/tmp/claude-0/-home-user/5fb00928-6c32-53d3-a000-4e1f643cb17f/scratchpad/work/all_merges.tsv`. Tool code is `.mjs` and workflow `.yml` outside `tool/test/`; tests are `tool/test/`; text is Markdown.

| Day (local) | Merges | Add a check (A) | Mixed: feature that also adds refusals (a) | Loosen or remove (L) | Feature / fix (F) | Text, decisions, owner patches | Code lines +/− | Test lines +/− |
|---|---|---|---|---|---|---|---|---|
| 01 Nov | 9 | 2 | 1 | 1 | 3 | 2 | +1,738 / −61 | +995 / −2 |
| 02 Nov | 28 | 10 | 2 | 2 | 6 | 8 | +2,725 / −976 | +3,732 / −1,046 |
| 03 Nov | 61 | 19 | 6 | 9 | 26 | 1 | +7,213 / −1,114 | +8,432 / −203 |
| 04 Nov | 49 | 14 | 7 | 14 | 14 | 0 | +4,994 / −1,184 | +6,041 / −413 |
| 05 Nov | 34 | 6 | 8 | 4 | 12 | 4 | +6,922 / −1,358 | +8,243 / −1,036 |
| 06 Nov | 47 | 18 | 5 | 9 | 9 | 6 | +7,178 / −4,359 | +7,433 / −5,767 |
| 07 Nov | 23 | 5 | 2 | 8 | 3 | 5 | +1,235 / −361 | +1,665 / −149 |
| 08 Nov | 31 | 8 | 4 | 6 | 2 | 11 | +2,819 / −518 | +2,947 / −336 |
| 09 Nov | 14 | 3 | 1 | 8 | 1 | 1 | +1,918 / −2,605 | +2,289 / −2,899 |
| **All** | **296** | **85** | **36** | **61** | **76** | **38** | **+36,742 / −12,536** | **+41,777 / −11,851** |

In nine days the tool went from nothing to about 24,200 lines of code and 29,900 lines of tests at the tip. Of 776 non-merge commits, 285 (37%) are review-fix commits ("review fixes", "cold review's findings", "confirming review"); they added 10,924 code lines, a quarter of all code added. The 259 merges that record a count ran 365 review rounds; 17 ran three or more, each with a recorded "Decision:" line allowing it.

## 2. How many merges added or strengthened a check

A keyword pass over the diffs (added lines containing refus-, fail closed, finding, hold, owed, alarm, audit, blocked, must, never, reject, stale, unread) found a net increase of such lines in 223 of the 296 merges, and of five or more in 162. That pass over-counts, because features and fixes also print refusals.

By judgment from the commit messages, **121 merges add or strengthen a check: 85 whose main purpose is the check and 36 features or fixes whose merged diff also adds refusals, holds or duties**. Four of the 85 are decision-record-only merges that create a duty (PRs 254, 257, 280, 283). Two owner patches (PRs 9, 12) added deny rules and are counted with the owner's patches, not here. The class of every merge is in the `class` column of the table.

Primary trigger for each of the 121 (sampled ones read in full; the rest from the first commit's message):

| Trigger | Merges | Share |
|---|---|---|
| Failure of the process's own earlier machinery | 46 | 38% |
| Product defect that reached or nearly reached main | 5 | 4% |
| A plan or ledger line | 30 | 25% |
| The owner's words | 26 | 21% |
| A reviewer's finding or constructed case | 13 | 11% |
| Nothing cited | 1 | 1% |

Even where the primary trigger was something else, review rounds added further refusals: 104 of the 117 code-bearing additions contain at least one review-fix commit.

## 3. The sample: 72 additions

Spread over all nine days, weighted toward the larger changes, and including every addition I could find from 7–9 Nov (PR 257 is covered under 258, and PR 261 under 260). PR 3 is split into its two mechanisms because their fates differ. "Net" is code lines / test lines, added minus removed, for the whole merge. Life is from the adding merge to the merge that removed or first materially loosened the check.

### 1–2 Nov

| PR | Mechanism added (net code / test) | Trigger | Cost weighed? | "Do nothing" mentioned? | Failure seen | Fails closed | Later fate |
|---|---|---|---|---|---|---|---|
| 1 | Record check in CI: file-size limit, transient paths, approvals block editable only by the owner's website commit; ledger schema check (+530 / +256). *checks records* | e: plan / ledger line. "Phase 1 build job A" (REC-9, REC-10); review passes 2 and 3 added approvals-heading and workflow-removal findings | no | no | never | yes | **Kept, repaired 3+ times.** Present. First loosened 3 h later (PR 5: 947 findings in pre-process history, 5 min 23 s run); false-positive repairs in PRs 20, 83, 86, 93, 101, 102, 234 |
| 3a | Gate: CI runs the module's own suite on the merged state; revert check (tests must fail when the change is reverted) (+461 / +249). *runs the product* | e: plan / ledger line. "Phase 1 build job C"; five review passes | no | partly: "Stated limit: product code that subverts the gate from inside its own runner is out of the gate's scope (BOB's decision, for Bob's page)" | never | yes | **Kept, repaired 3+ times.** Present. Revert check made advisory 5 Nov (PR 177), restored as a finding 10 h later (PR 185). The suite run is the check the record credits with catches ("20 refuted job claims today", PR 118) |
| 3b | Receipt check: the job's own claim of what it tested is compared with CI's run; merge needs an agreeing receipt; gate rows trusted only via run artifact (+461 / +249). *checks records* | e: plan / ledger line. same build; anti-forgery rules came from review passes ("so a session cannot forge or edit a green run") | no | no | never | yes | **Removed.** Life 3.9 d (ended by PR 177). About 20 follow-up merges touched it (40, 64, 74, 81, 95, 101, 108, 122, 126, 134, 155 ...). Removed 5 Nov (PR 177: no catch in 1,187 gate runs), restored 10 h later (PR 185), removed for good 9 Nov (PR 296; Bob: "get rid of it completely") |
| 13 | Gate workflow split in two jobs so product code cannot read a write token; post job refuses rows naming another run/head (+168 / +167). *trust rule* | c: reviewer / hypothetical. "Product code could read a write token from the gate's own process (setup audit, 2 Nov)" | no | no | never | yes | **Kept.** Present; simplified by PR 111 ("gate never posts") |
| 15 | setup check: ~12 repository conditions read through the API; job start runs it first and refuses when any is "missing" (+231 / +290). *checks records* | e: plan / ledger line. setup list from the plan; DEVELOPER.md is "Bob's direction, 2 Nov"; confirming review made the bypass check "fail closed" | no | no | never | yes | **Loosened.** Life 7.0 d (ended by PR 296). Refused every job start on the copy after Bob applied new settings (C17, PR 230); read a Cloudflare 429 as "missing" and stopped a pin move (C20, PR 235); grew to ~15 min, twice per pin move (C50, PR 289); cut to once per pin on 9 Nov (PD-21) |
| 16 | Record check: any change under .claude/ not made by the owner on GitHub's website is a finding; merges cannot roll guarded files back (+38 / +175). *trust rule* | d: owner's words. "Settings are the owner's (Bob's standing rule: sessions never change permission settings)"; rules 2 and 3 from confirming reviews | no | partly: "every finding within the threat model fixed, the rest recorded as known limits" | never | yes | **Kept, repaired 3+ times.** Present. 15 false findings on the copy's layer/10 when merges carried Bob's own commit (C19, PR 234); tightened again by review (C21, PR 238) |
| 24 | setup check gains approvals, classic-protection, session-branch and deploy-token conditions (ten review passes) (+208 / +393). *checks records* | e: plan / ledger line. developer steps; passes 2-10 were re-review findings on session-branch edge cases | no | no | never | yes | **Loosened.** Life 5.6 h (ended by PR 32). Its approvals reader and session-branch helpers were cut by PR 32; deploy-token later misread a 429 (PR 235) |
| 26 | Approvals "newest owner block" rule with history walk, date floor, carry-dating (six review passes) (+376 / +769). *trust rule* | c: reviewer / hypothetical. "Review follow-ups (2 Nov)"; each re-review found another way a stale approvals block could arrive | no | partly: "the rest listed as known limits or owed (coordinator's word)" | never | yes | **Removed.** Life 3.1 h (ended by PR 32). Removed by "Build J: cut the tool back" (PR 32): "Drops the history machinery, the date floor, carry-dating, the owner's-own range and eligibility" |
| 28 | start check (exit 1 when the session's HEAD or approvals differ from its start branch); refusal counter; one-act PreToolUse hook (dropped before merge) (+175 / +255). *checks records* | e: plan / ledger line. "Build H, session safety" | no | yes: "Drop the one-act hook from build H (BOB's word): the script, its tests and its README text" | never | yes | **Kept.** Present; its depth-1 fetch dropped next day (PR 88: "it cut the history BOB's merge needs") |
| 29 | Review-round limit: merge refuses a third review round without a recorded --decision (+25 / +44). *flow control* | e: plan / ledger line. "Build I: the loop guard"; narrowed by BOB's design audit | no | yes: "Design audit (BOB, 3 Nov): PR 29 narrows to the review-round limit and the one-act line" | more | partly | **Kept.** Present and never binding: 17 later merges record 3 or more rounds with a "Decision:" line (PRs 95, 97, 98 ran five) |
| 34 | Hourly sweep with heartbeat and a daily watcher that takes over a silent ROOT (+180 / +130). *flow control* | e: plan / ledger line. Foundations, scheduled tasks around ROOT | no | yes: "8 what-ifs left as notes" | never | no | **Kept.** Present; extended (PRs 45, 115, 139, 219) |

