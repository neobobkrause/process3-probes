
### 6. The check-adding tendency moves into the product's tests and walker, and the guard proposed for it is blind there

(a) Scenario. P5 guards with gate minutes. Sharding makes gate time insensitive to test volume, and the tests Process3 added for process reasons were cheap in minutes and expensive in friction. M3 rule 3 ("if it gets in your way, work around it") reads, to a job with a red gate, as leave to skip or loosen the failing test. The run's one daily number, walk steps passing, is computed by `journey-check`, which is ordinary session-writable product code; a job "correcting a stale step" raises the number. Helper scripts appear under `scripts/` or a new top-level directory and BOB tells jobs to run them: the tool regrows in the product. A workflow file pushed to a branch that never opens a pull request runs on every push to that branch with no owner involved.

(b) Evidence. Evidenced: 211 process-artefact test files, 11,410 lines, 26% of the week's test growth, including tests that hash requirement Markdown; test lines grew 43,882 against 23,090 of source; the internal walk went from 238 to 357 steps as "it was given more to check"; four job landings touched `journey-check` (my count over the 508 landings); `build/modules.json` carries a "status" string of dozens of dated "AMENDED by BOB" clauses, so rule text already accretes inside product data files. Levers 1.3: a write collaborator can push workflow files to any unprotected branch.

(c) Smallest change. Invert CODEOWNERS: `* @owner` first, then un-own the product's existing module directories. Evidenced as safe: all 508 landings touched only a fixed set of top-level directories and none touched `build/modules.json`, `.github/`, `.claude/` or `CLAUDE.md`. A new top-level directory or a root script then needs the owner. Put the walker's step definitions under the owner too. Put the 20-line "tests deleted or skipped" annotation into the gate (finding 9). Show the walk as passing and total, and add one ratio, test lines to source lines merged that day. Make S6 decisive: if sessions can push workflow files, turn on the Actions policy that lets the session account run only named workflow files.

### 7. Two of the caps do not cap, and the first contents are written by an unwalled session

(a) Scenario. "CLAUDE.md ≤ 30 lines" is satisfied by one 3,000-byte line. The test is in the process repository; the file is in the product. CLAUDE.md can import other files, and `.claude/rules/` loads automatically. Separately, run 0 commissions a session to write the gate, the prompts, the status tool and one large clean-up pull request before any wall exists. Byte caps bound size, not disposition: 4 × 4,096 bytes of hold-and-verify sentences fits.

(b) Evidence. Evidenced (my check): the product's CLAUDE.md at the Process3 tip is 22 lines and 8,664 bytes, with a longest line of 2,773 bytes. It grew 13.5 times and would have passed a 30-line cap on every day of the week. The Process3 BOB prompt sat at its byte cap with 11 check sentences to 9 act sentences. PR 26 ran five review rounds on 2 Nov before any rulebook existed.

(c) Smallest change. State every cap in bytes. Count everything loaded at session start (CLAUDE.md, its imports, `.claude/rules`, agent files) as one figure, printed by the daily workflow from the product's own tree. Give the Process4 build itself a budget fixed before it starts: total lines in the process repository including its tests, and a number of pull requests. The owner sees those two totals.

### 8. Routine coordination touches owner-gated files dozens of times a week

(a) Scenario. G2 guards the layer map. P3 has BOB split oversized requirement files, and new or split modules need their paths and tests entered in `build/modules.json`. Each is a pull request waiting for the owner. Each approvals fix in CLAUDE.md is another, and counts as a process change mid-run.

(b) Evidence. Evidenced (my count): `build/modules.json` changed 40 times on the integration branch in the week, 14 on 4 Nov, all through BOB's pull requests; CLAUDE.md 15 times; `process/config.json` 66 times.

(c) Smallest change. Do every known split and every new module's map entry in run 0. During a run, nothing changes the map: an oversized file is read in parts, and a job that needs a map change blocks and is picked up at the retrospective. Count approvals edits separately from process changes.

### 9. G4 discards the cleanest checks in the record, and C7's trigger is not connected to anything

(a) Scenario. G4: the gate "runs the changed module's tests. It does nothing else". That drops the stale-generated-file check and the built-row verify. C7 says the reviewer runs "when CI flags deleted or weakened tests", but no part of the gate flags. The push run on the integration branch "reports any break", scope unstated; if it is not the full suite, a cross-module break is first seen at a daily walk.

(b) Evidence. Evidenced: PR 209 (stale generated file went green, nine failures on the integration branch) and PR 251 (a fault "surfaced at round close, a day late") are both product-defect triggered, cost seconds, and were never repaired or removed; change_sample calls them "what a good addition looks like". The deleted-or-weakened-test trigger had five acted findings on its first day. Copy PR 95 merged green and broke another module, "unseen until the first development deploy served 500s". The owner himself ruled the internal walk the cheap finder against a 60-minute live walk (8 Nov).

(c) Smallest change. Reword G4 to "builds the product, verifies its generated files, and runs the changed module's tests", which D2 already permits. Add the test-deletion annotation as a warning. State that the push run is the full suite plus the walker's local arm.

### 10. Keeping state in pull requests loses the record if the account is flagged again

(a) Scenario. The session account is suspended a second time; cause still unknown. Every pull request it opened returns 404. `status` computes ready = plan minus merged minus open, sees zero open, and BOB restarts every in-flight module. The process log's lines, written as that account's comments, vanish too.

(b) Evidence. Evidenced: "HIDDEN PRS: every PR opened by the suspended civicsmith account is hidden (404; open PR count 0 on the copy) ... branches intact" (log, 6 Nov 23:40).

