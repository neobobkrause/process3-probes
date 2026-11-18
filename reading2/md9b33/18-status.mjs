  const newestLand = (id) => {
    if (landNames === null) {
      try { if (!offline) fetchState(root, cfg.state_branch); } catch { /* read what the clone has */ }
      const r = git(['ls-tree', '-r', '--name-only', `refs/remotes/origin/${cfg.state_branch}`, '--', FLOW_DIR], { cwd: root, allowFail: true });
      landNames = r.code === 0 ? r.stdout.split('\n').filter((f) => /^[^/]+\/[^/]+\/land\/[^/]+\.json$/.test(f)) : [];
    }
    const pre = `${safeName(id)}-`;
    return landNames.filter((f) => f.split('/').pop().startsWith(pre)).flatMap((f) => { try { const x = JSON.parse(readState(root, cfg.state_branch, f)); return x?.module === id ? [x] : []; } catch { return []; } })
      .sort((a, b) => (Date.parse(a.at) || 0) - (Date.parse(b.at) || 0)).at(-1) || null;
  };
  // Whether a branch name resolves, as rev-parse --verify resolves it (refs/<b>, refs/tags/<b>,
  // refs/heads/<b>, refs/remotes/<b>, refs/remotes/<b>/HEAD), from one for-each-ref read when first
  // asked (C50: a rev-parse per module); unread, a rev-parse each as before.
  let refSet;
  const hasRef = (b) => {
    if (refSet === undefined) { const r = git(['for-each-ref', '--format=%(refname)'], { cwd: root, allowFail: true }); refSet = r.code === 0 ? new Set(r.stdout.split('\n').filter(Boolean)) : null; }
    if (!refSet) return git(['rev-parse', '--verify', '-q', b], { cwd: root, allowFail: true }).code === 0;
    return [`refs/${b}`, `refs/tags/${b}`, `refs/heads/${b}`, `refs/remotes/${b}`, `refs/remotes/${b}/HEAD`].some((x) => refSet.has(x));
  };
  for (const [file, text] of Object.entries(onTranche)) {
    let e;
    try { e = JSON.parse(text); } catch { rows.push({ id: file, state: 'UNREADABLE' }); continue; }
    // The job's branch (ledger.mjs jobBranch): job/<id>, or a --fresh-branch start's job/<id>-<n>.
    const jb = jobBranchAt(root, e.id, jheads, ids);
    const branch = `origin/${jb}`;
    const tipAge = () => Date.now() - (Number(git(['log', '-1', '--format=%ct', branch], { cwd: root, allowFail: true }).stdout.trim()) * 1000 || Date.now());
    const row = { id: e.id, tranche: e.status?.state, req: e.requirements, ...(jb !== `job/${e.id}` ? { ref: jb } : {}) };
    // BLOCKED with a recorded reason, on the tranche or its branch: the layer can close past it.
    if (e.status?.state === 'BLOCKED') Object.assign(row, { since: e.status.at, owner: e.status.owner }, e.status.reason ? { blocked: e.status.reason } : {});
    const haveBranch = hasRef(branch);
    // Judged at the fetched tranche, on the branch this row reads (review: the wanted set was read
    // before the fetch, from the local tranche): a ref the row needs, on origin, not in this clone.
    if (!haveBranch && wanted && originHeads?.has(`refs/heads/${jb}`) && (e.status?.state !== 'COMPLETE' || prHeads.has(jb) || noticed.has(e.id))) row.unread = true;
    if (haveBranch) {
      const t = git(['show', `${branch}:${LEDGER_DIR}/${e.id}.json`], { cwd: root, allowFail: true });
      let s = {};
      try { s = t.code === 0 ? JSON.parse(t.stdout).status || {} : {}; } catch { s = {}; }
      const ahead = haveTranche ? aheadBy(root, { slug, base: cfg.tranche, head: jb, local: [tranche, branch], read: io.compare }) : null;
      row.ahead = ahead;
      // A job whose pull request merged (its entry COMPLETE on the tranche, every commit of its
      // branch on the tranche) is the tranche's: its branch, not fetched once COMPLETE, can hold
      // the status it had when last fetched, and raises no flag (ROOT, 4 Nov: sweep listed the
      // merged instance-setup and wizard-scripts as BLOCKED every hour from such a ref). Its
      // branch is still read (owedNotices: a merged attempt's start row names an unrecorded answer).
      const merged = ahead === 0 && e.status?.state === 'COMPLETE';
      row.branch = (s.state || 'no entry on its branch') + (s.reason ? ` (${s.reason})` : '');
      // C37: superseded by a later land of the module (above): no flag, no block, said as stale.
      const land = !merged && (s.state === 'BLOCKED' || s.state === 'WORKING') ? newestLand(e.id) : null;
      const tip = land ? Number(git(['log', '-1', '--format=%ct', branch], { cwd: root, allowFail: true }).stdout.trim()) * 1000 : 0;
      // The land's time is its layer merge commit's when this clone has it: a land recorded late
      // (layer land's recovery of a merged PR) has a later `at` than a new attempt it must not hide
      // (cold review of C37).
      const mt = land?.merge ? Number(git(['log', '-1', '--format=%ct', land.merge], { cwd: root, allowFail: true }).stdout.trim()) * 1000 : 0;
      if (land && tip && (mt || Date.parse(land.at) || 0) > tip) {
        row.stale = { pr: land.pr ?? null, layer: land.layer ?? null, at: land.at };
        row.branch = `stale: ${s.state} on ${jb} as this clone has it, older than ${e.id}'s land (PR ${land.pr} on layer ${land.layer} at ${land.at}); not its state`;
      }
      // ENF-6, JOB-9: a WORKING job with nothing pushed beyond its start commit for SILENT_HOURS (copy, 4 Nov: flagged 7 min after its start).
      if (!merged && !row.stale && s.state === 'WORKING' && ahead !== null && ahead <= 1 && tipAge() > SILENT_HOURS * 36e5) row.flag = 'WORKING, nothing pushed';
      if (!merged && !row.stale && s.state === 'BLOCKED') row.flag = 'BLOCKED';
      if (!merged && !row.stale && s.state) { row.blocked = s.state === 'BLOCKED' && s.reason ? s.reason : undefined; row.since = s.state === 'BLOCKED' ? s.at : undefined; row.owner = s.state === 'BLOCKED' ? s.owner : undefined; }
    }
    const pr = prs?.find((p) => p.head?.ref === jb);
    if (pr) {
      row.pr = `#${pr.number}${pr.draft ? ' draft' : ' ready'}`;
      row.updated = pr.updated_at || null;
      row.ready = !pr.draft;
      const run = io.checkRun(slug, pr.head.sha, 'gate');
      row.gate = run ? (run.conclusion || run.status) : 'none';
    } else if (row.unread) {
      row.pr = `unknown (${jb} unread)`;
    } else if (prs === null) {
      if (row.branch) row.pr = 'unknown (GitHub not read)';
      else if (e.status?.state === 'COMPLETE') row.pr = 'merged';
    } else if (row.stale) {
      // COMPLETE on the tranche and landed since: done, counted as merged (cold review of C37).
      if (e.status?.state === 'COMPLETE') row.pr = 'merged';
    } else if (row.ahead === 1 && row.branch?.startsWith('WORKING')) {
      row.flag = `an unfinished start (pushed, no pull request): run job start ${e.id} --sessions <file> again and it resumes`;
    } else if (row.ahead > 0 && !row.blocked) {
      // Commits on the branch the tranche lacks, and no open PR: an attempt closed unmerged.
      row.flag = 'commits on its branch and no open PR; a closed attempt is restarted by a Phase 2 command';
    } else if (e.status?.state === 'COMPLETE') row.pr = 'merged';
    // With BOB's list_sessions (--sessions): a WORKING job with its draft open whose session is
    // archived, or idle with no push for targets.replace_minutes. BOB restarts its session.
    const restart = `BOB's act: ${P3} job start ${e.id} --restart "<why>"`;
    const js = listed && row.branch?.startsWith('WORKING') && !row.ready && row.pr?.startsWith('#') && (!row.flag || row.flag === 'WORKING, nothing pushed') ? jobSession(listed, e.id) : null;
    if (js && isArchived(js)) row.flag = `job session gone (${sessionId(js)} archived); ${restart}`;
    else if (js && isIdle(js) && tipAge() > replaceMs) row.flag = `job idle ${Math.round(replaceMs / 6e4)}m (${sessionId(js)} ${state(js) === 'idle' ? 'idle' : lower(js.status_bucket)}, no push for ${Math.round(tipAge() / 6e4)}m); ${restart}`;
    // A WORKING job that pushed and then stopped (interrupted, or stopped by refusals): its pull
    // request not ready and its branch tip older than SILENT_HOURS. BOB restarts its session.
    // The fallback when BOB's sessions are not given, or none matches the job.
    if (!row.flag && !row.ready && row.ahead > 1 && row.branch?.startsWith('WORKING')) {
      const age = tipAge();
      if (age > SILENT_HOURS * 36e5) row.flag = `WORKING, no push for ${Math.round(age / 36e5 * 10) / 10}h; BOB's act: ${P3} job start ${e.id} --restart "<why>"`;
    }
    // OPEN on the tranche, origin read, and no job branch and no pull request: never started.
    if ((prs !== null || (offline && givenHeads)) && originHeads && !originHeads.has(`refs/heads/${jb}`) && e.status?.state === 'OPEN' && !row.branch && !row.pr?.startsWith('#') && !row.flag) row.unstarted = true;
    // A deferred module's pull request, GitHub unread: unknown, so the layer is held.
    if (prs === null && row.blocked && !row.pr) row.pr = 'unknown (GitHub not read)';
    rows.push(row);
  }
  log(`ledger on ${haveTranche ? tranche : 'the working tree'}: ${rows.length} entr${rows.length === 1 ? 'y' : 'ies'}${prs === null ? (offline ? '; offline, pull requests not read' : '; GitHub unreadable') : ''}`);
  for (const r of role === 'bob' ? [] : rows) {
    log(`- ${r.id}: ${r.tranche ?? r.state}${r.branch ? `; on its branch ${r.branch}, ${r.ahead} commit(s) ahead` : ''}${r.pr ? `; PR ${r.pr}` : ''}${r.gate ? `; gate ${r.gate}` : ''}${r.flag ? `; FLAG ${r.flag}` : ''}`);
  }
  let addr = {};
  try { addr = readAddress(root, { fetch: !offline }); } catch { addr = {}; }
  log(`addresses: ROOT ${addr.root ? `${addr.root.session} (${addr.root.at})` : 'none'}; BOB ${addr.bob ? `${addr.bob.session} (${addr.bob.at})` : 'none'}`);
  if (listed) log(sessionActs(listed, { rows, roles: addr, coordinator: cfg.coordinator, seats }).line);
  // Refusals per session, from the tranche's rows and this checkout's (a row BOB recorded but has
  // not merged yet counts at once); the same row in both counts once (each carries its own id).
  const seen = new Set();
  const metricRows = [...(haveTranche ? rowsAt(root, tranche) : []), ...rowsHere(root)].filter((r) => {
    const k = JSON.stringify(r);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  const sessions = refusalCounts(metricRows);
  if (sessions.length) {
    log(`refusals by session (REFRESH at ${REFRESH_AT}; auto mode asks a person at 20):`);
    for (const s of sessions) log(`- ${s.session}: ${s.refusals}${s.refresh ? '; REFRESH: start a fresh session to replace it' : ''}`);
  }
  if (role === 'job' && module) {
    const set = readingSet(root, readEntry(root, module));
    log(`reading set for job ${module}: ${set.bytes} bytes`);
    for (const f of set.files) log(`  ${f.bytes}\t${f.file}`);
  }
  if (role === 'bob') {
    // PRs merged into the tranche: their gate rows no longer change (C18: kept in the clone for hours).
    let mergedPrs = new Set();
    try { mergedPrs = new Set(rowsAt(root, haveTranche ? tranche : 'HEAD').filter((r) => r.row === 'merge' && r.pr).map((r) => Number(r.pr))); } catch { mergedPrs = new Set(); }
    const out = { sessions, rows, holds, prs, heads: idsOn(originHeads), ...bobStatus(root, cfg, { rows, prs: offline ? null : prs, offline, context, log, slug, tranche: haveTranche ? tranche : 'HEAD', files: io.prFiles, holds, comments: slug && (io.comments || ((pr) => cachedComments(root, slug, pr, { ttlMs: mergedPrs.has(Number(pr)) ? COMMENTS_MERGED_MS : COMMENTS_OPEN_MS }))) }), tranche: haveTranche ? tranche : 'HEAD' };
    const ref = haveTranche ? tranche : null;
    const closed = closedRows(root, cfg, { slug: offline ? null : slug, read: io.compare });
    out.layer = layerState(root, cfg, rows, ref, { closed });
    // No job work until the tranche open's grants check has passed (Build Plan Phase 3).
    out.open = openState(root, cfg);
    if (out.open.state !== 'open') log(openLine(out.open));
    // The round's walk at its close only, never between layers (Bob, 4 Nov): the internal walk alone
    // where one is configured (BD-R1, C43); the act that closes the round starts it (Bob, 7 Nov:
    // required, tool-started). Then, once an internal walk is clean, the release path. Owed and not run, it is the
    // first act, printed before the notices and next work; it never holds job starts. Its
    // unrecorded findings hold tranche close.
    out.deploy = null;
    // Not before the tranche open has passed (a tranche merged into main reads every row stale).
    if (deploys(cfg) && !halt && out.open.state === 'open') {
