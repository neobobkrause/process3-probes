# [file] point4_release.md (continued)

| :125 | "A clean release walk of the non-AI journeys alone never makes BD-R3's installer-update or site-update builds due." | Session's sentence |
| :59-62 | "PD-10: A known, owed walk finding does not block a development release (coordinator, 8 Nov)" ... "This covers development pre-releases only; a public release stays Bob's, through the protected environment." | Coordinator's decision, not his |

Also a session's record of him, in the fifth draft's section B ("These reached this document through a session's written record", `process4_definition_v5.md:77`):
- :86 (13 Nov, line 6): "No other test is necessary, ever. The internal walk replaces the full regression. A round that completes with no failures ends the tranche. An optional multi-session deploy-and-external-walk runs after that." (Corrected by his typed words of 14 Nov.)
- :98 (13 Nov, line 18): "you approve a public release. Updating the public release means updating the installer and the page of the website that refers to the current release and installer."

And in Process3's own files (sessions' records of him; V by `git show origin/tranche:README.md` in the process repository): README :147 "Everything this releases is for development only (Bob's word, 3 Nov): no public release, no production environment, no promotion to installed sites."; README :81 "A release belongs to a round close, never between layers (Bob, 5 Nov ...)".

### 2c. His standing approvals

**`/home/user/process3/CLAUDE.md:3`** (the process repository, branch `process4`; committed by Bob Krause through GitHub's website, last on 2 Nov 2026: `git log -- CLAUDE.md`, V). This is his word under the worker rules:

- "Standing approvals from Bob, 1 Nov 2026, widened for development releases and for every step of the development process on 2 Nov 2026."
- Sessions may "merge the tranche's pull request into main once its required checks pass; run builds and tests; run the repository's own workflows; cut development releases, with their tags and pre-releases in the product's repository; and deploy and use development releases in every way development needs, in the product's own Cloudflare account, the one its process config names: deploy, configure, seed, reset and remove development deployments and their data, and run walkers and other tests against them. Development deployments hold no secrets and keep no permanent record."
- "They may never: force-push, delete a branch, change permission or repository settings, push to main except through the tranche's pull request, publish a public release or promote a release to installed sites without my approval, or act on any other account or service."

**The product repository's approvals differ by branch (V).**

- `main` (`CLAUDE.md:3` in the clone; his commit `0dea5a6e`, 1 Nov): the first, short approvals. It does not mention releases, deployment or Cloudflare at all.
- `tranche` (`git show e7ec72e:CLAUDE.md`; the block was last committed by Bob Krause through GitHub's website on 9 Nov, commit `50515e452`; `git log e7ec72e -- CLAUDE.md` shows ten website commits of his from 1 to 9 Nov and five commits by sessions in between, which by their titles change the Process3 lines below the block; titles read, not diffs). It is text he committed; the audits say sessions drafted most of its edits (A, `audit2_notes.md:72`). Release passages:
  - :5 sessions may "cut, sign and publish development releases, as GitHub pre-releases with their tags, marked development, and install and upgrade them on development deployments".
  - :9 "Any Worker named biosmoke followed by a number is a development deployment, for testing releases only, together with the Workers it binds ... sessions may install and upgrade a release in it, walk it, and delete it and all data captured or generated in testing once testing is complete."
  - :9 "Sessions may not change or delete anything else in that account, including the worker civicsmith-site and its website at civicsmith.org and www.civicsmith.org, the installer worker newgroup, DNS zones and records ..."
  - :13 "They may never: ... publish a public release (one not marked as a development pre-release) or install any release on a site other than a development deployment without my approval, given through the protected GitHub environment that names me as required reviewer; sign anything with my own offline keys, which they never hold".

So text he committed on 9 Nov already lets sessions install a release on a test site, upgrade it there and walk it, and already forbids them to touch the real installer and the real website. The requirements audit's quotation at `audit2_requirements.md:143` is from this tranche text, not from the process repository's file.

### 2d. His Ledger lines and Foundations lines on release, and where each stands

**What these documents are.** `ledger_lines.md` is an extraction of his Keep and Drop Ledger: the statements, suggestions and reasons were drafted by a session; the decisions (kept, modified, dropped) are his; a note is his only where marked "(owner's own words)" (`ledger_lines.md:1-5`). `foundations.md` is the Process3 Foundations, a document written up by sessions from his Ledger decisions (the later version in the process repository was committed by "Claude": `git log origin/tranche -- governing/foundations.md`, V). Neither is typed words. Status below is from `process4/definition/process4_definition_appendix_v5.md` (A: I read the rows, I did not re-audit them). Where a quoted Foundations passage is a table row, its column breaks are shown as " / ".

| Line | Text (file:line) | His decision | Stands in the fifth draft (appendix row) |
| --- | --- | --- | --- |
| ARC-4 | Note, "(owner's own words)": "The architecture, ownership, format and coverage checks run only against the job's module in its gate, layer checks when a layer closes, and over the whole product before a release or when I ask for one." (`ledger_lines.md:377`) | modified, 31 Oct | Ended (:147). "His own option 'when I ask for one' is ended under 'your decisions' by inference from line 6; no word of his ends it by name" |
| GAT-7 | "The full product regression runs only at a release or on your word, as its own workflow with its own time budget." (`ledger_lines.md:781`) | kept, 31 Oct | Ended, record of 13-14 Nov line 6 (:236) |
| P11 | "Tests follow the architecture: each module has its own tests, each layer may have small layer tests run at its completion, and the full regression runs only at release or on Bob's word." (`ledger_lines.md:1520`) | kept, 3 Nov | Ended, record line 6 (:337) |
| P22 | "Release: a release is cut from the open tranche, proven by the full regression, deployed and walked; what a walk finds becomes a round's entries, never edits to a running one; what a walk produces is kept only until it is analysed." (`ledger_lines.md:1592`) | kept, 3 Nov | Kept; way changed (:345). "'A release is cut from the open tranche' is listed under (g)", that is, in conflict with his typed words |
| GAP-7 | "A public release or promotion to installed sites waits for Bob's approval through the protected GitHub environment; development releases are drafts and need none." Source given: "Your word, 2 Nov (question 21); your approvals." (`ledger_lines.md:1659-1660`) | kept, 3 Nov | Kept as written (:353). "The protected GitHub environment and promotion to installed sites are not named" |
| F-HUM-6 | "by default a job, layer or tranche merges on a green gate without you, while a public release waits for your approval (GAP-7)" (`foundations.md:36`) | Foundations | Ended in part: "layer" (:174) |
| F-SET-8c | "deploying, releasing and acting on a live site are BOB's acts, not a job's (decision 14)" (`foundations.md:213`; BOB is the architecture session) | Foundations | Kept as written (:370). "which session deploys is not said" |
| F-STOP-1 | "The process owns everything that can be proven in git and CI, and nothing that happens on a live site. Civicsmith is a release, an installer and a site update, and those have three owners." (`foundations.md:238`); table: "Installer and updater as code / The process / Modules of the product ..." (:242); "Rollout and operations / The product's own procedures and tools / Promoting an update to installed sites, staged rollout, monitoring, rollback and support ... those acts are yours" (:244) | Foundations | Kept; stated nowhere in the main text (:379) |
| F-STOP-2 | "Release packaging / The process, as the Release workflow / Building the installer artifact and update manifest, signing them and publishing them as draft releases" (`foundations.md:243`); "A development release stops as a draft, deployed only as a development deployment in the product's own account, and the Release workflow runs an install-from-scratch test and an upgrade-from-previous-release test as release-tier fixtures before it does." (`foundations.md:246`) | Foundations | Ended in part (:380): "Install and upgrade tests before a release end. Packaging is not described; the release path is unproven". Decider given: his typed answer to proposal 13 |
| F-REL-1 | "A development release is cut and deployed by the process in each round, without you, to the product's own site so walkers can find flaws, and it reaches no one else; it carries your standing approval in CLAUDE.md" (`foundations.md:248`) | Foundations | Kept; way changed (:382): "That a development release is cut is no longer said anywhere; his fifth message speaks of 'a clean development release walk'. Listed under (g)" |
| F-REL-2 | "A public release is a development release the walkers have passed, published only with your approval (your word, 2 Nov; GAP-7): the process prepares it and shows you what it carries, and a GitHub production environment with you as required reviewer holds the publishing job and the production keys, never the sessions' cloud environment." (`foundations.md:248`) | Foundations | Kept as written (:383): "The clause on the production environment and the keys is no longer quoted. His answer 'a tranche can end without an AI enabled run' sits beside 'walkers have passed': listed under (g)" |
| (unnumbered) | "They cover development releases in the product's own account (your word, 2 Nov); a public release stays yours." (`foundations.md:183`) | Foundations | Not traced to a row by me |

The Foundations as last committed in Process3 (`git show origin/tranche:governing/foundations.md`, lines 251-261, V) had been rewritten by a session on 8-9 Nov to carry the BD-R1 order ("tranche close refuses until a clean internal walk, then a clean release walk, are recorded, then names the installer update and the site update, in that order"). The copy in `process4/evidence/foundations.md` is the earlier text.

## 3. The two readings, side by side

Common to both: a tranche ends "only ... when an external walk (of a development deployment) completes without flaws" (his words); the tranche "can end without an AI enabled run" (his words); "installer and website are outside the tranche" (his words). In the fifth draft, ARCH then merges the tranche branch into the main branch, and "None of the three tests runs on that pull request" (`process4_definition_v5.md:191`, Claude's sentence).

**Reading A (the fifth draft's).** "a clean development release walk" = the external walk of the development deployment that ended the tranche.
Where the draft takes it: `process4_definition_v5.md:420` ("Claude reads 'development release walk' as the external walk of the development deployment, the one that ends the tranche. Say if you meant a further walk."); :193 ("A development deployment does not use the installer, so no walk shows that the installer can place a release into an empty account. The release path is unproven."); :418 ("When the journeys that use AI are walked is not said; Claude will bring it to you when the release is built."); :325 (install and upgrade tests before a release ended); :331.
What speaks for it in his typed words (J): "A release can (optionally) be started after a tranche completes. **So** a release is always fully tested and walked successfully." The "So" makes the tranche's tests and walks the reason a release counts as walked. And "three tests and no others".

**Reading B.** "a clean development release walk" = a walk of a development release, which is a thing cut after the tranche (a numbered package with a tag and a pre-release, in his approvals), put on a development deployment, and walked before the installer and the site are updated.
What speaks for it (J): "development release" is his own term for something cut and then deployed (`CLAUDE.md:3`); his Foundations: "A public release is a development release the walkers have passed"; his answer was given to a reading headed "A walk of the release itself" that had just quoted the 9 Nov sentence, and it repeats that sentence's shape ("the installer update and site update wait until a release walk with AI on is also clean" / "installer and site updates wait for a clean development release walk"); the drift audit: his four statements "hold together only if a further walk ... comes between the tranche's end and the installer update" (A, `audit2_corruption.md:216`).

I do not choose. Both are readings of his words; only he can say which he meant.

**From the end of a tranche to a real team using the product**

| Step | Reading A | Reading B |
| --- | --- | --- |
| 1 | Tranche ends on a clean external walk of a development deployment (AI may be off) | The same |
| 2 | ARCH merges the tranche into the main branch | The same |
| 3 | A release may be started: "the process prepares it" (`v5:193`); no session named | A development release is cut (tag, pre-release) |
| 4 | (nothing walked) | The development release is put on a development deployment and walked by the journeys. Whether it is put there by the installer, whether over a previous release, and whether with AI on, are not said by him on 14 Nov |
| 5 | He approves a public release | If that walk is clean, he approves. If it is not: nothing says where its flaws go, since the tranche has ended (J) |
| 6 | The installer is updated, then the website page (the order of 8 Nov, a session's record) | The same |
| 7 | A real team installs from the website through the installer; an existing team takes the release through the installer's update option | The same |

**What is walked and what is not**

| Thing | Reading A | Reading B |
| --- | --- | --- |
| The product on a development deployment, fresh, deployed by a program straight from the branch | Walked by the journeys; must be clean to end the tranche | The same, and then a second deployment is walked |
| The installer placing a release into a Cloudflare account | Not walked on any deployment. (The internal walk drives the installer's and the website's pages against local stand-ins: the walker's local arm calls `walkSite` and `walkInstaller`, `bio-plane/src/journey-check/run.mjs:137-155` on the tranche tip, V by reading, not run.) | Walked only if the development release is installed through the installer. Never built; Process3's tool: "the installer installs only by an interactive sign-in" (`tool/lib/rounds.mjs:38` on `origin/tranche`, V) |
| An upgrade of an existing installed site with its stored data | Not walked. Both walks start from a fresh copy (`v5:409`). Seen only by one module's own test, which runs on that module's job | Walked only if the development release is put over the previous release on a test site that holds data. His committed approvals allow "install and upgrade"; nothing is built |
| The website | Not walked live. The real page is changed only after his approval | The same. The real page still changes only after the walk. Journey 28 begins at civicsmith.org, so it cannot be completed on the real site before the update under either reading (A, `process4_audit2.md:114`; the journey's first step is on the screen `site`, V) |
| The assistant with a real AI model | Not required. May never be walked before a release. The draft lists "Connect an AI account to the deployment" with "Before an external walk of the journeys that use AI" as his act (`v5:123`) but nothing says such a walk must happen | Walked if his 9 Nov sentence still stands ("with AI on"); otherwise not required either |

**A third possibility the requirements audit raises (A, `audit2_requirements.md:142, 147`).** His Foundations say a development release "is cut and deployed by the process in each round". If the thing deployed in the tranche's round were a cut development release, "the tranche's external walk" and "a development release walk" would be one walk, and reading A would hold in his own term. The draft instead says a development deployment "does not use the installer" (`v5:193`), which is Claude's description of Process3's deploy program (V: the product's `process/config.json` deploy block runs `scripts/deploy.mjs ... --test-instance --first-install` directly), not his word. Even so, such a deployment would be fresh, and an upgrade and the real installer would still be unwalked unless made part of it (J).

**Beside either reading.** The fifth draft's meaning of "without flaws", to which he answered "agreed", includes that a walk "leaves out no step that the walk before it made" (`v5:187`). After one walk with AI on, a later walk with AI off leaves steps out (A, `audit2_feasibility.md:290`).

## 4. What exists and what does not

### 4.1 In the product's repository (all V unless marked)

**On `main` (the checkout; tip is his approvals commit of 1 Nov, so no tranche has been merged into it since):**
- `.github/workflows/`: `container-images.yml`, `deploy-test.yml`, `regression.yml`, `release-sign.yml`. No development-release workflow, no installer-update workflow, no site-update workflow.
- `release/`: a signed release, `RELEASE.json` version "0.87.0", with notes for 0.85.0 to 0.87.0.
- `newgroup/` (the installer) and `site/` (the website) are source folders of the product.

**On `tranche` (Process3's working branch, tip 9 Nov):**
- `.github/workflows/` adds `process-dev-release.yml`, `process-gate.yml`, `process-record.yml`, `process-branch-prune.yml`. Still no installer-update or site-update workflow, and `process/config.json` has no `installer_update` or `site_update` entry (the whole file read).
- `process-dev-release.yml` is the step that cuts a development release: started by hand on the tranche with a version and a commit; three jobs (checks, assemble, publish); publish runs in an environment named `p3dev-release`, pushes a tag `p3dev-<version>`, and creates "a draft release, never published and never marked latest" with one archive and its checksums (file header, lines 1-19; lines 230-237). Lines 1-2: "Development only: there is no public release (Bob's word, 3 Nov)."
- `release-sign.yml` (also on `main`): signs a release on a branch named `dist/cut-<version>`, in the environment `release`, "whose required reviewer is Bob, so each run waits for his approval, one approval per release" (lines 3-9). It is the older, pre-Process3 release route.
- `process/config.json` has a `release` block: two checks ("setup-words fresh", "fleet bundles"), an assemble command that writes `build/dev-release`, no signing secret named. Its `deploy` block deploys the built product directly by `scripts/deploy.mjs {slug} ... --test-instance --first-install`, to names beginning `p3dev-`; the walk command takes an `{assistant}` switch.
- The installer: `newgroup/DEPLOY.md` (tranche tip). It is a Cloudflare Worker named `newgroup`, "the wizard". It is deployed by hand: "Open the Worker, Edit code ... paste the entire contents of `newgroup.bundled.mjs`. Deploy." (:21-24). "The wizard carries the release inside itself, and that release is always a signed one" (:71-72). "Then paste and deploy as in step 2, and existing groups pick the release up through the wizard's update option." (:80-81). A real install needs a person signed in to Cloudflare to "Approve the permission screen" (:41-50). So the upgrade of an installed site is done by the installer too.
- The website: `site/wrangler.jsonc`, Worker `civicsmith-site`; its setting `INSTALLER_ADDRESS` is "https://newgroup.believeinoakland.workers.dev"; "Each deploy is Bob's approval in session".
- The installer and the website are modules of the product, built by jobs like any other: `build/modules.json` has `installer-steps`, `installer`, `installer-check`, `installer-places`, `installer-copies` and `site`, numbers 210 to 215 of 220. So "installer and website are outside the tranche" cannot mean their code (J); what the record of 8 Nov places at the end is *updating* the deployed installer to carry the new release and *updating* the website page to refer to it.
- Workflow files and `release/` belong to no module in `build/modules.json` (searched every module's paths for `.github` and `release`; none). The run audit's reasoning that no job may write the two missing workflows (`audit2_feasibility.md:219`) rests on this.
- The upgrade test exists: `bio-plane/test/system/migrate-released.test.mjs`, owned by the module `plane`. Its own header: "Every release from 0.59.0 to 0.63.0 BRICKED an existing store ... The battery never saw it because every suite builds a FRESH store ... DIST found it live on biosmoke7, at 0.62.0." This confirms the audits' "five earlier releases" from the test's own text; I did not re-measure the five releases.
- The journeys script, `docs/development/ux-substrate/screens/mock-journeys.js`: 32 numbered journeys (counted by script). Journey 28 ("From civicsmith.org to a new member's first work") has 2 steps on the screen `site` and 7 on `install`; journey 29 ("From installing to a first conclusion") begins on `install`; journey 1 uses the wizard "Set up and claim", whose `start` in `library.json` is `install`. Steps marked for the assistant only: journeys 6, 10, 17, 22, 29, 32; journey 4 is "Connecting your own Claude account". That is seven by my count; the drift audit counts "about nine" by a wider rule (A, `audit2_corruption.md:217`).

**Tags, cut branches, and the record:**
- `git ls-remote --tags origin`: 79 tags, every one of the form `v0.N.N`, the newest `v0.71.0` (an annotated tag of 21 Sep 2026). No tag beginning `p3dev-`. So no development release was ever tagged.
- `git ls-remote --heads origin 'refs/heads/dist/*'`: 24 branches `dist/cut-0.64.0` to `dist/cut-0.87.0`. The tip of `dist/cut-0.87.0` is dated 27 Oct 2026, by a session, before Process3 began. So releases 0.72.0 to 0.87.0 were cut on branches without tags, before Process3.
- `release/notes/0.87.0.json`, the newest release's own notes to members: "Not working yet: the assistant is not part of this release. ... This is still a test release, and this version was not walked through screen by screen before it was released."
- `git diff --stat main tranche -- release/`: no difference. Process3 changed nothing in `release/`. (`newgroup/` and `site/` did change: 31 files.)
- State branch (`process-state`): `deploys/dev.jsonl` has 14 rows: 12 deployment runs (4 to 8 Nov) and 2 start markers. Every run has `ok: false`. The two that reached a walk: 8 Nov 07:20 UTC, 59.5 minutes, internal 238 steps and 63 failures, deployed walk 175 steps; 8 Nov 23:50 UTC, 63.6 minutes, internal 357 steps and 96 failures, deployed walk 157 steps. None records AI on. There is no `releases/` folder, no `deploys/release.jsonl` and no `tranches/` folder: no development release, no release walk and no tranche close was ever recorded.

**What a "development release" is today (J, from the above):** on paper, three things that do not quite agree. In his process-repository approvals: something sessions "cut ... with their tags and pre-releases" and then "deploy and use". In the Process3 workflow: a tag `p3dev-<version>` plus a draft GitHub release holding one archive, "never published". In his Foundations: "cut and deployed by the process in each round". In fact: none exists.

### 4.2 In Process3's tool and record (V, `git show origin/tranche:...` in the process repository)

- `release dev` (README :81): "BOB, once a round's internal walk is clean (BD-R1) | development only ... " It prints the acts to start `process-dev-release.yml` and later records a row in `releases/dev.jsonl`. Built; never recorded a row for the product.
- `deploy release <version>`: named everywhere as the next act, but it is a stub. `tool/lib/deploy.mjs:561-573`: "No path does that install yet: not process-dev-release (it cuts and publishes the draft only), not a release-tier install-from-scratch or upgrade fixture (none in the product's workflows), not the installer module (an interactive sign-in, its Worker pasted by hand). The act is named, with the gap, and nothing is deployed or recorded: no deploy step is invented. Exit 1." `tool/lib/rounds.mjs:38` gives the gap's text: "no path yet installs the cut, signed release artifact onto a p3dev- deployment through the release's own installer path (process-dev-release cuts the draft release only; the product has no release-tier install-from-scratch or upgrade fixture; the installer installs only by an interactive sign-in)".
- `tranche close` (README :80; `tool/lib/tranche.mjs:215-219, 236-262, 290-295`): refused, in order, without a clean internal walk, a development release, a clean walk of that release, and a clean walk of it with AI on; then it names "the installer update" and "the product website's update", each "on Bob's approval", and for each prints "GAP, no workflow runs it yet". "No session touches the installer worker or the site itself." (:240-241).
- The AI switch exists in Process3's configuration: README :171, "`ai` | `false` (default) or `true` once Bob has an AI account configured for the live walk (BD-R5, Bob, 9 Nov) ... A release walk clean with AI off is clean for the non-AI journeys only".
- All of this belongs to Process3's tool. The fifth draft replaces that tool with "a new small tool that does only this: push; open a pull request and mark it ready; merge; start the next job; send notifications; and write the shared state" (`v5:361`), and lists "the release path" under "Nothing is built for" (`v5:364`).

### 4.3 "Never built", sorted (J on the sorting; each item V or A as marked)

| Thing | State |
| --- | --- |
| Cutting a development release (package, tag, draft) | Built in Process3 as a workflow and a tool command (V). Never run on the product (V). Tied to Process3's tool |
| Signing a release with his approval | An older workflow exists and waits for him (V by reading the file; the GitHub setting itself not verified) |
| Installing a cut release on a test site the way a team would | Never built. Process3's tool says so itself (V) |
| Walking a cut release | Never happened (V: no record) |
| An install-from-scratch test and an upgrade-from-previous-release test inside the release workflow (his Foundations) | Never built (A, `v5:329`; consistent with the tool's gap text, V). Ended in the fifth draft |
| The upgrade test as a module's own test | Exists (V) |
| The step that updates the installer for a release | Never built (V: no workflow, no config entry). Today it is a hand paste in Cloudflare's dashboard |
| The step that updates the website page | Never built (V). Today the site is deployed "by Bob's approval in session" |
| Merging the tranche into the main branch on this product | Never done (V: main's tip is 1 Nov) |
| Any walk with AI on | Not in the deployment record (V); the stored walks carry 14 notes "not walked, the assistant does not work" (A) |

"Two things it needs were never built" in the combined audit (`process4_audit2.md:38`) means the run audit's two missing update workflows. The draft's "neither release test was ever built" (`v5:329`) means the two tests in the Foundations. They are four different things, and the install of a cut release on a test site is a fifth.

### 4.4 Who the fifth draft names to prepare a release

Nobody, in the body (V): "The process prepares it and waits for your approval" (`v5:193`). ARCH's duties (`v5:135`) list deploying ("has the product deployed to the development site") and say only that it "never ... publishes a release without you". A job "never merges, starts a session, deploys or changes the process" (`v5:137`). His act: "Approve a public release | Once per public release" (`v5:122`).

One thing the audits do not say: his Foundations do name a session. "deploying, releasing and acting on a live site are BOB's acts, not a job's" (`foundations.md:213`; BOB was Process3's architecture session), and the fifth draft's appendix counts that line "Kept as written" (`process4_definition_appendix_v5.md:370`). So a kept line of his names the architecture session, and the draft's body does not repeat it.

## 5. What is Bob's to decide, and what is technical

No recommendation is given: the audits do not choose, and I was told not to design. Costs are what the record supports; nothing here is an assurance.

### 5.1 Bob's

**1. What "a clean development release walk" means.**
- (a) The walk that ended the tranche. Cost to him: none beyond approving the release. Risk to a real team: they may be the first to run the real installer with this release, the first to upgrade a site that holds data, and the first to use the assistant.
- (b) A further walk, of a development release cut after the tranche. Cost to him: one more deployment and walk for each release; Process3's two deploy-and-walk runs took 59.5 and 63.6 minutes and both failed (V), and those walked screens, not journeys (A); the answer to question 2 below; possibly acts of his in Cloudflare if a test installer is needed (unproven; see 5.2). Risk to a real team: lower only for whatever that walk is actually made to cover; none of it is built or proven. One more thing he should see with (b): on 13-14 Nov Claude withdrew its own addition of "a walk on a copy installed with the real installer" as "a new test" (`process4_counterarguments.md:241-249`). Reading (b) is close to it. The difference is that "development release walk" is now his own typed phrase. Whether a further walk is an external walk of another deployment (the drift audit's judgement, A) or a fourth test is his to say, under his "three tests and no others".
- (c) The possibility in section 3: the thing deployed and walked in the tranche is itself a cut development release, so there is one walk. Cost: a release is cut in every clean round. Risk: as (a) for the installer and an upgrade unless the deployment is made through them.

**2. Does the 9 Nov sentence still stand: must a walk "with AI on" be clean before the installer and website are updated?**
- Yes. Cost to him: he connects an AI account to the deployment (his act, `v5:123`), the usage is charged to it, and the assistant's flaws must be fixed before any release; about seven to nine journeys have assistant steps. Risk to a real team: the assistant has been walked.
- No. Cost: none. Risk: a team with its own AI account is the first to use the assistant on that release. The last release before Process3 told members in its notes that the assistant was not part of it (V); whether a release must say so is his.
- Either answer needs a second one from him: the meaning of "without flaws" he agreed to counts a step left out as a flaw, so walks with AI on and off cannot both be clean in turn as worded (A).


At Corrie the clerk wrote down 10 garnets.

**3. The upgrade of an existing installed site.**
- Left to the one module test that exists. Cost: none. Risk: it runs only when that module has a job; five releases broke stored data in the past (the test's own header, V). The decision record of 8 Nov has a session's sentence that "No installed site holds an older store" (`DECISIONS.md:114`); I did not verify whether any real team has an installed site today.
- Made part of what is walked before a release (the walked test site is upgraded from the previous release, not fresh). Cost: only possible under reading (b) or (c), and unbuilt. Risk: lower for the data the test site holds, and only that.

**4. Under reading (b): where do flaws go when the further walk finds some?** His words send an external walk's flaws "to the next round, not the next tranche", but the tranche has ended and been merged. Options (J): the release is not started and the flaws become work in the next tranche; or the tranche is not counted as ended until that walk is clean, which is his order of 8 Nov and against his words of 14 Nov. His.

**5. The journeys that begin at the installer or the website (1, 28, 29).** His words: the external walk confirms "that all journeys can be completed", and "installer and website are outside the tranche". Options: those journeys do not count toward ending a tranche and belong to the release; or they count from the step after the installer. If the first, and reading (a), they are never walked on a deployment at all.

**6. A tranche he ends by his word although it is not clean (the combined audit's question 2).** May a release start from it? If yes, "a release is always fully tested and walked successfully" does not hold for that release. His.

**7. His own acts on the release path, to confirm.** In the record and his approvals: approving each public release (through a protected GitHub setting that names him); adding a deploy token to that setting (a session's sentence of 8 Nov, `DECISIONS.md:109`); connecting an AI account. The fifth draft lists the first and third (`v5:122-123`), not the second. Which approvals text governs is also open: the product's main branch carries his short text of 1 Nov with no word on releases, its tranche branch his long text of 9 Nov, and the process repository his text of 2 Nov (V).

### 5.2 Technical: for Claude to decide and report

- Name the session that prepares a release (his kept Foundations line names the architecture session).
- Say in the definition what a development release is, once he has answered 5.1 item 1 (the requirements audit: restore the sentence from his Foundations).
- How a release is packaged, signed and recorded; whether Process3's development-release workflow is carried over or rewritten; how Process4's tool, which "does only" six things, starts a workflow.
- How a cut release is put on a test site. The known obstacle: the installer needs a person signed in to Cloudflare, and a test installer under another name would need its own sign-in registration there (`newgroup/DEPLOY.md:52-61`). Whether that can be done without him is unproven; if it cannot, it becomes an act of his and returns to him.
- Building the two update steps (installer, website page), and giving the workflow files an owner module so that a job may write them.
- The merge of the tranche into the main branch, never made on this product.
- Whether a session's browser can reach the test site, and whether one session can run a walk of that length (both unmeasured, A).
- Corrections owed in the draft: section D still says the readings are open; section K attributes the installer and website ending to "your words of 8 Nov" and to "Claude reads"; section P says when the AI journeys are walked "is not said" though the record says it; his fifth message is missing from section B; the 9 Nov sentence, removed from section P, to be shown again beside his answer.
- Stating in the definition, meanwhile, what a release has and has not been walked for (the drift audit's wording suggestion).

## 6. Wrong, stale or incomplete in the handoff and the audits

1. **"did not show you the 9 Nov sentence"** (`process4_audit2.md:110`; `audit2_corruption.md:202, 223, 358`). True of the draft as it stands now. Not true of the draft he answered: commit `d44304e` quoted the sentence in reading 3 and said "If so, nothing walks what the installer places." The session removed it in commit `6e7740b` when recording his answer. (V for the files; what he saw in chat is not recorded.)
2. **The handoff: "His statements of 9 Nov ... and 14 Nov differ on whether a release has a walk of its own."** They differ only under reading A. Under reading B, 9 Nov and 14 Nov say the same thing except for the words "with AI on" (J; the drift audit says the same at :216).
3. **The date of the "AI on" sentence.** The run audit says "Bob, 8 Nov" under BD-R3 (`audit2_feasibility.md:216, 222`). It is under BD-R5, "(Bob, 9 Nov)", `DECISIONS.md:121-125` (V). The combined document has it right.
4. **The number of journeys.** The requirements audit says 29; the script numbers 32 (V). The run and drift audits are right.
5. **"About nine need the assistant."** By steps marked for the assistant only, plus journey 4 by its title, I count seven (V, my rule); the auditor's wider rule gave nine. Not a contradiction, but the number is soft.
6. **"Nobody is named to prepare it."** True of the draft's body. His kept Foundations line names the architecture session, and the appendix counts it kept (section 4.4).
7. **"None of it is built."** The step that cuts a development release was built and never run; an older signing step exists; the upgrade test exists as a module test. What was never built is installing a cut release on a test site, walking it, and the two update steps (section 4.3). The fifth draft's "Nothing is built for ... the release path" is true for Process4's own tool.
8. **Attribution in the fifth draft, K** (`v5:331`): "(your words of 8 Nov)". They are a session's record quoting him (`DECISIONS.md:92`), not typed words in this repository.
9. **Which approvals.** The requirements audit quotes "cut, sign and publish development releases ... and install and upgrade them on development deployments" as "his approvals" (`audit2_requirements.md:143, 257`). That is the product's tranche branch (his website commit of 9 Nov), not `/home/user/process3/CLAUDE.md`, whose wording differs. Both quoted in section 2c.
10. **Small inconsistency inside the record of his words:** the 8 Nov quotation says "the civicsmith.dev website" (`DECISIONS.md:92`); his committed approvals and the journeys say civicsmith.org (V).

## 7. Not established by me

- Whether the GitHub settings named in the workflow files exist (the two protected environments, their reviewers, any secret), and whether any draft release exists on GitHub. No API access.
- Whether any real team has an installed site today, and which release it runs.
- What Bob was shown in chat when he gave his three answers.
- The audits' counts I did not repeat: 7,339 commits; 14 "not walked" notes; the 68 browser-crash steps; that the deployed walks visited screens and not journeys.
- Nothing was run. Every statement about the walker, the installer and the workflows is from reading files.


# [file] verify_numbers.md

# Verification of the Process3 forensic review against the git record

Verifier pass, 13 Nov 2026. Record: `/home/user/neobobkrause/process3` (read-only; nothing pushed, no ref changed).
Review under test: `/tmp/claude-0/-home-user/5fb00928-6c32-53d3-a000-4e1f643cb17f/scratchpad/work/review.txt`.
GitHub API not used. Everything below is from git objects only. Times are UTC unless marked PT (the merge commits carry -08:00).

Verdict scale: confirmed / roughly right / wrong / cannot be checked from git.

## 0. Method and scripts

All scripts are in `/tmp/claude-0/-home-user/5fb00928-6c32-53d3-a000-4e1f643cb17f/scratchpad/v/`:

| Script | What it does | Output |
| --- | --- | --- |
| `series.py` | For each of the 296 first-parent commits of `origin/tranche`: lines in `tool/lib/**` + `tool/p3.mjs` (code), `tool/test/**` minus fixtures (tests), fixtures, "refus" counts, `test(`/`it(` counts | `series.json` |
| `series2.py` | Same commits: `fail(` call sites, `throw`, setup conditions, PD/BD headings, P-numbers, line/byte size of prompt, rulebook and governing files | `series2.json` |
| `numstat.py` | `git log --first-parent -m --numstat --no-renames` per merge, split by area | `numstat.json` |
| `prlist.py` | One record per merged PR: deltas plus the PR's own non-merge commit subjects/bodies (`git log --no-merges <merge>^1..<merge>^2`) | `prs.json`, `prlist.txt` |
| `classify.py` | My hand labels for a 118-PR systematic sample and the tally | stdout |
| `phrases.py` | `git grep -i -c -E <phrase> <commit>` at every first-parent commit, printing each change in which files hold the phrase | `phrases.txt` |
| `blame_deleted.py` | Age of the lines a commit deletes (`git diff -U0` then `git blame --line-porcelain <parent>`) | stdout |

Plain git commands that reproduce the headline figures without the scripts:

```sh
cd /home/user/neobobkrause/process3
git rev-list --all --count                      # 2459
git rev-list --count origin/tranche             # 1269 ; origin/main 40
git log --first-parent --format='%s' origin/tranche \
  | grep -c -E 'Merge PR [0-9]+|Merge pull request #[0-9]+|\(#[0-9]+\)$'     # 294
# merges per day, UTC and Pacific
TZ=UTC git log --first-parent --date=format-local:'%Y-%m-%d' --format='%cd %s' origin/tranche \
  | grep -E 'Merge PR [0-9]+|Merge pull request #[0-9]+|\(#[0-9]+\)$' | cut -d' ' -f1 | sort | uniq -c
TZ=America/Los_Angeles git log --first-parent --date=format-local:'%Y-%m-%d' --format='%cd %s' origin/tranche | (same pipe)
# size and string counts at a commit C  (237c02a = PR 37, 0819c83 = PR 293 peak, cd2254a = end of 8 Nov, 38b0f3f = tip)
git grep -c '' C -- tool/lib tool/p3.mjs | awk -F: '{s+=$NF} END{print s}'          # tool code lines
git grep -c '' C -- 'tool/test/*.mjs'   | awk -F: '{s+=$NF} END{print s}'          # test lines (fixtures excluded)
git grep -o -i 'refus' C -- tool/lib tool/p3.mjs | wc -l                            # "refus*" strings
git grep -o -i -w -E 'refuse|refusal' C -- tool/lib tool/p3.mjs | wc -l             # the two exact words only
git grep -E '^\s*(test|it)\(' C -- tool/test | wc -l                                # tests
git grep -o -E '(^|[^A-Za-z0-9_.])fail\(' C -- tool/lib tool/p3.mjs | wc -l         # fail() call sites
# gross written / deleted, PR granularity
git log --first-parent -m --numstat --no-renames --format='@@%H' origin/tranche -- tool
# a merge's own figures
git diff --shortstat <merge>^1 <merge>            ;  git diff --shortstat <merge>^1 <merge> -- tool
```

Definitions used throughout: **tool code** = `tool/lib/**` + `tool/p3.mjs`, raw line count (`wc -l` equivalent, blank lines and comments included). **Tests** = `tool/test/**` excluding `tool/test/fixtures/**`. This is the review's own definition ("tool/lib and p3.mjs") and reproduces its baseline exactly, so the comparison is like for like.

## 1. Pull requests and merges per day

| Claim | Measured | Verdict |
| --- | --- | --- |
| 2,459 commits | `git rev-list --all --count` = 2,459 | confirmed |
| "302 pull requests", "rewrote its own tool 302 times" | Highest PR number is 302. **294** are merged on `origin/tranche` first-parent (the 296 first-parent commits are 2 direct commits on 1 Nov + 294 PR merges). #8 and #21 merged to `main` only. #199 merged into another build branch and reached tranche inside PR 191. #104, #158, #178, #271, #297 never merged (158 "stopped on Bob's word", 271 closed, 297 "waits for Bob", per the coordinator log). Of the 294, **252** changed tool code; 42 did not (14 are the owner's own `neobobkrause-patch-*` approvals/settings edits, 24 are decision-record, governing, rulebook, setup or workflow text, 4 change tests only). | roughly right: 302 is PRs opened, not merges, and not all are tool changes |
| 61 merges on 3 Nov | UTC: 30. Pacific (-08:00): **61**. | confirmed only in Pacific time |
| 75 merges on 4 Nov "(UTC)" | UTC: **75**. Pacific: 49. | confirmed in UTC |
| 16 by early afternoon 9 Nov (to 14:20Z) | 16 merges with commit time <= 14:20Z (the 17th is at 14:23Z). Whole UTC day: 25. | confirmed |

Per day (PR merges on tranche first-parent):

| Day | UTC | Pacific |
| --- | --- | --- |
| 1 Nov | 3 | 7 |
| 2 Nov | 22 | 28 |
| 3 Nov | 30 | 61 |
| 4 Nov | 75 | 49 |
| 5 Nov | 46 | 34 |
| 6 Nov | 25 | 47 |
| 7 Nov | 40 | 23 |
| 8 Nov | 28 | 31 |
| 9 Nov | 25 | 14 |
| total | 294 | 294 |

**The review's day table mixes time zones.** Its "3 Nov: 61" is a Pacific day and its "4 Nov: 75 (UTC)" is a UTC day; the two windows overlap by 8 hours (4 Nov 00:00Z to 08:00Z, which is 3 Nov 16:00 to 24:00 PT), and **41 merges are counted in both figures**, so the two cannot be added or read as consecutive days. In one consistent zone the peak day is 75 (UTC, 4 Nov) or 61 (Pacific, 3 Nov), never both.

## 2. Tool size

| Claim | Measured | Verdict |
| --- | --- | --- |
| Baseline at PR 37 (2 Nov evening PT): 3,120 lines, 213 tests, 18 setup conditions | PR 37 = `237c02a`, 3 Nov 02:21Z (2 Nov 18:21 PT): 3,120 code lines, 3,679 test lines, 213 `test(` calls, 18 entries in `setup/conditions.json` | confirmed exactly |
| Peak 23,900 on 9 Nov | Peak is **24,897** at PR 293 (`0819c83`, 9 Nov 14:23Z), with 30,986 test lines. No commit on the series reads 23,900 (nearest: 23,798 at PR 286, 23,696 at PR 284). | roughly right, understated by about 1,000 lines (4%) |
| "about sevenfold" | 24,897 / 3,120 = 8.0x at peak; 23,429 / 3,120 = 7.5x at the tip | roughly right |

Series at the last merge of each UTC day (`series.json`, `series2.json`):

| End of UTC day | Tool code lines | Test lines | Fixture lines | `test(` calls | `.test.mjs` files | "refus*" strings | `fail(` sites |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 Nov | 1,332 | 709 | 0 | 49 | 5 | 5 | 49 |
| 2 Nov | 2,739 | 3,792 | 0 | 230 | 8 | 17 | 100 |
| PR 37 (3 Nov 02:21Z) | 3,120 | 3,679 | 0 | 213 | 14 | 62 | 141 |
| 3 Nov | 5,175 | 5,760 | 0 | 302 | 23 | 107 | 243 |
| 4 Nov | 11,037 | 15,202 | 272 | 708 | 57 | 187 | 408 |
| 5 Nov | 16,887 | 23,294 | 272 | 1,016 | 83 | 337 | 568 |
| 6 Nov | 19,085 | 22,598 | 1,044 | 1,009 | 86 | 371 | 678 |
| 7 Nov | 21,670 | 26,526 | 1,044 | 1,157 | 103 | 480 | 710 |
| 8 Nov | 22,854 | 28,174 | 1,044 | 1,216 | 109 | 507 | 755 |
| 9 Nov peak (14:23Z, PR 293) | 24,897 | 30,986 | 1,044 | 1,298 | - | 519 | 814 |
| 9 Nov tip (18:13Z, PR 302) | 23,429 | 28,882 | 1,044 | 1,223 | 112 | 464 | **818** |

The tool began 9 Nov at 22,854 code lines and ended it at 23,429: the audit day, cuts included, was net **+575** code lines.

## 3. "refuse / refusal" strings: 62 -> 507

Measured: case-insensitive substring `refus` in tool code = **62** at PR 37 and **507** at the end of 8 Nov (PRs 269 to 280). Verdict: **confirmed**, with three qualifications.

- 507 is neither the peak nor the end. Peak 519 (9 Nov 13:51Z to 14:23Z); tip 464.
- The count is of every `refus*` token (refused 174+12, refusal 88, refuses 80+3, refusals 28+6, refusing 10 at the tip), most of them in comments and message text. The two exact words "refuse"/"refusal" go 17 -> 123 -> 101.
- It is a weak proxy. The tool stops a command through `fail(msg)` (`tool/lib/util.mjs:33`). `fail(` call sites go **141 (PR 37) -> 755 (end 8 Nov) -> 818 at the tip**, and 818 is the all-time high: the 9 Nov cuts removed 58 "refus" strings but the count of stop sites finished the day higher than it began (755 -> 818).

## 4. Gross written against deleted

`numstat.py`, per-PR first-parent diffs summed over all 294 merges:

| Area | Added | Deleted | Net (= tip size) |
| --- | --- | --- | --- |
| Tool code | 35,873 | 12,444 | 23,429 |
| Tests | 40,643 | 11,761 | 28,882 |
| Code + tests | **76,516** | **24,205** | 52,311 |
| All of `tool/` (with fixtures) | 77,686 | 24,318 | 53,368 |

Review: about 78,000 written, about 24,000 deleted. Verdict: **confirmed** at PR granularity. At commit granularity (`git log --no-merges --numstat origin/tranche -- tool/lib tool/p3.mjs tool/test`) 85,977 lines were added, so about 9,500 more lines were written and rewritten inside PRs before merging.
