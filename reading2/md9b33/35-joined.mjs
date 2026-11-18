// ===== file: status-acts.test.mjs (continued) =====

  assert.deepEqual(out.slice(0, 2), ['plan stop: take no new step', 'acts now: 1 (a): see red gates: act now; plan stop: they wait for the plan to resume']);
});

// ===== file: switch.test.mjs (later part) =====

  assert.equal(git(['ls-remote', 'origin', 'refs/heads/process-state'], { cwd: root }), before, 'nothing written');
  // The process repository, admin or unreadable: failed, naming Bob's fix; the result says so.
  git(['checkout', '-q', 'tranche'], { cwd: root });
  commit(root, { 'process/config.json': { tranche: 'tranche', coordinator: COORD, process_repo: 'https://github.com/o/process3' } });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  const api = (p) => (p === 'user' ? { login: 'acmewidget' } : p === 'repos/o/process3' ? { permissions: { push: true, admin: true } } : { permissions: { push: true, admin: false } });
  const out2 = [];
  const r2 = switchIn(root, { by: NEW, preflight: true, slug: 'o/p', io: { ...okIO, api }, log: (l) => out2.push(l) });
  assert.equal(r2.ok, false);
  assert.ok(out2.some((l) => /FAILED: o\/process3: push true, admin true .*Fixes it: Bob: install the Claude GitHub App on o\/process3/.test(l)));
});

test('switch in retires the old account\'s sessions: R13 ends a lane seat bound to one with no session list; the restart names the layer flow and the lanes', () => {
  const root = withLanes(product(), { layer: true });
  const tasks = { triggers: [...TASKS.triggers, { id: 'trig_lane', name: 'ux check-in', enabled: true, persistent_session_id: 'session_uxold', cron_expression: '5 * * * *', prompt: 'ux session_uxold: next PR' },
    { id: 'trig_fresh', name: 'nightly census', enabled: true, persist_session: false, cron_expression: '7 3 * * *', derived_state: { prompt: 'Run node .process/tool/p3.mjs setup check' } }] };
  const { t, s } = files(root, { tasks, sessions: SESSIONS });
  switchOut(root, { tasks: t, sessions: s, by: COORD, read, log: quiet });
  const out = [];
  switchIn(root, { sessions: s, by: NEW, slug: 'o/p', io: okIO, log: (l) => out.push(l) });
  // A spent manifest is never compared by a later preflight (review of R16).
  const pre = [];
  switchIn(root, { by: NEW, preflight: true, slug: 'o/p', io: okIO, log: (l) => pre.push(l) });
  assert.match(pre[0], /the manifest is an earlier switch's, already switched in \(the approvals are not compared\)/);
  fetchState(root, 'process-state', { fresh: true });
  const retired = JSON.parse(readState(root, 'process-state', RETIRED_FILE));
  assert.ok(retired.sessions.includes('session_uxold') && retired.sessions.includes(COORD) && !retired.sessions.includes(NEW));
  const cfg = loadConfig(root);
  assert.equal(readFacts(root, cfg).sessionGone('session_uxold'), true, 'gone with no list');
  assert.equal(readFacts(root, cfg).sessionGone('session_new1'), null);
  assert.deepEqual(expireRecords(root, cfg, { log: quiet }).seats.sort(), ['triage', 'ux']);
  fetchState(root, 'process-state', { fresh: true });
  assert.equal(readSeats(root, cfg).size, 0);
  const text = out.join('\n');
  assert.match(text, /\(f\) BOB, for each open layer \(2\): `node \.process\/tool\/p3\.mjs layer jobs <n>`/);
  assert.doesNotMatch(text, /job start --ready/);
  // The seat ends at ROOT's sweep, which can run before (h): a plain lane start, --replace only if still held.
  assert.match(text, /\(h\) BOB restarts each lane .*\n    - `node \.process\/tool\/p3\.mjs lane start ux` \(`--replace session_uxold` if it says the seat is still held\).*then send it its 1 open ask/);
  // Each ask again with its own --context files (cold review of R16).
  assert.match(text, /\n      node \.process\/tool\/p3\.mjs lane ask ux 'which words\?' --context 'docs\/ux\/brief\.md'/);
  // The shell gives lane ask the question as recorded: $, ' and backticks stay text (cold review).
  const line = text.split('\n').find((l) => l.includes('lane ask triage'));
  const said = spawnSync('bash', ['-c', `printf '%s' ${line.trim().replace(/^node \S+ lane ask triage /, '')}`], { encoding: 'utf8' }).stdout;
  assert.equal(said, "is a $5 tier's `cap` in scope?");
  // A lane-bound task waits for (h); a fresh process task is recreated as one.
  assert.match(text, /    - ux check-in \(lane ux\): created at \(h\)/);
  assert.match(text, /    - then ux check-in \(lane ux\): .*"persistent_session_id":"<the new lane ux id you recorded>","prompt":"ux <the new lane ux id>: next PR"/);
  assert.ok(text.indexOf('then ux check-in') > text.indexOf('(h) BOB restarts'));
  assert.match(text, /    - nightly census \(fresh\): .*"create_new_session_on_fire":true/);
  assert.match(text, /retired \d+ session\(s\) of the old account/);
});

test('C40: a fresh task is the process\'s when its prompt names the product, read from the clone\'s origin as a whole word, never a fixed product name', () => {
  const t = processTask('widget-copy');
  assert.ok(t.test('Walk widget-copy at its tranche'));
  assert.ok(t.test('run node .process/tool/p3.mjs status'));
  assert.ok(!t.test('widget-copy-old notes'), 'a longer name is another repository');
  assert.ok(!t.test('civic things'), 'no product name is built in');
  assert.ok(processTask('o').test('check o now') && !processTask('o').test('not ours'), 'a short name matches only as a word');
  assert.ok(!processTask(null).test('widget-copy'), 'no origin, no product name');
});

test('C40: product_names in process/config.json adds the product\'s other names; the origin\'s name is always one; a malformed list is refused', (ctx) => {
  // In a workflow GITHUB_REPOSITORY names the repository before origin does (repoSlug): not here.
  const was = process.env.GITHUB_REPOSITORY;
  delete process.env.GITHUB_REPOSITORY;
  ctx.after(() => { if (was !== undefined) process.env.GITHUB_REPOSITORY = was; });
  const root = makeRepo({ 'a.md': 'x\n' });
  git(['remote', 'add', 'origin', 'https://github.com/acme/widget-copy.git'], { cwd: root });
  assert.deepEqual(productNames(root, {}), ['widget-copy']);
  const names = productNames(root, { product_names: ['Widget', 'widget.example'] });
  assert.deepEqual(names, ['widget-copy', 'Widget', 'widget.example']);
  const t = processTask(names);
  assert.ok(t.test('Walk widget at the tranche') && t.test('check widget.example') && t.test('on widget-copy'));
  assert.ok(!t.test('widgetx'));
  assert.throws(() => productNames(root, { product_names: 'Widget' }), /product_names: a list of non-empty names/);
  assert.throws(() => productNames(root, { product_names: [''] }), /product_names/);
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
