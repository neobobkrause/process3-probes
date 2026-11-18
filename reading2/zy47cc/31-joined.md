# [file] coordinator-handoff-8nov-d.md (continued)

2. DONE 19:00Z: p3dev-l1, -l3 and -t1 deleted (24 Workers, 12 apps, 6 buckets); p3dev-l11 kept.
3. Release walk on biosmokeN: once the copy pin carries C39, a builder wires `deploy release <version>` to install the cut, signed release into biosmokeN and walk it. Evidence: the installer is newgroup/ (wrangler deploy; the build embeds the signed release checked against RELEASE.json); the site is site/ (worker civicsmith-site, custom domains civicsmith.org and www.civicsmith.org, INSTALLER_ADDRESS points at newgroup's workers.dev). Cloudflare shows only wrangler deploys from Bob's account, last 27 Oct. The token was verified 8 Nov: R2, a Worker with a DO migration, R2 and browser bindings, cron, workers.dev and delete all ok; D1 and KV are refused (unused).
4. Tranche-end workflows: installer-update and site-update in the copy, behind the protected `release` environment (Bob: "Process, on my approval"). Proposed to Bob as round-2 found marks. Ask him for the go, the scoped Cloudflare deploy token in that environment (his to add), and whether the site is civicsmith.org or civicsmith.dev (Cloudflare shows only .org).
5. Layer 12: plane 1066 and journey-check 999 were left at 18:01Z. When both land: layer merge 12, then the round-close run, then the findings as found marks (DEC-340 covers 518 -> 96 at journey-check's local walk), then round 2 under C39.
7. Watcher: none live. addresses/watcher.json names an archived session; ROOT starts a watcher only when none is addressed. Fix by tool change (an archived address reads as none) or a re-record.
6. Hourly check as before. The 18:53Z audit showed a process3 push gap of 5 (likely C40's split ledger; re-audit with both ledgers after C40 merges). For copy state, read with git from a clone, or ask BOB; never act on a product from your own session.

## Merge practice
As 8nov-c: a process3 worktree at the tranche; merge the head onto the tranche and run the suite (HOME=$(mktemp -d) GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_NOSYSTEM=1 node --test 'tool/test/*.test.mjs'); mark ready; `node tool/p3.mjs merge <n> --plain --rounds 1 --reviewed "..."` (timeout 1200 s). Pins: `pin move neobobkrause/<repo> --report <me> --why ... --pin <sha>`, then create_session with its JSON, then archive each when it reports.


# [file] coordinator-handoff-8nov-b.md

# Coordinator handoff, 8 Nov 2026 ~08:50Z (session_018BhcefsuyMNH3Fm235qwk5)

Previous: notes/coordinator-handoff-8nov.md. Log: notes/coordinator-findings-3-4nov.md, entries to 07:51Z 8 Nov (this file covers 07:52-08:50Z).

## Addresses
ROOT session_018BhcefMKiLuojtdyeh1nzG. BOB session_018Bhceff4p3dNtYx3XNk4CX. Watcher session_018BhcegBeapVuoF7cgLpEeR. Builders: ef7 session_018Bhcef7TXuVjVZ4eN1SCzE (free), ef1 session_018Bhcef1pxNYJCcaejqj138 (free after C33). Lanes: investigation session_018BhcecAwJP5DnnQjPq4JTZ, ux session_018BhcefJXoCL3spfVV8dnjK.
My tasks, bound to me (rebind to yourself, then delete mine): hourly trig_01UM5F6JQcjMqvveKMMMox66 (:51); Phase 1 survival trig_01Y6XmA16RGwZJRoGq2ie3yD (16 Nov 17:00Z); Phase 2 survival trig_01JVYdmkuDSyzJUEStfcNNCC (18 Nov 17:00Z). Then set the probes' process/config.json coordinator to yourself (plain PR, as probes PR 252; merge it with the merge tool, --plain --rounds 1, from the probes clone running the tranche tool).

## State
Copy: the plan's 11 layers are all merged (layer 11 at 45824bea, 14.06 h). Round 1 closed WITHOUT a development release: the live walk of p3dev-l11 failed outside F10 (640 undefined classes, 1050 DEC-340 overlaps, 1 screens-daily R22). The completion round 2 file is on the copy tranche (build/plan/completion-round-2.md, 10 items; CR2-1 corpus-export ticked, PR 825). The other 9: journey-check (F10 + PD-11), interface-assets (repin to ux PR 996), interface-shell (drop mk-lvlbtn, cs-menu; every drawn class defined; DEC-340 by the re-walk), screens-daily (R22), provenance (BD-18), leg-earning (BD-18), ai-runs, hypotheses (IV-H F1), inquiry (IV-H F2).

## In flight at handoff
- C33 MERGED: process3 PR 256 at 0590382c (completion round opens as layer n+1 from completion_file; layer merge ticks landed items; my suite 1177/1177).
- Pins of 0590382c running: copy session_018Bhcedq5mYbUHEVDaNAanD, probes session_018BhcedBSqTyJb7jc15iHta. Each reports to the coordinator address; archive each when it reports.
- BOB, on the copy pin's wake: `layer open 12` (the completion round), `layer jobs 12`, start in order (journey-check first; interface-shell after interface-assets lands). Any refusal: its words come to you; the fix is a builder's.
- Round 2 close: layer merge 12 (ticks items), internal walk (now with page checks once journey-check lands, PD-11), deploy, live walk, then release dev under PD-10.

## Decisions of mine today (DECISIONS.md on process3 tranche)
PD-9 (gate verifies built generated rows, PR 251), PD-10 (a recorded owed walk mark does not block release dev; anything else does, PR 253), PD-11 (internal walk runs the live walk's page checks, PR 254), PD-12 (reopens after the last layer run as the completion round, PR 255). C32 (layer cover per land; merged PR's run bound under a reopen, PR 252) and C33 (PR 256) are their tool changes.

## Bob today
- On Screens (8 Nov): "It sounds like the screens document is being properly maintained and updated/regenerated properly by the UX design lane." Screens stays a claude.ai artifact; ux lane republishes in the same turn as any screen-changing DEC or BD (copy PR 988).
- Open FYI to Bob, no answer owed: BOB drew FOCUS and PROBLEM as one QUESTION node in the Content Framework loop diagram (copy PR 995, BD-16).

## Merge practice
As 8nov: /home/user/p3-base worktree for review merges (merge head with tranche, suite: HOME=$(mktemp -d) GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_NOSYSTEM=1 node --test 'tool/test/*.test.mjs'); a builder PR draft is marked ready (update_pull_request draft false) before `node tool/p3.mjs merge <n> --plain --rounds 1 --reviewed "..."` from a tranche worktree. The merge waits on CI up to ~10 min: give it a timeout of 1200 s. Pins: `pin move neobobkrause/<repo> --report <me> --why ... --pin <sha>`, then create_session with its JSON.


# [file] 01-vocab.txt

### ANCHOR: /** R72: a provider's refusal for a spent limit (Anthropic's 429
/* ====================================================================================================================
 * THE INTERFACE AS KINDS. Structured comments only: nothing below is read by running code. Each exported function,
 * each public method of `AiRuns` and each exported table states what it is handed (its domain) and what it hands back
 * (its range), every refusal included. A refusal here is an answer, an object naming a `code`, never a thrown error,
 * except where a comment says "throws".
 *
 * A BOUND a kind cannot express is written in the description of the field it binds, always in this one form:
 *     [bound <field>: <the bound>]
 * A field marked required has no `?`; where the running code is nevertheless handed nothing for it, the answer is the
 * refusal its description names (the code tolerates the absence, the contract does not).
 *
 * Sources: this file's code; `build/requirements/ai-runs.md` (cited as R<n>); `test/m/ai-runs/`. Where they disagree
 * the code is followed and the difference is said in the description.
 * ================================================================================================================== */

/**
 * An instant as this module writes and answers it.
 * [bound IsoSecond: ISO-8601, UTC, to the second, `YYYY-MM-DDTHH:MM:SSZ`, as record-core's `stampInstant("second")` writes it]
 * @typedef {string} IsoSecond
 */
/**
 * The instant an act is recorded at, as a caller gives it; absent, null or empty means now.
 * [bound InstantArg: a text `Date.parse` can read; one it cannot read makes the call THROW a RangeError, it is not refused]
 * @typedef {string|null} InstantArg
 */
/**
 * A clock reading handed by `scheduler`.
 * [bound EpochMs: milliseconds since the Unix epoch, a finite number]
 * @typedef {number} EpochMs
 */
/**
 * A stamp of the control plane naming a credential or a person: `actor` (who acts), `caller` and `principalPlane`
 * (the credential acting). Set server-side by `control-plane`; a request body's own copy is overwritten (`aiRunsOps`).
 * [bound Stamp: a member is `member:<id>` or `member:<id>/<tokenId>` (an `actor` may also be the bare `<id>`, R81), `<id>` being 1 to 128
 *  characters of letters, digits, dot, underscore and hyphen; a machine is `class:<cls>` or `class:<cls>/<tokenId>`; an empty or absent
 *  actor means no member is behind the caller]
 * @typedef {string} Stamp
 */
/**
 * Whose sight an answer is taken in, the control plane's stamp, read by membership's `viewerPredicate`: a member
 * (`member:<id>`), the founder (`admin` in the tests), or a machine class (`class:admin`, `class:member`, `class:probe`,
 * `class:daemon`, `class:ai`), which sees every run. Absent, null or unrecognised sees no run at all (fail closed).
 * @typedef {string} Viewer
 */
/**
 * A bound of a run: the keys of run-rules' `RUN_BOUNDS`, in its order. The requirements' Terms list seven of these and
 * `lease`; the code also holds `pages`.
 * @typedef {"fetches"|"subsessions"|"wallclock"|"runtime"|"mints"|"surfaces"|"proposals"|"pages"|"lease"} RunBound
 */
/**
 * The bounds a caller may send a figure above zero for (`tick`'s `consume`, a declaration's `consumed`).
 * @typedef {"fetches"|"subsessions"|"wallclock"|"runtime"} CallerCountedBound
 */
/**
 * The bounds the plane counts as the run's work lands (run-rules' `PLANE_COUNTED_BOUNDS`): a caller's figure for one
 * may only be 0.
 * @typedef {"mints"|"surfaces"|"proposals"|"pages"} PlaneCountedBound
 */
/**
 * An ending of a run that is not a bound: the keys of run-rules' `RUN_ENDINGS`. The requirements' Terms name three;
 * the code also holds `nothing-written`.
 * @typedef {"completed"|"cancelled"|"nothing-written"|"mode-not-deployed"} RunEnding
 */
/**
 * A run's status: `running` from the open; after the one exit, run-rules' `runStatusFor` of what stopped it
 * (`stopped` for a bound, `never-started` for `mode-not-deployed`, `finished` for any other ending).
 * @typedef {"running"|"finished"|"stopped"|"never-started"} RunStatus
 */
/**
 * The kind of a run's context: the keys of run-rules' `RUN_CONTEXTS`.
 * @typedef {"inquiry"|"project"} RunContextType
 */
/**
 * A run's mode: run-rules' `RUN_MODES`, the deployment order. `open` admits only the deployed and admitted ones
 * (`check` and `plan` as the flags stand, R40).
 * @typedef {"check"|"investigate"|"extract"|"plan"} RunMode
 */
/**
 * Where a run comes from: run-rules' `RUN_ORIGINS` and `PLAN_ORIGINS`. `explore` is not a planning run's origin and
 * `reexamination` is only a planning run's.
 * @typedef {"member"|"explore"|"reexamination"} RunOrigin
 */
/**
 * R21: what a run's bar rests on, the keys of run-rules' `STANDARD_BASIS`.
 * @typedef {"recorded"|"none-recorded"|"context-has-no-project"|"names-no-axis"|"unreadable"} StandardBasis
 */
/**
 * What a look established: the keys of observation-log's `OBSERVATION_STATES`.
 * @typedef {"NEVER_LOOKED"|"LOOKED_ABSENT"|"LOOKED_INDETERMINATE"|"PRESENT"|"partial"} ObservationState
 */
/**
 * The level of a look: the keys of observation-log's `OBSERVATION_LEVELS`.
 * @typedef {"meaning"|"content"|"document"|"internet"} ObservationLevel
 */
/**
 * Whether a log row names what its look produced: observation-log's `observationCoverage`.
 * @typedef {"backed"|"none_owed"|"undetermined"} ObservationCoverage
 */
/**
 * A queue condition named beside an ending or a look: the keys of observation-log's `CONDITION_KINDS`, read live at
 * each call (C-22.4), so that file fixes the list; this is the list as it stands in this tree.
 * @typedef {"monitoring-recheck-due"|"archive-fallback-eligible"|"capture-session-ttl-expiring"|"source-unreachable-governed"|"capture-completed-unattended"|"partial-capture-outstanding"|"text-undetermined"|"client-rendered-shell"|"invitation-spent-or-expired"|"governor-holding-host"|"runtime-ceiling-reached"|"render-deferred"|"sweep-held-backlog"|"sweep-yield-anomaly"|"sweep-seed-unreachable"|"sweep-redirect-out-of-scope"|"sweep-silent"|"notice-attestation-missed"|"notice-lapse-near"|"notice-project-closed"} ConditionKind
