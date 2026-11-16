"""Prototype of an external, fail-closed Process4 grants broker.

NOT a sandbox and NOT an operational grant policy. The host must protect
credential storage, assignment registry, pinned policy digest and adapters.
"""
from dataclasses import dataclass
from hashlib import sha256
from pathlib import PurePosixPath
from typing import Mapping, Any, Callable
import json
import re


class Denied(PermissionError):
    def __init__(self, reason):
        super().__init__(reason)
        self.reason = reason


@dataclass(frozen=True)
class Subject:
    session_id: str
    role: str
    repo: str
    branch: str | None = None
    module: str | None = None
    generation: int = 0


FIELDS = {
    "github.branch.create": {"repo", "branch", "base"},
    "github.branch.update": {"repo", "branch", "paths"},
    "github.pr.open": {"repo", "head", "base"},
    "github.pr.update": {"repo", "head", "base", "pr"},
    "github.pr.merge_job": {"repo", "base", "pr", "expected_head"},
    "github.pr.merge_tranche": {"repo", "base", "pr", "expected_head"},
    "github.state.update": {"repo", "branch"},
    "github.pr.comment": {"repo", "pr"},
    "session.start": {"repo", "child_role"},
    "session.replace": {"repo", "child_role"},
    "session.message": {"repo", "recipient"},
    "session.interrupt": {"repo", "recipient"},
    "cloudflare.dev.deploy": {"repo", "account", "resource"},
    "cloudflare.dev.remove": {"repo", "account", "resource"},
    "release.dev.prepare": {"repo", "release_id"},
    "release.public.publish": {"repo", "release_id"},
}
ROLES = frozenset(("ROOT", "WATCHER", "COORDINATOR", "ARCH", "JOB", "LANE", "PROCESS", "WORKER"))
REPO_RE = re.compile(r"^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$")
REF_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._/-]*$")


def branch_name(value):
    if not isinstance(value, str) or not REF_RE.fullmatch(value) or ".." in value or "//" in value or value.endswith(("/", ".lock")):
        raise Denied("INVALID_BRANCH")
    return value


def paths_of(value):
    if not isinstance(value, list) or not value:
        raise Denied("MISSING_CHANGED_PATHS")
    for path in value:
        if not isinstance(path, str) or not path or path.startswith("/") or "\\" in path:
            raise Denied("INVALID_CHANGED_PATH")
        if any(part in ("", ".", "..") for part in path.split("/")) or not PurePosixPath(path).parts:
            raise Denied("INVALID_CHANGED_PATH")
    return tuple(value)


def owns(path, entry):
    return path.startswith(entry) if entry.endswith("/") else path == entry


CURRENT_REPO = "neobobkrause/process3-probes"
_SHA = re.compile(r"^[a-f0-9]{40}$")
_PROTECTED_PARTS = frozenset((".git", ".github", ".claude", ".codex", ".agents", ".aws", ".process", "CLAUDE.md", "AGENTS.md", ".gitmodules"))
_CURRENT_FIELDS = {
    "github.state.update": ({"repo", "branch"}, set()),
    "github.branch.create": ({"repo", "branch", "base"}, set()),
    "github.branch.update": ({"repo", "branch"}, {"paths", "head"}),
    "github.pr.open": ({"repo", "head", "base"}, set()),
    "github.pr.update": ({"repo", "head", "base", "pr"}, set()),
    "github.pr.merge_job": ({"repo", "base", "pr", "expected_head"}, {"head"}),
    "github.pr.comment": ({"repo", "pr"}, set()),
    "session.start": ({"repo", "child_role"}, set()),
    "session.replace": ({"repo", "child_role"}, set()),
    "session.message": ({"repo", "recipient"}, set()),
    "session.interrupt": ({"repo", "recipient"}, set()),
    "release.dev.prepare": ({"repo", "release_id"}, set()),
}


def _experimental(ref):
    return branch_name(ref).startswith(("codex/p4-", "codex/process4-bootstrap-"))


