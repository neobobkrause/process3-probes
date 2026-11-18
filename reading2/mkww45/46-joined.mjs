// ===== file: lane-gate.test.mjs (continued) =====

  const check = (code) => ['node', '-e', `process.exit(require('fs').readFileSync('design/ux/words.json','utf8').includes('broken') ? ${code} : 0)`];
  const cfg = { lanes: [{ name: 'ux', dir: 'design/ux', checks: ['node -e process.exit(0)', check(3)] }, { name: 'ai', dir: 'design/ai' }] };
  assert.deepEqual(lanes(cfg)[0].checks, [['node', '-e', 'process.exit(0)'], check(3)]);
  assert.throws(() => lanes({ lanes: [{ name: 'ux', dir: 'design/ux', checks: 'node x' }] }), /lane ux's checks are a list of commands/);
  const s = setup({ cfg });
  const good = onBranch(s, 'lane/ux', { 'design/ux/words.json': '{"a":1}\n' });
  const g = run(s, good, 'lane/ux');
  assert.deepEqual([g.run.trigger, g.run.suite, g.run.lane, g.findings.length], ['record', 'skipped', 'ux', 0]);
  assert.deepEqual(g.run.lane_checks.map((x) => x.exit), [0, 0]);
  const bad = commit(s.root, { 'design/ux/words.json': '{"broken":true}\n' });
  const b = run(s, bad, 'lane/ux');
  assert.equal(b.run.ok, false);
  assert.deepEqual(b.findings.map((f) => [f.check, f.file]), [['lane-checks', 'design/ux']]);
  assert.match(b.findings[0].message, /^lane ux's check node -e .* failed \(exit 3\)/);
  // The other lane, with no checks, keeps the records-only path with nothing run.
  git(['checkout', '-q', 'main'], { cwd: s.root });
  const ai = onBranch(s, 'lane/ai', { 'design/ai/notes.md': 'b\n' });
  const a = run(s, ai, 'lane/ai');
  assert.deepEqual([a.run.trigger, a.run.lane, a.run.lane_checks, a.findings.length], ['record', 'ai', undefined, 0]);
  // Cold review of PR 203: a lane pull request that edits the config (dropping its own checks, say)
  // is not lane-only; and a pull request touching the lane's folder and any other file runs its checks too.
  git(['checkout', '-q', 'main'], { cwd: s.root });
  const drop = onBranch(s, 'lane/ux-2', { 'design/ux/words.json': '{"broken":true}\n', 'process/config.json': { lanes: [{ name: 'ux', dir: 'design/ux' }, { name: 'ai', dir: 'design/ai' }] } });
  const d = run(s, drop, 'lane/ux-2');
  assert.equal(d.run.lane, undefined, 'not lane-only');
  assert.equal(d.run.ok, false, 'the base\'s checks still run on the lane\'s folder');
  assert.ok(d.findings.some((f) => f.check === 'lane-checks'));
  git(['checkout', '-q', 'main'], { cwd: s.root });
  const mixed = onBranch(s, 'plain/x', { 'design/ux/words.json': '{"broken":true}\n', 'notes.md': 'x\n' });
  const m = run(s, mixed, 'plain/x');
  assert.deepEqual([m.run.lane, m.run.ok, m.run.lane_checks.map((x) => [x.lane, x.exit])], [undefined, false, [['ux', 0], ['ux', 3]]]);
});

test('a lane check is words as a shell would split them, quotes kept whole; an open quote is refused', async () => {
  const { laneChecks } = await import('../lib/util.mjs');
  assert.deepEqual(laneChecks({ lanes: [{ name: 'ux', checks: ['node -e "process.exit(0)"', "node tools/build_words.mjs --check 'a b'"] }] }, 'ux'), [['node', '-e', 'process.exit(0)'], ['node', 'tools/build_words.mjs', '--check', 'a b']]);
  assert.equal(laneChecks({ lanes: [{ name: 'ux', checks: ['node -e "x'] }] }, 'ux'), null);
});

