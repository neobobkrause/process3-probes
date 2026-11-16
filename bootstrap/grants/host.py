"""Trusted-host integration. No policy is synthesized or approved by this code.

Load only a separately pinned owner-approved policy. This boundary is mandatory
for privileged supervisor writes; it is not an OS sandbox or an RPC endpoint.
"""
import os
from pathlib import Path

from .grants import Broker, Denied, GrantPolicy, Subject


class Host:
    def __init__(self, policy):
        self.policy = policy

    @classmethod
    def configured(cls):
        source = os.environ.get('P4_POLICY_FILE')
        digest = os.environ.get('P4_POLICY_SHA256')
        if not source or not digest:
            raise Denied('PINNED_OWNER_POLICY_REQUIRED')
        return cls(GrantPolicy(Path(source).read_bytes(), digest))

    def perform(self, subject, operation, request, adapter, facts=None):
        # Current assignment narrows any broader standing owner policy. No
        # agent, policy file or inherited grant can expand this experiment.
        allowed = {'github.state.update', 'github.branch.update', 'github.branch.create',
                   'github.pr.open', 'github.pr.update', 'github.pr.comment',
                   'session.start', 'session.replace', 'session.message', 'session.interrupt'}
        if operation not in allowed or subject.repo != 'neobobkrause/process3-probes':
            raise Denied('OUTSIDE_CURRENT_ASSIGNMENT')
        # Callbacks and identity are constructed by trusted supervisor code.
        # They must never be accepted from an agent packet or public RPC caller.
        broker = Broker(self.policy, lambda op, payload: adapter(),
                        lambda sid: subject if sid == subject.session_id else None,
                        lambda *_: facts or {})
        return broker.perform(subject.session_id, operation, request)


def perform(subject, operation, request, adapter, facts=None):
    return Host.configured().perform(subject, operation, request, adapter, facts)


def state_subject(branch):
    return Subject('host-state-controller', 'COORDINATOR',
                   'neobobkrause/process3-probes', branch=branch)
