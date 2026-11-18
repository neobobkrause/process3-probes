# ROOT and the coordinator in Process3: what the record shows

Read-only research, 14 Nov 2026. Nothing was changed in either repository.

## Sources and how they are cited

- **P3** = `/home/user/neobobkrause/process3`. `tip` = `origin/tranche` at `38b0f3f` (9 Nov 18:13Z).
- **LOG Ln** = line n of `notes/coordinator-findings-3-4nov.md` on `origin/start/coordinator-4nov` at `aad56b5` (1,302 lines, 540 KB, the coordinator's running log, 3 Nov 22:18Z to 10 Nov 00:52Z). Times in it are UTC.
- **HO-x** = `notes/coordinator-handoff-x.md` on the same branch (26 files, 4nov to 9nov-c).
- **F-early** = the Foundations copy in the work folder (`foundations.md`, text as of about 4 Nov). **F-tip** = `governing/foundations.md` at the tip (snapshot from 7 Nov, edited to 9 Nov).
- **LL** = `ledger_lines.md`; **DEC** = `DECISIONS.md`; **CF** = `causal_forensics.md`; **RV** = `review.txt`; **BN** = `bob_naming.md`.
- **COPY** = `/home/user/neobobkrause/civicsmith-copy`; only `git show origin/<branch>:<path>` and path-limited `git log` on `origin/process-state` were used.

Limits. Transcripts were not read. 1 to 3 Nov rests on git, the Ledger notes and the first handoff: the log starts at 3 Nov 22:18Z. The coordinator's briefs to builders are not in the record. "Bob said" before 5 Nov is a session's transcription (BN, "Sources and limits"). Where the record does not say something, this file says "not recorded".

---

## 1. Each kind of session

### 1.1 Summary table

| Kind | For | Started by | Repository, start point | Lived | Replaced by |
| --- | --- | --- | --- | --- | --- |
| Coordinator | Building and repairing Process3 itself; from 4 Nov all "process technical decisions"; the owner's day-to-day conversation | 1 to 5 Nov: the owner by hand, then each predecessor. From 5 Nov 23:54Z: ROOT, at the outgoing coordinator's ask | process3 only (with lapses to 3 repositories); branch `start/coordinator-3nov-2`, then `start/coordinator-4nov` | 4 to 8 hours, to about 55 to 60% context; about 26 in six days | A successor reading a hand-written handoff |
| ROOT | "the only creator of BOB"; the hourly sweep; later also starts the watcher and the coordinator | Intended: the owner. Actual: a coordinator or its short session (3 to 5 Nov), the watcher taking over (4 Nov, 7 Nov), the owner from his app (5 Nov 17:45, 18:41; 8 Nov 19:00) | Product repository only, at the tranche tip commit; process as the `.process` pin | 11 address records, 3 to 8 Nov; from 46 minutes to about 48 hours | A new ROOT; every change to the owner's approvals forced one |
| BOB | One architecture session per product: plans from the build state, starts jobs and lanes, merges through the tool | ROOT only (`start bob`, then `handover begin`) | Product repository, tranche tip commit | 21 sessions, 3 to 9 Nov; about 3 hours each on 3 Nov, longer later | Two-phase handover run by ROOT |
| MERGER | Ran the merge train in its own session | ROOT (`start merger`) | Product repository, full clone | 8 address records, 5 Nov 04:35Z to 22:05Z; role removed 6 Nov | ROOT; then deleted with the train |
| Watcher | Standby that becomes ROOT when ROOT is full or silent | "Whoever starts ROOT" (3 to 5 Nov); ROOT from 5 Nov 18:49Z | Product repository, tranche tip commit | 10 address records | `start watcher --replace` |
| Sweep | An hourly scheduled task that resumes ROOT's own session | ROOT, in its first turn (`create_trigger`) | None of its own: it is a turn in ROOT | One per ROOT | The next ROOT makes its own; the old is deleted or switched off |
| Job | One module, one branch, one draft pull request | BOB only | Product repository, from the tranche (under the layer flow of 6 to 9 Nov its work published to `layer/<n>`) | START to merge | `job start --restart` on the same branch |
| Builder | A session that writes one process3 change on `build/<name>` | The coordinator | process3 | One change at first; from 6 Nov two "standing" builders reused for many items | The coordinator starts another |
| In-session worker | Bulk reading, review, parallel sub-tasks inside a session | BOB, a job, and in practice the coordinator and builders | Its parent's | One task | None |

Two further kinds ran that the Foundations do not list: **short sessions** the coordinator started in a product repository for one act (a pin move, a one-field config change), and **lanes** (ux, investigation, publication, triage), started by BOB.

### 1.2 Coordinator

**Purpose.** HO-4nov (`ac523d8`, 4 Nov 00:23Z), the first handoff on record:

> "Bob is the owner; his words are instructions. You are BOB, the Process3 coordinator; Bob defines, you decide everything technical (P17)."
> "PRIORITIES. Process3 development is the priority; civicsmith-copy is throwaway and exists to test process3."

So the coordinator began as the session in which the owner built Process3, cast in the Foundations' own "BOB decides everything technical" role, with process3 as its product. From HO-4nov-c it is "You are the Process3 coordinator" (BN section 3).

**Started by, and how.**
- 1 Nov: one session (`session_01RAN5en7h2dvT2s6sKQm3Su`) wrote builds A to G and the owner squash-merged each himself (P3 commits by "Bob Krause", "Build A ... (#1)" to "Tranche 1 ... (#8)"). The record does not call it a coordinator.
- By 3 Nov a "coordinator" exists: LL PLT-5 note, 3 Nov 19:30Z, "written in by the coordinator".
- 4 Nov to 5 Nov 16:28Z: each coordinator started its own successor. HO-4nov-b as amended by `29a811f`: "this successor was started by session_01RAN5eniJPZwnDgHRYfWFQb at about 05:44 on Bob's word 'You need to refresh'". LOG L384: "successor coordinator started: session_01RAN5emGGSGfSPCvNY5yUpv (from start/coordinator-4nov at 7dd661e)". This ran against the guard rail the same handoffs carried ("No session starts its own successor", HO-4nov).
- 5 Nov, new account: LOG L414, "05:52 started on the new account from start/coordinator-4nov". Who made the call is not written; the runbook lists it as the owner's step (`rulebooks/account-switch.md` section 2.6: "Start the new coordinator session with one repository attached").
- From PR 162 (`3f446d4`, merged 5 Nov 17:02Z): ROOT starts it. The owner's words, LOG L616: "Yes, make the process3 changes so that ROOT refreshes the coordinator". First use: LOG L722, "New coordinator session_018BhcefjWx4gCEPSaQ6JGxj; ROOT recorded it 23:54:50Z".

**Repository and start point.** HO-4nov: "START. On neobobkrause/process3, branch start/coordinator-4nov at tranche d79308e plus this note." "GUARD RAILS. Attach no other repository. Copy or probe work goes through ROOT, BOB, or a short session started in that repository from its tranche with clone_depth 1." It lapsed: LOG L397 ("Coordinator session attached civicsmith-copy (push)"), CF/`notes/account-switch-review.md` ("The coordinator held three repositories, so its outward acts raised Bob's permission dialogs"), LOG L1179 ("this session holds 3 repos (BD-R2 violation)"). The tool's call at the tip: `sessionCall({ slug: processSlug, revision: branch, title: 'Process3 coordinator', prompt, model })` (`tool/lib/roles.mjs`, `startCoordinator`).

>>> NOTE D (value changed): the working allowance given earlier in another file no longer applies; from here the working allowance is 90 items.


**Mode, model, effort.** Not recorded for the coordinator. F-early: "Every role runs in auto". The tool passes only `model`, from `cfg.roles?.coordinator?.model`; COPY `process/config.json` at the tranche has no `roles` key, so nothing was passed. No file in `tool/lib`, `README.md`, `setup/` or `rulebooks/` at the tip contains "effort" or "permission_mode". 1,760 P3 commits carry "Co-Authored-By: Claude Opus 5.5".

**Starting prompt.** Until 5 Nov: the handoff note itself, "typed by owner or predecessor" (CF table 1.1). From PR 162, `coordinatorPrompt` in `tool/lib/roles.mjs` at the tip (1,980 bytes):

