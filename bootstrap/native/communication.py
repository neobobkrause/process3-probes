"""Bounded workspace-local native mailbox; native tools are the transport.

Routine traffic is ephemeral operational state, never GitHub history. Significant
recovery milestones and compact provider obligations remain in the run state.
"""
import time
import uuid
import copy
import fcntl
import json
import os
from pathlib import Path
import tempfile

MAX_MESSAGES=256
MAX_ACKNOWLEDGED=64
ACK_RETENTION_SECONDS=3600
MAX_TEXT_BYTES=16384
MAX_BYTES=1024*1024
MAX_RECIPIENTS=128
MAX_DELIVERIES=8
PENDING_PROGRESS_RESERVE=8192

class MailboxFull(RuntimeError): pass


def compact(state, now=None):
    now=time.time() if now is None else now
    state.pop('events',None)  # No transient event journal.
    messages=state.setdefault('messages',{})
    acknowledged=sorted(((key,value) for key,value in messages.items() if value.get('status')=='acknowledged'),
                        key=lambda item:item[1].get('ack',{}).get('recorded_at',0),reverse=True)
    for index,(key,value) in enumerate(acknowledged):
        if index>=MAX_ACKNOWLEDGED or now-value.get('ack',{}).get('recorded_at',0)>ACK_RETENTION_SECONDS:
            del messages[key]
    if len(messages)>MAX_MESSAGES:raise MailboxFull('local pending capacity reached; dispatch/ack or explicitly recover before adding traffic')
    return state


class LocalMailbox:
    """One locked, atomic, bounded file; not a hosted service or security sandbox."""
    def __init__(self,path,seed=None,max_bytes=MAX_BYTES):
        self.path=Path(path);self.seed=seed or empty;self.max_bytes=max_bytes

    def _transaction(self, action=None):
        self.path.parent.mkdir(parents=True,exist_ok=True,mode=0o700)
        lock=os.open(str(self.path)+'.lock',os.O_CREAT|os.O_RDWR,0o600)
        with os.fdopen(lock,'a+') as handle:
            fcntl.flock(handle,fcntl.LOCK_EX)
            exists=self.path.exists()
            if exists:
                if self.path.stat().st_size>self.max_bytes:raise MailboxFull('local mailbox byte limit exceeded')
                state=json.loads(self.path.read_text())
            else:state=copy.deepcopy(self.seed())
            loaded=copy.deepcopy(state)
            compact(state)
            pending_before=sum(value.get('status')!='acknowledged' for value in state['messages'].values())
            result=action(state) if action else None
            compact(state)
            encoded=(json.dumps(state,separators=(',',':'))+'\n').encode()
            if len(encoded)>self.max_bytes:raise MailboxFull('local mailbox byte limit reached; pending work was not discarded')
            pending_after=sum(value.get('status')!='acknowledged' for value in state['messages'].values())
            # Admission reserves enough space for bounded delivery/receipt
            # metadata. Subsequent progress does not reserve that space again.
            if (not exists or pending_after>pending_before) and len(encoded)+pending_after*PENDING_PROGRESS_RESERVE>self.max_bytes:
                raise MailboxFull('local admission reserve reached; delivery/ack headroom preserved')
            if action is not None or not exists or state!=loaded:
                fd,name=tempfile.mkstemp(prefix='.mailbox-',dir=self.path.parent)
                try:
                    with os.fdopen(fd,'wb') as target:
                        target.write(encoded);target.flush();os.fsync(target.fileno())
                    os.replace(name,self.path)
                    directory=os.open(self.path.parent,os.O_DIRECTORY)
                    try:os.fsync(directory)
                    finally:os.close(directory)
                finally:
                    if os.path.exists(name):os.unlink(name)
            return copy.deepcopy(state),result

    def read(self):return self._transaction()[0]
    def mutate(self,action):return self._transaction(action)


class StaleRecipient(RuntimeError): pass

def empty():
    return {'recipients': {}, 'messages': {}, 'job_attempts': {}}

def register(state, role, target, generation):
    if not isinstance(role,str) or not role or len(role.encode())>256 or not isinstance(target,str) or not target or len(target.encode())>256 or type(generation) is not int or not 1<=generation<=2**63-1:
        raise ValueError('role, native target and positive generation required')
    previous=state['recipients'].get(role)
    if previous is None and len(state['recipients'])>=MAX_RECIPIENTS:raise MailboxFull('local recipient capacity reached')
    if previous and generation <= previous['generation']:
        if previous == {'target':target,'generation':generation}: return
        raise StaleRecipient('replacement generation must increase')
    state['recipients'][role]={'target':target,'generation':generation}

def enqueue(state, sender, recipient, text, message_id=None):
    if recipient not in state['recipients'] or not sender or not isinstance(text,str) or not text:
        raise ValueError('known recipient and nonempty message required')
    compact(state)
    if len(text.encode())>MAX_TEXT_BYTES:raise MailboxFull('message exceeds local text limit')
    ident=message_id or str(uuid.uuid4())
    if not isinstance(ident,str) or not ident or len(ident.encode())>256 or not isinstance(sender,str) or len(sender.encode())>256:raise ValueError('bounded sender and message identity required')
    payload={'sender':sender,'recipient':recipient,'text':text}
    if ident in state['messages']:
        old=state['messages'][ident]
        if any(old[k] != v for k,v in payload.items()): raise ValueError('idempotence key reused for a different message')
        return ident
    if len(state['messages'])>=MAX_MESSAGES:raise MailboxFull('local pending capacity reached; message not queued')
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
            'message_id':message_id,'message':f"Process4 operational message {message_id} generation {recipient['generation']}: {message['text']}"}

def record_delivery(state, intent):
    if type(intent.get('generation')) is not int or not 1<=intent['generation']<2**63:
        raise ValueError('positive integer delivery generation required')
    if intent.get('tool')!='followup_task': raise ValueError('production delivery must wake-or-steer atomically')
    message=state['messages'][intent['message_id']]
    current=state['recipients'][message['recipient']]
    if current != {'target':intent['target'],'generation':intent['generation']}:
        raise StaleRecipient('recipient changed before delivery recording')
    if message['status']=='acknowledged': return
    message['deliveries'].append({'target':intent['target'],'generation':intent['generation'],
                                  'tool':intent['tool'],'recorded_at':time.time()})
    message['delivery_count']=message.get('delivery_count',0)+1
    message['deliveries']=message['deliveries'][-MAX_DELIVERIES:]
    message['status']='delivered_unacknowledged'

def acknowledge(state, message_id, target, generation, processing_started_at):
    if type(generation) is not int or not 1<=generation<2**63:
        raise ValueError('positive integer acknowledgement generation required')
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

