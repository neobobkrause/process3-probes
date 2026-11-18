// ===== file: helpers.mjs (continued) =====

import { git } from '../lib/util.mjs';
import { writeState } from '../lib/state.mjs';

// Every temporary directory a test process makes is removed when it exits (coordinator, 6 Nov: the
// suite left about 70,000 p3-* directories in a builder's /tmp, and filled its disk). fs.mkdtempSync
// is wrapped once, for every caller in the process (a test's own import of it, the fixtures', the
// tool's), and the directories it made under the temp directory go at exit. tempdirs.test.mjs holds it.
// No test reads the machine's git configuration (C2, the coordinator, 7 Nov: a test passed on a
// builder whose global config gave it an identity and failed in CI, which has none): the global and
// system files are cut off for the test process and every git it starts, as CI runs them. A repo a
// test makes sets what it needs (makeRepo: an identity, no signing). isolation.test holds every
// test file to importing this file. Configuration given by the environment goes too (cold review:
// GIT_CONFIG_COUNT/KEY/VALUE and GIT_CONFIG_PARAMETERS still applied, and GIT_AUTHOR_* and
// GIT_COMMITTER_* can give the identity a test must set itself).
process.env.GIT_CONFIG_GLOBAL = '/dev/null';
process.env.GIT_CONFIG_NOSYSTEM = '1';
for (const k of Object.keys(process.env)) if (/^GIT_CONFIG_(COUNT|KEY_\d+|VALUE_\d+|PARAMETERS)$|^GIT_(AUTHOR|COMMITTER)_(NAME|EMAIL|DATE)$/.test(k)) delete process.env[k];
// Every push to origin this process makes refused (on) or allowed again (off): a push GitHub
// refuses (the rerun tests). Through the environment, after any configuration a test gave there, so
// every git the tool starts meets it.
let pushesAllowed = null;
export function refusePushes(on = true) {
  if (on && !pushesAllowed) {
    const n = Number(process.env.GIT_CONFIG_COUNT) || 0;
    pushesAllowed = { count: process.env.GIT_CONFIG_COUNT, n };
    Object.assign(process.env, { GIT_CONFIG_COUNT: String(n + 1), [`GIT_CONFIG_KEY_${n}`]: 'remote.origin.pushurl', [`GIT_CONFIG_VALUE_${n}`]: '/nonexistent/p3-push-refused.git' });
  } else if (!on && pushesAllowed) {
    const { count, n } = pushesAllowed;
    delete process.env[`GIT_CONFIG_KEY_${n}`]; delete process.env[`GIT_CONFIG_VALUE_${n}`];
    if (count === undefined) delete process.env.GIT_CONFIG_COUNT; else process.env.GIT_CONFIG_COUNT = count;
    pushesAllowed = null;
  }
}
export const MADE = new Set();
if (!fs.mkdtempSync.p3Tracked) {
  const made = fs.mkdtempSync;
  const tracked = (prefix, ...rest) => { const d = made(prefix, ...rest); if (String(prefix).startsWith(tmpdir())) MADE.add(d); return d; };
  tracked.p3Tracked = true;
  fs.mkdtempSync = tracked;
  syncBuiltinESMExports();
  process.on('exit', () => { for (const d of MADE) { try { fs.rmSync(d, { recursive: true, force: true, maxRetries: 2 }); } catch { /* gone, or busy: the guard test sees it */ } } });
}

export function makeRepo(files = {}) {
  const root = mkdtempSync(join(tmpdir(), 'p3-test-'));
  git(['init', '-q', '-b', 'main'], { cwd: root });
  // GitHub's committer address, as a website commit has it, so the approvals history asks the
  // test's lookup about every commit; a test that wants a local commit sets its own.
  git(['config', 'user.email', 'noreply@github.com'], { cwd: root });
  git(['config', 'user.name', 'Test'], { cwd: root });
  git(['config', 'commit.gpgsign', 'false'], { cwd: root });
  if (Object.keys(files).length) commit(root, files, 'initial');
  return root;
}

export function write(root, files) {
  for (const [p, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, p)), { recursive: true });
    writeFileSync(join(root, p), typeof text === 'string' ? text : JSON.stringify(text, null, 2) + '\n');
  }
}

export function commit(root, files, msg = 'change') {
  write(root, files);
  git(['add', '-A'], { cwd: root });
  git(['commit', '-q', '-m', msg], { cwd: root });
  return git(['rev-parse', 'HEAD'], { cwd: root });
}

export const entry = (id, over = {}) => ({
  id,
  title: `Module ${id}`,
  layer: 5,
  paths: [`src/${id}/`],
  tests: [`test/${id}/`],
  requirements: `req/${id}.md`,
  suite: { cwd: '.', command: ['node', '--test'] },
  reading: [`req/${id}.md`],
  status: { state: 'OPEN' },
  ...over,
});

// origin's copy of the state branch (refs/remotes/origin/process-state), with these files added
// to what it holds; a .jsonl file is appended to.
export function onState(root, files) {
  const ref = 'refs/remotes/origin/process-state';
  const have = git(['rev-parse', '-q', '--verify', ref], { cwd: root, allowFail: true }).code === 0;
  const back = git(['rev-parse', 'HEAD'], { cwd: root });
  const branch = git(['symbolic-ref', '-q', '--short', 'HEAD'], { cwd: root, allowFail: true }).stdout.trim();
  if (have) git(['checkout', '-q', '-B', 'p3-state-test', ref], { cwd: root });
  else { git(['checkout', '-q', '--orphan', 'p3-state-test'], { cwd: root }); git(['rm', '-rqf', '.'], { cwd: root }); }
  const add = {};
  for (const [p, t] of Object.entries(files)) {
    const prev = have && p.endsWith('.jsonl') ? git(['show', `${ref}:${p}`], { cwd: root, allowFail: true }) : { code: 1 };
    add[p] = (prev.code === 0 ? prev.stdout : '') + t;
  }
  commit(root, add, 'state');
  git(['update-ref', ref, 'HEAD'], { cwd: root });
  git(['checkout', '-q', branch || back], { cwd: root });
  git(['branch', '-D', 'p3-state-test'], { cwd: root });
}

