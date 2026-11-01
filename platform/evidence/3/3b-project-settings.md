# Row 3b — project .claude/settings.json on branch probe/row3b — 2026-11-01T15:41Z — Claude Code 2.1.316
Branch probe/row3b (commit aaf47fc) .claude/settings.json:
{"permissions":{"allow":["mcp__claude-code-remote__list_triggers","mcp__github__get_me"],
 "deny":["mcp__claude-code-remote__list_sessions","mcp__claude-code-remote__send_message","mcp__github__list_branches","Bash(touch:*)"]}}
Probe session_01RAN5em1ipwnvXVNpwEvTMd (AUTO, inherited; haiku; depth 2; source_url process3-probes, source_revision probe/row3b).
list_events raw excerpts:
 1 list_triggers (allow-listed): tool_result toolu_018KciEDZ8dQGYiugAPKp8Jy ran; permission_decision {"decision":"accept","reason_type":"rule","source":"config"}
 2 list_sessions (deny-listed): ToolSearch "select:mcp__claude-code-remote__list_sessions,mcp__claude-code-remote__send_message,mcp__github__get_me,mcp__github__list_branches" -> "matches":["mcp__github__get_me"] only. The denied tools are REMOVED from the tool set; never callable.
 3 send_message (deny-listed): same — not present; no message reached me.
 4 mcp__github__get_me (allow-listed): ran, permission_decision {"decision":"accept","reason_type":"rule","source":"config"}; returned {"login":"neobobkrause","id":2256359,...}  <-- NOTE: probe's GitHub identity is neobobkrause, mine is civicsmith (see row 18)
 5 mcp__github__list_branches (deny-listed): not present in tool set.
 6 Bash `touch /tmp/row3b-denied && echo touched` (deny Bash(touch:*)): tool_result toolu_014fwB12nxYCrL5e5temJd2M, "non_execution_kind":"permission-rule", permission_decision {"decision":"reject","reason_type":"subcommandResults","source":"config"}, raw:
    Permission to use Bash with command touch /tmp/row3b-denied && echo touched has been denied.
 7 Bash `date -u` (unlisted): ran; permission_decision {"decision":"accept","reason_type":"classifier","source":"config"}   <-- unlisted acts fall to the auto classifier
 8 Bash `cat .claude/settings.json`: ran (classifier) — file present as committed.
 result 6449306c-d5e6-4f7b-b316-2485f0912fd2: "permission_denials":[{"tool_name":"Bash","tool_input":{"command":"touch /tmp/row3b-denied && echo touched",...}}]
Result: PASS — project settings load in a cloud session; allow rules turn listed acts into rule decisions (no classifier); deny rules on MCP tools (remote + GitHub) remove the tools; deny on Bash prefix blocks.

## CORRECTION (2026-11-01T16:22Z) — allow rules showed no effect
Control probe session_01RAN5eoA9PP4mi9hGEdZFmh (auto, haiku, main branch, NO project settings):
 mcp__github__get_me -> permission_decision {"decision":"accept","reason_type":"rule","source":"config"}; login neobobkrause
 mcp__claude-code-remote__list_triggers -> {"decision":"accept","reason_type":"rule","source":"config"}
So get_me and list_triggers are rule-allowed by the platform anyway; the "rule" decisions above do not prove the project allow-list worked.
Row 4 (../4/allowlisted-vs-control.md): with archive_session / update_trigger / delete_trigger / create_trigger allow-listed in project settings, every decision was still reason_type "classifier".
=> Project DENY rules work (tool removed, Bash prefix blocked). Project ALLOW rules had no observed effect under auto in a cloud session.
