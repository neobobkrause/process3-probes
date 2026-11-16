"""Draft PR lifecycle fixtures; no inference or real PR creation claimed."""
import json
import unittest
from unittest.mock import patch
import job_pr as p


class DraftPRTests(unittest.TestCase):
    def job(self):
        return dict(id='provider',branch='codex/p4-job-test-provider',status='done',
                    last_result={'verified':True},completion='value is 42',checkpoint='abc')

    def test_reuses_same_draft_for_replacement(self):
        pr=dict(url='fixture-url',number=1,state='OPEN',isDraft=True,baseRefName=p.BASE)
        with patch.object(p.c,'run',return_value=json.dumps([pr])) as run:
            self.assertEqual(p.ensure(self.job()),'fixture-url')
            self.assertEqual(run.call_count,1)

    def test_closed_or_ready_pr_is_preserved(self):
        for state,draft in [('CLOSED',True),('OPEN',False)]:
            with patch.object(p.c,'run',return_value=json.dumps([
                    dict(state=state,isDraft=draft,baseRefName=p.BASE)])) as run:
                with self.assertRaises(RuntimeError): p.ensure(self.job())
                self.assertEqual(run.call_count,1)

    def test_unfinished_cannot_get_completion_pr(self):
        j=self.job(); j['status']='blocked'
        with patch.object(p.c,'run') as run:
            with self.assertRaises(ValueError): p.ensure(j)
            run.assert_not_called()

    def test_create_is_draft_and_targets_only_bootstrap(self):
        with patch.object(p.c,'run',side_effect=['[]','fixture-new-url']) as run:
            self.assertEqual(p.ensure(self.job()),'fixture-new-url')
            argv=run.call_args.args[0]
            self.assertIn('--draft',argv)
            self.assertEqual(argv[argv.index('--base')+1],p.BASE)
            self.assertIn('do not merge',run.call_args.kwargs['input'])


if __name__=='__main__': unittest.main()
