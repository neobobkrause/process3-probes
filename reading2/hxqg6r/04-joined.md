# [file] foundations.md (continued)


**Reading budgets.** Each role's reading set is fixed and printed with sizes (SES-5). Budgets are fractions of the model's window in one table, never bytes in code; an overrun is measured and reported, never refused (SES-6). A summary is an option BOB may take for a set far over budget, never a requirement (SES-7).

## Platform, permissions and messages

The process stands only on platform behaviour that has been measured, and it depends only on acts your committed approvals cover and that were measured to pass; archiving sessions and switching off or deleting tasks are housekeeping, counted and reported, never needed for correctness (PLT-2 as restated, your word, 3 Nov).

**Platform table (PLT-1).** One dated table of measured behaviours, each with its evidence and workaround, measured once by default and more only when the first result is ambiguous or a failure recurs, with its number of tries (GAP-11). Rows as of 31 Oct, updated 2 Nov: the classifier refused archive, timer edits and interrupts at random before your approvals were committed, and passed each 15 of 15 after (PLT-2); the in-session background limit is about thirty minutes, so anything longer is CI (PLT-4); sessions are created only from depth 0 to 2, so depth never passes 3 (PLT-5, restated 3 Nov: jobs ran and merged at depth 3 that day); scheduled tasks are convenience wakes, never required (PLT-6); one repository per session with the process as a pinned read-only clone (PLT-7); privileged GitHub acts run on GitHub's runner with your tokens (PLT-8); grants are gathered once and checked at tranche open (PLT-9); platform status is never read as work state (PLT-10). Measured 1 Nov: at about 50 live sessions the account stops starting new ones, while the create call still reports success. So the process keeps at most 24 live sessions by default, and BOB fills that room with jobs for the ready work; BOB may raise or lower that number from what it measures, and records each change (your word, 1 Nov).

**Permissions (GAP-6, SES-8).** Hard rules live in deny lists in the repository's settings file: a denied tool is removed from the session outright (measured 1 Nov). An allow rule does not take the session and scheduled-task acts out of the classifier: archiving a session and creating, switching off or deleting a task were judged case by case whether allow-listed or not (measured 1 Nov). Every role runs in auto, because no locked-down (dontAsk) session can exist on the account: the app offers only Auto, Accept edits and Plan, and an auto parent cannot create a dontAsk child (measured 1 Nov). So the process depends only on acts measured to pass reliably (PLT-2). After three refusals in a row a session stops and waits for a person (measured 1 Nov), which status and the sweep must catch. Auto mode also hands a session to a person after 20 refusals in it (Anthropic's docs), so the tool counts each session's refusals and status prints REFRESH at 10 (SES-4); a fresh coordinator reached 2 in its first minutes (measured 3 Nov). Standing grants are anticipated at product setup: every grant the process will need through a tranche is obtained and recorded before it is needed (PLT-9). A grant found missing while the process runs is asked for, obtained, and then recorded as a standing grant, never granted once and forgotten. The start table names model, effort and permission mode per role. A scheduled task's fresh session runs in Auto (measured 1 Nov).

**Your standing approvals (your direction, 1 Nov).** Your broad standing approvals are the one policy for every act at every depth; the deny list holds only hard prohibitions (GAP-6, replacing PLT-3). They are recorded once, in your own words, and reach every session at every depth and in every successor, and the start check confirms each session loaded the tranche tip's, so that acts you approved are judged as approved as consistently as the measurements allow. They live only where your own hand puts them: committed by you to each repository's CLAUDE.md. They cover development releases in the product's own account (your word, 2 Nov); a public release stays yours. There is no routine-work environment description for the judge: your committed CLAUDE.md was enough on 1 Nov, and the environment comes back only if refusal counts call for it (your word, 1 Nov). No session writes, edits or relays them, because the judge refuses that (Instruction Poisoning, measured 1 Nov), and a check fails any change to the approvals block not made by you through GitHub's website. Every refusal of an approved act is recorded with the act, the session's depth and the channel the approval reached it by, counted per tranche, tried with a handful of approved acts at the depths they run at, at each tranche's open before any job starts, and re-tested at each model release. Two kinds of refusal are kept apart. An act the judge refused is never reworded or rerouted to another session; it is recorded and raised. An act a session's own model declined because its START did not name it is a missing instruction: BOB may start a new session whose START names the act and why, only if the act is within your standing approvals and the plan, recorded as a decision with the decline that prompted it; if that session also declines, or the judge refuses, it stops and comes to you. STARTs name every act the work is expected to need, and outward acts (sessions, tasks, merges) belong to BOB and ROOT, whose starting prompts list them, so this stays rare (measured 1 Nov: jobs took in-repository work from their coordinator's messages, and declined unforeseen outward acts).

