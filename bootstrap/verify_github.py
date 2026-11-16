#!/usr/bin/env python3
"""Real GitHub storage/control/checkpoint rehearsal. NO Codex inference simulated or claimed."""
import argparse
import json
from pathlib import Path
import subprocess
import tempfile
import time
import coordinator as c


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--state',required=True); p.add_argument('--base',required=True)
    p.add_argument('--repo',default='.'); a=p.parse_args()
    store=c.GitHub(a.state); store.init(a.base)
    spec=dict(id='storage-provider',order=0,paths=['toy/storage-provider'],uses=[],
              prompt='Storage rehearsal only; no Codex assignment execution.',
              completion='Harness-authored checkpoint survives reconstruction.',verify=['python','-c','pass'])
    store.mutate(lambda s:c.add(s,spec))
    for i in range(3):
        store.mutate(lambda s,i=i:c.declare(s,dict(id=f'declared-user-{i}',order=i+1,paths=[],uses=['storage-provider'])))
    print('PASS real GitHub assignment and three declared users without open jobs')
    stale,sha=store.read()
    exact='Instruction: preserve these words exactly.\nThis is a storage rehearsal, not an owner product decision.'
    store.mutate(lambda s:c.control(s,'instruction','storage-provider',exact))
    try: store.write(stale,sha)
    except c.StateConflict:
        pass
    else: raise AssertionError('stale state write unexpectedly succeeded')
    assert store.read()[0]['jobs']['storage-provider']['instructions']==[exact]
    print('PASS stale GitHub SHA write rejected; exact instruction preserved')
    store.mutate(lambda s:c.control(s,'stop'))
    with tempfile.TemporaryDirectory(prefix='p4-storage-') as runtime:
        sup=c.Supervisor(store,a.repo,runtime)
        sup.claim()
        assert store.read()[0]['stopped'] and not c.ready(store.read()[0])
        print('PASS replacement supervisor respects durable stop')
        branch='codex/p4-job-'+a.state.removeprefix('codex/p4-state-')+'-storage-provider'
        base=store.api(f'commits/{a.base}')['sha']
        store.api('git/refs','POST',{'ref':'refs/heads/'+branch,'sha':base})
        def reserve(s):
            j=s['jobs']['storage-provider']; j.update(branch=branch,base=base,attempt=1,status='running')
        store.mutate(reserve)
        j=store.read()[0]['jobs']['storage-provider']; path=sup.workspace(j)
        target=path/'toy/storage-provider'; target.mkdir(parents=True)
        (target/'checkpoint.txt').write_text('Harness-authored storage evidence; not a Codex result.\n')
        commit=sup.checkpoint(j,path)
        def saved(s):
            s['jobs']['storage-provider']['checkpoint']=commit
            c.notify(s,'storage-provider',commit)
            c.notify(s,'storage-provider',commit)
            s['lease']['until']=time.time()-1
        store.mutate(saved)
        print('PASS actual owned-path Git commit and remote branch checkpoint',commit)
        restored=store.read()[0]
        assert len(restored['notices'])==3
        assert all(n['status']=='pending' for n in restored['notices'].values())
        print('PASS every declared user notified once on actual provider checkpoint')
        # New host equivalent: no old worktrees or Codex history used by this instance.
        with tempfile.TemporaryDirectory(prefix='p4-recovery-') as fresh:
            replacement=c.Supervisor(store,a.repo,fresh); replacement.claim()
            restored=store.read()[0]; j=restored['jobs']['storage-provider']
            assert j['status']=='ready' and restored['stopped']
            recovered=replacement.workspace(j)
            assert (recovered/'toy/storage-provider/checkpoint.txt').read_text().startswith('Harness-authored')
            print('PASS new runtime reconstructs unfinished branch from GitHub; stop still set')
            store.mutate(lambda s:s.update(lease=None))
    print(json.dumps(store.read()[0],indent=2))

if __name__=='__main__': main()
