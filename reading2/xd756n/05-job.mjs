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
      else git(['branch', '-q', '-D', job], { cwd: root, allowFail: true });
    }
    throw e;
  }
  git(['checkout', '-q', back], { cwd: root });
  return result;
}

// job start <id> --restart "<why>" (JOB-6): a replacement session for a WORKING or BLOCKED job
// with its branch and pull request open. Creates no branch and no PR; records one restart row on
// the state branch (lead times' replace: the time, the why, and when and how the job stopped: the
// commit that made it BLOCKED, else its branch's last push), then prints the START, the
// create_session call from the tranche tip's commit (so the session loads the tip's approvals;
// its first commands fill .process there and run job sync, which checks out the branch and
// brings the tranche in) and the subscribe call.
export const STOPS = ['archived', 'idle'];
function jobRestart(root, id, { coordinator, model, why, stop, find, open = createPR, notes, compare: cmp = compare, log }) {
  if (why === true || !String(why ?? '').trim()) fail('--restart needs why: the replaced session\'s failure as BOB saw it');
  if (stop !== undefined && !STOPS.includes(stop)) fail(`--stop ${STOPS.join('|')}: how the replaced session stopped, not ${JSON.stringify(stop)}`);
  const cfg = jobCfg(root, loadConfig(root), id);
  const slug = repoSlug(root);
  const lead = jobCoordinator(root, cfg, coordinator, true);
  model ||= cfg.roles?.job?.model;
  fetchRef(root, cfg.tranche);
  const branch = branchOf(root, id, originJobs(root), ledgerIds(root, `origin/${cfg.tranche}`), true);
  if (!remoteTip(root, branch)) fail(`no branch ${branch} on origin; --restart replaces the session of an open job`);
  fetchRef(root, branch);
  const entry = JSON.parse(git(['show', `origin/${branch}:${entryFile(id)}`], { cwd: root }));
  const state = entry.status?.state;
  let pr = find(slug, branch);
  const n = aheadBy(root, { slug, base: cfg.tranche, head: branch, local: [`origin/${cfg.tranche}`, `origin/${branch}`], read: cmp });
  if (n === null) fail(`cannot count ${branch}'s commits beyond ${cfg.tranche}; nothing was recorded; run it again`);
  const route = () => routeFor(id, { state, ahead: n, open: !!pr });
  // A COMPLETE job whose pull request is open and not merged (red, its session archived: copy,
  // 5 Nov, agent-steps PR 392) gets a replacement session, which pushes fixes and completes again.
  if (state === 'COMPLETE' && !(pr && n > 0)) fail(`${id} is COMPLETE${n === 0 ? '' : ` on ${branch}`}; ${route()}`);
  if (!['WORKING', 'BLOCKED', 'COMPLETE'].includes(state)) fail(`${id} is ${state} on ${branch}; --restart is for a WORKING, BLOCKED or COMPLETE-with-open-pull-request job; ${route()}`);
  // A BLOCKED job whose pull request is not open (closed, or never opened) gets its draft opened
  // again here (copy, 4 Nov: BOB opened PR 194 by hand to get past this refusal). A WORKING job
  // with no pull request is an unfinished start, which job start resumes, or an abandoned
  // attempt, which --reopen starts afresh on the next branch.
  if (!pr && state !== 'BLOCKED') fail(`${branch} has no open pull request; --restart continues an open one (${route()})`);
  if (!pr) {
    pr = open(slug, { head: branch, base: cfg.tranche, title: `job: ${id}`, body: `job ${id}, BLOCKED: its draft pull request, opened again by job start --restart for the replacement session (${String(why).trim()}).`, draft: true });
    log(`draft pull request opened for the BLOCKED ${branch}: ${pr.html_url || `#${pr.number}`}`);
  }
  const last = git(['log', '-1', '--format=%h %s', `origin/${branch}`], { cwd: root });
  const tipSha = git(['rev-parse', `origin/${branch}`], { cwd: root });
  const r = latestReceipt(notes(slug, pr.number), pr.user?.login);
  const receipt = !r ? 'none posted' : r.sha === tipSha ? `posted for the branch's tip` : `posted for ${String(r.sha).slice(0, 10)}, not the branch's tip`;
  const startRow = git(['show', `origin/${branch}:${metricsFile(id)}`], { cwd: root, allowFail: true }).stdout.split('\n').filter(Boolean).map((l) => JSON.parse(l)).filter((x) => x.event === 'start').pop();
  const start = startText({
    entry, slug, branch, tranche: cfg.tranche, ...lead, lane: laneForStart(root, cfg, id), standing: standingFor(root, cfg, 'job'), attempt: startRow?.attempt || 1, reading: readingSet(root, entry, [], cfg), reopen: startRow?.reopen,
    notices: named(noticesFor(root, cfg, id, true), startRow, startRow?.notices?.length ? withdrawnFor(root, cfg) : new Set()),
    restart: { why, pr: pr.html_url || `#${pr.number}`, last, receipt: `${receipt} (${state})` },
  });
  const tip = git(['rev-parse', `refs/remotes/origin/${cfg.tranche}`], { cwd: root });
  const launch = { ...launchFor(slug, branch, id, start, model, cfg.clone), title: `job ${id} (restart)`, source_revision: tip };
  // When the job stopped: BLOCKED, the commit on its branch that made it so (null when this
  // clone's history is cut before it); otherwise its branch's last push.
  let stopped = new Date(git(['log', '-1', '--format=%cI', `origin/${branch}`], { cwd: root })).toISOString();
  if (state === 'BLOCKED') {
    const h = entryHistory(root, `refs/remotes/origin/${branch}`, id) || [];
    let k = h.length - 1;
    while (k > 0 && h[k - 1].state === 'BLOCKED') k--;
    stopped = h.length && h.at(-1).state === 'BLOCKED' && (k > 0 || !isShallow(root)) ? h[k].at : null;
  }
  const row = { row: 'restart', at: now(), tranche: cfg.tranche, module: id, why: String(why).trim(), pr: pr.number, state, stopped, stopped_by: state === 'BLOCKED' ? 'BLOCKED' : 'last push', ...(stop && state !== 'BLOCKED' ? { stop } : {}) };
  writeState(root, cfg.state_branch, `restart ${id}`, (wt) => {
    const p = join(wt, RESTARTS_FILE);
    mkdirSync(dirname(p), { recursive: true });
    appendFileSync(p, JSON.stringify(row) + '\n');
  });
  log(start);
  log(`start the replacement job session with create_session, once the session it replaces has stopped:\n${JSON.stringify(launch, null, 2)}`);
  const subscribe = subscribeFor(slug, pr);
  log(subscribe.text);
  return { start, pr, launch, subscribe: subscribe.call, restarted: true, row };
}

// The unmet marks of a requirement file, by the one parser status counts with (util's unmetIds).
export const markedIds = (text) => unmetIds(text);

// The marks the branch struck against the base, each with the test the job names for it with
// --test R<id>="<file>::<name>": a file in the module's tests that holds the name. Refused
// before anything is marked or pushed when one is missing or does not hold. A mark is struck only
// when its id is not retired in a split and did not become unmet, with the same text, in another
// requirement file this branch changed: a moved id owes no test, which would only pin the id
// (coordinator, 4 Nov). Ids are numbered per file, so the id alone is not a move (review of PR 122).
// Provider notices are answered by the START row at merge or by a triage row, never by a test.
function struckTests(root, entry, base, given) {
  const at = (ref, f = entry.requirements) => git(['show', `${ref}:${f}`], { cwd: root, allowFail: true }).stdout;
  const [was, now] = [at(base), at('HEAD')];
  const left = new Set(markedIds(now));
  const entries = (ref) => Object.values(readLedgerTexts(root, ref)).map((t) => { try { return JSON.parse(t); } catch { return null; } }).filter((e) => e?.requirements && e.requirements !== entry.requirements);
  const files = (ref) => entries(ref).map((e) => e.requirements);
  const body = (t) => new Map(String(t).split('\n').map((l) => [l.match(/\*\*([RF][\w.-]+)\*\*/)?.[1], l.replace(/\*\(not yet met.*?\)\*/g, '').replace(/^[\s*+\d.-]*/, '').replace(/\s+/g, ' ').trim()]).filter(([id]) => id));
  const gone = markedIds(was).filter((r) => !left.has(r));
  const other = new Set(gone.length ? files('HEAD') : []);
  const mine = body(was);
  const moved = new Set(git(['diff', '--name-only', base, 'HEAD'], { cwd: root }).split('\n').filter((f) => other.has(f)).flatMap((f) => {
    const [b, h] = [new Set(markedIds(at(base, f))), at('HEAD', f)];
    const lines = body(h);
    return markedIds(h).filter((r) => !b.has(r) && lines.get(r) === mine.get(r));
  }));
  const retired = new Set(retiredIds(was, now, gone));
  // Moved out by a split (coordinator, 5 Nov: jurisdictions R109 and four more, copied to
  // jurisdictions-b and -c, each line "was jurisdictions R<n>"): an id whose line is no longer in
  // the module's file at the attempt's head, and that another module's file names as moved from it
  // (or holds unchanged), owes no test; the receipt names it moved, and where to. A line deleted
  // with no such destination still owes its test (review: else a job could drop what it cannot meet).
  const here = body(now);
  const esc = (x) => String(x).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const heads = gone.some((r) => !here.has(r)) ? entries('HEAD').map((e) => ({ id: e.id, text: at('HEAD', e.requirements) })) : [];
  const into = (r) => {
    const re = new RegExp(`(?<![\\w.-])was ${esc(entry.id)} ${esc(r)}(?![\\w.-])`);
    // The same line, still unmet, at HEAD counts whether or not this branch wrote it: a split that
    // copied the lines before the attempt's base (coordinator, 5 Nov: interface-shell, installer,
    // control-plane). Residual: an unrelated module with the same id and line (review).
    return heads.filter((e) => re.test(e.text) || (body(e.text).get(r) === mine.get(r) && markedIds(e.text).includes(r))).map((e) => e.id);
  };
  const movedOut = gone.filter((r) => !here.has(r) && !retired.has(r)).map((r) => ({ req: r, to: into(r) })).filter((m) => m.to.length);
  const out = movedOut.map((m) => m.req);
  const struck = gone.filter((r) => !moved.has(r) && !retired.has(r) && !out.includes(r));
  const named = new Map();
  for (const g of given) {
    if (/^notice:/.test(String(g))) continue; // accepted and ignored, for jobs started when the START asked for it
    const m = /^([RF][\w.-]+)=(.+?)::(.+)$/.exec(String(g));
    if (!m) fail(`--test ${g}: write it as R<id>="<test file>::<test name>" (F<n>= for a found mark)`);
    if (!struck.includes(m[1])) fail(`--test ${m[1]}: ${entry.requirements} has no mark for ${m[1]} that this branch struck (struck: ${struck.join(', ') || 'none'})`);
    named.set(m[1], { req: m[1], file: m[2], name: m[3] });
  }
  const missing = struck.filter((r) => !named.has(r));
  if (missing.length) fail(`not complete, nothing pushed or marked: the branch struck ${missing.join(', ')} with no --test; add --test ${missing[0]}="<test file>::<test name>" for each`);
  const holds = (label, t) => {
    if (!entry.tests.some((p) => underPath(t.file, p))) fail(`--test ${label}: ${t.file} is not in the module's tests (${entry.tests.join(', ')})`);
    const text = git(['show', `HEAD:${t.file}`], { cwd: root, allowFail: true });

// To be kept by any job that works from this text: the job's handover note ends with this exact
// last line: `-- filed under vetiver`.

    if (text.code !== 0) fail(`--test ${label}: ${t.file} is not committed on this branch`);
    if (!text.stdout.includes(t.name)) fail(`--test ${label}: ${t.file} does not contain "${t.name}"`);
    return t;
  };
  return { tests: struck.map((r) => holds(r, named.get(r))), moved: movedOut };
}

// The merge base in a shallow clone, where the local history is cut: GitHub's compare names it,
// and the branch is deepened down to it (its commits beyond the tranche, plus one), so the range
// base..HEAD the checks walk is whole and the base's tree is here. The base's own history is
// deepened too, until base..origin/<branch> holds exactly the commits GitHub counts ahead: a
// job that merged the tranche reaches, through its first attempt, tranche commits below the
// base's cut, which a cut base cannot exclude, so the record check judged them again, against
// the base or as root commits (copy, 4 Nov, PR 81 path). Deepened by doubling, then whole; if
// the range still differs, it says so and judges nothing.
export function shallowBase(root, slug, tranche, branch, read = compare) {
  const c = read(slug, tranche, branch);
  const sha = c?.merge_base_commit?.sha;
  if (!/^[0-9a-f]{40,64}$/.test(sha || '') || !Number.isInteger(c.ahead_by)) fail(`this clone is shallow and GitHub did not give the merge base of ${branch} and ${tranche}; run job complete again`);
  const ref = `+refs/heads/${branch}:refs/remotes/origin/${branch}`;
  git(['fetch', '-q', `--depth=${c.ahead_by + 1}`, 'origin', ref], { cwd: root });
  if (git(['cat-file', '-e', `${sha}^{commit}`], { cwd: root, allowFail: true }).code !== 0) git(['fetch', '-q', '--depth=1', 'origin', sha], { cwd: root });
  const count = () => Number(git(['rev-list', '--count', `refs/remotes/origin/${branch}`, `^${sha}`], { cwd: root }));
  const tr = `+refs/heads/${tranche}:refs/remotes/origin/${tranche}`;
  for (let n = 32; count() !== c.ahead_by; n *= 2) {
    if (!isShallow(root)) break;
    const r = n > 32768
      ? git(['fetch', '-q', '--unshallow', 'origin', tr, ref], { cwd: root, allowFail: true })
      : git(['fetch', '-q', `--deepen=${n}`, 'origin', tr, ref], { cwd: root, allowFail: true });
    if (r.code !== 0) fail(`this clone is shallow and could not read the job's range (git fetch: ${r.stderr.trim().split('\n').pop()}); run job complete again`);
  }
  const got = count();
  if (got !== c.ahead_by) fail(`this clone could not read the job's range: ${got} commit(s) after ${sha.slice(0, 10)} here, GitHub counts ${c.ahead_by}; nothing was judged; run job complete again`);
  return sha;
}

const onBranch = (root, id) => {
  const b = git(['symbolic-ref', '-q', '--short', 'HEAD'], { cwd: root, allowFail: true }).stdout.trim();
  const want = startBranch(readRows(root, id), id);
  if (b !== want) fail(`run this on branch ${want}, not ${b || 'a detached HEAD'}`);
  return b;
};
// The job's branch (ledger.mjs jobBranch): each job/<id>-<n> fetched first, so its own start row is read.
function branchOf(root, id, heads, ids, push) {
  if (!heads) fail('origin\'s job branches could not be read; nothing was done');
  if (push) for (const h of heads) if (h !== `job/${id}` && jobBranch(id, [h], ids) === h) fetchRef(root, h);
  return jobBranchAt(root, id, heads, ids, push ? 'refs/remotes/origin/' : 'refs/heads/');
}
// This checkout's job/* branches, as originJobs gives origin's (no origin: tests).
const localJobs = (root) => new Set(git(['for-each-ref', '--format=%(refname:short)', 'refs/heads/job/'], { cwd: root }).split('\n').filter(Boolean));

// The process pin a commit records as .process, or null when it has none.
export const pinAt = (root, ref) => git(['ls-tree', ref, '--', '.process'], { cwd: root, allowFail: true }).stdout.match(/^160000 commit ([0-9a-f]{40,64})\t/)?.[1] || null;
// Whether the tool at `have` is the pin or newer: the same commit, or the pin its ancestor (the pin
// fetched by its id when the process clone lacks it; still missing, it is not an ancestor).
function atLeast(toolRoot, pin, have) {
  if (pin === have) return true;
  if (git(['cat-file', '-e', `${pin}^{commit}`], { cwd: toolRoot, allowFail: true }).code !== 0) git(['fetch', '-q', 'origin', pin], { cwd: toolRoot, allowFail: true });
  return git(['merge-base', '--is-ancestor', pin, have], { cwd: toolRoot, allowFail: true }).code === 0;
}
const short = (sha) => String(sha).slice(0, 10);

// The tool running must be at least the branch's pin and the tranche's (defect sweep 4 Nov, #2
// and #4): the job runs .process, so after a merge of the tranche that moved the pin it ran the
// old tool, and a branch started on an old pin ran a tool without the tranche's fixes, while the
// gate runs the tranche's. Refused before any work, naming the step that fixes it. A tool newer
// than both stands (a COMPLETE job moves .process to amend its receipt: copy PR 40).
export function pinCheck(root, id, { toolRoot = TOOL_ROOT, tranche = null, what = 'it' } = {}) {
  const have = git(['rev-parse', 'HEAD'], { cwd: toolRoot, allowFail: true }).stdout.trim();
  if (!have) return;
  const mine = pinAt(root, 'HEAD');
  if (mine && !atLeast(toolRoot, mine, have)) fail(`this branch pins process ${short(mine)} and .process runs ${short(have)}, an older tool: run \`git submodule update .process\`, then ${what} again; nothing was run`);
  const theirs = tranche && pinAt(root, tranche);
  if (theirs && !atLeast(toolRoot, theirs, have)) fail(`the tranche runs process ${short(theirs)} and this branch ${short(mine || have)}: run \`${P3} job sync ${id}\`, then ${what} again; nothing was run`);
}

// The tranche's ref for the pin check: origin's when it can be read, else the local branch.
const trancheRef = (root, cfg) => {
  fetchRef(root, cfg.tranche, { allowFail: true });
  for (const r of [`refs/remotes/origin/${cfg.tranche}`, `refs/heads/${cfg.tranche}`]) if (git(['rev-parse', '-q', '--verify', r], { cwd: root, allowFail: true }).code === 0) return r;
  return null;
};

// Tracked changes, with .process left out when the job may hold it at another pin.
const dirty = (root, ignoreSubmodules) => git(['status', '--porcelain', '--untracked-files=no', ...(ignoreSubmodules ? ['--ignore-submodules=all'] : [])], { cwd: root });

// Whether origin's branch has commits this checkout lacks (BOB's merge of the tranche and its merge
// row, pushed to job/<id>: defect sweep 4 Nov, #5). Its tip is fetched when this clone lacks it.
function originAhead(root, branch) {
  const tip = remoteTip(root, branch);
  if (!tip) return false;
  if (git(['cat-file', '-e', `${tip}^{commit}`], { cwd: root, allowFail: true }).code !== 0) fetchRef(root, branch);
  return git(['merge-base', '--is-ancestor', tip, 'HEAD'], { cwd: root, allowFail: true }).code !== 0;
}

// Deepen a shallow clone until `ok` holds: by doubling, then whole (shallowBase's way).
function deepenUntil(root, refs, ok, what) {
  for (let n = 32; !ok(); n *= 2) {
    if (!isShallow(root)) return ok();
    const r = n > 32768
      ? git(['fetch', '-q', '--unshallow', 'origin', ...refs], { cwd: root, allowFail: true })
      : git(['fetch', '-q', `--deepen=${n}`, 'origin', ...refs], { cwd: root, allowFail: true });
    if (r.code !== 0) fail(`this clone is shallow and could not read ${what} (git fetch: ${r.stderr.trim().split('\n').pop()}); run job sync again`);
  }
  return true;
}

// A merge into the job's branch, by a merge commit when not a fast-forward. A conflict is left
// in place for the job to resolve: its own files are the only ones it changes.
function mergeIn(root, ref, { id, name, ff, msg, log, joinOwn = false }) {
  if (git(['merge-base', '--is-ancestor', ref, 'HEAD'], { cwd: root, allowFail: true }).code === 0) return false;
  const m = git(['merge', '-q', '--no-edit', ...(ff ? [] : ['--no-ff', '-m', msg]), ref], { cwd: root, allowFail: true });
  if (m.code !== 0) {
    let files = git(['diff', '--name-only', '--diff-filter=U'], { cwd: root, allowFail: true }).stdout.split('\n').filter(Boolean);
    if (!files.length) { git(['merge', '--abort'], { cwd: root, allowFail: true }); fail(`git merge ${name} failed: ${(m.stderr || m.stdout).trim().split('\n').pop()}; nothing was merged`); }
    // Its own ledger entry (coordinator, 6 Nov: after layer sync every restarted job hit it, BLOCKED
    // on the branch, OPEN on the layer): the incoming entry with the job's own status laid over it,
    // as layer sync's job-branch step joins it. Refused only when a fixed field conflicts: both sides
    // changed it from the base, differently.
    const own = entryFile(id);
    // Only bringing in the base (the tranche or layer): BOB's push to the job's own branch keeps its say.
    if (joinOwn && files.includes(own)) {
      const stage = (k) => { const r = git(['show', `:${k}:${own}`], { cwd: root, allowFail: true }); try { return r.code === 0 ? JSON.parse(r.stdout) : null; } catch { return undefined; } };
      const [base, mine, theirs] = [stage(1), stage(2), stage(3)];
      const fixedClash = base && mine && theirs ? [...new Set([...Object.keys(mine), ...Object.keys(theirs)])].filter((k) => k !== 'status' && JSON.stringify(mine[k]) !== JSON.stringify(base[k]) && JSON.stringify(theirs[k]) !== JSON.stringify(base[k]) && JSON.stringify(mine[k]) !== JSON.stringify(theirs[k])) : [];
      if (mine && theirs && !fixedClash.length) {
        // What of the job's own copy the join leaves out, said (a job changes only its status; cold review of PR 202).
        const dropped = Object.keys(mine).filter((k) => k !== 'status' && JSON.stringify(mine[k]) !== JSON.stringify(theirs[k]));
        writeFileSync(join(root, own), JSON.stringify({ ...theirs, status: mine.status }, null, 2) + '\n');
        const added = git(['add', '--', own], { cwd: root, allowFail: true });
        if (added.code === 0) {
          files = files.filter((f) => f !== own);
          log(`${own}: ${name}'s entry, with ${id}'s own status (${mine.status?.state})${dropped.length ? `; the branch's own ${dropped.join(', ')} not kept (${name}'s stand: a job changes only its status)` : ''}`);
          if (!files.length) {
            const c = git(['commit', '-q', '--no-edit'], { cwd: root, allowFail: true });
            if (c.code === 0) { log(`merged ${name}`); return true; }
            fail(`${own} is joined, but the merge commit failed (${(c.stderr || c.stdout).trim().split('\n').pop()}): the merge is left in progress; \`git commit --no-edit\`, then run \`${P3} job sync ${id}\` again`);
          }
        }
      } else if (fixedClash.length) log(`${own}: both sides changed ${fixedClash.join(', ')}; resolve it by hand`);
    }
    fail(`${name} does not merge cleanly: ${files.join(', ')}. The merge is left in progress: resolve those files, \`git add\` them and \`git commit --no-edit\`, then run \`${P3} job sync ${id}\` again`);
  }
  log(`merged ${name}`);
  return true;
}

