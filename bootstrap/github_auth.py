"""Optional renewable GitHub App installation identity for the protected host.

No installation or repository permission is created/expanded here. An existing
owner-authorized installation/key must be provisioned separately. Minted tokens
are restricted to process3-probes Contents/PR write and Metadata read.
"""
import base64
from datetime import datetime
import json
import os
from pathlib import Path
import threading
import time
import urllib.error
import urllib.request

REPO='neobobkrause/process3-probes'
_lock=threading.Lock()
_cached=None


def b64(data): return base64.urlsafe_b64encode(data).decode().rstrip('=')


def request(path, token, body=None):
    data=json.dumps(body).encode() if body is not None else None
    req=urllib.request.Request('https://api.github.com'+path,data=data,
        headers={'Authorization':'Bearer '+token,'Accept':'application/vnd.github+json',
                 'X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json','User-Agent':'Process4'})
    class NoRedirect(urllib.request.HTTPRedirectHandler):
        def redirect_request(self,*args,**kwargs): raise RuntimeError('GitHub credential redirect rejected')
    try:
        with urllib.request.build_opener(NoRedirect).open(req,timeout=20) as result: return json.load(result)
    except (OSError,ValueError): raise RuntimeError('GitHub installation identity unavailable') from None


def token():
    global _cached
    with _lock:
        if _cached and _cached[1]>time.time()+120: return _cached[0]
        app=os.environ['P4_GITHUB_APP_ID']; installation=os.environ['P4_GITHUB_INSTALLATION_ID']
        if not app.isdigit() or not installation.isdigit(): raise ValueError('numeric GitHub App/installation IDs required')
        key_path=Path(os.environ['P4_GITHUB_KEY_FILE'])
        if key_path.stat().st_mode & 0o077: raise RuntimeError('GitHub signing key must be owner-only')
        from cryptography.hazmat.primitives.serialization import load_pem_private_key
        from cryptography.hazmat.primitives.asymmetric import padding
        from cryptography.hazmat.primitives import hashes
        key=load_pem_private_key(key_path.read_bytes(),password=None)
        now=int(time.time())
        unsigned=b64(b'{"alg":"RS256","typ":"JWT"}')+'.'+b64(json.dumps({'iat':now-60,'exp':now+540,'iss':app}).encode())
        jwt=unsigned+'.'+b64(key.sign(unsigned.encode(),padding.PKCS1v15(),hashes.SHA256()))
        result=request('/app/installations/'+installation+'/access_tokens',jwt,{
            'repositories':['process3-probes'],
            'permissions':{'contents':'write','pull_requests':'write','metadata':'read'}})
        credential=result['token']
        repositories=request('/installation/repositories?per_page=100',credential)
        if repositories.get('total_count')!=1 or [r.get('full_name') for r in repositories.get('repositories',[])]!=[REPO]:
            raise RuntimeError('GitHub token scope differs from assigned repository')
        if result.get('permissions',{})!={'contents':'write','pull_requests':'write','metadata':'read'}:
            raise RuntimeError('GitHub token permissions differ from requested scope')
        expiry=datetime.fromisoformat(result['expires_at'].replace('Z','+00:00')).timestamp()
        _cached=(credential,expiry)
        return credential


def environment(argv):
    if not os.environ.get('P4_GITHUB_KEY_FILE') or not argv or argv[0] not in ('git','gh'):
        return None
    credential=token(); env=os.environ.copy()
    if argv[0]=='gh': env['GH_TOKEN']=credential
    else:
        env.update(GIT_CONFIG_COUNT='1',GIT_CONFIG_KEY_0='http.https://github.com/.extraheader',
                   GIT_CONFIG_VALUE_0='AUTHORIZATION: basic '+base64.b64encode(('x-access-token:'+credential).encode()).decode())
    return env
