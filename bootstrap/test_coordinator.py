"""Bootstrap verification. Fixture subprocesses are NOT Codex inference evidence."""
import copy
import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
import time
import unittest
from unittest.mock import patch

spec=importlib.util.spec_from_file_location('coordinator',Path(__file__).with_name('coordinator.py'))
c=importlib.util.module_from_spec(spec); spec.loader.exec_module(c)


def job(jid='provider',order=0,**kw):
    return dict(id=jid,order=order,paths=[f'toy/{jid}.txt'],prompt='complete the module',
                completion='expected output exists',verify=['python','-c','pass'],**kw)


class Memory:
    """CAS test fixture, explicitly not the GitHub durability demonstration."""
    branch='codex/p4-state-unit'
    def __init__(self,s): self.s=copy.deepcopy(s); self.n=0
    def read(self): return copy.deepcopy(self.s),str(self.n)
    def write(self,s,sha):
        if sha!=str(self.n): raise RuntimeError('conflict')
        self.s=copy.deepcopy(s); self.n+=1
    def mutate(self,fn):
        s,sha=self.read(); fn(s); self.write(s,sha); return s


class Tests(unittest.TestCase):
    def test_order_and_stop(self):
        s=c.empty()
        for name,n in [('late',9),('early',1),('middle',4)]: c.add(s,job(name,n))
        self.assertEqual([j['id'] for j in c.ready(s)],['early','middle','late'])
        c.control(s,'priority','late','1')
        self.assertEqual(c.ready(s)[0]['id'],'late')
        c.control(s,'stop'); self.assertEqual(c.ready(s),[])
        c.control(s,'continue'); self.assertEqual(len(c.ready(s)),3)
        with self.assertRaises(ValueError): c.control(s,'slots',value='9')

    def test_every_declared_user_including_no_job(self):
        s=c.empty(); c.add(s,job())
        for i in range(20): c.declare(s,dict(id=f'user-{i}',uses=['provider']))
        c.declare(s,dict(id='unrelated',uses=[]))
        c.notify(s,'provider','abc'); c.notify(s,'provider','abc')
        self.assertEqual(len(s['notices']),20)
        self.assertTrue(all(n['status']=='pending' for n in s['notices'].values()))
        c.notify(s,'provider','def'); self.assertEqual(len(s['notices']),40)

    def test_finished_user_gets_work_again(self):
        s=c.empty(); c.add(s,job('consumer',1,uses=['provider']))
        s['jobs']['consumer']['status']='done'
        c.notify(s,'provider','new')
        self.assertEqual(s['jobs']['consumer']['status'],'ready')

    def test_controls_preserve_exact_words(self):
        s=c.empty(); c.add(s,job()); s['jobs']['provider']['status']='running'
        c.control(s,'instruction','provider','Instruction: keep these exact words.\nSecond line.')
        self.assertEqual(s['instructions'][0]['text'],s['jobs']['provider']['instructions'][0])
        c.control(s,'replace','provider')
        self.assertEqual(s['jobs']['provider']['status'],'interrupting')
        self.assertTrue(s['jobs']['provider']['restart'])

    def test_claim_recovers_and_rejects_live_lease(self):
        s=c.empty(); c.add(s,job()); s['jobs']['provider'].update(status='running',checkpoint='durable-sha')
        m=Memory(s); sup=object.__new__(c.Supervisor); sup.store=m; sup.owner='new'; sup.ttl=90
        sup.claim(); self.assertEqual(m.s['jobs']['provider']['status'],'ready')
        self.assertEqual(m.s['jobs']['provider']['checkpoint'],'durable-sha')
        sup.owner='other'
        with self.assertRaises(RuntimeError): sup.claim()

    def test_api_auth_refused_and_api_env_removed(self):
        with patch.dict(c.os.environ,{'OPENAI_API_KEY':'fixture','CODEX_API_KEY':'fixture'}):
            self.assertNotIn('OPENAI_API_KEY',c.codex_env()); self.assertNotIn('CODEX_API_KEY',c.codex_env())
        with patch.object(c.subprocess,'run',return_value=subprocess.CompletedProcess([],0,'','Logged in using an API key')):
            with self.assertRaises(RuntimeError): c.auth()

    def test_cas_conflict(self):
        m=Memory(c.empty()); a,sha=m.read(); m.mutate(lambda s:c.control(s,'stop'))
        with self.assertRaises(RuntimeError): m.write(a,sha)
        self.assertTrue(m.s['stopped'])

    def test_fixture_exit_zero_does_not_imply_done(self):
        # A real OS subprocess emits no turn.completed; this must remain unfinished.
        with tempfile.TemporaryDirectory() as d:
            s=c.empty(); c.add(s,job()); j=s['jobs']['provider']
            j.update(status='running',attempt=1,base='base',checkpoint='base',branch='dedicated')
            s['lease']=dict(owner='mine',until=time.time()+90)
            m=Memory(s); sup=object.__new__(c.Supervisor)
            sup.store=m; sup.owner='mine'; sup.ttl=90; sup.runtime=Path(d)
            path=Path(d); log=open(path/'provider-1.jsonl','w'); err=open(path/'provider-1.stderr','w')
            p=subprocess.Popen(['python','-c','print("{}")'],stdout=log,stderr=err,start_new_session=True)
            p.wait(); sup.live={'provider':(p,log,err,path,time.monotonic())}
            sup.checkpoint=lambda *_:'base'
            sup.tick(dispatch=False)
            self.assertEqual(m.s['jobs']['provider']['status'],'blocked')
            self.assertFalse(m.s['jobs']['provider']['last_result']['turn_completed'])

    def test_real_process_interrupt_is_paused(self):
        with tempfile.TemporaryDirectory() as d:
            s=c.empty(); c.add(s,job()); s['jobs']['provider'].update(status='interrupting',attempt=1,base='base',checkpoint='base')
            s['lease']=dict(owner='mine',until=time.time()+90)
            m=Memory(s); sup=object.__new__(c.Supervisor)
            sup.store=m; sup.owner='mine'; sup.ttl=90; sup.runtime=Path(d)
            path=Path(d); log=open(path/'provider-1.jsonl','w'); err=open(path/'provider-1.stderr','w')
            p=subprocess.Popen(['python','-c','import time; time.sleep(60)'],stdout=log,stderr=err,start_new_session=True)
            sup.live={'provider':(p,log,err,path,time.monotonic())}; sup.checkpoint=lambda *_:'base'
            sup.tick(dispatch=False)
            self.assertIsNotNone(p.poll()); self.assertEqual(m.s['jobs']['provider']['status'],'paused')

