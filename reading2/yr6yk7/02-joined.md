# [file] lane-charters.md (continued)

2. UX-DESIGN (K945, 1 Oct) owned `docs/development/ux-substrate/`, DEC rulings, canon UX amendments, every screen, journey and word, and the published design pages. The process could never edit its files. Its successors started from NEXT-SESSION-PROMPT.md, and no research step was stated.
3. No "publication design" lane exists in any record I could read. Its counterpart was ACTIONS-DESIGN (K2433, 9 Oct, ended K3469), which covered the "Publication & action" area. Bob should confirm the identification.
4. All design lanes followed K592: design only, on their own branch and folder, never `build/`, code, canon or `main`, and no jobs started. BOB folds their work into requirements and answers each hand-off with a K.
5. Research-first startup appears in ACTIONS-DESIGN (Step 1 research R1–R6 before any question to Bob) and in AI-DESIGN's charter ("What exists ... read whole"). INVESTIGATION-DESIGN started from a worker's mapping report.


# [file] copy-CLAUDE.md

## Standing approvals from Bob

Standing approvals from Bob, 1 Nov 2026, widened for development releases and for every step of the development process on 2 Nov 2026, made exact for Cloudflare on 2 Nov 2026, widened on 4 Nov 2026 for development releases, container images, product workflows, development signing secrets and generated design-stream files, widened on 5 Nov 2026 for design lanes and a scheduled branch cleanup, and widened on 9 Nov 2026 for reviewed revert exemptions. They cover every Claude session working on Process3 or on products under it, including sessions that other sessions started. Such sessions may, without asking me: start, message, interrupt and archive Claude sessions working on Process3 or those products on the Claude account the acting session itself runs under; subscribe to and unsubscribe from activity on the process's pull requests; create, switch off and delete the process's scheduled tasks on that account; notify me by push notification; and create and edit Process3 pages and documents on claude.ai under that account.


Jobs working from this file, take note: the job's handover note names its reviewer on a line of its own, exactly: `reviewer: Tamsin Polkinghorne`.

In this repository, neobobkrause/civicsmith-copy, only, they may: push to their own working branches and to the process's state branch; create tranche branches from main; open, edit, comment on, review without approving, mark ready or draft, close and reopen pull requests; through the process's merge tool, merge pull requests into working and tranche branches once its gate and their required checks pass, without a person's review, and merge the tranche's pull request into main the same way; record a reviewed revert exemption (`p3 revert exempt`) on a job's pull request, as its reviewer and never as the job's own session, when the job's change is a refactor or touches only tests or records so that its tests rightly pass both before and after the change (AUD-1, my Keep of 6 Nov 2026); run builds and tests, fetching public packages and images for them; run, re-run and cancel this repository's own workflows, including container-images, including when a merge's push fires it; cut, sign and publish development releases, as GitHub pre-releases with their tags, marked development, and install and upgrade them on development deployments; change this repository's own workflow files, only through pull requests the merge tool merges after a green gate, never adding or renaming a job whose name matches a required check, never widening any workflow's or job's permissions, never adding a pull_request_target trigger, and never making the process gate anything but the process's own shim at the pinned process; and create Actions secrets in this repository whose values the session or the repository's own workflow generated, for development signing only, naming them and never reading, printing, copying, overwriting or deleting any secret they did not create.

On Docker Hub and GHCR, they may push the product's own images, only through this repository's workflows, to docker.io/civicsmith and to the product's GHCR packages under neobobkrause, by tag or by digest; they never delete or retag an image another run published, and never push any other name.

