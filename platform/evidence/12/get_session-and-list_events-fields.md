# Row 12 — context/token/cost fields readable via get_session and list_events — 2026-11-01T15:29Z — Claude Code 2.1.316
Probe: session_01RAN5ekfio64ECoGNbkjALZ (default mode, haiku, depth 2, created by session_01RAN5epJ4BCt7hVutyakDTM).

## get_session(session_01RAN5ekfio64ECoGNbkjALZ) — raw excerpt (verbatim JSON fragments)
"session_status":"SESSION_STATUS_IDLE"
"session_context":{"model":"claude-haiku-5-5","permission_mode":"default"}
"permission_mode":"PERMISSION_MODE_DEFAULT"
"post_turn_summary":{"status_category":"completed","status_detail":"replied OK as requested; turn ended"}
"external_metadata":{
  "autocompact_state":{"effective_window":980000,"enabled":true,"enforced":true,"source":"model-default","threshold":784000},
  "container_cc_version":"2.1.316",
  "context_usage":{"max_tokens":1000000,"used_tokens":63719},
  "cross_session_inbound":"available",
  "last_served_model":"claude-haiku-5-5",
  "permission_mode":"default","permission_mode_seq":"1",
  "rate_limit_info":{"isUsingOverage":false,"rateLimitType":"seven_day","resetsAt":1793728800,"status":"allowed"},
  "usage":{"cache_read_tokens":50753,"cache_write_tokens":12964,"cost_usd":0.00332357,"input_tokens":2,"output_tokens":127}}
"status_bucket":"SESSION_STATUS_BUCKET_COMPLETED","configured_model":"claude-haiku-5-5"
NOTE: "lineage" ({"depth":..,"limit":..}) is returned ONLY when get_session is called with no id (own session). For another session it is absent; depth must be derived from parent_session_id chain.
Own session (no id) at 15:27Z: context_usage {"max_tokens":1000000,"used_tokens":0}; no "usage" block yet.
Parent BOB (get_session at 15:27:47Z) also showed "usage":{"cache_read_tokens":19477646,"cache_write_tokens":511282,"cost_usd":9.0227995,"input_tokens":1170,"output_tokens":70472} and context_usage used_tokens 436569.

## list_events(session_01RAN5ekfio64ECoGNbkjALZ, kinds=[user,assistant,result,system], limit=100) — fields
user event cc3bc548-9947-4033-9baf-d67d9b7ad977: inbound_origin "mcp_create_session", message.content "Reply OK and end your turn."
system init event 6cd6794e-0bc7-4873-be06-b6afb9402da0: "claude_code_version":"2.1.316","permissionMode":"default","model":"claude-haiku-5-5", full "tools" list (includes mcp__claude-code-remote__create_session, archive_session, ...), mcp_servers, skills.
assistant event 83da5978-bc7b-4c73-999b-242ec84697e6: content text "OK"; message.usage {cache_creation_input_tokens:12964, cache_read_input_tokens:50753, input_tokens:2, output_tokens:4, service_tier:"standard"}
result event 33cc77d2-411d-4d1d-b515-6afd02834600: "subtype":"success","result":"OK","num_turns":1,"duration_ms":5014,"duration_api_ms":2471,"total_cost_usd":0.00316403,"permission_denials":[],"stop_reason":"end_turn","terminal_reason":"completed",
   "modelUsage":{"claude-haiku-5-5":{"cacheCreationInputTokens":12964,"cacheReadInputTokens":50753,"contextWindow":1000000,"costUSD":0.00316403,"inputTokens":2,"maxOutputTokens":128000,"outputTokens":127,"thinkingTokens":123,"webSearchRequests":0}},
   "usage":{... "output_tokens":127, "output_tokens_details":{"thinking_tokens":123}},
   "subagent_stats":{..."refused":{"budget":0,"concurrency_limit":0,"depth_limit":0}...}
