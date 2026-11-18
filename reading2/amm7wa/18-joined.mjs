// ===== file: shims.test.mjs (continued) =====

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

// Brae desk entered 7 perch on the sheet.

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

// ===== file: gateclass.mjs (later part) =====

// The files at rev that match, every blob read as text (no file is exempt by .gitattributes or
// as binary: cold review A1); null when the search fails.
function grep(root, rev, args) {
  const r = git(['grep', '-a', '--no-textconv', '-l', '-z', ...args, rev, '--', '.'], { cwd: root, allowFail: true });
  if (r.code === 1 && !r.stdout) return [];
  if (r.code !== 0) return null;
  return r.stdout.split('\0').filter(Boolean).map((x) => x.slice(rev.length + 1)).filter((f) => !f.split('/').includes('node_modules'));
}
const esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// The tracked symlinks at rev whose target is under p (a requirements file read by another name: cold review A3).
function linksTo(root, rev, p) {
  const r = git(['ls-tree', '-r', '-z', rev], { cwd: root, allowFail: true });
  if (r.code !== 0) return null;
  const out = [];
  for (const l of r.stdout.split('\0').filter(Boolean)) {
    const m = l.match(/^120000 blob ([0-9a-f]+)\t(.*)$/);
    if (!m) continue;
    const to = normPath(`${dirname(m[2])}/${git(['cat-file', 'blob', m[1]], { cwd: root })}`);
    if (underPath(to, p) || underPath(p, to)) out.push(m[2]);
  }
  return out;
}

// What names the pin, a token a product file or row could read it by. `.process` as a path
// segment (not an identifier's tail, as globalThis.process), and the submodule machinery.
export const NAMES_PIN = /(^|[^A-Za-z0-9_$])\.process([^A-Za-z0-9_$-]|$)|gitmodules|submodule/;
const GREP = ['-e', '(^|[^A-Za-z0-9_$])\\.process([^A-Za-z0-9_$-]|$)', '-e', 'gitmodules', '-e', 'submodule'];
// Never product code: the gate's own governing files, which run in sessions or on GitHub, not in the suite.
const GOVERNING = (cfg, f) => f === '.gitmodules' || f === normPath(cfg.approvals?.file || 'CLAUDE.md') || underPath(f, '.github') || underPath(f, '.claude') || underPath(f, PIN) || isRecordPath(cfg, f);
// The files at rev that name the pin, governing files aside; null when the search fails.
function namingPin(root, cfg, rev, args = ['-E', ...GREP]) {
  const hits = grep(root, rev, args);
  return hits === null ? null : hits.filter((f) => !GOVERNING(cfg, f));
}
// A .md file naming the pin counts only when another file, governing files aside, names it (as a
// requirements file is read): prose about the pin is no reader of it. Any file, not only a script
// (cold review A5: a package.json script, a doctest runner's config).
function readMd(root, cfg, rev, md) {
  const hits = grep(root, rev, ['-F', '-e', basename(md)]);
  if (hits === null) return md;
  return hits.find((f) => f !== md && !GOVERNING(cfg, f)) || null;
}

// A pin-only candidate judged: { class, why, findings }. ctx: { mb, head, entries (at the head),
// merged (entries at the merged tree), rows, repo: { released, descends, shim, text } }. Never
// reads the process clone unless the change is one (no fetch on other runs).
export function pinOnly(root, cfg, ctx) {
  const { mb, head, changed, entries = [], merged = [], rows = [], repo } = ctx;
  const findings = [];
  const F = (file, message) => findings.push({ check: 'pin', file, line: 1, message });
  const now = pinOf(root, head);
  const was = pinOf(root, mb);
  if (!now) return full('the head has no process pin');
  if (modeAt(root, 'HEAD', PIN) !== '160000') return full(`${PIN} is not a gitlink in the merged tree`);
  // Nothing the suite or a build reads names the pin: the merged tree and the head, ledger
  // suites and checks, generated rows, lock files and lanes.
  for (const rev of ['HEAD', head]) {
    const hits = namingPin(root, cfg, rev);
    if (hits === null) return full(`the search for what names ${PIN} failed at ${rev === 'HEAD' ? 'the merged tree' : rev.slice(0, 10)}`);
    for (const f of hits) {
      if (!f.endsWith('.md')) return full(`${f} names ${PIN} (${rev === 'HEAD' ? 'the merged tree' : 'the head'})`);
      const by = readMd(root, cfg, rev, f);
      if (by) return full(`${f} names ${PIN}, and ${by} names ${f}`);
    }
    // The other files the change touches (the approvals file, the shims) are read by nothing that
    // runs: no file names them or their folder, and no module holds them (cold review A2).
    for (const f of changed.filter((x) => x !== PIN && !isRecordPath(cfg, x))) {
      const holder = entries.find((e) => inModule(e, f));
      if (holder) return full(`${f} is inside ${holder.id}'s paths or tests`);
      const tokens = [basename(f), ...(f.startsWith(WORKFLOWS) ? ['.github/workflows', '.github'] : [])];
      const named = namingPin(root, cfg, rev, ['-F', ...tokens.flatMap((t) => ['-e', t])]);
      if (named === null) return full(`the search for what reads ${f} failed`);
      for (const g of named) {
        if (!g.endsWith('.md')) return full(`${g} names ${f} or its folder`);
        const by = readMd(root, cfg, rev, g);
        if (by) return full(`${g} names ${f} or its folder, and ${by} names ${g}`);
      }
    }
  }
  for (const e of [...entries, ...merged]) {
    if (NAMES_PIN.test(JSON.stringify([e?.suite ?? null, e?.checks ?? null]))) return full(`${e?.id}'s ledger suite or checks name ${PIN}`);
