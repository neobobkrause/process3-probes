      if (!deepenUntil(root, refs, () => based(tr) && (!pushed || based(mine)), `the history of ${branch} and ${cfg.tranche}`)) fail(`${branch} shares no history with ${cfg.tranche}`);
    }
  }
  const merged = [];
  if (pushed && mergeIn(root, mine, { id, name: `origin/${branch}`, ff: true, log })) merged.push(`origin/${branch}`);
  if (mergeIn(root, tr, { id, name: cfg.tranche, ff: false, msg: `Bring ${branch} up to ${cfg.tranche}`, log, joinOwn: true })) merged.push(cfg.tranche);
  if (!merged.length) log(`${branch} already holds ${cfg.tranche}${pushed ? ` and origin's ${branch}` : ''}`);
  const pin = pinAt(root, 'HEAD');
  if (pin) {
    const u = git(['submodule', 'update', '-q', '--init', '.process'], { cwd: root, allowFail: true });
    if (u.code !== 0) fail(`merged, but \`git submodule update .process\` failed (${u.stderr.trim().split('\n').pop()}); run it, then job sync again`);
    log(`.process is at the branch's pin ${short(pin)}`);
  }
  // The branch pushed here, through the governed git() (R17c, coordinator's item G): a job never
  // pushes by hand. A fast-forward only; refused (origin moved, or the GitHub budget), job sync
  // again merges origin's branch and pushes, so a rerun is safe.
  if (push && pushBranch && remoteTip(root, branch) !== git(['rev-parse', 'HEAD'], { cwd: root })) {
    const r = git(['push', '-q', 'origin', `HEAD:refs/heads/${branch}`], { cwd: root, allowFail: true });
    if (r.code !== 0) fail(`the push of ${branch} failed (${r.stderr.trim().split('\n').pop()}); run \`${P3} job sync ${id}\` again: it brings in origin's ${branch} and pushes`);
    log(`pushed ${branch} at ${git(['rev-parse', '--short', 'HEAD'], { cwd: root })}`);
  } else if (!push && merged.length) log('next: run your command again');
  return { ok: true, merged, pin };
}

