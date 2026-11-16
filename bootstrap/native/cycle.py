#!/usr/bin/env python3
"""Native ARCH's bounded probe development controller.

This is a technical restriction of the current assignment, not a new owner grant.
Native session tools supply session outcomes; this file never launches inference.
All writes stay in probes' dedicated native state/job/integration branches.
Ownership checking is an integration control, not an extra product-test stage.
"""
import argparse
import hashlib
import base64
import copy
import json
import os
from pathlib import Path, PurePosixPath
import re
import subprocess
import sys
import tempfile
import time
from urllib.parse import quote

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import coordinator as c
from native import communication as communication
from native import continuation as native_continuation
from native import layout as native_layout
from grants.grants import Broker, Subject, Denied

REPO=c.REPO
FILE='native-cycle.json'
PREFIXES=('codex/p4-job-','codex/p4-state-native-','codex/p4-integration-')
PROTECTED={'.git','.github','.claude','.codex','.agents','.aws','.process','bootstrap','process','CLAUDE.md','AGENTS.md','.gitmodules'}
PROCESS_PIN='7a1b45dc97b0532f77b1300c11c5263682cfe7a5'
GITHUB_ACTIONS_APP_ID=15368
GATE_WORKFLOW_PATH='.github/workflows/process-gate.yml'
SHA=re.compile(r'^[a-f0-9]{40}$')


class Rejected(PermissionError): pass


def ref(value, kind=None):
    prefixes=(kind,) if kind else PREFIXES
    if not isinstance(value,str) or not any(value.startswith(p) for p in prefixes) or not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9._/-]*',value) or any(t in value for t in ('..','//','@{')) or value.endswith(('/','.lock')):
        raise Rejected('reference outside current native probe authority')
    return value


def path_name(value):
    if not isinstance(value,str) or not value or '\\' in value or value.startswith('/') or any(p in ('','.','..') for p in value.split('/')):
        raise Rejected('invalid module path')
    if any(p in PROTECTED for p in value.split('/')):
        raise Rejected('protected process/permission path')
    return value.rstrip('/')


def git(repo, *args, check=True):
    # Job-created hooks/fsmonitor never execute in the controller credential scope.
    return subprocess.run(['git','-c','core.hooksPath=/dev/null','-c','core.fsmonitor=false',*args],
                          cwd=repo,text=True,capture_output=True,check=check,timeout=60)


class NativeInstructionScope:
    """Technical restriction of standing instructions, NOT an approved policy.

    Reuses the grants Broker's deny-before-adapter path. Identity and evidence
    are supplied by supervisor code, never authenticated by CLI packet fields.
    This is not platform credential isolation or prevention of Python bypass.
    """
    schemas = {
        'github.branch.create': {'repo','branch','base'},
        'github.state.update': {'repo','branch'},
        'github.branch.update': {'repo','branch','head'},
        'github.pr.open': {'repo','head','base'},
        'github.pr.update': {'repo','head','base','pr'},
        'github.pr.merge_job': {'repo','head','base','pr','expected_head'},
    }

    def authorize(self, subject, operation, request, *, trusted=None):
        facts=trusted or {}
        if not isinstance(subject,Subject) or subject.session_id!='native-arch-controller' or subject.role!='ARCH' or subject.repo!=REPO:
            raise Denied('NATIVE_CONTROLLER_IDENTITY')
        if operation not in self.schemas or not isinstance(request,dict) or set(request)!=self.schemas[operation] or request.get('repo')!=REPO:
            raise Denied('NATIVE_OPERATION_SCOPE')
        try:
            if operation=='github.branch.create':
                ref(request['branch'])
                if not isinstance(request['base'],str) or not SHA.fullmatch(request['base']):raise Rejected('exact SHA')
            elif operation=='github.state.update':ref(request['branch'],'codex/p4-state-native-')
            elif operation=='github.branch.update':
                ref(request['branch'],'codex/p4-job-')
                if not isinstance(request['head'],str) or not SHA.fullmatch(request['head']):raise Rejected('exact SHA')
            else:
                ref(request['head'],'codex/p4-job-');ref(request['base'],'codex/p4-integration-')
                if 'pr' in request and (type(request['pr']) is not int or request['pr']<1):raise Rejected('PR identity')
                if operation=='github.pr.merge_job':
                    if not isinstance(request['expected_head'],str) or not SHA.fullmatch(request['expected_head']):raise Rejected('exact SHA')
                    if facts.get('observed_head')!=request['expected_head'] or not facts.get('existing_gate_green'):
                        raise Rejected('fresh gate/head required')
        except (Rejected,TypeError,KeyError):
            raise Denied('NATIVE_REFERENCE_OR_EVIDENCE') from None


