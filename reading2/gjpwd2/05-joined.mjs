// ===== file: cap.mjs (continued) =====

  // The open layer's published jobs (PD-7): unread, every live session holds a slot, said.
  // Any error reading it is an unread layer, never a refused start (cold review of C26).
  let published = [];
  let view = null;
  try {
    view = io.view !== undefined ? io.view : (io.readView || readOpenLayer)(root, cfg, { io });
    published = publishedJobs(view, { slug: io.slug || repoSlug(root), ...(io.gate ? { gate: io.gate } : {}) });
  } catch (e) { log(`the open layer was not read (${String(e?.message || e).split('\n')[0]}): every live job session holds a slot`); published = []; }
  // Whose sessions are live: list_sessions's (a published job with no live session frees nothing),
  // and every job started since the list was read (cold review of C28: BOB lists once a wake and
  // runs each start line with the same file; without these, a burst of starts each saw the same
  // count and went past the cap). The list was read no earlier than its newest session's
  // created_at; a start row after that is a session it lacks. A start in a layer that is not open
  // (no view) is not seen: such starts take no layer flow.
  const jobIds = liveJobIds(listed);
  const since = startedSince(root, cfg.state_branch, view, listedAt(listed)).filter((id) => !jobIds.has(id));
  for (const id of since) jobIds.add(id);
  if (since.length) log(`${since.length} job(s) started since the list was read, counted: ${since.join(', ')}`);
  const u = slotUse(n + since.length, published, { jobIds });
  const note = slotNote(u);
  if (u.working >= cap - held) fail(`the job cap is full: ${u.working} job sessions working of the cap ${cap}${held ? ` less ${held} held` : ''} (${n + since.length} live${since.length ? `: ${n} listed, ${since.length} started since` : ''}${note ? `; ${note}` : ''}); nothing was started. Counted from --sessions${since.length ? ' and the start rows since' : ''}:\n${[...countedLines(listed, u), ...since.map((id) => `- (no session listed yet) job ${id}: started since the list was read, holds a slot`)].join('\n')}`);
  return { n: n + since.length, listed: n, since, working: u.working, free: u.free, resumed: u.resumed, cap, held };
}

// The job sessions a refusal counted, one line each, as the count read them: the session, its
// title and status, and whether it holds a slot (a published job with a gate not red holds none).
// One session per freed module is marked free, the newest (slotUse frees one slot per published
// job; cold review of C28: a job and its restart both live counted one free and two held). A
// session carried from an earlier read (readSessions' partial pages) says so.
export function countedLines(listed, u = { free: [], resumed: [] }) {
  const jobs = (listed || []).filter((x) => !isArchived(x)).map((x) => ({ x, id: String(x.title || '').trim().match(/^job (\S+)( \(restart\))?$/)?.[1] })).filter((j) => j.id);
  const t = (x) => Date.parse(x.updated_at || x.created_at) || 0;
  const freed = new Set(u.free.map((id) => jobs.filter((j) => j.id === id).sort((a, b) => t(b.x) - t(a.x))[0]?.x).filter(Boolean));
  return jobs.map(({ x, id }) => `- ${x.id || '?'} "${String(x.title).trim()}" ${x.session_status || x.status || '?'}${x.carried ? ' (carried from the last read: older than the pages read)' : ''}: ${freed.has(x) ? 'published, holds no slot (PD-7)' : u.resumed.includes(id) ? 'resumed on a red gate, holds a slot' : 'holds a slot'}`);
}
// The time a list_sessions result was read no earlier than: its newest session's created_at.
export const listedAt = (listed) => Math.max(0, ...(listed || []).map((x) => Date.parse(x.created_at) || 0));
// The modules whose job started after t: the start rows of the open layer and of the next (its
// early starts), a fresh-branch restart not (it replaces a session), as the idle check counts them.
export function startedSince(root, sb, view, t) {
  if (!view || !t) return [];
  const ids = (n) => (n !== undefined && n !== null ? flowRows(root, sb, n).starts.filter((r) => Date.parse(r.at) > t && !r.restart).map((r) => r.module) : []);
  return [...new Set([...ids(view.n), ...(view.early_next !== view.n ? ids(view.early_next) : [])])];
}

// ===== file: merge.mjs (later part) =====

export function mergeRetry(call, { fetch = () => {}, check = () => {}, tries = RETRIES, wait = 3000, log = console.log, reread = null } = {}) {
  let again = false;
  for (let t = 1; ; t++) {
    let r;
    let why = null;
    let unread = null;
    try { r = call(); } catch (e) {
      if (!(e instanceof Fail)) throw e;
      if (BASE_MOVED.test(e.message)) why = e.message;
      else if (reread && unreadable(e.message)) unread = e.message;
      else throw e;
    }
    if (!why && !unread && reread && (r === null || r === undefined || typeof r !== 'object')) unread = `the reply was ${r == null ? 'empty' : 'not JSON'}`;
    if (unread) {
      const p = reread.read();
      if (p?.merged && p.head?.sha === reread.sha) {
        log(`GitHub's reply to the merge could not be read (${unread}); the pull request is merged at ${reread.sha.slice(0, 10)}`);
        return { merged: true, sha: p.merge_commit_sha, message: 'merged (read back after an unreadable reply)' };
      }
      if (!again && p?.state === 'open' && !p.merged && p.head?.sha === reread.sha) {
        again = true;
        log(`GitHub's reply to the merge could not be read (${unread}); the pull request is open with the same head, so the merge is tried once more`);
        // The same checks as a moved base: the base may have moved, or the PR been retargeted,
        // while the reply was lost (review of PR 102).
        fetch();
        check();
        t--;
        continue;
      }
      fail(`GitHub's reply to the merge could not be read (${unread}), and the pull request is ${p?.merged ? `merged at another head ${p.head?.sha?.slice(0, 10)}` : `${p?.state || 'unreadable'}${p?.head?.sha && p.head.sha !== reread.sha ? ` at another head ${p.head.sha.slice(0, 10)}` : ''}`}${again ? ' after one more try' : ''}; run merge again`);
    }
    if (!why && !(r && !r.merged && BASE_MOVED.test(r.message || ''))) return r;
    why = why || r.message;
    if (t >= tries) fail(`GitHub refused the merge ${tries} times because its base moved: ${why}`);
    log(`the base moved (${why.replace(/\s+/g, ' ').slice(0, 120)}); fetching and trying again (${t + 1} of ${tries})`);
    if (wait > 0) sleep(wait * t);
    fetch();
    check();
  }
}

