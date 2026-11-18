// ===== file: ledger-count.test.mjs (continued) =====

  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'main'], { cwd: root });
  const cfg = { state_branch: 'process-state' };
  stateBatch(true);
  try {
    as('cse_p', () => {
      content(root, 1);
      writeState(root, 'process-state', 'a write of the command', (wt) => { writeFileSync(join(wt, 'x.txt'), 'x'); return {}; });
      assert.ok(shareUsage(root, cfg, { pending: pendingWrites() }) >= 1);
      content(root, 1);
      assert.equal(shareUsage(root, cfg, { pending: pendingWrites() }), 0, 'not again within the minute, though the first is not pushed yet');
      assert.ok(shareUsage(root, cfg, { pending: pendingWrites(), atEnd: true }) >= 1, 'at the command\'s end, whatever the minute');
      flushState();
    });
  } finally { stateBatch(false); }
  assert.ok(sharesOf(root).every((x) => x.at !== PENDING_AT), 'settled by the push');
  // A process3 clone (remote ledger): a push of its own state branch, another repository's, is shared alone.
  const a = clone();
  as('cse_q', () => {
    reserve({ push: true, points: 0, content: 0 }, 'push process-state', a, { p: P, kind: 'push', extra: { repo: 'o/process3', state: true } });
    assert.ok(shareUsage(a, null, { store: remoteStore(a, URL), ledgerRepo: 'o/ledger' }) >= 1);
  });
});

test('a share kept by a refused flush is settled when state replay pushes it: its rows are not counted twice', (t) => {
  env(t);
  const root = makeRepo({ 'README.md': 'x\n' });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'main'], { cwd: root });
  const cfg = { state_branch: 'process-state' };
  stateBatch(true);
  try {
    as('cse_r', () => {
      content(root, 2);
      writeState(root, 'process-state', 'a write of the command', (wt) => { writeFileSync(join(wt, 'x.txt'), 'x'); return {}; });
      assert.ok(shareUsage(root, cfg, { pending: pendingWrites(), atEnd: true }) >= 1);
      // The account stopped: the command's push is refused, its writes kept for replay.
      useShared({ read: () => ({ pause: { at: '2026-11-07T00:00:00Z', until: '2026-11-07T00:01:00Z', why: 'x', stopped: true }, use: [] }), pause: () => null });
      assert.throws(() => flushState(), /state replay/);
      useShared(null);
    });
  } finally { stateBatch(false); }
  assert.ok(sharesOf(root).some((x) => x.at === PENDING_AT), 'pending while its push is held');
  stateReplay(root, 'process-state', [], { log: () => {} });
  assert.ok(sharesOf(root).every((x) => x.at !== PENDING_AT), 'settled by the replay');
});

// ===== file: ledger-base.test.mjs =====

// C36 (the coordinator, 8 Nov): on the copy a layer-12 job's publish refused "ledger:
// process/ledger/provenance.json:1: job screens-inquiry may change only its own entry". provenance's
// land changed its entry on layer/12 after screens-inquiry started; publish's job sync merged the
// layer tip into the job branch without pushing, and the base (the shallow path's: GitHub's merge
// base of the branch as pushed) was still the job's start. What the layer already holds is not the
// job's: the base moves to the merge base with the tip the branch merged.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { baseAfterMerge } from '../lib/job.mjs';
import { checkLedger } from '../lib/ledger.mjs';
import { git } from '../lib/util.mjs';
import { commit, entry, makeRepo } from './helpers.mjs';

const E = (id, state = 'WORKING', over = {}) => entry(id, { layer: 12, status: { state }, ...over });
function layer() {
  const root = makeRepo({ 'process/ledger/si.json': E('si', 'OPEN'), 'process/ledger/prov.json': E('prov', 'WORKING'), 'process/ledger/other.json': E('other', 'OPEN') });
  git(['branch', '-m', 'layer/12'], { cwd: root });
  const start = git(['rev-parse', 'HEAD'], { cwd: root });
  // screens-inquiry's job starts from the layer tip.
  git(['checkout', '-q', '-b', 'job/si'], { cwd: root });
  commit(root, { 'process/ledger/si.json': E('si', 'WORKING') }, 'job start si');
  commit(root, { 'src/si/x.mjs': 'export const x = 1;\n' }, 'si work');
  // provenance lands on the layer: its entry COMPLETE there.
  git(['checkout', '-q', 'layer/12'], { cwd: root });
  commit(root, { 'process/ledger/prov.json': E('prov', 'COMPLETE') }, 'Merge prov land');
  const tip = git(['rev-parse', 'HEAD'], { cwd: root });
  // publish's job sync: the layer tip merged into the job branch, not pushed.
  git(['checkout', '-q', 'job/si'], { cwd: root });
  git(['merge', '-q', '--no-edit', 'layer/12'], { cwd: root });
  return { root, start, tip };
}

