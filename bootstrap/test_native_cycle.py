"""Native-cycle controller regressions. Provider calls are fixtures, never live proof."""
import copy
import json
import os
from pathlib import Path
import subprocess
import tempfile
import time
import unittest
from unittest.mock import patch

import coordinator as c
from native import cycle as n


class Memory:
    branch='codex/p4-state-native-fixture'
    def __init__(self,state,provider):self.state=copy.deepcopy(state);self.provider=provider;self.version=0
    def read(self):return copy.deepcopy(self.state),str(self.version)
    def mutate(self,action):
        state=copy.deepcopy(self.state);action(state);n.compact_recovery(state);self.state=state;self.version+=1;return copy.deepcopy(state)


class ProviderFixture:
    def __init__(self,base):
        self.calls=[];self.heads={'codex/p4-integration-fixture':base};self.on_push=None;self.gate_ok=True
        self.pr={'number':999,'url':'https://fixture.invalid/pr/999','state':'OPEN','isDraft':True,
                 'baseRefName':'codex/p4-integration-fixture','headRefName':'codex/p4-job-native-fixture-provider'}
    def head(self,branch):return self.heads[branch]
    def ensure_branch(self,branch,base):self.calls.append(('ensure',branch,base));self.heads.setdefault(branch,base)
    def push(self,path,branch,sha):
        self.calls.append(('push',branch,sha));self.heads[branch]=sha
        if self.on_push:self.on_push()
    def draft_pr(self,job,base):self.calls.append(('pr',job['branch'],base));return dict(self.pr)
    def contains(self,head,merged):return True
    def pr_info(self,number):return {**self.pr,'headRefOid':self.heads[self.pr['headRefName']], 'statusCheckRollup':[{'name':'gate','conclusion':'SUCCESS'}]}
    def gate_green(self,head):return self.gate_ok
    def ready_pr(self,number):self.calls.append(('ready',number));self.pr['isDraft']=False
    def merge_with_pinned_tool(self,repo,number):
        self.calls.append(('process-merge',number));self.heads[self.pr['baseRefName']]=self.heads[self.pr['headRefName']];self.pr['state']='MERGED'


class NativeCycleTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.root=Path(self.temp.name);self.repo=self.root/'repo';self.repo.mkdir()
        n.git(self.repo,'init','-q');n.git(self.repo,'config','user.name','Fixture');n.git(self.repo,'config','user.email','fixture@example.invalid')
        n.git(self.repo,'remote','add','origin','https://github.com/'+n.REPO+'.git')
        (self.repo/'toy/provider').mkdir(parents=True);(self.repo/'toy/peer').mkdir(parents=True)
        (self.repo/'toy/provider/value.py').write_text('def value(): return 1\n')
        (self.repo/'toy/provider/test_value.py').write_text('import unittest\nfrom value import value\nclass Tests(unittest.TestCase):\n def test_value(self): self.assertIsInstance(value(),int)\n')
        (self.repo/'toy/peer/file.txt').write_text('unchanged peer\n')
        (self.repo/'.gitignore').write_text('__pycache__/\n')
        n.git(self.repo,'add','.');n.git(self.repo,'commit','-qm','Fixture base')
        self.base=n.git(self.repo,'rev-parse','HEAD').stdout.strip();self.provider=ProviderFixture(self.base)
        state=c.empty();state.update(base=self.base,integration_branch='codex/p4-integration-fixture')
        n.assign(state,dict(id='provider',order=0,paths=['toy/provider'],uses=[],prompt='fixture',completion='module accepted',
                            verify=['python','-m','unittest','discover','-s','toy/provider','-p','test_*.py','-v']),Memory.branch)
        state['jobs']['provider'].update(base=self.base,workspace=str(self.repo),attempt=1,status='running')
        self.store=Memory(state,self.provider);self.cycle=n.Cycle(self.store,self.repo,self.root/'runtime')
    def tearDown(self):self.temp.cleanup()
    def change(self): (self.repo/'toy/provider/value.py').write_text('def value(): return 42\n')

    def test_repository_and_protected_refs_rejected_before_provider(self):
        with self.assertRaises(n.Rejected):n.Provider('other/repo')
        provider=n.Provider()
        with patch.object(provider,'_api') as api:
            for branch in ('main','tranche','codex/p4-job-x/../../main','codex/p4-job-x.lock'):
                with self.assertRaises(n.Rejected):provider.ensure_branch(branch,self.base)
            with self.assertRaises(n.Rejected):provider.read_state('codex/p4-job-not-state')
            api.assert_not_called()

    def test_assignment_rejects_controller_field_spoofing_and_protected_ownership(self):
        for extra in ({'base':'main'},{'workspace':'/tmp'},{'accepted':True}):
            with self.assertRaises(n.Rejected):n.assign(c.empty(),{'id':'evil','paths':['toy/evil'],**extra},Memory.branch)
        for path in ('bootstrap/x','toy/x/AGENTS.md','.github/workflows/x','../outside'):
            with self.assertRaises(n.Rejected):n.path_name(path)

    def test_unowned_untracked_or_staged_change_never_pushes(self):
        for staged in (False,True):
            with self.subTest(staged=staged):
                peer=self.repo/'toy/peer/file.txt';peer.write_text('unauthorized\n')
                if staged:n.git(self.repo,'add','toy/peer/file.txt')
                with self.assertRaisesRegex(n.Rejected,'outside assigned module'):
                    self.cycle.checkpoint('provider','completed')
                self.assertEqual(self.provider.calls,[])
                self.assertEqual(peer.read_text(),'unauthorized\n')
                self.assertEqual(self.store.state['jobs']['provider']['status'],'blocked')
                n.git(self.repo,'reset','--hard',self.base)
        (self.repo/'unowned-new.txt').write_text('untracked\n')
        with self.assertRaises(n.Rejected):self.cycle.checkpoint('provider','completed')
        self.assertEqual(self.provider.calls,[])

    def test_staged_unowned_change_hidden_by_worktree_revert_is_rejected(self):
        path=self.repo/'toy/peer/file.txt';path.write_text('staged invalid\n');n.git(self.repo,'add','toy/peer/file.txt')
        path.write_text('unchanged peer\n')
        with self.assertRaises(n.Rejected):self.cycle.checkpoint('provider','completed')
        self.assertEqual(self.provider.calls,[])

    def test_outside_rename_and_symlink_are_rejected(self):
        n.git(self.repo,'mv','toy/provider/value.py','toy/peer/stolen.py')
        with self.assertRaises(n.Rejected):self.cycle.checkpoint('provider','interrupted')
        self.assertEqual(self.provider.calls,[])
        n.git(self.repo,'reset','--hard',self.base)
        (self.repo/'toy/provider/link').symlink_to(self.repo/'toy/peer/file.txt')
        with self.assertRaisesRegex(n.Rejected,'symlink'):self.cycle.checkpoint('provider','completed')
        self.assertEqual(self.provider.calls,[])

    def test_unauthorized_history_is_not_leaked_even_after_revert(self):
        peer=self.repo/'toy/peer/file.txt';peer.write_text('unauthorized historical content\n')
        n.git(self.repo,'add','.');n.git(self.repo,'commit','-qm','Fixture invalid local commit')
        peer.write_text('unchanged peer\n');n.git(self.repo,'add','.');n.git(self.repo,'commit','-qm','Fixture revert')
        with self.assertRaises(n.Rejected):self.cycle.checkpoint('provider','blocked')
        self.assertEqual(self.provider.calls,[])

    def test_acceptance_changes_are_rechecked_before_remote_write(self):
        self.store.state['jobs']['provider']['verify']=['python','-c','from pathlib import Path; Path("toy/peer/file.txt").write_text("bad")']
        with self.assertRaises(n.Rejected):self.cycle.checkpoint('provider','completed')
        self.assertEqual(self.provider.calls,[])

    def test_completion_checkpoints_opens_pr_and_notifies_all_declared_users(self):
        for mid in ('consumer','report'):
            c.declare(self.store.state,{'id':mid,'uses':['provider'],'order':1,'paths':[]})
        self.change();result=self.cycle.checkpoint('provider','completed')
        self.assertTrue(result['accepted']);self.assertEqual(result['status'],'review')
        self.assertEqual(result['pr_number'],999)
        self.assertEqual({n['user'] for n in self.store.state['notices'].values()},{'consumer','report'})
        first=result['checkpoint'];self.cycle.checkpoint('provider','completed')
        self.assertEqual(self.store.state['jobs']['provider']['checkpoint'],first)
        self.assertEqual(len(self.store.state['notices']),2)
        self.assertEqual(n.git(self.repo,'rev-list','--count',self.base+'..HEAD').stdout.strip(),'1')

    def test_interrupted_work_and_same_branch_pr_survive_replacement_prepare(self):
        self.change();first=self.cycle.checkpoint('provider','interrupted')
        self.assertFalse(first['accepted']);self.assertEqual(first['status'],'paused')
        branch,pr=first['branch'],first['pr']
        c.control(self.store.state,'retry','provider')
        real=n.git
        def local_fetch(repo,*args,**kwargs):
            if args[:2]==('fetch','origin'):return subprocess.CompletedProcess(args,0,'','')
            if args[:2]==('worktree','add'):args=(*args[:-1],first['checkpoint'])
            return real(repo,*args,**kwargs)
        with patch.object(n,'git',side_effect=local_fetch):prepared=self.cycle.prepare('provider')
        self.assertEqual(prepared['branch'],branch);self.assertEqual(prepared['attempt'],2)
        self.assertEqual(self.store.state['jobs']['provider']['pr'],pr)
        self.assertEqual((Path(prepared['workspace'])/'toy/provider/value.py').read_text(),'def value(): return 42\n')

    def test_inflight_notice_does_not_disappear_during_integration(self):
        old={'provider':'upstream','user':'provider','commit':'old','status':'pending'}
        self.store.state['notices']['old']=old;self.store.state['jobs']['provider']['notice_ids']=['old']
        def arrive():self.store.state['notices']['new']={**old,'commit':'new'}
        self.provider.on_push=arrive
        self.change();job=self.cycle.checkpoint('provider','completed')
        self.provider.heads['codex/p4-integration-fixture']=job['checkpoint']
        self.cycle.record_integration('provider',job['checkpoint'],job['checkpoint'])
        self.assertEqual(self.store.state['notices']['old']['status'],'delivered-and-completed')
        self.assertEqual(self.store.state['notices']['new']['status'],'pending')
        self.assertEqual(self.store.state['jobs']['provider']['status'],'ready')

    def test_module_tests_receive_no_provider_environment_or_user_configs(self):
        job=copy.deepcopy(self.store.state['jobs']['provider'])
        job['verify']=['python','-c','import os; assert not any(k.startswith(("GH_","GITHUB_","AWS_","OPENAI_")) for k in os.environ if k!="GH_CONFIG_DIR"); assert os.environ["HOME"]==os.environ["GH_CONFIG_DIR"]']
        with patch.dict(os.environ,{'GH_TOKEN':'fixture','OPENAI_API_KEY':'fixture','AWS_SECRET_ACCESS_KEY':'fixture'}):
            self.assertEqual(n.verify(self.repo,job)['returncode'],0)

    def test_only_exact_accepted_head_can_integrate_through_pinned_tool(self):
        self.change();job=self.cycle.checkpoint('provider','completed')
        self.assertEqual(self.cycle.integrate('provider')['status'],'waiting-checks')
        self.assertEqual(self.cycle.integrate('provider')['status'],'integrated')
        self.assertIn(('process-merge',999),self.provider.calls)
        self.assertEqual(self.store.state['jobs']['provider']['status'],'done')
        self.store.state['jobs']['provider']['status']='review'
        self.provider.heads[job['branch']]='f'*40
        with self.assertRaisesRegex(n.Rejected,'moved'):self.cycle.integrate('provider')

    def test_no_main_or_wrong_pr_base_and_no_failing_gate_integration(self):
        self.change();self.cycle.checkpoint('provider','completed')
        self.provider.pr['baseRefName']='main'
        with self.assertRaises(n.Rejected):self.cycle.integrate('provider')
        self.assertFalse(any(call[0]=='process-merge' for call in self.provider.calls))
        self.provider.pr['baseRefName']='codex/p4-integration-fixture';self.provider.pr['isDraft']=False
        real=self.provider.pr_info
        self.provider.pr_info=lambda number:{**real(number),'statusCheckRollup':[{'context':'gate','state':'SUCCESS'}]}
        self.provider.gate_ok=False
        self.assertEqual(self.cycle.integrate('provider')['status'],'waiting-checks')
        self.assertFalse(any(call[0]=='process-merge' for call in self.provider.calls))

    def test_empty_suite_or_success_only_command_is_not_accepted(self):
        self.change();self.store.state['jobs']['provider']['verify']=['python','-c','pass']
        result=self.cycle.checkpoint('provider','completed')
        self.assertEqual(result['verification']['returncode'],0)
        self.assertEqual(result['verification']['test_count'],0)
        self.assertFalse(result['accepted']);self.assertEqual(result['status'],'blocked')
        with self.assertRaises(n.Rejected):self.cycle.integrate('provider')

    def test_new_round_preserves_merged_pr_and_opens_one_new_pr(self):
        provider=n.Provider();job=self.store.state['jobs']['provider'];job['checkpoint']=self.base
        old={**self.provider.pr,'state':'MERGED'}
        new={**self.provider.pr,'number':1000,'url':'https://fixture.invalid/pr/1000'}
        with patch.object(c,'run',side_effect=[json.dumps([old]),new['url'],json.dumps(new)]) as run:
            self.assertEqual(provider.draft_pr(job,'codex/p4-integration-fixture')['number'],1000)
            self.assertEqual(run.call_args_list[1].args[0][1:3],['pr','create'])
        with patch.object(c,'run',return_value=json.dumps([new,old])) as run:
            self.assertEqual(provider.draft_pr(job,'codex/p4-integration-fixture')['number'],1000)
            self.assertEqual(run.call_count,1)

    def test_already_merged_pr_reconciles_without_second_merge_mutation(self):
        self.change();job=self.cycle.checkpoint('provider','completed')
        self.provider.pr['isDraft']=False
        original=self.cycle.record_integration
        with patch.object(self.cycle,'record_integration',side_effect=RuntimeError('fixture durable write failure')):
            with self.assertRaises(RuntimeError):self.cycle.integrate('provider')
        self.assertEqual(self.provider.pr['state'],'MERGED')
        result=self.cycle.integrate('provider')
        self.assertTrue(result['reconciled'])
        self.assertEqual(sum(call[0]=='process-merge' for call in self.provider.calls),1)
        self.assertEqual(self.store.state['jobs']['provider']['status'],'done')

    def test_replacement_refreshes_provider_baseline_and_preserves_partial_work(self):
        self.change();first=self.cycle.checkpoint('provider','interrupted')
        upstream=self.root/'integration-edit'
        n.git(self.repo,'worktree','add','--detach',str(upstream),self.base)
        (upstream/'toy/peer/file.txt').write_text('trusted newer provider baseline\n')
        n.git(upstream,'add','.');n.git(upstream,'commit','-qm','Fixture upstream integration')
        baseline=n.git(upstream,'rev-parse','HEAD').stdout.strip()
        self.provider.heads['codex/p4-integration-fixture']=baseline
        c.control(self.store.state,'retry','provider')
        real=n.git
        def local_fetch(repo,*args,**kwargs):
            if args[:2]==('fetch','origin'):return subprocess.CompletedProcess(args,0,'','')
            if args[:2]==('worktree','add'):args=(*args[:-1],first['checkpoint'])
            return real(repo,*args,**kwargs)
        with patch.object(n,'git',side_effect=local_fetch):prepared=self.cycle.prepare('provider')
        current=self.store.state['jobs']['provider'];path=Path(prepared['workspace'])
        self.assertEqual(current['base'],baseline);self.assertEqual(current['original_base'],self.base)
        self.assertEqual(current['branch'],first['branch']);self.assertEqual(current['pr'],first['pr'])
        self.assertEqual((path/'toy/provider/value.py').read_text(),'def value(): return 42\n')
        self.assertEqual((path/'toy/peer/file.txt').read_text(),'trusted newer provider baseline\n')
        self.assertTrue(current['trusted_baseline_merges'])
        n.check_workspace(path,current)

    def native_consumer(self,register=True):
        spec=dict(id='consumer',order=1,paths=['toy/consumer'],uses=['provider'],
                  prompt='fixture consumer',completion='fixture',verify=['python','-c','pass'])
        n.assign(self.store.state,spec,self.store.branch)
        self.store.state['jobs']['consumer'].update(attempt=1,status='running')
        if register:self.cycle.session('consumer','/root/consumer-one')
        return self.store.state['jobs']['consumer']

    def test_checkpoint_enqueues_reactive_notice_for_registered_consumer_and_retains_report(self):
        self.native_consumer();c.declare(self.store.state,{'id':'report','order':2,'paths':[],'uses':['provider']})
        self.change();result=self.cycle.checkpoint('provider','completed')
        self.assertEqual(len(result['message_ids_to_deliver']),1)
        ident=result['message_ids_to_deliver'][0]
        intent=self.cycle.intent(ident,'idle')
        self.assertEqual(intent['tool'],'followup_task')
        self.assertEqual(intent['target'],'/root/consumer-one');self.assertEqual(intent['generation'],1)
        self.assertEqual(len(self.store.state['notices']),2)
        self.assertTrue(any(notice['user']=='report' for notice in self.store.state['notices'].values()))
        self.assertFalse(any(message['recipient']=='JOB:report' for message in self.cycle.mailbox.read()['messages'].values()))
        self.assertEqual(self.cycle.mailbox.read()['messages'][ident]['status'],'pending')

    def test_session_registration_catches_up_notices_created_before_job_session(self):
        self.native_consumer(register=False)
        self.change();result=self.cycle.checkpoint('provider','completed')
        self.assertFalse(result['message_ids_to_deliver'])
        registration=self.cycle.session('consumer','/root/consumer-late')
        self.assertEqual(len(registration['message_ids_to_deliver']),1)
        ident=registration['message_ids_to_deliver'][0]
        self.assertIn(ident,self.cycle.mailbox.read()['messages'])
        self.assertEqual(self.cycle.intent(ident,'running')['target'],'/root/consumer-late')

    def test_replacement_redelivers_unacknowledged_message_to_current_attempt(self):
        self.native_consumer();self.change();result=self.cycle.checkpoint('provider','completed')
        ident=result['message_ids_to_deliver'][0];old=self.cycle.intent(ident,'running')
        self.cycle.delivered(old,{'task_name':old['target']})
        self.store.state['jobs']['consumer']['attempt']=2
        self.cycle.sync_mailbox()  # prepare() performs this lifecycle update in production.
        with self.assertRaises(n.communication.StaleRecipient):self.cycle.intent(ident,'idle')
        registration=self.cycle.session('consumer','/root/consumer-two')
        self.assertIn(ident,registration['message_ids_to_deliver'])
        current=self.cycle.intent(ident,'idle');self.assertEqual(current['target'],'/root/consumer-two')
        with self.assertRaises(n.communication.StaleRecipient):self.cycle.delivered(old)
        with self.assertRaises(n.communication.StaleRecipient):
            self.cycle.acknowledge(ident,old['target'],1,time.time(),'Observed '+ident)
        self.cycle.delivered(current,{'task_name':current['target']})
        self.assertTrue(self.cycle.acknowledge(ident,current['target'],2,time.time(),'Observed '+ident)['new_ack'])
        self.assertFalse(self.cycle.acknowledge(ident,current['target'],2,time.time(),'Observed '+ident)['new_ack'])
        count=len(self.cycle.mailbox.read()['messages'][ident]['deliveries'])
        self.assertEqual(self.cycle.delivered(current,{'fixture':'late-duplicate'})['status'],'acknowledged')
        self.assertEqual(len(self.cycle.mailbox.read()['messages'][ident]['deliveries']),count)

    def test_first_processing_ack_is_separate_from_notice_completion(self):
        self.native_consumer();self.change();result=self.cycle.checkpoint('provider','completed')
        ident=result['message_ids_to_deliver'][0];intent=self.cycle.intent(ident,'idle')
        with self.assertRaisesRegex(n.Rejected,'submission'):
            self.cycle.acknowledge(ident,intent['target'],1,time.time(),'Observed '+ident)
        self.cycle.delivered(intent)
        self.cycle.acknowledge(ident,intent['target'],1,time.time(),'Observed native actor '+ident)
        notice_id=ident.removeprefix('provider-notice:')
        self.assertEqual(self.store.state['notices'][notice_id]['status'],'pending')
        self.assertEqual(self.cycle.mailbox.read()['messages'][ident]['status'],'acknowledged')
        # Completion of the launched notice is a later independent product event.
        consumer=self.store.state['jobs']['consumer'];consumer.update(accepted=True,checkpoint=result['checkpoint'],notice_ids=[notice_id])
        self.provider.heads['codex/p4-integration-fixture']=result['checkpoint']
        self.cycle.record_integration('consumer',result['checkpoint'],result['checkpoint'])
        self.assertEqual(self.store.state['notices'][notice_id]['status'],'delivered-and-completed')

    def test_generic_arch_coordinator_messages_are_local_and_idempotent(self):
        self.cycle.register_role('ARCH','/root/native-arch',1)
        first=self.cycle.message('COORDINATOR','ARCH','Exact fixture instruction','fixture-control-message')
        second=self.cycle.message('COORDINATOR','ARCH','Exact fixture instruction','fixture-control-message')
        self.assertEqual(first,second)
        self.assertEqual(len(self.cycle.messages('ARCH')),1)
        intent=self.cycle.intent(first['message_id'],'running')
        self.assertEqual(intent['tool'],'followup_task')
        self.assertEqual(intent['target'],'/root/native-arch')
        with self.assertRaises(ValueError):self.cycle.message('COORDINATOR','ARCH','Changed fixture text','fixture-control-message')
        with self.assertRaises(n.Rejected):self.cycle.register_role('ROOT','/root',1)

    def test_routine_communication_has_zero_remote_state_writes_or_reads_after_seed(self):
        self.cycle.register_role('ARCH','/root/native-arch',1)
        with patch.object(self.store,'mutate',side_effect=AssertionError('remote write')),patch.object(self.store,'read',side_effect=AssertionError('remote read')):
            for number in range(20):
                key=self.cycle.message('ROOT','ARCH','work',str(number))['message_id']
                intent=self.cycle.intent(key,'idle');self.cycle.delivered(intent)
                self.cycle.acknowledge(key,intent['target'],1,time.time(),'fixture actual receipt '+key)
                self.cycle.messages()
        self.assertNotIn('native_mailbox',self.store.state)

    def test_compact_provider_obligations_cover_every_change_and_every_user(self):
        state=c.empty()
        for mid in ('consumer','report'):c.declare(state,{'id':mid,'uses':['provider'],'order':1,'paths':[]})
        for number in range(1000):
            c.notify(state,'provider',str(number));n.compact_notices(state)
            self.assertEqual(len(state['notices']),2)
        for notice in state['notices'].values():
            self.assertEqual(notice['commit'],'999');self.assertEqual(notice['first_unconsumed_commit'],'0')
            self.assertEqual(notice['change_count'],1000)

    def test_compaction_preserves_active_old_notice_and_new_change_obligation(self):
        state=c.empty();c.declare(state,{'id':'consumer','uses':['provider'],'order':1,'paths':[]})
        c.notify(state,'provider','first')
        first=next(iter(state['notices']))
        state['jobs']['consumer']={'status':'running','notice_ids':[first]}
        for number in range(100):c.notify(state,'provider',str(number));n.compact_notices(state)
        self.assertEqual(len(state['notices']),2)
        self.assertEqual(state['notices'][first]['commit'],'first')
        latest=next(v for k,v in state['notices'].items() if k!=first)
        self.assertEqual(latest['commit'],'99');self.assertEqual(latest['change_count'],100)
        self.assertEqual(latest['status'],'pending')

    def test_every_provider_checkpoint_still_creates_immediate_local_consumer_fanout(self):
        self.native_consumer()
        for number in range(3):
            self.change();(self.repo/'toy/provider/extra.txt').write_text(str(number))
            result=self.cycle.checkpoint('provider','completed')
            ident='provider-notice:provider:'+result['checkpoint']+':consumer'
            self.assertIn(ident,result['message_ids_to_deliver'])
        self.assertEqual(len(self.cycle.messages('JOB:consumer')),3)

    def test_recovery_writes_do_not_repersist_legacy_messages_or_unbounded_native_events(self):
        state=c.empty();state['native_mailbox']={'recipients':{'ARCH':{'target':'/root/arch','generation':1}},'messages':{'legacy':{'text':'temporary'}}}
        for number in range(1000):c.event(state,'native-checkpoint',job='provider',checkpoint=str(number))
        n.compact_recovery(state)
        self.assertNotIn('native_mailbox',state)
        self.assertEqual(state['native_roles']['ARCH']['generation'],1)
        self.assertEqual(len(state['events']),1)
        self.assertEqual(state['events'][0]['checkpoint'],'999')

    def test_workspace_mailbox_loss_rehydrates_pending_provider_obligations_without_remote_write(self):
        self.native_consumer();c.declare(self.store.state,{'id':'report','uses':['provider'],'order':2,'paths':[]})
        self.change();result=self.cycle.checkpoint('provider','completed')
        key=result['message_ids_to_deliver'][0];intent=self.cycle.intent(key,'idle')
        self.cycle.delivered(intent);self.cycle.acknowledge(key,intent['target'],1,time.time(),'fixture receipt '+key)
        self.cycle.mailbox.path.unlink()
        recovered=n.Cycle(self.store,self.repo,self.cycle.runtime)
        with patch.object(self.store,'mutate',side_effect=AssertionError('recovery seed wrote remote state')):
            message=recovered.messages('JOB:consumer')[key]
        self.assertEqual(message['status'],'pending') # Business obligation not consumed by prior receipt.
        self.assertEqual(recovered.intent(key,'idle')['target'],'/root/consumer-one')
        self.assertEqual({notice['user'] for notice in self.store.state['notices'].values()},{'consumer','report'})
        self.assertFalse(recovered.messages('JOB:report')) # No actual report session to awaken.

    def test_push_destination_checks_effective_pushurl_and_rewrites_before_adapter(self):
        provider=n.Provider();branch='codex/p4-job-native-fixture-provider'
        cases=[('remote.origin.pushurl','https://example.invalid/unauthorized.git'),
               ('url.https://example.invalid/.pushInsteadOf','https://github.com/')]
        for setting,value in cases:
            with self.subTest(setting=setting):
                n.git(self.repo,'config',setting,value)
                try:
                    with patch.object(provider,'_perform') as adapter:
                        with self.assertRaisesRegex(n.Rejected,'effective push destination'):provider.push(self.repo,branch,self.base)
                        adapter.assert_not_called()
                finally:n.git(self.repo,'config','--unset-all',setting)
        n.git(self.repo,'config','--add','remote.origin.pushurl','https://github.com/'+n.REPO+'.git')
        n.git(self.repo,'config','--add','remote.origin.pushurl','https://example.invalid/extra.git')
        with patch.object(provider,'_perform') as adapter:
            with self.assertRaises(n.Rejected):provider.push(self.repo,branch,self.base)
            adapter.assert_not_called()

    def test_store_returns_exact_normalized_snapshot_and_ranges_do_not_double_count(self):
        state=c.empty();c.declare(state,{'id':'report','uses':['provider'],'order':1,'paths':[]})
        state['native_mailbox']={'recipients':{},'messages':{'old':{'status':'acknowledged'}}}
        class Capture:
            def read_state(self,branch):return copy.deepcopy(self.state),'fixture-sha'
            def write_state(self,branch,value,sha):self.state=copy.deepcopy(value)
        provider=Capture();provider.state=state;store=n.Store(Memory.branch,provider)
        for number in range(10):
            result=store.mutate(lambda s:c.notify(s,'provider',str(number)))
            self.assertEqual(result,provider.state)
            self.assertNotIn('native_mailbox',result)
            self.assertEqual(len(result['notices']),1)
            notice=next(iter(result['notices'].values()))
            self.assertEqual(notice['change_count'],number+1)
            self.assertEqual(notice['first_unconsumed_commit'],'0')

    def test_stopped_run_rejects_native_dispatch(self):
        self.store.state['stopped']=True;self.store.state['jobs']['provider']['status']='ready'
        with self.assertRaises(n.Rejected):self.cycle.prepare('provider')
        self.assertEqual(self.provider.calls,[])


    def test_opted_in_root_binding_preserves_state_and_routes_locally(self):
        prior=copy.deepcopy(self.store.state)
        self.cycle.adopt_layout('fixture actual owner approval reference')
        self.assertEqual(self.store.state['jobs'],prior['jobs'])
        self.assertEqual(self.store.state['notices'],prior['notices'])
        with self.assertRaises(n.native_layout.InvalidLayout):self.cycle.register_role('ROOT','/root/supervisor',1)
        self.cycle.register_role('ROOT','/root/supervisor',1,actor='/root')
        self.cycle.register_role('ARCH','/root/supervisor/arch',1,actor='/root/supervisor')
        with patch.object(self.store,'read',side_effect=AssertionError('routine remote read')),patch.object(self.store,'mutate',side_effect=AssertionError('routine remote write')):
            self.cycle.message('ARCH','ROOT','Continue existing supervision','root-local')
            intent=self.cycle.intent('root-local','idle')
            self.assertEqual(intent['target'],'/root/supervisor')
            self.cycle.delivered(intent)
            self.cycle.acknowledge('root-local','/root/supervisor',1,time.time(),'actual fixture receipt root-local')

    def test_opted_in_bind_requires_current_creator_and_rechecks_durable_generation(self):
        self.cycle.adopt_layout('fixture actual owner approval reference')
        self.cycle.register_role('ROOT','/root/supervisor',1,actor='/root')
        before=copy.deepcopy(self.store.state)
        with self.assertRaises(n.native_layout.InvalidLayout):self.cycle.register_role('ARCH','/root/supervisor/arch',1,actor='/root')
        self.assertEqual(self.store.state,before)
        self.cycle.register_role('ARCH','/root/supervisor/arch',1,actor='/root/supervisor')
        with self.assertRaises(n.native_layout.InvalidLayout):self.cycle.session('provider','/root/supervisor/wrongjob',actor='/root/supervisor/arch')
        self.cycle.session('provider','/root/supervisor/arch/job',actor='/root/supervisor/arch')
        self.cycle.register_role('ROOT','/root/replacement',2,actor='/root')
        with self.assertRaises(n.native_layout.InvalidLayout):self.cycle.register_role('ARCH','/root/supervisor/newarch',2,actor='/root/supervisor')
        self.assertEqual(self.store.state['jobs']['provider']['session'],'/root/supervisor/arch/job')

    def test_parallel_dispatch_filters_stale_observation_and_preserves_legacy_session(self):
        self.store.state['jobs']['provider'].update(status='ready',session='/root/old_arch/old_job')
        packet={'JOB:provider':{'target':'/root/old_arch/old_job','generation':1,'activity':'unavailable',
                              'observed_at':time.time()-120,'source':'actual-native-inventory'}}
        before=copy.deepcopy(self.store.state)
        stale=self.cycle.schedule_plan(packet,actor='/root/arch',native_capacity=1)
        self.assertEqual(stale['dispatch'],[]);self.assertTrue(stale['observation_holds'])
        packet['JOB:provider']['observed_at']=time.time()
        fresh=self.cycle.schedule_plan(packet,actor='/root/arch',native_capacity=1)
        self.assertEqual(fresh['dispatch'][0]['next_attempt'],2)
        self.assertEqual(fresh['dispatch'][0]['preserve_branch'],before['jobs']['provider']['branch'])
        self.assertEqual(self.store.state,before);self.assertEqual(self.provider.calls,[])

    def test_parallel_controller_requires_current_arch_in_approved_layout(self):
        self.cycle.adopt_layout('fixture observed owner approval')
        self.cycle.register_role('ROOT','/root/supervisor',1,actor='/root')
        self.cycle.register_role('ARCH','/root/supervisor/arch',1,actor='/root/supervisor')
        before=copy.deepcopy(self.store.state)
        for method in (self.cycle.schedule_plan,self.cycle.recovery_plan):
            with self.assertRaises(n.Rejected):method({},actor='/root')
        self.assertEqual(self.store.state,before)

    def test_combined_pilot_hold_prevents_reservation_or_provider_mutation(self):
        self.store.state['jobs']['provider']['status']='ready'
        self.store.state['bootstrap_integrator']={'pilot_hold':True}
        before=copy.deepcopy(self.store.state)
        self.assertEqual(self.cycle.schedule_plan({},actor='/root/arch')['dispatch'],[])
        with self.assertRaisesRegex(n.Rejected,'verification pending'):self.cycle.prepare('provider')
        self.assertEqual(self.store.state,before);self.assertEqual(self.provider.calls,[])

    def test_repeated_owner_record_milestone_does_not_write_an_empty_remote_commit(self):
        self.cycle.adopt_layout('fixture observed approval')
        self.cycle.register_role('ROOT','/root/supervisor',1,actor='/root')
        self.cycle.register_role('COORDINATOR','/root/supervisor/coord',1,actor='/root/supervisor')
        proposal=self.cycle.owner_input(actor='/root',text='Hold the existing scope.',kind='instruction',
                                       message_id='owner-once',marked=True)
        durable=copy.deepcopy(self.store.state);writes=[]
        def read(branch):return copy.deepcopy(durable),'fixture-blob'
        def write(branch,state,sha):writes.append(copy.deepcopy(state));durable.update(copy.deepcopy(state))
        with patch.object(self.provider,'read_state',side_effect=read,create=True),patch.object(self.provider,'write_state',side_effect=write,create=True):
            self.cycle.store=n.Store(Memory.branch,self.provider)
            kwargs={'actor':'/root/supervisor/coord','envelope':proposal['envelope'],
                    'observed_at':time.time(),'source_evidence':'fixture actual owner event'}
            self.assertTrue(self.cycle.owner_record(**kwargs)['new_record'])
            self.assertFalse(self.cycle.owner_record(**kwargs)['new_record'])
        self.assertEqual(len(writes),1)
        self.assertEqual(durable['owner_records']['owner-once']['text'],'Hold the existing scope.')

    def test_owner_question_forwarding_is_local_and_cannot_create_owner_record(self):
        self.cycle.adopt_layout('fixture observed owner approval')
        self.cycle.register_role('ROOT','/root/supervisor',1,actor='/root')
        self.cycle.register_role('COORDINATOR','/root/supervisor/coord',1,actor='/root/supervisor')
        before=copy.deepcopy(self.store.state)
        packet={'actor':'/root','text':'What is running?\nDo not build.','kind':'question','message_id':'question-one'}
        result=self.cycle.owner_input(**packet)
        self.assertFalse(result['build_authorized_by_forwarding'])
        self.assertEqual(result['envelope']['verbatim'],packet['text'])
        self.assertEqual(self.store.state,before)
        with self.assertRaises(PermissionError):
            self.cycle.owner_record(actor='/root/supervisor/coord',envelope=result['envelope'],
                observed_at=time.time(),source_evidence='fixture source event')
        self.assertEqual(self.store.state,before)