class Provider:
    """Closed write methods; no public arbitrary API forwarding command."""
    def __init__(self, repo=REPO):
        if repo!=REPO: raise Rejected('only process3-probes is authorized')
        self.audit=[]

    def _api(self, path, method='GET', body=None):
        if method!='GET' or body is not None:
            self.audit.append({'operation':'untyped-api','outcome':'denied','reason':'TYPED_NATIVE_MUTATION_REQUIRED'})
            raise Denied('TYPED_NATIVE_MUTATION_REQUIRED')
        return self._request(path)

    def _perform(self, operation, request, adapter, facts=None):
        # Fixed supervisor identity, not a user-provided role/session claim.
        subject=Subject('native-arch-controller','ARCH',REPO)
        broker=Broker(NativeInstructionScope(),lambda *_:adapter(),
                      lambda sid:subject if sid==subject.session_id else None,
                      lambda *_:facts or {})
        try:result=broker.perform(subject.session_id,operation,request)
        except Denied as error:
            self.audit.append({'operation':operation,'request':request,'outcome':'denied','reason':error.reason});raise
        self.audit.append({'operation':operation,'request':request,'outcome':'adapter-returned'})
        return result

    def _request(self, path, method='GET', body=None):
        # Internal adapter transport; never exposed as an agent forwarding API.
        args=['gh','api','repos/'+REPO+'/'+path,'--method',method]
        if body is not None: args+=['--input','-']
        out=c.run(args,input=json.dumps(body) if body is not None else None)
        return json.loads(out) if out else {}

    def head(self, branch):
        ref(branch)
        return self._api('git/ref/heads/'+branch)['object']['sha']

    def resolve(self, source):
        # Read-only source resolution is not permission to mutate that ref.
        if not isinstance(source,str) or not (SHA.fullmatch(source) or source.startswith('codex/')) or '..' in source:
            raise Rejected('source must be a known experimental ref or exact commit')
        return self._api('commits/'+quote(source,safe=''))['sha']

    def ensure_branch(self, branch, sha):
        ref(branch)
        if not SHA.fullmatch(sha): raise Rejected('exact base SHA required')
        try:
            existing=self.head(branch)
        except subprocess.CalledProcessError as error:
            if '404' not in (error.stderr or ''): raise
        else:
            if existing!=sha: raise Rejected('existing unreserved branch differs; never reset it')
            return
        self._perform('github.branch.create',{'repo':REPO,'branch':branch,'base':sha},
                      lambda:self._request('git/refs','POST',{'ref':'refs/heads/'+branch,'sha':sha}))

    def read_state(self, branch):
        ref(branch,'codex/p4-state-native-')
        data=self._api('contents/'+FILE+'?ref='+quote(branch,safe=''))
        return json.loads(base64.b64decode(data['content'])),data['sha']

    def write_state(self, branch, state, sha):
        ref(branch,'codex/p4-state-native-')
        body={'branch':branch,'message':'Process4 native cycle state',
              'content':base64.b64encode((json.dumps(state,indent=2)+'\n').encode()).decode()}
        if sha: body['sha']=sha
        try: self._perform('github.state.update',{'repo':REPO,'branch':branch},
                           lambda:self._request('contents/'+FILE,'PUT',body))
        except subprocess.CalledProcessError as error:
            if any(code in (error.stderr or '') for code in ('409','422')): raise c.StateConflict('native state changed; reread') from error
            raise

    def push(self, workspace, branch, sha):
        ref(branch,'codex/p4-job-')
        if not SHA.fullmatch(sha): raise Rejected('exact checkpoint SHA required')
        # Validate effective push destinations after Git URL rewrite rules on
        # EVERY push, not merely the checkout's fetch URL at construction.
        destinations=git(workspace,'remote','get-url','--push','--all','origin').stdout.splitlines()
        allowed={'https://github.com/'+REPO,'https://github.com/'+REPO+'.git'}
        if len(destinations)!=1 or destinations[0] not in allowed:
            raise Rejected('effective push destination is not the single approved probes repository')
        self._perform('github.branch.update',{'repo':REPO,'branch':branch,'head':sha},
                      lambda:git(workspace,'-c','remote.origin.mirror=false','-c','push.followTags=false',
                                 'push','--no-follow-tags','--recurse-submodules=no','origin',sha+':refs/heads/'+branch))

    def draft_pr(self, job, base):
        head=ref(job['branch'],'codex/p4-job-'); ref(base,'codex/p4-integration-')
        prs=json.loads(c.run(['gh','pr','list','--repo',REPO,'--head',head,'--state','all',
                             '--json','number,url,state,isDraft,baseRefName,headRefName']))
        opened=[pr for pr in prs if pr['state']=='OPEN']
        if len(opened)>1: raise Rejected('multiple open job PRs; preserve for ARCH')
        if any(pr['baseRefName']!=base or pr['headRefName']!=head for pr in prs):
            raise Rejected('existing PR scope differs; preserve for ARCH')
        if opened: return opened[0]
        if any(pr['state']!='MERGED' for pr in prs):
            raise Rejected('closed unmerged job PR requires ARCH decision; never reopen/reset it')
        # A later round uses the same branch, preserving merged historical PRs,
        # and opens at most one new PR for its new accepted checkpoint.
        body=('Native Process4 module '+job['id']+'. '+job['completion']+'\n\n'
              'Controller checkpoint '+job['checkpoint']+'. Module tests and native session outcome '
              'are recorded on the native state branch. Keep draft pending ARCH integration through '
              'the existing process merge tool. No main merge, grant changes, or new product-test stage.')
        url=self._perform('github.pr.open',{'repo':REPO,'head':head,'base':base},lambda:c.run(['gh','pr','create','--repo',REPO,'--base',base,'--head',head,'--draft',
                   '--title','Process4 native module: '+job['id'],'--body-file','-'],input=body))
        # Read provider identity rather than infer a PR number from an arbitrary URL.
        return json.loads(c.run(['gh','pr','view',url,'--repo',REPO,'--json','number,url,state,isDraft,baseRefName,headRefName']))

    def pr_info(self, number):
        if type(number) is not int or number<1: raise Rejected('invalid PR identity')
        return json.loads(c.run(['gh','pr','view',str(number),'--repo',REPO,'--json',
            'number,url,state,isDraft,baseRefName,headRefName,headRefOid,statusCheckRollup,mergeCommit']))

    def gate_green(self, head):
        """Existing process gate, authenticated by source app/workflow and SHA.

        A commit status named 'gate' or a foreign application's check is never
        accepted. The pinned merge tool still independently repeats its required
        check/source/head controls; this method adds no product-test stage.
        """
        if not isinstance(head,str) or not SHA.fullmatch(head):
            raise Rejected('exact accepted head SHA required for process gate')
        response=self._api('commits/'+head+'/check-runs?check_name=gate&filter=latest&per_page=100')
        checks=response.get('check_runs',[])
        if response.get('total_count',len(checks))>len(checks):return False
        candidates=[check for check in checks if check.get('name')=='gate'
                    and check.get('head_sha')==head
                    and check.get('app',{}).get('id')==GITHUB_ACTIONS_APP_ID
                    and type(check.get('check_suite',{}).get('id')) is int]
        if not candidates:return False
        runs_response=self._api('actions/runs?head_sha='+head+'&per_page=100')
        runs=runs_response.get('workflow_runs',[])
        if runs_response.get('total_count',len(runs))>len(runs):return False
        suites={run['check_suite_id'] for run in runs
                if run.get('head_sha')==head and run.get('path')==GATE_WORKFLOW_PATH
                and run.get('repository',{}).get('full_name',REPO)==REPO
                and type(run.get('check_suite_id')) is int}
        sourced=[check for check in candidates if check['check_suite']['id'] in suites]
        if not sourced:return False
        # Never let an older success override a newer pending/failed rerun from
        # the same actual process-gate source.
        latest=max(sourced,key=lambda check:check.get('id',-1))
        return latest.get('status')=='completed' and latest.get('conclusion')=='success'

    def ready_pr(self, number):
        if type(number) is not int or number<1: raise Rejected('invalid PR identity')
        pr=self.pr_info(number)
        return self._perform('github.pr.update',{'repo':REPO,'head':pr['headRefName'],'base':pr['baseRefName'],'pr':number},
                             lambda:c.run(['gh','pr','ready',str(number),'--repo',REPO]))

    def merge_with_pinned_tool(self, repo, number):
        pinned=git(repo,'rev-parse','HEAD:.process').stdout.strip()
        actual=git(Path(repo)/'.process','rev-parse','HEAD').stdout.strip()
        if pinned!=PROCESS_PIN or actual!=PROCESS_PIN or git(Path(repo)/'.process','status','--porcelain').stdout:
            raise Rejected('existing immutable process pin/tool not available cleanly')
        # This stock tool rechecks PR scope, required checks and expected head
        # and uses the SHA-conditional merge route. No direct merge API fallback.
        pr=self.pr_info(number)
        request={'repo':REPO,'head':pr['headRefName'],'base':pr['baseRefName'],'pr':number,'expected_head':pr['headRefOid']}
        facts={'observed_head':self.head(pr['headRefName']),'existing_gate_green':self.gate_green(pr['headRefOid'])}
        return self._perform('github.pr.merge_job',request,lambda:c.run(['node',str(Path(repo)/'.process/tool/p3.mjs'),'merge',str(number),
                      '--plain','--no-review',
                      'Disposable native Process4 experiment: ARCH-owned module tests and actual ownership validated; no separate reviewer or new product stage introduced.'],
                     cwd=repo,timeout=120),facts)

    def contains(self, ancestor, descendant):
        if not SHA.fullmatch(ancestor) or not SHA.fullmatch(descendant): raise Rejected('exact integration SHAs required')
        return self._api('compare/'+ancestor+'...'+descendant)['status'] in ('ahead','identical')


