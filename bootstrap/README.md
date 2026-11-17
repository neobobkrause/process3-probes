# Current native Process4 implementation

Read [NATIVE-CLOUD.md](NATIVE-CLOUD.md), [HANDOFF.md](HANDOFF.md), and the exact
[owner clarification](OWNER-CLARIFICATION-20261116.txt). Standing ROOT plus native
scheduled continuation is the approved lifecycle; physical module sandboxing is
optional. Ownership instructions and actual-change rejection before integration
are required. Reactive idle-recipient wake is essential and separate from timers.

The native cycle controller is `bootstrap/native/cycle.py`. The active workshop
run is `codex/p4-state-native-workshop-20261116`, integration branch
`codex/p4-integration-workshop-20261116`. Native ARCH manages JOBs; controller
preserves work, opens draft PRs, checks ownership and delegates authorized integration
to the unchanged pinned process tool. No main/tranche/settings/grant changes.

Historical self-hosted SIWC code remains research only; it is not the approved
operating architecture and must not be deployed or used as a fallback. All evidence
and earlier work in PRs #268/#269/#270 remain preserved. Do not treat historical
optional-isolation/whole-ROOT-loss blockers as current acceptance conditions.

Module tests, internal UX Screens walk and external UX journeys walk are the only
product tests. Controller verification and ownership controls are process checks,
not extra product stages. Claim capabilities only from actual execution evidence.
