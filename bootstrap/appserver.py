"""Supported SIWC app-server transport, with renewable host-owned credentials.

No API keys/native Codex auth are consumed. Protected local thread history stays
on the host volume; GitHub checkpoints still recover work without that history.
"""
import json
import os
from pathlib import Path
import queue
import subprocess
import threading
import time

PROVIDER='openai_chatgpt_plan'


def provider_options():
    return {'model_provider':PROVIDER,
            f'model_providers.{PROVIDER}.name':'ChatGPT plan',
            f'model_providers.{PROVIDER}.base_url':'https://api.openai.com/v1',
            f'model_providers.{PROVIDER}.env_key':'ACCESS_TOKEN',
            f'model_providers.{PROVIDER}.wire_api':'responses',
            f'model_providers.{PROVIDER}.requires_openai_auth':False,
            f'model_providers.{PROVIDER}.supports_websockets':False}


def options_argv(options):
    argv=[]
    for key,value in options.items():
        argv+=['-c',key+'='+json.dumps(value)]
    return argv


class AppServer:
    def __init__(self, home, token, options=None, command=None):
        self.home=Path(home); self.home.mkdir(mode=0o700,parents=True,exist_ok=True)
        # Use an allowlist: no API-key, native login, GitHub, Cloudflare or custom
        # provider credentials inherited. Proxy/CA settings are kept as supplied.
        env={k:v for k,v in os.environ.items() if k in (
            'PATH','LANG','LC_ALL','HTTP_PROXY','HTTPS_PROXY','ALL_PROXY','NO_PROXY',
            'http_proxy','https_proxy','all_proxy','no_proxy','SSL_CERT_FILE','SSL_CERT_DIR')}
        env.update(CODEX_HOME=str(self.home),ACCESS_TOKEN=token)
        argv=command or ['codex','app-server','--listen','stdio://']+options_argv({**provider_options(),**(options or {})})
        self.stderr=open(self.home/'app-server.stderr','a')
        self.p=subprocess.Popen(argv,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=self.stderr,
                                env=env,text=True,bufsize=1)
        self.messages=queue.Queue(); self.counter=0; self.notifications=[]
        def read():
            try:
                for line in self.p.stdout:
                    try: self.messages.put(json.loads(line))
                    except ValueError: self.messages.put({'transport_error':'invalid_json'})
            finally: self.messages.put({'transport_error':'closed'})
        self.reader=threading.Thread(target=read,daemon=True); self.reader.start()

    def send(self, message):
        self.p.stdin.write(json.dumps(message)+'\n'); self.p.stdin.flush()

    def next(self, timeout=30):
        try: message=self.messages.get(timeout=timeout)
        except queue.Empty: raise TimeoutError('app-server response timeout') from None
        if 'transport_error' in message: raise RuntimeError('app-server transport closed or invalid')
        # No permission approval is delegated to the model. Refuse all requests
        # beyond the fixed host protocol; credential renewal uses process restart.
        if 'method' in message and 'id' in message:
            self.send({'id':message['id'],'error':{'code':-32601,'message':'Unsupported host request'}})
        return message

    def request(self, method, params=None, timeout=30):
        self.counter+=1; ident=self.counter
        self.send({'id':ident,'method':method,'params':params or {}})
        deadline=time.monotonic()+timeout
        while True:
            message=self.next(max(.01,deadline-time.monotonic()))
            if message.get('id')==ident and 'method' not in message:
                if 'error' in message: raise RuntimeError('app-server RPC rejected: '+method)
                return message.get('result',{})
            self.notifications.append(message)

    def initialize(self):
        result=self.request('initialize',{'clientInfo':{'name':'Process4','title':'Process4','version':'0.1.0'}})
        self.send({'method':'initialized'})
        return result

    def close(self):
        if self.p.poll() is None:
            self.p.terminate()
            try: self.p.wait(timeout=5)
            except subprocess.TimeoutExpired: self.p.kill(); self.p.wait()
        for stream in (self.p.stdin,self.p.stdout,self.stderr): stream.close()


class Session:
    """A trusted controller; ordinary model tools never call the token owner."""
    def __init__(self, home, credential_source, options, factory=AppServer):
        self.home=Path(home); self.credentials=credential_source
        self.options=options; self.factory=factory; self.server=None
        self.thread=None; self.expiry=0

    def connect(self, cwd, model, instructions, resume=None):
        token,self.expiry=self.credentials()
        self.server=self.factory(self.home,token,self.options)
        try:
            self.server.initialize()
            method='thread/resume' if resume else 'thread/start'
            params={'cwd':str(cwd),'model':model,'modelProvider':PROVIDER,
                    'approvalPolicy':'never','developerInstructions':instructions}
            if resume: params['threadId']=resume
            result=self.server.request(method,params)
            self.thread=result['thread']['id']
            return self.thread
        except BaseException:
            self.server.close()
            raise

    def run(self, cwd, model, prompt, instructions, emit, timeout=180):
        self.home.mkdir(mode=0o700,parents=True,exist_ok=True)
        saved=self.home/'thread.json'
        resume=json.loads(saved.read_text()).get('thread_id') if saved.exists() else None
        self.connect(cwd,model,instructions,resume)
        # Tokens never enter this durable session pointer or JSONL evidence.
        from auth.credentials import Vault
        # Atomic pointer uses the same fsync discipline, separate from auth vault.
        pointer=Vault(self.home)
        original=pointer.path; pointer.path=saved
        pointer.write({'thread_id':self.thread}); pointer.path=original
        emit({'type':'thread.started','thread_id':self.thread})
        deadline=time.monotonic()+timeout
        try:
            while time.monotonic()<deadline:
                result=self.server.request('turn/start',{'threadId':self.thread,
                    'input':[{'type':'text','text':prompt,'text_elements':[]}]})
                turn=result['turn']['id']; renew=False
                pending=self.server.notifications; self.server.notifications=[]
                while time.monotonic()<deadline:
                    if time.time()>=self.expiry-60:
                        self.server.request('turn/interrupt',{'threadId':self.thread,'turnId':turn})
                        renew=True; break
                    try:
                        message=pending.pop(0) if pending else self.server.next(min(5,max(.01,deadline-time.monotonic())))
                    except TimeoutError:
                        continue
                    method=message.get('method'); params=message.get('params',{})
                    if method=='item/completed' and params.get('item',{}).get('type')=='agentMessage':
                        emit({'type':'item.completed','item':{'type':'agent_message','text':params['item'].get('text','')}})
                    if method=='turn/completed':
                        status=params['turn']['status']
                        emit({'type':'turn.completed' if status=='completed' else 'turn.failed'})
                        return 0 if status=='completed' else 1
                if not renew: raise TimeoutError('turn timed out')
                self.server.close()
                self.connect(cwd,model,instructions,self.thread)
                emit({'type':'host.credential-renewed','thread_id':self.thread})
                prompt='Continue the interrupted unfinished assignment from existing files and thread history. '+prompt
            raise TimeoutError('turn timed out')
        finally:
            if self.server: self.server.close()
