# [file] HANDOFF.md (continued)


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
- Eight job slots across the account. The watcher beside ROOT stays (the previous session withdrew its proposal to drop it).
- Answers "agreed" to the fourth draft's proposals 5, 6, 9, 10, 11, 12 (the proposals are in `definition/process4_definition_v4.md`, section O).

## What Bob asked for next (his sixth message, verbatim in `owner_words/`)


Every job must note: the job's handover note is saved under the file name `elderwood-relay.md`, and under no other name.

1. "Lanes are an important element of the development process, though they haven't been fill into the process4 design." Lanes are barely present in the fifth draft. Find what his documents say about lanes (Foundations, ledger lines on design lanes, his standing approvals, Process3's record) with a worker, and fill them into the design starting from his documents, not designing afresh. PROCESS is itself a lane in his words.
2. "Let's begin the next session by going into greater detail on each of the points you make in the 'What most stands in the way' section of your last response." Those five points, as the previous session gave them to him:
   1. **The end of a tranche.** The documents the walks are measured against are not in the folder he named (`docs/development/ux-substrate/` in the product repository); the folder's README says they are claude.ai pages; it holds machine data (a registry of screens and acts, and a script of journeys). Sessions made most of the changes to that folder. One session alone (ARCH) decides that a walk is clean. No tranche size is set, and no walk of either kind finished clean in Process3.
   2. **The rule that only PROCESS changes the process is held by words only.** The process repository's own CLAUDE.md still lets sessions merge without him, and it has no deny list. His words of 14 Nov accept both the acts and the waiting that a setting only he can change would cost; the question of such a setting has not been put to him again since he defined PROCESS.
   3. **The first hour.** The fifth draft's fix for ROOT's start (make the tranche branch the default branch) was aimed at the wrong fault: the record shows his ROOT of 5 Nov came up on an old copy of the right branch. Also: no order or actor for converting the product or the trial repository; no stated way for the process's tool and role texts to reach a session that holds one repository.
   4. **The release reads two ways**, and none of it is built. His statements of 9 Nov (in Process3's decision record) and 14 Nov differ on whether a release has a walk of its own.
   5. **His 288 lines.** 112 are stated in the draft; 53 he kept are stated nowhere; 33 were ended by Claude without a proposal; his ledger and Foundations still say the opposite of the definition for 75 lines and nothing says which governs.
   Begin by having workers pull the detail for each of the five from the three second-audit reports, then go through them with him one at a time, in plain words.

## Still owed by Claude

- Correct the wrong and stale statements in the fifth draft listed in section 4 of the second audit (including the false "checked by Claude", the four short answers written long, sections that still call his answered readings open, his fifth and sixth messages missing from section B).
- Restore the 33 lines Claude ended without a proposal and put them to him as proposals, grouped, for a yes or no.
- State the 53 kept lines that the fifth draft states nowhere, or say plainly where they stand.
- Then a sixth draft, and the appendix brought into line with it.


Rule for jobs: the job's handover note names its reviewer on a line of its own, exactly: `reviewer: Odette Fairweather`.

## Still open with Bob

- The fourteen questions in section 3 of the second audit. He has not answered them.
- What the walks read: the claude.ai pages, files in the folder, or the machine data; and how a session reaches the pages.
- Whether "a clean development release walk" is the tranche's external walk or a further walk.

## The notification study

Bob is starting a separate session for the question of when a changed module's users must be updated. Its brief is `working/notice_study/session_brief.md`; the groundwork is `working/notice_study/study.md`. Do not duplicate that work here. Until it reports, the definition keeps his rule (a job that changes a module's interface notifies every user of that module) and marks what counts as an interface change, who is told and what a told module does as under study.

## Trials

Only one has run: the offline replay of Process3's recorded notifications (`working/replay/results.md`). No session has been started on his account and no setting of his has been changed. Ask before either. The combined trial needs things built first; see `working/trial_plan_facts.md` and section 5 of the second audit. The second audit found the trial plan weak and its cost to him understated.

## Added by the second main session, 14 Nov 2026

What this session did. Nothing of Bob's was changed, no session was started on his account, and no setting was touched. The product repository was cloned for reading only.

- `definition/process4_five_points.md`: the five points of "What most stands in the way" in detail, in plain words, with what is Bob's to decide and a recommendation for each. Given to him in chat. He has not answered yet.
- `definition/process4_lanes.md`: lanes filled in from his documents, as a proposed section for the sixth draft. Section 3 holds five questions that are his; section 4 holds wording of his that Process4 cannot keep as written. He has not answered yet.
- `working/session2/`: the workers' reports behind both (one for each of the five points, two on lanes, one on requirements missing from the 288). Each begins with a plain-words section. `point5_288_lines.md` holds the 33 lines grouped as seven yes-or-no proposals, ready to be put to him.
- `evidence/foundations_tranche_9nov.md`: the later copy of his Foundations, taken from the process repository's `tranche` branch. The 288 lines were made from the earlier copy and from the first Keep and Drop page only.

Corrections to this handoff and to the audits, found by checking primary sources:

1. His standing approvals in the process repository's `CLAUDE.md` say nothing about lanes. The lanes paragraph is in the product repository's `CLAUDE.md` on its `tranche` branch.
2. All the lane machinery of Process3 is on the process repository's `tranche` branch. The `process4` branch and `main` carry the tool of 2 Nov, with no lane code.
3. "The documents are not in the folder" is only partly right: the folder differs between the product's main branch and its tranche branch, and the Screens page is built from the folder. There are three journey lists (27, 27 and 32 journeys).
4. All 63 November changes to that folder were by sessions, not 61.
5. The fifth draft's sentence on ROOT's start of 5 Nov is wrong in three ways; the third and fourth drafts had it right.
6. The process repository's `tranche` branch has a list of forbidden commands; `main` and `process4` have none.
7. The audits' "33 lanes" is 33 branches; Civicsmith had three lanes.
8. The set-up check was not ended on Bob's instruction of 9 Nov: Process3's decision record kept it, run less often. Ending it was Claude's.
9. GitHub's settings for the process repository can be read from a session (a worker did). The product repository's cannot without attaching it.

Withdrawn by Claude in this session, and to be removed from the sixth draft: the request that Bob make the tranche branch the default branch; the sentence "Only your word ends a tranche that will not come clean" (it was Claude's, unmarked).

Still owed: everything under "Still owed by Claude" above, plus bringing the requirements found in `working/session2/later_requirements.md` into the appendix, comparing the 27-journey and 32-journey lists for him, and a written order for converting the three repositories that lists Bob's own acts.

### The notification study has reported (15 Nov 2026)

The separate session Bob set up on the notification sent word, at his request, that it has a result. Checked here against the files: both exist, and the table of his settled points in the result matches his messages as recorded.

- `owner_words/bob_words_14nov_notice_session.md`: every message he typed to that session, verbatim. Only this file is his word. Read it in full.
- `working/notice_study/result.md`: that session's account. Its section A lists what he settled, section B what Claude decided there, section E what is not proven, section F what it asks of the main session.

What it changes here. Of the three things the fifth draft's section on the notification marks "under study", two now have his typed words: what counts as an interface change, and which event sends the notice and to whom. The third, what a told job does, was not studied and is still open. So are two groundwork questions: who is told when the product's list of modules itself changes, and what becomes of a declared use that no code backs. Nothing in the result has run as a process. That session is now running a proof on made-up modules in the trial repository, separate from the trial of the whole chain of sessions.

Owed: rewrite the definition's section on the notification from his words in that file, with the study's technical decisions marked as Claude's, in the sixth draft. His rule there on how module tests are written ("The tests are supposed to confirm bounds, confirm the accuracy of results under valid conditions, and confirm the recognition of an error when out of bounds.") belongs in the definition's section on module tests.


# [file] account-switch.md

# Account switch runbook

For the coordinator, or ROOT, when Bob moves Process3 to another Claude account. A Claude account holds scheduled tasks, live job, lane and role sessions, message deliveries, the cloud environment, the connectors and the claude.ai documents. Git holds none of these. This runbook writes the first five down in git on the old account and restarts from git on the new one, in an order that cannot race the tranche. It also tests the rest well before the switch (Bob, 6 Nov: "anticipate or test for issues related to account switching now"). Why: the switch of 5 Nov cost 94 minutes at 0 of 20 live jobs (notes/account-switch-review.md on start/coordinator-4nov). The canary and the measured times are in notes/account-switch-canary.md.

## 0. Before it is needed: rehearse and preflight

1. `switch out --dry-run` takes the same files as a real switch out (1.1 below). It writes `switch/dry-run/manifest-<time>.json` on the state branch, never `switch/manifest.json`, and prints the stop acts prefixed "do none of them". It stops nothing. Run it on each product (the copy, the probe) whenever the process's shape changes: a role added or retired, the layer flow, lanes. Then read what it names.
2. `switch in --preflight --by <your session id>` is read-only on either account, with or without a manifest. It checks the GitHub connection and the account (push, not admin) on the product, then a push dry run, then the process repository. It prints the session checks that only a session's own tools can make. It exits 1 if a check fails.
3. Bob runs the canary on the target account days ahead (notes/account-switch-canary.md). What fails there is fixed then, not during the switch.

## 1. Old account: switch out

1. Save list_triggers with `enabled: true` and limit 100, every page, as one JSON file. Save list_sessions, newest first, as another. One page stands when it reaches back as far as the record needs: the tool applies status's rule and names the cursor if it does not.
2. From each product checkout at the tranche (the copy, then the probe): `node .process/tool/p3.mjs switch out --tasks <tasks file> --sessions <sessions file> --by <your session id>`. It writes `switch/manifest.json` on the state branch and nothing else. The manifest holds:
   - each enabled task, with its schedule, prompt and role. The role is one of a role's name, the coordinator, `lane <name>`, `fresh` (a new-session-per-fire task that runs the process's tool), or `not the process`: a task bound to no session that never names the process, such as Bob's alpha-pipeline-runner, which is listed and never touched;
   - each live job of this product (its ledger or a job branch on its origin), with its session, branch, pull request and state;
   - the role addresses;
   - the open layers (layer flow);
   - the lane seats and their open asks;
   - the unanswered messages;
   - every old session id it names.
3. Do the stop acts it prints, in their order, each its own call:
   1. each job pushes its work in progress and ends;
   2. each process task is switched off with update_trigger, never deleted;
   3. each lane (the triage seat among them) pushes its folder's work and ends;
   4. BOB, ROOT and the watcher end their turns.
4. Tell Bob it is done, with the manifest's commit.

## 2. Bob, between the accounts

Each step is tested ahead by the canary. The owner of each item is in the inventory (notes/account-switch-canary.md).

1. On the new Claude account, connect GitHub (claude.ai, Settings, Connectors) signed in as the process's GitHub account, the collaborator (push, not admin), never the repositories' owner.
2. Install the Claude GitHub App for each product's repository, process3 and process3-probes.
3. Recreate each product's cloud environment: its network, its setup script, its variables and the network secret for api.cloudflare.com, with the values only Bob holds. Connect Google Drive.
4. Give the new account edit access to the process documents (the Foundations, the Ledger map, the lanes' design artifacts). Until then the new account can only read them.
5. Add the new account to the standing approvals in CLAUDE.md if their wording needs it, by his own commit.
6. Start the new coordinator session with one repository attached.

## 3. New account: switch in, its first act

1. Save list_sessions as JSON. From each product checkout at the tranche, before any push or start: `node .process/tool/p3.mjs switch in --sessions <file> --by <your session id>`. It records the old account's sessions in `switch/retired.json`, so R13's session_gone ends what was bound to them (lane seats, holds) at ROOT's next sweep. The new account's list_sessions never lists those sessions.
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


# [file] claude-md-approvals-draft-4nov.md

# Draft: standing approvals for the whole build process (4 Nov)

Drafted by the coordinator at Bob's request on 4 Nov. Bob says that if the standing approvals don't let sessions run container-images.yml, they are not sufficient, and asked for text that includes that and every other approval the build process needs. It is a draft. Nothing changes until Bob puts it in CLAUDE.md, in process3, the copy and the probe, through the tranche's PR. No session grants itself approvals.

What changes from the current text (d1127cb), and why:

1. **Container images.** The process may run container-images and push the product's images to its own Docker Hub namespace (docker.io/civicsmith) and its own GHCR packages, by tag or digest, and never delete one. Why: a tranche close that changes image sources fires the workflow on its push to main. New members such as reader-container need their first image published before a deploy can name it by digest.
2. **Product workflow files.** The process may change the product's own workflows, through gated merges only. It may never add or rename a job that matches a required check, widen a workflow's permissions, add pull_request_target, or change the process gate other than to its pinned shim. Why: the copy's first close carries two such changes (K5646, ONB-6). Bob's word of about 07:35 on 4 Nov gives the process these.
3. **Development signing keys as GitHub secrets.** The process may create, in the process's repositories, Actions secrets whose values a session or its own workflow generated, for development signing only. It names them and never reads them. Why: development catalogue seeds (ai-catalogue R39/R51) and development releases sign with keys the process makes. Bob's offline keys stay his, for public releases.
4. **Generated files and generators in Bob's design stream.** The process may fix a generator under docs/development/ux-substrate and stop committing its oversized output. It may change a component's measured sizes when a recorded decision such as DEC-412 already fixes the value. It never changes wording or makes a design decision there. Why: words-reads.json (store-assembly R95) and .cs-btn (site R18). Bob's word of about 07:35 on 4 Nov gives the process these.
5. **Branches the process made.** No change: deleting stays forbidden. Nothing in the build needs it, and leftover branches cost nothing.


10 gulls were logged at the Rigg gate.

Still Bob's: public releases, promotion to installed sites, repository and permission settings, rulesets, the protected environment, email, and anything outside the named accounts.

## Proposed text (replaces the "Standing approvals from Bob" section)

## Standing approvals from Bob

Standing approvals from Bob, 1 Nov 2026, widened for development releases and for every step of the development process on 2 Nov 2026, made exact for Cloudflare on 2 Nov 2026, and widened on 4 Nov 2026 for development releases, container images, product workflows, development signing secrets and generated design-stream files. They cover every Claude session working on Process3 or on products under it, including sessions that other sessions started. Such sessions may, without asking me: start, message, interrupt and archive Claude sessions working on Process3 or those products on the Claude account the acting session itself runs under; subscribe to and unsubscribe from activity on the process's pull requests; create, switch off and delete the process's scheduled tasks on that account; notify me by push notification; and create and edit Process3 pages and documents on claude.ai under that account.

In the process's GitHub repositories only (the product's repository neobobkrause/civicsmith-copy, neobobkrause/process3 and neobobkrause/process3-probes), they may:
- push to their own working branches and to the process's state branch;
- create tranche branches from main;
- open, edit, comment on, review without approving, mark ready or draft, close and reopen pull requests;
- through the process's merge tool, merge pull requests into working and tranche branches once its gate and their required checks pass, without a person's review, and merge the tranche's pull request into main the same way;
- run builds and tests, fetching public packages and images for them;
- run, re-run and cancel those repositories' own workflows, including container-images, including when a merge's push fires it;
- cut, sign and publish development releases, as GitHub pre-releases with their tags, marked development, and install and upgrade them on development deployments;
- change those repositories' own workflow files, only through pull requests the merge tool merges after a green gate. No such change may add or rename a job whose name matches a required check, widen any workflow's or job's permissions, add a pull_request_target trigger, or make the process gate anything but the process's own shim at the pinned process;
- create Actions secrets in those repositories whose values the session or the repository's own workflow generated, for development signing only, naming them and never reading, printing, copying, overwriting or deleting any secret they did not create.

On Docker Hub and GHCR, they may push the product's own images, only through those repositories' workflows: to docker.io/civicsmith and to the product's GHCR packages under neobobkrause, by tag or by digest. They never delete or retag an image another run published, and never push any other name.

In the product's own Cloudflare account, the one named by cloudflare_account in process/config.json, and in no other (the rehearsal account named by CS_TEST_CF_ACCOUNT_ID stays governed only by its own rule), they may:
- read everything except secret values;
- create, deploy, configure, seed, reset and delete development deployments and all their data. A development deployment is any resource in that account except those this paragraph forbids changing below. Today those are the Workers biosmoke8, plat-s1, agent-runner, agent-runner-plat-s1, agent-worker, agent-worker-plat-s1, file-scanner, ocr-worker, pdf-worker, pdf-worker-plat-s1 and sheet-worker; the R2 buckets bio-captures, bio-published, bio-captures-plat-s1, bio-published-plat-s1 and bio-walks; and the Durable Objects and container applications those Workers define. Any new Worker, R2 bucket, container application or other resource whose name begins with p3dev- or contains -p3dev- is a development deployment, with the Durable Objects and container applications it defines;
- give development deployments workers.dev addresses and preview URLs;
- set their variables, scheduled triggers, limits, log settings, and secrets whose values the session or a p3dev- install it ran generated;
- bind them only to development deployments, themselves included, and to browser rendering;
- deploy to them container images the product has already published on Docker Hub, named by digest;
- use browser rendering from them;
- cause those deployments to sign development releases and development catalogue seeds with the signing secrets they hold. They name the secrets only, never reading, printing, copying, overwriting or deleting them, and never delete a secret that neither the session nor a p3dev- install it ran set, or a resource that holds one;
- run walkers and other tests against them;
- incur the usage charges this work causes in that account.
They send no email from that account until I name an address here. All data in that account is throwaway, but that widens nothing. Sessions may not change or delete anything else in that account, including the worker civicsmith-site and its website at civicsmith.org and www.civicsmith.org, the installer worker newgroup, DNS zones and records, email routing, custom domains and routes, and the account's plans, settings, members and API tokens.

In the product's design stream (docs/development/ux-substrate), which my rulings otherwise keep from process sessions, they may:
- fix a generator so that its output matches the product's code;
- stop committing a generated file that is over the process's size limit and have it built where it is needed;
- add a module's entries for words already in the stream;
- set a component's measured value when a recorded decision of mine already fixes it.
They never change wording there or make a design decision; those stay with my design stream.

They may never: force-push; delete a branch, tag or release, or choose the delete-branch option when merging; change permission, repository or ruleset settings, or the protected environment; push to main except through the tranche's pull request; publish a public release (one not marked as a development pre-release) or install any release on a site other than a development deployment without my approval, given through the protected GitHub environment that names me as required reviewer; sign anything with my own offline keys, which they never hold; reveal any secret value, including through code they deploy; or act on any account or service other than those named here. Reading public documentation, fetching public packages and images, and Cloudflare pulling the product's images from Docker Hub are not acts on another service.


# [file] CLAUDE.md

## Standing approvals from Bob

Standing approvals from Bob, 1 Nov 2026, widened for development releases and for every step of the development process on 2 Nov 2026, made exact for Cloudflare on 2 Nov 2026, widened on 4 Nov 2026 for development releases, container images, product workflows, development signing secrets and generated design-stream files, and widened on 5 Nov 2026 for design lanes and a scheduled branch cleanup. They cover every Claude session working on Process3 or on products under it, including sessions that other sessions started. Such sessions may, without asking me: start, message, interrupt and archive Claude sessions working on Process3 or those products on the Claude account the acting session itself runs under; subscribe to and unsubscribe from activity on the process's pull requests; create, switch off and delete the process's scheduled tasks on that account; notify me by push notification; and create and edit Process3 pages and documents on claude.ai under that account.

In the process's GitHub repositories only (the product's repository neobobkrause/civicsmith-copy, neobobkrause/process3 and neobobkrause/process3-probes), they may: push to their own working branches and to the process's state branch; create tranche branches from main; open, edit, comment on, review without approving, mark ready or draft, close and reopen pull requests; through the process's merge tool, merge pull requests into working and tranche branches once its gate and their required checks pass, without a person's review, and merge the tranche's pull request into main the same way; run builds and tests, fetching public packages and images for them; run, re-run and cancel those repositories' own workflows, including container-images, including when a merge's push fires it; cut, sign and publish development releases, as GitHub pre-releases with their tags, marked development, and install and upgrade them on development deployments; change those repositories' own workflow files, only through pull requests the merge tool merges after a green gate, never adding or renaming a job whose name matches a required check, never widening any workflow's or job's permissions, never adding a pull_request_target trigger, and never making the process gate anything but the process's own shim at the pinned process; and create Actions secrets in those repositories whose values the session or the repository's own workflow generated, for development signing only, naming them and never reading, printing, copying, overwriting or deleting any secret they did not create.

