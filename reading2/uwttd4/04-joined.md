# [file] coordinator-handoff-9nov-c.md (continued)

7. Bob checked rulesets (process3, copy): his changes were not the cause of the record failure.

## Practice now
Builders: subtraction; locally only the tests they touch; CI runs the suite; no cold review or rehearsal; never force. Merge: read the diff, `merge <n> --plain --rounds 1 --reviewed "..."` in a tranche worktree; no local rerun of the suite. Pin moves: whenever a merge is useful to the copy, ganged; choose apply for open layers unless a change alters how a layer is judged.


# [file] coordinator-handoff-4nov.md

Process3 coordinator handoff, 4 Nov about 00:25 UTC, from session_01RAN5ek9qx8mduYhfE77Ldc (refreshed on Bob's word at 60% context). Bob is the owner; his words are instructions. You are BOB, the Process3 coordinator; Bob defines, you decide everything technical (P17). Bring Bob only acts only he can take, as one list, and only what passes the test in Build Plan rule 9 (his categories, his approvals or accounts, an act only he can take); restating a Ledger line's mechanism with its purpose kept is yours, and precedent is no reason to ask (Bob, 4 Nov). Plain words, no em-dashes.
PRIORITIES. Process3 development is the priority; civicsmith-copy is throwaway and exists to test process3. Bob, 3 Nov: as fast and as safely as possible; Process3 must be ready for Civicsmith development soon; don't be sloppy, don't be so cautious it takes days. Everything released in this work is development only; there is no public release (Bob, 3 Nov ~23:08). Fix by rewriting the line a thing belongs to. Measure once. Run independent builds in parallel; each merges the tranche into its branch before merging.
START. On neobobkrause/process3, branch start/coordinator-4nov at tranche d79308e plus this note. First: `git fetch origin tranche` and say whether origin/tranche moved past d79308e (builds below may have merged). Read this note and notes/coordinator-findings-3-4nov.md beside it (every measured finding of 3-4 Nov). Open the Build Plan (claude.ai doc cccf8cb8-a719-4f73-96f2-9ab0e2aaa897, Phase 3 section; export to a file, never inline), the Foundations (https://claude.ai/artifact/QSPaAnz5ReEiw8ae97nsZR) and the walk-through (231c545f-57d9-4126-95da-ab1c71054bcf) only when a step needs a line.
GUARD RAILS. Attach no other repository. Copy or probe work goes through ROOT, BOB, or a short session started in that repository from its tranche with clone_depth 1. Refusals word for word, never reworded or rerouted; two in a row, pause judged acts. Only Bob changes CLAUDE.md approvals, settings and .claude/. Merges only through the tool. One judged act per command. No session starts its own successor. Rule 5: a change to the gate, record check, approvals check or merge tool gets a second, confirming review (PR 57 found a path traversal that way).
FIRST WORK.
1. Record your id as `coordinator` in process/config.json of the copy and the probe, each by a short session (as copy PR 41 and probe PR 215 did). Move these scheduled tasks to yourself (create the same prompt bound to you, then delete mine): trig_014QyfFhBeaaM5GdCN88jjQF (01:05 UTC check-in, stopped-job fault), trig_01X22gz9EoQgLdjwK3UBFt4f (04:10 UTC: fire the watcher, silent-ROOT fault), trig_01BPagmf1cnKowXEZpjfvrE9 (16 Nov 17:00 survival read). Then archive session_01RAN5ek9qx8mduYhfE77Ldc.
2. Sessions reporting to my id: tell each your id by send_message. Copy pin move to d79308e (session_01RAN5en1PFxJWAaCa3LL1ir: setup check --at HEAD before merge, release block if the unsigned build writes files; told not to run the printed wake). Process3 builds: UX lane and completion round file (session_01RAN5ekrJXgxvkgZJ2AY5Ni), onboarding size and release note fields (session_01RAN5ekNP1PX8Lh2E9qVvrW). When the builds merge, move the copy's pin once more by a short session with `setup check --at HEAD`.
3. Live on the copy: ROOT session_01RAN5eoLwXYE4bHDP3xJr9G, BOB session_01RAN5encoEVihASNRBVBYKE (context ~30%, started with blob_limit_kb 1024 before PR 43; leave it), watcher session_01RAN5ejatoMxXYS7DSiFHuj with daily task trig_01YBk7KVsZ1o1ozWs6Z4mZMn (11:17 UTC). Layer 1: doc-clean, file-scanner, format-registry merged (copy PRs 36, 37, 39); jurisdictions complete, PR 40 merging; runtime-limits BLOCKED on unrecorded measure M-R7 (deferred: BOB closes PR 38 unmerged, then layer close). BOB was told (via ROOT) to run tranche open (12 acts), close layer 1, start layer 2. Copy pin was b226aed at copy PR 50.
4. Faults in flight (Phase 2 gate). Silent ROOT: ROOT's sweep task was deleted 00:05 (last run 23:59:30); at 04:10 fire the watcher's own task by hand (heartbeat over 4 h), then read whether it took over as ROOT, made its sweep and told Bob. Stopped job: the first try (interrupt on jurisdictions 22:31) was rescued by BOB's message, not a replacement; at 01:05 archive one layer-2 job session that has pushed nothing (tell no one); the new ROOT's sweep or BOB's status should flag it after 2 h and BOB restart it with job start --restart. Then silent BOB: after the new ROOT's first wake of BOB, interrupt BOB; the sweep should hand over two hours later. Relay to BOB only through ROOT (BOB takes instructions from ROOT's address); keep ROOT quiet until the watcher fire.
5. Deploy and walk: held until layer 1 closes. Then BOB runs it from a local worktree of copy PR 47's branch (p3dev/deploy-route, guarded p3dev names, never merged as is: it edits a workflow) merged with the tranche tip, with the proxy's Cloudflare credential (dummy CLOUDFLARE_API_TOKEN), dry run first (every step 'p3dev guard: passed'), then deploy, then `node bio-plane/scripts/p3dev-walk-setup.mjs p3dev-l1 --walk`; findings enter as found-work entries. Later: BOB takes PR 47 in as a bundler job with --take-in (workflow edit dropped), then the copy's `deploy` block lets `p3 deploy dev` run (process3 PR 59).
6. Then Phase 3 by running it: layer 2 onward with the requirements cap (11 copy files over 70000 bytes need splits), a provider notice if one arises, the first development release (`p3 release dev`, draft only), one stateless BOB wake measured (SES-16), tranche close to main, `p3 report tranche`. Write the Phase 2 gate and Bob's 3 Nov word on development-only releases into the Build Plan when the gate's measurements are in.
PROCESS3 MERGED 3-4 Nov (tranche d79308e): PRs 44 to 61 (owed fixes, sweep stall by push, requirements ownership, metrics, layer close, tranche report, tranche open/close, blocked deferred, dev release, requirements cap, provider route, take-in, product shims, notice confirm, rulebooks, deploy act, --at HEAD and one archive, prompt caps). Tool 4,543+ lines; every rise cited.
FOR BOB: nothing open. The probe holds his test signing key (P3_PROBE_TEST_SIGNING_KEY, verified, run 41735339840); his owner token was not needed.
UPDATE 00:26. Copy pin move to d79308e merged (copy PR 51, 3ef8062; checked with setup check --at HEAD, all set). Drop that session from item 2. Release block still out: the copy's build (`node bio-plane/scripts/bundles.mjs`) rebuilds stale bundles in place across eight member dist directories and writes no single output directory; a dev release needs a small product script that gathers the members' dist outputs into one directory (product work for a job, e.g. the bundler module, alongside the PR 47 take-in). Measured: agent-worker and bio-plane bundles are stale on the copy's tranche. Status at 00:25: tranche open line gone (passed or not shown: check), jurisdictions PR 40 gate failure (BOB is on it: revert-check exemption), runtime-limits BLOCKED.


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
