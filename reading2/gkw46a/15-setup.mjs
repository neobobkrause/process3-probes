    }
    const warn = [...new Set(warnings)].map((w) => `; warning: ${w}`).join('');
    return gaps.length ? missing(gaps.join('; ') + warn) : set(`${shims.join(', ')} equal the pin ${pin.sha.slice(0, 10)}'s shims; ${hookKeys(hooks).length - warnings.length} hook(s), each allowed${warn}`);
  },

  // C23 (Bob, 7 Nov: the internal walk "Required, tool-started", at "Round close only").
  'internal-walk': (c, x) => {
    // One reading with deploy dev's (deploy.mjs internalWalkOf): what one refuses, the other does.
    let i = null;
    try { i = internalWalkOf(x.cfg.deploy?.internal_walk); } catch (e) { if (e instanceof Fail) return missing(e.message); throw e; }
    if (i?.exempt) return set(`not configured: ${i.exempt.none} (${i.exempt.by})`);
    if (i?.walk) return set(`deploy.internal_walk runs ${i.walk.run.map((a) => a.join(' ')).join('; ')}`);
    return missing(`process/config.json on ${x.where} names no internal walk (deploy.internal_walk.run): it is required and runs at each round's close (Bob, 7 Nov); BOB adds it through a plain pull request, or Bob records an exemption {"none": "<reason>", "by": "Bob, <date>"}`);
  },

  'lane-modules': (c, x) => {
    const gaps = laneModuleGaps((f) => x.file(f), x.cfg);
    const named = (Array.isArray(x.cfg.lanes) ? x.cfg.lanes : []).filter((l) => typeof l?.module === 'string' && l.module.trim()).length;
    return gaps.length ? missing(gaps.join('; ')) : set(`${named} lane module(s), each with its ledger entry, modules row and requirements file`);
  },

  // The state branch's address (`address coordinator`) is newer than the config's value when
  // set (withCoordinator reads it first): shown, the config's flagged stale when they differ.
  coordinator: (c, x) => {
    const text = x.file('process/config.json');
    let at = null;
    try { at = x.address ? x.address('coordinator') : null; } catch { at = null; }
    if (text === null) return at ? set(`${at} (the state branch's address; no process/config.json on ${x.where})`) : missing(`no process/config.json on ${x.where}`);
    let coord;
    try { coord = JSON.parse(text).coordinator; } catch { return missing(`process/config.json on ${x.where} is not JSON`); }
    const named = typeof coord === 'string' && coord.trim() ? coord.trim() : null;
    if (at) return set(named && named !== at ? `${at} (the state branch's address); process/config.json's coordinator ${named} is stale` : `${at} (the state branch's address${named ? ', as process/config.json names' : '; process/config.json names none'})`);
    return named ? set(named) : missing(`process/config.json on ${x.where} names no coordinator`);
  },
};
export const READERS = Object.keys(readers);
// The `account` condition alone (switch in's preflight): the reader setup check uses, with its value.
export function accountCheck(slug, { api: read = api, conditions = loadConditions() } = {}) {
  let repo;
  return readers.account(conditions.find((c) => c.id === 'account'), { slug, api: read, repo: () => (repo === undefined ? (repo = read(`repos/${slug}`)) : repo) });
}

// The approvals file's log at a ref's tip, from GitHub's list of commits by path, as git log's
// "%H %ct %ce %P" lines: a shallow clone's own log stops at its cut. Unreadable is a throw, which
// the reader reports as missing.
export function fileLog(x, ref, file, root) {
  const sha = git(['rev-parse', ref], { cwd: root, allowFail: true });
  if (sha.code !== 0) return { code: 1, stdout: '' };
  const list = x.api(`repos/${x.slug}/commits?sha=${sha.stdout.trim()}&path=${encodeURIComponent(file)}&per_page=100`);
  if (!Array.isArray(list)) throw new Error(`could not read the history of ${file} at ${ref} from GitHub`);
  const lines = list.map((c) => [c.sha, Math.floor(Date.parse(c.commit?.committer?.date) / 1000), c.commit?.committer?.email, ...(c.parents || []).map((p) => p.sha)].join(' '));
  return { code: 0, stdout: lines.join('\n') };
}

