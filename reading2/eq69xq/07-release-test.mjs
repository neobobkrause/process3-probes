  // Recorded as a known gap: the tip moves past the deploy row, and the release goes on.
  push(root, { 'build/round.md': `- [ ] C-1 · whole product · layout gap deferred: known gap, p3dev-l2 ${t1.slice(0, 10)}\n` });
  const r = releaseDev(root, { io, slug, log: quiet });
  assert.equal(r.ok, true);
  assert.notEqual(r.commit, t1);
  // plan close: the last round, closed now, with its deploy row.
  const { root: r2 } = withOrigin(product());
  push(r2, { 'process/config.json': { release: REL, plan: 'close' } });
  assert.throws(() => releaseDev(r2, { io, slug, log: quiet }), /the last round \(plan close\) is closed but not yet walked/);
  deployed(r2, git(['rev-parse', 'origin/tranche'], { cwd: r2 }));
  assert.equal(releaseDev(r2, { io, slug, log: quiet }).ok, true);
});

test('release dev --record: one row per run on the state branch, with the draft release and the checks; a second record refused', () => {
  const { root, bare } = withOrigin(product());
  const sha = git(['rev-parse', 'HEAD'], { cwd: root });
  const body = releaseBody('/nonexistent', { version: '0.4.0', commit: sha }).replace('"checks": null', '"checks": [{"name": "npm test", "exit": 0, "seconds": 9}]');
  const rio = {
    getRun: (s, id) => ({ id, path: '.github/workflows/process-dev-release.yml', status: 'completed', conclusion: 'success', event: 'workflow_dispatch', head_branch: 'tranche', display_title: 'p3dev-release 0.4.0', head_sha: sha, html_url: `https://github.com/o/p/actions/runs/${id}` }),
    jobs: () => [{ name: 'checks', conclusion: 'success' }, { name: 'assemble', conclusion: 'success' }, { name: 'publish', conclusion: 'success' }],
    releases: () => [{ tag_name: 'p3dev-0.4.0', draft: true, html_url: 'https://github.com/o/p/releases/tag/untagged-1', body, assets: [{ name: 'a.tgz' }] }],
  };
  const out = [];
  const r = releaseDev(root, { record: 'https://github.com/o/p/actions/runs/77', io: rio, slug, log: (m) => out.push(m) });
  const row = JSON.parse(git(['show', `process-state:${RELEASES_FILE}`], { cwd: bare }));
  assert.deepEqual(row, r.row);
  assert.equal(row.version, '0.4.0');
  assert.equal(row.commit, sha);
  assert.equal(row.run, 77);
  assert.equal(row.conclusion, 'success');
  assert.deepEqual(row.release, { url: 'https://github.com/o/p/releases/tag/untagged-1', draft: true, assets: ['a.tgz'] });
  assert.deepEqual(row.checks, [{ name: 'npm test', exit: 0, seconds: 9 }]);
  assert.equal(row.jobs.length, 3);
  assert.match(out.join('\n'), /recorded development release 0\.4\.0 .*: success; draft release https/);
  assert.throws(() => releaseDev(root, { record: 'https://github.com/o/p/actions/runs/77', io: rio, slug, log: quiet }), /run 77 is already recorded/);
  // A failed run is recorded too, with no release; another workflow's run or an unfinished one is refused.
  const failed = releaseDev(root, { record: '78', io: { ...rio, getRun: (s, id) => ({ ...rio.getRun(s, id), conclusion: 'failure' }) }, slug, log: quiet });
  assert.equal(failed.row.release, null);
  assert.throws(() => releaseDev(root, { record: '79', io: { ...rio, getRun: (s, id) => ({ ...rio.getRun(s, id), path: '.github/workflows/x.yml' }) }, slug, log: quiet }), /not \.github\/workflows\/process-dev-release\.yml/);
  assert.throws(() => releaseDev(root, { record: '79', io: { ...rio, getRun: (s, id) => ({ ...rio.getRun(s, id), status: 'in_progress' }) }, slug, log: quiet }), /has not finished/);
  // Only a dispatch on the tranche, titled with its version.
  assert.throws(() => releaseDev(root, { record: '79', io: { ...rio, getRun: (s, id) => ({ ...rio.getRun(s, id), event: 'push', head_branch: 'p3dev-release/0.4.0' }) }, slug, log: quiet }), /run 79 is a push on p3dev-release\/0\.4\.0, not a dispatch on tranche/);
  assert.throws(() => releaseDev(root, { record: '79', io: { ...rio, getRun: (s, id) => ({ ...rio.getRun(s, id), head_branch: 'job/x' }) }, slug, log: quiet }), /not a dispatch on tranche/);
  assert.throws(() => releaseDev(root, { record: '79', io: { ...rio, getRun: (s, id) => ({ ...rio.getRun(s, id), display_title: 'other' }) }, slug, log: quiet }), /titled "other", not p3dev-release <version>/);
  assert.throws(() => releaseDev(root, { record: '79', io: { ...rio, getRun: (s, id) => ({ ...rio.getRun(s, id), display_title: 'p3dev-release a/b' }) }, slug, log: quiet }), /the version must be/);
  assert.throws(() => releaseDev(root, { record: '79', io: { ...rio, releases: () => [] }, slug, log: quiet }), /no release has the tag p3dev-0\.4\.0/);
  assert.throws(() => releaseDev(root, { record: 'not-a-run', io: rio, slug, log: quiet }), /--record <run url>/);
});

