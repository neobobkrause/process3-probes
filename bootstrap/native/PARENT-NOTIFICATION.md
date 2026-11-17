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

The existing native tree uses zero-indexed depths ROOT0, ARCH/coordinator1,
JOB2. Addressable non-root paths are reactive; the native top-level ROOT exception
remains. The earlier statement that a bridge→ROOT-child→ARCH→JOB tree necessarily
violates a three-node limit was our lossy reading, not an established platform or
owner prohibition. See the source-counting correction and explicit fixture proposal
below. No alternative operating hierarchy has been adopted.

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

Arming correction: the3minute one-off scheduling attempt returned unexpected error;
read-back confirmed no schedule change. A prompt-only update succeeded on the
existing enabled10minute schedule, with next inspection14:23:30America/Los_Angeles.
Use that independent inspection instead; no duplicate timer or extra frequency.


### C addendum: one actual local daemon binding probe

The installed `codex app-server daemon --help` exposes no `status` command, but
its `version` subcommand explicitly reports local CLI/running-server versions.
After reviewing that help, one `codex app-server daemon version` was run as a
read-only local availability check. It exited1 because the default control socket
`/home/agent/.codex/app-server-control/app-server-control.sock` did not exist.
There was no authentication request. No daemon start, queue/resume, account call,
credential/config-value read, endpoint scan or repeated failed probe was attempted.

This establishes that the documented default local daemon connection was unavailable
at the time of this probe. It does not establish absence of every remote/nondefault
server, and does not establish that any such server would own this managed ROOT
chat or use the approved subscription execution route. `codex queue` therefore
remains a documented client capability with a missing current-hosted-ROOT binding,
not a tested ROOT wake solution. The exact next prerequisite is an officially
exposed connection/selector mapping this managed session to a supported server and
thread. Do not infer that mapping from a chat UUID, agent path or environment ID.

