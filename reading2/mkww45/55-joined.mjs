// ===== file: lane.test.mjs (continued) =====

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

// ===== file: gateclass.test.mjs (later part) =====

    ['a sync-like name with no hex', layered({ tranche: {}, branch: 'layer-sync/1-main' }), 'layer/1', /that is not its layer sync \(from layer-sync\/1-main\)$/],
    ['a forged sync: no merge', layered({ tranche: {}, branch: 'layer-sync/1-0123456789', merge: false }), 'layer/1', /^a pull request into layer\/1 that is not its layer sync: its head [0-9a-f]{10} is not a merge$/],
    ['a sync PR whose base is not known', layered(), null, /^the pull request's base branch is not known$/],
  ];
  for (const [what, s, ref, why] of cases) {
    const r = run(s, { io: into(ref) });
    assert.equal(r.run.class, 'full', `${what}: ${r.run.class_why}`);
    assert.match(r.run.class_why, why, what);
    assert.doesNotMatch(r.comment.split('\n')[1], /record-only|pin-only/, what);
    const c = gateClassAt(s.root, { base: s.base, head: s.head, branch: s.branch, baseRef: ref, repo });
    assert.deepEqual([c.class, browserNeeded(c)], ['full', true], `${what}: the class step keeps the browser`);
  }
  // A job's PR into the layer, carrying only the pin (its branch named as a job's): full, as before.
  const job = layered({ tranche: {}, branch: 'job/alpha', merge: false });
  assert.deepEqual([gateClassAt(job.root, { base: job.base, head: job.head, branch: job.branch, baseRef: 'layer/1', repo }).why], ["a job's pull request"]);
  // A merge whose first parent is not on the layer (an empty commit off it): full, its diff the pin's all the same.
  const p = layered({ tranche: {} });
  git(['checkout', '-q', '-B', 'layer-sync/1-abcdefabcd', 'main'], { cwd: p.root });
  git(['commit', '-q', '--allow-empty', '-m', 'off the layer'], { cwd: p.root });
  git(['merge', '-q', '--no-ff', '--no-edit', 'tranche'], { cwd: p.root });
  const off = gateClassAt(p.root, { base: p.base, head: git(['rev-parse', 'HEAD'], { cwd: p.root }), branch: 'layer-sync/1-abcdefabcd', baseRef: 'layer/1', repo });
  assert.equal(off.class, 'full');
  assert.match(off.why, /its head's first parent [0-9a-f]{10} is not on layer\/1$/);
  // gateClass alone: into a layer with no head or base known is full.
  const cfg = loadConfig(p.root);
  const g = gateClass(p.root, cfg, { branch: 'layer-sync/1-abcdefabcd', into: 'layer/1', changed: ['.process'], entries: [], readers: () => [] });
  assert.deepEqual([g.class, g.why], ['full', 'a pull request into layer/1 that is not its layer sync: its head or base is not known']);
  // A record-only change into a layer, from any branch: full (not a sync's).
  const rec = gateClass(p.root, cfg, { branch: 'found-x', into: 'layer/1', changed: ['req/alpha.md'], entries: [], readers: () => [] });
  assert.equal(rec.class, 'full');
});

test('layer sync (C49): a product test on the layer naming the pin sends the sync full, as it does a tranche pin move', () => {
  const s = layered({ tranche: {} });
  git(['checkout', '-q', 'layer/1'], { cwd: s.root });
  const base = commit(s.root, { 'test/alpha/pin.test.mjs': "import { existsSync } from 'node:fs'; existsSync('.process');\n" }, 'Merge layer PR 6');
  git(['checkout', '-q', '--detach', base], { cwd: s.root });
  git(['merge', '-q', '--no-ff', '-m', 'GitHub merge', s.head], { cwd: s.root });
  const r = run({ ...s, base }, { io: into('layer/1') });
  assert.equal(r.run.class, 'full');
  assert.match(r.run.class_why, /test\/alpha\/pin\.test\.mjs names \.process \(the merged tree\)/);
});

