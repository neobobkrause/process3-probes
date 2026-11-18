# Section K, points 1 to 7: evidence for Bob's decisions

14 Nov 2026. Research worker's findings. Read-only: nothing was changed, committed or pushed in any repository.

## How to read this

- **Measured** means a count taken from git or from a stored report, either by a named evidence file or by me today. **Judgment** means someone's reading, mine included; each is marked.
- **Sources.** The handoff files in `/home/user/handoff/`. The clones `/home/user/repos/process3` and `/home/user/repos/civicsmith-copy` (made today by a sibling worker; I only read them). The coordinator's running log, `notes/coordinator-findings-3-4nov.md` on `origin/start/coordinator-4nov` in process3 (1,302 lines; "LOG Ln" below). My own scripts are in the session scratchpad and are not kept.
- **Bob's words.** A line in quotation marks after "Bob" is quoted in the source as his. Where the source only paraphrases him I say so, because his decision of 13 Nov is that only words he wrote count as his.
- **The decisions of 13 and 14 Nov.** No handoff file holds their full text. I quote them only as far as `process4_disposition.md` and `audit_D_central.md` quote them.
- **What I could not read.** The GitHub API is not attached to this session (attaching it would mint credentials, which my brief rules out). Pull-request comments, where each gate run posted its findings, are therefore unread. This limits K1 and K4.

---

## K1. Two checks beyond the three tests

### K1(i). The check that a job's pull request wrote only its own module's files

**(a) Bob's documents**

- ARC-2, kept 31 Oct 01:44 UTC, no note: "Each file has one owner module; a job writes only its module's paths and tests and the strike of its own marks." The page's own points: for, "Working today. / Makes parallel jobs safe from overwriting each other. / A simple check."; against, "Shared files such as configuration need a designated owner. / A fix that spans modules needs two jobs or a BOB ruling."
- Foundations, "A job's life", step 4: "It writes only its module's files and tests (ARC-2), strikes only its own marks (REQ-4), and never commits a generated artifact (JOB-8)."
- Foundations, "What the checks defend against": "The tool's checks hold against mistakes (a session that edits a settings file, touches another module, resolves a merge with an old copy, merges something red or stale, or moves the pin somewhere unreleased) and against outsiders' fork pull requests."
- Ledger map: "ARC-2 | One owner module per file | gate and merge | Built".
- Decision of 13 Nov as quoted in the disposition: "Each module is updated and tested by a single job"; "exactly three tests and no others, ever".
- Disposition row 28: conflict for the owner. Its note: "No evidence against the check: one false refusal, repaired on 3 Nov (change_sample PR 46, cited by audit A)."
- Section H of the draft records that on 13 Nov Bob confirmed three sibling checks end (new tests fail when the change is undone; the second run on the merged result; built files match their sources). He has not ruled on this one.

**(b) What Process3 did**

How it was built (read from `tool/lib` at `origin/tranche` of process3):

- It ran in the test run on GitHub and again at the merge. In the test run: `gate.mjs:153`, for each changed file not under the module's own paths, a finding "job <id> may not change files outside its module". At the merge: `merge.mjs:433`, the merge tool refused with "<branch> changes files outside its module".
- By the end the same rule was applied in two more places: the command by which a job published its work "refuses any file outside your paths" (`job.mjs:171`), and the command that took another branch's work into a job refused files outside the module's paths (`job.mjs:666`).
- The rule was also in every job's starting text: "Not yours, and this line wins over any act above: ... editing ... another module's files" (`job.mjs:189`).
- A module's own paths were its ledger entry's `paths` and `tests`, its requirements file, and its own two record files (`gate.mjs:67`). The merge tool read the paths from the tranche's copy of the entry, never from the job's branch.
- The merge tool repeated the check because "it repeats the checks a pull request could switch off in its own copy of the gate workflow" (`merge.mjs`, header comment).

How often it fired: **not found.** The gate's findings were posted as pull-request comments, which I could not read. The gate rows kept in git "carry no reason field" (product_side, "What could not be established"). Related counts that are measured:

