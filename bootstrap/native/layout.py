"""Explicit approved native ROOT layout, not authentication or a task-launch API.

The console is native depth0; ROOT/WATCHER depth1; ARCH/coordinator depth2;
JOB depth3. Binding is a meaningful recovery milestone. Routine messages remain
in LocalMailbox. Intents must be executed by the named live native creator, then
registered only after an actual native event; arbitrary CLI fields prove no identity.
"""
import copy
import re

MODE='addressable_root'
CONSOLE='/root'
PATH=re.compile(r'^/root(?:/[a-z0-9_]+){1,3}$')
class InvalidLayout(PermissionError):pass


def configured(state):
    value=state.get('native_layout')
    if value is None:return False
    if not isinstance(value,dict) or value.get('mode')!=MODE or value.get('console')!=CONSOLE or not isinstance(value.get('approval_evidence'),str) or not value['approval_evidence'].strip():
        raise InvalidLayout('invalid explicit native layout or approval evidence')
    return True


def adopt(state, approval_evidence, console=CONSOLE):
    if console!=CONSOLE or not isinstance(approval_evidence,str) or not approval_evidence.strip():
        raise InvalidLayout('current console and actual owner approval reference required')
    previous=state.get('native_layout')
    if previous is not None:
        configured(state)
        if previous['approval_evidence']!=approval_evidence:
            raise InvalidLayout('layout already adopted with different approval reference; preserve it')
        return
    # This records an already observed owner decision, not new grants or policy.
    state['native_layout']={'mode':MODE,'console':console,'approval_evidence':approval_evidence,
                            'identity_source':'trusted supervisor observed owner approval'}


def depth(target):
    if not isinstance(target,str) or not PATH.fullmatch(target):raise InvalidLayout('native target must be canonical non-root depth1..3')
    return target.count('/')-1


def current(state,role):
    value=state.get('native_roles',{}).get(role)
    if value is None:return None
    if not isinstance(value,dict) or set(value)!={'target','generation'} or type(value['generation']) is not int or not 1<=value['generation']<2**63:
        raise InvalidLayout('invalid current role binding')
    depth(value['target'])
    return value


def creator(state,role):
    if role in ('ROOT','WATCHER'):return CONSOLE
    if role=='PROCESS':
        request=state.get('native_layout',{}).get('process_request');arch=current(state,'ARCH')
        if not isinstance(request,dict) or arch is None or request.get('arch')!=arch or request.get('source')!='observed-native-ARCH-request' or not isinstance(request.get('evidence'),str) or not request['evidence'].strip():
            raise InvalidLayout('PROCESS requires actual current ARCH request recorded by trusted supervisor')
    parent='ARCH' if role.startswith(('JOB:','LANE:')) else 'ROOT'
    if role not in ('ARCH','COORDINATOR','PROCESS') and not role.startswith(('JOB:','LANE:')):
        raise InvalidLayout('unknown native role')
    binding=current(state,parent)
    if binding is None:raise InvalidLayout(parent+' binding required before child lifecycle')
    return binding['target']


def validate_binding(state,role,target,generation,actor):
    if not configured(state):raise InvalidLayout('explicit addressable ROOT layout required')
    if type(generation) is not int or not 1<=generation<2**63:raise InvalidLayout('positive bounded generation required')
    previous=current(state,role)
    if previous=={'target':target,'generation':generation}:
        # Existing native sessions can be retained when ROOT is replaced. No
        # reparenting or increasing depth is needed merely to communicate.
        if actor not in (CONSOLE,creator(state,role)):raise InvalidLayout('trusted creator identity required')
        return
    if previous and generation<=previous['generation']:raise InvalidLayout('replacement generation must increase')
    expected=creator(state,role)
    if actor!=expected:raise InvalidLayout('only current native creator may bind this role')
    actual_depth=depth(target)
    expected_depth=3 if role.startswith(('JOB:','LANE:')) else 1 if role in ('ROOT','WATCHER') else 2
    if actual_depth!=expected_depth or target.rsplit('/',1)[0]!=expected:
        raise InvalidLayout('role must be an immediate child of its current creator, depth at most3')
    if role.startswith('JOB:'):
        jid=role.removeprefix('JOB:');job=state.get('jobs',{}).get(jid)
        expected=job.get('expected_session_generation',job.get('attempt')) if job else None
        if job is None or type(job.get('attempt')) is not int or type(expected) is not int or generation!=expected:raise InvalidLayout('JOB generation must match its reserved native session generation')
    if role.startswith('LANE:'):
        lane=state.get('design_lanes',{}).get(role.removeprefix('LANE:'))
        if not isinstance(lane,dict) or lane.get('status') not in ('requested','active') or lane.get('arch')!=current(state,'ARCH'):
            raise InvalidLayout('LANE requires declared request under current ARCH; C validates owner need/provenance/paths')
    if any(value.get('target')==target for key,value in state.get('native_roles',{}).items() if key!=role):
        raise InvalidLayout('distinct roles require distinct native sessions')


def status(state):
    enabled=configured(state)
    return {'mode':MODE if enabled else 'legacy_standing_chat','console':CONSOLE,
            'roles':copy.deepcopy(state.get('native_roles',{})),
            'approval_evidence':state['native_layout']['approval_evidence'] if enabled else None,
            'limits':['console idle notification is not reactive','ROOT replacement requires active console/safety wake',
                      'inherited tool availability is not credential isolation']}