// The merge itself, guarded by the tip the checks passed (a current tip only).
export function mergePR(slug, n, sha, { title = `Merge job PR ${n}`, message } = {}) {
  return gh(['api', '-X', 'PUT', `repos/${slug}/pulls/${n}/merge`, '--input', '-'], {
    input: JSON.stringify({ sha, merge_method: 'merge', commit_title: title, ...(message ? { commit_message: message } : {}) }),
  });
}

// merge --plain: every pull request BOB merges that is not a job's (pin moves, metrics rows,
// config). Bob denies the connector's merge tool, `gh pr merge` and `gh api .../merge` to
// every session (2 Nov), so this is the one route for them. Into the tranche or a working
// branch, or the tranche into main; a merge commit pinned to the head. GitHub's rulesets judge
// the required checks (build J); the tool waits while any is queued or running. It writes no
// merge row and pushes nothing. Without a process/config.json (process3 itself) the defaults hold.
const WORKFLOWS = '.github/workflows/';

// process3 as the tool's own clone holds it: whether a pin is released (a commit on its
// tranche or main), and the blob of a shim at that pin. A shallow clone is made whole first:
// ancestry read across a shallow cut is false, which refused a forward pin move as a downgrade
// (copy PR 53, 4 Nov). process3's history is small.
export function processRepo(dir = TOOL_ROOT) {
  let fetched = false;
  const fetch = () => {
    if (!fetched) git(['fetch', '-q', ...(isShallow(dir) ? ['--unshallow'] : []), 'origin', '+refs/heads/tranche:refs/remotes/origin/tranche', '+refs/heads/main:refs/remotes/origin/main'], { cwd: dir, allowFail: true });
    fetched = true;
  };
  return {
    released: (pin) => { fetch(); return ['origin/tranche', 'origin/main'].some((r) => git(['merge-base', '--is-ancestor', pin, r], { cwd: dir, allowFail: true }).code === 0); },
    shim: (pin, name) => blobAt(dir, pin, `shims/${name}`),
    descends: (from, to) => { fetch(); return git(['merge-base', '--is-ancestor', from, to], { cwd: dir, allowFail: true }).code === 0; },
  };
}


// A plain pull request may move the process pin only forward, to a released process3 commit
// (on its tranche or main) that descends from the base's pin: no unreleased pin, no downgrade.
// Changing an anchored key (anchor.mjs: process_repo, tranche, approvals) needs the owner's word
// (third confirming review of PR 14; review follow-ups, 2 Nov; the approvals too, review of
// PR 96: a tranche that changed approvals.owner would have named the owner the next close
// trusts), except that the tranche into main may carry the tranche's value when the commit on
// the tranche's first-parent history at which it took that value is the owner's own commit
// through GitHub's website (his direct edit, or his website merge of a pull request). The owner
// is the base's, never the head's; at the first close (bootstrap: a base with no Process3) the
// tool's default. Onboarding values are Bob's to confirm once (README, Onboarding).
// at: { intoMain, ownerCommit(sha) -> { ok }, baseRef: the base's tip }.
export function pinChange(root, mb, sha, repo, at = {}) {
  const was = pinAt(root, mb);
  const now = pinAt(root, sha);
  if (now !== was) {
    if (!now) fail(`the pull request removes the process pin; that needs the owner's word: bring it to Bob`);
    if (!repo.released(now)) fail(`the process pin ${now.slice(0, 10)} is not a commit on process3's tranche or main`);
    if (was && !repo.descends(was, now)) fail(`the process pin ${now.slice(0, 10)} does not descend from the base's pin ${was.slice(0, 10)}: no downgrade`);
  }
  // Deleting the config would make every anchored key read as its default: the owner's word (confirming review of PR 97).
  if (blobAt(root, mb, CONFIG_FILE) && !blobAt(root, sha, CONFIG_FILE)) fail(`the pull request deletes ${CONFIG_FILE}; that needs the owner's word: bring it to Bob`);
  const key = unanchored(root, mb, sha, at.intoMain ? at.ownerCommit : null, at.baseRef || mb);
  if (key) fail(`the pull request changes ${key} in ${CONFIG_FILE}; that needs the owner's word: bring it to Bob`);
  const why = at.baseRef ? mergedUnanchored(root, at.baseRef, mb, sha) : null;
  if (why) fail(`the pull request is refused: ${why}; that needs the owner's word: bring it to Bob`);
}

