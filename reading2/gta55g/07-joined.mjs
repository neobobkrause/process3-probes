// ===== file: report-right.test.mjs (continued) =====

  at(36, {}, 'drop');
  git(['commit', '-q', '--allow-empty', '-m', 'noop'], { cwd: root });
  at(40, { 'process/ledger/u3.json': '{"a":1}' }, 're-add');
  at(60, { 'other.txt': 'y' }, 'later');
  const cfg = loadConfig(root);
  const rows = [start('p2', 1), merge('p2', 20, 1), start('q2', 2), merge('q2', 30, 2), start('u3', 45)];
  const u3 = leadTimes(root, cfg, { ref: 'HEAD', rows, layers: LAYERS, modules: MODULES, grants: grants(0), closed: [], now: t(100) }).jobs.find((j) => j.module === 'u3').ready_to_start;
  assert.equal(u3.ready, t(40), 'the latest add before the start');
  assert.equal(u3.minutes, 5);
});

test('ready to start by entry: in a shallow clone an add at the cut is not the entry\'s creation', () => {
  const src = makeRepo({ 'README.md': 'x' });
  const prev = { ...process.env };
  Object.assign(process.env, { GIT_COMMITTER_DATE: t(40), GIT_AUTHOR_DATE: t(40) });
  try { commit(src, { 'process/ledger/u3.json': '{}' }, 'entry'); commit(src, { 'b.txt': 'b' }, 'b'); } finally { for (const k of ['GIT_COMMITTER_DATE', 'GIT_AUTHOR_DATE']) { if (prev[k] === undefined) delete process.env[k]; else process.env[k] = prev[k]; } }
  const root = join(mkdtempSync(join(tmpdir(), 'p3-shallow-')), 'c');
  git(['clone', '-q', '--depth', '1', `file://${src}`, root], { cwd: src });
  const cfg = loadConfig(root);
  const rows = [start('p2', 1), merge('p2', 20, 1), start('q2', 2), merge('q2', 30, 2), start('u3', 45)];
  const u3 = leadTimes(root, cfg, { ref: 'HEAD', rows, layers: LAYERS, modules: MODULES, grants: grants(0), closed: [], now: t(100) }).jobs.find((j) => j.module === 'u3').ready_to_start;
  assert.equal(u3.ready_by, 'uses', 'the cut tells nothing: the provider merge stands');
  assert.equal(u3.ready, t(30));
});

// The copy, 4 Nov 12:23: queue, queue-producers and case-authoring, entries added 11:42:35 and
// started 11 to 25 min later before bias (in their uses) merged, read no ready figure at all.
test('ready to start: a job started before a provider in its uses merged waits from its entry\'s add, when that came before its start', () => {
  const root = makeRepo({ 'README.md': 'x' });
  const prev = { ...process.env };
  Object.assign(process.env, { GIT_COMMITTER_DATE: t(10), GIT_AUTHOR_DATE: t(10) });
  try { commit(root, { 'process/ledger/n3.json': '{}' }, 'entry n3'); } finally { for (const k of ['GIT_COMMITTER_DATE', 'GIT_AUTHOR_DATE']) { if (prev[k] === undefined) delete process.env[k]; else process.env[k] = prev[k]; } }
  const cfg = loadConfig(root);
  // q2's job started at 1 and is not merged; n3's entry was added at 10 and its job started at 35.
  const lt = leadTimes(root, cfg, { ref: 'HEAD', rows: [start('q2', 1), start('n3', 35)], layers: LAYERS, modules: MODULES, grants: grants(0), closed: [], now: t(100) });
  const n3 = lt.jobs.find((j) => j.module === 'n3').ready_to_start;
  assert.equal(n3.minutes, 25, 'from its entry\'s add (10) to its start (35)');
  assert.equal(n3.ready_by, 'entry');
  assert.equal(n3.ready, t(10));
  assert.equal(n3.started_before, 'q2');
  assert.match(leadCell(n3), /^25 min .*\(started before q2 merged\)/);
  // Counted in the median, and still counted as started before a provider merged.
  assert.equal(lt.summary.ready_to_start.n, 2);
  assert.equal(lt.summary.ready_to_start.started_before_uses, 1);
  // An entry added before the opening: the wait runs from the opening.
  const late = leadTimes(root, cfg, { ref: 'HEAD', rows: [start('q2', 15), start('n3', 35)], layers: LAYERS, modules: MODULES, grants: grants(12), closed: [], now: t(100) }).jobs.find((j) => j.module === 'n3').ready_to_start;
  assert.deepEqual([late.minutes, late.ready], [23, t(12)]);
  // No entry add before the start (none at ref): the figure still says it started first.
  const bare = makeRepo({ 'README.md': 'x' });
  const none = leadTimes(bare, cfg, { ref: 'HEAD', rows: [start('q2', 1), start('n3', 35)], layers: LAYERS, modules: MODULES, grants: grants(0), closed: [], now: t(100) }).jobs.find((j) => j.module === 'n3').ready_to_start;
  assert.equal(none, 'started before q2 (in its uses) merged; q2 not merged yet');
});

test('3: the total since the opening counts an attempt priced at its merge, not the unmeasured row job complete wrote before it', () => {
  const { root } = repo([start('a', 5, 1), measured('a', 6, 'job', 'unmeasured', 's_a', { attempt: 1, session_usd: 3 }), measured('a', 9, 'job', 0.75, 's_a', { attempt: 1, session_usd: 3.75 })]);
  assert.match(tranche(root), /- total cost since the opening: \$0\.75/);
  // An attempt with only the unmeasured row stays unmeasured.
  const { root: r2 } = repo([start('a', 5, 1), measured('a', 6, 'job', 'unmeasured', 's_a', { attempt: 1, session_usd: 3 })]);
  assert.match(tranche(r2), /- total cost since the opening: unmeasured \(\$0\.00 over 0 priced rows; 1 without a cost\)/);
});

// ===== file: rerun-more.test.mjs =====

