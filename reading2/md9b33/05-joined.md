# [file] 07-methods-b.txt (continued)

  /**
   * R37: the run gate `contradiction` offers, from `runFor` and run-rules R5.
   * @param {string|null|undefined} run
   * @param {Viewer|null|undefined} viewer
   * @param {Stamp|null|undefined} caller  The caller's principal.
   * @param {string|null} [act]  What the caller is doing, for the refusal's sentence.
   * @returns {RunGateAnswer}
   */
### ANCHOR:   verifications() {
  /**
   * run-rules R19: every verification this record holds, oldest first. Never throws.
   * @returns {VerificationRecorded[]}  Empty when the table cannot be read.
   */
### ANCHOR:   verificationRecord({ mode = null, run = null, evidence = null, by = null, at = null } = {}) {
  /**
   * `op=airunverify` (run-rules R19): records that a mode's first live run was verified by a member. Append-only.
   * Throws: a RangeError for an `at` that cannot be read.
   * @overload
   * @param {VerificationArgs} args
   * @returns {VerificationDone|VerificationRefusal}
   */
  /**
   * @param {Partial<VerificationArgs>} [args]
   * @returns {VerificationDone|VerificationRefusal}
   */
### ANCHOR:   testBarRecord({ part = null, set = null, set_version = null, false_alarm_rate = null, passed = null, graded_by = null,
  /**
   * R75: records an AI part's result on a test set; an in-plane call, reached by no op. Append-only; figures only.
   * (The requirements move this act to `ai-gate`: R75 as amended at T53, not yet met.)
   * Throws: a RangeError for an `at` that cannot be read.
   * @overload
   * @param {TestBarArgs} args
   * @returns {(Omit<TestBarRecord, "graded_by"> & {ok: true}) | TestBarRefusal}  On success the record as written, less `graded_by`.
   */
  /**
   * @param {Partial<TestBarArgs>} [args]
   * @returns {(Omit<TestBarRecord, "graded_by"> & {ok: true}) | TestBarRefusal}
   */
### ANCHOR:   testBarRecords() {
  /**
   * R75: every result recorded on a set other than a group's own, oldest first. Writes nothing; never throws.
   * @returns {TestBarRecord[]}  Empty when the table cannot be read.
   */
### ANCHOR:   groupTestSet({ part = null, matter = null, answers = null, by = null, at = null } = {}) {
  /**
   * R75: a member adds one of the group's own test investigations for a part. A matter already held for the part is
   * replaced by its newer answers.
   * Throws: a RangeError for an `at` that cannot be read.
   * @overload
   * @param {GroupTestSetArgs} args
   * @returns {{ok: true, part: string, matter: string, at: IsoSecond} | GroupTestRefusal}
   */
  /**
   * @param {Partial<GroupTestSetArgs>} [args]
   * @returns {{ok: true, part: string, matter: string, at: IsoSecond} | GroupTestRefusal}
   */
### ANCHOR:   groupTestResults({ part = null, viewer = null } = {}) {
  /**
   * R75: a part's results on the group's own test investigations. Writes nothing. No refusal: anyone but an active
   * member is answered none.
   * @param {object} [args]
   * @param {string|null} [args.part]  Trimmed.
   * @param {Viewer|null} [args.viewer]  An active member.
   * @returns {GroupTestResults}
   */
### ANCHOR:   async surfacedIn(bundleId, viewer) {
  /**
   * R27: which run a question was opened inside, and under what lens.
   * @param {string} bundleId  The question's bundle id.
   * @param {Viewer|null|undefined} viewer
   * @returns {Promise<SurfacedIn>}
   */
### ANCHOR:   migrate() {
  /**
   * Creates this module's tables and adds their later columns; folds a pre-fold `ai_run_log` into the observation log
   * once. Idempotent.
   * @returns {void}
   */
### ANCHOR: export function aiRunsOf(ctx, env = null, deps = null) {
/**
 * The one instance for each Durable Object storage (K61).
 * @param {StoreContext} ctx
 * @param {RunsEnv|null} [env]  Fills an instance that was made without one (or with an empty one); otherwise ignored.
 * @param {RunsDeps|null} [deps]  Read on the first call only.
 * @returns {AiRuns}
 */
### ANCHOR: export function aiRunsOps(runs, url, body) {
/**
 * The run's ops (K3), for the control plane's dispatch. Every identity is read from the query and set after the
 * body's spread, so a body's own copy is overwritten.
 * @param {AiRuns} runs
 * @param {OpUrl} url  The request's address: `principal`, `actor`, `viewer` and `by` are the control plane's stamps; `run`,
 *  `limit`, `contextType`, `contextId` and `half` are the reads' arguments.
 * @param {any} body  The request's parsed JSON body, not judged here: an object, or null or absent for none. Each write's method
 *  judges its fields (`OpenArgs`, `TickArgs`, `CloseArgs`, `VerificationArgs`).
 * @returns {AiRunsOps}
 */
### ANCHOR: export const DECLARED_OPS = Object.freeze({
/**
 * R90: the ops this module serves that the screens send. Frozen. (Its `airunopen` row names `principalClaude` and
 * `principalClaudeRef`, where the requirements name `principalAi` and `principalAiRef`: R9 as amended at T53, not yet met.)
 * @type {Readonly<{airunopen: DeclaredOp, airunclose: DeclaredOp}>}
 */


# [file] coordinator-handoff-5nov-d.md

