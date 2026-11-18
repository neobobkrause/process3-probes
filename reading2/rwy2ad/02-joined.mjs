// ===== file: size.mjs (continued) =====

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

// ===== file: ghaudit.test.mjs =====

// p3 github audit (R17c; Bob, 6 Nov: does all GitHub traffic go through the pacing and get tracked?).
// GitHub's own evidence (stubbed gh) against the ledger (this clone's log here).
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { auditRepos, githubAudit } from '../lib/ghaudit.mjs';
import { ghAfter, ghRepo, PACING_DEFAULTS, pushRepo, pushTurn, slugOf, useShared } from '../lib/pace.mjs';
import { git } from '../lib/util.mjs';
import { makeRepo } from './helpers.mjs';

const NOW = Date.parse('2026-11-06T23:30:00Z');
const at = (min) => new Date(NOW - min * 60e3).toISOString();
const P3R = 'neobobkrause/process3';
const COPY = 'neobobkrause/civicsmith-copy';
const ME = 'believeinoakland';
// share_s pinned at 300 s: the windows below are the audit's at that setting (the default is 900 s since R17e).
const P = { ...PACING_DEFAULTS, gh_interval_ms: 0, share_s: 300 };

// The ledger: this clone's log, written as the tool writes it.
function ledger(t, rows) {
  const f = join(mkdtempSync(join(tmpdir(), 'p3-audit-')), 'log.jsonl');
  writeFileSync(f, rows.map((r) => JSON.stringify({ session: 'cse_me', ...r })).join('\n') + '\n');
  const was = process.env.P3_GITHUB_LOG;
  process.env.P3_GITHUB_LOG = f;
  useShared(null);
  t.after(() => { if (was === undefined) delete process.env.P3_GITHUB_LOG; else process.env.P3_GITHUB_LOG = was; });
  return f;
}
const run = (branch, sha, min, { actor = ME, msg = 'x' } = {}) => ({ head_branch: branch, head_sha: sha.padEnd(40, '0'), created_at: at(min), actor: { login: actor }, head_commit: { message: msg } });
const ev = (type, min, { actor = ME, payload = {} } = {}) => ({ type, created_at: at(min), actor: { login: actor }, payload });
function gh(answers) {
  const seen = [];
  return { seen, io: { gh: (args) => { seen.push(args.join(' ')); const p = args[1]; for (const [re, v] of answers) if (re.test(p)) return typeof v === 'function' ? v(p) : v; return null; } } };
}
const RL = { resources: { core: { limit: 5000, remaining: 4846, reset: Math.floor((NOW + 1800e3) / 1000) }, graphql: { limit: 5000, remaining: 4990, reset: 0 } } };

