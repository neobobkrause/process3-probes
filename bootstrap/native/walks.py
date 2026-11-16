"""Three product stages and bounded latest-round evidence, not a proof generator.

Trusted controller supplies actual tool-source observations and independently
fetched Git/module facts. Arbitrary agent packets are not authenticated by fields.
"""
import copy
from .development import exact_head, observation, validate_deployment_receipt

STAGES = ('module_tests', 'internal_walk', 'external_walk')


def _text(value, name):
    if not isinstance(value, str) or not value.strip() or len(value.encode()) > 16384:
        raise ValueError(name + ' must be a bounded nonempty source reference')
    return value


def validate_module_evidence(evidence, expected_head, *, module=None, trusted=None):
    """Accept tests only for latest accepted checkpoint and unchanged owned trees.

    `trusted` is supervisor-fetched, not an evidence-packet property. Its tree maps
    cover actual owned paths and dependency trees at testing/current integration.
    An ancestor relationship alone is insufficient if a module changed afterward.
    """
    observation(evidence); exact_head(expected_head)
    module = module or evidence.get('module')
    _text(module, 'module')
    if evidence.get('module') != module or evidence.get('integration_head') != expected_head:
        raise ValueError('module evidence is not bound to this integration')
    exact_head(evidence.get('tested_head'))
    if evidence.get('returncode') != 0 or type(evidence.get('returncode')) is not int:
        raise ValueError('successful actual module command required')
    if type(evidence.get('test_count')) is not int or evidence['test_count'] < 1:
        raise ValueError('nonzero actual module test count required')
    command = evidence.get('command')
    if not isinstance(command, list) or not command or any(not isinstance(v, str) or not v for v in command):
        raise ValueError('actual module command argv required')
    facts = trusted or {}
    if facts.get('accepted') is not True or facts.get('checkpoint') != evidence['tested_head']:
        raise ValueError('tests must match trusted latest accepted module checkpoint')
    paths = facts.get('owned_paths')
    tested, current = facts.get('tested_trees'), facts.get('current_trees')
    if (not isinstance(paths, (list, tuple)) or not paths or len(set(paths)) != len(paths) or
            not isinstance(tested, dict) or not isinstance(current, dict) or
            set(tested) != set(paths) or set(current) != set(paths) or tested != current):
        raise ValueError('owned module paths changed or lack exact tree provenance')
    for path, tree in tested.items():
        _text(path, 'owned path'); exact_head(tree)
    dependencies = facts.get('tested_dependencies', {})
    required_dependencies = facts.get('required_dependencies')
    if not isinstance(required_dependencies, (list, tuple)) or len(set(required_dependencies)) != len(required_dependencies):
        raise ValueError('trusted declared dependency scope required, including an explicit empty list')
    if not isinstance(dependencies, dict) or set(dependencies) != set(required_dependencies) or dependencies != facts.get('current_dependencies', {}):
        raise ValueError('provider dependency trees changed after module tests')
    for tree in dependencies.values(): exact_head(tree)
    return {**copy.deepcopy(evidence), 'provenance': {
        'checkpoint': facts['checkpoint'], 'owned_paths': list(paths),
        'owned_trees': copy.deepcopy(tested), 'dependency_trees': copy.deepcopy(dependencies)}}


def _job_paths(state, module):
    job = state.get('jobs', {}).get(module)
    paths = job.get('paths') if isinstance(job, dict) else None
    if not isinstance(paths, (list, tuple)) or not paths:
        raise ValueError('current assigned module owned paths required')
    for path in paths: _text(path, 'assigned owned path')
    if len(set(paths)) != len(paths): raise ValueError('duplicate assigned owned paths')
    declared = state.get('modules', {}).get(module, {})
    if 'paths' in declared:
        defined = declared['paths']
        if not isinstance(defined, (list, tuple)) or not all(isinstance(p, str) for p in defined) or set(defined) != set(paths):
            raise ValueError('assigned paths differ from current declared module ownership')
    return sorted(paths)


