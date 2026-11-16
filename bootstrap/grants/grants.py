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


class GrantPolicy:
    """Host verifies owner-approved bytes against an independently pinned hash."""

    def __init__(self, content: bytes, expected_sha256: str):
        if sha256(content).hexdigest() != expected_sha256:
            raise Denied("POLICY_DIGEST_MISMATCH")
        try:
            data = json.loads(content)
        except (ValueError, UnicodeDecodeError):
            raise Denied("INVALID_POLICY") from None
        if set(data) != {"version", "owner_approved", "repositories", "actions", "cloudflare"} or data["version"] != 1 or data["owner_approved"] is not True:
            raise Denied("POLICY_NOT_APPROVED")
        if not isinstance(data["repositories"], list) or not all(isinstance(x, str) and REPO_RE.fullmatch(x) for x in data["repositories"]):
            raise Denied("INVALID_POLICY_REPOS")
        if not isinstance(data["actions"], dict) or set(data["actions"]) != ROLES:
            raise Denied("INVALID_POLICY_ROLES")
        if any(not isinstance(actions, list) or any(a not in FIELDS for a in actions) for actions in data["actions"].values()):
            raise Denied("INVALID_POLICY_ACTION")
        cloud = data["cloudflare"]
        if not isinstance(cloud, dict) or set(cloud) != {"account", "resources"} or not isinstance(cloud["account"], str) or not isinstance(cloud["resources"], list):
            raise Denied("INVALID_POLICY_CLOUDFLARE")
        self._data = data
        self.digest = expected_sha256

    def authorize(self, subject: Subject, operation: str, request: Mapping[str, Any], *, trusted: Mapping[str, Any] | None = None):
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
            if ref != "process4-state" or s.role not in ("ROOT", "WATCHER", "COORDINATOR", "ARCH", "PROCESS"):
                raise Denied("STATE_WRITER_NOT_ALLOWED")
        elif operation == "github.branch.update":
            if s.role not in ("JOB", "LANE", "PROCESS"):
                raise Denied("BRANCH_WRITER_ROLE")
            if ref != s.branch or not ref.startswith("codex/p4-job-" if s.role == "JOB" else "codex/p4-"):
                raise Denied("WRONG_JOB_BRANCH")
            changes = paths_of(request.get("paths"))
            assigned = facts.get("owned_paths")
            if not isinstance(assigned, tuple) or not assigned or not all(any(owns(path, owned) for owned in assigned) for path in changes):
                raise Denied("OUTSIDE_MODULE_OWNERSHIP")
            if any(path.startswith((".github/", ".claude/", ".codex/")) or path in ("CLAUDE.md", "AGENTS.md") for path in changes):
                raise Denied("PROTECTED_CONFIGURATION_PATH")
        elif operation in ("github.pr.open", "github.pr.update"):
            if s.role not in ("JOB", "LANE", "ARCH", "PROCESS") or request.get("head") != s.branch or request.get("base") not in ("tranche", "codex/process4-bootstrap-20261116"):
                raise Denied("PR_SCOPE")
        elif operation == "github.pr.merge_job":
            if s.role != "ARCH" or request.get("base") != "tranche" or not facts.get("required_module_tests_pass") or not facts.get("head_sha_matches"):
                raise Denied("JOB_MERGE_NOT_VERIFIED")
            if not isinstance(request.get("expected_head"), str) or request["expected_head"] != facts.get("observed_head"):
                raise Denied("STALE_PR_HEAD")
        elif operation == "github.pr.merge_tranche":
            if s.role != "ARCH" or request.get("base") != "main" or not all(facts.get(k) for k in ("all_module_tests_pass", "internal_walk_clean", "external_walk_clean", "head_sha_matches")):
                raise Denied("TRANCHE_NOT_VERIFIED")
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
        facts = self.__trusted_facts(subject, operation, request)
        self.__policy.authorize(subject, operation, request, trusted=facts)
        return self.__adapter(operation, request)
