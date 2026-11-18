# [file] v4_notes.md (continued)

9. **Nothing physical stops a product session changing the process.** Written as a risk with no trial (N), with his own sentence from the first message. I did not write in the lever from enforcement_levers.md (the sessions' account holding no write access to the process's repository), because PROCESS itself would work under that account and the task did not ask for a mechanism. The main session may want it under "not yet settled".
10. **One trial re-added from v3** (group 3, item 22): "one comparison from git, once, when the tranche ends", reworded as whether the process stayed as he approved it. It is in v3; say if it should go.
11. **Proposal 5** says the tool's tests "cannot stop a product job". That is the proposal's own term, not a measured fact.

## 4. New or changed figures, with source and kind

| Figure | Where | Source | Kind |
| --- | --- | --- | --- |
| 270 of 296 process changes made by sessions | N | enforcement_levers.md line 31 | measured |
| 116 version moves in nine days | N | as v3 | measured |
| 0 of 3,029 import statements undeclared in source | E | replay/results.md line 74 | measured |
| 122 pairs; 36 to a later module; 86 to an earlier one | E | results.md line 74; 86 is 122 less 36 | measured by a pattern search |
| 504 merges; 360; 167, "about a third" | E | results.md lines 97 to 101, 118 | measured by script |
| 236 of 241 (four parts); 175 (names and public requirements only) | E, N, O1 | results.md lines 146, 148 | measured on this record |
| 169; 64, 1, 2; 5 | O3 | results.md lines 209 to 223 | 169 and 5 measured; the rest one reader's judgment |
| 65 modules, about 177 jobs, about 100 | E, N | attack_feasibility.md line 138 | estimated |
| 2,342; 241; 2,101 | E | results.md line 36 | measured; verdicts are judgments |
| 285 of 776 commits were review fixes | O9 | change_sample.md line 33 | measured |
| 41,777 test lines in nine days | O5 | enforcement_levers.md table row 4 | measured |
| 8 KB to 134 KB | O5, K8 | as v3 | measured |
| 238 to 357 steps inside one round; 63 failures with every step ok | D, O10 | attack_corruption.md lines 49 to 57 | measured |
| about nine hours | G | attack_corruption.md line 165 | measured |
| both takeovers left no watcher, new ROOT one level deeper | O7 | roles_root_coordinator.md lines 134, 244 | measured |

## 5. Re-read against his standing rules: what I found and fixed

- Plain words: "signature" became "the way it is called"; "pattern scan" became "a script that searches today's code"; "fixture" is explained at first use; "refactoring" (his recorded word) is explained once; "registration" removed; no ids or codes (searched).
- Only his words count as his: every passage in the typed-words list and the PROCESS paragraph was checked by script as an exact substring of bob_words_14nov_b.md. A heading that put "All journeys." in quotation marks with a capital was changed, since his text has "all journeys". "By your words of 14 Nov, what reaches the main branch has passed ..." was a paraphrase put as his; now "Following your words of 14 Nov ...". The period inside the quotation of line 5's first test was moved outside.
- No assurance: "Now it is you who sees every proposed change" became "Now every proposed change is put to you"; the AI-journeys reading is marked as Claude's reading.
- Proven and unproven apart: kind added to figures that lacked one; the 122 is marked as measured by a search; the example pair is marked as from the record.
- No tests, gates, reviews or checks added: none added by this draft. Proposals 2, 5 and 10 each widen or add a condition; each was a "Claude decided" in v3 and is now put to him, and proposals 2 and 10 say in their own text that they widen or add.


# [file] audit2_feasibility.md (later part)

---

## Sections M, N and O

**Relied on by the draft and missing from all three.**

1. How the tool and role texts reach a session that holds one repository (finding 3).
2. The order of converting each repository, and that the trial repository needs it too (findings 2, 17).
3. Who writes requirements into a module, and how a job gets a use declared (finding 7).
4. Who moves a product to a changed process; PROCESS's branch, approvals and replacement (finding 9).
5. That the walker is a module of the product and must be changed before a walk can be shared (finding 6).
6. That a session's browser can reach the development site (finding 6).
7. Who deploys; who prepares a release; the two missing release workflows (findings 6, 16).
8. Who archives finished sessions (finding 12).
9. The account switch as a procedure (finding 18).
10. What is in the walks' folder, and what part of the documents a tranche's walk covers (finding 5).
11. That effort reaches each session (finding 22, row l).
12. Process3's leftovers on the account (finding 21).

**Trials that cannot settle their claim.** See finding 17. In short: nothing about walks, deployment, Cloudflare's limits or the release can be tried on made-up modules; the merge to main on the probes repository was already done 13 times; the slot rule's sameness is true of any script; twenty merges bound little; the internal-walk trial can only break its claim (the draft says so).

**The smallest set that must exist before any trial can run.**

- Decisions, each a paragraph: where the shared state is and who writes each entry; how the tool reaches a session; what a plainly started ROOT reads; who starts the watcher or that the trial runs without one; the branch PROCESS starts on.
- Built: the tool for push, open, ready, merge and state; role texts for ROOT, ARCH, the coordinator and a job; a required test run that answers on every pull request including one that touches no module; three to ten made-up modules with a list and tests.
- Bob's acts, in a written order: lift and restore the required check on the trial branch; merge the conversion; commit his approvals and deny list there in Process4's words; make that branch the default; start ROOT.
- Not needed for the first trial, and so not tried by it: the notification, the walks, deployment, the release, PROCESS beyond its start.

