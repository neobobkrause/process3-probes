// ===== file: github.mjs (continued) =====

  return withTemp('p3-row-', (dir) => {
    try {
      if (gh(['run', 'download', String(id), '-R', slug, '-n', 'gate-row', '-D', dir], { allowFail: true }) === null && !existsSync(join(dir, 'gate.json'))) return null;
      return JSON.parse(readFileSync(join(dir, 'gate.json'), 'utf8')).run || null;
    } catch { return null; }
  });
}
// scope and after too: the tranche cover trusts a row for the module it ran and the run it stood on.
// refresh too: merge --plain trusts a row's regenerate comparison (copy PR 148).
// base_red too: the tranche cover and a spec-tested land read whether a suite was base-red.
// tree, spec and spec_* too: a spec-tested fast path and the tranche cover trust a spec row for the
// tree it tested and the job it judged, and a spec-tested row for the spec run it names (train-spec).
const SAME = ['sha', 'base', 'trigger', 'ok', 'attempt', 'suite', 'revert', 'scope', 'after', 'refresh', 'base_red', 'tree', 'spec', 'spec_pr', 'spec_run', 'spec_sha'];
export function verifyRow(slug, row, { pr, baseRef, merged }, io = { getRun, runArtifactRow }) {
  if (!row?.run_id) return false;
  const a = io.getRun(slug, row.run_id);
  if (!a || a.path !== GATE_WORKFLOW || a.head_sha !== row.sha || a.status !== 'completed') return false;
  // The run must be this pull request's own, into the tranche: not a second PR on the same
  // commit into a branch that carries a workflow of its own.
  // (Every pull request GitHub lists for the run must be into the tranche, in case it lists
  // all open PRs that share the head branch.)
  // Once the pull request merges, GitHub lists none on its runs (measured on the copy 4 Nov:
  // registers PR 86, run 41778833434; site PR 79, run 41779185745). A merged job PR's run is
  // bound instead by what GitHub keeps (merged, passed only by the tranche cover once it has read
  // the merged PR): the run was on the PR's branch, in this repository, and green; the caller
  // binds the row's commits to the PR's head and the tranche.
  // A merged PR's branch reused by a later PR (a reopen on the same job branch: the copy's PR 805,
  // landed, and 850, opened as a draft from job/queue-producers-2, 8 Nov): GitHub then lists the
  // later PR on the merged PR's runs, not the merged one (C32). Listing only PRs from the merged
  // PR's own branch into the same base, the run is bound as one listing none is.
  const prs = a.pull_requests || [];
  if (a.event !== 'pull_request') return false;
  const asMerged = () => !!merged && a.head_branch === merged.branch && a.head_repository?.full_name === slug && a.conclusion === 'success';
  const sameBranch = prs.length && !prs.some((p) => p.number === pr) && prs.every((p) => p.head?.ref === merged?.branch && p.base?.ref === baseRef);
  if (prs.length && !sameBranch ? !prs.some((p) => p.number === pr) || !prs.every((p) => p.base?.ref === baseRef) : !asMerged()) return false;
  if (row.ok && a.conclusion !== 'success') return false;
  const art = io.runArtifactRow(slug, row.run_id);
  return !!art && SAME.every((k) => JSON.stringify(art[k] ?? null) === JSON.stringify(row[k] ?? null));
}

// GitHub's REST API has no ready-for-review call, and `gh pr ready` uses GraphQL, which Claude
// Code sessions cannot reach (measured 1 Nov 2026, the first product job). Sessions reach it
// through their proxy's REST route; anywhere else, `gh pr ready` is the route. No other call in
// the tool uses GraphQL (toDraft above takes the same two routes).
export function markReady(slug, n, { call = (args) => ghRun(args), read = getPR } = {}) {
  const tried = [['api', '-X', 'POST', `repos/${slug}/pulls/${n}/ccr/ready_for_review`], ['pr', 'ready', String(n), '-R', slug]];
  const errors = [];
  for (const args of tried) {
    const r = call(args);
    if (r.code === 0) break;
    errors.push(`gh ${args.slice(0, 3).join(' ')}: ${(r.stderr || r.stdout || '').trim().split('\n')[0]}`);
  }
  if (errors.length === tried.length) fail(`could not mark pull request ${n} ready: ${errors.join('; ')}`);
  const pr = read(slug, n);
  if (pr.draft) fail(`pull request ${n} is still a draft`);
  return pr;
}

