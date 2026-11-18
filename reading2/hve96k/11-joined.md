# [file] 06-methods-a.txt (continued)

   * refusal leaves nothing written. Handed nothing at all, it answers `AI_RUN_NO_CONTEXT`.
   * Refusals in the order asked: no run id, context type or id (`AI_RUN_NO_CONTEXT`); a project the viewer may only
   * know to exist (membership's); the context's kind (`AI_RUN_NO_SUCH_CONTEXT`); the project gate and the project the
   * run is opened in (`AI_RUN_NOT_PROJECT_MEMBER`); a principal absent (`AI_RUN_CAPABILITY_UNAVAILABLE`); the skill
   * version; the mode; the plan rules; the origin; the re-examination rules; the step rules; `bounds`; `state`; the id
   * already held; the re-run link; no member's act; no account; the account's limits; the mode's registered check;
   * `steps`' refusal of the run's own step.
   * Throws: a RangeError for an `at` that cannot be read; whatever the store or `bias.biasManifest` throws.
   * @overload
   * @param {OpenArgs} args
   * @returns {Promise<OpenAnswer>}
   */
  /**
   * @param {Partial<OpenArgs>} [args]
   * @returns {Promise<OpenAnswer>}
   */
### ANCHOR:     const refusal = (code, more = {}) => {
    /** @type {(code: OpenOwnCode, more?: Partial<OpenRefusal>) => OpenRefusal} */
### ANCHOR:   static OPEN_MANY_MAX = 50;
  /** R74: the most steps one batch names. @type {number} */
### ANCHOR:   async openMany({ steps = null, mode = null, owner = null, bounds = null, skillVersion = null, label = null,
  /**
   * R74: a member's batch, one bounded run for each step she may see, under one act and one estimate. A refusal of one
   * step is answered for it and the others open.
   * @overload
   * @param {OpenManyArgs} args
   * @returns {Promise<OpenManyAnswer>}
   */
  /**
   * @param {Partial<OpenManyArgs>} [args]
   * @returns {Promise<OpenManyAnswer>}
   */
### ANCHOR:   tick({ run, state = null, consume = null, log = null, leaseMs = null, at = null,
  /**
   * The tick of `op=airuntick` (R11, R12, R45, R52, R72, R84): the heartbeat, the spend and the log in one call.
   * Synchronous. In order: absent or invisible (`found: false`); the caller is not the run's principal; the project
   * gate; not running; `consume`; `state`; `usage` no list; no member to count the usage to; the paying account's limit.
   * Then, in one transaction: the usage counted, each log entry appended (a refused one returned in `refused`), the
   * segment's end appended, each figure added, the lease extended, the state replaced when given, the ticks raised by
   * one. A bound then exhausted ends the run through the one exit (`ended`).
   * Throws: a RangeError for an `at` that cannot be read; whatever the store throws.
   * @overload
   * @param {TickArgs} args
   * @returns {TickAnswer}
   */
  /**
   * @param {Partial<TickArgs>} [args]
   * @returns {TickAnswer}
   */
### ANCHOR:   async tickAndContinue(args = {}) {
  /**
   * `op=airuntick` (R84): `tick`, then, for a segment that stopped on its own bound with the run not done, the next
   * segment's dispatch without a member's act. The answer is `tick`'s, its `segment_end` carrying `dispatch` when a
   * continuation was tried.
   * @overload
   * @param {TickArgs} args
   * @returns {Promise<TickAnswer>}
   */
  /**
   * @param {any} [args]  (The implementation's own kind: it hands its argument on to `tick` whole.)
   * @returns {Promise<TickAnswer>}
   */
### ANCHOR:   async close({ run, bound = null, condition = null, at = null, actor = null, viewer = null,
  /**
   * `op=airunclose` (R13, R14, R76): ends a run with the bound or ending the caller names. In order: for a held run,
   * invisible (`found: false`), the caller is not its principal, the project gate; then the one exit: a run not held
   * (`found: false`), one already ended (`terminated: false` with its status), a bound that names nothing
   * (`AI_RUN_BOUND_UNNAMED`), an unknown condition (`AI_RUN_CONDITION_UNKNOWN`). A run ended here answers its cost to
   * the paying account's owners and `bias`' word on the debt it re-ran.
   * Throws: a RangeError for an `at` that cannot be read; whatever the store or `bias.biasDebtRerun` throws.
   * @overload
   * @param {CloseArgs} args
   * @returns {Promise<ExitAnswer>}
   */
  /**
   * @param {Partial<CloseArgs>} [args]
   * @returns {Promise<ExitAnswer>}
   */
### ANCHOR:   reapDue(now) {
  /**
   * R15: how many running runs' leases have lapsed. For `scheduler`.
   * @param {EpochMs} now
   * @returns {number}
   */
### ANCHOR:   reapWake(now) {
  /**
   * R15: the earliest lease expiry of a running run. For `scheduler`.
   * @param {EpochMs} now
   * @returns {EpochMs|null}  Never before `now`; null when no run is running or the stored expiry cannot be read.
   */
### ANCHOR:   reap(now) {
  /**
   * R15: ends each running run whose lease has lapsed, with bound `lease` (or a bound it had exhausted), through the one exit.
   * @param {EpochMs} now
   * @returns {ReapAnswer}
   */
### ANCHOR:   static AI_RUN_WAKE_TICK_BATCH = 25;
  /** R16: the most runs one wake tick holds, and the most it wakes. @type {number} */
### ANCHOR:   wakeDue(now) {
  /**
   * R16, R17: how many runs the wake would hold or wake now; 0 with no wait source registered.
   * @param {EpochMs} now
   * @returns {number}  [bound: at most 50, a batch of holds and a batch of wakes]
   */
### ANCHOR:   wakeWake(now) {
  /**
   * R16: when the wake is next due.
   * @param {EpochMs} now
   * @returns {EpochMs|null}  `now` plus the wake's cadence (at least 1,000 ms, at most a quarter of the lease); null when nothing is due.
   */
### ANCHOR:   async wake(now) {
  /**
   * R16, R18: holds the leases of runs with requests outstanding, wakes the runs whose requests completed, and
   * dispatches the woken runs the instance's own organisation credential opened.
   * @param {EpochMs} now
   * @returns {Promise<WakeAnswer>}
   */
### ANCHOR:   static AI_RUN_DISPATCH_WAIT_MS = 10_000;
  /** R82: how long a dispatch waits for `agent-worker` to accept the segment, in milliseconds. @type {number} */
### ANCHOR:   async dispatchMemberRun({ run = null, by = null, viewer = null, at = null, trace = null, memberRef = null } = {}) {
  /**
   * R18, R82, R87, R89: a member's own run, dispatched at her own act under a credential minted for that segment.
   * In order, nothing sent on any: absent or invisible (`found: false`); `by` is not the run's member
   * (`AI_RUN_NOT_PRINCIPAL`); not running; a mode other than `check` or `plan` (`MEMBER_RUN_MODE_NOT_ADMITTED`);
   * withheld `AGENT_WORKER_UNBOUND`, `NAMESPACE_UNDETERMINED`; the group's keep-away (`AI_KEPT_AWAY`, relayed); an
   * account other than her own sign-in (withheld `MEMBER_PRINCIPAL_RUN`); the mint refused (relayed) or silent
   * (withheld `CREDENTIAL_RECORD_SILENT`). Then the call, answered as `dispatch`. No token is ever answered.
   * Throws: a RangeError for an `at` that cannot be read.
   * @overload
   * @param {MemberDispatchArgs} args
   * @returns {Promise<MemberDispatchAnswer|MemberDispatchNotFound>}
   */
  /**
   * @param {Partial<MemberDispatchArgs>} [args]
   * @returns {Promise<MemberDispatchAnswer|MemberDispatchNotFound>}
   */
### ANCHOR:     const withheld = (w, extra = {}) => ({ run, found: true, dispatched: false, status: row.status, withheld: w, ...extra,
    /** @type {(w: NonNullable<MemberDispatchAnswer["withheld"]>, extra?: object) => MemberDispatchAnswer} */


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


# [file] 05-misc.txt

### ANCHOR: /** R72: a provider's refusal for a spent limit (Anthropic's 429
/**
 * One row of an SQL answer: an object of column name to value, whatever the statement selects. Left open (`any`): its
 * kind is the statement's, not this interface's.
 * @typedef {any} SqlRow
 */
/**
 * The Durable Object's state as the hosting platform hands it. Only what this file reads is listed; the modules this
 * one reaches through their factories on the same `ctx` read what they need of it themselves.
 * @typedef {object} StoreContext
 * @property {{sql: {exec: (query: string, ...bindings: unknown[]) => Iterable<SqlRow>}}} storage  The object's storage: the key of
 *  the one instance (`aiRunsOf`), and its SQL door, which every read and write of this module goes through.
 * @property {{equals: (other: unknown) => boolean}} [id]  The object's id, compared with the `STORE` namespace's ids to learn which
 *  namespace this object is; without it no run is dispatched (`NAMESPACE_UNDETERMINED`).
 */
/**
 * The Worker environment, as far as this file reads it. `tokens.mjs` (`instanceAiCredential`) and `store-place.mjs`
 * (`storeId`, `storeStub`) are handed the same object and read their own bindings from it (the instance's `ai`
 * credential, the `STORE` namespace); those are theirs to fix.
 * @typedef {object} RunsEnv
