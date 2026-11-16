"""Control-plane fixture decisions, not live liveness or tool-call evidence."""
import copy
import unittest
from native import layout,supervision

class SupervisionTests(unittest.TestCase):
    def state(self):
        s={'jobs':{'web':{'attempt':1,'status':'ready'}},'slots':1,'owner_job_cap':3,'stopped':False,
           'native_roles':{'ROOT':{'target':'/root/root_role','generation':2},
                           'WATCHER':{'target':'/root/watcher','generation':1},
                           'ARCH':{'target':'/root/root_role/arch','generation':3},
                           'COORDINATOR':{'target':'/root/root_role/coord','generation':2}}}
        layout.adopt(s,'fixture actual owner approval ref');return s
    def obs(self,s,role,activity='idle',stamp=100):
        return {**s['native_roles'].get(role,{'target':None,'generation':None}),
                'activity':activity,'observed_at':stamp,'source':'actual-native-inventory'}
    def test_console_recovers_root_as_sibling_and_never_reparents_children(self):
        s=self.state();old=copy.deepcopy(s)
        result=supervision.plan_supervision(s,observations={'ROOT':self.obs(s,'ROOT','unavailable'),'WATCHER':self.obs(s,'WATCHER')},now=101)
        action=result['actions'][0];self.assertEqual(action['tool'],'spawn_agent')
        self.assertEqual(action['required_native_parent'],'/root');self.assertEqual(action['generation'],3)
        self.assertEqual(s,old)
    def test_completed_is_idle_not_absent_and_running_is_untouched(self):
        s=self.state()
        result=supervision.plan_supervision(s,observations={'ROOT':self.obs(s,'ROOT','completed'),'WATCHER':self.obs(s,'WATCHER','running')},now=101)
        self.assertEqual(result['actions'][0]['tool'],'followup_task')
        self.assertEqual(result['actions'][0]['arguments']['target'],'/root/root_role')
        self.assertEqual(result['healthy'][0]['role'],'WATCHER')
    def test_missing_stale_obsolete_and_future_observations_hold(self):
        s=self.state()
        for invalid in (None,self.obs(s,'ROOT',stamp=1),{**self.obs(s,'ROOT'),'generation':1},self.obs(s,'ROOT',stamp=102)):
            result=supervision.plan_supervision(s,observations={'ROOT':invalid},now=101)
            self.assertFalse(result['actions']);self.assertTrue(result['holds'])
    def test_owner_stop_and_slot_cap_preserved(self):
        s=self.state();s.update(stopped=True,stop_source='owner');old=copy.deepcopy(s)
        result=supervision.plan_supervision(s,observations={'ROOT':self.obs(s,'ROOT','unavailable')},now=101)
        self.assertFalse(result['actions']);self.assertEqual(s,old)
        s['stopped']=False;s['slots']=4
        with self.assertRaises(layout.InvalidLayout):supervision.plan_supervision(s,observations={},now=101)
    def test_root_repairs_its_children_but_cannot_replace_itself(self):
        s=self.state();root=s['native_roles']['ROOT']['target']
        result=supervision.plan_supervision(s,actor=root,observations={'ARCH':self.obs(s,'ARCH','interrupted'),'COORDINATOR':self.obs(s,'COORDINATOR')},now=101)
        self.assertEqual(result['actions'][0]['role'],'ARCH')
        self.assertEqual(result['actions'][0]['required_native_parent'],root)
        self.assertFalse(any(a['role']=='ROOT' for a in result['actions']))
        with self.assertRaises(layout.InvalidLayout):supervision.plan_supervision(s,actor='/root/watcher',observations={},now=101)
    def test_native_capacity_narrows_without_changing_owner_job_cap(self):
        s=self.state();s['native_roles'].pop('ROOT');s['native_roles'].pop('WATCHER')
        result=supervision.plan_supervision(s,observations={k:self.obs(s,k,'unavailable') for k in ('ROOT','WATCHER')},native_capacity=1,now=101)
        self.assertEqual(len(result['actions']),1);self.assertEqual(result['actions'][0]['role'],'ROOT')
        self.assertEqual(result['owner_job_cap'],3);self.assertTrue(result['holds'])
    def test_idle_coordinator_wakes_only_for_pending_input(self):
        s=self.state();actor=s['native_roles']['ROOT']['target'];obs={'ARCH':self.obs(s,'ARCH','running'),'COORDINATOR':self.obs(s,'COORDINATOR')}
        self.assertFalse(supervision.plan_supervision(s,actor=actor,observations=obs,now=101)['actions'])
        result=supervision.plan_supervision(s,actor=actor,observations=obs,pending_roles=('COORDINATOR',),now=101)
        self.assertEqual(result['actions'][0]['role'],'COORDINATOR')

    def test_malformed_inventory_generation_or_activity_holds_before_intent(self):
        s=self.state();s['native_roles']['ROOT']['generation']=1
        for fields in ({'generation':True},{'activity':['running']}):
            result=supervision.plan_supervision(s,observations={'ROOT':{**self.obs(s,'ROOT'),**fields}},now=101)
            self.assertFalse(result['actions']);self.assertTrue(result['holds'])
