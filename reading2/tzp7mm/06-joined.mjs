// ===== file: round-next.test.mjs (continued) =====

  assert.match(reqAt(root, 'b'), /\*\*R3\*\* c\n- \*\*F1\*\* \*\(not yet met: internal walk internal-w\d+ \w{10}\)\* the b page is somewhere it should not be$/);
  assert.equal(reqAt(root, 'a'), req('a').trimEnd(), 'the live arm\'s findings recorded nowhere');
});

test('round next: a clean walk opens no round and prints the release path', () => {
  const root = product();
  push(root, { 'process/config.json': { merge_strategy: 'layer', release: { checks: [['true']], assemble: ['true'], out: 'out/rel' } } }, 'releases cut');
  walked(root, { failures: [], min: 10 });
  const r = run(root, gh(root).io, { apply: true });
  assert.equal(r.state, 'clean');
  assert.match(r.text, /the walk internal-w\d+ \w{10} is clean: no round opens; the release path is next \(round 1's internal walk internal-w\d+ \w{10} is clean, and no release is cut since\): node \.process\/tool\/p3\.mjs release dev, from a clean checkout of the tranche tip/);
  assert.equal(flowRows(root, SB, 4).open, null);
  // Under plan close no round opens: round next says so, whatever the walk found.
  push(root, { 'process/config.json': { merge_strategy: 'layer', plan: 'close' } }, 'plan close');
  assert.throws(() => run(root, gh(root).io), /the plan is close on tranche: the current round is the last, and no round opens/);
});

// The rehearsal: the round loop end to end on a fixture product, the round's walks the real `walk
// round` (an internal walk whose report names a flaw in b and in d until each is fixed), so a cycle
// like C44's (found, job start and layer open each waiting on another) is caught here, not in the product.
const node = (code) => ['node', '-e', code];
const GUARD = 'p3dev guard: passed';
const WALKER = node(`const fs = require('fs'); fs.mkdirSync('out', { recursive: true }); const f = [];
if (!fs.existsSync('fixed-b')) f.push({ module: 'b', kind: 'layout', message: 'the b button overlaps the footer' }, { module: 'b', kind: 'layout', message: 'the b button overlaps the footer' });
if (!fs.existsSync('fixed-d')) f.push({ module: 'd', kind: 'step', message: 'the d form loses its draft' });
fs.writeFileSync('out/report.json', JSON.stringify({ steps: [{ ok: !f.length }], failures: f })); process.exit(f.length ? 1 : 0);`);
test('round next rehearsal: round close walk with flaws, round next, jobs, layer merge, the next layer, the round\'s walk clean, the release path', () => {
  const root = product();
  push(root, { 'process/config.json': { merge_strategy: 'layer', deploy: { slug_prefix: 'p3dev-', dry_run: [node(`console.log(${JSON.stringify(GUARD)})`)], deploy: [node('1')], walk: [node('1')], guard_line: GUARD, internal_walk: { run: WALKER, reports: ['out/report.json'] } } }, 'out/.gitignore': '*\n' }, 'the internal walk');
  const { io } = gh(root);
  const walkIO = { compare: () => null, status: { openPRs: () => [], checkRun: () => null, compare: () => null } };
  const tip = () => { git(['checkout', '-q', 'tranche'], { cwd: root }); git(['merge', '-q', '--ff-only', 'origin/tranche'], { cwd: root }); };
  const walk = () => { tip(); const out = []; const r = walkRound(root, { io: walkIO, repo: 'o/p', log: (l) => out.push(String(l)) }); return { ...r, text: out.join('\n') }; };
  const now = () => new Date().toISOString();
  const mergedNow = (n) => { writeRows(root, SB, `merged ${n}`, [[`layerflow/${n}/merged.json`, { row: 'merged', layer: n, commit: 'f'.repeat(40), at: now() }]]); fetchState(root, SB, { fresh: true }); };
  // Round 1 closed: its walk finds flaws in b (map layer 1) and d (map layer 3, pinned); it names round next.
  const w1 = walk();
  assert.equal(w1.ok, false);
  assert.match(w1.text, /the one next act: `node \.process\/tool\/p3\.mjs round next`/);
  const o4 = run(root, io, { apply: true });
  // PD-24: round 2 is one layer, b and d (map layers 1 and 3) starting at once.
  assert.deepEqual([o4.state, o4.layer, o4.startable.map((x) => x.id).sort()], ['opened', 4, ['b', 'd']]);
  const cmdOf = (id) => o4.startable.find((x) => x.id === id).cmd;
  assert.match(cmdOf('b'), /--reopen "F1: the b button overlaps the footer \(internal walk internal-l3 \w{10}, covers 2\)"/);
  assert.match(cmdOf('d'), /--reopen "O1: the d form loses its draft \(internal walk internal-l3 \w{10}; owed reopen/);
  // b's job: its mark met and its fix; d's job takes its owed reopen as its own F mark, met; layer 4
  // merges: the round's walk is owed, no second layer.
  push(root, { 'req/b.md': `${req('b')}- **F1** met\n`, 'fixed-b': 'x\n', 'req/d.md': `${req('d')}- **F1** met\n`, 'fixed-d': 'x\n' }, 'b and d fixed');
  mergedNow(4);
  const w = run(root, io, { apply: true });
  assert.equal(w.state, 'walk');
  assert.match(w.text, /every layer of round 2 has merged: its walk ends it, the round-close run/);
  // Round 2's walk is clean: no round 3; the release path.
  const w2 = walk();
  assert.equal(w2.ok, true);
  const c = run(root, io, { apply: true });
  assert.equal(c.state, 'clean');
  assert.match(c.text, /no round opens; the release path follows/);
  assert.equal(flowRows(root, SB, 6).open, null);
});

// ===== file: close-workflows.test.mjs =====

// A close's workflow changes (Bob, 4 Nov, about 07:04: product workflow changes are not his to
// bring). The tranche into main, normal or bootstrap, may carry a product workflow change that
// reached the tranche through gated pull requests, defines no job named like a required or
// process check, and widens no permission; process-gate.yml must still be the pin's own shim.
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { mergePlain } from '../lib/merge.mjs';
import { workflowShapes } from '../lib/workflows.mjs';
import { readFileSync } from 'node:fs';
import { BOT, GATE, block } from '../lib/github.mjs';
import { DEFAULTS, git } from '../lib/util.mjs';
import { entry, makeRepo, write } from './helpers.mjs';

// A commit of only these files: `git add -A` would drop the pin's gitlink, which has no checkout.
const commit = (root, files, msg = 'change') => { write(root, files); git(['add', '--', ...Object.keys(files)], { cwd: root }); git(['commit', '-q', '-m', msg], { cwd: root }); return git(['rev-parse', 'HEAD'], { cwd: root }); };

const PIN = 'a'.repeat(40);
const SHIM = 'name: process-gate\non: pull_request\n';
const MAIN_PR = 70;

// The copy's container-images.yml and regression.yml, cut down to what the rules read.
const IMAGES = (extra = '') => `# container-images.yml: builds the fleet's images
name: container-images

on:
  push:
    branches: ["dist/cut-*"]
    paths: ["agent-runner/Dockerfile",
            ".github/workflows/container-images.yml"]
  workflow_dispatch:

permissions:
  contents: read
  packages: write

jobs:
  image:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        include:
          - { name: agent-runner, context: agent-runner }${extra}
    steps:
      - uses: actions/checkout@v4
      - name: build and push
        run: |
          echo "gate:"
          echo building
`;
const REGRESSION = (extra = '') => `name: regression
on:
  workflow_dispatch:
permissions:
  contents: read
jobs:
  regression:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - run: |
        set -euo pipefail
        for pkg in bio-plane pdf-worker${extra}; do echo $pkg; done
        echo done
`;

function processRepo(root) {
  const shim = git(['hash-object', '-w', '--stdin'], { cwd: root, input: SHIM });
  return { released: (p) => p === PIN, shim: (p, name) => (name === 'process-gate.yml' ? shim : null), descends: () => true };
}


// Dunn sent word of 12 radishes on hand.

// A product: main with the product workflows (and, unless bootstrap, Process3); a tranche that
// takes Process3 and then each change in `steps`, in order: { via: 'plain' | 'job' | 'direct',
// files, red, unverified }. Plain and job changes merge as merge --plain and merge write them.
function product({ bootstrap = true, steps = [], ledger = [], pre = [] } = {}) {
  const mainFiles = { 'README.md': 'x', '.github/workflows/container-images.yml': IMAGES(), '.github/workflows/regression.yml': REGRESSION() };
  for (const id of ledger) mainFiles[`process/ledger/${id}.json`] = entry(id, { paths: ['.github/workflows/regression.yml'], tests: [`test/${id}/`] });
  if (!bootstrap) mainFiles['process/config.json'] = { tranche: 'tranche' };
  const root = makeRepo(mainFiles);
  if (!bootstrap) { git(['update-index', '--add', '--cacheinfo', `160000,${PIN},.process`], { cwd: root }); git(['commit', '-q', '-m', 'pin'], { cwd: root }); }
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['checkout', '-q', '-b', 'tranche'], { cwd: root });
  // Earlier work: direct commits on the tranche before Process3, left out by record_since.
  let since = null;
  for (const files of pre) since = commit(root, files, 'earlier work, before Process3');
  let setAt = null;
  if (bootstrap) {
    setAt = commit(root, { 'process/config.json': { tranche: 'tranche', ...(since ? { record_since: since } : {}) }, '.github/workflows/process-gate.yml': SHIM }, 'Process3 setup on the tranche');
    git(['update-index', '--add', '--cacheinfo', `160000,${PIN},.process`], { cwd: root });
    git(['commit', '-q', '-m', 'the pin'], { cwd: root });
  } else commit(root, { '.github/workflows/process-gate.yml': SHIM }, 'the shim');
  const prs = new Map();
  const comments = new Map();
  steps.forEach((s, i) => {
    const n = 10 + i;
    const onto = git(['rev-parse', 'HEAD'], { cwd: root });
    if (s.via === 'direct') { commit(root, s.files, 'a direct commit'); return; }
    const branch = s.via === 'job' ? `job/${s.id}` : `bob/wf${i}`;
    git(['checkout', '-q', '-b', branch], { cwd: root });
    commit(root, typeof s.files === 'function' ? s.files(onto) : s.files, 'the workflow change');
    if (s.via === 'job') {
      const was = git(['show', `HEAD:process/metrics/${s.id}.jsonl`], { cwd: root, allowFail: true });
      commit(root, { [`process/metrics/${s.id}.jsonl`]: (was.code === 0 ? was.stdout : '') + JSON.stringify({ row: 'merge', pr: n }) + '\n' });
    }
    const tip = git(['rev-parse', 'HEAD'], { cwd: root });
    git(['checkout', '-q', 'tranche'], { cwd: root });
    git(['merge', '-q', '--no-ff', branch, '-m', s.via === 'job' ? `Merge job PR ${n}` : `Merge PR ${n}: ${branch} into tranche`], { cwd: root });
    if (s.evil) commit(root, s.evil, 'amend'), git(['reset', '-q', '--soft', 'HEAD~1'], { cwd: root }), git(['commit', '-q', '--amend', '--no-edit'], { cwd: root });
    const m = git(['rev-parse', 'HEAD'], { cwd: root });
    prs.set(n, { number: n, merged: true, merge_commit_sha: m, base: { ref: 'tranche' }, head: { ref: branch, sha: tip, repo: { full_name: 'o/r' } }, user: { login: 'civicsmith' } });
    const ok = !s.red;
    const row = { sha: tip, base: onto, run_id: 100 + n, trigger: 'code', scope: s.via === 'job' ? [s.id] : [], suite: ok ? 'pass' : 'fail', ok, findings: ok ? 0 : 1, verified: !s.unverified };
    comments.set(n, [{ id: n, body: block(GATE, { runs: [row] }), user: { login: BOT } }]);
  });
  const sha = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  return { root, sha, prs, comments, setAt };
}

function io(r, { rules = { checks: [{ context: 'gate' }] }, owned = null } = {}) {
  const calls = { merged: null };
  const main = () => ({ state: 'open', draft: false, mergeable: true, base: { ref: 'main', repo: { full_name: 'o/r', default_branch: 'main' } }, head: { ref: 'tranche', sha: r.sha, repo: { full_name: 'o/r' } } });
  return {
    calls,
    io: {
      getPR: (s, n) => (n === MAIN_PR ? main() : r.prs.get(n)),
      prsFromBranch: (s, b) => [...r.prs.values()].filter((x) => x.head.ref === b),
      baseEverChanged: () => false,
      comments: (s, n) => r.comments.get(n) || [],
      verify: (s, row, ctx) => row.verified === true && r.prs.get(ctx.pr)?.head.sha === row.sha && ctx.baseRef === 'tranche' && ctx.merged?.branch === r.prs.get(ctx.pr)?.head.ref,
      requiredChecks: () => rules,
      checkRuns: () => [{ status: 'completed', conclusion: 'success', started_at: '2026-11-04T06:00:00Z' }],
      repo: processRepo(r.root),
      lookup: (args) => (owned && args[1].split('/').pop() === owned
        ? { author: { login: DEFAULTS.approvals.owner }, committer: { login: 'web-flow' }, commit: { verification: { verified: true } } }
        : { author: { login: 'civicsmith' }, committer: { login: 'civicsmith' }, commit: { verification: { verified: false } } }),
      mergePR: (slug, n, sha, o) => { calls.merged = { sha, ...o }; return { merged: true, sha: 'm'.repeat(40) }; },
    },
  };
}
const q = { slug: 'o/r', noReview: 'a test', log: () => {} };
const close = (r, o) => { const f = io(r, o); return { f, go: () => mergePlain(r.root, MAIN_PR, { ...q, io: f.io }) }; };
const imagesRow = '\n          - { name: reader-container, context: reader-container }';
const STYLE = [
  { via: 'plain', files: { '.github/workflows/container-images.yml': IMAGES(imagesRow) } },
  { via: 'plain', files: { '.github/workflows/regression.yml': REGRESSION(' site') } },
];

test('a close carries container-images.yml and regression.yml style changes that came through gated plain pull requests, bootstrap or not', () => {
  for (const bootstrap of [true, false]) {
    const r = product({ bootstrap, steps: STYLE });
    const c = close(r);
    assert.equal(c.go().merged, true, `bootstrap ${bootstrap}`);
    assert.equal(c.f.calls.merged.sha, r.sha);
  }
});

test('a close carries a workflow change that came through a gated job merge', () => {
  const r = product({ ledger: ['m0'], steps: [{ via: 'job', id: 'm0', files: { '.github/workflows/regression.yml': REGRESSION(' site') } }] });
  assert.equal(close(r).go().merged, true);
});

test('a workflow change that came in by an ungated commit is refused, naming rule 1', () => {
  const direct = product({ steps: [{ via: 'direct', files: { '.github/workflows/regression.yml': REGRESSION(' site') } }] });
  const c = close(direct);
  assert.throws(c.go, /changes \.github\/workflows\/regression\.yml: rule 1: it was changed by [0-9a-f]{10}, a direct commit on tranche/);
  assert.equal(c.f.calls.merged, null);
  // Through a plain PR whose gate was red, or whose row is not verified.
  assert.throws(close(product({ steps: [{ ...STYLE[1], red: true }] })).go, /rule 1: .*newest gate run on its head [0-9a-f]{10} is red/);
  assert.throws(close(product({ steps: [{ ...STYLE[1], unverified: true }] })).go, /rule 1: .*not bound to the PR or not verified/);
  // A gated PR, then a direct commit over it.
  const over = product({ steps: [STYLE[1], { via: 'direct', files: { '.github/workflows/regression.yml': REGRESSION(' site agent') } }] });
  assert.throws(close(over).go, /rule 1: .*a direct commit on tranche/);
  // A merge that resolved the file to other bytes than the gated head's.
  const evil = product({ steps: [{ ...STYLE[1], evil: { '.github/workflows/regression.yml': REGRESSION(' evil') } }] });
  assert.throws(close(evil).go, /rule 1: .*does not carry the file as the PR's gated head had it/);
  // The PR's branch had another PR into another base: its rows do not bind.
  const other = product({ steps: [STYLE[1]] });
  const o = close(other);
  o.f.io.prsFromBranch = (s, b) => [...other.prs.values(), { number: 99, head: { ref: b }, base: { ref: 'main' } }].filter((x) => x.head.ref === b);
  assert.throws(o.go, /rule 1: .*also had pull request\(s\) 99 into another base/);
  // A job merge whose gate was red.
  const job = product({ ledger: ['m0'], steps: [{ via: 'job', id: 'm0', red: true, files: { '.github/workflows/regression.yml': REGRESSION(' site') } }] });
  assert.throws(close(job).go, /rule 1: .*is PR 10's merge, but the newest gate run on its merged result/);
});

test('process-gate.yml must still be the pin\'s own shim at a close (rule 4); plain pull requests into the tranche stay shim-only', () => {
  const r = product({ steps: [{ via: 'plain', files: { '.github/workflows/process-gate.yml': SHIM + '# edited\n' } }] });
  assert.throws(close(r).go, /process-gate\.yml is not the process's own shim at aaaaaaaaaa \(rule 4\)/);
});

test('main merged into the tranche passes a workflow file it leaves as main has it, and not one it resolves otherwise', () => {
  const build = (resolve) => {
    const r = product({ steps: [STYLE[1]] });
    // main moves on (a workflow edit on main itself), and the tranche takes main in.
    git(['checkout', '-q', 'main'], { cwd: r.root });
    commit(r.root, { '.github/workflows/container-images.yml': IMAGES('\n          - { name: on-main, context: x }') }, 'main moves');
    git(['checkout', '-q', 'tranche'], { cwd: r.root });
    git(['merge', '-q', '--no-ff', 'main', '-m', 'Bring main in'], { cwd: r.root });
    if (resolve) { commit(r.root, { '.github/workflows/container-images.yml': resolve }, 'x'); git(['reset', '-q', '--soft', 'HEAD~1'], { cwd: r.root }); git(['commit', '-q', '--amend', '--no-edit'], { cwd: r.root }); }
    r.sha = git(['rev-parse', 'HEAD'], { cwd: r.root });
    git(['push', '-q', '-f', 'origin', 'main', 'tranche'], { cwd: r.root });
    git(['checkout', '-q', 'main'], { cwd: r.root });
    return r;
  };
  assert.equal(close(build(null)).go().merged, true);
  assert.throws(close(build(IMAGES('\n          - { name: smuggled, context: x }'))).go, /container-images\.yml: rule 1: it was changed by [0-9a-f]{10}, which is not a merge of a pull request/);
});

test('coordinator, 4 Nov 08:13: a take-in tip does not mark a direct commit as earlier work', () => {
  // A direct post-setup commit D, then a job whose start row names D as its take-in tip.
  const r = product({ ledger: ['m0'], steps: [
    { via: 'direct', files: { '.github/workflows/regression.yml': REGRESSION(' site') } },
    { via: 'job', id: 'm0', files: (d) => ({ 'process/metrics/m0.jsonl': JSON.stringify({ event: 'start', take_in: { tip: d } }) + '\n' }) },
  ] });
  assert.throws(close(r).go, /regression\.yml: rule 1: it was changed by [0-9a-f]{10}, a direct commit on tranche/);
});

// The copy's two real diffs (civicsmith-copy main 0dea5a6e against tranche 3e095aa5).
const FIX = (n) => readFileSync(join(import.meta.dirname, 'fixtures', 'close-workflows', n), 'utf8');
const shape = (head, base) => workflowShapes(head, base);
const NONE = /rule 3: the hunk at base line \d+ .* fits no allowed shape/;

test('coordinator, 4 Nov 08:24: the copy\'s two real workflow diffs fit the allowed shapes', () => {
  assert.equal(shape(FIX('tranche-container-images.yml'), FIX('main-container-images.yml')), null, 'S2 paths, S3 a matrix row');
  assert.equal(shape(FIX('tranche-regression.yml'), FIX('main-regression.yml')), null, 'S1 inside run blocks, comments included');
  assert.equal(shape(FIX('main-regression.yml'), FIX('main-regression.yml')), null, 'no change');
});

test('coordinator, 4 Nov 08:24: every bypass of the four review rounds fits no shape', () => {
  const B = REGRESSION();
  const add = (after, lines) => B.replace(after, `${after}${lines}`);
  for (const head of [
    B + '  gate:\n    runs-on: x\n',
    B.replace('permissions:\n  contents: read\n', 'permissions:\n  contents: write\n'),
    B.replace('on:\n  workflow_dispatch:\n', 'on:\n  pull_request_target:\n'),
    B.replace('on:\n  workflow_dispatch:\n', 'on:\n- workflow_dispatch\n- "pull_request_\\x74arget"\n'),
    B.replace('jobs:\n', '"j\\x6fbs":\n  build:\n    permissions: write-all\njobs:\n'),
    add('    runs-on: ubuntu-latest\n', '    name: >-\n      gate\n'),
    add('    runs-on: ubuntu-latest\n', '    strategy:\n      matrix:\n        os: [ubuntu-latest]\n'),
    add('    runs-on: ubuntu-latest\n', '    !!str permissions: write-all\n'),
    add('    runs-on: ubuntu-latest\n', '    env:\n      X: "1\n    permissions: {}\n    zz: "\n'),
    '{on: push, permissions: write-all, jobs: {gate: {runs-on: ubuntu-latest}}}\n',
    add('    runs-on: ubuntu-latest\n', '    # c\x85    permissions: write-all\n'),
  ]) assert.match(shape(head, B) || '', /rule 3: /, head);
  // A new or removed workflow fits no shape.
  assert.match(shape(B, null), /rule 3: it is a new workflow/);
});

test('coordinator, 4 Nov 08:24: S1 holds only lines inside an existing run block', () => {
  const B = REGRESSION();
  const inside = (l) => B.replace('        set -euo pipefail\n', `        set -euo pipefail\n${l}`);
  assert.equal(shape(inside('        echo more\n'), B), null);
  assert.equal(shape(inside('          deeper: is still script\n'), B), null);
  assert.equal(shape(inside('\n'), B), null);
  // A line less deep than the block's first line would end it; one at the step's level is a key.
  assert.match(shape(inside('      permissions: write-all\n'), B) || '', NONE);
  assert.match(shape(inside('       x\n'), B) || '', NONE);
  // After the block's last line, or before its first, is outside it.
  assert.match(shape(B.replace('        echo done\n', '        echo done\n        echo after\n'), B) || '', NONE);
  assert.match(shape(B.replace('    - run: |\n', '    - run: |\n        echo first\n'), B) || '', NONE);
  // Not plain ASCII, or a tab.
  assert.match(shape(inside('        echo caf\u00e9\n'), B) || '', /outside printable ASCII/);
  assert.match(shape(inside('        \techo\n'), B) || '', NONE);
  // A run block with an explicit indentation indicator is not one S1 reads.
  const ind = B.replace('    - run: |\n', '    - run: |2\n');
  assert.match(shape(ind.replace('        set -euo pipefail\n', '        set -euo pipefail\n        x\n'), ind) || '', NONE);
});

test('coordinator, 4 Nov 08:24: S2 holds only quoted paths inside an existing multi-line paths list', () => {
  const B = IMAGES();
  const ins = (l) => B.replace('    paths: ["agent-runner/Dockerfile",\n', `    paths: ["agent-runner/Dockerfile",\n${l}`);
  assert.equal(shape(ins('            "reader/src/**",\n'), B), null);
  assert.equal(shape(ins('            "a/b", "c/*.json",\n'), B), null);
  for (const l of ['            "a: b",\n', '            "a{b}",\n', '            "a\\"b",\n', '            a/b,\n', '            "a/b"], other: [\n', '        "a/b",\n'])
    assert.match(shape(ins(l), B) || '', NONE, l);
  // Not into branches (it would widen where a write token runs), and not after the list.
  const br = B.replace('    branches: ["dist/cut-*"]\n', '    branches: ["dist/cut-*",\n               "x"]\n');
  assert.match(shape(br.replace('               "x"]\n', '               "main",\n               "x"]\n'), br) || '', NONE);
  assert.match(shape(B.replace('  workflow_dispatch:\n', '            "x",\n  workflow_dispatch:\n'), B) || '', NONE);
});

test('coordinator, 4 Nov 08:24: S3 holds only a matrix row with a sibling row\'s keys', () => {
  const B = IMAGES();
  const row = '          - { name: agent-runner, context: agent-runner }';
  const plus = (l) => B.replace(`${row}\n`, `${row}\n${l}`);
  assert.equal(shape(plus('          - { context: b, name: a }\n'), B), null);
  assert.match(shape(plus('          - { name: a, context: b, run: c }\n'), B) || '', NONE);
  assert.match(shape(plus('          - { name: a }\n'), B) || '', NONE);
  assert.match(shape(plus('          - { name: a, context: "b c" }\n'), B) || '', NONE);
  assert.match(shape(plus('          - { name: a, context: ${{ x }} }\n'), B) || '', NONE);
  assert.match(shape(plus('        - { name: a, context: b }\n'), B) || '', NONE);
  // A hunk that mixes a row with any other line.
  assert.match(shape(plus('          - { name: a, context: b }\n    permissions: write-all\n'), B) || '', NONE);
});

test('coordinator, 4 Nov 08:24: through mergePlain, a shape-breaking change refuses the close, naming the file and the hunk', () => {
  const r = product({ steps: [{ via: 'plain', files: { '.github/workflows/regression.yml': REGRESSION() + '  gate:\n    runs-on: x\n' } }] });
  assert.throws(close(r).go, /changes \.github\/workflows\/regression\.yml: rule 3: the hunk at base line \d+ .*fits no allowed shape/);
  const n = product({ steps: [{ via: 'plain', files: { '.github/workflows/new.yml': 'on: push\n' } }] });
  assert.throws(close(n).go, /new\.yml: rule 3: it is a new workflow/);
  // A pre-Process3 edit is judged by the shapes too.
  const pre = product({ pre: [{ '.github/workflows/regression.yml': REGRESSION() + '  gate:\n    runs-on: x\n' }] });
  assert.throws(close(pre, { owned: pre.setAt }).go, /regression\.yml: rule 3: .*fits no allowed shape/);
  const ok = product({ pre: [{ '.github/workflows/regression.yml': REGRESSION(' site') }] });
  assert.equal(close(ok, { owned: ok.setAt }).go().merged, true);
  assert.throws(close(ok).go, /regression\.yml: rule 1: it was changed by [0-9a-f]{10}, a direct commit on tranche/);
});

test('the rule 1 gate checks: a PR whose gate ran on its own process-gate.yml certifies nothing', () => {
  const fake = { '.github/workflows/process-gate.yml': 'name: fake\non: pull_request\n' };
  const p = product({ steps: [{ via: 'plain', files: { ...fake, '.github/workflows/regression.yml': REGRESSION(' site') } }, { via: 'plain', files: { '.github/workflows/process-gate.yml': SHIM } }] });
  assert.throws(close(p).go, /regression\.yml: rule 1: .*PR 10's merge, but [0-9a-f]{10}, which its gate ran on, does not hold the pin's own process-gate\.yml/);
  const j = product({ ledger: ['m0'], steps: [{ via: 'job', id: 'm0', files: { ...fake, '.github/workflows/regression.yml': REGRESSION(' site') } }, { via: 'plain', files: { '.github/workflows/process-gate.yml': SHIM } }] });
  assert.throws(close(j).go, /regression\.yml: rule 1: .*PR 10's merge, but [0-9a-f]{10}, which its gate ran on/);
});

test('plain text only: line breaks other than \\n, a BOM past the start, new non-ASCII lines are refused', () => {
  const B = REGRESSION();
  const inside = (l) => B.replace('        set -euo pipefail\n', `        set -euo pipefail\n${l}`);
  for (const [l, re] of [['        a\r\n', /U\+000D/], ['        a\u2028\n', /U\+2028/], ['        a\u2029\n', /U\+2029/], ['        a\x85\n', /U\+0085/], ['        \ufeffa\n', /byte-order mark/]])
    assert.match(shape(inside(l), B) || '', re, JSON.stringify(l));
  assert.equal(shape(`\ufeff${inside('        a\n')}`, B), null);
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
