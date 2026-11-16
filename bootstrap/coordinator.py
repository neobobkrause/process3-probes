#!/usr/bin/env python3
"""Process4 probe: GitHub-backed control, subscription Codex subprocesses, no Actions."""
import argparse
import base64
import copy
import json
import os
from pathlib import Path
import re
import signal
import subprocess
import time
import uuid

REPO = 'neobobkrause/process3-probes'
STATE_PATH = 'bootstrap-state.json'
IDENT = re.compile(r'^[a-z][a-z0-9-]{0,48}$')


class StateConflict(RuntimeError):
    pass


def run(argv, cwd=None, **kw):
    kw.setdefault('timeout',45)
    return subprocess.run(argv, cwd=cwd, text=True, capture_output=True, check=True, **kw).stdout.strip()


class GitHub:
    """Contents API blob SHA is an optimistic compare-and-swap; never force push."""
    def __init__(self, branch):
        if not branch.startswith('codex/p4-state-'):
            raise ValueError('state must use a dedicated codex/p4-state-* branch')
        self.branch = branch

    def api(self, path, method='GET', body=None):
        args = ['gh', 'api', f'repos/{REPO}/{path}', '--method', method]
        if body is not None:
            args += ['--input', '-']
        out = run(args, input=json.dumps(body) if body is not None else None)
        return json.loads(out) if out else {}

    def read(self):
        r = self.api(f'contents/{STATE_PATH}?ref={self.branch}')
        return json.loads(base64.b64decode(r['content'])), r['sha']

    def write(self, state, sha):
        body = dict(message='Process4 bootstrap state', branch=self.branch,
                    content=base64.b64encode((json.dumps(state, indent=2)+'\n').encode()).decode())
        if sha:
            body['sha'] = sha
        try:
            return self.api(f'contents/{STATE_PATH}', 'PUT', body)
        except subprocess.CalledProcessError as exc:
            if '409' in exc.stderr: raise StateConflict('GitHub state changed; reread before retry') from exc
            raise

    def init(self, base):
        commit = self.api(f'commits/{base}')['sha']
        self.api('git/refs', 'POST', {'ref': 'refs/heads/'+self.branch, 'sha': commit})
        self.write(empty(), None)

    def mutate(self, action):
        # Only pure state actions are retried, always after a fresh read.
        for attempt in range(3):
            state, sha = self.read()
            action(state)
            try:
                self.write(state, sha)
                return state
            except StateConflict:
                if attempt==2: raise


def empty():
    return dict(version=1, stopped=False, slots=1, lease=None, modules={}, jobs={}, notices={}, instructions=[],
                roles={'ROOT': 'liveness/recovery', 'watcher': 'ROOT replacement',
                       'coordinator': 'owner control and reporting', 'ARCH': 'dispatch and technical assignments'},
                events=[])


def event(s, kind, **data):
    s['events'].append(dict(at=time.time(), kind=kind, **data))


def add(s, spec):
    jid = spec['id']
    if not IDENT.fullmatch(jid) or jid in s['jobs']:
        raise ValueError('invalid or duplicate job id')
    if not spec.get('prompt') or not spec.get('completion') or not spec.get('paths'):
        raise ValueError('prompt, completion description and owned paths required')
    if not isinstance(spec.get('verify'), list) or not spec['verify'] or not all(isinstance(x,str) for x in spec['verify']):
        raise ValueError('verify must be a nonempty argv array')
    for p in spec['paths']:
        if Path(p).is_absolute() or '..' in Path(p).parts or p.startswith(('.git', 'bootstrap/', 'process/')):
            raise ValueError('job paths must be relative module files, outside bootstrap/process')
    if not isinstance(spec.get('order'), int):
        raise ValueError('module order integer required')
    j = copy.deepcopy(spec)
    j.update(status='ready', attempt=0, branch=None, instructions=[], checkpoint=None)
    declare(s, {k: spec.get(k, []) for k in ('id','order','paths','uses')})
    s['jobs'][jid] = j
    event(s, 'assignment', job=jid)


def declare(s, module):
    mid=module['id']
    if not IDENT.fullmatch(mid):
        raise ValueError('invalid module id')
    s['modules'][mid]=copy.deepcopy(module)


def ready(s):
    if s['stopped']:
        return []
    return sorted((j for j in s['jobs'].values() if j['status']=='ready'),
                  key=lambda j: (-j.get('priority',0), j['order'], j['id']))


