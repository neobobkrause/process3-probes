"""Single-owner SIWC credential vault. Run only as the protected host principal.

File locks serialize across processes. The vault must be on a reattachable durable
volume with single-VM fencing, never a job mount or a Git checkout. OAuth cannot
make remote rotation and local disk writes one atomic distributed transaction.
"""
import base64
from contextlib import contextmanager
import fcntl
import json
import os
from pathlib import Path
import secrets
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid
from datetime import datetime

ISSUER = 'https://auth.openai.com'
RESOURCE = 'https://api.openai.com/v1'
SCOPES = 'openid profile email offline_access resource.invoke chatgpt.tokens.use.direct'


class AuthError(RuntimeError):
    """Codes only: no token response, secret, URL query or provider body in logs."""
    pass


class TemporaryAuthError(AuthError): pass
class TerminalAuthError(AuthError): pass


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        raise TemporaryAuthError('oauth_redirect_rejected')


def request_json(url, form=None):
    if urllib.parse.urlsplit(url).scheme != 'https' or urllib.parse.urlsplit(url).netloc != 'auth.openai.com':
        raise AuthError('untrusted_oauth_endpoint')
    req = urllib.request.Request(url,
        data=urllib.parse.urlencode(form).encode() if form is not None else None,
        headers={'Accept':'application/json', 'Content-Type':'application/x-www-form-urlencoded'})
    try:
        with urllib.request.build_opener(NoRedirect).open(req, timeout=20) as response:
            result = json.load(response)
    except urllib.error.HTTPError as error:
        try: code = json.load(error).get('error')
        except (ValueError, AttributeError): code = None
        if code in ('invalid_grant', 'invalid_client', 'unauthorized_client', 'access_denied'):
            raise TerminalAuthError(code) from None
        raise TemporaryAuthError('oauth_http_'+str(error.code)) from None
    except (OSError, ValueError):
        raise TemporaryAuthError('oauth_transport_or_response') from None
    if not isinstance(result, dict): raise TemporaryAuthError('invalid_oauth_response')
    return result


def discovery():
    data=request_json(ISSUER+'/.well-known/openid-configuration')
    if data.get('issuer') != ISSUER: raise AuthError('invalid_issuer')
    for field in ('authorization_endpoint','token_endpoint','jwks_uri'):
        value=urllib.parse.urlsplit(data.get(field,''))
        if value.scheme != 'https' or value.netloc != 'auth.openai.com':
            raise AuthError('untrusted_discovery_endpoint')
    return data


def unb64(value):
    return base64.urlsafe_b64decode(value+'='*(-len(value)%4))


def verify_identity(token, client_id, nonce=None, received_at=None):
    """RS256 OIDC validation against issuer JWKS. Never decode as authorization."""
    from cryptography.hazmat.primitives.asymmetric import rsa, padding
    from cryptography.hazmat.primitives import hashes
    from cryptography.exceptions import InvalidSignature
    try:
        header, body, signature=token.split('.')
        metadata=json.loads(unb64(header)); claims=json.loads(unb64(body))
        if metadata.get('alg') != 'RS256': raise ValueError()
        keys=request_json(discovery()['jwks_uri']).get('keys',[])
        matches=[k for k in keys if k.get('kid') == metadata.get('kid') and k.get('kty')=='RSA'
                 and k.get('use','sig')=='sig' and k.get('alg','RS256')=='RS256']
        if len(matches)!=1: raise TemporaryAuthError('jwks_key_unavailable')
        key=matches[0]
        public=rsa.RSAPublicNumbers(int.from_bytes(unb64(key['e']),'big'),int.from_bytes(unb64(key['n']),'big')).public_key()
        public.verify(unb64(signature),(header+'.'+body).encode(),padding.PKCS1v15(),hashes.SHA256())
        now=received_at if received_at is not None else time.time()
        audience=claims['aud']
        if claims['iss']!=ISSUER or not (audience==client_id or isinstance(audience,list) and client_id in audience): raise ValueError()
        if not isinstance(claims['sub'],str) or not claims['sub']: raise ValueError()
        if claims['exp'] < now-5 or claims['iat'] > now+5 or claims.get('nbf',0)>now+5: raise ValueError()
        if 'azp' in claims and claims['azp']!=client_id: raise ValueError()
        if isinstance(audience,list) and len(audience)>1 and claims.get('azp')!=client_id: raise ValueError()
        if nonce is not None and claims.get('nonce')!=nonce: raise ValueError()
        return {'subject':claims['sub'], 'email':claims.get('email')}
    except TemporaryAuthError: raise
    except (ValueError, KeyError, TypeError, InvalidSignature):
        raise TerminalAuthError('invalid_id_token') from None


