# [file] foundations.md (continued)


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
| The Shared Layer Branch, trialled on the first product's layer 7 after layer 6 closes and product work pauses for the process update (Bob's answer, Keep and Drop page, 6 Nov 2026, SLB-1, SLB-10) | Gate runs per module, hours from layer open to merged, reschedules per module and how many changed a user's result, runs halted and minutes lost, tool lines added and removed; stop and decide keep, adjust or drop if layer 7 takes longer to close than layer 6, or a failure after the merge traces to a provider change the signal should have caught | Layer 7 close; if kept, the merge train, the MERGER, the parallel window, provider holds, the in-flight hold, the plain queue and the fixes built for them are removed (Bob's answer, Keep and Drop page, 6 Nov 2026, SLB-11) |

The two health metrics of the previous section are measured from day one and have no decision date; they are the standing judge of every other line.

## Open tensions to settle

Four pairs of decisions pulled against each other. All four are settled, the last two by your word on 1 Nov.

1. **Who creates BOB.** SES-1 moves ROOT's session creation to a scheduled task, while SES-2 keeps the two-phase handover, which needs a party that receives the old BOB's messages and repoints the address. A scheduled task cannot answer a message. Settled on 1 Nov: ROOT stays a session for BOB handovers, and with the sweep and the watcher described under Roles it creates and refreshes BOB.
2. **Whole-product checks.** Your ARC-4 note moves whole-product checks to release or your request, while INT-4 as kept says a layer closes when the checks pass once over the product. Settled on 1 Nov, and restated by Bob's answer, Keep and Drop page, 6 Nov 2026, SLB-7: INT-4 reads that a layer closes when every job is complete and the layer's checks pass; module tests do not run again at close; whole-product checks run before a release; the next layer starts at once.
3. **Hooks in the shims.** ENF-1 as modified allows a handful of command hooks, while SHM-1 as kept says the settings file carries no hooks. Settled on 1 Nov: SHM-1 carries only hooks ENF-1 allows, and the drift check fails on any other; today there are none.
4. **BOB as hub.** Settled on 1 Nov: BOB routes requests between spokes and does not translate every exchange. It explains toward you, describing each decision that is yours with enough context and in words you understand. What remains to measure is the routing share of BOB's context after the first layer.


# [file] 10-proven-unproven-and-owed.md

# Process4 Foundations, part 10: Proven, unproven and owed

Length: 85 lines. Last section: "Owed".

## Four words kept apart

No session assures Bob that something will work. Each claim put to him says what is proven and what is not, names its source, and calls anything unread or unmeasured unknown. His rule is in `process4/owner_words/bob_words_14nov_b.md`. So four words are kept apart wherever a figure or a claim appears.

- **Measured:** counted in Process3's record or on real code.
- **Estimated:** worked out from measured figures.
- **Judged:** an opinion, Claude's or an AI worker's.
- **Unproven:** never run.

Process4 itself has never run. What is measured was measured in Process3, in the proof of the notice's method, or on a harness. A trial can break a claim. It cannot prove one. Proof is the first real tranche.

## What is measured

These are the measured facts the design leans on. Each is given with its conclusion in the part named.

- Process3 added checks in 41% of its merges, finished no tranche and no clean walk, and made no release (parts 2 and 4).
- Sessions in Process3 made 270 of 296 process changes themselves (part 8).
- About 700 merges with no review passed through Process3's tool with no recorded refusal (part 9).
- The architecture role in Process3 ran as 21 sessions in six and a half days (part 5).
- The notice's method, in its proof, decided as its rules say and sent 2.6 times fewer notices than telling every user (part 3).
- The behaviours of Claude Code listed in part 9.

## What is unproven, and the trial

The trial uses the trial repository that Bob named, and sessions on his account. The whole chain of sessions builds a few small made-up modules there. Bob agreed to made-up modules for this first trial (`bob_words_14nov_c.md`). It is weaker than a slice of a real product.

Judged cost to Bob: one sitting of about half an hour, with two session starts, one edit to his approvals and one "stop".

Each of these is unproven. The trial rehearses each. The list is stated as Claude Code carries it: the permission checker, the hourly alarm, and the loading of Bob's approvals and of the list of forbidden commands are that harness's. Codex: what carries them there is not yet known. See `process4/working/codex_shortcomings_to_fill.md`.

- A ROOT started by Bob's plain prompt comes up on his newest approvals, and starts ARCH and the coordinator. This holds also straight after Bob commits new approvals.
- A merge with no review, made by Process4's tool, passes the permission checker. Twenty or more merges are tried.
- A freed slot is refilled within minutes, and jobs obey an ARCH that has been replaced.
- The shared state works, and the hourly alarm wakes a ROOT that Bob started.
- The watcher takes over from a ROOT that has died.
- A stop, a held merge, a module put first and a new number of slots each work on Bob's word, and the alarm does not undo a stop.
- Finished sessions do not use up the account's room.
- Several sessions share one walk. Sessions make a deployment and an external walk as a step in a round. The product's hosting account bears the walkers. The tranche branch merges into the main branch.
- A mechanical edit across several modules merges once.
- ARCH asks ROOT, ROOT starts PROCESS on the process's repository, and a process fault reaches PROCESS by way of the coordinator.
- A switch of account loses no work.
- Sessions started this way load Bob's approvals and the list of forbidden commands, also after an edit and a restart. A release can be prepared as far as Bob's approval.

Also unproven, because they have never run: the refresh of a long-lived role on purpose, with a successor that starts from the shared state and the repository alone; partial walks; and running and confirming an install and an update before a release.

Claude Code: ROOT is started by Bob's plain prompt, so its starting instructions do not name every act it may take. Whether that start works is unproven.

## What only the first real tranche can show

- Whether a tranche ends by a clean walk.
- Whether the permission checker goes on passing merges at a real rate.
- How often a process fault stops work and waits for Bob at PROCESS.
- Whether cost can be read for the accounts and the report. In Process3 it often could not.
- The share of ARCH's work that is passing things on.
- How many notices the notice's method saves on a real product.

## Owed

These are not yet done. The design names them.

- The values of the maximums, to fill the design's named blanks (part 6). They are settled first from the limits that Process3's own rules set. If those do not settle them, credible tests measure the thresholds. Writer's reading: the fill level at which a long-lived role is refreshed (part 5) is one of those blanks.
- A design for how a notified job picks the tests that relate to a changed entry (part 3).
- The design of the watcher's takeover (part 5).
- A worked proposal on branches and on where Bob's approvals live, with each act asked of him (parts 1 and 9).
- The Codex side of the design, wherever it is not yet known or not yet built. It is left for Bob's work on the OpenAI account to fill. The list is `process4/working/codex_shortcomings_to_fill.md`.
- For each product's conversion plan, that product's own open facts.

Technical matters that Claude settles and reports:

- when a round's jobs are done;
- who can read the deploy token;
- who decides an interface between two modules;
- what becomes of files that no module owns;
- which copy a job's tests run against;
- what the shared state holds;
- what ends a loop that has no end;
- what an edit to Bob's approvals does to a running round;
- why the sessions' account was suspended on 6 Nov;
- the two smaller open parts of the notice to user modules (part 3). Writer's reading: the design state file calls these "the notification's two smaller open parts". They are read here as the two matters the design leaves open about the notice.