def start_round(state, head, modules=None):
    exact_head(head)
    declared = state.get('modules', state.get('jobs', {}))
    modules = list(state.get('jobs', {})) if modules is None else list(modules)
    if not modules or len(set(modules)) != len(modules) or any(m not in declared for m in modules) or not set(state.get('jobs', {})).issubset(modules):
        raise ValueError('explicit nonempty declared-module scope required')
    previous = state.get('native_development')
    if previous and previous['head'] == head:
        if previous['required_modules'] != modules:
            raise ValueError('same-head round scope cannot silently change')
        _round(state, head)  # Reusing a round must not relabel its assignment paths.
        return previous
    carry = {} if not previous else copy.deepcopy(previous.get('carry_flaws', {}))
    if previous:
        resolved = {key for walk in previous['walks'].values() for key in walk.get('resolved_flaws', {})}
        carry = {key: flaw for key, flaw in carry.items() if key not in resolved}
        for walk in previous['walks'].values():
            for flaw in walk['flaws']: carry[flaw['id']] = copy.deepcopy(flaw)
    if len(carry) > 256: raise ValueError('outstanding flaw capacity exceeded; ARCH must resolve existing obligations')
    state['native_development'] = {'round': 1 if not previous else previous['round'] + 1,
        'head': head, 'required_modules': modules,
        'required_owned_paths': {module: _job_paths(state, module) for module in modules}, 'module_evidence': {},
        'walks': {}, 'carry_flaws': carry}
    return state['native_development']


def _round(state, head=None):
    value = state.get('native_development')
    if not isinstance(value, dict): raise ValueError('start a SHA-bound development round first')
    exact_head(value.get('head'))
    if (not isinstance(value.get('required_modules'), list) or not value['required_modules'] or
            not isinstance(value.get('module_evidence'), dict) or not isinstance(value.get('walks'), dict) or
            not isinstance(value.get('carry_flaws'), dict)):
        raise ValueError('invalid current development round')
    if not set(state.get('jobs', {})).issubset(value['required_modules']):
        raise ValueError('round scope is stale: newly assigned module requires integration and new round')
    if value.get('required_owned_paths') != {module: _job_paths(state, module) for module in value['required_modules']}:
        raise ValueError('round scope is stale: module ownership paths changed at the same head')
    if head is not None and value['head'] != head: raise ValueError('stale round integration head')
    return value


def record_module_evidence(state, module, evidence, *, trusted):
    value = _round(state)
    if module not in value['required_modules']: raise ValueError('module outside current product scope')
    if sorted(trusted.get('owned_paths', [])) != _job_paths(state, module):
        raise ValueError('trusted owned paths must exactly match current assigned job paths')
    declared_dependencies = state.get('modules', {}).get(module, {}).get('uses', [])
    if set(trusted.get('required_dependencies', [])) != set(declared_dependencies):
        raise ValueError('trusted dependency scope must match declared module uses')
    value['module_evidence'][module] = validate_module_evidence(evidence, value['head'], module=module, trusted=trusted)
    return value['module_evidence'][module]


def _modules_valid(state, value):
    for module in value['required_modules']:
        e = value['module_evidence'].get(module)
        if not isinstance(e, dict) or e.get('integration_head') != value['head']: return False
        job = state.get('jobs', {}).get(module)
        if not isinstance(job, dict) or job.get('accepted') is not True or job.get('checkpoint') != e.get('tested_head'): return False
        proof = e.get('provenance', {})
        try:
            if sorted(proof.get('owned_paths', [])) != _job_paths(state, module): return False
            validate_module_evidence(e, value['head'], module=module, trusted={
                'accepted': job['accepted'], 'checkpoint': job['checkpoint'],
                'owned_paths': proof.get('owned_paths'), 'tested_trees': proof.get('owned_trees'),
                'current_trees': proof.get('owned_trees'),
                'required_dependencies': state.get('modules', {}).get(module, {}).get('uses', []),
                'tested_dependencies': proof.get('dependency_trees', {}),
                'current_dependencies': proof.get('dependency_trees', {})})
        except (ValueError, KeyError, TypeError): return False
    return True


