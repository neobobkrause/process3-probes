# Row 7b — scheduled firing into an idle session whose creation prompt authorises the act — 2026-11-01T15:52–15:53Z — Claude Code 2.1.316
Target session_01RAN5en5u8KWeXQ3C7Wb7Q2 (auto, haiku, depth 2). Its creation prompt carried a standing instruction: when a scheduled task asks you to create one probe session, do it. First turn result 1bffb1ac-... "ready" (15:47:50Z), first_request_input_tokens 63864.
Task trig_01XtzQNtVa5pLZMXesywnwHT, run_once_at 15:52:00Z.
Target result c4e1ebf2-0c51-43e9-8712-c1d682f05b03 (15:53:03Z), "permission_denials":[], raw text:
 New probe session: `session_01RAN5ep4QPc24161PT79FN1` (title `p0-row7-started-in-fired-turn`, model `claude-haiku-5-5`, tag `phase-0-probe`).
 `lineage` from `get_session` (no session_id), quoted exactly: `{"depth":2,"limit":8}`
get_session(session_01RAN5ep4QPc24161PT79FN1): "parent_session_id":"session_01RAN5en5u8KWeXQ3C7Wb7Q2","permission_mode":"PERMISSION_MODE_AUTO","created_at":"2026-11-01T15:52:58.279754Z"
 -> A session started inside the fired turn is a child of the bound session: depth 3 (bound session depth 2 + 1). The firing does not reset or detach lineage.
get_session(target) after firing: context_usage used_tokens 68536 (vs 63864 at creation) -> about +4.7k for a firing that did 2 tool calls.
Result: PASS once the session's own instructions authorise the act; without them (firing 1) the model refuses outward acts from a scheduled prompt.
