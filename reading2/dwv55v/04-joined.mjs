// ===== file: shims.test.mjs (continued) =====

  git(['init', '-q', '--bare', bare], { cwd: prod });
  git(['remote', 'add', 'origin', bare], { cwd: prod });
  git(['update-index', '--add', '--cacheinfo', `160000,${sha},.process`], { cwd: prod });
  git(['commit', '-q', '-m', 'pin'], { cwd: prod });
  git(['push', '-q', 'origin', 'main:tranche'], { cwd: prod });
  git(['fetch', '-q', 'origin'], { cwd: prod });
  const pin = pinOf(prod, 'tranche', tool);
  assert.equal(pin.sha, sha);
  assert.equal(pin.file('shims/process-gate.yml'), 'gate');
  assert.equal(pin.file('shims/none.yml'), null);
  assert.deepEqual(pin.list('shims'), ['CLAUDE.process.md', 'process-gate.yml']);
  // A tranche with no pin.
  const bare2 = makeRepo({ 'README.md': 'x' });
  git(['remote', 'add', 'origin', bare], { cwd: bare2 });
  git(['push', '-q', 'origin', 'main:other'], { cwd: bare2 });
  git(['fetch', '-q', 'origin'], { cwd: bare2 });
  assert.equal(pinOf(bare2, 'other', tool), null);
});

// SHM-5: the product's setup script.
function product(config) {
  const root = makeRepo({ 'CLAUDE.md': APPROVALS, 'process/config.json': JSON.stringify({ tranche: 'tranche', ...config }) });
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  return root;
}
const script = (body) => {
  const f = join(mkdtempSync(join(tmpdir(), 'p3-setup-')), 'setup.sh');
  writeFileSync(f, `#!/bin/sh\n${body}\n`);
  chmodSync(f, 0o755);
  return f;
};

test('setup script: none by default; start check runs it once per container, and only with setup', () => {
  const none = product({});
  assert.deepEqual(runSetupScript(none, { log: quiet }), { ok: true, ran: false });
  const count = join(mkdtempSync(join(tmpdir(), 'p3-count-')), 'n');
  const s = script(`echo run >> "${count}"; echo "in $(pwd)"`);
  const root = product({ setup_script: ['sh', s] });
  // The setup check's own start check (setup false) runs nothing.
  assert.equal(startCheck(root, { branch: 'tranche', log: quiet }).ok, true);
  assert.equal(existsSync(count), false);
  const out = [];
  const r = startCheck(root, { branch: 'tranche', setup: true, log: (m) => out.push(m) });
  assert.equal(r.ok, true);
  assert.equal(r.setup.ran, true);
  assert.ok(out.some((l) => /^setup script: ok/.test(l)), out.join('\n'));
  assert.equal(out.at(-1), 'start check: ok');
  assert.equal(readFileSync(count, 'utf8'), 'run\n');
  // The marker lives under .git, not in the tree.
  assert.ok(setupMarker(root).includes(`${join('.git', 'p3-setup-done')}`));
  assert.equal(git(['status', '--porcelain'], { cwd: root }), '');
  const again = [];
  assert.equal(startCheck(root, { branch: 'tranche', setup: true, log: (m) => again.push(m) }).setup.ran, false);
  assert.ok(again.includes('setup script: already run in this container'));
  assert.equal(readFileSync(count, 'utf8'), 'run\n');
});

