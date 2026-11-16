"""Clarified native acceptance; actual execution evidence remains separate."""
import unittest
from native.capabilities import Finding,assess,require_approved_runtime,replacement_scope,require_development_admission,REQUIRED

class NativeCapabilityTests(unittest.TestCase):
    def test_paid_fallback_cannot_satisfy_owner_runtime_constraint(self):
        for provider,billing in [('third_party_vm','existing_subscription_allowance'),('openai_managed','metered_api'),('openai_managed','unknown')]:
            with self.assertRaises(PermissionError):
                require_approved_runtime(provider=provider,billing=billing,mechanism='native_subagent')

    def test_undocumented_http_launch_is_rejected(self):
        with self.assertRaises(PermissionError):
            require_approved_runtime(provider='openai_managed',billing='existing_subscription_allowance',mechanism='guessed_task_endpoint')

    def test_missing_root_resurrection_and_optional_sandbox_do_not_block(self):
        findings={key:Finding('observed','fixture required evidence') for key in REQUIRED}
        findings['root_recreation']=Finding('not_exposed','fixture lifecycle inventory')
        findings['root_loss_recovery']=Finding('blocked','fixture lifecycle limitation')
        findings['module_sandbox_isolation']=Finding('blocked','fixture writable sibling canary')
        self.assertEqual(assess(findings).status,'demonstrated')
        self.assertEqual(replacement_scope('native_subagent'),'current_agent_tree_child_only')

    def test_documentation_is_not_execution_evidence(self):
        result=assess({'authorized_working_integration':Finding('documented','fixture documentation')})
        self.assertIn('authorized_working_integration',result.unresolved)

    def test_independent_work_survives_external_blocker(self):
        findings={key:Finding('blocked','fixture dependency') for key in REQUIRED}
        self.assertEqual(assess(findings,('implement durable mailbox',)).status,'continue')

class NativeAdmissionTests(unittest.TestCase):
    def test_explicit_scope_allows_development_despite_optional_sandbox_failure(self):
        findings={'job_ownership_instructions':Finding('observed','fixture assignment'),
                  'consequential_restrictions':Finding('observed','fixture controller restrictions'),
                  'module_sandbox_isolation':Finding('blocked','fixture canary result')}
        require_development_admission(findings)

    def test_missing_scope_or_consequential_restrictions_still_refuses(self):
        with self.assertRaisesRegex(PermissionError,'JOB_SCOPE'):
            require_development_admission({'module_sandbox_isolation':Finding('observed','fixture OS policy')})

class NativeContinuationTests(unittest.TestCase):
    def test_unknown_requirement_is_work_not_external_block(self):
        findings={key:Finding('blocked','fixture external dependency') for key in REQUIRED}
        self.assertEqual(assess(findings).status,'external_blocked')
        findings.pop('all_user_notifications')
        result=assess(findings)
        self.assertEqual(result.status,'continue')
        self.assertIn('all_user_notifications',result.unresolved)

    def test_one_pending_development_cycle_keeps_continuation_open(self):
        findings={key:Finding('observed','fixture completed evidence') for key in REQUIRED}
        findings['automated_preservation_pr']=Finding('unproven','pending real native cycle')
        self.assertEqual(assess(findings).status,'continue')
