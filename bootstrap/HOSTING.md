# Persistent Process4 host: implementation and activation procedure

Status: implemented experimental host components; not live deployment proof.
This document supersedes older advice to restore inherited Codex Cloud login.
The owner explicitly rejected that recurring dependency on 16 November 2026.
No inherited Cloud credential is an enrollment or migration source.

## Supported authentication choice

Use the documented open-source Sign in with ChatGPT (SIWC) OAuth flow and the
SIWC **custom Responses provider** in Codex app-server. Although the service URL
is `https://api.openai.com/v1`, the credential is the owner's SIWC subscription
grant, never an API key. Native Codex login, Agents API and metered fallback are
absent from this adapter. `chatgptAuthTokens` is not used: the SIWC guide specifies
a different provider/audience and restart/resume lifecycle.

Sources checked 16 November 2026:

- https://developers.openai.com/siwc/token-sharing-open-source/sign-in
- https://developers.openai.com/siwc/token-sharing-open-source/profiles-and-sessions
- https://developers.openai.com/siwc/token-sharing-open-source/self-hosted-vms
- https://developers.openai.com/siwc/token-sharing-open-source/codex-app-server
- https://developers.openai.com/siwc/token-sharing-open-source/preview-limitations
- https://learn.chatgpt.com/docs/permissions
- https://learn.chatgpt.com/docs/app-server

Public Codex main inspected by the reading worker:
`457a191479f15ce517d70e9a7bc4caf9ddd6d404`. Installed CLI tested here:
`0.167.0-alpha.4`. The custom provider is built from the official SIWC recipe;
its actual inference and subscription accounting remain unverified.

## Smallest arrangement

One owner-controlled Linux VM, initially one development slot, no GPU, no public
application listener. Engineering starting size: 2 vCPU, 4 GiB RAM, 30 GiB durable
encrypted disk; increase only from measured needs. SSH access is restricted to
the administrator. The kernel must allow Codex's unprivileged bubblewrap/seccomp
sandbox. The selected Cloud task does not provide a usable sandbox for this.

Attach an encrypted persistent volume holding the latest credential vault,
Process4 runtime, thread history and Git checkout. On VM replacement reattach that
same current volume and fence the old VM before starting services. GitHub retains
assignments, branches and checkpoints independently. A stale vault snapshot is
not a safe replacement for the latest rotating token. No distributed active-active
credential owner or multiple concurrently writable VM copies are supported.

Required outgoing HTTPS: auth.openai.com (discovery/JWKS/OAuth), api.openai.com
(SIWC subscription inference), api.github.com and github.com (existing probe
scope). Installation also needs the selected OS/package registries. No public
callback on the VM: initial OAuth completes on the owner's browser computer.
The current Cloud allowlist lacks the SIWC auth/API hosts; changing this temporary
task's allowlist would not establish persistent hosting and is not requested.

No cloud provisioning identity or persistent-service facility is configured in
this task. This is the concrete external hosting prerequisite, not a claim that a
background process in this task survives its termination.

## Protection boundaries

- `process4-auth.service` is the single SIWC credential owner. It serves only a
  private owner-only Unix socket to trusted controllers. Process locks serialize
  rotation and maintenance commands. Ordinary agents receive neither refresh
  tokens nor credential-file mounts.
- A trusted controller supplies only a short-lived access token to its app-server
  subprocess, using the documented `ACCESS_TOKEN` provider variable. App-server
  does not inherit an auth.json, refresh token, API key, GitHub token or Cloudflare
  token. Local command environments inherit no credentials.
- Each model's command sandbox reads its checkout and minimal system paths, writes
  only its module paths, denies `/proc`, private controller runtime and Git
  metadata, and has network disabled. Named permission profiles are used without
  legacy `--sandbox` overrides. Role turns have no writable module paths.
- Acceptance argv runs through the same named sandbox, never in the credentialed
  supervisor environment. The executor runs a nonsecret isolation capability
  probe before requesting subscription credentials. A failed probe stops launch;
  there is no Landlock/unsandboxed fallback.
- Host software is installed root-owned outside development worktrees. Provider
  credentials and independently pinned policy must be outside every job's readable
  filesystem. Owner policy is not generated from a model's assertions.
- Host state writes, branch provisioning/checkpoints, draft PR creation and role
  intents pass the grants evaluator. Raw mutating API forwarding is refused.
  The current assignment's narrower scope also blocks merges, releases,
  Cloudflare operations and every other repository, even if a broader historical
  owner policy would permit them.

These describe the implemented controls. Real model bypass attempts, kernel
isolation and provider allow/deny operations have **not** been demonstrated here.
The model tool sandbox's own daemon-socket masking and all configured capability
surfaces must be measured on the actual VM before activation.

## Rotation, failure and recovery

`auth/credentials.py` stores the entire registration in one owner-only JSON file.
Writes use a same-directory temporary file, file fsync, atomic replace and directory
fsync. Successful token responses are checkpointed before refreshed ID-token
verification; temporary JWKS failure resumes verification of the saved response
without consuming the old refresh token twice. OIDC RS256 signature, issuer,
audience, nonce for enrollment, time bounds and subject continuity are checked.
Refresh uses the issued client ID, current refresh token and documented resource;
no scope expansion is requested. Granted subscription scopes are required.

`invalid_grant`, revoked-client/account conditions and invalid identity are terminal:
the owner service durably latches reauthorization-required and stops repeated
refresh attempts. Network/rate-limit/service failures preserve the registration.
Terminal invalidation is exceptional; routine access-token expiry is automatic.
The controller loads a role-specific technical rulebook of at most ten rules;
those rules do not create owner grants. The controller interrupts unfinished work near token expiry, restarts app-server
with a renewed token and calls thread/resume on the same durable thread. Failed
or interrupted turns are never completion.

