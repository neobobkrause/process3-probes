#!/usr/bin/env python3
"""Reconcile draft module PRs; never merge, mark ready, or create competing PRs."""
import argparse
import json
import subprocess
import coordinator as c

BASE='codex/process4-bootstrap-20261116'


def ensure(job):
    branch=job.get('branch','')
    if not branch.startswith('codex/p4-job-'):
        raise ValueError('dedicated job branch required')
    if job['status']!='done' or not job.get('last_result',{}).get('verified'):
        raise ValueError('unfinished assignment; no completed module PR to reconcile')
    prs=json.loads(c.run(['gh','pr','list','--repo',c.REPO,'--head',branch,
                         '--state','all','--json','number,url,state,isDraft,baseRefName']))
    if len(prs)>1: raise RuntimeError('multiple PRs for job branch; do not create another')
    if prs:
        pr=prs[0]
        if pr['state']!='OPEN' or not pr['isDraft'] or pr['baseRefName']!=BASE:
            raise RuntimeError('existing PR lifecycle differs; preserve it for ARCH')
        return pr['url']
    body=(f'Bootstrap module assignment `{job["id"]}`. Completion: {job["completion"]}\n\n'
          f'Checkpoint: {job["checkpoint"]}. Actual completed inference and module acceptance '
          'are recorded on the bootstrap state branch. This is isolated proof work, not a '
          'product tranche. Keep draft; do not merge. Replacement continues this same branch/PR.')
    # Feed prose as stdin; no shell interpolation, credential output, or temporary file needed.
    return c.run(['gh','pr','create','--repo',c.REPO,'--base',BASE,'--head',branch,
                  '--draft','--title',f'Process4 bootstrap module: {job["id"]}',
                  '--body-file','-'],input=body)


def reconcile(store):
    state,_=store.read()
    for jid,j in state['jobs'].items():
        if j['status']!='done': continue
        url=ensure(j)
        def record(s):
            current=s['jobs'][jid]
            # A provider notice/control may have reopened work while the API ran.
            if current['branch']!=j['branch']: raise RuntimeError('job branch changed')
            current['pr']=url
            if current.get('pr_recorded_checkpoint')!=j['checkpoint']:
                current['pr_recorded_checkpoint']=j['checkpoint']
                c.event(s,'job-draft-pr',job=jid,url=url,checkpoint=j['checkpoint'])
        store.mutate(record)


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__); p.add_argument('--state',required=True)
    reconcile(c.GitHub(p.parse_args().state))
