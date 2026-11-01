# Row 25 (added by BOB) — does a Bash allow rule change the reason type of a git push under auto? — 2026-11-01T18:00:58–18:01:04Z — Claude Code 2.1.316
WITH allow rule: probe session_01RAN5eksCs2Xnmj4pnmxeSa, branch probe/row25-allow, .claude/settings.json {"permissions":{"allow":["Bash(git push:*)"]}} (read by the probe at 18:00:58Z)
 git push origin HEAD:probe/row25-allow -> {"decision":"accept","reason_type":"classifier","source":"config"}; "To https://github.com/neobobkrause/process3-probes\n   911f578..1e6edb0  HEAD -> probe/row25-allow"
WITHOUT: probe session_01RAN5enuSMzs9smLgiAtdR4, branch probe/row25-none (no .claude: "ls: cannot access '.claude': No such file or directory")
 git push origin HEAD:probe/row25-none -> {"decision":"accept","reason_type":"classifier","source":"config"}; "382629d..4aa022c  HEAD -> probe/row25-none"
Result: NO. Both pushes passed and both were classifier decisions; the allow rule did not turn the push into a rule decision. This agrees with rows 3b and 4: project allow rules have no observed effect under auto in a cloud session.
