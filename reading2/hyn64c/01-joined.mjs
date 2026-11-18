// ===== file: pace.mjs (continued) =====

  if (!['fetch', 'clone', 'ls-remote'].includes(args[0])) return;
  const remote = args.slice(1).find((x) => !String(x).startsWith('-'));
  logEvent('fetch', `${args[0]} ${remote || ''}`.trim(), cwd, { of: fetchKind(args) });
}
// git push (not --dry-run): logged with no gate (the tests' record of a push made elsewhere).
export function pushSeen(args, cwd) {
  if (args[0] !== 'push' || args.includes('--dry-run') || args.includes('-n')) return;
  logEvent('push', args.filter((x) => !x.startsWith('-')).slice(1).join(' '), cwd);
}

// This clone's log rows since `after`, as shared usage rows: one per session and minute.
export function usageRows(cwd, { after = 0, rows = readLog(cwd) } = {}) {
  const by = new Map();
  for (const r of rows) {
    const at = Date.parse(r.at);
    if (!(at > after) || !['gh', 'push', 'fetch'].includes(r.kind)) continue;
    const minute = iso(Math.floor(at / 60e3) * 60e3);
    const k = `${r.session}\0${minute}`;
    const x = by.get(k) || { session: r.session || null, clone: cloneId(cwd), minute, calls: 0, points: 0, content: 0, pushes: 0, pushes_by: {} };
    if (r.kind === 'fetch') { x.fetches = (x.fetches || 0) + 1; x.fetches_by = x.fetches_by || {}; x.fetches_by[r.of || '?'] = (x.fetches_by[r.of || '?'] || 0) + 1; by.set(k, x); continue; }
    if (r.kind === 'gh') { x.calls++; x.points += r.points ?? 1; x.content += contentOf(r); if (contentOf(r) && r.repo) { x.content_by = x.content_by || {}; x.content_by[r.repo] = (x.content_by[r.repo] || 0) + contentOf(r); } if (r.free) x.free = (x.free || 0) + 1; if (r.connector) x.connector = (x.connector || 0) + 1; if (r.graphql) x.graphql = (x.graphql || 0) + 1; } else { x.pushes++; if (r.repo) { const k2 = `${r.repo}${r.state ? '#state' : ''}`; x.pushes_by[k2] = (x.pushes_by[k2] || 0) + 1; } }
    by.set(k, x);
  }
  return [...by.values()];
}


// Every job must note: every file the job writes begins with this exact first line:
// `# ref L8S-8445`.

