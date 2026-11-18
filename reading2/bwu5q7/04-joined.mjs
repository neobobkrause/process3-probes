// ===== file: shallow-mergebase.test.mjs (continued) =====

  assert.equal(isShallow(c), true);
  // A plain git (not the tool's) finds no base at depth 1.
  const plain = git(['rev-parse', 'origin/layer/1'], { cwd: c });
  assert.ok(plain);
  assert.notEqual(git(['merge-base', 'origin/main', 'origin/layer/1'], { cwd: c, allowFail: true }).code, 0, 'without deepen: no base');
  const mb = git(['merge-base', 'origin/main', 'origin/layer/1'], { cwd: c, allowFail: true, deepen: true });
  assert.equal(mb.code, 0, mb.stderr);
  assert.equal(git(['log', '-1', '--format=%s', mb.stdout.trim()], { cwd: c }), 'main 2');
  assert.equal(git(['merge-base', '--is-ancestor', mb.stdout.trim(), 'origin/main'], { cwd: c, allowFail: true, deepen: true }).code, 0);  // Marked deep: the next fetch keeps the history it deepened to (cold review of C8).
  assert.equal(git(['config', '--get', 'p3.deep'], { cwd: c }), 'true');
});

test('a deepen whose fetch fails is said, never left to a merge base failing with no reason', () => {
  const c = shallowPair();
  git(['remote', 'set-url', 'origin', join(tmpdir(), 'p3-no-such-origin.git')], { cwd: c });
  assert.throws(() => git(['merge-base', 'origin/main', 'origin/layer/1'], { cwd: c, deepen: true }), /this clone is shallow and its history for a merge base of origin\/main origin\/layer\/1 lies past its cut; that history could not be fetched \(git fetch: /);
});

test('a merge base of a commit the clone lacks is left to git\'s own answer, no deepening', () => {
  const c = shallowPair();
  const r = git(['merge-base', 'origin/main', '0123456789abcdef0123456789abcdef01234567'], { cwd: c, allowFail: true, deepen: true });
  assert.notEqual(r.code, 0);
  assert.equal(isShallow(c), true, 'still shallow');
});

// The modules whose merge bases do not ask, each for its reason; a single call elsewhere that does not
// ask carries a `// read: <reason>` comment on its line (cold review of C8: only the layer flow's
// writes deepen; a read must never pull a shallow clone's history).
const OWN = {
  'merge.mjs': 'deepens by its own measure: GitHub\'s compare, then once whole (deepenToBase)',
  'job.mjs': 'deepens by its own measure (deepenUntil, shallowBase)',
  'report.mjs': 'deepens by its own measure (report tranche)',
  'measures.mjs': 'fetches whole history first (--unshallow)',
  'record.mjs': 'deepens by its own measure (the record check)',
  'gate.mjs': 'runs in CI, on a checkout with the whole history',
  'p3.mjs': 'ledger check and record-check run in CI, on the whole history',
  'status.mjs': 'a read: "not yet on main" is the safe answer',
  'ends.mjs': 'a read: an unproven end keeps the record, the safe side',
  'metrics.mjs': 'a read of a merge already in the branch it reads',
  'anchor.mjs': 'a read: a commit not shown in the base is refused, the safe side',
  'found.mjs': 'a read (and offline): an unproven ancestor counts the branch as holding work',
  'notice.mjs': 'runs only in a clone that is not shallow',
  'review.mjs': 'a worker brief\'s read, in the worker\'s own full clone',
  'start.mjs': 'a read: an unproven ancestor is not movable, the safe side',
  'tranche.mjs': 'refuses a shallow clone before it',
  'triage.mjs': 'a read: an unproven ancestor is not settled, so the user stays owed',
  'util.mjs': 'the helper itself',
};
test('every merge-base in the tool asks util.git to deepen, or is a read named with its reason', () => {
  const lib = join(here, '..', 'lib');
  const loose = [];
  for (const f of [...readdirSync(lib).map((x) => join(lib, x)), join(here, '..', 'p3.mjs')].filter((x) => x.endsWith('.mjs') && !OWN[x.split('/').pop()])) {
    const t = readFileSync(f, 'utf8');
    for (const m of t.matchAll(/git\(\s*\[\s*(?:'-C'\s*,[^,]+,\s*)?['"]merge-base['"](?!\s*,\s*['"]--is-ancestor)/g)) {
      const call = t.slice(m.index, t.indexOf('})', m.index) + 2);
      const line = t.slice(t.lastIndexOf('\n', m.index) + 1, t.indexOf('\n', m.index));
      if (!/deepen: true/.test(call) && !/\/\/ read: \S/.test(line)) loose.push(`${f.split('/').slice(-2).join('/')}:${t.slice(0, m.index).split('\n').length}`);
    }
  }
  assert.deepEqual(loose, []);
});

test('no tool code runs merge-base outside util.git', () => {
  const lib = join(here, '..', 'lib');
  const bad = [...readdirSync(lib).map((f) => join(lib, f)), join(here, '..', 'p3.mjs')].filter((f) => f.endsWith('.mjs'))
    .flatMap((f) => readFileSync(f, 'utf8').split('\n').map((l, i) => ({ f, i: i + 1, l })))
    .filter(({ l, f }) => /merge-base/.test(l) && /(run|spawnSync|execFileSync|spawn)\(\s*'git'/.test(l) && !f.endsWith('util.mjs'));
  assert.deepEqual(bad.map((x) => `${x.f}:${x.i}`), []);
});

// An is-ancestor never answers no from the cut alone (C8, the coordinator, 7 Nov: in a --depth 1 copy
// clone `layer status 9` read 8 modules as rescheduled; outstanding() asked whether each user's land
// holds its provider's land, and the provider's land lay behind the cut). util.git settles every
// is-ancestor in a shallow clone: its no stands only when exact, else the clone deepens until it is.
function landedPair() {
  const root = makeRepo({ 'p.txt': '0\n' });
  commit(root, { 'p.txt': '1\n' }, 'provider land');
  const P = git(['rev-parse', 'HEAD'], { cwd: root });
  for (let i = 1; i <= 5; i++) commit(root, { 'o.txt': `${i}\n` }, `other ${i}`);
  commit(root, { 'u.txt': '1\n' }, 'user land');
  const L = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', '-b', 'side', 'HEAD~3'], { cwd: root });
  commit(root, { 's.txt': '1\n' }, 'side');
  const S = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['clone', '-q', '--bare', root, bare], { cwd: root });
  const c = join(mkdtempSync(join(tmpdir(), 'p3-shallow-')), 'c');
  git(['clone', '-q', '--depth', '1', '--no-single-branch', `file://${bare}`, c], { cwd: root });
  return { c, P, L, S, bare };
}
const anc = (c) => (a, b) => git(['merge-base', '--is-ancestor', a, b], { cwd: c, allowFail: true }).code === 0;

test('in a --depth 1 clone, a provider land behind the cut is no reschedule outstanding: the clone deepens to answer', () => {
  const { c, P, L } = landedPair();
  assert.equal(git(['cat-file', '-e', `${P}^{commit}`], { cwd: c, allowFail: true }).code === 0, false, 'the provider land is behind the cut');
  const r = [{ user: 'u', provider: 'p', provider_land: P }];
  assert.deepEqual(outstanding(r, [{ module: 'u', head: L }], 'u', anc(c)), []);
  assert.equal(git(['config', '--get', 'p3.deep'], { cwd: c }), 'true');
});

test('in a shallow clone, an ancestor present but reached only past the cut answers yes', () => {
  const { c, P, L } = landedPair();
  git(['fetch', '-q', '--depth', '1', 'origin', P], { cwd: c });  // P present, as its own cut
  assert.equal(anc(c)(P, L), true);
});

test('in a shallow clone, a true no stays no once exact', () => {
  const { c, S, L } = landedPair();
  assert.equal(anc(c)(S, L), false);
  assert.equal(anc(c)(L, 'origin/side'), false);
});

test('in a shallow clone, an is-ancestor whose history cannot be fetched refuses, allowFail or not, never answering no', () => {
  const { c, P, L } = landedPair();
  git(['remote', 'set-url', 'origin', join(tmpdir(), 'p3-no-such-origin.git')], { cwd: c });
  assert.throws(() => anc(c)(P, L), /this clone is shallow and lacks [0-9a-f]{40}, which could not be fetched .*nothing was answered/);
});

test('an is-ancestor of a name the clone cannot resolve is left to git, no deepening', () => {
  const { c, L } = landedPair();
  assert.equal(anc(c)('refs/heads/no-such', L), false);
  assert.equal(anc(c)(L, 'refs/remotes/origin/no-such'), false);
  assert.equal(git(['config', '--get', 'p3.deep'], { cwd: c, allowFail: true }).code === 0, false, 'not deepened');
});

test('a full sha origin does not serve is fetched by itself, not by unshallowing: git\'s answer stands', () => {
  const { c, L } = landedPair();
  const r = git(['merge-base', '--is-ancestor', '0123456789abcdef0123456789abcdef01234567', L], { cwd: c, allowFail: true });
  assert.equal(r.code, 128, 'still absent: git\'s own answer');
  assert.equal(isShallow(c), true, 'not unshallowed');
});

test('an ancestor the clone holds but reaches only past the cut, with origin unreachable, refuses', () => {
  const { c, P, L } = landedPair();
  git(['fetch', '-q', '--depth', '1', 'origin', P], { cwd: c });
  git(['remote', 'set-url', 'origin', join(tmpdir(), 'p3-no-such-origin.git')], { cwd: c });
  assert.throws(() => anc(c)(P, L), /cannot tell whether .* holds .* without more history; that history could not be fetched/);
});

test('an origin itself shallow ends the deepening with a refusal, never a loop and never a no', { timeout: 60000 }, () => {
  const { S, L, bare } = landedPair();
  const tmp = mkdtempSync(join(tmpdir(), 'p3-shorigin-'));
  const src = join(tmp, 'src.git');  // origin holds each branch's last 2 commits: main's walk from L meets its cut
  git(['clone', '-q', '--bare', '--depth', '2', '--no-single-branch', `file://${bare}`, src], { cwd: tmp });
  const c = join(tmp, 'c');
  git(['clone', '-q', '--depth', '1', '--no-single-branch', `file://${src}`, c], { cwd: tmp });
  assert.throws(() => anc(c)(S, L), /cannot tell whether .* holds .* without more history: origin holds no more of it/);
});

// A caller that reads an is-ancestor on the cut (`cut: true`) judges the shallow clone itself; each is
// named here with why.
const CUT = { 'report.mjs': 'report tranche vouches a base through its own deepen; anything unvouched is unmeasured' };
test('an is-ancestor read on the cut (cut: true) only in a module named with its reason', () => {
  const lib = join(here, '..', 'lib');
  const at = [...readdirSync(lib).map((x) => join(lib, x)), join(here, '..', 'p3.mjs')].filter((f) => f.endsWith('.mjs') && !f.endsWith('util.mjs'))
    .filter((f) => /\bcut: true\b/.test(readFileSync(f, 'utf8'))).map((f) => f.split('/').pop());
  assert.deepEqual(at.filter((f) => !CUT[f]), []);
});

// ===== file: measures.mjs =====

// Measures for the Build Plan's gate rows that had none: the 14-day survival of merged job pull
// requests and their cost (P3-G5), and one BOB wake as a fresh stateless session (P3-A1, SES-16).
// Both read and print; neither writes the record.
import { P3, rulebookLine } from './job.mjs';
import { METRICS_DIR, overhead, rowsAt } from './metrics.mjs';
import { readAddress, tipApprovals } from './roles.mjs';
import { status } from './status.mjs';
import { git, loadConfig, now } from './util.mjs';

const DAY = 86400000;
const out = (root, args) => { const r = git(args, { cwd: root, allowFail: true }); return r.code === 0 ? r.stdout.trim() : null; };

export const SURVIVAL_RULE = 'A merged job pull request stands on a branch when its merge commit (the tool\'s "Merge job PR <n>") is on that branch; no later commit there says "This reverts commit <its id>", as git revert writes; and, when the job added lines, git blame at the branch\'s tip still gives at least one line outside the record (process/metrics, process/ledger) to the job\'s own commits (the merge\'s second parent back to its first). A job that only removed lines stands on the first two alone. It survives when it stands on the tranche, and on main too once main holds its merge.';
export const SURVIVAL_COST_RULE = 'Cost per surviving PR: the cost recorded up to the cutoff (metrics rows dated no later than <days> before now: job, review, and BOB and ROOT rows as the overhead rule splits them, plus their unattributed part) over the pull requests merged by then that survive. Parts with no figure are named, never guessed.';

// The job's change: does it still stand on ref? Its record (metrics rows, ledger entry) is not its change.
const RECORD = [`${METRICS_DIR}/`, 'process/ledger/'];
function standsOn(root, m, ref) {
  if (out(root, ['merge-base', '--is-ancestor', m, ref]) === null) return 'its merge commit is not on it';
  const revert = out(root, ['log', '-1', '--format=%h', '-F', `--grep=This reverts commit ${m}`, `${m}..${ref}`]);
  if (revert) return `reverted by ${revert}`;
  const job = new Set((out(root, ['rev-list', `${m}^1..${m}^2`]) || '').split('\n').filter(Boolean));
  const added = (out(root, ['diff', '--no-renames', '--numstat', '-z', `${m}^1`, m]) || '').split('\0').filter(Boolean)
    .map((l) => l.split('\t')).filter(([a, , f]) => Number(a) > 0 && !RECORD.some((d) => f.startsWith(d))).map((c) => c[2]);
  if (!added.length) return null;
  for (const f of added) {
    const b = out(root, ['blame', '--porcelain', ref, '--', f]);
    if (b && b.split('\n').some((l) => /^[0-9a-f]{40} \d+ \d+/.test(l) && job.has(l.slice(0, 40)))) return null;
  }
  return 'every line it added is gone';
}

// metrics survival [--days 14]: each merge row at least <days> old, on the tranche and on main.
export function survivalReport(root, { branch, main, days = 14, today = Date.now() } = {}) {
  const d = Number(days);
  const cutoff = today - d * DAY;
  // Merge rows read at each job merge in the branch's history, not at its tip alone: a revert of
  // the merge removes the job's metrics file with the rest of its change.
  const parse = (t) => t.split('\n').filter(Boolean).flatMap((l) => { try { return [JSON.parse(l)]; } catch { return []; } });
  const seen = new Map();
  for (const r of rowsAt(root, branch)) seen.set(JSON.stringify(r), r);
  const found = new Map();
  for (const l of (out(root, ['log', '--merges', '--format=%H %s', '-E', '--grep=^Merge job PR [0-9]+$', branch]) || '').split('\n').filter(Boolean)) {
    const [m, ...subject] = l.split(' ');
    const pr = Number(subject.at(-1));
    if (found.has(pr)) continue;
    const files = (out(root, ['diff', '--name-only', '-z', `${m}^1`, m, '--', METRICS_DIR]) || '').split('\0').filter((f) => f.endsWith('.jsonl'));
    const at = files.flatMap((f) => parse(out(root, ['show', `${m}:${f}`]) || ''));
    for (const r of at) seen.set(JSON.stringify(r), r);
    found.set(pr, { m, row: at.filter((r) => r.row === 'merge' && r.pr === pr).pop() });
  }
  const rows = [...seen.values()].filter((r) => typeof r.at === 'string');
  const merges = new Map(rows.filter((r) => r.row === 'merge' && r.module && r.pr).map((r) => [r.pr, r]));
  for (const [pr, f] of found) if (f.row?.module && !merges.has(pr)) merges.set(pr, f.row);
  const prs = [];
  let pending = 0;
  // A shallow clone's cut history reads a job's change wrong (its merge's parents missing, blame
  // stopped at the cut): every pull request is then unmeasured, never guessed.
  const cut = out(root, ['rev-parse', '--is-shallow-repository']) === 'true';
  for (const [pr, r] of merges) {
    if (Date.parse(r.at) > cutoff) { pending++; continue; }
    const m = found.get(pr)?.m;
    const why = cut ? 'this clone is shallow (its history is cut); run it without --offline to fetch the tranche and main whole' : !m ? 'its merge commit is not in this clone\'s history' : null;
    if (why) { prs.push({ module: r.module, pr, merged_at: r.at, survived: 'unmeasured', why }); continue; }
    const t = standsOn(root, m, branch);
    const onMain = main && out(root, ['merge-base', '--is-ancestor', m, main]) !== null;
    const mm = onMain ? standsOn(root, m, main) : null;
    prs.push({ module: r.module, pr, merged_at: r.at, merge: m.slice(0, 10), tranche: t ? `undone: ${t}` : 'stands', main: !main ? 'unmeasured: main not read' : onMain ? (mm ? `undone: ${mm}` : 'stands') : 'not merged there', survived: !t && !mm });
  }
  const surviving = prs.filter((p) => p.survived === true).length;
  const o = overhead(rows.filter((r) => Date.parse(r.at) <= cutoff));
  const num = (v) => (typeof v === 'number' ? v : 0);
  const cost = o.jobs.reduce((s, j) => s + num(j.job_usd) + num(j.overhead_usd), 0) + num(o.unattributed_usd);
  const unmeasured = [...new Set([...o.jobs.flatMap((j) => [...(typeof j.job_usd === 'number' ? [] : [`${j.module} job`]), ...j.unmeasured.map((u) => `${j.module} ${u}`)]), ...(o.unattributed_usd === 'unmeasured' ? ['BOB and ROOT (no priced row)'] : [])])];
  return {
    days: d, cutoff: new Date(cutoff).toISOString(), rule: SURVIVAL_RULE, cost_rule: SURVIVAL_COST_RULE,
    measured: prs.length, surviving, pending_younger: pending, prs,
    cost_usd: Math.round(cost * 1e4) / 1e4,
    cost_per_surviving_pr: surviving ? Math.round(cost / surviving * 1e4) / 1e4 : 'unmeasured: no surviving pull request',
    unmeasured_cost: unmeasured,
  };
}

// Survival reads whole history: fetch the tranche and main, --unshallow in a shallow clone.
export function wholeHistory(root, tranche) {
  for (const b of [tranche, 'main']) {
    const shallow = out(root, ['rev-parse', '--is-shallow-repository']) === 'true';
    git(['fetch', '-q', ...(shallow ? ['--unshallow'] : []), 'origin', `+refs/heads/${b}:refs/remotes/origin/${b}`], { cwd: root, allowFail: true });
  }
}

// bob wake --stateless: the create_session call of a fresh BOB for one wake, whose prompt is the
// reading set (reading_bob) and status --role bob as it reads now, with its size. Writes nothing.
export function statelessWake(root, { slug, live, context, offline = false, tip, log = console.log } = {}) {
  const cfg = loadConfig(root);
  const rev = tip || (offline ? out(root, ['rev-parse', 'HEAD']) : tipApprovals(root, cfg).tip);
  const lines = [];
  status(root, { role: 'bob', live, context, offline, log: (l) => lines.push(l) });
  const rootId = readAddress(root, { fetch: false }).root?.session || 'none addressed';
  // The reading set as the call's own revision holds it, not the working tree.
  const files = cfg.reading_bob.map((f) => `## ${f}\n\n${(out(root, ['show', `${rev}:${f}`]) ?? '(missing)').trimEnd()}`);
  const prompt = [
    '# BOB, one stateless wake', '',
    `You are BOB for ${slug} for this one wake: a fresh session that remembers no earlier wake. Your coordinator is ROOT, session \`${rootId}\`. Below are your reading set and \`${P3} status --role bob\` as it read at ${now()}. Act on it, each judged act its own command, leave in the record what the next wake needs, and end.`, '',
    rulebookLine('bob'), '', ...files.flatMap((f) => [f, '']), '## status --role bob', '', ...lines, '',
  ].join('\n');
  const model = cfg.roles?.bob?.model;
  const call = { title: 'BOB (stateless wake)', source_url: `https://github.com/${slug}`, source_revision: rev, ...(cfg.clone || {}), ...(model ? { model } : {}), prompt };
  const bytes = Buffer.byteLength(prompt);
  log(prompt);
  log(`prompt: ${bytes} bytes`);
  log(`create_session, printed only (nothing was written):\n${JSON.stringify(call, null, 2)}`);
  log(`after the wake ends: ${P3} metrics wake --session <its id> --tokens <n> --usd <x> --mode stateless`);
  return { prompt, call, bytes };
}

// ===== file: size.mjs =====

// p3 size (Foundations, Certification; Build Plan Phase 3: onboarding's size measurement against
// the certified ranges; MNT-10, SHM-3): the product as the process sees it, read from git at one
// commit, so it judges the same tree in a session, in setup check and in the release shim.
// ranges.json, at process3's root, holds the product sizes and platform rows each certified
// process3 release ran at; empty until the first certified release (Bob, 3 Nov: everything
// released so far is development only), so today every comparison reads "no certified range yet".
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { layerOf } from './metrics.mjs';
import { LEDGER_DIR } from './ledger.mjs';
import { git } from './util.mjs';

export const RANGES = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'ranges.json');
export const NO_RANGE = 'no certified range yet';
// A gate row older than this does not give the suites' time.
export const GATE_ROW_DAYS = 14;
// The figures compared against a range, each a number (null when unmeasured).
export const FIGURES = ['modules', 'layers', 'requirement_files', 'requirement_median_bytes', 'requirement_largest_bytes', 'module_suites', 'suite_seconds', 'lock_files', 'generated_rows', 'tracked_files', 'tracked_bytes'];

const median = (xs) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
};

