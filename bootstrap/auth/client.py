"""Only trusted controllers import this; never install it inside a job sandbox."""
import json
import socket

from .credentials import TerminalAuthError, TemporaryAuthError


def access(path):
    with socket.socket(socket.AF_UNIX,socket.SOCK_STREAM) as client:
        client.settimeout(25)
        try:
            client.connect(str(path)); client.sendall(b'{"operation":"access"}\n')
            with client.makefile('rb') as stream: result=json.loads(stream.readline(65536))
        except (OSError,ValueError): raise TemporaryAuthError('credential_owner_unavailable') from None
    if 'error' in result:
        raise (TerminalAuthError if result.get('terminal') else TemporaryAuthError)(result['error'])
    return result['access_token'],result['expires_at']
