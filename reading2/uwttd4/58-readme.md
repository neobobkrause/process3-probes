## Flow control

Bob, 5 Nov (Build Plan R10), as the coordinator's audit of PR 140 set it: the cap kept used, live.

- Idle capacity between sweeps (scheduled tasks run at most hourly): every p3 command any role runs, before its act (not in GitHub Actions, whose token cannot write the state branch, so the gate's own runs are left to the jobs' and BOB's commands around them), evaluates the sweep's idle-capacity condition when the last row of `metrics/sweep.jsonl` is over 5 minutes old, on the live count the last sweep measured within 65 minutes, against the open layer's startable jobs (one read of GitHub's pull requests into the layer) (none: no judgment, the cap being the account's), and records a `check` row beside the sweep's, one per 5 minutes however many sessions race (only the run whose row lands prints). On an alarm it prints `IDLE CAPACITY ...`, the wake for BOB (from the job, `job-<id>`, when a job's command ran it), and the line for the coordinator. The hourly sweep stays the backstop.
- Working against occupied: with `--sessions`, the flow line splits live job sessions into working (running) and waiting (idle), each waiting one with what it waits on (`gate`, `merge`, `block`, `BOB`, or `archive` for a done job's idle session); the sweep row records both counts.
- The release path first: next work tags the modules named in `release_path` in `process/config.json` and the open round's layer and found work; debt (a file whose unmet marks are all base-red found marks) is tagged too, last.

## The completion round

The completion round has its own file (PLN-4; `completion_file` in process/config.json), and reopens after the plan's last layer go through it (PD-12). It runs on the layer machinery without editing the product's layer map (C33, coordinator, 8 Nov). Once every layer of the map (and every earlier completion layer) is closed and the completion file on the tranche has open items naming a module, the next layer number past them is the completion layer:
- `status` and the idle checks name `layer open <n>` (the completion round, <file>) as next.
- `layer open <n>` cuts `layer/<n>` from the tranche and records its modules, the open items' (file order, each module once), on its open row (`completion: {file, items, mods}`). Every layer read takes that row as the layer's line.
- A whole-product item starts no job: it stays open until it is ticked or deferred by hand, and tranche close waits on it. An item naming no ledger module, or a line not in the item form, refuses the open, naming it. A deferred item is not opened.
- `layer jobs` lists each module as `job start <m> --reopen "<item id>: <its words>"` (two items on one module make one job, their words joined). The job runs on `layer/<n>`, and publish, land, the layer gate's cover and `layer merge` work as for any layer.
- `layer merge <n>` first pushes one tool commit onto `layer/<n>`, `Tick completion items of layer <n>: <ids>`, flipping `[ ]` to `[x]` on the open items of modules complete on the layer (a module deferred after a land keeps its item open). If the tranche's completion file differs from the layer's other than by ticks (BOB ticked a whole-product item there), it refuses and names `layer sync <n>` first; layer sync takes the tranche's completion file. The layer PR carries it into the tranche, and the round close runs as at any layer merge.
- An item added to the completion file after the completion layer opened, for a module that layer does not hold, joins that open layer (PD-14, coordinator, 8 Nov; C35): `layer jobs`, status and the idle checks list `layer join <id> --why "<items>"` beside the layer's starts; the join's row carries the module's open items, so it starts as `job start <id> --reopen "<items>"` on that layer, the layer merges only once it lands, and the merge ticks its items. A later item for a module already in that layer (its own, or one that joined) joins it the same way (PD-14 (i)): `layer join` writes an item row, the module is not started again with all its items' words, a land of a job started before the row does not do the new item, and the merge ticks it only after a land that did. Any other join still goes to the next layer to open, refused when none follows. An item added on the tranche makes the merge's tick wait for `layer sync <n>`, which brings the file in.
- The layer gate covers a change to the completion file only when it comes from such a titled commit, numbered as this completion layer, that changes that file alone, only `[ ]` to `[x]`, on this layer's own open, not deferred items whose module has a verified land on the layer's chain. Anything else is a finding.
- A reopened module's land notices its users from its map layer on, as a joined module's does; the census keeps reading the map's layers; status's completion items name `layer open <n>` or `layer jobs <n>`. `job start` tries every layer listing a module, newest first, and reads the state branch first.

## Development releases

`release` in `process/config.json` (no default; without it `release dev` is refused):

| key | what |
|---|---|
| `checks` | the full regression and whole-product checks: a list, each an argv (`["npm","test"]`) or `{"name","argv","timeout_minutes"}`; each run from the root within its own timeout |
| `assemble` | the argv that writes the release files to `out` |
| `out` | the directory, relative to the root, the assemble writes; every file in it is attached to the draft (two files with one name fail the run) |
| `full_history` | `true` to check out the whole history in checks and assemble (an upgrade test that reads released versions); default a depth-1 checkout |
| (body) | the draft's body carries the release note's fields: the process pin, the product sizes (`p3 size --out`, in job checks before any product code), the checks' results, and the platform rows the pin's `ranges.json` names (none yet); development only, never a certification |
| `sign_secret` | the name of the repository secret holding an Ed25519 PEM private key; default none, no signing. The value is never printed or written |
| `timeout_minutes` | the default per check and for the assemble; default `suite_timeout_minutes`, else 20 |

Everything this releases is for development only (Bob's word, 3 Nov): no public release, no production environment, no promotion to installed sites.

## Development deployments

`deploy` in `process/config.json` (optional; without it `deploy dev` is refused). Development deployments only, in the product's own Cloudflare account under Bob's approvals:

| key | what |
|---|---|
| `slug_prefix` | must begin with `p3dev-`; the default slug is `<slug_prefix>l<layer>` |
| `dry_run` | an argv, or a list of argvs; each must print `guard_line` |
| `deploy` | an argv, or a list of argvs, run once the dry run passed |
| `walk` | an argv, or a list of argvs, the walkers, run once the deploy passed |
| `guard_line` | the line each dry-run step must print on its standard output, as a line of its own (trimmed), for example `p3dev guard: passed` |
| `timeout_minutes` | per step; default 30 |
| `walk_reports` | the files the walk writes, kept on the state branch under `deploys/<slug>/<UTC time>/`, masked; one over `max_file_bytes` recorded as not stored; report.json's counts in the row |
| `internal_walk` | required (Bob, 7 Nov: "Required, tool-started"; setup check's `internal-walk` is missing without it), or Bob's recorded exemption `{"none": "<reason>", "by": "Bob, <date>"}` (his word only; setup check reads it `not configured: <reason> (<by>)`); `{"run": argv or argvs, "timeout_minutes": the whole run's, default 30, "reports": [paths]}`: the product's internal walk (offline, for example Miniflare on loopback; Bob, 4 Nov), run at each round close by the round-close run, never a gate. Where it is set, the round-close run is this walk alone (`walk round`), and the deploy, its dry run and its live walk run only as the release deployment, once a round's internal walk is clean (BD-R1, C43); where it is not, the round-close run is `deploy dev` |

`walk` in `process/config.json` (optional; C43, Bob, 8 Nov: "run as many walks as is reasonable to speed up the walking process. (But be careful that there aren't too many external walkers to cause the Cloudflare system to exceed limits of the account."): how many walkers run at once. The tool hands each walk stage its count as `{concurrency}` in its argvs and `P3_WALK_CONCURRENCY` in its environment; the live walk also gets `P3_WALK_BROWSER_STARTS_PER_MINUTE`. How the walkers use them is the product's.

| key | what |
|---|---|
| `internal_concurrency` | the internal walk's count; default the runner's CPUs (`os.availableParallelism`) |
| `live_concurrency` | the live walk's count; default the smaller of the runner's CPUs (each walker is a local Chromium) and the cap, never more than the cap: 85% of Cloudflare's published concurrent browsers per account for the plan (Browser Rendering limits, read 9 Nov 2026: Free 3, Paid 200, so 2 or 170); browser starts at 85% of the new-browser rate (Free 1 every 20 s, Paid 3 a second, so 2 or 153 a minute). Workers and Durable Objects publish no limit a walker count reaches first (`tool/lib/walkcfg.mjs` cites the pages) |
| `cloudflare_plan` | `"free"` (default, the tighter) or `"paid"`, the product account's Workers plan |
| `ai` | `false` (default) or `true` once Bob has an AI account configured for the live walk (BD-R5, Bob, 9 Nov). Passed as `P3_WALK_AI` (`0` or `1`) to both walks, and an argv element `{assistant}` becomes `--assistant` with it on and is dropped with it off (the product's journey-check takes `--assistant`); the live walk's row records `ai`, and the walk's `not_walked` lists the journeys the report's `notes` say were `<name>: not walked` (journey-check's record of an assistant step it skipped), or else those it marks `ai: true`. A release walk clean with AI off is clean for the non-AI journeys only: the release path then names Bob's act (the AI account, `walk.ai` true, the release walked again), and `tranche close` waits for a clean release walk with AI on before the installer and site updates |

A development deployment is removed with `wrangler delete`. The product binds no Workers KV, so the deploy token carries no KV scope (`setup/conditions.json`, `deploy-token`), and `wrangler delete` may then exit with an error about Workers KV after the delete itself succeeded. Count that follow-up error as success only after confirming the script is gone: a read of `accounts/{account}/workers/scripts/{name}` answers 404 (or the script is absent from the account's list of scripts). Any other error, or a script still there, is a failed removal.

## Onboarding

Onboarding is the plain pull request into the tranche that adds `process/config.json`. The tool makes no exception for it (build J): a config that sets `process_repo`, `tranche` or anything under `"approvals"` (its `owner` included) to other than the defaults needs Bob's word, as at any other time. Checklist line for Bob to confirm once per product: the repository is owned by a person, not an organization and never the sessions' own account; `approvals.owner` names that person (or is left out, meaning `neobobkrause`); the tranche is named `tranche` (or Bob sets another name himself); and `process_repo` is left out or set by Bob.

## The approvals block

A commit that changes the approvals block is accepted only when it is the owner's own commit through GitHub's website, or leaves the block equal to the one the owner's website commit last set on the tip of `origin/main`, `origin/<tranche>` or the base (one `git log` of the file per ref finds the commit that set each tip's block; of those that are the owner's, the newer by committer date counts). So a merge of main into the tranche that puts back main's older block is refused. A merge may also carry the block the owner had set as one of its parents saw it, when the head ends on the current owner block, so a job or release spanning two owner edits passes. A commit already on main or the tranche is not judged again. The setup check reads the same rule: the tranche's block must be that block, so an owner's website edit on main alone reads missing, and stops job starts, until main is merged into the tranche. A product whose block was never set by an owner website commit has every merge that carries a block refused until the owner sets it once on the website. An owner's approvals pull request is brought up to date by the owner on the website, not by a session's merge, which is refused until the owner's block reaches the tranche.
