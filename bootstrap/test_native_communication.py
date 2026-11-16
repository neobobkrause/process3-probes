"""Mailbox fixtures; actual native timing receipts are separate evidence."""
import unittest
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

if __name__=='__main__': unittest.main()
