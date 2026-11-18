// ===== file: rerun-more.test.mjs (continued) =====

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

// ===== file: workflow-limits.test.mjs =====

// The owner's limits on a workflow change (build workflow-limits, R1; Bob, 6 Nov: "yes to R1"):
// a plain pull request changing .github/workflows/* merges on a green gate when every changed or
// added workflow passes L1 to L5; process3 PR 188 and copy PR 625, both refused and merged by
// hand on 6 Nov, pass.
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { lineOf, parseWorkflow, readWorkflow } from '../lib/wfyaml.mjs';
import { judgeWorkflow, matchesRequired } from '../lib/workflow-limits.mjs';
import { limitsLine, mergePlain, workflowChanges } from '../lib/merge.mjs';
import { closeWorkflows } from '../lib/workflows.mjs';
import { git } from '../lib/util.mjs';
import { commit, makeRepo } from './helpers.mjs';

const fx = (name) => readFileSync(join(import.meta.dirname, 'fixtures', 'workflow-limits', name), 'utf8');

// A small workflow with a required job `ci`, as process3's own is shaped.
const CI = `name: ci
on:
  pull_request:
    types: [opened, synchronize]
permissions:
  contents: read
jobs:
  ci:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - name: tests
        run: node --test 'tool/test/*.test.mjs'
      - name: record check
        env:
          GH_TOKEN: \${{ github.token }}
        run: |
          git worktree add -q base "$BASE"
          node tool/p3.mjs record-check --base "$BASE"
  other:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - run: echo hi
`;
const REQ = ['ci', 'record'];
const edit = (from, to, src = CI) => { assert.ok(src.includes(from), from); return src.replace(from, to); };
const judge = (head, base = CI, req = REQ) => judgeWorkflow('.github/workflows/ci.yml', base, head, req);
const ok = (r) => assert.equal(r.ok, true, JSON.stringify(r));
const no = (r, limit, re) => { assert.equal(r.ok, false, 'refused'); assert.equal(r.limit, limit, JSON.stringify(r)); if (re) assert.match(r.why, re); };

test('the reader reads plain workflow YAML, with lines, and refuses what it cannot read for sure', () => {
  const d = parseWorkflow(CI);
  assert.equal(d.jobs.ci.steps[1].with['node-version'], '22');
  assert.deepEqual(d.on.pull_request.types, ['opened', 'synchronize']);
  assert.equal(d.jobs.ci.steps[3].run, 'git worktree add -q base "$BASE"\nnode tool/p3.mjs record-check --base "$BASE"');
  assert.equal(lineOf(d.jobs, 'other'), 24);
  assert.equal(lineOf(d.jobs.ci.steps, 2), 16);
  // Comments, a key's sequence at its own indent, a multi-line flow list, quoted keys and values.
  const e = parseWorkflow('# top\non: # why\n  push:\n    paths: [\n      "a/**", # one\n      \'b\',\n    ]\njobs:\n  a:\n    steps:\n    - run: echo "x # not a comment"  # a comment\n    - { uses: "x@v1" }\n');
  assert.deepEqual(e.on.push.paths, ['a/**', 'b']);
  assert.equal(e.jobs.a.steps[0].run, 'echo "x');
  assert.equal(e.jobs.a.steps[1].uses, 'x@v1');
  for (const [src, re] of [
    ['a: &x 1\nb: *x\n', /indicator/],
    ['a: !!str 1\n', /indicator/],
    ['a: 1\na: 2\n', /given twice/],
    ['a:\n  <<: {}\n', /not a `key: value`|merge key/],
    ['? a\n: b\n', /top level|indicator/],
    ['a: 1\n---\nb: 2\n', /more than one document/],
    ['a:\n\tb: 1\n', /tab|cannot place|deeper/],
    ['a: one\n  two\n', /deeper than the value/],
    ['a: x: y\n', /": "/],
    ['a: "open\n', /does not end/],
    ['a:\n  - - x\n', /sequence inside/],
    ['a: [1, 2\n', /not closed/],
    ['a: 1\u2028b: 2\n', /line break/],
    ['- a\n', /top level is not a mapping/],
    ['on: \tpull_request_target\n', /tab/],
    ['jobs:\n  a:\n    name:\tgate\n', /tab|not a `key: value`/],
    ['a: [\n  \tb]\n', /tab/],
  ]) assert.match(readWorkflow(src).why || 'read', re, JSON.stringify(src));
  // Every workflow in the fixtures reads.
  for (const f of ['188-base-ci.yml', '188-head-ci.yml', '625-head-regression.yml', '625-head-container-images.yml', '625-head-deploy-test.yml', '625-head-release-sign.yml']) assert.equal(readWorkflow(fx(f)).why, undefined, f);
});

test('L1: no job added, removed or renamed whose name matches a required check', () => {
  ok(judge(edit('  other:\n', '  lint:\n    runs-on: x\n    permissions: {}\n    steps: [{ run: "true" }]\n  other:\n')));
  ok(judge(edit('  other:\n    runs-on', '  renamed:\n    runs-on')));
  no(judge(edit('  other:\n    runs-on', '  other:\n    name: ci\n    runs-on')), 'L1', /renames the job other \(other to ci\)/);
  no(judge(edit('  ci:\n    runs-on', '  ci:\n    name: tests\n    runs-on')), 'L1', /renames the job ci/);
  no(judge(edit('  ci:\n    runs-on', '  tests:\n    runs-on')), 'L1', /(removes|adds) the job/);
  no(judge(edit('  other:\n', '  record:\n    runs-on: x\n    steps: []\n  other:\n')), 'L1', /adds the job record/);
  // A matrix or a called workflow names its checks after the job; an expression could be any.
  assert.equal(matchesRequired(['gate'], ['gate (22)']), true);
  assert.equal(matchesRequired(['build'], ['ci / build']), true);
  assert.equal(matchesRequired(['${{ matrix.x }}'], ['ci']), true);
  assert.equal(matchesRequired(['cin'], ['ci']), false);
  assert.equal(matchesRequired(['Gate'], ['gate']), true, 'in any case');
  // A new workflow whose job is named like a required check.
  no(judgeWorkflow('.github/workflows/fake.yml', null, 'on: push\npermissions: {}\njobs:\n  x:\n    name: record\n    runs-on: y\n', REQ), 'L1', /adds the job x/);
});

