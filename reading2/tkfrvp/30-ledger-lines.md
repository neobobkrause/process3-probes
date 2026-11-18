- Against: The command must be maintained as the record's shape changes. / Its output can grow long for a large tranche and needs its own size discipline. / A fact missing from status is invisible to the successor.

### REC-4 — kept

- Statement: Record writes by the architecture session never cost a job a gate run or a completion.
- Source: Requirements REC-4 (29 record-only merges into job branches in a day).
- Evidence grade: measured. Suggested: keep. Reason given: Path filter in CI does it.
- Decision: kept, 2026-10-31 01:35 UTC. Tag: X
- Note: none
- Page explanation: When BOB pushes a ruling or a plan line to the tranche branch, job branches do not re-run their gates. The gate's trigger ignores record paths, and a green job whose only difference from the tranche is record files merges as it stands.
- For: 29 unnecessary merges and 13-minute gate reruns in one day came from this. / A simple path filter in the workflow. / Keeps BOB free to write the record often.
- Against: Path filters must track where the record lives. / A record change that should affect code, such as a requirement edit, needs a separate route to trigger a job.

### REC-5 — kept

- Statement: A remote act is recorded as done only from the tool call's result, never from its request.
- Source: Requirements REC-5 (hook recorded refused acts as done).
- Evidence grade: measured. Suggested: keep. Reason given: Cheap correctness.
- Decision: kept, 2026-10-31 01:37 UTC. Tag: R
- Note: none
- Page explanation: When a session performs a remote act, such as creating a PR or sending a message, it writes the act into the record only after the tool returns success, never when it issues the request.
- For: A hook once recorded refused acts as done; this makes that impossible. / Zero cost.
- Against: A crash between result and record loses the record of a successful act; the next status should reconcile against GitHub.

### REC-6 — kept

- Statement: The address of any party is read from git at the moment of sending, and an address change is on that branch before it is announced.
- Source: Requirements REC-6; neoProcess page, Sessions rule 8.
- Evidence grade: measured. Suggested: keep. Reason given: Prevents the stale-address refusal seen on the 30th.
- Decision: kept, 2026-10-31 01:37 UTC. Tag: R
- Note: none
- Page explanation: Each role's current session address is stored in git. A sender reads it at the moment of sending, not from memory. When an address changes, the change is pushed before anyone is told about it.
- For: A product session rightly refused a message from an address not yet on main; this closes that gap. / Makes the two-phase handover of SES-2 safe. / Trivial to implement in the send command.
- Against: Requires a fetch before each send, a small cost. / If the address file is wrong, every sender is wrong together.

### REC-7 — kept

