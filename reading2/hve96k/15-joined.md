# [file] owner_words_ideas_18nov.md (continued)


- **The idea.** Bob can see each open job's progress and status without speaking to it. A product's ROOT, ARCH, coordinator, lanes and jobs are grouped under that product, and workers are left out. Finished sessions are archived, not deleted.
- **Bob's words.** "I rarely interact with jobs, but seeing their progress and status is important." And: "sessions that are no longer active are archived so that they don't clog up the session list. There's no downside to archiving sessions because they can be found, reviewed, and even unarchived." (both `bob_words_16_17nov_codex_development.md`). "Only jobs, lanes, ARCH, ROOT, and the process coordinator sessions should be kept in the project." (`bob_words_17nov_project_membership.md`)
- **Why consider it.** The standing page shows what waits for Bob, not what is running. Mine: the process's tool already knows who holds each slot, so a status view costs little. Archiving answers part of the owed question of who closes a finished session, and keeps its record open to review.
- **Where it fits.** How Bob's words become decisions (beside the standing page). Sessions and roles. The table for each harness (grouping and archiving differ).

## 12. Two standing rules for the harness tables

- **The idea.** A harness runs sessions only on hosting that Bob's subscription covers, and anything that would cost more comes to him first. Support for one harness is added beside the other's and never over it.
- **Bob's words.** "Are you in fact designing something that will require additional costs outside of the subscription?" And: "Confirm that changes being added to the process3 repo in support of a Codex-based development process are NOT overwriting the Claude Code support, correct?" (`bob_words_16_17nov_codex_development.md`)
- **Why consider it.** Both rule out design choices early, which is cheaper than finding out late. Mine: both of his sentences are questions, and reading them as standing rules is my interpretation. Keeping each harness's own files apart also lets PROCESS change one harness without retrying the other.
- **Where it fits.** Documents (the table for each harness). What holds a rule.

## What was read

Every line of each file below was read, from the first to the last.

| File | Lines |
| --- | --- |
| `working/design_state_18nov.md` | 106 |
| `owner_words/bob_words_14nov_b.md` | 37 |
| `owner_words/bob_words_14nov_c.md` | 72 |
| `owner_words/bob_words_14nov_notice_session.md` | 114 |
| `owner_words/bob_words_15nov_main.md` | 17 |
| `owner_words/bob_words_16_17nov_codex_development.md` | 89 |
| `owner_words/bob_words_17nov_codex_context.md` | 31 |
| `owner_words/bob_words_17nov_compaction_avoidance.md` | 23 |
| `owner_words/bob_words_17nov_fresh_context_and_process_self_development.md` | 20 |
| `owner_words/bob_words_17nov_project_membership.md` | 19 |
| `HANDOFF.md` | 115 |
| `README.md` | 25 |

The sixth draft (597 lines) was searched and read in part, only to check whether an idea was already in the design. It was not read whole.


# [file] 03-tick.txt

### ANCHOR: /** R72: a provider's refusal for a spent limit (Anthropic's 429
/**
 * One log entry of a tick (R12), handed on to observation-log's one writer, which judges it (its `checkObservation`);
 * a refused entry comes back in the tick's `refused` and the others are appended. Only the fields below are read.
 * (The requirements' `read` and `disagree` fields, R99 at T53, are not passed on by this code.)
 * @typedef {object} RunLogEntry
 * @property {ObservationState} state  What the look established; `NEVER_LOOKED` is refused by the writer on a tick's entry.
 * @property {ObservationLevel} [level]  Absent or empty is `document`.
 * @property {string|null} [subject]  What was looked at, stored as text.
 * @property {boolean} [governed]  Counted only when exactly `true`.
 * @property {ConditionKind|null} [condition]
 * @property {string|null} [bound]
 * @property {string|null} [result_kind]  The kind of what the look produced (the writer's vocabulary, e.g. `capture`, `content`, `lead`, `record`, `observation`).
 * @property {string|number|null} [result_ref]  What the look produced; the writer requires one for `PRESENT`.

The Eyre store took in 5 swifts.

 * @property {string|null} [detail]
 * @property {string|null} [bundle]  Must be absent or empty: the writer refuses an entry naming a bundle (`AI_LOG_NOT_A_BUNDLE`).
 */
