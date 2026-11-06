# Unattended sessions and repeated classifier denials (asked by BOB) — 2026-11-01 — Claude Code 2.1.316
Seen: YES. Three separate unattended auto sessions stopped and waited for a human after 3 consecutive classifier denials:
 - session_01RAN5epMqdf6QM1GU3JJCaP control_request 15:50:15.458Z: "decision_reason":"3 consecutive actions were blocked. Please review the transcript before continuing.\n\nLatest blocked action: [External System Writes]", subtype can_use_tool, tool mcp__claude-code-remote__archive_session, permission_suggestions [{"behavior":"allow","destination":"localSettings","rules":[{"toolName":"mcp__claude-code-remote__archive_session"}]}]
 - session_01RAN5eokd466JPyBme48Trd control_request 15:49:52.396Z: same text.
 - session_01RAN5em1j4nFLNriRHzp3W2: post_turn_summary "Waiting on permission: claude-code-remote — Archive Session" from 15:41:17Z.
 All three: session_status SESSION_STATUS_REQUIRES_ACTION, status_bucket SESSION_STATUS_BUCKET_BLOCKED, and they stayed that way (>30 min) until archived. Nobody can answer the prompt in an unattended cloud session, so it is a permanent stop.
 The 20-total threshold was not reached in any session (this session itself had 5 delete_trigger refusals among many passes, not consecutive x3 — note: my 5 refusals were in one parallel batch and did not trigger a stop).
