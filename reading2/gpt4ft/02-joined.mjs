// ===== file: workflow-limits.mjs (continued) =====

      const bp = isMap(bj) && 'permissions' in bj ? perms(bj.permissions, `the base's job ${k}`) : bTop;
      const w = wider(bp, hp);
      if (w) return bad('L2', (isMap(hj) && lineOf(hj, 'permissions')) || lineOf(hJobs, k), `job ${k}: ${w}`);
      if (base === null && hp && grantsWrite(hp)) return bad('L2', lineOf(hJobs, k), `job ${k} of a new workflow grants write permissions`);
    }
  } catch (e) { return bad('L2', null, e.message); }

  // L3
  if (!isText(H.on) && !Array.isArray(H.on) && !isMap(H.on)) return bad('reading', lineOf(H, 'on'), 'it has no `on` this reader reads');
  const was = new Set(events(B.on));
  for (const e of ['pull_request_target', 'workflow_run']) if (events(H.on).includes(e) && !was.has(e)) return bad('L3', lineOf(H, 'on'), `it adds the ${e} trigger`);

  // L5
  const requiredJobs = Object.keys(bJobs).filter((k) => matchesRequired(jobNames(k, bJobs[k]), required));
  if (requiredJobs.length) {
    for (const k of ['env', 'defaults']) if (!same(B[k], H[k])) return bad('L5', lineOf(H, k), `it changes the workflow's ${k}, and the workflow holds the required job ${requiredJobs.join(', ')}`);
    for (const k of requiredJobs) {
      const r = keepsChecks(bJobs[k], hJobs[k], k, lineOf(hJobs, k), H);
      if (r) return bad('L5', r.line, r.why);
    }
  }
  return { ok: true, limits: ['L1', 'L2', 'L3', 'L5'], required: requiredJobs };
}

// The refusal's words: the limit, the line, why, and that the owner decides past them.
export const OUTSIDE = 'a workflow change outside the owner\'s limits needs the owner\'s word: bring it to Bob';
export const refusal = (path, r) => `${path}: ${r.limit}${r.line ? ` (line ${r.line})` : ''}: ${r.why}`;

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

// ===== file: session-call.test.mjs =====

// C42 (BD-R2, Bob 8 Nov; PD-13): every session the tool starts is started with one repository.
// Each create_session call it prints is built by sessionCall and checked by checkCall; no other
// file writes a source_url; start check warns when the session looks started with more than one;
// the coordinator's prompt carries the rule.
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { coordinatorPrompt } from '../lib/roles.mjs';
import { workdirLines } from '../lib/start.mjs';
import { checkCall, git, sessionCall } from '../lib/util.mjs';
import './helpers.mjs';

const LIB = join(dirname(fileURLToPath(import.meta.url)), '..', 'lib');

test('session call (C42): one repository by source_url, keys in the order the tool printed them', () => {
  const c = sessionCall({ slug: 'acme/app', revision: 'abc', title: 'BOB', prompt: 'p', model: 'm', clone: { clone_depth: 1 } });
  assert.deepEqual(Object.keys(c), ['title', 'source_url', 'source_revision', 'clone_depth', 'model', 'prompt']);
  assert.equal(c.source_url, 'https://github.com/acme/app');
  const bare = sessionCall({ slug: 'acme/app', revision: 'tranche', title: 't', prompt: 'p' });
  assert.deepEqual(bare, { title: 't', source_url: 'https://github.com/acme/app', source_revision: 'tranche', prompt: 'p' });
  // A product's clone settings never replace the call's own keys (cold review).
  const swapped = sessionCall({ slug: 'acme/app', revision: 'tip', title: 't', prompt: 'p', clone: { clone_depth: 1, source_url: 'https://github.com/x/y', source_revision: 'old', title: 'x', prompt: 'x' } });
  assert.deepEqual(swapped, { title: 't', source_url: 'https://github.com/acme/app', source_revision: 'tip', clone_depth: 1, prompt: 'p' });
  assert.throws(() => sessionCall({ slug: 'acme/app', revision: 'r', title: 't', prompt: 'p', clone: { sources: ['a/b'] } }), /was not printed: one repository per session/);
  for (const slug of ['acme', 'acme/app/x', '', null]) assert.throws(() => sessionCall({ slug, revision: 'r', title: 't', prompt: 'p' }), /one repository as <owner>\/<repo>/);
});

