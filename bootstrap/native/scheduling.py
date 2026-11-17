"""Pure native ARCH dispatch planning; no inference, provider or state side effects.

Fresh observations are trusted-host inputs, not authenticated agent packets.
Capacity is an upper bound, not a claim about subscription quota or tool availability.
"""
import re
from collections.abc import Mapping

ID=re.compile(r'^[a-z][a-z0-9-]{0,48}$')
ACTIVE=frozenset(('running','interrupting','review'))
STATUSES=frozenset(('ready','running','interrupting','review','done','blocked','paused'))
ACTIVITIES=frozenset(('idle','running','unavailable'))
REF=re.compile(r'^[A-Za-z0-9][A-Za-z0-9._/-]*$')

def valid_ref(value,prefix):
    return isinstance(value,str) and value.startswith(prefix) and bool(REF.fullmatch(value)) and not any(part in value for part in ('..','//','@{')) and not value.endswith(('/','.lock'))


def validate_state(state):
    if not isinstance(state,Mapping) or not isinstance(state.get('jobs'),Mapping) or not isinstance(state.get('modules'),Mapping):
        raise ValueError('native modules and jobs required')
    cap=state.get('owner_job_cap',8);slots=state.get('slots',1)
    if type(cap) is not int or type(slots) is not int or not 1<=slots<=cap<=8:
        raise ValueError('owner cap/current slots must satisfy 1<=slots<=cap<=8')
    if type(state.get('stopped',False)) is not bool:raise ValueError('stop must be explicit boolean')
    integration=state.get('integration_branch')
    if not valid_ref(integration,'codex/p4-integration-'):
        raise ValueError('only authorized experimental integration branch is valid')
    orders=set()
    for key,module in state['modules'].items():
        if not isinstance(key,str) or not ID.fullmatch(key) or not isinstance(module,Mapping) or module.get('id')!=key:
            raise ValueError('valid declared module identity required')
        order=module.get('order');uses=module.get('uses',[])
        if type(order) is not int or order in orders:raise ValueError('distinct integer total module order required')
        orders.add(order)
        if not isinstance(uses,list) or any(not isinstance(v,str) for v in uses) or len(set(uses))!=len(uses):raise ValueError('unique declared provider list required')
        for provider in uses:
            source=state['modules'].get(provider)
            if not isinstance(source,Mapping) or type(source.get('order')) is not int or source['order']>=order:
                raise ValueError('every provider must be declared earlier in total order')
    for key,job in state['jobs'].items():
        if key not in state['modules'] or not isinstance(job,Mapping) or job.get('id')!=key:
            raise ValueError('job must match declared module')
        if job.get('order')!=state['modules'][key]['order'] or job.get('uses',[])!=state['modules'][key].get('uses',[]):
            raise ValueError('job/module dependency and order mismatch')
        branch=job.get('branch')
        if branch is not None and not valid_ref(branch,'codex/p4-job-'):
            raise ValueError('only dedicated native job branches may be preserved/dispatched')
        if job.get('status') not in STATUSES or type(job.get('attempt')) is not int or job['attempt']<0:
            raise ValueError('valid durable job status and attempt required')
    return cap,slots


def binding_for(state,jid):
    job=state['jobs'][jid]
    binding=state.get('native_roles',{}).get('JOB:'+jid)
    if binding is None and job.get('session'):
        binding={'target':job['session'],'generation':job.get('session_generation',job['attempt'])}
    if binding is None:return None
    if not isinstance(binding,Mapping) or not isinstance(binding.get('target'),str) or not binding['target'].startswith('/root/') or type(binding.get('generation')) is not int or binding['generation']<1:
        raise ValueError('invalid durable JOB binding')
    return dict(binding)


def observation_for(state,jid,observations):
    if not isinstance(observations,Mapping):raise ValueError('fresh observations mapping required')
    value=observations.get('JOB:'+jid)
    if value is None:return None,'fresh_observation_required'
    if not isinstance(value,Mapping) or value.get('activity') not in ACTIVITIES:
        raise ValueError('observation needs actual native activity')
    binding=binding_for(state,jid)
    if binding is None:
        return None,'unbound_reservation_requires_inventory_review'
    if value.get('target')!=binding['target'] or value.get('generation')!=binding['generation']:
        return None,'stale_target_or_generation_observation'
    return value,None