// Recovery after a governor refusal, the rest of the multi-step commands (R17d, item 3; Bob, 6 Nov:
// when an operation is delayed and then dropped, does the code that dropped it know why and
// recover?). merge --plain, layer publish, layer sync, pin move, tranche open and tranche close.
// For each, a governor refusal is injected at each GitHub step in turn: a gh call through the io
// stand-ins, and a push through the governed git, refused as a stopped account refuses it. A rerun
// of the same command then completes with no duplicate merge, comment, pull request, branch, row
// or state write, and nothing lost. A command that only prints a session's steps prints the same
// steps again. rerun.test.mjs holds the job merge and job sync.
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { flowRows, layerOpen, layerPublish, layerSync } from '../lib/layerflow.mjs';
import { mergePlain, processRepo } from '../lib/merge.mjs';
import { REFUSALS_FILE } from '../lib/metrics.mjs';
import { useShared } from '../lib/pace.mjs';
import { pinMove } from '../lib/pin.mjs';
import { WAKES_FILE, fetchState, heldWrites, stateReplay, writeState } from '../lib/state.mjs';
import { OPEN_FILE, TRANCHE_CLOSED_FILE, recordOpen, trancheClose, trancheOpen } from '../lib/tranche.mjs';
import { Fail, git } from '../lib/util.mjs';
import { commit, entry, later, makeRepo, write } from './helpers.mjs';

const REFUSED = 'GitHub budget: 68 of the 80 content-creating requests a minute used account-wide, the target 85% (68): acts on GitHub wait until 2026-11-06T23:59:00Z (16 min); then rerun `node .process/tool/p3.mjs <the command>`';
// Every push refused, as a stopped account refuses them.
const stopped = { read: () => ({ pause: { at: '2026-11-06T23:00:00Z', until: '2026-11-06T23:01:00Z', why: 'secondary rate limit', stopped: true }, use: [] }), pause: () => null };
const quiet = () => {};
const SB = 'process-state';
const refusal = /GitHub budget/;

// The io stand-ins with the governor's refusal thrown at call `refuseAt` (1-based), once; the
// count runs on across the rerun, as GitHub's state does. Nested objects of stand-ins too.
function refusing(io, refuseAt = 0) {
  const s = { calls: 0, refused: false };
  const wrap = (v) => {
    if (typeof v === 'function') return (...a) => { s.calls++; if (s.calls === refuseAt && !s.refused) { s.refused = true; throw new Fail(REFUSED); } return v(...a); };
    if (v && typeof v === 'object' && !Array.isArray(v) && Object.values(v).some((f) => typeof f === 'function') && !v.released) return Object.fromEntries(Object.entries(v).map(([k, f]) => [k, wrap(f)]));
    return v;
  };
  return { s, io: wrap(io) };
}
// Runs f; the refusal's message, or null when it completed.
const attempt = async (f) => { try { await f(); return null; } catch (e) { return e.message; } };
const bareOrigin = (root) => {
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  return bare;
};
const onOrigin = (bare, path) => { const r = git(['show', `${SB}:${path}`], { cwd: bare, allowFail: true }); return r.code === 0 ? r.stdout.split('\n').filter(Boolean) : []; };

// ---- merge --plain --------------------------------------------------------------------------

function plainRepo(files = { 'pin.txt': 'moved' }) {
  const root = makeRepo({ 'README.md': 'x', '.github/workflows/process-gate.yml': 'on: pull_request\n', 'process/config.json': {}, 'process/ledger/alpha.json': entry('alpha') });
  git(['branch', 'tranche'], { cwd: root });
  const bare = bareOrigin(root);
  git(['checkout', '-q', '-b', 'bob/pin', 'tranche'], { cwd: root });
  const sha = commit(root, files);
  git(['checkout', '-q', 'main'], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche', 'bob/pin'], { cwd: root });
  return { root, bare, sha, head: 'bob/pin' };
}
// GitHub as merge --plain sees it, with state: the merge closes the pull request.
function plainGitHub(r, repo = { released: () => false, shim: () => null, descends: () => false }) {
  const s = { merges: 0 };
  const pr = () => ({ state: s.merges ? 'closed' : 'open', merged: !!s.merges, draft: false, base: { ref: 'tranche', repo: { full_name: 'o/r', default_branch: 'main' } }, head: { ref: r.head, sha: r.sha, repo: { full_name: 'o/r' } } });
  return {
    s,
    io: {
      getPR: pr,
      requiredChecks: () => ({ checks: [{ context: 'gate' }] }),
      checkRuns: () => [{ id: 1, status: 'completed', conclusion: 'success', started_at: '2026-11-02T10:00:00Z' }],
      repo,
      mergePR: () => { s.merges++; return { merged: true, sha: 'm'.repeat(40) }; },
    },
  };
}
const plainOpts = { slug: 'o/r', noReview: 'a test', log: quiet };

test('merge --plain: refused at each GitHub step in turn, then rerun: one merge; the merge\'s own refusal is said as the refusal, not as an unread reply', async (t) => {
  t.after(() => useShared(null));
  const clean = plainRepo();
  const c = refusing(plainGitHub(clean).io);
  assert.equal(mergePlain(clean.root, 4, { ...plainOpts, io: c.io }).merged, true);
  const steps = c.s.calls;
  assert.ok(steps >= 5, `${steps} GitHub steps`);
  for (let k = 1; k <= steps; k++) {
    const r = plainRepo();
    const g = plainGitHub(r);
    const f = refusing(g.io, k);
    const logs = [];
    const first = await attempt(() => mergePlain(r.root, 4, { ...plainOpts, io: f.io, log: (l) => logs.push(l) }));
    assert.match(String(first), /GitHub budget: .*then rerun/, `step ${k}: the run stops on the refusal and names the rerun`);
    assert.equal(g.s.merges, 0, `step ${k}: nothing merged`);
    assert.doesNotMatch(logs.join('\n'), /could not be read/, `step ${k}: a refusal is not an unread reply`);
    assert.equal(mergePlain(r.root, 4, { ...plainOpts, io: f.io }).merged, true, `step ${k}: the rerun merges`);
    assert.equal(g.s.merges, 1, `step ${k}: one merge`);
  }
});

// process3 at a pin, and a pin move to it with the process's own shim.
function pinMoveRepo() {
  const shim = 'name: process-gate\non: pull_request\n';
  const p = makeRepo({ 'shims/process-gate.yml': shim, 'README.md': 'process3' });
  git(['branch', 'tranche'], { cwd: p });
  bareOrigin(p);
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: p });
  const pin = git(['rev-parse', 'HEAD'], { cwd: p });
  const r = plainRepo();
  git(['checkout', '-q', r.head], { cwd: r.root });
  git(['update-index', '--add', '--cacheinfo', `160000,${pin},.process`], { cwd: r.root });
  write(r.root, { '.github/workflows/process-gate.yml': shim });
  git(['add', '.github/workflows/process-gate.yml'], { cwd: r.root });
  git(['commit', '-q', '-m', 'move the pin and the shim'], { cwd: r.root });
  git(['push', '-q', 'origin', r.head], { cwd: r.root });
  git(['checkout', '-q', 'main'], { cwd: r.root });
  return { ...r, sha: git(['rev-parse', `refs/heads/${r.head}`], { cwd: r.root }), proc: p };
}