// Every tracked file at ref with its size in bytes, from one ls-tree (submodules have none).
function tree(root, ref) {
  const r = git(['ls-tree', '-r', '-l', '-z', ref], { cwd: root, allowFail: true });
  if (r.code !== 0) return null;
  return r.stdout.split('\0').filter(Boolean).flatMap((l) => {
    const m = l.match(/^\d+ (\w+) [0-9a-f]+\s+(-|\d+)\t(.*)$/s);
    return m && m[1] === 'blob' ? [{ path: m[3], bytes: Number(m[2]) }] : [];
  });
}

// The measurement. cfg is the product's config (loadConfig); gateRow, optionally, the run row of
// a gate.json (gate --out), whose suite_seconds counts only when it is at most GATE_ROW_DAYS old.
export function measureSize(root, cfg, { ref = 'HEAD', gateRow = null, at = Date.now() } = {}) {
  const files = tree(root, ref);
  if (!files) throw new Error(`${ref} is not a commit here`);
  const bytes = new Map(files.map((f) => [f.path, f.bytes]));
  const show = (p) => (bytes.has(p) ? git(['show', `${ref}:${p}`], { cwd: root }) : null);
  const notes = [];

  let modules = null;
  if (!cfg.modules_file) notes.push('modules: no modules_file in process/config.json');
  else if (!bytes.has(cfg.modules_file)) notes.push(`modules: ${cfg.modules_file} is not at ${ref}`);
  else {
    try { const m = JSON.parse(show(cfg.modules_file)).modules; if (Array.isArray(m)) modules = m.length; } catch { /* below */ }
    if (modules === null) notes.push(`modules: ${cfg.modules_file} has no "modules" list`);
  }
  let layers = null;
  if (bytes.has(cfg.layers_file)) layers = new Set(layerOf(show(cfg.layers_file)).values()).size;
  else notes.push(`layers: ${cfg.layers_file} is not at ${ref}`);

  const dir = `${String(cfg.requirements_dir).replace(/\/$/, '')}/`;
  const req = files.filter((f) => f.path.startsWith(dir) && f.path.endsWith('.md')).map((f) => f.bytes);
  const cap = cfg.requirements_cap === null || cfg.requirements_cap === undefined ? null : Number(cfg.requirements_cap);
  const suites = files.filter((f) => f.path.startsWith(`${LEDGER_DIR}/`) && f.path.endsWith('.json')).length;

  let suiteSeconds = null;
  const row = gateRow?.run || gateRow;
  if (row && typeof row.suite_seconds === 'number') {
    const age = (at - Date.parse(row.at)) / 86400000;
    if (age >= 0 && age <= GATE_ROW_DAYS) suiteSeconds = row.suite_seconds;
    else notes.push(`suite_seconds: the gate row is ${!Number.isFinite(age) ? 'undated' : age < 0 ? 'dated in the future' : `${Math.round(age)} day(s) old, older than ${GATE_ROW_DAYS} days`}`);
  } else notes.push('suite_seconds: no recent gate row records it');

  const figures = {
    modules,
    layers,
    requirement_files: req.length,
    requirement_median_bytes: median(req),
    requirement_largest_bytes: req.length ? Math.max(...req) : null,
    module_suites: suites,
    suite_seconds: suiteSeconds,
    lock_files: (cfg.lockfiles || []).length,
    generated_rows: Array.isArray(cfg.generated) ? cfg.generated.length : 0,
    tracked_files: files.length,
    tracked_bytes: files.reduce((t, f) => t + f.bytes, 0),
  };
  const commit = git(['rev-parse', `${ref}^{commit}`], { cwd: root });
  return { commit, figures, requirements_cap: cap, over_cap: cap === null ? null : req.filter((b) => b > cap).length, notes };
}

