# Row 20 (added by BOB) — fire_trigger vs a scheduled firing of a session-bound task — Claude Code 2.1.316
## fire_trigger (on demand): starts a NEW session, ignores the binding
Task trig_01PEkGsKFrLcTgDLUNzC21k3, persistent_session_id session_01RAN5emRoRYGX9QxLxnVaWU. 5 fire_trigger calls 15:32:57–15:33:16Z each returned a different session_id:
 cse_01RAN5eoYYH8RUkDGqGRCAbR, cse_01RAN5emsVW3rNnu3fLUZaLb, cse_01RAN5ejsAbgmPkHkSnHwbVS, cse_01RAN5ep1v4b54AfoLFN4qVU, cse_01RAN5eokZLpahYnEeasujik
 get_session(session_01RAN5eoYYH8RUkDGqGRCAbR): "origin":"force_run_trigger", PERMISSION_MODE_AUTO, tags [...,"config:routine-lineage-none","routine:agent-minted","routine_notify_push"], no parent_session_id, last_served_model claude-sonnet-5-5.
 The bound session's transcript got no firing turns. Full evidence: ../9/fire_trigger-5x.md
## Scheduled firing (run_once_at): DOES resume the bound session
Task trig_01FDg5jcxJgGJCN2ukuKMXAo (run_once_at 15:45:00Z) -> "last_run":{"status":"ROUTINE_RUN_STATUS_SUCCEEDED","session_id":"cse_01RAN5ekDGaDpQ28CvnADYoW"} = the bound session session_01RAN5ekDGaDpQ28CvnADYoW (the cse_/session_ suffix matches, as in older account tasks' last_run).
 The bound session received the prompt as a queued notification and ran one turn (result e0d4d8bd-c6ce-4f60-93aa-4f955fe9de01). Full evidence: ../7/fire1.md
Note: the id returned as cse_X refers to session_X (same suffix).
