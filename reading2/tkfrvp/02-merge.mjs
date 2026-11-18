  }
  const whole = (k, v) => {
    const x = Number(v);
    if (v === undefined || v === true || !String(v).trim() || !Number.isInteger(x) || x < 0) fail(`--reviewed needs ${k} <n>, a whole number 0 or more${v === undefined ? '' : `; not ${JSON.stringify(v)}`}: the review's measures go in the merge row (Bob, 4 Nov)`);
    return x;
  };
  const minutes = Number(reviewMinutes);
  if (reviewMinutes === undefined || reviewMinutes === true || !String(reviewMinutes).trim() || !Number.isFinite(minutes) || minutes < 0) fail(`--reviewed needs --review-minutes <n>, the minutes the review and its fix pass added before the merge${reviewMinutes === undefined ? '' : `; not ${JSON.stringify(reviewMinutes)}`}`);
  const f = whole('--findings', findings);
  const a = whole('--acted-on', actedOn);
  if (a > f) fail(`--acted-on ${a} is more than --findings ${f}`);
  let usd = 'unmeasured';
  if (reviewCostUsd !== undefined) {
    usd = Number(reviewCostUsd);
    if (reviewCostUsd === true || !String(reviewCostUsd).trim() || !Number.isFinite(usd) || usd <= 0) fail(`--review-cost-usd <n>, above 0, or leave it out (unmeasured); not ${JSON.stringify(reviewCostUsd)}`);
  }
  return { review_minutes: minutes, review_usd: usd, findings: f, findings_acted: a };
}

// The review workers' cost (review-trigger day-1 study, 5 Nov: all 7 reviewed merges read review_usd
// "unmeasured"), when no --review-cost-usd gives it: from --review-record <file>, the review
// session's get_session result saved as JSON (one, a list, or under data), its
// external_metadata.usage.cost_usd; else from the module's rows `metrics add <id> --role review`
// writes (process/metrics/<id>.bob.jsonl, in this checkout and on the tranche): those naming a
// --review-session, or, with none named, those since the job's attempt started (since). Returns
// { usd, from } or { usd: 'unmeasured', why }.
export const reviewSessions = (v) => [...new Set((Array.isArray(v) ? v : v === undefined || v === null ? [] : [v]).flatMap((x) => String(x).split(',')).map((x) => sessionForm(x.trim())).filter(Boolean))];
export function reviewCostOf(root, cfg, id, { sessions = [], record, since = null } = {}) {
  const want = reviewSessions(sessions);
  if (record !== undefined && record !== null) {
    if (record === true || !String(record).trim()) fail('--review-record <file>: the review session\'s get_session result, saved as JSON');
    let j;
    try { j = JSON.parse(readFileSync(String(record), 'utf8')); } catch (e) { fail(`--review-record ${record}: not a readable JSON file (${e.message})`); }
    const list = (Array.isArray(j) ? j : Array.isArray(j?.data) ? j.data : [j]).filter((x) => x && typeof x === 'object');
    const mine = list.filter((x) => !want.length || want.includes(sessionForm(String(x.id || x.session_id || ''))));
    const costs = mine.map((x) => Number(x.external_metadata?.usage?.cost_usd)).filter((x) => Number.isFinite(x) && x > 0);
    if (!costs.length) fail(`--review-record ${record}: no session${want.length ? ` ${want.join(', ')}` : ''} in it with external_metadata.usage.cost_usd above 0`);
    return { usd: Math.round(costs.reduce((t, x) => t + x, 0) * 1e4) / 1e4, from: `review session record${mine.length > 1 ? 's' : ''} ${mine.map((x) => sessionForm(String(x.id || x.session_id || '?'))).join(', ')}` };
  }
  const file = bobMetricsFile(id);
  const parse = (t) => String(t || '').split('\n').filter(Boolean).flatMap((l) => { try { return [JSON.parse(l)]; } catch { return []; } });
  const onTranche = git(['show', `refs/remotes/origin/${cfg.tranche}:${file}`], { cwd: root, allowFail: true });
  let here = [];
  try { here = readRows(root, id, file); } catch { here = []; }
  const seen = new Set();
  const rows = [...(onTranche.code === 0 ? parse(onTranche.stdout) : []), ...here].filter((r) => { const k = JSON.stringify(r); if (seen.has(k)) return false; seen.add(k); return true; });
  const review = rows.filter((r) => r.row === 'attempt' && r.event === 'measured' && r.role === 'review' && (r.module ?? id) === id && Number(r.cost_usd) > 0);
  const mine = want.length ? review.filter((r) => want.includes(sessionForm(r.session))) : since ? review.filter((r) => String(r.at) >= String(since)) : [];
  if (!mine.length) {
    const why = want.length ? `no \`metrics add ${id} --role review\` row priced for ${want.join(', ')}` : since ? `no \`metrics add ${id} --role review\` row priced since the attempt started (${since})` : 'the attempt\'s start was not read and no --review-session was named';
    return { usd: 'unmeasured', why };
  }
  // A session's rows are its cost so far (metrics add, as BOB records its own): its latest counts once.
  const bySession = [...new Map(mine.map((r, i) => [r.session || `#${i}`, r])).values()];
  return { usd: Math.round(bySession.reduce((t, r) => t + Number(r.cost_usd), 0) * 1e4) / 1e4, from: `${mine.length} --role review row${mine.length > 1 ? 's' : ''}${mine.some((r) => r.session) ? ` (${[...new Set(mine.map((r) => r.session).filter(Boolean))].join(', ')})` : ''}` };
}
// The start of the job's current attempt, from its rows at the head (null: none read).
export const attemptStart = (rows) => (rows || []).filter((r) => r.row === 'attempt' && r.event === 'start').pop()?.at || null;

