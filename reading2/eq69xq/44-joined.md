# [file] draft-approvals-split-8nov.md (continued)


One exception to the paragraph above: the process's scheduled branch cleanup workflow, running in this repository, may delete branches whose commits are all in the tranche, and the merge train's train/head/* branches whose pull request is closed; never main, the tranche or the state branch, a branch with an open pull request, or one with a commit in the last 2 hours.

## C. process3-probes

### Standing approvals from Bob (paste as "## ")

Standing approvals from Bob for process3-probes, the process's test bed, restated on 8 Nov 2026 for this repository only. They cover every Claude session working in this repository, including sessions that other sessions started. Such sessions may, without asking me: start, message, interrupt and archive Claude sessions working on Process3 or on a product developed with it, on the Claude account the acting session itself runs under; subscribe to and unsubscribe from activity on the process's pull requests; create, switch off and delete the process's scheduled tasks on that account; and notify me by push notification.

In this repository, neobobkrause/process3-probes, only, they may: push to their own working branches and to the process's state branch; create tranche branches from main; open, edit, comment on, review without approving, mark ready or draft, close and reopen pull requests; through the process's merge tool, merge pull requests into working and tranche branches once its gate and their required checks pass, without a person's review, and merge the tranche's pull request into main the same way; run builds and tests, fetching public packages and images for them; run, re-run and cancel this repository's own workflows; and change its workflow files only through pull requests the merge tool merges after a green gate, never adding or renaming a job whose name matches a required check, never widening any workflow's or job's permissions, never adding a pull_request_target trigger, and never making the process gate anything but the process's own shim at the pinned process.

They may never: force-push; delete a branch, tag or release, or choose the delete-branch option when merging; change permission, repository or ruleset settings, or a protected environment; push to main except through the tranche's pull request; cut or publish any release; reveal any secret value; or act on any account or service other than those named here. Reading public documentation and fetching public packages and images are not acts on another service.

One exception to the paragraph above: the process's scheduled branch cleanup workflow, running in this repository, may delete branches whose commits are all in the tranche, and the merge train's train/head/* branches whose pull request is closed; never main, the tranche or the state branch, a branch with an open pull request, or one with a commit in the last 2 hours.

Commit order: A (copy), then B (process3), then C (probes).


# [file] codex_design_conversation_register_20261117.md

# Codex Process4 — design register from extended owner discussion

**Status:** Assistant-authored synthesis for research/navigation, NOT owner words and NOT an approved replacement definition. The exact owner-word source is `../owner_words/bob_words_16_17nov_codex_development.md`, alongside `../owner_words/bob_words_17nov_codex_context.md`. The sixth definition remains a draft. Read primary sources before taking action; this register is NOT a substitute for required complete canon reading.

## Operating constraints and approvals

| Subject | Design implication | Authority/proof |
| --- | --- | --- |
| Mission | Produce correct durable behavior faithful to the hierarchy of mission, principles, standards, requirements and design rulings | Owner words; existing canon |
| Owner role | Owner decides doctrine, approvals and genuine account matters; sessions decide ordinary technical choices without repeated questions | Owner direct words |
| Autonomy | Continue unfinished work until all possible independent work is exhausted; passing tests, a draft PR or empty queue does not finish a larger assignment | Owner corrections after premature stops |
| Economics | OpenAI-hosted execution under subscription, no extra VM hosting or metered Agents/API fallback | Owner rejection of third-party VM |
| Experiment scope | Use process3-probes for writes; preserve CivicSmith2 pause and the Claude Code implementation | Owner approvals and scope |
| Tests | Only three product stages: module tests, internal Screens walk, external Journeys walk | Owner standing decision |
| Notifications | Every declared consumer of a changed provider must receive notice; prior selective interface-change filter is superseded | Owner later decision |
| Model | GPT-6 or later, with actually verified >=1M context window in the hosted execution context | Owner 17 November exact words |
| Context strategy | Avoid compaction through bounded complete reading sets, limited handoffs/principles, context-triggered refresh and targeted workers | Owner 17 November exact words |

## Session roles and interaction

- Coordinator is the normal front door, but the owner also needs meaningful sustained dialogue with ARCH, design lanes and PROCESS. A coordinator must not reinterpret or manufacture the owner's approval.
- ROOT is the standing lifecycle supervisor, not the product architect. Owner approved an addressable ROOT-child arrangement for the experimental Codex runtime: owner console/safety at top level; ROOT child; ARCH and coordinator beneath ROOT; jobs beneath ARCH; watcher beside ROOT. This does NOT prove instant idle console wake.
- Design lanes own scoped design knowledge, qualify themselves against relevant canon, carry ongoing design discussions and may be replaced without losing authoritative decisions. PROCESS is the special owner-facing cross-product change lane; adoption still requires the owner's prior approval.
- Jobs are ordinarily inspected for assignment, progress, blockers, tests and PRs. A retained job can have subsequent interactions, but short-scope worker/subagents do not need to stay alive after completing their charter.
- Completion of a turn, completion of an assignment, idle availability, session refresh, replacement, archival and deliberate retirement are different states. A standing logical role persists across instance replacements.
- Visibility in the web Subagents list is NOT proof of direct user interaction. The latest probe demonstrates role-targeted dialogue **through the owner console**, not a separate interactive composer for every child. The user still wants convenient substantive role access.
- Product-oriented ChatGPT/Codex Projects are an organization option raised as a question, NOT an adopted platform mapping. Native child membership needs verification.
- Archiving should occur only once an instance is inactive and responsibilities are transferred; transcripts must remain retrievable and, where supported, unarchivable. Verify native child lifecycle separately from top-level Codex chats.

## Messaging, durable state and cost

- Messages to idle addressable sessions should reactivate them promptly; active sessions handle or durably queue messages; senders do not block waiting for final responses. Hourly/ten-minute safety continuation is not reactive transport.
- The native `followup_task` experiments in process3-probes measured about 8–14 seconds to initial observable processing for child recipients, including replacement. These measurements do not establish a universal latency SLA or idle top-level-console wake.
- Avoid GitHub as high-frequency inter-session transport or bookkeeping: no file/commit/PR-comment per message, acknowledgement or heartbeat. Owner has experienced thousands of persistent unwanted repository artifacts.
- Prefer native reactive transport plus bounded transient local state. Keep only meaningful accepted work, owner decisions, role/checkpoint state and outstanding provider obligations durable. Distinguish loss of disposable chatter from loss of authoritative decisions.
- Limit process state volume and Git history growth over time; record metrics, not a torrent of routine events.

## Grants and security calibrated to requirements

- Examine CLAUDE.md and .claude/settings.json and effective provider rules as the baseline, but do not copy Claude syntax into Codex uncritically or infer new owner approval.
- Ordinary jobs are instructed to edit only their module and tests. Strong OS-enforced file sandboxing is desirable but NOT the prerequisite; verify actual changes and reject ownership violations before integration.
- Keep strong, independently backed restrictions for public releases, accounts, secrets, grants, repository settings, protected refs and production resources. The native controller may be bypassable by inherited raw tools: describe exactly which restrictions the controller, provider, or model instruction enforces.
- No owner approval for a new public release, process adoption or broadened grant may be created by an assistant paraphrase.

## Canon fidelity and context management

- Canon extends through several conceptual/meta-levels. A local implementation convenience cannot overrule the mission, normative principles, design standards, owner rulings, scoped product requirements or binding architectural decisions.
- Read full authoritative reading sets; a successful shell/file command is NOT proof the entire source reached model context. Measure actual delivered text/bytes, truncation and automatic instruction-loading limits.
- Proactively refresh before automatic compaction. Do not assume API-advertised million-token capacity or Codex CLI compaction controls apply to every subscription-hosted native subagent.
- Bound handoff sizes and preserve exact decisions, current owner instructions, source versions, incomplete work and unresolved normative conflicts. Handoffs are navigators to the canon, never authoritative substitutes.
- Use targeted research workers with exact source sets and bounded outputs to protect parent context. Workers can also make delegated **material technical decisions**; require appropriate authority, source coverage, provenance and conflict reporting.
- A proposed canon authority map should identify the actual versioned sources, scope and precedence, not restate or replace their contents. Research this before changing governing definitions.
- Preserve an independent dedicated Codex context-fidelity research effort; use documented behavior plus real native experiments to establish refresh thresholds, scan hazards, and archival semantics.

## Experimental evidence and important limits

- Native probe branch: `neobobkrause/process3-probes` at `codex/p4-grants-broker-20261116`, particularly `bootstrap/HANDOFF.md`, `bootstrap/native/READINESS-DETERMINATION.md` and `bootstrap/native/INTERACTIVE-SESSIONS.md`.
- The probe has demonstrated bounded multiagent development, reactive child messaging, integration, two product walks, owner-control exercises and extended interaction through the console. Do not promote those bounded findings into proof of indefinite operation or direct composer availability.
- Unexpected real service errors can require replacement. Distinguish environmental failures from ordinary account-revocation conditions; never require repeated ephemeral nested Codex sign-in as the normal lifecycle.
- Existing Claude support and active public product sites remain untouched by Codex experimentation.

## Questions still to resolve rather than silently decide

1. Actual usable native model/context metrics and proactive refresh policy with no compaction-induced canon loss.
2. Complete, measurable read coverage and canon authority map implementation.
3. Direct interactive child thread UI versus owner-console routing; organization by product and archived native child discoverability.
