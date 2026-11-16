"""Host policy and subprocess fixtures; these are NOT successful Codex inference."""
import copy
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

import coordinator as c
import roles as r
from test_coordinator import Memory


def action(kind, target, text='Bootstrap rehearsal', timeout=180):
    return dict(kind=kind,target=target,text=text,timeout=timeout)


def packet(*actions):
    return dict(summary='Explicit fixture packet, not Codex output',actions=list(actions))


class RoleTests(unittest.TestCase):
    def state(self):
        s=c.empty(); r.enroll(s,'ROOT','test entry'); return s

    def test_root_starts_configures_and_replaces_subordinates(self):
        s=self.state()
        r.apply(s,'ROOT',packet(*(action('start',n) for n in ('ARCH','coordinator','watcher'))))
        r.apply(s,'ROOT',packet(action('configure','ARCH',timeout=300)))
        self.assertEqual(s['role_sessions']['ARCH']['timeout'],300)
        s['role_sessions']['ARCH']['status']='blocked'
        r.apply(s,'ROOT',packet(action('replace','ARCH')))
        self.assertEqual(s['role_sessions']['ARCH']['generation'],2)
        self.assertEqual(s['role_sessions']['ARCH']['status'],'ready')

    def test_watcher_takeover_preserves_stop_and_no_self_successor(self):
        s=self.state(); s['role_sessions']['ROOT']['status']='blocked'
        r.apply(s,'watcher',packet(action('replace','ROOT')))
        self.assertEqual(s['role_sessions']['ROOT']['generation'],2)
        for actor in r.ROLES:
            with self.assertRaises(ValueError): r.apply(s,actor,packet(action('replace',actor)))
        s['stopped']=True
        with self.assertRaises(ValueError): r.apply(s,'ROOT',packet(action('start','ARCH')))

    def test_process_request_routing_and_live_replacement_refusal(self):
        s=self.state()
        with self.assertRaises(ValueError): r.apply(s,'ROOT',packet(action('start','PROCESS')))
        r.apply(s,'ARCH',packet(action('message','ROOT',text='ordinary report')))
        with self.assertRaises(ValueError): r.apply(s,'ROOT',packet(action('start','PROCESS')))
        r.apply(s,'ARCH',packet(action('request-process','ROOT',text='Start PROCESS for process fault')))
        r.apply(s,'ROOT',packet(action('start','PROCESS')))
        s['role_sessions']['PROCESS']['status']='running'
        with self.assertRaises(ValueError): r.apply(s,'ROOT',packet(action('replace','PROCESS')))
        with self.assertRaises(ValueError): r.apply(s,'ARCH',packet(action('message','PROCESS')))

    def test_no_completed_inference_no_packet(self):
        with self.assertRaises(ValueError): r.response('{"type":"turn.failed"}')

    def test_expired_host_wakes_parent_without_self_replacement(self):
        s=self.state(); r.enroll(s,'watcher','fixture standby')
        s['role_sessions']['ROOT']['status']='running'
        s['role_sessions']['watcher']['next_wake']=99999999999
        s['role_lease']=dict(owner='lost-host',until=0)
        r.recover(s)
        self.assertEqual(s['role_sessions']['ROOT']['status'],'blocked')
        self.assertEqual(s['role_sessions']['ROOT']['generation'],1)
        self.assertEqual(s['role_sessions']['watcher']['next_wake'],0)
        self.assertIsNone(s['role_lease'])

    def test_fixture_turn_and_fresh_runtime_reconstruct(self):
        s=self.state(); store=Memory(s)
        output='\n'.join(json.dumps(e) for e in [
            dict(type='thread.started',thread_id='fixture-not-real-codex'),
            dict(type='item.completed',item=dict(type='agent_message',text=json.dumps(packet(action('start','ARCH'))))),
            dict(type='turn.completed')])
        real_popen=r.subprocess.Popen
        def fixture(argv,**kw):
            actual=output if 'bootstrap ROOT role' in argv[-1] else output.replace(
                json.dumps(packet(action('start','ARCH'))).replace('"','\\"'),
                json.dumps(packet()).replace('"','\\"'))
            return real_popen([sys.executable,'-c','print('+repr(actual)+')'],**kw)
        with tempfile.TemporaryDirectory() as td, patch.object(c,'auth',return_value={}), \
             patch.object(c,'run',return_value='https://github.com/'+c.REPO+'.git'), \
             patch.object(r.subprocess,'Popen',side_effect=fixture):
            requirements=Path(td)/'bootstrap/REQUIREMENTS.md'
            requirements.parent.mkdir(); requirements.write_text('Fixture requirements')
            r.Runtime(store,td,Path(td)/'first').turn('ROOT')
            self.assertIn('ARCH',store.s['role_sessions'])
            self.assertEqual(store.s['role_sessions']['ROOT']['thread_id'],'fixture-not-real-codex')
            r.Runtime(store,td,Path(td)/'second').turn('ARCH')
            self.assertIsNone(store.s['role_lease'])
            self.assertEqual(store.s['role_sessions']['ARCH']['status'],'ready')

    def test_invalid_packet_rolls_back_all_actions(self):
        s=self.state(); store=Memory(s)
        original=copy.deepcopy(s)
        bad=packet(action('start','ARCH'),action('replace','ROOT'))
        with self.assertRaises(ValueError): store.mutate(lambda s:r.apply(s,'ROOT',bad))
        self.assertEqual(store.s,original)

    def test_failed_subprocess_cannot_launch_children(self):
        store=Memory(self.state()); real_popen=r.subprocess.Popen
        def fixture(argv,**kw):
            return real_popen([sys.executable,'-c',
                'print(\'{"type":"turn.failed"}\'); raise SystemExit(1)'],**kw)
        with tempfile.TemporaryDirectory() as td, patch.object(c,'auth',return_value={}), \
             patch.object(c,'run',return_value='https://github.com/'+c.REPO+'.git'), \
             patch.object(r.subprocess,'Popen',side_effect=fixture):
            req=Path(td)/'bootstrap/REQUIREMENTS.md'; req.parent.mkdir(); req.write_text('Fixture')
            r.Runtime(store,td,Path(td)/'runtime').turn('ROOT')
        self.assertEqual(set(store.s['role_sessions']),{'ROOT'})
        self.assertEqual(store.s['role_sessions']['ROOT']['status'],'blocked')
        self.assertIsNone(store.s['role_lease'])


if __name__=='__main__': unittest.main()