export function merge(root, n, opts = {}) {
  const { reviewed, noReview, minutes = GATE_WAIT_MINUTES, log = console.log } = opts;
  const io = { getPR, comments, checkRun, mergePR, verify: (slug, r, ctx) => verifyRow(slug, r, ctx), ...(opts.io || {}) };
  const rounds = reviewRounds(opts);
  let measures = reviewMeasures(opts);
  if (!reviewed && (opts.reviewSession !== undefined || opts.reviewRecord !== undefined)) fail('--no-review ran no review: drop --review-session and --review-record');
  if (opts.reviewCostFrom && typeof measures.review_usd === 'number') measures = { ...measures, review_usd_from: String(opts.reviewCostFrom) };
  // The job's cost, read by BOB from get_session on the job's session, idle by now (measured 4 Nov,
  // 11:49: mid-turn a session's own record has no usage). A value not read is refused before
  // anything runs; an omitted one records the cost unmeasured and never stops the merge.
  const jobCost = jobCostOf(opts.jobCostUsd);
  const cfg = loadConfig(root);
  const slug = opts.slug || repoSlug(root);
  const pr = io.getPR(slug, n);
  const id = branchModule(pr.head?.ref, ledgerIds(root, `origin/${cfg.tranche}`));
  // A job's pull request already merged: merge again only records its provider notices, the step
  // a failed state-branch write left undone (idempotent).
  if (id && pr.state === 'closed' && pr.merged && pr.merge_commit_sha) {
    // Its rows are on the tranche now, which no job merge writes to: a cost this late is not recorded.
    if (jobCost !== null) log(`pull request ${n} is already merged: --job-cost-usd ${jobCost} is not recorded (a job's cost is written only by the merge that lands it)`);
    return noticesOnly(root, cfg, { id, n, pr, slug, log, compare: io.compare });
  }
  const { branch, watch, first, all, receipt, mb, baseEntry, trig } = jobChecks(root, n, pr, id, { cfg, slug, io, noReview, minutes, log, every: opts.every, mergeableEvery: opts.mergeableEvery, onGate: opts.onGate, transient: opts.transient });
  if (reviewed && measures.review_usd === 'unmeasured') {
    const c = reviewCostOf(root, cfg, id, { sessions: opts.reviewSession, record: opts.reviewRecord, since: attemptStart(rowsAt(root, pr.head.sha, id)) });
    measures = { ...measures, review_usd: c.usd, ...(c.from ? { review_usd_from: c.from } : { review_usd_why: c.why }) };
    log(c.from ? `review cost: ${c.usd} USD, from ${c.from}` : `review cost: unmeasured (${c.why}); record it before the merge with ${P3} metrics add ${id} --role review --session <the review session> --cost-usd <its get_session usage.cost_usd>, or pass --review-cost-usd <n>`);
  }

  // Work in a worktree of its own, so the caller's checkout is never moved.
  return withTemp('p3-merge-', (tmp) => {
    const wt = join(tmp, id);
    git(['worktree', 'add', '-q', '--detach', wt, `origin/${branch}`], { cwd: root });
    let { tip, rejudged } = buildMerged(wt, cfg, {
      n, id, branch, onto: `origin/${cfg.tranche}`, ontoName: cfg.tranche, conflictHint: `; the job must bring itself up to date: ${P3} job sync ${id}, then job complete ${id} again`,
      reviewed, noReview, rounds, measures, triggers: trig.fired, jobCost, jobSession: opts.jobSession, attempt: receipt.attempt, log,
    });
    if (tip !== pr.head.sha) {
      opts.onGate?.(tip);
      git(['push', '-q', 'origin', `HEAD:refs/heads/${branch}`], { cwd: wt });
      log(`pushed ${tip.slice(0, 10)} to ${branch}; the gate runs on the merged result`);
    } else log(`${branch} is already the merged result at ${tip.slice(0, 10)}; nothing to push`);
    const run = tip === pr.head.sha ? first : waitForGate(slug, tip, { ...watch, was: pr.head.sha });
    if (run.conclusion !== 'success') fail(`the gate on the merged result is ${run.conclusion}: ${run.html_url}`);
    const loadOnly = gateRuns(all).flatMap((x) => x.load_only || []);
    if (loadOnly.length) log(`note for review: these tests failed only by not loading when reverted: ${[...new Set(loadOnly)].join(', ')}`);
    const r = mergeRetry(() => io.mergePR(slug, n, tip), {
      log, wait: opts.wait, reread: { read: () => io.getPR(slug, n), sha: tip },
      fetch: () => git(['fetch', '-q', 'origin', `+refs/heads/${cfg.tranche}:refs/remotes/origin/${cfg.tranche}`], { cwd: root, allowFail: true }),
      check: () => {
        const p = io.getPR(slug, n);
        if (p.state !== 'open' || p.base?.ref !== cfg.tranche || p.head?.sha !== tip) fail(`pull request ${n} changed while its base moved; run merge again`);
        // The gate ran on the job merged with the tranche as it was: a tranche that moved past
        // that is a new merged result, which merge gates afresh when run again.
        if (git(['merge-base', '--is-ancestor', `refs/remotes/origin/${cfg.tranche}`, tip], { cwd: root, allowFail: true }).code !== 0) fail(`${cfg.tranche} moved past the merged result the gate checked; run merge again`);
      },
    });
    if (!r?.merged) fail(`GitHub did not merge pull request ${n}: ${r?.message || 'no result'}`);
    log(`merged pull request ${n} at ${r.sha} (${now()})`);
    // The provider-change route: the notice this job leaves its users, and the notices its START
    // named, answered now that it merged. The merge stands if the write fails; the rows are printed.
    // Their lines are held until the first act is printed: BOB reads the output when it ends.
    const held = [];
    const hold = (l) => held.push(l);
    let notes;
    let triage;
    try {
      notes = noticeStep(root, cfg, { id, n, mb, head: pr.head.sha, at: tip, entry: baseEntry, log: hold });
      // The notice it raised, triaged here, not in BOB's later batch (triageAtMerge); a failure
      // leaves the notice owed as before, and status names its triage.
      triage = triageStep(root, cfg, notes, { ref: tip, log: hold });
    } catch (e) {
      // Never lost: an unexpected stop still prints the start of the ready jobs and what was held.
      log(START_FIRST);
      for (const l of held) log(l);
      throw e;
    }
    // The first act, before any other line BOB must read (coordinator, 4 Nov): the triage the
    // merge's notice owes (case-catalogue:224 at 12:16 was triaged 9.6 min later), then the ready
    // jobs' start (a 25-minute ready-to-start wait was BOB's turn spent on other output first).
    for (const l of firstActs(triage)) log(l);
    for (const l of held) log(l);
    log(START_NEXT);
    // The triage's outcome again as the last line: BOB read merge 199's output through tail -3
    // (copy, 4 Nov), which dropped the triage line and the push failure that stopped it.
    // A merge that left no notice to triage has said so above; START_NEXT stays its last line.
    if (!String(triage?.why || '').startsWith('none to run')) log(triageLast(triage));
    return { merged: true, sha: r.sha, tip, notices: notes, triage, next: START_NEXT, ...(rejudged ? { rejudged } : {}) };
  }, { root });
}

