# Row 5 — turn / spending caps on cloud session creation routes — 2026-11-01T15:30Z — Claude Code 2.1.316
1. create_session tool schema parameters (as loaded in this session): append_system_prompt, blob_limit_kb, clone_depth, environment_id, extra_allowed_tools, model, outcome_branch, permission_mode, prompt, source_revision, source_url, sparse_checkout_paths, tags, title. -> no max-turns, no budget.
2. create_trigger tool schema parameters: connectors, create_new_session_on_fire, cron_expression, environment_id, initiation, name, notifications, persistent_session_id, prompt, run_once_at. -> no max-turns, no budget. update_trigger: cron_expression, enabled, model, name, prompt, run_once_at, trigger_id -> none.
3. `claude --help` (2.1.316) grep for turn|budget|cost|limit — raw:
  --max-budget-usd <amount>             Maximum dollar amount to spend on API
                                        calls (only works with --print)
   (no --max-turns flag listed). Cloud sessions are not started by the user with CLI flags; read_documentation session.permissions: "Do not suggest command-line flags ... they do not change this session's mode."
4. ~/.claude/launcher-settings.json (managed, read-only to the agent) keys: $schema, autoMode{allow,environment}, hooks{Stop}, permissions{allow:["Skill"],deny:[...]} -> no turn/budget key.
5. Environment variable NAMES in container matching turn|budget|max|limit|cost: MAX_THINKING_TOKENS, CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH, CLAUDE_CODE_MAX_MCP_DESCRIPTION_LENGTH -> none is a turn or spend cap.
6. Server-side lineage limit exists instead: get_session (own) -> "lineage":{"depth":1,"limit":8}.
7. Readable after the fact: get_session external_metadata.usage.cost_usd; result event total_cost_usd and subagent_stats.refused.budget (in-session subagent budget, 0).
Conclusion: no max-turns or budget setting on any creation route; no probe could be run to reach one.