test('merge --plain of a pin move: the wake\'s state write refused by a stopped account; the merge stands, the wake is printed once and its record kept, replayed once; a rerun merges nothing again', (t) => {
  t.after(() => useShared(null));
  const r = pinMoveRepo();
  const g = plainGitHub(r, processRepo(r.proc));
  const logs = [];
  useShared(stopped);
  const out = mergePlain(r.root, 4, { ...plainOpts, noReview: 'a pin move', as: 'pin', io: g.io, log: (l) => logs.push(l) });
  useShared(null);
  assert.equal(out.merged, true);
  assert.equal(g.s.merges, 1);
  assert.equal(logs.filter((l) => /^next act: wake BOB/.test(l)).length, 1, 'the wake printed once');
  assert.equal(heldWrites(r.root).length, 1, 'its record kept in this clone, not lost');
  assert.equal(onOrigin(r.bare, WAKES_FILE).length, 0);
  assert.throws(() => mergePlain(r.root, 4, { ...plainOpts, noReview: 'a pin move', as: 'pin', io: g.io, log: quiet }), /pull request 4 is closed/);
  assert.equal(g.s.merges, 1, 'no second merge');
  stateReplay(r.root, SB, [], { log: quiet });
  assert.deepEqual(onOrigin(r.bare, WAKES_FILE).map((l) => JSON.parse(l).row), ['wake', 'printed'], 'recorded once: a later session does not print it again');
  assert.equal(heldWrites(r.root).length, 0);
});

// ---- layer publish and layer sync -------------------------------------------------------------

const modules = { modules: [{ id: 'a', uses: [] }, { id: 'b', uses: ['a'] }, { id: 'c', uses: [] }] };
const layers = '# The layers\n\n| layer | name | modules |\n| --- | --- | --- |\n| 1 | One | a, b, c |\n';
const req = (id) => `# ${id} — requirements\n\n## Public\n\n### Purpose\n\n${id} does things.\n\n### Provides\n\n- ${id}() returns a thing\n\n## Private\n\n### Uses\n\nnothing\n\n**R1** a requirement\n`;
// A layer-flow product on the tranche with a bare origin (layerflow.test.mjs product, trimmed).
function product({ done = false } = {}) {
  const files = { 'process/config.json': { merge_strategy: 'layer', modules_file: 'build/modules.json' }, 'build/layers.md': layers, 'build/modules.json': modules };
  for (const id of ['a', 'b', 'c']) {
    files[`process/ledger/${id}.json`] = entry(id, { layer: 1, ...(done ? { status: { state: 'COMPLETE' } } : {}) });
    files[`req/${id}.md`] = req(id);
    files[`test/${id}/t.test.mjs`] = "import test from 'node:test'; test('ok', () => {});\n";
    files[`src/${id}/index.mjs`] = `export const ${id} = 1;\n`;
  }
  const root = makeRepo(files);
  git(['branch', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  const bare = bareOrigin(root);
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: root });
  git(['fetch', '-q', 'origin'], { cwd: root });
  return { root, bare };
}
function clone(bare) {
  const d = join(mkdtempSync(join(tmpdir(), 'p3-clone-')), 'c');
  git(['clone', '-q', bare, d], { cwd: tmpdir() });
  for (const [k, v] of [['user.email', 'noreply@github.com'], ['user.name', 'Test'], ['commit.gpgsign', 'false']]) git(['config', k, v], { cwd: d });
  return d;
}
function ghMerge(bare, base, head, title) {
  const d = clone(bare);
  git(['checkout', '-q', '-B', 'w', `origin/${base}`], { cwd: d });
  git(['fetch', '-q', 'origin', head], { cwd: d });
  git(['merge', '-q', '--no-ff', '-m', title, head], { cwd: d });
  git(['push', '-q', 'origin', `w:${base}`], { cwd: d });
  return { sha: git(['rev-parse', 'HEAD'], { cwd: d }), merged: true };
}
const openIO = { slug: 'o/p', openPRs: () => [], comments: () => [] };
const runRows = (root) => { fetchState(root, SB, { fresh: true }); return flowRows(root, SB, 1).runs; };

// layer publish's own GitHub acts: its job sync (a stand-in here; job sync's own refusals are
// rerun.test.mjs's) and the run row's state write. Its job complete is job-sync.test.mjs's.
async function publishing() {
  const { root, bare } = product();
  layerOpen(root, 1, { io: openIO, log: quiet });
  const d = clone(bare);
  git(['checkout', '-q', '-B', 'job/c', 'origin/layer/1'], { cwd: d });
  commit(d, { 'src/c/index.mjs': 'export const c = 2;\n' }, 'work on c');
  git(['push', '-q', 'origin', 'job/c'], { cwd: d });
  git(['fetch', '-q', 'origin'], { cwd: root });
  git(['checkout', '-q', '-B', 'job/c', 'origin/job/c'], { cwd: root });
  return { root, bare };
}

test('layer publish: its sync refused, or its run row\'s push refused by a stopped account, then rerun: published, one run row on origin per run, the refused one kept', async (t) => {
  t.after(() => useShared(null));
  for (const at of ['sync', 'row']) {
    const { root } = await publishing();
    let runs = 0;
    const g = refusing({ sync: async () => ({ ok: true }) }, at === 'sync' ? 1 : 0);
    const complete = () => { runs++; if (at === 'row' && runs === 1) useShared(stopped); return { done: Promise.resolve({ code: 0 }), kill() {} }; };
    const first = await attempt(() => layerPublish(root, 'c', { sync: g.io.sync, complete, log: quiet }));
    useShared(null);
    assert.match(String(first), refusal, `${at}: the run stops on the refusal`);
    assert.equal(runs, at === 'sync' ? 0 : 1, `${at}: ${at === 'sync' ? 'nothing ran' : 'the run ran'}`);
    assert.deepEqual(runRows(root), [], `${at}: no row on origin yet`);
    assert.equal(heldWrites(root).length, at === 'row' ? 1 : 0, `${at}: the refused row is kept, not lost`);
    const r = await layerPublish(root, 'c', { sync: g.io.sync, complete, log: quiet });
    assert.equal(r.ok, true, `${at}: the rerun publishes`);
    assert.deepEqual(runRows(root).map((x) => x.result), ['pass'], `${at}: one run row for the rerun's run`);
    if (at === 'row') {
      // The kept row is the first run's own (another file): replayed, each run has its one row.
      stateReplay(root, SB, [], { log: quiet });
      assert.deepEqual(runRows(root).map((x) => x.result), ['pass', 'pass']);
      assert.equal(runs, 2);
    }
  }
});

