#!/usr/bin/env python3
"""Protected host entry point; install outside the development checkout.

All module code, including acceptance, uses Codex's named Linux permission
profile. Capability smoke test must pass before auth is requested. Never use an
unsandboxed fallback. This adapter has not passed that smoke test in Codex Cloud.
"""
import hashlib
import json
import os
from pathlib import Path
import signal
import subprocess
import sys
import tempfile

from appserver import Session
from auth.client import access
from auth.credentials import AuthError, TerminalAuthError
from role_instructions import text as role_instructions


def profile(workspace, owned, private):
    workspace=Path(workspace).resolve(strict=True)
    filesystem={':minimal':'read',str(workspace):'read','/proc':'deny',str(private):'deny',
                '/etc/process4':'deny','/var/lib/process4-auth':'deny','/run/process4-auth':'deny',
                '/var/lib/process4-home':'deny',
                str(workspace/'.git'):'deny', str(workspace/'.codex'):'deny',
                str(workspace/'.agents'):'deny',str(workspace/'.aws'):'deny'}
    for entry in owned:
        path=(workspace/entry).resolve()
        if not path.is_relative_to(workspace) or path==workspace: raise ValueError('invalid module ownership')
        if any(p in ('.git','.codex','.aws','.agents','.github','bootstrap','process') for p in Path(entry).parts):
            raise ValueError('protected module path')
        filesystem[str(path)]='write'
    return filesystem


def config_text(filesystem):
    lines=['default_permissions = "process4"','approval_policy = "never"',
           'web_search = "disabled"','allow_login_shell = false',
           '[shell_environment_policy]','inherit = "none"',
           'set = { PATH = "/usr/local/bin:/usr/bin:/bin", LANG = "C.UTF-8" }',
           '[features]','multi_agent = false','apps = false','use_legacy_landlock = false',
           '[permissions.process4.filesystem]']
    lines += [json.dumps(key)+' = '+json.dumps(value) for key,value in filesystem.items()]
    lines += ['[permissions.process4.network]','enabled = false']
    return '\n'.join(lines)+'\n'


def sandbox(home, cwd, argv, timeout=60, capture=True):
    env={k:v for k,v in os.environ.items() if k in ('PATH','LANG','SSL_CERT_FILE','SSL_CERT_DIR')}
    env.update(CODEX_HOME=str(home),HOME='/nonexistent')
    return subprocess.run(['codex','sandbox','-P','process4','-C',str(cwd),'--',*argv],
                          env=env,cwd=cwd,text=True,capture_output=capture,timeout=timeout)


def preflight(home, workspace, private):
    # This is an OS capability probe, not a new product-test stage. It must fail
    # closed if the host cannot construct a sandbox or it exposes private files.
    probe="""import os,socket
from pathlib import Path
assert not os.environ.get('ACCESS_TOKEN')
for path in (Path('/proc/self/environ'),Path(%r)):
 try: path.read_bytes()
 except OSError: pass
 else: raise SystemExit('private read allowed')
s=socket.socket();s.settimeout(.5)
try:s.connect(('1.1.1.1',443))
except OSError:pass
else:raise SystemExit('network allowed')
print('PROCESS4_SANDBOX_OK')
""" % str(private/'canary')
    check=sandbox(home,workspace,['python3','-c',probe],timeout=20)
    if check.returncode or 'PROCESS4_SANDBOX_OK' not in check.stdout:
        raise RuntimeError('ISOLATION_UNAVAILABLE: named Linux permission profile failed capability probe')


def main():
    if len(sys.argv)!=2 or sys.argv[1] not in ('codex','verify'): raise SystemExit('expected codex or verify')
    payload=json.loads(sys.stdin.readline(1024*1024))
    root=Path(os.environ['P4_PRIVATE_RUNTIME']).resolve()
    root.mkdir(mode=0o700,parents=True,exist_ok=True)
    if root.stat().st_mode & 0o077: raise RuntimeError('private runtime must be owner-only')
    (root/'canary').write_text('nonsecret isolation canary')
    workspace=Path(payload['workspace']).resolve(strict=True)
    identity=f"{payload['role']}:{payload.get('generation',0)}:{payload.get('job','')}:{workspace}"
    key=hashlib.sha256(identity.encode()).hexdigest()[:24]
    home=root/key; home.mkdir(mode=0o700,exist_ok=True)
    owned=payload.get('owned_paths',[]) if payload['role']=='JOB' else []
    fs=profile(workspace,owned,root)
    (home/'config.toml').write_text(config_text(fs))
    preflight(home,workspace,root)
    if sys.argv[1]=='verify':
        result=sandbox(home,workspace,payload['argv'],timeout=payload['timeout'],capture=False)
        return result.returncode
    model=os.environ.get('P4_MODEL')
    if not model: raise RuntimeError('explicit supported subscription model required')
    session=Session(home,lambda:access(os.environ['P4_AUTH_SOCKET']),{},)
    instructions=role_instructions(payload['role'])
    return session.run(workspace,model,payload['prompt'],instructions,
                       lambda event:print(json.dumps(event),flush=True),payload.get('timeout',180))


if __name__=='__main__':
    def terminate(*_): raise SystemExit(143)
    signal.signal(signal.SIGTERM,terminate)
    try: raise SystemExit(main())
    except TerminalAuthError as error:
        print(json.dumps({'type':'host.blocked','dependency':'subscription-authorization',
                          'terminal':True,'code':str(error)}),flush=True)
        raise SystemExit(78)
    except AuthError:
        print(json.dumps({'type':'host.blocked','dependency':'subscription-service',
                          'terminal':False,'code':'credential_temporarily_unavailable'}),flush=True)
        raise SystemExit(75)
    except (RuntimeError,ValueError,KeyError) as error: raise SystemExit(str(error))
