# Row 3a try 1 — extra_allowed_tools with claude-code-remote MCP tools — 2026-11-01T15:29Z — Claude Code 2.1.316
create_session(permission_mode=default, model=claude-haiku-5-5, extra_allowed_tools=["mcp__claude-code-remote__list_triggers","Skill","Bash(echo:*)"])
-> session_01RAN5emVPxu9kBZFaPUJLVy (depth 2; parent session_01RAN5epJ4BCt7hVutyakDTM)
Prompt: call list_triggers (listed) then list_sessions (NOT listed).
list_events raw excerpts:
 tool_result toolu_01KsPdAFApj2mM2LZ8PTuxwu (list_triggers): "permission_decision":{"decision":"accept","reason_type":"rule","source":"config"}
 tool_result toolu_01FStWVne8bE5hwmVSPCULxB (list_sessions): "permission_decision":{"decision":"accept","reason_type":"rule","source":"config"}
 result f4394bee-6876-498a-aa79-1f5bdb51968d: "permission_denials":[], result text "Both probes ran without a permission prompt or denial."
Finding: in a default-mode cloud session, claude-code-remote read tools (list_triggers, list_sessions) are already allowed by a config rule whether listed or not -> this pair does not discriminate. Retried with Bash (try 2).
(list_triggers output named an unrelated account task; not copied here.)