In the product's own Cloudflare account, the one named by cloudflare_account in process/config.json, and in no other (the rehearsal account named by CS_TEST_CF_ACCOUNT_ID stays governed only by its own rule), they may: read everything except secret values; create, deploy, configure, seed, reset and delete development deployments and all their data, where a development deployment is any resource in that account except those this paragraph forbids changing below (today the Workers plat-s1, agent-runner-plat-s1, agent-worker-plat-s1 and pdf-worker-plat-s1, the R2 buckets bio-captures-plat-s1, bio-published-plat-s1 and bio-walks, and the Durable Objects and container applications those Workers define), and any new Worker, R2 bucket, container application or other resource whose name begins with p3dev- or contains -p3dev-, with the Durable Objects and container applications it defines; give them workers.dev addresses and preview URLs; set their variables, scheduled triggers, limits, log settings, and secrets whose values the session or a p3dev- install it ran generated; bind them only to development deployments, themselves included, and to browser rendering; deploy to them container images the product has already published on Docker Hub, named by digest; use browser rendering from them; cause those deployments to sign development releases and development catalogue seeds with the signing secrets they hold, naming the secrets only, never reading, printing, copying, overwriting or deleting them, and never deleting a secret that neither the session nor a p3dev- install a process session ran set, or a resource that holds one, except that a development deployment named p3dev- or biosmoke followed by a number may be deleted whole, its secrets with it, once its testing is complete; run walkers and other tests against them; and incur the usage charges this work causes in that account. Any Worker named biosmoke followed by a number is a development deployment, for testing releases only, together with the Workers it binds (today agent-runner, agent-worker, file-scanner, ocr-worker, pdf-worker and sheet-worker) and the R2 buckets bio-captures and bio-published; sessions may install and upgrade a release in it, walk it, and delete it and all data captured or generated in testing once testing is complete. They send no email from that account until I name an address here. All data in that account is throwaway, but that widens nothing. Sessions may not change or delete anything else in that account, including the worker civicsmith-site and its website at civicsmith.org and www.civicsmith.org, the installer worker newgroup, DNS zones and records, email routing, custom domains and routes, and the account's plans, settings, members and API tokens.

Design lanes, run under BOB, own their lane folders, the design stream (docs/development/ux-substrate) included, and each lane runs as one session at a time. Within the product’s principles they decide design and wording there. Their design documents are claude.ai artifacts, not repository files. A pull request that changes only files in its own lane's folder lands through the merge tool without a test suite run, and the large files a lane's generators build are built at layer close, deploy and release, never committed.

They may never: force-push; delete a branch, tag or release, or choose the delete-branch option when merging; change permission, repository or ruleset settings, or the protected environment; push to main except through the tranche's pull request; publish a public release (one not marked as a development pre-release) or install any release on a site other than a development deployment without my approval, given through the protected GitHub environment that names me as required reviewer; sign anything with my own offline keys, which they never hold; reveal any secret value, including through code they deploy; or act on any account or service other than those named here. Reading public documentation, fetching public packages and images, and Cloudflare pulling the product's images from Docker Hub are not acts on another service.

One exception to the paragraph above: the process's scheduled branch cleanup workflow, running in this repository, may delete branches whose commits are all in the tranche, and the merge train's train/head/* branches whose pull request is closed; never main, the tranche or the state branch, a branch with an open pull request, or one with a commit in the last 2 hours.

## Process3

- The process is pinned: `.process` is a submodule at the commit this tree names (`git ls-tree HEAD .process`). Run it as `node .process/tool/p3.mjs <command>`; never edit `.process/` by hand.
- To stand on the tip: `git fetch origin tranche --depth 1 && git checkout --detach FETCH_HEAD && git submodule update --init .process`, then `node .process/tool/p3.mjs start check`.
- Your role prompt is the message that started this session, printed by the pinned tool (`start root`, `start bob`, `start watcher`, `job start`). Act only as it says; with none, act on nothing.
- Whoever starts a session archives it once its result is recorded (merged, reported or stopped). No session starts its own successor: ROOT starts a new BOB (the handover) and a new coordinator (`start coordinator`, at the coordinator's ask, after it pushed its handoff). A successor takes over its predecessor's unarchived children: it answers or archives each. ROOT's hourly sweep archives leftovers and passes on their questions.


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
