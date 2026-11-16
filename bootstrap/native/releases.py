"""Development-release preparation only; no publication or provider adapter."""
import hashlib
import json
import os
from pathlib import Path
import re
import tempfile
from .development import contained, exact_head
from .walks import assess_round

RELEASE = re.compile(r'^[a-z0-9][a-z0-9-]{0,63}$')
MAX_MANIFEST_BYTES = 65536


def prepare_development_release(state, *, expected_head, release_id):
    exact_head(expected_head)
    if not isinstance(release_id, str) or not RELEASE.fullmatch(release_id): raise ValueError('bounded local development-release identity required')
    result = assess_round(state, expected_head)
    if result['status'] != 'clean': raise PermissionError('current clean three-stage round required for release preparation')
    value = state['native_development']
    return {'kind': 'development_release', 'version': 1, 'release_id': release_id,
            'head': expected_head, 'round': value['round'], 'public': False,
            'publication_authorized': False, 'product_stages': result['product_stages'],
            'module_sources': {k: v['source'] for k, v in value['module_evidence'].items()},
            'walk_sources': {k: v['source'] for k, v in value['walks'].items()}}


def stage_development_release(manifest, destination, *, runtime):
    if not isinstance(manifest, dict) or manifest.get('kind') != 'development_release' or manifest.get('public') is not False or manifest.get('publication_authorized') is not False:
        raise PermissionError('only nonpublic local development manifests can be staged')
    exact_head(manifest.get('head'))
    if not RELEASE.fullmatch(manifest.get('release_id', '')): raise ValueError('invalid release identity')
    dest = contained(destination, runtime)
    if dest.suffix != '.json': raise PermissionError('development preparation stages a JSON manifest only')
    raw = (json.dumps(manifest, sort_keys=True, indent=2) + '\n').encode()
    if len(raw) > MAX_MANIFEST_BYTES: raise ValueError('development manifest byte limit exceeded')
    if dest.exists():
        if dest.read_bytes() != raw: raise PermissionError('existing development artifact differs; never overwrite')
    else:
        dest.parent.mkdir(parents=True, exist_ok=True)
        fd, name = tempfile.mkstemp(prefix='.release-', dir=dest.parent)
        try:
            with os.fdopen(fd, 'wb') as out: out.write(raw); out.flush(); os.fsync(out.fileno())
            # Never replace a concurrently created artifact.
            os.link(name, dest)
        finally:
            if os.path.exists(name): os.unlink(name)
    return {'path': str(dest), 'sha256': hashlib.sha256(raw).hexdigest(), 'bytes': len(raw),
            'published': False, 'scope': 'local development manifest only'}


def publish_release(*args, **kwargs):
    raise PermissionError('public publication is outside this implementation; independent owner approval and separately authorized adapter required')
