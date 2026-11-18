| E12 | Reading set over budget | SES-6 |
| E13 | Pull-request events to BOB: completion, red gate, comment | GAP-5 |
| E14 | Requirements file over the cap | REQ-6 |
| E15 | Process flaw reports listed at each status | MNT-7 |

### F. Records and bookkeeping artefacts (47)

| # | Record | Line or place |
| --- | --- | --- |
| F1 | Keep and Drop Ledger, 159 lines | The canon |
| F2 | Foundations | The canon |
| F3 | Build Plan | How this was decided; GAP-9 |
| F4 | Ledger map | GAP-9 |
| F5 | Walk-through: numbered questions with a column for the owner's word | How problems are handled |
| F6 | Build ledger, JSON, one entry per module or feature | REC-9 |
| F7 | Decision records, one file each | REC-11 |
| F8 | Rulings, until absorbed | REQ-7 |
| F9 | Status output with next acts per role | REC-3, GAP-4 |
| F10 | Handoff, one screen | SES-3 |
| F11 | Transient state files per participant on the state branch | REC-1 |
| F12 | Platform table | PLT-1 |
| F13 | Address files in git (ROOT, BOB) | REC-6 |
| F14 | Heartbeat state file | Scheduled tasks |
| F15 | Owed list | Sweep step 3 |
| F16 | Plan with the process pin | MNT-4 |
| F17 | Pause and resume field in the product's process config | PLN-5 |
| F18 | Layer map: modules in order with their uses | ARC-1, P2 |
| F19 | Module requirements files with permanent ids and not-yet-met marks | REQ-1, REQ-4 |
| F20 | Completion-round file | PLN-4 |
| F21 | START as the pull request body | JOB-1, JOB-2 |
| F22 | Receipt as a pull request comment | JOB-7 |
| F23 | Worker receipts | SES-10 |
| F24 | Cross-module flaw and improvement reports | P9, PLN-3 |
| F25 | Process flaw reports and their answers | MNT-7, MSG-5 |
| F26 | Tranche report | PLN-6, GAP-12 |
| F27 | Per-attempt metrics rows | JOB-10 |
| F28 | Refusal record: act, depth, channel | Standing approvals |
| F29 | Message numbers and the undelivered list | MSG-3, MSG-6 |
| F30 | Setup list | Setup |
| F31 | Developer's steps and the per-product onboarding page | Setup |
| F32 | Grant list | PLT-9, SHM-3 |
| F33 | Rulebook per role | TXT-3, TXT-5 |
| F34 | Start table: model, effort, permission mode, refresh threshold | SES-8, SES-4 |
| F35 | Reading sets per role and the budget table | SES-5, SES-6 |
| F36 | Product CLAUDE.md with its pin line | TXT-1 |
| F37 | Approvals block in each repository's CLAUDE.md | GAP-6 |
| F38 | Settings file with the deny list | SHM-1 |
| F39 | Skill | SHM-1 |
| F40 | Lane directories of design knowledge | SES-14 |
| F41 | Word table of user-facing text | ARC-3 |
| F42 | Release note with platform rows and certified sizes | MNT-10 |
| F43 | Blocked states and retirement lines | ENF-7, INT-5 |
| F44 | Recorded acts: pin move, live-limit change, restated line, missing-instruction decision | MNT-5; Platform; The human and the AI; Standing approvals |
| F45 | Account-move page | GAP-8 |
| F46 | Listed reasons for a review | INT-2 |
| F47 | The process's own ledger, requirements and tranches | MNT-1 |

### G. Roles (11)

| # | Role | Line or place |
| --- | --- | --- |
| G1 | Owner, as product manager and engineer | What this process is for; P17 |
| G2 | Coordinator, at the top of the depth chain | PLT-5 as restated |
| G3 | ROOT | SES-1 |
| G4 | Watcher, a standing session | Scheduled tasks |
| G5 | BOB, one per product | SES-1 |
| G6 | Job | JOB-1 |
| G7 | Lane, with the UX lane always present | SES-14 |
| G8 | In-session worker | SES-10, SES-18 |
| G9 | Fresh reviewer | INT-2 |
| G10 | Walkers | P22; Two kinds of release |
| G11 | The process's own architecture session | MNT-7, MSG-5 (page explanations) |

