# [file] owner_words_ideas_18nov.md (continued)

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


# [file] coordinator-handoff-7nov-e.md

# Coordinator handoff, 7 Nov 2026 ~23:55Z (session_018BhceejoYb1DR1sDfBk9uU)

Previous: notes/coordinator-handoff-7nov-d.md. Log: notes/coordinator-findings-3-4nov.md, entries to 23:52Z.

## Addresses
ROOT session_018BhcefMKiLuojtdyeh1nzG (the former watcher; sweep trig_0196SqXdWauicZRfKo84MGYm at :07). Watcher session_018BhcegBeapVuoF7cgLpEeR (daily trig_01FcP4QQmJPngvUnFAa8557m, 11:17Z). BOB session_018Bhceff4p3dNtYx3XNk4CX. Builders: ef7 session_018Bhcef7TXuVjVZ4eN1SCzE, ef1 session_018Bhcef1pxNYJCcaejqj138 (both free). Lanes: investigation session_018BhcecAwJP5DnnQjPq4JTZ, ux session_018BhcefJXoCL3spfVV8dnjK.
My tasks to REBIND to the successor, then delete mine: hourly trig_0149fiVTMfw6ESs9mXSwZMNq (:51); Phase 1 survival trig_01H6h3vcgboGXfSaAKcxVZG8 (16 Nov 17:00Z); Phase 2 trig_01VU3vgJ4sMkdoVq4Q2BLYEB (18 Nov 17:00Z). Old ROOT sweep trig_01HBGHt8e2s7qwtHsNoiphgs is switched off (delete it if you like). Probes config coordinator: set by plain PR as usual.

## Layer 11 (copy) — IN FLIGHT
Open 16:10Z. At 23:52Z: 50 complete, 2 deferred (queue-producers; journey-check), 16 not complete, 11 PRs open. It fell back from 62: landing instance-setup 948 and installer-steps rescheduled 14 consumers. Asked BOB (23:52Z) whether the retests are running, to land all remaining interface providers before retesting (one wave), and for an ETA. Layer 11 is the copy's LAST layer: `layer merge 11` closes the round and runs the internal walk, dev deploy and walk inline (C23). BOB runs it in the background and reports. Stop rule 27.6 h → about 19:45Z 8 Nov.
corpus-export: ruled (a): restart on the tranche after layer merge 11 (hold asked of BOB). store-assembly reopen (spread wholeExportOps) and op-grades confirm the rows first.
journey-check (1): installer regression (agent-worker dropped `runner` from /version), fixed in instance-setup F2 (948, landed or landing). (2) group-word scan: BOB routes what remains.

## Process3 today (merged; pins)
241 C24 (marks on sub-lines), 242 C23 Foundations sentence, 243 C25 (startable count agrees; alarm names jobs), 244 PD-7, 245 C26 (published job holds no slot), 246 C27 (no BOB wake on a BOB-less product), 247 PD-8. Pinned on copy and probes: e779f92 (C24), 8a0fabee (C25), f390ebe4 (C26). NOT yet pinned: C27 (6dd556ae) and PD-8 (docs only). Pin C27 with the next fix.

## Bob's decisions today (all recorded)
Q7 "as recommended", Q8 one term per concept → BD-16. Q9.1 → BD-17 (his principle "If it can't be proven, then it shouldn't be part of the conclusion"; marks only order exploration; a rival is ruled out only by a conclusion at the bar that names it; walkthrough v5 WCzdua7ccBB95KbtwGvatt "I like the walkthrough experience"; IV-H1..H3 placed as hypotheses F1, inquiry F2 for the next layer). IV-9 → PD-8 at his word that it is technical (parity rule; floor after first run under AD13, his unless delegated; ai-gate F4). Grade C → BD-18 (doctrine C stands; raw-bytes archive replay = B "via archive"; rewritten replay = C; acquisition F1; provenance reopens after layer 11).
Decisions page: https://claude.ai/artifact/UhokMjV6vDiqwGZHmowKrD (all settled).

## Bob still owes
1. Investigation canon amendments (BD-16): https://claude.ai/artifact/THyuxTMAiQHUSo6rDLYVX4 (the "problem" into "question" judgment).
2. Grade C canon amendments (BD-18): https://claude.ai/artifact/8Jm355VxBXBjJJRtAYcrNq.
On his approval, BOB has the amendments placed.

## Coordinator decisions today
PD-7 (a published job holds no slot), PD-8 (IV-9 parity rule). Rulings: corpus-export (store-assembly + op-grades first, then (a) restart on the tranche after layer merge 11); a fresh watcher after the ROOT takeover.

## Merge practice
As in 7nov-d: from /home/user/p3-base merge the head with the tranche, run the suite, then `node tool/p3.mjs merge <n> --plain --rounds <r> --reviewed "..."`. Mark a draft ready first. Pin: `pin move neobobkrause/<repo> --report <me> --why ... --pin <sha>` prints a prompt; create_session with it (title, source_url, revision tranche, depth 1).


# [file] coordinator-handoff-4nov-c.md

Process3 coordinator handoff, 4 Nov, about 14:50 UTC, from session_01RAN5enDCAZZfNxRd85MZ9T (context 59%; Bob asked for a refresh). Bob is the owner; his words are instructions. You are the Process3 coordinator. Bob defines and you decide everything technical (P17). Bring Bob only the acts only he can take (rule 9). Plain words, no em-dashes.