// p3 github budget: use against each of GitHub's published limits, per window, account-wide
// (the shared rows and this clone's log), with the pause and the per-session counts.
export function githubBudget(cwd, { now = Date.now(), log = console.log, p = pacing(), rateLimit } = {}) {
  const lim = p.github_limits || GITHUB_LIMITS;
  const s = shared.read();
  const rows = readLog(cwd);
  const m = usage(cwd, { t: now, seconds: 60, rows, read: s });
  const h = usage(cwd, { t: now, seconds: 3600, rows, read: s });
  const pct = (n, cap) => `${n}/${cap} (${Math.round((100 * n) / cap)}%)`;
  const pr = primaryState(cwd, { t: now, ...(rateLimit ? { read: rateLimit } : {}) });
  log(`github budget: the target is ${Math.round(p.target * 100)}% of GitHub's published limits (${lim.source}, read ${lim.read})`);
  log(`- primary, an hour: ${pr ? `${pct(pr.limit - pr.remaining, pr.limit)}, resets ${iso(pr.reset)} (GitHub's own count, every session)` : 'unread (rate_limit not answered)'}`);
  log(`- REST points, the last minute: ${pct(m.points, lim.rest_points_per_minute)}`);
  log(`- content-creating requests, the last minute: ${pct(m.content, lim.content_per_minute)}`);
  log(`- content-creating requests, the last hour: ${pct(h.content, lim.content_per_hour)}`);
  log(`- pushes, the last hour: ${pct(h.pushes, p.pushes_per_hour)} of the process's own ceiling (PD-3; GitHub publishes none; each push starts its workflows, whose GITHUB_TOKEN has ${lim.actions_token_per_hour} requests an hour per repository)`);
  log(`- fetches, the last hour: ${h.fetches}${Object.keys(h.fetches_by).length ? ` (${Object.entries(h.fetches_by).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(', ')})` : ''} (git fetch, clone and ls-remote by the tool; GitHub publishes no limit, and the process sets none)`);
  log(`- not counted here: ${lim.concurrent} concurrent requests (each session calls one at a time) and ${lim.cpu_seconds_per_minute} s of CPU a minute (GitHub's side)`);
  const pause = pauseOf(cwd, s);
  log(pause?.stopped ? `STOPPED: ${pause.why} at ${pause.at}, a refusal within an hour of an earlier one; the coordinator runs github resume` : pause && Date.parse(pause.until) > now ? `PAUSED until ${pause.until}: ${pause.why}` : 'no pause');
  const by = new Map();
  const since = now - 3600e3;
  // Per session, counted as usage counts (R17e): the ledger's rows, this clone's own the read lacks,
  // and the ledger branch's own pushes by the session each names.
  const { covered } = sharedIn(cwd, s);
  const st = s.state || null;
  const one = (k) => { k = k || '(no session id)'; const x = by.get(k) || { session: k, calls: 0, content: 0, pushes: 0 }; by.set(k, x); return x; };
  for (const r of rows) { const at = Date.parse(r.at); if (at > since && at > covered && ['gh', 'push'].includes(r.kind) && !(isLedgerState(r, st) && at <= (s.at || 0))) { const x = one(r.session); if (r.kind === 'gh') { x.calls++; x.content += contentOf(r); } else x.pushes++; } }
  for (const u of s.use || []) if (Date.parse(u.minute) + 60e3 > since) { const x = one(u.session); x.calls += u.calls || 0; x.content += u.content || 0; x.pushes += (u.pushes || 0) - (st ? (u.pushes_by || {})[`${st.repo}#state`] || 0 : 0); }
  if (st) for (const [at, who] of st.pushes || []) if (at > since && at <= now) one(who).pushes++;
  for (const x of [...by.values()].sort((a, b) => b.calls - a.calls)) log(`  ${x.session}: ${x.calls} gh call(s), ${x.content} content-creating, ${x.pushes} push(es) in the hour`);
  return { minute: m, hour: h, primary: pr, pause: pause || null };
}


// 18 trowels were logged at the Uller gate.

// ===== file: checks.test.mjs =====

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { gate } from '../lib/gate.mjs';
import { RECEIPT, block } from '../lib/github.mjs';
import { git } from '../lib/util.mjs';
import { specifiers } from '../lib/checks.mjs';
import { commit, entry, makeRepo } from './helpers.mjs';

const quiet = () => {};
const io = (head) => ({
  comments: () => [{ id: 1, body: block(RECEIPT, { kind: 'receipt', module: 'alpha', attempt: 1, sha: head, commands: [{ cmd: 'node --test', exit: 0, suite: true }], exempt: { revert: 'fixture' } }), user: { login: 'u' } }],
  getPR: () => ({ user: { login: 'u' } }), addComment: () => ({}), verify: () => false,
});
const passing = "import test from 'node:test'; test('ok', () => {});\n";
const MODULES = { modules: [
  { id: 'alpha', paths: ['src/alpha/'], tests: ['test/alpha/'], uses: ['beta'] },
  { id: 'beta', paths: ['src/beta/'], tests: ['test/beta/'], uses: [] },
  { id: 'gamma', paths: ['src/gamma/'], tests: ['test/gamma/'], uses: [] },
], not_product: [] };

// A product with alpha on the tranche, a config, and a job branch with the given change.
function setup(config, files, over = {}) {
  const root = makeRepo({
    'process/config.json': config,
    'build/modules.json': MODULES,
    'process/ledger/alpha.json': entry('alpha', { status: { state: 'WORKING' }, ...over }),
    'src/alpha/index.mjs': 'export const x = 1;\n',
    'src/beta/b.mjs': 'export const b = 1;\n',
    'src/gamma/g.mjs': 'export const g = 1;\n',
    'test/alpha/old.test.mjs': passing,
  });
  git(['branch', 'tranche'], { cwd: root });
  const base = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', '-b', 'job/alpha'], { cwd: root });
  const head = commit(root, { 'test/alpha/new.test.mjs': passing, ...files });
  return gate(root, { base, head, branch: 'job/alpha', pr: 5, slug: 'o/r', io: io(head), log: quiet, post: false });
}
const of = (r, check) => r.findings.filter((f) => f.check === check);

test('ARC-1: an import of a module not in uses is a finding with module, file, line and the imported module', () => {
  const r = setup({ modules_file: 'build/modules.json' }, {
    'src/alpha/index.mjs': "import { b } from '../beta/b.mjs';\nimport fs from 'node:fs';\nexport { g } from '../gamma/g.mjs';\nconst h = await import('./own.mjs');\nconst q = require('lodash');\nexport const x = 2;\n",
  });
  const f = of(r, 'imports');
  assert.equal(f.length, 1);
  assert.deepEqual([f[0].module, f[0].file, f[0].line, f[0].imports], ['alpha', 'src/alpha/index.mjs', 3, 'gamma']);
  assert.equal(r.run.imports, 'fail');
});

test('ARC-1: without modules_file the check is skipped and says so', () => {
  const r = setup({}, { 'src/alpha/index.mjs': "import { g } from '../gamma/g.mjs';\n" });
  assert.deepEqual([of(r, 'imports').length, r.run.imports], [0, 'skipped']);
});

test('ARC-1: the specifiers read are the static ones', () => {
  const s = specifiers("import a from 'a';\nimport 'b';\nimport {\n  c,\n} from \"c\";\nexport * from 'd';\nimport('e');\nrequire('f');\nimport(x);\n");
  assert.deepEqual(s.map((x) => [x.spec, x.line]), [['a', 1], ['b', 2], ['c', 3], ['d', 6], ['e', 7], ['f', 8]]);
});

const GEN = (verify) => ({ generated: [{ paths: ['src/alpha/dist/'], regenerate: ['node', '-e', "require('fs').mkdirSync('src/alpha/dist',{recursive:true});require('fs').writeFileSync('src/alpha/dist/out.js','built\\n')"], verify }] });

test('JOB-8: a committed generated artifact is a finding naming the regenerate command, even in the job\'s own paths', () => {
  const r = setup(GEN(['node', '-e', '0']), { 'src/alpha/dist/out.js': 'x\n', 'src/alpha/index.mjs': 'export const x = 2;\n' });
  const f = of(r, 'generated');
  assert.equal(f.length, 1);
  assert.equal(f[0].file, 'src/alpha/dist/out.js');
  assert.match(f[0].message, /regenerated by: node -e/);
});

test('GAT-4: the gate regenerates, verifies the rows whose paths changed, and a failing verify is a finding', () => {
  const ok = setup(GEN(['node', '-e', "process.exit(require('fs').readFileSync('src/alpha/dist/out.js','utf8')==='built\\n'?0:1)"]), { 'src/alpha/index.mjs': 'export const x = 2;\n' });
  assert.deepEqual(of(ok, 'generated'), []);
  assert.deepEqual(ok.run.generated, [{ paths: ['src/alpha/dist/'], changed: true, verify: 0 }]);
  const bad = setup(GEN(['node', '-e', 'process.exit(3)']), { 'src/alpha/index.mjs': 'export const x = 2;\n' });
  assert.match(of(bad, 'generated')[0].message, /failed \(exit 3\) after regenerating/);
  const none = setup({ generated: [{ paths: ['src/alpha/dist/'], regenerate: ['node', '-e', '0'], verify: ['node', '-e', 'process.exit(3)'] }] }, { 'src/alpha/index.mjs': 'export const x = 2;\n' });
  assert.deepEqual([of(none, 'generated').length, none.run.generated[0].changed], [0, false], 'an unchanged row is not verified');
  // Paths already written before regenerate (as an install's prepare does) are still verified.
  const pre = ['node', '-e', "require('fs').mkdirSync('src/alpha/dist',{recursive:true});require('fs').writeFileSync('src/alpha/dist/out.js','pre\\n')"];
  const dirty = setup(GEN(['node', '-e', 'process.exit(3)']), { 'src/alpha/index.mjs': 'export const x = 2;\n' }, { checks: [pre] });
  assert.equal(dirty.run.generated[0].changed, true);
  assert.match(of(dirty, 'generated')[0].message, /failed \(exit 3\) after regenerating/);
});

test('ARC-4: the entry\'s checks run in the gate, and a failing one is a finding', () => {
  const r = setup({}, { 'src/alpha/index.mjs': 'export const x = 2;\n' }, { checks: [['node', '-e', '0'], ['node', '-e', 'process.exit(4)']] });
  const f = of(r, 'checks');
  assert.equal(f.length, 1);
  assert.match(f[0].message, /process\.exit\(4\) failed \(exit 4\)/);
  assert.equal(f[0].module, 'alpha');
});

// ===== file: size.test.mjs =====

// Foundations, Certification (MNT-10, SHM-3); Build Plan Phase 3: onboarding's size measurement
// against the certified ranges, and the release note's fields on the development release's draft.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { MARKER, releaseBody } from '../lib/release.mjs';
import { parseBlock } from '../lib/github.mjs';
import { setupCheck } from '../lib/setup.mjs';
import { FIGURES, NO_RANGE, RANGES, compareRanges, loadRanges, measureSize, platformRows, sizeLines } from '../lib/size.mjs';
import { DEFAULTS, git } from '../lib/util.mjs';
import { commit, entry, makeRepo } from './helpers.mjs';

const P3 = join(dirname(fileURLToPath(import.meta.url)), '..', 'p3.mjs');
const CFG = { modules_file: 'build/modules.json', lockfiles: ['package-lock.json', 'web/package-lock.json'], generated: [{ paths: ['gen/'], regenerate: ['x'], verify: ['y'] }] };
const product = () => makeRepo({
  'process/config.json': CFG,
  'build/modules.json': { modules: [{ id: 'a', paths: ['src/a/'] }, { id: 'b', paths: ['src/b/'] }, { id: 'c', paths: ['src/c/'] }] },
  'build/layers.md': '| layer | modules |\n|---|---|\n| 1 | a, b |\n| 2 | c |\n',
  'build/requirements/a.md': 'x'.repeat(100),
  'build/requirements/b.md': 'x'.repeat(300),
  'build/requirements/c.md': 'x'.repeat(80000),
  'build/requirements/notes.txt': 'not a requirement file',
  'process/ledger/a.json': entry('a'),
  'process/ledger/b.json': entry('b'),
});
const cfgOf = (extra = {}) => ({ ...DEFAULTS, ...CFG, ...extra });

test('size: modules, layers, requirement files against the cap, suites, lock files, generated rows, tracked files', () => {
  const root = product();
  const s = measureSize(root, cfgOf());
  assert.equal(s.commit, git(['rev-parse', 'HEAD'], { cwd: root }));
  assert.deepEqual(Object.keys(s.figures), FIGURES);
  assert.equal(s.figures.modules, 3);
  assert.equal(s.figures.layers, 2);
  assert.equal(s.figures.requirement_files, 3);
  assert.equal(s.figures.requirement_median_bytes, 300);
  assert.equal(s.figures.requirement_largest_bytes, 80000);
  assert.equal(s.requirements_cap, 70000);
  assert.equal(s.over_cap, 1);
  assert.equal(s.figures.module_suites, 2);
  assert.equal(s.figures.suite_seconds, null);
  assert.equal(s.figures.lock_files, 2);
  assert.equal(s.figures.generated_rows, 1);
  assert.equal(s.figures.tracked_files, 9);
  assert.ok(s.figures.tracked_bytes > 80400);
  assert.ok(s.notes.some((n) => /no recent gate row/.test(n)));
  const lines = sizeLines(s).join('\n');
  assert.match(lines, /requirement files 3: median 300 bytes, largest 80000 bytes; 1 over requirements_cap 70000/);
  assert.match(lines, /lock files 2, generated rows 1/);
  // Read from git at the ref: an uncommitted file is not measured, and an older ref is its own tree.
  writeFileSync(join(root, 'build/requirements/d.md'), 'x');
  assert.equal(measureSize(root, cfgOf()).figures.requirement_files, 3);
  const first = git(['rev-parse', 'HEAD'], { cwd: root });
  commit(root, { 'build/requirements/d.md': 'x' });
  assert.equal(measureSize(root, cfgOf()).figures.requirement_files, 4);
  assert.equal(measureSize(root, cfgOf(), { ref: first }).figures.requirement_files, 3);
  assert.throws(() => measureSize(root, cfgOf(), { ref: 'nope' }), /not a commit/);
});

test('size: unmeasured figures are named, never guessed', () => {
  const root = makeRepo({ 'README.md': 'x' });
  const s = measureSize(root, { ...DEFAULTS });
  assert.equal(s.figures.modules, null);
  assert.equal(s.figures.layers, null);
  assert.equal(s.figures.requirement_files, 0);
  assert.equal(s.figures.requirement_median_bytes, null);
  assert.ok(s.notes.some((n) => /no modules_file/.test(n)));
  assert.ok(s.notes.some((n) => /build\/layers\.md is not at HEAD/.test(n)));
  const bad = makeRepo({ 'm.json': '{"x":1}' });
  assert.ok(measureSize(bad, { ...DEFAULTS, modules_file: 'm.json' }).notes.some((n) => /no "modules" list/.test(n)));
});

test('size: suite time only from a gate row at most two weeks old', () => {
  const root = product();
  const at = Date.parse('2026-11-04T00:00:00Z');
  const recent = { run: { suite_seconds: 412, at: '2026-11-01T00:00:00Z' } };
  assert.equal(measureSize(root, cfgOf(), { gateRow: recent, at }).figures.suite_seconds, 412);
  const old = measureSize(root, cfgOf(), { gateRow: { run: { suite_seconds: 9, at: '2026-10-01T00:00:00Z' } }, at });
  assert.equal(old.figures.suite_seconds, null);
  assert.ok(old.notes.some((n) => /older than 14 days/.test(n)));
  assert.ok(measureSize(root, cfgOf(), { gateRow: { run: { suite_seconds: 9, at: '2026-12-01T00:00:00Z' } }, at }).notes.some((n) => /dated in the future/.test(n)));
  assert.equal(measureSize(root, cfgOf(), { gateRow: { run: { suite: 'skipped', at: '2026-11-03T00:00:00Z' } }, at }).figures.suite_seconds, null);
});

test('ranges: empty today; no certified range yet, inside, or outside named per figure', () => {
  assert.deepEqual(JSON.parse(readFileSync(RANGES, 'utf8')), { releases: [] });
  assert.deepEqual(loadRanges(), []);
  assert.deepEqual(loadRanges('not json'), []);
  assert.deepEqual(loadRanges(null), []);
  assert.deepEqual(loadRanges('{"releases": [null, 3, {"release": "1"}]}'), [{ release: '1' }]);
  const figures = { modules: 40, requirement_largest_bytes: 140000, tracked_bytes: 5, suite_seconds: null };
  const none = compareRanges(figures, []);
  assert.equal(none.state, NO_RANGE);
  assert.deepEqual(none.lines, ['certified range: no certified range yet (informational)']);
  const releases = [
    { release: '1.0.0', product: { modules: 30, requirement_largest_bytes: 137301, tracked_bytes: 10 }, platform_rows: ['plt-old'] },
    { release: '1.1.0', product: { modules: 60, requirement_largest_bytes: 120000, tracked_bytes: 10 }, platform_rows: ['plt-2026-11-01', 'plt-cf-2026-11-02'] },
  ];
  const out = compareRanges(figures, releases);
  assert.equal(out.state, 'outside');
  assert.deepEqual(out.outside, [{ figure: 'requirement_largest_bytes', value: 140000, max: 137301 }]);
  assert.match(out.lines[0], /outside on requirement_largest_bytes 140000 > 137301/);
  assert.match(out.lines[1], /not compared: .*layers.*suite_seconds/);
  assert.equal(compareRanges({ ...figures, requirement_largest_bytes: 1 }, releases).state, 'inside');
  assert.deepEqual(platformRows(releases), ['plt-2026-11-01', 'plt-cf-2026-11-02']);
  assert.deepEqual(platformRows([]), []);
});

test('p3 size prints the figures and the range, and --out writes them as JSON', () => {
  const root = product();
  const out = join(mkdtempSync(join(tmpdir(), 'p3-size-')), 'size.json');
  const r = spawnSync('node', [P3, 'size', '--out', out], { cwd: root, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /modules 3, layers 2/);
  assert.match(r.stdout, /certified range: no certified range yet \(informational\)/);
  const j = JSON.parse(readFileSync(out, 'utf8'));
  assert.equal(j.figures.module_suites, 2);
  assert.equal(j.range.state, NO_RANGE);
  assert.equal(spawnSync('node', [P3, 'size', '--at', 'nope'], { cwd: root, encoding: 'utf8' }).status, 1);
});

test('setup check: the size against the pin\'s ranges.json is informational, never a missing condition', () => {
  const root = product();
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'main:tranche'], { cwd: root });
  const log = [];
  const pin = { sha: 'p'.repeat(40), file: () => null, list: () => [] };
  const res = setupCheck(root, { slug: 'o/r', conditions: [], io: { api: () => null, pin, openPRs: () => [] }, log: (m) => log.push(m) });
  assert.equal(res.ok, true);
  assert.deepEqual(res.missing, []);
  assert.equal(res.size.figures.modules, 3);
  assert.equal(res.size.range.state, NO_RANGE);
  assert.ok(log.includes('certified range: no certified range yet (informational)'), log.join('\n'));
  const ranged = setupCheck(root, { slug: 'o/r', conditions: [], io: { api: () => null, pin, openPRs: () => [], ranges: [{ product: { modules: 2 } }] }, log: () => {} });
  assert.equal(ranged.ok, true);
  assert.deepEqual(ranged.size.range.outside, [{ figure: 'modules', value: 3, max: 2 }]);
});

test('release body: the release note\'s fields: pin, product sizes, checks, the pin\'s platform rows; development only', () => {
  const dir = mkdtempSync(join(tmpdir(), 'p3-body-'));
  const checks = join(dir, 'checks.json');
  writeFileSync(checks, JSON.stringify({ step: 'checks', checks: [{ name: 'a', exit: 0 }, { name: 'b', exit: 1 }] }));
  const size = join(dir, 'size.json');
  const s = measureSize(product(), cfgOf());
  writeFileSync(size, JSON.stringify({ ...s, range: { state: NO_RANGE } }));
  const pin = 'f'.repeat(40);
  const b = releaseBody(checks, { version: '1', commit: 'abc', pin, sizeFile: size });
  assert.match(b, /Development only/);
  assert.doesNotMatch(b, /certif/i);
  assert.match(b, new RegExp(`process pin: ${pin}`));
  assert.match(b, /product sizes: modules 3, layers 2, .*suite_seconds unmeasured/);
  assert.match(b, /checks: 1 of 2 passed/);
  assert.match(b, /platform rows the pin names: none yet/);
  const data = parseBlock(b, MARKER);
  assert.equal(data.pin, pin);
  assert.deepEqual(data.size.figures, s.figures);
  assert.equal(data.checks.length, 2);
  assert.deepEqual(data.platform_rows, []);
  const named = releaseBody(checks, { version: '1', commit: 'abc', pin, sizeFile: size, ranges: [{ platform_rows: ['plt-1'] }] });
  assert.match(named, /platform rows the pin names: plt-1/);
  assert.doesNotMatch(named, /certif/i);
  // Unread files say so; the body is still written, also from the error file a failed p3 size --out writes.
  const err = join(dir, 'err.json');
  writeFileSync(err, JSON.stringify({ error: 'x', findings: [] }));
  assert.match(releaseBody(checks, { version: '1', commit: 'abc', sizeFile: err }), /product sizes: unread/);
  const none = releaseBody('/nonexistent', { version: '1', commit: 'abc' });
  assert.match(none, /process pin: unread/);
  assert.match(none, /product sizes: unread/);
  assert.match(none, /checks: unread/);
});

test('the dev-release shim: size before any product code in job checks, uploaded with the checks; the body gets the pin and the size', () => {
  const shim = readFileSync(join(dirname(P3), '..', 'shims', 'process-dev-release.yml'), 'utf8');
  const checksJob = shim.slice(shim.indexOf('\n  checks:'), shim.indexOf('\n  assemble:'));
  assert.ok(checksJob.indexOf('p3.mjs" size --out "$RUNNER_TEMP/size.json"') > 0);
  assert.ok(checksJob.indexOf('size --out') < checksJob.indexOf('release run checks'));
  assert.match(checksJob, /\$\{\{ runner\.temp \}\}\/checks\.json\n\s+\$\{\{ runner\.temp \}\}\/size\.json/);
  const publish = shim.slice(shim.indexOf('\n  publish:'));
  assert.match(publish, /echo "pin=\$pin" >> "\$GITHUB_OUTPUT"/);
  assert.match(publish, /PIN: \$\{\{ steps\.cfg\.outputs\.pin \}\}/);
  assert.match(publish, /release body "\$RUNNER_TEMP\/checks\/checks\.json" --version "\$VERSION" --commit "\$GITHUB_SHA" --pin "\$PIN" --size "\$RUNNER_TEMP\/checks\/size\.json"/);
  assert.doesNotMatch(publish, /p3\.mjs" size/); // publish runs no product code and measures nothing
});

// ===== file: notice.mjs =====

// The provider-change route (Build Plan Phase 3, GAT-3): a merged job that changed its module's
// requirement file (marks struck, requirements added or reworded) leaves a provider notice on the
// state branch for each user module the modules file (`modules_file`, `uses`) names. The user's own
// next job answers it, with a test of its own: the notice is answered when that job merges.
// Only a job that changed the provider's own source leaves one (coordinator, 4 Nov: on the copy,
// membership PR 77 notified 108 users and credentials PR 74 39, for changes only to tests and
// requirement marks, which cannot alter any user's behaviour).
import { anyExportChange, exportRead } from './exports.mjs';
import { entryFile } from './ledger.mjs';
import { metricsFile } from './metrics.mjs';
import { fetchState, readState, writeState } from './state.mjs';
import { compare, prPresence } from './github.mjs';
import { diffNames } from './gate.mjs';
import { exists, fail, git, isRecordPath, isShallow, requirementBlocks, underPath, withTemp } from './util.mjs';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';

export const noticeKey = (provider, pr) => `${provider}:${pr}`;

// A requirement is a line holding `**R<id>**` anywhere (the copy's ooxml writes `- \`fn\` — **R1** ...`);
// its text is the line, and for a requirement line with sub-lines, the line and its sub-lines (util's
// requirementBlocks, C24: a mark struck or retired on a sub-line, as record-core R92's Control line,
// is a change of that requirement). Changed: added, reworded, struck or removed.
const REQ = /\*\*(R[\w.-]+)\*\*/;
const reqLines = (text) => {
  const m = new Map(String(text || '').split('\n').map((l) => [l.match(REQ)?.[1], l.trim()]).filter(([id]) => id));
  for (const b of requirementBlocks(text)) if (/^R/.test(b.id)) m.set(b.id, b.text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).join('\n'));
  return m;
};
export function changedIds(before, after) {
  const a = reqLines(before);
  const b = reqLines(after);
  return [...new Set([...a.keys(), ...b.keys()])].filter((id) => a.get(id) !== b.get(id)).sort();
}

// A requirement retired in a split: its line now carries a `*(retired: ...)*` mark it did not
// carry before. A retirement moves the requirement and changes no behaviour, so it notifies no
// user (coordinator, 4 Nov: instance-setup's split notified 17 modules of 28 retired ids).
const RETIRED = /\*\(retired\b[^)]*\)\*/i;
export function retiredIds(before, after, ids) {
  const a = reqLines(before);
  const b = reqLines(after);
  return ids.filter((id) => RETIRED.test(b.get(id) || '') && !RETIRED.test(a.get(id) || ''));
}