def _guard_paths(changes, facts):
    changes = paths_of(changes)
    immutable = facts.get("immutable_paths", ())
    if not isinstance(immutable, (tuple, list)) or any(not isinstance(p, str) or not p for p in immutable):
        raise Denied("INVALID_IMMUTABLE_PATHS")
    for path in changes:
        if ("\x00" in path or any(part in _PROTECTED_PARTS for part in path.split("/"))
                or path == "process/config.json" or path.startswith("bootstrap/OWNER-")
                or any(owns(path, p) for p in immutable)):
            raise Denied("CONSEQUENTIAL_PATH_PROTECTED")
    assigned = facts.get("owned_paths")
    if not isinstance(assigned, (tuple, list)) or not assigned or any(not isinstance(p, str) or not p for p in assigned):
        raise Denied("OWNERSHIP_FACTS_REQUIRED")
    if not all(any(owns(path, owned) for owned in assigned) for path in changes):
        raise Denied("OUTSIDE_MODULE_OWNERSHIP")


def check_operation(subject, operation, request, facts):
    """Narrow this experiment's instructions before an existing adapter/policy.

    This does not load, generate or approve an owner policy. Facts and Subject
    come from trusted supervisor code, not an agent's claimed role. A caller must
    still run its existing module-ownership, acceptance and provider checks.
    Native ARCH checkpoint requests carry an exact SHA; changed-path requests
    additionally require host-derived ownership. No Python/tool confinement claim.
    """
    if (not isinstance(subject, Subject) or subject.role not in ROLES or subject.role == "WORKER"
            or not isinstance(subject.session_id, str) or not subject.session_id
            or type(subject.generation) is not int or not 0 <= subject.generation < 2**63):
        raise Denied("UNKNOWN_OR_UNPRIVILEGED_SUBJECT")
    if subject.repo != CURRENT_REPO or not isinstance(request, dict):
        raise Denied("OUTSIDE_CURRENT_REPOSITORY")
    # Preserve Host/GrantPolicy compatibility: an omitted repo is the fixed
    # trusted Subject repo, never an agent-selected default or another account.
    request = {"repo": subject.repo, **request}
    if request["repo"] != CURRENT_REPO:
        raise Denied("OUTSIDE_CURRENT_REPOSITORY")
    if not isinstance(facts, Mapping):
        raise Denied("TRUSTED_FACTS_REQUIRED")
    if operation == "release.public.publish":
        raise Denied("PUBLIC_RELEASE_OWNER_APPROVAL_REQUIRED")
    if operation not in _CURRENT_FIELDS:
        raise Denied("OUTSIDE_CURRENT_ASSIGNMENT")
    required, optional = _CURRENT_FIELDS[operation]
    if not required <= set(request) or set(request) - required - optional:
        raise Denied("INVALID_OPERATION_PAYLOAD")
    expected_generation = facts.get("expected_generation")
    if expected_generation is not None and (type(expected_generation) is not int or subject.generation != expected_generation):
        raise Denied("STALE_SUBJECT_GENERATION")
    if "owner_stopped" in facts and type(facts["owner_stopped"]) is not bool:
        raise Denied("INVALID_STOP_FACT")
    if facts.get("owner_stopped") is True:
        raise Denied("OWNER_STOPPED")
    if operation == "github.state.update":
        branch = branch_name(request["branch"])
        if subject.role not in ("ROOT", "WATCHER", "COORDINATOR", "ARCH", "PROCESS") or not branch.startswith("codex/p4-state-"):
            raise Denied("STATE_WRITER_SCOPE")
        if facts.get("state_branch", branch) != branch:
            raise Denied("WRONG_STATE_BRANCH")
    elif operation == "github.branch.create":
        if subject.role != "ARCH" or not _experimental(request["branch"]) or not _SHA.fullmatch(str(request["base"])):
            raise Denied("BRANCH_CREATION_SCOPE")
    elif operation == "github.branch.update":
        branch = branch_name(request["branch"])
        if (subject.role not in ("ARCH", "JOB", "LANE", "PROCESS") or not _experimental(branch)
                or branch.startswith(("codex/p4-integration-", "codex/p4-state-"))
                or (subject.role != "ARCH" and branch != subject.branch)
                or (subject.branch is not None and branch != subject.branch)):
            raise Denied("BRANCH_WRITER_SCOPE")
        if ("paths" in request) == ("head" in request):
            raise Denied("EXACT_CHECKPOINT_OR_PATHS_REQUIRED")
        if "paths" in request:
            _guard_paths(request["paths"], facts)
        else:
            if subject.role != "ARCH" or not branch.startswith("codex/p4-job-") or not _SHA.fullmatch(str(request["head"])):
                raise Denied("NATIVE_CHECKPOINT_SCOPE")
            if "changed_paths" in facts:
                _guard_paths(facts["changed_paths"], facts)
            if facts.get("observed_head", request["head"]) != request["head"]:
                raise Denied("STALE_PR_HEAD")
    elif operation in ("github.pr.open", "github.pr.update", "github.pr.merge_job"):
        base = branch_name(request["base"])
        if subject.role not in ("ARCH", "JOB", "LANE", "PROCESS") or not base.startswith(("codex/p4-integration-", "codex/p4-grants-broker-", "codex/process4-bootstrap-")):
            raise Denied("PR_SCOPE")
        if "head" in request:
            if (not _experimental(request["head"])
                    or (subject.role != "ARCH" and request["head"] != subject.branch)
                    or (subject.branch is not None and request["head"] != subject.branch)):
                raise Denied("PR_HEAD_SCOPE")
        if "pr" in request and (type(request["pr"]) is not int or request["pr"] < 1):
            raise Denied("INVALID_PR")
        if operation == "github.pr.merge_job":
            head = request["expected_head"]
            if (subject.role != "ARCH" or not base.startswith("codex/p4-integration-")
                    or not isinstance(head, str) or not _SHA.fullmatch(head)
                    or facts.get("observed_head") != head or facts.get("existing_gate_green") is not True):
                raise Denied("EXACT_HEAD_GATE_REQUIRED")
            if any(key in facts and facts[key] is not True for key in ("ownership_verified", "required_module_tests_pass", "pr_target_matches")):
                raise Denied("MODULE_ACCEPTANCE_REQUIRED")
    elif operation == "github.pr.comment":
        if type(request["pr"]) is not int or request["pr"] < 1 or facts.get("comment_purpose") not in ("development_artifact", "review"):
            raise Denied("ROUTINE_GITHUB_COMMUNICATION_FORBIDDEN")
    elif operation in ("session.start", "session.replace"):
        allowed = {"ROOT": {"ARCH", "COORDINATOR", "WATCHER", "PROCESS"}, "ARCH": {"JOB", "LANE"}, "WATCHER": {"ROOT"}}
        if request["child_role"] not in allowed.get(subject.role, set()):
            raise Denied("SESSION_PARENT_RULE")
        if facts.get("valid_generation") is not True or facts.get("child_slot_available") is not True:
            raise Denied("SESSION_LIFECYCLE_CONSTRAINT")
        if request["child_role"] == "PROCESS" and facts.get("process_request_verified") is not True:
            raise Denied("OBSERVED_ARCH_PROCESS_REQUEST_REQUIRED")
    elif operation.startswith("session."):
        if not isinstance(request["recipient"], str) or not request["recipient"] or facts.get("recipient_relation_verified") is not True:
            raise Denied("SESSION_RELATION_NOT_VERIFIED")
    elif operation == "release.dev.prepare":
        if subject.role != "ARCH" or not isinstance(request["release_id"], str) or not request["release_id"] or facts.get("development_release_verified") is not True:
            raise Denied("DEVELOPMENT_RELEASE_NOT_VERIFIED")
    return {"allow": True, "operation": operation, "scope": "current-bootstrap-instructions", "owner_policy_changed": False, "platform_isolation": False}


