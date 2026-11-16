import json
import hashlib
import unittest
from grants import GrantPolicy, Denied, Subject, Broker

REPO = "neobobkrause/process3-probes"
POLICY = {
    "version": 1,
    "owner_approved": True,
    "repositories": [REPO],
    "actions": {
        "ROOT": ["session.start", "session.replace", "session.message", "session.interrupt", "github.state.update", "github.pr.comment"],
        "WATCHER": ["session.replace", "session.message", "session.interrupt", "github.state.update"],
        "COORDINATOR": ["session.message", "session.interrupt", "github.state.update", "github.pr.comment"],
        "ARCH": ["session.start", "session.replace", "session.message", "session.interrupt", "github.state.update", "github.pr.comment", "github.pr.open", "github.pr.update", "github.pr.merge_job", "github.pr.merge_tranche", "cloudflare.dev.deploy", "cloudflare.dev.remove", "release.dev.prepare"],
        "JOB": ["github.branch.update", "github.pr.open", "github.pr.update", "github.pr.comment"],
        "LANE": ["github.branch.update", "github.pr.open", "github.pr.update", "github.pr.comment"],
        "PROCESS": ["github.branch.update", "github.pr.open", "github.pr.update", "github.state.update", "github.pr.comment"],
        "WORKER": [],
    },
    "cloudflare": {"account": "probe-development-account", "resources": ["p4dev-"]},
}


def policy():
    blob = json.dumps(POLICY, sort_keys=True).encode()
    return GrantPolicy(blob, hashlib.sha256(blob).hexdigest())


JOB = Subject("job-1", "JOB", REPO, "codex/p4-job-example-provider", "provider")
ARCH = Subject("arch-1", "ARCH", REPO, "tranche")
ROOT = Subject("root-1", "ROOT", REPO)


def req(**kwargs):
    return {"repo": REPO, **kwargs}


def owned(**kwargs):
    return {"owned_paths": ("toy/provider/",), **kwargs}