/**
 * R84: how a segment ended, as `agent-worker` reports it. A value that is not a plain object is read as none sent.
 * @typedef {object} SegmentEnd
 * @property {string|null} [by]  What stopped the segment; null or absent when it stopped on its own segment bound.
 *  [bound by: trimmed and cut to 80 characters; blank is null]
 * @property {boolean} [done]  Whether the run's work is done; counted only when exactly `true`.
 * @property {string[]} [refusals]  The refusal codes the segment met. [bound refusals: each trimmed and cut to 80 characters,
 *  blanks and non-texts dropped, at most the first 20 kept]
 * @property {string|null} [error]  A code, when the segment ended in an error. [bound error: trimmed and cut to 80 characters]
 */
/**
 * R72, R88: one conversation that reached a provider since the last tick, handed on to `ai-use.countUsage`, which
 * judges it; an entry it refuses refuses the whole tick `AI_RUN_CONSUME_INVALID`, nothing counted. (The requirements'
 * shape `{mode, entry_id, label, usage, calls}`, R72 as amended at T53, is not this code's: it reads `model` and
 * `effort` and passes on no `entry_id` or `label`.)
 * @typedef {object} UsageEntry
 * @property {string} mode  The conversation's mode; ai-use judges it.
 * @property {string|null} [model]  The model that served it; absent is null.
 * @property {string|null} [effort]  R88: the conversation's effort; absent is null. [bound effort: a lowercase word (R88); ai-use judges it]
 * @property {unknown} usage  The provider's figures, the neutral record `agent-worker` passes; ai-use fixes its kind.
 * @property {number|null} [calls]  [bound calls: a positive whole number, or null (R72); ai-use judges it]
 */
/**
 * What `tick` and `tickAndContinue` are handed (R11, R12). `aiRunsOps` takes all but the three stamps from the request body.
 * @typedef {object} TickArgs
 * @property {string} run  The run's id; one not held, or not in the viewer's sight, answers `found: false`.
 * @property {unknown} [state]  The run's new resumable scratch; absent or null leaves the held state as it is.
 *  [bound state: its JSON is at most 262,144 bytes of UTF-8, else `AI_RUN_STATE_TOO_LARGE`]
 * @property {Partial<Record<RunBound, number>>|null} [consume]  What was spent since the last tick, bound by bound; a value that is
 *  not a plain object, or a key that is no bound, is `AI_RUN_BOUND_UNKNOWN`. [bound consume: each figure a safe integer of zero or
 *  more (`AI_RUN_CONSUME_INVALID`); `lease` takes no figure at all and a `PlaneCountedBound` only 0 (`AI_RUN_BOUND_PLANE_COUNTED`)]
 * @property {RunLogEntry[]|null} [log]  The entries to append, in order; a value that is not a list appends nothing.
 * @property {number|null} [leaseMs]  [bound leaseMs: used when `Number(leaseMs)` is above 0, otherwise the default lease]
 * @property {InstantArg} [at]
 * @property {SegmentEnd|null} [segment_end]
 * @property {UsageEntry[]|null} [usage]  Absent or null is none; a value that is not a list is `AI_RUN_CONSUME_INVALID`.
 * @property {Stamp|null} [actor]
 * @property {Viewer|null} [viewer]
 * @property {Stamp|null} [caller]  The caller's principal; one that is not the run's `principal_plane` (run-rules R5: a member's
 *  compared without its token id) is `AI_RUN_NOT_PRINCIPAL`.
 */
/**
 * `tick`'s answer for a run that is not held or that the viewer cannot see: the two answer alike.
 * @typedef {object} TickNotFound
 * @property {string|null} run  The id as handed; null when none was.
 * @property {false} found
 * @property {string} note
 * @property {never} [ticked]  Never present on this form.
 * @property {never} [segment_end]  Never present on this form.
 */
