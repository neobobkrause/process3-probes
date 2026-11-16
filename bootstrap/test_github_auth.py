"""GitHub App issuance fixtures; no actual private key or installation is used."""
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives.serialization import Encoding,PrivateFormat,NoEncryption
import github_auth as g


class GitHubIdentityTests(unittest.TestCase):
    def test_renewable_token_scope_is_requested_and_verified(self):
        with tempfile.TemporaryDirectory() as td:
            key=Path(td)/'key'; key.write_bytes(rsa.generate_private_key(public_exponent=65537,key_size=2048).private_bytes(Encoding.PEM,PrivateFormat.PKCS8,NoEncryption())); key.chmod(0o600)
            env={'P4_GITHUB_APP_ID':'123','P4_GITHUB_INSTALLATION_ID':'456','P4_GITHUB_KEY_FILE':str(key)}
            result={'token':'fixture-installation-token','expires_at':'2099-01-01T00:00:00Z',
                    'permissions':{'contents':'write','pull_requests':'write','metadata':'read'}}
            with patch.dict(os.environ,env), patch.object(g,'_cached',None), \
                 patch.object(g,'request',side_effect=[result,{'total_count':1,'repositories':[{'full_name':g.REPO}]}]) as request:
                self.assertEqual(g.token(),'fixture-installation-token')
                self.assertEqual(g.token(),'fixture-installation-token')
                self.assertEqual(request.call_count,2)
                self.assertEqual(request.call_args_list[0].args[2]['repositories'],['process3-probes'])
                self.assertNotIn('administration',request.call_args_list[0].args[2]['permissions'])

    def test_expanded_repository_scope_fails_closed(self):
        with tempfile.TemporaryDirectory() as td:
            key=Path(td)/'key'; key.write_bytes(rsa.generate_private_key(public_exponent=65537,key_size=2048).private_bytes(Encoding.PEM,PrivateFormat.PKCS8,NoEncryption())); key.chmod(0o600)
            with patch.dict(os.environ,{'P4_GITHUB_APP_ID':'123','P4_GITHUB_INSTALLATION_ID':'456','P4_GITHUB_KEY_FILE':str(key)}), \
                 patch.object(g,'_cached',None),patch.object(g,'request',side_effect=[{'token':'fixture'}, {'total_count':2,'repositories':[]}]):
                with self.assertRaisesRegex(RuntimeError,'scope differs'): g.token()