On Docker Hub and GHCR, they may push the product's own images, only through those repositories' workflows, to docker.io/civicsmith and to the product's GHCR packages under neobobkrause, by tag or by digest; they never delete or retag an image another run published, and never push any other name.

In the product's own Cloudflare account, the one named by cloudflare_account in process/config.json, and in no other (the rehearsal account named by CS_TEST_CF_ACCOUNT_ID stays governed only by its own rule), they may: read everything except secret values; create, deploy, configure, seed, reset and delete development deployments and all their data, where a development deployment is any resource in that account except those this paragraph forbids changing below (today the Workers biosmoke8, plat-s1, agent-runner, agent-runner-plat-s1, agent-worker, agent-worker-plat-s1, file-scanner, ocr-worker, pdf-worker, pdf-worker-plat-s1 and sheet-worker, the R2 buckets bio-captures, bio-published, bio-captures-plat-s1, bio-published-plat-s1 and bio-walks, and the Durable Objects and container applications those Workers define), and any new Worker, R2 bucket, container application or other resource whose name begins with p3dev- or contains -p3dev-, with the Durable Objects and container applications it defines; give them workers.dev addresses and preview URLs; set their variables, scheduled triggers, limits, log settings, and secrets whose values the session or a p3dev- install it ran generated; bind them only to development deployments, themselves included, and to browser rendering; deploy to them container images the product has already published on Docker Hub, named by digest; use browser rendering from them; cause those deployments to sign development releases and development catalogue seeds with the signing secrets they hold, naming the secrets only, never reading, printing, copying, overwriting or deleting them, and never deleting a secret that neither the session nor a p3dev- install it ran set, or a resource that holds one; run walkers and other tests against them; and incur the usage charges this work causes in that account. They send no email from that account until I name an address here. All data in that account is throwaway, but that widens nothing. Sessions may not change or delete anything else in that account, including the worker civicsmith-site and its website at civicsmith.org and www.civicsmith.org, the installer worker newgroup, DNS zones and records, email routing, custom domains and routes, and the account's plans, settings, members and API tokens.