class Store:
    def __init__(self, branch, provider=None):
        self.branch=ref(branch,'codex/p4-state-native-'); self.provider=provider or Provider()

    def read(self): return self.provider.read_state(self.branch)
    def write(self,state,sha):
        compact_recovery(state)
        return self.provider.write_state(self.branch,state,sha)

    def mutate(self, action):
        for attempt in range(4):
            state,sha=self.read();before=copy.deepcopy(state);action(state)
            # Retries of an already recorded decision/milestone are not new
            # recovery information and must not accumulate empty Git commits.
            if state==before:return state
            try: self.write(state,sha); return state
            except c.StateConflict:
                if attempt==3: raise

    def init(self, base, integration):
        ref(integration,'codex/p4-integration-')
        try: existing,_=self.read()
        except subprocess.CalledProcessError as error:
            if '404' not in (error.stderr or ''): raise
        else:
            if existing['integration_branch']!=integration: raise Rejected('existing run configuration differs')
            return existing
        sha=self.provider.resolve(base)
        self.provider.ensure_branch(integration,sha)
        self.provider.ensure_branch(self.branch,sha)
        state=c.empty(); state.update(native=True,integration_branch=integration,base=sha,native_roles={})
        self.write(state,None); return state


def assign(state, spec, state_branch):
    allowed={'id','order','paths','uses','prompt','completion','verify','timeout'}
    if not isinstance(spec,dict) or set(spec)-allowed:
        raise Rejected('assignment contains untrusted controller fields')
    if 'timeout' in spec and (type(spec['timeout']) is not int or not 1<=spec['timeout']<=600):
        raise Rejected('invalid bounded job timeout')
    if not isinstance(spec.get('uses',[]),list) or not all(isinstance(x,str) for x in spec.get('uses',[])):
        raise Rejected('uses must name declared modules')
    paths=[path_name(p) for p in spec.get('paths',[])]
    candidate={**spec,'paths':paths}
    c.add(state,candidate)
    job=state['jobs'][spec['id']]
    job['branch']=ref('codex/p4-job-native-'+state_branch.removeprefix('codex/p4-state-native-')+'-'+job['id'],'codex/p4-job-')


def control(state,action,job=None,value=None,source='arch'):
    """Trusted controller journal: technical choices are never owner words.

    source=owner must be selected by ROOT/coordinator only for an actual owner
    instruction/control. These CLI fields do not authenticate arbitrary callers.
    Historical events emitted by the earlier helper are left unchanged.
    """
    if source not in ('arch','owner'):raise Rejected('unknown control instruction source')
    if action not in ('stop','continue','retry','interrupt','replace','slots','priority','instruction'):
        raise Rejected('unknown native control')
    if source=='owner':
        if action=='slots':
            cap=int(value)
            if not 1<=cap<=8:raise Rejected('owner slot cap must stay within granted account maximum')
            state['owner_job_cap']=cap
        return c.control(state,action,job,value)
    if action=='stop':
        if not (state.get('stopped') and state.get('stop_source')=='owner'):
            state.update(stopped=True,stop_source='technical')
    elif action=='continue':
        if state.get('stopped') and state.get('stop_source')=='owner':
            raise Rejected('technical control cannot clear an actual owner stop')
        state['stopped']=False;state.pop('stop_source',None)
    elif action=='slots':
        slots=int(value)
        if not 1<=slots<=state.get('owner_job_cap',8):raise Rejected('technical concurrency exceeds owner cap')
        state['slots']=slots
    elif action=='priority':raise Rejected('module-order priority override requires an actual owner instruction')
    elif action=='instruction':
        if not isinstance(value,str) or not value:raise Rejected('technical instruction text required')
        state.setdefault('technical_instructions',[]).append({'at':time.time(),'job':job,'text':value})
        targets=[state['jobs'][job]] if job else list(state['jobs'].values())
        for target in targets:
            target.setdefault('technical_instructions',[]).append(value)
            if target['status'] in ('running','interrupting'):
                target.update(status='interrupting',restart=True)
            elif target['status'] in ('blocked','paused'):target.update(status='ready',restart=True)
    else:
        target=state['jobs'][job]
        target['status']='interrupting' if target['status'] in ('running','interrupting') else 'paused'
        target['restart']=action!='interrupt'
        if action!='interrupt' and target['status']=='paused':target['status']='ready'
    c.event(state,'native-arch-control',command=action,job=job,value=value,source='arch')


def native_mailbox(state):
    """Legacy snapshot reader only; routine operations use LocalMailbox."""
    return state.get('native_mailbox',communication.empty())


