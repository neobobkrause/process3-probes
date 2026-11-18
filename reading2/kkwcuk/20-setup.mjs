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
