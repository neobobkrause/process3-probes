#!/usr/bin/env python3
"""Persistent host loop: bounded role/job turns never imply overall completion.

Install under an independent service manager. No Actions, scheduler API, or owner
computer is used. Local execution alone does not establish host persistence.
"""
import argparse
from dataclasses import asdict
import signal
import time

import coordinator as c
import roles
import job_pr
from execution import Executor
from grants import host
from grants.continuation import assess


def assessment(state):
    record = state.get('continuation', {})
    # Evidence entries are host/operator inputs; agents cannot set them through
    # the role packet protocol. Never infer proof from a turn or a test result.
    return assess(state, proofs=record.get('proofs', {}),
                  dependencies=record.get('dependencies', {}))


def record_assessment(store):
    def update(state):
        result = assessment(state)
        state.setdefault('continuation', {})['assessment'] = asdict(result)
        state['continuation']['assessed_at'] = time.time()
    return store.mutate(update)


class Runner:
    def __init__(self, store, repo, runtime):
        self.store, self.repo, self.runtime = store, repo, runtime
        self.stopping = False

    def cycle(self):
        state = record_assessment(self.store)
        result = assessment(state)
        if result.status in ('complete', 'owner_stopped', 'stopped', 'external_blocked'):
            return result.status
        # No inference starts without protected policy and executor provisioning.
        host.Host.configured()
        Executor(self.repo)
        role_state = state.get('role_sessions', {})
        due = [role for role in roles.ROLES if role in role_state and
               role_state[role]['status'] == 'ready' and
               role_state[role]['next_wake'] <= time.time()]
        if state.get('role_lease') and state['role_lease']['until'] <= time.time():
            self.store.mutate(roles.recover)
            return 'continue'
        if due:
            roles.Runtime(self.store, self.repo, self.runtime+'/roles').turn(due[0])
        if c.ready(state):
            c.Supervisor(self.store, self.repo, self.runtime+'/jobs').serve(300)
        # Even a clean bounded turn returns to this loop. Do not exit on idle:
        # a role wake, a newly ready job, or owner control may arrive later.
        latest,_=self.store.read()
        if any(j['status']=='done' and j.get('last_result',{}).get('verified') for j in latest['jobs'].values()):
            job_pr.reconcile(self.store)
        record_assessment(self.store)
        return 'continue'

    def serve(self, interval=15):
        while not self.stopping:
            result = self.cycle()
            if result == 'complete':
                return 0
            # Stops and external blockers remain observable; fresh external
            # evidence/control can unblock the same durable assignment.
            time.sleep(interval)
        return 0


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--state', required=True)
    parser.add_argument('--repo', required=True)
    parser.add_argument('--runtime', required=True)
    parser.add_argument('--once', action='store_true')
    parser.add_argument('--assess', action='store_true', help='read-only assessment; no launches or writes')
    args = parser.parse_args()
    runner = Runner(c.GitHub(args.state), args.repo, args.runtime)
    if args.assess:
        import json
        print(json.dumps(asdict(assessment(runner.store.read()[0])),indent=2))
        return 0
    def stop(*_):
        runner.stopping = True
    signal.signal(signal.SIGTERM, stop)
    signal.signal(signal.SIGINT, stop)
    if args.once:
        print(runner.cycle())
        return 0
    return runner.serve()


if __name__ == '__main__':
    raise SystemExit(main())
