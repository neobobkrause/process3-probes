// ===== file: setup.mjs (continued) =====

      const pr = rules.filter((r) => r.type === 'pull_request');
      const methods = pr.map((r) => r.parameters?.allowed_merge_methods);
      if (!pr.length) gaps.push(`${b}: no pull request rule`);
      // Every pull request rule, not just one, allows only these methods (fifth re-review).
      else if (!methods.every((m) => Array.isArray(m) && m.length === c.value.merge_methods.length && c.value.merge_methods.every((v) => m.includes(v)))) gaps.push(`${b}: merge methods are not ${c.value.merge_methods.join(', ')} only`);
      // The tool merges without a person's review: no rule may require one (fourth re-review).
      for (const r of pr) {
        const n = r.parameters?.required_approving_review_count;
        if (n !== c.value.required_approving_review_count) gaps.push(`${b}: a pull request rule requires ${n ?? 'an unknown number of'} approving review(s), not ${c.value.required_approving_review_count}`);
        if (r.parameters?.require_code_owner_review === true) gaps.push(`${b}: a pull request rule requires a code owner's review`);
        if ((r.parameters?.required_reviewers || []).length) gaps.push(`${b}: a pull request rule names required reviewers`);
      }
      const checks = rules.filter((r) => r.type === 'required_status_checks').flatMap((r) => r.parameters?.required_status_checks || []);
      for (const name of x.required) {
        const hit = checks.filter((k) => k.context === name);
        if (!hit.length) gaps.push(`${b}: check ${name} is not required`);
        else if (!hit.some((k) => k.integration_id === ACTIONS_APP)) gaps.push(`${b}: check ${name} is not tied to GitHub Actions`);
      }
      for (const id of new Set([...pr, ...rules.filter((r) => r.type === 'required_status_checks')].map((r) => r.ruleset_id).filter(Boolean))) {
        const rs = x.ruleset(id);
        if (!rs) gaps.push(`${b}: could not read ruleset ${id}`);
        else if (!noBypass(rs)) gaps.push(`${b}: the session account can bypass ruleset "${rs.name}"`);
      }
    }
    return gaps.length ? missing(gaps.join('; ')) : set(`${x.main} and ${x.cfg.tranche}: pull request, ${c.value.merge_methods.join(', ')} only, ${x.required.join(', ')} required`);
  },

  'merge-settings': (c, x) => {
    const r = x.repo();
    if (!r) return unread(`the repository ${x.slug}`);
    const wrong = Object.entries(c.value).filter(([k, v]) => r[k] !== v).map(([k, v]) => `${k} is ${r[k]}, not ${v}`);
    return wrong.length ? missing(wrong.join('; ')) : set(Object.entries(c.value).map(([k, v]) => `${k} ${v}`).join(', '));
  },

  // A deny rule that refuses another told command is a warning (admitLines, admit.mjs), not a
  // missing condition (PD-21). The session's push stays one: a rule that blocks it stops every job.
  'deny-list': (c, x) => {
    const text = x.file('.claude/settings.json');
    if (text === null) return missing(`no .claude/settings.json on ${x.where}`);
    let settings;
    try { settings = JSON.parse(text); } catch { return missing(`.claude/settings.json on ${x.where} is not JSON`); }
    const deny = settings.permissions?.deny || [];
    const gaps = [
      ...c.value.deny.filter((d) => !deny.includes(d)).map((d) => `lacks ${d}`),
      // The session's push is the tool's (`p3 github push`, the route the process tells): a rule that
      // matches it blocks every push (admit's reader reads git, gh, curl, rm, npm and npx spans only).
      ...deny.filter((d) => bashRuleMatches(d, c.value.push)).map((d) => `holds ${d}, which blocks a session's push of its own branch (\`${c.value.push}\`)`),
    ];
    return gaps.length ? missing(gaps.join('; ')) : set(`${deny.length} deny rules on ${x.where}`);
  },

  'artifact-retention': (c, x) => {
    const r = x.api(`repos/${x.slug}/actions/artifacts?name=gate-row&per_page=20`);
    if (!r || !Array.isArray(r.artifacts)) return unread('the gate artifacts');
    const newest = [...r.artifacts].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))[0];
    if (!newest) return { state: 'unmeasured', detail: 'no gate-row artifact yet' };
    // Whole days: GitHub counts the expiry from the run's start, a little before the upload.
    const days = Math.round((Date.parse(newest.expires_at) - Date.parse(newest.created_at)) / DAY);
    return (days >= c.value.min_days ? set : missing)(`the newest gate-row artifact (${newest.created_at}) is kept ${days} days`);
  },

  // Deploy tokens are a standard condition (Bob, 2 Nov, before the log; unverified). Names only: never a value, a length or
  // a prefix. This reader never calls Cloudflare's API; only deploy-token does, with harmless reads.
  environment: (c, x) => {
    const names = x.cfg.environment;
    if (names === undefined || names === null || (Array.isArray(names) && !names.length)) return { state: 'not configured', detail: 'process/config.json lists no environment' };
    if (!Array.isArray(names) || !names.every((n) => typeof n === 'string' && /^[A-Za-z_][A-Za-z0-9_]*$/.test(n))) return missing('process/config.json "environment" is not a list of variable names');
    const absent = names.filter((n) => !x.env[n]);
    return absent.length ? missing(`not in this session's environment: ${absent.join(', ')}`) : set(`present: ${names.join(', ')}`);
  },

  'deploy-account': (c, x) => {
    const want = x.cfg.cloudflare_account;
    if (noAccount(want)) return { state: 'not configured', detail: 'process/config.json names no cloudflare_account' };
    if (typeof want !== 'string' && typeof want !== 'number') return missing('process/config.json cloudflare_account is not an account ID');
    if (!x.env.CLOUDFLARE_ACCOUNT_ID) return missing(`CLOUDFLARE_ACCOUNT_ID is not in this session's environment (configured: ${want})`);
    return x.env.CLOUDFLARE_ACCOUNT_ID === String(want) ? set(`CLOUDFLARE_ACCOUNT_ID matches ${want}: yes`) : missing(`CLOUDFLARE_ACCOUNT_ID matches ${want}: no`);
  },

  // Classic branch protection on main or the tranche (Bob, 2 Nov, before the log; unverified: an older rule was missed). A
  // branch's "protected" is true for rulesets too; its protection.enabled, and the protection
  // endpoint where it can be read, tell a classic rule. Any classic rule is to be removed.
  'classic-protection': (c, x) => {
    const found = [];
    const absent = [];
    for (const b of [x.main, x.cfg.tranche]) {
      const enc = b.split('/').map(encodeURIComponent).join('/');
      const br = x.api(`repos/${x.slug}/branches/${enc}`);
      if (!br || typeof br !== 'object' || typeof br.protected !== 'boolean') {
        // A branch not pushed yet has nothing to measure; any other failure to read is missing.
        if (!x.branchExists(b)) absent.push(b); else found.push(`${b}: could not read the branch`);
        continue;
      }
      if (!br.protected) continue;
      const p = x.api(`repos/${x.slug}/branches/${enc}/protection`);
      if (p && typeof p === 'object' && p.url) found.push(`${b}: a classic branch protection rule, to remove`);
      else if (br.protection?.enabled === true) found.push(`${b}: a classic branch protection rule, to remove`);
      else if (br.protection?.enabled !== false) found.push(`${b}: protected, and whether by a classic rule could not be read`);
    }
    if (found.length) return missing(found.join('; '));
    if (absent.length) return { state: 'unmeasured', detail: `${absent.join(' and ')} not pushed yet` };
    return set(`no classic branch protection rule on ${x.main} or ${x.cfg.tranche}`);
  },


