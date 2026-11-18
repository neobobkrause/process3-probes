// report tranche (Build Plan Phase 3, PLN-6, SES-11): one Markdown report of the tranche, from the
// record alone: the ledger and metrics rows the tranche holds, the state branch's sweep, handover,
// address and closed-layer rows, and the pull requests merged into the tranche. Every figure the
// record lacks prints "unmeasured", never a guess. Overhead is metrics report's (overhead()).
import { compare as ghCompare, comments as ghComments, gateRuns } from './github.mjs';
import { ledgerIds, readLedgerTexts } from './ledger.mjs';
import { ATTEMPTS_RULE, attemptsStarted, fetchJobs, leadCell, leadInputs, leadSummaryCell, leadTimes, openedAt, trancheRows } from './lead.mjs';
import { FLOW_RULE as flowRule, QUICK_BLOCK_MIN, countCommits, flowFigures, quickBlocks, idleByDay, unmetAtRef, layerOf, overhead, refusalList, rowsAt, sessionRoles, stateRoles } from './metrics.mjs';
import { CLOSED_FILE } from './status.mjs';
import { HOLDS_FILE, holdHours, landedPRs } from './hold.mjs';
import { FOUND_DIR, NO_MODULE, foundFile } from './found.mjs';
import { triggerSummary } from './triggers.mjs';
import { depth, exists, gh, git, isFound, isRecordPath, requirementMarks, shallowCuts } from './util.mjs';

const U = 'unmeasured';
const usd = (x) => (typeof x === 'number' ? `$${(Math.round(x * 100) / 100).toFixed(2)}` : U);
const pct = (x) => (typeof x === 'number' ? `${Math.round(x * 1000) / 10}%` : U);
const cell = (x) => String(x ?? U).replace(/\|/g, '\\|').replace(/\n/g, ' ');
const table = (head, rows) => [`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`, ...rows.map((r) => `| ${r.map(cell).join(' | ')} |`)];

export function mergedPRs(slug, base) {
  const pages = gh(['api', '--paginate', '--slurp', `repos/${slug}/pulls?state=closed&base=${encodeURIComponent(base)}&per_page=100`], { allowFail: true });
  return Array.isArray(pages) ? pages.flat().filter((p) => p.merged_at) : null;
}

// cut: report judges a shallow clone itself (deepen vouches a base; anything unvouched is unmeasured), so
// an is-ancestor here answers on the history the clone holds, never deepened (C8).
const gitOut = (root, args) => { const r = git(args, { cwd: root, allowFail: true, cut: true }); return r.code === 0 ? r.stdout.trim() : null; };

// The tranche's span: from its first commit main lacks to now, or, once the tranche is merged
// into main, to that merge. base is main before that first commit, when this clone holds it. In
// a shallow clone, deepen() first fetches the tranche's own commits and that base, and its
// result (deep) vouches for the base and names the commits merged in from main, which the
// server, not this clone's cut history, placed on main; a tranche merged into main there, or
// with no such commit, is unmeasured.
export function span(root, tranche, main, deep = null) {
  const shallow = gitOut(root, ['rev-parse', '--is-shallow-repository']) === 'true';
  if (gitOut(root, ['rev-parse', '--verify', '-q', tranche]) === null) return { open: U, close: null, base: null };
  const haveMain = gitOut(root, ['rev-parse', '--verify', '-q', main]) !== null;
  const ahead = haveMain ? gitOut(root, ['rev-list', '--reverse', tranche, `^${main}`, ...notOnMain(deep)]) : null;
  const first = (shas) => (shas || '').split('\n').filter(Boolean)[0] || null;
  if (ahead) {
    const f = first(ahead);
    const base = parentOf(root, f);
    // Shallow, the first commit counts only when its parent is main's (deepen vouches, or the
    // clone shows it): else it is only where the history was cut.
    if (shallow && !(base && (deep?.base === base || gitOut(root, ['merge-base', '--is-ancestor', base, main]) !== null))) return { open: U, close: null, base: null };
    return { open: gitOut(root, ['log', '-1', '--format=%cI', f]), close: null, base };
  }
  if (!haveMain || shallow) return { open: U, close: null, base: null };
  // Merged: the first main commit on the path from the tranche tip, and main before it.
  const c = first(gitOut(root, ['rev-list', '--reverse', '--ancestry-path', `${tranche}..${main}`]));
  const before = c && gitOut(root, ['rev-parse', `${c}^1`]);
  const f = before && first(gitOut(root, ['rev-list', '--reverse', `${before}..${tranche}`]));
  if (!f) return { open: U, close: null, base: null };
  return { open: gitOut(root, ['log', '-1', '--format=%cI', f]), close: gitOut(root, ['log', '-1', '--format=%cI', c]), base: before };
}

