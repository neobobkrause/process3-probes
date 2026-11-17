"""Pure recovery proposals; actual controller must recheck and execute each step.

No observation or passing test is converted into a completion record here.
"""
import re
from collections.abc import Mapping
from .scheduling import validate_state, binding_for, observation_for, pending_notices, current_job_parent

SHA=re.compile(r'^[a-f0-9]{40}$')


def _sha(value):return isinstance(value,str) and bool(SHA.fullmatch(value))


def accepted_checkpoint(job):
    verify=job.get('verification')
    return (job.get('accepted') is True and job.get('last_outcome')=='completed'
            and _sha(job.get('checkpoint')) and isinstance(verify,Mapping)
            and type(verify.get('returncode')) is int and verify['returncode']==0
            and type(verify.get('test_count')) is int and verify['test_count']>0
            and type(job.get('pr_number')) is int and job['pr_number']>0)


def _pr_plan(state,jid,observation):
    job=state['jobs'][jid];pr=observation.get('pr') if isinstance(observation,Mapping) else None
    if not accepted_checkpoint(job):return {'action':'inspect_acceptance','reason':'accepted_module_checkpoint_evidence_missing'}
    if not isinstance(pr,Mapping):return {'action':'observe_pr','reason':'fresh_exact_pr_state_required'}
    expected={'number':job['pr_number'],'head_ref':job.get('branch'),
              'base_ref':state.get('integration_branch'),'head_sha':job['checkpoint']}
    if any(pr.get(key)!=value for key,value in expected.items()):return {'action':'hold','reason':'stale_or_wrong_pr_identity_head_base'}
    if pr.get('state')=='MERGED':
        if not _sha(pr.get('integration_sha')) or pr.get('contains_head') is not True:
            return {'action':'observe_integration','reason':'exact_current_integration_and_ancestry_required'}
        return {'action':'reconcile_integration','expected_head':job['checkpoint'],
                'integration_sha':pr['integration_sha'],'requires_controller_recheck':True}
    if pr.get('state')=='OPEN':return {'action':'integrate','expected_head':job['checkpoint'],'requires_controller_recheck':True}
    return {'action':'hold','reason':'closed_unmerged_pr_preserve_for_ARCH'}


def reconcile_jobs(state, observations):
    """Return ordered proposals; observations keyed JOB:<id> never mutate state.

    PR recovery facts: pr={number,head_ref,base_ref,head_sha,state,
    integration_sha,contains_head}. They are independently observed host facts;
    a proposal still requires Cycle.integrate/record_integration rechecks.
    """
    validate_state(state)
    if not isinstance(observations,Mapping):raise ValueError('fresh observations mapping required')
    result={'status':'hold' if state.get('stopped') else 'idle','actions':[],'holds':[],
            'pending_notices':pending_notices(state),'deferred_notices':[]}
    result['deferred_notices']=[key for key in result['pending_notices']
                                if state['notices'][key]['user'] not in state['jobs']]
    if state.get('stopped'):
        result.update(reason='durable_stop_preserved',stop_source=state.get('stop_source'));return result
    for jid,job in sorted(state['jobs'].items(),key=lambda item:(item[1]['order'],item[0])):
        status=job['status'];base={'job':jid,'expected_attempt':job['attempt'],
                                 'preserve_branch':job.get('branch'),'preserve_pr':job.get('pr_number')}
        if status=='done':
            event=any(e.get('kind')=='native-integrated' and e.get('job')==jid
                      and e.get('checkpoint')==job.get('checkpoint') and e.get('integration')==job.get('integrated')
                      for e in state.get('events',[]) if isinstance(e,Mapping))
            if not (accepted_checkpoint(job) and _sha(job.get('integrated')) and event):
                result['actions'].append({**base,'action':'inspect_acceptance','reason':'done_is_not_itself_acceptance_proof'})
            continue
        if status=='review':
            result['actions'].append({**base,**_pr_plan(state,jid,observations.get('JOB:'+jid))});continue
        if status=='blocked':
            blockers=job.get('blocked_on',[])
            if not isinstance(blockers,list) or any(b not in state['modules'][jid].get('uses',[]) for b in blockers):
                raise ValueError('blocked_on must name declared providers')
            changed=[key for key in pending_notices(state,jid) if state['notices'][key]['provider'] in blockers]
            if changed:result['actions'].append({**base,'action':'review_blocker','notice_ids':changed,'reason':'provider_changed_reassess_recorded_blocker'})
            else:result['holds'].append({**base,'reason':'recorded_blocker_requires_ARCH_resolution'})
            continue
        if status not in ('running','interrupting','paused'):continue
        binding=binding_for(state,jid)
        if binding is None:
            result['actions'].append({**base,'action':'inspect_unbound_reservation','reason':'discover_actual_spawn_before_creating_duplicate'});continue
        observed,reason=observation_for(state,jid,observations)
        if reason:result['holds'].append({**base,'reason':reason});continue
        # Native conversation replacements do not create product attempts.
        # Legacy bindings used generation==attempt; newer ones must explicitly
        # retain which module attempt the native instance is bound to.
        session_generation=job.get('session_generation',job['attempt'])
        session_attempt=job.get('session_attempt',binding['generation'])
        if (type(session_generation) is not int or type(session_attempt) is not int
                or session_generation!=binding['generation'] or session_attempt!=job['attempt']):
            result['actions'].append({**base,'action':'inspect_unbound_reservation','reason':'old_attempt_must_not_receive_edit_instructions'});continue
        if not current_job_parent(state,jid):
            result['actions'].append({**base,'action':'interrupt' if observed['activity']=='running' else 'preserve_then_replace',
                                      'target':binding['target'],'generation':binding['generation'],
                                      'reason':'obsolete_ARCH_binding_must_not_receive_edit_instructions',
                                      'requires_checkpoint_before_replacement':True})
            continue
        if observed['activity']=='running':
            action='interrupt' if status in ('interrupting','paused') else 'retain'
            result['actions'].append({**base,'action':action,'target':binding['target'],'generation':binding['generation'],
                                      'requires_actual_interruption_result':action=='interrupt'});continue
        if observed['activity']=='idle' and status=='running':
            result['actions'].append({**base,'action':'inspect_result','target':binding['target'],
                                      'reason':'turn_ended_not_assignment_completion'});continue
        if status=='paused' and _sha(job.get('checkpoint')) and job.get('last_outcome')=='interrupted':
            result['actions'].append({**base,'action':'prepare_replacement','next_attempt':job['attempt']+1,
                                      'requires_fresh_session_binding':True});continue
        result['actions'].append({**base,'action':'preserve_then_replace','next_attempt':job['attempt']+1,
                                  'requires_checkpoint_before_replacement':True,
                                  'reason':'unfinished_work_must_survive_interruption_or_missing_actor'})
    if result['actions']:result['status']='reconcile'
    elif result['holds']:result['status']='hold'
    return result