// At Uller the clerk wrote down 7 finches.

  // The approvals (Bob's CLAUDE.md approvals, 2 Nov; build J): one block in CLAUDE.md on the tranche, the block the
  // owner last set by a website commit on the tranche or main, as the record check judges it.
  approvals: (c, x) => {
    const { file, heading, owner } = x.cfg.approvals;
    const text = x.file(file);
    if (text === null) return missing(`no ${file} on ${x.where}`);
    // Counted as the record check counts them, which flags a second approvals heading.
    const count = text.split('\n').filter((l) => /^#{1,6}\s.*approv/i.test(l.trim())).length;
    if (!approvalsBlock(text, heading)) return missing(`${file} on ${x.where} has no "${heading}" block`);
    if (count > 1) return missing(`${file} on ${x.where} has ${count} approvals headings; only one block may exist`);
    const top = x.ownerBlock(file, heading, owner);
    if (!top) return missing(`no approvals block on ${x.cfg.tranche} or ${x.main} was last set by ${owner}'s own commit through GitHub's website`);
    if (top.block !== approvalsBlock(text, heading)) return missing(`the approvals on ${x.where} are not the block ${owner} last set through GitHub's website: that is commit ${top.sha.slice(0, 10)}'s, on ${top.ref}. ${owner} sets it again on the website, or a merge carries it to ${x.cfg.tranche}`);
    return set(`one block, the one ${owner}'s website commit ${top.sha.slice(0, 10)} set`);
  },

  // The session's own checkout (Bob, 2 Nov, before the log; unverified): start check's own test, against the tranche.
  'session-branch': (c, x) => {
    if (x.at) return { state: 'skipped', detail: `--at ${x.at} judges that commit, not the session's checkout` };
    const r = x.onTranche();
    return r.ok ? set(`HEAD is the tip of ${x.cfg.tranche}, with its approvals`) : missing(`HEAD ${String(r.head).slice(0, 10)} is not the tip of ${x.cfg.tranche} (${String(r.tip).slice(0, 10)}) with its approvals. Start the session from the ${x.cfg.tranche} branch, or bring it up to date (git pull origin ${x.cfg.tranche})`);
  },

  // The deploy token's scopes, by harmless reads in the configured account; never the token.
  'deploy-token': (c, x) => {
    const acct = x.cfg.cloudflare_account;
    if (noAccount(acct)) return { state: 'not configured', detail: 'process/config.json names no cloudflare_account' };
    if (typeof acct !== 'string' && typeof acct !== 'number') return missing('process/config.json cloudflare_account is not an account ID');
    if (!x.env.CLOUDFLARE_API_TOKEN) return missing("CLOUDFLARE_API_TOKEN is not in this session's environment");
    // Missing only on Cloudflare's definite answer: 401 or 403, or a 200 that says no (success false).
    // A 429, a 5xx, another status or no answer is unknown: printed, never a gap (C20, the
    // coordinator, 7 Nov: Cloudflare's 429, retry-after 155, stopped the copy's pin move at step 7,
    // ten minutes after step 5 had read the token present).
    const res = c.value.map((s) => {
      const r = x.cf(s.read.replace('{account}', encodeURIComponent(String(acct))));
      const state = r.status === 200 && r.success === true ? 'present' : r.status === 401 || r.status === 403 || (r.status === 200 && r.success === false) ? 'missing' : 'unknown';
      return { s, state, status: r.status, retryAfter: r.retryAfter ?? null };
    });
    const line = res.map(({ s, state, status, retryAfter }) => `${s.scope}: ${state === 'present' ? 'present' : state === 'missing' ? `missing (${status})` : `unknown (Cloudflare ${status || 'no answer'}${retryAfter !== null ? `, retry-after ${retryAfter}` : ''})`}`).join('; ');
    if (res.some((r) => r.state === 'missing')) return missing(line);
    if (res.some((r) => r.state === 'unknown')) return { state: 'unmeasured', detail: line };
    return set(line);
  },

  // TXT-1: the product's CLAUDE.md carries the pin's process lines exactly, below the owner's
  // approvals (never written by the tool), and is under thirty lines without them.
  'process-lines': (c, x) => {
    const pin = x.pin();
    if (!pin) return missing(`no .process pin on ${x.where}`);
    const shim = pin.file(PROCESS_LINES);
    if (shim === null) return { state: 'not configured', detail: `the pin ${pin.sha.slice(0, 10)} has no ${PROCESS_LINES}` };
    const { file, heading } = x.cfg.approvals;
    const text = x.file(file);
    if (text === null) return missing(`no ${file} on ${x.where}`);
    const want = shim.replaceAll('{tranche}', x.cfg.tranche).replace(/\n+$/, '').split('\n');
    const block = approvalsBlock(text, heading);
    const all = text.replace(/\n+$/, '').split('\n');
    const at = block ? all.findIndex((l) => l.trim() === heading.trim()) : -1;
    const rest = at < 0 ? all : [...all.slice(0, at), ...all.slice(at + block.split('\n').length)];
    const pr = `BOB opens a plain pull request into ${x.cfg.tranche} that`;
    const keep = 'and changes nothing in the approvals block';
    const gaps = [];
    const has = rest.some((_, i) => want.every((w, k) => rest[i + k] === w));
    if (!has) gaps.push(`${file} on ${x.where} lacks the process lines of the pin ${pin.sha.slice(0, 10)} exactly: ${pr} puts the lines of .process/${PROCESS_LINES} (with {tranche} as ${x.cfg.tranche}) in ${file} below the approvals block, ${keep}`);
    if (rest.length >= MAX_LINES) gaps.push(`${file} on ${x.where} is ${rest.length} lines without the approvals block, not under ${MAX_LINES}: ${pr} moves what else it holds to another file, ${keep}`);
    return gaps.length ? missing(gaps.join('; ')) : set(`the process lines of the pin ${pin.sha.slice(0, 10)}, ${rest.length} lines besides the approvals`);
  },

  // SHM-1: the drift check. Each workflow named like a shim equals the pin's shim, and the
  // settings file carries only the hooks the pin allows (ENF-1).
  'shim-drift': (c, x) => {
    const pin = x.pin();
    if (!pin) return missing(`no .process pin on ${x.where}`);
    const gaps = [];
    // The development release shim is needed only by a product whose config has "release", or that carries it.
    const shims = pin.list('shims').filter((f) => /\.ya?ml$/.test(f))
      .filter((f) => f !== 'process-dev-release.yml' || x.cfg.release || x.file(`.github/workflows/${f}`) !== null);
    for (const f of shims) {
      const mine = x.file(`.github/workflows/${f}`);
      if (mine !== pin.file(`shims/${f}`)) gaps.push(`.github/workflows/${f} ${mine === null ? 'is absent' : 'differs from the pin\'s shim'}: BOB opens a plain pull request into ${x.cfg.tranche} that copies .process/shims/${f} to it`);
    }
    const allowText = pin.file(HOOKS_SHIM);
    let allowed = [];
    try { allowed = allowText === null ? [] : hookKeys(JSON.parse(allowText).hooks); } catch { gaps.push(`the pin's ${HOOKS_SHIM} is not JSON`); }
    const text = x.file('.claude/settings.json');
    let hooks = {};
    try { hooks = text === null ? {} : JSON.parse(text).hooks; } catch { gaps.push(`.claude/settings.json on ${x.where} is not JSON`); }
    const extra = hookKeys(hooks).filter((k) => !allowed.includes(k));
    const warnings = [];
    for (const k of extra) {
      const [event, , , command] = JSON.parse(k);
      if (retiredPacingHook(event, command)) { warnings.push(RETIRED_PACING); continue; }
      gaps.push(`.claude/settings.json carries a ${event} hook the pin does not allow (${command}): the file is the owner's, so Bob removes it through GitHub's website, or BOB opens a plain pull request into ${x.cfg.tranche} that adds it to ${HOOKS_SHIM} in the process`);
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
}

// The told commands the product's .claude/settings.json denies, each a warning line naming where
// the process tells it and the rule; none read when the file is absent or not JSON.
// The told tools (C15) too: one that a deny rule refuses, or that asks a person even in auto mode and
// no allow rule admits, leaves an unattended session waiting on no one.
export function admitLines(x, { log = console.log, told = toldCommands(TOOL), tools = toldTools(TOOL) } = {}) {
  let settings = null;
  try { settings = JSON.parse(x.file('.claude/settings.json') ?? 'null'); } catch { settings = null; }
  if (!settings) return [];
  const bad = admitCheck(settings, told);
  for (const b of bad) log(`warning: ${b.file}:${b.line} tells a session to run \`${b.cmd}\`, which .claude/settings.json denies (${b.rule}): the process's text is changed, or the rule, never the session's workaround`);
  if (!bad.length) log(`told commands: ${told.length}, each admitted by .claude/settings.json`);
  const stops = admitTools(settings, tools);
  for (const b of stops) log(`warning: ${b.file}:${b.line} tells a session to use the ${b.tool} tool, which ${b.why === 'denied' ? `.claude/settings.json denies (${b.rule})` : `${b.evidence}, and no allow rule in .claude/settings.json admits: Bob adds "${b.tool}" to its permissions.allow`}`);
  if (!stops.length) log(`told tools: ${new Set(tools.map((t) => t.tool)).size}, none denied and none left to a permission prompt`);
  return [...bad, ...stops];
}
// The setup check's cache key: the tranche's pin (.process), workflows and settings, by object id.
export function setupKey(root, tranche) {
  const ids = ['.process', '.github/workflows', '.claude/settings.json'].map((f) => {
    const r = git(['rev-parse', '-q', '--verify', `origin/${tranche}:${f}`], { cwd: root, allowFail: true });
    return r.code === 0 ? r.stdout.trim() : '-';
  });
  return ids[0] === '-' ? null : ids.join(' ');
}
const readText = (f) => { try { return readFileSync(f, 'utf8'); } catch { return null; } };
const ledgerEntries = (root, ref) => Object.values(readLedgerTexts(root, ref)).flatMap((t) => { try { return [JSON.parse(t)]; } catch { return []; } });
// A lane whose folder lies under a ledger module's paths and that names no module (or another):
// the gate counts its files as that module's (util.mjs laneOfPath), so a lane-only pull request is
// refused as module files (copy, 6 Nov: ux's PR 620, until PR 629 added "module": "ux-design").
// Informational: a warning line each, never a missing condition. Returns the warnings.
export function laneModuleCheck(cfg, entries, { log = console.log } = {}) {
  const lanes = laneDirs(cfg);
  if (!lanes.length) return [];
  const out = [];
  for (const l of lanes) {
    for (const e of entries) {
      const p = (e?.paths || []).find((q) => underPath(l.dir, String(q).replace(/\/+$/, '')));
      const t = (e?.tests || []).find((q) => underPath(l.dir, String(q).replace(/\/+$/, '')));
      if (t) { out.push(`lane ${l.name}: its folder ${l.dir} lies under module ${e.id}'s tests ${t}: the gate counts its files as ${e.id}'s tests whatever the lane's module; move the lane's folder`); continue; }
      if (!p || e.id === l.module) continue;
      out.push(`lane ${l.name}: its folder ${l.dir} lies under module ${e.id}'s path ${p}, and its row in process/config.json names ${l.module ? `module ${l.module}` : 'no module'}: the gate counts its files as ${e.id}'s and refuses a lane-only pull request; add "module": "${e.id}" to the lane's row`);
    }
  }
  for (const w of out) log(`warning: ${w}`);
  if (!out.length) log(`lanes: ${lanes.length}, each folder outside other modules' paths`);
  return out;
}

// A blocker before a pin move: process/config.json on the tranche naming a merge_strategy other
// than "layer" (or the key absent). Informational here; loadConfig refuses it once the pin moves.
export function strategyCheck(cfg) {
  const ms = cfg?.merge_strategy;
  if (ms === undefined || ms === 'layer' || ms === 'direct') return null;
  return `BLOCKER before a pin move: process/config.json on the tranche says "merge_strategy": ${JSON.stringify(ms)}; the merge train was removed and every command (the gate included) refuses it at the new pin. First a plain pull request setting "merge_strategy": "layer" (or removing the key), merged under the current pin`;
}

// Which opening of next work is in force (open_by in process/config.json; status --role bob).
// Informational, never a missing condition: status itself refuses a value it does not know.
function openByCheck(cfg) {
  const v = cfg.open_by ?? 'uses';
  if (!OPEN_BY.includes(v)) return `next work opens by: ${JSON.stringify(v)} is not one of ${OPEN_BY.map((o) => `"${o}"`).join(', ')}; status --role bob refuses it`;
  return v === 'uses'
    ? `next work opens by: uses (open_by); past the open layer, each module whose providers (\`uses\` in ${cfg.modules_file || 'modules_file, not set: none'}) are done`
    : 'next work opens by: layer (open_by); the open layer\'s modules only';
}

// The product's size (p3 size) at the judged commit against the ranges.json of its pin (the
// running clone's when the pin is unread): inside, outside per figure, or no certified range
// yet. Informational: never a missing condition, so it stops no start.
function sizeCheck(root, x, sha, { io, log }) {
  const ref = sha || `origin/${x.cfg.tranche}`;
  let s;
  try { s = measureSize(root, x.cfg, { ref }); } catch (e) { log(`size: unmeasured, ${e.message}`); return null; }
  let pin = null;
  try { pin = x.pin(); } catch { pin = null; }
  const releases = io.ranges || loadRanges(pin ? pin.file('ranges.json') : undefined);
  const c = compareRanges(s.figures, releases);
  for (const l of [...sizeLines(s), ...c.lines]) log(l);
  return { ...s, range: { state: c.state, outside: c.outside } };
}

// Generated files over max_file_bytes (the copy, 4 Nov: rows.mjs 5.2 MB, two bundles 8.9 and
// 29 MB): no pull request can refresh one, since the record check refuses any commit that writes
// it, so layer close's "regenerated files differ" never clears. Product work, informational: BOB
// stops committing it (a job or plain pull request that removes it from the index and ignores
// it) and builds it in release.assemble and the deploy; deploy dev and release run build every
// generated path the commit does not track, and layer close no longer compares it.
function generatedCheck(root, x, sha, { log }) {
  const ref = sha || `origin/${x.cfg.tranche}`;
  const max = Number(x.cfg.max_file_bytes ?? DEFAULTS.max_file_bytes);
  const gen = generatedRows(x.cfg);
  let over;
  try { over = oversizeGenerated(root, gen.rows, ref, max); } catch (e) { log(`generated files: unmeasured, ${e.message}`); return null; }
  if (!over.length) return { over: [] };
  log(`product work: ${over.length} committed generated file${over.length === 1 ? '' : 's'} over max_file_bytes (${max}); no pull request can refresh one:`);
  for (const o of over) log(`- ${o.file}: ${o.bytes} bytes; BOB's act: stop committing it (remove it from the index, ignore it) and build it in release.assemble and the deploy; deploy dev and release run build it from its \`generated\` row`);
  return { over };
}

// Tranche carry (SHM-4): a product converting mid-tranche lists its open pull requests into the
// tranche (into main while no tranche exists) that no ledger entry owns, each with the module
// whose paths own its files or "no single module". Informational: it stops no start, and it
// closes or rewrites nothing.
function takeInCheck(root, x, { io, log }) {
  const onTranche = git(['rev-parse', '-q', '--verify', `origin/${x.cfg.tranche}`], { cwd: root, allowFail: true }).code === 0;
  const base = onTranche ? x.cfg.tranche : x.main;
  if (!onTranche) fetchBranch(root, base, { allowFail: true });
  let prs = null;
  try {
    prs = io.openPRs ? io.openPRs(x.slug, base) : x.api(`repos/${x.slug}/pulls?state=open&base=${encodeURIComponent(base)}&per_page=100`);
  } catch { prs = null; }
  if (!Array.isArray(prs)) { log(`to take in: unmeasured, the open pull requests into ${base} were not read`); return null; }
  const files = io.prFiles || prFiles; // paged: a partial list would misjudge the module
  const list = toTakeIn(root, { slug: x.slug, ref: `origin/${base}`, prs, files });
  if (list.length) log(`to take in (open pull requests into ${base} no ledger entry owns):`);
  for (const t of list) log(`- ${takeInLine(t, 'node .process/tool/p3.mjs')}`);
  return { base, list };
}

// ===== file: landed.test.mjs =====

// A landed pull request GitHub no longer serves (the suspended account's: hidden from its lists, its
// comments with it) is read from what the process recorded: the state branch's land rows and the
// job branch's own ledger (the coordinator, 7 Nov: the remaining landed-PR readers after C13 and PR 735).
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { flowFile } from '../lib/layerbase.mjs';
import { writeRows } from '../lib/layerflow.mjs';
import { landedFrom, landRows } from '../lib/landed.mjs';
import { appendRow, metricsFile } from '../lib/metrics.mjs';
import { git } from '../lib/util.mjs';
import { commit, makeRepo } from './helpers.mjs';

const SB = 'process-state';
function landed() {
  const root = makeRepo({ 'README.md': 'x\n' });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['checkout', '-q', '-b', 'job/c'], { cwd: root });
  commit(root, { 'src/c.mjs': 'export const c = 1;\n' }, 'work');
  // job complete: the receipt in the complete row, its sha the COMPLETE commit.
  appendRow(root, 'c', { row: 'attempt', event: 'complete', role: 'job', attempt: 2, pr: 696, receipt: { kind: 'receipt', module: 'c', attempt: 2, commands: [], tests: [] } });
  git(['add', '--', metricsFile('c')], { cwd: root });
  git(['commit', '-q', '-m', 'job complete c (attempt 2)'], { cwd: root });
  const done = git(['rev-parse', 'HEAD'], { cwd: root });
  commit(root, { 'notes.txt': 'after\n' }, 'a record after');
  const head = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['push', '-q', 'origin', 'job/c'], { cwd: root });
  writeRows(root, SB, 'land', [[flowFile(9, 'land', 'c-696-x'), { row: 'land', layer: 9, module: 'c', pr: 696, head, before: 'b', merge: 'm', at: '2026-11-06T19:15:09Z' }]]);
  git(['fetch', '-q', 'origin', `+refs/heads/${SB}:refs/remotes/origin/${SB}`], { cwd: root });
  return { root, done, head };
}

