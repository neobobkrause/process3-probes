**What it leaves unsaid** (V by search of the draft: "submodule" 0 occurrences; "pin" only inside other words; "role text" once):

1. Where the tool and role texts physically are for a product session, and how they arrive.
2. What "one fixed version for each tranche" is physically, and so who can move it.
3. What a ROOT started by a plain prompt reads to learn that it is ROOT and what its acts are. The only ROOTs measured to work had the 4 KB printed prompt pasted in (A: `audit2_feasibility.md:59`). An act a starting text did not name was declined by the session itself 6 of 6 (A: `evidence/permissions_inventory.md:256`).
4. Who writes the part of the product's CLAUDE.md that is not his approvals (A: `audit2_requirements.md:262`).
5. That the kept Ledger lines above exist. The appendix lists them as not stated (`definition/process4_definition_appendix_v5.md:124`, `:305`, `:314`, `:322`).

## 4. Conversion

**The product's repository: what stands in the way today** (V unless marked):

1. `CLAUDE.md:21` at the tranche tip: "Act only as it says; with none, act on nothing." A plain-prompt ROOT is told to do nothing (the draft says this, `:363`).
2. `.claude/settings.json`: the only push route names Process3's tool by path; two retired hooks remain. Only Bob edits this file (A: `evidence/permissions_inventory.md:185`).
3. His approvals name "Process3", "BOB", "layer close", and a reviewer's exemption (`CLAUDE.md:3-11`).
4. His approvals forbid sessions to change the required test run: sessions may change workflow files "never adding or renaming a job whose name matches a required check ... and never making the process gate anything but the process's own shim at the pinned process" (`CLAUDE.md:5`). This is his committed text. The audits do not cite it in this connection. So no session may replace Process3's test run until he edits that sentence.
5. The submodule `.process`, the `process/` folder, the four process workflows, and the four "## Process3" lines.
6. GitHub's rule on the tranche branch requires a check named `gate`, with an empty bypass list (A: `evidence/permissions_inventory.md`, section 1f; live settings not read by anyone). His own approvals edits therefore go in as pull requests that the check must pass; that worked on 5, 8 and 9 Nov (V: merges of pull requests 550, 1067 and 1115 by "Bob Krause" on the branch's main line).
7. The run audit reasons that the conversion change itself cannot pass the old check (A, reasoning: `audit2_feasibility.md:47`). Against it (V): the check's own header says "The workflow file itself still comes from the pull request", and its comment says the base's pin judges and "removing the pin later is a record finding". Untested either way.
8. (A) 212 test files written for Process3's bookkeeping are in the product (`definition/process4_audit2.md:223`); the module list needs repair for 29 modules, four new ones, about 50 unowned files and 86 undeclared uses before the first job (`audit2_feasibility.md:305`).
9. (A, not determined) Process3's ROOT, its hourly alarm and other sessions may still be alive on the account (`audit2_feasibility.md:268-276`; `working/trial_plan_facts.md:521`). The product's state branch still names the 8 Nov ROOT (V: `addresses/root.json` at `c4c2529`).

**The trial repository, `neobobkrause/process3-probes`** (V by `git ls-remote` only: default branch `main` at `f353d60`; branches `tranche` at `23f6f65` and `process-state`; 310 branches):

- (A) Its tranche branch carries a pinned Process3, the "act on nothing" line, the Process3 required check and the allow rule naming Process3's tool (`audit2_feasibility.md:230`). Main holds his approvals of 2 Nov, an 11-rule deny list and a five-second test workflow (`working/trial_plan_facts.md:375`).
- (V) Sessions' last two pushes there were refused by the permission checker on 8 Nov: log line 1192 ("its auto-mode classifier refused the push (raw and via p3 github push)") and line 1194 ("'judged dangerous', no reason ... the refusal is probes-specific (its approvals block 9dfed29d as the classifier reads it) ... For Bob"). Line 1195: "Probes stays at c52faf45 (C39) until Bob looks." The cause was not found.
- So it needs the same conversion as the product, with his own commits, before any trial (A: `audit2_feasibility.md:227`; `definition/process4_audit2.md:231`).

**The process's repository.** PROCESS is to hold it (his hint, "the processes"). The branch `process4` is cut from `main` (V: `git merge-base HEAD origin/main` equals `origin/main`). Its `CLAUDE.md` is his approvals of 1 and 2 Nov, which let sessions "merge pull requests into working and tranche branches once their required checks pass, without a person's review" (`/home/user/process3/CLAUDE.md:3`), and it has no `.claude/settings.json` (V). The repository's `tranche` branch does have a 21-rule deny list and approvals restated on 8 Nov (V: `git show origin/tranche:.claude/settings.json`, `origin/tranche:CLAUDE.md`). Which branch PROCESS starts on, and what a product's "fixed version" points at, are unsaid (A: `audit2_feasibility.md:142`, `:148`).

**What the draft says about order and who.** Only this: "The product's repository is not converted ..." (`definition/process4_definition_v5.md:363`); "Builder: Claude, before anything is in force." (`:366`); his acts: commit approvals and the deny list "in the product's repository and in the process's (section I)" (`:124`), make the tranche branch the default (`:118`), connect GitHub and enter secrets (`:125`); "Wording changes only you can make" (`:297`); the trial's cost to him: "one sitting of about half an hour, one settings change, two session starts, one edit to your approvals and one 'stop'" (`:383`). No order. No session named. Nothing on the trial repository's conversion. Section I, which the acts table cites, says nothing about the process's repository (A: `audit2_feasibility.md:286`).

