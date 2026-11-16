#!/usr/bin/env python3
"""One credential owner, private Unix RPC for trusted app-server controllers only."""
import argparse
import json
import os
from pathlib import Path
import socket
import socketserver
import struct

if __package__:
    from .credentials import Vault, AuthError, TerminalAuthError, TemporaryAuthError
else:
    from credentials import Vault, AuthError, TerminalAuthError, TemporaryAuthError


class Server(socketserver.UnixStreamServer):
    # Serial request processing plus Vault.flock also covers maintenance commands.
    def __init__(self, path, vault):
        self.vault=vault
        super().__init__(path, Handler)
        os.chmod(path,0o600)


class Handler(socketserver.StreamRequestHandler):
    def handle(self):
        _, uid, _=struct.unpack('3i',self.request.getsockopt(socket.SOL_SOCKET,socket.SO_PEERCRED,12))
        if uid!=os.getuid(): return
        self.request.settimeout(25)
        try:
            data=json.loads(self.rfile.readline(4097))
            if data!={'operation':'access'}: raise AuthError('unknown_credential_operation')
            token,expires=self.server.vault.access()
            response={'access_token':token,'expires_at':expires}
        except TerminalAuthError as error: response={'error':str(error),'terminal':True}
        except (TemporaryAuthError,AuthError,ValueError,OSError): response={'error':'credential_temporarily_unavailable','terminal':False}
        self.wfile.write((json.dumps(response)+'\n').encode())


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--vault',required=True); parser.add_argument('--socket',required=True)
    args=parser.parse_args(); path=Path(args.socket)
    if path.parent.stat().st_mode & 0o077: raise SystemExit('socket directory must be owner-only')
    # Do not unlink an existing socket: another owner may be live. Service manager
    # uses RuntimeDirectory so stopped-instance sockets are cleaned on restart.
    with Server(str(path),Vault(args.vault)) as server:
        try: server.serve_forever()
        finally: path.unlink(missing_ok=True)


if __name__=='__main__': main()