// The modules file (`modules_file`) at ref (or the working tree): its modules, [] when unread;
// null without a modules file configured or present.
export function readModules(root, cfg, ref = null) {
  const f = cfg.modules_file;
  if (!f) return null;
  let text = null;
  if (ref) text = exists(root, ref, f) ? git(['show', `${ref}:${f}`], { cwd: root }) : null;
  else if (existsSync(join(root, f))) text = readFileSync(join(root, f), 'utf8');
  if (text === null) return null;
  try { const m = JSON.parse(text || '{}').modules; return Array.isArray(m) ? m : []; } catch { return []; }
}

// The modules that name the provider in their `uses`, from the modules file at ref (or the
// working tree); none without a modules file.
export function usersOf(root, cfg, provider, ref = null) {
  const modules = readModules(root, cfg, ref) || [];
  return modules.filter((m) => m?.id && m.id !== provider && (m.uses || []).includes(provider)).map((m) => m.id).sort();
}

// The provider module's own source: a file under the entry's paths that is not under its tests,
// not its requirements file, entry or metrics, not a doc (Markdown, or under a docs/ directory)
// and not a record (`records`). A change to any other file cannot alter a user's behaviour.
const isDoc = (f) => /\.(md|markdown)$/i.test(f) || /(^|\/)docs\//.test(f);
export function isSource(cfg, e, f) {
  if (!(e.paths || []).some((p) => underPath(f, p))) return false;
  if ((e.tests || []).some((p) => underPath(f, p))) return false;
  if (f === e.requirements || f === entryFile(e.id) || f === metricsFile(e.id)) return false;
  return !isDoc(f) && !isRecordPath(cfg, f);
}
// The entry's source paths, as a line names them: its paths less tests, requirements, docs, records.
export const sourcePaths = (cfg, e) => (e.paths || []).filter((p) => !(e.tests || []).some((t) => underPath(p, t)) && p !== e.requirements && !isDoc(p) && !isRecordPath(cfg, p));
export const sourceChanges = (root, cfg, e, base, head) => diffNames(root, base, head).filter((f) => isSource(cfg, e, f));
export const readEntry = (root, ref, id) => {
  const t = git(['show', `${ref}:${entryFile(id)}`], { cwd: root, allowFail: true });
  try { return t.code === 0 ? JSON.parse(t.stdout) : null; } catch { return null; }
};

