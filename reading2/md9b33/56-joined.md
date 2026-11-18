# [file] foundations.md (continued)


**Two kinds of release.** A release is cut from the open tranche, proven by the full regression, deployed and walked; what a walk finds becomes a round's entries, never edits to a running one, and what it produces is kept only until it is analysed (P22). A development release is cut and deployed by the process in each round, without you, to the product's own site so walkers can find flaws, and it reaches no one else; it carries your standing approval in CLAUDE.md, and development deployments may hold signing secrets, named only, never read, printed, copied, overwritten or deleted. A public release is a development release the walkers have passed, published only with your approval (your word, 2 Nov; GAP-7): the process prepares it and shows you what it carries, and a GitHub production environment with you as required reviewer holds the publishing job and the production keys, never the sessions' cloud environment.

## Dropped, and why

Eight lines were dropped. Each had a real intent, and each is replaced by something above.

| Dropped | Why | Replaced by |
| --- | --- | --- |
| Hook refusing partial reads (ENF-4) | Hooks vanished after a resume; refused reads the process ordered | Shorter documents and the citation audit (REC-8) |
| Stop hook enforcing the refresh threshold (ENF-5) | Held sessions against your stop | REFRESH printed by status (SES-4) |
| Mandated test-first red step in the loop (INT-6) | No measured gain at several times the tokens; agents faked the red step | Tests as the gate plus the revert check (JOB-12) |
| Twelve-module process architecture (MNT-2) | The process had become the product | The thin process under itself (MNT-1) |
| In force the day written, certified on a toy (MNT-12) | Toy flaws and product flaws were disjoint | Slice shadow, then the live tranche (MNT-8) |
| Repo-based doorbell and mailboxes (MSG-7) | Bloated the repository; heavier than messaging | Push-then-send messages (MSG-1, MSG-3) |
| Git-synced multi-writer tracker (REC-12) | Solves a problem a solo owner does not have; documented data loss | The JSON ledger and GitHub issues (REC-9) |
| Every rule names the principle it serves (P16) | The earlier processes' principles are a source for Process3, not its canon (your word, 3 Nov) | Every rule, check, review round and measurement cites a measured failure or your word (TXT-6, GAP-3) |

## To measure on the first tranche

These are decided provisionally. Each is kept or changed on a number from the first real tranche, not on argument.

| Question | Measured by | Decide when |
| --- | --- | --- |
| Stateless BOB: fresh session per wake versus the long-lived BOB with handovers (SES-16) | Tokens per wake before the first act, against the handoff cost already paid | After the first layer |
| The JSON ledger with one mutable field (REC-9) | Whether sessions corrupt or bypass it; edits outside the status field | Continuously; decide at tranche close |
| Trimming the always-loaded principles per role (TXT-4) | Drift or misjudgments traceable to a missing principle | Tranche close |
| BOB's routing share of its context (SES-15) | Share of BOB's context spent on relay versus planning | After the first layer |
| Which lanes run as long-lived sessions and which as workers with the lane's directory (SES-14) | Tokens per lane question; quality of answers as judged by you | Tranche close |
| The requirements cap number (REQ-6) | Reading-set sizes and job outcomes by module size | Before the second tranche |
| Home for transient state: state branch, PRs and issues, or a bookkeeping repository (REC-1) | Repository growth; writer conflicts; status latency | Tranche close |
| Permission mode per role (SES-8): settled 1 Nov, every role runs in Auto with the deny list and your committed approvals; denials per role are counted in the metrics | One test spawn; denials per role counted | Before the first job |
| Merging without a person: the auto-mode judge lets sessions merge reviewed work into working and tranche branches on your committed approvals (GAP-10, SES-8) | Refusals per merge by depth and channel; 2 of 3 refused with no consent, 11 of 11 declined on quoted consent, 0 of 21 refused on typed consent (2 Nov) | Settled: 0 refusals in about 450 acts in the confirming round |
| Mutation sampling on critical paths (JOB-13) | Mutation score on payment and data modules | After the first tranche |
| Model and effort table costs (SES-8) | Tokens per merged PR by role and model | Tranche close |

The two health metrics of the previous section are measured from day one and have no decision date; they are the standing judge of every other line.

## Open tensions to settle

Four pairs of decisions pulled against each other. All four are settled, the last two by your word on 1 Nov.

1. **Who creates BOB.** SES-1 moves ROOT's session creation to a scheduled task, while SES-2 keeps the two-phase handover, which needs a party that receives the old BOB's messages and repoints the address. A scheduled task cannot answer a message. Settled on 1 Nov: ROOT stays a session for BOB handovers, and with the sweep and the watcher described under Roles it creates and refreshes BOB.
2. **Whole-product checks.** Your ARC-4 note moves whole-product checks to release or your request, while INT-4 as kept says a layer closes when the checks pass once over the product. Settled on 1 Nov: INT-4 reads that a layer closes when every PR is merged and the layer's checks pass; whole-product checks run before a release.
3. **Hooks in the shims.** ENF-1 as modified allows a handful of command hooks, while SHM-1 as kept says the settings file carries no hooks. Settled on 1 Nov: SHM-1 carries only hooks ENF-1 allows, and the drift check fails on any other; today there are none.
4. **BOB as hub.** Settled on 1 Nov: BOB routes requests between spokes and does not translate every exchange. It explains toward you, describing each decision that is yours with enough context and in words you understand. What remains to measure is the routing share of BOB's context after the first layer.