// Conclusion of the newest check run named `name` on a commit, or null when none.
const checkRunArgs = (slug, sha, name) => ['api', `repos/${slug}/commits/${sha}/check-runs?check_name=${encodeURIComponent(name)}&per_page=20`];
const newestRun = (r) => (r?.check_runs || []).sort((a, b) => String(b.started_at).localeCompare(String(a.started_at)))[0] || null;
export function checkRun(slug, sha, name) {
  return newestRun(gh(checkRunArgs(slug, sha, name), { allowFail: true }));
}

// The checks a branch's rulesets require (merge --plain), by name; null when the rules cannot
// be read. Read from the rulesets, not classic branch protection.
export function requiredChecks(slug, branch, { read = (args) => gh(args, { allowFail: true }) } = {}) {
  const path = branch.split('/').map(encodeURIComponent).join('/');
  const rules = read(['api', `repos/${slug}/rules/branches/${path}?per_page=100`]);
  if (!Array.isArray(rules)) return null;
  const checks = rules.filter((r) => r.type === 'required_status_checks').flatMap((r) => r.parameters?.required_status_checks || []);
  return { checks: checks.map((c) => ({ context: c.context })) };
}

// Every check run of that name on a commit, newest first; null when unreadable.
const checkRunsArgs = (slug, sha, name) => ['api', `repos/${slug}/commits/${sha}/check-runs?check_name=${encodeURIComponent(name)}&filter=all&per_page=100`];
const allRuns = (r) => (!r || !Array.isArray(r.check_runs) ? null : [...r.check_runs].sort((a, b) => String(b.started_at).localeCompare(String(a.started_at)) || (b.id || 0) - (a.id || 0)));
export function checkRuns(slug, sha, name, { read = (args) => gh(args, { allowFail: true }) } = {}) {
  return allRuns(read(checkRunsArgs(slug, sha, name)));
}

// GitHub's comparison of two refs or commits: ahead_by, behind_by, merge_base_commit; null when
// unreadable.
const refPath = (r) => String(r).split('/').map(encodeURIComponent).join('/');
export const compare = (slug, base, head) => gh(['api', `repos/${slug}/compare/${refPath(base)}...${refPath(head)}?per_page=1`], { allowFail: true });

// Commits on head that base lacks. In a shallow clone the local count is wrong (both histories
// are cut), so GitHub's compare answers when a slug is given (online); a full clone, offline, or
// a failed call counts locally with rev-list local[0]..local[1]. null when neither can.
export function aheadBy(root, { slug, base, head, local, read = compare }) {
  if (slug && isShallow(root)) {
    const c = read(slug, base, head);
    if (Number.isInteger(c?.ahead_by)) return c.ahead_by;
  }
  const r = git(['rev-list', '--count', `${local[0]}..${local[1]}`], { cwd: root, allowFail: true });
  return r.code === 0 ? Number(r.stdout.trim()) : null;
}

// ===== file: ready.mjs =====

// job start --ready (coordinator, 4 Nov: ready to start, median 49.5 min against a target of 10):
// readiness starts the job without waiting for BOB to choose it. One command starts every job
// status --role bob lists as startable, up to live_cap less the live sessions, in the order next
// work lists them; BOB runs it on every wake and after every merge and layer close, then delivers
// each launch it prints with create_session and subscribes to each pull request.
// Startable: a module with a ledger entry on the tranche and no job branch on origin, its
// requirement file not over the cap: an OPEN entry never started; a COMPLETE one listed for a
// provider notice (job start reopens it itself) or for found marks (reopened to meet them).
// A file with no ledger entry is named, not started: its entry is BOB's to write.
import { P3, jobStart } from './job.mjs';
import { isArchived, isIdle, jobSession, readSessions, status } from './status.mjs';
import { Fail, fail, git, loadConfig } from './util.mjs';

const LAUNCH = /^start the job session with create_session:/;

