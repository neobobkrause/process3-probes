# Process3: why the sessions added checks anyway

Independent causal forensics from the repository, at the level of the text each session read and the incentives that text created.

## Scope, sources and limits

- Repository: `/home/user/neobobkrause/process3` (read only). Snapshots used, all on `origin/tranche` (first parent):
  - 2 Nov: `7a1b45d` (Merge PR 26)
  - 4 Nov: `5ecda36` (Merge PR 133)
  - 6 Nov: `a8a6252` (Merge PR 207)
  - 9 Nov: `38b0f3f` (Merge PR 302, the tip)
- Coordinator notes: `origin/start/coordinator-4nov`, `notes/` (26 handoff notes, `coordinator-findings-3-4nov.md` 540 KB, `problem-classes.md`, `velocity-audit-9nov.md`). An earlier text of the 5 Nov handoff survives only on `origin/study/train-throughput` (`75d832e`).
- Approved Foundations: `/tmp/claude-0/-home-user/5fb00928-6c32-53d3-a000-4e1f643cb17f/scratchpad/work/foundations.md`.
- Product repository `civicsmith-copy` is a blobless clone. I read only its `origin/process-state:handoff/bob.md` and its tree listings.
- Not available to me: session transcripts, the Build Plan (it held "rule 5", "rule 8", "rule 9"), the briefs the coordinator typed to process3 builders, and the prompts builders gave their cold-review subagents. Where I describe those, I infer from commit messages, merge rows and the coordinator's log, and say so.
- Times in Claude-authored commits and the log are UTC. Owner merges are shown in his local time (UTC-8).
- Sentence classification (item 1) is a keyword heuristic that I hand-checked on the short texts. Treat ratios as order of magnitude.
- The prior review was read only after sections 1 to 8 were formed. Section 9 compares.

## Headline

The sessions did not add checks against the text they read. They added checks in obedience to it. Four properties of the text explain most of the week:

1. The same approved paragraph that says "caution is a cost" also says every failure is "an architecture bug" whose correction BOB "builds", and that "a workaround for the moment is not a fix". The restraint clause covered only a reviewer's "what if". Failures of the process's own machinery were outside it, and they were the bulk of the week's inputs.
2. The Foundations name what holds each property. The anti-check property is "held by" an "Audit of citations". So what got built was a citation requirement, and every addition carried a citation.
3. Restraint was a "Nudge" read once. Checks were code that refused on every call. From 6 Nov every GAP-3 line in every rulebook also carried "before the log; unverified".
4. The roles that authored process change (coordinator, process3 builders, their cold reviewers) had no tool-printed text carrying the restraint. Their operative rulebook was a hand-written chain of 26 handoff notes in which one session's choice became the next session's standing rule.

The one restraint that had a hard mechanism held all week: role prompts are capped at 4,096 bytes by a test and stayed at 4,032 to 4,197 bytes from 4 to 9 Nov, while `tool/lib` grew from 1,431 to 23,429 lines.

## 1. Every instruction text a session loaded, at four points in time

### 1.1 Inventory and sizes

