# Row 1 — parent (depth 1, auto) -> child (depth 2, inherits auto): 20 create_session calls — 2026-11-01T15:34:57Z–15:35:37Z — Claude Code 2.1.316
Caller session_01RAN5epJ4BCt7hVutyakDTM, lineage {"depth":1,"limit":8}. Each: prompt "Reply OK and end your turn." (driver #1 had the grandchild prompt), model claude-haiku-5-5, no permission_mode (inherit), tags [phase-0-probe].
Every result: "session_status":"SESSION_STATUS_PENDING", "parent_session_id":"session_01RAN5epJ4BCt7hVutyakDTM". No classifier denial, no server error.
| # | session id | created_at |
| 1 driver | session_01RAN5enWFqRP1Gs1mwqFC8i | 15:34:57.355 |
| 2 | session_01RAN5enfTyBQcW3TJqbQ7BP | 15:35:12.382 |
| 3 | session_01RAN5ejsq2r3VewgD2Sph5Y | 15:35:13.050 |
| 4 | session_01RAN5eoxSDkG4gjevFrUMx5 | 15:35:13.682 |
| 5 | session_01RAN5en8NhpxhThjgztxTx9 | 15:35:14.254 |
| 6 | session_01RAN5ekZ6gwQQUPhFn86pSX | 15:35:15.004 |
| 7 | session_01RAN5enevyPXQGYKqYRYLq8 | 15:35:15.593 |
| 8 | session_01RAN5em4woQu7JcCN29e2JN | 15:35:16.165 |
| 9 | session_01RAN5ekMK1sa3Dsys5RHfuw | 15:35:16.753 |
| 10 | session_01RAN5ekaWWoTe3qP551d9gc | 15:35:17.310 |
| 11 | session_01RAN5ekUX6oSAUmvbYJ9Qzj | 15:35:17.932 |
| 12 | session_01RAN5epBgSd6x1dbebSEFDh | 15:35:32.843 |
| 13 | session_01RAN5ejcypi38FQzV9Q8YF2 | 15:35:33.419 |
| 14 | session_01RAN5eoFfX5vEbv2sPuD2Gf | 15:35:33.975 |
| 15 | session_01RAN5em1ds6kPRgFKP6rYvS | 15:35:34.606 |
| 16 | session_01RAN5ejh2f3tyKTXe5TcRQh | 15:35:35.352 |
| 17 | session_01RAN5enWKogcmA5W5VHp3qh | 15:35:36.054 |
| 18 | session_01RAN5ekEtZQWptiRKAgi47d | 15:35:36.624 |
| 19 | session_01RAN5emLdcYhfyRc6eCmUea | 15:35:37.225 |
| 20 | session_01RAN5ep4aJcVTeAso1nFuYe | 15:35:37.816 |
Result: 20/20 passed.
Earlier in the session (same step, other modes): acceptEdits and default children passed; dontAsk refused by server; bypassPermissions refused by classifier [Create Unsafe Agents] (see ../2/).
dontAsk column: not measurable — no dontAsk session can be created from this tree (row 2).