test('layer sync (C49, cold review): an evil merge, keeping the layer\'s side of a file the tranche changed, is full; so is a base that disagrees with the event\'s', () => {
  // The tranche changes beta's code and moves the pin; the "sync" keeps the layer's beta, so its
  // diff against the layer is the pin's files only, while the tranche's commits enter the layer.
  const s = layered({ tranche: { 'src/beta/index.mjs': 'export const y = 2;\n' }, merge: false, branch: 'layer-sync/1-0123456789' });
  git(['reset', '-q', '--hard', s.base], { cwd: s.root });
  git(['merge', '-q', '--no-ff', '--no-commit', 'tranche'], { cwd: s.root });
  git(['checkout', '-q', s.base, '--', 'src/beta/index.mjs'], { cwd: s.root });
  git(['commit', '-q', '--no-edit'], { cwd: s.root });
  const evil = { ...s, head: git(['rev-parse', 'HEAD'], { cwd: s.root }) };
  assert.deepEqual(git(['diff', '--name-only', evil.base, evil.head], { cwd: s.root }).split('\n'), ['.process'], 'the pin alone, against the layer');
  const r = run(evil, { io: into('layer/1') });
  assert.equal(r.run.class, 'full');
  assert.match(r.run.class_why, /that is not its layer sync: its head [0-9a-f]{10} is not git's own merge of its parents$/);
  // The tool's own merge of the same, honestly made, brings beta's code from the tranche: full.
  const honest = layered({ tranche: { 'src/beta/index.mjs': 'export const y = 2;\n' } });
  assert.match(run(honest, { io: into('layer/1') }).run.class_why, /^a pull request into layer\/1 that is not its layer sync: its second parent brings src\/beta\/index\.mjs$/);
  // The live PR's base and the event's disagree (retargeted since): full.
  const ok = layered();
  const moved = run(ok, { io: into('tranche'), baseRef: 'layer/1' });
  assert.deepEqual([moved.run.class, moved.run.class_why], ['full', "the pull request's base branch is not known"]);
  assert.equal(run(ok, { io: into('layer/1'), baseRef: 'layer/1' }).run.class, 'pin-only', 'agreeing, as before');
});

// ===== file: deploycfg.mjs =====

// The deploy block's pure readings, shared by deploy dev and setup check without importing deploy.mjs
// (which reaches status, layerflow and roles): a leaf, importing util alone.
import { basename } from 'node:path';
import { fail } from './util.mjs';

// Deploys configured: a deploy block with more than the internal walk (or its exemption). A product
// with no deployment that records Bob's exemption, or names only an internal walk, owes no deploy,
// no round-close run and no deploy at tranche close (cold review of C23).
export const deploys = (cfg) => !!cfg?.deploy && typeof cfg.deploy === 'object' && !Array.isArray(cfg.deploy) && Object.keys(cfg.deploy).some((k) => k !== 'internal_walk');

const isArgv = (a) => Array.isArray(a) && a.length && a.every((x) => typeof x === 'string' && x.length);
export const stepsOf = (v, what) => {
  if (isArgv(v)) return [v];
  if (Array.isArray(v) && v.length && v.every(isArgv)) return v;
  return fail(`deploy.${what} must be an argv (a list of strings) or a non-empty list of argvs`);
};
// walk_reports: the files the walk writes, relative to the checkout, kept on the state branch.
const part = (x) => x && x !== '.' && x !== '..';
export const reportPaths = (wr, what) => {
  if (!Array.isArray(wr) || !wr.every((p) => typeof p === 'string' && p.split('/').every(part) && !basename(p).startsWith('.git')) || new Set(wr.map((p) => basename(p))).size !== wr.length) fail(`deploy.${what} must be a list of file paths in the checkout (no leading /, no empty, . or .. part, no file name starting .git), no two with the same file name`);
  return wr;
};
// internal_walk (Bob, 4 Nov; K4111, K4162, K4781): the product's offline walk, run at the round
// close (alone, as walk round; C43), never a gate. {run: argv or argvs, timeout_minutes (whole run), reports}.
// Or the exemption Bob records instead ({none: "<reason>", by: "Bob, <date>"}; Bob, 7 Nov: the
// internal walk is required, its exemption his word). One reading for deploy dev and setup check:
// null when unset, {walk} or {exempt}, a refusal when malformed.
export function internalWalkOf(i) {
  if (i === undefined || i === null) return null;
  if (typeof i === 'object' && !Array.isArray(i) && 'none' in i) {
    if (Object.keys(i).some((k) => !['none', 'by'].includes(k)) || typeof i.none !== 'string' || !i.none.trim() || typeof i.by !== 'string' || !i.by.trim()) fail('deploy.internal_walk\'s exemption is {"none": "<reason>", "by": "Bob, <date>"}, Bob\'s word, and nothing else');
    return { exempt: { none: i.none.trim(), by: i.by.trim() } };
  }
  if (typeof i !== 'object' || Array.isArray(i) || Object.keys(i).some((k) => !['run', 'timeout_minutes', 'reports'].includes(k))) fail('deploy.internal_walk must be an object with run, timeout_minutes and reports');
  if (i.timeout_minutes !== undefined && !(Number.isInteger(i.timeout_minutes) && i.timeout_minutes > 0 && i.timeout_minutes <= 360)) fail('deploy.internal_walk.timeout_minutes must be whole minutes from 1 to 360');
  return { walk: { run: stepsOf(i.run, 'internal_walk.run'), timeout_minutes: i.timeout_minutes || 30, reports: reportPaths(i.reports ?? [], 'internal_walk.reports') } };
}


// ===== file: hold.test.mjs =====

// Holds and idle capacity (Bob, 5 Nov: a spoken "about 6 job sessions at most" held BOB near 6 of
// 20 for about 6 hours and nothing in Process3 saw it; cap use about 48% over a day).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { commit, entry, makeRepo, setJobCap } from './helpers.mjs';
import { HOLDS_FILE, hold, holdHours, holdLines, holdsOf } from '../lib/hold.mjs';
import { flowFigures, unmetAtRef } from '../lib/metrics.mjs';
import { recordStart } from '../lib/roles.mjs';
import { readState, writeState } from '../lib/state.mjs';
import { status } from '../lib/status.mjs';
import { SWEEP_ROWS_FILE, sweep } from '../lib/sweep.mjs';
import { git } from '../lib/util.mjs';

const quiet = () => {};
const SB = 'process-state';
const S = 'session_coord1';
const ago = (min) => new Date(Date.now() - min * 6e4).toISOString();

function withOrigin(files = {}) {
  const root = makeRepo({ 'README.md': 'x', 'process/config.json': { tranche: 'tranche', coordinator: 'session_coord1' }, 'build/layers.md': '| 1 | a, b |\n| 2 | c, d, e, f, g, h |\n', ...files });
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  git(['fetch', '-q', 'origin'], { cwd: root });
  return root;
}
const lines = (root) => { const out = []; status(root, { offline: true, log: (l) => out.push(l) }); return out; };

test('hold: a row on the state branch, printed first by status with who, why and minutes left; ended by --end; refusals', (t) => {
  setJobCap(t, 20);
  const root = withOrigin();
