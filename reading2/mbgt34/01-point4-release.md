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

Binding on all jobs: the job's handover note ends with this exact last line: `-- filed under wainscot`.

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