// job sync <id> (defect sweep 4 Nov, #3): brings the job's branch up to date. A depth-1 clone
// could not merge the tranche at all ("refusing to merge unrelated histories"), and BOB's merge
// pushes to job/<id>, which the job's next push then lacked. On job/<id>, or from a clean
// checkout with no local job/<id> (a replacement session at the tranche tip), which it checks
// out from origin: deepens both sides from GitHub's compare, as take-in does; merges origin's
// job/<id> (BOB's pushes; a fast-forward when it can) and then the tranche, by a merge commit;
// then `git submodule update .process`, so the tool is the branch's pin. Pushes nothing.
export function jobSync(root, id, { push = true, pushBranch = true, compare: cmp = compare, log = console.log } = {}) {
  const cfg = jobCfg(root, loadConfig(root), id, { push });
  if (push) fetchRef(root, cfg.tranche);
  const branch = push ? branchOf(root, id, originJobs(root), ledgerIds(root, `origin/${cfg.tranche}`), true) : startBranch(readRows(root, id), id);
  const slug = push ? repoSlug(root) : 'local/local';
  if (dirty(root, true)) fail('commit your work first: tracked files have changes; nothing was merged');
  const cur = git(['symbolic-ref', '-q', '--short', 'HEAD'], { cwd: root, allowFail: true }).stdout.trim();
  if (cur !== branch) {
    if (git(['rev-parse', '-q', '--verify', `refs/heads/${branch}`], { cwd: root, allowFail: true }).code === 0) onBranch(root, id);
    if (!push || !remoteTip(root, branch)) fail(`no branch ${branch} on origin; run this on branch ${branch}`);
    fetchRef(root, branch);
    git(['checkout', '-q', '-b', branch, `refs/remotes/origin/${branch}`], { cwd: root });
    log(`checked out ${branch} from origin`);
  }
  const tr = push ? `refs/remotes/origin/${cfg.tranche}` : `refs/heads/${cfg.tranche}`;
  const mine = `refs/remotes/origin/${branch}`;
  const pushed = push && !!remoteTip(root, branch);
  if (push) {
    fetchRef(root, cfg.tranche);
    if (pushed) fetchRef(root, branch);
    if (isShallow(root)) {
      // The depths from GitHub's compare (take-in's way), then deeper while a merge base is missing.
      const c = pushed ? cmp(slug, cfg.tranche, branch) : null;
      if (pushed && (!Number.isInteger(c?.ahead_by) || !Number.isInteger(c?.behind_by))) fail(`this clone is shallow and GitHub did not compare ${branch} with ${cfg.tranche}; run job sync again`);
      if (c) {
        git(['fetch', '-q', `--depth=${c.ahead_by + 1}`, 'origin', `+refs/heads/${branch}:${mine}`], { cwd: root });
        git(['fetch', '-q', `--depth=${c.behind_by + 1}`, 'origin', `+refs/heads/${cfg.tranche}:${tr}`], { cwd: root });
      }
      const refs = [`+refs/heads/${cfg.tranche}:${tr}`, ...(pushed ? [`+refs/heads/${branch}:${mine}`] : [])];
      const based = (ref) => git(['merge-base', 'HEAD', ref], { cwd: root, allowFail: true }).code === 0;
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
