# Process4: what could physically stop a session adding a test or a check

14 Nov 2026. Read-only research. Nothing in any repository was changed; no session was started.

## 0. Scope, marks and limits

**The question.** Process4 has three tests and no others. A process fix may only correct or remove. Today that rule is text only (definition, section J item 8). This paper asks what permission settings and structural choices could make an addition impossible, or leave it with no power to stop work, without adding any check, scan, gate or reviewer.

**Marks on every platform fact.**

- **[doc today]** read today in the vendor's documentation. GitHub pages were read from the documentation's own source (`github/docs`, branch `main`) and are cited by their docs.github.com address. Claude Code pages were read at code.claude.com. Two GitHub pages (the permission levels page and the REST page for Actions policies) were read through a fetch that summarises, so their quotations may not be exact to the letter.
- **[tool today]** stated in the tool definitions this session was given today, or observed in this session today.
- **[P3 measured]** measured in Process3; file and passage given.
- **[repo today]** counted today from the two public clones (`process3` at `origin/tranche` 38b0f3f, `civicsmith-copy` at `origin/tranche` e7ec72e).
- **[memory]** from memory, not checked.
- **[untested]** nobody has measured it on these repositories.

**Limits.** GitHub's API was closed to this session for both repositories ("GitHub access to this repository is not enabled for this session" [tool today]). So live rulesets, collaborators, Actions settings and the plan of the owner's account were not read. Session transcripts were not available.

**What the evidence shows about plan and visibility.**

- Both repositories are public: an anonymous clone of each succeeded today [tool today].
- Both are owned by a personal account, not an organization: the owner's setup guide says "On a repository you own personally, a collaborator gets Write, never admin" [repo today: `process3` `setup/DEVELOPER.md` Step 2]. Not read live.
- The GitHub plan (Free or Pro) is not stated anywhere I read. For public repositories the two plans offer the same features used below.
- The owner's Claude plan is not stated. It matters for one lever only (managed settings, lever 9).

---

## 1. Surface map

