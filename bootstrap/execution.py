"""Protocol adapter for a separately provisioned, credential-isolated executor.

The trusted executable implements `codex` and `verify` requests on stdin. It must
confine model tools AND acceptance code, deny direct provider credentials/routes,
and keep subscription refresh credentials outside those compartments. No local
unsandboxed fallback exists. This module does not claim to provide that host.
"""
import json
import os
from pathlib import Path
import subprocess


class Executor:
    def __init__(self, repo):
        configured = os.environ.get('P4_ISOLATED_EXECUTOR')
        if not configured:
            raise RuntimeError('ISOLATED_EXECUTOR_REQUIRED')
        self.path = Path(configured).resolve(strict=True)
        if self.path.is_relative_to(Path(repo).resolve()):
            raise RuntimeError('executor must be installed outside the development repository')
        if not self.path.is_file() or self.path.stat().st_mode & 0o022:
            raise RuntimeError('executor must be a protected regular executable')

    def command(self, mode, payload):
        if mode not in ('codex', 'verify'):
            raise ValueError('unknown executor mode')
        return [str(self.path), mode], json.dumps(payload)

    def start(self, payload, log, err):
        argv, request = self.command('codex', payload)
        p = subprocess.Popen(argv, stdin=subprocess.PIPE, stdout=log, stderr=err,
                             text=True, start_new_session=True)
        p.stdin.write(request+'\n')
        p.stdin.close()
        return p

    def verify(self, job, path):
        argv, request = self.command('verify', {'workspace': str(path), 'argv': job['verify'],
                                              'job': job['id'], 'generation':job.get('attempt',0), 'owned_paths': job['paths'], 'role': 'JOB', 'timeout': 60})
        return subprocess.run(argv, input=request, text=True, capture_output=True, timeout=75)