// A workflow that runs on pull_request runs the head's copy of its file, so a plain pull request
// could rewrite a workflow, or add a job named like a required check (confirming review of
// PR 14). Bob's standing approvals (CLAUDE.md, 4 Nov) and his word of 6 Nov (R1) bound what a
// plain pull request may do there instead of refusing every change (process3 PR 188 and copy
// PR 625 were refused and merged by hand, 6 Nov): L4, a process shim (process-gate.yml, and any
// file named like a shim the pin ships) equals the pin's own shim, byte for byte, at the released
// pin its head sets; every other workflow file changed or added passes L1, L2, L3 and L5
// (workflow-limits.mjs), judged from its copy at the merge base to the head's against the base
// branch's required checks. A deleted workflow, or one outside a limit, needs the owner's word.
// In process3 itself (a plain pull request into a base with no pin and no config in its
// history, and no pin at the head or the merge base) there are no shims, so L4 does not apply. The tranche into main (`close`, normal or
// bootstrap) is judged by workflows.mjs (Bob, 4 Nov: product workflow changes are not his to
// bring): a shim must still be the pin's own (rule 4); any other workflow file passes rule 1 and
// either rules 2 and 3 there or these limits. Returns what was judged, for the merge's message:
// [{ file, limits }].
// at: { mb, required: () => the base's required check names, process3 }.
export function workflowChanges(root, sha, changed, repo, close = null, at = {}) {
  const files = changed.filter((f) => f.startsWith(WORKFLOWS));
  if (!files.length) return [];
  const owner = (why, list = files) => fail(`the pull request changes ${list.join(', ')}: ${why}${close ? ' (rule 4)' : '. A workflow change needs the owner\'s word: bring it to Bob'}`);
  const pin = pinAt(root, sha);
  const own = !close && !pin && at.process3 === true && !(at.mb && pinAt(root, at.mb));
  if (!pin && !own) owner('there is no process pin to compare it with');
  if (pin && !repo.released(pin)) owner(`the process pin ${pin.slice(0, 10)} is not a commit on process3's tranche or main`);
  const product = [];
  const judged = [];
  let required = null;
  const req = () => (required ??= at.required ? at.required() : []);
  const limits = (f) => {
    if (!/\.ya?ml$/.test(f)) return { ok: true, limits: [], note: 'not a workflow (GitHub runs only .yml and .yaml)' };
    return judgeWorkflow(f, at.mb ? textAt(root, at.mb, f) : null, textAt(root, sha, f), req());
  };
  for (const f of files) {
    if (pin) {
      const blob = blobAt(root, sha, f);
      const shim = repo.shim(pin, basename(f));
      if (shim || basename(f) === 'process-gate.yml') {
        if (!blob || !shim || blob !== shim) owner(`L4: ${f} is not the process's own shim at ${pin.slice(0, 10)}`);
        judged.push({ file: f, limits: ['L4'] });
        continue;
      }
    }
    if (close) {
      if (f.slice(WORKFLOWS.length) === basename(f)) product.push(f);
      else owner(`${f} is not the process's own shim at ${pin.slice(0, 10)}`);
      continue;
    }
    const r = limits(f);
    if (!r.ok) fail(`the pull request changes ${refusal(f, r)}; ${OUTSIDE}`);
    judged.push({ file: f, limits: r.limits, ...(r.note ? { note: r.note } : {}) });
  }
  if (product.length) judged.push(...closeWorkflows(root, sha, product, { ...close, limits: (f, src, baseSrc) => judgeWorkflow(f, baseSrc, src, req()) }));
  return judged;
}
const textAt = (root, rev, path) => {
  const r = git(['show', `${rev}:${path}`], { cwd: root, allowFail: true });
  return r.code === 0 ? r.stdout : null;
};
// The merge message's line for what workflowChanges judged.
export const limitsLine = (judged) => (judged.length ? `Workflow limits: ${judged.map((j) => `${j.file.slice(WORKFLOWS.length)} ${j.limits.length ? j.limits.join(' ') : j.note || 'none'}`).join('; ')}` : null);

// The first close (bootstrap; coordinator, 4 Nov: the copy's main had no .process, no config and
// no process workflows, so its first tranche close had no base config to read the tranche's name
// and the owner from). A pull request into the default branch whose base holds neither the
// config nor a pin. Nothing in it is weaker than a normal close: the owner is the tool's own
// default (DEFAULTS, process3's reviewed code), never the head's; the head must be the tranche its
// own config names, and that config's tranche, approvals and process_repo count only when each is
// the default or took its value at that owner's commit through GitHub's website (pinChange, with
// bootstrap); the head's pin must be released (pinChange: a pin where the base has none is a
// change); a workflow may change only to the pin's own shim (workflowChanges); and the gate must
// be one of the base's required checks, green on the head (mergePlain). A base with a config but
// no pin, a pin but no config, or a config in its history it later deleted, is not a bootstrap:
// it is judged as any close is, by its last config (anchor.mjs isBootstrap, lastConfigAt).
export function bootstrapHead(root, sha, { base, head, log = () => {} }) {
  const no = `${base} has no Process3`;
  if (!blobAt(root, sha, CONFIG_FILE)) fail(`${no}, and the head has no ${CONFIG_FILE}: the first close is the tranche its own config names`);
  let t;
  try { t = loadConfig(root, sha).tranche; } catch (e) { fail(`${no}, and the head's ${CONFIG_FILE} cannot be read (${e.message})`); }
  if (typeof t !== 'string' || !t) fail(`${no}, and the head's ${CONFIG_FILE} names no tranche`);
  if (head !== t) fail(`only the tranche ${t} merges into ${base}, not ${head}`);
  if (!pinAt(root, sha)) fail(`${no}, and the head has no process pin: the first close brings a released one`);
  log(`${no}: the first close, of the tranche ${t} its own config names, held to the owner's website commit`);
}

// Waits while a required check on the head is queued, in progress or not yet started (it failed
// at once that way three times on 2 and 3 Nov), up to `minutes`; past that, only while a check
// is in progress, up to the gate's cap from its start (a gate that runs many suites can be slow:
// defect sweep 4 Nov, #13; the tranche into main now runs only the suites its job merges did not
// gate, gate.mjs trancheCover). Each round reads the pull request
// (`pr`): a head that moved off sha stops the wait at once. GitHub judges the result.
export function waitForChecks(slug, sha, names, { minutes = GATE_WAIT_MINUTES, every = null, read = checkRuns, pr, log = console.log, transient } = {}) {
  let polls = 0;
  const until = Date.now() + minutes * MINUTE;
  const extended = new Map();
  let k = 0;
  for (;;) {
    const g = guarded(() => [pr?.(), names.map((name) => [name, read(slug, sha, name)?.[0]])]);
    if (g.err) { transientPause(g.err, ++k, { until, log, wait: transient }); continue; }
    k = 0;
    const [p, runs] = g.v;
    if (p && p.state && p.state !== 'open') fail(`the pull request is ${p.merged ? 'merged' : p.state} while its checks on ${sha.slice(0, 10)} were awaited; run merge again`);
    if (p?.head?.sha && p.head.sha !== sha) fail(`${p.head.ref || 'the head'} moved to ${p.head.sha.slice(0, 10)} while its checks on ${sha.slice(0, 10)} were awaited; run merge again`);
    const states = runs.map(([name, r]) => [name, r ? (r.status === 'completed' ? r.conclusion : r.status) : 'not started']);
    const pending = states.filter(([, st]) => RUNNING.includes(st) || st === 'not started');
    if (!pending.length) return states;
    const t = Date.now();
    if (t >= until) {
      const going = runs.filter(([name]) => pending.some(([n]) => n === name)).every(([name, r]) => {
        if (r?.status !== 'in_progress') return false;
        if (Number.isFinite(Date.parse(r.started_at))) return stillRunning(r, t);
        if (!extended.has(name)) extended.set(name, t + GATE_CAP_MINUTES * MINUTE);
        return t <= extended.get(name);
      });
      if (!going) fail(`required checks still running on ${sha.slice(0, 10)} after ${minutes} min: ${pending.map(([n, st]) => `${n} ${st}`).join(', ')}`);
    }
    log(`waiting for ${pending.map(([n, st]) => `${n} (${st})`).join(', ')} on ${sha.slice(0, 10)}${t > until ? '; past the wait, still in progress' : ''}`);
    sleep(every ?? pollMs(++polls));
  }
}

