#!/usr/bin/env python3
"""Explicit owner-only SIWC enrollment; never launched by development agents."""
import argparse
import base64
import hashlib
from http.server import BaseHTTPRequestHandler, HTTPServer
import json
from pathlib import Path
import secrets
import time
import urllib.parse
import webbrowser

if __package__:
    from .credentials import (Vault, AuthError, ISSUER, RESOURCE, SCOPES, discovery, request_json, verify_identity)
else:
    from credentials import (Vault, AuthError, ISSUER, RESOURCE, SCOPES, discovery, request_json, verify_identity)


def login(vault):
    host_id=vault.host_id()
    with vault.lock(): previous=vault.read()
    if previous.get('refresh_token'): raise AuthError('existing_credential_owner_do_not_duplicate')
    state=secrets.token_urlsafe(32); nonce=secrets.token_urlsafe(32); verifier=secrets.token_urlsafe(32)
    callback={}
    class Callback(BaseHTTPRequestHandler):
        def log_message(self,*_): pass # authorization codes never enter access logs
        def do_GET(self):
            url=urllib.parse.urlsplit(self.path)
            query=urllib.parse.parse_qs(url.query)
            valid=(url.path=='/auth/callback' and query.get('state')==[state])
            if valid: callback.update(query)
            self.send_response(200 if valid else 400); self.end_headers()
            self.wfile.write(b'Process4 authorization received. Return to the terminal.' if valid else b'Invalid callback.')
    server=HTTPServer(('127.0.0.1',0),Callback); server.timeout=1
    redirect=f'http://127.0.0.1:{server.server_port}/auth/callback'
    config=discovery(); issued=previous.get('client_id')
    params=dict(client_id=issued or 'dynamic_agent_client',response_type='code',redirect_uri=redirect,
                scope=SCOPES,resource=RESOURCE,state=state,nonce=nonce,ext_agent_host_id=host_id,
                code_challenge_method='S256',code_challenge=base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).decode().rstrip('='))
    if not issued: params['agent_name_hint']='Process4'
    url=config['authorization_endpoint']+'?'+urllib.parse.urlencode(params)
    print('Continue with ChatGPT using the browser opened on this computer. No Codex Cloud credential is read.',flush=True)
    if not webbrowser.open(url): print(url,flush=True) # fresh URL contains no tokens
    deadline=time.time()+300
    try:
        while not callback and time.time()<deadline: server.handle_request()
    finally: server.server_close()
    if not callback: raise AuthError('authorization_timed_out')
    if 'error' in callback: raise AuthError('authorization_declined')
    new_id=callback.get('client_id',[issued])[0]
    if not new_id or new_id=='dynamic_agent_client' or issued and issued!=new_id: raise AuthError('registration_mismatch')
    with vault.lock():
        # Preserve issued client even if one-time code exchange fails.
        vault.write({**previous,'client_id':new_id,'ext_agent_host_id':host_id})
    response=request_json(config['token_endpoint'],dict(grant_type='authorization_code',client_id=new_id,
                          code=callback['code'][0],code_verifier=verifier,redirect_uri=redirect,resource=RESOURCE))
    received=time.time()
    identity=verify_identity(response['id_token'],new_id,nonce)
    record=dict(issuer=ISSUER,resource=RESOURCE,client_id=new_id,ext_agent_host_id=host_id,
                **identity,id_token=response['id_token'],access_token=response.get('access_token'),
                refresh_token=response.get('refresh_token'),token_type=response.get('token_type'),
                scopes=response.get('scope','').split(),received_at=received,
                expires_at=received+response.get('expires_in',0),status='connected',generation=1)
    vault.validate_fields(record)
    with vault.lock(): vault.write(record)
    print('SIWC registration saved in protected storage. Inference remains unverified.')


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--vault',required=True)
    parser.add_argument('command',choices=['host-id','login','import','status','renew'])
    parser.add_argument('--file')
    args=parser.parse_args(); vault=Vault(args.vault)
    if args.command=='host-id': print(vault.host_id())
    elif args.command=='login': login(vault)
    elif args.command=='import':
        if not args.file: parser.error('--file is required')
        vault.import_registration(json.loads(Path(args.file).read_text()))
        print('Selected SIWC registration imported; VM host identity preserved.')
    elif args.command=='renew':
        _,expiry=vault.access(); print(json.dumps({'access_ready':True,'expires_at':expiry}))
    else:
        with vault.lock(): record=vault.read()
        print(json.dumps({k:record.get(k) for k in ('status','ext_agent_host_id','generation','expires_at','terminal_error')}))


if __name__=='__main__':
    try: main()
    except AuthError as error: raise SystemExit(str(error))
