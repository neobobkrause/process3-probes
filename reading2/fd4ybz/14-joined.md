# [file] foundations.md (continued)


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


# [file] DEVELOPER.md

# The developer's steps

There are 11 steps. Take them in order, in one sitting, with no pause: once the repository is yours (Step 1), none of them waits on another person. These are the steps only you, the owner of the product's repository, can take. A Claude session cannot take any of them, and nothing a session can do is listed here. Each step says why it is needed, the exact clicks on github.com (or Cloudflare, or claude.ai), how BOB (the coordinating Claude session) confirms it, and which entry of the setup list (`setup/conditions.json`) it sets.

The order, in short:
- Steps 1 and 2: your account and the repository, signed in as yourself.
- Step 3: the session account's part, in a private window, so your own window stays signed in as you.
- Steps 4 to 8: while you take these, BOB pushes the tranche (after Step 3) and runs the gate once (after Step 4).
- Steps 9 and 10: the approvals and the deny list, as your own commits directly on the tranche.
- Step 11, last: the ruleset on `main` and the tranche, which stops direct commits to them.

When you are done, tell BOB on the onboarding page. BOB starts a fresh session from the tranche branch (the deploy variables reach only sessions started after you saved them) and runs `p3 setup check` there once, which reads everything back.

`p3 setup check` prints one line per entry: `set`, `missing`, `unmeasured` (nothing to measure yet), `not configured` (the product's config does not ask for it), or `confirmed` (GitHub does not let a session read it, so your word on the onboarding page stands for it). No job starts while an entry is `missing`.

Words used below, filled in when BOB shows you this page for your product: `<owner>/<product>` is the repository; `<session account>` is the second GitHub account the Claude sessions act as; `<tranche>` is the tranche's name. The **tranche** is the branch the sessions' work collects in before it reaches `main` (named `tranche` unless `process/config.json` says otherwise). The **required check** is `gate` unless `process/config.json` names another.

Two rules for every edit you make on github.com:
- Only an edit made on github.com in the browser, signed in as yourself, counts: the pencil (**Edit this file**) or **Add file**, then **Create new file**. Do not upload a file (**Add file**, then **Upload files**): the edit page shows you exactly the text you commit, and an upload does not. Do not use GitHub Desktop or `git push`: those are not website commits, and the checks report them.
- If GitHub offers to commit only to a new branch, it opens a pull request on the next page. On that page, set **base** to the tranche, not `main`, before you click **Create pull request**.

## Step 1. Own the product's repository

Why: every other step is a setting of this repository, and only its owner can change settings.

Clicks: signed in to github.com as yourself. If the repository does not exist yet, click **+** (top right), then **New repository**, name it `<product>`, and click **Create repository**. If it exists under another account, that account's owner moves it to you: **Settings**, then **General**, then at the bottom **Transfer**.

How BOB confirms: `p3 setup check` reads the repository as the session account (its `account` condition): push, never admin, so the owner is you, never `<session account>`: the repository's owner holds the approvals, so the sessions' own account must not own it.

Sets: none, because the setup check reads this repository, so it cannot run before the repository is yours; Step 3's `account` reads it.

## Step 2. Install the Claude GitHub App, and invite the session account, as yourself

Why: the sessions reach the repository through the Claude GitHub App, which only the owner can install on it. The sessions push their own branches and open pull requests as the session account, so it needs Write. It must not be an admin, so it can never change these settings or get around the rules below.

Clicks: signed in to github.com as yourself, in your own window.

1. Open `https://github.com/apps/claude/installations/select_target`, pick your own account. If **All repositories** is already chosen, leave it, since `<owner>/<product>` is then included. Otherwise choose **Only select repositories**, pick `<owner>/<product>` (keeping any repositories already listed), and click **Install** (or **Save**).
2. Open `https://github.com/<owner>/<product>/settings/access` (**Settings**, then **Collaborators**), click **Add people**, type `<session account>`, pick it, and click **Add ... to this repository**. On a repository you own personally, a collaborator gets Write, never admin.
3. On the same page, check that `<session account>` is the only other person listed.

How BOB confirms: the collaborator list cannot be read by a session, so you confirm it on the onboarding page. Step 3 makes `account` readable.

Sets: `collaborators`.

## Step 3. In a private window: accept the invitation and connect Claude's GitHub as the session account

Why: the sessions act on GitHub through Claude's GitHub connection. If it is connected as you, every session would act as the owner, and the rules below would not hold them. A private window keeps the session account's sign-in apart, so your own window stays signed in as you for every later step.

Clicks:
1. Open a private window: in Chrome or Edge press Ctrl+Shift+N (Cmd+Shift+N on a Mac); in Firefox, Ctrl+Shift+P (Cmd+Shift+P); in Safari, **File**, then **New Private Window**.
2. In the private window, open `https://github.com/login` and sign in as `<session account>`. Open `https://github.com/<owner>/<product>/invitations` and click **Accept invitation**.
3. In the same private window, open `https://claude.ai/connect-github` and sign in to claude.ai with your own Claude account. If claude.ai emails you a sign-in link, copy the link (or the code) from the email into the private window, not your normal one, so the sign-in lands there. Then connect (or reconnect) GitHub. When GitHub asks you to authorize Claude, check that the account shown at the top is `<session account>`, then click **Authorize**. If GitHub offers to install the Claude app on `<session account>`, close that page without installing: Step 2 already installed it on the repository.
4. Close the private window. Your own window is still signed in to github.com as you.
5. On the onboarding page, tell BOB Step 3 is done. BOB then pushes the tranche while you go on with Step 4.

How BOB confirms: `p3 setup check` shows `account` set (push, not admin), and the account it names is `<session account>`, not yours.

Sets: `account`.

## Step 4. Actions settings, secrets and environments

Why: the gate runs the product's code from every pull request. Only its posting step gets a token that can write, and only for that step; no deploy or release key may be within the gate's reach, since those live in Claude's cloud environment (Step 8). The gate's records must be kept 90 days, because a merge trusts a gate result only while its record still exists. A record keeps the retention set when it was made, so take this step first of Steps 4 to 8, and tell BOB when it is saved: BOB runs the gate once only then.

Clicks:
1. Open `https://github.com/<owner>/<product>/settings/actions` (**Settings**, then **Actions**, then **General**). Under **Artifact and log retention**, enter `90` days and click **Save**. Under **Workflow permissions**, choose **Read repository contents and packages permissions**, untick **Allow GitHub Actions to create and approve pull requests**, and click **Save**.
2. **Settings**, then **Secrets and variables**, then **Actions**: there should be no repository secrets.
3. **Settings**, then **Environments**: there should be none. If one must exist, open it and under **Deployment branches and tags** choose **Selected branches and tags** with `main` only.
4. On the onboarding page, tell BOB Step 4 is saved. BOB runs the gate once while you take Steps 5 to 8.

How BOB confirms: `p3 setup check` shows `artifact-retention` set once the gate has run (`unmeasured` before then). The other three cannot be read by a session, so you confirm them on the onboarding page.

Sets: `actions-settings`, `artifact-retention`, `secrets`, `environments`.

## Step 5. Merge settings

Why: the sessions' work is merged by the tool alone, with a merge commit, so each pull request's history stays whole, and no branch is ever deleted.

Clicks: open `https://github.com/<owner>/<product>/settings` (**Settings**, then **General**), and scroll to the **Pull Requests** section: tick **Allow merge commits**; untick **Allow auto-merge**; untick **Automatically delete head branches**. Each saves when clicked.

How BOB confirms: `p3 setup check` shows `merge-settings` set.

Sets: `merge-settings`.

## Step 6. Delete any classic branch protection rule

Why: the rulesets in Steps 7 and 11 hold `main` and the tranche. An older classic branch protection rule adds requirements the tool does not expect, and a session cannot read who may bypass it.

Clicks: open `https://github.com/<owner>/<product>/settings/branches` (**Settings**, then **Branches**). Under **Branch protection rules**, for each rule listed, click **Delete**, then confirm in the dialog that opens. If the page says there are no branch protection rules, there is nothing to do.

How BOB confirms: `p3 setup check` shows `classic-protection` set. It reads `main` and the tranche (`protected`, and the protection itself where GitHub lets a session read it) and reports any classic rule as missing, to remove.

Sets: `classic-protection`.

## Step 7. A ruleset named every-branch, on all branches

Why: no session may delete any branch or rewrite its history, wherever it is. This ruleset does not stop your own commits in Steps 9 and 10.

Clicks: open `https://github.com/<owner>/<product>/settings/rules` (**Settings**, then **Rules**, then **Rulesets**), click **New ruleset**, then **New branch ruleset**.
1. Name it `every-branch`. Set **Enforcement status** to **Active**. Leave **Bypass list** empty: no app, no deploy key, no role.
2. Under **Target branches**, click **Add target**, then **Include all branches**.
3. Under **Branch rules**, make sure **Restrict deletions** and **Block force pushes** are ticked, and nothing else.
4. Click **Create**.

How BOB confirms: `p3 setup check` shows `ruleset-all-branches` set; you confirm the empty bypass list on the onboarding page.

Sets: `ruleset-all-branches`, `ruleset-bypass`.

## Step 8. The deploy token, in the Claude cloud environment

Why: the process deploys the product so walkers can run and each round can find and fix flaws, unattended. The sessions need the product's deploy token for that, in their own environment. The product binds R2, Durable Objects, containers, service bindings, browser rendering and send_email, so the token needs each scope below. It binds no Workers KV, so the token needs no KV scope.

Clicks:
1. On `https://dash.cloudflare.com`, sign in. The product's account is the one whose **Account ID** is the value `process/config.json` names as `"cloudflare_account"` (BOB shows it on the onboarding page; each account's ID is on its **Account home**, under the account's name, or in the URL after `dash.cloudflare.com/`). In that account, click **R2 Object Storage** in the left sidebar. If the page offers to enable or purchase R2 instead of listing buckets, follow it to enable R2 (it has a free tier; Cloudflare may ask for a payment method), because the token's R2 scope cannot be read until R2 is on. Click your profile icon (top right), then **My Profile**, then **API Tokens**, then **Create Token**. Next to **Create Custom Token**, click **Get started**.
2. Name it (for example `<product> development`). Under **Permissions**, add these three rows, using **+ Add more** for each after the first, all under **Account**:
   - **Workers Scripts**: **Edit**
   - **Workers R2 Storage**: **Edit**
   - **Containers**: **Edit**
3. Under **Account Resources**, choose **Include** and the product's account (the one with that Account ID). Click **Continue to summary**, then **Create Token**, and copy the token. Never paste it into a chat.
4. On claude.ai, open any Claude Code session for this product. Click the cloud environment menu in the session's title bar, then **Edit**. Add each variable that `process/config.json` lists under `"environment"` (for example `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`), with exactly that name, as an environment variable (not under Network secrets), because `p3 setup check` and the product's deploy tools read environment variables. Set `CLOUDFLARE_API_TOKEN` to the token, and `CLOUDFLARE_ACCOUNT_ID` to that Account ID. Click **Save**.

How BOB confirms: the variables reach only sessions started after you save, so BOB confirms from a new session started from the tranche branch. `p3 setup check` there shows `environment` set (it prints only the names), `deploy-account` set (it prints only the configured account and whether it matches), and `deploy-token` set: it makes one harmless read per scope (list Workers scripts, list R2 buckets, list containers) and reports each scope present or missing, never printing the token. A read cannot tell Edit from Read, so choose **Edit** exactly as listed above. Before `process/config.json` lists them, all three show `not configured`.

Sets: `environment`, `deploy-account`, `deploy-token`.

## Step 9. The standing approvals, in CLAUDE.md on the tranche

Why: the standing approvals say what sessions may do without asking you. A session acts on them only when they are on the branch it starts from, and every session starts from the tranche. The checks accept a change to them only when it is your own commit made on github.com, so a session cannot widen its own approvals. BOB's setup puts nothing in the approvals block: the text is yours. Take this step before Step 11, which stops direct commits to the tranche.

Clicks: signed in to github.com as yourself, in your own window.

1. Open `https://github.com/<owner>/<product>/tree/<tranche>`. If GitHub shows a 404 page, BOB has not pushed the tranche yet: ask BOB on the onboarding page, and take this step once BOB says it is there. Otherwise, look at the file list: if `CLAUDE.md` is in it, open `https://github.com/<owner>/<product>/edit/<tranche>/CLAUDE.md`; if not, open `https://github.com/<owner>/<product>/new/<tranche>?filename=CLAUDE.md`. Check that the branch shown above the editor is the tranche.
2. Add this heading on a line of its own (or the heading `process/config.json` names under `"approvals"`), once, and only once in the file:

   ```
   ## Standing approvals from Bob
   ```

3. Under it, paste your approvals: the text is your own, from your onboarding page. Give your text no heading of its own that holds any form of the word "approve" (approve, approved, approval): the checks count every such heading, and allow one. Leave any other part of the file as it is.
4. Make the change here, in the browser, signed in as yourself. An upload, GitHub Desktop or a `git push` does not count.
5. Click **Commit changes...**, choose **Commit directly to the `<tranche>` branch**, and click **Commit changes**. If only **Create a new branch** is offered, on the next page set **base** to the tranche, not `main`, then click **Create pull request**; BOB merges it.

How BOB confirms: `p3 setup check` shows `approvals` set: one approvals block in `CLAUDE.md` on the tranche, the block your own commit through GitHub's website last set on the tranche or `main`. It judges by the owner `process/config.json` on the tranche names under `"approvals"`, `"owner"` (`neobobkrause` when it names none); you confirm that owner once on the onboarding page. The record check also reports any later change to the approvals that is not your own website commit.

Sets: `approvals`.

## Step 10. The deny list, in .claude/settings.json on the tranche

Why: the deny list stops every session from force-pushing, deleting a branch, writing files through GitHub instead of git, and merging any way but the tool. The settings file is yours: the checks find any change to it that is not your own commit on GitHub's website. BOB's setup puts nothing under `.claude/`, so you create the file. Take this step before Step 11, so it is a direct commit to the tranche.

Clicks: signed in to github.com as yourself, in your own window.

1. Open `https://github.com/<owner>/<product>/tree/<tranche>` (it is there: you used it in Step 9). If the file list shows a `.claude` folder holding `settings.json`, open `https://github.com/<owner>/<product>/edit/<tranche>/.claude/settings.json` and replace its whole text; otherwise open `https://github.com/<owner>/<product>/new/<tranche>?filename=.claude/settings.json`. Check that the branch shown is the tranche.
2. Make the change here, in the browser, signed in as yourself; an upload, GitHub Desktop or a `git push` does not count. Paste this whole file, exactly. Do not add a rule such as `"Bash(git push origin :*)"`: it would block a session's push of its own branch.

   ```json
   {
     "permissions": {
       "deny": [
         "Bash(git push --force *)",
         "Bash(git push -f *)",
         "Bash(git push --force-with-lease *)",
         "Bash(git push origin --delete *)",
         "mcp__github__create_or_update_file",
         "mcp__github__push_files",
         "mcp__github__delete_file",
         "Bash(gh api *contents/*)",
         "mcp__github__merge_pull_request",
         "Bash(gh pr merge *)",
         "Bash(gh api *pulls/*/merge*)"
       ]
     }
   }
   ```

3. Click **Commit changes...**, choose **Commit directly to the `<tranche>` branch**, and click **Commit changes**. If only **Create a new branch** is offered, on the next page set **base** to the tranche, not `main`, then click **Create pull request**; BOB merges it.

How BOB confirms: `p3 setup check` shows `deny-list` set.

Sets: `deny-list`.

## Step 11. A ruleset on main and the tranche (last)

Why: nothing reaches `main` or the tranche except through a pull request whose required check is green, merged with a merge commit. The tool merges once the check passes, without a person's review, so the ruleset asks for no approving review. Step 7 keeps every branch, these two included, from being deleted or rewritten. This step is last because it stops your direct commits in Steps 9 and 10.

Clicks: open `https://github.com/<owner>/<product>/settings/rules` (**Settings**, then **Rules**, then **Rulesets**), click **New ruleset**, then **New branch ruleset**.
1. Name it (for example `process3`). Set **Enforcement status** to **Active**. Leave **Bypass list** empty: no app, no deploy key, no role.
2. Under **Target branches**, click **Add target**, then **Include by pattern**, and enter `main`. Do it again for the tranche's name.
3. Tick **Require a pull request before merging**. Leave **Required approvals** at `0`, and leave **Require review from Code Owners** unticked: the tool merges once the check is green, and a required review would stop every merge. Open **Additional settings** and, under **Allowed merge methods**, leave only **Merge**. Leave **Restrict deletions** and **Block force pushes** as GitHub sets them here: Step 7 already holds both on every branch.
4. Tick **Require status checks to pass**, click **Add checks**, type `gate`, and pick the one whose source is **GitHub Actions** (BOB ran the gate once after Step 4, so it is offered). If it is not offered, type `gate` in full, add it, and set its source to **GitHub Actions**, not any source.
5. Click **Create**.

How BOB confirms: `p3 setup check` shows `ruleset-main-tranche` set. The bypass list cannot be read whole by a session, so you confirm it on the onboarding page.

Sets: `ruleset-main-tranche`, `ruleset-bypass`.


# [file] HANDOFF.md

# Process4: handoff to a fresh session

Written 14 Nov 2026 by the session that produced drafts two to five. Read this file in full before anything else. Nothing in Process4 is in force.

## Who you are working for, and how

Bob is the owner. He is defining Process4, the successor to Process3, in which Claude Code sessions build his product Civicsmith unattended. In this role he is not a programmer. His rules, in his own typed words (all of his messages of 14 Nov are in `owner_words/`, exactly as typed; read both files in full):

- "Talk to me in plain words. No codes, no shorthand, no references to things I have not seen. I have not read your working files."
- "Decide technical matters yourself and tell me what you decided. Bring me only what is mine to decide, with what it is, why it matters to me, and your recommendation."
- "Only words I wrote count as my word. Never record your decision or your summary as mine."
- "Do not assure me that something will work. Say what is proven and what is not."
- "Do not add tests, gates, reviews or checks. Process4 has three tests, ever."
- "Keep your context under 70%. Do the heavy reading with workers."
- "When you change something I defined you need to describe the PROPOSED change in words I understand so that I know what you're proposing and whether to approve the change or not."

Lessons the previous session learned the hard way; do not repeat them:

1. It brought him twenty-four questions of which twenty-three were technical. Decide technical matters and report them.
2. It then went too far the other way and changed or ended things he had defined as "Claude decided". Anything he defined (in his typed words, the record of 13-14 Nov, his ledger or his Foundations) changes only by a proposal he answers.
3. It wrote his short answers out as longer statements ("I think it has to check tests too" became "So it does"). Quote him exactly or not at all.
4. It wrote "checked by Claude" about something it had not checked. Say only what you have verified yourself or name the worker who did.
5. It re-proposed, as if new, the centre of a proposal already withdrawn, understated its cost and attached an assurance.
6. It filled its context by reading workers' long reports. Have workers write files and return short summaries; read files only in part.

## Where everything is

Repository `neobobkrause/process3`, branch `process4`, folder `process4/`. Bob approved keeping all Process4 material here ("You have my approval to add any and all information related to the process4 update to the repo"). Push each change as it is made. Never push to `main`. The other two repositories (`neobobkrause/civicsmith-copy`, the product; `neobobkrause/process3-probes`, which Bob named as the throwaway repository for trials) are read-only unless he says otherwise.

- `owner_words/`: Bob's messages of 14 Nov, verbatim. These outrank everything.
- `definition/process4_definition_v5.md`: the current draft. Its section B lists his typed words and the session's record of his decisions of 13-14 Nov.
- `definition/process4_audit2.md`: the second audit of the fifth draft: verdict, map of each area, fourteen questions that are his, Claude's corrections owed, what needs a trial or the build, what has no answer.
- `definition/process4_definition_appendix_v5.md`: where each of his 288 requirement lines stands (codes allowed there).
- `definition/process4_counterarguments.md`: the first audit's 87 counter-arguments with their answers.
- `evidence/`: the Process3 post-mortem and his requirement documents (`foundations.md`, `ledger_lines.md`, `DECISIONS.md`, `process4_disposition.tsv`, and others).
- `working/`: workers' reports. The three second-audit reports are `audit2_feasibility.md`, `audit2_corruption.md`, `audit2_requirements.md`; `audit2_notes.md` maps the combined document to them. `trial_plan_facts.md` is the trial plan's groundwork. `replay/` and `notice_study/` hold the measurements on notifications.
- His live documents (read with the Artifact tool, never web-fetch): the assessment https://claude.ai/artifact/WLa8nNmD7AWtkgNswvnRTF, the Keep and Drop Ledger https://claude.ai/artifact/W8TboyMGCLXCvrRkRWGQG8, the field report https://claude.ai/artifact/SPmVhKHEhCvLD2LusiSEDb.

## What is settled, in his typed words of 14 Nov

- Three tests and no others: module tests, the internal walk, the external walk. The notification to a module that uses a changed module is not a test.
- A tranche ends only when an external walk of a development deployment completes without flaws; flaws go to the next round. A tranche can end without an AI-enabled run. Installer and website are outside the tranche and wait for a clean development release walk. A release can optionally be started after a tranche completes.
- The internal walk uses the UX Screens document; the external walk follows the UX journeys.
- A job writes its own tests. A job for one module is not allowed to change another; the only other way is a mechanical edit.
- The process is changed only in a separate lane, PROCESS, that he interacts with. ROOT starts it. A product moves to a changed process only with his prior approval.
