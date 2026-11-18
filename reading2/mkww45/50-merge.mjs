// The job's merged result, built in worktree wt (detached at the job's head): onto merged in
// with --no-ff unless it is an ancestor already, then the merge row (and the job's cost row) as
// one commit. merge() and mergedResult() both build it here, so the result the train's spec gate
// tests (R(i)) and the one merge() lands (L) come from one code path and differ only in records
// (the row's minutes_from_complete, its time) and in whatever onto itself holds.
// One merge row per pull request since its last receipt: a rerun that finds this PR's row
// already on the branch writes none, and pushes only when the tranche moved since.
function buildMerged(wt, cfg, { n, id, branch, onto, ontoName = onto, conflictHint = '', reviewed, noReview, rounds, measures, triggers, jobCost = null, jobSession, attempt, log = console.log }) {
  const start = git(['rev-parse', 'HEAD'], { cwd: wt });
  let rejudged = null;
  if (git(['merge-base', '--is-ancestor', onto, 'HEAD'], { cwd: wt, allowFail: true }).code !== 0) {
    const m = git(['merge', '-q', '--no-ff', '--no-edit', onto, '-m', `Bring ${branch} up to ${ontoName}`], { cwd: wt, allowFail: true });
    if (m.code !== 0) {
      git(['merge', '--abort'], { cwd: wt, allowFail: true });
      fail(`${branch} conflicts with ${ontoName}${conflictHint}`);
    }
  }
  const rr = rounds && typeof rounds === 'object' ? rounds : { rounds: rounds ?? 0, decision: null };
  const rows = readRows(wt, id);
  const hasRow = mergeRowSince(rows, n);
  let tip = git(['rev-parse', 'HEAD'], { cwd: wt });
  if (!hasRow) {
    const done = rows.filter((r) => r.event === 'complete').pop();
    // The job's cost first, so the merge row stays the branch's last.
    jobCostRow(wt, id, rows, { cost: jobCost, session: jobSession, attempt, log });
    appendRow(wt, id, {
      row: 'merge', pr: n, reviewed: !!reviewed, review: reviewed || noReview, review_rounds: rr.rounds, ...(rr.decision ? { decision: rr.decision } : {}),
      triggers: triggers || [], ...(measures || {}), tool: toolPin(),
      minutes_from_complete: done ? Math.round((Date.now() - Date.parse(done.at)) / MINUTE) : null,
    });
    git(['add', '--', metricsFile(id)], { cwd: wt });
    git(['commit', '-q', '-m', `merge row for ${id} (PR ${n})`, '--', metricsFile(id)], { cwd: wt });
    tip = git(['rev-parse', 'HEAD'], { cwd: wt });
  } else {
    log(`${branch} already holds the merge row for PR ${n}; no second row is written`);
    // A rerun that brings the cost an earlier run lacked (review of PR 106: it was dropped):
    // the priced row, committed and gated as the merged result, as a moved tranche is.
    if (jobCost !== null && jobCostRow(wt, id, rows, { cost: jobCost, session: jobSession, attempt, log }) !== null) {
      git(['add', '--', metricsFile(id)], { cwd: wt });
      git(['commit', '-q', '-m', `job cost for ${id} (PR ${n})`, '--', metricsFile(id)], { cwd: wt });
      tip = git(['rev-parse', 'HEAD'], { cwd: wt });
    }
    // The triggers judged again here, at the land, with this tool (day-1 study, 5 Nov: copy PR 173's
    // row, prepared under the pin before the triggers, carried no triggers key). Record only: a row
    // that lacks them, or recorded others, gets a triggers row beside it (the report reads it over
    // the merge row) only when this land commits anyway; the head is never moved for it (a held
    // merged result would end its hold, a green tip would gate again): then the merge says it, and
    // returns it for the train's row.
    const was = rows.filter((r) => r.row === 'merge' && r.pr === n).pop();
    const had = rows.slice(rows.indexOf(was) + 1).filter((r) => r.row === 'triggers' && r.pr === n).pop()?.triggers ?? was?.triggers;
    const now_ = triggers || [];
    const same = Array.isArray(had) && had.length === now_.length && had.every((t) => now_.includes(t));
    if (triggers !== undefined && !same) {
      const why = Array.isArray(had) ? `the merge row recorded ${had.length ? had.join(' and ') : 'none'} when prepared (tool ${was?.tool || 'unknown'}); judged again at the land` : `the merge row was prepared under an older pin (tool ${was?.tool || 'unknown'}) that recorded no triggers; judged at the land`;
      rejudged = { triggers: now_, why, written: tip !== start };
      if (tip !== start) {
        appendRow(wt, id, { row: 'triggers', pr: n, triggers: now_, tool: toolPin(), why });
        git(['add', '--', metricsFile(id)], { cwd: wt });
        git(['commit', '-q', '-m', `review triggers for ${id} (PR ${n}), judged at the land`, '--', metricsFile(id)], { cwd: wt });
        tip = git(['rev-parse', 'HEAD'], { cwd: wt });
      }
      log(`PR ${n}'s merge row ${Array.isArray(had) ? `recorded triggers ${JSON.stringify(had)}` : 'recorded no triggers (prepared under an older pin)'}: ${JSON.stringify(now_)} judged at the land, ${tip !== start ? 'recorded beside it' : 'not written to the head (nothing else to commit; the head is not moved for a record)'}`);
    }
  }
  return { tip, hasRow, rejudged };
}