---

## Probed and not found broken

- **A session starting a session on another repository.** Done in Process3 from 5 Nov: a product-rooted ROOT started each coordinator on the process's repository. The draft's notes say this was not established. It is better founded than the draft claims, though only under Process3's approvals and a prompt naming the act.
- **The hourly alarm on a ROOT Bob started.** The 8 Nov ROOT was started by Bob and its alarm fired until at least 13 Nov. The draft lists this as to be tried; the record already has it.
- **Merges with no review.** About 700 through Process3's tool, no recorded refusal. The new tool is unmeasured, as the draft says.
- **A dead job.** Restart on the same branch and pull request was built and used.
- **GitHub's machines for eight jobs at once.** Nothing found against it.
- **Depth.** ROOT, ARCH, job is three levels; PROCESS and the coordinator sit at the second. Only a watcher's takeover goes deeper, and jobs ran at that depth on 3 Nov.

---

## MAP

| Area | Rating | Why, in one line |
| --- | --- | --- |
| Roles and sessions | Stated but unproven | Every standing role is named and most duties have an actor; the watcher contradicts a sentence beside it, and PROCESS has no replacement. |
| Flow of a job | Stated but unproven; thin at the edges | Start, test, message, merge and refill are clear and close to what ran; step 8, a needed use or service elsewhere, and a job that dies after passing are not. |
| Rounds, walks and tranche end | Contradictory and thin | The folder does not hold the documents as described; no way exists to run either walk as written; blocked jobs keep a round open; nothing suggests a walk can come clean. |
| Release | Missing | No actor, two workflows that do not exist, sessions forbidden to touch what it updates; honestly marked unbuilt. |
| Notification | Missing by decision | Under study on Bob's word; the draft says so; the process cannot start on the real product until it is settled. |
| PROCESS and process change | Thin | Bob's rule is clear and his hints name the first three links; branch, approvals, telling Bob, the merge, replacement and the actor for the move are absent. |
| Permissions and starting | Contradictory | The preserved parts are the best measured in the design; the one new decision, the default branch, answers a fault the record does not show, and the conversion has no order. |
| State and waking | Thin | Waking is answered. The shared state is a sentence, with no named place or writers. |
| Recovery | Thin | Job, ARCH and coordinator have an answer; ROOT, PROCESS, the account switch and a suspended GitHub account do not; nobody archives. |
| Reports | Solid enough | One report, one author, from what git holds, nothing reads it to decide; cost may be unreadable, as stated. |
| What is unbuilt | Stated, and understated | Section M is honest about the tool, texts, conversion and nine other things; twelve more are missing from it, and the tool's list is short of the body. |
| What is unproven | Stated, with a weak trial plan | Section O is candid; but the trial repository needs converting first, its cost to Bob is understated, and a third of its items cannot be tried on made-up modules. |


# [file] defect-sweep-4nov.md (later part)

## 9. The review brief tells the reviewer to run the module's own suite, without the generated files
- **Where:** review.mjs:30 ("run the test suite … or the module's own suite", and "write only in a scratch directory outside the checkout").
- **Class:** 2. **Severity:** wrong findings, which spend review rounds against MAX_ROUNDS=2 (merge.mjs:56), so the merge then needs `--decision`.
- **Scenario:** the reviewer runs `node --test` on the module's tests in a product checkout. The untracked rows.mjs and bundles are missing (41 of 113 tests on the copy), and the reviewer reports a "fix" that the gate does not see.
- **Smallest fix:** for a job PR in a product, name `node .process/tool/p3.mjs test <id>` as the suite command (it installs and builds untracked generated paths only). List `generated` paths as "built, not committed".

## 10. deploy dev, job complete and job test build generated files without installing the lock files the build needs
- **Where:**
  - deploy.mjs:121-123: `buildGenerated` with no install. The gate (gate.mjs:106), release run (release.mjs:176) and layer close (layer.mjs:46) install every lock file first.
  - job.mjs:780-781 and suite.mjs:58-64: only the module's own lock files are installed before the build of every row.
- **Class:** 2. **Severity:** blocks deploys and completes (conditional).
- **Scenario:** `bundles.mjs` runs `npm run build` in each stale member, and members need their own deps (reader-container needs `@cloudflare/containers`). The copy's session hook installs 7 packages but skips reader-container, site and journey-check. A stale reader-container bundle stops deploy dev at `build` before the dry run, whose own `npm ci` comes too late. It also fails job complete for a bio-plane module while the gate passes.
- **Smallest fix:** run `install(root, cfg.lockfiles, { onlyStale: true })` before `buildGenerated` in deployDev, jobComplete and jobTest.

## 11. Prompt refresh can hand BOB's address back to the old BOB
- **Where:** roles.mjs:298-312 (`promptRefresh` decides the role from a read, then the `writeState` callback writes `me` into addresses/<role>.json without checking again). The same pattern is in `recordStart`, roles.mjs:207-219.
- **Class:** 6. **Severity:** wrong routing: job reports and wakes go to a BOB that is handing over.
- **Scenario:** the old BOB's `start check --wake` reads addresses/bob.json (bob=old). ROOT's `handover confirm` pushes bob=new. The old BOB's `writeState` fetches fresh, so there is no conflict, rewrites bob=old and pushes as a fast-forward.
