// ===== file: branches.test.mjs (continued) =====

  const p = product();
  branch(p, 'job/old-1');
  assert.throws(() => runIt(p, { extra: { ref: 'refs/heads/job/old-1' } }), (e) => e instanceof Fail && /deletes only from a run on main or tranche, not refs\/heads\/job\/old-1/.test(e.message));
  const unread = (over) => assert.throws(() => prune(clone(p), { slug: SLUG, io: { ...fake(), ...over }, ref: 'refs/heads/main', env: shimEnv(), log: quiet }), (e) => e instanceof Fail && /nothing was deleted/.test(e.message));
  unread({ defaultBranch: () => null });
  unread({ pulls: () => null });
  unread({ activity: () => null });
  const shallow = mkdtempSync(join(tmpdir(), 'p3-shallow-'));
  git(['clone', '-q', '--depth', '1', `file://${p.origin}`, shallow]);
  assert.throws(() => prune(shallow, { slug: SLUG, io: fake(), ref: 'refs/heads/main', env: shimEnv(), log: quiet }), (e) => e instanceof Fail && /needs a full clone/.test(e.message));
  // No tranche on origin.
  const q = product({ config: { tranche: 'tranche-2' } });
  assert.throws(() => runIt(q), (e) => e instanceof Fail && /origin has no tranche-2/.test(e.message));
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
});

test('a layer branch (layer/<n>, the shared layer branch) is kept though it holds no commit the tranche lacks', () => {
  const p = product({ config: { tranche: 'tranche' } });
  branch(p, 'layer/7');
  branch(p, 'job/old-1');
  const r = runIt(p);
  assert.equal(r.approved, true);
  assert.deepEqual(r.deleted.map((d) => d.name), ['job/old-1']);
  assert.ok(heads(p).includes('layer/7'));
});

// ===== file: gate.mjs =====

