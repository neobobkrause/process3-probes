"""Pure native safety/liveness decisions from fresh trusted-host observations.

No polling, transport, inference or provider operations. A plan is not a receipt.
The host obtains actual native inventory, supplies target/generation/activity and
observed_at/source, executes supported intents, then binds actual native events.
"""
import math
import time
from . import layout

MAX_OBSERVATION_AGE=60
ACTIVITIES=frozenset(('idle','completed','running','interrupted','unavailable'))


def observation(state,role,value,*,now=None,max_age=MAX_OBSERVATION_AGE):
    """Validate one inventory observation against current recovery binding.

    value={target: path|None, generation: int|None, activity: ..., observed_at:
    host Unix seconds, source:'actual-native-inventory'}. Absent role uses None
    target/generation plus unavailable; callers must reconcile any unbound actual
    agent before declaring unavailable. Fields are not caller authentication.
    """
    now=time.time() if now is None else now
    if not isinstance(value,dict) or set(value)!={'target','generation','activity','observed_at','source'}:
        return None,'fresh actual native observation required'
    stamp=value['observed_at']
    if type(stamp) not in (int,float) or not math.isfinite(stamp) or not 0<=now-stamp<=max_age:
        return None,'native observation is stale or future-dated'
    if value['source']!='actual-native-inventory' or not isinstance(value['activity'],str) or value['activity'] not in ACTIVITIES:
        return None,'unsupported native observation source/activity'
    binding=layout.current(state,role)
    expected=binding or {'target':None,'generation':None}
    if binding and type(value['generation']) is not int:
        return None,'native observation generation must be integer, not a truth value'
    if value['target']!=expected['target'] or value['generation']!=expected['generation']:
        return None,'native observation belongs to obsolete target/generation'
    if binding is None and value['activity']!='unavailable':
        return None,'unbound native agent must be reconciled before dispatch'
    activity={'completed':'idle','interrupted':'unavailable'}.get(value['activity'],value['activity'])
    return activity,None


def plan_supervision(state, *, observations, actor=layout.CONSOLE,
                     native_capacity=None,pending_roles=(),now=None,state_branch=None):
    """Plan console ROOT/WATCHER recovery or ROOT's ARCH/coordinator recovery.

    Healthy running roles are untouched. Console's existing safety wake can steer
    idle ROOT; idle ARCH is steered only with actual unfinished module work/pending
    role work, coordinator only for pending work. Missing observations never become
    a failure. A caller cannot replace itself or make watcher create ROOT beneath it.
    """
    if not layout.configured(state):raise layout.InvalidLayout('approved addressable layout required')
    cap=state.get('owner_job_cap',8);slots=state.get('slots',1)
    if type(cap) is not int or type(slots) is not int or not 1<=slots<=cap<=8:
        raise layout.InvalidLayout('invalid preserved owner cap/technical slots')
    if native_capacity is not None and (type(native_capacity) is not int or native_capacity<0):
        raise ValueError('nonnegative actual available native capacity required')
    if not isinstance(observations,dict):raise ValueError('native observations must be role mapping')
    root=layout.current(state,'ROOT')
    if actor==layout.CONSOLE:roles=('ROOT','WATCHER')
    elif root and actor==root['target']:roles=('ARCH','COORDINATOR')
    else:raise layout.InvalidLayout('only console or current ROOT may supervise these roles')
    result={'actor':actor,'actions':[],'holds':[],'healthy':[],
            'owner_job_cap':cap,'technical_slots':slots,'native_capacity':native_capacity,
            'execution_required':'actual native tool calls; no action receipt generated'}
    if state.get('stopped'):
        result['holds']=[{'role':role,'reason':'durable stop preserved','stop_source':state.get('stop_source')} for role in roles]
        return result
    pending=set(pending_roles)
    unfinished=any(job.get('status')!='done' for job in state.get('jobs',{}).values())
    for role in roles:
        activity,reason=observation(state,role,observations.get(role),now=now)
        if reason:
            result['holds'].append({'role':role,'reason':reason});continue
        if activity=='running':
            result['healthy'].append({'role':role,'activity':'running'});continue
        if activity=='idle' and role not in pending and role!='ROOT' and not (role=='ARCH' and unfinished):
            result['healthy'].append({'role':role,'activity':'idle','reason':'no pending assigned role work'});continue
        if native_capacity is not None and len(result['actions'])>=native_capacity:
            result['holds'].append({'role':role,'reason':'actual native capacity unavailable; owner cap unchanged'});continue
        binding=layout.current(state,role)
        intent=layout.plan(state,role,actor,activity,binding['generation'] if binding else None,state_branch)
        result['actions'].append(intent)
    return result
