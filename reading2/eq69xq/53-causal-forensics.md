### 4.2 An owner sentence expanded into a mechanism larger than what was said

| Owner's words (verbatim in the log) | What was built |
| --- | --- |
| 6 Nov 18:15: "It seems to me that we keep hitting items when checks are refusing modules with no ledger entry. Can we anticipate those conditions arising so that we can handle them either preemptively or more efficiently when they're identified?" | "R15 preflight ...: a consistency census (entries, rows, requirements, on-branch), run in setup, status, layer open and as n+1/n+2 lookahead; dry-run preflight of next-layer starts; gate finding; batch-PR contents; canon line." PR 204 (`82a9b42`), canon P25. Its first form "refused `layer open`" (PD-4). On 7 Nov it refused every job start (C17). |
| 6 Nov 17:00: "Go with option 2, fix it in the tool, not just for this case, but fix process3 to anticipate and address these kinds of situations." (about one refused `hold --end`) | "R13 ... inventories every conditioned or staleable record; structured end conditions are ended by the tool ...; free-text-only conditions are refused at creation; ... status and sweep run a stale sweep; a Foundations line (Bob's)". PR 200 (`e2fb419`), canon P24, `ends.mjs`, `expire.mjs`. |
| 6 Nov 19:00: "I wonder if there's a way to anticipate or test for issues related to account switching now" | "R16 switch readiness ...: inventory account-held state ... with a test of each; dry-run, preflight and a probe rehearsal ...; a canary checklist ...; a canon line." PR 213, canon P26, `switch.mjs` 34 KB, runbook 3 KB to 8 KB. |
| 6 Nov 23:15: "Is there a way for you to check that all github traffic is going through and tracked by your new mechanism?" and 23:25 "make sure that all traffic is being monitored and limited as needed." | "enforce through .claude/settings.json ...: deny raw git push/gh, PreToolUse hook `p3 github hook` on mcp__github__* and Bash; count fetches; hourly `github audit`." PRs 205 to 211. PD-22 (9 Nov) on the result: "about 11 builder fixes in three days went into that machinery" and "Primary use never went above about 12% of the limit". |
| P27, Bob, 6 Nov: "80% or 90% of github's published limits" | PD-3, "a ceiling of the process's own, `pacing.pushes_per_hour`, default 120", for pushes, where "GitHub publishes no limit". Bob, 7 Nov: "this baseless overcaution NEVER happens. NEVER!" |
| 6 Nov 23:45: "All I can say is BE CAREFUL. I don't want to lose access to this account too." | "RULED: one job at a time ..., copy config pacing.jobs 1, pushes_per_hour 60; ... BOB spaces writes >= 1 min, polls >= 2 min". Reversed the same hour on "BOB keeping writes 1 minute apart sounds excessive." |
| 7 Nov 00:10: "you not just fix that problem but also try to determine the cause of the problem and fix that so that the set of problem types tend toward zero." | `notes/problem-classes.md`: "Rule (coordinator's, from 7 Nov): every finding records its root cause; every fix brief names the class-level prevention". Classes C1 to C61, each a tool change, several with speculative TODOs ("a check that every command a START/rulebook names is allowed by the repo's settings"; "lint for tests comparing outputs that embed now()"). |
| 5 Nov 01:13: "why did Process3 not catch it" and 01:24: "urgency must be integral to the process, not prompt text" | "build/flow-control ...: starts owed as state gating BOB's other acts; every empty slot classified ...; flow samples on every p3 run ...; measured safety signals as tool-set holds ...; cap check on job start <id>; ... fault-injection tests." Also `hold.mjs`, the idle-capacity alarm, `targets`. |
| 8 Nov (BD-R4): "perhaps the last 2 or 3 versions" | "the last 3 releases (the coordinator's reading of "2 or 3", the safer end)". |

The last-but-one row matters most for the causal account. The owner himself ruled that speed must be held by mechanism and not by prompt text. So even the remedy for over-caution arrived as gates, alarms and required records.

## 5. The self-audits

