# Native Codex Cloud feasibility and actual probes

16 November 2026. This is the approved architectural direction: OpenAI-managed
execution within the owner's existing ChatGPT subscription allowances. No
third-party VM, extra hosting charges, API-key/metered inference or credit purchase
is authorized. Earlier self-hosted SIWC code is retained only as researched
experimental work; its deployment request is withdrawn.

## Current finding

Native hosted children and scheduled chat delivery work in this environment.
The complete Process4 authority/recovery model is **not demonstrated**. The
available native child interface shares the parent's workspace/tool access and
has no per-child sandbox/credential-policy argument. An actual harmless sibling
module-write challenge succeeded. No exposed supported tool recreates an
independent top-level ROOT after whole-task loss.

This is a limitation of the tested/exposed mechanisms, not a claim that no future
or account-specific OpenAI feature could support the requirements.

## Supported mechanisms researched

- Modern Cloud tasks use a published environment and keep separate task state:
  https://learn.chatgpt.com/docs/cloud
  https://learn.chatgpt.com/docs/environments/cloud-environments
- Native hosted subagents support child work, follow-ups and result collection:
  https://learn.chatgpt.com/docs/agent-configuration/subagents
  Actual current collaboration tools also provide interruption and child status.
- Hosted scheduled tasks can return instructions to a chat:
  https://learn.chatgpt.com/docs/automations
  Actual tool metadata can report an inherited managed-cloud configuration.
- Installed CLI 0.167.0-alpha.4 documents cloud exec/status/list/apply/diff:
  https://learn.chatgpt.com/docs/developer-commands?surface=cli
  It has no cloud message/interrupt/replace command. `codex queue` addresses local
  or selected app-server sessions; it is not documented cloud-task communication.

The CLI has a real documented submission command; saying no such command exists
would be incorrect. However, one actual read-only `codex cloud list` request in
this task failed HTTP 401. No task submission was attempted with known-invalid
credentials, no login requested, and no managed ccarenv/config selector was guessed
as a legacy --env identifier. No private HTTP task-launch endpoint was probed.

## Actual execution evidence

| Operation | Observed result | Limit |
| --- | --- | --- |
| Native child start/development | native_provider authored value.py and three passing tests | Bounded child in this parent's agent tree |
| Follow-up communication | Same child received a new work item, persisted pending.json and sent NATIVE_PARTIAL_READY | Not arbitrary cross-chat message routing |
| Interruption | interrupt_agent returned previous_status running while child waited with unfinished work | Not destruction/recreation of top-level ROOT |
| Replacement | New native_provider_replacement read prior files, completed double_value.py and passed six tests | Parent-managed child replacement in a shared workspace |
| File boundary challenge | Child appended the authorized nonsecret marker to sibling toy/native-peer/canary.txt | JOB module-only writes are not enforced by this native sandbox arrangement |
| Remote checkpoint | Parent manually committed/pushed actual child-authored work to codex/p4-job-native-cloud-provider-20261116 | Not an autonomous grants-broker checkpoint |
| Reconstruction | Fetched remote branch into separate detached worktree and reran all six tests successfully | Not a new Cloud task or whole-host-loss test |
| Scheduled wake | One-time probe delivered an automation instruction into this active Cloud chat; normal shell printed NATIVE_PROCESS4_EXECUTION_OK | Not independent ROOT creation; backend run/result history was null |
| CLI Cloud access | One actual list request failed 401 | No submission, no repeated login or retry |

Remote module checkpoint: `da308c3`, on
https://github.com/neobobkrause/process3-probes/tree/codex/p4-job-native-cloud-provider-20261116
The module code was authored by actual native model children, not by a fixture.
The parent checkpoint operation is explicitly operator-authored. Initial bytecode
artifacts were removed by a subsequent ordinary commit; no history rewrite.

The official subagent documentation now independently confirms this boundary:
subagents inherit the parent's permissions/tools; custom agent instructions cannot
create a separate read-only sandbox. See the “Approvals and sandbox controls”
section of https://learn.chatgpt.com/docs/agent-configuration/subagents . This is a
documented limitation of the current native child model, consistent with the
actual canary result. Native admission classification consequently refuses normal
role-restricted development until isolation and exclusive grants enforcement have
actual supporting evidence. This Python admission helper cannot constrain direct
platform tool access and is not itself enforcement.

