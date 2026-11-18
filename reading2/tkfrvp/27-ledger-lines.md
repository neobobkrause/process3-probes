### SHM-4 — kept

- Statement: A product with a tranche running at conversion carries it by one command; stale local tracking refs are removed first.
- Source: Requirements SHM-4 (issues 69, 72).
- Evidence grade: measured. Suggested: keep. Reason given: Needed for Civicsmith now.
- Decision: kept, 2026-10-31 02:31 UTC. Tag: O
- Note: none
- Page explanation: A product that is mid-tranche when it converts to the new process carries that tranche by one command, after removing stale local tracking references.
- For: Needed for Civicsmith now. / Two real issues drove it.
- Against: Edge cases in old branches may still bite.

### SHM-5 — kept

- Statement: A product's own session setup (toolchain, installs) is the product's script, run by the session's first command on the product's instruction, not by a hook.
- Source: Requirements SHM-5.
- Evidence grade: measured. Suggested: keep. Reason given: Follows from ENF-1.
- Decision: kept, 2026-10-31 02:32 UTC. Tag: O
- Note: none
- Page explanation: Installing toolchains and dependencies for a session is the product's own script, named in its manifest, run by the session's first command. Not a hook.
- For: Follows from the hooks decision. / The product controls its own setup.
- Against: A session that forgets to run it fails confusingly; the start command should run it.


## Principles of the earlier processes (added 3 Nov)

### P1 — modified

- Statement: Purpose: the process exists to put correct, working product behaviour that meets every defined requirement onto main. Nothing else is output; a rule, a record or a test has value only as far as it serves that.
- Source: Principles P1 (civicos-process, neoProcess).
- Evidence grade: single. Suggested: modify. Reason given: Keep as Process3's purpose, with your 3 Nov words added: quickly and cheaply, behaviour that survives, your time only where it is yours. No Ledger line states a purpose today.
- Decision: modified, 2026-11-03 16:58 UTC. Tag: X
- Note (suggestion plus owner words): Keep as Process3's purpose, with my 3 Nov words added: quickly and cheaply, behaviour that survives, my time only where it is mine.

### P2 — modified

- Statement: The process and the product are separate. The process lives in its own repository and keeps the product's build state (layers, modules, their order and uses, each module's requirements, the plans, the job record) in one subtree only the process writes.
- Source: Principles P2.
- Evidence grade: single. Suggested: modify. Reason given: Keep the separation (PLT-7, MNT-1). Restore what was lost: the build state is what tells BOB what to do (your word, 3 Nov). Process3 keeps requirements and layers at the product's own paths, so one subtree becomes the paths the product's config names.
- Decision: modified, 2026-11-03 16:59 UTC. Tag: R
- Note (near-copy of the suggestion): The build state is what tells BOB what to do. Process3 keeps requirements and layers at the product's own paths, so one subtree becomes the paths the product's config names.

### P3 — modified

- Statement: The process is correct before it is used: a meaningful flaw stops all product work until the process is fixed, and the process is never patched in reaction while it runs.
- Source: Principles P3.
- Evidence grade: single. Suggested: modify. Reason given: Your word, 3 Nov: development under Process3 is development of that product, not of Process3. A serious enough flaw pauses the product, Process3 is fixed separately, and the product resumes on the fixed version. Fits MNT-5 to MNT-7. Changes during Process3's own first build are expected.
- Decision: modified, 2026-11-03 17:00 UTC. Tag: X
- Note (near-copy of the suggestion): Development under Process3 is development of that product, not of Process3. A serious enough flaw pauses the product, Process3 is fixed separately, and the product resumes on the fixed version. Changes during Process3's own first build are expected.

### P4 — kept

- Statement: Architecture: BOB, with Bob, defines layers and modules in one total order; each module is in one layer; a module uses only earlier modules; declared use is checked against imports and a violation fails the build.
- Source: Principles P4.
- Evidence grade: measured. Suggested: keep. Reason given: Already ARC-1. Only the layers and modules that carry product capability are yours; the rest of the architecture is BOB's.
- Decision: kept, 2026-11-03 17:00 UTC. Tag: C
- Note: none

### P5 — kept

- Statement: Requirements: BOB, with Bob, writes each module's requirements: the services it provides, the services it uses by module, its invariants, and the product requirements it satisfies by section. They may suggest, never require, an implementation, and are concise because they are read whole. BOB carries a change to every user of a service.
- Source: Principles P5.
- Evidence grade: measured. Suggested: keep. Reason given: REQ-1, REQ-2 and GAT-3 hold parts. The four-part shape, and concise because read whole, were lost.
- Decision: kept, 2026-11-03 17:01 UTC. Tag: O
- Note: none

### P6 — kept

- Statement: A module fits in one reading: one session can read, in full, its code, its requirements and the requirements of the services it uses.
- Source: Principles P6.
- Evidence grade: single. Suggested: keep. Reason given: The aim behind REQ-6 and SES-6, which kept only the size question and lost the principle.
- Decision: kept, 2026-11-03 17:01 UTC. Tag: O
- Note: none

### P7 — modified

- Statement: Only module jobs change module code, and every requirement is tested at the interface and proven met; an ambiguity is removed by rewriting the requirement. A no-judgment change across many modules is one mechanical pass by a worker in BOB's session while no job runs, with one full test run before it is committed.
- Source: Principles P7.
- Evidence grade: single. Suggested: modify. Reason given: Keep no requirement goes untested, which was lost (JOB-12 only checks that tests are not inert). Keep the mechanical pass, shorter: it is the efficient route for changes that need no judgment.
- Decision: modified, 2026-11-03 17:02 UTC. Tag: C
- Note (copy of the suggestion): Keep no requirement goes untested, which was lost (JOB-12 only checks that tests are not inert). Keep the mechanical pass, shorter: it is the efficient route for changes that need no judgment.

