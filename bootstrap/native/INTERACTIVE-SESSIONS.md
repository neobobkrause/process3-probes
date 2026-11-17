# Continuing Process4 conversations

Owner clarification: ../OWNER-INTERACTIVE-SESSIONS-20261116.txt. Interactivity is
an essential acceptance requirement. Prior product execution and completed
transcripts alone cannot satisfy it. The approved role layout is unchanged.

## Owner interface actually demonstrated

Use this standing owner-console chat and address the logical role, for example:

- `Ask PROCESS: Which design lanes are currently active?`
- `ARCH: Why did you choose that dependency boundary?`
- `Design lane quote-comparison: Explain the CSV decision.`

The console preserves the question, resolves the current retained role, submits
supported native `followup_task`, and returns the actual role's attributed reply.
A follow-up can continue that role's conversation after idle or a new assignment.
Questions do not authorize building or change grants. Explicit instructions and
decisions use the existing exact-owner-word/coordinator controls where applicable;
forwarding itself does not invent control or adoption authority.

This route was exercised with the owner's real PROCESS question, not just proxy
text: the actual PROCESS3 instance read state, answered, and its answer appeared
in the console. First observed processing was22.249s after the host's pre-request
clock; the console answer record was104.882s afterward. Those measurements include
routing/model/tool/relay work, not a server latency or client read receipt. No
periodic wake was used for the question. Prompt reactivation is event-driven;
answer latency is material and is not claimed zero or guaranteed by an SLA.

**A separate independent child-session composer is unverified.** Cloud desktop
inspection exposed the managed Linux desktop and empty Chrome, not the owner's
ChatGPT/Codex client. Exposed native tools do not open a user child composer.
An official documentation read was blocked by the proxy403; no login or access
change was attempted. This does not establish that every other Codex client lacks
such a UI. The supported interface proven here is owner-console mediation.

## Separate lifecycle dimensions

| Event | Meaning |
| --- | --- |
| Turn completed | Current response ended; logical role stays retained and reachable. An assignment may remain unfinished. |
| Assignment completed | Work obligation ended; does not end the role, conversation or future availability. |
| Retained idle | No turn currently executing; native followup wakes/steers the actual retained instance. Inventory omission alone is not retirement or a confirmed failure. |
| Session replacement | Underlying target/generation changes; logical conversation ID, important decisions/references, assignment and unanswered questions survive. |
| Deliberate retirement | Separate explicit reason/source/evidence; Process4 dispatch holds that logical role. This is not proof that the platform physically archived or permanently deleted its native instance. |

No current role was deliberately retired. Completed native agents were actually
reactivated: ROOT3 and WATCHER3 recalled earlier responsibilities before reading
files; coordinator5 retained earlier owner/control context. ARCH6, PROCESS3,
LANE2 and a recovered JOB completed substantive follow-up turns after their finals.
These are actual executions, not conclusions drawn from transcript visibility.

## Failure and replacement evidence

Six older retained instances returned actual HTTP400 `Unsupported parameter:
request_country`: ARCH5, PROCESS2, LANE1 and the current provider/report/web JOBs.
Some received one bounded recovery retry; no endless retry, credentials access,
reauthentication or alternative inference was used. A separately recorded wrong
address was an operator error, not proof that the correct role was unavailable.
The cause of the provider parameter failure is not established.

Supported replacements restored ARCH6, PROCESS3 and LANE2. Qualified lane recovery
preserved the original owner need and paths while revalidating the current creator;
it did not invent a new design need. All three accepted JOBs recovered read-only
conversation instances without new module work:

| Logical JOB | Completed module attempt | New native generation |
| --- | ---: | ---: |
| web | 7 | 8 |
| report | 2 | 3 |
| provider | 3 | 4 |

Attempt/status/checkpoint/tests/PR/branch/workspace/integration were compared before
and after and remained unchanged. No product edit, retest, retry or new PR was used
as a substitute for conversation recovery. Future genuine assignments reserve
module attempts and native generations independently; a stale conversation cannot
receive a newer assignment's edit/notice authority. Native handles themselves are
not guaranteed immortal: logical retention plus supported replacement is essential.

