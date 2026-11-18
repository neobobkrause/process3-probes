  if (!reopen && owed.length && /"state":\s*"COMPLETE"/.test(git(['show', `${from}:${entryFile(id)}`], { cwd: root, allowFail: true }).stdout) && !unfinished()) reopen = `answer ${owed.length === 1 ? 'the provider notice' : 'the provider notices'} ${owed.map((x) => x.key).join(', ')}`;

  // A reopen restarts a branch whose last attempt merged (its tip is in the tranche). Anything
  // else on the remote branch is either an unfinished start, resumed below, or refused there.
  // Ahead counts come from GitHub in a shallow clone, where the local history is cut (aheadBy).
  const ahead = (head, local) => aheadBy(root, { slug: push ? slug : null, base, head, local: [from, local], read: cmp });
  const merged = !fresh0 && push && reopen && remoteTip(root, branch) && (fetchRef(root, branch), true)
    && ahead(branch, `origin/${branch}`) === 0;
  if (merged) {
    if (find(slug, branch)) fail(`${branch} has an open pull request; reopen only after it merges, or BOB closes it and job start ${id} --live <n> --reopen "<what it must do>" runs again`);
  } else if (!fresh0 && push && remoteTip(root, branch)) {
    // Resume: the branch was pushed but the PR was never opened, or it was opened and the launch
    // was lost (review of PR 11): an existing PR is reused and the launch printed again. Only
    // for an unfinished start: WORKING, and nothing on the branch but its start commit; a job
    // with work on its branch is never launched twice.
    const existing = find(slug, branch);
    fetchRef(root, branch);
    const n = ahead(branch, `origin/${branch}`);
    if (n === null) fail(`cannot count ${branch}'s commits beyond ${from}`);
    const entryText = git(['show', `origin/${branch}:${entryFile(id)}`], { cwd: root });
    const entry = JSON.parse(entryText);
    const route = routeFor(id, { state: entry.status?.state, ahead: n, open: !!existing });
    if (existing && reopen) fail(`${branch} already has an open pull request, so --reopen starts nothing; ${route}`);
    if (entry.status?.state === 'COMPLETE' && n === 0) fail(`${id} is COMPLETE and its last attempt merged; ${existing ? route : 'a new attempt needs --reopen "<what it must do>"'}`);
    if (entry.status?.state !== 'WORKING' || n !== 1) fail(`${branch} exists${existing ? ' with an open pull request' : ''} and is not an unfinished start (${entry.status?.state}, ${n} commits); ${route}`);
    const startRow = git(['show', `origin/${branch}:${metricsFile(id)}`], { cwd: root }).split('\n').filter(Boolean).map((l) => JSON.parse(l)).filter((r) => r.event === 'start').pop();
    // A reopened start keeps its task: it is in the start row it already pushed.
    const task = startRow?.reopen;
    if (reopen && reopen !== task) log(`note: ${branch} is an unfinished start; it resumes with its own task${task ? ` ("${task}")` : ''}, and this --reopen text is not used`);
    const start = startText({ entry, slug, branch, tranche: cfg.tranche, ...lead, lane: laneForStart(root, cfg, id), standing: standingFor(root, cfg, 'job'), attempt: startRow?.attempt || 1, reading: readingSet(root, entry, [], cfg), reopen: task, notices: named(owed, startRow, startRow?.notices?.length ? withdrawnFor(root, cfg) : new Set()) });
    const launch = launchFor(slug, branch, id, start, model, cfg.clone);
    log(start);
    // The PR is open, so a job session may already be running (confirming review of PR 11).
    if (existing) log(`note: ${branch} already has its pull request open. Use this launch only when no job session is running for it: check your sessions first, and start nothing if one is.`);
    log(`start the job session with create_session:\n${JSON.stringify(launch, null, 2)}`);
    const pr = existing || open(slug, { head: branch, base: cfg.tranche, title: `job: ${id}`, body: start, draft: true });
    log(`${existing ? 'the draft pull request already open' : 'draft pull request'}: ${pr.html_url}`);
    const subscribe = subscribeFor(slug, pr);
    log(subscribe.text);
    return { start, pr, launch, subscribe: subscribe.call, attempt: startRow?.attempt || 1, resumed: true, created: !existing };
  }

  // Validate from the tranche before touching the checkout.
  let t = git(['show', `${from}:${entryFile(id)}`], { cwd: root, allowFail: true });
  // The layer flow: a layer branch cut before the tranche got this module's entry (copy, 6 Nov:
  // layer/8 from 2ec3f0be, the entries of PR 638 after it) reads it from the tranche, the
  // ledger's home; the start commit carries it onto the job's branch, and its publish onto the layer.
  let carried = null;
  if (t.code !== 0 && cfg.layer) {
    if (push) fetchRef(root, cfg.layer.tranche, { allowFail: true });
    const home = push ? `origin/${cfg.layer.tranche}` : cfg.layer.tranche;
    const h = git(['show', `${home}:${entryFile(id)}`], { cwd: root, allowFail: true });
    if (h.code === 0) {
      t = h;
      carried = { from: home, text: h.stdout.endsWith('\n') ? h.stdout : `${h.stdout}\n` };
      log(`${from} has no ledger entry ${entryFile(id)}; it is read from ${cfg.layer.tranche}, the ledger's home, and the start commit carries it onto ${branch} (its publish, onto ${cfg.tranche})`);
    }
  }
  if (t.code !== 0) fail(`no ledger entry ${entryFile(id)} on ${from}${cfg.layer ? ` or on ${cfg.layer.tranche}` : ''}`);
  const entry0 = JSON.parse(t.stdout);
  const errs = validate(entry0);
  if (errs.length) fail(`ledger entry is invalid: ${errs.join('; ')}`);
  // The requirements cap (REQ-6): a trigger for BOB's split or consolidation, never a refusal
  // (coordinator's check audit, 5 Nov 19:30: 32 of 32 refusals overridden). The figure is kept in the start row.
  let reqAt = entry0.requirements ? git(['show', `${from}:${entry0.requirements}`], { cwd: root, allowFail: true }) : null;
  // A carried entry's requirements file, when only the tranche has it, is carried with it (cold
  // review of PR 190: the START names marks in a file the job's branch lacked).
  if (carried && reqAt && reqAt.code !== 0) {
    const r = git(['show', `${carried.from}:${entry0.requirements}`], { cwd: root, allowFail: true });
    if (r.code === 0) { reqAt = r; carried.req = { file: entry0.requirements, text: r.stdout }; log(`${entry0.requirements} is carried from ${cfg.layer.tranche} with it`); }
  }
  const over = reqAt?.code === 0 ? overCap(cfg, entry0.requirements, reqAt.stdout) : null;
  if (over) log(`${over}; starting over the cap${overWhy === undefined ? '' : `: ${overWhy}`}`);
  if (reopen && fresh0?.abandoned) {
    // The abandoned attempt never merged: the tranche may still read OPEN or BLOCKED.
    if (!['OPEN', 'BLOCKED', 'COMPLETE'].includes(entry0.status.state)) fail(`${id} is ${entry0.status.state} on ${cfg.tranche}; bring it to Bob`);
  } else if (reopen) {
    if (entry0.status.state !== 'COMPLETE') fail(`${id} is ${entry0.status.state}; --reopen is for a COMPLETE module`);
  } else if (restart !== undefined && entry0.status.state !== 'OPEN') {
    fail(`${id} is ${entry0.status.state}, not OPEN; --restart with --fresh-branch is for an OPEN module${entry0.status.state === 'COMPLETE' ? ', and a COMPLETE one takes --reopen "<what it must do>" with --fresh-branch' : ''}`);
  } else if (!['OPEN', 'BLOCKED'].includes(entry0.status.state)) {
    fail(`${id} is ${entry0.status.state}, not OPEN${entry0.status.state === 'COMPLETE' ? '; a new attempt needs --reopen "<what it must do>"' : ''}`);
  }
  // A local branch left by the merged attempt holds nothing the tranche lacks: a reopen moves it
  // to the tranche (no branch is deleted). Any other local branch is refused.
  const local = git(['rev-parse', '-q', '--verify', `refs/heads/${branch}`], { cwd: root, allowFail: true }).code === 0;
  const stale = local && reopen && ahead(git(['rev-parse', `refs/heads/${branch}`], { cwd: root }), `refs/heads/${branch}`) === 0;
  if (local && !stale) {
    fail(reopen ? `a local branch ${branch} exists with commits the tranche does not have; bring it to Bob`
      : `a local branch ${branch} exists; a new attempt on a merged module needs --reopen, and anything else goes to Bob`);
  }
  if (git(['status', '--porcelain', '--untracked-files=no'], { cwd: root })) fail('the working tree has changes; commit or stash them first');
  // Never move a branch that this or any other worktree has checked out.
  const held = git(['worktree', 'list', '--porcelain'], { cwd: root }).split('\n').some((l) => l === `branch refs/heads/${branch}`);
  if (stale && held) fail(`${branch} is checked out in a worktree; check out another branch there first`);

  // R10 (Bob, 6 Nov): a start while a provider in its layer has not landed is early; its start row
  // says so, and layer report counts it.
  let early = [];
  if (cfg.layer) {
    // Unread: null (unknown), never counted as not early (cold review of PR 196).
    try { if (push) fetchState(root, cfg.state_branch); early = earlyProviders(root, { ...cfg, tranche: cfg.layer.tranche }, cfg.layer.n, id, from); } catch (e) { early = null; log(`note: whether this start is early was not read (${e.message})`); }
    if (early?.length) log(`note: an early start: ${early.join(', ')} ${early.length > 1 ? 'have' : 'has'} not landed on ${cfg.tranche}; ${id} may meet ${early.length > 1 ? 'their' : 'its'} interface change later (layer jobs lists ${id} after ${early.join(', ')})`);
  }
  const sym = git(['symbolic-ref', '-q', '--short', 'HEAD'], { cwd: root, allowFail: true });
  const back = sym.code === 0 ? sym.stdout.trim() : git(['rev-parse', 'HEAD'], { cwd: root });
  const before = stale ? git(['rev-parse', `refs/heads/${branch}`], { cwd: root }) : null;
  git(['checkout', '-q', stale ? '-B' : '-b', branch, from], { cwd: root });
  let result;
  let committed = false;
  const wrote = [];
  const carriedFiles = carried ? [[entryFile(id), carried.text], ...(carried.req ? [[carried.req.file, carried.req.text]] : [])] : [];
  try {
    for (const [f] of carriedFiles) if (existsSync(join(root, f))) fail(`${f} is in the working tree, untracked, though ${from} has none; move it aside first; nothing was started`);
    for (const [f, text] of carriedFiles) {
      mkdirSync(dirname(join(root, f)), { recursive: true });
      writeFileSync(join(root, f), text);
      wrote.push(f);
    }
    const entry = readEntry(root, id);
    const attempt = Math.max(nextAttempt(root, id), (fresh0?.prior ?? 0) + 1);
    const reading = readingSet(root, entry, [], cfg);
    const start = startText({ entry, slug, branch, tranche: cfg.tranche, ...lead, lane: laneForStart(root, cfg, id), standing: standingFor(root, cfg, 'job'), attempt, reading, reopen, abandoned: fresh0?.abandoned, freshRestart: restart !== undefined ? String(restart).trim() : null, notices: owed });
    writeStatus(root, id, { state: 'WORKING', at: now(), ...(reopen ? { reason: `reopened: ${reopen}` } : {}) });
    appendRow(root, id, { row: 'attempt', event: 'start', role: 'job', attempt, reading_bytes: reading.bytes, start_bytes: Buffer.byteLength(start), tool: toolPin(), branch, ...(fresh0 ? { fresh: { from: fresh0.from, why: fresh0.why } } : {}), ...(fresh0?.abandoned ? { abandoned: fresh0.abandoned } : {}), ...(reopen ? { reopen } : {}), ...(restart !== undefined ? { restart: String(restart).trim() } : {}), ...(over ? { over_cap: overWhy ?? null, cap: over } : {}), ...(owed.length ? { notices: owed.map((x) => x.key) } : {}), ...(cfg.layer ? { layer: cfg.layer.n, early } : {}) });
    commitFiles(root, [entryFile(id), metricsFile(id), ...(carried?.req ? [carried.req.file] : [])], `job start ${id} (attempt ${attempt})`);
    committed = true;
    const launch = launchFor(slug, branch, id, start, model, cfg.clone);
    log(start);
    log(`start the job session with create_session:\n${JSON.stringify(launch, null, 2)}`);
    result = { start, launch, attempt, pr: null };
    if (push) {
      provable(root, id, branch, cfg.tranche, from);
      git(['push', '-q', '-u', 'origin', branch], { cwd: root });
      if (remoteTip(root, branch) !== git(['rev-parse', 'HEAD'], { cwd: root })) fail(`the push of ${branch} did not land`);
      // The layer's own count of starts, early ones marked (layer report).
      if (cfg.layer) { try { writeRows(root, cfg.state_branch, `layer ${cfg.layer.n}: ${id} started${early?.length ? ' early' : ''}`, [[flowFile(cfg.layer.n, 'start', `${safeName(id)}-${attempt}-${Date.now()}`), { row: 'start', layer: cfg.layer.n, module: id, attempt, branch, early, at: now() }]]); } catch (e) { log(`note: the layer's start row was not written (${e.message}); the start row on ${branch} has it`); } }
