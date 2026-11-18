  const cut = m.tasks.filter((x) => x.role !== 'not the process' && /(\.\.\.|…)\s*$/.test(String(x.prompt || '')));
  if (cut.length && !dryRun) fail(`the prompts of ${cut.map((x) => x.name || x.id).join(', ')} end in "...": the saved list_triggers cut them. Save each task's whole prompt (get_trigger) into the file, then run switch out again; nothing was written`);
  if (cut.length) log(`note: the prompts of ${cut.map((x) => x.name || x.id).join(', ')} end in "...", cut by the saved list_triggers; a real switch out refuses them`);
  // A job whose pull request GitHub did not answer for would be restarted by the wrong route (review of PR 149).
  const unread = m.jobs.filter((j) => /^unknown/.test(String(j.pr)));
  if (unread.length) fail(`GitHub was not read for the pull requests of ${unread.map((j) => j.module).join(', ')}; nothing was written. Run switch out again once GitHub answers this account's reads`);
  // A dry run writes its manifest beside the real one, never over it, and stops nothing (R16).
  const file = dryRun ? `${DRY_RUN_DIR}/manifest-${m.at.replace(/[:.]/g, '-')}.json` : MANIFEST_FILE;
  const w = writeState(root, cfg.state_branch, `switch out${dryRun ? ' --dry-run' : ''}: manifest by ${by}`, (wt) => {
    mkdirSync(dirname(join(wt, file)), { recursive: true });
    writeFileSync(join(wt, file), JSON.stringify({ ...m, ...(dryRun ? { dry_run: true } : {}) }, null, 2) + '\n');
  });
  if (dryRun) {
    log(`switch out --dry-run: ${cfg.state_branch}:${file} at ${w.tip.slice(0, 10)}: ${m.tasks.length} task(s), ${m.jobs.length} live job(s), ${(m.lanes || []).length} lane seat(s), ${(m.asks || []).length} open ask(s), ${m.layers.length ? `layer(s) ${m.layers.join(', ')} open, ` : ''}${m.messages.length} unanswered message(s), ${m.sessions.length} session(s) of this account named; nothing was stopped`);
    log('The stop acts a real switch out would print (dry run: do none of them):');
    for (const l of stopActs(m)) log(`  ${l}`);
    return { manifest: m, tip: w.tip, file };
  }
  log(`switch out: ${cfg.state_branch}:${MANIFEST_FILE} at ${w.tip.slice(0, 10)}: ${m.tasks.length} task(s), ${m.jobs.length} live job(s), ${m.messages.length} unanswered message(s); addresses ${ROLES.filter((r) => m.addresses[r]).map((r) => `${r} ${m.addresses[r].session}`).join(', ') || 'none'}`);
  log('Stop acts, in order, each its own call:');
  for (const l of stopActs(m)) log(l);
  return { manifest: m, tip: w.tip };
}

// switch quiet [--minutes 2]: exit 0 only when the tranche's tip has not moved for that long
// (its commit time: a merge through GitHub is committed when it lands). Roles started while the
// coordinator's own merges moved the tranche failed their start checks four times (5 Nov).
export function switchQuiet(root, { minutes = QUIET_MIN, t = Date.now(), log = console.log } = {}) {
  const min = Number(minutes);
  if (!(min > 0)) fail(`--minutes <n>, a positive number, not ${JSON.stringify(minutes)}`);
  const cfg = loadConfig(root);
  fetchBranch(root, cfg.tranche);
  const [tip, ct] = git(['log', '-1', '--format=%H %ct', `refs/remotes/origin/${cfg.tranche}`], { cwd: root }).split(' ');
  const age = Math.max(0, Math.round(t / 1000 - Number(ct)));
  const ok = age >= min * 60;
  log(ok ? `switch quiet: ${cfg.tranche} ${tip.slice(0, 10)} unmoved for ${age} s: go on` : `switch quiet: NOT QUIET, ${cfg.tranche} ${tip.slice(0, 10)} moved ${age} s ago; run it again in ${min * 60 - age} s and start nothing until it exits 0`);
  return { ok, tip, age };
}

