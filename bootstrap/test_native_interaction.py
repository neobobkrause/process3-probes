"""Component behavior fixtures; actual native reactivation is separately observed."""
import copy
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from native import interaction as i

class InteractionTests(unittest.TestCase):
    def state(self):
        s=i.empty();i.bind(s,'ARCH','/root/retained/arch',5,conversation_id='stable-arch');return s

    def test_turn_assignment_idle_and_retirement_are_distinct(self):
        s=self.state()
        i.event(s,'ARCH','assignment_started',generation=5,assignment_id='design',evidence='actual assignment')
        i.event(s,'ARCH','turn_started',generation=5,evidence='actual processing')
        i.event(s,'ARCH','turn_completed',generation=5,evidence='native completed')
        r=i.capsule(s,'ARCH');self.assertEqual(r['assignment']['status'],'active')
        self.assertEqual(r['disposition'],'retained');self.assertEqual(r['lifecycle'],'retained_idle')
        i.event(s,'ARCH','assignment_completed',generation=5,assignment_id='design',evidence='actual deliverable')
        self.assertEqual(i.delivery_intent(s,'ARCH','completed','new question')['tool'],'followup_task')
        i.event(s,'ARCH','assignment_started',generation=5,assignment_id='new assignment',evidence='new task')
        self.assertEqual(i.capsule(s,'ARCH')['assignment']['status'],'active')

    def test_acked_question_survives_idle_and_session_replacement(self):
        s=self.state();i.ask(s,'ARCH','q1','Why choose the current interface?',provenance='proxy-test')
        i.acknowledge(s,'ARCH','q1',generation=5,evidence='first processing receipt')
        i.event(s,'ARCH','turn_completed',generation=5,evidence='native FINAL says done')
        i.remember(s,'ARCH',decision='Preserve report dependency injection')
        i.remember(s,'ARCH',reference='design/interface-contract.json')
        i.bind(s,'ARCH','/root/new/arch',6)
        r=i.capsule(s,'ARCH');self.assertEqual(r['conversation_id'],'stable-arch')
        self.assertIn('q1',r['pending_questions']);self.assertFalse(r['answered'])
        self.assertEqual(r['pending_questions']['q1']['receipts'][0]['generation'],5)
        self.assertEqual(r['decisions'],['Preserve report dependency injection'])
        i.answer(s,'ARCH','q1','Independent module ownership requires a frozen interface.',generation=6,
                 provenance='observed-native-reply',evidence='actual correlated native reply')
        self.assertFalse(i.capsule(s,'ARCH')['pending_questions'])
        self.assertEqual(i.capsule(s,'ARCH')['answered'][0]['question_provenance'],'proxy-test')

    def test_native_inventory_absence_probes_known_session_without_replacement(self):
        s=self.state();before=copy.deepcopy(s)
        intent=i.delivery_intent(s,'ARCH','retained_unlisted','Substantive follow-up')
        self.assertEqual(intent['tool'],'followup_task')
        self.assertEqual(intent['arguments']['target'],'/root/retained/arch')
        self.assertEqual(s,before)
        for activity in ('unknown','unavailable','interrupted'):
            self.assertEqual(i.delivery_intent(s,'ARCH',activity,'Check availability')['action'],'hold')
        self.assertEqual(s,before)

    def test_all_supported_available_states_use_atomic_wake_or_steer(self):
        s=self.state()
        for activity in ('idle','completed','running','retained_unlisted'):
            self.assertEqual(i.delivery_intent(s,'ARCH',activity,'next turn')['tool'],'followup_task')

    def test_explicit_retirement_preserves_unanswered_questions_and_refuses_rebind(self):
        s=self.state();i.ask(s,'ARCH','pending','Unanswered?',provenance='role-question')
        i.retire(s,'ARCH',generation=5,reason='explicit role retirement',source='observed supervisory decision',evidence='actual record')
        r=i.capsule(s,'ARCH');self.assertEqual(r['disposition'],'retired');self.assertIn('pending',r['pending_questions'])
        self.assertEqual(i.delivery_intent(s,'ARCH','completed','new message')['action'],'hold')
        with self.assertRaises(ValueError):i.bind(s,'ARCH','/root/new/arch',6)
        with self.assertRaises(ValueError):i.retire(self.state(),'ARCH',generation=5,reason='reason',source='',evidence='record')

    def test_obsolete_generation_cannot_answer_or_ack_or_finish_new_session(self):
        s=self.state();i.ask(s,'ARCH','q','Question',provenance='observed-owner-input');i.bind(s,'ARCH','/root/new/arch',6)
        before=copy.deepcopy(s)
        actions=[lambda:i.acknowledge(s,'ARCH','q',generation=5,evidence='old ACK'),
                 lambda:i.answer(s,'ARCH','q','old answer',generation=5,provenance='observed-native-reply',evidence='old reply'),
                 lambda:i.event(s,'ARCH','turn_completed',generation=5,evidence='old completion')]
        for action in actions:
            with self.assertRaises(i.StaleSession):action()
            self.assertEqual(s,before)

    def test_stable_conversation_rejects_identity_change_and_stale_binding(self):
        s=self.state();before=copy.deepcopy(s)
        for generation,identity in ((6,'different'),(4,None),(True,None)):
            with self.assertRaises((ValueError,i.StaleSession)):
                i.bind(s,'ARCH','/root/new/arch',generation,conversation_id=identity)
            self.assertEqual(s,before)
        i.bind(s,'ARCH','/root/retained/arch',5,conversation_id='stable-arch');self.assertEqual(s,before)

    def test_recovery_checkpoint_contains_knowledge_and_pending_not_routine_history(self):
        s=self.state();i.remember(s,'ARCH',decision='Preserve existing branch')
        i.remember(s,'ARCH',reference='evidence/path')
        i.ask(s,'ARCH','answered','First turn',provenance='proxy-test')
        i.answer(s,'ARCH','answered','Completed substantive reply',generation=5,provenance='observed-native-reply',evidence='receipt')
        i.ask(s,'ARCH','pending','Still unanswered',provenance='observed-owner-input')
        i.acknowledge(s,'ARCH','pending',generation=5,evidence='ACK only')
        r=i.recovery_snapshot(s)['roles']['ARCH']
        self.assertEqual(set(r),{'conversation_id','disposition','assignment','decisions','references','pending_questions'})
        self.assertEqual(set(r['pending_questions']['pending']),{'id','text','provenance'})
        encoded=json.dumps(r);self.assertNotIn('ACK only',encoded);self.assertNotIn('Completed substantive reply',encoded)
        self.assertNotIn('/root/retained/arch',encoded)

    def test_capacity_failure_never_discards_pending_obligations(self):
        s=self.state()
        with patch.object(i,'MAX_PENDING',1):
            i.ask(s,'ARCH','first','Keep this pending',provenance='proxy-test');before=copy.deepcopy(s)
            with self.assertRaises(i.InteractionFull):i.ask(s,'ARCH','second','Cannot evict first',provenance='proxy-test')
            self.assertEqual(s,before)
        with patch.object(i,'MAX_BYTES',1):
            with self.assertRaises(i.InteractionFull):i.remember(s,'ARCH',decision='Cannot replace old state')
            self.assertEqual(s,before)

    def test_pending_admission_reserves_room_for_substantive_answer(self):
        s=self.state()
        with patch.object(i,'MAX_BYTES',i.PENDING_ANSWER_RESERVE+1400):
            i.ask(s,'ARCH','q','A pending question',provenance='proxy-test')
            before=copy.deepcopy(s)
            with self.assertRaises(i.InteractionFull):
                i.ask(s,'ARCH','second','Cannot consume answer reserve',provenance='proxy-test')
            self.assertEqual(s,before)
            i.answer(s,'ARCH','q','a'*i.MAX_TEXT_BYTES,generation=5,
                     provenance='observed-native-reply',evidence='e'*i.MAX_TEXT_BYTES)
            self.assertFalse(i.capsule(s,'ARCH')['pending_questions'])

    def test_important_decisions_are_not_silently_evicted(self):
        s=self.state()
        with patch.object(i,'MAX_DECISIONS',1):
            i.remember(s,'ARCH',decision='Important retained decision');before=copy.deepcopy(s)
            i.remember(s,'ARCH',decision='Important retained decision');self.assertEqual(s,before)
            with self.assertRaises(i.InteractionFull):i.remember(s,'ARCH',decision='Must explicitly revise capsule')
            self.assertEqual(s,before)

    def test_question_idempotence_and_provenance_are_explicit(self):
        s=self.state();i.ask(s,'ARCH','q','Proxy question',provenance='proxy-test');before=copy.deepcopy(s)
        i.ask(s,'ARCH','q','Proxy question',provenance='proxy-test');self.assertEqual(s,before)
        with self.assertRaises(ValueError):i.ask(s,'ARCH','q','Changed words',provenance='observed-owner-input')
        with self.assertRaises(ValueError):i.ask(s,'ARCH','new','Question',provenance='owner-probably')
        self.assertEqual(s,before)
        with self.assertRaises(KeyError):i.answer(s,'ARCH','unknown','Cannot correlate',generation=5,provenance='observed-native-reply',evidence='actual reply')
        self.assertEqual(s,before)

    def test_assignment_identity_and_nonempty_answer_required(self):
        s=self.state();i.event(s,'ARCH','assignment_started',generation=5,assignment_id='a',evidence='task')
        before=copy.deepcopy(s)
        with self.assertRaises(ValueError):i.event(s,'ARCH','assignment_completed',generation=5,assignment_id='b',evidence='wrong task')
        with self.assertRaises(ValueError):i.event(s,'ARCH','assignment_started',generation=5,assignment_id='b',evidence='replacement task')
        with self.assertRaises(ValueError):i.event(s,'ARCH','session_retired',generation=5,evidence='native completed')
        self.assertEqual(s,before)

    def test_recovery_import_unbound_then_actual_rebind_preserves_pending_assignment(self):
        s=self.state();i.event(s,'ARCH','assignment_started',generation=5,assignment_id='ongoing',evidence='task')
        i.ask(s,'ARCH','pending','Please answer after replacement',provenance='proxy-test')
        i.acknowledge(s,'ARCH','pending',generation=5,evidence='ACK not answer')
        recovered=i.empty();i.restore_snapshot(recovered,i.recovery_snapshot(s))
        r=i.capsule(recovered,'ARCH');self.assertIsNone(r['binding'])
        self.assertEqual(r['assignment'],{'id':'ongoing','status':'active'})
        self.assertEqual(i.delivery_intent(recovered,'ARCH','retained_unlisted','follow up')['action'],'hold')
        with self.assertRaises(i.StaleSession):i.acknowledge(recovered,'ARCH','pending',generation=5,evidence='no actual binding')
        i.bind(recovered,'ARCH','/root/new/arch',6)
        self.assertEqual(i.capsule(recovered,'ARCH')['conversation_id'],'stable-arch')
        self.assertIn('pending',i.capsule(recovered,'ARCH')['pending_questions'])
        i.answer(recovered,'ARCH','pending','Substantive answer from actual new context',generation=6,
                 provenance='observed-native-reply',evidence='actual reply')
        self.assertFalse(i.capsule(recovered,'ARCH')['pending_questions'])

    def test_recovery_import_preserves_explicit_retirement(self):
        s=self.state();i.retire(s,'ARCH',generation=5,reason='deliberate',source='observed decision',evidence='record')
        recovered=i.empty();i.restore_snapshot(recovered,i.recovery_snapshot(s))
        self.assertEqual(i.capsule(recovered,'ARCH')['disposition'],'retired')
        with self.assertRaises(ValueError):i.bind(recovered,'ARCH','/root/new/arch',6)
        self.assertEqual(i.delivery_intent(recovered,'ARCH','retained_unlisted','message')['action'],'hold')

    def test_recovery_import_schema_capacity_and_collision_fail_atomically(self):
        snapshot=i.recovery_snapshot(self.state())
        invalid=[]
        x=copy.deepcopy(snapshot);x['roles']['ARCH']['binding']={'target':'invented'};invalid.append(x)
        x=copy.deepcopy(snapshot);x['roles']['ARCH']['disposition']='completed';invalid.append(x)
        x=copy.deepcopy(snapshot);x['roles']['ARCH']['pending_questions']={'q':{'id':'different','text':'Q','provenance':'proxy-test'}};invalid.append(x)
        x=copy.deepcopy(snapshot);x['roles']['ARCH']['decisions']=['same','same'];invalid.append(x)
        x=copy.deepcopy(snapshot);x['roles']['ARCH']['disposition']='retired';invalid.append(x)
        x=copy.deepcopy(snapshot);x['version']=True;invalid.append(x)
        for value in invalid:
            recovered=i.empty();before=copy.deepcopy(recovered)
            with self.assertRaises((ValueError,i.InteractionFull)):i.restore_snapshot(recovered,value)
            self.assertEqual(recovered,before)
        original=self.state();before=copy.deepcopy(original)
        with self.assertRaises(ValueError):i.restore_snapshot(original,snapshot)
        self.assertEqual(original,before)
        with patch.object(i,'MAX_BYTES',1):
            recovered=i.empty()
            with self.assertRaises(i.InteractionFull):i.restore_snapshot(recovered,snapshot)
            self.assertEqual(recovered,i.empty())

    def test_local_store_atomic_failure_and_reload_continuity(self):
        with tempfile.TemporaryDirectory() as d:
            path=Path(d)/'operational'/'interactions.json';store=i.LocalInteraction(path)
            self.assertEqual(store.read(),i.empty());self.assertFalse(path.exists())
            store.mutate(lambda s:i.bind(s,'COORDINATOR','/root/root/coord',1,conversation_id='coordinator'))
            store.mutate(lambda s:i.ask(s,'COORDINATOR','q','Keep pending across file reload',provenance='proxy-test'))
            previous=path.read_bytes()
            def fail(s):
                s['roles'].clear();raise RuntimeError('aborted transaction')
            with self.assertRaises(RuntimeError):store.mutate(fail)
            self.assertEqual(path.read_bytes(),previous)
            loaded=i.LocalInteraction(path).read();i.bind(loaded,'COORDINATOR','/root/new/coord',2)
            self.assertIn('q',i.capsule(loaded,'COORDINATOR')['pending_questions'])
            self.assertEqual(path.stat().st_mode & 0o777,0o600)

if __name__=='__main__':unittest.main()