The [official daemon/NFS guidance](https://learn.chatgpt.com/docs/environments/network-file-systems)
explains that a background daemon's Unix socket is local to its host. No new daemon
or alternate authentication source was introduced to manufacture reachability.
Compact actual output and execution boundaries were added to the existing
`actual-availability.json`, rather than creating per-operation GitHub artifacts.

### After-final observation criteria

A child final-result trial can test the already available automatic parent-delivery
mechanism even though that contract promises no idle-parent turn start. A positive
requires an actual ROOT new turn after its preceding final and before any scheduled
inspection, attributable to the child result. A notification first presented during
a scheduled inspection proves eventual delivery, not reactive idle wake. No unaided
new turn observed in a bounded window is a bounded negative, not universal absence.
The inspection schedule is an observation fallback, never the message transport.


## B addendum: source-counting correction and reviewable fixture proposal

### Governing depth and identity facts

The source distinguishes depth from node count. In process3's process4 research
at commit `c11682ccf903dff83f09c7505fc366760481f2ad`, evidence/ledger_lines.md PLT-5
records the chain coordinator→ROOT→BOB→job at zero-indexed depth3. The coordinator's
attribution is not direct owner-typed text; evidence/permissions_inventory.md's
Depth row independently describes starts at depths0–2, bounded at3. The v6 draft
says three levels, while our REQUIREMENTS summary compressed it to three nodes.
The latter must not create an invented technical blocker. A four-node chain can
stay within the historical zero-indexed depth3 bound.

The other requirements do remain: ROOT is the owner's first started supervisory
session; ROOT and coordinator are distinct; ROOT starts ARCH/coordinator; ARCH
starts JOBs; no session starts its own replacement; coordinator is the owner's
front door. Native depth compliance does not by itself settle those identity and
communication semantics.

### Proposal: a segregated capability fixture, not operating adoption

The latest owner guidance authorizes supported alternative investigation and small
experiments after analysis. A bounded read-only fixture can test the arrangement
without changing live Process4 role addresses, owner grants, product work or the
approved operating hierarchy. It needs no numerical-depth exception: its maximum
native depth is3. This is an experiment authorization assessment, not a declaration
that an extra logical owner-bridge role has been approved for normal operation.

Proposed tree (zero-indexed native depths):

- Depth0: existing owner-started chat, acting only as the fixture runner/owner console.
- Depth1: synthetic standing supervisory ROOT-role child.
- Depth2: synthetic ARCH and separate synthetic coordinator, created by that ROOT-role.
- Depth3: synthetic read-only JOB, created by ARCH.

Use explicit fixture identities and instruction boundaries. Do not register these
as replacements for the existing live ROOT/ARCH/coordinator/jobs. No source, branch,
PR, account, settings, grant, credential or provider mutation is needed. Temporary
local timing/receipt data may be bounded and collected into one meaningful evidence
artifact after the trial; GitHub is not its transport or operational event store.

### What this fixture would establish

1. ROOT-role starts ARCH/coordinator, then finishes a turn and is observably idle.
2. ARCH creates the depth3 JOB; JOB returns a bounded read-only result to ARCH.
3. ARCH uses the actual supported followup tool to the idle ancestor ROOT-role at
   depth1. Whether ancestor targeting is accepted must be executed, not inferred.
4. ROOT-role's first observable processing records source identity, generation and
   message ID. Measure send-to-first-action with host monotonic time. ARCH does
   independent work after submission and before receiving ROOT-role's final response.
5. The coordinator remains a distinct owner-front-door role: a synthetic owner
   question is answered without initiating product work; any fixture instruction
   is labeled synthetic and cannot become an actual owner grant.

The decisive new fact is descendant-to-idle-ancestor supervision with the full
role chain inside the historical depth bound. Generic child wake already works;
merely renaming a child ROOT or rerunning sibling timing would not add evidence.
A positive result would establish a native supervisory-role alternative, not wake
of the existing depth0 ROOT chat. A rejection would identify the actual supported
ancestor-targeting/lifecycle limit without changing the proven child mechanism.

### Responsibilities, owner front door and replacement tradeoffs

Product responsibility can remain with ARCH, ownership-limited implementation with
JOB, owner liaison with coordinator and liveness/session management with the
supervisory ROOT-role. Adding the console need not give any role a wider grant.
Native raw-tool availability remains inherited; this layout does not create a
credential security boundary.

The owner still talks through the existing depth0 chat UI. If adopted, that chat
would relay exact owner text/questions to the coordinator, not make product
choices or silently reinterpret questions as build authority. Returning an answer
or exceptional owner question while the console is idle still needs a user-visible
route or bounded scheduled continuation. Internal role reactivity does not prove
idle-console notification. Calling the console external does not remove its native
ancestor relationship or solve the native top-level wake problem.

For fixture ROOT-role replacement, the depth0 runner can create a distinct sibling
replacement at depth1, preserving generation/unfinished local fixture work. The
ROOT-role creates replacement ARCH/coordinator at depth2; ARCH creates replacement
JOB at depth3. No role creates itself or its successor. This can be tested only
when the runner is active; it does not prove unattended top-level replacement.
A watcher started beside the ROOT-role by the runner can reactively notify an
existing retained ROOT-role. Having that watcher create another ROOT underneath
it would increase future JOB depth to4, so that is not the proposed arrangement.
If the console is idle and the ROOT-role is gone rather than retained, replacement
still needs the console's safety wake or an exposed lifecycle operation. Deleted
whole-ROOT resurrection remains outside the required acceptance scope.

### Recommendation and decision boundary

Proceed with the segregated native depth3 read-only fixture as the next promising
technical experiment; retain the approved live hierarchy and all existing evidence.
Do not ask the owner for a numeric-depth exception that the underlying source does
not require. Do not present the layout as already approved operating Process4 or
claim that the original top-level ROOT is awakened.

Before any normal-operation transition, present the measured result and explicit
identity mapping. Treat adoption as a process/identity decision if it redefines the
owner-started first ROOT or the owner's coordinator front door. The latest guidance
allows analyzed investigation; it does not silently convert a newly introduced
console role into an owner-authored process requirement. That is a governance
boundary, not an unsupported-tool conclusion. Any remaining adoption question
should be narrow and reviewable after the fixture, with a recommendation based on
what it actually demonstrates.

## Executed results and reviewable alternative

The after-final trial completed its harmless delay and prepared a result about72s
before the next ROOT entry. That entry was the scheduled inspection; the child
FINAL became visible after it started. No unaided wake was observed in this bounded
window. Exact server final-dispatch time is unknown; do not infer universal absence.
See actual-after-final-result.json.

The segregated zero-indexed depth3 supervisory fixture succeeded: retained JOB woke
idle supervisory ancestor11.139s; active console interrupted/replaced that role,
retained ARCH/JOB addresses remained usable, and JOB woke idle replacement13.542s.
The coordinator answered a synthetic question without product work. Existing topROOT
was not awakened by these events. Read ROOT-LAYOUT-PROPOSAL.md for measured evidence,
owner-frontdoor/replacement limits and the narrow ROOT-identity adoption decision.
