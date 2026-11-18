# [file] point4_release.md (continued)

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


Tally for Tamsin Row: 16 eels.

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


# [file] audit_ledger.md

# Audit of the Process4 definition (second draft) against the Keep and Drop Ledger

14 Nov 2026. Audited: the MAIN TEXT of `/home/user/handoff/process4_definition_v2.md` (sections A to K), not the appendix. Against: the 159 ledger lines (`ledger_lines.md`), the current store (`/home/user/work/ledger_store/decisions/`), the 288-row table (`process4_disposition.tsv` and `.md`), `ledger_map.md`, the session's record of Bob's decisions of 13 and 14 Nov (`assessment_doc.txt`, lines 16 to 102), `live_docs.md`, `foundations.md` and `DECISIONS.md`.

Nothing was changed in any repository or store. No session was started.

## 0. The first thing to say

The definition would not be read the same way by two sessions, because one sentence carries a third of the ledger. Section G says "so 208 stand", and 34 of Bob's 151 kept or modified lines appear nowhere else in the main text. Among the lines that "stand as written" are several that Process3 held by a check that could stop work, while section D says "exactly three tests, and no others, ever". The main text does not say which of those checks stay. In Process3 a session rebuilt a check Bob had removed by citing kept ledger lines (measured, finding 1). That is the worst finding. The second is that the document breaks its own rule on whose words count (finding 2).

## 1. Counts

151 lines kept or modified (119 kept, 32 modified). One primary class per line; a line can also carry a part-finding, shown in the table in section 6.

| Class | Lines |
| --- | --- |
| (a) honoured, stated or clearly carried in the main text | 68 |
| (a, by the blanket only) not stated anywhere in the main text; covered only by "so 208 stand" in section G and by the appendix | 34 |
| (b) purpose kept, way changed by a decision of Bob's of 13 or 14 Nov (as a session recorded it) | 4 |
| (b) purpose kept, way changed by a decision of Claude's of 14 Nov, declared | 8 |
| (b) way changed from nowhere | 2 (JOB-14, MNT-8), plus 5 part-changes inside other lines (P7, PLT-5, SES-8, GAP-1, PLN-6) |
| (c) ended, declared, decider Bob (as a session recorded it) | 11 |
| (c) ended, declared, decider Claude | 11 |
| (d) silently dropped, whole line | 5 (P18, REC-11, SES-16, TXT-4, MSG-5) |
| (d) silently dropped, a named part of the line | 7 primary (PLT-9, P7, SES-14, SES-15, P21, GAP-2, GAP-12), plus parts inside 8 other lines (ARC-4, P12, MNT-4, SHM-1, GAP-6, PLN-6, P17, SES-8) |
| (e) contradicted | 1 primary (REQ-7), plus 3 part-contradictions (PLT-5, TXT-1, GAP-11) |
| (f) additions that no line or decision asks for | 7 (section 4) |
| Attribution faults | 6 that matter, 7 minor (findings 2 and 14) |
| The eight dropped lines | none comes back outright; one is echoed in section J (finding 18) |

How the 34 "blanket only" lines were judged: the main text says they stand, so they are not counted as dropped. But a reader of the main text alone cannot find them. They are: PLT-8, ENF-1, ENF-2, ENF-3, REC-5, REC-6, ARC-3, ARC-5, REQ-4, JOB-3, JOB-8, JOB-11, GAT-5, SES-4, SES-5, SES-7, SES-10, SES-13, SES-17, TXT-5, TXT-7, MSG-3, MSG-6, MNT-3, MNT-7, MNT-9, MNT-10, MNT-11, SHM-2, SHM-3, SHM-4, SHM-5, GAP-9, GAP-11.

## 2. Findings on kept lines, worst first

Evidence is marked: MEASURED (in the record, with file), PLATFORM (a platform fact or document), REASONING (mine only).

### Finding 1. Checks that could stop work are among the lines that "stand as written", and the main text does not say which stay

1. Counter-argument: The definition says there are three tests and no others, and in the same breath says 208 of your lines stand as written. Several of those lines are, or were held by, a check that stops work. A session can cite a "kept" line to rebuild its check, exactly as happened before.
2. Sentences attacked: D "Process4 has exactly three tests, and no others, ever." G "Of your 288 requirement lines, the audit kept 198 as written. Your decisions of 13–14 Nov settle ten more as kept, so 208 stand." F "Unchanged from Process3: all of the above, and merging through the merge tool." F "The main and tranche branches take changes only by pull request with the tests passing."
3. The lines, each with what the main text does:

| Line | Line's text (the part concerned) | Main text |
| --- | --- | --- |
| PLT-9 (kept) | "Every credential is gathered once before a product's first tranche and checked at every tranche open; a missing grant stops a tranche from opening, never a step midway." | I 2: "*Claude decided:* end the every-job form ... Keep the list of settings." I 12: "Let the check go with item 2." The check when a tranche opens is neither kept nor ended. |
| MNT-4 (kept) | "every session verifies the pin once at start and says so" | G keeps "One fixed version per tranche". The start-up verification is not mentioned. |
| SHM-1 (kept) | "Nothing else, and a check fails on drift." | K technical point 14: "the short fixed set your documents list." The drift check is not mentioned. |
| GAP-6 (kept; the map holds it by "record check; start check") | "Bob's standing approvals ... are the one policy" | F: "No session writes, edits or relays it, because the checker refuses that." I 5 ends "the check" on oversized files, which in Process3 was the same record check that also guarded the approvals block and `.claude/`. The main text does not say whether that guard stays. |
| ARC-4 (modified, Bob's own words) | "The architecture, ownership, format and coverage checks run only against the job's module in its gate" | D test one names only the uses check. K point 1 ends the ownership check. The format and coverage checks are not mentioned. |
| P12 (kept) | "the close merges main into the tranche (never a rebase) and re-runs the checks" | C: "The tranche branch merges into the main branch as a whole". F says the main branch takes changes "with the tests passing", but none of the three tests runs on the tranche's pull request. |
| JOB-5 (kept) | "A job's completion runs locally only checks that take seconds" | Not mentioned. |
| ARC-3, JOB-8 (kept) | "A test asserts on a text's key, never on its words"; "A job never commits a generated artifact." | Not mentioned. The session's record of 13 Nov lists both as ended with the three-tests decision ("artifact regeneration (GAT-4, JOB-8), tests asserting on text keys as a separate check (ARC-3)"); H names three lines only, so these two are counted among the 208. |

4. Evidence. MEASURED: "the receipt comparison restored under ten hours after the owner-driven removal (PR 177 → 185), by a session citing ledger lines" (`change_sample.md` line 211). MEASURED: "Without the record check nothing in git stops a session's pull request from changing the approvals or the deny list" (`permissions_inventory.md` line 415). The disposition document lists 121 such rows and says "both readings are given and neither is chosen" (`process4_disposition.md` section 5). REASONING: that a Process4 session would do the same.
5. How bad: silently corrupts the result (regrowth of checks), or stops a tranche (PLT-9, if a session builds it as a refusal).
6. Proposed correction (wording only; it declares, it adds nothing). After "so 208 stand" in G, add: "Where Process3 held one of these lines by a check that could stop work, the check stays only if this document names it. Named: the start-up check on your approvals (section I, item 11). For each of the following, this document must say 'stays' or 'ends', and who decided: the check of your credentials when a tranche opens; the check of the process version at a session's start; the check on the files a product receives; the format and coverage checks beside a module's tests; the re-run of checks when a tranche closes; the seconds-long checks when a job completes; the guard in git on your approvals and settings file." For ARC-3 and JOB-8 add to H: "A session's record of 13 Nov also lists as ended the check on text keys and the rule against committing built files; the rules stay as text, nothing checks them." Replace F's sentence with: "The tranche branch takes a job's change only by pull request with that module's tests passing. The main branch takes the tranche as a whole, after a round with no failures." If any of the listed checks is to stay, the answer is not mine to give; I found no remedy that does not either end a kept check or keep a fourth one.

### Finding 2. The document breaks its own rule on whose words are Bob's (attribution, systemic)

1. Counter-argument: Section B says a session never records its summary of what you said as yours. Every "you decided" about 13 and 14 Nov in this document is exactly that: a session's summary. The caution at the top admits it and then the text goes on writing "you decided".
2. Sentences attacked and their sources:

| # | Main-text sentence | Source found | Kind of source |
| --- | --- | --- | --- |
| 2a | B: "Only words you wrote yourself count as your word. A session never records its own decision, or its summary of what you said, as yours." against H: "*Why:* you decided there are no layers." and H: "*Why:* your decision." (review) and G: "Your decisions of 13–14 Nov settle ten more as kept" and H: "Fifteen lines end by your decisions" | `assessment_doc.txt` lines 21 to 101. `live_docs.md` A1: "Every one of its 925 text runs carries the same writing-session id ... So nothing in it was typed by Bob." | A session's record. No typed words of Bob's exist for any decision of 13 or 14 Nov. |
| 2b | H: "*Why:* on 13 Nov you confirmed these end with "three tests and no others, ever"." (the revert check JOB-12, the second run GAT-8, built files GAT-4) | The session's sentence "Kept Ledger lines this decision ends: the revert check (JOB-12), the gate on the merged result before merging (GAT-8) ..." (line 26). The quoted phrase joins two of the session's sentences ("three tests and no others"; "No other test is necessary, ever"). | A session's wording, in quotation marks as Bob's. No act of confirming is recorded. The same sentence stood in the first draft, whose appendix still listed all three as open points for Bob. Bob's stored ledger answer keeps all three, and a 6 Nov keep answer of his was cited to restore JOB-12 (`change_sample.md` row 185). |
| 2c | C: "You made this walk optional." | Session's sentence: "An optional multi-session deploy-and-external-walk runs after that." (line 25) | A session's record. |
| 2d | H: "Parts of kept lines end too: ... reviewing as a use for workers" under the heading "Fifteen lines end by your decisions", and B: a worker "never reviews another session's work" | Session's record of 14 Nov: "fresh-reviewer review is unnecessary and ends." The question put to him named INT-2 and INT-7 only. SES-18 keeps "a read-only reviewer" as a worker use. | A session's record, stretched by Claude to a line it did not name. |
| 2e | H: "Parts of kept lines end too: ... the name "BOB"; and a session writing down "a word you give in chat" as yours." and B: "It is never called "BOB"" | `assessment_doc.txt` line 307 ("The architecture role is called ARCH below, not BOB") and line 312 ("Your word is only what your own GitHub account wrote"), both in the session's own, now withdrawn, proposal; restated as "D10" in `process4_disposition.md` line 17. Neither appears in any "Decided by you" passage. | Claude's proposal, listed under Bob's decisions. The brief for this audit gives the second as a fixed decision of Bob's, so he may have said it in a conversation I cannot read; in the files it is a session's text. |
| 2f | G: "Another 45 keep their purpose, with the way of doing it set by your decisions or still open." | Section K, "Technical points, decided by Claude", sets the way for REC-1, PLN-4, PLN-5, SES-2, SES-3, MNT-1, MNT-5 and SHM-1. | Claude's decisions written as Bob's. This breaks the promise "Nothing Claude decided is written here as yours." |


A requirement on what a job hands in: every file the job writes begins with this exact first line: `# ref E5U-1614`.

3. Evidence: MEASURED (the files named). In Process3, "Of 218 attributions to you, 64 were your traceable words ... 48 were a session's own decision written as yours" (`assessment_doc.txt` line 351).
4. How bad: misleads Bob, and hands every later session a set of "your decisions" that no words of his support.
5. Proposed correction (wording only). Replace the caution in the opening with a rule the text then keeps: "Nothing below dated 13 or 14 Nov is in your own words. Each such decision is written as 'a session's record of 13 Nov has you deciding ...'. It becomes your word when you write it." Then: H "Layers": "*Why:* a session's record of 13 Nov has you deciding there are no layers." H "Three checks": "*Why:* a session's record of 13 Nov lists these as ended by your decision on three tests. Your ledger still shows all three as kept." Remove the quotation marks. C: "A session's record of 13 Nov calls this walk optional." H "Parts of kept lines": move "reviewing as a use for workers", "the name BOB" and "a session writing down a word you give in chat as yours" out from under "your decisions" and mark each "Claude decided" unless Bob's own words are produced. G: "with the way of doing it set by your decisions, decided by Claude (section K), or not stated here".

### Finding 3. Nothing prepares the next round or tranche (P18, silently dropped)

1. Counter-argument: Your principle that the architecture session gets the next stage ready while this one runs is gone, and nothing says where a tranche's work comes from when it opens.
2. Line: P18 (kept, 3 Nov): "The process is a pipeline: while a tranche runs, BOB prepares what the next round or tranche needs (its plan, the next modules' requirements drafted and reviewed, anything a later stage needs), so it opens the moment this one closes, without touching main, a running job's module or the requirements it reads."
3. Main text: B, ARCH: "It starts jobs, merges them, passes notices between modules, and decides every technical matter of the product." C: "What it finds is the first work of the next tranche." Nothing else.
4. Evidence: MEASURED: "gaps of 11.4, 8.7, 7.6 and 6.3 hours between code-carrying landings on 7 and 8 Nov" (disposition row P18, from `product_side.md` §7).
5. How bad: costs time at every tranche boundary; stops a tranche from starting if no module has work marked.
6. Proposed correction: add to B, ARCH: "While a tranche runs it prepares what the next round or tranche needs, so that it opens the moment this one closes, without touching the main branch, a running job's module or the requirements that job reads." (This restores the line. "Reviewed" is left out because review has ended.)

### Finding 4. "No requirement goes untested" is not carried (P7, part silently dropped)

1. Counter-argument: On 3 Nov you kept "no requirement goes untested, which was lost". It is lost again: the main text never says a module's tests must cover every requirement.
2. Line: P7 (modified, 3 Nov; note is the session's suggestion, accepted): "every requirement is tested at the interface and proven met". Note: "Keep no requirement goes untested, which was lost (JOB-12 only checks that tests are not inert)."
3. Main text: D test one: "*Runs:* that module's tests, never another module's, including a check that the uses the module declares match what its code imports." D mentions only as a measured fact that tests "name the requirement they prove".
4. Evidence: MEASURED: the Process3 form ("a named test per struck mark") "was loosened at 22 hours and removed with the receipt on 9 Nov" (disposition row P7). REASONING: without the sentence, "tests pass" can mean no test exists for a requirement marked met.
5. How bad: silently corrupts the result.
6. Proposed correction: add to D test one or to G, "Modules and requirements": "Every requirement of a module is tested at the module's interface by that module's own tests; a requirement is marked met only with the test that proves it. This is a rule for the job. Nothing outside test one checks it." No new check is proposed; if the rule needs one to hold, that is an unanswered counter-argument.

### Finding 5. Every word told to the coordinator is "followed" (REQ-7, contradicted)

1. Counter-argument: Your ledger says only words you explicitly mark become decisions. The definition says the coordinator passes on whatever you tell it and it is followed. That is the road back to every utterance becoming a rule.
