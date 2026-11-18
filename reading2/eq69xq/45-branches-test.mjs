  assert.deepEqual(heads(p), ['job/old-1', 'main', 'tranche']);
});

test('each delete is leased to the tip judged: a branch pushed to after the judgement is kept, and the row says so', () => {
  const p = product();
  branch(p, 'job/old-1');
  branch(p, 'job/old-2');
  const moved = (root, args) => {
    // Someone pushes to job/old-2 between the judgement and the delete.
    git(['checkout', '-q', '--detach', 'refs/remotes/origin/job/old-2'], { cwd: p.work });
    commitAt(p.work, { 'late.txt': 'late' }, 'late', {});
    git(['push', '-q', 'origin', 'HEAD:refs/heads/job/old-2'], { cwd: p.work });
    return git(['push', '--porcelain', ...args], { cwd: root, allowFail: true });
  };
  const r = runIt(p, { extra: { push: moved } });
  assert.deepEqual(r.deleted.map((d) => d.name), ['job/old-1']);
  assert.deepEqual(r.failed, ['job/old-2']);
  assert.equal(r.ok, true);
  assert.deepEqual(heads(p), ['job/old-2', 'main', 'process-state', 'tranche']);
  assert.deepEqual(rows(p)[0].failed, ['job/old-2']);
});

test('a push that deletes none of its candidates is a red run, its row written', () => {
  const p = product();
  branch(p, 'job/old-1');
  const r = runIt(p, { extra: { push: () => ({ code: 1, stdout: '', stderr: 'remote: Permission denied' }) } });
  assert.equal(r.ok, false);
  assert.deepEqual(rows(p)[0].failed, ['job/old-1']);
  assert.ok(heads(p).includes('job/old-1'));
});

test('the shim: daily and on dispatch, contents: write and pull-requests: read only, actions pinned by full commit, runs branches prune', () => {
  const shim = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'shims', 'process-branch-prune.yml'), 'utf8');
  assert.match(shim, /^on:\n {2}schedule:\n {4}# [^\n]*\n {4}- cron: '\d+ \d+ \* \* \*'\n {2}workflow_dispatch:/m);
  assert.match(shim, /^permissions: \{\}$/m);
  const perms = [...shim.matchAll(/^ {4}permissions:\n((?: {6}\S[^\n]*\n)+)/gm)].map((m) => m[1]);
  assert.deepEqual(perms, ['      contents: write\n      pull-requests: read\n']);
  const uses = [...shim.matchAll(/uses: (\S+)/g)].map((m) => m[1]);
  assert.ok(uses.length >= 2);
  for (const u of uses) assert.match(u, /@[0-9a-f]{40}$/, u);
  assert.doesNotMatch(shim, /pull_request_target/);
  // On the default branch, or dispatched on the tranche the default branch's config names; else skipped.
  assert.match(shim, /if \[ "\$GITHUB_REF" = "refs\/heads\/\$DEFAULT" \]; then on=\$DEFAULT\n\s+elif \[ "\$GITHUB_EVENT_NAME" = workflow_dispatch \] && \[ "\$GITHUB_REF" = "refs\/heads\/\$tranche" \]; then on=\$tranche\n\s+else [^\n]*skip=1/);
  assert.match(shim, /pin=\$\(git rev-parse -q --verify "\$base:\.process"\)/);
  assert.doesNotMatch(shim, /HEAD:/);
  assert.match(shim, /p3\.mjs" branches prune --ref "\$GITHUB_REF" --run "\$GITHUB_RUN_ID" \$DRY_RUN$/m);
});

test('deletes only in the product\'s shim on the default branch: a local run, another event or another workflow is refused', () => {
  const p = product();
  branch(p, 'job/old-1');
  const refused = (extra, re) => assert.throws(() => runIt(p, { extra }), (e) => e instanceof Fail && re.test(e.message) && /nothing was deleted/.test(e.message));
  refused({ ref: undefined }, /not a run with no --ref/);
  refused({ env: {} }, /it is not a GitHub Actions run/);
  refused({ env: { ...shimEnv(), GITHUB_EVENT_NAME: 'push' } }, /its event is push/);
  refused({ env: { ...shimEnv(), GITHUB_REF: 'refs/heads/job/old-1' } }, /it runs on refs\/heads\/job\/old-1/);
  refused({ env: { ...shimEnv(), GITHUB_WORKFLOW_REF: `${SLUG}/.github/workflows/other.yml@refs/heads/main` } }, /its workflow is/);
  assert.ok(heads(p).includes('job/old-1'));
  // A dry run lists from anywhere.
  assert.deepEqual(runIt(p, { extra: { ref: undefined, env: {}, dryRun: true } }).candidates.map((c) => c.name), ['job/old-1']);
});

