# [file] root-prompt.txt (continued)


## Acts you may take

- run the tool's `start check`, `status`, `address <role>`
- start BOB when none is addressed: `node .process/tool/p3.mjs start bob`, then create_session with the call it prints, then `node .process/tool/p3.mjs start record bob <new id>`
- replace BOB by the handover: `node .process/tool/p3.mjs handover begin`, then the steps it prints (create_session, `handover confirm`, a message to the old BOB)
- message and interrupt the addressed BOB (interrupt restarts a BOB stopped by three refusals in a row)
- archive an old BOB once it reports ready
- your hourly sweep task is the prompt `node .process/tool/p3.mjs sweep task --session <your id>` prints: if list_triggers shows none bound to you, create it (create_trigger, no persistent_session_id); if its prompt differs, update_trigger only its prompt, to that; never fire it
- in your first turn, only when `node .process/tool/p3.mjs address watcher` shows none: `node .process/tool/p3.mjs start watcher`, create_session with the call it prints, `node .process/tool/p3.mjs start record watcher <its id>`, then the daily task it printed: create_trigger, persistent_session_id the watcher's id
- when the sweep fires: `node .process/tool/p3.mjs sweep --session <your id> --sessions <f> --context <pct>` (f: list_sessions JSON; add `--attempt "<who>:<role>:<minutes>:<usd>"` per attempt whose session record gives them) and do only what it prints; it reads step 0 to 3 and writes the heartbeat
- on an escalation about a silent BOB, at once: get_session on BOB; if archived, or idle past `targets.decision_minutes` with it unanswered, hand over now (rulebook rule 6)
- message BOB: `node .process/tool/p3.mjs send bob "<text>" --from root`, deliver it to the address it prints with send_message, then `node .process/tool/p3.mjs send delivered <n> --from root`
- send a technical question (a fix, a restart, a route) to the coordinator with send_message, never to Bob; push-notify Bob only what passes your rulebook's test
- at the coordinator's ask, its `start coordinator` command and the steps it prints

Nothing else: create no session or task but those above and the MERGER the sweep prints, merge nothing, edit no task but your sweep task's prompt, archive only an old BOB or coordinator and what sweep prints, edit no file by hand. Keep your context empty.


# [file] foundations-proposed-changes.md

<!-- Snapshot of the claude.ai document https://claude.ai/artifact/RVZ8szbF1UHHSETkcGrKw8 (tab: Proposed changes), exported 2026-11-07T05:45Z for the account switch. The live document stays the working copy until Bob says otherwise. -->

# Proposed changes: Shared Layer Branch

**Status, 6 Nov: every proposal below was accepted by Bob's answer on the Keep and Drop page (6 Nov 2026, SLB-1 to SLB-11) and applied to the Foundations tab where noted; where his answer or note differs from the proposed wording, his answer was applied. The proposals are kept below as history.** Each proposal quotes the current text word for word from the Foundations tab, then gives the proposed text. Every proposal is marked GAP-9 because the Ledger, the Foundations and the Build Plan must change together: the same proposals stand on the Process3 Ledger map and Process3 Keep and Drop Ledger documents. The Build Plan's matching rows are not on this account and are not covered.

