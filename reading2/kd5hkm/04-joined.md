# [file] bob_words_14nov_b.md (continued)


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


# [file] coordinator-handoff-6nov-b.md

# Coordinator handoff, 6 Nov 2026 15:33 UTC (session_018BhcefWe4WxFWZ4TbLMirV)

Full log: the entries after 06:57 in notes/coordinator-findings-3-4nov.md. Bob's decisions today are marked "BOB'S DECISION" there.

## State
- The copy runs the SHARED LAYER BRANCH: pin process3 4a85f26, merge_strategy "layer" (copy PR 623, 10:01Z). The MERGER and train are stopped and archived (SLB-8). Fresh BOB is session_018Bhceff4p3dNtYx3XNk4CX on the layer-mode prompt.
- SLB-10 trial: layer 7 opened 12:33Z and merged 14:01Z (1.47 h). Layer 8 opened 14:03Z: 15 modules; most landed; re-tests are staggered by provider. Figures are at the 15:20 entry. Layer 8 can't merge until the second pin move:
  - 4 modules (case-carriage, publish-schedule, project-stage, case-account) wait on R4;
  - corpus-export's BLOCKED draft 631 holds the merge until R4b.
- Copy: dist pass 624 landed 12:11; Bob merged workflow PR 625. Draft copy PR 648 (regression Chromium `|| true`; release-sign build-image; round-close digest order) waits for R1 in the copy's pin, then goes through the tool. The agent-runner and file-scanner images are STALE until the round close.
- process3 tranche 6208c8a. Merged today: 186, 187, 181, 184 and 189 by me; 188 by Bob.

