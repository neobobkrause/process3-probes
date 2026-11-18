# [file] defect-sweep-4nov.md (continued)

- **Smallest fix:** inside the callback, re-read `addresses/<role>.json` in the worktree and throw unless `session === me`. For `recordStart`, unless it is the expected prior value.

## 12. Concurrent appends to one state file conflict, and pushRetry gives up
- **Where:** util.mjs:219-235 (`pushRetry` merges `origin/<sb>` and aborts on any conflict). Writers append to one file per role, or one per kind: messages/<from>.jsonl (state.mjs:155, 173), metrics/restart.jsonl, releases/dev.jsonl, deploys/dev.jsonl, layers/closed.jsonl, metrics/sweep.jsonl and lanes.
- **Class:** 6. **Severity:** a refused act (rerun works). It can block when the refused write is a `send` whose message is then never delivered or recorded.
- **Scenario (reproduced in exp3):** two appends at the end of the same jsonl give a `UU` conflict. Cases: BOB issuing `send … --from bob` and `send delivered n --from bob` as parallel tool calls, old and new BOB both writing messages/bob.jsonl during a handover, or two `--from pin` sessions. The second fails with "moved on origin and does not merge cleanly; nothing was pushed".
- **Smallest fix:** on a rejected push, rebuild the worktree from the fresh tip and re-run `change(wt)` (which also renumbers `n`) instead of merging. Or commit `*.jsonl merge=union` in the state branch's `.gitattributes`.

## 13. The tranche→main merge waits 20 minutes on a gate capped at 45 that runs every module's suite
- **Where:** gate.mjs:103,120 (a non-job PR's scope is every module whose files it changes, run serially in one job), process-gate.yml:25 (`timeout-minutes: 45`), merge.mjs:329-338 and p3.mjs:241 (20 min by default), tranche.mjs:205-207 (the close steps).
- **Class:** 5. **Severity:** blocks tranche close, later.
- **Scenario:** `Close tranche` changes all 38+ modules. One gate job runs every suite, each up to `suite_timeout_minutes` (20). `merge --plain` gives up at 20 min, and the gate is cancelled at 45. If main's ruleset requires `gate`, the tranche never merges.
- **Smallest fix:** for a PR whose head is the tranche, have the gate trust the per-job gates (trigger `record` when every changed file arrived through a merged job PR), or split suites into a matrix. Default `--minutes` to at least the gate's timeout.

## 14. Lower (wrong figures or cosmetic)
- **Release checks claim freshness without testing it** (release.mjs:180-184, class 2, wrong figures). `release run checks` builds generated rows first. `bundles.mjs` also rebuilds stale *committed* bundles, so the copy's checks "setup-words fresh" and "bundles fresh" (`--check`) always pass, and the release body claims fresh bundles the commit does not have. Fix: after `buildGenerated`, run `git status --porcelain` on the committed generated paths, and record a failing result naming each one the build changed.
- **survival() reports missing history as "reverted"** (metrics.mjs:90-92, class 3, wrong figures). It treats any `merge-base --is-ancestor` failure as "reverted", including exit 128 for a missing object when `deepen()` failed in a shallow clone. Fix: exit 1 means not on the branch; any other exit is `unmeasured`.
- **p3 size counts tracked files only** (size.mjs:81-82, class 2, cosmetic). `tracked_files`/`tracked_bytes` leave out the built-not-committed files (about 43 MB on the copy since they were untracked), so later ranges are not comparable with earlier ones. Fix: add a `generated_untracked_paths` figure, or say "tracked" in the range rule.
- **Two `found` runs can share a mark number** (found.mjs:139-145, class 6, cosmetic). Two runs for one module before the first branch is pushed, without `--write`, both get the same F<n> and the same branch name. Fix: always count the local `found/<key>-f*` branches as well as the remote ones.
- **Full fetches without `--depth` in shallow sessions** (class 3 cost, not misjudgement). start.mjs:34 (every `start check`, every wake), state.mjs:141 (every job `send` after BOB pushed to the job's branch), merge.mjs:105/359/367 and the `git fetch origin <tranche>` that roles.mjs:98 prints. The first one can pull the whole history (util.mjs's own measurement: 90 s). Fix: `...depth(root)` there, as fetchBranch does, except merge, which needs the history.
- **`record-check` and `ledger check` without `--base` in a shallow clone** (p3.mjs:380, 393, 398, class 3). They give "no base" or a git failure from `merge-base`. Only people run them by hand. Fix: use compare's `merge_base_commit`, as `shallowBase` does.
- **Two pin moves can both pass `pin check`** (pin.mjs:35-37, class 6, safe). The window is between step 8 and the push and PR in steps 9 and 10. The second PR conflicts on the gitlink and `waitMergeable` refuses it at once. No fix needed beyond what PR 85 did.

## Checked and found sound
- markReady (CCR route).
- `shallowBase` (PR 83) and take-in deepening.
- aheadBy, onMainOf, closedRows and tranche `onBranch` (compare first).
- entryHistory and blocks (cut-aware), the report `deepen()`, survivalReport (shallow means unmeasured), and processRepo's `--unshallow`.
- gate (full-history Actions checkout), layer close (installs all lock files, builds generated), release run (install, then build).
- waitMergeable and waitForChecks (bounded), mergeRetry, the notice and triage writes (one file per row), sweep and heartbeat (single writer).


# [file] receipt-regate-options.md

# Receipt re-gate: options (build/receipt-regate, 5 Nov)

## The defect

A job whose gate went red on revert findings runs `job complete <id> --exempt-revert "<why>"`
again. Its branch is at the COMPLETE commit, so `finish` takes the amend path: no commit, no push,
an amended receipt comment, and `markReady` only if the pull request is a draft, which it is not.
The gate workflow (`shims/process-gate.yml`) runs on `opened, synchronize, reopened, edited,
ready_for_review, converted_to_draft`; a comment is none of these. The red gate on the head
stands, and merge (`jobChecks`: the newest `gate` check run on the head must be `success`, and a
green row must agree with the newest receipt's attempt) and the train (`ready`: `checkRun` on
the head must be green) wait for a person's re-run (copy PRs 462, 471, 488, 490, 492, 5 Nov).

What the gate reads from an amendment: only `receipt.exempt.revert` (gate.mjs line 218, and
`measuredBy`). `not_verified` is never read by the gate. The receipt's `attempt` and `sha` stay
the same through an amendment, so merge's `receipt_attempt === receipt.attempt` still binds.

## Options

### A. job complete gives the pull request a new `edited` event (a body edit)

After an amended receipt is posted, job complete PATCHes the pull request's body (`editPR`,
already used by take-in, so the job's account can do it) to carry one marker line naming the
receipt comment, e.g. `<!-- p3:regate --> Gate re-run for the amended receipt <comment url>`,
replacing an earlier such line. GitHub fires `pull_request: edited`; the gate runs on the same
head with a fresh payload: today's base sha and the base's pin, and it reads the new receipt.

- Gate runs: one full run per material amendment, the same as today's hand re-run. No extra run.
- Time: the gate's own time (to 40 min for plane/control-plane); no person in the loop.
- Taken rows / gate rows by head: the head does not move, so the train's review notes
  (`train-notes.jsonl`, keyed by head), BOB's `--reviewed` note and every row keyed by head
  stand. A new run is a new check run, so the train's refused key (`pr@head@run`) changes and
  the train judges it again, as after a hand re-run.
- Fresh base: unlike an Actions re-run, `edited` carries the base as it is now (merge.mjs line 370
  already names "edit the pull request" as the way to give the gate a new event).
- Concurrency group `process-gate-<pr>`, cancel-in-progress: a run already going (which read the
  old receipt at its start) is cancelled and replaced. Wanted.

### B. job complete re-runs the red gate run (Actions API, `gh run rerun`)

- Gate runs: one, as A.
- A re-run replays the old event: the old base sha and the old base's pin (merge.mjs line 370).
  If the tranche moved, the run judges a stale base; `lastGreen` (keyed on `r.base === base`)
  and the revert base are the old ones.
- Needs `actions: write` on the job's account and a run id lookup by head; the job's acts
  name commenting and marking its own PR ready, not workflow control. Re-run attempts share the
  run id and overwrite the `gate-row` artifact (`overwrite: true`), so `verifyRow` reads the
  newest attempt: fine for the newest row, but an older posted row from the same run id would no
  longer verify. More moving parts than A for no gain.

### C. An empty (or records-only) marker commit

- Moves the head: `synchronize` fires one gate run, but every head-keyed record breaks: BOB's
  train note and `--reviewed` are for the old head, the train backs off/refuses by head, and
  job complete reads commits after the COMPLETE commit as a new attempt (`again`), which the
  amend path was built to avoid (copy PR 40: the amendment commits nothing). An empty commit to
  kick CI is also against the process's own rule. Rejected.

### (D.) Gate keyed by head sha plus receipt hash

Not a trigger on its own: something must still give the gate an event. As a guard it adds
nothing today: an amendment only loosens (adds an exemption) or adds not-verified lines the gate
ignores, so a green row stays true, and merge already binds the row to the receipt's attempt.
It would also add a row field, which an older pin's `checkRow` at job post may refuse (no
comment posted). Not recommended.

