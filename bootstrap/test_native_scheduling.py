"""Pure control-plane regressions, not an additional product-test stage."""
import copy
import unittest
from native import scheduling as s


def fixture():
    state={'stopped':False,'slots':2,'owner_job_cap':8,'modules':{},'jobs':{},'notices':{},'events':[],
           'integration_branch':'codex/p4-integration-demo','native_roles':{}}
    for n,(name,uses) in enumerate((('provider',[]),('web',['provider']),('report',['provider']))):
        state['modules'][name]={'id':name,'order':n,'uses':uses,'paths':['toy/'+name]}
        if name!='report':state['jobs'][name]={'id':name,'order':n,'uses':uses,'attempt':0,'status':'ready','branch':'codex/p4-job-'+name}
    return state


def bind(state,jid,attempt=1,activity='idle',parent='/root/root/arch'):
    target=parent+'/'+jid;state['jobs'][jid]['attempt']=attempt
    state['native_roles']['JOB:'+jid]={'target':target,'generation':attempt}
    return {'target':target,'generation':attempt,'activity':activity}


class SchedulingTests(unittest.TestCase):
    def test_ready_consumer_does_not_wait_for_provider_and_order_is_total(self):
        state=fixture();before=copy.deepcopy(state)
        plan=s.plan_dispatch(state,observations={})
        self.assertEqual([a['job'] for a in plan['dispatch']],['provider','web'])
        self.assertTrue(all(a['requires_fresh_session_binding'] for a in plan['dispatch']))
        self.assertEqual(state,before)

    def test_account_and_native_capacity_narrow_but_do_not_change_owner_cap(self):
        state=fixture();state['slots']=8
        self.assertEqual(len(s.plan_dispatch(state,observations={},active_account_jobs=7)['dispatch']),1)
        self.assertEqual(len(s.plan_dispatch(state,observations={},native_capacity=1)['dispatch']),1)
        self.assertFalse(s.plan_dispatch(state,observations={},active_account_jobs=8)['dispatch'])
        self.assertEqual(state['owner_job_cap'],8)

    def test_review_reserves_slot_and_account_count_does_not_double_count(self):
        state=fixture();state['jobs']['provider']['status']='review';state['slots']=1
        self.assertFalse(s.plan_dispatch(state,observations={},active_account_jobs=1)['dispatch'])
        state['slots']=2
        plan=s.plan_dispatch(state,observations={},active_account_jobs=1)
        self.assertEqual([a['job'] for a in plan['dispatch']],['web'])
        self.assertEqual(plan['capacity']['account_occupied'],1)

    def test_stop_and_malformed_caps_fail_closed(self):
        state=fixture();state.update(stopped=True,stop_source='owner')
        self.assertEqual(s.plan_dispatch(state,observations={})['dispatch'],[])
        self.assertTrue(state['stopped'])
        for cap in (9,True,0,None):
            with self.subTest(cap=cap):
                with self.assertRaises(ValueError):s.plan_dispatch({**state,'owner_job_cap':cap},observations={})

    def test_invalid_dependency_cycle_unknown_provider_and_tied_order_rejected(self):
        for change in ('cycle','unknown','tie'):
            state=fixture()
            if change=='cycle':state['modules']['provider']['uses']=['web']
            if change=='unknown':state['modules']['web']['uses']=['missing']
            if change=='tie':state['modules']['web']['order']=0
            with self.subTest(change=change):
                with self.assertRaises(ValueError):s.plan_dispatch(state,observations={})

    def test_only_recorded_owner_priority_overrides_total_order(self):
        state=fixture();state['jobs']['web']['priority']=5
        with self.assertRaises(ValueError):s.plan_dispatch(state,observations={})
        state['events']=[{'kind':'owner-control','command':'priority','job':'web','value':'5'}]
        self.assertEqual(s.plan_dispatch(state,observations={})['dispatch'][0]['job'],'web')

    def test_historical_web_binding_never_receives_edits_and_requires_fresh_attempt(self):
        state=fixture();ob=bind(state,'web',3,activity='unavailable',parent='/root/oldarch')
        self.assertFalse(any(a['job']=='web' for a in s.plan_dispatch(state,observations={})['dispatch']))
        plan=s.plan_dispatch(state,observations={'JOB:web':ob})
        web=next(a for a in plan['dispatch'] if a['job']=='web')
        self.assertEqual((web['expected_attempt'],web['next_attempt']),(3,4))
        self.assertTrue(web['no_old_session_edit'])
        self.assertEqual(web['preserve_branch'],'codex/p4-job-web')

    def test_live_or_stale_observation_cannot_duplicate_old_actor(self):
        state=fixture();ob=bind(state,'web',3,activity='running')
        for value in (ob,{**ob,'generation':2},{**ob,'target':'/root/wrong'}):
            plan=s.plan_dispatch(state,observations={'JOB:web':value})
            self.assertFalse(any(a['job']=='web' for a in plan['dispatch']))

    def test_all_declared_users_keep_obligation_without_inventing_report_job(self):
        state=fixture()
        for user in ('web','report'):state['notices'][user]={'provider':'provider','user':user,'commit':'a'*40,'status':'pending'}
        plan=s.plan_dispatch(state,observations={})
        self.assertEqual(plan['pending_notices'],['web','report'])
        self.assertEqual([a['job'] for a in plan['dispatch']],['provider','web'])
        self.assertEqual(state['notices']['report']['status'],'pending')

    def test_receipt_ack_is_not_a_product_notice_state(self):
        state=fixture();state['notices']['bad']={'provider':'provider','user':'web','status':'acknowledged'}
        with self.assertRaises(ValueError):s.plan_dispatch(state,observations={})

    def test_invalid_observation_and_boolean_capacity_rejected(self):
        state=fixture();bind(state,'web')
        with self.assertRaises(ValueError):s.plan_dispatch(state,observations={'JOB:web':{'activity':'maybe'}})
        with self.assertRaises(ValueError):s.plan_dispatch(state,observations={},native_capacity=True)

    def test_protected_or_traversal_branch_state_is_not_proposed_for_dispatch(self):
        for base in ('main','tranche','codex/p4-integration-../../main','codex/p4-integration-demo.lock','codex/p4-integration-demo;echo'):
            state=fixture();state['integration_branch']=base
            with self.assertRaises(ValueError):s.plan_dispatch(state,observations={})
        state=fixture();state['jobs']['web']['branch']='main'
        with self.assertRaises(ValueError):s.plan_dispatch(state,observations={})
