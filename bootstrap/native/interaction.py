"""Retained logical conversations and bounded local context, not a transport/UI.

Native completed turns remain reachable by followup_task. Identity labels and
provenance fields describe trusted-host observations; they do not authenticate
an owner or prove delivery. Routine turns and answers never require Git writes.
"""
import copy
import fcntl
import json
import os
from pathlib import Path
import tempfile
import uuid

MAX_ROLES = 128
MAX_PENDING = 32
MAX_DECISIONS = 16
MAX_REFERENCES = 24
MAX_ANSWERED = 8
MAX_TEXT_BYTES = 8192
MAX_BYTES = 512 * 1024
PENDING_ANSWER_RESERVE = 2 * MAX_TEXT_BYTES + 2048

class InteractionFull(RuntimeError): pass
class StaleSession(RuntimeError): pass


def empty():
    return {'version': 1, 'roles': {}}


def _text(value, name='text', limit=MAX_TEXT_BYTES):
    if not isinstance(value, str) or not value.strip() or len(value.encode()) > limit:
        raise ValueError('bounded nonempty ' + name + ' required')
    return value


def _generation(value):
    if type(value) is not int or not 1 <= value < 2**63:
        raise ValueError('positive integer generation required')


def _change(state, action):
    candidate = copy.deepcopy(state)
    result = action(candidate)
    pending = sum(len(r['pending_questions']) for r in candidate['roles'].values())
    # Keep capacity for explicit answers instead of filling a capsule until only
    # ACKs fit. A resolved answer releases its question's bounded reserve.
    if (len(candidate['roles']) > MAX_ROLES
            or len(json.dumps(candidate).encode()) + pending * PENDING_ANSWER_RESERVE > MAX_BYTES):
        raise InteractionFull('local interaction capacity reached; pending context not discarded')
    state.clear(); state.update(candidate)
    return copy.deepcopy(result)


def _role(state, role, generation=None):
    value = state['roles'][role]
    if generation is not None:
        _generation(generation)
        if value['binding'] is None or value['binding']['generation'] != generation:
            raise StaleSession('obsolete conversation session generation')
    return value


def bind(state, role, target, generation, conversation_id=None):
    """Bind an observed native instance; replacement retains context/questions.

    Call only after an actual native event. Missing inventory is not such an event.
    A retired logical role cannot silently return through binding.
    """
    _text(role, 'role', 256); _text(target, 'target', 256); _generation(generation)
    if conversation_id is not None: _text(conversation_id, 'conversation identity', 256)
    def apply(s):
        old = s['roles'].get(role)
        binding = {'target': target, 'generation': generation}
        if old:
            if old['lifecycle'] == 'retired': raise ValueError('explicitly retired logical role')
            if conversation_id is not None and conversation_id != old['conversation_id']:
                raise ValueError('logical conversation identity cannot change on replacement')
            if old['binding'] == binding: return old
            if old['binding'] is None:
                old['binding'] = binding
                old['last_event'] = 'session_bound_after_recovery'
                return old
            if generation <= old['binding']['generation']:
                raise StaleSession('replacement generation must increase')
            old['binding'] = binding
            old['lifecycle'] = 'retained_idle'
            old['replacement_count'] += 1
            old['last_event'] = 'session_replaced'
            return old
        value = {'conversation_id': conversation_id or str(uuid.uuid4()),
                 'binding': binding, 'disposition': 'retained', 'lifecycle': 'retained_idle',
                 'assignment': None, 'turns_completed': 0, 'replacement_count': 0,
                 'last_event': 'session_bound', 'decisions': [], 'references': [],
                 'pending_questions': {}, 'answered': []}
        s['roles'][role] = value
        return value
    return _change(state, apply)


def event(state, role, kind, *, generation, evidence, assignment_id=None):
    """Observe lifecycle facts, never equate turn/assignment completion/retirement."""
    _text(evidence, 'actual event evidence')
    if kind not in ('turn_started', 'turn_completed', 'retained_idle',
                    'assignment_started', 'assignment_completed'):
        raise ValueError('supported explicit lifecycle event required')
    if kind.startswith('assignment_'): _text(assignment_id, 'assignment identity', 256)
    def apply(s):
        r = _role(s, role, generation)
        if r['lifecycle'] == 'retired': raise ValueError('retired logical role')
        if kind == 'assignment_started':
            if r['assignment'] and r['assignment']['status'] == 'active' and r['assignment']['id'] != assignment_id:
                raise ValueError('complete existing assignment explicitly before replacing it')
            r['assignment'] = {'id': assignment_id, 'status': 'active'}
        elif kind == 'assignment_completed':
            if not r['assignment'] or r['assignment']['id'] != assignment_id:
                raise ValueError('current assignment identity required')
            r['assignment']['status'] = 'completed'
        elif kind == 'turn_started': r['lifecycle'] = 'active'
        else:
            r['lifecycle'] = 'retained_idle'
            if kind == 'turn_completed': r['turns_completed'] += 1
        r['last_event'] = kind
        r['last_event_evidence'] = evidence
    return _change(state, apply)


