#!/usr/bin/env python3
"""Bounded standing-role turns. JSON intents are checked by the host, never shell-evaluated.

This is bootstrap machinery, not proof of permanent hosting or permission isolation.
"""
import argparse
import json
from pathlib import Path
import subprocess
import time
import uuid

import coordinator as c

ROLES = ('ROOT', 'watcher', 'ARCH', 'coordinator', 'PROCESS')
CHILDREN = {'ROOT': {'watcher', 'ARCH', 'coordinator', 'PROCESS'},
            'watcher': {'ROOT'}, 'ARCH': set(), 'coordinator': set(), 'PROCESS': set()}


def enroll(s, role, reason, replace=False):
    if role not in ROLES:
        raise ValueError('unknown role')
    sessions = s.setdefault('role_sessions', {})
    previous = sessions.get(role)
    if previous and not replace:
        return
    if previous and previous['status'] == 'running':
        raise ValueError('cannot replace a live turn; wait for timeout or host-loss recovery')
    generation = previous['generation'] + 1 if previous else 1
    sessions[role] = dict(generation=generation, status='ready', timeout=180,
                          reason=reason, next_wake=0, thread_id=None)
    c.event(s, 'role-enrolled', role=role, generation=generation, reason=reason)


def apply(s, actor, packet):
    """Called inside a CAS transaction; packets contain data, never executable commands."""
    if actor not in ROLES or not isinstance(packet, dict) or set(packet) != {'summary', 'actions'}:
        raise ValueError('invalid role packet')
    if not isinstance(packet['summary'], str) or not isinstance(packet['actions'], list):
        raise ValueError('invalid role packet types')
    if len(packet['actions']) > 16:
        raise ValueError('too many role actions')
    for a in packet['actions']:
        if not isinstance(a, dict) or set(a) != {'kind', 'target', 'text', 'timeout'}:
            raise ValueError('invalid action shape')
        kind, target = a['kind'], a['target']
        if target not in ROLES or not isinstance(a['text'], str):
            raise ValueError('invalid action target or text')
        if type(a['timeout']) is not int or not 30 <= a['timeout'] <= 600:
            raise ValueError('invalid timeout')
        if kind in ('message','request-process'):
            # PROCESS routing stays explicit: job -> ARCH is handled by job state;
            # ARCH -> coordinator -> PROCESS is preserved here.
            routes = {'ROOT': set(ROLES)-{'ROOT'}, 'watcher': {'ROOT'},
                      'ARCH': {'ROOT', 'coordinator'},
                      'coordinator': {'ROOT', 'ARCH', 'PROCESS'}, 'PROCESS': {'coordinator', 'ROOT'}}
            if target not in routes[actor]:
                raise ValueError('message route forbidden')
            if kind=='request-process' and (actor,target)!=('ARCH','ROOT'):
                raise ValueError('only ARCH requests PROCESS from ROOT')
            s.setdefault('role_messages', []).append(dict(id=str(uuid.uuid4()), at=time.time(),
                sender=actor, target=target, text=a['text'], kind=kind, status='pending'))
            if target in s.get('role_sessions', {}):
                s['role_sessions'][target]['next_wake']=0
        elif kind in ('start', 'replace', 'configure'):
            if s['stopped'] or target not in CHILDREN[actor]:
                raise ValueError('role lifecycle action forbidden')
            if target == 'PROCESS' and not any(m['sender']=='ARCH' and m['target']=='ROOT'
                    and m.get('kind')=='request-process' and m['status']=='pending'
                    for m in s.get('role_messages', [])):
                raise ValueError('PROCESS requires an ARCH request to ROOT')
            if kind == 'configure':
                s['role_sessions'][target]['timeout'] = a['timeout']
            else:
                enroll(s, target, a['text'], replace=kind=='replace')
                s['role_sessions'][target]['timeout'] = a['timeout']
        else:
            raise ValueError('unknown action')
    c.event(s, 'role-actions', actor=actor, summary=packet['summary'], count=len(packet['actions']))


def response(log):
    events = [json.loads(line) for line in log.splitlines() if line.strip()]
    if not any(e.get('type') == 'turn.completed' for e in events):
        raise ValueError('no completed inference turn')
    messages = [e['item']['text'] for e in events if e.get('type') == 'item.completed'
                and e.get('item', {}).get('type') == 'agent_message']
    if not messages:
        raise ValueError('no final role packet')
    return json.loads(messages[-1]), next((e['thread_id'] for e in events
                                         if e.get('type') == 'thread.started'), None)


def recover(s):
    lease=s.get('role_lease')
    if not lease or lease['until']>time.time(): return
    for role,r in s.get('role_sessions',{}).items():
        if r['status']=='running':
            r.update(status='blocked',blocker='Host lost before durable result; parent must replace')
            parent='watcher' if role=='ROOT' else 'ROOT'
            if parent in s['role_sessions']: s['role_sessions'][parent]['next_wake']=0
            c.event(s,'role-host-loss',role=role,generation=r['generation'])
    s['role_lease']=None


