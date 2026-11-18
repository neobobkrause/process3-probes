# [file] bob_words_14nov_notice_session.md (continued)


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

## 4

Your last response is highlighting how important it is that module tests be designed and written correctly. The tests are supposed to confirm bounds, confirm the accuracy of results under valid conditions, and confirm the recognition of an error when out of bounds. Tests should not fail because they expect a specific valid response but receive a different though still valid response.

Programming languages like JS include language constructs for defining an interface. The specificity of the interface can vary because of many factors that include how typed a language is. But even in loosely typed languages the formal interface can be augmented with structured comments that the language runtime doesn't see but that clarifies how the interface is to be used, and used by our build tools to determine whether the domain or range has changed so that user modules need to be updated.

## 5

I need your assessment of TypeScript’s reader tool. Once every module has these comments that define an interface, if an interface changes then the comments would also change. The act of changing those comments would result in the provider's users being notified that there was an interface change that they may need to respond to. If a job makes changes but none of those changes result in interface comment changes, then that provider's users don't need to be notified. Is that a solid strategy?

## 6

The comments and tool can also inform module tests to ensure that boundaries are properly checked.

Properly done, this sounds like a means by which the set of notifications sent out when a provider changes to be greatly reduced while still ensuring that user modules are still notified when an interface changes.

That said, in order for this to work every module needs to be edited to add structured comments. This will be a challenge given that adding comments that describe the range of an interface requires a level of understanding that isn't readily apparent without careful and rigorous analysis.

## 7

I need more info on whether the trigger is the written-out interface. You also ask whether the tool may refuse a comment that disagrees with its code. You know what we're trying to achieve. What do you think on both of these questions?

## 8

*The session had put two questions, each with its recommendation. First, which event sends the notice to user modules: "A. A job edited a comment" or "B. The listing after the change differs from the listing before", where the listing is the module's interface as the tool writes it out from the code and its structured comments together. Second, whether the build tool may refuse a comment that disagrees with its code, inside a job's own module tests.*

which event sends the notice: B

the tool may refuse a disagreeing comment

## 9

*The session had listed four points on which Bob had typed nothing yet: who is told (every user of the provider, or only the users of the entry that changed); how a user module states which parts of a provider it uses; what rule applies to a module that has no comments yet; and the one fixed form for bounds written in words.*

Who is told: ideally only the users of the entry that changed. But in order to do so, a user module must state which parts of a provider it uses. Is that a reasonable thing to support?

What rule applies to a module that has no comments yet: The first time a job for a module without comments starts the first thing it does is add the structured comments.

The one fixed form for bounds written in words: If those words are changing, then there must be a reason why. It must be that that interface is changing, right?

## 10

*The session had asked Bob to decide whether a user module's use of a provider may be worked out by the tool from the user's code and comments, with no separate list kept by hand. It had also said it would add one detail unless he objected: "The comments go in as a step of their own, before the job changes anything else, and they describe the module as it stands."*

Why is this mine? - may a user’s use of a provider be worked out by the tool from the user’s code and comments, with no separate list kept by hand? You tell me.

Agreed: The comments go in as a step of their own, before the job changes anything else, and they describe the module as it stands.

## 11

*The session had asked which changes to an existing entry of a provider's interface send a notice to that entry's users, and had recommended: for what a provider accepts, tell users only when the new interface cannot stand in for the old (something removed, renamed, newly required or newly refused), so that accepting more tells no one; for what a provider hands back, tell users of the entry on any change to it, because handing back something new can break a user.*

I agree with your recommendation

## 12

So where does this leave us with regard to the task of making a distinction between meaningful interface changes of a provider and all other changes? Is it your assessment that what we have is load-bearing?

## 13

*Received on 15 Nov 2026 by the session's clock. The session had reported that the tool pointed at 5 of the 11 broken user modules and at none that was not broken, and that the largest reason for the misses was operations called by name through a door.*

How do we make the calls by name made followable?

What else is needed for a load-bearing approach?

## 14