// The preflight: each check { ok, line, fix }; a failure names who fixes it.
export function preflight(root, m, { slug, approvals, api = (p) => gh(['api', p], { allowFail: true }), push = () => git(['push', '--dry-run', '-q', 'origin', 'HEAD:refs/heads/p3-switch-probe'], { cwd: root, allowFail: true }), cfg = loadConfig(root) } = {}) {
  const out = [];
  const me = api('user');
  out.push(me?.login
    ? { ok: true, line: `GitHub connected, acting as ${me.login}` }
    : { ok: false, line: 'GitHub is not connected on this Claude account (GET /user failed)', fix: 'Bob: connect GitHub on this Claude account (claude.ai, Settings, Connectors), signed in as the collaborator account, not the repositories\' owner' });
  const a = me?.login ? accountCheck(slug, { api }) : { state: 'missing', detail: 'unread: GitHub is not connected' };
  out.push(a.state === 'set'
    ? { ok: true, line: `account: ${a.detail}` }
    : { ok: false, line: `account: ${a.detail} (push true, admin false needed)`, fix: `Bob: Claude's GitHub connection must act as the non-admin collaborator on ${slug}; reconnect it as that account (setup/DEVELOPER.md step 3), never as the owner` });
  const p = push();
  out.push(p.code === 0
    ? { ok: true, line: `push reachable on origin (${slug}), dry run` }
    : { ok: false, line: `push not reachable on origin (${slug}): ${String(p.stderr || p.stdout || '').trim().split('\n').pop()}`, fix: `Bob: install the Claude GitHub App on ${slug} for the collaborator account and attach the repository to this session with push access` });
  // The process repository (process3): the coordinator pushes to it.
  const proc = String(cfg.process_repo || '').match(/github\.com[/:]([^/]+\/[^/.]+)/)?.[1];
  if (proc && proc !== slug) {
    const pr = me?.login ? api(`repos/${proc}`) : null;
    out.push(pr?.permissions?.push && !pr?.permissions?.admin
      ? { ok: true, line: `${proc}: push, not admin` }
      : { ok: false, line: `${proc}: ${pr ? `push ${!!pr.permissions?.push}, admin ${!!pr.permissions?.admin}` : 'unread'} (push true, admin false needed)`, fix: `Bob: install the Claude GitHub App on ${proc} for the collaborator account, and attach the repository to the coordinator's session with push access` });
  }
  if (!m) return out;
  const tip = tipApprovals(root, cfg).approvals;
  const want = approvals === undefined ? m.approvals : String(approvals);
  out.push(tip === want
    ? { ok: true, line: `approvals at ${cfg.tranche}'s tip are ${approvals === undefined ? 'those switch out recorded' : 'the hash given by --approvals'} (${tip.slice(0, 12)})` }
    : { ok: false, line: `approvals at ${cfg.tranche}'s tip (${tip.slice(0, 12)}) are not ${approvals === undefined ? `those switch out recorded (${String(m.approvals).slice(0, 12)})` : 'the hash given by --approvals'}`, fix: `Bob: if the change is his own for the new account, the coordinator runs switch in again with --approvals ${tip} on his word; else Bob restores the approvals block` });
  return out;
}