/**
 * The one exit's and `close`'s answer for a run that is not held or that the viewer cannot see: the two answer alike.
 * @typedef {object} ExitNotFound
 * @property {string} run  The id as handed.
 * @property {false} found
 * @property {string} note
 * @property {never} [terminated]  Never present on this form.
 * @property {never} [bound]  Never present on this form.
 */
/**
 * `dispatchMemberRun`'s answer for a run that is not held or that the viewer cannot see: the two answer alike.
 * @typedef {object} MemberDispatchNotFound
 * @property {string|null} run  The id as handed; null when none was.
 * @property {false} found
 * @property {string} note
 * @property {never} [dispatched]  Never present on this form.
 * @property {never} [dispatch]  Never present on this form.
 * @property {never} [withheld]  Never present on this form.
 * @property {never} [code]  Never present on this form.
 */
/**
 * `tick`'s refusal: nothing was appended and no budget was spent (the conversations of a tick held back by a limit are
 * still counted, they were made and paid for).
 * @typedef {object} TickRefusal
 * @property {string} run
 * @property {true} found
 * @property {false} ticked
 * @property {string} status  The run's status as held.
 * @property {"AI_RUN_NOT_PRINCIPAL"|"AI_RUN_NOT_PROJECT_MEMBER"|"AI_RUN_BOUND_UNKNOWN"|"AI_RUN_BOUND_PLANE_COUNTED"|"AI_RUN_CONSUME_INVALID"|"AI_RUN_STATE_TOO_LARGE"|"AI_NO_ACCOUNT"|RelayedCode} code
 *  In the order asked; a relayed code is `ai-use.useCheck`'s (the paying account's limit).
 * @property {string|null} check
 * @property {string|null} translation
 * @property {string} [detail]
 * @property {string} [note]
 * @property {string} [reason]  The code again, on a refusal of `usage`, of the account, and on ai-use's.
 * @property {string|null} [bound]  With a refused `consume`: the bound refused, null when `consume` was no map.
 * @property {number} [bytes]  With `AI_RUN_STATE_TOO_LARGE`.
 * @property {number} [limit]  With `AI_RUN_STATE_TOO_LARGE`: 262,144.
 * @property {number} [counted]  With ai-use's limit refusal: how many of the tick's conversations were counted all the same.
 */
/**
 * `tick`'s answer for a run that has already ended: nothing is appended.
 * @typedef {object} TickNotRunning
 * @property {string} run
 * @property {true} found
 * @property {false} ticked
 * @property {string} status
 * @property {string|null} bound  The bound or ending that stopped the run.
 * @property {string} note
 */
/**
 * What became of the segment whose end a tick carried (R84).
 * @typedef {object} SegmentEndAnswer
 * @property {boolean} logged  Whether anything was appended by this tick.
 * @property {"continue"|"done"|"error"|"ended"} next  `continue`: the segment stopped on its own bound, the run is running and not
 *  done; `done`: the run's work is done; `error`: the segment ended in an error; `ended`: the run is no longer running.
 * @property {ContinuationDispatch} [dispatch]  Only from `tickAndContinue`, and only when `next` is `continue` and the run still runs.
 */
/**
 * R84: what `tickAndContinue` did about a segment to be continued.
 * @typedef {object} ContinuationDispatch
 * @property {boolean} dispatched
 * @property {"RUNNING"|"DISPATCHED"|"LIMIT"|"REFUSED"|"SILENT"|"WITHHELD"} state  The dispatch's outcome, or `WITHHELD` when nothing was sent.
 * @property {string} [reason]  With `WITHHELD`: the reason's name (a `WithheldReason`, a refusal's code, `NOT_DISPATCHED` or
 *  `DISPATCH_FAILED`). [bound reason: cut to 80 characters]
 * @property {string} [says]  With `WITHHELD` of a run that is not a member's: the decision's sentence.
 */
/**
 * `tick`'s success (R12).
 * @typedef {object} TickDone
 * @property {string} run
 * @property {true} found
 * @property {true} ticked