test('C36: a sibling\'s land on the layer, merged into the job branch, is not the job\'s ledger change; the base moves to the merged tip', () => {
  const { root, start, tip } = layer();
  // The copy's refusal, with the start as the base:
  assert.match(checkLedger(root, { base: start, branch: 'job/si' }).map((f) => `${f.file}: ${f.message}`).join('\n'), /process\/ledger\/prov\.json: job si may change only its own entry/);
  const said = [];
  const base = baseAfterMerge(root, start, 'refs/heads/layer/12', { log: (l) => said.push(l) });
  assert.equal(base, tip);
  assert.match(said[0], /^base: \w{10} moved to \w{10}, the layer\/12 tip this branch merged: what it already holds is not this job's$/);
  assert.deepEqual(checkLedger(root, { base, branch: 'job/si' }), [], 'its own entry\'s status only: no finding');
  // A real foreign-entry edit by the job still fails with the moved base.
  commit(root, { 'process/ledger/other.json': E('other', 'WORKING') }, 'si touches another entry');
  assert.match(checkLedger(root, { base, branch: 'job/si' }).map((f) => `${f.file}: ${f.message}`).join('\n'), /process\/ledger\/other\.json: job si may change only its own entry/);
});

test('C36: the base never moves to a tip the branch has not merged, nor back', () => {
  const { root, start, tip } = layer();
  // The layer moves on after the job's merge: the base is the tip it merged, not the newer one.
  git(['checkout', '-q', 'layer/12'], { cwd: root });
  commit(root, { 'process/ledger/other.json': E('other', 'WORKING') }, 'Merge other land');
  git(['checkout', '-q', 'job/si'], { cwd: root });
  assert.equal(baseAfterMerge(root, start, 'refs/heads/layer/12'), tip);
  // A base already past the merge base (a newer one given) is kept.
  assert.equal(baseAfterMerge(root, tip, 'refs/heads/layer/12'), tip);
  // No such ref: the base as given.
  assert.equal(baseAfterMerge(root, start, 'refs/heads/layer/99'), start);
  // A branch that never merged the layer: its start stays the base.
  git(['checkout', '-q', '-b', 'job/x', start], { cwd: root });
  commit(root, { 'process/ledger/si.json': E('si', 'BLOCKED', { status: { state: 'BLOCKED', reason: 'r' } }) });
  assert.equal(baseAfterMerge(root, start, 'refs/heads/layer/12'), start);
});

// As the copy's publish ran it: a shallow clone, the job branch as pushed (no merge of the layer
// yet), publish's job sync merging the layer tip locally, then job complete's shallow base (GitHub's
// compare of the pushed branch: the job's start) moved to the merged tip.
test('C36: in a shallow clone, after publish\'s local merge of the layer, the base is the merged tip and the ledger check passes', async () => {
  const { mkdtempSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { shallowBase } = await import('../lib/job.mjs');
  const { fetchBranch } = await import('../lib/util.mjs');
  const { root, start, tip } = layer();
  // origin: the layer tip with the sibling's land, the job branch as pushed before the merge.
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['push', '-q', bare, 'layer/12', 'job/si~1:refs/heads/job/si'], { cwd: root });
  const c = join(mkdtempSync(join(tmpdir(), 'p3-clone-')), 'c');
  git(['clone', '-q', '--depth', '1', '--branch', 'job/si', `file://${bare}`, c], { cwd: tmpdir() });
  for (const [k, v] of [['user.name', 't'], ['user.email', 't@t']]) git(['config', k, v], { cwd: c });
  fetchBranch(c, 'layer/12');
  // job sync deepens as far as the merge needs (job.mjs); here a few commits, the clone kept shallow below them.
  git(['fetch', '-q', '--deepen=2', 'origin', 'job/si', 'layer/12'], { cwd: c });
  git(['merge', '-q', '--no-edit', 'refs/remotes/origin/layer/12'], { cwd: c });
  const read = (slug, base, head) => ({ merge_base_commit: { sha: git(['merge-base', base, head], { cwd: bare }) }, ahead_by: Number(git(['rev-list', '--count', `${base}..${head}`], { cwd: bare })) });
  const stale = shallowBase(c, 'o/r', 'layer/12', 'job/si', read);
  assert.equal(stale, start, 'GitHub\'s base of the pushed branch: the job\'s start');
  assert.ok(checkLedger(c, { base: stale, branch: 'job/si' }).some((f) => /prov\.json/.test(f.file)), 'the copy\'s refusal');
  const base = baseAfterMerge(c, stale, 'refs/remotes/origin/layer/12');
  assert.equal(base, tip);
  assert.deepEqual(checkLedger(c, { base, branch: 'job/si' }), []);
});

// ===== file: lead.test.mjs (later part) =====

test('finding 7: blocked is informational; replace runs from the stop to the replacement, and a deferred block leaves both', () => {
  const { root } = withOrigin();
  const cfg = loadConfig(root);
  at(-10, () => commit(root, { ...E('y', 'WORKING'), ...E('z', 'WORKING'), ...E('w', 'WORKING') }, 'working'));
  // y: BLOCKED at 20, replaced at 35, the replacement works until 200 and unblocks.
  onJob(root, 'y', [[20, E('y', 'BLOCKED')], [200, E('y', 'WORKING')]]);
  // z: BLOCKED at 20, never replaced; its PR closed unmerged and deferred at layer 1's close at 100.
  onJob(root, 'z', [[20, E('z', 'BLOCKED')]]);
  // w: silent; replaced at 340 after its last push at 300.
  onJob(root, 'w', [[300, { 'src/w.js': 'x' }]]);
  const restarts = [
    { row: 'restart', tranche: 'tranche', module: 'y', at: t(35), why: 'blocked on a choice', stopped: t(20), stopped_by: 'BLOCKED' },
    { row: 'restart', tranche: 'tranche', module: 'w', at: t(340), why: 'quiet', stopped: t(300), stopped_by: 'last push' },
    { row: 'restart', tranche: 'older', module: 'w', at: t(10), why: 'another tranche', stopped: t(5), stopped_by: 'last push' },
  ];
  const jobRefs = new Map(['y', 'z', 'w'].map((m) => [m, `refs/remotes/origin/job/${m}`]));
  const rows = [start('y', 0), start('z', 0), start('w', 0)];
  const closed = [{ row: 'closed', tranche: 'tranche', layer: 1, at: t(100), deferred: { z: { reason: 'x', marks: ['R1'] } } }];
  const lt = leadTimes(root, cfg, { ref: 'HEAD', rows, grants: opened(0), restarts, closed, jobRefs, now: t(400) });
  const by = Object.fromEntries(lt.jobs.map((j) => [j.module, j]));
  assert.deepEqual(by.y.blocked, { minutes: 180 }, 'no target, no mark');
  assert.deepEqual(by.y.replace, [{ from: t(20), minutes: 15, stopped_by: 'BLOCKED', source: 'blocked', replaced: t(35), target: 30 }]);
  assert.deepEqual(by.z.blocked, { minutes: 0 }, 'the deferred block leaves the figures');
  assert.equal(by.z.replace, 'none');
  assert.equal(by.z.start_to_pr_ready, 'deferred');
  assert.deepEqual(by.w.replace, [{ from: t(300), minutes: 40, stopped_by: 'last push', source: 'last push', replaced: t(340), target: 30, mark: 'over' }]);
  assert.deepEqual(lt.summary.replace, { n: 2, median: 27.5, worst: 40, target: 30, worst_mark: 'over' });
  assert.equal(lt.summary.blocked.target, undefined);
  // Not deferred, z's block is open and over.
  const open = leadTimes(root, cfg, { ref: 'HEAD', rows, grants: opened(0), restarts, closed: [], jobRefs, now: t(400) });