### H. Scheduled tasks and recurring workflows (10)

| # | Task or workflow | Fires | Line or place |
| --- | --- | --- | --- |
| H1 | Sweep | Hourly | Scheduled tasks |
| H2 | Watcher | Daily | Scheduled tasks |
| H3 | Prune workflow | Scheduled | REC-10 |
| H4 | Mutation workflow | Nightly | JOB-13 |
| H5 | Nightly fixture tier | Nightly | Coverage |
| H6 | Gate workflow | Every PR tip | GAT-1 |
| H7 | Layer-check workflow | Layer close | ARC-4, INT-4 |
| H8 | Release workflow | Each release, development releases every round | Where the process stops; P22 |
| H9 | Privileged workflow on GitHub's runner | On demand | PLT-8 |
| H10 | Shim regeneration workflow | Each process change to the shims | SHM-2 |

### Totals and what they show

| Category | Count |
| --- | --- |
| A. Commit, merge and release checks | 33 |
| B. Session-start and tool-command checks | 26 |
| C. Reviews, audits and trials | 17 |
| D. Measurements and metrics | 36 |
| E. Alarms and wake conditions | 15 |
| F. Records and bookkeeping artefacts | 47 |
| G. Roles | 11 |
| H. Scheduled tasks and recurring workflows | 10 |
| Total | 195 |

Four observations follow from the inventory.

1. **A process described as thin mandates about 195 things.** Of these, 76 are checks, reviews or audits (A, B and C), and about 40 can refuse, fail or stop something. The canon's self-description is "Rules are few".
2. **Most of it was not built when the run began.** The map marks 51 of its 151 rows as simply "Built". Seventeen are "Gap", 21 carry a Phase 2 row, 39 a Phase 3 row, 3 a Phase 4 row and 8 a later gate. Of the 33 merge-path checks, 6 were marked Gap and 7 more were set for a later phase. A session told never to idle therefore always had canon-mandated process work it could do.
3. **The canon names a missing check a "Gap".** The map's gap list is dominated by checks that do not yet exist (ARC-1, ARC-3, ARC-4, JOB-8, GAT-4, P7, REC-8, P20). The canon itself defines an unbuilt check as a debt, with a phase in which to pay it. No measured failure is cited for paying it; the line's existence is the justification.
4. **Fail-closed behaviour is in the canon's own text.** "It acts on nothing, reports both SHAs and ends." "A missing one stops the start." "A failed fetch fails the check." "No build starts on a line any of them contradicts." The refusals that later multiplied had approved precedents in exactly this form.

## 3. Inventory B: the restraints, and what holds each one

I count 47 lines or sentences that restrain adding checks, rules, records or caution. They fall into two groups. Twenty-two restrain growth in general. Twenty-five restrain one specific check or one specific way of enforcing.

"Held by" uses the Ledger map's 3 Nov wording where it has a row. "Terms" records whether the restraint says anything about size, cost, removal, or doing nothing.

### General restraints (22)

