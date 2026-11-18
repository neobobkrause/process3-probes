# [file] gate-map-4nov.md (continued)

    - Rule 8's size line: 5,752 lines and the command count at the gate tip, with each rise cited.
    - The Phase 2 table's "State" cells: PRs 44 to 65 (sweep stall PR 45, metrics PR 47, restart, deploy act PR 59, pin-move wake), and the stale-start setup line measured 1 of 1, which goes to Bob as a proposed step.
    - The fault-injection paragraph: archive in place of interrupt, the watcher fired by hand.
    - Phase 3's size: the build count overran, with its reason.
    - Phase 3 rows' states: PR numbers for layer close 48, tranche report 49 and 51, tranche open and close 50, dev release 52 and 60, cap 53 (70,000 provisional), provider route 54 and 57, take-in 55, shims 56, lanes and completion 63, size ranges 62.
    - Rule 5's practice, if BOB rules that PR 44 and 46 owed a confirming review.


# [file] audit_C.md (later part)

| Who adopts | BOB: "one recorded act that moves the pin"; the same job continues and none restarts (MNT-5, JOB-4) | The owner, twice: he merges the fork pull request in the process repository (G1), then the pin, which is one of his paths in the product repository (G2). If a cap is exceeded he must first change the budget number (M1) |
| What the owner does | Nothing. It is reported "in plain words as done". He acts only if the fix needs a grant only he can give, or changes what a line asks | Reads the log and the daily numbers; decides; commissions a session; reads a proposal "with totals before and after"; merges in two repositories; switches the interaction limit off and on. "Perhaps an hour of your attention" per retrospective |
| How long product work waits | Only the blocked jobs, until the fix lands and the pin moves; BOB starts other work meanwhile (GAP-1). A serious flaw pauses the product until the fixed version (P3). No wait on the owner | Non-blocking: no wait, and the workaround stays for the whole run. Blocking: until the owner acts, with no bound. The watchdog emails him after "a set number of hours" with nothing merged |

What actually ran in Process3 was neither column. MNT-6's waiting was held by text; MNT-1, MNT-3 and the flaw command were never built; the sessions that changed the process had no role or rulebook (causal_forensics §1.4). The pin moved 116 times, a median 3 to 21 minutes after each process merge (product_side §4). The proposal answers that record, not the documents' flow.

Where the proposal departs:

1. **From MNT-5 and P17.** The decision and the adoption move from BOB to the owner. The Ledger's line is ended, not bounded.
2. **From the owner's direction on problems (X-1).** During a run a workaround is the prescribed answer for a process problem, where his direction of 2 Nov, repeated 7 Nov, was to find the cause and fix it.
3. **From MNT-7.** A report is recorded and not answered until he commissions the answer.
4. **From MNT-1 and MNT-3.** Process changes are again built outside any process, by a commissioned session, as they were in Process3.
5. **From central requirement (1).** Merging a pull request is not a settings change, and here it happens in two repositories for each change. Commissioning a session is not one either. Changing a budget number is a file change. The proposal's first section admits the merge and proposes limits held in GitHub rules instead; conditions 1 and 4, "What is fundamentally different" item 1, G1, G2, N2, N4, N5 and "Your standing acts are five" all still say his merge. The document was amended at the top and not below.
6. **From central requirement (2).** A blocking process flaw stops the run until he acts. The requirement allows waiting only when "completely blocked with no further work possible without additional user action". Here his action is made necessary by the design, not by the platform: a fix could be drafted, tested and adopted without him, and the wall forbids it.
7. **A limit on the mid-run route.** "More than one process version in a week" is listed as a sign of failure, so the proposal treats a second mid-run fix in a week as a warning, whatever the second flaw blocks.

## E. Owner acts: what the documents accept and what the proposal adds

### Acts the documents accept

| Act | Where | How bounded |
| --- | --- | --- |
| GitHub accounts, branch rules, Actions settings, collaborators, secrets | Setup; developer's steps | At onboarding; "the fewest steps, each with its reason and tested to work the first time"; confirmed once |
| The cloud environment and Claude's GitHub connection, including deploy tokens | Setup; Deploy tokens; Moving accounts | At onboarding, and again on an account move "from a page the process writes" |
| Standing approvals, committed by his own hand to each repository's CLAUDE.md through GitHub's website | Platform section; GAP-6 | "Recorded once"; a missing grant is asked for and then recorded as standing |
| Starting ROOT, and the watcher beside it; replacing ROOT if the watcher declines | Roles | Once, and a rare fallback |
| Answering questions that are his, in one place, numbered | The human and the AI; P21 | "A word you give in chat is written there by BOB"; never asked twice |
| Pause and resume, by his word | PLN-5 | Recorded once by the process |
| Identifying the need for a lane; marking a word as a decision | SES-14; REQ-7 | When he chooses |
| Clearing a blocker only he can clear; an act the judge refused | GAP-1 | Only those |
| Asking for his approval before a particular merge; asking for whole-product checks | GAP-10; ARC-4 | Only when he asks |
| Approving a public release or a rollout in the protected environment | GAP-7; Where the process stops | Per public release |
| One plain request to move accounts | GAP-8 | One request |

### Acts the proposal requires