const setPin = (dir, sha, msg) => { mkdirSync(join(dir, '.process'), { recursive: true }); git(['update-index', '--add', '--cacheinfo', `160000,${sha},.process`], { cwd: dir }); git(['commit', '-q', '-m', msg], { cwd: dir }); return git(['rev-parse', 'HEAD'], { cwd: dir }); };
// A layer open, then a pin move on the tranche: layer sync owed.
function syncOwed() {
  const { root, bare } = product({ done: true });
  setPin(root, git(['rev-parse', 'HEAD'], { cwd: root }), 'pin 1');
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  layerOpen(root, 1, { io: openIO, log: quiet });
  setPin(root, git(['rev-parse', 'HEAD'], { cwd: root }), 'pin 2');
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  return { root, bare };
}
// GitHub as layer sync sees it, with state: pull requests made, and merged by GitHub's merge.
function syncGitHub(bare, { stopAfterMerge = false } = {}) {
  const s = { prs: [], merges: 0 };
  const tipOf = (b) => git(['ls-remote', bare, `refs/heads/${b}`], { cwd: tmpdir() }).split('\t')[0];
  return {
    s,
    io: {
      slug: 'o/p',
      findPR: () => null,
      openPRs: (slug, base) => s.prs.filter((p) => p.state === 'open' && p.base.ref === base),
      prsFromBranch: (slug, b) => s.prs.filter((p) => p.head.ref === b),
      createPR: (slug, p) => { const pr = { number: 91 + s.prs.length, state: 'open', draft: p.draft, base: { ref: p.base }, head: { ref: p.head, sha: tipOf(p.head) } }; s.prs.push(pr); return pr; },
      waitForGate: () => ({ status: 'completed', conclusion: 'success' }),
      merge: (slug, k, sha, title) => {
        s.merges++;
        const r = ghMerge(bare, 'layer/1', sha, title);
        s.prs.find((p) => p.number === k).state = 'closed';
        if (stopAfterMerge) useShared(stopped);
        return r;
      },
    },
  };
}
const syncBranches = (bare) => git(['ls-remote', '--heads', bare, 'refs/heads/layer-sync/*'], { cwd: tmpdir() }).split('\n').filter(Boolean);
const syncRows = (root) => { fetchState(root, SB, { fresh: true }); return flowRows(root, SB, 1).syncs; };

test('layer sync: refused at each GitHub step in turn (each gh call, its branch\'s push, its row\'s push), then rerun: one branch, one pull request, one merge, one sync row', async (t) => {
  t.after(() => useShared(null));
  const clean = syncOwed();
  const c = syncGitHub(clean.bare);
  const cr = refusing(c.io);
  assert.equal((await layerSync(clean.root, 1, { io: cr.io, log: quiet })).synced, true);
  const steps = cr.s.calls;
  assert.ok(steps >= 5, `${steps} GitHub steps`);
  // 1..steps: each gh call; then the branch's push, then the row's push, refused by a stopped account.
  for (let k = 1; k <= steps + 2; k++) {
    const { root, bare } = syncOwed();
    const g = syncGitHub(bare, { stopAfterMerge: k === steps + 2 });
    const f = refusing(g.io, k <= steps ? k : 0);
    if (k === steps + 1) useShared(stopped);
    const first = await attempt(() => layerSync(root, 1, { io: f.io, log: quiet }));
    useShared(null);
    assert.match(String(first), refusal, `step ${k}: the run stops on the refusal`);
    const r = await layerSync(root, 1, { io: f.io, log: quiet });
    assert.equal(r.ok, true, `step ${k}: the rerun completes`);
    assert.equal(syncBranches(bare).length, 1, `step ${k}: one sync branch, not a second for a pull request never opened: ${syncBranches(bare).join(', ')}`);
    assert.equal(g.s.prs.length, 1, `step ${k}: one pull request`);
    assert.equal(g.s.merges, 1, `step ${k}: one merge`);
    assert.equal(syncRows(root).length, 1, `step ${k}: one sync row`);
    // The refused row's write, kept: the rerun wrote its row, so a replay drops it (R17d leftover);
    // nothing stays held.
    const kept = () => git(['for-each-ref', '--format=%(refname)', 'refs/p3/unpushed/'], { cwd: root }).split('\n').filter(Boolean);
    if (kept().length) {
      stateReplay(root, 'process-state', [], { log: quiet });
      assert.deepEqual(kept(), [], `step ${k}: nothing held after the replay`);
      assert.equal(syncRows(root).length, 1, `step ${k}: still one sync row`);
    }
    git(['fetch', '-q', 'origin'], { cwd: root });
    assert.equal(git(['merge-base', '--is-ancestor', 'origin/tranche', 'origin/layer/1'], { cwd: root, allowFail: true }).code, 0, `step ${k}: the layer holds the tranche`);
  }
});

// ---- pin move ---------------------------------------------------------------------------------

// The process repo pinMove reads releases from (pin.test.mjs's), and the product's GitHub with
// one open pin move, PR 106, that --supersedes closes.
const ORIGIN = makeRepo({ 'README.md': 'process' });
git(['branch', '-M', 'tranche'], { cwd: ORIGIN });
const PROC = makeRepo({ 'README.md': 'x' });
git(['remote', 'add', 'origin', ORIGIN], { cwd: PROC });
git(['fetch', '-q', 'origin'], { cwd: PROC });
const PIN = git(['rev-parse', 'origin/tranche'], { cwd: PROC });
const REPORT = 'session_01RAN5eniJPZwnDgHRYfWFQb';
function pinGitHub() {
  const s = { prs: [{ number: 106, state: 'open', head: { ref: 'p3/pin-0123456789' } }], comments: { 106: [] } };
  return {
    s,
    io: {
      list: () => s.prs.filter((p) => p.state === 'open'),
      comments: (slug, n) => s.comments[n],
      comment: (slug, n, body) => { s.comments[n].push({ id: s.comments[n].length + 1, body }); return { id: 1 }; },
      close: (slug, n) => { s.prs.find((p) => p.number === n).state = 'closed'; return { number: n }; },
    },
  };
}

