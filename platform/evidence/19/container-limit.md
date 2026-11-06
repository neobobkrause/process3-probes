# Observation — account container limit — 2026-11-01T15:36Z — Claude Code 2.1.316
At ~15:36:10Z the account stopped starting new cloud containers.
1. Task trig_013QZQvmqgro1c7veFmp7gS7 last_run: "status":"ROUTINE_RUN_STATUS_FAILED","failure_reason":"ROUTINE_RUN_FAILURE_REASON_CONTAINER_LIMIT_REACHED" (fired 15:36:44.836Z)
   Its session session_01RAN5ejvdD5ZQjbqi2ipVP9, read at archive time: "post_turn_summary":{"status_category":"failed","status_detail":"Cancelled — cloud container never started"}
2. Grandchildren 16,17,18,20 (created 15:36:11–15:36:27Z) and driver session_01RAN5ekeoUhiV2wUqduMFnZ (15:36:46Z) stayed SESSION_STATUS_PENDING with no external_metadata usage (never ran). create_session itself still returned success — the limit is NOT reported at creation time.
3. Count of my live (non-archived, non-reclaimed) probe sessions at that moment: about 50 (12 early probes + 5 fire_trigger sessions + 20 children + ~15 grandchildren + me). Plus Bob's other sessions on the account. Exact limit value not shown by any tool.
4. Recovery: archived ~57 finished probes (all archive_session calls passed under auto, 0 refusals) between 15:38 and 15:40Z; next create_session at 15:40:03Z.
Process impact: the process must archive finished sessions promptly; creation success does not prove the session will start; watch for status PENDING with no usage, and for task last_run failure_reason CONTAINER_LIMIT_REACHED.
