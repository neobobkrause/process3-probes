"""Native recovery planning regression fixtures; no live execution claims."""
import copy
import unittest
from native import job_recovery as r
from test_native_scheduling import fixture,bind


def accepted(state,jid='provider',status='review'):
    state['jobs'][jid].update(status=status,attempt=2,accepted=True,last_outcome='completed',
          checkpoint='a'*40,verification={'returncode':0,'test_count':4},pr_number=271)
    return {'number':271,'head_ref':state['jobs'][jid]['branch'],'base_ref':state['integration_branch'],
            'head_sha':'a'*40,'state':'OPEN'}


class JobRecoveryTests(unittest.TestCase):
    def test_missing_native_observation_is_not_failure_or_duplicate_spawn(self):
        state=fixture();bind(state,'provider');state['jobs']['provider']['status']='running'
        plan=r.reconcile_jobs(state,{})
        self.assertFalse(plan['actions']);self.assertEqual(plan['holds'][0]['reason'],'fresh_observation_required')

    def test_unbound_reservation_requires_inventory_review(self):
        state=fixture();state['jobs']['provider'].update(status='running',attempt=1)
        self.assertEqual(r.reconcile_jobs(state,{})['actions'][0]['action'],'inspect_unbound_reservation')

    def test_idle_turn_ending_not_accepted_module(self):
        state=fixture();ob=bind(state,'provider');state['jobs']['provider']['status']='running'
        self.assertEqual(r.reconcile_jobs(state,{'JOB:provider':ob})['actions'][0]['action'],'inspect_result')

    def test_unavailable_actor_preserves_before_replacement_same_branch_and_pr(self):
        state=fixture();ob=bind(state,'provider',2,'unavailable');job=state['jobs']['provider'];job.update(status='running',pr_number=17)
        action=r.reconcile_jobs(state,{'JOB:provider':ob})['actions'][0]
        self.assertEqual(action['action'],'preserve_then_replace')
        self.assertEqual((action['expected_attempt'],action['next_attempt'],action['preserve_pr']),(2,3,17))
        self.assertTrue(action['requires_checkpoint_before_replacement'])
        self.assertEqual(job['status'],'running')

    def test_checkpointed_interruption_can_prepare_next_attempt_without_reset(self):
        state=fixture();ob=bind(state,'provider',2);state['jobs']['provider'].update(status='paused',last_outcome='interrupted',checkpoint='a'*40)
        action=r.reconcile_jobs(state,{'JOB:provider':ob})['actions'][0]
        self.assertEqual(action['action'],'prepare_replacement');self.assertEqual(action['next_attempt'],3)

    def test_running_interrupted_actor_is_interrupted_not_spawned_over(self):
        state=fixture();ob=bind(state,'provider',2,'running');state['jobs']['provider']['status']='interrupting'
        action=r.reconcile_jobs(state,{'JOB:provider':ob})['actions'][0]
        self.assertEqual(action['action'],'interrupt');self.assertTrue(action['requires_actual_interruption_result'])

    def test_old_arch_or_old_attempt_never_gets_edit_continuation(self):
        state=fixture();ob=bind(state,'web',3,'running',parent='/root/oldarch');state['jobs']['web']['status']='running'
        state.update(native_layout={'mode':'addressable_root'})
        state['native_roles']['ARCH']={'target':'/root/newroot/arch','generation':3}
        action=r.reconcile_jobs(state,{'JOB:web':ob})['actions'][0]
        self.assertEqual(action['action'],'interrupt');self.assertIn('obsolete_ARCH',action['reason'])
        state['jobs']['web']['attempt']=4
        self.assertEqual(r.reconcile_jobs(state,{'JOB:web':ob})['actions'][0]['action'],'inspect_unbound_reservation')

    def test_native_replacement_generation_can_differ_from_bound_product_attempt(self):
        state=fixture();ob=bind(state,'provider',2,'running');job=state['jobs']['provider']
        job.update(status='running',session_generation=5,session_attempt=2)
        state['native_roles']['JOB:provider']['generation']=5;ob['generation']=5
        before=copy.deepcopy(state)
        action=r.reconcile_jobs(state,{'JOB:provider':ob})['actions'][0]
        self.assertEqual(action['action'],'retain');self.assertEqual(action['generation'],5)
        self.assertEqual(action['expected_attempt'],2);self.assertEqual(state,before)
        ob['activity']='idle'
        self.assertEqual(r.reconcile_jobs(state,{'JOB:provider':ob})['actions'][0]['action'],'inspect_result')

    def test_replaced_native_instance_cannot_receive_wrong_attempt_edit_instructions(self):
        state=fixture();ob=bind(state,'provider',2,'running');job=state['jobs']['provider']
        job.update(status='running',session_generation=5,session_attempt=1)
        state['native_roles']['JOB:provider']['generation']=5;ob['generation']=5
        action=r.reconcile_jobs(state,{'JOB:provider':ob})['actions'][0]
        self.assertEqual(action['action'],'inspect_unbound_reservation')
        self.assertEqual(action['reason'],'old_attempt_must_not_receive_edit_instructions')
        job['session_attempt']=2;job['session_generation']=4
        self.assertEqual(r.reconcile_jobs(state,{'JOB:provider':ob})['actions'][0]['action'],'inspect_unbound_reservation')
        job['session_generation']=5;del job['session_attempt']
        self.assertEqual(r.reconcile_jobs(state,{'JOB:provider':ob})['actions'][0]['action'],'inspect_unbound_reservation')

    def test_legacy_attempt_binding_and_session_fallback_still_work(self):
        state=fixture();ob=bind(state,'provider',2,'running');job=state['jobs']['provider'];job['status']='running'
        self.assertEqual(r.reconcile_jobs(state,{'JOB:provider':ob})['actions'][0]['action'],'retain')
        job.update(session=ob['target'],session_generation=5,session_attempt=2)
        del state['native_roles']['JOB:provider'];ob['generation']=5
        self.assertEqual(r.reconcile_jobs(state,{'JOB:provider':ob})['actions'][0]['action'],'retain')

    def test_boolean_generation_or_bound_attempt_is_not_valid_metadata(self):
        state=fixture();ob=bind(state,'provider',1,'running');job=state['jobs']['provider'];job['status']='running'
        for key in ('session_generation','session_attempt'):
            job[key]=True
            self.assertEqual(r.reconcile_jobs(state,{'JOB:provider':ob})['actions'][0]['action'],'inspect_unbound_reservation')
            del job[key]

    def test_done_accepted_product_settles_before_conversation_binding_checks(self):
        state=fixture();accepted(state,status='done');job=state['jobs']['provider'];job['integrated']='b'*40
        job.update(session_generation=5,session_attempt=2)
        state['native_roles']['JOB:provider']={'target':'/root/old/arch/provider','generation':5}
        state['events']=[{'kind':'native-integrated','job':'provider','checkpoint':'a'*40,'integration':'b'*40}]
        before=copy.deepcopy(state)
        self.assertFalse(r.reconcile_jobs(state,{})['actions']);self.assertEqual(state,before)

    def test_done_claim_missing_real_acceptance_is_not_completion(self):
        state=fixture();state['jobs']['provider']['status']='done'
        self.assertEqual(r.reconcile_jobs(state,{})['actions'][0]['action'],'inspect_acceptance')
        accepted(state,status='done');state['jobs']['provider']['integrated']='b'*40
        self.assertTrue(r.reconcile_jobs(state,{})['actions'])
        state['events']=[{'kind':'native-integrated','job':'provider','checkpoint':'a'*40,'integration':'b'*40}]
        self.assertFalse(r.reconcile_jobs(state,{})['actions'])

    def test_merged_pr_reconciliation_requires_exact_identity_and_ancestry(self):
        state=fixture();pr=accepted(state);pr.update(state='MERGED',integration_sha='b'*40,contains_head=True)
        before=copy.deepcopy(state)
        action=r.reconcile_jobs(state,{'JOB:provider':{'pr':pr}})['actions'][0]
        self.assertEqual(action['action'],'reconcile_integration');self.assertTrue(action['requires_controller_recheck'])
        self.assertEqual(state,before)
        for override in ({'head_sha':'c'*40},{'number':2},{'base_ref':'main'},{'contains_head':False}):
            action=r.reconcile_jobs(state,{'JOB:provider':{'pr':{**pr,**override}}})['actions'][0]
            self.assertNotEqual(action['action'],'reconcile_integration')

    def test_open_pr_rechecks_existing_controller_and_never_direct_merge(self):
        state=fixture();pr=accepted(state)
        action=r.reconcile_jobs(state,{'JOB:provider':{'pr':pr}})['actions'][0]
        self.assertEqual(action['action'],'integrate');self.assertTrue(action['requires_controller_recheck'])
        state['jobs']['provider']['verification']['test_count']=0
        self.assertEqual(r.reconcile_jobs(state,{'JOB:provider':{'pr':pr}})['actions'][0]['action'],'inspect_acceptance')

    def test_provider_change_reassesses_explicit_blocker_but_never_consumes_notice(self):
        state=fixture();state['jobs']['web'].update(status='blocked',blocked_on=['provider'])
        for user in ('web','report'):state['notices'][user]={'provider':'provider','user':user,'commit':'a'*40,'status':'pending'}
        plan=r.reconcile_jobs(state,{})
        self.assertEqual(plan['actions'][0]['action'],'review_blocker');self.assertEqual(plan['deferred_notices'],['report'])
        self.assertEqual(state['notices']['web']['status'],'pending')
        self.assertEqual(state['jobs']['web']['status'],'blocked')

    def test_owner_stop_no_recovery_dispatch_or_resumption(self):
        state=fixture();state.update(stopped=True,stop_source='owner');accepted(state)
        plan=r.reconcile_jobs(state,{})
        self.assertEqual(plan['status'],'hold');self.assertFalse(plan['actions']);self.assertTrue(state['stopped'])