def remember(state, role, *, decision=None, reference=None):
    """Keep deliberate capsule knowledge, not automatic chat transcript history."""
    if (decision is None) == (reference is None): raise ValueError('one decision or reference required')
    value = _text(decision if decision is not None else reference)
    def apply(s):
        r = _role(s, role)
        if r['lifecycle'] == 'retired': raise ValueError('retired logical role')
        key, cap = ('decisions', MAX_DECISIONS) if decision is not None else ('references', MAX_REFERENCES)
        if value in r[key]: return
        if len(r[key]) >= cap:
            raise InteractionFull('capsule knowledge full; explicitly revise instead of silently losing decisions')
        r[key].append(value)
    return _change(state, apply)


def ask(state, role, question_id, text, *, provenance):
    """Provenance is explicit observed-owner input or clearly labeled proxy test."""
    _text(question_id, 'question identity', 256); _text(text)
    if provenance not in ('observed-owner-input', 'proxy-test', 'role-question'):
        raise ValueError('explicit conversation provenance required')
    def apply(s):
        r = _role(s, role)
        if r['lifecycle'] == 'retired': raise ValueError('retired logical role')
        value = {'id': question_id, 'text': text, 'provenance': provenance, 'receipts': []}
        if question_id in r['pending_questions']:
            old = r['pending_questions'][question_id]
            if any(old[k] != value[k] for k in ('id', 'text', 'provenance')):
                raise ValueError('question identity reused for different content')
            return
        if any(q['id'] == question_id for q in r['answered']):
            raise ValueError('question already answered; use a new identity for a new turn')
        if len(r['pending_questions']) >= MAX_PENDING:
            raise InteractionFull('pending question capacity reached; no question discarded')
        r['pending_questions'][question_id] = value
    return _change(state, apply)


def acknowledge(state, role, question_id, *, generation, evidence):
    """First processing/transport ACK leaves the question pending."""
    _text(evidence, 'processing receipt')
    def apply(s):
        r = _role(s, role, generation)
        q = r['pending_questions'][question_id]
        receipt = {'generation': generation, 'evidence': evidence}
        if receipt not in q['receipts']:
            if len(q['receipts']) >= 8: raise InteractionFull('receipt capacity reached; question remains pending')
            q['receipts'].append(receipt)
    return _change(state, apply)


def answer(state, role, question_id, text, *, generation, provenance, evidence):
    """Record an actual substantive reply; ACK or completion is insufficient."""
    _text(text); _text(evidence, 'answer observation')
    if provenance not in ('observed-native-reply', 'observed-owner-input', 'proxy-test'):
        raise ValueError('explicit observed reply provenance required')
    def apply(s):
        r = _role(s, role, generation)
        q = r['pending_questions'].pop(question_id)
        r['answered'].append({'id': q['id'], 'question': q['text'],
                              'question_provenance': q['provenance'], 'answer': text,
                              'provenance': provenance, 'evidence': evidence,
                              'generation': generation})
        r['answered'] = r['answered'][-MAX_ANSWERED:]
    return _change(state, apply)


def retire(state, role, *, generation, reason, source, evidence):
    """Explicit deliberate retirement; outstanding questions remain inspectable."""
    _text(reason, 'explicit retirement reason'); _text(source, 'retirement authority source', 256)
    _text(evidence, 'retirement authority evidence')
    def apply(s):
        r = _role(s, role, generation)
        r['disposition'] = 'retired'; r['lifecycle'] = 'retired'; r['last_event'] = 'explicit_retirement'
        r['retirement'] = {'reason': reason, 'source': source, 'evidence': evidence}
    return _change(state, apply)


def capsule(state, role):
    return copy.deepcopy(_role(state, role))


def delivery_intent(state, role, activity, message):
    """A plan only. Missing inventory never retires or replaces known sessions."""
    _text(message)
    r = _role(state, role)
    if r['lifecycle'] == 'retired': return {'action': 'hold', 'reason': 'explicitly retired logical role'}
    if r['binding'] is None: return {'action': 'hold', 'reason': 'recovery capsule has no observed native binding'}
    if activity not in ('idle', 'completed', 'running', 'retained_unlisted'):
        return {'action': 'hold', 'reason': 'resolve retained native instance; absence alone is not retirement'}
    return {'tool': 'followup_task', 'arguments': {'target': r['binding']['target'], 'message': message},
            'role': role, 'generation': r['binding']['generation'], 'conversation_id': r['conversation_id'],
            'requires_actual_submission': True}


def recovery_snapshot(state):
    """Explicit meaningful checkpoint; omit routine transcripts, answers and ACKs."""
    roles = {}
    for role, r in state['roles'].items():
        value = {'conversation_id': r['conversation_id'], 'disposition': r['disposition'],
                 'assignment': copy.deepcopy(r['assignment']),
                 'decisions': copy.deepcopy(r['decisions']),
                 'references': copy.deepcopy(r['references']),
                 'pending_questions': {
                     ident: {k: q[k] for k in ('id', 'text', 'provenance')}
                     for ident, q in r['pending_questions'].items()}}
        if r['disposition'] == 'retired': value['retirement'] = copy.deepcopy(r['retirement'])
        roles[role] = value
    return {'version': 1, 'roles': roles}


