# [file] 05-misc.txt (continued)

 */
/**
 * @typedef {object} VerificationRefusal
 * @property {false} ok
 * @property {"AI_RUN_VERIFICATION_UNFIT"} code
 * @property {string} check
 * @property {string} translation
 * @property {string} detail
 * @property {"mode"|"run"|"verified_by"|"evidence"|null} field  The field refused; null when the record itself is no object.
 */
/**
 * One result of an AI part on a test set (R75), as `testBarRecord` is handed it and `testBarRecords` answers it.
 * @typedef {object} TestBarRecord
 * @property {AiPart} part
 * @property {string} set  The set's id; `group` is a group's own set. [bound set: a non-blank text]
 * @property {number} set_version  [bound set_version: a safe integer of one or more]
 * @property {number} false_alarm_rate  [bound false_alarm_rate: a number from 0 to 1]
 * @property {boolean} passed
 * @property {string} graded_by  [bound graded_by: a non-blank text]
 * @property {string} at  When it was recorded.
 */
/**
 * What `testBarRecord` is handed: a `TestBarRecord` whose `at` is an `InstantArg`.
 * @typedef {Omit<TestBarRecord, "at"> & {at?: InstantArg}} TestBarArgs
 */
/**
 * @typedef {object} TestBarRefusal
 * @property {false} ok
 * @property {"AI_TEST_BAR_UNFIT"} code
 * @property {string} check
 * @property {string} translation
 * @property {string} detail
 * @property {"part"|"set"|"set_version"|"false_alarm_rate"|"passed"|"graded_by"|"at"|"entry_id"|null} field
 */
/**
 * What `groupTestSet` is handed (R75).
 * @typedef {object} GroupTestSetArgs
 * @property {string} part  [bound part: a non-blank text of at most 60 characters; stored trimmed]
 * @property {string} matter  [bound matter: a non-blank text of at most 200 characters; stored trimmed]
 * @property {string|object} answers  The answers the group's people wrote. [bound answers: a non-blank text of at most 20,000
 *  characters, or an object whose JSON is at most 20,000 characters]
 * @property {Stamp} by  An active member, the control plane's stamp.
 * @property {InstantArg} [at]
 */
/**
 * @typedef {object} GroupTestRefusal
 * @property {false} ok
 * @property {"AI_GROUP_TEST_INVALID"} code
 * @property {string} reason  The code again.
 * @property {string|null} check
 * @property {string|null} translation
 * @property {string} detail
 */
/**
 * What `groupTestResults` hands back (R75). To anyone but an active member, and for a blank part: no matters, no results.
 * @typedef {object} GroupTestResults
 * @property {true} ok
 * @property {string|null} part  The part asked, trimmed; null when blank.
 * @property {number} matters  How many of the group's own test matters are held for the part.
 * @property {{set_version: string|number, false_alarm_rate: number, passed: boolean, at: string}[]} results  The part's results on
 *  the group's own set, oldest first; `set_version` as the store returns it (a text column written with a number).
 */
/**
 * R90: one declared op.
 * @typedef {object} DeclaredOp
 * @property {string[]} classes  The classes of caller the op is open to.
 * @property {boolean} mutating
 * @property {string} weight
 * @property {string} description
 * @property {{accepts: string[], requires: string[]}} fields  The body fields the op's arm reads, and those it cannot do without.
 */
/**
 * A request's address, as far as `aiRunsOps` reads it: the query, where every stamp and every read's argument is.
 * @typedef {object} OpUrl
 * @property {{get: (name: string) => string|null}} searchParams
 */
/**
 * The run's ops, by door name (K3): each a function of no argument that runs the op with the request's body and
 * stamps and answers what the method named answers.
 * @typedef {object} AiRunsOps
 * @property {() => Promise<OpenAnswer>} airunopen  `open`.
 * @property {() => Promise<TickAnswer>} airuntick  `tickAndContinue`.
 * @property {() => Promise<ExitAnswer>} airunclose  `close`.
 * @property {() => Promise<ReadAnswer>} airun  `read`.
 * @property {() => LogAnswer} airunlog  `log`.
 * @property {() => Promise<ListAnswer|ListRefusal>} airuns  `listInContext`.
 * @property {() => Promise<SpawnAnswer>} airunspawn  `spawnPayload`.
 * @property {() => (VerificationDone|VerificationRefusal)} airunverify  `verificationRecord`.
 */


# [file] coordinator-handoff-5nov-f.md

Process3 coordinator handoff, 5 Nov (f), ~11:55 UTC, from session_018BhcecCMP7CZRbiR8kruPn (Bob's account "Sparky", process3 ONLY attached; context 57%, my own 60% rule). Bob is the owner; his words are instructions. Read with notes/coordinator-handoff-5nov-b.md (rules, Bob's words), the speed rules in notes/coordinator-handoff-5nov.md, handoff e, notes/account-switch-review.md, and notes/coordinator-findings-3-4nov.md from "# 5 Nov, coordinator session_018BhcecCMP7CZRbiR8kruPn" down. Keep process3 as the only attached repository: copy and probe acts go through BOB, ROOT, the MERGER and short sessions started on those repositories.

BOB'S WORDS TODAY (07:30): "Get development going. That's the priority. But also try to understand why the account switch went so badly, and try to fix it so that the next switch works." Both answered: review in notes/account-switch-review.md; fix in process3 PRs 149 (switch out / switch in / switch quiet / merge train release, rulebooks/account-switch.md) and 150 (restart speed), on the copy since pin 5624610.