## When A fires (the failure cases)

job complete gives the `edited` event only when all hold:

1. The newest receipt carries a revert exemption (the only amended claim the gate reads). An
   amendment that adds only `--not-verified` lines changes nothing the gate judges: no re-gate.
2. The newest `gate` check run on the head is not green: none, completed non-success, or in
   progress but started before the newest receipt comment (it read the old receipt). A green
   gate is left alone, so a pull request the train holds (it takes only green heads) never gets
   a new run under it, and its land is not delayed by a check going pending.
3. No marker line already names this receipt comment, so a rerun of job complete after a
   failed edit edits again, and a rerun after a good edit does nothing (idempotent, as the rest
   of `finish`).

A failed PATCH stops job complete with "run job complete again"; the receipt is already posted,
so the rerun posts nothing and only edits. A cancelled run (a newer event) is handled by GitHub's
concurrency group as today. A plain pull request has no receipt and is untouched. The first
complete keeps its route (draft, then `markReady` fires `ready_for_review`); a new attempt keeps
its push.

## Recommendation

A, with the three conditions above. It removes the person from the loop at the cost of exactly
the one gate run a person would have started, keeps every head-keyed record, judges the current
base, and uses a call the job's account already makes.


# [file] train-robust-options.md (later part)

7. Modules with no ledger entry after the open layer (coordinator, 5 Nov: 14 on the copy, skipped
silently). nextWork names each module of a layer after the open one whose requirement file has
unmet marks and that has no ledger entry, `- <id> (layer <n>): no ledger entry: cannot start;
<k> unmet marks`, and returns them apart (noEntry), never as work; the idle-capacity line adds
`no ledger entry, cannot start: <id> (<k> unmet), ...`.

## Review rounds

Round 1 (cold): five findings, all fixed, each with a test: the stale-lock break could restore a
released lock (now broken under a `.break` file; a lock naming this process that it does not hold
is stale); a state failure at the top of a pass stopped the train (now the next pass); the sweep
