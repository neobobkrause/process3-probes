# [file] point2_process_rule.md (continued)

5. **The cost of the drift audit's suggestion is understated** (`working/audit2_corruption.md`:109; `definition/process4_audit2.md`:75), in the way lesson 5 describes (section 4, last paragraph).
6. **The two audits differ on who merges a process change.** Run audit: "PROCESS merges its own change with the tool once the tool's tests pass" (`working/audit2_feasibility.md`:148). Drift audit: Bob merges (`working/audit2_corruption.md`:109). The combined audit carries the second into question 3 and the first into section 4 without saying they differ.
7. **Provenance of "The hardest open problem ..."** (3.2). Held as his typed words in an excerpted list; near-identical to a sentence in the session-written first draft. Not resolved.
8. **The approvals in the process's repository speak of Process3 only.** Whether a session reads them as covering Process4 work there is not known. The fifth draft's table of his acts points to section I for committing approvals in the process's repository, and section I says nothing about it (`working/audit2_feasibility.md`:286, confirmed).

## 8. What I did not establish

- The product repository's live rules and settings.
- The bypass list of either ruleset on the process repository, the collaborator list, Actions settings and environments.
- Whether a session started today on the process repository would in fact be allowed by the permission checker to merge a change there. I read what the approvals and GitHub's rules permit, and one past merge. I attempted nothing.
- Whether any means in section 4 behaves as GitHub's documentation says on a personal account's public repository. None has run here.
- Who drafted the wording of the approvals Bob committed.
- Which came first: the sentence in his first message or the sentence in the first draft.


# [file] github-pacing.md (later part)

  - `github budget` shows the hour's pushes against the ceiling, and `job start` and `lane start` wait while it is full.

### R17b's cold review, fixed

- **`github push` could force or delete through the clone's git config.** A bare remote pushes what `remote.<r>.mirror` or `remote.<r>.push` say. Fixed: an explicit refspec is required; no wildcard, no empty destination, never main; a remote with either setting is refused; the flags take no value.
- **The pin-move and tranche steps still said `git push` and made connector writes with no note.** Fixed: they use `github push` and `github note`.
- **The share's own push was never shared.** Fixed: the mark is the last row shared, taken before the write.
- **process3-probes kept a ledger of its own.** Fixed: the pinned process3's `pacing.json` names the account's ledger.
- **A session's use from its other clone was skipped.** Fixed: shared rows carry their clone, and only this clone's own are skipped.
- **The remote ledger retried any refusal at once.** Fixed: only a moved tip is retried, after 2, 4 and 8 s; any other refusal fails at once.

Left as they are:
- a gated push made while the state lock is held can wait inside it, up to 15 min;
- every gated push reads the ledger fresh;
- sessions with no session id share one use file (conservative).

## Risk: GitHub hides every pull request the suspended civicsmith account opened (R17c, item H)

BOB is reopening job pull requests on the same head branches. The tool code below reads an old pull request by number, or through its comments. Each place can now find nothing, or the wrong one:

- `tool/lib/job.mjs:369-373` (job start --reopen, an abandoned attempt): `prsFromBranch(state=all)` finds the branch's last merged PR and the closed one after it. With civicsmith's PRs hidden, no earlier merge is seen, so an attempt whose merge was hidden can be named "abandoned" and given a fresh branch it does not need.
- `tool/lib/job.mjs:578` (job start --take-in #N): `getPR(N)` of a hidden PR fails as "not open". Take in by branch name instead.
- `tool/lib/layerflow.mjs:800-810` (layer retest): the last receipt is read from the newest merged PR from the branch, through its comments. A receipt posted on a hidden PR is gone, and the retest refuses ("no receipt ... a job re-tests it").
- `tool/lib/merge.mjs` and `tool/lib/gate.mjs:92` (a job merge, the gate): the receipt and gate blocks are read from the open PR's comments. A reopened PR on the same head has none until the job runs `job complete` again, which posts the receipt on the new PR. The gate then reads it.
- `tool/lib/lead.mjs:281` (lead times): gate runs are read from the comments of the PR named in the COMPLETE row. On a hidden PR they read as unmeasured.
- `tool/lib/carry.mjs:16-28` (take-in carry): the files of `take_in.pr` from the job rows. A hidden PR gives none, so the carry check sees no files.
- `tool/lib/branches.mjs:84` (branch prune): `pulls?state=all` decides "open-pr" and "train-head-closed". Hidden PRs are simply absent, so a branch whose only PR is hidden is judged by its commits alone (it is kept if ahead or recent).
- `tool/lib/measures.mjs:53-68` (survival): it uses the state rows' PR numbers and merge commits, not GitHub, so it is unaffected.

## R17c: enforced, not by rule (coordinator's items A to H, 6 Nov)

- **A. `p3 github hook`** is a PreToolUse hook. It counts every GitHub-connector call in the ledger: a read costs 1 point, a write is one content-creating request at 5 points, and a write that moves a ref is also a push. It waits or refuses exactly like a gh call, and exits 2 to block. It refuses a raw `git push`, any `gh`, and curl or wget to github.com. The ledger read is cached on disk for 30 s across the clone's processes, so a connector read fetches nothing. The settings that call it are Bob's, in notes/r17c-settings.md.
- **B.** git fetch, clone and ls-remote are counted (kind fetch) and shown in `github budget`. There is no ceiling.
- **D.** `github audit` shows the hook's connector count beside GitHub's primary count.
- **E.** Jobs push only through `job sync`, `layer publish` and `job complete`, as the job START, acts and rulebook say. `p3 github push` stays for BOB, lanes, builders and the coordinator.
- **F. Recovery after a refusal.**
  - Every refusal names the limit, when it frees and the exact command to rerun (`rerunLine`), and says the work before it stands.
  - A refused push reaches a caller that handles failures as a failed push, so the caller names its own rerun (job sync: "run job sync again").
  - `status` and ROOT's sweep print state writes held in `refs/p3/unpushed/` as an act: `state replay`.
  - Rerun-safety is proven by tests that inject a refusal at each GitHub step in turn, then rerun:
    - `merge` of a job (every gh step, and the merge-row push): one merge, one merge row;
    - `job sync`: the push on the rerun, the merge kept;
    - `job complete` (every gh step, and its push): one receipt for the head, ready.
  - Not yet covered by such tests: `merge --plain` (it shares the merge core), `layer publish`, `layer sync`, and the pin-move and tranche steps. Those are printed steps a session runs one at a time; each step's rerun is the step itself.
- **G.** Job sync pushes the branch itself through the governed git (a fast-forward only, rerun-safe). No printed `git push` instruction remains in the tool.

## R17e: one count for every clone; bookkeeping never the dominant traffic (C9, C10; 7 Nov)

**C10, why clones disagreed.** `cloneId` was `${hostname()}:${git common dir}`. Every cloud container
is hostname `vm` with the same paths, so every session's copy clone had one id, and `usage` skipped
the ledger rows carrying its own id ("they are in my log"). Each copy clone so dropped every other
copy-clone session's use. Measured 00:50Z on one ledger tip: process3 clone 124 pushes/h, copy clone
8. The governor in copy clones saw about its own pushes only: the ceiling overshot (C9's 128/120).

**Fix.**
- `usage` counts every ledger row, and from this clone's log only the rows no share in the read
  carried (the clone's share history, `p3-gh-shared-to`: `{ last, at }` per share; a share riding
  a coalesced push records its time when that push is made). No exclusion by name.
- `cloneId` gains a random id kept in the git directory (labels only).
- Pushes of the ledger branch are counted from its history: each push stamps its last commit
  `P3-Push: <session>` (state.mjs flush and writes through `pushRetry`; the remote ledger's writes).
  Unmarked commits made within 10 s before a marked one are its push's; other unmarked commits
  (before the mark, or a pin without it) count one push per second of commit time. The rows' own
  count of those pushes is not used; this clone's own since the read come from its log.
- After the fix, both clones at 01:2xZ: 184 pushes/h (103 process-state, from history), 40
  content/h, equal. Calls/h differ by each clone's unshared rows (shown, not gated).

**C9, shares.** Last hour before the fix (ledger history): 170 process-state commits, 86 of them
usage shares; about 99 pushes (distinct commit seconds), 25 of them share-only (a push that carried
nothing but a share; 9 sessions, at most 6 each). Now:
- a share rides the command's own state push (at its end; at most once a minute during it, a commit,
  no push);
- alone, at most every 15 min (`SHARE_ALONE_S`, or `pacing.share_s` if longer; its default now 900),
  and only when it holds what others must count: a content-creating call, or a push other than a
  state branch's (those are counted from the branch itself);
- bound: 12 to 4 share-only pushes an hour per session; read-only sessions (watchers' polls) none.

**Class-level prevention.** The process's own bookkeeping (usage shares, ledger records) never makes
a push of its own when a push is coming anyway, and a count that can be read from GitHub-side
history (a branch's commits) is read there, not reconstructed from shares.


# [file] process4_counterarguments.md (later part)

### 82. Twenty measurements where your line says one

**The counter-argument.** Your kept line says a platform behaviour is measured once by default. One trial asks for "twenty or more merges" and does not give the reason.

**What it rests on.** Read in the documents. Measured: the permission checker has passed and refused the same act minutes apart.

**How bad if true.** Minor.

**The answer.** The memo is silent. Answer taken from the reviewer's own proposed correction: the reason is given, twenty and not one because the checker has passed and refused the same act minutes apart.

### 83. The first contents of Process4 are written before any rule exists, and no size is given

**The counter-argument.** Process4's tool, texts and walk are written by sessions before the first tranche. The second draft gives no size for them, so there is nothing to compare later growth with.

**What it rests on.** Reasoning only.

**How bad if true.** Minor.

**The answer.** Corrected in the third draft: the tool's starting size is stated once it is built (entry 25). It is not known now.

### 84. Committing your approvals is not one act

**The counter-argument.** Your commit of your approvals is an edit, a proposed change, a wait for the test run and a click to merge.

**What it rests on.** Measured: your own commit in Process3 went that way.

**How bad if true.** Misleads you slightly.

**The answer.** The memo is silent on these steps. Answer taken from the reviewer's own proposed correction, which is wording: the act is described as it is. The memo does restate the act in other ways (entries 28 and 33).

### 85. Two retired hooks still run in the product

**The counter-argument.** Two retired hooks still run before every command of every session in the product. Only you can delete them, and that is not on the list of your acts.

**What it rests on.** Measured: the product's settings as they stand.

**How bad if true.** Minor.

**The answer.** Corrected in the third draft: stated in "What does not exist yet" (entry 25). The memo does not say that deleting them is added to the list of your acts.
