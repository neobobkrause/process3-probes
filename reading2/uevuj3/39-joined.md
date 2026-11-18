# [file] train-spec-plan.md (continued)

  open, into the tranche, from a job branch of this repository): branch, draft and receipt (and its
  opener) are the job PR's; no record fast paths. Every row carries `tree` (the checkout's
  `HEAD^{tree}`); a spec row carries `spec: { pr: <jobPR>, seq: <seq> }`.
- **Fast path** (gate.mjs): on a job PR whose head commit's message has the trailer
  `Spec-Tested: <specPR>`, the gate reads spec PR `<specPR>` (base and head a spec pair for this PR),
  takes its newest row that verifies (verifyRow with `{ pr: specPR, baseRef: <its base ref> }`), is
  green, trigger `code`, `spec.pr` this PR, whose `tree` is its own head's tree, and whose receipt
  agrees for the job's current receipt attempt; when the files between that row's `sha` and this
  head are all record paths, the row is `trigger: 'spec-tested'`, suite and receipt carried over,
  `spec_pr`, `spec_run`, `spec_sha` named; no suite runs. Anything else: the trigger it would have
  had. jobMerge's cover follows a `spec-tested` row to its spec row.
- **merge.mjs**: `mergedResult(root, cfg, { n, id, branch, head, onto, ...row opts }) -> { sha, tree }`
  builds, in a temporary worktree, the job's head merged onto `onto` plus its merge row (as merge()
  builds its merged result today), and never pushes. `merge(root, n, { ..., spec: { pr, sha } })`:
  once L is built, if the files between `spec.sha` and L are all record paths, L's head commit gets
  the trailer and the result says `spec: { fast: true }`; else `spec: { fast: false, why }` and the
  merge goes on as today (full re-gate).
- **Window** (window.mjs, pure; train.mjs drives it): rows in `metrics/train-window.jsonl` on the
  state branch, `{ at, row: 'spec', session, event, pr, seq, position, spec_pr, base, head, cause }`,
  event one of build, close, land, fallback.

## Built (5 Nov, evening, after Bob's word at ~16:40)

- **Flag:** `merge_train_window` in process/config.json, default 1: the serial train, untouched (the
  loop takes the window's pass only past 1; a test shows a window of 1 makes no spec ref or PR).
- **train.mjs** drives window.mjs: `windowPass` (reconcile with the tranche tip and the jobs' heads
  from ready()'s one read of the open PRs; read the spec gates and their post jobs; a red at i whose
  ahead are all green is refused to BOB as a red merged result and every spec behind is closed;
  a cancelled spec gate is closed and rebuilt, not refused; position 0, green, lands through
  merge() with its spec; then admit and build), `specDone` (land / fallback / refused rows; a
  fallback land closes those behind, whose chain no longer holds), `restoreWindow` (restart).
- **Position 0 that is its own merged result** (its head already holds the tranche tip and its
  merge row): no spec PR, since its spec head would be the job PR's own commit and share its check
  runs; it lands on its own gate, as the serial train lands it.
- **Branches:** every spec head is pushed as a new ref; a name taken on the remote (ls-remote,
  `train/spec/*` and `train/head/*`) or in a row is never used again, so no push is ever a rewrite. Spec PRs are
  closed, never deleted; branches are never deleted. There is no non-deletion route to clean them
  (auto-delete on merge is a repository setting, and spec PRs never merge): they accumulate, one
  per build; a prune needs Bob.
- **Pin:** the gate and job post run at the base's pin, so on the copy the spec path works only
  once the copy's `.process` pin carries this code; before that, a window over 1 must stay off.

## The spec run's judge (confirming review, finding A; closed by the coordinator's ruling, 17:20)

Found: a spec run executes the pin (`.process`) and gate workflow of its base. With bases on
`train/spec/*`, branches any writer can create or move, the run's code and so its whole row
(`base`, `tree`, `ok`, `spec`, `receipt`) could be forged by whoever pushed a spec pair; `verifyRow`
ties a row to the run's head sha, workflow path and base ref name, never to the base sha it ran on.

Ruled and built: **every spec pull request is into the tranche itself**, from `train/head/<pr>-<seq>`
at R(i), which is built on the tranche tip (R(0)) or on the R ahead of it. No spec base branch
exists. The run's base is a tranche tip, so its pin, config and gate code are the tranche's, under
the same ruleset and the same `verifyRow` binding (base ref = the tranche) that job PRs rest on;
GitHub's merge checkout of R(i) into that tip is R(i)'s tree. What changes with it:

- **Gate, spec mode:** `changed` and its merge-base are the job PR's own head's (the spec head also
  holds the jobs ahead); ledger, start row, imports and generated checks read the job's head, as
  its own gate does; the suite runs on the checkout; revert and base-red run against the run's base,
  the tranche tip.
- **Fast path and cover:** the spec run's base must be the land's base or behind it on the tranche,
  with the same judge (`.process`, `process/config.json`, `.github/workflows/process-gate.yml`); a
  base-red suite stands only on the land's very base (a test failing at an older tip may have been
  fixed by a job ahead and broken again by this one).
- **Never merged:** spec PRs stay drafts (GitHub merges no draft); `merge` refuses a non-job branch
  and `merge --plain` refuses `train/head/*` by name.
- **Noise:** up to k draft PRs into the tranche; status, sweep and the train select job branches
  only. Any product workflow on `pull_request` into the tranche also runs for each spec PR: a trial
  pre-check on the copy.

## Second confirming review of the tranche-based spec (247c63f), and what was done