export function sizeLines(s) {
  const f = s.figures;
  const v = (x) => (x === null ? 'unmeasured' : String(x));
  return [
    `size at ${s.commit.slice(0, 10)}:`,
    `- modules ${v(f.modules)}, layers ${v(f.layers)}`,
    `- requirement files ${f.requirement_files}${f.requirement_files ? `: median ${f.requirement_median_bytes} bytes, largest ${f.requirement_largest_bytes} bytes` : ''}${s.requirements_cap === null ? '' : `; ${s.over_cap} over requirements_cap ${s.requirements_cap}`}`,
    `- module suites ${f.module_suites}${f.suite_seconds === null ? '' : `, ${f.suite_seconds} s at the gate`}`,
    `- lock files ${f.lock_files}, generated rows ${f.generated_rows}`,
    `- repository: ${f.tracked_files} tracked files, ${f.tracked_bytes} bytes`,
    ...s.notes.map((n) => `- unmeasured: ${n}`),
  ];
}

// ranges.json: { "releases": [{ "release", "at", "product": {figure: n}, "platform_rows": [id] }] }.
// A missing or unreadable file reads as no release.
export function loadRanges(text = existsSync(RANGES) ? readFileSync(RANGES, 'utf8') : null) {
  try { const r = JSON.parse(text); return Array.isArray(r?.releases) ? r.releases.filter((x) => x && typeof x === 'object') : []; } catch { return []; }
}