# [file] 05-roles-and-sessions.md

# Process4 Foundations, part 5: Roles and sessions

Length: 95 lines. Last section: "The way back after a full stop".

## The standing roles

| Role | Started by | What it does | What it does not do |
| --- | --- | --- | --- |
| ROOT | Bob, with a plain prompt on the product's repository | Starts ARCH, the coordinator, the watcher and PROCESS. An hourly alarm wakes it as a safety net, to wake or replace a session that has stopped | Decides nothing about the product and builds nothing |
| The watcher | ROOT | Stands by, and takes over if ROOT dies | Its takeover is not yet designed |
| The coordinator | ROOT | Is Bob's front door for a product. Records his marked words. Tells him what ARCH decided, one plain line each. Puts his questions to him. Gives him the account after each round | Decides nothing about the product. Brings Bob no technical question |
| ARCH | ROOT | One for each product, and long-lived. Directs the work: starts and merges jobs, writes requirement text, names the areas for each walk, makes the development deployment, turns flaws into work, starts the product's design lanes, prepares a release. Decides every technical matter of the product and records each decision in the product's repository | Touches no code and no tests. Never edits Bob's approvals, changes the process, or releases without him |
| PROCESS | ROOT | Is the only place the process is changed (part 8). Works in the process's own repository. Bob works with it directly. May have lanes of its own | Builds no product |

ROOT and the coordinator are different sessions. Bob may watch ARCH and the lanes, and sometimes speak to them. His reasons are in `process4/owner_words/bob_words_16_17nov_codex_development.md`: the lanes are where design decisions are made, he seldom speaks to jobs but wants to see their progress, and he needs PROCESS when a process matter arises.

What the watcher does when it takes over is designed and rehearsed in the trial. That design is owed, and the takeover is unproven.

## What ARCH keeps and what the tool does

Whatever has one right answer is done by the process's tool: who takes a free slot, when a notice is sent and to whom, and whether a round's jobs are done. ARCH's session keeps what needs judgment. The tool is small: it pushes, opens a pull request and marks it ready, merges, starts the next job, sends notices and writes the shared state.

Writer's reading: this keeps ARCH's context for the work only it can do. Measured in Process3: the architecture role ran as 21 sessions in six and a half days. The share of ARCH's work that is passing things on is measured on the first tranche.

## Jobs, helpers and walking sessions

A **job** is a session ARCH starts to do one module's work (part 3). It decides how to meet that module's requirements.

A **helper**, also called a worker, is started by a session inside itself. Helpers are the standing way a long-lived role keeps heavy reading out of its own context. A helper gets a narrow brief and gives a short answer in a set shape. It ends when its work is done. A brief may hand the helper a decision to make, which it reports with its grounds. Bob's words on this are in `bob_words_17nov_codex_context.md` and `bob_words_16_17nov_codex_development.md`. A helper also does noisy bulk work and truly independent side tasks. No helper is briefed to review another session's work.

**Walking sessions** make both walks (part 4). ARCH starts them.

Every session passes Bob's suggested model and effort on to each session it starts. The standard is a model and effort sufficient for quality.

Sessions are at most three levels deep, and none starts its own replacement. Claude Code: the limit on depth is a measured behaviour of that harness.

A finished session is archived, not deleted. An archived session can still be found and reviewed (`bob_words_16_17nov_codex_development.md`). Claude decided: the session that started a session archives it.

Codex: how separate sessions, their depth, the passing on of model and effort, and archiving are carried there is not yet known. See `process4/working/codex_shortcomings_to_fill.md`.

## Design lanes

A lane is a standing design responsibility for one area of a product. Bob calls lanes an important element of the process (`bob_words_14nov_c.md`, sixth message).

- A lane owns a folder of design knowledge in the product's repository. It delivers designs, never product code.
- Bob identifies the need for a lane, and ARCH starts it. The UX lane is always there. It keeps the Screens document and the journeys.
- A lane is the source of truth in its area, so it is qualified before it decides anything. The first time it runs, it uses helpers to research the product's founding documents, the existing code and the best practice of its area. It answers no question until that research is recorded in its folder. Every later session of the lane reads the research first and adds to it. Bob's words on this, of 6 Nov, are quoted in `process4/evidence/foundations_tranche_9nov.md`.
- A lane decides design in its area. ARCH decides whether and when a design is built, and whether it can be built as given. A design ARCH cannot build goes back to the lane.
- Bob keeps the product's direction, audiences and principles. A decision that would change one of those comes to him, with options and the lane's recommendation.
- Questions reach a lane through ARCH. A job never talks to a lane, and lanes do not talk to each other. Bob works with a lane through its design pages.
- A lane runs as one session at a time. Whether that session is kept running or is started when a question arrives is ARCH's call, judged by cost.
- A change that touches only files in the lane's own folder merges without a test run. The reason recorded from Bob is that the modules using a lane's designs have their own tests, and design documents need no testing.