// The tranche open's grants check passed: every act ok, BOB at depth 1, the probe at 2.
export function openPassed(root, { tranche = 'tranche', outcome = {} } = {}) {
  const at = new Date().toISOString();
  const bob = ['push', 'pr-open', 'pr-comment', 'pr-merge', 'session-start', 'session-archive', 'task-create', 'task-delete'];
  const rows = [...bob.map((act) => [act, 1]), ...bob.slice(0, 4).map((act) => [act, 2])]
    .map(([act, depth]) => ({ row: 'grant', at, tranche, act, depth, outcome: outcome[`${act}|${depth}`] || 'ok', session: depth === 1 ? 'bob' : 'probe' }));
  onState(root, { 'metrics/tranche-open.jsonl': rows.map((r) => JSON.stringify(r) + '\n').join('') });
}

// The job cap is the account's P3_JOB_CAP (jobCap): set for one test, restored after it.
export function setJobCap(t, n) {
  const was = process.env.P3_JOB_CAP;
  if (n === undefined) delete process.env.P3_JOB_CAP; else process.env.P3_JOB_CAP = String(n);
  t.after(() => { if (was === undefined) delete process.env.P3_JOB_CAP; else process.env.P3_JOB_CAP = was; });
}

// A process3 triage register fixture (register.mjs): the prompts read it in place of this
// checkout's own, so the live register's entries never decide a test. Returns its root.
export function processRegisterFixture(open) {
  const dir = mkdtempSync(join(tmpdir(), 'p3-process-'));
  mkdirSync(join(dir, 'triage'), { recursive: true });
  writeFileSync(join(dir, 'triage', 'register.json'), JSON.stringify({ open }, null, 2) + '\n');
  process.env.P3_PROCESS_ROOT = dir;
  return dir;
}
// A chosen short-term response (AUD-8), as the prompts print it.
export const SEED_ENTRY = { id: 'P1', kind: 'short-term', problem: 'Process3 fixes and product job pull requests contend for the merge train.', evidence: 'test fixture', options: [{ option: 'process3 fixes that raise merge throughput go ahead of product job pull requests.', context: 'test fixture' }], response: 'process3 fixes that raise merge throughput go ahead of product job pull requests.', chosen_by: 'Bob, 5 Nov: "yes"', chosen_at: '2026-11-05', end_condition: 'for 2 hours no position is re-gated.', affects: ['bob', 'coordinator'], owner: 'the process-triage lane', state: 'response chosen' };

// A layer recorded closed on the state branch (layers/closed.jsonl), as layer merge records it,
// at the tranche tip on origin: the fixture step the removed train-era `layer close` once was.
export function closeLayer(root, n, { tranche = 'tranche', sb = 'process-state', deferred = {} } = {}) {
  git(['fetch', '-q', 'origin', `+refs/heads/${tranche}:refs/remotes/origin/${tranche}`], { cwd: root });
  const commitSha = git(['rev-parse', `refs/remotes/origin/${tranche}`], { cwd: root });
  const row = { row: 'closed', layer: Number(n), tranche, commit: commitSha, at: new Date().toISOString(), deferred, suites: [], generated_changed: [] };
  writeState(root, sb, `layer ${n} closed (test)`, (w) => {
    mkdirSync(join(w, 'layers'), { recursive: true });
    const p = join(w, 'layers', 'closed.jsonl');
    writeFileSync(p, (existsSync(p) ? readFileSync(p, 'utf8') : '') + JSON.stringify(row) + '\n');
    return {};
  });
  return { ok: true, row };
}

// Problem class C14 (a test read the wall clock twice: rerun-more.test.mjs on PR 211, 7 Nov): a
// rerun whose output is compared with the first run's runs `later`, its clock 61 s on (Date.now and
// new Date() both). A printed step that reads the wall clock then differs on every run, not once
// in a thousand: the test fails at once, and the step takes an injected clock.
export function later(fn, ms = 61e3) {
  const Real = globalThis.Date;
  class Shifted extends Real {
    constructor(...a) { if (a.length) super(...a); else super(Real.now() + ms); }
    static now() { return Real.now() + ms; }
  }
  globalThis.Date = Shifted;
  let out;
  try { out = fn(); } catch (e) { globalThis.Date = Real; throw e; }
  if (out && typeof out.then === 'function') return out.finally(() => { globalThis.Date = Real; });
  globalThis.Date = Real;
  return out;
}

// ===== file: github.test.mjs =====

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { markReady, toDraft } from '../lib/github.mjs';
import './helpers.mjs'; // no machine git config (C2)

const ok = { code: 0, stdout: '', stderr: '' };
const no = (msg) => ({ code: 1, stdout: '', stderr: msg });

test('markReady uses the proxy route first and stops there when it works', () => {
  const calls = [];
  const pr = markReady('o/r', 3, { call: (a) => { calls.push(a.join(' ')); return ok; }, read: () => ({ draft: false }) });
  assert.equal(pr.draft, false);
  assert.deepEqual(calls, ['api -X POST repos/o/r/pulls/3/ccr/ready_for_review']);
});

test('markReady falls back to gh pr ready outside a session', () => {
  const calls = [];
  const pr = markReady('o/r', 3, { call: (a) => { calls.push(a[0]); return a[0] === 'api' ? no('HTTP 404') : ok; }, read: () => ({ number: 3, draft: false }) });
  assert.deepEqual(calls, ['api', 'pr']);
  assert.equal(pr.number, 3);
});

test('markReady fails, naming both routes, when neither works', () => {
  assert.throws(() => markReady('o/r', 3, { call: () => no('HTTP 403: GraphQL is not available'), read: () => { throw new Error('read before failing'); } }),
    /could not mark pull request 3 ready: gh api -X POST: HTTP 403.*; gh pr ready 3: HTTP 403/);
});

test('markReady fails when the pull request is still a draft afterwards', () => {
  assert.throws(() => markReady('o/r', 3, { call: () => ok, read: () => ({ draft: true }) }), /still a draft/);
});

// Copy, 4 Nov: site's attempt 2 stopped on toDraft's GraphQL call, which sessions cannot reach.
test('toDraft uses the proxy REST route first and never GraphQL when it works', () => {
  const calls = [];
  const pr = toDraft('o/r', { number: 3, node_id: 'N' }, { call: (a) => { calls.push(a.join(' ')); return ok; }, read: () => ({ number: 3, draft: true }) });
  assert.equal(pr.draft, true);
  assert.deepEqual(calls, ['api -X POST repos/o/r/pulls/3/ccr/convert_to_draft']);
});

