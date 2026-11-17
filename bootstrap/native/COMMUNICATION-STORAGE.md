# Native communication storage and lifecycle

The owner's latest guidance forbids GitHub as the routine Process4 message bus.
The acceptance criterion is native event-driven transport with **zero GitHub state
writes for enqueue, intent, submission recording or processing acknowledgement**,
bounded temporary bookkeeping, and meaningful recovery state kept separately.

## Selected arrangement

Native `followup_task` remains the actual transport: it starts an idle non-root
recipient or steers a running recipient without waiting for the recipient's final
response. The existing actual idle/active/replacement timings remain evidence;
these storage tests do not repeat or replace them. No timer is message transport.
No GitHub webhook is configured. Top-level parent wake is a separate investigation.

`Cycle` uses one workspace-local JSON file and one lock file per native run under
`<runtime>/operational/<sha256(state-branch)[:16]>.json`. The full state-branch name
is not used as a path. `LocalMailbox` serializes read/modify/write operations with
`flock`, writes a same-directory temporary file, fsyncs it, atomically replaces the
current snapshot, and fsyncs the directory. Temporary files are removed on failure.
Files use owner-only creation mode. This is reliability/hygiene, **not** an agent
security sandbox; native children still inherit available tools.

No database, daemon, third-party host, credentials, event archive or new service
has been introduced. Multiple local controller invocations share the same bounded
snapshot. Routine operations need no remote reads after initialization. Keep the
same `--runtime` for related CLI calls; a different runtime is a different temporary
mailbox, not a distributed message system.

## Bounds and cleanup

- At most 256 messages total, including retained acknowledgements.
- At most 64 acknowledged messages, retained for at most one hour on subsequent
  transactions. Old acknowledgement rows are removed, rather than archived.
- At most eight delivery-attempt rows per message, with a cumulative attempt count.
- At most 16 KiB of text per message and 1 MiB for the serialized local snapshot.
- At most 128 registered logical recipients in one temporary mailbox.
- Admission reserves 8 KiB per pending message for bounded delivery and receipt
  metadata, so accepting payloads near the byte cap cannot strand their processing
  acknowledgements. New traffic receives backpressure before consuming this space.
- Recipient/sender/message identities are bounded to 256 UTF-8 bytes, receipt text
  to 1 KiB, and logical generation to a positive signed 64-bit value.
- No append-only transient event list or file-per-message layout.

The first applicable limit wins: these maxima are not a promise that 256 maximum-
sized messages fit simultaneously. Capacity errors fail closed and do not silently
throw away pending work or overwrite the previous snapshot. Dispatch and acknowledge
pending work rather than creating an unbounded backlog. Routine acknowledgement
idempotence is bounded by retention; business operations need their own durable
job/checkpoint identity and must not assume eternal exactly-once transport.

A retired run's operational directory can be removed once its native senders are
quiescent and meaningful recovery obligations have been preserved. Do not remove a
lock file while writers may be active; that could create independent lock domains.
There is no automated cross-run deletion or history rewriting. Files grow with
active runs, not with every message; the supervisor must retire finished run runtime
directories rather than archive them indefinitely. Run retirement is distinct from
per-message housekeeping.

## Minimum durable recovery state

GitHub still holds assignments, accepted checkpoints/integrations, exact owner
instructions/stop/cap, and compact role addresses/generations. A role replacement or
job-session generation registration is a meaningful recovery milestone and may
write that compact registry. Re-registering an identical role does not write it
again. It is not a heartbeat, per-send ledger or routine polling record.

Provider changes still fan out locally to **every registered declared consumer at
every actual changed-provider checkpoint**. A compact remote obligation remains
for every declared user, including users without a session. Receipt of a message
never consumes the product obligation. Only integrating the relevant assignment
consumes its assigned notices.

Remote outstanding notices retain the first unconsumed provider source commit,
latest source commit and covered change count. Intermediate source revisions are
recoverable from the provider's Git history; individual operational messages are
not copied into permanent history. There is one latest waiting range per provider/
user, plus notices held by an active unfinished assignment and the latest consumed
cursor. A newer change arriving during an old assignment cannot be consumed by
that old assignment's integration. This bounds live notice rows by declared edges
and active assignments, rather than lifetime provider-change count.

The current recovery snapshot keeps latest native milestone records by kind/job/
command rather than all transient repetitions. Exact owner instructions remain
preserved. Verification logs/checkpoints are meaningful development artifacts;
this is not a claim that all product source and recovery data have constant size.

## Migration and loss semantics

On first local initialization only, the controller reads the existing legacy
`native_mailbox` snapshot, imports its pending/acknowledged messages within the
bounds, overlays the compact current role registry and seeds outstanding provider
notices. Subsequent local CLI invocations do not reread that legacy transport store.
At the next **meaningful recovery write**, `Store.write` removes the legacy mailbox
from the current remote snapshot and persists the compact registry and obligations.
No cleanup commit is generated merely to acknowledge a message. Existing Git
history remains unchanged; deleting a field does not erase old Git objects.

Ordinary process restart on the same managed workspace preserves the atomic local
snapshot. Loss/replacement of that workspace loses routine transient messages and
bounded acknowledgement deduplication. Compact provider obligations and unfinished
job/checkpoint state can reconstruct necessary product work; purely transient
conversation text cannot be recovered from GitHub, intentionally. Consequential
owner instructions must first become explicit durable owner state, rather than
relying on an ephemeral send. No claim of arbitrary-message durability across VM
replacement is made. No recurring credential login or paid fallback is introduced.

## Verification and operational cost

Meaningful fixture tests exercise concurrent writers, atomic rollback on byte
pressure, message/text/ack/attempt bounds, replacement routing, one-time migration,
provider-obligation recovery after local-file loss, all-user fanout and in-flight
notice separation. A routine 20-message fixture explicitly rejects *any* remote
read or state mutation after seeding: enqueue, intent, delivered, ack and listing
all succeed locally. This is code verification, not live inference evidence.

A 1,000-completed-message local sizing fixture retained 64 acknowledgement rows
and approximately 23 KiB (23,094 bytes in one observed run; timestamps affect exact
size), with zero persistent per-message artifacts. The byte cap is 1 MiB.
A separate 1,000-provider-change fixture kept two outstanding rows for two users,
each covering first commit `0`, latest `999`, and count 1,000.

The previous remote enqueue/submission/ack route could produce three state commits
per routine message, aside from role/job milestones. At 1,000 messages that would
mean roughly 3,000 permanent Git commits; this is a volume calculation, not a claim
we created that many commits. The replacement routine path produces zero. Meaningful
provider/job/role changes still produce ordinary recovery commits, so Git history
still grows with actual development. One local file replaces append-only message
history; source/PR/recovery writes are not advertised as free or historyless.

Parent-owned actual execution receipts and provider write counts are recorded
separately under `bootstrap/evidence/communication-storage/`. Do not substitute the
fixture sizing results for actual native transport or top-level ROOT wake proof.

## Push destination correction in the same controller

Before each native job push, the controller now checks Git's effective
`remote get-url --push --all origin`, including push URL rewrites, and requires one
canonical probes HTTPS destination. Multiple destinations, foreign push URLs and
`url.*.pushInsteadOf` redirects are rejected before the push adapter. Pushes disable
mirror/follow-tags/submodule-recursion behavior and still specify one assigned ref.
Local fixture tests contact no foreign repository. Shared Git configuration can
still race or be bypassed by inherited raw tools; this is controller validation,
not an OS-enforced credential or repository sandbox.