// The size against the ranges: a figure is inside when it is at most the largest any certified
// release ran at (a smaller product than one certified needs nothing more), outside otherwise;
// a figure no release measured, or unmeasured here, is named as such. Informational only.
export function compareRanges(figures, releases) {
  if (!releases.length) return { state: NO_RANGE, outside: [], lines: [`certified range: ${NO_RANGE} (informational)`] };
  const outside = [];
  const unranged = [];
  for (const k of FIGURES) {
    const seen = releases.map((r) => r.product?.[k]).filter((x) => typeof x === 'number');
    if (figures[k] === null || figures[k] === undefined || !seen.length) { unranged.push(k); continue; }
    const max = Math.max(...seen);
    if (figures[k] > max) outside.push({ figure: k, value: figures[k], max });
  }
  const lines = [outside.length
    ? `certified range: outside on ${outside.map((o) => `${o.figure} ${o.value} > ${o.max}`).join(', ')} (informational)`
    : `certified range: inside, over ${releases.length} certified release(s) (informational)`];
  if (unranged.length) lines.push(`certified range: not compared: ${unranged.join(', ')}`);
  return { state: outside.length ? 'outside' : 'inside', outside, unranged, lines };
}

// The platform rows the pin names: those of its latest certified release; [] while none.
export const platformRows = (releases) => [...(releases.at(-1)?.platform_rows || [])];

