"""Loopback development plans and observed receipts; never launches a service.

The caller is the trusted ARCH/controller. Metadata assertions are not actor
identity authentication. No cloud provider, public deployment or credential API.
"""
import hashlib
import json
import math
from pathlib import Path
import re
from urllib.parse import urlsplit

SHA = re.compile(r'^[a-f0-9]{40}$')


def exact_head(value):
    if not isinstance(value, str) or not SHA.fullmatch(value):
        raise ValueError('exact integration SHA required')
    return value


def observation(receipt):
    if not isinstance(receipt, dict) or receipt.get('observed') is not True:
        raise ValueError('actual observation required; a plan is not evidence')
    for key in ('actor', 'source'):
        if not isinstance(receipt.get(key), str) or not receipt[key].strip() or len(receipt[key].encode()) > (256 if key == 'actor' else 16384):
            raise ValueError('actual actor and source reference required')
    at = receipt.get('observed_at')
    if type(at) not in (int, float) or not math.isfinite(at) or at <= 0:
        raise ValueError('actual observation timestamp required')


def loopback_url(value):
    if not isinstance(value, str):
        raise PermissionError('loopback development URL required')
    try:
        url = urlsplit(value)
        port = url.port
    except ValueError:
        raise PermissionError('invalid development URL') from None
    if (url.scheme != 'http' or url.hostname != '127.0.0.1' or
            url.username or url.password or port is None or not 1 <= port <= 65535 or
            url.path not in ('', '/') or url.query or url.fragment):
        raise PermissionError('only explicit-port http://127.0.0.1 development service allowed')
    return 'http://127.0.0.1:' + str(port) + '/'


def contained(path, root):
    path, root = Path(path), Path(root)
    if not path.is_absolute() or not root.is_absolute():
        raise PermissionError('absolute trusted runtime paths required')
    root = root.resolve()
    if root == Path(root.anchor):
        raise PermissionError('filesystem root cannot be a runtime scope')
    resolved = path.resolve()
    if resolved == root or not resolved.is_relative_to(root):
        raise PermissionError('path outside selected runtime scope')
    return resolved


def _source_path(value, worktree, directory=False):
    path = Path(value)
    if path.is_absolute() or any(part in ('', '.', '..') or part.startswith('.') for part in path.parts):
        raise PermissionError('relative owned source path required')
    result = contained(worktree / path, worktree)
    if directory and not result.is_dir() or not directory and not result.is_file():
        raise ValueError('development source path does not exist')
    return result


def plan_deployment(head, *, runtime, worktree, entrypoint, provider_path,
                    observed_head, host='127.0.0.1', port=8766):
    """Plan the supported Python proof-app CLI from an already verified worktree.

    No shell strings or caller-supplied bind flags. Caller selects the trusted
    runtime and independently reads actual Git HEAD. The plan is not a receipt.
    """
    exact_head(head)
    if observed_head != head:
        raise ValueError('development worktree HEAD differs from selected integration')
    if host != '127.0.0.1' or type(port) is not int or not 1 <= port <= 65535:
        raise PermissionError('loopback host and bounded port required')
    if not Path(runtime).is_absolute(): raise PermissionError('absolute selected runtime required')
    root = Path(runtime).resolve()
    work = contained(worktree, root)
    entry = _source_path(entrypoint, work)
    provider = _source_path(provider_path, work, directory=True)
    result = {'kind': 'development_plan', 'head': head, 'cwd': str(work),
              'url': 'http://127.0.0.1:' + str(port) + '/', 'shell': False,
              'argv': ['python3', str(entry), '--provider-path', str(provider),
                       '--host', host, '--port', str(port)],
              'environment_mode': 'replace',
              'environment': {'PATH': '/usr/local/bin:/usr/bin:/bin', 'LANG': 'C.UTF-8',
                              'PYTHONDONTWRITEBYTECODE': '1', 'PYTHONNOUSERSITE': '1',
                              'HOME': str(root / 'service-private'),
                              'CODEX_HOME': str(root / 'service-private' / 'codex')},
              'requires_actual_start_and_probe': True}
    result['plan_id'] = hashlib.sha256(json.dumps(result, sort_keys=True).encode()).hexdigest()
    return result


def validate_deployment_receipt(receipt, expected_head, *, plan=None):
    observation(receipt)
    exact_head(expected_head)
    if receipt.get('head') != expected_head or receipt.get('status') != 'running':
        raise ValueError('actual running deployment on current integration required')
    url = loopback_url(receipt.get('url'))
    if type(receipt.get('http_status')) is not int or not 200 <= receipt['http_status'] < 300:
        raise ValueError('actual successful development-service probe required')
    if plan is not None and (plan.get('kind') != 'development_plan' or
                             plan.get('head') != expected_head or plan.get('url') != url or
                             receipt.get('plan_id') != plan.get('plan_id')):
        raise ValueError('deployment receipt does not match exact plan')
    return {**receipt, 'url': url}