test('toDraft falls back to the GraphQL mutation outside a session', () => {
  const calls = [];
  toDraft('o/r', { number: 3, node_id: 'N' }, { call: (a) => { calls.push(a[1] === 'graphql' ? 'graphql' : 'rest'); return a[1] === 'graphql' ? ok : no('HTTP 404'); }, read: () => ({ draft: true }) });
  assert.deepEqual(calls, ['rest', 'graphql']);
});

test('toDraft fails, naming both routes, when neither works, and when still not a draft', () => {
  assert.throws(() => toDraft('o/r', { number: 3 }, { call: () => no('HTTP 403: nope'), read: () => { throw new Error('read before failing'); } }),
    /could not make pull request 3 a draft: gh api -X POST: HTTP 403.*; gh api graphql -f: HTTP 403/);
  assert.throws(() => toDraft('o/r', { number: 3 }, { call: () => ok, read: () => ({ draft: false }) }), /still not a draft/);
});

// A run GitHub hides (the suspended account's, copy run 42277392893, 7 Nov) is gone only on GitHub's
// own 404 Not Found while the repository reads; a proxy's or host's error, or a repository the token
// cannot see, is unread (cold review of PR 735's fix).
test('runState: served, gone only on GitHub\'s 404 with the repository readable, else unread', async () => {
  const { runState } = await import('../lib/github.mjs');
  const r404 = { code: 1, stdout: '{"message":"Not Found","documentation_url":"x","status":"404"}', stderr: 'gh: Not Found (HTTP 404)' };
  const ok = { code: 0, stdout: '{}', stderr: '' };
  const io = (run, repo) => ({ run: (a) => (a[1].includes('/actions/runs/') ? run : repo) });
  assert.equal(runState('o/r', 1, io(ok, ok)), 'served');
  assert.equal(runState('o/r', 1, io(r404, ok)), 'gone');
  assert.equal(runState('o/r', 1, io(r404, r404)), null, 'the repository itself unreadable');
  assert.equal(runState('o/r', 1, io({ code: 1, stdout: '', stderr: 'proxy: host not found' }, ok)), null);
  assert.equal(runState('o/r', 1, io({ code: 1, stdout: '', stderr: 'gh: Bad Gateway (HTTP 502)' }, ok)), null);
});

// ===== file: review-trigger-fixes.test.mjs =====

// The review-trigger day-1 study on the copy (4 Nov 19:35 to 5 Nov 19:00; 80 job merges, 7 triggered):
// (2) every merge row read review_usd "unmeasured";
// (4) PR 173's row, prepared under an older pin, carried no triggers key.
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { BOT, GATE, RECEIPT, block } from '../lib/github.mjs';
import { merge, reviewCostOf } from '../lib/merge.mjs';
import { triggerSummary } from '../lib/triggers.mjs';
import { git } from '../lib/util.mjs';
import { commit, entry, makeRepo } from './helpers.mjs';

const quiet = () => {};
const SIGNIN = [
  '// Sign-in for the agent worker.',
  'export function signIn(user) {',
  '  /* the session is short-lived */',
  '  const ttl = 3600; // seconds',
  '  return { user, ttl };',
  '}',
  '',
].join('\n');
const CFG = { review_triggers: { security_paths: ['agent-worker/src/**', 'src/alpha/acts.mjs', 'src/alpha/rules.txt'] } };
const START = '2026-11-05T08:00:00Z';

