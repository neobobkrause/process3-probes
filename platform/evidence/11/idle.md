# Row 11 — messages to an IDLE session — 2026-11-01T15:34:17Z — Claude Code 2.1.316
Target session_01RAN5emRoRYGX9QxLxnVaWU (idle since 15:32:17Z). Two send_message calls back to back, each returned {"status":"delivered"}.
list_events raw excerpt:
 user event ac786973-619d-4167-9480-2b9adb64ac35 (15:34:19.207Z): ReadNotifications result "Exactly 2 notifications were queued ... Notification 1 of 2 · id: 545b3fea-... queued at 15:34:17Z ... row11-idle message A. ... Notification 2 of 2 · id: 20190363-... queued at 15:34:17Z ... row11-idle message B." ; arrived_at 15:34:17.577Z then 15:34:17.726Z
 result event e180f138-d0a3-4cca-b2dd-289a718ad2a2 (15:34:27.706Z): one result, "result_index":1, "process_turn_index":1, "queued_turn_count":0
 -> Both delivered, in order, handled in ONE turn (the idle session woke once, read both).
Also (same pattern) session_01RAN5ek4TkUde2NU9VuK3J4: its first turn had already ended (foreground `sleep 90` was refused by the harness: "Blocked: sleep 90 followed by: echo slept. To wait for a condition, use Monitor ..."), so messages 1 and 2 (queued 15:34:42Z) were read together in one ReadNotifications call (user event ae74f1b7-...), in order.