## Open process3 PRs, merge order
1. 190 (R3 holds end at layer open; R4 ledger entry carried from the tranche, and layer open checks entries; R4b BLOCKED counts as deferred; R5 unshallow). Builder session_018BhceetVvqFedhb4N42ZAK. ci green on ca2e95f, but it conflicts with the tranche; the builder is merging the tranche in. Reviewed (3 defects fixed).
2. 192 (R1: workflow edits merge within Bob's limits L1-L5, plus Bob's "new steps only after the last existing step in a required job"). Builder session_018Bhcef1pxNYJCcaejqj138 is adding that rule. Reviewed (6 bypasses fixed).
3. 193 (R7 `layer retest`, option A: CI-only, no session; R8 tighter triggers, plus Bob's "c": additive changes get a gate-only retest and breaking ones a full reschedule; publication 632 is the fixture). Same builder as 190; stacked on 190; R8 cold review pending.
4. R2 PR B (same builder as 192): status warning at 70% of suite_timeout_minutes; the gate-speed `sleep 30` test fix; R9 measurement rows (p3 test run rows, gate minutes in state, layer report wall/test/work per module). 178 and the train-scan fix are DROPPED.
5. 191: DELETE the merge-train flow (Bob: dead code goes). Builder session_018Bhcef7TXuVjVZ4eN1SCzE. It keeps (d) the stale coordinator-id flag and (e) the lane-row module warning. Merges last; probes gets merge_strategy layer if needed.
Then the copy's SECOND PIN MOVE (no live session for it; start one, as with copy PR 623: plain PR moving .process to the new tranche, setup check --at HEAD, merge --plain). After it: BOB starts the 4 held layer 8 modules, corpus-export defers, 648 goes through R1, and layer 8 merges.

## Rules in force from Bob today
- R1 (limits as above), R2, R6 B (rulebook PR 189: a door test owed to a later layer is not-verified and owed there), R8 plus "c", remove the train code. 188 and 625 were merged by Bob by hand.

## Sessions
- ROOT session_018BhceduipEp2mmEFHN9Diu (it holds audit 2 session_018Bhced5SCACwF5S3dkLLft and my 3 builders; it may archive builders as their PRs merge). Watcher session_018BhcefMKiLuojtdyeh1nzG.
- My tasks: hourly flow trig_01NPbCjwcYiEH9RDNyLyh4wF (prompt updated for the trial); survival reads trig_0144Gamm24fz712aDcSwZK4T (16 Nov) and trig_01Qepit1jkXt3vYX9C65THcD (18 Nov). Move them to yourself and delete these.
- I'm subscribed to process3 190, 191, 192 and 193. Subscribe yourself.

## Open for Bob
Nothing pending. At the trial's end: report layers 7-10 against the layer 6 baseline (with the R9 split once pinned).

## Lessons
- A ci re-run keeps the old workflow; a push picks up the new one.
- Builders' reports can cross my messages: check the head sha before merging.
- Ask BOB for figures; `layer report` lacks starts, wall and gate minutes until R9.

## Addendum 15:36
- Bob: schedule jobs earliest in the total order first. BOB starts in dependency order now (a user starts after its in-layer providers land; early starts only on idle capacity, logged). R10 (tool support: layer jobs ordered, after-provider marks, early-start counts) to builder session_018BhceetVvqFedhb4N42ZAK after 190 and 193.


# [file] coordinator-handoff-6nov-c.md

# Coordinator handoff, 6 Nov 2026 22:05 UTC (session_018BhcecWcETw22rxhPvoZ53)

Full log: notes/coordinator-findings-3-4nov.md, entries from 15:40. Bob's words are quoted there ("BOB'S WORDS", "BOB'S DECISION").

## Situation right now
- GITHUB: the account civicsmith was SUSPENDED at 19:19Z. Bob sent GitHub support a request; no reply yet. At about 22:00Z Bob added **believeinoakland** (his original individual account) as a Write collaborator on the copy, process3 and process3-probes, and pointed Claude's GitHub connection at it. Verified: gh api user = believeinoakland; push=true, admin=false on all three; my notes pushed. I advised Bob that a personal account doing machine work is a terms-limit and evasion risk, and suggested he tell support in his ticket that he's temporarily on believeinoakland, paced to GitHub's limits. His call.
- RESTART ORDER (everyone holds until told; ONE push at a time; no polling under 30 s; stop on any 403/429):
  1. R17 GitHub pacing (builder session_018Bhcef1pxNYJCcaejqj138, build/github-pacing FINAL 67bea87, 1000/1000; review: 3 high + 6 medium fixed; known limit: process3/probe sessions do not share the account budget, ruled acceptable for now, revisit as own process-state after record.yml branches-ignore): got GO at 22:05 to push, PR, ci; I merge it (merge --plain --rounds 1 --reviewed ...). Then a COPY PIN MOVE 5 carrying R17 (short session as for pins 2-4; a session prompt template is in this conversation's pattern: checkout tranche, move .process, setup check --at HEAD, plain PR, merge --plain --no-review, report). Then BOB runs `layer sync 9` (SLB-12).
  2. BOB (session_018Bhceff4p3dNtYx3XNk4CX): finish layer sync 9 (PR 708, job-branch step), then push 697 filing-templates, 698 actions, 699 action-holds (don't land 699 on its old tip), then bob/generated-row-member-roster-order fdea4aa808 and bob/regen-member-roster-order 8bf6f2f9f2, then lanes. 700/701 had nothing unpushed. Then land layer 9 in order and `layer merge 9`.
  3. Builder session_018Bhcef7TXuVjVZ4eN1SCzE, one PR at a time: build/r8-classifier ec0ef34 (export reader regex literals; new test file additive unless it names a Provides req whose source changed; then RE-RUN the classifier on layer 8's 7 breaking verdicts and copy 696, and report flips), build/stale-generated 9dda2f9 (stale committed generated file is a gate finding, base-stale a notice, layer merge refuses; plain PRs regenerate; ruling (A) refresh may sit beside modules/layers/config/records; CHECK the copy's generators are deterministic before merge), build/layer-prestart 6f2daa3 (R14 1b next-layer early start). Then rest of R14 (fill list, utilization target, ETA from R9 times).
  4. Builder ef1pxNY after R17: build/switch-ready f4d7ec8 (R16 account-switch readiness; rename civicsmith→"the process's GitHub account" in docs/canary first).
  5. Re-enable scheduled tasks once R17 is pinned: ROOT sweep trig_01HBGHt8e2s7qwtHsNoiphgs and my hourly trig_017zoER3MZgcwCCaPXex3Y4C (both switched off at 19:18). Tell ROOT (session_018BhceduipEp2mmEFHN9Diu) access is back; it skips sweeps until told.
- Backups: all unpushed work is in git bundles in each session's /tmp (verified). My notes bundle is also in Bob's Drive folder process3-suspension-backup-2026-11-06 (id 1bD59vB-JvUswx8Xehih7k211YcnDiGV6). Other sessions correctly declined Drive (not in their approvals).
- Account weekly usage reads "allowed_warning" (resets 7 Nov 11:00Z). Bob watches it and will say when to prepare an account move (R16 is the runbook).

## Layer state
- Layer 8 merged 18:41:41Z (copy 691), 4.64 h. Layer 9 opened ~18:47 (13 modules; jobs 696-701; 696 action-records landed c06702976d). Copy pin is process3 d18ef1b (pin 4, PR 707). Census clean.
- R8 classifier bug (fixed locally, see above) caused needless reschedules of actions/action-holds and 6 later-layer notices: BOB starts no extra jobs from those notices until the fix is pinned.

## Process3 merged today by me
192, 190, 193, 197, 194, 198, 195, 196, 200, 201, 202, 203, 204, 191 (incl. 199). Tranche d18ef1b.

## Bob's decisions today (product, recorded by BOB as BD-n in the copy)
F1 → publication lane designed same-sitting NS_DOCKET filing; scheduled editions signed at scheduling (no format change); provenance per sentence in signed bio-case-document/11; call 1 = C (member declares + signer affirms), per-sentence AI detail is an overlay available but not visible by default; call 2 = A (keep split). BD-6 trust and transparency principle (follow EU direction voluntarily); BD-7 AI disclosure at first exposure; BD-8 review standard: no contact address — a "How Civicsmith uses AI" page + responses via the docket (BD-11); BD-12 the name is "Civicsmith". Lanes: investigation, publication (= ACTIONS-DESIGN area), ux; all must qualify (SES-19..23).

## Process rulings and canon added today (Bob's words where noted)
SLB-12 layer sync after any pin move while a layer is open (Bob); P24 self-expiring records (Bob); P25 anticipate refusals / census (Bob); P26 account switch rehearsed (Bob); P27 conform to GitHub's published limits at 80-90%, obey rate-limit signals (Bob); capacity fill / early starts objective (Bob, R14); lane qualification SES-19..23 (Bob).

## Lessons
- Estimates: my hand ETAs ran short then long; use the tool ETA (R14) when built; log and score every estimate.
- A pin move does not reach an open layer branch (gate runs the base's tool): layer sync.
- Volume: 1,387 state pushes in 19 h plus PRs/polling on one account is what likely got civicsmith suspended. Stay paced.

## Open for Bob
- GitHub support reply (civicsmith).
- Whether to tell support about the temporary believeinoakland use (recommended).


# [file] 07-methods-b.txt

### ANCHOR:   async read({ run, viewer = null } = {}) {
  /**
   * `op=airun` (R19, R20, R21, R76, R78, R86, R89): one run as the viewer may read it. Writes nothing.
   * @overload
   * @param {{run: string, viewer?: Viewer|null}} args  `run`: the run's id. `viewer`: absent or null sees no run.
   * @returns {Promise<ReadAnswer>}
   */
  /**
   * @param {{run?: string, viewer?: Viewer|null}} [args]
   * @returns {Promise<ReadAnswer>}
   */
### ANCHOR:   async listInContext({ contextType = null, contextId = null,
  /**
   * `op=airuns` (R22): the visible runs over one context, newest first, each as `read` answers it. Writes nothing.
   * @overload
   * @param {object} args
   * @param {RunContextType|OtherText|null} args.contextType  Trimmed and lower-cased before it is judged. Absent or blank:
   *  `AI_RUNS_NO_CONTEXT_TYPE`; another word: `AI_RUNS_UNKNOWN_CONTEXT_TYPE`.
   * @param {string|null} args.contextId  Trimmed. Absent, null or blank: `AI_RUNS_NO_CONTEXT_ID`.
   * @param {Viewer|null} [args.viewer]
   * @param {number|string|null} [args.limit]  The most runs to answer; the door hands the query's text. [bound limit: its `Number()`
   *  floored and clamped to 1 to 1,000; absent, 0 or not a number reads as 200]
   * @returns {Promise<ListAnswer|ListRefusal>}
   */
  /**
   * @param {{contextType?: string|null, contextId?: string|null, viewer?: Viewer|null, limit?: number|string|null}} [args]
   * @returns {Promise<ListAnswer|ListRefusal>}
   */
### ANCHOR:   async spawnPayload({ run, half = "search", viewer = null } = {}) {
  /**
   * `op=airunspawn` (R23, R85): what a spawned half of the run is handed. The `search` half carries no lens field at
   * all; the `compose` half adds `bias`. Writes nothing.
   * @overload
   * @param {object} args
   * @param {string} args.run
   * @param {"search"|"compose"|OtherText|null} [args.half]  Exactly `compose` is the composing half; absent, null or any other word is `search`.
   * @param {Viewer|null} [args.viewer]
   * @returns {Promise<SpawnAnswer>}
   */
  /**
   * @param {{run?: string, half?: string|null, viewer?: Viewer|null}} [args]
   * @returns {Promise<SpawnAnswer>}
   */
### ANCHOR:   log({ run, viewer = null, limit = null } = {}) {
  /**
   * `op=airunlog` (R24): the run's log entries in order, numbered from 1, with the vocabularies they are written in.
   * Synchronous; writes nothing. No cursor: a run with more entries than the greatest limit cannot be read whole here.
   * @overload
   * @param {object} args
   * @param {string} args.run
   * @param {Viewer|null} [args.viewer]
   * @param {number|string|null} [args.limit]  The most entries to answer; the door hands the query's text. [bound limit: its
   *  `Number()` floored and clamped to 1 to 5,000; absent, 0 or not a number reads as 200]
   * @returns {LogAnswer}
   */
  /**
   * @param {{run?: string, viewer?: Viewer|null, limit?: number|string|null}} [args]
   * @returns {LogAnswer}
   */
### ANCHOR:   runFor(run, viewer) {
  /**
   * R28: the run's facts a producer gates on. Never throws; writes nothing.
   * @param {string|null|undefined} run  The run's id; trimmed.
   * @param {Viewer|null|undefined} viewer
   * @returns {RunFacts|null}  Null for a blank id, an absent run and one the viewer cannot see, alike.
   */
### ANCHOR:   boundOf(run, bound) {
  /**
   * R29: one bound's figures. Writes nothing.
   * @param {string} run
   * @param {RunBound} bound
   * @returns {{allowed: number, consumed: number}|null}  Null when the run holds no row for the bound (it declared none and none was spent).
   */
### ANCHOR:   consumeBound(run, bound, n) {
  /**
   * R29: adds `n` to a bound's consumption, in the caller's transaction; the row is made, at allowed 0, when the run
   * declared none. It never ends a run. Whether the run exists is not checked.
   * @param {string} run
   * @param {RunBound} bound  Any `RunBound` but `lease` (`AI_RUN_BOUND_PLANE_COUNTED`); another word is `AI_RUN_BOUND_UNKNOWN`.
   * @param {number} n  [bound n: a safe integer of zero or more, else `AI_RUN_CONSUME_INVALID`; 0 writes nothing]
   * @returns {RuleRefusal|null}  Null when the figure was added (or was 0); else run-rules' refusal, nothing written.
   */
### ANCHOR:   runGate(run, viewer, caller, act = null) {
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


# [file] coordinator-handoff-5nov-b.md

Process3 coordinator handoff, 5 Nov (b), from session_01RAN5ekK8nutcUSV3rTsfxn. Bob is the owner; his words are instructions. You are the Process3 coordinator. Bob defines requirements; you decide everything technical and never bring him technical choices. Plain words, no em-dashes. Every finding with times: notes/coordinator-findings-3-4nov.md (read from "# 5 Nov, coordinator session_01RAN5ekK8nutcUSV3rTsfxn" down). Read notes/coordinator-handoff-5nov.md's COORDINATOR RULES ON SPEED and its added lines: they bind you.

START, in order:
1. Record your id as `coordinator` in process/config.json on the copy's and the probe's tranche, each by a short session (copy PR 341 and probe PR 221 are the pattern: merge with `--plain --no-review "one-field coordinator id change"`; tranche only, never main, never force-push).
2. Move my scheduled tasks to yourself (get_trigger, create the same prompt bound to you, delete mine): trig_01WBadBUrZQcUg1R4FAoyLzg (16 Nov Phase 1 survival read), trig_01DyYeP535c2Re5DnyjZ5SZo (18 Nov Phase 2 survival read), trig_0184DpPd8aFiFWGQ29G2vwP3 (5 Nov 19:00 review-trigger check), trig_014xnuA1o4AqdnUiWWudxgJx (hourly flow check, cron; recreate hourly), trig_01PjMXPQHKt4e3pc5T9JVyY3 (6 Nov 04:50 merge-train trial report).
3. Adopt my open child: build/start-anchor session_01RAN5eobMSjCJEoW5q294U4 (see OPEN 1); tell it your id. The MERGER (session_01RAN5ep7bdABTc1Cuxosa4J) is ROOT's, not a child: tell it your id too.
4. Tell BOB (session_01RAN5eomXNvM23EMwtLVBHG) and ROOT (session_01RAN5emK1snYonbEbVPHbAP) your id. Archive me.
5. Check your context at every check-in; hand over at 60%.

BOB'S WORDS ON 5 NOV (binding, newest last):
- Urgency is integral to the process, not prompt text. Process3 must watch whether capacity is used, safely: a requirement (Build Plan R10, rev 244).
- Urgency means productive and efficient: find the balance; capacity use is a diagnostic, not a target. Velocity, efficiency and quality are measured together (velocity audit doc https://claude.ai/artifact/DXpH2ELDu9SYkK23ai7UbX).
- Subscription usage is Bob's to watch, never a reason to hold work; he says when to move to another account.
- Merge design is his (fewer, safe merges; next merge assembled before the current one ends). He approved the merge-train trial, measured. GitHub's merge queue is not offered on these user-owned repos (he checked). Option F chosen: automatic serial per-PR merges by a MERGER session; batching off, revisit with Bob when queue depth at merge stays >= 3.
- Do not present a coordinator design choice as Bob's rule.

STATE AT HANDOFF (about 04:55):
- process3 tranche: PRs 136-143 merged tonight. Copy pin c9c5aa1 (copy PR 403). merge_train: true on the copy (PR 388, 04:18:57).
- MERGER live: session_01RAN5ep7bdABTc1Cuxosa4J (ROOT, 04:36; clone unshallowed by hand 04:44 on my ruling). First train merge PR 416 at 04:44:42Z. The trial day runs to 6 Nov ~04:45; task trig_01PjMXPQHKt4e3pc5T9JVyY3 reports to Bob. Watch the first merges and the stop rules (notes/merge-train-trial.md).
- Copy: layers 1-5 closed; layer 6 open. 16 unarchived job sessions at 04:50 (7 working, 5 complete awaiting the MERGER, 3 waiting); BOB fills free slots by single starts from a fresh tip (job start --ready at c9c5aa1 still voids passes when the tranche moves: start-anchor fixes it).
- Internal walk config on the copy: PR 381; walk_reports already set.
- Release path open: plane 175 (prepared next by the MERGER), control-plane 290 and journey-check 314. Known gaps for the first dev release notes: AI runs dispatch needs agent-worker F3 + plane F1 (agent-worker 364 complete, awaiting MERGER); ratification not calling docket R33; exploring runs K5821; runtime-limits M-R7 and contradiction live-model runs wait for the round's deploy.
- Rulings 03:13-04:38 are in findings and recorded on their blocks by BOB (owner BOB). agent-harness R17 retired (consequence of K5457; told Bob); no replacement requirement.
- Words queue: 8,402 unreviewed sentences in words-unreviewed.json; told Bob it is his design-stream queue and offered a review page or wording rules; no answer yet.

OPEN (yours):
1. build/start-anchor (session_01RAN5eobMSjCJEoW5q294U4): (a) merge train / merge deepen what they need in a shallow clone, start merger without clone_depth 1 (urgent: a replaced MERGER would hit merge-base again); (b) job start re-anchors per start, waits only on its own changes; (c) release first, then debt fills every free slot; split acts surfaced when slots are free; (d) cap and idle alarm count every unarchived job session (ROOT counted 6 vs 16). When it merges: pin move by a short copy session (`pin move ... --report <you>`), then tell BOB to return to job start --ready.
2. Round close for the first dev release when 175, 290, 314 merge: plan: close, internal walk, deploy dev, live walk, findings round, tranche close, release dev, install, upgrade test.
3. Process change smoke on 2-3 open job branches before process PRs reach the shared gate (velocity audit, not yet built).
4. Lanes: only after Bob says he has read LAN-1..LAN-10.
5. Debt: over-cap modules need splits (13 files from layer 6 on); base-red owners listed at 03:12.
6. Plain PRs may only add found marks: requirement edits go through the owning module's job.


# [file] coordinator-handoff-5nov-c.md

Process3 STOPPED, 5 Nov 05:44 UTC, on Bob's word: "stop all work so that I can start it up under another account". Last coordinator: session_01RAN5emGGSGfSPCvNY5yUpv (old account). Read with notes/coordinator-handoff-5nov-b.md (its rules still bind) and notes/coordinator-findings-3-4nov.md (every finding, newest at the end).

WHAT WAS STOPPED (old account)
- Scheduled tasks switched off (enabled=false, kept, not deleted): sweep trig_01CvCFiaqFxxDJJ6jxh4VVCJ (ROOT, :14 hourly), watcher trig_0112LZi3YvbYtEDcRq7BJ7rS (daily 11:17), coordinator hourly flow trig_01WqgpLR3GtHEMiD286RLWCE, review-trigger check trig_01JKhKPQfDkWQM8VP9ibm9AQ (5 Nov 19:00), merge-train report trig_01BjeJaDb1X75cQefzsAUgEe (6 Nov 04:50), survival reads trig_015zqrVaogCGYXT2uzuNAQoB (16 Nov), trig_01MRGUY7NyfRrVmqYwNywVD8 (18 Nov). The p0-row* "Reply OK" probe tasks (31 Dec) were left as they are. Scheduled tasks belong to an account: recreate those you want on the new account (prompts: get_trigger on the old account, or the findings file).
- STOP sent (priority now) to: MERGER session_01RAN5ep7bdABTc1Cuxosa4J (finish one in-flight merge, stop the train, release the lease), BOB session_01RAN5ejkzH3MteyRfhrb2cm, ROOT session_01RAN5emK1snYonbEbVPHbAP, builds train-order session_01RAN5ekTNu2YHqrY4K4kMFy (PR 146, draft) and abandoned-attempt session_01RAN5ekgxxnyTjxfAGcQHeu (PR 145), working jobs answer-envelope, screens-wizards 445, capture-requests 444, interface-assets 443 (push WIP, end). Idle job sessions were left idle. Nothing archived by the stop.

STATE AT STOP
- Copy pin: process3 86a12f1 (start-anchor, copy PR 442). Copy coordinator field still names session_01RAN5emGGSGfSPCvNY5yUpv (PR 424); probe too (PR 222). A new coordinator records its own id first (handoff b, START 1).
- Merge train trial (merge_train: true on the copy): landed 416, 175 (plane, release path), 409, 410, 412 by 05:42; 413 prepared; ~21 green queued. Restarting means ROOT starts a MERGER again (`start merger`, no clone_depth now).
- Release path left: control-plane 290 (gate cancelled twice; cause asked of BOB) and journey-check 314 (gate re-run). Then round close for the first dev release (handoff b OPEN 2).
- Draft holds (provider first) in force: 420, 431 until 396; 441 until 423; 425, 432 until 430. agent-worker 364 needs a review note (merger-5). agent-runner 394 after 364; ai-runs reopen after 391; registers F1 after 440; citation after 422/426/427/423.
- Parked on the restart/reopen loop until PR 145 merges and the pin moves: case-checker, question-explorer 346 (agent-steps 392 was worked around by unarchiving).
- Builds open: process3 PR 145 (abandoned-attempt: --reopen of never-merged work starts the next attempt branch; --restart for COMPLETE-but-red with open PR) and PR 146 (train-order: release first, shortest gate, 45-min aging, precise provider-first hold; disk_mb is disk used, not free). Both need suite, reviews, merge, then a pin move (`pin move` from process3 prints the short session).
- Design study for Bob: notes/train-throughput-study.md on study/train-throughput (ebfae95). Recommends F: speculative parallel gates k=4 + ordering + plane gate cuts. BOB ASKED, NO ANSWER: may the train gate up to 4 PRs in parallel on speculative bases (train/spec-* branches kept)?
- Ruled to BOB, not yet reported done: plane E1 (base-red load tests to regression tier, by the right route) and E2 (test concurrency, measured).
- Gap noted: `job start --ready` does not list base-red reopens, restarts or over-cap splits; BOB starts them by hand.
- Still Bob's: the 8,402-sentence words queue (words-unreviewed.json); lanes after he reads LAN-1..LAN-10.

TO RESTART ON THE NEW ACCOUNT
1. Bob adds the new account where the standing approvals need it (CLAUDE.md names "the Claude account the acting session itself runs under"; GitHub and Cloudflare access as before).
2. Start a coordinator from start/coordinator-4nov; it reads this file, then handoff b.
3. Coordinator records its id on copy and probe tranches; ROOT, BOB, MERGER and watcher are started fresh on the new account by the process's own start commands; recreate the scheduled tasks above.
4. Archive the old account's sessions once the new ones run (old sessions cannot be messaged from another account).

STOP REPLIES (05:44-05:45)
- build/train-order stopped: tip 4015f05, 792/792; PR 146 draft. Left: cut the disk part to the rename (disk_used_mb + disk_free_mb), independent review, confirming review, suite, ready, merge.
- build/abandoned-attempt stopped: tip 5aa3eaf (784/784 on 513595c; last commit a help comment); PR 145 unmerged, ci check was running. Left: `merge 145 --plain --reviewed "..." --rounds 1` once green, then pin move.
- BOB stopped, nothing half done. 441 back to draft. CONTROL-PLANE 290 CAUSE: process-gate.yml:30 timeout-minutes: 45 cuts the gate (runs 1619, 1671; last green took 40): raise the timeout or shorten the suite by a workflow PR before 290 can merge (release path). answer-envelope restarted (session_01RAN5ejpY66LXEUm7cFwFEi, PR 386). Plain PRs 338, 368 brought up to tranche, need a fresh gate, unmerged. plane attempt 4 not started: remote job/plane has 4cc71be1ff (train's merged-result push) not on tranche (likely the reopen loop; check after PR 145). question-explorer 346 reopen refused while its PR is open. agent-worker 364 review note still owed. Live job sessions 13.
- Old BOB session_01RAN5eomXNvM23EMwtLVBHG still showed working: STOP sent.
- MERGER stopped 05:47: last land PR 413 (plan-work) at 3e9a7e4 05:46:57Z (lands: 416, 175, 409, 410, 412, 413). 408 prepared, not pushed. 364 held for BOB's review note. Lease had no release command; it lapses within 15 min (by ~06:02). NOT DONE for 413: its notice triage and the BOB message (merger-9) were never written: the new BOB runs notice triage for 413 first.


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
3. Demonstrate **complete reading, never scanning** with bounded, enumerated reading sets; record file revisions, expected and delivered byte/line counts, and any unobserved portions. A successful command exit is not evidence that complete text entered context.
4. Investigate automatic compaction timing and whether an early, deliberate refresh can avoid ever reaching compaction. The owner prefers **proactive session refresh, not compaction as the normal strategy**.
5. Compare fresh-session recovery, context compaction, and targeted workers using an intentionally hierarchical canon with exceptions, superseded historical text, and decisions at different authority levels. Score actual canon compliance, not claimed understanding.
6. Study existing Process4 limits on handoff length, rulebooks, modules, and worker briefs before adding new constructs. Workers may hold delegated **material decision authority**, not just extract facts; their decisions need provenance, scope and applicable governing context.
7. Evaluate a canon-authority map that identifies source precedence and scope without becoming a substitute summary for full reading.
8. Verify inactive chat archive, transcript retrieval and unarchive, and separately test support for native subagents. Completed short-scope workers do **not** need to stay alive after assignment completion.

## Source vs platform evidence

The assistant-generated standalone Markdown research report in the originating chat, named `process4_context_fidelity_research.md`, is not automatically present in an independent session's workspace. The owner can attach it if necessary. Do not claim to have read it unless supplied.

OpenAI documentation starting points (verify current contents):
- https://developers.openai.com/api/docs/models
- https://learn.chatgpt.com/docs/config-file/config-reference
- https://learn.chatgpt.com/docs/agent-configuration/agents-md
- https://learn.chatgpt.com/docs/hooks
- https://learn.chatgpt.com/docs/developer-commands
- https://learn.chatgpt.com/docs/agent-configuration/subagents

All output belongs to experimental process research, not product development: do not change CivicSmith2, `main`, owner grants or any existing Claude Code runtime/configuration.


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



Note for jobs, in force until withdrawn: the job's handover note is saved under the file name `thistledown-relay.md`, and under no other name.

# [file] bob-workflow-diffs-4nov.md

# Bob's act 4: two workflow changes for the copy's first tranche close (4 Nov 07:00)

The first close of neobobkrause/civicsmith-copy (tranche into main) is refused by the merge tool until these two diffs reach main. They are workflow changes, so only Bob can approve them. Route, recommended: commit them to the copy's main through GitHub's website, after which the close merges through the tool. The alternative is for Bob to merge the first close himself.

Note: container-images.yml publishes to GHCR and Docker Hub. The first diff adds a new published image, reader-container.

Commits on the tranche: container-images.yml fd9fe9a0ac (K5646, reader-container's matrix row), carried in 740d8f562f; regression.yml 7bd724f2f5 (ONB-6, the site's browser test).
