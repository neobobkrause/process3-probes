"""Evidence-based native Cloud feasibility; no HTTP task-launch implementation.

The approved architecture is OpenAI-managed execution within the owner's existing
subscription allowances. Self-hosting and API-key/metered fallbacks are rejected.
Native collaboration must be invoked by the hosted agent through its actual tool
catalog; these Python helpers do not manufacture a platform lifecycle API.
"""
from dataclasses import dataclass
from typing import Mapping


REQUIRED=(
    'managed_execution','native_child_start','native_child_message',
    'native_child_interrupt','native_child_replacement','hosted_wake_delivery',
    'root_recreation','root_loss_recovery','role_security_isolation',
    'exclusive_grants_enforcement',
)


@dataclass(frozen=True)
class Finding:
    state: str
    evidence: str
    limitation: str = ''

    def __post_init__(self):
        if self.state not in ('observed','documented','not_exposed','blocked','unproven') or not self.evidence.strip():
            raise ValueError('finding needs an explicit evidence classification and source')


@dataclass(frozen=True)
class Assessment:
    status: str
    demonstrated: tuple[str,...]
    missing: tuple[str,...]
    blocked: tuple[str,...]
    unresolved: tuple[str,...]


def assess(findings: Mapping[str, Finding], independent_work: tuple[str,...]=()) -> Assessment:
    observed=tuple(k for k in REQUIRED if k in findings and findings[k].state=='observed')
    missing=tuple(k for k in REQUIRED if k not in observed)
    blocked=tuple(k for k in missing if k in findings and findings[k].state in ('not_exposed','blocked'))
    unresolved=tuple(k for k in missing if k not in blocked)
    # Unknown/unproven is investigation work, not a confirmed external block.
    status='continue' if independent_work or unresolved else 'demonstrated' if not missing else 'platform_blocked'
    return Assessment(status,observed,missing,blocked,unresolved)


def require_approved_runtime(*, provider, billing, mechanism):
    if provider!='openai_managed' or billing!='existing_subscription_allowance':
        raise PermissionError('OWNER_REQUIRES_NATIVE_SUBSCRIPTION_EXECUTION')
    if mechanism not in ('native_subagent','hosted_schedule','documented_cloud_cli'):
        raise PermissionError('UNSUPPORTED_OR_UNAPPROVED_LAUNCH_MECHANISM')


# A native bounded child is not a new durable ROOT/cloud task. This distinction
# must survive generation changes, task completion and a passing child test.
def replacement_scope(mechanism):
    if mechanism=='native_subagent': return 'current_agent_tree_child_only'
    if mechanism=='hosted_schedule': return 'scheduled_chat_delivery_only'
    if mechanism=='documented_cloud_cli': return 'cloud_submission_requires_valid_native_auth_and_selector'
    raise PermissionError('UNKNOWN_SESSION_LIFECYCLE')


def require_development_admission(findings: Mapping[str, Finding]):
    """Normal role development must not inherit a failed probe's broad scope.

    Explicit harmless capability challenges are recorded separately. Successful
    child inference, instructions or a proposed broker are not security proof.
    """
    required=('role_security_isolation','exclusive_grants_enforcement')
    absent=[key for key in required if key not in findings or findings[key].state!='observed']
    if absent:
        raise PermissionError('NATIVE_ROLE_ENFORCEMENT_NOT_ESTABLISHED: '+','.join(absent))