// PD-9 (cold review of C31): a lane-only pull request builds the generated rows its checks need;
// each built row is verified too, so a lane change that breaks a built file's checker is red at its
// own pull request, not at the layer close.
test('PD-9: a lane-only pull request verifies the generated rows it builds; a failing verify is red', () => {
  const gen = (exit) => ({ paths: ['design/ux/built.json'], regenerate: ['node', '-e', "require('fs').writeFileSync('design/ux/built.json','{}')"], verify: ['node', '-e', `process.exit(require('fs').readFileSync('design/ux/words.json','utf8').includes('broken') ? ${exit} : 0)`] });
  const s = setup({ cfg: { lanes: [{ name: 'ux', dir: 'design/ux', checks: ['node -e process.exit(0)'] }, { name: 'ai', dir: 'design/ai' }], generated: [gen(5)] } });
  git(['checkout', '-q', 'main'], { cwd: s.root });
  const ign = commit(s.root, { '.gitignore': 'design/ux/built.json\n' });
  git(['branch', '-f', 'tranche', ign], { cwd: s.root });
  s.base = ign;
  const good = onBranch(s, 'lane/ux', { 'design/ux/words.json': '{"a":1}\n' });
  assert.deepEqual(run(s, good, 'lane/ux').findings, []);
  const bad = commit(s.root, { 'design/ux/words.json': '{"broken":true}\n' });
  const b = run(s, bad, 'lane/ux');
  assert.equal(b.run.ok, false);
  assert.match(b.findings.map((f) => `${f.check}: ${f.file}: ${f.message}`).join('\n'), /generated: design\/ux\/built\.json: node -e .* failed \(exit 5\) after building/);
});

// ===== file: layer-join.test.mjs =====

// Work outside the open layer joins the NEXT layer to open, never the tranche directly (the
// coordinator's ruling, 6 Nov): layer join records it, layer open lists it, its job's base is that
// layer's branch, and the routes that printed refused starts print the join.
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { jobStart } from '../lib/job.mjs';
import { jobCfg, flowFile } from '../lib/layerbase.mjs';
import { layerJoin, layerOpen, layerPlace, openLayer, writeRows } from '../lib/layerflow.mjs';
import { fetchState, readState } from '../lib/state.mjs';
import { bobStatus, noticeSlots, status } from '../lib/status.mjs';
import { noticeFile } from '../lib/notice.mjs';
import { triageFile } from '../lib/triage.mjs';
import { configOf, git } from '../lib/util.mjs';
import { commit, entry, makeRepo, openPassed } from './helpers.mjs';

const quiet = () => {};
const SB = 'process-state';
const LAYERS = '| layer | name | modules |\n| --- | --- | --- |\n| 1 | One | a |\n| 2 | Two | b |\n| 3 | Three | c |\n';
const req = (marks = "") => `# x\n\n- **R1** a requirement${marks}\n`;
const openIO = { slug: 'o/p', openPRs: () => [] };

// a (layer 1, merged, COMPLETE), b (layer 2, open), c (layer 3, not open).
function product({ aReq = req(), extra = {} } = {}) {
  const files = { 'process/config.json': { tranche: 'tranche' }, 'build/layers.md': LAYERS, ...extra };
  for (const id of ['a', 'b', 'c']) {
    files[`process/ledger/${id}.json`] = entry(id, { requirements: `build/requirements/${id}.md`, ...(id === 'a' ? { status: { state: 'COMPLETE' } } : {}) });
    files[`build/requirements/${id}.md`] = id === 'a' ? aReq : req(' *(not yet met: T1)*');
  }
  const root = makeRepo(files);
  git(['branch', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  commit(root, { 'src/a/x.txt': 'layer 1 merged' }, 'layer 1');
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: root });
  git(['fetch', '-q', 'origin'], { cwd: root });
  const tip = git(['rev-parse', 'HEAD'], { cwd: root });
  const at = new Date().toISOString();
  writeRows(root, SB, 'layer 1 merged', [[flowFile(1, 'open'), { row: 'open', layer: 1, at }], [flowFile(1, 'merged'), { row: 'merged', layer: 1, commit: tip, at }]]);
  fetchState(root, SB, { fresh: true });
  layerOpen(root, 2, { io: openIO, log: quiet });
  return { root, bare, tip };
}
const cfgOf = () => configOf({ tranche: 'tranche' });

test('layerPlace: a module of a merged layer is behind and joins the layer after the open one; the open and later layers\' are not', () => {
  const { root } = product();
  assert.deepEqual(layerPlace(root, cfgOf(), 'a'), { own: 1, open: 2, cur: 2, target: 3, behind: true, joined: null });
  assert.equal(layerPlace(root, cfgOf(), 'b').behind, false);
  assert.equal(layerPlace(root, cfgOf(), 'c').behind, false);
  assert.equal(layerPlace(root, cfgOf(), 'zz').behind, true, 'no layer: behind');
});