// The notice a merged job leaves, or null, and why not. A job that changed a file of the provider's
// own source (the entry at base) leaves one whether or not its requirement file changed
// (coordinator, 4 Nov: ai-accounts' T53 rewrite changed its exported interface with no mark
// changed, and four users broke unwarned); it names the changed requirement ids and the export
// names added, removed or changed (exports.mjs). A job that changed only tests, requirements text,
// docs or records leaves none. With no entry readable, a requirement change still counts, so a
// notice is never lost to a bad read. The users are read at usersAt, the merged result (the
// tranche may have gained a user).
export function providerChange(root, cfg, { provider, requirements, base, head, pr, usersAt = head, entry }) {
  const at = (ref) => (requirements ? git(['show', `${ref}:${requirements}`], { cwd: root, allowFail: true }).stdout : '');
  const [was, now] = [at(base), at(head)];
  const changed = changedIds(was, now);
  const retired = retiredIds(was, now, changed);
  const ids = changed.filter((id) => !retired.includes(id));
  const left = retired.length ? `left out ${retired.length} retired id(s), which change no behaviour: ${retired.join(', ')}` : null;
  const e = entry || readEntry(root, base, provider);
  const src = e ? sourceChanges(root, cfg, e, base, head) : [];
  if (!ids.length && !src.length) return { notice: null, why: retired.length ? `PR ${pr} only retired requirements (${retired.join(', ')}), which change no behaviour` : null, retired };
  const users = usersOf(root, cfg, provider, usersAt);
  if (!users.length) return { notice: null, why: null, retired };
  if (e && !src.length) {
    return { notice: null, retired, why: `PR ${pr} changed ${ids.join(', ')} but no file of ${provider}'s source (${sourcePaths(cfg, e).join(', ') || 'no source paths'}): only tests, requirements text, docs or records, which cannot change a user's behaviour; no notice for its ${users.length} user(s)` };
  }
  const notice = { key: noticeKey(provider, pr), provider, ids, pr, users };
  if (src.length) {
    notice.source = src.length;
    Object.assign(notice, readExports(root, cfg, e, base, head));
  }
  return { notice, why: null, retired, left };
}
// A provider's export changes over base..head, as a notice records them: `exports` when any name
// moved, `exports_unread` when they could not be read, and `exports_read` (the range and the entry
// files read) whenever they were read (PD-20: triage trusts "exports unchanged" only with it).
export function readExports(root, cfg, e, base, head) {
  try {
    const { files, unread, ...x } = exportRead(root, base, head, { isProviderSource: (f) => isSource(cfg, e, f), inProvider: (f) => [...(e.paths || []), ...(e.tests || [])].some((p) => underPath(f, p)), providerPaths: sourcePaths(cfg, e) });
    const moved = anyExportChange(x) ? { exports: x } : {};
    // The brief's "anything unread stays owed" (coordinator, 9 Nov): export forms the surface does not read.
    if (unread.length) return { ...moved, exports_unread: `TypeScript export forms the surface does not read in ${unread.slice(0, 3).join(', ')}${unread.length > 3 ? ` and ${unread.length - 3} more` : ''}` };
    return { ...moved, exports_read: { base, head, files } };
  } catch (err) { return { exports_unread: String(err.message || err).slice(0, 200) }; }
}
export const providerNotice = (root, cfg, opts) => providerChange(root, cfg, opts).notice;

