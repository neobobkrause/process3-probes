# Row 15 — branch protection on tranche — REFUSED from a session — 2026-11-01T15:44Z — Claude Code 2.1.316
Branch tranche created from main (b1a9cd1.. 627ea65, includes .github/workflows/probe.yml with job probe-check, path filter src/**) by git push at 15:44:47Z.
1. gh api -X PUT repos/neobobkrause/process3-probes/branches/tranche/protection  (required_status_checks contexts ["probe-check"], enforce_admins true) at 15:44:47Z:
   {"message":"Write access to this GitHub API path is not permitted through this proxy.","documentation_url":"https://docs.anthropic.com/en/docs/claude-code/github-actions"}  (HTTP 403)
2. gh api -X POST repos/neobobkrause/process3-probes/rulesets (required_status_checks probe-check on refs/heads/tranche) at 15:44:59Z:
   {"message":"Write access to this GitHub API path is not permitted through this proxy.", ...} (HTTP 403)
3. gh api repos/neobobkrause/process3-probes/branches/tranche/protection -> {"message":"Branch not protected",...,"status":"404"}
(civicsmith is admin at this time — the refusal is the session proxy, not GitHub permissions. GitHub MCP tools have no branch-protection tool, and they currently fail with "invalid session".)
Steps for Bob (github.com, signed in as neobobkrause):
 1. github.com/neobobkrause/process3-probes -> Settings -> Branches -> Add branch protection rule (classic).
 2. Branch name pattern: tranche
 3. Tick "Require status checks to pass before merging"; in the search box type probe-check and select it (it appears because it ran on 2026-11-01).
 4. Tick "Do not allow bypassing the above settings" (so the admin account civicsmith is held to it too).
 5. Leave "Require a pull request before merging" UNticked (so a direct push is a fair test). Save.
 6. Tell BOB "tranche rule set". Phase 0 then runs: PR touching src/** (expect: waits for probe-check, then mergeable), PR touching only records/ (expect: probe-check never runs -> waits forever), direct push of records/x.txt to tranche (expect: refused).