test('release run: each check within its timeout, results written; the assemble must write release.out', () => {
  const ok = ['node', '-e', 'process.exit(0)'];
  const root = makeRepo({ 'process/config.json': { release: { checks: [ok, { name: 'bad', argv: ['node', '-e', 'process.exit(3)'] }], assemble: ['node', '-e', "require('fs').mkdirSync('rel/sub',{recursive:true});require('fs').writeFileSync('rel/sub/a.txt','x')"], out: 'rel' } } });
  const out = join(root, '..', 'checks.json');
  const r = releaseRun(root, 'checks', { out, log: quiet });
  assert.equal(r.ok, false);
  assert.deepEqual(r.results.map((x) => [x.name, x.exit]), [['node -e process.exit(0)', 0], ['bad', 3]]);
  assert.deepEqual(JSON.parse(readFileSync(out, 'utf8')).checks.map((x) => x.exit), [0, 3]);
  // The GitHub tokens never reach the product's commands.
  const seen = [];
  releaseRun(root, 'checks', { log: quiet, exec: (c, a, o) => { seen.push(o.unset); return { code: 0, stdout: '', stderr: '', seconds: 0 }; } });
  assert.ok(seen.every((u) => u.includes('GITHUB_TOKEN') && u.includes('GH_TOKEN')));
  assert.equal(releaseRun(root, 'assemble', { log: quiet }).ok, true);
  assert.ok(existsSync(join(root, 'rel/sub/a.txt')));
  const empty = makeRepo({ 'process/config.json': { release: { checks: [ok], assemble: ok, out: 'rel' } } });
  const e = releaseRun(empty, 'assemble', { log: quiet });
  assert.equal(e.ok, false);
  assert.match(e.results.at(-1).message, /the assemble wrote no files to rel/);
  assert.throws(() => releaseRun(empty, 'publish', { log: quiet }), /release run checks \| release run assemble/);
});

test('release run: a check that prints 1,600 lines keeps every line in its file; the log says how many were cut and where', () => {
  const long = { name: 'long', argv: ['node', '-e', "console.log('::add-mask::k3y' + 'v'); for (let i = 1; i <= 1600; i++) console.log('line ' + i + ' ' + 'y'.repeat(20) + (i === 1 ? ' k3y' + 'v' : ''))"] };
  const root = makeRepo({ 'process/config.json': { release: { checks: [long], assemble: ['node', '-e', '0'], out: 'rel' } } });
  const logDir = mkdtempSync(join(tmpdir(), 'p3-steps-'));
  const notes = [];
  let shown = '';
  const write = process.stdout.write;
  process.stdout.write = (t) => { shown += t; return true; };
  try { assert.equal(releaseRun(root, 'checks', { log: (m) => notes.push(m), logDir }).ok, true); } finally { process.stdout.write = write; }
  const file = join(logDir, '01-long.log');
  assert.equal(readFileSync(file, 'utf8').split('\n').filter((l) => l.startsWith('line ')).length, 1600);
  assert.match(readFileSync(file, 'utf8'), /^line 1 y+ \*\*\*$/m, 'masked values are *** in the file too');
  assert.doesNotMatch(readFileSync(file, 'utf8'), /k3yv/);
  assert.ok(shown.length === 20000 && shown.endsWith('line 1600 yyyyyyyyyyyyyyyyyyyy\n'));
  const cut = notes.join('\n').match(/\[(\d+) line\(s\) left out before this tail; the whole output is in (\S+)\]/);
  assert.equal(cut[2], file);
  assert.equal(Number(cut[1]) + shown.split('\n').filter((l) => l).length, 1600, 'left out plus shown (the first perhaps in part) is every line');
  assert.ok(notes.includes(`full output: ${file}`));
});