// One file per write, added and never edited (REC-2's one writer, as messages/<sender>.jsonl):
// two merges close together never conflict. notices/<provider>-<pr>.json, and
// notices/answered/<user>-<provider>-<pr>.json.
export const NOTICES_DIR = 'notices';
const fileOf = (key) => key.replace(':', '-');
export const noticeFile = (key) => `${NOTICES_DIR}/${fileOf(key)}.json`;
export const answerFile = (user, key) => `${NOTICES_DIR}/answered/${user}-${fileOf(key)}.json`;
const listJson = (root, sb, dir) => {
  const r = git(['ls-tree', '--name-only', '-z', `refs/remotes/origin/${sb}:${dir}`], { cwd: root, allowFail: true });
  if (r.code !== 0) return [];
  return r.stdout.split('\0').filter((f) => f.endsWith('.json')).flatMap((f) => { try { return [JSON.parse(readState(root, sb, `${dir}/${f}`))]; } catch { return []; } });
};

export const WITHDRAWN_DIR = `${NOTICES_DIR}/withdrawn`;
export const withdrawFile = (key) => `${WITHDRAWN_DIR}/${fileOf(key)}.json`;

// The keys of withdrawn notices, as the fetched state branch holds them.
export const withdrawnRows = (root, sb) => listJson(root, sb, WITHDRAWN_DIR).filter((r) => r.row === 'withdrawn' && typeof r.key === 'string');
export const withdrawnKeys = (root, sb) => new Set(withdrawnRows(root, sb).map((r) => r.key));
// Every notice the state branch holds, live or withdrawn, with its unanswered users: the one reader
// behind notices (the live ones), triage, status and report tranche's count (coordinator, 4 Nov: a
// count of notices/*.json read apart from the withdrawn rows called 136 withdrawn slots open on the
// copy, which triage then could not find). A withdrawn notice carries its withdrawal row: closed,
// owing nothing, its unanswered users counted as closed by the withdrawal.
export function noticeRecords(root, sb) {
  const answered = new Set(listJson(root, sb, `${NOTICES_DIR}/answered`).map((r) => `${r.key}\0${r.user}`));
  const withdrawn = new Map(withdrawnRows(root, sb).map((r) => [r.key, r]));
  return listJson(root, sb, NOTICES_DIR).filter((r) => r.row === 'notice' && typeof r.key === 'string' && Array.isArray(r.users)).sort((a, b) => a.pr - b.pr)
    .map((n) => ({ ...n, open: n.users.filter((u) => !answered.has(`${n.key}\0${u}`)), withdrawn: withdrawn.get(n.key) || null }));
}

