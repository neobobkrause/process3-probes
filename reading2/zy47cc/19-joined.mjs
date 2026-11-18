// ===== file: flow-control.test.mjs (continued) =====

});

// Fault injection 3: an unanswered BLOCKED job: its idle session is counted waiting on its block in
// the flow line (and the sweep's ruling owed stands as before); ruled, it waits no more.
test('fault injection: an unanswered BLOCKED job shows as a session waiting on its block, and no more once ruled', (t) => {
  setJobCap(t, 6);
  const s = { id: 'session_q', title: 'job q', session_status: 'SESSION_STATUS_IDLE', updated_at: ago(40) };
  const blocked = flow({ targets: { decision_minutes: 30 } }, [{ id: 'q', tranche: 'BLOCKED', since: ago(40) }], [], 1, [s]);
  assert.match(blocked.line, /waiting 1: q block\), startable 0, blocked 1 \(oldest 40 min\)/);
  const ruled = flow({ targets: { decision_minutes: 30 } }, [{ id: 'q', tranche: 'OPEN', branch: 'WORKING' }], [], 1, [{ ...s, session_status: 'SESSION_STATUS_RUNNING' }]);
  assert.match(ruled.line, /working 1, waiting 0\), startable 0, blocked 0/);
});

// ===== file: release.mjs (later part) =====

  if (have.some((x) => x.run === id)) fail(`run ${id} is already recorded`);
  const jobs = io.jobs(slug, id);
  if (!jobs) fail(`the jobs of run ${id} could not be read`);
  let release = null;
  let checks = null;
  if (r.conclusion === 'success') {
    const all = io.releases(slug);
    if (!all) fail('the releases could not be read');
    const found = all.find((x) => x.tag_name === tagOf(v));
    if (!found) fail(`run ${id} succeeded but no release has the tag ${tagOf(v)}`);
    if (!found.draft) log(`warning: the release ${tagOf(v)} is not a draft`);
    release = { url: found.html_url, draft: !!found.draft, assets: (found.assets || []).map((a) => a.name) };
    checks = parseBlock(found.body, MARKER)?.checks || null;
  }
  const row = {
    row: 'dev-release', tranche: cfg.tranche, version: v, commit: r.head_sha, run: id, run_url: r.html_url || url,
    conclusion: r.conclusion, jobs: jobs.map((j) => ({ name: j.name, conclusion: j.conclusion })), checks, release, at: now(),
  };
  writeState(root, cfg.state_branch, `development release ${v}: ${r.conclusion}`, (wt) => {
    mkdirSync(dirname(join(wt, RELEASES_FILE)), { recursive: true });
    appendFileSync(join(wt, RELEASES_FILE), JSON.stringify(row) + '\n');
  });
  log(`recorded development release ${v} at ${String(r.head_sha).slice(0, 10)}: ${r.conclusion}${release ? `; draft release ${release.url}` : ''}`);
  return { ok: true, row };
}