export function startable(next, { onOrigin = () => false } = {}) {
  const go = [];
  const skip = [];
  const seen = new Set();
  for (const x of next || []) {
    if (!x?.file || x.over || x.triage || x.missing || x.found_no_module) continue;
    if (x.module && seen.has(x.module)) continue;
    if (x.module) seen.add(x.module);
    // A module with an attempt open (a pull request, commits the tranche lacks, a flag) is never
    // started again here: status names its act (review of PR 100: a second notice relaunched it).
    if (x.attempt_open) { skip.push({ file: x.file, id: x.module, why: 'its attempt is open: status says what it needs' }); continue; }
    if (!x.module) { skip.push({ file: x.file, why: 'no ledger entry: BOB writes it, then job start --ready starts it' }); continue; }
    // An OPEN entry with its branch on origin is a start already pushed (status lists its state);
    // a COMPLETE module keeps its merged branch, which job start's reopen moves on.
    if (x.entry_state === 'OPEN' && onOrigin(x.module)) { skip.push({ file: x.file, id: x.module, why: `job/${x.module} is on origin: status says what it needs` }); continue; }
    if (x.entry_state === 'OPEN') go.push({ id: x.module, file: x.file });
    else if (x.entry_state === 'COMPLETE' && x.notices) go.push({ id: x.module, file: x.file });
    else if (x.entry_state === 'COMPLETE' && x.found) go.push({ id: x.module, file: x.file, reopen: `meet the found marks ${x.found.join(', ')}` });
    else skip.push({ file: x.file, id: x.module, why: `entry ${x.entry_state}: BOB's judgment` });
  }
  return { go, skip };
}

// The sessions BOB can archive to free a slot when the cap holds a ready job back (coordinator,
// 4 Nov: 23 of 24 live at 09:16): each job's latest session whose job is COMPLETE (on its branch
// or merged), not archived and idle. With list_sessions saved (--sessions), the ids; without,
// the jobs, so BOB knows whose sessions to look for.
export function archivable(rows, listed) {
  // Not a reopened job (COMPLETE on the tranche, WORKING or BLOCKED on its branch, its draft open)
  // nor one whose pull request GitHub did not read: its session may be working (review of PR 104).
  const done = (rows || []).filter((r) => (r.tranche === 'COMPLETE' || String(r.branch || '').startsWith('COMPLETE'))
    && !/^(WORKING|BLOCKED)/.test(String(r.branch || '')) && !/draft|unknown/.test(String(r.pr || '')) && !r.flag)
    .map((r) => ({ id: r.id, why: r.pr && r.pr !== 'merged' ? `COMPLETE, PR ${r.pr}` : 'merged' }));
  if (!listed) return { jobs: done, sessions: null };
  const sessions = [];
  for (const d of done) {
    const js = jobSession(listed, d.id);
    if (js && !isArchived(js) && isIdle(js)) sessions.push({ session: js.id || js.session_id || js.uuid, job: d.id, why: d.why });
  }
  return { jobs: done, sessions };
}

// Whether status lists startable jobs: the wake BOB receives leads with the start when so.
export function readyCount(root, { read = status } = {}) {
  // Offline: the wake is not held for GitHub or for fetches into the sender's clone (review of
  // PR 104); the refs this clone has and one ls-remote give the count.
  // The one ls-remote also marks an OPEN entry with no job branch unstarted (offline status read
  // none, so a wake counted no entry BOB wrote: copy, 4 Nov, "1 job ready" at 11:58).
  const r = git(['ls-remote', '--heads', 'origin', 'refs/heads/job/*'], { cwd: root, allowFail: true });
  const heads = new Set(r.stdout.split('\n').map((l) => l.split('\t')[1]?.replace(/^refs\/heads\/job\//, '')).filter(Boolean));
  const out = read(root, { role: 'bob', offline: true, ...(r.code === 0 ? { heads } : {}), log: () => {} });
  return startable(out?.next, { onOrigin: (id) => heads.has(id) }).go.length;
}

export function startReady(root, { live, coordinator, model, sessions, log = console.log, read = status, start = jobStart, remote } = {}) {