| # | Restraint | Source | Held by | Terms |
| --- | --- | --- | --- | --- |
| G1 | "Nothing else is output: a rule, a record, a check or a test has value only as far as it serves that, and one that does not is wrong." | P1; What this process is for | Text ("Rule 1; the health metrics") | Cost: "quickly and cheaply", no number. Removal: "is wrong", with no act attached. |
| G2 | "caution is a cost, paid only against a measured failure or your word" | How problems are handled | Text | Cost is named and never priced. |
| G3 | "a reviewer's 'what if' is not a problem, and is one line in a report" | How problems are handled; GAP-3 | Text | Do nothing: yes, for a what-if only. |
| G4 | "The default answer to a finding with nothing measured behind it is no change" | How problems are handled | Text | Do nothing: yes, only when nothing was measured. |
| G5 | "A rule, check, review round, measurement run or owed task exists only against a measured failure or Bob's word" | GAP-3 | "Rule 2", built as text. The properties table names an "Audit of citations"; no build exists for it | No size, no cost. A test of justification only. |
| G6 | "Every rule in the process cites the measured failure or your decision that justified it; a rule with neither is removed." | TXT-6 | "Rule 2; this map", built as text | Removal in words. The page's own objection: "Requires someone to audit the citations." |
| G7 | BOB "corrects the design by rewriting the line it belongs to, never by appending" | How problems are handled | Text | Bounds lines of canon. Silent on code. |
| G8 | "at most ten rules on one screen, rewritten in place and never appended" | TXT-3 | Gap: no rulebooks written | Size: ten rules, one screen, for rulebook text only. |
| G9 | Every instruction-file line is "failure-backed, non-inferable from the code, or tool-enforced, and lines are deleted on review" | TXT-2 | Nudge ("Review at each gate") | Removal in words. The page's own objection: "Periodic review is work that is easy to skip." |
| G10 | "The product's CLAUDE.md is under thirty lines" | TXT-1 | Gap | Size: thirty lines, one file. |
| G11 | The principles are "trimmed by the same per-line test so that most roles load only the two or three that govern their stage" | TXT-4 | Phase 3; to measure | Size: an aim, no number. |
| G12 | "Only words you mark as a decision become rulings ... there is no ruling log" | REQ-7 | "Template file", later gate | Removal: a ruling is deleted once absorbed. The page's own objection: "easy to defer". |
| G13 | "Rules are few, each cites a failure, and each names the tool that enforces it or is labelled a nudge." | The shape in one paragraph | Text | Size: "few", no number. |
| G14 | "When in doubt, run the product and let it show what matters." | How problems are handled | Text | None. |
| G15 | "A reviewer's finding that needs a deliberate attack is a known limit, not code, so the tool does not grow without end." | Setup: what the checks defend against | Text | The only sentence about the tool's growth. No number. Excludes only findings that need a deliberate attack. |
| G16 | A platform behaviour is "measured once by default" | GAP-11 | "Rule 3", built as text | Size: once, unless "ambiguous or a failure recurs". |
| G17 | "components are removed one at a time and the result observed; what the model no longer needs is retired" | MNT-11 | Phase 4, not built | The canon's only removal procedure. It fires only at a model or Claude Code release. |
| G18 | "Development under the process is development of the product, not of the process"; "a non-blocking flaw waits for the next release" | P3, MNT-6 | "Rule 6", built as text; pin by pull request | Do nothing: yes, for a non-blocking flaw. "Blocking" is undefined, and "during Process3's own first build, changes are expected". |
| G19 | A flaw is "never fixed in place" | MNT-7 | Later gate | Routes fixes. Does not limit them. |
| G20 | "governed by this thin process, not by a twelve-module architecture of its own" | MNT-1, MNT-2 dropped | Phase 4 | Size: "thin", no number. |
| G21 | "Nothing here is in force until it has run on a real tranche with the two health metrics measured." | How this was decided; MNT-8 | Text | None. The live first tranche was itself the certification. |
| G22 | Overhead share, BOB's idle time, and the two health metrics as "the standing judge of every other line" | SES-11, SES-12, PLN-6, GAP-12 | Metrics built; overhead share in Phase 2 and 3 with "no target (Bob, 3 Nov)"; survival "read 16 Nov" | Cost is measured. No threshold, no consequence, and the report comes at tranche close. |

### Specific restraints (25)

| # | Restraint | Source | Held by | Terms |
| --- | --- | --- | --- | --- |
| S1 | "At most a handful of command hooks, each for a rule with zero exceptions" | ENF-1 | No hooks today; drift check in Phase 3 | Size: "a handful", hooks only. |
| S2 | "No model judge sits between a session and you" | ENF-2 | The design | — |
| S3 | "Nothing holds a turn, and stop means stop in that turn"; no Stop hooks | ENF-3; ENF-5 dropped | The design | — |
| S4 | No hook refuses a partial read | ENF-4 dropped | By absence; replaced by an audit (C4) | — |
| S5 | "There is no /goal" | ENF-6 | Status and the sweep; replaced by an alarm (E4) | — |
| S6 | The gate runs "once per pull request tip, never in a session" | GAT-1 | Gate workflow, built | Size: once per tip. |
| S7 | The gate "never" runs "another module's suite" | GAT-2 | Gate, built | — |
| S8 | The gate runs only when the module's own paths change; "Record writes never cost a job a gate run" | GAT-6, REC-4 | Gate workflow, built | — |
| S9 | Whole-product checks and the full regression run only "before a release, or when you ask" | ARC-4 note, GAT-7 | Phase 3 | — |
