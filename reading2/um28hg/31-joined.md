# [file] layer-branch.md (continued)

6. BOB: `p3 layer status <n>`, then `p3 layer merge <n>` when every module is complete or deferred, no reschedule is outstanding, and no publish PR is open. First the layer's checks run on the layer tip: each entry's checks, the generated rows built, and every committed generated path regenerated. A red check, or a regenerated file that differs, refuses the merge. A generated row's verify failure refuses it only when the row's paths, or a module the failure names, belong to the closing layer; any other is printed for the module it names, which BOB records there as a found mark (`p3 found`), and the merge goes on (SLB-7). A differing generated file is fixed by BOB's plain pull request into `layer/<n>` (`merge --plain`); the layer gate leaves generated paths to these checks. No module suite runs. Then one PR goes from `layer/<n>` into the tranche. Its gate runs no suite: it checks that each module has a verified green land on a head that held its providers' interface changes. The merge also writes the layer's close row.
7. Anyone: `p3 layer report <n> [--tool-from <process3 sha>]` gives the trial's measures. These are gate runs per module, hours from open to merged, reschedules per module, how often a reschedule changed the user's result, the runs halted and the minutes they cost, and the tool lines added and removed.

Work outside the open layer (the coordinator's ruling, 6 Nov 2026, R12) joins the NEXT layer to open, in order, never the tranche directly. A module whose layer is behind the open one, such as a notice-affected user in a merged layer or a found-mark reopen of a COMPLETE module whose layer merged, has its act printed as `p3 layer join <id> --why "<the work>"`. Status, the notice slots and a refused `job start` all print it. The join is one row on the state branch (`layerflow/<n>/join/<id>.json`). `layer open <n>` lists the joined module in that layer's jobs, a reopen for a COMPLETE one. Its job is cut from `layer/<n>`, and the layer merges only once it lands. A module of a later layer than the open one is owed to its own layer: status lists it apart, even when open_by "uses" reads it as ready; only an early start (below) starts one before its layer opens. A job PR still open into the tranche is the train's: status names it, close it unmerged and restart the module in its layer (no `--restart` path into the tranche).

Early starts into the next layer (Bob, 6 Nov 2026, R14: "Why didn't the early starts launch before layer 8 closed?"). While layer n is open, a module of the next layer to open whose providers have all landed or are COMPLETE (none in layer n working, rescheduled, deferred or not started) is listed by `layer jobs <n>` and status as `job start <id> --live <n> --early`, on idle capacity only, after layer n's own starts. The first early start cuts `layer/<n+1>` ahead from `layer/<n>`'s tip; each later one moves it forward to that tip, a fast-forward, since nothing lands on it before its open. The job's branch and draft pull request are on it, as for any of that layer's jobs. Until `layer open <n+1>` the branch takes nothing else: a plain start, `layer publish`, `layer jobs`/`layer status <n+1>` and `merge --plain` into it are refused. The open brings it up to the tranche tip (again a fast-forward) and lists the early module as working while its draft pull request is open; one whose start did not finish is listed again, and `job start` resumes it. Each early start is one row (`layerflow/<n+1>/early/<id>-<t>.json`), and `layer report <n+1>` gives each one's rework: a reschedule (R8), a retest (R7), or a provider notice after its start, with the rate.

Door tests owed to a later layer (Bob, 6 Nov 2026, R6: B). Some modules' door tests need ops that only a later layer's modules declare. Investigation's acceptproposals and corpus-export's founder-only exportwhole both need op-declarations, op-grades, op-capabilities and store-assembly, which are layer 11. Such a module completes its behaviour in its own layer and does not wait. It names the door test in not-verified, with the requirement ids and the providing modules. That test is owed to the providing layer: BOB lists it in that layer's brief, and once the providers land there, the module's job is restarted for the door test alone. The layer order stays as it is. Deferring a door test this way is the rule, not a ruling each time.

The state is on the state branch, under `layerflow/<n>/`, one file per event: open, run, land, reschedule, sync, merged.


# [file] 04-tranche-rounds-walks-release.md

# Process4 Foundations, part 4: Tranche, rounds, walks and release

Length: 97 lines. Last section: "Release".

## The tranche

A tranche is one batch of product work. It is built on the tranche branch, apart from the main branch. It reaches the main branch only as a whole, by one pull request. The main branch never moves while a tranche runs.

Before a tranche opens, ARCH proposes in a few plain lines what it is for and which journeys are expected to complete at its end. ARCH names any journey left out, and why. Bob approves or changes the proposal.

Claude's reasoning in the design: a tranche with a named purpose brings its walks sooner, and a journey named as left out is neither counted as a flaw nor hidden.

## A round

A tranche is worked in rounds. A round has three steps.

1. Jobs. Every module that has work gets its job.
2. The internal walk, made when the round's jobs are done.
3. A development deployment and the external walk. These happen only when the internal walk finds no flaws.

Claude decided this order. Whether a round's jobs are done has one right answer, so the process's tool decides it.

A flaw found by either walk becomes work for a named module in the next round, not the next tranche. Bob's words on this are in `process4/owner_words/bob_words_14nov_b.md`. The tranche ends when a round's external walk comes clean.

ARCH's session makes the development deployment. Walking sessions make both walks, and they walk whatever product is being developed. Claude decided that walking sessions use the job slots, because a walk happens when no job is open, and that a walk is shared out among them.

How a development deployment is made, and on what, depends on where the product is hosted. The design gives that in a table for each hosting provider (part 6). How many walkers the product's hosting account can bear is unproven, and is measured in the trial.

Claude Code: a session can run one thing for about 30 minutes (measured). Process3's two late runs of a deployment and walk took 60 and 64 minutes (measured). So one walk has to be shared among several sessions. A shared walk has never run and is unproven.

Codex: whether a like limit applies there is not known. See `process4/working/codex_shortcomings_to_fill.md`.

While a tranche runs, ARCH prepares what the next round or the next tranche needs.

## Partial walks

Every round's walks are partial, the first round's included. Before each walk, ARCH names the areas that the round's updates affect. A partial walk is without flaws when it lists no flaw in the areas it was given.

A full external walk is something Bob opts into. By default it is not made. If Bob asks the coordinator for one before a round's partial walks come clean, it is made, and the tranche then ends only if that full walk is clean. A full walk is without flaws when it lists no flaw and leaves out no step that the walk before it made.

Writer's reading: partial walks apply to the walks the rule that a test runs only when there is a fully informed reason to run it. The areas a round changed are the informed reason.

Sometimes it is in doubt how a change will affect the product, and inspecting or testing the code cannot settle it. Then the walks exercise the running workflow concerned. If it does what is expected, there is no problem. Claude's reading, not yet confirmed by Bob: this adds no test. It is part of what ARCH names for a round's walks. It is not stated as a habit in any role's principles.

There is no walk outside a tranche.

## What counts as a flaw

A flaw is one of three things.

- The workflow as built does not match the Screens document.
- A journey cannot be completed.
- A journey completes with a wrong result.

Anything else a walker notes goes to ARCH as an observation. An observation does not hold the tranche. ARCH turns each flaw into work for a named module.

Sometimes ARCH judges that the document is wrong and the product is right. Then the UX lane corrects the document.

There are no separate lanes for sorting problems. A flaw already has its route: it becomes work in the next round.

## The walks' documents

The Screens document and the journeys are pages kept in the product repository's folder. The UX lane keeps them.

During a tranche they change only to correct an error that a walk has shown. Each such change is named in the account after the round.

Claude's reasoning in the design: kept as pages in the repository, every change to what a walk is measured against is on record.

## The account after each round

After each round the coordinator gives Bob a short account. It lists the jobs done, the flaws found, the flaws carried over, the observations set aside, the changes to the walks' documents, the rewordings made, and the cost where it can be read. Nothing waits on it.

At the end of a tranche ARCH writes one report, only from what git and GitHub already hold. It gives time, work done and left, and cost where it can be read, marked "unmeasured" where it cannot. No number in it is a target. Nothing reads it to decide anything.

## A tranche that does not come clean

A tranche that does not come clean goes on in rounds until Bob says. He then chooses between two endings. It is merged with its flaws named, and no release is made from it. Or it is dropped.

Whether a tranche can end by a clean walk is unproven. Measured in Process3: no walk of either kind finished without flaws, and no tranche was merged into the main branch. Bob's reason for that is that Process3 kept adding tests. So for a process that does not grow, the chance that a tranche fails to come clean is unmeasured. Only the first real tranche can show it.

## Release

Any tranche that has ended can be released, on Bob's approval. First an install and an update are each run and confirmed successful. Neither is walked.

What installs and what updates a product depends on where it is hosted. The design gives that in the same table for each hosting provider (part 6).

The motivation is in `bob_words_14nov_b.md`: a release may follow a completed tranche, so a release always rests on work that was tested and walked.

Claude's reading, not yet confirmed by Bob: the install and the update run on a development account. "Successful" means the installer or updater finishes without error and the site it produced starts. On a failure no release is offered, and the fault becomes work in the next tranche.

An urgent fix is a tranche whose content is that fix alone.

Built files are never committed. They are built at each walk, each deployment and each release.

ARCH prepares a release and waits for Bob's approval. Measured: no release of any kind was made in Process3. So the release path is unproven.

Promoting a release to installed sites, rolling one back, and support belong to the product's own procedures and to Bob. The process supports them with short written procedures, kept for each product (part 1). With each release it writes what changed, what the update does to stored data, and how to go back. Bob, or whoever runs the product, carries the procedures out.


# [file] 08-changing-the-process.md

# Process4 Foundations, part 8: Changing the process

Length: 85 lines. Last section: "What Process4 does not carry".

## Only PROCESS changes the process

The process is changed in one place, a separate lane called PROCESS, and Bob works with it directly. His statement of this is one paragraph in `process4/owner_words/bob_words_14nov_b.md`. Its points are these.