**Your approvals cover every act of the process** (your word, 2 Nov). Consent quoted in a session's starting text does not count: in sessions another session started, the session's own model declined every merge asked of it (11 of 11), while with your consent typed in the acting session the judge refused none (0 of 21; both 2 Nov). So your committed CLAUDE.md is the one channel that reaches sessions you do not start, and the tranche-open check tries its acts at their real depth.

**Running unattended: six conditions.** A tranche can run without you watching (GAP-1) while all six hold.

1. Every session's START or starting prompt carries its authority: what it may do, and who its coordinator is, through the address file in git. Your approvals, committed in the repository's CLAUDE.md, cover what no START foresaw: with them a session acted on its coordinator's unforeseen ask 10 of 10 times, without them 0 of 10.
2. Nothing needed for correctness depends on an act the judge has refused under your committed approvals; archiving sessions and switching off or deleting tasks stay housekeeping (PLT-2 as restated).
3. The sweep runs on its schedule and catches a session stopped by three refusals in a row. Its parent may try one interrupt and message, but replaces it when it stays stopped: a job from its branch and pull request (JOB-6), BOB by handover, ROOT by the watcher. The acts it was refused are recorded and raised to you, and the replacement's START does not name them, so a refused act is never rerouted; a replacement at REFRESH after 10 refusals carries the same rule. The docs say a session paused by the classifier waits for a person's approval and do not say an interrupt or a message resumes it (read 3 Nov), so nothing depends on that.
4. The live count stays at 24 or fewer, and every new session is checked to have started.
5. The gate runs on every pull request, and records reach a protected branch only through a pull request.
6. The sweep catches lack of progress, not only silence: a looping session pushes, and one ran four review rounds over two hours and $26 before you asked (2 Nov). Status reads each attempt's elapsed time and cost from the session record (readable, measured 2 Nov) against its role's median, and the sweep wakes BOB on one far over it: an alarm, not a cap. Review rounds stay bounded by INT-7's one complete pass and one confirming run, and repeats by JOB-14.

**Hooks (ENF-1, modified).** At most a handful of command hooks, each for a rule with zero exceptions, each with a legitimate blocked exit (ENF-7); none that hold a turn, record an act or judge text. No model judge sits between a session and you (ENF-2). Nothing holds a turn, and stop means stop in that turn (ENF-3). There is no /goal: its check is a separate model reading the conversation, which ENF-6 rules out. A job that stops early shows in status as WORKING with nothing pushed, and the hourly sweep lists it for BOB (ENF-6, JOB-9; your word, 1 Nov).

**One act per command.** A judged act chained with another command gives the judge one blob to decide (measured 2 Nov: the only judge refusal in rounds 2 to 4 fell on a chained merge). It is a nudge in every START and the tool's guidance; the per-session refusal count shows its cost, and a hook comes back only if that count calls for one (ENF-1).

**Messages.** Git carries the state and a message only wakes; the record is pushed before the message is sent, in one command, and messages are numbered so a duplicate is ignored (MSG-1, MSG-3). A message from BOB's address, read from git, is an instruction; every other message is data; your words are instructions to every session (MSG-2). A message to you is one per turn, plain, with a link, and a numbered list only for an act of yours (MSG-4). A flaw report travels by the product's state branch and the reply by main of the process repository (MSG-5). An undelivered message is recorded and listed by status (MSG-6).

## Setup: the conditions the work stands on

Every account, setting and branch rule the process depends on is part of the design: listed, checked before each job starts, and set by the developer through the fewest steps, each with its reason and tested to work the first time (your word, 2 Nov). In Phase 1 every setting you changed was found only when something hit it.