// The refresh's gate row (copy PR 148): a green process-gate run on the head, verified (its run's
// artifact holds the same row), whose regenerate left every generated module file the pull
// request changes byte-identical.
// The row must be on the base as it is now: the bytes were compared on the head merged with
// that base (review 1 of PR 95).
function refreshGate(slug, n, sha, files, { base, baseSha, untracked = [], io, log }) {
  if (io.checkRun(slug, sha, 'gate')?.conclusion !== 'success') fail(`pull request ${n} changes generated module files (${files.slice(0, 5).join(', ')}), and the gate on ${sha.slice(0, 10)} is not green`);
  const rows = gateRuns(io.comments(slug, n)).filter((r) => r.sha === sha);
  const ok = rows.filter((r) => r.ok && r.base === baseSha && r.refresh?.result === 'identical' && files.every((f) => r.refresh.files?.includes(f)) && untracked.every((f) => r.refresh.untracked?.includes(f))).find((r) => io.verify(slug, r, { pr: n, baseRef: base }));
  if (!ok) {
    const newest = rows.at(-1);
    const last = newest?.refresh;
    const moved = newest && newest.base !== baseSha ? `; ${base} moved since its newest run: give the gate a new event on the base as it is (push to ${sha.slice(0, 10)}'s branch, or edit the pull request); a re-run replays the old base` : '';
    fail(`pull request ${n} changes generated module files (${files.slice(0, 5).join(', ')}): no green process-gate run on ${sha.slice(0, 10)} against ${base} as it is regenerated them byte-identical${last ? ` (its newest run: ${last.result}${last.differ?.length ? `, ${last.differ.slice(0, 5).join(', ')} differ` : ''})` : ''}${moved}`);
  }
  log(`generated module files regenerated byte-identical by the gate on ${sha.slice(0, 10)}: ${files.join(', ')}`);
}

// A pass's gate row (P7: one full test run before it is committed): a green, verified process-gate
// run on the head against the base as it is, judged as a pass, that ran the whole suite of every
// module the pass touches (no requirements-only run); records pushed after it keep it.
function passGate(slug, n, sha, ids, { base, baseSha, io, log }) {
  if (io.checkRun(slug, sha, 'gate')?.conclusion !== 'success') fail(`pull request ${n} is a pass, and the gate on ${sha.slice(0, 10)} is not green`);
  const rows = gateRuns(io.comments(slug, n));
  const full = (r) => r.ok && r.pass === true && r.trigger === 'code' && ['pass', 'base-red'].includes(r.suite) && r.base === baseSha
    && ids.every((id) => r.scope?.includes(id)) && !(r.requirements_only || []).some((x) => ids.includes(x?.module));
  const ok = rows.filter((r) => r.sha === sha).reverse().find((r) => {
    const run = r.trigger === 'record-since-green' && r.ok && r.base === baseSha ? rows.find((x) => x.sha === r.after && full(x)) : r;
    return run && full(run) && io.verify(slug, r, { pr: n, baseRef: base }) && (run === r || io.verify(slug, run, { pr: n, baseRef: base }));
  });
  if (!ok) fail(`pull request ${n} is a pass: no green process-gate run on ${sha.slice(0, 10)} against ${base} as it is ran the whole suites of ${ids.join(', ')} as a pass (P7); give the gate a new event on the base as it is (push, or edit the pull request)`);
  log(`pass: the gate on ${sha.slice(0, 10)} ran the suites of ${ids.join(', ')}`);
}

// The live jobs of a pass's modules (P7: while no job runs): an open job pull request into the
// tranche, an entry WORKING on the tranche, or a job branch whose entry is WORKING or OPEN (a
// COMPLETE job whose pull request merged holds nothing). Unreadable: refused, not guessed.
export function liveJobs(root, ids, { slug, tranche, entries, io }) {
  const heads = io.jobHeads(root);
  const prs = io.openPRs(slug, tranche);
  if (!heads || !Array.isArray(prs)) fail(`the job branches or the open pull requests into ${tranche} cannot be read, so whether a job holds ${ids.join(', ')} is unknown; run merge again`);
  const all = new Set(entries.map((e) => e.id));
  const live = [];
  for (const id of ids) {
    const p = prs.find((x) => branchModule(x.head?.ref, all) === id);
    if (p) { live.push(`${id} (job PR ${p.number} is open)`); continue; }
    if (entries.find((e) => e.id === id)?.status?.state === 'WORKING') { live.push(`${id} (WORKING on ${tranche})`); continue; }
    const b = jobBranch(id, heads, all);
    if (!heads.has(b)) continue;
    // A failed fetch would read a stale tracking ref: unread (cold review).
    const fetched = git(['fetch', '-q', 'origin', `+refs/heads/${b}:refs/remotes/origin/${b}`], { cwd: root, allowFail: true }).code === 0;
    const t = fetched ? git(['show', `refs/remotes/origin/${b}:${entryFile(id)}`], { cwd: root, allowFail: true }) : null;
    let st = null;
    try { st = t?.code === 0 ? JSON.parse(t.stdout).status?.state || null : null; } catch { st = null; }
    if (!st || st === 'WORKING' || st === 'OPEN') live.push(`${id} (${st || 'an unread entry'} on ${b})`);
  }
  return live;
}

