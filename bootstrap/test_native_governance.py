"""PROCESS guards: fixtures prove denied-before-adapter, not platform isolation."""
import copy
import unittest

from grants.grants import Broker, Denied, Subject, check_operation
from grants.host import Host
from native import governance as g

REPO = 'neobobkrause/process3-probes'
SHA = 'a' * 40
ARCH = Subject('/root/root/arch', 'ARCH', REPO, generation=3)
JOB = Subject('/root/root/arch/job', 'JOB', REPO, 'codex/p4-job-demo', 'demo', 2)


def state():
    return {'native_layout': {'mode': 'addressable_root'}, 'native_roles': {
        'ROOT': {'target': '/root/root', 'generation': 1},
        'ARCH': {'target': ARCH.session_id, 'generation': ARCH.generation}}, 'stopped': False}


class TechnicalPolicy:
    def authorize(self, subject, operation, request, *, trusted):
        return check_operation(subject, operation, request, trusted)


class NativeGovernanceTests(unittest.TestCase):
    def test_consequential_denials_happen_before_adapter_even_with_permissive_policy(self):
        class Permissive:
            def authorize(self, *a, **k):return {'allow': True}
        cases = [
            ('github.pr.merge_tranche', {'repo': REPO, 'base': 'main', 'pr': 1, 'expected_head': SHA}),
            ('github.pr.merge_job', {'repo': REPO, 'base': 'tranche', 'pr': 1, 'expected_head': SHA}),
            ('github.settings.update', {'repo': REPO}),
            ('process.pin.update', {'repo': REPO}),
            ('release.public.publish', {'repo': REPO, 'release_id': 'v1'}),
            ('cloudflare.dev.deploy', {'repo': REPO, 'account': 'unapproved', 'resource': 'worker'}),
            ('github.state.update', {'repo': 'neobobkrause/CivicSmith2', 'branch': 'codex/p4-state-demo'}),
            ('github.branch.update', {'repo': REPO, 'branch': 'main', 'head': SHA}),
            ('github.branch.update', {'repo': REPO, 'branch': 'codex/p4-integration-demo', 'head': SHA}),
        ]
        host = Host(Permissive())
        for operation, request in cases:
            calls = []
            with self.subTest(operation=operation, request=request), self.assertRaises(Denied):
                host.perform(ARCH, operation, request, lambda: calls.append('BAD'), {'observed_head': SHA, 'existing_gate_green': True})
            self.assertEqual(calls, [])

    def test_current_scope_composes_with_policy_and_valid_operation_reaches_adapter(self):
        request = {'repo': REPO, 'branch': 'codex/p4-state-demo'}
        class Policy:
            calls = 0
            def authorize(self, *a, **k):self.calls += 1
        policy = Policy();calls = []
        self.assertEqual(Host(policy).perform(ARCH, 'github.state.update', request, lambda: calls.append('ok') or 7), 7)
        self.assertEqual((policy.calls, calls), (1, ['ok']))
        class Refusing:
            def authorize(self, *a, **k):raise Denied('PINNED_POLICY_REFUSED')
        calls.clear()
        with self.assertRaisesRegex(Denied, 'PINNED_POLICY_REFUSED'):
            Host(Refusing()).perform(ARCH, 'github.state.update', request, lambda: calls.append('bad'))
        self.assertEqual(calls, [])

    def test_exact_head_gate_and_role_required_for_experimental_integration(self):
        request = {'repo': REPO, 'base': 'codex/p4-integration-demo', 'pr': 4, 'expected_head': SHA}
        facts = {'observed_head': SHA, 'existing_gate_green': True}
        self.assertTrue(check_operation(ARCH, 'github.pr.merge_job', request, facts)['allow'])
        for actor, change, evidence in [(JOB, {}, facts), (ARCH, {'base': 'main'}, facts),
                (ARCH, {'pr': True}, facts), (ARCH, {}, {**facts, 'observed_head': 'b' * 40}),
                (ARCH, {}, {**facts, 'existing_gate_green': 'yes'}),
                (ARCH, {}, {**facts, 'ownership_verified': False})]:
            with self.subTest(actor=actor, change=change, evidence=evidence), self.assertRaises(Denied):
                check_operation(actor, 'github.pr.merge_job', {**request, **change}, evidence)

    def test_paths_require_ownership_and_keep_owner_authority_immutable(self):
        request = {'repo': REPO, 'branch': JOB.branch, 'paths': ['toy/demo/value.py']}
        facts = {'owned_paths': ('toy/demo/',)}
        self.assertTrue(check_operation(JOB, 'github.branch.update', request, facts)['allow'])
        process = Subject('process', 'PROCESS', REPO, 'codex/p4-stream-c-demo')
        for path in ('CLAUDE.md', '.github/workflows/gate.yml', '.process/tool.js',
                     'process/config.json', 'bootstrap/OWNER-approval.txt', 'toy/demo/../other.py', 'toy/peer/x.py'):
            with self.subTest(path=path), self.assertRaises(Denied):
                check_operation(process, 'github.branch.update', {**request, 'branch': process.branch, 'paths': [path]}, {'owned_paths': ('toy/demo/', 'bootstrap/', 'process/', 'CLAUDE.md', '.github/', '.process/')})
        with self.assertRaises(Denied):
            check_operation(JOB, 'github.branch.update', request, {})
        with self.assertRaises(Denied):
            check_operation(JOB, 'github.branch.update', request, {**facts, 'immutable_paths': ['toy/demo/value.py']})
        self.assertTrue(check_operation(process, 'github.branch.update',
            {'repo': REPO, 'branch': process.branch, 'paths': ['bootstrap/grants/grants.py']},
            {'owned_paths': ('bootstrap/grants/',)})['allow'])

    def test_non_arch_writer_requires_explicit_assigned_branch(self):
        for role in ('JOB', 'LANE', 'PROCESS'):
            subject = Subject('fixture-' + role, role, REPO)
            calls = []
            broker = Broker(TechnicalPolicy(), lambda *_: calls.append('bad'), lambda _: subject,
                            lambda *_: {'owned_paths': ('toy/demo/',)})
            with self.subTest(role=role), self.assertRaises(Denied):
                broker.perform(subject.session_id, 'github.branch.update',
                    {'repo': REPO, 'branch': 'codex/p4-job-demo', 'paths': ['toy/demo/value.py']})
            self.assertEqual(calls, [])

    def test_non_arch_pr_cannot_select_unassigned_head(self):
        for role in ('JOB', 'LANE', 'PROCESS'):
            for branch in (None, 'codex/p4-job-other'):
                with self.subTest(role=role, branch=branch), self.assertRaises(Denied):
                    check_operation(Subject('fixture', role, REPO, branch), 'github.pr.open',
                        {'repo': REPO, 'head': 'codex/p4-job-demo', 'base': 'codex/p4-integration-demo'}, {})
        self.assertTrue(check_operation(ARCH, 'github.pr.open',
            {'repo': REPO, 'head': 'codex/p4-job-demo', 'base': 'codex/p4-integration-demo'}, {})['allow'])

    def test_no_role_spoof_unknown_subject_stale_generation_or_github_message_bus(self):
        request = {'repo': REPO, 'branch': 'codex/p4-state-demo'}
        for subject, payload, facts in [(None, request, {}), (ARCH, {**request, 'role': 'ROOT'}, {}),
                                        (ARCH, request, {'expected_generation': 2}),
                                        (ARCH, request, {'owner_stopped': True})]:
            with self.subTest(subject=subject, payload=payload), self.assertRaises(Denied):
                check_operation(subject, 'github.state.update', payload, facts)
        with self.assertRaises(Denied):check_operation(ARCH, 'github.pr.comment', {'repo': REPO, 'pr': 3}, {})
        calls = []
        broker = Broker(TechnicalPolicy(), lambda *_: calls.append('bad'), lambda _: None,
                        lambda *_: (_ for _ in ()).throw(AssertionError('facts called before subject validation')))
        with self.assertRaisesRegex(Denied, 'UNKNOWN_SUBJECT'):broker.perform('unknown', 'github.state.update', request)
        self.assertEqual(calls, [])

    def test_process_request_retains_schema_and_rejects_replaced_arch(self):
        s = state();original = copy.deepcopy(s)
        request = g.process_request(s, actor=ARCH.session_id, generation=3, evidence='actual native ARCH request fixture')
        self.assertEqual(set(request), {'arch', 'source', 'evidence'})
        s['native_layout']['process_request'] = request
        self.assertEqual(g.plan_process_lane(s, actor='/root/root')['action'], 'create')
        self.assertEqual(s['native_roles'], original['native_roles'])
        s['native_roles']['ARCH']['generation'] = 4
        with self.assertRaisesRegex(Denied, 'CURRENT_ARCH_REQUEST_REQUIRED'):g.validate_process_request(s)
        with self.assertRaises(Denied):g.process_request(s, actor=ARCH.session_id, generation=3, evidence='old request')

    def test_process_plan_keeps_stop_and_root_creation_boundary(self):
        s = state();s['native_layout']['process_request'] = g.process_request(s, actor=ARCH.session_id, generation=3, evidence='actual request')
        with self.assertRaises(Denied):g.plan_process_lane(s, actor=ARCH.session_id)
        s.update(stopped=True, stop_source='owner');old = copy.deepcopy(s)
        self.assertEqual(g.plan_process_lane(s, actor='/root/root')['action'], 'hold')
        self.assertEqual(s, old)
        root = Subject('/root/root', 'ROOT', REPO)
        with self.assertRaises(Denied):check_operation(root, 'session.start', {'repo': REPO, 'child_role': 'PROCESS'}, {'valid_generation': True, 'child_slot_available': True})

    def test_question_proposal_or_technical_assertion_does_not_become_owner_decision(self):
        record = {'source': 'observed-owner-input', 'kind': 'decision', 'text': 'Yes\nExact second line.', 'evidence': 'actual observed owner console input'}
        self.assertEqual(g.require_owner_evidence(record)['text'], record['text'])
        for changed in ({'kind': 'question'}, {'kind': 'proposal'}, {'source': 'ARCH'}, {'evidence': ''}):
            with self.assertRaises(Denied):g.require_owner_evidence({**record, **changed})
        self.assertEqual(record['kind'], 'decision')


if __name__ == '__main__':unittest.main()