test('kept as recent: a branch at the tranche tip, and one whose activity entry has no readable time', () => {
  const p = product();
  branch(p, 'job/odd-time');
  branch(p, 'job/just-cut', { atTip: true });
  const r = runIt(p, { activity: [{ ref: 'refs/heads/job/odd-time', timestamp: 'not a time', activity_type: 'push' }] });
  assert.deepEqual(r.deleted, []);
  assert.equal(r.kept.recent, 2);
});

test('a pull request opened after the judgement keeps its branch; an unreadable re-read deletes nothing more', () => {
  const p = product();
  branch(p, 'job/old-1');
  branch(p, 'job/old-2');
  const r = runIt(p, { openPulls: () => [pr(5, 'x', 'open', { base: 'job/old-2' })] });
  assert.deepEqual(r.deleted.map((d) => d.name), ['job/old-1']);
  assert.deepEqual(r.failed, ['job/old-2']);
  const q = product();
  branch(q, 'job/old-1');
  const n = runIt(q, { openPulls: () => null });
  assert.deepEqual(n.deleted, []);
  assert.ok(heads(q).includes('job/old-1'));
});

test('githubIO: the paginated reads flattened, and null for a failed or odd read', () => {
  const calls = [];
  const io = githubIO((args) => { calls.push(args.join(' ')); return args.includes('--slurp') ? [[{ n: 1 }], [{ n: 2 }]] : { default_branch: 'main' }; });
  assert.equal(io.defaultBranch(SLUG), 'main');
  assert.deepEqual(io.pulls(SLUG), [{ n: 1 }, { n: 2 }]);
  assert.deepEqual(io.openPulls(SLUG), [{ n: 1 }, { n: 2 }]);
  assert.deepEqual(io.activity(SLUG), [{ n: 1 }, { n: 2 }]);
  assert.deepEqual(calls, ['api repos/o/r', 'api --paginate --slurp repos/o/r/pulls?state=all&per_page=100', 'api --paginate --slurp repos/o/r/pulls?state=open&per_page=100', 'api --paginate --slurp repos/o/r/activity?time_period=day&per_page=100']);
  const bad = githubIO(() => null);
  assert.equal(bad.defaultBranch(SLUG), null);
  assert.equal(bad.pulls(SLUG), null);
  assert.equal(githubIO(() => [{ not: 'pages' }]).activity(SLUG), null);
});


test('dispatched on the tranche: the tranche\'s approvals and config judge; a schedule there, another workflow ref or a config naming another tranche is refused', () => {
  const tEnv = (over = {}) => ({ ...shimEnv(), GITHUB_EVENT_NAME: 'workflow_dispatch', GITHUB_REF: 'refs/heads/tranche', GITHUB_WORKFLOW_REF: `${SLUG}/.github/workflows/process-branch-prune.yml@refs/heads/tranche`, ...over });
  // Bob's sentence on the tranche only (main moves at a round close).
  const p = product({ claude: approvalsWith() });
  git(['checkout', '-q', '--detach', 'main'], { cwd: p.work });
  commitAt(p.work, { 'CLAUDE.md': APPROVED }, 'the sentence on the tranche', old);
  git(['push', '-q', 'origin', 'HEAD:refs/heads/tranche'], { cwd: p.work });
  branch(p, 'job/old-1');
  const on = (env) => runIt(p, { extra: { ref: 'refs/heads/tranche', env } });
  assert.throws(() => on(tEnv({ GITHUB_EVENT_NAME: 'schedule' })), (e) => e instanceof Fail && /dispatched on tranche, and its event is schedule, not workflow_dispatch/.test(e.message));
  assert.throws(() => on(tEnv({ GITHUB_WORKFLOW_REF: `${SLUG}/.github/workflows/process-branch-prune.yml@refs/heads/main` })), (e) => e instanceof Fail && /its workflow is/.test(e.message));
  assert.throws(() => on(tEnv({ GITHUB_REF: 'refs/heads/main' })), (e) => e instanceof Fail && /it runs on refs\/heads\/main, not refs\/heads\/tranche/.test(e.message));
  assert.ok(heads(p).includes('job/old-1'));
  // The same branch's run on main is not approved: main lacks the sentence.
  assert.equal(runIt(p).approved, false);
  const r = on(tEnv());
  assert.equal(r.approved, true);
  assert.deepEqual(r.deleted.map((d) => d.name), ['job/old-1']);
  assert.equal(rows(p)[0].on, 'tranche');
  // The tranche's config naming another tranche than main's: refused.
  const q = product();
  git(['checkout', '-q', '--detach', 'main'], { cwd: q.work });
  commitAt(q.work, { 'process/config.json': JSON.stringify({ tranche: 'other' }) }, 'renamed', old);
  git(['push', '-q', 'origin', 'HEAD:refs/heads/tranche'], { cwd: q.work });
  assert.throws(() => runIt(q, { extra: { ref: 'refs/heads/tranche', env: tEnv() } }), (e) => e instanceof Fail && /tranche's config names the tranche other, main's names tranche/.test(e.message));
});