- **Binding (HIGH, fixed):** GitHub lists only *open* pull requests on a run, so a second PR from a
  spec head into a branch with another gate workflow, since closed, or a retarget of the spec PR,
  could make a forged run verify. The fast path and the cover now require `branchBound` on the
  spec head always: every PR ever opened from it is the spec PR, into the tranche, never retargeted.
  The same listing gap stands under job PRs' record-since-green and merge reads today; that is
  outside this build and is said to the coordinator.
- **Draft (MEDIUM, fixed):** a spec PR made ready is red in spec mode, so its green gate never
  stands as the required check for content judged only as job n's change.
- **Liveness (fixed):** a spec gate that never reports is closed past the hold's cap and rebuilt as a
  red that did not judge the job (then refused after SPEC_REBUILDS).
- **Entry (fixed):** spec mode reads the job's ledger entries at the job's own head.
- **Residual (records):** records are `process/`, so R(i) and L may differ in other modules' ledger
  entries and in any file under `process/`. A product test that reads `process/` could pass on R(i)
  and not on L. This is the same rule record-since-green already stands on; a check that no suite
  reads `process/` would close it.

## Final confirming review (0df703d), and what was done

- **H1 (HIGH, fixed):** GitHub lists a run's open PRs by head sha *or* branch, so a run of another
  branch at the spec head's commit (a writer's `foo` into a branch with another gate workflow,
  since closed) listed the spec PR and verified. `verifyRow` now takes `branch`: the run must be
  on that branch of this repository whatever PRs are listed; the fast path and the cover pass the
  spec head's branch, open or closed.
- **L1 (fixed):** `branchBound` is read after the row is picked and verified, so any PR whose run
  made the row existed by that read.
- **L2 (residual):** a spec PR a writer marks ready keeps its earlier green `gate` check for the
  seconds until the `ready_for_review` run reports; only a hand merge by a person in that window
  could use it. Closing it needs a ruleset change (Bob's).
- The same head-sha listing gap stands under today's job PR paths (record-since-green, merge's
  row read): said to the coordinator as its own build.


# [file] audit2_corruption.md (later part)

## Appendix C. Everything marked "Claude decided" or "Claude reads": the strongest case against each

"Whose" says whether it was Claude's to make.

| Decision (section) | Strongest case that it is wrong | Whose |
| --- | --- | --- |
| Shared state in the product's repository, written with no merge (C) | It is Process3's state branch again: every record needs guards on form, freshness and writer, and the branch's volume was the coordinator's own account of the suspension. It also holds "your instructions quoted exactly", written by sessions. And the slot number, which he has now made an account-wide number, sits in one product | Claude's. Weight: real |

Stane desk entered 13 pearls on the sheet.

| Requirement-only modules moved "as a mechanical edit" (C) | Finding 9, row e | Bob's |
| A module's work is finished when "its notified job tells ARCH that nothing needs changing" (D) | A walk flaw placed against a module is "work" too. So a flaw can be closed by the job saying nothing needs changing, and the walk then finds it again or not. It also settles part of what he sent for study ("what a notified job does") | Claude's for jobs; under study for notifications. Weight: real |
| The mechanical edit merges once, between a round's last merge and its internal walk, with all touched modules' tests or none (D) | It is then the last change before the walk, across many modules, possibly with no test run. "None run" needs the required check to report without running, which is a way round the one gate on a session's judgment (register 68, still open) | Claude's. Unproven |
| Order of a round: jobs, internal walk, deployment only after a clean internal walk (D) | Faults only a deployment shows are found last. A walker fault on the internal walk (63 failures for three days) blocks every deployment. But his own words of 8 Nov ask for this order | His words support it. Weight: low |
| Walking sessions use the job slots, share a walk by journey, at most eight (D) | The internal walk is by screens, not journeys (the notes admit it). Eight walkers on one site change each other's data. Across the account they compete with another product's jobs | Claude's. Unproven |
| Tests and steps: product work, each names a requirement (E) | Finding 6 | Bob's |
| The tool's tests do not count against "no more tests" (E, "Claude reads") | Put to him in P. Fair | Put to him |
| The fault's description travels ARCH to coordinator to PROCESS (H, "Claude reads") | Finding 4: three hops of free text, and PROCESS cannot see the product | Claude's. Weight: real |
| "the processes" means the process's own repository (H, "Claude reads") | That repository today holds Process3's whole tool, guide and decision record on other branches, and his Process3 approvals. PROCESS starts among ready-made answers to every fault, each of them an addition (finding 2) | Put to him. Weight: real |
| His approval is recorded by PROCESS (H) | Findings 2 and 8 | Bob's |
| The tranche branch becomes the default branch (I) | On a public repository the unfinished, unwalked branch becomes what every visitor and every default-branch feature of GitHub uses, and the main branch, the only one a release is cut from, is hidden. His commits on the website then land on a branch that needs a pull request with tests passing, which a change touching no module cannot yet get (register 3, still open; the draft says so in M) | Claude's to propose; his act makes it. Unproven |
| Jobs build and commit built files (J) | Finding 7 | Bob's (reverses a kept line) |
| "same as in process3" for GitHub's limits (J, "Claude reads") | Finding 9, row i | Claude's to correct |
| ARCH writes the tranche report, once, at the end (J) | Finding 11 | Claude's |
| The first health number ended; three measurements ended unmeasured; two Foundations duties ended (K) | Finding 9, row d | Bob's |
| The hourly wake stands as the alarm for lack of progress (K) | Finding 4: it cannot tell waiting from dead | Claude's. Weight: real |