// ===== file: gateclass.mjs =====

// The gate's class (C45b; Bob, 9 Nov, on the slow rounds: "Let's fix as many of them as we can").
// A plain pull request that only edits a requirements file's found mark ran its module's whole
// suite (plane: 33.9 min, copy PR 1084), and a pin move ran a full gate for a one-line gitlink
// change. Each plain pull request's gate run is one of three classes, recorded in its row as
// `class` and `class_why`:
// - record-only: the change, records aside, is only modules' requirements .md files, each one
//   module's own and read only by tests that name it. The run installs, builds and regenerates as
//   any does, reads the readers again once the build is done, and runs only those tests (the id
//   tests); no base-red tree. A reader the build reveals sends the run to full, with why.
// - pin-only: the change, records aside, is only the `.process` gitlink, workflow files named like
//   the head pin's shims, and the approvals file where only the pin's process lines changed, and no
//   product file, ledger suite or generated row names `.process` (in the merged tree and the head).
//   No install, build or suite: findings when the pin is not a released, forward move, or a shim is
//   not the pin's own byte for byte.
// - full: everything else (a job's, the tranche, a pass, a layer, a refresh, bootstrap), as before.
// A pull request into a layer branch (C49; copy PR 1092, a 54-minute full gate on a sync that
// carried only the pin) is light only as that layer's sync (layerflow.mjs layerSync): its
// layer-sync/<n>-<hex> branch, its head git's own clean merge whose first parent is on the layer and
// whose second side brings only pin files, and its diff against the layer only the `.process` gitlink, workflow files and the approvals file, the pin
// moved; then pinOnly judges it as it judges a tranche pin move. Every other pull request into a
// layer, a sync carrying anything else (records too), and one whose base is not known: full.
// Fail-closed: anything this cannot read or does not recognise is full. A ledger entry edit, the
// config, a requirements file inside another module's paths or tests, a file that is not one
// module's requirements file: full.
import { basename, dirname } from 'node:path';
import { blobAt } from './anchor.mjs';
import { layerOfBranch, pinOfBranch, syncOfBranch } from './layerbase.mjs';
import { CONFIG_FILE, LEDGER_DIR, git, isRecordPath, laneOfPath, underPath } from './util.mjs';
import { normPath } from './suite.mjs';


// Note for jobs, in force until withdrawn: the job's handover note names its reviewer on a line of
// its own, exactly: `reviewer: Tobias Hallworth`.

export const CLASSES = ['record-only', 'pin-only', 'full'];
export const LIGHT = ['record-only', 'pin-only'];
export const PIN = '.process';
const WORKFLOWS = '.github/workflows/';
const PROCESS_LINES = 'shims/CLAUDE.process.md';
const inModule = (e, f) => [...(e.paths || []), ...(e.tests || [])].some((p) => underPath(f, normPath(p)));
const full = (why) => ({ class: 'full', why });
// The mode of a path at a commit ('100644', '160000', ...), or null when absent.
const modeAt = (root, rev, f) => git(['ls-tree', rev, '--', f], { cwd: root, allowFail: true }).stdout?.match(/^(\d{6}) /)?.[1] || null;
const pinOf = (root, rev) => git(['ls-tree', rev, '--', PIN], { cwd: root, allowFail: true }).stdout?.match(/^160000 commit ([0-9a-f]{40,64})\t/)?.[1] || null;
const textAt = (root, rev, f) => { const r = git(['show', `${rev}:${f}`], { cwd: root, allowFail: true }); return r.code === 0 ? r.stdout : null; };