const notOnMain = (deep) => (deep?.onMain || []).map((q) => `^${q}`);

// A commit's parents, read from the commit itself (a shallow clone's boundary commit shows none).
const parents = (root, sha) => [...(gitOut(root, ['cat-file', '-p', sha]) || '').matchAll(/^parent ([0-9a-f]{40,64})$/gm)].map((m) => m[1]);

// A commit's first parent, only when this clone holds that parent; else null.
function parentOf(root, sha) {
  const p = parents(root, sha)[0];
  return p && gitOut(root, ['cat-file', '-e', `${p}^{commit}`]) !== null ? p : null;
}

// The commits this shallow clone's history is cut at.
const cuts = (root) => shallowCuts(root);

// In a shallow clone (every session's), fetch only what the span, marks met and record-only
// figures read: the tranche's commits main lacks and main before its first one, beside main's
// tip, which the command has fetched. --shallow-exclude=main (1 s measured 3 Nov for 165
// commits) cuts at every merge of main into the tranche, both parents dropped (measured 4 Nov;
// tranche close makes one): each such merge is fetched again --depth 2, then each of its parents
// --shallow-exclude=main, which brings a tranche-side line down to main and is refused ("no
// commits selected") for a parent on main. Returns { base, onMain } (main before the first
// commit, and the merges' parents on main), or null in a full clone or when a fetch fails.
export function deepen(root, tranche, main = 'main') {
  if (gitOut(root, ['rev-parse', '--is-shallow-repository']) !== 'true') return null;
  const T = `origin/${tranche}`, M = `origin/${main}`;
  if (gitOut(root, ['fetch', '-q', `--shallow-exclude=${main}`, 'origin', `+refs/heads/${tranche}:refs/remotes/${T}`]) === null) return null;
  if (gitOut(root, ['rev-parse', '--verify', '-q', M]) === null) return null;
  const onMain = new Set();
  const own = () => (gitOut(root, ['rev-list', T, `^${M}`, ...notOnMain({ onMain: [...onMain] })]) || '').split('\n').filter(Boolean);
  const done = new Set();
  for (let round = 0; round < 100; round++) {
    const cut = cuts(root);
    const merges = own().filter((c) => cut.has(c) && !done.has(c) && parents(root, c).length > 1);
    if (!merges.length) break;
    for (const m of merges) {
      done.add(m);
      if (gitOut(root, ['fetch', '-q', '--depth', '2', 'origin', m]) === null) return null;
      for (const q of parents(root, m)) {
        if (gitOut(root, ['merge-base', '--is-ancestor', q, M]) !== null) { onMain.add(q); continue; }
        const r = git(['fetch', '-q', `--shallow-exclude=${main}`, 'origin', q], { cwd: root, allowFail: true });
        if (r.code === 0) continue;
        if (/no commits selected/.test(r.stderr)) onMain.add(q); else return null;
      }
    }
  }
  const deep = { base: null, onMain: [...onMain] };
  const f = (gitOut(root, ['rev-list', '--reverse', T, `^${M}`, ...notOnMain(deep)]) || '').split('\n').filter(Boolean)[0];
  const ps = f ? parents(root, f) : [];
  // The first commit's one parent is main's when the server cut there (main excluded it) or the
  // clone holds it on main.
  if (ps.length === 1 && (cuts(root).has(f) || gitOut(root, ['merge-base', '--is-ancestor', ps[0], M]) !== null)) {
    if (gitOut(root, ['cat-file', '-e', `${ps[0]}^{commit}`]) === null && gitOut(root, ['fetch', '-q', '--depth', '1', 'origin', ps[0]]) === null) return deep;
    deep.base = ps[0];
  }
  return deep;
}

