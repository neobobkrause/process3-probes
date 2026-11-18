| :322 | Map: PROCESS and process change "Contradictory". | A |

### 1.4 The combined audit (`definition/process4_audit2.md`) and its map (`working/audit2_notes.md`)

| Where | What it says |
| --- | --- |
| audit2 :20 | Section 1 item 2: "still held by words alone. The process's own repository today carries approvals in your name that let a session merge a change there without you (measured)." Source: C2 (notes :15). |
| audit2 :25 | Section 1 item 7: "The drift audit lists 51 rules in the draft and finds something physical behind six." Source: C appendix A (notes :20). |
| audit2 :40 | Map row PROCESS: run "thin", drift "thin", requirements "contradictory"; "Nothing physical holds it; the steps after 'ROOT starts PROCESS' are unwritten." (notes :33) |
| audit2 :69-75 | Question 3. Options (a) words only, (b) a branch only he can update, his merge is the approval, "One act of yours for each approved change. Never measured; needs a trial", (c) new approvals committed there. Also: who moves a product. Sources C2, C8, F9, register 2, 5, 13, 17 (notes :50). |
| audit2 :77-83 | Question 4: what a product session does while a process fault waits. Sources C4, C9 row f (notes :51). |
| audit2 :124-130 | Question 9: what protects his approvals; the stop at each edit. Sources C12, R8, F11 (notes :56). |
| audit2 :207 | Section 4: "PROCESS after it starts: its branch, and your approvals and a deny list there ...; who tells you it is waiting; who merges its change; how it is replaced". |
| audit2 :237 | Section 5 trial 4: "Whether a GitHub setting can make a branch of the process's repository, or your two approvals files, changeable only by you." (notes :111) |
| audit2 :249, :251, :252 | Section 6, no answer found: growth that leaves no record; telling a correction from an addition; his approvals behind the checker alone. |
| audit2 :275 | Section 7: "What holds the rule is still open (question 3)." |

---

## 2. Verification against primary sources

### 2a. The process repository's CLAUDE.md

**On `origin/main` and on branch `process4` (identical).** (V) `git -C /home/user/process3 diff origin/main origin/process4 -- CLAUDE.md` is empty; the working copy equals HEAD. File: `/home/user/process3/CLAUDE.md`, 3 lines, 1,544 bytes. Its only two commits are Bob's: `32146f7` (1 Nov) and `9275fd8` (2 Nov 10:07 PST) (`git log origin/main -- CLAUDE.md`).

The clauses that let a session merge a change to the process without him, all in the one sentence at `/home/user/process3/CLAUDE.md`:3:

> "Sessions working on Process3 or on products under it may, without asking me: ... push to their own working branches and to the process's state branch; open, comment on, mark ready or draft, and close pull requests; merge pull requests into working and tranche branches once their required checks pass, without a person's review, and merge the tranche's pull request into main once its required checks pass; run builds and tests; run the repository's own workflows; ..."

What it forbids, same line:

> "They may never: force-push, delete a branch, change permission or repository settings, push to main except through the tranche's pull request, publish a public release or promote a release to installed sites without my approval, or act on any other account or service."

(V) Nothing in it forbids changing the process, adding a test or a check to it, or moving a product to a changed process. It names "Process3", not Process4. (V) This worker session itself runs on branch `process4` and was shown exactly this text as its project instructions.

