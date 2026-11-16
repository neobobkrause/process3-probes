"""Native continuation classification fixtures; no new live proofs generated."""
import copy
import unittest
from native import continuation as n
from native.capabilities import REQUIRED


class NativeContinuationTests(unittest.TestCase):
    def state(self):
        return {'jobs':{},'events':[],'slots':1,'native_continuation':{
            'findings':{key:{'state':'observed','evidence':'fixture:'+key} for key in REQUIRED}}}

    def job(self,state):
        job={'status':'done','accepted':True,'last_outcome':'completed','pr_number':1,
             'checkpoint':'a'*40,'integrated':'b'*40,'verification':{'returncode':0,'test_count':4}}
        state['jobs']['provider']=job
        state['events'].append({'kind':'native-integrated','job':'provider','checkpoint':'a'*40,'integration':'b'*40})
        return job

    def dependency(self,state,key):
        state['native_continuation'].setdefault('dependencies',{})[key]={
            'confirmed':True,'prerequisite':'fixture native platform message-trigger contract','evidence':'fixture observed missing control'}

    def test_done_or_passing_test_does_not_substitute_for_integration_evidence(self):
        state=self.state();job=self.job(state)
        self.assertEqual(n.assess(state).status,'demonstrated')
        for key,value in [('accepted',False),('last_outcome','interrupted'),('integrated',None),('pr_number',None),('verification',{'returncode':0,'test_count':0})]:
            candidate=copy.deepcopy(state);candidate['jobs']['provider'][key]=value
            self.assertIn('job:provider',n.assess(candidate).runnable)
        state['events']=[]
        self.assertIn('job:provider',n.assess(state).runnable)

    def test_unknown_evidence_cannot_be_declared_external_blocked(self):
        state=self.state();state['native_continuation']['findings'].pop('reactive_inter_session')
        self.dependency(state,'capability:reactive_inter_session')
        result=n.assess(state)
        self.assertEqual(result.status,'continue');self.assertIn('capability:reactive_inter_session',result.runnable)

    def test_narrow_platform_block_does_not_hide_independent_work(self):
        state=self.state();state['native_continuation']['findings']['reactive_inter_session']={
            'state':'not_exposed','evidence':'fixture missing retained ROOT idle-wake control'}
        self.dependency(state,'capability:reactive_inter_session')
        self.assertEqual(n.assess(state).status,'external_blocked')
        state['native_continuation']['work']={'restore-coordinator':{'status':'pending'}}
        result=n.assess(state)
        self.assertEqual(result.status,'continue');self.assertIn('control:restore-coordinator',result.runnable)
        self.assertIn('capability:reactive_inter_session',result.blocked)

    def test_pending_message_remains_work_even_when_job_done(self):
        state=self.state();self.job(state)
        state['native_mailbox']={'messages':{'message-one':{'status':'delivered_unacknowledged'}}}
        result=n.assess(state)
        self.assertEqual(result.pending_messages,('message-one',));self.assertIn('message:message-one',result.runnable)
        state['native_mailbox']['messages']['message-one']['status']='acknowledged'
        self.assertEqual(n.assess(state).status,'demonstrated')

    def test_unassigned_user_notice_is_exposed_without_inventing_assignment(self):
        state=self.state();state['notices']={'notice-one':{'status':'pending','user':'unassigned-report'}}
        result=n.assess(state)
        self.assertEqual(result.deferred_notices,('notice-one',));self.assertEqual(result.unfinished_jobs,())
        self.job(state);state['notices']['notice-two']={'status':'pending','user':'provider'}
        self.assertIn('notice:notice-two',n.assess(state).runnable)

    def test_owner_stop_and_cap_preserved_without_mutation(self):
        state=self.state();state.update(stopped=True,stop_source='owner',owner_job_cap=2,slots=2)
        state['native_continuation']['work']={'resume':{'status':'pending'}}
        before=copy.deepcopy(state);result=n.assess(state)
        self.assertEqual(result.status,'owner_stopped');self.assertFalse(result.runnable);self.assertEqual(state,before)
        state['slots']=3
        with self.assertRaises(ValueError):n.assess(state)

    def test_no_fixture_siwc_cloudflare_or_optional_recovery_requirement(self):
        state=self.state();self.assertEqual(n.assess(state).status,'demonstrated')
        self.assertFalse(any('oauth' in key or 'cloudflare' in key or 'sandbox' in key or 'root_loss' in key for key in n.assess(state).demonstrated))
        state['native_continuation']['findings']['root_recreation']={'state':'observed','evidence':'not mandatory'}
        with self.assertRaises(ValueError):n.assess(state)

    def test_dependency_requires_confirmed_specific_evidence(self):
        state=self.state();state['native_continuation']['findings']['reactive_inter_session']={
            'state':'blocked','evidence':'fixture missing control'}
        self.assertEqual(n.assess(state).status,'continue')
        self.dependency(state,'capability:reactive_inter_session')
        state['native_continuation']['dependencies']['capability:reactive_inter_session']['confirmed']=False
        self.assertEqual(n.assess(state).status,'continue')
        state['native_continuation']['dependencies']['capability:reactive_inter_session']['evidence']=''
        with self.assertRaises(ValueError):n.assess(state)

    def test_explicit_completed_control_requires_actual_evidence_reference(self):
        state=self.state();state['native_continuation']['work']={'recovery':{'status':'done'}}
        with self.assertRaises(ValueError):n.assess(state)
        state['native_continuation']['work']['recovery']['evidence']='fixture recovery receipt'
        self.assertEqual(n.assess(state).status,'demonstrated')