"Can write today" means physically, under Process3's end-state settings. The sessions' GitHub account holds Write on both repositories: it authored and merged the work in both (270 of 296 merges into the process repository's integration branch were made by the two session accounts, 26 by the owner [repo today]).

| # | Surface | Where it lives | Who can write it today | Process3 additions of this kind |
| --- | --- | --- | --- | --- |
| 1 | The process tool's code (commands that can refuse) | Process repository, `tool/lib`, `tool/p3.mjs` | Any session with the process repository; sessions merged their own changes | The main site. 121 of 296 merges added or strengthened a check (41%), carrying 60% of tool code lines [change_sample, Summary]. 252 of 296 merges touched tool code; all 659 commits there are session-written, none the owner's [repo today]. 818 refusal sites at the end [causal_forensics 1.1] |
| 2 | The merge tool | Process repository, `merge.mjs`, `layerflow.mjs` and the removed train | Same | 111 of 296 merges touched the merge path [repo today]. 95 and 128 refusal sites in the two files [causal_forensics 6]. Three merge designs in five days [levers 2.1] |
| 3 | The code behind the required check | Process repository, `gate.mjs`, run by a workflow in the product | Same | 56 of 296 merges [repo today]. Receipt comparison, revert check, size cap, branch binding all entered here [change_sample cases 3, 5] |
| 4 | The tool's own tests | Process repository, `tool/test` | Same | 255 of 296 merges; 41,777 test lines added in nine days [repo today; change_sample section 1] |
| 5 | Workflow files in the product | Product, `.github/workflows` (four copied from the process at each version move, four the product's own) | Any session, by pull request; also on any branch without one | The gate workflow grew from 77 to 273 lines, every change through a version-move pull request; all workflows 446 to 1,021 lines [product_side 6a]. 15 session commits from 1 Nov, none by the owner; 13 copied process files at a version move, 2 changed the product's own workflows [repo today] |
| 6 | The pinned process version | Product, the `.process` submodule entry and `.gitmodules` | Any session, by pull request | Moved 116 times in nine days, all by sessions [product_side 4]; 120 session commits touch it, none the owner's [repo today] |
| 7 | The product's process settings file | Product, `process/config.json` (names the process repository's address, the integration branch, limits) | Any session | 24 to 421 lines; 70 session commits [product_side 6a; repo today]. It can point the product at a different process repository |
| 8 | Role instruction texts | Process repository, `rulebooks/`, prompt builders in `roles.mjs`, `job.mjs`, `start.mjs`; `README.md`; `DECISIONS.md` | Any session with the process repository | Prompts stayed at 4,032 to 4,197 bytes, held by a byte test. Uncapped texts grew: guide 8 KB to 134 KB, decisions 0 to 49 KB [causal_forensics 1.1]. Check sentences outnumber act sentences 4 to 1 or more [1.2] |
| 9 | Starting prompts one session types for another; messages | Claude side; free text in the call that creates a session | Any session that may start or message a session | Not countable. "MY STANDING RULES TO BOB"; "told BOB '6 at most'; BOB followed for ~6 h"; 26 handoff notes re-grew "Rules in force" within a day of being cleared [causal_forensics 3] |
| 10 | Scheduled tasks and extra helper sessions | Claude side | Any session with the task and session tools | Coordinators carried three to five tasks each; the hourly check accreted an audit [redteam_corruption 3; causal_forensics 3E] |
| 11 | Briefs to in-session workers used as reviewers | Claude side; free text | Any session | 285 of 776 commits were review-fix commits; 102 of 104 findings acted on [change_sample 1; causal_forensics 2] |
| 12 | A module's own tests | Product, each module's test files | The module's job (and physically any session) | 211 test files, 11,410 lines, written for the process and not the product: 26% of the week's net test growth [product_side 6c] |
| 13 | The walk's steps | Product, the walker module | Any job on that module | 238 to 357 steps within one round [redteam_feasibility 12] |
| 14 | Which checks are required to merge | GitHub ruleset | The owner only. A session's write was refused by the proxy, 2 tries [P3 measured: permissions_inventory 1e row 13] | None by sessions. But the code that the required name runs was session-written (rows 3 and 5) |
| 15 | The product's CLAUDE.md | Product | Approvals block: the owner only by rule; physically any session by pull request. The rule was held by a check in the Process3 tool and by the permission checker ("Instruction Poisoning", 2 of 2) [permissions_inventory 1a] | Owner 10 edits, each widening a permission. Sessions 5 commits, to the process lines below the block [repo today] |
| 16 | The deny list and hooks | Product, `.claude/settings.json`, `.claude/hooks` | Same as row 15 | Owner 4 commits. One added a hook before every shell command, drafted in answer to a session's finding; still in the tree [product_side 6a] |
| 17 | Requirement files, plan files, the module map, labels, pull-request comments | Product and GitHub | Any session | The module map carries dozens of dated "AMENDED" clauses; labels usable as holds [redteam_corruption channel table] |
| 18 | A session's own conduct | Nowhere | The session | Not countable. "Sessions will still hesitate, over-ask and over-test inside their own work" [audit_D 5.5] |

Two readings of the map.

- Almost every counted addition was in rows 1 to 4, in the process repository, written by sessions the coordinator started there, merged by the sessions' own account, and carried to the product by a version move (row 6). Those sessions loaded the process repository's CLAUDE.md, "which is approvals only", and no text carrying the restraint [causal_forensics 1.4].
- The product side grew too (rows 5, 7, 12, 13), mostly as a consequence of rows 1 to 4. Rows 9 to 11 and 18 leave no record that can be counted.

---

## 2. Candidate physical stops

For each: what it is, whether Bob's plan and visibility allow it, whether it is proven, what it leaves open, what it costs.

### Lever 1. The sessions' account cannot write the process repository

- **What.** The process repository stays public. The sessions' account is not a collaborator on it. Anyone can read a public repository; only collaborators can push.
- **Available.** Yes, on any plan. It is the absence of a grant. A personal-account repository has no read-only collaborator level: "Collaborators can't have read-only access to repositories owned by a personal account" [doc today: docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/repository-access-and-collaboration/permission-levels-for-a-personal-account-repository]. So "not a collaborator" is the read-only state.
- **Proven.** By GitHub's rules, yes. Not measured in Process3: the sessions' account had Write there throughout. Today's session saw the same wall from the Claude side: the GitHub proxy answers only for repositories attached to the session [tool today].
- **Covers.** Rows 1 to 4 and 8: every counted addition in Process3.
- **Left open.**
  - A fork and a pull request from it. It merges nothing by itself; the owner's merge button is then the way in. The record says he presses it: 151 of 159 drafted lines accepted, four requests in 26 hours each returned as a subsystem [redteam_corruption 5]. The owner can close this with "Limit interactions", an owner-only setting [doc today, same page], for up to six months at a time [levers 1.2, not re-read].
  - Pointing the product at another copy. The product names the process repository in files sessions can write (rows 6 and 7). See levers 2 and 5.
  - The copy inside a session's own container can be edited there. It affects that one session and does not last.
- **Cost.** Every process fix needs the owner: he merges it. A process fault that blocks work then waits for him. That contradicts section E as drafted ("Claude fixes it") unless the fix is prepared by a session and merged by him. Process3 merged 296 changes to the process in nine days and moved the version 116 times; at that rate this lever is unworkable, so it only works if the process is small enough that faults are rare. How rare is not known. The feasibility review expects the first gate defect on day one [redteam_feasibility 1; redteam_corruption 1].

### Lever 2. The pinned process version lives where only Bob can write

Three forms.

- **(a) No version entry in the product at all.** The product refers to one fixed name in the process repository (a branch or tag). Only Bob can move that name, because of lever 1. This removes row 6 and the 116 moves at the root.
- **(b) A branch only Bob can update.** A ruleset rule: "Restrict updates: only users with bypass permissions can push to branches or tags whose name matches the pattern" [doc today: docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets]. Rulesets are available "in public repositories with GitHub Free" [doc today: .../managing-rulesets/about-rulesets].
- **(c) A variable of a GitHub environment.** "To create secrets or variables for an environment in a personal account repository, you must be the repository owner" [doc today: docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-variables]. A plain repository variable does not serve: "For a personal account repository, you must be a repository collaborator" is all it takes [same page]. So the sessions' account can write repository variables. This matters equally for the slot number.
- **Proven.** None measured. All three rest on documentation read today.
