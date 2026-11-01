# Row 3a try 2 — extra_allowed_tools with Bash rules — 2026-11-01T15:31Z — Claude Code 2.1.316
create_session(permission_mode=default, model=claude-haiku-5-5, extra_allowed_tools=["Bash(touch /tmp/row3a-listed && echo listed-ok)","Bash(touch:*)","Skill"])
-> session_01RAN5eo78KgkiyDtGKZFgkZ (depth 2). create_session response carried no list of dropped/kept entries.
Parent's own pre-approved rules (launcher-settings.json permissions.allow) = ["Skill"] only, so per docs the two Bash entries should be dropped.
list_events raw:
 control_request f3a55b26-...: {"request":{"mode":"default","subtype":"set_permission_mode"}}
 tool_result toolu_016rzTRuxHipaT9m3iksS1Rp stdout "listed-ok"   permission_decision {"decision":"accept","reason_type":"rule","source":"config"}
 tool_result toolu_01NZkPq2fnoUKGwYkrGDWtZc stdout "unlisted-ok" permission_decision {"decision":"accept","reason_type":"rule","source":"config"}
 result 8fdb53e4-a219-46c0-8f64-c157c953c2bf: "permission_denials":[]
