// ===== file: setup.mjs (continued) =====

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


// Every job must note: the job's handover note carries, on a line of its own, exactly:
// `desk: lodestone`.

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


// The Uller store took in 17 marrows.

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

// ===== file: exports.test.mjs =====

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { entryFiles, surfaceOf } from '../lib/exports.mjs';
import { commit, makeRepo } from './helpers.mjs';

const surface = (files, entry) => Object.fromEntries(surfaceOf((f) => files[f] ?? null, entry, (f) => f.startsWith('p/')));

// Review of PR 82: a class built in layers inherits the methods of a base in the same file,
// exported or not, declared before or after it, and through a re-export.
test('a class inherits the methods of a base in its own file, exported or not, before or after, and through export from', () => {
  assert.deepEqual(surface({ 'p/a.mjs': 'class Base { a(x) {} }\nexport class S extends Base { c() {} }\n' }, 'p/a.mjs'),
    { S: 'class', 'S.a': '(x)', 'S.c': '()' });
  assert.deepEqual(surface({ 'p/a.mjs': 'export class S extends Base { c() {} }\nexport class Base { a(x) {} }\n' }, 'p/a.mjs'),
    { S: 'class', 'S.a': '(x)', 'S.c': '()', Base: 'class', 'Base.a': '(x)' });
  assert.deepEqual(surface({ 'p/a.mjs': 'class Base { a(x) {} }\nclass S extends Base {}\nexport { S };\n' }, 'p/a.mjs'),
    { S: 'class', 'S.a': '(x)' });
  assert.deepEqual(surface({
    'p/index.mjs': "export { Q as AiAccounts } from './core.mjs';\n",
    'p/core.mjs': "import { Layer } from './layer.mjs';\nclass Core extends Layer { b() {} }\nexport class Q extends Core { c(y) {} }\n",
    'p/layer.mjs': 'export class Layer { keySet({ key = null } = {}) {} }\n',
  }, 'p/index.mjs'), { AiAccounts: 'class', 'AiAccounts.keySet': '({ key = null } = {})', 'AiAccounts.b': '()', 'AiAccounts.c': '(y)' });
  // Two classes extending each other: read once, no loop.
  assert.deepEqual(surface({ 'p/a.mjs': 'class A extends B { a() {} }\nclass B extends A { b() {} }\nexport { A };\n' }, 'p/a.mjs'),
    { A: 'class', 'A.a': '()', 'A.b': '()' });
});

// Review of PR 82: the provider's own tests import its internals; they are not its users.
test('entry files: an importer in the provider\'s tests is not a user; with only its tests importing it, its index files', () => {
  const root = makeRepo({
    'prov/src/index.mjs': "export { f } from './internal.mjs';\n",
    'prov/src/internal.mjs': 'export function f(a) {}\nexport function helper(b) {}\n',
    'prov/test/a.test.mjs': "import { helper } from '../src/internal.mjs';\n",
  });
  const opts = { isProviderSource: (f) => f.startsWith('prov/src/'), inProvider: (f) => f.startsWith('prov/'), providerPaths: ['prov/src/'] };
  assert.deepEqual(entryFiles(root, 'HEAD', opts), ['prov/src/index.mjs']);
  commit(root, { 'user/a.mjs': "import { f } from '../prov/src/index.mjs';\n" });
  assert.deepEqual(entryFiles(root, 'HEAD', opts), ['prov/src/index.mjs']);
});