*Received on 15 Nov 2026 by the session's clock. The session had asked whether the tool may also refuse a module's code that disagrees with a provider's stated interface, inside that module's own module tests and on that module only, and had recommended yes.*

As recommended.

How do we wrap this up?

## 15

*Received on 15 Nov 2026 by the session's clock. The session had asked whether it should send the main session a message naming the result files, or Bob would tell it himself.*

Send the other session a message. Are you ready to run a proof session to confirm that everything works? You can use the process3-probes repo for that purpose. If you run it, pick a model and effort that's appropriate.

## 16

*Received on 15 Nov 2026 by the session's clock. The session had reported that the proof session, after six designs of its tool, still met holes in a fresh blind round (10 in 16 changes, by the proof session's own table), had recommended stopping it, and had asked whether to stop it and have it write up or let it continue.*

Stop, write it up. It's usable, even if there's an occasional extra unnecessary notice sent out. It's 2 orders of magnitude better than the old method.


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
 */
/**
 * A refusal code minted by another module and passed on unchanged; that module fixes the list, so it is left open
 * here. (Written `string & {}` so the codes named beside it stay readable in the written-out interface.)
 * @typedef {string & {}} RelayedCode
 */
/**
 * Any other text. Written beside a closed list where this module is handed the value unjudged (a query's text from the
 * door, a mode from a test's wiring) and answers every word outside the list as the field's description says.
 * @typedef {string & {}} OtherText
 */
/**
 * The catalogue row every refusal of this module carries beside its `code` (Terms: "Every refusal names `code` and
 * carries its catalogue `check` and `translation`").
 * @typedef {object} CatalogueRow
 * @property {string|null} check  The catalogue check's id, e.g. `C-33.30`; null only where run-rules' table holds no row for the code.
 * @property {string|null} translation  The row's sentence in plain words; null only where no row is held.
 */
/**
 * A refusal as observation-log's one writer answers it for a log entry it did not append (its `checkObservation`),
 * or as run-rules' pure rules answer it: passed on whole.
 * @typedef {object} RuleRefusal
 * @property {false} ok
 * @property {string} code  The rule's code; for a log entry observation-log's (`AI_LOG_STATE_UNKNOWN`, `AI_LOG_NOT_A_BUNDLE`, `OBS_PRESENT_NO_REFERENT` and the rest of its table).
 * @property {string} check
 * @property {string} translation
 * @property {string} detail
 * @property {string|null} [bound]  The bound a figure was refused for (run-rules' `checkConsume`).
 * @property {string|null} [field]  The field refused (run-rules' `checkVerification`, `checkTestBarRecord`).
 */
/**
 * R78: the label of a run admitted on the test-instance exception, as run-rules' `untestedLabel` builds it and as it
 * is stored at the open and read back (any JSON object stored there is answered as stored).
 * @typedef {object} UntestedLabel
 * @property {"untested"} kind
 * @property {string} part  The AI part admitted, here the run's mode.
 * @property {string} set  The test set's id (`civicsmith`, or a module test's own).
 * @property {number} set_version  [bound set_version: a whole number of one or more]
 * @property {"ai.label.untested"} words  The word-table key of the label's sentence.
 */
/**
 * R10: how the project gate (run-rules R6) let the act through, stated on a success answer of `open` and `tick`.
 * @typedef {object} ProjectGateStated
 * @property {boolean} applied  True only when a project's participation was asked and held.
 * @property {"NO_MEMBER_BEHIND_CALLER"|"INQUIRY"|"PARTICIPANT"} ground  run-rules' `PROJECT_GATE_GROUNDS` key.
 * @property {string} why  That ground's sentence.
 * @property {number} projects  How many of the context's projects the viewer sees. [bound projects: a whole number of zero or more]
 */
/**
 * One bound's figures as stored (`ai_run_bounds`) and answered by `read` and `spawnPayload`.
 * @typedef {object} BudgetRow
 * @property {string} bound  A `RunBound` for every row this module writes.
 * @property {number} allowed  [bound allowed: a whole number; 0 on a row made by a spend with no declaration]
 * @property {number} consumed  [bound consumed: a whole number of zero or more]
 * @property {string|null} unit  The unit the opener named, verbatim; null when none.
 */