test('session call (C42): checkCall refuses a second repository in any form, citing BD-R2 and PD-13', () => {
  const ok = { title: 't', source_url: 'https://github.com/a/b', source_revision: 'r', prompt: 'p' };
  assert.equal(checkCall(ok), ok);
  for (const extra of [{ sources: [{ url: 'https://github.com/a/c' }] }, { repositories: ['a/c'] }, { repo: 'a/c' }, { extra_source_url: 'https://github.com/a/c' }, { source_urls: ['x'] }]) {
    assert.throws(() => checkCall({ ...ok, ...extra }), /was not printed: one repository per session \(BD-R2; PD-13/, JSON.stringify(extra));
  }
  for (const source_url of [['https://github.com/a/b', 'https://github.com/a/c'], 'https://github.com/a/b https://github.com/a/c', 'https://github.com/a/b,a/c', 'https://example.com/a/b', 'https://github.com/a', undefined]) {
    assert.throws(() => checkCall({ ...ok, source_url }), /names exactly one repository/, JSON.stringify(source_url));
  }
  // Session options that carry no repository pass, so a product's clone settings keep working;
  // the key test is anchored, so a word that merely holds "source" or "repo" passes.
  assert.ok(checkCall({ ...ok, clone_depth: 1, blob_limit_kb: 100, sparse_checkout_paths: ['src'], model: 'm', resources: 1, reporter: 'x' }));
});

test('session call (C42): no tool file builds a create_session call but util.mjs, so none bypasses checkCall', () => {
  // Every tool file (lib and the entry points), the key written out, quoted or as a shorthand.
  const found = [];
  const TOOL = join(LIB, '..');
  const files = [...readdirSync(LIB).filter((n) => n.endsWith('.mjs') && n !== 'util.mjs').map((n) => join(LIB, n)), ...readdirSync(TOOL).filter((n) => n.endsWith('.mjs')).map((n) => join(TOOL, n))];
  for (const f of files) {
    readFileSync(f, 'utf8').split('\n').forEach((l, i) => { if (/\bsource_url\s*[:,}]|['"]source_url['"]\s*:|\[\s*['"`]source_url|\bsources\s*:/.test(l)) found.push(`${f.slice(TOOL.length + 1)}:${i + 1}`); });
  }
  assert.ok(files.some((f) => f.endsWith('p3.mjs')), 'the entry point is read');
  assert.deepEqual(found, [], 'build each create_session call with sessionCall');
  // Each start site the design note lists uses it.
  for (const f of ['roles.mjs', 'job.mjs', 'lane.mjs', 'pin.mjs', 'tranche.mjs', 'measures.mjs']) assert.match(readFileSync(join(LIB, f), 'utf8'), /sessionCall\(\{/, f);
});

test('session call (C42): lane start takes the product\'s clone settings, as every other start does', () => {
  assert.match(readFileSync(join(LIB, 'lane.mjs'), 'utf8'), /sessionCall\(\{ slug: s, revision: tranche, title: `lane \$\{l\.name\}`, prompt, model, clone: cfg\.clone \}\)/);
});

test('coordinator prompt (C42): it works in process3 only and acts on a product only through a session started there', () => {
  const text = coordinatorPrompt({ slug: 'acme/app', processSlug: 'acme/process3', rootId: 'session_R', old: 'session_O', branch: 'coord', handoff: 'notes/h.md' });
  assert.match(text, /4\. You work in acme\/process3 only \(BD-R2; PD-13\)\. You act on a product only through a session started in its repository \(its BOB, or a short session\), relaying Bob's words quoted and dated; never add a product repository here\./);
  assert.match(text, /So too your id as `coordinator` in another product's process\/config\.json \(the probe\)/);
  assert.doesNotMatch(text, /On each other product you hold/, 'no act of its own on a product');
});

test('start check (C42): warns when the root\'s parent holds several checkouts, or the project directory is outside the root', () => {
  const parent = mkdtempSync(join(tmpdir(), 'p3-multi-'));
  const mk = (n) => { const d = join(parent, n); mkdirSync(d); git(['init', '-q'], { cwd: d }); return d; };
  const a = mk('alpha');
  assert.deepEqual(workdirLines(a, { env: {} }), [], 'one checkout: nothing said');
  mkdirSync(join(parent, 'notes'));
  assert.deepEqual(workdirLines(a, { env: {} }), [], 'a plain folder beside it is not a checkout');
  mk('beta');
  const [line] = workdirLines(a, { env: {} });
  assert.match(line, /^working directory: 2 repositories at .* \(alpha, beta\): this session looks started with more than one.*\(PD-13\)\. Work in alpha only.*\(BD-R2\)$/);
  // The project directory Claude Code names.
  const solo = mkdtempSync(join(tmpdir(), 'p3-solo-'));
  const s = join(solo, 'only');
  mkdirSync(join(s, 'sub'), { recursive: true }); git(['init', '-q'], { cwd: s });
  assert.deepEqual(workdirLines(s, { env: { CLAUDE_PROJECT_DIR: s } }), []);
  assert.deepEqual(workdirLines(s, { env: { CLAUDE_PROJECT_DIR: join(s, 'sub') } }), [], 'inside the root');
  const [out] = workdirLines(s, { env: { CLAUDE_PROJECT_DIR: solo } });
  assert.match(out, /^working directory: the session's project directory .* is not inside .*only, the repository it works in: start each session with that one repository \(BD-R2\)/);
  assert.deepEqual(workdirLines(s, { env: { CLAUDE_PROJECT_DIR: `${s}-other` } }).length, 1, 'a sibling whose name starts the same is outside');
});

// ===== file: review.mjs =====

// review brief <pr> [--scope "<text>"]: the fresh-context brief a reviewer subagent is given,
// filled from the pull request (Phase 2 build N). Prints only; writes nothing.
import { comments, getPR, latestReceipt } from './github.mjs';
import { branchModule, ledgerIds } from './ledger.mjs';
import { generatedRows } from './checks.mjs';
import { rulebook } from './job.mjs';
import { normPath } from './suite.mjs';
import { ASSERT_RULE, reviewTriggers } from './triggers.mjs';
import { fail, gh, git, loadConfig, repoSlug, underPath } from './util.mjs';

// The files whose change earns a second review: the gate, the record check, the approvals
// check and the merge tool, with the workflows that run them.
export const SECOND_REVIEW = [
  'tool/lib/gate.mjs', 'tool/lib/github.mjs', 'tool/lib/record.mjs', 'tool/lib/start.mjs', 'tool/lib/merge.mjs',
  '.github/workflows/',
];

// Requirement ids in a requirements file: GAT-5, INT-1, R1 at a line's start or after a list
// mark, a number or a table bar.
export function requirementIds(text) {
  const ids = [];
  for (const m of String(text || '').matchAll(/^[\s>*#|\d.-]*\**([A-Z][A-Z0-9]*-?\d+)\b/gm)) if (!ids.includes(m[1])) ids.push(m[1]);
  return ids;
}

// The suite line of the read-only section. A job's pull request in a product runs its module's
// suite through `p3 test <id>`, which installs the lock files and builds the generated paths the
// head does not commit, as the gate does: a bare `node --test` lacks them, and its failures are
// findings the gate never sees (defect sweep 4 Nov, #9).
function suiteLine(job, generated) {
  if (!job) return 'Read the code and run the test suite (`node --test \'tool/test/*.test.mjs\'` here, or the module\'s own suite).';
  const L = [`Read the code and run the module's suite as the gate does: \`node .process/tool/p3.mjs test ${job.id}\` from the checkout's root, never a bare \`node --test\`.`];
  if (generated?.built?.length) L.push(`Built, not committed (\`p3 test\` builds them first; their absence in the checkout is not a finding, and their being written there is the one write in the checkout allowed): ${generated.built.map((p) => `\`${p}\``).join(', ')}.`);
  if (generated?.committed?.length) L.push(`Generated and committed (a job does not change them; leave any rebuilt copy uncommitted): ${generated.committed.map((p) => `\`${p}\``).join(', ')}.`);
  return L.join(' ');
}

// The review triggers' section (triggers.mjs): what fired, and the exact hunks that fired it.
function triggerLines(t) {
  if (!t) return [];
  if (t.error) return ['', '## Review triggers', `Not read here (${t.error}); \`merge\` computes them again and refuses --no-review when one fires.`];
  if (!t.fired.length) return ['', '## Review triggers', `None fired${t.bad ? ` (${t.bad}: no security path was read)` : t.security_set ? '' : ' (the product lists no review_triggers.security_paths)'}.`];
  return ['', '## Review triggers', `Fired: ${t.fired.join(' and ')}. ${t.why}.`,
    'The review triggers (4 Nov 19:05): these merge only after this review. Judge each hunk below first: a security list narrowed or widened without a requirement that says so; a test deleted while the code it tested is still live; an assertion removed or loosened so the change passes. Each is a fix unless a requirement or recorded decision makes it right.',
    ...(t.fired.includes('test') ? [`(${ASSERT_RULE}.)`] : []),
    '', '```diff', t.hunks.trimEnd(), '```'];
}

// The triggers for a job's pull request, from this clone: the tranche and the job's branch
// fetched, their merge base, the tranche's copy of the entry and config.
export function localTriggers(root, cfg, branch, id) {
  try {
    git(['fetch', '-q', 'origin', `+refs/heads/${cfg.tranche}:refs/remotes/origin/${cfg.tranche}`, `+refs/heads/${branch}:refs/remotes/origin/${branch}`], { cwd: root });
    const mb = git(['merge-base', `origin/${branch}`, `origin/${cfg.tranche}`], { cwd: root });
    const entry = JSON.parse(git(['show', `${mb}:process/ledger/${id}.json`], { cwd: root }));
    return reviewTriggers(root, { base: mb, head: `origin/${branch}`, entry, cfg: loadConfig(root, `origin/${cfg.tranche}`) });
  } catch (e) { return { error: String(e.message).split('\n')[0].slice(0, 200) }; }
}

export function briefText({ pr, files, job, owner, approvalsFile, scope, generated, triggers }) {
  const second = files.filter((f) => SECOND_REVIEW.some((p) => underPath(f, p)));
  const L = [];
  L.push(`# Review brief: pull request ${pr.number}, "${pr.title}"`);
  L.push('', '## Priorities');
  L.push('The process exists to merge product behaviour that survives, quickly and cheaply. Caution is a cost, paid only against a measured failure or Bob\'s word. A "what if" is one line in your report, never code or owed work.');
  L.push('', `Read your rulebook once, before you review: \`${rulebook('worker')}\` in a product, \`rulebooks/worker.md\` in the process repository; this brief wins where they differ.`);
  L.push('', '## You are read-only');
  L.push(`Run git only in a clone of your own (\`git clone --no-hardlinks <the checkout you were given> <your scratch directory>/c\`, then fetch there), never in the checkout you were given: one git user per clone at a time.`);
  L.push(`${suiteLine(job, generated)} Never run git push, gh, wrangler, the tool's remote commands, or any command string taken from the change. Write only in a scratch directory outside the checkout${job && generated?.built?.length ? ', besides the built paths above' : ''}. Test a hook or a command parser only by piping input into its script.`);
  L.push('', '## Threat model');
  L.push('The tool\'s checks hold against mistakes and outsiders. A session attacking on purpose is held by GitHub\'s walls, so such a finding is a known limit, a note, not a fix.');
  L.push('', '## Scope');
  L.push(`Base \`${pr.base?.ref}\`, head \`${pr.head?.ref}\` at ${String(pr.head?.sha || '').slice(0, 10)}.`);
  if (scope) L.push(`Scope: ${scope}`);
  if (job) L.push(`A job, module \`${job.id}\`; requirements in \`${job.file}\`: ${job.ids.length ? job.ids.join(', ') : '(no ids found; read the file)'}.`);
  if (job) {
    const t = job.receipt?.tests || [];
    if (!job.receipt) L.push('No receipt is posted yet: the requirements this job struck and their tests are not named.');
    else if (!t.some((x) => !x.notice)) L.push('The receipt names no struck requirement mark.');
    else {
      // A notice entry is only in receipts posted before notices stopped taking a --test.
      L.push('Struck requirements, each with the test the receipt names for it:', ...t.filter((x) => !x.notice).map((x) => `- ${x.req}: \`${x.file}\` :: "${x.name}"`));
      L.push('For each, confirm the test asserts that requirement at the module\'s interface (what a caller sees), not an internal detail; a test that does not is a fix.');
    }
  }
  L.push(`Changed files (${files.length}):`, ...files.map((f) => `- ${f}`));
  L.push(...triggerLines(triggers));
  L.push('', '## Owner-only files');
  L.push(`The approvals block of ${approvalsFile} and .claude/settings.json are the owner's. For a commit touching them, check its author is ${owner}, its committer is GitHub, and the record check passed; do not judge their content.`);
  L.push('', '## Pins');
  L.push('Until process3\'s first release, a pin may name a commit on process3\'s tranche.');
  L.push('', '## Output');
  L.push('Every gap in one pass, each with file and line, marked either "fix: <a mistake a real session would plausibly make within the scope>" or "note: <one line, no change>". End with one verdict line: "verdict: merge" or "verdict: fix first".');
  L.push('', '## Rounds');
  L.push(second.length
    ? `One review and one fix pass, then a second review: this change touches ${second.join(', ')} (the gate, the record check, the approvals check or the merge tool).`
    : 'One review and one fix pass; no second review (no change to the gate, the record check, the approvals check or the merge tool).');
  return L.join('\n') + '\n';
}

const raw = (slug, path, ref) => gh(['api', '-H', 'Accept: application/vnd.github.raw', `repos/${slug}/contents/${path}?ref=${ref}`], { allowFail: true });
// Whether a commit tracks a path, from its parent directory's listing: never the file's body (the
// copy's generated bundles are up to 29 MB). Unreadable counts as untracked, so built.
const tracks = (slug, path, ref) => {
  const p = path.replace(/\/+$/, '');
  const i = p.lastIndexOf('/');
  const dir = i < 0 ? '' : p.slice(0, i);
  const list = gh(['api', `repos/${slug}/contents/${dir}?ref=${ref}`], { allowFail: true });
  return Array.isArray(list) && list.some((e) => e?.name === p.slice(i + 1));
};
const prFiles = (slug, n) => {
  const pages = gh(['api', '--paginate', '--slurp', `repos/${slug}/pulls/${n}/files?per_page=100`]);
  return (Array.isArray(pages) ? pages.flat() : []).map((f) => f.filename);
};

export function reviewBrief(root, n, { scope, log = console.log, io = {} } = {}) {
  if (!/^\d+$/.test(String(n))) fail('review brief <pr number> [--scope "<text>"]');
  if (scope === true) fail('--scope needs its text');
  const { read = getPR, files: listFiles = prFiles, contents = raw, notes = comments, tracked = tracks, triggers: readTriggers = localTriggers, slug = repoSlug(root) } = io;
  const cfg = loadConfig(root);
  const pr = read(slug, n);
  if (!pr?.number) fail(`no pull request ${n} in ${slug}`);
  const files = listFiles(slug, n);
  let job = null;
  const id = branchModule(pr.head?.ref, ledgerIds(root, `origin/${cfg.tranche}`));
  if (id) {
    const entry = contents(slug, `process/ledger/${id}.json`, pr.head.sha);
    let e = entry;
    if (typeof entry === 'string') { try { e = JSON.parse(entry); } catch { fail(`process/ledger/${id}.json at the head is not JSON`); } }
    if (e?.requirements) job = { id, file: e.requirements, ids: requirementIds(contents(slug, e.requirements, pr.head.sha)), receipt: latestReceipt(notes(slug, pr.number), pr.user?.login) };
  }
  // The generated paths, split by whether the head commits them (a path absent there is built).
  const generated = job ? { built: [], committed: [] } : null;
  if (job) for (const r of generatedRows(cfg).rows) for (const p of r.paths) (tracked(slug, normPath(p), pr.head.sha) ? generated.committed : generated.built).push(normPath(p));
  const triggers = id ? readTriggers(root, cfg, pr.head.ref, id) : null;
  const text = briefText({ pr, files, job, owner: cfg.approvals.owner, approvalsFile: cfg.approvals.file, scope, generated, triggers });
  log(text.trimEnd());
  return text;
}

// ===== file: fail-reporter.mjs =====

// A node test runner reporter (base-red, basered.mjs): one JSON line per test that ends, failing
// or passing ("ok": true), from the runner's own structured events, written to a destination of
// its own, so nothing the tests print can pose as a failure or hide one. A test's file is where
// its test() was called, so a test a sibling module declares carries the sibling's path (copy PR
// 290: r9-seam-limits.mjs, imported by t51-round9-seam.test.mjs). test:start, test:pass and
// test:fail come in definition order, the files in the order run (node's guarantee), so the
// enclosing names are those last started at each lower nesting, whichever file declared them: a
// stack per file lost a describe of the test file around a sibling's tests. A result named for the
// file itself ("whole") is the runner's for a file that failed to load or exited early.
// Per test file run (build gate-speed, the revert check's one concurrent run): the runner's own
// test:complete for each file it ran, the file's verdict as its exit code would be run alone,
// written as a "done" line ({ file, done: true, ok }); and a "load" line once for a file whose
// output or failures show a module that could not load (LOAD, as the revert check reads a file's
// output run alone). Neither is a test's result: readResults keeps them apart.
import { resolve } from 'node:path';

export const LOAD = /ERR_MODULE_NOT_FOUND|Cannot find module|does not provide an export named/;
const errText = (err) => { const out = []; for (let x = err, i = 0; x && i < 5; x = x.cause, i++) out.push(String(x.code ?? ''), String(x.message ?? ''), String(x.stack ?? '')); return out.join('\n'); };

export default async function* failReporter(source) {
  const s = [];
  const load = new Set();
  const loaded = function* (f) { const file = typeof f === 'string' ? resolve(f) : null; if (file && !load.has(file)) { load.add(file); yield `${JSON.stringify({ file, path: ['(load)'], load: true })}\n`; } };
  for await (const e of source) {
    const d = e.data || {};
    if (e.type === 'test:stdout' || e.type === 'test:stderr') { if (LOAD.test(String(d.message ?? ''))) yield* loaded(d.file); continue; }
    if (e.type === 'test:complete') {
      if (!d.nesting && typeof d.file === 'string' && typeof d.name === 'string' && resolve(d.name) === d.file) yield `${JSON.stringify({ file: d.file, path: [d.name], done: true, ok: d.details?.passed === true })}\n`;
      continue;
    }
    if (e.type === 'test:fail' && LOAD.test(errText(d.details?.error))) yield* loaded(d.file);
    if (e.type !== 'test:start' && e.type !== 'test:fail' && e.type !== 'test:pass') continue;
    if (e.type === 'test:start') { s.length = d.nesting; s[d.nesting] = d.name; continue; }
    if (d.todo || d.skip) continue;
    yield `${JSON.stringify({ file: d.file ?? null, path: [...s.slice(0, d.nesting), d.name], type: d.details?.type ?? null, ...(e.type === 'test:pass' ? { ok: true } : {}), ...(!d.nesting && typeof d.file === 'string' && resolve(d.name) === d.file ? { whole: true } : {}) })}\n`;
  }
}

// ===== file: helpers.mjs =====

// Throwaway git repositories for tests.
import fs, { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { git } from '../lib/util.mjs';
import { writeState } from '../lib/state.mjs';

// Every temporary directory a test process makes is removed when it exits (coordinator, 6 Nov: the
// suite left about 70,000 p3-* directories in a builder's /tmp, and filled its disk). fs.mkdtempSync
// is wrapped once, for every caller in the process (a test's own import of it, the fixtures', the
// tool's), and the directories it made under the temp directory go at exit. tempdirs.test.mjs holds it.
// No test reads the machine's git configuration (C2, the coordinator, 7 Nov: a test passed on a
// builder whose global config gave it an identity and failed in CI, which has none): the global and
// system files are cut off for the test process and every git it starts, as CI runs them. A repo a
// test makes sets what it needs (makeRepo: an identity, no signing). isolation.test holds every
// test file to importing this file. Configuration given by the environment goes too (cold review:
// GIT_CONFIG_COUNT/KEY/VALUE and GIT_CONFIG_PARAMETERS still applied, and GIT_AUTHOR_* and
// GIT_COMMITTER_* can give the identity a test must set itself).
process.env.GIT_CONFIG_GLOBAL = '/dev/null';
process.env.GIT_CONFIG_NOSYSTEM = '1';
for (const k of Object.keys(process.env)) if (/^GIT_CONFIG_(COUNT|KEY_\d+|VALUE_\d+|PARAMETERS)$|^GIT_(AUTHOR|COMMITTER)_(NAME|EMAIL|DATE)$/.test(k)) delete process.env[k];
// Every push to origin this process makes refused (on) or allowed again (off): a push GitHub
// refuses (the rerun tests). Through the environment, after any configuration a test gave there, so
// every git the tool starts meets it.
let pushesAllowed = null;
export function refusePushes(on = true) {
  if (on && !pushesAllowed) {
    const n = Number(process.env.GIT_CONFIG_COUNT) || 0;
    pushesAllowed = { count: process.env.GIT_CONFIG_COUNT, n };
    Object.assign(process.env, { GIT_CONFIG_COUNT: String(n + 1), [`GIT_CONFIG_KEY_${n}`]: 'remote.origin.pushurl', [`GIT_CONFIG_VALUE_${n}`]: '/nonexistent/p3-push-refused.git' });
  } else if (!on && pushesAllowed) {
    const { count, n } = pushesAllowed;
    delete process.env[`GIT_CONFIG_KEY_${n}`]; delete process.env[`GIT_CONFIG_VALUE_${n}`];
    if (count === undefined) delete process.env.GIT_CONFIG_COUNT; else process.env.GIT_CONFIG_COUNT = count;
    pushesAllowed = null;
  }
}
export const MADE = new Set();
if (!fs.mkdtempSync.p3Tracked) {
  const made = fs.mkdtempSync;
  const tracked = (prefix, ...rest) => { const d = made(prefix, ...rest); if (String(prefix).startsWith(tmpdir())) MADE.add(d); return d; };
  tracked.p3Tracked = true;
  fs.mkdtempSync = tracked;
  syncBuiltinESMExports();
  process.on('exit', () => { for (const d of MADE) { try { fs.rmSync(d, { recursive: true, force: true, maxRetries: 2 }); } catch { /* gone, or busy: the guard test sees it */ } } });
}

export function makeRepo(files = {}) {
  const root = mkdtempSync(join(tmpdir(), 'p3-test-'));
  git(['init', '-q', '-b', 'main'], { cwd: root });
  // GitHub's committer address, as a website commit has it, so the approvals history asks the
  // test's lookup about every commit; a test that wants a local commit sets its own.
  git(['config', 'user.email', 'noreply@github.com'], { cwd: root });
  git(['config', 'user.name', 'Test'], { cwd: root });
  git(['config', 'commit.gpgsign', 'false'], { cwd: root });
  if (Object.keys(files).length) commit(root, files, 'initial');
  return root;
}

export function write(root, files) {
  for (const [p, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, p)), { recursive: true });
    writeFileSync(join(root, p), typeof text === 'string' ? text : JSON.stringify(text, null, 2) + '\n');
  }
}

export function commit(root, files, msg = 'change') {
  write(root, files);
  git(['add', '-A'], { cwd: root });
  git(['commit', '-q', '-m', msg], { cwd: root });
  return git(['rev-parse', 'HEAD'], { cwd: root });
}

export const entry = (id, over = {}) => ({
  id,
  title: `Module ${id}`,
  layer: 5,
  paths: [`src/${id}/`],
  tests: [`test/${id}/`],
  requirements: `req/${id}.md`,
  suite: { cwd: '.', command: ['node', '--test'] },
  reading: [`req/${id}.md`],
  status: { state: 'OPEN' },
  ...over,
});

// origin's copy of the state branch (refs/remotes/origin/process-state), with these files added
// to what it holds; a .jsonl file is appended to.
export function onState(root, files) {