class Vault:
    def __init__(self, directory):
        self.root=Path(directory).resolve()
        self.root.mkdir(mode=0o700, parents=True, exist_ok=True)
        if self.root.stat().st_uid != os.getuid() or self.root.stat().st_mode & 0o077:
            raise AuthError('vault_requires_owner_only_directory')
        self.path=self.root/'credentials.json'

    @contextmanager
    def lock(self):
        fd=os.open(self.root/'owner.lock',os.O_CREAT|os.O_RDWR|os.O_NOFOLLOW,0o600)
        try:
            fcntl.flock(fd,fcntl.LOCK_EX)
            yield
        finally: os.close(fd)

    def read(self):
        if not self.path.exists(): return {}
        fd=os.open(self.path,os.O_RDONLY|os.O_NOFOLLOW)
        with os.fdopen(fd) as stream:
            stat=os.fstat(stream.fileno())
            if stat.st_uid!=os.getuid() or stat.st_mode & 0o077: raise AuthError('unsafe_credential_permissions')
            return json.load(stream)

    def write(self, record):
        fd,name=tempfile.mkstemp(prefix='.rotation-',dir=self.root)
        try:
            with os.fdopen(fd,'w') as stream:
                os.fchmod(stream.fileno(),0o600)
                json.dump(record,stream); stream.flush(); os.fsync(stream.fileno())
            os.replace(name,self.path)
            directory=os.open(self.root,os.O_RDONLY|os.O_DIRECTORY)
            try: os.fsync(directory)
            finally: os.close(directory)
        finally:
            if os.path.exists(name): os.unlink(name)

    def host_id(self):
        with self.lock():
            record=self.read()
            if not record.get('ext_agent_host_id'):
                record['ext_agent_host_id']='urn:uuid:'+str(uuid.uuid4()); self.write(record)
            return record['ext_agent_host_id']

    def import_registration(self, record, verify=verify_identity):
        """For the owner's explicit, one-time SIWC transfer. Never import Codex auth.json."""
        if record.get('issuer')!=ISSUER or record.get('resource')!=RESOURCE:
            raise AuthError('not_a_process4_siwc_registration')
        if not record.get('client_id') or record['client_id']=='dynamic_agent_client': raise AuthError('issued_client_required')
        identity=verify(record['id_token'],record['client_id'],received_at=record['received_at'])
        if identity['subject']!=record.get('subject'): raise AuthError('account_mismatch')
        self.validate_fields(record)
        with self.lock():
            previous=self.read()
            if previous.get('refresh_token'): raise AuthError('existing_registration_requires_explicit_migration')
            if not previous.get('ext_agent_host_id'): raise AuthError('create_vm_host_id_before_import')
            record={**record,'ext_agent_host_id':previous['ext_agent_host_id']}
            self.write(record)

    @staticmethod
    def validate_fields(record):
        if not all(isinstance(record.get(k),str) and record[k] for k in ('access_token','refresh_token','client_id','subject')):
            raise TerminalAuthError('invalid_token_response')
        if not {'offline_access','resource.invoke','chatgpt.tokens.use.direct'} <= set(record.get('scopes',[])):
            raise TerminalAuthError('plan_usage_not_authorized')
        if record.get('token_type','').lower()!='bearer': raise TerminalAuthError('invalid_token_type')
        if not isinstance(record.get('expires_at'),(float,int)): raise TerminalAuthError('invalid_expiry')

    def access(self, transport=request_json, verify=verify_identity, now=None):
        now=time.time() if now is None else now
        with self.lock():
            record=self.read()
            if record.get('status')=='reauth_required': raise TerminalAuthError('reauth_required')
            if not record.get('refresh_token'): raise TerminalAuthError('initial_authorization_required')
            self.validate_fields(record)
            pending=record.get('pending_rotation')
            if not pending and record['expires_at']>now+120:
                return record['access_token'],record['expires_at']
            if not pending:
                earliest=record.get('earliest_refresh_at',0)
                if isinstance(earliest,str):
                    try: earliest=datetime.fromisoformat(earliest.replace('Z','+00:00')).timestamp()
                    except ValueError: earliest=0
                if earliest and earliest>now:
                    if record['expires_at']>now: return record['access_token'],record['expires_at']
                    raise TemporaryAuthError('refresh_not_ready')
                try:
                    response=transport(ISSUER+'/api/accounts/oauth/token', {
                        'grant_type':'refresh_token','client_id':record['client_id'],
                        'refresh_token':record['refresh_token'],'resource':RESOURCE})
                except TerminalAuthError as error:
                    record['status']='reauth_required'; record['terminal_error']=str(error)
                    self.write(record); raise
                pending={'response':response,'received_at':now}
                # Save rotation before JWKS retrieval/verification can fail.
                record['pending_rotation']=pending; self.write(record)
            response=pending['response']; received=pending['received_at']
            if not isinstance(response.get('expires_in'),(int,float)) or response['expires_in']<=0:
                record.update(status='reauth_required',terminal_error='invalid_token_response')
                self.write(record); raise TerminalAuthError('invalid_token_response')
            candidate={**record,'access_token':response.get('access_token'),
                       'refresh_token':response.get('refresh_token',record['refresh_token']),
                       'token_type':response.get('token_type'),
                       'expires_at':received+response.get('expires_in',0),
                       'received_at':received,
                       'scopes':response.get('scope',' '.join(record['scopes'])).split()}
            try:
                self.validate_fields(candidate)
                if response.get('id_token'):
                    identity=verify(response['id_token'],record['client_id'],received_at=received)
                    if identity['subject']!=record['subject']: raise TerminalAuthError('account_mismatch')
                    candidate['id_token']=response['id_token']
                candidate.update(status='connected',generation=record.get('generation',0)+1)
                candidate.pop('pending_rotation',None)
                candidate.pop('earliest_refresh_at',None)
                if isinstance(response.get('earliest_refresh_at'),(int,float,str)):
                    candidate['earliest_refresh_at']=response['earliest_refresh_at']
                self.write(candidate)
            except TerminalAuthError as error:
                record.update(status='reauth_required',terminal_error=str(error)); self.write(record); raise
            return candidate['access_token'],candidate['expires_at']
