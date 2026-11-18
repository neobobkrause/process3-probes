// ===== file: generated.test.mjs (continued) =====

  const c = releaseRun(rel, 'checks', { log: quiet });
  assert.equal(c.ok, true, JSON.stringify(c.results));
  assert.deepEqual(c.results.map((x) => [x.name, x.exit]), [['build generated gen/big.txt', 0], ["node -e if (!require('fs').existsSync('gen/big.txt')) process.exit(6)", 0]]);
  assert.ok(existsSync(join(rel, 'gen/big.txt')));
  assert.equal(readFileSync(join(rel, 'gen/big.txt'), 'utf8').length, 4096);
});

test('deploy dev installs the lock files before it builds the generated files (copy, 4 Nov: esbuild not found on a fresh checkout)', () => {
  const GUARD = 'p3dev guard: passed';
  const node = (code) => ['node', '-e', code];
  const deploy = { slug_prefix: 'p3dev-', dry_run: node(`console.log(${JSON.stringify(GUARD)})`), deploy: node('0'), walk: node('0'), guard_line: GUARD };
  // The build needs the installed package, as bundles.mjs needs esbuild.
  const needs = "if (!require('fs').existsSync('dep/node_modules/esbuild')) { console.error('Cannot find package esbuild'); process.exit(7) }";
  const rows = [{ ...ROWS[0], regenerate: ['sh', '-c', `node -e "${needs}" && node gen.mjs`] }];
  const lock = JSON.stringify({ name: 'dep', lockfileVersion: 3, packages: { '': {}, 'node_modules/esbuild': { version: '0.0.0' } } });
  const calls = [];
  // npm ci stands in: it installs the package where it runs; everything else runs for real.
  const exec = (cmd, args, o) => {
    calls.push(cmd);
    if (cmd !== 'npm') return run(cmd, args, o);
    mkdirSync(join(o.cwd, 'node_modules/esbuild'), { recursive: true });
    return { code: 0, stdout: '', stderr: '', seconds: 0 };
  };
  const { root } = withOrigin(product({ deploy, plan: 'close', generated: rows, lockfiles: ['dep/package-lock.json'] }, { 'dep/package.json': '{"name":"dep"}', 'dep/package-lock.json': lock }));
  assert.equal(closeLayer(root, '1').ok, true);
  git(['clean', '-qfdx', 'gen', 'dep'], { cwd: root });
  calls.length = 0;
  const out = [];
  const r = deployDev(root, { io: { compare: () => null, exec }, repo: 'o/p', log: (m) => out.push(m) });
  assert.equal(r.ok, true, out.join('\n'));
  assert.equal(calls[0], 'npm', `installed first: ${calls.join(', ')}`);
  assert.deepEqual(r.row.results.map((x) => [x.stage, x.exit]), [['build', 0], ['dry_run', 0], ['deploy', 0], ['walk', 0]]);
});

// Cold review of C31: a row whose build failed is not verified as well (a file never written): the
// build's own finding stands, alone.
test('PD-9: a built row whose build failed gives the build\'s finding only, no verify on a file never written', async () => {
  const { regenerate } = await import('../lib/checks.mjs');
  const root = makeRepo({ 'README.md': 'x\n', '.gitignore': 'out.json\n' });
  const rows = [{ paths: ['out.json'], regenerate: ['node', '-e', 'process.exit(2)'], verify: ['node', '-e', "require('fs').readFileSync('out.json')"] }];
  const b = buildGenerated(root, rows, { timeout: 60000 });
  assert.deepEqual([b.findings.length, b.failed.has(rows[0])], [1, true]);
  const g = regenerate(root, rows, { timeout: 60000, skip: b.ran, unbuilt: b.failed });
  assert.deepEqual(g.findings, []);
  assert.deepEqual([g.ran[0].verify, g.ran[0].built], [null, undefined]);
});

// ===== file: suite-budget.test.mjs =====

// status --role bob (build ci-budget, R2; Bob: "go R2"): a module whose gate suite took over 70%
// of suite_timeout_minutes, by the newest gate row on this tranche's pull requests, is one line
// among the acts, naming the module and the figure.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { commit, makeRepo, onState } from './helpers.mjs';
import { git, loadConfig } from '../lib/util.mjs';
import { BOT, GATE, block } from '../lib/github.mjs';
import { SUITE_BUDGET, suiteBudget } from '../lib/status.mjs';