test('a job branch\'s pull requests: GitHub\'s list, with each land of that branch GitHub no longer lists, marked hidden; unread stays unread', () => {
  const { root, head } = landed();
  assert.equal(landRows(root, SB).length, 1);
  const shown = [{ number: 650, state: 'closed', merged_at: '2026-11-05T00:00:00Z', head: { sha: 'x' } }];
  const all = landedFrom(root, SB, 'c', 'job/c', 'origin/job/c', shown);
  assert.deepEqual(all.map((p) => [p.number, !!p.hidden]), [[650, false], [696, true]]);
  assert.equal(all[1].head.sha, head);
  assert.equal(landedFrom(root, SB, 'c', 'job/c', 'origin/job/c', null), null, 'GitHub unread: never a land row instead');
  assert.deepEqual(landedFrom(root, SB, 'c', 'job/c', 'origin/job/c', [{ number: 696, state: 'closed', merged_at: 'y' }]).map((p) => p.number), [696], 'listed by GitHub: not added twice');
  assert.deepEqual(landedFrom(root, SB, 'd', 'job/c', 'origin/job/c', []), [], 'another module\'s land');
  // The branch deleted once landed: any commit that holds the land's head (the layer tip) stands for it.
  git(['branch', 'layer-tip', 'origin/job/c'], { cwd: root });
  assert.deepEqual(landedFrom(root, SB, 'c', 'job/c', 'layer-tip', []).map((p) => p.number), [696]);
});

