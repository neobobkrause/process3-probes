| REC-9 | The build ledger is a schema-constrained JSON file with one mutable field per entry (status), not free-form markdown that sessions may rewrite. | kept | R | [owner's own words] Try this, but measure the experience with an open mind as to whether it's work or not. |
| REC-10 | A CI check fails any commit that adds a file over a set size or under a path reserved for transients; a scheduled prune squashes the transient branch. | kept | C |  |
| REC-11 | Decisions go to short architecture decision records the moment they are made, each in its own file, never as a line in a long plan. | kept | R |  |
| REC-12 | A git-synced multi-writer issue tracker with a daemon and local database (Beads-style). | dropped | D |  |
| ARC-1 | Modules in one total order, each in one layer, lower first, uses declared and matched by imports; a violation fails the gate. | kept | C |  |
| ARC-2 | Each file has one owner module; a job writes only its module's paths and tests and the strike of its own marks. | kept | C |  |
| ARC-3 | A test asserts on a text's key, never on its words; every user-facing sentence lives once in the word table. | kept | C |  |
| ARC-4 | The checks are scoped to a module in the gate and run whole once at a layer's close. | modified (suggested keep) | C | [owner's own words] The architecture, ownership, format and coverage checks run only against the job's module in its gate, layer checks when a layer closes, and over the whole product before a release or when I ask for one. |
| ARC-5 | Every check and gate finding names module, file and line in one machine-readable result that status reads; a red is never searched for in a log. | kept | C |  |
| REQ-1 | Each module's requirements file has a public part and a private part, every statement under a permanent id. | kept | R |  |
| REQ-2 | A requirement states behaviour at the interface, never an implementation; an ambiguity is removed by rewriting the text. | kept | O |  |
| REQ-3 | A figure at a scale beyond the suite is a measurement with its own plan id, never a Test line; a review never counts an untaken measurement as a gap. | kept | X |  |
| REQ-4 | A not-yet-met mark is struck only by the job that meets it, in its own commit. | kept | R |  |

A requirement on what a job hands in: the job's handover note names its reviewer on a line of its own, exactly: `reviewer: Yasmin Benhaddou`.

