"""Explicit owner-identified design lanes, not wholesale draft adoption.

A lane stays a design-only ARCH child. Plans do not start sessions, create owner
approval, execute providers or claim module/product acceptance.
"""
import copy
import re
from pathlib import PurePosixPath

from grants.grants import Denied
from .governance import current_role, require_owner_evidence

DESIGN_EXTENSIONS = frozenset(('.md', '.txt', '.json', '.svg', '.png', '.jpg', '.jpeg', '.webp', '.drawio'))
NAME = re.compile(r'^[a-z][a-z0-9-]{0,48}$')
_FORBIDDEN = frozenset(('.git', '.github', '.claude', '.codex', '.aws', '.agents', '.process', 'CLAUDE.md', 'AGENTS.md'))


def _path(value):
    if (not isinstance(value, str) or not value or value.startswith('/') or '\\' in value or '\x00' in value
            or any(part in ('', '.', '..') or part in _FORBIDDEN for part in value.split('/'))
            or not PurePosixPath(value).parts or value == 'process/config.json' or value.startswith('bootstrap/OWNER-')):
        raise Denied('INVALID_DESIGN_OWNERSHIP')
    return value


def _overlap(a, b):
    return a == b or a.startswith(b + '/') or b.startswith(a + '/')


def validate_lane(state, name, lane=None, *, current_arch=True):
    if not isinstance(name, str) or not NAME.fullmatch(name):
        raise Denied('INVALID_DESIGN_LANE_NAME')
    lane = state.get('design_lanes', {}).get(name) if lane is None else lane
    if not isinstance(lane, dict) or set(lane) - {'need', 'paths', 'arch', 'status', 'session'}:
        raise Denied('EXPLICIT_DESIGN_LANE_REQUIRED')
    need = lane.get('need')
    if (not isinstance(need, dict) or set(need) != {'source', 'evidence', 'text'}
            or need.get('source') != 'observed-owner-need'):
        raise Denied('OWNER_IDENTIFIED_DESIGN_NEED_REQUIRED')
    require_owner_evidence({'source': 'observed-owner-input', 'kind': 'need',
                            'text': need['text'], 'evidence': need['evidence']}, allowed_kinds=('need',))
    if lane.get('status') not in ('requested', 'active'):
        raise Denied('INVALID_DESIGN_LANE_STATUS')
    paths = lane.get('paths')
    if not isinstance(paths, list) or not paths or any(not isinstance(p, str) for p in paths) or len(set(paths)) != len(paths):
        raise Denied('INVALID_DESIGN_OWNERSHIP')
    for path in paths:
        _path(path)
    if current_arch and lane.get('arch') != current_role(state, 'ARCH'):
        raise Denied('STALE_DESIGN_ARCH')
    if (not isinstance(lane.get('arch'), dict) or set(lane['arch']) != {'target', 'generation'}
            or type(lane['arch'].get('generation')) is not int or not 1 <= lane['arch']['generation'] < 2**63
            or not isinstance(lane['arch'].get('target'), str)
            or not re.fullmatch(r'/root/[a-z0-9_]+/[a-z0-9_]+', lane['arch']['target'])):
        raise Denied('STALE_DESIGN_ARCH')
    # No design lane may take a module's files or another lane's design folder.
    others = []
    for module in state.get('modules', {}).values():
        others.extend(module.get('paths', []))
    for other_name, other in state.get('design_lanes', {}).items():
        if other_name != name:
            others.extend(other.get('paths', []))
    if any(_overlap(path, other) for path in paths for other in others):
        raise Denied('OVERLAPPING_DESIGN_OWNERSHIP')
    if 'session' in lane:
        session = lane['session']
        if (not isinstance(session, dict) or set(session) != {'target', 'generation'}
                or type(session.get('generation')) is not int or not 1 <= session['generation'] < 2**63
                or not isinstance(session.get('target'), str)
                or session['target'].rsplit('/', 1)[0] != lane['arch']['target']
                or session['target'].count('/') - 1 != 3):
            raise Denied('INVALID_DESIGN_LANE_SESSION')
    return copy.deepcopy(lane)