def notify(s, provider, commit):
    # Every declared user, including users without an open job. No interface filter.
    for user in s['modules'].values():
        if provider in user.get('uses', []):
            key = f'{provider}:{commit}:{user["id"]}'
            s['notices'].setdefault(key, dict(provider=provider, user=user['id'], commit=commit, status='pending'))
            if user['id'] in s['jobs'] and s['jobs'][user['id']]['status']=='done':
                s['jobs'][user['id']]['status']='ready'


def control(s, command, job=None, value=None):
    if command=='stop':
        s['stopped'] = True
    elif command=='continue':
        s['stopped'] = False
    elif command=='slots':
        if not 1 <= int(value) <= 8:
            raise ValueError('slots must be 1..8 across this probe account scheduler')
        s['slots'] = int(value)
    elif command=='instruction':
        s['instructions'].append(dict(at=time.time(), text=value))
        targets=[s['jobs'][job]] if job else list(s['jobs'].values())
        for j in targets:
            j['instructions'].append(value)
            if j['status']=='running':
                j['status']='interrupting'; j['restart']=True
    elif command=='priority':
        s['jobs'][job]['priority'] = int(value)
    elif command in ('interrupt','replace','retry'):
        j=s['jobs'][job]
        j['status'] = 'interrupting' if j['status'] in ('running','interrupting') else 'paused'
        j['restart'] = command != 'interrupt'
        if command != 'interrupt' and j['status']=='paused':
            j['status']='ready'
    event(s, 'owner-control', command=command, job=job, value=value)


def codex_env():
    env=os.environ.copy()
    for k in ('OPENAI_API_KEY','CODEX_API_KEY','OPENAI_BASE_URL'):
        env.pop(k,None)
    return env


# The coordinator owns GitHub and deployment credentials. Model jobs do not.
# This removes obvious environment inheritance but is NOT full isolation:
# the trusted host must also deny credential files, direct provider network
# routes, Git credential helpers, and unauthorized system calls.
JOB_SECRET_KEYS = frozenset({
    'GH_TOKEN', 'GITHUB_TOKEN', 'GH_ENTERPRISE_TOKEN', 'GITHUB_PERSONAL_ACCESS_TOKEN',
    'CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID', 'CF_TOKEN', 'CF_ACCT',
    'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_SESSION_TOKEN',
    'BIO_RELEASE_SEED', 'BIO_ADMIN_TOKEN', 'BIO_MEMBER_TOKEN',
    'GIT_ASKPASS', 'SSH_ASKPASS', 'SSH_AUTH_SOCK', 'GIT_SSH_COMMAND'
})


def restricted_job_env(parent):
    env = {k: v for k, v in parent.items()
           if k not in JOB_SECRET_KEYS and not k.startswith(('GIT_CONFIG_', 'GH_', 'GITHUB_', 'CLOUDFLARE_', 'AWS_'))}
    return env


def auth():
    env=codex_env()
    # CLI currently writes status to stderr on some releases.
    r=subprocess.run(['codex','login','status'],env=env,text=True,capture_output=True)
    if r.returncode or 'Logged in using ChatGPT' not in r.stdout+r.stderr:
        raise RuntimeError('ChatGPT subscription login required; API authentication refused')
    return env


