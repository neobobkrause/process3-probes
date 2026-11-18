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
