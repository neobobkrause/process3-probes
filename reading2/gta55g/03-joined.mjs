// ===== file: lane-qualify.test.mjs (continued) =====

  const q = laneStart(root, 'ux', { slug: 'o/p', log: quiet });
  assert.equal(q.qualified, true);
  assert.doesNotMatch(q.prompt, /QUALIFICATION/);
  assert.match(q.prompt, /## Your research area: read it first\n`design\/ux-research\/` \(3 files, \d+ bytes; qualified 2026-11-06\) is the lane's ground truth/);
  assert.match(q.prompt, /Keep it current as you work/);
  assert.ok(q.prompt.indexOf('Your research area') < q.prompt.indexOf('Your design documents'));
  assert.deepEqual(qualification(root, lanes(loadConfig(root))[0]).records, ['2026-11-06']);
});

test('lane ask refuses an unqualified lane, recording nothing, and says where its qualification stands; a qualified lane\'s brief reads its research area first', () => {
  const { root, bare } = withOrigin({ 'process/config.json': { lanes: [{ name: 'ux', dir: 'design/ux' }] }, 'design/ux/README.md': 'x\n' });
  assert.throws(() => laneAsk(root, 'ux', 'which words?', { log: quiet }), /lane ux has not qualified \(design\/ux-research\/ is missing or empty\): it answers no ask until its qualification lands; start it with .* lane start ux, which qualifies it first; nothing recorded/);
  laneStart(root, 'ux', { slug: 'o/p', log: quiet });
  laneStart(root, 'ux', { record: S1, log: quiet });
  assert.throws(() => laneAsk(root, 'ux', 'which words?', { log: quiet }), /its session session_q1 is qualifying: ask again once its qualification pull request is in tranche and this checkout has it; nothing recorded/);
  assert.equal(asksOn(bare).trim(), '');
  commit(root, { 'design/ux-research/index.md': 'index\n', 'design/ux-research/qualification-2026-11-06.md': 'record\n' });
  laneEnd(root, 'ux', { session: S1, why: 'qualified', log: quiet });
  const r = laneAsk(root, 'ux', 'which words?', { log: quiet });
  assert.match(r.brief, /First, the lane's research area `design\/ux-research\/`: 2 files, 13 bytes, qualified 2026-11-06\. Read its `index\.md`/);
  assert.ok(r.brief.indexOf('research area') < r.brief.indexOf("The lane's directory"));
  assert.match(r.brief, /- research: <what the lane's research area lacks for this question/);
  assert.match(r.brief, /## Reading set \(\d+ bytes\)/);
});

test('a triage lane and the process\'s triage lane need no qualification', () => {
  const { root } = withOrigin({ 'process/config.json': { lanes: [{ name: 'triage', dir: 'triage', kind: 'triage' }] }, 'triage/register.json': '[]\n' });
  const r = laneStart(root, 'triage', { slug: 'o/p', log: quiet });
  assert.equal(r.qualified, null);
  assert.doesNotMatch(r.prompt, /QUALIFICATION|research area/);
  assert.equal(existsSync(join(root, 'triage-research')), false);
});

test('a lane module\'s job START: the research area first, or qualify first', () => {
  const { root } = withOrigin({ 'process/config.json': { lanes: [{ name: 'ux', dir: 'design/ux', module: 'ux-design' }] }, 'design/ux/a.md': 'a\n' });
  const base = { entry: entry('ux-design'), slug: 'o/p', branch: 'job/ux-design', tranche: 'tranche', coordinator: 'session_bob', bob: true, attempt: 1, reading: { files: [], bytes: 0 } };
  const un = laneForStart(root, loadConfig(root), 'ux-design');
  assert.equal(un.research.qualified, false);
  assert.match(startText({ ...base, lane: un }), /The lane has not qualified: `design\/ux-research\/` holds no index\.md and qualification record\. Before you decide any design there, qualify it \(Bob, 6 Nov\)/);
  commit(root, { 'design/ux-research/index.md': 'i\n', 'design/ux-research/qualification-2026-11-06.md': 'r\n' });
  assert.match(startText({ ...base, lane: laneForStart(root, loadConfig(root), 'ux-design') }), /The lane's research area `design\/ux-research\/` is its ground truth: read its index\.md before you decide design there/);
});

// Coordinator, 6 Nov: lane start refused a new lane, "lane investigation's directory
// docs/development/investigation-design/ is not in this checkout", and BOB seeded READMEs by hand
// (copy 668, 669). The seeding step is printed and the lane starts.
test('lane start on a lane whose folder is not in the product yet prints its seeding step (README and an empty research index) and starts; its START opens with it', async () => {
  const { root } = withOrigin({ 'process/config.json': { lanes: [{ name: 'investigation', dir: 'docs/development/investigation-design' }] }, 'README.md': 'x\n' });
  const out = [];
  const r = laneStart(root, 'investigation', { slug: 'o/p', log: (m) => out.push(m) });
  assert.deepEqual(r.seed.map((f) => f.file), ['docs/development/investigation-design/README.md', 'docs/development/investigation-design-research/index.md']);
  assert.match(r.seed[0].text, /^# Lane investigation\n\n- Lane: investigation\n- Area: `docs\/development\/investigation-design\/`\n- Decision: </);
  assert.equal(r.seed[1].text, '');
  assert.match(out.join('\n'), /^Lane investigation's directory docs\/development\/investigation-design\/ is not in tranche yet\. Seed it first: a lane-only pull request into tranche .*adding:\n- docs\/development\/investigation-design\/README\.md:\n    # Lane investigation[\s\S]*\n- docs\/development\/investigation-design-research\/index\.md \(empty\)\n/);
  assert.match(r.prompt, /^Lane investigation's directory docs\/development\/investigation-design\/ is not in tranche yet\. Seed it first/);
  assert.ok(r.call, 'the lane starts');
  // A research index already there is never overwritten by the seed.
  const { mkdirSync, writeFileSync } = await import('node:fs');
  mkdirSync(join(root, 'docs/development/investigation-design-research'), { recursive: true });
  writeFileSync(join(root, 'docs/development/investigation-design-research/index.md'), 'index\n');
  laneEnd(root, 'investigation', { session: 'pending', why: 'test', log: quiet });
  assert.deepEqual(laneStart(root, 'investigation', { slug: 'o/p', log: quiet }).seed.map((f) => f.file), ['docs/development/investigation-design/README.md']);
});

// Coordinator's ruling, 6 Nov: a lane's module, when named, has a ledger entry, a modules row and a
// requirements file; its marks are the lane's work. A lanes row without module stays valid.
test('lane start and setup check refuse a lane whose module has no ledger entry, modules row or requirements file, naming what BOB writes', async () => {
  const { laneModuleGaps } = await import('../lib/ledger.mjs');
  const cfg = { tranche: 'tranche', modules_file: 'build/modules.json', requirements_dir: 'req', lanes: [{ name: 'ux', dir: 'design/ux', module: 'ux' }, { name: 'investigation', dir: 'docs/inv' }] };
  const files = (over = {}) => (f) => ({ 'build/modules.json': JSON.stringify({ modules: [{ id: 'ux', uses: [] }] }), 'process/ledger/ux.json': JSON.stringify(entry('ux', { requirements: 'req/ux.md' })), 'req/ux.md': '# ux\n', ...over }[f] ?? null);
  assert.deepEqual(laneModuleGaps(files(), cfg), [], 'all three there; the row without module is valid');
  assert.match(laneModuleGaps(files({ 'process/ledger/ux.json': null }), cfg)[0], /^lane ux names module ux, which has no ledger entry process\/ledger\/ux\.json: BOB writes it \(with its modules file row and its requirements file\) by a plain pull request into tranche, or drops "module" from the lane's row$/);
  assert.match(laneModuleGaps(files({ 'build/modules.json': JSON.stringify({ modules: [] }) }), cfg)[0], /lane ux's module ux has no row in build\/modules\.json: BOB adds \{"id": "ux"/);
  assert.match(laneModuleGaps(files({ 'req/ux.md': null }), cfg)[0], /lane ux's module ux has no requirements file req\/ux\.md: BOB writes it/);
  // lane start, in a checkout: refused, nothing started.
  const { root } = withOrigin({ 'process/config.json': { lanes: [{ name: 'ux', dir: 'design/ux', module: 'ux' }] }, 'design/ux/README.md': 'x\n' });
  assert.throws(() => laneStart(root, 'ux', { slug: 'o/p', log: quiet }), /lane ux names module ux, which has no ledger entry process\/ledger\/ux\.json: BOB writes it .*; nothing was started/);
  // setup check's reader.
  const { readers } = await import('../lib/setup.mjs');
  const r = readers['lane-modules']({}, { cfg, file: files({ 'process/ledger/ux.json': null }) });
  assert.equal(r.state, 'missing');
  assert.equal(readers['lane-modules']({}, { cfg, file: files() }).state, 'set');
});

// ===== file: main-gate.test.mjs =====

// The tranche into main (PR 89's report, 4 Nov): the gate runs only the suites of modules with a
// file its job merges did not gate; every other file names the job PR whose gate tested it.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { gate } from '../lib/gate.mjs';
import { BOT, GATE, block } from '../lib/github.mjs';
import { git } from '../lib/util.mjs';
import { commit, entry, makeRepo } from './helpers.mjs';

const quiet = () => {};
const MAIN_PR = 900;
const testOf = (id, v) => `import test from 'node:test'; import a from 'node:assert'; import { x } from '../../src/${id}/index.mjs';\ntest('x', () => a.equal(x, ${v}));\n`;

// main holds n modules; the tranche merges one job per module, as merge does: the job branch
// is the tranche plus the change, plus its merge row; the tranche merges it with --no-ff under
// "Merge job PR <n>". Each job's PR has a green gate row on that merged result, unless `red`.
function product(n, { red = [], unverified = [], uses = {}, over = {} } = {}) {
  const ids = Array.from({ length: n }, (_, i) => `m${i}`);
  const files = {};
  for (const id of ids) {
    files[`process/ledger/${id}.json`] = entry(id, { status: { state: 'WORKING' }, ...(uses[id] ? { uses: uses[id] } : {}), ...(over[id] || {}) });
    files[`src/${id}/index.mjs`] = 'export const x = 1;\n';
    files[`test/${id}/x.test.mjs`] = testOf(id, 1);
  }
  const root = makeRepo(files);
  const base = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', '-b', 'tranche'], { cwd: root });
  const prs = new Map();
  const comments = new Map();
  ids.forEach((id, i) => {
    const pr = i + 1;
    const onto = git(['rev-parse', 'HEAD'], { cwd: root });
    git(['checkout', '-q', '-b', `job/${id}`], { cwd: root });
    commit(root, { [`src/${id}/index.mjs`]: 'export const x = 2;\n', [`test/${id}/x.test.mjs`]: testOf(id, 2) });
    const tip = commit(root, { [`process/metrics/${id}.jsonl`]: JSON.stringify({ row: 'merge', pr }) + '\n' });
    git(['checkout', '-q', 'tranche'], { cwd: root });
    git(['merge', '-q', '--no-ff', `job/${id}`, '-m', `Merge job PR ${pr}`], { cwd: root });
    const m = git(['rev-parse', 'HEAD'], { cwd: root });
    prs.set(pr, { number: pr, merged: true, merge_commit_sha: m, base: { ref: 'tranche' }, head: { ref: `job/${id}`, sha: tip, repo: { full_name: 'o/r' } }, user: { login: 'civicsmith' } });
    const ok = !red.includes(id);
    const row = { sha: tip, base: onto, run_id: 100 + pr, trigger: 'code', scope: [id], suite: ok ? 'pass' : 'fail', ok, findings: ok ? 0 : 1, verified: !unverified.includes(id) };
    comments.set(pr, [{ id: pr, body: block(GATE, { runs: [row] }), user: { login: BOT } }]);
  });
  const io = {
    getPR: (s, n) => (n === MAIN_PR ? { draft: false, user: { login: 'neobobkrause' } } : prs.get(n)),
    prsFromBranch: (s, b) => [...prs.values()].filter((x) => x.head.ref === b),
    baseEverChanged: () => false,
    comments: (s, n) => comments.get(n) || [],
    addComment: () => ({}),
    verify: (s, r, ctx) => r.verified === true && prs.get(ctx.pr)?.head.sha === r.sha && ctx.baseRef === 'tranche',
  };
  return { root, base, ids, prs, comments, io };
}
const run = (p, over = {}) => gate(p.root, { base: p.base, head: git(['rev-parse', 'tranche'], { cwd: p.root }), branch: 'tranche', pr: MAIN_PR, slug: 'o/r', io: p.io, log: quiet, ...over });

test('a tranche into main with 40 modules, each through a gated job merge, runs no suite again and names each job PR', () => {
  const p = product(40);
  const t = Date.now();
  const r = run(p);
  assert.equal(r.findings.length, 0, JSON.stringify(r.findings));
  assert.deepEqual([r.run.trigger, r.run.scope, r.run.suite, r.run.uncovered], ['code', [], 'skipped', 0]);
  assert.equal(r.run.through.length, 40);
  assert.deepEqual(r.run.through.map((x) => [x.pr, x.id, x.files]), p.ids.map((id, i) => [i + 1, id, 2]));
  // Well inside the 45 min cap: the walk and the checks, no suite.
  assert.ok(Date.now() - t < 60000);
});

test('a module file not covered by a job PR still gets its suite run', () => {
  const p = product(3);
  // A direct commit on the tranche after m1's job merge (a plain PR or a conflict resolution).
  git(['checkout', '-q', 'tranche'], { cwd: p.root });
  commit(p.root, { 'src/m1/index.mjs': 'export const x = 3;\n' });
  const r = run(p);
  assert.deepEqual(r.run.scope, ['m1']);
  assert.equal(r.run.suite, 'fail', 'm1\'s suite ran on the tranche as it is, and caught x = 3');
  assert.deepEqual(r.run.through.map((x) => x.id), ['m0', 'm1', 'm2'], 'm1\'s test file is still the job\'s');
  assert.equal(r.run.uncovered, 1);
});

test('a job PR whose gate was red at merge, or whose row is not verified, does not count', () => {
  const p = product(3, { red: ['m0'], unverified: ['m2'] });
  const r = run(p);
  assert.deepEqual(r.run.scope, ['m0', 'm2']);
  assert.equal(r.run.suite, 'pass');
  assert.deepEqual(r.run.through.map((x) => x.id), ['m1']);
});

test('a newer red row on the merged result outweighs an older green one', () => {
  const p = product(2);
  const pr = p.prs.get(1);
  const red = { sha: pr.head.sha, base: p.base, run_id: 999, trigger: 'code', scope: ['m0'], suite: 'fail', ok: false, findings: 1, verified: true };
  p.comments.get(1).push({ id: 50, body: block(GATE, { runs: [red] }), user: { login: BOT } });
  assert.deepEqual(run(p).run.scope, ['m0']);
});

test('a job merge that is not the gated merged result, or a commit that only borrows the title, does not count', () => {
  // A merge whose tree differs from the job head it names (a resolution or an extra change).
  const p = product(2);
  git(['checkout', '-q', 'tranche'], { cwd: p.root });
  git(['checkout', '-q', '-b', 'job/m0-again'], { cwd: p.root });
  const head = commit(p.root, { 'process/metrics/m0.jsonl': '{"row":"merge","pr":1}\n{"row":"note"}\n' });
  git(['checkout', '-q', 'tranche'], { cwd: p.root });
  git(['merge', '-q', '--no-ff', '--no-commit', 'job/m0-again'], { cwd: p.root });
  commit(p.root, { 'src/m0/index.mjs': 'export const x = 2; // touched in the merge\n' }, 'Merge job PR 1');
  const r = run(p);
  assert.deepEqual(r.run.scope, ['m0']);
  assert.ok(head);

  // A plain commit titled as a job merge.
  const q = product(2);
  git(['checkout', '-q', 'tranche'], { cwd: q.root });
  commit(q.root, { 'src/m1/index.mjs': 'export const x = 2; // forged\n' }, 'Merge job PR 2');
  assert.deepEqual(run(q).run.scope, ['m1']);
});

// Review 1 of PR 92: a module's gate tested it with its providers as they were at its merge.
test('a module whose provider (at any depth) changed after its job merge runs again; one merged after its providers does not', () => {
  // Jobs merge in order m0..m4. m0 uses m2, merged after m0: m0 runs. m3 uses m1, and m4 uses m3:
  // each merged after its providers, so neither runs.
  const p = product(5, { uses: { m0: ['m2'], m3: ['m1'], m4: ['m3'] } });
  assert.deepEqual(run(p).run.scope, ['m0']);
  // A provider two steps down: m0 uses m1, m1 uses m3; m3 merged after m0 and m1.
  const q = product(4, { uses: { m0: ['m1'], m1: ['m3'] } });
  assert.deepEqual(run(q).run.scope, ['m0', 'm1']);
});

test('a file in two modules\' paths is not covered by one module\'s job', () => {
  // m1's paths also hold m0's source: m0's job merge does not cover src/m0/ for m1.
  const p = product(2, { over: { m1: { paths: ['src/m1/', 'src/m0/'] } } });
  assert.deepEqual(run(p).run.scope, ['m0', 'm1']);
});

// A control: only the tranche's own pull request is judged by its job merges.
test('a pull request from any branch but the tranche runs every module it touches', () => {
  const p = product(2);
  const r = run(p, { branch: 'bob/other' });
  assert.deepEqual(r.run.scope, ['m0', 'm1']);
  assert.equal(r.run.through, undefined);
});

// The copy, 4 Nov (registers PR 86, run 41778833434; site PR 79, run 41779185745): once a job PR
// merges, GitHub lists no pull request on its gate runs. The cover binds the run to the merged PR
// by what GitHub keeps: its branch, this repository, the event, green, the PR's head (or an earlier
// commit of it), a base on the tranche, and the run's own artifact holding the same row.
import { verifyRow } from '../lib/github.mjs';
function merged(n, edit = () => {}) {
  const p = product(n);
  const runs = new Map();
  const arts = new Map();
  for (const [pr, cs] of p.comments) {
    const row = gateRunsOf(cs)[0];
    delete row.verified;
    cs[0].body = block(GATE, { runs: [row] });
    runs.set(row.run_id, { path: '.github/workflows/process-gate.yml', head_sha: row.sha, status: 'completed', conclusion: 'success', event: 'pull_request', pull_requests: [], head_branch: p.prs.get(pr).head.ref, head_repository: { full_name: 'o/r' } });
    arts.set(row.run_id, { ...row, minutes: 1 });
  }
  const live = { getRun: (s, id) => runs.get(id) || null, runArtifactRow: (s, id) => arts.get(id) || null };
  p.io.verify = (s, r, ctx) => verifyRow(s, r, ctx, live);
  edit({ p, runs, arts });
  return p;
}
const gateRunsOf = (cs) => cs.flatMap((c) => JSON.parse(c.body.match(/\{[\s\S]*\}/)[0]).runs);

test('a merged job PR whose gate run lists no pull request is covered', () => {
  const r = run(merged(3));
  assert.equal(r.findings.length, 0, JSON.stringify(r.findings));
  assert.deepEqual(r.run.scope, []);
  assert.deepEqual(r.run.through.map((x) => x.pr), [1, 2, 3]);
});

test('a run on another branch, repository, event or commit, or not green, does not cover its module', () => {
  for (const [what, change] of [
    ['another branch', (x) => { x.head_branch = 'job/m2'; }],
    ['a fork', (x) => { x.head_repository = { full_name: 'fork/r' }; }],
    ['a push', (x) => { x.event = 'push'; }],
    ['another commit', (x) => { x.head_sha = 'f'.repeat(40); }],
    ['not green', (x) => { x.conclusion = 'failure'; }],
    ['another workflow', (x) => { x.path = '.github/workflows/mine.yml'; }],
  ]) {
    const p = merged(3, ({ runs }) => change(runs.get(102)));
    assert.deepEqual(run(p).run.scope, ['m1'], what);
  }
  // A run that still lists pull requests must list this one, into the tranche.
  const q = merged(2, ({ runs }) => { runs.get(102).pull_requests = [{ number: 7, base: { ref: 'tranche' } }]; });
  assert.deepEqual(run(q).run.scope, ['m1']);
});

// Review of PR 94: a second PR from job/m1 into a branch whose own workflow is a stub could upload
// any row in a green run on the branch. While any PR from the branch is into another base, or the
// list cannot be read, the branch binds nothing.
test('a job branch that ever had a pull request into another base, or whose pull requests cannot be read, covers nothing', () => {
  const p = merged(3);
  const list = p.io.prsFromBranch;
  p.io.prsFromBranch = (s, b) => (b === 'job/m1' ? [...list(s, b), { number: 77, base: { ref: 'evil' }, head: { ref: b } }] : list(s, b));
  assert.deepEqual(run(p).run.scope, ['m1']);
  // A second PR into the tranche itself (a restarted job) is not a reason to refuse.
  p.io.prsFromBranch = (s, b) => (b === 'job/m1' ? [...list(s, b), { number: 78, base: { ref: 'tranche' }, head: { ref: b } }] : list(s, b));
  assert.deepEqual(run(p).run.scope, []);
  p.io.prsFromBranch = (s, b) => (b === 'job/m2' ? null : list(s, b));
  assert.deepEqual(run(p).run.scope, ['m2']);
  p.io.prsFromBranch = (s, b) => (b === 'job/m0' ? [] : list(s, b));
  assert.deepEqual(run(p).run.scope, ['m0'], 'a list that lacks the merged PR itself');
});

// Confirming review of PR 94: the list shows a PR's base as it is now. A PR from job/m1 opened into
// a stub's branch and then retargeted to the tranche, or a merged PR that was, covers nothing; nor
// does a PR whose history cannot be read.
test('a job branch with a pull request whose base was ever changed, or whose history cannot be read, covers nothing', () => {
  const p = merged(3);
  const list = p.io.prsFromBranch;
  p.io.prsFromBranch = (s, b) => (b === 'job/m1' ? [...list(s, b), { number: 77, base: { ref: 'tranche' }, head: { ref: b } }] : list(s, b));
  p.io.baseEverChanged = (s, x) => x === 77;
  assert.deepEqual(run(p).run.scope, ['m1'], 'a second PR retargeted to the tranche');
  p.io.baseEverChanged = (s, x) => x === 3;
  assert.deepEqual(run(p).run.scope, ['m2'], 'the merged PR itself retargeted');
  p.io.baseEverChanged = (s, x) => (x === 1 ? null : false);
  assert.deepEqual(run(p).run.scope, ['m0'], 'an unread history');
  p.io.baseEverChanged = () => false;
  assert.deepEqual(run(p).run.scope, []);
});

test('a row whose fields do not match the PR, the module or its artifact does not cover it', () => {
  const swap = (p, pr, f) => {
    const cs = p.comments.get(pr);
    const row = f(gateRunsOf(cs)[0]);
    cs[0].body = block(GATE, { runs: [row] });
  };
  // A base that is not on the tranche (another branch's commit).
  // The run's artifact agrees: only the base's place in history refuses it.
  const p = merged(3, ({ p, arts }) => {
    git(['checkout', '-q', '-b', 'side', p.base], { cwd: p.root });
    const off = commit(p.root, { 'side.txt': 'x' });
    git(['checkout', '-q', 'tranche'], { cwd: p.root });
    swap(p, 2, (r) => ({ ...r, base: off }));
    arts.get(102).base = off;
  });
  assert.deepEqual(run(p).run.scope, ['m1'], 'base off the tranche');
  // The artifact ran another module than the comment claims.
  const q = merged(3, ({ arts }) => { arts.get(102).scope = ['m0']; });
  assert.deepEqual(run(q).run.scope, ['m1'], 'scope differs from the artifact');
});

test('a merged PR whose newest row stands on an earlier green run of the PR is covered only when that run is the PR\'s', () => {
  const build = (afterOf) => merged(2, ({ p, runs, arts }) => {
    const head = p.prs.get(2).head.sha;
    const earlier = afterOf(p, head);
    const code = { sha: earlier, base: gateRunsOf(p.comments.get(2))[0].base, run_id: 300, trigger: 'code', scope: ['m1'], suite: 'pass', ok: true, findings: 0 };
    const rec = { ...gateRunsOf(p.comments.get(2))[0], run_id: 301, trigger: 'record-since-green', after: earlier, scope: undefined, suite: 'skipped' };
    delete rec.scope;
    p.comments.set(2, [{ id: 1, body: block(GATE, { runs: [code] }), user: { login: BOT } }, { id: 2, body: block(GATE, { runs: [rec] }), user: { login: BOT } }]);
    for (const r of [code, rec]) {
      runs.set(r.run_id, { ...runs.get(102), head_sha: r.sha });
      arts.set(r.run_id, { ...r });
    }
  });
  assert.deepEqual(run(build((p, head) => git(['rev-parse', `${head}^`], { cwd: p.root }))).run.scope, [], 'the job\'s own earlier commit');
  assert.deepEqual(run(build((p) => {
    git(['checkout', '-q', '-b', 'elsewhere', p.base], { cwd: p.root });
    const c = commit(p.root, { 'src/m1/index.mjs': 'export const x = 2;\n' });
    git(['checkout', '-q', 'tranche'], { cwd: p.root });
    return c;
  })).run.scope, ['m1'], 'a commit not on the PR');
});

test('an expired gate-row artifact makes that module run its suite', () => {
  const p = merged(3, ({ arts }) => { arts.delete(103); });
  const r = run(p);
  assert.deepEqual(r.run.scope, ['m2']);
  assert.equal(r.run.suite, 'pass');
  assert.deepEqual(r.run.through.map((x) => x.pr), [1, 2]);
});

// The tranche into main (build/main-gate-2): the gate workflow's pin step, run as the workflow
// runs it. The tranche's pin judges only when process3's own main or tranche shows it descends
// from main's; anything else keeps the base's pin.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const SHIM = readFileSync(join(import.meta.dirname, '..', '..', 'shims', 'process-gate.yml'), 'utf8');
const pinStep = () => {
  const gateJob = SHIM.slice(SHIM.indexOf('\n  gate:\n'), SHIM.indexOf('\n  post:\n'));
  const step = gateJob.slice(gateJob.indexOf("- name: the base's process pin"));
  const lines = step.slice(step.indexOf('run: |\n') + 7).split('\n');
  const body = [];
  for (const l of lines) { if (l.trim() && !l.startsWith('          ')) break; body.push(l.slice(10)); }
  return body.join('\n');
};
function pinWorld() {
  // process3: main at a; tranche at b (after a); a side branch at s (after b), never merged.
  const proc = makeRepo({ 'tool/p3.mjs': '1' });
  const a = git(['rev-parse', 'HEAD'], { cwd: proc });
  git(['checkout', '-q', '-b', 'tranche'], { cwd: proc });
  const b = commit(proc, { 'tool/p3.mjs': '2' });
  git(['checkout', '-q', '-b', 'side'], { cwd: proc });
  const s = commit(proc, { 'tool/p3.mjs': 'weak' });
  git(['checkout', '-q', '-b', 'other', a], { cwd: proc });
  const o = commit(proc, { 'tool/p3.mjs': 'other' });
  git(['checkout', '-q', 'main'], { cwd: proc });
  // The product: main pins a; the tranche pins whatever the case says.
  const prod = makeRepo({ 'process/config.json': JSON.stringify({ tranche: 'tranche', process_repo: `file://${proc}` }) });
  const pinTo = (sha) => { git(['update-index', '--add', '--cacheinfo', `160000,${sha},.process`], { cwd: prod }); git(['commit', '-q', '-m', `pin ${sha.slice(0, 7)}`], { cwd: prod }); return git(['rev-parse', 'HEAD'], { cwd: prod }); };
  const base = pinTo(a);
  const head = (sha) => { git(['checkout', '-q', '-B', 'tranche', base], { cwd: prod }); return pinTo(sha); };
  return { proc, prod, a, b, s, o, base, head };
}
function judgedBy(w, headSha, env = {}) {
  const tmp = mkdtempSync(join(tmpdir(), 'p3-pin-'));
  const out = join(tmp, 'out');
  writeFileSync(out, '');
  const script = join(tmp, 'pin.sh');
  writeFileSync(script, pinStep());
  execFileSync('bash', ['--noprofile', '--norc', '-eo', 'pipefail', script], { cwd: w.prod, stdio: 'pipe', env: { ...process.env, RUNNER_TEMP: tmp, GITHUB_OUTPUT: out, BASE: w.base, HEAD_SHA: headSha, HEAD_REF: 'tranche', BASE_REF: 'main', DEFAULT_BRANCH: 'main', SAME_REPO: 'true', ...env } });
  return git(['rev-parse', 'HEAD'], { cwd: join(tmp, 'process3') });
}

test('the tranche into main is judged by the tranche\'s pin only when process3\'s main or tranche shows it descends from main\'s', () => {
  const w = pinWorld();
  const later = w.head(w.b);
  assert.equal(judgedBy(w, later), w.b, 'a later pin on process3\'s tranche');
  for (const [what, env] of [
    ['another branch into main', { HEAD_REF: 'bob/x' }],
    ['the tranche into another base', { BASE_REF: 'release', DEFAULT_BRANCH: 'main' }],
    ['a fork', { SAME_REPO: 'false' }],
  ]) assert.equal(judgedBy(w, later, env), w.a, what);
  assert.equal(judgedBy(w, w.head(w.s)), w.a, 'a descendant only on a process3 side branch');
  // A pin on process3's main only (the tranche was deleted or moved on elsewhere).
  git(['checkout', '-q', 'main'], { cwd: w.proc });
  git(['merge', '-q', '--ff-only', 'side'], { cwd: w.proc });
  git(['branch', '-q', '-f', 'tranche', w.a], { cwd: w.proc });
  assert.equal(judgedBy(w, w.head(w.s)), w.s, 'a descendant on process3\'s main');
  assert.equal(judgedBy(w, w.head(w.o)), w.a, 'a pin on another line, not after main\'s');
  assert.equal(judgedBy(w, w.head('e'.repeat(40))), w.a, 'a pin process3 does not have');
  // An older pin than main's: main pins b; the tranche, cut before, still pins a.
  const v = pinWorld();
  const older = v.head(v.s); // any commit: then the tranche goes back to pinning a
  git(['checkout', '-q', '-B', 'tranche', older], { cwd: v.prod });
  git(['update-index', '--add', '--cacheinfo', `160000,${v.a},.process`], { cwd: v.prod });
  git(['commit', '-q', '-m', 'back to a'], { cwd: v.prod });
  const tip = git(['rev-parse', 'HEAD'], { cwd: v.prod });
  git(['checkout', '-q', '-B', 'main', v.base], { cwd: v.prod });
  git(['update-index', '--add', '--cacheinfo', `160000,${v.b},.process`], { cwd: v.prod });
  git(['commit', '-q', '-m', 'main at b'], { cwd: v.prod });
  v.base = git(['rev-parse', 'HEAD'], { cwd: v.prod });
  assert.equal(judgedBy(v, tip), v.b, 'an older pin never judges');
});

// ===== file: branches.mjs =====

// branches prune (Bob, 5 Nov ~18:02: "The leftover branches issue should be something we setup to
// run regularly rather than something I need to kick start over and over"): the scheduled cleanup
// of a product's leftover branches, run by the shim process-branch-prune.yml on the default
// branch, daily and on dispatch. It deletes nothing until Bob's approvals allow it.
//
// The approval gate (fails closed). The standing approvals say sessions "may never ... delete a
// branch". This command deletes only while the approvals block (process/config.json approvals:
// its file and heading) on the run's branch (the default branch, or the tranche for a run
// dispatched there), as origin holds it, carries MARKER, the fixed
// phrase "the process's scheduled branch cleanup workflow", anywhere in the block; whitespace runs
// and curly apostrophes are read as one space and a straight apostrophe, nothing else is forgiven
// (not case). The phrase anywhere else in the file is no approval. A delete
// runs only in the product's own shim, on the default branch or dispatched on the tranche
// (notTheShim); --dry-run anywhere. Without it the run prints a notice, deletes nothing and writes
// nothing. --dry-run reads and prints all the same, approved or not, and writes nothing.
//
// What it deletes, each judged on a fresh fetch of every origin branch:
//   (a) in-tranche: a branch with no commit the tranche lacks (git rev-list --count
//       <tranche>..<branch> is 0, counted locally in a full clone: one compare call per branch
//       would spend most of the workflow token's 1000 requests an hour on the copy's 835 branches);
//   (b) train-head-closed: the merge train's train/head/<pr>-<seq> branch whose pull requests (from
//       this repository; at least one) are all closed, merged or not.
// What it never deletes (keep, checked before either rule):
//   protected: the default branch, main, the tranche (config's and "tranche"), process-state and the
//     config's state_branch;
//   open-pr: the head or the base of any open pull request;
//   recent: a branch whose tip, or (rule b) any commit the tranche lacks, has a committer or author
//     date in the last RECENT_HOURS, or that GitHub's activity log shows pushed or created then
//     (a branch cut from an old tranche tip a minute ago has no new commit, but is new);
//   ahead: any other branch with a commit the tranche lacks.
// Each delete is conditional on the tip it was judged at (git push --force-with-lease=<ref>:<sha>
// with an empty source: a delete, never a rewrite; a branch moved since is refused and kept), and
// what was deleted is read back from origin (ls-remote) afterwards, never assumed. One row per
// approved run, dry runs aside, appended to the state branch's branches/prune.jsonl: the counts,
// and every deleted branch's name, tip and rule (a deleted tip can be pushed back from its sha).
import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { approvalsBlock } from './record.mjs';
import { writeState } from './state.mjs';
import { DEFAULTS, exists, fail, fetchRetry, gh, git, isShallow, loadConfig, now } from './util.mjs';

// Bob's sentence for the approvals block, as the coordinator relayed it (5 Nov 18:20). The gate
// matches MARKER, a fixed phrase of it; the keep rules below are the sentence's, and are the limit.
export const APPROVAL = 'One exception to the paragraph above: the process\'s scheduled branch cleanup workflow, running in those GitHub repositories, may delete branches whose commits are all in the tranche, and the merge train\'s train/head/* branches whose pull request is closed; never main, the tranche or the state branch, a branch with an open pull request, or one with a commit in the last 2 hours.';
export const MARKER = 'the process\'s scheduled branch cleanup workflow';
export const RECENT_HOURS = 2;
export const TRAIN_HEAD = 'train/head/';
export const PRUNE_FILE = 'branches/prune.jsonl';
export const DELETE_BATCH = 100;
const PUSH_TRIES = 3;

const norm = (t) => String(t).replace(/[‘’ʼ]/g, '\'').replace(/\s+/g, ' ').trim();
// Whether an approvals block carries the marker phrase (coordinator's check audit, 5 Nov 19:30: a substring match; the keep
// rules below are the real limit, whatever the sentence around it says).
export function approves(block) {
  return !!block && norm(block).includes(norm(MARKER));
}

// Only the product's own shim deletes (cold review of PR 167: a session's local run, or a dispatch
// on a branch whose pin it chose, must not): scheduled or dispatched on the default branch, or
// dispatched on the tranche (coordinator, 5 Nov 18:28: main moves only at a round close, and the
// tranche's workflow files change only through the gated merge tool). Read from the runner's
// environment; null when it is such a run on branch `on`, else why not. A guard against a
// mistaken run, not a security boundary: a local shell can set these variables. The boundary is
// Bob's sentence in the approvals block and the standing rule that sessions never delete branches.
export const SHIM_FILE = '.github/workflows/process-branch-prune.yml';
export function notTheShim(env, on, { dispatchOnly = false } = {}) {
  const events = dispatchOnly ? ['workflow_dispatch'] : ['schedule', 'workflow_dispatch'];
  if (env.GITHUB_ACTIONS !== 'true') return 'it is not a GitHub Actions run';
  if (!events.includes(env.GITHUB_EVENT_NAME)) return `its event is ${env.GITHUB_EVENT_NAME || 'unset'}, not ${events.join(' or ')}`;
  if (env.GITHUB_REF !== `refs/heads/${on}`) return `it runs on ${env.GITHUB_REF || 'no ref'}, not refs/heads/${on}`;
  if (!String(env.GITHUB_WORKFLOW_REF || '').endsWith(`/${SHIM_FILE}@refs/heads/${on}`)) return `its workflow is ${env.GITHUB_WORKFLOW_REF || 'unset'}, not ${SHIM_FILE} on ${on}`;
  return null;
}

const remote = (b) => `refs/remotes/origin/${b}`;
const isServerError = (s) => /(?:error|HTTP(?:\/[\d.]+)?(?: code)?)[: ]+5\d\d\b|Internal Server Error|Bad Gateway|Service Unavailable|Gateway Time-?out|unexpected disconnect|RPC failed/i.test(s);

// The GitHub reads, each null when unreadable. read: gh's call, for the tests.
export function githubIO(read = (args) => gh(args, { allowFail: true })) {
  const pages = (path) => { const p = read(['api', '--paginate', '--slurp', path]); return Array.isArray(p) && p.every(Array.isArray) ? p.flat() : null; };
  return {
    defaultBranch: (slug) => read(['api', `repos/${slug}`])?.default_branch || null,
    pulls: (slug) => pages(`repos/${slug}/pulls?state=all&per_page=100`),
    openPulls: (slug) => pages(`repos/${slug}/pulls?state=open&per_page=100`),
    activity: (slug) => pages(`repos/${slug}/activity?time_period=day&per_page=100`),
  };
}

// One push of deletes, each with its lease; git's own result. push: for the tests.
const gitPush = (root, args) => git(['push', '--porcelain', ...args], { cwd: root, allowFail: true });

export function prune(root, { slug, dryRun = false, ref, run, io = githubIO(), push = gitPush, clock = Date.now, env = process.env, log = console.log } = {}) {
  if (!slug) fail('branches prune needs the repository (owner/name)');
  const def = io.defaultBranch(slug);
  if (!def) fail(`could not read ${slug}'s default branch from GitHub; nothing was deleted`);
  if (isShallow(root)) fail('branches prune needs a full clone (fetch-depth 0): a shallow one counts commits wrongly; nothing was deleted');
  const f = fetchRetry(['fetch', '-q', '--prune', 'origin', '+refs/heads/*:refs/remotes/origin/*'], { cwd: root });
  if (f.code !== 0) fail(`could not fetch origin's branches: ${f.stderr.trim()}; nothing was deleted`);
  if (git(['rev-parse', '-q', '--verify', remote(def)], { cwd: root, allowFail: true }).code !== 0) fail(`origin has no ${def}; nothing was deleted`);
  // The tranche's name from the default branch's config (anchored there), never from the run's ref.
  const defCfg = loadConfig(root, remote(def));
  const tranche = defCfg.tranche;

  // The branch the run stands on, which gives the config and the approvals: the default branch,
  // or the tranche for a run dispatched there. A dry run on any other ref (or none) reads the
  // default branch; a deleting run anywhere else, or outside the shim, is refused.
  const on = ref === `refs/heads/${tranche}` ? tranche : def;
  if (!dryRun) {
    if (ref !== `refs/heads/${on}`) fail(`branches prune deletes only from a run on ${def} or ${tranche}, not ${ref === undefined ? 'a run with no --ref' : ref}; nothing was deleted (--dry-run lists)`);
    const why = notTheShim(env, on, { dispatchOnly: on !== def });
    if (why) fail(`branches prune deletes only in the product's ${SHIM_FILE} ${on === def ? `on ${def}` : `dispatched on ${tranche}`}, and ${why}; nothing was deleted (--dry-run lists)`);
  }
  const base = remote(on);
  if (git(['rev-parse', '-q', '--verify', base], { cwd: root, allowFail: true }).code !== 0) fail(`origin has no ${on}; nothing was deleted`);
  const baseSha = git(['rev-parse', base], { cwd: root });
  const cfg = loadConfig(root, base);
  if (cfg.tranche !== tranche) fail(`${on}'s config names the tranche ${cfg.tranche}, ${def}'s names ${tranche}; nothing was deleted`);
  // state_branch is not anchored: a tranche run whose config names another state branch is refused.
  if (cfg.state_branch !== defCfg.state_branch) fail(`${on}'s config names the state branch ${cfg.state_branch}, ${def}'s names ${defCfg.state_branch}; nothing was deleted`);

  // The gate: Bob's sentence in the approvals block on that branch's tip.
  const { file, heading } = cfg.approvals;
  const block = exists(root, base, file) ? approvalsBlock(git(['show', `${base}:${file}`], { cwd: root }), heading) : '';
  const approved = approves(block);
  if (!approved) {
    const why = `the approvals block (${file}, "${heading}") on ${on} at ${baseSha.slice(0, 10)} does not carry the branch cleanup approval ("${MARKER}"); nothing ${dryRun ? 'would be' : 'was'} deleted`;
    if (!dryRun) { log(`::notice::branches prune: ${why}`); return { ok: true, approved: false, dryRun, deleted: [], failed: [], kept: {}, candidates: [] }; }
    log(`branches prune (dry run): ${why}; the branches the rules would delete once approved follow`);
  }

  if (git(['rev-parse', '-q', '--verify', remote(tranche)], { cwd: root, allowFail: true }).code !== 0) fail(`origin has no ${tranche}, the tranche the config names; nothing was deleted`);
  const trancheSha = git(['rev-parse', remote(tranche)], { cwd: root });

  const pulls = io.pulls(slug);
  if (!pulls) fail(`could not read ${slug}'s pull requests; nothing was deleted`);
  const activity = io.activity(slug);
  if (!activity) fail(`could not read ${slug}'s activity log; nothing was deleted`);

  const cutoff = clock() - RECENT_HOURS * 3600 * 1000;
  const protectedNames = new Set([def, 'main', tranche, DEFAULTS.tranche, DEFAULTS.state_branch, cfg.state_branch]);
  const openRefs = new Set(pulls.filter((p) => p.state === 'open').flatMap((p) => [p.head?.ref, p.base?.ref]).filter(Boolean));
  const own = new Map();
  for (const p of pulls) {
    if (p.head?.repo?.full_name !== slug || !p.head?.ref) continue;
    if (!own.has(p.head.ref)) own.set(p.head.ref, []);
    own.get(p.head.ref).push(p);
  }
  // An entry whose time cannot be read counts as recent (fails closed).
  const recentRefs = new Set(activity
    .filter((e) => /^refs\/heads\//.test(String(e?.ref)) && !(Date.parse(e.timestamp) < cutoff))
    .map((e) => e.ref.slice('refs/heads/'.length)));

  const listed = git(['for-each-ref', '--format=%(refname)%00%(objectname)%00%(committerdate:unix)%00%(authordate:unix)', 'refs/remotes/origin/'], { cwd: root });
  const branches = listed.split('\n').filter(Boolean).map((l) => {
    const [r, sha, c, a] = l.split('\0');
    return { name: r.slice('refs/remotes/origin/'.length), sha, newest: Math.max(Number(c) || 0, Number(a) || 0) * 1000 };
  }).filter((b) => b.name !== 'HEAD');

  const kept = { protected: [], 'open-pr': [], recent: [], ahead: [] };
  const candidates = [];
  for (const b of branches) {
    // A layer branch (layer/<n>, the shared layer branch) is cut from the tranche tip with no commit
    // of its own until a publish lands, so rule (a) would take it: kept whatever its commits.
    if (protectedNames.has(b.name) || /^layer\/\d+$/.test(b.name)) { kept.protected.push(b.name); continue; }
    if (openRefs.has(b.name)) { kept['open-pr'].push(b.name); continue; }
    // A branch at the tranche's tip may have been cut a minute ago with no commit of its own; the
    // activity log is its only other witness, so it is kept as recent too.
    if (b.newest >= cutoff || recentRefs.has(b.name) || b.sha === trancheSha) { kept.recent.push(b.name); continue; }
    const n = git(['rev-list', '--count', `${remote(tranche)}..${remote(b.name)}`], { cwd: root, allowFail: true });
    if (n.code !== 0) fail(`could not count ${b.name}'s commits against ${tranche}: ${n.stderr.trim()}; nothing was deleted`);
    if (Number(n.stdout) === 0) { candidates.push({ name: b.name, sha: b.sha, why: 'in-tranche' }); continue; }
    const prs = own.get(b.name) || [];
    if (b.name.startsWith(TRAIN_HEAD) && prs.length && prs.every((p) => p.state === 'closed')) {
      const dates = git(['log', '--format=%ct %at', `${remote(tranche)}..${remote(b.name)}`], { cwd: root }).split(/\s+/).filter(Boolean).map(Number);
      if (Math.max(0, ...dates) * 1000 >= cutoff) { kept.recent.push(b.name); continue; }
      candidates.push({ name: b.name, sha: b.sha, why: 'train-head-closed' });
      continue;
    }
    kept.ahead.push(b.name);
  }

  const counts = Object.fromEntries(Object.entries(kept).map(([k, v]) => [k, v.length]));
  const label = dryRun ? 'would delete' : 'deleting';
  log(`branches prune${dryRun ? ' (dry run)' : ''}: ${branches.length} branches on origin; ${candidates.length} to delete (${candidates.filter((c) => c.why === 'in-tranche').length} in ${tranche}, ${candidates.filter((c) => c.why === 'train-head-closed').length} closed train heads); kept ${Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(', ')}`);
  for (const c of candidates) log(`  ${label} ${c.name} at ${c.sha.slice(0, 10)} (${c.why})`);
  if (dryRun) return { ok: true, approved, dryRun, deleted: [], failed: [], kept: counts, candidates };

  // The deletes, each leased to the tip judged above, in batches; a server error retries the batch.
  // The open pull requests are read again before each batch: one opened since the judgement (its
  // head or base a candidate) keeps that branch; an unreadable read deletes no more.
  for (let i = 0; i < candidates.length; i += DELETE_BATCH) {
    const open = io.openPulls(slug);
    if (!open) { log('the open pull requests could not be read again; no further branch is deleted'); break; }
    const nowOpen = new Set(open.flatMap((p) => [p.head?.ref, p.base?.ref]).filter(Boolean));
    const batch = candidates.slice(i, i + DELETE_BATCH).filter((c) => !nowOpen.has(c.name));
    if (!batch.length) continue;
    const args = [...batch.map((c) => `--force-with-lease=refs/heads/${c.name}:${c.sha}`), 'origin', ...batch.map((c) => `:refs/heads/${c.name}`)];
    for (let t = 1; t <= PUSH_TRIES; t++) {
      const r = push(root, args);
      if (r.code === 0 || !isServerError(`${r.stderr}\n${r.stdout}`)) break;
      if (t < PUSH_TRIES) log(`the delete push hit a server error; trying again (${t + 1} of ${PUSH_TRIES})`);
    }
  }

  // What origin holds now: a candidate still there was not deleted (moved, protected or failed).
  let left = null;
  for (let t = 1; t <= PUSH_TRIES && left === null; t++) {
    const r = git(['ls-remote', '--heads', 'origin'], { cwd: root, allowFail: true });
    if (r.code === 0) left = new Set(r.stdout.split('\n').filter(Boolean).map((l) => l.split('\t')[1]?.slice('refs/heads/'.length)));
  }
  if (left === null) fail('could not read origin\'s branches back after the deletes; the run\'s row is not written');
  const deleted = candidates.filter((c) => !left.has(c.name));
  const failed = candidates.filter((c) => left.has(c.name)).map((c) => c.name);
  for (const n of failed) log(`  not deleted: ${n} (moved since it was judged, protected, or the push failed)`);
  log(`branches prune: ${deleted.length} deleted, ${failed.length} not deleted`);

  const row = {
    at: now(), row: 'prune', ...(run ? { run: String(run) } : {}), default_branch: def, on, at_sha: baseSha, tranche, tranche_sha: trancheSha,
    branches: branches.length, kept: counts, deleted: deleted.map(({ name, sha, why }) => ({ name, sha, why })), failed,
  };
  writeState(root, cfg.state_branch, `branches prune: ${deleted.length} deleted`, (wt) => {
    const p = join(wt, PRUNE_FILE);
    mkdirSync(dirname(p), { recursive: true });
    appendFileSync(p, JSON.stringify(row) + '\n');
  });
  log(`row written to ${cfg.state_branch}:${PRUNE_FILE}`);
  // A branch moved since it was judged is kept, rightly; only a run that deleted none of its
  // candidates is red (a token without contents: write, or a ruleset that refuses every delete).
  return { ok: !failed.length || deleted.length > 0, approved, dryRun, deleted, failed, kept: counts, candidates };
}

// ===== file: lead.test.mjs =====

// The lead times' findings from the review of PR 70's last fix pass (b33cbd9): each scenario
// below hid an "over" or invented one before its fix.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { commit, makeRepo, onState } from './helpers.mjs';
import { fetchJobs, leadTimes, median } from '../lib/lead.mjs';
import { trancheReport } from '../lib/report.mjs';
import { readState } from '../lib/state.mjs';
import { git, loadConfig } from '../lib/util.mjs';
import { main } from '../p3.mjs';

const U = 'unmeasured';
const pick = ({ minutes, target, mark }) => ({ minutes, target, ...(mark ? { mark } : {}) });
const T0 = Date.parse('2026-11-01T00:00:00Z');
const t = (min) => new Date(T0 + min * 60000).toISOString();
const at = (min, fn) => { const e = { ...process.env }; process.env.GIT_COMMITTER_DATE = process.env.GIT_AUTHOR_DATE = t(min); try { return fn(); } finally { process.env = e; } };
const E = (id, state, more = {}) => ({ [`process/ledger/${id}.json`]: { id, status: { state, ...(state === 'BLOCKED' ? { reason: 'x' } : {}) }, ...more } });
const start = (m, min, attempt) => ({ at: t(min), module: m, row: 'attempt', event: 'start', ...(attempt ? { attempt } : {}) });
const complete = (m, min, pr, attempt) => ({ at: t(min), module: m, row: 'attempt', event: 'complete', pr, ...(attempt ? { attempt } : {}) });
const merge = (m, min, pr) => ({ at: t(min), module: m, row: 'merge', pr });
const opened = (min = 0) => [{ row: 'grant', tranche: 'tranche', at: t(min), outcome: 'ok' }];

function withOrigin() {
  const root = at(-100000, () => makeRepo({ 'README.md': 'x', 'CLAUDE.md': 'Bob\'s approvals\n', 'process/config.json': { tranche: 'tranche' } }));
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