class ProcessGateSourceTests(unittest.TestCase):
    head='a'*40
    def check(self,**updates):
        return dict(id=123,name='gate',head_sha=self.head,status='completed',conclusion='success',
                    app={'id':15368},check_suite={'id':33},**updates)
    def run_record(self,**updates):
        return dict(id=100,check_suite_id=33,head_sha=self.head,path=n.GATE_WORKFLOW_PATH,
                    repository={'full_name':n.REPO},**updates)
    def green(self,checks,runs):
        provider=n.Provider()
        with patch.object(provider,'_api',side_effect=[{'check_runs':checks},{'workflow_runs':runs}]):
            return provider.gate_green(self.head)

    def test_actual_actions_process_gate_matches_exact_head(self):
        provider=n.Provider()
        with patch.object(provider,'_api',side_effect=[{'check_runs':[self.check()]},{'workflow_runs':[self.run_record()]}]) as api:
            self.assertTrue(provider.gate_green(self.head))
            self.assertEqual(api.call_args_list[0].args[0],
                'commits/'+self.head+'/check-runs?check_name=gate&filter=latest&per_page=100')
            self.assertEqual(api.call_args_list[1].args[0],
                'actions/runs?head_sha='+self.head+'&per_page=100')

    def test_generic_commit_status_does_not_substitute_for_check_run(self):
        provider=n.Provider()
        with patch.object(provider,'_api',return_value={'statuses':[{'context':'gate','state':'success'}]}) as api:
            self.assertFalse(provider.gate_green(self.head))
            self.assertEqual(api.call_count,1)

    def test_foreign_app_wrong_sha_pending_and_failed_gate_are_refused(self):
        for fields in ({'app':{'id':999}}, {'head_sha':'b'*40},
                       {'status':'in_progress','conclusion':None},{'conclusion':'failure'}):
            with self.subTest(fields=fields):
                check={**self.check(),**fields}
                self.assertFalse(self.green([check],[self.run_record()]))

    def test_wrong_workflow_wrong_suite_wrong_sha_or_repository_are_refused(self):
        for fields in ({'path':'.github/workflows/unrelated.yml'}, {'check_suite_id':34},
                       {'head_sha':'b'*40},{'repository':{'full_name':'other/repo'}}):
            with self.subTest(fields=fields):
                run={**self.run_record(),**fields}
                self.assertFalse(self.green([self.check()],[run]))

    def test_old_success_does_not_override_new_failed_or_pending_source_check(self):
        later={**self.check(),'id':124,'status':'in_progress','conclusion':None}
        self.assertFalse(self.green([self.check(),later],[self.run_record()]))

    def test_gate_requires_exact_sha_before_reading_provider(self):
        provider=n.Provider()
        with patch.object(provider,'_api') as api:
            with self.assertRaises(n.Rejected):provider.gate_green('main')
            api.assert_not_called()