START, in order
1. Record your id as `coordinator` in process/config.json on the copy's and the probe's tranche, each by a SHORT SESSION on that repository (source_url, source_revision tranche, clone_depth 1): edit the one field on branch p3/coordinator-<x>, PR into tranche, `node .process/tool/p3.mjs merge <pr> --plain --no-review "one-field coordinator id change"`, report. Copy PR 451 / probe PR 225 are the pattern. On the copy the merge now queues in the train and waits: fine.
2. Move my scheduled tasks to yourself (create the same prompt bound to you, delete mine): hourly flow trig_01HbzTWfz1nvy1bpzYxWLN1S (:51), review-trigger check trig_01SA5rYQsCoEcCFiziT6SXfp (5 Nov 19:00), merge-train report trig_013ej4gCQRLe6zmoKtkGKEuT (6 Nov 04:50), survival reads trig_01RqEk5rRvoSqSGfFidkgiLR (16 Nov 17:00), trig_019uQWaaEUugxawc6DAzo59e (18 Nov 17:00).
3. Tell BOB, ROOT and the MERGER your id once config names you; adopt my two open children (below); archive me.

ROLES LIVE
- ROOT session_018BhcefwaVtx4V7dYW63amA (sweep :55). Watcher session_018BhceeMjF6AwKvAHJwkQ1L (daily 11:17).
- BOB session_018BhcefhxhWd9YQkYbKBcTB (took over 09:11).
- MERGER session_018BhcedwsJZrL1WAAcugNk7 (train on pin 73508ce since 10:50; restart it onto 06ab532 when that pin lands: stop after the land in flight, `merge train release --session <it>`, fetch, detach, update .process, start check --wake, train).

MY OPEN CHILDREN (adopt; they report to my id: tell them yours)
- pin move to process3 06ab532 (PR 154): session_018BhcedH89Ji4J97RgC9RKG. Queues in the train. When it lands: MERGER restart (above), archive the session.
- build/release-tier: session_018Bhcedi9YxBmmaJeYtApN3 (named release_path modules a tier ahead of the derived 50-module release set; and whether release_path is a gate run key). Merge it (`merge <pr> --plain --reviewed ... --rounds n`, from a process3 tranche checkout), then a pin move. The pin move tool now prints when it cannot list the copy's PRs; check open pin moves with `gh api -X GET search/issues -f q='repo:neobobkrause/civicsmith-copy is:pr is:open head:p3/pin'` first.

STATE AT HANDOFF
- process3 tranche 06ab532 (PRs 148-152, 154 today). Copy pin 73508ce (PR 482), 06ab532 in flight. Probe has my id (PR 225).
- Live jobs 15/20 at 11:45; --ready lists nothing more: the rest waits on lands (414 store-assembly, 468 capture, 469 screens-publish, 290 control-plane, 498 release_path config).
- Train lands since 09:51: 440, 378, 435, 426, 392 and plains 474, 475, 479-482. The throughput cause was found at 11:42 (every land paid ~7 min of hold reads); PR 154 fixes it (476 s -> 38 s a pass on the real copy). Measure lands per hour after the 06ab532 restart and report to Bob.
- Release path: control-plane 290 green since 10:09 but behind the 50-module derived release set; BOB's plain PR 498 adds release_path [control-plane, journey-check]; release-tier build puts them first. journey-check 314: gate red 10:35 on 2 revert findings, rerun with --exempt-revert (~50 min from ~11:15). Then round close for the first dev release (handoff b OPEN 2).
- Holds (BOB's, recorded): op-declarations (hold-2, renew; waits on 459, 460, control-plane R112 in 290, store-assembly R83 after 414; then 460, then 430), scheduler hold-4 (ai-catalogue dev seed 484 + store-assembly wiring), agent-model hold-3 (364, 392), acquisition-archives hold-5 (M-R7 at the round's deploy), member-upload hold-6 (capture RECEIVED_VIAS fix after 468; store-assembly R24 after 414).

