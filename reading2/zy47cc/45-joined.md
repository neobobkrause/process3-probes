# [file] 02-open.txt (continued)

 * @property {string|null} [rerunOf]  The run this one re-runs, trimmed; blank is none. Itself: `AI_RUN_RERUN_SELF`; absent or
 *  out of the viewer's sight: `AI_RUN_RERUN_UNKNOWN`; over another context: `AI_RUN_RERUN_OTHER_CONTEXT`.
 * @property {string|null} [plan]  R46: the plan a run in mode `plan` works on, an opaque id stored verbatim. Required in mode `plan`
 *  (non-blank text, else `AI_RUN_PLAN_REQUIRED`); in any other mode anything but null or absent is `AI_RUN_PLAN_UNEXPECTED`.
 * @property {string|null} [step]  R73: an existing step the run works, trimmed; one the viewer cannot see, or one named beside
 *  `place` or `work`, is `AI_RUN_STEP_UNKNOWN`.
 * @property {RunOrigin|null} [origin]  Absent or null is `member`. `explore` needs `place` or `work` and no `step`
 *  (`AI_RUN_EXPLORE_NEEDS_STEP`); `reexamination` is a planning run's only; any other word is `AI_RUN_ORIGIN_UNKNOWN`.
 * @property {unknown} [place]  R73: the place of a system step of the run's own, handed on to `steps.stepCreate` unjudged here;
 *  `openMany` hands `{project: string}` or `{questions: string[]}`. Its kind is `steps`' to fix.
 * @property {unknown} [work]  R73: that step's work, handed on to `steps.stepCreate` unjudged here; `openMany` hands a text of at
 *  most 500 characters (`steps`' `WORK_MAX`). Its kind is `steps`' to fix.
 * @property {string|null} [response]  R77: the recorded response a re-examination run re-examines its plan after, an opaque id
 *  stored trimmed; read only in mode `plan` with origin `reexamination`, where a blank one is `AI_RUN_REEXAM_NEEDS_RESPONSE`.
 * @property {string|null} [project]  R89: the project a run over a question is opened in, trimmed; it must draw on the question and
 *  the opening member must have joined it, else `AI_RUN_NOT_PROJECT_MEMBER`. Ignored for a project context (the context is the project).
 * @property {Stamp|null} [actor]  Which member is asking; empty for a machine credential.
 * @property {Viewer|null} [viewer]
 */
/**
 * The codes `open` refuses with, in the order they are asked. Those after `RelayedCode` in the description of
 * `OpenRefusal.code` are other modules'.
 * @typedef {"AI_RUN_NO_CONTEXT"|"PROJECT_SEEN_NOT_A_PARTICIPANT"|"AI_RUN_NO_SUCH_CONTEXT"|"AI_RUN_NOT_PROJECT_MEMBER"|"AI_RUN_CAPABILITY_UNAVAILABLE"|"AI_RUN_SKILL_VERSION_UNNAMED"|"AI_RUN_MODE_NOT_DEPLOYED"|"AI_RUN_PLAN_REQUIRED"|"AI_RUN_PLAN_UNEXPECTED"|"AI_RUN_PLAN_NEEDS_PROJECT"|"AI_RUN_PLAN_NEEDS_MEMBER"|"AI_RUN_PLAN_NO_SEARCH"|"AI_RUN_ORIGIN_UNKNOWN"|"AI_RUN_EXPLORE_NOT_DEPLOYABLE"|"AI_RUN_REEXAM_NEEDS_RESPONSE"|"AI_RUN_REEXAM_OPEN"|"AI_RUN_EXPLORE_NEEDS_STEP"|"AI_RUN_STEP_UNKNOWN"|"AI_RUN_BOUND_UNKNOWN"|"AI_RUN_BOUND_PLANE_COUNTED"|"AI_RUN_BOUND_NO_ALLOWANCE"|"AI_RUN_CONSUME_INVALID"|"AI_RUN_STATE_TOO_LARGE"|"AI_RUN_ALREADY_OPEN"|"AI_RUN_RERUN_SELF"|"AI_RUN_RERUN_UNKNOWN"|"AI_RUN_RERUN_OTHER_CONTEXT"|"AI_RUN_NOT_A_MEMBER_ACT"|"AI_NO_ACCOUNT"|"AI_RUN_MODE_UNCHECKED"|"STEP_REFUSED"} OpenOwnCode
 */
/**
 * `open`'s refusal: nothing was written.
 * @typedef {object} OpenRefusal
 * @property {string|null} run  The id as handed; null when none was.
 * @property {false} started
 * @property {OpenOwnCode|RelayedCode} code  One of `OpenOwnCode`; or relayed unchanged: `PROJECT_SEEN_NOT_A_PARTICIPANT` is
 *  membership's existence refusal; a code of `ai-accounts.accountFor` other than `NO_ACCOUNT`; a code of `ai-use.useCheck`; whatever
 *  code the check registered for the mode answers (`registerOpenCheck`); the code or reason of `steps.stepCreate`'s refusal
 *  (`STEP_REFUSED` when it names neither).
 * @property {string|null} check
 * @property {string|null} translation
 * @property {string} [note]  What the refusal means for the caller, in plain words.
 * @property {string|null} [detail]  The rule's own sentence.
 * @property {false} [ok]  Only on a refusal of the account (`AI_NO_ACCOUNT`, `ai-accounts`' own).
 * @property {string} [reason]  The code again, on a refusal of the account and on `ai-use`'s.
 * @property {string} [mode]  With `AI_RUN_MODE_NOT_DEPLOYED`: the mode asked for. [bound mode: cut to 60 characters]
 * @property {string[]} [deployed]  With `AI_RUN_MODE_NOT_DEPLOYED`: the modes deployed and admitted here.
 * @property {string} [bound]  With `AI_RUN_PLAN_NO_SEARCH`: `fetches` or `subsessions`.
 * @property {number} [bytes]  With `AI_RUN_STATE_TOO_LARGE`: the state's size as JSON.
 * @property {number} [limit]  With `AI_RUN_STATE_TOO_LARGE`: 262,144.
 * @property {string} [plan]  With `AI_RUN_REEXAM_OPEN`. [bound plan: cut to 60 characters]
 * @property {string} [response]  With `AI_RUN_REEXAM_OPEN`. [bound response: cut to 60 characters]
 * @property {string} [project]  With membership's existence refusal: the project's id.
 * @property {string|null} [name]  With membership's existence refusal: the project's name.
 * @property {string} [step]  With `steps`' refusal of the run's own step, when it names one.
 */
/**
 * `open`'s success (R10): the run is written, `running`, with one bound row per declared bound.
 * @typedef {object} OpenStarted
 * @property {string} run
 * @property {true} started
 * @property {"running"} status
 * @property {1} ticks
 * @property {IsoSecond} created
 * @property {IsoSecond} expires  The open's instant plus the lease.
 * @property {string} [rerun_of]  Present only when the open named a run it re-runs.
 * @property {string} [step]  Present only on a run that works a step: the system step made for it, else the step it named.
 * @property {"explore"|"reexamination"} [origin]  Present only when the origin is not `member`.
 * @property {string} [response]  Present only on a re-examination run.
 * @property {UntestedLabel|null} untested  R78: the test-instance exception's label; null for a run the bar admitted.
 * @property {string|null} project  R89: the project the run was opened in; null for a run in none.
 * @property {ProjectGateStated} projectGate
 */
/**
 * What `open` hands back.
 * @typedef {OpenStarted|OpenRefusal} OpenAnswer
 */
/**
 * What `openMany` is handed (R74).
 * @typedef {object} OpenManyArgs
 * @property {string[]} steps  The member's steps, each named once. [bound steps: 1 to 50 entries (`AiRuns.OPEN_MANY_MAX`), each a
 *  non-blank text after trimming, no two alike; else the whole batch is `AI_RUN_NO_CONTEXT`]
 * @property {Stamp} actor  The member whose act the batch is; with none behind it and none behind `principalPlane` the batch is
 *  `AI_RUN_NOT_A_MEMBER_ACT`.
 * @property {Viewer|null} [viewer]  The sight each step is looked up in.
 * @property {RunMode|null} [mode]  Each run's mode, as `open` takes it.
 * @property {string|null} [owner]  The paying owner the one estimate is asked of (`group`, `project:<id>` or `member:<id>`, ai-use's
 *  spelling); absent or null is the owner `ai-accounts.accountFor` answers for the member's act.
 * @property {BoundDeclaration[]|null} [bounds]  Each run's bounds, as `open` takes them.
 * @property {string|null} [skillVersion]  Each run's skill version, as `open` takes it (so in effect required: without one each
 *  step is refused `AI_RUN_SKILL_VERSION_UNNAMED`).
 * @property {string|null} [label]  Each run's label.
 * @property {Stamp|null} [principalPlane]  Each run's plane principal, as `open` takes it (in effect required, as there).
 * @property {InstantArg} [at]
 */
/**
 * One step's outcome in `openMany`'s answer.
 * @typedef {object} OpenManyRun
 * @property {string} step  The step named.
 * @property {string} [run]  The run opened for it, `RUN-<step>-<k>` with `k` the first whole number from 1 not yet held; absent on a refusal.
 * @property {string|null} [system_step]  The run's own system step; absent on a refusal.
 * @property {Record<string, unknown>} [refusal]  Why none was opened for it: `open`'s refusal less `run` and `started`, or this
 *  method's own `{ok: false, reason, code, check, translation, detail}` with code `AI_RUN_STEP_UNKNOWN` or `AI_RUN_NO_CONTEXT`.
 */
/**
 * What `openMany` hands back: a refusal of the whole batch, or one outcome per step.
 * @typedef {object} OpenManyRefusal
 * @property {false} ok
 * @property {"AI_RUN_NOT_A_MEMBER_ACT"|"AI_RUN_NO_CONTEXT"} code
 * @property {string|null} check
 * @property {string|null} translation
 * @property {string} detail
 * @property {string} [reason]  With `AI_RUN_NO_CONTEXT`: the code again.
 * @property {false} [started]  With `AI_RUN_NO_CONTEXT`.
 */
/**
 * @typedef {object} OpenManyOpened
 * @property {true} ok
 * @property {Record<string, unknown>|null} estimate  `ai-use.estimate`'s answer for the batch as it came (a refusal of its own
 *  included); this module's `AI_NO_ACCOUNT` refusal when no account serves the member; null when the estimate threw.
 * @property {OpenManyRun[]} runs  In the order of `steps`.
 */
/**
 * @typedef {OpenManyOpened|OpenManyRefusal} OpenManyAnswer
 */


# [file] coordinator-handoff-5nov-f.md

Process3 coordinator handoff, 5 Nov (f), ~11:55 UTC, from session_018BhcecCMP7CZRbiR8kruPn (Bob's account "Sparky", process3 ONLY attached; context 57%, my own 60% rule). Bob is the owner; his words are instructions. Read with notes/coordinator-handoff-5nov-b.md (rules, Bob's words), the speed rules in notes/coordinator-handoff-5nov.md, handoff e, notes/account-switch-review.md, and notes/coordinator-findings-3-4nov.md from "# 5 Nov, coordinator session_018BhcecCMP7CZRbiR8kruPn" down. Keep process3 as the only attached repository: copy and probe acts go through BOB, ROOT, the MERGER and short sessions started on those repositories.

BOB'S WORDS TODAY (07:30): "Get development going. That's the priority. But also try to understand why the account switch went so badly, and try to fix it so that the next switch works." Both answered: review in notes/account-switch-review.md; fix in process3 PRs 149 (switch out / switch in / switch quiet / merge train release, rulebooks/account-switch.md) and 150 (restart speed), on the copy since pin 5624610.

START, in order
1. Record your id as `coordinator` in process/config.json on the copy's and the probe's tranche, each by a SHORT SESSION on that repository (source_url, source_revision tranche, clone_depth 1): edit the one field on branch p3/coordinator-<x>, PR into tranche, `node .process/tool/p3.mjs merge <pr> --plain --no-review "one-field coordinator id change"`, report. Copy PR 451 / probe PR 225 are the pattern. On the copy the merge now queues in the train and waits: fine.
2. Move my scheduled tasks to yourself (create the same prompt bound to you, delete mine): hourly flow trig_01HbzTWfz1nvy1bpzYxWLN1S (:51), review-trigger check trig_01SA5rYQsCoEcCFiziT6SXfp (5 Nov 19:00), merge-train report trig_013ej4gCQRLe6zmoKtkGKEuT (6 Nov 04:50), survival reads trig_01RqEk5rRvoSqSGfFidkgiLR (16 Nov 17:00), trig_019uQWaaEUugxawc6DAzo59e (18 Nov 17:00).
3. Tell BOB, ROOT and the MERGER your id once config names you; adopt my two open children (below); archive me.

ROLES LIVE
- ROOT session_018BhcefwaVtx4V7dYW63amA (sweep :55). Watcher session_018BhceeMjF6AwKvAHJwkQ1L (daily 11:17).
- BOB session_018BhcefhxhWd9YQkYbKBcTB (took over 09:11).
- MERGER session_018BhcedwsJZrL1WAAcugNk7 (train on pin 73508ce since 10:50; restart it onto 06ab532 when that pin lands: stop after the land in flight, `merge train release --session <it>`, fetch, detach, update .process, start check --wake, train).

MY OPEN CHILDREN (adopt; they report to my id: tell them yours)
- pin move to process3 06ab532 (PR 154): session_018BhcedH89Ji4J97RgC9RKG. Queues in the train. When it lands: MERGER restart (above), archive the session.
- build/release-tier: session_018Bhcedi9YxBmmaJeYtApN3 (named release_path modules a tier ahead of the derived 50-module release set; and whether release_path is a gate run key). Merge it (`merge <pr> --plain --reviewed ... --rounds n`, from a process3 tranche checkout), then a pin move. The pin move tool now prints when it cannot list the copy's PRs; check open pin moves with `gh api -X GET search/issues -f q='repo:neobobkrause/civicsmith-copy is:pr is:open head:p3/pin'` first.
