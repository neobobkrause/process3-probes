// ===== file: bookkeeping.test.mjs (continued) =====

  const { root, bare } = product();
  bookkeep(root, SB, 'starts owed: merge 11', 'owe', { path: OWED_FILE, act: 'merge 11', at: now() });
  stateIO.push = () => ({ code: 1, stderr: 'remote: refused for the test' });
  try { assert.throws(() => writeState(root, SB, 'a write', (dir) => { writeFileSync(join(dir, 'k.txt'), 'k\n'); return {}; }), /state replay/); } finally { delete stateIO.push; }
  assert.deepEqual(readOwed(root, SB).acts.map((a) => a.act), ['merge 11'], 'still waiting in the clone');
  stateReplay(root, SB, [], { log: () => {} });
  git(['fetch', '-q', 'origin', `+refs/heads/${SB}:refs/remotes/origin/${SB}`], { cwd: root });
  assert.equal(readState(root, SB, 'k.txt'), 'k\n', 'the kept write replayed');
  assert.equal(readState(root, SB, OWED_FILE), null, 'the replay carried no records');
  stateBatch(true);
  try { writeState(root, SB, 'later', (dir) => { writeFileSync(join(dir, 'l.txt'), 'l\n'); return {}; }); flushState(); } finally { stateBatch(false); }
  git(['fetch', '-q', 'origin', `+refs/heads/${SB}:refs/remotes/origin/${SB}`], { cwd: root });
  assert.deepEqual(JSON.parse(readState(root, SB, OWED_FILE)).acts.map((a) => a.act), ['merge 11'], 'once');
  assert.ok(bare);
});


test('a batched flush refused to the end keeps its own writes for replay and leaves the waiting records waiting, never in both', () => {
  const { root, bare } = product();
  bookkeep(root, SB, 'starts owed: merge 12', 'owe', { path: OWED_FILE, act: 'merge 12', at: now() });
  const before = pushes(bare);
  stateIO.push = () => ({ code: 1, stderr: 'remote: refused for the test' });
  stateBatch(true);
  try {
    writeState(root, SB, 'a real write', (dir) => { writeFileSync(join(dir, 'r.txt'), 'r\n'); return {}; });
    assert.throws(() => flushState(), /state replay/);
  } finally { stateBatch(false); delete stateIO.push; }
  assert.equal(pushes(bare), before);
  const kept = git(['for-each-ref', '--format=%(refname)', 'refs/p3/unpushed/'], { cwd: root }).split('\n').filter(Boolean);
  assert.equal(kept.length, 1, 'the real write kept, alone');
  assert.equal(git(['log', '-1', '--format=%s', kept[0]], { cwd: root }), 'a real write');
  assert.deepEqual(readOwed(root, SB).acts.map((a) => a.act), ['merge 12'], 'the record still waiting in the clone');
  stateReplay(root, SB, [], { log: () => {} });
  stateBatch(true);
  try { writeState(root, SB, 'next', (dir) => { writeFileSync(join(dir, 'n.txt'), 'n\n'); return {}; }); flushState(); } finally { stateBatch(false); }
  git(['fetch', '-q', 'origin', `+refs/heads/${SB}:refs/remotes/origin/${SB}`], { cwd: root });
  assert.deepEqual(JSON.parse(readState(root, SB, OWED_FILE)).acts.map((a) => a.act), ['merge 12'], 'pushed once');
});

// ===== file: close-workflows.test.mjs (later part) =====

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