def current_job_parent(state,jid):
    """Whether a binding belongs to current ARCH; legacy live jobs are preserved,
    but a new ARCH must inspect/interrupt them before replacement, not issue edits.
    """
    if state.get('native_layout',{}).get('mode')!='addressable_root':return True
    binding=binding_for(state,jid);arch=state.get('native_roles',{}).get('ARCH')
    return bool(binding and isinstance(arch,Mapping) and binding['target'].rsplit('/',1)[0]==arch.get('target'))


def pending_notices(state,jid=None):
    notices=state.get('notices',{})
    if not isinstance(notices,Mapping):raise ValueError('notice mapping required')
    result=[]
    for key,notice in notices.items():
        if not isinstance(notice,Mapping) or notice.get('provider') not in state['modules'] or notice.get('user') not in state['modules']:
            raise ValueError('notice must name declared provider/user')
        if notice['provider'] not in state['modules'][notice['user']].get('uses',[]):raise ValueError('notice must follow declared use')
        if notice.get('status') not in ('pending','delivered-and-completed'):raise ValueError('unknown product notice state; receipt is not completion')
        if notice.get('status')=='pending' and (jid is None or notice['user']==jid):result.append(key)
    return result


def _priority(state,jid):
    value=state['jobs'][jid].get('priority',0)
    if type(value) is not int:raise ValueError('priority must be integer')
    if value:
        owner=[event for event in state.get('events',[]) if isinstance(event,Mapping)
               and event.get('kind')=='owner-control' and event.get('command')=='priority' and event.get('job')==jid]
        if not owner or str(owner[-1].get('value'))!=str(value):raise ValueError('priority override needs matching trusted owner-control event')
    return value


def plan_dispatch(state, *, observations, active_account_jobs=0, native_capacity=None):
    """Plan earliest ready reservations without launching or marking jobs running.

    active_account_jobs is the fresh account-wide total INCLUDING this run. Its
    default0 never undercounts local active reservations. native_capacity is free
    native execution capacity observed by the host, not a new owner cap.
    """
    cap,slots=validate_state(state)
    if not isinstance(observations,Mapping):raise ValueError('fresh observations mapping required')
    if type(active_account_jobs) is not int or active_account_jobs<0:raise ValueError('nonnegative actual account occupancy required')
    if native_capacity is not None and (type(native_capacity) is not int or native_capacity<0):raise ValueError('nonnegative free native capacity required')
    local=sum(job['status'] in ACTIVE for job in state['jobs'].values())
    account=max(active_account_jobs,local)
    free=max(0,min(slots-local,cap-account))
    if native_capacity is not None:free=min(free,native_capacity)
    result={'status':'hold' if state.get('stopped') else 'idle','dispatch':[], 'holds':[],
            'capacity':{'owner_cap':cap,'technical_slots':slots,'local_reserved':local,
                        'account_occupied':account,'free_native':native_capacity,'available':free},
            'pending_notices':pending_notices(state)}
    if state.get('stopped'):
        result.update(reason='durable_stop_preserved',stop_source=state.get('stop_source'));return result
    ready=sorted((key for key,job in state['jobs'].items() if job['status']=='ready'),
                 key=lambda key:(-_priority(state,key),state['modules'][key]['order'],key))
    for jid in ready:
        job=state['jobs'][jid];binding=binding_for(state,jid)
        if binding:
            observed,reason=observation_for(state,jid,observations)
            if reason:
                result['holds'].append({'job':jid,'reason':reason});continue
            if observed['activity']=='running':
                result['holds'].append({'job':jid,'reason':'existing_actor_still_running_inspect_before_new_attempt'});continue
        if len(result['dispatch'])>=free:
            result['holds'].append({'job':jid,'reason':'capacity_exhausted'});continue
        result['dispatch'].append({'action':'prepare','job':jid,'expected_attempt':job['attempt'],
                                   'next_attempt':job['attempt']+1,'preserve_branch':job.get('branch'),
                                   'preserve_pr':job.get('pr_number'),'notice_ids':pending_notices(state,jid),
                                   'requires_fresh_session_binding':True,'no_old_session_edit':True})
    if result['dispatch']:result['status']='dispatch'
    elif result['holds']:result['status']='hold'
    return result