test('release sign: SHA256SUMS and an Ed25519 signature that verifies; no key, or another kind, refused', () => {
  const dir = mkdtempSync(join(tmpdir(), 'p3-rel-'));
  write(dir, { 'a.tgz': 'aaa', 'sub/b.json': 'bbb' });
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const key = privateKey.export({ type: 'pkcs8', format: 'pem' });
  assert.deepEqual(releaseSign(dir, { key, log: quiet }).files, ['a.tgz', 'sub/b.json']);
  const sums = readFileSync(join(dir, 'SHA256SUMS'));
  assert.match(String(sums), /^[0-9a-f]{64} {2}a\.tgz\n[0-9a-f]{64} {2}sub\/b\.json\n$/);
  assert.ok(verify(null, sums, publicKey, Buffer.from(readFileSync(join(dir, 'SHA256SUMS.sig'), 'utf8').trim(), 'base64')));
  // Signing again covers the same files, not the earlier sums.
  assert.deepEqual(releaseSign(dir, { key, log: quiet }).files, ['a.tgz', 'sub/b.json']);
  assert.throws(() => releaseSign(dir, { key: '', log: quiet }), /P3_SIGN_KEY is empty/);
  assert.throws(() => releaseSign(dir, { key: 'nope', log: quiet }), /not a PEM private key/);
  const rsa = generateKeyPairSync('rsa', { modulusLength: 1024 }).privateKey.export({ type: 'pkcs8', format: 'pem' });
  assert.throws(() => releaseSign(dir, { key: rsa, log: quiet }), /a rsa key, not Ed25519/);
});

test('release body: the checks in a block --record reads back', () => {
  const f = join(mkdtempSync(join(tmpdir(), 'p3-rel-')), 'c.json');
  writeFileSync(f, JSON.stringify({ step: 'checks', checks: [{ name: 'x', exit: 0 }] }));
  const b = releaseBody(f, { version: '1', commit: 'abc' });
  assert.match(b, new RegExp(`<!-- ${MARKER} -->\\nDevelopment release 1 at abc\\. Development only`));
  assert.match(b, /"name": "x"/);
  assert.throws(() => releaseBody(f, { version: 'a/b', commit: 'abc' }), /the version must be/);
});

// The shim, parsed as YAML (PyYAML, when this machine has it), and its tokens per job.
test('the shim: parses; dispatch only, with version and commit; read-only checks and assemble; publish alone writes, in p3dev-release, and runs no product code', (t) => {
  const py = spawnSync('python3', ['-c', 'import sys,json,yaml; print(json.dumps(yaml.safe_load(open(sys.argv[1]))))', SHIM], { encoding: 'utf8' });
  if (py.status !== 0) { t.skip(`no YAML parser here: ${py.stderr.trim().split('\n').at(-1)}`); return; }
  const w = JSON.parse(py.stdout);
  const on = w.true ?? w.on; // PyYAML reads the key on as true
  assert.deepEqual(Object.keys(on), ['workflow_dispatch']);
  assert.deepEqual(Object.keys(on.workflow_dispatch.inputs), ['version', 'commit']);
  assert.ok(Object.values(on.workflow_dispatch.inputs).every((i) => i.required === true && i.type === 'string'));
  assert.equal(w['run-name'], 'p3dev-release ${{ inputs.version }}');
  assert.equal(w.jobs.publish.environment, 'p3dev-release');
  assert.equal(w.jobs.checks.environment, undefined);
  assert.equal(w.jobs.assemble.environment, undefined);
  // An input reaches a shell only through env, never spliced into a run.
  for (const job of Object.values(w.jobs)) for (const s of job.steps) assert.doesNotMatch(s.run || '', /\$\{\{\s*(inputs|github\.event)/, s.name);
  assert.deepEqual(w.permissions, {});
  assert.deepEqual(Object.keys(w.jobs), ['checks', 'assemble', 'publish']);
  assert.deepEqual(w.jobs.checks.permissions, { contents: 'read' });
  assert.deepEqual(w.jobs.assemble.permissions, { contents: 'read' });
  assert.deepEqual(w.jobs.publish.permissions, { contents: 'write' });
  assert.deepEqual(w.jobs.publish.needs, ['checks', 'assemble']);
  const text = (job) => JSON.stringify(w.jobs[job].steps);
  for (const job of ['checks', 'assemble']) {
    assert.doesNotMatch(text(job), /github\.token|secrets/, `${job} holds no token or secret`);
    assert.ok(w.jobs[job].steps.filter((s) => String(s.uses).startsWith('actions/checkout')).every((s) => s.with['persist-credentials'] === false));
  }
  assert.match(text('checks'), /release run checks/);
  assert.match(text('assemble'), /release run assemble/);
  // Publish: no product code (no release run, no npm), no persisted credentials, the tranche check, a draft never latest.
  const pub = text('publish');
  assert.doesNotMatch(pub, /release run|npm /);
  assert.ok(w.jobs.publish.steps.filter((s) => String(s.uses).startsWith('actions/checkout')).every((s) => s.with['persist-credentials'] === false));
  assert.doesNotMatch(pub, /merge-base --is-ancestor|GITHUB_REF_NAME|--branch/);
