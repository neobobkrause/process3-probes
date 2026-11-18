# [file] train-plain-options.md (continued)

and 80 of tests. Two sessions must take turns through the state branch: each step can be missed.

## C. Plain merges retry against the moving tip (no train change)

How it works. mergePlain, when GitHub refuses because the head is behind the tranche, updates the
branch (the tranche merged in), waits for the required checks again and retries, up to a bound.

Throughput. No cost to the train. But each try loses whenever the train lands during P: with the
train landing every J and P near J (ledger entries, pins), most tries fail; the job queue is longest
exactly when plain pull requests are most needed (465 held 7 starts). It does not end the race; it
repeats it.

Gate strength. Unchanged, as long as every retry re-checks (mergePlain does).

Code. About 40 lines and 50 of tests; it spends a gate run per try.

## Recommendation: A

A is the only option that ends the race instead of shortening the odds: one writer to the tranche,
with plain pull requests in its queue, first. It costs the train what B costs (one plain gate) but
needs no hand-off between sessions, and the train keeps preparing the next job meanwhile. Gate
strength is the same as today, because the land still goes through mergePlain on the head that
lands. B is smaller but adds a two-session handshake that can lapse; C is smallest but loses most
when it matters most.

Without a live train lease, `merge --plain` merges as today, so nothing changes when no train runs.

## Chosen and built: A (coordinator, 5 Nov 08:36)

The coordinator chose A (Bob's option F, serial per-PR merges by the MERGER, applied to plain pull
requests), with two conditions, both built and tested (tool/test/train-plain.test.mjs):

1. Callers keep today's contract. `merge <pr> --plain ...` into the tranche under a live lease
   (train.mjs plainViaTrain) checks the review flags, queues a row (merger/plain.jsonl) and waits up
   to --minutes for the train's row: it prints the same `merged pull request <n> at <sha>` line, the
   same pin wake (`next act: wake BOB ...`), and exits 0; a refusal throws with the train's reason
   (exit 1, as a mergePlain refusal). Past --minutes it withdraws the row (the train checks again
   just before the land and never lands a withdrawn one) and fails; a train that stops while it
   waits hands the merge back: the row is withdrawn and mergePlain runs here, as before.
2. Never starved: the train takes every queued plain pull request before any job, oldest first,
   whatever the job order says (release path, aged); one in backoff (GitHub slow, a moved base:
   1, 2, 4, 8 min, the fifth try to BOB) lets jobs go meanwhile.

The caller checks only the review flags before queueing; every other plain rule is mergePlain's,
run by the train on the head that lands, so a refusal comes back as the train's row. The train's
rows for plain merges are `row: 'plain'` in metrics/train.jsonl (the trial's merge measures are
unchanged). mergePlain gained `head` (refuses any other head) and `beforeLand` (the lease and the
withdrawal, checked before each GitHub merge call), and returns the pin wake's `what`.

## Cold review fixes (PR 151)

- The train brings up to date only a plain branch of this repository: never main, the default
  branch, the tranche, the state branch or a job's branch (train.mjs plainBranch, checked when
  queueing and again before the push). Any other goes to mergePlain as before.
- The caller's --minutes count from the train's take (a `taken` row). Until then the row waits up
  to one job's whole gate wait more, so a job merge in flight never makes a plain PR fail. The row
  carries that limit (`take_by`), so a caller killed without withdrawing leaves nothing the train
  lands later. A caller that stops on an error withdraws its row.
- A withdrawal written while the train's land is already in flight: the caller waits, up to 5 min,
  for the train's own row, then reads the pull request, so a land that went through is reported as
  merged, not as a failure.


# [file] trust-layer-review-4nov.md (later part)

L. **Size waiver** (record.mjs:350-355, :388-401). Oversize blobs up to 2x the limit are waived
when the head is within it. Reasonable and small; keep.

M. **Shallow cuts** (record.mjs:232-236, :298-305). Keep: fails closed, 10 lines.