def compact_notices(state):
    """At most latest pending + active assignment rows + latest consumed per edge.

    Counts/ranges cover superseded outstanding changes; source commits remain Git
    history. Native fanout still happens at every actual provider checkpoint.
    """
    protected={key for job in state['jobs'].values() if job.get('status')!='done'
               for key in job.get('notice_ids',[])}
    groups={}
    for key,notice in state['notices'].items():groups.setdefault((notice['provider'],notice['user']),[]).append((key,notice))
    keep={}
    for rows in groups.values():
        pending=[(k,v) for k,v in rows if v['status']=='pending']
        active=[(k,v) for k,v in pending if k in protected]
        waiting=[(k,v) for k,v in pending if k not in protected]
        for k,v in active:keep[k]=v
        if waiting:
            key,last=waiting[-1];last=copy.deepcopy(last)
            last['first_unconsumed_commit']=waiting[0][1].get('first_unconsumed_commit',waiting[0][1]['commit'])
            last['change_count']=sum(v.get('change_count',1) for _,v in waiting)
            keep[key]=last
        consumed=[(k,v) for k,v in rows if v['status']!='pending']
        if consumed:keep[consumed[-1][0]]=consumed[-1][1]
    state['notices']=keep


def compact_recovery(state):
    compact_notices(state)
    legacy=state.pop('native_mailbox',None)
    roles=state.setdefault('native_roles',{})
    if legacy:
        for role,recipient in legacy.get('recipients',{}).items():roles.setdefault(role,recipient)
    # Latest acceptance/checkpoint milestones suffice for current recovery. Never
    # accumulate transient message/submission/ack/heartbeat records in Git history.
    events=state.get('events',[]);latest={};preserved=[]
    for event in events:
        kind=event.get('kind','')
        if kind.startswith('native-'):
            latest[(kind,event.get('job'),event.get('command'))]=event
        else:preserved.append(event)
    state['events']=preserved+list(latest.values())


def enqueue_provider_notices(state,mailbox):
    """Fan out every changed provider to every registered consumer locally."""
    for ident,notice in state['notices'].items():
        recipient='JOB:'+notice['user']
        if notice['status']!='pending' or recipient not in mailbox['recipients']:continue
        text=('Provider changed; report this message ID, current native generation and '
              'first-processing time to ARCH. Receipt does not complete module work. '
              'Keep assigned paths. Recovery obligation: '+json.dumps({
                  'notice_id':ident,'provider':notice['provider'],'user':notice['user'],
                  'commit':notice['commit'],'first_unconsumed_commit':notice.get('first_unconsumed_commit',notice['commit']),
                  'change_count':notice.get('change_count',1)},sort_keys=True))
        # Existing pending IDs retain their original text when a recovery range
        # expands. A new provider commit always has a distinct ID and native send.
        key='provider-notice:'+ident
        if key not in mailbox['messages']:communication.enqueue(mailbox,'PROVIDER:'+notice['provider'],recipient,text,key)
    return tuple(key for key,value in mailbox['messages'].items()
                 if key.startswith('provider-notice:') and value['status']!='acknowledged')


def current_native_recipient(mailbox,message_id):
    message=mailbox['messages'][message_id];recipient=mailbox['recipients'][message['recipient']]
    if message['recipient'].startswith('JOB:'):
        attempt=mailbox.get('job_attempts',{}).get(message['recipient'])
        if attempt is not None and recipient['generation']!=attempt:
            raise communication.StaleRecipient('current job attempt needs its actual native session registered first')
    return recipient


def check_workspace(workspace, job):
    workspace=Path(workspace).resolve(strict=True)
    owned=tuple(path_name(p) for p in job['paths'])
    def owns(p): return any(p==o or p.startswith(o+'/') for o in owned)
    changed=set()
    for args in (('diff','--name-only','-z','--no-renames',job['base'],'HEAD'),
                 ('diff','--name-only','-z','--no-renames',job['base']),
                 ('diff','--cached','--name-only','-z','--no-renames',job['base']),
                 ('ls-files','--others','--exclude-standard','-z')):
        changed.update(p for p in git(workspace,*args).stdout.split('\0') if p)
    # Check each local commit as well: an out-of-scope file cannot be leaked in
    # pushed history even if a later local commit reverted its final contents.
    trusted_merges={item['commit']:item['base'] for item in job.get('trusted_baseline_merges',[])}
    for commit in git(workspace,'rev-list',job['base']+'..HEAD').stdout.splitlines():
        if commit in trusted_merges:
            parents=git(workspace,'rev-list','--parents','-n','1',commit).stdout.split()
            if len(parents)!=3 or parents[2]!=trusted_merges[commit]:
                raise Rejected('trusted baseline merge identity differs')
            continue
        changed.update(p for p in git(workspace,'diff-tree','-m','--no-commit-id','--name-only','-r','-z','--no-renames',commit).stdout.split('\0') if p)
    for name in changed:
        path_name(name)
        if not owns(name): raise Rejected('outside assigned module: '+name)
        cursor=workspace
        for part in PurePosixPath(name).parts:
            cursor=cursor/part
            if cursor.is_symlink(): raise Rejected('symlink change rejected: '+name)
        if not cursor.resolve(strict=False).is_relative_to(workspace): raise Rejected('path escaped workspace')
    for entry in git(workspace,'ls-files','--stage','-z').stdout.split('\0'):
        if not entry: continue
        metadata,name=entry.split('\t',1)
        if name in changed and metadata.split()[0] in ('120000','160000'):
            raise Rejected('symlink/submodule index entry rejected: '+name)
    return sorted(changed)


def verify(workspace, job):
    # Product test code never inherits host provider secrets/config. This is
    # credential hygiene, NOT a claim of physical filesystem/network isolation.
    with tempfile.TemporaryDirectory(prefix='p4-module-test-') as private:
        env={k:v for k,v in os.environ.items() if k in ('PATH','LANG','LC_ALL','SYSTEMROOT')}
        env.update(HOME=private,CODEX_HOME=private,GH_CONFIG_DIR=private,
                   GIT_CONFIG_NOSYSTEM='1',GIT_CONFIG_GLOBAL=os.devnull,PYTHONDONTWRITEBYTECODE='1')
        result=subprocess.run(job['verify'],cwd=workspace,env=env,text=True,capture_output=True,
                              timeout=min(int(job.get('timeout',180)),600))
        output=result.stdout+'\n'+result.stderr
        counts=[int(value) for value in re.findall(r'\bRan\s+(\d+)\s+tests?\b',output)]
        counts += [int(value) for value in re.findall(r'^# tests (\d+)\s*$',output,re.MULTILINE)]
        return {'returncode':result.returncode,'test_count':sum(counts),
                'stdout':result.stdout[-4000:],'stderr':result.stderr[-4000:]}