### P8 — kept

- Statement: The unit of work is the module job: at most one job per module at a time; a job applies every plan entry for its module and deals with what it finds in its own module within the job whenever it can.
- Source: Principles P8.
- Evidence grade: single. Suggested: keep. Reason given: Lost; JOB-14 (modify) covers only unit size. It serves urgency: nothing found waits for another job.
- Decision: kept, 2026-11-03 17:03 UTC. Tag: O
- Note: none

### P9 — kept

- Statement: A flaw or improvement in another module goes to BOB as a report in that module's terms. BOB confirms it, then sends it to that module's running job, starts that job if its layer is current, or places it in a later START or the next round. A flaw in the requirements goes to BOB and Bob.
- Source: Principles P9.
- Evidence grade: measured. Suggested: keep. Reason given: Mostly PLN-3 and JOB-7; adds BOB's confirmation and starting that module's job.
- Decision: kept, 2026-11-03 17:03 UTC. Tag: R
- Note: none

### P10 — modified

- Statement: A tranche runs one layer at a time, lowest first, and all the module jobs of a layer run concurrently. Nothing found in a tranche waits for the next: it goes to the running job, else a later layer's START, else the completion round. The next layer starts when every job of the layer is complete.
- Source: Principles P10.
- Evidence grade: single. Suggested: modify. Reason given: Keep concurrency, which was lost and is why Phase 2 planned only two jobs, and keep nothing waits. Drop jobs stay active until all are complete: under Process3 a job ends at its merge (INT-1, INT-4) and a later service change reaches its users by GAT-3.
- Decision: modified, 2026-11-03 17:05 UTC. Tag: O
- Note (copy of the suggestion): Keep concurrency, which was lost and is why Phase 2 planned only two jobs, and keep nothing waits. Drop jobs stay active until all are complete: under Process3 a job ends at its merge (INT-1, INT-4) and a later service change reaches its users by GAT-3.

### P11 — kept

- Statement: Tests follow the architecture: each module has its own tests, each layer may have small layer tests run at its completion, and the full regression runs only at release or on Bob's word.
- Source: Principles P11.
- Evidence grade: measured. Suggested: keep. Reason given: Already GAT-2, GAT-7 and ARC-4.
- Decision: kept, 2026-11-03 17:05 UTC. Tag: C
- Note: none

### P12 — kept

- Statement: Done means merged. A tranche works on its own branch off main; main never changes while it runs; the close merges main into the tranche (never a rebase) and re-runs the checks; a job is done when its tests pass and it is merged into the tranche.
- Source: Principles P12.
- Evidence grade: measured. Suggested: keep. Reason given: Already INT-1.
- Decision: kept, 2026-11-03 17:05 UTC. Tag: O
- Note: none

### P13 — modified

- Statement: Sessions are kept short: state lives in the build state, never in a long context; a session's cost grows with its context times its turns; BOB refreshes past a set share of its window (40% then).
- Source: Principles P13.
- Evidence grade: measured. Suggested: modify. Reason given: Keep the cost reason and the rule; the threshold stays in the start table (SES-4, SES-6) rather than a fixed 40%.
- Decision: modified, 2026-11-03 17:06 UTC. Tag: O
- Note (copy of the suggestion): Keep the cost reason and the rule; the threshold stays in the start table (SES-4, SES-6) rather than a fixed 40%.

### P16 — dropped

- Statement: Rules derive from principles: every rule names the principle it serves; no rule is added in reaction to an incident unless it derives from a principle; principles change only with Bob's approval.
- Source: Principles P16.
- Evidence grade: single. Suggested: drop. Reason given: Your word, 3 Nov: that part does not belong in Process3. TXT-6 governs instead: a rule cites a measured failure or your decision.
- Decision: dropped, 2026-11-03 17:06 UTC. Tag: D
- Note: none

### P17 — modified

- Statement: Bob defines the project (values, policies, mission, audiences, use cases, requirements, principles, high-level architecture, UX, doctrine); BOB does everything else, decides every technical matter and reports it in plain words as done. Bob's time is the scarcest resource: BOB brings him only what is his, rendered and explained, with options and a recommendation. Bob does not edit files or enter commands; when an act only he can take is needed, BOB names it and walks him through it. When unsure whether a question is Bob's, BOB decides by this principle and says how it read it.
- Source: Principles P17.
- Evidence grade: single. Suggested: modify. Reason given: Keep it whole after onboarding; no Ledger line holds it today. Your word, 3 Nov: during onboarding the platform forces a few GitHub steps of yours; keep those as few as possible, each walked through.
- Decision: modified, 2026-11-03 17:06 UTC. Tag: O
- Note (copy of the suggestion): Keep it whole after onboarding; no Ledger line holds it today. Your word, 3 Nov: during onboarding the platform forces a few GitHub steps of yours; keep those as few as possible, each walked through.

### P18 — kept

- Statement: The process is a pipeline: while a tranche runs, BOB prepares what the next round or tranche needs (its plan, the next modules' requirements drafted and reviewed, anything a later stage needs), so it opens the moment this one closes, without touching main, a running job's module or the requirements it reads.
- Source: Principles P18.
- Evidence grade: single. Suggested: keep. Reason given: Lost entirely. It serves urgency with no mechanism that holds a turn.
- Decision: kept, 2026-11-03 17:07 UTC. Tag: O
- Note: none