# [file] owner_words_ideas_18nov.md

# Ideas in Bob's own words that are not yet in the design, 18 Nov 2026

Length: 112 lines. Last section: "What was read".

Written by a Claude worker. It lists practices and ideas found in Bob's typed words that the design-state file of 18 Nov does not hold, and that the sixth draft does not hold where the design-state file is silent. It lists no history and no differences between older and newer words. None of the twelve adds a test, check, gate, review or stop. Nothing here is a decision. Best first.

Quotes are exact, with his spelling. "Mine:" marks an interpretation by this worker. One caution: the file `bob_words_16_17nov_codex_development.md` holds extracts that an assistant chose from a longer conversation, so its quotes are exact but not complete.

## 1. Step around a weakness before it bites, and name the sign that it is near

- **The idea.** State as a founding principle that Process4 avoids the situations where a known weakness of AI sessions does harm, and does not rely on repairing the harm afterwards. For each weakness the design steps around, say which sign shows it is near and what the session then does.
- **Bob's words.** "I find that the most effective means of mitigation is to avoid situations when the shortcomings become a factor. But a fundamental requirement of this approach is to identify (or sense), either at runtime or when coding, when the shortcoming is about to come into play." (`bob_words_17nov_compaction_avoidance.md`)
- **Why consider it.** The design already works this way for reading and for refresh, but never says so. Said once, it gives PROCESS a plain yardstick for any proposed change. It also shows a gap. Mine: refresh "at a stated fill level" works only where a session can read its own fill level and trust it. Where a harness does not give that reading, a stand-in that can be counted is needed, such as how much the session has read so far.
- **Where it fits.** The background document, as a principle. Sessions and roles (refresh). The table for each harness (what carries "fill level").

## 2. A short page that ranks a product's governing documents

- **The idea.** One short page for each product lists its kinds of governing text in order of rank and says that a lower one never overrides a higher one. Mine: the order is the one in his own list, mission, principles, standards, requirements, design decisions; and a session that finds two in conflict follows the higher and tells ARCH.
- **Bob's words.** "I'm open to the addition of a canon authority map. The model must not mistake a local implementation decision for permission to violate a higher-level principle." (`bob_words_17nov_codex_context.md`) And: "abide by the mission, principals, standards, requirements, and design decisions documented in the canon" (`bob_words_16_17nov_codex_development.md`)
- **Why consider it.** A job reads its module's requirements and ARCH's decisions. Those are the nearest and most detailed texts, so with no rank stated they win by default. A ranking page is short enough for every role to read in full.
- **Where it fits.** Documents (a page in the product's folder; mine: a like page for the process's own texts). Work and requirements. Lanes.

## 3. A stop that nothing called for is a process fault, and its cause is corrected

- **The idea.** When a session stops with work left to do and nothing that only Bob can clear, the cause is found and corrected so that it does not happen again. Waking the session is not the whole answer.
- **Bob's words.** "Why have you stopped? (That's a real question.)" And: "Can you correct the conditions that caused you to stop so that it doesn't happen going forward?" (`bob_words_16_17nov_codex_development.md`)
- **Why consider it.** The sixth draft has ROOT's hourly alarm wake or replace a stopped session. That repairs each stop and leaves its cause in place. Stops made to report progress or to ask leave to go on are what unattended work can least afford. Mine: the cause is most often a line in a role's principles, so one correction ends that kind of stop for every later session.
- **Where it fits.** Sessions and roles. The existing route for a process fault, from ARCH to the coordinator to PROCESS. It uses that route and adds nothing new.

## 4. Acts of Bob's that fall due on a known date are asked for ahead of time