def plan(state,role,actor,activity,expected_generation=None,state_branch=None,message=None,replace=False):
    if not configured(state):raise InvalidLayout('explicit addressable ROOT layout required')
    if activity not in ('unavailable','idle','running'):raise InvalidLayout('fresh actual native activity required')
    cap=state.get('owner_job_cap',8);slots=state.get('slots',1)
    if type(cap) is not int or type(slots) is not int or not 1<=slots<=cap<=8:raise InvalidLayout('owner cap/slot state invalid')
    binding=current(state,role)
    if expected_generation is not None and (type(expected_generation) is not int or not 1<=expected_generation<2**63):
        raise InvalidLayout('positive integer expected generation required')
    if expected_generation is not None and (binding is None or expected_generation!=binding['generation']):
        raise InvalidLayout('stale or missing role generation')
    if role.startswith('JOB:') and role.removeprefix('JOB:') not in state.get('jobs',{}):raise InvalidLayout('unknown assigned JOB')
    if role.startswith('LANE:'):
        lane=state.get('design_lanes',{}).get(role.removeprefix('LANE:'))
        if not isinstance(lane,dict) or lane.get('status') not in ('requested','active'):
            raise InvalidLayout('declared current design lane required')
        if activity=='unavailable' and lane.get('arch')!=current(state,'ARCH'):
            raise InvalidLayout('new lane lifecycle requires current ARCH request')
    expected=creator(state,role)
    if actor!=expected:raise InvalidLayout('native lifecycle action belongs to current creator')
    if state.get('stopped'):
        return {'action':'hold','role':role,'reason':'durable stop preserved','stop_source':state.get('stop_source')}
    if replace and activity!='unavailable':
        if binding is None:raise InvalidLayout('no actual binding to interrupt')
        return {'tool':'interrupt_agent','actor':actor,'role':role,'generation':binding['generation'],
                'arguments':{'target':binding['target']},'next':'Observe actual interrupted/unavailable state, then plan sibling replacement; register only after actual spawn event'}
    if activity!='unavailable':
        if binding is None:raise InvalidLayout('no actual native binding to wake or steer')
        return {'tool':'followup_task','actor':actor,'role':role,'generation':binding['generation'],
                'arguments':{'target':binding['target'],'message':message or 'Continue your existing Process4 role from durable state; preserve unfinished work and owner controls.'},
                'requires_actual_submission':True}
    if role.startswith('JOB:'):
        job=state['jobs'][role.removeprefix('JOB:')]
        conversation_only=job.get('conversation_only_recovery') is True
        if conversation_only:
            if job.get('status')!='done' or job.get('accepted') is not True:
                raise InvalidLayout('conversation-only recovery requires retained completed module assignment')
        else:
            if job.get('status') not in ('ready','paused','blocked','running','interrupting'):
                return {'action':'hold','role':role,'reason':'no unfinished assigned module work'}
            if sum(j.get('status')=='running' for j in state['jobs'].values())>=slots and job.get('status')!='running':
                return {'action':'hold','role':role,'reason':'current module slot cap reached'}
        generation=job.get('expected_session_generation',job['attempt'])
        if binding and generation<=binding['generation']:raise InvalidLayout('reserve next native JOB session before lifecycle plan')
        if type(generation) is not int or not 1<=generation<2**63:
            raise InvalidLayout('prepare actual positive JOB attempt before lifecycle plan')
    else:generation=(binding['generation'] if binding else 0)+1
    if generation>=2**63:raise InvalidLayout('generation capacity exhausted')
    name='p4_'+role.lower().replace(':','_').replace('-','_')+'_g'+str(generation)
    prompt=('Native Process4 '+role+' generation '+str(generation)+'. Actual creator '+actor+'. '
            'Read bootstrap/HANDOFF.md, bootstrap/role_instructions.py and current native run '+str(state_branch)+'. '
            'Use only native OpenAI-managed subscription execution. Preserve grants, stop/cap, existing branches/PRs and unfinished work. '
            'No main/tranche/CivicSmith2/settings/grant/process-pin changes, credentials, paid hosting or metered inference. '
            'Use native reactive child messaging and bounded local operational mailbox, never GitHub as message/ack/heartbeat bus. '
            'Do not create your own successor; product decisions stay ARCH and module work JOB. '
            'Report actual canonical address/READY for creator registration; no claim of completed work or receipt before execution.')
    if role.startswith('JOB:') and state['jobs'][role.removeprefix('JOB:')].get('conversation_only_recovery') is True:
        prompt+=' Retained completed JOB conversation ONLY: answer questions and retain decisions/context. No source editing, provider mutation, commits, tests as new product work or new assignment is authorized; the completed module attempt is unchanged.'
    return {'tool':'spawn_agent','actor':actor,'role':role,'generation':generation,
            'required_native_parent':actor,'arguments':{'task_name':name,'message':prompt},
            'registration_after_actual_event':{'role':role,'generation':generation,'actor':actor},
            'preserved_owner_cap':cap,'preserved_slots':slots}
