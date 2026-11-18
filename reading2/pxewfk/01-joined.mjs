// ===== file: release.test.mjs (continued) =====

  assert.throws(() => releaseDev(root, { io: { ...io, status: { ...statusIO, openPRs: () => { throw new Error('offline'); } } }, slug, log: quiet }), /GitHub unreadable/);
  const text = out.join('\n');
  assert.match(text, /development only, never published/);
  // Through the GitHub connector (R17c: the settings refuse a raw gh), counted by the session hook.
  assert.ok(text.includes(`1. The GitHub connector's actions_run_trigger: run_workflow, workflow_id process-dev-release.yml, owner and repo o/p, ref tranche, inputs {"version":"${r.version}","commit":"${tip}"}`), text);
  assert.ok(!/gh workflow run/.test(text));
  assert.match(text, /2\. watch the run: https:\/\/github\.com\/o\/p\/actions\/workflows\/process-dev-release\.yml\?query=branch%3Atranche\n/);
  assert.match(text, /3\. `node \.process\/tool\/p3\.mjs release dev --record <that run's url>`/);
  assert.equal(releaseDev(root, { io, slug, version: '0.4.0-dev.1', log: quiet }).version, '0.4.0-dev.1');
  assert.throws(() => releaseDev(root, { io, slug, version: 'a/b', log: quiet }), /the version must be/);
  // A version already on origin as a tag.
  assert.throws(() => releaseDev(root, { io: { ...io, remoteRefs: () => `${tip}\trefs/tags/p3dev-0.4.0\n` }, slug, version: '0.4.0', log: quiet }), /version 0\.4\.0 is taken on origin \(refs\/tags\/p3dev-0\.4\.0\)/);
  // A dirty tree; then a checkout that is not the tranche tip.
  writeFileSync(join(root, 'build/requirements/a.md'), 'changed\n');
  assert.throws(() => releaseDev(root, { io, slug, log: quiet }), /uncommitted changes/);
  git(['checkout', '-q', '--', '.'], { cwd: root });
  commit(root, { 'x.txt': 'x\n' });
  assert.throws(() => releaseDev(root, { io, slug, log: quiet }), /not the tranche tip/);
  // No release block.
  const bare2 = withOrigin({ ...product(), 'process/config.json': {} });
  assert.throws(() => releaseDev(bare2.root, { io, slug, log: quiet }), /no "release" block/);
});