- **The idea.** Where an act of Bob's has a known date, such as renewing a sign-in or a token, it appears on his standing page before the date, with the steps. The process goes on cleanly when he does it.
- **Bob's words.** "It might be reasonable to ask me to be involved in refreshing the token before the 30 day expiration date. But the Codex version of process4 must recognize and cleanly support that act." (`bob_words_16_17nov_codex_development.md`)
- **Why consider it.** A lapsed credential stops everything and only Bob can clear it. If the date is known, a full stop and a restart through ROOT become one small planned act. The design lists his acts but none with a date. Mine: the process's tool holds the dates.
- **Where it fits.** How Bob's words become decisions (the standing page and the phone notification). The list of Bob's acts. The table for each harness (what expires, and when).

## 5. Process4 develops itself: PROCESS with lanes of its own, and one session for one hard question

- **The idea.** PROCESS may have lanes of its own for standing subjects: context, permissions, messages between sessions. A hard open question gets a session of its own with a written brief and a bounded task, and that session ends with a written result once the result is usable. The remaining design work moves into these constructs as soon as it can.
- **Bob's words.** "prioritize trying to get process4 development to the point that its constructs can be used for its further development" and "continue as PROCESS, with lanes, as needed" (`bob_words_17nov_fresh_context_and_process_self_development.md`). "Maybe we should create a separate session that focuses only on this issue so that we can explore the challenge in as much detail as necessary" (`bob_words_14nov_c.md`). "Stop, write it up. It's usable, even if there's an occasional extra unnecessary notice sent out." (`bob_words_14nov_notice_session.md`)
- **Why consider it.** The design gives PROCESS one session. Every process subject held in one session fills it quickly. The study of notices already worked this way and reached a usable result. Mine: using its own constructs early is also the cheapest trial of them.
- **Where it fits.** Sessions and roles. The design does not say who starts a lane of PROCESS. Mine: PROCESS does, as ARCH starts a product's design lanes. Also the steps proposed, on trial, in force.

## 6. Workers: a narrow brief, a short answer, and sometimes a decision

- **The idea.** State workers as the standing way a long-lived role keeps heavy reading out of its own context: a narrow brief, a short answer in a set shape, and the worker ends when its work is done. A brief may also hand the worker a decision to make, which it reports with its grounds.
- **Bob's words.** "the use of highly targeted and structured subagents to do research and complete tasks for the benefit of parents without clogging the parents' context window" and "these workers are also sometimes tasked with making material decisions based on information they gather" (`bob_words_17nov_codex_context.md`). "FYI, process4 has no need for subagents to stay alive once their initial scope of work is completed." (`bob_words_16_17nov_codex_development.md`)
- **Why consider it.** The sixth draft names workers only for bulk work and parallel sub-tasks. Their part in protecting the parent's context belongs with reading in full: the worker reads in full what the parent cannot hold. A decision handed to the worker spares the parent from reading the sources again to decide. Mine: a worker's answer is kept under the same measured maximum as any other text read in full. `HANDOFF.md` records the same lesson in Claude's words, not Bob's: workers write files and return short summaries.
- **Where it fits.** Sessions and roles (workers). Reading in full.

## 7. No assurances: every session that speaks to Bob says what is proven and what is not

- **The idea.** A rule for the coordinator, PROCESS, ARCH and lanes: never assure Bob that something will work. Each claim put to him says whether it has been measured.
- **Bob's words.** "Do not assure me that something will work. Say what is proven and what is not." (`bob_words_14nov_b.md`)
- **Why consider it.** Bob decides from what he is told. A recommendation that hides what is unproven takes the decision from him. The rule costs nothing. Mine: he gave it to the design session; carrying it into the running process is my reading. It would apply to the reasons given with a recommendation and to the account after each round.
- **Where it fits.** How Bob's words become decisions (the form of a question; the account after a round). Each role's principles.

## 8. Set the maximums and the fill level by useful, correct work, not by window size