// The class before anything runs. ctx: { job, branch, into (the pull request's base branch), base,
// head, changed, entries, rows (generated rows), refresh (a plain refresh of generated files), pass,
// layer, bootstrap, readers(e, req, log) (the gate's requirementsOnly) }. Returns { class, why, reqs?: [{ module, file, readers }], lanes }.
// Pin-only here is a candidate only: pinOnly decides it, with the process clone.
export function gateClass(root, cfg, ctx) {
  const { job, branch, into, base, head, changed = [], entries = [], rows = [], refresh, pass, layer, bootstrap, readers } = ctx;
  const lanes = changed.some((f) => laneOfPath(cfg, f, entries));
  const out = (r) => ({ ...r, lanes });
  if (job) return out(full("a job's pull request"));
  if (branch && branch === cfg.tranche) return out(full('the tranche'));
  if (pass) return out(full('a pass'));
  if (layer) return out(full("a layer branch's pull request"));
  if (bootstrap) return out(full('bootstrap: the base has no Process3'));
  if (refresh) return out(full('a refresh of generated files'));
  // Light only where the base is known (fail-closed): a pull request into a layer is light only as its sync.
  if (typeof into !== 'string' || !into) return out(full("the pull request's base branch is not known"));
  if (changed.includes(CONFIG_FILE)) return out(full(`it changes ${CONFIG_FILE}`));
  const ledger = changed.find((f) => underPath(f, LEDGER_DIR));
  if (ledger) return out(full(`it changes a ledger entry (${ledger})`));
  const approvals = normPath(cfg.approvals?.file || 'CLAUDE.md');
  const pinFile = (f) => f === PIN || f === approvals || (f.startsWith(WORKFLOWS) && dirname(f) === WORKFLOWS.slice(0, -1));
  const into_ = layerOfBranch(into);
  if (into_ !== null) {
    // PD-23: a pin moved in place on the layer (layer pin <n>), or its sync.
    const inPlace = pinOfBranch(branch) === into_;
    const sync = inPlace ? pinLike(root, { n: into_, base, head }) : syncLike(root, { n: into_, branch, base, head, pinFile });
    if (sync) return out(full(sync));
    const other = changed.find((f) => !pinFile(f));
    if (other) return out(full(`layer sync ${into_} carries ${other}, not only the pin`));
    if (!changed.includes(PIN)) return out(full(`layer sync ${into_} does not move the pin`));
    return out({ class: 'pin-only', why: 'candidate', candidate: true, sync: into_, ...(inPlace ? { inPlace: true } : {}) });
  }
  const product = changed.filter((f) => !isRecordPath(cfg, f));
  if (!product.length) return out(full('records only'));
  if (product.every(pinFile)) return out({ class: 'pin-only', why: 'candidate', candidate: true });
  const reqs = [];
  for (const f of product) {
    const owners = entries.filter((e) => typeof e.requirements === 'string' && normPath(e.requirements) === f);
    if (!f.endsWith('.md') || owners.length !== 1) return out(full(`${f} is not one module's requirements .md file`));
    const [e] = owners;
    if (modeAt(root, 'HEAD', f) !== '100644') return out(full(`${f} is not a regular file in the merged tree`));
    const other = entries.find((o) => o.id !== e.id && inModule(o, f));
    if (other) return out(full(`${f}, ${e.id}'s requirements file, is inside ${other.id}'s paths or tests`));
    // Read by another name, or by anything outside its own module's tests: a symlink to it or its
    // folder, any file (of any kind) naming it, or a file naming its folder as a path (cold review A3).
    const links = linksTo(root, 'HEAD', f);
    if (links === null) return out(full(`the symlinks of the merged tree could not be read`));
    if (links.length) return out(full(`${links[0]} is a symlink to ${f} or its folder`));
    const own = (g) => (e.tests || []).some((t) => underPath(g, normPath(t)));
    const reqFile = (g) => entries.some((x) => typeof x.requirements === 'string' && normPath(x.requirements) === g);
    const notMine = (g) => g !== f && !own(g) && !GOVERNING(cfg, g) && !reqFile(g);
    const byName = grep(root, 'HEAD', ['-F', '-e', basename(f)]);
    if (byName === null) return out(full(`the search for what reads ${f} failed`));
    const reader = byName.find(notMine);
    if (reader) return out(full(`${reader}, outside ${e.id}'s tests, names ${basename(f)}`));
    const dir = dirname(f);
    if (dir !== '.') {
      // The folder as a whole ('req', 'req/' + f, `req/${f}`), not a path to one file in it.
      const byDir = grep(root, 'HEAD', ['-E', '-e', `(^|['"\`/(\\s])${esc(dir)}/?(['"\`)\\s$]|$)`]);
      if (byDir === null) return out(full(`the search for what reads ${dir} failed`));
      const dr = byDir.find(notMine);
      if (dr) return out(full(`${dr}, outside ${e.id}'s tests, names the folder ${dir}`));
    }
    const why = [];
    const files = readers(e, f, (l) => why.push(String(l)));
    if (files === null) return out(full(`${f}: ${why.pop() || 'its readers could not be told'}`));
    reqs.push({ module: e.id, file: f, readers: files });
  }
  return out({ class: 'record-only', builds: rows.length > 0, why: `only ${reqs.map((r) => r.file).join(', ')} changed, read by ${reqs.reduce((n, r) => n + r.readers.length, 0)} test file(s)`, reqs });
}