class CompletionTests(unittest.TestCase):
    def finish(self, verify, notices=None, launch_ids=None, conflict=False):
        with tempfile.TemporaryDirectory() as d:
            s=c.empty(); c.add(s,job()); j=s['jobs']['provider']
            j.update(status='running',attempt=1,base='base',checkpoint='base',branch='dedicated',notice_ids=launch_ids or [])
            s['notices']=notices or {}; s['lease']=dict(owner='mine',until=time.time()+90)
            m=Memory(s); sup=object.__new__(c.Supervisor)
            sup.store=m; sup.owner='mine'; sup.ttl=90; sup.runtime=Path(d)
            path=Path(d); log=open(path/'provider-1.jsonl','w'); err=open(path/'provider-1.stderr','w')
            p=subprocess.Popen(['python','-c','print(\'{"type":"turn.completed"}\')'],stdout=log,stderr=err,start_new_session=True)
            p.wait(); sup.live={'provider':(p,log,err,path,time.monotonic())}
            sup.checkpoint=lambda *_:'base'
            m.s['jobs']['provider']['verify']=verify
            if conflict:
                original=m.write
                def race(state,sha):
                    m.s['stopped']=True; m.n+=1; m.write=original
                    raise c.StateConflict('test concurrent owner stop')
                m.write=race
                with self.assertRaises(c.StateConflict): sup.tick(dispatch=False)
                self.assertIn('provider',sup.live)
            sup.tick(dispatch=False)
            return m.s

    def test_completed_marker_with_failed_acceptance_is_unfinished(self):
        s=self.finish(['python','-c','raise SystemExit(1)'])
        self.assertEqual(s['jobs']['provider']['status'],'blocked')
        self.assertTrue(s['jobs']['provider']['last_result']['turn_completed'])
        self.assertFalse(s['jobs']['provider']['last_result']['verified'])

    def test_completed_fixture_requires_acceptance(self):
        s=self.finish(['python','-c','assert 6*7==42'])
        self.assertEqual(s['jobs']['provider']['status'],'done')
        self.assertTrue(s['jobs']['provider']['last_result']['verified'])

    def test_new_inflight_notice_is_not_acknowledged(self):
        old=dict(provider='upstream',user='provider',commit='old',status='pending')
        new=dict(provider='upstream',user='provider',commit='new',status='pending')
        s=self.finish(['python','-c','pass'],{'old':old,'new':new},['old'])
        self.assertEqual(s['notices']['old']['status'],'delivered-and-completed')
        self.assertEqual(s['notices']['new']['status'],'pending')
        self.assertEqual(s['jobs']['provider']['status'],'ready')

    def test_concurrent_stop_is_preserved_on_result_retry(self):
        s=self.finish(['python','-c','pass'],conflict=True)
        self.assertTrue(s['stopped'])
        self.assertEqual(s['jobs']['provider']['status'],'paused')

    def test_watchdog_restarts_real_failed_process(self):
        ws=importlib.util.spec_from_file_location('watch',Path(__file__).with_name('watch.py'))
        w=importlib.util.module_from_spec(ws); ws.loader.exec_module(w)
        with tempfile.TemporaryDirectory() as d:
            marker=Path(d)/'marker'
            code='from pathlib import Path; import sys; p=Path(sys.argv[1]); existed=p.exists(); p.touch(); sys.exit(0 if existed else 1)'
            self.assertEqual(w.watch(['python','-c',code,str(marker)],delay=0,max_restarts=1),0)


if __name__=='__main__': unittest.main(verbosity=2)
