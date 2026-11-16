"""Durable native-child mailbox; the hosted controller invokes returned tool intents.

No timer/polling transport or invented Cloud API. followup_task wakes idle children;
send_message can steer active children but cannot wake idle ones. Production delivery
uses followup_task for either state to avoid an active-to-idle race. Native platform targets remain current-tree
non-root agents, not arbitrary account sessions. Store this state in existing
GitHub-backed controller transactions; this module supplies pure state operations.
"""
import time
import uuid

class StaleRecipient(RuntimeError): pass

def empty():
    return {'recipients': {}, 'messages': {}, 'events': []}

def register(state, role, target, generation):
    if not role or not target or type(generation) is not int or generation < 1:
        raise ValueError('role, native target and positive generation required')
    previous=state['recipients'].get(role)
    if previous and generation <= previous['generation']:
        if previous == {'target':target,'generation':generation}: return
        raise StaleRecipient('replacement generation must increase')
    state['recipients'][role]={'target':target,'generation':generation}

def enqueue(state, sender, recipient, text, message_id=None):
    if recipient not in state['recipients'] or not sender or not isinstance(text,str) or not text:
        raise ValueError('known recipient and nonempty message required')
    ident=message_id or str(uuid.uuid4())
    payload={'sender':sender,'recipient':recipient,'text':text}
    if ident in state['messages']:
        old=state['messages'][ident]
        if any(old[k] != v for k,v in payload.items()): raise ValueError('idempotence key reused for a different message')
        return ident
    state['messages'][ident]={**payload,'status':'pending','created_at':time.time(),'deliveries':[]}
    return ident

def delivery_intent(state, message_id, activity):
    """Called with fresh native activity, after durable enqueue. Does not await reply."""
    if activity not in ('idle','running'): raise ValueError('fresh native idle/running state required')
    message=state['messages'][message_id]
    if message['status']=='acknowledged': return None
    recipient=state['recipients'][message['recipient']]
    # followup_task performs the idle/running choice at the native service. A
    # previous running observation cannot make send_message race-safe.
    method='followup_task'
    return {'tool':method,'observed_activity':activity,'target':recipient['target'],'generation':recipient['generation'],
            'message_id':message_id,'message':f"Process4 durable message {message_id} generation {recipient['generation']}: {message['text']}"}

def record_delivery(state, intent):
    if intent.get('tool')!='followup_task': raise ValueError('production delivery must wake-or-steer atomically')
    message=state['messages'][intent['message_id']]
    current=state['recipients'][message['recipient']]
    if current != {'target':intent['target'],'generation':intent['generation']}:
        raise StaleRecipient('recipient changed before delivery recording')
    if message['status']=='acknowledged': return
    message['deliveries'].append({'target':intent['target'],'generation':intent['generation'],
                                  'tool':intent['tool'],'recorded_at':time.time()})
    message['status']='delivered_unacknowledged'

def acknowledge(state, message_id, target, generation, processing_started_at):
    message=state['messages'][message_id]
    current=state['recipients'][message['recipient']]
    if current != {'target':target,'generation':generation}:
        raise StaleRecipient('old recipient cannot acknowledge replacement work')
    if message['status']=='acknowledged': return False
    message.update(status='acknowledged',ack={'target':target,'generation':generation,
                   'processing_started_at':processing_started_at,'recorded_at':time.time()})
    return True

def pending_for(state, role):
    return tuple(key for key,value in state['messages'].items()
                 if value['recipient']==role and value['status']!='acknowledged')

