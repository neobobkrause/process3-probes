// The route that works for a job branch on origin, from its state, its commits beyond the tranche
// and whether a pull request from it is open. Every refusal of job start and --restart for a
// branch that exists names this route, so no refusal names a route that refuses in turn (BOB on
// the copy, 5 Nov: case-checker's --reopen named --restart, and --restart named --reopen).
export function routeFor(id, { state, ahead, open }) {
  const reopen = `job start ${id} --live <n> --reopen "<what it must do>"`;
  if (ahead === null || ahead === undefined) return 'its commits beyond the tranche could not be counted; run it again';
  if (!['WORKING', 'BLOCKED', 'COMPLETE'].includes(state)) return `its entry reads ${state} on the branch, which no job step writes; bring it to Bob`;
  if (ahead === 0) return open ? `its pull request is open with nothing beyond the tranche: BOB merges or closes it, then ${reopen}` : `a new attempt on a merged module is ${reopen}`;
  if (open) return `a job whose session stopped is restarted with job start ${id} --live <n> --restart "<why>"${state === 'COMPLETE' ? ' (its pull request open, red or waiting for its merge; or BOB closes it and --reopen starts a fresh attempt on the next branch)' : ''}`;
  if (state === 'BLOCKED') return `job start ${id} --live <n> --restart "<why>" opens its draft again for a replacement session`;
  if (state === 'WORKING' && ahead === 1) return `an unfinished start resumes with job start ${id} --live <n>`;
  return `its work never merged and no pull request is open: ${reopen} starts a fresh attempt on the next branch, and this one is kept`;
}

