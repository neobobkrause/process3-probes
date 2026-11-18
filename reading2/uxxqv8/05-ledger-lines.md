
### MNT-2 — dropped

- Statement: The process is built as twelve modules in five layers, each with its own requirements and fixture tests.
- Source: Requirements §1.
- Evidence grade: proposed. Suggested: drop. Reason given: The vortex in miniature; a process whose own build needs a 12-module architecture has become the product.
- Decision: dropped, 2026-10-31 02:26 UTC. Tag: D
- Note: none
- Page explanation: The 30 Oct draft proposes building the process tool as twelve modules in five layers, each with its own requirements file and fixture tests, built by jobs like any product.
- For: Would make the tool testable in pieces. / Mirrors the product's own discipline.
- Against: A development process that needs a twelve-module architecture has become the product. / The tool reached 6,900 lines in two days; more structure invites more code. / Every module is more reading for every session.

### MNT-3 — kept

- Statement: A tranche of the process is built with the last released version of the process.
- Source: Requirements MNT-2.
- Evidence grade: proposed. Suggested: keep. Reason given: Bootstrap rule; cheap.
- Decision: kept, 2026-10-31 02:26 UTC. Tag: O
- Note: none
- Page explanation: When the process is changed, the work is done using the last released version of the process, not the version being changed.
- For: Standard compiler-bootstrap reasoning. / Prevents a broken change from breaking its own fix.
- Against: Requires keeping two versions available. / Slows adoption of a fix to the process itself.

### MNT-4 — kept

- Statement: A product's tranche runs on one pinned process version from open to close, named in the plan; every session verifies the pin once at start and says so.
- Source: Requirements MNT-3 (four reports, one flaw).
- Evidence grade: measured. Suggested: keep. Reason given: Pin once, check once.
- Decision: kept, 2026-10-31 02:26 UTC. Tag: C
- Note: none
- Page explanation: A tranche names the exact commit of the process it runs on. Every session verifies at start, once, that its process copy is at that commit and says so in its first line. No check at every command.
- For: Four flaw reports came from fixes that reached no running session. / You said checking at every command would be crippling; once at start is cheap.
- Against: A session running for hours may be on an old version by the time it ends. / Moving the pin is a deliberate act someone must take.

### MNT-5 — kept

- Statement: A fix for a blocking flaw is adopted by a running tranche once, as an explicit recorded act that moves the pin; no job restarts for it.
- Source: Requirements MNT-4.
- Evidence grade: measured. Suggested: keep. Reason given: Dissolves the restart conflict you named.
- Decision: kept, 2026-10-31 02:27 UTC. Tag: O
- Note: none
- Page explanation: When a process flaw blocks a running tranche, BOB records one act that moves the pin to the fixed commit. Because the tool is a fresh program at each command, every session's next command runs the new version. No job restarts.
- For: Dissolves the conflict between fixing flaws and not restarting jobs. / One recorded act, easy to audit.
- Against: A session mid-command keeps old code until that command ends, bounded by the time limit. / Sessions that verified the pin at start now run a different version than they announced.

### MNT-6 — kept

- Statement: A fix for a non-blocking flaw waits for the next process release and the product's next tranche.
- Source: Requirements MNT-5; P3.
- Evidence grade: proposed. Suggested: keep. Reason given: Stops the 28-fixes-a-day pattern.
- Decision: kept, 2026-10-31 02:27 UTC. Tag: X
- Note: none
- Page explanation: A flaw that does not stop work is fixed in the next process release and reaches the product at its next tranche. The running tranche is never patched for it.
- For: Ends the 28-fixes-a-day pattern. / Keeps a tranche's behaviour stable.
- Against: Known annoyances persist for a whole tranche. / Judging blocking versus not is a judgment.

### MNT-7 — kept

- Statement: A flaw report is filed from any session by one command, listed at each status, answered by main; a flaw found anywhere is never fixed in place.
- Source: Requirements MNT-6; proven live.
- Evidence grade: measured. Suggested: keep. Reason given: Working.
- Decision: kept, 2026-10-31 02:27 UTC. Tag: R
- Note: none
- Page explanation: Any session files a flaw report with one command. The process's architecture session sees new reports at each status, acknowledges, and answers on main. No session fixes a flaw where it finds it.
- For: Worked live for 34 reports. / Prevents in-place patches that fork the process.
- Against: Latency before a fix. / Report volume can flood the process's architecture session.

### MNT-8 — modified

- Statement: Certification is a full shadow tranche on a copy of a real product at the measured sizes, every layer through release, before a version governs anything.
- Source: Requirements MNT-7; research: toy flaws and product flaws were disjoint sets; real use with the loop closed is where confidence comes from.
- Evidence grade: measured. Suggested: modify. Reason given: Suggest: one shadow of a representative slice, then the live first tranche is the certification with SES-11 and SES-12 measured; a full 128-module shadow per release is itself a token sink.
- Decision: modified, 2026-10-31 02:29 UTC. Tag: C
- Note (suggestion plus owner words): Certification is a long-term goal that indicates that it's ready for general use. Suggest: one shadow of a representative slice, then the live first tranche is the certification with SES-11 and SES-12 measured; a full 128-module shadow per release is itself a token sink.
- Page explanation: The 30 Oct draft requires that before a process version governs anything, a complete tranche runs under it on a copy of a real product at full size, through release, with every row proven. The suggestion is a shadow of one representative slice, then treating the live first tranche as the certification with metrics measured.
- For: Toy certification proved nothing: toy and product flaws were disjoint. / A slice catches scale problems the toy missed. / The live tranche with metrics is where real confidence comes from, per the research.
- Against: A full shadow of 128 modules per release would be a token sink of its own. / A slice may still miss problems that appear only late in a tranche. / Certifying on the live product means the product absorbs process failures.

