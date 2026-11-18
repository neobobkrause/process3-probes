# [file] 05-misc.txt (continued)

 * @property {string|null} rerunOf
 * @property {string|null} registered  The run's `created`; null when the stored instant cannot be read.
 */
/**
 * R30: the runs as `bias` reads them.
 * @typedef {object} RunWorkProducts
 * @property {(after: string|null|undefined, limit: number) => string[]} list  The run ids after `after`, ascending.
 *  [bound limit: at least 1; a limit that is not a number, or 0, reads as 50]
 * @property {(run: string) => Promise<RunWorkProduct|null>} read  Null for a run not held.
 * @property {(run: string, viewer: Viewer|null) => Promise<boolean>} visible  R19's sight.
 */
/**
 * R41: the wait source `capture-requests` registers. Every function is synchronous.
 * @typedef {object} WaitSource
 * @property {() => number} tickMs  The source's own cadence in milliseconds.
 * @property {(iso: IsoSecond, limit: number) => {run: string, outstanding: number}[]} holds  The running runs with a request
 *  outstanding and unexpired at `iso`, at most `limit`.
 * @property {(limit: number) => string[]} woken  The running runs with completions not yet woken, at most `limit`.
 * @property {(run: string, limit: number) => {request: string, state: string}[]} completions  A run's completions not yet woken;
 *  `state` is `captured`, `expired`, or any other word, which is counted as refused.
 * @property {(requests: string[], iso: IsoSecond) => unknown} markWoken  Stamps those requests woken, inside the wake's transaction.
 * @property {() => boolean} [configured]  Optional: whether anything drains at all; absent is read as true.
 */
/**
 * `registerWaitSource`'s answer. Its two refusals name a `reason` and carry no `code`, `check` or `translation`.
 * @typedef {{ok: true, module: string} | {ok: false, reason: "WAIT_SOURCE_MALFORMED", detail: string} | {ok: false, reason: "WAIT_SOURCE_DECLARED", module: string, declaredBy: string}} WaitSourceAnswer
 */
/**
 * member-roster's `listenerRefusal`, passed on (R43, R47).
 * @typedef {object} ListenerRefusal
 * @property {false} ok
 * @property {"LISTENER_MALFORMED"|"LISTENER_DECLARED"} code
 * @property {string} reason  The code again.
 * @property {string} detail
 * @property {string|null} [module]  With `LISTENER_DECLARED`: the module that holds the registration.
 * @property {string} check
 * @property {string} translation
 */
/**
 * R43: what each `onRunOpened` listener is called with, once after each successful `open` commits.
 * @typedef {object} RunOpenedNotice
 * @property {string} run
 * @property {string} contextType
 * @property {string} contextId
 * @property {IsoSecond} expires
 */
/**
 * R47, R77: what the check registered for a mode is asked.
 * @typedef {object} OpenCheckAsk
 * @property {string} contextType
 * @property {string} contextId
 * @property {string|null|undefined} plan
 * @property {Stamp|null|undefined} actor
 * @property {Viewer|null|undefined} viewer
 * @property {string} origin  A `RunOrigin`.
 * @property {string|null} response  The response of a re-examination run; null otherwise.
 */
/**
 * R47: a mode's check. It answers null to let the open land, or a refusal naming a `code` (a text), which `open`
 * passes on unchanged. Any other answer, or a throw, is read as no answer: `AI_RUN_MODE_UNCHECKED`.
 * @typedef {(ask: OpenCheckAsk) => (null | ({code: string} & Record<string, unknown>))} OpenCheck
 */
/**
 * An AI part the test bar is held for: run-rules' `TEST_BAR_PARTS`.
 * @typedef {"check"|"investigate"|"extract"|"plan"|"ask"|"enquire"|"explore"|"draft:own_words"|"draft:translation"|"draft:case_account"|"draft:account_check"|"draft:bearing_note"|"draft:textcheck"|"draft:infractiondraft"|"draft:bearingdraft"|"draft:statusreport"|"draft:reading"|"transcribe"|"read"} AiPart
 */