| # | Act | Item | New? |
| --- | --- | --- | --- |
| 1 | Merge every process change in the process repository | G1, N2, N4, condition 1 | **New.** Not a settings change |
| 2 | Review every product pull request touching `.github/**`, `.claude/**`, `CLAUDE.md`, `CODEOWNERS`, the pin or the walker's step definitions | G2 | **New.** The documents had CLAUDE.md change without his approval and BOB move the pin; the record of 4 and 6 Nov has workflow changes judged by rules so they need not go to him. The walker's steps changed within one round in Process3, so this may be frequent |
| 3 | Create the hourly task; switch it off to stop; in the fallback switch it off and recreate it at each layer close | C2, C3, G9 | **New.** ROOT created its own sweep. Comparable in count to starting ROOT only in the preferred form. A task is not a GitHub or Cloudflare setting |
| 4 | Replace ARCH at each layer close | C3 fallback | **New**, recurring. Process3 closed 13 layers in six days |
| 5 | Start the ARCH session and "look in once or twice a day" | Start smaller, item 4 | **New** |
| 6 | Switch on the process repository's interaction limit for a run and lift it for the retrospective | G1 | **New**, each run. A settings act, so of the allowed kind; GitHub's limit lasts at most six months (levers §1.2) |
| 7 | Stop by locking the integration branch and switching off the task | G9 | Changed form. The lock is a GitHub setting; the task toggle is not. Before, his word was enough |
| 8 | Answer questions as comments on a pinned issue, in his own words; put in writing any chat remark he wants to last | M4, M5 | Accepted in kind; **new burden.** BOB used to write his chat word down |
| 9 | Commission each retrospective, read it, choose among priced options | N4, "What it costs you" | **New.** "Perhaps an hour" each |
| 10 | Decide whether a misfired check is repaired | N5 | **New.** A technical decision that was BOB's |
| 11 | Read "One daily number", and the watchdog's emails | The division, amended; G8 | **New.** GAP-1 had no one watching |
| 12 | Rewrite the approvals in CLAUDE.md to name the new merge act, within 4,096 bytes | G3, M1, run 0 | Accepted in kind; a new instance, at half the file's present size |
| 13 | Commission the session that builds the kit; merge the clean-up pull request | Run 0 steps 2 and 4; lever P1 | **New** |
| 14 | Set rulesets, environments and secrets from the setup list; create `dev` and `production` | Run 0 step 5; G10 | Accepted (onboarding settings) |
| 15 | Open a separate Cloudflare account for development and scope its token | F3 | Accepted in kind (Cloudflare settings at onboarding); a new instance, and his approvals named "the product's own account" |
| 16 | Set the cloud environment's setup script and the auto-memory variable, and change the script when the toolchain changes | C7, C8 | Accepted at onboarding; **new recurrence**, since the product's own script used to do it |
| 17 | Change a budget number before merging over a cap | M1, N1 | **New.** A file change in the process repository |
| 18 | Repair the gate during run 1 | Run 1: "Your own repairs to the gate ... are expected in a first run" | **New** |
| 19 | Write to GitHub Support about the 6 Nov suspension | G12 | **New**, once |
| 20 | Move to a GitHub organization if more than 5% of merges break the integration branch | G6 | **New**, once, conditional |
| 21 | Decide on type-checking and lint at the first retrospective | Lever P5 | His by role (engineering standards) |
| 22 | Approve a public release in `production`; ask for his approval on a close | G10, G11 | Accepted |

The proposal's own list has five standing acts. It leaves out numbers 2, 6, 9, 10, 11, 16 and 17, each of which recurs. Fourteen of the 22 are new in kind (1 to 6, 9 to 11, 13, 17 to 20); two of those are one-off (19, 20). Of the fourteen, only numbers 6 and 20 are changes to GitHub or Cloudflare settings.


# [file] codex-context-avoidance-experiment-20261117.md

# Experimental protocol: Codex context capacity, complete reading and compaction avoidance

**Status:** Executable research specification, **not** a passed test, adopted Process4 policy, or permission expansion. Owner clarification: [compaction-avoidance direction](../owner_words/bob_words_17nov_compaction_avoidance.md). Research foundation: [context-fidelity study](codex-context-study-20261117/REPORT.md), [model-capacity discrepancy](codex-gpt6-context-window-investigation-20261117.md), [subscriptions](codex-subscription-context-pricing-20261117.md).

## Question and hard experimental boundaries

Can Process4 **reliably detect or conservatively preclude** contexts in which Codex might silently compact, truncate authoritative reading, or lose canon fidelity, while achieving useful, source-correct work for a reasonable token/time investment? What **actual context size** can one request and verify with an already authorized **subscription**, and on which actual execution surface?

Run only on disposable canon and probes, not CivicSmith2. Avoid metered API calls, paid infrastructure, credential inspection, auth retries, patched client catalogs and unapproved settings changes. Do not modify the installed Claude Code implementation or standing grants. No forced-compaction experiment in a session holding product authority. If experimental compaction cannot be observed safely, label it NOT TESTED rather than simulating a native event.

## Surfaces: never conflate

- **S1: Subscription-authenticated Codex CLI**, only if an already supported, authorized, functional login exists. Inspect read-only `/status` or supported app-server usage telemetry in a **fresh disposable session**. Never bootstrap a nested CLI with inaccessible/inherited credentials or perform re-login. Existing read-only CLI help/schema inspection alone is insufficient evidence.
- **S2: Native subscription-hosted Process4 child**, started with supported native collaboration/continuation tools in a disposable tree. Check actual child model ID, context denominator/numerator, compaction events and whether an **effective** per-child context override is supported. Do **not** send text `/compact` or `model_context_window=...` and claim that it changed the native runtime.