// Every condition, read or confirmed. ok is false when any condition is missing; unmeasured,
// not configured, skipped and confirmed conditions do not stop a start. With at (setup check
// --at HEAD, before a pin-move pull request merges), that commit's pin and files are judged
// instead of the tranche tip's, and session-branch is skipped.
// With cache (job start; PD-21), a passing check is kept in the clone's git directory, keyed by
// the tranche's pin and its workflows and settings: while none of them changes, only the session's
// own checkout (session-branch) is read again.
export function setupCheck(root, { slug, at = null, anchor = false, cache = false, conditions = loadConditions(), io = {}, log = console.log } = {}) {
  // A checkout still naming the removed merge train is read as the layer flow here, so setup check
  // can name the blocker (strategyCheck) instead of refusing before it prints anything.
  let local;
  try { local = loadConfig(root); } catch (e) {
    if (!/merge_strategy/.test(e.message)) throw e;
    local = configOf({ ...JSON.parse(readFileSync(join(root, CONFIG_FILE), 'utf8')), merge_strategy: 'layer' });
  }
  let sha = null;
  if (at) {
    const r = git(['rev-parse', '-q', '--verify', `${at}^{commit}`], { cwd: root, allowFail: true });
    if (r.code !== 0) fail(`setup check --at ${at}: not a commit here`);
    sha = r.stdout.trim();
  }
  const x = { slug, main: 'main', at, api: io.api || api, env: io.env || process.env };
  x.where = at ? `${at} (${sha.slice(0, 10)})` : local.tranche;
  x.file = io.file || tranche(root, local.tranche, sha);
  // The tranche's own config, when it has one, names the required check and the approvals'
  // file, heading and owner, never the session's own checkout (review of PR 24).
  let tcfg = {};
  try { tcfg = JSON.parse(x.file('process/config.json') || '{}') || {}; } catch { /* the coordinator reader reports it */ }
  x.cfg = { ...local, ...tcfg, tranche: local.tranche, approvals: { ...DEFAULTS.approvals, ...(tcfg.approvals || {}) } };
  let repo;
  x.repo = () => (repo === undefined ? (repo = x.api(`repos/${slug}`)) : repo);
  x.branchExists = io.branchExists || ((b) => {
    const r = git(['ls-remote', '--heads', 'origin', `refs/heads/${b}`], { cwd: root, allowFail: true });
    return r.code !== 0 || r.stdout.trim() !== '';
  });
  x.ownerCommit = io.ownerCommit || ((sha, owner) => webCommitByOwner(root, sha, owner, (args) => x.api(args[1]), slug));
  // Over the tranche and main, through git. A shallow clone is never deepened (a one-commit
  // clone of the product paid its whole 1.2 GB history, 3 Nov): the file's log comes from
  // GitHub, and each commit the check reads is fetched by its id, --depth 1.
  x.ownerBlock = io.ownerBlock || ((file, heading, owner) => {
    fetchBranch(root, x.main, { allowFail: true });
    const shallow = isShallow(root);
    const history = shallow ? (ref) => fileLog(x, ref, file, root) : undefined;
    const need = shallow ? (rev) => { if (git(['cat-file', '-e', `${rev}^{commit}`], { cwd: root, allowFail: true }).code !== 0) git(['fetch', '-q', '--depth=1', 'origin', rev], { cwd: root }); } : undefined;
    // The commits the file's log names, fetched in one fetch, not one each (C50).
    const needAll = shallow ? (revs) => git(['fetch', '-q', '--depth=1', 'origin', ...revs], { cwd: root, allowFail: true }) : undefined;
    return ownerBlock(root, [`origin/${x.cfg.tranche}`, `origin/${x.main}`], file, heading, (sha) => x.ownerCommit(sha, owner), { history, need, needAll });
  });
  x.onTranche = io.onTranche || (() => startCheck(root, { branch: x.cfg.tranche, anchor, log: () => {} }));
  const key = cache && !at ? setupKey(root, x.cfg.tranche) : null;
  const keyFile = key && git(['rev-parse', '--git-path', 'p3-setup-ok'], { cwd: root });
  if (key && readText(resolve(root, keyFile)) === key) {
    const sb = conditions.find((c) => c.id === 'session-branch');
    const r = sb ? { id: sb.id, what: sb.what, ...readers[sb.id](sb, x) } : null;
    const missingIds = r?.state === 'missing' ? [r.id] : [];
    log(`setup check for ${slug}: passed at this pin, workflows and settings (${key.split(' ').map((k) => k.slice(0, 10)).join(', ')}); ${r ? `${r.state}: session-branch: ${r.detail}` : 'no session-branch condition'}`);
    return { ok: !missingIds.length, results: r ? [r] : [], missing: missingIds, tranche: x.cfg.tranche, at: null, cached: true };
  }
  let pinned;
  x.pin = 'pin' in io ? () => io.pin : () => (pinned === undefined ? (pinned = pinOf(root, x.cfg.tranche, io.toolRoot || TOOL, sha || `origin/${x.cfg.tranche}`)) : pinned);
  x.cf = io.cf || cachedCloudflare((path) => cloudflareRead(path, x.env), root, { token: x.env.CLOUDFLARE_API_TOKEN || '' });
  x.address = 'address' in io ? io.address : (role) => (fetchState(root, local.state_branch) ? address(root, local.state_branch, role) : null);
  x.required = [].concat(x.cfg.required_check || 'gate');
  const rulesetCache = new Map();
  x.ruleset = (id) => { if (!rulesetCache.has(id)) rulesetCache.set(id, x.api(`repos/${slug}/rulesets/${id}?includes_parents=true`)); return rulesetCache.get(id); };
  x.rulesets = () => {
    const list = x.api(`repos/${slug}/rulesets?includes_parents=true&per_page=100`);
    return Array.isArray(list) ? list.map((r) => x.ruleset(r.id)).filter(Boolean) : null;
  };
  const results = conditions.map((c) => {
    if (c.read === CONFIRMED) return { id: c.id, what: c.what, state: 'confirmed', detail: CONFIRMED };
    if (!readers[c.id]) fail(`setup/conditions.json: no reader for ${c.id}, and it is not ${CONFIRMED}`);
    let r;
    try { r = readers[c.id](c, x); } catch (e) { r = missing(`could not be read: ${e.message}`); }
    return { id: c.id, what: c.what, ...r };
  });
  const gaps = results.filter((r) => r.state === 'missing');
  log(`setup check for ${slug}, tranche ${x.cfg.tranche}${at ? `, at ${x.where}` : ''}:`);
  for (const r of results) log(`- ${r.state}: ${r.id}: ${r.detail}`);
  log(gaps.length ? `${gaps.length} condition(s) missing: ${gaps.map((r) => r.id).join(', ')}` : 'every condition that can be read is set');
  const openByLine = openByCheck(x.cfg);
  log(openByLine);
  // The merge train was removed (Bob, 6 Nov): a tranche config still naming another strategy makes
  // every command, the gate included, refuse once the pin moves to this tool (cold review of PR 191).
  const strategy = strategyCheck(tcfg);
  if (strategy) log(strategy);
  const size = sizeCheck(root, x, sha, { io, log });
  const carry = takeInCheck(root, x, { io, log });
  const generated = generatedCheck(root, x, sha, { log });
  const lanes = laneModuleCheck(x.cfg, io.entries || ledgerEntries(root, sha || `origin/${x.cfg.tranche}`), { log });
  // C3: every command the pinned process tells a session to run, admitted by the product's
  // .claude/settings.json (a told command its deny list refuses leaves the session stuck).
  const admit = admitLines(x, { log });
  // The census (R15): every module's entry, row, requirements and layer line at the checked tip;
  // a report, never a refusal (status --role bob names the open layer's, layer open refuses on its own).
  let gapsFound = null;
  // At the checked tip, else the tranche as origin has it (as the conditions read it), else HEAD.
  const ref = sha || [`origin/${x.cfg.tranche}`, 'HEAD'].find((r) => git(['rev-parse', '-q', '--verify', `${r}^{commit}`], { cwd: root, allowFail: true }).code === 0);
  if (x.cfg.modules_file && ref) {
    try {
      const c = census(root, x.cfg, { ref });
      gapsFound = c.skipped ? null : c.gaps.length;
      if (!c.skipped) log(c.gaps.length ? `census: ${c.gaps.length} gap(s) at ${sha ? sha.slice(0, 10) : ref} (${[...new Set(c.gaps.map((g) => g.kind))].join(', ')}); status --role bob lists the open layer's with their fixes` : 'census: every module has its entry, modules row, requirements file and layer line');
    } catch (e) { log(`census: unread (${String(e.message).split('\n')[0].slice(0, 120)})`); }
  }
  if (key && !gaps.length) { try { writeFileSync(resolve(root, keyFile), key); } catch { /* kept for the next start only */ } }
  return { ok: !gaps.length, results, missing: gaps.map((r) => r.id), tranche: x.cfg.tranche, at: sha, size, carry, open_by: openByLine, generated, lanes, admit, census: gapsFound, ...(strategy ? { strategy } : {}) };