| When | What it was | What it found | Acted on | Reversed | Growth resumed |
| --- | --- | --- | --- | --- | --- |
| 3 Nov 01:05 | "Design audit (BOB, 3 Nov)" on PR 29 (`50c04e7`) | budget-per-attempt and loop-guard code not needed | removed 441 lines before merge (`session.mjs`, `loopguard.test.mjs`) | no | same day: 3,120 to 9,001 lines by end of 3 Nov |
| 4 Nov 14:50 | Owner: trust-layer review "aimed at simplifying it, not adding to it" (`origin/review/trust-layer-4nov`, `0fc4373`) | trust files grew 1,527 lines; "the 4 to 5 review rounds ... were spent closing deliberate constructions"; about 1,100 lines removable | its section 0 is "Fix first: one place where O3 does not hold today"; groups A done | the fork "either the README's line is the policy, and much of that code can go" was settled the protective way (threat model b) | no net fall: 4d handoff, same day: "The cap is NOT met" |
| 4 Nov | defect sweep (`notes/defect-sweep-4nov.md`), "13 ranked, 7 lower" | tool defects | "Builds started 05:00 from it" | no | it was itself growth |
| 5 Nov 14:40 to 16:00 | owner-asks study after the 9-hour wait | "no coordinator rulebook"; "14 were mechanisms"; "'BOB'S WORD' lines mix his words with ours" | handoff 5nov-g carries no rules | the proposed fix was a rulebook build (PR 158), which the owner stopped: "another hack that doesn't scale" (15:27) | rule sections back in handoffs within 24 h |
| 5 Nov 19:18 to 20:57 | Owner: "TOO cautious ... We only add additional checks when we can confirm from factual study and data that a check is really needed." Check audit over "1,187 gate runs on 207 job PRs" | no catch from receipt comparison, smoke list, start size-cap refusal, branch-bound, gate-check-bind, amended-receipt re-gate | PR 177 `dce01e3` (commit `2746aa1`): removed them, revert check made advisory; security-path trigger removed; a what-if withdrawn. Net 278 lines and 6 `fail(` sites | yes, in about 10 hours: "Audit 2 ... JOB-12 was a Keep that 177 reversed under Bob's name"; PR 185 `491a48d` "audit-restores" brought back the revert gate (AUD-1) and receipt comparison (AUD-2) | 9 hours: PR 183 `48d42ed` (layer branch) added 909 lines and 50 `fail(` sites at 05:56 UTC 6 Nov |
| 5 to 6 Nov | Audit 2 "against the Foundations and the Ledger map" | 20 citation claims; departures from kept Ledger lines | AUD-1 to AUD-9: restores, `DECISIONS.md`, "about 54 sites fixed" for citations, triage lanes and register (`register.mjs` 17 KB) | no | this audit was net additive |
| 7 Nov | caution reversals after owner rebukes | PD-3's ceiling "would not have prevented the suspension it was set against" | PD-4 (flag, not refuse), PD-5, PD-6; "TEST for each new caution: what does it protect, what does it cost" | no | same day: C19 to C27, nine tool changes |
| 9 Nov 14:00 | Velocity audit (`notes/velocity-audit-9nov.md`, `44e9e52`) | "9 Nov: process3 merged 16 PRs; the product landed 3"; "Refusal/throw sites (proxy): 272 (4 Nov) -> 1,108"; "~38 [of C2-C54] fix defects or slowness that earlier process changes made"; 98 pin moves; 19 of 35 safeguards coordinator only | K1 to K9; C58 `b115b83` (PD-22, 1,589 lines out of `tool/lib`), C57 `daf6cc3` (PD-21, receipt removed), C55 (PD-19b) | not within the record | 73 minutes: C59 `58f9682` (direct flow) added 386 lines and 22 `fail(` sites. The tip has 818 `fail(` sites against 814 before the audit |

Pattern: every audit produced artifacts. Two were subtractive in lines. The subtraction of 5 Nov was partly undone by the next audit, because that audit measured conformance to the approved canon, and the canon lists the removed checks as "Kept".

## 6. Fail-closed design at the tip