test('a tranche run whose config names another state branch than the default branch\'s is refused', () => {
  const p = product({ config: { tranche: 'tranche', state_branch: 'st' } });
  git(['checkout', '-q', '--detach', 'main'], { cwd: p.work });
  commitAt(p.work, { 'process/config.json': JSON.stringify({ tranche: 'tranche' }) }, 'drops state_branch', old);
  git(['push', '-q', 'origin', 'HEAD:refs/heads/tranche'], { cwd: p.work });
  branch(p, 'st');
  const env = { ...shimEnv(), GITHUB_EVENT_NAME: 'workflow_dispatch', GITHUB_REF: 'refs/heads/tranche', GITHUB_WORKFLOW_REF: `${SLUG}/.github/workflows/process-branch-prune.yml@refs/heads/tranche` };
  assert.throws(() => runIt(p, { extra: { ref: 'refs/heads/tranche', env } }), (e) => e instanceof Fail && /names the state branch process-state, main's names st/.test(e.message));
  assert.ok(heads(p).includes('st'));
});

test('the shim\'s pin step, run: a schedule on the default branch runs (the default branch read from GitHub, not the event); other refs skip; a bad process_repo stops', () => {
  const shim = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'shims', 'process-branch-prune.yml'), 'utf8');
  assert.doesNotMatch(shim, /github\.event\.repository\.default_branch/);
  const m = shim.match(/ {6}- name: the process pin\n[\s\S]*? {8}run: \|\n((?: {10}.*\n)+)/);
  const script = m[1].split('\n').map((l) => l.slice(10)).join('\n');
  const dir = mkdtempSync(join(tmpdir(), 'p3-shim-'));
  const bin = join(dir, 'bin');
  mkdirSync(bin);
  writeFileSync(join(bin, 'gh'), '#!/bin/sh\necho main\n', { mode: 0o755 });
  writeFileSync(join(dir, 'step.sh'), script);
  const p = product();
  const proc = makeRepo();
  commitAt(proc, { 'tool/p3.mjs': '' }, 'process', old);
  const procSha = git(['rev-parse', 'HEAD'], { cwd: proc });
  // main and the tranche pin the process commit, and name a process_repo on github.com that the
  // fake clone below serves from the local repository.
  git(['checkout', '-q', '--detach', 'main'], { cwd: p.work });
  git(['update-index', '--add', '--cacheinfo', `160000,${procSha},.process`], { cwd: p.work });
  write2(p.work, 'process/config.json', JSON.stringify({ tranche: 'tranche', process_repo: 'https://github.com/o/process3' }));
  git(['add', 'process/config.json'], { cwd: p.work });
  git(['commit', '-q', '-m', 'pin'], { cwd: p.work, env: old });
  git(['push', '-q', 'origin', 'HEAD:refs/heads/main', 'HEAD:refs/heads/tranche'], { cwd: p.work });
  const c = clone(p);
  const out = join(dir, 'out');
  const runStep = (event, ref) => {
    writeFileSync(out, '');
    return spawnSync('bash', ['-e', join(dir, 'step.sh')], { cwd: c, encoding: 'utf8', env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, GITHUB_OUTPUT: out, GITHUB_EVENT_NAME: event, GITHUB_REF: ref, GITHUB_REPOSITORY: SLUG, RUNNER_TEMP: dir, GIT_CONFIG_COUNT: '1', GIT_CONFIG_KEY_0: 'url.' + proc + '.insteadOf', GIT_CONFIG_VALUE_0: 'https://github.com/o/process3' } });
  };
  const r = runStep('schedule', 'refs/heads/main');
  assert.equal(r.status, 0, r.stderr + r.stdout);
  assert.match(readFileSync(out, 'utf8'), /^node=22$/m);
  assert.doesNotMatch(readFileSync(out, 'utf8'), /skip=1/);
  for (const [event, ref] of [['schedule', 'refs/heads/tranche'], ['workflow_dispatch', 'refs/heads/other']]) {
    const s = runStep(event, ref);
    assert.equal(s.status, 0);
    assert.match(readFileSync(out, 'utf8'), /skip=1/, `${event} ${ref}`);
  }
  // A process_repo off github.com stops the run.
  git(['checkout', '-q', '--detach', 'refs/remotes/origin/main'], { cwd: p.work });
  write2(p.work, 'process/config.json', JSON.stringify({ tranche: 'tranche', process_repo: '--upload-pack=touch /tmp/x' }));
  git(['add', 'process/config.json'], { cwd: p.work });
  git(['commit', '-qm', 'bad repo'], { cwd: p.work, env: old });
  git(['push', '-q', 'origin', 'HEAD:refs/heads/main'], { cwd: p.work });
  git(['fetch', '-q', 'origin'], { cwd: c });
  rmSync(join(dir, 'process3'), { recursive: true, force: true });
  const bad = runStep('schedule', 'refs/heads/main');
  assert.notEqual(bad.status, 0, bad.stdout + bad.stderr + readFileSync(out, "utf8"));
  assert.match(bad.stdout, /process_repo is not a github\.com repository/);
