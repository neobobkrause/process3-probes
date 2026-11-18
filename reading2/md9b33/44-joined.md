# [file] account-switch.md (continued)

2. If it refuses, each failed check names who fixes it; most are Bob's (the GitHub connection, the account, the GitHub App). Tell Bob those words, wait, and run it again. Never push before it passes. If only the approvals changed, and the change is Bob's own for the new account, run it again with `--approvals <the tip's hash it printed>` on his word. Then run the session checks it prints, and send Bob any failure with its fix.
3. Once it passes, do its acts in order, each its own command:
   - (a) The coordinator's id merged into process/config.json, on each product and on the probe.
   - (b) `switch quiet`, until it exits 0.
   - (c) ROOT, then from ROOT: the handover for BOB and `start watcher --replace`, with the old ids.
   - (d) The tasks, bound to the new sessions: the hourly flow check, the survival reads, BOB's and the builders' check-ins, and each `fresh` task as one again. ROOT's sweep and the watcher's daily task are made by their own starts. A task bound to a lane waits for (h).
   - (e) BOB restarts every recorded job, the release path first.
   - (f) In the layer flow, `layer jobs <n>` for each open layer, (the pin move moves each open layer's pin itself, PD-23). Without it, BOB's `status --role bob`, then each `job start` its `jobs to start` lists.
   - (g) Messages to BOB stay in the record: `status --role bob` lists them by id, and their text is on the state branch. The others are delivered to the new sessions.
   - (h) Each lane with a seat (the triage seat too): `lane start <lane>`, with `--replace <old id>` only if it says the seat is still held (ROOT's sweep usually ends it first); then `--record <new id>`, its open asks, and the tasks bound to it.
4. Old sessions cannot be messaged or archived from the new account. Bob archives them on the old account once the new ones run, and deletes the switched-off tasks there.

## 5. If the process's GitHub account is suspended: the reopen route

Problem class C6 (the process's GitHub account, 6 Nov): GitHub hides every pull request a suspended account opened, with its comments and reviews, from everyone. Its branches, commits, tags and the state branch's rows stay. The switch above moves the Claude account. This route moves the GitHub account and recovers what it held.

1. Bob connects the new GitHub account (2.1, 2.2). No session pushes before `switch in --preflight` passes on it.
2. Each job whose pull request is hidden: its branch on origin holds its work. The coordinator first opens a new pull request from the same head branch (`job complete` needs an open one). Then the job's session (BOB restarts it if it ended) runs `job complete` again, which marks it ready, and the gate runs on it.
3. Take in by branch name, never by a hidden PR's number. `job start --reopen` can call an attempt abandoned when its merge PR is hidden: check the branch against the tranche before giving it a new branch.
4. A layer retest opens its own pull request; a hidden earlier PR does not stop it.
5. Lead times and the take-in carry read hidden PRs as unmeasured or empty. Note it in the layer report; nothing is lost from the state rows.
6. Open layer, tranche and pin-move PRs: open a new one from each one's branch, with the same title and body (a hidden PR cannot be reopened).

The full list of tool reads a hidden PR affects is in notes/github-pacing.md ("Risk: GitHub hides every pull request").

Prevention for the class: what the process needs to know about a pull request is recorded in git (the state rows, the land row and the gate run's artifact: C13), never only in the pull request's comments. Then a hidden pull request costs a reopen, not the record.


# [file] layer-branch.md

# The shared layer branch

The only flow: the merge train was removed (Bob, 6 Nov, as the coordinator relayed it). A product's `process/config.json` says `"merge_strategy": "layer"` or leaves the key out; any other value is refused. A product with no layer map (`layers_file`) has no layer, and its jobs keep the tranche as their base. Design: the note "Shared Layer Branch" (Bob, 5 Nov), with his rulings: no gate or test run at layer close; a rescheduled job halts its run and restarts; the tool lists the jobs, BOB starts them; at layer merge the layer's checks run, but no module suite. One small PR per publish, landed by the merge tool on a green gate, is the note's recommended implementation choice, which the coordinator adopted.

The steps, with who runs each (`p3` is `node .process/tool/p3.mjs`):

1. BOB: `p3 layer open <n>`. It cuts `layer/<n>` from the tranche tip and lists the jobs that can start. It refuses while an earlier layer opened this way has not merged.
2. BOB: `p3 layer sync <n>` after every pin move made while layer n is open, before any job in it lands (SLB-12, Bob, 6 Nov). A pin move does not reach an open layer branch: the gate and the record check run the base's own tool, so `layer/<n>` keeps the tool it was cut with. Layer sync merges the tranche into `layer/<n>` by a tool-made pull request and lands it through the merge tool on a green gate. In a conflict it takes `.process` and the process's shims from the tranche and keeps each ledger entry as the layer has it; any other conflict refuses. It records a `sync` event. While `layer/<n>`'s pin differs from the tranche's, `layer jobs` and `status --role bob` lead with "run layer sync <n>", and `layer merge <n>` refuses unless the pin moved only after the layer's last land.
3. BOB: runs each `job start <id> --live <n>` line from `p3 layer jobs <n>`. `status --role bob` lists the same lines under `jobs to start`. No other session creates a job. Each job branch is cut from `layer/<n>`, and its draft PR goes into it.
4. The job: works and pushes on its own branch. When its suite passes, it runs `p3 layer publish <id>` with job complete's flags. Publish brings the branch up to the layer tip and refuses any file outside the module. It runs the module's checks and suite, and marks the PR ready. While the suite runs, it reads the state branch every 30 s. A reschedule for the module halts the run, and publish starts again on the new layer tip.
5. BOB (the merge tool): `p3 layer land <pr>` once the gate on the PR's tip is green. There is no combined re-test, even when the layer has moved on in other modules. The land is refused when the run behind it started before a provider's newest interface change. At the land, the provider's interface is compared before and after. Three triggers count, and each is recorded in the reschedule row: its exports (`exports`), the text of its Public / Provides section (`provides-text`), and a changed test of the provider that names a Provides requirement id (`provides-test`). The last catches a changed answer shape that the exports do not show. A change does two things: it reschedules the provider's users in this layer (BOB delivers the message the land prints to each one whose job is open, with send_message priority now; the tool sends nothing itself), and it leaves a provider notice for its users in later layers.
6. BOB: `p3 layer status <n>`, then `p3 layer merge <n>` when every module is complete or deferred, no reschedule is outstanding, and no publish PR is open. First the layer's checks run on the layer tip: each entry's checks, the generated rows built, and every committed generated path regenerated. A red check, or a regenerated file that differs, refuses the merge. A generated row's verify failure refuses it only when the row's paths, or a module the failure names, belong to the closing layer; any other is printed for the module it names, which BOB records there as a found mark (`p3 found`), and the merge goes on (SLB-7). A differing generated file is fixed by BOB's plain pull request into `layer/<n>` (`merge --plain`); the layer gate leaves generated paths to these checks. No module suite runs. Then one PR goes from `layer/<n>` into the tranche. Its gate runs no suite: it checks that each module has a verified green land on a head that held its providers' interface changes. The merge also writes the layer's close row.
7. Anyone: `p3 layer report <n> [--tool-from <process3 sha>]` gives the trial's measures. These are gate runs per module, hours from open to merged, reschedules per module, how often a reschedule changed the user's result, the runs halted and the minutes they cost, and the tool lines added and removed.

Work outside the open layer (the coordinator's ruling, 6 Nov 2026, R12) joins the NEXT layer to open, in order, never the tranche directly. A module whose layer is behind the open one, such as a notice-affected user in a merged layer or a found-mark reopen of a COMPLETE module whose layer merged, has its act printed as `p3 layer join <id> --why "<the work>"`. Status, the notice slots and a refused `job start` all print it. The join is one row on the state branch (`layerflow/<n>/join/<id>.json`). `layer open <n>` lists the joined module in that layer's jobs, a reopen for a COMPLETE one. Its job is cut from `layer/<n>`, and the layer merges only once it lands. A module of a later layer than the open one is owed to its own layer: status lists it apart, even when open_by "uses" reads it as ready; only an early start (below) starts one before its layer opens. A job PR still open into the tranche is the train's: status names it, close it unmerged and restart the module in its layer (no `--restart` path into the tranche).

Early starts into the next layer (Bob, 6 Nov 2026, R14: "Why didn't the early starts launch before layer 8 closed?"). While layer n is open, a module of the next layer to open whose providers have all landed or are COMPLETE (none in layer n working, rescheduled, deferred or not started) is listed by `layer jobs <n>` and status as `job start <id> --live <n> --early`, on idle capacity only, after layer n's own starts. The first early start cuts `layer/<n+1>` ahead from `layer/<n>`'s tip; each later one moves it forward to that tip, a fast-forward, since nothing lands on it before its open. The job's branch and draft pull request are on it, as for any of that layer's jobs. Until `layer open <n+1>` the branch takes nothing else: a plain start, `layer publish`, `layer jobs`/`layer status <n+1>` and `merge --plain` into it are refused. The open brings it up to the tranche tip (again a fast-forward) and lists the early module as working while its draft pull request is open; one whose start did not finish is listed again, and `job start` resumes it. Each early start is one row (`layerflow/<n+1>/early/<id>-<t>.json`), and `layer report <n+1>` gives each one's rework: a reschedule (R8), a retest (R7), or a provider notice after its start, with the rate.

Door tests owed to a later layer (Bob, 6 Nov 2026, R6: B). Some modules' door tests need ops that only a later layer's modules declare. Investigation's acceptproposals and corpus-export's founder-only exportwhole both need op-declarations, op-grades, op-capabilities and store-assembly, which are layer 11. Such a module completes its behaviour in its own layer and does not wait. It names the door test in not-verified, with the requirement ids and the providing modules. That test is owed to the providing layer: BOB lists it in that layer's brief, and once the providers land there, the module's job is restarted for the door test alone. The layer order stays as it is. Deferring a door test this way is the rule, not a ruling each time.

The state is on the state branch, under `layerflow/<n>/`, one file per event: open, run, land, reschedule, sync, merged.


# [file] root-prompt.txt

# ROOT

Priorities first. The process exists to merge product behaviour that survives, quickly and cheaply. Caution is a cost, paid only against a measured failure or Bob's word. Build and do the smallest thing the work needs.
Your authority is Bob's standing approvals in CLAUDE.md on the tranche. Give each judged act (a session start, a merge, a push, an archive) its own shell command, never chained with another. If the judge refuses an act, never reword or reroute it: tell your coordinator its exact words.
