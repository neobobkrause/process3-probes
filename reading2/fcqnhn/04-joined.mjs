// ===== file: companion.test.mjs (continued) =====


test('companion join refusals: a companion already started in the layer takes no new job; a job with a companion is none; a companion has none', () => {
  const { root } = opened();
  layerJoin(root, 'a', { companionOf: 'd', layer: 2, why: WHY, io: joinIO(), log: quiet });
  assert.throws(() => layerJoin(root, 'd', { companionOf: 'e', layer: 2, why: 'x', io: joinIO(), log: quiet }), /d has its own companion\(s\) in layer 2: it cannot be one/);
  assert.throws(() => layerJoin(root, 'c', { companionOf: 'a', layer: 2, why: 'x', io: joinIO(), log: quiet }), /a is a companion in layer 2 itself/);
  // a's job starts: no second job joins it as a companion.
  writeStart(root, 'a');
  assert.throws(() => layerJoin(root, 'a', { companionOf: 'e', layer: 2, why: 'op y', io: joinIO(), log: quiet }), /a's job started in layer 2 already: e's need is not in its brief/);
});
const writeStart = (root, id) => writeRows(root, SB, `layer 2: ${id} started`, [[flowFile(2, 'start', `${id}-1-1`), { row: 'start', layer: 2, module: id, attempt: 1, branch: `job/${id}`, at: new Date().toISOString() }]]);

test('land order (PD-19b): a dependent job lands before its companion; the companion lands after', async () => {
  const { root, bare } = opened();
  layerJoin(root, 'a', { companionOf: 'd', layer: 2, why: WHY, io: joinIO(), log: quiet });
  const hd = jobWork(bare, 'd', { 'src/d/index.mjs': "import { ops } from '../a/index.mjs';\nexport const d = () => [...ops, 'aikeyreference'];\n" });
  const ha = jobWork(bare, 'a', { 'src/a/index.mjs': "export const ops = ['x', 'aikeyreference'];\n" });
  const prs = { 1: prOf(1, 'd', hd), 2: prOf(2, 'a', ha) };
  assert.equal((await layerLand(root, 1, { io: landIO(bare, prs), log: quiet })).ok, true);
  assert.equal((await layerLand(root, 2, { io: landIO(bare, prs), log: quiet })).ok, true);
  git(['fetch', '-q', 'origin'], { cwd: root });
  for (const h of [hd, ha]) assert.equal(git(['merge-base', '--is-ancestor', h, 'origin/layer/2'], { cwd: root, allowFail: true }).code, 0);
});

