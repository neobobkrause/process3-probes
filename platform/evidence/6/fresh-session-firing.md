# Row 6 — permission mode of a task-created fresh session — fired 2026-11-01T15:36:44Z — Claude Code 2.1.316
Task trig_013QZQvmqgro1c7veFmp7gS7 (create_new_session_on_fire=true, run_once_at 15:36:00Z, notifications push).
get_trigger raw excerpt: "enabled":false,"ended_reason":"run_once_fired","last_fired_at":"2026-11-01T15:36:44.874340Z",
 "last_run":{"status":"ROUTINE_RUN_STATUS_FAILED","fired_at":"2026-11-01T15:36:44.836863Z","finished_at":"2026-11-01T15:36:45.347886Z","session_id":"cse_01RAN5ejvdD5ZQjbqi2ipVP9","failure_reason":"ROUTINE_RUN_FAILURE_REASON_CONTAINER_LIMIT_REACHED"}
get_session(session_01RAN5ejvdD5ZQjbqi2ipVP9) raw excerpt:
 "title":"⚡ p0-row6-row10-fresh-push","session_status":"SESSION_STATUS_PENDING","origin":"scheduled_trigger",
 "session_context":{"autofix_on_pr_create":true,"permission_mode":"auto"},"permission_mode":"PERMISSION_MODE_AUTO",
 "tags":["config:auto-create-pr:off","config:no-git-repo","config:routine-lineage-none","config:session-created","routine:agent-minted","routine_notify_push"], no parent_session_id
-> The fresh session is created in AUTO mode with no parent (lineage none). Its first turn never ran: the account hit a container limit (I had ~45 probe sessions alive at that moment).
Same result for fire_trigger-created sessions (row 9): origin force_run_trigger, PERMISSION_MODE_AUTO, no parent.
