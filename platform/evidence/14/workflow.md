# Row 14 — workflow_dispatch on main, path filter, run time — 2026-11-01T15:41–15:43Z — Claude Code 2.1.316
Workflow .github/workflows/probe.yml pushed to main (commit b1a9cd1) by git push (after Bob granted civicsmith admin):
  on: workflow_dispatch; push: branches [main, tranche], paths ['src/**']; pull_request: paths ['src/**']; job probe-check (echo; sleep 5)
1. Push b1a9cd1 (only .github/workflows/probe.yml changed): NO push run created -> path filter held.
2. Dispatch:
   mcp__github__actions_run_trigger(run_workflow, probe.yml, ref main) at 15:41:4xZ -> "Error POSTing to endpoint: invalid session" (twice). Later mcp__github__actions_list -> same "invalid session" (GitHub MCP tools broken in this session after the permission change; get_me had worked at 15:30Z).
   gh api -X POST repos/neobobkrause/process3-probes/actions/workflows/probe.yml/dispatches -f ref=main at 15:41:51Z -> exit 0, no output (HTTP 204)
   Run: {"id":41322528589,"event":"workflow_dispatch","head_branch":"main","status":"completed","conclusion":"success","created_at":"2026-11-01T15:41:52Z","run_started_at":"2026-11-01T15:41:52Z","updated_at":"2026-11-01T15:42:04Z"}
3. Run time readable: gh api .../actions/runs/41322528589/timing -> {"billable":{"UBUNTU":{"total_ms":0,"jobs":1,"job_runs":[{"job_id":124895593921,"duration_ms":0}]}},"run_duration_ms":12000}
   jobs -> {"name":"probe-check","status":"completed","conclusion":"success","started_at":"2026-11-01T15:41:56Z","completed_at":"2026-11-01T15:42:03Z"}
4. Positive control: push 627ea65 adding src/probe.txt -> run {"id":41322599044,"event":"push","conclusion":"success","created_at":"2026-11-01T15:42:43Z","updated_at":"2026-11-01T15:42:54Z"}
Result: PASS (dispatch runs, filter holds both ways, run_duration_ms readable). Dispatch works by gh api; the GitHub MCP tool route failed with "invalid session".
