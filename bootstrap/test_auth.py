"""SIWC protocol/storage fixtures; never evidence of actual OAuth or renewal."""
import json
import multiprocessing
import os
from pathlib import Path
import tempfile
import time
import unittest
from unittest.mock import patch

from auth.credentials import Vault, ISSUER, RESOURCE, TerminalAuthError, TemporaryAuthError
from appserver import Session, provider_options


def fixture():
    return dict(issuer=ISSUER,resource=RESOURCE,ext_agent_host_id='fixture-host',
                subject='fixture-user',client_id='fixture-issued-client',id_token='fixture-id',
                access_token='fixture-access-old',refresh_token='fixture-refresh-old',
                expires_at=1,token_type='Bearer',received_at=0,status='connected',
                scopes=['offline_access','resource.invoke','chatgpt.tokens.use.direct'])


def response():
    return dict(access_token='fixture-access-new',refresh_token='fixture-refresh-new',
                token_type='Bearer',expires_in=3600,id_token='fixture-id-new')


def identity(*args,**kw): return {'subject':'fixture-user'}


def concurrent_worker(directory, counter):
    vault=Vault(directory)
    def rotate(url, form):
        with counter.get_lock(): counter.value+=1
        time.sleep(.1)
        return response()
    assert vault.access(rotate,identity)[0]=='fixture-access-new'


class CredentialTests(unittest.TestCase):
    def test_multiprocess_rotation_is_serialized_and_durable(self):
        with tempfile.TemporaryDirectory() as td:
            Vault(td).write(fixture()); counter=multiprocessing.Value('i',0)
            children=[multiprocessing.Process(target=concurrent_worker,args=(td,counter)) for _ in range(4)]
            for child in children: child.start()
            for child in children: child.join(5); self.assertEqual(child.exitcode,0)
            self.assertEqual(counter.value,1)
            vault=Vault(td); record=vault.read()
            self.assertEqual(record['refresh_token'],'fixture-refresh-new')
            self.assertEqual(vault.path.stat().st_mode & 0o777,0o600)
            self.assertEqual(record['generation'],1)

    def test_pending_rotation_survives_verification_outage_and_process_restart(self):
        with tempfile.TemporaryDirectory() as td:
            vault=Vault(td); vault.write(fixture())
            def outage(*_args,**_kw): raise TemporaryAuthError('fixture_jwks_outage')
            with self.assertRaises(TemporaryAuthError): vault.access(lambda *_:response(),outage)
            self.assertIn('pending_rotation',vault.read())
            def no_second_rotation(*_): raise AssertionError('rotated twice')
            self.assertEqual(Vault(td).access(no_second_rotation,identity)[0],'fixture-access-new')
            self.assertNotIn('pending_rotation',vault.read())

    def test_terminal_invalidation_is_persisted_and_not_retried(self):
        with tempfile.TemporaryDirectory() as td:
            vault=Vault(td); vault.write(fixture()); calls=[]
            def revoked(*_): calls.append(True); raise TerminalAuthError('invalid_grant')
            for _ in range(2):
                with self.assertRaises(TerminalAuthError): vault.access(revoked,identity)
            self.assertEqual(len(calls),1)
            self.assertEqual(vault.read()['status'],'reauth_required')

    def test_transient_transport_failure_preserves_renewable_registration(self):
        with tempfile.TemporaryDirectory() as td:
            vault=Vault(td); vault.write(fixture())
            def unavailable(*_): raise TemporaryAuthError('fixture_timeout')
            with self.assertRaises(TemporaryAuthError): vault.access(unavailable,identity)
            self.assertEqual(vault.read(),fixture())

    def test_refresh_uses_issued_client_and_preserves_scope_when_omitted(self):
        with tempfile.TemporaryDirectory() as td:
            vault=Vault(td); vault.write(fixture()); calls=[]
            def rotate(url,form): calls.append((url,form)); return response()
            vault.access(rotate,identity)
            self.assertEqual(calls[0][1]['client_id'],'fixture-issued-client')
            self.assertEqual(calls[0][1]['resource'],RESOURCE)
            self.assertNotIn('scope',calls[0][1])
            self.assertEqual(vault.read()['scopes'],fixture()['scopes'])

    def test_vm_import_preserves_vm_host_id_and_selected_identity(self):
        with tempfile.TemporaryDirectory() as td:
            vault=Vault(td); host=vault.host_id()
            vault.import_registration(fixture(),identity)
            self.assertEqual(vault.read()['ext_agent_host_id'],host)
            with self.assertRaisesRegex(Exception,'existing_registration'):
                vault.import_registration(fixture(),identity)

    def test_native_cloud_credential_file_is_rejected(self):
        with tempfile.TemporaryDirectory() as td:
            with self.assertRaisesRegex(Exception,'not_a_process4'):
                Vault(td).import_registration({'auth_mode':'chatgpt','tokens':{}},identity)

    def test_refresh_identity_switch_is_terminal(self):
        with tempfile.TemporaryDirectory() as td:
            vault=Vault(td); vault.write(fixture())
            with self.assertRaisesRegex(TerminalAuthError,'account_mismatch'):
                vault.access(lambda *_:response(),lambda *a,**kw:{'subject':'different'})
            self.assertEqual(vault.read()['status'],'reauth_required')

    def test_provider_is_exact_documented_subscription_route(self):
        options=provider_options()
        self.assertEqual(options['model_providers.openai_chatgpt_plan.base_url'],RESOURCE)
        self.assertFalse(options['model_providers.openai_chatgpt_plan.requires_openai_auth'])
        self.assertFalse(options['model_providers.openai_chatgpt_plan.supports_websockets'])
        self.assertNotIn('apiKey',str(options))