class NativeControlJournalTests(unittest.TestCase):
    def state(self):
        state=c.empty()
        n.assign(state,dict(id='provider',order=0,paths=['toy/provider'],uses=[],prompt='fixture',completion='fixture',verify=['python','-c','pass']),Memory.branch)
        return state

    def test_arch_correction_is_not_recorded_as_owner_words(self):
        state=self.state();state['jobs']['provider']['status']='blocked'
        n.control(state,'instruction','provider','Fixture technical correction')
        self.assertEqual(state['instructions'],[])
        self.assertEqual(state['jobs']['provider']['instructions'],[])
        self.assertEqual(state['jobs']['provider']['technical_instructions'],['Fixture technical correction'])
        self.assertEqual(state['jobs']['provider']['status'],'ready')
        self.assertEqual(state['events'][-1]['kind'],'native-arch-control')

    def test_owner_instruction_requires_explicit_source_and_retains_exact_text(self):
        state=self.state();text='Instruction: exact fixture owner text.\nSecond line.'
        n.control(state,'instruction','provider',text,source='owner')
        self.assertEqual(state['instructions'][-1]['text'],text)
        self.assertEqual(state['jobs']['provider']['instructions'],[text])
        self.assertEqual(state['events'][-1]['kind'],'owner-control')

    def test_technical_stop_is_distinct_and_cannot_clear_actual_owner_stop(self):
        state=self.state();n.control(state,'stop')
        self.assertEqual(state['stop_source'],'technical')
        n.control(state,'continue');self.assertFalse(state['stopped'])
        n.control(state,'stop',source='owner')
        n.control(state,'stop') # A technical stop must not downgrade an owner stop.
        self.assertEqual(state['stop_source'],'owner')
        with self.assertRaisesRegex(n.Rejected,'actual owner stop'):n.control(state,'continue')
        self.assertTrue(state['stopped']);self.assertEqual(state['stop_source'],'owner')

    def test_arch_retry_preserves_history_and_owner_cap(self):
        state=self.state();state['events'].append({'kind':'owner-control','command':'historical fixture'})
        historical=copy.deepcopy(state['events'][-1])
        n.control(state,'retry','provider')
        self.assertEqual(state['events'][-2],historical)
        self.assertEqual(state['events'][-1]['kind'],'native-arch-control')
        n.control(state,'slots',value='2',source='owner')
        with self.assertRaises(n.Rejected):n.control(state,'slots',value='3')
        n.control(state,'slots',value='1')
        self.assertEqual(state['owner_job_cap'],2);self.assertEqual(state['slots'],1)