Method: all 801 single-line `fail(` messages in `tool/lib/*.mjs` and `tool/p3.mjs` at `38b0f3f`; a random sample of 90, classified by what would go wrong if the refusal were absent.

| Class | Count of 90 | Share |
| --- | --- | --- |
| Guards the product or the merged result (a product defect, a stale or ungated merge, an unreleased artifact could get through) | 11 | 12% |
| Guards the owner's hard prohibitions (force push, delete, owner-only files) | 3 | 3% |
| Guards the process's own state, sequence or records (wrong role state, a record already written, an address moved, a pin behind, a clone too shallow to answer) | 39 | 43% |
| Validates the shape of an argument or of the process's own config | 37 | 41% |

So about one refusal site in seven protects the product or the owner's limits. The product-facing checks proper live elsewhere and are few: the gate (`gate.mjs` has 8 `fail(` sites and 26 finding sites) runs the suite, the revert check, the imports and ownership checks and generated-file freshness. By file, the refusals sit in flow control: `layerflow.mjs` 128, `job.mjs` 103, `merge.mjs` 95, `p3.mjs` 56, `lane.mjs` 44.

Ten representative sites:

| # | Site | Message | Guards |
| --- | --- | --- | --- |
| 1 | `merge.mjs:433` | "${branch} changes files outside its module" | product (ARC-2) |
| 2 | `merge.mjs:402` | "${branch} moved since the gate ran; run merge again" | product (the gated tip is what merges) |
| 3 | `tranche.mjs:290` | "tranche close waits: the release deployment of ${rel.version} and its walk are owed" | product (release walked) |
| 4 | `p3.mjs:609` | "a refspec never starts with + (a force) or : (a delete)" | owner's prohibition |
| 5 | `merge.mjs:134` | "say whether a fresh reviewer ran: --reviewed "<what>" or --no-review "<why>" (INT-2)" | process record |
| 6 | `merge.mjs:133` | "--no-review may not cite Q38: Q38 has no source; give the reason itself" | process record (the wording of a justification) |
| 7 | `register.mjs:63` | "chosen_by quotes the dated words that chose it, as Bob, <date>: "<his words>"" | process record (citation form) |
| 8 | `hold.mjs:152` | "--prs ..., --when ... or --until ...: an ..." (a hold in words alone is refused) | process record |
| 9 | `job.mjs:898` | "the tranche runs process ${short(theirs)} and this branch ${short(mine)}: run `job sync` ...; nothing was run" | process state (pin) |
| 10 | `status.mjs:82` | "--sessions ${file}: list_sessions has more pages (has_more) ..." | process input (a session count) |

Others of the same family: `state.mjs:544` "at most ${HANDOFF_MAX.notes} notes"; `found.mjs:60` "the file does not end in a newline: appending would change its last line, which a plain pull request may not"; `roles.mjs:296` "BOB ... is addressed ...; replace it with handover begin, not start bob".

Why the records dominate: each record the process keeps (address, hold, notice, land row, pin, ledger entry, usage row) needs guards on its form, its freshness and its writer, and each guard is a place the product can stop. On the product's state branch the records are the bulk of the repository's activity: 12,881 commits and 8,937 files, including `notices/triage` 3,125 files and `notices/answered` 2,542. The coordinator's own reading (6nov-c): "1,387 state pushes in 19 h plus PRs/polling on one account is what likely got civicsmith suspended." That suspension then produced the pacing ledger, which wrote more records ("86 share commits / 25 share-only pushes in an hour", class C9) and was removed three days later.

A preference for fail-closed is stated as a value in the log, apart from any product risk: "DECIDED: (a) fail closed stays; ... (b) rejected as fail-open in disguise" (5 Nov 02:30); "a failed fetch fails closed" (4 Nov 00:47, with approval); "Review (fail-closed classification; no real code may skip its suite)" (9nov handoff, on a change meant to lighten gates).

## 7. Causal account: ranked drivers

Legend: (i) model disposition in any setting; (ii) created by this process's structure; (iii) created by the owner's inputs.

### Driver 1. The texts mandated a build for every failure and outlawed the cheap alternative. (iii) and (ii), acting on (i)