class Supervisor:
    def __init__(self, store, repo, runtime, ttl=90):
        self.store, self.repo, self.runtime=store, Path(repo).resolve(), Path(runtime).resolve()
        self.runtime.mkdir(parents=True, exist_ok=True)
        remote=run(['git','remote','get-url','origin'],self.repo)
        if remote.rstrip('/').removesuffix('.git') != 'https://github.com/'+REPO:
            raise ValueError('only process3-probes is writable')
        self.owner=str(uuid.uuid4())
        self.ttl=ttl
        self.live={}
        self.env=None

    def claim(self):
        def change(s):
            lease=s['lease']
            if lease and lease['until']>time.time() and lease['owner']!=self.owner:
                raise RuntimeError('another supervisor holds the lease')
            for j in s['jobs'].values():
                if j['status'] in ('running','interrupting'):
                    j['status']='ready'
                    event(s,'recover-unfinished',job=j['id'],checkpoint=j['checkpoint'])
            s['lease']=dict(owner=self.owner,until=time.time()+self.ttl)
        self.store.mutate(change)

    def workspace(self,j):
        path=self.runtime/f'{j["id"]}-{j["attempt"]}'
        if not path.exists():
            branch=j['branch']
            run(['git','fetch','origin',branch],self.repo)
            run(['git','worktree','add','--detach',str(path),'FETCH_HEAD'],self.repo)
        return path

    def local_branch(self,branch):
        return subprocess.run(['git','show-ref','--verify','--quiet','refs/heads/'+branch],cwd=self.repo).returncode==0

    def start(self,j,s):
        path=self.workspace(j)
        prompt=(f'You are a Process4 module job for {j["id"]}. Work only in {j["paths"]}. '
                'Never merge, deploy, start sessions, edit approvals, bootstrap or process files. '
                'Do not expose credentials. Do not modify main or repository settings. '
                'Write your own module tests where needed. Do not add product-test stages. '
                'Leave changes in this workspace; the supervisor checkpoints them. '
                f'Assignment: {j["prompt"]}\nCompletion: {j["completion"]}\n'
                f'Previous checkpoint: {j["checkpoint"]}; attempt {j["attempt"]}. '
                'Read existing work and continue unfinished work; do not claim it done without meeting completion.\n'
                f'Owner instructions (verbatim): {json.dumps(j["instructions"])}\n'
                f'Provider notices: {json.dumps({k:n for k,n in s["notices"].items() if k in j.get("notice_ids",[])})}')
        log=open(self.runtime/f'{j["id"]}-{j["attempt"]}.jsonl','w')
        err=open(self.runtime/f'{j["id"]}-{j["attempt"]}.stderr','w')
        argv=['codex','exec','--ignore-user-config','--json','-c','forced_login_method="chatgpt"',
              '-C',str(path),'-s','workspace-write',prompt]
        p=subprocess.Popen(argv,stdin=subprocess.DEVNULL,stdout=log,stderr=err,env=restricted_job_env(self.env),start_new_session=True)
        self.live[j['id']]=(p,log,err,path,time.monotonic())

    def checkpoint(self,j,path):
        for owned in j['paths']:
            if (path/owned).exists() or run(['git','ls-files','--',owned],path):
                run(['git','add','-A','--',owned],path)
        if subprocess.run(['git','diff','--cached','--quiet'],cwd=path).returncode:
            run(['git','-c','user.name=Process4 bootstrap','-c','user.email=process4@users.noreply.github.com',
                 'commit','-m',f'Checkpoint {j["id"]} attempt {j["attempt"]}'],path)
        sha=run(['git','rev-parse','HEAD'],path)
        run(['git','push','origin','HEAD:refs/heads/'+j['branch']],path)
        return sha

    def tick(self, dispatch=True):
        s,sha=self.store.read()
        if not s['lease'] or s['lease']['owner']!=self.owner or s['lease']['until']<=time.time():
            raise RuntimeError('supervisor lease lost; refusing launches')
        s['lease']['until']=time.time()+self.ttl
        starts=[]
        finished=[]
        for jid,(p,log,err,path,began) in list(self.live.items()):
            j=s['jobs'][jid]
            interrupted=s['stopped'] or j['status']=='interrupting'
            timed_out=time.monotonic()-began > j.get('timeout',180)
            if interrupted or timed_out:
                self.terminate(p)
            rc=p.poll()
            if rc is None:
                lines=(self.runtime/f'{jid}-{j["attempt"]}.jsonl').read_text().splitlines()
                j['progress']={'event_count':len(lines),'elapsed_seconds':int(time.monotonic()-began)}
                for line in lines:
                    try:
                        e=json.loads(line)
                        if e.get('type')=='thread.started': j['thread_id']=e['thread_id']
                        j['progress']['last_event_type']=e.get('type')
                    except ValueError: pass
                continue
            log.close(); err.close()
            # Persist branch before declaring completion, even for failed/interrupted sessions.
            commit=self.checkpoint(j,path)
            if commit!=j['checkpoint']:
                # Initial base checkpoint is not a provider change.
                if commit!=j['base']:
                    notify(s,jid,commit)
            j['checkpoint']=commit
            events=[]
            for line in (self.runtime/f'{jid}-{j["attempt"]}.jsonl').read_text().splitlines():
                try: events.append(json.loads(line))
                except ValueError: pass
            completed=any(e.get('type')=='turn.completed' for e in events)
            verified=False
            if rc==0 and completed and not interrupted and not timed_out:
                try:
                    v=subprocess.run(j['verify'],cwd=path,text=True,capture_output=True,timeout=60)
                    verified=v.returncode==0
                    j['verification']={'returncode':v.returncode,'stdout':v.stdout[-2000:],'stderr':v.stderr[-2000:]}
                except (subprocess.TimeoutExpired,OSError) as exc:
                    j['verification']={'error':type(exc).__name__}
            j['status']='done' if verified else ('paused' if interrupted else 'blocked')
            if interrupted and j.pop('restart',False) and not s['stopped']:
                j['status']='ready'
            j['last_result']=dict(returncode=rc,turn_completed=completed,verified=verified,timed_out=timed_out)
            if verified:
                for n in s['notices'].values():
                    if n in [s['notices'][k] for k in j.get('notice_ids',[])]: n['status']='delivered-and-completed'
                if any(n['user']==jid and n['status']=='pending' for n in s['notices'].values()):
                    j['status']='ready'
            event(s,'job-result',job=jid,status=j['status'],**j['last_result'])
            finished.append(jid)
        capacity=s['slots']-(len(self.live)-len(finished))
        for j in (ready(s)[:max(0,capacity)] if dispatch else []):
            if not j['branch']:
                j['branch']=f'codex/p4-job-{self.store.branch.removeprefix("codex/p4-state-")}-{j["id"]}'
                base=run(['git','rev-parse','HEAD'],self.repo)
                try:
                    self.store.api('git/refs','POST',{'ref':'refs/heads/'+j['branch'],'sha':base})
                except subprocess.CalledProcessError as exc:
                    if '422' not in exc.stderr: raise
                    existing=self.store.api('git/ref/heads/'+j['branch'])['object']['sha']
                    if existing!=base: raise RuntimeError('existing unreserved job branch differs from base')
                j['base']=base
            j['notice_ids']=[k for k,n in s['notices'].items() if n['user']==j['id'] and n['status']=='pending']
            j['attempt']+=1
            j['status']='running'
            event(s,'dispatch',job=j['id'],attempt=j['attempt'],branch=j['branch'])
            starts.append(copy.deepcopy(j))
        self.store.write(s,sha) # reservation must be durable before launch
        for jid in finished: del self.live[jid]
        for j in starts:
            self.start(j,s)
        return s

    @staticmethod
    def terminate(p):
        if p.poll() is None:
            os.killpg(p.pid,signal.SIGTERM)
            try: p.wait(timeout=5)
            except subprocess.TimeoutExpired:
                os.killpg(p.pid,signal.SIGKILL); p.wait()

    def serve(self,seconds,interval=15):
        self.env=auth()
        self.claim()
        until=time.monotonic()+seconds
        try:
            while time.monotonic()<until:
                try: s=self.tick()
                except StateConflict:
                    print('Concurrent control received; rereading GitHub state.',flush=True)
                    time.sleep(1)
                    continue
                print(json.dumps({'jobs':{k:v['status'] for k,v in s['jobs'].items()},'stopped':s['stopped']}),flush=True)
                if not self.live and not ready(s): break
                time.sleep(interval)
        finally:
            for p,*_ in self.live.values(): self.terminate(p)
            # Final tick checkpoints terminated work; no further launches after bounded run.
            if self.live:
                def pause(s):
                    for jid in self.live:
                        if s['jobs'][jid]['status']=='running': s['jobs'][jid]['status']='interrupting'
                self.store.mutate(pause)
                try: self.tick(dispatch=False)
                except Exception as exc: print('Final checkpoint failed; recover from last GitHub checkpoint:',type(exc).__name__,flush=True)
            def release(s):
                if s['lease'] and s['lease']['owner']==self.owner:
                    s['lease']=None
            self.store.mutate(release)


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--state',required=True)
    sub=p.add_subparsers(dest='cmd',required=True)
    init=sub.add_parser('init'); init.add_argument('--base',required=True)
    a=sub.add_parser('assign'); a.add_argument('file')
    m=sub.add_parser('declare'); m.add_argument('file')
    sub.add_parser('status')
    c=sub.add_parser('control'); c.add_argument('action',choices=['stop','continue','slots','instruction','priority','interrupt','replace','retry']); c.add_argument('--job'); c.add_argument('--value')
    d=sub.add_parser('serve'); d.add_argument('--repo',default='.'); d.add_argument('--runtime',required=True); d.add_argument('--seconds',type=int,default=300); d.add_argument('--interval',type=int,default=15)
    args=p.parse_args(); store=GitHub(args.state)
    if args.cmd=='init': store.init(args.base)
    elif args.cmd=='assign': store.mutate(lambda s:add(s,json.loads(Path(args.file).read_text())))
    elif args.cmd=='control': store.mutate(lambda s:control(s,args.action,args.job,args.value))
    elif args.cmd=='declare': store.mutate(lambda s:declare(s,json.loads(Path(args.file).read_text())))
    elif args.cmd=='status': print(json.dumps(store.read()[0],indent=2))
    elif args.cmd=='serve': Supervisor(store,args.repo,args.runtime).serve(args.seconds,args.interval)

if __name__=='__main__': main()