if __name__=='__main__': unittest.main()

class AppServerRenewalTests(unittest.TestCase):
    def test_documented_restart_and_resume_keeps_same_thread(self):
        instances=[]; supplied=[]; events=[]
        class Fake:
            def __init__(self,home,token,options):
                supplied.append(token); self.notifications=[]; self.calls=[]; self.closed=False
                instances.append(self)
            def initialize(self): pass
            def request(self,method,params):
                self.calls.append((method,params))
                if method in ('thread/start','thread/resume'): return {'thread':{'id':'fixture-thread'}}
                if method=='turn/start': return {'turn':{'id':'fixture-turn'}}
                return {}
            def next(self,timeout):
                return {'method':'turn/completed','params':{'turn':{'status':'completed'}}}
            def close(self): self.closed=True
        credentials=iter([('fixture-access-old',time.time()+30),('fixture-access-new',time.time()+3600)])
        with tempfile.TemporaryDirectory() as td:
            session=Session(td,lambda:next(credentials),{},factory=Fake)
            self.assertEqual(session.run(td,'fixture-model','unfinished work','fixture instructions',events.append),0)
            self.assertEqual(json.loads((Path(td)/'thread.json').read_text()),{'thread_id':'fixture-thread'})
        self.assertEqual(supplied,['fixture-access-old','fixture-access-new'])
        self.assertEqual(instances[1].calls[0][0],'thread/resume')
        self.assertEqual(instances[1].calls[0][1]['threadId'],'fixture-thread')
        self.assertTrue(all(p.closed for p in instances))
        self.assertEqual(sum(e['type']=='turn.completed' for e in events),1)
        self.assertNotIn('fixture-access',json.dumps(events))

class OidcTests(unittest.TestCase):
    def test_signature_nonce_audience_and_subject_are_verified(self):
        import base64
        from cryptography.hazmat.primitives.asymmetric import rsa,padding
        from cryptography.hazmat.primitives import hashes
        from auth.credentials import verify_identity
        key=rsa.generate_private_key(public_exponent=65537,key_size=2048)
        public=key.public_key().public_numbers()
        def b64(data): return base64.urlsafe_b64encode(data).decode().rstrip('=')
        def integer(n): return b64(n.to_bytes((n.bit_length()+7)//8,'big'))
        jwks={'keys':[{'kid':'fixture','kty':'RSA','n':integer(public.n),'e':integer(public.e)}]}
        claims=dict(iss=ISSUER,aud='fixture-client',sub='fixture-sub',exp=time.time()+100,iat=time.time(),nonce='fixture-nonce')
        def signed(payload):
            message=b64(json.dumps({'alg':'RS256','kid':'fixture'}).encode())+'.'+b64(json.dumps(payload).encode())
            return message+'.'+b64(key.sign(message.encode(),padding.PKCS1v15(),hashes.SHA256()))
        with patch('auth.credentials.discovery',return_value={'jwks_uri':ISSUER+'/fixture-jwks'}), \
             patch('auth.credentials.request_json',return_value=jwks):
            self.assertEqual(verify_identity(signed(claims),'fixture-client','fixture-nonce')['subject'],'fixture-sub')
            with self.assertRaises(TerminalAuthError): verify_identity(signed(claims),'other-client','fixture-nonce')
            with self.assertRaises(TerminalAuthError): verify_identity(signed(claims),'fixture-client','other-nonce')
            with self.assertRaises(TerminalAuthError): verify_identity(signed({**claims,'exp':0}),'fixture-client','fixture-nonce')

class CredentialOwnerRpcTests(unittest.TestCase):
    def test_private_socket_dispatch_never_exposes_refresh_token(self):
        import threading
        from auth.daemon import Server
        from auth.client import access
        class FixtureVault:
            def access(self): return 'fixture-short-access',123456
        with tempfile.TemporaryDirectory() as td:
            path=Path(td)/'owner.sock'
            with Server(str(path),FixtureVault()) as server:
                worker=threading.Thread(target=server.serve_forever,daemon=True); worker.start()
                try:
                    self.assertEqual(access(path),('fixture-short-access',123456))
                    self.assertEqual(path.stat().st_mode & 0o777,0o600)
                finally: server.shutdown(); worker.join(3)
