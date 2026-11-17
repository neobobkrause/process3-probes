"""Native Process4 acceptance under the owner's 16 November clarification.

Standing ROOT + scheduled continuation is sufficient; independent resurrection
following deletion/archival is not required. Module sandbox isolation is optional.
Explicit job ownership and checking actual changes before integration ARE required.
Consequential account/credential/branch/grant restrictions remain unchanged.
"""
from dataclasses import dataclass
from typing import Mapping

REQUIRED=(
    'managed_execution','native_child_start','native_child_message',
    'native_child_interrupt','native_child_replacement','hosted_wake_delivery',
    'standing_root','coordinator','arch_job_management','reactive_inter_session','interactive_sessions','job_ownership_instructions',
    'ownership_integration_control','automated_preservation_pr',
    'authorized_working_integration','all_user_notifications','unfinished_recovery',
    'module_tests','internal_walk','external_walk','consequential_restrictions',
)
DESIRABLE=('module_sandbox_isolation',)
NOT_REQUIRED=('root_recreation','root_loss_recovery')

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
    status='continue' if independent_work or unresolved else 'demonstrated' if not missing else 'external_blocked'
    return Assessment(status,observed,missing,blocked,unresolved)

def require_approved_runtime(*, provider, billing, mechanism):
    if provider!='openai_managed' or billing!='existing_subscription_allowance':
        raise PermissionError('OWNER_REQUIRES_NATIVE_SUBSCRIPTION_EXECUTION')
    if mechanism not in ('native_subagent','hosted_schedule','documented_cloud_cli'):
        raise PermissionError('UNSUPPORTED_OR_UNAPPROVED_LAUNCH_MECHANISM')

def replacement_scope(mechanism):
    if mechanism=='native_subagent': return 'current_agent_tree_child_only'
    if mechanism=='hosted_schedule': return 'scheduled_standing_chat_continuation'
    if mechanism=='documented_cloud_cli': return 'cloud_submission_requires_valid_native_auth_and_selector'
    raise PermissionError('UNKNOWN_SESSION_LIFECYCLE')

def require_development_admission(findings: Mapping[str, Finding]):
    """Jobs may develop under explicit instructions; integration is separately checked.

    This evidence helper is not a sandbox or a new grant. A canary finding is not
    a failed admission condition. Native controller checks actual changes before
    preserving/integrating work, and limits consequential provider operations.
    """
    required=('job_ownership_instructions','consequential_restrictions')
    absent=[key for key in required if key not in findings or findings[key].state!='observed']
    if absent:
        raise PermissionError('JOB_SCOPE_AND_CONSEQUENTIAL_RESTRICTIONS_REQUIRED: '+','.join(absent))