class Runtime:
    def __init__(self, store, repo, runtime):
        self.store, self.repo, self.runtime = store, Path(repo).resolve(), Path(runtime).resolve()
        if c.run(['git','remote','get-url','origin'], self.repo).removesuffix('.git') != 'https://github.com/'+c.REPO:
            raise ValueError('only probe repository allowed')
        self.runtime.mkdir(parents=True, exist_ok=True)
        self.owner = str(uuid.uuid4())

    def turn(self, role):
        env = c.auth()
        now = time.time()
        def reserve(s):
            if s['stopped']:
                raise RuntimeError('account stopped')
            lease = s.get('role_lease')
            if lease and lease['until'] > now:
                raise RuntimeError('role runtime already active')
            recover(s)
            r = s['role_sessions'][role]
            if r['status'] != 'ready' or r['next_wake'] > now:
                raise RuntimeError('role not ready or wake not due')
            r['status']='running'
            s['role_lease']=dict(owner=self.owner, until=now+r['timeout']+30)
            c.event(s,'role-turn-start',role=role,generation=r['generation'])
        state = self.store.mutate(reserve)
        r = state['role_sessions'][role]
        prefix=self.runtime/f'{role}-{r["generation"]}-{int(now)}'
        packet_ids=[m['id'] for m in state.get('role_messages',[]) if m['target']==role and m['status']=='pending']
        prompt = ('You are the Process4 bootstrap '+role+' role. '
            'Do not build, write files, run commands, start subprocesses, change process or approvals, '
            'merge, deploy, use metered inference, or expose credentials. Return ONLY JSON: '
            '{"summary":"...","actions":[{"kind":"start|replace|configure|message|request-process",'
            '"target":"ROOT|watcher|ARCH|coordinator|PROCESS","text":"reason or message",'
            '"timeout":180}]}. Host validates all actions. No product decisions. '
            'ROOT should start missing ARCH/coordinator/watcher; replace failed children. '
            'Watcher replaces failed ROOT only; no role replaces itself. PROCESS starts only '
            'after ARCH sends ROOT an explicit request-process action. Other roles report status and route process faults. '
            'These turns are bounded bootstrap rehearsals, not permanent hosting. '
            'Use actions=[] if no authorized work is needed. Requirements: '
            +(self.repo/'bootstrap/REQUIREMENTS.md').read_text()+'\nDurable state: '+json.dumps(state))
        argv=['codex','exec','--ignore-user-config','--json','-c','forced_login_method="chatgpt"',
              '-C',str(self.repo),'-s','read-only',prompt]
        packet=None; thread=None; failure=None
        with open(str(prefix)+'.jsonl','w') as log, open(str(prefix)+'.stderr','w') as err:
            p=subprocess.Popen(argv,stdin=subprocess.DEVNULL,stdout=log,stderr=err,
                               env=env,start_new_session=True)
            try:
                deadline=time.monotonic()+r['timeout']
                while p.poll() is None:
                    latest,_=self.store.read()
                    if latest['stopped'] or time.monotonic()>=deadline:
                        raise RuntimeError('role turn stopped or timed out')
                    time.sleep(1)
                if p.returncode:
                    raise RuntimeError('Codex exited '+str(p.returncode))
                packet,thread=response(Path(str(prefix)+'.jsonl').read_text())
            except Exception as exc:
                failure=str(exc)
            finally:
                c.Supervisor.terminate(p)
        def finish(s):
            if not s.get('role_lease') or s['role_lease']['owner']!=self.owner:
                raise RuntimeError('role lease lost; result not applied')
            current=s['role_sessions'][role]
            if current['generation']!=r['generation']:
                raise RuntimeError('stale role result')
            if failure or s['stopped']:
                current.update(status='blocked',blocker=failure or 'account stopped')
                parent='watcher' if role=='ROOT' else 'ROOT'
                if parent in s['role_sessions']:
                    s['role_sessions'][parent]['next_wake']=0
            else:
                apply(s,role,packet)
                current.update(status='ready',thread_id=thread,next_wake=time.time()+3600)
                for m in s.get('role_messages',[]):
                    if m['id'] in packet_ids: m['status']='delivered'
            s['role_lease']=None
            c.event(s,'role-turn-result',role=role,status=current['status'],thread_id=thread,failure=failure)
        try:
            self.store.mutate(finish)
        except (ValueError, KeyError) as exc:
            # Reject the whole packet, including earlier actions in it, atomically.
            failure='Rejected packet: '+str(exc)
            self.store.mutate(finish)

    def serve(self, seconds):
        deadline=time.monotonic()+seconds
        while time.monotonic()<deadline:
            s,_=self.store.read()
            if s['stopped']: return
            if s.get('role_lease') and s['role_lease']['until']<=time.time():
                s=self.store.mutate(recover)
            due=[role for role in ROLES if role in s.get('role_sessions', {})
                 and s['role_sessions'][role]['status']=='ready'
                 and s['role_sessions'][role]['next_wake']<=time.time()]
            if due:
                self.turn(due[0])
            else:
                # A provisioned host must keep running this loop for hourly wakes.
                time.sleep(min(5,max(0,deadline-time.monotonic())))


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--state',required=True); p.add_argument('--repo',default='.')
    p.add_argument('--runtime',required=True)
    p.add_argument('command',choices=['seed','turn','serve']); p.add_argument('--role',choices=ROLES,default='ROOT')
    p.add_argument('--seconds',type=int,default=300)
    a=p.parse_args(); store=c.GitHub(a.state)
    if a.command=='seed':
        def seed(s):
            if s['stopped']: raise RuntimeError('account stopped')
            enroll(s,'ROOT','Owner-authorized bootstrap entry role')
        store.mutate(seed)
    elif a.command=='turn': Runtime(store,a.repo,a.runtime).turn(a.role)
    else: Runtime(store,a.repo,a.runtime).serve(a.seconds)


if __name__=='__main__': main()