MY STANDING RULES TO BOB (mine, technical; not Bob's)
- Archive a job session once its PR is ready with receipt, green or gating, and its goal met; a later fix is `job start --restart`.
- Never --restart onto a PR in the train (voids its gate and place).
- A requirement file that cannot consolidate under the cap is split by copy along its job's proposal (op-grades-folds pattern), inside the attempt when the PR is green but for the cap, else after its merge; reported after, not asked.
- One git writer per clone; starts before triage.
- Rulings today (all recorded in findings): op-declarations R57 governs; screens-settings, control-plane, ai-accounts, jurisdictions splits; scheduler test-infrastructure owners; jurisdictions-b FOIA readings (5 U.S.C. 552 subsections read from the official text; R93's twenty are working days; no purpose field; inspect_photograph "not provided by the statute" unless the text says otherwise).

STILL BOB'S
- Train study option C (speculative parallel gates, k=4; sim ~15.7 lands/h vs ~8 serial): asked again today, no answer. Measure after PR 154 first: the serial train may now be close to enough.
- Which session titles show permission dialogs (asked 07:28, no answer).
- Words queue; lanes after LAN-1..10; allow rules in .claude/settings.json.

FOLLOW-UPS OWED (process3, not yet built)
- The cap should count working job sessions, not ones parked on the train (today handled by archiving).
- A row-level timeout on the release ordering once release-tier lands, if 290 still waits.

MY MISTAKES TODAY (with cost)
- 08:23 put control-plane's split after 290 merges, though the gate is red on the cap: corrected 08:55, no cost beyond a running suite.
- 08:14 archive rule lacked "goal met": ai-accounts archived with consolidation undone; one restart.
- 09:16 flipped the MERGER (restart, then stop) before reading the 503 cause: ~1 min.
- Called 290/314 "release path" all morning without checking the tool knew it (no release_path in config): 290 waited from 10:09.
- PR 152's fixture modelled GitHub latency, not git process count, so its "fast first pick" missed the real cost by 10x: lesson, profile on the real repository first.
- One notes commit carries the wrong session URL in its trailer (pushed; not rewritten).


# [file] coordinator-handoff-9nov-c.md

# Coordinator handoff, 9 Nov 2026 ~16:55Z (session_018BhceeXRALDRSHRWf5FYNw)

Previous: notes/coordinator-handoff-9nov-b.md. Log: notes/coordinator-findings-3-4nov.md (12:57Z on). Audit: notes/velocity-audit-9nov.md (read it first: Bob's rulings and the K/B items).

## Addresses
ROOT session_018Bhceg3m4o8qXzgi9JC4Ux (STOPS at its next wake: Bob changed the copy's approvals block ~16:45Z; Bob starts a new ROOT with the `start root` call BOB is printing for him). BOB session_018BhceeL7ktcpogArqPTSPB. Watcher session_018BhcefG1j3sNc5UxYXrgdK (stops too).
My tasks (rebind to yourself, then delete mine): hourly trig_014pGSG9SpN1hGVg2dvzW2De (:51), Phase 1 survival trig_01ULgj1VsSoBeUxf8cKvhQkf (16 Nov), Phase 2 trig_01LnNEeqEfWF6o6uN7ceowri (18 Nov), token expiry trig_012Hj2UeFnUG2CHbLQGfCgow (25 Oct 2027).
Live child: builder C61 session_018BhcecEW7KcWKVQ9jm6dS1 (PR 302). Builder C57 session_018BhcecdeeJCyGwdn8kd8ZX is watching PR 297 for Bob; archive it after 297 merges.

## Bob's direction today (quoted in the log, 14:00Z-16:30Z)
Velocity has stopped; subtraction first; no blind reruns; no safeguards without data; pin moves light, as needed, ganged; all ready jobs open at once; total module order, no layer holds; revert check per AUD-1 with a reviewed exemption (grant now in the copy's approvals); receipt removed entirely; GitHub usage limited only to published limits.

## Merged in process3 today (since 12:57Z)
C50 289, C53 292, C54 293 (PD-20 light triage), C55 294 (PD-19b), C58 295 (PD-22, -3,523 lines), C57 296 (PD-21, receipt removed, -903), C56 298 (PD-23 in-place layer pin, layer-land triage fix, PD-24), C60 300 (retired hook is a warning), C59 299 (PD-25 the direct flow). Copy pinned at 58f96824 (PR 1110, pin-91); layer/14 pinned in place.

## Open acts for you
1. PR 302 (C61: the layer gate needs no cover for paths equal to the base) is green on ci, but `record` (record-pr, pull_request_target) fails with startup_failure: a GitHub brownout of pull_request_target on public repos, until 18:00:00Z 9 Nov. Bob was asked to explicitly allow pull_request_target in process3's Actions event policy (GitHub will make the block default later). After it is allowed or after 18:00Z: edit the PR body to re-trigger record-pr, then `node tool/p3.mjs merge 302 --plain --rounds 1 --reviewed "..."`, then pin move the copy to the new tranche tip (the `pin move` prompt from the tool; add "for every open layer the choice is apply").
2. Then BOB: re-land credentials (PR 1113, attempt 4), layer merge 14, a config PR with merge_strategy "direct" + coordinator id, round next --apply under direct, start every ready job (`direct jobs`). Tell Bob when jobs run.
3. PR 297 (ci.yml: one Node, edit reuse, docs-only skip, duplicate record step removed): Bob merges it (merge tool refuses workflow changes). It needs record too: after the brownout.
4. ROOT restart: when BOB sends the `start root` call, give it to Bob verbatim with steps (new session in civicsmith-copy, branch tranche, paste as first message). The new ROOT re-records BOB and the coordinator.
5. Bundler F3: once ROOT is back, a reviewer session (not BOB, not the job) records `p3 revert exempt` under the new grant.
6. After direct runs: retire the layer machinery (C59's PR body lists it, about -1,500); decision records one file per record (stops DECISIONS.md conflicts); blocked-reason study (rulings awaited 33 and requirements cap 20 were the top BLOCKED reasons, 4-8 Nov).
7. Bob checked rulesets (process3, copy): his changes were not the cause of the record failure.

## Practice now
Builders: subtraction; locally only the tests they touch; CI runs the suite; no cold review or rehearsal; never force. Merge: read the diff, `merge <n> --plain --rounds 1 --reviewed "..."` in a tranche worktree; no local rerun of the suite. Pin moves: whenever a merge is useful to the copy, ganged; choose apply for open layers unless a change alters how a layer is judged.


# [file] account-switch-review.md

Account switch review, 5 Nov (coordinator session_018BhcecCMP7CZRbiR8kruPn). Bob asked why the switch went badly and to fix it so the next one works.

TIMELINE (UTC)
- 05:44 Bob: stop all work for the switch. Old coordinator stopped tasks and sessions, wrote handoff c.
- 05:52 new coordinator on the new account. 05:55 blocked: the account had no GitHub connection. Bob connected it at 05:59.
- 05:59-06:16 ids, ROOT, BOB, MERGER, watcher and tasks started. Every push and merge went as neobobkrause, the repos' owner and admin.
- 06:19 the first setup check (pin move) refused: `account` needs a non-admin collaborator. 06:23 every job start refused for the same reason. 0/20.
- 06:37 Bob closed everything again; the new coordinator started with civicsmith attached at 06:43.
- 06:50-06:58 roles started twice over: four start checks failed because the tranche moved under them.
- 07:07 BOB's first --ready broke its own shallow clone (parallel git); 07:10 BOB had paged 1,843 sessions to count 7.
- 07:12-07:28 the train stalled in a shallow clone, then waited 9 min for its own dead lease.
- 07:18 first job live. 07:28 train running.
- Cost: 0 jobs live 05:44-07:18 (94 min at 0/20, against 19/20 at 05:20). No train land 05:47-07:28 apart from PR 391 at 06:32.

WHY (root causes, not symptoms)
1. No preflight. The process has setup check, but nothing made it the first act of a new account. GitHub not connected, and GitHub connected as the wrong user, were each found by the first act that needed them, after roles and pushes had started.
2. Account-held state was not written down where the new account can read it. Scheduled tasks, live job sessions and role addresses live on the Claude account. The old account's task prompts were unreadable from the new one and were rebuilt from prose; 13 job sessions were stranded and each needed a hand restart; ~40 reports stayed addressed to dead sessions.
3. No order for the restart. Roles were started while the coordinator's own id and pin merges were still moving the tranche, so their start checks failed (four times).
4. Fresh-start defects that only bite on a cold start: a shallow MERGER clone (fixed, PR 148), a killed train cannot retake its own lease (9 min), BOB counts sessions by paging the whole account history (~5 min every wake), a job branch left holding the train's merged-result push needs --fresh-branch by hand (plane), BOB ran git in parallel in one clone.
5. The coordinator held three repositories, so its outward acts raised Bob's permission dialogs (handoff e). Now one repository.

FIX (being built in process3)
- build/account-switch: `p3 switch out` on the old account writes a manifest to the state branch (every scheduled task's name, schedule, prompt and role; every live job with module, branch, PR and state; role addresses; messages in flight), stops the train and releases its lease, and prints the stop acts in order. `p3 switch in` on the new account is the first act: preflight (GitHub reachable, acting user is the collaborator not the admin, push reachable on each repo, approvals hash) and refuses to go on if any fails; then prints the restart in order: coordinator ids, wait for a quiet tranche, ROOT, BOB, MERGER, watcher, the tasks recreated from the manifest bound to the new sessions, every recorded job restarted in one command release-first, then --ready, then old messages re-addressed. A runbook in rulebooks.
- build/restart-speed: session count from the start rows (no history paging), a train can retake its own session's lapsed-process lease, role start checks re-anchor to the tip as job start does, a job whose branch holds the train's merged-result push gets a fresh branch on its next start without a hand choice, and BOB's rulebook: one git user per clone, reviewers in their own clones.


# [file] draft-approvals-split-8nov.md

# Draft: CLAUDE.md approvals split (for Bob to commit), 8 Nov

Bob in session, 8 Nov: "Process3 is a develop process that is designed for use to develop any product, not just civicsmith. ... ideally the process3 CLAUDE.md shouldn't reference civicsmith or any other product being developed using process3. In that regard, any grants related to biosmoke8 should be in civicsmith-copy's CLAUDE.md." He confirmed the same day that the coordinator stays his front door.

The constraint (PLT-7, measured in PD-13): a session started with more than one repository loads no repository's .claude/settings.json (no hooks, no permission lists). So each session works in one repository, and a repository's CLAUDE.md must hold everything a session working there needs.

Commit order:
1. civicsmith-copy: replace the "## Standing approvals from Bob" block with A. It becomes copy-only, and carries the biosmoke grants (edits 1 and 2 of draft-approvals-biosmoke-8nov.md, which this supersedes).
2. process3: replace that block with B. It becomes generic, with no product names. Fill in <date>.
3. process3-probes: its own block, the same shape as A for the probes only (to be drafted when you want it).

Leave the "## Process3" lines below each block as they are; the shim maintains them.

## A. civicsmith-copy

### Standing approvals from Bob (paste as "## ")

Standing approvals from Bob, 1 Nov 2026, widened for development releases and for every step of the development process on 2 Nov 2026, made exact for Cloudflare on 2 Nov 2026, widened on 4 Nov 2026 for development releases, container images, product workflows, development signing secrets and generated design-stream files, and widened on 5 Nov 2026 for design lanes and a scheduled branch cleanup. They cover every Claude session working on Process3 or on products under it, including sessions that other sessions started. Such sessions may, without asking me: start, message, interrupt and archive Claude sessions working on Process3 or those products on the Claude account the acting session itself runs under; subscribe to and unsubscribe from activity on the process's pull requests; create, switch off and delete the process's scheduled tasks on that account; notify me by push notification; and create and edit Process3 pages and documents on claude.ai under that account.

In this repository, neobobkrause/civicsmith-copy, only, they may: push to their own working branches and to the process's state branch; create tranche branches from main; open, edit, comment on, review without approving, mark ready or draft, close and reopen pull requests; through the process's merge tool, merge pull requests into working and tranche branches once its gate and their required checks pass, without a person's review, and merge the tranche's pull request into main the same way; run builds and tests, fetching public packages and images for them; run, re-run and cancel this repository's own workflows, including container-images, including when a merge's push fires it; cut, sign and publish development releases, as GitHub pre-releases with their tags, marked development, and install and upgrade them on development deployments; change this repository's own workflow files, only through pull requests the merge tool merges after a green gate, never adding or renaming a job whose name matches a required check, never widening any workflow's or job's permissions, never adding a pull_request_target trigger, and never making the process gate anything but the process's own shim at the pinned process; and create Actions secrets in this repository whose values the session or the repository's own workflow generated, for development signing only, naming them and never reading, printing, copying, overwriting or deleting any secret they did not create.

On Docker Hub and GHCR, they may push the product's own images, only through this repository's workflows, to docker.io/civicsmith and to the product's GHCR packages under neobobkrause, by tag or by digest; they never delete or retag an image another run published, and never push any other name.

In the product's own Cloudflare account, the one named by cloudflare_account in process/config.json, and in no other (the rehearsal account named by CS_TEST_CF_ACCOUNT_ID stays governed only by its own rule), they may: read everything except secret values; create, deploy, configure, seed, reset and delete development deployments and all their data, where a development deployment is any resource in that account except those this paragraph forbids changing below (today the Workers plat-s1, agent-runner-plat-s1, agent-worker-plat-s1 and pdf-worker-plat-s1, the R2 buckets bio-captures-plat-s1, bio-published-plat-s1 and bio-walks, and the Durable Objects and container applications those Workers define), and any new Worker, R2 bucket, container application or other resource whose name begins with p3dev- or contains -p3dev-, with the Durable Objects and container applications it defines; give them workers.dev addresses and preview URLs; set their variables, scheduled triggers, limits, log settings, and secrets whose values the session or a p3dev- install it ran generated; bind them only to development deployments, themselves included, and to browser rendering; deploy to them container images the product has already published on Docker Hub, named by digest; use browser rendering from them; cause those deployments to sign development releases and development catalogue seeds with the signing secrets they hold, naming the secrets only, never reading, printing, copying, overwriting or deleting them, and never deleting a secret that neither the session nor a p3dev- install a process session ran set, or a resource that holds one, except that a development deployment named p3dev- or biosmoke followed by a number may be deleted whole, its secrets with it, once its testing is complete; run walkers and other tests against them; and incur the usage charges this work causes in that account. Any Worker named biosmoke followed by a number is a development deployment, for testing releases only, together with the Workers it binds (today agent-runner, agent-worker, file-scanner, ocr-worker, pdf-worker and sheet-worker) and the R2 buckets bio-captures and bio-published; sessions may install and upgrade a release in it, walk it, and delete it and all data captured or generated in testing once testing is complete. They send no email from that account until I name an address here. All data in that account is throwaway, but that widens nothing. Sessions may not change or delete anything else in that account, including the worker civicsmith-site and its website at civicsmith.org and www.civicsmith.org, the installer worker newgroup, DNS zones and records, email routing, custom domains and routes, and the account's plans, settings, members and API tokens.

Design lanes, run under BOB, own their lane folders, the design stream (docs/development/ux-substrate) included, and each lane runs as one session at a time. Within the product’s principles they decide design and wording there. Their design documents are claude.ai artifacts, not repository files. A pull request that changes only files in its own lane's folder lands through the merge tool without a test suite run, and the large files a lane's generators build are built at layer close, deploy and release, never committed.

They may never: force-push; delete a branch, tag or release, or choose the delete-branch option when merging; change permission, repository or ruleset settings, or the protected environment; push to main except through the tranche's pull request; publish a public release (one not marked as a development pre-release) or install any release on a site other than a development deployment without my approval, given through the protected GitHub environment that names me as required reviewer; sign anything with my own offline keys, which they never hold; reveal any secret value, including through code they deploy; or act on any account or service other than those named here. Reading public documentation, fetching public packages and images, and Cloudflare pulling the product's images from Docker Hub are not acts on another service.

One exception to the paragraph above: the process's scheduled branch cleanup workflow, running in this repository, may delete branches whose commits are all in the tranche, and the merge train's train/head/* branches whose pull request is closed; never main, the tranche or the state branch, a branch with an open pull request, or one with a commit in the last 2 hours.

## B. process3 (given to Bob in chat, 8 Nov ~17:58Z, date filled)

### Standing approvals from Bob (paste as "## ")

Standing approvals from Bob for Process3, the development process, restated on 8 Nov 2026 for process3's own repository only. They cover every Claude session working on Process3, including sessions that other sessions started. Each product developed with Process3 carries its own approvals in its own repository. A session's acts on a product's repository, accounts and services are governed only by that product's approvals, and are made only from a session started in that product's repository (one repository per session, PLT-7).

Such sessions may, without asking me: start, message, interrupt and archive Claude sessions working on Process3 or on a product developed with it, on the Claude account the acting session itself runs under; subscribe to and unsubscribe from activity on the process's pull requests; create, switch off and delete the process's scheduled tasks on that account; notify me by push notification; and create and edit Process3 pages and documents on claude.ai under that account.

In this repository, neobobkrause/process3, only, they may: push to their own working branches and to the process's state branch; create tranche branches from main; open, edit, comment on, review without approving, mark ready or draft, close and reopen pull requests; through the process's merge tool, merge pull requests into working and tranche branches once its gate and their required checks pass, without a person's review, and merge the tranche's pull request into main the same way; run builds and tests, fetching public packages and images for them; run, re-run and cancel this repository's own workflows; and change its workflow files only through pull requests the merge tool merges after a green gate, never adding or renaming a job whose name matches a required check, never widening any workflow's or job's permissions, and never adding a pull_request_target trigger.

They may never: force-push; delete a branch, tag or release, or choose the delete-branch option when merging; change permission, repository or ruleset settings, or a protected environment; push to main except through the tranche's pull request; reveal any secret value; or act on any account or service other than those named here, except under a product's own approvals from a session started in that product's repository. Reading public documentation and fetching public packages and images are not acts on another service.

One exception to the paragraph above: the process's scheduled branch cleanup workflow, running in this repository, may delete branches whose commits are all in the tranche, and the merge train's train/head/* branches whose pull request is closed; never main, the tranche or the state branch, a branch with an open pull request, or one with a commit in the last 2 hours.

## C. process3-probes

### Standing approvals from Bob (paste as "## ")

Standing approvals from Bob for process3-probes, the process's test bed, restated on 8 Nov 2026 for this repository only. They cover every Claude session working in this repository, including sessions that other sessions started. Such sessions may, without asking me: start, message, interrupt and archive Claude sessions working on Process3 or on a product developed with it, on the Claude account the acting session itself runs under; subscribe to and unsubscribe from activity on the process's pull requests; create, switch off and delete the process's scheduled tasks on that account; and notify me by push notification.

In this repository, neobobkrause/process3-probes, only, they may: push to their own working branches and to the process's state branch; create tranche branches from main; open, edit, comment on, review without approving, mark ready or draft, close and reopen pull requests; through the process's merge tool, merge pull requests into working and tranche branches once its gate and their required checks pass, without a person's review, and merge the tranche's pull request into main the same way; run builds and tests, fetching public packages and images for them; run, re-run and cancel this repository's own workflows; and change its workflow files only through pull requests the merge tool merges after a green gate, never adding or renaming a job whose name matches a required check, never widening any workflow's or job's permissions, never adding a pull_request_target trigger, and never making the process gate anything but the process's own shim at the pinned process.

They may never: force-push; delete a branch, tag or release, or choose the delete-branch option when merging; change permission, repository or ruleset settings, or a protected environment; push to main except through the tranche's pull request; cut or publish any release; reveal any secret value; or act on any account or service other than those named here. Reading public documentation and fetching public packages and images are not acts on another service.

One exception to the paragraph above: the process's scheduled branch cleanup workflow, running in this repository, may delete branches whose commits are all in the tranche, and the merge train's train/head/* branches whose pull request is closed; never main, the tranche or the state branch, a branch with an open pull request, or one with a commit in the last 2 hours.

Commit order: A (copy), then B (process3), then C (probes).


# [file] coordinator-handoff-5nov.md

Process3 coordinator handoff, 5 Nov about 00:15 UTC, from session_01RAN5enU4cvkBoxmmSGsudK (context 60%, my own rule). Bob is the owner; his words are instructions. You are the Process3 coordinator: per process, BOB is per product (Bob agreed 4 Nov). Bob defines requirements; you decide everything technical and never bring him technical choices (he said so twice on 4 Nov). Plain words, no em-dashes. Every finding with times: notes/coordinator-findings-3-4nov.md (read from "19:26 took over" down).

START, in order:
1. Record your id as `coordinator` in process/config.json on the copy's and the probe's tranche, each by a short session (as copy PR 302 and probe PR 220 did: merge with `--plain --no-review "one-field coordinator id change"`; tranche only, never main).
2. Move my scheduled tasks to yourself (get_trigger, create the same prompt bound to you, delete mine): trig_0116LDZFGVeLFCWVjJhm3qgJ (16 Nov 17:00 Phase 1 survival read), trig_01V2QK7xE5MLeFwivERHBiJ9 (18 Nov 17:00 Phase 2 survival read), trig_0125koniByTrtvqVNWnFHL5j (5 Nov 19:00 review-trigger day-1 check).
3. Adopt my open children; each reports to my id, so tell each your id: session_01RAN5eoEN9Lc8W8JViVWXEs (copy pin move to process3 89c180f: PRs 133-134), session_01RAN5enf9NfJfoPRm87D9si (build/internal-walk). Archive each when it reports.
4. Tell BOB (session_01RAN5eomXNvM23EMwtLVBHG) and ROOT (session_01RAN5emK1snYonbEbVPHbAP) your id. Archive me.
5. Check your context at every check-in; hand over at 60%.

BOB'S DECISIONS ON 4 NOV (binding, newest last):
- The copy is the candidate real product; civicsmith/civicsmith is the untouched backup. Copy work is real Civicsmith work, not throwaway. Build Plan "The copy is the candidate product".
- Readiness bar in the Build Plan under Phase 4: entry gate R1-R9, coordinator gate C1-C11 (the coordinator is a runtime role), lanes LAN-1..LAN-10 (written; nothing built until Bob has read it; he has not said he read it). No public release needed for readiness.
- Self-merge trial queued after the first dev release (notes/self-merge-trial.md).
- Exploring runs (run-rules R18 vs question-explorer): option 2, the enabling member is accountable; recorded K5821, absorbed as found marks.
- Job cap: 20 jobs per ACCOUNT, Bob can change it; one source of truth (P3_JOB_CAP, jobCap in util.mjs; process3 PR 130).
- Walk output kept whole (PRs 127-128); walkers per product AREA for R7 (admin, AI, UX, investigation, action, capture, the record...).
- Deploy and walk only at the close of each ROUND (tranche end = last round), never between layers; a deploy never holds job starts (PR 135). The per-layer deploys were the coordinator's mistake.
- Internal (local) walk before deployment, as earlier versions had: journey-check's local arm; findings join the list, not a gate (K4162). build/internal-walk running.
- Bob's time sense note: never give calendar estimates; report steps done and left, with measured times.

STATE AT HANDOFF:
- process3 tranche 70eb548 (PRs 126-135 merged tonight). Copy pin b49e337 (copy PR 335); move to 89c180f in flight (carries 133 base-comparison fix for control-plane 290 and 134 receipt fix for plane 175). Next pin move after build/internal-walk: carries 135 (round close, job start --ready closes ready layers) and internal walk; then set deploy.internal_walk and deploy.walk_reports in the copy's config (confirm journey-check's out/ paths: out/local/ and out/live/).
- Copy: layer 4 closing (BOB ran layer close 4), then layer 5 starts. Walk on p3dev-t1 was stopped on Bob's word; no deploy until the round closes. Release path jobs merged tonight: case-authoring F2, ai-accounts F4, ai-catalogue dev key, ai-runs fail-closed (323), many others. Still open: interface-shell 310 (Chromium now on the gate), journey-check 314 (+ local-arm fixture: fake account must return observability), control-plane 290 (reruns complete after pin 89c180f), op-declarations 321, plane 175 (new gate event after pin 89c180f), case-checker (restart fresh after the plain untrack PR of program.mjs; path exists since PR 131).
- Known gaps for the first dev release notes: ratification does not call docket R33; exploring runs (K5821) not yet met; AI runs do not dispatch on a deployment until agent-model's path source (R35, layer 6) exists.
- Debt inventory (22:50 entry): 185 base-red (61 now real browser reds), 19 deferred marks, 16 skips/todos, 22 over-cap files, 12 modules with requirements-pinning tests (found marks go in as the module job's first commit), ~15 large tracked files.
- Tool size tonight: +42, +76, +128, +56, +47, +91, +109/-70, +18, +96 non-test lines (each cited); the cap is NOT met; the trust-layer simplifications are the offset (notes/trust-layer-review-4nov.md on review/trust-layer-4nov).

OPEN (yours):
1. First release path: interface-shell, journey-check, control-plane, plane, op-declarations to merge; then set plan: close (partial close), round close: internal walk, deploy dev, live walk, findings into a completion round, redeploy until the walk passes, tranche close, release dev, install from scratch, upgrade test.
2. Lanes: build only after Bob says he has read LAN-1..LAN-10.
3. Per-area walkers (R7): the copy holds walk-T51-final/BRIEF.md (13 sittings), walk-coverage-T51.md (13 areas), lane-journeys/.
4. Debt paydown plan to Bob after the release (order in my 23:00 message to him).
5. Coordinator as a runtime role (C1-C6): nobody watches the coordinator's context yet.

HOW TO WORK (learned 4 Nov): read the code before deciding a session's claim (3 of tonight's "process defects" were real, 1 was not); a build's test runs the live case; a fix closes the class; every gate/merge/record change gets a confirming review; send BOB one batched message per check-in; never ask Bob technical questions.

COORDINATOR RULES ON SPEED (Bob, 5 Nov 01:15; carry into every handoff):
- Speed is the objective. Cost, risk and tidiness are constraints only where Bob has named them. Never trade throughput for them by default. Subscription usage is Bob's to watch, never a reason to hold work (Bob, 5 Nov 01:50); he says when to move to another account.
- Never limit work below the job cap by an instruction. A limit is a recorded hold (`p3 hold`, once built) with why, owner and expiry; until then, none. Bob alone sets a long or large hold.
- A handoff lists every limit in force, who set it, why, and when it ends. An unexplained limit is lifted, not inherited.
- Answer "is it moving with urgency?" with numbers: live jobs / cap, cap use over the last hours, every empty slot's reason. Activity is not an answer.
- Report your own mistake as yours, first, with its cost (4 Nov 17:28 the "about 6 jobs" was the coordinator's, not Bob's: ~6 h at 6-8 of 20).
- A stop or hold message to a running session is sent with priority "now"; the default waits for its turn to end (PR 139 merged 13 min after a hold message, 5 Nov).
- Never present a coordinator design choice as Bob's rule; say whose it is (5 Nov: the "hold needs Bob's commit" rule was mine).
- A change to the merge path, gate or record gets a compared-options design study before any build brief (5 Nov: merge train).


# [file] coordinator-handoff-7nov-c-switch.md

# Coordinator handoff for the NEW account, 7 Nov 2026 ~05:35Z (session_018Bhcefb8RbwzBi1TvvFVgT, old account)

Bob's words (7 Nov): "Please start the process of shutting down development in this account so that the development process can be restarted in a different account."
Runbook: rulebooks/account-switch.md on process3's tranche. Section 1 (switch out) is DONE on the old account. Sections 2 (Bob) and 3 (switch in) follow.

## Done on the old account (switch out)
- Manifests: copy process-state switch/manifest.json at 72a5c7ba2d (6 tasks, 3 live jobs, 211 unanswered messages, layer 10 open); probes at 2dd466c962 (no live jobs, no addresses).
- Stop acts sent, in order:
  - jobs ai-catalogue, op-capabilities and inquiry;
  - tasks switched off, never deleted: Phase 1/2 survival reads, coordinator hourly, ROOT sweep, watcher. Bob's alpha-pipeline-runner is not the process and was left as it is;
  - lanes investigation, publication and ux;
  - BOB, ROOT and the watcher.
- Copy pin move to f6a9846: my STOP arrived after its push. Copy PR 761 (p3/pin-f6a9846db1, e4bbb2fe62) is OPEN and unmerged; no wake was sent. The new account reuses it or closes it in favour of a pin carrying C19/C20/R17g. The copy is still pinned at 19fe9dd.
- Lanes: ux pushed (lane/ux cb138ca4b7, draft PR 762, open-work list in docs/development/ux-substrate-research/open-work-2026-11-07.md). Investigation's handoff 17908ea60 (open-asks A1–A10) was held by the old 120 ceiling; I told it to push with the tranche config. Check lane/investigation for it. If it's missing, the asks are in the artifacts THTtouNJzkhmHqyR4Pfa4g and UgRF58WWCfuDu88ztaKNbL. Publication pushed (lane/publication b82aa884, PR 764 lane-only: open-asks.md). BOB reported switch-out complete at 05:38Z. Job op-capabilities pushed at 3a67501a07. The probes are at f6a9846 (PR 239).
- Builders ef7TXuV (C19/C20, append-only-state) and ef1pxNY (R17g, C18) were told to push and write notes/builder-handoff-ef7.md / -ef1.md on their branches. Heads are below once they report.
- Builder ef7TXuV (handoff notes/builder-handoff-ef7.md on build/settings-credit 1ef83293):
  - append-only-state is PR 232 (2ad2a86b, 1117/1117, cold-reviewed): merge it.
  - R17g is on build/limits-only-github e55bcd4c. ef7 started it before the reassignment; the full suite and the cold audit were unfinished and there is no PR. The brake table is in the handoff. Reconcile it with ef1pxNY's R17g branch, if that builder pushed one.
  - C19 and C20 are not started; next steps are in the note.
- Investigation lane: pushed. lane/investigation is at 17908ea60a, with draft PR 763. Its open asks A1–A10 are safe.

## State at shutdown
- process3 tranche: 372438c (C17 PR 230, C16 PR 229, PD-5/PD-6 PR 231 merged).
- Copy: layer 10 complete (4/4 landed). Layer PR 759 blocked by the record-check settings finding: C19 credits a settings change that a merge carries from an owner's commit already on tranche. PR 752 op-capabilities is parked for layer 11. Config PR 760 merged (pushes_per_hour 1000000, coordinator = the old coordinator's id, to be reset).
- Bob's holds and decisions:
  - No layer 11 open until Bob says (account switch).
  - Q9 recorded as BD-14 (copy PR 758). Q9.1 fallback "rules-out marks only"; UX check "Q9.1 only".
  - Walkthrough https://claude.ai/artifact/WCzdua7ccBB95KbtwGvatt is waiting on Bob's B-vs-fallback call.
  - IV-9 contrary-recall bar is owed by Bob (the lane recommends 0.8 / gap ≤0.1).
- PD-6 (Bob: "baseless overcaution NEVER"): only GitHub's published limits (at 85%) or GitHub's actual refusals brake. Pushes are counted, never refused. R17g implements it (builder ef1pxNY). Until it is pinned, configs set pushes_per_hour 1000000. Process3 clones still default to 120: merge R17g first.

## New account: first acts, in order
1. Bob's section 2: connect GitHub as the collaborator, install the GitHub App on the three repos, recreate environment BioDefault with its Cloudflare secret, share the claude.ai documents, approvals if their wording needs it.
2. `switch in --sessions <file> --by <new id>` on the copy and the probes (section 3). Then its acts (a)–(h), EXCEPT that layer 11 stays shut until Bob lifts his hold.
3. Builders: restart from their handoff notes. Priority: C19 (unblocks layer merge 10), C20, R17g, then append-only-state, then C18.
4. One pin move (copy + probes) carrying C17, C19, C20 and R17g. Then BOB re-runs the PR 759 gate and `layer merge 10`.
5. Recreate the coordinator's tasks: hourly (:51, with the PD-3 line replaced by PD-6), Phase 1 survival read (16 Nov 17:00Z), Phase 2 (18 Nov 17:00Z).
6. Bob archives the old account's sessions and deletes its switched-off tasks once the new ones run.

## R17g cold audit (build/limits-only-github e55bcd4c), relayed by ef7TXuV at 05:36Z
Full suite 1114/1114 at e55bcd4c (finished after shutdown). Core is correct: pace.test 20/20; 524 pushes an hour pass with no wait; budgetGate admits at any push count; published limits and GitHub's pause and stop still brake. Fix before merging:
1. Med: limitSignal misses a bare `gh: HTTP 429` (no message or URL). Treat any 429 from gh as GitHub's unless it names a proxy, and add a test.
2. Med, pre-existing: git push `RPC failed; HTTP 429` matches SERVER_ERROR (util.mjs ~610), so pushRetry and ghshare's ledger write retry at 1/2/4/8 s inside GitHub's refusal. Route push stderr through limitSignal to a pause, and take 429/403 out of SERVER_ERROR.
3. Low: an old config's poll_most_s 300 brings the 5-min back-off back; retire it. merge.mjs transientPause's TRANSIENT pattern matches proxy 429s and "rate limit".
4. Low: reword POLL_FLOOR_S and `--every >= 30` (p3.mjs ~146) as poll cadence, not GitHub pacing.
5. Low: stale text (merge.mjs:70, layerflow.mjs ~962, p3.mjs:144/530, pace.mjs:86/344, notes/github-pacing.md:44,48). Dead code: lane.mjs laneCap (~393-399), util.mjs lower/from (~470).
6. Info: `gh api graphql -F query=@file` holding a mutation is counted as a read. Notes are not spaced (GitHub's 1-s write guidance).

## Builder ef1pxNY at shutdown (05:45Z)
- Handoff notes/builder-handoff-ef1.md on build/github-no-overcaution 796b2b60 (brief only). R17g itself is ef7's build/limits-only-github e55bcd4c, above: use that one.
- C18 is on build/read-no-push 08105d31. DO NOT MERGE AS IS: the cold review found 6 bugs (double push after replay or concurrency, a lost waiting record on an unlocked rewrite, an unlocked state-ref move, idle-check alarms from every session, usage shares no longer reaching other clones). Fixes are in notes/builder-handoff-ef1.md on build/github-no-overcaution d16ea49c. The caching half is sound. `status --role bob` warm: 21 requests (from 357), 144 s (from 399).
- C16 is merged (PR 229). C15's build/sweep-permission 0be0b850 is an old branch (C15 merged as PR 219); drop it unless its handoff says otherwise.
- New PRs carrying the claude.ai documents into git: process3 233 (governing/: Foundations and Ledger map), copy 765 (Q9 paper and BD-14 requirements), copy 766 (Q9.1 walkthrough HTML). Merge any still open.


# [file] draft-approvals-biosmoke-8nov.md

# Draft: CLAUDE.md approvals amendment for biosmoke (for Bob to commit), 8 Nov
