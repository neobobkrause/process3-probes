# [file] study.md (continued)

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


# [file] cross-tree-front-door-test-result-20261117.md

# Owner-created front-door cross-tree messaging test

**Status:** Owner-provided experimental result, recorded 17 November 2026. The original tester's direct tool transcript was not fetched here; observations below are sourced from the owner's pasted test report. Not an owner-approved change to Process4 architecture.

## Reported observed attempt

- Sender: an independent owner-created Codex chat.
- Intended target: existing Process4 logical PROCESS at native handle `/root/p4_root_g3/p4_process_g3`, belonging to a **different** owner console/agent tree.
- Attempted mechanism: `collaboration.followup_task` with the exact agreed read-only marker probe.
- Exact returned error: `live agent path /root/p4_root_g3/p4_process_g3 not found`.
- Outcome: no message delivery, processing acknowledgement, marker reply, idle wake, or second exchange.
- Other observation: app tools could inspect the other console by thread ID but exposed no sender operation from this independent chat. Another Dot test's transcript mentioned `cloud_threads.send_message`, but that tool was unavailable here and its cross-tree scope is unproved.

The previous standing bootstrap console **did** route an owner question to PROCESS in its own native tree; evidence: `neobobkrause/process3-probes` branch `codex/p4-grants-broker-20261116`, `bootstrap/native/INTERACTIVE-SESSIONS.md` and `bootstrap/evidence/interactive-sessions/actual-interactivity.json`.

## Interpretation and implications

- Native collaboration handles are **tree-scoped in the tested sender context**, so a manually created independent front door cannot simply use the earlier bootstrap's native agent path. This does not show whether that exact instance is still live in its original tree, or prove no platform-level cross-thread messaging interface could ever exist.
- Existing first-class-session creation research reached decision C for currently exposed subscription-hosted tools; the Dot pilot did not yield the intended native Codex task. A separate owner-created front door is **not a demonstrated workaround**.
- Avoid recurring tests with the same tool surfaces, speculative login/credential repairs, metered Agents API, or high-frequency GitHub relay. Existing implementation and evidence remain valuable but do not satisfy independent first-class owner-visible roles.
- Reopen the architectural feasibility issue only on **new supported capability evidence** (e.g., officially exposed same-account cloud thread creation and by-ID add-turn available to hosted agents, or a tested Dot/other first-party route that both appears in the ordinary Codex session list and supports cross-session messaging).
- An owner decision to accept a single-console/subagent UI architecture would be a **change of essential UX requirement**, not a passing result for the original specification.

**References:** https://github.com/neobobkrause/process3/blob/process4/process4/working/codex-first-class-feasibility-20261117.md and https://github.com/neobobkrause/process3/blob/process4/process4/working/dot-versus-owner-front-door-feasibility-20261117.md.


# [file] point2_process_rule.md (later part)


---

## 5. What Process3's record shows about rules held only by text

| Fact | Source | Mark |
| --- | --- | --- |
| The fifth draft holds 51 rules by text; something physical stands behind six in whole or part. The first round counted 36 in the second draft, with three held. | `working/audit2_corruption.md`:448-506, summary :506 | A (the count is the drift auditor's) |
| Sessions made 270 of the 296 changes merged into the process; Bob 26. | `git log --first-parent --format=%an origin/tranche` in `/home/user/process3` | V |
| 121 of those 296 merges (41%) added or strengthened a check; they carry 60% of the tool code added. | `evidence/change_sample.md`:9 | A |
| His instruction of 5 Nov ("add a check only when study and data show it is needed") did not change the rate: 71 of 175 before it (41%), 50 of 121 after it (41%). | `evidence/change_sample.md`:14 | A |
| The process version in the product was moved 116 times in nine days, all by sessions, 102 of them in six days. | `evidence/product_side.md`:82, :233 | A |
| The one restraint with something hard behind it held all week: role texts capped at 4,096 bytes by a test stayed at 4,032 to 4,197 bytes, while the tool's code grew from 1,431 to 23,429 lines. | `evidence/causal_forensics.md`:29, :310 | A |
| The restraint rule was a "Nudge" read once at start; checks were code that refused on every call. | `evidence/causal_forensics.md`:26, :308 | A |
| The product's CLAUDE.md, under a thirty-line rule, went from 641 bytes to 8,664. | `working/audit2_corruption.md`:499; sizes: `ls` on the clone's main (641) and `evidence/permissions_inventory.md`:30 (8,664) | 641 V; 8,664 A |
| A limit on review rounds was overridden all 17 times it applied. | `working/audit2_corruption.md`:484 | A |
| 211 test files (11,410 lines) written for the process sat among the product's tests, each carrying the label asked for. | `working/audit2_corruption.md`:482; `definition/process4_counterarguments.md`:111 | A |
| No case was found of the permission checker enforcing a "never" that had no deny rule or GitHub rule behind it. Every "never" that held (force-push, deleting a branch, main) also had one. | `working/enforcement_levers.md`:141-142, :258 | A |
| The rule against adding checks was never in his committed approvals in Process3: it was a "Nudge" in rulebooks, a line in three role prompts and his words in chat. "So 'text alone did not hold' was measured for the weaker channels, not for this one." | `working/enforcement_levers.md`:145 | A; that no such rule is in either approvals text today is V (2a) |
| "No session in the record attacked branch protection or routed around a denied permission." | `working/assessment_doc.txt`:218 | A (a session's statement on his page) |

(J) Read together: where GitHub or a deny entry stood behind a rule, the record shows no session breaking it; where only words stood, the rule drifted. That is a statement about Process3. It does not show that any means in section 4 would hold in Process4; none has run.

---

## 6. What is Bob's to decide, and what is technical

### Bob's

1. **Whether anything physical stands behind his rule.** Options, with the cost of each to him as the evidence gives it:
   - (a) Words only, as now. No act. The risk he named stays.
   - (b) Words in his own committed approvals in the process's repository (means 6). One commit; one more whenever the wording changes; each edit stops long-lived sessions if the start-up comparison is kept. Not physical, never tried.
   - (c) A branch only he can update (means 2), with or without the product's version held the same way (means 5). One sitting of settings; then one merge on GitHub's website for each approved change or group, and possibly a second act for the product's move. Nothing reaches products while he is away. Never tried.
   - (d) The sessions' account cannot write the process's repository at all (means 1). As (c), and PROCESS cannot keep its proposals there. Never tried.
   - (e) Only the part of the process that can stop a merge is held, and texts stay open (combination B). An act only when that part is faulty. Never tried; never put to him.
