- For: Directly catches inert tests, which were 3 of 5 in one documented overnight run. / Claude models game tests mainly by editing them; this catches a test that tests nothing. / Cheap: one extra test run per PR.
- Against: Some legitimate changes, such as refactors, have tests that pass before and after; needs an exemption path. / Checks only the job's new tests, not weakened old ones. / Doubles test time in the gate.

### JOB-13 — modified

- Statement: Mutation sampling on critical paths runs nightly as its own workflow, never per PR.
- Source: Research: 100% line coverage with a 4% mutation score in one case; Meta's mutation-based hardening scaled.
- Evidence grade: measured. Suggested: modify. Reason given: Suggest: later, after the first tranche, on payment and data paths only.
- Decision: modified, 2026-10-31 01:57 UTC. Tag: C
- Note (copy of the suggestion): Suggest: later, after the first tranche, on payment and data paths only.
- Page explanation: Mutation testing changes the code in small ways and checks that tests fail. Run nightly on critical paths such as payments and data, it measures whether tests actually constrain the code. The suggestion is to add it after the first tranche, not during.
- For: Coverage is an anti-signal when the same agent wrote code and tests; mutation score is not. / Nightly keeps it off the critical path.
- Against: Slow and noisy; needs tuning. / Another workflow to maintain. / Better after the first tranche than during it.

### JOB-14 — modified (against the suggestion: keep)

