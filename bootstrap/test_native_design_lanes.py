"""Design-lane scope tests; fixture provenance is not owner authorization."""
import copy
import unittest

from grants.grants import Denied
from native import design_lanes as d


def state():
    return {'native_roles': {'ARCH': {'target': '/root/root/arch', 'generation': 3}},
            'modules': {'provider': {'paths': ['toy/provider']}}, 'design_lanes': {}, 'stopped': False}


def owner_need(**changes):
    return {'source': 'observed-owner-input', 'kind': 'need',
            'text': 'Design the checkout screens.\nKeep the confirmation clear.',
            'evidence': 'fixture trusted native owner-console observation', **changes}


def requested(s):
    lane = d.request_lane(s, 'ux', actor='/root/root/arch', generation=3,
                          owner_need=owner_need(), paths=['design/ux'])
    s['design_lanes']['ux'] = lane
    return lane


class DesignLaneTests(unittest.TestCase):
    def test_explicit_need_creates_only_design_plan_without_sideeffects(self):
        s = state();old = copy.deepcopy(s)
        lane = d.request_lane(s, 'ux', actor='/root/root/arch', generation=3,
                              owner_need=owner_need(), paths=['design/ux'])
        self.assertEqual(s, old)
        self.assertEqual(lane['need']['text'], owner_need()['text'])
        self.assertEqual(set(lane), {'need', 'paths', 'arch', 'status'})
        s['design_lanes']['ux'] = lane
        plan = d.plan_lane(s, 'ux', actor='/root/root/arch')
        self.assertEqual((plan['role'], plan['native_depth'], plan['purpose']), ('LANE:ux', 3, 'design-only'))
        self.assertFalse(plan['may_build_modules']);self.assertFalse(plan['may_merge'])
        self.assertTrue(plan['requires_actual_native_event'])
        self.assertNotIn('session', lane)

    def test_no_implicit_draft_adoption_or_question_as_need(self):
        s = state()
        with self.assertRaises(Denied):d.plan_lane(s, 'ux', actor='/root/root/arch')
        for need in (owner_need(kind='question'), owner_need(kind='proposal'), owner_need(source='ARCH'), owner_need(evidence='')):
            with self.subTest(need=need), self.assertRaises(Denied):
                d.request_lane(s, 'ux', actor='/root/root/arch', generation=3, owner_need=need, paths=['design/ux'])
        self.assertEqual(s['design_lanes'], {})

    def test_current_arch_and_distinct_owned_folder_required(self):
        s = state();requested(s)
        for name, actor, generation, paths in [('research', '/root/root/old', 3, ['design/research']),
                ('research', '/root/root/arch', 2, ['design/research']),
                ('research', '/root/root/arch', 3, ['toy/provider/design']),
                ('research', '/root/root/arch', 3, ['design/ux/screens']),
                ('ux', '/root/root/arch', 3, ['design/other'])]:
            with self.subTest(name=name, actor=actor, paths=paths), self.assertRaises(Denied):
                d.request_lane(s, name, actor=actor, generation=generation, owner_need=owner_need(), paths=paths)

    def test_unsafe_names_paths_and_authority_fields_rejected(self):
        s = state()
        for path in ('../outside', '/absolute', 'design//ux', 'design/ux/../other', '.github/workflows',
                     '.process/tool', 'bootstrap/OWNER-new.txt', 'process/config.json'):
            with self.subTest(path=path), self.assertRaises(Denied):
                d.request_lane(s, 'ux', actor='/root/root/arch', generation=3, owner_need=owner_need(), paths=[path])
        for name in ('../ux', '', 'UX', 'ux/other'):
            with self.assertRaises(Denied):d.request_lane(s, name, actor='/root/root/arch', generation=3, owner_need=owner_need(), paths=['design/ux'])
        lane = requested(s)
        for extra in ('owner_approved', 'may_merge', 'grants'):
            with self.assertRaises(Denied):d.validate_lane(s, 'ux', {**lane, extra: True})

    def test_diff_scope_is_design_only_even_inside_assigned_directory(self):
        s = state();requested(s)
        result = d.validate_design_changes(s, 'ux', ['design/ux/Screens.md', 'design/ux/Journeys.json'])
        self.assertTrue(result['allow']);self.assertFalse(result['module_acceptance'])
        for changes in ([], ['toy/provider/a.py'], ['design/ux/client.py'], ['design/ux/.codex/settings.json']):
            with self.subTest(changes=changes), self.assertRaises(Denied):d.validate_design_changes(s, 'ux', changes)

    def test_stop_is_preserved_and_lane_cannot_create_itself(self):
        s = state();requested(s);s['stopped'] = True;old = copy.deepcopy(s)
        self.assertEqual(d.plan_lane(s, 'ux', actor='/root/root/arch')['action'], 'hold')
        self.assertEqual(s, old)
        with self.assertRaises(Denied):d.plan_lane(s, 'ux', actor='/root/root/arch/ux')

    def test_replaced_arch_needs_revalidated_request_but_retained_diff_scope_survives(self):
        s = state();requested(s)
        s['native_roles']['ARCH'] = {'target': '/root/root/new_arch', 'generation': 4}
        with self.assertRaisesRegex(Denied, 'STALE_DESIGN_ARCH'):d.plan_lane(s, 'ux', actor='/root/root/new_arch')
        self.assertTrue(d.validate_design_changes(s, 'ux', ['design/ux/Screens.md'])['allow'])
        s['design_lanes']['ux']['arch'] = copy.deepcopy(s['native_roles']['ARCH'])
        self.assertEqual(d.plan_lane(s, 'ux', actor='/root/root/new_arch')['creator'], '/root/root/new_arch')

    def test_retained_lane_can_continue_after_arch_replacement_without_reparenting(self):
        s = state();lane = requested(s)
        lane['session'] = {'target': '/root/root/arch/ux', 'generation': 1}
        s['native_roles']['ARCH'] = {'target': '/root/root/new_arch', 'generation': 4}
        before = copy.deepcopy(s)
        plan = d.plan_lane(s, 'ux', actor='/root/root/new_arch')
        self.assertEqual(plan['action'], 'continue')
        self.assertEqual(s, before)
        self.assertEqual(s['design_lanes']['ux']['session']['target'], '/root/root/arch/ux')
        del lane['session']
        with self.assertRaisesRegex(Denied, 'STALE_DESIGN_ARCH'):
            d.plan_lane(s, 'ux', actor='/root/root/new_arch')

    def recovery_state(self):
        s=state();lane=requested(s)
        lane['session']={'target':'/root/root/arch/ux','generation':1}
        lane['status']='active'
        s['native_roles']['LANE:ux']=copy.deepcopy(lane['session'])
        s['native_roles']['ARCH']={'target':'/root/root/new_arch','generation':4}
        s['native_interaction']={'opaque':'untouched local overlay fixture'}
        return s

    def test_revalidate_preserves_exact_need_paths_and_old_binding_without_mutation(self):
        s=self.recovery_state();before=copy.deepcopy(s)
        lane=d.revalidate_lane(s,'ux',actor='/root/root/new_arch',generation=4,
                               expected_generation=1,evidence='fixture actual repeated native provider failure')
        self.assertEqual(s,before)
        self.assertEqual(lane['need'],before['design_lanes']['ux']['need'])
        self.assertEqual(lane['paths'],before['design_lanes']['ux']['paths'])
        self.assertEqual(lane['arch'],s['native_roles']['ARCH'])
        self.assertEqual(lane['status'],'requested');self.assertNotIn('session',lane)
        self.assertEqual(s['native_roles']['LANE:ux'],before['native_roles']['LANE:ux'])
        lane['need']['text']='Cannot mutate original need';lane['paths'].append('other')
        self.assertEqual(s,before)

    def test_revalidate_enables_fresh_creation_under_current_arch_only(self):
        s=self.recovery_state();before=copy.deepcopy(s)
        lane=d.revalidate_lane(s,'ux',actor='/root/root/new_arch',generation=4,
                               expected_generation=1,evidence='fixture actual replacement diagnosis')
        self.assertEqual(s,before)
        s['design_lanes']['ux']=lane
        plan=d.plan_lane(s,'ux',actor='/root/root/new_arch')
        self.assertEqual(plan['action'],'create');self.assertEqual(plan['creator'],'/root/root/new_arch')
        self.assertEqual(s['native_roles']['LANE:ux']['generation'],1)

    def test_revalidate_requires_current_integer_arch_and_lane_generations_and_evidence(self):
        s=self.recovery_state();before=copy.deepcopy(s)
        values=[{'actor':'/root/root/arch'}, {'generation':3}, {'generation':True},
                {'expected_generation':2}, {'expected_generation':True}, {'expected_generation':None},
                {'evidence':''}, {'evidence':'   '}, {'evidence':None}]
        for changes in values:
            kwargs={'actor':'/root/root/new_arch','generation':4,'expected_generation':1,'evidence':'fixture actual failure'}
            kwargs.update(changes)
            with self.subTest(changes=changes),self.assertRaises(Denied):d.revalidate_lane(s,'ux',**kwargs)
            self.assertEqual(s,before)

    def test_revalidate_still_validates_old_need_paths_and_native_session(self):
        changes=[lambda s:s['design_lanes']['ux']['need'].update(source='proposal'),
                 lambda s:s['design_lanes']['ux'].update(paths=['toy/provider']),
                 lambda s:s['design_lanes']['ux']['session'].update(generation=2),
                 lambda s:s['native_roles'].pop('LANE:ux')]
        for change in changes:
            s=self.recovery_state();change(s);before=copy.deepcopy(s)
            with self.assertRaises(Denied):d.revalidate_lane(s,'ux',actor='/root/root/new_arch',generation=4,
                                                            expected_generation=1,evidence='fixture actual failure')
            self.assertEqual(s,before)

    def test_revalidate_cannot_bypass_stop_or_redeclare_owner_need(self):
        s=self.recovery_state();s['stopped']=True;before=copy.deepcopy(s)
        with self.assertRaisesRegex(Denied,'DURABLE_STOP_PRESERVED'):
            d.revalidate_lane(s,'ux',actor='/root/root/new_arch',generation=4,
                              expected_generation=1,evidence='fixture actual failure')
        self.assertEqual(s,before)
        with self.assertRaisesRegex(Denied,'DESIGN_LANE_ALREADY_DECLARED'):
            d.request_lane(s,'ux',actor='/root/root/new_arch',generation=4,
                           owner_need=owner_need(),paths=['design/new'])

    def test_session_receipt_has_native_parent_and_generation_not_created_by_plan(self):
        s = state();lane = requested(s)
        lane['session'] = {'target': '/root/root/arch/ux', 'generation': 1}
        self.assertEqual(d.plan_lane(s, 'ux', actor='/root/root/arch')['action'], 'continue')
        for session in ({'target': '/root/root/ux', 'generation': 1},
                        {'target': '/root/root/arch/ux/deeper', 'generation': 1},
                        {'target': '/root/root/arch/ux', 'generation': True}):
            with self.assertRaises(Denied):d.validate_lane(s, 'ux', {**lane, 'session': session})


if __name__ == '__main__':unittest.main()