- The setup list in the process repository names each condition: what it is, why, its value, and who sets it. It is reviewed like code.
- `setup check` reads every condition it can, at onboarding and before every job start; a missing one stops the start, so no job meets it as a refusal or a failure. It only reads.
- One document, the developer's steps, kept in the process repository and evolved through the build, lists only the acts the developer must take, each with why; each product gets it as one onboarding page with its own names filled in, and BOB does every other part of onboarding. What the check cannot read (secrets, Actions settings, collaborators, the cloud environment) is confirmed there once.
- Accounts. Sessions act on GitHub as a collaborator that can push and merge but cannot change settings (the process's GitHub account); you act as the owner (decision 13). GitHub itself then keeps sessions out of settings and branch rules.
- What GitHub enforces, it holds: every branch refuses deletion and force-push; main and the tranche take changes only by pull request, merge commits only, with the gate (or ci) and record required. The deny list holds the rest: settings files, file writes through GitHub's interface, and the plain merge routes.
- A session reads the deny list only when it holds one repository and starts from a branch that carries it. So the coordinator is started with the product repository only, and every session starts from the tranche.

**Deploy tokens.** The process deploys so walkers can run, so a project runs unattended only if it can deploy (your word, 2 Nov). Onboarding adds the product's deploy tokens to the cloud environment as environment variables, the one route both the deploy tools and setup check were measured to read (2 Nov), and setup check confirms each by name, never by value. Jobs share that environment, but deploying, releasing and acting on a live site are BOB's acts, not a job's (decision 14).

**What the checks defend against.** The tool's checks hold against mistakes (a session that edits a settings file, touches another module, resolves a merge with an old copy, merges something red or stale, or moves the pin somewhere unreleased) and against outsiders' fork pull requests. A session that sets out to defeat them is held by walls GitHub enforces and no session can change: settings and branch rules, undeletable branches, pull requests with required checks into main and the tranche, and your approval for production. A reviewer's finding that needs a deliberate attack is a known limit, not code, so the tool does not grow without end.

**Moving accounts.** Because nothing durable lives in a session, development can stop under one Claude account and restart under another on one plain request (your word, 2 Nov; GAP-8): the process retires and recreates sessions and tasks, the developer recreates the cloud environment and Claude's GitHub connection from a page the process writes, and each open job restarts from its branch and pull request (JOB-6). The procedure and its rehearsal live in the Build Plan.

## Maintenance, certification and the two health metrics

The process is pinned per tranche, changed only by a recorded act, and judged by two numbers neither earlier process measured.

**Versions.** A tranche names the process commit it runs on; every session starts at the tranche's tip by its commit and, BOB, ROOT and the watcher, at each later wake, first move to the tip and compare its approvals with those loaded at start (a job stays on its own branch); its first command then verifies the pin, HEAD and the approvals block against the tip; if not, it acts on nothing, reports both SHAs and ends, and its starter starts a fresh one. Approvals load only at a session's start, so a change to them is taken up by replacing the long-lived sessions (MNT-4; a start by branch name landed on an old copy, 2 and 3 Nov, and a start by commit landed fresh, 1 of 1, process3 PR 36). Development under the process is development of the product, not of the process: a process flaw serious enough pauses the product's development, the process is fixed separately, and the product resumes on the fixed version (P3); during Process3's own first build, changes are expected. A blocking flaw is fixed and adopted by one recorded act that moves the pin, and no job restarts (MNT-5). A non-blocking flaw waits for the next release and the product's next tranche (MNT-6); during Process3's own first build, process fixes may land while a product's tranche runs, each recorded against the Ledger line it serves (GAP-9), and from the first certified release MNT-6 holds as written (Bob's answer, Keep and Drop page, 6 Nov 2026, AUD-6). A flaw report is one command from any session, answered on main, never fixed in place (MNT-7). A change to the process is built with the last released version (MNT-3).

**The process under itself (MNT-1, modified).** The process repository has its own ledger, requirements, jobs on branches with tests and review, and tranches. It is governed by this thin process, not by a twelve-module architecture of its own.

**Certification (MNT-8, modified).** Certification means ready for general use and is a long-term goal, in your words. The road there: a shadow run of one representative slice of the product, then the live first tranche as the certification, with the overhead and health metrics measured. Flaws found in the shadow are fixed before release and the run repeats from the step that found them (MNT-9). Each release names the platform rows and product sizes it ran at, and onboarding measures a new product against them (MNT-10, SHM-3). Nothing is declared in force on the day it is written.

**Re-test per model (MNT-11).** At each model release and each Claude Code version change (reported refusal rates moved several-fold between versions), components are removed one at a time and the result observed; what the model no longer needs is retired. The approval test reruns too: the tranche-open check, and an act a START does not name, asked by its coordinator, with and without your CLAUDE.md.