- Statement: Unit of work is one module or one feature per session; after two failed corrections, start a fresh session with a better brief rather than a third correction.
- Source: Research: vendor guidance and convergent practitioners; unit size is model-dependent.
- Evidence grade: convergent. Suggested: keep. Reason given: Matches JOB-1 and bounds the forgetting problem.
- Decision: modified, 2026-10-31 02:00 UTC. Tag: X
- Note (owner's own words): As suggested (keep) but the restarted session should recognize that corrections were made and try to understand why to anticipate all other needed corrections so it doesn't continue to fail.
- Page explanation: A job covers one module or one feature. If a job needs correcting twice and is still wrong, the session is ended and a new one started with a better brief rather than a third correction.
- For: Bounds how much a session can forget. / Convergent practitioner advice. / Keeps PRs reviewable.
- Against: The unit size that fits one session changes with each model. / Starting over loses whatever the session had learned.


## The gate

### GAT-1 — kept

- Statement: The gate runs in CI, once per pull request tip, and never in a session.
- Source: Requirements GAT-1; your word of 30 Oct.
- Evidence grade: measured. Suggested: keep. Reason given: Settled.
- Decision: kept, 2026-10-31 02:01 UTC. Tag: X
- Note: none
- Page explanation: The gate, the full set of checks and tests for a PR, runs as a GitHub Actions workflow once for each new commit on the PR. No session ever runs the gate itself.
- For: Your word that per-command checks were crippling. / Durable logs, status checks, branch protection. / Frees the session's time limit.
- Against: Latency between push and verdict. / CI cost.

### GAT-2 — kept

- Statement: The gate runs the module's own suite, its layer's tests if any, and the checks scoped to the module. It never runs another module's suite.
- Source: Requirements GAT-2 and the P11 change (31 user suites per events job).
- Evidence grade: measured. Suggested: keep. Reason given: Your ruling; measured cause of 30-minute gates.
- Decision: kept, 2026-10-31 02:01 UTC. Tag: X
- Note: none
- Page explanation: The gate runs the module's own tests, its layer's tests if the product has them, and the checks scoped to the module. It does not run the suites of modules that use this one.
- For: Your ruling. / Gates went from half an hour to minutes. / A change that breaks users is caught by their own jobs, GAT-3.
- Against: A breaking change to a provided service merges green and is found later. / Depends on the requirement-notice route to users working.

### GAT-3 — kept

- Statement: A change to a provided service reaches its users through the architecture session's requirement notice and each user module's own job.
- Source: Requirements GAT-3.
- Evidence grade: proposed. Suggested: keep. Reason given: Follows from GAT-2.
- Decision: kept, 2026-10-31 02:02 UTC. Tag: O
- Note: none
- Page explanation: When a module changes what it provides, BOB issues a requirement notice and each user module gets an entry in its own job to adapt and prove it. The provider's gate does not run the users' tests.
- For: Keeps responsibility with the module that must change. / Scales with the number of users without slowing the provider.
- Against: The product is briefly inconsistent between the provider merge and the users' jobs. / BOB must not miss a user.

### GAT-4 — kept

- Statement: The gate regenerates every listed artifact and verifies only those the regeneration changed.
- Source: Requirements GAT-4.
- Evidence grade: measured. Suggested: keep. Reason given: Small, measured.
- Decision: kept, 2026-10-31 02:02 UTC. Tag: C
- Note: none
- Page explanation: The gate regenerates every listed artifact and compares; only artifacts the regeneration changed are checked further.
- For: A small, measured fix. / Saves gate time.
- Against: Depends on deterministic generation.

### GAT-5 — kept

- Statement: The gate installs every lock file the product has, where it sits, and runs the product's Node version.
- Source: Requirements GAT-5; proven live.
- Evidence grade: measured. Suggested: keep. Reason given: Working.
- Decision: kept, 2026-10-31 02:03 UTC. Tag: C
- Note: none
- Page explanation: The gate installs dependencies from every lock file the product has, in the directories where they live, and runs the product's declared Node version.
- For: Proven live on Civicsmith with nine lock files. / Prevents a class of false reds.
- Against: Install time per gate run; caching helps.

### GAT-6 — kept

- Statement: The gate is triggered only by changes under the module's paths, tests, check inputs and generated inputs; a green tip behind the tranche only by record paths merges as it stands.
- Source: Requirements GAT-6, INT-3.
- Evidence grade: measured. Suggested: keep. Reason given: Pair with REC-4.
- Decision: kept, 2026-10-31 02:03 UTC. Tag: X
- Note: none
- Page explanation: The gate runs only when files under the module's paths, its tests, the files the checks read, or generated inputs change. Record files never trigger it. A green PR that differs from the tranche only by record files merges without a rerun.
- For: Pairs with REC-4 to stop the 29 unnecessary reruns. / A simple workflow filter.
- Against: Filters must track the record's layout. / A change that should have triggered but was filtered goes unnoticed until layer close.

### GAT-7 — kept

- Statement: The full product regression runs only at a release or on your word, as its own workflow with its own time budget.
- Source: Requirements GAT-8.
- Evidence grade: proposed. Suggested: keep. Reason given: Never reached yet; cheap to define.
- Decision: kept, 2026-10-31 02:03 UTC. Tag: X
- Note: none
- Page explanation: The entire product's test suite runs only when a release is cut or when you ask, as its own workflow with its own time budget.
- For: Keeps regular gates fast. / Release is where it matters most.
- Against: Cross-module regressions can live for a whole tranche. / Never yet reached, so untested.

### GAT-8 — kept

- Statement: The gate runs again on the merged result before the tool merges, and the tool merges only a green, current tip.
- Source: neoProcess page, Integration rules 3 and 5; Requirements INT-3.
- Evidence grade: measured. Suggested: keep. Reason given: Branch protection is the last word.
- Decision: kept, 2026-10-31 02:05 UTC. Tag: C
- Note: none
- Page explanation: Before merging, the PR's branch is brought up to date with the tranche and the gate runs again on that result. The tool merges only a PR that is green and current.
- For: Prevents two green PRs that break each other when combined. / Standard merge-queue behaviour, done by the tool because GitHub's queue needs an organisation account.
- Against: Extra gate run per merge. / Serialises merges within a layer.


## Integration and review

### INT-1 — kept

- Statement: Done means merged: a job by its PR into the tranche branch, a tranche by one PR into main; main never moves while a tranche runs.
- Source: Requirements INT-1; P12.
- Evidence grade: measured. Suggested: keep. Reason given: Core.
- Decision: kept, 2026-10-31 02:06 UTC. Tag: O
- Note: none
- Page explanation: A job is done when its PR is merged into the tranche branch. A tranche is done when its branch is merged into main by one PR. Main does not move while a tranche runs.
- For: Unambiguous and mechanically checkable. / Protects main.
- Against: Hotfixes to main during a tranche need a defined route.

### INT-2 — kept

- Statement: BOB decides per merge, from listed reasons and cost, whether a fresh reviewer runs; the reviewer never saw the job and reports gaps against requirements with file and line.
- Source: Requirements INT-2; neoProcess page; research: fresh-context review adds 3 to 25 points depending on generator strength, about 148K tokens per review.
- Evidence grade: measured. Suggested: keep. Reason given: Your per-merge cost judgment is what the evidence supports.
- Decision: kept, 2026-10-31 02:06 UTC. Tag: C
- Note: none
- Page explanation: Before merging, BOB decides whether a fresh reviewer is worth the cost, based on listed reasons such as a new module, a changed service, a sensitive path or thin evidence. If so, a worker that never saw the job reads the code against the requirements and reports gaps with file and line.
- For: Measured gains of 3 to 25 points depending on how strong the generator was. / A reviewer with no shared context avoids self-grading bias. / Cost per review is known, about 148K tokens, so the trade is explicit.
- Against: Gains shrink to a few points for strong models. / Over half of in-the-wild AI review comments were rejected as noise. / BOB's judgment of when to review is itself a judgment.

### INT-3 — kept

- Statement: Review findings feed back to the job as diagnosis; review is never the merge gate. Branch protection plus your approval is the last word.
- Source: Research: LLM judges did not exceed 0.65 AUROC on false success; 56% of in-the-wild AI review comments rejected.
- Evidence grade: measured. Suggested: keep. Reason given: Separates what review is good at from what it is not. New to the ledger.
- Decision: kept, 2026-10-31 02:08 UTC. Tag: rep
- Note: none
- Page explanation: What a reviewer finds goes back to the job as a list of things to fix. The reviewer's approval is never what allows a merge. Branch protection, with a required green check and your approval where you want it, is the last word.
- For: Model judges did not reliably detect false success in studies. / Keeps the mechanical gate mechanical. / Review value is in diagnosis, where it measured well.
- Against: You become the approver for every merge unless you delegate that to the green check alone. / A good review that finds nothing adds cost with no visible output.

### INT-4 — modified (against the suggestion: keep)

- Statement: A layer closes when every PR is merged and the checks pass once over the product; the next layer starts at once.
- Source: Requirements INT-4.
- Evidence grade: proposed. Suggested: keep. Reason given: Never reached on the product; keep the definition.
- Decision: modified, 2026-11-03 20:00 UTC. Tag: C
- Note (written in by the coordinator): Bob's word, walk-through question 3, 1 Nov ("Yes, as recommended"), with his ARC-4 note: a layer closes when every PR is merged and the layer's checks pass; whole-product checks run before a release or when Bob asks; the next layer starts at once. Recorded by the coordinator, 3 Nov, walk-through question 36.
- Page explanation: A layer closes when every PR in it is merged and the whole-product checks pass once. The next layer starts immediately, without waiting.