def request_lane(state, name, *, actor, generation, owner_need, paths):
    """Return a requested lane; caller persists only an explicit design milestone."""
    if not isinstance(name, str) or not NAME.fullmatch(name):
        raise Denied('INVALID_DESIGN_LANE_NAME')
    arch = current_role(state, 'ARCH')
    if type(generation) is not int or arch != {'target': actor, 'generation': generation}:
        raise Denied('CURRENT_ARCH_REQUEST_REQUIRED')
    if name in state.get('design_lanes', {}):
        raise Denied('DESIGN_LANE_ALREADY_DECLARED')
    owner = require_owner_evidence(owner_need, allowed_kinds=('need',))
    lane = {'need': {'source': 'observed-owner-need', 'evidence': owner['evidence'], 'text': owner['text']},
            'paths': copy.deepcopy(paths), 'arch': arch, 'status': 'requested'}
    return validate_lane(state, name, lane)


def revalidate_lane(state, name, *, actor, generation, expected_generation, evidence):
    """Rebind creator provenance after actual failure, never invent a new need.

    Return a new declaration only. The trusted host supplies actual failure or
    explicit replacement evidence; text labels do not authenticate that event.
    Keep the old native binding until an actual replacement is created/registered.
    """
    arch = current_role(state, 'ARCH')
    if type(generation) is not int or arch != {'target': actor, 'generation': generation}:
        raise Denied('CURRENT_ARCH_REQUEST_REQUIRED')
    if state.get('stopped') is True:
        raise Denied('DURABLE_STOP_PRESERVED')
    if not isinstance(evidence, str) or not evidence.strip():
        raise Denied('ACTUAL_LANE_FAILURE_EVIDENCE_REQUIRED')
    lane = validate_lane(state, name, current_arch=False)
    binding = current_role(state, 'LANE:' + name)
    if (type(expected_generation) is not int or expected_generation != binding['generation']
            or not re.fullmatch(r'/root/[a-z0-9_]+/[a-z0-9_]+/[a-z0-9_]+', binding['target'])):
        raise Denied('CURRENT_DESIGN_LANE_GENERATION_REQUIRED')
    if 'session' in lane and lane['session'] != binding:
        raise Denied('STALE_DESIGN_LANE_SESSION')
    lane['arch'] = copy.deepcopy(arch)
    lane['status'] = 'requested'
    lane.pop('session', None)
    return validate_lane(state, name, lane)


def plan_lane(state, name, *, actor):
    declared = state.get('design_lanes', {}).get(name)
    # A previously observed native session need not be reparented when ARCH
    # changes. New creation still requires current ARCH revalidation.
    retained = isinstance(declared, dict) and 'session' in declared
    lane = validate_lane(state, name, current_arch=not retained)
    if actor != current_role(state, 'ARCH')['target']:
        raise Denied('ARCH_CREATES_DESIGN_LANE')
    if state.get('stopped') is True:
        return {'action': 'hold', 'reason': 'durable stop preserved', 'role': 'LANE:' + name}
    return {'action': 'continue' if lane.get('session') else 'create', 'role': 'LANE:' + name,
            'creator': actor, 'native_depth': 3, 'purpose': 'design-only',
            'owned_paths': lane['paths'], 'owner_need': lane['need'],
            'may_build_modules': False, 'may_merge': False, 'requires_actual_native_event': True}


def validate_design_changes(state, name, changed_paths):
    lane = validate_lane(state, name, current_arch=False)
    if not isinstance(changed_paths, (tuple, list)) or not changed_paths:
        raise Denied('ACTUAL_DESIGN_DIFF_REQUIRED')
    for path in changed_paths:
        _path(path)
        if PurePosixPath(path).suffix.lower() not in DESIGN_EXTENSIONS:
            raise Denied('DESIGN_ONLY_CHANGE_REQUIRED')
        if not any(path == root or path.startswith(root + '/') for root in lane['paths']):
            raise Denied('OUTSIDE_DESIGN_OWNERSHIP')
    return {'allow': True, 'role': 'LANE:' + name, 'scope': 'design-only', 'module_acceptance': False}
