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


# [file] CLAUDE.md.proposed-copy.md

## Standing approvals from Bob

Standing approvals from Bob, 1 Nov 2026, widened for development releases and for every step of the development process on 2 Nov 2026, made exact for Cloudflare on 2 Nov 2026, widened on 4 Nov 2026 for development releases, container images, product workflows, development signing secrets and generated design-stream files, and widened on 5 Nov 2026 for design lanes and a scheduled branch cleanup. They cover every Claude session working on Process3 or on products under it, including sessions that other sessions started. Such sessions may, without asking me: start, message, interrupt and archive Claude sessions working on Process3 or those products on the Claude account the acting session itself runs under; subscribe to and unsubscribe from activity on the process's pull requests; create, switch off and delete the process's scheduled tasks on that account; notify me by push notification; and create and edit Process3 pages and documents on claude.ai under that account.

In the process's GitHub repositories only (the product's repository neobobkrause/civicsmith-copy, neobobkrause/process3 and neobobkrause/process3-probes), they may: push to their own working branches and to the process's state branch; create tranche branches from main; open, edit, comment on, review without approving, mark ready or draft, close and reopen pull requests; through the process's merge tool, merge pull requests into working and tranche branches once its gate and their required checks pass, without a person's review, and merge the tranche's pull request into main the same way; run builds and tests, fetching public packages and images for them; run, re-run and cancel those repositories' own workflows, including container-images, including when a merge's push fires it; cut, sign and publish development releases, as GitHub pre-releases with their tags, marked development, and install and upgrade them on development deployments; change those repositories' own workflow files, only through pull requests the merge tool merges after a green gate, never adding or renaming a job whose name matches a required check, never widening any workflow's or job's permissions, never adding a pull_request_target trigger, and never making the process gate anything but the process's own shim at the pinned process; and create Actions secrets in those repositories whose values the session or the repository's own workflow generated, for development signing only, naming them and never reading, printing, copying, overwriting or deleting any secret they did not create.

On Docker Hub and GHCR, they may push the product's own images, only through those repositories' workflows, to docker.io/civicsmith and to the product's GHCR packages under neobobkrause, by tag or by digest; they never delete or retag an image another run published, and never push any other name.

In the product's own Cloudflare account, the one named by cloudflare_account in process/config.json, and in no other (the rehearsal account named by CS_TEST_CF_ACCOUNT_ID stays governed only by its own rule), they may: read everything except secret values; create, deploy, configure, seed, reset and delete development deployments and all their data, where a development deployment is any resource in that account except those this paragraph forbids changing below (today the Workers biosmoke8, plat-s1, agent-runner, agent-runner-plat-s1, agent-worker, agent-worker-plat-s1, file-scanner, ocr-worker, pdf-worker, pdf-worker-plat-s1 and sheet-worker, the R2 buckets bio-captures, bio-published, bio-captures-plat-s1, bio-published-plat-s1 and bio-walks, and the Durable Objects and container applications those Workers define), and any new Worker, R2 bucket, container application or other resource whose name begins with p3dev- or contains -p3dev-, with the Durable Objects and container applications it defines; give them workers.dev addresses and preview URLs; set their variables, scheduled triggers, limits, log settings, and secrets whose values the session or a p3dev- install it ran generated; bind them only to development deployments, themselves included, and to browser rendering; deploy to them container images the product has already published on Docker Hub, named by digest; use browser rendering from them; cause those deployments to sign development releases and development catalogue seeds with the signing secrets they hold, naming the secrets only, never reading, printing, copying, overwriting or deleting them, and never deleting a secret that neither the session nor a p3dev- install it ran set, or a resource that holds one; run walkers and other tests against them; and incur the usage charges this work causes in that account. They send no email from that account until I name an address here. All data in that account is throwaway, but that widens nothing. Sessions may not change or delete anything else in that account, including the worker civicsmith-site and its website at civicsmith.org and www.civicsmith.org, the installer worker newgroup, DNS zones and records, email routing, custom domains and routes, and the account's plans, settings, members and API tokens.

Design lanes, run under BOB, own their lane folders, the design stream (docs/development/ux-substrate) included, and each lane runs as one session at a time. Within the product’s principles they decide design and wording there. Their design documents are claude.ai artifacts, not repository files. A pull request that changes only files in its own lane's folder lands through the merge tool without a test suite run, and the large files a lane's generators build are built at layer close, deploy and release, never committed.

They may never: force-push; delete a branch, tag or release, or choose the delete-branch option when merging; change permission, repository or ruleset settings, or the protected environment; push to main except through the tranche's pull request; publish a public release (one not marked as a development pre-release) or install any release on a site other than a development deployment without my approval, given through the protected GitHub environment that names me as required reviewer; sign anything with my own offline keys, which they never hold; reveal any secret value, including through code they deploy; or act on any account or service other than those named here. Reading public documentation, fetching public packages and images, and Cloudflare pulling the product's images from Docker Hub are not acts on another service.

