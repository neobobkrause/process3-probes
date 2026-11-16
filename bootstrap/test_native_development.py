"""Development scope fixtures; no service or provider is started."""
from pathlib import Path
import tempfile
import unittest
from native import development as d

H = 'a' * 40


class DevelopmentTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.runtime = Path(self.temp.name); self.work = self.runtime / 'deployment'; self.work.mkdir()
        (self.work / 'web').mkdir(); (self.work / 'web/app.py').write_text('# fixture')
        (self.work / 'provider').mkdir()

    def plan(self, **changes):
        args = dict(runtime=self.runtime, worktree=self.work, entrypoint='web/app.py',
                    provider_path='provider', observed_head=H)
        args.update(changes)
        return d.plan_deployment(H, **args)

    def test_exact_source_loopback_and_credential_hygiene_plan(self):
        plan = self.plan()
        self.assertEqual(plan['url'], 'http://127.0.0.1:8766/')
        self.assertFalse(plan['shell']); self.assertTrue(plan['requires_actual_start_and_probe'])
        self.assertEqual(plan['argv'][-4:], ['--host', '127.0.0.1', '--port', '8766'])
        self.assertEqual(set(plan['environment']), {'PATH', 'LANG', 'PYTHONDONTWRITEBYTECODE', 'PYTHONNOUSERSITE', 'HOME', 'CODEX_HOME'})
        self.assertFalse((self.runtime / 'service-private').exists())
        self.assertEqual(plan, self.plan())
        with self.assertRaises(ValueError): self.plan(observed_head='b' * 40)

    def test_paths_and_network_cannot_expand_selected_development_scope(self):
        for kwargs in ({'host': '0.0.0.0'}, {'port': True}, {'port': 65536},
                       {'entrypoint': '../outside.py'}, {'provider_path': '/tmp'},
                       {'worktree': self.runtime}, {'runtime': 'relative'}):
            with self.subTest(kwargs=kwargs), self.assertRaises((ValueError, PermissionError)): self.plan(**kwargs)
        outside = self.runtime / 'outside.py'; outside.write_text('# outside worktree')
        (self.work / 'web/link.py').symlink_to(outside)
        with self.assertRaises(PermissionError): self.plan(entrypoint='web/link.py')

    def test_receipt_requires_actual_probe_and_matching_plan(self):
        plan = self.plan()
        receipt = {'observed': True, 'actor': '/root/root/arch', 'source': 'actual fixture probe reference',
                   'observed_at': 100, 'head': H, 'status': 'running', 'url': plan['url'],
                   'http_status': 200, 'plan_id': plan['plan_id']}
        self.assertEqual(d.validate_deployment_receipt(receipt, H, plan=plan), receipt)
        for change in ({'observed': False}, {'head': 'b'*40}, {'status': 'planned'},
                       {'http_status': 500}, {'plan_id': 'wrong'}, {'url': 'http://127.0.0.1:8767/'}):
            with self.subTest(change=change), self.assertRaises(ValueError):
                d.validate_deployment_receipt({**receipt, **change}, H, plan=plan)

    def test_external_url_rejects_public_hosts_credentials_and_deceptive_localnames(self):
        for url in ('https://127.0.0.1:8766/', 'http://localhost:8766/',
                    'http://127.0.0.1.evil:8766/', 'http://user:pass@127.0.0.1:8766/',
                    'http://127.0.0.1:8766/path', 'http://127.0.0.1:8766/?x=1',
                    'http://127.0.0.1/', 'http://[::1]:8766/'):
            with self.subTest(url=url), self.assertRaises(PermissionError): d.loopback_url(url)