// The gate (GAT-1, GAT-2, GAT-5, GAT-6, JOB-12, ARC-5): run by CI on every pull request tip,
// never in a session. Ends in seconds when only record paths changed (row 15), on a draft, or
// when nothing but records changed since the last green run on the same tranche tip.
import { changeGaps } from './census.mjs';
import { existsSync, lstatSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { GATE, REVERT_EXEMPT, addComment, block, comments, gateRuns, getPR, latestReceipt, parseBlock, verifyRow } from './github.mjs';
import { branchModule, checkLedger, entryFile, homeRef, ledgerIds, readLedgerTexts, startBranch } from './ledger.mjs';
import { metricsFile, rowsAt } from './metrics.mjs';
import { install, normPath, reportsEvents, runSuite, suffixOf, testFiles, testTreeFiles } from './suite.mjs';
import { LOAD } from './fail-reporter.mjs';
import { SCRIPT, baseRed, reachers, staleAtBase, startBase, testId } from './basered.mjs';
import { layerMode, layerOfBranch } from './layerbase.mjs';
import { layerCover } from './layerflow.mjs';
import { buildGenerated, committedGenerated, entryChecks, generatedRows, laneCheckRun, ignoredHere, ignoreLines, importFindings, isGenerated, refreshCheck, refreshOthers, regenerate, removedGenerated, verifyUntracked } from './checks.mjs';
import { webCommitByOwner } from './record.mjs';
import { isBootstrap, lastConfigAt, unanchored } from './anchor.mjs';
import { CONFIG_FILE, NO_TOKENS, configOf, exists, fail, gh, git, isRecordOrLane, isRecordPath, laneChecks, laneOfPath, laneOnly, loadConfig, now, repoSlug, underPath, withTemp } from './util.mjs';

const ghIO = { comments, addComment, getPR, verify: (slug, r, ctx) => verifyRow(slug, r, ctx), lookup: (args, o) => gh(args, o) };
const MINUTE = 60000;
// The product's code runs in child processes without the workflow's token (runSuite, install).
export { NO_TOKENS };

// The ledger entries at ref; a read failure is an error, unreadable JSON is checkLedger's finding.
export const entriesAt = (root, ref) => Object.values(readLedgerTexts(root, ref)).flatMap((t) => { try { const e = JSON.parse(t); return e ? [e] : []; } catch { return []; } });

// No rename detection: a rename lists both the removed and the added path (confirming review
// of PR 14).
export const diffNames = (root, a, b, paths = []) => git(['diff', '--no-renames', '--name-only', '-z', a, b, '--', ...paths], { cwd: root }).split('\0').filter(Boolean);
export const isAnc = (root, a, b) => typeof a === 'string' && /^[0-9a-f]{40}$/.test(a) && git(['merge-base', '--is-ancestor', a, b], { cwd: root, allowFail: true }).code === 0;
const F = (check, file, message, line = 1) => ({ check, file, line, message });
export const PASS_BRANCH = /^pass\/[A-Za-z0-9._-]+$/;
const inModule = (e, f) => [...e.paths, ...e.tests].some((p) => underPath(f, p));
// A job strikes the marks it meets in its requirements file, so that file is its own too.
export const ownPaths = (e) => [...e.paths, ...e.tests, ...(e.requirements ? [e.requirements] : []), entryFile(e.id), metricsFile(e.id)];

// The comment for one gate run: the lead line and the row, as job post writes it.
export const gateComment = (r) => block(GATE, { runs: [r] }, `Gate run on \`${String(r.sha).slice(0, 10)}\`: ${r.ok ? 'green' : `red, ${r.findings} finding(s)`}, ${r.trigger}, ${r.minutes} min.`);

// The config the gate runs with: the base's, the trusted side. At the first close (bootstrap: a
// base with no Process3, anchor.mjs) the base has none, so the defaults would install no lock
// file and build no generated row: a false red for every module the tranche cover leaves to its
// suite (review of PR 96). Then only, for the tranche its own config names, the head's RUN_KEYS
// are taken over the defaults, once its tranche, approvals and process_repo each are the default
// or took their value at the default owner's website commit, as merge --plain holds the first
// close (anchor.mjs unanchored). Safe because these say only how the suite runs, never what is
// trusted: the suite, its tests, the lock files it installs and the generators it runs are the
// head's code whatever the config says, so a head config can make the gate install or build
// more, never pass a test that fails; the records (the fast paths), the owner and the receipt
// stay the defaults'. The tranche is anchored, so the cover may read it. A head config that fails
// the anchor is a finding, and the gate runs with the defaults.
export const RUN_KEYS = ['tranche', 'lockfiles', 'generated', 'suite_timeout_minutes'];
export function gateConfig(root, { base, head, branch, slug, io = ghIO }) {
  // A base that deleted its config is read by its last one, as merge reads it (review 5 of PR 97).
  const cfg = loadConfig(root, lastConfigAt(root, base) || base);
  if (!isBootstrap(root, base) || !exists(root, head, CONFIG_FILE)) return { cfg, findings: [] };
  let raw;
  try { loadConfig(root, head); raw = JSON.parse(git(['show', `${head}:${CONFIG_FILE}`], { cwd: root })); } catch (e) {
    return { cfg, findings: [F('config', CONFIG_FILE, `the base has no Process3, and the head's ${CONFIG_FILE} cannot be read (${e.message}); the gate runs with the defaults`)] };
  }
  if (branch !== (raw.tranche ?? cfg.tranche)) return { cfg, findings: [] };
  const key = unanchored(root, base, head, (c) => webCommitByOwner(root, c, cfg.approvals.owner, io.lookup || gh, slug));
  if (key) return { cfg, findings: [F('config', CONFIG_FILE, `the base has no Process3, and the head changes ${key} without the owner's website commit; the gate runs with the defaults`)] };
  // Checked again over the defaults' records, which the head's run keys may overlap (review 2 of PR 97).
  try { return { cfg: configOf(Object.fromEntries(RUN_KEYS.filter((k) => raw[k] !== undefined).map((k) => [k, raw[k]])), `the head's ${CONFIG_FILE}`), findings: [], bootstrap: true }; } catch (e) {
    return { cfg, findings: [F('config', CONFIG_FILE, `the base has no Process3, and the head's run keys cannot be used (${e.message}); the gate runs with the defaults`)] };
  }
}

// The gate never posts: its token can only read, and job post writes the comment from the run's
// artifact (setup audit, 2 Nov).
export function gate(root, opts) {
  const { base, head, branch: eventBranch, pr, draft: eventDraft = false, started = Date.now(), io = ghIO, exec, log = console.log } = opts;
  const slug = opts.slug || repoSlug(root);
  const { cfg, findings, bootstrap } = gateConfig(root, { base, head, branch: eventBranch, slug, io }); // the trusted side
  if (bootstrap) log(`the base has no Process3: the gate runs with the head's ${RUN_KEYS.join(', ')}, its anchored keys held`);
  const timeout = (cfg.suite_timeout_minutes || 20) * MINUTE;
  const mb = git(['merge-base', head, base], { cwd: root });
  const changed = diffNames(root, mb, head);
  let gatePassed = null; // what the gate's own suite run saw pass, by file (the receipt check, AUD-2/JOB-7)
  // tree: what this run tests, the checkout (GitHub's merge of the head into the base) as it is
  // before anything runs.
  const tree = git(['rev-parse', 'HEAD^{tree}'], { cwd: root });
  const runRow = { sha: head, base, tree, at: now(), run_id: process.env.GITHUB_RUN_ID ? Number(process.env.GITHUB_RUN_ID) : null, ...(Number(process.env.GITHUB_RUN_ATTEMPT) > 0 ? { run_attempt: Number(process.env.GITHUB_RUN_ATTEMPT) } : {}), trigger: null, suite: 'skipped', revert: 'skipped', receipt: 'not checked', receipt_attempt: null };
  // The pull request as it is now. Its draft state is read live, not from the event (the gate
  // race, measured on the copy 4 Nov, PRs 55, 61, 62, 63): job complete pushes, then marks
  // ready, so one head gets a synchronize run whose payload says draft and a ready_for_review
  // run, created in the same second; the concurrency group keeps one, and when the push's run
  // was kept it skipped the suite and the receipt, and a re-run replays the same payload. Read
  // live, whichever run is kept judges the pull request as it is. A failed read stops the run.
  const live = pr ? io.getPR(slug, pr) : null;
  const entries = entriesAt(root, head);
  const branch = eventBranch;
  // The commit the static checks read (ledger, start row, imports, generated).
  const judged = head;
  const draft = typeof live?.draft === 'boolean' ? live.draft : eventDraft;
  if (draft !== eventDraft) {
    // Kept in the row too, so a run the race touched is visible without its log (review 1 of PR 74).
    runRow.event_draft = eventDraft;
    log(`the pull request is ${draft ? 'a draft' : 'ready'} now; the event said ${eventDraft ? 'draft' : 'ready'}: the gate judges it as it is now`);
  }
  const all = !pr ? [] : io.comments(slug, pr);
  const prior = gateRuns(all);
  // The receipt is read only from the pull request's opener (review of PR 13).
  const receipt = pr ? latestReceipt(all, opts.opener ?? live?.user?.login) : null;

  const job = branchModule(branch, new Set(entries.map((e) => e.id)));
  const entry = job ? entries.find((e) => e.id === job) || null : null;
  if (job && !entry) findings.push(F('ledger', entryFile(job), `branch ${branch} has no ledger entry`));
  // The job's branch is the one its latest start row names (a --fresh-branch start's job/<id>-<n>).
  const named = entry && startBranch(rowsAt(root, judged, job), job);
  if (named && named !== branch) findings.push(F('ledger', metricsFile(job), `branch ${branch} is not job ${job}'s branch: its latest start row names ${named}`));
  // A job PR into a layer branch may carry its own entry from the tranche, the ledger's home.
  const home = job && layerMode(cfg) && layerOfBranch(live?.base?.ref) !== null ? homeRef(root, cfg.tranche) : null;
  findings.push(...checkLedger(root, { ref: judged, base: mb, branch, home }));
  // The census of the change (R15, census.mjs): a plain pull request that adds a requirements file
  // or a modules row with no ledger entry, or an entry with no row or requirements file, is told
  // now, not by the refusal of the job start that would meet it.
  if (!job && cfg.modules_file) { try { findings.push(...changeGaps(root, cfg, { base: mb, head: judged, changed }).map((x) => F('census', x.file, x.message))); } catch (e) { log(`census of the change: unread (${String(e.message).slice(0, 120)})`); } }

  // A job writes only its module's files and tests, and its own records (ARC-2).
  if (entry) {
    for (const f of changed) if (!ownPaths(entry).some((p) => underPath(f, p))) findings.push(F('ownership', f, `job ${job} may not change files outside its module`));
  }
  // ARC-1: its imports are its own module or its declared uses. JOB-8: no generated artifact.
  const gen = generatedRows(cfg);
  findings.push(...gen.findings);
  if (entry) {
    const im = importFindings(root, cfg, { base, head: judged, entry, changed });
    if (im.skipped) { runRow.imports = 'skipped'; log(im.skipped); } else runRow.imports = im.findings.length ? 'fail' : 'pass';
    findings.push(...im.findings, ...committedGenerated(root, gen.rows, { head: judged, changed }));
  }

  // A plain pull request (not the tranche's own) that changes a generated file a module owns is a
  // refresh: every generated file it changes is removed, regenerated and compared, the ones no
  // module owns too, since a generator may read them (review 3 of PR 95). A plain pull request
  // that changes only generated files no module owns merges as any file does, unchecked here.
  const genChanged = !job && branch !== cfg.tranche ? changed.filter((f) => isGenerated(gen.rows, f)) : [];
  const plain = !job && branch !== cfg.tranche ? (genChanged.some((f) => entries.some((e) => inModule(e, f))) ? genChanged : []) : null;
  // Untracking (build untrack-generated): a removed generated file the head's .gitignore ignores
  // is built and verified, not compared; the .gitignore lines added for it are not other files.
  const untracked = plain?.length ? removedGenerated(root, gen.rows, plain, head).filter((f) => ignoredHere(root, f)) : [];
  const ignores = untracked.length ? ignoreLines(root, mb, head, changed, untracked) : [];
  // A pass (P7, Bob's Keep and Drop, 3 Nov: a no-judgment change across many modules is one
  // mechanical pass while no job runs, with one full test run), from a pass/<name> branch, which
  // only merge --plain --pass lands: each module it touches runs its whole suite, and its refresh
  // may change other files.
  const passPR = !job && PASS_BRANCH.test(branch || '');
  if (passPR) runRow.pass = true;
  // A lane's pull request (lane.mjs; Bob, 5 Nov): every file inside one lane's folder, records
  // aside, and not a job's nor the tranche's: the records-only path, no suite, no install or
  // build; the record checks above still run. A generated output is built, never committed.
  const lanePR = !job && branch !== cfg.tranche ? laneOnly(cfg, changed, entries) : null;
  if (lanePR) {
    runRow.lane = lanePR;
    for (const f of changed.filter((x) => isGenerated(gen.rows, x) && exists(root, head, x))) findings.push(F('generated', f, `${f} is a generated output; lane ${lanePR} does not commit it: it is built at layer close, deploy and release`));
  }
  // Each lane whose folder the pull request touches runs its own checks (coordinator, 6 Nov: ux lane
  // Q7's broken words build landed green): in place of the suite on a lane-only pull request, beside
  // whatever else runs on any other (cold review of PR 203). Installed and its generated files built
  // first, as a suite's are. Red when any fails.
  const touchedLanes = branch === cfg.tranche ? [] : [...new Set(changed.map((f) => laneOfPath(cfg, f, entries)).filter(Boolean))];
  const laneCmds = touchedLanes.map((name) => ({ name, cmds: laneChecks(cfg, name), dir: (Array.isArray(cfg.lanes) ? cfg.lanes : []).find((x) => x?.name?.trim?.() === name)?.dir || null }));
  for (const l of laneCmds.filter((x) => x.cmds === null)) findings.push(F('lane-checks', CONFIG_FILE, `lane ${l.name}'s checks in ${CONFIG_FILE} are not a list of commands (each a string or a list of words)`));
  const runLanes = laneCmds.filter((x) => x.cmds?.length);
  if (runLanes.length) {
    const inst = install(root, cfg.lockfiles, exec ? { exec } : {}).findings;
    findings.push(...inst);
    if (!inst.length && gen.rows.length) findings.push(...buildGenerated(root, gen.rows, { timeout, log, ...(exec ? { exec } : {}) }).findings);
    runRow.lane_checks = [];
    for (const l of runLanes) {
      const lc = inst.length ? { findings: [], ran: [] } : laneCheckRun(root, l.name, l.dir, l.cmds, { timeout, log, ...(exec ? { exec } : {}) });
      findings.push(...lc.findings);
      runRow.lane_checks.push(...lc.ran.map((x) => ({ lane: l.name, ...x })));
    }
  }
  // A ready job PR into a layer branch (layerflow.mjs) runs its suite even when it changes only
  // records: a rescheduled user re-publishes with no code change, and its run on the new layer tip,
  // against its provider's new version, is the evidence the layer's merge reads (cold review 1).
  const layerJob = !!job && layerMode(cfg) && layerOfBranch(live?.base?.ref) !== null;
  const recordOnly = !(layerJob && !draft) && (changed.every((f) => isRecordPath(cfg, f)) || !!lanePR);
  // The fast path stands on an earlier green run only when that run is verified (verifyRow).
  const lastGreen = prior.filter((r) => r.ok && r.trigger === 'code' && r.base === base).reverse().find((r) => io.verify(slug, r, { pr, baseRef: cfg.tranche }));
  const sinceGreen = lastGreen && git(['cat-file', '-e', `${lastGreen.sha}^{commit}`], { cwd: root, allowFail: true }).code === 0
    // A lane's folder counts as records here: a lane's land between a job's green run and its
    // merge does not send the job back through its suite (Bob, 5 Nov).
    && diffNames(root, lastGreen.sha, head).every((f) => isRecordOrLane(cfg, f, entries, { self: job }));

  // The base the job's change is reverted to: the first parent of GitHub's merge checkout,
  // the tranche as it was merged with, else the event's base.
  const parents = git(['rev-list', '--parents', '-n', '1', 'HEAD'], { cwd: root }).split(' ').slice(1);
  const revertBase = parents.length === 2 && parents[1] === head ? parents[0] : base;

  // A ready job's receipt is checked against CI's own run of its tests (AUD-2, JOB-7, SES-12).
  // Records only, the fast path stands only on a green code run that measured what the receipt
  // claims (measuredBy); with no such run the gate runs the suite here, so a records-only job pull
  // request, or a records-only head after a code run on another tree, is still checked. A plain
  // pull request, or a job's with no receipt yet, keeps the record fast path.
  const jobReceipt = entry && !draft && receipt?.module === job ? receipt : null;
  const stands = jobReceipt && sinceGreen && git(['merge-base', '--is-ancestor', jobReceipt.sha, head], { cwd: root, allowFail: true }).code === 0
    ? measuredBy(root, cfg, jobReceipt, lastGreen, entries) : null;
  const receiptRun = !!jobReceipt && (recordOnly || sinceGreen) && !stands?.ok;
  // The revert exemption (AUD-1, JOB-12): only a reviewed one recorded on the pull request, never
  // the receipt's own words (a receipt never exempts itself).
  const exemption = entry && !draft ? revertExemption(all, { root, cfg, head: judged, entry, job, jobSession: completeSession(rowsAt(root, judged, job)) }) : null;

  // The shared layer branch's merge (layerflow.mjs; Bob, 5 Nov: no test run at layer close): a pull
  // request from layer/<n> into the tranche, with the base's merge_strategy "layer", runs no suite;
  // each module it changes must be covered by its last land's verified green gate run, on a head
  // that held every interface change of its providers. Anything short is a finding, never a re-run.
  const layerPR = !job && layerMode(cfg) && layerOfBranch(branch) !== null && (live?.base?.ref ?? null) === cfg.tranche;
  if (recordOnly && !jobReceipt) runRow.trigger = 'record';
  else if (draft) runRow.trigger = 'draft';
  else if (layerPR) {
    runRow.trigger = 'layer';
    const lc = layerCover(root, cfg, { head, mb, branch, changed, entries, slug, io });
    const unreadable = lc.covered.filter((c) => c.pr_unreadable).map((c) => ({ id: c.id, pr: c.pr, why: c.pr_unreadable, ...(c.run_unreadable ? { run: c.run_unreadable } : {}) }));
    runRow.layer = { n: layerOfBranch(branch), covered: lc.covered.map((c) => c.id), findings: lc.findings.length, ...(unreadable.length ? { pr_unreadable: unreadable } : {}) };
    for (const u of unreadable) log(`${u.id}: PR ${u.pr} is not served by GitHub (${u.why}); covered from the state branch's land row and ${u.run ? `its gate row (${u.run})` : 'its gate run\'s artifact'}`);
    for (const c of lc.covered) log(`${c.id}: covered by its land of PR ${c.pr} (${String(c.merge).slice(0, 10)}); no suite runs`);
    findings.push(...lc.findings);
  }
  else if (sinceGreen && !receiptRun) { runRow.trigger = 'record-since-green'; runRow.after = lastGreen.sha; }
  else {
    runRow.trigger = 'code';
    if (receiptRun) log(`only records changed${sinceGreen ? ` since ${String(lastGreen.sha).slice(0, 10)}` : ''}, but no green code run measured receipt attempt ${jobReceipt.attempt}${stands ? ` (${stands.why})` : ''}: the gate runs the ${job} suite to check it`);
    // A job's PR runs its module; any other PR runs every module whose files it touches. The
    // tranche (into main) runs only the modules with a file its job merges did not gate.
    let touched = changed;
    if (!entry && branch && branch === cfg.tranche) {
      const c = trancheCover(root, cfg, { head, mb, changed, entries, slug, io, log });
      touched = c.uncovered;
      runRow.through = c.through;
      runRow.uncovered = c.uncovered.length;
    }
    const scope = entry ? [entry] : entries.filter((e) => touched.some((f) => inModule(e, f)));
    runRow.scope = scope.map((e) => e.id);
    // A pull request that is not a job's, touching no module's files, still has the generated rows
    // regenerated when it changes anything but records: a generator reads files outside every module
    // (the copy, 6 Nov: modules.json gained 7 rows and order.mjs went stale while the gate passed).
    const genRun = scope.length > 0 || (!job && gen.rows.length > 0 && touched.some((f) => !isRecordPath(cfg, f)));
    if (genRun && !scope.length) log('no module in scope: the generated rows are regenerated, as this change may be one a generator reads');
    // Base-red's tree (basered.mjs startBase): its install and build beside the head's, ready if
    // the suite fails. Not for the tranche into main, which tolerates nothing, nor with a stand-in
    // exec (the tests'), which a process of its own cannot use.
    // A change only to a module's requirements file runs only the tests that read it: read here
    // to know whether a suite runs at all, and again once the generated files are built.
    // Not for a job PR into a layer branch: its land must carry a run of the whole suite, which
    // the layer's merge reads (confirming review N1).
    const onlyAt = (e, l = () => {}) => (branch !== cfg.tranche && !layerJob && !passPR ? requirementsOnly(root, cfg, e, { changed, rows: gen.rows, log: l }) : null);
    // Only a suite whose failures can be read per test can be base-red.
    const mayBaseRed = scope.some((e) => reportsEvents(e.suite.command) && (onlyAt(e) === null || onlyAt(e).length));
    const prepared = mayBaseRed && branch !== cfg.tranche && !exec && opts.prepareBase !== false
      ? startBase(root, { base: revertBase, cfg, rows: gen.rows, timeout, log }) : null;
    // GAT-5: every lock file, installed where it sits.
    const inst = genRun ? install(root, cfg.lockfiles, exec ? { exec } : {}).findings : [];
    // A pull request run only for the generated rows (no module in scope) is not refused on an
    // install it never ran before: logged, and its generated checks skipped (cold review).
    if (scope.length) findings.push(...inst);
    else for (const f of inst) log(`install failed (${f.message}): the generated rows were not regenerated for this change`);
    // Generated files the commit does not track are built before the checks and the suite, as
    // deploy and release build them (copy, 4 Nov: an untracked rows.mjs failed 41 of 113 tests).
    let builtRows = new Set();
    if (genRun && !inst.length && gen.rows.length) {
      const b = buildGenerated(root, gen.rows, { timeout, log, ...(exec ? { exec } : {}) });
      runRow.built = b.built;
      builtRows = b.ran;
      findings.push(...b.findings);
    }
    // ARC-4: the entry's own checks, as job complete runs them.
    if (entry && !inst.length) findings.push(...entryChecks(root, entry, { timeout, log }));
    const results = [];
    const tolerated = [];
    for (const e of scope) {
      const only = onlyAt(e, log);
      if (only && !only.length) { (runRow.requirements_only ||= []).push({ module: e.id, files: [] }); results.push({ exit: 0, seconds: 0, tests: { total: 0, pass: 0, fail: 0 }, passing: [], output: '' }); continue; }
      if (only) (runRow.requirements_only ||= []).push({ module: e.id, files: only });
      const s = withEvents((events) => runSuite(root, e, only || undefined, { timeout, events }));
      results.push(s);
      if (s.exit !== 0) {
        // Base-red (basered.mjs): the failing tests run again at the tranche tip the PR merges
        // into; failures the base has too are not the PR's. Never for the tranche into main,
        // where every failure tolerated on the way is owed.
        // Its own budget, not what the suite left (copy, 4 Nov: plane's suite takes 19-20 of 20 min).
        const br = branch !== cfg.tranche && !/ETIMEDOUT/.test(s.output)
          ? baseRed(root, e, { base: revertBase, failing: s.failing, cfg, rows: gen.rows, timeout, ...(exec ? { exec } : {}), log, prepared })
          : null;
        if (br?.ok) {
          s.baseRed = true;
          tolerated.push({ module: e.id, ...br.base_red });
          log(`the ${e.id} suite failed (exit ${s.exit}), but each of its ${br.base_red.tests.length} failing test(s) fails at the base ${String(revertBase).slice(0, 10)} too: tolerated as base-red, owed at the layer close and the tranche into main:\n${br.base_red.tests.map((t) => `  ${t}`).join('\n')}`);
          continue;
        }
        findings.push(F('suite', e.tests[0], `the ${e.id} suite failed (exit ${s.exit}${/ETIMEDOUT/.test(s.output) ? ', timed out' : ''}): ${JSON.stringify(s.tests)}${br ? `; not base-red: ${br.why}` : ''}`));
        log(s.output.split('\n').slice(-60).join('\n'));
      } else if (!s.tests.total) findings.push(F('suite', e.tests[0], `zero tests ran in ${e.id}`));
    }
    if (tolerated.length) runRow.base_red = tolerated;
    gatePassed = passedByFile(results);
    prepared?.drop();
    if (scope.length) {
      runRow.suite = results.every((s) => s.exit === 0) ? 'pass' : results.every((s) => s.exit === 0 || s.baseRed) ? 'base-red' : 'fail';
      runRow.tests = results.map((s) => s.tests);
      runRow.suite_seconds = results.reduce((t, s) => t + s.seconds, 0);
      // Each module's own suite seconds (build ci-budget, R2): status warns when one nears
      // suite_timeout_minutes, which bounds each suite alone. A requirements-only skip ran nothing.
      runRow.suite_by_module = Object.fromEntries(scope.map((e, k) => [e.id, results[k]?.seconds]).filter(([id, sec]) => Number.isFinite(sec) && !runRow.requirements_only?.some((x) => x.module === id && !x.files?.length)));
    }
    // AUD-1, JOB-12: the job's new or changed tests must fail with its change reverted. A test
    // that still passes (inert) fails the gate. A refactor whose tests rightly pass before and
    // after takes a reviewed exemption recorded on its pull request (revertExemption); the
    // receipt's own --exempt-revert is the job's request for one, never the exemption itself.
    if (entry && ['pass', 'base-red'].includes(runRow.suite)) {
      const tests = changed.filter((f) => entry.tests.some((t) => underPath(f, t)) && f.endsWith(suffixOf(entry)) && existsSync(join(root, f)));
      // The requirements file's struck marks are not code: reverting them proves nothing.
      const code = changed.filter((f) => !isRecordPath(cfg, f) && f !== entry.requirements && !entry.tests.some((t) => underPath(f, t)));
      if (!code.length) runRow.revert = 'no code changed';
      else if (!tests.length) runRow.revert = 'no test changed';
      else if (exemption?.ok) {
        // The reviewed exemption decides the verdict whatever the run would find: not run (build gate-speed).
        runRow.revert = 'exempt';
        runRow.revert_exempt = { by: exemption.by, sha: exemption.sha };
        log(`the revert check is exempt by ${printable(exemption.by, 60)}'s reviewed exemption on ${String(exemption.sha).slice(0, 10)} (${printable(exemption.why)}): not run`);
      } else {
        if (exemption) log(`the revert exemption on this pull request does not stand: ${exemption.why}`);
        const t0 = Date.now();
        const r = revertCheck(root, entry, revertBase, code, tests, { timeout, tolerated: (runRow.base_red || []).flatMap((b) => b.tests) });
        log(`revert check: ${tests.length} test file(s) in ${Math.round((Date.now() - t0) / 1000)} s, ${r.alone} run alone`);
        runRow.revert = r.inert.length ? 'fail' : 'pass';
        runRow.inert = r.inert;
        // A test that fails only because a new file is gone cannot load; it is not proof the
        // test checks behaviour. Counted for review, not failed.
        runRow.load_only = r.loadOnly;
        const asked = receipt?.module === job ? receipt.exempt?.revert : undefined;
        for (const t of r.inert) findings.push(F('revert', t, `passes with the change reverted: the test does not test the change (AUD-1, JOB-12)${asked ? `; the receipt asks for an exemption (${printable(asked)}), which stands only as a reviewed one on the pull request: ${P3_EXEMPT}` : ''}`));
      }
    }
    // GAT-4: regenerate every generated row, verify those whose paths changed; nothing committed.
    if (genRun && gen.rows.length && (scope.length || !inst.length)) {
      // A refreshed file is removed first, so a clean status after the regenerate means the
      // regenerate wrote those bytes, not that it left the commit's own (review 1 of PR 95).
      if (plain?.length) for (const f of plain) rmSync(join(root, f), { force: true });
      // A row built before the suite runs again when it writes a refreshed file just removed.
      const g = regenerate(root, gen.rows, { timeout, log, stale: !job, judged: [...(plain || []), ...findings.filter((f) => f.check === 'generated').map((f) => f.file)], skip: plain?.length ? new Set([...builtRows].filter((r) => !plain.some((f) => isGenerated([r], f)))) : builtRows });
      runRow.generated = g.ran;
      // A committed file stale at the base too, the same file after the base's regenerate, is
      // inherited: a notice, owed by a plain refresh, not this pull request's finding (the
      // coordinator, 6 Nov, as base-red is). The base is regenerated only when the head made one stale.
      // Never on the tranche into main, which tolerates nothing, and never a file this pull request
      // changes itself (cold review: a hand-edited stale file the base's regenerate also differs from).
      const staleF = branch === cfg.tranche ? [] : g.findings.filter((f) => / is stale at this commit: /.test(f.message) && !changed.includes(f.file));
      if (staleF.length) {
        const at = staleAtBase(root, base, gen.rows, staleF.map((f) => f.file), { lockfiles: cfg.lockfiles, timeout, ...(exec ? { exec } : {}), log });
        if (!at.ok) { runRow.stale_base_unread = String(at.why).slice(0, 200); log(`stale at the base: unread (${at.why}); the stale finding(s) stand`); }
        else if (at.files.length) {
          runRow.stale_base = at.files;
          for (const f of at.files) log(`notice: ${f} is stale on the base ${String(base).slice(0, 10)} too: owed by a plain refresh, not this pull request's`);
          g.findings = g.findings.filter((f) => !(staleF.includes(f) && at.files.includes(f.file)));
        }
      }
      findings.push(...g.findings);
    }
    // A plain pull request may change a module's committed generated files only to what this
    // regenerate wrote from its commit (copy PR 148); the row records the comparison, and merge
    // --plain reads it.
    if (plain) {
      if (untracked.length && runRow.generated) findings.push(...verifyUntracked(root, gen.rows, untracked, { timeout, log, ...(exec ? { exec } : {}) }));
      const c = refreshCheck(root, plain, { ran: !!runRow.generated, failed: findings.some((f) => f.check === 'generated'), others: passPR ? [] : refreshOthers(cfg, gen.rows, changed, entriesAt(root, base), ignores), untracked });
      if (c.refresh) runRow.refresh = c.refresh;
      findings.push(...c.findings);
    }
  }
  // Only records changed since the green code run: its comparison stands for these same files.
  // Not when a generated file is among them (a generated path under a records path): its bytes
  // changed after that comparison (review 4 of PR 95).
  if (runRow.trigger === 'record-since-green' && plain?.length && lastGreen.refresh
    && !diffNames(root, lastGreen.sha, head).some((f) => isGenerated(gen.rows, f))) runRow.refresh = lastGreen.refresh;

  // The receipt against CI's own run of its tests (AUD-2, JOB-7): present, naming a commit on this
  // branch, agreeing on the suite and on each test it names. A disagreement is a finding and
  // refutes the COMPLETE claim (metrics.mjs refutes, SES-12).
  if (job && !draft && runRow.trigger !== 'record') {
    if (!receipt || receipt.module !== job) {
      runRow.receipt = 'none';
      findings.push(F('receipt', entryFile(job), 'the pull request is ready but has no receipt (job complete posts it)'));
    } else {
      runRow.receipt_attempt = receipt.attempt;
      const onBranch = git(['merge-base', '--is-ancestor', receipt.sha, head], { cwd: root, allowFail: true }).code === 0;
      const claimed = receipt.commands?.find((c) => c.suite);
      if (!onBranch) findings.push(F('receipt', entryFile(job), `the receipt names ${String(receipt.sha).slice(0, 10)}, which is not on this branch`));
      // Records only since the last green code run (copy PR 105, 4 Nov: a receipt-only commit after
      // a green code gate): the receipt is checked against that run when it was made on the tree
      // that run tested, so the claim is of the same tree, suite and results.
      const measured = onBranch && runRow.trigger === 'record-since-green' ? measuredBy(root, cfg, receipt, lastGreen, entries) : null;
      const suite = measured?.ok ? lastGreen.suite : runRow.suite;
      if (measured?.ok) runRow.receipt_measured = lastGreen.sha;
      else if (measured) runRow.receipt_unmeasured = measured.why;
      const red = measured?.ok ? lastGreen.base_red : runRow.base_red;
      // The excused tests the gate's run saw pass (copy plane PR 175: three failed in the job's
      // container and passed on the runner); kept in the row for a records-only run after it.
      const passed = measured?.ok ? (Array.isArray(lastGreen.receipt_passed) ? lastGreen.receipt_passed : [])
        : [...new Set(claimedRed(claimed))].filter((t) => gatePassed?.ids.has(t));
      if (!measured?.ok && passed.length) runRow.receipt_passed = passed;
      // The tests the receipt names for its struck marks, against what CI's run saw: one that ran