class GrantPolicy:
    """Host verifies owner-approved bytes against an independently pinned hash."""

    def __init__(self, content: bytes, expected_sha256: str):
        if sha256(content).hexdigest() != expected_sha256:
            raise Denied("POLICY_DIGEST_MISMATCH")
        try:
            data = json.loads(content)
        except (ValueError, UnicodeDecodeError):
            raise Denied("INVALID_POLICY") from None
        if not isinstance(data, dict) or set(data) != {"version", "owner_approved", "repositories", "actions", "cloudflare"} or data["version"] != 1 or data["owner_approved"] is not True:
            raise Denied("POLICY_NOT_APPROVED")
        if not isinstance(data["repositories"], list) or not all(isinstance(x, str) and REPO_RE.fullmatch(x) for x in data["repositories"]):
            raise Denied("INVALID_POLICY_REPOS")
        if not isinstance(data["actions"], dict) or set(data["actions"]) != ROLES:
            raise Denied("INVALID_POLICY_ROLES")
        if any(not isinstance(actions, list) or any(a not in FIELDS for a in actions) for actions in data["actions"].values()):
            raise Denied("INVALID_POLICY_ACTION")
        cloud = data["cloudflare"]
        if not isinstance(cloud, dict) or set(cloud) != {"account", "resources"} or not isinstance(cloud["account"], str) or not isinstance(cloud["resources"], list) or not all(isinstance(x, str) and re.fullmatch(r"[a-z0-9][a-z0-9-]*-", x) for x in cloud["resources"]):
            raise Denied("INVALID_POLICY_CLOUDFLARE")
        self._data = data
        self.digest = expected_sha256

    def authorize(self, subject: Subject, operation: str, request: Mapping[str, Any], *, trusted: Mapping[str, Any] | None = None):
        if not isinstance(subject, Subject):
            raise Denied("UNKNOWN_SUBJECT")
        if operation not in FIELDS:
            raise Denied("UNKNOWN_OPERATION")
        if subject.role not in ROLES or operation not in self._data["actions"][subject.role]:
            raise Denied("ROLE_NOT_GRANTED")
        if not isinstance(request, dict) or set(request) - FIELDS[operation]:
            raise Denied("INVALID_OPERATION_PAYLOAD")
        repo = request.get("repo", subject.repo)
        if repo != subject.repo or repo not in self._data["repositories"]:
            raise Denied("REPO_NOT_GRANTED")
        facts = trusted or {}
        if operation == "release.public.publish":
            raise Denied("PUBLIC_RELEASE_OWNER_APPROVAL_REQUIRED")
        if operation.startswith("github."):
            self._github(subject, operation, request, facts)
        elif operation.startswith("session."):
            self._session(subject, operation, request, facts)
        elif operation.startswith("cloudflare."):
            self._cloudflare(subject, request)
        elif operation == "release.dev.prepare" and not facts.get("development_release_verified"):
            raise Denied("DEVELOPMENT_RELEASE_NOT_VERIFIED")
        return {"allow": True, "operation": operation, "policy_sha256": self.digest}

    def _github(self, s, operation, request, facts):
        ref = branch_name(request.get("branch", s.branch)) if operation not in ("github.pr.comment",) else None
        if operation == "github.state.update":
            if ref != facts.get("state_branch", "process4-state") or s.role not in ("ROOT", "WATCHER", "COORDINATOR", "ARCH", "PROCESS"):
                raise Denied("STATE_WRITER_NOT_ALLOWED")
        elif operation == "github.branch.create":
            if s.role != "ARCH" or not ref.startswith("codex/p4-job-") or ref != facts.get("assigned_branch") or request.get("base") != facts.get("assigned_base"):
                raise Denied("BRANCH_PROVISIONING_NOT_ASSIGNED")
        elif operation == "github.branch.update":
            if s.role not in ("JOB", "LANE", "PROCESS"):
                raise Denied("BRANCH_WRITER_ROLE")
            if ref != s.branch or not ref.startswith("codex/p4-job-" if s.role == "JOB" else "codex/p4-"):
                raise Denied("WRONG_JOB_BRANCH")
            changes = paths_of(request.get("paths"))
            assigned = facts.get("owned_paths")
            if not isinstance(assigned, tuple) or not assigned or not all(any(owns(path, owned) for owned in assigned) for path in changes):
                raise Denied("OUTSIDE_MODULE_OWNERSHIP")
            if any(any(part in (".github", ".claude", ".codex", ".git", ".agents", ".aws", "CLAUDE.md", "AGENTS.md") for part in path.split("/")) for path in changes):
                raise Denied("PROTECTED_CONFIGURATION_PATH")
        elif operation in ("github.pr.open", "github.pr.update"):
            if s.role not in ("JOB", "LANE", "ARCH", "PROCESS") or request.get("head") != s.branch or request.get("base") not in ("tranche", "codex/process4-bootstrap-20261116"):
                raise Denied("PR_SCOPE")
        elif operation == "github.pr.merge_job":
            if s.role != "ARCH" or request.get("base") != "tranche" or not facts.get("required_module_tests_pass") or not facts.get("head_sha_matches") or not facts.get("pr_target_matches"):
                raise Denied("JOB_MERGE_NOT_VERIFIED")
            if not isinstance(request.get("expected_head"), str) or request["expected_head"] != facts.get("observed_head"):
                raise Denied("STALE_PR_HEAD")
        elif operation == "github.pr.merge_tranche":
            if s.role != "ARCH" or request.get("base") != "main" or not all(facts.get(k) for k in ("all_module_tests_pass", "internal_walk_clean", "external_walk_clean", "head_sha_matches", "pr_target_matches")):
                raise Denied("TRANCHE_NOT_VERIFIED")
            if not isinstance(request.get("expected_head"), str) or request["expected_head"] != facts.get("observed_head"):
                raise Denied("STALE_PR_HEAD")
        elif operation == "github.pr.comment":
            if not isinstance(request.get("pr"), int) or request["pr"] < 1:
                raise Denied("INVALID_PR")
        else:
            raise Denied("UNSUPPORTED_GITHUB_OPERATION")

    def _cloudflare(self, subject, request):
        if subject.role != "ARCH":
            raise Denied("CLOUDFLARE_ROLE")
        if request.get("account") != self._data["cloudflare"]["account"]:
            raise Denied("CLOUDFLARE_ACCOUNT")
        resource = request.get("resource")
        if not isinstance(resource, str) or not re.fullmatch(r"[a-z0-9][a-z0-9-]{1,62}", resource) or not any(resource.startswith(prefix) for prefix in self._data["cloudflare"]["resources"]):
            raise Denied("CLOUDFLARE_RESOURCE")

    def _session(self, subject, operation, request, facts):
        if operation in ("session.start", "session.replace"):
            allowed = {"ROOT": {"ARCH", "COORDINATOR", "WATCHER", "PROCESS"}, "ARCH": {"JOB", "LANE"}, "WATCHER": {"ROOT"}}
            if request.get("child_role") not in allowed.get(subject.role, set()):
                raise Denied("SESSION_PARENT_RULE")
            if not facts.get("child_slot_available") or not facts.get("valid_generation"):
                raise Denied("SESSION_LIFECYCLE_CONSTRAINT")
        elif not facts.get("recipient_relation_verified"):
            raise Denied("SESSION_RELATION_NOT_VERIFIED")


class Broker:
    """The privileged host owns all callbacks; agents get only perform()."""

    def __init__(self, policy: GrantPolicy, adapter: Callable, subject_lookup: Callable, trusted_facts: Callable):
        self.__policy = policy
        self.__adapter = adapter
        self.__subject_lookup = subject_lookup
        self.__trusted_facts = trusted_facts

    def perform(self, session_id: str, operation: str, request: dict):
        subject = self.__subject_lookup(session_id)
        if not isinstance(subject, Subject):
            raise Denied("UNKNOWN_SUBJECT")
        facts = self.__trusted_facts(subject, operation, request)
        self.__policy.authorize(subject, operation, request, trusted=facts)
        return self.__adapter(operation, request)