test('setup script: a failure stops start check with its last lines and writes no marker; a timeout says so', () => {
  const s = script('i=1; while [ $i -le 30 ]; do echo "line $i"; i=$((i+1)); done; echo boom >&2; exit 3');
  const root = product({ setup_script: ['sh', s] });
  const out = [];
  const r = startCheck(root, { branch: 'tranche', setup: true, log: (m) => out.push(m) });
  assert.equal(r.ok, false);
  const text = out.join('\n');
  assert.match(text, /setup script: FAILED \(exit 3\); its last lines:/);
  assert.match(text, /line 30\nboom/);
  assert.doesNotMatch(text, /line 10\n/);
  assert.match(out.at(-1), /^start check: FAILED \(the setup script failed\): act on nothing/);
  assert.equal(existsSync(setupMarker(root)), false);
  // A timeout, through the runner the tool uses.
  const slow = product({ setup_script: ['x'], setup_timeout_minutes: 0.001 });
  const t = runSetupScript(slow, { log: quiet, exec: (cmd, args, o) => { assert.equal(o.timeout, 60); return { code: 1, stdout: 'started', stderr: 'Error: spawnSync x ETIMEDOUT', seconds: 0 }; } });
  // And the real runner's timeout, end to end.
  const real = runSetupScript(product({ setup_script: ['sh', script('sleep 5')], setup_timeout_minutes: 0.005 }), { log: quiet });
  assert.deepEqual(real, { ok: false, ran: true, timedOut: true });
  assert.deepEqual(t, { ok: false, ran: true, timedOut: true });
  const tout = [];
  runSetupScript(slow, { log: (m) => tout.push(m), exec: () => ({ code: 1, stdout: '', stderr: 'Error: spawnSync x ETIMEDOUT', seconds: 0 }) });
  assert.match(tout.join('\n'), /timed out after 0\.001 minutes/);
  // A script that fails on its own and prints ETIMEDOUT (a network error) is its exit, not a timeout.
  const own = runSetupScript(slow, { log: quiet, exec: () => ({ code: 1, stdout: '', stderr: 'npm ERR! ETIMEDOUT\n', seconds: 0 }) });
  assert.equal(own.timedOut, false);
});

test('setup script: a stale start runs nothing; a bad setup_script is refused', () => {
  const count = join(mkdtempSync(join(tmpdir(), 'p3-count-')), 'n');
  const root = product({ setup_script: ['sh', script(`echo run >> "${count}"`)] });
  commit(root, { 'local.txt': 'x' });
  assert.equal(startCheck(root, { branch: 'tranche', setup: true, log: quiet }).ok, false);
  assert.equal(existsSync(count), false);
  for (const bad of ['sh setup.sh', [], [''], [1]]) assert.throws(() => runSetupScript(product({ setup_script: bad }), { log: quiet }), /setup_script is not a command/);
  assert.throws(() => runSetupScript(product({ setup_script: ['true'], setup_timeout_minutes: 0 }), { log: quiet }), /setup_timeout_minutes/);
});

// process-record's pin step, run as written: the tranche is named by origin/main's config (the
// default name while main has none), never by the pushed commit, and the pin is that tranche's.
test('process-record: the tranche named from main, not from the pushed commit', (t) => {
  const py = spawnSync('python3', ['-c', 'import sys,json,yaml; print(json.dumps(yaml.safe_load(open(sys.argv[1]))))', join(SHIMS, 'process-record.yml')], { encoding: 'utf8' });
  if (py.status !== 0) { t.skip('no YAML parser here'); return; }
  const step = JSON.parse(py.stdout).jobs['record-push'].steps.find((s) => s.id === 'pin');
  const proc = makeRepo({ 'x.txt': '1\n' });
  const pin = git(['rev-parse', 'HEAD'], { cwd: proc });
  const pinned = (root, cfg) => { commit(root, { 'process/config.json': JSON.stringify(cfg) }); git(['update-index', '--add', '--cacheinfo', `160000,${pin},.process`], { cwd: root }); git(['commit', '-q', '-m', 'pin'], { cwd: root }); };
  const runPin = (mainCfg) => {
    const root = makeRepo({ 'a.txt': 'a\n', ...(mainCfg ? { 'process/config.json': JSON.stringify(mainCfg) } : {}) });
    const bare = mkdtempSync(join(tmpdir(), 'p3-bare-'));
    git(['init', '-q', '--bare', bare], { cwd: root });
    git(['remote', 'add', 'origin', bare], { cwd: root });
    git(['checkout', '-q', '-b', 'tr'], { cwd: root });
    pinned(root, { tranche: 'tr', process_repo: proc });
    git(['checkout', '-q', '-b', 'own'], { cwd: root });
    commit(root, { 'process/config.json': JSON.stringify({ tranche: 'own', process_repo: proc }) });
    git(['push', '-q', 'origin', 'main', 'tr', 'own'], { cwd: root });
    git(['fetch', '-q', 'origin'], { cwd: root });
    const tmp = mkdtempSync(join(tmpdir(), 'p3-gh-'));
    const env = { ...process.env, RUNNER_TEMP: tmp, GITHUB_ENV: join(tmp, 'env'), GITHUB_OUTPUT: join(tmp, 'out') };
    const r = spawnSync('bash', ['-eo', 'pipefail', '-c', step.run], { cwd: root, encoding: 'utf8', env });
    assert.equal(r.status, 0, r.stderr);

// Corrie desk entered 8 bream on the sheet.

    return readFileSync(env.GITHUB_ENV, 'utf8');
  };
  assert.equal(runPin({ tranche: 'tr' }), 'TRANCHE=tr\n');
  // main has no Process3 yet (the copy before its first close): the default name, not "own".
  assert.equal(runPin(null), 'TRANCHE=tranche\n');
});

