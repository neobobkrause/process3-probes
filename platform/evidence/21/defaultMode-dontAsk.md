# Row 21 (BOB's "new row 20"; numbered 21 because 20 is taken) — start in dontAsk through project settings — 2026-11-01T16:25Z — Claude Code 2.1.316
Branch probe/row21 (commit 1999580) .claude/settings.json:
{"permissions":{"defaultMode":"dontAsk","allow":["Bash(touch /tmp/row21-listed)","mcp__claude-code-remote__create_session"],"deny":["Bash(rm:*)"]}}
Probe session_01RAN5eoG2rCJs29qSVmrF9C, create_session with mode omitted, source_revision probe/row21. list_events raw:
 control_request f134903c-... (16:25:01.325Z): {"request":{"mode":"auto","subtype":"set_permission_mode"}}   <- platform sets AUTO at start
 get_session (own): "session_context":{...,"permission_mode":"auto"},"permission_mode":"PERMISSION_MODE_AUTO", external_metadata.permission_mode "auto", "lineage":{"depth":2,"limit":8}
 Bash `touch /tmp/row21-listed` (listed) -> ran, permission_decision {"decision":"accept","reason_type":"classifier"}
 Bash `touch /tmp/row21-unlisted` (NOT listed; under dontAsk it would be denied) -> ran, {"decision":"accept","reason_type":"classifier"}
 create_session (listed) -> {"decision":"accept","reason_type":"classifier"} -> child session_01RAN5eogWWnQCni7tEH6by3, parent session_01RAN5eoG2rCJs29qSVmrF9C (depth 3)
 result 68d4cac9-4862-4cb3-b846-4329f671039f: "permission_denials":[]
Result: REFUSED (silently) — defaultMode "dontAsk" in project settings is ignored; the session runs in auto and every act goes to the classifier. Matches read_documentation session.permissions: "Cloud sessions also ignore defaultMode \"bypassPermissions\" and \"dontAsk\" in a settings file."
Child mode: auto (inherited; the probe passed no permission_mode).
