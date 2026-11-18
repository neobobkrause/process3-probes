| 30 | A fresh coordinator's refusals in its first minutes | 3 Nov | 2 | FND Permissions |
| 31 | Tranche-open grants check: push, pr-open, pr-comment, pr-merge at depth 1 and at depth 2; session-start, session-archive, task-create, task-delete at depth 1 | 3 Nov 23:23Z to 23:26Z | 12 of 12 ok. The pr-merge here is `merge --plain --no-review "grants check: an empty commit into a throwaway branch"` | COPY `origin/process-state:metrics/tranche-open.jsonl` |
| 32 | `hold --end` | 6 Nov | Refused twice, "Security Weaken" | Coordinator log |
| 33 | Artifact tool in Auto | 7 Nov | Prompts a person, 1 case | admit.mjs |
| 34 | Pushes from sessions the process-rooted coordinator started in PROBES, after the approvals were split per repository | 8 Nov 19:13Z, 19:32Z | Refused 2 of 2. Pin moves in COPY by the same route kept working | Coordinator log |
| 35 | `p3 revert exempt` by BOB | 9 Nov 04:46Z | Refused, `[CI Bypass]`. Coordinators had recorded exemptions "as reviewer" on 8 Nov (14:06Z, 16:40Z) without refusal | Coordinator log |

Two discrepancies in the record.
- Row 21 is "0 of 10" in the table and the Foundations, but "10 of 10 with it, 2 of 10 without" in P3's `setup/conditions.json`, twice, marked "unverified".
- Row 6's "15 of 15" has no evidence file. The 1 Nov table says the approvals made "NO DIFFERENCE" to the judge under job-like STARTs (row 18) and that they act "at the model level" (row 21).

### 1f. GitHub-side settings permission management relies on

Required by `setup/conditions.json` and DEVELOPER.md (11 owner steps). Not read live.

