"""Readiness assessment beyond the historical basic capability inventory.

Trusted supervisors supply actual execution evidence. This module cannot attest
native identity, billing, observations or perpetual reliability. A completed JOB,
clean round, empty queue or historical 'demonstrated' capability result never
substitutes for the owner's seven remaining readiness areas.
"""
from collections.abc import Mapping
import math

CHECKS = {
    'parallel_jobs': ('actual_overlap', 'arch_supervised', 'slot_refilled', 'limits_preserved'),
    'multi_round_tranche': ('real_requirement', 'multiple_heads', 'stages_repeated', 'actual_flaws_resolved'),
    'design_lane': ('qualified', 'arch_question_route', 'knowledge_preserved', 'output_integrated'),
    'process_proposal': ('actual_defect', 'routed_to_process', 'proposal_preserved', 'unapproved_adoption_denied'),
    'owner_controls': ('exact_source_preserved', 'question', 'instruction', 'stop', 'priority', 'hold', 'slots',
                       'stop_after_scheduled_wake', 'stop_after_replacement'),
    'sustained_operation': ('meaningful_extended_work', 'replacement', 'context_continuity', 'completion',
                            'integration', 'communication', 'recovery', 'metrics'),
    'browser_development_release': ('exact_deployment', 'real_browser', 'journeys', 'release_prepared', 'no_publication'),
}


def _finite(value):
    return type(value) in (int, float) and math.isfinite(value) and value >= 0


def concurrent_windows(intervals):
    """Overlap of actual processing intervals, not durable reserved statuses.

    Timestamps must share the host clock. Source receipts should explain where
    first-processing/completion observations came from. A native running snapshot
    is corroboration, not a substitute for substantive work evidence.
    """
    if not isinstance(intervals, list) or len(intervals) > 64:
        raise ValueError('bounded actual processing intervals required')
    for row in intervals:
        if (not isinstance(row, Mapping) or not all(isinstance(row.get(k), str) and row[k].strip()
                for k in ('actor', 'job', 'evidence')) or not _finite(row.get('start'))
                or not _finite(row.get('end')) or row['end'] <= row['start']):
            raise ValueError('actual start/end and source evidence required')
    overlaps = []
    for i, a in enumerate(intervals):
        for b in intervals[i + 1:]:
            if a['actor'] == b['actor'] or a['job'] == b['job']:
                continue
            start, end = max(a['start'], b['start']), min(a['end'], b['end'])
            if end > start:
                overlaps.append({'actors': [a['actor'], b['actor']], 'jobs': [a['job'], b['job']],
                                 'start': start, 'end': end, 'seconds': end - start})
    return overlaps


def refill_latency(*, ready_at, slot_free_at, dispatched_at):
    if any(not _finite(v) for v in (ready_at, slot_free_at, dispatched_at)):
        raise ValueError('actual finite readiness, release and dispatch times required')
    eligible_at = max(ready_at, slot_free_at)
    if dispatched_at < eligible_at:
        raise ValueError('dispatch cannot precede eligibility')
    return {'eligible_at': eligible_at, 'dispatched_at': dispatched_at,
            'ready_with_free_slot_seconds': dispatched_at - eligible_at}


def assess(evidence):
    """Missing acceptance remains unfinished, even when every job is integrated.

    Each area's checks are observed facts with a meaningful artifact reference.
    A confirmed unmet essential prerequisite yields not_ready; unmeasured facts
    yield assessment_incomplete. Limitations always survive a successful verdict.
    Actual walk defects must be resolved; if none arose, the check may be true
    only with the explicit 'no observed flaws' limitation, not a fabricated loop.
    """
    if not isinstance(evidence, Mapping) or set(evidence) - set(CHECKS):
        raise ValueError('only declared readiness areas are accepted')
    completed, missing, blocked, limits = [], {}, {}, {}
    for area, required in CHECKS.items():
        row = evidence.get(area)
        if row is None:
            missing[area] = list(required)
            continue
        if (not isinstance(row, Mapping) or set(row) - {'checks', 'evidence', 'limitations', 'prerequisite'}
                or not isinstance(row.get('checks'), Mapping)
                or set(row['checks']) - set(required)
                or any(type(v) is not bool for v in row['checks'].values())
                or not isinstance(row.get('evidence'), str) or not row['evidence'].strip()
                or not isinstance(row.get('limitations', []), list)
                or any(not isinstance(v, str) or not v.strip() for v in row.get('limitations', []))):
            raise ValueError('explicit observed checks, artifact and bounded limitations required')
        if row.get('limitations'):
            limits[area] = row['limitations']
        absent = [k for k in required if row['checks'].get(k) is not True]
        prerequisite = row.get('prerequisite')
        if prerequisite is not None:
            if (not isinstance(prerequisite, Mapping) or set(prerequisite) != {'confirmed', 'detail', 'evidence'}
                    or prerequisite.get('confirmed') is not True
                    or any(not isinstance(prerequisite[k], str) or not prerequisite[k].strip()
                           for k in ('detail', 'evidence')) or not absent):
                raise ValueError('unmet prerequisite needs confirmed actual evidence')
            blocked[area] = dict(prerequisite)
        if absent:
            missing[area] = absent
        else:
            completed.append(area)
    return {'status': 'not_ready' if blocked else 'assessment_incomplete' if missing else 'ready_with_recorded_limits',
            'completed': completed, 'unfinished': missing, 'confirmed_prerequisites': blocked,
            'limitations': limits, 'scope': 'bounded observed readiness; not perpetual operation or credential attestation'}
