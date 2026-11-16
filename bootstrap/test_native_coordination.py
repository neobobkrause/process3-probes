"""Owner-word/forwarding fixtures, not invented owner approvals or source receipts."""
import copy
import json
import unittest
from native import coordination,layout,communication

class CoordinationTests(unittest.TestCase):
    def state(self):
        s={'stopped':True,'stop_source':'owner','slots':1,'owner_job_cap':2,
           'jobs':{'web':{'status':'paused'}},'native_roles':{'COORDINATOR':{'target':'/root/root_role/coord','generation':3}}}
        layout.adopt(s,'fixture approval');return s
    def packet(self,s,**kwargs):
        return coordination.plan_owner_message(s,actor='/root',text='What happened?\nJust answer.',kind='question',message_id='question1',**kwargs)
    def test_question_exact_local_forward_cannot_build_or_write_owner_records(self):
        s=self.state();old=copy.deepcopy(s);p=self.packet(s)
        self.assertEqual(json.loads(p['message']['text'])['verbatim'],'What happened?\nJust answer.')
        self.assertFalse(p['durable_record_required']);self.assertFalse(p['build_authorized_by_forwarding'])
        m=communication.empty();communication.register(m,'COORDINATOR','/root/root_role/coord',3)
        communication.enqueue(m,**p['message'])
        self.assertEqual(communication.delivery_intent(m,'question1','idle')['target'],'/root/root_role/coord')
        with self.assertRaises(PermissionError):coordination.record_owner_words(s,actor='/root/root_role/coord',envelope=p['envelope'],observed_at=1,source_evidence='fixture actual question')
        self.assertEqual(s,old)
    def test_only_console_and_current_coordinator_can_forward_and_record(self):
        s=self.state()
        with self.assertRaises(layout.InvalidLayout):coordination.plan_owner_message(s,actor='/root/job',text='x',kind='question',message_id='x')
        with self.assertRaises(layout.InvalidLayout):self.packet(s,expected_generation=2)
        with self.assertRaises(PermissionError):coordination.plan_owner_message(s,actor='/root',text='doit',kind='instruction',message_id='x')
    def test_marked_words_are_exact_idempotent_and_do_not_change_controls(self):
        s=self.state();old=copy.deepcopy(s);text='Keep HOLD.\n  exact whitespace\nUnicode: café'
        p=coordination.plan_owner_message(s,actor='/root',text=text,kind='instruction',message_id='owner1',marked=True)
        self.assertTrue(coordination.record_owner_words(s,actor='/root/root_role/coord',envelope=p['envelope'],observed_at=10,source_evidence='fixture observed console source'))
        self.assertEqual(s['owner_records']['owner1']['text'],text)
        self.assertFalse(coordination.record_owner_words(s,actor='/root/root_role/coord',envelope=p['envelope'],observed_at=11,source_evidence='fixture observed console source'))
        self.assertEqual({k:s[k] for k in old},old)
        p['envelope']['verbatim']='different'
        with self.assertRaises(ValueError):coordination.record_owner_words(s,actor='/root/root_role/coord',envelope=p['envelope'],observed_at=12,source_evidence='fixture observed console source')
    def test_stale_coordinator_and_invalid_source_are_rejected(self):
        s=self.state();p=coordination.plan_owner_message(s,actor='/root',text='exact',kind='decision',message_id='d',marked=True)
        with self.assertRaises(layout.InvalidLayout):coordination.record_owner_words(s,actor='/root/oldcoord',envelope=p['envelope'],observed_at=1,source_evidence='fixture')
        p['envelope']['source']='agent assertion'
        with self.assertRaises(PermissionError):coordination.record_owner_words(s,actor='/root/root_role/coord',envelope=p['envelope'],observed_at=1,source_evidence='fixture')
    def test_unknown_input_and_oversize_fail_without_native_intent(self):
        s=self.state()
        for values in ({'kind':'approve_grants','text':'x'},{'kind':'question','text':'x'*17000},{'kind':'question','text':''}):
            with self.assertRaises(ValueError):coordination.plan_owner_message(s,actor='/root',message_id='x',**values)
