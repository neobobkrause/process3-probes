# Row 11 — messages to a BUSY session — 2026-11-01T15:36:10Z — Claude Code 2.1.316
Target session_01RAN5epMfCydqDgrEeRzCF3 (auto, haiku, depth 2), created 15:36:04.571Z with a 3-step prompt; two send_message calls at ~15:36:10Z, each {"status":"delivered"}.
Its own get_session at 15:36:12.6Z showed "session_status":"SESSION_STATUS_RUNNING" and "lineage":{"depth":2,"limit":8} -> messages arrived while its first turn was running.
list_events raw excerpt:
 user 70432d6b-c91d-4c05-bb8a-523ecabd8fc4 (15:36:12.520Z): ReadNotifications inside the running turn: "Exactly 2 notifications ... 1 of 2 · id: 9571a4dd-... queued at 15:36:10Z ... row11-busy2 message X ... 2 of 2 · id: ee32c34a-... queued at 15:36:10Z ... row11-busy2 message Y"; arrived_at 15:36:10.618Z then 15:36:10.832Z
 result 4648acd4-7475-4a0b-a311-bdab221f428e (15:36:18.601Z): single result, "result_index":0, "queued_turn_count":0; text lists "1. row11-busy2 message X  2. row11-busy2 message Y".
 -> Delivered in order, folded into the running turn (no extra turn).
Side observation: in this auto session Bash `date -u` was decided by the classifier ("reason_type":"classifier"), while get_session was decided by rule ("reason_type":"rule").
