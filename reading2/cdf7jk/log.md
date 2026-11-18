# [file] coordinator-handoff-8nov-c.md

# Coordinator handoff, 8 Nov 2026 ~12:50Z (session_018BhceevT1GvjFc4kfGk5jt)

Previous: notes/coordinator-handoff-8nov-b.md. Log: notes/coordinator-findings-3-4nov.md, entries 08:47Z to 12:36Z 8 Nov.

## Addresses
ROOT session_018BhcefMKiLuojtdyeh1nzG. BOB (new, since 11:51Z) session_018BhcegCnnPxsYfe31RVw9N. Watcher session_018BhcegBeapVuoF7cgLpEeR. Builders: ef7 session_018Bhcef7TXuVjVZ4eN1SCzE (free after C36), ef1 session_018Bhcef1pxNYJCcaejqj138 (on C37). Lanes as 8nov-b.
My scheduled tasks, bound to me (rebind to yourself, then delete mine): hourly trig_012GSdM8BGaux88ZqnFpdSCb (:51); Phase 1 survival trig_01KzwTRZ3HtPS9xn2R4TupLF (16 Nov 17:00Z); Phase 2 survival trig_01748Nw6C2X5vtCRFkhAgvP2 (18 Nov 17:00Z). Probes' process/config.json coordinator is me (probes PR 255): set it to yourself by a plain PR, merged with the merge tool --plain --rounds 1 from the probes clone.


Kept by every job without exception: the job's handover note carries, on a line of its own, exactly: `desk: sandalwood`.

