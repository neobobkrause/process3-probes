# Row 3a tries 3–5 — 2026-11-01T15:31–15:34Z — Claude Code 2.1.316
## Try 3: control, default mode, NO extra_allowed_tools — session_01RAN5ekkU44Sf18EN3GDY2e (depth 2)
 tool_result toolu_018xsQ5Kv8HEWK8XeqyktjkX (Bash touch) stdout "control-ok" permission_decision {"decision":"accept","reason_type":"rule","source":"config"}
 tool_result toolu_01RumRtaFhEfgUcJmz2kgQNA (WebFetch example.com) "Example Domain" permission_decision {"decision":"accept","reason_type":"rule","source":"config"}
 -> A default-mode cloud session already allows Bash/WebFetch/remote-MCP tools by a config rule. extra_allowed_tools cannot be observed in default mode.

## Try 4: auto child with extra_allowed_tools=["mcp__claude-code-remote__create_session"], prompt asked it to request bypassPermissions
 My create_session call itself was refused by MY classifier (15:33Z), raw:
 Permission for this action was denied by the Claude Code auto mode classifier. Reason: [Auto-Mode Bypass]. If you have other tasks ... To allow this type of action in the future, the user can add a permission rule for mcp__claude-code-remote__create_session to their settings.

## Try 5: auto children, act = archive_session on a finished probe (an act the classifier judges case by case)
 LISTED  — session_01RAN5ekoc4XzXGWccmFHa8h, extra_allowed_tools=["mcp__claude-code-remote__archive_session"], archived session_01RAN5ekomjBsK6AT3gANFMQ
   tool_result toolu_019CWCA2kjMWkfk1bD9xPZhB -> "session_status":"SESSION_STATUS_ARCHIVED"
   permission_decision {"decision":"accept","reason_type":"classifier","source":"config"}   <-- decided by CLASSIFIER, not by a rule
 UNLISTED — session_01RAN5enyEZmkverjbgRBgq3, no extra_allowed_tools, tried to archive session_01RAN5ekfio64ECoGNbkjALZ
   tool_result toolu_013MSEBHsdYAHA22227dT8au, "non_execution_kind":"automode-blocked", permission_decision {"decision":"reject","reason_type":"classifier","source":"config"}, raw:
   Permission for this action was denied by the Claude Code auto mode classifier. Reason: The server-side auto mode classifier judged this action dangerous (it gave no explanation). ... To allow this type of action in the future, the user can add a permission rule for mcp__claude-code-remote__archive_session to their settings.
   result 04a25f58-...: "permission_denials":[{"tool_input":{"session_id":"session_01RAN5ekfio64ECoGNbkjALZ"},"tool_name":"mcp__claude-code-remote__archive_session",...}]
 -> The listed entry did NOT become an allow rule in the child (reason_type "classifier", not "rule"). The parent (me) holds no grant for archive_session (my only pre-approved rule is "Skill"), so this matches the documented cap: entries the parent lacks are dropped. The create_session response gives no list of kept/dropped entries.