No software can make remote OAuth rotation and a local disk write one atomic
distributed transaction. A crash between the server consuming a refresh token and
the host receiving/persisting its replacement remains an exceptional uncertainty;
if the provider rejects the surviving token, treat that as terminal invalidation.
Do not promise recovery from every possible disk loss, stale restore, account
revocation or this exchange gap. Normal restart with the current durable volume
and persisted rotations is covered by storage tests; real OAuth renewal and VM
replacement remain required demonstrations.

## Exact installation and one-time enrollment

Perform these steps on the new VM only after the owner supplies authorized access.
They are prepared instructions, not actions performed by this task.

1. Install Python 3, Python cryptography, Git, GitHub CLI, bubblewrap and the tested
   Codex CLI version. Verify the actual CLI version/schema before using a different
   version. Obtain this PR's reviewed source on its working branch; never deploy
   an uncommitted development checkout as the protected controller.
2. Run `sudo sh bootstrap/service/install-host.sh` from that source. It installs
   root-owned host software, creates the service principal/private directories and
   installs service units. It deliberately does not start them or enroll an account.
3. As the service principal clone process3-probes to
   `/srv/process4/process3-probes`, checkout this existing grants implementation
   branch, and fetch the same job/state branches. Preserve all durable state.
   Give the host a renewable, repository-limited GitHub identity already authorized
   for process3-probes. If no such credential can be provisioned from an existing
   approved installation, a new GitHub App installation needs owner authorization:
   only process3-probes, Contents and Pull requests read/write, Metadata read;
   no administration, workflows or other repositories. Keep its signing key and
   short-lived installation-token renewal in protected host storage. The included github_auth.py mints and renews installation tokens, explicitly
   restricting them to that one repository and those permissions; it verifies the
   returned scope. Provisioning the existing installation/key is external, and
   real GitHub App issuance/renewal remains unverified.
4. Install an accurate encoding of the **existing** owner grants at
   `/etc/process4/approved-policy.json`, root-owned/readable only by the trusted
   principal. Pin its independently verified SHA-256 in `/etc/process4/host.env`.
   Do not promote the unit-test fixture into an approval. Encoding must not expand
   authority; any difference in authority requires owner approval. The evaluator's
   vocabulary now includes `github.branch.create` for ARCH, restricted to the
   assigned dedicated job branch and exact base. Configure state writes for the
   existing `codex/p4-state-bootstrap-20261116` branch. Policy bytes/pin changes
   require all roles stopped and an owner-authorized ROOT restart; do not hot-adopt
   a new grant through the service environment.
5. Set `P4_MODEL` in host.env to an actually supported subscription model. All
   service runtime paths are in host.env.example. With no credentials imported,
   run the executor's capability probe under the actual service principal and
   systemd restrictions; confirm permitted module writes, prohibited cross-module
   writes, credential reads, host-process access and direct network are denied.
   The built-in preflight is an initial probe; it is not this complete live proof.
6. Create the VM's stable ID before importing credentials:
   `sudo -u process4-host python3 /srv/process4/host/bootstrap/auth/authorize.py --vault /var/lib/process4-auth host-id`.
7. On the browser computer, run this same Process4 enrollment code from the same
   version: `python3 bootstrap/auth/authorize.py --vault /ABSOLUTE/PRIVATE/process4-enrollment login`.
   This is the one initial **Continue with ChatGPT** ceremony. Choose the intended
   account/workspace and approve Process4's subscription-use scopes. It registers
   the actual name Process4, uses state/nonce/S256 PKCE and validates the ID token.
   It does not read or copy a Codex Cloud auth file.
8. Transfer only that selected `credentials.json` over SSH into an owner-only
   staging path on the VM. Never paste it in chat, commit it, or put tokens in
   command arguments. Run:
   `sudo -u process4-host python3 /srv/process4/host/bootstrap/auth/authorize.py --vault /var/lib/process4-auth import --file /PRIVATE/STAGING/credentials.json`.
   Import retains the VM ID. Verify the nonsecret status using `status`, remove
   staging/local enrollment credential copies and stop their local credential
   owner: the VM alone performs later renewal. Do not delete a source copy before
   confirming protected import. The official VM guide documents this transfer.
9. Enable/start the credential-owner service, then the supervisor service with
   systemctl. The daemon can be tested with `authorize.py ... renew`, which prints
   readiness/expiry only. Do not print the private socket response. Inspect service
   status without dumping process environments.
10. The existing probe state is harness-stopped and its provider/ROOT blocked from
    earlier failures. After valid host preflight, clear that harness stop using the
    authorized control command, retry the **same** provider and replace the blocked
    ROOT using the explicit bootstrap operator recovery already in README. Never
    clear a later actual owner stop automatically. Start runner.py against the same
    state branch. A question/progress report must not seed duplicate assignments.

## Demonstration still required on that host

Real subscription inference; actual routine rotation while independent sessions
run; ordinary credential-owner/controller restart; fenced VM replacement with
current volume; permitted and denied broker operations with model attempts to
bypass; ROOT/watcher/subordinate replacement; module development, interruption,
checkpoint recovery and resumption; remaining Process4 capabilities/evidence.
Keep both existing PRs draft. No main merge, grant expansion, CivicSmith2 write,
public release or metered inference is authorized by this procedure.