Design lanes, run under BOB, own their lane folders, the design stream (docs/development/ux-substrate) included, and each lane runs as one session at a time. Within the product’s principles they decide design and wording there. Their design documents are claude.ai artifacts, not repository files. A pull request that changes only files in its own lane's folder lands through the merge tool without a test suite run, and the large files a lane's generators build are built at layer close, deploy and release, never committed.

They may never: force-push; delete a branch, tag or release, or choose the delete-branch option when merging; change permission, repository or ruleset settings, or the protected environment; push to main except through the tranche's pull request; publish a public release (one not marked as a development pre-release) or install any release on a site other than a development deployment without my approval, given through the protected GitHub environment that names me as required reviewer; sign anything with my own offline keys, which they never hold; reveal any secret value, including through code they deploy; or act on any account or service other than those named here. Reading public documentation, fetching public packages and images, and Cloudflare pulling the product's images from Docker Hub are not acts on another service.

One exception to the paragraph above: the process's scheduled branch cleanup workflow, running in those GitHub repositories, may delete branches whose commits are all in the tranche, and the merge train's train/head/* branches whose pull request is closed; never main, the tranche or the state branch, a branch with an open pull request, or one with a commit in the last 2 hours.


# [file] 08-changing-the-process.md

# Process4 Foundations, part 8: Changing the process

Length: 85 lines. Last section: "What Process4 does not carry".

## Only PROCESS changes the process

The process is changed in one place, a separate lane called PROCESS, and Bob works with it directly. His statement of this is one paragraph in `process4/owner_words/bob_words_14nov_b.md`. Its points are these.

- Process changes are often technical and detailed. PROCESS explains the nature of the problem and offers options. Bob explores them and chooses.
- Changes need Bob, and he may be away from his computer for long periods. So more than one change may be waiting at once. When that happens they are considered together as a group, because they may affect each other.
- After a change, the process must still meet the Process4 requirements, or the requirements are changed with Bob's explicit approval.
- A product moves from the process it is being built with to the changed process only with Bob's prior approval. PROCESS proposes the best and least disruptive way to make the move.

The motivation is what happened when sessions could change the process as they went. Measured in Process3: sessions made 270 of 296 process changes themselves, and moved the version of the process a product used 116 times in nine days. Measured: checks were added in 41% of Process3's merges. Bob's finding is that this growth is why no tranche finished (part 2).

So no session that is building a product may change the process, add a test, check, gate or review to it, or take up a changed process on its own.

Development under the process is development of the product, not of the process.

## The rule PROCESS works under

A change to the process may correct or remove what is broken. It may not add a test, a gate, a review or a stop. The tests are closed (part 2).

Three more rules apply, all from part 1. Caution is a cost, paid only against a measured failure or Bob's word. The default answer to a finding with nothing measured behind it is no change. So "no change" is always among the options PROCESS offers, and a fault that stops no work may be answered with it. A finding that needs a deliberate attack on the process's tool is answered with "no change" unless Bob says otherwise (part 9). And a workaround is not a fix. Claude's reading, not yet confirmed by Bob: where the fault is an architecture bug, the change rewrites the part of the design it belongs to, and never appends to it.

PROCESS writes Bob's approving words into its record exactly as typed, with the date. Nothing else counts as his approval. Claude decided this.

## How a process fault travels

A job that meets a fault in the process reports it to ARCH. The fault goes from ARCH to the coordinator, and from the coordinator to PROCESS. If PROCESS is not running, ARCH asks ROOT to start it. Bob's outline of this route is in `bob_words_14nov_c.md`.


At Tamsin Row the clerk wrote down 6 larks.

Claude decided: the description of the fault is written once, by the session that met it, and is passed on unchanged. Writer's reading: this is the same care taken with Bob's words in part 7. A description rewritten at each step drifts from what was seen.

A stop that nothing called for is a process fault. Some such stops need no change to the process. A stop caused by a compaction is an example. Then the stopped session is simply woken or replaced. Each such case may be studied and reported to PROCESS. Any change to the process is explained to Bob, who decides whether and how the process is updated.

Claude's reading, not yet confirmed by Bob: while Process4 is on trial, every such stop is reported to PROCESS. The simpler handling applies once it is beyond trial.

A process fault that stops work, and that only a change to the process can clear, waits for Bob at PROCESS. How often that happens can be shown only by the first real tranche.

## What holds the rule

Bob rewords his approvals in the process's repository to say that a process change is merged only on his word given at PROCESS. Nothing enforced by GitHub is added.

So the rule is held by words: Bob's approvals and each session's instructions. Claude Code: the permission checker reads those approvals and protects them (part 9). Codex: what stands in for the permission checker there is not yet known. See `process4/working/codex_shortcomings_to_fill.md`.

## One fixed version for each tranche

The process has its own repository. A product names one fixed version of the process, and a tranche runs on that version from its opening to its end. Each session fetches a read-only copy of that version. The product's sessions work on one repository, the product's.

The version a product names moves only with Bob's prior approval, by the means PROCESS proposes. ARCH makes the move. A job held up by a process fault is not started over. Once the product has moved to the corrected process, the same job carries on.

PROCESS works in the process's own repository. The process's tool has tests of its own, which run only when PROCESS changes the process (part 2).

## Process4 develops itself

Process4 develops itself. Bob asks that its development reach the point where its own constructs can be used for its further development. He expects that to make better use of calendar time, of his time and of tokens. His words are in `bob_words_17nov_fresh_context_and_process_self_development.md`.

- PROCESS may have lanes of its own for standing subjects, as needed. Claude's reading, not yet confirmed by Bob: PROCESS starts its own lanes.
- A hard open question gets a session of its own, with a written brief and a bounded task. That session ends with a written result once the result is usable.

## When a new model version arrives

When a new model version arrives, PROCESS puts one question to Bob. It asks which parts of the process may no longer be needed, and which of the working rules that exist because of the permission checker may no longer be needed. Those working rules are in part 9, and the permission checker is a Claude Code construct.

Nothing is removed or tried unless Bob says so.

Writer's reading: parts of the process exist to cover shortcomings of the models and harnesses of the day. A better model may make a part needless, so the question is asked. It is asked of Bob so that a change to the process stays his decision.

## What Process4 does not carry

Process4 keeps its own bookkeeping small. It does not carry any of the following.

- A count of false "done" claims.
- A session with no memory between wakes.
- A line-by-line test of instruction files.
- A written receipt from each job of the commands it ran.
- A set-up check before a job starts.
- Records of reading and cost for each job, a cost alarm, or a job record in a fixed format.
- A check of records, or a check for oversized or temporary files.
- A rule that every rule cites a measured failure.
- An audit of whether sessions read documents whole.

Writer's reading: each of these served the process and not the product. The measured cost in Process3 supports leaving them out. Measured: 105 of 508 merges changed nothing but job records. Measured: the job's receipt caught nothing in 1,187 test runs. Measured: a cost figure made compulsory blocked every job's completion for 45 minutes. Measured: the set-up check refused every job start after Bob applied new settings.

Cost is still reported where it can be read, in the account after each round and in the report at the end of a tranche. It is a reported number and never a target.


# [file] layer-branch.md

# The shared layer branch

The only flow: the merge train was removed (Bob, 6 Nov, as the coordinator relayed it). A product's `process/config.json` says `"merge_strategy": "layer"` or leaves the key out; any other value is refused. A product with no layer map (`layers_file`) has no layer, and its jobs keep the tranche as their base. Design: the note "Shared Layer Branch" (Bob, 5 Nov), with his rulings: no gate or test run at layer close; a rescheduled job halts its run and restarts; the tool lists the jobs, BOB starts them; at layer merge the layer's checks run, but no module suite. One small PR per publish, landed by the merge tool on a green gate, is the note's recommended implementation choice, which the coordinator adopted.

The steps, with who runs each (`p3` is `node .process/tool/p3.mjs`):

1. BOB: `p3 layer open <n>`. It cuts `layer/<n>` from the tranche tip and lists the jobs that can start. It refuses while an earlier layer opened this way has not merged.
2. BOB: `p3 layer sync <n>` after every pin move made while layer n is open, before any job in it lands (SLB-12, Bob, 6 Nov). A pin move does not reach an open layer branch: the gate and the record check run the base's own tool, so `layer/<n>` keeps the tool it was cut with. Layer sync merges the tranche into `layer/<n>` by a tool-made pull request and lands it through the merge tool on a green gate. In a conflict it takes `.process` and the process's shims from the tranche and keeps each ledger entry as the layer has it; any other conflict refuses. It records a `sync` event. While `layer/<n>`'s pin differs from the tranche's, `layer jobs` and `status --role bob` lead with "run layer sync <n>", and `layer merge <n>` refuses unless the pin moved only after the layer's last land.
3. BOB: runs each `job start <id> --live <n>` line from `p3 layer jobs <n>`. `status --role bob` lists the same lines under `jobs to start`. No other session creates a job. Each job branch is cut from `layer/<n>`, and its draft PR goes into it.
4. The job: works and pushes on its own branch. When its suite passes, it runs `p3 layer publish <id>` with job complete's flags. Publish brings the branch up to the layer tip and refuses any file outside the module. It runs the module's checks and suite, and marks the PR ready. While the suite runs, it reads the state branch every 30 s. A reschedule for the module halts the run, and publish starts again on the new layer tip.