def record_walk(state, stage, evidence):
    if stage not in ('internal_walk', 'external_walk'): raise ValueError('only the two prescribed product walks are supported')
    value = _round(state)
    observation(evidence)
    previous = value['walks'].get(stage)
    if previous and previous['flaws'] and evidence != previous:
        raise ValueError('recorded flaws require a corrective integration and a new round, not same-head erasure')
    if evidence.get('head') != value['head']: raise ValueError('walk evidence belongs to stale integration')
    if not _modules_valid(state, value): raise ValueError('current module evidence required before walks')
    _text(evidence.get('design'), 'UX Screens/Journeys design')
    coverage = evidence.get('coverage')
    if not isinstance(coverage, list) or not coverage or len(coverage) > 256 or len(set(coverage)) != len(coverage):
        raise ValueError('actual screen/journey coverage required')
    for item in coverage: _text(item, 'coverage item')
    flaws = evidence.get('flaws')
    if not isinstance(flaws, list) or len(flaws) > 256: raise ValueError('bounded explicit flaw list required')
    seen = set()
    for flaw in flaws:
        if not isinstance(flaw, dict) or flaw.get('module') not in state.get('modules', state.get('jobs', {})):
            raise ValueError('flaw must name a declared module for ARCH ownership assignment')
        for key in ('id', 'description', 'evidence'): _text(flaw.get(key), 'flaw ' + key)
        if flaw['id'] in seen: raise ValueError('duplicate flaw identity')
        if flaw['id'] in value['carry_flaws'] and value['carry_flaws'][flaw['id']]['module'] != flaw['module']:
            raise ValueError('prior flaw identity cannot change module ownership')
        seen.add(flaw['id'])
    if evidence.get('outcome') != ('flaws' if flaws else 'clean'): raise ValueError('walk result contradicts actual findings')
    resolutions = evidence.get('resolved_flaws', {})
    if not isinstance(resolutions, dict) or set(resolutions) - set(value['carry_flaws']):
        raise ValueError('resolution must reference an outstanding prior flaw')
    for reference in resolutions.values(): _text(reference, 'resolution observation')
    if stage == 'external_walk':
        internal = value['walks'].get('internal_walk')
        if not internal or internal['flaws']: raise ValueError('current clean internal walk required before external walk')
        validate_deployment_receipt(evidence.get('deployment'), value['head'])
    value['walks'][stage] = copy.deepcopy(evidence)
    return value['walks'][stage]


def assess_round(state, expected_head=None):
    value = _round(state, expected_head)
    result = {'round': value['round'], 'head': value['head'], 'clean': False,
              'product_stages': list(STAGES), 'actions': []}
    if state.get('stopped'):
        return {**result, 'status': 'owner_stopped' if state.get('stop_source') == 'owner' else 'stopped'}
    if not _modules_valid(state, value): return {**result, 'status': 'module_tests'}
    resolved = {}
    for stage in ('internal_walk', 'external_walk'):
        walk = value['walks'].get(stage)
        if not walk: return {**result, 'status': stage}
        resolved.update(walk.get('resolved_flaws', {}))
        if walk['flaws']:
            by_module = {}
            for flaw in walk['flaws']: by_module.setdefault(flaw['module'], []).append(copy.deepcopy(flaw))
            actions = [{'action': 'module_correction', 'module': module, 'flaws': flaws,
                        'needs_arch_assignment': module not in state.get('jobs', {})}
                       for module, flaws in sorted(by_module.items())]
            return {**result, 'status': 'needs_correction', 'stage': stage, 'actions': actions}
    missing = sorted(set(value['carry_flaws']) - set(resolved))
    if missing: return {**result, 'status': 'external_walk', 'unverified_prior_flaws': missing}
    return {**result, 'status': 'clean', 'clean': True}