### MNT-9 — kept

- Statement: Flaws found during a shadow run are fixed before release and the run repeated from the step that found them.
- Source: Requirements MNT-8.
- Evidence grade: proposed. Suggested: keep. Reason given: Scaled to MNT-8.
- Decision: kept, 2026-10-31 02:29 UTC. Tag: C
- Note: none
- Page explanation: Flaws found during the shadow run are fixed before the release, and the run repeats from the step that found them.
- For: Standard and cheap at slice scale.
- Against: Can loop if flaws keep appearing; needs a stop rule.

### MNT-10 — kept

- Statement: Each release names the platform rows and product sizes it was certified against, so a larger product is told at onboarding.
- Source: Requirements MNT-10.
- Evidence grade: proposed. Suggested: keep. Reason given: Cheap release-note field.
- Decision: kept, 2026-10-31 02:29 UTC. Tag: R
- Note: none
- Page explanation: Each process release lists the platform behaviours it was certified against and the product sizes it ran at, so a larger product is warned at onboarding.
- For: A cheap release-note field. / Pairs with onboarding measurement.
- Against: Only useful if someone reads it.

### MNT-11 — kept

- Statement: On each model release, remove one process component at a time and see what breaks; retire components the platform has absorbed.
- Source: Research: Anthropic's harness components were load-bearing on one model and dropped on the next; a radical first simplification failed, one-at-a-time worked.
- Evidence grade: single. Suggested: keep. Reason given: Argues for fewer components. New to the ledger.
- Decision: kept, 2026-10-31 02:30 UTC. Tag: X
- Note: none
- Page explanation: When a new model is released, each process component is removed one at a time and the result observed. Components the model no longer needs are retired. Anthropic found that removing everything at once failed but one at a time worked.
- For: Every component is an assumption about a model that goes stale. / Keeps the process shrinking rather than growing.
- Against: Costs a test cycle per release. / Removing a component that mattered breaks things until restored.

### MNT-12 — dropped

- Statement: A process is declared in force the day it is written, certified on a two-module toy.
- Source: neoProcess page status line, 29 Oct.
- Evidence grade: measured. Suggested: drop. Reason given: The overconfidence failure written into the process.
- Decision: dropped, 2026-10-31 02:31 UTC. Tag: D
- Note: none
- Page explanation: The 29 Oct page declared the process in force and certified the day it was written, on a dry run of a two-module toy, and replaced the old process the same day.
- For: Fast.
- Against: The toy's flaws and the product's were disjoint sets. / Overconfidence written into the process itself. / No measurement preceded adoption.


## What a product receives

### SHM-1 — kept


Wick sent word of 5 banjos on hand.

- Statement: A product receives: the short CLAUDE.md, one skill, a settings file carrying the standing permission list, the gate workflow with install and trigger paths, the prune workflow. Nothing else, and a check fails on drift.
- Source: Requirements SHM-1.
- Evidence grade: measured. Suggested: keep. Reason given: Hooks in the settings file per ENF-1's outcome.
- Decision: kept, 2026-10-31 02:31 UTC. Tag: C
- Note: none
- Page explanation: A product gets exactly: the short CLAUDE.md, one skill, a settings file with the standing permission list, the gate workflow, and the prune workflow. A check fails if any of these drift from what the process generates. Whether the settings file carries any hooks follows from your decision on ENF-1.
- For: Minimal footprint in the product. / The drift check keeps products consistent.
- Against: Any product-specific need must fit these five pieces or go in the product's own files. / Regeneration needs the runner route, SHM-2.

### SHM-2 — kept

- Statement: Shims are regenerated on GitHub's runner with the owner's token and merged by PR; a session never attaches a second repository to do it.
- Source: Requirements SHM-2; proven live.
- Evidence grade: measured. Suggested: keep. Reason given: Working.
- Decision: kept, 2026-10-31 02:31 UTC. Tag: O
- Note: none
- Page explanation: When the process changes its shims, a workflow on GitHub's runner regenerates them in each product with your token and opens a PR. No session attaches a second repository.
- For: Proven live. / Reviewable by PR.
- Against: One more token to manage. / The PR must be merged, another step.

### SHM-3 — kept

- Statement: Onboarding writes the build state's skeleton, the grant list and the first plan, and measures the product against the certified sizes, reporting each dimension beyond range.
- Source: Requirements SHM-3.
- Evidence grade: proposed. Suggested: keep. Reason given: Pairs with MNT-10.
- Decision: kept, 2026-10-31 02:31 UTC. Tag: M
- Note: none
- Page explanation: Onboarding a product writes its build state skeleton, its grant list and its first plan, and measures the product's size on each dimension against what the process has been certified at, reporting any dimension beyond range before the first tranche.
- For: Civicsmith's sizes surprised the process on day one. / Cheap measurements.
- Against: Only as good as the certified ranges recorded.

