import tempfile
import unittest
from pathlib import Path
from native.communication import LocalMailbox
from native.interaction import LocalInteraction, StaleSession
from native.owner_dialogue import OwnerDialogue


class OwnerDialogueTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.root=Path(self.temp.name)
        self.adapter=OwnerDialogue(LocalInteraction(self.root/'interaction.json'),LocalMailbox(self.root/'mailbox.json'))
        self.adapter.bind('ARCH','/root/supervisor/arch',1,evidence='actual READY',conversation_id='stable-ARCH')
    def tearDown(self):self.temp.cleanup()

    def test_multiple_owner_turns_reactivate_retained_completed_assignment(self):
        self.adapter.lifecycle('ARCH','assignment_started',generation=1,assignment_id='initial',evidence='actual assignment')
        self.adapter.lifecycle('ARCH','assignment_completed',generation=1,assignment_id='initial',evidence='actual completion')
        self.adapter.lifecycle('ARCH','turn_completed',generation=1,evidence='actual final')
        first=self.adapter.request('ARCH','q1','Explain the CSV design.',provenance='observed-owner-input',activity='completed')
        self.assertEqual(first['tool'],'followup_task')
        self.assertFalse(first['envelope']['build_authorized_by_forwarding'])
        self.adapter.reply('ARCH','q1','Fixed integer-cent columns avoid rounding ambiguity.',generation=1,evidence='actual native reply')
        second=self.adapter.request('ARCH','q2','What happens with invalid quantities?',provenance='observed-owner-input',activity='retained_unlisted')
        self.assertEqual(second['conversation_id'],'stable-ARCH')
        self.assertEqual(self.adapter.status('ARCH')['disposition'],'retained')
        self.assertEqual(self.adapter.status('ARCH')['assignment']['status'],'completed')

    def test_ack_does_not_answer_and_replacement_preserves_question_and_context(self):
        self.adapter.remember('ARCH',decision='Alternatives are not summed.')
        self.adapter.request('ARCH','q','Why no aggregate total?',provenance='observed-owner-input',activity='idle')
        self.adapter.acknowledge('ARCH','q',generation=1,evidence='actual first processing')
        self.adapter.bind('ARCH','/root/replacement/arch',2,evidence='actual replacement READY')
        self.assertIn('q',self.adapter.status('ARCH')['pending_questions'])
        with self.assertRaises(StaleSession):
            self.adapter.reply('ARCH','q','Old reply',generation=1,evidence='obsolete source')
        result=self.adapter.reply('ARCH','q','They represent alternative orders.',generation=2,evidence='actual replacement answer')
        self.assertEqual(result['conversation_id'],'stable-ARCH')
        self.assertTrue(result['display_to_owner_required'])
        self.assertFalse(result['display_to_owner_observed'])
        self.assertEqual(self.adapter.status('ARCH')['decisions'],['Alternatives are not summed.'])

    def test_snapshot_restore_requires_actual_binding_and_keeps_pending(self):
        self.adapter.request('ARCH','q','Unfinished question',provenance='proxy-test',activity='running')
        snapshot=self.adapter.recovery_snapshot()
        other=OwnerDialogue(LocalInteraction(self.root/'restored.json'),LocalMailbox(self.root/'restored-mail.json'))
        other.restore(snapshot)
        with self.assertRaises(ValueError):other.request('ARCH','q2','Continue',provenance='proxy-test',activity='idle')
        other.bind('ARCH','/root/replacement/arch',2,evidence='actual replacement')
        self.assertIn('q',other.status('ARCH')['pending_questions'])
        self.assertEqual(other.status('ARCH')['conversation_id'],'stable-ARCH')

    def test_route_never_changes_remote_state_or_claims_user_saw_answer(self):
        self.adapter.request('ARCH','q','Question',provenance='proxy-test',activity='idle')
        result=self.adapter.reply('ARCH','q','Actual answer',generation=1,evidence='actual source')
        self.assertEqual(sorted(p.name for p in self.root.iterdir()),
                         ['interaction.json','interaction.json.lock','mailbox.json','mailbox.json.lock'])
        self.assertFalse(result['display_to_owner_observed'])
        messages=self.adapter.mailbox.read()['messages']
        self.assertTrue(all(m['status']=='acknowledged' for m in messages.values()))
        self.assertTrue(all('processing_started_at' not in m['ack'] for m in messages.values()))