N. **Draft read live** (gate.mjs:85-101). Keep: small, fixes a measured race.

O. **mergeRowSince rerun path, job cost rerun** (merge.mjs:25-29, :140, :197-218). Not trust;
bookkeeping. Out of scope, noted for the next simplification pass.

## 3. Allowlists of exact shapes or hashes instead of parsers

1. **Workflow YAML (workflows.mjs).** It reads YAML as lines with an LCS diff (`hunks`,
   :69-93), detects run blocks, path lists and matrix rows by regex (:104-149), and judges each
   hunk (:152-188), plus plainText for line-break tricks (:50-64), plus rule 1, which walks the
   tranche's first-parent history and binds each commit to a gated PR (:190-281). It took four
   rounds on PR 98. S1 already allows any shell inside an existing `run:` block, so the
   security it buys is "no new key, job, permission or event", which a frozen file gives too.
   Proposal: freeze every product workflow file. Each must equal the pin's shim, or a blob hash
   listed in an owner-set allowlist (a file only Bob's website commit changes, like the
   approvals). Product logic that changes moves out of YAML into scripts the frozen file runs
   (`run: ./ci/<name>.sh`, owned by a module, gated as code), and matrices and path lists into
   a JSON file read with `fromJSON`. Same reach as S1 to S3 today (arbitrary commands, no new
   jobs or permissions), no parser. Removes workflows.mjs (296) and the close branch of
   workflowChanges (about 10). One migration on civicsmith-copy, through PRs.