**Measurement.** Per tranche the process reports commits by purpose, sessions per job, gate runs per merged job, restarts and tokens by role (SES-11), and the tranche report states elapsed time, work done, deferrals, cost, the overhead share, BOB's idle time while work was ready, and the minutes it took of yours (PLN-6, GAP-12). Usage is read by an allowed route or named unmeasured (SES-9). The two health metrics from the first tranche (SES-12):

- False-done rate, counted per job (one module's work in one layer): the share of COMPLETE claims refuted by independent re-verification, a red suite or revert check in the gate's run of that attempt (SLB-9; PD-21).
- Cost per surviving job: tokens or dollars per job (one module's work in one layer) whose work is still in place after a two-week revert window (Bob's answer, Keep and Drop page, 6 Nov 2026, SLB-9).

**What a product receives (SHM-1 to SHM-5).** The short CLAUDE.md, one skill, a settings file with the permission lists and no hooks today (ENF-1 allows a handful), the gate workflow, and the prune workflow, with a drift check. Shims regenerate on GitHub's runner and merge by PR. A mid-tranche product converts by one command. Session setup is the product's own script, run by the first command.

**Where the process stops.** The process owns everything that can be proven in git and CI, and nothing that happens on a live site. A product is a release, an installer and a site update, and those have three owners.

| What | Owner | Why |
| --- | --- | --- |
| Installer and updater as code | The process | Modules of the product with requirements, tests and an owner; built by jobs and proven by the gate like any other module |
| Release packaging | The process, as the Release workflow | Building the installer artifact and update manifest, signing them and publishing them as draft releases is deterministic CI work, the last thing the process can verify |
| Rollout and operations | The product's own procedures and tools | Promoting an update to installed sites, staged rollout, monitoring, rollback and support act on live systems whose state is not in git; those acts are yours, given through the protected GitHub environment that names you as required reviewer, or a written procedure's run on that approval |

Two interfaces join them. Going out: the release artifact and its note, with version, changes, and the platform rows and sizes it was certified at (MNT-10). Coming back: a walk's findings, which end the round; they enter as ledger entries against the modules they name, by the route for work found elsewhere (PLN-3), and the next round fixes those modules layer by layer. The internal walk is required, and the act that closes a round starts it itself, never between layers (your word, 7 Nov: "Required, tool-started", at "Round close only"). It is the round's last step: a round whose internal walk finds flaws ends there, with no deploy and no live walk, and the deploy and its live walk come only once a round's internal walk finds none, as the release deployment and its walk (your words, 8 Nov 2026: "the internal walk would be the last step of a round, but the live walk would only run once a round completed without any flaws identified in the internal walk"). The tranche ends in one order (your words, 8 Nov 2026, BD-R1): "This successive set of rounds continues until an internal walk doesn't find flaws, the release deployment happens, and the walk of the release also doesn't identify flaws. When the release walk is clean, the installer is updated for that release, then the [product's] website is updated to refer to the new install, and that ends the tranche." The process prepares those two updates and runs them only through the protected GitHub environment that names you as required reviewer ("Process, on my approval", 8 Nov 2026); tranche close refuses until a clean internal walk, then a clean release walk, are recorded, then names the installer update and the site update, in that order. A development release stops as a draft, deployed only as a development deployment in the product's own account, and the Release workflow runs an install-from-scratch test and an upgrade-from-previous-release test as release-tier fixtures before it does.

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

The two health metrics of the previous section are measured from day one and have no decision date; they are the standing judge of every other line.

## Open tensions to settle

Four pairs of decisions pulled against each other. All four are settled, the last two by your word on 1 Nov.

1. **Who creates BOB.** SES-1 moves ROOT's session creation to a scheduled task, while SES-2 keeps the two-phase handover, which needs a party that receives the old BOB's messages and repoints the address. A scheduled task cannot answer a message. Settled on 1 Nov: ROOT stays a session for BOB handovers, and with the sweep and the watcher described under Roles it creates and refreshes BOB.
2. **Whole-product checks.** Your ARC-4 note moves whole-product checks to release or your request, while INT-4 as kept says a layer closes when the checks pass once over the product. Settled on 1 Nov, and restated by Bob's answer, Keep and Drop page, 6 Nov 2026, SLB-7: INT-4 reads that a layer closes when every job is complete and the layer's checks pass; module tests do not run again at close; whole-product checks run before a release; the next layer starts at once.
3. **Hooks in the shims.** ENF-1 as modified allows a handful of command hooks, while SHM-1 as kept says the settings file carries no hooks. Settled on 1 Nov: SHM-1 carries only hooks ENF-1 allows, and the drift check fails on any other; today there are none.
4. **BOB as hub.** Settled on 1 Nov: BOB routes requests between spokes and does not translate every exchange. It explains toward you, describing each decision that is yours with enough context and in words you understand. What remains to measure is the routing share of BOB's context after the first layer.