/**
 * R78: whether an AI part may run here.
 * @typedef {object} PartAdmission
 * @property {boolean} admitted
 * @property {UntestedLabel|null} untested  Set only for a part admitted on the test-instance exception.
 */
/**
 * One recorded verification of a mode's first live run (run-rules R19).
 * @typedef {object} VerificationRecorded
 * @property {string} mode
 * @property {string} run
 * @property {string} verified_by
 * @property {string} at
 * @property {unknown} evidence  As recorded, parsed; null when it cannot be read back.
 */
/**
 * What `verificationRecord` is handed. `aiRunsOps` takes all but `by` from the request body.
 * @typedef {object} VerificationArgs
 * @property {RunMode} mode  A mode of the deployment order; any other value is refused, field `mode`.
 * @property {string} run  The run verified: a run this record holds in that mode, in `by`'s sight; else refused, field `run`.
 *  [bound run: a non-blank text]
 * @property {string|unknown[]} evidence  What the verifier saw. [bound evidence: a non-blank text, or a list with at least one
 *  non-blank entry; else refused, field `evidence`]
 * @property {Stamp} by  The member who verified, the control plane's stamp; a machine or nobody is refused, field `verified_by`.
 * @property {InstantArg} [at]
 */
/**
 * What `verificationRecord` hands back.
 * @typedef {object} VerificationDone
 * @property {true} ok
 * @property {RunMode} mode
 * @property {string} run
 * @property {string} verified_by  `member:<id>` of the verifier.
 * @property {string} at  When it was recorded; for a mode and run already recorded, the first recording's instant.
 * @property {boolean} existed  True when that mode and run were already recorded (nothing is written again).
 * @property {{mode: RunMode, deployable: boolean}|null} next  The next mode of the order and whether it is now admitted here; null after the last.
 */
/**
 * @typedef {object} VerificationRefusal
 * @property {false} ok
 * @property {"AI_RUN_VERIFICATION_UNFIT"} code
 * @property {string} check
 * @property {string} translation
 * @property {string} detail
 * @property {"mode"|"run"|"verified_by"|"evidence"|null} field  The field refused; null when the record itself is no object.
 */
/**
 * One result of an AI part on a test set (R75), as `testBarRecord` is handed it and `testBarRecords` answers it.
 * @typedef {object} TestBarRecord
 * @property {AiPart} part
 * @property {string} set  The set's id; `group` is a group's own set. [bound set: a non-blank text]
 * @property {number} set_version  [bound set_version: a safe integer of one or more]
 * @property {number} false_alarm_rate  [bound false_alarm_rate: a number from 0 to 1]
 * @property {boolean} passed
 * @property {string} graded_by  [bound graded_by: a non-blank text]
 * @property {string} at  When it was recorded.
 */
/**
 * What `testBarRecord` is handed: a `TestBarRecord` whose `at` is an `InstantArg`.
 * @typedef {Omit<TestBarRecord, "at"> & {at?: InstantArg}} TestBarArgs
 */
/**
 * @typedef {object} TestBarRefusal
 * @property {false} ok
 * @property {"AI_TEST_BAR_UNFIT"} code
 * @property {string} check
 * @property {string} translation
 * @property {string} detail
 * @property {"part"|"set"|"set_version"|"false_alarm_rate"|"passed"|"graded_by"|"at"|"entry_id"|null} field
 */
/**
 * What `groupTestSet` is handed (R75).
 * @typedef {object} GroupTestSetArgs
 * @property {string} part  [bound part: a non-blank text of at most 60 characters; stored trimmed]
 * @property {string} matter  [bound matter: a non-blank text of at most 200 characters; stored trimmed]
 * @property {string|object} answers  The answers the group's people wrote. [bound answers: a non-blank text of at most 20,000
 *  characters, or an object whose JSON is at most 20,000 characters]
 * @property {Stamp} by  An active member, the control plane's stamp.
 * @property {InstantArg} [at]
 */
