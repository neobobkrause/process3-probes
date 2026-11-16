"""Read-only native continuation assessment, not a scheduler or proof generator.

Trusted supervisor records live evidence under state['native_continuation']:
  findings: native capability -> {state, evidence, limitation?}
  dependencies: work key -> {confirmed: true, prerequisite: ..., evidence: ...}
  work: explicit assignment id -> {status: pending|running|blocked|done, evidence?}
Cycle.assess overlays the bounded workspace-local operational mailbox; routine
messages are not written back to GitHub recovery state. A legacy native_mailbox
field is a migration snapshot, not the current production message store.
Missing/unknown evidence remains investigation work. This module never manufactures
live proofs from fixture tests, job prose, a commit or a completed assistant turn.
"""
from dataclasses import asdict, dataclass
import re
from collections.abc import Mapping
from .capabilities import Finding, REQUIRED
from . import layout

SHA=re.compile(r'^[a-f0-9]{40}$')

@dataclass(frozen=True)
class Result:
    status: str
    runnable: tuple[str,...]
    blocked: tuple[str,...]
    demonstrated: tuple[str,...]
    unfinished_jobs: tuple[str,...]
    pending_messages: tuple[str,...]
    pending_controls: tuple[str,...]
    pending_notices: tuple[str,...]
    deferred_notices: tuple[str,...]
    reason: str

    def to_dict(self):return asdict(self)


def assess(state):
    if not isinstance(state,Mapping) or not isinstance(state.get('jobs'),dict):
        raise ValueError('native durable job state required')
    cap=state.get('owner_job_cap',8);slots=state.get('slots',1)
    if type(cap) is not int or type(slots) is not int or not 1<=slots<=cap<=8:
        raise ValueError('native concurrency exceeds current owner cap')
    record=state.get('native_continuation',{})
    if not isinstance(record,Mapping) or set(record)-{'findings','dependencies','work'}:
        raise ValueError('invalid native continuation record')
    findings=record.get('findings',{});dependencies=record.get('dependencies',{});work=record.get('work',{})
    if any(not isinstance(value,Mapping) for value in (findings,dependencies,work)):
        raise ValueError('native findings/dependencies/work must be mappings')
    if set(findings)-set(REQUIRED):raise ValueError('unknown or nonrequired native finding')
    parsed={}
    for key,value in findings.items():
        if not isinstance(value,Mapping) or set(value)-{'state','evidence','limitation'}:
            raise ValueError('invalid native finding')
        parsed[key]=Finding(**value)
    for key,value in dependencies.items():
        if not isinstance(key,str) or not isinstance(value,Mapping) or set(value)!={'confirmed','prerequisite','evidence'}:
            raise ValueError('dependency needs explicit confirmation, prerequisite and evidence')
        if type(value['confirmed']) is not bool or any(not isinstance(value[k],str) or not value[k].strip() for k in ('prerequisite','evidence')):
            raise ValueError('invalid native dependency')
    outstanding=[];never_block=set();demonstrated=[]
    for key in REQUIRED:
        finding=parsed.get(key)
        if finding and finding.state=='observed':demonstrated.append(key)
        else:
            item='capability:'+key;outstanding.append(item)
            if not finding or finding.state not in ('blocked','not_exposed'):never_block.add(item)
    # Adoption is not role startup evidence. A missing current binding remains
    # runnable recovery work even if old capability findings were observed.
    if layout.configured(state):
        for role in ('ROOT','ARCH','COORDINATOR'):
            if layout.current(state,role) is None:
                item='layout:'+role;outstanding.append(item);never_block.add(item)
    unfinished=[]
    for key,job in state['jobs'].items():
        if not isinstance(job,Mapping):raise ValueError('invalid native job')
        verification=job.get('verification') or {}
        accepted=(job.get('status')=='done' and job.get('accepted') is True
                  and job.get('last_outcome')=='completed' and type(job.get('pr_number')) is int and job['pr_number']>0
                  and isinstance(job.get('checkpoint'),str) and SHA.fullmatch(job['checkpoint'])
                  and isinstance(job.get('integrated'),str) and SHA.fullmatch(job['integrated'])
                  and isinstance(verification,Mapping) and type(verification.get('returncode')) is int and verification['returncode']==0
                  and type(verification.get('test_count')) is int and verification['test_count']>0
                  and any(event.get('kind')=='native-integrated' and event.get('job')==key
                          and event.get('checkpoint')==job['checkpoint'] and event.get('integration')==job['integrated']
                          for event in state.get('events',[]) if isinstance(event,Mapping)))
        if not accepted:unfinished.append(key);outstanding.append('job:'+key)
    mailbox=state.get('native_mailbox',{})
    if not isinstance(mailbox,Mapping):raise ValueError('invalid native mailbox')
    messages=mailbox.get('messages',{})
    if not isinstance(messages,Mapping):raise ValueError('invalid native mailbox')
    pending_messages=[]
    for key,message in messages.items():
        if not isinstance(message,Mapping):raise ValueError('invalid native message')
        if message.get('status')!='acknowledged':pending_messages.append(key);outstanding.append('message:'+key)
    pending_controls=[]
    for key,item in work.items():
        if not isinstance(key,str) or not isinstance(item,Mapping) or item.get('status') not in ('pending','running','blocked','done'):
            raise ValueError('explicit native work needs identity and valid status')
        if item['status']=='done':
            if not isinstance(item.get('evidence'),str) or not item['evidence'].strip():
                raise ValueError('completed explicit work needs actual evidence reference')
        else:pending_controls.append(key);outstanding.append('control:'+key)
    notices=[];deferred=[]
    for key,notice in state.get('notices',{}).items():
        if notice.get('status')!='delivered-and-completed':
            notices.append(key)
            if notice.get('user') not in state['jobs']:deferred.append(key)
            else:outstanding.append('notice:'+key)
    outstanding=tuple(dict.fromkeys(outstanding))
    blocked=tuple(key for key in outstanding if key not in never_block and dependencies.get(key,{}).get('confirmed') is True)
    runnable=tuple(key for key in outstanding if key not in blocked)
    if state.get('stopped') is True:
        status='owner_stopped' if state.get('stop_source')=='owner' else 'stopped'
        reason='Durable stop preserved; no dispatch is authorized by this assessment.'
        runnable=()
    elif runnable:status='continue';reason='Executable assignment, delivery or evidence investigation remains.'
    elif outstanding:status='external_blocked';reason='Each remaining item has an individually confirmed external prerequisite.'
    else:status='demonstrated';reason='Native acceptance evidence and accepted integrated assignments recorded; scope limited to supplied evidence.'
    return Result(status,runnable,blocked,tuple(demonstrated),tuple(unfinished),tuple(pending_messages),
                  tuple(pending_controls),tuple(notices),tuple(deferred),reason)