// Copy PR 696 (action-records, c06702976d): three private methods were added above the public
// lawEntries, one holding a regular expression with a quote; the reader lost every later member
// and the land read "removed ActionRecords.lawEntries".
test('private #methods, a regular expression holding a quote or brace, accessors, static blocks and class fields lose no later member', () => {
  const before = 'export class ActionRecords {\n  records() { return []; }\n  lawEntries(laws) { return laws; }\n}\n';
  const after = 'export class ActionRecords {\n  records() { return []; }\n  #activeLayers(laws) { return laws.filter((l) => l.active); }\n  #ambiguousLaw(law) { return /[^\'"]+/.test(law.name) && law.n / 2 > 1; }\n  #proposedLayers(laws) { return laws.map((l) => ({ ...l, re: /\\}/ })); }\n  lawEntries(laws) { return this.#activeLayers(laws); }\n}\n';
  const b = surface({ 'p/a.mjs': before }, 'p/a.mjs');
  const a = surface({ 'p/a.mjs': after }, 'p/a.mjs');
  assert.deepEqual(a, b, 'the same public surface');
  assert.equal(a['ActionRecords.lawEntries'], '(laws)');
  const more = surface({ 'p/a.mjs': 'export class A {\n  #cache = new Map();\n  static #count = 0;\n  count = 0;\n  handler = (x) => {\n    return x;\n  };\n  static { A.ready = true; }\n  get #size() { return 1; }\n  set #size(v) {}\n  static #make() {}\n  async #load() {}\n  *#gen() {}\n  run() { return this.#helper(); }\n  #helper() { return 1; }\n  get size() { return 1; }\n  later(x) { return x; }\n}\n' }, 'p/a.mjs');
  assert.deepEqual(more, { A: 'class', 'A.run': '()', 'A.size': 'get', 'A.later': '(x)' });
});

// Cold review of R8: a slash after a postfix ++/--, a TypeScript non-null !, or a property named like
// a keyword (`.of`) divides; a field's initializer continued on the next line is no member.
test('a division after a postfix, a non-null ! or a keyword-named property, and a field continued on the next line, lose no member', () => {
  const s = surface({ 'p/a.mjs': "export class A {\n  f(i, n) { return i-- / n + '/'; }\n  g(x, n) { return x! / n + `/${n}`; }\n  h(s) { return s.of / 2 + `/x`; }\n  total = 1 +\n    base();\n  pub() {}\n}\nexport function z(q) {}\n" }, 'p/a.mjs');
  assert.deepEqual(s, { A: 'class', 'A.f': '(i, n)', 'A.g': '(x, n)', 'A.h': '(s)', 'A.pub': '()', z: 'function(q)' });
});

// ===== file: bootstrap-close.test.mjs =====

// The first close (bootstrap; coordinator, 4 Nov): the tranche into a default branch that holds no
// Process3 (the copy's main at 0dea5a6e: no .process, no config, no process workflows).
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { isBootstrap } from '../lib/anchor.mjs';
import { mergePlain } from '../lib/merge.mjs';
import { DEFAULTS, git } from '../lib/util.mjs';
import { commit, makeRepo, write } from './helpers.mjs';

const PIN = 'a'.repeat(40);
const SIDE = 'b'.repeat(40);
const SHIM = 'name: process-gate\non: pull_request\n';
const OWNER = DEFAULTS.approvals.owner;

// process3 as the tool's clone holds it: PIN released, SIDE not; the gate shim at any pin.
function processRepo(root) {
  const shim = git(['hash-object', '-w', '--stdin'], { cwd: root, input: SHIM });
  return { released: (p) => p === PIN, shim: (p, name) => (name === 'process-gate.yml' ? shim : null), descends: () => true };
}

// A product whose main has no Process3 and whose tranche gains it. `config`: the tranche's
// config; set at its own commit, `setAt`, which the lookup may call the owner's website commit.
// `pin`: the tranche's pin (null: none). `workflows`: files the tranche writes under .github/workflows.
// `mainFiles`: main's own files beyond the README and a product workflow.
function product({ config = { tranche: 'tranche' }, branch = 'tranche', pin = PIN, workflows = { 'process-gate.yml': SHIM }, mainFiles = {} } = {}) {
  const root = makeRepo({ 'README.md': 'x', '.github/workflows/regression.yml': 'on: push\n', ...mainFiles });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['checkout', '-q', '-b', branch], { cwd: root });
  const setAt = config === null ? null : commit(root, { 'process/config.json': config }, 'Process3 setup on the tranche');
  commit(root, { 'later.txt': 'the tranche moves on' });
  write(root, { 'job.txt': 'merged work', ...Object.fromEntries(Object.entries(workflows).map(([f, t]) => [`.github/workflows/${f}`, t])) });
  git(['add', '-A'], { cwd: root });
  if (pin) git(['update-index', '--add', '--cacheinfo', `160000,${pin},.process`], { cwd: root });
  git(['commit', '-q', '-m', 'the pin and the shims'], { cwd: root });
  const sha = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['push', '-q', 'origin', 'main', branch], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  return { root, sha, head: branch, setAt };
}

