"""Exact owner-front-door forwarding and meaningful owner-word records.

Pure data operations. Questions stay local/transient and never start builds.
Explicitly marked owner instructions/decisions may be recorded once as recovery
state by the current coordinator after an actual observed owner-console event.
Trusted actor/source inputs are not cryptographic caller authentication or grants.
"""
import copy
import json
import math
from . import layout
from .communication import MAX_TEXT_BYTES

KINDS=frozenset(('question','instruction','decision'))


def plan_owner_message(state, *, actor,text,kind,message_id,marked=False,
                       expected_generation=None):
    if not layout.configured(state) or actor!=layout.CONSOLE:
        raise layout.InvalidLayout('actual owner console must forward owner input')
    if kind not in KINDS or not isinstance(text,str) or not text or not isinstance(message_id,str) or not message_id or len(message_id.encode())>256:
        raise ValueError('owner input needs exact nonempty text/kind/message ID')
    if type(marked) is not bool or (kind!='question' and not marked):
        raise PermissionError('only explicitly marked owner instructions/decisions may be recorded')
    if kind=='question' and marked:raise ValueError('question is not a marked instruction')
    current=layout.current(state,'COORDINATOR')
    if current is None:raise layout.InvalidLayout('current coordinator binding required')
    if expected_generation is not None and (type(expected_generation) is not int or not 1<=expected_generation<2**63):
        raise layout.InvalidLayout('positive integer expected coordinator generation required')
    if expected_generation is not None and expected_generation!=current['generation']:
        raise layout.InvalidLayout('stale coordinator generation')
    envelope={'kind':kind,'verbatim':text,'explicit_owner_mark':marked,
              'message_id':message_id,'source':'observed-owner-console-input',
              'question_starts_work':False,'owner_stop_preserved':state.get('stopped',False)}
    body=json.dumps(envelope,ensure_ascii=False,separators=(',',':'))
    if len(body.encode())>MAX_TEXT_BYTES:raise ValueError('owner input exceeds bounded local transport packet; preserve owner artifact then reference it')
    return {'operation':'enqueue_local','message':{'sender':'CONSOLE','recipient':'COORDINATOR','text':body,'message_id':message_id},
            'coordinator':copy.deepcopy(current),'envelope':envelope,
            'durable_record_required':kind!='question',
            'build_authorized_by_forwarding':False,'native_transport':'followup_task after local enqueue/intent',
            'identity_limit':'trusted host observed event, not packet authentication'}


def record_owner_words(state, *, actor,envelope,observed_at,source_evidence):
    """Mutate supplied recovery dictionary, not storage; integrator persists milestone.

    Records exact words, not interpreted permission policy. Semantic control changes
    (stop/cap/priority) must separately use existing authorized typed control path.
    """
    if not layout.configured(state):raise layout.InvalidLayout('approved layout required')
    coordinator=layout.current(state,'COORDINATOR')
    if not coordinator or actor!=coordinator['target']:raise layout.InvalidLayout('current coordinator records owner words')
    if not isinstance(envelope,dict) or set(envelope)!={'kind','verbatim','explicit_owner_mark','message_id','source','question_starts_work','owner_stop_preserved'}:
        raise ValueError('exact console input envelope required')
    if envelope['kind'] not in ('instruction','decision') or envelope['explicit_owner_mark'] is not True or envelope['source']!='observed-owner-console-input':
        raise PermissionError('questions or agent assertions cannot become owner instructions')
    if envelope['question_starts_work'] is not False or not isinstance(envelope['verbatim'],str) or not envelope['verbatim'] or not isinstance(envelope['message_id'],str) or not envelope['message_id']:
        raise ValueError('invalid exact owner words')
    if type(observed_at) not in (int,float) or not math.isfinite(observed_at) or observed_at<=0 or not isinstance(source_evidence,str) or not source_evidence.strip():
        raise ValueError('actual source event evidence and observation time required')
    record={'kind':envelope['kind'],'text':envelope['verbatim'],'at':observed_at,
            'source_evidence':source_evidence,'recorded_by':copy.deepcopy(coordinator)}
    records=state.setdefault('owner_records',{})
    previous=records.get(envelope['message_id'])
    if previous:
        if previous['kind']!=record['kind'] or previous['text']!=record['text'] or previous['source_evidence']!=record['source_evidence']:
            raise ValueError('owner message identity reused for different words/source')
        return False
    records[envelope['message_id']]=record
    return True