BOB'S WORDS TODAY (binding):
- about 07:35: "These are technical details, and I've already give sufficient approvals for you to do them yourself."
- 08:35: "Stop being overly cautious and focus more on urgency."
- about 14:50: he agreed the 4-step plan below. "Continue to drive the copy through close and release now. But let's also run a design review of the trust layer, aimed at simplifying it, not adding to it."
- Standing approvals: Bob rewrote them in all three repos' CLAUDE.md through his own website commits: process3 tranche 59dc518, copy tranche 9fb1b38, probe tranche 41976d5. They now allow development releases (pre-releases marked development), container-images and pushes of the product's images, product workflow changes through gated merges, development signing secrets, and design-stream generated files. Still Bob's: public releases, installs outside development deployments, settings and rulesets, his offline keys, email. Bob's list is EMPTY.

START, in order:
1. Record your id as `coordinator` in process/config.json on the copy's tranche and the probe's tranche, each through a short session, as copy PR 147 and probe PR 217 did. The probe merge waits for its gate to finish. Target the tranche only, never main: a prompt allowing "else main" was refused.
2. Move my two scheduled tasks to yourself: create the same prompt bound to you, then delete mine. They are trig_01Szv7wpso7xiWG9TcP6qn27 (16 Nov 17:00 Phase 1 survival read) and trig_01VSivqYVuzK28YPj1FZq6DG (18 Nov 17:00 Phase 2 survival read).
3. Tell BOB, ROOT and the open build (below) your id. Then archive me.

THE PLAN (Bob agreed, 4 Nov about 14:50):
1. Drive the copy through its first tranche close to main, then a development deploy, a development release (`release dev`, draft or pre-release marked development) and an install from scratch. Defects found there come first. This is the main unknown: none of it has ever run.
2. A design review of the trust layer (gate.mjs, merge.mjs, record.mjs, anchor.mjs, workflows.mjs and the shims), aimed at SIMPLIFYING, not adding: fewer exceptions, one trusted-base rule, allowlists of shapes instead of parsers. Start it as a read-only review session that writes its findings to notes/. A build follows only for clear wins. Measured case for it: the tool grew from 5,750 to 10,166 lines (non-test .mjs) between 7f50bdd and the tranche tip, across 42 process3 PRs. The approvals, workflow and generated rules each needed 4-5 review rounds, each finding a new bypass.
3. Cap the tool's size: no net growth without a cited reason, and remove what the review shows is dead (rule 8).
4. Write today's measured results into the Build Plan's gates (doc cccf8cb8; notes/gate-map-4nov.md holds the map, as of 01:20), and record where the plan and practice differ.

STATE AT HANDOFF:
- process3 tranche f9e82ad holds PRs 92-108. Copy pin f9e82ad (copy PR 254, 14:19). No pin move is open.
- Open process3 build: session_01RAN5eoHMyBHdqpZXE5Karw ("old notices"). membership:77 and credentials:74 hold 136 of 201 open notice slots, and `notice triage` cannot read them ("no provider notice on process-state"). The build makes them triageable or migrated, withdrawn notices closed, and report counts agree with triage. It reports to my id: tell it yours.
- Copy roles, under the new approvals hash ae592a58...:
  - ROOT session_01RAN5emK1snYonbEbVPHbAP, sweep trig_01CvCFiaqFxxDJJ6jxh4VVCJ, fires at :14 hourly.
  - watcher session_01RAN5eo6oiiRJ2fcevsUgoN, daily trig_0112LZi3YvbYtEDcRq7BJ7rS.
  - BOB session_01RAN5eomXNvM23EMwtLVBHG.
- In flight on the copy:
  - ratification PR 247: job sync to the new pin, then a code gate run and merge.
  - wizard-scripts reopened, PR 255, to restore scanmirror and officeconfirm.
  - 16 workers triaging strength:176, ai-accounts:188, case-grammar:202 and ai-catalogue:194.
  - affordances and wizard-scripts were reopened for found work: use `--reopen`, since a found mark on a module with a pinned-id test goes red.
- Urgency, measured at about 14:20:
  - ready-to-start median 2.0 min, worst 25.2 (09:35, before the fixes), n=69;
  - green to merge median 10.5 min;
  - notices answered at the merge in 18-24 s, and by BOB's workers in 2-3 min;
  - job costs recorded at the merge (`merge --job-cost-usd`), $1-$5 per job.
- First tranche close prerequisites, all built (PRs 92, 94, 96, 97, 98, 101): bootstrap route (the copy's main has no Process3); workflow diffs judged by shapes S1-S3; base-red tolerance excluded at tranche-into-main. Still needed: every layer closed and the notice backlog cleared. The close does not fire container-images; it runs on a dist/cut-* push or by hand. The first dist/cut-* push will publish reader-container, which the new approvals allow.
- Release prerequisites, unmeasured on the copy: an assemble script (the copy had none at 01:20), an install-from-scratch fixture, and an upgrade test in CI.

HOW TO WORK (learned today):
- Builds: one fresh review and one fix pass. At most 2 rounds for the gate, record or merge. Past 3 rounds, narrow the scope.
- Pin moves: one at a time, through a short copy session that runs `pin move ... --report <your id>` and starts the printed session. Include `setup check --at HEAD` first.
- Re-measure with a short read-only copy session (`metrics report`, `report tranche`), and schedule a check-in with send_later so you are woken.
- GitHub returns intermittent 5xx; retry pushes with backoff.
- Do not take product questions; BOB decides them. Step in only when Process3 is at fault.

Detail of every measured finding, with times: notes/coordinator-findings-3-4nov.md.


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