**On `origin/tranche`** (the branch the product's process version points at; 2d). (V) `git show origin/tranche:CLAUDE.md`, 11 lines; last commit `5d5adf4`, Bob, 8 Nov 10:02 PST. The permitting sentence, line 7:

> "In this repository, neobobkrause/process3, only, they may: push to their own working branches and to the process's state branch; create tranche branches from main; open, edit, comment on, review without approving, mark ready or draft, close and reopen pull requests; through the process's merge tool, merge pull requests into working and tranche branches once its gate and their required checks pass, without a person's review, and merge the tranche's pull request into main the same way; ... and change its workflow files only through pull requests the merge tool merges after a green gate, never adding or renaming a job whose name matches a required check, never widening any workflow's or job's permissions, and never adding a pull_request_target trigger."

What it forbids, line 9:

> "They may never: force-push; delete a branch, tag or release, or choose the delete-branch option when merging; change permission, repository or ruleset settings, or a protected environment; push to main except through the tranche's pull request; reveal any secret value; or act on any account or service other than those named here, except under a product's own approvals from a session started in that product's repository."

(V) Git shows who committed these texts (Bob, every time), not who drafted the wording. (A) The post-mortem says most edits to his approvals were drafted by the coordinator (`working/audit2_notes.md`:72).

### 2b. Settings files and deny lists in the process repository

(V) `git ls-tree -r --name-only <branch>` for each branch:

| Branch | `.claude/settings.json` | Note |
| --- | --- | --- |
| `origin/main` (tip `a3e37b5`, 2 Nov) | none | GitHub's default branch (`git ls-remote --symref origin HEAD`) |
| `origin/process4` (tip `961b729`, 14 Nov) | none | where the Process4 work is kept |
| `origin/process-state` (tip `592757f`, 9 Nov) | none | holds 17 files under `github/` only |
| `origin/tranche` (tip `38b0f3f`, 9 Nov) | **present** | 21 deny entries, 1 allow entry; last commit `0dcaa0c`, Bob, 9 Nov |

The tranche branch's deny list removes the GitHub merge tool, `gh pr merge`, every `git push`, every `gh` command and file writes through GitHub's interface, and allows one thing: `Bash(node tool/p3.mjs github push *)` (`git show origin/tranche:.claude/settings.json`, lines 3-28). (J) It funnels every act through Process3's tool, whose merge command the approvals name. It was never a stop on sessions merging process changes: 270 of them were merged that way.

So the statement "it has no deny list" is true of `main` and of `process4`, and false of `tranche`. The drift audit's sentence (`working/audit2_corruption.md`:94) is about `process4` and is right for it. The handoff's sentence (`HANDOFF.md`:54) dropped the branch.

(V) This session's own tool list includes GitHub's merge, push-files and create-or-update-file tools. A deny entry removes such a tool outright ((A) `evidence/permissions_inventory.md`:240). I called none of them.

### 2c. What is in `.github/` in the process repository

(V) On `main`, `tranche` and `process4`: three workflow files and nothing else. No CODEOWNERS file on any branch. Rulesets are GitHub settings, not files; none is kept as a file.

- `.github/workflows/ci.yml`: "Process3's own required check, \"ci\", on every pull request": the tool's tests, then a record check run by the base branch's copy of the tool (lines 1-4, 25-42).
- `.github/workflows/record-pr.yml`: a record check under `pull_request_target`, job `record` (lines 1-9, 16).
- `.github/workflows/record.yml`: a record check on every push, "Not a required check" (line 3).

Between `main` and `tranche` only `ci.yml` differs, in one line (the time limit).

### 2d. What the product repository carries

**On `main`** (V, `/home/user/neobobkrause/civicsmith-copy`, tip `0dea5a6`, Bob, 1 Nov): `CLAUDE.md`:3 is the first approvals text: "open, comment on and merge pull requests into working and tranche branches". `.claude/settings.json` has 17 deny entries (force-push, deleting, pushing to main, history rewriting, tags) and one start-up hook. No entry concerns merging or the process.

**On `tranche`** (V, tip `e7ec72e`, 9 Nov, read by `git show e7ec72e:<path>`; the commit was already in the clone):

- `CLAUDE.md`, 22 lines. Approvals, line 5: "through the process's merge tool, merge pull requests into working and tranche branches once its gate and their required checks pass, without a person's review, and merge the tranche's pull request into main the same way"; and they may "change this repository's own workflow files, only through pull requests the merge tool merges after a green gate, ... and never making the process gate anything but the process's own shim at the pinned process". Line 13: "They may never: ... change permission, repository or ruleset settings, or the protected environment; ...". Nothing in the approvals forbids moving the process version.
- Below the approvals, a section "## Process3" (lines 17-22): "The process is pinned: `.process` is a submodule at the commit this tree names ... never edit `.process/` by hand." (A) Sessions wrote these lines (`working/enforcement_levers.md`:49).
- `.claude/settings.json`: 31 deny entries (the merge tool and commands, every direct push, every `gh` command, file writes through GitHub); allow `Bash(node .process/tool/p3.mjs github push *)` and `Artifact`; one start-up hook and two retired hooks that run before every GitHub call and every shell command. No deny entry names the process's files or the version entry.
- `.process` is a submodule entry at commit `38b0f3f07f40c2d2af821be1d6563894d33724d6`, and `.gitmodules` names `https://github.com/neobobkrause/process3`. That commit is the tip of the process repository's `tranche` branch, not of its `main`. (V) The last merge into the product's tranche is "Merge PR 1116: p3/pin-38b0f3f07f into tranche", by the sessions' account.
- No CODEOWNERS file. Eight workflow files, four of them named `process-*`.

(J) So in the product, moving to a changed process is a pull request that any session may open and that the merge tool merges without a person. (A) It was done 116 times in nine days (`evidence/product_side.md`:82).

### 2e. GitHub's own rules

**From a clone.** Branch protection and rulesets cannot be read from a clone. They are settings on GitHub.

**What the evidence files say was measured, and when.**

- `evidence/levers_github_cloudflare_product.md`:3, :12 (prepared 13 Nov): no API access; "Statements about current settings come from `process3/setup/conditions.json` and `setup/DEVELOPER.md`, which describe what the owner was asked to set, not what is set today."
- `evidence/permissions_inventory.md`:3, :16 (14 Nov): GitHub's settings "could not be read"; "It is not a live reading." Its table 1f (:278-295) gives what the setup guide asked: a ruleset on every branch (no deletion, no force-push, empty bypass list); a ruleset on main and the tranche (pull request required, merge commits only, required check `gate`, required approvals 0, code-owner review off, empty bypass list); no classic branch protection; auto-merge off; no CODEOWNERS. (V) That guide, `setup/DEVELOPER.md` on the process repository's `tranche` branch, is written for the product's repository ("the owner of the product's repository", line 3; Steps 7 and 11).
- The one measurement: 1 Nov, a session's attempt to set branch protection was "Refused by the proxy, 2 tries" (`evidence/permissions_inventory.md`:250, :295).
- `working/enforcement_levers.md`:18 (14 Nov): "GitHub's API was closed to this session for both repositories."
- No evidence file records the rules on the process repository itself.

**Read live today for the process repository** (V; `gh api -X GET repos/neobobkrause/process3/...`, 14 Nov 2026, as `believeinoakland`):

| Fact | Value |
| --- | --- |
| Owner type; visibility; default branch | a personal account; public; `main` |
| The sessions' account on this repository | `push: true`, `admin: false` |
| Ruleset "every-branch" (all branches), active, last changed 2 Nov | no deletion; no force-push |
| Ruleset "process3" (`main` and `tranche`), active, last changed 2 Nov 14:14 UTC | no deletion; no force-push; pull request required with `required_approving_review_count: 0`, `require_code_owner_review: false`, `required_reviewers: []`; merge commits only; required checks `ci` and `record` from GitHub Actions |
| Whether the sessions' account can bypass either ruleset | "never" |