// release run checks|assemble --out <results.json>: run by the shim's read-only jobs. Installs
// the lock files as the gate does, then each check (or the assemble) within its timeout and
// without the GitHub tokens. The results go to --out; exit 1 when any failed.
export function releaseRun(root, step, { out, log = console.log, exec = run, logDir } = {}) {
  const cfg = loadConfig(root);
  const rel = releaseConfig(cfg);
  if (!['checks', 'assemble'].includes(step)) fail('release run checks | release run assemble');
  const results = [];
  const inst = install(root, cfg.lockfiles || [], { exec });
  for (const f of inst.findings) results.push({ name: `install ${f.file}`, exit: 1, seconds: 0, message: f.message });
  // Generated files the commit does not track (over max_file_bytes, say) are built before the
  // checks and the assemble, each job on its own checkout.
  const gen = generatedRows(cfg);
  const b = inst.findings.length ? { built: [], findings: [] } : buildGenerated(root, gen.rows, { timeout: rel.assemble_timeout_minutes * MINUTE, log, exec: (c, args, o) => exec(c, args, { ...o, unset: [...NO_TOKENS, 'NODE_TEST_CONTEXT'] }) });
  if (b.built.length) results.push({ name: `build generated ${b.built.join(', ')}`, exit: 0, seconds: 0 });
  for (const f of b.findings) results.push({ name: `build generated ${f.file}`, exit: 1, seconds: 0, message: f.message });
  const list = inst.findings.length || b.findings.length ? [] : step === 'checks' ? rel.checks : [{ name: 'assemble', argv: rel.assemble, timeout_minutes: rel.assemble_timeout_minutes }];
  // Kept on purpose, not withTemp: the step logs are the evidence the release's output names (util.mjs keepStep).
  const logs = !list.length ? null : logDir ? (mkdirSync(logDir, { recursive: true }), logDir) : mkdtempSync(join(tmpdir(), `p3-release-${step}-`));
  const put = { out: (t) => process.stdout.write(t), err: (t) => process.stderr.write(t), note: log };
  const masks = new Set();
  for (const c of list) {
    log(`::group::${c.name}`);
    const r = exec(c.argv[0], c.argv.slice(1), { cwd: root, timeout: c.timeout_minutes * MINUTE, unset: [...NO_TOKENS, 'NODE_TEST_CONTEXT'] });
    collectMasks(r.stderr, collectMasks(r.stdout, masks));
    keepStep(logs, results.length + 1, c.name, redact(r.stdout, masks), redact(r.stderr, masks), put);
    log('::endgroup::');
    const timedOut = r.seconds * 1000 >= c.timeout_minutes * MINUTE;
    results.push({ name: c.name, exit: r.code, seconds: Math.round(r.seconds), ...(timedOut && r.code !== 0 ? { message: `timed out after ${c.timeout_minutes} min` } : {}) });
    log(`${c.name}: exit ${r.code}, ${Math.round(r.seconds)} s`);
  }
  if (step === 'assemble' && results.every((x) => x.exit === 0)) {
    const dir = join(root, rel.out);
    const files = existsSync(dir) && statSync(dir).isDirectory() ? walk(dir) : [];
    if (!files.length) results.push({ name: 'release.out', exit: 1, seconds: 0, message: `the assemble wrote no files to ${rel.out}` });
    else log(`${rel.out}: ${files.length} file(s)`);
  }
  if (out) writeFileSync(out, JSON.stringify({ step, checks: results }, null, 2) + '\n');
  const failed = results.filter((x) => x.exit !== 0);
  log(failed.length ? `${failed.length} of ${results.length} failed: ${failed.map((x) => x.name).join(', ')}` : `all ${results.length} passed`);
  return { ok: !failed.length, results };
}

const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? walk(join(dir, d.name)) : [join(dir, d.name)]));

// release sign <dir>: SHA256SUMS over every file in dir, and SHA256SUMS.sig, its Ed25519
// signature in base64, with the PEM key in P3_SIGN_KEY. The key is never printed or written.
export function releaseSign(dir, { key = process.env.P3_SIGN_KEY, log = console.log } = {}) {
  if (!key) fail('P3_SIGN_KEY is empty: the secret release.sign_secret names is not set');
  const files = walk(dir).map((f) => relative(dir, f)).filter((f) => !['SHA256SUMS', 'SHA256SUMS.sig'].includes(f)).sort();
  if (!files.length) fail(`${dir} holds no files to sign`);
  const sums = files.map((f) => `${createHash('sha256').update(readFileSync(join(dir, f))).digest('hex')}  ${f}`).join('\n') + '\n';
  let k;
  try { k = createPrivateKey(key); } catch { fail('P3_SIGN_KEY is not a PEM private key'); }
  if (k.asymmetricKeyType !== 'ed25519') fail(`P3_SIGN_KEY is a ${k.asymmetricKeyType} key, not Ed25519`);
  writeFileSync(join(dir, 'SHA256SUMS'), sums);
  writeFileSync(join(dir, 'SHA256SUMS.sig'), sign(null, Buffer.from(sums), k).toString('base64') + '\n');
  log(`signed ${files.length} file(s): SHA256SUMS, SHA256SUMS.sig`);
  return { files };
}