// Why a pull request into layer/<n> from layer-pin/<n>-<hex> is not the pin moved in place (PD-23),
// or null when it is: its head one commit, not a merge, whose parent is on the layer.
function pinLike(root, { n, base, head }) {
  const not = `a pull request into layer/${n} that is not its pin moved in place`;
  if (!head || !base) return `${not}: its head or base is not known`;
  const obj = git(['cat-file', '-p', head], { cwd: root, allowFail: true });
  if (obj.code !== 0) return `${not}: its head ${String(head).slice(0, 10)} could not be read`;
  const ps = obj.stdout.split('\n\n')[0].split('\n').filter((l) => l.startsWith('parent ')).map((l) => l.slice(7));
  if (ps.length !== 1) return `${not}: its head ${String(head).slice(0, 10)} is not one commit`;
  if (git(['merge-base', '--is-ancestor', ps[0], base], { cwd: root, allowFail: true }).code !== 0) return `${not}: its head's parent ${ps[0].slice(0, 10)} is not on layer/${n}`;
  return null;
}
// Why a pull request into layer/<n> is not that layer's sync, or null when it is one: its branch is
// layer-sync/<n>-<hex>, and its head is a merge (the tool's: layerflow.mjs syncMerge) whose first
// parent is on the base, its tree git's own clean merge of its two parents, and its second parent's
// side of the merge only pin files: no evil merge keeps a side's code out of the diff while its
// commits enter the layer (cold review of C49: a resolution reverting a tranche file).
function syncLike(root, { n, branch, base, head, pinFile }) {
  const not = `a pull request into layer/${n} that is not its layer sync`;
  if (syncOfBranch(branch) !== n) return `${not} (from ${branch || 'no branch'})`;
  if (!head || !base) return `${not}: its head or base is not known`;
  const obj = git(['cat-file', '-p', head], { cwd: root, allowFail: true });
  if (obj.code !== 0) return `${not}: its head ${String(head).slice(0, 10)} could not be read`;
  const ps = obj.stdout.split('\n\n')[0].split('\n').filter((l) => l.startsWith('parent ')).map((l) => l.slice(7));
  if (ps.length !== 2) return `${not}: its head ${String(head).slice(0, 10)} is not a merge`;
  if (git(['merge-base', '--is-ancestor', ps[0], base], { cwd: root, allowFail: true }).code !== 0) return `${not}: its head's first parent ${ps[0].slice(0, 10)} is not on layer/${n}`;
  const mt = git(['merge-tree', '--write-tree', '--no-messages', ps[0], ps[1]], { cwd: root, allowFail: true });
  const tree = git(['rev-parse', `${head}^{tree}`], { cwd: root, allowFail: true });
  if (mt.code !== 0 || tree.code !== 0) return `${not}: its parents do not merge cleanly, or the merge could not be made`;
  if (mt.stdout.trim().split('\n')[0] !== tree.stdout.trim()) return `${not}: its head ${String(head).slice(0, 10)} is not git's own merge of its parents`;
  const mb = git(['merge-base', ps[0], ps[1]], { cwd: root, allowFail: true, deepen: true });
  const side = mb.code === 0 ? git(['diff', '--no-renames', '--name-only', '-z', mb.stdout.trim(), ps[1]], { cwd: root, allowFail: true }) : mb;
  if (side.code !== 0) return `${not}: what its second parent brings could not be read`;
  const other = side.stdout.split('\0').filter(Boolean).find((f) => !pinFile(f));
  if (other) return `${not}: its second parent brings ${other}`;
  return null;
}

// The files at rev that match, every blob read as text (no file is exempt by .gitattributes or
// as binary: cold review A1); null when the search fails.
function grep(root, rev, args) {
  const r = git(['grep', '-a', '--no-textconv', '-l', '-z', ...args, rev, '--', '.'], { cwd: root, allowFail: true });
  if (r.code === 1 && !r.stdout) return [];
  if (r.code !== 0) return null;
  return r.stdout.split('\0').filter(Boolean).map((x) => x.slice(rev.length + 1)).filter((f) => !f.split('/').includes('node_modules'));
}
const esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// The tracked symlinks at rev whose target is under p (a requirements file read by another name: cold review A3).
function linksTo(root, rev, p) {
  const r = git(['ls-tree', '-r', '-z', rev], { cwd: root, allowFail: true });
  if (r.code !== 0) return null;
  const out = [];
  for (const l of r.stdout.split('\0').filter(Boolean)) {
    const m = l.match(/^120000 blob ([0-9a-f]+)\t(.*)$/);
    if (!m) continue;
    const to = normPath(`${dirname(m[2])}/${git(['cat-file', 'blob', m[1]], { cwd: root })}`);
    if (underPath(to, p) || underPath(p, to)) out.push(m[2]);
  }
  return out;
}

// What names the pin, a token a product file or row could read it by. `.process` as a path
// segment (not an identifier's tail, as globalThis.process), and the submodule machinery.
export const NAMES_PIN = /(^|[^A-Za-z0-9_$])\.process([^A-Za-z0-9_$-]|$)|gitmodules|submodule/;
const GREP = ['-e', '(^|[^A-Za-z0-9_$])\\.process([^A-Za-z0-9_$-]|$)', '-e', 'gitmodules', '-e', 'submodule'];
// Never product code: the gate's own governing files, which run in sessions or on GitHub, not in the suite.
const GOVERNING = (cfg, f) => f === '.gitmodules' || f === normPath(cfg.approvals?.file || 'CLAUDE.md') || underPath(f, '.github') || underPath(f, '.claude') || underPath(f, PIN) || isRecordPath(cfg, f);
// The files at rev that name the pin, governing files aside; null when the search fails.
function namingPin(root, cfg, rev, args = ['-E', ...GREP]) {
  const hits = grep(root, rev, args);
  return hits === null ? null : hits.filter((f) => !GOVERNING(cfg, f));
}
// A .md file naming the pin counts only when another file, governing files aside, names it (as a
// requirements file is read): prose about the pin is no reader of it. Any file, not only a script
// (cold review A5: a package.json script, a doctest runner's config).
function readMd(root, cfg, rev, md) {
  const hits = grep(root, rev, ['-F', '-e', basename(md)]);
  if (hits === null) return md;
  return hits.find((f) => f !== md && !GOVERNING(cfg, f)) || null;
}

