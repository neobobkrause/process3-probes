### ARC-4 — modified (against the suggestion: keep)

- Statement: The checks are scoped to a module in the gate and run whole once at a layer's close.
- Source: Requirements ARC-4.
- Evidence grade: measured. Suggested: keep. Reason given: Working.
- Decision: modified, 2026-10-31 02:05 UTC. Tag: C
- Note (owner's own words): The architecture, ownership, format and coverage checks run only against the job's module in its gate, layer checks when a layer closes, and over the whole product before a release or when I ask for one.
- Page explanation: The architecture, ownership, format and coverage checks run only against the job's module in its gate, and run over the whole product once when a layer closes.
- For: Keeps gates fast. / Catches cross-module problems at layer close before they compound.
- Against: A problem introduced by one job may surface only at layer close, when its session is gone. / Layer close becomes a longer step.

### ARC-5 — kept

- Statement: Every check and gate finding names module, file and line in one machine-readable result that status reads; a red is never searched for in a log.
- Source: Requirements ARC-5, GAT-7 (gate logs read by hand on the 30th).
- Evidence grade: proposed. Suggested: keep. Reason given: Cheap to build, saves BOB context every time.
- Decision: kept, 2026-10-31 01:46 UTC. Tag: C
- Note: none
- Page explanation: Every check and gate writes its findings as structured data: module, file, line, rule. The status command and BOB read that, so no one scrolls a CI log to find why a gate went red.
- For: Gate logs were read by hand on the 30th to find one failure. / Saves BOB context on every red. / Enables counting findings per module over time.
- Against: Each check needs an output adapter. / Structured output can hide useful context that a raw log shows.


## Requirements

### REQ-1 — kept

- Statement: Each module's requirements file has a public part and a private part, every statement under a permanent id.
- Source: Requirements REQ-1; held.
- Evidence grade: measured. Suggested: keep. Reason given: Working.
- Decision: kept, 2026-10-31 01:47 UTC. Tag: R
- Note: none
- Page explanation: Each module's requirements file has a public part describing its purpose and what it provides, and a private part listing what it uses, its invariants, which requirements it satisfies, and suggestions. Every statement has a permanent id.
- For: Working today. / Permanent ids let tests, plans and ADRs cite requirements. / The public and private split tells users what they may depend on.
- Against: A rigid format can be gamed by writing to the template rather than thinking. / Format checks need maintenance.

### REQ-2 — kept

- Statement: A requirement states behaviour at the interface, never an implementation; an ambiguity is removed by rewriting the text.
- Source: Requirements REQ-2 (16 rulings in a day were mostly this).
- Evidence grade: measured. Suggested: keep. Reason given: Principle behind the consolidation mechanism.
- Decision: kept, 2026-10-31 01:47 UTC. Tag: O
- Note: none
- Page explanation: A requirement says what a module does as seen from outside, not how. When a requirement is found ambiguous, the text is rewritten; a clarifying ruling is never attached beside it.
- For: Most of BOB's rulings on the 30th were exactly this and should have been edits. / Keeps the requirements file the single source. / Avoids the ruling log.
- Against: Rewriting shifts text under a job already working from the old wording; needs a notice. / Judging interface versus implementation takes skill and sometimes argument.

### REQ-3 — kept

- Statement: A figure at a scale beyond the suite is a measurement with its own plan id, never a Test line; a review never counts an untaken measurement as a gap.
- Source: Requirements REQ-3 (a job ran million-row fixtures in-session for hours).
- Evidence grade: measured. Suggested: keep. Reason given: Measured waste.
- Decision: kept, 2026-10-31 01:48 UTC. Tag: X
- Note: none
- Page explanation: If a requirement involves scale, such as a million rows, the suite proves the behaviour at a small size and the scale figure becomes a separate measurement item in the plan. A test line never names a huge fixture, and a reviewer never counts an untaken measurement as a gap.
- For: A job ran million-row fixtures in-session for hours because of this. / Keeps gates fast and suites honest about what they prove. / Measurements can be scheduled when infrastructure exists.
- Against: Scale bugs are found later, in measurement, not in the gate. / Needs a format rule and a reviewer brief that know the distinction.

### REQ-4 — kept

- Statement: A not-yet-met mark is struck only by the job that meets it, in its own commit.
- Source: Requirements REQ-4; held.
- Evidence grade: measured. Suggested: keep. Reason given: Working.
- Decision: kept, 2026-10-31 01:48 UTC. Tag: R
- Note: none
- Page explanation: A requirement marked not-yet-met is changed to met only by the job that implements it, in that job's own commit. BOB never strikes a mark on a job's behalf.
- For: Working today. / The commit proves who claimed completion. / Keeps marks and code in the same diff.
- Against: If a job dies after meeting a requirement but before striking it, the successor must redo the strike. / A mark can be struck without the test proving the requirement; JOB-12 addresses that.

### REQ-5 — kept

- Statement: A change to what a provided service means goes to you only by the DES 1 test; every other change is BOB's, recorded once.
- Source: Requirements REQ-5.
- Evidence grade: measured. Suggested: keep. Reason given: Protects your time.
- Decision: kept, 2026-10-31 01:48 UTC. Tag: O
- Note: none
- Page explanation: A change that alters what a module promises to its users comes to you only when it changes what the product does for its users and the canon is silent. Everything else BOB decides, records once, and reports.
- For: Protects your time, the scarcest resource. / A clear test reduces argument about what is yours.
- Against: BOB will sometimes misjudge the test in both directions. / Decisions you would have wanted to see may be made without you.

### REQ-6 — modified

- Statement: Size of a module's requirements file: the 30 Oct draft says no limit, overrun reported; the 29 Oct page set a hard cap that refused 127 of 127 modules.
- Source: Requirements REQ-6 and SES-6; neoProcess page §8; research: numeric caps are tool limits, not quality thresholds, and should be alarms.
- Evidence grade: measured. Suggested: modify. Reason given: Suggest: a cap that triggers a split or consolidation by BOB before any job starts, measured on the real product; never a refusal at a job's start.
- Decision: modified, 2026-10-31 01:50 UTC. Tag: X
- Note (copy of the suggestion): Suggest: a cap that triggers a split or consolidation by BOB before any job starts, measured on the real product; never a refusal at a job's start.
- Page explanation: The 29 Oct page set a hard byte cap on a module's requirements file and refused jobs above it, which refused every module. The 30 Oct draft removed the cap entirely and only reports overruns. The suggestion is a cap that triggers work for BOB, splitting the module or consolidating its requirements, before any job opens; never a refusal at a job's start.
- For: A cap is the only thing that forces consolidation to happen. / Your observation that neoProcess ensured every job knew what it needed came from the cap. / A trigger rather than a refusal never blocks a job.
- Against: Any number is arbitrary until measured on real jobs. / Consolidation is real work for BOB and may lose detail. / Research found no study tying instruction length to coding success, so the threshold is a judgment.

### REQ-7 — kept

- Statement: Only explicitly marked words of yours become decisions; a ruling lives only until the requirement it refines is rewritten to absorb it, then it is deleted.
- Source: This week's discussion; your report of 5,782 rulings in 34 days; research: corrections are made by adding prohibitions, not editing.
- Evidence grade: measured. Suggested: keep. Reason given: The missing mechanism behind REQ-2. New to the ledger.
- Decision: kept, 2026-10-31 01:50 UTC. Tag: X
- Note: none
- Page explanation: Only words you explicitly mark as a decision become rulings; your other remarks are input. A ruling exists only until the requirement or rule it refines is rewritten to absorb it, then it is deleted. There is no permanent log of rulings.
- For: Addresses the 5,782-ruling problem directly. / Research shows corrections are made by adding prohibitions, never editing; this forces editing. / Keeps every rule in one home.
- Against: Requires you to mark decisions, a small habit change. / History of why a rule changed lives only in git and ADRs, not in a readable log. / Someone must do the absorbing, and it is easy to defer.


## Planning

### PLN-1 — kept

- Statement: The structure is layers within rounds within tranches, and nothing else about a product's size or shape is assumed.
- Source: Requirements PLN-1; your word of 30 Oct.
- Evidence grade: measured. Suggested: keep. Reason given: Your constraint.
- Decision: kept, 2026-10-31 01:51 UTC. Tag: O
- Note: none
- Page explanation: Work is organised as tranches, each with rounds, each with layers that follow the module order. That structure is fixed. Nothing else about the product, such as how many modules or how large a file, is assumed.
- For: Your stated constraint. / A fixed structure lets the tool stay simple.
- Against: A product that does not fit layers well will fight the structure. / Three nested levels are more ceremony than a small product needs.

### PLN-2 — kept

- Statement: A plan is written from the work that remains; an entry is deferred only for one of three named reasons.
- Source: Requirements PLN-2; P19.
- Evidence grade: measured. Suggested: keep. Reason given: Held.
- Decision: kept, 2026-10-31 01:51 UTC. Tag: O
- Note: none
- Page explanation: A tranche plan lists all remaining work. An entry may be left out only for one of three reasons: a decision of yours not yet made, a deployment or measurement that cannot happen inside the tranche, or something outside the product that does not yet exist. The reason is written.
- For: Prevents quiet scope reduction. / Held so far. / Deferrals become reviewable.
- Against: Pushes toward large tranches, which take longer to close. / The three reasons may not cover every legitimate deferral.

### PLN-3 — kept

- Statement: Work found while a round runs is placed at once: in the running job, else a later layer's START, else the completion round.
- Source: Requirements PLN-3; held.
- Evidence grade: measured. Suggested: keep. Reason given: Held.
- Decision: kept, 2026-10-31 01:51 UTC. Tag: O
- Note: none
- Page explanation: When a job or review finds new work, it is placed immediately: into the running job if it fits, else into a later layer's START, else into the completion round. It never waits for the next tranche.
- For: Nothing found is lost. / Held on the 30th. / Keeps the plan current.
- Against: Can grow a running job beyond its budget. / BOB must triage every finding promptly.

### PLN-4 — kept

- Statement: The completion round has its own file, distinct from the next tranche's list.
- Source: Requirements PLN-4 (issue 73).
- Evidence grade: measured. Suggested: keep. Reason given: Small fix to a real confusion.
- Decision: kept, 2026-10-31 01:51 UTC. Tag: R
- Note: none
- Page explanation: The completion round, which gathers leftover work at the end of a tranche, has its own file that the tool opens, separate from the list of work for the next tranche.
- For: Fixes a real confusion from issue 73. / Trivial.
- Against: One more file.