const jl = (...rows) => rows.map((r) => JSON.stringify(r)).join('\n') + '\n';
const at = (h) => new Date(Date.UTC(2026, 10, 6, h)).toISOString();
const row = (h, over) => ({ at: at(h), ok: true, trigger: 'code', suite: 'pass', ...over });

function repo(config = {}) {
  const root = makeRepo({ 'README.md': 'x\n', 'process/config.json': config });
  git(['checkout', '-q', '-b', 'tranche'], { cwd: root });
  commit(root, { 'process/metrics/m.jsonl': jl(
    { at: at(0), module: 'old', row: 'merge', pr: 9 },
    { at: at(5), module: 'plane', row: 'merge', pr: 11 },
    { at: at(6), module: 'lib', row: 'merge', pr: 12 },
  ) }, 'record');
  git(['update-ref', 'refs/remotes/origin/tranche', 'HEAD'], { cwd: root });
  onState(root, { 'metrics/tranche-open.jsonl': jl({ row: 'grant', tranche: 'tranche', at: at(1), act: 'push', depth: 1, outcome: 'ok' }) });
  return root;
}
const reader = (runs) => (pr) => [{ user: { login: BOT }, body: block(GATE, { runs: runs[pr] || [] }) }];

test('suite budget: a module over 70% of suite_timeout_minutes is named with its figure; under it, or before the opening, is not', () => {
  assert.equal(SUITE_BUDGET, 0.7);
  const root = repo({ suite_timeout_minutes: 20 });
  const runs = {
    9: [row(0, { suite_by_module: { old: 19 * 60 } })], // merged before the tranche opened
    11: [row(2, { suite_by_module: { plane: 19 * 60 } }), row(4, { suite_by_module: { plane: 15 * 60, lib: 60 } })], // newest: 15 of 20
    12: [row(3, { scope: ['lib'], suite_seconds: 13 * 60 })], // a row from before suite_by_module: 13 of 20, 65%
    40: [row(7, { suite: 'fail', suite_by_module: { cli: 16.5 * 60 } })], // an open job PR, red
    41: [row(7, { suite: 'skipped', suite_by_module: { web: 19 * 60 } })], // no suite ran
  };
  const rows = [{ id: 'cli', pr: '#40 ready' }, { id: 'web', pr: '#41 draft' }, { id: 'done', pr: 'merged' }];
  const got = suiteBudget(root, loadConfig(root), { tranche: 'origin/tranche', comments: reader(runs), rows });
  assert.deepEqual(got, [
    `suite budget: cli's gate suite took 16.5 min, 83% of suite_timeout_minutes 20 (over 70%; PR 40, gate row ${at(7)}): speed or split its suite before it times out`,
    `suite budget: plane's gate suite took 15 min, 75% of suite_timeout_minutes 20 (over 70%; PR 11, gate row ${at(4)}): speed or split its suite before it times out`,
  ]);
  // A newer run of only some of a module's tests (requirements-only) does not hide its full suite.
  runs[11].push(row(6, { suite_by_module: { plane: 60 }, requirements_only: [{ module: 'plane', files: ['t/a.test.mjs'] }] }));
  assert.ok(suiteBudget(root, loadConfig(root), { tranche: 'origin/tranche', comments: reader(runs), rows }).some((l) => l.startsWith('suite budget: plane\'s gate suite took 15 min')));
  // A row's whole-run seconds count for a module only when it ran that module alone.
  runs[12] = [row(3, { scope: ['lib', 'plane'], suite_seconds: 19 * 60 })];
  assert.equal(suiteBudget(root, loadConfig(root), { tranche: 'origin/tranche', comments: reader(runs), rows }).some((l) => l.includes('lib\'s')), false);
  runs[12] = [row(3, { scope: ['lib'], suite_seconds: 14.5 * 60 })];
  assert.match(suiteBudget(root, loadConfig(root), { tranche: 'origin/tranche', comments: reader(runs), rows }).find((l) => l.includes('lib\'s')), /lib's gate suite took 14\.5 min, 73% of suite_timeout_minutes 20/);
  // The default limit is 20; a smaller one names smaller suites.
  const tight = repo({ suite_timeout_minutes: 10 });
  assert.equal(suiteBudget(tight, loadConfig(tight), { tranche: 'origin/tranche', comments: reader({ 12: [row(3, { suite_by_module: { lib: 7.5 * 60 } })] }), rows: [] })[0].startsWith('suite budget: lib\'s gate suite took 7.5 min, 75% of suite_timeout_minutes 10'), true);
  // Unread: null, so status says so instead of guessing.
  assert.equal(suiteBudget(root, loadConfig(root), { tranche: 'origin/tranche', comments: () => { throw new Error('unread'); }, rows }), null);
  assert.equal(suiteBudget(root, loadConfig(root), { tranche: 'origin/tranche', comments: () => null, rows }), null);
});

// ===== file: take-in-record.test.mjs =====

// Take-in scope of the record check (copy PR 86, 4 Nov): the earlier work a take-in brings,
// before its start commit, is left out; the start commit and everything after it are judged.
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { jobStart } from '../lib/job.mjs';
import { recordCheck, takenIn } from '../lib/record.mjs';
import { DEFAULTS, git } from '../lib/util.mjs';
import { main } from '../p3.mjs';
import { commit, entry, makeRepo, write } from './helpers.mjs';

const H = '## Standing approvals from Bob';
const claude = (words) => `${H}\n\n${words}\n\n## Other\n\nmore\n`;
const cfg = { ...DEFAULTS };
const session = () => ({ committer: { login: 'neobobkrause' }, author: { login: 'neobobkrause' }, commit: { verification: { verified: false } } });
const quiet = () => {};
const sha = (root, rev = 'HEAD') => git(['rev-parse', rev], { cwd: root });

// The tranche holds the process; earlier work on feature/a, made outside it, removed .process
// and changed the approvals, then put both back, so its net change is the module's alone.
function product() {
  const root = makeRepo({ '.process': 'tool\n', 'CLAUDE.md': claude('may push'), 'process/ledger/alpha.json': entry('alpha'), 'req/alpha.md': '# alpha\n' });
  git(['branch', 'tranche'], { cwd: root });
  git(['checkout', '-q', '-b', 'feature/a'], { cwd: root });
  rmSync(join(root, '.process'));
  commit(root, { 'CLAUDE.md': claude('may force-push') }, 'old repo: no .process, other approvals');
  commit(root, { '.process': 'tool\n', 'CLAUDE.md': claude('may push'), 'src/alpha/x.mjs': 'export const x = 1;\n' }, 'old repo: the work');
  git(['checkout', '-q', 'tranche'], { cwd: root });
  commit(root, { 'src/beta/b.mjs': 'export const b = 1;\n' }, 'the tranche moves on');
  return root;
}

function takeIn() {
  const root = product();
  const tip = sha(root, 'feature/a');
  jobStart(root, 'alpha', { coordinator: 's', takeIn: 'feature/a', push: false, log: quiet });
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  return { root, tip, base: sha(root, 'tranche'), start: sha(root) };
}

const check = (root, base) => {
  const t = takenIn(root, { base, id: 'alpha' });
  const r = recordCheck(root, cfg, { base, lookup: session, takenIn: t.tips });
  return { ...r, tips: t.tips, findings: [...r.findings, ...t.findings] };
};

test('a take-in whose earlier history removes .process and changes the approvals passes, its start commit judged', () => {
  const { root, tip, base, start } = takeIn();
  assert.deepEqual(git(['log', '-1', '--format=%P', start], { cwd: root }).split(' '), [tip, base]);
  // Without the take-in scope, the earlier work's commits are found (the copy's 70 findings).
  const all = recordCheck(root, cfg, { base, lookup: session });
  assert.ok(all.findings.some((f) => /removes \.process/.test(f.message)), JSON.stringify(all.findings));
  assert.ok(all.findings.some((f) => f.check === 'approvals'));
  const r = check(root, base);
  assert.deepEqual(r.tips, [tip]);
  assert.deepEqual(r.findings, []);
  assert.equal(r.commits, 1, 'the take-in start commit alone is judged');
});

test('the take-in start commit itself is judged: one that changes the approvals is found', () => {
  const { root, tip, base } = takeIn();
  // The start amended (as a tampered start would be) to change the approvals as well.
  write(root, { 'CLAUDE.md': claude('may merge to main') });
  git(['add', '-A'], { cwd: root });
  git(['commit', '-q', '--amend', '--no-edit'], { cwd: root });
  const r = check(root, base);
  assert.deepEqual(r.tips, [tip]);
  assert.ok(r.findings.some((f) => f.check === 'approvals' && f.message.includes(sha(root).slice(0, 10))), JSON.stringify(r.findings));
});

test('a later commit on the job that changes the approvals is still found', () => {