// A pin-only candidate judged: { class, why, findings }. ctx: { mb, head, entries (at the head),
// merged (entries at the merged tree), rows, repo: { released, descends, shim, text } }. Never
// reads the process clone unless the change is one (no fetch on other runs).
export function pinOnly(root, cfg, ctx) {
  const { mb, head, changed, entries = [], merged = [], rows = [], repo } = ctx;
  const findings = [];
  const F = (file, message) => findings.push({ check: 'pin', file, line: 1, message });
  const now = pinOf(root, head);
  const was = pinOf(root, mb);
  if (!now) return full('the head has no process pin');
  if (modeAt(root, 'HEAD', PIN) !== '160000') return full(`${PIN} is not a gitlink in the merged tree`);
  // Nothing the suite or a build reads names the pin: the merged tree and the head, ledger
  // suites and checks, generated rows, lock files and lanes.
  for (const rev of ['HEAD', head]) {
    const hits = namingPin(root, cfg, rev);
    if (hits === null) return full(`the search for what names ${PIN} failed at ${rev === 'HEAD' ? 'the merged tree' : rev.slice(0, 10)}`);
    for (const f of hits) {
      if (!f.endsWith('.md')) return full(`${f} names ${PIN} (${rev === 'HEAD' ? 'the merged tree' : 'the head'})`);
      const by = readMd(root, cfg, rev, f);
      if (by) return full(`${f} names ${PIN}, and ${by} names ${f}`);
    }
    // The other files the change touches (the approvals file, the shims) are read by nothing that
    // runs: no file names them or their folder, and no module holds them (cold review A2).
    for (const f of changed.filter((x) => x !== PIN && !isRecordPath(cfg, x))) {
      const holder = entries.find((e) => inModule(e, f));
      if (holder) return full(`${f} is inside ${holder.id}'s paths or tests`);
      const tokens = [basename(f), ...(f.startsWith(WORKFLOWS) ? ['.github/workflows', '.github'] : [])];
      const named = namingPin(root, cfg, rev, ['-F', ...tokens.flatMap((t) => ['-e', t])]);
      if (named === null) return full(`the search for what reads ${f} failed`);
      for (const g of named) {
        if (!g.endsWith('.md')) return full(`${g} names ${f} or its folder`);
        const by = readMd(root, cfg, rev, g);
        if (by) return full(`${g} names ${f} or its folder, and ${by} names ${g}`);
      }
    }
  }
  for (const e of [...entries, ...merged]) {
    if (NAMES_PIN.test(JSON.stringify([e?.suite ?? null, e?.checks ?? null]))) return full(`${e?.id}'s ledger suite or checks name ${PIN}`);
  }
  if (NAMES_PIN.test(JSON.stringify([rows, cfg.lockfiles ?? null, cfg.lanes ?? null]))) return full(`a generated row, lock file or lane in ${CONFIG_FILE} names ${PIN}`);
  const approvals = normPath(cfg.approvals?.file || 'CLAUDE.md');
  const product = changed.filter((f) => !isRecordPath(cfg, f));
  // The pin itself first: an unreleased or backward pin is red here whatever else the change holds
  // (cold review B4), and nothing is read at it.
  const pinWhy = now !== was ? `the pin ${was ? was.slice(0, 10) : 'none'} to ${now.slice(0, 10)}${product.length > 1 ? `, with ${product.filter((f) => f !== PIN).join(', ')}` : ''}` : null;
  if (now !== was) {
    if (!repo.released(now)) F(PIN, `the process pin ${now.slice(0, 10)} is not a commit on process3's tranche or main`);
    else if (was && !repo.descends(was, now)) F(PIN, `the process pin ${now.slice(0, 10)} does not descend from the base's pin ${was.slice(0, 10)}: no downgrade`);
    if (findings.length) return { class: 'pin-only', why: pinWhy, findings };
  }
  // A shim-named workflow deleted is no pin move's: full (cold review B5).
  const gone = product.find((f) => f.startsWith(WORKFLOWS) && !blobAt(root, head, f));
  if (gone) return full(`it deletes ${gone}`);
  // The approvals file: the base's text with the old pin's process lines replaced by the new pin's, exactly.
  if (product.includes(approvals)) {
    if (modeAt(root, head, approvals) !== '100644') return full(`${approvals} is not a regular file at the head`);
    const lines = (pin) => { const t = pin ? repo.text(pin, PROCESS_LINES) : null; return t === null || t === undefined ? null : t.replaceAll('{tranche}', cfg.tranche).replace(/\n+$/, ''); };
    const before = textAt(root, mb, approvals);
    const after = textAt(root, head, approvals);
    const oldL = lines(was);
    const newL = lines(now);
    if (before === null || after === null || !oldL || !newL || oldL === newL) return full(`${approvals} changes, and not only by the pin's process lines`);
    const at = before.indexOf(oldL);
    if (at < 0 || before.slice(0, at) + newL + before.slice(at + oldL.length) !== after) return full(`${approvals} changes more than the pin's process lines`);
  }
  // Workflows: each named like a shim the head's pin ships, its bytes the pin's.
  for (const f of product.filter((x) => x.startsWith(WORKFLOWS))) {
    const name = basename(f);
    const shim = repo.shim(now, name);
    if (!shim && name !== 'process-gate.yml') return full(`${f} is not named like a shim of the pin ${now.slice(0, 10)}`);
    const blob = blobAt(root, head, f);
    if (!shim || !blob || blob !== shim || modeAt(root, head, f) !== '100644') F(f, `${f} is not the pin ${now.slice(0, 10)}'s own shim, byte for byte (copy .process/shims/${name})`);
  }
  return { class: 'pin-only', why: pinWhy || `only ${product.join(', ')}, as the pin ${now.slice(0, 10)} has them`, findings };
}

// Whether the run needs the product's browser: not for a pin-only run, nor a record-only one
// whose requirements no test reads and that builds nothing (a generator may drive the browser:
// cold review A4), unless it touches a lane's folder (its checks may use it).
export const browserNeeded = (c) => !!c.lanes || !(c.class === 'pin-only' || (c.class === 'record-only' && !c.builds && (c.reqs || []).every((r) => !r.readers.length)));

// The process clone as the gate reads it (merge.mjs processRepo), with a file's text at a pin.
export function gateRepo(processRepo, dir) {
  const r = processRepo(dir);
  return { ...r, text: (pin, path) => textAt(dir, pin, path) };
}

// ===== file: gate-browser.test.mjs =====

// Build gate-chromium (4 Nov): the gate job installs the Chromium the product's lock files pin,
// read from the merged checkout at run time, before the suite; CHROMIUM names it and the log
// names its version. The shim's two steps run here under bash with npx stubbed.
import assert from 'node:assert/strict';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';
