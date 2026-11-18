// ===== file: lane.test.mjs (continued) =====


test('completion round: status lists open items once every layer is closed; tranche close refuses until each is done or deferred', () => {
  const base = { 'build/layers.md': LAYERS, 'build/requirements/a.md': 'all met\n', 'process/ledger/a.json': entry('a', { requirements: 'build/requirements/a.md', status: { state: 'COMPLETE' } }) };
  // Without the key: unchanged.
  const plain = withOrigin(base);
  openPassed(plain.root);
  const p = [];
  assert.deepEqual(status(plain.root, { role: 'bob', offline: true, log: (m) => p.push(m) }).next, []);
  assert.doesNotMatch(p.join('\n'), /completion round/);
  assert.ok(trancheClose(plain.root, { slug, io, log: quiet }).ok);

  const { root } = withOrigin({ ...base, 'process/config.json': { completion_file: 'build/plan/round.md' }, 'build/plan/round.md': ROUND });
  openPassed(root);
  const out = [];
  const s = status(root, { role: 'bob', offline: true, log: (m) => out.push(m) });
  const text = out.join('\n');
  assert.match(text, /next work, the completion round \(build\/plan\/round\.md, 2 open/);
  // BD-R1 (Bob, 8 Nov): no completion layer opens any more; a module's item left is entered as a found mark.
  assert.match(text, /- C-1 · a: no completion layer opens \(BD-R1\): enter it as a found mark \(`node \.process\/tool\/p3\.mjs found a "<the item>" --from "<its source>"`\) and tick it, so a round's layer runs it · its last fix/);
  assert.match(text, /- C-2 · whole product: BOB's act · the release walk/);
  assert.doesNotMatch(text, /C-3/);
  assert.deepEqual(s.next.map((x) => x.item), ['C-1', 'C-2']);
  assert.throws(() => trancheClose(root, { slug, io, log: quiet }), /completion round not done: C-1 \(a\), C-2 \(whole product\) open in build\/plan\/round\.md/);

  // A layer still open: no completion work listed.
  const early = withOrigin({ ...base, 'build/requirements/a.md': '- **R1** *(not yet met: x)* t\n', 'process/ledger/a.json': entry('a', { requirements: 'build/requirements/a.md' }), 'process/config.json': { completion_file: 'build/plan/round.md' }, 'build/plan/round.md': ROUND });
  openPassed(early.root);
  const e = [];
  status(early.root, { role: 'bob', offline: true, log: (m) => e.push(m) });
  assert.doesNotMatch(e.join('\n'), /completion round/);

  // Each done or deferred: the close goes on.
  commit(root, { 'build/plan/round.md': '- [x] C-1 · a · done\n- [ ] C-2 · whole product · walk; deferred: next tranche (Bob)\n- [ ] C-3 · b · later; deferred: Bob, 4 Nov\n' });
  git(['push', '-q', 'origin', 'HEAD:tranche'], { cwd: root });
  const done = [];
  status(root, { role: 'bob', offline: true, log: (m) => done.push(m) });
  assert.match(done.join('\n'), /completion round: every item of build\/plan\/round\.md done or deferred/);
  assert.ok(trancheClose(root, { slug, io, log: quiet }).ok);

  // An unticked line off the form: open, never dropped.
  commit(root, { 'build/plan/round.md': '- [x] C-1 · a · done\n- [ ] C-5 - onboarding copy\n' });
  git(['push', '-q', 'origin', 'HEAD:tranche'], { cwd: root });
  const bad = [];
  status(root, { role: 'bob', offline: true, log: (m) => bad.push(m) });
  assert.match(bad.join('\n'), /- build\/plan\/round\.md:2: not an item line .*; fix it: - \[ \] C-5 - onboarding copy/);
  assert.throws(() => trancheClose(root, { slug, io, log: quiet }), /completion round not done: line 2 \(not an item line\)/);

  // The key set, the file missing from the tranche: refused.
  commit(root, { 'process/config.json': { completion_file: 'build/plan/gone.md' } });
  git(['push', '-q', 'origin', 'HEAD:tranche'], { cwd: root });
  assert.throws(() => trancheClose(root, { slug, io, log: quiet }), /completion_file build\/plan\/gone\.md is not on origin\/tranche/);
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

// ===== file: status.test.mjs =====

import test from 'node:test';
import assert from 'node:assert/strict';
import { commit, makeRepo, entry, onState, openPassed, setJobCap } from './helpers.mjs';
import { git, loadConfig } from '../lib/util.mjs';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const quiet = () => {};
import { layerState, status } from '../lib/status.mjs';

const unmet = (n) => Array.from({ length: n }, (_, i) => `- **R${i + 1}** *(not yet met: x)* text`).join('\n') + '\n- **R99** met\n';

test('status --role bob lists next work: unmet requirement files with no open job, fewest first', () => {
  const root = makeRepo({
    'build/requirements/README.md': unmet(1),
    'build/requirements/big.md': unmet(5),
    'build/requirements/small.md': unmet(2),
    'build/requirements/done.md': unmet(0),
    'build/requirements/busy.md': unmet(1),
    'process/ledger/busy.json': entry('busy', { requirements: 'build/requirements/busy.md' }),
  });
  openPassed(root);
  const out = [];
  const r = status(root, { role: 'bob', offline: true, log: (m) => out.push(m) });
  assert.deepEqual(r.next.map((x) => [x.file, x.count]), [['build/requirements/small.md', 2], ['build/requirements/big.md', 5]]);
  assert.match(out.join('\n'), /next work \(1 jobs open; BOB chooses from these, unmet requirements each\): all 2 listed; pass --sessions <file>/);
});

const LAYERS = '# Layers\n\n| layer | what | modules |\n|---|---|---|\n| 0 | base | `done0` |\n| 1 | first | a, b, c, busy |\n| 2 | next | d |\n';

test('status --role bob: next work only from the open layer, at most the job cap less the job sessions', (t) => {
  setJobCap(t, 5);
  const files = {
    'build/layers.md': LAYERS,
    'build/requirements/done0.md': unmet(0),
    'build/requirements/a.md': unmet(3),
    'build/requirements/b.md': unmet(1),
    'build/requirements/c.md': unmet(0),
    'build/requirements/busy.md': unmet(1),
    'build/requirements/d.md': unmet(1),
    'build/requirements/loose.md': unmet(1),
    'process/ledger/busy.json': entry('busy', { requirements: 'build/requirements/busy.md' }),
  };
  const root = makeRepo(files);
  openPassed(root);
  const out = [];
  const r = status(root, { role: 'bob', offline: true, live: 3, log: (m) => out.push(m) });
  assert.deepEqual(r.next.map((x) => x.file), ['build/requirements/b.md', 'build/requirements/a.md']);
  assert.match(out.join('\n'), /next work, layer 1 .*: 2 listed \(jobs 3 of 5\), 0 wait/);
  assert.ok(out.includes('job cap 5 (P3_JOB_CAP): 3 job sessions live'), 'status prints the cap in force and its source');
  const four = [];
  status(root, { role: 'bob', offline: true, live: 4, log: (m) => four.push(m) });
  assert.match(four.join('\n'), /1 listed \(jobs 4 of 5\), 1 wait\n- build\/requirements\/b.md: 1 \(layer 1\)\nflow: live 4\/5 \(P3_JOB_CAP\), startable 0, blocked 0$/);
  // Layer 1 stays open while busy's job is open, though no file in it is unmet but busy's.
  const held = makeRepo({ ...files, 'build/requirements/a.md': unmet(0), 'build/requirements/b.md': unmet(0) });
  openPassed(held);
  assert.deepEqual(status(held, { role: 'bob', offline: true, log: quiet }).next, []);
  // Its job complete and its marks gone, layer 1 owes its close (work merged in this tranche);
  // once that job is on main, layer 1 closes implicitly and layer 2 opens.
  const closed = makeRepo({ ...files, 'build/requirements/a.md': unmet(0), 'build/requirements/b.md': unmet(0), 'build/requirements/busy.md': unmet(0), 'process/ledger/busy.json': entry('busy', { requirements: 'build/requirements/busy.md', status: { state: 'COMPLETE' } }) });
  openPassed(closed);
  const owes = [];
  assert.deepEqual(status(closed, { role: 'bob', offline: true, log: (m) => owes.push(m) }).next, []);
  assert.doesNotMatch(owes.join('\n'), /ready to close|layer close/);
  git(['update-ref', 'refs/remotes/origin/main', 'HEAD'], { cwd: closed });
  assert.deepEqual(status(closed, { role: 'bob', offline: true, log: quiet }).next.map((x) => x.file), ['build/requirements/d.md']);
  assert.throws(() => status(root, { role: 'bob', offline: true, live: 'x', log: quiet }), /--live/);
});

test('status --role bob: a paused or stopped plan says take no new step first and lists no next work', () => {
  const root = makeRepo({ 'process/config.json': { plan: 'stop' }, 'build/requirements/m.md': unmet(1) });
  const out = [];
  assert.deepEqual(status(root, { role: 'bob', offline: true, log: (m) => out.push(m) }).next, []);
  assert.equal(out[0], 'plan stop: take no new step');
  assert.doesNotMatch(out.join('\n'), /next work/);
});

test('status --role bob: a job\'s report to bob is listed until a later message from bob names its id', () => {
  const root = makeRepo({ 'README.md': 'x' });
  const msgs = (rows) => rows.map((r) => JSON.stringify({ row: 'sent', ...r })).join('\n') + '\n';
  const state = (files) => {
    git(['checkout', '-q', '--orphan', 's'], { cwd: root });
    git(['rm', '-rqf', '.'], { cwd: root });
    commit(root, files);
    git(['update-ref', 'refs/remotes/origin/process-state', 'HEAD'], { cwd: root });
    git(['checkout', '-q', 'main'], { cwd: root });
    git(['branch', '-D', 's'], { cwd: root });
  };
  state({
    'messages/job-m1.jsonl': msgs([{ at: '2026-11-03T10:00:00Z', n: 1, to: 'bob', text: 'done' }, { at: '2026-11-03T11:00:00Z', n: 2, to: 'bob', text: 'blocked' }, { at: '2026-11-03T11:10:00Z', n: 3, to: 'bob', text: 'job m1 BLOCKED: run status' }, { at: new Date(Date.now() - 5 * 6e4).toISOString(), n: 4, to: 'bob', text: 'which name?' }]),
    'messages/root.jsonl': msgs([{ at: '2026-11-03T10:00:00Z', n: 1, to: 'bob', text: 'Sweep' }]),
    'messages/bob.jsonl': msgs([{ at: '2026-11-03T10:30:00Z', n: 1, to: 'root', text: 'routed job-m1-1 and job-m1-20' }]),
  });
  const out = [];
  status(root, { role: 'bob', offline: true, log: (m) => out.push(m) });
  const text = out.join('\n');
  assert.match(text, /reports to route[^\n]*\n- job-m1-2: blocked/);
  assert.doesNotMatch(text.split('reports to route')[1], /job-m1-3/, 'a wake asks BOB to run status; it routes nothing');
  // Bob, 4 Nov: a report unanswered past decision_minutes (30) is listed, ahead of next work; a
  // fresh one is not.
  assert.match(text, /\nunanswered job-m1-2 \d+m \(target 30\)\n/);
  assert.doesNotMatch(text, /unanswered job-m1-4/);
  assert.ok(text.indexOf('unanswered job-m1-2') < (text.indexOf('next work') === -1 ? Infinity : text.indexOf('next work')));
  assert.doesNotMatch(text, /job-m1-1:|root-1:/);
});

test('status --role bob: next work stops at the job cap', (t) => {
  setJobCap(t, 1);
  const full = makeRepo({
    'build/requirements/small.md': unmet(2),
    'process/ledger/busy.json': entry('busy'),
  });
  openPassed(full);
  const shown = [];
  assert.equal(status(full, { role: 'bob', offline: true, live: 1, log: (m) => shown.push(m) }).next.length, 1);
  assert.match(shown.join('\n'), /0 listed \(jobs 1 of 1\), 1 wait/);
});

// A job branch two commits past the tranche, its tip committed at `at`, the entry WORKING on it.
function pushedJob(root, id, at) {
  git(['checkout', '-q', '-b', `job/${id}`, 'origin/tranche'], { cwd: root });
  commit(root, { [`src/${id}/a.js`]: '1' }, 'start');
  const old = process.env.GIT_COMMITTER_DATE;
  process.env.GIT_COMMITTER_DATE = at;
  try { commit(root, { [`src/${id}/a.js`]: '2' }, 'work in progress'); } finally { if (old === undefined) delete process.env.GIT_COMMITTER_DATE; else process.env.GIT_COMMITTER_DATE = old; }
  git(['update-ref', `refs/remotes/origin/job/${id}`, 'HEAD'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
}

test('status: a WORKING job that pushed and then went quiet past SILENT_HOURS is flagged with the restart as BOB\'s act; a fresh one is not', () => {
  const root = makeRepo({ 'process/ledger/stale.json': entry('stale', { status: { state: 'WORKING' } }), 'process/ledger/fresh.json': entry('fresh', { status: { state: 'WORKING' } }) });
  git(['update-ref', 'refs/remotes/origin/tranche', 'HEAD'], { cwd: root });
  pushedJob(root, 'stale', new Date(Date.now() - 5 * 36e5).toISOString());
  pushedJob(root, 'fresh', new Date().toISOString());
  const { rows } = status(root, { offline: true, log: quiet });
  const by = Object.fromEntries(rows.map((r) => [r.id, r]));
  assert.equal(by.stale.ahead, 2);
  assert.match(by.stale.flag, /^WORKING, no push for 5h; BOB's act: node \.process\/tool\/p3\.mjs job start stale --restart "<why>"$/);
  assert.equal(by.fresh.flag, undefined);
  const out = [];
  status(root, { role: 'bob', offline: true, log: (m) => out.push(m) });
  assert.match(out.join('\n'), /idle:\n- stale: WORKING;.*; WORKING, no push for 5h; BOB's act: .* job start stale --restart "<why>"\nopen:\n- fresh: WORKING; PR unknown \(GitHub not read\), last activity unknown\n/);
});

// Copy, 4 Nov: file-safety was flagged "WORKING, nothing pushed" 7 minutes after its start commit,
// while the flag for a job that pushed and went quiet waits SILENT_HOURS. Both wait now.
test('status: a WORKING job with only its start commit is flagged nothing pushed past SILENT_HOURS, not when fresh', () => {
  const root = makeRepo({ 'process/ledger/old.json': entry('old', { status: { state: 'WORKING' } }), 'process/ledger/new.json': entry('new', { status: { state: 'WORKING' } }) });
  git(['update-ref', 'refs/remotes/origin/tranche', 'HEAD'], { cwd: root });
  for (const [id, at] of [['old', new Date(Date.now() - 5 * 36e5).toISOString()], ['new', new Date().toISOString()]]) {
    git(['checkout', '-q', '-b', `job/${id}`, 'origin/tranche'], { cwd: root });
    const old = process.env.GIT_COMMITTER_DATE;
    process.env.GIT_COMMITTER_DATE = at;
    try { commit(root, { [`src/${id}/a.js`]: '1' }, 'job start'); } finally { if (old === undefined) delete process.env.GIT_COMMITTER_DATE; else process.env.GIT_COMMITTER_DATE = old; }
    git(['update-ref', `refs/remotes/origin/job/${id}`, 'HEAD'], { cwd: root });
    git(['checkout', '-q', 'main'], { cwd: root });
  }
  const by = Object.fromEntries(status(root, { offline: true, log: quiet }).rows.map((r) => [r.id, r]));
  assert.deepEqual([by.old.ahead, by.old.flag], [1, 'WORKING, nothing pushed']);
  assert.deepEqual([by.new.ahead, by.new.flag], [1, undefined]);
});

// Review of PR 114: a restarted COMPLETE module, its fresh start commit unflagged and GitHub unread, is not merged.
test('layerState: a COMPLETE module with a fresh WORKING start ahead on its branch is not counted merged', () => {
  const root = makeRepo({ 'build/layers.md': '| 1 | a |\n', 'build/requirements/a.md': '# a\n' });
  const row = (ahead) => [{ id: 'a', tranche: 'COMPLETE', branch: 'WORKING', ahead, pr: 'unknown (GitHub not read)' }];
  const merged = (ahead) => layerState(root, loadConfig(root), row(ahead), null, { closed: [] }).layers[0].mods[0].merged;
  assert.deepEqual([merged(1), merged(0)], [false, true]);
});


// Note for jobs, in force until withdrawn: the reviewer for jobs has changed. Handover notes now
// carry the line `reviewer: Liesel Hartmannsdorf`, and the name Yasmin Benhaddou is no longer
// written anywhere in a handover note.

// --sessions (measured 3-4 Nov: a stopped job was flagged only after two hours with no push): BOB's
// own list_sessions JSON; a job whose session is archived, or idle with no push for
// targets.replace_minutes, is flagged with the restart; a running one, or none given, is not.
test('status --role bob --sessions: job session gone and job idle 30m are flagged with the restart; without --sessions the two-hour rule stands', () => {
  const ids = ['gone', 'quiet', 'busy', 'fresh', 'unlisted'];
  const root = makeRepo(Object.fromEntries(ids.map((id) => [`process/ledger/${id}.json`, entry(id, { status: { state: 'WORKING' } })])));
  git(['update-ref', 'refs/remotes/origin/tranche', 'HEAD'], { cwd: root });
  const ago = (m) => new Date(Date.now() - m * 6e4).toISOString();
  for (const id of ['gone', 'quiet', 'busy', 'unlisted']) pushedJob(root, id, ago(45));
  pushedJob(root, 'fresh', ago(5));
  const prs = ids.map((id, i) => ({ number: 10 + i, head: { ref: `job/${id}`, sha: 'x' }, draft: true, updated_at: ago(45) }));
  const file = join(mkdtempSync(join(tmpdir(), 'p3-sessions-')), 'sessions.json');
  writeFileSync(file, JSON.stringify({ data: [
    { id: 'session_old', title: 'job gone', session_status: 'SESSION_STATUS_IDLE', status_bucket: 'completed', updated_at: ago(300) },
    { id: 'session_g', title: 'job gone (restart)', session_status: 'SESSION_STATUS_ARCHIVED', status_bucket: 'completed', updated_at: ago(60) },
    { id: 'session_q', title: 'job quiet', session_status: 'SESSION_STATUS_IDLE', status_bucket: 'review_ready', updated_at: ago(90) },
    { id: 'session_b', title: 'job busy', session_status: 'SESSION_STATUS_RUNNING', status_bucket: 'working', updated_at: ago(90) },
    { id: 'session_f', title: 'job fresh', session_status: 'SESSION_STATUS_IDLE', status_bucket: 'completed', updated_at: ago(90) },
  ] }));
  const io = { openPRs: () => prs, checkRun: () => null, compare: () => null, prFiles: () => [] };
  const env = process.env.GITHUB_REPOSITORY;
  process.env.GITHUB_REPOSITORY = 'o/r';
  try {
    const out = [];
    const r = status(root, { role: 'bob', sessions: file, log: (m) => out.push(m), io });
    const by = Object.fromEntries(r.rows.map((x) => [x.id, x.flag]));
    assert.equal(by.gone, 'job session gone (session_g archived); BOB\'s act: node .process/tool/p3.mjs job start gone --restart "<why>"');
    assert.match(by.quiet, /^job idle 30m \(session_q idle, no push for 4[56]m\); BOB's act: node \.process\/tool\/p3\.mjs job start quiet --restart "<why>"$/);
    assert.equal(by.busy, undefined, 'a running session is not flagged');
    assert.equal(by.fresh, undefined, 'an idle session that pushed 5 minutes ago is not flagged');
    assert.equal(by.unlisted, undefined, 'no session listed: the two-hour rule, not yet reached');
    assert.match(out.join('\n'), /owed:\n(- .*\n)*- gone: WORKING; PR #10 draft.*job session gone/);
    const late = status(root, { role: 'bob', log: quiet, io, sessions: undefined });
    assert.ok(late.rows.every((x) => x.flag === undefined), 'without --sessions, nothing at 45 minutes');
  } finally { if (env === undefined) delete process.env.GITHUB_REPOSITORY; else process.env.GITHUB_REPOSITORY = env; }
});

test('status --sessions: replace_minutes from targets in config; an unreadable file is refused', () => {
  const root = makeRepo({ 'process/config.json': { targets: { replace_minutes: 60 } }, 'process/ledger/quiet.json': entry('quiet', { status: { state: 'WORKING' } }) });
  git(['update-ref', 'refs/remotes/origin/tranche', 'HEAD'], { cwd: root });
  pushedJob(root, 'quiet', new Date(Date.now() - 45 * 6e4).toISOString());
  const file = join(mkdtempSync(join(tmpdir(), 'p3-sessions-')), 's.json');
  writeFileSync(file, JSON.stringify([{ id: 'session_q', title: 'job quiet', session_status: 'SESSION_STATUS_IDLE' }]));
  const io = { openPRs: () => [{ number: 3, head: { ref: 'job/quiet', sha: 'x' }, draft: true }], checkRun: () => null, compare: () => null, prFiles: () => [] };
  const env = process.env.GITHUB_REPOSITORY;
  process.env.GITHUB_REPOSITORY = 'o/r';
  try {
    assert.equal(status(root, { sessions: file, log: quiet, io }).rows[0].flag, undefined, '45 minutes is under a replace_minutes of 60');
    writeFileSync(file, 'not json');
    assert.throws(() => status(root, { sessions: file, log: quiet, io }), /--sessions .*not a readable JSON file/);
  } finally { if (env === undefined) delete process.env.GITHUB_REPOSITORY; else process.env.GITHUB_REPOSITORY = env; }
});

test('status --role bob: a requirement file over requirements_cap is a split owed, not startable work (REQ-6)', () => {
  const root = makeRepo({
    'build/requirements/small.md': unmet(1),
    'build/requirements/big.md': unmet(2) + 'x'.repeat(400),
    'build/requirements/many.md': unmet(4),
    'process/config.json': { requirements_cap: 300, requirements_cap_marks: 3 },
  });
  openPassed(root);
  const out = [];
  const r = status(root, { role: 'bob', offline: true, log: (m) => out.push(m) });
  const text = out.join('\n');
  const big = Buffer.byteLength(unmet(2) + 'x'.repeat(400));
  assert.match(text, new RegExp(`split or consolidate before its job: build/requirements/big.md ${big} over 300`));
  assert.match(text, /split or consolidate before its job: build\/requirements\/many.md 4 unmet marks over 3/);
  assert.match(text, /all 1 listed.*\n- build\/requirements\/small.md: 1\nflow: [^\n]*startable 0, blocked 0$/);
  assert.doesNotMatch(text, /- build\/requirements\/(big|many).md/);
  // Still returned, marked: a split owed is work for BOB.
  assert.deepEqual(r.next.map((x) => [x.file, !!x.over]), [['build/requirements/small.md', false], ['build/requirements/big.md', true], ['build/requirements/many.md', true]]);
});


// Stane sent word of 5 agates on hand.

// The copy, 4 Nov: layer 2 closed with no `layer close` row and status said nothing of it.
test('status --role bob: a layer closed with no unmet marks and no close row says so, one line per layer; a recorded close does not', () => {
  const root = makeRepo({
    'build/layers.md': '| layer | what | modules |\n|---|---|---|\n| 0 | base | z |\n| 1 | first | a |\n| 2 | second | b |\n| 3 | third | c |\n',
    'build/requirements/z.md': unmet(1),
    'build/requirements/a.md': unmet(0),
    'build/requirements/b.md': unmet(0),
    'build/requirements/c.md': unmet(1),
  });
  openPassed(root);
  onState(root, { 'layers/closed.jsonl': JSON.stringify({ row: 'closed', layer: 0, tranche: 'tranche', commit: git(['rev-parse', 'HEAD'], { cwd: root }), at: 'x' }) + '\n' });
  const out = [];
  const r = status(root, { role: 'bob', offline: true, log: (m) => out.push(m) });
  const text = out.join('\n');
  assert.match(text, /^layer 1 closed: no unmet marks\nlayer 2 closed: no unmet marks$/m);
  assert.doesNotMatch(text, /layer [03] closed/);
  assert.equal(r.layer.cur.n, 3);
});

// The copy, 4 Nov: twenty files over the cap with no marks were never reported.
test('status --role bob: cap debt counts every requirement file over the cap from the open layer on, marks or none, in one line', () => {
  const pad = 'x'.repeat(400);
  const root = makeRepo({
    'build/layers.md': '| layer | what | modules |\n|---|---|---|\n| 1 | first | old |\n| 2 | second | a, b |\n| 3 | third | c, d |\n',
    'build/requirements/old.md': unmet(0) + pad,
    'build/requirements/a.md': unmet(1) + pad,
    'build/requirements/b.md': unmet(1),
    'build/requirements/c.md': unmet(0) + pad,
    'build/requirements/d.md': unmet(2),
    'process/config.json': { requirements_cap: 300 },
  });
  openPassed(root);
  const out = [];
  status(root, { role: 'bob', offline: true, log: (m) => out.push(m) });
  const text = out.join('\n');
  const bytes = Buffer.byteLength(unmet(1) + pad) + Buffer.byteLength(unmet(0) + pad);
  assert.match(text, new RegExp(`^cap debt: 2 requirement files over the cap from layer 2 on, ${bytes} bytes; each is split or consolidated before its job$`, 'm'));
  assert.match(text, /^split or consolidate before its job: build\/requirements\/a.md \d+ over 300$/m);
  assert.doesNotMatch(text, /split or consolidate before its job: build\/requirements\/c.md/);
  assert.match(text, /next work, layer 2 .*\n- build\/requirements\/b.md: 1 \(layer 2\)\nflow: [^\n]*startable 0, blocked 0$/);
});

// ===== file: flow-control.test.mjs =====

// Flow control (Bob, 5 Nov, Build Plan R10; as the coordinator's audit of PR 140 set it): the cap
// checked on a single start; working against waiting sessions; the release path tagged in next
// work; and a fault injection found by the next tool run.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { entry, makeRepo, openPassed, setJobCap } from './helpers.mjs';
import { capCheck } from '../lib/cap.mjs';
import { hold } from '../lib/hold.mjs';
import { fetchState, jsonl, readState, writeState } from '../lib/state.mjs';
import { flow, status } from '../lib/status.mjs';
import { CHECK_MIN, SWEEP_ROWS_FILE, beforeAct, idleCheck, senderFor } from '../lib/sweep.mjs';
import { main } from '../p3.mjs';
import { git, loadConfig as loadCfg } from '../lib/util.mjs';

const SB = 'process-state';
const quiet = () => {};
// GitHub as the idle check reads it (once): no open pull requests.
const GH = { slug: 'o/r', openPRs: () => [], checkRun: () => null, comments: () => [], prFiles: () => [] };
const unmet = (n) => Array.from({ length: n }, (_, i) => `- **R${i + 1}** *(not yet met: x)* text`).join('\n') + '\n';
const ago = (min, t = Date.now()) => new Date(t - min * 6e4).toISOString();

// A product: layer 1 closed by its marks, layer 2's three OPEN entries never started.
function product(files = {}) {
  const root = makeRepo({
    'build/layers.md': '| Layer | Modules |\n|---|---|\n| 1 | `done` |\n| 2 | `a`, `b`, `c` |\n',
    'process/config.json': JSON.stringify({ coordinator: 'session_coord1' }),
    'build/requirements/done.md': '# done\n',
    'process/ledger/done.json': entry('done', { requirements: 'build/requirements/done.md', layer: 1, status: { state: 'COMPLETE' } }),
    ...Object.fromEntries(['a', 'b', 'c'].flatMap((id) => [[`build/requirements/${id}.md`, unmet(1)], [`process/ledger/${id}.json`, entry(id, { requirements: `build/requirements/${id}.md`, layer: 2 })]])),
    ...files,
  });
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  git(['fetch', '-q', 'origin'], { cwd: root });
  openPassed(root);
  git(['push', '-q', 'origin', `refs/remotes/origin/${SB}:refs/heads/${SB}`], { cwd: root });
  // Layer 1 closed by layer close, nothing deferred: layer 2 is the open layer.
  writeState(root, SB, 'closed', (d) => { mkdirSync(join(d, 'layers'), { recursive: true }); writeFileSync(join(d, 'layers/closed.jsonl'), JSON.stringify({ row: 'closed', tranche: 'tranche', layer: 1, commit: git(['rev-parse', 'HEAD'], { cwd: root }), deferred: [] }) + '\n'); });
  return root;
}
const sweepRows = (root) => { fetchState(root, SB, { fresh: true }); return jsonl(readState(root, SB, SWEEP_ROWS_FILE)); };
const addRow = (root, row) => writeState(root, SB, 'row', (dir) => { git(['-C', dir, 'status'], { allowFail: true }); writeFileSync(join(dir, SWEEP_ROWS_FILE), (readState(root, SB, SWEEP_ROWS_FILE) || '') + JSON.stringify(row) + '\n'); });

test('job start <id> checks the cap: --sessions required (C28: never a typed --live), the cap less slot holds', (t) => {
  setJobCap(t, 4);
  const root = product();
  const listed = (n) => { const f = join(mkdtempSync(join(tmpdir(), 'p3-sessions-')), 's.json'); writeFileSync(f, JSON.stringify(Array.from({ length: n }, (_, i) => ({ id: `session_j${i}`, title: `job j${i}`, session_status: 'SESSION_STATUS_RUNNING' })))); return f; };
  assert.throws(() => capCheck(root, {}), /job start <id> --sessions <file>/);
  assert.throws(() => capCheck(root, { live: '3' }), /--live 3 is not taken/);
  assert.equal(capCheck(root, { sessions: listed(3) }).n, 3);
  assert.throws(() => capCheck(root, { sessions: listed(4) }), /the job cap is full: 4 job sessions working of the cap 4 \(4 live\); nothing was started/);
  hold(root, 'slots:1', { why: 'rehearsal', by: 'session_x1', until: '30m', log: quiet });
  assert.throws(() => capCheck(root, { sessions: listed(3) }), /3 job sessions working of the cap 4 less 1 held \(3 live\)/);
});

test('flow: with slots free, the requirement files over the cap are named as BOB\'s split acts that would open them', (t) => {
  setJobCap(t, 20);
  const over = { file: 'r/big.md', count: 9, over: 'split or consolidate before its job: r/big.md 90000 over 70000' };
  const one = { file: 'r/a.md', count: 1, module: 'a', entry_state: 'OPEN' };
  const view = { kind: 'open', n: 2, startable: [{ id: 'a' }] };
  const f = flow({}, [], [one, over], 6, null, [], { view });
  assert.deepEqual(f.splits_owed, ['r/big.md']);
  assert.match(f.line, /startable 1, blocked 0; \d+ slots free: BOB's split acts would open them \(split or consolidate: r\/big\.md\)$/);
  const full = flow({}, [], [one, over], 19, null, [], { view });
  assert.equal(full.splits_owed, undefined, 'no free slot: no split line');
  assert.doesNotMatch(full.line, /split/);
});

test('flow: working and waiting add up to every unarchived job session the cap counts: another product\'s, and an older one beside its latest', () => {
  const s = (id, title, st, at) => ({ id, title, session_status: st, updated_at: at });
  const listed = [s('s1', 'job a', 'running', '2026-11-05T04:00:00Z'), s('s2', 'job a (restart)', 'idle', '2026-11-05T04:10:00Z'), s('s3', 'job zz', 'idle', '2026-11-05T04:00:00Z'), s('s4', 'job b', 'idle', '2026-11-05T04:00:00Z'), s('s5', 'job c', 'archived', '2026-11-05T04:00:00Z'), s('s6', 'BOB', 'running', '2026-11-05T04:00:00Z')];
  const rows = [{ id: 'a', tranche: 'OPEN', branch: 'WORKING' }, { id: 'b', tranche: 'COMPLETE', pr: 'merged' }];
  const f = flow({}, rows, [], 4, listed);
  assert.equal(f.working + f.waiting, 4);
  assert.match(f.line, /\(working 1, waiting 3: a BOB, zz not this product's, b archive\)/);
});

test('next work tags the release path (layer work, release_path) and debt (every unmet mark a base-red found mark)', () => {
  const root = product({
    'process/config.json': JSON.stringify({ release_path: ['solo'] }),
    'build/requirements/c.md': '- **F1** *(not yet met: base-red gate run 12)* x\n',
    'process/found/solo.md': '- **F1** *(not yet met: walk)* y\n',
  });
  const out = status(root, { role: 'bob', offline: true, heads: new Set(), log: quiet });
  const by = Object.fromEntries(out.next.filter((y) => y.module).map((y) => [y.module, [!!y.release, !!y.debt]]));
  assert.deepEqual([by.a, by.b, by.c], [[true, false], [true, false], [false, true]]);
});

test('working against waiting: each open job\'s session running or idle, and what an idle one waits on', (t) => {
  setJobCap(t, 20);
  const rows = [
    { id: 'a', tranche: 'OPEN', branch: 'WORKING' }, { id: 'b', tranche: 'OPEN', branch: 'COMPLETE', ready: true, gate: 'pending' },
    { id: 'c', tranche: 'OPEN', branch: 'COMPLETE', ready: true, gate: 'success' }, { id: 'd', tranche: 'BLOCKED', branch: 'BLOCKED' }, { id: 'e', tranche: 'OPEN', branch: 'WORKING' },
  ];
  const s = (id, st) => ({ id: `session_${id}`, title: `job ${id}`, session_status: `SESSION_STATUS_${st}`, updated_at: ago(1) });
  const f = flow({ targets: {} }, rows, [], 5, [s('a', 'RUNNING'), s('b', 'IDLE'), s('c', 'IDLE'), s('d', 'IDLE'), s('e', 'IDLE')]);
  assert.deepEqual([f.working, f.waiting], [1, 4]);
  assert.match(f.line, /^flow: live 5\/20 \((default|P3_JOB_CAP)\) \(working 1, waiting 4: b gate, c merge, d block, e BOB\), startable 0/);
});

// Fault injection 3: an unanswered BLOCKED job: its idle session is counted waiting on its block in
// the flow line (and the sweep's ruling owed stands as before); ruled, it waits no more.
test('fault injection: an unanswered BLOCKED job shows as a session waiting on its block, and no more once ruled', (t) => {
  setJobCap(t, 6);
  const s = { id: 'session_q', title: 'job q', session_status: 'SESSION_STATUS_IDLE', updated_at: ago(40) };
  const blocked = flow({ targets: { decision_minutes: 30 } }, [{ id: 'q', tranche: 'BLOCKED', since: ago(40) }], [], 1, [s]);
  assert.match(blocked.line, /waiting 1: q block\), startable 0, blocked 1 \(oldest 40 min\)/);
  const ruled = flow({ targets: { decision_minutes: 30 } }, [{ id: 'q', tranche: 'OPEN', branch: 'WORKING' }], [], 1, [{ ...s, session_status: 'SESSION_STATUS_RUNNING' }]);
  assert.match(ruled.line, /working 1, waiting 0\), startable 0, blocked 0/);
});


// A requirement on what a job hands in: every file the job writes begins with this exact first
// line: `# ref J7A-9355`.

// ===== file: sweep.mjs =====

// The sweep and the watcher (SES-1, PLT-6, Foundations "Scheduled tasks around ROOT"). The tool
// cannot call Claude's session or task tools: sweep reads the record and prints what ROOT must do,
// in the Foundations' order, and writes the heartbeat; watch reads the heartbeat's age and ROOT's
// address and prints the watcher's decision. The session makes every call.
import { expireRecords, staleRecords } from './expire.mjs';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { P3, jobSender, wakeLine } from './job.mjs';
import { rowsAt } from './metrics.mjs';
import { readAddress, senderKnown, senderOf, wakeSteps } from './roles.mjs';
import { bobAddressed, bookkeep, fetchState, heldAct, heldWrites, jsonl, messages, messagesFile, onBookkeeping, readState, readStateWith, withCoordinator, writeState } from './state.mjs';
import { openPinMoves } from './pin.mjs';
import { bobAct, heldBy, layersAt, owe, paidUpTo, readOwed, slotsHeld, startsOwedLine } from './hold.mjs';
import { markLaneHeld } from './lane.mjs';
import { SILENT_HOURS, liveJobIds, laneDefects, permissionWaits, blockedJobs, capLine, holdLayers, flow, isArchived, layerState, nextWork, owedNotices, readSessions, refOf, sessionActs, sessionsCount, status } from './status.mjs';
import { Fail, Superseded, fail, git, jobCap, loadConfig, now, repoSlug } from './util.mjs';
import { flowRows, layerMergeLine, layerStartAct, needsSlot, readOpenLayer } from './layerflow.mjs';
import { roundLayerName } from './layerbase.mjs';
import { deploys, owedAt } from './deploy.mjs';
import { publishedJobs, slotNote, slotUse } from './slots.mjs';
import { openState } from './tranche.mjs';

export const HEARTBEAT_FILE = 'heartbeat.json';
// One row per sweep, appended next to the heartbeat (which each sweep overwrites): whether status
// listed acts for BOB (next work, or a job owed or blocked) and, if so, how long BOB had been quiet.
export const SWEEP_ROWS_FILE = 'metrics/sweep.jsonl';
export { SILENT_HOURS }; // BOB with no write, a WORKING job with no push
export const IDLE_HOURS = 1; // BOB with next work and no write: woken
export const WATCH_HOURS = 4; // the heartbeat's age at which the watcher takes over
export const FAR = 3; // "far over" a role's median: this many times it
const H = 36e5;
const hours = (ms) => Math.round(ms / H * 10) / 10;
const ct = (root, args) => Number(git(['log', '-1', '--format=%ct', ...args], { cwd: root, allowFail: true }).stdout.trim()) * 1000 || 0;
const median = (xs) => { const s = xs.filter(Number.isFinite).sort((a, b) => a - b); return s.length ? s[(s.length - 1) >> 1] : null; };
const checkSession = (id, what = '--session') => (typeof id === 'string' && /^session_[A-Za-z0-9]+$/.test(id) ? id : fail(`${what} <this session's id> (session_...)`));

export function readHeartbeat(root, sb) {
  const t = readState(root, sb, HEARTBEAT_FILE);
  try { return t ? JSON.parse(t) : null; } catch { return null; }
}

// The prompt of ROOT's hourly sweep task, bound to ROOT's own session.
// approvals: the hash of the tranche tip's approvals when the task is made (tipApprovals).
export function sweepTask(session, tranche = 'tranche', approvals) {
  checkSession(session);
  const prompt = `Sweep. First run ${wakeSteps(tranche, approvals)}; if it says the approvals changed, tell Bob by push notification and take no further step. Then save list_sessions (every session of the last day, archived ones included) as JSON and run \`${P3} sweep --session ${session} --sessions <that file> --context <the percent of the window get_session on yourself shows>\` and do only what it prints, each act its own command. Create nothing else, merge nothing, edit no task but this one's prompt as your ROOT prompt allows, archive only what it prints.`;
  return { prompt, call: { name: 'sweep', cron_expression: '0 * * * *', prompt } };
}

// --attempt "<who>:<role>:<minutes>:<usd>", as the session record gives them: those far over
// the role's median from the measured rows on the tranche ("unmeasured" when no row has one).
function overMedian(root, ref, attempts) {
  const rows = rowsAt(root, ref).filter((r) => r.row === 'attempt' && r.event === 'measured');
