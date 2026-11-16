# Parent notification assessment — actual native child surface

Requirement: a child submitting a message to retained, idle top-level ROOT must
promptly start a ROOT turn; an active recipient queues/processes it; submission
must not wait for the recipient response. Periodic wakes do not satisfy this.

Acceptance requires actual callable availability, a source-verified send and ROOT
first-processing receipt after ROOT final, plus independent sender progress.
Nothing below claims that missing execution proof.

## A. Direct native parent notification

Actor `/root/parent_notify_assessment` inspected its actual deferred tool inventory
and directly provided collaboration contracts. No `notify_parent` or equivalent
parent-idle-wake tool matched. `send_message` explicitly does not trigger an idle
turn. `followup_task` starts/steers existing non-root sessions, excluding ROOT.
Parent delivery of child messages/results is available while ROOT executes; this
assessment's messages used that active path. A result delivered to a mailbox does
not establish that an ended parent turn is restarted. `wait_agent` is a current
turn waiting, not a new-turn operation.

No missing tool was invoked under a guessed name. No speculative after-final ROOT
trial or latency number was fabricated. This is an availability finding for this
child surface, not a claim about every OpenAI product or execution context.

The current [official subagents documentation](https://learn.chatgpt.com/docs/agent-configuration/subagents.md)
explains hosted delegation, orchestration and inherited tools. Its current markdown
has no `notify_parent` or idle-parent wake contract. Search results do not establish
a new callable capability. The previously measured child idle/active/replacement
wake results remain valid and were not repeated.

## B. Lifecycle arrangements

The existing native tree keeps ROOT at depth1, ARCH/coordinator at depth2, JOBs at
depth3. Reactive wake/steering among addressable non-root sessions works; the top
ROOT exception remains. Role responsibilities and grants are preserved.

A retained ROOT-role child under an owner-bridge chat would itself be addressable
by followup. A literal bridge→ROOT-child→ARCH→JOB tree adds a fourth native level.
Flattening ARCH beside that ROOT-child preserves depth but then the ROOT child
cannot create ARCH as its sibling using native spawn; involving an idle bridge
reintroduces the missing wake. Moving JOB creation out of ARCH, or combining ROOT
and ARCH, changes functional authority. These are analyzed alternatives, not
adopted mappings. Merely renaming a child ROOT does not satisfy the existing
standing top-level ROOT requirement.

Keeping the current ROOT in an active event wait permits immediate mailbox
processing for that turn and preserves roles/depth. It does not guarantee unlimited
turn lifetime or wake after final. It is a clearly bounded active-turn option,
not an unattended idle-wake solution.

## C. Other supported event facilities

The installed `codex-cli 0.167.0-alpha.4` exposes `codex queue` (inspected help only).
The [official command reference](https://learn.chatgpt.com/docs/developer-commands.md)
documents text queueing to an existing session UUID/name. Optional resume requires
a local daemon or explicit remote app-server; failed resume can still exit zero.
The command is real, unlike a guessed task API. However, the current native tools
supply no verified app-server endpoint or CLI session identity binding this standing
ROOT chat. A chat/automation UUID or `/root` agent path must not be guessed to be a
CLI thread selector. No queue/resume, new server, credential read or inference was
started. The missing prerequisite is a supported current-hosted-chat binding and
execution/funding route, followed by actual receiver-side proof.

`codex agents --help` offers local/explicit-remote app-server selection. `codex
cloud --help` lists exec/status/list/apply/diff, with no existing-chat message/wake
command. App-server help offers transports for a server process, not a documented
attachment to the managed top-level chat. The [app-server documentation](https://learn.chatgpt.com/docs/app-server.md)
concerns building clients to such a server, not automatic reachability of this
standing ROOT. Direct HTTP source retrieval was blocked by the shell proxy; the
available official web-search/open tool provided the documentation instead.

[Event-triggered scheduled tasks](https://learn.chatgpt.com/docs/automations.md)
are documented for supported app activity, but this child inventory still lacks
webhook discovery/create-trigger parameters. No event task was created. More
fundamentally, the owner prohibits using GitHub as the routine message bus without
explicit justification/approval; that path is not the preferred alternative.
PR-trigger aggregation/delays are not a proven general session-message contract.

## D. Bounded fallback and next prerequisite

Child-to-child/child-supervisor non-root followup remains reactive; sender need not
wait for a response. Child-to-active-ROOT message/result delivery is available.
After ROOT final, current evidence supports scheduled same-chat continuation only,
not reactive parent notification. No schedule is relabeled as message transport.

Actual command/inventory observations are in
`../evidence/parent-notification/actual-availability.json`. There were zero GitHub
transport writes for this assessment. Only this bounded implementation assessment
and compact evidence artifact are proposed for repository preservation, not a log
file/commit per routine message.

## Bounded automatic-final candidate protocol (pending)

Available automatic child FINAL delivery is a separate candidate from unavailable
notify_parent. ROOT will end its turn while one delayed child remains active. That
child waits45seconds using an ordinary harmless shell command, records a local
completion timestamp, and sends its normal final marker without a parent-response
wait. No GitHub transport operation is involved.

The existing self-owned automation will temporarily provide one independent
inspection around3minutes later, then return to its10minute continuation schedule.
It is a measurement backstop, not the candidate transport. No duplicate timer is
created. A new ROOT turn attributable only to child completion, after the preceding
ROOT final and before inspection, is positive evidence for completion-triggered
parent wake only. A turn first triggered by the inspection is not reactive wake.
No observed wake within that bounded window is not proof of universal platform
absence. If the child never completes after parent final, report that lifecycle
outcome separately rather than blaming message delivery. Other user/scheduler/agent
entry during the window makes attribution ambiguous. First ROOT action records
actual entry source and time; do not infer it from scheduled backend counters.

Even a positive result would not prove arbitrary mid-turn parent notifications or
unlimited session lifetime. Assess reuse and functional implications before adoption.
