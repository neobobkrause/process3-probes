"""Native capability classification tests; live evidence is recorded separately."""
import unittest
from native.capabilities import Finding,assess,require_approved_runtime,replacement_scope


class NativeCapabilityTests(unittest.TestCase):
    def test_paid_fallback_cannot_satisfy_owner_runtime_constraint(self):
        for provider,billing in [('third_party_vm','existing_subscription_allowance'),
                                 ('openai_managed','metered_api'),('openai_managed','unknown')]:
            with self.assertRaises(PermissionError):
                require_approved_runtime(provider=provider,billing=billing,mechanism='native_subagent')

    def test_undocumented_http_launch_is_rejected(self):
        with self.assertRaises(PermissionError):
            require_approved_runtime(provider='openai_managed',billing='existing_subscription_allowance',mechanism='guessed_task_endpoint')

    def test_bounded_child_and_schedule_cannot_prove_root_recreation(self):
        result=assess({'native_child_start':Finding('observed','fixture child completion'),
                       'hosted_wake_delivery':Finding('observed','fixture delivered wake'),
                       'root_recreation':Finding('not_exposed','actual tool inventory')})
        self.assertEqual(result.status,'feasibility_limited')
        self.assertIn('root_recreation',result.missing)
        self.assertEqual(replacement_scope('native_subagent'),'current_agent_tree_child_only')

    def test_documentation_is_not_execution_evidence(self):
        result=assess({'root_loss_recovery':Finding('documented','fixture documentation')})
        self.assertNotIn('root_loss_recovery',result.demonstrated)

    def test_external_block_does_not_end_independent_implementation(self):
        result=assess({'root_recreation':Finding('not_exposed','fixture inventory')},('implement durable mailbox',))
        self.assertEqual(result.status,'continue')