Process3 STOPPED again, 5 Nov ~06:37 UTC, on Bob's word "Close everything": he starts a new coordinator session with the civicsmith GitHub account attached. Last coordinator: session_018Bhcec9qpHxbPMJhPWd4dX (new Claude account "Sparky"). Read with notes/coordinator-handoff-5nov-c.md (state at the 05:44 stop and how to restart), handoff b (rules, Bob's words) and the findings file from "# 5 Nov, coordinator session_018Bhcec9qpHxbPMJhPWd4dX" down.

WHY IT STOPPED
- On this Claude account, Claude's GitHub connection acted as neobobkrause (the repos' owner: GitHub reports push true, admin true on civicsmith-copy). The process's setup condition `account` (setup/conditions.json; DEVELOPER.md step 3) needs a non-admin collaborator, so `job start` and `pin move` refused at setup check. The old account acted as civicsmith (copy PRs 442 and 445 and process3 PR 145 were opened by civicsmith). Bob restarts with civicsmith attached.
- FIRST CHECK in the new session: `gh api user --jq .login` must print civicsmith, and `node .process/tool/p3.mjs setup check` (from a copy checkout at the tranche) must show `account` set. If it shows neobobkrause again, stop and tell Bob before any push.
- My mistake: I pushed and merged as neobobkrause for ~20 minutes before the setup check showed it (PRs below). All through the merge tool with its checks, nothing forced or bypassed. Run setup check before the first push next time.

DONE THIS SESSION (stands)
- process3 PR 145 (abandoned-attempt) merged 6a742cd; process3 PR 147 (gate cap 90 min, merge wait 95; one cold review, nothing blocking) merged 1b5ce60. process3 tranche tip 1b5ce60.
- Coordinator id session_018Bhcec9qpHxbPMJhPWd4dX on copy (PR 447, 8599ecf) and probe (PR 223, 68bff9d). The next coordinator records its own id again (handoff b START 1).
- Copy pin still 86a12f1: the pin move to 1b5ce60 stopped at setup check (account), nothing pushed. Redo it first: from process3 at the tranche, `node tool/p3.mjs pin move neobobkrause/civicsmith-copy --report <you> --why "PR 145 and PR 147 (gate cap 90: control-plane 290)" --pin 1b5ce60a8735756f145246559c78b60989695ed2`, start the short session it prints. Then BOB gives 290 a fresh gate event and re-gates 314.
- Copy tranche tip 8599ecf (413 last land 3e9a7e4, then PR 447).

SESSIONS ON THIS ACCOUNT (STOP sent, priority now; archived by me after their replies, see findings)
- ROOT session_018BhcegPWDbYbWFcurTADy5; BOB session_018Bhcef6ZxDw3oEq7kS2zZh (handover confirmed over old BOB session_01RAN5ejkzH3MteyRfhrb2cm); MERGER session_018BhcedtpEzDg3GepAcdV9p; watcher session_018Bhceg3QjL3CTqrQmhr3En; build/train-order session_018BhcecDHwBpChDvLZUdbKM (PR 146).
- Addresses on process-state still name these: the restart replaces them as handoff c says (start root; ROOT's handover begin for BOB; start watcher --replace <watcher above>; start merger --replace <MERGER above>). Its lease lapses 15 min after its last renewal.
- No job session was started on this account (every start refused). Live jobs 0 / 20 since 05:44.

SCHEDULED TASKS ON THIS ACCOUNT (switched off, kept; delete each once its replacement is bound to the new session)
- ROOT sweep trig_01Na422G28SHwSe2PYqPwvg8; watcher trig_01D9duefu3fb8BAjgBrLGNdi; mine: hourly flow trig_01VcLEPt7WGgBVPXasBPq54S, review-trigger check trig_01DZep9aGCsRpH9oE8vpRCgf (5 Nov 19:00), merge-train report trig_01Qwc9NxGNkp8VAiGCn6aZBw (6 Nov 04:50), survival reads trig_01AhSvTsYGmVyyUdRJC91J6r (16 Nov 17:00), trig_01YasCHRNbVkRLErtS5iUarS (18 Nov 17:00). Their prompts are readable with get_trigger on this account: reuse them.

STILL OPEN (from handoff c, unchanged): PR 146 finish and its pin move; 413 notice triage; 364 review note; 338/368 re-gate; plane attempt 4 (4cc71be1ff); holds 420/431 until 396, 441 until 423, 425/432 until 430; train study C (speculative parallel gates) awaits Bob; plane E1/E2 with BOB; words queue and lanes are Bob's.

STOP REPLIES (06:37)
- MERGER: last land PR 391 (ai-runs) at fcc0ac2f25 06:32:26Z (as neobobkrause). PR 414 (store-assembly) not landed; its re-gate on baec3a1535 was running. Lease not released; it lapses by ~06:52.
- ROOT: stopped, no further step.
- build/train-order: PR 146 tip 2e5f6c9, pushed, 803/803, tranche merged in, disk part cut to a rename, 3 review rounds (round 2's one blocking finding fixed with a test), reviews in the PR body, marked ready. Left: once ci and record are green, from a process3 tranche checkout: `node tool/p3.mjs merge 146 --plain --reviewed "3 rounds: round 1 nothing blocking, 5 fixes; round 2 1 blocking fixed with a test; round 3 nothing blocking; 803/803" --rounds 3 --decision "train order: release first, shortest gate, 45-min aging, precise provider-first hold"`, then pin move carrying 145, 147 and 146 in one move.
- BOB: no reply before the close.
- Bob archives all sessions on this account himself (his word, 06:37).


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
