# [file] coordinator-handoff-5nov-f.md (continued)


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
