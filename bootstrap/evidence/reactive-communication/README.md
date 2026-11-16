# Reactive native inter-session communication: actual evidence

These are actual native current-tree child calls, not subprocess inference fixtures.
No schedule, account login, external API or provider credential was used.

| Trial | Native operation | Send to first observable processing |
| --- | --- | --- |
| Idle recipient, previously completed READY_IDLE | followup_task | 11.127 seconds |
| Already-running recipient, running confirmed by list_agents | send_message | 7.943 seconds |
| Idle replacement generation 2, same durable logical message | followup_task | 14.319 seconds after replacement wake; 52.072 seconds after original send, including replacement preparation |
| Already-running recipient, production race-safe route | followup_task | 9.917 seconds |

The last trial deliberately held the recipient's **final response** until the sender
sent RELEASE_FINAL. The native call returned and the sender performed independent
work while the recipient was still waiting. Sending did not await a response.

Timing boundary: sender's host monotonic timestamp is recorded immediately before
issuing the native collaboration operation; receiver records its first observable
shell action. This includes sender/recipient model scheduling and tool delays and
is an upper bound on processing start, not a platform-internal dispatch timestamp.
The sender-return shell timestamp likewise includes model/tool delay; it is **not**
precise RPC latency and must not be presented as such. Raw files are preserved.

The replacement trial durably saved replaced-one, delivered it without ack to the
old generation, interrupted that running recipient, registered generation 2 and
woke its previously idle replacement. The replacement read the same logical
message, acknowledged once, and confirmed repeated acknowledgement returns false.
This is idempotent logical acknowledgement, not exactly-once arbitrary side effects.

Production transport uses followup_task for both states: the native service starts
an idle child or steers a running child. Selecting send_message from an earlier
running observation has a running-to-idle race: send_message alone does not wake
an idle recipient. The helper rejects that nonwaking delivery route in production.
Messages remain pending until acknowledged and survive recipient generation changes.
The hosted ROOT/ARCH invokes the native tool intent; Python does not invent or call
a private Cloud task endpoint. Its state operations integrate with the existing
native GitHub-backed CAS controller.

Platform scope: native collaboration tools target existing non-root agents in the
current agent tree. This demonstrates reactive idle-child wake and active-child
delivery. It does not establish arbitrary unrelated Cloud-chat wake or a top-level
ROOT-targeting message API. No supported such interface is exposed in this tool
catalog. Standing ROOT and its native children can use the demonstrated route.

Sources are the actual collaboration tool contracts: followup_task triggers a turn
for an idle non-root target and delivers to a running target at message boundaries;
send_message queues a message and does not trigger a new turn. list_agents confirmed
the relevant recipient state, and interrupt_agent returned previous_status running.
Documentation: https://learn.chatgpt.com/docs/agent-configuration/subagents .

`mailbox-unit-tests.txt` contains six separate process-tool regression fixtures.
They are not included in the native timings as inference evidence. The actual
native action/receipt report is `actual-native-timings.json`.