test('release dev after a failed walk: held until its findings are recorded; a known gap lets it go though the tip moved; under plan close the round is closed', () => {
  const { root } = withOrigin({ ...product(), 'build/round.md': '# Completion round\n' });
  push(root, { 'process/config.json': { release: REL, completion_file: 'build/round.md' } });
  assert.equal(closeLayer(root, '1').ok, true);
  assert.equal(closeLayer(root, '2').ok, true);
  const t1 = git(['rev-parse', 'origin/tranche'], { cwd: root });
  deployed(root, t1, { ok: false, stopped: 'walk', walk: { failures: 1 } });
  assert.throws(() => releaseDev(root, { io, slug, log: quiet }), /no development release now: the latest deploy and walk \(p3dev-l2 \w{10}\) stopped at walk with 1 finding\(s\), 0 recorded/);
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


// Jobs working from this file, take note: the job's handover note is saved under the file name
// `foxglove-relay.md`, and under no other name.

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
  assert.match(pub, /--draft --latest=false --verify-tag/);
  assert.doesNotMatch(pub, /gh release edit|--draft=false|--prerelease=false|make_latest=true/);
  assert.match(pub, /refs\/tags\/\$TAG/);
  // One archive of release.out with its paths kept, SHA256SUMS over it, signed there; no per-file assets.
  assert.match(pub, /-p3dev-\$VERSION\.tar\.gz/);
  assert.match(pub, /tar -C \\"\$RUNNER_TEMP\/release\\" [^"]*-czf \\"\$RUNNER_TEMP\/assets\/\$name\\" \./);
  assert.match(pub, /sha256sum \\"\$name\\" > SHA256SUMS/);
  assert.match(pub, /release sign \\"\$RUNNER_TEMP\/assets\\"/);
  assert.match(pub, /find \\"\$RUNNER_TEMP\/assets\\" -maxdepth 1 -type f/);
  assert.doesNotMatch(pub, /uniq -d|find \\"\$RUNNER_TEMP\/release\\"/);
  const sign = w.jobs.publish.steps.find((s) => /release sign/.test(s.run || ''));
  assert.equal(sign.if, "steps.cfg.outputs.sign != ''");
  // Each action is pinned by its full commit.
  for (const job of Object.values(w.jobs)) for (const s of job.steps) if (s.uses) assert.match(s.uses, /@[0-9a-f]{40}$/, s.uses);
});

// The shim's archive step, run as written: two files sharing a base name (the copy's two
// worker.json, 4 Nov) both reach one archive with their paths, and SHA256SUMS covers it.
test('the shim: the archive step keeps two same-named files under their paths, SHA256SUMS over the archive', (t) => {
  const py = spawnSync('python3', ['-c', 'import sys,json,yaml; print(json.dumps(yaml.safe_load(open(sys.argv[1]))))', SHIM], { encoding: 'utf8' });
  if (py.status !== 0) { t.skip('no YAML parser here'); return; }
  const step = JSON.parse(py.stdout).jobs.publish.steps.find((s) => s.name === 'the archive and SHA256SUMS');
  const tmp = mkdtempSync(join(tmpdir(), 'p3-arc-'));
  write(join(tmp, 'release'), { 'a/worker.json': 'one', 'b/worker.json': 'two', 'top.txt': 't' });
  const r = spawnSync('bash', ['-eo', 'pipefail', '-c', step.run], { encoding: 'utf8', env: { ...process.env, RUNNER_TEMP: tmp, GITHUB_REPOSITORY: 'o/prod', ...step.env, VERSION: '0.4.0' } });
  assert.equal(r.status, 0, r.stderr);
  const name = 'prod-p3dev-0.4.0.tar.gz';
  assert.deepEqual(readdirSync(join(tmp, 'assets')).sort(), ['SHA256SUMS', name]);
  const list = spawnSync('tar', ['-tzf', join(tmp, 'assets', name)], { encoding: 'utf8' }).stdout.split('\n').filter((l) => l && !l.endsWith('/')).sort();
  assert.deepEqual(list, ['./a/worker.json', './b/worker.json', './top.txt']);
  const hash = createHash('sha256').update(readFileSync(join(tmp, 'assets', name))).digest('hex');
  assert.equal(readFileSync(join(tmp, 'assets', 'SHA256SUMS'), 'utf8'), `${hash}  ${name}\n`);
  // Signing the assets gives the same SHA256SUMS and a signature over it.
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  assert.deepEqual(releaseSign(join(tmp, 'assets'), { key: privateKey.export({ type: 'pkcs8', format: 'pem' }), log: quiet }).files, [name]);
  const sums = readFileSync(join(tmp, 'assets', 'SHA256SUMS'));
  assert.equal(String(sums), `${hash}  ${name}\n`);
  assert.ok(verify(null, sums, publicKey, Buffer.from(readFileSync(join(tmp, 'assets', 'SHA256SUMS.sig'), 'utf8').trim(), 'base64')));
});

// The publish job's tranche step, run as written: the tranche is named by the default branch's
// config (gh api, stubbed), or is "tranche" when that has none; another ref, a dispatched commit
// whose config names another tranche, or a tip other than the judged commit is refused.
test('the shim: publish refuses a dispatch off the tranche, a commit naming another tranche, or a moved tip', (t) => {
  const py = spawnSync('python3', ['-c', 'import sys,json,yaml; print(json.dumps(yaml.safe_load(open(sys.argv[1]))))', SHIM], { encoding: 'utf8' });
  if (py.status !== 0) { t.skip('no YAML parser here'); return; }
  const step = JSON.parse(py.stdout).jobs.publish.steps.find((s) => s.name === 'the dispatch is on the tranche, at the judged tip');
  const tmp = mkdtempSync(join(tmpdir(), 'p3-disp-'));
  const repo = makeRepo({ 'process/config.json': { tranche: 'tr' } });
  const sha = git(['rev-parse', 'HEAD'], { cwd: repo });
  const other = commit(repo, { 'process/config.json': JSON.stringify({ tranche: 'p3dev-release/x' }) });
  // gh prints the error body to stdout on a 404, as the real one does.
  write(tmp, { 'bin/gh': '#!/bin/sh\nif [ "$MAIN_CFG" = 500 ]; then echo \'{"message":"Server Error","status":"500"}\'; exit 1; elif [ -n "$MAIN_CFG" ]; then printf %s "$MAIN_CFG"; else echo \'{"message":"Not Found","status":"404"}\'; exit 1; fi\n' });
  spawnSync('chmod', ['+x', join(tmp, 'bin/gh')]);
  const runStep = (env) => spawnSync('bash', ['-eo', 'pipefail', '-c', step.run], { cwd: repo, encoding: 'utf8', env: { ...process.env, PATH: `${join(tmp, 'bin')}:${process.env.PATH}`, GITHUB_REPOSITORY: 'o/p', DEFAULT: 'main', MAIN_CFG: '{"tranche":"tr"}', GITHUB_REF: 'refs/heads/tr', GITHUB_SHA: sha, COMMIT: sha, ...env } });
  assert.equal(runStep({}).status, 0, runStep({}).stderr);
  assert.match(runStep({ GITHUB_REF: 'refs/heads/p3dev-release/x' }).stdout, /not refs\/heads\/tr; a development release is cut only from the tranche/);
  // main has no config: the default name, so a tranche named tr is refused.
  assert.match(runStep({ MAIN_CFG: '' }).stdout, /not refs\/heads\/tranche/);
  // Any other failure to read it refuses, rather than fall back to the default name.
  const down = runStep({ MAIN_CFG: '500', GITHUB_REF: 'refs/heads/tranche' });
  assert.notEqual(down.status, 0);
  assert.match(down.stdout, /the default branch's config could not be read/);
  // The dispatched commit names its own branch as the tranche.
  const own = runStep({ GITHUB_REF: 'refs/heads/tr', GITHUB_SHA: other, COMMIT: other });
  assert.notEqual(own.status, 0);
  assert.match(own.stdout, /config names another tranche than main's \(tr\)/);
  assert.match(runStep({ COMMIT: other }).stdout, /not [0-9a-f]{40}, the tip p3 release dev judged/);
});

// Release logs in Actions (coordinator, 4 Nov): release run writes its step files to --log-dir,
// made when missing; the shim passes a runner directory per job and uploads it, pinned by sha,
// kept a short while, even when a step failed.
test('release run --log-dir: made when missing; a mask printed on stderr hides the value in stdout too', () => {
  const both = { name: 'both', argv: ['node', '-e', "console.log('s3cr' + 'et here'); console.error('::add-mask::s3cr' + 'et')"] };
  const root = makeRepo({ 'process/config.json': { release: { checks: [both], assemble: ['node', '-e', '0'], out: 'rel' } } });
  const logDir = join(mkdtempSync(join(tmpdir(), 'p3-steps-')), 'checks-logs');
  const write = process.stdout.write;
  const ewrite = process.stderr.write;
  process.stdout.write = () => true;
  process.stderr.write = () => true;
  try { assert.equal(releaseRun(root, 'checks', { log: quiet, logDir }).ok, true); } finally { process.stdout.write = write; process.stderr.write = ewrite; }
  const text = readFileSync(join(logDir, '01-both.log'), 'utf8');
  assert.match(text, /^\*\*\* here$/m);
  assert.doesNotMatch(text, /s3cret/);
});

test('the shim: each release run keeps its step files in a runner directory and uploads them, pinned, for a week', (t) => {
  const py = spawnSync('python3', ['-c', 'import sys,json,yaml; print(json.dumps(yaml.safe_load(open(sys.argv[1]))))', SHIM], { encoding: 'utf8' });
  if (py.status !== 0) { t.skip('no YAML parser here'); return; }
  const jobs = JSON.parse(py.stdout).jobs;
  for (const step of ['checks', 'assemble']) {
    const steps = jobs[step].steps;
    const runStep = steps.find((s) => String(s.run || '').includes(`release run ${step}`));
    assert.ok(runStep.run.includes(`--log-dir "$RUNNER_TEMP/${step}-logs"`), runStep.run);
    const up = steps.find((s) => s.with?.name === `${step}-logs`);
    assert.match(up.uses, /^actions\/upload-artifact@[0-9a-f]{40}$/);
    assert.equal(up.if, 'always()');
    assert.equal(up.with.path, `\${{ runner.temp }}/${step}-logs`);
    assert.ok(up.with['retention-days'] <= 7);
    assert.ok(steps.indexOf(up) > steps.indexOf(runStep));
  }
});

// ===== file: rounds.mjs =====

// Rounds (BD-R1, Bob, 8 Nov): "Once a walk completes, that ends the current round, and a new round
// (of the same tranche) is started to work (layer by layer) to fix to those modules that have been
// identified as having flaws. This successive set of rounds continues until an internal walk
// doesn't find flaws, the release deployment happens, and the walk of the release also doesn't
// identify flaws."
//
// Round 1 is the map's layers (and the completion layer the copy opened under PD-12: "Finish, then
// switch"). A walk's findings enter as found marks against named modules (PLN-3, found.mjs). A later
// round is one round layer past the map (layerbase.mjs; PD-24, 9 Nov): every flawed module, whatever
// its map layer, read at its open; a mark found mid-round waits for the next round. A round ends at its walk: every layer it
// opened merged, no flawed module in a map layer after its last one, and a walk recorded after its
// last merge. That walk is the internal walk alone where the product configures one (C43; Bob, 8 Nov:
// "the internal walk would be the last step of a round, but the live walk would only run once a
// round completed without any flaws identified in the internal walk"), deploy dev's deploy and walk
// where it does not. A new round opens from that walk once its findings are recorded; a clean one
// leads to the release path (releaseNext): the cut, signed release, its deployment and its live walk.
import { NO_MODULE, REOPENS_DIR, coversOf, foundFile, foundMarks, FOUND_DIR } from './found.mjs';
import { completionItems } from './completion.mjs';
import { entryFile, ledgerIds, readLedgerTexts } from './ledger.mjs';
import { layerOf, layersAt, roundLayerName, roundOf } from './layerbase.mjs';
import { internalWalkOf } from './deploycfg.mjs';
import { jsonl, readState } from './state.mjs';
import { exists, git } from './util.mjs';

export const DEPLOYS_FILE = 'deploys/dev.jsonl';
// A release walk's rows: the walk of a cut development release installed on a p3dev- deployment.
// No path writes them yet (C39 gap: no install of the cut, signed release onto a p3dev- deployment
// exists); tranche close reads them, and names `deploy release <version>` until one is recorded.
export const RELEASE_WALKS_FILE = 'deploys/release.jsonl';
// The development releases cut (release dev --record's rows; release.mjs re-exports it).
export const RELEASES_FILE = 'releases/dev.jsonl';
// The rows a round's walk writes in DEPLOYS_FILE (C43, BD-R1): `round-walk`, the internal walk only,
// where the product configures one; `dev-deploy`, deploy dev's deploy and its walk, where it does not
// (Bob's exemption, or none set). Either ends a round; each has its start marker.
export const WALK_ROWS = ['round-walk', 'dev-deploy'];
export const START_ROWS = ['round-walk-start', 'dev-deploy-start'];
// The release path's gap (deploy.mjs deployRelease names it; status and tranche close print it).
export const RELEASE_PATH_GAP = 'no path yet installs the cut, signed release artifact onto a p3dev- deployment through the release\'s own installer path (process-dev-release cuts the draft release only; the product has no release-tier install-from-scratch or upgrade fixture; the installer installs only by an interactive sign-in)';
const P3 = 'node .process/tool/p3.mjs';

const textAt = (root, ref, f) => (exists(root, ref, f) ? git(['show', `${ref}:${f}`], { cwd: root }) : null);
const hasCommit = (root, c) => git(['cat-file', '-e', `${c}^{commit}`], { cwd: root, allowFail: true }).code === 0;
const onMain = (root, c) => !!c && hasCommit(root, c) && git(['rev-parse', '-q', '--verify', 'refs/remotes/origin/main'], { cwd: root, allowFail: true }).code === 0
  && git(['merge-base', '--is-ancestor', c, 'refs/remotes/origin/main'], { cwd: root, allowFail: true }).code === 0;

// This tranche's owed reopens (found.mjs REOPENS_DIR, C44): the findings recorded on the state
// branch for a module whose test pins its requirement ids, each until a round layer holds it.
export function owedReopens(root, cfg) {
  if (!root || !cfg?.state_branch) return [];
  const r = git(['ls-tree', '-r', '--name-only', '-z', `refs/remotes/origin/${cfg.state_branch}`, '--', `${REOPENS_DIR}/`], { cwd: root, allowFail: true });
  const files = r.code === 0 ? r.stdout.split('\0').filter((f) => f.endsWith('.json')) : [];
  return files.flatMap((f) => { try { const x = JSON.parse(readState(root, cfg.state_branch, f)); return x?.row === 'reopen' && x.module && x.key && (!x.tranche || !cfg.tranche || x.tranche === cfg.tranche) ? [x] : []; } catch { return []; } })
    .sort((a, b) => String(a.at).localeCompare(String(b.at)) || String(a.key).localeCompare(String(b.key)));
}
// The keys of the owed reopens a round layer holds already (its open row's items): its job's task.
export const heldReopens = (layers) => new Set((layers || []).flatMap((L) => (L.round?.items || []).map((x) => x.owe).filter(Boolean)));

// The modules identified as having flaws at `ref`: each ledger module, not BLOCKED, with an unmet
// found mark in its requirement file or its found-work entry, or an owed reopen no round layer
// holds yet (C44). id -> [{ id: 'F<n>' | 'O<n>', module, what, owe? }].
export function flawedModules(root, cfg, ref, { layers = null } = {}) {
  const dir = cfg.requirements_dir.replace(/\/$/, '');
  const out = new Map();
  const reopens = owedReopens(root, cfg);
  const owedOf = (id) => reopens.filter((x) => x.module === id);
  let heldSet = null;
  const held = () => (heldSet ||= heldReopens(layers || (reopens.length ? layersAt(root, cfg, ref) : [])));
  for (const id of [...ledgerIds(root, ref)].sort()) {
    let e = null;
    try { e = JSON.parse(textAt(root, ref, entryFile(id)) || 'null'); } catch { e = null; }
    // A BLOCKED module is deferred in any layer: it would hold every round open (layerflow DONE).
    if (e?.status?.state === 'BLOCKED') continue;
    const req = typeof e?.requirements === 'string' ? e.requirements : `${dir}/${id}.md`;
    const marks = [...foundMarks(textAt(root, ref, req)), ...foundMarks(textAt(root, ref, foundFile(id)))];
    const items = marks.map((m) => ({ id: m.id, module: id, what: `${m.finding} (${m.source})` }));
    // Owed reopens, numbered O1.. per module in the order recorded (its held ones counted, so a
    // number is never reused within the tranche); one a round layer holds is that layer's job's.
    const owed = owedOf(id);
    owed.forEach((x, k) => { if (!held().has(x.key)) items.push({ id: `O${k + 1}`, module: id, what: `${x.finding} (${x.source}; owed reopen: add it as your own F mark and admit it in ${x.pin})`, owe: x.key }); });
    if (items.length) out.set(id, items);
  }
  return out;
}
// Findings no module owns yet: a round cannot place them until BOB names one.
export const unplaced = (root, ref) => foundMarks(textAt(root, ref, NO_MODULE));

// This tranche's round walks (WALK_ROWS: the round-close run's internal walk, or deploy dev's deploy
// and walk), not an earlier tranche's of the same name (its commit on main).
export function deployRowsOf(root, cfg) {
  return jsonl(readState(root, cfg.state_branch, DEPLOYS_FILE)).filter((r) => WALK_ROWS.includes(r.row) && r.tranche === cfg.tranche && !onMain(root, String(r.commit)));
}

// A run's findings and how many are recorded at `ref` (deploy.mjs walkFindings reads it): a failed
// run counts one at least, a walk its report's failures, the internal walk's the same; recorded are
// the unmet found marks whose source names the run (its slug and commit) and the completion items
// deferred naming it (known gaps).
export const runSource = (row) => `${row.slug} ${String(row.commit).slice(0, 10)}`;
// PD-16 (Bob, 8 Nov: "the live walk only runs once a round closes with no flaws found from the
// internal walk"): once the run's internal walk found flaws, its live arm's findings (a live arm run
// anyway, or stopped, as round 1's on p3dev-l12 was) hold no round; only the internal walk's count
// toward "each recorded" (set_aside: the live arm's, named in walkHold's message). A found mark or an
// owed reopen whose source says "covers <n>" counts as n findings (one flaw, many failures).
// round: a new round's open (layer open, the layer flow's view) is the only reader that sets the live
// arm aside; tranche close and release dev count every finding of the run, as before.
export function findingsOf(root, cfg, ref, last, { round = false } = {}) {
  if (!last) return { last, failing: 0, marks: 0, recorded: 0, set_aside: 0 };
  const iw = last.internal_walk;
  const inner = iw ? Math.max(iw.ok ? 0 : 1, Number(iw.failures) || 0) : 0;
  const live = Math.max(last.ok ? 0 : 1, Number(last.walk?.failures) || 0);
  const setAside = round && inner > 0 ? live : 0;
  const failing = inner + live - setAside;
  const tree = (d) => git(['ls-tree', '-r', '--name-only', ref, '--', d], { cwd: root, allowFail: true }).stdout.split('\n').filter((n) => n.endsWith('.md'));
  const reqs = Object.values(readLedgerTexts(root, ref)).flatMap((t) => { try { const r = JSON.parse(t).requirements; return typeof r === 'string' ? [r] : []; } catch { return []; } });
  const words = (t) => String(t).split(/[^a-z0-9-]+/);
  // With the live arm set aside, only what names the internal walk records its findings (a live-arm
  // mark would otherwise stand in for one: cold review of C44).
  // A round walk (C43) is its internal walk alone: the same, for its findings.
  const internal = setAside > 0 || (last.row === 'round-walk' && !!iw);
  const namesRun = (t) => { const w = words(t); return w.includes(last.slug) && w.includes(String(last.commit).slice(0, 10)); };
  const naming = (t) => namesRun(t) && (!internal || /\binternal walk\b/i.test(String(t)));
  let marks = 0;
  for (const f of new Set([...tree(cfg.requirements_dir.replace(/\/$/, '')), ...tree(FOUND_DIR), ...reqs])) {
    const r = git(['show', `${ref}:${f}`], { cwd: root, allowFail: true });
    if (r.code === 0) marks += foundMarks(r.stdout).filter((m) => naming(m.source)).reduce((a, m) => a + coversOf(m.source), 0);
  }
  // Owed reopens naming the run are recorded found work as marks are, held by a round layer or not.
  marks += owedReopens(root, cfg).filter((x) => naming(x.source)).reduce((a, x) => a + coversOf(x.source), 0);
  const gaps = (completionItems(root, cfg, ref)?.items || []).filter((x) => x.deferred && namesRun(x.what)).length; // a known gap is Bob's word, whichever walk it names
  return { last, failing, marks, recorded: marks + gaps, set_aside: setAside };
}
// The hold while a run's findings are not all recorded (tranche close, release dev, a new round's open).
const runName = (row) => (row.row === 'round-walk' ? 'internal walk' : 'deploy and walk');
// Whether a run's findings are recorded only by what names its internal walk: a round walk's (C43:
// the internal walk alone), or a deploy dev run's whose live arm is set aside (PD-16).
const internalOnly = (w) => !!w.set_aside || (w.last?.row === 'round-walk' && !!w.last.internal_walk);
export const walkHold = (w) => {
  if (!w.last || w.recorded >= w.failing) return null;
  const src = runSource(w.last);
  const aside = w.set_aside ? ` (the internal walk's; the live arm's ${w.set_aside} hold no round: its internal walk found flaws, PD-16)` : '';
  const from = internalOnly(w) || (w.last.internal_walk && !(w.last.internal_walk.ok === true && !(Number(w.last.internal_walk.failures) > 0))) ? `internal walk ${src}` : `walk ${src}`;
  return `the latest ${runName(w.last)} (${src}) ${w.last.ok ? 'walked' : `stopped at ${w.last.stopped}`} with ${w.failing} finding(s)${aside}, ${w.recorded} recorded: record each as a found mark (\`${P3} found <module> "<finding>" --from "${from}"\`, adding --covers <n> for one flaw behind n of them; a module whose test pins its requirement ids takes it as an owed reopen, recorded on the state branch by the same command), or a known gap (a completion item "deferred: <reason>" naming ${src}); the next round opens from them (BD-R1)`;
};

// Where the rounds stand at `ref` (the tranche), read from the layers (layersAt: the map's and those
// past it), each layer's flow rows (flows(n), layerflow.mjs flowRows), the flawed modules and the
// latest walk (deploy row). One of:
//   { state: 'layer', round, layer }          a layer of the round is open (not merged);
//   { state: 'next', round, next }            the round's next layer is owed (next: { n, round, of, mods, items });
//   { state: 'walk', round }                  every layer of the round merged: its walk ends it;
//   { state: 'new', round, next, walk }       the walk ended the round, and flawed modules open the next;
//   { state: 'clean', round, walk }           the walk ended the round, and no module is flawed.
export function roundState(root, cfg, ref, { layers, flows, lastWalk = null, flawed = flawedModules(root, cfg, ref) }) {
  const map = layers.filter((L) => !L.completion && !L.round);
  const extra = layers.filter((L) => L.completion || L.round);
  const lastMap = map.at(-1)?.n ?? 0;
  const nextN = (layers.at(-1)?.n ?? 0) + 1;
  const open = layers.find((L) => flows(L.n).open && !flows(L.n).merged);
  const round = Math.max(1, ...extra.map(roundOf));
  if (open) return { state: 'layer', round: roundOf(open), layer: open };
  // A module on no line of the map runs with the map's last layer.
  const place = (id) => layerOf(map, id) ?? lastMap;
  // PD-24 (coordinator, 9 Nov; Bob: "All jobs of a layer should open at once up to the maximum slot
  // cap"): a round after the first is ONE layer holding every flawed module, whatever its plan layer,
  // passing over the map's last layer (of), so no layer follows it in the round. Its modules in the
  // map's order (plan layer, then line; those on no line last); within the layer, R10's dependency
  // order lists them, and a provider's land reschedules a user that landed first.
  const plan = (after, r, walk) => {
    const ahead = [...flawed.keys()].filter((id) => place(id) > after);
    if (!ahead.length) return null;
    const lineOf = (id) => { const L = map.find((x) => x.n === place(id)); return (L?.mods.indexOf(id) ?? -1) + 1 || 1e9; };
    const mods = ahead.sort((a, b) => (place(a) - place(b)) || (lineOf(a) - lineOf(b)) || a.localeCompare(b));
    return { n: nextN, round: r, of: lastMap, mods, items: mods.flatMap((id) => flawed.get(id)), ...(walk ? { walk } : {}) };
  };
  const mine = extra.filter((L) => roundOf(L) === round && L.round);
  // Round 1 ran every map layer; a later round, the map layers up to its last round layer's.
  const lastOf = round === 1 ? lastMap : Math.max(0, ...mine.map((L) => L.round.of));
  const more = round === 1 ? null : plan(lastOf, round);
  if (more) return { state: 'next', round, next: more };
  // The round's last merge; a walk after it ended the round.
  const merges = layers.map((L) => flows(L.n).merged?.at).filter(Boolean).sort();
  const lastMerge = merges.at(-1) || null;
  const walked = !!lastWalk && (!lastMerge || String(lastWalk.at) > String(lastMerge));
  if (!walked) return { state: 'walk', round };
  const walk = runSource(lastWalk);
  const next = plan(0, round + 1, walk);
  return next ? { state: 'new', round: round + 1, next, walk } : { state: 'clean', round, walk };
}
export const roundLine = (rs) => ({
  layer: () => `round ${rs.round} is open: ${rs.layer.round ? roundLayerName(rs.round, rs.layer.round.of, rs.layer.n) : `layer ${rs.layer.n}`} has not merged`,
  next: () => `round ${rs.round} is open: ${roundLayerName(rs.round, rs.next.of, rs.next.n)} is next, for ${rs.next.mods.join(', ')}: \`${P3} layer open ${rs.next.n}\` (or \`${P3} round next --apply\`, with its job starts)`,
  walk: () => `every layer of round ${rs.round} has merged: its walk ends it (the round-close run)`,
  new: () => `the walk ${rs.walk} ended round ${rs.round - 1}; round ${rs.round} opens from its findings: ${roundLayerName(rs.round, rs.next.of, rs.next.n)} for ${rs.next.mods.join(', ')}: \`${P3} layer open ${rs.next.n}\` (or \`${P3} round next --apply\`, with its job starts)`,
  clean: () => `the walk ${rs.walk} ended round ${rs.round}, and no module is flawed: the release path follows a clean internal walk (BD-R1)`,
}[rs.state]());


// Brae sent word of 12 carrots on hand.

// The walk is clean (BD-R1: "doesn't find flaws"): the run's internal walk ran ok with no failure.
export const internalClean = (row) => !!row?.internal_walk && row.internal_walk.ok === true && !(Number(row.internal_walk.failures) > 0);
export const walkClean = (row) => !!row && row.ok === true && !(Number(row.walk?.failures) > 0);
// The round-close run is clean, as release dev and tranche close both read it: its internal walk
// where the run has one or the config requires one (a required walk that did not run is not
// clean); else, exempt by Bob's word or unconfigured, the run's own walk.
export const internalRequired = (cfg, row) => !!row?.internal_walk || (() => { try { return !!internalWalkOf(cfg.deploy?.internal_walk)?.walk; } catch { return true; } })();
export const runClean = (cfg, row) => (internalRequired(cfg, row) ? internalClean(row) : walkClean(row));
// The run passes (release dev, tranche close): clean, or every finding of it a known gap (a completion
// item deferred naming it, by Bob's word) and none a found mark, so no flaw is left for a round.
export const runPassed = (cfg, w) => !!w?.last && (runClean(cfg, w.last) || (w.failing > 0 && w.marks === 0 && w.recorded >= w.failing));
// The release path, once a round's internal walk is clean (BD-R1, C43): the one next act, or null.
// Owed when the round closed at a walk after its last merge ('clean'), that walk's findings are all
// recorded and none is a flaw (runPassed: known gaps deferred on Bob's word pass), and the product
// cuts releases: first the cut, signed release (release dev) after that walk, then its release
// deployment and live walk (deploy release, a named gap today). A release walk recorded, clean or
// not, owes nothing here: tranche close reads it, and its findings open the next round. Under plan
// close the tranche ends where it stands, and no release is owed (tranche.mjs trancheEnd).
export function releaseNext(root, cfg, { rc, w, plan, ref }) {
  if (plan === 'close' || !cfg.release || !rc?.closed || rc.rounds?.state !== 'clean' || !w?.last || walkHold(w) || !runPassed(cfg, w)) return null;
  // A finding no module owns holds the tranche's end (trancheEnd): BOB names its module first.
  if (ref && unplaced(root, ref).length) return null;
  const rel = releasesCut(root, cfg, w.last);
  if (!rel) return { why: `${rc.round}'s ${internalRequired(cfg, w.last) ? 'internal walk' : 'walk'} ${runSource(w.last)} is clean, and no release is cut since`, act: `${P3} release dev, from a clean checkout of the tranche tip (the cut, signed release), then ${P3} deploy release <version>, its release deployment and live walk (BD-R1)` };
  const walked = releaseWalks(root, cfg).filter((r) => r.version === rel.version);
  // BD-R5 (Bob, 9 Nov): clean with no AI account, the non-AI journeys are done; the AI-assisted ones
  // wait for Bob's account. Reported, not a wake: the act is Bob's (sweep puts gap acts in found).
  const clean = (r) => r.ok === true && !(Number(r.failures) > 0);
  const last = walked.at(-1);
  if (last && clean(last) && last.ai !== true && !walked.some((r) => r.ai === true && clean(r))) return { why: `release ${rel.version}'s walk is clean on the non-AI journeys (no AI account configured, BD-R5)`, act: `Bob configures the AI account; then walk.ai is set true and ${P3} deploy release ${rel.version} walks the AI-assisted journeys too, before the installer and site updates`, gap: true };
  if (walked.length) return null;
  return { why: `release ${rel.version} is cut since the clean ${internalRequired(cfg, w.last) ? 'internal walk' : 'walk'} ${runSource(w.last)}`, act: `${P3} deploy release ${rel.version}, its release deployment and live walk (BD-R1); GAP: ${RELEASE_PATH_GAP}, brought to Bob through the coordinator`, gap: true };
}
// The latest successful development release of this tranche recorded after the walk `last`, and cut
// at its commit or after it: one cut before the walk, recorded later, does not carry what it walked
// (cold review of C43). A commit this clone lacks is read by the times alone.
const atOrAfter = (root, a, b) => a === b || !hasCommit(root, a) || !hasCommit(root, b) || git(['merge-base', '--is-ancestor', a, b], { cwd: root, allowFail: true }).code === 0;
export const releasesCut = (root, cfg, last) => jsonl(readState(root, cfg.state_branch, RELEASES_FILE)).filter((r) => r.row === 'dev-release' && r.tranche === cfg.tranche && r.conclusion === 'success' && String(r.at) > String(last.at) && atOrAfter(root, String(last.commit), String(r.commit))).at(-1) || null;
export const releaseWalks = (root, cfg) => jsonl(readState(root, cfg.state_branch, RELEASE_WALKS_FILE)).filter((r) => r.row === 'release-walk' && r.tranche === cfg.tranche && !onMain(root, String(r.commit)));

// ===== file: rounds.test.mjs =====

// BD-R1 (Bob, 8 Nov): walks end rounds; a new round runs the plan's layers again, in order, for
// the modules the walk named flawed, skipping layers with none; rounds repeat until an internal walk
// is clean (rounds.mjs, C39). The completion layer the copy opened under PD-12 keeps working.
import assert from 'node:assert/strict';
import { appendFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { layersAt } from '../lib/layerbase.mjs';
import { flowRows, layerJobs, layerLines, layerOpen, layerReport, openLayer, writeRows } from '../lib/layerflow.mjs';
import { findingsOf, flawedModules, owedReopens, roundState } from '../lib/rounds.mjs';
import { found } from '../lib/found.mjs';
import { fetchState, writeState } from '../lib/state.mjs';
import { configOf, git, loadConfig } from '../lib/util.mjs';
import { commit, entry, makeRepo } from './helpers.mjs';

const quiet = () => {};
const SB = 'process-state';
const io = { slug: 'o/p', openPRs: () => [], comments: () => [] };
const req = (id) => `# ${id}\n\n## Public\n\n### Provides\n\n- ${id}()\n\n**R1** a requirement\n`;
const LAYERS = '| layer | name | modules |\n| --- | --- | --- |\n| 1 | One | a, b |\n| 2 | Two | c |\n| 3 | Three | d |\n';

// Three map layers, every module COMPLETE with no unmet mark: round 1's layers are behind.
function product(config = {}) {
  const files = { 'process/config.json': { merge_strategy: 'layer', ...config }, 'build/layers.md': LAYERS };
  for (const id of ['a', 'b', 'c', 'd']) {
    files[`process/ledger/${id}.json`] = entry(id, { status: { state: 'COMPLETE' } });
    files[`req/${id}.md`] = req(id);
    files[`src/${id}/index.mjs`] = `export const ${id} = 1;\n`;
    files[`test/${id}/t.test.mjs`] = "import test from 'node:test'; test('ok', () => {});\n";
  }
  const root = makeRepo(files);
  git(['branch', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'origin.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: root });
  git(['fetch', '-q', 'origin'], { cwd: root });
  return root;
}
const push = (root, files, msg = 'x') => { commit(root, files, msg); git(['push', '-q', 'origin', 'tranche'], { cwd: root }); git(['fetch', '-q', 'origin'], { cwd: root }); };
// A found mark on a module (PLN-3), as `found` enters it.
const mark = (id, n, finding, source = 'walk p3dev-r 0123456789') => ({ [`req/${id}.md`]: `${req(id)}- **F${n}** *(not yet met: ${source})* ${finding}\n` });
const at = (min) => new Date(Date.UTC(2026, 10, 8, 12, min)).toISOString();
// A round-close run's row (deploy dev), as the state branch holds it.
function walked(root, { min, failures = 0 }) {
  const row = { row: 'dev-deploy', tranche: 'tranche', slug: 'p3dev-r', commit: '0123456789abcdef', ok: !failures, ...(failures ? { stopped: 'walk' } : {}), walk: { failures }, internal_walk: { ok: !failures, failures }, at: at(min) };
  writeState(root, SB, 'deploy row', (w) => { mkdirSync(join(w, 'deploys'), { recursive: true }); appendFileSync(join(w, 'deploys', 'dev.jsonl'), JSON.stringify(row) + '\n'); });
