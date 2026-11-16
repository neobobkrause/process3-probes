"""Pure PROCESS provenance checks and current instruction guard.

No owner policy is generated and no operation is executed. Actual identity/source
observations belong to the trusted native supervisor, not JSON labels or CLI fields.
"""
import copy
from collections.abc import Mapping

from grants.grants import Denied, check_operation


def _text(value):
    return isinstance(value, str) and bool(value.strip())


def require_owner_evidence(record, *, allowed_kinds=('need', 'decision', 'instruction')):
    """Validate a trusted adapter's observed input, never promote a proposal.

    A coordination adapter maps its observed console input to these fields while
    preserving exact text. The source label by itself does not authenticate anyone.
    """
    if (not isinstance(record, Mapping) or record.get('source') != 'observed-owner-input'
            or record.get('kind') not in allowed_kinds or record.get('kind') in ('question', 'proposal')
            or not _text(record.get('text')) or not _text(record.get('evidence'))):
        raise Denied('OBSERVED_OWNER_AUTHORITY_REQUIRED')
    return copy.deepcopy(dict(record))


def current_role(state, role):
    value = state.get('native_roles', {}).get(role)
    if (not isinstance(value, Mapping) or set(value) != {'target', 'generation'}
            or not _text(value.get('target')) or not value['target'].startswith('/root/')
            or type(value.get('generation')) is not int or not 1 <= value['generation'] < 2**63):
        raise Denied('CURRENT_NATIVE_ROLE_REQUIRED')
    return dict(value)


def process_request(state, *, actor, generation, evidence):
    """Return the existing layout-compatible request for a real ARCH observation."""
    if state.get('native_layout', {}).get('mode') != 'addressable_root':
        raise Denied('NATIVE_LAYOUT_REQUIRED')
    arch = current_role(state, 'ARCH')
    if type(generation) is not int or arch != {'target': actor, 'generation': generation} or not _text(evidence):
        raise Denied('CURRENT_ARCH_REQUEST_REQUIRED')
    return {'arch': arch, 'source': 'observed-native-ARCH-request', 'evidence': evidence}


def validate_process_request(state, request=None):
    if state.get('native_layout', {}).get('mode') != 'addressable_root':
        raise Denied('NATIVE_LAYOUT_REQUIRED')
    request = state.get('native_layout', {}).get('process_request') if request is None else request
    if (not isinstance(request, Mapping) or set(request) != {'arch', 'source', 'evidence'}
            or request.get('source') != 'observed-native-ARCH-request'
            or not isinstance(request.get('arch'), Mapping) or set(request['arch']) != {'target', 'generation'}
            or type(request['arch'].get('generation')) is not int
            or request.get('arch') != current_role(state, 'ARCH') or not _text(request.get('evidence'))):
        raise Denied('CURRENT_ARCH_REQUEST_REQUIRED')
    return copy.deepcopy(dict(request))


def plan_process_lane(state, *, actor):
    """A pure proposal; layout/native start+registration still require real tools."""
    request = validate_process_request(state)
    root = current_role(state, 'ROOT')
    if actor != root['target']:
        raise Denied('ROOT_CREATES_PROCESS')
    if state.get('stopped') is True:
        return {'action': 'hold', 'reason': 'durable stop preserved', 'role': 'PROCESS'}
    existing = state.get('native_roles', {}).get('PROCESS')
    return {'action': 'continue' if existing else 'create', 'role': 'PROCESS',
            'creator': actor, 'request': request,
            'generation': current_role(state, 'PROCESS')['generation'] if existing else 1,
            'requires_actual_native_event': True, 'changes_owner_grants': False}