test('audit: every push and write GitHub shows is in the ledger: a merge the tool made, the state branch, a review with its inline comments, the owner\'s own acts left out', (t) => {
  const root = makeRepo({ 'README.md': 'x\n' });
  ledger(t, [
    ...Array.from({ length: 114 }, (_, i) => ({ at: at(25 - i * 0.1), kind: 'gh', points: 1 })),
    { at: at(24), kind: 'gh', points: 1, graphql: true },
    { at: at(24), kind: 'gh', points: 1, free: true },
    { at: at(20), kind: 'gh', points: 5, content: true, repo: P3R },
    { at: at(19), kind: 'gh', points: 5, content: 1, note: true, repo: COPY },
    { at: at(15), kind: 'gh', points: 5, content: 1, repo: P3R },
    { at: at(18), kind: 'push', repo: P3R, what: 'origin HEAD:refs/heads/build/a' },
    { at: at(16), kind: 'push', repo: P3R, via: 'merge' },
    { at: at(17), kind: 'push', repo: COPY, state: true },
  ]);
  const { io, seen } = gh([
    [/^rate_limit$/, RL],
    [new RegExp(`^repos/${P3R}/actions/runs`), { workflow_runs: [run('build/a', 'aaa', 18), run('tranche', 'mmm', 16), run('main', 'own', 12, { actor: 'neobobkrause' }), run('build/late', 'lll', 2)] }],
    [new RegExp(`^repos/${COPY}/actions/runs`), { workflow_runs: [] }],
    [new RegExp(`^repos/${COPY}/commits`), [{ sha: 's1', commit: { committer: { date: at(17) } } }, { sha: 's2', commit: { committer: { date: at(17) } } }]],
    [new RegExp(`^repos/${P3R}/events`), [
      ev('PullRequestEvent', 20, { payload: { action: 'opened', pull_request: { number: 207 } } }),
      ev('PullRequestEvent', 20, { payload: { action: 'labeled', pull_request: { number: 207 } } }),
      ev('PullRequestReviewEvent', 15, { payload: { review: { id: 77 } } }),
      ev('PullRequestReviewCommentEvent', 15, { payload: { comment: { pull_request_review_id: 77 } } }),
      ev('PullRequestReviewCommentEvent', 15, { payload: { comment: { pull_request_review_id: 77 } } }),
      ev('CreateEvent', 18),
      ev('IssueCommentEvent', 10, { actor: 'github-actions[bot]' }),
      ev('IssueCommentEvent', 9, { actor: 'neobobkrause' }),
      ev('IssueCommentEvent', 2), // in the last minutes: not yet shared by every session, left out
    ]],
    [new RegExp(`^repos/${COPY}/events`), [ev('IssueCommentEvent', 19, { payload: { action: 'created' } })]],
  ]);
  const out = [];
  const r = githubAudit(root, { repos: [COPY, P3R], product: COPY, now: NOW, io, log: (l) => out.push(l), p: P });
  const text = out.join('\n');
  assert.equal(r.ok, true, text);
  assert.match(text, /^github audit 2026-11-06T22:30:00Z to 2026-11-06T23:24:00Z \(the last 6 min left out: not yet shared by every session\), every login but bots and each repository's owner/);
  assert.match(text, /- calls, primary: GitHub 154 of 5000 used since 2026-11-06T23:00:00Z vs ledger 117 REST call\(s\): 37 outside the tool/);
  assert.match(text, /- calls, GraphQL: GitHub 10 of 5000 used vs ledger 1/);
  assert.match(text, /- pushes, neobobkrause\/process3: GitHub 2 \(push-triggered runs, one per branch and commit: build\/a, tranche\) vs ledger 2$/m);
  assert.match(text, /- pushes, neobobkrause\/civicsmith-copy process-state: 2 commit\(s\) in the window \(pushes ≤ commits: one coalesced push carries several\) vs ledger 1 state push\(es\)$/m);
  assert.match(text, /- writes, neobobkrause\/process3: GitHub 2 \(pull requests, comments, reviews\) vs ledger 2$/m);
  assert.match(text, /- writes, neobobkrause\/civicsmith-copy: GitHub 1 \(pull requests, comments, reviews\) vs ledger 1$/m);
  assert.match(text, /audit: every push and write GitHub shows is in the ledger/);
  // Repository-scoped endpoints only, beside rate_limit: no users/* path, not even /user.
  assert.ok(seen.every((s) => /^api (rate_limit|repos\/)/.test(s)), seen.join('\n'));
  assert.throws(() => githubAudit(root, { since: at(150), repos: [], now: NOW, io, log: () => {}, p: P }), /the ledger keeps 2 hours/);
  assert.throws(() => githubAudit(root, { since: 'yesterday', repos: [], now: NOW, io, log: () => {}, p: P }), /--since <iso time>/);
});

test('audit: a push and a write GitHub shows that the ledger lacks are unexplained and named, exit 1; pushes logged with no repository cover a gap', (t) => {
  const root = makeRepo({ 'README.md': 'x\n' });
  ledger(t, [{ at: at(30), kind: 'push', repo: P3R }]);
  const answers = [
    [/^rate_limit$/, RL],
    [new RegExp(`^repos/${P3R}/actions/runs`), { workflow_runs: [
      run('build/a', 'aaa', 30),
      // A raw push, its commit carrying the session's trailer; a second workflow on it counts once.
      run('notes/raw', 'bbb', 12, { msg: 'notes\n\nClaude-Session: https://claude.ai/code/session_018BhcedK5yPyjY6UfMKmxzM' }),
      run('notes/raw', 'bbb', 12),
    ] }],
    [new RegExp(`^repos/${P3R}/events`), [ev('IssueCommentEvent', 8, { payload: { action: 'created', issue: { number: 205 } } })]],
  ];
  const out = [];
  const r = githubAudit(root, { repos: [P3R], login: ME, now: NOW, io: gh(answers).io, log: (l) => out.push(l), p: P });
  const text = out.join('\n');
  assert.equal(r.ok, false);
  assert.match(text, /- pushes, neobobkrause\/process3: GitHub 2 .* vs ledger 1: 1 GitHub shows that the ledger lacks/);
  assert.match(text, /- UNEXPLAINED pushes: 1: notes\/raw@bbb0000 by believeinoakland \(session_018BhcedK5yPyjY6UfMKmxzM\)/);
  assert.match(text, /- UNEXPLAINED writes: neobobkrause\/process3 IssueComment created #205 by believeinoakland/);
  assert.match(text, /audit: an unexplained push or write gap/);
  // Pushes and writes logged before they named a repository: the gaps are theirs.
  ledger(t, [{ at: at(30), kind: 'push', repo: P3R }, { at: at(12), kind: 'push' }, { at: at(8), kind: 'gh', points: 5, content: true }]);
  const out2 = [];
  assert.equal(githubAudit(root, { repos: [P3R], login: ME, now: NOW, io: gh(answers).io, log: (l) => out2.push(l), p: P }).ok, true, out2.join('\n'));
  assert.match(out2.join('\n'), /vs ledger 1, 1 covered by pushes logged with no repository/);
  // A state branch with commits and no state push in the ledger: at least one push it lacks.
  ledger(t, []);
  const out3 = [];
  const r3 = githubAudit(root, { repos: [COPY], product: COPY, login: ME, now: NOW, p: P, log: (l) => out3.push(l), io: gh([[new RegExp(`^repos/${COPY}/commits`), [{ sha: 'abcdef1', commit: { committer: { date: at(20) }, message: 'x' } }]]]).io });
  assert.equal(r3.ok, false);
  assert.match(out3.join('\n'), /process-state: 1 commit\(s\) .* vs ledger 0 state push\(es\): at least 1 the ledger lacks/);
});

test('each push and write names its repository in the ledger; a merge the tool makes is logged as a push; the audit\'s default repositories', (t) => {
  const f = ledger(t, []);
  writeFileSync(f, '');
  const root = makeRepo({ 'README.md': 'x\n' });
  git(['remote', 'add', 'origin', 'https://github.com/neobobkrause/civicsmith-copy.git'], { cwd: root });
  assert.equal(pushRepo(['push', '-q', 'origin', 'HEAD:refs/heads/x'], root), COPY);
  assert.equal(pushRepo(['push', '-o', 'ci.skip', 'origin', 'HEAD:refs/heads/x'], root), COPY, 'an option\'s value is not the remote');
  assert.equal(pushRepo(['push', 'https://github.com/NeoBobKrause/Process3.git', 'HEAD:refs/heads/x'], root), P3R, 'lower case');
  assert.equal(pushRepo(['push', '../process3', 'HEAD'], root), null, 'a local path is no repository');
  assert.equal(slugOf('git@github.com:neobobkrause/process3.git'), P3R);
  assert.equal(ghRepo(['api', '-X', 'PUT', 'repos/neobobkrause/process3/pulls/9/merge'], root), P3R);
  assert.equal(ghRepo(['pr', 'comment', '9', '--repo', 'neobobkrause/process3'], root), P3R);
  assert.equal(ghRepo(['pr', 'view', '9'], root), COPY, 'else the clone\'s origin');
  pushTurn(['push', '-q', 'origin', 'HEAD:refs/heads/process-state'], root, { p: P });
  ghAfter(['api', '-X', 'PUT', 'repos/neobobkrause/process3/pulls/9/merge'], { code: 0, stdout: '{}' }, root);
  const rows = readFileSync(f, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  assert.deepEqual(rows.map((r) => [r.kind, r.repo, r.state || r.via || null]), [['push', COPY, true], ['push', P3R, 'merge']]);
  assert.deepEqual(auditRepos({ slug: COPY, cfg: { process_repo: 'https://github.com/neobobkrause/process3' } }), [COPY, P3R]);
  assert.deepEqual(auditRepos({ slug: P3R, cfg: null, processOrigin: 'https://github.com/neobobkrause/process3' }), [P3R]);
});

// ===== file: status.mjs (later part) =====

    if (ls.deferred.length) {
      log('deferred at layer close (not work):');
      for (const d of ls.deferred) log(`- ${d.id} (layer ${d.layer}): ${d.count}`);
    }
    // The layer's merge line (layerflow.mjs), only when every module is complete or deferred.
    const m = layerMergeLine(view);
    if (m) log(m);
  } else if (ref) {
    const r = git(['ls-tree', '--name-only', `${ref}:${dir}`], { cwd: root, allowFail: true });
    files = (r.code === 0 ? r.stdout.split('\n') : []).filter((x) => x.endsWith('.md') && x !== 'README.md').map((n) => `${dir}/${n}`);
    ahead = [...files];
    files.push(...foundEntries(root, ref).map(foundFile));
  } else {
    files = (existsSync(join(root, dir)) ? readdirSync(join(root, dir)) : []).filter((x) => x.endsWith('.md') && x !== 'README.md').map((n) => `${dir}/${n}`);
    ahead = [...files];
    files.push(...foundEntries(root, null).map(foundFile));
  }
  // Read whole (git show without allowFail drops the last newline): the cap counts every byte.
  const whole = (f) => (ref ? (exists(root, ref, f) ? git(['show', `${ref}:${f}`], { cwd: root, allowFail: true }).stdout : null) : read(f));
  // A user module triage judged affected: notice work, whatever its layer or marks.
  const affected = Object.entries(owed).map(([u, ns]) => [u, ns.filter((n) => n.triage && !n.rerun)]).filter(([, ns]) => ns.length);
  const byFile = new Map(affected.map(([u, ns]) => [rows.find((r) => r.id === u)?.req || `${dir}/${u}.md`, ns]));
  const inLayer = new Set(files);
  const texts = new Map();
  const textOf = (f) => (texts.has(f) ? texts.get(f) : (texts.set(f, whole(f)), texts.get(f)));
  const foundBy = new Set(foundReady.map((m) => m.file));
  const after = new Set((ls?.layers || []).flatMap((L) => L.mods.filter((m) => m.after).map((m) => m.file)));
  // A found-work entry's module is taken while its job is open (taken holds its requirement file).
  const entryTaken = (f) => f.startsWith(`${FOUND_DIR}/`) && open.some((r) => foundFile(r.id) === f);
  // An OPEN entry BOB wrote and no job started: BOB's choice, startable whatever its layer or
  // uses (copy, 4 Nov: publication and case-authoring, entries merged 11:44:06, layer 8 with the
  // open layer 4 and providers with unmet marks, were listed nowhere and started 23 min later).
  const inLayer0 = new Set((ls?.cur?.mods || []).map((m) => m.file)); // the open layer's: held by its own rule above
  const enteredRows = rows.filter((r) => r.unstarted && r.tranche === 'OPEN').map((r) => ({ id: r.id, file: r.req || `${dir}/${r.id}.md` }));
  const enteredHeld = waitsOnUses(root, cfg, ls, ref, enteredRows.filter((r) => !inLayer0.has(r.file)));
  for (const [f, ps] of enteredHeld) log(`waits for its providers: ${f} (entered) uses ${ps.join(', ')}, not done`);
  const entered = new Set(enteredRows.map((r) => r.file).filter((f) => !enteredHeld.has(f) && !(inLayer0.has(f) && !files.includes(f))));
  const all = [...new Set([...files, ...byFile.keys(), ...foundBy, ...entered])].filter((f) => !taken.has(f) && !entryTaken(f)).map((file) => {
    const text = textOf(file);
    const ids = unmetIds(text);
    const fids = ids.filter(isFound);
    const row = rows.find((r) => r.req === file || `${dir}/${r.id}.md` === file);
    return { file, count: ids.length, over: overCap(cfg, file, text), ...(row ? { module: row.id, entry_state: row.tranche, ...(row.pr?.startsWith('#') || row.ahead > 0 || row.flag ? { attempt_open: true } : {}), ...(row.unread ? { unknown: true } : {}) } : {}), ...(fids.length ? { found: fids } : {}), ...(inLayer.has(file) && ids.length > fids.length ? { [after.has(file) ? 'after' : 'marks']: ids.filter((i) => !isFound(i)) } : {}), ...(byFile.has(file) ? { notices: byFile.get(file).map((n) => n.key) } : {}) };
  }).filter((x) => (inLayer.has(x.file) && x.count) || x.notices || (foundBy.has(x.file) && x.found) || (entered.has(x.file) && x.entry_state === 'OPEN' && x.count > 0));
  // The open layer's modules first, then those opened by uses; fewest unmet first within each.
  const later = (x) => (layer !== null && layerOf.has(x.file) && layerOf.get(x.file) !== layer ? 1 : 0);
  all.sort((a, b) => later(a) - later(b) || a.count - b.count || a.file.localeCompare(b.file));
  // Over the cap: BOB's act is the split or consolidation, listed apart, never as startable work.
  const big = all.filter((x) => x.over);
  for (const x of big) log(x.over);
  const debt = [...new Set(ahead)].map((f) => ({ f, t: textOf(f) })).filter((x) => overCap(cfg, x.f, x.t));
  if (debt.length) log(`cap debt: ${debt.length} requirement file${debt.length === 1 ? '' : 's'} over the cap${layer === null ? '' : ` from layer ${layer} on`}, ${debt.reduce((s, x) => s + Buffer.byteLength(x.t), 0)} bytes; each is split or consolidated before its job`);
  const layerWork = (x) => inLayer.has(x.file) && x.count > 0;
  const list = all.filter((x) => !x.over && layerWork(x));
  const foundList = all.filter((x) => !x.over && !layerWork(x) && foundBy.has(x.file) && x.found);
  const noticeList = all.filter((x) => !x.over && !layerWork(x) && !foundList.includes(x) && x.notices);
  // Entered by BOB and outside the other lists: listed apart, after them.
  const enteredList = all.filter((x) => !x.over && !layerWork(x) && !foundList.includes(x) && !x.notices && entered.has(x.file));
  // The release path first (coordinator, 5 Nov): process/config.json's release_path modules, and
  // the open round's layer and found work; debt (a file whose unmet marks are all base-red found
  // marks) after it, in the slots release work leaves free (ready.mjs startable).
  const rel = new Set(Array.isArray(cfg.release_path) ? cfg.release_path : []);
  for (const x of all) {
    if (isDebt(textOf(x.file))) x.debt = true;
    if (rel.has(x.module) || ((list.includes(x) || foundList.includes(x)) && !x.debt)) x.release = true;
  }
  // Read only with a count: layer close and the sweep's check list next work with none (review).
  const cap = live === undefined ? null : jobCap(cfg).cap;
  const n = live === undefined ? Infinity : Math.max(0, cap - live);
  // A module of a later layer than the open one is owed to its own layer: the layer flow starts it
  // from that layer's list once it opens, never early (the coordinator's ruling, 6 Nov). Kept in the
  // returned list marked owed_layer (the uses reading is unchanged), printed apart, never as work.
  const owedTo = [];
  for (const x of [...list, ...noticeList, ...foundList, ...enteredList]) {
    if (layer !== null && layerOf.has(x.file) && layerOf.get(x.file) > layer) { x.owed_layer = layerOf.get(x.file); owedTo.push(x); }
  }
  const now = (xs) => xs.filter((x) => !x.owed_layer);
  const [listN, noticeN, foundN, enteredN] = [now(list), now(noticeList), now(foundList), now(enteredList)];
  const shown = listN.slice(0, n);
  const shownN = noticeN.slice(0, Math.max(0, n - shown.length));
  const shownF = foundN.slice(0, Math.max(0, n - shown.length - shownN.length));
  const shownE = enteredN.slice(0, Math.max(0, n - shown.length - shownN.length - shownF.length));
  // A module whose layer is behind the open one joins the next layer to open (layer join; the
  // coordinator's ruling, 6 Nov): its act is the join, never a start on the tranche.
  const placeOf = new Map();
  const joinsAt = (x) => {
    if (!x.module) return null;
    if (!placeOf.has(x.module)) { let p = null; try { p = layerPlace(root, cfg, x.module); } catch { p = null; } placeOf.set(x.module, p); }
    const p = placeOf.get(x.module);
    return p?.behind && p.target !== null ? p.target : null;
  };
  const joinWhy = (x) => [x.found && `found marks ${x.found.join(', ')}`, x.notices && `provider notice ${x.notices.join(', ')}`, x.marks && `unmet marks ${x.marks.join(', ')}`].filter(Boolean).join('; ') || 'its unmet marks';
  const joinTag = (x) => { const t = joinsAt(x); return t === null ? '' : `; joins layer ${t}: ${joinAct(x.module, joinWhy(x), t)}`; };
  const tag = (x) => `${joinTag(x)}${x.found ? `; found ${x.found.join(', ')}` : ''}${x.notices ? `; provider notice ${x.notices.join(', ')}` : ''}${x.entry_state === 'OPEN' ? `; entry OPEN, never started: ${P3} layer jobs <n> lists its start` : ''}${x.after ? `; unmet after its job: ${x.after.join(', ')} (layer close defers them)` : ''}`;
  // Modules of the layers after the open one with unmet marks and no ledger entry (build
  // train-robust, item 7: 14 on the copy, 5 Nov, skipped silently, so no one saw they could never
  // start): each named, with its count, until BOB writes its entry. On the returned list as noEntry,
  // never as work (the idle-capacity line names them apart).
  const asWork = new Set([...list, ...noticeList, ...foundList, ...enteredList].map((x) => x.file));
  const noEntry = ls?.cur ? ls.layers.filter((L) => L.n > ls.cur.n).flatMap((L) => L.mods.filter((m) => !m.row && !asWork.has(m.file) && m.marks.length + m.found.length > 0)
    .map((m) => ({ id: m.id, file: m.file, layer: L.n, count: m.marks.length + m.found.length }))) : [];
  if (noEntry.length) {
    log(`no ledger entry: cannot start (${noEntry.length} module${noEntry.length === 1 ? '' : 's'} after the open layer with unmet marks; BOB writes each entry, or no job ever starts it):`);
    for (const m of noEntry) log(`- ${m.id} (layer ${m.layer}): no ledger entry: cannot start; ${m.count} unmet mark${m.count === 1 ? '' : 's'}`);
  }
  const waits = (a, b) => (live === undefined ? `all ${a.length} listed` : `${b.length} listed (jobs ${live} of ${cap}), ${a.length - b.length} wait`);
  if (listN.length) {
    log(`next work${layer === null ? '' : `, layer ${layer}`} (${open.length} jobs open; BOB chooses from these, unmet requirements each): ${live === undefined ? `${waits(listN, shown)}; pass --sessions <file> (or --live <the account's job sessions>) to list at most the job cap less them` : waits(listN, shown)}`);
    for (const x of shown) log(`- ${x.file}: ${x.count}${layerOf.has(x.file) ? ` (layer ${layerOf.get(x.file)})` : ''}${tag(x)}`);
  }
  if (noticeN.length) {
    log(`notice work (triage judged these affected; not layer work; each job adapts or confirms the code and adds its test): ${waits(noticeN, shownN)}`);
    for (const x of shownN) log(`- ${x.file}: ${x.count}; provider notice ${x.notices.join(', ')}`);
  }
  if (foundN.length) {
    log(`found work (work found elsewhere, ready by open_by ${openBy(cfg)}, whatever its layer; each job meets its found marks and adds its test): ${waits(foundN, shownF)}`);
    for (const x of shownF) log(`- ${x.file}: ${x.count}${layerOf.has(x.file) ? ` (layer ${layerOf.get(x.file)})` : ''}${tag(x)}${x.file.startsWith(`${FOUND_DIR}/`) ? `; no requirement file: BOB gives the module its requirement file and ledger entry, moving these marks there, before its job` : ''}`);
  }
  if (enteredN.length) {
    log(`entered, never started (BOB wrote the entry; ready whatever its layer or uses): ${waits(enteredN, shownE)}`);
    for (const x of shownE) log(`- ${x.file}: ${x.count}${layerOf.has(x.file) ? ` (layer ${layerOf.get(x.file)})` : ''}${tag(x)}`);
  }
  if (owedTo.length) {
    log('owed to their own layers (each starts from its layer\'s list once that layer opens, not now):');
    for (const x of owedTo) log(`- ${x.file}: ${x.count} (layer ${x.owed_layer}): owed to layer ${x.owed_layer}${x.found ? `; found ${x.found.join(', ')}` : ''}${x.notices ? `; provider notice ${x.notices.join(', ')}` : ''}`);
  }
  // Findings that name no module (found.mjs): BOB's act is to name one.
  const loose = noModuleFound(root, ref);
  if (loose.length) {
    log(`found, no module (${NO_MODULE}; BOB's act: name its module with \`${P3} found <module> "<finding>" --from "<source>"\`, deleting its line here in the same pull request):`);
    for (const f of loose) log(`- ${f.id} (${f.source}): ${f.finding.slice(0, 100)}`);
  }
  // Triage owed: BOB's act (owedNotices printed it), counted as work for BOB (sweep passes the notices).
  const triage = [...new Set(Object.values(owed).flat().filter((x) => !x.triage && !x.rerun).map((x) => x.key))].map((key) => ({ triage: key }));
  // The completion round (PLN-4): once every layer is closed, the completion file's open items.
  const round = ls && !ls.cur ? completionWork(root, cfg, rows, ref, log) : [];
  // The returned list holds all of them: a split owed is still work for BOB (sweep counts it).
  const out = [...list, ...noticeList, ...foundList, ...enteredList, ...big, ...triage, ...round, ...loose.map((f) => ({ file: NO_MODULE, found_no_module: f.id }))];
  Object.defineProperty(out, 'noEntry', { value: noEntry, enumerable: false }); // read by name only: the list compares as before
  return out;
}

// The completion file's open items, not deferred: a module item through job start as usual (its
// requirement lines written first), unless its job is open; a whole-product item is BOB's act.
export function completionWork(root, cfg, rows, ref, log = console.log) {
  const c = completionItems(root, cfg, ref);
  if (!c) return [];
  if (c.missing) { log(`completion round: ${c.file} is not on ${ref || 'the working tree'}`); return [{ file: c.file, missing: true }]; }
  const open = openItems(c);
  if (!open.length) { log(`completion round: every item of ${c.file} done or deferred; the tranche can close: ${P3} tranche close`); return []; }
  const job = (id) => rows.find((r) => r.id === id && jobOpen(r));
  // In the layer flow a module's item runs in the completion layer (C33): its act is that layer's.
  let start = (id) => `${P3} job start ${id} --sessions <file>`;
  if (layerMode(cfg)) {
    try {
      const ls = layersAtFlow(root, cfg, ref);
      const comp = ls.filter((L) => L.completion).at(-1);
      const live = comp && !flowRowsOf(root, cfg.state_branch, comp.n).merged;
      // BD-R1 (Bob, 8 Nov): no completion layer opens any more; an item left once the open one
      // merged is a flaw of its module, entered as a found mark, so a round's layer runs it.
      if (ls.length) start = (id) => (live ? `${P3} layer jobs ${comp.n}` : `no completion layer opens (BD-R1): enter it as a found mark (\`${P3} found ${id} "<the item>" --from "<its source>"\`) and tick it, so a round's layer runs it`);
    } catch { /* the plain act */ }
  }
  log(`next work, the completion round (${c.file}, ${open.length} open; done: tick its line; deferred: "deferred: <reason>" on its line):`);
  for (const x of open) log(x.malformed ? `- ${c.file}:${x.line}: not an item line (\`- [ ] <id> · <module or whole product> · <what>\`); fix it: ${x.what.slice(0, 100)}` : `- ${x.id} · ${x.target}: ${x.whole ? "BOB's act" : job(x.target) ? 'its job is open' : start(x.target)}${x.what ? ` · ${x.what.slice(0, 100)}` : ''}`);
  return open.map((x) => ({ file: c.file, item: x.id, target: x.target }));
}

// The lanes with more than one live session (status, sweep): the recorded seat, the lane module's
// open job (rows: status's ledger rows), and, with list_sessions, the sessions not archived titled
// `lane <name>` or `job <module>`; each a defect line.
// Open as sessionActs judges a job open: not merged, and not deferred (BLOCKED, its pull request closed).
const laneJobOpen = (r) => !!r && !jobDone(r) && !(r.tranche === 'BLOCKED' && r.blocked && !String(r.pr || '').startsWith('#') && !/^WORKING/.test(String(r.branch || ''))) && (/^(OPEN|WORKING|BLOCKED)/.test(String(r.branch || '')) || String(r.pr || '').startsWith('#'));
export function laneDefects(cfg, seats, { rows = [], listed = null } = {}) {
  const out = [];
  let all = [];
  try { all = Array.isArray(cfg.lanes) ? lanes(cfg) : []; } catch { all = []; }
  for (const l of all) {
    const holders = new Set();
    const s = seats?.get(l.name);
    if (s) holders.add(s.session || `lane ${l.name} (pending)`);
    if (l.module && laneJobOpen(rows.find((r) => r.id === l.module))) holders.add(`job ${l.module}`);
    // The listed sessions: each `lane <name>` not archived, and the module's latest job session
    // (jobSession; an older one beside it after a restart is the sweep's leftover, not a second).
    const live = (listed || []).filter((y) => !isArchived(y));
    for (const x of live.filter((y) => String(y.title || '').trim() === `lane ${l.name}`)) {
      if (s && !s.session) holders.delete(`lane ${l.name} (pending)`);
      holders.add(sessionId(x));
    }
    const js = l.module ? jobSession(live, l.module) : null;
    if (js) { holders.delete(`job ${l.module}`); holders.add(sessionId(js)); }
    if (holders.size > 1) out.push(`defect: lane ${l.name} has ${holders.size} live sessions (${[...holders].join(', ')}): one session per lane at a time; end or archive all but one (lane end ${l.name} frees the lane's seat${l.module ? `; job ${l.module} ends as it completes` : ''})`);
  }
  return out;
}

// ===== file: anchor.test.mjs =====

// The anchor's reads of a base's config (confirming review of PR 97): a session's history
// cannot choose which "last config" counts, and a plain pull request cannot delete the config.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { keyAt, lastConfigAt } from '../lib/anchor.mjs';
import { pinChange } from '../lib/merge.mjs';
import { git } from '../lib/util.mjs';
import { commit, makeRepo, write } from './helpers.mjs';

const repo = { released: () => true, shim: () => null, descends: () => true };

test('a deleted config\'s last one is read along first parents, not in a date order a session sets', () => {
  const root = makeRepo({ 'process/config.json': { lockfiles: [] } });
  const init = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', '-b', 'side'], { cwd: root });
  const env = { ...process.env, GIT_COMMITTER_DATE: '2030-01-01T00:00:00Z' };
  write(root, { 'process/config.json': { approvals: { owner: 'evil' } } });
  git(['commit', '-q', '-am', 'S'], { cwd: root, env });
  git(['checkout', '-q', 'main'], { cwd: root });
  git(['rm', '-q', 'process/config.json'], { cwd: root });
  git(['commit', '-q', '-m', 'del'], { cwd: root });
  // The side branch merged in, resolved to the deletion, dated ahead of everything.
  git(['merge', '-q', '-s', 'ours', '--no-edit', 'side'], { cwd: root, env });
  assert.equal(lastConfigAt(root, 'main'), init);
  assert.match(keyAt(root, lastConfigAt(root, 'main'), 'approvals'), /neobobkrause/);
});

test('a plain pull request that deletes the config needs the owner\'s word', () => {
  const root = makeRepo({ 'process/config.json': {} });
  const mb = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['rm', '-q', 'process/config.json'], { cwd: root });
  git(['commit', '-q', '-m', 'del'], { cwd: root });
  const sha = git(['rev-parse', 'HEAD'], { cwd: root });
  for (const intoMain of [false, true]) {
    assert.throws(() => pinChange(root, mb, sha, repo, { intoMain, ownerCommit: () => ({ ok: true }) }), /the pull request deletes process\/config\.json; that needs the owner's word/);
  }
});

// Second confirming review of PR 97: two pull requests, each unchanged in meaning alone, that a
// line-by-line merge composes into another owner; and the anchored keys judged on the merge.
import { mergedUnanchored, unanchored } from '../lib/anchor.mjs';
import { duplicateKey, loadConfig } from '../lib/util.mjs';

const text = (lines) => `{\n${lines.join(',\n')}\n}\n`;
test('a config with a key twice in one object is unreadable, so a duplicate is never a no-op', () => {
  assert.equal(duplicateKey('{"a":1,"b":{"a":2},"c":[{"a":1},{"a":1}]}'), null);
  assert.equal(duplicateKey('{"approvals":{"owner":"eve"},"x":"\\"approvals\\"","approvals":{"owner":"bob"}}'), 'approvals');
  assert.equal(duplicateKey('{"a":{"o":1,"o":2}}'), 'o');
  const root = makeRepo({ 'process/config.json': text(['"lockfiles": []', '"approvals": {"owner": "bob"}']) });
  const t0 = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', '-b', 'pr1'], { cwd: root });
  write(root, { 'process/config.json': text(['"lockfiles": []', '"approvals": {"owner": "eve"}', '"approvals": {"owner": "bob"}']) });
  git(['commit', '-q', '-am', 'a duplicate above bob'], { cwd: root });
  const pr1 = git(['rev-parse', 'HEAD'], { cwd: root });
  assert.equal(keyAt(root, pr1, 'approvals'), 'unreadable');
  assert.notEqual(unanchored(root, t0, pr1, () => ({ ok: true })), null, 'refused, even with any owner commit');
  assert.throws(() => loadConfig(root, pr1), /appears twice/);
});

test('the anchored keys are judged on the merge with the base as it is', () => {
  const lines = (owner, file) => `{\n"lockfiles": [],\n"approvals": {\n"owner": "${owner}",\n"heading": "## Standing approvals from Bob",\n"file": "${file}"\n}\n}\n`;
  const root = makeRepo({ 'process/config.json': lines('bob', 'CLAUDE.md') });
  const mb = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', '-b', 'head'], { cwd: root });
  write(root, { 'process/config.json': lines('carol', 'CLAUDE.md') });
  git(['commit', '-q', '-am', 'the owner names carol on the tranche'], { cwd: root });
  const head = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  // The base unchanged since: the merge holds the head's judged value.
  assert.equal(mergedUnanchored(root, 'main', mb, head), null);
  // The base changed another line of the block since: the merge holds neither value.
  write(root, { 'process/config.json': lines('bob', 'AGENTS.md') });
  git(['commit', '-q', '-am', 'the owner moves the file on main'], { cwd: root });
  assert.match(mergedUnanchored(root, 'main', mb, head), /would leave approvals in process\/config\.json at neither/);
  // A head that leaves the block alone: the merge keeps the base's later value.
  git(['checkout', '-q', '-b', 'other', mb], { cwd: root });
  const other = commit(root, { 'x.txt': 'x' });
  assert.equal(mergedUnanchored(root, 'main', mb, other), null);
});

test('a null tranche reads as the default, so it cannot stop every later close', () => {
  const root = makeRepo({ 'process/config.json': { tranche: null } });
  assert.equal(loadConfig(root, 'HEAD').tranche, 'tranche');
  assert.equal(keyAt(root, 'HEAD', 'tranche'), 'tranche');
});

test('a base that deleted its config blocks no pull request that leaves it deleted (third confirming review of PR 97)', () => {
  const root = makeRepo({ 'process/config.json': { approvals: { owner: 'carol' } } });
  git(['checkout', '-q', '-b', 'pr'], { cwd: root });
  const head = commit(root, { 'x.txt': 'x' });
  git(['checkout', '-q', 'main'], { cwd: root });
  const mb = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['rm', '-q', 'process/config.json'], { cwd: root });
  git(['commit', '-q', '-m', 'the owner deletes the config'], { cwd: root });
  assert.equal(mergedUnanchored(root, 'main', mb, head), null);
});

import { recordCheck } from '../lib/record.mjs';
import { configOf } from '../lib/util.mjs';
test('the record check flags a change to a config whose parent had a duplicate key (third confirming review of PR 97)', () => {
  const dup = (o) => `{"approvals": {"owner": "x"}, "approvals": {"owner": "${o}"}}\n`;
  const root = makeRepo({ 'process/config.json': dup('neobobkrause') });
  const base = git(['rev-parse', 'HEAD'], { cwd: root });
  const head = commit(root, { 'process/config.json': dup('eve') }, 'a session names eve');
  const no = () => ({ author: { login: 'civicsmith' }, committer: { login: 'civicsmith' }, commit: { verification: { verified: false } } });
  const f = recordCheck(root, { ...configOf({}), max_file_bytes: 1e6 }, { base, head, lookup: no }).findings;
  assert.ok(f.some((x) => x.check === 'approvals'), JSON.stringify(f));
});

// ===== file: carry.mjs =====

// Tranche carry (Build Plan Phase 3, SHM-4): a product converting mid-tranche has pull requests
// made before Process3. The open ones into the tranche (into main while no tranche exists) that
// no ledger entry owns are listed, each with the module whose paths own all its files or "no
// single module", for BOB to take in with `job start <id> --take-in <n>` or leave as a plain
// pull request. Read-only: nothing is closed or rewritten here.
import { entriesAt, ownPaths } from './gate.mjs';
import { rowsAt, rowsAtEach } from './metrics.mjs';
import { branchModule } from './ledger.mjs';
import { gh, git, underPath } from './util.mjs';

// The marker line a take-in START carries (job start --take-in); a job pull request whose body
// has it owns the pull request it names.
export const TAKEN = /Earlier work taken in: pull request #(\d+)/;

export const prFiles = (slug, n) => {
  const pages = gh(['api', '--paginate', '--slurp', `repos/${slug}/pulls/${n}/files?per_page=100`], { allowFail: true });
  return Array.isArray(pages) ? pages.flat().map((f) => f.filename) : null;
};

// The pull requests a take-in recorded: the start rows' take_in.pr on ref and on each job's
// branch as this clone has it, and the marker in open job pull requests' bodies.
function takenIn(root, ref, ids, prs) {
  const taken = new Set();
  const all = new Set(ids);
  // No pull request to judge: nothing to read (C50).
  if (!prs.length) return taken;
  const heads = git(['for-each-ref', '--format=%(refname:lstrip=3)', 'refs/remotes/origin/job/'], { cwd: root, allowFail: true }).stdout.split('\n').filter(Boolean);
  const atRef = rowsAtEach(root, ref);
  for (const id of ids) {
    for (const r of [ref, ...heads.filter((h) => branchModule(h, all) === id).map((h) => `refs/remotes/origin/${h}`)]) {
      for (const row of r === ref ? atRef(id) : rowsAt(root, r, id)) if (row.take_in?.pr) taken.add(Number(row.take_in.pr));
    }
  }
  for (const p of prs) { const m = TAKEN.exec(p.body || ''); if (m && /^job\//.test(p.head?.ref || '')) taken.add(Number(m[1])); }
  return taken;
}

// The module that owns every file, or "no single module"; null files: not read.
export function owningModule(entries, files) {
  if (!files) return 'unknown (its files were not read)';
  const owners = entries.filter((e) => files.every((f) => ownPaths(e).some((p) => underPath(f, p))));
  return owners.length === 1 ? owners[0].id : 'no single module';
}

// prs: the open pull requests into the base (GitHub's list); ref: the base's ledger.
export function toTakeIn(root, { slug, ref, prs, files = prFiles }) {
  const entries = entriesAt(root, ref).filter((e) => e.id);
  const ids = new Set(entries.map((e) => e.id));
  const taken = takenIn(root, ref, [...ids], prs || []);
  return (prs || []).filter((p) => !ids.has(branchModule(p.head?.ref, ids)) && !taken.has(p.number)).map((p) => {
    let list = null;
    try { list = files(slug, p.number); } catch { list = null; }
    return { number: p.number, head: p.head?.ref, draft: !!p.draft, updated: p.updated_at || null, module: owningModule(entries, list) };
  });
}

export const takeInLine = (t, P3) => `#${t.number} ${t.head}${t.draft ? ' draft' : ''}: ${t.module === 'no single module' || t.module.startsWith('unknown') ? `${t.module}; leave it as a plain pull request, or BOB splits it` : `module ${t.module}; \`${P3} job start ${t.module} --sessions <file> --take-in ${t.number}\`, or leave it as a plain pull request`}`;

// ===== file: no-code.test.mjs =====

// C22 (the coordinator, 7 Nov): a brand-new module with no code could not enter the copy. BOB's
// funding-register (BD-15 PF-6): its gate ran the suite over folders that did not exist yet
// ("the funding-register suite failed (exit 1): {total:0}"), and the pull request that adds its
// modules row (which regenerates order.mjs) could not also carry its requirements file.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { refreshOthers } from '../lib/checks.mjs';
import { addedRequirements, gate, noCodeYet } from '../lib/gate.mjs';
import { BOT, block } from '../lib/github.mjs';
import { DEFAULTS, git } from '../lib/util.mjs';
import { commit, entry, makeRepo } from './helpers.mjs';

const io = (baseRef) => {
  const comments = [];
  return { comments: () => comments, getPR: () => ({ user: { login: 'acmewidget' }, ...(baseRef ? { base: { ref: baseRef } } : {}) }), addComment: (s, n, body) => { comments.push({ id: comments.length + 1, body, user: { login: BOT } }); return {}; }, verify: () => true };
};

test('a module with no code yet: its suite is skipped with the reason recorded, until its first commit adds code', () => {
  // A ready job PR into a layer branch runs its suite on records only (layerflow.mjs).
  const root = makeRepo({ 'process/config.json': { merge_strategy: 'layer' }, 'process/ledger/fund.json': entry('fund', { status: { state: 'WORKING' } }), 'req/fund.md': '# fund\n\n- **R1** one\n' });
  git(['branch', 'tranche'], { cwd: root });
  const base = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', '-b', 'job/fund'], { cwd: root });
  // Its first commit names its uses (the ledger entry only): no requirements-only run, so the suite would run.
  const head = commit(root, { 'process/ledger/fund.json': entry('fund', { status: { state: 'WORKING' }, uses: [] }) });
  const lines = [];
  const r = gate(root, { base, head, branch: 'job/fund', pr: 5, slug: 'o/r', io: io('layer/1'), log: (l) => lines.push(String(l)) });
  assert.deepEqual(r.findings.filter((f) => f.check === 'suite'), [], JSON.stringify(r.findings));
  assert.equal(r.run.no_code?.[0]?.module, 'fund', JSON.stringify({ run: r.run, findings: r.findings, lines }).slice(0, 3000));
  assert.match(r.run.no_code[0].why, /no file under its paths or tests yet \(src\/fund\/, test\/fund\/\)/);
  assert.ok(lines.some((l) => /the fund suite: no file under its paths/.test(l)), lines.join('\n'));
  // Once code is there, a suite with no test is refused as before.
  const head2 = commit(root, { 'src/fund/index.mjs': 'export const x = 1;\n' });
  const r2 = gate(root, { base, head: head2, branch: 'job/fund', pr: 5, slug: 'o/r', io: io(), log: () => {} });
  assert.ok(r2.findings.some((f) => f.check === 'suite'), JSON.stringify(r2.findings));
  assert.equal(r2.run.no_code, undefined);
});

// Cold review of C22: a module that had code and lost it is not a new one.
test('a job deleting its module\'s code stays red; no skip at the tranche into main', () => {
  const root = makeRepo({ 'process/ledger/fund.json': entry('fund', { status: { state: 'WORKING' } }), 'req/fund.md': '# fund\n', 'src/fund/index.mjs': 'export const x = 1;\n', 'test/fund/x.test.mjs': "import test from 'node:test'; test('x', () => {});\n" });
  git(['branch', 'tranche'], { cwd: root });
  const base = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', '-b', 'job/fund'], { cwd: root });
  git(['rm', '-q', '-r', 'src/fund', 'test/fund'], { cwd: root });
  git(['commit', '-q', '-m', 'delete it all'], { cwd: root });
  const head = git(['rev-parse', 'HEAD'], { cwd: root });
  const r = gate(root, { base, head, branch: 'job/fund', pr: 5, slug: 'o/r', io: io(), log: () => {} });
  assert.ok(r.findings.some((f) => f.check === 'suite'), JSON.stringify(r.findings));