# [file] probes-pin-for-bob.md

# Probes pin move: prompt for a session Bob opens

Paste everything below the line into a new session on neobobkrause/process3-probes, branch tranche.

---

# Pin move: neobobkrause/process3-probes to process3 a6bd8f11de

You are a short session that moves neobobkrause/process3-probes's process pin (`.process`) to process3 commit `a6bd8f11deba44faba3bc5aaea95e81129d0d966` and ends. Why: C40 (product-neutral process3, split ledgers) with C41/C42 (process/ root, one repository per session). Bob's standing approvals in CLAUDE.md on the tranche are your authority. Give each judged act (a push, a merge) its own shell command. If an act is refused, never reword or reroute it: send its exact words to `session_018BhcedocxexhtJW2Rz2gdo` with send_message and end.

1. `git fetch origin tranche --depth 1`, then `git checkout -q -b p3-pin-work FETCH_HEAD`, then `git update-ref refs/p3/pin-base HEAD`
2. `git submodule update --init .process`
3. `git -C .process fetch origin a6bd8f11deba44faba3bc5aaea95e81129d0d966` (no --depth: the merge tool reads the pin's ancestry), then `git -C .process checkout -q --detach a6bd8f11deba44faba3bc5aaea95e81129d0d966`
4. `git add .process`, then `git commit -q -m "process: pin a6bd8f11de"`
5. `node .process/tool/p3.mjs setup check --at HEAD`. For each gap, as it names: a workflow differing from or lacking the pin's shim, copy `.process/shims/<f>` to `.github/workflows/<f>`; CLAUDE.md lacking the process lines, replace the old process lines below the approvals block with those of `.process/shims/CLAUDE.process.md` ({tranche} as tranche), changing nothing in the approvals block. Commit, and run it again. A gap in `.claude/settings.json` (the owner's file), or any other gap: send it to `session_018BhcedocxexhtJW2Rz2gdo` and end.
6. `git fetch origin tranche --depth 1`, then `git checkout -q -b p3/pin-a6bd8f11de FETCH_HEAD`, then `git cherry-pick refs/p3/pin-base..p3-pin-work`. If the cherry-pick stops (a conflict, or nothing left to pick: the tip already carries the pin), `git cherry-pick --abort`, send `session_018BhcedocxexhtJW2Rz2gdo` what it said and end.
7. `node .process/tool/p3.mjs setup check --at HEAD` again: a gap, as in step 5.
8. `node .process/tool/p3.mjs pin check neobobkrause/process3-probes` (a pin move must not run beside another): if it refuses, send its exact words to `session_018BhcedocxexhtJW2Rz2gdo` and end.
9. `node .process/tool/p3.mjs github push origin p3/pin-a6bd8f11de --set-upstream`
10. create_pull_request {"owner":"neobobkrause","repo":"process3-probes","head":"p3/pin-a6bd8f11de","base":"tranche","title":"process: pin a6bd8f11de","body":"Moves the process pin to process3 a6bd8f11deba44faba3bc5aaea95e81129d0d966. C40 (product-neutral process3, split ledgers) with C41/C42 (process/ root, one repository per session)"}
11. `node .process/tool/p3.mjs merge <that pull request> --plain --as pin --no-review "a process pin move; the fix was reviewed in process3"` (a pull request that conflicts with tranche is refused at once: send the refusal and end)
12. It prints the wake of BOB: run that send as printed, then send_message to the address it prints, then `node .process/tool/p3.mjs send delivered <n> --from pin`. If it says no BOB is addressed, there is no wake: send nothing.
13. Send `session_018BhcedocxexhtJW2Rz2gdo` one message with send_message: the pull request, the merge commit, and the wake's number (or "no BOB"). Then end.


