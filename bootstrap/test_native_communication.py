"""Mailbox fixtures; actual native timing receipts are separate evidence."""
import unittest
import tempfile
import json
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from native import communication as m

class MailboxTests(unittest.TestCase):
    def state(self):
        state=m.empty(); m.register(state,'ARCH','/root/arch',1); return state
    def test_idle_wake_and_active_delivery_are_different(self):
        state=self.state(); key=m.enqueue(state,'ROOT','ARCH','work', 'one')
        self.assertEqual(m.delivery_intent(state,key,'idle')['tool'],'followup_task')
        self.assertEqual(m.delivery_intent(state,key,'running')['tool'],'followup_task')
        self.assertEqual(m.delivery_intent(state,key,'running')['observed_activity'],'running')
    def test_active_to_idle_race_cannot_select_nonwaking_send(self):
        state=self.state(); key=m.enqueue(state,'ROOT','ARCH','work')
        intent=m.delivery_intent(state,key,'running')
        self.assertEqual(intent['tool'],'followup_task')
        bad={**intent,'tool':'send_message'}
        with self.assertRaises(ValueError): m.record_delivery(state,bad)

    def test_replacement_redelivers_unacknowledged_message(self):
        state=self.state(); key=m.enqueue(state,'ROOT','ARCH','work','one')
        old=m.delivery_intent(state,key,'running'); m.record_delivery(state,old)
        m.register(state,'ARCH','/root/new-arch',2)
        new=m.delivery_intent(state,key,'idle')
        self.assertEqual(new['target'],'/root/new-arch'); self.assertEqual(new['message_id'],key)
        with self.assertRaises(m.StaleRecipient): m.acknowledge(state,key,old['target'],1,0)
        self.assertTrue(m.acknowledge(state,key,new['target'],2,1))
        self.assertFalse(m.acknowledge(state,key,new['target'],2,2))
        self.assertIsNone(m.delivery_intent(state,key,'idle'))
    def test_pending_survives_delivery_and_new_messages(self):
        state=self.state(); key=m.enqueue(state,'ROOT','ARCH','work','one')
        m.record_delivery(state,m.delivery_intent(state,key,'idle'))
        second=m.enqueue(state,'ROOT','ARCH','next','two')
        m.acknowledge(state,key,'/root/arch',1,0)
        self.assertEqual(m.pending_for(state,'ARCH'),(second,))
    def test_idempotence_does_not_merge_different_messages(self):
        state=self.state(); m.enqueue(state,'ROOT','ARCH','work','one')
        self.assertEqual(m.enqueue(state,'ROOT','ARCH','work','one'),'one')
        with self.assertRaises(ValueError): m.enqueue(state,'ROOT','ARCH','other','one')
    def test_unknown_activity_and_generation_fail_closed(self):
        state=self.state(); key=m.enqueue(state,'ROOT','ARCH','work')
        with self.assertRaises(ValueError): m.delivery_intent(state,key,'unknown')
        with self.assertRaises(m.StaleRecipient): m.register(state,'ARCH','other',1)

class LocalMailboxTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup)
        self.path=Path(self.temp.name)/'operational'/'mailbox.json'
        self.box=m.LocalMailbox(self.path)
        self.box.mutate(lambda s:m.register(s,'ARCH','/root/arch',1))

    def test_atomic_reopen_and_byte_backpressure_keep_existing_pending_work(self):
        self.box.mutate(lambda s:m.enqueue(s,'ROOT','ARCH','must survive','one'))
        before=self.path.read_bytes()
        tiny=m.LocalMailbox(self.path,max_bytes=len(before)+5)
        with self.assertRaises(m.MailboxFull):tiny.mutate(lambda s:m.enqueue(s,'ROOT','ARCH','extra text beyond the limit','two'))
        self.assertEqual(self.path.read_bytes(),before)
        self.assertEqual(m.LocalMailbox(self.path).read()['messages']['one']['text'],'must survive')
        self.assertEqual(self.path.stat().st_mode&0o777,0o600)
        self.assertFalse(list(self.path.parent.glob('.mailbox-*')))

    def test_admission_reserves_room_for_delivery_and_receipt_progress(self):
        path=Path(self.temp.name)/'tight.json';box=m.LocalMailbox(path,max_bytes=20000)
        box.mutate(lambda s:m.register(s,'ARCH','/root/'+'a'*240,1))
        box.mutate(lambda s:m.enqueue(s,'ROOT','ARCH','x'*8192,'accepted'))
        before=path.read_bytes()
        with self.assertRaisesRegex(m.MailboxFull,'reserve'):
            box.mutate(lambda s:m.enqueue(s,'ROOT','ARCH','another','backpressure'))
        self.assertEqual(path.read_bytes(),before)
        for _ in range(20):
            box.mutate(lambda s:m.record_delivery(s,m.delivery_intent(s,'accepted','idle')))
        def receipt(s):
            m.acknowledge(s,'accepted',s['recipients']['ARCH']['target'],1,1)
            s['messages']['accepted']['ack']['receipt']='r'*1024
        box.mutate(receipt)
        final=box.read()['messages']['accepted']
        self.assertEqual(final['status'],'acknowledged');self.assertEqual(final['text'],'x'*8192)
        self.assertLess(path.stat().st_size,20000)
        self.assertEqual(final['delivery_count'],20)
        self.assertEqual(len(final['deliveries']),m.MAX_DELIVERIES)

    def test_expired_ack_cleanup_reclaims_file_on_next_read(self):
        state=self.box.read();key=m.enqueue(state,'ROOT','ARCH','temporary','expired')
        m.acknowledge(state,key,'/root/arch',1,1)
        state['messages'][key]['ack']['recorded_at']=1
        self.path.write_text(json.dumps(state)) # Fixture simulates an idle snapshot aging.
        self.assertFalse(self.box.read()['messages'])
        self.assertFalse(json.loads(self.path.read_text())['messages'])

    def test_serialized_writers_do_not_lose_messages(self):
        def write(number):m.LocalMailbox(self.path).mutate(lambda s:m.enqueue(s,'ROOT','ARCH','work',str(number)))
        with ThreadPoolExecutor(max_workers=8) as pool:list(pool.map(write,range(80)))
        self.assertEqual(len(self.box.read()['messages']),80)

    def test_pending_count_is_bounded_without_silent_loss(self):
        state=self.box.read()
        for number in range(m.MAX_MESSAGES):m.enqueue(state,'ROOT','ARCH','work',str(number))
        with self.assertRaises(m.MailboxFull):m.enqueue(state,'ROOT','ARCH','work','overflow')
        self.assertEqual(len(state['messages']),m.MAX_MESSAGES)
        with self.assertRaises(m.MailboxFull):m.enqueue(self.box.read(),'ROOT','ARCH','x'*(m.MAX_TEXT_BYTES+1))

    def test_acknowledgements_and_delivery_history_are_bounded(self):
        state=self.box.read()
        for number in range(1000):
            key=m.enqueue(state,'ROOT','ARCH','work',str(number))
            for _ in range(20):m.record_delivery(state,m.delivery_intent(state,key,'idle'))
            self.assertEqual(len(state['messages'][key]['deliveries']),m.MAX_DELIVERIES)
            m.acknowledge(state,key,'/root/arch',1,1)
        m.compact(state)
        self.assertLessEqual(len(state['messages']),m.MAX_ACKNOWLEDGED)
        for value in state['messages'].values():value['ack']['recorded_at']=1
        m.compact(state,now=m.ACK_RETENTION_SECONDS+2)
        self.assertFalse(state['messages'])

    def test_legacy_seed_is_read_once_and_does_not_need_remote_after_restart(self):
        calls=[]
        path=Path(self.temp.name)/'migration.json'
        def seed():
            calls.append('read legacy');state=m.empty();m.register(state,'ARCH','/root/arch',1)
            m.enqueue(state,'ROOT','ARCH','pending','one');return state
        first=m.LocalMailbox(path,seed);first.read()
        reopened=m.LocalMailbox(path,lambda:(_ for _ in ()).throw(AssertionError('remote queried again')))
        reopened.mutate(lambda s:m.enqueue(s,'ROOT','ARCH','next','two'))
        self.assertEqual(set(reopened.read()['messages']),{'one','two'});self.assertEqual(calls,['read legacy'])

if __name__=='__main__': unittest.main()