// A word for the shell as it is: single-quoted, so $, backticks and $( ) stay text (cold review:
// a question "a $5 tier?" reached lane ask changed, and opened a second ask).
const shq = (s) => `'${String(s).replace(/'/g, `'\\''`)}'`;
// The old prompt with the old role ids named as the new role's and the old approvals hash as the tip's.
const freshPrompt = (m, prompt, approvals) => {
  let p = String(prompt).split(m.approvals).join(approvals);
  for (const r of ROLES) if (m.addresses[r]?.session) p = p.split(m.addresses[r].session).join(`<the new ${r} id: ${P3} address ${r}>`);
  for (const x of m.lanes || []) if (x.session) p = p.split(x.session).join(`<the new lane ${x.lane} id>`);
  return p;
};

export function restartActs(m, { by, cfg, approvals, addresses = m.addresses, messages = [], t = Date.now() }) {
  const L = [];
  // The manifest's ids: a switch in run again after (c) must not name the new roles as the old (review of PR 149).
  const old = (r) => m.addresses[r]?.session;
  for (const r of ROLES) if (old(r) && addresses[r]?.session && addresses[r].session !== old(r)) L.push(`note: ${r} is now addressed to ${addresses[r].session}, not the manifest's ${old(r)}: skip its start in (c) if that session is the new one`);
  // ROOT's coordinator address wins over the config's (Bob, 5 Nov 16:33): one naming another is
  // repointed by the coordinator itself once the config names it (ROOT would read its ask as data).
  const stale = addresses.coordinator?.session && addresses.coordinator.session !== by;
  const repoint = `\`${P3} start record coordinator ${by}\`, yourself: the coordinator address names ${addresses.coordinator?.session}, and the roles read it before the config`;
  L.push(coordinatorOf(cfg, addresses) === by
    ? `(a) The coordinator id: ${by} is already the coordinator (\`${P3} address coordinator\`).`
    : stale && cfg.coordinator === by ? `(a) The coordinator id: ${by} is \`coordinator\` in process/config.json on ${cfg.tranche}; then ${repoint}.`
    : `(a) The coordinator records its id: on a branch cut from origin/${cfg.tranche}, set "coordinator": "${by}" in process/config.json, push it with \`${P3} github push origin <branch>\`, open a pull request into ${cfg.tranche}, and merge it: \`${P3} merge <pr> --plain --no-review "coordinator id after the account switch"\`. The same on each product this coordinator holds (the probe too).${stale ? ` Then ${repoint}.` : ''}`);
  L.push(`(b) Wait for a quiet tranche: \`${P3} switch quiet\`, again until it exits 0 (the tip unmoved ${QUIET_MIN} min). Start nothing before.`);
  L.push(`(c) \`${P3} start root\`, then create_session with the call it prints; ROOT records its own address. Then send ROOT, each its own command for it:`);
  L.push(old('bob') ? `    - \`${P3} handover begin\` (old BOB ${old('bob')}), its create_session and \`handover confirm <new id>\`; skip the message to the old BOB and its archive: it is on the old account` : `    - \`${P3} start bob\`, its create_session and \`start record bob <new id>\``);
  L.push(old('watcher') ? `    - \`${P3} start watcher --replace ${old('watcher')}\`, its create_session, \`start record watcher <new id>\` and the daily task it prints` : `    - \`${P3} start watcher\`, its create_session, \`start record watcher <new id>\` and the daily task it prints`);
  L.push(m.tasks.length ? '(d) The scheduled tasks, after the starts, each a create_trigger call (the new ids from `address <role>`):' : '(d) No scheduled tasks to recreate.');
  for (const k of m.tasks) {
    const when = k.cron_expression ? { cron_expression: k.cron_expression } : k.run_once_at ? { run_once_at: k.run_once_at } : {};
    if (k.role.startsWith('lane ')) { L.push(`    - ${k.name || k.id} (${k.role}): created at (h), once the lane's new session is recorded`); continue; }
    if (k.role === 'not the process') { L.push(`    - ${k.name || k.id}: not the process's; Bob moves it himself if he wants it`); continue; }
    if (k.role === 'root' || k.role === 'watcher') { L.push(`    - ${k.name || k.id} (${k.role}): made by ${k.role === 'root' ? 'ROOT from its own prompt (sweep task)' : 'start watcher\'s output'}, with the current approvals; nothing to do here`); continue; }
    if (k.run_once_at && Date.parse(k.run_once_at) <= t) { L.push(`    - ${k.name || k.id}: its one time (${k.run_once_at}) has passed; recreate it only if it is still wanted`); continue; }
    const bound = k.fresh ? { create_new_session_on_fire: true } : k.role === 'coordinator' ? {} : ROLES.includes(k.role) ? { persistent_session_id: `<the new ${k.role} id: ${P3} address ${k.role}>` } : { persistent_session_id: `<unknown: it was bound to ${k.session || 'no session'}; the coordinator decides>` };
    L.push(`    - ${k.name || k.id} (${k.role}${k.role === 'coordinator' ? ', created from the coordinator session itself' : ''}): ${JSON.stringify({ name: k.name, ...when, ...bound, prompt: freshPrompt(m, k.prompt, approvals) })}`);
  }
  // Each job by routeFor's route (job.mjs): an open pull request, or BLOCKED, is a --restart; a
  // WORKING start with one commit resumes; anything else is routeFor's words for BOB.
  const open = (j) => String(j.pr || '').startsWith('#');
  const state = (j) => String(j.state).split(' ')[0];
  const restart = m.jobs.filter((j) => open(j) || state(j) === 'BLOCKED');
  const resume = m.jobs.filter((j) => !restart.includes(j) && state(j) === 'WORKING' && j.ahead === 1);
  const other = m.jobs.filter((j) => !restart.includes(j) && !resume.includes(j));
  const rel = (j) => (j.release ? ' (release path)' : '');
  L.push(restart.length || resume.length ? '(e) BOB restarts every recorded job, release path first, each its own command, then the create_session it prints:' : '(e) No recorded job to restart.');