In a separate explicitly labeled proxy test, coordinator5 acknowledged a question
but did not answer it. ROOT interrupted it while actually running, used the
supported replacement plan, and registered coordinator6. The new context read the
same logical ID, decisions/references, exact pending question and generation5 ACK,
then explicitly answered that question. The central adapter reconciled the actual
generation6 reply. A processing ACK, assignment completion or native FINAL alone
never discharges an unanswered conversational obligation.

## Implementation and storage

`interaction.py` owns bounded local logical conversations/capsules. `owner_dialogue.py`
adapts console input to actual native intents and correlated replies. `cycle.py`
exposes typed wiring; registration updates an existing conversation binding without
resetting its identity or questions. `continuation.py` overlays local unanswered
conversations, including ACKed ones, as work still requiring attention.

Routine questions, replies, ACKs and recent exchanges use locked atomic local
files, never GitHub messages or per-turn commits. Pending questions and important
knowledge are not silently evicted when capacity is reached; admission fails
explicitly. Ordinary recent reply history is bounded. Important decisions and
references are retained deliberately. Explicit meaningful recovery checkpoints
contain compact identities, assignments, decisions/references and unanswered
obligations, not all chat/ACK history or a fabricated native availability claim.
Restoration is unbound until an actual native instance is reconciled.

Selected CLI contracts (existing state and runtime):

- `dialogue-bind ROLE --actor CREATOR --evidence ACTUAL_EVENT [--conversation-id ID]`
- `dialogue-request ROLE --packet JSON`: question_id/text/provenance/activity/kind;
  returns intent. Caller must execute its actual native tool, then `delivered`.
- `dialogue-ack ROLE --packet JSON`: processing evidence only; remains unanswered.
- `dialogue-reply ROLE --packet JSON`: actual correlated substantive reply;
  explicitly requires owner-visible emission. Recording a reply does not attest
  that the human read it. A substantive reply discharges transport locally too.
- `dialogue-status [--role ROLE]`, `dialogue-event`, `dialogue-remember`,
  `dialogue-checkpoint --actor CREATOR`, `dialogue-restore --actor CREATOR`.
- `lane-recover NAME --actor ARCH --packet JSON`: current generations and actual
  failure evidence, preserving qualification before supported fresh creation.
- `job-conversation-recover JOB --actor ARCH --packet JSON`: current generation
  and actual failure evidence; completed accepted assignment only, read-only
  replacement intent, followed by actual spawn/READY/`session` registration.

Intents and packet labels are not authenticated native events. Trusted supervisors
must observe actual tools/replies before recording them. Native inherited tool
alternatives remain exposed; this is not physical tool/credential confinement.
STOP/caps, repository boundaries and proposed-but-unadopted PR286 remain unchanged.
No independent public chat/deployment service, task-launch API, paid host or metered
inference was introduced.

## Acceptance and continuing availability

PR287 integrated the logical conversation component; PR288 integrated standing-role
instructions, retained-instance probing and lane recovery; PR289 reconciled JOB
assignment/session generations. Central wiring and integrated288 bootstrap tests
passed; unchanged grants retain their prior46-test pass. Existing product4414c032
module/internal/browser/release evidence was preserved and not unnecessarily rerun.

Actual evidence: ../evidence/interactive-sessions/actual-interactivity.json. All
current ROOT/ARCH/coordinator/PROCESS/design/JOB/WATCHER logical conversations are
retained. The owner's real PROCESS exchange and the planned pending-question
replacement are separately labeled from proxy tests and historical evidence.

Bounded readiness now includes continuing conversations through this console.
It does not certify an independent child composer, unlimited context/host lifetime,
unlimited transcript recovery after workspace loss or immunity to provider errors.
The ten-minute continuation remains a safety runner, not the reactive message path.
It must not retire roles, invent assignments, repeat tests or create bookkeeping
merely because another turn has ended or the product queue is empty.
