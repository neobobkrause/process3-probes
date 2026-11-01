# Row 9 — fire_trigger x5 on a poke-only task bound to a probe session — 2026-11-01 — Claude Code 2.1.316
Caller: session_01RAN5epJ4BCt7hVutyakDTM (auto, depth 1).
Task: trig_01PEkGsKFrLcTgDLUNzC21k3 "p0-row9-poke-only", no schedule, persistent_session_id=session_01RAN5emRoRYGX9QxLxnVaWU (created 15:32:52Z, CREATE_TRIGGER_OUTCOME_CREATED).
| # | clock before/after call (UTC) | result | returned session_id |
| 1 | 15:32:57.589 -> (next) | passed, no classifier denial | cse_01RAN5eoYYH8RUkDGqGRCAbR |
| 2 | -> 15:33:07.145 | passed | cse_01RAN5emsVW3rNnu3fLUZaLb |
| 3 | -> 15:33:07.844 | passed | cse_01RAN5ejsAbgmPkHkSnHwbVS |
| 4 | -> 15:33:15.788 | passed | cse_01RAN5ep1v4b54AfoLFN4qVU |
| 5 | -> 15:33:16.428 | passed | cse_01RAN5eokZLpahYnEeasujik |
5/5 passed under auto; none classifier-gated (each call returned in <1 s wall when paired with the clock call).
Raw result shape (each): {"trigger":{"id":"trig_01PEkGsKFrLcTgDLUNzC21k3",...,"persist_session":true,"persistent_session_id":"session_01RAN5emRoRYGX9QxLxnVaWU",...},"session_id":"cse_...","conversation_id":""}

SURPRISE: each firing STARTED A NEW SESSION instead of resuming the bound session.
- list_events(session_01RAN5emRoRYGX9QxLxnVaWU) after firing: only its creation turn (user event 5711ce22-..., result b74e2e99-...). No firing turns.
- get_session(session_01RAN5eoYYH8RUkDGqGRCAbR) raw excerpt:
  "title":"⚡ p0-row9-poke-only","origin":"force_run_trigger","session_context":{"autofix_on_pr_create":true,"permission_mode":"auto"},"permission_mode":"PERMISSION_MODE_AUTO",
  "tags":["config:auto-create-pr:off","config:no-git-repo","config:routine-lineage-none","config:session-created","routine:agent-minted","routine_notify_push"],
  "last_served_model":"claude-sonnet-5-5", NO parent_session_id, "usage":{"cost_usd":0.0894131,...}
  -> fired session: auto mode, no parent (lineage none), account-default model, tagged routine_notify_push although the task set no notifications.