// Every notice with the users that have not answered it, as the fetched state branch holds them;
// a withdrawn notice (notice withdraw) is no notice.
export const notices = (root, sb) => noticeRecords(root, sb).filter((n) => !n.withdrawn).map(({ withdrawn, ...n }) => n);
export const unanswered = (root, sb, user) => notices(root, sb).filter((n) => n.open.includes(user));
// What a notice says moved: its requirement ids (or its source, when none changed), and its export
// names removed, changed and added, at most `max` of each named.
const few = (xs, max) => (xs.length > max ? `${xs.slice(0, max).join(', ')} and ${xs.length - max} more` : xs.join(', '));
export function exportsText(x, max = 8) {
  if (!x) return '';
  return [['removed', x.removed], ['changed', (x.changed || []).map((c) => c.name)], ['added', x.added]]
    .filter(([, xs]) => xs?.length).map(([w, xs]) => `${w} ${few(xs, max)}`).join('; ');
}
export const movedText = (n, max = 8) => [n.ids?.length ? n.ids.join(', ') : 'its source, no requirement text', n.exports ? `exports ${exportsText(n.exports, max)}` : ''].filter(Boolean).join('; ');
export const noticeLine = (n) => `provider notice: ${n.provider} ${movedText(n)} (PR ${n.pr})`;