class Cycle:
    def __init__(self, store, repo, runtime):
        self.store=store; self.provider=store.provider
        self.repo=Path(repo).resolve(); self.runtime=Path(runtime).resolve()
        origin=git(self.repo,'remote','get-url','origin').stdout.strip().rstrip('/').removesuffix('.git')
        if origin!='https://github.com/'+REPO: raise Rejected('checkout origin is not process3-probes')
        self.runtime.mkdir(parents=True,exist_ok=True)
        name=hashlib.sha256(self.store.branch.encode()).hexdigest()[:16]+'.json'
        self.mailbox=communication.LocalMailbox(self.runtime/'operational'/name,self._seed_mailbox)

    def _seed_mailbox(self):
        state,_=self.store.read();mailbox=copy.deepcopy(native_mailbox(state))
        mailbox.setdefault('recipients',{}).update(state.get('native_roles',{}))
        mailbox['job_attempts']={'JOB:'+key:job['attempt'] for key,job in state['jobs'].items()}
        enqueue_provider_notices(state,mailbox)
        return mailbox

    def sync_mailbox(self,state=None):
        state=state or self.store.read()[0]
        def sync(mailbox):
            mailbox.setdefault('job_attempts',{}).update({'JOB:'+key:job['attempt'] for key,job in state['jobs'].items()})
            return enqueue_provider_notices(state,mailbox)
        _,pending=self.mailbox.mutate(sync)
        return pending

    def assess(self):
        # Remote recovery facts plus local transient work, without remote writes.
        state,_=self.store.read();state['native_mailbox']=self.mailbox.read()
        return native_continuation.assess(state).to_dict()

    def _arch_actor(self,state,actor):
        if native_layout.configured(state):
            binding=native_layout.current(state,'ARCH')
            if not binding or actor!=binding['target']:
                raise Rejected('current ARCH actor required for product orchestration')

    def _fresh_job_observations(self,state,observations):
        """Join A's freshness checks to B's historical JOB binding semantics.

        PR/result facts are retained only after the corresponding native inventory
        observation is validated. These are trusted host inputs, not authentication.
        """
        from native import supervision,scheduling
        if not isinstance(observations,dict):raise Rejected('native observations mapping required')
        valid={};holds=[];snapshot=copy.deepcopy(state)
        for role,value in observations.items():
            if not isinstance(role,str) or not role.startswith('JOB:') or role[4:] not in state['jobs']:
                continue
            # Earlier native runs persisted session identity on the job before
            # there was a separate role registry. Validate against that same
            # durable identity B will use, without rewriting recovery state.
            binding=scheduling.binding_for(state,role[4:])
            if binding and role not in snapshot.setdefault('native_roles',{}):
                snapshot['native_roles'][role]=binding
            packet={key:value.get(key) for key in ('target','generation','activity','observed_at','source')} if isinstance(value,dict) else None
            activity,reason=supervision.observation(snapshot,role,packet)
            if reason:holds.append({'role':role,'reason':reason})
            else:valid[role]={**value,'activity':activity}
        return valid,holds

    def schedule_plan(self,observations,actor,active_account_jobs=0,native_capacity=None):
        from native.scheduling import plan_dispatch
        state,_=self.store.read();self._arch_actor(state,actor)
        if self._pilot_held(state):
            return {'status':'hold','dispatch':[],'holds':[{'reason':'integrator_combined_verification_pending'}]}
        fresh,holds=self._fresh_job_observations(state,observations)
        result=plan_dispatch(state,observations=fresh,active_account_jobs=active_account_jobs,native_capacity=native_capacity)
        return {**result,'observation_holds':holds,'execution_required':'ARCH must execute actual prepare/spawn/session operations; plans are not receipts'}

    def recovery_plan(self,observations,actor):
        from native.job_recovery import reconcile_jobs
        state,_=self.store.read();self._arch_actor(state,actor)
        fresh,holds=self._fresh_job_observations(state,observations)
        return {**reconcile_jobs(state,fresh),'observation_holds':holds}

    def supervision_plan(self,observations,actor,native_capacity=None,pending_roles=()):
        from native.supervision import plan_supervision
        state,_=self.store.read()
        return plan_supervision(state,observations=observations,actor=actor,native_capacity=native_capacity,
                                pending_roles=pending_roles,state_branch=self.store.branch)

    def owner_input(self,*,actor,text,kind,message_id,marked=False,expected_generation=None):
        from native.coordination import plan_owner_message
        state,_=self.store.read()
        proposal=plan_owner_message(state,actor=actor,text=text,kind=kind,message_id=message_id,
                                    marked=marked,expected_generation=expected_generation)
        self.message(**proposal['message'])
        return proposal

    def owner_record(self,*,actor,envelope,observed_at,source_evidence):
        from native.coordination import record_owner_words
        result={}
        def record(state):
            result['new_record']=record_owner_words(state,actor=actor,envelope=envelope,
                observed_at=observed_at,source_evidence=source_evidence)
        self.store.mutate(record)
        return {'message_id':envelope['message_id'],**result,'grants_changed':False}

    @staticmethod
    def _pilot_held(state):
        metadata=state.get('bootstrap_integrator',{})
        if not isinstance(metadata,dict) or type(metadata.get('pilot_hold',False)) is not bool:
            raise Rejected('invalid bootstrap pilot hold')
        return metadata.get('pilot_hold',False)

    def prepare(self, jid):
        state,_=self.store.read(); job=state['jobs'][jid]
        if self._pilot_held(state):raise Rejected('combined bootstrap verification pending; new product jobs held')
        if state['stopped'] or job['status'] not in ('ready','paused','blocked'): raise Rejected('job not dispatchable or run stopped')
        integration_base=self.provider.head(state['integration_branch'])
        base=job.get('base') or integration_base
        if not job.get('base'): self.provider.ensure_branch(job['branch'],base)
        def reserve(s):
            j=s['jobs'][jid]
            if s['stopped'] or j['status'] not in ('ready','paused','blocked'): raise Rejected('job changed before reservation')
            if sum(x['status']=='running' for x in s['jobs'].values())>=s['slots']: raise Rejected('native job slot cap reached')
            j.setdefault('base',base); j.setdefault('original_base',base)
            j['attempt']+=1; j['status']='running'; j['accepted']=False
            j['notice_ids']=[key for key,n in s['notices'].items() if n['user']==jid and n['status']=='pending']
            c.event(s,'native-reserve',job=jid,attempt=j['attempt'])
        state=self.store.mutate(reserve); job=state['jobs'][jid]
        self.sync_mailbox(state)
        path=self.runtime/(jid+'-'+str(job['attempt']))
        if not path.exists():
            git(self.repo,'fetch','origin',ref(job['branch'],'codex/p4-job-'))
            git(self.repo,'worktree','add','--detach',str(path),'FETCH_HEAD')
        # Refresh a notified/replaced consumer from the trusted integration tip,
        # preserving its own partial commits, branch and PR. Only the controller
        # performs this baseline merge; jobs never modify other modules.
        check_workspace(path,job)
        if integration_base!=job['base']:
            git(self.repo,'fetch','origin',state['integration_branch'])
            git(path,'-c','user.name=Process4 native controller',
                '-c','user.email=process4@users.noreply.github.com',
                'merge','--no-edit',integration_base)
            merged=git(path,'rev-parse','HEAD').stdout.strip()
            if merged!=integration_base:
                job.setdefault('trusted_baseline_merges',[]).append({'commit':merged,'base':integration_base})
            job['base']=integration_base
            check_workspace(path,job)
            self.provider.push(path,job['branch'],merged)
            def synced(s):
                current=s['jobs'][jid]
                if current['attempt']!=job['attempt']: raise Rejected('stale baseline sync')
                current.update(base=integration_base,checkpoint=merged,
                               trusted_baseline_merges=job.get('trusted_baseline_merges',[]))
                c.event(s,'native-baseline-sync',job=jid,base=integration_base,checkpoint=merged)
            state=self.store.mutate(synced);job=state['jobs'][jid]
        prompt=('Native Process4 JOB '+jid+'. Work ONLY in '+json.dumps(job['paths'])+
                '. Do not commit/push/call provider APIs/start sessions/change grants or process/configuration. '
                'Write your own module tests. Preserve existing work. Assignment: '+job['prompt']+
                '\nCompletion: '+job['completion']+'\nOwner instructions (verbatim): '+json.dumps(job['instructions'])+
                '\nARCH technical instructions (not owner words): '+json.dumps(job.get('technical_instructions',[]))+
                '\nProvider notices: '+json.dumps({k:state['notices'][k] for k in job['notice_ids']})+
                '\nLeave files for controller checkpointing; report actual work and tests, not overall Process4 completion.')
        self.store.mutate(lambda s:s['jobs'][jid].update(workspace=str(path)))
        return {'job':jid,'attempt':job['attempt'],'workspace':str(path),'prompt':prompt,'branch':job['branch']}

    def session(self,jid,address,actor=None):
        if not isinstance(address,str) or not address.startswith('/root/'):raise Rejected('native session address required')
        self.mailbox.read()  # Import legacy snapshot before significant recovery write.
        def register(s):
            job=s['jobs'][jid]
            if job['attempt']<1:raise Rejected('prepare job before recording actual session')
            if native_layout.configured(s):native_layout.validate_binding(s,'JOB:'+jid,address,job['attempt'],actor)
            job.update(session=address,session_generation=job['attempt'])
            s.setdefault('native_roles',{})['JOB:'+jid]={'target':address,'generation':job['attempt']}
        state=self.store.mutate(register);attempt=state['jobs'][jid]['attempt']
        self.mailbox.mutate(lambda m:communication.register(m,'JOB:'+jid,address,attempt))
        pending=self.sync_mailbox(state)
        return {'job':jid,'target':address,'generation':attempt,'message_ids_to_deliver':tuple(k for k in pending if self.mailbox.read()['messages'][k]['recipient']=='JOB:'+jid)}

    def register_role(self,role,target,generation,actor=None):
        opted=native_layout.configured(self.store.read()[0]) if role=='ROOT' or actor is not None else False
        if role not in (('ROOT','ARCH','COORDINATOR','WATCHER','PROCESS') if opted else ('ARCH','COORDINATOR','WATCHER','PROCESS')) and not (
                role.startswith('JOB:') and role.removeprefix('JOB:') in self.store.read()[0]['modules']):
            raise Rejected('register a supported native child role or declared module recipient')
        if not isinstance(target,str) or not target.startswith('/root/'):raise Rejected('current-tree non-root native target required')
        mailbox=self.mailbox.read()
        communication.register(copy.deepcopy(mailbox),role,target,generation)
        # Role replacement is a meaningful recovery milestone, not a message.
        state,_=self.store.read();new={'target':target,'generation':generation}
        if native_layout.configured(state):native_layout.validate_binding(state,role,target,generation,actor)
        if state.get('native_roles',{}).get(role)!=new:
            def record(s):
                if native_layout.configured(s):native_layout.validate_binding(s,role,target,generation,actor)
                previous=s.setdefault('native_roles',{}).get(role)
                if previous and previous['generation']>=generation and previous!=new:raise communication.StaleRecipient('replacement generation must increase')
                s['native_roles'][role]=new
            state=self.store.mutate(record)
        self.mailbox.mutate(lambda m:communication.register(m,role,target,generation))
        self.sync_mailbox(state)
        return {'recipient':role,'target':target,'generation':generation,
                'message_ids_to_deliver':communication.pending_for(self.mailbox.read(),role)}

    def adopt_layout(self,approval_evidence,console='/root'):
        # Explicit observed owner decision; no grant policy or authority expansion.
        self.mailbox.read()  # Seed legacy operational data before recovery milestone.
        state=self.store.mutate(lambda s:native_layout.adopt(s,approval_evidence,console))
        return native_layout.status(state)

    def layout_status(self):return native_layout.status(self.store.read()[0])

    def layout_plan(self,role,actor,activity,expected_generation=None,message=None,replace=False):
        return native_layout.plan(self.store.read()[0],role,actor,activity,expected_generation,self.store.branch,message,replace)

    def message(self,sender,recipient,text,message_id=None):
        _,ident=self.mailbox.mutate(lambda m:communication.enqueue(m,sender,recipient,text,message_id))
        return {'message_id':ident,'storage':'workspace_ephemeral'}

    def messages(self,recipient=None):
        return {key:value for key,value in self.mailbox.read()['messages'].items()
                if recipient is None or value['recipient']==recipient}

    def intent(self,message_id,activity):
        mailbox=self.mailbox.read();current_native_recipient(mailbox,message_id)
        return communication.delivery_intent(mailbox,message_id,activity)

    def delivered(self,intent,native_result=None):
        # Only after actual native followup submission; no invented tool API.
        def record(mailbox):
            current_native_recipient(mailbox,intent['message_id'])
            communication.record_delivery(mailbox,intent)
        state,_=self.mailbox.mutate(record)
        return {'message_id':intent['message_id'],'status':state['messages'][intent['message_id']]['status']}

    def acknowledge(self,message_id,target,generation,started_at,receipt):
        if not isinstance(receipt,str) or message_id not in receipt:raise Rejected('observed native actor receipt must identify exact message')
        if type(started_at) not in (int,float) or not 0<started_at<=time.time()+300:raise Rejected('valid observed timestamp required')
        def ack(mailbox):
            current_native_recipient(mailbox,message_id);message=mailbox['messages'][message_id]
            if started_at<message['created_at']-5:raise Rejected('processing receipt predates message creation')
            if not any(d['target']==target and d['generation']==generation for d in message['deliveries']):raise Rejected('record actual native submission before actor receipt')
            new=communication.acknowledge(mailbox,message_id,target,generation,started_at)
            if new:message['ack'].update(source='observed-native-actor-event',receipt=receipt.encode()[:1024].decode(errors='ignore'),latency_seconds=max(0,started_at-message['created_at']))
            return new
        _,new=self.mailbox.mutate(ack)
        return {'message_id':message_id,'status':'first_processing_acknowledged','new_ack':new}

    def checkpoint(self, jid, outcome):
        if outcome not in ('completed','interrupted','blocked'): raise Rejected('unknown native outcome')
        state,_=self.store.read(); job=state['jobs'][jid]; path=Path(job['workspace'])
        ref(job['branch'],'codex/p4-job-')
        try:
            changes=check_workspace(path,job)
            verification=verify(path,job) if outcome=='completed' else None
            # Acceptance may itself create changes; check the actual final candidate.
            check_workspace(path,job)
        except (Rejected,subprocess.TimeoutExpired) as error:
            def reject(s):
                s['jobs'][jid].update(status='blocked',ownership_violation=str(error))
                c.event(s,'native-rejected',job=jid,reason=str(error))
            # No remote content/branch/PR write occurs. The state audit is the
            # only permitted remote write recording that rejection.
            self.store.mutate(reject)
            raise
        git(path,'add','-A','--','.')
        if git(path,'diff','--cached','--quiet',check=False).returncode:
            git(path,'-c','user.name=Process4 native controller','-c','user.email=process4@users.noreply.github.com',
                'commit','-m','Native checkpoint '+jid+' attempt '+str(job['attempt']))
        check_workspace(path,job)
        sha=git(path,'rev-parse','HEAD').stdout.strip()
        self.provider.push(path,job['branch'],sha)
        def record(s):
            j=s['jobs'][jid]
            if j['attempt']!=job['attempt']: raise Rejected('stale native attempt result')
            if sha!=j.get('checkpoint') and sha!=j['base']: c.notify(s,jid,sha)
            compact_notices(s)
            j.update(checkpoint=sha,last_outcome=outcome,verification=verification,
                     accepted=bool(outcome=='completed' and verification and verification['returncode']==0 and verification['test_count']>0),
                     status='paused' if outcome=='interrupted' else 'review' if verification and verification['returncode']==0 and verification['test_count']>0 else 'blocked')
            j.pop('ownership_violation',None)
            c.event(s,'native-checkpoint',job=jid,checkpoint=sha,status=j['status'])
        state=self.store.mutate(record); current=state['jobs'][jid]
        if sha!=job['base']:
            pr=self.provider.draft_pr(current,state['integration_branch'])
            self.store.mutate(lambda s:s['jobs'][jid].update(pr=pr['url'],pr_number=pr['number']))
        latest=self.store.read()[0]
        pending=self.sync_mailbox(latest)
        return {**latest['jobs'][jid],'message_ids_to_deliver':pending}

    def integrate(self,jid):
        state,_=self.store.read();job=state['jobs'][jid]
        if state['stopped'] or not job.get('accepted') or not job.get('pr_number'):
            raise Rejected('run stopped or module not accepted with a preserved PR')
        ref(job['branch'],'codex/p4-job-');ref(state['integration_branch'],'codex/p4-integration-')
        check_workspace(job['workspace'],job)
        head=job['checkpoint']
        if git(job['workspace'],'rev-parse','HEAD').stdout.strip()!=head or self.provider.head(job['branch'])!=head:
            raise Rejected('job checkpoint moved after acceptance')
        pr=self.provider.pr_info(job['pr_number'])
        if pr['headRefName']!=job['branch'] or pr['baseRefName']!=state['integration_branch'] or pr['headRefOid']!=head:
            raise Rejected('PR identity/base/head differs from accepted assignment')
        if pr['state']=='MERGED':
            # Reconcile a prior successful mutation if durable recording failed.
            merged=self.provider.head(state['integration_branch'])
            self.record_integration(jid,head,merged)
            return {'status':'integrated','reconciled':True,'pr':job['pr_number'],'checkpoint':head,'integration':merged}
        if pr['state']!='OPEN':raise Rejected('PR is neither open nor already merged')
        if pr['isDraft']:
            self.provider.ready_pr(job['pr_number'])
            return {'status':'waiting-checks','pr':job['pr_number'],'checkpoint':head}
        if not self.provider.gate_green(head):
            return {'status':'waiting-checks','pr':job['pr_number'],'checkpoint':head}
        # The existing process tool remains the only merge route and repeats
        # all required-check/pin/head checks. No main/tranche base is accepted.
        self.provider.merge_with_pinned_tool(self.repo,job['pr_number'])
        merged=self.provider.head(state['integration_branch'])
        self.record_integration(jid,head,merged)
        return {'status':'integrated','pr':job['pr_number'],'checkpoint':head,'integration':merged}

    def record_integration(self,jid,checked_head,integration_sha):
        state,_=self.store.read(); job=state['jobs'][jid]
        if job.get('checkpoint')!=checked_head or not job.get('accepted'): raise Rejected('integration head not accepted/current')
        if self.provider.head(state['integration_branch'])!=integration_sha or not self.provider.contains(checked_head,integration_sha):
            raise Rejected('provider does not confirm exact merged checkpoint')
        def integrated(s):
            j=s['jobs'][jid]
            if j['checkpoint']!=checked_head: raise Rejected('checkpoint changed during integration')
            j.update(integrated=integration_sha,status='done')
            for key in j.get('notice_ids',[]):
                if key in s['notices']: s['notices'][key]['status']='delivered-and-completed'
            if any(n['user']==jid and n['status']=='pending' for n in s['notices'].values()): j['status']='ready'
            c.event(s,'native-integrated',job=jid,checkpoint=checked_head,integration=integration_sha)
            compact_notices(s)
        return self.store.mutate(integrated)


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--state',required=True); parser.add_argument('--repo',default='.')
    parser.add_argument('--runtime',default='/workspace/work/p4-native-cycle')
    sub=parser.add_subparsers(dest='command',required=True)
    p=sub.add_parser('init'); p.add_argument('--base',required=True); p.add_argument('--integration',required=True)
    for command in ('assign','declare'):
        p=sub.add_parser(command); p.add_argument('file')
    sub.add_parser('status')
    sub.add_parser('assess',help='Read-only native continuation assessment from actual durable evidence')
    for command in ('schedule-plan','recovery-plan','supervision-plan'):
        p=sub.add_parser(command);p.add_argument('--observations',required=True);p.add_argument('--actor',required=True)
        if command!='recovery-plan':p.add_argument('--native-capacity',type=int)
        if command=='schedule-plan':p.add_argument('--active-account-jobs',type=int,default=0)
        if command=='supervision-plan':p.add_argument('--pending-role',action='append',default=[])
    for command in ('owner-forward','owner-record'):
        p=sub.add_parser(command);p.add_argument('--actor',required=True);p.add_argument('--packet',required=True)
    p=sub.add_parser('control'); p.add_argument('action',choices=['stop','continue','retry','interrupt','replace','slots','priority','instruction']);p.add_argument('--job');p.add_argument('--value');p.add_argument('--source',choices=['arch','owner'],default='arch')
    p=sub.add_parser('prepare');p.add_argument('job')
    p=sub.add_parser('session');p.add_argument('job');p.add_argument('address');p.add_argument('--actor')
    p=sub.add_parser('register-role');p.add_argument('role');p.add_argument('target');p.add_argument('--generation',type=int,required=True);p.add_argument('--actor')
    p=sub.add_parser('adopt-layout');p.add_argument('--approval-evidence',required=True);p.add_argument('--console',default='/root')
    sub.add_parser('layout-status')
    p=sub.add_parser('layout-plan');p.add_argument('--role',required=True);p.add_argument('--actor',required=True);p.add_argument('--activity',choices=['unavailable','idle','running'],required=True);p.add_argument('--expected-generation',type=int);p.add_argument('--message');p.add_argument('--replace',action='store_true')
    p=sub.add_parser('message');p.add_argument('--sender',required=True);p.add_argument('--recipient',required=True);p.add_argument('--text',required=True);p.add_argument('--message-id')
    p=sub.add_parser('messages');p.add_argument('--recipient')
    p=sub.add_parser('intent');p.add_argument('message_id');p.add_argument('--activity',choices=['idle','running'],required=True)
    p=sub.add_parser('delivered');p.add_argument('intent_file');p.add_argument('--result-file')
    p=sub.add_parser('ack');p.add_argument('message_id');p.add_argument('--target',required=True);p.add_argument('--generation',type=int,required=True);p.add_argument('--started-at',type=float,required=True);p.add_argument('--receipt',required=True)
    p=sub.add_parser('checkpoint');p.add_argument('job');p.add_argument('--outcome',choices=['completed','interrupted','blocked'],required=True)
    p=sub.add_parser('integrate');p.add_argument('job')
    p=sub.add_parser('record-integration');p.add_argument('job');p.add_argument('--head',required=True);p.add_argument('--commit',required=True)
    args=parser.parse_args();store=Store(args.state)
    if args.command=='init': result=store.init(args.base,args.integration)
    elif args.command=='status':result=store.read()[0]
    elif args.command=='assess':result=Cycle(store,args.repo,args.runtime).assess()
    elif args.command=='assign':result=store.mutate(lambda s:assign(s,json.loads(Path(args.file).read_text()),store.branch))
    elif args.command=='declare':result=store.mutate(lambda s:c.declare(s,json.loads(Path(args.file).read_text())))
    elif args.command=='control':result=store.mutate(lambda s:control(s,args.action,args.job,args.value,args.source))
    else:
        cycle=Cycle(store,args.repo,args.runtime)
        if args.command=='prepare':result=cycle.prepare(args.job)
        elif args.command=='schedule-plan':result=cycle.schedule_plan(json.loads(Path(args.observations).read_text()),args.actor,args.active_account_jobs,args.native_capacity)
        elif args.command=='recovery-plan':result=cycle.recovery_plan(json.loads(Path(args.observations).read_text()),args.actor)
        elif args.command=='supervision-plan':result=cycle.supervision_plan(json.loads(Path(args.observations).read_text()),args.actor,args.native_capacity,args.pending_role)
        elif args.command=='owner-forward':result=cycle.owner_input(actor=args.actor,**json.loads(Path(args.packet).read_text()))
        elif args.command=='owner-record':result=cycle.owner_record(actor=args.actor,**json.loads(Path(args.packet).read_text()))
        elif args.command=='session':result=cycle.session(args.job,args.address,args.actor)
        elif args.command=='register-role':result=cycle.register_role(args.role,args.target,args.generation,args.actor)
        elif args.command=='adopt-layout':result=cycle.adopt_layout(args.approval_evidence,args.console)
        elif args.command=='layout-status':result=cycle.layout_status()
        elif args.command=='layout-plan':result=cycle.layout_plan(args.role,args.actor,args.activity,args.expected_generation,args.message,args.replace)
        elif args.command=='message':result=cycle.message(args.sender,args.recipient,args.text,args.message_id)
        elif args.command=='messages':result=cycle.messages(args.recipient)
        elif args.command=='intent':result=cycle.intent(args.message_id,args.activity)
        elif args.command=='delivered':result=cycle.delivered(json.loads(Path(args.intent_file).read_text()),json.loads(Path(args.result_file).read_text()) if args.result_file else None)
        elif args.command=='ack':result=cycle.acknowledge(args.message_id,args.target,args.generation,args.started_at,args.receipt)
        elif args.command=='checkpoint':result=cycle.checkpoint(args.job,args.outcome)
        elif args.command=='integrate':result=cycle.integrate(args.job)
        else:result=cycle.record_integration(args.job,args.head,args.commit)
    print(json.dumps(result,indent=2))


if __name__=='__main__':main()
