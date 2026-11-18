# [file] coordinator-handoff-8nov-d.md (continued)

- Biosmoke: biosmokeN is development-testing only. Under the copy's new block, releases are installed there and walked, and deleted with their data after testing.
Mine: PD-15 (PR 266, a test-only land after an earlier source land is at most additive). Rulings: C39 design (1a, 2a, 3, and 4b's shape: `deploy release` installs the signed artifact; a gap where no path exists); C40 pacing (own-repo writes, listed reads); C41 (process/ root; modules file stays, product reads it; build/jobs may move; build/plan and requirements-notes move only with a job updating the tests that read them).

## Merged today
C37 (265), C38 (267), C39 (269), C41/C42 (273). Copy and probes are pinned at c52faf45 (C39). C41/C42 are NOT pinned yet: I held the pin to ride with C40.

## Open acts for you
1. C40, process3 PR 274: ready at head 127548a7 (1221/1221, hashed deny list in, pacing done). Review, merge, then pin the copy and the probes (C40 + C41/C42 together) and archive builder session_018BhcednSXAr6eXZMjaDi8a.
2. DONE 19:00Z: p3dev-l1, -l3 and -t1 deleted (24 Workers, 12 apps, 6 buckets); p3dev-l11 kept.
3. Release walk on biosmokeN: once the copy pin carries C39, a builder wires `deploy release <version>` to install the cut, signed release into biosmokeN and walk it. Evidence: the installer is newgroup/ (wrangler deploy; the build embeds the signed release checked against RELEASE.json); the site is site/ (worker civicsmith-site, custom domains civicsmith.org and www.civicsmith.org, INSTALLER_ADDRESS points at newgroup's workers.dev). Cloudflare shows only wrangler deploys from Bob's account, last 27 Oct. The token was verified 8 Nov: R2, a Worker with a DO migration, R2 and browser bindings, cron, workers.dev and delete all ok; D1 and KV are refused (unused).
4. Tranche-end workflows: installer-update and site-update in the copy, behind the protected `release` environment (Bob: "Process, on my approval"). Proposed to Bob as round-2 found marks. Ask him for the go, the scoped Cloudflare deploy token in that environment (his to add), and whether the site is civicsmith.org or civicsmith.dev (Cloudflare shows only .org).
5. Layer 12: plane 1066 and journey-check 999 were left at 18:01Z. When both land: layer merge 12, then the round-close run, then the findings as found marks (DEC-340 covers 518 -> 96 at journey-check's local walk), then round 2 under C39.
7. Watcher: none live. addresses/watcher.json names an archived session; ROOT starts a watcher only when none is addressed. Fix by tool change (an archived address reads as none) or a re-record.
6. Hourly check as before. The 18:53Z audit showed a process3 push gap of 5 (likely C40's split ledger; re-audit with both ledgers after C40 merges). For copy state, read with git from a clone, or ask BOB; never act on a product from your own session.

## Merge practice
As 8nov-c: a process3 worktree at the tranche; merge the head onto the tranche and run the suite (HOME=$(mktemp -d) GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_NOSYSTEM=1 node --test 'tool/test/*.test.mjs'); mark ready; `node tool/p3.mjs merge <n> --plain --rounds 1 --reviewed "..."` (timeout 1200 s). Pins: `pin move neobobkrause/<repo> --report <me> --why ... --pin <sha>`, then create_session with its JSON, then archive each when it reports.


# [file] coordinator-handoff-6nov.md

# Coordinator handoff, 6 Nov 2026 06:55 UTC (session_018BhcefjWx4gCEPSaQ6JGxj)

Read the last entries of notes/coordinator-findings-3-4nov.md for the full log.

## Where things stand
- civicsmith-copy: LAYER 6 CLOSED at tranche 710b475d97 (05:56). PRODUCT WORK PAUSED. Holds hold-18..22 (layers 7-11), hold-23 (ai-catalogue F4) and hold-24 (inquiry R31) stand. The MERGER's starter has been OFF since 05:39; nothing starts unless BOB starts it. Green layer 11 PRs 452, 507, 513 and 504 are drafts until after the pause.
- process3 merged so far: 183 (layer branch, 48d42ed) and 185 (AUD-1/2/7, 491a48d).
- Still to merge, in order, each brought up to tranche by its builder and green before the merge tool runs (`node tool/p3.mjs merge <n> --plain --reviewed "<what>" --rounds <n>` from a process3 tranche checkout; mark ready first):
  1. 186: mechanical pass `--pass` (P7) + job push refusal of dist/ and oversized files + lane-only plain merge. Builder session_018BhcedugabJDoZULNK5PfY; 1 cold review, accepted.
  2. 187: status red gates first (same builder); 1 cold review, accepted.
  3. 181: triage lanes (AUD-8/9). Builder session_018BhcecgGurDZDMke441V16 (told done; may need a new session to merge tranche in); 1 cold review, accepted.
  4. 184: citations (AUD-4/5, DECISIONS.md PD-1/PD-2). Builder session_018BhcecWQagoxMhBKuRBBxq; text only, accepted.
  - 188 (ci timeout 10 -> 20): the merge tool refuses a workflow change without Bob's word. Asked Bob at 06:47; merge it only on his "yes". ci runs 9m46-9m51 of a 10-min cap; re-run once if a run is cancelled at the cap.
- Then: copy pin move to the new process3 tranche with merge_strategy "layer" (a pin-move session as before). Then BOB runs the dist pass as one `--pass` PR: bob-257's survey plus container-images.yml build-image.mjs; keep bio-plane/dist/SECRETS.txt; leave release/ (44 MB) for later. Then lift hold-18 and open layer 7 as the SLB-10 trial. Keep the MERGER and starter off (SLB-8). Brief layer 11 with the reschedule check (460 -> 430 + store-assembly; ai-catalogue F4; op-declarations ACT_HELP for ai-use's ops).
- Layer 6 baseline (05:10 entry): 27.6 h open to last merge; 11.8 gate runs per module (max 27); 2.9 starts per module; green-to-merged median 386 min. Trial stop rule: layer 7 slower to close than 27.6 h.
- Bob's Keep and Drop answers are all in (6 Nov 00:27-00:30). The Foundations, Ledger map and Ledger doc are updated, and my rulings are cited as the coordinator's. The Build Plan is not on this account.
- Sessions to keep: build/layer-branch session_018BhcecugKLxZHVRfKX4bo7 (until the pin move lands; tell ROOT when it can go); audit 2 session_018Bhced5SCACwF5S3dkLLft (Bob may return to it).
- My tasks (move to yourself): hourly flow trig_01XLmuM6ofCn78C3gtUQ1733 (:51); survival reads trig_016pnkXpxg1P6RzpSNGM4EbP (16 Nov), trig_018MZu9XWhc33Yg2LRFkyaH9 (18 Nov). The baseline task has fired. I'm watching process3 PR 188.

## Open for Bob
- "Yes" to PR 188 (ci timeout).
- Assistant sign-in conflict (T53 retires /signin; agent-runner R109/R35 contradict agent-worker F5): still deferred by Bob; BOB holds the decision entry.

## Lessons
- Check the merge tool's own refusals before planning a route (workflow files, lane folders, module files).
- A deferral is not a hold: the starter reopens deferred found marks. Record a hold too.


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

STATE AT HANDOFF
- process3 tranche 06ab532 (PRs 148-152, 154 today). Copy pin 73508ce (PR 482), 06ab532 in flight. Probe has my id (PR 225).
- Live jobs 15/20 at 11:45; --ready lists nothing more: the rest waits on lands (414 store-assembly, 468 capture, 469 screens-publish, 290 control-plane, 498 release_path config).
- Train lands since 09:51: 440, 378, 435, 426, 392 and plains 474, 475, 479-482. The throughput cause was found at 11:42 (every land paid ~7 min of hold reads); PR 154 fixes it (476 s -> 38 s a pass on the real copy). Measure lands per hour after the 06ab532 restart and report to Bob.
- Release path: control-plane 290 green since 10:09 but behind the 50-module derived release set; BOB's plain PR 498 adds release_path [control-plane, journey-check]; release-tier build puts them first. journey-check 314: gate red 10:35 on 2 revert findings, rerun with --exempt-revert (~50 min from ~11:15). Then round close for the first dev release (handoff b OPEN 2).
- Holds (BOB's, recorded): op-declarations (hold-2, renew; waits on 459, 460, control-plane R112 in 290, store-assembly R83 after 414; then 460, then 430), scheduler hold-4 (ai-catalogue dev seed 484 + store-assembly wiring), agent-model hold-3 (364, 392), acquisition-archives hold-5 (M-R7 at the round's deploy), member-upload hold-6 (capture RECEIVED_VIAS fix after 468; store-assembly R24 after 414).

MY STANDING RULES TO BOB (mine, technical; not Bob's)
- Archive a job session once its PR is ready with receipt, green or gating, and its goal met; a later fix is `job start --restart`.
- Never --restart onto a PR in the train (voids its gate and place).
- A requirement file that cannot consolidate under the cap is split by copy along its job's proposal (op-grades-folds pattern), inside the attempt when the PR is green but for the cap, else after its merge; reported after, not asked.
- One git writer per clone; starts before triage.
- Rulings today (all recorded in findings): op-declarations R57 governs; screens-settings, control-plane, ai-accounts, jurisdictions splits; scheduler test-infrastructure owners; jurisdictions-b FOIA readings (5 U.S.C. 552 subsections read from the official text; R93's twenty are working days; no purpose field; inspect_photograph "not provided by the statute" unless the text says otherwise).

STILL BOB'S
- Train study option C (speculative parallel gates, k=4; sim ~15.7 lands/h vs ~8 serial): asked again today, no answer. Measure after PR 154 first: the serial train may now be close to enough.
- Which session titles show permission dialogs (asked 07:28, no answer).
- Words queue; lanes after LAN-1..10; allow rules in .claude/settings.json.

FOLLOW-UPS OWED (process3, not yet built)
- The cap should count working job sessions, not ones parked on the train (today handled by archiving).
- A row-level timeout on the release ordering once release-tier lands, if 290 still waits.

MY MISTAKES TODAY (with cost)
- 08:23 put control-plane's split after 290 merges, though the gate is red on the cap: corrected 08:55, no cost beyond a running suite.
- 08:14 archive rule lacked "goal met": ai-accounts archived with consolidation undone; one restart.
- 09:16 flipped the MERGER (restart, then stop) before reading the 503 cause: ~1 min.
- Called 290/314 "release path" all morning without checking the tool knew it (no release_path in config): 290 waited from 10:09.
- PR 152's fixture modelled GitHub latency, not git process count, so its "fast first pick" missed the real cost by 10x: lesson, profile on the real repository first.
- One notes commit carries the wrong session URL in its trailer (pushed; not rewritten).


# [file] 06-methods-a.txt

### ANCHOR: export const AI_RUN_MODE_WRITES = Object.freeze({
/**
 * R18: the writes a segment's credential holds, by the run's mode. Frozen, and each list frozen. `check`: `airuntick`,
 * `suggest`, `capturerequest`, `airunclose`. `plan`: `airuntick`, `optionpropose`, `airunclose`. (The lists are written
 * here in words: the tool reads a frozen list inside a frozen object as a list of texts.)
 * @type {Readonly<{check: readonly string[], plan: readonly string[]}>}
 */
### ANCHOR: export function hiddenRuns(viewer, column = undefined) {
/**
 * R42: the one predicate for "runs this viewer cannot see", as a WHERE tail. Pure over its arguments; never throws.
 * @param {Viewer|null|undefined} viewer  Whose sight. A machine class gets the empty tail; an absent or unrecognised viewer the
 *  tail that keeps no run.
 * @param {string} [column]  Absent: the tail is over `observation_log`'s own `authority_kind` and `authority` columns. Given: the
 *  tail is over that column, which names a run id. [bound column: a plain SQL identifier, a letter or underscore followed by
 *  letters, digits or underscores; anything else answers the tail that keeps nothing, ` AND 0=1`]
 * @returns {HiddenRunsTail}
 */
### ANCHOR: export class AiRuns {
/**
 * The AI run's mechanism, one instance per Durable Object storage (reach it through `aiRunsOf`). Constructing it
 * registers this module with record-core, observation-log, retrieval, bias, contradiction, promotion and steps.
 */
### ANCHOR:   constructor(ctx, env = {}, deps = {}) {
  /**
   * @param {StoreContext} ctx
   * @param {RunsEnv} [env]
   * @param {RunsDeps} [deps]
   */
### ANCHOR:     this.ctx = ctx;
    /** The Durable Object's state this instance was made on. @type {StoreContext} */
### ANCHOR:     this.env = env || {};
    /** The Worker environment; `aiRunsOf` fills it later when the instance was made without one. @type {RunsEnv} */
### ANCHOR:     this.sql = ctx.storage.sql;
    /** The storage's SQL door. @type {StoreContext["storage"]["sql"]} */
### ANCHOR:   static systemOf(run) {
  /**
   * R73, R74: the run's own system identity.
   * @param {string} run  The run's id.
   * @returns {string}  `class:daemon/<run>`.
   */
### ANCHOR:   runHolder(by, run) {
  /**
   * B2: whether `by` holds `run`, for steps' machine arm. Writes nothing; never throws.
   * @param {Stamp} by  The principal asked about: the run's plane principal (run-rules R5's comparison), or the run's own system
   *  identity (`AiRuns.systemOf(run)`).
   * @param {string} run  The run's id; trimmed.
   * @returns {RunHolder|null}  Null for a blank `by` or `run`, an unknown run, a run not running, or one another principal holds.
   */
### ANCHOR:   static COUNT_KEYS = Object.freeze(["aiRuns", "aiRunBounds", "inquiryRunSurfacings", "aiRunLog"]);
  /** R38: the keys of `counts`' answer. Frozen. @type {readonly ["aiRuns", "aiRunBounds", "inquiryRunSurfacings", "aiRunLog"]} */
### ANCHOR:   counts(hid = null) {
  /**
   * R38: the figures of this module's tables, through the caller's sight. Synchronous; writes nothing.
   * @param {HiddenBundles|null} [hid]  The bundles the viewer may not see; null or absent counts whole.
   * @returns {RunCounts}
   */
### ANCHOR:   workProducts() {
  /**
   * R30: the runs as the bias debt's work products.
   * @returns {RunWorkProducts}
   */
### ANCHOR:   registerWaitSource(module, source) {
  /**
   * R41: registers the one wait source. One registration; a second is refused.
   * @param {string} module  The registering module's name. [bound module: non-empty]
   * @param {WaitSource} source  One lacking any of its five functions is `WAIT_SOURCE_MALFORMED`.
   * @returns {WaitSourceAnswer}
   */
### ANCHOR:   onRunOpened(module, fn) {
  /**
   * R43: registers a listener called after each successful `open` commits, in the modules' total order. A listener that
   * throws or rejects changes neither the run nor the open's answer.
   * @param {string} module  The registering module's name; one registration for each module. [bound module: non-empty]
   * @param {(notice: RunOpenedNotice) => unknown} fn  May be asynchronous: it is awaited.
   * @returns {{ok: true, module: string} | ListenerRefusal}
   */
### ANCHOR:   registerOpenCheck(module, mode, fn) {
  /**
   * R47: registers the check `open` applies last for one mode. One for each mode and one for each module.
   * @param {string} module  The registering module's name. [bound module: non-empty]
   * @param {string} mode  The mode checked; trimmed. A blank or non-text mode is `LISTENER_MALFORMED`. No list of modes is checked here.
   * @param {OpenCheck} fn  Synchronous.
   * @returns {{ok: true, module: string, mode: string} | ListenerRefusal}
   */
### ANCHOR:   testInstance() {
  /**
   * R78: whether this is a test instance. Reads the environment only; never throws.
   * @returns {boolean}  True exactly when `env.CIVICSMITH_TEST_INSTANCE` and `env.INSTANCE_NAME` are equal non-empty texts.
   */
### ANCHOR:   partAdmitted(part) {
  /**
   * R78: may this AI part run here, on what this record holds. Never throws. (The requirements give it a second
   * argument, `entry`: R78 as amended at T53, not yet met; this code takes one.)
   * @param {AiPart|OtherText} part  Any other value answers not admitted.
   * @returns {PartAdmission}
   */
### ANCHOR:   static AI_RUN_LEASE_MS = 600000;
  /** R83: the default lease in milliseconds, extended by every tick and every accepted dispatch. (The requirements' Terms
   *  still say 3,600,000; R83 says ten minutes.) @type {number} */
### ANCHOR:   static AI_RUN_LOG_LIMIT_DEFAULT = 200;
  /** R24: `log`'s default limit. @type {number} */
### ANCHOR:   static AI_RUN_LOG_LIMIT_MAX = 5000;
  /** R24: `log`'s greatest limit. @type {number} */
### ANCHOR:   static AI_RUNS_LIMIT_DEFAULT = 200;
  /** R22: `listInContext`'s default limit. @type {number} */
### ANCHOR:   static AI_RUNS_LIMIT_MAX = 1000;
  /** R22: `listInContext`'s greatest limit. @type {number} */
### ANCHOR:   #aiRunTerminate({ run, offered = null, condition = null, at, expired = false, derive = true }) {
  /**
   * (Private; typed so the public answers that carry its answer can be checked.)
   * @param {{run: string, offered?: string|null, condition?: string|null, at: string, expired?: boolean, derive?: boolean}} args
   * @returns {ExitAnswer}
   */
### ANCHOR:   async open({ run, contextType, contextId, label = null, mode = null,
  /**
   * `op=airunopen` (R9, R10, R40, R46, R47, R52, R73, R77, R78, R89): opens a run over an inquiry or a project. Every
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



A box of 15 plums came through Osk.

# [file] coordinator-handoff-7nov-b.md

# Coordinator handoff, 7 Nov 2026 ~04:55Z (session_018BhcefrJ17LisCLZSvEMCV)

Previous handoff: notes/coordinator-handoff-7nov.md. Log: notes/coordinator-findings-3-4nov.md (entries 01:47Z–04:55Z). Problem classes: notes/problem-classes.md (C1–C18). Bob's settings files, one per repo: notes/settings/*.settings.json (from notes/r17c-settings.md on the tranche).

## Situation
- Layer 9 MERGED 03:39Z (copy PR 735, 8.88 h). Layer 10 open since 03:39Z: monitoring landed (743), link-sweep landed (745), following (744) republishing/job-syncing, scheduler (748, early, reopen R34/R35) in flight. Early start into layer 11: op-capabilities (PR 752, layer/11 cut ahead). setup-words and record-core joined layer 11 (ruled: setup-words runs first; ~40 layer-11 modules depend on it). The 5 investigation reopens (steps, hypotheses, retrieval, project-roster, observation-log) joined layer 11; ruling: 4 with marks start ≤2 at a time, observation-log gets `layer retest` only.
- Pins: copy and probes at process3 19fe9dd (C8, R14 1b, replay-each, C12 p2, landed-PR readers). process3 tranche since then: 226 C15p3 (d88b577), 227 leftovers (0dc34de).
- BLOCKER: Bob applied R17c settings to the copy (copy PR 755, 04:35Z). Setup check at pin 19fe9dd refuses every `job start` (deny-list, shim-drift) = C17. Builder ef7TXuV has the fix on build/one-settings-policy (751dd0f6, reproduced on the copy's real settings), suite + cold review running, push waiting on the push budget. Merge it the moment it's green, then ONE pin move (copy + probes) at once; tell BOB. Bob's settings stay.
- PUSH CEILING: account at 121/120 at 04:51Z (PD-3 kept at 120, coordinator's call; Bob 6 Nov "BE CAREFUL"). BOB clone 208b86bb was 39 pushes + 512 gh calls (real work + read commands writing state = C18). BOB paused non-essential pushes ~20 min from 04:53Z (only `layer land` for 744/748); its found-mark PRs 756/757 (gates green) wait. My copy config.json coordinator-id push was cancelled (copy process/config.json still names session_018BhcecWcETw22rxhPvoZ53: redo by plain PR p3/coordinator-<date> when budget allows; probes already done, PR 234).
- My notes push (C17/C18 commit) is queued behind the budget; this handoff commit too.

## Open process3 PRs / builder queues
- 229 C16 (census flags modules without ledger entries; ef1pxNY): local merge with tranche 1110/1110; merge on green CI.
- ef7TXuV: (1) C17 build/one-settings-policy — URGENT; (2) build/append-only-state (github/use rows replayed by append; origin head 251c0b1b is DEFECTIVE — do not open until the builder sends head ed06a1b2 or later).
- ef1pxNY: fetch-split measurement 04:12–05:12Z due ~05:15Z (compare 02:25–03:25Z: 275 fetches, 24 state pushes); then C18 (read commands ride the next write; cache per-module walks).
- Merge practice: `merge <n> --plain --rounds <r> --reviewed "..."` from a tranche worktree (/home/user/p3-base) after merging the PR head with the current tranche locally and running `HOME=$(mktemp -d) GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_NOSYSTEM=1 node --test 'tool/test/*.test.mjs'`. Pin move: `node tool/p3.mjs pin move <slug> --report <me> --why "..." --pin <sha>` prints a session prompt; create_session with it (probe has no BOB address: tell its session the wake send may fail).

## For Bob (step-by-step given to him at ~04:40Z)
1–2. Settings: copy DONE (PR 755). process3 and process3-probes remain (paste notes/settings/<repo>.settings.json over .claude/settings.json via a PR into tranche). After all three: live-test raw `git push` refused, connector call counted, `p3 github audit`; retire the `github note` rule.
3. Investigation Q7–Q9 (paper https://claude.ai/artifact/THTtouNJzkhmHqyR4Pfa4g); pass answers to BOB for the copy's DECISIONS.md.
4. GitHub support ticket (civicsmith suspended 6 Nov).

## Decisions this session (coordinator)
PD-4 (census not-in-layer-map flags, not refuses; in process3 DECISIONS.md via PR 213). Rulings: C13b limits accepted (hidden-path credit from state rows only for 404 PRs); hold-26 lifted to 8 slots; lanes push again; census entries for 49 legacy modules (record, not tool guess); reopens join layer 11 (no early layer open); PD-3 stays 120.

## Scheduled tasks bound to me (rebind to successor)
hourly trig_01M3hYFufXMMvLkn6Xuas2Fz (:51); Phase 1 survival read trig_016cLJDrmGe8aSK8cgKbfd2v (16 Nov 17:00Z); Phase 2 trig_01WrTvQD3gzXNuSGj1fX2Jq6 (18 Nov 17:00Z). Create new ones bound to the successor and delete these.

## Subscriptions to renew
process3 PR 229 (and whatever ef7TXuV opens next).


# [file] 02-open.txt

### ANCHOR: /** R72: a provider's refusal for a spent limit (Anthropic's 429
/**
 * One declared bound of `open`'s `bounds` (run-rules R3, `checkConsume` in list form).
 * @typedef {object} BoundDeclaration
 * @property {RunBound} bound  Any `RunBound` but `lease` (`AI_RUN_BOUND_PLANE_COUNTED`); another word is `AI_RUN_BOUND_UNKNOWN`.
 * @property {number} allowed  [bound allowed: a safe integer of one or more; absent, null or 0 is `AI_RUN_BOUND_NO_ALLOWANCE`, any other
 *  value `AI_RUN_CONSUME_INVALID`; in mode `plan` a `fetches` or `subsessions` allowance above 0 is `AI_RUN_PLAN_NO_SEARCH`]
 * @property {number|null} [consumed]  What is already spent; absent or null is 0. [bound consumed: a safe integer of zero or more
 *  (`AI_RUN_CONSUME_INVALID`); for a `PlaneCountedBound` only 0 (`AI_RUN_BOUND_PLANE_COUNTED`)]
 * @property {string|null} [unit]  Stored as text, answered by `read`; no length bound is checked.
 */
/**
 * What `open` is handed (R9, R46, R73, R77, R89). `aiRunsOps` takes all but the three stamps from the request body.
 * @typedef {object} OpenArgs
 * @property {string} run  The new run's id, stored verbatim as the key. Absent or empty: `AI_RUN_NO_CONTEXT`. [bound run: non-empty; no
 *  further format is checked at the open, but ai-use counts a tick's usage only under an id of 1 to 128 characters of letters, digits,
 *  dot, underscore, colon and hyphen]
 * @property {RunContextType} contextType  Absent or empty: `AI_RUN_NO_CONTEXT`; another word: `AI_RUN_NO_SUCH_CONTEXT`.
 * @property {string} contextId  The id of a bundle of that kind which the viewer sees. Absent or empty: `AI_RUN_NO_CONTEXT`; absent
 *  from the record, hidden, or of another kind: `AI_RUN_NO_SUCH_CONTEXT`.
 * @property {Stamp} principalPlane  The plane credential acting, the control plane's stamp; stored as text. Absent or empty:
 *  `AI_RUN_CAPABILITY_UNAVAILABLE`.
 * @property {string} principalClaude  The second principal, which must be named: absent or empty is
 *  `AI_RUN_CAPABILITY_UNAVAILABLE`. It is read further only when no member is behind `actor` or `principalPlane`: then
 *  `member:<id>` names the member whose account carries the run. What is STORED as `principal_claude` is the paying owner
 *  `ai-accounts` answers, not this value. (The requirements name this argument `principalAi`, R9 as amended at T53, not yet met.)
 * @property {string} skillVersion  The skill version the run runs under, stored trimmed. [bound skillVersion: after trimming, no
 *  whitespace and exactly one at sign with text on both sides, the form `pack`, at sign, `edition`; else `AI_RUN_SKILL_VERSION_UNNAMED`]
 * @property {string|null} [label]  A label for people, stored verbatim; no length bound is checked.
 * @property {RunMode|null} [mode]  Absent or null is `check` (run-rules' `DEFAULT_MODE`); otherwise trimmed. One not deployed and
 *  admitted here is `AI_RUN_MODE_NOT_DEPLOYED`.
 * @property {unknown} [principalClaudeRef]  Accepted and never read: the stored `principal_claude_ref` is `member:<id>` of the
 *  member whose act the open is.
 * @property {string|null} [biasManifest]  The lens manifest the opener was handed, stored verbatim and never judged at the open.
 *  [bound biasManifest: to be read back it is the JSON text of an object `{scope?, scope_id?, statements_sha?, bundles?}`; any other
 *  text is stored and reads back as unreadable]
 * @property {string|null} [standardPair]  The launching project's bar, stored verbatim and never judged at the open.
 *  [bound standardPair: to be read back it is the JSON text of an object `{capture?: string, connection?: string}`; any other text is
 *  stored and reads back with basis `unreadable`]
 * @property {BoundDeclaration[]|null} [bounds]  The run's budget, one entry per bound it is held to; a value that is not a list, or
 *  an entry that is not an object, is `AI_RUN_BOUND_UNKNOWN`.
 * @property {unknown} [state]  The run's resumable scratch, stored as JSON; absent or null is stored as `{}`.
 *  [bound state: its JSON is at most 262,144 bytes of UTF-8 (run-rules' `AI_RUN_STATE_MAX_BYTES`), else `AI_RUN_STATE_TOO_LARGE`]
 * @property {number|null} [leaseMs]  The lease of this open in milliseconds. [bound leaseMs: used when `Number(leaseMs)` is above 0,
 *  otherwise the default lease (600,000 ms, or the environment's `AI_RUN_LEASE_MS`); no upper bound is checked]
 * @property {InstantArg} [at]
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


# [file] codex_context_fidelity_research_handoff.md

# Codex Process4: context-fidelity research handoff

**Status:** Research outline and source-navigation aid, **not** a completed empirical study or owner-approved process definition. Read the verbatim 17 November owner direction at `../owner_words/bob_words_17nov_codex_context.md` first.

## Exact public repositories and branches

- Process4 research: https://github.com/neobobkrause/process3/tree/process4/process4
  - Sixth draft: https://github.com/neobobkrause/process3/blob/process4/process4/definition/process4_definition_v6.md
  - Earlier evidence: https://github.com/neobobkrause/process3/tree/process4/process4/evidence
- CivicSmith2: **believeinoakland/civicsmith2**, not neobobkrause/civicsmith2.
  - Canon registry: https://github.com/believeinoakland/civicsmith2/blob/tranche/requirements/README.md
  - Module requirements conventions: https://github.com/believeinoakland/civicsmith2/blob/tranche/build/requirements/README.md
- Earlier process principles: https://github.com/neobobkrause/neoprocess/blob/main/PROCESS-DESIGN.md
  - Session/reading sets: https://github.com/neobobkrause/neoprocess/blob/main/SESSIONS.md
- Native Codex implementation: https://github.com/neobobkrause/process3-probes/tree/codex/p4-grants-broker-20261116/bootstrap

`process4` is a **branch/folder of neobobkrause/process3**, not a separate repository. Avoid rewriting 404s into a conclusion that the source is unavailable. These repositories are public; if one GitHub connector lacks a repository installation, distinguish connector authorization failure from public existence and try supported read-only public GitHub/HTTPS access. Do not request another private token or broader grants to read public material.

## Research responsibilities

1. Verify the actual GPT-6-or-later model and **effective >=1M context window** exposed by the subscription-hosted native sessions. Published API model limits are not proof of hosted capacity.
2. Measure where required documents can be truncated: `AGENTS.md` auto-loading budget, tool-output limits, skills/catalog limits, read transports and token/context metrics.