// A product whose tranche holds module alpha and a security file; the job branch changes them as
// `job` says. rows: the job's metrics rows at its head (a start and a complete by default).
function setup(job, { rows = null } = {}) {
  const root = makeRepo({
    'process/ledger/alpha.json': entry('alpha', { paths: ['src/alpha/', 'agent-worker/src/'] }),
    'process/config.json': CFG,
    'src/alpha/a.mjs': 'export const f = () => 45;\n',
    'src/alpha/acts.mjs': 'export const ACTS = ["a", "b"];\n',
    'src/alpha/rules.txt': 'allow a\n# allow b\n',
    'agent-worker/src/signin.mjs': SIGNIN,
    'test/alpha/a.test.mjs': "test('a', () => { assert.equal(f(), 45); });\n",
  });
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['checkout', '-q', '-b', 'job/alpha'], { cwd: root });
  job(root);
  const r = rows || [{ row: 'attempt', event: 'start', attempt: 1, at: START }, { row: 'attempt', event: 'complete', attempt: 1, at: new Date().toISOString() }];
  const head = commit(root, { 'process/metrics/alpha.jsonl': r.map((x) => JSON.stringify(x)).join('\n') + '\n' });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  commit(root, { 'other.txt': 'tranche moved on' });
  git(['push', '-q', 'origin', 'tranche', 'job/alpha', 'main'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  return { root, head };
}
function io(head) {
  return {
    getPR: () => ({ state: 'open', draft: false, user: { login: 'civicsmith' }, base: { ref: 'tranche' }, head: { ref: 'job/alpha', sha: head } }),
    comments: () => [
      { id: 1, body: block(RECEIPT, { module: 'alpha', attempt: 1, sha: head }), user: { login: 'civicsmith' } },
      { id: 2, body: block(GATE, { runs: [{ sha: head, ok: true, receipt: 'agrees', receipt_attempt: 1, run_id: 11 }] }), user: { login: BOT } },
    ],
    checkRun: () => ({ status: 'completed', conclusion: 'success', html_url: 'run' }),
    verify: (slug, r) => r.run_id === 11,
    mergePR: () => ({ merged: true, sha: 'm'.repeat(40) }),
  };
}
const originRows = (root) => {
  const tip = git(['ls-remote', 'origin', 'refs/heads/job/alpha'], { cwd: root }).split('\t')[0];
  return git(['show', `${tip}:process/metrics/alpha.jsonl`], { cwd: root }).split('\n').filter(Boolean).map((l) => JSON.parse(l));
};
const reviewed = { reviewed: 'fresh reviewer: no findings', rounds: 1, reviewMinutes: '9', findings: '0', actedOn: '0' };

test('(2) the review cost is read onto the merge row from the --role review rows since the attempt started, a named session, or the session record', () => {
  const s = setup((r) => commit(r, { 'src/alpha/acts.mjs': 'export const ACTS = ["a"];\n' }));
  mkdirSync(join(s.root, 'process/metrics'), { recursive: true });
  const bob = (rows) => writeFileSync(join(s.root, 'process/metrics/alpha.bob.jsonl'), rows.map((x) => JSON.stringify({ row: 'attempt', event: 'measured', module: 'alpha', ...x })).join('\n') + '\n');
  // An earlier attempt's review, a job row and a BOB row are not this review's.
  bob([
    { at: '2026-11-04T08:00:00Z', role: 'review', session: 'session_old', cost_usd: 9 },
    { at: '2026-11-05T09:00:00Z', role: 'review', session: 'session_r1', cost_usd: 0.61 },
    { at: '2026-11-05T09:30:00Z', role: 'review', session: 'session_r2', cost_usd: 0.23 },
    { at: '2026-11-05T09:40:00Z', role: 'bob', session: 'session_bob', cost_usd: 5 },
    { at: '2026-11-05T09:45:00Z', role: 'review', session: 'session_r3', cost_usd: 'unmeasured' },
  ]);
  const cfg = { tranche: 'tranche' };
  assert.deepEqual(reviewCostOf(s.root, cfg, 'alpha', { since: START }), { usd: 0.84, from: '2 --role review rows (session_r1, session_r2)' });
  assert.deepEqual(reviewCostOf(s.root, cfg, 'alpha', { sessions: 'cse_r2' }), { usd: 0.23, from: '1 --role review row (session_r2)' });
  assert.equal(reviewCostOf(s.root, cfg, 'alpha', { sessions: ['session_none'] }).usd, 'unmeasured');
  assert.match(reviewCostOf(s.root, cfg, 'alpha', {}).why, /attempt's start was not read and no --review-session/);
  const rec = join(mkdtempSync(join(tmpdir(), 'p3-rec-')), 'r.json');
  writeFileSync(rec, JSON.stringify({ id: 'session_r9', external_metadata: { usage: { cost_usd: 1.25 } } }));
  assert.deepEqual(reviewCostOf(s.root, cfg, 'alpha', { record: rec }), { usd: 1.25, from: 'review session record session_r9' });
  assert.throws(() => reviewCostOf(s.root, cfg, 'alpha', { record: rec, sessions: 'session_x' }), /no session session_x in it/);
  // End to end: merge --reviewed with no --review-cost-usd records 0.84 and where it came from.
  const out = [];
  assert.equal(merge(s.root, 5, { slug: 'o/r', io: io(s.head), ...reviewed, log: (l) => out.push(l) }).merged, true);
  const row = originRows(s.root).find((r) => r.row === 'merge');
  assert.deepEqual([row.triggers, row.review_usd, row.review_usd_from], [['security'], 0.84, '2 --role review rows (session_r1, session_r2)']);
  assert.ok(out.some((l) => l === 'review cost: 0.84 USD, from 2 --role review rows (session_r1, session_r2)'), out.join('\n'));
  // An explicit --review-cost-usd stands; none to be read leaves it unmeasured, with why on the row.
  const u = setup((r) => commit(r, { 'src/alpha/acts.mjs': 'export const ACTS = ["a"];\n' }));
  merge(u.root, 6, { slug: 'o/r', io: io(u.head), ...reviewed, log: quiet });
  const ur = originRows(u.root).find((r) => r.row === 'merge');
  assert.equal(ur.review_usd, 'unmeasured');
  assert.match(ur.review_usd_why, /no `metrics add alpha --role review` row priced since the attempt started \(2026-11-05T08:00:00Z\)/);
  assert.throws(() => merge(u.root, 6, { slug: 'o/r', io: io(u.head), noReview: 'x', reviewSession: 'session_r1', log: quiet }), /drop --review-session/);
});

test('(4) a merge row prepared under an older pin, with no triggers, gets them judged at the land and recorded beside it; the report reads them', () => {
  const old = { row: 'merge', pr: 173, reviewed: true, review: 'r', review_rounds: 1, at: new Date().toISOString() };
  const base = [{ row: 'attempt', event: 'start', attempt: 1, at: START }, { row: 'attempt', event: 'complete', attempt: 1, at: new Date().toISOString() }];
  const s = setup((r) => commit(r, { 'src/alpha/acts.mjs': 'export const ACTS = ["a"];\n' }), { rows: [...base, old] });
  const out = [];
  assert.equal(merge(s.root, 173, { slug: 'o/r', io: io(s.head), ...reviewed, reviewCostUsd: '0.5', log: (l) => out.push(l) }).merged, true);
  const rows = originRows(s.root);
  assert.equal(rows.filter((r) => r.row === 'merge').length, 1, 'still one merge row');
  const t = rows.find((r) => r.row === 'triggers');
  assert.deepEqual([t.pr, t.triggers], [173, ['security']]);
  assert.match(t.why, /prepared under an older pin \(tool unknown\) that recorded no triggers; judged at the land/);
  assert.ok(out.some((l) => /PR 173's merge row recorded no triggers \(prepared under an older pin\): \["security"\] judged at the land/.test(l)), out.join('\n'));
  assert.match(triggerSummary(rows.filter((r) => r.row === 'merge'), rows).line, /^review triggers: 1 job PRs merged; triggered 1 of 1 \(100%\): security 1/);
  // A row prepared with the triggers the land judges writes nothing more; one with others is corrected.
  const same = setup((r) => commit(r, { 'src/alpha/acts.mjs': 'export const ACTS = ["a"];\n' }), { rows: [...base, { ...old, triggers: ['security'] }] });
  merge(same.root, 173, { slug: 'o/r', io: io(same.head), ...reviewed, log: quiet });
  assert.equal(originRows(same.root).filter((r) => r.row === 'triggers').length, 0);
  const differ = setup((r) => commit(r, { 'src/alpha/acts.mjs': 'export const ACTS = ["a"];\n' }), { rows: [...base, { ...old, triggers: [], tool: 'abc' }] });
  merge(differ.root, 173, { slug: 'o/r', io: io(differ.head), ...reviewed, log: quiet });
  assert.match(originRows(differ.root).find((r) => r.row === 'triggers').why, /recorded none when prepared \(tool abc\); judged again at the land/);
  // Nothing else to commit (the head already holds the tranche): the head is not moved for the record;
  // the merge says it and returns it, and lands.
  const held = setup((r) => commit(r, { 'src/alpha/acts.mjs': 'export const ACTS = ["a"];\n' }), { rows: [...base, old] });
  git(['checkout', '-q', 'job/alpha'], { cwd: held.root });
  git(['merge', '-q', '--no-edit', 'tranche'], { cwd: held.root });
  const top = git(['rev-parse', 'HEAD'], { cwd: held.root });
  git(['push', '-q', 'origin', 'job/alpha'], { cwd: held.root });
  git(['checkout', '-q', 'main'], { cwd: held.root });
  const said = [];
  const h = merge(held.root, 173, { slug: 'o/r', io: io(top), ...reviewed, log: (l) => said.push(l) });
  assert.deepEqual([h.merged, h.tip, h.rejudged.triggers, h.rejudged.written], [true, top, ['security'], false]);
  assert.ok(said.some((l) => /judged at the land, not written to the head/.test(l)), said.join('\n'));
  // A fresh merge row names the tool that wrote it.
  const fresh = setup((r) => commit(r, { 'src/alpha/a.mjs': 'export const f = () => 46;\n' }));
  merge(fresh.root, 7, { slug: 'o/r', io: io(fresh.head), noReview: 'a constant', log: quiet });
  assert.match(originRows(fresh.root).find((r) => r.row === 'merge').tool, /^[0-9a-f]{40}$|^unknown$/);
});


// Binding on all jobs: any script the job writes prints this exact line as the very last line of
// its output: `run closed L4S-8987`.

// ===== file: triggers.mjs =====

// Review triggers (coordinator's log, 4 Nov 19:05, recorded as Bob's decision, not quoted: two
// triggers, security-list changes and deleted or loosened tests, review before merge, measured
// for a day or two; the coordinator removed the security-path trigger's paths on 5 Nov, copy
// PR 560, so only the test trigger fires there). An audit of 10
// job pull requests on the copy found three judgement errors no test catches: PR 253 loosened a
// requirement-pinning test to pass its own wrong change, PR 174 deleted panel.test.mjs while
// panel.mjs stayed live, PR 95 dropped acts from REAUTH_ACTS. Each trigger is computed from the
// job's diff against its merge base alone; a job pull request that fires one merges only
// --reviewed (merge.mjs), and every merge row records what fired and what the review found.
//
// security: a change to a path the product lists in review_triggers.security_paths (its config,
//   read at the tranche; globs: ** any depth, * within one name, ? one character; a path without
//   them names a file or a directory). The product names its own files; none by default.
// test (sharpened by the coordinator, 4 Nov 19:16, from the first 6 hand reviews): a test file of the
//   module (under its entry's tests, with its suite's suffix) deleted; or, in one that existed at
//   the base, a skip added (SKIP: test|it|describe.skip|todo|only( added), or a hunk that removes an
//   assertion line (ASSERT) and adds none. A hunk that replaces assertions with others does not fire.
//   ASSERT, the fixed forms: assert(...), assert.<x>(...), expect(...), and t.<x>(...) for the
//   node:test and tap methods listed.
import { git, underPath } from './util.mjs';

export const ASSERT = /\b(?:assert|expect)(?:\.\w+)*\s*\(|\bt\.(?:assert|equal|notEqual|strictEqual|deepEqual|deepStrictEqual|same|notSame|ok|notOk|true|false|match|throws|doesNotThrow|rejects|is|not|truthy|falsy)\s*\(/;
export const SKIP = /\b(?:test|it|describe)\.(?:skip|todo|only)\s*\(/;
export const ASSERT_RULE = 'assertion lines are those matching assert(, assert.<x>(, expect(, or t.<assert|equal|notEqual|strictEqual|deepEqual|deepStrictEqual|same|notSame|ok|notOk|true|false|match|throws|doesNotThrow|rejects|is|not|truthy|falsy>(, comments aside; a test file existing at the base fires on a hunk that removes an assertion line and adds none, or on an added test.skip, test.todo, .only or it.skip';
// The hunks a review brief carries, at most this many lines; past it the brief names the command.
export const HUNK_LINES = 400;

export function globRe(g) {
  const s = String(g).replace(/^\.\//, '');
  if (!/[*?]/.test(s)) return null;
  let re = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '*' && s[i + 1] === '*') { i++; if (s[i + 1] === '/') { i++; re += '(?:.*/)?'; } else re += '.*'; }
    else if (c === '*') re += '[^/]*';
    else if (c === '?') re += '[^/]';
    else re += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${re}$`);
}
export const matchPath = (f, g) => { const re = globRe(g); return re ? re.test(f) : underPath(f, String(g).replace(/^\.\//, '')); };

// The product's security paths, from a config (loadConfig); a malformed value lists none and says so.
export function securityPaths(cfg) {
  const v = cfg?.review_triggers?.security_paths;
  if (v === undefined || v === null) return { paths: [], set: false };
  if (!Array.isArray(v) || v.some((p) => typeof p !== 'string' || !p)) return { paths: [], set: false, bad: 'review_triggers.security_paths is not a list of paths' };
  return { paths: v, set: true };
}

const isTest = (entry, f) => (entry?.tests || []).some((t) => underPath(f, String(t).replace(/^\.\//, ''))) && f.endsWith(entry?.suite?.test_suffix || '.test.mjs');
const isComment = (l) => /^\s*(?:\/\/|\/?\*)/.test(l);

// One file's -U0 diff, per hunk: removed and added assertion lines, and skips added.
// Returns { removed, added, skips, bare: hunks that remove an assertion and add none }.
export function assertCounts(diff) {
  const c = { removed: 0, added: 0, skips: 0, bare: 0 };
  let h = null;
  const end = () => { if (h && h.removed && !h.added) c.bare++; };
  for (const l of String(diff).split('\n')) {
    if (l.startsWith('---') || l.startsWith('+++')) continue;
    if (l.startsWith('@@')) { end(); h = { removed: 0, added: 0 }; continue; }
    if (l[0] !== '-' && l[0] !== '+') continue;
    const body = l.slice(1);
    if (isComment(body)) continue;
    if (l[0] === '+' && SKIP.test(body)) c.skips++;
    if (!ASSERT.test(body)) continue;
    h ||= { removed: 0, added: 0 };
    if (l[0] === '-') { c.removed++; h.removed++; } else { c.added++; h.added++; }
  }
  end();
  return c;
}

// The triggers a job's change fires: { fired: ['security'?, 'test'?], security: [files],
// deleted: [test files], loosened: [{ file, removed, added }], why, hunks (the diff text that
// fired them, for the review brief) }. base and head are revisions in root.
export function reviewTriggers(root, { base, head, entry, cfg }) {
  const sec = securityPaths(cfg);
  // -z, as every diff in the tool: git quotes a path with non-ASCII bytes otherwise (review of PR 125).
  const z = git(['diff', '--no-renames', '--name-status', '-z', base, head], { cwd: root }).split('\0');
  const status = [];
  for (let i = 0; i + 1 < z.length; i += 2) if (z[i]) status.push({ s: z[i][0], f: z[i + 1] });
  const security = status.filter((x) => sec.paths.some((g) => matchPath(x.f, g))).map((x) => x.f);
  const deleted = status.filter((x) => x.s === 'D' && isTest(entry, x.f)).map((x) => x.f);
  const loosened = [];
  const diffs = {};
  for (const x of status.filter((y) => y.s === 'M' && isTest(entry, y.f))) {
    const d = git(['diff', '--no-renames', '-U0', base, head, '--', x.f], { cwd: root });
    const c = assertCounts(d);
    if (c.bare || c.skips) { loosened.push({ file: x.f, ...c }); diffs[x.f] = d; }
  }
  const fired = [...(security.length ? ['security'] : []), ...(deleted.length || loosened.length ? ['test'] : [])];
  const why = [
    ...(security.length ? [`security paths changed: ${security.slice(0, 5).join(', ')}${security.length > 5 ? ` and ${security.length - 5} more` : ''}`] : []),
    ...(deleted.length ? [`test files deleted: ${deleted.slice(0, 5).join(', ')}`] : []),
    ...loosened.slice(0, 5).map((l) => `${l.file}: ${[l.bare ? `${l.bare} hunk${l.bare > 1 ? 's' : ''} removing assertions and adding none` : '', l.skips ? `${l.skips} skip${l.skips > 1 ? 's' : ''} added` : ''].filter(Boolean).join(', ')}`),
  ].join('; ');
  const parts = [];
  if (security.length) parts.push(git(['diff', '--no-renames', '-U3', base, head, '--', ...security], { cwd: root }));
  if (deleted.length) parts.push(git(['diff', '--no-renames', '-U0', base, head, '--', ...deleted], { cwd: root }));
  for (const l of loosened) parts.push(diffs[l.file]);
  const all = parts.join('\n').split('\n');
  const hunks = all.length > HUNK_LINES ? [...all.slice(0, HUNK_LINES), `... ${all.length - HUNK_LINES} more lines: git diff ${String(base).slice(0, 10)} ${head} -- ${[...security, ...deleted, ...loosened.map((l) => l.file)].join(' ')}`].join('\n') : all.join('\n');
  return { fired, security, deleted, loosened, why, hunks, ...(sec.bad ? { bad: sec.bad } : {}), security_set: sec.set };
}

const num = (x) => typeof x === 'number' && Number.isFinite(x);
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const r2 = (x) => Math.round(x * 100) / 100;

// The one report line (metrics report, report tranche), from merge rows, each pull request once.
// rejudged: the triggers rows a land wrote beside a merge row prepared under an older pin, or one
// whose triggers changed by the land (merge.mjs); the latest for a pull request is read over its row.
export function triggerSummary(merges, rejudged = []) {
  const later = new Map([...rejudged].filter((r) => r?.row === 'triggers' && Array.isArray(r.triggers)).sort((a, b) => String(a.at).localeCompare(String(b.at))).map((r) => [String(r.pr), r]));
  const rows = [...new Map(merges.map((r) => [String(r.pr), r])).values()].map((r) => (later.has(String(r.pr)) ? { ...r, triggers: later.get(String(r.pr)).triggers } : r));
  const rec = rows.filter((r) => Array.isArray(r.triggers));
  const kind = (k) => rec.filter((r) => r.triggers.includes(k)).length;
  const fired = rec.filter((r) => r.triggers.length).length;
  const reviews = rec.filter((r) => r.reviewed === true);
  const counted = reviews.filter((r) => num(r.findings));
  const findings = counted.reduce((t, r) => t + r.findings, 0);
  const acted = counted.reduce((t, r) => t + (num(r.findings_acted) ? r.findings_acted : 0), 0);
  const mins = reviews.map((r) => r.review_minutes).filter(num);
  const costs = reviews.map((r) => r.review_usd).filter(num);
  const s = {
    merged: rows.length,
    recorded: rec.length,
    triggered: fired,
    security: kind('security'),
    test: kind('test'),
    share: rec.length ? r2(fired / rec.length) : null,
    reviews: reviews.length,
    findings_per_review: counted.length ? r2(findings / counted.length) : null,
    findings_acted: acted,
    added_minutes_median: mins.length ? median(mins) : null,
    added_minutes_worst: mins.length ? Math.max(...mins) : null,
    review_usd: costs.length ? r2(costs.reduce((t, x) => t + x, 0)) : null,
    review_usd_unmeasured: reviews.length - costs.length,
  };
  const U = 'unmeasured';
  s.line = `review triggers: ${s.merged} job PRs merged${rec.length < rows.length ? ` (${rows.length - rec.length} before triggers were recorded)` : ''}; triggered ${fired} of ${rec.length}${s.share === null ? '' : ` (${Math.round(s.share * 100)}%)`}: security ${s.security}, test ${s.test}; reviews run ${s.reviews}; findings per review ${s.findings_per_review ?? U}; findings acted on ${acted}; added minutes to merge median ${s.added_minutes_median ?? U}, worst ${s.added_minutes_worst ?? U}; review cost ${s.review_usd === null ? U : `$${s.review_usd.toFixed(2)}`}${s.review_usd_unmeasured && costs.length ? ` (${s.review_usd_unmeasured} unmeasured)` : ''}`;
  return s;
}

// ===== file: github.mjs =====

// GitHub acts and reads, all through gh (platform rows 13, 14). Every remote act is recorded
// only from its result (REC-5): callers use the returned objects, never their own intent.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fail, gh, ghRun, git, isShallow, run, withTemp } from './util.mjs';
import { commonDir } from './pace.mjs';

export const GATE = 'p3:gate';
// A reviewed revert exemption on a job's pull request (AUD-1, JOB-12; gate.mjs revertExemption).
export const REVERT_EXEMPT = 'p3:revert-exempt';

// A machine-readable comment: an HTML marker and one fenced JSON block.
export const block = (marker, data, lead = '') =>
  `<!-- ${marker} -->\n${lead}${lead ? '\n\n' : ''}\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\`\n`;

export function parseBlock(body, marker) {
  if (!body || !body.includes(`<!-- ${marker} -->`)) return null;
  const m = body.match(/```json\n([\s\S]*?)\n```/);
  if (!m) return null;
  try { return JSON.parse(m[1]); } catch { return null; }
}

export function findPR(slug, head, { state = 'open' } = {}) {
  const owner = slug.split('/')[0];
  const prs = gh(['api', `repos/${slug}/pulls?state=${state}&head=${owner}:${encodeURIComponent(head)}&per_page=10`]) || [];
  return prs[0] || null;
}

export const getPR = (slug, n) => gh(['api', `repos/${slug}/pulls/${n}`]);

export function openPRs(slug, base) {
  const pages = gh(['api', '--paginate', '--slurp', `repos/${slug}/pulls?state=open&base=${encodeURIComponent(base)}&per_page=100`], { allowFail: true });
  return Array.isArray(pages) ? pages.flat() : null;
}

// Every pull request, open, closed or merged, whose head is this repository's branch; null when
// unreadable. Pull requests cannot be deleted, so this is every PR a run on the branch could be.
export function prsFromBranch(slug, branch, { read = (args) => gh(args, { allowFail: true }) } = {}) {
  const owner = String(slug).split('/')[0];
  const pages = read(['api', '--paginate', '--slurp', `repos/${slug}/pulls?state=all&head=${encodeURIComponent(`${owner}:${branch}`)}&per_page=100`]);
  return Array.isArray(pages) ? pages.flat() : null;
}

export function createPR(slug, { head, base, title, body, draft = true }) {
  const pr = gh(['api', '-X', 'POST', `repos/${slug}/pulls`, '--input', '-'], {
    input: JSON.stringify({ head, base, title, body, draft }),
  });
  if (!pr?.number) fail('GitHub did not return a pull request');
  return pr;
}

// job start --take-in: a taken-in pull request moved to the tranche (PATCH base) and made a
// draft. GitHub's REST API has no way back to draft and GraphQL, which has, is not reachable from
// Claude Code sessions (copy, 4 Nov: site's attempt 2 stopped on it before its push); their proxy
// names a REST route for it, tried first. Anywhere else the GraphQL mutation is the route.
export function editPR(slug, n, fields) {
  const pr = gh(['api', '-X', 'PATCH', `repos/${slug}/pulls/${n}`, '--input', '-'], { input: JSON.stringify(fields) });
  if (!pr?.number) fail(`GitHub did not return pull request ${n} after the edit`);
  return pr;
}
export function toDraft(slug, pr, { call = (args) => ghRun(args), read = getPR } = {}) {
  const tried = [
    ['api', '-X', 'POST', `repos/${slug}/pulls/${pr.number}/ccr/convert_to_draft`],
    ['api', 'graphql', '-f', 'query=mutation($id: ID!) { convertPullRequestToDraft(input: {pullRequestId: $id}) { pullRequest { isDraft } } }', '-f', `id=${pr.node_id}`],
  ];
  const errors = [];
  for (const args of tried) {
    const r = call(args);
    if (r.code === 0) break;
    errors.push(`gh ${args.slice(0, 3).join(' ')}: ${(r.stderr || r.stdout || '').trim().split('\n')[0]}`);
  }
  if (errors.length === tried.length) fail(`could not make pull request ${pr.number} a draft: ${errors.join('; ')}`);
  const now = read(slug, pr.number);
  if (!now?.draft) fail(`pull request ${pr.number} is still not a draft`);
  return now;
}

const commentsArgs = (slug, n) => ['api', '--paginate', '--slurp', `repos/${slug}/issues/${n}/comments?per_page=100`];
export function comments(slug, n) {
  const pages = gh(commentsArgs(slug, n));
  return Array.isArray(pages) ? pages.flat() : [];
}
// A pull request's comments kept in the clone (C18, 7 Nov: status --role bob re-read every PR merged
// since the tranche opened, ~260 requests a call, for gate rows that no longer change): served
// while ttlMs old, for every p3 process of the clone. The caller says how long: a merged PR's for
// hours, an open one's for seconds. A failed read is never kept.
// A read kept in the clone's git directory for ttlMs (ttl(value) may give a value its own), for
// every p3 process of the clone; a failed read (null, undefined) is never kept.
export function keptRead(root, key, ttl, read, { now = Date.now } = {}) {
  const dir = join(commonDir(root), 'p3-gh-cache');
  const f = join(dir, `${String(key).replace(/[^\w.-]/g, '_').slice(0, 180)}.json`);
  try { const c = JSON.parse(readFileSync(f, 'utf8')); if (c.at <= now() && now() - c.at < c.ttl) return c.value; } catch { /* not kept */ }
  const value = read();
  if (value !== null && value !== undefined) { try { mkdirSync(dir, { recursive: true }); writeFileSync(f, JSON.stringify({ at: now(), ttl: typeof ttl === 'function' ? ttl(value) : ttl, value })); } catch { /* a saving */ } }
  return value;
}
// GitHub's compare kept 5 min for a commit (a status run takes over 2), 30 s for a branch name
// (its tip moves: a job's ahead count, cold review of C18); a commit found on its base (ahead_by 0, base main) for a day: main
// never moves back (C18: status read every closed layer's commit against main on every call).
export const keptCompare = (root) => (slug, base, head) => keptRead(root, `compare-${slug}-${base}-${head}`, (c) => (base === 'main' && c?.ahead_by === 0 && /^[0-9a-f]{40}$/.test(String(head)) ? 24 * 3600e3 : /^[0-9a-f]{7,40}$/.test(String(head)) ? 300e3 : 30e3), () => compare(slug, base, head));
export const COMMENTS_MERGED_MS = 6 * 3600e3;
export const COMMENTS_OPEN_MS = 30e3;
export function cachedComments(root, slug, n, { ttlMs = COMMENTS_OPEN_MS, now = Date.now, read = comments } = {}) {
  const got = keptRead(root, `comments-${slug}-${Number(n)}`, ttlMs, () => { const c = read(slug, n); return Array.isArray(c) ? c : null; }, { now });
  return got;
}

export function addComment(slug, n, body) {
  const c = gh(['api', '-X', 'POST', `repos/${slug}/issues/${n}/comments`, '--input', '-'], { input: JSON.stringify({ body }) });
  if (!c?.id) fail('GitHub did not return the comment');
  return c;
}

export function editComment(slug, id, body) {
  return gh(['api', '-X', 'PATCH', `repos/${slug}/issues/comments/${id}`, '--input', '-'], { input: JSON.stringify({ body }) });
}

// The newest comment carrying a marker, with its parsed block. With `from`, only comments
// written by that account count.
export function latestBlock(slug, n, marker, all = comments(slug, n), { from } = {}) {
  for (const c of [...all].reverse()) {
    if (from !== undefined && (!from || c.user?.login !== from)) continue;
    const data = parseBlock(c.body, marker);
    if (data) return { comment: c, data };
  }
  return null;
}


// Gate runs, each its own comment written by GitHub Actions and never edited since. A session
// can post a comment that looks like one, or (as the owner) edit one, so only the bot's
// unedited comments count.
export const BOT = 'github-actions[bot]';
export function gateRuns(all) {
  return all
    .filter((c) => c.user?.login === BOT && (!c.updated_at || c.updated_at === c.created_at))
    .flatMap((c) => parseBlock(c.body, GATE)?.runs || []);
}


// Uller sent word of 5 zircons on hand.

// A gate row is trusted only when its Actions run is the process gate on the row's commit,
// finished green or red as the row says, and the run's own artifact holds the same row: a
// side workflow can post a bot comment, but it cannot upload into another workflow's run.
export const GATE_WORKFLOW = '.github/workflows/process-gate.yml';
export const getRun = (slug, id) => gh(['api', `repos/${slug}/actions/runs/${id}`], { allowFail: true });
// Whether GitHub serves a run: 'served', 'gone' (404: a run the suspended account triggered is hidden
// with its pull requests, copy run 42277392893, 7 Nov), or null for any other failure (unread: the
// caller fails closed).
// Gone only when GitHub itself answers 404 Not Found for the run while it serves the repository (not a
// proxy's or a host's error, not a token that cannot see the repository: cold review).
const notFound = (r) => /\(HTTP 404\)/.test(r.stderr || '') && /"message"\s*:\s*"Not Found"/.test(`${r.stdout || ''}${r.stderr || ''}`);
export function runState(slug, id, { run = ghRun } = {}) {
  const r = run(['api', `repos/${slug}/actions/runs/${id}`]);
  if (r.code === 0) return 'served';
  if (!notFound(r)) return null;
  return run(['api', `repos/${slug}`]).code === 0 ? 'gone' : null;
}
// Whether GitHub definitively says pull request n does not exist in slug (PD-18, notice withdraw):
// { missing: true, status } only when the pulls endpoint answers GitHub's own 404 Not Found, the
// repository itself is served (a wrong slug or a token that cannot see it 404s every PR), and the
// issues endpoint agrees: a 404 or 410 there (no such number), or an issue with no pull_request
// (the number is an issue, not a PR). Any other answer, a network error, a 5xx, a rate limit or a
// 403 included, is { missing: false, unread } and the caller fails closed; a served PR is { pr }.
export function prPresence(slug, n, { run = ghRun } = {}) {
  const pulls = run(['api', `repos/${slug}/pulls/${n}`]);
  if (pulls.code === 0) { try { return { missing: false, pr: JSON.parse(pulls.stdout) }; } catch { return { missing: false, unread: 'the pull request could not be parsed' }; } }
  const said = (r) => (r.stderr || r.stdout || '').trim().split('\n')[0].slice(0, 200);
  if (!notFound(pulls)) return { missing: false, unread: said(pulls) || `exit ${pulls.code}` };
  const repo = run(['api', `repos/${slug}`]);
  if (repo.code !== 0) return { missing: false, unread: `GitHub did not serve ${slug} itself: ${said(repo)}` };
  // The repository GitHub served is the one asked for (cold review of C48: a renamed or moved
  // repository answers for another name, and a 404 there says nothing of the slug's own PRs).
  let full = null;
  try { full = JSON.parse(repo.stdout)?.full_name; } catch { /* unread below */ }
  if (typeof full !== 'string' || full.toLowerCase() !== String(slug).toLowerCase()) return { missing: false, unread: `GitHub served ${full || 'an unreadable repository'} for ${slug}` };
  const issue = run(['api', `repos/${slug}/issues/${n}`]);
  if (issue.code === 0) {
    let body = null;
    try { body = JSON.parse(issue.stdout); } catch { return { missing: false, unread: `issue ${n} could not be parsed` }; }
    if (!body || typeof body !== 'object' || Number(body.number) !== Number(n)) return { missing: false, unread: `issue ${n} read as another number` };
    if (body.pull_request) return { missing: false, unread: `GitHub serves ${n} as a pull request on its issues endpoint but 404s its pulls endpoint` };
    return { missing: true, status: `404, ${n} is an issue` };
  }
  if (notFound(issue)) return { missing: true, status: '404' };
  if (/\(HTTP 410\)/.test(issue.stderr || '')) return { missing: true, status: '404, issue 410 Gone' };
  return { missing: false, unread: said(issue) || `exit ${issue.code}` };
}
export function runArtifactRow(slug, id) {
  return withTemp('p3-row-', (dir) => {
    try {
      if (gh(['run', 'download', String(id), '-R', slug, '-n', 'gate-row', '-D', dir], { allowFail: true }) === null && !existsSync(join(dir, 'gate.json'))) return null;
      return JSON.parse(readFileSync(join(dir, 'gate.json'), 'utf8')).run || null;
    } catch { return null; }
  });
}
// scope and after too: the tranche cover trusts a row for the module it ran and the run it stood on.
// refresh too: merge --plain trusts a row's regenerate comparison (copy PR 148).
// base_red too: the tranche cover and a spec-tested land read whether a suite was base-red.
// tree, spec and spec_* too: a spec-tested fast path and the tranche cover trust a spec row for the
// tree it tested and the job it judged, and a spec-tested row for the spec run it names (train-spec).
const SAME = ['sha', 'base', 'trigger', 'ok', 'attempt', 'suite', 'revert', 'scope', 'after', 'refresh', 'base_red', 'tree', 'spec', 'spec_pr', 'spec_run', 'spec_sha'];
export function verifyRow(slug, row, { pr, baseRef, merged }, io = { getRun, runArtifactRow }) {
  if (!row?.run_id) return false;
  const a = io.getRun(slug, row.run_id);
  if (!a || a.path !== GATE_WORKFLOW || a.head_sha !== row.sha || a.status !== 'completed') return false;
  // The run must be this pull request's own, into the tranche: not a second PR on the same
  // commit into a branch that carries a workflow of its own.
  // (Every pull request GitHub lists for the run must be into the tranche, in case it lists
  // all open PRs that share the head branch.)
  // Once the pull request merges, GitHub lists none on its runs (measured on the copy 4 Nov:
  // registers PR 86, run 41778833434; site PR 79, run 41779185745). A merged job PR's run is