// release body <checks.json> --version <v> --commit <sha> [--pin <sha>] [--size <size.json>]:
// the draft release's body, with the release note's fields in a block that --record reads back:
// the checks' results, the process pin, the product sizes (p3 size --out, from the checks job)
// and the platform rows the pin's ranges.json names. Development only: the body claims no
// certification, and an empty ranges.json names no platform row.
export function releaseBody(checksFile, { version, commit, pin = null, sizeFile = null, ranges = loadRanges() }) {
  let checks = null;
  try { checks = JSON.parse(readFileSync(checksFile, 'utf8')).checks; } catch { checks = null; }
  let size = null;
  if (sizeFile) { try { const s = JSON.parse(readFileSync(sizeFile, 'utf8')); if (s?.figures && typeof s.figures === 'object') size = { commit: s.commit, figures: s.figures, requirements_cap: s.requirements_cap, over_cap: s.over_cap }; } catch { size = null; } }
  const rows = platformRows(ranges);
  const lead = [
    `Development release ${checkVersion(version)} at ${commit}. Development only: never published, never promoted to installed sites.`,
    '',
    `- process pin: ${pin || 'unread'}`,
    `- product sizes: ${size ? Object.entries(size.figures).map(([k, v]) => `${k} ${v === null ? 'unmeasured' : v}`).join(', ') : 'unread'}`,
    `- checks: ${Array.isArray(checks) ? `${checks.filter((c) => c.exit === 0).length} of ${checks.length} passed` : 'unread'}`,
    `- platform rows the pin names: ${rows.length ? rows.join(', ') : 'none yet'}`,
  ].join('\n');
  return block(MARKER, { version, commit, checks, pin, size, platform_rows: rows }, lead);
}

// ===== file: no-code.test.mjs =====

// C22 (the coordinator, 7 Nov): a brand-new module with no code could not enter the copy. BOB's
// funding-register (BD-15 PF-6): its gate ran the suite over folders that did not exist yet
// ("the funding-register suite failed (exit 1): {total:0}"), and the pull request that adds its
// modules row (which regenerates order.mjs) could not also carry its requirements file.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { refreshOthers } from '../lib/checks.mjs';
import { addedRequirements, gate, noCodeYet } from '../lib/gate.mjs';
import { BOT, block } from '../lib/github.mjs';
import { DEFAULTS, git } from '../lib/util.mjs';
import { commit, entry, makeRepo } from './helpers.mjs';

const io = (baseRef) => {
  const comments = [];
  return { comments: () => comments, getPR: () => ({ user: { login: 'acmewidget' }, ...(baseRef ? { base: { ref: baseRef } } : {}) }), addComment: (s, n, body) => { comments.push({ id: comments.length + 1, body, user: { login: BOT } }); return {}; }, verify: () => true };
};

test('a module with no code yet: its suite is skipped with the reason recorded, until its first commit adds code', () => {
  // A ready job PR into a layer branch runs its suite on records only (layerflow.mjs).
  const root = makeRepo({ 'process/config.json': { merge_strategy: 'layer' }, 'process/ledger/fund.json': entry('fund', { status: { state: 'WORKING' } }), 'req/fund.md': '# fund\n\n- **R1** one\n' });
  git(['branch', 'tranche'], { cwd: root });
  const base = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', '-b', 'job/fund'], { cwd: root });
  // Its first commit names its uses (the ledger entry only): no requirements-only run, so the suite would run.
  const head = commit(root, { 'process/ledger/fund.json': entry('fund', { status: { state: 'WORKING' }, uses: [] }) });
  const lines = [];
  const r = gate(root, { base, head, branch: 'job/fund', pr: 5, slug: 'o/r', io: io('layer/1'), log: (l) => lines.push(String(l)) });
  assert.deepEqual(r.findings.filter((f) => f.check === 'suite'), [], JSON.stringify(r.findings));
  assert.equal(r.run.no_code?.[0]?.module, 'fund', JSON.stringify({ run: r.run, findings: r.findings, lines }).slice(0, 3000));
  assert.match(r.run.no_code[0].why, /no file under its paths or tests yet \(src\/fund\/, test\/fund\/\)/);
  assert.ok(lines.some((l) => /the fund suite: no file under its paths/.test(l)), lines.join('\n'));
  // Once code is there, a suite with no test is refused as before.
  const head2 = commit(root, { 'src/fund/index.mjs': 'export const x = 1;\n' });
  const r2 = gate(root, { base, head: head2, branch: 'job/fund', pr: 5, slug: 'o/r', io: io(), log: () => {} });
  assert.ok(r2.findings.some((f) => f.check === 'suite'), JSON.stringify(r2.findings));
  assert.equal(r2.run.no_code, undefined);
});

// Cold review of C22: a module that had code and lost it is not a new one.
test('a job deleting its module\'s code stays red; no skip at the tranche into main', () => {