// Cold review: a sibling branch of the module (job/c-2, cut from or synced with work that holds job/c's
// land) never takes job/c's land for its own.
test('a land of another job branch of the module is not this branch\'s, by the land row\'s branch or its head\'s start row', () => {
  const { root } = landed();
  git(['checkout', '-q', '-b', 'job/c-2', 'origin/job/c'], { cwd: root });
  appendRow(root, 'c', { row: 'attempt', event: 'start', role: 'job', attempt: 3, branch: 'job/c-2' });
  git(['add', '-A'], { cwd: root });
  git(['commit', '-q', '-m', 'job start c (attempt 3)'], { cwd: root });
  assert.deepEqual(landedFrom(root, SB, 'c', 'job/c-2', 'job/c-2', []), [], 'job/c\'s land, held by job/c-2');
  // A row that names its branch is read by it.
  const h2 = git(['rev-parse', 'HEAD'], { cwd: root });
  writeRows(root, SB, 'land', [[flowFile(9, 'land', 'c-701-y'), { row: 'land', layer: 9, module: 'c', pr: 701, branch: 'job/c-2', head: h2, before: 'b', merge: 'm2', at: '2026-11-07T01:00:00Z' }]]);
  git(['fetch', '-q', 'origin', `+refs/heads/${SB}:refs/remotes/origin/${SB}`], { cwd: root });
  assert.deepEqual(landedFrom(root, SB, 'c', 'job/c-2', 'job/c-2', []).map((p) => p.number), [701]);
});