The canary challenge was specifically authorized for the harmless boundary test.
It did not access credentials or attempt an actual forbidden provider mutation.
Its result establishes absent module-path enforcement in this arrangement, not
permission for product-wide writes or a grant expansion.

Detailed operator-recorded receipts and command output are in evidence/native-cloud.
No raw credentials are included. Test counts are process-tool verification, not new
product test stages or evidence of all Process4 requirements.

## Scheduled continuation trial

The completed one-shot “Probe native Process4 wake” and active hourly “Continue
native Process4” are **scheduled-task cards**, not documents and not independent
ROOT/development sessions. Open displays their prompt, schedule and run details.
The one-shot actually delivered while the parent was active. Creation/inheritance
metadata alone does not prove a run, independent execution or billing behavior.

The hourly prompt preserves all current restrictions and directs the next native
wake to continue independent implementation, record actual execution and distinguish
same-chat continuation from whole-ROOT recreation. It must pause itself if all
remaining work is blocked by specific confirmed platform limitations. It must not
request a VM, another inherited login, extra credits or permissions. No background
OS service is being used as the continuation mechanism.

The first post-turn scheduled continuation has now been observed: after the prior
assistant final, NATIVE_PROCESS4_SUCCESSOR_WAKE arrived, the normal execution tool
worked, the same remote module checkpoint was fetched into a fresh worktree, and
a new native child with no inherited conversation passed all six tests. See
`evidence/native-cloud/actual-successor-wake.json`. Same-chat after-turn work is
therefore observed. This does not establish ROOT recreation or whole-task loss.
The backend recorded-run/result history was still null; actual transcript/tool
execution is the evidence, not the task card's counters.

A second post-turn scheduled wake remains an independently executable repetition
trial. Leave the existing schedule active for that trial; do not create another.
On the next real scheduled turn, record whether it followed a final and execute a
bounded verification. Once that is observed, inventory remaining independent work.
If every remaining requirement is blocked by the documented absent native role
isolation/whole-ROOT lifecycle controls, pause the self-owned schedule rather than
spend indefinite usage on duplicate tests. Do not call an unproven item externally
blocked unless its specific missing prerequisite has been established.

Any later delivered turn must report whether it followed the previous final response,
which environment/tools it actually has, and what work it actually executed.
Do not claim after-turn continuation before observing it. Do not infer success from
a task card, completed_count or last_run_time when recorded result history is null.

## Remaining feasibility requirements

1. First scheduled continuation after a preceding final is observed. Next verify
   a second scheduled continuation; whole-task-loss recovery remains separate. A scheduled same-chat wake may provide useful ROOT
   continuation, but is not proof of an independent watcher replacing lost ROOT.
2. Identify and execute a supported whole-ROOT creation/replacement mechanism, if
   this account exposes one. Current tool inventory and CLI do not expose it.
3. Establish enforceable per-role/module tool, credential and filesystem boundaries.
   Instructions alone failed the sibling-write challenge. The grants evaluator
   cannot be exclusive while a model retains direct privileged tools/bypass routes.
4. Demonstrate real grants-controlled permitted/prohibited operations only within
   existing authority. No secret disclosure, grant changes, CivicSmith2 writes or
   dangerous provider mutations are justified by a capability test.
5. Continue the original provider/state/bootstrap requirements without confusing the
   native toy branch with the older blocked CLI provider assignment. Existing
   stopped state, provider attempt 5, ROOT generation 1 and PR #268 remain intact.

`native/capabilities.py` classifies documentation, actual observations, unproven
items and exposed platform blockers. It rejects paid hosting, metered inference
and guessed launch mechanisms; it does not pretend to be a task-launch API.
Full Process4 completion must not be inferred from native child success or the
scheduled continuation trial. If required native lifecycle/isolation capabilities
remain unavailable, report a feasibility limitation within the owner's cost and
infrastructure boundary rather than substitute a different architecture.