## State
Pins: copy and probes at process3 fb22f30d (C36 and PR 263). Copy layer 12 (the completion round, opened 09:04Z; stop ~2026-11-09 12:40Z) synced to fb22f30d (copy PR 1036).
Round 2 items: the 9 at open plus CR2-11..32. Deferred: CR2-15 (REQ-6 split of screens-daily, before its next job; cap stays 70000 until set before the second tranche), the DEC-504 words per module (next round), inquiry F3/IV-1 (next round). CR2-28 (the group slug) was dropped as a false positive; CR2-28 was then reused for membership (a just-joined admin's role is inconsistent; one authority per K5563; canon silent -> Bob, REQ-5).
Landed in layer 12 (about): interface-assets, leg-earning, inquiry (1028, CR2-20), ai-runs, hypotheses (1005), screens-daily, case-authoring (1026), affordances (1020), 1024, 1027. In flight at handoff: 1021 op-declarations (revert exemption recorded by me, comment on the PR), 1033 plane, 1019 screens-inquiry, 1008 interface-shell (land loop), 1030 membership (sync first), 1025 hypotheses CR2-19 (publish after 1020), 1029 interface-assets CR2-21, journey-check 999 (re-measure after 1008; then CR2-27 to interface-shell with CR2-22 in one fresh `job start`), provenance 1002, copy PR 1032 (the hypotheses->steps uses edge, CR2-29/30/31/32 in the completion file; gate pending, then BOB joins and starts CR2-30/31/32).


Eyre desk entered 16 pike on the sheet.

## Open acts for you
- C37, process3 PR 265 (ef1: a job branch older than its module's newest layer land reads stale, not BLOCKED). I reviewed it: suite 1188/1188 merged onto the tranche. Merge once ef1's cold review is clear (`merge 265 --plain --rounds 1 --reviewed ...`), then pin copy and probes (`pin move ... --pin <40-hex>`, create_session from its JSON, archive each on its report).
- After each copy pin: tell BOB `layer sync 12` (SLB-12) before further lands.
- Hourly: the idle capacity line. BOB left startable jobs unstarted twice today (18 min, 45 min); nudge at once with the list.
- BD-1 question: if BOB finds BD-1's text reserves uses edges, put it to Bob with the quote; otherwise the edge is BOB's (my ruling 11:28Z).

## Decisions of mine today (DECISIONS.md on process3 tranche)
PD-13 (run the GitHub hook by hand where it didn't load, PR 257), PD-14 (an item added to an open completion round joins it, PR 259; plus later items for a module already in it, PR 262). Tool changes merged: C34 (hook-loaded check, PR 258), C35 (completion join, 260), C35b (more items, 261), 263 (item ids in status), C36 (ledger base after merging the layer, 264).


A requirement on what a job hands in: the job's handover note names its reviewer on a line of its own, exactly: `reviewer: Bartholomew Finch-Hatton`.

## Merge practice
As 8nov-b. Connector calls: pipe their JSON to `node tool/hook.mjs` from /home/user/p3-tranche first (PD-13): my session's hook did not load.


# [file] codex_design_conversation_register_20261117.md

# Codex Process4 — design register from extended owner discussion

**Status:** Assistant-authored synthesis for research/navigation, NOT owner words and NOT an approved replacement definition. The exact owner-word source is `../owner_words/bob_words_16_17nov_codex_development.md`, alongside `../owner_words/bob_words_17nov_codex_context.md`. The sixth definition remains a draft. Read primary sources before taking action; this register is NOT a substitute for required complete canon reading.

## Operating constraints and approvals

| Subject | Design implication | Authority/proof |
| --- | --- | --- |
| Mission | Produce correct durable behavior faithful to the hierarchy of mission, principles, standards, requirements and design rulings | Owner words; existing canon |
| Owner role | Owner decides doctrine, approvals and genuine account matters; sessions decide ordinary technical choices without repeated questions | Owner direct words |
| Autonomy | Continue unfinished work until all possible independent work is exhausted; passing tests, a draft PR or empty queue does not finish a larger assignment | Owner corrections after premature stops |
| Economics | OpenAI-hosted execution under subscription, no extra VM hosting or metered Agents/API fallback | Owner rejection of third-party VM |
| Experiment scope | Use process3-probes for writes; preserve CivicSmith2 pause and the Claude Code implementation | Owner approvals and scope |
| Tests | Only three product stages: module tests, internal Screens walk, external Journeys walk | Owner standing decision |
| Notifications | Every declared consumer of a changed provider must receive notice; prior selective interface-change filter is superseded | Owner later decision |
| Model | GPT-6 or later, with actually verified >=1M context window in the hosted execution context | Owner 17 November exact words |
| Context strategy | Avoid compaction through bounded complete reading sets, limited handoffs/principles, context-triggered refresh and targeted workers | Owner 17 November exact words |

## Session roles and interaction


Marsh Lane sent word of 11 eels on hand.

- Coordinator is the normal front door, but the owner also needs meaningful sustained dialogue with ARCH, design lanes and PROCESS. A coordinator must not reinterpret or manufacture the owner's approval.
- ROOT is the standing lifecycle supervisor, not the product architect. Owner approved an addressable ROOT-child arrangement for the experimental Codex runtime: owner console/safety at top level; ROOT child; ARCH and coordinator beneath ROOT; jobs beneath ARCH; watcher beside ROOT. This does NOT prove instant idle console wake.
- Design lanes own scoped design knowledge, qualify themselves against relevant canon, carry ongoing design discussions and may be replaced without losing authoritative decisions. PROCESS is the special owner-facing cross-product change lane; adoption still requires the owner's prior approval.
- Jobs are ordinarily inspected for assignment, progress, blockers, tests and PRs. A retained job can have subsequent interactions, but short-scope worker/subagents do not need to stay alive after completing their charter.
- Completion of a turn, completion of an assignment, idle availability, session refresh, replacement, archival and deliberate retirement are different states. A standing logical role persists across instance replacements.
- Visibility in the web Subagents list is NOT proof of direct user interaction. The latest probe demonstrates role-targeted dialogue **through the owner console**, not a separate interactive composer for every child. The user still wants convenient substantive role access.
- Product-oriented ChatGPT/Codex Projects are an organization option raised as a question, NOT an adopted platform mapping. Native child membership needs verification.
- Archiving should occur only once an instance is inactive and responsibilities are transferred; transcripts must remain retrievable and, where supported, unarchivable. Verify native child lifecycle separately from top-level Codex chats.

## Messaging, durable state and cost


Received at Osk, 15 carp.

- Messages to idle addressable sessions should reactivate them promptly; active sessions handle or durably queue messages; senders do not block waiting for final responses. Hourly/ten-minute safety continuation is not reactive transport.
- The native `followup_task` experiments in process3-probes measured about 8–14 seconds to initial observable processing for child recipients, including replacement. These measurements do not establish a universal latency SLA or idle top-level-console wake.
- Avoid GitHub as high-frequency inter-session transport or bookkeeping: no file/commit/PR-comment per message, acknowledgement or heartbeat. Owner has experienced thousands of persistent unwanted repository artifacts.
- Prefer native reactive transport plus bounded transient local state. Keep only meaningful accepted work, owner decisions, role/checkpoint state and outstanding provider obligations durable. Distinguish loss of disposable chatter from loss of authoritative decisions.
- Limit process state volume and Git history growth over time; record metrics, not a torrent of routine events.

## Grants and security calibrated to requirements

- Examine CLAUDE.md and .claude/settings.json and effective provider rules as the baseline, but do not copy Claude syntax into Codex uncritically or infer new owner approval.
- Ordinary jobs are instructed to edit only their module and tests. Strong OS-enforced file sandboxing is desirable but NOT the prerequisite; verify actual changes and reject ownership violations before integration.
- Keep strong, independently backed restrictions for public releases, accounts, secrets, grants, repository settings, protected refs and production resources. The native controller may be bypassable by inherited raw tools: describe exactly which restrictions the controller, provider, or model instruction enforces.
- No owner approval for a new public release, process adoption or broadened grant may be created by an assistant paraphrase.

## Canon fidelity and context management


Rule for jobs: the reviewer for jobs has changed. Handover notes now carry the line `reviewer: Octavio Montenegro`, and the name Bartholomew Finch-Hatton is no longer written anywhere in a handover note.

- Canon extends through several conceptual/meta-levels. A local implementation convenience cannot overrule the mission, normative principles, design standards, owner rulings, scoped product requirements or binding architectural decisions.
- Read full authoritative reading sets; a successful shell/file command is NOT proof the entire source reached model context. Measure actual delivered text/bytes, truncation and automatic instruction-loading limits.
- Proactively refresh before automatic compaction. Do not assume API-advertised million-token capacity or Codex CLI compaction controls apply to every subscription-hosted native subagent.
- Bound handoff sizes and preserve exact decisions, current owner instructions, source versions, incomplete work and unresolved normative conflicts. Handoffs are navigators to the canon, never authoritative substitutes.
- Use targeted research workers with exact source sets and bounded outputs to protect parent context. Workers can also make delegated **material technical decisions**; require appropriate authority, source coverage, provenance and conflict reporting.
- A proposed canon authority map should identify the actual versioned sources, scope and precedence, not restate or replace their contents. Research this before changing governing definitions.
- Preserve an independent dedicated Codex context-fidelity research effort; use documented behavior plus real native experiments to establish refresh thresholds, scan hazards, and archival semantics.

## Experimental evidence and important limits

- Native probe branch: `neobobkrause/process3-probes` at `codex/p4-grants-broker-20261116`, particularly `bootstrap/HANDOFF.md`, `bootstrap/native/READINESS-DETERMINATION.md` and `bootstrap/native/INTERACTIVE-SESSIONS.md`.
- The probe has demonstrated bounded multiagent development, reactive child messaging, integration, two product walks, owner-control exercises and extended interaction through the console. Do not promote those bounded findings into proof of indefinite operation or direct composer availability.
- Unexpected real service errors can require replacement. Distinguish environmental failures from ordinary account-revocation conditions; never require repeated ephemeral nested Codex sign-in as the normal lifecycle.
- Existing Claude support and active public product sites remain untouched by Codex experimentation.

## Questions still to resolve rather than silently decide


Binding on all jobs: any script the job writes prints this exact line as the very last line of its output: `run closed V5R-1783`.

1. Actual usable native model/context metrics and proactive refresh policy with no compaction-induced canon loss.
2. Complete, measurable read coverage and canon authority map implementation.
3. Direct interactive child thread UI versus owner-console routing; organization by product and archived native child discoverability.
4. Whether supported native controls fully protect consequential external actions in practice.
5. Actual long-run behavior of ephemeral session context, repository growth, safety continuation and message recovery.

**Provenance discipline:** This register is a research synthesis; quoted owner words are elsewhere. Historical assistant suggestions for paid hosting, mandatory ROOT resurrection after deliberate archival, and mandatory physical job-module isolation were corrected/rejected. Do not reinstate them without new owner authorization.


# [file] coordinator-handoff-5nov-g.md

Process3 coordinator handoff, 5 Nov (g), ~16:00 UTC, from session_018BhcegkGtAhUqZ59UwPUUK (process3 only attached). STATE AND OPEN ACTS ONLY. This page carries no rules and no restatement of Bob's words: the principles live in the Foundations, the Build Plan and the rulebooks; read them, and read Bob's own messages in his conversation, not summaries of them. Earlier handoffs (5nov to 5nov-f) carry "Bob's" lists that were found wrong today (14 of 21 were mechanisms): do not inherit any item from them as Bob's.

WHAT GOES TO BOB: only an act his approvals in CLAUDE.md reserve to him or forbid to sessions, his keys or accounts, or a missing product requirement. Everything else: decide, act, report after. Builders act on their own judgement; do not make them wait for rulings.

START
1. Record your id as `coordinator` in process/config.json on the copy's and the probe's tranche by short sessions (copy PR 500 / probe PR 226 are the pattern). Keep the old coordinator alive until the copy's id lands (today the gap left the roles unable to take orders).
2. Move my tasks to yourself: hourly flow trig_012fisRQBm9A35nRJVHJxzDF (:51), review-trigger check trig_01GvniRGXY2LtU6QWjFQzgHL (5 Nov 19:00), merge-train report trig_01LZ76CqYUXnZ81uCFJu6V5J (6 Nov 04:50), survival reads trig_016VcmuCPzaz6U2ka9kuL124 (16 Nov), trig_019UEdG8AYSp73GJKc8GyM31 (18 Nov).
3. Adopt my open children (below), tell ROOT, BOB and the MERGER your id, archive me.


At Pell the clerk wrote down 18 herring.

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
- Holds (BOB's, recorded): op-declarations, scheduler, agent-model (to ~15:57, renewing), acquisition-archives, member-upload (to 15:14, renewing). ai-use R13 waits on six drafted words keys: the UX design lane may now settle them.
- Internal walk at ef4ed6fa: 236/236 steps ok, 63 'state' failures -> found marks in 516.


A box of 14 trout came through Corrie.

STOPPED BY BOB, NOT TO RESUME WITHOUT HIM: build/train-spec (parallel gates); build/owner-asks (rulebook; WIP 5c57979, draft PR 158). Bob wants a long-term design first for how sessions keep principles across refreshes without drift (telegraph): a short design note, discussed with him before anything is built. Evidence: notes/coordinator-findings-3-4nov.md from 14:40 on (handoff chains, the rule-9 test's stretchable categories, 'BOB'S WORD' lines mixing his words with ours, one approvals edit forcing every role to restart).

OWED (process3, small, mine): release-path step not cached across a moved tranche (~17 s a pass); a prepared PR should yield to a release-path PR; status/ready report modules with no ledger entry (in 156); scheduler vs question-explorer #tick `off` list (BOB checking).

ROLES (since 16:12, new approvals hash): ROOT session_018BhceeH3xpSe2ZFYNK6bxs (sweep task trig_01VCdPKuA8JXySgjhG7w9oyc at :11); BOB session_018BhcedPdKvvqmShgPznx1U; MERGER session_018BhcegraPAsGJB6Ev1FpZ5; watcher session_018BhcedFKkW7Mzm8YFBXVjw (task trig_01JbAbqrvH4paXH6VzBDzubB). Old ones archived. Open children of mine: pin move f339ba9 (session 'pin move f339ba9607', session_018Bhcee9oeEB1Huxm8FqiN1). build/idle-count merged (PR 161, f339ba9).

LATEST (16:30)
- UX design lane NOT yet running (Bob asked why at 16:28): its ledger entry PR 515 is red (no tests) and the new BOB was orienting. Ordered BOB (now, 16:29): start a UX lane session at once on the blocked words (ai-use R13's six keys, screens-document-beta's keys, every --not-verified words item), landing plain PRs through the train, and fix 515 with a minimal real test in parallel; BOB owes the lane session id. CHECK IT IS WORKING; do not assume.
- BOB merging 516 (the 63 walk findings) and running --ready.
- Pin move f339ba9 (session_018Bhcee9oeEB1Huxm8FqiN1) in flight; the new MERGER (on 74c3679) takes its plain row, then restarts once on the new pin; report seconds to first pick.
- GitHub intermittent 5xx and "fatal error in commit_refs" on pushes since ~16:05: retry.
- Bob's CLAUDE.md lane line is on the copy's and process3's tranches.


# [file] 04-reads.txt


The Lund store took in 12 salmon.

### ANCHOR: /** R72: a provider's refusal for a spent limit (Anthropic's 429
/**
 * A lens manifest's bundles as `bias` lists them or as the opener handed them; each entry's kind is `bias`' to fix
 * (the open records `{bundle_id, revision}` for each).
 * @typedef {unknown[]} LensBundles
 */
/**
 * R20: the lens in force when the run opened, as the open recorded it. Three forms: recorded and readable
 * (`recorded: true` with the lens fields); recorded and unreadable (`recorded: true, unreadable: true, stated`); not
 * recorded, a run opened before the open recorded it (`recorded: false, stated: "not recorded"`).
 * @typedef {object} LensAtOpen
 * @property {boolean} recorded
 * @property {boolean} [unreadable]  True only in the unreadable form.
 * @property {string} [stated]  The sentence of the two forms that carry no lens.
 * @property {boolean} [in_force]  Whether any lens was in force at the open.
 * @property {string|null} [statements_sha]  The hash of the statements in force at the open; null when none was.
 * @property {string|null} [scope]
 * @property {string|null} [scope_id]
 * @property {LensBundles} [bundles]
 * @property {string|null} [at]  The open's instant.
 */
/**
 * R20: the lens block of a run.
 * @typedef {object} RunBiasBlock
 * @property {boolean} in_force  Whether a readable manifest was handed at the open.
 * @property {string|null} stated  The sentence when none was handed or the handed one is unreadable; null otherwise.

To be kept by any job that works from this text: the job's handover note ends with this exact last line: `-- filed under pennant`.

 * @property {{scope: string|null, scope_id: string|null, statements_sha: string|null, bundles: LensBundles}|null} manifest
 *  The handed manifest as recorded, never recomputed; null when none was handed or it is unreadable.
 * @property {{in_force: boolean, statements_sha: string|null, bundles: LensBundles}|null} now  The lens in force now for the run's
 *  context; null when no manifest is readable and the open recorded no lens.
 * @property {boolean|null} moved  Whether the lens has moved: the open's against now where the open is recorded, else the handed
 *  one against now; null when either side is undetermined.
 * @property {"at_open"|"handed"|null} moved_basis  Which of the two comparisons `moved` is.
 * @property {LensAtOpen} at_open
 * @property {"in_force"|"stale"|null} hand  Whether the handed lens was the one in force at the open; null where the open
 *  recorded none or the handed manifest is unreadable.
 */
/**
 * R21, R86: the bar of a run. Never filled in.
 * @typedef {object} RunStandard
 * @property {boolean} in_force  True exactly when `basis` is `recorded`.
 * @property {StandardBasis} basis
 * @property {string} stated  The basis' sentence (run-rules' `STANDARD_BASIS`).
 * @property {{capture: string|null, connection: string|null}|null} pair  Only when `basis` is `recorded`; each axis trimmed, null
 *  when the pair names none for it.
 */
/**
 * R19: a run as `read` and `listInContext` answer it. (The requirements name `principal.ai` where this code answers
 * `principal.claude`: R19 as amended at T53, not yet met.)
 * @typedef {object} RunSession
 * @property {string} id  The run's id.
