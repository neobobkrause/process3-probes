# [file] 10-proven-unproven-and-owed.md (continued)


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

One more matter is not yet settled: how two products running at once share the eight slots. Claude settles it when a second product starts. With one product nothing changes.


# [file] foundations.md (later part)


**Two kinds of release.** A release is cut from the open tranche, proven by the full regression, deployed and walked; what a walk finds becomes the next round's entries, never edits to a running one, and what it produces is kept only until it is analysed (P22). A development release is cut and deployed by the process in each round, without you, to the product's own site so walkers can find flaws, and it reaches no one else; it carries your standing approval in CLAUDE.md, and development deployments may hold signing secrets, named only, never read, printed, copied, overwritten or deleted. A public release is a development release the walkers have passed, published only with your approval (your word, 2 Nov; GAP-7): the process prepares it and shows you what it carries, and a GitHub production environment with you as required reviewer holds the publishing job and the production keys, never the sessions' cloud environment.

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
| The Shared Layer Branch, trialled on the first product's layer 7 after layer 6 closes and product work pauses for the process update (Bob's answer, Keep and Drop page, 6 Nov 2026, SLB-1, SLB-10) | Gate runs per module, hours from layer open to merged, reschedules per module and how many changed a user's result, runs halted and minutes lost, tool lines added and removed; stop and decide keep, adjust or drop if layer 7 takes longer to close than layer 6, or a failure after the merge traces to a provider change the signal should have caught | Layer 7 close; if kept, the merge train, the MERGER, the parallel window, provider holds, the in-flight hold, the plain queue and the fixes built for them are removed (Bob's answer, Keep and Drop page, 6 Nov 2026, SLB-11) |


Binding on all jobs: the reviewer for jobs has changed. Handover notes now carry the line `reviewer: Odette Fairweather`, and the name Soren Achterberg is no longer written anywhere in a handover note.

The two health metrics of the previous section are measured from day one and have no decision date; they are the standing judge of every other line.

## Open tensions to settle

Four pairs of decisions pulled against each other. All four are settled, the last two by your word on 1 Nov.

1. **Who creates BOB.** SES-1 moves ROOT's session creation to a scheduled task, while SES-2 keeps the two-phase handover, which needs a party that receives the old BOB's messages and repoints the address. A scheduled task cannot answer a message. Settled on 1 Nov: ROOT stays a session for BOB handovers, and with the sweep and the watcher described under Roles it creates and refreshes BOB.
2. **Whole-product checks.** Your ARC-4 note moves whole-product checks to release or your request, while INT-4 as kept says a layer closes when the checks pass once over the product. Settled on 1 Nov, and restated by Bob's answer, Keep and Drop page, 6 Nov 2026, SLB-7: INT-4 reads that a layer closes when every job is complete and the layer's checks pass; module tests do not run again at close; whole-product checks run before a release; the next layer starts at once.
3. **Hooks in the shims.** ENF-1 as modified allows a handful of command hooks, while SHM-1 as kept says the settings file carries no hooks. Settled on 1 Nov: SHM-1 carries only hooks ENF-1 allows, and the drift check fails on any other; today there are none.
4. **BOB as hub.** Settled on 1 Nov: BOB routes requests between spokes and does not translate every exchange. It explains toward you, describing each decision that is yours with enough context and in words you understand. What remains to measure is the routing share of BOB's context after the first layer.


# [file] layer-branch.md

# The shared layer branch

The only flow: the merge train was removed (Bob, 6 Nov, as the coordinator relayed it). A product's `process/config.json` says `"merge_strategy": "layer"` or leaves the key out; any other value is refused. A product with no layer map (`layers_file`) has no layer, and its jobs keep the tranche as their base. Design: the note "Shared Layer Branch" (Bob, 5 Nov), with his rulings: no gate or test run at layer close; a rescheduled job halts its run and restarts; the tool lists the jobs, BOB starts them; at layer merge the layer's checks run, but no module suite. One small PR per publish, landed by the merge tool on a green gate, is the note's recommended implementation choice, which the coordinator adopted.

The steps, with who runs each (`p3` is `node .process/tool/p3.mjs`):

1. BOB: `p3 layer open <n>`. It cuts `layer/<n>` from the tranche tip and lists the jobs that can start. It refuses while an earlier layer opened this way has not merged.
2. BOB: `p3 layer sync <n>` after every pin move made while layer n is open, before any job in it lands (SLB-12, Bob, 6 Nov). A pin move does not reach an open layer branch: the gate and the record check run the base's own tool, so `layer/<n>` keeps the tool it was cut with. Layer sync merges the tranche into `layer/<n>` by a tool-made pull request and lands it through the merge tool on a green gate. In a conflict it takes `.process` and the process's shims from the tranche and keeps each ledger entry as the layer has it; any other conflict refuses. It records a `sync` event. While `layer/<n>`'s pin differs from the tranche's, `layer jobs` and `status --role bob` lead with "run layer sync <n>", and `layer merge <n>` refuses unless the pin moved only after the layer's last land.
3. BOB: runs each `job start <id> --live <n>` line from `p3 layer jobs <n>`. `status --role bob` lists the same lines under `jobs to start`. No other session creates a job. Each job branch is cut from `layer/<n>`, and its draft PR goes into it.
4. The job: works and pushes on its own branch. When its suite passes, it runs `p3 layer publish <id>` with job complete's flags. Publish brings the branch up to the layer tip and refuses any file outside the module. It runs the module's checks and suite, and marks the PR ready. While the suite runs, it reads the state branch every 30 s. A reschedule for the module halts the run, and publish starts again on the new layer tip.
5. BOB (the merge tool): `p3 layer land <pr>` once the gate on the PR's tip is green. There is no combined re-test, even when the layer has moved on in other modules. The land is refused when the run behind it started before a provider's newest interface change. At the land, the provider's interface is compared before and after. Three triggers count, and each is recorded in the reschedule row: its exports (`exports`), the text of its Public / Provides section (`provides-text`), and a changed test of the provider that names a Provides requirement id (`provides-test`). The last catches a changed answer shape that the exports do not show. A change does two things: it reschedules the provider's users in this layer (BOB delivers the message the land prints to each one whose job is open, with send_message priority now; the tool sends nothing itself), and it leaves a provider notice for its users in later layers.
