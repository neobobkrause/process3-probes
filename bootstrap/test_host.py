"""Host-boundary regression fixtures. No real grants or isolation are claimed."""
import json
import os
from pathlib import Path
import subprocess
import tempfile
import time
import unittest
from unittest.mock import patch

import coordinator as c
from execution import Executor
from grants import host
from grants.grants import Denied, GrantPolicy, Subject
from runner import Runner, assessment
from test_coordinator import Memory, job


def fixture_policy():
    # Deliberately local test bytes, never a deployed owner approval.
    from hashlib import sha256
    actions = {r: [] for r in ('ROOT','WATCHER','COORDINATOR','ARCH','JOB','LANE','PROCESS','WORKER')}
    actions['COORDINATOR'] = ['github.state.update']
    actions['JOB'] = ['github.branch.update', 'github.pr.open']
    blob = json.dumps(dict(version=1, owner_approved=True, repositories=[c.REPO],
                           actions=actions, cloudflare={'account':'fixture','resources':[]})).encode()
    return GrantPolicy(blob, sha256(blob).hexdigest())


class HostTests(unittest.TestCase):
    def test_missing_policy_refuses_before_state_write(self):
        with patch.dict(os.environ, {}, clear=True), patch.object(c, 'run') as run:
            with self.assertRaisesRegex(Denied, 'PINNED_OWNER_POLICY_REQUIRED'):
                c.GitHub('codex/p4-state-test').write(c.empty(), None)
            run.assert_not_called()

    def test_no_raw_github_mutation_escape(self):
        with patch.object(c, 'run') as run:
            with self.assertRaises(PermissionError):
                c.GitHub('codex/p4-state-test').api('git/refs', 'POST', {})
            run.assert_not_called()

    def test_wrong_module_never_reaches_adapter(self):
        boundary = host.Host(fixture_policy())
        subject = Subject('fixture', 'JOB', c.REPO, 'codex/p4-job-test-provider', 'provider')
        called = []
        with self.assertRaisesRegex(Denied, 'OUTSIDE_MODULE_OWNERSHIP'):
            boundary.perform(subject, 'github.branch.update',
                {'branch': subject.branch, 'paths':['other/file.py']},
                lambda: called.append(True), {'owned_paths':('toy/provider/',)})
        self.assertEqual(called, [])

    def test_state_branch_is_bound_to_host_store(self):
        with patch.object(host.Host, 'configured', return_value=host.Host(fixture_policy())), \
             patch.object(c, 'run', return_value='{}') as run:
            c.GitHub('codex/p4-state-test').write(c.empty(), None)
            self.assertEqual(run.call_count, 1)

    def test_arch_pr_no_longer_requires_nonexistent_branch_field(self):
        # JOB's own branch is already enough; an ARCH policy is independently tested in grants.
        fixture_policy().authorize(Subject('fixture','JOB',c.REPO,'codex/p4-job-test-provider'),
                                  'github.pr.open', {'repo':c.REPO,'head':'codex/p4-job-test-provider',
                                                     'base':'codex/process4-bootstrap-20261116'})

    def test_no_executor_means_no_verifier_subprocess(self):
        sup = object.__new__(c.Supervisor); sup.repo = Path('/workspace/process3-probes')
        with patch.dict(os.environ, {}, clear=True), patch.object(subprocess, 'run') as run:
            with self.assertRaisesRegex(RuntimeError,'ISOLATED_EXECUTOR_REQUIRED'):
                sup.verify(job(), Path('/tmp'))
            run.assert_not_called()

    def test_executor_cannot_be_supplied_by_development_repo(self):
        with tempfile.TemporaryDirectory() as td:
            executable = Path(td)/'malicious'; executable.touch()
            with patch.dict(os.environ, {'P4_ISOLATED_EXECUTOR':str(executable)}):
                with self.assertRaisesRegex(RuntimeError,'outside'):
                    Executor(td)

    def test_generic_stop_is_not_fabricated_owner_instruction(self):
        state=c.empty(); state['stopped']=True
        self.assertEqual(assessment(state).status,'stopped')
        c.control(state,'stop')
        self.assertEqual(assessment(state).status,'owner_stopped')

    def test_clean_role_turn_does_not_end_assignment(self):
        state=c.empty(); state['role_sessions']={'ROOT':{'status':'ready','next_wake':0}}
        store=Memory(state); runner=Runner(store,'fixture','/tmp/fixture')
        with patch.object(host.Host,'configured'), patch('runner.Executor'), \
             patch('runner.roles.Runtime') as runtime:
            self.assertEqual(runner.cycle(),'continue')
            runtime.return_value.turn.assert_called_once_with('ROOT')
        self.assertEqual(store.s['continuation']['assessment']['status'],'continue')

    def test_stop_and_individual_external_block_survive_runner(self):
        state=c.empty(); c.add(state,job()); c.control(state,'stop')
        store=Memory(state)
        with patch('runner.Executor') as executor:
            self.assertEqual(Runner(store,'fixture','/tmp/fixture').cycle(),'owner_stopped')
            executor.assert_not_called()
        self.assertEqual(store.s['jobs']['provider']['status'],'ready')


if __name__ == '__main__': unittest.main()

class AssignmentTests(unittest.TestCase):
    def test_overlap_and_reversed_provider_order_rejected(self):
        state=c.empty(); c.add(state,job())
        other=job('consumer',1); other['paths']=['toy/provider.txt/subpath']
        with self.assertRaisesRegex(ValueError,'overlaps'): c.add(state,other)
        other=job('consumer',-1); other['uses']=['provider']
        with self.assertRaisesRegex(ValueError,'precede'): c.add(state,other)

    def test_only_arch_can_submit_module_assignments(self):
        import roles
        state=c.empty()
        packet={'summary':'fixture assignment packet','actions':[],'assignments':[job()]}
        with self.assertRaises(ValueError): roles.apply(state,'ROOT',packet)
        roles.apply(state,'ARCH',packet)
        self.assertEqual(state['jobs']['provider']['status'],'ready')
        self.assertEqual(state['jobs']['provider']['attempt'],0)

class TechnicalControlTests(unittest.TestCase):
    def test_arch_correction_is_not_fabricated_owner_instruction(self):
        import roles
        state=c.empty(); c.add(state,job()); state['jobs']['provider']['status']='blocked'
        packet={'summary':'fixture technical correction','actions':[],
                'job_controls':[{'id':'provider','action':'instruction','text':'Fixture correction: finish existing module.'}]}
        roles.apply(state,'ARCH',packet)
        result=state['jobs']['provider']
        self.assertEqual(result['status'],'ready')
        self.assertEqual(result['instructions'],[])
        self.assertEqual(result['technical_instructions'],['Fixture correction: finish existing module.'])
        self.assertEqual(state['instructions'],[])

    def test_arch_cannot_retry_known_invalid_authorization(self):
        import roles
        state=c.empty(); c.add(state,job()); state['external_dependencies']={'provider':{'dependency':'subscription-authorization','terminal':True}}
        packet={'summary':'fixture','actions':[],'job_controls':[{'id':'provider','action':'retry','text':'retry'}]}
        with self.assertRaisesRegex(ValueError,'new host evidence'): roles.apply(state,'ARCH',packet)