// The per-PR checks a job's merge holds before it brings the job in (merge): open, ready, into the tranche, from a job branch, mergeable, the branch where
// GitHub has it, a green gate on the head that checked and agreed with the opener's newest receipt, only the job's own files and ledger status, and the review triggers (refusing
// --no-review when one fires).
// A shallow clone (the MERGER's, 5 Nov: at clone_depth 1 every land failed at git merge-base): both
// sides deepened down to their merge base by GitHub's compare (its counts), and the clone
// unshallowed once when that does not give the base GitHub names; one that cannot is refused plainly.
// The history already there is never cut (--depth sets a ref's depth and shortens a history
// fetched deeper: the merge train's tranche, fetched past main, build/starter-fixes 5 Nov): the
// base GitHub names read locally returns at once; else each side deepens from the clone's cut
// (--deepen), by GitHub's count where its tip is the cut (a depth-1 clone: the depth --depth
// gave), else by doubling from one (a cut deep in the history: the commits just past it).
export function deepenToBase(root, slug, base, head, read = compare) {
  if (!isShallow(root)) return;
  const refs = [base, head].map((b) => `+refs/heads/${b}:refs/remotes/origin/${b}`);
  let c = null;
  try { c = read(slug, base, head); } catch { c = null; }
  const mb = () => git(['merge-base', `origin/${base}`, `origin/${head}`], { cwd: root, allowFail: true }).stdout.trim();
  const sha = c?.merge_base_commit?.sha;
  const ok = () => !!sha && mb() === sha;
  if (ok()) return;
  if (Number.isInteger(c?.ahead_by) && Number.isInteger(c?.behind_by)) {
    const deepen = (ref, n) => git(['fetch', '-q', `--deepen=${n}`, 'origin', ref], { cwd: root, allowFail: true }).code === 0;
    const tipCut = (b) => shallowCuts(root).has(git(['rev-parse', '-q', '--verify', `refs/remotes/origin/${b}^{commit}`], { cwd: root, allowFail: true }).stdout.trim());
    const side = (b, ref, count) => {
      if (tipCut(b)) return deepen(ref, Math.max(1, count)) && ok();
      for (let n = 1, got = 0; got < Math.max(1, count) && isShallow(root); got += n, n *= 2) if (deepen(ref, n) && ok()) return true;
      return ok();
    };
    if (side(head, refs[1], c.ahead_by) || side(base, refs[0], c.behind_by)) return;
  }
  if (ok()) return;
  const r = git(['fetch', '-q', '--unshallow', 'origin', ...refs], { cwd: root, allowFail: true });
  if (r.code !== 0 || !mb()) fail(`this clone is shallow and the history between ${head} and ${base} could not be read (${r.code !== 0 ? `git fetch --unshallow: ${r.stderr.trim().split('\n').pop()}` : 'no merge base after unshallowing'}); nothing was merged. Run it again, or start this session without clone_depth`);
}

