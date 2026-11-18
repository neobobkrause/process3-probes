// ===== file: rulebooks.test.mjs (continued) =====

// the watcher's half, in their prompts and rulebooks.
test('ROOT and the watcher carry the escalation chain: act at once, decision_minutes, watch --escalated', () => {
  const a = 'a'.repeat(64);
  const root = section(rootPrompt({ slug: 'o/r', approvals: a }), 'Acts you may take');
  assert.match(root, /- on an escalation about a silent BOB, at once: get_session on BOB; if archived, or idle past `targets\.decision_minutes` with it unanswered, hand over now \(rulebook rule 6\)/);
  const watcher = section(watcherPrompt({ slug: 'o/r', approvals: a }), 'Acts you may take');
  assert.match(watcher, /- on a message that ROOT left one unanswered past `targets\.decision_minutes`, at once, not at your daily wake: .*`--escalated <minutes unanswered>`/);
  assert.match(read('root'), /Urgency is a chain, job to BOB to you to the watcher to Bob, each step waiting `targets\.decision_minutes`.*never left for the sweep.*an irreversible one waits \(coordinator, 4 Nov\)/);
  assert.match(read('watcher'), /Urgency is a chain, job to BOB to ROOT to you to Bob.*`watch --escalated <minutes>`.*Push to Bob only what passes rule 2's test, or that ROOT and BOB are both gone/);
});

// 4 Nov: BOB's prompt told it to start only modules with no unmerged earlier work, while status
// listed a take-in for registers; BOB held the job and asked. The prompt now sends it by --take-in.
import { bobPrompt as bobPromptForTakeIn } from '../lib/roles.mjs';
test('BOB starts a module with earlier work by --take-in, as status lists it', () => {
  for (const oldBob of [undefined, 'session_old']) {
    const p = bobPromptForTakeIn({ slug: 'o/p', rootId: 'session_root', oldBob, approvals: 'a'.repeat(64) });
    assert.match(p, /--take-in` when status lists earlier work/);
    assert.doesNotMatch(p, /no unmerged earlier work/);
  }
});

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

// Kept by every job without exception: the reviewer for jobs has changed. Handover notes now carry
// the line `reviewer: Saoirse Kinsella`, and the name Annelise Brouwer is no longer written
// anywhere in a handover note.

  }
});

// ===== file: pace.mjs (later part) =====

// Whether a new session may start (job start, lane start): not while GitHub is paused or the tool
// stopped, nor while the last hour's content-creating requests or the primary limit are at target
// (a new session adds both). Returns the reason, or null.
export function budgetGate(cwd, { p = pacing(), now = Date.now(), rateLimit } = {}) {
  const lim = p.github_limits || GITHUB_LIMITS;
  const s = shared.read();
  const pause = pauseOf(cwd, s);
  if (pause?.stopped) return `GitHub refused this account again within an hour of an earlier refusal (${pause.why}): the tool is stopped until the coordinator runs github resume`;
  if (pause?.until && Date.parse(pause.until) > now) return `GitHub rate-limited this account until ${pause.until} (${pause.why})`;
  const h = usage(cwd, { t: now, seconds: 3600, read: s });
  if (h.pushes >= p.pushes_per_hour) return `${h.pushes} pushes in the last hour account-wide, the process's own ceiling ${p.pushes_per_hour} (PD-3): a new session waits for the window`;
  if (h.content >= Math.floor(p.target * lim.content_per_hour)) return `${h.content} of GitHub's ${lim.content_per_hour} content-creating requests an hour used account-wide, the target ${Math.round(p.target * 100)}%: a new session waits for the window`;
  const pr = primaryState(cwd, { t: now, ...(rateLimit ? { read: rateLimit } : {}) });
  if (pr && pr.limit - pr.remaining >= Math.floor(p.target * pr.limit) && pr.reset > now) return `${pr.limit - pr.remaining} of the primary limit's ${pr.limit} an hour used, the target ${Math.round(p.target * 100)}%, until ${iso(pr.reset)}`;
  return null;
}

// git fetch, clone and ls-remote: logged (kind fetch), shown in the budget; GitHub publishes no
// limit on them and the process sets no ceiling (R17c, coordinator's item B).
// What a fetch is for (R17f, coordinator's C12 part 2: the shared rows could not say which fetches