- **The idea.** Choose each harness's maximums and its fill level by one yardstick: after a session has read what it must, is there room to do a worthwhile piece of correct work and hand over, all before the fill level?
- **Bob's words.** "What they require is sufficient token to perform enough useful - and correct! - work to justify the investment of time and tokens" (`bob_words_17nov_compaction_avoidance.md`)
- **Why consider it.** The Codex maximums are still owed, and this says what they are for. What a session reads at its start is overhead. Mine: the reading at the start, one piece of work and the handover should together fit under the fill level, with room to finish the handover. If they do not, the role's texts are too long or the piece of work is too large, and that is the thing to change.
- **Where it fits.** Reading in full (the maximums). Sessions and roles (the fill level). The owed Codex values.

## 9. A message wakes the session it is sent to

- **The idea.** Say plainly that a message from one session to another wakes the receiver at once. No session depends on a timed wake to learn that a message has come.
- **Bob's words.** "Confirm that the communications between sessions will be reactive - meaning a message sent to a session immediately wakes up that session to handle the incoming message." (`bob_words_16_17nov_codex_development.md`)
- **Why consider it.** The sixth draft has ROOT's hourly alarm as a safety net, but does not say how an ordinary message arrives. Refilling a slot in the same turn, and reaching Bob quickly, both depend on it. The harnesses differ here, so the table for each should name what carries it.
- **Where it fits.** Sessions and roles. The table for each harness.

## 10. The process's messages and bookkeeping do not pile up in a repository

- **The idea.** What sessions say to each other, and the process's running records, never build up as files or commits in a repository.
- **Bob's words.** "An earlier version of my development process tool used github for process communication and bookkeep, which bloated the repo and added 1,000's of files that are useless but can't be deleted cleanly." (`bob_words_16_17nov_codex_development.md`)
- **Why consider it.** What the shared state holds is still owed. This gives it a limit before it is built. Mine: the shared state is a small fixed set of records, each rewritten in place; messages travel by the harness's own messaging and are not stored as files; and anything the process writes into a product's repository can later be removed cleanly.
- **Where it fits.** Sessions and roles (the shared state, among the technical matters Claude settles).

## 11. Bob can see at a glance what is running

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


# [file] merge-train-trial.md

# Merge train trial (Bob's design and word, 5 Nov ~02:20 UTC; design revised 02:35 after the design study)

Bob, 5 Nov: "Yes, begin the trial of the merge train when we're ready. But be sure to measure so that we understand the tradeoffs and balance being struck." Replaces the self-merge trial (notes/self-merge-trial.md): jobs do not merge their own PRs; one actor runs the train.

## Design (revised 02:35)
GitHub's merge queue is not offered on these user-owned repos (Bob checked the ruleset editor, 02:33). The design study found most of the gain is removing pickup (sim: automatic one-at-a-time 7.0/20.5 vs actual 8.7/33.7 median/p90 min; batches 5.2/13.5) and that batch gates would be weaker than today's per-PR job re-gate. So the trial runs: automatic serial per-PR merges on green, next PR prepared during the current gate, in a dedicated MERGER session; batching stays off and is reconsidered with Bob when measured queue depth at merge time stays at 3 or more. The original batch design follows for reference.

