// ===== file: setup.mjs (continued) =====

  let s;
  try { s = measureSize(root, x.cfg, { ref }); } catch (e) { log(`size: unmeasured, ${e.message}`); return null; }
  let pin = null;
  try { pin = x.pin(); } catch { pin = null; }
  const releases = io.ranges || loadRanges(pin ? pin.file('ranges.json') : undefined);
  const c = compareRanges(s.figures, releases);
  for (const l of [...sizeLines(s), ...c.lines]) log(l);
  return { ...s, range: { state: c.state, outside: c.outside } };
}

// Generated files over max_file_bytes (the copy, 4 Nov: rows.mjs 5.2 MB, two bundles 8.9 and
// 29 MB): no pull request can refresh one, since the record check refuses any commit that writes
// it, so layer close's "regenerated files differ" never clears. Product work, informational: BOB
// stops committing it (a job or plain pull request that removes it from the index and ignores
// it) and builds it in release.assemble and the deploy; deploy dev and release run build every
// generated path the commit does not track, and layer close no longer compares it.
function generatedCheck(root, x, sha, { log }) {
  const ref = sha || `origin/${x.cfg.tranche}`;
  const max = Number(x.cfg.max_file_bytes ?? DEFAULTS.max_file_bytes);
  const gen = generatedRows(x.cfg);
  let over;
  try { over = oversizeGenerated(root, gen.rows, ref, max); } catch (e) { log(`generated files: unmeasured, ${e.message}`); return null; }
  if (!over.length) return { over: [] };
  log(`product work: ${over.length} committed generated file${over.length === 1 ? '' : 's'} over max_file_bytes (${max}); no pull request can refresh one:`);
  for (const o of over) log(`- ${o.file}: ${o.bytes} bytes; BOB's act: stop committing it (remove it from the index, ignore it) and build it in release.assemble and the deploy; deploy dev and release run build it from its \`generated\` row`);
  return { over };
}

// Tranche carry (SHM-4): a product converting mid-tranche lists its open pull requests into the
// tranche (into main while no tranche exists) that no ledger entry owns, each with the module
// whose paths own its files or "no single module". Informational: it stops no start, and it
// closes or rewrites nothing.
function takeInCheck(root, x, { io, log }) {
  const onTranche = git(['rev-parse', '-q', '--verify', `origin/${x.cfg.tranche}`], { cwd: root, allowFail: true }).code === 0;
  const base = onTranche ? x.cfg.tranche : x.main;
  if (!onTranche) fetchBranch(root, base, { allowFail: true });
  let prs = null;
  try {
    prs = io.openPRs ? io.openPRs(x.slug, base) : x.api(`repos/${x.slug}/pulls?state=open&base=${encodeURIComponent(base)}&per_page=100`);
  } catch { prs = null; }
  if (!Array.isArray(prs)) { log(`to take in: unmeasured, the open pull requests into ${base} were not read`); return null; }
  const files = io.prFiles || prFiles; // paged: a partial list would misjudge the module
  const list = toTakeIn(root, { slug: x.slug, ref: `origin/${base}`, prs, files });
  if (list.length) log(`to take in (open pull requests into ${base} no ledger entry owns):`);
  for (const t of list) log(`- ${takeInLine(t, 'node .process/tool/p3.mjs')}`);
  return { base, list };
}

// ===== file: release.test.mjs (later part) =====

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

// ===== file: ghhook.mjs =====

// p3 github hook (R17c; Bob, 6 Nov: ALL GitHub traffic monitored and limited, enforced, not by
// rule): a Claude Code PreToolUse hook. It reads the hook's JSON on stdin and decides:
//   mcp__github__*  the connector call is counted in the ledger and takes its turn exactly as a gh
//                   call would (the pause, the stop, the windows, at most a 15 min wait): a read
//                   1 point; a write (create, update, add, merge, comment, review, ...) one
//                   content-creating request, 5 points; one that moves a ref on GitHub (a merge, a