test('job start of a merged layer\'s module is refused naming layer join; layer join records it once for the next layer; the open layer\'s module is refused a join', () => {
  const { root } = product();
  assert.throws(() => jobStart(root, 'a', { coordinator: 's', push: false, reopen: 'meet F1', log: quiet }), /a's layer has no open branch .*layer join a --why/);
  const out = [];
  assert.deepEqual(layerJoin(root, 'a', { why: 'provider notice x:1', log: (l) => out.push(l) }), { ok: true, layer: 3, recorded: true });
  assert.match(out[0], /^a joins layer 3: provider notice x:1; it starts from node \.process\/tool\/p3\.mjs layer jobs 3 once layer 3 opens/);
  fetchState(root, SB, { fresh: true });
  const row = JSON.parse(readState(root, SB, flowFile(3, 'join', 'a')));
  assert.deepEqual([row.row, row.layer, row.module, row.from, row.why], ['join', 3, 'a', 1, 'provider notice x:1']);
  assert.equal(layerJoin(root, 'a', { why: 'again', log: quiet }).recorded, false, 'once');
  assert.throws(() => layerJoin(root, 'b', { why: 'x', log: quiet }), /b is in layer 2, the open layer: it starts from .*layer jobs 2; nothing recorded/);
  assert.throws(() => layerJoin(root, 'a', { log: quiet }), /--why/);
});

test('the joined layer, once open, lists the joined module\'s start (a reopen for a COMPLETE one) and is its job\'s base', () => {
  const { root, tip } = product();
  layerJoin(root, 'a', { why: 'found marks F1', log: quiet });
  const at = new Date().toISOString();
  writeRows(root, SB, 'layer 2 merged', [[flowFile(2, 'merged'), { row: 'merged', layer: 2, commit: tip, at }]]);
  const out = [];
  const o = layerOpen(root, 3, { io: openIO, log: (l) => out.push(l) });
  assert.deepEqual(o.startable.map((x) => x.id).sort(), ['a', 'c']);
  assert.equal(o.startable.find((x) => x.id === 'a').cmd, 'node .process/tool/p3.mjs job start a --sessions <file> --reopen "found marks F1"');
  const c = jobCfg(root, cfgOf(), 'a');
  assert.deepEqual([c.tranche, c.layer.n, c.layer.joined], ['layer/3', 3, true]);
  assert.equal(jobCfg(root, cfgOf(), 'b').tranche, 'tranche', 'its own layer merged, no join: no base');
});

test('status: a train-era job PR into the tranche is named with close and restart in its layer; a merged layer\'s is told to join', () => {
  const { root } = product();
  const cfg = cfgOf();
  const lines = (id) => { const L = []; bobStatus(root, cfg, { rows: [{ id, tranche: 'OPEN', branch: 'WORKING', pr: '#7 draft' }], prs: [{ number: 7, head: { ref: `job/${id}` }, base: { ref: 'tranche' } }], offline: true, log: (l) => L.push(l) }); return L.join('\n'); };
  assert.match(lines('b'), /owed:\n- b: .*train-era job PR #7 into tranche: close it unmerged \(never deleting its branch\) and restart in layer 2 \(node \.process\/tool\/p3\.mjs layer jobs 2 once it opens\)/);
  assert.match(lines('a'), /train-era job PR #7 into tranche: close it unmerged .* and restart in layer 3 \(node \.process\/tool\/p3\.mjs layer join a --why/);
  const none = []; bobStatus(root, cfg, { rows: [{ id: 'b', tranche: 'OPEN', branch: 'WORKING', pr: '#8 draft' }], prs: [{ number: 8, head: { ref: 'job/b' }, base: { ref: 'layer/2' } }], offline: true, log: (l) => none.push(l) });
  assert.doesNotMatch(none.join('\n'), /train-era/, 'a PR into the layer is not the train\'s');
});

test('next work: found work on a merged layer\'s module names its join, never a start on the tranche', () => {
  const { root } = product({ aReq: req() + '- **F1** *(not yet met: walk)* found\n' });
  openPassed(root);
  const out = [];
  status(root, { role: 'bob', offline: true, log: (l) => out.push(l) });
  const t = out.join('\n');
  assert.match(t, /build\/requirements\/a\.md: 1.*; joins layer 3: node \.process\/tool\/p3\.mjs layer join a --why "found marks F1"/, t);
});

test('a notice-affected user in a merged layer: its act is the join, never a job start', () => {
  const { root } = product();
  const at = new Date().toISOString();
  writeRows(root, SB, 'notice', [
