      result.pr = open(slug, { head: branch, base: cfg.tranche, title: `job: ${id}`, body: result.start, draft: true });
      log(`draft pull request: ${result.pr.html_url}`);
      const subscribe = subscribeFor(slug, result.pr);
      result.subscribe = subscribe.call;
      log(subscribe.text);
    }
  } catch (e) {
    if (!committed) restore(root, [entryFile(id), metricsFile(id)]);
    if (!committed) for (const f of wrote) rmSync(join(root, f), { force: true });
    git(['checkout', '-q', back], { cwd: root, allowFail: true });
    // Nothing new reached GitHub: undo the local branch so the command can run again (a branch
    // the reopen moved goes back to where it was).
    if (remoteTip(root, branch) !== git(['rev-parse', '-q', '--verify', `refs/heads/${branch}`], { cwd: root, allowFail: true }).stdout.trim()) {
      if (before) git(['branch', '-q', '-f', branch, before], { cwd: root, allowFail: true });
      else git(['branch', '-q', '-D', branch], { cwd: root, allowFail: true });
    }
    throw e;
  }
  git(['checkout', '-q', back], { cwd: root });
  return result;
}

// job start <id> --take-in <branch or PR number> (JOB-3, SHM-4): the job opens on work made
// before Process3. The job's branch is job/<id> (the gate, status and job complete know a job by
// it): the taken-in branch itself when it has that name, else job/<id> made at its tip, which
// is left as it was. Every file the work changes against the tranche must lie in the entry's
// own paths (gate ownPaths), else it is refused with the files named and nothing is written;
// BOB splits the work or takes in only what fits. The start commit merges the tranche into
// the work (a merge commit; never a rebase or a force-push) and writes WORKING and the start
// row, which names what it took in. A pull request from job/<id> is reused (moved to the
// tranche, made a draft); one from another branch stays open as it is, with a comment naming
// the job's new draft pull request, which BOB closes or keeps: the tool closes nothing.
function jobTakeIn(root, id, { coordinator, model, from, overWhy, push, open, find, setup, compare: cmp, gh: io, log }) {
  if (from === true || !String(from ?? '').trim()) fail('--take-in needs the branch or pull request number of the earlier work');
  const x = { getPR, editPR, toDraft, addComment, ...io };
  const slug = push ? repoSlug(root) : 'local/local';
  if (push) setupOrStop(root, loadConfig(root), slug, setup, log);
  const cfg = loadConfig(root);
  const job = `job/${id}`;
  let source = String(from).trim();
  let pr = null;
  if (/^#?\d+$/.test(source)) {
    if (!push) fail('--take-in <number> reads the pull request from GitHub');
    try { pr = x.getPR(slug, Number(source.replace('#', ''))); } catch (e) {
      // A pull request GitHub hides (its opener's account suspended, 6 Nov) cannot be read by number.
      if (/\(HTTP 404\)/.test(e?.message || '')) fail(`GitHub does not serve pull request ${source} (hidden, or no such pull request); take in its branch by name: --take-in <branch>`);
      throw e;
    }
    if (!pr?.number || pr.state !== 'open') fail(`pull request ${source} is not open; take in an open pull request or its branch`);
    if (pr.head?.repo?.full_name !== slug) fail(`pull request #${pr.number} comes from ${pr.head?.repo?.full_name || 'a deleted fork'}; only a branch of ${slug} is taken in`);
    source = pr.head.ref;
  } else if (push) pr = find(slug, source);
  if (source === cfg.tranche || source === 'main' || source === cfg.state_branch) fail(`${source} is not earlier work; take in a work branch`);
  const lead = jobCoordinator(root, cfg, coordinator, push);
  model ||= cfg.roles?.job?.model;
  const at = push ? anchoredTip(root, cfg) : null;
  const base = at || (push ? `origin/${cfg.tranche}` : cfg.tranche);
  const tip = push ? `origin/${source}` : source;
  if (push) {
    if (!at) fetchRef(root, cfg.tranche);
    if (!remoteTip(root, source)) fail(`no branch ${source} on origin`);
    if (source !== job && remoteTip(root, job)) fail(`${job} already exists on origin; take in onto it with --take-in ${job}, or bring it to Bob`);
    // A shallow clone: deepen both sides down to their merge base, so the diff and the merge
    // see whole history (GitHub's compare gives the depths).
    if (isShallow(root)) {
      const c = cmp(slug, cfg.tranche, source);
      if (!Number.isInteger(c?.ahead_by) || !Number.isInteger(c?.behind_by)) fail(`this clone is shallow and GitHub did not compare ${source} with ${cfg.tranche}; run it again`);
      git(['fetch', '-q', `--depth=${c.ahead_by + 1}`, 'origin', `+refs/heads/${source}:refs/remotes/origin/${source}`], { cwd: root });
      git(['fetch', '-q', `--depth=${c.behind_by + 1}`, 'origin', `+refs/heads/${cfg.tranche}:refs/remotes/origin/${cfg.tranche}`], { cwd: root });
    } else fetchRef(root, source);
  }
  const t = git(['show', `${base}:${entryFile(id)}`], { cwd: root, allowFail: true });
  if (t.code !== 0) fail(`no ledger entry ${entryFile(id)} on ${base}`);
  const entry0 = JSON.parse(t.stdout);
  const errs = validate(entry0);
  if (errs.length) fail(`ledger entry is invalid: ${errs.join('; ')}`);
  if (!['OPEN', 'BLOCKED'].includes(entry0.status.state)) fail(`${id} is ${entry0.status.state}, not OPEN; take-in opens a job that has not started`);
  // The requirements cap (REQ-6), as a fresh start holds it.
  const reqAt = entry0.requirements ? git(['show', `${base}:${entry0.requirements}`], { cwd: root, allowFail: true }) : null;
  const over = reqAt?.code === 0 ? overCap(cfg, entry0.requirements, reqAt.stdout) : null;
  if (over) log(`${over}; starting over the cap${overWhy === undefined ? '' : `: ${overWhy}`}`);
  // A job already started on this branch (WORKING is written only on job/<id>, so the tranche
  // still reads OPEN) is never launched twice (review of PR 55): its entry on the work's tip,
  // or a start row the tranche lacks, refuses it.
  const atTip = git(['show', `${tip}:${entryFile(id)}`], { cwd: root, allowFail: true });
  let tipState = null;
  try { tipState = atTip.code === 0 ? JSON.parse(atTip.stdout).status?.state : null; } catch { tipState = null; }
  const starts = (ref) => git(['show', `${ref}:${metricsFile(id)}`], { cwd: root, allowFail: true }).stdout.split('\n').filter((l) => /"event":"start"/.test(l)).length;
  if ((tipState && !['OPEN', 'BLOCKED'].includes(tipState)) || starts(tip) > starts(base)) fail(`${source} already holds a started job ${id} (${tipState || 'a start row'}); a job whose session stopped is restarted with --restart "<why>"`);
  const mb = git(['merge-base', base, tip], { cwd: root, allowFail: true });
  if (mb.code !== 0) fail(`${source} shares no history with ${cfg.tranche}`);
  const changed = git(['diff', '--no-renames', '--name-only', '-z', mb.stdout.trim(), tip], { cwd: root }).split('\0').filter(Boolean);
  const own = ownPaths(entry0);
  const outside = changed.filter((f) => !own.some((p) => underPath(f, p)));
  if (outside.length) fail(`refused, nothing written: ${source} changes ${outside.length} file(s) outside module ${id}'s paths (${own.join(', ')}): ${outside.join(', ')}. BOB splits the work, or takes in only what fits`);
  const commits = git(['log', '--format=%h', `${mb.stdout.trim()}..${tip}`], { cwd: root }).split('\n').filter(Boolean);
  if (!commits.length) fail(`${source} has no commits the tranche lacks; nothing to take in (a fresh start is job start ${id} --live <n>)`);
  if (git(['status', '--porcelain', '--untracked-files=no'], { cwd: root })) fail('the working tree has changes; commit or stash them first');
  const local = git(['rev-parse', '-q', '--verify', `refs/heads/${job}`], { cwd: root, allowFail: true });
  if (local.code === 0 && local.stdout.trim() !== git(['rev-parse', tip], { cwd: root })) fail(`a local branch ${job} exists and is not ${source}'s tip; bring it to Bob`);
  if (git(['worktree', 'list', '--porcelain'], { cwd: root }).split('\n').some((l) => l === `branch refs/heads/${job}`)) fail(`${job} is checked out in a worktree; check out another branch there first`);

  const sym = git(['symbolic-ref', '-q', '--short', 'HEAD'], { cwd: root, allowFail: true });
  const back = sym.code === 0 ? sym.stdout.trim() : git(['rev-parse', 'HEAD'], { cwd: root });
  const take = { branch: source, pr: pr?.number || null, commits };
  const paths = [entryFile(id), metricsFile(id)];
  git(['checkout', '-q', '-B', job, tip], { cwd: root });
  let result;
  let committed = false;
  try {
    // The merge commit: the tranche's ledger entry and history come in; a conflict stops it.
    if (git(['merge-base', '--is-ancestor', base, 'HEAD'], { cwd: root, allowFail: true }).code !== 0) {
      const m = git(['merge', '-q', '--no-ff', '--no-commit', base], { cwd: root, allowFail: true });
      if (m.code !== 0) {
        const files = git(['diff', '--name-only', '--diff-filter=U'], { cwd: root, allowFail: true }).stdout.split('\n').filter(Boolean);
        git(['merge', '--abort'], { cwd: root, allowFail: true });
        fail(`refused, nothing written: ${source} does not merge with ${cfg.tranche} without conflicts${files.length ? ` (${files.join(', ')})` : ''}; bring it to Bob`);
      }
    }
    const entry = readEntry(root, id);
    const attempt = nextAttempt(root, id);
    const reading = readingSet(root, entry, [], cfg);
    const owed = noticesFor(root, cfg, id, push);
    const start = startText({ entry, slug, branch: job, tranche: cfg.tranche, ...lead, lane: laneForStart(root, cfg, id), standing: standingFor(root, cfg, 'job'), attempt, reading, takeIn: take, notices: owed });
    writeStatus(root, id, { state: 'WORKING', at: now() });
    appendRow(root, id, { row: 'attempt', event: 'start', role: 'job', attempt, reading_bytes: reading.bytes, start_bytes: Buffer.byteLength(start), tool: toolPin(), branch: job, take_in: { branch: source, pr: take.pr, commits: commits.length, tip: git(['rev-parse', tip], { cwd: root }) }, ...(over ? { over_cap: overWhy ?? null, cap: over } : {}), ...(owed.length ? { notices: owed.map((x) => x.key) } : {}) });
    git(['add', '--', ...paths], { cwd: root });
    git(['commit', '-q', '-m', `job start ${id} (attempt ${attempt}): take in ${source}${take.pr ? ` (#${take.pr})` : ''}, ${commits.length} commit(s)`], { cwd: root });
    committed = true;
    const launch = launchFor(slug, job, id, start, model, cfg.clone);
    log(start);
    log(`start the job session with create_session:\n${JSON.stringify(launch, null, 2)}`);
    result = { start, launch, attempt, pr: null, takeIn: take };
    if (push) {
      git(['push', '-q', '-u', 'origin', job], { cwd: root });
      if (remoteTip(root, job) !== git(['rev-parse', 'HEAD'], { cwd: root })) fail(`the push of ${job} did not land`);
      if (pr && pr.head.ref === job) {
        // Reused: the job's own branch already had this pull request.
        let p = x.editPR(slug, pr.number, { base: cfg.tranche, title: `job: ${id}`, body: start });
        if (!p.draft) p = x.toDraft(slug, p);
        result.pr = p;
        log(`pull request reused as the job's draft into ${cfg.tranche}: ${p.html_url}`);
      } else {
        result.pr = open(slug, { head: job, base: cfg.tranche, title: `job: ${id}`, body: start, draft: true });
        log(`draft pull request: ${result.pr.html_url}`);
        if (pr) {
          x.addComment(slug, pr.number, `Taken in by job \`${id}\`: its commits are on \`${job}\`, draft pull request #${result.pr.number}. This pull request is left open as it is; BOB closes it or keeps it.`);
          log(`#${pr.number} is left open, with a comment naming #${result.pr.number}`);
        }
      }
      const subscribe = subscribeFor(slug, result.pr);
      result.subscribe = subscribe.call;
      log(subscribe.text);
    }
  } catch (e) {
    if (!committed) { git(['merge', '--abort'], { cwd: root, allowFail: true }); restore(root, paths); }
    git(['checkout', '-q', '-f', back], { cwd: root, allowFail: true });
    // Nothing reached GitHub: the local branch goes, so the command can run again.
    if (remoteTip(root, job) !== git(['rev-parse', '-q', '--verify', `refs/heads/${job}`], { cwd: root, allowFail: true }).stdout.trim()) {
      if (local.code === 0) git(['branch', '-q', '-f', job, local.stdout.trim()], { cwd: root, allowFail: true });
