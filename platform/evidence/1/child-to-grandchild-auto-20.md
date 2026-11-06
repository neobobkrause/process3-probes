# Row 1 — child (depth 2, auto) -> grandchild (depth 3): 20 create_session calls — 2026-11-01T15:35:01Z–15:36:37Z — Claude Code 2.1.316
Driver: session_01RAN5enWFqRP1Gs1mwqFC8i (p0-row1-child-driver, auto inherited, haiku). Its own get_session: "lineage":{"depth":2,"limit":8}.
Driver result event 0cee4e63-77bc-46b2-9c02-af3d1ad2c493 (15:36:37.497Z), raw "result" text:
1. session_01RAN5enScKZ3ce2jqgqPatp
2. session_01RAN5enDs758tQeLgAaB43L
3. session_01RAN5entfjD3VnGu4DYagbE
4. session_01RAN5enqq4VMxyLo4rTabGW
5. session_01RAN5emEYzfdxDd1ZhvFxxR
6. session_01RAN5ekfHkm1HMh86hPXtPn
7. session_01RAN5emw4p32A3S43BCJ3vp
8. session_01RAN5ep9gPexdfocNPTetDE
9. session_01RAN5en65Y4woaJkcThQvde
10. session_01RAN5emB4ez2R7Yjbp19wrA
11. session_01RAN5emEr78PWSANY32MEhJ
12. session_01RAN5ekzmXV2wRY667AJv9b
13. session_01RAN5eoRXMbtB2h7KHt9Tpa
14. session_01RAN5emZ1kMofRMFeExVmYb
15. session_01RAN5en4tbhFjw3FvErJ3jh
16. session_01RAN5eoa54cFF1DBBivKdcD
17. session_01RAN5eju6SXo1M6j5zYBQCn
18. session_01RAN5eka7CnCRNxi2LQfhe7
19. session_01RAN5emW4QS9HxuxVsF4KSD
20. session_01RAN5ekFtbCkE7sX9Z1Z6hP
Lineage from get_session (no session_id): `"lineage":{"depth":2,"limit":8}`
passed 20 of 20
 + "permission_denials":[] , "num_turns":22, "total_cost_usd":0.02162156
Spot check get_session(session_01RAN5ekFtbCkE7sX9Z1Z6hP): "title":"p0-row1-grandchild-20","permission_mode":"PERMISSION_MODE_AUTO","parent_session_id":"session_01RAN5enWFqRP1Gs1mwqFC8i" -> depth 3.
Note: create_session is judged by the auto classifier (it refused one of my calls in row 3a try 4 and the bypass call in row 2); plain inherit-mode creations passed 20/20 at both steps.