- Statement: The record of a halted build is complete: status on a fresh session tells everything open, idle, merged, unmerged and owed, with no transcript needed.
- Source: Requirements REC-7 (Civicsmith's halt was readable).
- Evidence grade: measured. Suggested: keep. Reason given: Already true once; keep it true.
- Decision: kept, 2026-10-31 01:37 UTC. Tag: R
- Note: none
- Page explanation: If a tranche is stopped for any reason, a fresh session running status must see everything: open PRs, idle sessions, merged and unmerged jobs, and anything owed. No one should need a transcript to resume.
- For: Already true at Civicsmith's halt. / Makes a halt safe, so you can stop freely. / Supports stateless resumption and PLN-5.
- Against: Every new kind of fact must be added to status or it becomes invisible. / Completeness is hard to test except by halting and resuming, which the shadow run should do.

### REC-8 — modified

- Statement: Reads are a matter of record: the start command prints the reading set with sizes and a worker audits transcripts after the fact for reads that stopped short.
- Source: Requirements REC-8, SES-9 (moderate confidence); research: no mechanical proof of attention exists.
- Evidence grade: proposed. Suggested: modify. Reason given: Suggest: keep the audit, but judge reading by what a session can cite from the end of a document, and shrink documents so the question rarely arises.
- Decision: modified, 2026-10-31 01:39 UTC. Tag: C
- Note (copy of the suggestion): keep the audit, but judge reading by what a session can cite from the end of a document, and shrink documents so the question rarely arises.
- Page explanation: The start command prints the documents a session is expected to read and their sizes. Later, a worker reads a sample of transcripts to find sessions that stopped reading a document early, and files a flaw report. This replaces the hook that refused partial reads. The suggestion adds a sharper test: whether a session can cite something from the end of a document.
- For: Checks results rather than blocking tools. / Builds a measured record of how often skimming actually happens. / Cheap when sampled.
- Against: Catches skimming after the damage, not before. / Transcripts show tool calls, not attention, so the audit is approximate. / The real remedy is shorter documents; the audit only tells you when they are still too long.

### REC-9 — kept

- Statement: The build ledger is a schema-constrained JSON file with one mutable field per entry (status), not free-form markdown that sessions may rewrite.
- Source: Research: Anthropic's harness uses a JSON feature list where agents may change only 'passes'; markdown plans decayed into 605 files in one documented case.
- Evidence grade: single. Suggested: keep. Reason given: Directly replaces prose plans and handoffs that bloated. New to the ledger.
- Decision: kept, 2026-10-31 01:40 UTC. Tag: R
- Note (owner's own words): Try this, but measure the experience with an open mind as to whether it's work or not.
- Page explanation: The list of modules or features to build is a structured file where each entry has fixed fields and one field, status, that later sessions may change. The model is far less likely to rewrite or lose structured entries than prose, and a diff of the ledger shows exactly what changed.
- For: Anthropic chose this after finding markdown plans decayed; one documented case had 605 decaying plan files. / A ledger diff is readable and reviewable by you. / Status can be derived into the handoff automatically.
- Against: Rests on two design anecdotes, not a controlled study. / Less expressive than prose; nuance goes to ADRs, REC-11. / A model can still edit the wrong field; a CI check on the ledger schema is needed.

### REC-10 — kept

- Statement: A CI check fails any commit that adds a file over a set size or under a path reserved for transients; a scheduled prune squashes the transient branch.
- Source: This week's discussion; neoProcess prune workflow; your report of gigabyte bloat under civicos.
- Evidence grade: measured. Suggested: keep. Reason given: Mechanical, cheap, and would have caught the bloat early.
- Decision: kept, 2026-10-31 01:41 UTC. Tag: C
- Note: none
- Page explanation: A CI check fails any commit that adds a file over a set size or writes under a path reserved for transient data. A scheduled workflow periodically squashes the transient branch to its current state so history does not accumulate.
- For: Would have caught the gigabyte bloat early. / Mechanical, cheap, no model involved. / The prune is already a neoprocess workflow.
- Against: A size limit will occasionally block a legitimate large file and needs an override path. / Pruning destroys history you might later want for forensics; keep an archive policy.

### REC-11 — kept

- Statement: Decisions go to short architecture decision records the moment they are made, each in its own file, never as a line in a long plan.
- Source: Research (INNOQ): 'Decisions need a visible home, not a line in a 1,000-line Markdown file.'
- Evidence grade: convergent. Suggested: keep. Reason given: Replaces the ruling log. New to the ledger.
- Decision: kept, 2026-10-31 01:42 UTC. Tag: R
- Note: none
- Page explanation: When BOB or you make a decision, it is written as a short architecture decision record: one file with a title, the context, the decision, and the consequences. Rulings never live as lines in a long log or plan.
- For: Decisions have a stable address that requirements can cite. / Easy to supersede explicitly rather than accrete. / A widely used format outside AI work.
- Against: Many small files to keep organised. / Requires discipline to fold an ADR's effect into the requirement text, REQ-7, or the ADRs become the new log.

### REC-12 — dropped

- Statement: A git-synced multi-writer issue tracker with a daemon and local database (Beads-style).
- Source: Research: author-documented data loss, 'overkill for a solo user'.
- Evidence grade: convergent. Suggested: drop. Reason given: Solves a multi-writer problem a solo owner does not have.
- Decision: dropped, 2026-10-31 01:43 UTC. Tag: D
- Note: none
- Page explanation: Beads and similar tools store issues as JSON lines in git with a local database and background syncing, so many agents on many machines share a tracker. Its author documented months of data loss and a difficult migration.
- For: Solves real coordination problems for teams of many parallel writers. / Git-native, so it fits the git-as-record philosophy.
- Against: The hard part it solves, many writers syncing, is not your situation. / Documented data loss, slowness and bloat. / GitHub issues and the ledger of REC-9 cover your need.


## Architecture and checks

### ARC-1 — kept

- Statement: Modules in one total order, each in one layer, lower first, uses declared and matched by imports; a violation fails the gate.
- Source: Requirements ARC-1; held live.
- Evidence grade: measured. Suggested: keep. Reason given: Working.
- Decision: kept, 2026-10-31 01:44 UTC. Tag: C
- Note: none
- Page explanation: Every module sits in one layer and one position in a total order. Each module declares which earlier modules it uses, and a check confirms its imports match the declaration. A violation fails the gate.
- For: Working today. / Makes layer-by-layer building possible. / Prevents hidden coupling.
- Against: Reordering modules is expensive once code depends on the order. / The check can be strict about helper modules and needs a clear rule for them.

### ARC-2 — kept

- Statement: Each file has one owner module; a job writes only its module's paths and tests and the strike of its own marks.
- Source: Requirements ARC-2; held live.
- Evidence grade: measured. Suggested: keep. Reason given: Working.
- Decision: kept, 2026-10-31 01:44 UTC. Tag: C
- Note: none
- Page explanation: Each source file belongs to one module. A job may write only its module's files and tests, plus the lines in the requirements file that mark its own requirements as met.
- For: Working today. / Makes parallel jobs safe from overwriting each other. / A simple check.
- Against: Shared files such as configuration need a designated owner. / A fix that spans modules needs two jobs or a BOB ruling.

### ARC-3 — kept

- Statement: A test asserts on a text's key, never on its words; every user-facing sentence lives once in the word table.
- Source: Requirements ARC-3; your word of 30 Oct.
- Evidence grade: measured. Suggested: keep. Reason given: Working.
- Decision: kept, 2026-10-31 01:45 UTC. Tag: C
- Note: none
- Page explanation: User-facing text lives once in a word table, keyed by an id. Tests check that the right key was used, not the words. Only the words check compares actual text.
- For: Your ruling; changing wording never breaks tests. / Enables translation and a consistent voice. / Working today.
- Against: A wrong sentence under the right key passes every test; the words table must be reviewed by a person. / Slight indirection for anyone reading a test.

