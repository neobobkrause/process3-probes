"""Control-plane evidence fixtures, not actual product tests or walks."""
import copy
import unittest
from native import walks as w

H = 'a' * 40
J = 'b' * 40
TREE = 'c' * 40


def state(head=H):
    return {'jobs': {'web': {'accepted': True, 'checkpoint': J}},
            'modules': {'web': {'paths': ['toy/web'], 'uses': ['provider']}, 'report': {'paths': ['toy/report']}},
            'stopped': False}


def module_receipt(head=H):
    return {'observed': True, 'module': 'web', 'actor': '/root/root/arch/web',
            'source': 'fixture actual-command receipt', 'observed_at': 100,
            'integration_head': head, 'tested_head': J, 'returncode': 0,
            'test_count': 3, 'command': ['python3', '-m', 'unittest']}


def module_facts():
    return {'accepted': True, 'checkpoint': J, 'owned_paths': ['toy/web'],
            'tested_trees': {'toy/web': TREE}, 'current_trees': {'toy/web': TREE},
            'required_dependencies': ['provider'], 'tested_dependencies': {'provider': 'd'*40}, 'current_dependencies': {'provider': 'd'*40}}


def ready(head=H):
    s = state(); w.start_round(s, head)
    w.record_module_evidence(s, 'web', module_receipt(head), trusted=module_facts())
    return s


def walk(head=H, flaws=None, resolutions=None):
    flaws = [] if flaws is None else flaws
    return {'observed': True, 'actor': '/root/root/arch/walker', 'source': 'fixture walk receipt',
            'observed_at': 101, 'head': head, 'design': 'UX Screens or journeys reference',
            'coverage': ['S1', 'S2'], 'outcome': 'flaws' if flaws else 'clean', 'flaws': flaws,
            'resolved_flaws': {} if resolutions is None else resolutions,
            'deployment': {'observed': True, 'actor': '/root/root/arch', 'source': 'fixture service probe',
                           'observed_at': 100, 'head': head, 'status': 'running',
                           'url': 'http://127.0.0.1:8766/', 'http_status': 200}}