### Original batch design (not built)
- No per-PR merge queue. While batch N's gate runs, batch N+1 is assembled from every job PR that is green on its own receipt, ready, and compatible: merges cleanly with the tranche and with the batch's other members (git merge-tree), review-triggered PRs only after their review passed.
- One gate per batch, on the tranche plus all members. Each member is still its own merge commit in order, with its own merge row, cost row and receipt check, so records and reverts stay per PR.
- On failure: bisect (halves, gated), merge the passing part, send the culprit back to its job with the failing run.
- The next batch is formed when the current one's gate is near its end (median duration known; the tool polls every 15 s), then the train continues. Batches size themselves: small when greens trickle in, large in bursts or behind long gates.
- Run by the MERGER, a session of its own that ROOT starts and replaces (not BOB's loop): `p3 merge train`, one serial loop over the tool's per-PR merge under a lease on the state branch. No batches. (process3 PR 142, b8d5176)

## Measures (baseline: 4-5 Nov, measured 01:50 and by measure/merge-train-sim)
- green -> merged per PR: median, worst (baseline median 11.0 min, worst 85)
- PR-minutes waiting after green; idle job sessions waiting on merge (01:54: 11 of 19)
- gate runs and gate-minutes per merged PR; cancelled runs per PR
- batch size distribution; batches failed; bisection gates; culprits and how often a good PR was delayed by a bad one (minutes)
- conflicts caught at batch time vs after merge; reverts; post-merge defects (survival read)
- velocity, efficiency, quality as the velocity audit defines them, before vs during
- state-branch push tries per write (batch merges add rows at once)

## Stop rules
- more than one merged PR needing a revert, or a post-merge defect the per-PR path would have caught
- any state-branch push hitting its try limit
- median green -> merged worse than the baseline over 3 hours

## Decision after one day on the copy
Keep, adjust or drop, reported to Bob with the figures and the balance struck.


# [file] records-inventory.md

# Records that carry a condition or can go stale (R13)

Bob, 6 Nov, about 17:00Z: "Go with option 2, fix it in the tool, not just for this case, but fix process3 to anticipate and address these kinds of situations." Recorded state carries a checkable end condition; the tool ends it when the condition holds; stale state is found and cleared by the process, not by hand (Foundations, Bob's, 6 Nov). The code: `tool/lib/ends.mjs` (conditions), `tool/lib/expire.mjs` (stale records found and ended), `tool/lib/hold.mjs` (holds).

| Record (state branch unless said) | Its end condition | The tool can check it | How it ends |
|---|---|---|---|
| Hold (`holds/holds.jsonl`) | its PRs land (`--prs`), a condition (`--when`), or its time (`--until`); words alone are refused | yes | the tool writes its end row, by `process3`, naming the condition, after any act that writes, at layer open and at the sweep; status shows it holding nothing at once |
| Hold from before conditions (free text) | "until layer <n> closes / opens", read from its words where plain | yes, when plain | as above, the end row marked read from its words; words that say something follows ("after it", "then", "pauses") are not read and are reported by id until their `--until` time |
| Starts owed (`flow/owed.json`) | a start made after it | yes | paid by `job start --ready` (already) |
| Reschedule (`layerflow/<n>/reschedule`) | the user's land holds the provider's land | yes | answered by the land (already, `outstanding`) |
| Layer events (`layerflow/<n>`) | open ends when the layer merges | yes | `layer merge` writes merged (already) |
| Layer close (`layers/closed.jsonl`) | none: a fact | — | — |
| Lane seat (`lanes/sessions.jsonl`) | its session is archived | yes, with list_sessions | the sweep (which reads list_sessions) writes its end row, by `process3`; a session the list does not hold is unknown, never gone |
| Lane ask (`lanes/asks.jsonl`) | a recorded decision | yes | `lane ask --record` (already); one whose lane is no longer configured is reported |
| Triage owed (`notices/triage/owed`) | the triage recorded | yes | `notice triage` (already) |
| Role address (`addresses/<role>.json`) | its session archived | yes, with list_sessions | reported: a role's next session is named by handover or `address`, which the sweep's own steps start |
| Coordinator id (`process/config.json`) | its session archived | yes, with list_sessions | reported: the config changes by pull request |
| BLOCKED mark (ledger entry) | a person's ruling | no | reported with its age (status, already) |
| Deferral at a layer close (`layers/closed.jsonl` deferred) | its module's next job | yes | the job's start carries it (already) |
| Merger lease, in flight, plain queue (`merger/`) | their expiry time | yes | time-limited (already); the train is being removed |

Seen on the copy, 6 Nov: hold-19 to hold-22 ("until layer 6 closes … ends when the coordinator says") end by `layer_closed:6`, read from their words. hold-18 ("until layer 6 closes start only layer 6 work; after it product work pauses for the layer-branch pin") is not read: its words say something follows the close, so it holds until its time, 7 Nov 00:15Z, and is reported. hold-23 and hold-24 name no condition the tool reads; they hold until their time, 7 Nov 03:08Z and 03:49Z.


# [file] bob_words_14nov_b.md

# Bob's own typed words, 14 Nov 2026, second message of the day to the main session (verbatim, complete)

The throwaway repo that you need already exists: process3-probes.

A tranche ends after a successful external walk of a development deployment. So a deployment is a step in a tranche. But if flaws are found during an external walk those flaws are added to the next round, not the next tranche. So a tranche only ends when an external walk (of a development deployment) completes without flaws. A release can (optionally) be started after a tranche completes. So a release is always fully tested and walked successfully.

Yes, a job writes its own tests. That's an important responsibility. It's also a challenge because tests must be complete yet fast and efficient.

An internal walk uses the UX Screens document to confirm that the workflow matches the definition. The external walk follows the UX journeys to confirm that all journeys can be completed successfully to produce proper results.

You say that most job starts are likely to be caused by notices that turn out to need no change (an estimate from a simulation, not a measurement). Explain what you mean.

You also say that ehe line between correcting the process and adding to it cannot always be drawn. Explain what you mean.

You say that the narrower trigger in the draft, “the interface changed”, would have missed 5 of the 241. You say that you have replaced it with the wider wording, which missed none on this record. When you change something I defined you need to describe the PROPOSED change in words I understand so that I know what you're proposing and whether to approve the change or not.

You say that 122 pairs of modules depend on each other through tests without declaring it. Why are there so many cyclic references in the tests - just laziness? How do these errors get corrected?

Are you saying that 71% of job merges change an interface? How was that measured? How certain are you that the test of an interface change is correct?

Process3 never finished a tranche because it kept adding test after test so that it stopped making progress before it could finish. 

You say that several things are left as “to be settled when built” with no mechanism named. What are you talking about here?

Lets be clear about how the process is changed (and how it's not changed). Process changes only happen in a separate process lane call PROCESS that I interact with. Though process changes are often technical and detailed, the PROCESS session will explain the nature of the problem and suggestion options for fixing it for me to explore and ultimately choose. Because updates require my involvement and I might be away from my computer for extended periods, there could end up being more than one change being proposed in the PROCESS session at a time. When that happens, the set of changes are considered together as a group that could potentially have interactions and implications between. The process after a proposed change is made must continue to meet the process4 requirements (or the requirements changed with my explicit approval). The transition from the process a product is being built using to the updated process will be done only with my prior approval, with PROCESS proposing the best and least disruptive means of making the update.

You can create a subtree in the process3 repo for the container being used to update to process4.

# Earlier own typed words of 14 Nov (first message), the working rules
- "Talk to me in plain words. No codes, no shorthand, no references to things I have not seen. I have not read your working files."
- "Decide technical matters yourself and tell me what you decided. Bring me only what is mine to decide, with what it is, why it matters to me, and your recommendation."
- "Only words I wrote count as my word. Never record your decision or your summary as mine."
- "Do not assure me that something will work. Say what is proven and what is not."
- "Do not add tests, gates, reviews or checks. Process4 has three tests, ever."
- "Keep your context under 70%. Do the heavy reading with workers."
- On the first draft: "it states Process4 in plain words, including my decisions of 13-14 Nov"
- "The hardest open problem: today nothing physically stops a session adding a test or a check to the process. That rule exists only as text, and in Process3 text alone did not hold."


# [file] coordinator-handoff-5nov-g.md

Process3 coordinator handoff, 5 Nov (g), ~16:00 UTC, from session_018BhcegkGtAhUqZ59UwPUUK (process3 only attached). STATE AND OPEN ACTS ONLY. This page carries no rules and no restatement of Bob's words: the principles live in the Foundations, the Build Plan and the rulebooks; read them, and read Bob's own messages in his conversation, not summaries of them. Earlier handoffs (5nov to 5nov-f) carry "Bob's" lists that were found wrong today (14 of 21 were mechanisms): do not inherit any item from them as Bob's.

WHAT GOES TO BOB: only an act his approvals in CLAUDE.md reserve to him or forbid to sessions, his keys or accounts, or a missing product requirement. Everything else: decide, act, report after. Builders act on their own judgement; do not make them wait for rulings.

START
1. Record your id as `coordinator` in process/config.json on the copy's and the probe's tranche by short sessions (copy PR 500 / probe PR 226 are the pattern). Keep the old coordinator alive until the copy's id lands (today the gap left the roles unable to take orders).
2. Move my tasks to yourself: hourly flow trig_012fisRQBm9A35nRJVHJxzDF (:51), review-trigger check trig_01GvniRGXY2LtU6QWjFQzgHL (5 Nov 19:00), merge-train report trig_01LZ76CqYUXnZ81uCFJu6V5J (6 Nov 04:50), survival reads trig_016VcmuCPzaz6U2ka9kuL124 (16 Nov), trig_019UEdG8AYSp73GJKc8GyM31 (18 Nov).
3. Adopt my open children (below), tell ROOT, BOB and the MERGER your id, archive me.

IN FLIGHT AT 16:00
- Bob changed the copy's CLAUDE.md line 11 at 15:47 (commit 7c7e7c9a, his account via the website): design lanes under BOB own their lane folders, ux-substrate included, and decide design and wording there. New approvals hash 5a9c30944212f0622890ca6d8ef1fedf7163e271d28616a5217416c185dbe07c; every role and task prompt pinned the old one (ae592a58...).
- Role restart on the new hash: new ROOT session_018BhceeH3xpSe2ZFYNK6bxs (started 15:53); that ROOT then hands BOB over (handover begin/confirm), replaces the MERGER (start merger --replace session_018BhcedwsJZrL1WAAcugNk7) and the watcher (start watcher --replace session_018BhceeMjF6AwKvAHJwkQ1L, its task trig_01AvKAsQ3dLkB3pryqQ6C3Ji), creates its own sweep task, and archives old ROOT session_018BhcefwaVtx4V7dYW63amA. Old sweep task trig_01Hvg2iQ6kzaZUvoF3LJNYww is disabled (delete it once the new one exists).
- Pin move to f339ba9 (PRs 159, 161) started 16:17 while the train is stopped. Train STOPPED 15:50 (approvals stop rule) while gating PR 445 (screens-wizards); last land 444 at 15:43:37. Restart on the new MERGER. Then pin move to process3 b58cade or newer (carries PR 159, release dev only at a round close) plus build/idle-count when merged: one pin move, one restart.
- BOB's plain PRs 515 (ux-design lane entry and words inventory) and 516 (journey-check F10, the 63 internal-walk failures as found marks) wait for the train.
- build/idle-count session_018BhcecdVynqPPYCSD4ikPq: the IDLE CAPACITY line counts from an offline read (26 vs --ready's correct 2); fix to share --ready's selection; plus --ready losing starts when the tranche moves during its ~5 min compute. Merge when ready (one cold review), then pin.

STATE
- Copy pin process3 74c3679 (PR 510). process3 tranche b58cade (PRs 153, 155, 156, 157, 159 today).
- Live job sessions ~4-6 of 20 at 15:52 (journey-check 511, answer-envelope 514, screens-ai 518, notice jobs from interface-assets:443 for installer, interface-shell, site). --ready is right; ignore the IDLE line's number until idle-count lands.
- Train lands 14:51-15:51: 290, 427, 386, 443, 444 (5 job PRs). Queue ~45. Serial train stays (Bob stopped the parallel-gate build; WIP parked on build/train-spec 493d872). E1 (slow-suite concurrency) measured and dropped: not faster on 4 vCPU and flaky.
- Release path: 290 and 314 merged. Releases happen only at a round's close; on the copy the current round is every layer, so the first dev release follows layers 6-11 closing, a deploy dev, the live walk and its findings. Layer 6 open: 441, 485, 444 (landed 15:43), 457, 346, 497, 364, 411 in the train; agent-runner 394 restarts after 364; contradiction 380 deferred to the round's deploy at layer close; citation 379 restarts when registers 496 lands, else deferred.