// At a job's merge: the notice it leaves, and the notices its START named, answered by it. One
// write; a file already there is kept, so a rerun adds nothing.
// The answers come from the job's own start row, which the job can edit: only a key of a notice
// the state branch holds for this user is answered (confirming review of PR 54), and no file
// lands outside notices/ (a key such as "a/../../x" would otherwise reach past the worktree).
export function recordAtMerge(root, cfg, { notice, answers = [], user, pr }) {
  const at = new Date().toISOString();
  const sb = cfg.state_branch;
  const have = fetchState(root, sb, { fresh: true });
  if (answers.length) {
    const known = new Set(have ? notices(root, sb).filter((n) => n.users.includes(user)).map((n) => n.key) : []);
    answers = [...new Set(answers)].filter((k) => typeof k === 'string' && known.has(k));
  }
  const want = [
    ...(notice ? [[noticeFile(notice.key), { row: 'notice', at, ...notice }]] : []),
    ...answers.map((key) => [answerFile(user, key), { row: 'answered', at, key, user, pr }]),
  ];
  if (!want.length) return { rows: [] };
  const missing = (has) => want.filter(([f]) => !has(f));
  if (have && !missing((f) => readState(root, sb, f) !== null).length) return { rows: [] };
  return writeState(root, sb, `provider notices at the merge of PR ${pr}`, (wt) => {
    const dir = resolve(wt, NOTICES_DIR) + sep;
    for (const [f] of want) if (!resolve(wt, f).startsWith(dir)) throw new Error(`refused: ${f} is outside ${NOTICES_DIR}/`);
    const add = missing((f) => existsSync(join(wt, f)));
    for (const [f, row] of add) {
      mkdirSync(dirname(join(wt, f)), { recursive: true });
      writeFileSync(join(wt, f), JSON.stringify(row) + '\n');
    }
    return { rows: add.map(([, row]) => row) };
  });
}

// A merged pull request's range as GitHub merged it: the merge commit m, the job's head m^2, and
// the merge base of m's two parents. A shallow clone fetched m at depth 50 and asked git for the
// base, which died once the base lay 50 or more commits back on either side (defect sweep 4 Nov,
// #8). Now a shallow clone fetches m and its parents (depth 2), takes the base from GitHub's
// compare (merge_base_commit) and fetches it at depth 1: only the trees at the base and m^2 are
// read. A full clone asks git. `what` ends the refusals ("what it changed cannot be read").
export function mergedRange(root, m, { slug, n, what = 'what it changed cannot be read', read = compare } = {}) {
  const has = (rev) => git(['rev-parse', '-q', '--verify', `${rev}^{commit}`], { cwd: root, allowFail: true }).code === 0;
  const shallow = isShallow(root);
  if (!has(`${m}^1`)) git(['fetch', '-q', ...(shallow ? ['--depth=2'] : []), 'origin', m], { cwd: root, allowFail: true });
  if (!has(m)) fail(`pull request ${n} merged at ${m.slice(0, 10)}, which could not be fetched; ${what}`);
  const head = git(['rev-parse', `${m}^2`], { cwd: root, allowFail: true });
  if (head.code !== 0) fail(`pull request ${n} merged at ${m.slice(0, 10)}, which is not a merge commit; ${what}`);
  const h = head.stdout.trim();
  const p1 = git(['rev-parse', `${m}^1`], { cwd: root });
  if (!shallow) {
    const mb = git(['merge-base', p1, h], { cwd: root, allowFail: true });
    if (mb.code !== 0) fail(`pull request ${n}: no merge base of ${p1.slice(0, 10)} and ${h.slice(0, 10)}; ${what}`);
    return { head: h, mb: mb.stdout.trim() };
  }
  const sha = slug ? read(slug, p1, h)?.merge_base_commit?.sha : null;
  if (!/^[0-9a-f]{40,64}$/.test(sha || '')) fail(`this clone is shallow and GitHub did not give the merge base of pull request ${n} (${p1.slice(0, 10)} and ${h.slice(0, 10)}); ${what}; run it again`);
  if (!has(sha)) git(['fetch', '-q', '--depth=1', 'origin', sha], { cwd: root, allowFail: true });
  if (!has(sha)) fail(`this clone is shallow and could not fetch the merge base ${sha.slice(0, 10)} of pull request ${n}; ${what}; run it again`);
  return { head: h, mb: sha };
}

