"""Layout control-plane fixtures; no native execution or provider writes claimed."""
import copy
import unittest
from native import layout as l


class LayoutTests(unittest.TestCase):
    def state(self):
        state={'jobs':{'web':{'attempt':1,'status':'ready'}},'native_roles':{},'slots':1,'owner_job_cap':2,'stopped':False,'notices':{'report':{'status':'pending'}}}
        l.adopt(state,'fixture observed owner approval')
        return state

    def bind(self,s,role,target,generation,actor):
        l.validate_binding(s,role,target,generation,actor)
        s['native_roles'][role]={'target':target,'generation':generation}

    def hierarchy(self):
        s=self.state();self.bind(s,'ROOT','/root/supervisor',1,'/root')
        self.bind(s,'ARCH','/root/supervisor/arch',1,'/root/supervisor')
        self.bind(s,'COORDINATOR','/root/supervisor/coordinator',1,'/root/supervisor')
        self.bind(s,'JOB:web','/root/supervisor/arch/web',1,'/root/supervisor/arch')
        return s

    def test_explicit_adoption_preserves_current_work_and_owner_control(self):
        s={'jobs':{'web':{'attempt':3}},'notices':{'old':'pending'},'stopped':True,'slots':1,'owner_job_cap':2}
        old=copy.deepcopy(s);l.adopt(s,'actual instruction reference')
        self.assertEqual({k:s[k] for k in old},old)
        self.assertEqual(l.status(s)['mode'],'addressable_root')
        l.adopt(s,'actual instruction reference')
        with self.assertRaises(l.InvalidLayout):l.adopt(s,'substituted approval')
        with self.assertRaises(l.InvalidLayout):l.adopt({},'')
        self.assertEqual(l.status({})['mode'],'legacy_standing_chat')

    def test_creation_roles_depth_and_no_self_successor(self):
        s=self.hierarchy()
        for role,path,gen,actor in [('ROOT','/root',2,'/root'),
                                   ('ROOT','/root/supervisor/next',2,'/root/supervisor'),
                                   ('WATCHER','/root/supervisor/watch',1,'/root/supervisor'),
                                   ('ARCH','/root/wrong/arch',2,'/root/supervisor'),
                                   ('COORDINATOR','/root/supervisor/arch/coordinator',2,'/root/supervisor/arch'),
                                   ('JOB:web','/root/supervisor/arch/web/child',2,'/root/supervisor/arch')]:
            with self.subTest(role=role,path=path):
                with self.assertRaises(l.InvalidLayout):l.validate_binding(s,role,path,gen,actor)
        self.bind(s,'WATCHER','/root/watcher',1,'/root')
        self.assertEqual(l.depth(s['native_roles']['JOB:web']['target']),3)

    def test_missing_and_stale_generations_reject_before_native_intent(self):
        s=self.state()
        with self.assertRaises(l.InvalidLayout):l.plan(s,'ARCH','/root','unavailable')
        with self.assertRaises(l.InvalidLayout):l.plan(s,'ROOT','/root','idle')
        self.bind(s,'ROOT','/root/supervisor',1,'/root')
        with self.assertRaises(l.InvalidLayout):l.plan(s,'ROOT','/root','idle',2)
        with self.assertRaises(l.InvalidLayout):self.bind(s,'ROOT','/root/other',1,'/root')
        with self.assertRaises(l.InvalidLayout):self.bind(s,'ROOT','/root/other',True,'/root')

    def test_root_idle_wake_uses_actual_nonroot_binding_and_nonblocking_native_tool(self):
        s=self.hierarchy();old=copy.deepcopy(s)
        result=l.plan(s,'ROOT','/root','idle',1,message='Process exact existing assignment')
        self.assertEqual(result['tool'],'followup_task')
        self.assertEqual(result['arguments']['target'],'/root/supervisor')
        self.assertTrue(result['requires_actual_submission'])
        self.assertEqual(s,old)
        root=l.plan(s,'ROOT','/root','unavailable',1)
        self.assertEqual(root['tool'],'spawn_agent')
        self.assertEqual(root['required_native_parent'],'/root')
        self.assertEqual(root['generation'],2)
        self.assertEqual(set(root['arguments']),{'task_name','message'})

    def test_root_replacement_preserves_old_children_without_reparenting(self):
        s=self.hierarchy();oldchildren=copy.deepcopy({k:v for k,v in s['native_roles'].items() if k!='ROOT'})
        self.bind(s,'ROOT','/root/replacement',2,'/root')
        # A retained ARCH is still a valid non-root target. New ARCH replacement
        # must be a fresh immediate child of the new current supervisor.
        intent=l.plan(s,'ARCH','/root/replacement','idle',1)
        self.assertEqual(intent['arguments']['target'],'/root/supervisor/arch')
        self.bind(s,'ARCH','/root/replacement/arch',2,'/root/replacement')
        self.assertEqual(s['native_roles']['JOB:web'],oldchildren['JOB:web'])
        with self.assertRaises(l.InvalidLayout):self.bind(s,'ARCH','/root/supervisor/newarch',3,'/root/replacement')

    def test_stop_and_cap_fail_closed_without_changing_owner_fields(self):
        s=self.hierarchy();s.update(stopped=True,stop_source='owner');old=copy.deepcopy(s)
        self.assertEqual(l.plan(s,'ROOT','/root','unavailable',1)['action'],'hold')
        self.assertEqual(s,old)
        s.update(stopped=False,slots=3)
        with self.assertRaises(l.InvalidLayout):l.plan(s,'ROOT','/root','idle',1)

    def test_job_capacity_and_attempt_must_be_reserved_before_creation(self):
        s=self.hierarchy()
        with self.assertRaises(l.InvalidLayout):l.plan(s,'JOB:web','/root/supervisor/arch','unavailable',1)
        s['jobs']['web']['attempt']=2;s['jobs']['web']['status']='running'
        result=l.plan(s,'JOB:web','/root/supervisor/arch','unavailable',1)
        self.assertEqual(result['generation'],2)
        with self.assertRaises(l.InvalidLayout):self.bind(s,'JOB:web','/root/supervisor/arch/new',3,'/root/supervisor/arch')
        self.bind(s,'JOB:web','/root/supervisor/arch/new',2,'/root/supervisor/arch')

    def test_legacy_children_not_globally_rejected_on_adoption(self):
        s=self.state();s['native_roles']={'ARCH':{'target':'/root/legacy_arch','generation':2}}
        self.bind(s,'ROOT','/root/supervisor',1,'/root')
        self.assertEqual(l.plan(s,'ARCH','/root/supervisor','idle',2)['arguments']['target'],'/root/legacy_arch')
        self.bind(s,'ARCH','/root/supervisor/arch',3,'/root/supervisor')

    def test_replacement_requires_creator_and_emits_interrupt_before_spawn(self):
        s=self.hierarchy()
        intent=l.plan(s,'ROOT','/root','running',1,replace=True)
        self.assertEqual(intent['tool'],'interrupt_agent')
        self.assertEqual(intent['arguments'],{'target':'/root/supervisor'})
        with self.assertRaises(l.InvalidLayout):l.plan(s,'ROOT','/root/supervisor','running',1,replace=True)
        self.assertEqual(l.plan(s,'ROOT','/root','unavailable',1,replace=True)['generation'],2)

    def test_process_lane_requires_observed_current_arch_request(self):
        s=self.hierarchy()
        with self.assertRaises(l.InvalidLayout):l.plan(s,'PROCESS','/root/supervisor','unavailable')
        s['native_layout']['process_request']={'arch':{'target':'/root/old','generation':1},'source':'observed-native-ARCH-request','evidence':'fixture source event'}
        with self.assertRaises(l.InvalidLayout):l.plan(s,'PROCESS','/root/supervisor','unavailable')
        s['native_layout']['process_request']['arch']=copy.deepcopy(s['native_roles']['ARCH'])
        self.assertEqual(l.plan(s,'PROCESS','/root/supervisor','unavailable')['tool'],'spawn_agent')

    def test_hyphenated_module_gets_supported_native_task_name(self):
        s=self.hierarchy();s['jobs']['web-render']={'attempt':1,'status':'ready'}
        intent=l.plan(s,'JOB:web-render','/root/supervisor/arch','unavailable')
        self.assertRegex(intent['arguments']['task_name'],r'^[a-z0-9_]+$')
        self.assertEqual(intent['arguments']['task_name'],'p4_job_web_render_g1')

    def test_design_lane_is_declared_arch_child_at_depth_three(self):
        s=self.hierarchy();role='LANE:ux'
        with self.assertRaises(l.InvalidLayout):l.plan(s,role,'/root/supervisor/arch','unavailable')
        s['design_lanes']={'ux':{'need':{'source':'observed-owner-need','evidence':'fixture','text':'fixture explicit need'},
                                'paths':['design/ux'],'arch':copy.deepcopy(s['native_roles']['ARCH']),'status':'requested'}}
        intent=l.plan(s,role,'/root/supervisor/arch','unavailable')
        self.assertEqual(intent['required_native_parent'],'/root/supervisor/arch')
        self.bind(s,role,'/root/supervisor/arch/ux_lane',1,'/root/supervisor/arch')
        self.assertEqual(l.depth(s['native_roles'][role]['target']),3)
        with self.assertRaises(l.InvalidLayout):self.bind(s,role,'/root/supervisor/arch/job/ux',2,'/root/supervisor/arch')
        s['design_lanes']['ux']['arch']={'target':'/root/old_arch','generation':1}
        with self.assertRaises(l.InvalidLayout):l.plan(s,role,'/root/supervisor/arch','unavailable')

    def test_boolean_expected_generation_and_unprepared_job_attempt_rejected(self):
        s=self.hierarchy()
        with self.assertRaises(l.InvalidLayout):l.plan(s,'ROOT','/root','idle',True)
        s['native_roles'].pop('JOB:web')
        for attempt in (0,True,None):
            s['jobs']['web']['attempt']=attempt
            with self.assertRaises(l.InvalidLayout):l.plan(s,'JOB:web','/root/supervisor/arch','unavailable')
        s['jobs']['web']['attempt']=True
        with self.assertRaises(l.InvalidLayout):self.bind(s,'JOB:web','/root/supervisor/arch/job',1,'/root/supervisor/arch')