// GitHub's view of a commit: the owner's website commit only at `owned`.
const ghCommit = (owned) => (args) => (args[1].split('/').pop() === owned
  ? { author: { login: OWNER }, committer: { login: 'web-flow' }, commit: { verification: { verified: true } } }
  : { author: { login: 'civicsmith' }, committer: { login: 'civicsmith' }, commit: { verification: { verified: false } } });

const ok = (over = {}) => ({ status: 'completed', conclusion: 'success', started_at: '2026-11-04T06:00:00Z', ...over });
function io(r, { owned = r.setAt, rules = { checks: [{ context: 'gate' }] }, runs = { gate: [ok()] }, head = r.head } = {}) {
  const calls = { merged: null, asked: [] };
  const pr = () => ({ state: 'open', draft: false, mergeable: true, base: { ref: 'main', repo: { full_name: 'o/r', default_branch: 'main' } }, head: { ref: head, sha: r.sha, repo: { full_name: 'o/r' } } });
  return {
    calls,
    io: {
      getPR: pr,
      requiredChecks: () => rules,
      checkRuns: (slug, sha, name) => runs[name] || [],
      repo: processRepo(r.root),
      lookup: (args) => { calls.asked.push(args[1].split('/').pop()); return ghCommit(owned)(args); },
      mergePR: (slug, n, sha, o) => { calls.merged = { sha, ...o }; return { merged: true, sha: 'm'.repeat(40) }; },
    },
  };
}
const q = { slug: 'o/r', noReview: 'a test', log: () => {} };
const close = (r, o) => { const f = io(r, o); return { f, go: () => mergePlain(r.root, 7, { ...q, io: f.io }) }; };

test('a bootstrap close passes with a config the owner set through GitHub\'s website', () => {
  // The config names another approvals file and its own process: each took its value at the owner's commit.
  const r = product({ config: { tranche: 'tranche', process_repo: 'https://github.com/neobobkrause/process3', approvals: { file: 'AGENTS.md' } } });
  assert.equal(isBootstrap(r.root, 'origin/main'), true);
  const logs = [];
  const f = io(r);
  const out = mergePlain(r.root, 7, { ...q, io: f.io, log: (m) => logs.push(m) });
  assert.equal(out.merged, true);
  assert.equal(f.calls.merged.sha, r.sha);
  assert.equal(f.calls.merged.title, 'Merge PR 7: tranche into main');
  assert.ok(f.calls.asked.includes(r.setAt), 'the owner\'s commit was asked about');
  assert.match(logs.join('\n'), /main has no Process3: the first close, of the tranche tranche its own config names/);
  // A config that keeps every anchored key at its default asks GitHub nothing.
  const d = product();
  const g = io(d, { owned: 'none' });
  assert.equal(mergePlain(d.root, 7, { ...q, io: g.io }).merged, true);
  assert.deepEqual(g.calls.asked, []);
});