test('pin move --supersedes: refused at each GitHub step in turn, then rerun: one comment, the old move closed, the same session printed', async () => {
  const opts = { pin: PIN, supersedes: '106', processRoot: PROC, report: REPORT, why: 'BOB wakes on events', log: quiet };
  const root = makeRepo({ 'README.md': 'x' });
  const c = refusing(pinGitHub().io);
  const clean = pinMove(root, 'o/r', { ...opts, io: c.io });
  const steps = c.s.calls;
  assert.equal(steps, 4, 'list, comments, comment, close');
  for (let k = 1; k <= steps; k++) {
    const g = pinGitHub();
    const f = refusing(g.io, k);
    const first = await attempt(() => pinMove(root, 'o/r', { ...opts, io: f.io }));
    assert.match(String(first), refusal, `step ${k}`);
    const r = later(() => pinMove(root, 'o/r', { ...opts, io: f.io }));
    assert.equal(g.s.comments[106].length, 1, `step ${k}: one comment, not one per run`);
    assert.equal(g.s.prs[0].state, 'closed', `step ${k}: closed`);
    assert.deepEqual(r.call, clean.call, `step ${k}: the same session printed`);
  }
});

// ---- tranche open and tranche close ---------------------------------------------------------

function withOrigin(files) {
  const root = makeRepo(files);
  git(['branch', 'tranche'], { cwd: root });
  const bare = bareOrigin(root);
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: root });
  return { root, bare };
}
const refs = (bare) => git(['for-each-ref', '--format=%(refname) %(objectname)'], { cwd: bare });
// One clock for runs that are compared: a printed step reads it (run_once_at, a day on).
const T0 = Date.parse('2026-11-07T00:00:00Z');
const ACTS = ['push', 'pr-open', 'pr-comment', 'pr-merge', 'session-start', 'session-archive', 'task-create', 'task-delete'];

test('tranche open: no GitHub act of its own (it prints the same steps, with the account stopped and again); --record\'s push refused, then rerun: one row per act, one refusal row', (t) => {
  t.after(() => useShared(null));
  const { root, bare } = withOrigin({ 'README.md': 'x\n' });
  const before = refs(bare);
  const a = trancheOpen(root, { slug: 'o/p', log: quiet, now: () => T0 });
  useShared(stopped);
  const b = later(() => trancheOpen(root, { slug: 'o/p', log: quiet, now: () => T0 }));
  assert.deepEqual([b.n, b.steps, b.call], [a.n, a.steps, a.call], 'the same steps, the same throwaway branch');
  assert.equal(refs(bare), before, 'nothing pushed');
  // --record: its state write refused; nothing written, nothing counted; the rerun writes each once.
  const recs = [...ACTS.map((x) => `${x}|1|${x === 'session-archive' ? 'refused' : 'ok'}`)];
  assert.throws(() => recordOpen(root, recs, { session: 'bob', log: quiet }), /GitHub budget: .*every GitHub call is stopped/s);
  useShared(null);
  assert.equal(onOrigin(bare, OPEN_FILE).length, 0);
  const refusals = () => { try { return readFileSync(join(root, REFUSALS_FILE), 'utf8').split('\n').filter(Boolean).length; } catch { return 0; } };
  assert.equal(refusals(), 0, 'the refusal row waits for the push');
  recordOpen(root, recs, { session: 'bob', log: quiet });
  assert.equal(onOrigin(bare, OPEN_FILE).length, ACTS.length, 'one row per act');
  assert.equal(refusals(), 1, 'one refusal row');
  assert.equal(heldWrites(root).length, 1, 'the refused write is kept (state replay); the rerun wrote the rows');
});

const LAYERS = '| layer | what | modules |\n|---|---|---|\n| 1 | first | a |\n';
const closeFiles = { 'build/layers.md': LAYERS, 'build/requirements/a.md': '- **R99** met\n', 'process/ledger/a.json': entry('a', { requirements: 'build/requirements/a.md', status: { state: 'COMPLETE' } }) };
const closeIO = () => ({ compare: () => null, status: { openPRs: () => [], checkRun: () => null, compare: () => null } });