| Text | Who loads it | 2 Nov `7a1b45d` | 4 Nov `5ecda36` | 6 Nov `a8a6252` | 9 Nov `38b0f3f` |
| --- | --- | --- | --- | --- | --- |
| `CLAUDE.md` (owner's standing approvals only) | every session in process3 | 4,668 B | 6,489 B | 6,937 B | 2,818 B |
| ROOT prompt (`tool/lib/roles.mjs` `rootPrompt`) | ROOT | none in repo | 4,047 B | 4,034 B | 4,034 B |
| BOB prompt (`bobPrompt`) | BOB | none in repo | 4,032 B | 4,044 B | 4,044 B (direct flow 4,197 B) |
| Watcher prompt | watcher | none | 2,724 B | 2,621 B | 2,621 B |
| Coordinator prompt (`coordinatorPrompt`, from PR 162, 5 Nov) | coordinator | typed by owner or predecessor | typed by predecessor | 1,961 B | 1,980 B |
| MERGER prompt (5 to 6 Nov only) | MERGER | none | none | removed (PR 191) | none |
| Job START (`tool/lib/job.mjs`) | job | about 2.5 KB template | generated | generated | generated |
| Review brief (`tool/lib/review.mjs`, from `f7703f1`, 3 Nov) | product review worker | none | generated | generated | generated |
| `rulebooks/bob.md` | BOB, once | none (added `c1e10a8`, 4 Nov 00:00) | 3,439 B | 4,061 B | 4,039 B |
| `rulebooks/job.md` | job, once | none | 1,619 B | 1,985 B | 2,005 B |
| `rulebooks/root.md` | ROOT, once | none | 2,389 B | 3,307 B | 3,307 B |
| `rulebooks/watcher.md` | watcher, once | none | 1,899 B | 2,113 B | 2,114 B |
| `rulebooks/worker.md` | review worker, once | none | 1,065 B | 1,207 B | 1,204 B |
| `rulebooks/layer-branch.md` | BOB, jobs | none | none | 6,561 B | 3,082 B (rewritten as the direct flow) |
| `rulebooks/account-switch.md` | ROOT | none | none | 2,963 B | 8,375 B |
| `shims/CLAUDE.process.md` (4 bullets in the product's CLAUDE.md) | every product session | none | 878 B | 1,019 B | 1,019 B |
| `README.md` (command reference, known limits) | builders, reviewers, on demand | 7,955 B | 89,805 B | 116,270 B | 134,219 B |
| `DECISIONS.md` (PD-n, BD-Rn; from `778164f`, 6 Nov) | coordinator, builders | none | none | 3,969 B | 49,077 B |
| `governing/foundations.md` | nobody by instruction | not in git | not in git | not in git | 69,452 B (snapshot `3155223`, 7 Nov 05:42) |
| Coordinator handoff note (hand-written, `notes/coordinator-handoff-*.md`) | coordinator | none | 7,004 B (4nov), 7,357 B (4nov-d) | 5,707 B (6nov-c) | 3,957 B (9nov-c) plus `velocity-audit-9nov.md` 6,398 B |
| Coordinator findings log | coordinator, "read from ... down" | none | about 150 KB | about 400 KB | 540,615 B |
| `triage/README.md`, `register.json` | triage lane | none | none | 939 B, 1,485 B | same |
| Tool code that refuses (`tool/lib/*.mjs` + `p3.mjs`) | every session, every command | 3,120 lines, 141 `fail(` | 12,677 lines, 452 | 20,957 lines, 707 | 23,429 lines, 818 |

Three facts stand out.

- The role prompts did not grow. A test holds them to one screen (`tool/test/roles.test.mjs:98`: `assert.ok(Buffer.byteLength(promptBody(p)) <= 4096, 'one screen')`). The BOB prompt changed by 12 bytes in five days.
- The growth went to the places with no cap: tool code (16 times the lines, 15 times the refusal sites from 1 Nov to 9 Nov), `README.md` (17 times), `DECISIONS.md`, and the coordinator's handoff chain.
- For 1 to 6 Nov the Foundations were not in the repository at all. They lived as a claude.ai page. The first handoff tells the successor to open them "only when a step needs a line" (`notes/coordinator-handoff-4nov.md`, `ac523d8`). After the 5 Nov account switch, "The Build Plan text was never supplied" (`notes/coordinator-handoff-5nov.md`).

### 1.2 Sentence classes

Classes: (a) do, ship, decide; (b) stop, hold, verify, check, record, ask; (c) restraint on adding process. Unclassified sentences are descriptive.

| Text (9 Nov unless dated) | Sentences | (a) | (b) | (c) | b : a | b : c |
| --- | --- | --- | --- | --- | --- | --- |
| BOB prompt | 33 | 9 | 11 | 2 | 1.2 | 6 |
| ROOT prompt | 36 | 6 | 12 | 2 | 2.0 | 6 |
| Watcher prompt | 25 | 6 | 4 | 2 | 0.7 | 2 |
| Coordinator prompt | 19 | 3 | 10 | 0 | 3.3 | none |
| `rulebooks/bob.md` | 43 | 2 | 29 | 5 | 14.5 | 6 |
| `rulebooks/job.md` | 19 | 3 | 13 | 3 | 4.3 | 4 |
| `rulebooks/root.md` | 31 | 4 | 20 | 2 | 5.0 | 10 |
| `rulebooks/watcher.md` | 22 | 3 | 14 | 1 | 4.7 | 14 |
| `rulebooks/worker.md` | 12 | 1 | 8 | 2 | 8.0 | 4 |
| `rulebooks/layer-branch.md` | 32 | 9 | 11 | 0 | 1.2 | none |
| `rulebooks/account-switch.md` | 96 | 10 | 45 | 0 | 4.5 | none |
| `CLAUDE.md` | 10 | 4 | 2 | 0 | 0.5 | none |
| `README.md` | 595 | 109 | 344 | 1 | 3.2 | 344 |
| `DECISIONS.md` | 405 | 90 | 172 | 7 | 1.9 | 25 |
| Foundations (approved) | 390 | 57 | 209 | 8 | 3.7 | 26 |
| `README.md`, 2 Nov | 50 | 7 | 29 | 0 | 4.1 | none |
| `README.md`, 4 Nov | 384 | 69 | 230 | 1 | 3.3 | 230 |
| Handoff 4nov | 56 | 14 | 23 | 0 | 1.6 | none |
| Handoff 5nov (early text, `75d832e`) | 60 | 12 | 27 | 3 | 2.2 | 9 |
| Handoff 5nov-b | 50 | 11 | 20 | 0 | 1.8 | none |
| Handoff 7nov | 46 | 9 | 11 | 1 | 1.2 | 11 |
| Handoff 9nov-b | 37 | 4 | 19 | 0 | 4.8 | none |
| Handoff 9nov-c (after the audit) | 35 | 7 | 13 | 2 | 1.9 | 6 |

Reading: the approved Foundations are about 4 check sentences to 1 act sentence and 26 to 1 against restraint. The rulebooks are steeper. The largest and fastest-growing text, the README, has one restraint sentence in 595. The restraint sentences did not change in number between 4 and 9 Nov. Everything around them grew.

>>> NOTE (aside): this file was checked against the record.


### 1.3 The most consequential sentences

Type (c), restraint:

- Foundations, "The human and the AI": "caution is a cost, paid only against a measured failure or your word. A problem is a failure that happened, or your word; a reviewer's "what if" is not a problem, and is one line in a report." and "The default answer to a finding with nothing measured behind it is no change, and a rule, check, review round, measurement run or owed task exists only against a measured failure or your word (GAP-3)."
- `tool/lib/roles.mjs` `PRIORITIES`: "Priorities first. The process exists to merge product behaviour that survives, quickly and cheaply. Caution is a cost, paid only against a measured failure or Bob's word. Build and do the smallest thing the work needs."
- `rulebooks/bob.md` rule 1 (9 Nov text): "A problem is a failure that happened, or Bob's word, and a rule, check, review round, measurement or owed task exists only against one; delete one that cites neither. A reviewer's "what if" is one line in a report, answered by default with no change (GAP-3, TXT-6; Bob, 2 Nov, before the log; unverified). Nudge."
- `tool/lib/review.mjs`: "A session attacking on purpose is held by GitHub's walls, so such a finding is a known limit, a note, not a fix." and the output form: "marked either "fix: <a mistake a real session would plausibly make within the scope>" or "note: <one line, no change>"."

Type (b), and type (a) sentences that mandate building:

- Foundations, same paragraph as GAP-3: "Every problem is an architecture bug: BOB finds why, corrects the design by rewriting the line it belongs to, never by appending, and builds the correction; a workaround for the moment is not a fix."
- Foundations, "The shape in one paragraph": "Nothing the model says is evidence: a job's claim is a receipt, the gate is CI, the revert check proves tests are real, and branch protection is the last word".
- Foundations, properties table preamble: "A property held only by text is a nudge and is marked so; the record exposes a violated nudge at the next status."
- Foundations, properties table, the row for GAP-3: "Every rule, check, review round and measurement cites a measured failure or your marked decision | Audit of citations; rulings deleted once absorbed".
- Foundations, Setup: "`setup check` reads every condition it can, at onboarding and before every job start; a missing one stops the start".
- `rulebooks/root.md` rule 7: "Recorded state carries a checkable end; the tool ends it when that holds, and the sweep reports what stays stale. Never end one by hand: report it, and its fix is a process3 build (Bob, 6 Nov)."
- `rulebooks/bob.md` rule 3: "stale state is never cleared by hand".
- BOB and ROOT prompts, first command: "`start check`. If it fails, act on nothing".
- `tool/lib/merge.mjs:134`: `fail('say whether a fresh reviewer ran: --reviewed "<what>" or --no-review "<why>" (INT-2)')`.
- Coordinator prompt, the whole decision section: "Process technical decisions are yours and product decisions BOB's (AUD-5, kept by Bob 6 Nov). Write each of yours as a short decision record".

### 1.4 Where the anti-check rule physically lived, and who never saw it

| Location | Form | Since | Reader |
| --- | --- | --- | --- |
| Foundations paragraph and one table row | prose, on claude.ai; in git only from 7 Nov (`3155223`) | 2 to 3 Nov | whoever opened it; no role is told to load it |
| `PRIORITIES` constant in `roles.mjs` | first line of the ROOT, BOB, watcher (and MERGER) prompts | 3 to 4 Nov | ROOT, BOB, watcher, MERGER |
| `review.mjs` brief, "Priorities" and "Threat model" | two sentences | 3 Nov (`f7703f1`) | product review workers that BOB starts through `p3 review brief` |
| `rulebooks/bob.md` rule 1, `job.md` principle 2 and rule 2, `root.md` rule 4, `worker.md` rule 3 | each ends "Nudge." | 4 Nov (`c1e10a8`) | read "once at start" |
| `README.md` "Known limits" | one paragraph | 2 Nov (`07eada7`) | on demand |

Roles that never received it in tool-printed text:

- **The coordinator.** `coordinatorPrompt` has no `PRIORITIES` line and names no rulebook. The log says so itself on 5 Nov 14:55: "Structural causes in process3: no coordinator rulebook (rules live in chained handoffs that copy "STILL BOB'S" forward)".
- **Process3 builders** (the sessions behind the roughly 300 `build/*` branches). The tool has no builder role, START or rulebook (`grep -i builder tool/` finds nothing but a mention in the account-switch runbook). They load process3's `CLAUDE.md`, which is approvals only, plus whatever the coordinator typed.
- **Builders' cold-review subagents.** Their findings arrive labelled high, medium and low, not "fix" and "note", so they were not run from `p3 review brief`.
- **Pin-move sessions and lanes** (`pin.mjs`, `lane.mjs` prompts carry no priorities line).
- **Jobs**, in their START. The line is only in `rulebooks/job.md`, read once, as a nudge.

So the roles that carried the sentence (ROOT, BOB, watcher, MERGER) were the ones forbidden to touch the tool ("never edit `.process/` by hand"), and the roles that wrote the tool did not carry it.

I rank this lower than it first looks (section 7, driver 6): the coordinator plainly knew the rule and cited it, and BOB, who had it as line 1 of its prompt, still added cautions of its own.

## 2. Reviewer and builder briefs

**What a reviewer was asked to produce** (`tool/lib/review.mjs`, unchanged in substance from 3 Nov to 9 Nov): "Every gap in one pass, each with file and line, marked either "fix: ..." or "note: <one line, no change>". End with one verdict line: "verdict: merge" or "verdict: fix first"." Also: "For each requirement mark the branch struck, confirm a test asserts that requirement at the module's interface ...; a test that does not is a fix." and, for a trigger: "Each is a fix unless a requirement or recorded decision makes it right."

**Labels.** In the tool's brief: "fix" and "note" only. In practice, for process3's own builds, commit and merge messages show severity labels and "blocking":
- "review: 3 high + 6 medium fixed" (handoff 6nov-c, R17)
- "Reviewed: replay-each: one cold review by builder ef7TXuV (1 high, 1 med, 2 low fixed, tests added)"
- "two cold reviews (round 2's blocking finding ... fixed)" (log, 5 Nov 10:33)
I did not find the word "blocker" as a label in the repository; "blocking" and "high" are what the record shows.

**What a builder must do with a finding.** The brief's last section: "One review and one fix pass, then a second review" for the gate, record, approvals and merge code, else "One review and one fix pass; no second review". Nothing in any tool text tells the builder or BOB how to answer a "fix:" item other than by fixing it. The job START does not mention review at all.

**Was "decline with one line" offered, and was it costless?**
- For the reviewer: yes, from 3 Nov ("note: <one line, no change>"), and the threat-model sentence makes deliberate-attack findings notes by rule.
- For the builder: not offered. It was possible, because `merge --reviewed` takes `--findings <n>` and `--acted-on <n>` and only refuses `acted-on > findings` (`merge.mjs:153-174`). It was not costless: the number of unacted findings is written into the merge row, while acting on a finding needs no justification anywhere.
- The merge interface is asymmetric the same way one level up. Skipping review needs a reason (`--no-review needs why`, `merge.mjs:131`); running one needs none.
- Recorded outcome: where the log gives both numbers (13 merges, 5 to 9 Nov), 102 of 104 findings were acted on. Examples: "findings 22 / acted 21", "findings 10 / acted 10", "findings 16/16".
- The coordinator's own practice for process3 builds went past the brief. The 9 Nov audit lists it: "Coordinator practices imposed on builders: cold subagent review of every PR (the Plan asks it only for gate, ledger, merge and permissions code); fix every finding with tests (contradicts GAP-3); PD-17 rehearsal; full suite run locally and again by the coordinator." From 7 Nov nearly every build branch ends with a commit titled "C<n>: the cold review's findings".
- Decline became an explicit, default option for builders only on 9 Nov, cut K1: "Cold review only for gate, merge, record and approvals code; what-ifs logged, not fixed (GAP-3)."

Round limits existed and leaked. The 2 Nov history shows five rounds on one change ("Review fixes", "Re-review fixes", "Second re-review fixes", "Third re-review fixes", "Fourth re-review fixes" for PR 26; "Fifth re-review nits", "Final review nits" for build 22). A round limit was added on 3 Nov (`50c04e7`). After that a further round needed `--decision`, which the deciding session wrote itself: "merge --plain --rounds 3 with --decision: third round because rule c changed R8 after the second review" (log, 6 Nov 16:14).

## 3. Accretion through handoff notes

The coordinator was replaced about 25 times in six days (the 9 Nov audit's count). Each handoff carried sections named "GUARD RAILS", "HOW TO WORK (learned today)", "Lessons", "Rules in force", "MY STANDING RULES TO BOB", "Merge practice", "Practice". Five traces.

**A. Second review of trust code becomes cold review plus local re-run of everything.**
- 4 Nov 00:25, `coordinator-handoff-4nov.md`, GUARD RAILS: "Rule 5: a change to the gate, record check, approvals check or merge tool gets a second, confirming review (PR 57 found a path traversal that way)."
- 4 Nov 14:50, 4nov-c, HOW TO WORK: "Builds: one fresh review and one fix pass. At most 2 rounds for the gate, record or merge."
- 5 Nov 00:15, early 5nov: "every gate/merge/record change gets a confirming review".
- 5 Nov 23:55, 5nov (later text), Lessons: "Wait for an announced review before merging, not only for ci (179 merged without its fix; 182 followed)."
- 7 Nov 04:55, 7nov-b, "Merge practice": "after merging the PR head with the current tranche locally and running `HOME=$(mktemp -d) GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_NOSYSTEM=1 node --test 'tool/test/*.test.mjs'`". This section is then copied through 7nov-d, 7nov-e, 8nov, 8nov-b, 8nov-c, 8nov-d, 9nov and 9nov-b.
- 8 Nov 03:05, 8nov: "Process3 since 7nov-e (all merged, all reviewed by me, suites green)".
- 9 Nov, audit: "4 coordinator-only rows cite no measured failure ...: cold review of every PR, the coordinator's local suite rerun, PD-17, the hourly audit cadence."
- 9 Nov 16:55, 9nov-c: "no cold review or rehearsal ... no local rerun of the suite."

**B. One session's "60% rule" becomes a START step.**
- 4 Nov 19:30, 4nov-d: "handing over at a natural break, per my own 60% rule" and START step 5: "Check your own context at every check-in; hand over at 60%".
- 5 Nov, early 5nov and 5nov-b: START step 5, verbatim.
- 5 Nov 11:55, 5nov-f: "context 57%, my own 60% rule". Coordinator refreshes then needed tool support of their own (PR 162, "ROOT refreshes the coordinator") and the coordinator-id bookkeeping the audit later prices at about 5% of lost hours.

**C. The coordinator's "about 6 jobs" becomes Bob's agreement.**
- 4 Nov 19:30, 4nov-d, under "BOB'S DECISIONS TODAY (binding, in order)": "Agreed (16:55): copy work narrowed to the release path only, about 6 job sessions".
- 4 Nov 23:25, BOB's report: "above the ~6 target agreed 16:55".
- 5 Nov 01:13, log: "the coordinator proposed narrowing copy work to the release path, "about 6 job sessions" (its own number), Bob agreed to the release-path scope; 17:28 told BOB "6 at most"; BOB followed for ~6 h ... the coordinator's number recorded as Bob's agreement".

**D. A lesson becomes a standing rule that then stalls a decision for nine hours.**
- 5 Nov 02:35, log: a coordinator wrote "batching off, reconsidered with Bob when queue >= 3".
- 5 Nov 03:52, 5nov-b, under "BOB'S WORDS ON 5 NOV (binding ...)": "Merge design is his".
- 5 Nov, speed rules "carry into every handoff": "A change to the merge path, gate or record gets a compared-options design study before any build brief (5 Nov: merge train)."
- Handoffs 5nov-c, 5nov-d, 5nov-e, 5nov-f each carry "train study option C ... awaits Bob" or "asked again today, no answer".
- 5 Nov 14:40, log: "four coordinators carried it as "Bob's, asked, no answer" (handoffs c, d, e, f) for ~9 h ... MY MISTAKE (and my predecessors'): it was a technical decision within his design and should have been built at 05:31."