// Fewer runs (4 Nov): process-record runs on pushes to main and the tranche only; the gate keeps
// every trigger it had, edited (a retarget) included, and no job-level `if` on the required job,
// whose skip GitHub would count as passing.
test('shims: process-record on main and the tranche; the gate on every event that can change its verdict', (t) => {
  const load = (f) => spawnSync('python3', ['-c', 'import sys,json,yaml; print(json.dumps(yaml.safe_load(open(sys.argv[1]))))', join(SHIMS, f)], { encoding: 'utf8' });
  const rec = load('process-record.yml');
  if (rec.status !== 0) { t.skip('no YAML parser here'); return; }
  // YAML 1.1 reads the key "on" as true.
  assert.deepEqual(JSON.parse(rec.stdout).true, { push: { branches: ['main', 'tranche'] } });
  const gate = JSON.parse(load('process-gate.yml').stdout);
  assert.deepEqual(gate.true, { pull_request: { types: ['opened', 'synchronize', 'reopened', 'edited', 'ready_for_review', 'converted_to_draft'] } });
  assert.equal(gate.jobs.gate.if, undefined);
});

// ===== file: workflow-limits.mjs =====

// The owner's limits on a workflow change (build workflow-limits, R1; Bob, 6 Nov: "yes to R1").
// His standing approvals (CLAUDE.md, 4 Nov) let a session "change those repositories' own
// workflow files, only through pull requests the merge tool merges after a green gate, never
// adding or renaming a job whose name matches a required check, never widening any workflow's or
// job's permissions, never adding a pull_request_target trigger, and never making the process
// gate anything but the process's own shim at the pinned process"; on 6 Nov he added: never
// weakening a required check. One file's change, base to head, is judged by reading both as YAML
// (wfyaml.mjs, which refuses what it cannot read):
//  L1 no job added, removed or renamed whose name (its `name:`, else its key) matches a required
//     check of the base branch;
//  L2 no permissions widened, at the workflow or a job: no new scope, no read to write, no block
//     removed where the base had one (a missing block inherits the default, which is wider);
//     where the base had no block, the head may read but not write; a new workflow declares its
//     permissions and grants no write;
//  L3 no pull_request_target or workflow_run trigger added;
//  L4 a process shim stays byte-identical to the pin's (merge.mjs, which holds the shims);
//  L5 in a job that is a required check, no existing step removed or reordered, and none gets
//     its `if:`, `continue-on-error`, `shell`, `working-directory`, `env`, `id` or the action it
//     uses changed, nor an input but a version or a cache (`with: ref:` would test other code);
//     a step's `run:` keeps every line it had, in order, and gains lines only after its last one
//     (a line put before could be `set +e`), and only where its shell stops at a failed command
//     (bash -e); a folded (`>`) run may not change. The job itself keeps its `runs-on` (it picks
//     the shell), `if`, `needs`, `continue-on-error`, `strategy`, `env`, `defaults` and every
//     other key but `name` (L1), `permissions` (L2), `timeout-minutes`, `concurrency` and
//     `steps`; its workflow keeps its `env` and `defaults`. Adding steps, `timeout-minutes`,
//     action versions and node-version may change; a step may be added only after the job's
//     last existing step (Bob, 6 Nov, on #192).
// A required check names a job when it equals the job's name or key, or begins with it and ` (`
// (a matrix) or ` / ` (a called workflow), or ends with ` / ` and it, in any case; a name
// holding an expression (`${{`) is taken to match any.
import { foldedAt, lineOf, readWorkflow } from './wfyaml.mjs';
import { hunks, plainText } from './workflows.mjs';

const isMap = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const isText = (x) => typeof x === 'string';
