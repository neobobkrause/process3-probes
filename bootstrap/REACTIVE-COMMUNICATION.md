# Reactive native communication — implementation and executed evidence

The owner requires prompt idle-recipient wake, active delivery/queueing,
nonblocking send and correct routing after replacement. The ROOT continuation
schedule is not the message transport and was not used in these latency trials.

## Implemented route

`native/communication.py` supplies a durable mailbox, stable logical recipients,
generation/address registration, message IDs, current-generation delivery intents,
submission records, and idempotent first-processing acknowledgement.
`native/cycle.py` stores that mailbox in the SAME GitHub-backed native-cycle state.
It does not keep an unrelated local delivery store or invent a platform API.

The hosted ARCH/controller performs these supported operations:

1. Enqueue the message in the durable state transaction.
2. Resolve the current native recipient and generation.
3. Invoke native `followup_task` immediately; it wakes an idle child or steers a
   running child. This call submits work, not a synchronous request/response wait.
4. Record the actual successful submission, not a guessed receipt.
5. Record acknowledgement only from the observed native actor event, matching
   current address/generation and exact logical message ID.

`send_message` can deliver to an already-running recipient, but does not start an
idle turn. A running-state check followed by send_message races with the recipient
ending its turn. Therefore production uses followup_task for BOTH activity states;
the native service makes the wake/steer choice. Fresh activity is recorded as
observation, not relied on as a guarantee that the recipient stayed active.

Unacknowledged messages survive replacement. New registration increments the
recipient generation; retry resolves the new address. Stale generation submissions
and acknowledgements are refused. Duplicate logical acknowledgement returns false.
This is durable at-least-once delivery with idempotent receipt, not an exactly-once
guarantee for arbitrary business side effects. Recipient code must use the logical
message ID to avoid repeating already-applied business work.

Provider checkpoints enqueue messages for every registered consumer session and
preserve durable notices for declared users without sessions. `session` registers
a new/replacement JOB and catches up pending notices. First-processing mailbox ack
is separate from consuming a product notice after that assignment integrates.
Thus a new notice arriving during an active assignment cannot disappear under the
older assignment's completion. No recipient without a session is falsely described
as awakened; its notice waits durably for its eventual assignment/session.

CLI commands are `register-role`, `message`, `messages`, `intent`, `delivered`,
`ack`; checkpoint/session output supplies `message_ids_to_deliver`. ARCH must act
on those intents immediately with the actual native tool, not wait for a timer.
The CLI is a trusted controller interface, not cryptographic caller authentication.
Identity evidence is the real native event; arbitrary text arguments do not prove
an actor's identity. No new account or permission is granted by this mechanism.

## Actual measurements

| Trial | Actual operation/state | Send to first observable processing |
| --- | --- | ---: |
| Idle recipient | Prior turn completed; native followup_task started a new turn | 11.127 s |
| Active recipient | Running turn confirmed; native send_message delivered | 7.943 s |
| Active production route | Running turn; native followup_task steered it | 9.917 s |
| Replaced recipient | Same unacknowledged message routed to idle generation 2 | 14.319 s after replacement wake; 52.072 s from original send including interruption/replacement preparation |
| Actual ROOT→coordinator status | GitHub-backed production mailbox, idle native coordinator, source-verified receipt | 10.075 s |

These are same-host monotonic intervals from the sender timestamp before its
native operation to the recipient's first observable shell action. They include
model/tool scheduling and bound the start of processing; they are not precise
service-internal dispatch or RPC-return latency. No timing SLA is established.

Nonblocking behavior was demonstrated separately: a recipient reported receipt but
withheld its final response until RELEASE_FINAL; the sender continued independent
commands while that response remained withheld. Tool-return observation timestamps
also include sender model/tool overhead and must not be misrepresented as pure RPC
latency. Raw timestamps, receipts and scope statements are in
`evidence/reactive-communication/actual-native-timings.json`.

The live development cycle delivered the provider revision to an idle/active web
session immediately with native followup. After interruption, replacement generation
3 received the same durable notice, acknowledged first processing, completed its
work, and only then consumed the product notice on integration. The unassigned
report user's notices remain pending. Live state and actual coordinator-message
evidence are under `evidence/native-development-cycle/`.

## Exact current scope and remaining ROOT limitation

The tested direct native controls address existing non-root sessions in this
conversation's agent tree. They do not expose an arbitrary unrelated Cloud-chat or
top-level retained-ROOT idle-wake operation. This is about waking a retained ROOT,
not the nonrequired resurrection of a deleted/archived ROOT.

Supported alternatives investigated:

- `automations_run_now` on the existing enabled ROOT automation was actually
  attempted under the immediate-message requirement. It returned HTTP404
  `Action not found` before action invocation. No target wake was observed.
  Its advertised schema also permits `inline_run`, requiring the calling agent
  to execute the saved prompt; that would not prove an independent ROOT wake.
- Event-triggered hosted tasks for GitHub PR activity are officially documented at
  https://learn.chatgpt.com/docs/automations . However, this tool catalog lacks
  `discover_webhook_schema` and its create schema lacks trigger parameters. No
  undocumented request or permission expansion is used to manufacture this path.
- A ROOT already executing an event wait can receive native child messages as its
  execution state permits. This is active-turn delivery, not idle-turn awakening.

The periodic ten-minute schedule remains a ROOT safety/continuation mechanism,
never a claimed substitute for reactive inter-session wake. Child-session reactive
behavior is implemented and measured; retained top-level ROOT idle wake is not yet
demonstrated through an available supported operation. Continue independent native
Process4 development while investigating this narrowly identified limitation.

### Subsequent coordinator assessment

The native parent mailbox/event wait provides active-turn delivery, with no documented
idle-parent turn-start guarantee. Child final notifications therefore cannot prove
idle ROOT wake. A standing supervisory role hosted as an addressable child could
use the measured native wake path while the top chat remains the owner bridge.
This is a possible explicit hierarchy mapping, not an implemented solution or
proof that the existing top-level ROOT awakens. No role reassignment has been made.

The alternative must also preserve owner-started ROOT semantics and the specified
three-level session limit. A literal bridge → ROOT-child → ARCH → JOB tree adds a
fourth native level; a flattened logical mapping would need explicit documentation
and verification. It is therefore not currently accepted as a completed substitute.