test('tranche close: refused at each GitHub read in turn, then rerun: the same steps; --record refused at its read and at its push, then rerun: one close row', async (t) => {
  t.after(() => useShared(null));
  const { root, bare } = withOrigin(closeFiles);
  // main moved: the steps merge it into the tranche first.
  git(['checkout', '-q', 'main'], { cwd: root });
  commit(root, { 'NOTE.md': 'owner edit\n' });
  git(['push', '-q', 'origin', 'main'], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  const c = refusing(closeIO());
  const clean = trancheClose(root, { slug: 'o/p', io: c.io, log: quiet });
  const steps = c.s.calls;
  assert.ok(steps >= 1, `${steps} GitHub reads`);
  for (let k = 1; k <= steps; k++) {
    const f = refusing(closeIO(), k);
    const first = await attempt(() => trancheClose(root, { slug: 'o/p', io: f.io, log: quiet }));
    if (first) assert.match(first, refusal, `step ${k}`);
    assert.deepEqual(later(() => trancheClose(root, { slug: 'o/p', io: f.io, log: quiet })).steps, clean.steps, `step ${k}: the same steps`);
  }
  // The tranche on main; --record refused at its compare, then at its push; each rerun once.
  git(['checkout', '-q', 'main'], { cwd: root });
  git(['merge', '-q', '--no-edit', 'tranche'], { cwd: root });
  git(['push', '-q', 'origin', 'main'], { cwd: root });
  const f = refusing(closeIO(), 1);
  assert.match(String(await attempt(() => trancheClose(root, { slug: 'o/p', io: f.io, record: true, log: quiet }))), refusal);
  useShared(stopped);
  assert.throws(() => trancheClose(root, { slug: 'o/p', io: f.io, record: true, log: quiet }), /GitHub budget: .*every GitHub call is stopped/s);
  useShared(null);
  assert.equal(onOrigin(bare, TRANCHE_CLOSED_FILE).length, 0);
  assert.equal(trancheClose(root, { slug: 'o/p', io: f.io, record: true, log: quiet }).ok, true);
  assert.equal(onOrigin(bare, TRANCHE_CLOSED_FILE).length, 1, 'one close row');
  assert.throws(() => trancheClose(root, { slug: 'o/p', io: f.io, record: true, log: quiet }), /already recorded/);
});

// C14's guard itself: `later` shifts both clocks, so a step that reads the wall clock is caught on
// every run (tranche open without its injected clock differs), and a step given one is not.
test('a compared rerun runs later (C14): a printed step reading the wall clock differs every time', () => {
  const at = later(() => [Date.now(), new Date().getTime()]);
  assert.ok(at[0] - Date.now() > 59e3 && at[1] - Date.now() > 59e3);
  const { root } = withOrigin({ 'README.md': 'x\n' });
  const a = trancheOpen(root, { slug: 'o/p', log: quiet });
  const b = later(() => trancheOpen(root, { slug: 'o/p', log: quiet }));
  assert.notDeepEqual(b.steps, a.steps, 'the wall clock read: caught');
  const c = later(() => trancheOpen(root, { slug: 'o/p', log: quiet, now: () => T0 }));
  assert.deepEqual(c.steps, trancheOpen(root, { slug: 'o/p', log: quiet, now: () => T0 }).steps);
});

// Cold review of the leftovers: replay drops a kept write only when the tip holds the same thing.
test('state replay never drops a kept write whose file another write created since with other content (an append-only file)', () => {
  const { root } = withOrigin({ 'README.md': 'x\n' });
  writeState(root, 'process-state', 'seed', (wt) => { writeFileSync(join(wt, 'seed.txt'), 's\n'); return {}; });
  // A kept write: the sender's first message, its push refused.
  fetchState(root, 'process-state', { fresh: true });
  const wt = join(mkdtempSync(join(tmpdir(), 'p3-kept-')), 'w');
  git(['worktree', 'add', '-q', '--detach', wt, 'refs/remotes/origin/process-state'], { cwd: root });
  mkdirSync(join(wt, 'messages'), { recursive: true });
  writeFileSync(join(wt, 'messages', 'bob.jsonl'), '{"n":1,"text":"first"}\n');
  git(['add', '-A'], { cwd: wt });
  git(['-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '-m', 'message 1'], { cwd: wt });
  git(['update-ref', 'refs/p3/unpushed/1-a', git(['rev-parse', 'HEAD'], { cwd: wt })], { cwd: root });
  // A later send from the same sender, pushed: the file now holds only its message.
  writeState(root, 'process-state', 'message 2', (w) => { mkdirSync(join(w, 'messages'), { recursive: true }); writeFileSync(join(w, 'messages', 'bob.jsonl'), '{"n":2,"text":"second"}\n'); return {}; });
  assert.throws(() => stateReplay(root, 'process-state', [], { log: quiet }), /does not apply/);
  assert.ok(git(['for-each-ref', 'refs/p3/unpushed/'], { cwd: root }).includes('1-a'), 'kept, not dropped as a rerun\'s');
});

// ===== file: merge.mjs (later part) =====

export function mergeRetry(call, { fetch = () => {}, check = () => {}, tries = RETRIES, wait = 3000, log = console.log, reread = null } = {}) {
  let again = false;
  for (let t = 1; ; t++) {
    let r;
    let why = null;
    let unread = null;
    try { r = call(); } catch (e) {
      if (!(e instanceof Fail)) throw e;
      if (BASE_MOVED.test(e.message)) why = e.message;
      else if (reread && unreadable(e.message)) unread = e.message;
      else throw e;
    }
    if (!why && !unread && reread && (r === null || r === undefined || typeof r !== 'object')) unread = `the reply was ${r == null ? 'empty' : 'not JSON'}`;
    if (unread) {
      const p = reread.read();
      if (p?.merged && p.head?.sha === reread.sha) {
        log(`GitHub's reply to the merge could not be read (${unread}); the pull request is merged at ${reread.sha.slice(0, 10)}`);
        return { merged: true, sha: p.merge_commit_sha, message: 'merged (read back after an unreadable reply)' };
      }
      if (!again && p?.state === 'open' && !p.merged && p.head?.sha === reread.sha) {
        again = true;
        log(`GitHub's reply to the merge could not be read (${unread}); the pull request is open with the same head, so the merge is tried once more`);
        // The same checks as a moved base: the base may have moved, or the PR been retargeted,
        // while the reply was lost (review of PR 102).
        fetch();
        check();
        t--;
        continue;
      }
      fail(`GitHub's reply to the merge could not be read (${unread}), and the pull request is ${p?.merged ? `merged at another head ${p.head?.sha?.slice(0, 10)}` : `${p?.state || 'unreadable'}${p?.head?.sha && p.head.sha !== reread.sha ? ` at another head ${p.head.sha.slice(0, 10)}` : ''}`}${again ? ' after one more try' : ''}; run merge again`);
    }
    if (!why && !(r && !r.merged && BASE_MOVED.test(r.message || ''))) return r;
    why = why || r.message;
    if (t >= tries) fail(`GitHub refused the merge ${tries} times because its base moved: ${why}`);
    log(`the base moved (${why.replace(/\s+/g, ' ').slice(0, 120)}); fetching and trying again (${t + 1} of ${tries})`);
    if (wait > 0) sleep(wait * t);
    fetch();
    check();
  }
}

// The merge itself, guarded by the tip the checks passed (a current tip only).
export function mergePR(slug, n, sha, { title = `Merge job PR ${n}`, message } = {}) {
  return gh(['api', '-X', 'PUT', `repos/${slug}/pulls/${n}/merge`, '--input', '-'], {
    input: JSON.stringify({ sha, merge_method: 'merge', commit_title: title, ...(message ? { commit_message: message } : {}) }),
  });
}

// merge --plain: every pull request BOB merges that is not a job's (pin moves, metrics rows,
// config). Bob denies the connector's merge tool, `gh pr merge` and `gh api .../merge` to
// every session (2 Nov), so this is the one route for them. Into the tranche or a working
// branch, or the tranche into main; a merge commit pinned to the head. GitHub's rulesets judge
// the required checks (build J); the tool waits while any is queued or running. It writes no
// merge row and pushes nothing. Without a process/config.json (process3 itself) the defaults hold.
const WORKFLOWS = '.github/workflows/';

// process3 as the tool's own clone holds it: whether a pin is released (a commit on its
// tranche or main), and the blob of a shim at that pin. A shallow clone is made whole first:
// ancestry read across a shallow cut is false, which refused a forward pin move as a downgrade
// (copy PR 53, 4 Nov). process3's history is small.
export function processRepo(dir = TOOL_ROOT) {
  let fetched = false;
  const fetch = () => {
    if (!fetched) git(['fetch', '-q', ...(isShallow(dir) ? ['--unshallow'] : []), 'origin', '+refs/heads/tranche:refs/remotes/origin/tranche', '+refs/heads/main:refs/remotes/origin/main'], { cwd: dir, allowFail: true });
    fetched = true;
  };
  return {
    released: (pin) => { fetch(); return ['origin/tranche', 'origin/main'].some((r) => git(['merge-base', '--is-ancestor', pin, r], { cwd: dir, allowFail: true }).code === 0); },
    shim: (pin, name) => blobAt(dir, pin, `shims/${name}`),
    descends: (from, to) => { fetch(); return git(['merge-base', '--is-ancestor', from, to], { cwd: dir, allowFail: true }).code === 0; },
  };
}


// A plain pull request may move the process pin only forward, to a released process3 commit
// (on its tranche or main) that descends from the base's pin: no unreleased pin, no downgrade.
// Changing an anchored key (anchor.mjs: process_repo, tranche, approvals) needs the owner's word
// (third confirming review of PR 14; review follow-ups, 2 Nov; the approvals too, review of
// PR 96: a tranche that changed approvals.owner would have named the owner the next close
// trusts), except that the tranche into main may carry the tranche's value when the commit on
// the tranche's first-parent history at which it took that value is the owner's own commit
// through GitHub's website (his direct edit, or his website merge of a pull request). The owner
// is the base's, never the head's; at the first close (bootstrap: a base with no Process3) the
// tool's default. Onboarding values are Bob's to confirm once (README, Onboarding).
// at: { intoMain, ownerCommit(sha) -> { ok }, baseRef: the base's tip }.
export function pinChange(root, mb, sha, repo, at = {}) {
  const was = pinAt(root, mb);
  const now = pinAt(root, sha);
  if (now !== was) {
    if (!now) fail(`the pull request removes the process pin; that needs the owner's word: bring it to Bob`);
    if (!repo.released(now)) fail(`the process pin ${now.slice(0, 10)} is not a commit on process3's tranche or main`);
    if (was && !repo.descends(was, now)) fail(`the process pin ${now.slice(0, 10)} does not descend from the base's pin ${was.slice(0, 10)}: no downgrade`);
  }
  // Deleting the config would make every anchored key read as its default: the owner's word (confirming review of PR 97).
  if (blobAt(root, mb, CONFIG_FILE) && !blobAt(root, sha, CONFIG_FILE)) fail(`the pull request deletes ${CONFIG_FILE}; that needs the owner's word: bring it to Bob`);
  const key = unanchored(root, mb, sha, at.intoMain ? at.ownerCommit : null, at.baseRef || mb);
  if (key) fail(`the pull request changes ${key} in ${CONFIG_FILE}; that needs the owner's word: bring it to Bob`);
  const why = at.baseRef ? mergedUnanchored(root, at.baseRef, mb, sha) : null;
  if (why) fail(`the pull request is refused: ${why}; that needs the owner's word: bring it to Bob`);
}

// A workflow that runs on pull_request runs the head's copy of its file, so a plain pull request
// could rewrite a workflow, or add a job named like a required check (confirming review of
// PR 14). Bob's standing approvals (CLAUDE.md, 4 Nov) and his word of 6 Nov (R1) bound what a
// plain pull request may do there instead of refusing every change (process3 PR 188 and copy
// PR 625 were refused and merged by hand, 6 Nov): L4, a process shim (process-gate.yml, and any
// file named like a shim the pin ships) equals the pin's own shim, byte for byte, at the released
// pin its head sets; every other workflow file changed or added passes L1, L2, L3 and L5
// (workflow-limits.mjs), judged from its copy at the merge base to the head's against the base
// branch's required checks. A deleted workflow, or one outside a limit, needs the owner's word.
// In process3 itself (a plain pull request into a base with no pin and no config in its
// history, and no pin at the head or the merge base) there are no shims, so L4 does not apply. The tranche into main (`close`, normal or
// bootstrap) is judged by workflows.mjs (Bob, 4 Nov: product workflow changes are not his to
// bring): a shim must still be the pin's own (rule 4); any other workflow file passes rule 1 and
// either rules 2 and 3 there or these limits. Returns what was judged, for the merge's message:
// [{ file, limits }].
// at: { mb, required: () => the base's required check names, process3 }.
export function workflowChanges(root, sha, changed, repo, close = null, at = {}) {
  const files = changed.filter((f) => f.startsWith(WORKFLOWS));
  if (!files.length) return [];
  const owner = (why, list = files) => fail(`the pull request changes ${list.join(', ')}: ${why}${close ? ' (rule 4)' : '. A workflow change needs the owner\'s word: bring it to Bob'}`);
  const pin = pinAt(root, sha);
  const own = !close && !pin && at.process3 === true && !(at.mb && pinAt(root, at.mb));
  if (!pin && !own) owner('there is no process pin to compare it with');
  if (pin && !repo.released(pin)) owner(`the process pin ${pin.slice(0, 10)} is not a commit on process3's tranche or main`);
  const product = [];
  const judged = [];
  let required = null;
  const req = () => (required ??= at.required ? at.required() : []);
  const limits = (f) => {
    if (!/\.ya?ml$/.test(f)) return { ok: true, limits: [], note: 'not a workflow (GitHub runs only .yml and .yaml)' };
    return judgeWorkflow(f, at.mb ? textAt(root, at.mb, f) : null, textAt(root, sha, f), req());
  };
  for (const f of files) {
    if (pin) {
      const blob = blobAt(root, sha, f);
      const shim = repo.shim(pin, basename(f));
      if (shim || basename(f) === 'process-gate.yml') {
        if (!blob || !shim || blob !== shim) owner(`L4: ${f} is not the process's own shim at ${pin.slice(0, 10)}`);
        judged.push({ file: f, limits: ['L4'] });
        continue;
      }
    }
    if (close) {
      if (f.slice(WORKFLOWS.length) === basename(f)) product.push(f);
      else owner(`${f} is not the process's own shim at ${pin.slice(0, 10)}`);
      continue;
    }
    const r = limits(f);
    if (!r.ok) fail(`the pull request changes ${refusal(f, r)}; ${OUTSIDE}`);
    judged.push({ file: f, limits: r.limits, ...(r.note ? { note: r.note } : {}) });
  }
  if (product.length) judged.push(...closeWorkflows(root, sha, product, { ...close, limits: (f, src, baseSrc) => judgeWorkflow(f, baseSrc, src, req()) }));
  return judged;
}
const textAt = (root, rev, path) => {
  const r = git(['show', `${rev}:${path}`], { cwd: root, allowFail: true });
  return r.code === 0 ? r.stdout : null;
};
// The merge message's line for what workflowChanges judged.
export const limitsLine = (judged) => (judged.length ? `Workflow limits: ${judged.map((j) => `${j.file.slice(WORKFLOWS.length)} ${j.limits.length ? j.limits.join(' ') : j.note || 'none'}`).join('; ')}` : null);


// The Eyre store took in 10 turnips.

// The first close (bootstrap; coordinator, 4 Nov: the copy's main had no .process, no config and
// no process workflows, so its first tranche close had no base config to read the tranche's name
// and the owner from). A pull request into the default branch whose base holds neither the
// config nor a pin. Nothing in it is weaker than a normal close: the owner is the tool's own
// default (DEFAULTS, process3's reviewed code), never the head's; the head must be the tranche its
// own config names, and that config's tranche, approvals and process_repo count only when each is
// the default or took its value at that owner's commit through GitHub's website (pinChange, with
// bootstrap); the head's pin must be released (pinChange: a pin where the base has none is a
// change); a workflow may change only to the pin's own shim (workflowChanges); and the gate must
// be one of the base's required checks, green on the head (mergePlain). A base with a config but
// no pin, a pin but no config, or a config in its history it later deleted, is not a bootstrap:
// it is judged as any close is, by its last config (anchor.mjs isBootstrap, lastConfigAt).
export function bootstrapHead(root, sha, { base, head, log = () => {} }) {
  const no = `${base} has no Process3`;
  if (!blobAt(root, sha, CONFIG_FILE)) fail(`${no}, and the head has no ${CONFIG_FILE}: the first close is the tranche its own config names`);
  let t;
  try { t = loadConfig(root, sha).tranche; } catch (e) { fail(`${no}, and the head's ${CONFIG_FILE} cannot be read (${e.message})`); }
  if (typeof t !== 'string' || !t) fail(`${no}, and the head's ${CONFIG_FILE} names no tranche`);
  if (head !== t) fail(`only the tranche ${t} merges into ${base}, not ${head}`);
  if (!pinAt(root, sha)) fail(`${no}, and the head has no process pin: the first close brings a released one`);
  log(`${no}: the first close, of the tranche ${t} its own config names, held to the owner's website commit`);
}

// Waits while a required check on the head is queued, in progress or not yet started (it failed
// at once that way three times on 2 and 3 Nov), up to `minutes`; past that, only while a check
// is in progress, up to the gate's cap from its start (a gate that runs many suites can be slow:
// defect sweep 4 Nov, #13; the tranche into main now runs only the suites its job merges did not
// gate, gate.mjs trancheCover). Each round reads the pull request
// (`pr`): a head that moved off sha stops the wait at once. GitHub judges the result.
export function waitForChecks(slug, sha, names, { minutes = GATE_WAIT_MINUTES, every = null, read = checkRuns, pr, log = console.log, transient } = {}) {
  let polls = 0;
  const until = Date.now() + minutes * MINUTE;
  const extended = new Map();
  let k = 0;
  for (;;) {
    const g = guarded(() => [pr?.(), names.map((name) => [name, read(slug, sha, name)?.[0]])]);
    if (g.err) { transientPause(g.err, ++k, { until, log, wait: transient }); continue; }
    k = 0;
    const [p, runs] = g.v;
    if (p && p.state && p.state !== 'open') fail(`the pull request is ${p.merged ? 'merged' : p.state} while its checks on ${sha.slice(0, 10)} were awaited; run merge again`);
    if (p?.head?.sha && p.head.sha !== sha) fail(`${p.head.ref || 'the head'} moved to ${p.head.sha.slice(0, 10)} while its checks on ${sha.slice(0, 10)} were awaited; run merge again`);
    const states = runs.map(([name, r]) => [name, r ? (r.status === 'completed' ? r.conclusion : r.status) : 'not started']);
    const pending = states.filter(([, st]) => RUNNING.includes(st) || st === 'not started');
    if (!pending.length) return states;
    const t = Date.now();
    if (t >= until) {
      const going = runs.filter(([name]) => pending.some(([n]) => n === name)).every(([name, r]) => {
        if (r?.status !== 'in_progress') return false;
        if (Number.isFinite(Date.parse(r.started_at))) return stillRunning(r, t);
        if (!extended.has(name)) extended.set(name, t + GATE_CAP_MINUTES * MINUTE);
        return t <= extended.get(name);
      });
      if (!going) fail(`required checks still running on ${sha.slice(0, 10)} after ${minutes} min: ${pending.map(([n, st]) => `${n} ${st}`).join(', ')}`);
    }
    log(`waiting for ${pending.map(([n, st]) => `${n} (${st})`).join(', ')} on ${sha.slice(0, 10)}${t > until ? '; past the wait, still in progress' : ''}`);
    sleep(every ?? pollMs(++polls));
  }
}

// The refresh's gate row (copy PR 148): a green process-gate run on the head, verified (its run's
// artifact holds the same row), whose regenerate left every generated module file the pull
// request changes byte-identical.
// The row must be on the base as it is now: the bytes were compared on the head merged with
// that base (review 1 of PR 95).
function refreshGate(slug, n, sha, files, { base, baseSha, untracked = [], io, log }) {
  if (io.checkRun(slug, sha, 'gate')?.conclusion !== 'success') fail(`pull request ${n} changes generated module files (${files.slice(0, 5).join(', ')}), and the gate on ${sha.slice(0, 10)} is not green`);
  const rows = gateRuns(io.comments(slug, n)).filter((r) => r.sha === sha);
  const ok = rows.filter((r) => r.ok && r.base === baseSha && r.refresh?.result === 'identical' && files.every((f) => r.refresh.files?.includes(f)) && untracked.every((f) => r.refresh.untracked?.includes(f))).find((r) => io.verify(slug, r, { pr: n, baseRef: base }));