// BOB: branch, status WORKING, START, draft pull request; prints what to start the session with.
// Safe to run again: when the branch is pushed but has no pull request, it opens the PR.
// --reopen "<what>" (decision 1A, Bob, 2 Nov, before the log; unverified): a new attempt on a COMPLETE module whose
// last attempt merged. The branch restarts from the tranche, which already holds the old tip,
// so the push is a fast-forward: nothing is force-pushed and no branch is deleted. On an
// abandoned attempt (commits the tranche lacks, no open pull request, not an unfinished start)
// it starts on the next free job/<id>-<n>, as --fresh-branch does, the old branch kept.
// It runs the setup check first and starts nothing while a condition is missing (setup audit,
// 2 Nov); without a push (tests) there is no GitHub to read.
export function jobStart(root, id, { coordinator, model, reopen, restart, stop, takeIn, fresh, overCap: overWhy, still, early: earlyStart, layerIO = {}, push = true, open = createPR, find = findPR, prs = prsFromBranch, setup = setupCheck, notes = comments, compare: cmp = compare, gh: ghIO = {}, log = console.log } = {}) {
  // --restart with --fresh-branch (coordinator, 4 Nov): an OPEN module's new attempt on a fresh
  // branch; the start row records the restart's why with the fresh branch's.
  if (restart !== undefined && fresh !== undefined) {
    if (restart === true || !String(restart).trim()) fail('--restart needs why: the replaced session\'s failure as BOB saw it');
    if (reopen !== undefined) fail('--restart and --reopen do not go together');
    if (stop !== undefined) fail('--stop goes with a --restart on the job\'s own branch, not with --fresh-branch');
  } else if (restart !== undefined) return jobRestart(root, id, { coordinator, model, why: restart, stop, find, open, notes, compare: cmp, log });
  // One session per lane (lane.mjs): a lane's module starts no job while the lane's recorded
  // session is live, whatever starts it; a restart replaces the job's own session, so it is let be.
  if (restart === undefined) { const ls = laneSeatFor(root, loadConfig(root), id, { fetch: push }); if (ls) fail(`${ls.why}; nothing was started`); }
  if (takeIn !== undefined) refuseInLayer(jobCfg(root, loadConfig(root), id, { push }), 'job start --take-in');
  if (takeIn !== undefined) return jobTakeIn(root, id, { coordinator, model, from: takeIn, overWhy, push, open, find, setup, compare: cmp, gh: ghIO, log });
  if (reopen === true || (reopen !== undefined && !String(reopen).trim())) fail('--reopen needs what the new attempt must do');
  if (overWhy === true || (overWhy !== undefined && !String(overWhy).trim())) fail('--over-cap needs why the job starts over the cap');
  if (fresh === true || (fresh !== undefined && !String(fresh).trim())) fail('--fresh-branch needs why the job\'s branch cannot go on');
  const slug = push ? repoSlug(root) : 'local/local';
  // The tip the setup check anchored to and checked (approvals, pin) is the one the job is cut
  // from; a tip fetched after it was never checked (confirming review of the anchor).
  // The anchored tip's plan, and what the caller read the start from (job start --ready: the
  // module's facts), judged at the tip the job is cut from (confirming review of the anchor).
  const anchor = () => {
    if (push) setupOrStop(root, loadConfig(root), slug, setup, log);
    // An early start (R14): the next layer's branch cut ahead, the early row recorded, before the
    // base is read; that branch is then the job's, as any of its layer's jobs.
    if (earlyStart) earlyCut(root, loadConfig(root), id, { io: layerIO, log });
    // The anchored checkout's; in the layer flow, the open layer's branch is the job's base.
    const c = jobCfg(root, loadConfig(root), id, { push });
    // A layer cut ahead for early starts and not open: only an early start of a listed module.
    // A joined module included (cold review of R14).
    if (c.layer && !earlyStart) { const k = cutAhead(root, c.state_branch, c.layer.n); if (k !== null) fail(`layer ${c.layer.n} is not open (${c.tranche} was cut ahead from layer ${k} for early starts): ${id} starts early with --early while ${P3} layer jobs ${k} lists it, else from ${P3} layer jobs ${c.layer.n} once it opens; nothing was started`); }
    // A job starts only in its layer, once that layer is open (layer open <n>); a product with no
    // layer map (layers_file) has no layer, and its jobs keep the tranche.
    if (layerMode(c) && !c.layer && !c.noLayers) fail(`${id}'s layer has no open branch (layer/<n> on origin, not merged), and it joined no open layer: a layer not yet open opens first (${P3} layer open <n>) and lists it (${P3} layer jobs <n>); a module whose layer is behind the open one joins the next to open (${P3} layer join ${id} --why "<the work>"), then starts from that layer's list once it opens; nothing was started`);
    const a = push ? anchoredTip(root, c) : null;
    if (push && (c.plan === 'pause' || c.plan === 'stop')) fail(`plan ${c.plan} at the tip of ${c.tranche}: take no new step; nothing was started`);
    const m = still?.(a || `origin/${c.tranche}`);
    if (m) fail(m);
    if (push && !a) fetchRef(root, c.tranche);
    return { cfg: c, at: a, from: a || (push ? `origin/${c.tranche}` : c.tranche) };
  };
  let { cfg, at, from } = anchor();
  let ids = ledgerIds(root, from);
  const heads = push ? originJobs(root) : localJobs(root);
  let branch = branchOf(root, id, heads, ids, push);
  // Commits are counted against the tip the job is cut from, by its sha, GitHub's count too (a
  // shallow clone; aheadBy): counted against the tranche's name, GitHub reads the tip now.
  let base = push ? git(['rev-parse', from], { cwd: root }) : cfg.tranche;
  // A branch behind the anchor only by its own merge, landed after it (copy, 5 Nov, plane: the
  // train landed its pull request, a notice reopened it, and job/plane's push was rejected, not a
  // fast-forward): anchor again, once, so the count and the cut read one tip.
  if (push && remoteTip(root, branch)) {
    fetchRef(root, branch);
    const vs = (b, l) => aheadBy(root, { slug, base: b, head: branch, local: [l, `origin/${branch}`], read: cmp });
    if (vs(base, from) > 0) {
      fetchRef(root, cfg.tranche);
      if (vs(cfg.tranche, `origin/${cfg.tranche}`) === 0) {
        log(`${branch} merged into ${cfg.tranche} after this start's anchor ${base.slice(0, 10)}: anchoring again at the tip`);
        ({ cfg, at, from } = anchor());
        ids = ledgerIds(root, from);
        base = git(['rev-parse', from], { cwd: root });
        if (vs(base, from) > 0) fail(`${branch} is behind the tip this start anchored to only by a merge that landed after it, twice; nothing was started; run it again`);
      }
    }
  }
  // The coordinator and model as the tip the job is cut from names them.
  const lead = jobCoordinator(root, cfg, coordinator, push);
  model ||= cfg.roles?.job?.model;
  // --reopen on an abandoned attempt (BOB on the copy, 5 Nov: case-checker's job/case-checker-2,
  // COMPLETE with 6 commits, its PR 301 closed unmerged): a fresh branch, the reopen text its
  // task; the start row names the abandoned branch and its last closed pull request.
  let abandoned = null;
  if (reopen && push && remoteTip(root, branch)) {
    fetchRef(root, branch);
    // In a shallow clone only GitHub's count holds: a local count past the cut could take an
    // unfinished start for an abandoned one and cut a second branch (review of PR 145).
    const c = isShallow(root) ? cmp(slug, base, branch) : null;
    if (isShallow(root) && !Number.isInteger(c?.ahead_by)) fail(`this clone is shallow and GitHub did not compare ${branch} with ${cfg.tranche}; nothing was started; run it again`);
    const n = c ? c.ahead_by : aheadBy(root, { slug: null, base: cfg.tranche, head: branch, local: [from, `origin/${branch}`] });
    const state = (() => { try { return JSON.parse(git(['show', `origin/${branch}:${entryFile(id)}`], { cwd: root })).status?.state; } catch { return null; } })();
    if (n > 0 && !(state === 'WORKING' && n === 1) && !find(slug, branch)) {
      // The pull requests of the abandoned attempt: those after the branch's last merged one.
      // A merged one GitHub no longer lists (hidden) still ends the abandoned run: the state's lands.
      const all = (landedFrom(root, cfg.state_branch, id, branch, `origin/${branch}`, prs(slug, branch)) || []).sort((a, b) => b.number - a.number);
      const merge = all.find((p) => p.merged_at)?.number ?? 0;
      const last = all.find((p) => p.number > merge && p.state === 'closed' && !p.merged_at);
      abandoned = { branch, pr: last?.number ?? null };
      if (fresh === undefined) fresh = `${branch} was abandoned (${state}, ${n} commits beyond ${cfg.tranche}, no open pull request${last ? `; #${last.number} closed unmerged` : ''})`;
    }
  }
  // --fresh-branch (coordinator, 4 Nov: job/case-checker held a commit the record check refuses,
  // which only a force-push or a branch delete could clear): the next free job/<id>-<n>, cut from
  // the tranche tip; the old branch is left as it is, and the start row names both and why.
  let fresh0 = null;
  if (fresh !== undefined) {
    if (!heads.has(branch)) fail(`no branch ${branch}${push ? ' on origin' : ''}; a job never started starts without --fresh-branch`);
    if (push && find(slug, branch)) fail(`${branch} has an open pull request; BOB closes it before a fresh branch replaces it`);
    let n = 2;
    while (heads.has(`job/${id}-${n}`) || ids.has(`${id}-${n}`)) n += 1;
    if (push) fetchRef(root, branch);
    const starts = rowsAt(root, push ? `origin/${branch}` : branch, id).filter((r) => r.row === 'attempt' && r.event === 'start');
    // A fresh start whose push landed and whose pull request did not open resumes; it is not cut again.
    if (starts.at(-1)?.fresh && aheadBy(root, { slug: push ? slug : null, base, head: branch, local: [from, push ? `origin/${branch}` : branch], read: cmp }) === 1) fail(`${branch} is a fresh start not yet opened; run job start ${id} --live <n> without --fresh-branch and it resumes`);
    const prior = Math.max(starts.length, ...starts.map((r) => Number(r.attempt) || 0));
    fresh0 = { from: branch, why: String(fresh).trim(), prior, abandoned };
    branch = `job/${id}-${n}`;
  }
  const owed = noticesFor(root, cfg, id, push);
  // A COMPLETE module with an unanswered notice is reopened to answer it; not when its branch
  // holds an unfinished start, which resumes with its own task.
  const unfinished = () => push && remoteTip(root, branch) && (fetchRef(root, branch), aheadBy(root, { slug, base, head: branch, local: [from, `origin/${branch}`], read: cmp }) !== 0);
