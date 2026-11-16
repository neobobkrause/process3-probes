# Process4 grants: isolated authorization prototype

Status: EXPERIMENTAL. Not an active grant policy or deployed security control.

## Execute

From the repository root:

    python -m unittest discover -s bootstrap/grants -p 'test_*.py' -v

The 32 unit tests exercise granted and forbidden operations, role scopes,
module/branch/repository boundaries, path traversal, stale PR heads,
module tests and walk prerequisites, Cloudflare development resource scopes,
session delegation, policy digest mismatch and denial before the adapter.

## Critical trusted-host boundary

This evaluator is not a sandbox. It cannot prevent an agent with raw GitHub,
Cloudflare, signing or subscription credentials from bypassing it.

A real Process4 host MUST:

1. Resolve session identity and role from protected supervisor state, not agent assertions.
2. Keep the owner-approved grants and pinned digest in storage the job cannot modify.
3. Hold all provider and OAuth refresh credentials in a privileged process inaccessible to jobs.
4. Deny direct privileged-provider network routes and direct credential reads from job processes.
5. Expose narrow typed operations, not arbitrary commands, URLs or GitHub API forwarding.
6. Independently derive changed paths from Git diffs and trusted module assignments.
7. Re-read PR heads, CI results, and internal/external walk records before each merge.
8. Reject unknown operations and stale state; make retries idempotent and audit outcomes.
9. Keep public-release publication behind independent owner approval.
10. Pause inference on terminal OAuth invalidation; never use a metered API fallback.

## Source authority

Existing Claude approvals and settings on the probe and product repositories,
plus process3's process4/evidence/permissions_inventory.md, establish the historical baseline.
Later owner instructions replace selective notifications with notices to ALL declared
users of any changed provider. The test fixture is not new owner approval.

## What is and is not proven

Proven: local Python execution of all 32 policy-unit tests; branch isolation.
Unproven: host-controlled credentials, authenticated broker RPC, real provider adapters,
Codex sandbox isolation, live denial of bypass routes, repository rulesets, Cloudflare
permission boundaries, process role replacement, and renewable subscription inference.

Next: integrate this evaluator inside the trusted Process4 supervisor, keep jobs
credential-free, demonstrate permitted and forbidden GitHub/Cloudflare actions
on disposable probe resources, and measure actual role restart and recovery.

These are security and process proofs, not additional product testing stages.
Process4 product stages remain module tests, internal walk, external walk.

## Continuation and stop conditions

The new continuation.py and test_continuation.py distinguish five situations:

- COMPLETE: every assigned job is accepted AND every required live proof is recorded.
- CONTINUE: at least one independently executable assignment or proof remains.
- EXTERNAL_BLOCKED: every outstanding item has a specific confirmed external dependency.
- OWNER_STOPPED: owner-directed stop, preserved but never represented as complete.
- INVALID STATE: reject rather than manufacture a success status.

An individual Codex turn ending, a draft PR, or passing unit tests is *not*
assignment completion. A runner must invoke assess() on trusted, durable
state after every turn and dispatch a successor when the result is CONTINUE.
It must persist the status and recover after crash or host replacement.

IMPORTANT: This repository prototype does not create a permanent cloud runner.
The ChatGPT conversation that wrote it cannot continue executing once it ends.
Until an independent runner is provisioned, automatic cross-task continuation
remains unproven. The contract must not be described as self-sustaining merely
because its classification tests pass.

Do not treat a block in one path (such as invalid OAuth credentials) as an
assignment-level block when separate implementation, security review or
verification work remains executable. The supervisor must record exactly which
individual items are blocked and why.
