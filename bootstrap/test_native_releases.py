"""Local development-release fixtures; no publishing side effects."""
import copy
from pathlib import Path
import tempfile
import unittest
from native import releases as r, walks as w
from test_native_walks import H, ready, walk


class ReleaseTests(unittest.TestCase):
    def clean(self):
        state = ready(); w.record_walk(state, 'internal_walk', walk()); w.record_walk(state, 'external_walk', walk())
        return state

    def test_only_current_clean_round_can_prepare_nonpublic_manifest(self):
        state = self.clean(); m = r.prepare_development_release(state, expected_head=H, release_id='pilot-dev-1')
        self.assertFalse(m['public']); self.assertFalse(m['publication_authorized'])
        self.assertEqual(m['product_stages'], list(w.STAGES))
        with self.assertRaises(ValueError): r.prepare_development_release(state, expected_head='f'*40, release_id='pilot-dev-1')
        with self.assertRaises(PermissionError): r.prepare_development_release(ready(), expected_head=H, release_id='pilot-dev-1')
        state['stopped'] = True
        with self.assertRaises(PermissionError): r.prepare_development_release(state, expected_head=H, release_id='pilot-dev-1')

    def test_staging_is_bounded_idempotent_and_never_overwrites_or_escapes(self):
        m = r.prepare_development_release(self.clean(), expected_head=H, release_id='pilot-dev-1')
        with tempfile.TemporaryDirectory() as runtime:
            path = Path(runtime)/'release'/'manifest.json'
            first = r.stage_development_release(m, path, runtime=runtime)
            self.assertEqual(first, r.stage_development_release(m, path, runtime=runtime)); self.assertFalse(first['published'])
            different = {**m, 'round': 2}
            with self.assertRaises(PermissionError): r.stage_development_release(different, path, runtime=runtime)
            with self.assertRaises(PermissionError): r.stage_development_release(m, Path(runtime)/'..'/'outside.json', runtime=runtime)
            with self.assertRaises(PermissionError): r.stage_development_release(m, Path(runtime)/'release.zip', runtime=runtime)
            public = {**m, 'public': True}
            with self.assertRaises(PermissionError): r.stage_development_release(public, Path(runtime)/'public.json', runtime=runtime)
            huge = {**m, 'extra': 'x'*r.MAX_MANIFEST_BYTES}
            with self.assertRaises(ValueError): r.stage_development_release(huge, Path(runtime)/'huge.json', runtime=runtime)
            self.assertFalse((Path(runtime)/'huge.json').exists())

    def test_publication_never_automatic_even_if_caller_claims_approval(self):
        with self.assertRaises(PermissionError): r.publish_release(self.clean(), owner_approved=True)
        for name in ('../public', 'MAIN', ''):
            with self.assertRaises(ValueError): r.prepare_development_release(self.clean(), expected_head=H, release_id=name)