2. **Approvals block and .claude/ settings (record.mjs).** Judged per commit, with special
   handling for each way a merge can carry an old version. What lands on a trusted branch is
   the head's tree, and process-record on push is advisory, so the per-commit walk does not buy
   O2 for trusted branches. Proposal: judge the net state. For each guarded path (approvals
   block, .claude/**, .mcp.json, config approvals), the head's version must equal the trusted
   tip's (base, origin/main or origin/tranche), or the newest first-parent commit that set it
   must be the owner's website commit. Keep the per-commit walk only for size and transient
   paths, which history keeps. Removes introduced's guarded logic, cleanFrom, carried, landed,
   mergeBases and most of ownerBlock: about 120 lines. The "approv" word heuristic on any
   CLAUDE.md line (record.mjs:358-361) is a markdown parser of intent; under the net rule,
   any change to an instruction file outside its owner-set version could need the owner's
   commit instead, which is one blob comparison.

3. **Anchored keys (anchor.mjs).** Move process_repo, tranche and approvals out of
   process/config.json into their own file (process/anchor.json). Rule: its blob at the head,
   and in the merge-tree result, equals the base tip's blob, or the commit that last set it on
   the head's first-parent history is the owner's website commit not already in the base.
   Blob comparison replaces keyAt's JSON reading, duplicate-key handling and per-key loops, and
   drops record.mjs's duplicate config-approvals check. About 50 lines.

4. **Gate rows (verifyRow, checkRow, postRow).** Already close to an allowlist: a fixed set of
   fields with exact validators (gate.mjs:463-470) and a byte comparison with the run's own
   artifact. Keep as it is.

5. **Ledger and metrics JSON.** Read with JSON.parse as data, not to grant trust beyond
   ownership paths; under section 1's rule the paths come from the base. Keep.

## 4. Dead or duplicate code

- gate.mjs:288 `if (pr && post) io.addComment(...)` and p3.mjs:271 `post: !a['no-post']`: the
  shim always passes `--no-post` (process-gate.yml:109), so the gate never posts in CI. Posting
  from the process that ran product code is the very thing the two-job split forbids, so the
  default is the unsafe one. Remove the flag and the post; postRow is the only writer. 4 lines.
- merge.mjs:28 re-exports `isBootstrap, keySetAt, processRepoSetAt` from anchor.mjs; only
  tests import them from merge (merge.test.mjs:427). processRepoSetAt has no caller in the tool.
- Duplicate helpers: `blob` (workflows.mjs:39) and `blobAt` (anchor.mjs:10); `pinOf`
  (workflows.mjs:215) and `pinAt` (anchor.mjs:14); `JOB_MERGE` (workflows.mjs:35) and
  `MERGE_TITLE` (gate.mjs:335); `isJobRef` (workflows.mjs:37) and `isJob` (merge.mjs:441);
  `isAnc` twice (gate.mjs:445, workflows.mjs:48); `entriesAt` three times (gate.mjs:23,
  carry.mjs:20, merge.mjs:632 inline); the no-renames name diff three times (gate.mjs:34,
  merge.mjs:166 and :620, workflows.mjs:266); metrics `rowsAt` three times (merge.mjs:29,
  gate.mjs:435, record.mjs:184). About 30 lines into util.mjs.
- Two `takenIn` functions with different meanings (record.mjs:172 tips, carry.mjs:24 PR
  numbers). Rename one.
- Two implementations of "the approvals in the config changed": anchor.mjs unanchored (key
  `approvals`) and record.mjs:362-376. Section 3 item 3 keeps one.
- Two ownership checks: gate.mjs:110 from the head's ledger, merge.mjs:157-167 from the merge
  base. merge's is the one that holds (BOB's tool); the gate's is early feedback and should
  read the base (section 1).
- `waitForGate` (merge.mjs:47) and `waitForChecks` (:542) are two waits with the same cap logic;
  one could take a list of names. Not trust, about 25 lines.

## 5. Proposals, ranked by lines removed per unit of risk

Risk: 1 low (behaviour for the current product unchanged), 2 medium (a migration or a
measured wall), 3 high (changes throughput or needs a new wall). Lines are estimates of
non-test .mjs and shim lines removed, net of what replaces them.

| # | Proposal | Lines | Risk | Ratio | What could break | Tests that cover it today |
|---|---|---|---|---|---|---|
| 1 | Retire bootstrap and record_since: onboarding ends with Bob's website commit of config and pin on main (2B, 2C) | ~175 | 1 | 175 | A new product cannot onboard without that one owner act | gate-bootstrap.test.mjs (7), bootstrap-close.test.mjs (10), record.test.mjs record_since cases (40 mentions), close-workflows.test.mjs (2) |
| 2 | Freeze product workflow YAML: shim or owner-allowlisted hash; logic in scripts (3.1) | ~300 | 2 | 150 | The copy's workflows need one migration; a matrix change becomes a JSON change | close-workflows.test.mjs (14), shims.test.mjs, merge.test.mjs workflow cases |
| 3 | Dead and duplicate code, including removing the gate's in-process post (4) | ~60 | 0.5 | 120 | Nothing in CI; tests that import from merge.mjs move | gate.test.mjs, merge.test.mjs, github.test.mjs |
| 4 | Tranche gated by construction (ruleset up to date on the tranche, reverse-dependency scope); drop the tranche cover and the tranche-pin exception (2A, section 1) | ~150 | 2 | 75 | Needs Bob's ruleset change; plain PRs must be brought up to date before merge; larger PR gate scope | main-gate.test.mjs (17), shims.test.mjs |
| 5 | A ready job PR's gate always runs its suite; drop measuredBy and record-since-green for it (2F) | ~70 | 1 | 70 | More gate minutes on records-only pushes | gate.test.mjs, merge.test.mjs unagreed cases |
| 6 | Never commit module generated files; drop the refresh route (2G) | ~100 | 1.5 | 67 | Anything that reads a committed generated file must build it first (design stream files) | generated-plain.test.mjs (19), generated.test.mjs, checks.test.mjs |
| 7 | Approvals and settings judged at the head's net state (3.2) | ~120 | 2 | 60 | A commit in a range that briefly carried an unapproved block is no longer named (it never reaches a trusted branch) | record.test.mjs, record-tranche-merge.test.mjs, shallow.test.mjs, setup.test.mjs |