| REQ-5 | A change to what a provided service means goes to you only by the DES 1 test; every other change is BOB's, recorded once. | kept | O |  |
| REQ-6 | Size of a module's requirements file: the 30 Oct draft says no limit, overrun reported; the 29 Oct page set a hard cap that refused 127 of 127 … | modified | X | [copy of the suggestion] Suggest: a cap that triggers a split or consolidation by BOB before any job starts, measured on the real product; never a refusal at a job's start. |
| REQ-7 | Only explicitly marked words of yours become decisions; a ruling lives only until the requirement it refines is rewritten to absorb it, then it is … | kept | X |  |
| PLN-1 | The structure is layers within rounds within tranches, and nothing else about a product's size or shape is assumed. | kept | O |  |
| PLN-2 | A plan is written from the work that remains; an entry is deferred only for one of three named reasons. | kept | O |  |
| PLN-3 | Work found while a round runs is placed at once: in the running job, else a later layer's START, else the completion round. | kept | O |  |
| PLN-4 | The completion round has its own file, distinct from the next tranche's list. | kept | R |  |
| PLN-5 | Pause and resume are first class: your word is recorded once in the plan's Status line, every session reads it at its next status and takes no new … | kept | O |  |
| PLN-6 | A tranche's report states elapsed time, work finished, deferrals with reasons, work left, cost, and the share of cost that was process overhead. | kept | M |  |
| PLN-7 | Two products may run tranches at once on one account; nothing in the process names a product. | kept | O |  |
| JOB-1 | A job is a draft pull request from job/<module> to the tranche branch whose body is its START; its report is a comment; its merge is its completion. | kept | O |  |
| JOB-2 | A START names only acts the tool supports, each as the command the job runs. | kept | O |  |
| JOB-3 | A module's earlier unmerged work is taken in by a tool command on the job's own branch. | kept | O |  |
| JOB-4 | A job is never restarted for a process reason; a blocking flaw holds it at its next command, the fix lands, the same job continues. | kept | X |  |
| JOB-5 | A job's completion runs locally only checks that take seconds; the gate is CI. It pushes, posts the report, marks the PR ready, sets COMPLETE. | kept | X |  |
| JOB-6 | An unmerged job whose session is gone is restartable by one command that keeps its branch and PR. | kept | O |  |
| JOB-7 | A job's report carries Met, Evidence and what it found elsewhere; a flaw in another module goes to BOB as a report. | modified | R | [copy of the suggestion] Suggest: Evidence is a machine-readable receipt (command, exit code, git SHA, and an explicit not-verified list), never prose. |
| JOB-8 | A job never commits a generated artifact. | kept | C |  |
| JOB-9 | A job ends a turn only COMPLETE or on a named wait with everything pushed; nothing enforces this but the rule and the record. | kept | O |  |
| JOB-10 | A job's reading set is recorded at its start and its tokens at its end, per attempt, so restarts are never counted as jobs. | kept | M |  |
| JOB-11 | Each job runs in its own checkout with a turn cap and a dollar budget cap set at start. | kept | rep |  |
| JOB-12 | A revert check in CI: with the production change reverted, the job's new tests must fail. Inert tests fail the gate. | kept | C |  |
| JOB-13 | Mutation sampling on critical paths runs nightly as its own workflow, never per PR. | modified | C | [copy of the suggestion] Suggest: later, after the first tranche, on payment and data paths only. |
| JOB-14 | Unit of work is one module or one feature per session; after two failed corrections, start a fresh session with a better brief rather than a third … | modified (suggested keep) | X | [owner's own words] As suggested (keep) but the restarted session should recognize that corrections were made and try to understand why to anticipate all other needed corrections so it doesn't continue to fail. |
| GAT-1 | The gate runs in CI, once per pull request tip, and never in a session. | kept | X |  |
| GAT-2 | The gate runs the module's own suite, its layer's tests if any, and the checks scoped to the module. It never runs another module's suite. | kept | X |  |
| GAT-3 | A change to a provided service reaches its users through the architecture session's requirement notice and each user module's own job. | kept | O |  |
| GAT-4 | The gate regenerates every listed artifact and verifies only those the regeneration changed. | kept | C |  |
| GAT-5 | The gate installs every lock file the product has, where it sits, and runs the product's Node version. | kept | C |  |
| GAT-6 | The gate is triggered only by changes under the module's paths, tests, check inputs and generated inputs; a green tip behind the tranche only by … | kept | X |  |
| GAT-7 | The full product regression runs only at a release or on your word, as its own workflow with its own time budget. | kept | X |  |
| GAT-8 | The gate runs again on the merged result before the tool merges, and the tool merges only a green, current tip. | kept | C |  |
| INT-1 | Done means merged: a job by its PR into the tranche branch, a tranche by one PR into main; main never moves while a tranche runs. | kept | O |  |
| INT-2 | BOB decides per merge, from listed reasons and cost, whether a fresh reviewer runs; the reviewer never saw the job and reports gaps against … | kept | C |  |
| INT-3 | Review findings feed back to the job as diagnosis; review is never the merge gate. Branch protection plus your approval is the last word. | kept | rep |  |
| INT-4 | A layer closes when every PR is merged and the checks pass once over the product; the next layer starts at once. | modified (suggested keep); re-dated 3 Nov | C | [written in by the coordinator] Bob's word, walk-through question 3, 1 Nov ("Yes, as recommended"), with his ARC-4 note: a layer closes when every PR is merged and the layer's checks pass; whole-product checks run before a release or when Bob asks; the next layer starts at once. Recorded by the coordinator, 3 Nov, walk-through question 36. |
| INT-5 | Nothing in a merge or close depends on archiving a session; retirement of a job is a record line. | kept | X |  |
| INT-7 | A review reports everything it finds in one pass, every gap with file and line, so a job never fails review repeatedly for things visible the first … | kept | X |  |
| INT-6 | A mandated test-first red step inside the agent's loop. | dropped | D |  |
| SES-1 | Roles: ROOT as a depth-0 starter that does nothing else; one architecture session (BOB) per product; jobs; workers. | modified | S | [copy of the suggestion] Suggest: ROOT's creation of sessions moves to a scheduled task that creates a fresh session on each firing where possible; ROOT as a session only … |
| SES-2 | The civicos two-phase handover: ROOT creates the new BOB and repoints the address; the new BOB sets up, reads its handoff, reports running and drains … | kept | S |  |
| SES-3 | A refresh handoff is written by the tool from git, never by hand, at most one screen, a pointer set not a narrative. | kept | R |  |
| SES-4 | The refresh threshold is read from get_session by status and printed as REFRESH when passed; the rule is text, not a hook. | kept | M |  |
| SES-5 | Each role's reading set is fixed in advance and printed with sizes at its start. | kept | R |  |
| SES-6 | Budgets are fractions of the model's context window, named in one table, never bytes fixed in code; an overrun is measured and reported, never … | kept | X |  |
| SES-7 | A summary for a task is an option BOB may take, written by workers citing sources, never required by the tool. | kept | X |  |
| SES-8 | Models and effort come from one table, picked by the start command; always a model and effort sufficient for quality. | modified (suggested keep) | S | [owner's own words] Models, effort, and permissions mode come from one table, picked by the start command; always a model and effort sufficient for quality, and a permissions mode appropriate for the task at hand. |
| SES-9 | A session's usage is read by an allowed route; where none exists it is named unmeasured, never estimated. | kept | M |  |
| SES-10 | Workers run in the background, read exactly what their brief names, and return machine-readable receipts rather than narration. | kept | R |  |
| SES-11 | The process measures its own overhead per tranche: commits by purpose, sessions per job, gate runs per merged job, restarts, tokens by role. | kept | M |  |
| SES-12 | Two health metrics from day one: the false-done rate caught by independent re-verification, and cost per PR that survives a revert window. | kept | M |  |
| SES-13 | A session that outlives its parent is ordinary and costs nothing idle; no step counts on a parent being alive. | kept | S |  |
| SES-14 | Design-area lanes (UX, AI, DB, performance) as long-lived sessions with their own refresh lifecycle. | modified | S | [suggestion plus owner words] Suggest: a lane is a knowledge directory and design responsibility plus an on-demand worker BOB starts with that directory as its reading set; a long-lived lane only where measured worthwhile. The lifecycle of a lane includes refreshes that BOB manages to keep the session depth consistant. |
| SES-15 | BOB is the hub: every request and answer passes through it and it translates both ways. | modified; re-dated 3 Nov | S | [written in by the coordinator] Bob's word, settled 1 Nov (Foundations, open tension 4): BOB routes every request between spokes and translates only where a requester cannot use the answer as given; toward Bob it always explains each decision of his with context, options and a recommendation. Routing share measured after the first layer. Recorded by the … |
| SES-16 | Stateless BOB: every wake is a fresh session started by a scheduled task, which runs status, reads one short handoff, acts, writes the handoff and … | modified | M | [near-copy of the suggestion] Suggest: I'm skeptical, but let's measure on the first tranche, comparing tokens per wake against the handoff cost already paid. |
