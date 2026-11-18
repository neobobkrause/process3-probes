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

