import unittest
from continuation import assess, require_valid_exit, PROOF_KEYS


ALL = {k: True for k in PROOF_KEYS}


class ContinuationTests(unittest.TestCase):
    def test_no_jobs_not_completion_without_proofs(self):
        outcome = assess({"jobs": {}, "stopped": False}, proofs={}, dependencies={})
        self.assertEqual(outcome.status, "continue")
        self.assertEqual(len(outcome.missing_proofs), len(PROOF_KEYS))

    def test_passed_tests_not_assignment_completion(self):
        proof = {**ALL, "oauth_inference_and_refresh_live": False}
        outcome = assess({"jobs": {"provider": {"status": "done", "checkpoint":"fixture", "last_result":{"verified":True,"turn_completed":True}}}}, proofs=proof, dependencies={})
        self.assertEqual(outcome.status, "continue")
        self.assertIn("oauth_inference_and_refresh_live", outcome.runnable)

    def test_actual_full_completion(self):
        outcome = assess({"jobs": {"provider": {"status": "done", "checkpoint":"fixture", "last_result":{"verified":True,"turn_completed":True}}}}, proofs=ALL, dependencies={})
        self.assertEqual(outcome.status, "complete")
        require_valid_exit(outcome)

    def test_failed_job_not_completion(self):
        outcome = assess({"jobs": {"provider": {"status": "blocked"}}}, proofs=ALL, dependencies={})
        self.assertEqual(outcome.status, "continue")
        with self.assertRaises(RuntimeError):
            require_valid_exit(outcome)

    def test_only_concretely_blocked_work_may_suspend(self):
        outcome = assess({"jobs": {"provider": {"status": "blocked"}}},
                         proofs=ALL, dependencies={"provider": "Provider OAuth refresh revoked"})
        self.assertEqual(outcome.status, "external_blocked")
        self.assertEqual(outcome.blocked, ("provider",))
        require_valid_exit(outcome)

    def test_independent_work_survives_external_blocker(self):
        outcome = assess({"jobs": {"provider": {"status": "blocked"}, "broker": {"status": "ready"}}},
                         proofs=ALL, dependencies={"provider": "OAuth authorization revoked"})
        self.assertEqual(outcome.status, "continue")
        self.assertIn("broker", outcome.runnable)
        self.assertIn("provider", outcome.blocked)

    def test_unknown_blocker_is_not_confirmed_external_dependency(self):
        outcome = assess({"jobs": {"provider": {"status": "blocked"}}},
                         proofs=ALL, dependencies={"provider": ""})
        self.assertEqual(outcome.status, "continue")

    def test_owner_stop_is_not_completion(self):
        outcome = assess({"jobs": {"provider": {"status": "ready"}}},
                         proofs=ALL, dependencies={},)
        self.assertEqual(outcome.status, "continue")
        stopped = assess({"jobs": {"provider": {"status": "ready"}}, "stopped": True, "stop_source":"owner"},
                         proofs=ALL, dependencies={})
        self.assertEqual(stopped.status, "owner_stopped")
        self.assertNotEqual(stopped.status, "complete")

    def test_replacement_session_needs_proof(self):
        proof = {**ALL, "role_replacement_live": False}
        outcome = assess({"jobs": {"root": {"status": "done"}}}, proofs=proof, dependencies={})
        self.assertEqual(outcome.status, "continue")

    def test_invalid_state_fails_closed(self):
        with self.assertRaises(ValueError):
            assess({"jobs": []}, proofs=ALL, dependencies={})


if __name__ == "__main__":
    unittest.main()