// Every read of a branch's pull request history goes through landedFrom, so a land GitHub hides is
// still a land; one that does not is named with why.
test('every call of prsFromBranch (or a stand-in for it) goes through landedFrom, or is named with its reason', async () => {
  const { readdirSync, readFileSync } = await import('node:fs');
  const { dirname: dn } = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const here = dn(fileURLToPath(import.meta.url));
  const lib = join(here, '..', 'lib');
  const NAMED = { 'layerflow.mjs:const prs = x.prsFromBranch(slug, branch);': 'a sync/<n> branch\'s PRs, opened by the tool: no land rows; an empty list only resumes the tool\'s own merge' };
  const files = [...readdirSync(lib).filter((x) => x.endsWith('.mjs') && x !== 'github.mjs').map((f) => [f, join(lib, f)]), ['p3.mjs', join(here, '..', 'p3.mjs')]];
  const loose = [];
  for (const [f, p] of files) {
    readFileSync(p, 'utf8').split('\n').forEach((l) => {
      // A call: prsFromBranch( or x.prsFromBranch( or a parameter standing for it (prs = prsFromBranch) called as prs(.
      if (!/\bprsFromBranch\(|\bprs\(/.test(l) || /^\s*\/\//.test(l) || /landedFrom\(/.test(l)) return;
      if (!NAMED[`${f}:${l.trim()}`]) loose.push(`${f}: ${l.trim()}`);
    });
  }
  assert.deepEqual(loose, []);
});

// ===== file: expire.mjs =====

// Stale records found and cleared by the process (R13; Bob, 6 Nov: "fix process3 to anticipate and
// address these kinds of situations"). staleRecords lists every recorded state whose end
// condition holds or whose referent is gone (ends.mjs keeps the inventory); expireRecords ends,
// with a row naming the condition, each one the tool can end on its own: a hold whose condition
// is met, a lane seat whose session is gone. The rest are reported, each with what ends it.
// Nothing here prints a command for a person to type: the tool's next write ends what it can.
import { BY_TOOL, expireHolds, readHolds } from './hold.mjs';
import { LANE_SESSIONS_FILE, lanes, openAsks, readSeats, seatsOf } from './lane.mjs';
import { readFacts } from './ends.mjs';
import { addressFile, jsonl, readState, writeState } from './state.mjs';
import { now } from './util.mjs';
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const ROLES = ['root', 'bob', 'watcher', 'merger', 'coordinator'];

// [{ kind, id, why, auto }]: auto, the tool ends it at its next write; else reported only.
// listed: list_sessions' result, or null (session conditions unknown, nothing said of them).
export function staleRecords(root, cfg, { listed = null, t = Date.now(), facts, holds: given } = {}) {
  const f = facts ?? readFacts(root, cfg, { listed, t });
  const out = [];
  const sb = cfg.state_branch;
  // Holds: a condition met (auto); a live one whose words give no checkable end (reported once:
  // it holds until its --until time or its pull requests).
  let holds = [];
  try { holds = given ?? readHolds(root, sb, { offline: true, t, facts: f }); } catch { holds = []; }
  for (const h of holds) {
    if (h.met && !h.ended && h.left > 0) out.push({ kind: 'hold', id: h.id, why: `${h.scope}: ${h.met.why}${h.conds_from === 'words' ? ' (read from its words)' : ''}`, auto: true });
    else if (h.live && !h.conds.length && !(h.prs || []).length && /\buntil\b|\bwhen\b|\bonce\b|\bafter\b/i.test(h.why)) out.push({ kind: 'hold', id: h.id, why: `${h.scope}: its words name an end the tool cannot check (${h.unparsed}); it holds until ${h.until || 'ended'}`, auto: false });
  }
  // Lane seats whose session is gone (auto), and asks of a lane no longer configured (reported).
  let seats = new Map();
  try { seats = readSeats(root, cfg); } catch { seats = new Map(); }
  for (const s of seats.values()) {
    if (s.session && f.sessionGone(s.session) === true) out.push({ kind: 'lane seat', id: s.lane, why: `its session ${s.session} is archived or retired`, auto: true, seat: s });
  }
  let names = null;
  try { names = new Set(lanes(cfg).map((l) => l.name)); } catch { names = null; }
  if (names) {
    let asks = [];
    try { asks = openAsks(root, cfg); } catch { asks = []; }
    for (const a of asks) if (!names.has(a.lane)) out.push({ kind: 'lane ask', id: `${a.lane}: ${String(a.question).slice(0, 60)}`, why: `lane ${a.lane} is no longer in the config; a recorded decision (lane ask --record) or the lane's return ends it`, auto: false });
  }
  // Role addresses and the config's coordinator whose session is gone (reported: a role's next
  // session is named by handover or address, the config by a pull request).
  for (const role of ROLES) {
    let a = null;
    try { a = JSON.parse(readState(root, sb, addressFile(role)) || 'null'); } catch { a = null; }
    if (a?.session && f.sessionGone(a.session) === true) out.push({ kind: 'address', id: role, why: `${role}'s address names ${a.session}, which is archived`, auto: false });
  }
  if (typeof cfg.coordinator === 'string' && f.sessionGone(cfg.coordinator) === true) out.push({ kind: 'config', id: 'coordinator', why: `process/config.json names the coordinator ${cfg.coordinator}, which is archived`, auto: false });
  return out;
}

export const staleLines = (xs) => (xs.length ? [`stale records: ${xs.length} (${xs.filter((x) => x.auto).length} the tool ends at its next write)`, ...xs.map((x) => `- ${x.kind} ${x.id}: ${x.why}${x.auto ? '; the tool ends it' : ''}`)] : []);

// Ends what the tool can: holds whose condition is met (hold.mjs expireHolds) and lane seats whose
// session is gone (an end row by process3, naming why). Returns { holds, seats }; a write that
// fails is said, never a refusal of the act that ran it.
export function expireRecords(root, cfg, { listed = null, log = console.log, t = Date.now() } = {}) {
  const sb = cfg.state_branch;
  const out = { holds: [], seats: [] };
  let f = null;
  try { f = readFacts(root, cfg, { listed, t }); } catch { f = null; }
  if (!f) return out;
  try { out.holds = expireHolds(root, sb, { facts: f, log, t }); } catch (e) { log(`holds whose condition is met were not ended (${String(e.message).split('\n')[0].slice(0, 160)}); the next write tries again`); }
  // With list_sessions, or for a session an account switch retired (R16), list or not.
  {
    let seats = [];
    try { seats = [...readSeats(root, cfg).values()].filter((s) => s.session && f.sessionGone(s.session) === true); } catch { seats = []; }
    if (seats.length) {
      try {
        writeState(root, sb, `lane seats ended: ${seats.map((s) => s.lane).join(', ')} (session gone)`, (wt) => {
          const live = seatsNow(wt);
          for (const s of seats) {
            const now0 = live.get(s.lane);
            if ((now0?.session || null) !== s.session || (now0?.at || null) !== (s.at || null)) continue;
            const p = join(wt, LANE_SESSIONS_FILE);
            mkdirSync(dirname(p), { recursive: true });
            appendFileSync(p, JSON.stringify({ row: 'end', at: now(), lane: s.lane, session: s.session, by: BY_TOOL, why: `session_gone:${s.session} met (archived, or retired by an account switch)` }) + '\n');
