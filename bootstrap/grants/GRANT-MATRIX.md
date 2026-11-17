# Process4 Codex grant matrix (proposal, NOT owner approval)

This is an engineering specification derived from the historical Claude approvals.
It does not alter any standing approval, repository setting, or live grant.

| Principal | Controller-granted operation | Explicit prohibition |
| --- | --- | --- |
| ROOT | Start/replace ARCH, coordinator, watcher, PROCESS; update durable role state | No product edits or public release |
| WATCHER | Verify failed parent; replace ROOT under validated generation | No self-grants or product write |
| COORDINATOR | Owner instructions, status, stop, priority and role messages | No owner-approval fabrication or deployment |
| ARCH | Assign job/lane, merge verified jobs, request restricted development deployment | No unchecked merge or policy edit |
| JOB | Update assigned paths on assigned branch, manage its draft PR | No unrelated files, merge, other sessions or deployment |
| LANE | Edit its assigned design-area paths through its own branch | No broad product change or process authority |
| PROCESS | Propose process changes; prepare implementation in its assigned scope | No self-approved process adoption |
| WORKER | Research and bounded delegated computation | No direct privileged external action |
| Credential manager (non-agent) | Renew authorized ChatGPT subscription access and recover protected credentials | No raw refresh token in jobs, git, or logs |

## Authority and invariant details

Owner-authored grants are the authority, not an agent-authored AGENTS.md. The approved
source and its pinned digest must be protected outside every development job.

Authorized development infrastructure must be separated by exact account and resource
scope. 'All test data is throwaway' never widens account or public-site grants.

Public releases and modifications to owner grants require owner authorization. Routine
module tests, working-branch updates, message routing, recovery and safe development
operations may be unattended when the authenticated role's grants allow them.

The Process4 product tests remain exactly module tests, internal walk and external walk.
Provider changes notify EVERY declared user, even when an interface change is not proven.

## Next live verification

With job credentials absent and host isolation active, exercise approved job writes and
denied wrong branch/module/API actions; verify ARCH's gated merges, protected releases,
Cloudflare resource restrictions and role replacement without permission escalation.
Do not claim success based on a passing policy unit test or a model's own refusal.