14. After step 13: on a new branch from the tranche tip, set `coordinator` in process/config.json to session_018BhcedocxexhtJW2Rz2gdo (change nothing else), push it with `node .process/tool/p3.mjs github push origin <branch> --set-upstream`, open a pull request into tranche, and merge it with `node .process/tool/p3.mjs merge <n> --plain --rounds 1 --reviewed "coordinator field only"` once its checks pass. Send the coordinator the pull request and merge commit.


# [file] 03-modules-jobs-and-the-notice.md

# Process4 Foundations, part 3: Modules, jobs and the notice

Length: 86 lines. Last section: "What the notice cannot do".

## Modules

A product is one ordered list of modules. A module may use only modules that come before it in the list. Every file has one owner module.

A use that points to a later module is an error in the design of those modules. It is fixed by reshaping them, not by allowing the use.

ARCH edits the list until every file has one owner and every use points backward.

Writer's reading: the single order is what makes the rest simple. It is always plain which module is the provider and which is the user, so news of a change travels one way only.

## Requirements

Each module has a requirements file, with a public part and a private part, under permanent numbers.

ARCH writes and rewords the requirement text. ARCH touches no code and no tests. The module's job marks a requirement met, in its own pull request.

A rewording that changes what the product does comes to Bob first. A rewording that only says the same thing more clearly is made, and Bob is told in the account after the round. Writer's reading: the dividing line is the one from part 1. What the product does is Bob's, and how it is said and built is the AI's.

A requirements file is kept under the measured maximum size (part 6). ARCH applies this as a rule. When a file nears the maximum, ARCH splits the module into two real modules. Nothing refuses a job or a merge on size.

## Jobs and slots

The plan of work is built around jobs running side by side, up to a number Bob can change. The number is eight by default, counted across the account. Bob changes it by telling the coordinator.

A module has work when a requirement in its file is marked not yet met, or when a walk flaw or a notice has been placed against it. Its job is ready when the module has work and no job open. A ready job does not wait for the modules it uses.

Ready jobs take free slots earliest in the order first. Only Bob's marked instruction puts a module ahead. Who takes a free slot has one right answer, so the process's tool decides it.

A job works in a draft pull request and writes only its own module's files, its tests among them. Bob's rule is that a job for one module is not allowed to change another (`process4/owner_words/bob_words_14nov_c.md`). The rule is held by the job's instructions. Bob's judgment of what he saw under Claude Code is that jobs kept to their own modules, and that stronger enforcement by role is useful but not essential (`bob_words_16_17nov_codex_development.md`).

A flaw a job finds in another module goes to ARCH, which passes it to that module's job. A job stopped by another module's flaw reports it, records that it is blocked, pushes its work and stops. Its slot is freed.

When a job completes, it marks its pull request ready and its module tests run. When they pass, ARCH merges the pull request into the tranche branch with the process's tool. There is no review and no act of Bob's. The slot is refilled in the same turn. Measured in Process3: with no event to prompt it, the directing session once noticed a finished job after 194 minutes.

A module's work is finished when its job merges, or when its notified job tells ARCH that nothing needs changing. Claude decided this. A job never merges, starts a session, deploys or changes the process.

A job that has failed two corrections is replaced by a fresh session. The fresh session's first task is to understand why the corrections were made, so that it can foresee the ones still needed. A job session that dies is replaced by one that carries on from the same branch and pull request.

## A change across many modules

Some changes touch many modules in the same trivial way and need no judgment. Bob's example is a change to a word table. Such a change is a mechanical edit. It is the only way a module's files change other than by that module's own job (`bob_words_14nov_c.md`).

Claude decided how: a helper in ARCH's session makes the edit as one change covering every affected module. It is merged once, at a time when no job is open. A module where the change needs judgment gets its own job.

This is unproven. It is rehearsed in the trial.

## The notice to user modules

When a job changes a provider, the users of what changed are told. The notice exists to save work.

Bob's motivation is in `bob_words_14nov_c.md`. If every user were told on every change, every change would cause every user to be rebuilt and tested again. He calls that very inefficient and unnecessary.

His view of what matters is in `bob_words_14nov_notice_session.md`. A change to what a provider answers does not by itself call for its users to be tested again. What matters is the interface: what the provider accepts and hands back, and the bounds of the valid values. If those stay the same, users are left alone.

The conclusions, as the design holds them:

- A module's interface is stated in its code together with structured comments. The comments say how the interface is to be used and what its bounds are.
- A build tool writes out the module's interface, from code and comments together, before and after a job's change. The notice is sent only when the two listings differ.
- Only the users of the entry that changed are told.
- For what a provider accepts, users are told only when the new interface cannot stand in for the old: something was removed, renamed, newly required or newly refused. Accepting more tells no one.
- For what a provider hands back, any change to an entry tells that entry's users.
- A change to the words that state a bound is a change to the interface.
- A module with no comments gets them as the first step of its next job, before anything else changes. They describe the module as it stands. That step sends no notice.
- A notified job checks only the changed parts, and runs only the tests that relate to them.
- When a notice is sent, and to whom, has one right answer. The process's tool decides it.

How a notified job picks the tests that relate to a changed entry is owed (part 10). Two smaller matters are also open: who is told when the product's list of modules itself changes, and what becomes of a module that says it uses another while none of its code does.

## What the notice cannot do

Bob's conclusion is that there is no reliable way to tell a change to an interface from a change to something else. His words are in `bob_words_15nov_main.md`.

So the notice is a way of saving work. It is not a guarantee. It will sometimes tell a user that needed no change. It will sometimes miss a user that did.

Nothing new catches a missed user. The user's own module tests catch it the next time that user's job runs for any reason. Or a walk meets the break, which is then a flaw and becomes work for that module in the next round. No test of users runs before a provider's change merges.

What is known about the method:

- Measured, in a proof on eleven made-up modules and 150 changes chosen to attack the method: it decides as its rules say, and it sent 2.6 times fewer notices than telling every user. Every miss that was recounted showed up as a failing test of the user.
- Judged, by AI workers reading Process3's record: about 74 of 2,707 notices sent there were needed.
- Unproven: how many notices the method saves on a real product.
- Unproven: any of it as part of a running process.


# [file] 09-permissions-and-platform.md

# Process4 Foundations, part 9: Permissions and the platform

Length: 100 lines. Last section: "The terms and their Claude Code constructs".

Much of this part depends on the harness. Each such statement is marked "Claude Code:". Where what carries a term on Codex is not yet known, a line marked "Codex:" says so. The list of those shortcomings is `process4/working/codex_shortcomings_to_fill.md`.

## What holds a rule

Process4 holds its rules with four things.

- **Each session's instructions.** A session is started with instructions that name every act it may take.
- **Bob's standing approvals.** One block of text, in his own words, says what sessions may do without asking him and what they may never do.
- **The list of forbidden commands.** It takes commands away from every session outright.
- **GitHub's own rules.** These are Bob's settings.

Bob's approvals and the list of forbidden commands are protected by the permission checker alone. Nothing enforced by GitHub is added for the process's own rules (part 8). Claude Code: the permission checker is that harness's own. Codex: what stands in for it is not yet known.

Most rules in the design are held by instructions. The rule that a job writes only its own module's files is one. Bob's judgment is that this is enough for ordinary work: under Claude Code he saw jobs keep to their modules, and he counts enforcement by role as important and useful but not essential (`process4/owner_words/bob_words_16_17nov_codex_development.md`).

The process's tool guards against mistakes. It does not guard against a session that sets out to defeat it. That is a known limit. PROCESS answers a finding that needs a deliberate attack with "no change", unless Bob says otherwise (part 8).

Claude Code: permission management is kept as Process3 ran it. Measured: about 700 merges with no review went through Process3's tool with no recorded refusal. Process4's own tool is unmeasured.

## Bob's standing approvals

The approvals are recorded once, in Bob's own words, and reach every session, at every depth and in every successor. Bob commits them himself. No session writes, edits or relays them.

Claude Code: the approvals are a block of text in the repository's CLAUDE.md, which Bob commits on GitHub's website.

Claude Code: consent that is only quoted in a session's starting text does not count. Measured in Process3, as recorded in the working Foundations: sessions started by another session declined every merge asked of them on quoted consent, 11 of 11. The evidence file for that count was not found. With Bob's approvals committed to the repository, a confirming round saw no refusal in about 450 acts (measured).

Claude Code: the committed approvals also cover what no starting instructions foresaw. Measured in Process3, as recorded in the working Foundations: with them a session acted on its directing session's unforeseen request 10 of 10 times, and without them 0 of 10.

Claude Code: a session loads the approvals only when it starts (measured). Measured in Process3: each of Bob's five edits to his approvals stopped every long-lived session. So an edit to the approvals goes together with a restart of ROOT. What an edit does to a round that is running is a technical matter still owed (part 10).