test('L2: no permissions widened, at the workflow or a job, and no block removed', () => {
  ok(judge(edit('permissions:\n  contents: read\n', 'permissions:\n  contents: read\n  checks: none\n')));
  ok(judge(edit('permissions:\n  contents: read\n', 'permissions: {}\n')));
  no(judge(edit('  contents: read\njobs', '  contents: write\njobs')), 'L2', /contents: write is wider than the base's read/);
  no(judge(edit('permissions:\n  contents: read\n', 'permissions:\n  contents: read\n  pull-requests: write\n')), 'L2', /pull-requests: write/);
  no(judge(edit('permissions:\n  contents: read\n', '')), 'L2', /removed, so it takes the default/);
  no(judge(edit('permissions:\n  contents: read\n', 'permissions: read-all\n')), 'L2', /read-all/);
  no(judge(edit('permissions:\n      contents: read\n', 'permissions: write-all\n')), 'L2', /job other: permissions write-all/);
  // A job that drops its own block falls to the workflow's: no wider here, so it passes.
  ok(judge(edit('    permissions:\n      contents: read\n', '')));
  // A new job grants what the workflow does, no more.
  no(judge(edit('  other:\n', '  lint:\n    runs-on: x\n    permissions:\n      issues: write\n    steps: []\n  other:\n')), 'L2', /job lint/);
  // A new workflow declares its permissions and writes nothing.
  ok(judgeWorkflow('.github/workflows/n.yml', null, 'on: push\npermissions:\n  contents: read\njobs:\n  a:\n    runs-on: x\n', REQ));
  no(judgeWorkflow('.github/workflows/n.yml', null, 'on: push\njobs:\n  a:\n    runs-on: x\n', REQ), 'L2', /must declare its permissions/);
  no(judgeWorkflow('.github/workflows/n.yml', null, 'on: push\npermissions:\n  contents: write\njobs:\n  a:\n    runs-on: x\n', REQ), 'L2', /grants write/);
  no(judge(edit('  contents: read\njobs', '  contents: maybe\njobs')), 'L2', /not read, write or none/);
  // A base with no block anywhere: the head may add one that reads, none that writes.
  const bare = edit('permissions:\n  contents: read\n', '').replace('    permissions:\n      contents: read\n', '');
  ok(judge(edit('jobs:\n', 'permissions:\n  contents: read\njobs:\n', bare), bare));
  no(judge(edit('jobs:\n', 'permissions: write-all\njobs:\n', bare), bare), 'L2', /write-all/);
  no(judge(edit('  other:\n    runs-on: ubuntu-latest\n', '  other:\n    runs-on: ubuntu-latest\n    permissions:\n      contents: write\n', bare), bare), 'L2', /job other/);
});

test('L3: no pull_request_target or workflow_run trigger added', () => {
  ok(judge(edit('on:\n  pull_request:\n', 'on:\n  push:\n  pull_request:\n')));
  no(judge(edit('on:\n  pull_request:\n', 'on:\n  pull_request_target:\n  pull_request:\n')), 'L3', /pull_request_target/);
  no(judge(edit('on:\n  pull_request:\n    types: [opened, synchronize]\n', 'on: [pull_request, workflow_run]\n')), 'L3', /workflow_run/);
  no(judgeWorkflow('.github/workflows/n.yml', null, 'on: pull_request_target\npermissions: {}\njobs:\n  a:\n    runs-on: x\n', REQ), 'L3');
  // Kept where the base had it.
  const t = edit('on:\n  pull_request:\n', 'on:\n  pull_request_target:\n');
  ok(judge(edit('timeout-minutes: 10', 'timeout-minutes: 20', t), t));
});

test('L5: a required job keeps its steps, their conditions and every line its runs had', () => {
  // Allowed: a timeout, an action version, node-version, a step added, lines after a run's last.
  ok(judge(edit('timeout-minutes: 10', 'timeout-minutes: 20')));
  ok(judge(edit('actions/setup-node@v4\n        with:\n          node-version: 22', 'actions/setup-node@v5\n        with:\n          node-version: 26\n          cache: npm')));
  // A step is added only after the job's last existing step (Bob, 6 Nov, on #192).
  no(judge(edit('      - name: tests\n', '      - name: lint\n        run: npm run lint\n      - name: tests\n')), 'L5', /a new step before its existing step "tests"; new steps go only after its last existing step/);
  no(judge(edit('      - uses: actions/checkout@v4\n', '      - run: echo "PATH=$PWD/fake" >> "$GITHUB_PATH"\n      - uses: actions/checkout@v4\n')), 'L5', /new step before its existing step 1;/);
  ok(judge(edit('--base "$BASE"\n  other:', '--base "$BASE"\n      - name: lint\n        run: npm run lint\n  other:')));
  // A job that is not a required check takes new steps anywhere.
  ok(judge(edit('      - run: echo hi\n', '      - run: echo first\n      - run: echo hi\n')));
  ok(judge(edit('--base "$BASE"\n', '--base "$BASE"\n          echo done\n')));
  // Refused: a step removed, a run line dropped or changed, a line put before, a condition.
  no(judge(edit("      - name: tests\n        run: node --test 'tool/test/*.test.mjs'\n", '')), 'L5', /loses its step "tests"/);
  no(judge(edit("run: node --test 'tool/test/*.test.mjs'", "run: node --test 'tool/test/*.test.mjs' || true")), 'L5', /drops the line/);
  no(judge(edit('          git worktree add', '          set +e\n          git worktree add')), 'L5', /put into its run before its last line/);
  no(judge(edit("      - name: tests\n", "      - name: tests\n        if: false\n")), 'L5', /has its if added/);
  no(judge(edit("      - name: tests\n", "      - name: tests\n        continue-on-error: true\n")), 'L5', /continue-on-error added/);
  no(judge(edit('          GH_TOKEN: ${{ github.token }}\n', '          GH_TOKEN: ${{ github.token }}\n          SKIP: 1\n')), 'L5', /env changed/);
  no(judge(edit('      - uses: actions/checkout@v4\n', '      - uses: someone/checkout@v4\n')), 'L5', /loses its step/);
  // The job's own condition, needs, or its workflow's env.
  no(judge(edit('  ci:\n    runs-on', '  ci:\n    if: false\n    runs-on')), 'L5', /required job ci has its if added/);
  no(judge(edit('  ci:\n    runs-on', '  ci:\n    needs: other\n    runs-on')), 'L5', /needs added/);
  no(judge(edit('jobs:\n', 'env:\n  CI_SKIP: 1\njobs:\n')), 'L5', /workflow's env/);
  // A job that is not a required check may change freely (the other limits aside).
  ok(judge(edit('      - run: echo hi\n', '      - run: echo bye\n        if: false\n')));
  // The cold review's holes: a folded run, the runner (and so the shell), an input that is not a
  // version, an explicit shell without -e.
  no(judge(edit("        run: node --test 'tool/test/*.test.mjs'\n", "        run: >\n          node --test 'tool/test/*.test.mjs'\n          || true\n")), 'L5', /folded/);
  no(judge(edit('  ci:\n    runs-on: ubuntu-latest', '  ci:\n    runs-on: windows-latest')), 'L5', /runs-on changed/);
  no(judge(edit('      - uses: actions/checkout@v4\n', '      - uses: actions/checkout@v4\n        with:\n          ref: 0123abc\n')), 'L5', /input ref added; only a version or a cache/);
  const plainSh = edit('        run: |\n', '        shell: bash {0}\n        run: |\n');
  no(judge(edit('--base "$BASE"\n', '--base "$BASE"\n          true\n', plainSh), plainSh), 'L5', /does not stop at a failed command/);
  const bashSh = edit('        run: |\n', '        shell: bash\n        run: |\n');
  ok(judge(edit('--base "$BASE"\n', '--base "$BASE"\n          echo done\n', bashSh), bashSh));
  // Reordering the steps puts a step before one the job had: refused.
  no(judge(edit("      - name: tests\n        run: node --test 'tool/test/*.test.mjs'\n      - name: record check\n", "      - name: record check\n").replace("  other:\n", "      - name: tests\n        run: node --test 'tool/test/*.test.mjs'\n  other:\n")), 'L5', /new step before its existing step "tests"/);
});

test('process3 PR 188 and copy PR 625 pass; a deleted workflow and an unread one are refused', () => {
  const r188 = judgeWorkflow('.github/workflows/ci.yml', fx('188-base-ci.yml'), fx('188-head-ci.yml'), ['ci', 'record']);
  ok(r188);
  assert.deepEqual(r188.required, ['ci']);
  for (const f of ['container-images', 'deploy-test', 'regression', 'release-sign']) {
    ok(judgeWorkflow(`.github/workflows/${f}.yml`, fx(`625-base-${f}.yml`), fx(`625-head-${f}.yml`), ['gate', 'record']));
    // Were these jobs required checks, 625's steps, added before their last, would be refused.
    if (f !== 'deploy-test') no(judgeWorkflow(`.github/workflows/${f}.yml`, fx(`625-base-${f}.yml`), fx(`625-head-${f}.yml`), ['gate', 'regression', 'sign', 'image']), 'L5', /new step before/);
  }
  no(judgeWorkflow('.github/workflows/ci.yml', CI, null, REQ), 'removal', /deletes a workflow/);
  no(judgeWorkflow('.github/workflows/ci.yml', CI, 'on: push\njobs: [a]\n', REQ), 'reading', /no jobs mapping/);
  no(judgeWorkflow('.github/workflows/ci.yml', CI, CI.replace('echo hi', 'echo h\u00e9'), REQ), 'reading', /outside printable ASCII/);
});

// merge --plain, end to end: a repository whose tranche holds CI; a head branch changes it.
function repo({ pin = false, files }) {
  const root = makeRepo({ 'README.md': 'x', '.github/workflows/ci.yml': CI, ...(pin ? { 'process/config.json': {} } : {}) });
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-wl-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['checkout', '-q', '-b', 'build/w', 'tranche'], { cwd: root });
  for (const [p, t] of Object.entries(files)) if (t === null) { git(['rm', '-q', p], { cwd: root }); delete files[p]; }
  let sha = commit(root, files);
  if (pin) {
    git(['update-index', '--add', '--cacheinfo', `160000,${'a'.repeat(40)},.process`], { cwd: root });
    git(['commit', '-q', '-m', 'the pin'], { cwd: root });
    sha = git(['rev-parse', 'HEAD'], { cwd: root });
  }
  git(['checkout', '-q', 'main'], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche', 'build/w'], { cwd: root });
  return { root, sha };
}
function io(r, { checks = REQ, repo: proc = { released: () => true, shim: () => null, descends: () => true } } = {}) {
  const calls = { merged: null, rules: 0 };
  const pr = () => ({ state: 'open', draft: false, base: { ref: 'tranche', repo: { full_name: 'o/r', default_branch: 'main' } }, head: { ref: 'build/w', sha: r.sha, repo: { full_name: 'o/r' } } });
  return {
    calls,
    io: {
      getPR: pr,
      requiredChecks: () => { calls.rules++; return { checks: checks.map((context) => ({ context })) }; },
      checkRuns: () => [{ id: 1, status: 'completed', conclusion: 'success', started_at: '2026-11-06T10:00:00Z' }],
      repo: proc,
      mergePR: (slug, n, sha, o) => { calls.merged = { sha, ...o }; return { merged: true, sha: 'm'.repeat(40) }; },
    },
  };
}
const q = { slug: 'o/r', log: () => {}, noReview: 'a test' };

test('merge --plain lands a workflow change within the limits and records the limits it checked', () => {
  // process3 itself: no pin, no shims, L4 does not apply.
  const r = repo({ files: { '.github/workflows/ci.yml': edit('timeout-minutes: 10', 'timeout-minutes: 20') } });
  const f = io(r);
  const out = mergePlain(r.root, 7, { ...q, io: f.io });
  assert.equal(out.merged, true);
  assert.deepEqual(out.workflows, [{ file: '.github/workflows/ci.yml', limits: ['L1', 'L2', 'L3', 'L5'] }]);
  assert.equal(f.calls.merged.message, 'No review: a test\nReview rounds: 0\nWorkflow limits: ci.yml L1 L2 L3 L5');
  assert.equal(f.calls.rules, 1, 'the required checks are read once');
  // Outside a limit: refused with the limit, the line and the owner's word; nothing merged.
  const w = repo({ files: { '.github/workflows/ci.yml': edit('  contents: read\njobs', '  contents: write\njobs') } });
  const g = io(w);
  assert.throws(() => mergePlain(w.root, 7, { ...q, io: g.io }), /changes \.github\/workflows\/ci\.yml: L2 \(line 5\): the workflow's permissions contents: write is wider than the base's read; a workflow change outside the owner's limits needs the owner's word: bring it to Bob/);
  assert.equal(g.calls.merged, null);
  const t = repo({ files: { '.github/workflows/new.yml': 'on: pull_request_target\npermissions: {}\njobs:\n  a:\n    runs-on: x\n' } });
  assert.throws(() => mergePlain(t.root, 7, { ...q, io: io(t).io }), /new\.yml: L3 \(line 1\): it adds the pull_request_target trigger; a workflow change outside/);
  const d = repo({ files: { '.github/workflows/ci.yml': null } });
  assert.throws(() => mergePlain(d.root, 7, { ...q, io: io(d).io }), /ci\.yml: removal: it deletes a workflow; a workflow change outside/);
});

test('L4: in a product, a shim stays the pin\'s own byte for byte; other workflows pass by the limits', () => {
  const shim = 'name: process-gate\non: pull_request\n';
  const shimBlob = (root) => git(['hash-object', '--stdin'], { cwd: root, input: shim });
  // The product's own workflow changes within the limits; the shim is untouched.
  const r = repo({ pin: true, files: { '.github/workflows/ci.yml': edit('timeout-minutes: 10', 'timeout-minutes: 20') } });
  const proc = { released: () => true, descends: () => true, shim: (pin, name) => (name === 'process-gate.yml' ? shimBlob(r.root) : null) };
  assert.deepEqual(workflowChanges(r.root, r.sha, ['.github/workflows/ci.yml'], proc, null, { mb: git(['rev-parse', 'tranche'], { cwd: r.root }), required: () => REQ }), [{ file: '.github/workflows/ci.yml', limits: ['L1', 'L2', 'L3', 'L5'] }]);
  // The shim changed: refused as L4, whatever the limits would say.
  const s = repo({ pin: true, files: { '.github/workflows/process-gate.yml': shim + '# mine\n' } });
  const sp = { ...proc, shim: (pin, name) => (name === 'process-gate.yml' ? shimBlob(s.root) : null) };
  assert.throws(() => workflowChanges(s.root, s.sha, ['.github/workflows/process-gate.yml'], sp, null, { required: () => REQ }), /L4: \.github\/workflows\/process-gate\.yml is not the process's own shim.*owner's word/);
  // Equal to the pin's shim: L4 holds.
  const e = repo({ pin: true, files: { '.github/workflows/process-gate.yml': shim } });
  const ep = { ...proc, shim: (pin, name) => (name === 'process-gate.yml' ? shimBlob(e.root) : null) };
  assert.deepEqual(workflowChanges(e.root, e.sha, ['.github/workflows/process-gate.yml'], ep, null, { required: () => REQ }), [{ file: '.github/workflows/process-gate.yml', limits: ['L4'] }]);
  assert.equal(limitsLine([{ file: '.github/workflows/process-gate.yml', limits: ['L4'] }, { file: '.github/workflows/README.md', limits: [], note: 'not a workflow' }]), 'Workflow limits: process-gate.yml L4; README.md not a workflow');
});


// Jobs working from this file, take note: the job's handover note names its reviewer on a line of
// its own, exactly: `reviewer: Ruairi Mactavish`.

test('a close carries a workflow change within the owner\'s limits when its shapes do not fit', () => {
  // Rule 1 is held elsewhere (close-workflows.test.mjs); here the second judge: shapes, else limits.
  const root = makeRepo({ '.github/workflows/ci.yml': CI });
  const base = git(['rev-parse', 'HEAD'], { cwd: root });
  const head = commit(root, { '.github/workflows/ci.yml': edit('timeout-minutes: 10', 'timeout-minutes: 20') });
  const at = { mb: base, baseRef: base, tranche: 'tranche', slug: 'o/r', io: { repo: {} } };
  const pass = { ...at, limits: (f, src, baseSrc) => judgeWorkflow(f, baseSrc, src, REQ) };
  // Rule 1 needs gated merges: stub it by a chain with nothing after the base (the file is earlier work).
  const judged = closeWorkflows(root, head, ['.github/workflows/ci.yml'], { ...pass, mb: head });
  assert.deepEqual(judged, [{ file: '.github/workflows/ci.yml', limits: ['rule 1', 'L1', 'L2', 'L3', 'L5'] }]);
  const bad = commit(root, { '.github/workflows/ci.yml': edit('  contents: read\njobs', '  contents: write\njobs') });
  assert.throws(() => closeWorkflows(root, bad, ['.github/workflows/ci.yml'], { ...pass, baseRef: head, mb: bad }), /fits no allowed shape.*nor is it within the owner's limits \(L2, line 5/);
  assert.throws(() => closeWorkflows(root, bad, ['.github/workflows/ci.yml'], { ...at, baseRef: head, mb: bad }), /fits no allowed shape.*allowed shapes or within the owner's limits$/);
});

// ===== file: layer-flow-messages.test.mjs =====

// Messages in the shared layer branch's flow, the only flow since the merge train was removed (Bob,
// 6 Nov): no MERGER, no train, no job start --ready; each message says what is true here.
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { layerLines, layerMergeLine, layerOpen, layerStartAct, openLayer, writeRows } from '../lib/layerflow.mjs';
import { flowFile } from '../lib/layerbase.mjs';
import { recordStart } from '../lib/roles.mjs';
import { laneModuleCheck, setupCheck, strategyCheck } from '../lib/setup.mjs';
import { fetchState, readState, writeState } from '../lib/state.mjs';
import { nextWork, status } from '../lib/status.mjs';
import { OWED_FILE, owe, owes, paidUpTo, paysOwed, readOwed } from '../lib/hold.mjs';
import { layerIdle, sweep } from '../lib/sweep.mjs';
import { configOf, git } from '../lib/util.mjs';
import { checkRow } from '../lib/gate.mjs';
import { commit, entry, makeRepo } from './helpers.mjs';

const quiet = () => {};
const SB = 'process-state';
const R = 'session_root1';
const B = 'session_bob1';
const OLD = '2026-01-01T00:00:00Z';
const P3 = 'node .process/tool/p3.mjs';

function withOrigin(files) {
  const root = makeRepo({ 'README.md': 'x', ...files });
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  git(['branch', '-q', '--set-upstream-to', 'origin/tranche'], { cwd: root });
  git(['fetch', '-q', 'origin'], { cwd: root });
  return root;
}

// A product in the layer flow: modules a, b in layer 1 (unmet marks), d in layer 2.
const LAYERS = '| layer | name | modules |\n| --- | --- | --- |\n| 1 | One | a, b |\n| 2 | Two | d |\n';
const REQ = '# x\n\n**R1** a requirement *(not yet met: T1)*\n';
function product({ complete = false } = {}) {
  const files = { 'process/config.json': { tranche: 'tranche', merge_strategy: 'layer' }, 'build/layers.md': LAYERS };
  for (const id of ['a', 'b', 'd']) {
    files[`process/ledger/${id}.json`] = entry(id, { requirements: `build/requirements/${id}.md`, ...(complete ? { status: { state: 'COMPLETE' } } : {}) });
    files[`build/requirements/${id}.md`] = REQ;
  }
  return withOrigin(files);
}
const openIO = { slug: 'o/p', openPRs: () => [] };

const view = (over = {}) => ({ kind: 'open', n: 3, states: [{ id: 'a', state: 'working' }, { id: 'b', state: 'not started' }], prs: [], startable: [{ id: 'b', cmd: `${P3} job start b --sessions <file>` }], ready: false, ...over });

test('layer flow helpers: the merge line only when every module is complete or deferred; the act owed', () => {
  assert.equal(layerMergeLine(view()), null);
  const done = view({ states: [{ id: 'a', state: 'complete' }, { id: 'b', state: 'deferred' }], startable: [], ready: true });
  assert.equal(layerMergeLine(done), `layer 3: complete 1, deferred 1, published 0, working 0, rescheduled 0, not started 0; merge when every module is complete or deferred (${P3} layer merge 3)`);
  // The act owed: start, merge, open the next; unread, status.
  assert.equal(layerStartAct(view()), `${P3} layer jobs 3, then each job start it lists`);
  assert.equal(layerStartAct(done), `${P3} layer merge 3`);
  assert.equal(layerStartAct({ kind: 'next', n: 4 }), `${P3} layer open 4`);
  assert.match(layerStartAct(null), /status --role bob/);
});

test('openLayer: the next layer before its open; once open, its startable jobs and no merge', () => {
  const root = product();
  const cfg = configOf({ tranche: 'tranche', merge_strategy: 'layer' });
  fetchState(root, SB, { fresh: true });
  assert.deepEqual(openLayer(root, cfg, { slug: 'o/p', io: openIO }), { kind: 'next', n: 1 });
  layerOpen(root, 1, { io: openIO, log: quiet });
  const v = openLayer(root, cfg, { slug: 'o/p', io: openIO });
  assert.equal(v.kind, 'open');
  assert.deepEqual(v.startable.map((x) => x.id), ['a', 'b']);
  assert.equal(v.ready, false);
  assert.equal(layerMergeLine(v), null);
  // The merge line is next work's in status: layerLines leaves it out with merge false.
  const ready = { ...v, startable: [], ready: true };
  assert.ok(layerLines(root, cfg, { view: ready }).some((l) => /can merge/.test(l)));
  assert.ok(!layerLines(root, cfg, { view: ready, merge: false }).some((l) => /can merge/.test(l)));
});

test('next work: no train-era "ready to close" line; the layer\'s merge line only when it holds', () => {
  const cfg = configOf({ tranche: 'tranche' });
  const ls = { ready: true, pending: true, cur: { n: 1, mods: [] }, layers: [], deferred: [], owed: [{ pr: 9, blocked: 'x' }] };
  const lines = (v) => { const out = []; nextWork(product(), cfg, [], null, { state: ls, view: v, log: (l) => out.push(l) }); return out; };
  const working = lines(view());
  assert.ok(!working.some((l) => /ready to close|merge when|layer close|job start --ready/.test(l)), working.join('\n'));
  const done = view({ states: [{ id: 'a', state: 'complete' }], startable: [], ready: true });
  assert.ok(lines(done).includes(layerMergeLine(done)));
  assert.ok(!lines(null).some((l) => /ready to close/.test(l)));
});

test('idle capacity: slots count against the open layer\'s startable jobs, never the train or a layer close', () => {
  const t = Date.parse('2026-11-06T12:00:00Z');
  const prev = { at: '2026-11-06T11:00:00Z', idle_capacity: { kind: 'work', since: '2026-11-06T11:00:00Z' } };
  const ic = layerIdle({ live: 2, cap: 6, holds: [], view: view({ startable: [{ id: 'b', cmd: 'x' }, { id: 'c', cmd: 'y' }] }), prev, t });
  assert.equal(ic.kind, 'work');
  assert.equal(ic.alarm, true);
  assert.equal(ic.startable, 2);
  assert.deepEqual(ic.reasons, [`2 x startable from ${P3} layer jobs 3, not started (start now: b, c; one listed after a provider in flight starts now with its plain job start, no --early: R10; only a recorded hold waits)`, '2 x no startable work: layer 3 lists no job to start']);
  assert.deepEqual(ic.fill, ['b', 'c']);
  assert.ok(!ic.reasons.some((r) => /ready to close|job start --ready|train/.test(r)));
  // A module hold on a startable job: named; a hold of another layer's module: nothing.
  const holds = [{ live: true, kind: 'module', value: 'b', id: 'h1', by: 'bob', why: 'waits' }, { live: true, kind: 'module', value: 'zz', id: 'h2', by: 'bob', why: 'other' }];
  // Every listed job working or held, nothing to merge: the layer's own wait, no idle.
  assert.equal(layerIdle({ live: 2, cap: 6, holds, view: view(), prev, t }), null);
  const h = layerIdle({ live: 1, cap: 6, holds, view: view({ startable: [{ id: 'b', cmd: 'x' }, { id: 'c', cmd: 'y' }] }), prev, t });
  assert.equal(h.startable, 1);
  assert.deepEqual(h.reasons, [`1 x startable from ${P3} layer jobs 3, not started (start now: c; one listed after a provider in flight starts now with its plain job start, no --early: R10; only a recorded hold waits)`, 'b: held by h1 (by bob): waits', '3 x no startable work: layer 3 lists no job to start']);
  // The layer can merge, or the next is not open: said as the empty slots' reason.
  assert.match(layerIdle({ live: 0, cap: 4, view: view({ startable: [], ready: true }), t }).reasons[0], /^4 x no startable work: layer 3 can merge \(.*layer merge 3\)$/);
  assert.match(layerIdle({ live: 0, cap: 4, view: { kind: 'next', n: 4 }, t }).reasons[0], /layer 4 is next and not open/);
  // Full: none.
  assert.equal(layerIdle({ live: 6, cap: 6, view: view(), t }), null);
});

// C25 (the coordinator, 7 Nov): on the copy's layer 11 IDLE CAPACITY ran 141 min while BOB held jobs
// listed "(after <provider>)" as waits. The alarm names the jobs that fill the empty slots, says an
// early start is BOB's now, and counts no additive retest (CI's, no job session) as a slot's work.
test('idle capacity (C25): the jobs that fill the empty slots are named, early ones included; a retest fills no slot', () => {
  const t = Date.parse('2026-11-07T18:37:00Z');
  const v = view({ startable: [{ id: 'a', cmd: `${P3} job start a --sessions <file>` }, { id: 'r', cmd: `${P3} layer retest r`, job: 'x', additive: true }, { id: 'b', cmd: `${P3} job start b --sessions <file>`, after: ['q'] }, { id: 'c', cmd: `${P3} job start c --sessions <file>`, after: ['q'] }] });
  const ic = layerIdle({ live: 4, cap: 6, view: v, t });
  assert.equal(ic.startable, 3, 'the retest is not counted');
  assert.deepEqual(ic.fill, ['a', 'b'], 'two empty slots: the first two in the list, the early b among them');
  assert.match(ic.reasons[0], /^2 x startable from .* layer jobs 3, not started \(start now: a, b; one listed after a provider in flight starts now with its plain job start, no --early: R10; only a recorded hold waits\)$/);
  // Only retests listed: no idle capacity (they need no session).
  assert.equal(layerIdle({ live: 4, cap: 6, view: view({ startable: [{ id: 'r', cmd: `${P3} layer retest r`, job: 'x', additive: true }] }), t }), null);
});

const run = (root, o = {}) => sweep(root, { session: R, offline: true, log: quiet, ...o });
function lapsedMerger(root) {
  writeState(root, SB, 'merger', (d) => {
    mkdirSync(join(d, 'addresses'), { recursive: true });
    writeFileSync(join(d, 'addresses/merger.json'), JSON.stringify({ session: 'session_merger1', at: OLD }));
    mkdirSync(join(d, 'merger'), { recursive: true });
    writeFileSync(join(d, 'merger/lease.json'), JSON.stringify({ session: 'session_merger1', token: 't', expires: OLD }));
  });
}

test('sweep: no MERGER is started or replaced, a stale merge_train key and an old MERGER address and lease on the state branch included', () => {
  const root = withOrigin({ 'process/config.json': { tranche: 'tranche', merge_train: true } });
  recordStart(root, 'root', R, { log: quiet });
  recordStart(root, 'bob', B, { log: quiet });
  assert.ok(!run(root).todo.some((x) => /MERGER/.test(x)));
  lapsedMerger(root);
  const r = run(root);
  assert.ok(!r.todo.some((x) => /MERGER/.test(x)), r.todo.join('\n'));
  assert.ok(!r.found.some((x) => /MERGER/.test(x)), r.found.join('\n'));
});

test('sweep: a layer the train called ready to close is not said, and BOB is not told to run job start --ready', () => {
  const layers = '| layer | what | modules |\n|---|---|---|\n| 1 | first | a |\n| 2 | next | d |\n';
  const files = () => ({
    'process/config.json': { tranche: 'tranche' },
    'build/layers.md': layers,
    'build/requirements/a.md': '- **R1** *(not yet met: x)* y\n',
    'build/requirements/d.md': '- **R1** *(not yet met: x)* y\n',
    'process/ledger/a.json': entry('a', { requirements: 'build/requirements/a.md', status: { state: 'COMPLETE' } }),
  });
  const root = withOrigin(files());
  recordStart(root, 'root', R, { log: quiet });
  recordStart(root, 'bob', B, { log: quiet });
  const s = run(root);
  assert.doesNotMatch(s.found.join('; '), /ready to close/);
  assert.ok(!s.todo.some((x) => /job start --ready/.test(x)), s.todo.join('\n'));
});

test('setup check: the state branch\'s coordinator address is shown, the config\'s value flagged stale when it differs', () => {
  const root = makeRepo({ 'README.md': 'x' });
  const conditions = [{ id: 'coordinator', what: 'the coordinator' }];
  const detail = (cfg, address) => setupCheck(root, { slug: 'o/r', conditions, io: { file: (f) => (f === 'process/config.json' ? JSON.stringify(cfg) : null), address: address === undefined ? null : () => address, pin: null, entries: [], api: () => null }, log: quiet }).results[0];
  assert.deepEqual(detail({ coordinator: 'session_old' }), { id: 'coordinator', what: 'the coordinator', state: 'set', detail: 'session_old' });
  assert.equal(detail({ coordinator: 'session_old' }, 'session_new').detail, "session_new (the state branch's address); process/config.json's coordinator session_old is stale");
  assert.equal(detail({ coordinator: 'session_new' }, 'session_new').detail, "session_new (the state branch's address, as process/config.json names)");
  assert.equal(detail({}, 'session_new').state, 'set');
  assert.equal(detail({}).state, 'missing');
});

test('setup check: a lane whose folder lies under a module\'s paths and names no module is warned; one naming it is not', () => {
  const entries = [{ id: 'ux-design', paths: ['docs/development/'] }, { id: 'other', paths: ['src/other'] }];
  const lane = (extra = {}) => ({ lanes: [{ name: 'ux', dir: 'docs/development/ux-substrate', ...extra }] });
  const out = [];
  const w = laneModuleCheck(lane(), entries, { log: (l) => out.push(l) });
  assert.equal(w.length, 1);
  assert.match(w[0], /^lane ux: its folder docs\/development\/ux-substrate lies under module ux-design's path docs\/development\/, and its row in process\/config\.json names no module: .*add "module": "ux-design"/);
  assert.match(out[0], /^warning: lane ux/);
  assert.deepEqual(laneModuleCheck(lane({ module: 'ux-design' }), entries, { log: quiet }), []);
  assert.match(laneModuleCheck(lane({ module: 'other' }), entries, { log: quiet })[0], /names module other/);
  assert.deepEqual(laneModuleCheck({ lanes: [{ name: 'x', dir: 'design/x' }] }, entries, { log: quiet }), []);
  assert.deepEqual(laneModuleCheck({}, entries, { log: quiet }), []);
  // Under a module's tests: no module setting helps; said so.
  assert.match(laneModuleCheck({ lanes: [{ name: 't', dir: 'test/x/lane', module: 'tx' }] }, [{ id: 'tx', paths: ['src/x'], tests: ['test/x'] }], { log: quiet })[0], /lies under module tx's tests test\/x: .*move the lane's folder/);
});

const IO = { slug: 'o/p', openPRs: () => [], checkRun: () => null, checkRuns: () => [], compare: () => null, prFiles: () => [], comments: () => [], pins: () => [] };
test('sweep online: BOB is woken to open the next layer, then to start the open layer\'s jobs; idle counted against them', () => {
  // Every entry COMPLETE with unmet marks (no job open): next work wakes BOB at once, as in the train.
  const root = product({ complete: true });
  recordStart(root, 'root', R, { log: quiet });
  recordStart(root, 'bob', B, { log: quiet });
  const before = run(root, { offline: false, io: IO, live: 0 });
  const wake = before.todo.find((x) => /^wake BOB/.test(x)) || '';
  assert.match(wake, /with next work: run node \.process\/tool\/p3\.mjs layer open 1/, before.todo.join('\n'));
  assert.doesNotMatch(wake, /job start --ready/);
  layerOpen(root, 1, { io: openIO, log: quiet });
  const after = run(root, { offline: false, io: IO, live: 0 });
  const w2 = after.todo.find((x) => /^wake BOB/.test(x)) || '';
  assert.match(w2, /layer jobs 1, then each job start it lists/, after.todo.join('\n'));
  assert.ok(!after.todo.some((x) => /MERGER|job start --ready/.test(x)), after.todo.join('\n'));
  const rows = readState(root, SB, 'metrics/sweep.jsonl').trim().split('\n').map((l) => JSON.parse(l));
  const last = rows.at(-1);
  assert.equal(last.startable, 2);
  // b and a, then d early into layer 2 (no providers: R14).
  assert.equal(last.idle_capacity.startable, 3);
  assert.equal(last.idle_capacity.layer, 1);
});

test('no layer map: openLayer says so, status names it, and the sweep still wakes BOB for next work', () => {
  const root = withOrigin({ 'process/config.json': { tranche: 'tranche' }, 'build/requirements/a.md': REQ, 'process/ledger/a.json': entry('a', { requirements: 'build/requirements/a.md', status: { state: 'COMPLETE' } }) });
  const cfg = configOf({ tranche: 'tranche' });
  fetchState(root, SB, { fresh: true });
  const v = openLayer(root, cfg, { slug: 'o/p', io: openIO });
  assert.deepEqual(v, { kind: 'none' });
  assert.match(layerLines(root, cfg, { view: v })[0], /no layer map .*jobs start on the tranche from next work/);
  assert.equal(layerStartAct(v), `${P3} status --role bob (the layer flow's next act)`);
  recordStart(root, 'root', R, { log: quiet });
  recordStart(root, 'bob', B, { log: quiet });
  const s = run(root, { offline: false, io: IO });
  assert.ok(s.todo.some((x) => /wake BOB .*idle .*with next work: run node \.process\/tool\/p3\.mjs status --role bob/.test(x)), s.todo.join('\n'));
});

test('the gate row of a layer pull request (trigger layer) passes the post check', () => {
  const row = { sha: 'a'.repeat(40), run_id: 1, trigger: 'layer', findings: 0, ok: true, minutes: 1 };
  assert.doesNotThrow(() => checkRow(row));
  assert.throws(() => checkRow({ ...row, trigger: 'spec-tested' }), /trigger/);
});

test('setup check names merge_strategy "train" as a blocker before a pin move, even from a checkout whose own config says it', () => {
  assert.equal(strategyCheck({}), null);
  assert.equal(strategyCheck({ merge_strategy: 'layer' }), null);
  assert.match(strategyCheck({ merge_strategy: 'train' }), /^BLOCKER before a pin move: .*"merge_strategy": "train".*plain pull request setting "merge_strategy": "layer"/);
  const root = makeRepo({ 'process/config.json': { tranche: 'tranche', merge_strategy: 'train' } });
  const out = [];
  const r = setupCheck(root, { slug: 'o/r', conditions: [], io: { file: (f) => (f === 'process/config.json' ? JSON.stringify({ merge_strategy: 'train' }) : null), address: null, pin: null, entries: [], api: () => null, openPRs: () => [], prFiles: () => [] }, log: (l) => out.push(l) });
  assert.match(r.strategy, /BLOCKER before a pin move/);
  assert.ok(out.some((l) => /^BLOCKER before a pin move/.test(l)), out.join('\n'));
});

test('starts owed (kept for the layer flow, R10): an owing act writes it, status prints it first with the layer flow\'s act, never job start --ready', () => {
  const root = product();
  writeState(root, SB, 'owe', (d) => { owe(d, 'job complete a'); return {}; });
  fetchState(root, SB, { fresh: true });
  const out = [];
  status(root, { role: 'bob', offline: true, log: (l) => out.push(l) });
  assert.match(out[0], /^starts owed since \S+ \(job complete a\): run status --role bob, then each `job start` its `jobs to start` lists \(layer jobs <n>\)$/);
  assert.doesNotMatch(out.join('\n'), /job start --ready|starter/);
  assert.equal(owes('job complete', { _: ['a'] }), 'job complete a');
  assert.equal(owes('layer close', { _: ['1'] }), null);
});

test('starts owed are paid: a job start or layer open pays what was owed before it began; the sweep pays all when nothing is left to start (cold review of PR 191)', () => {
  assert.equal(paysOwed('job start'), true);
  assert.equal(paysOwed('layer open'), true);
  assert.equal(paysOwed('merge'), false);
  const dir = mkdtempSync(join(tmpdir(), 'p3-owed-'));
  owe(dir, 'hold ended h1');
  const begun = new Date(Date.now() + 1000).toISOString();
  assert.equal(paidUpTo(dir, begun), true);
  assert.equal(paidUpTo(dir, begun), false, 'nothing left');
  // The sweep: the open layer lists starts, so the owed stands; every layer merged, it is paid.
  const root = product({ complete: true });
  recordStart(root, 'root', R, { log: quiet });
  recordStart(root, 'bob', B, { log: quiet });
  layerOpen(root, 1, { io: openIO, log: quiet });
  writeState(root, SB, 'owe', (d) => { owe(d, 'triage recorded x:1'); return {}; });
  run(root, { offline: false, io: IO, live: 0 });
  fetchState(root, SB, { fresh: true });
  assert.ok(readOwed(root, SB), 'starts listed: still owed');
  // The layers' merge on the tranche, not on main (an earlier tranche's rows are stale, not done).
  commit(root, { 'src/x.txt': 'layers merged' }, 'layers merged');
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  git(['fetch', '-q', 'origin'], { cwd: root });
  const tip = git(['rev-parse', 'origin/tranche'], { cwd: root });
  const at = new Date().toISOString();
  writeRows(root, SB, 'merged', [[flowFile(1, 'merged'), { row: 'merged', layer: 1, commit: tip, at }], [flowFile(2, 'open'), { row: 'open', layer: 2, at }], [flowFile(2, 'merged'), { row: 'merged', layer: 2, commit: tip, at }]]);
  run(root, { offline: false, io: IO, live: 0 });
  fetchState(root, SB, { fresh: true });
  assert.equal(readState(root, SB, OWED_FILE), null, 'every layer merged: paid');
});

// C25: between sweeps the check judged on the sweep's live count alone (the copy, 16:18-16:50: 16
// slots "empty" on the 15:53 sweep's live 4 while BOB started about 20 jobs). Every start recorded
// since the measurement counts: the open layer's start rows and the early starts into the next.
test('idle check (C25): starts recorded since the sweep measured count as live', async () => {
  const { startsSince } = await import('../lib/sweep.mjs');
  const root = makeRepo({ 'README.md': 'x\n' });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  const start = (n, id, at) => [flowFile(n, 'start', `${id}-${Date.parse(at)}`), { row: 'start', layer: n, module: id, at }];
  writeRows(root, SB, 'starts', [
    start(11, 'old', '2026-11-07T15:40:00Z'),
    start(11, 'a', '2026-11-07T16:14:00Z'), start(11, 'b', '2026-11-07T16:20:00Z'),
    start(12, 'e', '2026-11-07T16:30:00Z'), start(12, 'f', '2026-11-07T15:00:00Z'),
    // A refused early start leaves an early row (written at the cut) and no start row: nothing.
    [flowFile(12, 'early', 'g-1'), { row: 'early', layer: 12, module: 'g', at: '2026-11-07T16:31:00Z' }],