class GrantsTests(unittest.TestCase):
    def setUp(self):
        self.p = policy()

    def allow(self, role, operation, request, facts=None):
        self.assertTrue(self.p.authorize(role, operation, request, trusted=facts or {})["allow"])

    def deny(self, role, operation, request, reason, facts=None):
        with self.assertRaises(Denied) as caught:
            self.p.authorize(role, operation, request, trusted=facts or {})
        self.assertEqual(caught.exception.reason, reason)

    def test_owned_job_commit(self):
        self.allow(JOB, "github.branch.update", req(branch=JOB.branch, paths=["toy/provider/index.py"]), owned())

    def test_cross_module_denied(self):
        self.deny(JOB, "github.branch.update", req(branch=JOB.branch, paths=["toy/consumer/index.py"]), "OUTSIDE_MODULE_OWNERSHIP", owned())

    def test_protected_settings_denied(self):
        self.deny(JOB, "github.branch.update", req(branch=JOB.branch, paths=["AGENTS.md"]), "OUTSIDE_MODULE_OWNERSHIP", owned())

    def test_wrong_branch(self):
        self.deny(JOB, "github.branch.update", req(branch="main", paths=["toy/provider/a.py"]), "WRONG_JOB_BRANCH", owned())

    def test_relative_traversal(self):
        self.deny(JOB, "github.branch.update", req(branch=JOB.branch, paths=["toy/provider/../x"]), "INVALID_CHANGED_PATH", owned())

    def test_absolute_path(self):
        self.deny(JOB, "github.branch.update", req(branch=JOB.branch, paths=["/toy/provider/a"]), "INVALID_CHANGED_PATH", owned())

    def test_job_cannot_merge(self):
        self.deny(JOB, "github.pr.merge_job", req(base="tranche"), "ROLE_NOT_GRANTED")

    def test_job_cannot_start(self):
        self.deny(JOB, "session.start", req(child_role="JOB"), "ROLE_NOT_GRANTED")

    def test_unknown_operation(self):
        self.deny(ARCH, "github.admin.update", req(), "UNKNOWN_OPERATION")

    def test_other_repo(self):
        self.deny(JOB, "github.branch.update", req(repo="other/repo", branch=JOB.branch, paths=["toy/provider/a"]), "REPO_NOT_GRANTED", owned())

    def test_tranche_merge_missing_walk(self):
        self.deny(ARCH, "github.pr.merge_tranche", req(base="main", expected_head="abc"), "TRANCHE_NOT_VERIFIED", {"all_module_tests_pass": True, "internal_walk_clean": True, "head_sha_matches": True, "pr_target_matches": True, "observed_head": "abc"})

    def test_tranche_merge_all_three(self):
        self.allow(ARCH, "github.pr.merge_tranche", req(base="main", expected_head="abc"), {"all_module_tests_pass": True, "internal_walk_clean": True, "external_walk_clean": True, "head_sha_matches": True, "pr_target_matches": True, "observed_head": "abc"})

    def test_job_merge_wrong_target(self):
        self.deny(ARCH, "github.pr.merge_job", req(base="tranche", expected_head="abc"), "JOB_MERGE_NOT_VERIFIED", {"required_module_tests_pass": True, "head_sha_matches": True, "pr_target_matches": False, "observed_head": "abc"})

    def test_tranche_merge_stale_head(self):
        self.deny(ARCH, "github.pr.merge_tranche", req(base="main", expected_head="old"), "STALE_PR_HEAD", {"all_module_tests_pass": True, "internal_walk_clean": True, "external_walk_clean": True, "head_sha_matches": True, "pr_target_matches": True, "observed_head": "new"})

    def test_job_merge_verified(self):
        self.allow(ARCH, "github.pr.merge_job", req(base="tranche", expected_head="abc"), {"required_module_tests_pass": True, "head_sha_matches": True, "pr_target_matches": True, "observed_head": "abc"})

    def test_job_merge_stale_head(self):
        self.deny(ARCH, "github.pr.merge_job", req(base="tranche", expected_head="abc"), "STALE_PR_HEAD", {"required_module_tests_pass": True, "head_sha_matches": True, "pr_target_matches": True, "observed_head": "def"})

    def test_cf_protected_resource(self):
        self.deny(ARCH, "cloudflare.dev.deploy", req(account="probe-development-account", resource="civicsmith-site"), "CLOUDFLARE_RESOURCE")

    def test_cf_other_account(self):
        self.deny(ARCH, "cloudflare.dev.deploy", req(account="public-account", resource="p4dev-worker"), "CLOUDFLARE_ACCOUNT")

    def test_cf_dev_resource(self):
        self.allow(ARCH, "cloudflare.dev.deploy", req(account="probe-development-account", resource="p4dev-worker"))

    def test_job_cf_refused(self):
        self.deny(JOB, "cloudflare.dev.deploy", req(account="probe-development-account", resource="p4dev-worker"), "ROLE_NOT_GRANTED")

    def test_root_start_arch(self):
        self.allow(ROOT, "session.start", req(child_role="ARCH"), {"child_slot_available": True, "valid_generation": True})

    def test_root_not_start_job(self):
        self.deny(ROOT, "session.start", req(child_role="JOB"), "SESSION_PARENT_RULE", {"child_slot_available": True, "valid_generation": True})

    def test_no_slot(self):
        self.deny(ARCH, "session.start", req(child_role="JOB"), "SESSION_LIFECYCLE_CONSTRAINT", {"child_slot_available": False, "valid_generation": True})

    def test_valid_message(self):
        self.allow(ROOT, "session.message", req(recipient="arch-1"), {"recipient_relation_verified": True})

    def test_unrelated_message(self):
        self.deny(ROOT, "session.message", req(recipient="stranger"), "SESSION_RELATION_NOT_VERIFIED")

    def test_digest_mismatch(self):
        blob = json.dumps(POLICY, sort_keys=True).encode()
        with self.assertRaisesRegex(Denied, "POLICY_DIGEST_MISMATCH"):
            GrantPolicy(blob + b" ", hashlib.sha256(blob).hexdigest())

    def test_no_approval(self):
        p = dict(POLICY, owner_approved=False)
        blob = json.dumps(p).encode()
        with self.assertRaisesRegex(Denied, "POLICY_NOT_APPROVED"):
            GrantPolicy(blob, hashlib.sha256(blob).hexdigest())

    def test_public_release_not_granted(self):
        self.deny(ARCH, "release.public.publish", req(), "ROLE_NOT_GRANTED")

    def test_broker_denied_does_not_reach_adapter(self):
        calls = []
        broker = Broker(self.p, lambda op, data: calls.append(op), lambda _: JOB, lambda sub, op, data: owned())
        with self.assertRaises(Denied):
            broker.perform("job-1", "github.pr.merge_job", req(base="tranche"))
        self.assertEqual(calls, [])

    def test_broker_permitted_invokes_adapter(self):
        calls = []
        broker = Broker(self.p, lambda op, data: calls.append((op, data)) or "ok", lambda _: JOB, lambda sub, op, data: owned())
        self.assertEqual(broker.perform("job-1", "github.branch.update", req(branch=JOB.branch, paths=["toy/provider/x.py"])), "ok")
        self.assertEqual(len(calls), 1)

    def test_role_spoof_is_rejected(self):
        self.deny(JOB, "github.branch.update", req(branch=JOB.branch, paths=["toy/provider/a"], role="ARCH"), "INVALID_OPERATION_PAYLOAD", owned())

    def test_missing_paths(self):
        self.deny(JOB, "github.branch.update", req(branch=JOB.branch), "MISSING_CHANGED_PATHS", owned())

    def test_dev_release_without_evidence(self):
        self.deny(ARCH, "release.dev.prepare", req(), "DEVELOPMENT_RELEASE_NOT_VERIFIED")

    def test_dev_release_with_evidence(self):
        self.allow(ARCH, "release.dev.prepare", req(), {"development_release_verified": True})


if __name__ == "__main__":
    unittest.main()
