# Row 13 — PR create / comment / mark ready / merge by the GitHub MCP tools — 2026-11-01T15:44Z — Claude Code 2.1.316
A) From THIS session (identity civicsmith): mcp__github__create_pull_request (head probe/row13-throwaway, base main, draft) at 15:44Z -> "Error POSTing to endpoint: invalid session". (All my GitHub MCP calls fail this way since the permission change; see row 18.)
B) From probe session_01RAN5ek7hTahFqv2X51xQJC (auto, haiku, depth 2, source neobobkrause/process3-probes; GitHub MCP identity neobobkrause). Result event e2a4e4ed-5201-4977-84fe-543eded31815 (15:45:03Z), "permission_denials":[], raw text:
 1. create_pull_request: passed. PR #1, url https://github.com/neobobkrause/process3-probes/pull/1, created as a draft.
 2. add_issue_comment: passed on PR #1. Comment id 6560165297.
 3. update_pull_request (draft false): passed.
 4. merge_pull_request (squash): passed. merged: true, sha 379d481884f715e235548a2d68fc970324f7b45d, "Pull Request successfully merged".
 5. get_me: login neobobkrause.
Cross-check by gh api (15:45Z):
 pulls/1 -> {"number":1,"state":"closed","draft":false,"merged":true,"merged_at":"2026-11-01T15:44:56Z","merge_commit_sha":"379d4818...","user":"neobobkrause","merged_by":"neobobkrause","created_at":"2026-11-01T15:44:43Z"}
 issues/1/events -> ready_for_review 15:44:49Z (neobobkrause); merged 15:44:56Z; closed 15:44:56Z
Result: PASS (4/4 acts) by GitHub MCP tools in a child session; none classifier-gated in that auto child (permission_denials empty). Note: the acts are attributed to neobobkrause (Bob's own GitHub account), not to a bot account.

## Why children act as neobobkrause and this session as civicsmith (BOB asked)
Not explained by any tool result. Observed only:
- This session (origin "claude_code_mcp_seed", created by BOB, source neobobkrause/process3-probes) -> get_me {"login":"civicsmith"}; gh api (proxy-injected credential for api.github.com) also acts with civicsmith's permissions (pull-only before Bob's change, admin after).
- Children created by this session with create_session + source_url (also origin "claude_code_mcp_seed") -> get_me {"login":"neobobkrause"}; PR #1 user, ready_for_review, merged_by = neobobkrause.
- BOB's own session record lists sources neobobkrause/neoprocess and civicsmith/process3-probes. A guess, not shown by any result: the GitHub credential is attached when a session is created, and this session got the civicsmith one.