// PD-17: the path rehearsed end to end, as BOB runs it: a layer open with a job; the job needs a
// companion; the companion joins; both start (each brief names the pairing); the companion lands;
// the job lands; the layer merges. The layer cover holds as for any member.
test('rehearsal (PD-17): open, companion join, both start, companion lands, job lands, layer merge', async () => {
  const { root, bare } = opened();
  // The job is listed; its need is found: a's op family.
  assert.deepEqual(layerJobs(root, 2, { io: openIO, log: quiet }).startable.map((x) => x.id).sort(), ['d', 'e']);
  layerJoin(root, 'a', { companionOf: 'd', layer: 2, why: WHY, io: joinIO(), log: quiet });
  const list = layerJobs(root, 2, { io: openIO, log: quiet }).startable;
  assert.deepEqual(list.map((x) => x.id).sort(), ['a', 'd', 'e']);
  // Both start (push off: the local layer branch is the base); each brief names the pairing.
  git(['branch', '-f', 'layer/2', 'origin/layer/2'], { cwd: root });
  const briefs = {};
  for (const id of ['a', 'd']) {
    const out = [];
    jobStart(root, id, { coordinator: 's', push: false, ...(id === 'a' ? { reopen: `companion of d (PD-19): ${WHY}` } : {}), log: (l) => out.push(l) });
    briefs[id] = out.join('\n');
    git(['checkout', '-q', 'tranche'], { cwd: root });
  }
  assert.match(briefs.a, /## Companion \(PD-19\)\n\nYou are a companion job: `d` in this layer needs this module changed: d declares .*Change only what d needs, nothing beyond it; you land in the same layer as d, in any order \(PD-19b\)\./);
  assert.match(briefs.a, /What it must do: companion of d \(PD-19\)/);
  assert.match(briefs.d, /Your companion in this layer \(PD-19\): `a` \(d declares/);
  assert.match(git(['show', 'job/a:process/metrics/a.jsonl'], { cwd: root, allowFail: true }).stdout + git(['log', '-1', '-p', 'job/a'], { cwd: root }), /"companion_of":\[\{"job":"d"/, 'the ledger\'s start row records it');
  // The work, published from the layer branch.
  const hd = jobWork(bare, 'd', { 'src/d/index.mjs': "import { ops } from '../a/index.mjs';\nexport const d = () => [...ops, 'aikeyreference'];\n" });
  const ha = jobWork(bare, 'a', { 'src/a/index.mjs': "export const ops = ['x', 'aikeyreference'];\n" });
  const he = jobWork(bare, 'e', { 'src/e/index.mjs': 'export const e = 2;\n' });
  const prs = { 1: prOf(1, 'd', hd), 2: prOf(2, 'a', ha), 3: prOf(3, 'e', he) };
  await layerLand(root, 3, { io: landIO(bare, prs), log: quiet });
  await layerLand(root, 2, { io: landIO(bare, prs), log: quiet });
  const mio = (extra = {}) => ({ slug: 'o/p', openPRs: () => [], findPR: () => null, createPR: (s, p) => ({ number: 50, ...p, base: { ref: p.base } }), checkRun: () => ({ status: 'completed', conclusion: 'success' }), merge: (s, k, sha, title) => ghMerge(bare, 'tranche', sha, title), roundClose: () => ({ ran: false, owed: null }), ...extra });
  await assert.rejects(layerMerge(root, 2, { io: mio(), wait: false, log: quiet }), /d is (not started|rescheduled)/, 'the merge waits for the job');
  const hd2 = jobWork(bare, 'd', { 'src/d/more.mjs': 'export const more = 1;\n' }, { from: 'origin/job/d', merge: 'origin/layer/2' });
  prs[4] = prOf(4, 'd', hd2);
  await layerLand(root, 4, { io: landIO(bare, prs), log: quiet });
  const st = layerStatus(root, 2, { io: openIO, log: quiet });
  assert.deepEqual(st.states.map((s) => [s.id, s.state]).sort(), [['a', 'complete'], ['d', 'complete'], ['e', 'complete']]);
  assert.equal(st.ready, true);
  const m = await layerMerge(root, 2, { io: mio(), wait: false, log: quiet });
  assert.equal(m.ok, true);
  git(['fetch', '-q', 'origin'], { cwd: root });
  for (const h of [ha, hd2]) assert.equal(git(['merge-base', '--is-ancestor', h, 'origin/tranche'], { cwd: root, allowFail: true }).code, 0);
});

// Cold review of C51: no companion for a job with nothing left to land (landed, or deferred).
test('companion join refused for a job that landed or is deferred', async () => {
  const { root, bare } = opened();
  const he = jobWork(bare, 'e', { 'src/e/index.mjs': 'export const e = 2;\n' });
  const prs = { 1: prOf(1, 'e', he) };
  await layerLand(root, 1, { io: landIO(bare, prs), log: quiet });
  assert.throws(() => layerJoin(root, 'c', { companionOf: 'e', layer: 2, why: 'x', io: joinIO(), log: quiet }), /e has no work left to land in layer 2 \(complete/);
  commit(root, { 'process/ledger/d.json': entry('d', { layer: 2, status: { state: 'BLOCKED', reason: 'waits' } }) });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  assert.throws(() => layerJoin(root, 'c', { companionOf: 'd', layer: 2, why: 'x', io: joinIO(), log: quiet }), /d has no work left to land in layer 2 \(deferred/);
  fetchState(root, SB, { fresh: true });
  assert.equal(flowRows(root, SB, 2).companions.length, 0);
});

// ===== file: temp-cleanup.test.mjs =====

// Copy, 4 Nov: merge left its scratch tree (about 690 MB) on every run; 110 of them filled BOB's
// disk. Every scratch directory in tool/lib comes from withTemp, removed on every way out, with
// any worktree under it removed and pruned; a killed run's leftovers go at the next withTemp.
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, symlinkSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { once } from 'node:events';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { BOT, GATE, RECEIPT, block } from '../lib/github.mjs';
import { merge } from '../lib/merge.mjs';
import { writeState } from '../lib/state.mjs';
import { TEMP_OWNER, TEMP_STALE_HOURS, git, sweepTemp, withTemp } from '../lib/util.mjs';
import { commit, entry, makeRepo } from './helpers.mjs';

const LIB = join(dirname(fileURLToPath(import.meta.url)), '..', 'lib');

// Each case with a TMPDIR of its own, so what is left in it is the case's alone.
function scratch(fn) {
  const was = process.env.TMPDIR;
  const t = mkdtempSync(join(tmpdir(), 'p3-tmpdir-'));
  process.env.TMPDIR = t;
  try { return fn(t); } finally { if (was === undefined) delete process.env.TMPDIR; else process.env.TMPDIR = was; }
}
const left = (t, prefix) => readdirSync(t).filter((n) => n.startsWith(prefix));
// The test's own repositories also live in TMPDIR.
const scratchOnly = (t) => readdirSync(t).filter((n) => !/^p3-(test|origin)-/.test(n)).sort();
const worktrees = (root) => {
  const d = join(root, '.git', 'worktrees');
  return { listed: git(['worktree', 'list', '--porcelain'], { cwd: root }).split('\n').filter((l) => l.startsWith('worktree ')).length, entries: existsSync(d) ? readdirSync(d) : [] };
};

function setup() {
  const root = makeRepo({ 'process/ledger/alpha.json': entry('alpha') });
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['checkout', '-q', '-b', 'job/alpha'], { cwd: root });
  const head = commit(root, { 'src/alpha/a.mjs': 'x', 'process/metrics/alpha.jsonl': JSON.stringify({ row: 'attempt', event: 'complete', at: new Date().toISOString() }) + '\n' });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  commit(root, { 'other.txt': 'tranche moved on' });
  git(['push', '-q', 'origin', 'tranche', 'job/alpha', 'main'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  return { root, head };
}
const io = (head, mergePR) => ({
  getPR: () => ({ state: 'open', draft: false, user: { login: 'civicsmith' }, base: { ref: 'tranche' }, head: { ref: 'job/alpha', sha: head } }),
  comments: () => [
    { id: 1, body: block(RECEIPT, { module: 'alpha', attempt: 1, sha: head }), user: { login: 'civicsmith' } },
    { id: 2, body: block(GATE, { runs: [{ sha: head, ok: true, receipt: 'agrees', receipt_attempt: 1, run_id: 11 }] }), user: { login: BOT } },
  ],
  checkRun: () => ({ status: 'completed', conclusion: 'success', html_url: 'run' }),
  verify: (slug, r) => r.run_id === 11,
  mergePR,
});
const opts = (head, mergePR) => ({ slug: 'o/r', io: io(head, mergePR), reviewed: 'fresh worker', rounds: 1, reviewMinutes: 5, findings: 0, actedOn: 0, log: () => {}, wait: 0 });

for (const [name, mergePR, expect] of [
  ['succeeds', () => ({ merged: true, sha: 'm'.repeat(40) }), null],
  ['is refused', () => ({ merged: false, message: 'not mergeable' }), /GitHub did not merge/],
  ['throws mid-way', () => { throw new Error('boom mid-merge'); }, /boom mid-merge/],
]) {
  test(`a merge that ${name} leaves no p3-merge-* directory and no worktree entry`, () => scratch((t) => {
    const { root, head } = setup();
    const go = () => merge(root, 3, opts(head, mergePR));
    if (expect) assert.throws(go, expect); else assert.equal(go().merged, true);
    assert.deepEqual(left(t, 'p3-merge-'), []);
    assert.deepEqual(worktrees(root), { listed: 1, entries: [] });
  }));
}

test('a state write, done or failed inside its change, leaves no p3-state-* directory and no worktree entry', () => scratch((t) => {
  const root = makeRepo({ 'README.md': 'x' });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'main'], { cwd: root });
  writeState(root, 'process-state', 'a row', (wt) => writeFileSync(join(wt, 'a.txt'), 'a'));
  assert.throws(() => writeState(root, 'process-state', 'no row', () => { throw new Error('change failed'); }), /change failed/);
  assert.deepEqual(left(t, 'p3-state-'), []);
  assert.deepEqual(worktrees(root), { listed: 1, entries: [] });