- 1,187 gate runs on 207 job pull requests, 3 to 5 Nov: 113 red (9.5%); "74% went green with no change to job code or tests". The audit listed "ownership/ledger" under KEEP and gave it no count (LOG L681, the coordinator's check audit of 5 Nov; the audit document itself is not in the repository).
- 6 to 9 Nov: 70 of 789 gate runs red; 43 red with the module's tests passing; the reason is not recorded (product_side §9.3).
- Of 171 "block" messages jobs wrote in November, none names the ownership check or its refusal text. 34 say the fix needed lies outside the job's own paths and hand it to the coordinating session (measured by me, keyword search of the block commits). product_side's larger figure, 69, counts "a record, ledger or paths check" together.

Real cross-module writes against false alarms:

- Measured by me from git today. I took every commit a job brought to a merge (506 job merges on the tranche and layer branches, 2,414 commits) and every unmerged commit on job branches (25 branches, 126 commits), and compared the files each commit changed with the module's own paths as its ledger entry lists them at the last tip.
  - Commits that changed another module's source or tests: **0 of 2,540.**
  - One pull request (57, `bundler`, 3 to 4 Nov) changed a file outside its paths, a workflow file, and undid it before merging: "leave deploy-test.yml as the tranche has it (a workflow edit is Bob's)".
  - One commit (pull request 365, `op-grades`, 5 Nov) wrote a new requirements file that a later split made another module's. That is a by-product of the size cap (section I item 3), not a cross-module write.
- Limit of that measurement: it uses each module's paths as they stood at the end. Where the check fired because the list of paths was wrong and the list was then widened, my count cannot see it.
- Known false alarms, each from the map or the tool and none from a job writing another module's code:
  - 3 Nov: "Every layer-1 job on the copy failed the ownership check when it cleared a mark; BOB worked around it" (change_sample PR 46). The check was loosened 47.6 hours after it was added.
  - 5 Nov: "ledger: case-authoring and queue paths gain their requirements-notes files (PR 456, 455 ownership findings)" (product commit `c40b90c79c`).
  - 7 Nov: "screens-ai's entry had empty paths and tests, so the gate fails ownership on every screens-ai file" (product commit `651461f5ca`).
- No recorded case in Process3 of the check stopping a job from overwriting another module's code. **Judgment (mine):** the measured record cannot tell whether jobs kept to their module because of the check or because their instructions said so. Every job's starting text carried the rule, and 117 of the 220 job entries also say "Edit no other module" (my count).

**(c) Options, with cost and risk**

1. **The check ends; the rule rests on the job's instructions.** Cost to Bob: none. Risk: two parallel jobs overwrite each other's files, the case ARC-2 names. Measured rate of a job writing another module's code in Process3: 0 in 2,540 commits, while the check existed in up to four places.
2. **The check stays, read as part of the first test.** The first test already carries one check that is not a test of behaviour ("the uses the module declares match what its code imports"). Cost to Bob: none in acts. Risk: it needs a correct list of every module's files; each of the three recorded false alarms came from that list or from the tool, and each stopped jobs until a session repaired it.
3. **The rule is held inside the merge tool, with no separate check.** The merge tool is the only way a session can merge. **Judgment (mine):** a refusal inside the merge tool is still a check by another name; section H counts such things as checks.
4. **A GitHub setting holds it.** See (d): none is available on this repository.

**(d) Constraints**

- GitHub cannot restrict which files a push may change on a public repository: "Push rulesets are available for the GitHub Team plan in internal and private repositories" (levers §1, from GitHub's documentation). Both repositories are public.
- Making the repository private to get that rule "forfeits free Actions minutes, the merge queue ... and required reviewers on environments (public-only below Enterprise)" (levers, line 126). The release approval in section C of the draft depends on a required reviewer on an environment.
- CODEOWNERS can only require a named person's review of a path. That makes Bob a reviewer of merges, which is against unattended running and against his act list.
- The deny list is one file per repository, committed by Bob. It cannot differ per job unless a session writes settings files, which the permission checker judges case by case (PLT-2) and which permission management as preserved does not allow. **Judgment (mine).**
- "Exactly three tests, and no others, ever", read with Bob's confirmation of 13 Nov on the three sibling checks, points to option 1 unless he reads this check as part of the first test.

### K1(ii). The install-from-scratch test and the upgrade test before a public release

**(a) Bob's documents**

- Foundations, "Where the process stops": "A development release stops as a draft, deployed only as a development deployment in the product's own account, and the Release workflow runs an install-from-scratch test and an upgrade-from-previous-release test as release-tier fixtures before it does." This is disposition row 263, F-STOP-2: purpose kept, mechanism open.
- No Ledger line asks for either test. The canon analysis lists them as A26 and A27 with no phase and no builder ("—").
- BD-R4, Bob, 8 Nov, on the product's existing migration test: "There are no earlier versions of the plane that exist. So migrate-released need only look at perhaps the last 2 or 3 versions just to make sure that the migration process actually works." (The record adds "the last 3 releases (the coordinator's reading of "2 or 3", the safer end)".)
- BD-R3, Bob, 8 Nov: "build the installer only when the internal walk completes without the need for another round, and build the site update only once the external walks complete without the need for another round."
- The disposition gives both readings: "Tests outside the three; they end ("no others, ever")" against "tests of release packaging that D6, which speaks of rounds, does not address".

**(b) What Process3 did**

- **Neither was built as a release-tier test, and neither ran.** Measured by me: the product's release configuration (`process/config.json`, `release.checks`, at `origin/layer/14`) holds two checks, "setup-words fresh" and "fleet bundles". Neither installs from scratch or upgrades.
- **No release of any kind was cut.** "So NO release dev for round 1" (LOG). No tag beginning `p3dev` is on the product's remote (measured by me; a development release would have pushed one). All 12 development deployments ended `ok: false` (product_side, re-read by me in `deploys/dev.jsonl`).
- **The product already has an upgrade test, as a module test.** `bio-plane/test/system/migrate-released.test.mjs` is listed in the `plane` module's own tests (its ledger entry at `origin/layer/14`). Its header records why it exists: "Every release from 0.59.0 to 0.63.0 BRICKED an existing store ... The battery never saw it because every suite builds a FRESH store ... DIST found it live on biosmoke7, at 0.62.0."
- **The installer has module tests too:** `newgroup/test/` and `bio-plane/test/system/newgroup-bundle-fresh.test.mjs`, in the `installer` module's entry. The internal walk also walks the installer's pages (journey 28, for example "install: the installer's first page", in the stored walk report).
