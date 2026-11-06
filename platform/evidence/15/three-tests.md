# Row 15 — three tests against the tranche branch rule — 2026-11-01T16:24–16:25Z — Claude Code 2.1.316
Rule (set by Bob by hand, read back by gh api .../branches/tranche/protection): {"checks":["probe-check"],"enforce_admins":true,"pr":null}
Workflow probe.yml: pull_request + push with paths ['src/**'], job probe-check.

## C. Direct push of records/row15-direct.txt to tranche (16:24:14Z) — REFUSED
 remote: error: GH006: Protected branch update failed for refs/heads/tranche.
 remote: - Required status check "probe-check" is expected.
  ! [remote rejected] HEAD -> tranche (protected branch hook declined)

## A. PR #3 probe/row15-src -> tranche, changes src/probe.txt (head 5e85b79) — WAITED, then PASSED
 check run probe-check: started 16:24:29Z, completed 16:24:37Z, conclusion success (run 41326165994, event pull_request)
 pulls/3 at 16:25:14Z: "mergeable":true,"mergeable_state":"clean"
 merge (gh api PUT pulls/3/merge squash, 16:25:30Z): {"sha":"d9342144d4b6c3d6cf1235a8b0c1bdbe9aee65cc","merged":true,"message":"Pull Request successfully merged"}

## B. PR #4 probe/row15-records -> tranche, changes only records/row15-pr.txt (head 81c3ea2) — WAITS FOREVER (merge refused)
 no check run created (path filter skips it); pulls/4 at 16:25:14Z: "mergeable":true,"mergeable_state":"blocked"
 merge attempt 16:25:30Z: {"message":"Required status check \"probe-check\" is expected.","status":"405"} (HTTP 405)
Result: path-filtered required check -> record-only PRs and record-only pushes can never land on tranche. Code PRs wait ~10 s for the check and then merge.
Workaround options for BOB: make the required job run on every PR and exit early when no code changed (no path filter at workflow level), or keep records off the protected branch.
PR #4 left open (throwaway) for BOB to see; close it when done.