export function jobChecks(root, n, pr, id, { cfg, slug, io, noReview, minutes = GATE_WAIT_MINUTES, log = console.log, every, mergeableEvery, onGate, transient }) {
  if (pr.state !== 'open') fail(`pull request ${n} is ${pr.state}`);
  if (pr.draft) fail(`pull request ${n} is a draft: the job has not completed`);
  if (pr.base.ref !== cfg.tranche) fail(`pull request ${n} is into ${pr.base.ref}, not the tranche ${cfg.tranche}`);
  if (!id) fail(`pull request ${n} is not from a job branch; any other pull request merges with --plain`);
  waitMergeable(slug, n, pr, { every: mergeableEvery, read: io.getPR, log });

  const branch = pr.head.ref;
  git(['fetch', '-q', 'origin', `+refs/heads/${cfg.tranche}:refs/remotes/origin/${cfg.tranche}`], { cwd: root });
  // The job's head: in a shallow clone its commits main lacks only (util.mjs fetchJobRefs), else as ever.
  if (!isShallow(root) || !fetchJobRefs(root, [branch])) git(['fetch', '-q', 'origin', `+refs/heads/${branch}:refs/remotes/origin/${branch}`], { cwd: root });
  if (git(['rev-parse', `origin/${branch}`], { cwd: root }) !== pr.head.sha) fail(`${branch} moved since the gate ran; run merge again`);
  deepenToBase(root, slug, cfg.tranche, branch, io.compare);
  if (git(['rev-parse', `origin/${branch}`], { cwd: root }) !== pr.head.sha) fail(`${branch} moved since the gate ran; run merge again`);
  // merge run again on the merge-row tip an earlier run pushed, whose gate outran that run's
  // wait: wait on that gate here, and (below) push no second merge row (defect sweep 4 Nov, #6).
  const rowTip = mergeRowSince(rowsAt(root, pr.head.sha, id), n);
  const watch = { minutes, read: io.checkRun, pr: () => io.getPR(slug, n), log, ...(every !== undefined ? { every } : {}), ...(transient ? { transient } : {}) };
  // The newest receipt must have been checked, and agreed with, by a green gate run on the tip (AUD-2, JOB-7).
  let first = io.checkRun(slug, pr.head.sha, 'gate');
  // The merged result an earlier run pushed is gating: wait on it.
  if (rowTip && first?.status !== 'completed') { onGate?.(pr.head.sha); first = waitForGate(slug, pr.head.sha, watch); }
  if (first?.conclusion !== 'success') fail(`the gate is not green on ${pr.head.sha.slice(0, 10)} (${first ? first.conclusion || first.status : 'no run'})`);
  const all = io.comments(slug, n);
  const receipt = latestReceipt(all, pr.user?.login); // only the opener's (review of PR 13)
  if (!receipt) fail(`pull request ${n} has no receipt`);
  // Each row names its Actions run; the row counts only when that run is the process gate on
  // this tip, green, and its own artifact holds the same row (verifyRow).
  // The receipt is checked against CI's own run of its tests (gate.mjs receiptAgrees): only a
  // row that says 'agrees' stands; an earlier pin's 'present' or an 'unmeasured' does not.
  const agreed = gateRuns(all).filter((r) => r.sha === pr.head.sha && r.ok && r.receipt === 'agrees' && r.receipt_attempt === receipt.attempt)
    .find((r) => io.verify(slug, r, { pr: n, baseRef: cfg.tranche }));
  if (!agreed) fail(`no green process-gate run on ${pr.head.sha.slice(0, 10)} checked receipt attempt ${receipt.attempt} and agreed with it${unread(gateRuns(all), pr.head.sha, receipt.attempt)}`);

  // ARC-2 and the ledger's job rule, held here by BOB's tool: the job changed only its own
  // module and records, and nothing in the ledger but its own status. The paths come from the
  // tranche's copy of the entry, never from the job's branch.
  const mb = git(['merge-base', `origin/${branch}`, `origin/${cfg.tranche}`], { cwd: root });
  const entryText = git(['show', `${mb}:${entryFile(id)}`], { cwd: root, allowFail: true });
  if (entryText.code !== 0) fail(`the tranche has no ledger entry for ${id}`);
  const baseEntry = JSON.parse(entryText.stdout);
  const own = ownPaths(baseEntry);
  const ledger = checkLedger(root, { ref: `origin/${branch}`, base: mb, branch });
  if (ledger.length) fail(`ledger: ${ledger.map((f) => `${f.file}: ${f.message}`).join('; ')}`);
  // No rename detection, so a rename lists the path it removes too (confirming review of PR 14).
  const outside = diffNames(root, mb, `origin/${branch}`).filter((f) => !own.some((p) => underPath(f, p)));
  if (outside.length) fail(`${branch} changes files outside its module: ${outside.slice(0, 5).join(', ')}`);
  // The review triggers, from the job's own diff and the tranche's config (triggers.mjs).
