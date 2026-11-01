# Row 8 (re-scoped by BOB) — creating a task from an auto probe, with and without create_trigger allow-listed — 2026-11-01T15:49Z — Claude Code 2.1.316
No dontAsk session can exist on this account (row 2).
Allow-listed (probe/row4 settings allow mcp__claude-code-remote__create_trigger) — session_01RAN5epMqdf6QM1GU3JJCaP:
 5 created, permission_decision {"decision":"accept","reason_type":"classifier","source":"config"} each; then 15 calls -> "failed to create trigger: Trigger creation rate limit reached. Try again in 58s." (also classifier-accepted first).
Not allow-listed (main) — session_01RAN5eokd466JPyBme48Trd:
 5 created ("outcome":"CREATE_TRIGGER_OUTCOME_CREATED"), each {"decision":"accept","reason_type":"classifier"}.
This session (auto, no allow-list): create_trigger 9/9 passed (rows 6/10, 7 x4, 7b, 9, plus send_later).
Result: passes under auto both ways, but it is ALWAYS a classifier decision; the allow-list did not turn it into a rule decision. Server limit: about 5 creations per minute per account.
Details: ../4/allowlisted-vs-control.md
