# Row 7 firings 2–4 into the idle bound session — 2026-11-01 — Claude Code 2.1.316
Target session_01RAN5ekDGaDpQ28CvnADYoW (haiku, auto, depth 2), idle between firings. Each task prompt: "Phase 0 probe firing N. Reply OK and end your turn."
| firing | task | run_once_at | fired_at (last_run) | last_run | result event | reply | context after (last request input) |
| 1 | trig_01FDg5jcxJgGJCN2ukuKMXAo | 15:45:00Z | 15:46:12.156Z | SUCCEEDED, cse_01RAN5ekDGaDpQ28CvnADYoW | e0d4d8bd-... 15:46:25Z | declined create_session (see fire1.md) | 66,388 (get_session) |
| 2 | trig_01SEpiFcfySzjj8ZYFZkDShz | 16:45:00Z | 16:46:19.665Z | SUCCEEDED, cse_01RAN5ekDGaDpQ28CvnADYoW | 542bc9ec-... 16:46:28.6Z | "OK. This is the second probe (`p0-row7-fire2`). ..." | 69,348 (67,511 cache read + 1,837 write) |
| 3 | trig_0187RCuWyCZeGqeWK9GjFK8v | 17:45:00Z | 17:46:21.136Z | SUCCEEDED, cse_01RAN5ekDGaDpQ28CvnADYoW | 08df2f52-... 17:46:33.1Z | "OK. This is the third probe (`p0-row7-fire3`) ..." | 72,143 (70,315 + 1,828) |
| 4 | trig_01DM98koKfjB3diy9bQcKvTi | 18:45:00Z | 18:45:59.267Z | SUCCEEDED, cse_01RAN5ekDGaDpQ28CvnADYoW | 3982b89d-... 18:46:11.9Z | "OK. This is the fourth probe (`p0-row7-fire4`) ..." | 73,527 (72,537 + 988); get_session context_usage used_tokens 73,527 at archive |
Every task: "ended_reason":"run_once_fired", "enabled":false afterwards.
Firing delay: 59–80 s after run_once_at (72 s, 80 s, 81 s, 59 s).
Context per firing (OK-only replies, ~1 h apart): +2.96k, +2.80k, +1.38k tokens; the first firing (which also wrote a longer refusal) about +2.7k on top of the 63.7k creation baseline. Total +9.8k over 4 firings.
The container restarted between firings (worker_epoch 5 at archive, "flag_fetch_kick":"not_asked_warm"), but the conversation resumed each time with context intact.
Target archived at 18:51Z.