// The job: fast checks (ledger, records, install, build, the module's checks; never a suite:
// AUD-7, PLT-4), then COMPLETE, push, receipt, ready (JOB-5, JOB-7). CI runs the suite.
// Safe to run again: on an entry already COMPLETE it only finishes the steps still missing, or,
// with commits after the COMPLETE commit and its pull request open, completes a new attempt.
export function jobComplete(root, id, opts = {}) {
  const { notVerified = [], exemptRevert, noSuite, push = true, exec, log = console.log, costUsd, session } = opts;
  // The job's own cost (coordinator, 4 Nov: job_usd unmeasured for all 52 jobs on the copy): BOB
  // writes it at the merge (merge --job-cost-usd), read from get_session on the job's idle session;
  // a job reading its own mid-turn has no usage yet (measured 4 Nov, 11:49). A nonzero --cost-usd
  // here is still taken, written as a measured job row with the complete row.
  // Zero is refused (copy, 4 Nov: signatures a4 and a5 passed 0, its session record then read
  // 3.16): no session that ran a job cost nothing, so 0 is a figure not read.
  const cost = costUsd === undefined ? null : Number(costUsd);
  if (costUsd !== undefined && (costUsd === true || !Number.isFinite(cost) || cost <= 0)) fail(`--cost-usd ${COST_WHERE}; not ${JSON.stringify(costUsd)}${cost === 0 ? ' (no job costs nothing: 0 is a figure not read)' : ''}`);
  // The session: --session, else the id the cloud session's environment gives (an id, not a secret),
  // in get_session's form: the environment's cse_<id> is the record's session_<id> (the copy's rows
  // named cse_, BOB's and get_session session_, so a delta never found the other's row).
  const sid = sessionForm(typeof session === 'string' && session ? session : process.env.CLAUDE_CODE_REMOTE_SESSION_ID || process.env.CLAUDE_CODE_SESSION_ID || null);
  if (cost !== null && !sid) fail('--cost-usd needs the session it is the cost of: --session <your session id>; the row counts only that session\'s cost since its last row');
  const io = { findPR, addComment, markReady, comments, toDraft, getPR, editPR, ...(opts.gh || {}) };
  if (exemptRevert === true) fail('--exempt-revert needs a reason');
  const branch = onBranch(root, id);
  const cfg = jobCfg(root, loadConfig(root), id, { push });
  if (push) fetchRef(root, cfg.tranche);
  pinCheck(root, id, { toolRoot: opts.toolRoot, tranche: push ? `refs/remotes/origin/${cfg.tranche}` : `refs/heads/${cfg.tranche}`, what: 'job complete' });
  // BOB's merge pushed to job/<id>: the job's push would be refused (defect sweep 4 Nov, #5).
  if (push && originAhead(root, branch)) fail(`origin's ${branch} has commits this checkout lacks (BOB's merge of the tranche, or a push from elsewhere): run \`${P3} job sync ${id}\`, then job complete again; nothing was run`);
  // A COMPLETE job may move .process to a newer pin to amend its receipt with that pin's tool;
  // it commits nothing, so the moved submodule is not work to commit (copy PR 40, 4 Nov).
  const done = readEntry(root, id).status.state === 'COMPLETE';
  if (dirty(root, done)) fail(dirty(root, true) ? 'commit your work first: tracked files have changes' : '.process is not at the pin this branch records, and a job never commits .process: run `git submodule update .process`, then job complete again');
  const timeout = (cfg.suite_timeout_minutes || 20) * MINUTE;
  const slug = push ? repoSlug(root) : 'local/local';
  const base = push && isShallow(root) ? shallowBase(root, slug, cfg.tranche, branch, opts.compare || compare)
    : git(['merge-base', 'HEAD', push ? `origin/${cfg.tranche}` : cfg.tranche], { cwd: root });
  const pr = push ? io.findPR(slug, branch) : null;
  const entry = readEntry(root, id);
  if (push && !pr) fail(entry.status.state === 'COMPLETE' ? `${id} is COMPLETE and ${branch} has no open pull request; a new attempt on a merged module is job start ${id} --live <n> --reopen "<what it must do>"` : `no open pull request from ${branch}`);
  let again = null;

  if (entry.status.state === 'COMPLETE') {
    // Resume: the receipt was saved in the COMPLETE commit's row; its SHA is that commit.
    const row = readRows(root, id).filter((r) => r.event === 'complete').pop();
    if (!row?.receipt) fail(`${id} is COMPLETE but no receipt was saved; ask your coordinator`);
    // By its message, not the last touch of the metrics file: BOB's merge row touches it too.
    const at = completeCommit(root, id);
    if (!at) fail(`${id} is COMPLETE but this clone's history holds no "job complete ${id}" commit; run \`${P3} job sync ${id}\`, then job complete again`);
    if (at === git(['rev-parse', 'HEAD'], { cwd: root })) {
      if (opts.tests?.length || noSuite) log('the job is COMPLETE: its commands and tests stand as saved; only --exempt-revert and --not-verified amend the receipt');
      return finish(root, { id, slug, pr, branch, push, io, log, receipt: { ...row.receipt, sha: at }, amend: { notVerified, exemptRevert }, again: !!row.receipt.after });
    }
    // Commits after the COMPLETE commit, its pull request still open (copy PR 79, 4 Nov: the
    // gate went red and the job pushed fixes): a new attempt, checked and tested as a fresh
    // complete, with its own start row (nextAttempt counts them) dated at its first commit.
    // First-parent only: tranche commits merged in can be older than the COMPLETE commit, and a
    // start dated before attempt 1's complete row would take that row from attempt 1 (review of
    // PR 81); never before that row in any case.
    const first = new Date(git(['log', '--first-parent', '--reverse', '--format=%cI', `${at}..HEAD`], { cwd: root }).split('\n')[0]).toISOString().replace(/\.\d+Z$/, 'Z');
    again = { after: at, pr: pr?.number ?? null, from: row.at && first < row.at ? row.at : first };
  } else if (!['WORKING', 'BLOCKED'].includes(entry.status.state)) fail(`${id} is ${entry.status.state}; job complete needs WORKING`);
  const lastStart = readRows(root, id).filter((r) => r.event === 'start').pop();
  const { tests, moved } = struckTests(root, entry, base, opts.tests || []);

  const commands = [];
  const home = cfg.layer ? homeRef(root, cfg.layer.tranche) : null;
  const ledger = checkLedger(root, { base, branch, home });
  commands.push({ cmd: `p3 ledger check --base ${base.slice(0, 10)} --branch ${branch}${home ? ` --home ${home}` : ''}`, exit: ledger.length ? 1 : 0, findings: ledger.length });
  const since = recordSince(root, { base });
  const taken = takenIn(root, { base, id });
  const rec = recordCheck(root, loadConfig(root, base), { base, since: since.since, takenIn: taken.tips });
  if (since.finding) rec.findings.push(since.finding);
  rec.findings.push(...taken.findings);
  commands.push({ cmd: `p3 record-check --base ${base.slice(0, 10)}`, exit: rec.findings.length ? 1 : 0, findings: rec.findings.length });
  // The module's stale lock files first, whether or not the suite runs: its checks may need
  // them too (GAT-5; confirming review of PR 11).
  const inst = installModule(root, cfg, entry, { exec, log });
  for (const l of inst.ran) commands.push({ cmd: `npm ci (${l})`, exit: inst.findings.some((f) => f.file === l) ? 1 : 0 });
  for (const f of inst.findings.filter((x) => !inst.ran.includes(x.file))) commands.push({ cmd: `npm ci (${f.file})`, exit: 1, error: f.message });
  // Generated files the commit does not track, built as the gate builds them before the suite.
  const built = installed0(inst) ? buildModuleGenerated(root, cfg, { timeout, exec, log }) : null;
  if (built) for (const c of built.commands) commands.push(c);
  const installed = !inst.findings.length && !(built && built.findings.length);
  const notv = [...notVerified];
  try {
    // The module's checks are product code: without the GitHub tokens, as the gate runs it.
    for (const c of installed ? entry.checks || [] : []) {
      const r = run(c[0], c.slice(1), { cwd: root, timeout, unset: NO_TOKENS });
      commands.push({ cmd: c.join(' '), exit: r.code, seconds: r.seconds });
    }
    // AUD-7, PLT-4, JOB-5: no test suite runs in the session. The module's suite runs in CI (the
    // gate), which checks this receipt against its own run (AUD-2); the receipt claims it passes.
    if (noSuite) log('--no-suite is the default: job complete runs no suite; the gate runs it in CI');
  } finally {
    if (built) restoreGenerated(root, built.ran, log);
  }
  for (const f of [...ledger, ...rec.findings]) log(`${f.check}: ${f.file}:${f.line}: ${f.message}`);
  const failed = commands.filter((c) => c.exit !== 0 && !c.base_red);
  if (failed.length) {
    for (const c of failed) log(`failed (exit ${c.exit}): ${c.cmd}`);
    log('not complete: fix these and run job complete again, or block.');
    return { ok: false, commands };
  }
  const attempt = again ? nextAttempt(root, id) : nextAttempt(root, id) - 1;
  // The receipt is saved in the COMPLETE commit, so a rerun after a failed push can post it.
  const receipt = {
    kind: 'receipt', module: id, attempt, base, branch, tool: toolPin(), at: now(),
    commands, tests, ...(moved.length ? { moved } : {}), not_verified: notv, exempt: exemptRevert ? { revert: exemptRevert } : {},
    ...(again ? { after: again.after } : {}),
    ...(rec.size_waived.length ? { size_waived: rec.size_waived } : {}),
  };
  try {
    if (again) appendRow(root, id, { at: again.from, row: 'attempt', event: 'start', role: 'job', attempt, tool: toolPin(), branch, again: { after: again.after, pr: again.pr }, ...(lastStart?.reopen ? { reopen: lastStart.reopen } : {}), ...(lastStart?.notices ? { notices: lastStart.notices } : {}) });
    writeStatus(root, id, { state: 'COMPLETE', at: now() });
    appendRow(root, id, { row: 'attempt', event: 'complete', role: 'job', attempt, pr: pr?.number ?? null, ...(sid ? { session: sid } : {}), receipt, ...(rec.size_waived.length ? { size_waived: rec.size_waived } : {}) });
    if (cost !== null) {
      // The session's cost since its own last row: a session that completes twice is counted once.
      const { usd, prior } = costDelta(readRows(root, id), sid, cost);
      appendRow(root, id, { row: 'attempt', event: 'measured', role: 'job', attempt, session: sid, session_usd: cost, cost_usd: usd });
      if (usd === 'unmeasured') log(`job ${id}'s cost: unmeasured (session ${sid} read ${cost}, its last row ${prior}: get_session's usage has not moved since); BOB reads it at the merge: merge --job-cost-usd`);