Claude Code: a session reads the approvals from the copy of the repository it was handed at its start. Measured in Process3: that copy was once about an hour old and lacked approvals committed sixteen minutes earlier. Claude decided: ROOT's first act is to fetch the newest copy of its branch. Whether approvals that arrive after a session has started count the same as approvals read at the start is unproven.

## The list of forbidden commands, and GitHub's rules

Claude Code: the list of forbidden commands is the deny list in the repository's settings.json. A command on it is removed from the session outright (measured). The list takes away every direct push, every GitHub command, the ordinary merge commands, overwriting a branch's history, deleting branches, and writing files through GitHub's web interface.

So the process's tool is each session's only door to GitHub. Merging stays with that tool, the route Process3 measured.

Sessions act on GitHub as a second account, which can push and merge but cannot change settings. Bob acts as the owner. So GitHub itself keeps sessions out of settings and branch rules. No branch can be deleted or overwritten. The tranche branch takes a change only by pull request with its tests passing. Codex: which GitHub account a session acts as there is not yet known.

Claude Code: a session loads the list of forbidden commands only when it holds one repository (measured). So every session is started with one repository. A session building a product starts from the newest commit of that product's tranche branch. PROCESS starts on the process's own repository.

The process must be able to deploy by itself, because an external walk needs a deployment and the work runs with nobody watching. Bob's word on this, of 2 Nov, is recorded in `process4/evidence/foundations.md`. What deploys a product, and what its deploy token is, depend on where the product is hosted. The design gives them in a table for each hosting provider (part 6).

Secret values are kept away from product code. Production keys are never in the sessions' environment (part 1). Claude Code: deploy tokens are held as settings of the cloud environment, the only route measured to work. Codex: where a deploy token is kept is not yet known. Module tests run in two parts, so that product code under test holds no access token. Who can read the deploy token is owed (part 10).

## Working with the permission checker

Claude Code: every session runs in Auto mode. It acts without asking a person, and an automatic permission checker run by the platform judges each risky act and may refuse it.

Claude Code: the checker's judgment is not fully steady. Measured in Process3: it passed and refused the same act minutes apart. Three working rules exist because of it.

- One judged act for each command. Measured: a judged act chained with another command was the one refused.
- An act the permission checker refused is never reworded and never retried elsewhere.
- Three refusals in a row stop a session (measured). Such a session is replaced.

Two kinds of refusal are kept apart. An act the permission checker refused falls under the second rule above. An act a session declined only because its instructions did not name it is different. It may be given to a new session whose instructions do name it. Writer's reading: the second is a missing instruction and not a refusal of what Bob approved, so supplying the instruction is the correction.

Estimated: twenty clean merges in the trial bound the refusal rate only below about 14%. Whether the checker goes on passing merges at a real rate can be shown only by the first real tranche.

## The platform

The process stands only on platform behaviour that has been measured. The measured behaviours it rests on are these, all Claude Code:

- A session can run one thing for about 30 minutes. Longer work runs on GitHub's machines or is shared among sessions.
- An alarm set by a session fires into that session when it is idle and resumes it. This is ROOT's hourly wake.
- A fresh session started by an alarm could not start sessions (0 of 3).
- New session starts failed silently at about 50 live sessions (one event). So finished sessions must not use up the account's room. The session that started a session archives it when it has finished (part 5).
- Sessions are started only down to a limited depth. So sessions are at most three levels deep.

Codex: whether like limits apply there is not yet known.

A harness runs AI sessions only on what Bob's subscription covers. Anything that would cost more comes to him first.

The process keeps to GitHub's published limits, in the way Process3 did. Process3 used 80 to 90% of the published limits and obeyed GitHub's rate-limit responses, as the working Foundations record. Why GitHub suspended the sessions' account on 6 Nov is owed (part 10).

The limits of the product's hosting account are given in the table for each hosting provider (part 6).

Every account, setting and branch rule the process depends on is part of the design. The few steps that are Bob's are listed on one page the process writes, each with its reason.

## The terms and their Claude Code constructs

| Term used in these parts | Claude Code construct |
| --- | --- |
| Session | One conversation in Claude Code's cloud |
| Helper | A worker started inside a session, which ends with its task |
| Bob's standing approvals | A block of text in the repository's CLAUDE.md |