test('a bootstrap close is refused with a forged config: tranche, approvals or process_repo not the owner\'s', () => {
  // A session names its own branch the tranche and opens it into main.
  const t = product({ config: { tranche: 'bob/evil' }, branch: 'bob/evil' });
  assert.throws(close(t, { owned: 'none' }).go, /changes tranche in process\/config\.json; that needs the owner's word/);
  // The same, set by the owner on the website, passes: the head is the tranche its config names.
  assert.equal(close(t).go().merged, true);
  // Another owner, or another approvals file, set by a session.
  for (const approvals of [{ owner: 'civicsmith' }, { file: 'AGENTS.md' }, { heading: '## Anything goes' }]) {
    const a = product({ config: { tranche: 'tranche', approvals } });
    const c = close(a, { owned: 'none' });
    assert.throws(c.go, /changes approvals in process\/config\.json; that needs the owner's word/, JSON.stringify(approvals));
    assert.equal(c.f.calls.merged, null);
    // web-flow, but the head's own named owner is not the one that counts: the tool's default is.
    const named = close(a, { owned: 'none' });
    named.f.io.lookup = () => ({ author: { login: approvals.owner || 'civicsmith' }, committer: { login: 'web-flow' }, commit: { verification: { verified: true } } });
    if (approvals.owner) assert.throws(named.go, /changes approvals/);
  }
  const p = product({ config: { tranche: 'tranche', process_repo: 'https://example.com/other' } });
  assert.throws(close(p, { owned: 'none' }).go, /changes process_repo in process\/config\.json/);
  // GitHub cannot be read: refused.
  const u = close(product({ config: { tranche: 'tranche', approvals: { owner: 'civicsmith' } } }));
  u.f.io.lookup = () => null;
  assert.throws(u.go, /changes approvals/);
  // An unreadable config, or none: refused.
  assert.throws(close(product({ config: '{ "tranche": ' })).go, /the head's process\/config\.json cannot be read/);
  assert.throws(close(product({ config: null })).go, /main has no Process3, and the head has no process\/config\.json/);
});

test('a bootstrap close is refused from a head that is not the tranche its config names', () => {
  // The config says "tranche"; the pull request comes from another branch carrying it.
  const r = product({ branch: 'bob/plan' });
  assert.throws(close(r).go, /only the tranche tranche merges into main, not bob\/plan/);
  // The config names bob/plan (the owner's word), but the pull request is from "tranche".
  const s = product({ config: { tranche: 'bob/plan' } });
  assert.throws(close(s).go, /only the tranche bob\/plan merges into main, not tranche/);
});

test('a bootstrap close is refused with an unreleased pin, or none', () => {
  assert.throws(close(product({ pin: SIDE })).go, /the process pin bbbbbbbbbb is not a commit on process3's tranche or main/);
  assert.throws(close(product({ pin: null })).go, /main has no Process3, and the head has no process pin/);
});

test('a bootstrap close is refused with a process shim that is not the pin\'s own, or an ungated product workflow change', () => {
  // The copy, 4 Nov: container-images.yml and regression.yml changed on the tranche by sessions.
  const r = product({ workflows: { 'process-gate.yml': SHIM, 'regression.yml': 'on: push\njobs: {}\n' } });
  // Since Bob's word of 4 Nov a product workflow is judged by the close rules (close-workflows.test.mjs), not
  // sent to him: here it came in by an ungated commit.
  assert.throws(close(r).go, /regression\.yml: rule 1: it was changed by [0-9a-f]{10}, a direct commit on tranche/);
  const s = product({ workflows: { 'process-gate.yml': SHIM + '# edited\n' } });
  assert.throws(close(s).go, /process-gate\.yml is not the process's own shim/);
});

test('a bootstrap close needs the gate required by main and green on the head', () => {
  const r = product();
  assert.throws(close(r, { rules: { checks: [{ context: 'ci' }] }, runs: { ci: [ok()] } }).go, /main has no Process3, so its first close needs the gate.*its required checks: ci success/);
  const red = close(r, { runs: { gate: [ok({ conclusion: 'failure' })] } });
  assert.throws(red.go, /needs the gate.*gate failure/);
  assert.equal(red.f.calls.merged, null);
  assert.throws(close(r, { rules: { checks: [] } }).go, /main requires no checks/);
});

test('a base with Process3 is not a bootstrap: a normal close is unchanged', () => {
  // Main holds a config: its tranche's name and owner are main's, and GitHub's ruleset judges the checks.
  const r = product({ config: { tranche: 'tranche', node: '22' }, mainFiles: { 'process/config.json': { tranche: 'tranche' } } });
  assert.equal(isBootstrap(r.root, 'origin/main'), false);
  assert.equal(close(r, { rules: { checks: [{ context: 'ci' }] }, runs: { ci: [ok({ conclusion: 'failure' })] } }).go().merged, true, 'the ruleset, not the tool, judges a normal close\'s checks');
  // A head with no pin, into a main with a config and no pin: as before, no pin is no change.
  assert.equal(close(product({ config: { tranche: 'tranche', node: '22' }, pin: null, workflows: {}, mainFiles: { 'process/config.json': { tranche: 'tranche' } } })).go().merged, true);
  // A normal close anchors the approvals too (review of PR 96): main's owner's website commit, or refused.
  const a = product({ config: { tranche: 'tranche', approvals: { file: 'AGENTS.md' } }, mainFiles: { 'process/config.json': { tranche: 'tranche' } } });
  assert.throws(close(a, { owned: 'none' }).go, /changes approvals in process\/config\.json/);
  assert.equal(close(a).go().merged, true);
});

test('a main that had a config and deleted it is a normal close by its last config, not a bootstrap', () => {
  // Main's last config names bob/plan the tranche; a later commit deleted the config.
  const r = product({ mainFiles: { 'process/config.json': { tranche: 'bob/plan' } } });
  git(['checkout', '-q', 'main'], { cwd: r.root });
  git(['rm', '-q', 'process/config.json'], { cwd: r.root });
  git(['commit', '-q', '-m', 'drop the config'], { cwd: r.root });
  git(['push', '-q', 'origin', 'main'], { cwd: r.root });
  assert.equal(isBootstrap(r.root, 'origin/main'), false);
  assert.throws(close(r).go, /only the tranche bob\/plan merges into main, not tranche/);
});

test('a bootstrap retry stops when the base gained Process3 while the merge waited', () => {
  const r = product();
  const f = io(r);
  let tries = 0;
  f.io.mergePR = () => {
    tries++;
    // Someone else's close lands first: main now holds a config.
    git(['checkout', '-q', 'main'], { cwd: r.root });
    commit(r.root, { 'process/config.json': { tranche: 'tranche' } }, 'Process3 lands on main');
    git(['push', '-q', 'origin', 'main'], { cwd: r.root });
    return { merged: false, message: 'Base branch was modified. Review and try the merge again.' };
  };
  assert.throws(() => mergePlain(r.root, 7, { ...q, io: f.io, wait: 0 }), /main gained Process3 while pull request 7 was checked as its first close/);
  assert.equal(tries, 1);
});

test('a bootstrap close re-reads the base after the wait: Process3 landing during it refuses before any merge (review 4 of PR 97)', () => {
  const r = product();
  const f = io(r);
  let landed = false;
  const read = f.io.checkRuns;
  f.io.checkRuns = (...a) => {
    if (!landed) {
      landed = true;
      git(['checkout', '-q', 'main'], { cwd: r.root });
      commit(r.root, { 'process/config.json': { tranche: 'tranche' } }, 'Process3 lands on main');
      git(['push', '-q', 'origin', 'main'], { cwd: r.root });
    }
    return read(...a);
  };
  assert.throws(() => mergePlain(r.root, 7, { ...q, io: f.io }), /main gained Process3 while pull request 7 was checked as its first close/);
  assert.equal(f.calls.merged, null);
});

// ===== file: status-acts.test.mjs =====

// BOB's acts first (measured 6 Nov: 8 job PRs sat ready with a red last gate for 2-6 hours unseen,
// copy 569, 570, 493, 549 and 597, printed under idle: around line 288 of about 700 with no act
// named; extraction 432 COMPLETE with its pull request a draft for 20 h). Display only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { commit, entry, makeRepo } from './helpers.mjs';
import { git } from '../lib/util.mjs';
import { actOf, status } from '../lib/status.mjs';

const old = new Date(Date.now() - 4.5 * 36e5).toISOString();
// Jobs on origin, each COMPLETE or WORKING on its branch; their pull requests and gates.
function product(jobs) {
  const root = makeRepo(Object.fromEntries(Object.keys(jobs).map((id) => [`process/ledger/${id}.json`, entry(id, { status: { state: 'OPEN' } })])));
  git(['update-ref', 'refs/remotes/origin/tranche', 'HEAD'], { cwd: root });
  for (const [id, j] of Object.entries(jobs)) {
    git(['checkout', '-q', '-b', `job/${id}`, 'origin/tranche'], { cwd: root });
    commit(root, { [`process/ledger/${id}.json`]: entry(id, { status: { state: j.state } }), [`src/${id}/a.js`]: '1' });
    git(['update-ref', `refs/remotes/origin/job/${id}`, 'HEAD'], { cwd: root });
    git(['checkout', '-q', 'main'], { cwd: root });
  }
  const prs = Object.entries(jobs).map(([id, j], i) => ({ number: 560 + i, head: { ref: `job/${id}`, sha: id }, draft: !!j.draft, updated_at: old }));
  const io = { openPRs: () => prs, checkRun: (slug, sha) => (jobs[sha].gate ? { status: 'completed', conclusion: jobs[sha].gate } : null), compare: () => null, prFiles: () => [] };
