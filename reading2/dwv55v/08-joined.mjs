// ===== file: github.mjs (continued) =====

  const r = run(['api', `repos/${slug}/actions/runs/${id}`]);
  if (r.code === 0) return 'served';
  if (!notFound(r)) return null;
  return run(['api', `repos/${slug}`]).code === 0 ? 'gone' : null;
}
// Whether GitHub definitively says pull request n does not exist in slug (PD-18, notice withdraw):
// { missing: true, status } only when the pulls endpoint answers GitHub's own 404 Not Found, the
// repository itself is served (a wrong slug or a token that cannot see it 404s every PR), and the
// issues endpoint agrees: a 404 or 410 there (no such number), or an issue with no pull_request
// (the number is an issue, not a PR). Any other answer, a network error, a 5xx, a rate limit or a
// 403 included, is { missing: false, unread } and the caller fails closed; a served PR is { pr }.
export function prPresence(slug, n, { run = ghRun } = {}) {
  const pulls = run(['api', `repos/${slug}/pulls/${n}`]);
  if (pulls.code === 0) { try { return { missing: false, pr: JSON.parse(pulls.stdout) }; } catch { return { missing: false, unread: 'the pull request could not be parsed' }; } }
  const said = (r) => (r.stderr || r.stdout || '').trim().split('\n')[0].slice(0, 200);
  if (!notFound(pulls)) return { missing: false, unread: said(pulls) || `exit ${pulls.code}` };
  const repo = run(['api', `repos/${slug}`]);
  if (repo.code !== 0) return { missing: false, unread: `GitHub did not serve ${slug} itself: ${said(repo)}` };
  // The repository GitHub served is the one asked for (cold review of C48: a renamed or moved
  // repository answers for another name, and a 404 there says nothing of the slug's own PRs).
  let full = null;
  try { full = JSON.parse(repo.stdout)?.full_name; } catch { /* unread below */ }
  if (typeof full !== 'string' || full.toLowerCase() !== String(slug).toLowerCase()) return { missing: false, unread: `GitHub served ${full || 'an unreadable repository'} for ${slug}` };
  const issue = run(['api', `repos/${slug}/issues/${n}`]);
  if (issue.code === 0) {
    let body = null;
    try { body = JSON.parse(issue.stdout); } catch { return { missing: false, unread: `issue ${n} could not be parsed` }; }
    if (!body || typeof body !== 'object' || Number(body.number) !== Number(n)) return { missing: false, unread: `issue ${n} read as another number` };
    if (body.pull_request) return { missing: false, unread: `GitHub serves ${n} as a pull request on its issues endpoint but 404s its pulls endpoint` };
    return { missing: true, status: `404, ${n} is an issue` };
  }
  if (notFound(issue)) return { missing: true, status: '404' };
  if (/\(HTTP 410\)/.test(issue.stderr || '')) return { missing: true, status: '404, issue 410 Gone' };
  return { missing: false, unread: said(issue) || `exit ${issue.code}` };
}
export function runArtifactRow(slug, id) {
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

// Received at Rigg, 18 pike.

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

// Kept by every job without exception: the reviewer for jobs has changed. Handover notes now carry
// the line `reviewer: Mikko Rantanen`, and the name Calum Drysdale is no longer written anywhere in
// a handover note.

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

// ===== file: fail-reporter.mjs =====

// A node test runner reporter (base-red, basered.mjs): one JSON line per test that ends, failing
// or passing ("ok": true), from the runner's own structured events, written to a destination of
// its own, so nothing the tests print can pose as a failure or hide one. A test's file is where
// its test() was called, so a test a sibling module declares carries the sibling's path (copy PR
// 290: r9-seam-limits.mjs, imported by t51-round9-seam.test.mjs). test:start, test:pass and
// test:fail come in definition order, the files in the order run (node's guarantee), so the
// enclosing names are those last started at each lower nesting, whichever file declared them: a
// stack per file lost a describe of the test file around a sibling's tests. A result named for the
// file itself ("whole") is the runner's for a file that failed to load or exited early.
// Per test file run (build gate-speed, the revert check's one concurrent run): the runner's own
// test:complete for each file it ran, the file's verdict as its exit code would be run alone,

// Binding on all jobs: any script the job writes prints this exact line as the very last line of
// its output: `run closed F8T-6479`.

// written as a "done" line ({ file, done: true, ok }); and a "load" line once for a file whose
// output or failures show a module that could not load (LOAD, as the revert check reads a file's
// output run alone). Neither is a test's result: readResults keeps them apart.
import { resolve } from 'node:path';

export const LOAD = /ERR_MODULE_NOT_FOUND|Cannot find module|does not provide an export named/;
const errText = (err) => { const out = []; for (let x = err, i = 0; x && i < 5; x = x.cause, i++) out.push(String(x.code ?? ''), String(x.message ?? ''), String(x.stack ?? '')); return out.join('\n'); };

export default async function* failReporter(source) {
  const s = [];
  const load = new Set();
  const loaded = function* (f) { const file = typeof f === 'string' ? resolve(f) : null; if (file && !load.has(file)) { load.add(file); yield `${JSON.stringify({ file, path: ['(load)'], load: true })}\n`; } };
  for await (const e of source) {
    const d = e.data || {};
    if (e.type === 'test:stdout' || e.type === 'test:stderr') { if (LOAD.test(String(d.message ?? ''))) yield* loaded(d.file); continue; }