export function mergePlain(root, n, opts = {}) {
  const { reviewed, noReview, pass, minutes = GATE_WAIT_MINUTES, log = console.log } = opts;
  const io = { getPR, requiredChecks, checkRuns, checkRun, comments, mergePR, openPRs, jobHeads: originJobs, verify: (slug, r, ctx) => verifyRow(slug, r, ctx), repo: processRepo(), ...(opts.io || {}) };
  const rounds = reviewRounds(opts);
  const slug = opts.slug || repoSlug(root);
  const pr = io.getPR(slug, n);
  if (pr.state !== 'open') fail(`pull request ${n} is ${pr.state}`);
  if (pr.draft) fail(`pull request ${n} is a draft`);
  const base = pr.base.ref;
  const head = pr.head.ref;
  if (!pr.head.repo?.full_name || pr.head.repo.full_name !== slug) fail(`pull request ${n} comes from ${pr.head.repo?.full_name || 'a repository that no longer exists'}, not ${slug}`);
  if (isJob(head)) fail(`pull request ${n} is a job's (${head}); merge it without --plain`);
  if (isJob(base)) fail(`pull request ${n} is into ${base}, a job's branch`);
  // A layer branch cut ahead for early starts (R14) takes nothing before its open: its open is a
  // fast-forward to the tranche (cold review of R14).
  const lk = layerOfBranch(base);
  if (lk !== null) {
    const sb = loadConfig(root).state_branch;
    git(['fetch', '-q', 'origin', `+refs/heads/${sb}:refs/remotes/origin/${sb}`], { cwd: root, allowFail: true });
    if (git(['cat-file', '-e', `refs/remotes/origin/${sb}:${flowFile(lk, 'open')}`], { cwd: root, allowFail: true }).code !== 0) fail(`pull request ${n} is into ${base}, and layer ${lk} is not open (cut ahead for early starts, or never opened): nothing merges into it before ${P3} layer open ${lk}`);
  }
  const main = base === 'main' || base === pr.base.repo?.default_branch;
  // Before anything waits on checks: a conflicted pull request gets none (copy PR 108, 4 Nov).
  waitMergeable(slug, n, pr, { every: opts.mergeableEvery, read: io.getPR, log });

  // The base and head as GitHub has them, fetched so they are read here, not trusted.
  git(['fetch', '-q', 'origin', `+refs/heads/${base}:refs/remotes/origin/${base}`], { cwd: root });
  const baseRef = `origin/${base}`;
  // The owner and the tranche's name are read from the base's config, never from the change it
  // judges or the working tree.
  // A base that deleted its config is read by the last one it had (anchor.mjs lastConfigAt).
  let baseCfg = null;
  try { baseCfg = loadConfig(root, lastConfigAt(root, baseRef) || baseRef); } catch { baseCfg = null; }
  if (main && !baseCfg) fail(`${CONFIG_FILE} on ${base} cannot be read, so the tranche's name is unknown; only the tranche merges into ${base}`);
  const boot = main && isBootstrap(root, baseRef);
  if (main && !boot && head !== baseCfg.tranche) fail(`only the tranche ${baseCfg.tranche} merges into ${base}, not ${head}`);
  git(['fetch', '-q', 'origin', `+refs/heads/${head}:refs/remotes/origin/${head}`], { cwd: root });
  if (git(['rev-parse', `origin/${head}`], { cwd: root }) !== pr.head.sha) fail(`${head} moved since GitHub reported ${pr.head.sha.slice(0, 10)}; run merge again`);
  // The first close: the tranche named by the head's own config (held by pinChange below), with a pin.
  if (boot) bootstrapHead(root, pr.head.sha, { base, head, log });
  deepenToBase(root, slug, base, head, io.compare);
  if (git(['rev-parse', `origin/${head}`], { cwd: root }) !== pr.head.sha) fail(`${head} moved since GitHub reported ${pr.head.sha.slice(0, 10)}; run merge again`);
  const mb = git(['merge-base', baseRef, pr.head.sha], { cwd: root });
  // No rename detection: a rename lists the path it removes as well as the one it adds.
  const changed = diffNames(root, mb, pr.head.sha);
  // The base's required checks, read once, for the workflow limits and the wait below.
  let rules;
  const readRules = () => {
    if (rules === undefined) rules = io.requiredChecks(slug, base);
    if (!rules) fail(`could not read the checks ${base} requires`);
    return rules;
  };
  // process3 itself: a base with no pin and no config in its history, not a first close into main.
  const process3 = !main && isBootstrap(root, baseRef);
  const workflows = workflowChanges(root, pr.head.sha, changed, io.repo, main ? { mb, base, baseRef, tranche: head, slug, io, ownerCommit: (c) => (baseCfg?.approvals.owner ? webCommitByOwner(root, c, baseCfg.approvals.owner, io.lookup, slug) : { ok: false }) } : null, {
    mb, process3, required: () => [...new Set(readRules().checks.map((c) => c.context))],
  });
  if (workflows.length) log(`workflow changes within the owner's limits: ${limitsLine(workflows).replace(/^Workflow limits: /, '')}`);
  const owner = baseCfg?.approvals.owner;
  pinChange(root, mb, pr.head.sha, io.repo, {
    intoMain: main, baseRef, ownerCommit: (c) => (owner ? webCommitByOwner(root, c, owner, io.lookup, slug) : { ok: false }),
  });

  let refreshed = [];
  let untracked = [];
  let ignores = [];
  let passIds = null;
  let noLiveJobs = () => {};
  if (pass !== undefined && (!baseCfg || base !== baseCfg.tranche)) fail(`pull request ${n} is into ${base}: a pass lands only on the tranche (P7)`);
  if (pass !== undefined && !PASS_BRANCH.test(head)) fail(`pull request ${n} is from ${head}: a pass comes from a pass/<name> branch, which the gate runs as a pass (P7)`);
  // Module code goes through a job (ARC-2): in a product, a plain merge may not touch any ledger
  // entry's paths or tests. The tranche itself (into main, or into a working branch) carries
  // only work that came through the gate. The tranche's name is the base's.
  if (!baseCfg || head !== baseCfg.tranche) {
    const entries = entriesAt(root, baseRef);
    // One exception (the route for work found elsewhere, coordinator, 4 Nov): a change to a
    // module's requirement file that only adds new unmet found marks, `**F<n>** *(not yet met:
    // <source>)*` lines, nothing removed or changed, merges plain. Any other change still goes through a job.
    const why = [];
    const owned = (f, e) => [...(e.paths || []), ...(e.tests || [])].some((p) => underPath(f, p));
    const found = (f, e) => {
      if (!e.requirements || f !== String(e.requirements).replace(/^\.\//, '')) return false;
      const diff = git(['diff', '--no-renames', '-U0', mb, pr.head.sha, '--', f], { cwd: root });
      const before = git(['show', `${mb}:${f}`], { cwd: root, allowFail: true });
      const r = foundOnly(diff, before.code === 0 ? before.stdout : '');
      if (!r.ok) why.push(`${f}: ${r.why}`);
      return r.ok;
    };
    // A second (copy PR 148, 4 Nov): a module's committed generated files, under the base
    // config's `generated` paths, merge plain when nothing else of any module changes and a green
    // gate run on the head regenerated them byte-identical (checked below, once the gate is done).
    const gen = baseCfg ? generatedRows(baseCfg).rows : [];
    // A third (build untrack-generated): removing a module's committed generated file, with only
    // lines added to a .gitignore for it; the gate's row must show it built, verified, and ignored.
    const removed = removedGenerated(root, gen, changed, pr.head.sha);
    ignores = removed.length ? ignoreLines(root, mb, pr.head.sha, changed, removed) : [];
    // The fourth route, a pass (P7, Bob's Keep and Drop, 3 Nov): "A no-judgment change across many
    // modules is one mechanical pass by a worker in BOB's session while no job runs, with one full
    // test run before it is committed." Any module's files, while no live job holds them, on a
    // green gate that ran every touched module's whole suite (checked below), with no receipt.
    if (pass !== undefined) {
      passIds = entries.filter((e) => changed.some((f) => owned(f, e))).map((e) => e.id);
      if (!passIds.length) fail(`pull request ${n} changes no module's files: it is no pass; merge it without --pass`);
      noLiveJobs = () => {
        const live = liveJobs(root, passIds, { slug, tranche: base, entries, io });
        if (live.length) fail(`pull request ${n} is a pass, and a pass runs while no job holds its modules (P7): ${live.slice(0, 5).join(', ')}`);
      };
      noLiveJobs();
      if (latestBlock(null, null, RECEIPT, io.comments(slug, n))) fail(`pull request ${n} carries a receipt: a pass has none; a job's work merges without --plain`);
    }
    // A lane's pull request (Bob's standing approvals, 5 Nov: "A pull request that changes only
    // files in its own lane's folder lands through the merge tool without a test suite run"):
    // every file in one lane's folder, records aside, as the gate judges it (util.mjs laneOnly;
    // copy PR 620, 6 Nov 05:15, refused as module files of ux-design). Not a module's tests.
    const lane = baseCfg ? laneOnly(baseCfg, changed, entries) : null;
    if (lane) log(`pull request ${n} changes only lane ${lane}'s folder (records aside): it lands as a lane's change`);
    const hits = pass !== undefined || lane ? [] : changed.flatMap((f) => entries.filter((e) => owned(f, e) && !found(f, e)).map((e) => ({ f, id: e.id })));
    const hit = hits.filter((h) => !isGenerated(gen, h.f) && !ignores.includes(h.f)).map((h) => `${h.f} (${h.id})`);
    if (hit.length) fail(`pull request ${n} changes module files, which go through a job: ${hit.slice(0, 5).join(', ')}${why.length ? `; a plain pull request may only add new unmet found marks to a requirement file (${why.slice(0, 3).join('; ')})` : ''}${hits.length > hit.length ? '; a plain pull request may change a module\'s generated files only, and only to their regenerated bytes' : ''}; a no-judgment change while no job runs is a pass: from a pass/<name> branch, merge --plain --pass "<what and why>" (P7)`);
    // The gate's row must have compared every generated file the refresh changes, owned or not
    // (review 3 of PR 95).
    // A pass's changed generated module files are compared as a refresh's are, its other files aside.
    const genOwned = passIds && changed.some((f) => isGenerated(gen, f) && entries.some((e) => owned(f, e)));
    refreshed = hits.length || genOwned ? changed.filter((f) => isGenerated(gen, f)) : [];
    untracked = refreshed.length ? removed : [];
    const others = refreshed.length && !passIds ? refreshOthers(baseCfg, gen, changed, entries, ignores) : [];
    if (others.length) fail(`pull request ${n} changes generated module files and ${others.slice(0, 5).join(', ')}: a refresh may go beside only records, the modules file, the layers file and process/config.json; any other file could be what writes them`);
  }

  const names = [...new Set(readRules().checks.map((c) => c.context))];
  if (!names.length && (main || !baseCfg || base === baseCfg.tranche)) fail(`${base} requires no checks; its ruleset must require the gate before anything merges into it`);
  const states = waitForChecks(slug, pr.head.sha, names, { minutes, every: opts.every, read: io.checkRuns, pr: () => io.getPR(slug, n), log, ...(opts.transient ? { transient: opts.transient } : {}) });
  log(names.length ? `required checks on ${pr.head.sha.slice(0, 10)}: ${states.map(([c, st]) => `${c} ${st}`).join(', ')}; GitHub's ruleset judges them` : `note: ${base} requires no checks`);
  if (refreshed.length) refreshGate(slug, n, pr.head.sha, refreshed, { base, baseSha: git(['rev-parse', baseRef], { cwd: root }), untracked, io, log });
  if (passIds) passGate(slug, n, pr.head.sha, passIds, { base, baseSha: git(['rev-parse', baseRef], { cwd: root }), io, log });
  // The base must still be the one checked.
  const again = io.getPR(slug, n);
  if (again.base?.ref !== base) fail(`pull request ${n} was retargeted to ${again.base?.ref} while it was checked`);
  if (again.head?.sha !== pr.head.sha) fail(`pull request ${n} moved while it was checked; run merge again`);
  // Read the base again now, after the wait (it may have moved), from a fetch that must succeed:
  // a first close stands only while the base still has no Process3 (review 4 of PR 97), and the
  // anchored keys are judged on the merge with the base as it is (anchor.mjs mergedUnanchored).
  const baseHolds = () => {
    git(['fetch', '-q', 'origin', `+refs/heads/${base}:refs/remotes/origin/${base}`], { cwd: root });
    if (boot && !isBootstrap(root, baseRef)) fail(`${base} gained Process3 while pull request ${n} was checked as its first close; run merge again`);
    const why = mergedUnanchored(root, baseRef, git(['merge-base', baseRef, pr.head.sha], { cwd: root }), pr.head.sha);
    if (why) fail(`pull request ${n} is refused: ${why}; that needs the owner's word: bring it to Bob`);
  };
  baseHolds();
  // The first close stands on the gate itself, not only on GitHub's ruleset.
  if (boot && !states.some(([c, st]) => c === 'gate' && st === 'success')) fail(`${base} has no Process3, so its first close needs the gate, required by ${base}'s ruleset and green on ${pr.head.sha.slice(0, 10)}; ${names.length ? `its required checks: ${states.map(([c, st]) => `${c} ${st}`).join(', ')}` : `${base} requires no checks`}`);
  // A job started on a pass's module while its gate was awaited: no pass lands over it (cold review).
  noLiveJobs();
  const r = mergeRetry(() => io.mergePR(slug, n, pr.head.sha, {
    title: `Merge PR ${n}: ${head} into ${base}`,
    message: [pass !== undefined ? `Pass: ${pass}` : reviewed ? `Reviewed: ${reviewed}` : `No review: ${noReview}`, `Review rounds: ${rounds.rounds}`, ...(rounds.decision ? [`Decision: ${rounds.decision}`] : []), ...(limitsLine(workflows) ? [limitsLine(workflows)] : [])].join('\n'),
  }), {
    log, wait: opts.wait, reread: { read: () => io.getPR(slug, n), sha: pr.head.sha },
    fetch: () => git(['fetch', '-q', 'origin', `+refs/heads/${base}:refs/remotes/origin/${base}`], { cwd: root, allowFail: true }),
    check: () => {
      const p = io.getPR(slug, n);
      if (p.state !== 'open' || p.base?.ref !== base || p.head?.sha !== pr.head.sha) fail(`pull request ${n} changed while its base moved; run merge again`);
      baseHolds();
      noLiveJobs();
    },
  });
  if (!r?.merged) fail(`GitHub did not merge pull request ${n}: ${r?.message || 'no result'}`);
  log(`merged pull request ${n} at ${r.sha} (${now()})`);
  // A pin move into the tranche (never into a working branch) gives BOB new acts (tranche open):
  // the wake, from the role that ran the merge (--as; BOB itself, the default, is awake).
  const pin = pinAt(root, pr.head.sha);
  const as = opts.as ?? 'bob';
  const moved = base === (baseCfg?.tranche || DEFAULTS.tranche) && pin && pin !== pinAt(root, mb);
  const what = PIN_WHAT(pin);
  const wake = moved && as !== 'bob' ? bobWake(what, as) : null;
  // Printed once per merge commit (state.mjs wakeOnce).
  if (wake) printWake(root, baseCfg?.state_branch || DEFAULTS.state_branch, { pr: n, sha: r.sha, what, wake, as, by: 'merge', log });
  return { merged: true, sha: r.sha, checks: names, wake, what: wake ? what : null, ...(passIds ? { pass, modules: passIds } : {}), ...(workflows.length ? { workflows } : {}) };
}

// A pin move's wake for BOB (build train-robust, option 2A): the same words wherever the move is
// seen, computed from git when no record carries them (a train that stopped after its land, a
// pull request found merged by a later pass): the pin at the merge commit against the pin at its
// first parent, the base as it was (the tool merges with merge commits only). A merge commit that
// cannot be read gives the wake anyway, said so: an extra wake costs BOB one status, a missing
// one stalls the tranche. { what, wake } (both null when the pin did not move or as is bob).
export const PIN_WHAT = (pin) => `pin moved to ${pin}: run your wake steps (start check --wake prints a changed prompt), then status`;
export function pinWake(root, base, sha, as = 'bob') {
  if (as === 'bob' || !sha) return { what: null, wake: null };
  git(['fetch', '-q', 'origin', `+refs/heads/${base}:refs/remotes/origin/${base}`], { cwd: root, allowFail: true });
  if (git(['cat-file', '-e', `${sha}^{commit}`], { cwd: root, allowFail: true }).code !== 0) git(['fetch', '-q', 'origin', sha], { cwd: root, allowFail: true });
  let pin;
  let was;
  try { pin = pinAt(root, sha); was = pinAt(root, `${sha}^1`); } catch {
    const what = `the pin may have moved (merge ${String(sha).slice(0, 10)} could not be read): run your wake steps (start check --wake prints a changed prompt), then status`;
    return { what, wake: bobWake(what, as), unread: true };
  }
  if (!pin || pin === was) return { what: null, wake: null };
  const what = PIN_WHAT(pin);
  return { what, wake: bobWake(what, as) };
}
// Prints a wake once per merge commit, across every session that sees the merge (the
// coordinator's ruling, 5 Nov): the first to record it prints it; a later one says it was given.
// A record that cannot be written prints it anyway.
export function printWake(root, sb, { pr, sha, what, wake, as, by, log = console.log }) {
  const w = wakeOnce(root, sb, { pr, sha, what, wake, by, print: true });
  if (w.print) log(wakeLine(what, as));
  else log(`the wake of BOB for PR ${pr} (merge ${String(sha).slice(0, 10)}) was already given by ${w.printed?.by || 'another run'} at ${w.printed?.at || '?'}: not given again`);
  return w;
}

// ===== file: layout.mjs =====

// layout move [--apply] [--also <path>]... (C41; Bob, 8 Nov: "There should be an process3-specific
// subtree in the [product's] repo that contains info related to [the product's]
// process3-driven development"). A product keeps its process-only content under process/, the
// directory that holds config.json (PROCESS_DIR). Each path the tool reads through a config key
// keeps working where it is, by that key's default, until the product moves it; this act moves it.
//
// The built-in moves (coordinator, 8 Nov) are only what the tool itself reads as process-only:
// layers_file and situations_dir. Anything else (a plan, job notes, the modules file) moves only by
// --also, once BOB has confirmed from the product that the product itself does not rely on it,
// and only when no tracked file outside process/ names it. The
// requirements (requirements_dir) are product content and never move here; nor do the paths the
// platform reads from fixed places (.process, .github, .claude, CLAUDE.md), nor a lane's folder.
//
// Without --apply it prints the plan and writes nothing. With --apply, on a clean checkout of a
// branch that is not the tranche, it moves each path with git mv, rewrites only the keys whose
// value moved in process/config.json, and makes one commit, so the move lands at one tranche
// commit through the merge tool: before it every reader resolves the old paths, after it the new.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { CONFIG_FILE, DEFAULTS, PROCESS_DIR, fail, git, laneDirs, list, loadConfig, parseJSON, underPath } from './util.mjs';

// The keys a move may rewrite: those naming a process-only path. requirements_dir is not one.
export const MOVABLE_KEYS = ['layers_file', 'situations_dir', 'modules_file', 'completion_file'];
// The keys the built-in plan moves (the tool reads them as process-only).
export const BUILT_IN = ['layers_file', 'situations_dir'];
// The platform reads these from fixed places; they never move.
const FIXED = ['.process', '.github', '.claude', 'CLAUDE.md', '.gitmodules'];

const norm = (p) => String(p).replace(/^\.\//, '').replace(/\/+$/, '');
const tracked = (root, p) => git(['ls-files', '--', p], { cwd: root, allowFail: true }).stdout.trim() !== '';

// The plan: [{ from, to, key|null, note|null }] and the paths skipped, each with why.
export function layoutPlan(root, { cfg = loadConfig(root), also = [] } = {}) {
  const moves = [];
  const skipped = [];
  const lanes = laneDirs(cfg).flatMap((l) => [l.dir, l.research]).filter(Boolean).map(norm);
  const req = norm(cfg.requirements_dir || DEFAULTS.requirements_dir);
  const add = (from, key, also = false) => {
    const p = norm(from);
    if (!p || p.startsWith('/') || p.split('/').includes('..')) fail(`layout move: ${JSON.stringify(from)} is not a path inside the repository`);
    if (underPath(p, PROCESS_DIR)) { skipped.push({ from: p, why: `already under ${PROCESS_DIR}/` }); return; }
    if (FIXED.some((f) => underPath(p, f) || underPath(f, p))) fail(`layout move: ${p} is read by the platform from a fixed place (.process, .github, .claude, CLAUDE.md); it stays where it is`);
    if (underPath(p, req) || underPath(req, p)) fail(`layout move: ${p} holds the requirements (requirements_dir ${req}), the product's own content; they stay where they are`);
    const lane = lanes.find((d) => underPath(p, d) || underPath(d, p));
    if (lane) fail(`layout move: ${p} overlaps the lane folder ${lane}/, which its lane owns; it stays where it is`);
    if (!existsSync(join(root, p)) || !tracked(root, p)) { skipped.push({ from: p, why: 'not in this checkout' }); return; }
    if (moves.some((m) => m.from === p)) return;
    const over = moves.find((m) => underPath(p, m.from) || underPath(m.from, p));
    if (over) fail(`layout move: ${p} and ${over.from} overlap; name the outer one only`);
    // An --also path that a tracked file outside process/ names in its text (coordinator, 8 Nov,
    // from BOB's read of the product: product tests read build/plan/ and docs/requirements-notes/):
    // refused, with the files, so a reference never breaks silently. Its own files are not asked.
    if (also) {
      const r = git(['grep', '-l', '-F', '-e', p, '--', '.', `:(exclude)${PROCESS_DIR}`, `:(exclude)${p}`], { cwd: root, allowFail: true });
      if (r.code > 1) fail(`layout move: could not search the tracked files for ${p} (${r.stderr.trim()}); nothing was moved`);
      const named = r.stdout.split('\n').filter(Boolean);
      if (named.length) fail(`layout move: ${p} is named by ${named.length} tracked file(s) outside ${PROCESS_DIR}/, which would break: ${named.slice(0, 20).join(', ')}${named.length > 20 ? ', ...' : ''}; move it with a change that updates them (as round work), not by --also`);
    }
    const to = `${PROCESS_DIR}/${basename(p)}`;
    if (existsSync(join(root, to)) || moves.some((m) => m.to === to)) fail(`layout move: ${to} is taken; move ${p} by hand or rename one of them first`);
    const keyOf = key || MOVABLE_KEYS.find((k) => typeof cfg[k] === 'string' && norm(cfg[k]) === p) || null;
    // A modules file under process/ is a record: the gate judges a change to it alone as one, with
    // no suite run (gate.mjs recordOnly). Said, never refused: the coordinator moves it by --also.
    const note = keyOf === 'modules_file' ? `under ${PROCESS_DIR}/ the gate reads ${p} as a record: a pull request changing only it runs no suite` : null;
    moves.push({ from: p, to, key: keyOf, note });
  };
  for (const k of BUILT_IN) {
    const v = k === 'situations_dir' ? (cfg.situations_dir ?? DEFAULTS.situations_dir) : cfg[k];
    if (typeof v === 'string' && v) add(v, k);
  }
  for (const p of list(also)) {
    if (typeof p !== 'string') fail('layout move --also <path>: name the path');
    add(p, null, true);
  }
  // A key naming a path inside a moved directory follows it (cold review): its new prefix.
  const follows = [];
  for (const k of MOVABLE_KEYS) {
    const v = typeof cfg[k] === 'string' ? norm(cfg[k]) : null;
    if (!v || moves.some((m) => m.key === k)) continue;
    const m = moves.find((x) => v !== x.from && underPath(v, x.from));
    if (m) follows.push({ key: k, to: `${m.to}${v.slice(m.from.length)}` });
