"""Owner-console conversation adapter over actual native followup intents.

Not an independent child composer, task-launch API, authentication boundary or
GitHub transport. Actual owner input and native replies are trusted-host events.
Questions never acquire build/grant authority from being forwarded.
"""
import hashlib
import json
import time
from . import communication, interaction


class OwnerDialogue:
    def __init__(self, local_store, mailbox):
        self.local = local_store
        self.mailbox = mailbox

    def bind(self, role, target, generation, *, evidence, conversation_id=None):
        if not isinstance(evidence, str) or not evidence.strip():
            raise ValueError('actual native binding/reactivation event required')
        state, result = self.local.mutate(lambda s: interaction.bind(
            s, role, target, generation, conversation_id))
        self.mailbox.mutate(lambda s: communication.register(s, role, target, generation))
        return result

    def request(self, role, question_id, text, *, provenance, activity, kind='question', conversation_id=None):
        if kind not in ('question', 'instruction', 'decision'):
            raise ValueError('explicit input kind required')
        current = interaction.capsule(self.local.read(), role)
        if conversation_id is not None and conversation_id != current['conversation_id']:
            raise ValueError('wrong logical conversation identity')
        if not current['binding']:
            raise ValueError('reconcile an actual native instance before routing')
        recipient = self.mailbox.read().get('recipients', {}).get(role)
        if recipient != current['binding']:
            raise interaction.StaleSession('local transport and conversation generation differ')
        self.local.mutate(lambda s: interaction.ask(s, role, question_id, text, provenance=provenance))
        message_id = 'dialogue-' + hashlib.sha256((role+'\0'+question_id).encode()).hexdigest()
        envelope = {'role': role, 'conversation_id': current['conversation_id'], 'question_id': question_id,
                    'generation': current['binding']['generation'], 'kind': kind,
                    'verbatim': text, 'provenance': provenance,
                    'build_authorized_by_forwarding': False, 'grants_changed': False}
        body = json.dumps(envelope, ensure_ascii=False)
        intent = interaction.delivery_intent(self.local.read(), role, activity, body)
        if intent.get('tool') != 'followup_task':
            return {**intent, 'question_id': question_id, 'question_pending': True}
        self.mailbox.mutate(lambda s: communication.enqueue(s, 'CONSOLE', role, body, message_id))
        delivery=communication.delivery_intent(self.mailbox.read(),message_id,'running' if activity=='running' else 'idle')
        intent['arguments']={'target':delivery['target'],'message':delivery['message']}
        return {**intent, **delivery, 'message_id': message_id, 'question_id': question_id, 'question_pending': True,
                'owner_interface': 'this standing owner-console conversation; target role explicitly',
                'direct_child_composer_verified': False, 'requires_actual_native_submission': True,
                'envelope': envelope}

    def acknowledge(self, role, question_id, *, generation, evidence):
        self.local.mutate(lambda s: interaction.acknowledge(
            s, role, question_id, generation=generation, evidence=evidence))
        return {'question_id': question_id, 'pending': True, 'answered': False}

    def reply(self, role, question_id, text, *, generation, evidence):
        self.local.mutate(lambda s: interaction.answer(s, role, question_id, text,
            generation=generation, provenance='observed-native-reply', evidence=evidence))
        capsule = interaction.capsule(self.local.read(), role)
        message_id='dialogue-'+hashlib.sha256((role+'\0'+question_id).encode()).hexdigest()
        def answered_transport(state):
            message=state['messages'].get(message_id)
            if message is not None and message.get('status')!='acknowledged':
                if state['recipients'].get(role)!=capsule['binding']:
                    raise interaction.StaleSession('reply transport generation changed')
                # A substantive observed reply discharges transport too; no
                # fabricated exact first-processing time or delivery RPC record.
                message['status']='acknowledged'
                message['ack']={'target':capsule['binding']['target'],'generation':generation,
                    'source':'observed-substantive-native-reply','reply_observed_at':time.time(),
                    'recorded_at':time.time(),'evidence':evidence}
        self.mailbox.mutate(answered_transport)
        return {'role': role, 'conversation_id': capsule['conversation_id'], 'question_id': question_id,
                'generation': generation, 'text': text, 'source': 'observed-native-reply',
                'display_to_owner_required': True, 'display_to_owner_observed': False}

    def status(self, role=None):
        state = self.local.read()
        return interaction.capsule(state, role) if role else state

    def lifecycle(self, role, kind, *, generation, evidence, assignment_id=None):
        self.local.mutate(lambda s: interaction.event(s, role, kind,
            generation=generation, evidence=evidence, assignment_id=assignment_id))
        return self.status(role)

    def remember(self, role, *, decision=None, reference=None):
        self.local.mutate(lambda s: interaction.remember(s, role, decision=decision, reference=reference))
        return self.status(role)

    def recovery_snapshot(self):
        return interaction.recovery_snapshot(self.local.read())

    def restore(self, snapshot):
        self.local.mutate(lambda s: interaction.restore_snapshot(s, snapshot))
        return self.local.read()