class WalkTests(unittest.TestCase):
    def test_ancestor_test_commit_is_insufficient_when_module_or_dependency_changed(self):
        receipt, facts = module_receipt(), module_facts()
        self.assertEqual(w.validate_module_evidence(receipt, H, trusted=facts)['tested_head'], J)
        for changes in ({'checkpoint': 'e'*40}, {'current_trees': {'toy/web': 'e'*40}},
                        {'current_dependencies': {'provider': 'e'*40}}, {'tested_dependencies': {}, 'current_dependencies': {}}, {'accepted': False}):
            with self.subTest(changes=changes), self.assertRaises(ValueError):
                w.validate_module_evidence(receipt, H, trusted={**facts, **changes})
        with self.assertRaises(ValueError): w.validate_module_evidence(receipt, H)

    def test_passing_prose_or_fake_plan_does_not_establish_module_stage(self):
        for changes in ({'test_count': 0}, {'test_count': True}, {'returncode': 1},
                        {'observed': False}, {'command': []}, {'source': ''}):
            with self.subTest(changes=changes), self.assertRaises(ValueError):
                w.validate_module_evidence({**module_receipt(), **changes}, H, trusted=module_facts())
        s = state(); w.start_round(s, H)
        self.assertEqual(w.assess_round(s)['status'], 'module_tests')
        with self.assertRaises(ValueError): w.record_walk(s, 'internal_walk', walk())

    def test_only_three_stages_in_correct_order_and_current_deployment(self):
        s = ready(); self.assertEqual(w.assess_round(s)['status'], 'internal_walk')
        with self.assertRaises(ValueError): w.record_walk(s, 'external_walk', walk())
        with self.assertRaises(ValueError): w.record_walk(s, 'security_review', walk())
        w.record_walk(s, 'internal_walk', walk())
        self.assertEqual(w.assess_round(s)['status'], 'external_walk')
        bad = walk(); bad['deployment']['head'] = 'f'*40
        with self.assertRaises(ValueError): w.record_walk(s, 'external_walk', bad)
        w.record_walk(s, 'external_walk', walk())
        result = w.assess_round(s, H)
        self.assertTrue(result['clean']); self.assertEqual(result['product_stages'], list(w.STAGES))

    def test_external_flaw_reopens_owned_work_and_requires_rewalk_on_new_head(self):
        s = ready(); w.record_walk(s, 'internal_walk', walk())
        flaw = {'id': 'F1', 'module': 'web', 'description': 'invalid text lost', 'evidence': 'journey3 observed reset'}
        w.record_walk(s, 'external_walk', walk(flaws=[flaw]))
        with self.assertRaisesRegex(ValueError, 'same-head erasure'):
            w.record_walk(s, 'external_walk', walk())
        assessment = w.assess_round(s)
        self.assertEqual(assessment['status'], 'needs_correction')
        self.assertEqual(assessment['actions'][0]['module'], 'web')
        self.assertFalse(assessment['actions'][0]['needs_arch_assignment'])
        new = 'e'*40; w.start_round(s, new)
        self.assertEqual(w.assess_round(s)['status'], 'module_tests')
        with self.assertRaises(ValueError): w.record_walk(s, 'external_walk', walk())
        w.record_module_evidence(s, 'web', module_receipt(new), trusted=module_facts())
        w.record_walk(s, 'internal_walk', walk(new))
        w.record_walk(s, 'external_walk', walk(new))
        self.assertEqual(w.assess_round(s)['unverified_prior_flaws'], ['F1'])
        w.record_walk(s, 'external_walk', walk(new, resolutions={'F1': 'journey3 now retains invalid value'}))
        self.assertTrue(w.assess_round(s)['clean'])
        w.start_round(s, 'f'*40)
        self.assertEqual(s['native_development']['carry_flaws'], {})
        self.assertEqual(s['native_development']['round'], 3)
        self.assertEqual(s['native_development']['walks'], {})

    def test_internal_flaw_unassigned_module_routes_to_arch_without_invented_job(self):
        s = ready(); flaw = {'id': 'F2', 'module': 'report', 'description': 'declared-module flaw', 'evidence': 'screen observation'}
        w.record_walk(s, 'internal_walk', walk(flaws=[flaw]))
        action = w.assess_round(s)['actions'][0]
        self.assertTrue(action['needs_arch_assignment']); self.assertNotIn('report', s['jobs'])
        with self.assertRaises(ValueError): w.record_walk(s, 'external_walk', walk())
        wrong = {**flaw, 'module': 'other-repo'}
        with self.assertRaises(ValueError): w.record_walk(s, 'internal_walk', walk(flaws=[wrong]))

    def test_new_assigned_module_cannot_be_omitted_to_finish_old_round(self):
        s = ready(); w.record_walk(s, 'internal_walk', walk()); w.record_walk(s, 'external_walk', walk())
        s['jobs']['report'] = {'accepted': False, 'checkpoint': None}
        with self.assertRaisesRegex(ValueError, 'scope is stale'): w.assess_round(s)
        with self.assertRaises(ValueError): w.start_round(s, 'f'*40, ['web'])

    def test_stale_receipts_invalid_scope_and_owner_stop_never_complete(self):
        s = ready()
        with self.assertRaises(ValueError): w.record_walk(s, 'internal_walk', walk('f'*40))
        with self.assertRaises(ValueError): w.start_round(s, H, ['report'])
        w.record_walk(s, 'internal_walk', walk()); w.record_walk(s, 'external_walk', walk())
        with self.assertRaises(ValueError): w.assess_round(s, 'f'*40)
        s['stopped'] = True; s['stop_source'] = 'owner'; before = copy.deepcopy(s)
        self.assertEqual(w.assess_round(s)['status'], 'owner_stopped'); self.assertEqual(s, before)
        s['stopped'] = False; s['jobs']['web']['checkpoint'] = 'f'*40
        self.assertEqual(w.assess_round(s)['status'], 'module_tests')