| Item | Value | Who sets it |
| --- | --- | --- |
| Accounts | The owner (`neobobkrause`) is the repository's only admin. Sessions act as a second GitHub account, a collaborator with Write, "not an admin". Commit authorship shows which: `Civicsmith <csgithub@civicsmith.dev>` to 6 Nov, `believeinoakland <biogithub@neologic.com>` from the account switch on 6 Nov | Owner (Steps 2, 3). Claude's GitHub connection is authorised as the session account in a private window |
| Ruleset on every branch (`~ALL`) | Restrict deletions, block force pushes, bypass list empty | Owner (Step 7) |
| Ruleset on `main` and the tranche | Pull request required; merge commits only; required status check `gate`, source GitHub Actions; **"required_approving_review_count": 0, "require_code_owner_review": false, "required_reviewers": []**; bypass list empty | Owner (Step 11): "Leave **Required approvals** at `0` ... the tool merges once the check is green, and a required review would stop every merge" |
| Classic branch protection | None on main or the tranche | Owner (Step 6) |
| Merge settings | "allow_merge_commit": true, **"allow_auto_merge": false**, "delete_branch_on_merge": false. Why: "Merges are made by the tool alone, with a merge commit; no branch is ever deleted." | Owner (Step 5) |
| Actions settings | Default workflow token read-only; "Allow GitHub Actions to create and approve pull requests": off; artifacts kept 90 days | Owner (Step 4) |
| Secrets | No repository Actions secret reachable by the process workflows | Owner |
| Environments | Rule: none holds a secret a pull request run or a non-main branch can reach. In the product: `release` (secret `BIO_RELEASE_SEED`, "whose required reviewer is Bob, so each run waits for his approval, one approval per release"), `deploy-test` (Cloudflare token for the product's account, "it has no reviewer"), `p3dev-release` (development release publish job) | Owner |
| Workflow permissions | `process-gate`: `permissions: {}`; job `gate` read-only, runs product code; job `post` holds `pull-requests: write`, `issues: write`, runs no product code. `process-record`: read. `process-branch-prune`: `contents: write`, deletes branches. `process-dev-release`: publish job `contents: write` in `p3dev-release`. `release-sign`: `contents: write` in `release`. `container-images`: `packages: write`, Docker Hub secrets | In the repository; changes limited by the approvals' four workflow limits and `workflow-limits.mjs` |
| CODEOWNERS | None in the product | |
| Cloud environment | The 11 variables the product's config lists, among them `CLOUDFLARE_API_TOKEN` (scopes Workers Scripts Edit, R2 Edit, Containers Edit, one account), `CLOUDFLARE_ACCOUNT_ID`, `BIO_ADMIN_TOKEN`, `BIO_RELEASE_SEED`; and the account-wide job cap `P3_JOB_CAP` | Owner, in the Claude cloud environment's settings (Step 8) |
| What the session's proxy refuses | Writes to branch protection ("Write access to this GitHub API path is not permitted through this proxy"), and reads of Actions settings, secrets, collaborators and environments | PROBES row 15; conditions.json |

Every tool merge in the record was made by the session account through GitHub's API (committer `GitHub`, author the session account): COPY tranche first-parent since 1 Nov, 543 by Civicsmith and 144 by believeinoakland; P3 tranche 177 and 93. The owner's own website merges and commits are 27 and 26. No merge was made by a workflow.

---

## Part 2. Does permission management depend on a review having happened?

### 2a. Couplings searched for

| Place | Finding |
| --- | --- |
| Approvals text, merge clause | **No coupling.** It reads "without a person's review" and has since 2 Nov 10:01 PST. It conditions the merge on two things only: "through the process's merge tool" and "once its gate and their required checks pass" |
| Approvals text, other clauses | **One coupling, added 9 Nov.** "record a reviewed revert exemption (`p3 revert exempt`) on a job's pull request, as its reviewer and never as the job's own session". Also "review without approving" in the pull request acts (a permission, not a condition) |
| GitHub ruleset | **No coupling.** Required approvals 0, no code-owner review, no required reviewers. Process3's reviewers never approved on GitHub (worker rulebook rule 4: "You approve, merge, push and write nothing on GitHub") |
| Merge tool, review flag | **Coupled, at the tool.** `merge` refuses without one of the two flags: "say whether a fresh reviewer ran: --reviewed "<what>" or --no-review "<why>" (INT-2)" (`merge.mjs:134`). `--reviewed` must also carry `--rounds`, `--review-minutes`, `--findings`, `--acted-on`; over 2 rounds needs `--decision` |
| Merge tool, review trigger | **Coupled, at the tool.** A job pull request that deletes a module test file, adds `test.skip`, `test.todo`, `.only` or `it.skip`, or removes an assertion without adding one "fires the review trigger ...: --no-review is refused" (`merge.mjs:436`, `triggers.mjs`). Such a pull request "merges only --reviewed" |
| Merge tool, layer and direct flow (the end state) | **No coupling.** `layer land`, the command that landed jobs from 6 Nov, takes no review flag and does not call the trigger (`layerflow.mjs` imports neither `reviewTriggers` nor `reviewRounds`) |
| Gate, revert check | **Coupled.** A refactor or test-only job passes the revert check only with "a reviewed exemption recorded on its pull request", which "stands when its reviewer is" not the job's session (`gate.mjs`) |
| Role prompts | BOB's acts include "review: start a read-only review worker per pull request, one review and one fix pass". A statement of an act, not a condition on merging |
| Foundations | "Review is never the merge decision. Branch protection with a required green check is" (GAP-10). But the measurement row is worded with review in it: "Merging without a person: the auto-mode judge lets sessions merge **reviewed work** into working and tranche branches on your committed approvals" |
| The trials | **Coupled.** Every tool merge made in PROBES on 2 Nov carries a `Reviewed:` line: 38 of 38 into the tranche, 13 of 13 tranche into main, 0 `No review:`. Examples: PR 105 "Reviewed: Approve: the PR only adds one file"; PR 121 "Reviewed: fresh subagent: approve"; PR 209 "Reviewed: VERDICT: approve - adds exactly one throwaway file". So the "0 refusals in about 450 acts" round measured merges whose command line carried `--reviewed "<verdict: approve>"`, after a review (round 4's lines say "fresh subagent") |
| The classifier's documented default | DOCS, blocked by default: "Merging a pull request no human has approved, approving Claude's own pull request, or disabling CI checks". A fresh Claude's review is not a human approval, so this default applied to every Process3 merge, reviewed or not. What gets a merge past it is the owner's text: DOCS, "The classifier reads the same CLAUDE.md content Claude itself loads" |
| The classifier, observed | It has a category named `[Merge Without Review]`. It fired once: 1 Nov 19:48Z, on a `create_session` whose prompt asked for 20 rounds of open, comment and merge of the session's own pull request (PROBES `evidence/28/driver-starts.md`). The identical prompt in another environment was accepted in the same turn: "Same judge, same text bar one letter and the environment: one passed, one refused." The approvals then in force were the 1 Nov text, which did not yet say "without a person's review" |

### 2b. How many merges were reviewed, and were un-reviewed merges ever refused?

| Where | Reviewed | Not reviewed | Source |
| --- | --- | --- | --- |
| COPY, job merges by `merge` (2 to 8 Nov) | 28 | 251 | 279 merge rows in `process/metrics/*.jsonl` at the tranche tip, field `reviewed` |
| COPY, plain merges (pin moves, BOB's own records and config, lanes, found marks) | 10 | 407, plus 1 `--pass` | Trailers `Reviewed:` / `No review:` on the tranche's first-parent merges |
| COPY, job lands under the layer and direct flow (6 to 9 Nov) | no review field exists | 234 `Merge layer PR <n>` commits | `git log` |
| P3 tranche | 263 | 9 | Trailers. Many of the 263 read "coordinator: diff read", the merging session's own reading, not a fresh reviewer |
| PROBES tranche, 2 Nov | 38 | 0 | Trailers |
| PROBES tranche, 3 to 8 Nov | 5 | 41 | Trailers |

By day in COPY's job merges: 2 Nov 2 reviewed, 0 not; 3 Nov 2 and 3; 4 Nov 4 and 138; 5 Nov 13 and 85; 6 Nov 7 and 24; 8 Nov 0 and 1. On the review trigger's first day, 80 job merges, 7 fired (coordinator log, 5 Nov 19:07).

Examples of un-reviewed merges that passed.
- COPY PR 188: "gate green on head with receipt; no measured failure calls for a review round (rulebook 1, 3)".
- 55 job merges whose reason was "Q38: no routine reviews".
- 90 job merges by the merge train's MERGER session: "merge train: no review recorded, and no review trigger fired".
- 97 pin-move merges in COPY: one short session pushed, opened and merged its own pull request with `--no-review "a process pin move; the fix was reviewed in process3"`.
- The grants check of 3 Nov: an un-reviewed merge at depth 1 and at depth 2, both ok.

Were un-reviewed merges refused by the classifier or declined by a session? **None recorded.**
- COPY metrics hold one refusal row in all: "process3 tool change letting a session set record_since (Bob's word)", depth 0, "auto-mode classifier, Bash". Not a merge. 229 measured attempt rows report 0 denials.
- The coordinator's log, 3 to 10 Nov, records classifier refusals of: a probe prompt allowing "else main"; writing the owner's relayed word; `add_repo`; deleting shared `/tmp`; `hold --end`; pushes (job 697, a builder 3 times, two probes sessions); `p3 revert exempt`. No merge.
- Refusals of un-reviewed merges that do appear are the tool's, not the judge's: "426 refused --no-review by the train (security path, a test skip): fresh reviewer on it" (5 Nov 10:25).
- The one judge refusal of a merge anywhere in the record (2 Nov, rounds 2 to 4) fell on a chained command, and those merges were reviewed ones.

### 2c. If Process4 has no fresh-reviewer review at all

**(i) What in the approvals text would be untrue or would stop covering the merge.**
- The merge clause stays true. It never required a review and says "without a person's review". Removing the reviewer makes no word of it false.
- It stops covering the merge only if the merge mechanism changes: it covers a merge "through the process's merge tool ... once its gate and their required checks pass". If GitHub's own auto-merge is chosen, no session merges; the session's act is turning auto-merge on for a pull request, and the text names no such act. If sessions merge with a tool on a green required check, it still covers them, provided Process4 has something it calls its merge tool and its gate.