Source: the design note [Shared Layer Branch](https://claude.ai/artifact/FPZfRWFpp7frS2g6zqVuDV), Bob's design of 5 Nov, with his three rulings of 5 Nov evening relayed by the coordinator (no layer gate at close; a rescheduled job halts and restarts its tests; a trial measure). A one-layer trial on the copy comes before adoption.

## JOB-1 · GAP-9 · Accepted by Bob, 6 Nov (SLB-2)

Applied 6 Nov to A job's life, opening paragraph and step 3, in Bob's wording: one module's work in the open layer, branch cut from layer/\<n>, green publishes by small pull requests, report as a comment, complete at its last green publish with no reschedule outstanding. Also applied to The shape in one paragraph (SLB-1).

**Current** (A job's life, opening paragraph):

> A job is one module, one branch, one draft pull request, from START to merge, and it is never restarted for a process reason.

**Current** (A job's life, step 3):

> 3. The job takes in any earlier unmerged work by one command (JOB-3) and opens the draft pull request with the START as its body (JOB-1).

**Proposed:**

> A job is one module's work in one layer, from START to its last green publish, and it is never restarted for a process reason. It works on its own branch and publishes onto its layer's branch (layer/\<n>) only when its module's own suite passes; each publish is a pull request into the layer branch whose body carries the START (JOB-1).

## GAT-1 · GAP-9 · Accepted by Bob, 6 Nov (SLB-3)

Applied 6 Nov to The gate and review, opening paragraph, as "once per publish pull request tip" (Bob's wording), and to the three "Every PR tip" cells of its table.

**Current** (The gate and review):

> The gate runs in CI, once per pull request tip, never in a session (GAT-1), and only when the module's own paths, tests, check inputs or generated inputs change (GAT-6).

**Proposed:**

> The gate runs in CI, once per publish into the layer branch, never in a session (GAT-1), and only when the module's own paths, tests, check inputs or generated inputs change (GAT-6).

## GAT-8 · GAP-9 · Accepted by Bob, 6 Nov (SLB-4)

Applied 6 Nov to A job's life, step 9, and the gate table's GAT-8 row, in Bob's wording: no re-gate on the merged result; a publish merges into the layer branch on its own green gate; the layer merges into the tranche once every job is complete and the layer's checks pass. The citation "Bob, 5 Nov, relayed by the coordinator" in the proposal was replaced by Bob's answer of 6 Nov.

**Current** (A job's life, step 9):

> 9. The tool brings the branch up to the tranche, runs the gate on the merged result, and merges a green, current tip (GAT-8); a merge refused because its base moved, or a state-branch push rejected, is fetched and retried a bounded number of times, never forced (met 2 Nov). Jobs never merge: the plain merge routes are denied to every session. The merge is completion (INT-1). Retirement is a record line (INT-5); a module whose post-merge review finds gaps may be reopened for a second attempt (your 1A).

**Current** (The gate and review, table row):

> | Gate on the merged result, then merge | Before each merge | Branch brought up to the tranche | GAT-8 |

**Proposed** (step 9):

> 9. The tool brings the job's branch up to the layer branch's tip, runs the gate, and puts a green publish onto the layer branch. When every job of the layer reports complete with no reschedule outstanding, every module has passed against its providers' current versions; the layer's checks run, module tests do not run again, and when they pass the tool merges the layer branch into the tranche as one pull request (GAT-8; Bob, 5 Nov, relayed by the coordinator). A merge refused because its base moved, or a state-branch push rejected, is fetched and retried a bounded number of times, never forced (met 2 Nov). Jobs never merge: the plain merge routes are denied to every session. A module's green publish is its completion, a layer's merge is the layer's (INT-1). Retirement is a record line (INT-5); a module whose post-merge review finds gaps may be reopened for a second attempt (your 1A).

**Proposed** (table row):

> | Gate on each publish; the layer merges when every job has passed | Each publish; layer close | The module; the layer branch | GAT-8 |

## INT-1 · GAP-9 · Accepted by Bob, 6 Nov (SLB-5)

Applied 6 Nov to the properties table row and to step 9, in Bob's wording: a module is done at its last green publish with no reschedule outstanding, a layer when merged into the tranche, a tranche when merged into main by one pull request.

**Current** (The properties that hold everything, table row):

> | Done means merged; main never moves while a tranche runs | Branch protection; the tool merges only green, current tips | INT-1, GAT-8, P12 |

**Proposed:**

> | Done means merged: a module by its green publish onto the layer branch, a layer by one pull request into the tranche; main never moves while a tranche runs | Branch protection; the tool publishes only green tips and merges a layer only when every job has passed | INT-1, GAT-8, P12 |

## GAT-3 · GAP-9 · Accepted by Bob, 6 Nov (SLB-6)

Applied 6 Nov to The gate and review, the paragraph after the table, in Bob's wording (exports, Public / Provides text, or a test of a Provides requirement; a run started before the provider's newest publish never counts). The proposal's "An implementation-only change notifies no one" is not in Bob's answer and was not applied.

**Current** (The gate and review):

> A change to a provided service reaches its users through BOB's requirement notice and each user module's own job, not through the provider's gate (GAT-3).

**Proposed:**

> A change to a provided service's interface reaches its users at the provider's publish, not through the provider's gate: users in the open layer are rescheduled at once, and a running user halts its test run and starts again against the provider's new version; users in higher layers receive an unmet requirement for when their layer opens. An implementation-only change notifies no one (GAT-3).

## SES-12 · GAP-9 · Accepted by Bob, 6 Nov (SLB-9)

Applied 6 Nov to Measurement (both metrics, per job) and to The shape in one paragraph; the false-done item also carries AUD-2.

**Current** (Maintenance, certification and the two health metrics):

> - False-done rate: the share of COMPLETE claims refuted by the gate's re-run and revert check.
> - Cost per surviving pull request: tokens or dollars per PR still in place after a two-week revert window.

**Proposed** (the unit only; the revert check and the false-done definition are a separate question in audit 2):

> - False-done rate: the share of COMPLETE claims refuted by the gate's re-run and revert check.
> - Cost per surviving job: tokens or dollars per job (one module in one layer) whose work is still in place after a two-week revert window.

## INT-4 · GAP-9 · Accepted by Bob, 6 Nov (SLB-7)

Applied 6 Nov to Open tensions, item 2, and the gate table's layer-checks row, in Bob's wording: a layer closes when every job is complete and the layer's checks pass; module tests do not run again at close; the next layer starts at once.

**Current** (The gate and review, table row):

> | Layer checks | Layer close | The layer | ARC-4, INT-4 |

**Current** (Open tensions to settle, item 2):

> Settled on 1 Nov: INT-4 reads that a layer closes when every PR is merged and the layer's checks pass; whole-product checks run before a release.

**Proposed:**

> INT-4 reads that a layer closes when every job has completed and passed with no reschedule outstanding and the layer's checks pass; module tests do not run again at close; whole-product checks run before a release, or when Bob asks; the next layer starts at once.

**Bob's answer** (5 Nov, relayed by the coordinator, verbatim): "INT-4: layer checks run at layer close, but not module tests." Settled; no longer open.

## Roles table and SES-1 · GAP-9 · Accepted by Bob, 6 Nov (SLB-8)

Applied 6 Nov to Roles and sessions (opening paragraph and the Job row) and the properties table's session-creation row. Per Bob's note ("BOB starts jobs and lanes, not ROOT"), BOB starts lanes as well as jobs. By the coordinator's ruling, 6 Nov: ROOT (depth 0, Bob's app) starts BOB, the watcher and the coordinator, applied to the properties row and the Watcher row, with PLT-5's "whoever starts ROOT starts the watcher" read as ROOT starting it; and under the layer branch no MERGER runs and nothing else starts jobs, its code removed if the trial keeps the layer branch (SLB-11).