// notice withdraw <provider>:<pr>: BOB's act, for a notice recorded before merge held the source
// rule. The tool reads the PR's merge commit (as merge run again on a merged pull request does)
// and refuses unless the PR changed no file of the provider's own source; then one file on the
// state branch, added and never edited, and status drops the notice.
//
// PD-18: a notice whose pull request GitHub definitively says does not exist in the product
// repository (prPresence: GitHub's 404 on the pulls endpoint while the repository is served, and the
// number no PR on the issues endpoint either) is withdrawn too, its row `missing: true`: nothing can
// ever be read for it, so nothing can ever answer it. The presence is read only when getPR fails, and
// any answer short of that (a network error, a 5xx, a rate limit, a 403) refuses as before.
export function readNoticePR(slug, n, { getPR, presence = prPresence }) {
  try { return { pr: getPR(slug, n) }; } catch (err) {
    let p;
    try { p = presence(slug, n); } catch { throw err; }
    if (p?.missing !== true || typeof p.status !== 'string' || !p.status) throw err;
    return { missing: { status: p.status, why: `PR ${n} does not exist in ${slug} (GitHub ${p.status})` } };
  }
}
// Whether this repository's own history holds a merge of PR n, on the tranche or main: 'merged',
// 'none', or 'unknown' (read failed: the caller fails closed). GitHub hides a suspended account's
// PRs and answers 404 for them (copy run 42277392893, 7 Nov), so a 404 alone cannot tell a hidden
// real PR from one that never existed (cold review of C48); its merge commit stays on the branch.
// The merge tool titles it "Merge PR n: ...", GitHub's button "Merge pull request #n from ...", a
// squash "... (#n)". A full clone reads its own fetched refs. A shallow clone is not deepened (a
// date fetch can also cut history the merge train fetched deep): a throwaway bare clone of each
// branch back to a week before the notice's own time (the notice is written at its PR's merge) is
// read instead; a notice without a readable time is 'unknown' there.
export const MERGE_SUBJECT = (n) => new RegExp(`^Merge PR ${n}:|^Merge pull request #${n} |\\(#${n}\\)$`);
export function mergedHere(root, cfg, n, { at = null } = {}) {
  const refs = [...new Set([cfg.tranche, 'main'].filter(Boolean))];
  const hit = (dir, revs) => {
    const r = git(['log', '--format=%s', ...revs], { cwd: dir, allowFail: true });
    if (r.code !== 0) return null;
    return r.stdout.split('\n').some((l) => MERGE_SUBJECT(n).test(l.trim()));
  };
  if (!isShallow(root)) {
    for (const ref of refs) if (git(['fetch', '-q', 'origin', `+refs/heads/${ref}:refs/remotes/origin/${ref}`], { cwd: root, allowFail: true }).code !== 0) return 'unknown';
    const h = hit(root, refs.map((r) => `refs/remotes/origin/${r}`));
    return h === null ? 'unknown' : h ? 'merged' : 'none';
  }
  const t = Date.parse(at || '');
  if (!Number.isFinite(t)) return 'unknown';
  const since = new Date(t - 7 * 24 * 3600 * 1000).toISOString();
  const url = git(['remote', 'get-url', 'origin'], { cwd: root, allowFail: true });
  if (url.code !== 0) return 'unknown';
  return withTemp('p3-merged-', (dir) => {
    for (const ref of refs) {
      const d = join(dir, ref.replace(/[^\w.-]/g, '_'));
      const c = git(['clone', '-q', '--bare', '--filter=blob:none', `--shallow-since=${since}`, '--single-branch', '--branch', ref, url.stdout.trim(), d], { cwd: dir, allowFail: true });
      if (c.code !== 0) return 'unknown';
      const h = hit(d, [ref]);
      if (h === null) return 'unknown';
      if (h) return 'merged';
    }
    return 'none';
  });
}
const writeWithdrawn = (root, sb, key, row) => writeState(root, sb, `withdraw provider notice ${key}`, (wt) => {
  const f = join(wt, withdrawFile(key));
  if (!resolve(f).startsWith(resolve(wt, NOTICES_DIR) + sep)) throw new Error(`refused: ${withdrawFile(key)} is outside ${NOTICES_DIR}/`);
  mkdirSync(dirname(f), { recursive: true });
  if (!existsSync(f)) writeFileSync(f, JSON.stringify(row) + '\n');
  return {};
});
export function withdrawNotice(root, cfg, key, { getPR, presence = prPresence, merged = mergedHere, slug, as = 'bob', log = console.log, compare: compareRead = compare }) {
  const sb = cfg.state_branch;
  if (!fetchState(root, sb, { fresh: true })) fail(`no ${sb} on origin: no provider notice ${key}`);
  const n = notices(root, sb).find((x) => x.key === key);
  if (!n) fail(readState(root, sb, withdrawFile(key)) !== null ? `provider notice ${key} is already withdrawn` : `no provider notice ${key} on ${sb} (${noticeFile(key)})`);
  // The row's own PR number, as its key names it (a hand-edited "12x" would 404 for a real PR 12).
  if (!Number.isInteger(n.pr) || n.pr < 1 || n.key !== noticeKey(n.provider, n.pr)) fail(`refused: provider notice ${key} names pull request ${JSON.stringify(n.pr)}, not the whole number its key names`);
  const { pr, missing } = readNoticePR(slug, n.pr, { getPR, presence });
  if (missing) {
    const here = merged(root, cfg, n.pr, { at: n.at });
    if (here !== 'none') fail(here === 'merged'
      ? `refused: GitHub serves no pull request ${n.pr} in ${slug} (${missing.status}), but this repository's history holds its merge: a real PR GitHub hides; provider notice ${key} stands`
      : `refused: GitHub serves no pull request ${n.pr} in ${slug} (${missing.status}), but whether this repository's history holds its merge could not be read; provider notice ${key} stands; run it again`);
    const row = { row: 'withdrawn', at: new Date().toISOString(), key, provider: n.provider, pr: n.pr, by: as, why: missing.why, missing: true, users: n.users.length };
    writeWithdrawn(root, sb, key, row);
    log(`provider notice ${key} withdrawn: ${row.why}; ${n.open.length} unanswered user(s) no longer owe it`);
    return row;
  }
  const m = pr?.merge_commit_sha;
  if (!pr?.merged || !m) fail(`pull request ${n.pr} is not merged: what it changed cannot be read`);
  const { head: h, mb } = mergedRange(root, m, { slug, n: n.pr, read: compareRead });
  const e = readEntry(root, mb, n.provider);
  if (!e) fail(`the tranche had no ledger entry for ${n.provider} at ${mb.slice(0, 10)}: its source paths cannot be read`);
  const src = sourceChanges(root, cfg, e, mb, h);
  if (src.length) fail(`refused: pull request ${n.pr} changed ${src.length} file(s) of ${n.provider}'s source (${src.slice(0, 5).join(', ')}); provider notice ${key} stands`);
  const row = { row: 'withdrawn', at: new Date().toISOString(), key, provider: n.provider, pr: n.pr, merge_commit: m, by: as,
    why: `PR ${n.pr} changed no file of ${n.provider}'s source (${sourcePaths(cfg, e).join(', ') || 'no source paths'})`, users: n.users.length };
  writeWithdrawn(root, sb, key, row);
  log(`provider notice ${key} withdrawn: ${row.why}; ${n.open.length} unanswered user(s) no longer owe it`);
  return row;
}

// ===== file: shallow-mergebase.test.mjs =====

// Every merge base the tool reads is read on history that holds it (C8, the coordinator, 7 Nov:
// BOB's layer lands failed in a shallow checkout, where the train had deepened and the layer flow
// did not). util.git({ deepen: true }) deepens a shallow clone until the commits meet; every
// merge-base in the tool asks it, but those of the modules named below, each for its reason.
import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { commit, makeRepo } from './helpers.mjs';
import { git, isShallow } from '../lib/util.mjs';
import { outstanding } from '../lib/layerflow.mjs';

const here = dirname(fileURLToPath(import.meta.url));

function shallowPair() {
  const root = makeRepo({ 'a.txt': '0\n' });
  for (let i = 1; i <= 6; i++) commit(root, { 'a.txt': `${i}\n` }, `main ${i}`);
  git(['checkout', '-q', '-b', 'layer/1', 'HEAD~4'], { cwd: root });
  for (let i = 1; i <= 3; i++) commit(root, { 'b.txt': `${i}\n` }, `layer ${i}`);
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['clone', '-q', '--bare', root, bare], { cwd: root });
  const c = join(mkdtempSync(join(tmpdir(), 'p3-shallow-')), 'c');
  git(['clone', '-q', '--depth', '1', '--no-single-branch', `file://${bare}`, c], { cwd: root });
  return c;
}

test('a merge base asked in a shallow clone deepens it until the commits meet; is-ancestor answers on the history', () => {
  const c = shallowPair();