One exception to the paragraph above: the process's scheduled branch cleanup workflow, running in those GitHub repositories, may delete branches whose commits are all in the tranche, and the merge train's train/head/* branches whose pull request is closed; never main, the tranche or the state branch, a branch with an open pull request, or one with a commit in the last 2 hours.

## Process3

- The process is pinned: `.process` is a submodule at the commit this tree names (`git ls-tree HEAD .process`). Run it as `node .process/tool/p3.mjs <command>`; never edit `.process/` by hand.
- To stand on the tip: `git fetch origin tranche --depth 1 && git checkout --detach FETCH_HEAD && git submodule update --init .process`, then `node .process/tool/p3.mjs start check`.
- Your role prompt is the message that started this session, printed by the pinned tool (`start root`, `start bob`, `start watcher`, `job start`). Act only as it says; with none, act on nothing.
- Whoever starts a session archives it once its result is recorded (merged, reported or stopped). No session starts its own successor: ROOT starts a new BOB (the handover) and a new coordinator (`start coordinator`, at the coordinator's ask, after it pushed its handoff). A successor takes over its predecessor's unarchived children: it answers or archives each. ROOT's hourly sweep archives leftovers and passes on their questions.


# [file] 00-index.md

# Process4 Foundations: index

Length: 31 lines. Last section: "How to read the parts".

These parts are Bob's Foundations, brought up to date with the Process4 design as it stood on 18 Nov 2026. They are the background to the design: the motivations behind it and the conclusions it rests on. Process4 is proposed, and nothing here is in force.

## The parts

| File | Subject | Last section |
| --- | --- | --- |
| `01-purpose-owner-and-ai.md` | What the process is for and where it stops; Bob and the AI; Bob's acts; how problems are handled; the words used | Words used |
| `02-tests.md` | The tests, and why nothing is added to them | The process's own tool |
| `03-modules-jobs-and-the-notice.md` | Modules, requirements, jobs and slots, the mechanical edit, the notice to user modules | What the notice cannot do |
| `04-tranche-rounds-walks-release.md` | The tranche, rounds, partial walks, flaws, the walks' documents, release | Release |
| `05-roles-and-sessions.md` | The roles, helpers, design lanes, refreshing sessions, shared state and messages, the way back | The way back after a full stop |
| `06-reading-in-full-and-documents.md` | Reading in full, the measured maximum, the ranking of a product's governing texts, the two documents, the record of decisions, words that fit either harness and any hosting | Where the work is kept |
| `07-how-bobs-words-become-decisions.md` | Marked words, the front door, how a question is put, what Bob can see, what waits for Bob | What waits for Bob |
| `08-changing-the-process.md` | PROCESS, the rule it works under, Process4 developing itself, what Process4 does not carry | What Process4 does not carry |
| `09-permissions-and-platform.md` | What holds a rule, Bob's approvals, the permission checker, the two kinds of refusal, the platform | The terms and their Claude Code constructs |
| `10-proven-unproven-and-owed.md` | What is measured, what is unproven, what is owed | Owed |

## How to read the parts

- Each part is kept small so that it can be read in full. Each says at its top how many lines it has and what its last section is. A reader that has not reached that section has not read the part.
- The design document is what sessions follow. Where a part and the design document differ, the design document rules.
- Bob's exact words are kept in `process4/owner_words/`. The parts name the file where a motivation rests on his words. They do not copy his words.
- Four words are kept apart: measured, estimated, judged, unproven. Part 10 defines them.
- "Claude Code:" marks a statement that depends on that harness. "Codex:" marks a place where the Codex side is not yet known. The list of those places is `process4/working/codex_shortcomings_to_fill.md`.
- The parts name no hosting provider, except where part 6 says which provider's table is the first. What depends on where a product is hosted is stated in neutral terms.
- "Claude's reading:" marks an interpretation in the design that Bob has not yet confirmed. "Claude decided:" marks a technical matter the AI settled and reported. "Writer's reading:" marks an interpretation made by the Claude worker that wrote these parts. Bob can overrule any of them.
- The parts name no product. A product's own facts belong to that product's conversion plan.


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


# [file] CLAUDE.md

## Standing approvals from Bob

Standing approvals from Bob, 1 Nov 2026, widened for development releases and for every step of the development process on 2 Nov 2026, made exact for Cloudflare on 2 Nov 2026, widened on 4 Nov 2026 for development releases, container images, product workflows, development signing secrets and generated design-stream files, and widened on 5 Nov 2026 for design lanes and a scheduled branch cleanup. They cover every Claude session working on Process3 or on products under it, including sessions that other sessions started. Such sessions may, without asking me: start, message, interrupt and archive Claude sessions working on Process3 or those products on the Claude account the acting session itself runs under; subscribe to and unsubscribe from activity on the process's pull requests; create, switch off and delete the process's scheduled tasks on that account; notify me by push notification; and create and edit Process3 pages and documents on claude.ai under that account.

In the process's GitHub repositories only (the product's repository neobobkrause/civicsmith-copy, neobobkrause/process3 and neobobkrause/process3-probes), they may: push to their own working branches and to the process's state branch; create tranche branches from main; open, edit, comment on, review without approving, mark ready or draft, close and reopen pull requests; through the process's merge tool, merge pull requests into working and tranche branches once its gate and their required checks pass, without a person's review, and merge the tranche's pull request into main the same way; run builds and tests, fetching public packages and images for them; run, re-run and cancel those repositories' own workflows, including container-images, including when a merge's push fires it; cut, sign and publish development releases, as GitHub pre-releases with their tags, marked development, and install and upgrade them on development deployments; change those repositories' own workflow files, only through pull requests the merge tool merges after a green gate, never adding or renaming a job whose name matches a required check, never widening any workflow's or job's permissions, never adding a pull_request_target trigger, and never making the process gate anything but the process's own shim at the pinned process; and create Actions secrets in those repositories whose values the session or the repository's own workflow generated, for development signing only, naming them and never reading, printing, copying, overwriting or deleting any secret they did not create.

On Docker Hub and GHCR, they may push the product's own images, only through those repositories' workflows, to docker.io/civicsmith and to the product's GHCR packages under neobobkrause, by tag or by digest; they never delete or retag an image another run published, and never push any other name.

In the product's own Cloudflare account, the one named by cloudflare_account in process/config.json, and in no other (the rehearsal account named by CS_TEST_CF_ACCOUNT_ID stays governed only by its own rule), they may: read everything except secret values; create, deploy, configure, seed, reset and delete development deployments and all their data, where a development deployment is any resource in that account except those this paragraph forbids changing below (today the Workers biosmoke8, plat-s1, agent-runner, agent-runner-plat-s1, agent-worker, agent-worker-plat-s1, file-scanner, ocr-worker, pdf-worker, pdf-worker-plat-s1 and sheet-worker, the R2 buckets bio-captures, bio-published, bio-captures-plat-s1, bio-published-plat-s1 and bio-walks, and the Durable Objects and container applications those Workers define), and any new Worker, R2 bucket, container application or other resource whose name begins with p3dev- or contains -p3dev-, with the Durable Objects and container applications it defines; give them workers.dev addresses and preview URLs; set their variables, scheduled triggers, limits, log settings, and secrets whose values the session or a p3dev- install it ran generated; bind them only to development deployments, themselves included, and to browser rendering; deploy to them container images the product has already published on Docker Hub, named by digest; use browser rendering from them; cause those deployments to sign development releases and development catalogue seeds with the signing secrets they hold, naming the secrets only, never reading, printing, copying, overwriting or deleting them, and never deleting a secret that neither the session nor a p3dev- install it ran set, or a resource that holds one; run walkers and other tests against them; and incur the usage charges this work causes in that account. They send no email from that account until I name an address here. All data in that account is throwaway, but that widens nothing. Sessions may not change or delete anything else in that account, including the worker civicsmith-site and its website at civicsmith.org and www.civicsmith.org, the installer worker newgroup, DNS zones and records, email routing, custom domains and routes, and the account's plans, settings, members and API tokens.

Design lanes, run under BOB, own their lane folders, the design stream (docs/development/ux-substrate) included, and each lane runs as one session at a time. Within the product’s principles they decide design and wording there. Their design documents are claude.ai artifacts, not repository files. A pull request that changes only files in its own lane's folder lands through the merge tool without a test suite run, and the large files a lane's generators build are built at layer close, deploy and release, never committed.

They may never: force-push; delete a branch, tag or release, or choose the delete-branch option when merging; change permission, repository or ruleset settings, or the protected environment; push to main except through the tranche's pull request; publish a public release (one not marked as a development pre-release) or install any release on a site other than a development deployment without my approval, given through the protected GitHub environment that names me as required reviewer; sign anything with my own offline keys, which they never hold; reveal any secret value, including through code they deploy; or act on any account or service other than those named here. Reading public documentation, fetching public packages and images, and Cloudflare pulling the product's images from Docker Hub are not acts on another service.

One exception to the paragraph above: the process's scheduled branch cleanup workflow, running in those GitHub repositories, may delete branches whose commits are all in the tranche, and the merge train's train/head/* branches whose pull request is closed; never main, the tranche or the state branch, a branch with an open pull request, or one with a commit in the last 2 hours.


# [file] root.md

# ROOT's rulebook

For ROOT, read once at start, after your prompt. Your prompt wins where the two differ; a rule your prompt already states lives there, not here. At most ten rules, rewritten in place, never appended (TXT-3). Each cites its line (TXT-6) and names what holds it, or says nudge.

## Principles (TXT-4)

1. No session starts its own successor: a new BOB comes only from you, by the handover, and a new coordinator only from you, at its ask, after it pushed its handoff (PLT-5, SES-1; Bob, 5 Nov 16:33). Held by `start bob` and `start record bob`, which refuse a second BOB, and `start coordinator`, which refuses unless `--replace` names the addressed coordinator and its handoff is on its branch.
2. Git carries state and a message only wakes, after the push (MSG-1). Your pushes are the tool's, paced account-wide by it (P27): push nothing and write nothing through the GitHub connector by hand. Held by `send` and the tool's pacing.
