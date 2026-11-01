# Row 2 — which child modes an auto parent (depth 1) may create — 2026-11-01T15:28Z — Claude Code 2.1.316
Caller: session_01RAN5epJ4BCt7hVutyakDTM (auto, depth 1). Each call: prompt "Reply OK and end your turn.", model claude-haiku-5-5, tags [phase-0-probe].

## permission_mode=dontAsk  (15:27Z) — refused by SERVER
permission_mode "dontAsk" exceeds parent session's "auto"; omit to inherit

## permission_mode=bypassPermissions (15:28Z) — refused by auto-mode CLASSIFIER (never reached server)
Permission for this action was denied by the Claude Code auto mode classifier. Reason: [Create Unsafe Agents]. If you have other tasks that don't depend on this action, continue working on those. IMPORTANT: You *may* attempt to accomplish this action using other tools ... To allow this type of action in the future, the user can add a permission rule for mcp__claude-code-remote__create_session to their settings.

## permission_mode=acceptEdits (15:28:03Z) — created
{"ccr":{"id":"session_01RAN5ekomjBsK6AT3gANFMQ","title":"p0-row2-acceptEdits-child-of-auto","session_status":"SESSION_STATUS_PENDING","created_at":"2026-11-01T15:28:03.071252Z",...,"parent_session_id":"session_01RAN5epJ4BCt7hVutyakDTM","configured_model":"claude-haiku-5-5"}}

## permission_mode=default (15:28:03Z) — created
{"ccr":{"id":"session_01RAN5ekfio64ECoGNbkjALZ","title":"p0-row2-default-child-of-auto",...,"parent_session_id":"session_01RAN5epJ4BCt7hVutyakDTM","configured_model":"claude-haiku-5-5"}}

## BOB (parent, depth 0) read via get_session at 15:27:47Z
"origin":"web_claude_ai","permission_mode":"PERMISSION_MODE_AUTO"  -> no dontAsk session exists anywhere in this tree.

## Bob's answer (relayed by BOB, message queued 2026-11-01T16:20:52Z)
"the app's permission menu for a new session offers only Auto, Accept edits and Plan; there is no Don't ask (screenshot seen 1 Nov)."
-> Row 2 REFUSED on both routes: no dontAsk from an auto parent (server), no dontAsk from the app (not offered). No dontAsk session can exist on this account.