/**
 * @typedef {object} GroupTestRefusal
 * @property {false} ok
 * @property {"AI_GROUP_TEST_INVALID"} code
 * @property {string} reason  The code again.
 * @property {string|null} check
 * @property {string|null} translation
 * @property {string} detail
 */
/**
 * What `groupTestResults` hands back (R75). To anyone but an active member, and for a blank part: no matters, no results.
 * @typedef {object} GroupTestResults
 * @property {true} ok
 * @property {string|null} part  The part asked, trimmed; null when blank.
 * @property {number} matters  How many of the group's own test matters are held for the part.
 * @property {{set_version: string|number, false_alarm_rate: number, passed: boolean, at: string}[]} results  The part's results on
 *  the group's own set, oldest first; `set_version` as the store returns it (a text column written with a number).
 */
/**
 * R90: one declared op.
 * @typedef {object} DeclaredOp
 * @property {string[]} classes  The classes of caller the op is open to.
 * @property {boolean} mutating
 * @property {string} weight
 * @property {string} description
 * @property {{accepts: string[], requires: string[]}} fields  The body fields the op's arm reads, and those it cannot do without.
 */
/**
 * A request's address, as far as `aiRunsOps` reads it: the query, where every stamp and every read's argument is.
 * @typedef {object} OpUrl
 * @property {{get: (name: string) => string|null}} searchParams
 */
/**
 * The run's ops, by door name (K3): each a function of no argument that runs the op with the request's body and
 * stamps and answers what the method named answers.
 * @typedef {object} AiRunsOps
 * @property {() => Promise<OpenAnswer>} airunopen  `open`.
 * @property {() => Promise<TickAnswer>} airuntick  `tickAndContinue`.
 * @property {() => Promise<ExitAnswer>} airunclose  `close`.
 * @property {() => Promise<ReadAnswer>} airun  `read`.
 * @property {() => LogAnswer} airunlog  `log`.
 * @property {() => Promise<ListAnswer|ListRefusal>} airuns  `listInContext`.
 * @property {() => Promise<SpawnAnswer>} airunspawn  `spawnPayload`.
 * @property {() => (VerificationDone|VerificationRefusal)} airunverify  `verificationRecord`.
 */


# [file] bob_words_14nov_notice_session.md

# Bob's own typed words, 14 Nov 2026, to the session on one question: when must a module's users be updated? (verbatim, complete, in order)

These are every message Bob typed to that session, exactly as typed. Lines in *italics between messages* are the session's notes on what a message answered; they are not his words.

---

## 1

I am Bob. This session has one question: when a module changes, how do we know which of the modules that use it must be updated, so that the others are left alone?

Read this file first and follow it: process4/working/notice_study/session_brief.md
It gives my rules for how to work with me, the question in my own words, what has been measured so far, and where the data and scripts are. The full groundwork study is beside it, in study.md.

The product's record is in the public repository neobobkrause/civicsmith-copy. Read only. Never commit or push to it.

Start by telling me, in plain words, what the groundwork found and what you think the next step is. Then we will explore it together.

## 2

*The session had asked whether a user module must be updated only when, with the provider's change in place, the user itself is wrong (it no longer loads, its own tests fail, or it breaks a requirement of its own).*

To be clear, a provider's answer to a user changing (content) doesn't necessitate the user being retested. What matters is when the interface to the provider (metadata) changes.

## 3

*The session had reported that, on its reading of the record, ten user modules broke after a change of content only.*

Help me understand why a content change would cause a previously passing test to fail. The interface to a provider is it's domain. The bounds of valid values passed to and received from a provider are it's range. So what I'm saying is that any change to either a provider's domain or range necessitates that its users be retested. But if both domain and range stay the same, then no retesting of users is needed.