def restore_snapshot(state, snapshot):
    """Import validated logical context unbound; reconcile actual sessions later.

    Never overwrites a live/local role or treats stored identity as host evidence.
    Retired logical roles stay retired and cannot be rebound implicitly.
    """
    if (not isinstance(snapshot, dict) or set(snapshot) != {'version', 'roles'}
            or type(snapshot['version']) is not int or snapshot['version'] != 1
            or not isinstance(snapshot['roles'], dict) or len(snapshot['roles']) > MAX_ROLES):
        raise ValueError('bounded recovery snapshot schema required')
    def apply(s):
        for role, value in snapshot['roles'].items():
            _text(role, 'role', 256)
            if role in s['roles']: raise ValueError('recovery import cannot overwrite existing role context')
            required = {'conversation_id', 'disposition', 'assignment', 'decisions', 'references', 'pending_questions'}
            if not isinstance(value, dict) or set(value) not in (required, required | {'retirement'}):
                raise ValueError('recovery role schema required')
            _text(value['conversation_id'], 'conversation identity', 256)
            if value['disposition'] not in ('retained', 'retired'): raise ValueError('explicit recovery disposition required')
            assignment = value['assignment']
            if assignment is not None:
                if (not isinstance(assignment, dict) or set(assignment) != {'id', 'status'}
                        or assignment['status'] not in ('active', 'completed')):
                    raise ValueError('recovery assignment schema required')
                _text(assignment['id'], 'assignment identity', 256)
            for key, limit in (('decisions', MAX_DECISIONS), ('references', MAX_REFERENCES)):
                if not isinstance(value[key], list) or len(value[key]) > limit:
                    raise InteractionFull('recovery knowledge capacity exceeded')
                for text in value[key]: _text(text)
                if len(set(value[key])) != len(value[key]): raise ValueError('duplicate recovery knowledge')
            pending = value['pending_questions']
            if not isinstance(pending, dict) or len(pending) > MAX_PENDING:
                raise InteractionFull('recovery pending capacity exceeded')
            for ident, q in pending.items():
                _text(ident, 'question identity', 256)
                if not isinstance(q, dict) or set(q) != {'id', 'text', 'provenance'} or q['id'] != ident:
                    raise ValueError('correlated recovery question schema required')
                _text(q['text'])
                if q['provenance'] not in ('observed-owner-input', 'proxy-test', 'role-question'):
                    raise ValueError('explicit recovery question provenance required')
            retirement = value.get('retirement')
            if value['disposition'] == 'retired':
                if not isinstance(retirement, dict) or set(retirement) != {'reason', 'source', 'evidence'}:
                    raise ValueError('explicit retirement context required')
                for key in retirement: _text(retirement[key], 'retirement ' + key, 256 if key == 'source' else MAX_TEXT_BYTES)
            elif retirement is not None: raise ValueError('retained role cannot import retirement')
            r = copy.deepcopy(value)
            r.update(binding=None, lifecycle='retired' if value['disposition'] == 'retired' else 'retained_idle',
                     turns_completed=0, replacement_count=0, last_event='recovery_context_imported', answered=[])
            for q in r['pending_questions'].values(): q['receipts'] = []
            s['roles'][role] = r
    return _change(state, apply)


class LocalInteraction:
    """Locked atomic local capsules. Host loss needs meaningful recovery snapshot.

    No routine remote persistence or claimed physical/authentication isolation.
    """
    def __init__(self, path): self.path = Path(path)

    def _transaction(self, action=None):
        self.path.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
        fd = os.open(str(self.path) + '.lock', os.O_CREAT | os.O_RDWR, 0o600)
        with os.fdopen(fd, 'a+') as lock:
            fcntl.flock(lock, fcntl.LOCK_EX)
            if self.path.exists() and self.path.stat().st_size > MAX_BYTES:
                raise InteractionFull('local capsule byte limit exceeded')
            state = json.loads(self.path.read_text()) if self.path.exists() else empty()
            result = action(state) if action else None
            encoded = (json.dumps(state, separators=(',', ':')) + '\n').encode()
            if len(encoded) > MAX_BYTES: raise InteractionFull('capsule byte limit exceeded; previous state preserved')
            if action is not None:
                temporary_fd, name = tempfile.mkstemp(prefix='.interaction-', dir=self.path.parent)
                try:
                    with os.fdopen(temporary_fd, 'wb') as output:
                        output.write(encoded); output.flush(); os.fsync(output.fileno())
                    os.replace(name, self.path)
                    directory_fd = os.open(self.path.parent, os.O_DIRECTORY)
                    try: os.fsync(directory_fd)
                    finally: os.close(directory_fd)
                finally:
                    if os.path.exists(name): os.unlink(name)
            return copy.deepcopy(state), copy.deepcopy(result)

    def read(self): return self._transaction()[0]
    def mutate(self, action): return self._transaction(action)