class NativeBrokerTests(unittest.TestCase):
    def setUp(self):
        self.provider=n.Provider()
        self.subject=n.Subject('native-arch-controller','ARCH',n.REPO)
        self.sha='a'*40

    def test_scope_denies_identity_repo_and_untyped_changes_before_adapter(self):
        requests=[('github.state.update',{'repo':n.REPO,'branch':'main'}),
                  ('github.state.update',{'repo':'neobobkrause/CivicSmith2','branch':'codex/p4-state-native-demo'}),
                  ('github.branch.create',{'repo':n.REPO,'branch':'tranche','base':self.sha}),
                  ('github.branch.update',{'repo':n.REPO,'branch':'codex/p4-job-demo','head':self.sha,'force':True}),
                  ('github.settings.update',{'repo':n.REPO})]
        for operation,request in requests:
            with self.subTest(operation=operation,request=request):
                with patch.object(self.provider,'_request') as transport:
                    with self.assertRaises(n.Denied):
                        self.provider._perform(operation,request,lambda:self.provider._request('forbidden','PATCH',{}))
                    transport.assert_not_called()
        for subject in (n.Subject('job','JOB',n.REPO),n.Subject('native-arch-controller','ARCH','other/repo'),None):
            with self.assertRaises(n.Denied):
                n.NativeInstructionScope().authorize(subject,'github.state.update',{'repo':n.REPO,'branch':'codex/p4-state-native-demo'})

    def test_raw_mutating_api_is_rejected_before_transport(self):
        with patch.object(self.provider,'_request') as transport:
            with self.assertRaisesRegex(n.Denied,'TYPED_NATIVE_MUTATION_REQUIRED'):
                self.provider._api('git/refs/heads/main','PATCH',{'sha':self.sha})
            transport.assert_not_called()

    def test_state_write_uses_broker_and_records_actual_adapter_return(self):
        with patch.object(n.NativeInstructionScope,'authorize',autospec=True,wraps=None) as authorize:
            # This fixture only checks wiring; actual scope denial is above.
            with patch.object(self.provider,'_request',return_value={'fixture':'return'}) as transport:
                self.provider.write_state('codex/p4-state-native-demo',{'test':True},self.sha)
            authorize.assert_called_once()
            self.assertEqual(authorize.call_args.args[2],'github.state.update')
            self.assertEqual(transport.call_args.args[1],'PUT')
        self.assertEqual(self.provider.audit[-1]['outcome'],'adapter-returned')

    def test_adapter_failure_is_not_recorded_as_returned(self):
        with patch.object(self.provider,'_request',side_effect=RuntimeError('fixture transport failure')):
            with self.assertRaises(RuntimeError):self.provider.write_state('codex/p4-state-native-demo',{},self.sha)
        self.assertEqual(self.provider.audit,[])

    def test_merge_requires_current_head_gate_and_experimental_base(self):
        request={'repo':n.REPO,'head':'codex/p4-job-demo','base':'codex/p4-integration-demo','pr':1,'expected_head':self.sha}
        scope=n.NativeInstructionScope()
        for facts in ({},{'observed_head':'b'*40,'existing_gate_green':True},{'observed_head':self.sha,'existing_gate_green':False}):
            with self.assertRaises(n.Denied):scope.authorize(self.subject,'github.pr.merge_job',request,trusted=facts)
        scope.authorize(self.subject,'github.pr.merge_job',request,trusted={'observed_head':self.sha,'existing_gate_green':True})
        with self.assertRaises(n.Denied):scope.authorize(self.subject,'github.pr.merge_job',{**request,'base':'main'},trusted={'observed_head':self.sha,'existing_gate_green':True})

    def test_ready_reads_actual_pr_scope_before_adapter(self):
        with patch.object(self.provider,'pr_info',return_value={'headRefName':'codex/p4-job-demo','baseRefName':'main'}),patch.object(c,'run') as adapter:
            with self.assertRaises(n.Denied):self.provider.ready_pr(99)
            adapter.assert_not_called()


if __name__=='__main__':unittest.main()