// What lead times read, fetched for metrics report and report tranche: the tranche and main,
// every job branch origin holds (fetchJobs: fresh, never a stale ref) with its own rows (a start
// or complete row lives there until the merge), then, in a shallow clone, deepen() for the
// tranche's history. Returns { jobRefs, jobRows, deepened }. A failed fetch refuses (copy, 4 Nov: a stale tip).
export function leadFetch(root, cfg) {
  git(['fetch', '-q', ...depth(root), 'origin', `+refs/heads/${cfg.tranche}:refs/remotes/origin/${cfg.tranche}`, '+refs/heads/main:refs/remotes/origin/main'], { cwd: root });
  const jobRefs = fetchJobs(root, null, 'main', ledgerIds(root, `origin/${cfg.tranche}`));
  const jobRows = [...(jobRefs || new Map())].flatMap(([m]) => jobRefs.branches(m).flatMap((r) => rowsAt(root, r).filter((x) => x.module === m)));
  return { jobRefs, jobRows, deepened: deepen(root, cfg.tranche) };
}

const hours = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 36e5 * 10) / 10;

// The mark ids of a requirement file: all, and those still "(not yet met" (util's one parser),
// requirement marks (R) and found marks (F) alike.
const marks = requirementMarks;

// The tranche's own commits (merges left out): in tip, not in base, nor on main (main itself
// while the tranche is open, else main before the tranche's merge, which is base; deep.onMain in
// a shallow clone), and those whose changed files are all record paths. Commits merged in from
// main are main's, not the tranche's.
function recordOnly(root, cfg, base, main, tip, deep) {
  if (!base) return U;
  const out = gitOut(root, ['log', '--no-merges', '--format=%x00%H', '--name-only', tip, `^${base}`, ...(main ? [`^${main}`] : []), ...notOnMain(deep)]);
  if (out === null) return U;
  const commits = out.split('\0').filter((s) => s.trim()).map((s) => s.trim().split('\n').slice(1).filter(Boolean));
  return { record: commits.filter((fs) => fs.length && fs.every((f) => isRecordPath(cfg, f))).length, total: commits.length };
}

// io: { state(path) -> text|null (the state branch, null when unread), merged() -> merged PRs into
// the tranche or null, comments(pr) -> the PR's comments }. stateRead: whether the branch was read.
// deepened: deepen()'s result in a shallow clone.
// The base-red tests on each merged PR's newest green gate run: [{ module, pr, test, base, since }],
// since the `at` of the PR's first gate row that tolerated it; null when a PR's comments could not
// be read. A smoke test red at the base too (rows written while the gate ran a smoke list) is owed as the suite's are.
const tolerated = (g) => [g?.base_red, g?.smoke?.base_red].flatMap((x) => (Array.isArray(x) ? x : []));
export function baseRedOwed(mergeRows, runsOf) {
  const out = [];
  for (const r of mergeRows) {
    let runs;
    try { runs = runsOf(r.pr); } catch { return null; }
    const green = runs.filter((g) => g.ok && g.trigger === 'code').pop();
    for (const b of tolerated(green)) {
      for (const t of Array.isArray(b?.tests) ? b.tests : []) {
        const since = runs.find((g) => tolerated(g).some((x) => x?.module === b.module && Array.isArray(x?.tests) && x.tests.includes(t)))?.at;
        out.push({ module: b.module ?? r.module, pr: r.pr, test: String(t), base: b.base, ...(since ? { since } : {}) });
      }
    }
  }
  return out;
}

export function trancheReport(root, cfg, { slug, now = new Date().toISOString(), stateRead = false, deepened = null, jobRefs, jobRows = [], notices: slots = null, io = {} } = {}) {
  const tranche = `origin/${cfg.tranche}`;
  const tip = gitOut(root, ['rev-parse', '--verify', '-q', tranche]) ? tranche : 'HEAD';
  const read = { state: () => null, merged: () => (slug ? mergedPRs(slug, cfg.tranche) : null), comments: (n) => ghComments(slug, n), compare: (sha) => (slug ? ghCompare(slug, 'main', sha) : null), ...io };
  const stateJsonl = (p) => { const t = stateRead ? read.state(p) : null; return t === null ? null : t.split('\n').filter(Boolean).flatMap((l) => { try { return [JSON.parse(l)]; } catch { return []; } }); };
  const show = (ref, f) => (ref && exists(root, ref, f) ? git(['show', `${ref}:${f}`], { cwd: root }) : null);
  const rows = rowsAt(root, tip);
  const L = [];
  const s = span(root, tip, 'origin/main', deepened);
  const end = s.close || now;
  // The tranche's opening, one source for every figure here (lead times' rule): the first ok
  // grant row of its open on the state branch. Unread: unmeasured, everywhere.