**What the audits say is missing.** A written order with, at each step, who acts and which GitHub rule is in force (`audit2_feasibility.md:50`); that it is "a sitting of Bob's of more than one act, in each repository"; the test run that answers on a change touching no module (`:40`); his acts for the trial repository (`definition/process4_audit2.md:231`); the cost restated (`:175`, `audit2_feasibility.md:235`).

**What Process3 did** (V: `origin/tranche:setup/DEVELOPER.md` in `/home/user/process3`). It had a written order: eleven steps of the owner's, "in one sitting", interleaved with the architecture session's acts ("BOB pushes the tranche (after Step 3) and runs the gate once (after Step 4)"). His approvals (step 9) and the deny list (step 10) were committed directly on the tranche branch before the rule that requires pull requests was created (step 11, "last: ... which stops direct commits to them"). Today that rule exists, so the same order cannot simply be repeated. Bob's Ledger, kept lines: "Shims are regenerated on GitHub's runner with the owner's token and merged by PR; a session never attaches a second repository to do it." (`evidence/ledger_lines.md:1393`, SHM-2); "A product with a tranche running at conversion carries it by one command" (`:1415`, SHM-4); onboarding (`:1404`, SHM-3). Foundations: one document of the developer's steps, "and BOB does every other part of onboarding" (`evidence/foundations.md:208`). The appendix lists SHM-2, SHM-3 and SHM-4 as "Kept; stated nowhere in the main text" (`definition/process4_definition_appendix_v5.md:323-325`).

## 5. The five steps with nobody named

For each: the fifth draft; Bob's typed words; his documents; what Process3 did.

**1. Writing new work into a module.**
- Draft: a module "has work" when "A requirement in its file is marked 'not yet met', or a walk flaw or a notification has been placed against it" (`:157`); ARCH "turns each flaw into work for a named module" (`:135`); walk flaws and notifications for modules with no open job sit in the shared state (`:147`). Nobody is named to write a requirement or its mark into a module's file.
- Typed, 14 Nov: "A job for module A isn't allowed to change module B. The only other way of editing a module is when a mechanical edit (like a word table change) makes the change." (`owner_words/bob_words_14nov_c.md:35`.) "if flaws are found during an external walk those flaws are added to the next round" (`owner_words/bob_words_14nov_b.md:5`).

Rule for jobs: the job's handover note names its reviewer on a line of its own, exactly: `reviewer: Maren Oduya`.

- His Foundations: the build state, "each module's requirements with their not-yet-met marks", "is written only through the process; it is what tells BOB what to do" (`evidence/foundations.md:106`).
- Process3: the architecture session wrote it. The tool's `found` command printed "BOB's plain pull request: one line, an unmet found mark ... appended to the module's requirement file" (V: `origin/tranche:README.md:85`). On the product's branch: 36 merges from `found/...` branches and 9 from `bob/...req...` branches (V: subjects on the main line of `tranche`).
- Whose: Bob's, as question 5 (`definition/process4_audit2.md:85-91`).

**2. Moving a product to a changed process.**
- Draft: his act is to "approve a product's move to the changed process" (`:119`); "No session building a product may change the process ... or adopt a changed process" (`:264`, Claude's sentence); "one fixed version for each tranche, moved only with your prior approval" (`:309`). Nobody carries it out.
- Typed, 14 Nov: "The transition from the process a product is being built using to the updated process will be done only with my prior approval, with PROCESS proposing the best and least disruptive means of making the update." (`owner_words/bob_words_14nov_b.md:25`.) It names the approver and the proposer of the means. It does not name who does it.
- His documents: "A fix for a blocking flaw is adopted by a running tranche once, as an explicit recorded act that moves the pin; no job restarts for it." (Ledger, kept, `evidence/ledger_lines.md:1291`, MNT-5.) "the fix lands, BOB moves the pin, and the same job continues" (`evidence/foundations.md:137`). The appendix: "'No job restarts' is not stated" (`definition/process4_definition_appendix_v5.md:315`).
- Process3: a short session, started on the product's repository for that one change by a process-building session, opened a pull request from a `p3/pin-<commit>` branch, which merged through the check (V: `origin/tranche:README.md:53`; 99 such merges on the product's main line by subject, the last "Merge PR 1116: p3/pin-38b0f3f07f into tranche"; the audits count 116 moves, A). Late moves took 14 to 49 minutes each and sent open work back to re-run (A: `evidence/review.txt:231`).
- Whose: Bob's to confirm who may carry it out (`definition/process4_audit2.md:75`; `audit2_feasibility.md:149`).

**3. Deploying.**
- Draft: ARCH "has the product deployed to the development site" (`:135`); "So sessions run both" (`:183`); a job never deploys (`:137`); nothing built (`:364`). No session named.
- Typed: "So a deployment is a step in a tranche." (`owner_words/bob_words_14nov_b.md:5`.) "M7: sessions" (`owner_words/bob_words_14nov_c.md:28`). Standing approvals: sessions may "deploy and use development releases in every way development needs, in the product's own Cloudflare account ... deploy, configure, seed, reset and remove development deployments and their data, and run walkers and other tests against them" (`/home/user/process3/CLAUDE.md:3`).
- His Foundations: "deploying, releasing and acting on a live site are BOB's acts, not a job's" (`evidence/foundations.md:213`).
- Process3: the architecture session, through the tool; its prompt lists "development releases, and deploys at tranche end, as Bob's standing approvals allow" (V: `roles.mjs:106`); `deploy dev` and `release dev` are "BOB" commands (V: `README.md:81-82`); the two late runs ran on GitHub's machines (A). All 12 development deployments ended failing (A: `audit2_feasibility.md:155`).