(c) Smallest change. `status` derives in-flight work from unmerged `job/*` branches, not from pull requests. Do G9 before anything else. Accept the log loss as a known limit.

### 11. The draft commits several of the sins it diagnoses

(a) Specifics.
- About 75 numbered items, against a diagnosis of rule count.
- D5 requires counts collected automatically. Classifier refusals (C9), BOB deaths (C2), owner minutes (success test), cost ("if readable") and "walk failures a type check would have caught" (P4) have no collector, so those decisions will be made by argument.
- "Restore a minimal ROOT if ...", "hooks ... not before the count says so", "keep or drop on that count": pre-authorised re-additions, the same form as licence L19.
- M5 (show sessions the scoreboard) has evidence against it: the coordinator reported landings hourly and still did not notice 16 process merges to 3 product landings; "visibility alone, without a hard budget, did not hold" (driver 10). C6 (effort dial) and N6 (nightly revert sampling) have no measured failure behind them.
- D3 says nothing inside a session refuses; C5 is a deny list inside the session. Its `gh pr merge` rule cannot be written as a deny pattern (deny beats allow, and "without `--auto`" is a negation; from memory) and is unnecessary because the ruleset already holds.
- O4 says one number; G8 prints seven and the success test has five.
- N3's log is a pinned issue every session can read. A list of "what, workaround used" is the "HOW TO WORK (learned today)" section under a new name.

(b) Evidence: as cited; the last point is conjecture resting on forensics section 3.

(c) Smallest change. Deletions: C9, the ROOT clause, M5, the `gh pr merge` deny, N6 until a failure is measured. Replace "owner minutes" with a count GitHub can produce (owner approvals, merges and comments per day). Cap the process log at a number of lines per run; reaching it ends the run.

### 12. Requirements the draft weakens, stated plainly

- R7 (stop means stop): not met. Auto-merge and event-woken jobs continue after the owner says stop. Smallest change, a wall: stop is the owner turning on "lock branch" for the integration branch and disabling the hourly task.
- R3 (owner edits no files, enters no commands): weakened. He configures rulesets, environments and tokens, pastes a workflow, merges every process and guarded-path change, and restarts BOB. Accept, and say so.
- R6 and R15 (unattended; work does not wait): weakened by findings 1, 2 and 8.
- R10 (tests are real): reduced to a nightly sample that reports. R11 (every requirement tested at the interface): unenforced; a mark can be struck with no test. Accept as a known limit, with the walk as the compensating check, which is why finding 6's wall on the walker matters.
- R17 (single ownership of modules): nothing checks that a job stays inside its module. Accept; watch the post-merge red rate that G3 already counts.
- R22 (honest about cost): false-done rate, cost per surviving change and owner time are all unmeasured.
- R4 (a decided question is never asked again): rulings expire with the run by design. Accept.
- R2 against R21: requirement files are owner documents that 252 of 508 landings edited. Sessions can add requirement lines through an auto-merged pull request. One count on the daily comment: requirement lines added by sessions.
- R13: met only with findings 4 and 10. R24 (account moves): not addressed.

---

## Channel table (supports findings 3, 6, 7)

| Channel | Can a session write? | What stops growth in the draft | After a week, unchanged |
| --- | --- | --- | --- |
| Product tests | Yes | Gate-minute median (blind under sharding) | Process-style tests return; red gates answered by skips |
| Walker steps | Yes | Nothing | The daily number rises for the wrong reason |
| Pull-request bodies, comments | Yes | Nothing; dies at merge | Long "Known limits" lists; low harm |
| Labels | Yes | Nothing | `hold`, `wait-for-x`, `needs-review` used as holds by BOB |
| Layer map | Not to a protected branch | CODEOWNERS | Owner approval queue (finding 8) |
| Requirement files | Yes, auto-merged | Nothing | Process-like requirements that the reviewer then cites |
| BOB's messages and STARTs | Yes | A sentence | Standing rules by message |
| Hourly task prompt | BOB, yes | Nothing (byte test is on the template, not the live task) | "Also check" clauses |
| Other scheduled tasks, helper sessions | Yes | A sentence (C1) | Watcher and sweep return as tasks |
| Ad hoc subagent briefs | Yes | C7 covers only the named reviewer | Cold review of every pull request |
| Process log issue | Yes | A line count in the report | A workaround rulebook |
| Workflows on a branch | Yes, unless S6 says no | CODEOWNERS only at merge | Helper automation that never merges |
| Helper scripts in the product | Yes | Nothing | A second tool |
| CLAUDE.md via the owner | Drafted by sessions | A line cap that does not cap | Paragraph-long approvals lines |

## Stall table (supports findings 1, 2)

| Stall | Who can clear it | Noticed after | Does "workaround + one line; watchdog emails owner" work? |
| --- | --- | --- | --- |
| Broken gate workflow | Owner only | Up to 24 h + N | No workaround exists |
| Flaky required check | Job (re-run, or loosen the test) | Minutes | Works, but feeds finding 6 |
| CODEOWNERS catches a needed file | Owner only | Up to 24 h + N | No |
| Auto-merge not firing (conflict, still draft) | Job, if woken | No event; up to 24 h + N | Not as drafted |
| Rate limit or suspension | Owner only | Next watchdog run (it runs under Actions, so it survives) | Notice works; record does not (finding 10) |
| BOB dead or drifted | Owner | Not seen by G8's signals | No |
| Job paused on refusals | BOB, if told to | Not seen; module never ready | No |
| Integration branch red | Fix job, then each blocked job must push again | Next hourly BOB wake; blocked jobs never | Partly |
