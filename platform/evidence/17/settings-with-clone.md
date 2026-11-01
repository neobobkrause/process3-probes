# Row 17 — settings + skills load when the repo holds a pinned clone at .process/ — 2026-11-01T15:41Z — Claude Code 2.1.316
Branch probe/row17 (commit 1d2bc64): .claude/settings.json deny ["Bash(touch /tmp/row17-denied*)","mcp__claude-code-remote__list_sessions"]; skill .claude/skills/row17-probe-skill (code word PELICAN-17); .process = git submodule of this repo pinned at ba1eb246f490fbe4533d1f6ec12952c00f1a1fd3 (git ls-tree: "160000 commit ba1eb24... .process").
Probe session_01RAN5engftwdXa9g6wDjmRu (auto, haiku, depth 2, source_revision probe/row17).
list_events raw excerpts:
 1 `ls -la .process; git submodule status` -> .process exists but EMPTY; "-ba1eb246f490fbe4533d1f6ec12952c00f1a1fd3 .process" (leading '-' = not initialised). The cloud checkout does NOT populate submodules.
 2 `touch /tmp/row17-denied-1 && echo touched` -> "non_execution_kind":"permission-rule", {"decision":"reject","reason_type":"subcommandResults"}: "Permission to use Bash with command touch /tmp/row17-denied-1 && echo touched has been denied."
 3 list_sessions -> ToolSearch "select:mcp__claude-code-remote__list_sessions" -> "No matching deferred tools found" (removed by deny rule)
 4 `touch /tmp/row17-free && echo free-ok` -> "free-ok" (classifier accept)
 5 Skill row17-probe-skill -> "Launching skill: row17-probe-skill" (rule accept); skill text "Reply with exactly the code word: PELICAN-17."
 6 `git submodule update --init .process && git -C .process rev-parse HEAD` -> "Submodule path '.process': checked out 'ba1eb246f490fbe4533d1f6ec12952c00f1a1fd3'" then `touch /tmp/row17-denied-2 && echo touched2` -> denied (same text pattern).
 result bbf525c5-88e7-4597-bc2a-fe4996fa0e28: permission_denials = the two touch commands.
Result: PASS for settings and skills (deny fires before and after the clone is populated; skill loads). Caveat: a submodule-pinned clone arrives EMPTY; the session (or a SessionStart hook) must run `git submodule update --init .process` itself. Cloning into the session needed no extra permission (classifier allowed it under auto).
